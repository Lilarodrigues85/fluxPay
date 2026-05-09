<script setup lang="ts">
import { computed } from 'vue'
import { useTransactionsStore } from '../../stores/transactions'
import { useExpensesStore } from '../../stores/expenses'
import { useBudgetsStore } from '../../stores/budgets'
import { useSavingsStore } from '../../stores/savings'
import { useSnapshotsStore } from '../../stores/snapshots'
import { usePreferencesStore } from '../../stores/preferences'
import {
  computeMonthComparison,
  computeCategoryRanking,
  computeHealthScore,
  computeSuggestions,
  type Suggestion,
} from '../../utils/insights'

const txStore = useTransactionsStore()
const expensesStore = useExpensesStore()
const budgetsStore = useBudgetsStore()
const savingsStore = useSavingsStore()
const snapshotsStore = useSnapshotsStore()
const prefs = usePreferencesStore()

const suggestions = computed<Suggestion[]>(() => {
  const comp = computeMonthComparison(txStore.transactions, expensesStore.items, prefs.monthStartDay)
  const ranking = computeCategoryRanking(txStore.transactions, expensesStore.items, prefs.monthStartDay)
  const health = computeHealthScore(
    txStore.transactions,
    expensesStore.items,
    savingsStore.items,
    budgetsStore.items,
    snapshotsStore.items,
    prefs.monthStartDay
  )
  return computeSuggestions(
    txStore.transactions,
    expensesStore.items,
    budgetsStore.items,
    comp,
    ranking,
    health,
    prefs.monthStartDay
  )
})

function colorFor(type: Suggestion['type']): string {
  switch (type) {
    case 'positive': return '#069E6E'
    case 'warning':  return '#F4A261'
    case 'critical': return '#FF4D6D'
    case 'info':     return '#00BAB4'
  }
}
</script>

<template>
  <v-card class="glass-card sug-card pa-5">
    <div class="d-flex align-center mb-4">
      <div class="title-marker mr-3"></div>
      <div>
        <div class="text-caption text-uppercase" style="letter-spacing: 0.12em; color: #8E94B0">
          Insights
        </div>
        <div style="font-family: 'Space Grotesk'; letter-spacing: -0.01em; font-size: 1.1rem; font-weight: 600">
          Sugestões e alertas
        </div>
      </div>
    </div>

    <div class="d-flex flex-column ga-2">
      <div
        v-for="(s, i) in suggestions"
        :key="i"
        class="sug-row"
        :style="{ borderLeftColor: colorFor(s.type) }"
      >
        <v-icon :icon="s.icon" :color="colorFor(s.type)" size="22" class="mr-3 mt-1" />
        <div style="flex: 1; min-width: 0">
          <div class="text-body-2 font-weight-medium" :style="{ color: colorFor(s.type) }">
            {{ s.title }}
          </div>
          <div class="text-caption money-value" style="color: var(--text-muted); margin-top: 2px">
            {{ s.detail }}
          </div>
        </div>
      </div>
    </div>
  </v-card>
</template>

<style scoped>
.sug-card {
  position: relative;
  overflow: hidden;
}

.title-marker {
  width: 4px;
  height: 36px;
  border-radius: 2px;
  background: linear-gradient(180deg, #A78BFA, #00BAB4);
  box-shadow: 0 0 12px rgba(167, 139, 250, 0.5);
}

.sug-row {
  display: flex;
  align-items: flex-start;
  padding: 12px 14px;
  background: rgba(15, 16, 35, 0.4);
  border: 1px solid rgba(62, 121, 150, 0.15);
  border-left: 3px solid;
  border-radius: 10px;
  transition: background 0.2s;
}
.sug-row:hover {
  background: rgba(15, 16, 35, 0.6);
}
</style>
