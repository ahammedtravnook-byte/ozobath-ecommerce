<!--
  "Needs action" strip.

  Rendered as a legend rather than an alert list: evenly spaced bordered
  rectangles, no badge counters, no underlines. The count sits inline as a
  muted figure so the row scans in one pass and stays quiet when the store is
  healthy — the whole strip is omitted when nothing needs attention, rather
  than showing a row of zeros.

  Entries come from the API (`needsAction`), which already filters to non-zero
  counts, so adding a new alert is a server-side change only.
-->
<template>
  <section v-if="items.length" class="db-action-bar mb-4" aria-label="Needs action">
    <span class="db-eyebrow text-amber-700 shrink-0">Needs action</span>

    <div class="flex items-center gap-2 flex-wrap flex-1">
      <router-link
        v-for="item in items"
        :key="item.id"
        :to="item.to"
        class="db-action-link"
      >
        <span>{{ item.label }}</span>
        <span class="db-action-count">{{ item.count }}</span>
      </router-link>
    </div>
  </section>
</template>

<script setup>
defineProps({
  items: { type: Array, default: () => [] },
});
</script>
