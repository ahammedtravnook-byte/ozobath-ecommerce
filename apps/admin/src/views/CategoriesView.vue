<template>
  <div>
    <!-- ─── Page header ─────────────────────────── -->
    <div class="flex items-center justify-between mb-5">
      <div>
        <h1 class="text-xl font-semibold text-slate-900">Categories</h1>
        <p class="text-[13px] text-slate-500 mt-0.5">Organise the product catalogue</p>
      </div>
      <button class="dt-btn-primary" @click="openCreate">
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
          <path d="M12 5v14M5 12h14" stroke-linecap="round" />
        </svg>
        Add category
      </button>
    </div>

    <!-- ─── Table ─────────────────────────────────
         Was a card grid with no search and no pagination. A table makes the
         display order and product counts directly comparable, which is what
         this screen is actually used for.
    -->
    <div class="dt-surface">
      <DataToolbar
        v-model:search="table.search.value"
        search-placeholder="Search categories…"
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
        </template>
      </DataToolbar>

      <DataTable
        :columns="columns"
        :rows="table.items.value"
        :loading="table.loading.value"
        :sort="table.sort.value"
        min-width-class="min-w-[760px]"
        empty-title="No categories found"
        empty-message="Create a category to group your products."
        @sort="table.toggleSort"
      >
        <template #cell-name="{ row }">
          <div class="flex items-center gap-3 min-w-0">
            <img
              v-if="row.image"
              :src="row.image"
              :alt="row.name"
              class="w-9 h-9 rounded object-cover bg-slate-100 border border-slate-200 shrink-0"
              loading="lazy"
            />
            <span
              v-else
              class="w-9 h-9 rounded bg-slate-100 text-slate-500 flex items-center justify-center
                     text-[13px] font-medium shrink-0"
            >
              {{ (row.name?.[0] || '?').toUpperCase() }}
            </span>
            <div class="min-w-0">
              <p class="font-medium text-slate-900 truncate">{{ row.name }}</p>
              <p class="text-[12px] text-slate-400 truncate">{{ row.slug || '—' }}</p>
            </div>
          </div>
        </template>

        <template #cell-description="{ row }">
          <span class="text-slate-600 line-clamp-1">{{ row.description || '—' }}</span>
        </template>

        <template #cell-productCount="{ row }">
          <span class="tabular-nums text-slate-700">{{ row.productCount ?? 0 }}</span>
        </template>

        <template #cell-order="{ row }">
          <span class="tabular-nums text-slate-500">{{ row.order ?? 0 }}</span>
        </template>

        <template #cell-isActive="{ row }">
          <StatusBadge :status="row.isActive ? 'active' : 'inactive'" dot />
        </template>

        <template #cell-actions="{ row }">
          <div class="flex items-center justify-end gap-1">
            <button class="dt-btn h-7 px-2 text-[12px]" @click.stop="editCat(row)">Edit</button>
            <button
              class="dt-btn h-7 px-2 text-[12px] text-red-600 hover:bg-red-50 hover:border-red-300"
              :disabled="deletingId === row._id"
              @click.stop="deleteCat(row)"
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

    <!-- ─── Create / edit ───────────────────────── -->
    <div v-if="showModal" class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-slate-900/40" @click="showModal = false" />
      <div class="relative bg-white rounded-lg shadow-xl border border-slate-200 w-full max-w-md p-5">
        <h2 class="text-[15px] font-semibold text-slate-900 mb-4">
          {{ editing ? 'Edit category' : 'Add category' }}
        </h2>

        <form class="space-y-3.5" @submit.prevent="saveCat">
          <div>
            <label class="block text-[13px] font-medium text-slate-700 mb-1">Name</label>
            <input v-model="form.name" class="dt-input" required />
          </div>

          <div>
            <label class="block text-[13px] font-medium text-slate-700 mb-1">Description</label>
            <textarea v-model="form.description" class="dt-input h-20 py-2 resize-none" />
          </div>

          <div>
            <label class="block text-[13px] font-medium text-slate-700 mb-1">Image</label>
            <div class="flex items-center gap-2">
              <input
                type="file"
                accept="image/*"
                class="dt-input flex-1 py-1.5 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0
                       file:text-[12px] file:bg-slate-100 file:text-slate-700"
                :disabled="uploadingImage"
                @change="handleFileUpload"
              />
              <span v-if="uploadingImage" class="text-[12px] text-blue-600">Uploading…</span>
            </div>
            <p v-if="form.image" class="text-[12px] text-emerald-600 mt-1 truncate">
              Uploaded: {{ form.image }}
            </p>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-[13px] font-medium text-slate-700 mb-1">Display order</label>
              <input v-model.number="form.order" type="number" class="dt-input" />
            </div>
            <div>
              <label class="block text-[13px] font-medium text-slate-700 mb-1">Status</label>
              <select v-model="form.isActive" class="dt-select w-full">
                <option :value="true">Active</option>
                <option :value="false">Inactive</option>
              </select>
            </div>
          </div>

          <div class="flex gap-2 justify-end pt-1">
            <button type="button" class="dt-btn" @click="showModal = false">Cancel</button>
            <button type="submit" class="dt-btn-primary" :disabled="saving">
              {{ saving ? 'Saving…' : 'Save' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { categoryAPI, uploadAPI } from '@/api/services';
import { useToast } from 'vue-toastification';
import { useDataTable } from '@/composables/useDataTable';
import { DataTable, DataToolbar, Pagination, FilterSelect, StatusBadge } from '@/components/ui';

const toast = useToast();

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
];

const columns = [
  { key: 'name', label: 'Category', sortable: true, primary: true },
  { key: 'description', label: 'Description', hideOn: 'xl' },
  { key: 'productCount', label: 'Products', sortable: true, align: 'right' },
  { key: 'order', label: 'Order', sortable: true, align: 'right', hideOn: 'xl' },
  { key: 'isActive', label: 'Status', badge: true },
  { key: 'actions', label: '', align: 'right', width: 'w-32', hideOnMobile: true },
];

const table = useDataTable({
  fetcher: (params, config) => categoryAPI.getAll(params, config),
  filters: { status: '' },
  defaultSort: 'order',
  onError: () => toast.error('Failed to load categories'),
});

const filterMeta = computed(() => ({
  status: { label: 'Status', options: STATUS_OPTIONS },
}));

// ─── Create / edit ─────────────────────────────
const showModal = ref(false);
const editing = ref(null);
const saving = ref(false);
const uploadingImage = ref(false);
const form = ref({ name: '', description: '', image: '', order: 0, isActive: true });

const openCreate = () => {
  editing.value = null;
  form.value = { name: '', description: '', image: '', order: 0, isActive: true };
  showModal.value = true;
};

const editCat = (cat) => {
  editing.value = cat._id;
  form.value = { ...cat };
  showModal.value = true;
};

const handleFileUpload = async (event) => {
  const file = event.target.files[0];
  if (!file) return;
  try {
    uploadingImage.value = true;
    const res = await uploadAPI.uploadImage(file);
    form.value.image = res.data.url;
    toast.success('Image uploaded');
  } catch {
    toast.error('Image upload failed');
  } finally {
    uploadingImage.value = false;
  }
};

const saveCat = async () => {
  try {
    saving.value = true;
    if (editing.value) {
      await categoryAPI.update(editing.value, form.value);
      toast.success('Category updated');
    } else {
      await categoryAPI.create(form.value);
      toast.success('Category created');
    }
    showModal.value = false;
    table.refresh();
  } catch (e) {
    toast.error(e.response?.data?.message || e.message || 'Failed to save category');
  } finally {
    saving.value = false;
  }
};

// ─── Delete ────────────────────────────────────
const deletingId = ref(null);

const deleteCat = async (cat) => {
  if (!confirm(`Delete "${cat.name}"?`)) return;
  try {
    deletingId.value = cat._id;
    await categoryAPI.delete(cat._id);
    toast.success('Category deleted');
    table.refresh();
  } catch (e) {
    // The server refuses to delete a category that still has products.
    toast.error(e.response?.data?.message || 'Cannot delete — category has linked products');
  } finally {
    deletingId.value = null;
  }
};
</script>
