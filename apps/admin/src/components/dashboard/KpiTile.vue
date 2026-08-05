<!--
  One KPI. Everything about it — label, formatting, whether up is good, where
  it links — comes from the METRICS registry, so this component never needs
  editing to add a metric.
-->
<template>
  <component
    :is="metric.to ? 'router-link' : 'div'"
    :to="metric.to"
    class="db-kpi no-underline"
    :class="metric.to ? 'cursor-pointer' : 'cursor-default'"
  >
    <span class="db-eyebrow">{{ metric.label }}</span>

    <div v-if="loading" class="dt-skel h-7 w-24 my-2" />
    <!-- title carries the exact figure when the tile shows a compact one, so
         ₹4.9L is still auditable on hover. -->
    <div v-else class="db-kpi-val" :title="exactTitle">{{ display }}</div>

    <div class="flex items-end justify-between gap-2">
      <span v-if="loading" class="dt-skel h-3.5 w-12" />
      <span v-else-if="deltaState === 'none'" class="db-delta db-delta-flat" :title="noBaselineHint">
        —
      </span>
      <span v-else class="db-delta" :class="deltaClass">
        <svg class="w-2.5 h-2.5" viewBox="0 0 10 10" fill="currentColor" aria-hidden="true">
          <path v-if="deltaState === 'up'" d="M5 1 9 8H1z" />
          <path v-else-if="deltaState === 'down'" d="M5 9 1 2h8z" />
          <rect v-else x="1" y="4.2" width="8" height="1.6" rx="0.8" />
        </svg>
        {{ deltaLabel }}
      </span>

      <Sparkline v-if="!loading && spark.length > 1" :points="spark" :color="sparkColor" />
    </div>
  </component>
</template>

<script setup>
import { computed } from 'vue';
import Sparkline from './Sparkline.vue';

const props = defineProps({
  metric: { type: Object, required: true },   // METRICS entry
  data: { type: Object, default: () => ({}) }, // { value, previous, change }
  spark: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
});

const display = computed(() => {
  const v = props.data?.value;
  if (v === null || v === undefined) return '—';
  return props.metric.format ? props.metric.format(v) : String(v);
});

// Only worth a tooltip when the tile is showing an abbreviated figure.
const exactTitle = computed(() => {
  const v = props.data?.value;
  if (v === null || v === undefined || !props.metric.exact) return props.metric.hint || '';
  const exact = props.metric.exact(v);
  return exact === display.value ? props.metric.hint || '' : exact;
});

const change = computed(() => props.data?.change);

// 'none' covers both a missing baseline (null) and a point-in-time metric with
// no previous period — neither should render as 0%.
const deltaState = computed(() => {
  const c = change.value;
  if (c === null || c === undefined) return 'none';
  if (Math.abs(c) < 0.05) return 'flat';
  return c > 0 ? 'up' : 'down';
});

const deltaLabel = computed(() => {
  const c = change.value;
  if (c === null || c === undefined) return '—';
  const abs = Math.abs(c);
  // Cap the display: a jump from 1 to 400 is "+39900%", which is noise.
  if (abs >= 999) return c > 0 ? '>999%' : '<-999%';
  return `${abs.toFixed(1)}%`;
});

// For inverted metrics (cancellations, discount cost, time to ship) a rise is
// bad, so the colour flips while the arrow still points at the direction.
const deltaClass = computed(() => {
  if (deltaState.value === 'flat') return 'db-delta-flat';
  const rising = deltaState.value === 'up';
  const good = props.metric.invert ? !rising : rising;
  return good ? 'db-delta-up' : 'db-delta-down';
});

const noBaselineHint = computed(() =>
  props.data?.previous === null ? 'No comparison for this metric' : 'No activity in the previous period'
);

const sparkColor = computed(() =>
  deltaState.value === 'none' || deltaState.value === 'flat' ? '#CBD5E1'
    : deltaClass.value === 'db-delta-up' ? '#A7D3C1' : '#E3B4B0'
);
</script>
