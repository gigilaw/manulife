<template>
  <div class="dashboard-container">
    <DashboardHeader 
      :user="user"
      @logout="logout"
    />
    
    <DashboardLoading v-if="loading" />
    <template v-if="!loading && !errorMessage && portfolio">
      <PortfolioSummary :summary="portfolio.summary" />
      <AssetAllocation 
        :assets="portfolio.assets"
        :palette="pieChartPalette"
        :options="pieChartOptions"
      />
      <v-row>
        <v-col cols="12" md="6">
          <AssetsCard
            :assets="portfolio.assets"
            @add-asset="openAddAssetModal"
            @edit-asset="openEditAssetModal"
            @delete-asset="openDeleteAssetModal"
          />
        </v-col>
        
        <v-col cols="12" md="6">
          <TransactionsCard 
            :transactions="portfolio.transactions?.records || []"
          />
        </v-col>
      </v-row>
    </template>
    
    <!-- Modals -->
    <AssetModal
      :key="`${editingAsset?.id || 'add'}-${showAssetModal}`"
      :model-value="showAssetModal"
      @update:model-value="showAssetModal = $event"
      :editing-asset="editingAsset"
      :error-message="errorMessage"
      :asset-types="assetTypes"
      @save="saveAsset"
      @cancel="cancelForm"
      @clear-error="errorMessage = ''"
    />
    
    <DeleteAssetModal
    :model-value="showDeleteModal"
    @update:model-value="showDeleteModal = $event"
    :asset="assetToDelete"
    @confirm="deleteAsset"
  />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { auth } from '../utils/auth'
import { api } from '../services/api'
import type { User, Asset, Portfolio } from '../types/dashboard'
import { AssetForm } from '../types/dashboard'

const router = useRouter()

// State
const user = ref<User | null>(auth.getUser())
const loading = ref(false)
const errorMessage = ref('')
const portfolio = ref<Portfolio | null>(null)
const showAssetModal = ref(false)
const showDeleteModal = ref(false)
const editingAsset = ref<Asset | null>(null)
const assetToDelete = ref<Asset | null>(null)

const assetTypes = [
  { title: 'Stock', value: 'STOCK' },
  { title: 'Mutual Fund', value: 'MUTUAL_FUND' },
  { title: 'Bond', value: 'BOND' },
]

const pieChartPalette = ['#2196F3', '#4CAF50', '#FF9800']
const pieChartOptions = {
  donut: true,
  donutWidth: 40,
  startAngle: 0,
  total: 100,
  showLabel: true,
  labelPosition: 'inside',
  labelColor: '#ffffff',
  labelFontSize: '14px',
  hoverEffect: true
}

// Methods
const openAddAssetModal = (): void => {
  editingAsset.value = null 
  showAssetModal.value = true
}

const openEditAssetModal = (asset: Asset): void => {
  editingAsset.value = asset // This will trigger the modal to populate
  showAssetModal.value = true
}

const openDeleteAssetModal = (asset: Asset): void => {
  assetToDelete.value = asset
  showDeleteModal.value = true
}

const cancelForm = async(): Promise<void> => {
  showAssetModal.value = false
  editingAsset.value = null
  errorMessage.value = '' 
  
  // If there was an error, refresh the dashboard to ensure clean state
  if (loading.value) {
    loadDashboardData()
  }
}

const saveAsset = async (formData: AssetForm): Promise<void> => {
  loading.value = true
  errorMessage.value = ''

  try {
    const portfolioId = portfolio.value?.summary?.portfolioId
    
    if (!portfolioId) {
      throw new Error('Portfolio ID is missing')
    }

    const assetData = {
      code: formData.code.trim(),
      name: formData.name.trim(),
      assetType: formData.assetType,
      quantity: Number(formData.quantity),
      price: Number(formData.price),
      purchaseDate: formData.purchaseDate || new Date().toISOString().split('T')[0]
    }

    if (editingAsset.value) {
      await api.put(`/portfolio/${portfolioId}/assets/${editingAsset.value.id}`, {
        quantity: assetData.quantity,
        price: assetData.price
      })
    } else {
      await api.post(`/portfolio/${portfolioId}/assets`, assetData)
    }

    showAssetModal.value = false
    editingAsset.value = null
    await loadDashboardData()
    
  } catch (error) {
    console.error('Save asset error:', error);
    handleApiError(error, 'Failed to save asset')
  } finally {
    loading.value = false
  }
}

const deleteAsset = async (): Promise<void> => {
  loading.value = true

  try {
    const portfolioId = portfolio.value?.summary?.portfolioId
    
    if (!portfolioId) {
      throw new Error('Portfolio ID is missing')
    }

    await api.delete(`/portfolio/${portfolioId}/assets/${assetToDelete.value!.id}`)

    showDeleteModal.value = false
    assetToDelete.value = null
    await loadDashboardData()
    
  } catch (error: any) {
    handleApiError(error, 'Failed to delete asset')
  } finally {
    loading.value = false
  }
}

const loadDashboardData = async (): Promise<void> => {
  if (!auth.isAuthenticated()) {
    router.push('/login')
    return
  }

  loading.value = true
  errorMessage.value = ''

  try {
    const response = await api.get('/portfolio/dashboard')
    if (response.ok) {
      portfolio.value = await response.json()
    } else {
      const errorData = await response.json()
      errorMessage.value = errorData.message || 'Failed to load dashboard data'
    }
  } catch (error) {
    console.error('Dashboard load error:', error)
    errorMessage.value = 'Network error. Please check your connection.'
  } finally {
    loading.value = false
  }
}

const handleApiError = (error: any, defaultMessage: string): void => {
  console.error('API error:', error)
  
  if (error.response?.data?.message) {
    errorMessage.value = error.response.data.message
  } else if (error.message) {
    errorMessage.value = error.message
  } else {
    errorMessage.value = defaultMessage
  }
}

const logout = (): void => {
  auth.clearAuth()
  router.push('/')
}

// Lifecycle
onMounted(async () => {
  await loadDashboardData()
})
</script>

<style scoped>
.dashboard-container {
  padding: 24px;
  margin: 0 auto;
  max-width: 100%;
}

@media (min-width: 600px) {
  .dashboard-container {
    padding: 24px 32px;
  }
}

@media (min-width: 960px) {
  .dashboard-container {
    padding: 32px 48px;
  }
}

@media (min-width: 1280px) {
  .dashboard-container {
    padding: 40px 64px;
    max-width: 1440px;
  }
}
</style>