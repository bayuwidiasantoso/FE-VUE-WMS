<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import {
  getDashboardSummary,
  getDashboardTimeSeries,
  type DashboardSummary,
  type DashboardTimeSeries,
} from '../api/client';
import DashboardBarChart from '../components/DashboardBarChart.vue';

const loading = ref(false);
const errorMessage = ref<string | null>(null);
const summary = ref<DashboardSummary | null>(null);

const ts = ref<DashboardTimeSeries | null>(null);
const tsDays = ref(7);

async function loadSummary() {
  loading.value = true;
  errorMessage.value = null;
  try {
    const [s, t] = await Promise.all([
      getDashboardSummary(),
      getDashboardTimeSeries(tsDays.value),
    ]);
    summary.value = s.data;
    ts.value = t.data;
  } catch (err: any) {
    errorMessage.value = err?.message || 'Gagal memuat data dashboard';
  } finally {
    loading.value = false;
  }
}

const chartData = computed(() => {
  if (!ts.value) {
    return {
      labels: [],
      datasets: [],
    };
  }

  return {
    labels: ts.value.labels,
    datasets: [
      {
        label: 'Masuk',
        data: ts.value.masuk,
        backgroundColor: 'rgba(22,163,74,0.7)', // hijau
      },
      {
        label: 'Keluar',
        data: ts.value.keluar,
        backgroundColor: 'rgba(220,38,38,0.7)', // merah
      },
    ],
  };
});

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'top' as const,
    },
  },
  scales: {
    x: {
      ticks: { autoSkip: true, maxTicksLimit: 10 },
    },
  },
};

onMounted(loadSummary);
</script>

<template>
  <div class="space-y-4">
    <div>
      <h2 class="text-xl font-semibold mb-1">Dashboard</h2>
      <p class="text-sm text-gray-600">
        Ringkasan singkat kondisi gudang dan grafik transaksi.
      </p>
    </div>

    <div
      v-if="errorMessage"
      class="bg-red-50 border border-red-200 text-red-700 text-sm rounded p-3"
    >
      {{ errorMessage }}
    </div>

    <div v-if="loading" class="text-sm text-gray-600">
      Memuat data...
    </div>

    <div v-if="summary && !loading" class="space-y-4">
      <!-- Kartu ringkasan -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div class="bg-white rounded-lg shadow p-4">
          <div class="text-xs text-gray-500 mb-1">Total Barang</div>
          <div class="text-2xl font-semibold">{{ summary.total_barang }}</div>
        </div>
        <div class="bg-white rounded-lg shadow p-4">
          <div class="text-xs text-gray-500 mb-1">Total Stok</div>
          <div class="text-2xl font-semibold">{{ summary.total_stok }}</div>
        </div>
        <div class="bg-white rounded-lg shadow p-4">
          <div class="text-xs text-gray-500 mb-1">Masuk Hari Ini</div>
          <div class="text-2xl font-semibold text-green-600">
            {{ summary.total_masuk_hari_ini }}
          </div>
        </div>
        <div class="bg-white rounded-lg shadow p-4">
          <div class="text-xs text-gray-500 mb-1">Keluar Hari Ini</div>
          <div class="text-2xl font-semibold text-red-600">
            {{ summary.total_keluar_hari_ini }}
          </div>
        </div>
      </div>

      <!-- Grafik -->
      <div class="bg-white rounded-lg shadow p-4 space-y-3">
        <div class="flex items-center justify-between">
          <h3 class="font-semibold text-sm">Grafik Transaksi {{ tsDays }} Hari Terakhir</h3>
          <div class="flex items-center gap-2 text-xs">
            <span>Range:</span>
            <select
              v-model.number="tsDays"
              @change="loadSummary"
              class="border rounded px-2 py-1"
            >
              <option :value="7">7 hari</option>
              <option :value="14">14 hari</option>
              <option :value="30">30 hari</option>
            </select>
          </div>
        </div>

        <div class="h-64">
          <DashboardBarChart :chart-data="chartData" :chart-options="chartOptions" />
        </div>
      </div>

      <!-- Top barang -->
      <div class="bg-white rounded-lg shadow p-4">
        <div class="flex items-center justify-between mb-3">
          <h3 class="font-semibold text-sm">Top 5 Barang Paling Sering Transaksi</h3>
          <button
            class="px-3 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50"
            @click="loadSummary"
          >
            Refresh
          </button>
        </div>

        <div v-if="summary.top_barang.length === 0" class="text-sm text-gray-500">
          Belum ada data transaksi.
        </div>

        <div v-else class="overflow-x-auto">
          <table class="min-w-full text-sm">
            <thead>
              <tr class="bg-gray-100 text-left">
                <th class="px-3 py-2">Barang</th>
                <th class="px-3 py-2">SKU</th>
                <th class="px-3 py-2">Total Qty</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="b in summary.top_barang" :key="b.barang_id" class="border-t">
                <td class="px-3 py-2">
                  {{ b.nama_barang || 'Nonaktif / Terhapus' }}
                </td>
                <td class="px-3 py-2">{{ b.sku }}</td>
                <td class="px-3 py-2 font-mono">{{ b.total_qty }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>
