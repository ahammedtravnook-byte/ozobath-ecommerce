<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Banners</h1>
        <p class="text-sm text-gray-400 mt-0.5">Banners appear on the client website in hero and promo sections</p>
      </div>
      <button @click="openCreate" class="admin-btn-primary">+ Add Banner</button>
    </div>

    <!-- Where banners appear guide -->
    <div class="bg-blue-50 border border-blue-100 rounded-2xl p-4 mb-6 flex gap-3">
      <span class="text-xl">ℹ️</span>
      <div class="text-sm text-blue-700">
        <p class="font-semibold mb-1">Where do banners show on the client site?</p>
        <ul class="space-y-0.5 text-blue-600 text-xs">
          <li>• <strong>Home + Promo</strong> — Appears in the dual promo cards section (Shower Enclosures / Bathroom Fittings area)</li>
          <li>• <strong>Home + Hero</strong> — Replaces the main hero background image</li>
          <li>• <strong>Shop + Hero</strong> — Shows in the shop page banner strip</li>
        </ul>
      </div>
    </div>

    <div v-if="loading" class="admin-card p-8 text-center">
      <div class="animate-spin w-8 h-8 border-3 border-blue-200 border-t-blue-600 rounded-full mx-auto"></div>
    </div>

    <div v-else-if="banners.length === 0" class="admin-card text-center py-16">
      <div class="text-5xl mb-3">🖼️</div>
      <p class="text-gray-400 text-lg mb-1">No banners yet</p>
      <p class="text-gray-300 text-sm mb-4">Add your first banner to make it appear on the website</p>
      <button @click="openCreate" class="admin-btn-primary">+ Add Banner</button>
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-5">
      <div v-for="banner in banners" :key="banner._id" class="admin-card overflow-hidden p-0">
        <div class="relative bg-gray-100 h-44 overflow-hidden">
          <img v-if="bannerImageUrl(banner)" :src="bannerImageUrl(banner)" :alt="banner.title" class="w-full h-full object-cover" />
          <div v-else class="w-full h-full flex items-center justify-center text-gray-300 text-4xl">🖼️</div>
          <div class="absolute top-3 left-3">
            <span :class="banner.isActive ? 'bg-green-500' : 'bg-red-400'" class="text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
              {{ banner.isActive ? 'Active' : 'Inactive' }}
            </span>
          </div>
          <div class="absolute top-3 right-3 bg-black/60 text-white text-[10px] font-semibold px-2 py-1 rounded-lg">
            {{ banner.page }} / {{ banner.position }}
          </div>
        </div>
        <div class="p-4">
          <div class="flex items-start justify-between gap-3">
            <div class="flex-1 min-w-0">
              <h3 class="font-semibold text-gray-900 truncate">{{ banner.title || 'Untitled' }}</h3>
              <p v-if="banner.subtitle" class="text-xs text-gray-400 truncate mt-0.5">{{ banner.subtitle }}</p>
              <div v-if="banner.link" class="mt-1.5">
                <span class="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-medium">🔗 {{ banner.link }}</span>
              </div>
            </div>
            <div class="flex gap-1.5 shrink-0">
              <button @click="editBanner(banner)" class="px-3 py-1.5 text-xs bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg font-semibold">Edit</button>
              <button @click="toggleActive(banner)"
                :class="banner.isActive ? 'bg-yellow-50 text-yellow-600 hover:bg-yellow-100' : 'bg-green-50 text-green-600 hover:bg-green-100'"
                class="px-3 py-1.5 text-xs rounded-lg font-semibold">
                {{ banner.isActive ? 'Disable' : 'Enable' }}
              </button>
              <button @click="deleteBanner(banner._id)" class="px-3 py-1.5 text-xs bg-red-50 text-red-500 hover:bg-red-100 rounded-lg font-semibold">Delete</button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal -->
    <Teleport to="body">
      <div v-if="showModal" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="fixed inset-0 bg-black/50 backdrop-blur-sm" @click="showModal = false"></div>
        <div class="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
          <h2 class="text-lg font-bold mb-5">{{ editing ? 'Edit Banner' : 'Add Banner' }}</h2>
          <form @submit.prevent="saveBanner" class="space-y-4">
            <div>
              <label class="admin-label">Title *</label>
              <input v-model="form.title" class="admin-input" required placeholder="e.g. Summer Sale — 40% Off" />
            </div>
            <div>
              <label class="admin-label">Subtitle <span class="text-gray-300 font-normal">(optional)</span></label>
              <input v-model="form.subtitle" class="admin-input" placeholder="e.g. Premium Shower Enclosures" />
            </div>

            <!-- Image upload -->
            <div>
              <label class="admin-label">Banner Image *</label>
              <div v-if="form.imagePreview || (form.image && form.image.url)" class="mb-2 relative rounded-xl overflow-hidden h-32 bg-gray-100">
                <img :src="form.imagePreview || form.image.url" class="w-full h-full object-cover" />
                <button type="button" @click="clearImage" class="absolute top-2 right-2 w-7 h-7 bg-red-500 text-white rounded-lg text-xs flex items-center justify-center font-bold">✕</button>
              </div>
              <label class="block cursor-pointer">
                <div class="border-2 border-dashed border-gray-200 hover:border-blue-300 rounded-xl py-4 px-4 text-center transition-colors">
                  <span v-if="uploadingImage" class="text-sm text-blue-600 animate-pulse">⏳ Uploading image...</span>
                  <span v-else class="text-sm text-gray-400">📁 Click to upload image <span class="text-xs">(JPG, PNG)</span></span>
                </div>
                <input type="file" accept="image/*" @change="handleFileUpload" class="hidden" :disabled="uploadingImage" />
              </label>
              <p class="text-xs text-gray-400 mt-1">Recommended: 1200×500px for best display</p>
            </div>

            <div>
              <label class="admin-label">Link URL <span class="text-gray-300 font-normal">(where clicking goes)</span></label>
              <input v-model="form.link" class="admin-input" placeholder="e.g. /shop" />
            </div>
            <div>
              <label class="admin-label">Button Text <span class="text-gray-300 font-normal">(optional)</span></label>
              <input v-model="form.buttonText" class="admin-input" placeholder="e.g. Shop Now" />
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="admin-label">Page</label>
                <select v-model="form.page" class="admin-input">
                  <option value="home">Home</option>
                  <option value="shop">Shop</option>
                  <option value="about">About</option>
                </select>
              </div>
              <div>
                <label class="admin-label">Position</label>
                <select v-model="form.position" class="admin-input">
                  <option value="promo">Promo (recommended)</option>
                  <option value="hero">Hero</option>
                  <option value="sidebar">Sidebar</option>
                </select>
              </div>
            </div>

            <div class="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-3">
              <input type="checkbox" v-model="form.isActive" id="isActive" class="w-4 h-4 accent-blue-600" />
              <label for="isActive" class="text-sm font-medium text-gray-700 cursor-pointer">Show this banner on the website</label>
            </div>

            <div class="flex gap-3 pt-2">
              <button type="submit" :disabled="savingBanner || uploadingImage" class="admin-btn-primary flex-1 disabled:opacity-50">
                {{ savingBanner ? 'Saving...' : (editing ? 'Update Banner' : 'Create Banner') }}
              </button>
              <button type="button" @click="showModal = false" class="admin-btn-secondary flex-1">Cancel</button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { bannerAPI, uploadAPI } from '@/api/services';
