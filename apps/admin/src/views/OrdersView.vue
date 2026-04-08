<template>
  <div class="space-y-8 animate-fade-in-up">
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">Orders</h1>
        <p class="text-xs sm:text-sm text-gray-400 mt-1 font-medium italic">Manage and fulfill customer requests effortlessly</p>
      </div>
      <button
        @click="exportOrders"
        :disabled="exporting"
        class="flex items-center justify-center gap-2 px-6 py-3 bg-gray-900 text-white font-black uppercase tracking-widest rounded-2xl hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-[11px] shadow-lg shadow-gray-900/10 self-start"
      >
        <span class="text-lg" v-if="!exporting">📥</span>
        <span>{{ exporting ? 'Processing Export...' : 'Export Global CSV' }}</span>
      </button>
    </div>

    <!-- Enhanced Filters -->
    <div class="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-6 sm:p-8">
      <div class="flex flex-col sm:flex-row items-center gap-4">
        <div class="relative w-full max-w-sm group">
          <span class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors">🔍</span>
          <input v-model="search" @input="fetchOrders" class="admin-input pl-11" placeholder="Search by Order ID or Name..." />
        </div>
        <div class="relative w-full sm:w-auto">
          <select v-model="filterStatus" @change="fetchOrders" class="admin-input min-w-[200px] appearance-none cursor-pointer">
            <option value="">📁 All Activity</option>
            <option value="pending">⏳ Pending</option>
            <option value="confirmed">✅ Confirmed</option>
            <option value="processing">⚙️ Processing</option>
            <option value="shipped">🚚 Shipped</option>
            <option value="delivered">🎉 Delivered</option>
            <option value="cancelled">❌ Cancelled</option>
          </select>
          <span class="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">⌄</span>
        </div>
      </div>
    </div>

    <!-- Orders Table Container -->
    <div class="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden flex flex-col min-h-[400px]">
      <div v-if="loading" class="flex-1 flex items-center justify-center py-20">
        <div class="flex flex-col items-center gap-4">
          <div class="animate-spin w-10 h-10 border-4 border-blue-100 border-t-blue-600 rounded-full"></div>
          <p class="text-[10px] font-black text-gray-400 uppercase tracking-widest">Fetching Orders...</p>
        </div>
      </div>

      <div v-else-if="orders.length === 0" class="flex-1 flex flex-col items-center justify-center py-20 text-center px-6">
        <div class="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center text-4xl mb-6 shadow-inner">📦</div>
        <h4 class="text-base font-black text-gray-900">Quiet for now...</h4>
        <p class="text-sm text-gray-400 mt-2 max-w-xs font-medium">As soon as customers start placing orders, they'll appear right here in real-time.</p>
      </div>

      <div v-else class="flex-1 flex flex-col overflow-hidden">
        <!-- Desktop Table View -->
        <div class="hidden lg:block flex-1 overflow-x-auto custom-scrollbar">
          <table class="w-full text-left border-collapse min-w-[1000px]">
            <thead>
              <tr class="bg-gray-50/50">
                <th class="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Order Reference</th>
                <th class="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Customer Details</th>
                <th class="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Amount</th>
                <th class="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Payment</th>
                <th class="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Fulfillment</th>
                <th class="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Placement Date</th>
                <th class="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-50">
              <tr v-for="order in orders" :key="order._id" class="hover:bg-blue-50/10 transition-colors group">
                <td class="px-8 py-5">
                  <p class="text-sm font-black text-blue-600 hover:text-blue-700 cursor-pointer transition-colors" @click="$router.push(`/orders/${order._id}`)">
                    #{{ order.orderNumber || order._id.slice(-8).toUpperCase() }}
                  </p>
                </td>
                <td class="px-8 py-5">
                  <p class="text-sm font-bold text-gray-900">{{ order.user?.name || 'Guest Checkout' }}</p>
                  <p class="text-[10px] text-gray-400 truncate max-w-[180px] font-medium">{{ order.user?.email || 'No email provided' }}</p>
                </td>
                <td class="px-8 py-5">
                  <p class="text-sm font-black text-gray-900">₹{{ order.total?.toLocaleString('en-IN') }}</p>
                </td>
                <td class="px-8 py-5">
                  <span 
                    :class="order.paymentStatus === 'paid' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'" 
                    class="text-[10px] px-3 py-1 rounded-lg font-black uppercase tracking-widest border shadow-sm"
                  >
                    {{ order.paymentStatus || 'pending' }}
                  </span>
                </td>
                <td class="px-8 py-5">
                  <select
                    :value="order.status"
                    @change="updateStatus(order._id, $event.target.value)"
                    class="text-[11px] font-black border border-gray-100 rounded-xl px-3 py-2 bg-white shadow-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer uppercase tracking-tighter"
                  >
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="processing">Processing</option>
                    <option value="shipped">Shipped</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </td>
                <td class="px-8 py-5">
                  <p class="text-xs font-bold text-gray-500 opacity-80 italic">{{ new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) }}</p>
                </td>
                <td class="px-8 py-5 text-right">
                  <button @click="$router.push(`/orders/${order._id}`)" class="px-4 py-2 bg-blue-50 text-blue-600 font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-blue-600 hover:text-white transition-all shadow-sm">
                    View Detail
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Mobile Card Grid View -->
        <div class="lg:hidden flex-1 p-4 sm:p-6 space-y-4 overflow-y-auto max-h-[80vh] custom-scrollbar bg-gray-50/30">
        <div v-for="order in orders" :key="order._id" class="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden animate-fade-in-up">
          <!-- Header -->
          <div class="p-4 flex items-center justify-between border-b border-gray-50 bg-gray-50/20">
            <div>
              <p class="text-[10px] font-black text-blue-600 uppercase tracking-widest">#{{ order.orderNumber || order._id.slice(-8).toUpperCase() }}</p>
              <h4 class="text-sm font-black text-gray-900 mt-0.5">{{ order.user?.name || 'Guest Checkout' }}</h4>
            </div>
            <span :class="order.paymentStatus === 'paid' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'" class="text-[9px] px-2.5 py-1 rounded-lg font-black uppercase tracking-widest border border-current opacity-70">
              {{ order.paymentStatus || 'pending' }}
            </span>
          </div>

          <!-- Quick Stats -->
          <div class="grid grid-cols-2 divide-x divide-gray-50 border-b border-gray-50">
            <div class="p-4 text-center">
              <p class="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Amount</p>
              <p class="text-sm font-black text-gray-900">₹{{ order.total?.toLocaleString('en-IN') }}</p>
            </div>
            <div class="p-4 text-center">
              <p class="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Placed On</p>
              <p class="text-xs font-bold text-gray-700">{{ new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) }}</p>
            </div>
          </div>

          <!-- Actions & Status -->
          <div class="p-3 bg-gray-50/50 flex flex-col gap-3">
            <div class="flex items-center gap-2">
              <p class="text-[9px] font-black text-gray-400 uppercase tracking-widest shrink-0">Fulfillment:</p>
              <select
                :value="order.status"
                @change="updateStatus(order._id, $event.target.value)"
                class="flex-1 text-[10px] font-black border border-gray-100 rounded-xl px-3 py-2 bg-white shadow-sm focus:ring-2 focus:ring-blue-500/20 uppercase tracking-tighter"
              >
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="processing">Processing</option>
                <option value="shipped">Shipped</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <button @click="$router.push(`/orders/${order._id}`)" class="w-full flex items-center justify-center py-3 bg-white border border-gray-100 text-blue-600 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-sm hover:bg-blue-50 transition-colors">
              View Full Details ➜
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { orderAPI } from '@/api/services';
import { useToast } from 'vue-toastification';
import api from '@/api/axiosInstance';

const toast = useToast();
const loading = ref(true);
const exporting = ref(false);
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

const exportOrders = async () => {
  try {
    exporting.value = true;
    const params = {};
    if (filterStatus.value) params.status = filterStatus.value;

    // Use the raw axios instance with responseType blob; bypass the services wrapper
    // since the interceptor returns res.data — we need the raw axios for blob
    const { default: axios } = await import('axios');
    const token = localStorage.getItem('adminAccessToken');
    const API_URL = import.meta.env.VITE_API_URL || '/api/v1';

    const response = await axios.get(`${API_URL}/orders/export`, {
      params,
      responseType: 'blob',
      headers: {
        Authorization: token ? `Bearer ${token}` : undefined,
      },
      withCredentials: true,
    });

    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `orders-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);

    toast.success('Orders exported successfully');
  } catch (e) {
    toast.error('Export failed');
  } finally {
    exporting.value = false;
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
