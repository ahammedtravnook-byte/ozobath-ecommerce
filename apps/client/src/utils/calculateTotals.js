// ============================================
// OZOBATH - Order Totals Calculator (client mirror)
// ============================================
// DISPLAY ONLY. Mirrors apps/server/src/utils/calculateTotals.js so the
// customer sees the same number they will be charged. The server always
// recomputes and its value wins — never send these totals to the API.
//
// Keep in sync with the server file. If you change a rule there, change it
// here in the same commit.

// Tax flags must match the server's .env. Vite inlines these at build time,
// so a mismatch shows the customer one number and charges another — set them
// in the same commit you change the server, and rebuild the client.
export const TAX_RATE = Number(import.meta.env.VITE_TAX_RATE ?? 0.18);
export const TAX_MODE = (import.meta.env.VITE_TAX_MODE || 'exclusive').toLowerCase();
export const TAX_ON_SHIPPING = import.meta.env.VITE_TAX_ON_SHIPPING === 'true';
export const TAX_AFTER_DISCOUNT = import.meta.env.VITE_TAX_AFTER_DISCOUNT === 'true';

export const FREE_SHIPPING_THRESHOLD = 2999;
export const FLAT_SHIPPING_COST = 99;

// Precedence: all-free → highest per-product charge → threshold/flat.
// See the server file for the reasoning on mixed carts.
export const calculateShipping = (deliveryData, subtotal) => {
    // Empty cart ships for free — see the server file for why this is explicit.
    if (deliveryData.length === 0) return 0;

    if (deliveryData.every((d) => d.freeDelivery)) return 0;

    const maxCustomCharge = deliveryData.reduce(
        (max, d) => Math.max(max, d.deliveryCharge || 0),
        0
    );
    if (maxCustomCharge > 0) return maxCustomCharge;

    return subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : FLAT_SHIPPING_COST;
};

// items:    cart items from the API — [{ product: {...}, quantity }]
// discount: rupee discount already resolved by the server's coupon endpoint
//           (the client does not price coupons itself)
export const calculateTotals = (items = [], discount = 0) => {
    const activeItems = items.filter((i) => i.product && i.product.isActive !== false);

    const subtotal = activeItems.reduce(
        (sum, i) => sum + (i.product.price || 0) * i.quantity,
        0
    );

    const deliveryData = activeItems.map((i) => ({
        freeDelivery: i.product.freeDelivery || false,
        deliveryCharge: i.product.deliveryCharge || 0,
    }));

    const shippingCost = calculateShipping(deliveryData, subtotal);
    const safeDiscount = Math.min(discount || 0, subtotal);

    // Mirrors the server's calculateTax — see that file for the GST reasoning.
    let base = subtotal;
    if (TAX_AFTER_DISCOUNT) base = Math.max(0, base - safeDiscount);
    if (TAX_ON_SHIPPING) base += shippingCost;

    if (TAX_MODE === 'inclusive') {
        // Price already contains the tax: show it as included, add nothing.
        const tax = Math.round((base * TAX_RATE) / (1 + TAX_RATE));
        const total = Math.max(0, subtotal + shippingCost - safeDiscount);
        return { subtotal, shippingCost, tax, discount: safeDiscount, total, taxIncluded: true };
    }

    const tax = Math.round(base * TAX_RATE);
    const total = Math.max(0, subtotal + shippingCost + tax - safeDiscount);

    return { subtotal, shippingCost, tax, discount: safeDiscount, total, taxIncluded: false };
};
