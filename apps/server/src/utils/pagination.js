// ============================================
// OZOBATH - Pagination Bounds
// ============================================
// `limit` was passed straight to `.limit(Number(limit))` on eight endpoints,
// one of them public and unauthenticated. `GET /products?limit=1000000`
// returned every product document with populated categories in a single
// response — cheap memory exhaustion and bandwidth amplification, repeatable
// within the global rate limit.

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

// Clamp a client-supplied limit into [1, MAX_LIMIT], falling back to
// `fallback` for anything non-numeric.
const clampLimit = (value, fallback = DEFAULT_LIMIT, max = MAX_LIMIT) => {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(1, Math.min(Math.trunc(n), max));
};

// Page numbers start at 1. A negative or fractional page would produce a
// negative skip, which MongoDB rejects at query time.
const clampPage = (value) => {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 1) return 1;
  return Math.trunc(n);
};

// Convenience: returns { page, limit, skip } ready for a query.
const paginate = (query = {}, { defaultLimit = DEFAULT_LIMIT, maxLimit = MAX_LIMIT } = {}) => {
  const page = clampPage(query.page);
  const limit = clampLimit(query.limit, defaultLimit, maxLimit);
  return { page, limit, skip: (page - 1) * limit };
};

module.exports = { clampLimit, clampPage, paginate, DEFAULT_LIMIT, MAX_LIMIT };
