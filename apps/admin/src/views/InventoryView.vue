<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Inventory</h1>
        <p class="text-sm text-gray-500 mt-0.5">Manage product stock levels</p>
      </div>
    </div>

    <!-- Summary Cards -->
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
      <div class="admin-card p-4 text-center relative overflow-hidden">
        <div class="absolute top-0 left-0 w-1 h-full bg-blue-500 rounded-l-2xl"></div>
        <p class="text-2xl font-bold text-gray-900 pl-2">{{ products.length }}</p>
        <p class="text-xs text-gray-500 font-semibold mt-1 pl-2">Total Products</p>
      </div>
      <div class="admin-card p-4 text-center relative overflow-hidden">
        <div class="absolute top-0 left-0 w-1 h-full bg-green-500 rounded-l-2xl"></div>
        <p class="text-2xl font-bold text-green-600 pl-2">{{ healthyStock }}</p>
        <p class="text-xs text-gray-500 font-semibold mt-1 pl-2">In Stock</p>
      </div>
      <div class="admin-card p-4 text-center relative overflow-hidden">
        <div class="absolute top-0 left-0 w-1 h-full bg-amber-400 rounded-l-2xl"></div>
        <p class="text-2xl font-bold text-amber-600 pl-2">{{ lowStock }}</p>
        <p class="text-xs text-gray-500 font-semibold mt-1 pl-2">Low Stock</p>
      </div>
      <div class="admin-card p-4 text-center relative overflow-hidden">
        <div class="absolute top-0 left-0 w-1 h-full bg-red-500 rounded-l-2xl"></div>
        <p class="text-2xl font-bold text-red-600 pl-2">{{ outOfStock }}</p>
        <p class="text-xs text-gray-500 font-semibold mt-1 pl-2">Out of Stock</p>
      </div>
    </div>

    <!-- Filters -->
    <div class="admin-card p-4 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
      <div class="relative flex-1 max-w-sm">
        <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
        <input
          v-model="searchQuery"
          class="admin-input pl-9"
          placeholder="Search product or SKU..."
        />
      </div>
      <div class="flex gap-2">
        <button
          v-for="f in stockFilters"
          :key="f.value"
          @click="stockFilter = f.value"
          :class="[
            'px-3 py-2 text-xs font-semibold rounded-xl border-2 transition-all',
            stockFilter === f.value ? f.activeClass : 'border-gray-200 text-gray-500 hover:border-gray-300 bg-white'
          ]"
        >{{ f.label }}</button>
      </div>
    </div>

    <!-- Table -->
    <div class="admin-card p-0 overflow-hidden">
      <div v-if="loading" class="p-10 flex items-center justify-center gap-3">
        <div class="w-8 h-8 border-3 border-brand-200 border-t-brand-600 rounded-full animate-spin"></div>
        <span class="text-sm text-gray-400">Loading inventory...</span>
      </div>
      <div v-else-if="filtered.length === 0" class="flex flex-col items-center justify-center py-16">
        <span class="text-5xl mb-3">📦</span>
        <p class="text-gray-400 text-sm">No products match your filters</p>
      </div>
      <div v-else class="overflow-x-auto">
        <table class="w-full admin-table">
          <thead>
            <tr>
              <th class="w-12">#</th>
              <th>Product</th>
              <th>SKU</th>
              <th>Current Stock</th>
              <th>Status</th>
              <th>Update Stock</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(p, i) in filtered" :key="p._id">
              <td class="text-gray-400 font-medium">{{ i + 1 }}</td>
              <td>
                <div class="flex items-center gap-3">
                  <img
                    :src="p.images?.[0]?.url || '/placeholder.jpg'"
                    class="w-11 h-11 rounded-xl object-cover bg-gray-100 border border-gray-100 shrink-0"
                  />
                  <div class="min-w-0">
                    <p class="text-sm font-semibold text-gray-900 truncate max-w-[200px]">{{ p.name }}</p>
                    <p class="text-xs text-gray-400">₹{{ p.price?.toLocaleString('en-IN') }}</p>
                  </div>
                </div>
              </td>
              <td>
                <code class="text-xs bg-gray-100 px-2 py-1 rounded-lg font-mono text-gray-600">{{ p.sku || '—' }}</code>
              </td>
              <td>
                <div class="flex flex-col gap-1">
                  <span :class="[
                    'text-sm font-bold',
                    p.stock === 0 ? 'text-red-600' : p.stock < 10 ? 'text-amber-600' : 'text-green-600'
                  ]">{{ p.stock }} units</span>
                  <div class="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      :class="['h-full rounded-full transition-all', p.stock === 0 ? 'bg-red-400' : p.stock < 10 ? 'bg-amber-400' : 'bg-green-400']"
                      :style="{ width: Math.min(p.stock / 100 * 100, 100) + '%' }"
                    ></div>
                  </div>
                </div>
              </td>
              <td>
                <span :class="[
                  'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold',
                  p.stock === 0 ? 'bg-red-100 text-red-700' : p.stock < 10 ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'
                ]">
                  {{ p.stock === 0 ? '⛔ Out of stock' : p.stock < 10 ? '⚠️ Low stock' : '✅ In stock' }}
                </span>
              </td>
              <td>
                <div class="flex items-center gap-2">
                  <input
                    :value="p.newStock ?? p.stock"
                    @input="p.newStock = parseInt($event.target.value)"
                    type="number"
                    min="0"
                    class="admin-input w-20 text-sm py-2 text-center"
                  />
                  <button
                    @click="updateStock(p)"
                    :disabled="p.updating"
                    class="px-3 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl transition-all disabled:opacity-50 active:scale-95"
                  >
                    {{ p.updating ? '...' : 'Save' }}
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { productAPI } from '@/api/services';
import { useToast } from 'vue-toastification';

