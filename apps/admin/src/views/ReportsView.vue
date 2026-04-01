<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Sales Reports</h1>
        <p class="text-sm text-gray-500 mt-0.5">Revenue & order analytics</p>
      </div>
      <div class="flex items-center gap-2">
        <div class="flex gap-1 bg-gray-100 rounded-xl p-1">
          <button
            v-for="p in periods"
            :key="p.value"
            @click="period = p.value; fetchReport()"
            :class="[
              'px-3 py-1.5 text-xs font-semibold rounded-lg transition-all',
              period === p.value ? 'bg-white text-brand-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            ]"
          >{{ p.label }}</button>
        </div>
        <button
          @click="exportCSV"
          class="admin-btn-secondary text-xs flex items-center gap-1.5 py-2"
        >
          ⬇️ Export CSV
        </button>
      </div>
    </div>

    <!-- KPI Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div class="admin-card relative overflow-hidden">
        <div class="absolute top-0 left-0 w-1 h-full bg-green-500 rounded-l-2xl"></div>
        <div class="pl-2">
          <p class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Total Revenue</p>
          <p class="text-3xl font-bold text-green-600">₹{{ formatNum(totalRevenue) }}</p>
          <p class="text-xs text-gray-400 mt-1">{{ periodLabel }} performance</p>
        </div>
      </div>
      <div class="admin-card relative overflow-hidden">
        <div class="absolute top-0 left-0 w-1 h-full bg-blue-500 rounded-l-2xl"></div>
        <div class="pl-2">
          <p class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Total Orders</p>
          <p class="text-3xl font-bold text-blue-600">{{ totalOrders }}</p>
          <p class="text-xs text-gray-400 mt-1">{{ periodLabel }} orders</p>
        </div>
      </div>
      <div class="admin-card relative overflow-hidden">
        <div class="absolute top-0 left-0 w-1 h-full bg-purple-500 rounded-l-2xl"></div>
        <div class="pl-2">
          <p class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Avg Order Value</p>
          <p class="text-3xl font-bold text-purple-600">₹{{ formatNum(avgOrderValue) }}</p>
          <p class="text-xs text-gray-400 mt-1">Per order average</p>
        </div>
      </div>
    </div>

    <!-- Revenue Chart -->
    <div class="admin-card p-0 overflow-hidden">
      <div class="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
        <div>
          <h2 class="text-base font-bold text-gray-900">Revenue by Day</h2>
          <p class="text-xs text-gray-400 mt-0.5">Daily revenue trend for {{ periodLabel.toLowerCase() }}</p>
        </div>
        <span class="text-2xl">📊</span>
      </div>
      <div v-if="loading" class="p-8 flex items-center justify-center">
        <div class="animate-spin w-8 h-8 border-3 border-brand-200 border-t-brand-600 rounded-full"></div>
      </div>
      <div v-else-if="salesData.length === 0" class="flex flex-col items-center justify-center py-16">
        <span class="text-5xl mb-3">📉</span>
        <p class="text-gray-400">No data for this period</p>
      </div>
      <div v-else class="p-6">
        <!-- Chart -->
        <div class="relative">
          <!-- Y-axis labels -->
          <div class="absolute left-0 top-0 bottom-8 flex flex-col justify-between text-[10px] text-gray-400 font-medium pr-2">
            <span>₹{{ (maxRevenue / 1000).toFixed(0) }}k</span>
            <span>₹{{ (maxRevenue / 2000).toFixed(0) }}k</span>
            <span>₹0</span>
          </div>
          <!-- Bars -->
          <div class="ml-10 flex items-end gap-1 h-48 border-b border-gray-100">
            <div
              v-for="d in salesData"
              :key="d._id"
              class="flex-1 flex flex-col items-center gap-1 group relative"
            >
              <!-- Tooltip -->
              <div class="absolute bottom-full mb-2 bg-gray-900 text-white text-[10px] rounded-lg px-2 py-1.5 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 shadow-lg">
                <p class="font-bold">{{ d._id }}</p>
                <p>₹{{ formatNum(d.revenue) }}</p>
                <p class="text-gray-400">{{ d.orders }} order{{ d.orders !== 1 ? 's' : '' }}</p>
              </div>
              <div
                class="w-full bg-brand-500 hover:bg-brand-400 rounded-t-lg transition-all cursor-pointer"
                :style="{ height: Math.max((d.revenue / maxRevenue) * 160, 4) + 'px' }"
              ></div>
            </div>
          </div>
          <!-- X-axis labels -->
          <div class="ml-10 flex gap-1 mt-2">
            <div
              v-for="d in salesData"
              :key="'lbl-' + d._id"
              class="flex-1 text-center text-[9px] text-gray-400 font-medium overflow-hidden"
            >{{ d._id.slice(5) }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Data Table -->
    <div class="admin-card p-0 overflow-hidden">
      <div class="px-6 py-4 border-b border-gray-50">
        <h2 class="text-base font-bold text-gray-900">Daily Breakdown</h2>
      </div>
      <div v-if="loading" class="p-8 text-center">
        <div class="animate-spin w-6 h-6 border-3 border-brand-200 border-t-brand-600 rounded-full mx-auto"></div>
      </div>
      <div v-else-if="salesData.length === 0" class="py-12 text-center text-sm text-gray-400">No records</div>
      <div v-else class="overflow-x-auto">
        <table class="w-full admin-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Orders</th>
              <th>Revenue</th>
              <th>Avg/Order</th>
              <th>Revenue Share</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="d in salesData" :key="'t-' + d._id">
              <td class="font-semibold text-gray-900">{{ d._id }}</td>
              <td>
                <span class="inline-flex items-center gap-1">
                  <span class="w-2 h-2 rounded-full bg-blue-400"></span>
                  {{ d.orders }}
                </span>
              </td>
              <td class="font-bold text-green-600">₹{{ formatNum(d.revenue) }}</td>
              <td class="text-gray-500">₹{{ formatNum(d.orders ? Math.round(d.revenue / d.orders) : 0) }}</td>
              <td>
                <div class="flex items-center gap-2">
                  <div class="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div class="h-full bg-brand-400 rounded-full" :style="{ width: ((d.revenue / totalRevenue) * 100).toFixed(1) + '%' }"></div>
                  </div>
                  <span class="text-[11px] font-semibold text-gray-500 w-8 text-right">{{ ((d.revenue / totalRevenue) * 100).toFixed(0) }}%</span>
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
import { analyticsAPI } from '@/api/services';
import { useToast } from 'vue-toastification';

const toast = useToast();
const loading = ref(true);
const salesData = ref([]);
const period = ref('30d');

const periods = [
  { value: '7d', label: '7D' },
  { value: '30d', label: '30D' },
  { value: '90d', label: '90D' },
  { value: '365d', label: '1Y' },
];

const periodLabel = computed(() => {
  const map = { '7d': 'Last 7 days', '30d': 'Last 30 days', '90d': 'Last 90 days', '365d': 'Last year' };
  return map[period.value] || '';
});
const maxRevenue = computed(() => Math.max(...salesData.value.map(d => d.revenue), 1));
const totalRevenue = computed(() => salesData.value.reduce((s, d) => s + d.revenue, 0));
const totalOrders = computed(() => salesData.value.reduce((s, d) => s + d.orders, 0));
const avgOrderValue = computed(() => totalOrders.value ? Math.round(totalRevenue.value / totalOrders.value) : 0);

const formatNum = (num) => num ? new Intl.NumberFormat('en-IN').format(num) : '0';

const fetchReport = async () => {
  try {
    loading.value = true;
    const res = await analyticsAPI.getSalesReport(period.value);
    salesData.value = res.data || [];
  } catch { toast.error('Failed to load report'); } finally { loading.value = false; }
};

const exportCSV = () => {
  const csv = 'Date,Orders,Revenue\n' + salesData.value.map(d => `${d._id},${d.orders},${d.revenue}`).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `ozobath_report_${period.value}.csv`; a.click();
  URL.revokeObjectURL(url);
};

onMounted(fetchReport);
</script>
