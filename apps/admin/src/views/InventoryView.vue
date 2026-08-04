<template>
  <div>
    <!-- ─── Page header ─────────────────────────── -->
    <div class="mb-5">
      <h1 class="text-xl font-semibold text-slate-900">Inventory</h1>
      <p class="text-[13px] text-slate-500 mt-0.5">Monitor and adjust stock levels</p>
    </div>

    <!-- ─── Summary ─────────────────────────────────
         Counted by the server across the whole catalogue. These used to be
         derived from the loaded page, so they silently under-reported once the
         catalogue exceeded the fetch limit.
    -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
      <button
        v-for="card in summaryCards"
        :key="card.key"
        type="button"
        class="dt-surface px-4 py-3 text-left transition-colors hover:bg-slate-50"
        :class="table.filters.value.stockStatus === card.filterValue ? 'ring-2 ring-blue-500/40 border-blue-300' : ''"
        @click="toggleStockCard(card.filterValue)"
      >
        <div class="flex items-center gap-1.5">
          <span v-if="card.dot" class="w-1.5 h-1.5 rounded-full" :class="card.dot" />
          <p class="text-[12px] text-slate-500">{{ card.label }}</p>
        </div>
        <p class="text-[22px] font-semibold tabular-nums mt-0.5" :class="card.textClass">
          <span v-if="summaryLoading" class="dt-skel inline-block w-10 h-6 align-middle" />
          <span v-else>{{ card.value }}</span>
        </p>
      </button>
    </div>

    <!-- ─── Table ───────────────────────────────── -->
    <div class="dt-surface">
      <DataToolbar
        v-model:search="table.search.value"
        search-placeholder="Search product or SKU…"
        :active-filters="table.activeFilters.value"
        :filter-meta="filterMeta"
        :total="table.total.value"
        :loading="table.loading.value"
        @clear-filter="table.clearFilter"
        @clear-all="table.clearAll"
      >
        <template #filters>
          <FilterSelect
            v-model="table.filters.value.stockStatus"
            label="Stock level"
            placeholder="All stock levels"
            :options="STOCK_OPTIONS"
          />
          <FilterSelect
            v-model="table.filters.value.category"
            label="Category"
            placeholder="All categories"
            :options="categoryOptions"
          />
        </template>
      </DataToolbar>

      <DataTable
        :columns="columns"
        :rows="table.items.value"
        :loading="table.loading.value"
        :sort="table.sort.value"
        min-width-class="min-w-[820px]"
        empty-title="No products found"
        empty-message="Try a different search or stock filter."
        @sort="table.toggleSort"
      >
        <template #cell-name="{ row }">
          <div class="flex items-center gap-3 min-w-0">
            <img
              :src="row.images?.[0]?.url || '/placeholder.jpg'"
              :alt="row.name"
              class="w-9 h-9 rounded object-cover bg-slate-100 border border-slate-200 shrink-0"
              loading="lazy"
            />
            <div class="min-w-0">
              <p class="font-medium text-slate-900 truncate max-w-[280px]">{{ row.name }}</p>
              <p class="text-[12px] text-slate-400 truncate">{{ row.sku || 'No SKU' }}</p>
            </div>
          </div>
        </template>

        <template #cell-stock="{ row }">
          <div class="flex items-center justify-end gap-2">
            <div class="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden hidden xl:block">
              <div class="h-full rounded-full" :class="barClass(row.stock)" :style="{ width: barWidth(row.stock) }" />
            </div>
            <span class="tabular-nums font-medium w-10 text-right" :class="stockTextClass(row.stock)">
              {{ row.stock ?? 0 }}
            </span>
          </div>
        </template>

        <template #cell-status="{ row }">
          <StatusBadge :status="stockStatusOf(row.stock)" :label="stockLabel(row.stock)" dot />
        </template>

        <!-- Inline stock adjustment -->
        <template #cell-adjust="{ row }">
          <div class="flex items-center justify-end gap-1.5" @click.stop>
            <input
              :value="draft[row._id] ?? row.stock"
              type="number"
              min="0"
              inputmode="numeric"
              class="dt-input w-20 h-8 text-center tabular-nums"
              :aria-label="`Stock for ${row.name}`"
              @input="draft[row._id] = $event.target.value"
              @keyup.enter="saveStock(row)"
            />
            <button
              class="dt-btn h-8 px-2.5 text-[12px]"
              :class="isDirty(row) ? 'bg-slate-900 border-slate-900 text-white hover:bg-slate-800' : ''"
              :disabled="!isDirty(row) || savingId === row._id"
              @click="saveStock(row)"
            >
              {{ savingId === row._id ? '…' : 'Save' }}
            </button>
          </div>
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
import { ref, reactive, computed, onMounted } from 'vue';
import { productAPI, categoryAPI } from '@/api/services';
import { useToast } from 'vue-toastification';
import { useDataTable } from '@/composables/useDataTable';
import { DataTable, DataToolbar, Pagination, FilterSelect, StatusBadge } from '@/components/ui';

