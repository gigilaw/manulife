<template>
  <v-card class="h-100 d-flex flex-column" elevation="2">
    <v-card-title class="text-h6 font-weight-bold">
      <span>Recent Transactions</span>
    </v-card-title>
    <v-divider />
    <v-card-text class="flex-grow-1" style="overflow-y: auto; max-height: 400px;">
      <v-list v-if="transactions.length > 0" class="py-0">
        <v-list-item
          v-for="transaction in transactions"
          :key="transaction.id"
          class="px-0"
        >
          <v-list-item-title class="font-weight-medium">
            {{ transaction.assetCode }} - {{ transaction.assetName }}
          </v-list-item-title>

          <v-list-item-subtitle>
            <span v-if="transaction.quantity">
              {{ transaction.quantity }} shares @ ${{ formatCurrency(transaction.price) }}
            </span>
          </v-list-item-subtitle>
          <v-list-item-subtitle>
            {{ formatDate(transaction.createdAt) }}
          </v-list-item-subtitle>

          <template #append>
            <v-chip class="font-weight-medium" :color="getTransactionChipColor(transaction.transactionType)" size="small">
              {{ formatTransactionType(transaction.transactionType) }}
            </v-chip>
          </template>
        </v-list-item>
      </v-list>

      <div v-else class="text-center py-8">
        <v-icon class="mb-4" color="grey-lighten-2" size="64">mdi-swap-horizontal</v-icon>
        <div class="text-h6 text-medium-emphasis">No transactions yet</div>
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
  import type { Transaction } from '../types/dashboard'
  import { formatCurrency, formatDate, formatTransactionType } from '../utils/formmaters'

  defineProps<{
    transactions: Transaction[]
  }>()

  function getTransactionChipColor (type: string): string {
    const map: Record<string, string> = {
      BUY: 'green',
      SELL: 'red',
      UPDATE: 'orange',
      DELETE: 'grey',
    }
    return map[type] || 'grey'
  }
</script>

<style scoped>
.h-100 {
  height: 100%;
}
</style>
