<script setup lang="ts">
import { computed } from 'vue'
import { useTransactionsStore } from '../../stores/transactions'
import { useExpensesStore } from '../../stores/expenses'
import { usePreferencesStore } from '../../stores/preferences'
import { computeMonthComparison } from '../../utils/insights'
import { formatCurrency } from '../../utils/currency'

const txStore = useTransactionsStore()
const expensesStore = useExpensesStore()
const prefs = usePreferencesStore()

const comp = computed(() =>
  computeMonthComparison(txStore.transactions, expensesStore.items, prefs.monthStartDay)
)

interface Row {
  label: string
  current: number
  previous: number
  delta: number
  deltaPct: number
  // Para gastos: aumento = ruim. Para receita: aumento = bom.
  goodOnUp: boolean
}

const rows = computed<Row[]>(() => [
  { label: 'A receber',   current: comp.value.receivable.current, previous: comp.value.receivable.previous, delta: comp.value.receivable.delta, deltaPct: comp.value.receivable.deltaPct, goodOnUp: true },
  { label: 'A pagar',     current: comp.value.payable.current,    previous: comp.value.payable.previous,    delta: comp.value.payable.delta,    deltaPct: comp.value.payable.deltaPct,    goodOnUp: false },
  { label: 'Gastos',      current: comp.value.expenses.current,   previous: comp.value.expenses.previous,   delta: comp.value.expenses.delta,   deltaPct: comp.value.expenses.deltaPct,   goodOnUp: false },
  { label: 'Saldo',       current: comp.value.balance.current,    previous: comp.value.balance.previous,    delta: comp.value.balance.delta,    deltaPct: comp.value.balance.deltaPct,    goodOnUp: true },
])

function deltaColor(row: Row): string {
  if (Math.abs(row.deltaPct) < 1) return '#8E94B0'
  const isUp = row.delta > 0
  if (row.goodOnUp) return isUp ? '#069E6E' : '#FF4D6D'
  return isUp ? '#FF4D6D' : '#069E6E'
}

function deltaIcon(row: Row): string {
  if (Math.abs(row.deltaPct) < 1) return 'mdi-minus'
  return row.delta > 0 ? 'mdi-trending-up' : 'mdi-trending-down'
}
</script>

<template>
  <v-card class="glass-card comp-card pa-5">
    <div class="d-flex align-center mb-4">
      <div class="title-marker mr-3"></div>
      <div>
        <div class="text-caption text-uppercase" style="letter-spacing: 0.12em; color: #8E94B0">
          Análise temporal
        </div>
        <div style="font-family: 'Space Grotesk'; letter-spacing: -0.01em; font-size: 1.1rem; font-weight: 600">
          Mês atual vs anterior
        </div>
      </div>
    </div>

    <div class="d-flex flex-column ga-3">
      <div v-for="r in rows" :key="r.label" class="comp-row">
        <div class="d-flex justify-space-between align-center mb-2">
          <span class="text-body-2 font-weight-medium">{{ r.label }}</span>
          <div class="d-flex align-center">
            <v-icon :icon="deltaIcon(r)" :color="deltaColor(r)" size="18" class="mr-1" />
            <span class="font-mono font-weight-bold" :style="{ color: deltaColor(r), fontSize: '0.95rem' }">
              {{ r.deltaPct >= 0 ? '+' : '' }}{{ r.deltaPct.toFixed(0) }}%
            </span>
          </div>
        </div>
        <div class="d-flex justify-space-between text-caption">
          <div>
            <div style="color: var(--text-muted); font-size: 0.7rem">Atual</div>
            <div class="font-mono money-value" style="color: #E5E7F0">{{ formatCurrency(r.current) }}</div>
          </div>
          <div class="text-right">
            <div style="color: var(--text-muted); font-size: 0.7rem">Anterior</div>
            <div class="font-mono money-value" style="color: var(--text-muted)">{{ formatCurrency(r.previous) }}</div>
          </div>
        </div>
      </div>
    </div>
  </v-card>
</template>

<style scoped>
.comp-card {
  position: relative;
  overflow: hidden;
}

.title-marker {
  width: 4px;
  height: 36px;
  border-radius: 2px;
  background: linear-gradient(180deg, #00BAB4, #2F6C82);
  box-shadow: 0 0 12px rgba(0, 186, 180, 0.5);
}

.comp-row {
  padding: 12px;
  background: rgba(15, 16, 35, 0.4);
  border: 1px solid rgba(62, 121, 150, 0.15);
  border-radius: 10px;
}

.font-mono {
  font-family: 'Space Grotesk', monospace;
  font-feature-settings: 'tnum';
}
</style>
