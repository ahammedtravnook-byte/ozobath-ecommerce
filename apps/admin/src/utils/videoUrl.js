// ============================================
// OZOBATH - Video URL Parsing (admin)
// ============================================
// Mirrors apps/server/src/utils/videoUrl.js.
//
// Duplicated rather than imported from packages/shared because no app
// currently consumes that package — wiring the workspace dependency, build
// and aliasing for one function would be a larger change than this file. The
// server remains the authority: it re-parses on write and rejects anything
// this misses. This copy exists so the admin can validate and preview a link
// before a round trip.
//
// If a third consumer appears, promote both copies into packages/shared.

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

export const parseVideoUrl = (input) => {
  const url = String(input || '').trim();
  if (!url) return null;

  for (const pattern of YOUTUBE_PATTERNS) {
    const match = url.match(pattern);
    if (match) {
      return {
        provider: 'youtube',
        videoId: match[1],
        embedUrl: `https://www.youtube-nocookie.com/embed/${match[1]}`,
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
        thumbnailUrl: '',
      };
    }
  }

  return null;
};

/**
 * Embed URL with playback params.
 * autoplay implies muted: browsers block autoplay with sound, and an
 * unmuted autoplay request simply does not start.
 */
export const buildEmbedUrl = (provider, videoId, { autoplay = false, mute = false } = {}) => {
  if (!videoId) return '';

  if (provider === 'youtube') {
    const params = new URLSearchParams({
      rel: '0',
      modestbranding: '1',
      playsinline: '1',
    });
    if (autoplay) params.set('autoplay', '1');
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

export default { parseVideoUrl, buildEmbedUrl };
