import React, { useEffect } from 'react'
import { useProjectStore } from './stores/useProjectStore'
import * as audioEngine from './engine/audioEngine'
import Header from './components/Header'
import TrackPanel from './components/TrackPanel'
import Timeline from './components/Timeline'
import AIPanel from './components/AIPanel'
import Mixer from './components/Mixer'
import './styles/variables.css'
import './styles/App.css'
import './styles/components.css'

export default function App() {
  const mixerVisible = useProjectStore((s) => s.mixerVisible)

  const tracks = useProjectStore((s) => s.tracks)

  useEffect(() => {
    const setPosition = useProjectStore.getState().setPosition
    audioEngine.setPositionCallback((pos) => setPosition(pos))
    return () => audioEngine.setPositionCallback(null)
  }, [])

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) return
      if (e.code === 'Space') {
        e.preventDefault()
        const playing = useProjectStore.getState().playing
        if (playing) {
          audioEngine.stop()
          useProjectStore.getState().setPlaying(false)
          useProjectStore.getState().setPosition(audioEngine.getPosition())
        } else {
          audioEngine.play().then(() => useProjectStore.getState().setPlaying(true))
        }
      }
      if (e.code === 'KeyR' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault()
        audioEngine.rewind()
        useProjectStore.getState().setPosition(0)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  const trackIdsAndUrls = tracks.map((t) => t.id + '|' + (t.url || '')).join(',')
  useEffect(() => {
    tracks.forEach((t) => {
      if (t.url) {
        audioEngine.loadTrack(t.id, t.url, { mute: t.mute, solo: t.solo, volume: t.volume }).catch(() => {})
      }
    })
  }, [trackIdsAndUrls])

  return (
    <div className="app">
      <Header />

      <main className="app-main">
        <TrackPanel />
        <Timeline />
        <AIPanel />
      </main>

      <div className={`mixer-bar ${mixerVisible ? '' : 'collapsed'}`}>
        <Mixer />
      </div>
    </div>
  )
}
