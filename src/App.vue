<script setup lang="ts">
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuth } from './composables/useAuth';


const route = useRoute();
const router = useRouter();
const { user, isAuthenticated, isAdmin, isStaff, logout } = useAuth();

const navItems = computed(() => {
  const all = [
    { name: 'Dashboard', path: '/', key: 'dashboard', roles: ['admin', 'staff'] },
    { name: 'Master Barang', path: '/barang', key: 'barang', roles: ['admin'] },
    { name: 'Transaksi', path: '/transaksi', key: 'transaksi', roles: ['admin', 'staff']},
    { name: 'Laporan Stok', path: '/laporan', key: 'laporan', roles: ['admin', 'staff'] },
    { name: 'Activity Log', path: '/logs', key: 'logs', roles: ['admin'] },
  ];

  if (!user.value) return [];
  return all.filter((item) => item.roles.includes(user.value!.role));
});

const activePath = computed(() => route.path);

async function handleLogout() {
  await logout();
  router.push({ name: 'login' });
}
</script>

<template>
  <div class="min-h-screen flex flex-col bg-gray-100">
    <header class="bg-white shadow">
      <div class="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <div class="flex items-center gap-2">
          <div class="w-8 h-8 rounded bg-blue-600 flex items-center justify-center text-white text-xs font-bold">
            WMS
          </div>
          <div>
            <h1 class="text-lg font-semibold">Warehouse Management System</h1>
            <p class="text-xs text-gray-500">Laravel 12 API + Vue 3</p>
          </div>
        </div>

        <div v-if="isAuthenticated" class="flex items-center gap-3 text-xs text-gray-600">
          <div class="text-right">
            <div class="font-semibold text-gray-800">
              {{ user?.name }}
            </div>
            <div class="text-[11px] capitalize">
              Role: {{ user?.role }}
            </div>
          </div>
          <button
            @click="handleLogout"
            class="px-3 py-1 rounded border border-gray-300 hover:bg-gray-50 text-xs"
          >
            Logout
          </button>
        </div>
      </div>
    </header>

    <nav v-if="isAuthenticated" class="bg-white border-b">
      <div class="max-w-6xl mx-auto px-4 py-2 flex gap-2">
        <button
          v-for="item in navItems"
          :key="item.key"
          @click="router.push(item.path)"
          class="px-4 py-2 rounded-md text-sm font-medium"
          :class="
            activePath === item.path
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-gray-700 hover:bg-gray-100'
          "
        >
          {{ item.name }}
        </button>
      </div>
    </nav>

    <main class="flex-1">
      <div class="max-w-6xl mx-auto px-4 py-4">
        <router-view />
      </div>
    </main>

     <!-- FOOTER -->
    <footer class="bg-white border-t mt-4">
      <div
        class="max-w-6xl mx-auto px-4 py-4 flex flex-col md:flex-row md:items-center justify-between text-sm text-gray-600"
      >
        <div class="mb-2 md:mb-0">
          © {{ new Date().getFullYear() }} Warehouse Management System ·
          <span class="text-blue-600 font-medium">Vue 3 + Tailwind</span>
        </div>
        <div class="flex items-center gap-3 text-xs">
          <span>v1.0.0</span>
          <span class="hidden md:inline text-gray-400">·</span>
          <span>Bayu Widia Santoso</span>
        </div>
      </div>
    </footer>
    
  </div>
</template>
