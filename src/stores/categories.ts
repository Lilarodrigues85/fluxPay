import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Unsubscribe } from 'firebase/firestore'
import {
  subscribeCategories,
  createCategory as createCt,
  updateCategory as updateCt,
  deleteCategory as deleteCt,
} from '../services/categories.service'
import type { Category, CategoryScope } from '../types'

const DEFAULT_PAYABLE = ['Moradia', 'Alimentação', 'Transporte', 'Saúde', 'Lazer', 'Educação', 'Cartão', 'Outros']
const DEFAULT_RECEIVABLE = ['Salário', 'Freelance', 'Rendimentos', 'Vendas', 'Reembolsos', 'Outros']
const DEFAULT_EXPENSE = ['Alimentação', 'Mercado', 'Transporte', 'Lazer', 'Saúde', 'Educação', 'Compras', 'Casa', 'Pets', 'Beleza', 'Outros']

export const useCategoriesStore = defineStore('categories', () => {
  const items = ref<Category[]>([])
  const isLoading = ref(false)
  let unsubscribe: Unsubscribe | null = null

  const customByScope = (scope: CategoryScope) =>
    items.value.filter((c) => c.scope === scope || c.scope === 'all').map((c) => c.name)

  const namesForPayable = computed(() => {
    const custom = customByScope('payable')
    const merged = new Set([...DEFAULT_PAYABLE, ...custom])
    return Array.from(merged).sort()
  })

  const namesForReceivable = computed(() => {
    const custom = customByScope('receivable')
    const merged = new Set([...DEFAULT_RECEIVABLE, ...custom])
    return Array.from(merged).sort()
  })

  const namesForExpense = computed(() => {
    const custom = customByScope('expense')
    const merged = new Set([...DEFAULT_EXPENSE, ...custom])
    return Array.from(merged).sort()
  })

  const subscribe = (userId: string) => {
    if (unsubscribe) unsubscribe()
    isLoading.value = true
    unsubscribe = subscribeCategories(userId, (data) => {
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

  const create = (userId: string, data: Omit<Category, 'id' | 'userId' | 'createdAt'>) =>
    createCt(userId, data)

  const update = (userId: string, id: string, data: Partial<Category>) =>
    updateCt(userId, id, data)

  const remove = (userId: string, id: string) => deleteCt(userId, id)

  return {
    items,
    isLoading,
    namesForPayable,
    namesForReceivable,
    namesForExpense,
    subscribe,
    unsubscribeAll,
    create,
    update,
    remove,
  }
})
