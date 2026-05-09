import type { Transaction, Expense } from '../types'

const FIVE_MIN = 5 * 60 * 1000

function sameDay(a: number, b: number): boolean {
  const d1 = new Date(a)
  const d2 = new Date(b)
  return d1.getFullYear() === d2.getFullYear() &&
         d1.getMonth() === d2.getMonth() &&
         d1.getDate() === d2.getDate()
}

function normalize(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, ' ')
}

export interface DuplicateCandidate {
  description: string
  amount: number
  date: number
  excludeId?: string
}

export function findTransactionDuplicate(
  list: Transaction[],
  candidate: DuplicateCandidate
): Transaction | null {
  const recentLimit = Date.now() - FIVE_MIN
  return list.find(t =>
    t.id !== candidate.excludeId &&
    normalize(t.description) === normalize(candidate.description) &&
    Math.abs(t.amount - candidate.amount) < 0.01 &&
    sameDay(t.dueDate, candidate.date) &&
    t.createdAt >= recentLimit
  ) || null
}

export function findExpenseDuplicate(
  list: Expense[],
  candidate: DuplicateCandidate
): Expense | null {
  const recentLimit = Date.now() - FIVE_MIN
  return list.find(e =>
    e.id !== candidate.excludeId &&
    normalize(e.description) === normalize(candidate.description) &&
    Math.abs(e.amount - candidate.amount) < 0.01 &&
    sameDay(e.date, candidate.date) &&
    e.createdAt >= recentLimit
  ) || null
}
