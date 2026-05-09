<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import AppLayout from '../components/layout/AppLayout.vue'
import SavingsDialog from '../components/savings/SavingsDialog.vue'
import SavingsCard from '../components/savings/SavingsCard.vue'
import NetWorthHistory from '../components/savings/NetWorthHistory.vue'
import ExportDialog from '../components/common/ExportDialog.vue'
import { useSavingsStore } from '../stores/savings'
import { formatCurrency } from '../utils/currency'
import { savingsTypeMeta } from '../utils/savings'
import type { Savings } from '../types'

const route = useRoute()
const savingsStore = useSavingsStore()

const dialogOpen = ref(false)
const exportOpen = ref(false)
const editingSaving = ref<Savings | null>(null)

const totalSaved = computed(() => savingsStore.total)
const breakdown = computed(() =>
  savingsStore.byType
    .map((b) => ({ ...b, meta: savingsTypeMeta(b.type as Savings['type']) }))
    .sort((a, b) => b.amount - a.amount)
)

const openNew = () => {
  editingSaving.value = null
  dialogOpen.value = true
}

const handleEdit = (saving: Savings) => {
  editingSaving.value = saving
  dialogOpen.value = true
}

watch(() => route.query.new, (v) => { if (v) openNew() }, { immediate: true })
</script>

<template>
  <AppLayout>
    <v-container class="py-8">
      <div class="d-flex align-start mb-6">
        <div>
          <div class="text-caption text-uppercase mb-1" style="letter-spacing: 0.12em; color: #00BAB4">
            Patrimônio
          </div>
          <h1 class="text-h3">Dinheiro Guardado</h1>
        </div>
        <v-spacer />
        <v-btn
          variant="tonal"
          size="large"
          class="mr-2"
          prepend-icon="mdi-download"
          :disabled="savingsStore.items.length === 0"
          @click="exportOpen = true"
        >
          Exportar
        </v-btn>
        <v-btn color="primary" size="large" prepend-icon="mdi-plus" @click="openNew">
          Nova aplicação
        </v-btn>
      </div>

      <v-row class="mb-6">
        <v-col cols="12">
          <NetWorthHistory />
        </v-col>
      </v-row>

      <v-row class="mb-6">
        <v-col cols="12" md="5">
          <v-card class="glass-card pa-5 hero-card">
            <div class="hero-glow"></div>
            <div class="text-caption text-uppercase mb-2" style="letter-spacing: 0.12em; color: #8E94B0">
              Total guardado
            </div>
            <div class="hero-value font-mono money-value">
              {{ formatCurrency(totalSaved) }}
            </div>
            <div class="text-caption mt-2" style="color: #B6BBD0">
              {{ savingsStore.items.length }} aplicação(ões)
            </div>
          </v-card>
        </v-col>

        <v-col cols="12" md="7">
          <v-card class="glass-card pa-5 h-100">
            <div class="text-caption text-uppercase mb-3" style="letter-spacing: 0.12em; color: #8E94B0">
              Distribuição por tipo
            </div>
            <div v-if="breakdown.length === 0" class="text-body-2 text-center py-4" style="color: #8E94B0">
              Nenhuma aplicação cadastrada ainda
            </div>
            <div v-else>
              <div class="distribution-bar mb-4">
                <div
                  v-for="(b, i) in breakdown"
                  :key="i"
                  class="dist-segment"
                  :style="{
                    width: ((b.amount / totalSaved) * 100) + '%',
                    background: b.meta.color,
                    boxShadow: `inset 0 0 8px ${b.meta.color}88`
                  }"
                  :title="`${b.meta.label}: ${formatCurrency(b.amount)}`"
                ></div>
              </div>
              <div class="d-flex flex-wrap ga-3">
                <div v-for="(b, i) in breakdown" :key="i" class="dist-legend">
                  <span class="dist-dot" :style="{ background: b.meta.color, boxShadow: `0 0 8px ${b.meta.color}` }"></span>
                  <span class="text-body-2">{{ b.meta.label }}</span>
                  <span class="text-caption font-mono ml-1" style="color: #8E94B0">
                    {{ ((b.amount / totalSaved) * 100).toFixed(1) }}%
                  </span>
                </div>
              </div>
            </div>
          </v-card>
        </v-col>
      </v-row>

      <v-row v-if="savingsStore.isLoading && savingsStore.items.length === 0">
        <v-col v-for="n in 3" :key="n" cols="12" md="6" lg="4">
          <v-skeleton-loader type="article" class="glass-card" />
        </v-col>
      </v-row>

      <v-card v-else-if="savingsStore.items.length === 0" class="glass-card">
        <v-card-text class="text-center py-12">
          <v-icon size="64" color="primary" style="opacity: 0.6">mdi-vault</v-icon>
          <div class="text-h6 mt-4">Nenhuma aplicação cadastrada</div>
          <p class="text-body-2 mt-2" style="color: #8E94B0">
            Cadastre onde seu dinheiro está guardado ou investido para acompanhar seu patrimônio.
          </p>
        </v-card-text>
      </v-card>

      <v-row v-else>
        <v-col v-for="saving in savingsStore.items" :key="saving.id" cols="12" md="6" lg="4">
          <SavingsCard :saving="saving" :total-all="totalSaved" @edit="handleEdit" />
        </v-col>
      </v-row>

      <SavingsDialog v-model="dialogOpen" :saving="editingSaving" />
      <ExportDialog v-model="exportOpen" scope="savings" />
    </v-container>
  </AppLayout>
</template>

<style scoped>
.hero-card {
  position: relative;
  overflow: hidden;
  min-height: 180px;
}
.hero-glow {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(ellipse 80% 100% at 0% 0%, rgba(0, 186, 180, 0.25), transparent 60%),
    radial-gradient(ellipse 80% 100% at 100% 100%, rgba(6, 158, 110, 0.18), transparent 60%);
  pointer-events: none;
}
.hero-value {
  font-size: 2.5rem;
  font-weight: 700;
  letter-spacing: -0.03em;
  background: linear-gradient(90deg, #00BAB4, #069E6E);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  font-feature-settings: 'tnum';
}

.distribution-bar {
  height: 14px;
  border-radius: 7px;
  background: rgba(15, 16, 35, 0.6);
  border: 1px solid rgba(62, 121, 150, 0.2);
  overflow: hidden;
  display: flex;
}
.dist-segment {
  height: 100%;
  transition: width 0.4s;
}
.dist-segment:not(:last-child) {
  border-right: 1px solid rgba(15, 16, 35, 0.5);
}

.dist-legend {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.dist-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.font-mono {
  font-family: 'Space Grotesk', monospace;
}
</style>
