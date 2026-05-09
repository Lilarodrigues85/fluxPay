<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useDisplay } from 'vuetify'
import { useAuthStore } from '../../stores/auth'
import { usePreferencesStore } from '../../stores/preferences'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const preferencesStore = usePreferencesStore()
const display = useDisplay()

const isMobile = computed(() => display.smAndDown.value)
const drawer = ref(!isMobile.value)

const fabRoute = computed(() => {
  switch (route.path) {
    case '/contas-a-pagar':
    case '/contas-a-receber':
    case '/gastos-avulsos':
    case '/patrimonio':
    case '/metas':
      return route.path
    default:
      return '/gastos-avulsos'
  }
})

const fabLabel = computed(() => {
  switch (fabRoute.value) {
    case '/contas-a-pagar':   return 'Nova conta'
    case '/contas-a-receber': return 'Nova receita'
    case '/gastos-avulsos':   return 'Novo gasto'
    case '/patrimonio':       return 'Nova aplicação'
    case '/metas':            return 'Nova meta'
    default:                  return 'Novo'
  }
})

function handleFab() {
  if (route.path !== fabRoute.value) {
    router.push({ path: fabRoute.value, query: { new: '1' } })
  } else {
    router.replace({ path: route.path, query: { ...route.query, new: String(Date.now()) } })
  }
}

const navItems = [
  { title: 'Dashboard', icon: 'mdi-view-dashboard-outline', path: '/' },
  { title: 'Contas a Pagar', icon: 'mdi-arrow-up-bold-circle-outline', path: '/contas-a-pagar' },
  { title: 'Contas a Receber', icon: 'mdi-arrow-down-bold-circle-outline', path: '/contas-a-receber' },
  { title: 'Gastos avulsos', icon: 'mdi-cart-outline', path: '/gastos-avulsos' },
  { title: 'Patrimônio', icon: 'mdi-cash', path: '/patrimonio' },
  { title: 'Metas', icon: 'mdi-flag-checkered', path: '/metas' },
  { title: 'Configurações', icon: 'mdi-tune-variant', path: '/configuracoes' },
]

const handleLogout = async () => {
  await authStore.logout()
  router.push('/login')
}
</script>

<template>
  <v-app-bar
    flat
    height="64"
    style="background: rgba(15, 16, 35, 0.85); backdrop-filter: blur(12px); border-bottom: 1px solid rgba(62, 121, 150, 0.2);"
  >
    <template #prepend>
      <v-app-bar-nav-icon @click="drawer = !drawer" />
    </template>
    <v-app-bar-title>
      <span class="brand-title">flux<span style="color: #00BAB4">Pay</span></span>
    </v-app-bar-title>
    <v-spacer />
    <v-btn
      icon
      variant="text"
      :title="preferencesStore.privacyMode ? 'Mostrar valores' : 'Ocultar valores'"
      @click="preferencesStore.togglePrivacy()"
    >
      <v-icon :icon="preferencesStore.privacyMode ? 'mdi-eye-off-outline' : 'mdi-eye-outline'" />
    </v-btn>
    <v-avatar v-if="authStore.user?.photoURL" size="36" class="ml-2 mr-3" style="border: 2px solid rgba(0, 186, 180, 0.5)">
      <v-img :src="authStore.user.photoURL" />
    </v-avatar>
  </v-app-bar>

  <v-navigation-drawer
    v-model="drawer"
    :temporary="isMobile"
    width="260"
    style="background: linear-gradient(180deg, #1A1B36 0%, #0F1023 100%); border-right: 1px solid rgba(62, 121, 150, 0.18);"
  >
    <div class="pa-4 user-card mx-3 my-3">
      <div class="d-flex align-center">
        <v-avatar v-if="authStore.user?.photoURL" size="40" class="mr-3">
          <v-img :src="authStore.user.photoURL" />
        </v-avatar>
        <div style="overflow: hidden">
          <div class="text-body-2 font-weight-medium text-truncate">
            {{ authStore.user?.displayName || 'Usuário' }}
          </div>
          <div class="text-caption text-truncate" style="color: #8E94B0">
            {{ authStore.user?.email }}
          </div>
        </div>
      </div>
    </div>

    <v-list nav class="px-2">
      <v-list-item
        v-for="item in navItems"
        :key="item.path"
        :title="item.title"
        :prepend-icon="item.icon"
        :to="item.path"
        :active="route.path === item.path"
        rounded="lg"
        class="mb-1 nav-item"
      />
    </v-list>

    <template #append>
      <div class="pa-3">
        <v-btn
          block
          variant="tonal"
          color="error"
          prepend-icon="mdi-logout"
          @click="handleLogout"
        >
          Sair
        </v-btn>
      </div>
    </template>
  </v-navigation-drawer>

  <v-main class="app-bg">
    <slot />
    <v-btn
      v-if="isMobile"
      class="quick-fab"
      icon
      color="primary"
      size="large"
      :title="fabLabel"
      @click="handleFab"
    >
      <v-icon size="28">mdi-plus</v-icon>
    </v-btn>
  </v-main>
</template>

<style scoped>
.brand-title {
  font-family: 'Space Grotesk', sans-serif;
  font-weight: 700;
  font-size: 1.4rem;
  letter-spacing: -0.03em;
}

.user-card {
  background: linear-gradient(135deg, rgba(0, 186, 180, 0.08), rgba(6, 158, 110, 0.05));
  border: 1px solid rgba(62, 121, 150, 0.2);
  border-radius: 12px;
}

:deep(.nav-item.v-list-item--active) {
  background: linear-gradient(90deg, rgba(0, 186, 180, 0.15), transparent) !important;
  color: #00BAB4 !important;
  border-left: 2px solid #00BAB4;
}

:deep(.nav-item .v-list-item__prepend) {
  opacity: 0.85;
}

.quick-fab {
  position: fixed !important;
  bottom: 20px;
  right: 20px;
  z-index: 1000;
  box-shadow: 0 8px 24px rgba(0, 186, 180, 0.4), 0 0 16px rgba(0, 186, 180, 0.2) !important;
}
</style>
