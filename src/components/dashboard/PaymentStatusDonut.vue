<script setup lang="ts">
import { computed } from 'vue'
import { Doughnut } from 'vue-chartjs'
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  type ChartOptions,
} from 'chart.js'
import { useTransactionsStore } from '../../stores/transactions'
import { formatCurrency } from '../../utils/currency'

ChartJS.register(ArcElement, Tooltip, Legend)

// Plugin: glow nos arcos
const arcGlowPlugin = {
  id: 'arcGlow',
  beforeDatasetDraw: (chart: ChartJS) => {
    const { ctx } = chart
    ctx.save()
    ctx.shadowBlur = 18
    ctx.shadowColor = 'rgba(0, 186, 180, 0.35)'
  },
  afterDatasetDraw: (chart: ChartJS) => {
    chart.ctx.restore()
  },
}

ChartJS.register(arcGlowPlugin)

const txStore = useTransactionsStore()

const buckets = computed(() => {
  let paid = 0
  let pending = 0
  let overdue = 0
  for (const t of txStore.transactions) {
    if (t.status === 'paid') paid += t.amount
    else if (t.status === 'overdue') overdue += t.amount
    else pending += t.amount
  }
  return { paid, pending, overdue }
})

const total = computed(() => buckets.value.paid + buckets.value.pending + buckets.value.overdue)
const paidPct = computed(() =>
  total.value > 0 ? (buckets.value.paid / total.value) * 100 : 0
)

const chartData = computed(() => ({
  labels: ['Pago', 'Pendente', 'Vencido'],
  datasets: [
    {
      data: [buckets.value.paid, buckets.value.pending, buckets.value.overdue],
      backgroundColor: ['#069E6E', '#00BAB4', '#FF4D6D'],
      borderColor: 'rgba(15, 16, 35, 0.9)',
      borderWidth: 2,
      hoverOffset: 8,
      hoverBorderColor: '#0F1023',
    },
  ],
}))

const chartOptions: ChartOptions<'doughnut'> = {
  responsive: true,
  maintainAspectRatio: false,
  cutout: '74%',
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: 'rgba(15, 16, 35, 0.95)',
      borderColor: 'rgba(0, 186, 180, 0.35)',
      borderWidth: 1,
      titleColor: '#00BAB4',
      bodyColor: '#E5E7F0',
      padding: 12,
      cornerRadius: 10,
      displayColors: true,
      boxWidth: 8,
      boxHeight: 8,
      titleFont: { family: 'Space Grotesk', weight: 'bold', size: 12 },
      bodyFont: { family: 'Space Grotesk', size: 12 },
      callbacks: {
        label: (ctx) => {
          const val = ctx.parsed
          const t = total.value
          const pct = t > 0 ? ((val / t) * 100).toFixed(1) : '0.0'
          return ` ${ctx.label}: ${formatCurrency(val)} (${pct}%)`
        },
      },
    },
  },
  animation: {
    duration: 1100,
    easing: 'easeOutQuart',
  },
}

const legend = computed(() => [
  { label: 'Pago',     value: buckets.value.paid,     color: '#069E6E' },
  { label: 'Pendente', value: buckets.value.pending,  color: '#00BAB4' },
  { label: 'Vencido',  value: buckets.value.overdue,  color: '#FF4D6D' },
])
</script>

<template>
  <v-card class="glass-card donut-card pa-2 h-100">
    <v-card-title class="d-flex align-center pb-2">
      <div class="title-marker mr-3"></div>
      <div>
        <div class="text-caption text-uppercase" style="letter-spacing: 0.12em; color: #8E94B0">
          Status
        </div>
        <div style="font-family: 'Space Grotesk'; letter-spacing: -0.01em; font-size: 1.1rem; font-weight: 600">
          Pago vs pendente
        </div>
      </div>
    </v-card-title>

    <v-card-text class="pt-0">
      <div class="donut-stage" v-if="total > 0">
        <div class="donut-canvas">
          <Doughnut :data="chartData" :options="chartOptions" />
          <div class="donut-center">
            <div class="text-caption text-uppercase" style="letter-spacing: 0.1em; color: #8E94B0">
              Pago
            </div>
            <div class="center-pct font-mono">
              {{ paidPct.toFixed(0) }}<span style="font-size: 0.55em; color: #8E94B0">%</span>
            </div>
            <div class="text-caption money-value" style="color: #B6BBD0">
              de {{ formatCurrency(total) }}
            </div>
          </div>
        </div>

        <div class="donut-legend">
          <div v-for="item in legend" :key="item.label" class="legend-row">
            <span class="legend-dot" :style="{ background: item.color, boxShadow: `0 0 8px ${item.color}` }"></span>
            <span class="text-body-2 flex-grow-1">{{ item.label }}</span>
            <span class="text-body-2 font-mono money-value" :style="{ color: item.color }">
              {{ formatCurrency(item.value) }}
            </span>
          </div>
        </div>
      </div>

      <div v-else class="text-center py-8">
        <v-icon size="48" color="primary" style="opacity: 0.5">mdi-chart-donut</v-icon>
        <div class="text-body-2 mt-2" style="color: #8E94B0">
          Sem transações cadastradas ainda
        </div>
      </div>
    </v-card-text>
  </v-card>
</template>

<style scoped>
.donut-card {
  position: relative;
  overflow: hidden;
}
.donut-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, #00BAB4, transparent);
  opacity: 0.6;
}

.title-marker {
  width: 4px;
  height: 36px;
  border-radius: 2px;
  background: linear-gradient(180deg, #00BAB4, #069E6E);
  box-shadow: 0 0 12px rgba(0, 186, 180, 0.5);
}

.donut-stage {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.donut-canvas {
  position: relative;
  height: 220px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.donut-center {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}

.center-pct {
  font-size: 2.6rem;
  font-weight: 700;
  letter-spacing: -0.04em;
  background: linear-gradient(90deg, #00BAB4, #069E6E);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  font-feature-settings: 'tnum';
  line-height: 1;
}

.donut-legend {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  padding: 0 0.5rem;
}

.legend-row {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.4rem 0.6rem;
  border-radius: 8px;
  background: rgba(45, 46, 71, 0.4);
  border: 1px solid rgba(62, 121, 150, 0.15);
  transition: background 0.15s;
}
.legend-row:hover {
  background: rgba(45, 46, 71, 0.7);
}

.legend-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.font-mono {
  font-family: 'Space Grotesk', monospace;
}
</style>
