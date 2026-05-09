<script setup lang="ts">
import { computed } from 'vue'
import { startOfMonth, endOfMonth } from 'date-fns'
import { useTransactionsStore } from '../../stores/transactions'
import { formatCurrency } from '../../utils/currency'
import { getNextNMonths } from '../../utils/dates'
import Sparkline from '../common/Sparkline.vue'

const txStore = useTransactionsStore()

const monthlySeries = computed(() => {
  const months = getNextNMonths(6)
  const payable: number[] = []
  const receivable: number[] = []
  const balance: number[] = []
  for (const m of months) {
    const start = startOfMonth(m).getTime()
    const end = endOfMonth(m).getTime()
    const p = txStore.transactions
      .filter((t) => t.type === 'payable' && t.dueDate >= start && t.dueDate <= end)
      .reduce((sum, t) => sum + t.amount, 0)
    const r = txStore.transactions
      .filter((t) => t.type === 'receivable' && t.dueDate >= start && t.dueDate <= end)
      .reduce((sum, t) => sum + t.amount, 0)
    payable.push(p)
    receivable.push(r)
    balance.push(r - p)
  }
  return { payable, receivable, balance }
})

const monthPayable = computed(() => txStore.monthTotal('payable'))
const monthReceivable = computed(() => txStore.monthTotal('receivable'))
const balance = computed(() => monthReceivable.value - monthPayable.value)
const overdue = computed(() => txStore.overdueCount)

const overdueSeries = computed(() => {
  // mostra count de pendentes/vencidas por mês nos próximos 6 meses
  const months = getNextNMonths(6)
  const today = Date.now()
  return months.map((m) => {
    const end = endOfMonth(m).getTime()
    return txStore.transactions.filter(
      (t) => t.status !== 'paid' && t.dueDate <= end && t.dueDate < today
    ).length
  })
})

const cards = computed(() => [
  {
    key: 'payable',
    title: 'A pagar (mês)',
    value: formatCurrency(monthPayable.value),
    icon: 'mdi-arrow-up-bold',
    accent: '#FF4D6D',
    series: monthlySeries.value.payable,
  },
  {
    key: 'receivable',
    title: 'A receber (mês)',
    value: formatCurrency(monthReceivable.value),
    icon: 'mdi-arrow-down-bold',
    accent: '#069E6E',
    series: monthlySeries.value.receivable,
  },
  {
    key: 'balance',
    title: 'Saldo do mês',
    value: formatCurrency(balance.value),
    icon: 'mdi-scale-balance',
    accent: balance.value >= 0 ? '#00BAB4' : '#F4A261',
    series: monthlySeries.value.balance,
  },
  {
    key: 'overdue',
    title: 'Vencidas',
    value: String(overdue.value),
    icon: 'mdi-alert-octagon-outline',
    accent: '#F4A261',
    series: overdueSeries.value,
  },
])
</script>

<template>
  <v-row>
    <v-col v-for="card in cards" :key="card.key" cols="12" sm="6" md="3">
      <v-card class="glass-card summary-card pa-4 h-100">
        <div class="accent-bar" :style="{ background: card.accent, boxShadow: `0 0 16px ${card.accent}55` }"></div>
        <div class="d-flex align-start justify-space-between mb-2">
          <div>
            <div class="text-caption text-uppercase mb-2" style="letter-spacing: 0.08em; color: #8E94B0">
              {{ card.title }}
            </div>
            <div class="text-h5 font-weight-bold money-value" style="color: #E5E7F0">
              {{ card.value }}
            </div>
          </div>
          <div
            class="icon-box"
            :style="{ background: `linear-gradient(135deg, ${card.accent}22, ${card.accent}10)`, border: `1px solid ${card.accent}33` }"
          >
            <v-icon :icon="card.icon" :color="card.accent" size="22" />
          </div>
        </div>

        <div class="sparkline-wrap mt-2">
          <Sparkline :data="card.series" :color="card.accent" :height="40" :width="240" />
        </div>
      </v-card>
    </v-col>
  </v-row>
</template>

<style scoped>
.summary-card {
  position: relative;
  overflow: hidden;
  transition: transform 0.2s, box-shadow 0.2s;
}
.summary-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.5);
}

.accent-bar {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  opacity: 0.85;
}

.icon-box {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.sparkline-wrap {
  width: 100%;
  overflow: hidden;
}
.sparkline-wrap :deep(svg) {
  width: 100%;
  height: 40px;
}
</style>
