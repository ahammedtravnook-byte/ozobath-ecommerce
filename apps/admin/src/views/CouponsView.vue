<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold text-gray-900">Coupons</h1>
      <button @click="showModal = true; resetForm()" class="admin-btn-primary">+ Create Coupon</button>
    </div>

    <div class="admin-card overflow-hidden">
      <div v-if="loading" class="p-8 text-center">
        <div class="animate-spin w-8 h-8 border-3 border-blue-200 border-t-blue-600 rounded-full mx-auto"></div>
      </div>
      <div v-else-if="coupons.length === 0" class="p-12 text-center">
        <p class="text-gray-400 text-lg">No coupons yet</p>
      </div>
      <table v-else class="w-full">
        <thead class="bg-gray-50 border-b border-gray-100">
          <tr>
            <th class="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">Code</th>
            <th class="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">Type</th>
            <th class="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">Value</th>
            <th class="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">Usage</th>
            <th class="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">Validity</th>
            <th class="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">Status</th>
            <th class="text-right text-xs font-medium text-gray-500 uppercase px-4 py-3">Actions</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-50">
          <tr v-for="c in coupons" :key="c._id" class="hover:bg-gray-50 transition-colors">
            <td class="px-4 py-3 font-mono text-sm font-semibold text-blue-600">{{ c.code }}</td>
            <td class="px-4 py-3 text-sm text-gray-600 capitalize">{{ c.type }}</td>
            <td class="px-4 py-3 text-sm font-semibold">{{ c.type === 'percentage' ? c.value + '%' : '₹' + c.value }}</td>
            <td class="px-4 py-3 text-sm text-gray-600">{{ c.usedCount || 0 }} / {{ c.usageLimit || '∞' }}</td>
            <td class="px-4 py-3 text-xs text-gray-500">{{ formatDate(c.startDate) }} – {{ formatDate(c.endDate) }}</td>
            <td class="px-4 py-3">
              <span :class="c.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'" class="text-xs px-2 py-0.5 rounded-full font-medium">
                {{ c.isActive ? 'Active' : 'Inactive' }}
              </span>
            </td>
            <td class="px-4 py-3 text-right">
              <button @click="editCoupon(c)" class="text-xs text-blue-600 hover:text-blue-800 mr-3">Edit</button>
              <button @click="deleteCoupon(c._id)" class="text-xs text-red-500 hover:text-red-700">Delete</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Modal -->
    <div v-if="showModal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div class="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
          <h2 class="text-lg font-bold text-gray-900">{{ editingId ? 'Edit' : 'Create' }} Coupon</h2>
          <button @click="showModal = false" class="text-gray-400 hover:text-gray-600 text-xl">×</button>
        </div>
        <div class="p-6 space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Code</label>
            <input v-model="form.code" class="admin-input w-full uppercase" placeholder="e.g. SUMMER20" />
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select v-model="form.type" class="admin-input w-full">
                <option value="percentage">Percentage (%)</option>
                <option value="flat">Flat (₹)</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Value</label>
              <input v-model.number="form.value" type="number" class="admin-input w-full" placeholder="e.g. 20" />
            </div>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Min Order (₹)</label>
              <input v-model.number="form.minOrderAmount" type="number" class="admin-input w-full" />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Max Discount (₹)</label>
              <input v-model.number="form.maxDiscount" type="number" class="admin-input w-full" />
            </div>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Usage Limit</label>
              <input v-model.number="form.usageLimit" type="number" class="admin-input w-full" />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Per User Limit</label>
              <input v-model.number="form.perUserLimit" type="number" class="admin-input w-full" />
            </div>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input v-model="form.startDate" type="date" class="admin-input w-full" />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <input v-model="form.endDate" type="date" class="admin-input w-full" />
            </div>
          </div>
          <label class="flex items-center gap-2 text-sm">
            <input v-model="form.isActive" type="checkbox" class="w-4 h-4 rounded border-gray-300" />
            <span>Active</span>
          </label>
        </div>
        <div class="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
          <button @click="showModal = false" class="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">Cancel</button>
          <button @click="saveCoupon" class="admin-btn-primary" :disabled="saving">{{ saving ? 'Saving...' : 'Save' }}</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { couponAPI } from '@/api/services';
import { useToast } from 'vue-toastification';

const toast = useToast();
const loading = ref(true);
const saving = ref(false);
const showModal = ref(false);
const coupons = ref([]);
const editingId = ref(null);
const form = ref({ code: '', type: 'percentage', value: 10, minOrderAmount: 0, maxDiscount: 0, usageLimit: 100, perUserLimit: 1, startDate: '', endDate: '', isActive: true });

const resetForm = () => {
  editingId.value = null;
  form.value = { code: '', type: 'percentage', value: 10, minOrderAmount: 0, maxDiscount: 0, usageLimit: 100, perUserLimit: 1, startDate: '', endDate: '', isActive: true };
};

const formatDate = (d) => d ? new Date(d).toLocaleDateString() : '—';

const fetchCoupons = async () => {
  try { loading.value = true; const res = await couponAPI.getAll(); coupons.value = res.data || []; } catch (e) { toast.error('Failed to load coupons'); } finally { loading.value = false; }
};

const editCoupon = (c) => {
  editingId.value = c._id;
  form.value = { ...c, startDate: c.startDate?.slice(0,10), endDate: c.endDate?.slice(0,10) };
  showModal.value = true;
};

const saveCoupon = async () => {
  try {
    saving.value = true;
    if (editingId.value) { await couponAPI.update(editingId.value, form.value); toast.success('Coupon updated'); }
    else { await couponAPI.create(form.value); toast.success('Coupon created'); }
    showModal.value = false; fetchCoupons();
  } catch (e) { toast.error(e.message || 'Failed to save'); } finally { saving.value = false; }
};

const deleteCoupon = async (id) => {
  if (!confirm('Delete this coupon?')) return;
  try { await couponAPI.delete(id); toast.success('Coupon deleted'); fetchCoupons(); } catch (e) { toast.error('Failed to delete'); }
};

onMounted(fetchCoupons);
</script>
