<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-3">
        <button
          @click="$router.push('/orders')"
          class="p-2 rounded-xl hover:bg-gray-100 transition-colors text-gray-500 hover:text-gray-700"
        >
          ← Back
        </button>
        <div>
          <h1 class="text-xl font-bold text-gray-900">
            Order #{{ order.orderNumber || orderId?.slice(-8).toUpperCase() }}
          </h1>
          <p v-if="order.createdAt" class="text-xs text-gray-400 mt-0.5">
            Placed {{ formatDate(order.createdAt) }}
          </p>
        </div>
      </div>
      <span v-if="order.status" :class="['px-3 py-1.5 rounded-xl text-xs font-bold border', statusStyle(order.status).chip]">
        {{ statusStyle(order.status).icon }} {{ order.status?.charAt(0).toUpperCase() + order.status?.slice(1) }}
      </span>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex items-center justify-center py-24">
      <div class="w-10 h-10 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin"></div>
    </div>

    <div v-else class="grid grid-cols-1 xl:grid-cols-3 gap-6">
      <!-- LEFT: main content -->
      <div class="xl:col-span-2 space-y-5">

        <!-- Order Items -->
        <div class="admin-card p-0 overflow-hidden">
          <div class="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
            <h2 class="text-base font-bold text-gray-900">Order Items</h2>
            <span class="text-xs text-gray-400 font-medium">{{ order.items?.length || 0 }} item{{ (order.items?.length || 0) !== 1 ? 's' : '' }}</span>
          </div>
          <div class="divide-y divide-gray-50">
            <div v-for="item in order.items" :key="item._id" class="flex items-center gap-4 px-6 py-4">
              <img
                :src="item.product?.images?.[0]?.url || item.image || '/placeholder.jpg'"
                class="w-16 h-16 rounded-2xl object-cover bg-gray-100 border border-gray-100 shrink-0"
              />
              <div class="flex-1 min-w-0">
                <p class="text-sm font-semibold text-gray-900 truncate">{{ item.product?.name || item.name }}</p>
                <p v-if="item.variant" class="text-xs text-gray-400 mt-0.5">Variant: {{ item.variant }}</p>
                <p class="text-xs text-gray-400 mt-0.5">₹{{ item.price?.toLocaleString('en-IN') }} × {{ item.quantity }}</p>
              </div>
              <p class="text-sm font-bold text-gray-900 shrink-0">₹{{ (item.price * item.quantity).toLocaleString('en-IN') }}</p>
            </div>
          </div>
          <!-- Totals -->
          <div class="bg-gray-50/80 px-6 py-4 border-t border-gray-100 space-y-2">
            <div class="flex justify-between text-sm text-gray-500">
              <span>Subtotal</span>
              <span>₹{{ (order.subtotal || order.totalAmount)?.toLocaleString('en-IN') }}</span>
            </div>
            <div v-if="order.discount" class="flex justify-between text-sm">
              <span class="text-gray-500">Discount</span>
              <span class="text-green-600 font-medium">-₹{{ order.discount?.toLocaleString('en-IN') }}</span>
            </div>
            <div class="flex justify-between text-sm text-gray-500">
              <span>Shipping</span>
              <span>{{ order.shippingCost ? '₹' + order.shippingCost.toLocaleString('en-IN') : 'FREE' }}</span>
            </div>
            <div v-if="order.tax" class="flex justify-between text-sm text-gray-500">
              <span>Tax (GST)</span>
              <span>₹{{ order.tax?.toLocaleString('en-IN') }}</span>
            </div>
            <div class="flex justify-between font-bold text-gray-900 text-base border-t border-gray-200 pt-2 mt-1">
              <span>Total</span>
              <span>₹{{ order.total?.toLocaleString('en-IN') }}</span>
            </div>
          </div>
        </div>

        <!-- Status Timeline -->
        <div class="admin-card p-0 overflow-hidden">
          <div class="px-6 py-4 border-b border-gray-50">
            <h2 class="text-base font-bold text-gray-900">Order Timeline</h2>
          </div>
          <div class="px-6 py-5">
            <div v-if="!order.statusHistory?.length" class="text-sm text-gray-400 text-center py-4">No history yet</div>
            <div v-else class="relative">
              <!-- Vertical line -->
              <div class="absolute left-3.5 top-2 bottom-2 w-0.5 bg-gray-100"></div>
              <div class="space-y-5">
                <div
                  v-for="(s, i) in [...(order.statusHistory || [])].reverse()"
                  :key="i"
                  class="flex items-start gap-4 relative"
                >
                  <div :class="['w-7 h-7 rounded-full flex items-center justify-center text-xs shrink-0 z-10 border-2', i === 0 ? 'bg-brand-600 border-brand-600 text-white' : 'bg-white border-gray-200 text-gray-400']">
                    {{ i === 0 ? '●' : '○' }}
                  </div>
                  <div class="flex-1 pb-1">
                    <p class="text-sm font-semibold text-gray-900 capitalize">{{ s.status }}</p>
                    <p class="text-xs text-gray-400 mt-0.5">{{ formatDate(s.date || s.timestamp) }}</p>
                    <p v-if="s.note" class="text-xs text-gray-500 mt-1 bg-gray-50 rounded-lg px-2 py-1">{{ s.note }}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- RIGHT: sidebar -->
      <div class="space-y-5">
        <!-- Update Status -->
        <div class="admin-card">
          <h2 class="text-sm font-bold text-gray-900 mb-4">Update Status</h2>
          <div class="grid grid-cols-3 gap-1.5 mb-4">
            <button
              v-for="s in statuses"
              :key="s.value"
              @click="newStatus = s.value"
              :class="[
                'px-2 py-2 text-[11px] font-semibold rounded-xl border-2 transition-all text-center',
                newStatus === s.value ? s.activeClass : 'border-gray-200 text-gray-500 hover:border-gray-300'
              ]"
            >{{ s.icon }} {{ s.label }}</button>
          </div>
          <div class="mb-3">
            <label class="admin-label">Note (optional)</label>
            <input v-model="statusNote" class="admin-input" placeholder="Add a note..." />
          </div>
          <button
            @click="updateStatus"
            :disabled="updatingStatus"
            class="admin-btn-primary w-full flex items-center justify-center gap-2"
          >
            {{ updatingStatus ? 'Updating...' : 'Update Status' }}
          </button>
        </div>

        <!-- Customer Info -->
        <div class="admin-card">
          <h2 class="text-sm font-bold text-gray-900 mb-4">👤 Customer</h2>
          <div class="flex items-center gap-3 mb-3">
            <div class="w-10 h-10 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-sm font-bold shrink-0">
              {{ (order.user?.name || 'G').charAt(0).toUpperCase() }}
            </div>
            <div>
              <p class="text-sm font-semibold text-gray-900">{{ order.user?.name || 'Guest' }}</p>
              <p class="text-xs text-gray-500">{{ order.user?.email || '—' }}</p>
            </div>
          </div>
          <div class="text-xs text-gray-500 space-y-1 pl-1">
            <p v-if="order.user?.phone">📱 {{ order.user.phone }}</p>
          </div>
        </div>

        <!-- Shipping Address -->
        <div class="admin-card">
          <h2 class="text-sm font-bold text-gray-900 mb-3">📍 Shipping Address</h2>
          <div v-if="order.shippingAddress" class="text-sm text-gray-600 space-y-0.5">
            <p class="font-semibold text-gray-900">{{ order.shippingAddress.fullName }}</p>
            <p>{{ order.shippingAddress.line1 }}</p>
            <p v-if="order.shippingAddress.line2">{{ order.shippingAddress.line2 }}</p>
            <p>{{ order.shippingAddress.city }}, {{ order.shippingAddress.state }} — {{ order.shippingAddress.pincode }}</p>
            <p class="text-gray-400 text-xs mt-1">📞 {{ order.shippingAddress.phone }}</p>
          </div>
          <p v-else class="text-sm text-gray-400">No address</p>
        </div>

        <!-- Payment -->
        <div class="admin-card">
          <h2 class="text-sm font-bold text-gray-900 mb-4">💳 Payment</h2>
          <div class="space-y-2.5 text-sm">
            <div class="flex justify-between">
              <span class="text-gray-500">Method</span>
              <span class="capitalize font-semibold text-gray-800">{{ order.paymentMethod || '—' }}</span>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-gray-500">Status</span>
              <span :class="['px-2.5 py-0.5 rounded-full text-xs font-bold', paymentChip(order.paymentStatus)]">
                {{ order.paymentStatus || '—' }}
              </span>
            </div>
            <div v-if="order.razorpayOrderId" class="flex justify-between">
              <span class="text-gray-500">Order ID</span>
              <code class="text-xs font-mono text-gray-600 bg-gray-50 px-1.5 py-0.5 rounded">{{ order.razorpayOrderId?.slice(-12) }}</code>
            </div>
            <div v-if="order.razorpayPaymentId" class="flex justify-between">
              <span class="text-gray-500">Payment ID</span>
              <code class="text-xs font-mono text-gray-600 bg-gray-50 px-1.5 py-0.5 rounded">{{ order.razorpayPaymentId?.slice(-12) }}</code>
            </div>
          </div>
          <!-- Refund -->
          <div v-if="order.paymentStatus === 'paid' && order.razorpayPaymentId" class="mt-4 pt-3 border-t border-gray-100">
            <button
              @click="initiateRefund"
              :disabled="refunding"
              class="w-full text-sm px-3 py-2.5 bg-red-50 text-red-600 font-bold rounded-xl hover:bg-red-100 transition-colors disabled:opacity-50 border border-red-100"
            >
              {{ refunding ? '⏳ Processing...' : '↩ Initiate Refund' }}
            </button>
          </div>
          <div v-if="order.paymentStatus === 'refunded'" class="mt-3 px-3 py-2 bg-purple-50 rounded-xl border border-purple-100">
            <p class="text-xs text-purple-700 font-semibold">✓ Refund processed</p>
          </div>
        </div>

        <!-- Shipment -->
        <div class="admin-card">
          <h2 class="text-sm font-bold text-gray-900 mb-3">🚚 Shipment</h2>
          <div v-if="order.shipment" class="space-y-2 text-sm">
            <div v-if="order.shipment.courierName" class="flex justify-between">
              <span class="text-gray-500">Courier</span>
              <span class="font-semibold">{{ order.shipment.courierName }}</span>
            </div>
            <div v-if="order.shipment.awbCode" class="flex justify-between">
              <span class="text-gray-500">AWB</span>
              <code class="text-xs font-mono text-gray-600 bg-gray-50 px-1.5 py-0.5 rounded">{{ order.shipment.awbCode }}</code>
            </div>
            <a v-if="order.shipment.trackingUrl" :href="order.shipment.trackingUrl" target="_blank"
               class="block mt-3 text-center text-xs bg-brand-50 text-brand-600 font-bold py-2 rounded-xl hover:bg-brand-100 transition-colors border border-brand-100">
              🔗 Track Shipment →
            </a>
          </div>
          <div v-else class="text-xs text-gray-400 bg-gray-50 rounded-xl px-3 py-2.5 text-center">
            No shipment created yet
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
import api from '@/api/axiosInstance';

