<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import AppLayout from '../components/layout/AppLayout.vue'
import ExpenseDialog from '../components/expenses/ExpenseDialog.vue'
import ExpenseTable from '../components/expenses/ExpenseTable.vue'
import ExportDialog from '../components/common/ExportDialog.vue'
import ImportDialog from '../components/common/ImportDialog.vue'
import { useAuthStore } from '../stores/auth'
import { useExpensesStore } from '../stores/expenses'
import { useSavingsStore } from '../stores/savings'
import { useToastStore } from '../stores/toast'
import { formatCurrency } from '../utils/currency'
import { formatDate, getMonthRange } from '../utils/dates'
import { usePreferencesStore } from '../stores/preferences'
import type { Expense } from '../types'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const expensesStore = useExpensesStore()
const savingsStore = useSavingsStore()
const toast = useToastStore()
const prefs = usePreferencesStore()

const dialogOpen = ref(false)
const exportOpen = ref(false)
const importOpen = ref(false)
const editingExpense = ref<Expense | null>(null)
const filterCategory = ref<string>('all')

// Reconciliação retroativa
const reconcileOpen = ref(false)
const reconcileScope = ref<'month' | 'all'>('month')
const reconcileAccountId = ref<string | null>(null)
const isReconciling = ref(false)

const unlinkedThisMonth = computed(() => {
  const { start, end } = getMonthRange(new Date(), prefs.monthStartDay)
  return expensesStore.unlinkedExpenses.filter((e) => e.date >= start && e.date <= end)
})

const unlinkedTotalThisMonth = computed(() =>
  unlinkedThisMonth.value.reduce((s, e) => s + e.amount, 0)
)

const reconcileTargetItems = computed(() =>
  reconcileScope.value === 'month' ? unlinkedThisMonth.value : expensesStore.unlinkedExpenses
)

const reconcileTargetTotal = computed(() =>
  reconcileTargetItems.value.reduce((s, e) => s + e.amount, 0)
)

const accountOptions = computed(() =>
  savingsStore.checkingItems.map((c) => ({
    title: c.institution ? `${c.name} (${c.institution})` : c.name,
    value: c.id,
    subtitle: `Saldo atual: ${formatCurrency(c.amount)}`,
  }))
)

const openReconcile = () => {
  reconcileScope.value = 'month'
  reconcileAccountId.value = savingsStore.checkingItems.length > 0
    ? savingsStore.checkingItems[0].id
    : null
  reconcileOpen.value = true
}

