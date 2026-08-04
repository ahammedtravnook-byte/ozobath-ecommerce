<!--
  Column-driven table with sorting, loading skeleton, empty state and a mobile
  card fallback.

  Columns are declared as data, so a view describes what to show rather than
  hand-writing <thead>/<tbody> markup. Each column:

    {
      key:      'name',           // property path, supports 'category.name'
      label:    'Product',
      sortable: true,             // header toggles sort
      sortKey:  'name',           // API sort field, defaults to key
      align:    'left'|'right'|'center',
      width:    'w-32',
      hideOn:   'md',             // hide below this breakpoint on desktop
      primary:  true,             // becomes the mobile card title
    }

  Any column can be overridden with a named slot: <template #cell-name="{ row }">.
-->
<template>
  <div>
    <!-- ─── Desktop ─────────────────────────────── -->
    <div class="hidden lg:block overflow-x-auto custom-scrollbar">
      <table class="w-full border-collapse" :class="minWidthClass">
        <thead>
          <tr>
            <th
              v-for="col in columns"
              :key="col.key"
              class="dt-th"
              :class="[
                col.sortable ? 'dt-th-sortable' : '',
                alignClass(col.align),
                col.width || '',
                col.hideOn ? `hidden ${col.hideOn}:table-cell` : '',
              ]"
              :aria-sort="ariaSort(col)"
              @click="col.sortable && $emit('sort', col.sortKey || col.key)"
            >
              <span class="inline-flex items-center gap-1" :class="col.align === 'right' ? 'flex-row-reverse' : ''">
                {{ col.label }}
                <!-- Inactive columns keep a dimmed glyph so it is discoverable
                     that the header is clickable at all. -->
                <svg
                  v-if="col.sortable"
                  class="w-3 h-3 shrink-0 transition-colors"
                  :class="direction(col) ? 'text-slate-900' : 'text-slate-300'"
                  fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"
                >
                  <path v-if="direction(col) === 'asc'" d="m6 15 6-6 6 6" stroke-linecap="round" stroke-linejoin="round" />
                  <path v-else-if="direction(col) === 'desc'" d="m6 9 6 6 6-6" stroke-linecap="round" stroke-linejoin="round" />
                  <path v-else d="m8 9 4-4 4 4M8 15l4 4 4-4" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
              </span>
            </th>
          </tr>
        </thead>

        <tbody>
          <!-- Skeleton rows match real row height, so the table does not jump
               when data lands. -->
          <template v-if="loading">
            <tr v-for="n in skeletonRows" :key="`sk-${n}`" class="dt-row">
              <td v-for="col in columns" :key="col.key" class="dt-td" :class="col.hideOn ? `hidden ${col.hideOn}:table-cell` : ''">
                <div class="dt-skel h-4" :style="{ width: skeletonWidth(col) }" />
              </td>
            </tr>
          </template>

          <tr
            v-for="(row, i) in rows"
            v-else
            :key="rowKey(row, i)"
            class="dt-row"
            :class="rowClickable ? 'cursor-pointer' : ''"
            @click="rowClickable && $emit('row-click', row)"
          >
            <td
              v-for="col in columns"
              :key="col.key"
              class="dt-td"
              :class="[alignClass(col.align), col.hideOn ? `hidden ${col.hideOn}:table-cell` : '']"
            >
              <slot :name="`cell-${col.key}`" :row="row" :value="getValue(row, col.key)" :index="i">
                {{ formatted(row, col) }}
              </slot>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- ─── Mobile ──────────────────────────────── -->
    <div class="lg:hidden divide-y divide-slate-100">
      <template v-if="loading">
        <div v-for="n in 4" :key="`mk-${n}`" class="p-4 space-y-2.5">
          <div class="dt-skel h-4 w-2/3" />
          <div class="dt-skel h-3 w-1/3" />
          <div class="dt-skel h-3 w-1/2" />
        </div>
      </template>

      <div
        v-for="(row, i) in rows"
        v-else
        :key="rowKey(row, i)"
        class="p-4 transition-colors"
        :class="rowClickable ? 'active:bg-slate-50 cursor-pointer' : ''"
        @click="rowClickable && $emit('row-click', row)"
      >
        <slot name="mobile-card" :row="row" :index="i">
          <!-- Default card: primary column as the heading, the rest as
               label/value pairs. -->
          <div class="flex items-start justify-between gap-3 mb-2">
            <div class="min-w-0 flex-1">
              <slot :name="`cell-${primaryColumn.key}`" :row="row" :value="getValue(row, primaryColumn.key)" :index="i">
                <p class="text-[14px] font-medium text-slate-900 truncate">
                  {{ formatted(row, primaryColumn) }}
                </p>
              </slot>
            </div>
            <div v-if="badgeColumn" class="shrink-0">
              <slot :name="`cell-${badgeColumn.key}`" :row="row" :value="getValue(row, badgeColumn.key)" :index="i" />
            </div>
          </div>

          <dl class="grid grid-cols-2 gap-x-4 gap-y-1.5">
            <div v-for="col in mobileColumns" :key="col.key" class="min-w-0">
              <dt class="text-[11px] text-slate-400">{{ col.label }}</dt>
              <dd class="text-[13px] text-slate-700 truncate">
                <slot :name="`cell-${col.key}`" :row="row" :value="getValue(row, col.key)" :index="i">
                  {{ formatted(row, col) }}
                </slot>
              </dd>
            </div>
          </dl>
        </slot>
      </div>
    </div>

    <!-- ─── Empty ───────────────────────────────── -->
    <div v-if="!loading && !rows.length" class="dt-empty">
      <div class="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mb-3">
        <svg class="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" stroke-linecap="round" />
        </svg>
      </div>
      <p class="text-[14px] font-medium text-slate-900">{{ emptyTitle }}</p>
      <p class="text-[13px] text-slate-500 mt-1 max-w-sm">{{ emptyMessage }}</p>
      <slot name="empty-action" />
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  columns: { type: Array, required: true },
  rows: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
  sort: { type: String, default: '' },
  rowKeyField: { type: String, default: '_id' },
  rowClickable: { type: Boolean, default: false },
  skeletonRows: { type: Number, default: 6 },
  minWidthClass: { type: String, default: 'min-w-[900px]' },
  emptyTitle: { type: String, default: 'No results' },
  emptyMessage: { type: String, default: 'Try adjusting your search or filters.' },
});

