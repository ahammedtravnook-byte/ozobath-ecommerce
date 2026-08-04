<template>
  <div>
    <!-- ─── Page header ─────────────────────────── -->
    <div class="flex items-center justify-between mb-5">
      <div>
        <h1 class="text-xl font-semibold text-slate-900">Products</h1>
        <p class="text-[13px] text-slate-500 mt-0.5">Manage catalogue, pricing and stock</p>
      </div>
      <div class="flex items-center gap-2">
        <button class="dt-btn" @click="showBulkModal = true">
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path d="M12 15V3m0 12-4-4m4 4 4-4M3 17v2a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-2" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
          Bulk upload
        </button>
        <button class="dt-btn-primary" @click="$router.push('/products/new')">
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
            <path d="M12 5v14M5 12h14" stroke-linecap="round" />
          </svg>
          Add product
        </button>
      </div>
    </div>

    <!-- ─── Table ───────────────────────────────── -->
    <div class="dt-surface">
      <DataToolbar
        v-model:search="table.search.value"
        search-placeholder="Search by name or SKU…"
        :active-filters="table.activeFilters.value"
        :filter-meta="filterMeta"
        :total="table.total.value"
        :loading="table.loading.value"
        @clear-filter="table.clearFilter"
        @clear-all="table.clearAll"
      >
        <template #filters>
          <FilterSelect
            v-model="table.filters.value.category"
            label="Category"
            placeholder="All categories"
            :options="categoryOptions"
          />
          <FilterSelect
            v-model="table.filters.value.status"
            label="Status"
            placeholder="All statuses"
            :options="STATUS_OPTIONS"
          />
          <FilterSelect
            v-model="table.filters.value.stockStatus"
            label="Stock"
            placeholder="All stock"
            :options="STOCK_OPTIONS"
          />
        </template>
      </DataToolbar>

      <DataTable
        :columns="columns"
        :rows="table.items.value"
        :loading="table.loading.value"
        :sort="table.sort.value"
        empty-title="No products found"
        :empty-message="table.hasActiveFilters.value
          ? 'No products match these filters. Try clearing them.'
          : 'Add your first product to get started.'"
        @sort="table.toggleSort"
      >
        <!-- Product: image + name + SKU -->
        <template #cell-name="{ row }">
          <div class="flex items-center gap-3 min-w-0">
            <img
              :src="row.images?.[0]?.url || '/placeholder.jpg'"
              :alt="row.name"
              class="w-9 h-9 rounded object-cover bg-slate-100 border border-slate-200 shrink-0"
              loading="lazy"
            />
            <div class="min-w-0">
              <p class="font-medium text-slate-900 truncate max-w-[260px]">{{ row.name }}</p>
              <p class="text-[12px] text-slate-400 truncate">{{ row.sku || 'No SKU' }}</p>
            </div>
          </div>
        </template>

        <template #cell-category.name="{ row }">
          <span class="text-slate-600">{{ row.category?.name || '—' }}</span>
        </template>

        <template #cell-price="{ row }">
          <div class="text-right">
            <p class="font-medium text-slate-900 tabular-nums">{{ inr(row.price) }}</p>
            <p
              v-if="(row.compareAtPrice || row.mrp) > row.price"
              class="text-[12px] text-slate-400 line-through tabular-nums"
            >
              {{ inr(row.compareAtPrice || row.mrp) }}
            </p>
          </div>
        </template>

        <template #cell-stock="{ row }">
          <div class="flex items-center justify-end gap-1.5">
            <span class="w-1.5 h-1.5 rounded-full shrink-0" :class="stockDot(row.stock)" />
            <span class="tabular-nums font-medium" :class="row.stock <= 0 ? 'text-red-600' : 'text-slate-900'">
              {{ row.stock ?? 0 }}
            </span>
          </div>
        </template>

        <template #cell-salesCount="{ row }">
          <span class="tabular-nums text-slate-600">{{ row.salesCount || 0 }}</span>
        </template>

        <template #cell-isActive="{ row }">
          <StatusBadge :status="row.isActive ? 'active' : 'inactive'" dot />
        </template>

        <template #cell-actions="{ row }">
          <div class="flex items-center justify-end gap-1">
            <button class="dt-btn h-7 px-2 text-[12px]" @click.stop="$router.push(`/products/${row._id}/edit`)">
              Edit
            </button>
            <button
              class="dt-btn h-7 px-2 text-[12px] text-red-600 hover:bg-red-50 hover:border-red-300"
              :disabled="deletingId === row._id"
              @click.stop="confirmDelete(row)"
            >
              {{ deletingId === row._id ? '…' : 'Delete' }}
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

    <!-- ─── Bulk upload ─────────────────────────── -->
    <div v-if="showBulkModal" class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-slate-900/40" @click="closeBulk" />
      <div class="relative bg-white rounded-lg shadow-xl border border-slate-200 p-5 w-full max-w-lg">
        <h3 class="text-[15px] font-semibold text-slate-900">Bulk upload products</h3>
        <p class="text-[13px] text-slate-500 mt-0.5 mb-4">
          Upload an .xlsx file to create or update many products at once.
        </p>

        <div class="flex items-center gap-3 p-3 bg-slate-50 rounded-md mb-4 border border-slate-200">
          <div class="flex-1">
            <p class="text-[13px] font-medium text-slate-900">Download the template first</p>
            <p class="text-[12px] text-slate-500">Column names must match exactly.</p>
          </div>
          <button class="dt-btn h-8" :disabled="templateLoading" @click="downloadTemplate">
            {{ templateLoading ? 'Downloading…' : 'Download' }}
          </button>
        </div>

        <div
          class="border-2 border-dashed border-slate-200 rounded-md p-6 text-center mb-4 transition-colors hover:border-blue-400"
          @dragover.prevent
          @drop.prevent="handleFileDrop"
        >
          <input ref="bulkFileInput" type="file" accept=".xlsx" class="hidden" @change="handleBulkFile" />
          <div v-if="!bulkFile">
            <p class="text-[13px] text-slate-500 mb-1.5">Drag an .xlsx file here</p>
            <button class="text-[13px] text-blue-600 font-medium hover:underline" @click="$refs.bulkFileInput.click()">
              or browse
            </button>
          </div>
          <div v-else class="flex items-center gap-3 text-left">
            <div class="flex-1 min-w-0">
              <p class="text-[13px] font-medium text-slate-900 truncate">{{ bulkFile.name }}</p>
              <p class="text-[12px] text-slate-400">{{ (bulkFile.size / 1024).toFixed(1) }} KB</p>
            </div>
            <button class="text-[12px] text-red-600 font-medium hover:underline" @click="bulkFile = null">
              Remove
            </button>
          </div>
        </div>

        <div
          v-if="bulkResult"
          class="p-3 rounded-md mb-4 border"
          :class="bulkResult.errors?.length ? 'bg-amber-50 border-amber-200' : 'bg-emerald-50 border-emerald-200'"
        >
          <p class="text-[13px] font-medium" :class="bulkResult.errors?.length ? 'text-amber-800' : 'text-emerald-800'">
            {{ bulkResult.created }} created, {{ bulkResult.updated }} updated
            <span v-if="bulkResult.errors?.length">, {{ bulkResult.errors.length }} failed</span>
          </p>
          <div v-if="bulkResult.errors?.length" class="mt-2 max-h-28 overflow-y-auto space-y-1">
            <p v-for="e in bulkResult.errors" :key="e.row" class="text-[12px] text-amber-700">
              Row {{ e.row }}{{ e.name ? ` (${e.name})` : '' }}: {{ e.error }}
            </p>
          </div>
        </div>

        <div class="flex gap-2 justify-end">
          <button class="dt-btn" @click="closeBulk">Cancel</button>
          <button class="dt-btn-primary" :disabled="!bulkFile || bulkUploading" @click="uploadBulk">
            {{ bulkUploading ? 'Uploading…' : 'Upload' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { productAPI, categoryAPI } from '@/api/services';
import { useToast } from 'vue-toastification';
import { useDataTable } from '@/composables/useDataTable';
import { DataTable, DataToolbar, Pagination, FilterSelect, StatusBadge } from '@/components/ui';

const toast = useToast();

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
];

const STOCK_OPTIONS = [
  { value: 'healthy', label: 'In stock' },
  { value: 'low', label: 'Low stock' },
  { value: 'out', label: 'Out of stock' },
];

const columns = [
  { key: 'name', label: 'Product', sortable: true, primary: true },
  { key: 'category.name', label: 'Category', hideOn: 'xl' },
  { key: 'price', label: 'Price', sortable: true, align: 'right' },
  { key: 'stock', label: 'Stock', sortable: true, align: 'right' },
  { key: 'salesCount', label: 'Sold', sortable: true, align: 'right', hideOn: 'xl' },
  { key: 'isActive', label: 'Status', badge: true },
  { key: 'actions', label: '', align: 'right', width: 'w-32', hideOnMobile: true },
];

// ─── Data ──────────────────────────────────────
const table = useDataTable({
  fetcher: (params, config) => productAPI.getAll(params, config),
  filters: { category: '', status: '', stockStatus: '' },
  defaultSort: '-createdAt',
  onError: () => toast.error('Failed to load products'),
});

const categories = ref([]);
const categoryOptions = computed(() =>
  categories.value.map((c) => ({ value: c._id, label: c.name }))
);

// Lets the filter chips show "Category: Faucets" rather than a raw ObjectId.
const filterMeta = computed(() => ({
  category: { label: 'Category', options: categoryOptions.value },
  status: { label: 'Status', options: STATUS_OPTIONS },
  stockStatus: { label: 'Stock', options: STOCK_OPTIONS },
}));

const inr = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

const stockDot = (stock) =>
  stock <= 0 ? 'bg-red-500' : stock < 10 ? 'bg-amber-500' : 'bg-emerald-500';

// ─── Delete ────────────────────────────────────
const deletingId = ref(null);

const confirmDelete = async (product) => {
  if (!confirm(`Delete "${product.name}"? This cannot be undone.`)) return;
  try {
    deletingId.value = product._id;
    await productAPI.delete(product._id);
    toast.success('Product deleted');
    // refresh() keeps the current page, search and filters intact.
    table.refresh();
  } catch (e) {
    toast.error(e.response?.data?.message || 'Failed to delete product');
  } finally {
    deletingId.value = null;
  }
};

// ─── Bulk upload ───────────────────────────────
const showBulkModal = ref(false);
const bulkFile = ref(null);
const bulkUploading = ref(false);
const bulkResult = ref(null);
const templateLoading = ref(false);
const bulkFileInput = ref(null);

const handleBulkFile = (e) => { bulkFile.value = e.target.files[0] || null; bulkResult.value = null; };
const handleFileDrop = (e) => { bulkFile.value = e.dataTransfer.files[0] || null; bulkResult.value = null; };
const closeBulk = () => { showBulkModal.value = false; bulkResult.value = null; bulkFile.value = null; };

const downloadTemplate = async () => {
  try {
    templateLoading.value = true;
    const res = await productAPI.downloadTemplate();
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ozobath-product-template.xlsx';
    a.click();
    window.URL.revokeObjectURL(url);
  } catch {
    toast.error('Failed to download template');
  } finally {
    templateLoading.value = false;
  }
};

const uploadBulk = async () => {
  if (!bulkFile.value) return;
  try {
    bulkUploading.value = true;
    bulkResult.value = null;
    const res = await productAPI.bulkUpload(bulkFile.value);
    bulkResult.value = res.data;
    toast.success(`${res.data.created} created, ${res.data.updated} updated`);
    table.refresh();
  } catch (e) {
    toast.error(e.response?.data?.message || 'Bulk upload failed');
  } finally {
    bulkUploading.value = false;
  }
};

onMounted(async () => {
  try {
    const res = await categoryAPI.getAll({ limit: 200 });
    // Endpoint now returns an envelope; older deployments returned an array.
    categories.value = res.data?.items || res.data || [];
  } catch {
    // Non-fatal: the table still works without the category filter populated.
  }
});
</script>
