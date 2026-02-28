<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold text-gray-900">Blog Posts</h1>
      <button @click="showModal = true; resetForm()" class="admin-btn-primary">+ New Post</button>
    </div>

    <div class="admin-card overflow-hidden">
      <div v-if="loading" class="p-8 text-center"><div class="animate-spin w-8 h-8 border-3 border-blue-200 border-t-blue-600 rounded-full mx-auto"></div></div>
      <div v-else-if="blogs.length === 0" class="p-12 text-center"><p class="text-gray-400 text-lg">No blog posts yet</p></div>
      <table v-else class="w-full">
        <thead class="bg-gray-50 border-b border-gray-100">
          <tr>
            <th class="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">Title</th>
            <th class="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">Category</th>
            <th class="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">Views</th>
            <th class="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">Status</th>
            <th class="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">Date</th>
            <th class="text-right text-xs font-medium text-gray-500 uppercase px-4 py-3">Actions</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-50">
          <tr v-for="blog in blogs" :key="blog._id" class="hover:bg-gray-50 transition-colors">
            <td class="px-4 py-3">
              <div class="flex items-center gap-3">
                <img :src="blog.featuredImage?.url || '/placeholder.jpg'" class="w-12 h-8 rounded object-cover bg-gray-100" />
                <p class="text-sm font-medium text-gray-900 truncate max-w-[250px]">{{ blog.title }}</p>
              </div>
            </td>
            <td class="px-4 py-3 text-sm text-gray-600">{{ blog.category || '—' }}</td>
            <td class="px-4 py-3 text-sm text-gray-600">{{ blog.views || 0 }}</td>
            <td class="px-4 py-3">
              <span :class="blog.isPublished ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'" class="text-xs px-2 py-0.5 rounded-full font-medium">
                {{ blog.isPublished ? 'Published' : 'Draft' }}
              </span>
            </td>
            <td class="px-4 py-3 text-xs text-gray-500">{{ new Date(blog.createdAt).toLocaleDateString() }}</td>
            <td class="px-4 py-3 text-right">
              <button @click="editBlog(blog)" class="text-xs text-blue-600 hover:text-blue-800 mr-3">Edit</button>
              <button @click="deleteBlog(blog._id)" class="text-xs text-red-500 hover:text-red-700">Delete</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Create/Edit Modal -->
    <div v-if="showModal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div class="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
          <h2 class="text-lg font-bold text-gray-900">{{ editingId ? 'Edit' : 'Create' }} Blog Post</h2>
          <button @click="showModal = false" class="text-gray-400 hover:text-gray-600 text-xl">×</button>
        </div>
        <div class="p-6 space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input v-model="form.title" class="admin-input w-full" placeholder="Enter blog title" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <input v-model="form.category" class="admin-input w-full" placeholder="e.g. Tips, Guides, News" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Excerpt</label>
            <textarea v-model="form.excerpt" rows="2" class="admin-input w-full" placeholder="Short description..."></textarea>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Content (HTML or Markdown)</label>
            <textarea v-model="form.content" rows="10" class="admin-input w-full font-mono text-sm" placeholder="Write your blog content..."></textarea>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Tags (comma separated)</label>
            <input v-model="form.tagsStr" class="admin-input w-full" placeholder="shower, bathroom, tips" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Upload Featured Image</label>
            <div class="flex items-center gap-3">
              <input type="file" accept="image/*" @change="handleFileUpload" class="admin-input flex-1 p-1.5" :disabled="uploadingImage" />
              <span v-if="uploadingImage" class="text-sm text-blue-600 animate-pulse">Uploading...</span>
            </div>
            <p v-if="form.featuredImageUrl" class="text-xs text-green-600 mt-1 truncate">Current: {{ form.featuredImageUrl }}</p>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">SEO Meta Description</label>
            <textarea v-model="form.metaDescription" rows="2" class="admin-input w-full" placeholder="SEO description..."></textarea>
          </div>
          <label class="flex items-center gap-2 text-sm">
            <input v-model="form.isPublished" type="checkbox" class="w-4 h-4 rounded border-gray-300" />
            <span>Publish immediately</span>
          </label>
        </div>
        <div class="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
          <button @click="showModal = false" class="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">Cancel</button>
          <button @click="saveBlog" class="admin-btn-primary" :disabled="saving">{{ saving ? 'Saving...' : 'Save' }}</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { blogAPI, uploadAPI } from '@/api/services';
import { useToast } from 'vue-toastification';

const toast = useToast();
const loading = ref(true);
const saving = ref(false);
const showModal = ref(false);
const blogs = ref([]);
const editingId = ref(null);
const form = ref({ title: '', category: '', excerpt: '', content: '', tagsStr: '', featuredImageUrl: '', metaDescription: '', isPublished: false });
const uploadingImage = ref(false);

const handleFileUpload = async (event) => {
  const file = event.target.files[0];
  if (!file) return;
  try {
    uploadingImage.value = true;
    const res = await uploadAPI.uploadImage(file);
    form.value.featuredImageUrl = res.data.url;
    toast.success('Image uploaded!');
  } catch (error) {
    toast.error('Image upload failed');
  } finally {
    uploadingImage.value = false;
  }
};

const resetForm = () => { editingId.value = null; form.value = { title: '', category: '', excerpt: '', content: '', tagsStr: '', featuredImageUrl: '', metaDescription: '', isPublished: false }; };

const fetchBlogs = async () => {
  try { loading.value = true; const res = await blogAPI.getAll(); blogs.value = res.data || []; } catch (e) { toast.error('Failed to load blogs'); } finally { loading.value = false; }
};

const editBlog = (b) => {
  editingId.value = b._id;
  form.value = { ...b, tagsStr: (b.tags || []).join(', '), featuredImageUrl: b.featuredImage?.url || '' };
  showModal.value = true;
};

const saveBlog = async () => {
  try {
    saving.value = true;
    const data = { ...form.value, tags: form.value.tagsStr.split(',').map(t => t.trim()).filter(Boolean), featuredImage: form.value.featuredImageUrl ? { url: form.value.featuredImageUrl } : undefined };
    delete data.tagsStr; delete data.featuredImageUrl;
    if (editingId.value) { await blogAPI.update(editingId.value, data); toast.success('Blog updated'); }
    else { await blogAPI.create(data); toast.success('Blog created'); }
    showModal.value = false; fetchBlogs();
  } catch (e) { toast.error(e.message || 'Failed to save'); } finally { saving.value = false; }
};

const deleteBlog = async (id) => {
  if (!confirm('Delete this blog post?')) return;
  try { await blogAPI.delete(id); toast.success('Blog deleted'); fetchBlogs(); } catch (e) { toast.error('Failed to delete'); }
};

onMounted(fetchBlogs);
</script>
