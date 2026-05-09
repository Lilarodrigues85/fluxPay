<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import AppLayout from '../components/layout/AppLayout.vue'
import ExportDialog from '../components/common/ExportDialog.vue'
import CategoriesManager from '../components/settings/CategoriesManager.vue'
import BudgetsManager from '../components/settings/BudgetsManager.vue'
import { useAuthStore } from '../stores/auth'
import { useTransactionsStore } from '../stores/transactions'
import { useExpensesStore } from '../stores/expenses'
import { useSavingsStore } from '../stores/savings'
import { useProjectsStore } from '../stores/projects'
import { usePreferencesStore, type ThemeMode } from '../stores/preferences'
import { wipeUserData, deleteAccount } from '../services/dataAdmin.service'
import { getMonthRange, formatDate } from '../utils/dates'

const router = useRouter()
const authStore = useAuthStore()
const txStore = useTransactionsStore()
const expensesStore = useExpensesStore()
const savingsStore = useSavingsStore()
const projectsStore = useProjectsStore()
const preferencesStore = usePreferencesStore()

const exportOpen = ref(false)

// Danger zone state
const wipeOpen = ref(false)
const deleteOpen = ref(false)
const wipeConfirmText = ref('')
const deleteConfirmText = ref('')
const isProcessing = ref(false)
const wipeResult = ref<string | null>(null)
const dangerError = ref<string | null>(null)

const stats = computed(() => [
  { label: 'Transações', count: txStore.transactions.length, icon: 'mdi-swap-horizontal', color: '#00BAB4' },
  { label: 'Gastos avulsos', count: expensesStore.items.length, icon: 'mdi-cart-outline', color: '#FF4D6D' },
  { label: 'Aplicações', count: savingsStore.items.length, icon: 'mdi-cash', color: '#069E6E' },
  { label: 'Metas', count: projectsStore.projects.length, icon: 'mdi-flag-checkered', color: '#A78BFA' },
])

const totalRecords = computed(() => stats.value.reduce((s, x) => s + x.count, 0))

const themeOptions: { value: ThemeMode; label: string; icon: string; description: string }[] = [
  { value: 'flux',       label: 'Escuro',     icon: 'mdi-weather-night',       description: 'Tema padrão do app' },
  { value: 'flux-light', label: 'Claro',      icon: 'mdi-white-balance-sunny', description: 'Fundo claro' },
  { value: 'system',     label: 'Sistema',    icon: 'mdi-theme-light-dark',    description: 'Segue o SO' },
]

const APP_VERSION = '0.1.0'

const monthStartDay = computed({
  get: () => preferencesStore.monthStartDay,
  set: (v: number) => preferencesStore.setMonthStartDay(v),
})

const currentMonthRange = computed(() => getMonthRange(new Date(), preferencesStore.monthStartDay))

async function handleWipe() {
  if (!authStore.user) return
  if (wipeConfirmText.value !== 'LIMPAR') {
    dangerError.value = 'Digite LIMPAR para confirmar'
    return
  }
  isProcessing.value = true
  dangerError.value = null
  wipeResult.value = null
  try {
    const { total } = await wipeUserData(authStore.user.uid)
    wipeResult.value = `${total} registros excluídos.`
    wipeConfirmText.value = ''
    setTimeout(() => { wipeOpen.value = false; wipeResult.value = null }, 1800)
  } catch (err) {
    dangerError.value = (err as Error).message
  } finally {
    isProcessing.value = false
  }
}

async function handleDelete() {
  if (!authStore.user) return
  if (deleteConfirmText.value !== 'EXCLUIR CONTA') {
    dangerError.value = 'Digite EXCLUIR CONTA para confirmar'
    return
  }
  isProcessing.value = true
  dangerError.value = null
  try {
    await deleteAccount(authStore.user.uid)
    router.push('/login')
  } catch (err) {
    dangerError.value = (err as Error).message
  } finally {
    isProcessing.value = false
  }
}
</script>

