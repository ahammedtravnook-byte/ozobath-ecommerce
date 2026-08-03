// ============================================
// OZOBATH - Input Sanitisation Helpers
// ============================================
// Server-side sanitisation, deliberately not escape-on-render: two
// independently written SPAs consume this data (storefront and admin panel),
// and the admin panel renders unapproved reviews during moderation — so a
// payload reaches an admin's browser before anyone decides to approve it.
// Cleaning on write means neither client can get it wrong.

// ─── HTML ────────────────────────────────────────
// Strip tags entirely rather than escaping them. Review and enquiry text is
// plain prose; there is no legitimate markup in it, so the safest transform
// is removal. Escaping would leave `&lt;script&gt;` visible to the user,
// which is correct but ugly for a field that should never contain markup.
const stripHtml = (value) => {
  if (typeof value !== 'string') return value;

  return value
    // Drop whole script/style blocks including their contents.
    .replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, '')
    // Drop any remaining tag.
    .replace(/<\/?[a-z][\s\S]*?>/gi, '')
    // Neutralise dangling angle brackets left by malformed markup.
    .replace(/[<>]/g, '')
    .trim();
};

// Trim and cap a free-text field. `maxLength` prevents a single request from
// storing an unbounded document — with a 10mb body limit and no per-field
// cap, a few thousand requests could fill the database.
const cleanText = (value, maxLength = 2000) => {
  if (value === undefined || value === null) return value;
  const stripped = stripHtml(String(value));
  return stripped.slice(0, maxLength);
};

// ─── Regex ───────────────────────────────────────
// Escape user input before it reaches a $regex query. Unescaped, a search
// term like `(a+)+$` compiles to a catastrophically backtracking pattern
// that burns CPU inside MongoDB.
const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// ─── URLs ────────────────────────────────────────
// Allow only http(s). Blocks `javascript:`, `data:` and `vbscript:` URIs in
// fields that end up in an href or img src.
const isSafeUrl = (value) => {
  if (typeof value !== 'string') return false;
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
};

// Normalise an image array to `[{url, publicId?, alt?}]`, dropping anything
// whose url is not a safe absolute URL.
const cleanImages = (images, maxImages = 10) => {
  if (!Array.isArray(images)) return [];
  return images
    .filter((img) => img && typeof img === 'object' && isSafeUrl(img.url))
    .slice(0, maxImages)
    .map((img) => ({
      url: img.url,
      publicId: typeof img.publicId === 'string' ? img.publicId : undefined,
      alt: typeof img.alt === 'string' ? cleanText(img.alt, 200) : undefined,
    }));
};

module.exports = { stripHtml, cleanText, escapeRegex, isSafeUrl, cleanImages };
