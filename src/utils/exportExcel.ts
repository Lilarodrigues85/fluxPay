import ExcelJS from 'exceljs'
import { format } from 'date-fns'
import type { Transaction, Expense, Savings, Project } from '../types'
import { savingsTypeMeta } from './savings'

// ============================================================================
// Period helpers
// ============================================================================

export interface Period {
  start: number | null
  end: number | null
}

export function filterByPeriod<T>(items: T[], getDate: (item: T) => number, period: Period | null): T[] {
  if (!period || (period.start === null && period.end === null)) return items
  return items.filter((item) => {
    const d = getDate(item)
    if (period.start !== null && d < period.start) return false
    if (period.end !== null && d > period.end) return false
    return true
  })
}

// ============================================================================
// XLSX helpers
// ============================================================================

const HEADER_STYLE: Partial<ExcelJS.Style> = {
  font: { bold: true, color: { argb: 'FFFFFFFF' }, name: 'Calibri', size: 11 },
  fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2D2E47' } },
  alignment: { vertical: 'middle', horizontal: 'left' },
  border: {
    top: { style: 'thin', color: { argb: 'FF3E7996' } },
    bottom: { style: 'thin', color: { argb: 'FF3E7996' } },
  },
}

const TOTAL_STYLE: Partial<ExcelJS.Style> = {
  font: { bold: true, color: { argb: 'FF00BAB4' }, name: 'Calibri', size: 11 },
  fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0F4F8' } },
  border: {
    top: { style: 'medium', color: { argb: 'FF00BAB4' } },
  },
}

function formatHeader(ws: ExcelJS.Worksheet) {
  ws.getRow(1).eachCell((cell) => {
    cell.style = HEADER_STYLE as ExcelJS.Style
  })
  ws.getRow(1).height = 22
  ws.views = [{ state: 'frozen', ySplit: 1 }]
}

function tsToDate(ts: number | null | undefined): Date | null {
  return ts ? new Date(ts) : null
}

function statusLabel(status: string, type: 'payable' | 'receivable'): string {
  if (status === 'paid') return type === 'payable' ? 'Pago' : 'Recebido'
  if (status === 'overdue') return 'Vencido'
  return 'Pendente'
}

