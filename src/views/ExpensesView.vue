<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import AppLayout from '../components/layout/AppLayout.vue'
import ExpenseDialog from '../components/expenses/ExpenseDialog.vue'
import ExpenseTable from '../components/expenses/ExpenseTable.vue'
import ExportDialog from '../components/common/ExportDialog.vue'
import ImportDialog from '../components/common/ImportDialog.vue'
import { useExpensesStore } from '../stores/expenses'
import { useSavingsStore } from '../stores/savings'
import { formatCurrency } from '../utils/currency'
import { formatDate } from '../utils/dates'
import type { Expense } from '../types'

const router = useRouter()
const route = useRoute()
const expensesStore = useExpensesStore()
const savingsStore = useSavingsStore()

const dialogOpen = ref(false)
const exportOpen = ref(false)
const importOpen = ref(false)
const editingExpense = ref<Expense | null>(null)
const filterCategory = ref<string>('all')

const checkingAccounts = computed(() =>
  savingsStore.items.filter((s) => s.type === 'checking')
)
const checkingTotal = computed(() =>
  checkingAccounts.value.reduce((sum, s) => sum + s.amount, 0)
)
const lastChecking = computed(() => {
  const dates = checkingAccounts.value.map((s) => s.lastValueUpdate).filter(Boolean)
  return dates.length > 0 ? Math.max(...dates) : null
})
const projectedBalance = computed(() => checkingTotal.value - expensesStore.monthTotal)

const categories = computed(() => {
  const set = new Set<string>()
  expensesStore.items.forEach((e) => set.add(e.category))
  return ['all', ...Array.from(set)]
})

const filtered = computed(() => {
  if (filterCategory.value === 'all') return expensesStore.items
  return expensesStore.items.filter((e) => e.category === filterCategory.value)
})

const openNew = () => {
  editingExpense.value = null
  dialogOpen.value = true
}

const handleEdit = (expense: Expense) => {
  editingExpense.value = expense
  dialogOpen.value = true
}

watch(() => route.query.new, (v) => { if (v) openNew() }, { immediate: true })
</script>

