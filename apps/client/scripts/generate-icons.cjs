// ============================================
// OZOBATH - Favicon / App Icon Generator
// ============================================
// Regenerates every icon in public/ from the single brand source at
// public/logo/ozobath.png. Run after the logo changes:
//
//   cd apps/client && npm run icons
//
// The source is a small (193x147) opaque-white PNG, so the pipeline:
//   1. Trims the white border away to find the true artwork bounds.
//   2. Makes white fully transparent, for use on tinted backgrounds.
//   3. Upscales with Lanczos3 before any downscale, so small icons stay sharp.
//
// Every icon uses the COMPLETE logo — shower head, spray, "OzoBath" wordmark
// and tagline — so the brand reads the same everywhere. Backgrounds differ only
// where a platform demands it:
//   - favicon / android "any" -> transparent, 2% padding.
//   - maskable / apple-touch  -> opaque white; iOS and Android's circular mask
//     both render transparency as black otherwise. Maskable is inset 20% to
//     stay inside the safe zone (the middle 80% of the canvas).

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const SRC = path.join(__dirname, '..', 'public', 'logo', 'ozobath.png');
const PUB = path.join(__dirname, '..', 'public');
const LOGO_DIR = path.join(PUB, 'logo');

// Brand colours sampled from the source artwork.
const NAVY = { r: 0x0f, g: 0x3d, b: 0x6b };
const WHITE = { r: 255, g: 255, b: 255 };

// White-ish pixels become transparent. The logo's lightest real ink is the
// cyan spray (~#48C9E6), far from white, so a high cutoff is safe.
const WHITE_CUTOFF = 240;

const removeWhite = async (buf) => {
  const { data, info } = await sharp(buf)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  for (let i = 0; i < data.length; i += 4) {
    const [r, g, b] = [data[i], data[i + 1], data[i + 2]];
    if (r >= WHITE_CUTOFF && g >= WHITE_CUTOFF && b >= WHITE_CUTOFF) {
      data[i + 3] = 0;
    }
  }

  return sharp(data, {
    raw: { width: info.width, height: info.height, channels: 4 },
  })
    .png()
    .toBuffer();
};

// Crop to pixels whose alpha clears `floor`. sharp's own trim() treats a single
// barely-visible pixel as content, which on this artwork (the spray fades to
// alpha 0) leaves a wide dead margin around the glyph.
const tightCrop = async (buf, floor = 40) => {
  const { data, info } = await sharp(buf)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  let minX = info.width;
  let minY = info.height;
  let maxX = -1;
  let maxY = -1;

  for (let y = 0; y < info.height; y++) {
    for (let x = 0; x < info.width; x++) {
      if (data[(y * info.width + x) * 4 + 3] > floor) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  if (maxX < 0) throw new Error('tightCrop: image is fully transparent');

  return sharp(buf)
    .extract({
      left: minX,
      top: minY,
      width: maxX - minX + 1,
      height: maxY - minY + 1,
    })
    .png()
    .toBuffer();
};

// Scale up first so every downscale samples a dense source, never the 193px original.
const upscale = (buf, factor = 8) =>
  sharp(buf)
    .metadata()
    .then((m) =>
      sharp(buf)
        .resize(m.width * factor, m.height * factor, {
          kernel: sharp.kernel.lanczos3,
          fit: 'fill',
        })
        .png()
        .toBuffer()
    );

// Fit `buf` onto a square canvas, leaving `padPct` of the edge clear.
const square = async (buf, size, padPct, background) => {
  const inner = Math.round(size * (1 - padPct * 2));
  const fitted = await sharp(buf)
    .resize(inner, inner, { fit: 'contain', background: { ...WHITE, alpha: 0 } })
    .toBuffer();

  return sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: background ?? { ...WHITE, alpha: 0 },
    },
  })
    .composite([{ input: fitted, gravity: 'center' }])
    .png({ compressionLevel: 9, palette: false })
    .toBuffer();
};

