<template>
  <v-app>
    <v-main>
      <v-container class="fill-height" fluid>
        <v-row align="center" justify="center">
          <v-col cols="12" sm="8" md="6" lg="4" xl="3">
            <!-- Header -->
            <div class="text-center mb-8">
              <h1 class="text-h4 font-weight-bold mb-2">Log into your account</h1>
            </div>

            <!-- Login Card -->
            <v-card class="elevation-2" rounded="lg">
              <v-card-text class="pa-6">
                <!-- Form -->
                <v-form ref="form" @submit.prevent="login">
                  <!-- Email Field -->
                  <div class="mb-1">
                    <label class="text-caption text-medium-emphasis">Email</label>
                  </div>
                  <v-text-field
                    v-model="email"
                    placeholder="Enter your email"
                    type="email"
                    variant="outlined"
                    density="comfortable"
                    :rules="emailRules"
                    required
                  ></v-text-field>

                  <!-- Password Field -->
                  <div class="mb-1">
                    <label class="text-caption text-medium-emphasis">Password</label>
                  </div>
                  <v-text-field
                    v-model="password"
                    placeholder="Enter your password"
                    :type="showPassword ? 'text' : 'password'"
                    variant="outlined"
                    density="comfortable"
                    :rules="passwordRules"
                    :append-inner-icon="showPassword ? 'mdi-eye' : 'mdi-eye-off'"
                    @click:append-inner="togglePasswordVisibility"
                    class="mb-1"
                    required
                  ></v-text-field>
                
                <div class="d-flex justify-space-between align-center mt-8 mb-4">
                  <!-- Login Button - REMOVE @click handler -->
                  <v-btn
                    block
                    color="primary"
                    size="large"
                    type="submit"
                    :loading="loading"
                    class="text-none font-weight-bold"
                  >
                    Log In
                  </v-btn>
                </div>
                </v-form>
              </v-card-text>
            </v-card>

            <!-- Sign Up Link -->
            <div class="text-center mt-6">
              <span class="text-body-2 text-medium-emphasis">
                Don't have an account?
              </span>
                <router-link 
                  to="/register"
                  class="text-body-2 text-primary font-weight-medium text-decoration-none ml-1"
                >
                  Sign up
                </router-link>
            </div>

            <!-- Error Message -->
            <v-alert
              v-if="errorMessage"
              dense
              type="error"
              class="mt-4"
            >
              {{ errorMessage }}
            </v-alert>
          </v-col>
        </v-row>
      </v-container>
    </v-main>
  </v-app>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { auth } from '@/utils/auth'

const router = useRouter()
const form = ref(null)

const email = ref('')
const password = ref('')
const loading = ref(false)
const errorMessage = ref('')
const showPassword = ref(false)

const emailRules = [
  v => !!v || 'Email is required',
  v => /.+@.+\..+/.test(v) || 'Email must be valid'
]

const passwordRules = [
  v => !!v || 'Password is required',
  v => (v && v.length >= 8) || 'Password must be at least 8 characters'
]

async function login() {
  // Validate form
  const { valid } = await form.value.validate()
  if (!valid) {
    console.log('Form validation failed')
    return
  }
  
  loading.value = true
  errorMessage.value = ''

  try {
    const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: email.value,
        password: password.value
      })
    })

    const data = await response.json()
    if (response.ok) {
        auth.setAuthData(data)
        router.push('/dashboard')
    } else {
        if (data.message) {
            errorMessage.value = data.message
        } else {
            errorMessage.value = 'Login failed. Please try again.'
        }
    }
  } catch (error) {
    console.error('Login error:', error)
    errorMessage.value = 'Network error. Please try again.'
  } finally {
    loading.value = false
  }
}

function togglePasswordVisibility() {
  showPassword.value = !showPassword.value
}

function goToRegister() {
  router.push('/register')
}
</script>

<style scoped>
.v-card {
  border: 1px solid rgba(0, 0, 0, 0.12);
}

.v-btn {
  text-transform: none !important;
  letter-spacing: normal;
}

.v-text-field :deep(.v-field) {
  border-radius: 8px;
}

a {
  transition: color 0.2s ease;
  cursor: pointer;
}

a:hover {
  opacity: 0.8;
}
</style>