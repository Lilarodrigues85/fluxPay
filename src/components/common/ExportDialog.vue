<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { startOfMonth, endOfMonth, subMonths, startOfYear, endOfYear } from 'date-fns'
import { useTransactionsStore } from '../../stores/transactions'
import { useExpensesStore } from '../../stores/expenses'
import { useSavingsStore } from '../../stores/savings'
import { useProjectsStore } from '../../stores/projects'
import { useToastStore } from '../../stores/toast'
import { dateToInputValue, inputValueToTimestamp } from '../../utils/dates'

type Scope = 'payable' | 'receivable' | 'expenses' | 'savings' | 'projects' | 'all'

const props = defineProps<{
  modelValue: boolean
  scope: Scope
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const txStore = useTransactionsStore()
const expensesStore = useExpensesStore()
const savingsStore = useSavingsStore()
const projectsStore = useProjectsStore()
const toast = useToastStore()

const isOpen = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
})

const format = ref<'xlsx' | 'csv'>('xlsx')
const startDate = ref<string>('')
const endDate = ref<string>('')
const isExporting = ref(false)
const error = ref<string | null>(null)

const hasPeriod = computed(() =>
  ['payable', 'receivable', 'expenses', 'all'].includes(props.scope)
)

const scopeMeta = computed(() => {
  switch (props.scope) {
    case 'payable':    return { title: 'Exportar contas a pagar', icon: 'mdi-arrow-up-bold-circle-outline' }
    case 'receivable': return { title: 'Exportar contas a receber', icon: 'mdi-arrow-down-bold-circle-outline' }
    case 'expenses':   return { title: 'Exportar gastos avulsos', icon: 'mdi-cart-outline' }
    case 'savings':    return { title: 'Exportar patrimônio', icon: 'mdi-cash' }
    case 'projects':   return { title: 'Exportar metas', icon: 'mdi-flag-checkered' }
    case 'all':        return { title: 'Exportar todos os dados', icon: 'mdi-database-export-outline' }
  }
})

const allItems = computed(() => {
  switch (props.scope) {
    case 'payable':    return txStore.payable
    case 'receivable': return txStore.receivable
    case 'expenses':   return expensesStore.items
    case 'savings':    return savingsStore.items
    case 'projects':   return projectsStore.projects
    case 'all':        return null
  }
})

function getDate(item: unknown, scope: Scope): number {
  if (scope === 'payable' || scope === 'receivable') return (item as { dueDate: number }).dueDate
  if (scope === 'expenses') return (item as { date: number }).date
  return 0
}

const period = computed(() => {
  if (!hasPeriod.value) return null
  return {
    start: startDate.value ? inputValueToTimestamp(startDate.value) : null,
    end: endDate.value ? inputValueToTimestamp(endDate.value) + (24 * 60 * 60 * 1000 - 1) : null,
  }
})

const filteredCount = computed(() => {
  if (props.scope === 'all') {
    if (!hasPeriod.value || !period.value) {
      return txStore.transactions.length + expensesStore.items.length +
             savingsStore.items.length + projectsStore.projects.length
    }
    let count = 0
    for (const t of txStore.transactions) {
      if ((!period.value.start || t.dueDate >= period.value.start) &&
          (!period.value.end || t.dueDate <= period.value.end)) count++
    }
    for (const e of expensesStore.items) {
      if ((!period.value.start || e.date >= period.value.start) &&
          (!period.value.end || e.date <= period.value.end)) count++
    }
    return count + savingsStore.items.length + projectsStore.projects.length
  }
  const items = allItems.value ?? []
  if (!hasPeriod.value || !period.value) return items.length
  return items.filter((it) => {
    const d = getDate(it, props.scope)
    if (period.value!.start !== null && d < period.value!.start) return false
    if (period.value!.end !== null && d > period.value!.end) return false
    return true
  }).length
})

watch(isOpen, (open) => {
  if (open) {
    format.value = 'xlsx'
    startDate.value = ''
    endDate.value = ''
    error.value = null
  }
})

function setQuick(quick: 'this-month' | 'last-month' | 'this-year' | 'last-3' | 'last-6' | 'all') {
  const now = new Date()
  if (quick === 'all') {
    startDate.value = ''
    endDate.value = ''
    return
  }
  let start: Date
  let end: Date
  switch (quick) {
    case 'this-month':
      start = startOfMonth(now)
      end = endOfMonth(now)
      break
    case 'last-month':
      start = startOfMonth(subMonths(now, 1))
      end = endOfMonth(subMonths(now, 1))
      break
    case 'this-year':
      start = startOfYear(now)
      end = endOfYear(now)
      break
    case 'last-3':
      start = startOfMonth(subMonths(now, 2))
      end = endOfMonth(now)
      break
    case 'last-6':
      start = startOfMonth(subMonths(now, 5))
      end = endOfMonth(now)
      break
  }
  startDate.value = dateToInputValue(start.getTime())
  endDate.value = dateToInputValue(end.getTime())
}

