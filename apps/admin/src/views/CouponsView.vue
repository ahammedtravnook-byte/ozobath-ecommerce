<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold text-gray-900">Coupons</h1>
      <div class="flex items-center gap-3">
        <!-- Toggle between List and Analytics -->
        <div class="flex rounded-lg border border-gray-200 overflow-hidden">
          <button
            @click="showAnalytics = false"
            :class="!showAnalytics ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'"
            class="px-4 py-2 text-sm font-medium transition-colors"
          >
            Coupons List
          </button>
          <button
            @click="showAnalytics = true; fetchAnalytics()"
            :class="showAnalytics ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'"
            class="px-4 py-2 text-sm font-medium transition-colors border-l border-gray-200"
          >
            Analytics
          </button>
        </div>
        <button v-if="!showAnalytics" @click="showModal = true; resetForm()" class="admin-btn-primary">+ Create Coupon</button>
      </div>
    </div>

    <!-- ── COUPONS LIST VIEW ── -->
    <div v-if="!showAnalytics" class="admin-card overflow-hidden">
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

    <!-- ── ANALYTICS VIEW ── -->
    <div v-else>
      <!-- Loading -->
      <div v-if="analyticsLoading" class="admin-card p-8 text-center">
        <div class="animate-spin w-8 h-8 border-3 border-blue-200 border-t-blue-600 rounded-full mx-auto mb-3"></div>
        <p class="text-sm text-gray-400">Loading analytics...</p>
      </div>

      <!-- Empty -->
      <div v-else-if="analytics.length === 0" class="admin-card p-12 text-center">
        <p class="text-gray-400 text-lg">No analytics data available</p>
        <p class="text-gray-400 text-sm mt-1">Analytics appear once coupons have been used in orders.</p>
      </div>

      <!-- Analytics Table -->
      <div v-else class="admin-card overflow-x-auto">
        <div class="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
          <h2 class="text-sm font-bold text-gray-900">Coupon Performance</h2>
          <p class="text-xs text-gray-400">{{ analytics.length }} coupon{{ analytics.length !== 1 ? 's' : '' }}</p>
        </div>
        <table class="w-full min-w-[900px]">
          <thead class="bg-gray-50 border-b border-gray-100">
            <tr>
              <th class="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">Code</th>
              <th class="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">Type</th>
              <th class="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">Value</th>
              <th class="text-right text-xs font-medium text-gray-500 uppercase px-4 py-3">Orders Used</th>
              <th class="text-right text-xs font-medium text-gray-500 uppercase px-4 py-3">Revenue Generated</th>
              <th class="text-right text-xs font-medium text-gray-500 uppercase px-4 py-3">Discount Given</th>
              <th class="text-right text-xs font-medium text-gray-500 uppercase px-4 py-3">Usage Rate</th>
              <th class="text-center text-xs font-medium text-gray-500 uppercase px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-50">
            <tr v-for="a in analytics" :key="a._id || a.code" class="hover:bg-gray-50 transition-colors">
              <td class="px-4 py-3 font-mono text-sm font-semibold text-blue-600">{{ a.code }}</td>
              <td class="px-4 py-3 text-sm text-gray-600 capitalize">{{ a.type }}</td>
              <td class="px-4 py-3 text-sm font-semibold text-gray-800">
                {{ a.type === 'percentage' ? a.value + '%' : '₹' + a.value }}
              </td>
              <td class="px-4 py-3 text-sm text-gray-900 font-semibold text-right">
                {{ (a.totalOrders ?? a.usedCount ?? 0).toLocaleString() }}
              </td>
              <td class="px-4 py-3 text-sm font-semibold text-green-700 text-right">
                ₹{{ (a.totalRevenue ?? 0).toLocaleString() }}
              </td>
              <td class="px-4 py-3 text-sm font-semibold text-red-500 text-right">
                ₹{{ (a.totalDiscount ?? 0).toLocaleString() }}
              </td>
              <td class="px-4 py-3 text-right">
                <span v-if="!a.usageLimit" class="text-xs text-gray-400 italic">Unlimited</span>
                <span v-else class="text-sm font-semibold" :class="usageRateClass(a)">
                  {{ usageRate(a) }}%
                </span>
              </td>
              <td class="px-4 py-3 text-center">
                <span
                  :class="a.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'"
                  class="text-xs px-2 py-0.5 rounded-full font-medium"
                >
                  {{ a.isActive ? 'Active' : 'Inactive' }}
                </span>
              </td>
            </tr>
          </tbody>
          <!-- Summary footer -->
          <tfoot class="bg-gray-50 border-t border-gray-200">
            <tr>
              <td colspan="3" class="px-4 py-3 text-xs font-semibold text-gray-600 uppercase">Totals</td>
              <td class="px-4 py-3 text-sm font-bold text-gray-900 text-right">
                {{ analytics.reduce((s, a) => s + (a.totalOrders ?? a.usedCount ?? 0), 0).toLocaleString() }}
              </td>
              <td class="px-4 py-3 text-sm font-bold text-green-700 text-right">
                ₹{{ analytics.reduce((s, a) => s + (a.totalRevenue ?? 0), 0).toLocaleString() }}
              </td>
              <td class="px-4 py-3 text-sm font-bold text-red-500 text-right">
                ₹{{ analytics.reduce((s, a) => s + (a.totalDiscount ?? 0), 0).toLocaleString() }}
              </td>
              <td colspan="2"></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>

    <!-- ── CREATE / EDIT MODAL ── -->
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
                <option value="fixed">Flat (₹)</option>
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
import api from '@/api/axiosInstance';

const toast = useToast();
const loading = ref(true);
const saving = ref(false);
const showModal = ref(false);
const coupons = ref([]);
const editingId = ref(null);
const form = ref({ code: '', type: 'percentage', value: 10, minOrderAmount: 0, maxDiscount: 0, usageLimit: 100, perUserLimit: 1, startDate: '', endDate: '', isActive: true });

// Analytics state
const showAnalytics = ref(false);
const analytics = ref([]);
const analyticsLoading = ref(false);

const resetForm = () => {
  editingId.value = null;
  form.value = { code: '', type: 'percentage', value: 10, minOrderAmount: 0, maxDiscount: 0, usageLimit: 100, perUserLimit: 1, startDate: '', endDate: '', isActive: true };
};

const formatDate = (d) => d ? new Date(d).toLocaleDateString() : '—';

const fetchCoupons = async () => {
  try { loading.value = true; const res = await couponAPI.getAll(); coupons.value = res.data || []; } catch (e) { toast.error('Failed to load coupons'); } finally { loading.value = false; }
};

const fetchAnalytics = async () => {
  if (analyticsLoading.value) return;
  try {
    analyticsLoading.value = true;
    const res = await api.get('/coupons/analytics');
    analytics.value = res.data || res || [];
  } catch (e) {
    toast.error('Failed to load coupon analytics');
    analytics.value = [];
  } finally {
    analyticsLoading.value = false;
  }
};

const usageRate = (coupon) => {
  if (!coupon.usageLimit) return null;
  const used = coupon.totalOrders ?? coupon.usedCount ?? 0;
  return Math.round((used / coupon.usageLimit) * 100);
};

const usageRateClass = (coupon) => {
  const rate = usageRate(coupon);
  if (rate === null) return '';
  if (rate >= 90) return 'text-red-600';
  if (rate >= 60) return 'text-orange-500';
  return 'text-gray-700';
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