const handleReconcile = async () => {
  if (!authStore.user || !reconcileAccountId.value) return
  if (reconcileTargetItems.value.length === 0) {
    toast.info('Nenhum gasto pra reconciliar')
    reconcileOpen.value = false
    return
  }
  isReconciling.value = true
  try {
    const result = await expensesStore.reconcile(
      authStore.user.uid,
      reconcileTargetItems.value,
      reconcileAccountId.value
    )
    toast.success(`${result.count} gastos vinculados · ${formatCurrency(result.total)} debitado`)
    reconcileOpen.value = false
  } catch (err) {
    toast.error('Erro: ' + (err as Error).message)
  } finally {
    isReconciling.value = false
  }
}

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

      <v-alert
        v-if="unlinkedThisMonth.length > 0 && savingsStore.checkingItems.length > 0"
        color="warning"
        variant="tonal"
        density="comfortable"
        class="mb-4 reconcile-alert"
        icon="mdi-link-off"
      >
        <div class="d-flex flex-column flex-md-row align-md-center ga-2">
          <div class="flex-grow-1">
            <strong>{{ unlinkedThisMonth.length }} gasto(s) deste mês ainda não foram debitados</strong>
            <div class="text-caption mt-1">
              Total: <span class="font-mono money-value">{{ formatCurrency(unlinkedTotalThisMonth) }}</span> ·
              esses gastos foram registrados antes do vínculo automático com conta corrente
            </div>
          </div>
          <v-btn color="warning" variant="flat" @click="openReconcile" prepend-icon="mdi-link-variant">
            Reconciliar
          </v-btn>
        </div>
      </v-alert>

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

      <v-dialog v-model="reconcileOpen" max-width="560" :persistent="isReconciling">
        <v-card class="glass-card">
          <v-card-title class="d-flex align-center pa-4">
            <div class="dialog-icon mr-3">
              <v-icon icon="mdi-link-variant" color="warning" />
            </div>
            <span style="font-family: 'Space Grotesk'; letter-spacing: -0.01em">
              Reconciliar gastos antigos
            </span>
          </v-card-title>

          <v-card-text>
            <p class="text-body-2 mb-4" style="color: var(--text-muted)">
              Vincula gastos existentes (não-Crédito, sem conta vinculada) a uma conta corrente
              e debita o total do saldo. Use uma única vez pra alinhar gastos antigos.
            </p>

            <div class="text-caption text-uppercase mb-2" style="letter-spacing: 0.08em; color: #8E94B0">
              Período a reconciliar
            </div>
            <v-btn-toggle v-model="reconcileScope" mandatory color="warning" divided class="mb-4 d-flex">
              <v-btn value="month" class="flex-grow-1">
                Só este mês ({{ unlinkedThisMonth.length }})
              </v-btn>
              <v-btn value="all" class="flex-grow-1">
                Todos sem vínculo ({{ expensesStore.unlinkedExpenses.length }})
              </v-btn>
            </v-btn-toggle>

            <v-select
              v-model="reconcileAccountId"
              :items="accountOptions"
              item-title="title"
              item-value="value"
              label="Debitar de qual conta corrente?"
              prepend-inner-icon="mdi-bank-outline"
              class="mb-3"
            >
              <template #item="{ props: itemProps, item }">
                <v-list-item
                  v-bind="itemProps"
                  :subtitle="((item as unknown as { raw: { subtitle?: string } }).raw?.subtitle) || ''"
                />
              </template>
            </v-select>

            <div class="summary-box pa-3">
              <div class="d-flex justify-space-between mb-1">
                <span class="text-body-2">Gastos a vincular</span>
                <span class="font-mono"><strong>{{ reconcileTargetItems.length }}</strong></span>
              </div>
              <div class="d-flex justify-space-between mb-1">
                <span class="text-body-2">Total a debitar</span>
                <span class="font-mono money-value" style="color: #FF4D6D">
                  − {{ formatCurrency(reconcileTargetTotal) }}
                </span>
              </div>
              <v-divider class="my-2" style="border-color: rgba(62, 121, 150, 0.2)" />
              <div v-if="reconcileAccountId" class="d-flex justify-space-between">
                <span class="text-body-2">Saldo após reconciliar</span>
                <span class="font-mono money-value" :style="{
                  color: ((savingsStore.checkingItems.find(c => c.id === reconcileAccountId)?.amount || 0) - reconcileTargetTotal) < 0 ? '#FF4D6D' : '#00BAB4'
                }">
                  {{ formatCurrency((savingsStore.checkingItems.find(c => c.id === reconcileAccountId)?.amount || 0) - reconcileTargetTotal) }}
                </span>
              </div>
            </div>

            <p class="text-caption mt-3 mb-0" style="color: var(--text-muted)">
              <v-icon size="14" class="mr-1" color="warning">mdi-alert-outline</v-icon>
              Isso é uma operação irreversível. Use só se o saldo da conta corrente
              ainda não reflete esses gastos.
            </p>
          </v-card-text>

          <v-card-actions class="pa-4">
            <v-spacer />
            <v-btn variant="text" :disabled="isReconciling" @click="reconcileOpen = false">
              Cancelar
            </v-btn>
            <v-btn
              color="warning"
              :loading="isReconciling"
              :disabled="!reconcileAccountId || reconcileTargetItems.length === 0"
              prepend-icon="mdi-check"
              @click="handleReconcile"
            >
              Confirmar débito
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
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
  font-feature-settings: 'tnum';
}

.reconcile-alert {
  border: 1px solid rgba(244, 162, 97, 0.3);
}

.dialog-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: linear-gradient(135deg, rgba(244, 162, 97, 0.18), rgba(244, 162, 97, 0.05));
  border: 1px solid rgba(244, 162, 97, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
}

.summary-box {
  background: rgba(15, 16, 35, 0.5);
  border: 1px solid rgba(62, 121, 150, 0.2);
  border-radius: 10px;
}
</style>
