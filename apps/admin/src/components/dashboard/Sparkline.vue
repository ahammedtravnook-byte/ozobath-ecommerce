<!--
  Inline trend line for a KPI tile.

  Hand-drawn SVG rather than a chart library: this renders once per tile and
  needs no axes, tooltips or interaction. Mounting a Chart.js instance per
  tile would cost a canvas and a resize observer each for a 64×22 decoration.
-->
<template>
  <svg
    v-if="path"
    :viewBox="`0 0 ${W} ${H}`"
    class="overflow-visible"
    :width="W"
    :height="H"
    aria-hidden="true"
    focusable="false"
  >
    <path :d="path" fill="none" :stroke="stroke" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round" />
    <circle v-if="last" :cx="last.x" :cy="last.y" r="1.75" :fill="stroke" />
  </svg>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  points: { type: Array, default: () => [] },
  color: { type: String, default: '#CBD5E1' },
});

const W = 64;
const H = 22;

const coords = computed(() => {
  const values = props.points.map(Number).filter((n) => Number.isFinite(n));
  if (values.length < 2) return [];

  const min = Math.min(...values);
  const max = Math.max(...values);
  // A flat series has no range to scale against; draw it down the middle
  // rather than dividing by zero.
  const span = max - min || 1;

  return values.map((v, i) => ({
    x: (W * i) / (values.length - 1),
    // 1px inset top and bottom so the stroke is not clipped at the extremes.
    y: H - 1 - ((v - min) / span) * (H - 2),
  }));
});

const path = computed(() =>
  coords.value.length
    ? coords.value.map((p, i) => `${i ? 'L' : 'M'}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ')
    : ''
);

const last = computed(() => coords.value[coords.value.length - 1] || null);
const stroke = computed(() => props.color);
</script>
