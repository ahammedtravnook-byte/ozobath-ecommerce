<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 p-4">
    <div class="w-full max-w-md">
      <!-- Logo -->
      <div class="text-center mb-8">
        <h1 class="text-3xl font-extrabold tracking-tight">
          OZO<span class="text-blue-600">BATH</span>
        </h1>
        <p class="text-gray-500 mt-2">Admin Panel</p>
      </div>

      <!-- Login Card -->
      <div class="bg-white rounded-2xl shadow-lg p-8">
        <h2 class="text-xl font-bold text-gray-900 mb-6">Sign In</h2>

        <form @submit.prevent="handleLogin" class="space-y-5">
          <div>
            <label class="admin-label">Email Address</label>
            <input
              v-model="form.email"
              type="email"
              class="admin-input"
              placeholder="admin@ozobath.com"
              required
            />
          </div>

          <div>
            <label class="admin-label">Password</label>
            <input
              v-model="form.password"
              type="password"
              class="admin-input"
              placeholder="••••••••"
              required
            />
          </div>

          <p v-if="error" class="text-sm text-red-500">{{ error }}</p>

          <button
            type="submit"
            :disabled="loading"
            class="w-full admin-btn-primary py-3 text-base"
          >
            {{ loading ? 'Signing in...' : 'Sign In' }}
          </button>
        </form>
      </div>

      <p class="text-center text-xs text-gray-400 mt-6">
        © {{ new Date().getFullYear() }} OZOBATH. All rights reserved.
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth.store';

const router = useRouter();
const authStore = useAuthStore();
const loading = ref(false);
const error = ref('');
const form = ref({ email: '', password: '' });

const handleLogin = async () => {
  try {
    loading.value = true;
    error.value = '';
    await authStore.login(form.value.email, form.value.password);
    router.push('/');
  } catch (err) {
    if (err.message?.includes('Too many') || err.status === 429) {
      error.value = err.message || 'Too many login attempts. Please try again in 2 minutes.';
    } else {
      error.value = err.message || 'Login failed. Check your credentials.';
    }
  } finally {
    loading.value = false;
  }
};
</script>
