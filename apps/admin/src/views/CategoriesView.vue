<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold text-gray-900">Categories</h1>
      <button @click="openCreate" class="admin-btn-primary">+ Add Category</button>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div v-for="cat in categories" :key="cat._id" class="admin-card">
        <div class="flex items-center gap-3 mb-3">
          <img v-if="cat.image" :src="cat.image" class="w-12 h-12 rounded-lg object-cover bg-gray-100" />
          <div class="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 font-bold" v-else>{{ cat.name?.charAt(0) }}</div>
          <div>
            <h3 class="font-semibold text-gray-900">{{ cat.name }}</h3>
            <p class="text-xs text-gray-400">{{ cat.productCount || 0 }} products</p>
          </div>
        </div>
        <p v-if="cat.description" class="text-sm text-gray-500 mb-3 line-clamp-2">{{ cat.description }}</p>
        <div class="flex items-center justify-between pt-2 border-t border-gray-50">
          <span :class="cat.isActive ? 'text-green-500' : 'text-red-500'" class="text-xs">{{ cat.isActive ? 'Active' : 'Inactive' }}</span>
          <div class="flex gap-2">
            <button @click="editCat(cat)" class="text-xs text-blue-600 hover:text-blue-800">Edit</button>
            <button @click="deleteCat(cat._id)" class="text-xs text-red-500 hover:text-red-700">Delete</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal -->
    <div v-if="showModal" class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div class="fixed inset-0 bg-black/50" @click="showModal = false"></div>
      <div class="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
        <h2 class="text-lg font-bold mb-4">{{ editing ? 'Edit' : 'Add' }} Category</h2>
        <form @submit.prevent="saveCat" class="space-y-4">
          <div><label class="admin-label">Name</label><input v-model="form.name" class="admin-input" required /></div>
          <div><label class="admin-label">Description</label><textarea v-model="form.description" class="admin-input h-20"></textarea></div>
          <div>
            <label class="admin-label">Upload Image</label>
            <div class="flex items-center gap-3">
              <input type="file" accept="image/*" @change="handleFileUpload" class="admin-input flex-1 p-1.5" :disabled="uploadingImage" />
              <span v-if="uploadingImage" class="text-sm text-blue-600 animate-pulse">Uploading...</span>
            </div>
            <p v-if="form.image" class="text-xs text-green-600 mt-1 truncate">Current: {{ form.image }}</p>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div><label class="admin-label">Order</label><input v-model.number="form.order" type="number" class="admin-input" /></div>
            <div><label class="admin-label">Status</label><select v-model="form.isActive" class="admin-input"><option :value="true">Active</option><option :value="false">Inactive</option></select></div>
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
import { categoryAPI, uploadAPI } from '@/api/services';
import { useToast } from 'vue-toastification';

const toast = useToast();
const categories = ref([]);
const showModal = ref(false);
const editing = ref(null);
const form = ref({ name: '', description: '', image: '', order: 0, isActive: true });
const uploadingImage = ref(false);

const handleFileUpload = async (event) => {
  const file = event.target.files[0];
  if (!file) return;
  try {
    uploadingImage.value = true;
    const res = await uploadAPI.uploadImage(file);
    form.value.image = res.data.url;
    toast.success('Image uploaded!');
  } catch (error) {
    toast.error('Image upload failed');
  } finally {
    uploadingImage.value = false;
  }
};

const fetchCats = async () => {
  try { const res = await categoryAPI.getAll(); categories.value = res.data || []; }
  catch (e) { toast.error('Failed'); }
};

const openCreate = () => { editing.value = null; form.value = { name: '', description: '', image: '', order: 0, isActive: true }; showModal.value = true; };
const editCat = (c) => { editing.value = c._id; form.value = { ...c }; showModal.value = true; };

const saveCat = async () => {
  try {
    if (editing.value) { await categoryAPI.update(editing.value, form.value); toast.success('Updated'); }
    else { await categoryAPI.create(form.value); toast.success('Created'); }
    showModal.value = false; fetchCats();
  } catch (e) { toast.error(e.message || 'Failed'); }
};

const deleteCat = async (id) => {
  if (!confirm('Delete this category?')) return;
  try { await categoryAPI.delete(id); toast.success('Deleted'); fetchCats(); }
  catch (e) { toast.error(e.message || 'Cannot delete — has linked products'); }
};

onMounted(fetchCats);
</script>
