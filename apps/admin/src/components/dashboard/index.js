// Dashboard panel components.
//
// PANEL_COMPONENTS is what makes the layout config-driven: a panel entry in
// dashboard.widgets.js names a component here by string, so adding a panel
// type means registering it once and referencing it from config — the view
// itself never changes.

import { defineAsyncComponent, h } from 'vue';
import BarList from './BarList.vue';
import RankList from './RankList.vue';
import SplitPanel from './SplitPanel.vue';
import RecentOrders from './RecentOrders.vue';
import StockList from './StockList.vue';
import HealthList from './HealthList.vue';

// TrendChart is the only component that pulls in Chart.js (~66KB gzipped).
// Loading it asynchronously keeps that out of the dashboard's initial chunk,
// so the KPI tiles and lists paint without waiting on the charting library.
const TrendChart = defineAsyncComponent({
  loader: () => import('./TrendChart.vue'),
  // Reserve the panel's height while the chunk loads, so the panels below it
  // do not jump once the chart resolves.
  //
  // A render function, not a `template`: the default Vue build ships the
  // runtime only, and this app sets no alias to the full build, so a runtime
  // template string would never compile.
  loadingComponent: {
    render: () =>
      h('section', { class: 'db-card' }, [
        h('div', { class: 'dt-skel h-4 w-40 mb-2' }),
        h('div', { class: 'dt-skel h-3 w-56 mb-4' }),
        h('div', { class: 'dt-skel h-[260px] w-full rounded-lg' }),
      ]),
  },
  // Skip the placeholder entirely when the chunk is already cached.
  delay: 120,
});

export { default as KpiTile } from './KpiTile.vue';
export { default as Sparkline } from './Sparkline.vue';
export { default as NeedsAction } from './NeedsAction.vue';
export { TrendChart, BarList, RankList, SplitPanel, RecentOrders, StockList, HealthList };

export const PANEL_COMPONENTS = {
  TrendChart,
  BarList,
  RankList,
  SplitPanel,
  RecentOrders,
  StockList,
  HealthList,
};
