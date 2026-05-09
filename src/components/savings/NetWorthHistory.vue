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
import { useSnapshotsStore } from '../../stores/snapshots'

ChartJS.register(Title, Tooltip, Legend, LineElement, PointElement, CategoryScale, LinearScale, Filler)

const snapshotsStore = useSnapshotsStore()

const chartData = computed(() => {
  const items = snapshotsStore.items
  const labels = items.map((s) => {
    const [y, m] = s.yearMonth.split('-')
    const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
    return `${monthNames[parseInt(m, 10) - 1]}/${y.slice(2)}`
  })

  return {
    labels,
    datasets: [
      {
        label: 'Investido',
        data: items.map((s) => s.invested),
        borderColor: '#069E6E',
        backgroundColor: (ctx: ScriptableContext<'line'>) => {
          const { ctx: c, chartArea } = ctx.chart
          if (!chartArea) return 'rgba(6, 158, 110, 0.1)'
          const g = c.createLinearGradient(0, chartArea.top, 0, chartArea.bottom)
          g.addColorStop(0, 'rgba(6, 158, 110, 0.5)')
          g.addColorStop(1, 'rgba(6, 158, 110, 0)')
          return g
        },
        fill: true,
        tension: 0.4,
        borderWidth: 2.5,
        pointBackgroundColor: '#069E6E',
        pointBorderColor: 'rgba(6, 158, 110, 0.25)',
        pointBorderWidth: 5,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
      {
        label: 'Conta corrente',
        data: items.map((s) => s.checking),
        borderColor: '#00BAB4',
        backgroundColor: (ctx: ScriptableContext<'line'>) => {
          const { ctx: c, chartArea } = ctx.chart
          if (!chartArea) return 'rgba(0, 186, 180, 0.1)'
          const g = c.createLinearGradient(0, chartArea.top, 0, chartArea.bottom)
          g.addColorStop(0, 'rgba(0, 186, 180, 0.4)')
          g.addColorStop(1, 'rgba(0, 186, 180, 0)')
          return g
        },
        fill: true,
        tension: 0.4,
        borderWidth: 2.5,
        pointBackgroundColor: '#00BAB4',
        pointBorderColor: 'rgba(0, 186, 180, 0.25)',
        pointBorderWidth: 5,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
    ],
  }
})

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  interaction: { mode: 'index' as const, intersect: false },
  plugins: {
    legend: {
      position: 'top' as const,
      labels: { color: '#E5E7F0', font: { family: 'Inter', size: 12 }, usePointStyle: true, boxWidth: 8, padding: 16 },
    },
    tooltip: {
      backgroundColor: 'rgba(15, 16, 35, 0.95)',
      borderColor: 'rgba(0, 186, 180, 0.35)',
      borderWidth: 1,
      titleColor: '#00BAB4',
      bodyColor: '#E5E7F0',
      padding: 12,
      cornerRadius: 10,
      titleFont: { family: 'Space Grotesk', weight: 'bold' as const },
      bodyFont: { family: 'Space Grotesk' },
      callbacks: {
        label: (ctx: { dataset: { label?: string }; parsed: { y: number | null } }) => {
          const v = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(ctx.parsed.y ?? 0)
          return ` ${ctx.dataset.label}: ${v}`
        },
      },
    },
  },
  scales: {
    x: {
      grid: { display: false },
      border: { color: 'rgba(62, 121, 150, 0.2)' },
      ticks: { color: '#8E94B0', font: { family: 'Inter', size: 11 } },
    },
    y: {
      beginAtZero: true,
      grid: { color: 'rgba(62, 121, 150, 0.08)' },
      border: { display: false },
      ticks: {
        color: '#5C6480',
        font: { family: 'Space Grotesk', size: 10 },
        callback: (val: string | number) => {
          const n = Number(val)
          if (n >= 1000) return `R$ ${(n / 1000).toFixed(0)}k`
          return `R$ ${n}`
        },
      },
    },
  },
}

const hasEnoughData = computed(() => snapshotsStore.items.length >= 2)
</script>

<template>
  <v-card class="glass-card history-card pa-2">
    <v-card-title class="d-flex align-center pb-2">
      <div class="title-marker mr-3"></div>
      <div>
        <div class="text-caption text-uppercase" style="letter-spacing: 0.12em; color: #8E94B0">
          Evolução
        </div>
        <div style="font-family: 'Space Grotesk'; letter-spacing: -0.01em; font-size: 1.1rem; font-weight: 600">
          Patrimônio ao longo do tempo
        </div>
      </div>
    </v-card-title>

    <v-card-text class="pt-0">
      <div v-if="hasEnoughData" style="height: 280px; position: relative">
        <Line :data="chartData" :options="chartOptions" />
      </div>
      <div v-else class="text-center py-8" style="color: #8E94B0">
        <v-icon size="48" color="primary" style="opacity: 0.5">mdi-chart-timeline-variant</v-icon>
        <div class="text-body-2 mt-2">
          {{ snapshotsStore.items.length === 0
            ? 'Snapshots começam a ser registrados quando você cadastra aplicações.'
            : 'Ainda só há 1 mês registrado. O gráfico aparece a partir do segundo mês.' }}
        </div>
      </div>
    </v-card-text>
  </v-card>
</template>

<style scoped>
.history-card {
  position: relative;
  overflow: hidden;
}
.history-card::before {
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
</style>
