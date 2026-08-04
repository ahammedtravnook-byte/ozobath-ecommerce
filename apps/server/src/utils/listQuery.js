// ============================================
// OZOBATH - Admin List Query Helpers
// ============================================
// Every admin table endpoint needs the same three things: a safe sort, a safe
// search filter, and a consistent envelope. Before this, each controller
// rolled its own — which is how three of them ended up returning unbounded
// result sets and two ended up filtering in the browser instead.
//
//   const sort   = resolveSort(req.query.sort, ORDER_SORTS, '-createdAt');
//   const filter = { ...buildSearchFilter(req.query.search, ['name', 'email']) };
//   sendResponse(res, 200, listEnvelope(rows, total, page, limit), '...');
//
// Sorting is allowlisted per controller rather than free-form: `sort` reaches
// Mongo directly, so an arbitrary client string can request an unindexed field
// and turn a table page into a full collection scan.

// Escaping lives in utils/sanitize and is already used by the product, order
// and activity-log controllers. An unescaped `(a+)+$` is a catastrophically
// backtracking pattern executed inside MongoDB, so the search box would be a
// remote CPU sink without it.
const { escapeRegex } = require('./sanitize');

// Longer needles cost more to scan and buy nothing for a human-typed query.
const MAX_SEARCH_LENGTH = 100;

/**
 * Build a case-insensitive $or search across `fields`.
 * Returns {} when there is nothing to search, so it always spreads cleanly:
 *   const filter = { status, ...buildSearchFilter(search, ['name']) };
 */
const buildSearchFilter = (search, fields = []) => {
  const term = String(search ?? '').trim();
  if (!term || !fields.length) return {};

  const safe = escapeRegex(term.slice(0, MAX_SEARCH_LENGTH));
  return {
    $or: fields.map((field) => ({ [field]: { $regex: safe, $options: 'i' } })),
  };
};

/**
 * Resolve a client sort string against an allowlist.
 * Anything unrecognised falls back to `fallback` rather than erroring: a stale
 * bookmark with an old sort param should still render a table.
 */
const resolveSort = (sort, allowed, fallback = '-createdAt') => {
  const requested = String(sort ?? '').trim();
  if (!requested) return fallback;

  const set = allowed instanceof Set ? allowed : new Set(allowed || []);
  return set.has(requested) ? requested : fallback;
};

/**
 * Given a set of sortable base fields, expand to both directions.
 * sortableSet(['name', 'price']) -> Set{ name, -name, price, -price }
 */
const sortableSet = (fields = []) =>
  new Set(fields.flatMap((f) => [f, `-${f}`]));

/**
 * Standard list response body. Keeping the shape identical across endpoints is
 * what lets one frontend composable drive every table.
 */
const listEnvelope = (items, total, page, limit, extra = {}) => ({
  items,
  pagination: {
    page,
    limit,
    total,
    pages: Math.max(1, Math.ceil(total / limit)),
    hasMore: page * limit < total,
  },
  ...extra,
});

module.exports = {
  buildSearchFilter,
  resolveSort,
  sortableSet,
  listEnvelope,
  MAX_SEARCH_LENGTH,
};
