<template>
  <div class="space-y-8 animate-fade-in-up">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 class="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">Customers</h1>
        <p class="text-xs sm:text-sm text-gray-400 mt-1 font-medium italic">Track user engagement and manage your growing community</p>
      </div>
      <div class="px-5 py-2.5 bg-blue-50 border border-blue-100 rounded-2xl">
        <p class="text-[10px] font-black text-blue-600 uppercase tracking-widest leading-none">Total Community</p>
        <p class="text-lg font-black text-blue-900 mt-1">{{ customers.length }} <span class="text-[10px] opacity-60">Verified Users</span></p>
      </div>
    </div>

    <!-- Smart Search -->
    <div class="admin-card p-6">
      <div class="relative max-w-md group">
        <span class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors text-lg">🔍</span>
        <input 
          v-model="searchQuery" 
          class="admin-input pl-12 h-14" 
          placeholder="Search by name or email address..." 
        />
      </div>
    </div>

    <!-- Data Container -->
    <div class="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden flex flex-col min-h-[400px]">
      <div v-if="loading" class="flex-1 flex items-center justify-center py-24">
        <div class="flex flex-col items-center gap-6">
          <div class="animate-spin w-12 h-12 border-4 border-blue-100 border-t-blue-600 rounded-full"></div>
          <p class="text-[10px] font-black text-gray-400 uppercase tracking-widest">Loading Directory...</p>
        </div>
      </div>

      <div v-else-if="filteredCustomers.length === 0" class="flex-1 flex flex-col items-center justify-center py-24 text-center px-6">
        <div class="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center text-5xl mb-8 shadow-inner">👤</div>
        <h4 class="text-base font-black text-gray-900 uppercase tracking-widest">No Matches Found</h4>
        <p class="text-sm text-gray-400 mt-2 max-w-xs font-medium italic">We couldn't find any customers matching your current search terms.</p>
      </div>

      <div v-else class="flex-1 flex flex-col">
        <!-- Desktop Table View -->
        <div class="hidden lg:block overflow-x-auto custom-scrollbar">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="bg-gray-50/50">
                <th class="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Customer Identity</th>
                <th class="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Contact Details</th>
                <th class="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Engagement</th>
                <th class="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Account Status</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-50">
              <tr v-for="c in filteredCustomers" :key="c._id" class="hover:bg-blue-50/10 transition-colors group">
                <td class="px-8 py-5">
                  <div class="flex items-center gap-4">
                    <div class="w-12 h-12 rounded-[1.25rem] bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-black text-lg shadow-lg shadow-blue-500/20 group-hover:scale-110 transition-transform">
                      {{ c.name?.[0]?.toUpperCase() }}
                    </div>
                    <div>
                      <p class="text-sm font-black text-gray-900 group-hover:text-blue-600 transition-colors">{{ c.name }}</p>
                      <p class="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">UID: {{ c._id.slice(-6).toUpperCase() }}</p>
                    </div>
                  </div>
                </td>
                <td class="px-8 py-5">
                  <p class="text-sm font-bold text-gray-700 leading-none">{{ c.email }}</p>
                  <p class="text-[10px] text-gray-400 mt-1.5 font-medium tracking-tight">{{ c.phone || 'No phone provided' }}</p>
                </td>
                <td class="px-8 py-5">
                  <p class="text-xs font-black text-gray-900 italic opacity-80">{{ new Date(c.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) }}</p>
                  <p class="text-[9px] text-gray-400 font-black uppercase tracking-tighter mt-1">Acquired Date</p>
                </td>
                <td class="px-8 py-5">
                  <span 
                    :class="c.isActive !== false ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-red-50 text-red-600 border-red-100'" 
                    class="text-[10px] px-3.5 py-1.5 rounded-xl font-black uppercase tracking-widest border shadow-sm"
                  >
                    {{ c.isActive !== false ? 'Verified active' : 'Inactive' }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Mobile Card Grid View -->
        <div class="lg:hidden p-4 space-y-4 bg-gray-50/30 overflow-y-auto max-h-[70vh] custom-scrollbar">
          <div v-for="c in filteredCustomers" :key="c._id" class="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden p-5 flex flex-col gap-4 animate-fade-in-up">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-4">
                <div class="w-12 h-12 rounded-[1.25rem] bg-blue-600 flex items-center justify-center text-white font-black text-lg">
                  {{ c.name?.[0]?.toUpperCase() }}
                </div>
                <div>
                  <h4 class="text-sm font-black text-gray-900 leading-none uppercase tracking-tight">{{ c.name }}</h4>
                  <p class="text-[9px] text-gray-400 font-black uppercase tracking-widest mt-1.5">MEMBER SINCE {{ new Date(c.createdAt).getFullYear() }}</p>
                </div>
              </div>
              <span 
                :class="c.isActive !== false ? 'text-emerald-500' : 'text-red-500'" 
                class="w-2.5 h-2.5 rounded-full bg-current shadow-[0_0_8px_0_rgba(0,0,0,0.1)]"
              ></span>
            </div>

            <div class="bg-gray-50 rounded-2xl p-4 space-y-3">
               <div>
                  <p class="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Email Connectivity</p>
                  <p class="text-[11px] font-bold text-gray-800 break-all">{{ c.email }}</p>
               </div>
               <div>
                  <p class="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Contact Number</p>
                  <p class="text-[11px] font-bold text-gray-800">{{ c.phone || '—' }}</p>
               </div>
            </div>

            <div class="flex items-center justify-between py-1 px-2 border-t border-gray-50 pt-3">
               <p class="text-[10px] font-bold text-gray-400">Status: <span :class="c.isActive !== false ? 'text-emerald-600' : 'text-red-600'" class="font-black uppercase tracking-widest ml-1">{{ c.isActive !== false ? 'Active' : 'Inactive' }}</span></p>
               <button class="text-[10px] font-black text-blue-600 uppercase tracking-widest">Profile ➜</button>
            </div>
          </div>
        </div>
      </div>
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
