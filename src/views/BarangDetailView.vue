<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import type { Barang, TransaksiBarang } from '../types';
import { getBarangDetailWithHistory } from '../api/client';

const route = useRoute();
const router = useRouter();

const barang = ref<Barang | null>(null);
const history = ref<TransaksiBarang[]>([]);
const loading = ref(false);
const errorMessage = ref<string | null>(null);

const id = Number(route.params.id);

async function loadDetail() {
  loading.value = true;
  errorMessage.value = null;
  try {
    const res = await getBarangDetailWithHistory(id);
    barang.value = res.data.barang;
    history.value = res.data.history;
  } catch (err: any) {
    errorMessage.value = err?.message || 'Gagal memuat detail barang';
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  if (!id) {
    errorMessage.value = 'ID barang tidak valid';
    return;
  }
  loadDetail();
});
</script>

<template>
  <div class="space-y-4">
    <button
      @click="router.push('/barang')"
      class="text-xs text-blue-600 hover:underline"
    >
      ← Kembali ke Master Barang
    </button>

    <div v-if="errorMessage" class="bg-red-50 border border-red-200 text-red-700 text-sm rounded p-3">
      {{ errorMessage }}
    </div>

    <div v-if="loading" class="text-sm text-gray-600">
      Memuat detail barang...
    </div>

    <div v-if="barang && !loading" class="space-y-4">
      <div class="bg-white rounded-lg shadow p-4">
        <h2 class="text-xl font-semibold mb-2">Detail Barang</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          <div>
            <div class="text-gray-500">Nama Barang</div>
            <div class="font-medium">{{ barang.nama_barang }}</div>
          </div>
          <div>
            <div class="text-gray-500">SKU</div>
            <div class="font-mono">{{ barang.sku }}</div>
          </div>
          <div>
            <div class="text-gray-500">Stok Saat Ini</div>
            <div class="font-semibold">{{ barang.stok }}</div>
          </div>
          <div>
            <div class="text-gray-500">Lokasi Rak</div>
            <div>{{ barang.lokasi_rak }}</div>
          </div>
          <div>
            <div class="text-gray-500">Dibuat</div>
            <div>{{ new Date(barang.created_at).toLocaleString() }}</div>
          </div>
          <div>
            <div class="text-gray-500">Diupdate</div>
            <div>{{ new Date(barang.updated_at).toLocaleString() }}</div>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-lg shadow p-4">
        <div class="flex items-center justify-between mb-3">
          <h3 class="font-semibold text-sm">Riwayat Transaksi Barang Ini</h3>
          <span class="text-xs text-gray-500">
            Menampilkan {{ history.length }} transaksi terakhir
          </span>
        </div>

        <div v-if="history.length === 0" class="text-sm text-gray-500">
          Belum ada transaksi untuk barang ini.
        </div>

        <div v-else class="overflow-x-auto">
          <table class="min-w-full text-sm">
            <thead>
              <tr class="bg-gray-100 text-left">
                <th class="px-3 py-2">Tanggal</th>
                <th class="px-3 py-2">Jenis</th>
                <th class="px-3 py-2">Qty</th>
                <th class="px-3 py-2">Keterangan</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="t in history" :key="t.id" class="border-t">
                <td class="px-3 py-2">{{ new Date(t.tanggal).toLocaleString() }}</td>
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
                <td class="px-3 py-2 font-mono">{{ t.qty }}</td>
                <td class="px-3 py-2">{{ t.keterangan }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>
