<script setup lang="ts">
import { watch } from 'vue'
import { useTheme } from 'vuetify'
import AppToast from './components/common/AppToast.vue'
import { useAuthStore } from './stores/auth'
import { useTransactionsStore } from './stores/transactions'
import { useProjectsStore } from './stores/projects'
import { useSavingsStore } from './stores/savings'
import { useExpensesStore } from './stores/expenses'
import { useCategoriesStore } from './stores/categories'
import { useSnapshotsStore } from './stores/snapshots'
import { useBudgetsStore } from './stores/budgets'
import { usePreferencesStore } from './stores/preferences'

const authStore = useAuthStore()
const txStore = useTransactionsStore()
const projectsStore = useProjectsStore()
const savingsStore = useSavingsStore()
const expensesStore = useExpensesStore()
const categoriesStore = useCategoriesStore()
const snapshotsStore = useSnapshotsStore()
const budgetsStore = useBudgetsStore()
const preferencesStore = usePreferencesStore()
const vuetifyTheme = useTheme()

watch(
  () => preferencesStore.theme,
  (theme) => {
    vuetifyTheme.global.name.value = preferencesStore.resolveTheme(theme)
  },
  { immediate: true }
)

// Auto-snapshot do patrimônio quando savings são carregados (1x por mês)
watch(
  [() => authStore.user?.uid, () => savingsStore.isLoading, () => savingsStore.items.length],
  ([uid, loading]) => {
    if (uid && !loading && savingsStore.items.length > 0) {
      snapshotsStore.captureCurrent(uid, savingsStore.items).catch(() => {})
    }
  }
)

watch(
  () => authStore.user?.uid,
  (uid, oldUid) => {
    if (uid) {
      txStore.subscribe(uid)
      projectsStore.subscribe(uid)
      savingsStore.subscribe(uid)
      expensesStore.subscribe(uid)
      categoriesStore.subscribe(uid)
      snapshotsStore.subscribe(uid)
      budgetsStore.subscribe(uid)
    } else if (oldUid) {
      txStore.unsubscribeAll()
      projectsStore.unsubscribeAll()
      savingsStore.unsubscribeAll()
      expensesStore.unsubscribeAll()
      categoriesStore.unsubscribeAll()
      snapshotsStore.unsubscribeAll()
      budgetsStore.unsubscribeAll()
    }
  },
  { immediate: true }
)
</script>

<template>
  <v-app>
    <RouterView />
    <AppToast />
  </v-app>
</template>
