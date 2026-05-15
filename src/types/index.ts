export interface User {
  uid: string
  displayName: string | null
  email: string | null
  photoURL: string | null
  createdAt: number
  settings?: {
    currency: string
    theme: 'light' | 'dark'
  }
}

export interface Transaction {
  id: string
  userId: string
  type: 'payable' | 'receivable'
  description: string
  amount: number
  category: string
  dueDate: number
  status: 'pending' | 'paid' | 'overdue'
  paidAt: number | null
  recurring?: {
    frequency: 'weekly' | 'monthly' | 'yearly'
    groupId: string
    occurrence: number
    total: number
  } | null
  projectId: string | null
  notes: string
  tags?: string[]
  createdAt: number
  updatedAt: number
}

export interface Project {
  id: string
  userId: string
  name: string
  description: string
  targetAmount: number
  currentAmount: number
  deadline: number | null
  status: 'active' | 'completed' | 'archived'
  color: string
  icon: string
  createdAt: number
  updatedAt: number
}

export type CategoryScope = 'payable' | 'receivable' | 'expense' | 'all'

export interface Category {
  id: string
  userId: string
  name: string
  scope: CategoryScope
  color: string
  icon: string
  createdAt: number
}

export interface Budget {
  id: string
  userId: string
  category: string
  monthlyLimit: number
  scope: 'expense' | 'payable' | 'all'  // o que conta no consumo
  color: string
  createdAt: number
  updatedAt: number
}

export type SavingsType =
  | 'checking'
  | 'savings'
  | 'cdb'
  | 'treasury'
  | 'funds'
  | 'stocks'
  | 'crypto'
  | 'cash'
  | 'other'

export interface Savings {
  id: string
  userId: string
  name: string
  type: SavingsType
  institution: string
  amount: number
  yieldRate: number | null
  color: string
  icon: string
  notes: string
  lastValueUpdate: number
  createdAt: number
  updatedAt: number
}

export interface Expense {
  id: string
  userId: string
  description: string
  amount: number
  category: string
  date: number
  paymentMethod: string
  notes: string
  tags?: string[]
  linkedAccountId?: string | null  // id da Savings (conta corrente) debitada — null se Crédito ou não vinculado
  createdAt: number
  updatedAt: number
}

export interface NetWorthSnapshot {
  id: string             // formato YYYY-MM
  userId: string
  yearMonth: string      // ex: "2026-05"
  total: number          // total geral (incluindo conta corrente)
  invested: number       // só investido (excluindo conta corrente)
  checking: number       // só conta corrente
  byType: { type: string; amount: number }[]
  createdAt: number
}

export interface DashboardSummary {
  totalPayable: number
  totalReceivable: number
  balance: number
  monthPayable: number
  monthReceivable: number
  overdueCount: number
  totalSavings: number
}
