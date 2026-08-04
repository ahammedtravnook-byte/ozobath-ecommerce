<template>
  <div>
    <!-- ─── Page header ─────────────────────────── -->
    <div class="mb-5">
      <h1 class="text-xl font-semibold text-slate-900">B2B enquiries</h1>
      <p class="text-[13px] text-slate-500 mt-0.5">Dealer, builder and trade enquiries</p>
    </div>

    <!-- ─── Table ───────────────────────────────── -->
    <div class="dt-surface">
      <DataToolbar
        v-model:search="table.search.value"
        search-placeholder="Search company, contact, email or city…"
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
            v-model="table.filters.value.businessType"
            label="Business type"
            placeholder="All types"
            :options="BUSINESS_TYPE_OPTIONS"
          />
        </template>
      </DataToolbar>

      <DataTable
        :columns="columns"
        :rows="table.items.value"
        :loading="table.loading.value"
        :sort="table.sort.value"
        min-width-class="min-w-[880px]"
        empty-title="No enquiries found"
        :empty-message="table.hasActiveFilters.value
          ? 'No enquiries match these filters.'
          : 'B2B enquiries submitted from the website will appear here.'"
        @sort="table.toggleSort"
      >
        <template #cell-companyName="{ row }">
          <div class="min-w-0">
            <p class="font-medium text-slate-900 truncate">{{ row.companyName || '—' }}</p>
            <!-- Schema field is contactPerson. The previous template read
                 `contactName`, which does not exist, so this line was blank. -->
            <p class="text-[12px] text-slate-400 truncate">{{ row.contactPerson || '—' }}</p>
          </div>
        </template>

        <template #cell-email="{ row }">
          <div class="min-w-0">
            <a
              v-if="row.email"
              :href="`mailto:${row.email}`"
              class="text-slate-700 hover:text-blue-600 hover:underline truncate block"
              @click.stop
            >
              {{ row.email }}
            </a>
            <a
              v-if="row.phone"
              :href="`tel:${row.phone}`"
              class="text-[12px] text-slate-400 hover:text-blue-600 tabular-nums"
              @click.stop
            >
              {{ row.phone }}
            </a>
          </div>
        </template>

        <template #cell-businessType="{ row }">
          <span class="text-slate-600 capitalize">{{ labelFor(row.businessType) }}</span>
        </template>

        <template #cell-city="{ row }">
          <span class="text-slate-600">{{ [row.city, row.state].filter(Boolean).join(', ') || '—' }}</span>
        </template>

        <template #cell-createdAt="{ row }">
          <span class="text-slate-600 whitespace-nowrap">{{ formatDate(row.createdAt) }}</span>
        </template>

        <template #cell-status="{ row }">
          <select
            :value="row.status"
            class="dt-select h-7 text-[12px]"
            :disabled="updatingId === row._id"
            :aria-label="`Status for ${row.companyName}`"
            @click.stop
            @change="updateStatus(row, $event.target.value)"
          >
            <option v-for="s in STATUS_OPTIONS" :key="s.value" :value="s.value">{{ s.label }}</option>
          </select>
        </template>

        <!-- The message is the substance of an enquiry, so it gets its own
             expandable row rather than being truncated into a cell. -->
        <template #cell-message="{ row }">
          <button
            v-if="row.message"
            class="text-[12px] text-blue-600 hover:underline"
            @click.stop="expandedId = expandedId === row._id ? null : row._id"
          >
            {{ expandedId === row._id ? 'Hide' : 'View' }}
          </button>
          <span v-else class="text-slate-300">—</span>
        </template>

        <template #mobile-card="{ row }">
          <div class="space-y-2">
            <div class="flex items-start justify-between gap-2">
              <div class="min-w-0">
                <p class="text-[14px] font-medium text-slate-900 truncate">{{ row.companyName || '—' }}</p>
                <p class="text-[12px] text-slate-400 truncate">{{ row.contactPerson || '—' }}</p>
              </div>
              <StatusBadge :status="row.status" />
            </div>
            <p class="text-[13px] text-slate-600 truncate">{{ row.email }}</p>
            <p v-if="row.message" class="text-[13px] text-slate-500 line-clamp-2">{{ row.message }}</p>
            <select
              :value="row.status"
              class="dt-select h-8 w-full text-[12px]"
              @change="updateStatus(row, $event.target.value)"
            >
              <option v-for="s in STATUS_OPTIONS" :key="s.value" :value="s.value">{{ s.label }}</option>
            </select>
          </div>
        </template>
      </DataTable>

      <!-- Expanded message -->
      <div v-if="expandedRow" class="px-4 py-3 bg-slate-50 border-t border-slate-200">
        <p class="text-[12px] font-medium text-slate-500 mb-1">
          Message from {{ expandedRow.companyName || expandedRow.contactPerson }}
        </p>
        <p class="text-[13px] text-slate-700 whitespace-pre-line">{{ expandedRow.message }}</p>
        <p v-if="expandedRow.productsInterested?.length" class="text-[12px] text-slate-500 mt-2">
          Interested in: {{ expandedRow.productsInterested.join(', ') }}
        </p>
        <p v-if="expandedRow.estimatedQuantity" class="text-[12px] text-slate-500">
          Estimated quantity: {{ expandedRow.estimatedQuantity }}
        </p>
      </div>

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
import { enquiryAPI } from '@/api/services';
import { useToast } from 'vue-toastification';
import { useDataTable } from '@/composables/useDataTable';
import { DataTable, DataToolbar, Pagination, FilterSelect, StatusBadge } from '@/components/ui';

