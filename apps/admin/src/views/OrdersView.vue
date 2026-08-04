<template>
  <div>
    <!-- ─── Page header ─────────────────────────── -->
    <div class="flex items-center justify-between mb-5">
      <div>
        <h1 class="text-xl font-semibold text-slate-900">Orders</h1>
        <p class="text-[13px] text-slate-500 mt-0.5">Track and fulfil customer orders</p>
      </div>
      <button class="dt-btn" :disabled="exporting" @click="exportOrders">
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path d="M12 3v12m0 0 4-4m-4 4-4-4M3 17v2a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-2" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
        {{ exporting ? 'Exporting…' : 'Export CSV' }}
      </button>
    </div>

    <!-- ─── Table ───────────────────────────────── -->
    <div class="dt-surface">
      <DataToolbar
        v-model:search="table.search.value"
        search-placeholder="Search order no., customer or email…"
        :active-filters="table.activeFilters.value"
        :filter-meta="filterMeta"
        :total="table.total.value"
        :loading="table.loading.value"
        @clear-filter="table.clearFilter"
        @clear-all="table.clearAll"
      >
        <template #filters>
          <FilterSelect
            v-model="table.filters.value.status"
            label="Status"
            placeholder="All statuses"
            :options="STATUS_OPTIONS"
          />
          <FilterSelect
            v-model="table.filters.value.paymentStatus"
            label="Payment"
            placeholder="All payments"
            :options="PAYMENT_OPTIONS"
          />
          <div class="flex items-center gap-1.5">
            <input
              v-model="table.filters.value.dateFrom"
              type="date"
              class="dt-input w-[9.5rem]"
              aria-label="Orders from date"
            />
            <span class="text-slate-400 text-[13px]">to</span>
            <input
              v-model="table.filters.value.dateTo"
              type="date"
              class="dt-input w-[9.5rem]"
              aria-label="Orders to date"
            />
          </div>
        </template>
      </DataToolbar>

      <DataTable
        :columns="columns"
        :rows="table.items.value"
        :loading="table.loading.value"
        :sort="table.sort.value"
        row-clickable
        empty-title="No orders found"
        :empty-message="table.hasActiveFilters.value
          ? 'No orders match these filters.'
          : 'Orders will appear here once customers start buying.'"
        @sort="table.toggleSort"
        @row-click="(row) => $router.push(`/orders/${row._id}`)"
      >
        <template #cell-orderNumber="{ row }">
          <span class="font-medium text-slate-900 tabular-nums">{{ row.orderNumber || '—' }}</span>
        </template>

        <template #cell-user.name="{ row }">
          <div class="min-w-0">
            <p class="text-slate-900 truncate">{{ row.user?.name || 'Guest' }}</p>
            <p class="text-[12px] text-slate-400 truncate">{{ row.user?.email || row.user?.phone || '—' }}</p>
          </div>
        </template>

        <template #cell-createdAt="{ row }">
          <span class="text-slate-600 whitespace-nowrap">{{ formatDate(row.createdAt) }}</span>
        </template>

        <template #cell-total="{ row }">
          <span class="font-medium text-slate-900 tabular-nums">{{ inr(row.total) }}</span>
        </template>

        <template #cell-paymentStatus="{ row }">
          <StatusBadge :status="row.paymentStatus || 'pending'" />
        </template>

        <!-- Status is editable inline: it is the most common action on this
             screen, and opening the detail page for it is unnecessary friction. -->
        <template #cell-status="{ row }">
          <select
            :value="row.status"
            class="dt-select h-7 text-[12px]"
            :disabled="updatingId === row._id"
            :aria-label="`Status for order ${row.orderNumber}`"
            @click.stop
            @change="updateStatus(row, $event.target.value)"
          >
            <option v-for="s in STATUS_OPTIONS" :key="s.value" :value="s.value">{{ s.label }}</option>
          </select>
        </template>
      </DataTable>

      <Pagination
        :page="table.page.value"
        :pages="table.pages.value"
        :total="table.total.value"
        :limit="table.limit.value"
        :range-start="table.rangeStart.value"
        :range-end="table.rangeEnd.value"
        @update:page="table.goToPage"
        @update:limit="table.limit.value = $event"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { orderAPI } from '@/api/services';
import { useToast } from 'vue-toastification';
import { useDataTable } from '@/composables/useDataTable';
import { DataTable, DataToolbar, Pagination, FilterSelect, StatusBadge } from '@/components/ui';

const toast = useToast();

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'processing', label: 'Processing' },
  { value: 'shipped', label: 'Shipped' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' },
];

const PAYMENT_OPTIONS = [
  { value: 'paid', label: 'Paid' },
  { value: 'pending', label: 'Pending' },
  { value: 'failed', label: 'Failed' },
  { value: 'refunded', label: 'Refunded' },
];

const columns = [
  { key: 'orderNumber', label: 'Order', sortable: true, primary: true },
  { key: 'user.name', label: 'Customer' },
  { key: 'createdAt', label: 'Date', sortable: true, hideOn: 'xl' },
  { key: 'total', label: 'Total', sortable: true, align: 'right' },
  { key: 'paymentStatus', label: 'Payment', hideOn: 'xl' },
  { key: 'status', label: 'Status', badge: true, width: 'w-40' },
];

const table = useDataTable({
  fetcher: (params, config) => orderAPI.getAll(params, config),
  filters: { status: '', paymentStatus: '', dateFrom: '', dateTo: '' },
  defaultSort: '-createdAt',
  onError: () => toast.error('Failed to load orders'),
});

const filterMeta = computed(() => ({
  status: { label: 'Status', options: STATUS_OPTIONS },
  paymentStatus: { label: 'Payment', options: PAYMENT_OPTIONS },
  dateFrom: { label: 'From' },
  dateTo: { label: 'To' },
}));

const inr = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

const formatDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

// ─── Status update ─────────────────────────────
const updatingId = ref(null);

const updateStatus = async (row, status) => {
  if (status === row.status) return;
  const previous = row.status;
  try {
    updatingId.value = row._id;
    await orderAPI.updateStatus(row._id, { status });
    row.status = status;
    toast.success(`Order ${row.orderNumber} → ${status}`);
  } catch (e) {
    // The server enforces a state machine, so an invalid transition is
    // rejected. Restore the previous value rather than leave the select
    // showing a status the order does not actually have.
    row.status = previous;
    toast.error(e.response?.data?.message || 'Failed to update status');
  } finally {
    updatingId.value = null;
  }
};

// ─── Export ────────────────────────────────────
const exporting = ref(false);

const exportOrders = async () => {
  try {
    exporting.value = true;

    // Export what is on screen: every active filter plus the search term, so
    // the file matches the table instead of dumping the whole collection.
    const params = {};
    const term = table.search.value.trim();
    if (term) params.search = term;
    for (const [key, value] of Object.entries(table.filters.value)) {
      if (value) params[key] = value;
    }

    // The shared axios instance unwraps responses to res.data via an
    // interceptor, which would corrupt a blob — use a bare client here.
    const { default: axios } = await import('axios');
    const token = localStorage.getItem('adminAccessToken');
    const API_URL = import.meta.env.VITE_API_URL || '/api/v1';

    const response = await axios.get(`${API_URL}/orders/export`, {
      params,
      responseType: 'blob',
      headers: { Authorization: token ? `Bearer ${token}` : undefined },
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

    toast.success('Orders exported');
  } catch {
    toast.error('Export failed');
  } finally {
    exporting.value = false;
  }
};
</script>
