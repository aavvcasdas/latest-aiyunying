import { useCallback, useEffect, useRef, useState } from 'react'
import { DURATION } from './data/film'

export function useFilmPlayer() {
  const audio = useRef<HTMLAudioElement>(null)
  const container = useRef<HTMLElement>(null)
  const [started, setStarted] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [ended, setEnded] = useState(false)
  const [time, setTime] = useState(0)
  const [duration, setDuration] = useState(DURATION)
  const [volume, setVolume] = useState(.8)
  const [muted, setMuted] = useState(false)
  const [captions, setCaptions] = useState(true)
  const [mode, setMode] = useState<'character' | 'word'>('character')
  const [speed, setSpeed] = useState(1)
  const [full, setFull] = useState(false)
  const [fallbackFull, setFallbackFull] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!audio.current) return
    audio.current.volume = volume
    audio.current.muted = muted
    audio.current.playbackRate = speed
  }, [volume, muted, speed])

  const seek = useCallback((seconds: number) => {
    if (!audio.current) return
    const target = Math.max(0, Math.min(duration - .002, seconds))
    audio.current.currentTime = target
    setTime(target); setEnded(false); setStarted(true)
  }, [duration])

  const play = useCallback(async (seconds?: number) => {
    const a = audio.current
    if (!a) return
    if (seconds !== undefined) seek(seconds)
    else if (a.ended || a.currentTime > duration-.05) seek(0)
    setStarted(true); setEnded(false); setError('')
    try { await a.play() } catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') return
      setPlaying(false)
      setError('音轨暂未能播放，请点击重试。')
    }
  }, [duration, seek])

  const toggle = useCallback(() => {
    if (audio.current && !audio.current.paused) audio.current.pause()
    else void play()
  }, [play])

  const cover = useCallback(() => {
    if (audio.current) { audio.current.pause(); audio.current.currentTime = 0 }
    setStarted(false); setEnded(false); setTime(0); setError('')
  }, [])

  const fullscreen = useCallback(async () => {
    if (document.fullscreenElement) { await document.exitFullscreen(); return }
    if (fallbackFull) { setFallbackFull(false); return }
    try {
      if (container.current?.requestFullscreen && document.fullscreenEnabled) await container.current.requestFullscreen()
      else setFallbackFull(true)
    } catch { setFallbackFull(true) }
  }, [fallbackFull])

  useEffect(() => {
    const change = () => setFull(Boolean(document.fullscreenElement))
    document.addEventListener('fullscreenchange', change)
    return () => document.removeEventListener('fullscreenchange', change)
  }, [])
  useEffect(() => {
    if (!fallbackFull) return
    const original = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') setFallbackFull(false) }
    window.addEventListener('keydown', esc)
    return () => { document.body.style.overflow = original; window.removeEventListener('keydown', esc) }
  }, [fallbackFull])

  return { audio, container, started, playing, setPlaying, ended, setEnded, time, setTime,
    duration, setDuration, volume, setVolume, muted, setMuted, captions, setCaptions,
    mode, setMode, speed, setSpeed, full: full || fallbackFull, fallbackFull, error, setError,
    seek, play, toggle, cover, fullscreen }
}
export type Player = ReturnType<typeof useFilmPlayer>