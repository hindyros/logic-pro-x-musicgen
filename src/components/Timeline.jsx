import React, { useEffect } from 'react'
import { useProjectStore } from '../stores/useProjectStore'
import * as audioEngine from '../engine/audioEngine'
import WaveformTrack from './WaveformTrack'
import Playhead, { timelinePixelsPerSecond, timelineRulerHeight } from './Playhead'

function TimeRuler({ duration, width }) {
  const seconds = Math.ceil(duration) || 30
  const marks = []
  for (let i = 0; i <= seconds; i += 5) {
    marks.push(
      <div
        key={i}
        style={{
          position: 'absolute',
          left: i * timelinePixelsPerSecond,
          top: 0,
          bottom: 0,
          width: 1,
          background: 'var(--border-subtle)',
          fontSize: 'var(--text-xs)',
          color: 'var(--text-muted)',
          paddingTop: 2,
        }}
      >
        {i}s
      </div>
    )
  }
  return (
    <div style={{ position: 'relative', height: timelineRulerHeight, minWidth: width, background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border-subtle)' }}>
      {marks}
    </div>
  )
}

export default function Timeline() {
  const tracks = useProjectStore((s) => s.tracks)
  const setDuration = useProjectStore((s) => s.setDuration)

  useEffect(() => {
    const d = audioEngine.getLongestDuration()
    if (d > 0) setDuration(d)
  }, [tracks, setDuration])

  const duration = useProjectStore((s) => s.duration) || 30
  const totalWidth = Math.max(duration * timelinePixelsPerSecond, 800)

  return (
    <section className="timeline-area">
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, overflow: 'auto' }}>
        <TimeRuler duration={duration} width={totalWidth} />
        <div style={{ position: 'relative', flex: 1, overflow: 'auto' }}>
          <div style={{ minWidth: totalWidth }}>
            {tracks.map((track) => (
              <div key={track.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                <WaveformTrack track={track} />
              </div>
            ))}
            {tracks.length === 0 && (
              <div style={{ height: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>
                No tracks — generate with AI
              </div>
            )}
          </div>
          <div style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0, pointerEvents: 'none' }}>
            <div style={{ position: 'absolute', left: 0, top: timelineRulerHeight, right: 0, bottom: 0, pointerEvents: 'auto' }}>
              <Playhead totalWidth={totalWidth} />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
