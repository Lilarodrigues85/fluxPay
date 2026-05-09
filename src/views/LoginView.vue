<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const authStore = useAuthStore()
const isLoading = ref(false)

const handleGoogleLogin = async () => {
  isLoading.value = true
  try {
    await authStore.loginWithGoogle()
    if (authStore.isAuthenticated) {
      router.push('/')
    }
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <v-main class="login-bg">
    <div class="grid-overlay"></div>
    <v-container class="fill-height d-flex align-center justify-center pa-4 position-relative" style="z-index: 1">
      <v-card class="glass-card glow-primary px-2 py-4" max-width="420" width="100%">
        <v-card-text class="text-center pa-6">
          <div class="logo-wrap mb-4">
            <v-icon size="56" color="primary">mdi-chart-donut</v-icon>
          </div>
          <h1 class="text-h3 mb-1" style="background: linear-gradient(90deg, #00BAB4, #069E6E); -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent;">
            fluxPay
          </h1>
          <p class="text-body-2 mb-8" style="color: #8E94B0">
            Controle financeiro pessoal
          </p>

          <v-btn
            block
            size="large"
            color="primary"
            class="mb-3"
            height="52"
            :loading="isLoading"
            :disabled="isLoading"
            prepend-icon="mdi-google"
            @click="handleGoogleLogin"
          >
            Entrar com Google
          </v-btn>

          <p v-if="authStore.error" class="text-error text-caption mt-2">
            {{ authStore.error }}
          </p>
        </v-card-text>
      </v-card>
    </v-container>
  </v-main>
</template>

<style scoped>
.login-bg {
  background:
    radial-gradient(ellipse 60% 80% at 20% 30%, rgba(0, 186, 180, 0.25), transparent 50%),
    radial-gradient(ellipse 60% 80% at 80% 70%, rgba(6, 158, 110, 0.2), transparent 50%),
    radial-gradient(ellipse 40% 60% at 50% 100%, rgba(62, 121, 150, 0.15), transparent 60%),
    #0F1023;
  min-height: 100vh;
  position: relative;
  overflow: hidden;
}

.grid-overlay {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(62, 121, 150, 0.08) 1px, transparent 1px),
    linear-gradient(90deg, rgba(62, 121, 150, 0.08) 1px, transparent 1px);
  background-size: 50px 50px;
  mask-image: radial-gradient(ellipse 80% 80% at 50% 50%, #000 30%, transparent 70%);
  -webkit-mask-image: radial-gradient(ellipse 80% 80% at 50% 50%, #000 30%, transparent 70%);
  pointer-events: none;
}

.logo-wrap {
  display: inline-flex;
  width: 88px;
  height: 88px;
  align-items: center;
  justify-content: center;
  border-radius: 24px;
  background: linear-gradient(135deg, rgba(0, 186, 180, 0.2), rgba(6, 158, 110, 0.15));
  border: 1px solid rgba(0, 186, 180, 0.35);
  box-shadow: 0 0 32px rgba(0, 186, 180, 0.25);
}
</style>
