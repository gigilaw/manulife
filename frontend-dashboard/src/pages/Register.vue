<template>
  <v-app>
    <v-main>
      <v-container class="fill-height" fluid>
        <v-row align="center" justify="center">
          <v-col
            cols="12"
            lg="5"
            md="6"
            sm="8"
            xl="4"
          >
            <!-- Header -->
            <div class="text-center mb-8">
              <h1 class="text-h4 font-weight-bold mb-2">Create your account</h1>
              <div class="text-caption text-medium-emphasis">
                Fill in your details to get started
              </div>
            </div>

            <!-- Register Card -->
            <v-card class="elevation-2" rounded="lg">
              <v-card-text class="pa-6">
                <v-form ref="form" @submit.prevent="register">
                  <div class="mb-1">
                    <label class="text-caption text-medium-emphasis">First Name</label>
                  </div>
                  <v-text-field
                    v-model="firstName"
                    class="mb-4"
                    density="comfortable"
                    placeholder="Enter your first name"
                    required
                    :rules="firstNameRules"
                    variant="outlined"
                  />

                  <div class="mb-1">
                    <label class="text-caption text-medium-emphasis">Last Name</label>
                  </div>
                  <v-text-field
                    v-model="lastName"
                    class="mb-4"
                    density="comfortable"
                    placeholder="Enter your last name"
                    required
                    :rules="lastNameRules"
                    variant="outlined"
                  />

                  <div class="mb-1">
                    <label class="text-caption text-medium-emphasis">Email</label>
                  </div>
                  <v-text-field
                    v-model="email"
                    class="mb-4"
                    density="comfortable"
                    placeholder="Enter your email"
                    required
                    :rules="emailRules"
                    type="email"
                    variant="outlined"
                  />

                  <div class="mb-1">
                    <label class="text-caption text-medium-emphasis">Password</label>
                  </div>
                  <v-text-field
                    v-model="password"
                    :append-inner-icon="showPassword ? 'mdi-eye' : 'mdi-eye-off'"
                    class="mb-1"
                    density="comfortable"
                    placeholder="Enter your password"
                    required
                    :rules="passwordRules"
                    :type="showPassword ? 'text' : 'password'"
                    variant="outlined"
                    @click:append-inner="togglePasswordVisibility"
                  />

                  <div class="text-caption text-medium-emphasis mt-1 mb-4">
                    • At least 8 characters<br>
                    • At least 1 uppercase letter<br>
                    • At least 1 number
                  </div>

                  <div class="mb-1">
                    <label class="text-caption text-medium-emphasis">Confirm Password</label>
                  </div>
                  <v-text-field
                    v-model="confirmPassword"
                    :append-inner-icon="showConfirmPassword ? 'mdi-eye' : 'mdi-eye-off'"
                    class="mb-6"
                    density="comfortable"
                    placeholder="Confirm your password"
                    required
                    :rules="confirmPasswordRules"
                    :type="showConfirmPassword ? 'text' : 'password'"
                    variant="outlined"
                    @click:append-inner="toggleConfirmPasswordVisibility"
                  />

                  <v-btn
                    block
                    class="text-none font-weight-bold"
                    color="primary"
                    :loading="loading"
                    size="large"
                    type="submit"
                  >
                    Sign Up
                  </v-btn>
                </v-form>
              </v-card-text>
            </v-card>

            <!-- Login Link -->
            <div class="text-center mt-6">
              <span class="text-body-2 text-medium-emphasis">
                Already have an account?
              </span>
              <router-link
                class="text-body-2 text-primary font-weight-medium text-decoration-none ml-1"
                to="/login"
              >
                Log in
              </router-link>
            </div>

            <!-- Error Message -->
            <v-alert
              v-if="errorMessage"
              class="mt-4"
              dense
              type="error"
            >
              {{ errorMessage }}
            </v-alert>

            <!-- Success Message -->
            <v-alert
              v-if="successMessage"
              class="mt-4"
              dense
              type="success"
            >
              {{ successMessage }}
            </v-alert>
          </v-col>
        </v-row>
      </v-container>
    </v-main>
  </v-app>
</template>

<script setup>
  import { computed, ref } from 'vue'
  import { useRouter } from 'vue-router'
  import { auth } from '@/utils/auth'

  const router = useRouter()
  const form = ref(null)

  // Form data
  const firstName = ref('')
  const lastName = ref('')
  const email = ref('')
  const password = ref('')
  const confirmPassword = ref('')
  const showPassword = ref(false)
  const showConfirmPassword = ref(false)
  const loading = ref(false)
  const errorMessage = ref('')
  const successMessage = ref('')

  // Validation rules
  const firstNameRules = [
    v => !!v || 'First name is required',
    v => (v && v.length >= 2) || 'First name must be at least 2 characters',
  ]

  const lastNameRules = [
    v => !!v || 'Last name is required',
    v => (v && v.length >= 2) || 'Last name must be at least 2 characters',
  ]

  const emailRules = [
    v => !!v || 'Email is required',
    v => /.+@.+\..+/.test(v) || 'Email must be valid',
  ]

  const passwordRules = [
    v => !!v || 'Password is required',
    v => (v && v.length >= 8) || 'Password must be at least 8 characters',
    v => /[A-Z]/.test(v) || 'Password must contain at least 1 uppercase letter',
    v => /\d/.test(v) || 'Password must contain at least 1 number',
  ]

  const confirmPasswordRules = computed(() => [
    v => !!v || 'Please confirm your password',
    v => v === password.value || 'Passwords do not match',
  ])

  async function register () {
    // Validate form
    const { valid } = await form.value.validate()
    if (!valid) {
      console.log('Form validation failed')
      return
    }

    loading.value = true
    errorMessage.value = ''
    successMessage.value = ''

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName: firstName.value,
          lastName: lastName.value,
          email: email.value,
          password: password.value,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        successMessage.value = 'Registration successful! Redirecting to login...'
        auth.setAuthData(data)

        setTimeout(() => {
          goToDashboard()
        }, 2000)
      } else {
        errorMessage.value = data.message ?? 'Registration failed. Please try again.'
      }
    } catch (error) {
      console.error('Registration error:', error)
      errorMessage.value = 'Network error. Please try again.'
    } finally {
      loading.value = false
    }
  }

  function togglePasswordVisibility () {
    showPassword.value = !showPassword.value
  }

  function toggleConfirmPasswordVisibility () {
    showConfirmPassword.value = !showConfirmPassword.value
  }

  function goToDashboard () {
    router.push('/dashboard')
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
