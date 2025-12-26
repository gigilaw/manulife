<template>
  <v-card class="h-100 d-flex flex-column" elevation="2">
    <v-card-title class="text-h6 font-weight-bold d-flex justify-space-between align-center">
      <span>Assets</span>
      <v-btn
        v-if="assets.length > 0"
        color="primary"
        prepend-icon="mdi-plus"
        size="small"
        @click="$emit('add-asset')"
      >
        Add New Asset
      </v-btn>
    </v-card-title>
    <v-divider />
    <v-card-text class="flex-grow-1" style="overflow-y: auto; max-height: 400px;">
      <v-list v-if="assets.length > 0" class="py-0">
        <v-list-item
          v-for="asset in assets"
          :key="asset.id"
          class="px-0"
        >
          <v-list-item-title class="font-weight-medium">
            {{ asset.code }} - {{ asset.name }}
          </v-list-item-title>

          <v-list-item-subtitle>
            {{ formatAssetType(asset.assetType) }}
            <span v-if="asset.quantity">• {{ asset.quantity }} shares</span>
          </v-list-item-subtitle>

          <template #append>
            <div class="d-flex align-center">
              <div class="text-right mr-4">
                <div class="font-weight-medium">
                  ${{ formatCurrency(asset.currentValue) }}
                </div>
                <div
                  class="text-caption"
                  :class="asset.gainLossAmount >= 0 ? 'text-green' : 'text-red'"
                >
                  ${{ formatCurrency(asset.gainLossAmount) }}
                </div>
              </div>

              <v-btn
                class="mr-1"
                icon
                size="small"
                @click="$emit('edit-asset', asset)"
              >
                <v-icon color="primary">mdi-pencil</v-icon>
              </v-btn>

              <v-btn
                icon
                size="small"
                @click="$emit('delete-asset', asset)"
              >
                <v-icon color="error">mdi-delete</v-icon>
              </v-btn>
            </div>
          </template>
        </v-list-item>
      </v-list>
      <div v-else class="text-center py-8">
        <v-icon class="mb-4" color="grey-lighten-2" size="64">mdi-chart-line</v-icon>
        <div class="text-h6 text-medium-emphasis">No assets yet</div>
        <div class="text-caption mt-2">Add your first asset to start tracking</div>
        <v-btn class="mt-4" color="primary" @click="$emit('add-asset')">
          Add First Asset
        </v-btn>
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
  import type { Asset } from '../types/dashboard'
  import { formatAssetType, formatCurrency } from '../utils/formmaters'

  defineProps<{
    assets: Asset[]
  }>()

  defineEmits<{
    'add-asset': []
    'edit-asset': [asset: Asset]
    'delete-asset': [asset: Asset]
  }>()
</script>

<style scoped>
.h-100 {
  height: 100%;
}
</style>
