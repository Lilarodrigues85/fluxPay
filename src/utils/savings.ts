import type { SavingsType } from '../types'

export const SAVINGS_TYPES: { value: SavingsType; label: string; icon: string; color: string }[] = [
  { value: 'checking',  label: 'Conta Corrente',     icon: 'mdi-bank-outline',         color: '#3E7996' },
  { value: 'savings',   label: 'Poupança',           icon: 'mdi-piggy-bank-outline',   color: '#069E6E' },
  { value: 'cdb',       label: 'CDB / RDB / LCI',    icon: 'mdi-shield-check-outline', color: '#00BAB4' },
  { value: 'treasury',  label: 'Tesouro Direto',     icon: 'mdi-bank-circle-outline',  color: '#2F6C82' },
  { value: 'funds',     label: 'Fundo de Investimento', icon: 'mdi-chart-pie',         color: '#A78BFA' },
  { value: 'stocks',    label: 'Ações / ETFs',       icon: 'mdi-chart-line-variant',   color: '#F4A261' },
  { value: 'crypto',    label: 'Criptomoedas',       icon: 'mdi-bitcoin',              color: '#F472B6' },
  { value: 'cash',      label: 'Dinheiro em espécie', icon: 'mdi-cash',                color: '#94A3B8' },
  { value: 'other',     label: 'Outro',              icon: 'mdi-wallet-outline',       color: '#8E94B0' },
]

export function savingsTypeMeta(type: SavingsType) {
  return SAVINGS_TYPES.find((t) => t.value === type) ?? SAVINGS_TYPES[SAVINGS_TYPES.length - 1]
}
