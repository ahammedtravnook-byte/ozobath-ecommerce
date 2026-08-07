// ============================================
// OZOBATH - Video URL Parsing
// ============================================
// Turns a pasted video link into the pieces the player needs: provider, id,
// embed URL and a thumbnail.
//
// Admins paste whatever the share button gave them — a watch URL, a youtu.be
// short link, a Shorts link, an embed URL, or one with a playlist and
// timestamp attached. Storing that raw string and hoping an <iframe> accepts
// it does not work: a /watch URL refuses to frame at all. So the id is
// extracted once, on write, and everything else is derived from it.

// Accepts: youtube.com/watch?v=ID, youtu.be/ID, /embed/ID, /shorts/ID, /v/ID,
// and /live/ID. The id is exactly 11 chars of [A-Za-z0-9_-].
const YOUTUBE_PATTERNS = [
  /(?:youtube\.com|youtube-nocookie\.com)\/watch\?(?:.*&)?v=([A-Za-z0-9_-]{11})/,
  /youtu\.be\/([A-Za-z0-9_-]{11})/,
  /(?:youtube\.com|youtube-nocookie\.com)\/embed\/([A-Za-z0-9_-]{11})/,
  /(?:youtube\.com|youtube-nocookie\.com)\/shorts\/([A-Za-z0-9_-]{11})/,
  /(?:youtube\.com|youtube-nocookie\.com)\/live\/([A-Za-z0-9_-]{11})/,
  /(?:youtube\.com|youtube-nocookie\.com)\/v\/([A-Za-z0-9_-]{11})/,
];

const VIMEO_PATTERNS = [
  /vimeo\.com\/(?:video\/)?(\d{6,})/,
  /player\.vimeo\.com\/video\/(\d{6,})/,
];

/**
 * Parse a video URL.
 * Returns null when nothing recognisable is found, so callers can reject the
 * input rather than storing a link that will silently fail to embed.
 */
const parseVideoUrl = (input) => {
  const url = String(input || '').trim();
  if (!url) return null;

  for (const pattern of YOUTUBE_PATTERNS) {
    const match = url.match(pattern);
    if (match) {
      return {
        provider: 'youtube',
        videoId: match[1],
        // youtube-nocookie defers cookie-setting until playback starts.
        embedUrl: `https://www.youtube-nocookie.com/embed/${match[1]}`,
        watchUrl: `https://www.youtube.com/watch?v=${match[1]}`,
        // hqdefault exists for every video. maxresdefault often 404s on
        // older or low-resolution uploads, which would render a broken tile.
        thumbnailUrl: `https://i.ytimg.com/vi/${match[1]}/hqdefault.jpg`,
      };
    }
  }

  for (const pattern of VIMEO_PATTERNS) {
    const match = url.match(pattern);
    if (match) {
      return {
        provider: 'vimeo',
        videoId: match[1],
        embedUrl: `https://player.vimeo.com/video/${match[1]}`,
        watchUrl: `https://vimeo.com/${match[1]}`,
        // Vimeo thumbnails need an API call, so leave it empty and let the
        // admin upload one. Better than a hardcoded URL that may not exist.
        thumbnailUrl: '',
      };
    }
  }

  return null;
};

/**
 * Build the embed URL with playback params.
 * Kept separate from parsing so stored records do not bake in player
 * preferences that we may want to change later.
 */
const buildEmbedUrl = (provider, videoId, { autoplay = false, mute = false } = {}) => {
  if (!videoId) return '';

  if (provider === 'youtube') {
    const params = new URLSearchParams({
      rel: '0',            // keep related videos within the same channel
      modestbranding: '1',
      playsinline: '1',    // iOS: play inline rather than going fullscreen
    });
    if (autoplay) params.set('autoplay', '1');
    // Browsers block autoplay with sound, so autoplay implies muted.
    if (autoplay || mute) params.set('mute', '1');
    return `https://www.youtube-nocookie.com/embed/${videoId}?${params}`;
  }

  if (provider === 'vimeo') {
    const params = new URLSearchParams({ byline: '0', portrait: '0' });
    if (autoplay) params.set('autoplay', '1');
    if (autoplay || mute) params.set('muted', '1');
    return `https://player.vimeo.com/video/${videoId}?${params}`;
  }

  return '';
};

module.exports = { parseVideoUrl, buildEmbedUrl };
