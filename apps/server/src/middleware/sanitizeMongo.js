// ============================================
// OZOBATH - MongoDB Operator Injection Guard
// ============================================
// Express parses `?status[$ne]=x` into `{status: {$ne: 'x'}}`, and
// express.json passes `{"email": {"$ne": null}}` through as a real object.
// Mongoose accepts both as query operators without complaint.
//
// That let an unauthenticated caller unsubscribe arbitrary newsletter
// addresses (`{email: {$ne: null}}`), enumerate accounts by regex against the
// login selector, and subvert filters on listing endpoints.
//
// This strips any key beginning with `$`, and any key containing a `.`
// (which Mongoose interprets as a nested path — the vector behind the
// prototype-pollution advisory in mongoose's update casting).
//
// Applied globally in app.js, before any route sees the request.

const FORBIDDEN_KEY = /^\$|\./;

// Recursively remove offending keys. Returns the number removed so the
// caller can log an attempt rather than silently swallowing it.
//
// Mutates in place: req.query on Express 4 is a plain object, and rebuilding
// it would drop the getter Express installs.
const scrub = (value, removed = { count: 0, keys: [] }, depth = 0) => {
  // Bound recursion — a deeply nested body should not be able to blow the
  // stack before the route ever runs.
  if (depth > 20 || value === null || typeof value !== 'object') return removed;

  if (Array.isArray(value)) {
    for (const entry of value) scrub(entry, removed, depth + 1);
    return removed;
  }

  for (const key of Object.keys(value)) {
    if (FORBIDDEN_KEY.test(key)) {
      removed.count++;
      if (removed.keys.length < 5) removed.keys.push(key);
      delete value[key];
      continue;
    }
    scrub(value[key], removed, depth + 1);
  }

  return removed;
};

const sanitizeMongo = (req, res, next) => {
  const removed = { count: 0, keys: [] };

  // `req.params` is populated per-route, after this middleware, so it is not
  // scrubbed here; route params are single path segments and cannot express
  // an operator object.
  for (const source of [req.body, req.query]) {
    if (source && typeof source === 'object') scrub(source, removed);
  }

  if (removed.count > 0) {
    console.warn(
      `[sanitize] Stripped ${removed.count} MongoDB operator key(s) from ${req.method} ${req.originalUrl} (${removed.keys.join(', ')}) — ip ${req.ip}`
    );
  }

  next();
};

module.exports = sanitizeMongo;