import { useToast } from 'vue-toastification';

const toast = useToast();
const loading = ref(true);
const banners = ref([]);
const showModal = ref(false);
const editing = ref(null);
const savingBanner = ref(false);
const uploadingImage = ref(false);

const emptyForm = () => ({
  title: '',
  subtitle: '',
  image: { url: '', publicId: '' },
  imagePreview: '',
  link: '',
  buttonText: '',
  page: 'home',
  position: 'promo',
  isActive: true,
});

const form = ref(emptyForm());

const bannerImageUrl = (banner) => banner.image?.url || '';

const clearImage = () => {
  form.value.image = { url: '', publicId: '' };
  form.value.imagePreview = '';
};

const handleFileUpload = async (event) => {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => { form.value.imagePreview = e.target.result; };
  reader.readAsDataURL(file);
  try {
    uploadingImage.value = true;
    const res = await uploadAPI.uploadImage(file);
    form.value.image = { url: res.data?.url || res.url || '', publicId: res.data?.publicId || res.publicId || '' };
    form.value.imagePreview = '';
    toast.success('Image uploaded!');
  } catch {
    toast.error('Image upload failed');
    form.value.imagePreview = '';
  } finally {
    uploadingImage.value = false;
  }
};

const fetchBanners = async () => {
  try {
    const res = await bannerAPI.getAll();
    banners.value = res.data || [];
  } catch {
    toast.error('Failed to load banners');
  } finally {
    loading.value = false;
  }
};

const openCreate = () => { editing.value = null; form.value = emptyForm(); showModal.value = true; };

const editBanner = (b) => {
  editing.value = b._id;
  form.value = {
    title: b.title || '',
    subtitle: b.subtitle || '',
    image: { url: b.image?.url || '', publicId: b.image?.publicId || '' },
    imagePreview: '',
    link: b.link || '',
    buttonText: b.buttonText || '',
    page: b.page || 'home',
    position: b.position || 'promo',
    isActive: b.isActive !== false,
  };
  showModal.value = true;
};

const toggleActive = async (banner) => {
  try {
    await bannerAPI.update(banner._id, { isActive: !banner.isActive });
    toast.success(banner.isActive ? 'Banner disabled' : 'Banner enabled');
    fetchBanners();
  } catch {
    toast.error('Failed to update');
  }
};

const saveBanner = async () => {
  if (!form.value.image?.url) {
    toast.error('Please upload a banner image first');
    return;
  }
  try {
    savingBanner.value = true;
    const payload = {
      title: form.value.title,
      subtitle: form.value.subtitle,
      image: form.value.image,
      link: form.value.link,
      buttonText: form.value.buttonText,
      page: form.value.page,
      position: form.value.position,
      isActive: form.value.isActive,
    };
    if (editing.value) {
      await bannerAPI.update(editing.value, payload);
      toast.success('Banner updated!');
    } else {
      await bannerAPI.create(payload);
      toast.success('Banner created!');
    }
    showModal.value = false;
    fetchBanners();
  } catch (e) {
    toast.error(e.message || 'Save failed');
  } finally {
    savingBanner.value = false;
  }
};

const deleteBanner = async (id) => {
  if (!confirm('Delete this banner? It will no longer show on the website.')) return;
  try {
    await bannerAPI.delete(id);
    toast.success('Banner deleted');
    fetchBanners();
  } catch {
    toast.error('Failed to delete');
  }
};

onMounted(fetchBanners);
</script>
