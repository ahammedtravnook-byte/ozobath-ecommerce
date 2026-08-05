<!--
  COD vs prepaid split.

  A donut is the right shape here specifically because it is a two-part share
  of one whole — the case where a circle reads faster than bars. The keys
  carry the exact figures, since arc lengths are hard to read precisely.

  The outstanding-COD figure below the chart is the operationally important
  one: it is money booked but not yet banked.
-->
<template>
  <section class="db-card">
    <header class="mb-4">
      <h2 class="db-title">{{ title }}</h2>
      <p v-if="subtitle" class="db-sub">{{ subtitle }}</p>
    </header>

    <div v-if="loading" class="flex items-center gap-5">
      <div class="dt-skel w-24 h-24 rounded-full" />
      <div class="flex-1 space-y-3">
        <div class="dt-skel h-3.5 w-full" />
        <div class="dt-skel h-3.5 w-full" />
      </div>
    </div>

    <template v-else-if="total > 0">
      <div class="flex items-center gap-5">
        <svg
          width="96" height="96" viewBox="0 0 42 42" class="shrink-0"
          role="img"
          :aria-label="`Donut chart: ${codShare.toFixed(0)} percent cash on delivery, ${prepaidShare.toFixed(0)} percent prepaid`"
        >
          <circle cx="21" cy="21" r="15.9" fill="none" stroke="#CFD7E0" stroke-width="6" />
          <circle
            cx="21" cy="21" r="15.9" fill="none" stroke="#12596E" stroke-width="6"
            :stroke-dasharray="`${codShare} ${100 - codShare}`"
            stroke-dashoffset="25"
          />
        </svg>

        <div class="flex flex-col gap-2.5 text-[12.5px] min-w-0 flex-1">
          <div class="flex items-center gap-2.5">
            <span class="w-2.5 h-2.5 rounded-sm bg-[#12596E] shrink-0" />
            <span class="text-slate-600">Cash on delivery</span>
            <span class="db-num font-medium ml-auto">{{ codShare.toFixed(0) }}%</span>
          </div>
          <div class="flex items-center gap-2.5">
            <span class="w-2.5 h-2.5 rounded-sm bg-slate-300 shrink-0" />
            <span class="text-slate-600">Prepaid</span>
            <span class="db-num font-medium ml-auto">{{ prepaidShare.toFixed(0) }}%</span>
          </div>
        </div>
      </div>

      <div class="mt-4 pt-3 border-t border-slate-100 flex justify-between items-baseline">
        <div>
          <div class="text-[12.5px] text-slate-700">Outstanding</div>
          <div class="text-[11.5px] text-slate-400">Booked, not yet collected</div>
        </div>
        <span class="db-num text-[16px] font-semibold text-amber-700">{{ outstandingLabel }}</span>
      </div>
    </template>

    <p v-else class="text-[13px] text-slate-400 py-6 text-center">
      No orders in this period.
    </p>
  </section>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  title: { type: String, default: 'Payment method' },
  subtitle: { type: String, default: '' },
  data: { type: Object, default: () => ({}) },
  outstanding: { type: Number, default: 0 },
  loading: { type: Boolean, default: false },
});

const cod = computed(() => props.data?.cod || { net: 0, share: 0 });
const prepaid = computed(() => props.data?.prepaid || { net: 0, share: 0 });
const total = computed(() => (cod.value.net || 0) + (prepaid.value.net || 0));

// Recompute rather than trusting the server's share, so the two always sum to
// 100 in the UI even if one side rounds oddly.
const codShare = computed(() => (total.value > 0 ? (cod.value.net / total.value) * 100 : 0));
const prepaidShare = computed(() => (total.value > 0 ? 100 - codShare.value : 0));

const outstandingLabel = computed(
  () => `₹${Math.round(props.outstanding || 0).toLocaleString('en-IN')}`
);
</script>
