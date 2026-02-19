import React from 'react'
import { Play, Square, SkipBack, Repeat } from 'lucide-react'
import { useProjectStore } from '../stores/useProjectStore'
import * as audioEngine from '../engine/audioEngine'

export default function TransportControls() {
  const playing = useProjectStore((s) => s.playing)
  const loop = useProjectStore((s) => s.loop)
  const setPlaying = useProjectStore((s) => s.setPlaying)
  const setPosition = useProjectStore((s) => s.setPosition)
  const setLoop = useProjectStore((s) => s.setLoop)

  const handlePlay = async () => {
    if (playing) {
      audioEngine.stop()
      setPlaying(false)
      setPosition(audioEngine.getPosition())
    } else {
      await audioEngine.play()
      setPlaying(true)
    }
  }

  const handleStop = () => {
    audioEngine.stop()
    setPlaying(false)
    setPosition(audioEngine.getPosition())
  }

  const handleRewind = () => {
    audioEngine.rewind()
    setPosition(0)
  }

  const handleLoop = () => {
    setLoop(!loop)
  }

  return (
    <div className="transport-controls" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xs)' }}>
      <button type="button" className="button-reset btn-icon" onClick={handleRewind} title="Rewind">
        <SkipBack size={18} />
      </button>
      <button type="button" className="button-reset btn-icon" onClick={handleStop} title="Stop">
        <Square size={18} />
      </button>
      <button
        type="button"
        className={`button-reset btn-icon ${playing ? 'active' : ''}`}
        onClick={handlePlay}
        title={playing ? 'Pause' : 'Play'}
      >
        <Play size={18} style={playing ? { marginLeft: 2 } : {}} />
      </button>
      <button
        type="button"
        className={`button-reset btn-icon ${loop ? 'active' : ''}`}
        onClick={handleLoop}
        title="Loop"
      >
        <Repeat size={16} />
      </button>
    </div>
  )
}
