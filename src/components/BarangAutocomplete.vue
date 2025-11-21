<script setup lang="ts">
import { ref, watch, onMounted } from 'vue';
import type { Barang } from '../types';
import { autocompleteBarangs } from '../api/client';

const props = defineProps<{
  modelValue: number | null;       // barang_id
  label?: string;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: number | null): void;
}>();

const query = ref('');
const suggestions = ref<Barang[]>([]);
const open = ref(false);
const loading = ref(false);

async function search() {
  if (!query.value.trim()) {
    suggestions.value = [];
    open.value = false;
    return;
  }
  loading.value = true;
  try {
    suggestions.value = await autocompleteBarangs(query.value);
    open.value = suggestions.value.length > 0;
  } catch {
    suggestions.value = [];
    open.value = false;
  } finally {
    loading.value = false;
  }
}

function selectBarang(b: Barang) {
  query.value = `${b.nama_barang} (${b.sku})`;
  emit('update:modelValue', b.id);
  open.value = false;
}

watch(query, () => {
  // debounce ringan
  if (!query.value.trim()) {
    suggestions.value = [];
    open.value = false;
    emit('update:modelValue', null);
    return;
  }
  search();
});

// Saat value dari luar berubah (misal saat edit transaksi),
// kamu bisa extend nanti untuk fetch detail barang, tapi sementara kita biarkan.

onMounted(() => {
  // bisa diisi untuk initial (optional)
});
</script>

<template>
  <div class="relative">
    <label v-if="label" class="block text-sm font-medium mb-1">
      {{ label }}
    </label>
    <input
      v-model="query"
      type="text"
      class="w-full border rounded px-2 py-1 text-sm"
      placeholder="Ketik nama atau SKU..."
      @focus="open = suggestions.length > 0"
    />
    <div v-if="loading" class="absolute right-2 top-2 text-[10px] text-gray-400">
      ...
    </div>

    <div
      v-if="open"
      class="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded shadow text-sm max-h-48 overflow-auto"
    >
      <button
        v-for="b in suggestions"
        :key="b.id"
        type="button"
        class="w-full text-left px-3 py-1.5 hover:bg-gray-100 flex justify-between gap-2"
        @click="selectBarang(b)"
      >
        <span>
          {{ b.nama_barang }}
          <span class="text-xs text-gray-500">({{ b.sku }})</span>
        </span>
        <span class="text-xs text-gray-500">
          Stok: {{ b.stok }}
        </span>
      </button>
    </div>
  </div>
</template>
