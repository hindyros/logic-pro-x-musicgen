"""
Local MusicGen API – text-to-music and continuation.
Uses Hugging Face transformers (no audiocraft/PyAV/ffmpeg). Apple MPS when available.
"""
import os
import uuid
import tempfile
from pathlib import Path

import numpy as np
import torch
import requests
import scipy.io.wavfile as wavfile
from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.responses import FileResponse, HTMLResponse
from pydantic import BaseModel

# Lazy model load
_model = None
_processor = None
_jobs: dict[str, dict] = {}
_output_dir = Path(tempfile.gettempdir()) / "musicgen_outputs"
_output_dir.mkdir(parents=True, exist_ok=True)

# ~1503 tokens = 30 sec
MAX_DURATION_SEC = 30
TOKENS_PER_SEC = 1503 / MAX_DURATION_SEC


def get_device() -> str:
    if torch.backends.mps.is_available() and torch.backends.mps.is_built():
        return "mps"
    if torch.cuda.is_available():
        return "cuda"
    return "cpu"


def load_model():
    global _model, _processor
    if _model is not None:
        return _model, _processor
    from transformers import AutoProcessor, MusicgenForConditionalGeneration

    model_name = os.environ.get("MUSICGEN_MODEL", "facebook/musicgen-small")
    device = get_device()
    print(f"Loading MusicGen (transformers): {model_name} on device: {device}")
    _processor = AutoProcessor.from_pretrained(model_name)
    _model = MusicgenForConditionalGeneration.from_pretrained(model_name)
    _model = _model.to(device)
    return _model, _processor


def load_audio_from_url(url: str) -> tuple[np.ndarray, int]:
    """Download WAV from URL, return (samples mono or stereo, sample_rate)."""
    r = requests.get(url, timeout=60)
    r.raise_for_status()
    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as f:
        f.write(r.content)
        path = f.name
    try:
        sr, data = wavfile.read(path)
        return data, int(sr)
    finally:
        try:
            os.unlink(path)
        except Exception:
            pass


def run_generation(job_id: str, prompt: str, duration: float, input_audio_url: str | None, continuation: bool):
    job = _jobs[job_id]
    try:
        job["status"] = "running"
        job["progress"] = 0.2
        model, processor = load_model()
        device = next(model.parameters()).device
        duration_sec = min(MAX_DURATION_SEC, max(4.0, duration))
        max_new_tokens = int(duration_sec * TOKENS_PER_SEC)

        if continuation and input_audio_url:
            audio_array, sampling_rate = load_audio_from_url(input_audio_url)
            if audio_array.dtype == np.int16:
                audio_array = audio_array.astype(np.float32) / 32768.0
            inputs = processor(
                audio=audio_array,
                sampling_rate=sampling_rate,
                text=[prompt or "continue the music"],
                padding=True,
                return_tensors="pt",
            )
            inputs = {k: v.to(device) if hasattr(v, "to") else v for k, v in inputs.items()}
        else:
            inputs = processor(
                text=[prompt or "ambient music"],
                padding=True,
                return_tensors="pt",
            )
            inputs = {k: v.to(device) if hasattr(v, "to") else v for k, v in inputs.items()}

        job["progress"] = 0.4
        audio_values = model.generate(
            **inputs,
            do_sample=True,
            guidance_scale=3.0,
            max_new_tokens=max_new_tokens,
        )

        job["progress"] = 0.9
        sampling_rate = model.config.audio_encoder.sampling_rate
        # audio_values: (batch, channels, samples) -> (samples,) or (samples, channels) for scipy
        wav = audio_values[0].cpu().numpy()
        if wav.ndim == 2:
            wav = np.moveaxis(wav, 0, -1)
        wav = (np.clip(wav, -1, 1) * 32767).astype(np.int16)
        out_path = _output_dir / f"{job_id}.wav"
        wavfile.write(str(out_path), sampling_rate, wav)
        job["status"] = "complete"
        job["progress"] = 1.0
        job["output_path"] = str(out_path)
    except Exception as e:
        job["status"] = "failed"
        job["error"] = str(e)
        job["progress"] = 0


app = FastAPI(title="Local MusicGen API", version="0.2.0")


@app.get("/", response_class=HTMLResponse)
def root():
    return """
    <!DOCTYPE html>
    <html><head><meta charset="utf-8"><title>Local MusicGen API</title></head>
    <body style="font-family:sans-serif; max-width:40em; margin:2em;">
      <h1>Local MusicGen API</h1>
      <p>Use <strong><a href="http://localhost:5001">http://localhost:5001</a></strong> (or <code>127.0.0.1:5001</code>) in your browser. <code>0.0.0.0</code> is the server bind address, not a URL.</p>
      <ul>
        <li><a href="/docs">/docs</a> – Swagger UI</li>
        <li><a href="/health">/health</a> – health check</li>
      </ul>
    </body></html>
    """


class GenerateRequest(BaseModel):
    prompt: str = "ambient music"
    duration: float = 8.0
    input_audio_url: str | None = None
    continuation: bool = False


@app.post("/generate")
def create_generation(req: GenerateRequest, background_tasks: BackgroundTasks):
    job_id = str(uuid.uuid4())
    _jobs[job_id] = {
        "status": "pending",
        "progress": 0,
        "output_path": None,
        "error": None,
    }
    background_tasks.add_task(
        run_generation,
        job_id,
        req.prompt,
        req.duration,
        req.input_audio_url,
        req.continuation,
    )
    return {"job_id": job_id}


@app.get("/status/{job_id}")
def get_status(job_id: str):
    if job_id not in _jobs:
        raise HTTPException(status_code=404, detail="Job not found")
    j = _jobs[job_id]
    out = {"status": j["status"], "progress": j.get("progress", 0)}
    if j.get("error"):
        out["error"] = j["error"]
    return out


@app.get("/audio/{job_id}")
def get_audio(job_id: str):
    if job_id not in _jobs:
        raise HTTPException(status_code=404, detail="Job not found")
    j = _jobs[job_id]
    if j["status"] != "complete" or not j.get("output_path"):
        raise HTTPException(status_code=404, detail="Audio not ready")
    path = Path(j["output_path"])
    if not path.exists():
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(path, media_type="audio/wav")


@app.get("/health")
def health():
    return {"ok": True, "device": get_device()}


if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 5001))
    print(f"\n  Open in Safari:  http://127.0.0.1:{port}\n")
    uvicorn.run(app, host="0.0.0.0", port=port)
