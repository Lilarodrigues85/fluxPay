import { defineStore } from 'pinia'
import { ref } from 'vue'

export type ToastType = 'success' | 'error' | 'info' | 'warning'

interface Toast {
  id: number
  type: ToastType
  message: string
  timeout: number
}

let nextId = 1

export const useToastStore = defineStore('toast', () => {
  const items = ref<Toast[]>([])

  function show(message: string, type: ToastType = 'info', timeout = 3500) {
    const id = nextId++
    items.value.push({ id, type, message, timeout })
    if (timeout > 0) {
      setTimeout(() => dismiss(id), timeout)
    }
    return id
  }

  function dismiss(id: number) {
    const i = items.value.findIndex((t) => t.id === id)
    if (i >= 0) items.value.splice(i, 1)
  }

  return {
    items,
    show,
    dismiss,
    success: (msg: string, timeout?: number) => show(msg, 'success', timeout),
    error:   (msg: string, timeout?: number) => show(msg, 'error',   timeout ?? 6000),
    info:    (msg: string, timeout?: number) => show(msg, 'info',    timeout),
    warning: (msg: string, timeout?: number) => show(msg, 'warning', timeout),
  }
})
