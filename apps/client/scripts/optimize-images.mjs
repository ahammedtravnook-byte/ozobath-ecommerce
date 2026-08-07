/**
 * Convert public/images PNGs to WebP.
 *
 * The source art is 640x640 PNG — the wrong format for photographs, and the
 * hero alone was 570 KB for an image that gets stretched across a full-width
 * `bg-cover` section. WebP at q78 lands the same pixels around 28 KB.
 *
 * Originals are kept on disk: the CSS/JSX references the .webp, but leaving
 * the .png in place means nothing 404s if a reference is missed, and the
 * conversion stays re-runnable from source.
 *
 * Usage: npm run images:optimize
 */
import sharp from 'sharp';
import { readdir, stat } from 'node:fs/promises';
import { join, extname, basename, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'images');
const QUALITY = 78;

const kb = (n) => `${Math.round(n / 1024)} KB`;

async function* walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(full);
    else if (/\.(png|jpe?g)$/i.test(entry.name)) yield full;
  }
}

let before = 0;
let after = 0;
let count = 0;

for await (const src of walk(ROOT)) {
  const out = join(dirname(src), `${basename(src, extname(src))}.webp`);

  const { size: srcSize } = await stat(src);
  const { size: outSize } = await sharp(src)
    .webp({ quality: QUALITY, effort: 6 })
    .toFile(out);

  before += srcSize;
  after += outSize;
  count += 1;

  const saved = Math.round((1 - outSize / srcSize) * 100);
  console.log(`${basename(src).padEnd(46)} ${kb(srcSize).padStart(8)} → ${kb(outSize).padStart(8)}  (−${saved}%)`);
}

console.log(
  `\n${count} images: ${kb(before)} → ${kb(after)} ` +
  `(−${Math.round((1 - after / before) * 100)}%)`
);
