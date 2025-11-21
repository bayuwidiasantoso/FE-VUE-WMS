<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref, watch } from 'vue';
import {
  Chart,
  BarController,
  BarElement,
  CategoryScale,
  LinearScale,
  Legend,
  Tooltip,
  type ChartData,
  type ChartOptions,
} from 'chart.js';

Chart.register(BarController, BarElement, CategoryScale, LinearScale, Legend, Tooltip);

const props = defineProps<{
  chartData: ChartData<'bar'>;
  chartOptions?: ChartOptions<'bar'>;
}>();

const canvasRef = ref<HTMLCanvasElement | null>(null);
let chart: Chart<'bar'> | null = null;

function renderChart() {
  if (!canvasRef.value) return;

  if (chart) {
    chart.destroy();
    chart = null;
  }

  chart = new Chart(canvasRef.value, {
    type: 'bar',
    data: props.chartData,
    options: props.chartOptions,
  });
}

onMounted(() => {
  renderChart();
});

onBeforeUnmount(() => {
  if (chart) {
    chart.destroy();
    chart = null;
  }
});

// re-render jika data berubah
watch(
  () => props.chartData,
  () => {
    renderChart();
  },
  { deep: true }
);
</script>

<template>
  <canvas ref="canvasRef"></canvas>
</template>
