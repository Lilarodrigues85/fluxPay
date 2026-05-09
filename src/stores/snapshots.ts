import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Unsubscribe } from 'firebase/firestore'
import {
  subscribeSnapshots,
  upsertSnapshot as upsertSp,
  getYearMonth,
} from '../services/snapshots.service'
import type { NetWorthSnapshot, Savings } from '../types'

export const useSnapshotsStore = defineStore('snapshots', () => {
  const items = ref<NetWorthSnapshot[]>([])
  const isLoading = ref(false)
  let unsubscribe: Unsubscribe | null = null

  const subscribe = (userId: string) => {
    if (unsubscribe) unsubscribe()
    isLoading.value = true
    unsubscribe = subscribeSnapshots(userId, (data) => {
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

  // Captura snapshot do mês atual se ainda não existir
  const captureCurrent = async (userId: string, savings: Savings[]) => {
    const total = savings.reduce((s, x) => s + x.amount, 0)
    const checking = savings.filter((x) => x.type === 'checking').reduce((s, x) => s + x.amount, 0)
    const invested = total - checking
    const byTypeMap = new Map<string, number>()
    for (const s of savings) {
      byTypeMap.set(s.type, (byTypeMap.get(s.type) || 0) + s.amount)
    }
    const byType = Array.from(byTypeMap.entries()).map(([type, amount]) => ({ type, amount }))

    await upsertSp(userId, {
      yearMonth: getYearMonth(),
      total,
      invested,
      checking,
      byType,
    })
  }

  return { items, isLoading, subscribe, unsubscribeAll, captureCurrent }
})
