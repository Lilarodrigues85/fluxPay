import { startOfMonth, endOfMonth, subMonths } from 'date-fns'
import type { Transaction, Expense, Savings, Budget, NetWorthSnapshot } from '../types'
import { getMonthRange } from './dates'

// ============================================================================
// Comparativo mês atual vs anterior
// ============================================================================

export interface MonthComparison {
  payable: { current: number; previous: number; delta: number; deltaPct: number }
  receivable: { current: number; previous: number; delta: number; deltaPct: number }
  expenses: { current: number; previous: number; delta: number; deltaPct: number }
  balance: { current: number; previous: number; delta: number; deltaPct: number }
}

function rangeForMonthOffset(offset: number, startDay: number) {
  if (startDay <= 1) {
    const ref = subMonths(new Date(), offset)
    return {
      start: startOfMonth(ref).getTime(),
      end: endOfMonth(ref).getTime(),
    }
  }
  // Janela personalizada deslocada por N meses
  const today = new Date()
  const day = today.getDate()
  const baseStart = day >= startDay
    ? new Date(today.getFullYear(), today.getMonth(), startDay, 0, 0, 0, 0)
    : new Date(today.getFullYear(), today.getMonth() - 1, startDay, 0, 0, 0, 0)
  const start = new Date(baseStart)
  start.setMonth(start.getMonth() - offset)
  const end = new Date(start)
  end.setMonth(end.getMonth() + 1)
  end.setMilliseconds(-1)
  return { start: start.getTime(), end: end.getTime() }
}

function pctChange(curr: number, prev: number): number {
  if (prev === 0) return curr > 0 ? 100 : 0
  return ((curr - prev) / Math.abs(prev)) * 100
}

export function computeMonthComparison(
  transactions: Transaction[],
  expenses: Expense[],
  startDay: number
): MonthComparison {
  const curr = rangeForMonthOffset(0, startDay)
  const prev = rangeForMonthOffset(1, startDay)

  const sumTx = (rng: { start: number; end: number }, type: 'payable' | 'receivable') =>
    transactions
      .filter((t) => t.type === type && t.dueDate >= rng.start && t.dueDate <= rng.end)
      .reduce((s, t) => s + t.amount, 0)

  const sumExp = (rng: { start: number; end: number }) =>
    expenses
      .filter((e) => e.date >= rng.start && e.date <= rng.end)
      .reduce((s, e) => s + e.amount, 0)

  const payCurr = sumTx(curr, 'payable')
  const payPrev = sumTx(prev, 'payable')
  const recCurr = sumTx(curr, 'receivable')
  const recPrev = sumTx(prev, 'receivable')
  const expCurr = sumExp(curr)
  const expPrev = sumExp(prev)
  const balCurr = recCurr - payCurr - expCurr
  const balPrev = recPrev - payPrev - expPrev

  return {
    payable:    { current: payCurr, previous: payPrev, delta: payCurr - payPrev, deltaPct: pctChange(payCurr, payPrev) },
    receivable: { current: recCurr, previous: recPrev, delta: recCurr - recPrev, deltaPct: pctChange(recCurr, recPrev) },
    expenses:   { current: expCurr, previous: expPrev, delta: expCurr - expPrev, deltaPct: pctChange(expCurr, expPrev) },
    balance:    { current: balCurr, previous: balPrev, delta: balCurr - balPrev, deltaPct: pctChange(balCurr, balPrev) },
  }
}

// ============================================================================
// Top 5 maiores gastos do mês
// ============================================================================

export interface TopExpenseEntry {
  id: string
  description: string
  amount: number
  date: number
  category: string
  source: 'expense' | 'payable'
}

export function computeTopExpenses(
  transactions: Transaction[],
  expenses: Expense[],
  startDay: number,
  limit = 5
): TopExpenseEntry[] {
  const { start, end } = getMonthRange(new Date(), startDay)
  const items: TopExpenseEntry[] = []

  for (const e of expenses) {
    if (e.date >= start && e.date <= end) {
      items.push({ id: e.id, description: e.description, amount: e.amount, date: e.date, category: e.category, source: 'expense' })
    }
  }
  for (const t of transactions) {
    if (t.type === 'payable' && t.dueDate >= start && t.dueDate <= end) {
      items.push({ id: t.id, description: t.description, amount: t.amount, date: t.dueDate, category: t.category, source: 'payable' })
    }
  }

  return items.sort((a, b) => b.amount - a.amount).slice(0, limit)
}

// ============================================================================
// Top categoria por gasto do mês
// ============================================================================

