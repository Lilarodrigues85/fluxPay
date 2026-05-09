<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useTransactionsStore } from '../../stores/transactions'
import { useExpensesStore } from '../../stores/expenses'
import { useSavingsStore } from '../../stores/savings'
import { useBudgetsStore } from '../../stores/budgets'
import { useSnapshotsStore } from '../../stores/snapshots'
import { usePreferencesStore } from '../../stores/preferences'
import { computeHealthScore } from '../../utils/insights'

const router = useRouter()
const txStore = useTransactionsStore()
const expensesStore = useExpensesStore()
const savingsStore = useSavingsStore()
const budgetsStore = useBudgetsStore()
const snapshotsStore = useSnapshotsStore()
const prefs = usePreferencesStore()

const health = computed(() =>
  computeHealthScore(
    txStore.transactions,
    expensesStore.items,
    savingsStore.items,
    budgetsStore.items,
    snapshotsStore.items,
    prefs.monthStartDay
  )
)

const SIZE = 110
const STROKE = 8
const RADIUS = (SIZE - STROKE) / 2
const CIRC = 2 * Math.PI * RADIUS
const dashOffset = computed(() => CIRC - (health.value.score / 100) * CIRC)

const color = computed(() => {
  switch (health.value.classification) {
    case 'excellent': return '#069E6E'
    case 'good':      return '#00BAB4'
    case 'warning':   return '#F4A261'
    case 'critical':  return '#FF4D6D'
  }
})
</script>

<template>
  <v-card class="glass-card mini-health pa-4 h-100" @click="router.push('/analise')" style="cursor: pointer">
    <div class="card-glow" :style="{ background: `radial-gradient(ellipse 70% 100% at 0% 50%, ${color}25, transparent 60%)` }"></div>

    <div class="d-flex align-center position-relative" style="z-index: 1">
      <div class="gauge-wrap mr-3">
        <svg :width="SIZE" :height="SIZE" :viewBox="`0 0 ${SIZE} ${SIZE}`" style="overflow: visible">
          <circle
            :cx="SIZE / 2"
            :cy="SIZE / 2"
            :r="RADIUS"
            fill="none"
            stroke="rgba(62, 121, 150, 0.15)"
            :stroke-width="STROKE"
          />
          <circle
            :cx="SIZE / 2"
            :cy="SIZE / 2"
            :r="RADIUS"
            fill="none"
            :stroke="color"
            :stroke-width="STROKE"
            stroke-linecap="round"
            :stroke-dasharray="CIRC"
            :stroke-dashoffset="dashOffset"
            :transform="`rotate(-90 ${SIZE / 2} ${SIZE / 2})`"
            class="gauge-arc"
            :style="{ filter: `drop-shadow(0 0 6px ${color}aa)` }"
          />
        </svg>
        <div class="gauge-center">
          <div class="score-value" :style="{ color }">{{ health.score }}</div>
        </div>
      </div>

      <div class="flex-grow-1" style="min-width: 0">
        <div class="text-caption text-uppercase mb-1" style="letter-spacing: 0.1em; color: #8E94B0">
          Saúde financeira
        </div>
        <div class="text-h6 mb-1" :style="{ color, fontFamily: 'Space Grotesk' }">
          {{ health.classificationLabel }}
        </div>
        <div class="text-caption" style="color: var(--text-muted)">
          Toque pra ver detalhes
          <v-icon size="14" class="ml-1">mdi-arrow-right</v-icon>
        </div>
      </div>
    </div>
  </v-card>
</template>

<style scoped>
.mini-health {
  position: relative;
  overflow: hidden;
  transition: transform 0.2s, box-shadow 0.2s;
}
.mini-health:hover {
  transform: translateY(-2px);
}

.card-glow {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.gauge-wrap {
  position: relative;
  width: 110px;
  height: 110px;
  flex-shrink: 0;
}

.gauge-center {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.score-value {
  font-family: 'Space Grotesk', sans-serif;
  font-size: 1.8rem;
  font-weight: 700;
  letter-spacing: -0.04em;
  line-height: 1;
  font-feature-settings: 'tnum';
}

.gauge-arc {
  transition: stroke-dashoffset 1s cubic-bezier(0.16, 1, 0.3, 1);
}
</style>
