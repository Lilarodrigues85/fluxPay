<script setup lang="ts">
import AppLayout from '../components/layout/AppLayout.vue'
import HealthScoreCard from '../components/insights/HealthScoreCard.vue'
import MonthComparisonCard from '../components/insights/MonthComparisonCard.vue'
import TopExpensesCard from '../components/insights/TopExpensesCard.vue'
import SuggestionsCard from '../components/insights/SuggestionsCard.vue'
</script>

<template>
  <AppLayout>
    <v-container class="py-8">
      <div class="mb-6">
        <div class="text-caption text-uppercase mb-1" style="letter-spacing: 0.12em; color: #00BAB4">
          Diagnóstico
        </div>
        <h1 class="text-h3">Análise financeira</h1>
        <p class="text-body-2 mt-2" style="color: var(--text-muted)">
          Score, comparativos e sugestões baseadas no seu histórico.
        </p>
      </div>

      <v-row>
        <v-col cols="12">
          <HealthScoreCard />
        </v-col>
      </v-row>

      <v-row>
        <v-col cols="12" md="6">
          <MonthComparisonCard />
        </v-col>
        <v-col cols="12" md="6">
          <SuggestionsCard />
        </v-col>
      </v-row>

      <v-row>
        <v-col cols="12">
          <TopExpensesCard />
        </v-col>
      </v-row>
    </v-container>
  </AppLayout>
</template>