<template>
  <AppLayout>
    <v-container class="py-8">
      <div class="mb-6">
        <div class="text-caption text-uppercase mb-1" style="letter-spacing: 0.12em; color: #00BAB4">
          Preferências
        </div>
        <h1 class="text-h3">Configurações</h1>
      </div>

      <v-row>
        <!-- Conta -->
        <v-col cols="12" md="6">
          <v-card class="glass-card pa-5 h-100">
            <div class="d-flex align-center mb-4">
              <v-avatar v-if="authStore.user?.photoURL" size="56" class="mr-3">
                <v-img :src="authStore.user.photoURL" />
              </v-avatar>
              <div>
                <div class="text-caption text-uppercase" style="letter-spacing: 0.12em; color: #8E94B0">
                  Conta
                </div>
                <div class="text-h6" style="font-family: 'Space Grotesk'">
                  {{ authStore.user?.displayName }}
                </div>
                <div class="text-caption" style="color: var(--text-muted)">
                  {{ authStore.user?.email }}
                </div>
              </div>
            </div>
            <v-divider class="my-3" style="border-color: var(--border-color)" />
            <p class="text-body-2" style="color: var(--text-muted)">
              Conectada via Google. Para sair, use o botão no menu lateral.
            </p>
          </v-card>
        </v-col>

        <!-- Tema -->
        <v-col cols="12" md="6">
          <v-card class="glass-card pa-5 h-100">
            <div class="d-flex align-center mb-4">
              <div class="header-icon mr-3">
                <v-icon icon="mdi-palette-outline" color="primary" />
              </div>
              <div>
                <div class="text-caption text-uppercase" style="letter-spacing: 0.12em; color: #8E94B0">
                  Aparência
                </div>
                <h3 class="text-h6" style="font-family: 'Space Grotesk'">Tema</h3>
              </div>
            </div>
            <p class="text-body-2 mb-4" style="color: var(--text-muted)">
              O tema escuro foi pensado pro visual futurista. O claro funciona, mas alguns acentos
              podem ficar mais sutis.
            </p>
            <v-btn-toggle
              v-model="preferencesStore.theme"
              mandatory
              divided
              color="primary"
              class="d-flex"
              @update:model-value="(v: string) => preferencesStore.setTheme(v as ThemeMode)"
            >
              <v-btn
                v-for="opt in themeOptions"
                :key="opt.value"
                :value="opt.value"
                :prepend-icon="opt.icon"
                class="flex-grow-1"
              >
                {{ opt.label }}
              </v-btn>
            </v-btn-toggle>
          </v-card>
        </v-col>

        <!-- Privacidade -->
        <v-col cols="12" md="6">
          <v-card class="glass-card pa-5 h-100">
            <div class="d-flex align-center mb-3">
              <div class="header-icon mr-3">
                <v-icon icon="mdi-eye-off-outline" color="primary" />
              </div>
              <div>
                <div class="text-caption text-uppercase" style="letter-spacing: 0.12em; color: #8E94B0">
                  Privacidade
                </div>
                <h3 class="text-h6" style="font-family: 'Space Grotesk'">Modo privacidade</h3>
              </div>
            </div>
            <p class="text-body-2 mb-4" style="color: var(--text-muted)">
              Aplica blur em todos os valores monetários — útil quando alguém olha sua tela ou
              ao fazer screenshots. O atalho fica também no ícone do olho na barra superior.
            </p>
            <v-switch
              v-model="preferencesStore.privacyMode"
              color="primary"
              :label="preferencesStore.privacyMode ? 'Valores ocultos' : 'Valores visíveis'"
              hide-details
            />
          </v-card>
        </v-col>

        <!-- Backup -->
        <v-col cols="12" md="6">
          <v-card class="glass-card export-card pa-5 h-100">
            <div class="export-glow"></div>
            <div class="d-flex align-center mb-3 position-relative" style="z-index: 1">
              <div class="header-icon mr-3" style="background: linear-gradient(135deg, rgba(6, 158, 110, 0.18), rgba(6, 158, 110, 0.05)); border-color: rgba(6, 158, 110, 0.4)">
                <v-icon icon="mdi-microsoft-excel" color="#069E6E" />
              </div>
              <div>
                <div class="text-caption text-uppercase" style="letter-spacing: 0.12em; color: #8E94B0">
                  Backup
                </div>
                <h3 class="text-h6" style="font-family: 'Space Grotesk'">Exportar dados</h3>
              </div>
            </div>
            <p class="text-body-2 mb-4 position-relative" style="color: var(--text-muted); z-index: 1">
              Excel (.xlsx multi-aba) ou ZIP de CSVs. Você pode filtrar por período antes de baixar.
            </p>
            <div class="d-flex flex-wrap ga-2 mb-4 position-relative" style="z-index: 1">
              <div v-for="s in stats" :key="s.label" class="stat-pill">
                <v-icon :icon="s.icon" :color="s.color" size="14" class="mr-1" />
                <span>{{ s.count }}</span>
                <span class="text-caption ml-1" style="color: var(--text-muted)">{{ s.label }}</span>
              </div>
            </div>
            <v-btn
              block
              color="primary"
              size="large"
              prepend-icon="mdi-download"
              :disabled="totalRecords === 0"
              class="position-relative"
              style="z-index: 1"
              @click="exportOpen = true"
            >
              Exportar tudo ({{ totalRecords }} registros)
            </v-btn>
          </v-card>
        </v-col>

        <!-- Dia de início do mês -->
        <v-col cols="12" md="6">
          <v-card class="glass-card pa-5 h-100">
            <div class="d-flex align-center mb-3">
              <div class="header-icon mr-3">
                <v-icon icon="mdi-calendar-start" color="primary" />
              </div>
              <div>
                <div class="text-caption text-uppercase" style="letter-spacing: 0.12em; color: #8E94B0">
                  Período financeiro
                </div>
                <h3 class="text-h6" style="font-family: 'Space Grotesk'">Dia de início do mês</h3>
              </div>
            </div>
            <p class="text-body-2 mb-4" style="color: var(--text-muted)">
              Útil pra alinhar com a data do seu salário ou fechamento do cartão. Os cálculos de
              "este mês" passam a usar este dia como referência.
            </p>
            <v-row align="center">
              <v-col cols="8">
                <v-slider
                  v-model="monthStartDay"
                  :min="1"
                  :max="28"
                  :step="1"
                  thumb-label
                  color="primary"
                  hide-details
                  @update:model-value="(v: number) => preferencesStore.setMonthStartDay(v)"
                />
              </v-col>
              <v-col cols="4" class="text-right">
                <span class="text-h4 font-mono" style="color: #00BAB4; letter-spacing: -0.03em">
                  {{ monthStartDay }}
                </span>
              </v-col>
            </v-row>
            <p class="text-caption" style="color: var(--text-muted)">
              Mês atual:
              <strong>{{ formatDate(currentMonthRange.start) }}</strong>
              até
              <strong>{{ formatDate(currentMonthRange.end) }}</strong>
            </p>
          </v-card>
        </v-col>

        <!-- placeholder pra simetria -->
        <v-col cols="12" md="6">
          <v-card class="glass-card pa-5 h-100 d-flex flex-column justify-center">
            <div class="d-flex align-center mb-2">
              <v-icon color="primary" class="mr-2">mdi-information-outline</v-icon>
              <h3 class="text-h6" style="font-family: 'Space Grotesk'">Dica</h3>
            </div>
            <p class="text-body-2" style="color: var(--text-muted)">
              Se seu salário cai no dia 5 e você quer que cada "mês" comece nesse dia, defina o
              dia de início como 5. As somas, gráficos e orçamentos passam a usar essa janela.
            </p>
          </v-card>
        </v-col>

        <!-- Categorias customizadas -->
        <v-col cols="12">
          <CategoriesManager />
        </v-col>

        <!-- Orçamentos -->
        <v-col cols="12">
          <BudgetsManager />
        </v-col>

        <!-- Danger zone -->
        <v-col cols="12">
          <v-card class="danger-card pa-5">
            <div class="d-flex align-center mb-3">
              <div class="header-icon mr-3" style="background: linear-gradient(135deg, rgba(255, 77, 109, 0.18), rgba(255, 77, 109, 0.05)); border-color: rgba(255, 77, 109, 0.4)">
                <v-icon icon="mdi-alert-octagon-outline" color="error" />
              </div>
              <div>
                <div class="text-caption text-uppercase" style="letter-spacing: 0.12em; color: #FF4D6D">
                  Zona de perigo
                </div>
                <h3 class="text-h6" style="font-family: 'Space Grotesk'">Ações irreversíveis</h3>
              </div>
            </div>

            <v-row>
              <v-col cols="12" md="6">
                <v-card variant="outlined" class="pa-4 h-100" style="border-color: rgba(244, 162, 97, 0.4)">
                  <h4 class="text-subtitle-1 mb-2" style="font-family: 'Space Grotesk'">
                    <v-icon class="mr-1" color="warning">mdi-broom</v-icon>
                    Limpar todos os dados
                  </h4>
                  <p class="text-body-2 mb-3" style="color: var(--text-muted)">
                    Apaga todas as suas transações, gastos, aplicações, metas e categorias.
                    Sua conta de login permanece. <strong>Sem volta.</strong>
                  </p>
                  <v-btn variant="tonal" color="warning" prepend-icon="mdi-broom" @click="wipeOpen = true">
                    Limpar dados
                  </v-btn>
                </v-card>
              </v-col>
              <v-col cols="12" md="6">
                <v-card variant="outlined" class="pa-4 h-100" style="border-color: rgba(255, 77, 109, 0.4)">
                  <h4 class="text-subtitle-1 mb-2" style="font-family: 'Space Grotesk'">
                    <v-icon class="mr-1" color="error">mdi-account-remove</v-icon>
                    Excluir conta
                  </h4>
                  <p class="text-body-2 mb-3" style="color: var(--text-muted)">
                    Apaga todos os dados <em>e</em> sua conta de login do Firebase.
                    Vai pedir confirmação com o Google. <strong>Definitivo.</strong>
                  </p>
                  <v-btn variant="tonal" color="error" prepend-icon="mdi-account-remove" @click="deleteOpen = true">
                    Excluir conta
                  </v-btn>
                </v-card>
              </v-col>
            </v-row>
          </v-card>
        </v-col>

        <!-- Sobre -->
        <v-col cols="12">
          <v-card class="glass-card pa-5">
            <div class="d-flex align-center mb-3">
              <div class="header-icon mr-3">
                <v-icon icon="mdi-information-outline" color="primary" />
              </div>
              <div class="flex-grow-1">
                <div class="text-caption text-uppercase" style="letter-spacing: 0.12em; color: #8E94B0">
                  Sobre
                </div>
                <h3 class="text-h6" style="font-family: 'Space Grotesk'">fluxPay</h3>
              </div>
              <v-chip variant="tonal" color="primary">v{{ APP_VERSION }}</v-chip>
            </div>

            <v-row class="mt-2">
              <v-col cols="12" md="6">
                <div class="text-caption text-uppercase mb-1" style="letter-spacing: 0.08em; color: #8E94B0">
                  Stack
                </div>
                <p class="text-body-2" style="color: var(--text-muted)">
                  Vue 3 · Vuetify 3 · Pinia · Vite · TypeScript<br>
                  Firebase (Auth, Firestore, Hosting)<br>
                  Chart.js · ExcelJS · date-fns
                </p>
              </v-col>
              <v-col cols="12" md="6">
                <div class="text-caption text-uppercase mb-1" style="letter-spacing: 0.08em; color: #8E94B0">
                  Privacidade dos dados
                </div>
                <p class="text-body-2" style="color: var(--text-muted)">
                  Seus dados ficam exclusivamente em <code>users/{{ authStore.user?.uid?.slice(0, 8) }}…</code>
                  no Firestore, acessíveis apenas pela sua conta Google.
                </p>
              </v-col>
            </v-row>
          </v-card>
        </v-col>
      </v-row>

      <ExportDialog v-model="exportOpen" scope="all" />

      <!-- Wipe dialog -->
      <v-dialog v-model="wipeOpen" max-width="500" persistent>
        <v-card class="glass-card">
          <v-card-title class="d-flex align-center pa-4">
            <v-icon color="warning" class="mr-2">mdi-broom</v-icon>
            Limpar todos os dados
          </v-card-title>
          <v-card-text>
            <p class="text-body-2 mb-3">
              Vou apagar <strong class="text-error">todos</strong> os seus registros:
              transações, gastos, aplicações, metas e categorias.
            </p>
            <p class="text-body-2 mb-3">
              Sua conta Google segue ativa, mas o conteúdo do app vai ficar zerado.
              Pra confirmar, digite <strong>LIMPAR</strong>:
            </p>
            <v-text-field v-model="wipeConfirmText" placeholder="LIMPAR" autofocus />
            <p v-if="dangerError" class="text-error text-caption">{{ dangerError }}</p>
            <p v-if="wipeResult" class="text-success">{{ wipeResult }}</p>
          </v-card-text>
          <v-card-actions class="pa-4">
            <v-spacer />
            <v-btn variant="text" :disabled="isProcessing" @click="wipeOpen = false">Cancelar</v-btn>
            <v-btn
              color="warning"
              :loading="isProcessing"
              :disabled="wipeConfirmText !== 'LIMPAR'"
              @click="handleWipe"
            >
              Limpar tudo
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <!-- Delete account dialog -->
      <v-dialog v-model="deleteOpen" max-width="500" persistent>
        <v-card class="glass-card">
          <v-card-title class="d-flex align-center pa-4">
            <v-icon color="error" class="mr-2">mdi-account-remove</v-icon>
            Excluir conta
          </v-card-title>
          <v-card-text>
            <p class="text-body-2 mb-3">
              Vou apagar <strong class="text-error">todos os dados E sua conta</strong> do Firebase.
              Você precisará fazer login novamente do zero se quiser usar de volta.
            </p>
            <p class="text-body-2 mb-3">
              Pra confirmar, digite <strong>EXCLUIR CONTA</strong>:
            </p>
            <v-text-field v-model="deleteConfirmText" placeholder="EXCLUIR CONTA" autofocus />
            <p class="text-caption" style="color: var(--text-muted)">
              <v-icon size="14" class="mr-1">mdi-information-outline</v-icon>
              Vai abrir um popup do Google pra confirmar sua identidade.
            </p>
            <p v-if="dangerError" class="text-error text-caption mt-2">{{ dangerError }}</p>
          </v-card-text>
          <v-card-actions class="pa-4">
            <v-spacer />
            <v-btn variant="text" :disabled="isProcessing" @click="deleteOpen = false">Cancelar</v-btn>
            <v-btn
              color="error"
              :loading="isProcessing"
              :disabled="deleteConfirmText !== 'EXCLUIR CONTA'"
              @click="handleDelete"
            >
              Excluir definitivamente
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </v-container>
  </AppLayout>
</template>

<style scoped>
.header-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: linear-gradient(135deg, rgba(0, 186, 180, 0.18), rgba(0, 186, 180, 0.05));
  border: 1px solid rgba(0, 186, 180, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.export-card {
  position: relative;
  overflow: hidden;
}
.export-glow {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(ellipse 60% 80% at 100% 0%, rgba(6, 158, 110, 0.18), transparent 60%),
    radial-gradient(ellipse 50% 70% at 0% 100%, rgba(0, 186, 180, 0.12), transparent 60%);
  pointer-events: none;
}

.danger-card {
  background: linear-gradient(135deg, rgba(255, 77, 109, 0.05), rgba(244, 162, 97, 0.03)) !important;
  border: 1px solid rgba(255, 77, 109, 0.3);
}

.stat-pill {
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  border-radius: 999px;
  background: var(--legend-pill-bg);
  border: 1px solid var(--border-color);
  font-size: 0.85rem;
  font-family: 'Space Grotesk', sans-serif;
  font-feature-settings: 'tnum';
  font-weight: 600;
}
</style>
