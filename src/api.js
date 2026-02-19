export async function generateTrack(params) {
  const res = await fetch('/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  })
  if (!res.ok) throw new Error((await res.json()).error || res.statusText)
  return res.json()
}

export async function getGenerationStatus(generationId) {
  const res = await fetch(`/api/generate/status/${encodeURIComponent(generationId)}`)
  if (!res.ok) throw new Error(res.statusText)
  return res.json()
}
