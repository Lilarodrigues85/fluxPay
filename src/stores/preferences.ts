import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

const STORAGE_KEY = 'fluxpay:preferences'

export type ThemeMode = 'flux' | 'flux-light' | 'system'

interface Preferences {
  privacyMode: boolean
  theme: ThemeMode
  monthStartDay: number  // 1-28
}

const DEFAULTS: Preferences = {
  privacyMode: false,
  theme: 'flux',
  monthStartDay: 1,
}

function load(): Preferences {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { ...DEFAULTS }
    const parsed = JSON.parse(raw) as Partial<Preferences>
    return { ...DEFAULTS, ...parsed }
  } catch {
    return { ...DEFAULTS }
  }
}

function persist(prefs: Preferences) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs))
  } catch {
    // ignore quota errors
  }
}

function resolveTheme(theme: ThemeMode): 'flux' | 'flux-light' {
  if (theme === 'system') {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'flux' : 'flux-light'
    }
    return 'flux'
  }
  return theme
}

export const usePreferencesStore = defineStore('preferences', () => {
  const initial = load()
  const privacyMode = ref(initial.privacyMode)
  const theme = ref<ThemeMode>(initial.theme)
  const monthStartDay = ref<number>(Math.max(1, Math.min(28, initial.monthStartDay || 1)))

  function applyPrivacyClass(active: boolean) {
    if (typeof document === 'undefined') return
    document.body.classList.toggle('privacy-mode', active)
  }

  applyPrivacyClass(privacyMode.value)

  watch([privacyMode, theme, monthStartDay], ([priv, thm, msd]) => {
    persist({ privacyMode: priv, theme: thm, monthStartDay: msd })
    applyPrivacyClass(priv)
  })

  // listener pra mudanças de prefer-color-scheme do sistema
  if (typeof window !== 'undefined' && window.matchMedia) {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    mq.addEventListener?.('change', () => {
      // o componente que aplica o tema vai pegar via watch pelo `theme`
      // forçamos uma reatividade trocando ref pra mesmo valor
      if (theme.value === 'system') {
        const t = theme.value
        theme.value = 'flux'
        theme.value = t
      }
    })
  }

  function togglePrivacy() {
    privacyMode.value = !privacyMode.value
  }

  function setTheme(t: ThemeMode) {
    theme.value = t
  }

  function setMonthStartDay(d: number) {
    monthStartDay.value = Math.max(1, Math.min(28, Math.floor(d) || 1))
  }

  return {
    privacyMode,
    theme,
    monthStartDay,
    togglePrivacy,
    setTheme,
    setMonthStartDay,
    resolveTheme,
  }
})
