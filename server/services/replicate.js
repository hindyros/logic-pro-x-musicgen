const Replicate = require('replicate')
const fs = require('fs')
const path = require('path')
const https = require('https')
const http = require('http')

const MUSICGEN_VERSION = 'meta/musicgen:671ac645ce5e552cc63a54a2bbff63fcf798043055d2dac5fc9e36a837eedcfb'

function getClient() {
  const token = process.env.REPLICATE_API_TOKEN
  if (!token || !token.trim()) return null
  return new Replicate({ auth: token })
}

/**
 * Start a MusicGen prediction. Returns prediction id for polling.
 * @param {object} opts - { prompt, duration, model_version?, input_audio?, continuation? }
 */
async function createMusicGenPrediction(opts) {
  const replicate = getClient()
  if (!replicate) return { mock: true }

  const input = {
    prompt: opts.prompt || 'ambient music',
    duration: Math.min(30, Math.max(4, Number(opts.duration) || 8)),
    output_format: 'wav',
    normalization_strategy: 'loudness',
  }
  if (opts.model_version) input.model_version = opts.model_version
  if (opts.input_audio) input.input_audio = opts.input_audio
  if (opts.continuation != null) input.continuation = !!opts.continuation

  const prediction = await replicate.predictions.create({
    version: MUSICGEN_VERSION,
    input,
  })
  return { predictionId: prediction.id, mock: false }
}

/**
 * Get prediction status. Returns { status, progress?, output?, error? }.
 * output is the URL string when status === 'succeeded'.
 */
async function getPredictionStatus(predictionId) {
  const replicate = getClient()
  if (!replicate) return { status: 'failed', error: 'No Replicate API token' }

  const prediction = await replicate.predictions.get(predictionId)
  const result = {
    status: prediction.status,
    progress: prediction.logs ? null : (prediction.status === 'processing' ? 0.5 : prediction.status === 'succeeded' ? 1 : 0),
  }
  if (prediction.status === 'succeeded' && prediction.output) {
    result.output = typeof prediction.output === 'string' ? prediction.output : prediction.output.url || prediction.output
  }
  if (prediction.status === 'failed' && prediction.error) {
    result.error = prediction.error
  }
  return result
}

/**
 * Download audio from URL to a local file. Returns the file path.
 */
function downloadAudioToFile(url, filePath) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http
    const file = fs.createWriteStream(filePath)
    protocol
      .get(url, { headers: { 'User-Agent': 'LogicMusicGen/1.0' } }, (res) => {
        if (res.statusCode === 302 || res.statusCode === 301) {
          const redirect = res.headers.location
          if (redirect) {
            file.close()
            fs.unlink(filePath, () => {})
            return downloadAudioToFile(redirect, filePath).then(resolve).catch(reject)
          }
        }
        if (res.statusCode !== 200) {
          file.close()
          fs.unlink(filePath, () => {})
          return reject(new Error(`Download failed: ${res.statusCode}`))
        }
        res.pipe(file)
        file.on('finish', () => {
          file.close()
          resolve(filePath)
        })
      })
      .on('error', (err) => {
        file.close()
        fs.unlink(filePath, () => {})
        reject(err)
      })
  })
}

module.exports = {
  getClient,
  createMusicGenPrediction,
  getPredictionStatus,
  downloadAudioToFile,
}
