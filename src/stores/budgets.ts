import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Unsubscribe } from 'firebase/firestore'
import {
  subscribeBudgets,
  createBudget as createBg,
  updateBudget as updateBg,
  deleteBudget as deleteBg,
} from '../services/budgets.service'
import { useTransactionsStore } from './transactions'
import { useExpensesStore } from './expenses'
import { usePreferencesStore } from './preferences'
import { getMonthRange } from '../utils/dates'
import type { Budget } from '../types'

export interface BudgetWithUsage {
  budget: Budget
  spent: number
  remaining: number
  percent: number  // 0-100+ (pode passar 100)
  status: 'safe' | 'warn' | 'over'  // 0-70%, 70-100%, >100%
}

export const useBudgetsStore = defineStore('budgets', () => {
  const items = ref<Budget[]>([])
  const isLoading = ref(false)
  let unsubscribe: Unsubscribe | null = null

  const budgetsWithUsage = computed<BudgetWithUsage[]>(() => {
    const txStore = useTransactionsStore()
    const expensesStore = useExpensesStore()
    const prefs = usePreferencesStore()
    const { start, end } = getMonthRange(new Date(), prefs.monthStartDay)

    return items.value.map((budget) => {
      let spent = 0

      if (budget.scope === 'expense' || budget.scope === 'all') {
        for (const e of expensesStore.items) {
          if (e.category === budget.category && e.date >= start && e.date <= end) {
            spent += e.amount
          }
        }
      }
      if (budget.scope === 'payable' || budget.scope === 'all') {
        for (const t of txStore.transactions) {
          if (t.type === 'payable' && t.category === budget.category && t.dueDate >= start && t.dueDate <= end) {
            spent += t.amount
          }
        }
      }

      const percent = budget.monthlyLimit > 0 ? (spent / budget.monthlyLimit) * 100 : 0
      const remaining = budget.monthlyLimit - spent
      const status: BudgetWithUsage['status'] = percent >= 100 ? 'over' : percent >= 70 ? 'warn' : 'safe'
      return { budget, spent, remaining, percent, status }
    })
  })

  const overBudget = computed(() => budgetsWithUsage.value.filter((b) => b.status === 'over'))
  const warningBudget = computed(() => budgetsWithUsage.value.filter((b) => b.status === 'warn'))

  // Verifica se um lançamento ultrapassa algum orçamento (usado em alertas pré-save)
  function checkLimit(category: string, scope: 'expense' | 'payable', amount: number): BudgetWithUsage | null {
    for (const bu of budgetsWithUsage.value) {
      const b = bu.budget
      if (b.category !== category) continue
      if (b.scope !== scope && b.scope !== 'all') continue
      const newSpent = bu.spent + amount
      if (newSpent > b.monthlyLimit) {
        return { ...bu, spent: newSpent, percent: (newSpent / b.monthlyLimit) * 100, status: 'over' }
      }
    }
    return null
  }

  const subscribe = (userId: string) => {
    if (unsubscribe) unsubscribe()
    isLoading.value = true
    unsubscribe = subscribeBudgets(userId, (data) => {
      items.value = data
      isLoading.value = false
    })
  }

  const unsubscribeAll = () => {
    if (unsubscribe) {
      unsubscribe()
      unsubscribe = null
    }
    items.value = []
  }

  const create = (userId: string, data: Omit<Budget, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) =>
    createBg(userId, data)

  const update = (userId: string, id: string, data: Partial<Budget>) =>
    updateBg(userId, id, data)

  const remove = (userId: string, id: string) => deleteBg(userId, id)

  return {
    items,
    isLoading,
    budgetsWithUsage,
    overBudget,
    warningBudget,
    checkLimit,
    subscribe,
    unsubscribeAll,
    create,
    update,
    remove,
  }
})
