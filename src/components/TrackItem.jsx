import React, { useState } from 'react'
import { Volume2, VolumeX, Mic, MicOff, Trash2, RefreshCw, Music } from 'lucide-react'
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

export default function TrackItem({ track }) {
  const [editingName, setEditingName] = useState(false)
  const [localName, setLocalName] = useState(track.name)
  const updateTrack = useProjectStore((s) => s.updateTrack)
  const removeTrack = useProjectStore((s) => s.removeTrack)

  const color = BADGE_COLORS[track.instrument] || 'var(--text-muted)'

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

  const handleVolume = (e) => {
    const v = parseFloat(e.target.value)
    updateTrack(track.id, { volume: v })
    audioEngine.setTrackVolume(track.id, v)
  }

  const handleDelete = () => {
    audioEngine.unloadTrack(track.id)
    removeTrack(track.id)
  }

  const params = track.generationParams
  const canRegenerate = params && track.url
  const handleRegenerate = () => {
    if (!canRegenerate) return
    const payload = {
      prompt: params.prompt,
      instrument: params.instrument || track.instrument,
      genre: params.genre,
      duration: params.duration || 8,
    }
    fetch('/api/generate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      .then((r) => r.json())
      .then((data) => {
        const id = data.generationId
        useProjectStore.getState().addGeneration({ id, status: data.status || 'starting', progress: 0, trackId: data.trackId, ...payload })
        if (data.status === 'complete' && data.trackId) return
        const poll = () => {
          fetch(`/api/generate/status/${encodeURIComponent(id)}`)
            .then((r) => r.json())
            .then((s) => {
              useProjectStore.getState().updateGeneration(id, { status: s.status, progress: s.progress ?? 0.5, trackId: s.trackId, error: s.error })
              if (s.status !== 'complete' && s.status !== 'failed') setTimeout(poll, 1500)
            })
        }
        setTimeout(poll, 1000)
      })
  }

  const handleContinue = () => {
    if (!track.url) return
    const payload = {
      prompt: params?.prompt || 'continue the music',
      instrument: track.instrument,
      genre: params?.genre,
      duration: params?.duration || 8,
      inputTrackId: track.id,
      continuation: true,
    }
    fetch('/api/generate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      .then((r) => r.json())
      .then((data) => {
        const id = data.generationId
        useProjectStore.getState().addGeneration({ id, status: data.status || 'starting', progress: 0, trackId: data.trackId, ...payload })
        if (data.status === 'complete' && data.trackId) return
        const poll = () => {
          fetch(`/api/generate/status/${encodeURIComponent(id)}`)
            .then((r) => r.json())
            .then((s) => {
              useProjectStore.getState().updateGeneration(id, { status: s.status, progress: s.progress ?? 0.5, trackId: s.trackId, error: s.error })
              if (s.status !== 'complete' && s.status !== 'failed') setTimeout(poll, 1500)
            })
        }
        setTimeout(poll, 1000)
      })
  }

  const handleNameBlur = () => {
    setEditingName(false)
    if (localName.trim()) updateTrack(track.id, { name: localName.trim() })
    else setLocalName(track.name)
  }

  return (
    <div
      className="track-item"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-sm)',
        padding: 'var(--space-sm) var(--space-md)',
        borderBottom: '1px solid var(--border-subtle)',
        minHeight: 44,
      }}
    >
      <span
        style={{
          width: 8,
          height: 8,
          borderRadius: 4,
          background: color,
          flexShrink: 0,
        }}
      />
      {editingName ? (
        <input
          type="text"
          value={localName}
          onChange={(e) => setLocalName(e.target.value)}
          onBlur={handleNameBlur}
          onKeyDown={(e) => e.key === 'Enter' && handleNameBlur()}
          autoFocus
          style={{
            flex: 1,
            minWidth: 0,
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-sm)',
            color: 'var(--text-primary)',
            padding: 'var(--space-xs) var(--space-sm)',
            fontSize: 'var(--text-sm)',
          }}
        />
      ) : (
        <button
          type="button"
          className="button-reset"
          onClick={() => setEditingName(true)}
          style={{ flex: 1, minWidth: 0, textAlign: 'left', fontSize: 'var(--text-sm)', color: 'var(--text-primary)' }}
        >
          {track.name}
        </button>
      )}
      <button type="button" className="button-reset btn-icon" onClick={handleMute} title={track.mute ? 'Unmute' : 'Mute'} style={{ color: track.mute ? 'var(--accent)' : 'var(--text-secondary)' }}>
        {track.mute ? <VolumeX size={14} /> : <Volume2 size={14} />}
      </button>
      <button type="button" className="button-reset btn-icon" onClick={handleSolo} title={track.solo ? 'Solo off' : 'Solo'} style={{ color: track.solo ? 'var(--accent)' : 'var(--text-secondary)' }}>
        {track.solo ? <Mic size={14} /> : <MicOff size={14} />}
      </button>
      <input
        type="range"
        min={0}
        max={1}
        step={0.01}
        value={track.volume}
        onChange={handleVolume}
        style={{ width: 48, accentColor: 'var(--accent)' }}
        title="Volume"
      />
      {canRegenerate && (
        <button type="button" className="button-reset btn-icon" onClick={handleRegenerate} title="Regenerate">
          <RefreshCw size={14} style={{ color: 'var(--text-muted)' }} />
        </button>
      )}
      {track.url && (
        <button type="button" className="button-reset btn-icon" onClick={handleContinue} title="Continue / extend">
          <Music size={14} style={{ color: 'var(--text-muted)' }} />
        </button>
      )}
      <button type="button" className="button-reset btn-icon" onClick={handleDelete} title="Delete track">
        <Trash2 size={14} style={{ color: 'var(--text-muted)' }} />
      </button>
    </div>
  )
}
