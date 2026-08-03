// ============================================
// OZOBATH - Environment Configuration
// ============================================
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const NODE_ENV = process.env.NODE_ENV || 'development';

// ─── Fail-Fast Validation ────────────────────────────
// Missing secrets must crash at boot, not at request time. Without this a
// typo'd .env starts a "healthy" server where every login and payment fails.
const REQUIRED_VARS = [
  'MONGODB_URI',
  'JWT_ACCESS_SECRET',
  'JWT_REFRESH_SECRET',
  'CLOUDINARY_CLOUD_NAME',
  'CLOUDINARY_API_KEY',
  'CLOUDINARY_API_SECRET',
  'RAZORPAY_KEY_ID',
  'RAZORPAY_KEY_SECRET',
];

const missing = REQUIRED_VARS.filter((key) => !process.env[key]);

if (missing.length) {
  console.error('');
  console.error('💀 FATAL: Missing required environment variables:');
  missing.forEach((key) => console.error(`   - ${key}`));
  console.error(`   Expected in: ${path.resolve(__dirname, '../../.env')}`);
  console.error('');
  process.exit(1);
}

// Production-only hardening: reject weak or placeholder secrets.
if (NODE_ENV === 'production') {
  const fatal = [];

  ['JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET'].forEach((key) => {
    if (process.env[key].length < 32) {
      fatal.push(`${key} must be at least 32 characters in production.`);
    }
    if (/change_this|your_.*_here/i.test(process.env[key])) {
      fatal.push(`${key} still contains a placeholder value from .env.example.`);
    }
  });

  // A shared access/refresh secret means an access token can be replayed as a
  // refresh token, defeating short access-token expiry entirely.
  if (process.env.JWT_ACCESS_SECRET === process.env.JWT_REFRESH_SECRET) {
    fatal.push('JWT_ACCESS_SECRET and JWT_REFRESH_SECRET must be different.');
  }

  if (!process.env.CLIENT_URL || !process.env.ADMIN_URL) {
    fatal.push('CLIENT_URL and ADMIN_URL must be set in production (CORS depends on them).');
  }

  if (fatal.length) {
    console.error('');
    console.error('💀 FATAL: Insecure production configuration:');
    fatal.forEach((msg) => console.error(`   - ${msg}`));
    console.error('');
    console.error('   Generate strong secrets with:');
    console.error('   node -e "console.log(require(\'crypto\').randomBytes(64).toString(\'hex\'))"');
    console.error('');
    process.exit(1);
  }
}

// ─── Tax Configuration ───────────────────────────────
// All three default to CURRENT behaviour, so nothing changes on deploy.
// Flip them only after your CA / the client confirms the treatment.
//
//   TAX_MODE=exclusive  GST added on top of price   (current)
//           =inclusive  GST extracted from price    (standard Indian retail MRP)
//   TAX_ON_SHIPPING=false  delivery not taxed        (current)
//                  =true   delivery taxed at the same rate
//   TAX_AFTER_DISCOUNT=false  tax on pre-discount subtotal  (current)
//                     =true   tax on discounted value — CGST s.15(3)(a)
//
// See docs/TAX_CONFIGURATION.md for what each flag does to a real order.
const TAX_MODE = (process.env.TAX_MODE || 'exclusive').toLowerCase();

if (!['inclusive', 'exclusive'].includes(TAX_MODE)) {
  console.error('');
  console.error(`💀 FATAL: TAX_MODE must be "inclusive" or "exclusive" (got "${TAX_MODE}").`);
  console.error('   This decides whether GST is added to or extracted from product prices.');
  console.error('');
  process.exit(1);
}

const TAX_RATE = process.env.TAX_RATE !== undefined ? parseFloat(process.env.TAX_RATE) : 0.18;

if (!Number.isFinite(TAX_RATE) || TAX_RATE < 0 || TAX_RATE >= 1) {
  console.error('');
  console.error(`💀 FATAL: TAX_RATE must be a fraction between 0 and 1 (got "${process.env.TAX_RATE}").`);
  console.error('   Use 0.18 for 18% GST, not 18.');
  console.error('');
  process.exit(1);
}

module.exports = {
  NODE_ENV,
  PORT: parseInt(process.env.PORT, 10) || 5000,

  TAX_MODE,
  TAX_RATE,
  TAX_ON_SHIPPING: process.env.TAX_ON_SHIPPING === 'true',
  TAX_AFTER_DISCOUNT: process.env.TAX_AFTER_DISCOUNT === 'true',
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',
  ADMIN_URL: process.env.ADMIN_URL || 'http://localhost:5174',

  MONGODB_URI: process.env.MONGODB_URI,

  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET,
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,
  JWT_ACCESS_EXPIRES_IN: process.env.JWT_ACCESS_EXPIRES_IN || '1d',
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '7d',

  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,

  RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID,
  RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET,

  SMTP_HOST: process.env.SMTP_HOST,
  SMTP_PORT: parseInt(process.env.SMTP_PORT, 10) || 587,
  SMTP_USER: process.env.SMTP_USER,
  SMTP_PASS: process.env.SMTP_PASS,

  GEMINI_API_KEY: process.env.GEMINI_API_KEY,

  SHIPROCKET_EMAIL: process.env.SHIPROCKET_EMAIL,
  SHIPROCKET_PASSWORD: process.env.SHIPROCKET_PASSWORD,
  PICKUP_PINCODE: process.env.PICKUP_PINCODE || '560001',

  SUPER_ADMIN_NAME: process.env.SUPER_ADMIN_NAME,
  SUPER_ADMIN_EMAIL: process.env.SUPER_ADMIN_EMAIL,
  SUPER_ADMIN_PASSWORD: process.env.SUPER_ADMIN_PASSWORD,
  SUPER_ADMIN_PHONE: process.env.SUPER_ADMIN_PHONE,
};
