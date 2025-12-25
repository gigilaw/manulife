<template>
  <v-card class="mb-6" elevation="2">
    <v-card-title class="text-h6 font-weight-bold">
      Assets Allocation
    </v-card-title>
    <v-divider></v-divider>
    <v-card-text>
      <v-row align="center">
        <v-col cols="12" md="7" class="d-flex flex-column justify-center">
          <div class="pie-chart-container d-flex align-center justify-center">
            <v-pie
              reveal
              :palette="palette"
              :items="pieChartItems"
              :options="options"
              :tooltip="{ subtitleFormat: '[value]%' }"
            ></v-pie>
          </div>
        </v-col>
        
        <!-- Legend -->
        <v-col cols="12" md="5">
          <div class="pie-legend">
            <div 
              v-for="(item, index) in pieChartItems" 
              :key="item.key" 
              class="mb-2 pa-3 rounded"
            >
              <div class="d-flex align-center">
                <div class="legend-color mr-3" :style="{ backgroundColor: palette[index] }"></div>
                <div class="flex-grow-1">
                  <div class="font-weight-medium">{{ item.title }}</div>
                  <div class="text-caption text-medium-emphasis">
                    ${{ formatCurrency(item.currentValue) }}
                    <span v-if="item.count">
                      • {{ item.count }} {{ item.count === 1 ? 'asset' : 'assets' }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </v-col>
      </v-row>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Asset } from '../types/dashboard'
import { formatCurrency, formatAssetType } from '../utils/formmaters'

interface Props {
  assets: Asset[]
  palette: string[]
  options: any
}

const props = defineProps<Props>()

const pieChartItems = computed(() => {
  if (!props.assets?.length) return []
  
  const typeData: Record<string, { value: number; count: number; codes: Set<string> }> = {}
  
  props.assets.forEach(asset => {
    if (!asset.assetType) return
    
    const type = asset.assetType
    const currentValue = Number(asset.currentValue) || 0
    
    if (!typeData[type]) {
      typeData[type] = {
        value: 0,
        count: 0,
        codes: new Set()
      }
    }
    
    typeData[type].value += currentValue
    
    if (asset.code) {
      typeData[type].codes.add(asset.code)
      typeData[type].count = typeData[type].codes.size
    }
  })
  
  const totalValue = Object.values(typeData).reduce((sum, data) => sum + data.value, 0)
  const entries = Object.entries(typeData)
  let sumPercentages = 0
  
  return entries.map(([assetType, data], index) => {
    let percentage
    
    if (index === entries.length - 1) {
      percentage = 100 - sumPercentages
    } else {
      percentage = totalValue > 0 ? (data.value / totalValue) * 100 : 0
      percentage = Number(percentage.toFixed(0))
      sumPercentages += percentage
    }
    
    return {
      key: index + 1,
      title: formatAssetType(assetType),
      value: percentage,
      percentage: percentage,
      currentValue: data.value,
      assetType: assetType,
      count: data.count
    }
  })
})
</script>

<style scoped>
.pie-chart-container {
  position: relative;
  min-height: 350px;
}

.pie-legend {
  max-width: 400px;
}

.legend-color {
  width: 20px;
  height: 20px;
  border-radius: 4px;
}
</style>