const handleExport = async () => {
  isExporting.value = true
  error.value = null
  try {
    const exp = await import('../../utils/exportExcel')
    const opts = { format: format.value, period: period.value }

    switch (props.scope) {
      case 'payable':
        await exp.exportTransactions(txStore.payable, 'payable', projectsStore.projects, opts)
        break
      case 'receivable':
        await exp.exportTransactions(txStore.receivable, 'receivable', projectsStore.projects, opts)
        break
      case 'expenses':
        await exp.exportExpenses(expensesStore.items, opts)
        break
      case 'savings':
        await exp.exportSavings(savingsStore.items, opts)
        break
      case 'projects':
        await exp.exportProjects(projectsStore.projects, opts)
        break
      case 'all':
        await exp.exportAll({
          transactions: txStore.transactions,
          expenses: expensesStore.items,
          savings: savingsStore.items,
          projects: projectsStore.projects,
        }, opts)
        break
    }
    toast.success(`Exportação concluída (${filteredCount.value} registros)`)
    isOpen.value = false
  } catch (err) {
    error.value = (err as Error).message
    toast.error('Erro na exportação: ' + (err as Error).message)
  } finally {
    isExporting.value = false
  }
}
</script>

<template>
  <v-dialog v-model="isOpen" max-width="560">
    <v-card class="glass-card export-dialog">
      <v-card-title class="d-flex align-center pa-4">
        <div class="dialog-icon mr-3">
          <v-icon :icon="scopeMeta.icon" color="primary" />
        </div>
        <span style="font-family: 'Space Grotesk'; letter-spacing: -0.01em">
          {{ scopeMeta.title }}
        </span>
      </v-card-title>

      <v-card-text>
        <div class="text-caption text-uppercase mb-2" style="letter-spacing: 0.08em; color: #8E94B0">
          Formato
        </div>
        <v-btn-toggle v-model="format" mandatory color="primary" divided class="mb-5 d-flex">
          <v-btn value="xlsx" class="flex-grow-1" prepend-icon="mdi-microsoft-excel">
            Excel (.xlsx)
          </v-btn>
          <v-btn value="csv" class="flex-grow-1" prepend-icon="mdi-file-delimited-outline">
            CSV
          </v-btn>
        </v-btn-toggle>

        <div v-if="hasPeriod">
          <div class="text-caption text-uppercase mb-2" style="letter-spacing: 0.08em; color: #8E94B0">
            Período
          </div>

          <div class="d-flex flex-wrap ga-1 mb-3">
            <v-btn size="x-small" variant="tonal" @click="setQuick('this-month')">Este mês</v-btn>
            <v-btn size="x-small" variant="tonal" @click="setQuick('last-month')">Mês passado</v-btn>
            <v-btn size="x-small" variant="tonal" @click="setQuick('last-3')">Últimos 3 meses</v-btn>
            <v-btn size="x-small" variant="tonal" @click="setQuick('last-6')">Últimos 6 meses</v-btn>
            <v-btn size="x-small" variant="tonal" @click="setQuick('this-year')">Este ano</v-btn>
            <v-btn size="x-small" variant="tonal" @click="setQuick('all')">Tudo</v-btn>
          </div>

          <v-row>
            <v-col cols="6">
              <v-text-field
                v-model="startDate"
                type="date"
                label="Data inicial"
                density="compact"
                clearable
              />
            </v-col>
            <v-col cols="6">
              <v-text-field
                v-model="endDate"
                type="date"
                label="Data final"
                density="compact"
                clearable
              />
            </v-col>
          </v-row>

          <p class="text-caption mb-0" style="color: #8E94B0">
            <v-icon size="14" class="mr-1">mdi-information-outline</v-icon>
            Filtro aplicado em datas de vencimento (contas) ou data do gasto (avulsos).
            Patrimônio e metas são exportados na íntegra.
          </p>
        </div>

        <v-divider class="my-4" style="border-color: rgba(62, 121, 150, 0.2)" />

        <div class="d-flex align-center">
          <v-icon color="primary" class="mr-2">mdi-check-circle-outline</v-icon>
          <span class="text-body-2">
            <strong class="font-mono" style="color: #00BAB4">{{ filteredCount }}</strong> registros serão exportados
          </span>
        </div>

        <p v-if="error" class="text-error text-caption mt-2">{{ error }}</p>
      </v-card-text>

      <v-card-actions class="pa-4">
        <v-spacer />
        <v-btn variant="text" :disabled="isExporting" @click="isOpen = false">Cancelar</v-btn>
        <v-btn
          color="primary"
          prepend-icon="mdi-download"
          :loading="isExporting"
          :disabled="filteredCount === 0"
          @click="handleExport"
        >
          Baixar
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<style scoped>
.dialog-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: linear-gradient(135deg, rgba(0, 186, 180, 0.18), rgba(0, 186, 180, 0.05));
  border: 1px solid rgba(0, 186, 180, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
}

.font-mono {
  font-family: 'Space Grotesk', monospace;
  font-feature-settings: 'tnum';
}
</style>