const toast = useToast();

// Mirrors LOW_STOCK_THRESHOLD in the product controller.
const LOW_STOCK = 10;

const STOCK_OPTIONS = [
  { value: 'healthy', label: 'In stock' },
  { value: 'low', label: 'Low stock' },
  { value: 'out', label: 'Out of stock' },
];

const columns = [
  { key: 'name', label: 'Product', sortable: true, primary: true },
  { key: 'stock', label: 'On hand', sortable: true, align: 'right' },
  { key: 'status', label: 'Status', badge: true },
  { key: 'adjust', label: 'Adjust', align: 'right', width: 'w-44', hideOnMobile: true },
];

// ─── Data ──────────────────────────────────────
// stockStatus and search are both applied by the database now. Previously this
// view fetched limit=200 (silently clamped to 100 by MAX_LIMIT) and filtered
// that array in the browser, so any product past the cap could not be found.
const table = useDataTable({
  fetcher: (params, config) => productAPI.getAll(params, config),
  filters: { stockStatus: '', category: '' },
  defaultSort: 'stock',
  defaultLimit: 20,
  onError: () => toast.error('Failed to load inventory'),
});

const categories = ref([]);
const categoryOptions = computed(() =>
  categories.value.map((c) => ({ value: c._id, label: c.name }))
);

const filterMeta = computed(() => ({
  stockStatus: { label: 'Stock', options: STOCK_OPTIONS },
  category: { label: 'Category', options: categoryOptions.value },
}));

// ─── Summary ───────────────────────────────────
const summary = ref({ total: 0, healthy: 0, low: 0, out: 0 });
const summaryLoading = ref(true);

const summaryCards = computed(() => [
  { key: 'total', label: 'Total products', value: summary.value.total, filterValue: '', textClass: 'text-slate-900' },
  { key: 'healthy', label: 'In stock', value: summary.value.healthy, filterValue: 'healthy', textClass: 'text-emerald-600', dot: 'bg-emerald-500' },
  { key: 'low', label: 'Low stock', value: summary.value.low, filterValue: 'low', textClass: 'text-amber-600', dot: 'bg-amber-500' },
  { key: 'out', label: 'Out of stock', value: summary.value.out, filterValue: 'out', textClass: 'text-red-600', dot: 'bg-red-500' },
]);

const loadSummary = async () => {
  try {
    summaryLoading.value = true;
    const res = await productAPI.getStockSummary();
    summary.value = res.data || summary.value;
  } catch {
    // Non-fatal: the table is still usable without the headline counts.
  } finally {
    summaryLoading.value = false;
  }
};

// Cards double as filters; clicking the active one clears it.
const toggleStockCard = (value) => {
  table.filters.value.stockStatus = table.filters.value.stockStatus === value ? '' : value;
};

// ─── Presentation ──────────────────────────────
const stockStatusOf = (s) => (s <= 0 ? 'out' : s < LOW_STOCK ? 'low' : 'healthy');
const stockLabel = (s) => (s <= 0 ? 'Out of stock' : s < LOW_STOCK ? 'Low stock' : 'In stock');
const stockTextClass = (s) =>
  s <= 0 ? 'text-red-600' : s < LOW_STOCK ? 'text-amber-600' : 'text-slate-900';
const barClass = (s) => (s <= 0 ? 'bg-red-500' : s < LOW_STOCK ? 'bg-amber-500' : 'bg-emerald-500');
// Capped at 50 units so the common 0–50 range stays legible rather than every
// bar sitting near-empty against a 100-unit scale.
const barWidth = (s) => `${Math.min(((s || 0) / 50) * 100, 100)}%`;

// ─── Inline stock edit ─────────────────────────
// Drafts are keyed by id rather than mutated onto the row, so a refetch cannot
// silently discard an unsaved edit.
const draft = reactive({});
const savingId = ref(null);

const isDirty = (row) => {
  const value = draft[row._id];
  if (value === undefined || value === '') return false;
  return Number(value) !== row.stock;
};

const saveStock = async (row) => {
  if (!isDirty(row)) return;
  const next = Number(draft[row._id]);

  if (!Number.isInteger(next) || next < 0) {
    toast.error('Stock must be a whole number of 0 or more');
    return;
  }

  try {
    savingId.value = row._id;
    await productAPI.update(row._id, { stock: next });
    row.stock = next;
    delete draft[row._id];
    toast.success(`${row.name}: stock set to ${next}`);
    // A stock change can move a product between buckets, so the headline
    // counts need refreshing too.
    loadSummary();
  } catch (e) {
    toast.error(e.response?.data?.message || 'Failed to update stock');
  } finally {
    savingId.value = null;
  }
};

onMounted(async () => {
  loadSummary();
  try {
    const res = await categoryAPI.getAll({ limit: 200 });
    categories.value = res.data?.items || res.data || [];
  } catch {
    // Non-fatal.
  }
});
</script>
