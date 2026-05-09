import { parse, isValid } from 'date-fns'
import { writeBatch, doc, collection } from 'firebase/firestore'
import { db } from '../services/firebase'
import type { Transaction, Expense } from '../types'

export type ImportScope = 'payable' | 'receivable' | 'expenses'

export interface ParsedRow {
  raw: string[]
  data: Record<string, string>
  errors: string[]
  valid: boolean
}

export interface ImportResult {
  success: number
  failed: number
}

// Parser de CSV simples (suporta separadores ; e ,, aspas escapadas com "")
export function parseCsv(text: string): string[][] {
  // Remove BOM se houver
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1)

  const lines: string[][] = []
  const sep = detectSeparator(text)
  let row: string[] = []
  let cell = ''
  let inQuotes = false

  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { cell += '"'; i++ }
        else inQuotes = false
      } else cell += c
    } else {
      if (c === '"') inQuotes = true
      else if (c === sep) { row.push(cell); cell = '' }
      else if (c === '\r') { /* ignora */ }
      else if (c === '\n') { row.push(cell); lines.push(row); row = []; cell = '' }
      else cell += c
    }
  }
  if (cell.length > 0 || row.length > 0) {
    row.push(cell)
    lines.push(row)
  }
  return lines.filter((r) => r.some((c) => c.trim() !== ''))
}

function detectSeparator(text: string): string {
  const firstLine = text.split('\n')[0] || ''
  const semis = (firstLine.match(/;/g) || []).length
  const commas = (firstLine.match(/,/g) || []).length
  return semis >= commas ? ';' : ','
}

export function parseAmount(raw: string): number {
  if (!raw) return NaN
  const cleaned = raw.replace(/[^\d,.-]/g, '').replace(/\.(?=\d{3}(\D|$))/g, '').replace(',', '.')
  return parseFloat(cleaned)
}

export function parseDateBR(raw: string): number | null {
  if (!raw) return null
  const trimmed = raw.trim()
  // Tenta vários formatos
  const formats = ['dd/MM/yyyy', 'yyyy-MM-dd', 'dd-MM-yyyy', 'd/M/yyyy', 'yyyy/MM/dd']
  for (const fmt of formats) {
    const d = parse(trimmed, fmt, new Date())
    if (isValid(d)) return d.getTime()
  }
  return null
}

// Headers esperados (lowercase, sem acentos, sem símbolos)
function normalize(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]/g, '')
}

const TRANSACTION_FIELDS: { key: string; aliases: string[]; required?: boolean }[] = [
  { key: 'description', aliases: ['descricao', 'description', 'desc', 'historico'], required: true },
  { key: 'category',    aliases: ['categoria', 'category'], required: true },
  { key: 'dueDate',     aliases: ['vencimento', 'duedate', 'data', 'date'], required: true },
  { key: 'amount',      aliases: ['valor', 'amount', 'value'], required: true },
  { key: 'status',      aliases: ['status', 'situacao'] },
  { key: 'paidAt',      aliases: ['pagoem', 'paidat', 'datapagamento'] },
  { key: 'notes',       aliases: ['observacoes', 'notes', 'obs'] },
]

const EXPENSE_FIELDS: { key: string; aliases: string[]; required?: boolean }[] = [
  { key: 'date',          aliases: ['data', 'date'], required: true },
  { key: 'description',   aliases: ['descricao', 'description', 'desc'], required: true },
  { key: 'category',      aliases: ['categoria', 'category'], required: true },
  { key: 'paymentMethod', aliases: ['pagamento', 'paymentmethod', 'forma'] },
  { key: 'amount',        aliases: ['valor', 'amount'], required: true },
  { key: 'notes',         aliases: ['observacoes', 'notes', 'obs'] },
]

export interface MapResult {
  rows: ParsedRow[]
  fieldMap: Record<string, number> // canonical key → column index
  missingRequired: string[]
}

export function mapCsvToFields(rows: string[][], scope: ImportScope): MapResult {
  if (rows.length === 0) {
    return { rows: [], fieldMap: {}, missingRequired: [] }
  }
  const headers = rows[0].map(normalize)
  const fields = scope === 'expenses' ? EXPENSE_FIELDS : TRANSACTION_FIELDS

  const fieldMap: Record<string, number> = {}
  for (const f of fields) {
    const idx = headers.findIndex((h) => f.aliases.some((a) => normalize(a) === h))
    if (idx >= 0) fieldMap[f.key] = idx
  }

  const missingRequired = fields.filter((f) => f.required && !(f.key in fieldMap)).map((f) => f.key)

  const data: ParsedRow[] = rows.slice(1).map((raw) => {
    const obj: Record<string, string> = {}
    for (const [key, idx] of Object.entries(fieldMap)) {
      obj[key] = raw[idx] ?? ''
    }
    const errors = validateRow(obj, scope)
    return { raw, data: obj, errors, valid: errors.length === 0 }
  })

  return { rows: data, fieldMap, missingRequired }
}

function validateRow(data: Record<string, string>, scope: ImportScope): string[] {
  const errors: string[] = []
  const fields = scope === 'expenses' ? EXPENSE_FIELDS : TRANSACTION_FIELDS
  for (const f of fields) {
    if (f.required && !(data[f.key] || '').trim()) {
      errors.push(`${f.key} vazio`)
    }
  }
  if (data.amount && isNaN(parseAmount(data.amount))) {
    errors.push('valor inválido')
  }
  const dateField = scope === 'expenses' ? 'date' : 'dueDate'
  if (data[dateField] && parseDateBR(data[dateField]) === null) {
    errors.push('data inválida')
  }
  return errors
}

export async function commitImport(
  userId: string,
  scope: ImportScope,
  rows: ParsedRow[]
): Promise<ImportResult> {
  const valid = rows.filter((r) => r.valid)
  if (valid.length === 0) return { success: 0, failed: rows.length }

  const collectionName = scope === 'expenses' ? 'expenses' : 'transactions'
  const ref = collection(db, `users/${userId}/${collectionName}`)
  const now = Date.now()

  let success = 0
  let batch = writeBatch(db)
  let count = 0

  for (const row of valid) {
    try {
      const docRef = doc(ref)
      let payload: Partial<Transaction> | Partial<Expense>
      if (scope === 'expenses') {
        payload = {
          description: row.data.description,
          amount: parseAmount(row.data.amount),
          category: row.data.category,
          date: parseDateBR(row.data.date)!,
          paymentMethod: row.data.paymentMethod || '',
          notes: row.data.notes || '',
        } as Partial<Expense>
      } else {
        const status = (row.data.status || '').toLowerCase()
        const isPaid = status.includes('pago') || status.includes('recebido')
        payload = {
          type: scope === 'payable' ? 'payable' : 'receivable',
          description: row.data.description,
          amount: parseAmount(row.data.amount),
          category: row.data.category,
          dueDate: parseDateBR(row.data.dueDate)!,
          status: isPaid ? 'paid' : 'pending',
          paidAt: isPaid ? (parseDateBR(row.data.paidAt) ?? Date.now()) : null,
          projectId: null,
          notes: row.data.notes || '',
        } as Partial<Transaction>
      }
      batch.set(docRef, { ...payload, userId, createdAt: now, updatedAt: now })
      count++
      success++
      if (count === 450) {
        await batch.commit()
        batch = writeBatch(db)
        count = 0
      }
    } catch {
      // skip
    }
  }
  if (count > 0) await batch.commit()
  return { success, failed: rows.length - success }
}
