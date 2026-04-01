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
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Selling Price (₹) *</label>
            <input v-model.number="form.price" type="number" class="admin-input w-full" placeholder="0" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Compare-At Price (₹)</label>
            <input v-model.number="form.compareAtPrice" type="number" class="admin-input w-full" placeholder="MRP / Original price" />
            <p v-if="discountPct > 0" class="text-xs text-green-600 font-semibold mt-1">{{ discountPct }}% discount</p>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Cost Price (₹)</label>
            <input v-model.number="form.costPrice" type="number" class="admin-input w-full" placeholder="Your cost" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Stock *</label>
            <input v-model.number="form.stock" type="number" class="admin-input w-full" placeholder="0" />
          </div>
        </div>
        <!-- Discount summary bar -->
        <div v-if="discountPct > 0" class="mt-3 p-3 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3">
          <span class="text-green-600 text-lg">🏷️</span>
          <div class="text-sm text-green-700">
            <span class="font-bold">{{ discountPct }}% OFF</span>
            — Customer saves <span class="font-bold">₹{{ (form.compareAtPrice - form.price).toLocaleString('en-IN') }}</span>
            (₹{{ form.compareAtPrice?.toLocaleString('en-IN') }} → ₹{{ form.price?.toLocaleString('en-IN') }})
          </div>
        </div>
      </div>

      <!-- Badges -->
      <div class="admin-card p-6">
        <h2 class="text-lg font-semibold text-gray-900 mb-1">Product Badges</h2>
        <p class="text-xs text-gray-400 mb-4">Badges appear on product cards in the shop. Select all that apply.</p>
        <div class="flex flex-wrap gap-3">
          <label v-for="badge in badgeOptions" :key="badge.value"
            class="flex items-center gap-2 px-4 py-2 rounded-xl border-2 cursor-pointer transition-all select-none"
            :class="form.badges.includes(badge.value)
              ? 'border-blue-500 bg-blue-50 text-blue-700'
              : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'"
          >
            <input type="checkbox" :value="badge.value" v-model="form.badges" class="hidden" />
            <span>{{ badge.icon }}</span>
            <span class="text-sm font-semibold">{{ badge.label }}</span>
          </label>
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

      <!-- Related Products -->
      <div class="admin-card p-6">
        <h2 class="text-lg font-semibold text-gray-900 mb-4">Related Products</h2>
        <div v-if="form.relatedProducts.length" class="flex flex-wrap gap-2 mb-4">
          <div v-for="rp in form.relatedProducts" :key="rp" class="flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg text-sm">
            <span class="font-medium">{{ getProductName(rp) }}</span>
            <button @click="removeRelated(rp)" class="text-blue-400 hover:text-red-500 text-xs font-bold">×</button>
          </div>
        </div>
        <select @change="addRelated($event)" class="admin-input w-full">
          <option value="">Select a product to add...</option>
          <option v-for="p in availableProducts" :key="p._id" :value="p._id">{{ p.name }}</option>
        </select>
        <p class="text-xs text-gray-500 mt-1">Select products that will appear as "You May Also Like" on this product's page.</p>
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
const allProducts = ref([]);

const badgeOptions = [
  { value: 'new', label: 'New Arrival', icon: '✨' },
  { value: 'best-seller', label: 'Best Seller', icon: '🔥' },
  { value: 'sale', label: 'Sale', icon: '🏷️' },
  { value: 'featured', label: 'Featured', icon: '⭐' },
  { value: 'limited', label: 'Limited Stock', icon: '⚡' },
];

const form = ref({
  name: '', sku: '', brand: 'OZOBATH', shortDescription: '', description: '',
  price: 0, compareAtPrice: 0, costPrice: 0, stock: 0, category: '', tagsStr: '',
  images: [], variants: [], specifications: [], relatedProducts: [], badges: [],
  metaTitle: '', metaDescription: '', isActive: true, isFeatured: false, isNewArrival: false,
});

const discountPct = computed(() => {
  const cap = form.value.compareAtPrice;
  const price = form.value.price;
  if (cap > 0 && price > 0 && cap > price) {
    return Math.round(((cap - price) / cap) * 100);
  }
  return 0;
});

const availableProducts = computed(() => {
  const currentId = route.params.id;
  const selectedIds = form.value.relatedProducts;
  return allProducts.value.filter(p => p._id !== currentId && !selectedIds.includes(p._id));
});

const getProductName = (id) => {
  const p = allProducts.value.find(p => p._id === id);
  return p ? p.name : id;
};

const addRelated = (event) => {
  const id = event.target.value;
  if (id && !form.value.relatedProducts.includes(id)) {
    form.value.relatedProducts.push(id);
  }
  event.target.value = '';
};

const removeRelated = (id) => {
  form.value.relatedProducts = form.value.relatedProducts.filter(rp => rp !== id);
};

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
  try { const prodRes = await productAPI.getAll(); allProducts.value = (prodRes.data?.products || prodRes.data || []); } catch (e) {}
  if (isEdit.value) {
    try {
      const res = await productAPI.getById(route.params.id);
      const p = res.data;
      form.value = {
        ...p,
        tagsStr: (p.tags || []).join(', '),
        category: p.category?._id || p.category || '',
        relatedProducts: (p.relatedProducts || []).map(rp => rp._id || rp),
        badges: p.badges || [],
        compareAtPrice: p.compareAtPrice || p.mrp || 0,
      };
    } catch (e) { toast.error('Failed to load product'); }
  }
});
</script>
