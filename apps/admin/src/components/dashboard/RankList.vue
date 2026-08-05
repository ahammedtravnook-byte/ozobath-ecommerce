<!--
  Numbered ranking (top products, worst performers, top customers).
  Configured entirely by props from the panel registry.
-->
<template>
  <section class="db-card">
    <header class="mb-3">
      <h2 class="db-title">{{ title }}</h2>
      <p v-if="subtitle" class="db-sub">{{ subtitle }}</p>
    </header>

    <div v-if="loading" class="space-y-3">
      <div v-for="n in 4" :key="n" class="flex items-center gap-3 py-2">
        <div class="dt-skel h-3 w-4" />
        <div class="flex-1 space-y-1.5">
          <div class="dt-skel h-3.5 w-3/4" />
          <div class="dt-skel h-2.5 w-1/3" />
        </div>
        <div class="dt-skel h-3.5 w-14" />
      </div>
    </div>

    <p v-else-if="!rows.length" class="text-[13px] text-slate-400 py-6 text-center">
      Nothing to show for this period.
    </p>

    <div v-else>
      <div v-for="(row, i) in rows" :key="row.id || i" class="db-rank">
        <span class="db-rank-n">{{ String(i + 1).padStart(2, '0') }}</span>
        <div class="flex-1 min-w-0">
          <p class="text-[13px] text-slate-800 truncate">{{ row.label }}</p>
          <p v-if="row.meta" class="text-[11.5px] text-slate-400">{{ row.meta }}</p>
        </div>
        <span class="db-num text-[13px] font-medium text-slate-900 shrink-0">{{ row.display }}</span>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  title: { type: String, default: '' },
  subtitle: { type: String, default: '' },
  data: { type: Array, default: () => [] },
  labelKey: { type: String, default: 'name' },
  valueKey: { type: String, default: 'value' },
  metaKey: { type: String, default: '' },
  metaSuffix: { type: String, default: '' },
  valueSuffix: { type: String, default: '' },
  format: { type: Function, default: null },
  loading: { type: Boolean, default: false },
});

const rows = computed(() =>
  (props.data || []).map((d) => {
    const value = Number(d[props.valueKey]) || 0;
    const formatted = props.format ? props.format(value) : value.toLocaleString('en-IN');
    return {
      id: d._id,
      label: d[props.labelKey] || '—',
      // metaKey may legitimately be 0 ("0 sold" is the point of the worst-
      // performers list), so check for presence rather than truthiness.
      meta: props.metaKey && d[props.metaKey] !== undefined && d[props.metaKey] !== null
        ? `${Number(d[props.metaKey]).toLocaleString('en-IN')} ${props.metaSuffix}`.trim()
        : '',
      display: props.valueSuffix ? `${formatted} ${props.valueSuffix}` : formatted,
    };
  })
);
</script>
