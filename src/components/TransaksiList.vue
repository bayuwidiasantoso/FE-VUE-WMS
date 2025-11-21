<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue';
import type { TransaksiBarang, Barang } from '../types';
import { getTransaksi, type TransaksiFilter, createTransaksi, getBarangs } from '../api/client';
import { importTransaksi } from '../api/client';
import BarangAutocomplete from './BarangAutocomplete.vue';

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';
const transaksi = ref<TransaksiBarang[]>([]);
const loading = ref(false);
const errorMessage = ref<string | null>(null);
const importTxLoading = ref(false);
const importTxMessage = ref<string | null>(null);

const templateTransaksiImportUrl = computed(
  () => `${apiBaseUrl}/imports/transaksi/template`
);


const meta = ref({
  current_page: 1,
  per_page: 10,
  total: 0,
  last_page: 1,
  summary: {
    total_transaksi: 0,
    total_qty_masuk: 0,
    total_qty_keluar: 0,
    jumlah_transaksi_masuk: 0,
    jumlah_transaksi_keluar: 0,
  },
});

const filter = ref<TransaksiFilter>({
  jenis: '',
  tanggal_from: '',
  tanggal_to: '',
  barang_id: '',
  page: 1,
  per_page: 10,
  sort_by: 'tanggal',
  sort_dir: 'desc',
});

const barangs = ref<Barang[]>([]);

const form = ref({
  barang_id: 0,
  jenis: 'MASUK' as 'MASUK' | 'KELUAR',
  qty: 1,
  tanggal: '',
  keterangan: '',
});

const successMessage = ref<string | null>(null);
const formErrorMessage = ref<string | null>(null);

async function loadBarangs() {
  const res = await getBarangs();
  barangs.value = res.data;
  if (!form.value.barang_id && barangs.value.length > 0) {
    form.value.barang_id = barangs.value[0]!.id;
  }
}

async function loadTransaksi() {
  loading.value = true;
  errorMessage.value = null;

  try {
    const res = await getTransaksi(filter.value);
    transaksi.value = res.data;
    meta.value = {
      current_page: res.meta.current_page,
      per_page: res.meta.per_page,
      total: res.meta.total,
      last_page: res.meta.last_page,
      summary: res.meta.summary || meta.value.summary,
    };
  } catch (err: any) {
    errorMessage.value = err?.message || 'Gagal memuat data transaksi';
  } finally {
    loading.value = false;
  }
}

function applyFilter() {
  filter.value.page = 1;
  loadTransaksi();
}

function resetFilter() {
  filter.value = {
    jenis: '',
    tanggal_from: '',
    tanggal_to: '',
    barang_id: '',
    page: 1,
    per_page: filter.value.per_page,
    sort_by: filter.value.sort_by,
    sort_dir: filter.value.sort_dir,
  };
  loadTransaksi();
}

function changePage(page: number) {
  if (page < 1 || page > meta.value.last_page) return;
  filter.value.page = page;
  loadTransaksi();
}

async function submitTransaksi() {
  formErrorMessage.value = null;
  successMessage.value = null;

  try {
    await createTransaksi({
      barang_id: Number(form.value.barang_id),
      jenis: form.value.jenis,
      qty: Number(form.value.qty),
      tanggal: form.value.tanggal || undefined,
      keterangan: form.value.keterangan || undefined,
    });

    successMessage.value = 'Transaksi berhasil disimpan';
    form.value.qty = 1;
    form.value.keterangan = '';
    await loadTransaksi();
    await loadBarangs();
  } catch (err: any) {
    if (err?.error) {
      formErrorMessage.value = err.error;
    } else if (err?.errors) {
      formErrorMessage.value = (Object.values(err.errors) as string[][]).flat().join(', ');
    } else {
      formErrorMessage.value = err?.message || 'Gagal menyimpan transaksi';
    }
  }
}

function setSort(key: 'tanggal' | 'qty' | 'jenis') {
  if (filter.value.sort_by === key) {
    filter.value.sort_dir = filter.value.sort_dir === 'asc' ? 'desc' : 'asc';
  } else {
    filter.value.sort_by = key;
    filter.value.sort_dir = 'asc';
  }
  filter.value.page = 1;
  loadTransaksi();
}

