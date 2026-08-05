// ============================================
// OZOBATH - Dashboard Widget Registry
// ============================================
// The dashboard is assembled from this file. Adding, removing or reordering a
// stat or a panel is a change here — no component or view edits.
//
//   • METRICS  — every KPI the API can return, keyed by the id the server
//                emits in `metrics`. Declaring one does not display it.
//   • LAYOUT   — what is actually on screen, in order. This is the file you
//                edit to change the dashboard.
//
// Adding a KPI tile:
//   1. server emits `metrics.myThing` (services/analytics)
//   2. add a METRICS entry describing how to format it
//   3. add its id to LAYOUT.kpis
//
// Removing one: delete it from LAYOUT.kpis. The metric keeps arriving and can
// be restored without touching the backend.

// ─── Formatters ─────────────────────────────────
// Kept here rather than in components so a metric's presentation travels with
// its definition.

const inr = (n) => `₹${Math.round(Number(n) || 0).toLocaleString('en-IN')}`;

// Compact currency for tiles, where ₹4,86,240 would wrap: ₹4.9L, ₹1.2Cr.
const inrCompact = (n) => {
  const v = Number(n) || 0;
  if (Math.abs(v) >= 1e7) return `₹${(v / 1e7).toFixed(2)}Cr`;
  if (Math.abs(v) >= 1e5) return `₹${(v / 1e5).toFixed(2)}L`;
  if (Math.abs(v) >= 1e3) return `₹${(v / 1e3).toFixed(1)}K`;
  return `₹${Math.round(v)}`;
};

const count = (n) => Number(n ?? 0).toLocaleString('en-IN');
const percent = (n) => `${(Number(n) || 0).toFixed(1)}%`;

// null means "not measurable yet" — render a dash, never "0 hrs", which would
// read as instant fulfilment.
const hours = (n) => {
  if (n === null || n === undefined) return '—';
  const v = Number(n);
  if (v < 24) return `${Math.round(v)}h`;
  return `${(v / 24).toFixed(1)}d`;
};

export const FORMATTERS = { inr, inrCompact, count, percent, hours };

// ─── Metric catalogue ───────────────────────────
// `invert: true` marks metrics where an increase is bad, so the delta colours
// flip. Cancellations rising is not a green number.

export const METRICS = {
  netRevenue: {
    label: 'Net revenue', format: inrCompact, exact: inr,
    hint: 'Booked orders excluding cancellations, after discounts',
    to: '/orders',
  },
  collectedRevenue: {
    label: 'Collected', format: inrCompact, exact: inr,
    hint: 'Prepaid paid, plus COD delivered — cash actually in hand',
    to: '/orders?paymentStatus=paid',
  },
  outstandingRevenue: {
    label: 'Outstanding', format: inrCompact, exact: inr,
    hint: 'Booked but not yet collected — mostly COD in transit',
    to: '/orders?status=shipped',
  },
  grossRevenue: {
    label: 'Gross revenue', format: inrCompact, exact: inr,
    hint: 'Before discounts',
  },
  orders: {
    label: 'Orders', format: count,
    hint: 'Orders placed, excluding cancellations',
    to: '/orders',
  },
  averageOrderValue: {
    label: 'Avg order value', format: inr,
    hint: 'Net revenue ÷ orders',
  },
  itemsSold: { label: 'Items sold', format: count },
  discountTotal: {
    label: 'Discount cost', format: inr, invert: true,
    hint: 'Total discount given across booked orders',
  },
  discountRate: {
    label: 'Discount rate', format: percent, invert: true,
    hint: 'Discount as a share of gross revenue',
  },
  cancelledOrders: {
    label: 'Cancelled', format: count, invert: true,
    to: '/orders?status=cancelled',
  },
  cancelledValue: { label: 'Cancelled value', format: inr, invert: true },
  cancellationRate: {
    label: 'Cancellation rate', format: percent, invert: true,
    hint: 'Cancelled orders as a share of all orders placed',
  },

  activeBuyers: { label: 'Active buyers', format: count, hint: 'Customers who ordered in this period' },
  newBuyers: { label: 'New buyers', format: count, hint: 'First-ever order in this period' },
  returningBuyers: { label: 'Returning buyers', format: count },
  repeatPurchaseRate: {
    label: 'Repeat rate', format: percent,
    hint: 'Share of buyers who had ordered before this period',
  },
  newSignups: { label: 'New signups', format: count, to: '/customers' },
  totalCustomers: { label: 'Total customers', format: count, to: '/customers' },

  awaitingFulfilment: {
    label: 'Awaiting fulfilment', format: count, invert: true,
    to: '/orders?status=confirmed',
  },
  overdueShipments: {
    label: 'Overdue', format: count, invert: true,
    hint: 'Confirmed more than 2 days ago, still not shipped',
    to: '/orders?status=confirmed',
  },
  failedPayments: { label: 'Failed payments', format: count, invert: true, to: '/orders?paymentStatus=failed' },
  hoursToShip: { label: 'Time to ship', format: hours, invert: true, hint: 'Average order → shipped' },
  hoursToDeliver: { label: 'Time to deliver', format: hours, invert: true, hint: 'Average order → delivered' },

  lowStock: { label: 'Low stock', format: count, invert: true, to: '/inventory?stockStatus=low' },
  outOfStock: { label: 'Out of stock', format: count, invert: true, to: '/inventory?stockStatus=out' },
  inventoryValueAtCost: {
    label: 'Stock value', format: inrCompact, exact: inr,
    hint: 'Units on hand × cost price, falling back to retail where cost is unset',
    to: '/inventory',
  },
  deadStockCount: {
    label: 'Dead stock', format: count, invert: true,
    hint: 'In stock, no sale in 60 days',
    to: '/inventory',
  },
  totalProducts: { label: 'Products', format: count, to: '/products' },
  pendingReviews: { label: 'Reviews pending', format: count, invert: true, to: '/reviews' },
  newEnquiries: { label: 'New enquiries', format: count, to: '/enquiries?status=new' },
};

