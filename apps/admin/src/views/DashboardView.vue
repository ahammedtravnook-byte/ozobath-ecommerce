<template>
  <div class="space-y-8 animate-fade-in-up">
    <!-- Header Section -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">Dashboard Overview</h1>
        <p class="text-xs sm:text-sm text-gray-400 mt-1 font-medium flex items-center gap-2">
          <span>{{ greeting }}, {{ authStore.user?.name || 'Admin' }}</span>
          <span class="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
        </p>
      </div>
      <div class="flex items-center gap-2 px-4 py-2 bg-white border border-gray-100 rounded-2xl shadow-sm self-start">
        <span class="text-lg">🗓️</span>
        <span class="text-xs font-bold text-gray-900 tracking-tight uppercase">{{ today }}</span>
      </div>
    </div>

    <!-- Stats Grid -->
    <div v-if="loading" class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-6">
      <div v-for="i in 5" :key="i" class="bg-white p-6 rounded-[2rem] border border-gray-50 shadow-sm animate-pulse">
        <div class="w-10 h-10 bg-gray-100 rounded-xl mb-4" />
        <div class="h-3 bg-gray-100 rounded w-2/3 mb-2" />
        <div class="h-6 bg-gray-100 rounded w-1/2" />
      </div>
    </div>

    <div v-else class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-6">
      <div
        v-for="card in kpiCards"
        :key="card.label"
        class="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-500 group relative overflow-hidden"
      >
        <div :class="`absolute top-0 right-0 w-24 h-24 blur-3xl opacity-10 rounded-full -mr-10 -mt-10 ${card.bg}`"></div>
        
        <div :class="`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl mb-4 shadow-lg shadow-gray-200 transition-transform group-hover:scale-110 duration-500 ${card.bg} ${card.valueColor}`">
          {{ card.icon }}
        </div>
        
        <p class="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1.5">{{ card.label }}</p>
        <h3 :class="`text-xl sm:text-2xl font-black tracking-tighter ${card.valueColor}`">{{ card.value }}</h3>
        <div class="mt-3 flex items-center gap-1.5">
          <span class="text-[10px] font-bold text-gray-400 italic">{{ card.sub }}</span>
        </div>
      </div>
    </div>

    <!-- Main Content Grid -->
    <div class="grid grid-cols-1 xl:grid-cols-3 gap-8">
      <!-- Left: Recent Orders -->
      <div class="xl:col-span-2 bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden flex flex-col">
        <div class="p-8 border-b border-gray-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 class="text-lg font-black text-gray-900 tracking-tight">Recent Activity</h3>
            <p class="text-xs text-gray-400 font-medium mt-1">Real-time order monitoring</p>
          </div>
          <router-link to="/orders" class="px-5 py-2.5 bg-gray-900 text-white text-xs font-black uppercase tracking-widest rounded-xl hover:bg-blue-600 transition-all shadow-lg shadow-gray-900/10">
            View All →
          </router-link>
        </div>

        <div v-if="loading" class="p-8 space-y-4">
          <div v-for="i in 5" :key="i" class="flex items-center gap-4 animate-pulse">
            <div class="w-12 h-12 rounded-2xl bg-gray-50" />
            <div class="flex-1 space-y-2">
              <div class="h-3 bg-gray-50 rounded w-1/4" />
              <div class="h-2 bg-gray-50 rounded w-1/3 opacity-60" />
            </div>
            <div class="h-4 bg-gray-50 rounded w-16" />
          </div>
        </div>

        <div v-else-if="recentOrders.length === 0" class="flex-1 flex flex-col items-center justify-center py-20 text-center px-6">
          <div class="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center text-4xl mb-6 shadow-inner">📦</div>
          <h4 class="text-base font-black text-gray-900">Quiet for now...</h4>
          <p class="text-sm text-gray-400 mt-2 max-w-xs font-medium">As soon as customers start placing orders, they'll appear right here in real-time.</p>
        </div>

        <div v-else class="flex-1 overflow-x-auto custom-scrollbar">
          <table class="w-full text-left border-collapse min-w-[600px]">
            <thead>
              <tr class="bg-gray-50/50">
                <th class="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Identification</th>
                <th class="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Customer</th>
                <th class="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Value</th>
                <th class="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-50">
              <tr
                v-for="order in recentOrders"
                :key="order._id"
                class="hover:bg-blue-50/10 transition-colors cursor-pointer group"
                @click="$router.push(`/orders/${order._id}`)"
              >
                <td class="px-8 py-5">
                  <div class="flex items-center gap-4">
                    <div :class="`w-12 h-12 rounded-2xl flex items-center justify-center text-xl shrink-0 transition-transform group-hover:scale-110 ${statusBg(order.status)}`">
                      {{ statusIcon(order.status) }}
                    </div>
                    <div>
                      <p class="text-sm font-black text-gray-900 group-hover:text-blue-600 transition-colors">#{{ order.orderNumber || order._id.slice(-8).toUpperCase() }}</p>
                      <p class="text-[10px] text-gray-400 font-bold uppercase tracking-tighter mt-1">{{ new Date(order.createdAt).toLocaleDateString('en-IN') }}</p>
                    </div>
                  </div>
                </td>
                <td class="px-8 py-5">
                  <p class="text-sm font-bold text-gray-800">{{ order.user?.name || 'Guest User' }}</p>
                  <p class="text-[10px] text-gray-400 truncate max-w-[150px] font-medium">{{ order.user?.email || 'No email provided' }}</p>
                </td>
                <td class="px-8 py-5">
                  <p class="text-sm font-black text-gray-900">₹{{ formatNum(order.total) }}</p>
                </td>
                <td class="px-8 py-5">
                  <span :class="`inline-flex items-center px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-lg border shadow-sm ${statusChip(order.status)}`">
                    {{ order.status }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Right Column -->
      <div class="space-y-8">
        <!-- Quick Actions Sidebar Card -->
        <div class="bg-gradient-to-br from-gray-900 to-[#1e293b] p-8 rounded-[2.5rem] text-white shadow-xl shadow-gray-900/20">
          <h3 class="text-base font-black text-white uppercase tracking-widest mb-6">Quick Launch</h3>
          <div class="grid grid-cols-2 gap-4">
            <router-link
              v-for="action in quickActions"
              :key="action.label"
              :to="action.path"
              class="flex flex-col items-center gap-3 p-4 bg-white/5 hover:bg-white/10 border border-white/5 rounded-3xl transition-all group"
            >
              <div class="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                {{ action.icon }}
              </div>
              <span class="text-[10px] font-black text-gray-300 uppercase tracking-widest group-hover:text-white">{{ action.label }}</span>
            </router-link>
          </div>
        </div>

        <!-- Top Selling Products -->
        <div class="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden flex flex-col">
          <div class="p-8 border-b border-gray-50 flex items-center justify-between">
            <h3 class="text-sm font-black text-gray-900 uppercase tracking-widest">Top Performers</h3>
            <span class="w-8 h-1 bg-blue-500 rounded-full"></span>
          </div>
          
          <div v-if="loading" class="p-8 space-y-6">
            <div v-for="i in 3" :key="i" class="flex items-center gap-4 animate-pulse">
              <div class="w-12 h-12 rounded-2xl bg-gray-50 shrink-0" />
              <div class="flex-1 space-y-2">
                <div class="h-3 bg-gray-50 rounded w-full" />
                <div class="h-2 bg-gray-50 rounded w-2/3" />
              </div>
            </div>
          </div>

          <div v-else-if="topProducts.length === 0" class="py-20 text-center">
            <p class="text-xs font-bold text-gray-400 uppercase tracking-widest italic opacity-60">No sales records found</p>
          </div>

          <div v-else class="flex flex-col py-2">
            <div
              v-for="(product, i) in topProducts.slice(0, 5)"
              :key="product._id"
              class="flex items-center gap-4 px-8 py-4 hover:bg-gray-50 transition-all cursor-pointer group"
            >
              <div class="relative shrink-0">
                <img
                  :src="product.images?.[0]?.url || '/placeholder.jpg'"
                  :alt="product.name"
                  class="w-12 h-12 rounded-2xl object-cover bg-gray-50 relative z-10 border border-gray-100 group-hover:scale-105 transition-transform"
                />
                <div class="absolute -top-1.5 -left-1.5 w-5 h-5 bg-blue-600 text-[10px] font-black text-white rounded-lg flex items-center justify-center z-20 border-2 border-white shadow-sm">
                  {{ i + 1 }}
                </div>
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-xs font-black text-gray-900 truncate tracking-tight group-hover:text-blue-600 transition-colors">{{ product.name }}</p>
                <div class="flex items-center justify-between mt-2">
                  <p class="text-[10px] text-gray-400 font-bold tracking-widest">{{ product.salesCount || 0 }} UNITS SOLD</p>
                  <p class="text-[10px] font-black text-emerald-500">₹{{ formatNum(product.price) }}</p>
                </div>
                <!-- Progress bar -->
                <div class="mt-2 h-1 bg-gray-100 rounded-full overflow-hidden">
                  <div class="h-full bg-blue-600 rounded-full" :style="{ width: Math.min((product.salesCount || 0) / 10 * 100, 100) + '%' }"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { analyticsAPI } from '@/api/services';
import { useAuthStore } from '@/stores/auth.store';

const authStore = useAuthStore();
const loading = ref(true);
const stats = ref({});
const recentOrders = ref([]);
const topProducts = ref([]);

const today = computed(() => new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }));
const greeting = computed(() => {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
});

