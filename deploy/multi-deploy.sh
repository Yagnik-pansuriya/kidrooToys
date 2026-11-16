#!/bin/bash
# ══════════════════════════════════════════════════════════════════════════════
# KidrooToys — Multi-Repository Deployment Script
# ══════════════════════════════════════════════════════════════════════════════
#
# Pulls updates from both the main repository (Frontend/Deploy) and the backend
# repository, cleans up PM2 port conflicts, and deploys the entire stack.
#
# Usage:
#   chmod +x deploy/multi-deploy.sh
#   ./deploy/multi-deploy.sh
#
# ══════════════════════════════════════════════════════════════════════════════

set -euo pipefail

# Directories
PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
BACKEND_DIR="$PROJECT_DIR/kidrooBackend"

echo "═══════════════════════════════════════════════════════════════"
echo "  🔄 Starting Multi-Repository Deploy for Kidroo"
echo "  Location: $PROJECT_DIR"
echo "═══════════════════════════════════════════════════════════════"

# ── 1. Fix Git Dubious Ownership Warning ─────────────────────────────────────
echo "🛡️  Checking Git safe directory configurations..."
git config --global --add safe.directory "$PROJECT_DIR" 2>/dev/null || true
git config --global --add safe.directory "$BACKEND_DIR" 2>/dev/null || true
echo "   ✅ Git directories configured as safe"

# ── 2. Pull Main Repository (Frontend & Deployment scripts) ─────────────────
echo ""
echo "📥 Pulling main repository (Frontend & Deploy)..."
cd "$PROJECT_DIR"
if git rev-parse --is-inside-work-tree &> /dev/null; then
    git pull --ff-only
    echo "   ✅ Main repository is up to date"
else
    echo "   ⚠️  Not in a git repository context for main project."
fi

# ── 3. Pull Backend Repository ──────────────────────────────────────────────
echo ""
echo "📥 Pulling backend repository (kidrooBackend)..."
cd "$BACKEND_DIR"
if git rev-parse --is-inside-work-tree &> /dev/null; then
    git pull --ff-only
    echo "   ✅ Backend repository is up to date"
else
    echo "   ⚠️  Not in a git repository context for backend."
fi

# ── 4. Clean up PM2 Process Conflicts (if kidroo-api is running) ─────────────
echo ""
echo "🧹 Resolving PM2 process name conflicts..."
if pm2 describe kidroo-api &> /dev/null; then
    echo "   ⚠️  Found running 'kidroo-api' process on port 5000. Deleting to prevent conflict..."
    pm2 delete kidroo-api
    echo "   ✅ Deleted 'kidroo-api'"
else
    echo "   ✅ No conflicting 'kidroo-api' process found"
fi

# ── 5. Run the Core Deployment Script ────────────────────────────────────────
echo ""
echo "🚀 Triggering core deploy script (build, nginx reload, pm2 restart)..."
cd "$PROJECT_DIR"
chmod +x deploy/deploy.sh
./deploy/deploy.sh

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "  🎉 Multi-Repository Deployment Successfully Completed!"
echo "═══════════════════════════════════════════════════════════════"
