import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Unsubscribe } from 'firebase/firestore'
import {
  subscribeProjects,
  createProject as createPj,
  updateProject as updatePj,
  deleteProject as deletePj,
} from '../services/projects.service'
import type { Project } from '../types'

export const useProjectsStore = defineStore('projects', () => {
  const projects = ref<Project[]>([])
  const isLoading = ref(false)
  let unsubscribe: Unsubscribe | null = null

  const subscribe = (userId: string) => {
    if (unsubscribe) unsubscribe()
    isLoading.value = true
    unsubscribe = subscribeProjects(userId, (items) => {
      projects.value = items
      isLoading.value = false
    })
  }

  const unsubscribeAll = () => {
    if (unsubscribe) {
      unsubscribe()
      unsubscribe = null
    }
    projects.value = []
  }

  const create = (userId: string, data: Omit<Project, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) =>
    createPj(userId, data)

  const update = (userId: string, id: string, data: Partial<Project>) =>
    updatePj(userId, id, data)

  const remove = (userId: string, id: string) => deletePj(userId, id)

  return {
    projects,
    isLoading,
    subscribe,
    unsubscribeAll,
    create,
    update,
    remove,
  }
})
