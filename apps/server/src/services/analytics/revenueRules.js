// ============================================
// OZOBATH - Revenue Recognition Rules
// ============================================
// THE single place that decides what counts as revenue. Every dashboard
// figure, report and export derives from the predicates here, so changing the
// policy means editing this file and nothing else.
//
// ─── Why this file exists ───────────────────────────────────────────────
// The dashboard previously summed orders matching { paymentStatus: 'paid' }.
// COD orders stay 'pending' until cash is collected on delivery, and this
// business is COD-dominant — so a catalogue with 7 real orders worth ₹33,032
// reported ₹0 revenue. The figure was not slightly wrong; it was structurally
// incapable of being right.
//
// ─── The policy ─────────────────────────────────────────────────────────
// BOOKED   — every order except cancelled/returned, regardless of payment
//            method. A COD parcel in transit is revenue you have earned but
//            not yet banked. This is the headline number.
// COLLECTED— money actually in hand: prepaid orders marked paid, plus COD
//            orders that reached 'delivered'. Reported alongside booked so
//            the gap between the two is visible rather than hidden.
// GROSS    — booked before discounts.
// NET      — booked after discounts (i.e. what was actually charged).
//
// Swap `BOOKED_STATUSES` or `isCollected` below to change the definition; no
// caller needs to know.

// Orders in these states never count toward revenue.
const EXCLUDED_STATUSES = ['cancelled', 'returned'];

// Everything else is booked.
const BOOKED_STATUSES = [
  'pending',
  'confirmed',
  'processing',
  'shipped',
  'delivered',
];

// COD is only collected once the parcel is delivered.
const COD_COLLECTED_STATUSES = ['delivered'];

/**
 * $match fragment for booked revenue.
 * Spread into an aggregation stage: { $match: { ...bookedMatch(), ...range } }
 */
const bookedMatch = () => ({ status: { $in: BOOKED_STATUSES } });

/** $match fragment for the orders excluded from revenue. */
const cancelledMatch = () => ({ status: { $in: EXCLUDED_STATUSES } });

/**
 * $match fragment for cash actually received.
 * Prepaid must be marked paid; COD must have been delivered.
 */
const collectedMatch = () => ({
  $or: [
    { paymentMethod: { $ne: 'cod' }, paymentStatus: 'paid' },
    { paymentMethod: 'cod', status: { $in: COD_COLLECTED_STATUSES } },
  ],
});

/**
 * Build a createdAt range fragment. Returns {} when both bounds are absent, so
 * it always spreads cleanly into a $match.
 */
const dateRangeMatch = (from, to) => {
  if (!from && !to) return {};
  const createdAt = {};
  if (from) createdAt.$gte = from instanceof Date ? from : new Date(from);
  if (to) createdAt.$lte = to instanceof Date ? to : new Date(to);
  return Object.keys(createdAt).length ? { createdAt } : {};
};

/**
 * The standard revenue aggregation group. `total` is post-discount (what was
 * charged); `gross` adds discounts back so discount cost is derivable.
 */
const revenueGroup = () => ({
  _id: null,
  net: { $sum: '$total' },
  gross: { $sum: { $add: ['$total', { $ifNull: ['$discount', 0] }] } },
  discount: { $sum: { $ifNull: ['$discount', 0] } },
  tax: { $sum: { $ifNull: ['$tax', 0] } },
  shipping: { $sum: { $ifNull: ['$shippingCost', 0] } },
  orders: { $sum: 1 },
  items: { $sum: { $size: { $ifNull: ['$items', []] } } },
});

/** Zeroed shape, so callers never branch on "no orders yet". */
const emptyRevenue = () => ({
  net: 0, gross: 0, discount: 0, tax: 0, shipping: 0, orders: 0, items: 0,
});

/** Average order value. Guarded: 0 orders must not produce NaN or Infinity. */
const averageOrderValue = (net, orders) => (orders > 0 ? net / orders : 0);

/**
 * Percentage change between two periods.
 * Returns null — not 0 and not Infinity — when the baseline is zero, because
 * "grew from nothing" is not a percentage and should render as "new", not
 * "+0%" or "+∞%".
 */
const percentChange = (current, previous) => {
  if (previous === 0) return current === 0 ? 0 : null;
  return ((current - previous) / Math.abs(previous)) * 100;
};

/** Share of a whole, guarded against division by zero. */
const rate = (part, whole) => (whole > 0 ? (part / whole) * 100 : 0);

module.exports = {
  EXCLUDED_STATUSES,
  BOOKED_STATUSES,
  COD_COLLECTED_STATUSES,
  bookedMatch,
  cancelledMatch,
  collectedMatch,
  dateRangeMatch,
  revenueGroup,
  emptyRevenue,
  averageOrderValue,
  percentChange,
  rate,
};
