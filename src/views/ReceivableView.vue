<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import AppLayout from '../components/layout/AppLayout.vue'
import TransactionDialog from '../components/transactions/TransactionDialog.vue'
import TransactionTable from '../components/transactions/TransactionTable.vue'
import ExportDialog from '../components/common/ExportDialog.vue'
import ImportDialog from '../components/common/ImportDialog.vue'
import { useTransactionsStore } from '../stores/transactions'
import { formatCurrency } from '../utils/currency'
import type { Transaction } from '../types'

const route = useRoute()

const txStore = useTransactionsStore()

const dialogOpen = ref(false)
const exportOpen = ref(false)
const importOpen = ref(false)
const editingTx = ref<Transaction | null>(null)
const filterStatus = ref<string>('all')

const filtered = computed(() => {
  if (filterStatus.value === 'all') return txStore.receivable
  return txStore.receivable.filter((t) => t.status === filterStatus.value)
})

const totalPending = computed(() => txStore.totalPending('receivable'))
const monthTotal = computed(() => txStore.monthTotal('receivable'))

const openNew = () => {
  editingTx.value = null
  dialogOpen.value = true
}

const handleEdit = (tx: Transaction) => {
  editingTx.value = tx
  dialogOpen.value = true
}

watch(() => route.query.new, (v) => { if (v) openNew() }, { immediate: true })
</script>

<template>
  <AppLayout>
    <v-container class="py-8">
      <div class="d-flex align-start mb-6">
        <div>
          <div class="text-caption text-uppercase mb-1" style="letter-spacing: 0.12em; color: #069E6E">
            Receitas
          </div>
          <h1 class="text-h3">Contas a Receber</h1>
        </div>
        <v-spacer />
        <v-btn
          variant="text"
          size="large"
          class="mr-2"
          prepend-icon="mdi-upload"
          @click="importOpen = true"
        >
          Importar
        </v-btn>
        <v-btn
          variant="tonal"
          size="large"
          class="mr-2"
          prepend-icon="mdi-download"
          :disabled="txStore.receivable.length === 0"
          @click="exportOpen = true"
        >
          Exportar
        </v-btn>
        <v-btn color="primary" size="large" prepend-icon="mdi-plus" @click="openNew">
          Nova receita
        </v-btn>
      </div>

      <v-row class="mb-4">
        <v-col cols="12" md="6">
          <v-card class="glass-card pa-4">
            <div class="text-caption text-uppercase mb-2" style="letter-spacing: 0.08em; color: #8E94B0">
              Total a receber
            </div>
            <div class="text-h4 font-weight-bold money-value" style="color: #069E6E">
              {{ formatCurrency(totalPending) }}
            </div>
          </v-card>
        </v-col>
        <v-col cols="12" md="6">
          <v-card class="glass-card pa-4">
            <div class="text-caption text-uppercase mb-2" style="letter-spacing: 0.08em; color: #8E94B0">
              Total do mês
            </div>
            <div class="text-h4 font-weight-bold money-value">
              {{ formatCurrency(monthTotal) }}
            </div>
          </v-card>
        </v-col>
      </v-row>

      <v-card class="glass-card pa-4">
        <v-select
          v-model="filterStatus"
          :items="[
            { title: 'Todos', value: 'all' },
            { title: 'Pendentes', value: 'pending' },
            { title: 'Vencidos', value: 'overdue' },
            { title: 'Recebidos', value: 'paid' },
          ]"
          label="Filtrar por status"
          density="compact"
          class="mb-2"
          style="max-width: 240px"
        />

        <TransactionTable
          :transactions="filtered"
          type="receivable"
          @edit="handleEdit"
        />
      </v-card>

      <TransactionDialog
        v-model="dialogOpen"
        type="receivable"
        :transaction="editingTx"
      />

      <ExportDialog v-model="exportOpen" scope="receivable" />
      <ImportDialog v-model="importOpen" scope="receivable" />
    </v-container>
  </AppLayout>
</template>
