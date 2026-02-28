<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold text-gray-900">FAQs</h1>
      <button @click="showModal = true; resetForm()" class="admin-btn-primary">+ Add FAQ</button>
    </div>
    <div class="admin-card overflow-hidden">
      <div v-if="loading" class="p-8 text-center"><div class="animate-spin w-8 h-8 border-3 border-blue-200 border-t-blue-600 rounded-full mx-auto"></div></div>
      <div v-else-if="faqs.length === 0" class="p-12 text-center"><p class="text-gray-400 text-lg">No FAQs yet</p></div>
      <div v-else class="divide-y divide-gray-50">
        <div v-for="(faq, i) in faqs" :key="faq._id" class="p-4 hover:bg-gray-50 transition-colors flex items-center justify-between">
          <div class="flex-1">
            <div class="flex items-center gap-2">
              <span class="text-xs text-gray-400 w-6">{{ i + 1 }}.</span>
              <p class="text-sm font-medium text-gray-900">{{ faq.question }}</p>
            </div>
            <p class="text-sm text-gray-500 ml-8 mt-1 line-clamp-2">{{ faq.answer }}</p>
            <span v-if="faq.category" class="ml-8 text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded mt-1 inline-block">{{ faq.category }}</span>
          </div>
          <div class="flex items-center gap-2 shrink-0 ml-4">
            <button @click="editFaq(faq)" class="text-xs text-blue-600 hover:text-blue-800">Edit</button>
            <button @click="deleteFaq(faq._id)" class="text-xs text-red-500 hover:text-red-700">Delete</button>
          </div>
        </div>
      </div>
    </div>
    <div v-if="showModal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div class="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
          <h2 class="text-lg font-bold text-gray-900">{{ editingId ? 'Edit' : 'Add' }} FAQ</h2>
          <button @click="showModal = false" class="text-gray-400 hover:text-gray-600 text-xl">×</button>
        </div>
        <div class="p-6 space-y-4">
          <div><label class="block text-sm font-medium text-gray-700 mb-1">Question</label><input v-model="form.question" class="admin-input w-full" /></div>
          <div><label class="block text-sm font-medium text-gray-700 mb-1">Answer</label><textarea v-model="form.answer" rows="4" class="admin-input w-full"></textarea></div>
          <div><label class="block text-sm font-medium text-gray-700 mb-1">Category</label><input v-model="form.category" class="admin-input w-full" placeholder="e.g. Shipping, Returns" /></div>
          <div><label class="block text-sm font-medium text-gray-700 mb-1">Order</label><input v-model.number="form.order" type="number" class="admin-input w-full" /></div>
          <label class="flex items-center gap-2 text-sm"><input v-model="form.isActive" type="checkbox" class="w-4 h-4 rounded border-gray-300" /><span>Active</span></label>
        </div>
        <div class="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
          <button @click="showModal = false" class="px-4 py-2 text-sm text-gray-600">Cancel</button>
          <button @click="saveFaq" class="admin-btn-primary" :disabled="saving">{{ saving ? 'Saving...' : 'Save' }}</button>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup>
import { ref, onMounted } from 'vue';
import { faqAPI } from '@/api/services';
import { useToast } from 'vue-toastification';
const toast = useToast();
const loading = ref(true); const saving = ref(false); const showModal = ref(false); const faqs = ref([]); const editingId = ref(null);
const form = ref({ question: '', answer: '', category: '', order: 0, isActive: true });
const resetForm = () => { editingId.value = null; form.value = { question: '', answer: '', category: '', order: 0, isActive: true }; };
const fetchFaqs = async () => { try { loading.value = true; const res = await faqAPI.getAll(); faqs.value = res.data || []; } catch (e) { toast.error('Failed to load FAQs'); } finally { loading.value = false; } };
const editFaq = (f) => { editingId.value = f._id; form.value = { ...f }; showModal.value = true; };
const saveFaq = async () => { try { saving.value = true; if (editingId.value) { await faqAPI.update(editingId.value, form.value); toast.success('FAQ updated'); } else { await faqAPI.create(form.value); toast.success('FAQ created'); } showModal.value = false; fetchFaqs(); } catch (e) { toast.error(e.message || 'Failed to save'); } finally { saving.value = false; } };
const deleteFaq = async (id) => { if (!confirm('Delete this FAQ?')) return; try { await faqAPI.delete(id); toast.success('FAQ deleted'); fetchFaqs(); } catch (e) { toast.error('Failed to delete'); } };
onMounted(fetchFaqs);
</script>
