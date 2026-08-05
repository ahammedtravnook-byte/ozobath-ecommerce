import { ref, computed, watch, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { analyticsAPI } from '@/api/services';

/**
 * Adapt an older server's response into the shape this dashboard renders.
 *
 * Vercel deploys the admin on merge; the API is updated by hand on the VPS,
 * so the frontend is routinely newer than the server it talks to. The server
 * emits `metrics` (plus legacy keys for back-compat), but an older build
 * returns ONLY `{ stats, recentOrders, topProducts, orderStatusDistribution,
 * lowStockProducts }`. Reading `metrics` alone left every tile blank against
 * such a server — the API call succeeded, so it looked purely like a render
 * bug.
 *
 * The legacy payload has no period comparison, so `previous`/`change` are
 * null: the tiles render a dash rather than inventing a trend.
 */
const LEGACY_TO_METRIC = {
  totalRevenue: 'netRevenue',
  totalOrders: 'orders',
  totalProducts: 'totalProducts',
  totalCustomers: 'totalCustomers',
  pendingOrders: 'awaitingFulfilment',
  pendingReviews: 'pendingReviews',
  newEnquiries: 'newEnquiries',
};

export const normalise = (raw) => {
  if (!raw || typeof raw !== 'object') return null;
  if (raw.metrics) return raw; // already the current shape

  const stats = raw.stats || {};
  const metrics = {};
  for (const [legacyKey, metricId] of Object.entries(LEGACY_TO_METRIC)) {
    if (stats[legacyKey] !== undefined) {
      metrics[metricId] = { value: stats[legacyKey], previous: null, change: null };
    }
  }

  // Derivable from what the old payload does carry.
  if (stats.totalRevenue !== undefined && stats.totalOrders) {
    metrics.averageOrderValue = {
      value: stats.totalRevenue / stats.totalOrders,
      previous: null,
      change: null,
    };
  }

  const statusDistribution = {};
  for (const [status, count] of Object.entries(raw.orderStatusDistribution || {})) {
    statusDistribution[status] = { count, value: 0 };
  }

  return {
    ...raw,
    legacy: true,
    metrics,
    statusDistribution,
    // The old endpoint has no timeseries; the chart shows its empty state.
    series: { current: [], previous: [] },
    paymentSplit: raw.paymentSplit || {},
    catalogueHealth: raw.catalogueHealth || {},
    lists: {
      recentOrders: raw.recentOrders || [],
      topProducts: raw.topProducts || [],
      worstProducts: [],
      topCustomers: [],
      categories: [],
      deadStock: raw.lowStockProducts || [],
    },
    needsAction: [
      { id: 'fulfil', label: 'Orders to fulfil', count: stats.pendingOrders || 0, to: '/orders?status=confirmed' },
      { id: 'reviews', label: 'Reviews to moderate', count: stats.pendingReviews || 0, to: '/reviews' },
      { id: 'enquiries', label: 'New enquiries', count: stats.newEnquiries || 0, to: '/enquiries?status=new' },
    ].filter((a) => a.count > 0),
  };
};

/**
 * Dashboard data source: range selection, fetching, URL sync and sparkline
 * derivation.
 *
 * Mirrors useDataTable's contract (AbortController, URL sync) so both screens
 * behave the same way — a superseded request is cancelled rather than left to
 * race, and the selected range survives a reload or a shared link.
 */
export function useDashboard({ defaultRange = '30d', syncUrl = true } = {}) {
  const route = useRoute();
  const router = useRouter();

  const payload = ref(null);
  const loading = ref(true);
  const error = ref(null);
  const range = ref(
    (syncUrl && route?.query?.range) ? String(route.query.range) : defaultRange
  );

  let controller = null;

  const fetchData = async () => {
    controller?.abort();
    controller = new AbortController();
    const { signal } = controller;

    loading.value = true;
    error.value = null;

    try {
      const res = await analyticsAPI.getDashboard({ range: range.value }, { signal });
      if (signal.aborted) return;
      payload.value = normalise(res?.data ?? res);
    } catch (err) {
      if (err?.name === 'CanceledError' || err?.name === 'AbortError' || signal.aborted) return;
      error.value = err;
    } finally {
      if (!signal.aborted) loading.value = false;
    }
  };

  const syncToUrl = () => {
    if (!syncUrl || !router) return;
    const query = range.value === defaultRange ? {} : { range: range.value };
    if (JSON.stringify(query) !== JSON.stringify(route.query)) {
      router.replace({ query }).catch(() => {});
    }
  };

  watch(range, () => {
    syncToUrl();
    fetchData();
  });

  onUnmounted(() => controller?.abort());

  // ─── Derived ─────────────────────────────────
  const metrics = computed(() => payload.value?.metrics || {});
  const series = computed(() => payload.value?.series || { current: [], previous: [] });
  const needsAction = computed(() => payload.value?.needsAction || []);

  /**
   * Read a dotted path out of the payload, so panels can declare their data
   * source as a string in config ('lists.topProducts') rather than the view
   * knowing every shape.
   */
  const resolve = (path) => {
    if (!path) return undefined;
    return String(path).split('.').reduce((acc, key) => acc?.[key], payload.value);
  };

  /**
   * Per-metric sparkline points, derived from the daily series.
   *
   * Only revenue, orders and AOV vary daily; every other metric is a single
   * aggregate, so drawing a line for it would imply a trend that was never
   * measured. Those tiles get no sparkline rather than a fabricated one.
   */
  const SPARK_SOURCE = {
    netRevenue: 'revenue',
    grossRevenue: 'revenue',
    collectedRevenue: 'revenue',
    orders: 'orders',
    averageOrderValue: 'aov',
  };

  const sparkFor = (metricId) => {
    const key = SPARK_SOURCE[metricId];
    if (!key) return [];
    return series.value.current.map((d) => Number(d[key]) || 0);
  };

  const rangeLabel = computed(() => {
    const r = payload.value?.range;
    if (!r) return '';
    const fmt = (d) =>
      new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
    return `${fmt(r.from)} – ${fmt(r.to)}`;
  });

  fetchData();

  return {
    payload, loading, error, range,
    metrics, series, needsAction, rangeLabel,
    resolve, sparkFor,
    refresh: fetchData,
  };
}

export default useDashboard;
