<template>
  <v-row class="mb-6">
    <v-col cols="12" md="3" sm="6">
      <v-card class="pa-4" elevation="2">
        <div class="text-caption text-medium-emphasis">Total Market Value</div>
        <div class="text-h4 font-weight-bold primary--text mt-2">
          ${{ formatCurrency(summary.totalValue) }}
        </div>
        <v-divider class="my-4" />
        <div class="text-caption">Current portfolio value</div>
      </v-card>
    </v-col>

    <v-col cols="12" md="3" sm="6">
      <v-card class="pa-4" elevation="2">
        <div class="text-caption text-medium-emphasis">Total Cost</div>
        <div class="text-h4 font-weight-bold mt-2">
          ${{ formatCurrency(summary.totalCost) }}
        </div>
        <v-divider class="my-4" />
        <div class="text-caption">Total invested amount</div>
      </v-card>
    </v-col>

    <v-col cols="12" md="3" sm="6">
      <v-card class="pa-4" :class="cardClass(summary.totalGainLoss)" elevation="2">
        <div class="d-flex justify-space-between align-center">
          <div class="text-caption text-medium-emphasis">Gain/Loss</div>
        </div>
        <div class="text-h4 font-weight-bold mt-2" :class="textColor(summary.totalGainLoss)">
          ${{ formatCurrency(summary.totalGainLoss) }}
        </div>
        <v-divider class="my-4" />
        <div class="text-caption">Unrealized gain/loss</div>
      </v-card>
    </v-col>

    <v-col cols="12" md="3" sm="6">
      <v-card class="pa-4" :class="cardClass(summary.totalReturnPercentage)" elevation="2">
        <div class="d-flex justify-space-between align-center">
          <div class="text-caption text-medium-emphasis">Return %</div>
        </div>
        <div class="text-h4 font-weight-bold mt-2" :class="textColor(summary.totalReturnPercentage)">
          {{ formatPercentage(summary.totalReturnPercentage) }}
        </div>
        <v-divider class="my-4" />
        <div class="text-caption">Total return percentage</div>
      </v-card>
    </v-col>
  </v-row>
</template>

<script setup lang="ts">
  import type { PortfolioSummary } from '../types/dashboard'
  import { formatCurrency, formatPercentage } from '../utils/formmaters'

  defineProps<{
    summary: PortfolioSummary
  }>()

  function cardClass (value: number) {
    return value >= 0 ? 'gain-background' : 'loss-background'
  }

  function textColor (value: number) {
    return value >= 0 ? 'text-green' : 'text-red'
  }
</script>

<style scoped>
.gain-background {
  background: linear-gradient(135deg, rgba(76, 175, 80, 0.1) 0%, rgba(76, 175, 80, 0.05) 100%);
}

.loss-background {
  background: linear-gradient(135deg, rgba(244, 67, 54, 0.1) 0%, rgba(244, 67, 54, 0.05) 100%);
}
</style>
