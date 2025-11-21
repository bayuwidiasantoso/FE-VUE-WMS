<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import type { Barang, LowStockResponse } from '../types';
import { getLowStock } from '../api/client';

const loading = ref(false);
const errorMessage = ref<string | null>(null);
const successMessage = ref<string | null>(null);

const items = ref<Barang[]>([]);

// pagination state
const page = ref(1);
const perPage = ref(10);
const lastPage = ref(1);
const total = ref(0);

// mode info
const mode = ref<'stok_minimum' | 'threshold' | null>(null);
const usedThreshold = ref<number | null>(null);

// threshold filter (opsional)
const thresholdInput = ref<number | null>(null);

async function fetchPage(targetPage: number, append = false) {
  loading.value = true;
  errorMessage.value = null;

  try {
    const thresholdVal =
      thresholdInput.value !== null && !Number.isNaN(thresholdInput.value)
        ? thresholdInput.value
        : undefined;

    const res: LowStockResponse = await getLowStock({
      page: targetPage,
      per_page: perPage.value,
      threshold: thresholdVal,
    });

    if (!append) {
      items.value = res.data;
    } else {
      // append ke list sebelumnya
      items.value = [...items.value, ...res.data];
    }

    page.value = res.meta.current_page;
    perPage.value = res.meta.per_page;
    lastPage.value = res.meta.last_page;
    total.value = res.meta.total;

    mode.value = res.meta.mode;
    usedThreshold.value =
      res.meta.threshold !== undefined ? res.meta.threshold : null;

    successMessage.value = res.message || 'Laporan stok rendah berhasil dimuat';
  } catch (err: any) {
    errorMessage.value = err?.message || 'Gagal memuat laporan stok rendah';
  } finally {
    loading.value = false;
  }
}

function reloadAll() {
  // saat filter berubah atau di-reload:
  page.value = 1;
  items.value = [];
  fetchPage(1, false);
}

function applyThreshold() {
  reloadAll();
}

function resetThreshold() {
  thresholdInput.value = null;
  reloadAll();
}

function loadMore() {
  if (page.value >= lastPage.value) return;
  const nextPage = page.value + 1;
  fetchPage(nextPage, true);
}

const hasMore = computed(() => page.value < lastPage.value);

const visibleCount = computed(() => items.value.length);

onMounted(() => {
  reloadAll();
});

// kalau perPage diubah dari dropdown → reload
watch(
  () => perPage.value,
  () => {
    reloadAll();
  }
);
</script>