function sortIcon(key: 'tanggal' | 'qty' | 'jenis') {
  if (filter.value.sort_by !== key) return '↕';
  return filter.value.sort_dir === 'asc' ? '↑' : '↓';
}

const summary = computed(() => meta.value.summary);

onMounted(async () => {
  await loadBarangs();
  await loadTransaksi();
});

watch(
  () => filter.value.per_page,
  () => {
    filter.value.page = 1;
    loadTransaksi();
  }
);

const exportTransaksiExcelUrl = computed(() => {
  const params = new URLSearchParams();

  if (filter.value.jenis)        params.set('jenis', filter.value.jenis);
  if (filter.value.tanggal_from) params.set('tanggal_from', filter.value.tanggal_from);
  if (filter.value.tanggal_to)   params.set('tanggal_to', filter.value.tanggal_to);
  if (filter.value.barang_id)    params.set('barang_id', String(filter.value.barang_id));
  if (filter.value.sort_by)      params.set('sort_by', filter.value.sort_by);
  if (filter.value.sort_dir)     params.set('sort_dir', filter.value.sort_dir);

  const qs = params.toString();
  return `${apiBaseUrl}/exports/transaksi${qs ? `?${qs}` : ''}`;
});

const exportTransaksiPdfUrl = computed(() => {
  const params = new URLSearchParams();

  if (filter.value.jenis)        params.set('jenis', filter.value.jenis);
  if (filter.value.tanggal_from) params.set('tanggal_from', filter.value.tanggal_from);
  if (filter.value.tanggal_to)   params.set('tanggal_to', filter.value.tanggal_to);
  if (filter.value.barang_id)    params.set('barang_id', String(filter.value.barang_id));
  if (filter.value.sort_by)      params.set('sort_by', filter.value.sort_by);
  if (filter.value.sort_dir)     params.set('sort_dir', filter.value.sort_dir);

  const qs = params.toString();
  return `${apiBaseUrl}/exports/transaksi-pdf${qs ? `?${qs}` : ''}`;
});


async function handleImportTransaksi(e: Event) {
  const input = e.target as HTMLInputElement;
  if (!input.files || input.files.length === 0) return;
  const fileImp = input.files[0];

  importTxLoading.value = true;
  importTxMessage.value = null;

  try {
    const res = await importTransaksi(fileImp);
    importTxMessage.value = res.message || 'Import transaksi selesai';
    await loadTransaksi();
    await loadBarangs();
  } catch (err: any) {
    importTxMessage.value = err?.message || 'Gagal import transaksi';
  } finally {
    importTxLoading.value = false;
    input.value = '';
  }
}
</script>

