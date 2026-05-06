#!/bin/bash
# ─── Start Development Script ──────────────────────────────────────────────
# Run this on the Debian server to pull the latest code and redeploy.
# Usage:  bash dev.sh
# ──────────────────────────────────────────────────────────────────────────

set -e  # Exit immediately if any command fails

echo "🏗️   Rebuilding and restarting containers..."
docker compose -f docker-compose.dev.yml up

echo "Development is running on http://localhost:3000"
