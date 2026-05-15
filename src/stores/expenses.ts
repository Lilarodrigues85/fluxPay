import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Unsubscribe } from 'firebase/firestore'
import {
  subscribeExpenses,
  createExpense as createEx,
  updateExpense as updateEx,
  deleteExpense as deleteEx,
  reconcileExpenses as reconcileEx,
} from '../services/expenses.service'
import { getMonthRange } from '../utils/dates'
import { usePreferencesStore } from './preferences'
import type { Expense } from '../types'

export const useExpensesStore = defineStore('expenses', () => {
  const items = ref<Expense[]>([])
  const isLoading = ref(false)
  let unsubscribe: Unsubscribe | null = null

  const monthTotal = computed(() => {
    const prefs = usePreferencesStore()
    const { start, end } = getMonthRange(new Date(), prefs.monthStartDay)
    return items.value
      .filter((e) => e.date >= start && e.date <= end)
      .reduce((sum, e) => sum + e.amount, 0)
  })

  const todayTotal = computed(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const startToday = today.getTime()
    return items.value
      .filter((e) => e.date >= startToday)
      .reduce((sum, e) => sum + e.amount, 0)
  })

  const monthCount = computed(() => {
    const prefs = usePreferencesStore()
    const { start, end } = getMonthRange(new Date(), prefs.monthStartDay)
    return items.value.filter((e) => e.date >= start && e.date <= end).length
  })

  const dailyAvg = computed(() => {
    const prefs = usePreferencesStore()
    const { start } = getMonthRange(new Date(), prefs.monthStartDay)
    const elapsedDays = Math.max(1, Math.ceil((Date.now() - start) / (24 * 60 * 60 * 1000)))
    return monthTotal.value / elapsedDays
  })

  const subscribe = (userId: string) => {
    if (unsubscribe) unsubscribe()
    isLoading.value = true
    unsubscribe = subscribeExpenses(userId, (data) => {
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

  const create = (userId: string, data: Omit<Expense, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) =>
    createEx(userId, data)

  const update = (userId: string, id: string, data: Partial<Expense>) => {
    const old = items.value.find((e) => e.id === id)
    if (!old) throw new Error('Gasto não encontrado')
    return updateEx(userId, id, old, data)
  }

  const remove = (userId: string, id: string) => {
    const old = items.value.find((e) => e.id === id)
    return deleteEx(userId, id, old)
  }

  const reconcile = (userId: string, expensesToLink: Expense[], accountId: string) =>
    reconcileEx(userId, expensesToLink, accountId)

  // Gastos não-Crédito sem vínculo de conta — candidatos a reconciliação
  const unlinkedExpenses = computed(() =>
    items.value.filter(
      (e) => e.paymentMethod !== 'Crédito' && !e.linkedAccountId
    )
  )

  return {
    items,
    isLoading,
    monthTotal,
    todayTotal,
    monthCount,
    dailyAvg,
    unlinkedExpenses,
    subscribe,
    unsubscribeAll,
    create,
    update,
    remove,
    reconcile,
  }
})
