<!--
  Labelled select for table filters.

  Accepts either ['a', 'b'] or [{ value, label }], so views can pass API enums
  directly without mapping them first.
-->
<template>
  <div class="relative">
    <select
      :value="modelValue"
      class="dt-select"
      :class="[widthClass, modelValue ? 'border-blue-300 text-slate-900 font-medium' : '']"
      :aria-label="label"
      @change="$emit('update:modelValue', $event.target.value)"
    >
      <option value="">{{ placeholder }}</option>
      <option v-for="opt in normalized" :key="opt.value" :value="opt.value">
        {{ opt.label }}
      </option>
    </select>

    <span class="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
      <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
        <path d="m6 9 6 6 6-6" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
    </span>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  modelValue: { type: [String, Number], default: '' },
  options: { type: Array, default: () => [] },
  label: { type: String, default: 'Filter' },
  placeholder: { type: String, default: 'All' },
  widthClass: { type: String, default: 'w-full lg:w-auto lg:min-w-[150px]' },
});

defineEmits(['update:modelValue']);

const normalized = computed(() =>
  props.options.map((o) =>
    typeof o === 'object' && o !== null
      ? { value: o.value ?? o._id ?? '', label: o.label ?? o.name ?? String(o.value ?? '') }
      : { value: o, label: String(o) }
  )
);
</script>
