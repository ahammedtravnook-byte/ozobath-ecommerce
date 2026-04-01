<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Activity Logs</h1>
        <p class="text-sm text-gray-500 mt-0.5">Full audit trail of every admin action</p>
      </div>
      <div class="flex items-center gap-2 text-xs text-gray-400 bg-gray-100 px-3 py-1.5 rounded-full font-medium">
        🔒 Read-only audit trail
      </div>
    </div>

    <!-- Filters -->
    <div class="admin-card p-4 flex flex-col sm:flex-row gap-3">
      <div class="relative flex-1">
        <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
        <input v-model="filters.action" @input="debouncedFetch" class="admin-input pl-9" placeholder="Filter by action..." />
      </div>
      <select v-model="filters.resource" @change="fetchLogs" class="admin-input sm:w-40">
        <option value="">All Resources</option>
        <option value="Order">Orders</option>
        <option value="Product">Products</option>
        <option value="User">Users</option>
        <option value="Banner">Banners</option>
        <option value="Review">Reviews</option>
      </select>
      <button @click="resetFilters" class="admin-btn-secondary text-xs">Clear</button>
    </div>

    <!-- Stats row -->
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <div v-for="s in summaryStats" :key="s.label" class="admin-card p-4 relative overflow-hidden">
        <div :class="`absolute top-0 left-0 w-1 h-full ${s.accent} rounded-l-2xl`"></div>
        <p :class="`text-xl font-bold pl-2 ${s.color}`">{{ s.value }}</p>
        <p class="text-[11px] text-gray-500 font-semibold pl-2 mt-0.5">{{ s.label }}</p>
      </div>
    </div>

    <!-- Log Table -->
    <div class="admin-card p-0 overflow-hidden">
      <div class="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
        <h2 class="text-base font-bold text-gray-900">Recent Activity</h2>
        <span class="text-xs text-gray-400 font-medium">{{ total }} total records</span>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="flex items-center justify-center py-16 gap-3">
        <div class="w-7 h-7 border-3 border-brand-200 border-t-brand-600 rounded-full animate-spin"></div>
        <span class="text-sm text-gray-400">Loading logs...</span>
      </div>

      <!-- Empty -->
      <div v-else-if="logs.length === 0" class="flex flex-col items-center justify-center py-16">
        <span class="text-5xl mb-3">📋</span>
        <p class="text-gray-400">No activity logs found</p>
        <p class="text-xs text-gray-300 mt-1">Actions will appear here as admins use the system</p>
      </div>

      <!-- Table -->
      <div v-else class="overflow-x-auto">
        <table class="w-full admin-table">
          <thead>
            <tr>
              <th>Admin</th>
              <th>Action</th>
              <th>Resource</th>
              <th>Details</th>
              <th>IP Address</th>
              <th>Time</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="log in logs" :key="log._id">
              <td>
                <div class="flex items-center gap-2">
                  <div class="w-7 h-7 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-[11px] font-bold shrink-0">
                    {{ (log.user?.name || 'U').charAt(0).toUpperCase() }}
                  </div>
                  <div>
                    <p class="text-xs font-semibold text-gray-900">{{ log.user?.name || 'Unknown' }}</p>
                    <p class="text-[10px] text-gray-400">{{ log.user?.role }}</p>
                  </div>
                </div>
              </td>
              <td>
                <span :class="['inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-bold', actionStyle(log.action).chip]">
                  {{ actionStyle(log.action).icon }} {{ formatAction(log.action) }}
                </span>
              </td>
              <td>
                <span class="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-600 rounded-lg text-[11px] font-semibold">
                  {{ log.resource || '—' }}
                </span>
              </td>
              <td class="max-w-[200px]">
                <p class="text-xs text-gray-500 truncate" :title="JSON.stringify(log.details)">
                  {{ formatDetails(log.details) }}
                </p>
              </td>
              <td>
                <code class="text-[10px] text-gray-400 font-mono">{{ log.ipAddress }}</code>
              </td>
              <td>
                <div>
                  <p class="text-xs text-gray-700 font-medium">{{ timeAgo(log.createdAt) }}</p>
                  <p class="text-[10px] text-gray-400">{{ formatDate(log.createdAt) }}</p>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div v-if="pages > 1" class="px-6 py-4 border-t border-gray-50 flex items-center justify-between">
        <p class="text-xs text-gray-400">Page {{ currentPage }} of {{ pages }}</p>
        <div class="flex gap-1">
          <button
            :disabled="currentPage <= 1"
            @click="currentPage--; fetchLogs()"
            class="px-3 py-1.5 text-xs rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50 transition-colors font-medium"
          >← Prev</button>
          <button
            :disabled="currentPage >= pages"
            @click="currentPage++; fetchLogs()"
            class="px-3 py-1.5 text-xs rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50 transition-colors font-medium"
          >Next →</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { activityLogAPI } from '@/api/services';
import { useToast } from 'vue-toastification';

const toast = useToast();
const loading = ref(true);
const logs = ref([]);
const total = ref(0);
const pages = ref(1);
const currentPage = ref(1);
const filters = ref({ action: '', resource: '' });
let debounceTimer = null;

const summaryStats = computed(() => {
  const orderActions = logs.value.filter(l => l.resource === 'Order').length;
  const productActions = logs.value.filter(l => l.resource === 'Product').length;
  const uniqueAdmins = new Set(logs.value.map(l => l.user?._id)).size;
  return [
    { label: 'Total Actions', value: total.value, color: 'text-brand-600', accent: 'bg-brand-500' },
    { label: 'Order Actions', value: orderActions, color: 'text-blue-600', accent: 'bg-blue-500' },
    { label: 'Product Actions', value: productActions, color: 'text-purple-600', accent: 'bg-purple-500' },
    { label: 'Active Admins', value: uniqueAdmins, color: 'text-green-600', accent: 'bg-green-500' },
  ];
});

const actionStyle = (action = '') => {
  if (action.includes('create')) return { chip: 'bg-green-100 text-green-700', icon: '➕' };
  if (action.includes('update') || action.includes('status')) return { chip: 'bg-blue-100 text-blue-700', icon: '✏️' };
  if (action.includes('delete')) return { chip: 'bg-red-100 text-red-700', icon: '🗑️' };
  if (action.includes('login')) return { chip: 'bg-purple-100 text-purple-700', icon: '🔑' };
  return { chip: 'bg-gray-100 text-gray-600', icon: '📝' };
};

const formatAction = (action = '') => action.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

const formatDetails = (details) => {
  if (!details) return '—';
  if (details.name) return `"${details.name}"`;
  if (details.orderNumber) return `#${details.orderNumber} → ${details.newStatus}`;
  return JSON.stringify(details).slice(0, 60);
};

const timeAgo = (date) => {
  const diff = Date.now() - new Date(date);
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
};

const formatDate = (d) => new Date(d).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

const fetchLogs = async () => {
  try {
    loading.value = true;
    const res = await activityLogAPI.getAll({
      page: currentPage.value,
      limit: 50,
      resource: filters.value.resource || undefined,
      action: filters.value.action || undefined,
    });
    logs.value = res.data?.logs || [];
    total.value = res.data?.total || 0;
    pages.value = res.data?.pages || 1;
  } catch { toast.error('Failed to load activity logs'); } finally { loading.value = false; }
};

const debouncedFetch = () => {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => { currentPage.value = 1; fetchLogs(); }, 400);
};

const resetFilters = () => {
  filters.value = { action: '', resource: '' };
  currentPage.value = 1;
  fetchLogs();
};

onMounted(fetchLogs);
</script>