<template>
  <AppLayout>
    <v-container class="py-8">
      <div class="d-flex align-start mb-6">
        <div>
          <div class="text-caption text-uppercase mb-1" style="letter-spacing: 0.12em; color: #FF4D6D">
            Despesas avulsas
          </div>
          <h1 class="text-h3">Gastos do dia a dia</h1>
        </div>
        <v-spacer />
        <v-btn
          variant="text"
          size="large"
          class="mr-2"
          prepend-icon="mdi-upload"
          @click="importOpen = true"
        >
          Importar
        </v-btn>
        <v-btn
          variant="tonal"
          size="large"
          class="mr-2"
          prepend-icon="mdi-download"
          :disabled="expensesStore.items.length === 0"
          @click="exportOpen = true"
        >
          Exportar
        </v-btn>
        <v-btn color="primary" size="large" prepend-icon="mdi-plus" @click="openNew">
          Novo gasto
        </v-btn>
      </div>

      <v-row class="mb-6">
        <v-col cols="12" md="6">
          <v-card class="glass-card hero-card pa-5 h-100">
            <div class="hero-glow"></div>
            <div class="d-flex align-start position-relative" style="z-index: 1">
              <div class="title-marker mr-3"></div>
              <div class="flex-grow-1">
                <div class="text-caption text-uppercase mb-1" style="letter-spacing: 0.12em; color: #8E94B0">
                  Saldo da conta corrente
                </div>
                <div class="hero-value font-mono money-value">
                  {{ formatCurrency(checkingTotal) }}
                </div>
                <div v-if="checkingAccounts.length > 0" class="text-caption mt-2" style="color: #B6BBD0">
                  Soma de {{ checkingAccounts.length }} conta(s) corrente(s)
                  <span v-if="lastChecking">
                    · atualizado em {{ formatDate(lastChecking) }}
                  </span>
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

            <v-divider class="my-4" style="border-color: rgba(62, 121, 150, 0.2)" />

            <div class="d-flex justify-space-between align-center" style="z-index: 1; position: relative">
              <div>
                <div class="text-caption text-uppercase" style="letter-spacing: 0.08em; color: #8E94B0">
                  Estimativa após gastos do mês
                </div>
                <div
                  class="text-h6 font-mono mt-1 money-value"
                  :style="{ color: projectedBalance >= 0 ? '#00BAB4' : '#FF4D6D' }"
                >
                  {{ formatCurrency(projectedBalance) }}
                </div>
              </div>
              <v-icon size="40" color="primary" style="opacity: 0.5">mdi-bank-outline</v-icon>
            </div>

            <div v-if="checkingAccounts.length === 0" class="empty-checking mt-3">
              <v-icon size="20" color="warning" class="mr-2">mdi-information-outline</v-icon>
              <span class="text-caption">
                Cadastre uma conta corrente em
                <a class="text-primary" style="cursor: pointer" @click="router.push('/patrimonio')">Patrimônio</a>
                para acompanhar o saldo aqui.
              </span>
            </div>
          </v-card>
        </v-col>

        <v-col cols="12" md="6">
          <v-row>
            <v-col cols="6">
              <v-card class="glass-card stat-card pa-4 h-100">
                <div class="stat-accent" style="background: #FF4D6D"></div>
                <div class="text-caption text-uppercase mb-1" style="letter-spacing: 0.08em; color: #8E94B0">
                  Gasto este mês
                </div>
                <div class="stat-value font-mono money-value" style="color: #FF4D6D">
                  {{ formatCurrency(expensesStore.monthTotal) }}
                </div>
                <div class="text-caption" style="color: #B6BBD0">
                  {{ expensesStore.monthCount }} lançamento(s)
                </div>
              </v-card>
            </v-col>

            <v-col cols="6">
              <v-card class="glass-card stat-card pa-4 h-100">
                <div class="stat-accent" style="background: #F4A261"></div>
                <div class="text-caption text-uppercase mb-1" style="letter-spacing: 0.08em; color: #8E94B0">
                  Hoje
                </div>
                <div class="stat-value font-mono money-value" style="color: #F4A261">
                  {{ formatCurrency(expensesStore.todayTotal) }}
                </div>
                <div class="text-caption" style="color: #B6BBD0">
                  desde 00:00
                </div>
              </v-card>
            </v-col>

            <v-col cols="12">
              <v-card class="glass-card stat-card pa-4 h-100">
                <div class="stat-accent" style="background: #00BAB4"></div>
                <div class="d-flex align-center">
                  <div class="flex-grow-1">
                    <div class="text-caption text-uppercase mb-1" style="letter-spacing: 0.08em; color: #8E94B0">
                      Média diária no mês
                    </div>
                    <div class="stat-value font-mono money-value" style="color: #00BAB4">
                      {{ formatCurrency(expensesStore.dailyAvg) }}
                    </div>
                  </div>
                  <v-icon size="36" color="primary" style="opacity: 0.4">mdi-trending-up</v-icon>
                </div>
              </v-card>
            </v-col>
          </v-row>
        </v-col>
      </v-row>

      <v-card class="glass-card pa-4">
        <v-select
          v-model="filterCategory"
          :items="categories.map(c => ({ title: c === 'all' ? 'Todas as categorias' : c, value: c }))"
          label="Filtrar por categoria"
          density="compact"
          class="mb-2"
          style="max-width: 280px"
        />

        <ExpenseTable :expenses="filtered" @edit="handleEdit" />
      </v-card>

      <ExpenseDialog v-model="dialogOpen" :expense="editingExpense" />
      <ExportDialog v-model="exportOpen" scope="expenses" />
      <ImportDialog v-model="importOpen" scope="expenses" />
    </v-container>
  </AppLayout>
</template>

<style scoped>
.hero-card {
  position: relative;
  overflow: hidden;
  min-height: 240px;
}
.hero-glow {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(ellipse 80% 100% at 100% 0%, rgba(0, 186, 180, 0.18), transparent 60%),
    radial-gradient(ellipse 60% 80% at 0% 100%, rgba(6, 158, 110, 0.12), transparent 60%);
  pointer-events: none;
}

.title-marker {
  width: 4px;
  height: 36px;
  border-radius: 2px;
  background: linear-gradient(180deg, #00BAB4, #069E6E);
  box-shadow: 0 0 12px rgba(0, 186, 180, 0.5);
}

.hero-value {
  font-size: 2.6rem;
  font-weight: 700;
  letter-spacing: -0.03em;
  background: linear-gradient(90deg, #00BAB4, #069E6E);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  font-feature-settings: 'tnum';
  line-height: 1.1;
}

.stat-card {
  position: relative;
  overflow: hidden;
}
.stat-accent {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  opacity: 0.85;
  box-shadow: 0 0 12px currentColor;
}

.stat-value {
  font-size: 1.4rem;
  font-weight: 700;
  letter-spacing: -0.02em;
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
  position: relative;
  z-index: 1;
}

.font-mono {
  font-family: 'Space Grotesk', monospace;
}
</style>
