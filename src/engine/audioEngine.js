import * as Tone from 'tone'

const trackNodes = new Map()
let masterGain = null
let masterVolume = 1
let position = 0
let positionTimer = null
let onPositionChange = null
let startTime = null
let startPosition = 0

function getMasterGain() {
  if (!masterGain) {
    masterGain = new Tone.Volume(0).toDestination()
    masterGain.volume.value = 0
  }
  return masterGain
}

function connectTrack(trackId, player, channel) {
  player.connect(channel)
  channel.connect(getMasterGain())
  trackNodes.set(trackId, { player, channel })
}

export async function loadTrack(trackId, url, options = {}) {
  await Tone.start()
  const channel = new Tone.Channel(0, 0)
  channel.mute = options.mute ?? false
  channel.solo = options.solo ?? false
  channel.volume.value = Tone.gainToDb(options.volume ?? 1)

  const player = new Tone.Player({
    url,
    onload: options.onload,
    onstop: options.onstop,
  })

  const existing = trackNodes.get(trackId)
  if (existing) {
    existing.player.dispose()
    existing.channel.dispose()
  }

  await player.load(url)
  connectTrack(trackId, player, channel)
  return { player, channel }
}

export function unloadTrack(trackId) {
  const entry = trackNodes.get(trackId)
  if (entry) {
    entry.player.stop()
    entry.player.dispose()
    entry.channel.dispose()
    trackNodes.delete(trackId)
  }
}

export function setTrackVolume(trackId, volume) {
  const entry = trackNodes.get(trackId)
  if (entry) entry.channel.volume.value = Tone.gainToDb(volume)
}

export function setTrackMute(trackId, mute) {
  const entry = trackNodes.get(trackId)
  if (entry) entry.channel.mute = mute
}

export function setTrackSolo(trackId, solo) {
  const entry = trackNodes.get(trackId)
  if (entry) entry.channel.solo = solo
}

export function setMasterVolume(volume) {
  masterVolume = volume
  const g = getMasterGain()
  g.volume.value = Tone.gainToDb(volume)
}

export function getMasterVolume() {
  return masterVolume
}

export function getPosition() {
  if (startTime != null) {
    const elapsed = Tone.now() - startTime
    return Math.max(0, startPosition + elapsed)
  }
  return position
}

export function setPosition(seconds) {
  position = Math.max(0, seconds)
  if (startTime != null) {
    startPosition = position
    startTime = Tone.now()
    trackNodes.forEach(({ player }) => {
      if (player.loaded) {
        player.stop(startTime)
        player.start(startTime, position)
      }
    })
  }
}

export function setPositionCallback(callback) {
  onPositionChange = callback
}

function restartAllPlayers() {
  const pos = getPosition()
  const when = Tone.now()
  trackNodes.forEach(({ player }) => {
    if (player.loaded) {
      player.stop(when)
      player.start(when, pos)
    }
  })
}

export async function play() {
  await Tone.start()
  position = getPosition()
  startPosition = position
  startTime = Tone.now()
  trackNodes.forEach(({ player }) => {
    if (player.loaded) player.start(startTime, position)
  })
  if (!positionTimer && onPositionChange) {
    positionTimer = setInterval(() => {
      if (onPositionChange) onPositionChange(getPosition())
    }, 100)
  }
}

export function stop() {
  position = getPosition()
  startTime = null
  trackNodes.forEach(({ player }) => player.stop())
  if (positionTimer) {
    clearInterval(positionTimer)
    positionTimer = null
  }
  if (onPositionChange) onPositionChange(position)
}

export function rewind() {
  setPosition(0)
}

export function isPlaying() {
  return startTime != null
}

export function getTrackPlayer(trackId) {
  return trackNodes.get(trackId)?.player
}

export function getTrackDuration(trackId) {
  const p = trackNodes.get(trackId)?.player
  if (!p || !p.buffer) return 0
  return p.buffer.duration
}

export function getLongestDuration() {
  let max = 0
  trackNodes.forEach(({ player }) => {
    if (player.loaded && player.buffer) max = Math.max(max, player.buffer.duration)
  })
  return max
}
