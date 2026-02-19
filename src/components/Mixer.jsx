import React from 'react'
import { useProjectStore } from '../stores/useProjectStore'
import ChannelStrip from './ChannelStrip'

export default function Mixer() {
  const tracks = useProjectStore((s) => s.tracks)

  return (
    <div style={{ display: 'flex', alignItems: 'stretch', padding: 'var(--space-md)', gap: 'var(--space-sm)', minHeight: '100%' }}>
      {tracks.map((track) => (
        <ChannelStrip key={track.id} track={track} />
      ))}
      <ChannelStrip isMaster />
    </div>
  )
}
