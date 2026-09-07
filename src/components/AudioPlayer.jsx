import { useEffect } from 'react'
import { useAudioPlayer } from '../hooks/useAudioPlayer.js'
import { formatDuration } from '../lib/formatters.js'

// Single reusable audio player: play/pause, scrub, timestamps. Controls are
// keyboard-operable and aria-labeled.
export function AudioPlayer({ src, format, onSeekReady, onError, onRetry, loading = false, error = null }) {
  const player = useAudioPlayer(src, onError, format)
  const { isPlaying, currentTime, duration, isReady, isBuffering, toggle, seek, skip } = player
  const displayError = error || player.error

  useEffect(() => {
    if (onSeekReady) onSeekReady(seek)
  }, [onSeekReady, seek])

  if (!src) {
    if (loading) {
      return (
        <div className="rounded-xl border border-dashed border-line bg-surface p-4 text-sm text-muted" role="status">
          Loading audio...
        </div>
      )
    }

    if (displayError) {
      return <AudioError message={displayError} onRetry={onRetry} />
    }

    return (
      <div className="rounded-xl border border-dashed border-line bg-surface p-4 text-sm text-muted">
        No audio recording is available for this conversation.
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-line bg-surface p-4 shadow-sm">
      {displayError && (
        <AudioError message={displayError} onRetry={onRetry} />
      )}
      {loading && (
        <p className="mb-3 text-sm text-muted" role="status">Refreshing audio...</p>
      )}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => skip(-10)}
          aria-label="Rewind 10 seconds"
          className="rounded-full p-2 text-muted hover:bg-surface-muted"
        >
          <RewindIcon />
        </button>

        <button
          type="button"
          onClick={toggle}
          aria-label={isPlaying ? 'Pause' : 'Play'}
          className="flex h-11 w-11 items-center justify-center rounded-full bg-primary-500 text-white hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-surface"
          disabled={!isReady || isBuffering}
        >
          {isBuffering ? <SpinnerIcon /> : isPlaying ? <PauseIcon /> : <PlayIcon />}
        </button>

        <button
          type="button"
          onClick={() => skip(10)}
          aria-label="Forward 10 seconds"
          className="rounded-full p-2 text-muted hover:bg-surface-muted"
          disabled={!isReady}
        >
          <ForwardIcon />
        </button>

        <span className="w-12 text-right font-mono text-xs text-muted tabular-nums">
          {formatDuration(currentTime)}
        </span>

        <input
          type="range"
          min={0}
          max={duration || 0}
          step={0.1}
          value={currentTime}
          onChange={(e) => seek(Number(e.target.value))}
          aria-label="Seek audio position"
          className="h-1.5 flex-1 appearance-none rounded-full bg-surface-muted accent-primary-500"
          disabled={!isReady}
        />

        <span className="w-12 font-mono text-xs text-muted tabular-nums">{formatDuration(duration)}</span>
      </div>
    </div>
  )
}

function AudioError({ message, onRetry }) {
  return (
    <div className="mb-3 flex items-center justify-between gap-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
      <span>{message}</span>
      {onRetry && (
        <button type="button" onClick={onRetry} className="font-medium underline hover:no-underline">
          Try again
        </button>
      )}
    </div>
  )
}

function PlayIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5" aria-hidden="true">
      <path d="M8 5v14l11-7z" />
    </svg>
  )
}

function PauseIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5" aria-hidden="true">
      <path d="M6 5h4v14H6zM14 5h4v14h-4z" />
    </svg>
  )
}

function RewindIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5" aria-hidden="true">
      <path d="M11 6v12L2.5 12zM21 6v12l-8.5-6z" />
    </svg>
  )
}

function ForwardIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5" aria-hidden="true">
      <path d="M13 6v12l8.5-6zM3 6v12l8.5-6z" />
    </svg>
  )
}

function SpinnerIcon() {
  return (
    <svg className="h-6 w-6 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2.5" strokeDasharray="14" strokeDashoffset="0" />
      <path d="M12 3a9 9 0 0 1 9 9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" fill="none" />
    </svg>
  )
}
