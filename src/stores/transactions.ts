import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Unsubscribe } from 'firebase/firestore'
import {
  subscribeTransactions,
  createTransaction as createTx,
  updateTransaction as updateTx,
  deleteTransaction as deleteTx,
  deleteRecurringGroup as deleteGroup,
  createRecurringSeries as createSeries,
} from '../services/transactions.service'
import { isOverdue, getMonthRange } from '../utils/dates'
import { usePreferencesStore } from './preferences'
import type { Transaction } from '../types'

export const useTransactionsStore = defineStore('transactions', () => {
  const transactions = ref<Transaction[]>([])
  const isLoading = ref(false)
  let unsubscribe: Unsubscribe | null = null

  const payable = computed(() =>
    transactions.value.filter((t) => t.type === 'payable')
  )
  const receivable = computed(() =>
    transactions.value.filter((t) => t.type === 'receivable')
  )

  const totalPending = (type: 'payable' | 'receivable') =>
    transactions.value
      .filter((t) => t.type === type && t.status !== 'paid')
      .reduce((sum, t) => sum + t.amount, 0)

  const monthTotal = (type: 'payable' | 'receivable') => {
    const prefs = usePreferencesStore()
    const { start, end } = getMonthRange(new Date(), prefs.monthStartDay)
    return transactions.value
      .filter(
        (t) =>
          t.type === type &&
          t.dueDate >= start &&
          t.dueDate <= end
      )
      .reduce((sum, t) => sum + t.amount, 0)
  }

  const overdueCount = computed(
    () => transactions.value.filter((t) => isOverdue(t.dueDate, t.status)).length
  )

  const subscribe = (userId: string) => {
    if (unsubscribe) unsubscribe()
    isLoading.value = true
    unsubscribe = subscribeTransactions(userId, (items) => {
      transactions.value = items.map((t) => ({
        ...t,
        status: isOverdue(t.dueDate, t.status) ? 'overdue' : t.status,
      }))
      isLoading.value = false
    })
  }

  const unsubscribeAll = () => {
    if (unsubscribe) {
      unsubscribe()
      unsubscribe = null
    }
    transactions.value = []
  }

  const create = (userId: string, data: Omit<Transaction, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) =>
    createTx(userId, data)

  const update = (userId: string, id: string, data: Partial<Transaction>) =>
    updateTx(userId, id, data)

  const remove = (userId: string, id: string) => deleteTx(userId, id)

  const removeGroup = (userId: string, groupId: string) => deleteGroup(userId, groupId)

  const createRecurring = (
    userId: string,
    base: Omit<Transaction, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'recurring'>,
    frequency: 'weekly' | 'monthly' | 'yearly',
    total: number
  ) => createSeries(userId, base, frequency, total)

  const markAsPaid = (userId: string, id: string) =>
    updateTx(userId, id, { status: 'paid', paidAt: Date.now() })

  return {
    transactions,
    payable,
    receivable,
    isLoading,
    overdueCount,
    totalPending,
    monthTotal,
    subscribe,
    unsubscribeAll,
    create,
    update,
    remove,
    removeGroup,
    createRecurring,
    markAsPaid,
  }
})
