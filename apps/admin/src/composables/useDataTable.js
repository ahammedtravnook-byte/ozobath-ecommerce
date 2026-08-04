import { ref, computed, watch, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';

/**
 * Shared state machine for every admin list view: search, filters, sorting,
 * pagination, and the fetch that ties them together.
 *
 * Replaces six divergent implementations. Three problems it exists to fix:
 *
 *  1. `@input="fetch"` fired one request per keystroke. Typing "shower" sent
 *     six. They also raced — a slower early response could land last and
 *     render results for a prefix of what was in the box.
 *  2. Inventory and Customers filtered in the browser over a capped fetch, so
 *     rows past the cap were invisible AND unsearchable.
 *  3. Filters lived only in component state, so navigating to a row and
 *     pressing Back dropped them, and no view was linkable.
 *
 * Usage:
 *   const table = useDataTable({
 *     fetcher: (params) => productAPI.getAll(params),
 *     filters: { category: '', status: '' },
 *     defaultSort: '-createdAt',
 *   });
 *
 * @param {object}   options
 * @param {Function} options.fetcher      (params, { signal }) => Promise<axios response>
 * @param {object}   [options.filters]    filter name -> default value
 * @param {string}   [options.defaultSort]
 * @param {number}   [options.defaultLimit]
 * @param {number}   [options.debounceMs] search debounce, default 300
 * @param {boolean}  [options.syncUrl]    mirror state into the query string
 * @param {Function} [options.transform]  (payload) => ({ items, pagination })
 * @param {Function} [options.onError]
 */
export function useDataTable(options) {
  const {
    fetcher,
    filters: filterDefaults = {},
    defaultSort = '-createdAt',
    defaultLimit = 20,
    debounceMs = 300,
    syncUrl = true,
    transform,
    onError,
  } = options;

  const route = useRoute();
  const router = useRouter();

  // ─── State ─────────────────────────────────────
  const items = ref([]);
  const loading = ref(true);
  const error = ref(null);
  const total = ref(0);
  const pages = ref(1);

  const page = ref(1);
  const limit = ref(defaultLimit);
  const search = ref('');
  const sort = ref(defaultSort);
  const filters = ref({ ...filterDefaults });

  // ─── Hydrate from the URL ──────────────────────
  // Runs before the first fetch so a shared or reloaded link restores the
  // exact view rather than resetting to defaults.
  if (syncUrl && route?.query) {
    const q = route.query;
    if (q.page) page.value = Math.max(1, parseInt(q.page, 10) || 1);
    if (q.limit) limit.value = parseInt(q.limit, 10) || defaultLimit;
    if (q.search) search.value = String(q.search);
    if (q.sort) sort.value = String(q.sort);
    for (const key of Object.keys(filterDefaults)) {
      if (q[key] !== undefined) filters.value[key] = String(q[key]);
    }
  }

  // ─── Derived ───────────────────────────────────
  const activeFilters = computed(() =>
    Object.entries(filters.value)
      .filter(([, v]) => v !== '' && v !== null && v !== undefined)
      .map(([key, value]) => ({ key, value }))
  );

  const hasActiveFilters = computed(
    () => activeFilters.value.length > 0 || search.value.trim() !== ''
  );

  const isEmpty = computed(() => !loading.value && items.value.length === 0);

  const rangeStart = computed(() =>
    total.value === 0 ? 0 : (page.value - 1) * limit.value + 1
  );
  const rangeEnd = computed(() =>
    Math.min(page.value * limit.value, total.value)
  );

  // ─── Fetch ─────────────────────────────────────
  // One in-flight request at a time. A superseded request is aborted rather
  // than left to resolve, which is what previously allowed stale results to
  // overwrite fresh ones.
  let controller = null;

  const buildParams = () => {
    const params = { page: page.value, limit: limit.value, sort: sort.value };
    const term = search.value.trim();
    if (term) params.search = term;
    for (const [key, value] of Object.entries(filters.value)) {
      if (value !== '' && value !== null && value !== undefined) params[key] = value;
    }
    return params;
  };

  const fetchData = async () => {
    controller?.abort();
    controller = new AbortController();
    const signal = controller.signal;

    loading.value = true;
    error.value = null;

    try {
      const res = await fetcher(buildParams(), { signal });
      if (signal.aborted) return;

      const payload = res?.data ?? res;
      const shaped = transform
        ? transform(payload)
        : {
            // Endpoints return the shared `items` key; several also keep a
            // legacy named key (`products`, `orders`) for compatibility, and
            // a few still return a bare array.
            items: payload?.items ?? (Array.isArray(payload) ? payload : []),
            pagination: payload?.pagination,
          };

      items.value = shaped.items || [];
      total.value = shaped.pagination?.total ?? items.value.length;
      pages.value = shaped.pagination?.pages ?? 1;

      // A deleted last row can leave the cursor past the end; step back so the
      // operator sees rows instead of an empty table.
      if (page.value > pages.value && pages.value >= 1) {
        page.value = pages.value;
        return fetchData();
      }
    } catch (err) {
      // An abort is a normal consequence of typing, not a failure.
      if (err?.name === 'CanceledError' || err?.name === 'AbortError' || signal.aborted) return;
      error.value = err;
      items.value = [];
      onError?.(err);
    } finally {
      if (!signal.aborted) loading.value = false;
    }
  };

  // ─── URL sync ──────────────────────────────────
  // replace(), not push() — otherwise each keystroke becomes a history entry
  // and Back has to be pressed once per character.
  const syncToUrl = () => {
    if (!syncUrl || !router) return;

    const query = {};
    if (page.value > 1) query.page = String(page.value);
    if (limit.value !== defaultLimit) query.limit = String(limit.value);
    if (search.value.trim()) query.search = search.value.trim();
    if (sort.value !== defaultSort) query.sort = sort.value;
    for (const [key, value] of Object.entries(filters.value)) {
      if (value !== '' && value !== null && value !== undefined) query[key] = String(value);
    }

    const current = JSON.stringify(route.query);
    if (JSON.stringify(query) !== current) {
      router.replace({ query }).catch(() => {});
    }
  };

  // ─── Reactions ─────────────────────────────────
  let debounceTimer = null;

  // Typing resets to page 1: staying on page 5 of the previous result set
  // would usually show nothing.
  watch(search, () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      page.value = 1;
      syncToUrl();
      fetchData();
    }, debounceMs);
  });

  // Filters and sort apply immediately — they come from discrete controls,
  // not keystrokes, so debouncing would only feel sluggish.
  watch(
    filters,
    () => {
      page.value = 1;
      syncToUrl();
      fetchData();
    },
    { deep: true }
  );

  watch(sort, () => {
    page.value = 1;
    syncToUrl();
    fetchData();
  });

  watch([page, limit], () => {
    syncToUrl();
    fetchData();
  });

  onUnmounted(() => {
    clearTimeout(debounceTimer);
    controller?.abort();
  });

  // ─── Actions ───────────────────────────────────

  /**
   * Toggle a column's sort. First click sorts descending — for admin tables
   * the useful default is newest/highest first.
   */
  const toggleSort = (field) => {
    if (!field) return;
    sort.value =
      sort.value === `-${field}` ? field
      : sort.value === field ? `-${field}`
      : `-${field}`;
  };

  const sortDirection = (field) =>
    sort.value === field ? 'asc'
    : sort.value === `-${field}` ? 'desc'
    : null;

  const setFilter = (key, value) => { filters.value[key] = value; };

  const clearFilter = (key) => { filters.value[key] = filterDefaults[key] ?? ''; };

  const clearAll = () => {
    search.value = '';
    filters.value = { ...filterDefaults };
    page.value = 1;
    // The search watcher is debounced; fetch directly so "Clear all" is
    // instant rather than waiting out the timer.
    clearTimeout(debounceTimer);
    syncToUrl();
    fetchData();
  };

  const goToPage = (n) => {
    const target = Math.min(Math.max(1, n), Math.max(1, pages.value));
    if (target !== page.value) page.value = target;
  };

  // For use after a mutation (delete, status change): keeps the current view.
  const refresh = () => fetchData();

  fetchData();

  return {
    // state
    items, loading, error, total, pages, page, limit, search, sort, filters,
    // derived
    activeFilters, hasActiveFilters, isEmpty, rangeStart, rangeEnd,
    // actions
    toggleSort, sortDirection, setFilter, clearFilter, clearAll, goToPage, refresh,
  };
}

export default useDataTable;
