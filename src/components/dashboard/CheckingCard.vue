<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useSavingsStore } from '../../stores/savings'
import { useExpensesStore } from '../../stores/expenses'
import { formatCurrency } from '../../utils/currency'
import { formatDate } from '../../utils/dates'

const router = useRouter()
const savingsStore = useSavingsStore()
const expensesStore = useExpensesStore()

const checkingTotal = computed(() => savingsStore.checkingTotal)
const checkingItems = computed(() => savingsStore.checkingItems)
const lastUpdate = computed(() => {
  const dates = checkingItems.value.map((s) => s.lastValueUpdate).filter(Boolean)
  return dates.length > 0 ? Math.max(...dates) : null
})
const projected = computed(() => checkingTotal.value - expensesStore.monthTotal)
</script>

<template>
  <v-card class="glass-card checking-card pa-5 h-100">
    <div class="checking-glow"></div>

    <div class="d-flex align-center mb-3 position-relative" style="z-index: 1">
      <div class="title-marker mr-3"></div>
      <div class="flex-grow-1">
        <div class="text-caption text-uppercase" style="letter-spacing: 0.12em; color: #8E94B0">
          Dinheiro do mês vigente
        </div>
        <div class="text-caption" style="color: #B6BBD0">
          Saldo das contas correntes
        </div>
      </div>
      <v-btn
        icon="mdi-pencil"
        size="small"
        variant="text"
        color="primary"
        title="Atualizar saldo"
        @click="router.push('/patrimonio')"
      />
    </div>

    <div class="position-relative mb-3" style="z-index: 1">
      <div class="checking-value font-mono money-value">
        {{ formatCurrency(checkingTotal) }}
      </div>
      <div v-if="lastUpdate" class="text-caption mt-1" style="color: #5C6480">
        <v-icon size="12" class="mr-1">mdi-update</v-icon>
        atualizado em {{ formatDate(lastUpdate) }}
      </div>
    </div>

    <v-divider style="border-color: rgba(62, 121, 150, 0.2)" />

    <div class="d-flex justify-space-between align-center mt-3 position-relative" style="z-index: 1">
      <div>
        <div class="text-caption text-uppercase" style="letter-spacing: 0.08em; color: #8E94B0">
          Após gastos do mês
        </div>
        <div
          class="text-h6 font-mono mt-1 money-value"
          :style="{ color: projected >= 0 ? '#00BAB4' : '#FF4D6D' }"
        >
          {{ formatCurrency(projected) }}
        </div>
      </div>
      <v-icon size="32" color="primary" style="opacity: 0.4">mdi-bank-outline</v-icon>
    </div>

    <div v-if="checkingItems.length === 0" class="empty-checking mt-3 position-relative" style="z-index: 1">
      <v-icon size="18" color="warning" class="mr-2">mdi-information-outline</v-icon>
      <span class="text-caption">
        Cadastre uma conta corrente em
        <a class="text-primary" style="cursor: pointer" @click="router.push('/patrimonio')">Patrimônio</a>.
      </span>
    </div>
  </v-card>
</template>

<style scoped>
.checking-card {
  position: relative;
  overflow: hidden;
}
.checking-glow {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(ellipse 70% 80% at 0% 0%, rgba(0, 186, 180, 0.2), transparent 60%),
    radial-gradient(ellipse 50% 70% at 100% 100%, rgba(62, 121, 150, 0.15), transparent 60%);
  pointer-events: none;
}

.title-marker {
  width: 4px;
  height: 32px;
  border-radius: 2px;
  background: linear-gradient(180deg, #00BAB4, #3E7996);
  box-shadow: 0 0 12px rgba(0, 186, 180, 0.5);
}

.checking-value {
  font-size: 2rem;
  font-weight: 700;
  letter-spacing: -0.03em;
  background: linear-gradient(90deg, #00BAB4, #3E7996);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  font-feature-settings: 'tnum';
}

.empty-checking {
  display: flex;
  align-items: center;
  padding: 0.6rem 0.8rem;
  background: rgba(244, 162, 97, 0.08);
  border: 1px solid rgba(244, 162, 97, 0.25);
  border-radius: 8px;
  color: #B6BBD0;
}

.font-mono {
  font-family: 'Space Grotesk', monospace;
}
</style>
