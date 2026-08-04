<!--
  Table toolbar: search, filter slot, and a chip row showing what is currently
  narrowing the result set.

  The chips matter operationally. Previously a filter left in a select was easy
  to miss, so "the product is missing" was usually a stale filter. Each chip is
  individually removable and there is a single Clear all.
-->
<template>
  <div class="border-b border-slate-200">
    <div class="dt-toolbar">
      <!-- Left: search + filters -->
      <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 flex-1 min-w-0">
        <SearchInput
          v-if="searchable"
          :model-value="search"
          :placeholder="searchPlaceholder"
          @update:model-value="$emit('update:search', $event)"
        />
        <slot name="filters" />
      </div>

      <!-- Right: actions -->
      <div v-if="$slots.actions" class="flex items-center gap-2 shrink-0">
        <slot name="actions" />
      </div>
    </div>

    <!-- Active filters -->
    <div
      v-if="chips.length"
      class="flex items-center gap-2 flex-wrap px-4 py-2.5 bg-slate-50/70 border-t border-slate-100"
    >
      <span class="text-[12px] text-slate-500 font-medium">Filters</span>

      <span v-for="chip in chips" :key="chip.key" class="dt-chip">
        <span class="text-blue-500/80">{{ chip.label }}:</span>
        <span>{{ chip.display }}</span>
        <button
          type="button"
          class="dt-chip-x"
          :aria-label="`Remove ${chip.label} filter`"
          @click="$emit('clear-filter', chip.key)"
        >
          <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
            <path d="M18 6 6 18M6 6l12 12" stroke-linecap="round" />
          </svg>
        </button>
      </span>

      <button
        type="button"
        class="text-[12px] font-medium text-slate-500 hover:text-slate-900 underline underline-offset-2 ml-1"
        @click="$emit('clear-all')"
      >
        Clear all
      </button>

      <span v-if="!loading" class="ml-auto text-[12px] text-slate-500 tabular-nums">
        {{ total.toLocaleString('en-IN') }} {{ total === 1 ? 'result' : 'results' }}
      </span>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import SearchInput from './SearchInput.vue';

const props = defineProps({
  search: { type: String, default: '' },
  searchable: { type: Boolean, default: true },
  searchPlaceholder: { type: String, default: 'Search…' },
  activeFilters: { type: Array, default: () => [] },
  total: { type: Number, default: 0 },
  loading: { type: Boolean, default: false },
  /**
   * Per-filter display metadata, keyed by filter name:
   *   { status: { label: 'Status', options: [{ value, label }] } }
   * Used to render the raw stored value as the human label the operator picked
   * — a chip reading "Category: 66f3…b1" would be useless.
   */
  filterMeta: { type: Object, default: () => ({}) },
});

defineEmits(['update:search', 'clear-filter', 'clear-all']);

const chips = computed(() =>
  props.activeFilters.map(({ key, value }) => {
    const meta = props.filterMeta[key] || {};
    const match = (meta.options || []).find(
      (o) => String(o.value ?? o._id) === String(value)
    );
    return {
      key,
      label: meta.label || key,
      display: match?.label ?? match?.name ?? value,
    };
  })
);
</script>
