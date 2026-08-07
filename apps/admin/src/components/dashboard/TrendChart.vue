<!--
  Primary trend chart: current period against the previous one.

  Hand-drawn SVG rather than Chart.js. The dependency was declared but never
  imported anywhere in this app, and pulling in ~70KB plus a canvas renderer
  to draw two polylines and four gridlines is not a trade worth making. This
  scales with the viewport, prints, and stays crisp on any DPI.

  Metric switching is driven by the panel config, so adding a series is a
  registry change.
-->
<template>
  <section class="db-card">
    <header class="flex items-start justify-between gap-3 mb-4">
      <div>
        <h2 class="db-title">{{ activeMetric.label }} over time</h2>
        <p class="db-sub">{{ subtitle }}</p>
      </div>

      <div class="flex items-center gap-2">
        <div v-if="metrics.length > 1" class="flex gap-0.5 bg-slate-100 rounded-lg p-[3px]">
          <button
            v-for="m in metrics"
            :key="m.key"
            type="button"
            class="px-2.5 py-1 rounded-md text-[11.5px] transition-colors"
            :class="m.key === active ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'"
            :aria-pressed="m.key === active"
            @click="active = m.key"
          >
            {{ m.label }}
          </button>
        </div>

        <button
          type="button"
          class="dt-btn h-8 px-2.5 text-[12px]"
          :class="compare ? 'bg-slate-900 border-slate-900 text-white hover:bg-slate-800' : ''"
          :aria-pressed="compare"
          @click="compare = !compare"
        >
          Compare
        </button>
      </div>
    </header>

    <div v-if="loading" class="dt-skel h-[260px] w-full rounded-lg" />

    <div v-else-if="!hasData" class="dt-empty h-[260px]">
      <p class="text-[14px] font-medium text-slate-900">No activity in this period</p>
      <p class="text-[13px] text-slate-500 mt-1">Try a longer date range.</p>
    </div>

    <template v-else>
      <svg
        :viewBox="`0 0 ${W} ${H}`"
        preserveAspectRatio="none"
        class="w-full h-[260px]"
        role="img"
        :aria-label="`${activeMetric.label} per day for the selected period${compare ? ', compared with the previous period' : ''}`"
      >
        <!-- Gridlines + y labels -->
        <g v-for="(g, i) in gridLines" :key="`g-${i}`">
          <line :x1="PL" :x2="W - PR" :y1="g.y" :y2="g.y" stroke="#E3E8EE" stroke-width="1" vector-effect="non-scaling-stroke" />
          <text :x="PL" :y="g.y - 5" fill="#8B96A5" font-size="10">{{ g.label }}</text>
        </g>

        <!-- Previous period -->
        <path
          v-if="compare && previousPath"
          :d="previousPath"
          fill="none"
          stroke="#CFD7E0"
          stroke-width="2"
          stroke-dasharray="5 4"
          vector-effect="non-scaling-stroke"
          stroke-linejoin="round"
        />

        <!-- Current period -->
        <path v-if="areaPath" :d="areaPath" fill="#12596E" fill-opacity="0.06" />
        <path
          v-if="currentPath"
          :d="currentPath"
          fill="none"
          stroke="#12596E"
          stroke-width="2.25"
          vector-effect="non-scaling-stroke"
          stroke-linejoin="round"
          stroke-linecap="round"
        />
        <circle v-if="lastPoint" :cx="lastPoint.x" :cy="lastPoint.y" r="3.5" fill="#12596E" />

        <!-- X labels -->
        <text
          v-for="(l, i) in xLabels"
          :key="`x-${i}`"
          :x="l.x"
          :y="H - 8"
          fill="#8B96A5"
          font-size="10"
          :text-anchor="l.anchor"
        >{{ l.label }}</text>
      </svg>

      <div class="flex gap-4 mt-3 text-[12px] text-slate-500">
        <span class="inline-flex items-center gap-2">
          <i class="inline-block w-4 border-t-2 border-[#12596E]" />Selected period
        </span>
        <span v-if="compare" class="inline-flex items-center gap-2">
          <i class="inline-block w-4 border-t-2 border-dashed border-slate-300" />Previous period
        </span>
      </div>
    </template>
  </section>
</template>

<script setup>
import { ref, computed } from 'vue';

const props = defineProps({
  series: { type: Object, default: () => ({ current: [], previous: [] }) },
  metrics: { type: Array, default: () => [{ key: 'revenue', label: 'Revenue', format: (v) => v }] },
  subtitle: { type: String, default: '' },
  loading: { type: Boolean, default: false },
});

const W = 900;
const H = 260;
const PT = 18;
const PB = 30;
const PL = 8;
const PR = 8;

const active = ref(props.metrics[0]?.key || 'revenue');
const compare = ref(true);

const activeMetric = computed(
  () => props.metrics.find((m) => m.key === active.value) || props.metrics[0] || { key: 'revenue', label: 'Revenue', format: (v) => v }
);

const currentValues = computed(() => (props.series?.current || []).map((d) => Number(d[active.value]) || 0));
const previousValues = computed(() => (props.series?.previous || []).map((d) => Number(d[active.value]) || 0));

// An all-zero series is real data (a quiet period) but has nothing to plot;
// treat it as empty so the chart does not draw a flat line along the axis.
const hasData = computed(() => currentValues.value.some((v) => v > 0) || previousValues.value.some((v) => v > 0));

const bounds = computed(() => {
  const all = compare.value ? [...currentValues.value, ...previousValues.value] : currentValues.value;
  if (!all.length) return { min: 0, max: 1 };
  let min = Math.min(...all);
  let max = Math.max(...all);
  const pad = (max - min) * 0.15 || Math.max(1, max * 0.15);
  min = Math.max(0, min - pad);
  max += pad;
  return { min, max: max === min ? min + 1 : max };
});

const toPath = (values) => {
  if (values.length < 2) return '';
  const { min, max } = bounds.value;
  const iw = W - PL - PR;
  const ih = H - PT - PB;
  return values
    .map((v, i) => {
      const x = PL + (iw * i) / (values.length - 1);
      const y = PT + ih - ((v - min) / (max - min)) * ih;
      return `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(' ');
};

const currentPath = computed(() => toPath(currentValues.value));
const previousPath = computed(() => toPath(previousValues.value));

const areaPath = computed(() =>
  currentPath.value ? `${currentPath.value} L ${W - PR} ${H - PB} L ${PL} ${H - PB} Z` : ''
);

const lastPoint = computed(() => {
  const vals = currentValues.value;
  if (vals.length < 2) return null;
  const { min, max } = bounds.value;
  const ih = H - PT - PB;
  return {
    x: W - PR,
    y: PT + ih - ((vals[vals.length - 1] - min) / (max - min)) * ih,
  };
});

const gridLines = computed(() => {
  const { min, max } = bounds.value;
  const ih = H - PT - PB;
  const fmt = activeMetric.value.format || ((v) => Math.round(v));
  return [0, 1, 2, 3].map((g) => ({
    y: PT + (ih * g) / 3,
    label: fmt(max - ((max - min) * g) / 3),
  }));
});

const xLabels = computed(() => {
  const days = props.series?.current || [];
  if (days.length < 2) return [];
  const pick = [0, Math.floor(days.length / 3), Math.floor((days.length * 2) / 3), days.length - 1];
  const iw = W - PL - PR;
  return pick.map((idx, i) => ({
    x: PL + (iw * idx) / (days.length - 1),
    label: new Date(days[idx].date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
    anchor: i === 0 ? 'start' : i === 3 ? 'end' : 'middle',
  }));
});
</script>
