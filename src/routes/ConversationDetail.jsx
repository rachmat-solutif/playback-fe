import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { AudioPlayer } from '../components/AudioPlayer.jsx'
import { fetchConversation, fetchAudioUrl } from '../lib/api.js'
import { formatDateTime, formatDuration, formatConversationId } from '../lib/formatters.js'

// Conversation detail + audio playback.
export default function ConversationDetail() {
  const { id } = useParams()
  const [conversation, setConversation] = useState(null)
  const [audioSrc, setAudioSrc] = useState(null)
  const [audioLoading, setAudioLoading] = useState(false)
  const [audioError, setAudioError] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const seekRef = useRef(null)
  const audioRequestIdRef = useRef(0)
  const audioRefreshAttemptsRef = useRef(0)
  const handleSeekReady = useCallback((seek) => {
    seekRef.current = seek
  }, [])

  const loadAudio = useCallback(async (conversationId) => {
    const requestId = ++audioRequestIdRef.current
    setAudioSrc(null)
    setAudioLoading(true)
    setAudioError(null)

    try {
      const url = await fetchAudioUrl(conversationId)
      if (requestId === audioRequestIdRef.current) setAudioSrc(url)
    } catch (err) {
      if (requestId === audioRequestIdRef.current) {
        setAudioError(err.message || 'Audio could not be loaded.')
      }
    } finally {
      if (requestId === audioRequestIdRef.current) setAudioLoading(false)
    }
  }, [])

  const retryAudio = useCallback(() => {
    if (!id) return
    audioRefreshAttemptsRef.current = 0
    loadAudio(id)
  }, [id, loadAudio])

  const handleAudioLoadError = useCallback(() => {
    if (!id) return

    if (audioRefreshAttemptsRef.current < 1) {
      audioRefreshAttemptsRef.current += 1
      loadAudio(id)
      return
    }

    setAudioError('Audio could not be loaded. Please try again.')
  }, [id, loadAudio])

  useEffect(() => {
    let cancelled = false
    audioRefreshAttemptsRef.current = 0
    audioRequestIdRef.current += 1
    setLoading(true)
    setError(null)
    setConversation(null)
    setAudioSrc(null)
    setAudioError(null)

    fetchConversation(id)
      .then((data) => {
        if (cancelled) return
        setConversation(data)
        return loadAudio(id)
      })
      .catch((err) => {
        if (!cancelled) setError(err.message)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
      audioRequestIdRef.current += 1
    }
  }, [id, loadAudio])

  if (loading) {
    return <p className="text-body">Loading...</p>
  }

  if (error || !conversation) {
    return (
      <div className="space-y-4">
        <p className="text-body">{error || 'Conversation not found.'}</p>
        <Link to="/conversations" className="text-sm font-medium text-primary-600 hover:underline">
          Back to conversations
        </Link>
      </div>
    )
  }

  const c = conversation

  return (
    <div className="space-y-6">
      <Link to="/conversations" className="inline-block text-sm font-medium text-primary-600 hover:underline">
        Back to conversations
      </Link>

      <div className="rounded-xl border border-line bg-surface p-5 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-strong">{formatConversationId(c.id)}</h1>
          {c.tags && c.tags.length > 0 && (
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {c.tags.map((tag) => (
                <span
                  key={tag.label || tag}
                  className="inline-block rounded-full bg-primary-50 px-2.5 py-0.5 text-xs font-medium text-primary-700"
                >
                  {tag.label || tag}
                </span>
              ))}
            </div>
          )}
        </div>

        <dl className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          <Meta label="Customer" value={c.customer?.name || c.customer} />
          <Meta label="Agent" value={c.agent?.name || c.agent} />
          <Meta label="Channel" value={c.channel} />
          <Meta label="Duration" value={c.durationSeconds ? formatDuration(c.durationSeconds) : '-'} />
          <Meta label="Started" value={formatDateTime(c.startedAt)} />
        </dl>
      </div>

      <section>
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted">Recording</h2>
        <AudioPlayer
          src={audioSrc}
          format={c.audio?.format}
          error={audioError}
          loading={audioLoading}
          onError={handleAudioLoadError}
          onRetry={retryAudio}
          onSeekReady={handleSeekReady}
        />
      </section>
    </div>
  )
}

function Meta({ label, value }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-faint">{label}</dt>
      <dd className="mt-0.5 text-sm text-body">{value}</dd>
    </div>
  )
}
