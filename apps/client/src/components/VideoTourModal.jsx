import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiPlay, FiChevronLeft, FiChevronRight } from 'react-icons/fi';

/**
 * Full-screen video player with a playlist rail.
 *
 * Rendered through a portal to document.body: the trigger lives inside the
 * hero, which has its own stacking context and transforms, and a fixed
 * overlay nested in there would be clipped by its ancestor rather than
 * covering the viewport.
 *
 * The iframe is only mounted while the modal is open, so a closed player is
 * not sitting in the background holding a YouTube connection.
 */

const RAIL_WIDTH = 336; // px — desktop playlist column

const buildEmbedUrl = (video, { autoplay = true } = {}) => {
  if (!video?.videoId) return '';

  if (video.provider === 'vimeo') {
    const params = new URLSearchParams({ byline: '0', portrait: '0' });
    if (autoplay) { params.set('autoplay', '1'); params.set('muted', '1'); }
    return `https://player.vimeo.com/video/${video.videoId}?${params}`;
  }

  const params = new URLSearchParams({
    rel: '0',
    modestbranding: '1',
    playsinline: '1',
  });
  // Autoplay only works muted; requesting sound means it silently never
  // starts, which reads as a broken player.
  if (autoplay) { params.set('autoplay', '1'); params.set('mute', '1'); }
  return `https://www.youtube-nocookie.com/embed/${video.videoId}?${params}`;
};

