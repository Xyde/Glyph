#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

RUN_ID="${1:-}"
if [ -z "$RUN_ID" ]; then
    echo "Querying latest GitHub Actions run ID for Xyde/Glyph..."
    RUN_ID="$(gh run list --repo Xyde/Glyph --workflow 'Build Community macOS App' --limit 1 --json databaseId --jq '.[0].databaseId')"
fi

if [ -z "$RUN_ID" ]; then
    echo "Error: Could not determine GitHub Actions Run ID." >&2
    exit 1
fi

echo "=== 1. Watching GitHub Actions Run $RUN_ID ==="
gh run watch "$RUN_ID" --repo Xyde/Glyph --exit-status

echo "=== 2. Downloading and deploying binary ==="
"$SCRIPT_DIR/download_and_deploy.sh" "$RUN_ID"

echo "=== 3. Verification complete ==="
