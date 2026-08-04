// ============================================
// OZOBATH - Order Totals Calculator
// ============================================
// SINGLE SOURCE OF TRUTH for what a cart costs.
//
// Every path that prices a cart must call this — the Razorpay init, the
// Razorpay confirm, and the COD order creation. Previously each computed
// its own totals, and the Razorpay paths used a flat shipping rule while
// COD used per-product delivery, so the same cart cost a different amount
// depending on the payment method chosen.
//
// The client mirrors this logic in apps/client/src/utils/calculateTotals.js
// for display only. Keep the two in sync — the server value always wins.

const env = require('../config/env');

const TAX_RATE = env.TAX_RATE;         // GST, as a fraction (0.18 = 18%)
const FREE_SHIPPING_THRESHOLD = 2999;  // subtotal at/above which shipping is free
const FLAT_SHIPPING_COST = 99;         // fallback shipping when no per-product rule applies

// ─── Shipping ────────────────────────────────────
// Precedence (highest first):
//   1. Every item has freeDelivery      → 0
//   2. Any item has deliveryCharge > 0  → the HIGHEST such charge (not a sum)
//   3. Otherwise                        → free above the threshold, else flat
//
// Note on rule 2: a cart mixing a freeDelivery item with a ₹300-charge item
// bills ₹300 — the free-delivery flag on the other item is not a discount.
// This preserves the long-standing COD behaviour; changing it is a pricing
// decision, not a refactor.
const calculateShipping = (deliveryData, subtotal) => {
    // Nothing to ship, nothing to charge. Guarded explicitly because
    // every() on an empty array returns true and the threshold rule below
    // would otherwise bill the flat rate on a zero-item cart.
    if (deliveryData.length === 0) return 0;

    if (deliveryData.every((d) => d.freeDelivery)) return 0;

    const maxCustomCharge = deliveryData.reduce(
        (max, d) => Math.max(max, d.deliveryCharge || 0),
        0
    );
    if (maxCustomCharge > 0) return maxCustomCharge;

    return subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : FLAT_SHIPPING_COST;
};

// ─── Discount ────────────────────────────────────
// Returns the rupee discount for a coupon against a subtotal, or 0 if the
// coupon is absent or the subtotal misses its minimum. Validity, usage
// limits and per-user limits are the caller's responsibility — this is
// arithmetic only, so it stays safe to call from the display path.
const calculateDiscount = (coupon, subtotal) => {
    if (!coupon) return 0;
    if (coupon.minOrderAmount && subtotal < coupon.minOrderAmount) return 0;

    const raw =
        coupon.type === 'percentage'
            ? Math.min((subtotal * coupon.value) / 100, coupon.maxDiscount || Infinity)
            : coupon.value;

    // Never discount more than the goods are worth.
    return Math.min(Math.round(raw), subtotal);
};

// ─── Totals ──────────────────────────────────────
// items:  populated cart items — [{ product: { price, freeDelivery, deliveryCharge, isActive }, quantity }]
// coupon: the coupon document, or null
// options.skipInactive: drop items whose product is missing or inactive (default true)
//
// Returns { subtotal, shippingCost, tax, discount, total, activeItems }.
// `activeItems` is the filtered list the totals were computed from, so
// callers build order line items from exactly what they charged for.
const calculateTotals = (items = [], coupon = null, options = {}) => {
    const { skipInactive = true } = options;

    const activeItems = skipInactive
        ? items.filter((i) => i.product && i.product.isActive !== false)
        : items.filter((i) => i.product);

    // Defence in depth. A non-positive or fractional quantity here means a
    // validation layer upstream has already failed, and the consequences are
    // silent and financial: a negative line drives the subtotal down (the
    // total floors at 0, but subtotal, tax and taxableValue all persist
    // negative), and a fractional line is a straight discount that the
    // Razorpay reconciliation cannot catch — both sides of that comparison
    // derive from this number. Fail loudly rather than price the order wrong.
    for (const i of activeItems) {
        if (!Number.isInteger(i.quantity) || i.quantity < 1) {
            throw new Error(
                `Invalid line item quantity: ${i.quantity}. Quantity must be a positive integer.`
            );
        }
    }

    const subtotal = activeItems.reduce(
        (sum, i) => sum + (i.product.price || 0) * i.quantity,
        0
    );

    const deliveryData = activeItems.map((i) => ({
        freeDelivery: i.product.freeDelivery || false,
        deliveryCharge: i.product.deliveryCharge || 0,
    }));

    const shippingCost = calculateShipping(deliveryData, subtotal);
    const discount = calculateDiscount(coupon, subtotal);

    const { tax, total, taxableValue } = calculateTax({
        subtotal,
        shippingCost,
        discount,
        mode: options.taxMode || env.TAX_MODE,
        taxShipping: options.taxOnShipping !== undefined ? options.taxOnShipping : env.TAX_ON_SHIPPING,
        afterDiscount: options.taxAfterDiscount !== undefined ? options.taxAfterDiscount : env.TAX_AFTER_DISCOUNT,
        rate: TAX_RATE,
    });

    return { subtotal, shippingCost, tax, discount, total, taxableValue, activeItems };
};

// ─── Tax ─────────────────────────────────────────
// Three independent switches, all defaulting to the behaviour this codebase
// shipped with, so enabling them is a deliberate act:
//
//   mode = 'exclusive'    tax is ADDED to the price the customer saw (default)
//        = 'inclusive'    tax is EXTRACTED from it — standard Indian retail MRP,
//                         where the listed price is what the customer pays
//   taxShipping           include the delivery charge in the taxable value.
//                         GST treats delivery on a composite supply as taxable
//                         at the principal item's rate; this is currently off,
//                         which under-collects.
//   afterDiscount         tax the discounted value rather than the gross.
//                         CGST s.15(3)(a) excludes discounts recorded on the
//                         invoice at the time of supply from taxable value.
//
// Returns the tax, the order total, and the taxable value the tax was
// computed on — the last is what belongs on a GST invoice.
const calculateTax = ({ subtotal, shippingCost, discount, mode, taxShipping, afterDiscount, rate }) => {
    // Build the base the tax applies to.
    let base = subtotal;
    if (afterDiscount) base = Math.max(0, base - discount);
    if (taxShipping) base += shippingCost;

    if (mode === 'inclusive') {
        // The price already contains the tax: extract rather than add.
        // base * rate / (1 + rate) — e.g. ₹118 at 18% contains ₹18 of tax.
        const tax = Math.round((base * rate) / (1 + rate));
        // Nothing is added on top; the customer pays what they were shown.
        const total = Math.max(0, subtotal + shippingCost - discount);
        return { tax, total, taxableValue: base - tax };
    }

    // Exclusive: tax sits on top of the displayed price.
    const tax = Math.round(base * rate);
    const total = Math.max(0, subtotal + shippingCost + tax - discount);
    return { tax, total, taxableValue: base };
};

module.exports = {
    calculateTotals,
    calculateShipping,
    calculateDiscount,
    calculateTax,
    TAX_RATE,
    FREE_SHIPPING_THRESHOLD,
    FLAT_SHIPPING_COST,
};