// Minimal ICO container (PNG-compressed entries) — no extra dependency needed.
const buildIco = (pngs) => {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type: icon
  header.writeUInt16LE(pngs.length, 4);

  let offset = 6 + pngs.length * 16;
  const entries = [];
  for (const { size, buf } of pngs) {
    const e = Buffer.alloc(16);
    e.writeUInt8(size >= 256 ? 0 : size, 0); // 0 means 256
    e.writeUInt8(size >= 256 ? 0 : size, 1);
    e.writeUInt8(0, 2); // palette
    e.writeUInt8(0, 3); // reserved
    e.writeUInt16LE(1, 4); // colour planes
    e.writeUInt16LE(32, 6); // bits per pixel
    e.writeUInt32LE(buf.length, 8);
    e.writeUInt32LE(offset, 12);
    entries.push(e);
    offset += buf.length;
  }

  return Buffer.concat([header, ...entries, ...pngs.map((p) => p.buf)]);
};

const run = async () => {
  if (!fs.existsSync(SRC)) {
    console.error(`FATAL: source logo not found at ${SRC}`);
    process.exit(1);
  }

  const meta = await sharp(SRC).metadata();
  console.log(`source: ${meta.width}x${meta.height}\n`);

  // ─── 1. Tight, transparent full lockup ───
  const trimmed = await sharp(SRC).trim({ threshold: 10 }).png().toBuffer();
  const transparent = await removeWhite(trimmed);
  const big = await upscale(transparent, 8);

  fs.writeFileSync(path.join(LOGO_DIR, 'ozobath-transparent.png'), big);
  const bigMeta = await sharp(big).metadata();
  console.log(`lockup (transparent): ${bigMeta.width}x${bigMeta.height}  -> logo/ozobath-transparent.png`);

  // Header-sized raster, 2x for retina. Height 96 => crisp at h-12 (48px).
  const header2x = await sharp(big)
    .resize({ height: 96, kernel: sharp.kernel.lanczos3 })
    .png({ compressionLevel: 9 })
    .toBuffer();
  fs.writeFileSync(path.join(LOGO_DIR, 'ozobath-header.png'), header2x);
  const hMeta = await sharp(header2x).metadata();
  console.log(`header 2x:            ${hMeta.width}x${hMeta.height}  -> logo/ozobath-header.png`);

  // ─── 2. Icon source: the complete logo ───
  // Every icon uses the full lockup — shower head, spray, "OzoBath" wordmark
  // and tagline. sharp's trim() keeps near-invisible alpha, and the spray fades
  // to ~0 at the tips, so bounds are computed against a real alpha floor to
  // stop dead margin padding the icon.
  const iconSrc = await tightCrop(big, 20);
  const iconMeta = await sharp(iconSrc).metadata();
  console.log(`icon source (full):   ${iconMeta.width}x${iconMeta.height}\n`);

  // ─── 3. Favicon PNGs (full logo, transparent) ───
  // The lockup is ~1.6:1, so on a square canvas it only ever fills the middle
  // band. Padding stays minimal (2%) to give the artwork every pixel available.
  const faviconSizes = [16, 32, 48, 96, 192, 512];
  const icoParts = [];

  for (const size of faviconSizes) {
    const buf = await square(iconSrc, size, 0.02, null);
    fs.writeFileSync(path.join(PUB, `favicon-${size}x${size}.png`), buf);
    if ([16, 32, 48].includes(size)) icoParts.push({ size, buf });
    console.log(`favicon-${size}x${size}.png`);
  }

  // ─── 4. favicon.ico (16/32/48 bundled) ───
  fs.writeFileSync(path.join(PUB, 'favicon.ico'), buildIco(icoParts));
  console.log('favicon.ico (16,32,48)');

  // ─── 5. Android / PWA icons ───
  // "any" icons stay transparent; the maskable one needs full-bleed colour or
  // Android renders the transparent corners as black.
  for (const size of [192, 512]) {
    const buf = await square(iconSrc, size, 0.02, null);
    fs.writeFileSync(path.join(PUB, `android-chrome-${size}x${size}.png`), buf);
    console.log(`android-chrome-${size}x${size}.png`);
  }

  // Maskable: 20% inset keeps the logo inside the circular safe zone.
  const maskable = await square(iconSrc, 512, 0.2, { ...WHITE, alpha: 1 });
  fs.writeFileSync(path.join(PUB, 'maskable-icon-512x512.png'), maskable);
  console.log('maskable-icon-512x512.png');

  // ─── 6. Apple touch icon ───
  // iOS composites onto black if alpha is present, so bake in white.
  const apple = await square(iconSrc, 180, 0.08, { ...WHITE, alpha: 1 });
  fs.writeFileSync(path.join(PUB, 'apple-touch-icon.png'), apple);
  console.log('apple-touch-icon.png (180x180, opaque)');

  // ─── 7. Social share card (og:image, 1200x630) ───
  // Full lockup centred on white — this is what WhatsApp/Twitter/Google render.
  const ogInner = await sharp(iconSrc)
    .resize(820, 430, { fit: 'inside', kernel: sharp.kernel.lanczos3 })
    .toBuffer();
  const og = await sharp({
    create: { width: 1200, height: 630, channels: 4, background: { ...WHITE, alpha: 1 } },
  })
    .composite([{ input: ogInner, gravity: 'center' }])
    .png({ compressionLevel: 9 })
    .toBuffer();
  fs.writeFileSync(path.join(PUB, 'og-image.png'), og);
  console.log('og-image.png (1200x630)');

  // ─── 8. Safari pinned tab (monochrome silhouette) ───
  // Safari flattens this to one colour, so trace a 256px canvas at a coarse
  // step — detail beyond that is invisible but costs bytes.
  const pinnedPng = await square(iconSrc, 256, 0.02, null);
  const { data: pd, info: pi } = await sharp(pinnedPng)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  // Trace the alpha channel into coarse SVG rows — Safari only needs a shape.
  const rows = [];
  const STEP = 2;
  for (let y = 0; y < pi.height; y += STEP) {
    let runStart = -1;
    for (let x = 0; x <= pi.width; x += STEP) {
      const on = x < pi.width && pd[(y * pi.width + x) * 4 + 3] > 128;
      if (on && runStart < 0) runStart = x;
      if (!on && runStart >= 0) {
        rows.push(`<rect x="${runStart}" y="${y}" width="${x - runStart}" height="${STEP}"/>`);
        runStart = -1;
      }
    }
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${pi.width} ${pi.height}"><g fill="#000">${rows.join('')}</g></svg>`;
  fs.writeFileSync(path.join(PUB, 'safari-pinned-tab.svg'), svg);
  console.log(`safari-pinned-tab.svg (${rows.length} rects)`);

  // ─── 9. Scalable favicon.svg ───
  // Wraps a raster (the source is a PNG, so there is no true vector to embed).
  // 192px keeps the file ~20KB instead of ~150KB; browsers only ever paint this
  // at 16-64px, and the SVG wrapper is what modern Chrome/Firefox prefer.
  const icon192 = await square(iconSrc, 192, 0.02, null);
  const svgIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512"><image width="512" height="512" href="data:image/png;base64,${icon192.toString('base64')}"/></svg>`;
  fs.writeFileSync(path.join(PUB, 'favicon.svg'), svgIcon);
  console.log('favicon.svg');

  console.log(`\nNAVY reference: rgb(${NAVY.r},${NAVY.g},${NAVY.b})`);
  console.log('Done.');
};

run().catch((e) => {
  console.error('Icon generation failed:', e.message);
  console.error(e.stack);
  process.exit(1);
});
