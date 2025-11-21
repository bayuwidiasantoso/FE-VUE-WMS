<script setup lang="ts">
import { ref } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuth } from '../composables/useAuth';

const email = ref('');
const password = ref('');
const loading = ref(false);
const errorMessage = ref<string | null>(null);

const router = useRouter();
const route = useRoute();
const { login } = useAuth();

async function handleLogin() {
  loading.value = true;
  errorMessage.value = null;

  try {
    await login(email.value.trim(), password.value);

    // const redirect = (route.query.redirect as string) || '/';
    // router.push(redirect);
    router.push('/');
  } catch (err: any) {
    if (err?.message) {
      errorMessage.value = err.message;
    } else if (err?.error) {
      errorMessage.value = err.error;
    } else {
      errorMessage.value = 'Login gagal, periksa email dan password.';
    }
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-100 px-4">
    <div class="w-full max-w-md bg-white shadow-lg rounded-lg p-6 space-y-5">
      
      <!-- Header -->
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded bg-blue-600 text-white flex items-center justify-center font-bold text-sm">
          WMS
        </div>
        <div>
          <h1 class="text-lg font-semibold">Login</h1>
          <p class="text-xs text-gray-500">Warehouse Management System</p>
        </div>
      </div>

      <!-- Error -->
      <div
        v-if="errorMessage"
        class="bg-red-50 border border-red-300 text-red-700 px-3 py-2 rounded text-sm"
      >
        {{ errorMessage }}
      </div>

      <!-- Form -->
      <form @submit.prevent="handleLogin" class="space-y-4">
        <div>
          <label class="block text-sm font-medium mb-1">Email</label>
          <input
            v-model="email"
            type="email"
            required
            class="w-full border rounded px-3 py-2 text-sm focus:ring focus:ring-blue-200"
          />
        </div>

        <div>
          <label class="block text-sm font-medium mb-1">Password</label>
          <input
            v-model="password"
            type="password"
            required
            class="w-full border rounded px-3 py-2 text-sm focus:ring focus:ring-blue-200"
          />
        </div>

        <button
          type="submit"
          class="w-full py-2 rounded bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
          :disabled="loading"
        >
          {{ loading ? 'Memproses...' : 'Masuk' }}
        </button>
      </form>

      <!-- Demo Users -->
      <div class="text-xs mt-3 text-gray-500 leading-4 border-t pt-3">
        <p class="font-medium text-gray-700 mb-1">Demo akun:</p>
        <p>Admin → <span class="font-mono">admin@example.com / password</span></p>
        <p>Staff → <span class="font-mono">staff@example.com / password</span></p>
      </div>
    </div>
  </div>
</template>
