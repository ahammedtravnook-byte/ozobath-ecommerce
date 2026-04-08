<template>
  <div>
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Site Visit Bookings</h1>
        <p class="text-sm text-gray-400 mt-1">Manage all site visit requests from customers</p>
      </div>
      <div class="flex gap-2">
        <select v-model="statusFilter" class="admin-input text-sm py-2 pl-3 pr-8">
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>
    </div>

    <!-- Stats row -->
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
      <div v-for="stat in stats" :key="stat.label" class="admin-card py-4 px-5 flex items-center gap-4">
        <div :class="stat.bg" class="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0">{{ stat.icon }}</div>
        <div>
          <p class="text-2xl font-black text-gray-900">{{ stat.count }}</p>
          <p class="text-xs font-semibold text-gray-400 uppercase tracking-wider">{{ stat.label }}</p>
        </div>
      </div>
    </div>

    <!-- Table -->
    <div class="admin-card overflow-hidden p-0">
      <div v-if="loading" class="p-12 text-center">
        <div class="animate-spin w-8 h-8 border-2 border-blue-200 border-t-blue-600 rounded-full mx-auto"></div>
      </div>

      <div v-else-if="filtered.length === 0" class="p-16 text-center">
        <div class="text-5xl mb-4">🏠</div>
        <p class="text-gray-500 font-semibold">No site visit bookings yet</p>
        <p class="text-gray-400 text-sm mt-1">Bookings will appear here once customers submit the form</p>
      </div>

      <div v-else class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead class="bg-gray-50 border-b border-gray-100">
            <tr>
              <th class="text-left text-xs font-semibold text-gray-400 uppercase px-5 py-3.5 whitespace-nowrap">Customer</th>
              <th class="text-left text-xs font-semibold text-gray-400 uppercase px-5 py-3.5 whitespace-nowrap">Product</th>
              <th class="text-left text-xs font-semibold text-gray-400 uppercase px-5 py-3.5 whitespace-nowrap">Preferred Date & Time</th>
              <th class="text-left text-xs font-semibold text-gray-400 uppercase px-5 py-3.5 whitespace-nowrap">City</th>
              <th class="text-left text-xs font-semibold text-gray-400 uppercase px-5 py-3.5 whitespace-nowrap">Bathrooms</th>
              <th class="text-left text-xs font-semibold text-gray-400 uppercase px-5 py-3.5 whitespace-nowrap">Message</th>
              <th class="text-left text-xs font-semibold text-gray-400 uppercase px-5 py-3.5 whitespace-nowrap">Booked On</th>
              <th class="text-left text-xs font-semibold text-gray-400 uppercase px-5 py-3.5 whitespace-nowrap">Status</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-50">
            <tr v-for="sv in filtered" :key="sv._id" class="hover:bg-gray-50/70 transition-colors">
              <!-- Customer -->
              <td class="px-5 py-4">
                <p class="font-bold text-gray-900 whitespace-nowrap">{{ sv.customerName }}</p>
                <p class="text-xs text-gray-400 mt-0.5">{{ sv.email }}</p>
                <p class="text-xs text-gray-400">{{ sv.phone }}</p>
              </td>

              <!-- Product -->
              <td class="px-5 py-4">
                <div v-if="sv.productName" class="flex items-center gap-3 min-w-[160px]">
                  <div class="w-12 h-12 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center shrink-0 overflow-hidden">
                    <img
                      v-if="sv.productImage"
                      :src="decodeImage(sv.productImage)"
                      :alt="sv.productName"
                      class="w-full h-full object-contain p-1"
                      @error="$event.target.style.display='none'"
                    />
                    <span v-else class="text-xl">🚿</span>
                  </div>
                  <span class="text-xs font-semibold text-gray-700 leading-snug line-clamp-2 max-w-[120px]">{{ sv.productName }}</span>
                </div>
                <div v-else class="flex items-center gap-2 text-gray-300">
                  <span class="text-xl">🚿</span>
                  <span class="text-xs">General visit</span>
                </div>
              </td>

              <!-- Date & Time -->
              <td class="px-5 py-4 whitespace-nowrap">
                <p class="font-semibold text-gray-800">{{ formatDate(sv.preferredDate) }}</p>
                <p v-if="sv.preferredTime" class="text-xs text-blue-500 font-bold mt-0.5">{{ sv.preferredTime }}</p>
                <p v-else class="text-xs text-gray-300">No time set</p>
              </td>

              <!-- City -->
              <td class="px-5 py-4 text-gray-600 whitespace-nowrap">{{ sv.city || '—' }}</td>

              <!-- Bathrooms -->
              <td class="px-5 py-4 text-center text-gray-700 font-bold">{{ sv.numberOfBathrooms || '—' }}</td>

              <!-- Message -->
              <td class="px-5 py-4 max-w-[180px]">
                <p class="text-xs text-gray-500 line-clamp-2">{{ sv.message || '—' }}</p>
              </td>

              <!-- Booked on -->
              <td class="px-5 py-4 text-xs text-gray-400 whitespace-nowrap">{{ formatDate(sv.createdAt) }}</td>

              <!-- Status -->
              <td class="px-5 py-4">
                <select
                  :value="sv.status"
                  @change="updateStatus(sv._id, $event.target.value)"
                  :class="statusClass(sv.status)"
                  class="text-xs font-bold rounded-lg px-2 py-1.5 border-0 cursor-pointer focus:ring-2 focus:ring-blue-300 outline-none"
                >
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
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
import { bookingAPI } from '@/api/services';
import { useToast } from 'vue-toastification';

const toast = useToast();
const loading = ref(false);
const siteVisits = ref([]);
const statusFilter = ref('');

const fetchSiteVisits = async () => {
  try {
    loading.value = true;
    const res = await bookingAPI.getSiteVisits();
    siteVisits.value = res.data || [];
  } catch {
    toast.error('Failed to load site visits');
  } finally {
    loading.value = false;
  }
};

const filtered = computed(() => {
  if (!statusFilter.value) return siteVisits.value;
  return siteVisits.value.filter(sv => sv.status === statusFilter.value);
});

const stats = computed(() => [
  { label: 'Total', count: siteVisits.value.length, icon: '🏠', bg: 'bg-blue-50' },
  { label: 'Pending', count: siteVisits.value.filter(s => s.status === 'pending').length, icon: '⏳', bg: 'bg-yellow-50' },
  { label: 'Confirmed', count: siteVisits.value.filter(s => s.status === 'confirmed').length, icon: '✅', bg: 'bg-green-50' },
  { label: 'Completed', count: siteVisits.value.filter(s => s.status === 'completed').length, icon: '🎉', bg: 'bg-purple-50' },
]);

const updateStatus = async (id, status) => {
  try {
    await bookingAPI.updateSiteVisit(id, { status });
    const sv = siteVisits.value.find(s => s._id === id);
    if (sv) sv.status = status;
    toast.success('Status updated');
  } catch {
    toast.error('Failed to update status');
  }
};

const decodeImage = (url) => {
  try { return decodeURIComponent(url); } catch { return url; }
};

const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

const statusClass = (status) => ({
  pending:   'bg-yellow-100 text-yellow-700',
  confirmed: 'bg-blue-100 text-blue-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
}[status] || 'bg-gray-100 text-gray-600');

onMounted(fetchSiteVisits);
</script>
