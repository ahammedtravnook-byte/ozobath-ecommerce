<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold text-gray-900">Customers</h1>
      <p class="text-sm text-gray-500">{{ customers.length }} total customers</p>
    </div>
    <div class="admin-card mb-6">
      <input v-model="searchQuery" class="admin-input max-w-xs" placeholder="Search by name or email..." />
    </div>
    <div class="admin-card overflow-hidden">
      <div v-if="loading" class="p-8 text-center"><div class="animate-spin w-8 h-8 border-3 border-blue-200 border-t-blue-600 rounded-full mx-auto"></div></div>
      <div v-else-if="filteredCustomers.length === 0" class="p-12 text-center"><p class="text-gray-400 text-lg">No customers found</p></div>
      <table v-else class="w-full">
        <thead class="bg-gray-50 border-b border-gray-100">
          <tr>
            <th class="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">Customer</th>
            <th class="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">Email</th>
            <th class="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">Phone</th>
            <th class="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">Joined</th>
            <th class="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">Status</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-50">
          <tr v-for="c in filteredCustomers" :key="c._id" class="hover:bg-gray-50 transition-colors">
            <td class="px-4 py-3">
              <div class="flex items-center gap-3">
                <div class="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-sm font-bold text-blue-600">{{ c.name?.[0]?.toUpperCase() }}</div>
                <p class="text-sm font-medium text-gray-900">{{ c.name }}</p>
              </div>
            </td>
            <td class="px-4 py-3 text-sm text-gray-600">{{ c.email }}</td>
            <td class="px-4 py-3 text-sm text-gray-600">{{ c.phone || '—' }}</td>
            <td class="px-4 py-3 text-xs text-gray-500">{{ new Date(c.createdAt).toLocaleDateString() }}</td>
            <td class="px-4 py-3">
              <span :class="c.isActive !== false ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'" class="text-xs px-2 py-0.5 rounded-full font-medium">{{ c.isActive !== false ? 'Active' : 'Inactive' }}</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
<script setup>
import { ref, computed, onMounted } from 'vue';
import { analyticsAPI } from '@/api/services';
import { useToast } from 'vue-toastification';
const toast = useToast();
const loading = ref(true); const customers = ref([]); const searchQuery = ref('');
const filteredCustomers = computed(() => {
  if (!searchQuery.value) return customers.value;
  const q = searchQuery.value.toLowerCase();
  return customers.value.filter(c => c.name?.toLowerCase().includes(q) || c.email?.toLowerCase().includes(q));
});
const fetchCustomers = async () => { try { loading.value = true; const res = await analyticsAPI.getCustomers(); customers.value = res.data || []; } catch (e) { toast.error('Failed to load customers'); } finally { loading.value = false; } };
onMounted(fetchCustomers);
</script>
