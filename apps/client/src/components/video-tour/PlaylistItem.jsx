import { FiPlay } from 'react-icons/fi';

/**
 * One row in the playlist rail.
 *
 * The thumbnail uses an inline `aspectRatio` for the same reason the player
 * does — see the note in VideoPlayer.jsx.
 */
const PlaylistItem = ({ video, isActive, onSelect }) => (
  <button
    type="button"
    onClick={onSelect}
    data-active={isActive}
    aria-current={isActive ? 'true' : undefined}
    className={`group relative flex w-full items-center gap-3 rounded-xl p-2 text-left transition-colors
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-400
                ${isActive ? 'bg-white/[0.10]' : 'hover:bg-white/[0.06]'}`}
  >
    {/* Active marker — readable at a glance without relying on colour alone. */}
    <span
      aria-hidden="true"
      className={`absolute left-0 top-1/2 h-7 w-[3px] -translate-y-1/2 rounded-r-full bg-accent-500
                  transition-opacity ${isActive ? 'opacity-100' : 'opacity-0'}`}
    />

    <div
      className="relative w-[84px] shrink-0 overflow-hidden rounded-lg bg-white/5 sm:w-[96px]"
      style={{ aspectRatio: '16 / 9' }}
    >
      {video.thumbnail?.url ? (
        <img
          src={video.thumbnail.url}
          alt=""
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
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

export default PlaylistItem;
