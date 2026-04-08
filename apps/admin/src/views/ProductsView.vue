<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold text-gray-900">Products</h1>
      <div class="flex items-center gap-3">
        <button @click="showBulkModal = true" class="px-4 py-2 text-sm font-semibold text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors">
          📥 Bulk Upload
        </button>
        <button @click="$router.push('/products/new')" class="admin-btn-primary">+ Add Product</button>
      </div>
    </div>

    <!-- Bulk Upload Modal -->
    <div v-if="showBulkModal" class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" @click="showBulkModal = false" />
      <div class="relative bg-white rounded-2xl shadow-2xl p-6 w-full max-w-lg">
        <h3 class="text-lg font-bold text-gray-900 mb-1">Bulk Upload Products</h3>
        <p class="text-sm text-gray-400 mb-5">Upload an Excel file (.xlsx) to create or update multiple products at once.</p>

        <!-- Template download -->
        <div class="flex items-center gap-3 p-3 bg-blue-50 rounded-xl mb-5 border border-blue-100">
          <span class="text-2xl">📋</span>
          <div class="flex-1">
            <p class="text-sm font-semibold text-blue-900">Download Template First</p>
            <p class="text-xs text-blue-500">Use this template to prepare your product data correctly</p>
          </div>
          <button @click="downloadTemplate" :disabled="templateLoading" class="text-xs px-3 py-1.5 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50">
            {{ templateLoading ? 'Downloading...' : 'Download' }}
          </button>
        </div>

        <!-- File upload -->
        <div class="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center mb-4 hover:border-blue-300 transition-colors"
          @dragover.prevent @drop.prevent="handleFileDrop">
          <input type="file" ref="bulkFileInput" accept=".xlsx" @change="handleBulkFile" class="hidden" />
          <div v-if="!bulkFile">
            <p class="text-3xl mb-2">📂</p>
            <p class="text-sm text-gray-500 mb-2">Drag & drop your .xlsx file here or</p>
            <button @click="$refs.bulkFileInput.click()" class="text-sm text-blue-600 font-semibold hover:underline">Browse file</button>
          </div>
          <div v-else class="flex items-center gap-3">
            <span class="text-2xl">📄</span>
            <div class="text-left flex-1">
              <p class="text-sm font-semibold text-gray-800">{{ bulkFile.name }}</p>
              <p class="text-xs text-gray-400">{{ (bulkFile.size / 1024).toFixed(1) }} KB</p>
            </div>
            <button @click="bulkFile = null" class="text-red-400 hover:text-red-600 text-xs font-bold">✕ Remove</button>
          </div>
        </div>

        <!-- Upload results -->
        <div v-if="bulkResult" class="p-3 rounded-xl mb-4 border"
          :class="bulkResult.errors?.length ? 'bg-yellow-50 border-yellow-200' : 'bg-green-50 border-green-200'">
          <p class="text-sm font-bold mb-1" :class="bulkResult.errors?.length ? 'text-yellow-700' : 'text-green-700'">
            ✅ {{ bulkResult.created }} created, ✏️ {{ bulkResult.updated }} updated
            <span v-if="bulkResult.errors?.length"> ⚠️ {{ bulkResult.errors.length }} errors</span>
          </p>
          <div v-if="bulkResult.errors?.length" class="mt-2 max-h-28 overflow-y-auto space-y-1">
            <p v-for="e in bulkResult.errors" :key="e.row" class="text-xs text-yellow-700">
              Row {{ e.row }}{{ e.name ? ` (${e.name})` : '' }}: {{ e.error }}
            </p>
          </div>
        </div>

        <div class="flex gap-3">
          <button @click="showBulkModal = false; bulkResult = null; bulkFile = null" class="flex-1 py-2.5 border border-gray-200 text-gray-600 text-sm font-semibold rounded-xl hover:bg-gray-50 transition-colors">Cancel</button>
          <button @click="uploadBulk" :disabled="!bulkFile || bulkUploading" class="flex-1 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50">
            {{ bulkUploading ? 'Uploading...' : 'Upload & Import' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Filters -->
    <div class="admin-card mb-6">
      <div class="flex flex-col sm:flex-row gap-4">
        <input v-model="search" @input="fetchProducts" class="admin-input max-w-xs" placeholder="Search by name or SKU..." />
        <select v-model="filterCategory" @change="fetchProducts" class="admin-input max-w-[200px]">
          <option value="">All Categories</option>
          <option v-for="cat in categories" :key="cat._id" :value="cat._id">{{ cat.name }}</option>
        </select>
        <select v-model="filterStatus" @change="fetchProducts" class="admin-input max-w-[160px]">
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>
    </div>

    <!-- Products Table -->
    <div class="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden min-h-[400px] flex flex-col">
      <div v-if="loading" class="flex-1 flex items-center justify-center py-20">
        <div class="flex flex-col items-center gap-4">
          <div class="animate-spin w-10 h-10 border-4 border-blue-100 border-t-blue-600 rounded-full"></div>
          <p class="text-xs font-black text-gray-400 uppercase tracking-widest">Loading Catalog...</p>
        </div>
      </div>

      <div v-else-if="products.length === 0" class="flex-1 flex flex-col items-center justify-center py-20 text-center px-6">
        <div class="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center text-4xl mb-6 shadow-inner">📦</div>
        <h4 class="text-base font-black text-gray-900">No Products Found</h4>
        <p class="text-sm text-gray-400 mt-2 max-w-xs font-medium">Try adjusting your filters or search terms to find what you're looking for.</p>
      </div>

      <div v-else class="flex-1 flex flex-col overflow-hidden">
        <!-- Desktop Table View -->
        <div class="hidden lg:block flex-1 overflow-x-auto custom-scrollbar">
          <table class="w-full text-left border-collapse min-w-[1000px]">
            <thead>
              <tr class="bg-gray-50/50">
                <th class="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Product Details</th>
                <th class="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Pricing</th>
                <th class="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Inventory</th>
                <th class="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Sales</th>
                <th class="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                <th class="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-50">
              <tr v-for="product in products" :key="product._id" class="hover:bg-blue-50/10 transition-colors group">
                <td class="px-8 py-4">
                  <div class="flex items-center gap-4">
                    <div class="relative shrink-0">
                      <img :src="product.images?.[0]?.url || '/placeholder.jpg'" class="w-12 h-12 rounded-2xl object-cover bg-gray-50 border border-gray-100 group-hover:scale-105 transition-transform" />
                    </div>
                    <div class="min-w-0">
                      <p class="text-sm font-black text-gray-900 truncate max-w-[240px] group-hover:text-blue-600 transition-colors">{{ product.name }}</p>
                      <p class="text-[10px] font-bold text-gray-400 uppercase tracking-tighter mt-0.5">SKU: {{ product.sku || 'N/A' }}</p>
                    </div>
                  </div>
                </td>
                <td class="px-8 py-4">
                  <p class="text-sm font-black text-gray-900 tracking-tight">₹{{ product.price?.toLocaleString('en-IN') }}</p>
                  <p v-if="(product.compareAtPrice || product.mrp) > product.price" class="text-[10px] text-gray-400 line-through font-bold opacity-60">
                    ₹{{ (product.compareAtPrice || product.mrp)?.toLocaleString('en-IN') }}
                  </p>
                </td>
                <td class="px-8 py-4">
                  <div class="flex items-center gap-2">
                    <div :class="['w-2 h-2 rounded-full', product.stock < 10 ? 'bg-red-500 animate-pulse' : 'bg-emerald-500']"></div>
                    <span :class="['text-sm font-black', product.stock < 10 ? 'text-red-600' : 'text-gray-700']">{{ product.stock }}</span>
                    <span class="text-[10px] text-gray-400 font-bold uppercase tracking-widest ml-1">Units</span>
                  </div>
                </td>
                <td class="px-8 py-4">
                  <p class="text-sm font-black text-gray-900 tracking-tight">{{ product.salesCount || 0 }}</p>
                  <p class="text-[10px] text-gray-400 font-bold uppercase tracking-tighter mt-0.5">Total Sold</p>
                </td>
                <td class="px-8 py-4">
                  <span :class="product.isActive ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-red-50 text-red-600 border-red-100'" class="text-[10px] px-3 py-1 rounded-lg font-black uppercase tracking-widest border shadow-sm">
                    {{ product.isActive ? 'Active' : 'Inactive' }}
                  </span>
                </td>
                <td class="px-8 py-4 text-right">
                  <div class="flex items-center justify-end gap-2">
                    <button @click="$router.push(`/products/${product._id}/edit`)" class="w-10 h-10 flex items-center justify-center rounded-2xl bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white transition-all shadow-sm">
                      <span class="text-xl">✏️</span>
                    </button>
                    <button @click="deleteProduct(product._id)" class="w-10 h-10 flex items-center justify-center rounded-2xl bg-red-50 text-red-500 hover:bg-red-600 hover:text-white transition-all shadow-sm">
                      <span class="text-xl">🗑️</span>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Mobile Card Grid View -->
        <div class="lg:hidden flex-1 p-4 sm:p-6 space-y-4 overflow-y-auto max-h-[80vh] custom-scrollbar bg-gray-50/30">
          <div v-for="product in products" :key="product._id" class="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden animate-fade-in-up">
            <!-- Header -->
            <div class="p-4 flex gap-4 border-b border-gray-50 bg-gray-50/20">
              <img :src="product.images?.[0]?.url || '/placeholder.jpg'" class="w-16 h-16 rounded-2xl object-cover bg-white border border-gray-100" />
              <div class="flex-1 min-w-0">
                <div class="flex items-start justify-between gap-2">
                  <h4 class="text-sm font-black text-gray-900 leading-tight">{{ product.name }}</h4>
                  <span :class="product.isActive ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'" class="text-[8px] px-2 py-0.5 rounded-md font-black uppercase tracking-widest border border-current opacity-70">
                    {{ product.isActive ? 'Active' : 'Inactive' }}
                  </span>
                </div>
                <p class="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-1">SKU: {{ product.sku || 'N/A' }}</p>
              </div>
            </div>

            <!-- Stats Grid -->
            <div class="grid grid-cols-3 divide-x divide-gray-50 border-b border-gray-50">
              <div class="p-4 text-center">
                <p class="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Price</p>
                <p class="text-sm font-black text-gray-900 tracking-tight">₹{{ product.price?.toLocaleString('en-IN') }}</p>
              </div>
              <div class="p-4 text-center">
                <p class="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Stock</p>
                <div class="flex items-center justify-center gap-1">
                  <div :class="['w-1.5 h-1.5 rounded-full', product.stock < 10 ? 'bg-red-500 animate-pulse' : 'bg-emerald-500']"></div>
                  <p :class="['text-sm font-black', product.stock < 10 ? 'text-red-600' : 'text-gray-900']">{{ product.stock }}</p>
                </div>
              </div>
              <div class="p-4 text-center">
                <p class="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Sales</p>
                <p class="text-sm font-black text-gray-900">{{ product.salesCount || 0 }}</p>
              </div>
            </div>

            <!-- Actions -->
            <div class="p-3 bg-gray-50/50 flex items-center justify-between gap-3">
               <button @click="$router.push(`/products/${product._id}/edit`)" class="flex-1 flex items-center justify-center gap-2 py-2.5 bg-white border border-gray-100 text-blue-600 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-sm hover:bg-blue-50 transition-colors">
                 <span>✏️</span> Edit Product
               </button>
               <button @click="deleteProduct(product._id)" class="w-11 h-11 flex items-center justify-center bg-white border border-gray-100 text-red-500 rounded-2xl shadow-sm hover:bg-red-50 transition-colors">
                 <span>🗑️</span>
               </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Enhanced Pagination -->
      <div v-if="pagination.pages > 1" class="flex flex-col sm:flex-row items-center justify-between gap-4 px-8 py-6 border-t border-gray-50 bg-gray-50/20">
        <p class="text-[10px] font-black text-gray-400 uppercase tracking-widest">
          Displaying <span class="text-gray-900">{{ products.length }}</span> of <span class="text-gray-900">{{ pagination.total }}</span> units
        </p>
        <div class="flex items-center gap-1.5">
          <button v-for="p in pagination.pages" :key="p" @click="page = p; fetchProducts()"
            :class="['w-10 h-10 rounded-2xl text-xs font-black transition-all shadow-sm', page === p ? 'bg-gray-900 text-white shadow-gray-900/10' : 'bg-white border border-gray-100 text-gray-600 hover:bg-gray-50']">
            {{ p }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { productAPI, categoryAPI } from '@/api/services';
import { useToast } from 'vue-toastification';

// ── Bulk Upload ──────────────────────────────────
const showBulkModal = ref(false);
const bulkFile = ref(null);
const bulkUploading = ref(false);
const bulkResult = ref(null);
const templateLoading = ref(false);

const handleBulkFile = (e) => { bulkFile.value = e.target.files[0] || null; bulkResult.value = null; };
const handleFileDrop = (e) => { bulkFile.value = e.dataTransfer.files[0] || null; bulkResult.value = null; };

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
  } catch { toast.error('Failed to download template'); } finally { templateLoading.value = false; }
};

const uploadBulk = async () => {
  if (!bulkFile.value) return;
  try {
    bulkUploading.value = true;
    bulkResult.value = null;
    const res = await productAPI.bulkUpload(bulkFile.value);
    bulkResult.value = res.data;
    toast.success(`Import done: ${res.data.created} created, ${res.data.updated} updated`);
    fetchProducts();
  } catch (e) {
    toast.error(e.response?.data?.message || 'Bulk upload failed');
  } finally { bulkUploading.value = false; }
};

const toast = useToast();
const loading = ref(true);
const products = ref([]);
const categories = ref([]);
const pagination = ref({ total: 0, pages: 1 });
const page = ref(1);
const search = ref('');
const filterCategory = ref('');
const filterStatus = ref('');

const fetchProducts = async () => {
  try {
    loading.value = true;
    const params = { page: page.value, limit: 20 };
    if (search.value) params.search = search.value;
    if (filterCategory.value) params.category = filterCategory.value;
    if (filterStatus.value) params.status = filterStatus.value;

    const res = await productAPI.getAll(params);
    products.value = res.data?.products || [];
    pagination.value = res.data?.pagination || { total: 0, pages: 1 };
  } catch (err) {
    toast.error('Failed to load products');
  } finally {
    loading.value = false;
  }
};

const deleteProduct = async (id) => {
  if (!confirm('Delete this product?')) return;
  try {
    await productAPI.delete(id);
    toast.success('Product deleted');
    fetchProducts();
  } catch (err) {
    toast.error('Failed to delete');
  }
};

onMounted(async () => {
  try {
    const catRes = await categoryAPI.getAll();
    categories.value = catRes.data || [];
  } catch (e) {}
  fetchProducts();
});
</script>
