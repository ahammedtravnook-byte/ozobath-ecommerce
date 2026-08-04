<!--
  Status pill with a shared colour vocabulary.

  Every view previously carried its own status->class map, so the same status
  could be styled differently on two screens. One map here keeps "delivered"
  the same green everywhere.
-->
<template>
  <span class="dt-badge" :class="toneClass">
    <span v-if="dot" class="w-1.5 h-1.5 rounded-full shrink-0" :class="dotClass" />
    {{ label || status }}
  </span>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  status: { type: String, default: '' },
  label: { type: String, default: '' },
  dot: { type: Boolean, default: false },
  // Bypass the map when a caller needs an explicit tone.
  tone: { type: String, default: '' },
});

// Semantic groups, not per-status entries: statuses across orders, enquiries,
// products and stock collapse into six meanings.
const TONES = {
  neutral: 'bg-slate-50 text-slate-600 border-slate-200',
  info: 'bg-blue-50 text-blue-700 border-blue-200',
  success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  warning: 'bg-amber-50 text-amber-700 border-amber-200',
  danger: 'bg-red-50 text-red-700 border-red-200',
  purple: 'bg-violet-50 text-violet-700 border-violet-200',
};

const DOTS = {
  neutral: 'bg-slate-400',
  info: 'bg-blue-500',
  success: 'bg-emerald-500',
  warning: 'bg-amber-500',
  danger: 'bg-red-500',
  purple: 'bg-violet-500',
};

const STATUS_TONE = {
  // Orders
  pending: 'warning',
  confirmed: 'info',
  processing: 'info',
  shipped: 'purple',
  delivered: 'success',
  cancelled: 'danger',
  returned: 'danger',
  // Payments
  paid: 'success',
  failed: 'danger',
  refunded: 'neutral',
  // Enquiries
  new: 'info',
  contacted: 'warning',
  'in-progress': 'purple',
  converted: 'success',
  closed: 'neutral',
  // Products / stock
  active: 'success',
  inactive: 'neutral',
  healthy: 'success',
  low: 'warning',
  out: 'danger',
  'out-of-stock': 'danger',
};

const resolvedTone = computed(
  () => props.tone || STATUS_TONE[String(props.status).toLowerCase()] || 'neutral'
);

const toneClass = computed(() => TONES[resolvedTone.value] || TONES.neutral);
const dotClass = computed(() => DOTS[resolvedTone.value] || DOTS.neutral);
</script>
