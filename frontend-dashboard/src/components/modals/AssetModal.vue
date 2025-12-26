<template>
  <v-dialog :model-value="modelValue" @update:model-value="$emit('update:modelValue', $event)" max-width="600">
    <v-card>
      <v-card-title class="text-h6 font-weight-bold">
        {{ editingAsset ? 'Edit Asset' : 'Add New Asset' }}
      </v-card-title>
      
      <v-alert
        v-if="errorMessage"
        type="error"
        variant="tonal"
        class="mx-4 mt-2"
        closable
        @click:close="$emit('clear-error')"
      >
        {{ errorMessage }}
      </v-alert>
      
      <v-divider></v-divider>
      <v-card-text class="pt-4">
        <v-form>
          <v-row>
            <v-col cols="12" md="6">
              <v-text-field
                v-model="localForm.code"
                label="Code"
                variant="outlined"
                :disabled="!!editingAsset"
                :rules="[v => !!v || 'Code is required']"
              ></v-text-field>
            </v-col>
            
            <v-col cols="12" md="6">
              <v-select
                v-model="localForm.assetType"
                label="Asset Type"
                :items="assetTypes"
                variant="outlined"
                :disabled="!!editingAsset"
                :rules="[v => !!v || 'Asset type is required']"
              ></v-select>
            </v-col>
            
            <v-col cols="12" md="6">
              <v-text-field
                v-model="localForm.name"
                label="Name"
                placeholder="Apple Inc."
                variant="outlined"
                :disabled="!!editingAsset"
                :rules="[v => !!v || 'Name is required']"
              ></v-text-field>
            </v-col>
            
            <v-col cols="12" md="6">
              <v-text-field
                v-model="localForm.quantity"
                label="Quantity/Shares"
                type="number"
                variant="outlined"
                :rules="[
                    v => !!v || 'Quantity is required',
                    v => Number.isInteger(Number(v)) || 'Quantity must be a whole number',
                    editingAsset 
                        ? v => v >= 0 || 'Quantity must be 0 or greater' 
                        : v => v > 0 || 'Quantity must be greater than 0'
                    ]">                
                </v-text-field>
            </v-col>
            
            <v-col cols="12" md="6">
              <v-text-field
                v-model="localForm.price"
                label="Price per Share"
                prefix="$"
                type="number"
                step="0.01"
                variant="outlined"
                :rules="[
                    v => !!v || 'Price is required',
                    v => v > 0 || 'Price must be greater than 0',
                    v => /^\d+(\.\d{1,2})?$/.test(v) || 'Price can have up to 2 decimal places'
                ]">
                </v-text-field>
            </v-col>
          </v-row>
        </v-form>
      </v-card-text>
      <v-divider></v-divider>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn variant="text" @click="$emit('cancel')">Cancel</v-btn>
        <v-btn color="primary" @click="handleSave">
          {{ editingAsset ? 'Update' : 'Add' }} Asset
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import type { Asset, AssetForm, AssetType } from '../../types/dashboard'

interface Props {
  modelValue: boolean
  editingAsset: Asset | null
  errorMessage: string
  assetTypes: AssetType[]
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'save': [form: AssetForm]
  'cancel': []
  'clear-error': []
}>()

const localForm = ref<AssetForm>(getInitialForm())

function getInitialForm(): AssetForm {
  if (props.editingAsset) {
    return {
      code: props.editingAsset.code || '',
      name: props.editingAsset.name || '',
      assetType: props.editingAsset.assetType || '',
      quantity: Number(props.editingAsset.quantity) || 0,
      price: Number(props.editingAsset.price) || 0,
      purchaseDate: props.editingAsset.purchaseDate
    }
  } else {
    return {
      code: '',
      name: '',
      assetType: '',
      quantity: null,
      price: null,
      purchaseDate: new Date().toISOString().split('T')[0]
    }
  }
}

const handleSave = () => {
  if (!localForm.value.code || !localForm.value.assetType || !localForm.value.name) {
    return
  }
  
  const formData: AssetForm = {
    ...localForm.value,
    quantity: Number(localForm.value.quantity) || 0,
    price: Number(localForm.value.price) || 0
  }
  
  emit('save', formData)
}
</script>