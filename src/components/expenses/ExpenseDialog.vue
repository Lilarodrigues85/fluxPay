<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { useAuthStore } from '../../stores/auth'
import { useExpensesStore } from '../../stores/expenses'
import { useCategoriesStore } from '../../stores/categories'
import { useBudgetsStore } from '../../stores/budgets'
import { useToastStore } from '../../stores/toast'
import { formatCurrency } from '../../utils/currency'
import { dateToInputValue, inputValueToTimestamp } from '../../utils/dates'
import type { Expense } from '../../types'

const props = defineProps<{
  modelValue: boolean
  expense?: Expense | null
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const authStore = useAuthStore()
const expensesStore = useExpensesStore()
const categoriesStore = useCategoriesStore()
const budgetsStore = useBudgetsStore()
const toast = useToastStore()

const isOpen = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
})

const isEditing = computed(() => !!props.expense)

const description = ref('')
const amount = ref<number | null>(null)
const category = ref('')
const date = ref(dateToInputValue(Date.now()))
const paymentMethod = ref('')
const notes = ref('')
const isSaving = ref(false)
const error = ref<string | null>(null)

const categories = computed(() => categoriesStore.namesForExpense)

const paymentMethods = [
  'Débito',
  'Crédito',
  'Pix',
  'Dinheiro',
  'Vale-refeição',
  'Outro',
]

watch(isOpen, (open) => {
  if (open) {
    if (props.expense) {
      description.value = props.expense.description
      amount.value = props.expense.amount
      category.value = props.expense.category
      date.value = dateToInputValue(props.expense.date)
      paymentMethod.value = props.expense.paymentMethod
      notes.value = props.expense.notes
    } else {
      description.value = ''
      amount.value = null
      category.value = ''
      date.value = dateToInputValue(Date.now())
      paymentMethod.value = ''
      notes.value = ''
    }
    error.value = null
  }
})

const handleSave = async () => {
  if (!authStore.user) return
  if (!description.value || amount.value === null || !category.value) {
    error.value = 'Preencha descrição, valor e categoria'
    return
  }

  isSaving.value = true
  error.value = null
  try {
    const data = {
      description: description.value,
      amount: amount.value,
      category: category.value,
      date: inputValueToTimestamp(date.value),
      paymentMethod: paymentMethod.value,
      notes: notes.value,
    }

    if (!props.expense) {
      const exceeded = budgetsStore.checkLimit(category.value, 'expense', amount.value)
      if (exceeded) {
        toast.warning(
          `Atenção: orçamento de ${exceeded.budget.category} ficará em ${formatCurrency(exceeded.spent)} ` +
          `(${exceeded.percent.toFixed(0)}% do limite ${formatCurrency(exceeded.budget.monthlyLimit)})`,
          7000
        )
      }
    }

    if (props.expense) {
      await expensesStore.update(authStore.user.uid, props.expense.id, data)
      toast.success('Gasto atualizado')
    } else {
      await expensesStore.create(authStore.user.uid, data)
      toast.success('Gasto registrado')
    }
    isOpen.value = false
  } catch (err) {
    error.value = (err as Error).message
    toast.error('Erro ao salvar: ' + (err as Error).message)
  } finally {
    isSaving.value = false
  }
}
</script>

<template>
  <v-dialog v-model="isOpen" max-width="600">
    <v-card class="glass-card">
      <v-card-title class="d-flex align-center pa-4">
        <div class="dialog-icon mr-3">
          <v-icon icon="mdi-cart-outline" color="#FF4D6D" />
        </div>
        <span style="font-family: 'Space Grotesk'; letter-spacing: -0.01em">
          {{ isEditing ? 'Editar gasto' : 'Novo gasto' }}
        </span>
      </v-card-title>

      <v-card-text>
        <v-form @submit.prevent="handleSave">
          <v-text-field
            v-model="description"
            label="Descrição (ex: almoço, Uber pro centro)"
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
                v-model="date"
                label="Data"
                type="date"
                required
              />
            </v-col>
          </v-row>

          <v-row>
            <v-col cols="6">
              <v-select
                v-model="category"
                :items="categories"
                label="Categoria"
                required
              />
            </v-col>
            <v-col cols="6">
              <v-select
                v-model="paymentMethod"
                :items="paymentMethods"
                label="Forma de pagamento"
              />
            </v-col>
          </v-row>

          <v-textarea
            v-model="notes"
            label="Observações"
            rows="2"
            auto-grow
          />

          <p v-if="error" class="text-error text-caption">{{ error }}</p>
        </v-form>
      </v-card-text>

      <v-card-actions class="pa-4">
        <v-spacer />
        <v-btn variant="text" @click="isOpen = false">Cancelar</v-btn>
        <v-btn color="primary" :loading="isSaving" @click="handleSave">Salvar</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<style scoped>
.dialog-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: linear-gradient(135deg, rgba(255, 77, 109, 0.18), rgba(255, 77, 109, 0.05));
  border: 1px solid rgba(255, 77, 109, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
