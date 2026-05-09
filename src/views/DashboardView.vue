<script setup lang="ts">
import AppLayout from '../components/layout/AppLayout.vue'
import SummaryCards from '../components/dashboard/SummaryCards.vue'
import CashflowChart from '../components/dashboard/CashflowChart.vue'
import UpcomingList from '../components/dashboard/UpcomingList.vue'
import NetWorthCard from '../components/dashboard/NetWorthCard.vue'
import CheckingCard from '../components/dashboard/CheckingCard.vue'
import PaymentStatusDonut from '../components/dashboard/PaymentStatusDonut.vue'
import BudgetsCard from '../components/dashboard/BudgetsCard.vue'
</script>

<template>
  <AppLayout>
    <v-container class="py-8">
      <div class="mb-6">
        <div class="text-caption text-uppercase mb-1" style="letter-spacing: 0.12em; color: #00BAB4">
          Visão geral
        </div>
        <h1 class="text-h3">Dashboard</h1>
      </div>

      <SummaryCards class="mb-6" />

      <v-row>
        <v-col cols="12" md="6">
          <CheckingCard />
        </v-col>
        <v-col cols="12" md="6">
          <NetWorthCard />
        </v-col>
      </v-row>

      <v-row>
        <v-col cols="12" md="8">
          <CashflowChart />
        </v-col>
        <v-col cols="12" md="4">
          <BudgetsCard />
        </v-col>
      </v-row>

      <v-row>
        <v-col cols="12" md="4">
          <PaymentStatusDonut />
        </v-col>
        <v-col cols="12" md="8">
          <UpcomingList />
        </v-col>
      </v-row>
    </v-container>
  </AppLayout>
</template>
