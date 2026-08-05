<!--
  Catalogue hygiene: fields missing across active products. Each row is a
  count of products with a specific gap, linking to where it is fixed.
  Rows at zero are hidden — a clean catalogue should show nothing, not a
  column of noughts.
-->
<template>
  <section class="db-card">
    <header class="mb-3">
      <h2 class="db-title">{{ title }}</h2>
      <p v-if="subtitle" class="db-sub">{{ subtitle }}</p>
    </header>

    <div v-if="loading" class="space-y-2.5">
      <div v-for="n in 4" :key="n" class="flex items-center justify-between py-2">
        <div class="dt-skel h-3.5 w-32" />
        <div class="dt-skel h-3.5 w-8" />
      </div>
    </div>

    <p v-else-if="!rows.length" class="text-[13px] text-slate-400 py-6 text-center">
      Catalogue is complete.
    </p>

    <div v-else>
      <router-link
        v-for="row in rows"
        :key="row.key"
        :to="row.to"
        class="flex items-center justify-between gap-3 py-2.5 border-b border-slate-100 last:border-0 no-underline group"
      >
        <span class="text-[13px] text-slate-700 group-hover:text-slate-900">{{ row.label }}</span>
        <span class="db-num text-[13px] font-medium" :class="row.tone">{{ row.count }}</span>
      </router-link>
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  title: { type: String, default: 'Catalogue health' },
  subtitle: { type: String, default: '' },
  data: { type: Object, default: () => ({}) },
  loading: { type: Boolean, default: false },
});

// Ordered by how directly each gap costs money: no image suppresses
// conversion hardest, SEO gaps suppress discovery, inactive is informational.
const CHECKS = [
  { key: 'missingImages', label: 'Products without images', to: '/products', severe: true },
  { key: 'missingDescription', label: 'Products without a description', to: '/products', severe: true },
  { key: 'missingSeo', label: 'Products missing SEO fields', to: '/products' },
  { key: 'missingSku', label: 'Products without a SKU', to: '/products' },
  { key: 'inactiveProducts', label: 'Inactive products', to: '/products?status=inactive' },
  { key: 'pendingReviews', label: 'Reviews awaiting moderation', to: '/reviews' },
];

const rows = computed(() =>
  CHECKS.map((c) => ({
    ...c,
    count: Number(props.data?.[c.key]) || 0,
    tone: c.severe ? 'text-red-600' : 'text-amber-700',
  })).filter((c) => c.count > 0)
);
</script>
