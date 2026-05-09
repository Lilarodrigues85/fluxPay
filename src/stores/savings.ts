import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Unsubscribe } from 'firebase/firestore'
import {
  subscribeSavings,
  createSavings as createSv,
  updateSavings as updateSv,
  deleteSavings as deleteSv,
} from '../services/savings.service'
import type { Savings } from '../types'

export const useSavingsStore = defineStore('savings', () => {
  const items = ref<Savings[]>([])
  const isLoading = ref(false)
  let unsubscribe: Unsubscribe | null = null

  const total = computed(() => items.value.reduce((sum, s) => sum + s.amount, 0))

  const checkingTotal = computed(() =>
    items.value.filter((s) => s.type === 'checking').reduce((sum, s) => sum + s.amount, 0)
  )

  const investedTotal = computed(() =>
    items.value.filter((s) => s.type !== 'checking').reduce((sum, s) => sum + s.amount, 0)
  )

  const checkingItems = computed(() => items.value.filter((s) => s.type === 'checking'))

  const byType = computed(() => {
    const map = new Map<string, number>()
    for (const item of items.value) {
      map.set(item.type, (map.get(item.type) || 0) + item.amount)
    }
    return Array.from(map.entries()).map(([type, amount]) => ({ type, amount }))
  })

  const investedByType = computed(() => {
    const map = new Map<string, number>()
    for (const item of items.value) {
      if (item.type === 'checking') continue
      map.set(item.type, (map.get(item.type) || 0) + item.amount)
    }
    return Array.from(map.entries()).map(([type, amount]) => ({ type, amount }))
  })

  const subscribe = (userId: string) => {
    if (unsubscribe) unsubscribe()
    isLoading.value = true
    unsubscribe = subscribeSavings(userId, (data) => {
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

  const create = (userId: string, data: Omit<Savings, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) =>
    createSv(userId, data)

  const update = (userId: string, id: string, data: Partial<Savings>) =>
    updateSv(userId, id, data)

  const remove = (userId: string, id: string) => deleteSv(userId, id)

  return {
    items,
    isLoading,
    total,
    checkingTotal,
    investedTotal,
    checkingItems,
    byType,
    investedByType,
    subscribe,
    unsubscribeAll,
    create,
    update,
    remove,
  }
})
