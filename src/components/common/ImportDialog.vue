<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useAuthStore } from '../../stores/auth'
import { useToastStore } from '../../stores/toast'
import {
  parseCsv,
  mapCsvToFields,
  commitImport,
  type ImportScope,
  type ParsedRow,
} from '../../utils/importCsv'

const props = defineProps<{
  modelValue: boolean
  scope: ImportScope
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const authStore = useAuthStore()
const toast = useToastStore()

const isOpen = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
})

const fileInput = ref<HTMLInputElement | null>(null)
const fileName = ref<string>('')
const rows = ref<ParsedRow[]>([])
const missing = ref<string[]>([])
const isImporting = ref(false)

const SCOPE_LABEL: Record<ImportScope, string> = {
  payable: 'Contas a Pagar',
  receivable: 'Contas a Receber',
  expenses: 'Gastos avulsos',
}

const validCount = computed(() => rows.value.filter((r) => r.valid).length)
const invalidCount = computed(() => rows.value.length - validCount.value)
const previewRows = computed(() => rows.value.slice(0, 10))

function reset() {
  fileName.value = ''
  rows.value = []
  missing.value = []
  if (fileInput.value) fileInput.value.value = ''
}

watch(isOpen, (open) => { if (open) reset() })

function pickFile() {
  fileInput.value?.click()
}

async function handleFile(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  fileName.value = file.name
  try {
    const text = await file.text()
    const csvRows = parseCsv(text)
    if (csvRows.length < 2) {
      toast.error('CSV vazio ou sem dados')
      return
    }
    const result = mapCsvToFields(csvRows, props.scope)
    rows.value = result.rows
    missing.value = result.missingRequired
  } catch (err) {
    toast.error('Erro ao ler arquivo: ' + (err as Error).message)
  }
}

async function handleImport() {
  if (!authStore.user) return
  isImporting.value = true
  try {
    const result = await commitImport(authStore.user.uid, props.scope, rows.value)
    if (result.success > 0) {
      toast.success(`${result.success} registros importados`)
    }
    if (result.failed > 0) {
      toast.warning(`${result.failed} linhas ignoradas (com erros)`)
    }
    isOpen.value = false
  } catch (err) {
    toast.error('Erro na importação: ' + (err as Error).message)
  } finally {
    isImporting.value = false
  }
}
</script>

<template>
  <v-dialog v-model="isOpen" max-width="780">
    <v-card class="glass-card">
      <v-card-title class="d-flex align-center pa-4">
        <div class="dialog-icon mr-3">
          <v-icon icon="mdi-file-upload-outline" color="primary" />
        </div>
        <span style="font-family: 'Space Grotesk'; letter-spacing: -0.01em">
          Importar {{ SCOPE_LABEL[scope] }}
        </span>
      </v-card-title>

      <v-card-text>
        <input
          ref="fileInput"
          type="file"
          accept=".csv,text/csv"
          style="display: none"
          @change="handleFile"
        />

        <div v-if="rows.length === 0">
          <p class="text-body-2 mb-3" style="color: var(--text-muted)">
            Selecione um arquivo CSV. Cabeçalhos esperados (case-insensitive, com ou sem acento):
          </p>
          <div class="headers-help">
            <code v-if="scope === 'expenses'">
              Data; Descrição; Categoria; Pagamento; Valor; Observações
            </code>
            <code v-else>
              Descrição; Categoria; Vencimento; Valor; Status; Pago em; Observações
            </code>
          </div>
          <p class="text-caption mt-2" style="color: var(--text-muted)">
            <v-icon size="14" class="mr-1">mdi-information-outline</v-icon>
            Aceita separadores <strong>;</strong> ou <strong>,</strong>. Datas em
            <code>dd/mm/aaaa</code> ou <code>aaaa-mm-dd</code>. Valores em <code>1234,56</code> ou <code>1234.56</code>.
            Os arquivos exportados pelo próprio fluxPay são compatíveis.
          </p>
          <v-btn
            block
            size="large"
            color="primary"
            variant="tonal"
            prepend-icon="mdi-paperclip"
            class="mt-4"
            @click="pickFile"
          >
            Selecionar CSV
          </v-btn>
        </div>

        <div v-else>
          <div class="d-flex align-center mb-3">
            <v-icon class="mr-2">mdi-file-delimited-outline</v-icon>
            <span class="font-weight-medium">{{ fileName }}</span>
            <v-spacer />
            <v-btn variant="text" size="small" @click="reset">Trocar</v-btn>
          </div>

          <div v-if="missing.length > 0" class="alert-warn mb-3">
            <v-icon color="error" class="mr-2">mdi-alert-octagon</v-icon>
            <div>
              <strong>Cabeçalhos obrigatórios não encontrados:</strong>
              <code class="ml-1">{{ missing.join(', ') }}</code>
            </div>
          </div>

          <div class="d-flex ga-2 mb-3">
            <v-chip color="success" variant="tonal" prepend-icon="mdi-check-circle">
              {{ validCount }} válida(s)
            </v-chip>
            <v-chip v-if="invalidCount > 0" color="error" variant="tonal" prepend-icon="mdi-alert">
              {{ invalidCount }} com erro
            </v-chip>
          </div>

          <div class="text-caption mb-2" style="color: var(--text-muted)">
            Pré-visualização das primeiras 10 linhas:
          </div>
          <v-table density="compact" class="preview-table">
            <thead>
              <tr>
                <th style="width: 40px"></th>
                <th v-for="(_v, k) in (previewRows[0]?.data || {})" :key="k">{{ k }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(r, i) in previewRows" :key="i" :class="{ 'row-error': !r.valid }">
                <td>
                  <v-icon
                    size="16"
                    :icon="r.valid ? 'mdi-check' : 'mdi-alert'"
                    :color="r.valid ? 'success' : 'error'"
                    :title="r.errors.join(', ')"
                  />
                </td>
                <td v-for="(v, k) in r.data" :key="k">{{ v }}</td>
              </tr>
            </tbody>
          </v-table>
        </div>
      </v-card-text>

      <v-card-actions class="pa-4">
        <v-spacer />
        <v-btn variant="text" :disabled="isImporting" @click="isOpen = false">Cancelar</v-btn>
        <v-btn
          v-if="rows.length > 0"
          color="primary"
          prepend-icon="mdi-database-import"
          :loading="isImporting"
          :disabled="validCount === 0 || missing.length > 0"
          @click="handleImport"
        >
          Importar {{ validCount }} registros
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<style scoped>
.dialog-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: linear-gradient(135deg, rgba(0, 186, 180, 0.18), rgba(0, 186, 180, 0.05));
  border: 1px solid rgba(0, 186, 180, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
}

.headers-help {
  background: rgba(15, 16, 35, 0.5);
  border: 1px solid var(--border-color);
  padding: 12px;
  border-radius: 8px;
  font-size: 0.85rem;
  overflow-x: auto;
}

.alert-warn {
  display: flex;
  align-items: center;
  padding: 12px;
  background: rgba(255, 77, 109, 0.08);
  border: 1px solid rgba(255, 77, 109, 0.3);
  border-radius: 8px;
  font-size: 0.9rem;
}

.preview-table {
  background: transparent !important;
  font-size: 0.78rem;
  max-height: 280px;
  overflow-y: auto;
  border: 1px solid var(--border-color);
  border-radius: 8px;
}
.preview-table :deep(thead th) {
  font-size: 0.7rem !important;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #8E94B0 !important;
}
.preview-table .row-error {
  background: rgba(255, 77, 109, 0.06);
}
</style>
