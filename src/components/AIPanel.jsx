import React from 'react'
import { Sparkles } from 'lucide-react'
import { useProjectStore, getInstruments, getGenres } from '../stores/useProjectStore'
import GenerationCard from './GenerationCard'

export default function AIPanel() {
  const prompt = useProjectStore((s) => s.prompt)
  const setPrompt = useProjectStore((s) => s.setPrompt)
  const instrument = useProjectStore((s) => s.instrument)
  const setInstrument = useProjectStore((s) => s.setInstrument)
  const genre = useProjectStore((s) => s.genre)
  const setGenre = useProjectStore((s) => s.setGenre)
  const durationSeconds = useProjectStore((s) => s.durationSeconds)
  const setDurationSeconds = useProjectStore((s) => s.setDurationSeconds)
  const generations = useProjectStore((s) => s.generations)
  const generationLoading = useProjectStore((s) => s.generationLoading)
  const setGenerationLoading = useProjectStore((s) => s.setGenerationLoading)
  const addGeneration = useProjectStore((s) => s.addGeneration)
  const updateGeneration = useProjectStore((s) => s.updateGeneration)
  const setGenerationError = useProjectStore((s) => s.setGenerationError)
  const generationError = useProjectStore((s) => s.generationError)

  const instruments = getInstruments()
  const genres = getGenres()
  const tracks = useProjectStore((s) => s.tracks)
  const usedInstruments = [...new Set(tracks.map((t) => t.instrument))]
  const suggestions = instruments.filter((i) => !usedInstruments.includes(i)).slice(0, 4)
  const suggestionPrompts = {
    drums: 'tight drum beat, punchy kick and snare',
    bass: 'warm bass line, groovy',
    guitar: 'clean electric guitar, melodic',
    piano: 'smooth piano chords',
    synth: 'atmospheric synth pad',
    strings: 'cinematic strings',
    brass: 'bold brass section',
    vocals: 'soft vocal texture',
  }

  const handleGenerate = async (override) => {
    if (generationLoading) return
    setGenerationError(null)
    setGenerationLoading(true)
    const p = override ? { prompt: override.prompt ?? 'ambient music', instrument: override.instrument ?? 'piano', genre: override.genre ?? '', duration: override.duration ?? 8 } : null
    const params = p || { prompt: prompt || 'ambient music', instrument, genre: genre || undefined, duration: durationSeconds }
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || res.statusText)

      if (data.status === 'complete' && data.trackId) {
        addGeneration({ id: data.generationId, status: 'complete', trackId: data.trackId, ...params })
        setGenerationLoading(false)
        return
      }

      addGeneration({ id: data.generationId, status: 'starting', progress: 0, ...params })
      let pollId = data.generationId
      const poll = async () => {
        try {
          const statusRes = await fetch(`/api/generate/status/${encodeURIComponent(pollId)}`)
          const statusData = await statusRes.json()
          updateGeneration(data.generationId, { status: statusData.status, progress: statusData.progress ?? 0.5, trackId: statusData.trackId, error: statusData.error })
          if (statusData.status === 'complete' && statusData.trackId) {
            setGenerationLoading(false)
            return
          }
          if (statusData.status === 'failed') {
            setGenerationLoading(false)
            return
          }
          setTimeout(poll, 1500)
        } catch (err) {
          updateGeneration(data.generationId, { status: 'failed', error: err.message })
          setGenerationLoading(false)
        }
      }
      setTimeout(poll, 1000)
    } catch (err) {
      setGenerationError(err.message)
      setGenerationLoading(false)
    }
  }

  return (
    <aside className="ai-panel">
      <div style={{ padding: 'var(--space-md)', borderBottom: '1px solid var(--border-subtle)' }}>
        <strong>AI Generate</strong>
      </div>
      <div style={{ flex: 1, overflow: 'auto', padding: 'var(--space-md)' }}>
        {suggestions.length > 0 && (
          <div style={{ marginBottom: 'var(--space-md)' }}>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>Suggest: add </span>
            {suggestions.map((inst) => (
              <button
                key={inst}
                type="button"
                className="button-reset"
                onClick={() => {
                  setInstrument(inst)
                  setPrompt(suggestionPrompts[inst] || `${inst} part`)
                }}
                style={{
                  marginRight: 'var(--space-xs)',
                  marginTop: 2,
                  padding: '2px 8px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: 'var(--text-xs)',
                  background: 'var(--accent-muted)',
                  color: 'var(--accent)',
                  border: '1px solid var(--border-default)',
                }}
              >
                {inst}
              </button>
            ))}
          </div>
        )}
        <label style={{ display: 'block', marginBottom: 'var(--space-sm)', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
          Prompt
        </label>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="e.g. smooth jazz piano with walking bass"
          rows={3}
          style={{
            width: '100%',
            padding: 'var(--space-sm)',
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--text-primary)',
            fontSize: 'var(--text-sm)',
            resize: 'vertical',
            marginBottom: 'var(--space-md)',
          }}
        />
        <label style={{ display: 'block', marginBottom: 'var(--space-xs)', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
          Instrument
        </label>
        <select
          value={instrument}
          onChange={(e) => setInstrument(e.target.value)}
          style={{
            width: '100%',
            padding: 'var(--space-sm)',
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--text-primary)',
            fontSize: 'var(--text-sm)',
            marginBottom: 'var(--space-md)',
          }}
        >
          {instruments.map((inst) => (
            <option key={inst} value={inst}>
              {inst.charAt(0).toUpperCase() + inst.slice(1)}
            </option>
          ))}
        </select>
        <label style={{ display: 'block', marginBottom: 'var(--space-xs)', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
          Genre / mood
        </label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-xs)', marginBottom: 'var(--space-md)' }}>
          {genres.map((g) => (
            <button
              key={g}
              type="button"
              className="button-reset"
              onClick={() => setGenre(genre === g ? '' : g)}
              style={{
                padding: 'var(--space-xs) var(--space-sm)',
                borderRadius: 'var(--radius-sm)',
                fontSize: 'var(--text-xs)',
                background: genre === g ? 'var(--accent-muted)' : 'var(--bg-elevated)',
                color: genre === g ? 'var(--accent)' : 'var(--text-secondary)',
                border: '1px solid var(--border-default)',
              }}
            >
              {g}
            </button>
          ))}
        </div>
        <label style={{ display: 'block', marginBottom: 'var(--space-xs)', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
          Duration: {durationSeconds}s
        </label>
        <input
          type="range"
          min={4}
          max={30}
          value={durationSeconds}
          onChange={(e) => setDurationSeconds(parseInt(e.target.value, 10))}
          style={{ width: '100%', marginBottom: 'var(--space-lg)', accentColor: 'var(--accent)' }}
        />
        {generationError && (
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--accent-error)', marginBottom: 'var(--space-md)' }}>
            {generationError}
          </p>
        )}
        <button
          type="button"
          onClick={handleGenerate}
          disabled={generationLoading}
          style={{
            width: '100%',
            padding: 'var(--space-md)',
            background: generationLoading ? 'var(--bg-active)' : 'var(--accent)',
            color: '#fff',
            border: 'none',
            borderRadius: 'var(--radius-md)',
            fontSize: 'var(--text-base)',
            fontWeight: 600,
            cursor: generationLoading ? 'wait' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 'var(--space-sm)',
          }}
        >
          {generationLoading ? (
            <>
              <Sparkles size={18} /> Generating…
            </>
          ) : (
            <>
              <Sparkles size={18} /> Generate
            </>
          )}
        </button>

        <div style={{ marginTop: 'var(--space-xl)' }}>
          <strong style={{ fontSize: 'var(--text-sm)' }}>Recent</strong>
          <div style={{ marginTop: 'var(--space-sm)' }}>
            {generations.length === 0 && <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>No generations yet.</p>}
            {generations.map((gen) => (
              <GenerationCard
                key={gen.id}
                gen={gen}
                onRetry={gen.status === 'failed' ? () => handleGenerate({ prompt: gen.prompt, instrument: gen.instrument, genre: gen.genre, duration: gen.duration }) : undefined}
              />
            ))}
          </div>
        </div>
      </div>
    </aside>
  )
}
