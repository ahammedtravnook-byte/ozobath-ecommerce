import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiPlay } from 'react-icons/fi';

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
  const previouslyFocused = useRef(null);

  const active = videos[index] || videos[0] || null;

  // Reset to the requested video each time the modal opens, so reopening does
  // not resume wherever the previous session left off.
  useEffect(() => {
    if (open) setIndex(initialIndex);
  }, [open, initialIndex]);

  // Lock the page behind the modal and restore focus to the trigger on close.
  useEffect(() => {
    if (!open) return;

    previouslyFocused.current = document.activeElement;
    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';

    panelRef.current?.focus();

    return () => {
      document.body.style.overflow = overflow;
      previouslyFocused.current?.focus?.();
    };
  }, [open]);

  const handleKey = useCallback(
    (e) => {
      if (e.key === 'Escape') { onClose?.(); return; }
      // Arrow keys move through the playlist, but not while the user is
      // interacting with the iframe.
      if (videos.length < 2) return;
      if (e.key === 'ArrowDown') { e.preventDefault(); setIndex((i) => Math.min(i + 1, videos.length - 1)); }
      if (e.key === 'ArrowUp') { e.preventDefault(); setIndex((i) => Math.max(i - 1, 0)); }
    },
    [onClose, videos.length]
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
          className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          role="dialog"
          aria-modal="true"
          aria-label="Video tours"
        >
          <div className="absolute inset-0 bg-black/85 backdrop-blur-sm" onClick={onClose} />

          <motion.div
            ref={panelRef}
            tabIndex={-1}
            className="relative w-full max-w-6xl bg-[#0d0d0f] rounded-2xl overflow-hidden shadow-2xl outline-none
                       flex flex-col lg:flex-row max-h-[92vh]"
            initial={{ scale: 0.97, y: 12 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.97, y: 12 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* ── Player ── */}
            <div className="flex-1 min-w-0 bg-black flex items-center">
              <div className="w-full aspect-video">
                <iframe
                  key={active.videoId}
                  src={buildEmbedUrl(active)}
                  title={active.title}
                  className="w-full h-full"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              </div>
            </div>

            {/* ── Playlist ── */}
            <aside
              className="w-full lg:w-[340px] shrink-0 bg-[#141416] border-t lg:border-t-0 lg:border-l border-white/10
                         flex flex-col max-h-[45vh] lg:max-h-none"
            >
              <header className="flex items-center justify-between gap-3 px-5 py-4 border-b border-white/10 shrink-0">
                <div className="min-w-0">
                  <h2 className="text-white font-display text-lg leading-tight truncate">Video Tours</h2>
                  {videos.length > 1 && (
                    <p className="text-white/40 text-xs mt-0.5">{videos.length} videos</p>
                  )}
                </div>
                <button
                  onClick={onClose}
                  className="flex items-center gap-1.5 text-white/60 hover:text-white text-sm transition-colors shrink-0"
                  aria-label="Close video player"
                >
                  <FiX className="w-4 h-4" />
                  Close
                </button>
              </header>

              <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2">
                {videos.map((video, i) => {
                  const isActive = i === index;
                  return (
                    <button
                      key={video._id || video.videoId}
                      onClick={() => setIndex(i)}
                      aria-current={isActive ? 'true' : undefined}
                      className={`w-full flex items-center gap-3 p-2 rounded-xl text-left transition-colors group
                        ${isActive ? 'bg-white/[0.12]' : 'hover:bg-white/[0.06]'}`}
                    >
                      <div className="relative w-[92px] h-[52px] rounded-lg overflow-hidden bg-white/5 shrink-0">
                        {video.thumbnail?.url ? (
                          <img
                            src={video.thumbnail.url}
                            alt=""
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        ) : null}
                        <span className="absolute inset-0 flex items-center justify-center">
                          <span
                            className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors
                              ${isActive ? 'bg-accent-500' : 'bg-black/60 group-hover:bg-black/75'}`}
                          >
                            <FiPlay className="w-2.5 h-2.5 text-white ml-0.5" />
                          </span>
                        </span>
                        {video.duration && (
                          <span className="absolute bottom-1 right-1 px-1 rounded bg-black/80 text-white text-[9px] tabular-nums">
                            {video.duration}
                          </span>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p
                          className={`text-[13px] leading-snug line-clamp-2 transition-colors
                            ${isActive ? 'text-white font-medium' : 'text-white/70 group-hover:text-white'}`}
                        >
                          {video.title}
                        </p>
                        {isActive && (
                          <p className="text-accent-400 text-[10px] font-semibold uppercase tracking-wider mt-1">
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