// ─── Panels ─────────────────────────────────────
// `component` names a registered panel type; `props` configures it. A panel
// reads its data from the dashboard payload via `source` (a dotted path).

export const PANELS = {
  revenueTrend: {
    component: 'TrendChart',
    title: 'Revenue over time',
    subtitle: 'Daily totals, excluding cancellations',
    span: 'full',
    props: {
      source: 'series',
      metrics: [
        { key: 'revenue', label: 'Revenue', format: inr },
        { key: 'orders', label: 'Orders', format: count },
        { key: 'aov', label: 'AOV', format: inr },
      ],
    },
  },
  orderStatus: {
    component: 'BarList',
    title: 'Order status',
    subtitle: 'Where orders sit right now',
    props: { source: 'statusDistribution', valueKey: 'count', linkBase: '/orders?status=' },
  },
  categoryRevenue: {
    component: 'BarList',
    title: 'Sales by category',
    subtitle: 'Share of net revenue',
    props: { source: 'lists.categories', labelKey: 'name', valueKey: 'revenue', format: inr },
  },
  paymentSplit: {
    component: 'SplitPanel',
    title: 'Payment method',
    subtitle: 'Share of net revenue',
    props: { source: 'paymentSplit' },
  },
  recentOrders: {
    component: 'RecentOrders',
    title: 'Recent orders',
    subtitle: 'Newest first',
    span: 'wide',
    props: { source: 'lists.recentOrders', to: '/orders' },
  },
  lowStockList: {
    component: 'StockList',
    title: 'Needs restocking',
    subtitle: 'Dead stock and low cover',
    props: { source: 'lists.deadStock', to: '/inventory' },
  },
  topProducts: {
    component: 'RankList',
    title: 'Top products',
    subtitle: 'By revenue in period',
    props: { source: 'lists.topProducts', labelKey: 'name', valueKey: 'revenue', metaKey: 'units', metaSuffix: 'sold', format: inr },
  },
  worstProducts: {
    component: 'RankList',
    title: 'Not selling',
    subtitle: 'Active products with no sales in period',
    props: { source: 'lists.worstProducts', labelKey: 'name', valueKey: 'stock', metaKey: 'units', metaSuffix: 'sold', format: count, valueSuffix: 'in stock' },
  },
  topCustomers: {
    component: 'RankList',
    title: 'Top customers',
    subtitle: 'By lifetime value',
    props: { source: 'lists.topCustomers', labelKey: 'name', valueKey: 'lifetimeValue', metaKey: 'orders', metaSuffix: 'orders', format: inr },
  },
  catalogueHealth: {
    component: 'HealthList',
    title: 'Catalogue health',
    subtitle: 'Fields missing across active products',
    props: { source: 'catalogueHealth' },
  },
};

// ─── Layout ─────────────────────────────────────
// THIS is the dashboard. Reorder, add or remove entries here.

export const LAYOUT = {
  kpis: [
    'netRevenue',
    'orders',
    'averageOrderValue',
    'collectedRevenue',
    'repeatPurchaseRate',
  ],

  // Second row of smaller stats. Empty this array to hide the row entirely.
  secondaryKpis: [
    'outstandingRevenue',
    'cancellationRate',
    'discountRate',
    'hoursToDeliver',
    'inventoryValueAtCost',
    'deadStockCount',
  ],

  panels: [
    'revenueTrend',
    'orderStatus',
    'categoryRevenue',
    'paymentSplit',
    'recentOrders',
    'lowStockList',
    'topProducts',
    'worstProducts',
    'topCustomers',
  ],
};

export const RANGE_OPTIONS = [
  { value: 'today', label: 'Today' },
  { value: '7d', label: '7 days' },
  { value: '30d', label: '30 days' },
  { value: '90d', label: '90 days' },
  { value: 'mtd', label: 'This month' },
];

export default { METRICS, PANELS, LAYOUT, RANGE_OPTIONS, FORMATTERS };
