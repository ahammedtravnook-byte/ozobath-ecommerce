<template>
  <div>
    <h1 class="text-2xl font-bold text-gray-900 mb-6">Inventory Management</h1>
    <div class="admin-card mb-6 flex flex-col sm:flex-row gap-4">
      <input v-model="searchQuery" class="admin-input max-w-xs" placeholder="Search products..." />
      <label class="flex items-center gap-2 text-sm text-gray-600">
        <input v-model="showLowStock" type="checkbox" class="w-4 h-4 rounded border-gray-300" />
        Low stock only (&lt; 10)
      </label>
    </div>
    <div class="admin-card overflow-hidden">
      <div v-if="loading" class="p-8 text-center"><div class="animate-spin w-8 h-8 border-3 border-blue-200 border-t-blue-600 rounded-full mx-auto"></div></div>
      <div v-else-if="filtered.length === 0" class="p-12 text-center"><p class="text-gray-400 text-lg">No products found</p></div>
      <table v-else class="w-full">
        <thead class="bg-gray-50 border-b border-gray-100">
          <tr>
            <th class="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">Product</th>
            <th class="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">SKU</th>
            <th class="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">Current Stock</th>
            <th class="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">Update Stock</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-50">
          <tr v-for="p in filtered" :key="p._id" class="hover:bg-gray-50 transition-colors">
            <td class="px-4 py-3">
              <div class="flex items-center gap-3">
                <img :src="p.images?.[0]?.url || '/placeholder.jpg'" class="w-10 h-10 rounded-lg object-cover bg-gray-100" />
                <p class="text-sm font-medium text-gray-900 truncate max-w-[200px]">{{ p.name }}</p>
              </div>
            </td>
            <td class="px-4 py-3 text-sm text-gray-500 font-mono">{{ p.sku || '—' }}</td>
            <td class="px-4 py-3">
              <span :class="p.stock < 10 ? 'text-red-600 font-bold' : p.stock < 30 ? 'text-yellow-600 font-semibold' : 'text-green-600 font-semibold'" class="text-sm">{{ p.stock }}</span>
            </td>
            <td class="px-4 py-3">
              <div class="flex items-center gap-2">
                <input :value="p.newStock ?? p.stock" @input="p.newStock = parseInt($event.target.value)" type="number" min="0" class="admin-input w-20 text-sm py-1" />
                <button @click="updateStock(p)" class="text-xs text-blue-600 hover:text-blue-800 font-medium">Update</button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
<script setup>
import { ref, computed, onMounted } from 'vue';
import { productAPI } from '@/api/services';
import { useToast } from 'vue-toastification';
const toast = useToast();
const loading = ref(true); const products = ref([]); const searchQuery = ref(''); const showLowStock = ref(false);
const filtered = computed(() => {
  let list = products.value;
  if (showLowStock.value) list = list.filter(p => p.stock < 10);
  if (searchQuery.value) { const q = searchQuery.value.toLowerCase(); list = list.filter(p => p.name?.toLowerCase().includes(q) || p.sku?.toLowerCase().includes(q)); }
  return list;
});
const fetchProducts = async () => { try { loading.value = true; const res = await productAPI.getAll({ limit: 200 }); products.value = (res.data?.products || []).map(p => ({ ...p, newStock: p.stock })); } catch (e) { toast.error('Failed to load'); } finally { loading.value = false; } };
const updateStock = async (p) => {
  const newStock = parseInt(p.newStock);
  if (isNaN(newStock) || newStock < 0) { toast.error('Invalid stock value'); return; }
  try { await productAPI.update(p._id, { stock: newStock }); toast.success(`Stock updated to ${newStock}`); p.stock = newStock; } catch (e) { toast.error('Failed to update'); }
};
onMounted(fetchProducts);
</script>
