require('dotenv').config()
const express = require('express')
const fs = require('fs')
const path = require('path')
const cors = require('cors')
const { WaveFile } = require('wavefile')
const replicateService = require('./services/replicate')

const app = express()
app.use(cors())
app.use(express.json())

const DATA_DIR = path.join(__dirname, 'data')
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true })

function generateSineWav(filePath, seconds = 4, freq = 440, sampleRate = 22050) {
  const samples = []
  const total = Math.floor(seconds * sampleRate)
  for (let i = 0; i < total; i++) {
    const t = i / sampleRate
    const v = Math.sin(2 * Math.PI * freq * t) * 0.2
    samples.push(Math.round(v * 32767))
  }
  const wav = new WaveFile()
  wav.fromScratch(1, sampleRate, '16', samples)
  fs.writeFileSync(filePath, wav.toBuffer())
}

const instrumentFreq = {
  piano: 330,
  drums: 60,
  bass: 110,
  guitar: 440,
  synth: 440,
  strings: 440,
  brass: 350,
  vocals: 440,
}

// POST /api/generate — start AI generation (or mock). Returns { generationId } or { generationId, trackId, status: 'complete' } for mock.
app.post('/api/generate', async (req, res) => {
  try {
    const body = req.body || {}
    const prompt = body.prompt || 'ambient music'
    const instrument = body.instrument || 'piano'
    const genre = body.genre || ''
    const duration = Math.min(30, Math.max(4, Number(body.duration) || 8))
    const fullPrompt = [genre, prompt].filter(Boolean).join(' ') || prompt
    const inputTrackId = body.inputTrackId
    const continuation = !!body.continuation
    const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 4000}`
    const inputAudioUrl = inputTrackId ? `${baseUrl}/api/track/${inputTrackId}` : undefined

    const hasReplicate = !!replicateService.getClient()
    if (!hasReplicate) {
      const trackId = 'track-' + Date.now()
      const filePath = path.join(DATA_DIR, trackId + '.wav')
      const freq = instrumentFreq[instrument] || 440
      generateSineWav(filePath, duration, freq)
      return res.json({
        generationId: 'mock-' + trackId,
        trackId,
        status: 'complete',
      })
    }

    const result = await replicateService.createMusicGenPrediction({
      prompt: fullPrompt,
      duration,
      input_audio: inputAudioUrl,
      continuation,
    })
    if (result.mock) {
      const trackId = 'track-' + Date.now()
      const filePath = path.join(DATA_DIR, trackId + '.wav')
      generateSineWav(filePath, duration, instrumentFreq[instrument] || 440)
      return res.json({
        generationId: 'mock-' + trackId,
        trackId,
        status: 'complete',
      })
    }
    res.json({ generationId: result.predictionId })
  } catch (err) {
    console.error('POST /api/generate', err)
    res.status(500).json({ error: err.message || 'Generation failed' })
  }
})

// GET /api/generate/status/:id — poll generation status. Returns { status, progress?, trackId?, error? }.
app.get('/api/generate/status/:id', async (req, res) => {
  try {
    const id = req.params.id
    if (id.startsWith('mock-')) {
      const trackId = id.replace(/^mock-/, '')
      const filePath = path.join(DATA_DIR, trackId + '.wav')
      if (fs.existsSync(filePath)) {
        return res.json({ status: 'complete', trackId })
      }
      return res.json({ status: 'failed', error: 'Mock track not found' })
    }

    const statusResult = await replicateService.getPredictionStatus(id)
    if (statusResult.status !== 'succeeded') {
      return res.json({
        status: statusResult.status,
        progress: statusResult.progress,
        error: statusResult.error,
      })
    }

    const outputUrl = statusResult.output
    if (!outputUrl) {
      return res.json({ status: 'failed', error: 'No output URL' })
    }
    const trackId = 'track-' + id
    const filePath = path.join(DATA_DIR, trackId + '.wav')
    await replicateService.downloadAudioToFile(outputUrl, filePath)
    res.json({ status: 'complete', trackId })
  } catch (err) {
    console.error('GET /api/generate/status/:id', err)
    res.status(500).json({ status: 'failed', error: err.message || 'Status check failed' })
  }
})

app.get('/api/track/:id', (req, res) => {
  const id = req.params.id
  const filePath = path.join(DATA_DIR, id + '.wav')
  if (!fs.existsSync(filePath)) return res.status(404).send('Not found')
  res.setHeader('Content-Type', 'audio/wav')
  fs.createReadStream(filePath).pipe(res)
})

const PORT = process.env.PORT || 4000
app.listen(PORT, () => console.log('Server listening on', PORT))
