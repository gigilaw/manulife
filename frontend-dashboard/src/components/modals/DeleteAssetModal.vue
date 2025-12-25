<template>
  <v-dialog :model-value="modelValue" @update:model-value="$emit('update:modelValue', $event)" max-width="400">
    <v-card>
      <v-card-title class="text-h6 font-weight-bold">
        Delete Asset
      </v-card-title>
      <v-divider></v-divider>
      <v-card-text class="pt-4">
        <p v-if="asset">
          Are you sure you want to delete 
          <strong>{{ asset.code }} - {{ asset.name }}</strong>?
        </p>
        <p v-else class="text-medium-emphasis">
          No asset selected for deletion.
        </p>
      </v-card-text>
      <v-divider></v-divider>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn variant="text" @click="$emit('update:modelValue', false)">Cancel</v-btn>
        <v-btn 
          color="error" 
          @click="$emit('confirm')"
          :disabled="!asset"
        >
          Confirm Delete
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import type { Asset } from '../../types/dashboard'

interface Props {
  modelValue: boolean
  asset: Asset | null
}

defineProps<Props>()

defineEmits<{
  'update:modelValue': [value: boolean]
  'confirm': []
}>()
</script>