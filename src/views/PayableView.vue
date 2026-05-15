<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import AppLayout from '../components/layout/AppLayout.vue'
import TransactionDialog from '../components/transactions/TransactionDialog.vue'
import TransactionTable from '../components/transactions/TransactionTable.vue'
import ExportDialog from '../components/common/ExportDialog.vue'
import ImportDialog from '../components/common/ImportDialog.vue'
import { useTransactionsStore } from '../stores/transactions'
import { usePreferencesStore } from '../stores/preferences'
import { formatCurrency } from '../utils/currency'
import { formatMonth, getMonthRange } from '../utils/dates'
import type { Transaction } from '../types'

const route = useRoute()

const txStore = useTransactionsStore()
const prefs = usePreferencesStore()

const dialogOpen = ref(false)
const exportOpen = ref(false)
const importOpen = ref(false)
const editingTx = ref<Transaction | null>(null)
const filterStatus = ref<string>('all')

function toYearMonth(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function yearMonthToDate(ym: string): Date {
  const [y, m] = ym.split('-').map(Number)
  return new Date(y, m - 1, 15)
}

const monthCursor = ref<string>(toYearMonth(new Date()))

const monthOptions = computed(() => {
  const set = new Set<string>()
  set.add(toYearMonth(new Date()))
  txStore.payable.forEach((t) => set.add(toYearMonth(new Date(t.dueDate))))
  const sorted = Array.from(set).sort().reverse()
  return [
    { title: 'Todos os meses', value: 'all' },
    ...sorted.map((ym) => ({
      title: formatMonth(yearMonthToDate(ym).getTime()),
      value: ym,
    })),
  ]
})

const selectedRange = computed(() => {
  if (monthCursor.value === 'all') return null
  return getMonthRange(yearMonthToDate(monthCursor.value), prefs.monthStartDay)
})

const inSelectedMonth = (t: Transaction) => {
  const r = selectedRange.value
  return !r || (t.dueDate >= r.start && t.dueDate <= r.end)
}

const filtered = computed(() => {
  let list = txStore.payable.filter(inSelectedMonth)
  if (filterStatus.value !== 'all') {
    list = list.filter((t) => t.status === filterStatus.value)
  }
  return list
})

const pendingInScope = computed(() =>
  txStore.payable
    .filter((t) => t.status !== 'paid' && inSelectedMonth(t))
    .reduce((s, t) => s + t.amount, 0)
)

const totalInScope = computed(() =>
  txStore.payable
    .filter(inSelectedMonth)
    .reduce((s, t) => s + t.amount, 0)
)

const scopeLabel = computed(() =>
  monthCursor.value === 'all'
    ? 'todos os meses'
    : formatMonth(yearMonthToDate(monthCursor.value).getTime())
)

const openNew = () => {
  editingTx.value = null
  dialogOpen.value = true
}

const handleEdit = (tx: Transaction) => {
  editingTx.value = tx
  dialogOpen.value = true
}

watch(() => route.query.new, (v) => { if (v) openNew() }, { immediate: true })
</script>

<template>
  <AppLayout>
    <v-container class="py-8">
      <div class="d-flex align-start mb-6">
        <div>
          <div class="text-caption text-uppercase mb-1" style="letter-spacing: 0.12em; color: #FF4D6D">
            Despesas
          </div>
          <h1 class="text-h3">Contas a Pagar</h1>
        </div>
        <v-spacer />
        <v-btn
          variant="text"
          size="large"
          class="mr-2"
          prepend-icon="mdi-upload"
          @click="importOpen = true"
        >
          Importar
        </v-btn>
        <v-btn
          variant="tonal"
          size="large"
          class="mr-2"
          prepend-icon="mdi-download"
          :disabled="txStore.payable.length === 0"
          @click="exportOpen = true"
        >
          Exportar
        </v-btn>
        <v-btn color="primary" size="large" prepend-icon="mdi-plus" @click="openNew">
          Nova conta
        </v-btn>
      </div>

      <v-row class="mb-4">
        <v-col cols="12" md="6">
          <v-card class="glass-card pa-4">
            <div class="text-caption text-uppercase mb-2" style="letter-spacing: 0.08em; color: #8E94B0">
              Pendente em {{ scopeLabel }}
            </div>
            <div class="text-h4 font-weight-bold money-value" style="color: #FF4D6D">
              {{ formatCurrency(pendingInScope) }}
            </div>
          </v-card>
        </v-col>
        <v-col cols="12" md="6">
          <v-card class="glass-card pa-4">
            <div class="text-caption text-uppercase mb-2" style="letter-spacing: 0.08em; color: #8E94B0">
              Total em {{ scopeLabel }}
            </div>
            <div class="text-h4 font-weight-bold money-value">
              {{ formatCurrency(totalInScope) }}
            </div>
          </v-card>
        </v-col>
      </v-row>

      <v-card class="glass-card pa-4">
        <div class="d-flex flex-wrap ga-3 mb-2">
          <v-select
            v-model="monthCursor"
            :items="monthOptions"
            label="Mês"
            density="compact"
            hide-details
            prepend-inner-icon="mdi-calendar-month"
            style="max-width: 220px"
          />
          <v-select
            v-model="filterStatus"
            :items="[
              { title: 'Todos', value: 'all' },
              { title: 'Pendentes', value: 'pending' },
              { title: 'Vencidos', value: 'overdue' },
              { title: 'Pagos', value: 'paid' },
            ]"
            label="Filtrar por status"
            density="compact"
            hide-details
            style="max-width: 220px"
          />
        </div>

        <TransactionTable
          :transactions="filtered"
          type="payable"
          @edit="handleEdit"
        />
      </v-card>

      <TransactionDialog
        v-model="dialogOpen"
        type="payable"
        :transaction="editingTx"
      />

      <ExportDialog v-model="exportOpen" scope="payable" />
      <ImportDialog v-model="importOpen" scope="payable" />
    </v-container>
  </AppLayout>
</template>
