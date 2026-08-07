import { useEffect, useRef } from 'react';
import { FiX } from 'react-icons/fi';
import PlaylistItem from './PlaylistItem';

/**
 * The playlist column (desktop) / drawer (mobile).
 *
 * Mobile: this is the only flexible track in the panel's flex column, so it
 * absorbs whatever height the player leaves and scrolls internally. `min-h-0`
 * is what allows that — without it a flex child refuses to shrink below its
 * content height and pushes the player off-screen instead.
 */
const PlaylistRail = ({ videos, index, onSelect, onClose, railWidth }) => {
  const listRef = useRef(null);

  // Keep the playing item visible when selection moves via keyboard.
  useEffect(() => {
    listRef.current
      ?.querySelector('[data-active="true"]')
      ?.scrollIntoView({ block: 'nearest' });
  }, [index]);

  return (
    <aside
      className="flex min-h-0 w-full flex-1 flex-col border-t border-white/10 bg-dark-900
                 lg:w-[var(--rail-w)] lg:flex-none lg:border-l lg:border-t-0"
      style={{ '--rail-w': `${railWidth}px` }}
    >
      <header className="flex shrink-0 items-center justify-between gap-3 border-b border-white/10 px-4 py-2.5 sm:px-5 sm:py-4">
        <div className="min-w-0">
          <h2 className="truncate font-display text-sm leading-tight text-white sm:text-lg">
            Video Tours
          </h2>
          <p className="mt-0.5 text-[11px] text-white/40 sm:text-xs">
            {index + 1} of {videos.length}
          </p>
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label="Close video player"
          className="flex shrink-0 items-center gap-1.5 rounded-full border border-white/10 px-3 py-1.5
                     text-sm text-white/60 transition hover:border-white/25 hover:bg-white/5
                     hover:text-white focus-visible:outline-none focus-visible:ring-2
                     focus-visible:ring-accent-400"
        >
          <FiX className="h-4 w-4" />
          <span className="hidden sm:inline">Close</span>
        </button>
      </header>

      <div
        ref={listRef}
        className="custom-scrollbar min-h-0 flex-1 space-y-1 overflow-y-auto overscroll-contain p-2 sm:p-3"
        // As a bottom sheet the rail reaches the physical screen edge, so the
        // last row would otherwise sit under the iOS home indicator.
        style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))' }}
      >
        {videos.map((video, i) => (
          <PlaylistItem
            key={video._id || video.videoId}
            video={video}
            isActive={i === index}
            onSelect={() => onSelect(i)}
          />
        ))}
      </div>
    </aside>
  );
};

export default PlaylistRail;
