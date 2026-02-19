import React from 'react'
import { Plus } from 'lucide-react'
import { useProjectStore } from '../stores/useProjectStore'
import TrackItem from './TrackItem'

export default function TrackPanel() {
  const tracks = useProjectStore((s) => s.tracks)
  const addTrack = useProjectStore((s) => s.addTrack)

  const handleAddPlaceholder = () => {
    addTrack({
      id: 'track-' + Date.now(),
      name: 'Track ' + (tracks.length + 1),
      instrument: 'piano',
      url: '',
    })
  }

  return (
    <aside className="track-panel">
      <div className="track-panel-header" style={{ padding: 'var(--space-md)', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <strong>Tracks</strong>
        <button type="button" className="button-reset btn-icon" onClick={handleAddPlaceholder} title="Add track (use AI panel to generate)">
          <Plus size={18} />
        </button>
      </div>
      <div style={{ flex: 1, overflow: 'auto' }}>
        {tracks.map((track) => (
          <TrackItem key={track.id} track={track} />
        ))}
        {tracks.length === 0 && (
          <p style={{ padding: 'var(--space-lg)', color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>
            Generate a track with AI or add an empty track.
          </p>
        )}
      </div>
    </aside>
  )
}
