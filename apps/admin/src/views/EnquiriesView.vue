<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold text-gray-900">B2B Enquiries</h1>
      <select v-model="statusFilter" @change="fetchEnquiries" class="admin-input text-sm">
        <option value="">All Status</option>
        <option value="new">New</option>
        <option value="contacted">Contacted</option>
        <option value="converted">Converted</option>
        <option value="closed">Closed</option>
      </select>
    </div>
    <div class="admin-card overflow-hidden">
      <div v-if="loading" class="p-8 text-center"><div class="animate-spin w-8 h-8 border-3 border-blue-200 border-t-blue-600 rounded-full mx-auto"></div></div>
      <div v-else-if="enquiries.length === 0" class="p-12 text-center"><p class="text-gray-400 text-lg">No enquiries</p></div>
      <div v-else class="divide-y divide-gray-50">
        <div v-for="e in enquiries" :key="e._id" class="p-4 hover:bg-gray-50 transition-colors">
          <div class="flex items-start justify-between gap-4">
            <div class="flex-1">
              <div class="flex items-center gap-3 mb-1">
                <p class="text-sm font-semibold text-gray-900">{{ e.companyName || e.contactName }}</p>
                <span :class="statusClass(e.status)" class="text-xs px-2 py-0.5 rounded-full font-medium capitalize">{{ e.status }}</span>
              </div>
              <p class="text-sm text-gray-600">{{ e.contactName }} · {{ e.email }} · {{ e.phone }}</p>
              <p class="text-sm text-gray-500 mt-1">{{ e.message }}</p>
              <p class="text-xs text-gray-400 mt-1">{{ new Date(e.createdAt).toLocaleDateString() }}</p>
            </div>
            <div class="shrink-0">
              <select :value="e.status" @change="updateStatus(e._id, $event.target.value)" class="admin-input text-xs">
                <option value="new">New</option>
                <option value="contacted">Contacted</option>
                <option value="converted">Converted</option>
                <option value="closed">Closed</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup>
import { ref, onMounted } from 'vue';
import { enquiryAPI } from '@/api/services';
import { useToast } from 'vue-toastification';
const toast = useToast();
const loading = ref(true); const enquiries = ref([]); const statusFilter = ref('');
const statusClass = (s) => ({ new: 'bg-blue-100 text-blue-700', contacted: 'bg-yellow-100 text-yellow-700', converted: 'bg-green-100 text-green-700', closed: 'bg-gray-100 text-gray-500' }[s] || 'bg-gray-100 text-gray-500');
const fetchEnquiries = async () => { try { loading.value = true; const res = await enquiryAPI.getAll({ status: statusFilter.value }); enquiries.value = res.data || []; } catch (e) { toast.error('Failed to load'); } finally { loading.value = false; } };
const updateStatus = async (id, status) => { try { await enquiryAPI.update(id, { status }); toast.success('Status updated'); fetchEnquiries(); } catch (e) { toast.error('Failed to update'); } };
onMounted(fetchEnquiries);
</script>