export interface CategoryTotal {
  category: string
  total: number
  pct: number
}

export function computeCategoryRanking(
  transactions: Transaction[],
  expenses: Expense[],
  startDay: number
): CategoryTotal[] {
  const { start, end } = getMonthRange(new Date(), startDay)
  const map = new Map<string, number>()

  for (const e of expenses) {
    if (e.date >= start && e.date <= end) {
      map.set(e.category, (map.get(e.category) || 0) + e.amount)
    }
  }
  for (const t of transactions) {
    if (t.type === 'payable' && t.dueDate >= start && t.dueDate <= end) {
      map.set(t.category, (map.get(t.category) || 0) + t.amount)
    }
  }

  const entries = Array.from(map.entries())
  const total = entries.reduce((s, [, v]) => s + v, 0)
  return entries
    .map(([category, value]) => ({ category, total: value, pct: total > 0 ? (value / total) * 100 : 0 }))
    .sort((a, b) => b.total - a.total)
}

// ============================================================================
// Score de saúde financeira (0-100)
// ============================================================================

export interface HealthBreakdown {
  label: string
  description: string
  earned: number
  max: number
}

export interface HealthScore {
  score: number              // 0-100
  classification: 'critical' | 'warning' | 'good' | 'excellent'
  classificationLabel: string
  breakdown: HealthBreakdown[]
}

