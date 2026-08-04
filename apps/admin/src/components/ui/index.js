// Shared admin table primitives.
//
//   import { DataTable, DataToolbar, Pagination } from '@/components/ui';
//
// Kept as one entry point so a view imports from a single path instead of
// four, and so these can be relocated without touching every caller.

export { default as DataTable } from './DataTable.vue';
export { default as DataToolbar } from './DataToolbar.vue';
export { default as Pagination } from './Pagination.vue';
export { default as SearchInput } from './SearchInput.vue';
export { default as FilterSelect } from './FilterSelect.vue';
export { default as StatusBadge } from './StatusBadge.vue';
