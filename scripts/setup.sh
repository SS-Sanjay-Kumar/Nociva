#!/usr/bin/env bash
# One-time local setup: backend venv + deps, frontend deps, trained model
# and reference index (only if missing). Safe to re-run — every step is
# idempotent and skips work that's already done.
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
FRONTEND_DIR="$ROOT_DIR/frontend"

echo "==> Backend: virtualenv"
if [ ! -d "$ROOT_DIR/.venv" ]; then
  python3 -m venv "$ROOT_DIR/.venv"
else
  echo "    .venv already exists, skipping creation"
fi

# shellcheck disable=SC1091
source "$ROOT_DIR/.venv/bin/activate"

echo "==> Backend: pip install -r requirements.txt"
pip install -q --upgrade pip
pip install -q -r "$ROOT_DIR/requirements.txt"

MODEL_FILE="$ROOT_DIR/models/molecular/cyp2d6_random_forest.joblib"
METADATA_FILE="$ROOT_DIR/models/molecular/cyp2d6_model_metadata.json"
INDEX_FILE="$ROOT_DIR/models/molecular/reference_index.joblib"

cd "$ROOT_DIR"

if [ -f "$MODEL_FILE" ] && [ -f "$METADATA_FILE" ]; then
  echo "==> Backend: trained model already present, skipping train_cyp2d6_model.py"
else
  echo "==> Backend: training CYP2D6 classifier (downloads TDC CYP2D6_Veith on first run)"
  python ml/train_cyp2d6_model.py
fi

if [ -f "$INDEX_FILE" ]; then
  echo "==> Backend: reference index already present, skipping build_reference_index.py"
else
  echo "==> Backend: building Tanimoto reference index"
  python ml/build_reference_index.py
fi

deactivate

echo "==> Frontend: npm install"
(cd "$FRONTEND_DIR" && npm install)

if [ ! -f "$FRONTEND_DIR/.env.local" ]; then
  cp "$FRONTEND_DIR/.env.example" "$FRONTEND_DIR/.env.local"
  echo "==> Frontend: created .env.local from .env.example"
fi

echo
echo "Setup complete. Run ./scripts/dev.sh to start both servers."
