<template>
  <v-card class="mb-6" flat>
    <v-card-title class="d-flex justify-space-between align-center">
      <div>
        <h1 class="text-h5 font-weight-bold">
          <span v-if="user">{{ user.firstName }} {{ user.lastName }}'s</span>
          <span v-else>User</span>
          Dashboard
        </h1>
      </div>
      <v-btn color="error" prepend-icon="mdi-logout" @click="$emit('logout')">
        Logout
      </v-btn>
    </v-card-title>
  </v-card>
</template>

<script setup lang="ts">
  import type { User } from '../types/dashboard'

  defineProps<{
    user: User | null
  }>()

  defineEmits<{
    logout: []
  }>()
</script>
