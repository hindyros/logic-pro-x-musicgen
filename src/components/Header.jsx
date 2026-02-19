import React from 'react'
import { Volume2, ChevronDown, ChevronUp } from 'lucide-react'
import { useProjectStore } from '../stores/useProjectStore'
import TransportControls from './TransportControls'
import * as audioEngine from '../engine/audioEngine'

function formatTime(seconds) {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

export default function Header() {
  const position = useProjectStore((s) => s.position)
  const bpm = useProjectStore((s) => s.bpm)
  const setBpm = useProjectStore((s) => s.setBpm)
  const masterVolume = useProjectStore((s) => s.masterVolume)
  const setMasterVolume = useProjectStore((s) => s.setMasterVolume)
  const mixerVisible = useProjectStore((s) => s.mixerVisible)
  const toggleMixer = useProjectStore((s) => s.toggleMixer)

  const handleMasterVolume = (e) => {
    const v = parseFloat(e.target.value)
    setMasterVolume(v)
    audioEngine.setMasterVolume(v)
  }

  return (
    <header className="app-header">
      <span className="logo">Logic MusicGen</span>
      <div className="header-center">
        <TransportControls />
        <span className="position-display" style={{ fontVariantNumeric: 'tabular-nums', marginLeft: 'var(--space-md)', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
          {formatTime(position)}
        </span>
        <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xs)', marginLeft: 'var(--space-lg)' }}>
          <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>BPM</span>
          <input
            type="number"
            min={20}
            max={300}
            value={bpm}
            onChange={(e) => setBpm(parseInt(e.target.value, 10) || 120)}
            style={{
              width: 52,
              padding: 'var(--space-xs) var(--space-sm)',
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-default)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-primary)',
              fontSize: 'var(--text-sm)',
            }}
          />
        </label>
      </div>
      <div className="header-right">
        <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }} title="Master volume">
          <Volume2 size={16} style={{ color: 'var(--text-secondary)' }} />
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={masterVolume}
            onChange={handleMasterVolume}
            style={{ width: 72, accentColor: 'var(--accent)' }}
          />
        </label>
        <button type="button" className="button-reset btn-icon" onClick={toggleMixer} title={mixerVisible ? 'Hide mixer' : 'Show mixer'}>
          {mixerVisible ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
        </button>
      </div>
    </header>
  )
}
