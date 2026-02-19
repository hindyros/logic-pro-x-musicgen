import React from 'react'
import { Loader2, Plus, AlertCircle, RefreshCw } from 'lucide-react'
import { useProjectStore } from '../stores/useProjectStore'

export default function GenerationCard({ gen, onRetry }) {
  const addTrack = useProjectStore((s) => s.addTrack)

  const loading = gen.status === 'starting' || gen.status === 'processing'
  const failed = gen.status === 'failed'
  const complete = gen.status === 'complete' && gen.trackId

  const handleAddToTrack = () => {
    if (!gen.trackId) return
    const name = 'Track ' + (useProjectStore.getState().tracks.length + 1)
    const instrument = gen.instrument || 'piano'
    addTrack({
      id: gen.trackId,
      name,
      instrument,
      url: `/api/track/${gen.trackId}`,
      generationParams: gen.prompt ? { prompt: gen.prompt, instrument, genre: gen.genre, duration: gen.duration } : undefined,
    })
  }

  return (
    <div
      style={{
        padding: 'var(--space-md)',
        background: 'var(--bg-elevated)',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border-subtle)',
        marginBottom: 'var(--space-sm)',
      }}
    >
      {gen.prompt && (
        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginBottom: 'var(--space-xs)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {gen.prompt}
        </p>
      )}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-sm)' }}>
        {loading && (
          <>
            <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>Generating…</span>
            <Loader2 size={16} className="spin" style={{ color: 'var(--accent)', flexShrink: 0 }} />
          </>
        )}
        {failed && (
          <>
            <span style={{ fontSize: 'var(--text-sm)', color: 'var(--accent-error)' }}>{gen.error || 'Failed'}</span>
            <div style={{ display: 'flex', gap: 'var(--space-xs)' }}>
              {onRetry && (
                <button type="button" className="button-reset btn-icon" onClick={() => onRetry(gen)} title="Retry">
                  <RefreshCw size={14} />
                </button>
              )}
              <AlertCircle size={16} style={{ color: 'var(--accent-error)', flexShrink: 0 }} />
            </div>
          </>
        )}
        {complete && (
          <>
            <span style={{ fontSize: 'var(--text-sm)', color: 'var(--accent-success)' }}>Ready</span>
            <button type="button" className="button-reset btn-icon" onClick={handleAddToTrack} title="Add to project">
              <Plus size={16} />
            </button>
          </>
        )}
      </div>
      {loading && gen.progress != null && gen.progress > 0 && (
        <div style={{ marginTop: 'var(--space-xs)', height: 4, background: 'var(--bg-active)', borderRadius: 2, overflow: 'hidden' }}>
          <div style={{ width: `${gen.progress * 100}%`, height: '100%', background: 'var(--accent)', transition: 'width 0.2s' }} />
        </div>
      )}
    </div>
  )
}
