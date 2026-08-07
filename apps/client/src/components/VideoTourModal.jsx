import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX } from 'react-icons/fi';

import VideoPlayer from './video-tour/VideoPlayer';
import PlaylistRail from './video-tour/PlaylistRail';
import { useModalBehavior } from './video-tour/useModalBehavior';

/**
 * Video tour player with a playlist.
 *
 * Rendered through a portal to document.body: the trigger lives inside the
 * hero, which has its own stacking context and transforms, so a fixed overlay
 * nested there would be clipped by its ancestor instead of covering the
 * viewport. The iframe only mounts while open, so a closed player is not
 * sitting in the background holding a connection.
 *
 * ── Layout ───────────────────────────────────────────────────────────────
 * Two genuinely different layouts rather than one layout with mobile bolted
 * on:
 *
 *   < lg   bottom sheet — full-bleed 16:9 player pinned at the top, playlist
 *          filling the remaining height and scrolling inside it.
 *   ≥ lg   centred dialog — player beside a fixed-width rail, sized so 16:9
 *          fits within the viewport on both axes.
 *
 * The player is `shrink-0` and the rail is the only flexible track. If both
 * are rigid they fight, and the rail's content wins by squeezing the player
 * to zero height — which is what made the video vanish on phones.
 */

const RAIL_WIDTH = 336; // px — desktop playlist column

const VideoTourModal = ({ open, videos = [], initialIndex = 0, onClose }) => {
  const [index, setIndex] = useState(initialIndex);
  const panelRef = useModalBehavior(open, onClose);

  const active = videos[index] || videos[0] || null;

  // A rail holding a single item is just chrome: with one video the player
  // takes the whole panel and the close control floats over it.
  const hasPlaylist = videos.length > 1;

  // Reset to the requested video each time the modal opens, so reopening does
  // not resume wherever the previous session left off.
  useEffect(() => {
    if (open) setIndex(initialIndex);
  }, [open, initialIndex]);

  const go = useCallback(
    (delta) => setIndex((i) => (i + delta + videos.length) % videos.length),
    [videos.length]
  );

  // Arrow keys step through the playlist. Escape is handled by useModalBehavior.
  useEffect(() => {
    if (!open || videos.length < 2) return undefined;

    const onKeyDown = (event) => {
      if (event.key === 'ArrowDown' || event.key === 'ArrowRight') {
        event.preventDefault();
        go(1);
      }
      if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') {
        event.preventDefault();
        go(-1);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, videos.length, go]);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {open && active && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center sm:p-6 lg:p-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          role="dialog"
          aria-modal="true"
          aria-label="Video tours"
        >
          <div className="absolute inset-0 bg-dark-950/90 backdrop-blur-md" onClick={onClose} />

          <motion.div
            ref={panelRef}
            tabIndex={-1}
            className="relative flex max-h-[92dvh] w-full flex-col overflow-hidden bg-dark-950
                       shadow-[0_30px_90px_-20px_rgba(0,0,0,0.9)] ring-1 ring-white/10 outline-none
                       rounded-t-2xl sm:rounded-2xl lg:max-h-[90vh] lg:w-auto lg:flex-row"
            initial={{ scale: 0.96, y: 16, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.96, y: 16, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* Sheet grab handle — mobile affordance only. */}
            <div
              aria-hidden="true"
              className="absolute inset-x-0 top-0 z-20 flex justify-center pt-2 sm:hidden"
            >
              <span className="h-1 w-9 rounded-full bg-white/30" />
            </div>

            {/*
              Width caps, per layout:
                stacked — additionally limited to 52dvh worth of width, or a
                          full-width 16:9 player would consume the whole panel
                          on a short/landscape screen and leave the playlist
                          with negative space.
                desktop — capped so the player plus the rail plus padding fit
                          the viewport on both axes.
            */}
            <VideoPlayer
              video={active}
              hasPlaylist={hasPlaylist}
              onPrev={() => go(-1)}
              onNext={() => go(1)}
              // Written as a literal, not a template: Tailwind scans source
              // text statically and cannot see an interpolated class name.
              className={`lg:w-[min(1280px,calc(96vw-336px-4rem),calc((90vh-2rem)*16/9))]
                          ${hasPlaylist ? 'max-w-[calc(52dvh*16/9)] lg:max-w-none' : ''}`}
            />

            {/* One video: no rail, so the close control floats on the player. */}
            {!hasPlaylist && (
              <button
                type="button"
                onClick={onClose}
                aria-label="Close video player"
                className="absolute right-3 top-3 z-10 flex h-10 w-10 items-center justify-center
                           rounded-full border border-white/15 bg-black/60 text-white/80 backdrop-blur-sm
                           transition hover:bg-black/85 hover:text-white focus-visible:outline-none
                           focus-visible:ring-2 focus-visible:ring-accent-400"
              >
                <FiX className="h-4 w-4" />
              </button>
            )}

            {hasPlaylist && (
              <PlaylistRail
                videos={videos}
                index={index}
                onSelect={setIndex}
                onClose={onClose}
                railWidth={RAIL_WIDTH}
              />
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default VideoTourModal;
