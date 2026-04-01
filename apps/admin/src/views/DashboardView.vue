<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p class="text-sm text-gray-500 mt-0.5">{{ greeting }}, {{ authStore.user?.name || 'Admin' }} 👋</p>
      </div>
      <div class="text-xs text-gray-400 font-medium bg-gray-100 px-3 py-1.5 rounded-full">
        {{ today }}
      </div>
    </div>

    <!-- KPI Cards Skeleton -->
    <div v-if="loading" class="grid grid-cols-2 lg:grid-cols-5 gap-4">
      <div v-for="i in 5" :key="i" class="admin-card animate-pulse">
        <div class="h-3 bg-gray-200 rounded w-2/3 mb-3"></div>
        <div class="h-7 bg-gray-200 rounded w-1/2 mb-2"></div>
        <div class="h-2 bg-gray-100 rounded w-full"></div>
      </div>
    </div>

    <!-- KPI Cards -->
    <div v-else class="grid grid-cols-2 lg:grid-cols-5 gap-4">
      <div
        v-for="card in kpiCards"
        :key="card.label"
        class="admin-card relative overflow-hidden group hover:shadow-md transition-shadow duration-200 cursor-default"
      >
        <div :class="`absolute top-0 left-0 w-1 h-full rounded-l-2xl ${card.accent}`"></div>
        <div class="pl-2">
          <div class="flex items-center justify-between mb-2">
            <p class="text-xs font-semibold text-gray-500 uppercase tracking-wider">{{ card.label }}</p>
            <span class="text-xl">{{ card.icon }}</span>
          </div>
          <p :class="`text-2xl font-bold ${card.valueColor}`">{{ card.value }}</p>
          <p v-if="card.sub" class="text-[11px] text-gray-400 mt-1 font-medium">{{ card.sub }}</p>
        </div>
      </div>
    </div>

    <!-- Main Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">

      <!-- Recent Orders -->
      <div class="lg:col-span-2 admin-card p-0 overflow-hidden">
        <div class="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
          <div>
            <h3 class="text-base font-bold text-gray-900">Recent Orders</h3>
            <p class="text-xs text-gray-400 mt-0.5">Latest customer orders</p>
          </div>
          <router-link to="/orders" class="text-xs text-brand-600 font-semibold hover:text-brand-700 flex items-center gap-1">
            View all →
          </router-link>
        </div>
        <div v-if="loading" class="p-6 space-y-3">
          <div v-for="i in 4" :key="i" class="flex items-center gap-3 animate-pulse">
            <div class="w-8 h-8 rounded-xl bg-gray-100"></div>
            <div class="flex-1"><div class="h-3 bg-gray-100 rounded w-1/2 mb-1.5"></div><div class="h-2 bg-gray-50 rounded w-1/3"></div></div>
            <div class="h-3 bg-gray-100 rounded w-16"></div>
          </div>
        </div>
        <div v-else-if="recentOrders.length === 0" class="flex flex-col items-center justify-center py-14 text-center">
          <span class="text-4xl mb-3">🛒</span>
          <p class="text-sm text-gray-400">No orders yet</p>
        </div>
        <div v-else class="divide-y divide-gray-50">
          <div
            v-for="order in recentOrders"
            :key="order._id"
            class="flex items-center gap-4 px-6 py-3.5 hover:bg-gray-50/60 transition-colors cursor-pointer"
            @click="$router.push(`/orders/${order._id}`)"
          >
            <div :class="`w-9 h-9 rounded-xl flex items-center justify-center text-lg shrink-0 ${statusBg(order.status)}`">
              {{ statusIcon(order.status) }}
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-bold text-gray-900">#{{ order.orderNumber || order._id.slice(-8).toUpperCase() }}</p>
              <p class="text-xs text-gray-400 truncate">{{ order.user?.name || 'Customer' }}</p>
            </div>
            <div class="text-right shrink-0">
              <p class="text-sm font-bold text-gray-900">₹{{ formatNum(order.total) }}</p>
              <span :class="`text-[10px] font-bold px-2 py-0.5 rounded-full ${statusChip(order.status)}`">
                {{ order.status }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Right Column -->
      <div class="space-y-4">
        <!-- Quick Actions -->
        <div class="admin-card">
          <h3 class="text-sm font-bold text-gray-900 mb-4">Quick Actions</h3>
          <div class="grid grid-cols-2 gap-2">
            <router-link
              v-for="action in quickActions"
              :key="action.label"
              :to="action.path"
              class="flex flex-col items-center gap-2 p-3 bg-gray-50 hover:bg-brand-50 rounded-xl transition-all text-center group border border-transparent hover:border-brand-100"
            >
              <span class="text-2xl">{{ action.icon }}</span>
              <span class="text-[11px] font-semibold text-gray-600 group-hover:text-brand-700">{{ action.label }}</span>
            </router-link>
          </div>
        </div>

        <!-- Top Products -->
        <div class="admin-card p-0 overflow-hidden">
          <div class="px-5 py-4 border-b border-gray-50">
            <h3 class="text-sm font-bold text-gray-900">Top Products</h3>
          </div>
          <div v-if="loading" class="p-5 space-y-3">
            <div v-for="i in 3" :key="i" class="flex items-center gap-3 animate-pulse">
              <div class="w-10 h-10 rounded-xl bg-gray-100 shrink-0"></div>
              <div class="flex-1"><div class="h-3 bg-gray-100 rounded mb-1.5"></div><div class="h-2 bg-gray-50 rounded w-2/3"></div></div>
            </div>
          </div>
          <div v-else-if="topProducts.length === 0" class="py-10 text-center text-sm text-gray-400">No data</div>
          <div v-else class="divide-y divide-gray-50">
            <div
              v-for="(product, i) in topProducts.slice(0, 5)"
              :key="product._id"
              class="flex items-center gap-3 px-5 py-3"
            >
              <span class="text-xs font-bold text-gray-300 w-4 shrink-0">{{ i + 1 }}</span>
              <img
                :src="product.images?.[0]?.url || '/placeholder.jpg'"
                :alt="product.name"
                class="w-10 h-10 rounded-xl object-cover bg-gray-100 shrink-0"
              />
              <div class="flex-1 min-w-0">
                <p class="text-xs font-semibold text-gray-900 truncate">{{ product.name }}</p>
                <p class="text-[10px] text-gray-400">{{ product.salesCount || 0 }} sold · Stock: {{ product.stock }}</p>
                <div class="mt-1 h-1 bg-gray-100 rounded-full overflow-hidden">
                  <div class="h-full bg-brand-500 rounded-full" :style="{ width: Math.min((product.salesCount || 0) / 10 * 100, 100) + '%' }"></div>
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
  { label: 'Revenue', icon: '💰', value: '₹' + formatNum(stats.value.totalRevenue), valueColor: 'text-green-600', accent: 'bg-green-500', sub: 'Total earned' },
  { label: 'Orders', icon: '📦', value: stats.value.totalOrders ?? '0', valueColor: 'text-blue-600', accent: 'bg-blue-500', sub: 'All time' },
  { label: 'Pending', icon: '⏳', value: stats.value.pendingOrders ?? '0', valueColor: 'text-amber-600', accent: 'bg-amber-400', sub: 'Need action' },
  { label: 'Customers', icon: '👥', value: stats.value.totalCustomers ?? '0', valueColor: 'text-purple-600', accent: 'bg-purple-500', sub: 'Registered' },
  { label: 'Products', icon: '🏷️', value: stats.value.totalProducts ?? '0', valueColor: 'text-brand-600', accent: 'bg-brand-500', sub: 'In catalog' },
]);

const quickActions = [
  { label: 'Add Product', icon: '➕', path: '/products/new' },
  { label: 'Orders', icon: '🛒', path: '/orders' },
  { label: 'Inventory', icon: '📋', path: '/inventory' },
  { label: 'Reports', icon: '📈', path: '/reports' },
];

const statusIcon = (s) => ({ pending: '⏳', confirmed: '✅', processing: '⚙️', shipped: '🚚', delivered: '🎉', cancelled: '❌', returned: '↩️' }[s] || '📦');
const statusBg = (s) => ({ pending: 'bg-amber-50', confirmed: 'bg-blue-50', processing: 'bg-indigo-50', shipped: 'bg-purple-50', delivered: 'bg-green-50', cancelled: 'bg-red-50', returned: 'bg-orange-50' }[s] || 'bg-gray-50');
const statusChip = (s) => ({ pending: 'bg-amber-100 text-amber-700', confirmed: 'bg-blue-100 text-blue-700', processing: 'bg-indigo-100 text-indigo-700', shipped: 'bg-purple-100 text-purple-700', delivered: 'bg-green-100 text-green-700', cancelled: 'bg-red-100 text-red-700', returned: 'bg-orange-100 text-orange-700' }[s] || 'bg-gray-100 text-gray-700');

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
