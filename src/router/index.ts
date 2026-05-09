import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import LoginView from '../views/LoginView.vue'
import DashboardView from '../views/DashboardView.vue'
import PayableView from '../views/PayableView.vue'
import ReceivableView from '../views/ReceivableView.vue'
import ExpensesView from '../views/ExpensesView.vue'
import ProjectsView from '../views/ProjectsView.vue'
import SavingsView from '../views/SavingsView.vue'
import SettingsView from '../views/SettingsView.vue'

const routes = [
  {
    path: '/login',
    component: LoginView,
  },
  {
    path: '/',
    component: DashboardView,
    meta: { requiresAuth: true },
  },
  {
    path: '/contas-a-pagar',
    component: PayableView,
    meta: { requiresAuth: true },
  },
  {
    path: '/contas-a-receber',
    component: ReceivableView,
    meta: { requiresAuth: true },
  },
  {
    path: '/gastos-avulsos',
    component: ExpensesView,
    meta: { requiresAuth: true },
  },
  {
    path: '/metas',
    component: ProjectsView,
    meta: { requiresAuth: true },
  },
  {
    path: '/patrimonio',
    component: SavingsView,
    meta: { requiresAuth: true },
  },
  {
    path: '/configuracoes',
    component: SettingsView,
    meta: { requiresAuth: true },
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

router.beforeEach((to, _from, next) => {
  const authStore = useAuthStore()

  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next('/login')
  } else if (to.path === '/login' && authStore.isAuthenticated) {
    next('/')
  } else {
    next()
  }
})

export default router
