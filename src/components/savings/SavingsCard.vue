<script setup lang="ts">
import { computed } from 'vue'
import { useAuthStore } from '../../stores/auth'
import { useSavingsStore } from '../../stores/savings'
import { useToastStore } from '../../stores/toast'
import { formatCurrency } from '../../utils/currency'
import { formatDate } from '../../utils/dates'
import { savingsTypeMeta } from '../../utils/savings'
import type { Savings } from '../../types'

const props = defineProps<{
  saving: Savings
  totalAll: number
}>()

const emit = defineEmits<{
  edit: [saving: Savings]
}>()

const authStore = useAuthStore()
const savingsStore = useSavingsStore()
const toast = useToastStore()

const meta = computed(() => savingsTypeMeta(props.saving.type))
const sharePct = computed(() =>
  props.totalAll > 0 ? (props.saving.amount / props.totalAll) * 100 : 0
)

const handleDelete = async () => {
  if (!authStore.user) return
  if (confirm(`Excluir "${props.saving.name}"?`)) {
    try {
      await savingsStore.remove(authStore.user.uid, props.saving.id)
      toast.success('Aplicação excluída')
    } catch (err) {
      toast.error('Erro: ' + (err as Error).message)
    }
  }
}
</script>

<template>
  <v-card class="glass-card savings-card pa-5 h-100">
    <div
      class="card-glow"
      :style="{ background: `radial-gradient(ellipse 60% 80% at 100% 0%, ${meta.color}30, transparent 60%)` }"
    ></div>

    <div class="d-flex align-start mb-4 position-relative" style="z-index: 1">
      <div
        class="savings-icon mr-3"
        :style="{ background: `linear-gradient(135deg, ${meta.color}30, ${meta.color}10)`, border: `1px solid ${meta.color}50` }"
      >
        <v-icon :icon="saving.icon" :color="meta.color" size="22" />
      </div>
      <div class="flex-grow-1">
        <div class="text-h6" style="font-family: 'Space Grotesk'; letter-spacing: -0.01em">
          {{ saving.name }}
        </div>
        <div class="text-caption" style="color: #8E94B0">
          {{ meta.label }}
          <span v-if="saving.institution"> · {{ saving.institution }}</span>
        </div>
      </div>
      <v-menu>
        <template #activator="{ props: menuProps }">
          <v-btn icon="mdi-dots-horizontal" variant="text" size="small" v-bind="menuProps" />
        </template>
        <v-list>
          <v-list-item prepend-icon="mdi-pencil" title="Editar" @click="emit('edit', saving)" />
          <v-list-item prepend-icon="mdi-delete" title="Excluir" @click="handleDelete" />
        </v-list>
      </v-menu>
    </div>

    <div class="position-relative" style="z-index: 1">
      <div class="text-caption text-uppercase" style="letter-spacing: 0.08em; color: #8E94B0">
        Valor atual
      </div>
      <div class="value-display font-mono money-value" :style="{ color: meta.color }">
        {{ formatCurrency(saving.amount) }}
      </div>

      <div class="d-flex align-center ga-3 mt-3">
        <v-chip
          v-if="saving.yieldRate"
          size="small"
          variant="tonal"
          color="primary"
          prepend-icon="mdi-trending-up"
        >
          {{ saving.yieldRate.toFixed(2) }}% a.a.
        </v-chip>
        <v-chip size="small" variant="tonal" :color="meta.color">
          {{ sharePct.toFixed(1) }}% do total
        </v-chip>
      </div>

      <p v-if="saving.notes" class="text-body-2 mt-3" style="color: #B6BBD0">
        {{ saving.notes }}
      </p>

      <div class="text-caption mt-3" style="color: #5C6480">
        <v-icon size="11" class="mr-1">mdi-update</v-icon>
        Atualizado em {{ formatDate(saving.lastValueUpdate) }}
      </div>
    </div>
  </v-card>
</template>

<style scoped>
.savings-card {
  position: relative;
  overflow: hidden;
  transition: transform 0.2s, box-shadow 0.2s;
}
.savings-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.5);
}

.card-glow {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.savings-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.value-display {
  font-size: 1.75rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  font-feature-settings: 'tnum';
}

.font-mono {
  font-family: 'Space Grotesk', monospace;
}
</style>
