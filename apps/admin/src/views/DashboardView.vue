<template>
  <div>
    <h1 class="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>

    <!-- Loading State -->
    <div v-if="loading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <div v-for="i in 4" :key="i" class="admin-card animate-pulse">
        <div class="h-4 bg-gray-200 rounded w-1/2 mb-3"></div>
        <div class="h-8 bg-gray-200 rounded w-3/4"></div>
      </div>
    </div>

    <!-- Stats Cards -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
      <div class="stat-card">
        <p class="text-sm font-medium text-gray-500">Total Revenue</p>
        <p class="text-2xl font-bold text-gray-900">₹{{ formatNum(stats.totalRevenue) }}</p>
      </div>
      <div class="stat-card">
        <p class="text-sm font-medium text-gray-500">Total Orders</p>
        <p class="text-2xl font-bold text-gray-900">{{ stats.totalOrders }}</p>
      </div>
      <div class="stat-card">
        <p class="text-sm font-medium text-gray-500">Pending Orders</p>
        <p class="text-2xl font-bold text-orange-600">{{ stats.pendingOrders }}</p>
      </div>
      <div class="stat-card">
        <p class="text-sm font-medium text-gray-500">Products</p>
        <p class="text-2xl font-bold text-gray-900">{{ stats.totalProducts }}</p>
      </div>
      <div class="stat-card">
        <p class="text-sm font-medium text-gray-500">Customers</p>
        <p class="text-2xl font-bold text-gray-900">{{ stats.totalCustomers }}</p>
      </div>
    </div>

    <!-- Content Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Recent Orders -->
      <div class="admin-card">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">Recent Orders</h3>
        <div v-if="recentOrders.length === 0" class="text-gray-400 text-sm py-4 text-center">No orders yet</div>
        <div v-else class="space-y-3">
          <div
            v-for="order in recentOrders"
            :key="order._id"
            class="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer"
            @click="$router.push(`/orders/${order._id}`)"
          >
            <div>
              <p class="text-sm font-medium text-gray-900">{{ order.orderNumber || order._id.slice(-8) }}</p>
              <p class="text-xs text-gray-500">{{ order.user?.name || 'Customer' }}</p>
            </div>
            <div class="text-right">
              <p class="text-sm font-semibold text-gray-900">₹{{ order.total }}</p>
              <span
                :class="[
                  'text-xs px-2 py-0.5 rounded-full font-medium',
                  order.status === 'delivered' ? 'bg-green-100 text-green-700' :
                  order.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                  order.status === 'confirmed' ? 'bg-blue-100 text-blue-700' :
                  'bg-gray-100 text-gray-700'
                ]"
              >
                {{ order.status }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Top Products -->
      <div class="admin-card">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">Top Selling Products</h3>
        <div v-if="topProducts.length === 0" class="text-gray-400 text-sm py-4 text-center">No products yet</div>
        <div v-else class="space-y-3">
          <div
            v-for="product in topProducts"
            :key="product._id"
            class="flex items-center gap-3 p-3 rounded-lg bg-gray-50"
          >
            <img
              :src="product.images?.[0]?.url || '/placeholder.jpg'"
              :alt="product.name"
              class="w-12 h-12 rounded-lg object-cover bg-gray-200"
            />
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-gray-900 truncate">{{ product.name }}</p>
              <p class="text-xs text-gray-500">{{ product.salesCount }} sold · ₹{{ product.price }}</p>
            </div>
            <p class="text-xs font-medium text-gray-500">Stock: {{ product.stock }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { analyticsAPI } from '@/api/services';

const loading = ref(true);
const stats = ref({});
const recentOrders = ref([]);
const topProducts = ref([]);

const formatNum = (num) => {
  if (!num) return '0';
  return new Intl.NumberFormat('en-IN').format(num);
};

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
