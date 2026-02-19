# Local MusicGen API

Runs Meta’s [MusicGen](https://huggingface.co/docs/transformers/main/en/model_doc/musicgen) on your machine for **free**—no Replicate account, no API key, **no PyAV/ffmpeg**. Uses **Hugging Face transformers** (not audiocraft). On Mac with Apple Silicon, inference uses **MPS** when available.

## Quick start

**Python 3.10+** (3.11, 3.12, 3.13 all work). No system deps (no brew install).

```bash
cd local-musicgen
python3 -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
./setup_venv.sh
python main.py
```

API runs at **http://localhost:5001**. Set `LOCAL_MUSICGEN_URL=http://localhost:5001` in the main app’s `.env` and restart the Node server.

## Endpoints

- `POST /generate` – body: `{ "prompt": "jazz piano", "duration": 8, "input_audio_url": null, "continuation": false }` → `{ "job_id": "uuid" }`
- `GET /status/{job_id}` – `{ "status": "pending"|"running"|"complete"|"failed", "progress": 0..1, "error"?: "..." }`
- `GET /audio/{job_id}` – returns WAV when `status === "complete"`
- `GET /health` – `{ "ok": true, "device": "mps"|"cuda"|"cpu" }`

## Options

| Env var           | Default                    | Description |
|-------------------|----------------------------|-------------|
| `MUSICGEN_MODEL`  | `facebook/musicgen-small`  | Model: `musicgen-small`, `musicgen-medium`, `musicgen-large` |
| `PORT`            | `5001`                     | Server port (5000 is often used by macOS AirPlay) |

- **musicgen-small**: ~300M params, fastest.
- **musicgen-medium** / **musicgen-large**: higher quality, slower.

## Continuation

For “Continue” from an existing track, the Node app sends `input_audio_url` and `continuation: true`. This API fetches that audio and uses MusicGen’s audio-prompted generation.
