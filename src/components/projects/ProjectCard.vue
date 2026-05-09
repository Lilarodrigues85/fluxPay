<script setup lang="ts">
import { computed } from 'vue'
import { useAuthStore } from '../../stores/auth'
import { useProjectsStore } from '../../stores/projects'
import { useTransactionsStore } from '../../stores/transactions'
import { useToastStore } from '../../stores/toast'
import { formatCurrency } from '../../utils/currency'
import { formatDate } from '../../utils/dates'
import type { Project } from '../../types'

const props = defineProps<{
  project: Project
}>()

const emit = defineEmits<{
  edit: [project: Project]
}>()

const authStore = useAuthStore()
const projectsStore = useProjectsStore()
const txStore = useTransactionsStore()
const toast = useToastStore()

const linkedTotal = computed(() =>
  txStore.transactions
    .filter((t) => t.projectId === props.project.id && t.status === 'paid')
    .reduce((sum, t) => sum + (t.type === 'receivable' ? t.amount : -t.amount), 0)
)

const progress = computed(() => {
  const current = Math.max(0, linkedTotal.value)
  return Math.min(100, (current / props.project.targetAmount) * 100)
})

const handleDelete = async () => {
  if (!authStore.user) return
  if (confirm(`Excluir a meta "${props.project.name}"?`)) {
    try {
      await projectsStore.remove(authStore.user.uid, props.project.id)
      toast.success('Meta excluída')
    } catch (err) {
      toast.error('Erro: ' + (err as Error).message)
    }
  }
}
</script>

<template>
  <v-card class="glass-card project-card pa-5 h-100">
    <div
      class="project-glow"
      :style="{ background: `radial-gradient(ellipse 60% 80% at 100% 0%, ${project.color}30, transparent 60%)` }"
    ></div>

    <div class="d-flex align-start mb-4 position-relative" style="z-index: 1">
      <div
        class="project-icon mr-3"
        :style="{ background: `linear-gradient(135deg, ${project.color}30, ${project.color}10)`, border: `1px solid ${project.color}50` }"
      >
        <v-icon :icon="project.icon" :color="project.color" size="22" />
      </div>
      <div class="flex-grow-1">
        <div class="text-h6" style="font-family: 'Space Grotesk'; letter-spacing: -0.01em">
          {{ project.name }}
        </div>
        <div v-if="project.deadline" class="text-caption" style="color: #8E94B0">
          <v-icon size="12" class="mr-1">mdi-calendar-clock</v-icon>
          {{ formatDate(project.deadline) }}
        </div>
      </div>
      <v-menu>
        <template #activator="{ props: menuProps }">
          <v-btn icon="mdi-dots-horizontal" variant="text" size="small" v-bind="menuProps" />
        </template>
        <v-list>
          <v-list-item prepend-icon="mdi-pencil" title="Editar" @click="emit('edit', project)" />
          <v-list-item prepend-icon="mdi-delete" title="Excluir" @click="handleDelete" />
        </v-list>
      </v-menu>
    </div>

    <p v-if="project.description" class="text-body-2 mb-4" style="color: #B6BBD0">
      {{ project.description }}
    </p>

    <div class="position-relative" style="z-index: 1">
      <div class="d-flex justify-space-between align-end mb-2">
        <div>
          <div class="text-caption text-uppercase" style="letter-spacing: 0.08em; color: #8E94B0">
            Acumulado
          </div>
          <div class="text-h6 font-mono money-value" :style="{ color: project.color }">
            {{ formatCurrency(Math.max(0, linkedTotal)) }}
          </div>
        </div>
        <div class="text-right">
          <div class="text-caption text-uppercase" style="letter-spacing: 0.08em; color: #8E94B0">
            Meta
          </div>
          <div class="text-body-1 font-mono money-value" style="color: #B6BBD0">
            {{ formatCurrency(project.targetAmount) }}
          </div>
        </div>
      </div>

      <div class="progress-rail">
        <div
          class="progress-fill"
          :style="{
            width: progress + '%',
            background: `linear-gradient(90deg, ${project.color}, ${project.color}cc)`,
            boxShadow: `0 0 12px ${project.color}99, inset 0 0 6px ${project.color}66`,
          }"
        >
          <div class="progress-pulse" :style="{ background: project.color }"></div>
        </div>
        <div class="progress-track-marks">
          <span v-for="n in 4" :key="n"></span>
        </div>
      </div>
      <div class="d-flex justify-space-between mt-1">
        <span class="text-caption" style="color: #8E94B0; font-family: 'Space Grotesk'">
          {{ progress.toFixed(0) }}%
        </span>
        <span class="text-caption" style="color: #8E94B0">
          {{ progress >= 100 ? 'meta atingida' : 'em andamento' }}
        </span>
      </div>

      <v-chip
        v-if="project.status !== 'active'"
        size="small"
        :color="project.status === 'completed' ? 'success' : 'surface-light'"
        variant="tonal"
        class="mt-3"
      >
        {{ project.status === 'completed' ? 'Concluída' : 'Arquivada' }}
      </v-chip>
    </div>
  </v-card>
</template>

<style scoped>
.project-card {
  position: relative;
  overflow: hidden;
  transition: transform 0.2s, box-shadow 0.2s;
}
.project-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.5);
}

.project-glow {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.project-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.font-mono {
  font-family: 'Space Grotesk', monospace;
  font-feature-settings: 'tnum';
}

.progress-rail {
  position: relative;
  height: 10px;
  border-radius: 6px;
  background: rgba(15, 16, 35, 0.6);
  border: 1px solid rgba(62, 121, 150, 0.2);
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  border-radius: 6px;
  position: relative;
  transition: width 0.6s cubic-bezier(0.16, 1, 0.3, 1);
}

.progress-pulse {
  position: absolute;
  top: 50%;
  right: 0;
  transform: translate(50%, -50%);
  width: 8px;
  height: 8px;
  border-radius: 50%;
  filter: blur(1px);
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 0.6; transform: translate(50%, -50%) scale(1); }
  50% { opacity: 1; transform: translate(50%, -50%) scale(1.4); }
}

.progress-track-marks {
  position: absolute;
  inset: 0;
  display: flex;
  justify-content: space-between;
  padding: 0 24%;
  pointer-events: none;
}
.progress-track-marks span {
  width: 1px;
  height: 100%;
  background: rgba(62, 121, 150, 0.18);
}
</style>
