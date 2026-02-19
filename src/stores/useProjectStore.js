import { create } from 'zustand'

const INSTRUMENTS = ['piano', 'drums', 'bass', 'guitar', 'synth', 'strings', 'brass', 'vocals']
const GENRES = ['Jazz', 'Electronic', 'Rock', 'Classical', 'Ambient', 'Hip-Hop', 'Lo-fi', 'Cinematic']

export function getInstruments() {
  return INSTRUMENTS
}

export function getGenres() {
  return GENRES
}

export const useProjectStore = create((set, get) => ({
  // Tracks: { id, name, instrument, url, mute, solo, volume, generationParams? }
  tracks: [],

  addTrack: (track) =>
    set((state) => ({
      tracks: [...state.tracks, { mute: false, solo: false, volume: 1, ...track }],
    })),

  removeTrack: (id) =>
    set((state) => ({
      tracks: state.tracks.filter((t) => t.id !== id),
    })),

  updateTrack: (id, updates) =>
    set((state) => ({
      tracks: state.tracks.map((t) => (t.id === id ? { ...t, ...updates } : t)),
    })),

  setTracks: (tracks) => set({ tracks }),

  // Transport
  playing: false,
  position: 0,
  bpm: 120,
  loop: false,
  duration: 0,

  setPlaying: (playing) => set({ playing }),
  setPosition: (position) => set({ position }),
  setBpm: (bpm) => set({ bpm: Math.max(20, Math.min(300, bpm)) }),
  setLoop: (loop) => set({ loop }),
  setDuration: (duration) => set({ duration }),

  // AI panel
  prompt: '',
  instrument: 'piano',
  genre: '',
  durationSeconds: 8,
  generations: [], // { id, status, progress?, trackId?, error?, prompt?, createdAt }
  generationLoading: false,
  generationError: null,

  setPrompt: (prompt) => set({ prompt }),
  setInstrument: (instrument) => set({ instrument: INSTRUMENTS.includes(instrument) ? instrument : 'piano' }),
  setGenre: (genre) => set({ genre }),
  setDurationSeconds: (durationSeconds) => set({ durationSeconds: Math.max(4, Math.min(30, durationSeconds)) }),

  addGeneration: (gen) =>
    set((state) => ({
      generations: [{ ...gen, createdAt: Date.now() }, ...state.generations].slice(0, 20),
    })),

  updateGeneration: (id, updates) =>
    set((state) => ({
      generations: state.generations.map((g) => (g.id === id ? { ...g, ...updates } : g)),
    })),

  setGenerationLoading: (loading) => set({ generationLoading: loading }),
  setGenerationError: (error) => set({ generationError: error }),

  // Mixer
  masterVolume: 1,
  mixerVisible: true,

  setMasterVolume: (masterVolume) => set({ masterVolume: Math.max(0, Math.min(1, masterVolume)) }),
  setMixerVisible: (mixerVisible) => set({ mixerVisible }),
  toggleMixer: () => set((state) => ({ mixerVisible: !state.mixerVisible })),
}))
