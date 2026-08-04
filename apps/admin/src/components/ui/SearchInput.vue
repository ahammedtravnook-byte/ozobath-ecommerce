<!--
  Debounced, clearable search box.

  Debouncing lives in useDataTable, not here: this stays a controlled input so
  it can also be used standalone. Esc clears, which is the convention operators
  expect from admin search.
-->
<template>
  <div class="relative" :class="widthClass">
    <span class="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
      <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-3.5-3.5" stroke-linecap="round" />
      </svg>
    </span>

    <input
      ref="inputEl"
      :value="modelValue"
      type="search"
      :placeholder="placeholder"
      :aria-label="placeholder"
      class="dt-input pl-8"
      :class="modelValue ? 'pr-8' : 'pr-3'"
      @input="$emit('update:modelValue', $event.target.value)"
      @keydown.esc.prevent="clear"
    />

    <button
      v-if="modelValue"
      type="button"
      aria-label="Clear search"
      class="absolute right-2 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center
             rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
      @click="clear"
    >
      <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
        <path d="M18 6 6 18M6 6l12 12" stroke-linecap="round" />
      </svg>
    </button>
  </div>
</template>

<script setup>
import { ref } from 'vue';

defineProps({
  modelValue: { type: String, default: '' },
  placeholder: { type: String, default: 'Search…' },
  widthClass: { type: String, default: 'w-full lg:w-72' },
});

const emit = defineEmits(['update:modelValue']);
const inputEl = ref(null);

const clear = () => {
  emit('update:modelValue', '');
  inputEl.value?.focus();
};

// Lets a parent bind a keyboard shortcut to focus the box.
defineExpose({ focus: () => inputEl.value?.focus() });
</script>