const formatNum = (num) => num ? new Intl.NumberFormat('en-IN').format(num) : '0';

const kpiCards = computed(() => [
  { label: 'Revenue', icon: '💰', value: '₹' + formatNum(stats.value.totalRevenue), valueColor: 'text-green-600', accent: 'bg-green-500', sub: 'Total earned', bg: 'bg-green-50' },
  { label: 'Orders', icon: '📦', value: stats.value.totalOrders ?? '0', valueColor: 'text-blue-600', accent: 'bg-blue-500', sub: 'All time', bg: 'bg-blue-50' },
  { label: 'Pending', icon: '⏳', value: stats.value.pendingOrders ?? '0', valueColor: 'text-amber-600', accent: 'bg-amber-400', sub: 'Need action', bg: 'bg-amber-50' },
  { label: 'Customers', icon: '👥', value: stats.value.totalCustomers ?? '0', valueColor: 'text-purple-600', accent: 'bg-purple-500', sub: 'Registered', bg: 'bg-purple-50' },
  { label: 'Products', icon: '🏷️', value: stats.value.totalProducts ?? '0', valueColor: 'text-brand-600', accent: 'bg-brand-500', sub: 'In catalog', bg: 'bg-blue-50' },
]);

const quickActions = [
  { label: 'Add Product', icon: '➕', path: '/products/new' },
  { label: 'Orders', icon: '🛒', path: '/orders' },
  { label: 'Inventory', icon: '📋', path: '/inventory' },
  { label: 'Reports', icon: '📈', path: '/reports' },
];