defineEmits(['sort', 'row-click']);

// Supports dotted paths so a column can read 'category.name' directly.
const getValue = (row, key) =>
  String(key).split('.').reduce((acc, part) => acc?.[part], row);

const formatted = (row, col) => {
  const raw = getValue(row, col.key);
  if (col.format) return col.format(raw, row);
  return raw ?? col.fallback ?? '—';
};

const rowKey = (row, i) => row?.[props.rowKeyField] ?? i;

const alignClass = (align) =>
  align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left';

const direction = (col) => {
  const field = col.sortKey || col.key;
  if (props.sort === field) return 'asc';
  if (props.sort === `-${field}`) return 'desc';
  return null;
};

const ariaSort = (col) => {
  if (!col.sortable) return undefined;
  const d = direction(col);
  return d === 'asc' ? 'ascending' : d === 'desc' ? 'descending' : 'none';
};

// Varying skeleton widths read as content rather than a placeholder grid.
const skeletonWidth = (col) => col.skeletonWidth || (col.align === 'right' ? '3.5rem' : '70%');

const primaryColumn = computed(
  () => props.columns.find((c) => c.primary) || props.columns[0] || { key: '', label: '' }
);

const badgeColumn = computed(() => props.columns.find((c) => c.badge));

// Mobile shows everything except the title and badge, which are already in the
// card header.
const mobileColumns = computed(() =>
  props.columns.filter(
    (c) => c !== primaryColumn.value && c !== badgeColumn.value && !c.hideOnMobile
  )
);
</script>
