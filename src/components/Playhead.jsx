import React from 'react'
import { useProjectStore } from '../stores/useProjectStore'
import * as audioEngine from '../engine/audioEngine'

const PIXELS_PER_SECOND = 60
const RULER_HEIGHT = 24

export default function Playhead({ totalWidth }) {
  const position = useProjectStore((s) => s.position)
  const duration = useProjectStore((s) => s.duration) || 30
  const setPosition = useProjectStore((s) => s.setPosition)

  const left = Math.min(position * PIXELS_PER_SECOND, totalWidth - 1)

  const handleClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const seconds = x / PIXELS_PER_SECOND
    setPosition(Math.max(0, seconds))
    audioEngine.setPosition(seconds)
  }

  return (
    <div
      role="presentation"
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        right: 0,
        bottom: 0,
        cursor: 'pointer',
      }}
      onClick={handleClick}
    >
      <div
        style={{
          position: 'absolute',
          left: left,
          top: 0,
          bottom: 0,
          width: 2,
          background: 'var(--accent)',
          pointerEvents: 'none',
          transition: 'left 0.05s linear',
        }}
      />
    </div>
  )
}

export const timelinePixelsPerSecond = PIXELS_PER_SECOND
export const timelineRulerHeight = RULER_HEIGHT
