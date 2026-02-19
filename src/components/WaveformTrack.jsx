import React, { useRef, useEffect } from 'react'
import { useWavesurfer } from '@wavesurfer/react'

const WAVE_COLOR = 'rgba(99, 102, 241, 0.5)'
const PROGRESS_COLOR = 'rgba(99, 102, 241, 0.8)'
const HEIGHT = 48

export default function WaveformTrack({ track }) {
  const containerRef = useRef(null)
  useWavesurfer({
    container: containerRef,
    url: track.url || undefined,
    waveColor: WAVE_COLOR,
    progressColor: PROGRESS_COLOR,
    height: HEIGHT,
    barWidth: 1,
    barGap: 1,
    barRadius: 0,
    cursorWidth: 0,
    interact: false,
  })

  if (!track.url) {
    return (
      <div style={{ height: HEIGHT, background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: 'var(--text-xs)' }}>
        No audio
      </div>
    )
  }

  return (
    <div style={{ height: HEIGHT, minWidth: '100%' }} ref={containerRef} />
  )
}
