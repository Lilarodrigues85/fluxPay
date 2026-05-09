<script setup lang="ts">
import { computed } from 'vue'
import { useAuthStore } from '../../stores/auth'
import { useTransactionsStore } from '../../stores/transactions'
import { useToastStore } from '../../stores/toast'
import { formatCurrency } from '../../utils/currency'
import { formatDate } from '../../utils/dates'
import type { Transaction } from '../../types'

const props = defineProps<{
  transactions: Transaction[]
  type: 'payable' | 'receivable'
}>()

const emit = defineEmits<{
  edit: [tx: Transaction]
}>()

const authStore = useAuthStore()
const txStore = useTransactionsStore()
const toast = useToastStore()

const headers = computed(() => [
  { title: 'Descrição', key: 'description' },
  { title: 'Categoria', key: 'category' },
  { title: 'Vencimento', key: 'dueDate' },
  { title: 'Valor', key: 'amount', align: 'end' as const },
  { title: 'Status', key: 'status' },
  { title: 'Ações', key: 'actions', sortable: false, align: 'end' as const },
])

const statusColor = (status: string) => {
  if (status === 'paid') return 'success'
  if (status === 'overdue') return 'error'
  return 'warning'
}

const statusLabel = (status: string) => {
  if (status === 'paid') return props.type === 'payable' ? 'Pago' : 'Recebido'
  if (status === 'overdue') return 'Vencido'
  return 'Pendente'
}

const handleMarkPaid = async (tx: Transaction) => {
  if (!authStore.user) return
  try {
    await txStore.markAsPaid(authStore.user.uid, tx.id)
    toast.success(props.type === 'payable' ? 'Marcada como paga' : 'Marcada como recebida')
  } catch (err) {
    toast.error('Erro: ' + (err as Error).message)
  }
}

const handleDelete = async (tx: Transaction) => {
  if (!authStore.user) return
  if (confirm(`Excluir "${tx.description}"?`)) {
    try {
      await txStore.remove(authStore.user.uid, tx.id)
      toast.success('Transação excluída')
    } catch (err) {
      toast.error('Erro: ' + (err as Error).message)
    }
  }
}

const handleDeleteSeries = async (tx: Transaction) => {
  if (!authStore.user || !tx.recurring) return
  if (confirm(`Excluir TODAS as ${tx.recurring.total} ocorrências da série "${tx.description}"?`)) {
    try {
      const count = await txStore.removeGroup(authStore.user.uid, tx.recurring.groupId)
      toast.success(`${count} ocorrências excluídas`)
    } catch (err) {
      toast.error('Erro: ' + (err as Error).message)
    }
  }
}
</script>

<template>
  <v-data-table
    :headers="headers"
    :items="transactions"
    :loading="txStore.isLoading"
    no-data-text="Nenhuma transação encontrada"
    items-per-page-text="Linhas por página"
    class="flux-table"
  >
    <template #[`item.description`]="{ item }">
      <div class="d-flex align-center flex-wrap" style="gap: 4px">
        <span>{{ item.description }}</span>
        <v-tooltip v-if="item.recurring" location="top">
          <template #activator="{ props: tipProps }">
            <v-icon
              v-bind="tipProps"
              icon="mdi-repeat-variant"
              size="14"
              color="primary"
            />
          </template>
          {{ item.recurring.occurrence }}/{{ item.recurring.total }}
          ({{ item.recurring.frequency === 'weekly' ? 'semanal' : item.recurring.frequency === 'monthly' ? 'mensal' : 'anual' }})
        </v-tooltip>
        <v-chip
          v-for="tag in item.tags || []"
          :key="tag"
          size="x-small"
          variant="outlined"
          class="tag-chip"
        >
          #{{ tag }}
        </v-chip>
      </div>
    </template>

    <template #[`item.dueDate`]="{ item }">
      <span style="color: #B6BBD0">{{ formatDate(item.dueDate) }}</span>
    </template>

    <template #[`item.amount`]="{ item }">
      <strong
        class="font-mono money-value"
        :style="{ color: type === 'payable' ? '#FF4D6D' : '#069E6E' }"
      >
        {{ formatCurrency(item.amount) }}
      </strong>
    </template>

    <template #[`item.status`]="{ item }">
      <v-chip :color="statusColor(item.status)" size="small" variant="tonal">
        {{ statusLabel(item.status) }}
      </v-chip>
    </template>

    <template #[`item.actions`]="{ item }">
      <v-btn
        v-if="item.status !== 'paid'"
        icon="mdi-check"
        size="small"
        variant="text"
        color="success"
        :title="type === 'payable' ? 'Marcar como pago' : 'Marcar como recebido'"
        @click="handleMarkPaid(item)"
      />
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
      <v-btn
        v-if="item.recurring"
        icon="mdi-delete-sweep"
        size="small"
        variant="text"
        color="error"
        title="Excluir série inteira"
        @click="handleDeleteSeries(item)"
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
  background: rgba(0, 186, 180, 0.05) !important;
}
:deep(.flux-table tbody td) {
  border-bottom: 1px solid rgba(62, 121, 150, 0.08) !important;
}

.font-mono {
  font-family: 'Space Grotesk', monospace;
  font-feature-settings: 'tnum';
}

.tag-chip {
  font-size: 0.65rem !important;
  height: 18px !important;
  opacity: 0.75;
  border-color: rgba(0, 186, 180, 0.4) !important;
  color: #00BAB4 !important;
}
</style>
