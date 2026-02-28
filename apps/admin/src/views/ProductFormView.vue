<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold text-gray-900">{{ isEdit ? 'Edit Product' : 'Add Product' }}</h1>
      <button @click="$router.push('/products')" class="text-sm text-gray-500 hover:text-gray-700">← Back to Products</button>
    </div>

    <div class="space-y-6">
      <!-- Basic Info -->
      <div class="admin-card p-6">
        <h2 class="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>
        <div class="space-y-4">
          <div><label class="block text-sm font-medium text-gray-700 mb-1">Product Name *</label><input v-model="form.name" class="admin-input w-full" placeholder="Enter product name" /></div>
          <div class="grid grid-cols-2 gap-4">
            <div><label class="block text-sm font-medium text-gray-700 mb-1">SKU</label><input v-model="form.sku" class="admin-input w-full" placeholder="e.g. OZO-SHW-001" /></div>
            <div><label class="block text-sm font-medium text-gray-700 mb-1">Brand</label><input v-model="form.brand" class="admin-input w-full" placeholder="OZOBATH" /></div>
          </div>
          <div><label class="block text-sm font-medium text-gray-700 mb-1">Short Description</label><textarea v-model="form.shortDescription" rows="2" class="admin-input w-full" placeholder="Brief product summary..."></textarea></div>
          <div><label class="block text-sm font-medium text-gray-700 mb-1">Full Description</label><textarea v-model="form.description" rows="6" class="admin-input w-full" placeholder="Detailed product description..."></textarea></div>
        </div>
      </div>

      <!-- Pricing & Stock -->
      <div class="admin-card p-6">
        <h2 class="text-lg font-semibold text-gray-900 mb-4">Pricing & Stock</h2>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div><label class="block text-sm font-medium text-gray-700 mb-1">Price (₹) *</label><input v-model.number="form.price" type="number" class="admin-input w-full" /></div>
          <div><label class="block text-sm font-medium text-gray-700 mb-1">MRP (₹)</label><input v-model.number="form.mrp" type="number" class="admin-input w-full" /></div>
          <div><label class="block text-sm font-medium text-gray-700 mb-1">Cost Price (₹)</label><input v-model.number="form.costPrice" type="number" class="admin-input w-full" /></div>
          <div><label class="block text-sm font-medium text-gray-700 mb-1">Stock *</label><input v-model.number="form.stock" type="number" class="admin-input w-full" /></div>
        </div>
      </div>

      <!-- Category & Tags -->
      <div class="admin-card p-6">
        <h2 class="text-lg font-semibold text-gray-900 mb-4">Category & Tags</h2>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select v-model="form.category" class="admin-input w-full">
              <option value="">Select Category</option>
              <option v-for="cat in categories" :key="cat._id" :value="cat._id">{{ cat.name }}</option>
            </select>
          </div>
          <div><label class="block text-sm font-medium text-gray-700 mb-1">Tags (comma separated)</label><input v-model="form.tagsStr" class="admin-input w-full" placeholder="shower, modern, premium" /></div>
        </div>
      </div>

      <!-- Images -->
      <div class="admin-card p-6">
        <h2 class="text-lg font-semibold text-gray-900 mb-4">Images</h2>
        <div v-if="form.images.length" class="flex flex-wrap gap-3 mb-4">
          <div v-for="(img, i) in form.images" :key="i" class="relative w-20 h-20">
            <img :src="img.url" class="w-full h-full rounded-lg object-cover bg-gray-100" />
            <button @click="form.images.splice(i, 1)" class="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center">×</button>
          </div>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Upload Images</label>
          <div class="flex items-center gap-3">
            <input 
              type="file" 
              multiple 
              accept="image/*" 
              @change="handleFileUpload" 
              class="admin-input flex-1 p-1.5"
              :disabled="uploadingImages"
            />
            <span v-if="uploadingImages" class="text-sm text-blue-600 animate-pulse">Uploading...</span>
          </div>
          <p class="text-xs text-gray-500 mt-1">Select one or multiple images to upload directly to Cloudinary.</p>
        </div>
      </div>

      <!-- Variants -->
      <div class="admin-card p-6">
        <h2 class="text-lg font-semibold text-gray-900 mb-4">Variants</h2>
        <div v-if="form.variants.length" class="space-y-3 mb-4">
          <div v-for="(v, i) in form.variants" :key="i" class="flex items-center gap-3 bg-gray-50 rounded-lg p-3">
            <input v-model="v.name" class="admin-input flex-1 text-sm" placeholder="e.g. Chrome" />
            <input v-model="v.value" class="admin-input flex-1 text-sm" placeholder="e.g. Silver" />
            <input v-model.number="v.priceAdjustment" type="number" class="admin-input w-24 text-sm" placeholder="±₹" />
            <button @click="form.variants.splice(i, 1)" class="text-red-500 text-xs">Remove</button>
          </div>
        </div>
        <button @click="form.variants.push({ name: '', value: '', priceAdjustment: 0 })" class="text-sm text-blue-600 hover:text-blue-800 font-medium">+ Add Variant</button>
      </div>

      <!-- Specifications -->
      <div class="admin-card p-6">
        <h2 class="text-lg font-semibold text-gray-900 mb-4">Specifications</h2>
        <div v-if="form.specifications.length" class="space-y-3 mb-4">
          <div v-for="(s, i) in form.specifications" :key="i" class="flex items-center gap-3">
            <input v-model="s.key" class="admin-input flex-1 text-sm" placeholder="Material" />
            <input v-model="s.value" class="admin-input flex-1 text-sm" placeholder="Stainless Steel" />
            <button @click="form.specifications.splice(i, 1)" class="text-red-500 text-xs">Remove</button>
          </div>
        </div>
        <button @click="form.specifications.push({ key: '', value: '' })" class="text-sm text-blue-600 hover:text-blue-800 font-medium">+ Add Specification</button>
      </div>

      <!-- SEO -->
      <div class="admin-card p-6">
        <h2 class="text-lg font-semibold text-gray-900 mb-4">SEO</h2>
        <div class="space-y-4">
          <div><label class="block text-sm font-medium text-gray-700 mb-1">Meta Title</label><input v-model="form.metaTitle" class="admin-input w-full" /></div>
          <div><label class="block text-sm font-medium text-gray-700 mb-1">Meta Description</label><textarea v-model="form.metaDescription" rows="2" class="admin-input w-full"></textarea></div>
        </div>
      </div>

      <!-- Status -->
      <div class="admin-card p-6 flex items-center gap-6">
        <label class="flex items-center gap-2 text-sm"><input v-model="form.isActive" type="checkbox" class="w-4 h-4 rounded" /><span>Active</span></label>
        <label class="flex items-center gap-2 text-sm"><input v-model="form.isFeatured" type="checkbox" class="w-4 h-4 rounded" /><span>Featured</span></label>
        <label class="flex items-center gap-2 text-sm"><input v-model="form.isNewArrival" type="checkbox" class="w-4 h-4 rounded" /><span>New Arrival</span></label>
      </div>

      <!-- Actions -->
      <div class="flex justify-end gap-3">
        <button @click="$router.push('/products')" class="px-6 py-2.5 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200">Cancel</button>
        <button @click="saveProduct" class="admin-btn-primary" :disabled="saving">{{ saving ? 'Saving...' : (isEdit ? 'Update Product' : 'Create Product') }}</button>
      </div>
    </div>
  </div>
