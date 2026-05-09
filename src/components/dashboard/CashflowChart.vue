<script setup lang="ts">
import { computed } from 'vue'
import { Line } from 'vue-chartjs'
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Filler,
  type ScriptableContext,
} from 'chart.js'
import { useTransactionsStore } from '../../stores/transactions'
import { getNextNMonths, formatMonth } from '../../utils/dates'
import { startOfMonth, endOfMonth } from 'date-fns'

ChartJS.register(Title, Tooltip, Legend, LineElement, PointElement, CategoryScale, LinearScale, Filler)

// Plugin: glow nas linhas
const glowPlugin = {
  id: 'glowLine',
  beforeDatasetDraw: (chart: ChartJS, args: { meta: { dataset?: { options?: { borderColor?: string } } } }) => {
    const { ctx } = chart
    const color = args.meta?.dataset?.options?.borderColor as string
    if (!color) return
    ctx.save()
    ctx.shadowColor = color
    ctx.shadowBlur = 14
    ctx.shadowOffsetX = 0
    ctx.shadowOffsetY = 0
  },
  afterDatasetDraw: (chart: ChartJS) => {
    chart.ctx.restore()
  },
}

// Plugin: linha vertical no hover (crosshair)
const crosshairPlugin = {
  id: 'crosshair',
  afterDraw: (chart: ChartJS) => {
    const active = chart.tooltip?.getActiveElements()
    if (!active || active.length === 0) return
    const { ctx, chartArea } = chart
    const x = active[0].element.x
    ctx.save()
    ctx.beginPath()
    ctx.setLineDash([4, 4])
    ctx.strokeStyle = 'rgba(0, 186, 180, 0.4)'
    ctx.lineWidth = 1
    ctx.moveTo(x, chartArea.top)
    ctx.lineTo(x, chartArea.bottom)
    ctx.stroke()
    ctx.restore()
  },
}

ChartJS.register(glowPlugin, crosshairPlugin)

const txStore = useTransactionsStore()

const monthlyData = computed(() => {
  const months = getNextNMonths(6)
  const labels = months.map((m) => formatMonth(m.getTime()))

  const payableData = months.map((m) => {
    const start = startOfMonth(m).getTime()
    const end = endOfMonth(m).getTime()
    return txStore.transactions
      .filter((t) => t.type === 'payable' && t.dueDate >= start && t.dueDate <= end)
      .reduce((sum, t) => sum + t.amount, 0)
  })

  const receivableData = months.map((m) => {
    const start = startOfMonth(m).getTime()
    const end = endOfMonth(m).getTime()
    return txStore.transactions
      .filter((t) => t.type === 'receivable' && t.dueDate >= start && t.dueDate <= end)
      .reduce((sum, t) => sum + t.amount, 0)
  })

  return { labels, payableData, receivableData }
})

const balance = computed(() =>
  monthlyData.value.receivableData.reduce((s, v) => s + v, 0) -
  monthlyData.value.payableData.reduce((s, v) => s + v, 0)
)

const chartData = computed(() => ({
  labels: monthlyData.value.labels,
  datasets: [
    {
      label: 'A receber',
      data: monthlyData.value.receivableData,
      borderColor: '#00BAB4',
      backgroundColor: (ctx: ScriptableContext<'line'>) => {
        const { ctx: c, chartArea } = ctx.chart
        if (!chartArea) return 'rgba(0, 186, 180, 0.1)'
        const gradient = c.createLinearGradient(0, chartArea.top, 0, chartArea.bottom)
        gradient.addColorStop(0, 'rgba(0, 186, 180, 0.55)')
        gradient.addColorStop(0.6, 'rgba(0, 186, 180, 0.12)')
        gradient.addColorStop(1, 'rgba(0, 186, 180, 0)')
        return gradient
      },
      fill: true,
      tension: 0.42,
      borderWidth: 2.5,
      pointBackgroundColor: '#00BAB4',
      pointBorderColor: 'rgba(0, 186, 180, 0.25)',
      pointBorderWidth: 6,
      pointRadius: 4,
      pointHoverRadius: 7,
      pointHoverBorderWidth: 10,
    },
    {
      label: 'A pagar',
      data: monthlyData.value.payableData,
      borderColor: '#FF4D6D',
      backgroundColor: (ctx: ScriptableContext<'line'>) => {
        const { ctx: c, chartArea } = ctx.chart
        if (!chartArea) return 'rgba(255, 77, 109, 0.1)'
        const gradient = c.createLinearGradient(0, chartArea.top, 0, chartArea.bottom)
        gradient.addColorStop(0, 'rgba(255, 77, 109, 0.45)')
        gradient.addColorStop(0.6, 'rgba(255, 77, 109, 0.1)')
        gradient.addColorStop(1, 'rgba(255, 77, 109, 0)')
        return gradient
      },
      fill: true,
      tension: 0.42,
      borderWidth: 2.5,
      pointBackgroundColor: '#FF4D6D',
      pointBorderColor: 'rgba(255, 77, 109, 0.25)',
      pointBorderWidth: 6,
      pointRadius: 4,
      pointHoverRadius: 7,
      pointHoverBorderWidth: 10,
    },
  ],
}))

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  interaction: {
    mode: 'index' as const,
    intersect: false,
  },
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: 'rgba(15, 16, 35, 0.95)',
      borderColor: 'rgba(0, 186, 180, 0.35)',
      borderWidth: 1,
      titleColor: '#00BAB4',
      bodyColor: '#E5E7F0',
      padding: 14,
      cornerRadius: 10,
      displayColors: true,
      boxWidth: 8,
      boxHeight: 8,
      boxPadding: 6,
      titleFont: { family: 'Space Grotesk', weight: 'bold' as const, size: 12 },
      bodyFont: { family: 'Space Grotesk', size: 13 },
      callbacks: {
        label: (ctx: { dataset: { label?: string }; parsed: { y: number | null } }) => {
          const label = ctx.dataset.label || ''
          const val = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(ctx.parsed.y ?? 0)
          return ` ${label}: ${val}`
        },
      },
    },
  },
  scales: {
    x: {
      grid: { display: false },
      border: { color: 'rgba(62, 121, 150, 0.2)' },
      ticks: {
        color: '#8E94B0',
        font: { family: 'Inter', size: 11 },
        padding: 8,
      },
    },
    y: {
      beginAtZero: true,
      grid: {
        color: 'rgba(62, 121, 150, 0.08)',
        drawTicks: false,
      },
      border: { display: false },
      ticks: {
        color: '#5C6480',
        font: { family: 'Space Grotesk', size: 10 },
        padding: 12,
        callback: (val: string | number) => {
          const n = Number(val)
          if (n >= 1000) return `R$ ${(n / 1000).toFixed(0)}k`
          return `R$ ${n}`
        },
      },
    },
  },
  elements: {
    line: { borderJoinStyle: 'round' as const, borderCapStyle: 'round' as const },
  },
  animations: progressiveAnimation(),
}