const route = useRoute();
const toast = useToast();
const orderId = route.params.id;
const loading = ref(true);
const order = ref({});
const newStatus = ref('pending');
const statusNote = ref('');
const refunding = ref(false);
const updatingStatus = ref(false);

const statuses = [
  { value: 'pending',    label: 'Pending',    icon: '⏳', activeClass: 'border-amber-400 bg-amber-50 text-amber-700' },
  { value: 'confirmed',  label: 'Confirmed',  icon: '✅', activeClass: 'border-blue-400 bg-blue-50 text-blue-700' },
  { value: 'processing', label: 'Processing', icon: '⚙️', activeClass: 'border-indigo-400 bg-indigo-50 text-indigo-700' },
  { value: 'shipped',    label: 'Shipped',    icon: '🚚', activeClass: 'border-purple-400 bg-purple-50 text-purple-700' },
  { value: 'delivered',  label: 'Delivered',  icon: '🎉', activeClass: 'border-green-400 bg-green-50 text-green-700' },
  { value: 'cancelled',  label: 'Cancelled',  icon: '❌', activeClass: 'border-red-400 bg-red-50 text-red-700' },
];

const statusStyle = (s) => ({
  pending:    { chip: 'bg-amber-50 text-amber-700 border-amber-200', icon: '⏳' },
  confirmed:  { chip: 'bg-blue-50 text-blue-700 border-blue-200', icon: '✅' },
  processing: { chip: 'bg-indigo-50 text-indigo-700 border-indigo-200', icon: '⚙️' },
  shipped:    { chip: 'bg-purple-50 text-purple-700 border-purple-200', icon: '🚚' },
  delivered:  { chip: 'bg-green-50 text-green-700 border-green-200', icon: '🎉' },
  cancelled:  { chip: 'bg-red-50 text-red-700 border-red-200', icon: '❌' },
  returned:   { chip: 'bg-gray-100 text-gray-700 border-gray-200', icon: '↩️' },
}[s] || { chip: 'bg-gray-100 text-gray-700 border-gray-200', icon: '📦' });