export function computeHealthScore(
  transactions: Transaction[],
  expenses: Expense[],
  savings: Savings[],
  budgets: Budget[],
  snapshots: NetWorthSnapshot[],
  startDay: number
): HealthScore {
  const breakdown: HealthBreakdown[] = []

  // 1. Reserva de emergência (25 pts) — investido cobre quantos meses de gasto médio
  const recentExp = expenses.filter((e) => e.date >= Date.now() - 90 * 24 * 60 * 60 * 1000)
  const avgMonthlyExpense = recentExp.length > 0 ? (recentExp.reduce((s, e) => s + e.amount, 0) / 3) : 0
  const invested = savings.filter((s) => s.type !== 'checking').reduce((s, x) => s + x.amount, 0)
  const monthsCovered = avgMonthlyExpense > 0 ? invested / avgMonthlyExpense : (invested > 0 ? 99 : 0)
  let reserveEarned = 0
  if (monthsCovered >= 6) reserveEarned = 25
  else if (monthsCovered >= 3) reserveEarned = 20
  else if (monthsCovered >= 2) reserveEarned = 12
  else if (monthsCovered >= 1) reserveEarned = 6
  breakdown.push({
    label: 'Reserva de emergência',
    description: avgMonthlyExpense > 0
      ? `Sua reserva cobre ${monthsCovered.toFixed(1)} meses de gastos`
      : 'Cadastre seus gastos pra calcular',
    earned: reserveEarned,
    max: 25,
  })

  // 2. Saldo do mês (20 pts) — receita - despesa - gastos
  const { start, end } = getMonthRange(new Date(), startDay)
  const recMonth = transactions
    .filter((t) => t.type === 'receivable' && t.dueDate >= start && t.dueDate <= end)
    .reduce((s, t) => s + t.amount, 0)
  const payMonth = transactions
    .filter((t) => t.type === 'payable' && t.dueDate >= start && t.dueDate <= end)
    .reduce((s, t) => s + t.amount, 0)
  const expMonth = expenses
    .filter((e) => e.date >= start && e.date <= end)
    .reduce((s, e) => s + e.amount, 0)
  const balance = recMonth - payMonth - expMonth
  let balanceEarned = 0
  if (balance > 0 && recMonth > 0) {
    const ratio = balance / recMonth
    if (ratio >= 0.2) balanceEarned = 20
    else if (ratio >= 0.1) balanceEarned = 14
    else balanceEarned = 8
  } else if (balance === 0) balanceEarned = 5
  breakdown.push({
    label: 'Saldo do mês',
    description: balance >= 0
      ? `Sobra de R$ ${balance.toFixed(2)} este mês`
      : `Déficit de R$ ${Math.abs(balance).toFixed(2)} este mês`,
    earned: balanceEarned,
    max: 20,
  })

  // 3. Vencidas (15 pts)
  const overdueCount = transactions.filter((t) => t.status === 'overdue').length
  let overdueEarned = 0
  if (overdueCount === 0) overdueEarned = 15
  else if (overdueCount <= 2) overdueEarned = 8
  else overdueEarned = 0
  breakdown.push({
    label: 'Pagamentos em dia',
    description: overdueCount === 0 ? 'Sem contas vencidas' : `${overdueCount} conta(s) vencida(s)`,
    earned: overdueEarned,
    max: 15,
  })

  // 4. Orçamentos (20 pts)
  let budgetsEarned = 10 // neutro se não tem
  let budgetDesc = 'Sem orçamentos cadastrados'
  if (budgets.length > 0) {
    let safe = 0
    let warn = 0
    let over = 0
    for (const b of budgets) {
      let spent = 0
      if (b.scope === 'expense' || b.scope === 'all') {
        for (const e of expenses) {
          if (e.category === b.category && e.date >= start && e.date <= end) spent += e.amount
        }
      }
      if (b.scope === 'payable' || b.scope === 'all') {
        for (const t of transactions) {
          if (t.type === 'payable' && t.category === b.category && t.dueDate >= start && t.dueDate <= end) {
            spent += t.amount
          }
        }
      }
      const pct = b.monthlyLimit > 0 ? (spent / b.monthlyLimit) * 100 : 0
      if (pct >= 100) over++
      else if (pct >= 70) warn++
      else safe++
    }
    const totalBudgets = budgets.length
    const safePct = (safe / totalBudgets) * 100
    if (over === 0 && safePct === 100) budgetsEarned = 20
    else if (over === 0) budgetsEarned = 16
    else if (over <= totalBudgets * 0.3) budgetsEarned = 10
    else budgetsEarned = 4
    budgetDesc = `${safe}/${totalBudgets} orçamentos no verde`
  }
  breakdown.push({
    label: 'Orçamentos',
    description: budgetDesc,
    earned: budgetsEarned,
    max: 20,
  })

  // 5. Tendência do patrimônio (20 pts) — usa snapshots
  let trendEarned = 10
  let trendDesc = 'Histórico de patrimônio insuficiente'
  if (snapshots.length >= 2) {
    const last = snapshots[snapshots.length - 1].invested
    const prev = snapshots[snapshots.length - 2].invested
    const delta = last - prev
    if (delta > 0) {
      trendEarned = 20
      trendDesc = `Patrimônio cresceu R$ ${delta.toFixed(2)} no mês`
    } else if (delta === 0) {
      trendEarned = 12
      trendDesc = 'Patrimônio estável'
    } else {
      trendEarned = 4
      trendDesc = `Patrimônio reduziu R$ ${Math.abs(delta).toFixed(2)}`
    }
  } else if (invested > 0) {
    trendEarned = 14
    trendDesc = 'Você já tem patrimônio. Continue por mais meses pra avaliar tendência.'
  }
  breakdown.push({
    label: 'Tendência do patrimônio',
    description: trendDesc,
    earned: trendEarned,
    max: 20,
  })

  const score = breakdown.reduce((s, b) => s + b.earned, 0)
  let classification: HealthScore['classification']
  let classificationLabel: string
  if (score >= 81) { classification = 'excellent'; classificationLabel = 'Excelente' }
  else if (score >= 61) { classification = 'good'; classificationLabel = 'Bom' }
  else if (score >= 31) { classification = 'warning'; classificationLabel = 'Atenção' }
  else { classification = 'critical'; classificationLabel = 'Crítico' }

  return { score, classification, classificationLabel, breakdown }
}

// ============================================================================
// Sugestões baseadas em padrões
// ============================================================================

export interface Suggestion {
  type: 'positive' | 'warning' | 'critical' | 'info'
  icon: string
  title: string
  detail: string
}