const toast = useToast();

// Mirrors the B2BEnquiry schema enum. 'in-progress' was missing from the old
// dropdown, so an enquiry in that state could not be set back from the UI.
const STATUS_OPTIONS = [
  { value: 'new', label: 'New' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'in-progress', label: 'In progress' },
  { value: 'converted', label: 'Converted' },
  { value: 'closed', label: 'Closed' },
];

const BUSINESS_TYPE_OPTIONS = [
  { value: 'dealer', label: 'Dealer' },
  { value: 'builder', label: 'Builder' },
  { value: 'architect', label: 'Architect' },
  { value: 'interior-designer', label: 'Interior designer' },
  { value: 'other', label: 'Other' },
];

const columns = [
  { key: 'companyName', label: 'Company', sortable: true, primary: true },
  { key: 'email', label: 'Contact' },
  { key: 'businessType', label: 'Type', hideOn: 'xl' },
  { key: 'city', label: 'Location', hideOn: 'xl' },
  { key: 'createdAt', label: 'Received', sortable: true },
  { key: 'message', label: 'Message', align: 'center', width: 'w-20' },
  { key: 'status', label: 'Status', badge: true, width: 'w-36' },
];

const table = useDataTable({
  fetcher: (params, config) => enquiryAPI.getAll(params, config),
  filters: { status: '', businessType: '' },
  defaultSort: '-createdAt',
  onError: () => toast.error('Failed to load enquiries'),
});

const filterMeta = computed(() => ({
  status: { label: 'Status', options: STATUS_OPTIONS },
  businessType: { label: 'Type', options: BUSINESS_TYPE_OPTIONS },
}));

const labelFor = (value) =>
  BUSINESS_TYPE_OPTIONS.find((o) => o.value === value)?.label || value || '—';

const formatDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

// ─── Expanded message ──────────────────────────
const expandedId = ref(null);
const expandedRow = computed(() =>
  table.items.value.find((r) => r._id === expandedId.value) || null
);

// ─── Status update ─────────────────────────────
const updatingId = ref(null);

const updateStatus = async (row, status) => {
  if (status === row.status) return;
  const previous = row.status;
  try {
    updatingId.value = row._id;
    await enquiryAPI.update(row._id, { status });
    row.status = status;
    toast.success('Status updated');
  } catch (e) {
    row.status = previous;
    toast.error(e.response?.data?.message || 'Failed to update status');
  } finally {
    updatingId.value = null;
  }
};
</script>
