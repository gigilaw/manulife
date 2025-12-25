<template>
  <v-card elevation="2" class="h-100 d-flex flex-column">
    <v-card-title class="text-h6 font-weight-bold">
      <span>Recent Transactions</span>
    </v-card-title>
    <v-divider></v-divider>
    <v-card-text class="flex-grow-1" style="overflow-y: auto; max-height: 400px;">
      <v-list v-if="transactions.length" class="py-0">
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
          
          <template v-slot:append>
            <v-chip :color="getTransactionChipColor(transaction.transactionType)" size="small" class="font-weight-medium">
              {{ formatTransactionType(transaction.transactionType) }}
            </v-chip>
          </template>
        </v-list-item>
      </v-list>
      
      <div v-else class="text-center py-8">
        <v-icon size="64" color="grey-lighten-2" class="mb-4">mdi-swap-horizontal</v-icon>
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

const getTransactionChipColor = (type: string): string => {
  const map: Record<string, string> = {
    'BUY': 'green',
    'SELL': 'red',
    'UPDATE': 'orange',
    'DELETE': 'grey'
  }
  return map[type] || 'grey'
}
</script>

<style scoped>
.h-100 {
  height: 100%;
}
</style>