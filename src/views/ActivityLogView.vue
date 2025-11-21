<script setup lang="ts">
import { ref, onMounted } from 'vue';
import type { ActivityLog } from '../types';
import { getActivityLogs, type ActivityLogFilter } from '../api/client';

const logs = ref<ActivityLog[]>([]);
const loading = ref(false);
const errorMessage = ref<string | null>(null);

const meta = ref({
  current_page: 1,
  per_page: 20,
  total: 0,
  last_page: 1,
});

const filter = ref<ActivityLogFilter>({
  module: '',
  action: '',
  search: '',
  page: 1,
  per_page: 20,
});

async function loadLogs() {
  loading.value = true;
  errorMessage.value = null;
  try {
    const res = await getActivityLogs(filter.value);
    logs.value = res.data;
    meta.value = {
      current_page: res.meta.current_page,
      per_page: res.meta.per_page,
      total: res.meta.total,
      last_page: res.meta.last_page,
    };
  } catch (err: any) {
    errorMessage.value = err?.message || 'Gagal memuat activity log';
  } finally {
    loading.value = false;
  }
}

function applyFilter() {
  filter.value.page = 1;
  loadLogs();
}

function changePage(page: number) {
  if (page < 1 || page > meta.value.last_page) return;
  filter.value.page = page;
  loadLogs();
}

onMounted(loadLogs);
</script>

<template>
  <div class="space-y-4">
    <div>
      <h2 class="text-xl font-semibold mb-2">Activity Log</h2>
      <p class="text-sm text-gray-600">
        Jejak aktivitas sistem (CRUD Barang, Transaksi, Import).
      </p>
    </div>

    <div v-if="errorMessage" class="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2">
      {{ errorMessage }}
    </div>

    <div class="bg-white rounded-lg shadow p-4 space-y-3">
      <div class="grid grid-cols-1 md:grid-cols-4 gap-3 text-sm">
        <div>
          <label class="block text-xs font-medium mb-1">Module</label>
          <select v-model="filter.module" class="w-full border rounded px-2 py-1 text-xs">
            <option value="">Semua</option>
            <option value="barang">barang</option>
            <option value="transaksi">transaksi</option>
          </select>
        </div>
        <div>
          <label class="block text-xs font-medium mb-1">Action</label>
          <select v-model="filter.action" class="w-full border rounded px-2 py-1 text-xs">
            <option value="">Semua</option>
            <option value="CREATE">CREATE</option>
            <option value="UPDATE">UPDATE</option>
            <option value="DELETE">DELETE</option>
            <option value="IMPORT_EXCEL">IMPORT_EXCEL</option>
          </select>
        </div>
        <div>
          <label class="block text-xs font-medium mb-1">Search</label>
          <input
            v-model="filter.search"
            type="text"
            class="w-full border rounded px-2 py-1 text-xs"
            placeholder="Cari di deskripsi/data"
          />
        </div>
        <div class="flex items-end">
          <button
            @click="applyFilter"
            class="px-3 py-1 bg-gray-800 text-white text-xs rounded hover:bg-black"
          >
            Terapkan Filter
          </button>
        </div>
      </div>
    </div>

    <div class="bg-white rounded-lg shadow p-4">
      <div class="flex items-center justify-between mb-3 text-xs text-gray-500">
        <div>
          Halaman {{ meta.current_page }} dari {{ meta.last_page }} ·
          Total {{ meta.total }} log
        </div>
        <button
          @click="loadLogs"
          class="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 text-xs"
        >
          Reload
        </button>
      </div>

      <div v-if="loading" class="text-sm text-gray-600">
        Memuat activity log...
      </div>

      <div v-else class="overflow-x-auto">
        <table class="min-w-full text-xs">
          <thead>
            <tr class="bg-gray-100 text-left">
              <th class="px-3 py-2">Waktu</th>
              <th class="px-3 py-2">Module</th>
              <th class="px-3 py-2">Action</th>
              <th class="px-3 py-2">Deskripsi</th>
              <th class="px-3 py-2">User ID</th>
              <th class="px-3 py-2">IP</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="log in logs" :key="log.id" class="border-t">
              <td class="px-3 py-2">
                {{ new Date(log.created_at).toLocaleString() }}
              </td>
              <td class="px-3 py-2">{{ log.module }}</td>
              <td class="px-3 py-2">
                <span class="px-2 py-0.5 rounded bg-gray-800 text-white text-[10px]">
                  {{ log.action }}
                </span>
              </td>
              <td class="px-3 py-2">
                <div class="max-w-xs truncate" :title="log.description || ''">
                  {{ log.description }}
                </div>
              </td>
              <td class="px-3 py-2">
                {{ log.user_id ?? '-' }}
              </td>
              <td class="px-3 py-2">
                {{ log.ip_address ?? '-' }}
              </td>
            </tr>
            <tr v-if="logs.length === 0">
              <td colspan="6" class="px-3 py-3 text-center text-gray-500">
                Belum ada log.
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="flex items-center justify-between mt-3 text-xs text-gray-600">
        <div>
          Menampilkan {{ logs.length }} baris di halaman ini.
        </div>
        <div class="flex gap-1">
          <button
            class="px-2 py-1 border rounded disabled:opacity-50"
            :disabled="meta.current_page === 1"
            @click="changePage(meta.current_page - 1)"
          >
            Prev
          </button>
          <button
            class="px-2 py-1 border rounded disabled:opacity-50"
            :disabled="meta.current_page === meta.last_page"
            @click="changePage(meta.current_page + 1)"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
