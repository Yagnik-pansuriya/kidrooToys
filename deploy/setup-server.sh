#!/bin/bash
# ══════════════════════════════════════════════════════════════════════════════
# KidrooToys — VPS First-Time Setup Script
# ══════════════════════════════════════════════════════════════════════════════
#
# Run this ONCE on a fresh Ubuntu 22.04/24.04 VPS:
#   chmod +x deploy/setup-server.sh
#   sudo ./deploy/setup-server.sh
#
# ══════════════════════════════════════════════════════════════════════════════

set -euo pipefail

echo "═══════════════════════════════════════════════════════════════"
echo "  KidrooToys — VPS Server Setup"
echo "═══════════════════════════════════════════════════════════════"

# ── 1. System Update ────────────────────────────────────────────────────────
echo ""
echo "📦 Updating system packages..."
apt update && apt upgrade -y

# ── 2. Install Essential Packages ───────────────────────────────────────────
echo ""
echo "🔧 Installing essential packages..."
apt install -y \
    curl \
    git \
    ufw \
    htop \
    fail2ban \
    unzip

# ── 3. Install Docker ──────────────────────────────────────────────────────
echo ""
echo "🐳 Installing Docker..."
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com | sh
    systemctl enable docker
    systemctl start docker
    echo "   ✅ Docker installed successfully"
else
    echo "   ⏩ Docker already installed"
fi

# ── 4. Install Docker Compose Plugin ───────────────────────────────────────
echo ""
echo "🔌 Checking Docker Compose..."
if docker compose version &> /dev/null; then
    echo "   ✅ Docker Compose plugin available"
else
    echo "   📦 Installing Docker Compose plugin..."
    apt install -y docker-compose-plugin
fi

# ── 5. Add Current User to Docker Group ────────────────────────────────────
echo ""
echo "👤 Adding current user to docker group..."
if [ -n "${SUDO_USER:-}" ]; then
    usermod -aG docker "$SUDO_USER"
    echo "   ✅ Added $SUDO_USER to docker group (re-login to take effect)"
fi

# ── 6. Configure Firewall (UFW) ────────────────────────────────────────────
echo ""
echo "🔒 Configuring firewall..."
ufw --force reset
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP  (Caddy)
ufw allow 443/tcp   # HTTPS (Caddy)
ufw allow 443/udp   # HTTP/3 QUIC (Caddy)
ufw --force enable
echo "   ✅ Firewall configured (SSH, HTTP, HTTPS allowed)"

# ── 7. Configure Fail2Ban ──────────────────────────────────────────────────
echo ""
echo "🛡️  Configuring Fail2Ban..."
systemctl enable fail2ban
systemctl start fail2ban
echo "   ✅ Fail2Ban active (protects SSH from brute force)"

# ── 8. Create Swap File (for small VPS with <= 2GB RAM) ────────────────────
echo ""
echo "💾 Setting up swap file..."
if [ ! -f /swapfile ]; then
    fallocate -l 2G /swapfile
    chmod 600 /swapfile
    mkswap /swapfile
    swapon /swapfile
    echo '/swapfile none swap sw 0 0' >> /etc/fstab
    # Optimize swap usage
    sysctl vm.swappiness=10
    echo 'vm.swappiness=10' >> /etc/sysctl.conf
    echo "   ✅ 2GB swap file created"
else
    echo "   ⏩ Swap file already exists"
fi

# ── 9. Create Project Directory ────────────────────────────────────────────
echo ""
echo "📁 Creating project directory..."
PROJECT_DIR="/opt/kidrootoys"
mkdir -p "$PROJECT_DIR"
if [ -n "${SUDO_USER:-}" ]; then
    chown -R "$SUDO_USER:$SUDO_USER" "$PROJECT_DIR"
fi
echo "   ✅ Project directory: $PROJECT_DIR"

# ── Done ────────────────────────────────────────────────────────────────────
echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "  ✅ Server setup complete!"
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "  Next steps:"
echo "    1. Log out and back in (for docker group to take effect)"
echo "    2. Clone your repo:  cd /opt/kidrootoys && git clone <repo-url> ."
echo "    3. Copy env file:    cp .env.production.example kidrooBackend/.env"
echo "    4. Edit env file:    nano kidrooBackend/.env"
echo "    5. Edit Caddyfile:   nano Caddyfile  (set your domain + email)"
echo "    6. Edit frontend:    nano frontend/.env.production (set API URL)"
echo "    7. Deploy:           ./deploy/deploy.sh"
echo ""
