<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold text-gray-900">Reviews</h1>
      <div class="flex gap-2">
        <select v-model="statusFilter" @change="fetchReviews" class="admin-input text-sm">
          <option value="">All Reviews</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
        </select>
      </div>
    </div>

    <div class="admin-card overflow-hidden">
      <div v-if="loading" class="p-8 text-center">
        <div class="animate-spin w-8 h-8 border-3 border-blue-200 border-t-blue-600 rounded-full mx-auto"></div>
      </div>
      <div v-else-if="reviews.length === 0" class="p-12 text-center">
        <p class="text-gray-400 text-lg">No reviews found</p>
      </div>
      <div v-else class="divide-y divide-gray-50">
        <div v-for="review in reviews" :key="review._id" class="p-4 hover:bg-gray-50 transition-colors">
          <div class="flex items-start justify-between gap-4">
            <div class="flex-1">
              <div class="flex items-center gap-3 mb-2">
                <span class="text-sm font-semibold text-gray-900">{{ review.user?.name || 'Anonymous' }}</span>
                <span class="text-yellow-500 text-sm">{{ '★'.repeat(review.rating) }}{{ '☆'.repeat(5 - review.rating) }}</span>
                <span :class="review.isApproved ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'" class="text-xs px-2 py-0.5 rounded-full font-medium">
                  {{ review.isApproved ? 'Approved' : 'Pending' }}
                </span>
              </div>
              <p class="text-sm text-gray-600 mb-1"><strong>Product:</strong> {{ review.product?.name }}</p>
              <p v-if="review.title" class="text-sm font-medium text-gray-800">{{ review.title }}</p>
              <p class="text-sm text-gray-500">{{ review.comment }}</p>
              <p class="text-xs text-gray-400 mt-1">{{ new Date(review.createdAt).toLocaleDateString() }}</p>
            </div>
            <div class="flex items-center gap-2 shrink-0">
              <button v-if="!review.isApproved" @click="approveReview(review._id, true)" class="px-3 py-1.5 text-xs bg-green-50 text-green-700 hover:bg-green-100 rounded-lg font-medium">Approve</button>
              <button v-else @click="approveReview(review._id, false)" class="px-3 py-1.5 text-xs bg-yellow-50 text-yellow-700 hover:bg-yellow-100 rounded-lg font-medium">Unapprove</button>
              <button @click="deleteReview(review._id)" class="px-3 py-1.5 text-xs bg-red-50 text-red-600 hover:bg-red-100 rounded-lg font-medium">Delete</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { reviewAPI } from '@/api/services';
import { useToast } from 'vue-toastification';

const toast = useToast();
const loading = ref(true);
const reviews = ref([]);
const statusFilter = ref('');

const fetchReviews = async () => {
  try { loading.value = true; const res = await reviewAPI.getAll({ status: statusFilter.value }); reviews.value = res.data || []; } catch (e) { toast.error('Failed to load reviews'); } finally { loading.value = false; }
};

const approveReview = async (id, isApproved) => {
  try { await reviewAPI.approve(id, isApproved); toast.success(isApproved ? 'Review approved' : 'Review unapproved'); fetchReviews(); } catch (e) { toast.error('Failed to update review'); }
};

const deleteReview = async (id) => {
  if (!confirm('Delete this review?')) return;
  try { await reviewAPI.delete(id); toast.success('Review deleted'); fetchReviews(); } catch (e) { toast.error('Failed to delete'); }
};

onMounted(fetchReviews);
</script>
