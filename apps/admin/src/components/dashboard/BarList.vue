<!--
  Horizontal bars for a breakdown. Bars are scaled against the largest value
  in the set, not the total: with one dominant category, share-of-total bars
  are all stubs and comparison between the small ones becomes impossible.
-->
<template>
  <section class="db-card">
    <header class="mb-4">
      <h2 class="db-title">{{ title }}</h2>
      <p v-if="subtitle" class="db-sub">{{ subtitle }}</p>
    </header>

    <div v-if="loading" class="space-y-3.5">
      <div v-for="n in 5" :key="n">
        <div class="dt-skel h-3 w-full mb-1.5" />
        <div class="dt-skel h-1.5 w-full" />
      </div>
    </div>

    <p v-else-if="!rows.length" class="text-[13px] text-slate-400 py-6 text-center">
      Nothing to show for this period.
    </p>

    <div v-else>
      <component
        :is="row.to ? 'router-link' : 'div'"
        v-for="row in rows"
        :key="row.label"
        :to="row.to"
        class="block mb-3.5 last:mb-0 no-underline"
        :class="row.to ? 'group' : ''"
      >
        <div class="db-row-label">
          <span class="text-slate-700 truncate pr-2" :class="row.to ? 'group-hover:text-slate-900' : ''">
            {{ row.label }}
          </span>
          <span class="db-num font-medium text-slate-500 shrink-0">{{ row.display }}</span>
        </div>
        <div class="db-track">
          <div class="db-fill" :class="row.tone" :style="{ width: row.width }" />
        </div>
      </component>
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  title: { type: String, default: '' },
  subtitle: { type: String, default: '' },
  data: { type: [Array, Object], default: () => [] },
  labelKey: { type: String, default: 'name' },
  valueKey: { type: String, default: 'value' },
  format: { type: Function, default: null },
  linkBase: { type: String, default: '' },
  loading: { type: Boolean, default: false },
});

// Tones for order-status rows, so "cancelled" is not the same blue as
// "delivered". Anything unmapped stays the default water blue.
const TONES = {
  pending: 'db-fill-warn',
  cancelled: 'db-fill-bad',
  returned: 'db-fill-bad',
};

const rows = computed(() => {
  // Accepts either an array of objects or a keyed map (statusDistribution).
  const list = Array.isArray(props.data)
    ? props.data.map((d) => ({
        label: d[props.labelKey],
        value: Number(d[props.valueKey]) || 0,
        key: d[props.labelKey],
      }))
    : Object.entries(props.data || {}).map(([key, v]) => ({
        label: key.charAt(0).toUpperCase() + key.slice(1),
        value: Number(typeof v === 'object' ? v[props.valueKey] ?? v.count : v) || 0,
        key,
      }));

  const withValues = list.filter((r) => r.value > 0);
  const max = Math.max(...withValues.map((r) => r.value), 1);

  return withValues
    .sort((a, b) => b.value - a.value)
    .map((r) => ({
      label: r.label,
      display: props.format ? props.format(r.value) : r.value.toLocaleString('en-IN'),
      // Floor at 2% so a tiny-but-real value is still a visible mark.
      width: `${Math.max(2, (r.value / max) * 100)}%`,
      tone: TONES[String(r.key).toLowerCase()] || '',
      to: props.linkBase ? `${props.linkBase}${r.key}` : '',
    }));
});
</script>
