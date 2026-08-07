// ============================================
// Tests — video URL parsing
// ============================================
// Admins paste whatever the share button gave them. A /watch URL cannot be
// framed at all, so the id has to be extracted correctly on write — an
// unparsed link reaches the storefront as a player that silently refuses to
// load.

require('./helpers/env');

const test = require('node:test');
const assert = require('node:assert/strict');

const { parseVideoUrl, buildEmbedUrl } = require('../src/utils/videoUrl');

const ID = 'dQw4w9WgXcQ';

// ─── YouTube forms ─────────────────────────────

test('parses every YouTube URL form an admin might paste', () => {
  const forms = [
    `https://www.youtube.com/watch?v=${ID}`,
    `https://youtube.com/watch?v=${ID}`,
    `https://m.youtube.com/watch?v=${ID}`,
    `https://youtu.be/${ID}`,
    `https://www.youtube.com/embed/${ID}`,
    `https://www.youtube.com/shorts/${ID}`,
    `https://www.youtube.com/live/${ID}`,
    `https://www.youtube.com/v/${ID}`,
    `https://www.youtube-nocookie.com/embed/${ID}`,
  ];

  for (const url of forms) {
    const parsed = parseVideoUrl(url);
    assert.ok(parsed, `failed to parse: ${url}`);
    assert.equal(parsed.provider, 'youtube', url);
    assert.equal(parsed.videoId, ID, url);
  }
});

test('ignores playlist, index and timestamp params', () => {
  // The share button appends these constantly; capturing them into the id
  // would produce an embed URL for a video that does not exist.
  assert.equal(parseVideoUrl(`https://youtu.be/${ID}?t=42`).videoId, ID);
  assert.equal(parseVideoUrl(`https://www.youtube.com/watch?v=${ID}&list=PLabc&index=3`).videoId, ID);
  assert.equal(parseVideoUrl(`https://www.youtube.com/watch?app=desktop&v=${ID}`).videoId, ID);
});

test('derives an embed URL that can actually be framed', () => {
  const parsed = parseVideoUrl(`https://www.youtube.com/watch?v=${ID}`);
  // /watch refuses to frame; /embed is the only form that works.
  assert.ok(parsed.embedUrl.includes('/embed/'));
  assert.ok(!parsed.embedUrl.includes('/watch'));
});

test('uses hqdefault for thumbnails', () => {
  // maxresdefault 404s on older or low-resolution uploads, which renders as a
  // broken tile in the playlist. hqdefault exists for every video.
  const parsed = parseVideoUrl(`https://youtu.be/${ID}`);
  assert.ok(parsed.thumbnailUrl.includes('hqdefault'));
});

// ─── Vimeo ─────────────────────────────────────

test('parses Vimeo URLs', () => {
  assert.deepEqual(
    { provider: 'vimeo', videoId: '123456789' },
    (({ provider, videoId }) => ({ provider, videoId }))(parseVideoUrl('https://vimeo.com/123456789'))
  );
  assert.equal(parseVideoUrl('https://player.vimeo.com/video/123456789').videoId, '123456789');
});

test('leaves the Vimeo thumbnail empty rather than guessing', () => {
  // Vimeo thumbnails require an API call. A fabricated URL would 404.
  assert.equal(parseVideoUrl('https://vimeo.com/123456789').thumbnailUrl, '');
});

// ─── Rejection ─────────────────────────────────

test('rejects anything that is not an embeddable video link', () => {
  const rejects = [
    'https://example.com/video.mp4',
    'https://vimeo.com/12',            // too short to be a real id
    'https://www.youtube.com/watch?v=short',
    'https://www.youtube.com/',
    'not a url',
    '',
    null,
    undefined,
  ];

  for (const input of rejects) {
    assert.equal(parseVideoUrl(input), null, `should have rejected: ${input}`);
  }
});

// ─── Embed params ──────────────────────────────

test('autoplay implies muted, because browsers block audible autoplay', () => {
  // Requesting autoplay with sound means playback silently never starts.
  const url = buildEmbedUrl('youtube', ID, { autoplay: true });
  assert.ok(url.includes('autoplay=1'));
  assert.ok(url.includes('mute=1'));
});

test('embed URLs carry the params that keep the player unbranded and inline', () => {
  const url = buildEmbedUrl('youtube', ID);
  assert.ok(url.includes('rel=0'));
  assert.ok(url.includes('playsinline=1'));  // iOS plays inline, not fullscreen
});

test('buildEmbedUrl returns empty for an unknown provider or missing id', () => {
  assert.equal(buildEmbedUrl('youtube', ''), '');
  assert.equal(buildEmbedUrl('dailymotion', 'abc'), '');
});
