<template>
  <v-app>
    <router-view />
    
    <v-dialog v-model="showWarningDialog" max-width="400" persistent>
      <v-card>
        <v-card-title class="text-h6">
          Session Expiring Soon
        </v-card-title>
        <v-card-text>
          You will be logged out due to inactivity in 1 minute. 
          Click below to stay logged in.
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn color="primary" variant="elevated" @click="extendSession">
            Stay Logged In
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-app>
</template>

<script lang="ts" setup>
import { onMounted, onUnmounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import auth from './utils/auth'

const router = useRouter()
const showWarningDialog = ref(false)

const INACTIVITY_TIMEOUT = 15 * 60 * 1000 
const WARNING_TIMEOUT = INACTIVITY_TIMEOUT - (60 * 1000) 

// Event tracking
const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'click'] as const
let inactivityTimer: number
let warningTimer: number
let eventsAttached = false

const isAuthenticated = ref(auth.isAuthenticated())

watch(isAuthenticated, (newVal) => {
  if (newVal) {
    startMonitoring()
  } else {
    stopMonitoring()
  }
})

router.afterEach(() => {
  isAuthenticated.value = auth.isAuthenticated()
})

const startMonitoring = () => {
  if (eventsAttached) return
  
  // Attach event listeners
  events.forEach(event => {
    window.addEventListener(event, resetInactivityTimer, { passive: true })
  })
  
  eventsAttached = true
  resetInactivityTimer()
}

const stopMonitoring = () => {
  clearTimers()
  showWarningDialog.value = false

  if (eventsAttached) {
    events.forEach(event => {
      window.removeEventListener(event, resetInactivityTimer)
    })
    eventsAttached = false
  }
}

const clearTimers = () => {
  if (warningTimer) {
    clearTimeout(warningTimer)
    warningTimer = null
  }
  if (inactivityTimer) {
    clearTimeout(inactivityTimer)
    inactivityTimer = null
  }
}

const resetInactivityTimer = () => {
  if (showWarningDialog.value) return
  
  clearTimers()
  
  if (!auth.isAuthenticated()) {
    stopMonitoring()
    return
  }
  
  // Set warning timer
  warningTimer = setTimeout(() => {
    showWarningDialog.value = true
    events.forEach(event => {
      window.removeEventListener(event, resetInactivityTimer)
    })
  }, WARNING_TIMEOUT)
  
  inactivityTimer = setTimeout(performLogout, INACTIVITY_TIMEOUT)
}

const extendSession = () => {
  showWarningDialog.value = false
  
  if (auth.isAuthenticated() && eventsAttached) {
    events.forEach(event => {
      window.addEventListener(event, resetInactivityTimer, { passive: true })
    })
  }
  
  resetInactivityTimer()
}

const performLogout = () => {
  console.log('Auto-logout due to inactivity')
  stopMonitoring()
  auth.clearAuth()
  router.push('/login')
}

onMounted(() => {
  isAuthenticated.value = auth.isAuthenticated()
  if (isAuthenticated.value) {
    startMonitoring()
  }
})

onUnmounted(() => {
  stopMonitoring()
})
</script>