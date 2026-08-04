<!--
  Table pagination: range summary, per-page selector, windowed page numbers.

  The previous implementation rendered `v-for="p in pagination.pages"` — one
  button per page. At 17 products that is fine; at 800 orders it is 40 buttons
  wrapping across the footer. This shows at most 7 slots with ellipses.
-->
<template>
  <div
    v-if="total > 0"
    class="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3
           border-t border-slate-200 bg-white"
  >
    <!-- Range + per-page -->
    <div class="flex items-center gap-4 text-[13px] text-slate-500">
      <span>
        <span class="font-medium text-slate-900">{{ rangeStart }}–{{ rangeEnd }}</span>
        of <span class="font-medium text-slate-900">{{ total.toLocaleString('en-IN') }}</span>
      </span>

      <label v-if="showPageSize" class="flex items-center gap-1.5">
        <span class="hidden sm:inline">Rows</span>
        <select
          :value="limit"
          class="dt-select h-7 pl-2 pr-6 text-[12px]"
          aria-label="Rows per page"
          @change="$emit('update:limit', Number($event.target.value))"
        >
          <option v-for="s in pageSizes" :key="s" :value="s">{{ s }}</option>
        </select>
      </label>
    </div>

    <!-- Page controls -->
    <nav v-if="pages > 1" class="flex items-center gap-1" aria-label="Pagination">
      <button class="dt-btn w-8 px-0" :disabled="page === 1" aria-label="First page" @click="go(1)">
        <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
          <path d="m11 17-5-5 5-5M18 17l-5-5 5-5" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </button>
      <button class="dt-btn w-8 px-0" :disabled="page === 1" aria-label="Previous page" @click="go(page - 1)">
        <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
          <path d="m15 18-6-6 6-6" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </button>

      <template v-for="(slot, i) in slots" :key="`${slot}-${i}`">
        <span v-if="slot === '…'" class="px-1.5 text-slate-400 text-[13px] select-none">…</span>
        <button
          v-else
          class="dt-btn w-8 px-0 tabular-nums"
          :class="slot === page ? 'bg-slate-900 border-slate-900 text-white hover:bg-slate-800' : ''"
          :aria-current="slot === page ? 'page' : undefined"
          @click="go(slot)"
        >
          {{ slot }}
        </button>
      </template>

      <button class="dt-btn w-8 px-0" :disabled="page === pages" aria-label="Next page" @click="go(page + 1)">
        <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
          <path d="m9 18 6-6-6-6" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </button>
      <button class="dt-btn w-8 px-0" :disabled="page === pages" aria-label="Last page" @click="go(pages)">
        <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
          <path d="m13 17 5-5-5-5M6 17l5-5-5-5" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </button>
    </nav>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  page: { type: Number, required: true },
  pages: { type: Number, default: 1 },
  total: { type: Number, default: 0 },
  limit: { type: Number, default: 20 },
  rangeStart: { type: Number, default: 0 },
  rangeEnd: { type: Number, default: 0 },
  showPageSize: { type: Boolean, default: true },
  pageSizes: { type: Array, default: () => [20, 50, 100] },
});

const emit = defineEmits(['update:page', 'update:limit']);

const go = (n) => {
  const target = Math.min(Math.max(1, n), props.pages);
  if (target !== props.page) emit('update:page', target);
};

// Always first and last, plus a window around the current page. Ellipsis only
// where it actually replaces a gap, so widths stay stable while paging.
const slots = computed(() => {
  const { page, pages } = props;
  if (pages <= 7) return Array.from({ length: pages }, (_, i) => i + 1);

  const out = [1];
  const from = Math.max(2, page - 1);
  const to = Math.min(pages - 1, page + 1);

  if (from > 2) out.push('…');
  for (let i = from; i <= to; i++) out.push(i);
  if (to < pages - 1) out.push('…');

  out.push(pages);
  return out;
});
</script>
