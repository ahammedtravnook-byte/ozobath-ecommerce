import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { buildEmbedUrl } from './buildEmbedUrl';

/**
 * The 16:9 video surface, with optional prev/next controls overlaid.
 *
 * The aspect ratio is enforced with an inline `aspectRatio` style rather than
 * Tailwind's `aspect-video` utility. That utility was silently absent from the
 * compiled CSS (the legacy @tailwindcss/aspect-ratio plugin disables the native
 * ones), so the player collapsed to zero height and the video vanished. An
 * inline style cannot be dropped by a build-time purge or a plugin conflict,
 * which makes the one dimension the whole component depends on non-negotiable.
 */
const VideoPlayer = ({ video, hasPlaylist, onPrev, onNext, className = '' }) => {
  if (!video) return null;

  return (
    <div
      className={`relative mx-auto w-full shrink-0 bg-black lg:mx-0 ${className}`}
      style={{ aspectRatio: '16 / 9' }}
    >
      <iframe
        key={video.videoId}
        src={buildEmbedUrl(video)}
        title={video.title}
        className="absolute inset-0 h-full w-full border-0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
      />

      {hasPlaylist && (
        <>
          <PlayerNavButton side="left" label="Previous video" onClick={onPrev}>
            <FiChevronLeft className="h-5 w-5 transition-transform group-hover:-translate-x-0.5" />
          </PlayerNavButton>
          <PlayerNavButton side="right" label="Next video" onClick={onNext}>
            <FiChevronRight className="h-5 w-5 transition-transform group-hover:translate-x-0.5" />
          </PlayerNavButton>
        </>
      )}
    </div>
  );
};

/**
 * Hidden below `sm`: on a phone these would sit on top of the player's own
 * touch controls, and the playlist is directly underneath anyway.
 */
const PlayerNavButton = ({ side, label, onClick, children }) => (
  <button
    type="button"
    onClick={onClick}
    aria-label={label}
    className={`group absolute top-1/2 hidden h-11 w-11 -translate-y-1/2 items-center justify-center
                rounded-full border border-white/15 bg-black/50 text-white/70 backdrop-blur-sm
                transition hover:bg-black/75 hover:text-white focus-visible:outline-none
                focus-visible:ring-2 focus-visible:ring-accent-400 sm:flex
                ${side === 'left' ? 'left-3' : 'right-3'}`}
  >
    {children}
  </button>
);

export default VideoPlayer;