const toast = useToast();
const loading = ref(true);
const products = ref([]);
const searchQuery = ref('');
const stockFilter = ref('all');

const stockFilters = [
  { value: 'all', label: 'All', activeClass: 'border-brand-500 text-brand-600 bg-brand-50' },
  { value: 'low', label: '⚠️ Low', activeClass: 'border-amber-400 text-amber-600 bg-amber-50' },
  { value: 'out', label: '⛔ Out', activeClass: 'border-red-400 text-red-600 bg-red-50' },
];

const filtered = computed(() => {
  let list = products.value;
  if (stockFilter.value === 'low') list = list.filter(p => p.stock > 0 && p.stock < 10);
  if (stockFilter.value === 'out') list = list.filter(p => p.stock === 0);
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase();
    list = list.filter(p => p.name?.toLowerCase().includes(q) || p.sku?.toLowerCase().includes(q));
  }
  return list;
});

const healthyStock = computed(() => products.value.filter(p => p.stock >= 10).length);
const lowStock = computed(() => products.value.filter(p => p.stock > 0 && p.stock < 10).length);
const outOfStock = computed(() => products.value.filter(p => p.stock === 0).length);

const fetchProducts = async () => {
  try {
    loading.value = true;
    const res = await productAPI.getAll({ limit: 200 });
    products.value = (res.data?.products || []).map(p => ({ ...p, newStock: p.stock, updating: false }));
  } catch { toast.error('Failed to load inventory'); } finally { loading.value = false; }
};

const updateStock = async (p) => {
  const newStock = parseInt(p.newStock);
  if (isNaN(newStock) || newStock < 0) { toast.error('Enter a valid stock value'); return; }
  try {
    p.updating = true;
    await productAPI.update(p._id, { stock: newStock });
    toast.success(`Stock updated to ${newStock}`);
    p.stock = newStock;
  } catch { toast.error('Failed to update stock'); } finally { p.updating = false; }
};

onMounted(fetchProducts);
</script>