<template>
  <div class="space-y-4">
    <div>
      <h2 class="text-xl font-semibold mb-2">Transaksi Barang</h2>
      <p class="text-sm text-gray-600">
        Pencatatan barang masuk/keluar dengan filter, sort, dan ringkasan.
      </p>
    </div>

    <!-- Ringkasan -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-3">
      <div class="bg-white rounded-lg shadow p-3 text-sm">
        <div class="text-gray-500 text-xs">Total Transaksi</div>
        <div class="text-xl font-semibold">{{ summary.total_transaksi }}</div>
      </div>
      <div class="bg-white rounded-lg shadow p-3 text-sm">
        <div class="text-gray-500 text-xs">Total Qty Masuk</div>
        <div class="text-xl font-semibold text-green-600">{{ summary.total_qty_masuk }}</div>
      </div>
      <div class="bg-white rounded-lg shadow p-3 text-sm">
        <div class="text-gray-500 text-xs">Total Qty Keluar</div>
        <div class="text-xl font-semibold text-red-600">{{ summary.total_qty_keluar }}</div>
      </div>
      <div class="bg-white rounded-lg shadow p-3 text-xs text-gray-600 space-y-1">
        <div>Transaksi Masuk: {{ summary.jumlah_transaksi_masuk }}</div>
        <div>Transaksi Keluar: {{ summary.jumlah_transaksi_keluar }}</div>
      </div>
    </div>

    <!-- Form Transaksi -->
    <!-- (form sama seperti sebelumnya, tidak aku ulang panjang di sini, cukup lanjut pakai form yang sudah kamu punya) -->
    <div class="bg-white rounded-lg shadow p-4 space-y-3">
      <div class="flex items-center justify-between">
        <div>
          <h3 class="font-semibold text-sm">Input Transaksi</h3>
          <p class="text-xs text-gray-500">
            Catat barang masuk atau keluar, stok akan otomatis disesuaikan.
          </p>
        </div>
      </div>

      <!-- Notifikasi error/sukses form -->
      <div v-if="formErrorMessage" class="text-xs text-red-600 bg-red-50 border border-red-200 rounded p-2">
        {{ formErrorMessage }}
      </div>
      <div v-if="successMessage" class="text-xs text-green-700 bg-green-50 border border-green-200 rounded p-2">
        {{ successMessage }}
      </div>

      <form @submit.prevent="submitTransaksi" class="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
        <!-- Barang (Autocomplete) -->
        <div class="md:col-span-2">
          <BarangAutocomplete
            v-model="form.barang_id"
            label="Barang"
          />
        </div>

        <!-- Jenis -->
        <div>
          <label class="block text-sm font-medium mb-1">Jenis Transaksi</label>
          <select
            v-model="form.jenis"
            class="w-full border rounded px-2 py-1 text-sm"
          >
            <option value="MASUK">MASUK (tambah stok)</option>
            <option value="KELUAR">KELUAR (kurangi stok)</option>
          </select>
        </div>

        <!-- Qty -->
        <div>
          <label class="block text-sm font-medium mb-1">Qty</label>
          <input
            v-model.number="form.qty"
            type="number"
            min="1"
            class="w-full border rounded px-2 py-1 text-sm"
          />
        </div>

        <!-- Tanggal -->
        <div>
          <label class="block text-sm font-medium mb-1">Tanggal (opsional)</label>
          <input
            v-model="form.tanggal"
            type="datetime-local"
            class="w-full border rounded px-2 py-1 text-sm"
          />
        </div>

        <!-- Keterangan -->
        <div class="md:col-span-3">
          <label class="block text-sm font-medium mb-1">Keterangan (opsional)</label>
          <textarea
            v-model="form.keterangan"
            rows="2"
            class="w-full border rounded px-2 py-1 text-sm"
            placeholder="Misal: penyesuaian stok, retur, dll."
          ></textarea>
        </div>

        <!-- Tombol submit -->
        <div class="md:col-span-4 flex justify-end gap-2">
          <button
            type="submit"
            class="px-4 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
          >
            Simpan Transaksi
          </button>
        </div>
      </form>
    </div>

    <!-- Filter -->
    <div class="bg-white rounded-lg shadow p-4 space-y-3">
      <div class="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
        <div class="grid grid-cols-1 md:grid-cols-5 gap-3 w-full md:w-auto">
          <div>
            <label class="block text-sm font-medium mb-1">Jenis</label>
            <select v-model="filter.jenis" class="w-full border rounded px-2 py-1 text-sm">
              <option value="">Semua</option>
              <option value="MASUK">MASUK</option>
              <option value="KELUAR">KELUAR</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">Barang</label>
            <select v-model="filter.barang_id" class="w-full border rounded px-2 py-1 text-sm">
              <option value="">Semua barang</option>
              <option v-for="b in barangs" :key="b.id" :value="b.id">
                {{ b.nama_barang }}
              </option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">Tanggal Dari</label>
            <input v-model="filter.tanggal_from" type="date"
                   class="w-full border rounded px-2 py-1 text-sm" />
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">Tanggal Sampai</label>
            <input v-model="filter.tanggal_to" type="date"
                   class="w-full border rounded px-2 py-1 text-sm" />
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">Per Page</label>
            <select v-model.number="filter.per_page" class="w-full border rounded px-2 py-1 text-sm">
              <option :value="5">5</option>
              <option :value="10">10</option>
              <option :value="20">20</option>
            </select>
          </div>
        </div>
        <div class="flex gap-2">
          <button @click="applyFilter"
                  class="px-3 py-1 bg-gray-800 text-white text-xs rounded hover:bg-black">
            Terapkan Filter
          </button>
          <button @click="resetFilter"
                  class="px-3 py-1 border border-gray-300 text-xs rounded hover:bg-gray-50">
            Reset
          </button>
        </div>
      </div>
    </div>

    <!-- Tabel -->
    <div class="bg-white rounded-lg shadow p-4">
      <div class="flex items-center justify-between mb-3">
        <h3 class="font-semibold">Daftar Transaksi</h3>
        <div class="flex items-center gap-2 text-xs">
          <a :href="exportTransaksiExcelUrl" target="_blank"
            class="px-3 py-1 rounded border border-emerald-500 text-emerald-600 hover:bg-emerald-50">
            Export Excel
          </a>
          <a :href="exportTransaksiPdfUrl" target="_blank"
            class="px-3 py-1 rounded border border-rose-500 text-rose-600 hover:bg-rose-50">
            Export PDF
          </a>
          <a
            :href="templateTransaksiImportUrl"
            class="px-3 py-1 rounded border border-blue-500 text-blue-600 hover:bg-blue-50"
          >
            Download Template
          </a>
          <label
            class="inline-flex items-center gap-1 px-3 py-1 rounded border border-gray-300 text-gray-700 hover:bg-gray-50 cursor-pointer"
          >
            <span>Import Excel</span>
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              class="hidden"
              @change="handleImportTransaksi"
            />
          </label>
          <button
            @click="loadTransaksi"
            class="px-3 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50"
          >
            Reload
          </button>
        </div>
      </div>

      <div v-if="importTxMessage" class="text-xs mt-1" :class="importTxLoading ? 'text-gray-500' : 'text-green-600'">
        {{ importTxMessage }}
      </div>



      <div v-if="loading" class="text-sm text-gray-600">Memuat transaksi...</div>

      <div v-else class="overflow-x-auto">
        <table class="min-w-full text-sm">
          <thead>
            <tr class="bg-gray-100 text-left">
              <th class="px-3 py-2 cursor-pointer select-none" @click="setSort('tanggal')">
                <span class="inline-flex items-center gap-1">
                  Tanggal
                  <span class="text-[10px] text-gray-500">{{ sortIcon('tanggal') }}</span>
                </span>
              </th>
              <th class="px-3 py-2">Barang</th>
              <th class="px-3 py-2">SKU</th>
              <th class="px-3 py-2 cursor-pointer select-none" @click="setSort('jenis')">
                <span class="inline-flex items-center gap-1">
                  Jenis
                  <span class="text-[10px] text-gray-500">{{ sortIcon('jenis') }}</span>
                </span>
              </th>
              <th class="px-3 py-2 cursor-pointer select-none" @click="setSort('qty')">
                <span class="inline-flex items-center gap-1">
                  Qty
                  <span class="text-[10px] text-gray-500">{{ sortIcon('qty') }}</span>
                </span>
              </th>
              <th class="px-3 py-2">Keterangan</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="t in transaksi" :key="t.id" class="border-t">
              <td class="px-3 py-2">
                {{ new Date(t.tanggal).toLocaleString() }}
              </td>
              <td class="px-3 py-2">
                {{ t.barang?.nama_barang || t.barang_id }}
              </td>
              <td class="px-3 py-2">
                {{ t.barang?.sku || '-' }}
              </td>
              <td class="px-3 py-2">
                <span
                  :class="[
                    'px-2 py-0.5 rounded text-xs font-semibold',
                    t.jenis === 'MASUK'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-red-100 text-red-700'
                  ]"
                >
                  {{ t.jenis }}
                </span>
              </td>
              <td class="px-3 py-2 font-mono">
                {{ t.qty }}
              </td>
              <td class="px-3 py-2">
                {{ t.keterangan }}
              </td>
            </tr>
            <tr v-if="transaksi.length === 0">
              <td colspan="6" class="px-3 py-3 text-center text-gray-500 text-sm">
                Belum ada transaksi.
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div class="flex items-center justify-between mt-3 text-xs text-gray-600">
        <div>
          Halaman {{ meta.current_page }} dari {{ meta.last_page }} ·
          Total {{ meta.total }} transaksi
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

      <div v-if="errorMessage" class="mt-2 text-sm text-red-600">
        {{ errorMessage }}
      </div>
    </div>
  </div>
</template>
