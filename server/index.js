const express = require('express')
const fs = require('fs')
const path = require('path')
const cors = require('cors')
const { Writable } = require('stream')
const { WaveFile } = require('wavefile')

const app = express()
app.use(cors())
app.use(express.json())

const DATA_DIR = path.join(__dirname,'data')
if(!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR)

function generateSineWav(filePath, seconds=4, freq=440, sampleRate=22050){
  const samples = []
  const total = Math.floor(seconds*sampleRate)
  for(let i=0;i<total;i++){
    const t = i/sampleRate
    const v = Math.sin(2*Math.PI*freq*t) * 0.2
    samples.push(Math.round(v*32767))
  }
  let wav = new WaveFile()
  wav.fromScratch(1, sampleRate, '16', samples)
  fs.writeFileSync(filePath, wav.toBuffer())
}

app.post('/api/generate', (req,res)=>{
  // simple mock: create a wav file with freq based on instrument
  const id = 'track-'+Date.now()
  const { instrument='sine', length=4 } = req.body || {}
  let freq = 440
  if(instrument.includes('bass')) freq = 110
  if(instrument.includes('piano')) freq = 330
  if(instrument.includes('drum')) freq = 60
  const filePath = path.join(DATA_DIR, id+'.wav')
  generateSineWav(filePath, length, freq)
  res.json({id, url:`/api/track/${id}`})
})

app.get('/api/track/:id', (req,res)=>{
  const id = req.params.id
  const filePath = path.join(DATA_DIR, id+'.wav')
  if(!fs.existsSync(filePath)) return res.status(404).send('not found')
  res.setHeader('Content-Type','audio/wav')
  fs.createReadStream(filePath).pipe(res)
})

app.listen(4000, ()=>console.log('server listening 4000'))
