<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold text-gray-900">Service Requests</h1>
      <select v-model="statusFilter" @change="fetchItems" class="admin-input text-sm">
        <option value="">All Status</option>
        <option value="new">New</option>
        <option value="in_progress">In Progress</option>
        <option value="resolved">Resolved</option>
        <option value="closed">Closed</option>
      </select>
    </div>
    <div class="admin-card overflow-hidden">
      <div v-if="loading" class="p-8 text-center"><div class="animate-spin w-8 h-8 border-3 border-blue-200 border-t-blue-600 rounded-full mx-auto"></div></div>
      <div v-else-if="items.length === 0" class="p-12 text-center"><p class="text-gray-400 text-lg">No service requests</p></div>
      <table v-else class="w-full">
        <thead class="bg-gray-50 border-b border-gray-100">
          <tr>
            <th class="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">Customer</th>
            <th class="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">Issue</th>
            <th class="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">Type</th>
            <th class="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">Date</th>
            <th class="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">Status</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-50">
          <tr v-for="sr in items" :key="sr._id" class="hover:bg-gray-50 transition-colors">
            <td class="px-4 py-3">
              <p class="text-sm font-medium text-gray-900">{{ sr.customerName }}</p>
              <p class="text-xs text-gray-400">{{ sr.email }} · {{ sr.phone }}</p>
            </td>
            <td class="px-4 py-3 text-sm text-gray-600 max-w-[300px] truncate">{{ sr.description || sr.issue }}</td>
            <td class="px-4 py-3 text-sm text-gray-600 capitalize">{{ sr.serviceType || '—' }}</td>
            <td class="px-4 py-3 text-xs text-gray-500">{{ new Date(sr.createdAt).toLocaleDateString() }}</td>
            <td class="px-4 py-3">
              <select :value="sr.status" @change="updateStatus(sr._id, $event.target.value)" class="admin-input text-xs py-1">
                <option value="new">New</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
<script setup>
import { ref, onMounted } from 'vue';
import { serviceRequestAPI } from '@/api/services';
import { useToast } from 'vue-toastification';
const toast = useToast();
const loading = ref(true); const items = ref([]); const statusFilter = ref('');
const fetchItems = async () => { try { loading.value = true; const res = await serviceRequestAPI.getAll({ status: statusFilter.value }); items.value = res.data || []; } catch (e) { toast.error('Failed to load'); } finally { loading.value = false; } };
const updateStatus = async (id, status) => { try { await serviceRequestAPI.update(id, { status }); toast.success('Updated'); fetchItems(); } catch (e) { toast.error('Failed'); } };
onMounted(fetchItems);
</script>
