<script setup lang="ts">
import { computed } from 'vue'
import { useTransactionsStore } from '../../stores/transactions'
import { useExpensesStore } from '../../stores/expenses'
import { usePreferencesStore } from '../../stores/preferences'
import { computeTopExpenses } from '../../utils/insights'
import { formatCurrency } from '../../utils/currency'
import { formatDate } from '../../utils/dates'

const txStore = useTransactionsStore()
const expensesStore = useExpensesStore()
const prefs = usePreferencesStore()

const top = computed(() =>
  computeTopExpenses(txStore.transactions, expensesStore.items, prefs.monthStartDay, 5)
)
</script>

<template>
  <v-card class="glass-card top-card pa-5 h-100">
    <div class="d-flex align-center mb-4">
      <div class="title-marker mr-3"></div>
      <div>
        <div class="text-caption text-uppercase" style="letter-spacing: 0.12em; color: #8E94B0">
          Ranking
        </div>
        <div style="font-family: 'Space Grotesk'; letter-spacing: -0.01em; font-size: 1.1rem; font-weight: 600">
          Top 5 maiores gastos do mês
        </div>
      </div>
    </div>

    <div v-if="top.length === 0" class="text-center py-6" style="color: #8E94B0">
      <v-icon size="40" style="opacity: 0.4">mdi-cash-off</v-icon>
      <div class="text-body-2 mt-2">Sem gastos registrados este mês</div>
    </div>

    <div v-else class="d-flex flex-column ga-2">
      <div v-for="(item, i) in top" :key="item.id" class="top-row">
        <div class="rank-circle" :class="{ first: i === 0 }">{{ i + 1 }}</div>
        <div class="flex-grow-1" style="overflow: hidden">
          <div class="d-flex align-center">
            <span class="text-body-2 font-weight-medium text-truncate">{{ item.description }}</span>
            <v-chip size="x-small" variant="outlined" class="ml-2 cat-chip">
              {{ item.category }}
            </v-chip>
            <v-icon
              v-if="item.source === 'payable'"
              size="12"
              color="primary"
              class="ml-1"
              title="Conta a pagar"
            >mdi-arrow-up-bold-circle-outline</v-icon>
          </div>
          <div class="text-caption" style="color: #8E94B0">{{ formatDate(item.date) }}</div>
        </div>
        <div class="font-mono money-value" style="color: #FF4D6D; font-weight: 600">
          {{ formatCurrency(item.amount) }}
        </div>
      </div>
    </div>
  </v-card>
</template>

<style scoped>
.top-card {
  position: relative;
  overflow: hidden;
}

.title-marker {
  width: 4px;
  height: 36px;
  border-radius: 2px;
  background: linear-gradient(180deg, #FF4D6D, #F4A261);
  box-shadow: 0 0 12px rgba(255, 77, 109, 0.5);
}

.top-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px;
  background: rgba(15, 16, 35, 0.4);
  border: 1px solid rgba(62, 121, 150, 0.15);
  border-radius: 10px;
}

.rank-circle {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(62, 121, 150, 0.18);
  color: #8E94B0;
  font-family: 'Space Grotesk', sans-serif;
  font-weight: 700;
  font-size: 0.85rem;
  flex-shrink: 0;
}

.rank-circle.first {
  background: linear-gradient(135deg, #FF4D6D, #F4A261);
  color: white;
  box-shadow: 0 0 10px rgba(255, 77, 109, 0.5);
}

.cat-chip {
  font-size: 0.65rem !important;
  height: 18px !important;
  border-color: rgba(0, 186, 180, 0.4) !important;
  color: #00BAB4 !important;
  flex-shrink: 0;
}

.font-mono {
  font-family: 'Space Grotesk', monospace;
  font-feature-settings: 'tnum';
}
</style>
