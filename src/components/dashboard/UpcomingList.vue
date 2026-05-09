<script setup lang="ts">
import { computed } from 'vue'
import { useTransactionsStore } from '../../stores/transactions'
import { formatCurrency } from '../../utils/currency'
import { formatDate, endOfNthMonthAhead } from '../../utils/dates'

const txStore = useTransactionsStore()

const upcoming = computed(() => {
  const limit = endOfNthMonthAhead(6)
  return txStore.transactions
    .filter((t) => t.status !== 'paid' && t.dueDate <= limit)
    .sort((a, b) => a.dueDate - b.dueDate)
})
</script>

<template>
  <v-card class="glass-card pa-2 h-100">
    <v-card-title class="d-flex align-center pb-2">
      <v-icon color="primary" class="mr-2">mdi-clock-outline</v-icon>
      <span style="font-family: 'Space Grotesk'; letter-spacing: -0.01em">Próximos 6 meses</span>
    </v-card-title>
    <div v-if="upcoming.length > 0" class="upcoming-scroll">
      <div
        v-for="tx in upcoming"
        :key="tx.id"
        class="upcoming-item d-flex align-center px-4 py-3"
      >
        <div
          class="type-dot mr-3"
          :class="tx.type === 'payable' ? 'dot-payable' : 'dot-receivable'"
        ></div>
        <div class="flex-grow-1" style="overflow: hidden">
          <div class="text-body-2 font-weight-medium text-truncate">{{ tx.description }}</div>
          <div class="text-caption" style="color: #8E94B0">{{ formatDate(tx.dueDate) }}</div>
        </div>
        <strong
          class="ml-2 font-mono money-value"
          :style="{ color: tx.type === 'payable' ? '#FF4D6D' : '#069E6E' }"
        >
          {{ tx.type === 'payable' ? '−' : '+' }} {{ formatCurrency(tx.amount) }}
        </strong>
      </div>
    </div>
    <v-card-text v-else class="text-center py-8" style="color: #8E94B0">
      <v-icon size="48" class="mb-2" style="opacity: 0.4">mdi-calendar-blank</v-icon>
      <div>Nenhum vencimento nos próximos 6 meses</div>
    </v-card-text>
  </v-card>
</template>

<style scoped>
.upcoming-scroll {
  max-height: 380px;
  overflow-y: auto;
}

.upcoming-item {
  border-top: 1px solid rgba(62, 121, 150, 0.12);
  transition: background 0.15s;
}
.upcoming-item:hover {
  background: rgba(0, 186, 180, 0.05);
}

.type-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}
.dot-payable {
  background: #FF4D6D;
  box-shadow: 0 0 8px rgba(255, 77, 109, 0.6);
}
.dot-receivable {
  background: #069E6E;
  box-shadow: 0 0 8px rgba(6, 158, 110, 0.6);
}

.font-mono {
  font-family: 'Space Grotesk', monospace;
  font-feature-settings: 'tnum';
}
</style>
