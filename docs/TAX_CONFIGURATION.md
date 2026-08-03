# Tax / GST Configuration

Three flags control how GST is applied. **All default to the behaviour the
codebase shipped with, so deploying this changes nothing.** Each one is a tax
decision, not a technical one — confirm with the CA / client before flipping it.

Set them in `apps/server/.env`, and mirror them in `apps/client/.env` with the
`VITE_` prefix. **The client must be rebuilt after any change** — Vite inlines
these at build time, and a mismatch shows the customer one total while the
server charges another.

| Server (`.env`) | Client (`.env`) | Default |
|---|---|---|
| `TAX_MODE` | `VITE_TAX_MODE` | `exclusive` |
| `TAX_RATE` | `VITE_TAX_RATE` | `0.18` |
| `TAX_ON_SHIPPING` | `VITE_TAX_ON_SHIPPING` | `false` |
| `TAX_AFTER_DISCOUNT` | `VITE_TAX_AFTER_DISCOUNT` | `false` |

---

## 1. `TAX_MODE` — inclusive vs exclusive

**The highest-impact flag.** Decides whether the price on the product page is
what the customer pays.

- `exclusive` *(current)* — GST is **added** to the listed price.
- `inclusive` — GST is **extracted** from it. The listed price is the final
  price; tax is shown as "included".

A ₹45,999 product:

| | Customer pays | GST line |
|---|---|---|
| `exclusive` *(current)* | **₹54,279** | ₹8,280 added |
| `inclusive` | **₹45,999** | ₹7,017 included |

**Why this matters here.** Indian retail MRP is GST-inclusive by law, and the
seed data has retail shape (`price: 45999, compareAtPrice: 59999`). If ₹45,999
is meant to be the shelf price, the store is currently charging 18% over it.

Extraction formula: `tax = base × rate ÷ (1 + rate)`. ₹118 at 18% contains
exactly ₹18 of tax.

## 2. `TAX_ON_SHIPPING`

Whether the delivery charge is part of the taxable value.

Currently `false`, meaning **shipping goes out with zero GST**. Under GST,
delivery on a composite supply is normally taxable at the principal item's
rate — so this direction is an *under-collection*, money that would be owed on
filing. On a ₹300 delivery charge that is ₹54.

## 3. `TAX_AFTER_DISCOUNT`

Whether coupons reduce the taxable value.

Currently `false`: tax is computed on the gross subtotal, then the discount is
subtracted. CGST **s.15(3)(a)** excludes discounts recorded on the invoice at
the time of supply from the taxable value — and checkout coupons are exactly
that: applied before payment, shown on the invoice.

On a ₹10,000 cart with a ₹2,000 coupon:

| | Taxable value | GST |
|---|---|---|
| `false` *(current)* | ₹10,000 | ₹1,800 |
| `true` | ₹8,000 | ₹1,440 |

The customer is currently overcharged **₹360**.

---

## Recommended target (pending CA confirmation)

If the CA confirms prices are MRP-inclusive and delivery is part of the supply:

```env
TAX_MODE=inclusive
TAX_RATE=0.18
TAX_ON_SHIPPING=true
TAX_AFTER_DISCOUNT=true
```

## Rollout

1. Confirm each of the three with the CA / client.
2. Change `apps/server/.env`, restart the server.
3. Change `apps/client/.env` to match, **rebuild and redeploy the client**.
4. Place one test order and check that the checkout summary, the Razorpay
   dashboard amount, and `order.total` in Mongo all agree.

## Per-order audit trail

Every order records `taxableValue`, `taxMode`, and `taxRate` as it was at the
time of sale, so changing config later never retroactively reinterprets an
existing invoice. Razorpay orders freeze the same values in `PendingCheckout`
at quote time, so a config change mid-payment cannot alter an order already
quoted to the customer.

## Known limitations

- **One rate for everything.** There is no per-product HSN code or rate. Bath
  fittings are typically 18%, but if any product falls in a different slab it
  is currently taxed wrongly regardless of these flags. Fixing that needs an
  `hsnCode` + `taxRate` field on `Product`.
- **No CGST/SGST/IGST split.** Tax is stored as a single figure. A GST invoice
  needs it split by place of supply — intra-state (CGST+SGST) vs inter-state
  (IGST) — derived from the shipping state against the seller's registered
  state. `taxableValue` is persisted so the split can be derived later.
- **No GSTIN capture** for B2B buyers claiming input credit.
