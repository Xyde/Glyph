#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

RUN_ID="${1:-38691748164}"

echo "=== 1. Downloading artifact from run $RUN_ID ==="
rm -rf "$ROOT_DIR/dist"
mkdir -p "$ROOT_DIR/dist"
gh run download "$RUN_ID" -R Xyde/Glyph -n Glyph-Community-macOS -D "$ROOT_DIR/dist"

echo "=== 2. Unzipping binary ==="
unzip -q "$ROOT_DIR/dist/Glyph-Community-macOS-arm64.zip" -d "$ROOT_DIR/dist"

echo "=== 3. Executing local deployment ==="
"$ROOT_DIR/scripts/deploy_local_app.sh"
