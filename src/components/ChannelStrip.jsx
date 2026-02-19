import React from 'react'
import { VolumeX, Mic } from 'lucide-react'
import { useProjectStore } from '../stores/useProjectStore'
import * as audioEngine from '../engine/audioEngine'

const BADGE_COLORS = {
  piano: 'var(--badge-piano)',
  drums: 'var(--badge-drums)',
  bass: 'var(--badge-bass)',
  guitar: 'var(--badge-guitar)',
  synth: 'var(--badge-synth)',
  strings: 'var(--badge-strings)',
  brass: 'var(--badge-brass)',
  vocals: 'var(--badge-vocals)',
}

export default function ChannelStrip({ track, isMaster }) {
  const updateTrack = useProjectStore((s) => s.updateTrack)
  const masterVolume = useProjectStore((s) => s.masterVolume)
  const setMasterVolume = useProjectStore((s) => s.setMasterVolume)

  if (isMaster) {
    return (
      <div
        style={{
          width: 56,
          flexShrink: 0,
          padding: 'var(--space-sm)',
          background: 'var(--bg-active)',
          borderRadius: 'var(--radius-md)',
          marginLeft: 'var(--space-md)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 'var(--space-xs)',
        }}
      >
        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>Master</span>
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={masterVolume}
          onChange={(e) => {
            const v = parseFloat(e.target.value)
            setMasterVolume(v)
            audioEngine.setMasterVolume(v)
          }}
          style={{ width: 8, height: 72, writingMode: 'vertical-lr', direction: 'rtl', accentColor: 'var(--accent)' }}
        />
      </div>
    )
  }

  const color = BADGE_COLORS[track.instrument] || 'var(--text-muted)'

  const handleVolume = (e) => {
    const v = parseFloat(e.target.value)
    updateTrack(track.id, { volume: v })
    audioEngine.setTrackVolume(track.id, v)
  }
  const handleMute = () => {
    const next = !track.mute
    updateTrack(track.id, { mute: next })
    audioEngine.setTrackMute(track.id, next)
  }
  const handleSolo = () => {
    const next = !track.solo
    updateTrack(track.id, { solo: next })
    audioEngine.setTrackSolo(track.id, next)
  }

  return (
    <div
      style={{
        width: 56,
        flexShrink: 0,
        padding: 'var(--space-sm)',
        background: 'var(--bg-elevated)',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border-subtle)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 'var(--space-xs)',
      }}
    >
      <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%' }} title={track.name}>
        {track.name}
      </span>
      <div style={{ width: 8, height: 8, borderRadius: 4, background: color }} />
      <input
        type="range"
        min={0}
        max={1}
        step={0.01}
        value={track.volume}
        onChange={handleVolume}
        style={{ width: 8, height: 72, writingMode: 'vertical-lr', direction: 'rtl', accentColor: 'var(--accent)' }}
      />
      <div style={{ display: 'flex', gap: 2 }}>
        <button type="button" className="button-reset btn-icon" onClick={handleMute} title={track.mute ? 'Unmute' : 'Mute'} style={{ color: track.mute ? 'var(--accent)' : 'var(--text-muted)' }}>
          <VolumeX size={14} />
        </button>
        <button type="button" className="button-reset btn-icon" onClick={handleSolo} title={track.solo ? 'Solo off' : 'Solo'} style={{ color: track.solo ? 'var(--accent)' : 'var(--text-muted)' }}>
          <Mic size={14} />
        </button>
      </div>
    </div>
  )
}
