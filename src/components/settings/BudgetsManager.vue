<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAuthStore } from '../../stores/auth'
import { useBudgetsStore, type BudgetWithUsage } from '../../stores/budgets'
import { useCategoriesStore } from '../../stores/categories'
import { formatCurrency } from '../../utils/currency'
import type { Budget } from '../../types'

const authStore = useAuthStore()
const budgetsStore = useBudgetsStore()
const categoriesStore = useCategoriesStore()

const dialogOpen = ref(false)
const editing = ref<Budget | null>(null)

const category = ref('')
const monthlyLimit = ref<number | null>(null)
const scope = ref<'expense' | 'payable' | 'all'>('all')
const color = ref('#00BAB4')
const isSaving = ref(false)
const error = ref<string | null>(null)

const SCOPES = [
  { value: 'expense', label: 'Gastos avulsos' },
  { value: 'payable', label: 'Contas a pagar' },
  { value: 'all',     label: 'Ambos' },
]

const COLORS = ['#00BAB4', '#069E6E', '#3E7996', '#2F6C82', '#F4A261', '#FF4D6D', '#A78BFA', '#F472B6']

const allCategoryNames = computed(() => {
  const set = new Set<string>([
    ...categoriesStore.namesForExpense,
    ...categoriesStore.namesForPayable,
  ])
  return Array.from(set).sort()
})

const items = computed(() => budgetsStore.budgetsWithUsage)

function openNew() {
  editing.value = null
  category.value = ''
  monthlyLimit.value = null
  scope.value = 'all'
  color.value = '#00BAB4'
  error.value = null
  dialogOpen.value = true
}

function openEdit(b: BudgetWithUsage) {
  editing.value = b.budget
  category.value = b.budget.category
  monthlyLimit.value = b.budget.monthlyLimit
  scope.value = b.budget.scope
  color.value = b.budget.color
  error.value = null
  dialogOpen.value = true
}

async function handleSave() {
  if (!authStore.user) return
  if (!category.value || !monthlyLimit.value || monthlyLimit.value <= 0) {
    error.value = 'Preencha categoria e limite (>0)'
    return
  }
  isSaving.value = true
  error.value = null
  try {
    const data = {
      category: category.value,
      monthlyLimit: monthlyLimit.value,
      scope: scope.value,
      color: color.value,
    }
    if (editing.value) {
      await budgetsStore.update(authStore.user.uid, editing.value.id, data)
    } else {
      await budgetsStore.create(authStore.user.uid, data)
    }
    dialogOpen.value = false
  } catch (err) {
    error.value = (err as Error).message
  } finally {
    isSaving.value = false
  }
}

async function handleDelete(b: BudgetWithUsage) {
  if (!authStore.user) return
  if (confirm(`Excluir orçamento de "${b.budget.category}"?`)) {
    await budgetsStore.remove(authStore.user.uid, b.budget.id)
  }
}

function statusColor(status: string) {
  if (status === 'over') return '#FF4D6D'
  if (status === 'warn') return '#F4A261'
  return '#069E6E'
}

function statusLabel(status: string) {
  if (status === 'over') return 'Estourado'
  if (status === 'warn') return 'Atenção'
  return 'No limite'
}

function scopeLabel(s: string) {
  return SCOPES.find((x) => x.value === s)?.label ?? s
}
</script>

