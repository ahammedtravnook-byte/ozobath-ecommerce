<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Reviews</h1>
        <p class="text-sm text-gray-400 mt-0.5">{{ reviews.length }} review{{ reviews.length !== 1 ? 's' : '' }} {{ statusFilter ? `(${statusFilter})` : 'total' }}</p>
      </div>
      <div class="flex gap-2">
        <button
          v-for="opt in filterOptions" :key="opt.value"
          @click="statusFilter = opt.value; fetchReviews()"
          :class="statusFilter === opt.value
            ? 'bg-dark-900 text-white'
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'"
          class="px-4 py-2 rounded-xl text-sm font-semibold transition-colors"
        >
          {{ opt.label }}
          <span v-if="opt.value === '' && pendingCount > 0" class="ml-1.5 w-5 h-5 bg-red-500 text-white text-[10px] rounded-full inline-flex items-center justify-center font-bold">
            {{ pendingCount }}
          </span>
        </button>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="admin-card p-8 text-center">
      <div class="animate-spin w-8 h-8 border-3 border-blue-200 border-t-blue-600 rounded-full mx-auto"></div>
    </div>

    <!-- Empty -->
    <div v-else-if="reviews.length === 0" class="admin-card text-center py-16">
      <div class="text-5xl mb-3">⭐</div>
      <p class="text-gray-400 text-lg">No reviews found</p>
      <p v-if="statusFilter" class="text-gray-300 text-sm mt-1">Try switching the filter above</p>
    </div>

    <!-- Reviews list -->
    <div v-else class="space-y-3">
      <div
        v-for="review in reviews"
        :key="review._id"
        class="admin-card hover:shadow-md transition-shadow"
      >
        <div class="flex items-start gap-4">
          <!-- Avatar -->
          <div class="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-bold text-sm shrink-0">
            {{ (review.user?.name || 'A')[0].toUpperCase() }}
          </div>

          <!-- Content -->
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 flex-wrap mb-1">
              <span class="text-sm font-bold text-gray-900">{{ review.user?.name || 'Anonymous' }}</span>
              <span class="text-xs text-gray-400">{{ review.user?.email }}</span>
              <!-- Star rating -->
              <span class="text-amber-400 text-sm">
                {{ '★'.repeat(review.rating) }}<span class="text-gray-200">{{ '★'.repeat(5 - review.rating) }}</span>
              </span>
              <span :class="review.isApproved ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'"
                class="text-xs px-2.5 py-0.5 rounded-full font-semibold">
                {{ review.isApproved ? '✓ Approved' : '⏳ Pending' }}
              </span>
              <span v-if="review.isVerifiedPurchase" class="text-xs bg-blue-50 text-blue-600 px-2.5 py-0.5 rounded-full font-semibold">
                ✓ Verified Purchase
              </span>
            </div>

            <!-- Product -->
            <p class="text-xs text-blue-600 font-semibold mb-2 truncate">
              📦 {{ review.product?.name || 'Unknown Product' }}
            </p>

            <!-- Review text -->
            <div class="bg-gray-50 rounded-xl p-3 mb-2">
              <p v-if="review.title" class="text-sm font-semibold text-gray-800 mb-1">{{ review.title }}</p>
              <p class="text-sm text-gray-600 leading-relaxed">{{ review.comment }}</p>
            </div>

            <p class="text-xs text-gray-400">{{ new Date(review.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) }}</p>
          </div>

          <!-- Actions -->
          <div class="flex flex-col gap-2 shrink-0">
            <button
              v-if="!review.isApproved"
              @click="approveReview(review._id, true)"
              class="px-3 py-1.5 text-xs bg-green-50 text-green-700 hover:bg-green-100 rounded-xl font-semibold transition-colors whitespace-nowrap"
            >
              ✓ Approve
            </button>
            <button
              v-else
              @click="approveReview(review._id, false)"
              class="px-3 py-1.5 text-xs bg-amber-50 text-amber-600 hover:bg-amber-100 rounded-xl font-semibold transition-colors whitespace-nowrap"
            >
              ↩ Unapprove
            </button>
            <button
              @click="deleteReview(review._id)"
              class="px-3 py-1.5 text-xs bg-red-50 text-red-600 hover:bg-red-100 rounded-xl font-semibold transition-colors"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { reviewAPI } from '@/api/services';
import { useToast } from 'vue-toastification';

const toast = useToast();
const loading = ref(true);
const reviews = ref([]);
const statusFilter = ref('');

const filterOptions = [
  { value: '', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
];

const pendingCount = computed(() => reviews.value.filter(r => !r.isApproved).length);

const fetchReviews = async () => {
  try {
    loading.value = true;
    const params = {};
    if (statusFilter.value) params.status = statusFilter.value;
    const res = await reviewAPI.getAll(params);
    reviews.value = res.data || [];
  } catch {
    toast.error('Failed to load reviews');
  } finally {
    loading.value = false;
  }
};

const approveReview = async (id, isApproved) => {
  try {
    await reviewAPI.approve(id, isApproved);
    toast.success(isApproved ? 'Review approved and published!' : 'Review unapproved');
    fetchReviews();
  } catch {
    toast.error('Failed to update review');
  }
};

const deleteReview = async (id) => {
  if (!confirm('Delete this review permanently?')) return;
  try {
    await reviewAPI.delete(id);
    toast.success('Review deleted');
    fetchReviews();
  } catch {
    toast.error('Failed to delete');
  }
};

onMounted(fetchReviews);
</script>
