<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useSavingsStore } from '../../stores/savings'
import { formatCurrency } from '../../utils/currency'
import { savingsTypeMeta } from '../../utils/savings'
import type { Savings } from '../../types'

const router = useRouter()
const savingsStore = useSavingsStore()

const total = computed(() => savingsStore.investedTotal)
const investedItems = computed(() =>
  savingsStore.items.filter((s) => s.type !== 'checking')
)

const top = computed(() =>
  savingsStore.investedByType
    .map((b) => ({ ...b, meta: savingsTypeMeta(b.type as Savings['type']) }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 4)
)
</script>

<template>
  <v-card class="glass-card networth-card pa-5 h-100">
    <div class="networth-glow"></div>

    <div class="d-flex align-center mb-3 position-relative" style="z-index: 1">
      <div class="title-marker mr-3"></div>
      <div class="flex-grow-1">
        <div class="text-caption text-uppercase" style="letter-spacing: 0.12em; color: #8E94B0">
          Patrimônio guardado
        </div>
        <div class="text-caption" style="color: #B6BBD0">
          {{ investedItems.length }} aplicação(ões) investida(s)
        </div>
      </div>
      <v-btn
        icon="mdi-arrow-right"
        size="small"
        variant="text"
        color="primary"
        @click="router.push('/patrimonio')"
      />
    </div>

    <div class="position-relative mb-4" style="z-index: 1">
      <div class="networth-value font-mono money-value">
        {{ formatCurrency(total) }}
      </div>
    </div>

    <div v-if="top.length > 0" class="position-relative" style="z-index: 1">
      <div class="distribution-bar mb-3">
        <div
          v-for="(b, i) in savingsStore.investedByType.map(b => ({ ...b, meta: savingsTypeMeta(b.type as Savings['type']) }))"
          :key="i"
          class="dist-segment"
          :style="{
            width: ((b.amount / total) * 100) + '%',
            background: b.meta.color
          }"
        ></div>
      </div>

      <div class="d-flex flex-column ga-2">
        <div v-for="(b, i) in top" :key="i" class="d-flex align-center">
          <span class="dist-dot mr-2" :style="{ background: b.meta.color, boxShadow: `0 0 6px ${b.meta.color}` }"></span>
          <span class="text-body-2 flex-grow-1">{{ b.meta.label }}</span>
          <span class="text-body-2 font-mono money-value" :style="{ color: b.meta.color }">
            {{ formatCurrency(b.amount) }}
          </span>
        </div>
      </div>
    </div>

    <div v-else class="text-center py-4 position-relative" style="z-index: 1">
      <v-icon size="40" color="primary" style="opacity: 0.5">mdi-vault</v-icon>
      <div class="text-body-2 mt-2" style="color: #8E94B0">
        Nenhuma aplicação investida cadastrada
      </div>
      <v-btn
        size="small"
        variant="tonal"
        color="primary"
        class="mt-3"
        prepend-icon="mdi-plus"
        @click="router.push('/patrimonio')"
      >
        Cadastrar
      </v-btn>
    </div>
  </v-card>
</template>

<style scoped>
.networth-card {
  position: relative;
  overflow: hidden;
}
.networth-glow {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(ellipse 60% 80% at 100% 0%, rgba(0, 186, 180, 0.18), transparent 60%),
    radial-gradient(ellipse 50% 70% at 0% 100%, rgba(6, 158, 110, 0.12), transparent 60%);
  pointer-events: none;
}

.title-marker {
  width: 4px;
  height: 32px;
  border-radius: 2px;
  background: linear-gradient(180deg, #00BAB4, #069E6E);
  box-shadow: 0 0 12px rgba(0, 186, 180, 0.5);
}

.networth-value {
  font-size: 2rem;
  font-weight: 700;
  letter-spacing: -0.03em;
  background: linear-gradient(90deg, #00BAB4, #069E6E);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  font-feature-settings: 'tnum';
}

.distribution-bar {
  height: 8px;
  border-radius: 4px;
  background: rgba(15, 16, 35, 0.6);
  border: 1px solid rgba(62, 121, 150, 0.2);
  overflow: hidden;
  display: flex;
}
.dist-segment {
  height: 100%;
  transition: width 0.4s;
}

.dist-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.font-mono {
  font-family: 'Space Grotesk', monospace;
}
</style>
