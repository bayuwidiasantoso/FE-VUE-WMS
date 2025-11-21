<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import type { Barang } from '../types';
import { getBarangs, createBarang, deleteBarang, updateBarang } from '../api/client';
import { RouterLink } from 'vue-router';
import { importBarangs } from '../api/client';
import { useAuth } from '../composables/useAuth';


const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';
const importLoading = ref(false);
const importMessage = ref<string | null>(null);

const { isAdmin } = useAuth();


const templateBarangImportUrl = computed(
  () => `${apiBaseUrl}/imports/barang/template`
);

interface BarangForm {
  id: number | null;
  nama_barang: string;
  sku: string;
  stok: number;
  stok_minimum: number;
  lokasi_rak: string;
}

const barangs = ref<Barang[]>([]);
const loading = ref(false);
const errorMessage = ref<string | null>(null);
const successMessage = ref<string | null>(null);
const isEditing = ref(false);

// search & pagination (frontend)
const search = ref('');
const pageSize = ref(10);
const currentPage = ref(1);

const form = ref<BarangForm>({
  id: null,
  nama_barang: '',
  sku: '',
  stok: 0,
  stok_minimum: 0,
  lokasi_rak: '',
});

async function loadBarang() {
  loading.value = true;
  errorMessage.value = null;
  try {
    const res = await getBarangs();
    barangs.value = res.data;
  } catch (err: any) {
    errorMessage.value = err?.message || 'Gagal memuat data barang';
  } finally {
    loading.value = false;
  }
}

function resetForm() {
  form.value = {
    id: null,
    nama_barang: '',
    sku: '',
    stok: 0,
    stok_minimum: 0,
    lokasi_rak: '',
  };
  isEditing.value = false;
}

const filteredBarangs = computed(() => {
  const q = search.value.toLowerCase().trim();
  if (!q) return barangs.value;
  return barangs.value.filter(b =>
    b.nama_barang.toLowerCase().includes(q) ||
    b.sku.toLowerCase().includes(q) ||
    (b.lokasi_rak || '').toLowerCase().includes(q)
  );
});

const totalPages = computed(() =>
  Math.max(1, Math.ceil(filteredBarangs.value.length / pageSize.value))
);

const pagedBarangs = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  return filteredBarangs.value.slice(start, start + pageSize.value);
});

function goToPage(page: number) {
  if (page < 1 || page > totalPages.value) return;
  currentPage.value = page;
}

async function submitForm() {
  try {
    successMessage.value = null;
    errorMessage.value = null;

    const payload = {
      nama_barang: form.value.nama_barang,
      sku: form.value.sku,
      stok: Number(form.value.stok),
      stok_minimum: Number(form.value.stok_minimum),
      lokasi_rak: form.value.lokasi_rak || null,
    };

    if (!isEditing.value) {
      await createBarang(payload);
      successMessage.value = 'Barang berhasil ditambahkan';
    } else {
      if (!form.value.id) throw new Error('ID barang tidak ditemukan untuk update');
      await updateBarang(form.value.id, payload);
      successMessage.value = 'Barang berhasil diupdate';
    }

    resetForm();
    await loadBarang();
  } catch (err: any) {
    if (err?.errors) {
      errorMessage.value = Object.values(err.errors).flat().join(', ');
    } else if (err?.message) {
      errorMessage.value = err.message;
    } else {
      errorMessage.value = 'Terjadi kesalahan saat menyimpan barang';
    }
  }
}

async function removeBarang(id: number) {
  if (!confirm('Yakin ingin menghapus barang ini?')) return;

  try {
    await deleteBarang(id);
    barangs.value = barangs.value.filter(b => b.id !== id);
  } catch (err: any) {
    alert(err?.message || 'Gagal menghapus barang');
  }
}

