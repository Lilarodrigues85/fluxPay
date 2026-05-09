<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { useAuthStore } from '../../stores/auth'
import { useTransactionsStore } from '../../stores/transactions'
import { useProjectsStore } from '../../stores/projects'
import { useCategoriesStore } from '../../stores/categories'
import { useBudgetsStore } from '../../stores/budgets'
import { useToastStore } from '../../stores/toast'
import { formatCurrency } from '../../utils/currency'
import { findTransactionDuplicate } from '../../utils/duplicates'
import { dateToInputValue, inputValueToTimestamp } from '../../utils/dates'
import type { Transaction } from '../../types'

const props = defineProps<{
  modelValue: boolean
  type: 'payable' | 'receivable'
  transaction?: Transaction | null
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  saved: []
}>()

const authStore = useAuthStore()
const txStore = useTransactionsStore()
const projectsStore = useProjectsStore()
const categoriesStore = useCategoriesStore()
const budgetsStore = useBudgetsStore()
const toast = useToastStore()

const isOpen = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
})

const isEditing = computed(() => !!props.transaction)

const description = ref('')
const amount = ref<number | null>(null)
const category = ref('')
const dueDate = ref(dateToInputValue(Date.now()))
const status = ref<'pending' | 'paid'>('pending')
const projectId = ref<string | null>(null)
const notes = ref('')
const tags = ref<string[]>([])
const isRecurring = ref(false)
const recurringFrequency = ref<'weekly' | 'monthly' | 'yearly'>('monthly')
const recurringTotal = ref<number>(12)
const isSaving = ref(false)
const error = ref<string | null>(null)
const duplicateConfirmed = ref(false)
const duplicateOpen = ref(false)

const categories = computed(() =>
  props.type === 'payable'
    ? categoriesStore.namesForPayable
    : categoriesStore.namesForReceivable
)

const projectOptions = computed(() => [
  { title: 'Nenhum', value: null },
  ...projectsStore.projects
    .filter((p) => p.status === 'active')
    .map((p) => ({ title: p.name, value: p.id })),
])

watch(isOpen, (open) => {
  if (open) {
    if (props.transaction) {
      description.value = props.transaction.description
      amount.value = props.transaction.amount
      category.value = props.transaction.category
      dueDate.value = dateToInputValue(props.transaction.dueDate)
      status.value = props.transaction.status === 'paid' ? 'paid' : 'pending'
      projectId.value = props.transaction.projectId
      notes.value = props.transaction.notes
      tags.value = props.transaction.tags ? [...props.transaction.tags] : []
      isRecurring.value = false  // edição não cria nova série
    } else {
      description.value = ''
      amount.value = null
      category.value = ''
      dueDate.value = dateToInputValue(Date.now())
      status.value = 'pending'
      projectId.value = null
      notes.value = ''
      tags.value = []
      isRecurring.value = false
      recurringFrequency.value = 'monthly'
      recurringTotal.value = 12
    }
    error.value = null
  }
})

const handleSave = async () => {
  if (!authStore.user) return
  if (!description.value || !amount.value || !category.value) {
    error.value = 'Preencha descrição, valor e categoria'
    return
  }

  // Detecção de duplicidade (só ao criar, não ao editar)
  if (!props.transaction && !duplicateConfirmed.value) {
    const dup = findTransactionDuplicate(txStore.transactions, {
      description: description.value,
      amount: amount.value,
      date: inputValueToTimestamp(dueDate.value),
    })
    if (dup) {
      duplicateOpen.value = true
      return
    }
  }

  isSaving.value = true
  error.value = null
  try {
    const data = {
      type: props.type,
      description: description.value,
      amount: amount.value,
      category: category.value,
      dueDate: inputValueToTimestamp(dueDate.value),
      status: status.value,
      paidAt: status.value === 'paid' ? Date.now() : null,
      projectId: projectId.value,
      notes: notes.value,
      tags: tags.value.length > 0 ? tags.value : [],
    }

    // Alerta se ultrapassa orçamento (apenas em criação de payable)
    if (!props.transaction && props.type === 'payable') {
      const exceeded = budgetsStore.checkLimit(category.value, 'payable', amount.value)
      if (exceeded) {
        toast.warning(
          `Atenção: orçamento de ${exceeded.budget.category} ficará em ${formatCurrency(exceeded.spent)} ` +
          `(${exceeded.percent.toFixed(0)}% do limite ${formatCurrency(exceeded.budget.monthlyLimit)})`,
          7000
        )
      }
    }

    if (props.transaction) {
      await txStore.update(authStore.user.uid, props.transaction.id, data)
      toast.success('Transação atualizada')
    } else if (isRecurring.value && recurringTotal.value > 1) {
      const result = await txStore.createRecurring(
        authStore.user.uid,
        data,
        recurringFrequency.value,
        recurringTotal.value
      )
      const freqLabel = recurringFrequency.value === 'weekly' ? 'semanais'
        : recurringFrequency.value === 'monthly' ? 'mensais' : 'anuais'
      toast.success(`${result.count} ocorrências ${freqLabel} criadas`)
    } else {
      await txStore.create(authStore.user.uid, data)
      toast.success(props.type === 'payable' ? 'Conta a pagar criada' : 'Conta a receber criada')
    }
    emit('saved')
    isOpen.value = false
  } catch (err) {
    error.value = (err as Error).message
    toast.error('Erro ao salvar: ' + (err as Error).message)
  } finally {
    isSaving.value = false
    duplicateConfirmed.value = false
  }
}

