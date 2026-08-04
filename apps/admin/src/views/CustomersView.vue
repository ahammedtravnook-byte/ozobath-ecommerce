<template>
  <div>
    <!-- ─── Page header ─────────────────────────── -->
    <div class="mb-5">
      <h1 class="text-xl font-semibold text-slate-900">Customers</h1>
      <p class="text-[13px] text-slate-500 mt-0.5">Registered customer accounts</p>
    </div>

    <!-- ─── Table ───────────────────────────────── -->
    <div class="dt-surface">
      <DataToolbar
        v-model:search="table.search.value"
        search-placeholder="Search name, email or phone…"
        :active-filters="table.activeFilters.value"
        :total="table.total.value"
        :loading="table.loading.value"
        @clear-filter="table.clearFilter"
        @clear-all="table.clearAll"
      />

      <DataTable
        :columns="columns"
        :rows="table.items.value"
        :loading="table.loading.value"
        :sort="table.sort.value"
        min-width-class="min-w-[720px]"
        empty-title="No customers found"
        :empty-message="table.hasActiveFilters.value
          ? 'No customers match this search.'
          : 'Customer accounts will appear here after the first sign-up.'"
        @sort="table.toggleSort"
      >
        <template #cell-name="{ row }">
          <div class="flex items-center gap-3 min-w-0">
            <span
              class="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center
                     text-[13px] font-medium shrink-0"
            >
              {{ initial(row.name) }}
            </span>
            <div class="min-w-0">
              <p class="font-medium text-slate-900 truncate">{{ row.name || 'Unnamed' }}</p>
              <p class="text-[12px] text-slate-400 font-mono">{{ shortId(row._id) }}</p>
            </div>
          </div>
        </template>

        <template #cell-email="{ row }">
          <a
            v-if="row.email"
            :href="`mailto:${row.email}`"
            class="text-slate-700 hover:text-blue-600 hover:underline truncate"
            @click.stop
          >
            {{ row.email }}
          </a>
          <span v-else class="text-slate-400">—</span>
        </template>

        <template #cell-phone="{ row }">
          <a
            v-if="row.phone"
            :href="`tel:${row.phone}`"
            class="text-slate-600 tabular-nums hover:text-blue-600 hover:underline"
            @click.stop
          >
            {{ row.phone }}
          </a>
          <span v-else class="text-slate-400">—</span>
        </template>

        <template #cell-createdAt="{ row }">
          <span class="text-slate-600 whitespace-nowrap">{{ formatDate(row.createdAt) }}</span>
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
import { analyticsAPI } from '@/api/services';
import { useToast } from 'vue-toastification';
import { useDataTable } from '@/composables/useDataTable';
import { DataTable, DataToolbar, Pagination } from '@/components/ui';

const toast = useToast();

// No "Account status" column: the endpoint selects only name/email/phone/
// createdAt, so the old badge tested `isActive !== false` against an undefined
// field and displayed "Verified active" for every customer regardless of the
// real state. A column that can only ever show one value is worse than none.
const columns = [
  { key: 'name', label: 'Customer', sortable: true, primary: true },
  { key: 'email', label: 'Email', sortable: true },
  { key: 'phone', label: 'Phone', hideOn: 'xl' },
  { key: 'createdAt', label: 'Joined', sortable: true, align: 'right' },
];

// Search and pagination are the server's job now. This view previously loaded
// a hardcoded 50 customers and filtered that array in the browser, so the 51st
// customer was unreachable by any means.
const table = useDataTable({
  fetcher: (params, config) => analyticsAPI.getCustomers(params, config),
  defaultSort: '-createdAt',
  onError: () => toast.error('Failed to load customers'),
});

const initial = (name) => (name?.trim()?.[0] || '?').toUpperCase();

// Last 6 characters of the ObjectId — enough to tell apart two customers with
// the same display name during a support call.
const shortId = (id) => (id ? String(id).slice(-6).toUpperCase() : '—');

const formatDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
</script>
