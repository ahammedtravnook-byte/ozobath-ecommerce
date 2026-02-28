<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold text-gray-900">Newsletter Subscribers</h1>
      <div class="flex items-center gap-3">
        <p class="text-sm text-gray-500">{{ subscribers.length }} subscribers</p>
        <button @click="exportCSV" class="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium">Export CSV</button>
      </div>
    </div>
    <div class="admin-card mb-6">
      <input v-model="searchQuery" class="admin-input max-w-xs" placeholder="Search by email..." />
    </div>
    <div class="admin-card overflow-hidden">
      <div v-if="loading" class="p-8 text-center"><div class="animate-spin w-8 h-8 border-3 border-blue-200 border-t-blue-600 rounded-full mx-auto"></div></div>
      <div v-else-if="filtered.length === 0" class="p-12 text-center"><p class="text-gray-400 text-lg">No subscribers</p></div>
      <table v-else class="w-full">
        <thead class="bg-gray-50 border-b border-gray-100">
          <tr>
            <th class="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">#</th>
            <th class="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">Email</th>
            <th class="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">Subscribed</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-50">
          <tr v-for="(s, i) in filtered" :key="s._id" class="hover:bg-gray-50">
            <td class="px-4 py-3 text-sm text-gray-400">{{ i + 1 }}</td>
            <td class="px-4 py-3 text-sm text-gray-900">{{ s.email }}</td>
            <td class="px-4 py-3 text-xs text-gray-500">{{ new Date(s.subscribedAt || s.createdAt).toLocaleDateString() }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
<script setup>
import { ref, computed, onMounted } from 'vue';
import { newsletterAPI } from '@/api/services';
import { useToast } from 'vue-toastification';
const toast = useToast();
const loading = ref(true); const subscribers = ref([]); const searchQuery = ref('');
const filtered = computed(() => { if (!searchQuery.value) return subscribers.value; return subscribers.value.filter(s => s.email?.toLowerCase().includes(searchQuery.value.toLowerCase())); });
const fetchSubscribers = async () => { try { loading.value = true; const res = await newsletterAPI.getSubscribers(); subscribers.value = res.data || []; } catch (e) { toast.error('Failed to load'); } finally { loading.value = false; } };
const exportCSV = () => {
  const csv = 'Email,Subscribed Date\n' + subscribers.value.map(s => `${s.email},${new Date(s.subscribedAt || s.createdAt).toLocaleDateString()}`).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' }); const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = 'subscribers.csv'; a.click(); URL.revokeObjectURL(url);
  toast.success('CSV exported');
};
onMounted(fetchSubscribers);
</script>
