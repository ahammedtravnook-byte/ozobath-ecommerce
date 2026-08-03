// ============================================
// OZOBATH - Schema Validation at the Boundary
// ============================================
// A dependency-free validator. Deliberately not zod/joi: this codebase has no
// build step and a small, fixed set of field shapes, so a ~150-line validator
// that produces the same ApiError taxonomy as everything else is a better fit
// than a 300kb dependency and a second error format to reconcile.
//
// What it gives us, which raw `req.body` did not:
//   - an allowlist per route (mass assignment cannot happen by construction —
//     unknown keys are dropped, not merged)
//   - type coercion with rejection, so `quantity: "abc"` is a 400 and not NaN
//     arithmetic deep inside a controller
//   - one error shape for every boundary
//
// Usage:  router.post('/', validate(schema), handler)
// The validated, coerced, allowlisted object replaces req.body.

const ApiError = require('../utils/apiError');
const { cleanText, isSafeUrl } = require('../utils/sanitize');
const { isValidObjectId } = require('mongoose');

// ─── Field types ─────────────────────────────────
// Each returns { ok: true, value } or { ok: false, message }.

const types = {
  string: (v, rule) => {
    if (typeof v !== 'string') return { ok: false, message: 'must be a string' };
    const cleaned = rule.raw ? v.trim() : cleanText(v, rule.max ?? 2000);
    if (rule.min && cleaned.length < rule.min) {
      return { ok: false, message: `must be at least ${rule.min} characters` };
    }
    if (rule.max && cleaned.length > rule.max) {
      return { ok: false, message: `must be at most ${rule.max} characters` };
    }
    if (rule.pattern && !rule.pattern.test(cleaned)) {
      return { ok: false, message: rule.patternMessage || 'is not in the expected format' };
    }
    if (rule.enum && !rule.enum.includes(cleaned)) {
      return { ok: false, message: `must be one of: ${rule.enum.join(', ')}` };
    }
    return { ok: true, value: cleaned };
  },

  int: (v, rule) => {
    const n = typeof v === 'string' ? Number(v) : v;
    if (typeof n !== 'number' || !Number.isInteger(n)) {
      return { ok: false, message: 'must be a whole number' };
    }
    if (rule.min !== undefined && n < rule.min) return { ok: false, message: `must be at least ${rule.min}` };
    if (rule.max !== undefined && n > rule.max) return { ok: false, message: `must be at most ${rule.max}` };
    return { ok: true, value: n };
  },

  number: (v, rule) => {
    const n = typeof v === 'string' ? Number(v) : v;
    if (typeof n !== 'number' || !Number.isFinite(n)) {
      return { ok: false, message: 'must be a number' };
    }
    if (rule.min !== undefined && n < rule.min) return { ok: false, message: `must be at least ${rule.min}` };
    if (rule.max !== undefined && n > rule.max) return { ok: false, message: `must be at most ${rule.max}` };
    return { ok: true, value: n };
  },

  boolean: (v) => {
    if (typeof v === 'boolean') return { ok: true, value: v };
    if (v === 'true') return { ok: true, value: true };
    if (v === 'false') return { ok: true, value: false };
    return { ok: false, message: 'must be true or false' };
  },

  objectId: (v) => {
    if (typeof v !== 'string' || !isValidObjectId(v)) {
      return { ok: false, message: 'must be a valid id' };
    }
    return { ok: true, value: v };
  },

  email: (v) => {
    if (typeof v !== 'string') return { ok: false, message: 'must be a string' };
    const e = v.trim().toLowerCase();
    // Deliberately permissive: the only reliable email validation is sending
    // one. This rejects the obviously-malformed without excluding valid
    // addresses that a stricter pattern would.
    if (e.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) {
      return { ok: false, message: 'must be a valid email address' };
    }
    return { ok: true, value: e };
  },

  url: (v) => {
    if (!isSafeUrl(v)) return { ok: false, message: 'must be a valid http(s) URL' };
    return { ok: true, value: v };
  },

  date: (v) => {
    const d = new Date(v);
    if (Number.isNaN(d.getTime())) return { ok: false, message: 'must be a valid date' };
    return { ok: true, value: d };
  },

  array: (v, rule) => {
    if (!Array.isArray(v)) return { ok: false, message: 'must be an array' };
    if (rule.max && v.length > rule.max) {
      return { ok: false, message: `must have at most ${rule.max} items` };
    }
    if (!rule.of) return { ok: true, value: v };

    const out = [];
    for (let i = 0; i < v.length; i++) {
      const res = applyRule(v[i], rule.of);
      if (!res.ok) return { ok: false, message: `item ${i} ${res.message}` };
      out.push(res.value);
    }
    return { ok: true, value: out };
  },

  object: (v, rule) => {
    if (!v || typeof v !== 'object' || Array.isArray(v)) {
      return { ok: false, message: 'must be an object' };
    }
    if (!rule.shape) return { ok: true, value: v };

    const { value, errors } = applySchema(v, rule.shape);
    if (errors.length) return { ok: false, message: errors[0] };
    return { ok: true, value };
  },
};

const applyRule = (value, rule) => {
  const fn = types[rule.type];
  if (!fn) throw new Error(`validate: unknown field type "${rule.type}"`);
  return fn(value, rule);
};

// Walk a schema over an input object. Unknown keys are dropped — that is what
// makes mass assignment structurally impossible rather than merely discouraged.
const applySchema = (input, schema) => {
  const value = {};
  const errors = [];

  for (const [field, rule] of Object.entries(schema)) {
    const raw = input?.[field];

    if (raw === undefined || raw === null || raw === '') {
      if (rule.required) errors.push(`${field} is required`);
      else if (rule.default !== undefined) value[field] = rule.default;
      continue;
    }

    const res = applyRule(raw, rule);
    if (!res.ok) errors.push(`${field} ${res.message}`);
    else value[field] = res.value;
  }

  return { value, errors };
};

// ─── Middleware ──────────────────────────────────
// `where` selects the request property to validate: 'body' (default) or 'query'.
const validate = (schema, where = 'body') => {
  // Fail at boot, not at request time. A typo'd or unexported schema
  // (`validate(S.banner)` where `banner` was never exported) would otherwise
  // throw on the first real request — or worse, silently validate nothing.
  if (!schema || typeof schema !== 'object' || !Object.keys(schema).length) {
    throw new Error('validate(): schema is missing or empty. Check the export in src/schemas.');
  }

  return (req, res, next) => {
    const { value, errors } = applySchema(req[where], schema);

    if (errors.length) {
      // One 400 listing every problem, rather than making the caller fix them
      // one request at a time.
      return next(new ApiError(400, errors.join('. '), errors));
    }

    if (where === 'body') {
      req.body = value;
    } else {
      // req.query has only a getter on some Express versions; mutate in place.
      Object.keys(req.query).forEach((k) => delete req.query[k]);
      Object.assign(req.query, value);
    }

    next();
  };
};

module.exports = { validate, applySchema, types };