</template>
<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { productAPI, categoryAPI, uploadAPI } from '@/api/services';
import { useToast } from 'vue-toastification';

const route = useRoute(); const router = useRouter(); const toast = useToast();
const isEdit = computed(() => route.params.id && route.params.id !== 'new');
const saving = ref(false); const categories = ref([]); const newImageUrl = ref('');
const form = ref({
  name: '', sku: '', brand: 'OZOBATH', shortDescription: '', description: '',
  price: 0, mrp: 0, costPrice: 0, stock: 0, category: '', tagsStr: '',
  images: [], variants: [], specifications: [],
  metaTitle: '', metaDescription: '', isActive: true, isFeatured: false, isNewArrival: false,
});

const addImage = () => { if (newImageUrl.value) { form.value.images.push({ url: newImageUrl.value }); newImageUrl.value = ''; } };

const uploadingImages = ref(false);
const handleFileUpload = async (event) => {
  const files = Array.from(event.target.files);
  if (!files.length) return;
  
  try {
    uploadingImages.value = true;
    const res = await uploadAPI.uploadImages(files);
    // Backend returns array of {url, publicId}
    const uploadedImages = res.data || [];
    form.value.images = [...form.value.images, ...uploadedImages];
    toast.success(`${uploadedImages.length} images uploaded!`);
  } catch (error) {
    toast.error(error.message || 'Image upload failed');
  } finally {
    uploadingImages.value = false;
    event.target.value = ''; // reset input
  }
};

const saveProduct = async () => {
  try {
    saving.value = true;
    const data = { ...form.value, tags: form.value.tagsStr.split(',').map(t => t.trim()).filter(Boolean) };
    delete data.tagsStr;
    if (isEdit.value) { await productAPI.update(route.params.id, data); toast.success('Product updated'); }
    else { await productAPI.create(data); toast.success('Product created'); }
    router.push('/products');
  } catch (e) { toast.error(e.message || 'Failed to save product'); } finally { saving.value = false; }
};

onMounted(async () => {
  try { const catRes = await categoryAPI.getAll(); categories.value = catRes.data || []; } catch (e) {}
  if (isEdit.value) {
    try {
      const res = await productAPI.getById(route.params.id);
      const p = res.data;
      form.value = { ...p, tagsStr: (p.tags || []).join(', '), category: p.category?._id || p.category || '' };
    } catch (e) { toast.error('Failed to load product'); }
  }
});
</script>