function progressiveAnimation() {
  const totalDuration = 1400
  const points = 6
  const stepDuration = totalDuration / points
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const previousY = (ctx: any) =>
    ctx.index === 0
      ? ctx.chart.scales.y.getPixelForValue(0)
      : ctx.chart.getDatasetMeta(ctx.datasetIndex).data[ctx.index - 1].getProps(['y'], true).y
  return {
    x: {
      type: 'number',
      easing: 'linear',
      duration: stepDuration,
      from: NaN,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delay(ctx: any) {
        if (ctx.type !== 'data' || ctx.xStarted) return 0
        ctx.xStarted = true
        return ctx.index * stepDuration
      },
    },
    y: {
      type: 'number',
      easing: 'easeOutCubic',
      duration: stepDuration,
      from: previousY,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delay(ctx: any) {
        if (ctx.type !== 'data' || ctx.yStarted) return 0
        ctx.yStarted = true
        return ctx.index * stepDuration
      },
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any
}

const formatBRL = (val: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(val)

const totalReceivable = computed(() => monthlyData.value.receivableData.reduce((s, v) => s + v, 0))
const totalPayable = computed(() => monthlyData.value.payableData.reduce((s, v) => s + v, 0))
</script>

<template>
  <v-card class="glass-card chart-card pa-2">
    <v-card-title class="d-flex align-center pb-2">
      <div class="title-marker mr-3"></div>
      <div>
        <div class="text-caption text-uppercase" style="letter-spacing: 0.12em; color: #8E94B0">
          Forecast 6M
        </div>
        <div style="font-family: 'Space Grotesk'; letter-spacing: -0.01em; font-size: 1.1rem; font-weight: 600">
          Fluxo dos próximos 6 meses
        </div>
      </div>
      <v-spacer />
      <div class="d-flex ga-4 chart-stats">
        <div class="text-right">
          <div class="text-caption stat-label">A receber</div>
          <div class="font-mono stat-value money-value" style="color: #00BAB4">{{ formatBRL(totalReceivable) }}</div>
        </div>
        <div class="text-right">
          <div class="text-caption stat-label">A pagar</div>
          <div class="font-mono stat-value money-value" style="color: #FF4D6D">{{ formatBRL(totalPayable) }}</div>
        </div>
        <div class="text-right">
          <div class="text-caption stat-label">Saldo</div>
          <div class="font-mono stat-value money-value" :style="{ color: balance >= 0 ? '#069E6E' : '#F4A261' }">
            {{ formatBRL(balance) }}
          </div>
        </div>
      </div>
    </v-card-title>

    <div class="d-flex ga-4 px-4 pb-2">
      <div class="legend-pill">
        <span class="dot" style="background: #00BAB4; box-shadow: 0 0 8px #00BAB4"></span>
        A receber
      </div>
      <div class="legend-pill">
        <span class="dot" style="background: #FF4D6D; box-shadow: 0 0 8px #FF4D6D"></span>
        A pagar
      </div>
    </div>

    <v-card-text class="pt-0">
      <div style="height: 320px; position: relative">
        <Line :data="chartData" :options="chartOptions" />
      </div>
    </v-card-text>
  </v-card>
</template>

<style scoped>
.chart-card {
  position: relative;
  overflow: hidden;
}
.chart-card::before {
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

.chart-stats .stat-label {
  font-size: 0.65rem !important;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: #8E94B0;
}
.chart-stats .stat-value {
  font-size: 0.95rem;
  font-weight: 600;
  font-feature-settings: 'tnum';
}

.legend-pill {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 0.78rem;
  color: #B6BBD0;
  padding: 4px 10px;
  border-radius: 999px;
  background: rgba(45, 46, 71, 0.6);
  border: 1px solid rgba(62, 121, 150, 0.2);
}
.legend-pill .dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.font-mono {
  font-family: 'Space Grotesk', monospace;
}

@media (max-width: 700px) {
  .chart-stats {
    display: none !important;
  }
}
</style>
