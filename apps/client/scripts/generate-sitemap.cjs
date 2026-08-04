// ============================================
// OZOBATH - Sitemap Generator
// ============================================
// Writes public/sitemap.xml. Runs automatically before `npm run build`.
//
// Static routes are always emitted. Product, category and blog URLs are pulled
// from the live API when one is reachable, so the sitemap reflects the real
// catalogue; if the API is down the build still succeeds with the static set
// rather than failing or shipping an empty file.
//
//   SITE_URL=https://ozobath.in VITE_API_URL=https://api.ozobath.in npm run sitemap

const fs = require('fs');
const path = require('path');

const SITE = (process.env.SITE_URL || 'https://ozobath.in').replace(/\/$/, '');
const API = (process.env.VITE_API_URL || process.env.API_URL || '').replace(/\/$/, '');
const OUT = path.join(__dirname, '..', 'public', 'sitemap.xml');

// Only routes that render public content. Anything behind auth or tied to a
// transaction is excluded here and in robots.txt.
const STATIC_ROUTES = [
  { loc: '/', changefreq: 'daily', priority: '1.0' },
  { loc: '/shop', changefreq: 'daily', priority: '0.9' },
  { loc: '/about', changefreq: 'monthly', priority: '0.7' },
  { loc: '/contact', changefreq: 'monthly', priority: '0.7' },
  { loc: '/blog', changefreq: 'weekly', priority: '0.7' },
  { loc: '/faq', changefreq: 'monthly', priority: '0.6' },
  { loc: '/experience-centre', changefreq: 'monthly', priority: '0.6' },
  { loc: '/b2b-enquiry', changefreq: 'monthly', priority: '0.6' },
  { loc: '/service-request', changefreq: 'monthly', priority: '0.5' },
  { loc: '/shop-live', changefreq: 'weekly', priority: '0.5' },
  { loc: '/book-site-visit', changefreq: 'monthly', priority: '0.5' },
  { loc: '/track-order', changefreq: 'monthly', priority: '0.4' },
  { loc: '/warranty', changefreq: 'yearly', priority: '0.3' },
  { loc: '/shipping-policy', changefreq: 'yearly', priority: '0.3' },
  { loc: '/terms', changefreq: 'yearly', priority: '0.3' },
  { loc: '/privacy', changefreq: 'yearly', priority: '0.3' },
];

const esc = (s) =>
  String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

const fetchJson = async (url) => {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 15000);
  try {
    const res = await fetch(url, { signal: ctrl.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
};

// The API wraps payloads inconsistently across endpoints; dig out the array.
const unwrap = (json, ...keys) => {
  if (Array.isArray(json)) return json;
  for (const k of ['data', 'results', ...keys]) {
    if (Array.isArray(json?.[k])) return json[k];
    if (Array.isArray(json?.data?.[k])) return json.data[k];
  }
  return [];
};

const dynamicRoutes = async () => {
  if (!API) {
    console.log('  No API URL set - emitting static routes only.');
    return [];
  }

  const out = [];
  const sources = [
    {
      label: 'products',
      url: `${API}/api/v1/products?limit=1000&status=active`,
      keys: ['products'],
      map: (p) => p.slug && {
        loc: `/product/${p.slug}`,
        changefreq: 'weekly',
        priority: '0.8',
        lastmod: p.updatedAt,
      },
    },
    {
      label: 'categories',
      url: `${API}/api/v1/categories?limit=200`,
      keys: ['categories'],
      map: (c) => c.slug && {
        loc: `/shop/${c.slug}`,
        changefreq: 'weekly',
        priority: '0.8',
        lastmod: c.updatedAt,
      },
    },
    {
      label: 'blogs',
      url: `${API}/api/v1/blogs?limit=500&status=published`,
      keys: ['blogs', 'posts'],
      map: (b) => b.slug && {
        loc: `/blog/${b.slug}`,
        changefreq: 'monthly',
        priority: '0.6',
        lastmod: b.updatedAt || b.publishedAt,
      },
    },
  ];

  for (const { label, url, keys, map } of sources) {
    try {
      const items = unwrap(await fetchJson(url), ...keys);
      const rows = items.map(map).filter(Boolean);
      out.push(...rows);
      console.log(`  ${label.padEnd(12)} ${rows.length}`);
    } catch (e) {
      console.log(`  ${label.padEnd(12)} skipped (${e.message})`);
    }
  }

  return out;
};

const run = async () => {
  console.log(`\nSitemap for ${SITE}`);
  if (API) console.log(`API: ${API}`);

  const dynamic = await dynamicRoutes();
  const today = new Date().toISOString().split('T')[0];

  // De-dupe in case the API returns a slug that collides with a static route.
  const seen = new Set();
  const routes = [...STATIC_ROUTES, ...dynamic].filter((r) => {
    if (seen.has(r.loc)) return false;
    seen.add(r.loc);
    return true;
  });

  const body = routes
    .map((r) => {
      const lastmod = r.lastmod ? new Date(r.lastmod).toISOString().split('T')[0] : today;
      return [
        '  <url>',
        `    <loc>${esc(SITE + r.loc)}</loc>`,
        `    <lastmod>${lastmod}</lastmod>`,
        `    <changefreq>${r.changefreq}</changefreq>`,
        `    <priority>${r.priority}</priority>`,
        '  </url>',
      ].join('\n');
    })
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${body}
</urlset>
`;

  fs.writeFileSync(OUT, xml, 'utf8');
  console.log(`\n${routes.length} URLs -> public/sitemap.xml\n`);
};

run().catch((e) => {
  console.error('Sitemap generation failed:', e.message);
  process.exit(1);
});