<template>
  <v-card class="glass-card pa-5">
    <div class="d-flex align-center mb-4">
      <div class="header-icon mr-3">
        <v-icon icon="mdi-target-variant" color="primary" />
      </div>
      <div class="flex-grow-1">
        <div class="text-caption text-uppercase" style="letter-spacing: 0.12em; color: #8E94B0">
          Controle
        </div>
        <h3 class="text-h6" style="font-family: 'Space Grotesk'">Orçamentos por categoria</h3>
      </div>
      <v-btn color="primary" prepend-icon="mdi-plus" @click="openNew">Novo</v-btn>
    </div>

    <p class="text-body-2 mb-4" style="color: #B6BBD0">
      Defina limite mensal por categoria. O app soma seus gastos avulsos e/ou contas a pagar daquela
      categoria no mês corrente e mostra quanto já foi consumido.
    </p>

    <div v-if="items.length === 0" class="text-center py-6" style="color: #8E94B0">
      <v-icon size="40" style="opacity: 0.5">mdi-target</v-icon>
      <div class="text-body-2 mt-2">Nenhum orçamento cadastrado ainda</div>
    </div>

    <div v-else class="d-flex flex-column ga-3">
      <div
        v-for="bu in items"
        :key="bu.budget.id"
        class="budget-row pa-3"
        :style="{ borderColor: `${bu.budget.color}40` }"
      >
        <div class="d-flex align-center mb-2">
          <span class="dot mr-2" :style="{ background: bu.budget.color, boxShadow: `0 0 8px ${bu.budget.color}` }"></span>
          <div class="flex-grow-1">
            <div class="font-weight-medium">{{ bu.budget.category }}</div>
            <div class="text-caption" style="color: #8E94B0">{{ scopeLabel(bu.budget.scope) }}</div>
          </div>
          <v-chip size="small" variant="tonal" :style="{ color: statusColor(bu.status), borderColor: statusColor(bu.status) }">
            {{ statusLabel(bu.status) }}
          </v-chip>
          <v-menu>
            <template #activator="{ props: m }">
              <v-btn icon="mdi-dots-vertical" variant="text" size="small" v-bind="m" />
            </template>
            <v-list>
              <v-list-item prepend-icon="mdi-pencil" title="Editar" @click="openEdit(bu)" />
              <v-list-item prepend-icon="mdi-delete" title="Excluir" @click="handleDelete(bu)" />
            </v-list>
          </v-menu>
        </div>

        <div class="progress-rail mb-1">
          <div
            class="progress-fill"
            :style="{
              width: Math.min(100, bu.percent) + '%',
              background: statusColor(bu.status),
              boxShadow: `0 0 10px ${statusColor(bu.status)}66`,
            }"
          ></div>
          <div
            v-if="bu.percent > 100"
            class="overflow-mark"
            :style="{ background: statusColor(bu.status) }"
          ></div>
        </div>

        <div class="d-flex justify-space-between text-caption">
          <span class="font-mono money-value">
            <strong :style="{ color: statusColor(bu.status) }">{{ formatCurrency(bu.spent) }}</strong>
            de <span class="money-value">{{ formatCurrency(bu.budget.monthlyLimit) }}</span>
          </span>
          <span class="font-mono money-value" :style="{ color: bu.remaining < 0 ? '#FF4D6D' : '#8E94B0' }">
            {{ bu.remaining >= 0 ? `restam ${formatCurrency(bu.remaining)}` : `${formatCurrency(Math.abs(bu.remaining))} acima` }}
          </span>
        </div>
      </div>
    </div>

    <v-dialog v-model="dialogOpen" max-width="500">
      <v-card class="glass-card">
        <v-card-title class="pa-4">{{ editing ? 'Editar' : 'Novo' }} orçamento</v-card-title>
        <v-card-text>
          <v-combobox
            v-model="category"
            :items="allCategoryNames"
            label="Categoria"
            class="mb-2"
          />

          <v-row>
            <v-col cols="7">
              <v-text-field
                v-model.number="monthlyLimit"
                label="Limite mensal (R$)"
                type="number"
                step="0.01"
                min="0"
              />
            </v-col>
            <v-col cols="5">
              <v-select
                v-model="scope"
                :items="SCOPES.map(s => ({ title: s.label, value: s.value }))"
                label="Aplica em"
              />
            </v-col>
          </v-row>

          <div class="text-caption mb-2" style="color: #8E94B0">Cor</div>
          <div class="d-flex flex-wrap ga-2">
            <v-btn
              v-for="c in COLORS"
              :key="c"
              :color="c"
              size="small"
              icon
              :variant="color === c ? 'flat' : 'outlined'"
              @click="color = c"
            >
              <v-icon v-if="color === c" size="14">mdi-check</v-icon>
            </v-btn>
          </div>

          <p v-if="error" class="text-error text-caption mt-2">{{ error }}</p>
        </v-card-text>
        <v-card-actions class="pa-4">
          <v-spacer />
          <v-btn variant="text" @click="dialogOpen = false">Cancelar</v-btn>
          <v-btn color="primary" :loading="isSaving" @click="handleSave">Salvar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-card>
</template>

<style scoped>
.header-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: linear-gradient(135deg, rgba(0, 186, 180, 0.18), rgba(0, 186, 180, 0.05));
  border: 1px solid rgba(0, 186, 180, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
}

.budget-row {
  background: rgba(15, 16, 35, 0.4);
  border: 1px solid;
  border-radius: 10px;
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.progress-rail {
  position: relative;
  height: 8px;
  border-radius: 4px;
  background: rgba(15, 16, 35, 0.6);
  border: 1px solid rgba(62, 121, 150, 0.2);
  overflow: hidden;
}
.progress-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.5s cubic-bezier(0.16, 1, 0.3, 1);
}
.overflow-mark {
  position: absolute;
  right: 0;
  top: 0;
  width: 4px;
  height: 100%;
  opacity: 0.7;
}

.font-mono {
  font-family: 'Space Grotesk', monospace;
  font-feature-settings: 'tnum';
}
</style>
