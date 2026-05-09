<script setup lang="ts">
import { computed } from 'vue'
import { useAuthStore } from '../../stores/auth'
import { useExpensesStore } from '../../stores/expenses'
import { useToastStore } from '../../stores/toast'
import { formatCurrency } from '../../utils/currency'
import { formatDate } from '../../utils/dates'
import type { Expense } from '../../types'

defineProps<{
  expenses: Expense[]
}>()

const emit = defineEmits<{
  edit: [expense: Expense]
}>()

const authStore = useAuthStore()
const expensesStore = useExpensesStore()
const toast = useToastStore()

const headers = computed(() => [
  { title: 'Data', key: 'date' },
  { title: 'Descrição', key: 'description' },
  { title: 'Categoria', key: 'category' },
  { title: 'Pagamento', key: 'paymentMethod' },
  { title: 'Valor', key: 'amount', align: 'end' as const },
  { title: '', key: 'actions', sortable: false, align: 'end' as const },
])

const handleDelete = async (expense: Expense) => {
  if (!authStore.user) return
  if (confirm(`Excluir "${expense.description}"?`)) {
    try {
      await expensesStore.remove(authStore.user.uid, expense.id)
      toast.success('Gasto excluído')
    } catch (err) {
      toast.error('Erro: ' + (err as Error).message)
    }
  }
}

const categoryColor = (cat: string) => {
  const map: Record<string, string> = {
    'Alimentação': '#F4A261',
    'Mercado': '#069E6E',
    'Transporte': '#3E7996',
    'Lazer': '#A78BFA',
    'Saúde': '#FF4D6D',
    'Educação': '#00BAB4',
    'Compras': '#F472B6',
    'Casa': '#2F6C82',
    'Pets': '#94A3B8',
    'Beleza': '#F472B6',
    'Outros': '#8E94B0',
  }
  return map[cat] ?? '#8E94B0'
}
</script>

<template>
  <v-data-table
    :headers="headers"
    :items="expenses"
    :loading="expensesStore.isLoading"
    no-data-text="Nenhum gasto registrado"
    items-per-page-text="Linhas por página"
    class="flux-table"
  >
    <template #[`item.date`]="{ item }">
      <span style="color: #B6BBD0">{{ formatDate(item.date) }}</span>
    </template>

    <template #[`item.category`]="{ item }">
      <v-chip
        size="small"
        variant="tonal"
        :style="{ color: categoryColor(item.category), borderColor: categoryColor(item.category) }"
      >
        {{ item.category }}
      </v-chip>
    </template>

    <template #[`item.paymentMethod`]="{ item }">
      <span style="color: #8E94B0">{{ item.paymentMethod || '—' }}</span>
    </template>

    <template #[`item.amount`]="{ item }">
      <strong class="font-mono money-value" style="color: #FF4D6D">
        − {{ formatCurrency(item.amount) }}
      </strong>
    </template>

    <template #[`item.actions`]="{ item }">
      <v-btn
        icon="mdi-pencil"
        size="small"
        variant="text"
        color="primary"
        title="Editar"
        @click="emit('edit', item)"
      />
      <v-btn
        icon="mdi-delete"
        size="small"
        variant="text"
        color="error"
        title="Excluir"
        @click="handleDelete(item)"
      />
    </template>
  </v-data-table>
</template>

<style scoped>
:deep(.flux-table) {
  background: transparent !important;
}
:deep(.flux-table thead th) {
  color: #8E94B0 !important;
  text-transform: uppercase;
  font-size: 0.72rem !important;
  letter-spacing: 0.08em;
  border-bottom: 1px solid rgba(62, 121, 150, 0.2) !important;
}
:deep(.flux-table tbody tr) {
  transition: background 0.15s;
}
:deep(.flux-table tbody tr:hover) {
  background: rgba(255, 77, 109, 0.05) !important;
}
:deep(.flux-table tbody td) {
  border-bottom: 1px solid rgba(62, 121, 150, 0.08) !important;
}

.font-mono {
  font-family: 'Space Grotesk', monospace;
  font-feature-settings: 'tnum';
}
</style>
