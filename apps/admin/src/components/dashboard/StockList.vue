<!--
  Stock attention list — dead stock and low cover, with the capital each row
  is holding. Sorted by stock descending by the API, so the biggest tied-up
  positions surface first.
-->
<template>
  <section class="db-card">
    <header class="flex items-baseline justify-between gap-3 mb-3">
      <div>
        <h2 class="db-title">{{ title }}</h2>
        <p v-if="subtitle" class="db-sub">{{ subtitle }}</p>
      </div>
      <router-link :to="to" class="text-[12.5px] text-[#12596E] hover:underline whitespace-nowrap">
        Manage →
      </router-link>
    </header>

    <div v-if="loading" class="space-y-3">
      <div v-for="n in 5" :key="n" class="flex items-center gap-3 py-2">
        <div class="flex-1 space-y-1.5">
          <div class="dt-skel h-3.5 w-2/3" />
          <div class="dt-skel h-2.5 w-1/3" />
        </div>
        <div class="dt-skel h-3.5 w-10" />
      </div>
    </div>

    <p v-else-if="!rows.length" class="text-[13px] text-slate-400 py-6 text-center">
      Nothing needs restocking.
    </p>

    <div v-else>
      <router-link
        v-for="row in rows"
        :key="row._id"
        :to="`/products/${row._id}/edit`"
        class="flex items-center gap-3 py-2.5 border-b border-slate-100 last:border-0 no-underline group"
      >
        <div class="flex-1 min-w-0">
          <p class="text-[13px] text-slate-800 truncate group-hover:text-slate-900">{{ row.name }}</p>
          <p class="text-[11.5px] text-slate-400 truncate">
            {{ row.sku || 'No SKU' }}<span v-if="row.tiedUp"> · {{ row.tiedUp }} tied up</span>
          </p>
        </div>
        <span class="db-num text-[13px] font-semibold shrink-0" :class="row.tone">
          {{ row.stock }}
        </span>
      </router-link>
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  title: { type: String, default: 'Needs restocking' },
  subtitle: { type: String, default: '' },
  data: { type: Array, default: () => [] },
  to: { type: String, default: '/inventory' },
  loading: { type: Boolean, default: false },
});

const LOW_STOCK = 10;

const rows = computed(() =>
  (props.data || []).map((p) => {
    // costPrice is the honest basis; fall back to retail so the column is
    // never blank, since most products do carry a cost.
    const unit = p.costPrice ?? p.price ?? 0;
    const value = (p.stock || 0) * unit;
    return {
      _id: p._id,
      name: p.name,
      sku: p.sku,
      stock: p.stock ?? 0,
      tiedUp: value > 0 ? `₹${Math.round(value).toLocaleString('en-IN')}` : '',
      tone: p.stock <= 0 ? 'text-red-600' : p.stock < LOW_STOCK ? 'text-amber-600' : 'text-slate-900',
    };
  })
);
</script>
