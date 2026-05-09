<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { useAuthStore } from '../../stores/auth'
import { useSavingsStore } from '../../stores/savings'
import { useToastStore } from '../../stores/toast'
import { SAVINGS_TYPES, savingsTypeMeta } from '../../utils/savings'
import type { Savings, SavingsType } from '../../types'

const props = defineProps<{
  modelValue: boolean
  saving?: Savings | null
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const authStore = useAuthStore()
const savingsStore = useSavingsStore()
const toast = useToastStore()

const isOpen = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
})

const isEditing = computed(() => !!props.saving)

const name = ref('')
const type = ref<SavingsType>('savings')
const institution = ref('')
const amount = ref<number | null>(null)
const yieldRate = ref<number | null>(null)
const notes = ref('')
const isSaving = ref(false)
const error = ref<string | null>(null)

const meta = computed(() => savingsTypeMeta(type.value))

watch(isOpen, (open) => {
  if (open) {
    if (props.saving) {
      name.value = props.saving.name
      type.value = props.saving.type
      institution.value = props.saving.institution
      amount.value = props.saving.amount
      yieldRate.value = props.saving.yieldRate
      notes.value = props.saving.notes
    } else {
      name.value = ''
      type.value = 'savings'
      institution.value = ''
      amount.value = null
      yieldRate.value = null
      notes.value = ''
    }
    error.value = null
  }
})

const handleSave = async () => {
  if (!authStore.user) return
  if (!name.value || amount.value === null) {
    error.value = 'Preencha nome e valor'
    return
  }

  isSaving.value = true
  error.value = null
  try {
    const data = {
      name: name.value,
      type: type.value,
      institution: institution.value,
      amount: amount.value,
      yieldRate: yieldRate.value,
      color: meta.value.color,
      icon: meta.value.icon,
      notes: notes.value,
      lastValueUpdate: Date.now(),
    }

    if (props.saving) {
      await savingsStore.update(authStore.user.uid, props.saving.id, data)
      toast.success('Aplicação atualizada')
    } else {
      await savingsStore.create(authStore.user.uid, data)
      toast.success('Aplicação criada')
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
        <div class="dialog-icon mr-3" :style="{ background: `${meta.color}22`, border: `1px solid ${meta.color}55` }">
          <v-icon :icon="meta.icon" :color="meta.color" />
        </div>
        <span style="font-family: 'Space Grotesk'; letter-spacing: -0.01em">
          {{ isEditing ? 'Editar aplicação' : 'Nova aplicação' }}
        </span>
      </v-card-title>

      <v-card-text>
        <v-form @submit.prevent="handleSave">
          <v-text-field
            v-model="name"
            label="Nome (ex: Reserva de emergência)"
            required
            class="mb-2"
          />

          <v-select
            v-model="type"
            :items="SAVINGS_TYPES.map((t) => ({ title: t.label, value: t.value }))"
            label="Tipo"
            class="mb-2"
          />

          <v-text-field
            v-model="institution"
            label="Instituição (banco/corretora) - opcional"
            class="mb-2"
          />

          <v-row>
            <v-col cols="7">
              <v-text-field
                v-model.number="amount"
                label="Valor atual (R$)"
                type="number"
                step="0.01"
                min="0"
                required
              />
            </v-col>
            <v-col cols="5">
              <v-text-field
                v-model.number="yieldRate"
                label="Rendimento (% a.a.)"
                type="number"
                step="0.01"
                suffix="%"
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
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
