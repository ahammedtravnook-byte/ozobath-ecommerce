<template>
  <div>
    <!-- ─── Control bar ─────────────────────────── -->
    <header class="flex items-end justify-between gap-4 flex-wrap mb-4">
      <div>
        <h1 class="text-[22px] font-semibold text-slate-900 tracking-[-0.02em]">Dashboard</h1>
        <p class="text-[13px] text-slate-500 mt-0.5">
          {{ rangeLabel || '…' }} <span class="text-slate-300">·</span> compared with the previous period
        </p>
      </div>

      <div class="flex items-center gap-2">
        <div class="db-seg" role="group" aria-label="Date range">
          <button
            v-for="opt in RANGE_OPTIONS"
            :key="opt.value"
            type="button"
            class="db-seg-btn"
            :class="range === opt.value ? 'db-seg-btn-on' : ''"
            :aria-pressed="range === opt.value"
            @click="range = opt.value"
          >
            {{ opt.label }}
          </button>
        </div>

        <button class="dt-btn" :disabled="loading" @click="refresh">
          <svg
            class="w-4 h-4" :class="loading ? 'animate-spin' : ''"
            fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"
          >
            <path d="M21 12a9 9 0 1 1-2.64-6.36M21 3v6h-6" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
          Refresh
        </button>
      </div>
    </header>

    <!-- ─── Error ───────────────────────────────── -->
    <div v-if="error" class="db-card border-red-200 bg-red-50/50 mb-4">
      <p class="text-[13px] font-medium text-red-800">Could not load the dashboard</p>
      <p class="text-[12.5px] text-red-600 mt-1">
        {{ error.response?.data?.message || error.message || 'Something went wrong.' }}
      </p>
      <button class="dt-btn mt-3" @click="refresh">Try again</button>
    </div>

    <!-- ─── Legacy API notice ───────────────────────
         The deployed API predates this dashboard. It has no period
         comparison and computes revenue with the old paid-only rule, which
         reports ₹0 for COD orders — so say that rather than presenting a
         wrong figure as though it were correct.
    -->
    <div
      v-if="!loading && payload?.legacy"
      class="db-card border-amber-200 bg-amber-50/60 mb-4 py-3"
    >
      <p class="text-[13px] text-amber-900">
        <span class="font-medium">Showing limited data.</span>
        The API this admin is connected to predates the new analytics, so
        period comparison, trends and most metrics are unavailable — and
        revenue still uses the old rule that excludes COD orders.
      </p>
    </div>

    <!-- ─── Needs action ────────────────────────── -->
    <NeedsAction v-if="!loading" :items="needsAction" />

    <!-- ─── Primary KPIs ────────────────────────── -->
    <section
      v-if="primaryKpis.length"
      class="grid gap-3 mb-3"
      :class="kpiGridClass(primaryKpis.length)"
      aria-label="Key metrics"
    >
      <KpiTile
        v-for="id in primaryKpis"
        :key="id"
        :metric="METRICS[id]"
        :data="metrics[id]"
        :spark="sparkFor(id)"
        :loading="loading"
      />
    </section>

    <!-- ─── Secondary KPIs ──────────────────────── -->
    <section
      v-if="secondaryKpis.length"
      class="grid gap-3 mb-3 grid-cols-2 md:grid-cols-3 xl:grid-cols-6"
      aria-label="Secondary metrics"
    >
      <KpiTile
        v-for="id in secondaryKpis"
        :key="id"
        :metric="METRICS[id]"
        :data="metrics[id]"
        :loading="loading"
      />
    </section>

    <!-- ─── Panels ──────────────────────────────── -->
    <!-- Order and composition come entirely from LAYOUT.panels. -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-3">
      <div v-for="panel in panels" :key="panel.id" :class="panelSpanClass(panel.span)">
        <component
          :is="panel.component"
          v-bind="panel.bindings"
          :title="panel.title"
          :subtitle="panel.subtitle"
          :loading="loading"
        />
      </div>
    </div>

    <footer class="mt-6 text-[11.5px] text-slate-400 flex justify-between gap-3 flex-wrap">
      <span>Revenue counts booked orders, excluding cancellations.</span>
      <span v-if="payload">Refreshed {{ refreshedAt }}</span>
    </footer>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import { useDashboard } from '@/composables/useDashboard';
import { METRICS, PANELS, LAYOUT, RANGE_OPTIONS } from '@/config/dashboard.widgets';
import { KpiTile, NeedsAction, PANEL_COMPONENTS } from '@/components/dashboard';

const {
  payload, loading, error, range,
  metrics, series, needsAction, rangeLabel,
  resolve, sparkFor, refresh,
} = useDashboard({ defaultRange: '30d' });

// Guard against a layout referencing a metric that was removed from the
// registry — a stale id should drop the tile, not crash the dashboard.
const primaryKpis = computed(() => LAYOUT.kpis.filter((id) => METRICS[id]));
const secondaryKpis = computed(() => LAYOUT.secondaryKpis.filter((id) => METRICS[id]));

/**
 * Resolve each configured panel into a component plus its bound data.
 * `source` is a dotted path into the payload, so a panel declares where its
 * data lives instead of this view knowing every shape.
 */
const panels = computed(() =>
  LAYOUT.panels
    .map((id) => {
      const def = PANELS[id];
      if (!def) return null;
      const component = PANEL_COMPONENTS[def.component];
      if (!component) return null;

      const { source, ...rest } = def.props || {};
      const bindings = { ...rest };

      if (source === 'series') {
        bindings.series = series.value;
      } else if (source) {
        bindings.data = resolve(source);
      }

      // SplitPanel needs one figure that lives outside its own source.
      if (def.component === 'SplitPanel') {
        bindings.outstanding = metrics.value.outstandingRevenue?.value || 0;
      }

      return { id, component, bindings, title: def.title, subtitle: def.subtitle, span: def.span };
    })
    .filter(Boolean)
);

// Five tiles do not divide evenly into a 4- or 6-column grid, so the column
// count follows the configured tile count rather than being fixed.
const kpiGridClass = (n) => {
  if (n <= 2) return 'grid-cols-1 sm:grid-cols-2';
  if (n === 3) return 'grid-cols-1 sm:grid-cols-3';
  if (n === 4) return 'grid-cols-2 lg:grid-cols-4';
  if (n === 5) return 'grid-cols-2 lg:grid-cols-3 xl:grid-cols-5';
  return 'grid-cols-2 lg:grid-cols-3 xl:grid-cols-6';
};

const panelSpanClass = (span) =>
  span === 'full' ? 'lg:col-span-3' : span === 'wide' ? 'lg:col-span-2' : 'lg:col-span-1';

const refreshedAt = ref('');
watch(payload, (v) => {
  if (v) refreshedAt.value = new Date().toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' });
});
</script>
