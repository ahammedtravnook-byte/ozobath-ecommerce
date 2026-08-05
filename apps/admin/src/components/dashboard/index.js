// Dashboard panel components.
//
// PANEL_COMPONENTS is what makes the layout config-driven: a panel entry in
// dashboard.widgets.js names a component here by string, so adding a panel
// type means registering it once and referencing it from config — the view
// itself never changes.

import TrendChart from './TrendChart.vue';
import BarList from './BarList.vue';
import RankList from './RankList.vue';
import SplitPanel from './SplitPanel.vue';
import RecentOrders from './RecentOrders.vue';
import StockList from './StockList.vue';
import HealthList from './HealthList.vue';

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