const paymentChip = (s) => ({
  paid:     'bg-green-100 text-green-700',
  pending:  'bg-amber-100 text-amber-700',
  failed:   'bg-red-100 text-red-700',
  refunded: 'bg-purple-100 text-purple-700',
}[s] || 'bg-gray-100 text-gray-700');

const formatDate = (d) => {
  if (!d) return '—';
  return new Date(d).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const fetchOrder = async () => {
  try {
    loading.value = true;
    const res = await orderAPI.getById(orderId);
    order.value = res.data || {};
    newStatus.value = order.value.orderStatus || order.value.status || 'pending';
  } catch { toast.error('Failed to load order'); } finally { loading.value = false; }
};

const updateStatus = async () => {
  try {
    updatingStatus.value = true;
    await orderAPI.updateStatus(orderId, { status: newStatus.value, note: statusNote.value });
    toast.success('Order status updated');
    statusNote.value = '';
    fetchOrder();
  } catch { toast.error('Failed to update status'); } finally { updatingStatus.value = false; }
};

const initiateRefund = async () => {
  if (!confirm('Are you sure you want to refund this order? This cannot be undone.')) return;
  try {
    refunding.value = true;
    await api.post(`/payment/${orderId}/refund`, { reason: 'Admin initiated refund' });
    toast.success('Refund initiated successfully');
    fetchOrder();
  } catch (e) {
    toast.error(e.response?.data?.message || 'Refund failed');
  } finally { refunding.value = false; }
};

onMounted(fetchOrder);
</script>
