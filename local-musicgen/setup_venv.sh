#!/usr/bin/env bash
# Install deps for local MusicGen API (Hugging Face transformers – no PyAV/ffmpeg).
# Run from local-musicgen with venv activated: source venv/bin/activate && ./setup_venv.sh
set -e
cd "$(dirname "$0")"

if [[ -z "$VIRTUAL_ENV" ]]; then
  echo "Create and activate the venv first:"
  echo "  python3 -m venv venv"
  echo "  source venv/bin/activate   # Windows: venv\\Scripts\\activate"
  exit 1
fi

echo "Installing dependencies (no PyAV/ffmpeg required)..."
pip install -r requirements.txt

echo "Done. Run: python main.py"
