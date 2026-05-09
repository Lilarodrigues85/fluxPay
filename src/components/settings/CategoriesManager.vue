<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAuthStore } from '../../stores/auth'
import { useCategoriesStore } from '../../stores/categories'
import type { Category, CategoryScope } from '../../types'

const authStore = useAuthStore()
const categoriesStore = useCategoriesStore()

const dialogOpen = ref(false)
const editing = ref<Category | null>(null)

const name = ref('')
const scope = ref<CategoryScope>('expense')
const color = ref('#00BAB4')
const icon = ref('mdi-tag-outline')
const isSaving = ref(false)
const error = ref<string | null>(null)

const SCOPES: { value: CategoryScope; label: string }[] = [
  { value: 'payable', label: 'Contas a Pagar' },
  { value: 'receivable', label: 'Contas a Receber' },
  { value: 'expense', label: 'Gastos avulsos' },
  { value: 'all', label: 'Todos' },
]

const COLORS = ['#00BAB4', '#069E6E', '#3E7996', '#2F6C82', '#F4A261', '#FF4D6D', '#A78BFA', '#F472B6', '#94A3B8']

const ICONS = [
  'mdi-tag-outline', 'mdi-cart-outline', 'mdi-food', 'mdi-coffee', 'mdi-car',
  'mdi-home', 'mdi-gas-station', 'mdi-medical-bag', 'mdi-school', 'mdi-pill',
  'mdi-gift-outline', 'mdi-heart-outline', 'mdi-airplane', 'mdi-paw',
  'mdi-shopping', 'mdi-tools', 'mdi-laptop', 'mdi-music-note',
]

const grouped = computed(() => {
  const map: Record<CategoryScope, Category[]> = {
    payable: [], receivable: [], expense: [], all: [],
  }
  for (const c of categoriesStore.items) {
    map[c.scope].push(c)
  }
  return map
})

function openNew() {
  editing.value = null
  name.value = ''
  scope.value = 'expense'
  color.value = '#00BAB4'
  icon.value = 'mdi-tag-outline'
  error.value = null
  dialogOpen.value = true
}

function openEdit(c: Category) {
  editing.value = c
  name.value = c.name
  scope.value = c.scope
  color.value = c.color
  icon.value = c.icon
  error.value = null
  dialogOpen.value = true
}

async function handleSave() {
  if (!authStore.user) return
  if (!name.value.trim()) {
    error.value = 'Informe o nome'
    return
  }
  isSaving.value = true
  error.value = null
  try {
    const data = {
      name: name.value.trim(),
      scope: scope.value,
      color: color.value,
      icon: icon.value,
    }
    if (editing.value) {
      await categoriesStore.update(authStore.user.uid, editing.value.id, data)
    } else {
      await categoriesStore.create(authStore.user.uid, data)
    }
    dialogOpen.value = false
  } catch (err) {
    error.value = (err as Error).message
  } finally {
    isSaving.value = false
  }
}

async function handleDelete(c: Category) {
  if (!authStore.user) return
  if (confirm(`Excluir categoria "${c.name}"?`)) {
    await categoriesStore.remove(authStore.user.uid, c.id)
  }
}

</script>

<template>
  <v-card class="glass-card pa-5">
    <div class="d-flex align-center mb-4">
      <div class="header-icon mr-3">
        <v-icon icon="mdi-tag-multiple-outline" color="primary" />
      </div>
      <div class="flex-grow-1">
        <div class="text-caption text-uppercase" style="letter-spacing: 0.12em; color: #8E94B0">
          Personalização
        </div>
        <h3 class="text-h6" style="font-family: 'Space Grotesk'">Categorias customizadas</h3>
      </div>
      <v-btn color="primary" prepend-icon="mdi-plus" @click="openNew">Nova</v-btn>
    </div>

    <p class="text-body-2 mb-4" style="color: #B6BBD0">
      Crie suas próprias categorias. Elas aparecem nos selects de Contas a Pagar/Receber e Gastos
      junto com as predefinidas.
    </p>

    <div v-if="categoriesStore.items.length === 0" class="text-center py-6" style="color: #8E94B0">
      <v-icon size="40" style="opacity: 0.5">mdi-tag-off-outline</v-icon>
      <div class="text-body-2 mt-2">Nenhuma categoria customizada ainda</div>
    </div>

    <div v-else>
      <div v-for="s in SCOPES" :key="s.value">
        <div v-if="grouped[s.value].length > 0" class="mb-3">
          <div class="text-caption text-uppercase mb-2" style="letter-spacing: 0.08em; color: #8E94B0">
            {{ s.label }}
          </div>
          <div class="d-flex flex-wrap ga-2">
            <v-chip
              v-for="c in grouped[s.value]"
              :key="c.id"
              :prepend-icon="c.icon"
              :style="{ borderColor: c.color, color: c.color }"
              variant="outlined"
              closable
              @click="openEdit(c)"
              @click:close="handleDelete(c)"
            >
              {{ c.name }}
            </v-chip>
          </div>
        </div>
      </div>
    </div>

    <v-dialog v-model="dialogOpen" max-width="500">
      <v-card class="glass-card">
        <v-card-title class="pa-4">
          {{ editing ? 'Editar' : 'Nova' }} categoria
        </v-card-title>
        <v-card-text>
          <v-text-field v-model="name" label="Nome" required class="mb-2" />

          <v-select
            v-model="scope"
            :items="SCOPES.map(s => ({ title: s.label, value: s.value }))"
            label="Aparece em"
            class="mb-3"
          />

          <div class="text-caption mb-2" style="color: #8E94B0">Cor</div>
          <div class="d-flex flex-wrap ga-2 mb-4">
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

          <div class="text-caption mb-2" style="color: #8E94B0">Ícone</div>
          <div class="icon-grid">
            <v-btn
              v-for="i in ICONS"
              :key="i"
              :icon="i"
              size="small"
              :variant="icon === i ? 'flat' : 'text'"
              :color="icon === i ? color : 'default'"
              @click="icon = i"
            />
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

.icon-grid {
  display: grid;
  grid-template-columns: repeat(9, 1fr);
  gap: 4px;
}
</style>