<template>
  <div class="space-y-4">
    <div>
      <h2 class="text-xl font-semibold mb-2">Laporan Stok Rendah</h2>
      <p class="text-sm text-gray-600">
        Menampilkan barang-barang yang stoknya berada di bawah batas minimum
        (stok_minimum atau threshold tertentu) dengan pemanggilan bertahap.
      </p>
    </div>

    <!-- Info / Error -->
    <div
      v-if="errorMessage"
      class="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2"
    >
      {{ errorMessage }}
    </div>
    <div
      v-if="successMessage"
      class="text-sm text-green-700 bg-green-50 border border-green-200 rounded p-2"
    >
      {{ successMessage }}
    </div>

    <!-- Filter Threshold + Info Mode -->
    <div class="bg-white rounded-lg shadow p-4 space-y-3">
      <div class="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
        <div class="flex flex-col sm:flex-row sm:items-end gap-3">
          <div>
            <label class="block text-sm font-medium mb-1">
              Threshold Global (opsional)
            </label>
            <div class="flex items-center gap-2">
              <input
                v-model.number="thresholdInput"
                type="number"
                min="0"
                class="w-32 border rounded px-2 py-1 text-sm"
                placeholder="mis. 10"
              />
              <button
                @click="applyThreshold"
                class="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
              >
                Terapkan
              </button>
              <button
                v-if="thresholdInput !== null"
                @click="resetThreshold"
                class="px-3 py-1 border border-gray-300 text-xs rounded hover:bg-gray-50"
              >
                Reset
              </button>
            </div>
          </div>

          <div class="text-xs text-gray-500 space-y-1">
            <div v-if="mode === 'stok_minimum'">
              Mode:
              <span class="font-semibold text-emerald-600">
                stok_minimum per barang
              </span>
              (stok &lt; stok_minimum).
            </div>
            <div v-else-if="mode === 'threshold'">
              Mode:
              <span class="font-semibold text-amber-600">
                threshold global
              </span>
              (stok &lt;
              <span class="font-semibold">{{ usedThreshold ?? '-' }}</span>).
            </div>
            <div v-else>
              Mode: otomatis, berdasarkan pengaturan backend.
            </div>
            <div>
              Menampilkan
              <span class="font-semibold">{{ visibleCount }}</span>
              dari
              <span class="font-semibold">{{ total }}</span>
              barang stok rendah ({{ page }}/{{ lastPage }} halaman).
            </div>
          </div>
        </div>

        <div class="flex items-center gap-2 text-xs text-gray-500">
          <span>Per halaman:</span>
          <select v-model.number="perPage" class="border rounded px-2 py-1">
            <option :value="5">5</option>
            <option :value="10">10</option>
            <option :value="20">20</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Tabel + Load More -->
    <div class="bg-white rounded-lg shadow p-4">
      <div class="flex items-center justify-between mb-3">
        <h3 class="font-semibold text-sm">Daftar Barang Stok Rendah</h3>
        <button
          @click="reloadAll"
          class="px-3 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50"
        >
          Reload
        </button>
      </div>

      <div v-if="loading && items.length === 0" class="text-sm text-gray-600">
        Memuat laporan stok rendah...
      </div>

      <div v-else class="space-y-3">
        <div class="overflow-x-auto">
          <table class="min-w-full text-sm">
            <thead>
              <tr class="bg-gray-100 text-left">
                <th class="px-3 py-2">Nama Barang</th>
                <th class="px-3 py-2">SKU</th>
                <th class="px-3 py-2">Stok</th>
                <th class="px-3 py-2">Stok Minimum</th>
                <th class="px-3 py-2">Lokasi Rak</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="b in items" :key="b.id" class="border-t">
                <td class="px-3 py-2">{{ b.nama_barang }}</td>
                <td class="px-3 py-2 font-mono text-xs">{{ b.sku }}</td>
                <td class="px-3 py-2 font-mono">
                  <span
                    :class="[
                      'px-2 py-0.5 rounded text-xs',
                      (b as any).stok_minimum && b.stok < (b as any).stok_minimum
                        ? 'bg-red-100 text-red-700 font-semibold'
                        : 'bg-yellow-50 text-yellow-700'
                    ]"
                  >
                    {{ b.stok }}
                  </span>
                </td>
                <td class="px-3 py-2 font-mono text-xs">
                  {{ (b as any).stok_minimum ?? '-' }}
                </td>
                <td class="px-3 py-2 text-xs">
                  {{ b.lokasi_rak || '-' }}
                </td>
              </tr>
              <tr v-if="items.length === 0">
                <td colspan="6" class="px-3 py-3 text-center text-gray-500 text-sm">
                  Tidak ada barang dengan stok rendah untuk kriteria saat ini.
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Load More Controls -->
        <div
          v-if="total > 0"
          class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs text-gray-600"
        >
          <div>
            Menampilkan
            <span class="font-semibold">{{ visibleCount }}</span>
            dari
            <span class="font-semibold">{{ total }}</span>
            barang.
          </div>
          <div class="flex gap-2">
            <button
              v-if="hasMore"
              @click="loadMore"
              :disabled="loading"
              class="px-4 py-1.5 text-xs rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
            >
              Load more (halaman berikutnya)
            </button>
          </div>
        </div>

        <div v-if="loading && items.length > 0" class="text-xs text-gray-500">
          Memuat halaman berikutnya...
        </div>
      </div>
    </div>
  </div>
</template>
