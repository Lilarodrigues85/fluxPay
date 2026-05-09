<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import AppLayout from '../components/layout/AppLayout.vue'
import ProjectDialog from '../components/projects/ProjectDialog.vue'
import ProjectCard from '../components/projects/ProjectCard.vue'
import ExportDialog from '../components/common/ExportDialog.vue'
import { useProjectsStore } from '../stores/projects'
import type { Project } from '../types'

const route = useRoute()
const projectsStore = useProjectsStore()

const dialogOpen = ref(false)
const exportOpen = ref(false)
const editingProject = ref<Project | null>(null)

const openNew = () => {
  editingProject.value = null
  dialogOpen.value = true
}

const handleEdit = (project: Project) => {
  editingProject.value = project
  dialogOpen.value = true
}

watch(() => route.query.new, (v) => { if (v) openNew() }, { immediate: true })
</script>

<template>
  <AppLayout>
    <v-container class="py-8">
      <div class="d-flex align-start mb-6">
        <div>
          <div class="text-caption text-uppercase mb-1" style="letter-spacing: 0.12em; color: #00BAB4">
            Objetivos
          </div>
          <h1 class="text-h3">Metas de Projetos</h1>
        </div>
        <v-spacer />
        <v-btn
          variant="tonal"
          size="large"
          class="mr-2"
          prepend-icon="mdi-download"
          :disabled="projectsStore.projects.length === 0"
          @click="exportOpen = true"
        >
          Exportar
        </v-btn>
        <v-btn color="primary" size="large" prepend-icon="mdi-plus" @click="openNew">
          Nova meta
        </v-btn>
      </div>

      <v-row v-if="projectsStore.isLoading && projectsStore.projects.length === 0">
        <v-col v-for="n in 3" :key="n" cols="12" md="6" lg="4">
          <v-skeleton-loader type="article, actions" class="glass-card" />
        </v-col>
      </v-row>

      <v-card v-else-if="projectsStore.projects.length === 0" class="glass-card">
        <v-card-text class="text-center py-12">
          <v-icon size="64" color="primary" style="opacity: 0.6">mdi-flag-checkered</v-icon>
          <div class="text-h6 mt-4">Nenhuma meta cadastrada</div>
          <p class="text-body-2 mt-2" style="color: #8E94B0">
            Crie metas para acompanhar projetos como viagens, reservas e objetivos pessoais.
          </p>
        </v-card-text>
      </v-card>

      <v-row v-else>
        <v-col
          v-for="project in projectsStore.projects"
          :key="project.id"
          cols="12"
          md="6"
          lg="4"
        >
          <ProjectCard :project="project" @edit="handleEdit" />
        </v-col>
      </v-row>

      <ProjectDialog v-model="dialogOpen" :project="editingProject" />
      <ExportDialog v-model="exportOpen" scope="projects" />
    </v-container>
  </AppLayout>
</template>
