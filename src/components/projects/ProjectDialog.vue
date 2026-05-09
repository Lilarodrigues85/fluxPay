<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { useAuthStore } from '../../stores/auth'
import { useProjectsStore } from '../../stores/projects'
import { useToastStore } from '../../stores/toast'
import { dateToInputValue, inputValueToTimestamp } from '../../utils/dates'
import type { Project } from '../../types'

const props = defineProps<{
  modelValue: boolean
  project?: Project | null
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const authStore = useAuthStore()
const projectsStore = useProjectsStore()
const toast = useToastStore()

const isOpen = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
})

const isEditing = computed(() => !!props.project)

const name = ref('')
const description = ref('')
const targetAmount = ref<number | null>(null)
const deadline = ref('')
const color = ref('#00BAB4')
const icon = ref('mdi-target')
const status = ref<'active' | 'completed' | 'archived'>('active')
const isSaving = ref(false)
const error = ref<string | null>(null)

const colorOptions = [
  '#00BAB4', '#069E6E', '#3E7996', '#2F6C82', '#F4A261', '#FF4D6D', '#A78BFA', '#F472B6',
]

const iconOptions = [
  { value: 'mdi-target', title: 'Meta' },
  { value: 'mdi-airplane', title: 'Viagem' },
  { value: 'mdi-home', title: 'Casa' },
  { value: 'mdi-car', title: 'Veículo' },
  { value: 'mdi-school', title: 'Estudo' },
  { value: 'mdi-piggy-bank', title: 'Reserva' },
  { value: 'mdi-gift', title: 'Presente' },
  { value: 'mdi-heart', title: 'Pessoal' },
]

watch(isOpen, (open) => {
  if (open) {
    if (props.project) {
      name.value = props.project.name
      description.value = props.project.description
      targetAmount.value = props.project.targetAmount
      deadline.value = props.project.deadline ? dateToInputValue(props.project.deadline) : ''
      color.value = props.project.color
      icon.value = props.project.icon
      status.value = props.project.status
    } else {
      name.value = ''
      description.value = ''
      targetAmount.value = null
      deadline.value = ''
      color.value = '#00BAB4'
      icon.value = 'mdi-target'
      status.value = 'active'
    }
    error.value = null
  }
})

const handleSave = async () => {
  if (!authStore.user) return
  if (!name.value || !targetAmount.value) {
    error.value = 'Preencha nome e valor alvo'
    return
  }

  isSaving.value = true
  error.value = null
  try {
    const data = {
      name: name.value,
      description: description.value,
      targetAmount: targetAmount.value,
      currentAmount: props.project?.currentAmount || 0,
      deadline: deadline.value ? inputValueToTimestamp(deadline.value) : null,
      color: color.value,
      icon: icon.value,
      status: status.value,
    }

    if (props.project) {
      await projectsStore.update(authStore.user.uid, props.project.id, data)
      toast.success('Meta atualizada')
    } else {
      await projectsStore.create(authStore.user.uid, data)
      toast.success('Meta criada')
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
    <v-card>
      <v-card-title>
        {{ isEditing ? 'Editar meta' : 'Nova meta' }}
      </v-card-title>

      <v-card-text>
        <v-form @submit.prevent="handleSave">
          <v-text-field
            v-model="name"
            label="Nome da meta"
            required
            class="mb-2"
          />

          <v-textarea
            v-model="description"
            label="Descrição"
            rows="2"
            auto-grow
            class="mb-2"
          />

          <v-row>
            <v-col cols="6">
              <v-text-field
                v-model.number="targetAmount"
                label="Valor alvo (R$)"
                type="number"
                step="0.01"
                min="0"
                required
              />
            </v-col>
            <v-col cols="6">
              <v-text-field
                v-model="deadline"
                label="Prazo (opcional)"
                type="date"
              />
            </v-col>
          </v-row>

          <v-select
            v-model="icon"
            :items="iconOptions"
            label="Ícone"
            class="mb-2"
          >
            <template #selection="{ item }">
              <v-icon :icon="item.value" class="mr-2" />
              {{ item.title }}
            </template>
            <template #item="{ item, props: itemProps }">
              <v-list-item v-bind="itemProps" :title="item.title">
                <template #prepend>
                  <v-icon :icon="item.value" />
                </template>
              </v-list-item>
            </template>
          </v-select>

          <div class="mb-4">
            <div class="text-caption mb-1">Cor</div>
            <div class="d-flex ga-2">
              <v-btn
                v-for="c in colorOptions"
                :key="c"
                :color="c"
                size="small"
                icon
                :variant="color === c ? 'flat' : 'outlined'"
                @click="color = c"
              >
                <v-icon v-if="color === c">mdi-check</v-icon>
              </v-btn>
            </div>
          </div>

          <v-select
            v-if="isEditing"
            v-model="status"
            :items="[
              { title: 'Ativa', value: 'active' },
              { title: 'Concluída', value: 'completed' },
              { title: 'Arquivada', value: 'archived' },
            ]"
            label="Status"
          />

          <p v-if="error" class="text-error text-caption">{{ error }}</p>
        </v-form>
      </v-card-text>

      <v-card-actions>
        <v-spacer />
        <v-btn @click="isOpen = false">Cancelar</v-btn>
        <v-btn color="primary" :loading="isSaving" @click="handleSave">Salvar</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
