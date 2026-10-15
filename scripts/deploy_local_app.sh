#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

SOURCE_APP="$ROOT_DIR/dist/Glyph.app"
TARGET_APP="/Applications/Glyph.app"

if [ ! -d "$SOURCE_APP" ]; then
    echo "Error: Source app $SOURCE_APP does not exist." >&2
    exit 1
fi

echo "=== 1. Stripping quarantine and signing ad-hoc ==="
xattr -cr "$SOURCE_APP"
codesign -s - --force --deep "$SOURCE_APP"

echo "=== 2. Gracefully quitting running Glyph instance ==="
osascript -e 'quit app "Glyph"' 2>/dev/null || true
sleep 1

if pgrep -lf "/Applications/Glyph.app/Contents/MacOS/glyph" >/dev/null; then
    echo "Process still active, terminating..."
    pkill -f "/Applications/Glyph.app/Contents/MacOS/glyph" 2>/dev/null || true
    sleep 1
fi

echo "=== 3. Deploying to $TARGET_APP ==="
rm -rf "$TARGET_APP"
cp -R "$SOURCE_APP" "$TARGET_APP"

echo "=== 4. Launching updated Glyph.app ==="
open -a "$TARGET_APP"

echo "=== Deployment successful ==="