function confirmDuplicate() {
  duplicateConfirmed.value = true
  duplicateOpen.value = false
  handleSave()
}

function cancelDuplicate() {
  duplicateOpen.value = false
  duplicateConfirmed.value = false
}
</script>

<template>
  <v-dialog v-model="isOpen" max-width="600">
    <v-card>
      <v-card-title>
        {{ isEditing ? 'Editar' : 'Nova' }}
        {{ type === 'payable' ? 'conta a pagar' : 'conta a receber' }}
      </v-card-title>

      <v-card-text>
        <v-form @submit.prevent="handleSave">
          <v-text-field
            v-model="description"
            label="Descrição"
            required
            class="mb-2"
          />

          <v-row>
            <v-col cols="6">
              <v-text-field
                v-model.number="amount"
                label="Valor (R$)"
                type="number"
                step="0.01"
                min="0"
                required
              />
            </v-col>
            <v-col cols="6">
              <v-text-field
                v-model="dueDate"
                label="Data de vencimento"
                type="date"
                required
              />
            </v-col>
          </v-row>

          <v-select
            v-model="category"
            :items="categories"
            label="Categoria"
            required
            class="mb-2"
          />

          <v-select
            v-model="projectId"
            :items="projectOptions"
            label="Vincular a uma meta (opcional)"
            class="mb-2"
          />

          <v-select
            v-model="status"
            :items="[
              { title: 'Pendente', value: 'pending' },
              { title: type === 'payable' ? 'Pago' : 'Recebido', value: 'paid' },
            ]"
            label="Status"
            class="mb-2"
          />

          <v-combobox
            v-model="tags"
            label="Tags (digite e tecle Enter)"
            multiple
            chips
            closable-chips
            class="mb-2"
            prepend-inner-icon="mdi-tag-multiple-outline"
          />

          <v-textarea
            v-model="notes"
            label="Observações"
            rows="2"
            auto-grow
            class="mb-2"
          />

          <div v-if="!isEditing" class="recurring-section pa-3">
            <v-switch
              v-model="isRecurring"
              color="primary"
              hide-details
              density="compact"
            >
              <template #label>
                <v-icon class="mr-1" size="18">mdi-repeat-variant</v-icon>
                <span class="text-body-2">É uma conta recorrente</span>
              </template>
            </v-switch>

            <v-row v-if="isRecurring" class="mt-2">
              <v-col cols="6">
                <v-select
                  v-model="recurringFrequency"
                  :items="[
                    { title: 'Semanal', value: 'weekly' },
                    { title: 'Mensal', value: 'monthly' },
                    { title: 'Anual', value: 'yearly' },
                  ]"
                  label="Frequência"
                  density="compact"
                  hide-details
                />
              </v-col>
              <v-col cols="6">
                <v-text-field
                  v-model.number="recurringTotal"
                  label="Quantas ocorrências"
                  type="number"
                  min="2"
                  max="60"
                  density="compact"
                  hide-details
                />
              </v-col>
            </v-row>
            <p v-if="isRecurring" class="text-caption mt-2 mb-0" style="color: var(--text-muted)">
              <v-icon size="12" class="mr-1">mdi-information-outline</v-icon>
              Cria {{ recurringTotal }} transações com vencimentos a cada
              {{ recurringFrequency === 'weekly' ? 'semana' : recurringFrequency === 'monthly' ? 'mês' : 'ano' }}.
            </p>
          </div>

          <p v-if="error" class="text-error text-caption mt-2">{{ error }}</p>
        </v-form>
      </v-card-text>

      <v-card-actions>
        <v-spacer />
        <v-btn @click="isOpen = false">Cancelar</v-btn>
        <v-btn color="primary" :loading="isSaving" @click="handleSave">Salvar</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <v-dialog v-model="duplicateOpen" max-width="460" persistent>
    <v-card class="glass-card">
      <v-card-title class="d-flex align-center pa-4">
        <v-icon color="warning" class="mr-2">mdi-content-copy</v-icon>
        Possível duplicidade
      </v-card-title>
      <v-card-text>
        <p class="text-body-2 mb-2">
          Já existe uma transação <strong>"{{ description }}"</strong> com o mesmo valor de
          <strong class="font-mono">{{ formatCurrency(amount || 0) }}</strong> e mesma data,
          criada nos últimos 5 minutos.
        </p>
        <p class="text-body-2" style="color: var(--text-muted)">
          Pode ser um clique acidental. Quer criar mesmo assim?
        </p>
      </v-card-text>
      <v-card-actions class="pa-4">
        <v-spacer />
        <v-btn variant="text" @click="cancelDuplicate">Cancelar</v-btn>
        <v-btn color="warning" @click="confirmDuplicate">Criar mesmo assim</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<style scoped>
.recurring-section {
  background: rgba(0, 186, 180, 0.06);
  border: 1px solid rgba(0, 186, 180, 0.18);
  border-radius: 10px;
}
</style>
