# Logic MusicGen

A music-making app inspired by Logic Pro X with AI generation features. Generate tracks by prompt, instrument, and genre; arrange them on a multi-track timeline with waveforms; mix with per-track and master controls.

## Features

- **AI generation**: Prompt-based music generation via Replicate (Meta MusicGen). Instrument and genre presets, duration 4–30s.
- **Multi-track timeline**: Waveform view per track, playhead, transport (play/stop/rewind/loop).
- **Track panel**: Per-track volume, mute, solo, name; regenerate or continue/extend from a track.
- **Mixer**: Channel strips with faders and master volume; collapsible.
- **Suggestions**: “Add drums”, “Add bass”, etc. based on current tracks.

## Setup

### Prerequisites

- Node.js 18+
- (Optional) [Replicate](https://replicate.com) API token for real AI generation. Without it, the server uses mock sine-wave audio.

### Install and run

1. **Clone and install**

   ```bash
   cd logic-pro-x-musicgen
   npm install
   cd server && npm install && cd ..
   ```

2. **Environment (optional)**

   Copy `.env.example` to `.env` and set your Replicate token for AI generation:

   ```bash
   cp .env.example .env
   # Edit .env: set REPLICATE_API_TOKEN=your_token
   ```

   Get a token at [replicate.com/account/api-tokens](https://replicate.com/account/api-tokens).

3. **Run**

   - Start the API server (port 4000):

     ```bash
     node server/index.js
     ```

   - In another terminal, start the frontend (Vite dev server with proxy to API):

     ```bash
     npm run dev
     ```

   Open the URL shown (e.g. `http://localhost:5173`).

### Build for production

```bash
npm run build
# Serve dist/ with any static host; ensure /api is proxied to the Node server.
```

## Keyboard shortcuts

- **Space** – Play / stop
- **R** – Rewind to start

## Tech stack

- Frontend: React 18, Vite, Zustand, Tone.js, WaveSurfer.js, Lucide React
- Backend: Express, Replicate (MusicGen), dotenv, wavefile

## License

MIT
