<template>
  <div class="space-y-8 animate-fade-in-up">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 class="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">Inventory</h1>
        <p class="text-xs sm:text-sm text-gray-400 mt-1 font-medium italic italic">Fine-tune your stock levels and monitor product availability</p>
      </div>
    </div>

    <!-- Enhanced Summary Cards -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
      <div class="admin-card p-6 text-center relative overflow-hidden group hover:scale-[1.02] transition-all">
        <div class="absolute top-0 left-0 w-1.5 h-full bg-blue-500/80 rounded-l-2xl"></div>
        <p class="text-3xl font-black text-gray-900">{{ products.length }}</p>
        <p class="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-2">Total Catalog</p>
      </div>
      <div class="admin-card p-6 text-center relative overflow-hidden group hover:scale-[1.02] transition-all">
        <div class="absolute top-0 left-0 w-1.5 h-full bg-emerald-500/80 rounded-l-2xl"></div>
        <p class="text-3xl font-black text-emerald-600">{{ healthyStock }}</p>
        <p class="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-2 line-clamp-1">In Stock</p>
      </div>
      <div class="admin-card p-6 text-center relative overflow-hidden group hover:scale-[1.02] transition-all">
        <div class="absolute top-0 left-0 w-1.5 h-full bg-amber-400/80 rounded-l-2xl"></div>
        <p class="text-3xl font-black text-amber-500">{{ lowStock }}</p>
        <p class="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-2 line-clamp-1">Low Warning</p>
      </div>
      <div class="admin-card p-6 text-center relative overflow-hidden group hover:scale-[1.02] transition-all">
        <div class="absolute top-0 left-0 w-1.5 h-full bg-red-500/80 rounded-l-2xl"></div>
        <p class="text-3xl font-black text-red-500">{{ outOfStock }}</p>
        <p class="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-2 line-clamp-1">Sold Out</p>
      </div>
    </div>

    <!-- Controls & Filters -->
    <div class="admin-card p-6 flex flex-col lg:flex-row gap-6 items-stretch lg:items-center">
      <div class="relative flex-1">
        <span class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg">🔍</span>
        <input
          v-model="searchQuery"
          class="admin-input pl-12 h-14"
          placeholder="Search product or SKU..."
        />
      </div>
      <div class="flex gap-2 overflow-x-auto pb-1 sm:pb-0 no-scrollbar">
        <button
          v-for="f in stockFilters"
          :key="f.value"
          @click="stockFilter = f.value"
          :class="[
            'px-5 py-3 text-[11px] font-black uppercase tracking-widest rounded-2xl border-2 transition-all shrink-0 whitespace-nowrap shadow-sm',
            stockFilter === f.value ? f.activeClass : 'border-gray-100 text-gray-400 hover:border-gray-200 bg-white'
          ]"
        >{{ f.label }}</button>
      </div>
    </div>

    <!-- Content Container -->
    <div class="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden flex flex-col min-h-[400px]">
      <div v-if="loading" class="flex-1 flex items-center justify-center py-24">
        <div class="flex flex-col items-center gap-6">
          <div class="animate-spin w-12 h-12 border-4 border-blue-100 border-t-blue-600 rounded-full"></div>
          <p class="text-[10px] font-black text-gray-400 uppercase tracking-widest">Inventory Syncing...</p>
        </div>
      </div>

      <div v-else-if="filtered.length === 0" class="flex-1 flex flex-col items-center justify-center py-24 text-center px-6">
        <div class="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center text-5xl mb-8 shadow-inner">📦</div>
        <h4 class="text-base font-black text-gray-900 uppercase tracking-widest">No Matches Found</h4>
        <p class="text-sm text-gray-400 mt-2 max-w-xs font-medium italic">Adjust your search or status filters to locate specific items.</p>
      </div>

      <div v-else class="flex-1 flex flex-col">
        <!-- Desktop Table View -->
        <div class="hidden lg:block overflow-x-auto custom-scrollbar">
          <table class="w-full text-left border-collapse min-w-[1000px]">
            <thead>
              <tr class="bg-gray-50/50">
                <th class="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest w-16 text-center">#</th>
                <th class="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Product Information</th>
                <th class="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Inventory Status</th>
                <th class="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Global Status</th>
                <th class="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Update Stock</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-50">
              <tr v-for="(p, i) in filtered" :key="p._id" class="hover:bg-blue-50/10 transition-colors group">
                <td class="px-8 py-5 text-center text-xs font-black text-gray-300">{{ i + 1 }}</td>
                <td class="px-8 py-5">
                  <div class="flex items-center gap-5">
                    <img
                      :src="p.images?.[0]?.url || '/placeholder.jpg'"
                      class="w-14 h-14 rounded-2xl object-cover bg-gray-50 border border-gray-100 shrink-0 group-hover:scale-110 transition-transform"
                    />
                    <div class="min-w-0">
                      <p class="text-sm font-black text-gray-900 truncate max-w-[280px] group-hover:text-blue-600 transition-colors">{{ p.name }}</p>
                      <code class="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-1 block">SKU: {{ p.sku || 'N/A' }}</code>
                    </div>
                  </div>
                </td>
                <td class="px-8 py-5">
                  <div class="flex flex-col gap-2">
                    <div class="flex items-baseline justify-between">
                      <span :class="['text-sm font-black tracking-tight', p.stock === 0 ? 'text-red-600' : p.stock < 10 ? 'text-amber-600' : 'text-emerald-600']">
                        {{ p.stock }} <span class="text-[10px] uppercase opacity-70">Units</span>
                      </span>
                    </div>
                    <div class="w-32 h-2 bg-gray-100 rounded-full overflow-hidden shadow-inner">
                      <div
                        :class="['h-full rounded-full transition-all duration-700', p.stock === 0 ? 'bg-red-500' : p.stock < 10 ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500']"
                        :style="{ width: Math.min(p.stock / 100 * 100, 100) + '%' }"
                      ></div>
                    </div>
                  </div>
                </td>
                <td class="px-8 py-5">
                  <span :class="[
                    'inline-flex items-center gap-2 px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border shadow-sm',
                    p.stock === 0 ? 'bg-red-50 text-red-700 border-red-100' : p.stock < 10 ? 'bg-amber-50 text-amber-700 border-amber-100' : 'bg-emerald-50 text-emerald-700 border-emerald-100'
                  ]">
                    {{ p.stock === 0 ? '⛔ Out of stock' : p.stock < 10 ? '⚠️ Low stock' : '✅ In stock' }}
                  </span>
                </td>
                <td class="px-8 py-5 text-right">
                  <div class="flex items-center justify-end gap-3">
                    <input
                      :value="p.newStock ?? p.stock"
                      @input="p.newStock = parseInt($event.target.value)"
                      type="number"
                      min="0"
                      class="admin-input w-24 text-sm font-black py-2.5 text-center border-gray-100"
                    />
                    <button
                      @click="updateStock(p)"
                      :disabled="p.updating"
                      class="h-11 px-6 bg-gray-900 hover:bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl transition-all shadow-lg shadow-gray-900/10 disabled:opacity-50 active:scale-95 flex items-center justify-center min-w-[80px]"
                    >
                      <span v-if="!p.updating">Update</span>
                      <div v-else class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Mobile Grid View -->
        <div class="lg:hidden p-4 space-y-4 bg-gray-50/30 overflow-y-auto max-h-[70vh] custom-scrollbar">
          <div v-for="p in filtered" :key="p._id" class="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden p-5 flex flex-col gap-5 animate-fade-in-up">
            <!-- Product Identity -->
            <div class="flex items-center gap-4">
              <img :src="p.images?.[0]?.url || '/placeholder.jpg'" class="w-16 h-16 rounded-[1.25rem] object-cover bg-gray-100 border border-gray-50" />
              <div class="flex-1 min-w-0">
                <h4 class="text-sm font-black text-gray-900 line-clamp-2 leading-tight uppercase tracking-tight">{{ p.name }}</h4>
                <code class="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-1 block">SKU: {{ p.sku || 'N/A' }}</code>
              </div>
            </div>

            <!-- Health Indicator -->
            <div class="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100/50">
               <div class="flex flex-col gap-1.5">
                  <p class="text-[9px] font-black text-gray-400 uppercase tracking-widest">Inventory Status</p>
                  <p :class="['text-sm font-black uppercase tracking-tight', p.stock === 0 ? 'text-red-600' : p.stock < 10 ? 'text-amber-600' : 'text-emerald-600']">
                    {{ p.stock === 0 ? 'Sold Out' : p.stock < 10 ? 'Running Low' : 'Adequate' }}
                  </p>
               </div>
               <div class="text-right">
                  <p class="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Stock Level</p>
                  <p class="text-lg font-black text-gray-900">{{ p.stock }} <span class="text-[10px] text-gray-400">UNITs</span></p>
               </div>
            </div>

            <!-- Mobile Stock Updater -->
            <div class="flex items-center gap-3">
               <div class="flex-1 flex items-center bg-gray-50 rounded-2xl border border-gray-100 px-4 h-14">
                  <p class="text-[9px] font-black text-gray-400 uppercase tracking-widest mr-3">New Qty</p>
                  <input
                    :value="p.newStock ?? p.stock"
                    @input="p.newStock = parseInt($event.target.value)"
                    type="number"
                    min="0"
                    class="bg-transparent font-black text-gray-900 border-none focus:ring-0 w-full text-right"
                  />
               </div>
               <button 
                 @click="updateStock(p)"
                 :disabled="p.updating"
                 class="h-14 px-8 bg-gray-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center shadow-lg shadow-gray-900/10 active:scale-95 transition-transform"
               >
                 <span v-if="!p.updating">Update</span>
                 <div v-else class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
               </button>
            </div>
          </div>
        </div>
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
