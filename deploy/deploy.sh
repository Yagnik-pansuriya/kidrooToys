#!/bin/bash
# ══════════════════════════════════════════════════════════════════════════════
# KidrooToys — Deployment Script
# ══════════════════════════════════════════════════════════════════════════════
#
# Deploys the application natively:
#   - Builds React frontend → static files served by Nginx
#   - Compiles TypeScript backend → runs via PM2
#
# Run this to deploy or update:
#   chmod +x deploy/deploy.sh
#   ./deploy/deploy.sh
#
# ══════════════════════════════════════════════════════════════════════════════

set -euo pipefail

# ── Configuration ───────────────────────────────────────────────────────────
PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
FRONTEND_DIR="$PROJECT_DIR/frontend"
BACKEND_DIR="$PROJECT_DIR/kidrooBackend"

echo "═══════════════════════════════════════════════════════════════"
echo "  KidrooToys — Deploying from: $PROJECT_DIR"
echo "  Timestamp: $TIMESTAMP"
echo "═══════════════════════════════════════════════════════════════"

cd "$PROJECT_DIR"

# ── Pre-flight Checks ──────────────────────────────────────────────────────
echo ""
echo "🔍 Pre-flight checks..."

if ! command -v node &> /dev/null; then
    echo "   ❌ Node.js not found. Run setup-server.sh first."
    exit 1
fi
echo "   ✅ Node.js $(node --version)"

if ! command -v pm2 &> /dev/null; then
    echo "   ❌ PM2 not found. Run: npm install -g pm2"
    exit 1
fi
echo "   ✅ PM2 available"

if ! command -v nginx &> /dev/null; then
    echo "   ❌ Nginx not found. Run setup-server.sh first."
    exit 1
fi
echo "   ✅ Nginx available"

if ! systemctl is-active --quiet mongod; then
    echo "   ⚠️  MongoDB not running. Starting..."
    sudo systemctl start mongod
fi
echo "   ✅ MongoDB running"

if ! systemctl is-active --quiet redis-server; then
    echo "   ⚠️  Redis not running. Starting..."
    sudo systemctl start redis-server
fi
echo "   ✅ Redis running"

if [ ! -f "$BACKEND_DIR/.env" ]; then
    echo "   ❌ Missing: kidrooBackend/.env"
    echo "      Run: cp .env.production.example kidrooBackend/.env && nano kidrooBackend/.env"
    exit 1
fi
echo "   ✅ All config files present"

# ── Pull Latest Code ───────────────────────────────────────────────────────
echo ""
echo "📥 Pulling latest code..."
if git rev-parse --is-inside-work-tree &> /dev/null; then
    git pull --ff-only
    echo "   ✅ Code updated"
else
    echo "   ⏩ Not a git repo — skipping pull"
fi

# ── Build Frontend ─────────────────────────────────────────────────────────
echo ""
echo "🏗️  Building frontend..."
cd "$FRONTEND_DIR"
npm ci --prefer-offline
npm run build
echo "   ✅ Frontend built → $FRONTEND_DIR/dist"

# ── Build Backend ──────────────────────────────────────────────────────────
echo ""
echo "🏗️  Building backend..."
cd "$BACKEND_DIR"
npm ci --prefer-offline
npm run build
echo "   ✅ Backend compiled (TypeScript → JavaScript)"

# ── Setup Nginx Config ────────────────────────────────────────────────────
echo ""
echo "🌐 Updating Nginx configuration..."
cd "$PROJECT_DIR"

if [ -f deploy/nginx.conf ]; then
    sudo cp deploy/nginx.conf /etc/nginx/sites-available/kidroo

    # Enable site if not already enabled
    if [ ! -L /etc/nginx/sites-enabled/kidroo ]; then
        sudo ln -sf /etc/nginx/sites-available/kidroo /etc/nginx/sites-enabled/kidroo
    fi

    # Remove default site if it exists
    if [ -f /etc/nginx/sites-enabled/default ]; then
        sudo rm -f /etc/nginx/sites-enabled/default
    fi

    # Test and reload Nginx
    if sudo nginx -t; then
        sudo systemctl reload nginx
        echo "   ✅ Nginx config updated and reloaded"
    else
        echo "   ❌ Nginx config has errors! Check: sudo nginx -t"
        exit 1
    fi
else
    echo "   ⚠️  deploy/nginx.conf not found — skipping Nginx update"
fi

# ── Start/Restart Backend with PM2 ────────────────────────────────────────
echo ""
echo "🚀 Starting backend with PM2..."
cd "$BACKEND_DIR"

if pm2 describe kidroo-backend &> /dev/null; then
    pm2 restart kidroo-backend --update-env
    echo "   ✅ Backend restarted"
else
    pm2 start dist/index.js \
        --name "kidroo-backend" \
        --max-memory-restart 500M \
        --time \
        --env production
    echo "   ✅ Backend started"
fi

pm2 save
echo "   ✅ PM2 process list saved"

# ── Health Check ────────────────────────────────────────────────────────────
echo ""
echo "🏥 Waiting for services to be healthy..."
sleep 5

if curl -sf http://localhost:5000/health > /dev/null 2>&1; then
    echo "   ✅ Backend is healthy"
else
    echo "   ⚠️  Backend health check failed. Check: pm2 logs kidroo-backend --lines 20"
fi

if systemctl is-active --quiet nginx; then
    echo "   ✅ Nginx is running"
else
    echo "   ⚠️  Nginx is not running. Check: sudo systemctl status nginx"
fi

# ── Summary ─────────────────────────────────────────────────────────────────
echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "  ✅ Deployment complete!"
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "  Services:"
echo "    ✅ Frontend → static files served by Nginx"
echo "    ✅ Backend  → PM2 process (kidroo-backend)"
echo "    ✅ MongoDB  → systemd service (mongod)"
echo "    ✅ Redis    → systemd service (redis-server)"
echo "    ✅ Nginx    → reverse proxy + static files + SSL"
echo ""
echo "  Useful commands:"
echo "    Backend logs:   pm2 logs kidroo-backend"
echo "    PM2 status:     pm2 status"
echo "    Restart app:    pm2 restart kidroo-backend"
echo "    Nginx status:   sudo systemctl status nginx"
echo "    Nginx logs:     sudo tail -f /var/log/nginx/kidroo_access.log"
echo "    Nginx errors:   sudo tail -f /var/log/nginx/kidroo_error.log"
echo "    MongoDB:        sudo systemctl status mongod"
echo "    Redis:          sudo systemctl status redis-server"
echo ""
echo "  If you haven't set up SSL yet, run:"
echo "    sudo certbot --nginx -d kidroo.in -d www.kidroo.in"
echo ""