const VideoTourModal = ({ open, videos = [], initialIndex = 0, onClose }) => {
  const [index, setIndex] = useState(initialIndex);
  const panelRef = useRef(null);
  const railRef = useRef(null);
  const previouslyFocused = useRef(null);

  const active = videos[index] || videos[0] || null;

  // A rail holding a single item is just chrome — with one video the player
  // takes the full panel and the close control floats over it.
  const hasPlaylist = videos.length > 1;

  // Reset to the requested video each time the modal opens, so reopening does
  // not resume wherever the previous session left off.
  useEffect(() => {
    if (open) setIndex(initialIndex);
  }, [open, initialIndex]);

  // Lock the page behind the modal and restore focus to the trigger on close.
  // The scrollbar is compensated with padding so the page underneath does not
  // shift sideways as the overlay opens.
  useEffect(() => {
    if (!open) return;

    previouslyFocused.current = document.activeElement;
    const { overflow, paddingRight } = document.body.style;
    const gutter = window.innerWidth - document.documentElement.clientWidth;

    document.body.style.overflow = 'hidden';
    if (gutter > 0) document.body.style.paddingRight = `${gutter}px`;

    panelRef.current?.focus();

    return () => {
      document.body.style.overflow = overflow;
      document.body.style.paddingRight = paddingRight;
      previouslyFocused.current?.focus?.();
    };
  }, [open]);

  // Keep the playing item visible when the selection moves by keyboard.
  useEffect(() => {
    if (!open || !hasPlaylist) return;
    railRef.current
      ?.querySelector('[data-active="true"]')
      ?.scrollIntoView({ block: 'nearest' });
  }, [index, open, hasPlaylist]);

  const go = useCallback(
    (delta) => setIndex((i) => (i + delta + videos.length) % videos.length),
    [videos.length]
  );

  const handleKey = useCallback(
    (e) => {
      if (e.key === 'Escape') { onClose?.(); return; }
      // Arrow keys move through the playlist. Focus inside the iframe belongs
      // to the player, so those events never reach this handler anyway.
      if (videos.length < 2) return;
      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') { e.preventDefault(); go(1); }
      if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') { e.preventDefault(); go(-1); }
    },
    [onClose, videos.length, go]
  );

  useEffect(() => {
    if (!open) return;
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, handleKey]);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {open && active && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 lg:p-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          role="dialog"
          aria-modal="true"
          aria-label="Video tours"
        >
          <div
            className="absolute inset-0 bg-dark-950/90 backdrop-blur-md"
            onClick={onClose}
          />

          {/*
            The panel is sized *from the player*, not the other way around.

            An earlier version gave the panel a fixed height and asked the
            iframe wrapper to derive its width from `aspect-video` inside a
            flex row — which collapses to a small centred box, leaving the
            video floating in dead space. Here the player owns a real
            `aspect-video` box whose width is capped so that
            player + rail + padding still fit the viewport in both axes, and
            the panel wraps tightly around it. No letterboxing, no dead space.
          */}
          <motion.div
            ref={panelRef}
            tabIndex={-1}
            className="relative flex w-full flex-col overflow-hidden rounded-2xl bg-dark-950
                       shadow-[0_30px_90px_-20px_rgba(0,0,0,0.9)] ring-1 ring-white/10
                       outline-none max-h-[94vh] lg:w-auto lg:flex-row"
            initial={{ scale: 0.96, y: 16, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.96, y: 16, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* ── Player ──────────────────────────────────────────────
                The player always keeps 16:9. What differs per breakpoint is
                which axis is the binding constraint:

                  mobile  — width is whatever the viewport gives; the rail
                            stacks underneath and gets the remaining 40vh.
                  desktop — width is capped so 16:9 stays inside the viewport
                            height *and* leaves room for the rail beside it. */}
            <div
              className="relative aspect-video w-full shrink-0 bg-black
                         lg:w-[min(1280px,calc(96vw-var(--rail-w)-4rem),calc((94vh-4rem)*16/9))]"
              style={{ '--rail-w': hasPlaylist ? `${RAIL_WIDTH}px` : '0px' }}
            >
              <iframe
                key={active.videoId}
                src={buildEmbedUrl(active)}
                title={active.title}
                className="absolute inset-0 h-full w-full"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />

              {/* Prev / next sit on the player so the primary interaction is
                  reachable without travelling to the rail. */}
              {hasPlaylist && (
                <>
                  <button
                    onClick={() => go(-1)}
                    aria-label="Previous video"
                    className="group absolute left-3 top-1/2 hidden h-11 w-11 -translate-y-1/2 items-center
                               justify-center rounded-full border border-white/15 bg-black/50 text-white/70
                               backdrop-blur-sm transition hover:bg-black/75 hover:text-white
                               focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-400
                               sm:flex"
                  >
                    <FiChevronLeft className="h-5 w-5 transition-transform group-hover:-translate-x-0.5" />
                  </button>
                  <button
                    onClick={() => go(1)}
                    aria-label="Next video"
                    className="group absolute right-3 top-1/2 hidden h-11 w-11 -translate-y-1/2 items-center
                               justify-center rounded-full border border-white/15 bg-black/50 text-white/70
                               backdrop-blur-sm transition hover:bg-black/75 hover:text-white
                               focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-400
                               sm:flex"
                  >
                    <FiChevronRight className="h-5 w-5 transition-transform group-hover:translate-x-0.5" />
                  </button>
                </>
              )}
            </div>

            {/* Single video: no rail to show, so the close control floats
                over the player instead of occupying a rail header. */}
            {!hasPlaylist && (
              <button
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

            {/* ── Playlist ─────────────────────────────────────────────
                Fixed column on desktop; a bounded, scrollable drawer below
                the player on mobile. */}
            <aside
              className={`min-h-0 w-full shrink-0 flex-col border-t border-white/10 bg-dark-900
                          max-h-[40vh] lg:max-h-none lg:w-[var(--rail-w)] lg:border-l lg:border-t-0
                          ${hasPlaylist ? 'flex' : 'hidden'}`}
              style={{ '--rail-w': `${RAIL_WIDTH}px` }}
            >
              <header className="flex shrink-0 items-center justify-between gap-3 border-b border-white/10 px-4 py-3 sm:px-5 sm:py-4">
                <div className="min-w-0">
                  <h2 className="truncate font-display text-base leading-tight text-white sm:text-lg">
                    Video Tours
                  </h2>
                  <p className="mt-0.5 text-[11px] text-white/40 sm:text-xs">
                    {index + 1} of {videos.length}
                  </p>
                </div>
                <button
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
                ref={railRef}
                className="custom-scrollbar min-h-0 flex-1 space-y-1 overflow-y-auto p-2 sm:p-3"
              >
                {videos.map((video, i) => {
                  const isActive = i === index;
                  return (
                    <button
                      key={video._id || video.videoId}
                      onClick={() => setIndex(i)}
                      data-active={isActive}
                      aria-current={isActive ? 'true' : undefined}
                      className={`group relative flex w-full items-center gap-3 rounded-xl p-2 text-left
                                  transition-colors focus-visible:outline-none focus-visible:ring-2
                                  focus-visible:ring-accent-400
                        ${isActive ? 'bg-white/[0.10]' : 'hover:bg-white/[0.06]'}`}
                    >
                      {/* Active marker — a rail cue that survives at a glance. */}
                      <span
                        className={`absolute left-0 top-1/2 h-7 w-[3px] -translate-y-1/2 rounded-r-full
                                    bg-accent-500 transition-opacity ${isActive ? 'opacity-100' : 'opacity-0'}`}
                        aria-hidden="true"
                      />

                      <div className="relative aspect-video w-[104px] shrink-0 overflow-hidden rounded-lg bg-white/5">
                        {video.thumbnail?.url ? (
                          <img
                            src={video.thumbnail.url}
                            alt=""
                            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                            loading="lazy"
                          />
                        ) : null}
                        <span className="absolute inset-0 flex items-center justify-center bg-black/20">
                          <span
                            className={`flex h-6 w-6 items-center justify-center rounded-full transition-colors
                              ${isActive ? 'bg-accent-500' : 'bg-black/60 group-hover:bg-black/80'}`}
                          >
                            <FiPlay className="ml-0.5 h-2.5 w-2.5 text-white" />
                          </span>
                        </span>
                        {video.duration && (
                          <span className="absolute bottom-1 right-1 rounded bg-black/80 px-1 text-[9px] tabular-nums text-white">
                            {video.duration}
                          </span>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p
                          className={`line-clamp-2 text-[13px] leading-snug transition-colors
                            ${isActive ? 'font-medium text-white' : 'text-white/70 group-hover:text-white'}`}
                        >
                          {video.title}
                        </p>
                        {isActive && (
                          <p className="mt-1 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-accent-400">
                            <span className="relative flex h-1.5 w-1.5">
                              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent-400 opacity-75" />
                              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-accent-400" />
                            </span>
                            Now playing
                          </p>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </aside>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default VideoTourModal;
