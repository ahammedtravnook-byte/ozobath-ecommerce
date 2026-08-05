<!--
  Recent orders table. Rows link into the order detail; the action column
  offers the next step for that status rather than a generic "view".
-->
<template>
  <section class="db-card">
    <header class="flex items-baseline justify-between gap-3 mb-3">
      <div>
        <h2 class="db-title">{{ title }}</h2>
        <p v-if="subtitle" class="db-sub">{{ subtitle }}</p>
      </div>
      <router-link :to="to" class="text-[12.5px] text-[#12596E] hover:underline whitespace-nowrap">
        View all →
      </router-link>
    </header>

    <div v-if="loading" class="space-y-3">
      <div v-for="n in 5" :key="n" class="flex items-center gap-3 py-2">
        <div class="flex-1 space-y-1.5">
          <div class="dt-skel h-3.5 w-28" />
          <div class="dt-skel h-2.5 w-20" />
        </div>
        <div class="dt-skel h-3.5 w-16" />
        <div class="dt-skel h-5 w-20 rounded-md" />
      </div>
    </div>

    <p v-else-if="!rows.length" class="text-[13px] text-slate-400 py-6 text-center">
      No orders yet.
    </p>

    <table v-else class="w-full">
      <thead>
        <tr>
          <th class="text-left text-[10px] font-medium tracking-[0.09em] uppercase text-slate-400 pb-2 border-b border-slate-200">Order</th>
          <th class="text-left text-[10px] font-medium tracking-[0.09em] uppercase text-slate-400 pb-2 border-b border-slate-200">Customer</th>
          <th class="text-right text-[10px] font-medium tracking-[0.09em] uppercase text-slate-400 pb-2 border-b border-slate-200">Value</th>
          <th class="text-right text-[10px] font-medium tracking-[0.09em] uppercase text-slate-400 pb-2 border-b border-slate-200">Status</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="row in rows"
          :key="row._id"
          class="border-b border-slate-100 last:border-0 hover:bg-slate-50/70 cursor-pointer transition-colors"
          @click="$router.push(`/orders/${row._id}`)"
        >
          <td class="py-2.5">
            <div class="text-[12.5px] text-slate-900 tabular-nums">{{ row.orderNumber || '—' }}</div>
            <div class="text-[11.5px] text-slate-400">{{ formatDate(row.createdAt) }}</div>
          </td>
          <td class="py-2.5">
            <div class="text-[13px] text-slate-700 truncate max-w-[160px]">{{ row.user?.name || 'Guest' }}</div>
            <div v-if="row.shippingAddress?.city" class="text-[11.5px] text-slate-400">{{ row.shippingAddress.city }}</div>
          </td>
          <td class="py-2.5 text-right db-num text-[13px] font-medium">{{ inr(row.total) }}</td>
          <td class="py-2.5 text-right">
            <StatusBadge :status="row.status" />
          </td>
        </tr>
      </tbody>
    </table>
  </section>
</template>

<script setup>
import { computed } from 'vue';
import StatusBadge from '@/components/ui/StatusBadge.vue';

const props = defineProps({
  title: { type: String, default: 'Recent orders' },
  subtitle: { type: String, default: '' },
  data: { type: Array, default: () => [] },
  to: { type: String, default: '/orders' },
  loading: { type: Boolean, default: false },
});

const rows = computed(() => props.data || []);

const inr = (n) => `₹${Math.round(Number(n) || 0).toLocaleString('en-IN')}`;

const formatDate = (d) =>
  d
    ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })
    : '—';
</script>
