// Encapsulates audio playback state (play/pause, scrub, timestamps) for the
// reusable AudioPlayer component using Howler.js.

import { useCallback, useEffect, useRef, useState } from 'react'
import { Howl } from 'howler'

export function useAudioPlayer(src, onError, format) {
  const howlRef = useRef(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [isReady, setIsReady] = useState(false)
  const [isBuffering, setIsBuffering] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!src) {
      setIsReady(false)
      setIsPlaying(false)
      setIsBuffering(false)
      setCurrentTime(0)
      setDuration(0)
      setError(null)
      return undefined
    }

    if (howlRef.current) {
      howlRef.current.unload()
    }

    setIsReady(false)
    setIsPlaying(false)
    setIsBuffering(false)
    setCurrentTime(0)
    setDuration(0)
    setError(null)

    const handleAudioError = (details) => {
      setIsReady(false)
      setIsPlaying(false)
      setIsBuffering(false)
      setError('Audio could not be loaded.')
      if (onError) onError(details)
    }

    const howl = new Howl({
      src: [src],
      ...(format ? { format: [format] } : {}),
      html5: true,
      preload: true,
      onload: () => {
        setDuration(howl.duration())
        setIsReady(true)
        setIsBuffering(false)
      },
      onloaderror: (_id, details) => handleAudioError(details),
      onplayerror: (_id, details) => handleAudioError(details),
      onplay: () => {
        setIsPlaying(true)
        setIsBuffering(false)
      },
      onpause: () => setIsPlaying(false),
      onstop: () => setIsPlaying(false),
      onend: () => setIsPlaying(false),
      onseek: () => setCurrentTime(howl.seek()),
    })

    howlRef.current = howl

    const intervalId = setInterval(() => {
      if (howlRef.current && howlRef.current.playing()) {
        setCurrentTime(howlRef.current.seek())
      }
    }, 250)

    return () => {
      clearInterval(intervalId)
      howl.unload()
      if (howlRef.current === howl) howlRef.current = null
    }
  }, [src, onError])

  const toggle = useCallback(() => {
    if (!howlRef.current) return
    if (howlRef.current.playing()) {
      howlRef.current.pause()
    } else {
      setIsBuffering(true)
      howlRef.current.play()
    }
  }, [])

  const seek = useCallback((time) => {
    if (!howlRef.current) return
    howlRef.current.seek(time)
    setCurrentTime(time)
  }, [])

  const skip = useCallback((delta) => {
    if (!howlRef.current) return
    const current = howlRef.current.seek()
    const next = Math.min(Math.max(0, current + delta), duration)
    howlRef.current.seek(next)
    setCurrentTime(next)
  }, [duration])

  return { howlRef, isPlaying, currentTime, duration, isReady, isBuffering, error, toggle, seek, skip }
}
