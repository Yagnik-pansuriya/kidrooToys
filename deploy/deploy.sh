#!/bin/bash
# ══════════════════════════════════════════════════════════════════════════════
# KidrooToys — Deployment Script
# ══════════════════════════════════════════════════════════════════════════════
#
# Run this to deploy or update your application:
#   chmod +x deploy/deploy.sh
#   ./deploy/deploy.sh
#
# ══════════════════════════════════════════════════════════════════════════════

set -euo pipefail

# ── Configuration ───────────────────────────────────────────────────────────
PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
COMPOSE_FILE="docker-compose.prod.yml"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

echo "═══════════════════════════════════════════════════════════════"
echo "  KidrooToys — Deploying from: $PROJECT_DIR"
echo "  Timestamp: $TIMESTAMP"
echo "═══════════════════════════════════════════════════════════════"

cd "$PROJECT_DIR"

# ── Pre-flight Checks ──────────────────────────────────────────────────────
echo ""
echo "🔍 Pre-flight checks..."

# Check Docker
if ! command -v docker &> /dev/null; then
    echo "   ❌ Docker not found. Run setup-server.sh first."
    exit 1
fi
echo "   ✅ Docker available"

# Check required files
for file in "$COMPOSE_FILE" "Caddyfile" "kidrooBackend/.env"; do
    if [ ! -f "$file" ]; then
        echo "   ❌ Missing: $file"
        exit 1
    fi
done
echo "   ✅ All config files present"

# Check Caddyfile has real domain (not placeholder)
if grep -q "kidrootoys.co" Caddyfile && grep -q "your-email@example.com" Caddyfile; then
    echo "   ⚠️  WARNING: Caddyfile still has placeholder values!"
    echo "      Edit Caddyfile and set your real domain + email before deploying."
    read -p "      Continue anyway? (y/N): " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# ── Pull Latest Code ───────────────────────────────────────────────────────
echo ""
echo "📥 Pulling latest code..."
if git rev-parse --is-inside-work-tree &> /dev/null; then
    git pull --ff-only
    echo "   ✅ Code updated"
else
    echo "   ⏩ Not a git repo — skipping pull"
fi

# ── Build & Deploy ─────────────────────────────────────────────────────────
echo ""
echo "🏗️  Building containers..."
docker compose -f "$COMPOSE_FILE" build --no-cache

echo ""
echo "🚀 Starting services..."
docker compose -f "$COMPOSE_FILE" up -d

# ── Health Check ────────────────────────────────────────────────────────────
echo ""
echo "🏥 Waiting for services to be healthy..."
sleep 10

# Check if containers are running
RUNNING=$(docker compose -f "$COMPOSE_FILE" ps --status running -q | wc -l)
TOTAL=$(docker compose -f "$COMPOSE_FILE" ps -q | wc -l)

if [ "$RUNNING" -eq "$TOTAL" ] && [ "$TOTAL" -gt 0 ]; then
    echo "   ✅ All $TOTAL services running"
else
    echo "   ⚠️  Only $RUNNING/$TOTAL services running"
    echo ""
    echo "   Checking logs for failed services..."
    docker compose -f "$COMPOSE_FILE" ps
    echo ""
    docker compose -f "$COMPOSE_FILE" logs --tail=20
fi

# ── Clean Up Old Images ────────────────────────────────────────────────────
echo ""
echo "🧹 Cleaning up old images..."
docker image prune -f
echo "   ✅ Cleanup done"

# ── Summary ─────────────────────────────────────────────────────────────────
echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "  ✅ Deployment complete!"
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "  Useful commands:"
echo "    Logs:      docker compose -f $COMPOSE_FILE logs -f"
echo "    Status:    docker compose -f $COMPOSE_FILE ps"
echo "    Restart:   docker compose -f $COMPOSE_FILE restart"
echo "    Stop:      docker compose -f $COMPOSE_FILE down"
echo "    Rollback:  git checkout <previous-commit> && ./deploy/deploy.sh"
echo ""
