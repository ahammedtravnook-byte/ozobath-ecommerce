<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold text-gray-900">Reports</h1>
      <div class="flex gap-2">
        <button v-for="p in ['7d','30d','90d','365d']" :key="p" @click="period = p; fetchReport()" :class="period === p ? 'admin-btn-primary text-xs' : 'px-3 py-1.5 text-xs bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200'">{{ p === '7d' ? '7 Days' : p === '30d' ? '30 Days' : p === '90d' ? '90 Days' : '1 Year' }}</button>
      </div>
    </div>
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <div class="admin-card p-4 text-center"><p class="text-xs text-gray-500 mb-1">Total Revenue</p><p class="text-2xl font-bold text-green-600">₹{{ totalRevenue.toLocaleString() }}</p></div>
      <div class="admin-card p-4 text-center"><p class="text-xs text-gray-500 mb-1">Total Orders</p><p class="text-2xl font-bold text-blue-600">{{ totalOrders }}</p></div>
      <div class="admin-card p-4 text-center"><p class="text-xs text-gray-500 mb-1">Avg Order Value</p><p class="text-2xl font-bold text-purple-600">₹{{ avgOrderValue.toLocaleString() }}</p></div>
    </div>
    <div class="admin-card overflow-hidden mb-6">
      <div class="px-4 py-3 border-b border-gray-100 flex justify-between items-center">
        <h2 class="text-sm font-bold text-gray-900">Revenue by Day</h2>
        <button @click="exportCSV" class="text-xs text-blue-600 hover:text-blue-800 font-medium">Export CSV</button>
      </div>
      <div v-if="loading" class="p-8 text-center"><div class="animate-spin w-8 h-8 border-3 border-blue-200 border-t-blue-600 rounded-full mx-auto"></div></div>
      <div v-else-if="salesData.length === 0" class="p-12 text-center"><p class="text-gray-400">No revenue data for this period</p></div>
      <div v-else class="p-4">
        <div class="flex items-end gap-1 h-48">
          <div v-for="d in salesData" :key="d._id" class="flex-1 flex flex-col items-center gap-1">
            <p class="text-[10px] text-gray-500 font-semibold">₹{{ (d.revenue / 1000).toFixed(1) }}k</p>
            <div class="w-full bg-blue-500 rounded-t-sm transition-all hover:bg-blue-600" :style="{ height: Math.max((d.revenue / maxRevenue) * 150, 4) + 'px' }"></div>
            <p class="text-[9px] text-gray-400 -rotate-45 origin-top-left mt-1">{{ d._id.slice(5) }}</p>
          </div>
        </div>
      </div>
    </div>
    <div class="admin-card overflow-hidden">
      <div class="px-4 py-3 border-b border-gray-100"><h2 class="text-sm font-bold text-gray-900">Daily Breakdown</h2></div>
      <table v-if="salesData.length" class="w-full">
        <thead class="bg-gray-50 border-b border-gray-100">
          <tr>
            <th class="text-left text-xs font-medium text-gray-500 uppercase px-4 py-2">Date</th>
            <th class="text-left text-xs font-medium text-gray-500 uppercase px-4 py-2">Orders</th>
            <th class="text-left text-xs font-medium text-gray-500 uppercase px-4 py-2">Revenue</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-50">
          <tr v-for="d in salesData" :key="d._id" class="hover:bg-gray-50">
            <td class="px-4 py-2 text-sm text-gray-900">{{ d._id }}</td>
            <td class="px-4 py-2 text-sm text-gray-600">{{ d.orders }}</td>
            <td class="px-4 py-2 text-sm font-semibold text-green-600">₹{{ d.revenue.toLocaleString() }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
<script setup>
import { ref, computed, onMounted } from 'vue';
import { analyticsAPI } from '@/api/services';
import { useToast } from 'vue-toastification';
const toast = useToast();
const loading = ref(true); const salesData = ref([]); const period = ref('30d');
const maxRevenue = computed(() => Math.max(...salesData.value.map(d => d.revenue), 1));
const totalRevenue = computed(() => salesData.value.reduce((s, d) => s + d.revenue, 0));
const totalOrders = computed(() => salesData.value.reduce((s, d) => s + d.orders, 0));
const avgOrderValue = computed(() => totalOrders.value ? Math.round(totalRevenue.value / totalOrders.value) : 0);
const fetchReport = async () => { try { loading.value = true; const res = await analyticsAPI.getSalesReport(period.value); salesData.value = res.data || []; } catch (e) { toast.error('Failed'); } finally { loading.value = false; } };
const exportCSV = () => {
  const csv = 'Date,Orders,Revenue\n' + salesData.value.map(d => `${d._id},${d.orders},${d.revenue}`).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' }); const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = `report_${period.value}.csv`; a.click(); URL.revokeObjectURL(url);
};
onMounted(fetchReport);
</script>
