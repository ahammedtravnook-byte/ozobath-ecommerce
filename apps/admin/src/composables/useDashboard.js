import { ref, computed, watch, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { analyticsAPI } from '@/api/services';

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
      payload.value = res?.data ?? res;
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
