// ============================================
// OZOBATH - Express App Setup
// ============================================
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const compression = require('compression');
const path = require('path');

const env = require('./config/env');
const errorHandler = require('./middleware/errorHandler');
const sanitizeMongo = require('./middleware/sanitizeMongo');
const { apiLimiter } = require('./middleware/rateLimiter');

const app = express();

// ─── Proxy Trust ─────────────────────────────────────
// Behind Nginx every request originates from 127.0.0.1, so without this the
// rate limiter treats all traffic as a single client (one attacker locks out
// every customer) and req.ip is useless for logging.
//
// The value MUST stay `1` (exactly one proxy hop). Using `true` would trust a
// client-supplied X-Forwarded-For chain, letting anyone spoof their IP and
// bypass the login rate limiter entirely.
if (env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

// ─── Security ────────────────────────────────────────
// helmet() defaults, plus the ones its defaults leave off.
app.use(helmet({
  // This is a JSON API — it serves no HTML, so the strictest possible policy
  // is also the correct one. Relevant if any response is ever rendered
  // directly by a browser (an error page, a redirect target).
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'none'"],
      frameAncestors: ["'none'"],
      baseUri: ["'none'"],
      formAction: ["'none'"],
    },
  },
  // Force HTTPS for a year once seen. Only meaningful in production behind
  // real TLS; sending it from a plain-HTTP dev server would poison localhost.
  hsts: env.NODE_ENV === 'production'
    ? { maxAge: 31536000, includeSubDomains: true, preload: true }
    : false,
  crossOriginResourcePolicy: { policy: 'cross-origin' },  // SPAs are on another origin
  referrerPolicy: { policy: 'no-referrer' },
}));

// Do not advertise the framework.
app.disable('x-powered-by');

// ─── CORS ────────────────────────────────────────────
// `*.vercel.app` and `*.railway.app` are SHARED public deployment domains.
// Trusting the whole suffix with `credentials: true` meant anyone could
// deploy to attacker.vercel.app, call /auth/refresh with the victim's
// sameSite:'none' cookie attached, and read the fresh access token out of
// the JSON response.
//
// Exact origins only, from config. Preview deployments must match a specific
// project pattern and are disabled entirely in production.
const PREVIEW_ORIGIN = /^https:\/\/ozobath-[a-z0-9-]+\.vercel\.app$/;

const isAllowedOrigin = (origin) => {
  const allowed = [env.CLIENT_URL, env.ADMIN_URL, ...env.EXTRA_CORS_ORIGINS].filter(Boolean);
  if (allowed.includes(origin)) return true;
  if (env.NODE_ENV !== 'production' && PREVIEW_ORIGIN.test(origin)) return true;
  return false;
};

app.use(cors({
  origin: (origin, callback) => {
    // Requests with no Origin header (curl, server-to-server, native apps).
    // Browsers always send Origin cross-origin, so this does not weaken the
    // browser-facing protection above.
    if (!origin) return callback(null, true);
    if (isAllowedOrigin(origin)) return callback(null, true);
    callback(new Error(`CORS: ${origin} not allowed`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
}));

// ─── Body Parsing ────────────────────────────────────
// 10mb on every route was generous: it is the ceiling on how much a single
// unauthenticated request to a public POST endpoint can store. Image uploads
// go through multer (which has its own 10mb limit), not through the JSON
// parser, so a much smaller cap is sufficient here.
// `verify` captures the raw bytes before parsing. Webhook signatures are
// computed over the exact payload sent, so re-serialising the parsed object
// would produce a different digest and every signature would fail.
app.use(express.json({
  limit: '100kb',
  verify: (req, res, buf) => { req.rawBody = buf; },
}));
app.use(express.urlencoded({ extended: true, limit: '100kb' }));
app.use(cookieParser());
app.use(compression());

// Strip MongoDB operator keys ($ne, $regex, $where, dotted paths) from body
// and query before any handler builds a filter from them.
app.use(sanitizeMongo);

// ─── Logging ─────────────────────────────────────────
// 'combined' (Apache format) in production so PM2/Nginx logs correlate and
// client IPs are recorded; concise 'dev' output locally.
if (env.NODE_ENV === 'production') {
  app.use(morgan('combined'));
} else {
  app.use(morgan('dev'));
}

// ─── Rate Limiting ───────────────────────────────────
app.use('/api/', apiLimiter);

// ─── Health Check ────────────────────────────────────
// Public liveness probe — deliberately says nothing about the deployment.
// `environment` was disclosed here, which is free reconnaissance.
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'OZOBATH API is running 🚿',
    timestamp: new Date().toISOString(),
  });
});

// ─── API Routes ──────────────────────────────────────
app.use('/api/v1/auth', require('./routes/auth.routes'));
app.use('/api/v1/users', require('./routes/user.routes'));
app.use('/api/v1/products', require('./routes/product.routes'));
app.use('/api/v1/categories', require('./routes/category.routes'));
app.use('/api/v1/orders', require('./routes/order.routes'));
app.use('/api/v1/cart', require('./routes/cart.routes'));
app.use('/api/v1/wishlist', require('./routes/wishlist.routes'));
app.use('/api/v1/reviews', require('./routes/review.routes'));
app.use('/api/v1/coupons', require('./routes/coupon.routes'));
app.use('/api/v1/content', require('./routes/content.routes'));
app.use('/api/v1/banners', require('./routes/banner.routes'));
app.use('/api/v1/blogs', require('./routes/blog.routes'));
app.use('/api/v1/faqs', require('./routes/faq.routes'));
app.use('/api/v1/testimonials', require('./routes/testimonial.routes'));
app.use('/api/v1/enquiries', require('./routes/enquiry.routes'));
app.use('/api/v1/service-requests', require('./routes/service.routes'));
app.use('/api/v1/bookings', require('./routes/booking.routes'));
app.use('/api/v1/newsletter', require('./routes/newsletter.routes'));
app.use('/api/v1/upload', require('./routes/upload.routes'));
app.use('/api/v1/payment', require('./routes/payment.routes'));
app.use('/api/v1/analytics', require('./routes/analytics.routes'));
app.use('/api/v1/admin', require('./routes/admin.routes'));
app.use('/api/v1/reels', require('./routes/reel.routes'));
app.use('/api/v1/video-tours', require('./routes/videoTour.routes'));
app.use('/api/v1/shipping', require('./routes/shipping.routes'));
app.use('/api/v1/notifications', require('./routes/notification.routes'));
app.use('/api/v1/admin-notifications', require('./routes/adminNotification.routes'));
app.use('/api/v1/activity-logs', require('./routes/activityLog.routes'));

// ─── 404 Handler ─────────────────────────────────────
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
  });
});

// ─── Global Error Handler ────────────────────────────
app.use(errorHandler);

module.exports = app;
