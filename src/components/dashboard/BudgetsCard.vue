<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useBudgetsStore } from '../../stores/budgets'
import { formatCurrency } from '../../utils/currency'

const router = useRouter()
const budgetsStore = useBudgetsStore()

const top = computed(() =>
  [...budgetsStore.budgetsWithUsage]
    .sort((a, b) => b.percent - a.percent)
    .slice(0, 5)
)

function statusColor(status: string) {
  if (status === 'over') return '#FF4D6D'
  if (status === 'warn') return '#F4A261'
  return '#069E6E'
}
</script>

<template>
  <v-card class="glass-card budgets-card pa-5 h-100">
    <div class="card-glow"></div>

    <div class="d-flex align-center mb-3 position-relative" style="z-index: 1">
      <div class="title-marker mr-3"></div>
      <div class="flex-grow-1">
        <div class="text-caption text-uppercase" style="letter-spacing: 0.12em; color: #8E94B0">
          Controle
        </div>
        <div style="font-family: 'Space Grotesk'; letter-spacing: -0.01em; font-size: 1.05rem; font-weight: 600">
          Orçamentos
        </div>
      </div>
      <v-btn
        icon="mdi-arrow-right"
        size="small"
        variant="text"
        color="primary"
        @click="router.push('/configuracoes')"
      />
    </div>

    <div v-if="top.length === 0" class="text-center py-4 position-relative" style="z-index: 1">
      <v-icon size="40" color="primary" style="opacity: 0.5">mdi-target-variant</v-icon>
      <div class="text-body-2 mt-2" style="color: #8E94B0">
        Nenhum orçamento cadastrado
      </div>
      <v-btn
        size="small"
        variant="tonal"
        color="primary"
        class="mt-3"
        prepend-icon="mdi-plus"
        @click="router.push('/configuracoes')"
      >
        Configurar
      </v-btn>
    </div>

    <div v-else class="d-flex flex-column ga-3 position-relative" style="z-index: 1">
      <div v-for="bu in top" :key="bu.budget.id" class="budget-mini">
        <div class="d-flex align-center mb-1">
          <span class="dot mr-2" :style="{ background: bu.budget.color }"></span>
          <span class="text-body-2 flex-grow-1">{{ bu.budget.category }}</span>
          <span class="text-caption font-mono" :style="{ color: statusColor(bu.status) }">
            {{ bu.percent.toFixed(0) }}%
          </span>
        </div>
        <div class="rail">
          <div
            class="fill"
            :style="{
              width: Math.min(100, bu.percent) + '%',
              background: statusColor(bu.status),
              boxShadow: `0 0 6px ${statusColor(bu.status)}66`,
            }"
          ></div>
        </div>
        <div class="d-flex justify-space-between text-caption mt-1" style="color: #8E94B0">
          <span class="money-value font-mono">{{ formatCurrency(bu.spent) }}</span>
          <span class="money-value font-mono">{{ formatCurrency(bu.budget.monthlyLimit) }}</span>
        </div>
      </div>
    </div>
  </v-card>
</template>

<style scoped>
.budgets-card {
  position: relative;
  overflow: hidden;
}
.card-glow {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(ellipse 60% 80% at 100% 0%, rgba(244, 162, 97, 0.12), transparent 60%),
    radial-gradient(ellipse 50% 70% at 0% 100%, rgba(0, 186, 180, 0.1), transparent 60%);
  pointer-events: none;
}

.title-marker {
  width: 4px;
  height: 32px;
  border-radius: 2px;
  background: linear-gradient(180deg, #00BAB4, #F4A261);
  box-shadow: 0 0 12px rgba(0, 186, 180, 0.5);
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.rail {
  height: 6px;
  border-radius: 3px;
  background: rgba(15, 16, 35, 0.6);
  border: 1px solid rgba(62, 121, 150, 0.2);
  overflow: hidden;
}
.fill {
  height: 100%;
  border-radius: 3px;
  transition: width 0.5s cubic-bezier(0.16, 1, 0.3, 1);
}

.font-mono {
  font-family: 'Space Grotesk', monospace;
  font-feature-settings: 'tnum';
}
</style>