function startEdit(barang: Barang) {
  isEditing.value = true;
  successMessage.value = null;
  errorMessage.value = null;

  form.value = {
    id: barang.id,
    nama_barang: barang.nama_barang,
    sku: barang.sku,
    stok: barang.stok,
    stok_minimum: barang.stok_minimum ?? 0,
    lokasi_rak: barang.lokasi_rak ?? '',
  };

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function cancelEdit() {
  resetForm();
  successMessage.value = null;
  errorMessage.value = null;
}

function isLowStock(b: Barang): boolean {
  if (b.stok_minimum && b.stok_minimum > 0) {
    return b.stok < b.stok_minimum;
  }
  return false;
}

onMounted(loadBarang);

// URL export berdasarkan search
const exportUrlExcel = computed(() => {
  const params = new URLSearchParams();
  if (search.value.trim()) params.set('search', search.value.trim());
  const qs = params.toString();
  return `${apiBaseUrl}/exports/barang${qs ? `?${qs}` : ''}`;
});

const exportUrlPdf = computed(() => {
  const params = new URLSearchParams();
  if (search.value.trim()) params.set('search', search.value.trim());
  const qs = params.toString();
  return `${apiBaseUrl}/exports/barang-pdf${qs ? `?${qs}` : ''}`;
});

async function handleImportBarang(e: Event) {
  const input = e.target as HTMLInputElement;
  if (!input.files || input.files.length === 0) return;
  const fileImp = input.files[0];

  importLoading.value = true;
  importMessage.value = null;

  try {
    const res = await importBarangs(fileImp);
    importMessage.value = res.message || 'Import selesai';
    await loadBarang();
  } catch (err: any) {
    importMessage.value = err?.message || 'Gagal import barang';
  } finally {
    importLoading.value = false;
    input.value = '';
  }
}
</script>

<template>
  <div class="space-y-4">
    <div>
      <h2 class="text-xl font-semibold mb-2">Master Barang</h2>
      <p class="text-sm text-gray-600">
        Kelola data barang gudang: stok, lokasi rak, dan batas stok minimum.
      </p>
    </div>

    <!-- FORM -->
    <div v-if="isAdmin" class="bg-white rounded-lg shadow p-4 space-y-3">
      <div class="flex items-center justify-between">
        <h3 class="font-semibold">
          {{ isEditing ? 'Edit Barang' : 'Tambah Barang' }}
        </h3>
        <div v-if="isEditing" class="text-xs text-gray-500">
          Mode edit (ID: {{ form.id }})
        </div>
      </div>

      <div v-if="errorMessage" class="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2">
        {{ errorMessage }}
      </div>
      <div v-if="successMessage" class="text-sm text-green-700 bg-green-50 border border-green-200 rounded p-2">
        {{ successMessage }}
      </div>

      <form class="grid grid-cols-1 md:grid-cols-5 gap-3" @submit.prevent="submitForm">
        <div>
          <label class="block text-sm font-medium mb-1">Nama Barang</label>
          <input
            v-model="form.nama_barang"
            type="text"
            class="w-full border rounded px-2 py-1 text-sm"
            required
          />
        </div>
        <div>
          <label class="block text-sm font-medium mb-1">SKU</label>
          <input
            v-model="form.sku"
            type="text"
            class="w-full border rounded px-2 py-1 text-sm"
            required
          />
        </div>
        <div>
          <label class="block text-sm font-medium mb-1">Stok</label>
          <input
            v-model.number="form.stok"
            type="number"
            min="0"
            class="w-full border rounded px-2 py-1 text-sm"
            required
          />
        </div>
        <div>
          <label class="block text-sm font-medium mb-1">Stok Minimum</label>
          <input
            v-model.number="form.stok_minimum"
            type="number"
            min="0"
            class="w-full border rounded px-2 py-1 text-sm"
          />
        </div>
        <div>
          <label class="block text-sm font-medium mb-1">Lokasi Rak</label>
          <input
            v-model="form.lokasi_rak"
            type="text"
            class="w-full border rounded px-2 py-1 text-sm"
          />
        </div>

        <div class="md:col-span-5 flex justify-end gap-2">
          <button
            v-if="isEditing"
            type="button"
            @click="cancelEdit"
            class="px-4 py-2 border border-gray-300 text-sm rounded hover:bg-gray-50"
          >
            Batal
          </button>
          <button
            type="submit"
            class="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition"
          >
            {{ isEditing ? 'Update Barang' : 'Simpan' }}
          </button>
        </div>
      </form>
    </div>

    <!-- SEARCH & TABLE -->
    <div class="bg-white rounded-lg shadow p-4 space-y-3">
      <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-3">
        <div class="flex items-center gap-2">
          <input
            v-model="search"
            type="text"
            placeholder="Cari nama / SKU / lokasi rak..."
            class="w-full md:w-72 border rounded px-2 py-1 text-sm"
          />
          <button
            @click="loadBarang"
            class="px-3 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50"
          >
            Reload
          </button>
        </div>
        <div class="flex items-center gap-2 text-xs">
          <a v-if="isAdmin"
            :href="exportUrlExcel"
            target="_blank"
            class="px-3 py-1 rounded border border-emerald-500 text-emerald-600 hover:bg-emerald-50"
          >
            Export Excel
          </a>
          <a v-if="isAdmin"
            :href="exportUrlPdf"
            target="_blank"
            class="px-3 py-1 rounded border border-rose-500 text-rose-600 hover:bg-rose-50"
          >
            Export PDF
          </a>
          <a v-if="isAdmin"
            :href="templateBarangImportUrl"
            class="px-3 py-1 rounded border border-blue-500 text-blue-600 hover:bg-blue-50"
          >
            Download Template
          </a>

          <label v-if="isAdmin" class="inline-flex items-center gap-1 px-3 py-1 rounded border border-gray-300 text-gray-700 hover:bg-gray-50 cursor-pointer">
            <span>Import Excel</span>
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              class="hidden"
              @change="handleImportBarang"
            />
          </label>
        </div>
      </div>

      <div v-if="importMessage" class="text-xs mt-1" :class="importLoading ? 'text-gray-500' : 'text-green-600'">
        {{ importMessage }}
      </div>

      <div v-if="loading" class="text-sm text-gray-600">Memuat data...</div>

      <div v-else class="overflow-x-auto">
        <table class="min-w-full text-sm">
          <thead>
            <tr class="bg-gray-100 text-left">
              <th class="px-3 py-2">Nama</th>
              <th class="px-3 py-2">SKU</th>
              <th class="px-3 py-2">Stok</th>
              <th class="px-3 py-2">Stok Min</th>
              <th class="px-3 py-2">Lokasi Rak</th>
              <th v-if="isAdmin" class="px-3 py-2 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="b in pagedBarangs"
              :key="b.id"
              class="border-t"
              :class="isLowStock(b) ? 'bg-red-50' : ''"
            >
              <td class="px-3 py-2">
                <RouterLink
                  :to="`/barang/${b.id}`"
                  class="text-blue-600 hover:underline"
                >
                  {{ b.nama_barang }}
                </RouterLink>
              </td>
              <td class="px-3 py-2">{{ b.sku }}</td>
              <td class="px-3 py-2 font-mono">
                <span :class="isLowStock(b) ? 'text-red-700 font-semibold' : ''">
                  {{ b.stok }}
                </span>
              </td>
              <td class="px-3 py-2 font-mono text-xs text-gray-600">
                {{ b.stok_minimum }}
              </td>
              <td class="px-3 py-2">{{ b.lokasi_rak }}</td>
              <td v-if="isAdmin" class="px-3 py-2 text-right space-x-1">
                <button
                  @click="startEdit(b)"
                  class="px-2 py-1 text-xs bg-amber-500 text-white rounded hover:bg-amber-600"
                >
                  Edit
                </button>
                <button
                  @click="removeBarang(b.id)"
                  class="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
                >
                  Hapus
                </button>
              </td>
            </tr>
            <tr v-if="pagedBarangs.length === 0">
              <td colspan="7" class="px-3 py-3 text-center text-gray-500 text-sm">
                Tidak ada data barang untuk filter saat ini.
              </td>
            </tr>
          </tbody>
        </table>

        <!-- Pagination -->
        <div class="flex items-center justify-between mt-3 text-xs text-gray-600">
          <div>
            Halaman {{ currentPage }} dari {{ totalPages }} ·
            Total {{ filteredBarangs.length }} barang
          </div>
          <div class="flex gap-1">
            <button
              class="px-2 py-1 border rounded disabled:opacity-50"
              :disabled="currentPage === 1"
              @click="goToPage(currentPage - 1)"
            >
              Prev
            </button>
            <button
              class="px-2 py-1 border rounded disabled:opacity-50"
              :disabled="currentPage === totalPages"
              @click="goToPage(currentPage + 1)"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
