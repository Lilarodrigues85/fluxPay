<script setup lang="ts">
import { useToastStore, type ToastType } from '../../stores/toast'

const toastStore = useToastStore()

const ICON: Record<ToastType, string> = {
  success: 'mdi-check-circle',
  error: 'mdi-alert-octagon',
  info: 'mdi-information',
  warning: 'mdi-alert',
}

const COLOR: Record<ToastType, string> = {
  success: '#069E6E',
  error: '#FF4D6D',
  info: '#00BAB4',
  warning: '#F4A261',
}
</script>

<template>
  <div class="toast-stack">
    <transition-group name="toast" tag="div">
      <div
        v-for="t in toastStore.items"
        :key="t.id"
        class="toast-item"
        :style="{ borderLeftColor: COLOR[t.type], boxShadow: `0 8px 24px rgba(0,0,0,0.4), 0 0 16px ${COLOR[t.type]}40` }"
        @click="toastStore.dismiss(t.id)"
      >
        <v-icon :icon="ICON[t.type]" :color="COLOR[t.type]" size="20" />
        <span class="toast-message">{{ t.message }}</span>
        <v-icon icon="mdi-close" size="16" class="toast-close" />
      </div>
    </transition-group>
  </div>
</template>

<style scoped>
.toast-stack {
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 99999;
  display: flex;
  flex-direction: column;
  gap: 12px;
  pointer-events: none;
  max-width: calc(100vw - 48px);
}

.toast-item {
  pointer-events: auto;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: linear-gradient(135deg, rgba(45, 46, 71, 0.95), rgba(26, 27, 54, 0.92));
  border: 1px solid rgba(62, 121, 150, 0.25);
  border-left: 3px solid;
  border-radius: 10px;
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  color: #E5E7F0;
  font-size: 0.9rem;
  min-width: 280px;
  max-width: 420px;
  cursor: pointer;
  transition: transform 0.15s;
}

.v-theme--flux-light .toast-item {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.97), rgba(240, 244, 248, 0.95));
  color: #1A1B36;
  border-color: rgba(62, 121, 150, 0.3);
}

.toast-item:hover {
  transform: translateY(-1px);
}

.toast-message {
  flex: 1;
  font-family: 'Inter', sans-serif;
  line-height: 1.35;
}

.toast-close {
  opacity: 0.45;
}
.toast-item:hover .toast-close {
  opacity: 1;
}

.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}
.toast-enter-from {
  opacity: 0;
  transform: translateX(40px);
}
.toast-leave-to {
  opacity: 0;
  transform: translateX(40px);
}

@media (max-width: 600px) {
  .toast-stack {
    bottom: 80px;
    right: 12px;
    left: 12px;
  }
  .toast-item {
    min-width: 0;
    width: 100%;
  }
}
</style>