function downloadBlob(buffer: ArrayBuffer | Uint8Array, filename: string, mime: string) {
  const blob = new Blob([buffer as BlobPart], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

function todayStamp(): string {
  return format(new Date(), 'yyyy-MM-dd')
}

const XLSX_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
const ZIP_MIME = 'application/zip'

const PROJECT_STATUS: Record<string, string> = {
  active: 'Ativa',
  completed: 'Concluída',
  archived: 'Arquivada',
}

// ============================================================================
// Worksheet builders (XLSX)
// ============================================================================

function buildTransactionsSheet(
  ws: ExcelJS.Worksheet,
  transactions: Transaction[],
  type: 'payable' | 'receivable',
  projectsById: Map<string, string>
) {
  ws.columns = [
    { header: 'Descrição', key: 'description', width: 36 },
    { header: 'Categoria', key: 'category', width: 18 },
    { header: 'Vencimento', key: 'dueDate', width: 14, style: { numFmt: 'dd/mm/yyyy' } },
    { header: 'Valor', key: 'amount', width: 16, style: { numFmt: '"R$" #,##0.00' } },
    { header: 'Status', key: 'status', width: 14 },
    { header: 'Pago em', key: 'paidAt', width: 14, style: { numFmt: 'dd/mm/yyyy' } },
    { header: 'Meta vinculada', key: 'project', width: 24 },
    { header: 'Observações', key: 'notes', width: 40 },
  ]
  formatHeader(ws)

  for (const t of transactions) {
    ws.addRow({
      description: t.description,
      category: t.category,
      dueDate: tsToDate(t.dueDate),
      amount: t.amount,
      status: statusLabel(t.status, type),
      paidAt: tsToDate(t.paidAt),
      project: t.projectId ? projectsById.get(t.projectId) ?? '' : '',
      notes: t.notes,
    })
  }

  if (transactions.length > 0) {
    const total = transactions.reduce((s, t) => s + t.amount, 0)
    const totalRow = ws.addRow({ description: 'TOTAL', amount: total })
    totalRow.eachCell((cell) => {
      cell.style = TOTAL_STYLE as ExcelJS.Style
    })
    totalRow.getCell('amount').numFmt = '"R$" #,##0.00'
  }
}

function buildExpensesSheet(ws: ExcelJS.Worksheet, expenses: Expense[]) {
  ws.columns = [
    { header: 'Data', key: 'date', width: 14, style: { numFmt: 'dd/mm/yyyy' } },
    { header: 'Descrição', key: 'description', width: 36 },
    { header: 'Categoria', key: 'category', width: 18 },
    { header: 'Pagamento', key: 'paymentMethod', width: 16 },
    { header: 'Valor', key: 'amount', width: 16, style: { numFmt: '"R$" #,##0.00' } },
    { header: 'Observações', key: 'notes', width: 40 },
  ]
  formatHeader(ws)

  for (const e of expenses) {
    ws.addRow({
      date: tsToDate(e.date),
      description: e.description,
      category: e.category,
      paymentMethod: e.paymentMethod,
      amount: e.amount,
      notes: e.notes,
    })
  }

  if (expenses.length > 0) {
    const total = expenses.reduce((s, e) => s + e.amount, 0)
    const totalRow = ws.addRow({ date: null, description: 'TOTAL', amount: total })
    totalRow.eachCell((cell) => {
      cell.style = TOTAL_STYLE as ExcelJS.Style
    })
    totalRow.getCell('amount').numFmt = '"R$" #,##0.00'
  }
}

function buildSavingsSheet(ws: ExcelJS.Worksheet, savings: Savings[]) {
  ws.columns = [
    { header: 'Nome', key: 'name', width: 30 },
    { header: 'Tipo', key: 'type', width: 22 },
    { header: 'Instituição', key: 'institution', width: 22 },
    { header: 'Valor', key: 'amount', width: 16, style: { numFmt: '"R$" #,##0.00' } },
    { header: 'Rendimento (% a.a.)', key: 'yieldRate', width: 18, style: { numFmt: '0.00"%"' } },
    { header: 'Atualizado em', key: 'lastValueUpdate', width: 16, style: { numFmt: 'dd/mm/yyyy' } },
    { header: 'Observações', key: 'notes', width: 40 },
  ]
  formatHeader(ws)

  for (const s of savings) {
    ws.addRow({
      name: s.name,
      type: savingsTypeMeta(s.type).label,
      institution: s.institution,
      amount: s.amount,
      yieldRate: s.yieldRate,
      lastValueUpdate: tsToDate(s.lastValueUpdate),
      notes: s.notes,
    })
  }

  if (savings.length > 0) {
    const total = savings.reduce((s, sv) => s + sv.amount, 0)
    const totalRow = ws.addRow({ name: 'TOTAL', amount: total })
    totalRow.eachCell((cell) => {
      cell.style = TOTAL_STYLE as ExcelJS.Style
    })
    totalRow.getCell('amount').numFmt = '"R$" #,##0.00'
  }
}

function buildProjectsSheet(ws: ExcelJS.Worksheet, projects: Project[]) {
  ws.columns = [
    { header: 'Nome', key: 'name', width: 30 },
    { header: 'Descrição', key: 'description', width: 40 },
    { header: 'Valor alvo', key: 'targetAmount', width: 16, style: { numFmt: '"R$" #,##0.00' } },
    { header: 'Acumulado', key: 'currentAmount', width: 16, style: { numFmt: '"R$" #,##0.00' } },
    { header: 'Prazo', key: 'deadline', width: 14, style: { numFmt: 'dd/mm/yyyy' } },
    { header: 'Status', key: 'status', width: 14 },
  ]
  formatHeader(ws)

  for (const p of projects) {
    ws.addRow({
      name: p.name,
      description: p.description,
      targetAmount: p.targetAmount,
      currentAmount: p.currentAmount,
      deadline: tsToDate(p.deadline),
      status: PROJECT_STATUS[p.status] ?? p.status,
    })
  }
}

// ============================================================================
// CSV builders
// ============================================================================

function csvEscape(val: string | number | null | undefined): string {
  if (val === null || val === undefined) return ''
  const str = String(val)
  if (/[",;\n\r]/.test(str)) return `"${str.replace(/"/g, '""')}"`
  return str
}

function toCsv(headers: string[], rows: (string | number | null)[][]): string {
  const sep = ';' // Excel pt-BR usa ; como separador padrão
  return [
    headers.map(csvEscape).join(sep),
    ...rows.map((r) => r.map(csvEscape).join(sep)),
  ].join('\r\n')
}

function fmtDateBR(ts: number | null | undefined): string {
  return ts ? format(new Date(ts), 'dd/MM/yyyy') : ''
}

function fmtCurrencyCsv(val: number): string {
  // Formato BR: 1234,56 (sem milhar pra simplificar parsing)
  return val.toFixed(2).replace('.', ',')
}

function csvTransactions(
  transactions: Transaction[],
  type: 'payable' | 'receivable',
  projectsById: Map<string, string>
): string {
  const headers = ['Descrição', 'Categoria', 'Vencimento', 'Valor', 'Status', 'Pago em', 'Meta vinculada', 'Observações']
  const rows = transactions.map((t) => [
    t.description,
    t.category,
    fmtDateBR(t.dueDate),
    fmtCurrencyCsv(t.amount),
    statusLabel(t.status, type),
    fmtDateBR(t.paidAt),
    t.projectId ? projectsById.get(t.projectId) ?? '' : '',
    t.notes,
  ])
  if (transactions.length > 0) {
    const total = transactions.reduce((s, t) => s + t.amount, 0)
    rows.push(['TOTAL', '', '', fmtCurrencyCsv(total), '', '', '', ''])
  }
  return toCsv(headers, rows)
}

function csvExpenses(expenses: Expense[]): string {
  const headers = ['Data', 'Descrição', 'Categoria', 'Pagamento', 'Valor', 'Observações']
  const rows = expenses.map((e) => [
    fmtDateBR(e.date),
    e.description,
    e.category,
    e.paymentMethod,
    fmtCurrencyCsv(e.amount),
    e.notes,
  ])
  if (expenses.length > 0) {
    const total = expenses.reduce((s, e) => s + e.amount, 0)
    rows.push(['', 'TOTAL', '', '', fmtCurrencyCsv(total), ''])
  }
  return toCsv(headers, rows)
}

function csvSavings(savings: Savings[]): string {
  const headers = ['Nome', 'Tipo', 'Instituição', 'Valor', 'Rendimento (% a.a.)', 'Atualizado em', 'Observações']
  const rows = savings.map((s) => [
    s.name,
    savingsTypeMeta(s.type).label,
    s.institution,
    fmtCurrencyCsv(s.amount),
    s.yieldRate !== null ? fmtCurrencyCsv(s.yieldRate) : '',
    fmtDateBR(s.lastValueUpdate),
    s.notes,
  ])
  if (savings.length > 0) {
    const total = savings.reduce((s, sv) => s + sv.amount, 0)
    rows.push(['TOTAL', '', '', fmtCurrencyCsv(total), '', '', ''])
  }
  return toCsv(headers, rows)
}

function csvProjects(projects: Project[]): string {
  const headers = ['Nome', 'Descrição', 'Valor alvo', 'Acumulado', 'Prazo', 'Status']
  const rows = projects.map((p) => [
    p.name,
    p.description,
    fmtCurrencyCsv(p.targetAmount),
    fmtCurrencyCsv(p.currentAmount),
    fmtDateBR(p.deadline),
    PROJECT_STATUS[p.status] ?? p.status,
  ])
  return toCsv(headers, rows)
}

function csvBlob(content: string): Uint8Array {
  // BOM (﻿) + UTF-8 — faz Excel pt-BR abrir com acentos corretos
  const encoder = new TextEncoder()
  return encoder.encode('﻿' + content)
}

function downloadCsv(content: string, filename: string) {
  downloadBlob(csvBlob(content), filename, 'text/csv;charset=utf-8')
}

// ============================================================================
// Public API — XLSX
// ============================================================================

export interface ExportOptions {
  period?: Period | null
  format?: 'xlsx' | 'csv'
}

export async function exportTransactions(
  transactions: Transaction[],
  type: 'payable' | 'receivable',
  projects: Project[],
  options: ExportOptions = {}
) {
  const filtered = filterByPeriod(transactions, (t) => t.dueDate, options.period ?? null)
  const projectsById = new Map(projects.map((p) => [p.id, p.name]))
  const label = type === 'payable' ? 'contas-a-pagar' : 'contas-a-receber'

  if (options.format === 'csv') {
    downloadCsv(csvTransactions(filtered, type, projectsById), `fluxpay-${label}-${todayStamp()}.csv`)
    return
  }
  const wb = new ExcelJS.Workbook()
  wb.creator = 'fluxPay'
  wb.created = new Date()
  const ws = wb.addWorksheet(type === 'payable' ? 'Contas a Pagar' : 'Contas a Receber')
  buildTransactionsSheet(ws, filtered, type, projectsById)
  const buf = await wb.xlsx.writeBuffer()
  downloadBlob(buf as ArrayBuffer, `fluxpay-${label}-${todayStamp()}.xlsx`, XLSX_MIME)
}

export async function exportExpenses(expenses: Expense[], options: ExportOptions = {}) {
  const filtered = filterByPeriod(expenses, (e) => e.date, options.period ?? null)

  if (options.format === 'csv') {
    downloadCsv(csvExpenses(filtered), `fluxpay-gastos-avulsos-${todayStamp()}.csv`)
    return
  }
  const wb = new ExcelJS.Workbook()
  wb.creator = 'fluxPay'
  wb.created = new Date()
  const ws = wb.addWorksheet('Gastos Avulsos')
  buildExpensesSheet(ws, filtered)
  const buf = await wb.xlsx.writeBuffer()
  downloadBlob(buf as ArrayBuffer, `fluxpay-gastos-avulsos-${todayStamp()}.xlsx`, XLSX_MIME)
}

export async function exportSavings(savings: Savings[], options: ExportOptions = {}) {
  if (options.format === 'csv') {
    downloadCsv(csvSavings(savings), `fluxpay-patrimonio-${todayStamp()}.csv`)
    return
  }
  const wb = new ExcelJS.Workbook()
  wb.creator = 'fluxPay'
  wb.created = new Date()
  const ws = wb.addWorksheet('Patrimônio')
  buildSavingsSheet(ws, savings)
  const buf = await wb.xlsx.writeBuffer()
  downloadBlob(buf as ArrayBuffer, `fluxpay-patrimonio-${todayStamp()}.xlsx`, XLSX_MIME)
}

export async function exportProjects(projects: Project[], options: ExportOptions = {}) {
  if (options.format === 'csv') {
    downloadCsv(csvProjects(projects), `fluxpay-metas-${todayStamp()}.csv`)
    return
  }
  const wb = new ExcelJS.Workbook()
  wb.creator = 'fluxPay'
  wb.created = new Date()
  const ws = wb.addWorksheet('Metas')
  buildProjectsSheet(ws, projects)
  const buf = await wb.xlsx.writeBuffer()
  downloadBlob(buf as ArrayBuffer, `fluxpay-metas-${todayStamp()}.xlsx`, XLSX_MIME)
}

export async function exportAll(
  data: {
    transactions: Transaction[]
    expenses: Expense[]
    savings: Savings[]
    projects: Project[]
  },
  options: ExportOptions = {}
) {
  const period = options.period ?? null
  const projectsById = new Map(data.projects.map((p) => [p.id, p.name]))

  const filteredTx = filterByPeriod(data.transactions, (t) => t.dueDate, period)
  const filteredExp = filterByPeriod(data.expenses, (e) => e.date, period)
  const payable = filteredTx.filter((t) => t.type === 'payable')
  const receivable = filteredTx.filter((t) => t.type === 'receivable')

  if (options.format === 'csv') {
    const JSZip = (await import('jszip')).default
    const zip = new JSZip()
    zip.file('contas-a-pagar.csv', csvBlob(csvTransactions(payable, 'payable', projectsById)))
    zip.file('contas-a-receber.csv', csvBlob(csvTransactions(receivable, 'receivable', projectsById)))
    zip.file('gastos-avulsos.csv', csvBlob(csvExpenses(filteredExp)))
    zip.file('patrimonio.csv', csvBlob(csvSavings(data.savings)))
    zip.file('metas.csv', csvBlob(csvProjects(data.projects)))
    const blob = await zip.generateAsync({ type: 'uint8array' })
    downloadBlob(blob, `fluxpay-completo-${todayStamp()}.zip`, ZIP_MIME)
    return
  }

  const wb = new ExcelJS.Workbook()
  wb.creator = 'fluxPay'
  wb.created = new Date()
  buildTransactionsSheet(wb.addWorksheet('Contas a Pagar'), payable, 'payable', projectsById)
  buildTransactionsSheet(wb.addWorksheet('Contas a Receber'), receivable, 'receivable', projectsById)
  buildExpensesSheet(wb.addWorksheet('Gastos Avulsos'), filteredExp)
  buildSavingsSheet(wb.addWorksheet('Patrimônio'), data.savings)
  buildProjectsSheet(wb.addWorksheet('Metas'), data.projects)
  const buf = await wb.xlsx.writeBuffer()
  downloadBlob(buf as ArrayBuffer, `fluxpay-completo-${todayStamp()}.xlsx`, XLSX_MIME)
}