const statusIcon = (s) => ({ pending: '⏳', confirmed: '✅', processing: '⚙️', shipped: '🚚', delivered: '🎉', cancelled: '❌', returned: '↩️' }[s] || '📦');
const statusBg = (s) => ({ pending: 'bg-amber-50', confirmed: 'bg-blue-50', processing: 'bg-indigo-50', shipped: 'bg-purple-50', delivered: 'bg-green-50', cancelled: 'bg-red-50', returned: 'bg-orange-50' }[s] || 'bg-gray-50');
const statusChip = (s) => ({ pending: 'bg-amber-50 text-amber-700 border-amber-100', confirmed: 'bg-blue-50 text-blue-700 border-blue-100', processing: 'bg-indigo-50 text-indigo-700 border-indigo-100', shipped: 'bg-purple-50 text-purple-700 border-purple-100', delivered: 'bg-green-50 text-green-700 border-green-100', cancelled: 'bg-red-50 text-red-700 border-red-100', returned: 'bg-orange-50 text-orange-700 border-orange-100' }[s] || 'bg-gray-50 text-gray-700 border-gray-100');

onMounted(async () => {
  try {
    const res = await analyticsAPI.getDashboard();
    stats.value = res.data?.stats || {};
    recentOrders.value = res.data?.recentOrders || [];
    topProducts.value = res.data?.topProducts || [];
  } catch (err) {
    console.error('Dashboard fetch failed:', err);
  } finally {
    loading.value = false;
  }
});
</script>
