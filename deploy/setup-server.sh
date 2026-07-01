#!/bin/bash
# ══════════════════════════════════════════════════════════════════════════════
# KidrooToys — VPS First-Time Setup Script
# ══════════════════════════════════════════════════════════════════════════════
#
# Installs everything natively on Ubuntu 22.04/24.04:
#   - Node.js 18 LTS
#   - MongoDB 7
#   - Redis 7
#   - Nginx (reverse proxy + static file server)
#   - Certbot (free SSL via Let's Encrypt)
#   - PM2 (Node.js process manager)
#
# Run ONCE on a fresh VPS:
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
    unzip \
    gnupg \
    build-essential \
    software-properties-common

# ── 3. Install Node.js 18 LTS ──────────────────────────────────────────────
echo ""
echo "🟢 Installing Node.js 18 LTS..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt install -y nodejs
    echo "   ✅ Node.js $(node --version) installed"
else
    echo "   ⏩ Node.js $(node --version) already installed"
fi

# ── 4. Install PM2 (Process Manager) ───────────────────────────────────────
echo ""
echo "⚡ Installing PM2..."
if ! command -v pm2 &> /dev/null; then
    npm install -g pm2
    echo "   ✅ PM2 installed"
else
    echo "   ⏩ PM2 already installed"
fi

# ── 5. Install MongoDB 7 ───────────────────────────────────────────────────
echo ""
echo "🍃 Installing MongoDB 7..."
if ! command -v mongod &> /dev/null; then
    curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | \
        gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor

    echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu $(lsb_release -cs)/mongodb-org/7.0 multiverse" | \
        tee /etc/apt/sources.list.d/mongodb-org-7.0.list

    apt update
    apt install -y mongodb-org

    systemctl start mongod
    systemctl enable mongod
    echo "   ✅ MongoDB 7 installed and running"
else
    echo "   ⏩ MongoDB already installed"
fi

# ── 6. Install Redis ───────────────────────────────────────────────────────
echo ""
echo "🔴 Installing Redis..."
if ! command -v redis-server &> /dev/null; then
    apt install -y redis-server

    # Configure Redis for production
    sed -i 's/^supervised no/supervised systemd/' /etc/redis/redis.conf
    sed -i 's/^# maxmemory .*/maxmemory 256mb/' /etc/redis/redis.conf
    sed -i 's/^# maxmemory-policy .*/maxmemory-policy allkeys-lru/' /etc/redis/redis.conf

    systemctl restart redis-server
    systemctl enable redis-server
    echo "   ✅ Redis installed and running"
else
    echo "   ⏩ Redis already installed"
fi

# ── 7. Install Nginx ───────────────────────────────────────────────────────
echo ""
echo "🌐 Installing Nginx..."
if ! command -v nginx &> /dev/null; then
    apt install -y nginx
    systemctl enable nginx
    systemctl start nginx
    echo "   ✅ Nginx installed and running"
else
    echo "   ⏩ Nginx already installed"
fi

# ── 8. Install Certbot (Let's Encrypt SSL) ─────────────────────────────────
echo ""
echo "🔒 Installing Certbot..."
if ! command -v certbot &> /dev/null; then
    apt install -y certbot python3-certbot-nginx
    echo "   ✅ Certbot installed"
else
    echo "   ⏩ Certbot already installed"
fi

# ── 9. Configure Firewall (UFW) ────────────────────────────────────────────
echo ""
echo "🔒 Configuring firewall..."
ufw --force reset
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp       # SSH
ufw allow 'Nginx Full' # HTTP + HTTPS
ufw --force enable
echo "   ✅ Firewall configured (SSH, HTTP, HTTPS allowed)"

# ── 10. Configure Fail2Ban ─────────────────────────────────────────────────
echo ""
echo "🛡️  Configuring Fail2Ban..."
systemctl enable fail2ban
systemctl start fail2ban
echo "   ✅ Fail2Ban active (protects SSH from brute force)"

# ── 11. Create Swap File ───────────────────────────────────────────────────
echo ""
echo "💾 Setting up swap file..."
if [ ! -f /swapfile ]; then
    fallocate -l 2G /swapfile
    chmod 600 /swapfile
    mkswap /swapfile
    swapon /swapfile
    echo '/swapfile none swap sw 0 0' >> /etc/fstab
    sysctl vm.swappiness=10
    echo 'vm.swappiness=10' >> /etc/sysctl.conf
    echo "   ✅ 2GB swap file created"
else
    echo "   ⏩ Swap file already exists"
fi

# ── 12. Create Project Directory ───────────────────────────────────────────
echo ""
echo "📁 Creating project directory..."
PROJECT_DIR="/opt/kidrootoys"
mkdir -p "$PROJECT_DIR"
mkdir -p /var/log/caddy  # legacy cleanup — can be ignored
echo "   ✅ Project directory: $PROJECT_DIR"

# ── 13. Setup PM2 Startup ──────────────────────────────────────────────────
echo ""
echo "🔄 Configuring PM2 startup..."
pm2 startup systemd -u root --hp /root
echo "   ✅ PM2 will auto-start on reboot"

# ── Done ────────────────────────────────────────────────────────────────────
echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "  ✅ Server setup complete!"
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "  Installed:"
echo "    ✅ Node.js $(node --version)"
echo "    ✅ PM2 (process manager)"
echo "    ✅ MongoDB 7 (database)"
echo "    ✅ Redis (cache)"
echo "    ✅ Nginx (web server + reverse proxy)"
echo "    ✅ Certbot (SSL certificates)"
echo "    ✅ UFW firewall + Fail2Ban"
echo ""
echo "  Next steps:"
echo "    1. Clone your repo:    cd /opt/kidrootoys && git clone <repo-url> ."
echo "    2. Copy env file:      cp .env.production.example kidrooBackend/.env"
echo "    3. Edit env file:      nano kidrooBackend/.env"
echo "    4. Setup MongoDB:      sudo mongosh < deploy/mongo-init.js"
echo "    5. Copy Nginx config:  sudo cp deploy/nginx.conf /etc/nginx/sites-available/kidroo"
echo "    6. Enable site:        sudo ln -s /etc/nginx/sites-available/kidroo /etc/nginx/sites-enabled/"
echo "    7. Remove default:     sudo rm /etc/nginx/sites-enabled/default"
echo "    8. Get SSL:            sudo certbot --nginx -d kidroo.in -d www.kidroo.in"
echo "    9. Deploy:             ./deploy/deploy.sh"
echo ""
