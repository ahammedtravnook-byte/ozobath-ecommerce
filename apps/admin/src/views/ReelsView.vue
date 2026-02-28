<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold text-gray-900">Instagram Reels</h1>
      <button @click="showModal = true; resetForm()" class="admin-btn-primary">+ Add Reel</button>
    </div>
    <div class="admin-card overflow-hidden">
      <div v-if="loading" class="p-8 text-center"><div class="animate-spin w-8 h-8 border-3 border-blue-200 border-t-blue-600 rounded-full mx-auto"></div></div>
      <div v-else-if="reels.length === 0" class="p-12 text-center"><p class="text-gray-400 text-lg">No reels added yet</p></div>
      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
        <div v-for="reel in reels" :key="reel._id" class="border border-gray-100 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
          <div class="aspect-[9/16] max-h-48 bg-gray-100 relative">
            <img v-if="reel.thumbnailUrl?.url" :src="reel.thumbnailUrl.url" class="w-full h-full object-cover" />
            <div v-else class="w-full h-full flex items-center justify-center text-gray-300">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <span class="absolute top-2 right-2 text-xs px-2 py-0.5 rounded-full font-medium" :class="reel.isActive ? 'bg-green-500 text-white' : 'bg-gray-500 text-white'">{{ reel.isActive ? 'Active' : 'Inactive' }}</span>
          </div>
          <div class="p-3">
            <p class="text-sm font-semibold text-gray-900 truncate">{{ reel.title }}</p>
            <p class="text-xs text-gray-400 truncate">{{ reel.caption }}</p>
            <p class="text-xs text-gray-400 mt-1">Order: {{ reel.order }} · {{ (reel.linkedProducts || []).length }} products linked</p>
            <div class="mt-2 flex gap-2">
              <button @click="editReel(reel)" class="text-xs text-blue-600 hover:text-blue-800 font-medium">Edit</button>
              <a :href="reel.reelUrl" target="_blank" class="text-xs text-purple-600 hover:text-purple-800 font-medium">View ↗</a>
              <button @click="deleteReel(reel._id)" class="text-xs text-red-500 hover:text-red-700 font-medium">Delete</button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal -->
    <div v-if="showModal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div class="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
          <h2 class="text-lg font-bold text-gray-900">{{ editingId ? 'Edit' : 'Add' }} Reel</h2>
          <button @click="showModal = false" class="text-gray-400 hover:text-gray-600 text-xl">×</button>
        </div>
        <div class="p-6 space-y-4">
          <div><label class="block text-sm font-medium text-gray-700 mb-1">Title</label><input v-model="form.title" class="admin-input w-full" placeholder="Reel title" /></div>
          <div><label class="block text-sm font-medium text-gray-700 mb-1">Instagram Reel URL</label><input v-model="form.reelUrl" class="admin-input w-full" placeholder="https://www.instagram.com/reel/..." /></div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Upload Thumbnail</label>
            <div class="flex items-center gap-3">
              <input type="file" accept="image/*" @change="handleFileUpload" class="admin-input flex-1 p-1.5" :disabled="uploadingImage" />
              <span v-if="uploadingImage" class="text-sm text-blue-600 animate-pulse">Uploading...</span>
            </div>
            <p v-if="form.thumbnailUrlStr" class="text-xs text-green-600 mt-1 truncate">Current: {{ form.thumbnailUrlStr }}</p>
          </div>
          <div><label class="block text-sm font-medium text-gray-700 mb-1">Caption</label><textarea v-model="form.caption" rows="2" class="admin-input w-full"></textarea></div>
          <div><label class="block text-sm font-medium text-gray-700 mb-1">Display Order</label><input v-model.number="form.order" type="number" class="admin-input w-full" /></div>
          <label class="flex items-center gap-2 text-sm"><input v-model="form.isActive" type="checkbox" class="w-4 h-4 rounded border-gray-300" /><span>Active</span></label>
        </div>
        <div class="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
          <button @click="showModal = false" class="px-4 py-2 text-sm text-gray-600">Cancel</button>
          <button @click="saveReel" class="admin-btn-primary" :disabled="saving">{{ saving ? 'Saving...' : 'Save' }}</button>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup>
import { ref, onMounted } from 'vue';
import axios from 'axios';
import { useToast } from 'vue-toastification';
import { uploadAPI } from '@/api/services';

const API_URL = import.meta.env.VITE_API_URL || '/api/v1';
const toast = useToast();
const loading = ref(true); const saving = ref(false); const showModal = ref(false); const reels = ref([]); const editingId = ref(null);
const form = ref({ title: '', reelUrl: '', thumbnailUrlStr: '', caption: '', order: 0, isActive: true });
const uploadingImage = ref(false);

const handleFileUpload = async (event) => {
  const file = event.target.files[0];
  if (!file) return;
  try {
    uploadingImage.value = true;
    const res = await uploadAPI.uploadImage(file);
    form.value.thumbnailUrlStr = res.data.url;
    toast.success('Thumbnail uploaded!');
  } catch (error) {
    toast.error('Thumbnail upload failed');
  } finally {
    uploadingImage.value = false;
  }
};

const resetForm = () => { editingId.value = null; form.value = { title: '', reelUrl: '', thumbnailUrlStr: '', caption: '', order: 0, isActive: true }; };

const getHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem('adminAccessToken')}` });

const fetchReels = async () => {
  try { loading.value = true; const res = await axios.get(`${API_URL}/reels/admin/all`, { headers: getHeaders() }); reels.value = res.data?.data || []; } catch (e) { toast.error('Failed to load reels'); } finally { loading.value = false; }
};

const editReel = (r) => { editingId.value = r._id; form.value = { ...r, thumbnailUrlStr: r.thumbnailUrl?.url || '' }; showModal.value = true; };

const saveReel = async () => {
  try {
    saving.value = true;
    const data = { ...form.value, thumbnailUrl: form.value.thumbnailUrlStr ? { url: form.value.thumbnailUrlStr } : undefined };
    delete data.thumbnailUrlStr;
    if (editingId.value) { await axios.put(`${API_URL}/reels/${editingId.value}`, data, { headers: getHeaders() }); toast.success('Reel updated'); }
    else { await axios.post(`${API_URL}/reels`, data, { headers: getHeaders() }); toast.success('Reel created'); }
    showModal.value = false; fetchReels();
  } catch (e) { toast.error(e.response?.data?.message || 'Failed'); } finally { saving.value = false; }
};

const deleteReel = async (id) => {
  if (!confirm('Delete this reel?')) return;
  try { await axios.delete(`${API_URL}/reels/${id}`, { headers: getHeaders() }); toast.success('Reel deleted'); fetchReels(); } catch (e) { toast.error('Failed'); }
};

onMounted(fetchReels);
</script>
