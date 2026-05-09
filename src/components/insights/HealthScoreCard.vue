<script setup lang="ts">
import { computed } from 'vue'
import { useTransactionsStore } from '../../stores/transactions'
import { useExpensesStore } from '../../stores/expenses'
import { useSavingsStore } from '../../stores/savings'
import { useBudgetsStore } from '../../stores/budgets'
import { useSnapshotsStore } from '../../stores/snapshots'
import { usePreferencesStore } from '../../stores/preferences'
import { computeHealthScore } from '../../utils/insights'

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

const SIZE = 200
const STROKE = 14
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

const icon = computed(() => {
  switch (health.value.classification) {
    case 'excellent': return 'mdi-shield-check'
    case 'good':      return 'mdi-shield-half-full'
    case 'warning':   return 'mdi-shield-alert'
    case 'critical':  return 'mdi-shield-off'
  }
})
</script>

<template>
  <v-card class="glass-card health-card pa-5">
    <div class="card-glow" :style="{ background: `radial-gradient(ellipse 70% 80% at 50% 0%, ${color}30, transparent 70%)` }"></div>

    <div class="d-flex align-center mb-3 position-relative" style="z-index: 1">
      <div class="title-marker mr-3" :style="{ background: `linear-gradient(180deg, ${color}, ${color}88)`, boxShadow: `0 0 12px ${color}` }"></div>
      <div>
        <div class="text-caption text-uppercase" style="letter-spacing: 0.12em; color: #8E94B0">
          Diagnóstico
        </div>
        <div style="font-family: 'Space Grotesk'; letter-spacing: -0.01em; font-size: 1.1rem; font-weight: 600">
          Score de saúde financeira
        </div>
      </div>
    </div>

    <div class="d-flex flex-column flex-md-row align-center ga-6 position-relative" style="z-index: 1">
      <div class="gauge-wrap">
        <svg :width="SIZE" :height="SIZE" :viewBox="`0 0 ${SIZE} ${SIZE}`" style="overflow: visible">
          <defs>
            <linearGradient id="health-grad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" :stop-color="color" />
              <stop offset="1" :stop-color="color" stop-opacity="0.4" />
            </linearGradient>
          </defs>
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
            stroke="url(#health-grad)"
            :stroke-width="STROKE"
            stroke-linecap="round"
            :stroke-dasharray="CIRC"
            :stroke-dashoffset="dashOffset"
            :transform="`rotate(-90 ${SIZE / 2} ${SIZE / 2})`"
            class="gauge-arc"
            :style="{ filter: `drop-shadow(0 0 8px ${color}aa)` }"
          />
        </svg>
        <div class="gauge-center">
          <div class="score-value" :style="{ color }">{{ health.score }}</div>
          <div class="text-caption" style="color: var(--text-muted)">de 100</div>
        </div>
      </div>

      <div class="flex-grow-1" style="min-width: 0">
        <div class="d-flex align-center mb-3">
          <v-icon :icon="icon" :color="color" size="22" class="mr-2" />
          <span class="text-h6" :style="{ color, fontFamily: 'Space Grotesk', letterSpacing: '-0.01em' }">
            {{ health.classificationLabel }}
          </span>
        </div>

        <div class="breakdown">
          <div v-for="b in health.breakdown" :key="b.label" class="breakdown-row">
            <div class="d-flex justify-space-between align-center mb-1">
              <span class="text-body-2">{{ b.label }}</span>
              <span class="text-caption font-mono" style="color: var(--text-muted)">
                {{ b.earned }}<span style="opacity: 0.5">/{{ b.max }}</span>
              </span>
            </div>
            <div class="bar-mini">
              <div
                class="bar-fill"
                :style="{
                  width: ((b.earned / b.max) * 100) + '%',
                  background: b.earned === b.max ? '#069E6E' : b.earned >= b.max * 0.5 ? '#00BAB4' : '#F4A261',
                }"
              ></div>
            </div>
            <p class="text-caption mt-1 mb-0" style="color: var(--text-muted)">{{ b.description }}</p>
          </div>
        </div>
      </div>
    </div>
  </v-card>
</template>

<style scoped>
.health-card {
  position: relative;
  overflow: hidden;
}

.card-glow {
  position: absolute;
  inset: 0;
  pointer-events: none;
  transition: background 0.5s;
}

.title-marker {
  width: 4px;
  height: 36px;
  border-radius: 2px;
  flex-shrink: 0;
  transition: background 0.5s, box-shadow 0.5s;
}

.gauge-wrap {
  position: relative;
  width: 200px;
  height: 200px;
  flex-shrink: 0;
}

.gauge-center {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}

.score-value {
  font-family: 'Space Grotesk', sans-serif;
  font-size: 3.5rem;
  font-weight: 700;
  letter-spacing: -0.04em;
  line-height: 1;
  font-feature-settings: 'tnum';
}

.gauge-arc {
  transition: stroke-dashoffset 1s cubic-bezier(0.16, 1, 0.3, 1);
}

.breakdown {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.bar-mini {
  height: 4px;
  border-radius: 2px;
  background: rgba(15, 16, 35, 0.6);
  border: 1px solid rgba(62, 121, 150, 0.15);
  overflow: hidden;
}
.bar-fill {
  height: 100%;
  border-radius: 2px;
  transition: width 0.6s cubic-bezier(0.16, 1, 0.3, 1);
}

.font-mono {
  font-family: 'Space Grotesk', monospace;
  font-feature-settings: 'tnum';
}
</style>
