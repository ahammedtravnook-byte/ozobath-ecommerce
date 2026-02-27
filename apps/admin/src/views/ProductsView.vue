<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold text-gray-900">Products</h1>
      <button @click="$router.push('/products/new')" class="admin-btn-primary">+ Add Product</button>
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
              <p class="text-sm font-semibold text-gray-900">₹{{ product.price }}</p>
              <p v-if="product.mrp > product.price" class="text-xs text-gray-400 line-through">₹{{ product.mrp }}</p>
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
