<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold text-gray-900">Testimonials</h1>
      <button @click="showModal = true; resetForm()" class="admin-btn-primary">+ Add Testimonial</button>
    </div>
    <div class="admin-card overflow-hidden">
      <div v-if="loading" class="p-8 text-center"><div class="animate-spin w-8 h-8 border-3 border-blue-200 border-t-blue-600 rounded-full mx-auto"></div></div>
      <div v-else-if="items.length === 0" class="p-12 text-center"><p class="text-gray-400 text-lg">No testimonials yet</p></div>
      <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
        <div v-for="t in items" :key="t._id" class="border border-gray-100 rounded-lg p-4 hover:shadow-sm transition-shadow">
          <div class="flex items-start gap-3 mb-3">
            <img :src="t.avatar?.url || '/placeholder.jpg'" class="w-10 h-10 rounded-full object-cover bg-gray-100" />
            <div class="flex-1">
              <p class="text-sm font-semibold text-gray-900">{{ t.customerName }}</p>
              <p class="text-xs text-gray-400">{{ t.designation || t.location }}</p>
            </div>
            <span class="text-yellow-500 text-sm">{{ '★'.repeat(t.rating || 5) }}</span>
          </div>
          <p class="text-sm text-gray-600 line-clamp-3">{{ t.content }}</p>
          <div class="mt-3 flex items-center justify-between">
            <span :class="t.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'" class="text-xs px-2 py-0.5 rounded-full font-medium">{{ t.isActive ? 'Active' : 'Inactive' }}</span>
            <div class="flex gap-2">
              <button @click="editItem(t)" class="text-xs text-blue-600 hover:text-blue-800">Edit</button>
              <button @click="deleteItem(t._id)" class="text-xs text-red-500 hover:text-red-700">Delete</button>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div v-if="showModal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div class="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
          <h2 class="text-lg font-bold text-gray-900">{{ editingId ? 'Edit' : 'Add' }} Testimonial</h2>
          <button @click="showModal = false" class="text-gray-400 hover:text-gray-600 text-xl">×</button>
        </div>
        <div class="p-6 space-y-4">
          <div><label class="block text-sm font-medium text-gray-700 mb-1">Customer Name</label><input v-model="form.customerName" class="admin-input w-full" /></div>
          <div><label class="block text-sm font-medium text-gray-700 mb-1">Designation / Location</label><input v-model="form.designation" class="admin-input w-full" /></div>
          <div><label class="block text-sm font-medium text-gray-700 mb-1">Content</label><textarea v-model="form.content" rows="4" class="admin-input w-full"></textarea></div>
          <div class="grid grid-cols-2 gap-4">
            <div><label class="block text-sm font-medium text-gray-700 mb-1">Rating (1-5)</label><input v-model.number="form.rating" type="number" min="1" max="5" class="admin-input w-full" /></div>
            <div><label class="block text-sm font-medium text-gray-700 mb-1">Order</label><input v-model.number="form.order" type="number" class="admin-input w-full" /></div>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Upload Avatar</label>
            <div class="flex items-center gap-3">
              <input type="file" accept="image/*" @change="handleFileUpload" class="admin-input flex-1 p-1.5" :disabled="uploadingImage" />
              <span v-if="uploadingImage" class="text-sm text-blue-600 animate-pulse">Uploading...</span>
            </div>
            <p v-if="form.avatarUrl" class="text-xs text-green-600 mt-1 truncate">Current: {{ form.avatarUrl }}</p>
          </div>
          <label class="flex items-center gap-2 text-sm"><input v-model="form.isActive" type="checkbox" class="w-4 h-4 rounded border-gray-300" /><span>Active</span></label>
        </div>
        <div class="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
          <button @click="showModal = false" class="px-4 py-2 text-sm text-gray-600">Cancel</button>
          <button @click="saveItem" class="admin-btn-primary" :disabled="saving">{{ saving ? 'Saving...' : 'Save' }}</button>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup>
import { ref, onMounted } from 'vue';
import { testimonialAPI, uploadAPI } from '@/api/services';
import { useToast } from 'vue-toastification';
const toast = useToast();
const loading = ref(true); const saving = ref(false); const showModal = ref(false); const items = ref([]); const editingId = ref(null);
const form = ref({ customerName: '', designation: '', content: '', rating: 5, order: 0, avatarUrl: '', isActive: true });
const uploadingImage = ref(false);

const handleFileUpload = async (event) => {
  const file = event.target.files[0];
  if (!file) return;
  try {
    uploadingImage.value = true;
    const res = await uploadAPI.uploadImage(file);
    form.value.avatarUrl = res.data.url;
    toast.success('Avatar uploaded!');
  } catch (error) {
    toast.error('Avatar upload failed');
  } finally {
    uploadingImage.value = false;
  }
};

const resetForm = () => { editingId.value = null; form.value = { customerName: '', designation: '', content: '', rating: 5, order: 0, avatarUrl: '', isActive: true }; };
const fetchItems = async () => { try { loading.value = true; const res = await testimonialAPI.getAll(); items.value = res.data || []; } catch (e) { toast.error('Failed to load'); } finally { loading.value = false; } };
const editItem = (t) => { editingId.value = t._id; form.value = { ...t, avatarUrl: t.avatar?.url || '' }; showModal.value = true; };
const saveItem = async () => { try { saving.value = true; const data = { ...form.value, avatar: form.value.avatarUrl ? { url: form.value.avatarUrl } : undefined }; delete data.avatarUrl; if (editingId.value) { await testimonialAPI.update(editingId.value, data); toast.success('Updated'); } else { await testimonialAPI.create(data); toast.success('Created'); } showModal.value = false; fetchItems(); } catch (e) { toast.error(e.message || 'Failed'); } finally { saving.value = false; } };
const deleteItem = async (id) => { if (!confirm('Delete?')) return; try { await testimonialAPI.delete(id); toast.success('Deleted'); fetchItems(); } catch (e) { toast.error('Failed'); } };
onMounted(fetchItems);
</script>
