<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold text-gray-900">Banners</h1>
      <button @click="openCreate" class="admin-btn-primary">+ Add Banner</button>
    </div>

    <div v-if="loading" class="admin-card p-8 text-center">
      <div class="animate-spin w-8 h-8 border-3 border-blue-200 border-t-blue-600 rounded-full mx-auto"></div>
    </div>

    <div v-else-if="banners.length === 0" class="admin-card text-center py-12">
      <p class="text-gray-400">No banners yet</p>
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div v-for="banner in banners" :key="banner._id" class="admin-card overflow-hidden">
        <img :src="banner.imageUrl" :alt="banner.title" class="w-full h-40 object-cover rounded-lg mb-3 bg-gray-100" />
        <div class="flex items-start justify-between">
          <div>
            <h3 class="font-semibold text-gray-900">{{ banner.title }}</h3>
            <p class="text-xs text-gray-500 mt-1">Page: {{ banner.page }} · Position: {{ banner.position }}</p>
            <span :class="banner.isActive ? 'text-green-500' : 'text-red-500'" class="text-xs">{{ banner.isActive ? 'Active' : 'Inactive' }}</span>
          </div>
          <div class="flex gap-2">
            <button @click="editBanner(banner)" class="text-xs text-blue-600 hover:text-blue-800">Edit</button>
            <button @click="deleteBanner(banner._id)" class="text-xs text-red-500 hover:text-red-700">Delete</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal -->
    <div v-if="showModal" class="fixed inset-0 z-50 flex items-center justify-center p-4" @click.self="showModal = false">
      <div class="fixed inset-0 bg-black/50"></div>
      <div class="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6">
        <h2 class="text-lg font-bold mb-4">{{ editing ? 'Edit Banner' : 'Add Banner' }}</h2>
        <form @submit.prevent="saveBanner" class="space-y-4">
          <div>
            <label class="admin-label">Title</label>
            <input v-model="form.title" class="admin-input" required />
          </div>
          <div>
            <label class="admin-label">Image URL</label>
            <input v-model="form.imageUrl" class="admin-input" required />
          </div>
          <div>
            <label class="admin-label">Link URL</label>
            <input v-model="form.linkUrl" class="admin-input" />
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="admin-label">Page</label>
              <select v-model="form.page" class="admin-input">
                <option value="home">Home</option>
                <option value="shop">Shop</option>
                <option value="all">All</option>
              </select>
            </div>
            <div>
              <label class="admin-label">Position</label>
              <select v-model="form.position" class="admin-input">
                <option value="hero">Hero</option>
                <option value="sidebar">Sidebar</option>
                <option value="bottom">Bottom</option>
              </select>
            </div>
          </div>
          <div class="flex gap-3">
            <button type="submit" class="admin-btn-primary flex-1">Save</button>
            <button type="button" @click="showModal = false" class="admin-btn-secondary flex-1">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { bannerAPI } from '@/api/services';
import { useToast } from 'vue-toastification';

const toast = useToast();
const loading = ref(true);
const banners = ref([]);
const showModal = ref(false);
const editing = ref(null);
const form = ref({ title: '', imageUrl: '', linkUrl: '', page: 'home', position: 'hero', isActive: true });

const fetchBanners = async () => {
  try { const res = await bannerAPI.getAll(); banners.value = res.data || []; }
  catch (e) { toast.error('Failed'); } finally { loading.value = false; }
};

const openCreate = () => { editing.value = null; form.value = { title: '', imageUrl: '', linkUrl: '', page: 'home', position: 'hero', isActive: true }; showModal.value = true; };
const editBanner = (b) => { editing.value = b._id; form.value = { ...b }; showModal.value = true; };

const saveBanner = async () => {
  try {
    if (editing.value) { await bannerAPI.update(editing.value, form.value); toast.success('Updated'); }
    else { await bannerAPI.create(form.value); toast.success('Created'); }
    showModal.value = false; fetchBanners();
  } catch (e) { toast.error('Save failed'); }
};

const deleteBanner = async (id) => {
  if (!confirm('Delete?')) return;
  try { await bannerAPI.delete(id); toast.success('Deleted'); fetchBanners(); }
  catch (e) { toast.error('Failed'); }
};

onMounted(fetchBanners);
</script>
