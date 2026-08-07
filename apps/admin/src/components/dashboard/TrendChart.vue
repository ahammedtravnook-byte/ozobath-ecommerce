<!--
  Primary trend chart: current period against the previous one.

  Built on Chart.js via vue-chartjs. The earlier version was hand-drawn SVG,
  which was fine for a static line but had no hit-testing — so there was no
  tooltip, no hover readout and no animation. Those need a renderer that
  tracks pointer position against data space, and reimplementing that is
  exactly the work a chart library exists to do.

  Chart.js over ApexCharts (15MB unpacked) and ECharts (60MB): it is the
  smallest of the three and registers piecemeal, so this pulls in the line
  controller, the two scales and the tooltip — not a general charting engine.

  Metric switching is driven by the panel config, so adding a series is a
  registry change.
-->
<template>
  <section class="db-card">
    <header class="flex items-start justify-between gap-3 mb-4">
      <div class="min-w-0">
        <h2 class="db-title">{{ activeMetric.label }} over time</h2>
        <p class="db-sub">{{ subtitle }}</p>
      </div>

      <div class="flex items-center gap-2 shrink-0">
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

    <!-- Headline for the visible window, so the period total is readable
         without hovering any single point. -->
    <div v-if="!loading && hasData" class="flex items-baseline gap-3 mb-3">
      <span class="text-[24px] font-semibold tabular-nums tracking-[-0.03em] text-slate-900">
        {{ activeMetric.format(periodTotal) }}
      </span>
      <span v-if="periodChange !== null" class="db-delta" :class="periodChange >= 0 ? 'db-delta-up' : 'db-delta-down'">
        <svg class="w-2.5 h-2.5" viewBox="0 0 10 10" fill="currentColor" aria-hidden="true">
          <path v-if="periodChange >= 0" d="M5 1 9 8H1z" />
          <path v-else d="M5 9 1 2h8z" />
        </svg>
        {{ Math.abs(periodChange).toFixed(1) }}%
      </span>
      <span class="text-[12px] text-slate-400">vs previous period</span>
    </div>

    <div v-if="loading" class="dt-skel h-[260px] w-full rounded-lg" />

    <div v-else-if="!hasData" class="dt-empty h-[260px]">
      <p class="text-[14px] font-medium text-slate-900">No activity in this period</p>
      <p class="text-[13px] text-slate-500 mt-1">Try a longer date range.</p>
    </div>

    <div v-else class="h-[260px]">
      <Line :data="chartData" :options="chartOptions" />
    </div>
  </section>
</template>

<script setup>
import { ref, computed } from 'vue';
import { Line } from 'vue-chartjs';
import {
  Chart as ChartJS,
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Tooltip,
  Filler,
} from 'chart.js';

// Registered piecemeal rather than importing the auto bundle: this pulls in
// the line renderer, two scales, the tooltip and the area fill. No legend, no
// title plugin, no other controllers.
ChartJS.register(
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Tooltip,
  Filler
);

const props = defineProps({
  series: { type: Object, default: () => ({ current: [], previous: [] }) },
  metrics: { type: Array, default: () => [{ key: 'revenue', label: 'Revenue', format: (v) => v }] },
  subtitle: { type: String, default: '' },
  loading: { type: Boolean, default: false },
});

const WATER = '#12596E';
const MUTED = '#CFD7E0';

const active = ref(props.metrics[0]?.key || 'revenue');
const compare = ref(true);

const activeMetric = computed(
  () => props.metrics.find((m) => m.key === active.value)
    || props.metrics[0]
    || { key: 'revenue', label: 'Revenue', format: (v) => v }
);

const currentValues = computed(() => (props.series?.current || []).map((d) => Number(d[active.value]) || 0));
const previousValues = computed(() => (props.series?.previous || []).map((d) => Number(d[active.value]) || 0));

// An all-zero series is real data (a quiet period) but has nothing to plot.
const hasData = computed(() => currentValues.value.some((v) => v > 0) || previousValues.value.some((v) => v > 0));

// AOV is an average, so summing it across days would be meaningless.
const isAverage = computed(() => active.value === 'aov');

const sum = (list) => list.reduce((a, b) => a + b, 0);

