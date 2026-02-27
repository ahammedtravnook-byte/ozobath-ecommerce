<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold text-gray-900">Orders</h1>
    </div>

    <!-- Filters -->
    <div class="admin-card mb-6">
      <div class="flex flex-col sm:flex-row gap-4">
        <input v-model="search" @input="fetchOrders" class="admin-input max-w-xs" placeholder="Search by order number..." />
        <select v-model="filterStatus" @change="fetchOrders" class="admin-input max-w-[180px]">
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="processing">Processing</option>
          <option value="shipped">Shipped</option>
          <option value="delivered">Delivered</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>
    </div>

    <!-- Orders Table -->
    <div class="admin-card overflow-hidden">
      <div v-if="loading" class="p-8 text-center">
        <div class="animate-spin w-8 h-8 border-3 border-blue-200 border-t-blue-600 rounded-full mx-auto"></div>
      </div>

      <table v-else-if="orders.length > 0" class="w-full">
        <thead class="bg-gray-50 border-b border-gray-100">
          <tr>
            <th class="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">Order</th>
            <th class="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">Customer</th>
            <th class="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">Amount</th>
            <th class="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">Payment</th>
            <th class="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">Status</th>
            <th class="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">Date</th>
            <th class="text-right text-xs font-medium text-gray-500 uppercase px-4 py-3">Action</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-50">
          <tr v-for="order in orders" :key="order._id" class="hover:bg-gray-50 transition-colors">
            <td class="px-4 py-3 text-sm font-medium text-blue-600 cursor-pointer" @click="$router.push(`/orders/${order._id}`)">
              #{{ order.orderNumber || order._id.slice(-8) }}
            </td>
            <td class="px-4 py-3">
              <p class="text-sm text-gray-900">{{ order.user?.name || 'Customer' }}</p>
              <p class="text-xs text-gray-400">{{ order.user?.email }}</p>
            </td>
            <td class="px-4 py-3 text-sm font-semibold text-gray-900">₹{{ order.total }}</td>
            <td class="px-4 py-3">
              <span :class="order.paymentStatus === 'paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'" class="text-xs px-2 py-0.5 rounded-full font-medium">
                {{ order.paymentStatus }}
              </span>
            </td>
            <td class="px-4 py-3">
              <select
                :value="order.status"
                @change="updateStatus(order._id, $event.target.value)"
                class="text-xs border border-gray-200 rounded-lg px-2 py-1"
              >
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="processing">Processing</option>
                <option value="shipped">Shipped</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </td>
            <td class="px-4 py-3 text-xs text-gray-500">{{ new Date(order.createdAt).toLocaleDateString() }}</td>
            <td class="px-4 py-3 text-right">
              <button @click="$router.push(`/orders/${order._id}`)" class="text-xs text-blue-600 hover:text-blue-800">View</button>
            </td>
          </tr>
        </tbody>
      </table>

      <div v-else class="p-12 text-center text-gray-400">No orders found</div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { orderAPI } from '@/api/services';
import { useToast } from 'vue-toastification';

const toast = useToast();
const loading = ref(true);
const orders = ref([]);
const search = ref('');
const filterStatus = ref('');

const fetchOrders = async () => {
  try {
    loading.value = true;
    const params = {};
    if (search.value) params.search = search.value;
    if (filterStatus.value) params.status = filterStatus.value;
    const res = await orderAPI.getAll(params);
    orders.value = res.data?.orders || [];
  } catch (err) {
    toast.error('Failed to load orders');
  } finally {
    loading.value = false;
  }
};

const updateStatus = async (id, status) => {
  try {
    await orderAPI.updateStatus(id, { status });
    toast.success(`Order status updated to ${status}`);
    fetchOrders();
  } catch (err) {
    toast.error('Failed to update status');
  }
};

onMounted(fetchOrders);
</script>