export function computeSuggestions(
  transactions: Transaction[],
  expenses: Expense[],
  budgets: Budget[],
  comparison: MonthComparison,
  ranking: CategoryTotal[],
  health: HealthScore,
  startDay: number
): Suggestion[] {
  const out: Suggestion[] = []

  // Categoria que mais cresceu
  const { start, end } = getMonthRange(new Date(), startDay)
  const prevRange = rangeForMonthOffset(1, startDay)
  const sumByCatAt = (rng: { start: number; end: number }) => {
    const map = new Map<string, number>()
    for (const e of expenses) {
      if (e.date >= rng.start && e.date <= rng.end) {
        map.set(e.category, (map.get(e.category) || 0) + e.amount)
      }
    }
    for (const t of transactions) {
      if (t.type === 'payable' && t.dueDate >= rng.start && t.dueDate <= rng.end) {
        map.set(t.category, (map.get(t.category) || 0) + t.amount)
      }
    }
    return map
  }
  const currMap = sumByCatAt({ start, end })
  const prevMap = sumByCatAt(prevRange)

  let biggestRise: { category: string; pct: number; current: number } | null = null
  for (const [cat, curr] of currMap) {
    const prev = prevMap.get(cat) || 0
    if (prev <= 0 && curr > 100) {
      // categoria nova com gasto significativo
      if (!biggestRise || curr > biggestRise.current) {
        biggestRise = { category: cat, pct: 100, current: curr }
      }
    } else if (prev > 0) {
      const change = ((curr - prev) / prev) * 100
      if (change >= 25 && (!biggestRise || change > biggestRise.pct)) {
        biggestRise = { category: cat, pct: change, current: curr }
      }
    }
  }
  if (biggestRise) {
    out.push({
      type: 'warning',
      icon: 'mdi-trending-up',
      title: `${biggestRise.category} disparou`,
      detail: biggestRise.pct >= 100
        ? `R$ ${biggestRise.current.toFixed(2)} este mês — mais que o dobro do mês passado`
        : `Aumento de ${biggestRise.pct.toFixed(0)}% vs mês passado (R$ ${biggestRise.current.toFixed(2)})`,
    })
  }

  // Top categoria
  if (ranking.length > 0 && ranking[0].pct >= 30) {
    out.push({
      type: 'info',
      icon: 'mdi-chart-pie',
      title: `Maior fatia: ${ranking[0].category}`,
      detail: `${ranking[0].pct.toFixed(0)}% dos seus gastos do mês (R$ ${ranking[0].total.toFixed(2)})`,
    })
  }

  // Orçamentos estourados
  let overBudgetCount = 0
  let firstOverName = ''
  let firstOverDelta = 0
  for (const b of budgets) {
    let spent = 0
    if (b.scope === 'expense' || b.scope === 'all') {
      spent += expenses.filter((e) => e.category === b.category && e.date >= start && e.date <= end)
        .reduce((s, e) => s + e.amount, 0)
    }
    if (b.scope === 'payable' || b.scope === 'all') {
      spent += transactions.filter((t) => t.type === 'payable' && t.category === b.category && t.dueDate >= start && t.dueDate <= end)
        .reduce((s, t) => s + t.amount, 0)
    }
    if (spent > b.monthlyLimit) {
      if (overBudgetCount === 0) {
        firstOverName = b.category
        firstOverDelta = spent - b.monthlyLimit
      }
      overBudgetCount++
    }
  }
  if (overBudgetCount > 0) {
    out.push({
      type: 'critical',
      icon: 'mdi-alert-octagon',
      title: overBudgetCount === 1 ? `Orçamento de ${firstOverName} estourado` : `${overBudgetCount} orçamentos estourados`,
      detail: overBudgetCount === 1
        ? `R$ ${firstOverDelta.toFixed(2)} acima do limite mensal`
        : `Comece pelo de ${firstOverName} (R$ ${firstOverDelta.toFixed(2)} acima)`,
    })
  }

  // Comparativo de gastos
  if (comparison.expenses.deltaPct <= -10 && comparison.expenses.previous > 0) {
    out.push({
      type: 'positive',
      icon: 'mdi-check-circle',
      title: 'Você está gastando menos',
      detail: `Gastos avulsos caíram ${Math.abs(comparison.expenses.deltaPct).toFixed(0)}% vs mês passado`,
    })
  } else if (comparison.expenses.deltaPct >= 30 && comparison.expenses.previous > 0) {
    out.push({
      type: 'warning',
      icon: 'mdi-trending-up',
      title: 'Gastos avulsos subiram',
      detail: `+${comparison.expenses.deltaPct.toFixed(0)}% vs mês passado (R$ ${comparison.expenses.delta.toFixed(2)} a mais)`,
    })
  }

  // Saldo negativo
  if (comparison.balance.current < 0) {
    out.push({
      type: 'critical',
      icon: 'mdi-trending-down',
      title: 'Saldo do mês negativo',
      detail: `Você está R$ ${Math.abs(comparison.balance.current).toFixed(2)} no vermelho neste mês`,
    })
  }

  // Reserva
  if (health.breakdown[0].earned < 12) {
    out.push({
      type: 'info',
      icon: 'mdi-shield-alert-outline',
      title: 'Construa sua reserva',
      detail: 'Recomendado ter pelo menos 3 meses de gastos guardados em aplicações líquidas',
    })
  }

  if (out.length === 0) {
    out.push({
      type: 'positive',
      icon: 'mdi-check-decagram',
      title: 'Está tudo sob controle',
      detail: 'Sem alertas relevantes este mês. Continue assim!',
    })
  }

  return out
}
