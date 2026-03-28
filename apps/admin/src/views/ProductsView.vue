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
    <div class="admin-card overflow-hidden">
      <div v-if="loading" class="p-8 text-center">
        <div class="animate-spin w-8 h-8 border-3 border-blue-200 border-t-blue-600 rounded-full mx-auto"></div>
      </div>

      <div v-else-if="products.length === 0" class="p-12 text-center">
        <p class="text-gray-400 text-lg">No products found</p>
      </div>

      <table v-else class="w-full">
        <thead class="bg-gray-50 border-b border-gray-100">
          <tr>
            <th class="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">Product</th>
            <th class="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">Price</th>
            <th class="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">Stock</th>
            <th class="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">Sales</th>
            <th class="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">Status</th>
            <th class="text-right text-xs font-medium text-gray-500 uppercase px-4 py-3">Actions</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-50">
          <tr v-for="product in products" :key="product._id" class="hover:bg-gray-50 transition-colors">
            <td class="px-4 py-3">
              <div class="flex items-center gap-3">
                <img :src="product.images?.[0]?.url || '/placeholder.jpg'" class="w-10 h-10 rounded-lg object-cover bg-gray-100" />
                <div>
                  <p class="text-sm font-medium text-gray-900 truncate max-w-[200px]">{{ product.name }}</p>
                  <p class="text-xs text-gray-400">{{ product.sku || 'No SKU' }}</p>
                </div>
              </div>
            </td>
            <td class="px-4 py-3">
              <p class="text-sm font-semibold text-gray-900">₹{{ product.price?.toLocaleString('en-IN') }}</p>
              <p v-if="(product.compareAtPrice || product.mrp) > product.price" class="text-xs text-gray-400 line-through">
                ₹{{ (product.compareAtPrice || product.mrp)?.toLocaleString('en-IN') }}
              </p>
            </td>
            <td class="px-4 py-3">
              <span :class="product.stock < 10 ? 'text-red-600 font-semibold' : 'text-gray-700'" class="text-sm">{{ product.stock }}</span>
            </td>
            <td class="px-4 py-3 text-sm text-gray-600">{{ product.salesCount || 0 }}</td>
            <td class="px-4 py-3">
              <span :class="product.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'" class="text-xs px-2 py-0.5 rounded-full font-medium">
                {{ product.isActive ? 'Active' : 'Inactive' }}
              </span>
            </td>
            <td class="px-4 py-3 text-right">
              <button @click="$router.push(`/products/${product._id}/edit`)" class="text-xs text-blue-600 hover:text-blue-800 mr-3">Edit</button>
              <button @click="deleteProduct(product._id)" class="text-xs text-red-500 hover:text-red-700">Delete</button>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- Pagination -->
      <div v-if="pagination.pages > 1" class="flex items-center justify-between px-4 py-3 border-t border-gray-100">
        <p class="text-xs text-gray-500">Showing {{ products.length }} of {{ pagination.total }}</p>
        <div class="flex gap-1">
          <button v-for="p in pagination.pages" :key="p" @click="page = p; fetchProducts()"
            :class="['px-3 py-1 rounded text-xs', page === p ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200']">
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
