<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold text-gray-900">Order #{{ order.orderNumber || orderId }}</h1>
      <button @click="$router.push('/orders')" class="text-sm text-gray-500 hover:text-gray-700">← Back to Orders</button>
    </div>

    <div v-if="loading" class="p-8 text-center"><div class="animate-spin w-8 h-8 border-3 border-blue-200 border-t-blue-600 rounded-full mx-auto"></div></div>

    <div v-else class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Main Info -->
      <div class="lg:col-span-2 space-y-6">
        <!-- Items -->
        <div class="admin-card overflow-hidden">
          <div class="px-4 py-3 border-b border-gray-100"><h2 class="text-sm font-bold text-gray-900">Order Items</h2></div>
          <div class="divide-y divide-gray-50">
            <div v-for="item in order.items" :key="item._id" class="p-4 flex items-center gap-4">
              <img :src="item.product?.images?.[0]?.url || '/placeholder.jpg'" class="w-14 h-14 rounded-lg object-cover bg-gray-100" />
              <div class="flex-1">
                <p class="text-sm font-medium text-gray-900">{{ item.product?.name || item.name }}</p>
                <p v-if="item.variant" class="text-xs text-gray-400">Variant: {{ item.variant }}</p>
              </div>
              <p class="text-sm text-gray-600">× {{ item.quantity }}</p>
              <p class="text-sm font-semibold text-gray-900">₹{{ (item.price * item.quantity).toLocaleString() }}</p>
            </div>
          </div>
          <div class="px-4 py-3 border-t border-gray-100 bg-gray-50">
            <div class="flex justify-between text-sm mb-1"><span class="text-gray-500">Subtotal</span><span>₹{{ (order.subtotal || order.totalAmount)?.toLocaleString() }}</span></div>
            <div v-if="order.discount" class="flex justify-between text-sm mb-1"><span class="text-gray-500">Discount</span><span class="text-green-600">-₹{{ order.discount?.toLocaleString() }}</span></div>
            <div v-if="order.shippingCharges" class="flex justify-between text-sm mb-1"><span class="text-gray-500">Shipping</span><span>₹{{ order.shippingCharges?.toLocaleString() }}</span></div>
            <div class="flex justify-between text-sm font-bold border-t border-gray-200 pt-2 mt-2"><span>Total</span><span>₹{{ order.totalAmount?.toLocaleString() }}</span></div>
          </div>
        </div>

        <!-- Status Timeline -->
        <div class="admin-card p-4">
          <h2 class="text-sm font-bold text-gray-900 mb-4">Status Timeline</h2>
          <div class="space-y-3">
            <div v-for="(s, i) in (order.statusHistory || [])" :key="i" class="flex items-start gap-3">
              <div class="w-3 h-3 rounded-full mt-1" :class="i === 0 ? 'bg-blue-500' : 'bg-gray-300'"></div>
              <div>
                <p class="text-sm font-medium text-gray-900 capitalize">{{ s.status }}</p>
                <p class="text-xs text-gray-400">{{ new Date(s.date || s.timestamp).toLocaleString() }}</p>
                <p v-if="s.note" class="text-xs text-gray-500">{{ s.note }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Sidebar -->
      <div class="space-y-6">
        <!-- Status Update -->
        <div class="admin-card p-4">
          <h2 class="text-sm font-bold text-gray-900 mb-3">Update Status</h2>
          <select v-model="newStatus" class="admin-input w-full mb-3">
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="processing">Processing</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <button @click="updateStatus" class="admin-btn-primary w-full text-sm">Update Status</button>
        </div>

        <!-- Customer -->
        <div class="admin-card p-4">
          <h2 class="text-sm font-bold text-gray-900 mb-3">Customer</h2>
          <div class="space-y-2 text-sm">
            <p class="text-gray-900 font-medium">{{ order.user?.name || 'Guest' }}</p>
            <p class="text-gray-500">{{ order.user?.email }}</p>
            <p class="text-gray-500">{{ order.user?.phone || '—' }}</p>
          </div>
        </div>

        <!-- Shipping Address -->
        <div class="admin-card p-4">
          <h2 class="text-sm font-bold text-gray-900 mb-3">Shipping Address</h2>
          <div class="text-sm text-gray-600" v-if="order.shippingAddress">
            <p class="font-medium text-gray-900">{{ order.shippingAddress.fullName }}</p>
            <p>{{ order.shippingAddress.line1 }}</p>
            <p v-if="order.shippingAddress.line2">{{ order.shippingAddress.line2 }}</p>
            <p>{{ order.shippingAddress.city }}, {{ order.shippingAddress.state }} - {{ order.shippingAddress.pincode }}</p>
            <p>{{ order.shippingAddress.phone }}</p>
          </div>
        </div>

        <!-- Payment -->
        <div class="admin-card p-4">
          <h2 class="text-sm font-bold text-gray-900 mb-3">Payment</h2>
          <div class="space-y-2 text-sm">
            <div class="flex justify-between"><span class="text-gray-500">Method</span><span class="capitalize">{{ order.paymentMethod || '—' }}</span></div>
            <div class="flex justify-between"><span class="text-gray-500">Status</span>
              <span :class="order.paymentStatus === 'paid' ? 'text-green-600 font-semibold' : 'text-yellow-600'" class="capitalize">{{ order.paymentStatus }}</span>
            </div>
            <div v-if="order.razorpayPaymentId" class="flex justify-between"><span class="text-gray-500">Payment ID</span><span class="font-mono text-xs">{{ order.razorpayPaymentId }}</span></div>
          </div>
        </div>

        <!-- Dates -->
        <div class="admin-card p-4">
          <h2 class="text-sm font-bold text-gray-900 mb-3">Dates</h2>
          <div class="space-y-2 text-sm">
            <div class="flex justify-between"><span class="text-gray-500">Placed</span><span>{{ new Date(order.createdAt).toLocaleDateString() }}</span></div>
            <div class="flex justify-between"><span class="text-gray-500">Updated</span><span>{{ new Date(order.updatedAt).toLocaleDateString() }}</span></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup>
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { orderAPI } from '@/api/services';
import { useToast } from 'vue-toastification';

const route = useRoute(); const toast = useToast();
const orderId = route.params.id;
const loading = ref(true); const order = ref({}); const newStatus = ref('pending');

const fetchOrder = async () => {
  try { loading.value = true; const res = await orderAPI.getById(orderId); order.value = res.data || {}; newStatus.value = order.value.orderStatus || order.value.status || 'pending'; } catch (e) { toast.error('Failed to load order'); } finally { loading.value = false; }
};

const updateStatus = async () => {
  try { await orderAPI.updateStatus(orderId, { orderStatus: newStatus.value }); toast.success('Status updated'); fetchOrder(); } catch (e) { toast.error('Failed to update'); }
};

onMounted(fetchOrder);
</script>
