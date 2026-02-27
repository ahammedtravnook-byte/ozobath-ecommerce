<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold text-gray-900">Dynamic Content Manager</h1>
      <button @click="showCreateModal = true" class="admin-btn-primary">+ Add Section</button>
    </div>

    <!-- Page Filter -->
    <div class="admin-card mb-6">
      <div class="flex flex-wrap gap-2">
        <button
          v-for="p in pages"
          :key="p"
          @click="selectedPage = p"
          :class="[
            'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
            selectedPage === p ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          ]"
        >
          {{ p }}
        </button>
      </div>
    </div>

    <!-- Content Sections -->
    <div v-if="loading" class="space-y-4">
      <div v-for="i in 3" :key="i" class="admin-card animate-pulse">
        <div class="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
        <div class="h-3 bg-gray-200 rounded w-2/3"></div>
      </div>
    </div>

    <div v-else-if="filteredContent.length === 0" class="admin-card text-center py-12">
      <p class="text-gray-400 text-lg">No content sections for "{{ selectedPage }}"</p>
      <button @click="showCreateModal = true" class="admin-btn-primary mt-4">Create First Section</button>
    </div>

    <div v-else class="space-y-4">
      <div
        v-for="(item, i) in filteredContent"
        :key="item._id"
        class="admin-card"
      >
        <div class="flex items-start justify-between">
          <div class="flex-1">
            <div class="flex items-center gap-3 mb-2">
              <span class="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full font-medium">{{ item.section }}</span>
              <span class="text-xs text-gray-400">Order: {{ item.order }}</span>
              <span :class="item.isActive ? 'text-green-500' : 'text-red-500'" class="text-xs font-medium">
                {{ item.isActive ? '● Active' : '○ Inactive' }}
              </span>
            </div>
            <h3 class="text-base font-semibold text-gray-900">{{ item.title || item.section }}</h3>
            <p v-if="item.subtitle" class="text-sm text-gray-500 mt-1">{{ item.subtitle }}</p>
            <div v-if="item.data && Object.keys(item.data).length > 0" class="mt-2">
              <pre class="text-xs text-gray-400 bg-gray-50 rounded p-2 max-h-24 overflow-auto">{{ JSON.stringify(item.data, null, 2) }}</pre>
            </div>
          </div>
          <div class="flex items-center gap-2 ml-4">
            <button @click="editItem(item)" class="px-3 py-1.5 text-xs bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">Edit</button>
            <button @click="deleteItem(item._id)" class="px-3 py-1.5 text-xs bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors">Delete</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Create/Edit Modal -->
    <div v-if="showCreateModal" class="fixed inset-0 z-50 flex items-center justify-center p-4" @click.self="closeModal">
      <div class="fixed inset-0 bg-black/50" @click="closeModal"></div>
      <div class="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6">
        <h2 class="text-lg font-bold text-gray-900 mb-4">{{ editingItem ? 'Edit Section' : 'Create New Section' }}</h2>

        <form @submit.prevent="saveContent" class="space-y-4">
          <div>
            <label class="admin-label">Page</label>
            <select v-model="form.page" class="admin-input" required>
              <option v-for="p in pages" :key="p" :value="p">{{ p }}</option>
            </select>
          </div>
          <div>
            <label class="admin-label">Section Key</label>
            <input v-model="form.section" class="admin-input" placeholder="e.g. hero_banner, category_tiles" required />
          </div>
          <div>
            <label class="admin-label">Title</label>
            <input v-model="form.title" class="admin-input" placeholder="Section title" />
          </div>
          <div>
            <label class="admin-label">Subtitle</label>
            <input v-model="form.subtitle" class="admin-input" placeholder="Section subtitle" />
          </div>
          <div>
            <label class="admin-label">Data (JSON)</label>
            <textarea v-model="form.dataJson" class="admin-input h-32 font-mono text-xs" placeholder='{"key": "value"}'></textarea>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="admin-label">Order</label>
              <input v-model.number="form.order" type="number" class="admin-input" />
            </div>
            <div>
              <label class="admin-label">Status</label>
              <select v-model="form.isActive" class="admin-input">
                <option :value="true">Active</option>
                <option :value="false">Inactive</option>
              </select>
            </div>
          </div>

          <div class="flex gap-3 pt-2">
            <button type="submit" class="admin-btn-primary flex-1" :disabled="saving">{{ saving ? 'Saving...' : 'Save' }}</button>
            <button type="button" @click="closeModal" class="admin-btn-secondary flex-1">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { contentAPI } from '@/api/services';
import { useToast } from 'vue-toastification';

const toast = useToast();
const loading = ref(true);
const saving = ref(false);
const content = ref([]);
const showCreateModal = ref(false);
const editingItem = ref(null);
const selectedPage = ref('home');

const pages = ['home', 'about', 'contact', 'shop', 'product', 'faq', 'blog', 'experience-centre'];

const form = ref({
  page: 'home', section: '', title: '', subtitle: '',
  dataJson: '', order: 1, isActive: true,
});

const filteredContent = computed(() =>
  content.value.filter((c) => c.page === selectedPage.value).sort((a, b) => a.order - b.order)
);

const fetchContent = async () => {
  try {
    loading.value = true;
    const res = await contentAPI.getAll();
    content.value = res.data || [];
  } catch (err) {
    toast.error('Failed to load content');
  } finally {
    loading.value = false;
  }
};

const editItem = (item) => {
  editingItem.value = item;
  form.value = {
    page: item.page, section: item.section,
    title: item.title || '', subtitle: item.subtitle || '',
    dataJson: item.data ? JSON.stringify(item.data, null, 2) : '',
    order: item.order || 1, isActive: item.isActive,
  };
  showCreateModal.value = true;
};

const closeModal = () => {
  showCreateModal.value = false;
  editingItem.value = null;
  form.value = { page: selectedPage.value, section: '', title: '', subtitle: '', dataJson: '', order: 1, isActive: true };
};

const saveContent = async () => {
  try {
    saving.value = true;
    const payload = { ...form.value };
    if (payload.dataJson) {
      try { payload.data = JSON.parse(payload.dataJson); } catch (e) { toast.error('Invalid JSON data'); return; }
    }
    delete payload.dataJson;

    if (editingItem.value) {
      await contentAPI.update(editingItem.value._id, payload);
      toast.success('Content updated');
    } else {
      await contentAPI.create(payload);
      toast.success('Content created');
    }
    closeModal();
    fetchContent();
  } catch (err) {
    toast.error(err.message || 'Save failed');
  } finally {
    saving.value = false;
  }
};

const deleteItem = async (id) => {
  if (!confirm('Delete this content section?')) return;
  try {
    await contentAPI.delete(id);
    toast.success('Content deleted');
    fetchContent();
  } catch (err) {
    toast.error('Delete failed');
  }
};

onMounted(fetchContent);
</script>
