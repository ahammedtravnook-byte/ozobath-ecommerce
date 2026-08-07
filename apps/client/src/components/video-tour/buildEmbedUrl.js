/**
 * Build a provider-specific embed URL for a video tour.
 *
 * Pure and side-effect free so it can be unit tested without a DOM.
 */

/**
 * @param {{ videoId?: string, provider?: 'youtube'|'vimeo' }} video
 * @param {{ autoplay?: boolean }} [options]
 * @returns {string} embed URL, or '' when the video has no id
 */
export const buildEmbedUrl = (video, { autoplay = true } = {}) => {
  if (!video?.videoId) return '';

  if (video.provider === 'vimeo') {
    const params = new URLSearchParams({ byline: '0', portrait: '0' });
    if (autoplay) {
      params.set('autoplay', '1');
      params.set('muted', '1');
    }
    return `https://player.vimeo.com/video/${video.videoId}?${params}`;
  }

  const params = new URLSearchParams({
    rel: '0',
    modestbranding: '1',
    playsinline: '1',
  });

  // Autoplay only works muted. Requesting sound means the video silently
  // never starts, which reads to the user as a broken player.
  if (autoplay) {
    params.set('autoplay', '1');
    params.set('mute', '1');
  }

  return `https://www.youtube-nocookie.com/embed/${video.videoId}?${params}`;
};

export default buildEmbedUrl;