const periodTotal = computed(() => {
  const values = currentValues.value;
  if (!values.length) return 0;
  if (!isAverage.value) return sum(values);
  const active = values.filter((v) => v > 0);
  return active.length ? sum(active) / active.length : 0;
});

const previousTotal = computed(() => {
  const values = previousValues.value;
  if (!values.length) return 0;
  if (!isAverage.value) return sum(values);
  const active = values.filter((v) => v > 0);
  return active.length ? sum(active) / active.length : 0;
});

// null when the baseline is zero — "grew from nothing" is not a percentage.
const periodChange = computed(() => {
  const prev = previousTotal.value;
  if (!prev) return null;
  return ((periodTotal.value - prev) / Math.abs(prev)) * 100;
});

const labels = computed(() =>
  (props.series?.current || []).map((d) =>
    new Date(d.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
  )
);

const chartData = computed(() => ({
  labels: labels.value,
  datasets: [
    {
      label: 'Selected period',
      data: currentValues.value,
      borderColor: WATER,
      borderWidth: 2.25,
      fill: true,
      backgroundColor: (ctx) => {
        const { chart } = ctx;
        if (!chart.chartArea) return 'rgba(18,89,110,0.06)';
        // Vertical gradient, so the area fades out rather than sitting as a
        // flat block against the gridlines.
        const g = chart.ctx.createLinearGradient(0, chart.chartArea.top, 0, chart.chartArea.bottom);
        g.addColorStop(0, 'rgba(18,89,110,0.16)');
        g.addColorStop(1, 'rgba(18,89,110,0.01)');
        return g;
      },
      tension: 0.32,
      // Points appear on hover only: 30 permanent dots on a 30-day series is
      // noise, but they must exist for the tooltip to have something to hit.
      pointRadius: 0,
      pointHoverRadius: 5,
      pointBackgroundColor: '#fff',
      pointBorderColor: WATER,
      pointBorderWidth: 2.5,
      pointHitRadius: 16,
      order: 1,
    },
    ...(compare.value
      ? [{
          label: 'Previous period',
          data: previousValues.value,
          borderColor: MUTED,
          borderWidth: 2,
          borderDash: [5, 4],
          fill: false,
          tension: 0.32,
          pointRadius: 0,
          pointHoverRadius: 4,
          pointBackgroundColor: '#fff',
          pointBorderColor: MUTED,
          pointBorderWidth: 2,
          pointHitRadius: 16,
          order: 2,
        }]
      : []),
  ],
}));

const chartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  // Hovering anywhere in a column reads both series at that date, so the two
  // periods can be compared without landing exactly on a point.
  interaction: { mode: 'index', intersect: false },
  animation: { duration: 600, easing: 'easeOutQuart' },
  // Redrawing on a metric switch animates from the old shape rather than
  // rebuilding, which reads as the same chart changing.
  animations: { y: { duration: 600, easing: 'easeOutQuart' } },
  layout: { padding: { top: 8, right: 4, bottom: 0, left: 0 } },
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: '#111823',
      titleColor: '#fff',
      titleFont: { size: 12, weight: '600' },
      bodyColor: '#CBD5E1',
      bodyFont: { size: 12 },
      padding: 10,
      cornerRadius: 6,
      displayColors: true,
      boxWidth: 8,
      boxHeight: 8,
      boxPadding: 4,
      callbacks: {
        // Values are formatted with the metric's own formatter, so revenue
        // reads as ₹1,234 rather than a bare number.
        label: (ctx) => ` ${ctx.dataset.label}: ${activeMetric.value.format(ctx.parsed.y)}`,
      },
    },
  },
  scales: {
    x: {
      grid: { display: false },
      border: { display: false },
      ticks: {
        color: '#8B96A5',
        font: { size: 10 },
        maxRotation: 0,
        autoSkip: true,
        maxTicksLimit: 6,
      },
    },
    y: {
      beginAtZero: true,
      grid: { color: '#E3E8EE', drawTicks: false },
      border: { display: false },
      ticks: {
        color: '#8B96A5',
        font: { size: 10 },
        padding: 8,
        maxTicksLimit: 5,
        // Counts are integers. The previous axis rendered 0.383 / 0.767 /
        // 1.15 for a day with one order, which is not a possible value.
        precision: isAverage.value || active.value === 'revenue' ? undefined : 0,
        callback: (value) => activeMetric.value.format(value),
      },
    },
  },
}));
</script>
