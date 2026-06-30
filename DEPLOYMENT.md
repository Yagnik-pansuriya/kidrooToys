# 🚀 KidrooToys — Deployment Guide

Complete guide to deploy KidrooToys on a Hostinger VPS (No Docker, No Caddy).

**Stack:** Node.js + PM2 | MongoDB | Redis | Nginx + Certbot (SSL)

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Prerequisites](#prerequisites)
3. [Step 1: Buy a VPS](#step-1-buy-a-vps)
4. [Step 2: Point DNS to Your Server](#step-2-point-dns-to-your-server)
5. [Step 3: Set Up the Server](#step-3-set-up-the-server)
6. [Step 4: Configure MongoDB](#step-4-configure-mongodb)
7. [Step 5: Configure the Application](#step-5-configure-the-application)
8. [Step 6: Deploy](#step-6-deploy)
9. [Step 7: Setup SSL (HTTPS)](#step-7-setup-ssl-https)
10. [Step 8: Verify Everything](#step-8-verify-everything)
11. [Updating the Application](#updating-the-application)
12. [Monitoring & Logs](#monitoring--logs)
13. [Backup & Restore](#backup--restore)
14. [Troubleshooting](#troubleshooting)

---

## Architecture Overview

```
Internet
    │
    ▼
┌─────────────────────────────────────────────┐
│  Nginx (Port 80/443)                        │
│  ├── SSL via Let's Encrypt (Certbot)        │
│  ├── kidrootoys.co/* → React static files   │
│  └── kidrootoys.co/api/* → Node.js :5000    │
├─────────────────────────────────────────────┤
│                                             │
│  Node.js Backend (PM2, Port 5000)           │
│  ├── Express API                            │
│  ├── → MongoDB (localhost:27017)            │
│  └── → Redis (localhost:6379)               │
│                                             │
└─────────────────────────────────────────────┘
```

**How it works:**
- **Nginx** serves the React frontend as static files
- **Nginx** reverse-proxies `/api/*` requests to Node.js backend on port 5000
- **Certbot** manages SSL certificates (free, auto-renewing)
- **PM2** keeps the Node.js backend running and restarts it on crashes
- **MongoDB** runs as a systemd service (auto-starts on boot)
- **Redis** runs as a systemd service (auto-starts on boot)

---

## Prerequisites

- A domain name (e.g., `kidrootoys.co`)
- Hostinger VPS (KVM 1 or higher)
- Your code pushed to GitHub

---

## Step 1: Buy a VPS

### Recommended: Hostinger VPS KVM 1

Go to [hostinger.com/in/vps-hosting](https://www.hostinger.in/vps-hosting)

| Plan     | RAM  | vCPU | Storage | Price      |
|----------|------|------|---------|------------|
| **KVM 1** | **4 GB** | **1** | **50 GB** | **₹599/mo** |
| KVM 2    | 8 GB | 2    | 100 GB  | ₹779/mo    |

> Without Docker, **KVM 1 (4 GB) is enough** for 100-200 users/day.

At purchase:
1. Choose **Ubuntu 22.04** as OS
2. Set a **strong root password**
3. Note the **VPS IP address**

---

## Step 2: Point DNS to Your Server

In your domain provider's DNS settings, add:

| Type | Name  | Value           | TTL  |
|------|-------|-----------------|------|
| A    | `@`   | `YOUR_VPS_IP`   | 3600 |
| A    | `www` | `YOUR_VPS_IP`   | 3600 |

Wait 5-30 minutes for DNS to propagate.

Verify:
```bash
nslookup kidrootoys.co
# Should return your VPS IP
```

---

## Step 3: Set Up the Server

### 3.1. Connect via SSH

```bash
ssh root@YOUR_VPS_IP
```

### 3.2. Clone Your Project & Run Setup

```bash
cd /opt
git clone https://github.com/Yagnik-pansuriya/kidrooToys.git kidrootoys
cd kidrootoys

# Make scripts executable
chmod +x deploy/*.sh

# Run one-time server setup
sudo ./deploy/setup-server.sh
```

This installs: **Node.js 18, PM2, MongoDB 7, Redis, Nginx, Certbot, UFW, Fail2Ban**

---

## Step 4: Configure MongoDB

### 4.1. Create Database & Users

```bash
sudo mongosh < deploy/mongo-init.js
```

> **Edit `deploy/mongo-init.js` first** — change the placeholder passwords!

### 4.2. Enable MongoDB Authentication

```bash
sudo nano /etc/mongod.conf
```

Find the `#security:` section and change it to:
```yaml
security:
  authorization: enabled
```

Restart MongoDB:
```bash
sudo systemctl restart mongod
```

### 4.3. Migrate Data from Atlas (if needed)

```bash
# Install MongoDB tools
sudo apt install -y mongodb-database-tools

# Export from Atlas
mongodump \
  --uri="mongodb+srv://your-user:your-pass@cluster.mongodb.net/kidroo" \
  --out=/tmp/kidroo-backup

# Import to local MongoDB
mongorestore \
  --uri="mongodb://kidroo_app:YOUR_APP_PASSWORD@localhost:27017/kidroo" \
  --db=kidroo \
  /tmp/kidroo-backup/kidroo

# Verify
mongosh -u kidroo_app -p YOUR_APP_PASSWORD --authenticationDatabase kidroo \
  --eval "use kidroo; db.products.countDocuments();"

# Cleanup
rm -rf /tmp/kidroo-backup
```

---

## Step 5: Configure the Application

### 5.1. Backend Environment

```bash
cp .env.production.example kidrooBackend/.env
nano kidrooBackend/.env
```

Set these values:
```env
NODE_ENV=production
PORT=5000

# Database (local MongoDB)
DB_URL=mongodb://kidroo_app:YOUR_APP_PASSWORD@localhost:27017/kidroo

# Redis (local)
REDIS_URL=redis://localhost:6379

# Security — generate a NEW secret!
JWT_SECRET=<run: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))">
JWT_EXPIRE=7d

# CORS
ALLOWED_ORIGINS=https://kidrootoys.co,https://www.kidrootoys.co

# Cloudinary, Brevo SMTP, Razorpay, MSG91 — fill in your values
# IMPORTANT: Use Razorpay LIVE keys, not test keys!
# IMPORTANT: Set SMS_PROVIDER=msg91 or twilio, NOT console!
```

### 5.2. Frontend Environment

```bash
nano frontend/.env.production
```

Set:
```env
VITE_API_URL=/api/
```

### 5.3. Nginx Configuration

```bash
# Copy config
sudo cp deploy/nginx.conf /etc/nginx/sites-available/kidrootoys

# Enable the site
sudo ln -s /etc/nginx/sites-available/kidrootoys /etc/nginx/sites-enabled/

# Remove default site
sudo rm -f /etc/nginx/sites-enabled/default

# Test & reload
sudo nginx -t && sudo systemctl reload nginx
```

---

## Step 6: Deploy

```bash
cd /opt/kidrootoys
./deploy/deploy.sh
```

This will:
1. Pull latest code from GitHub
2. Build React frontend (`npm run build`)
3. Compile TypeScript backend (`npm run build`)
4. Copy Nginx config & reload
5. Start/restart backend with PM2

---

## Step 7: Setup SSL (HTTPS)

Run Certbot **after DNS is pointing to your VPS**:

```bash
sudo certbot --nginx -d kidrootoys.co -d www.kidrootoys.co
```

Certbot will:
- Obtain a free SSL certificate from Let's Encrypt
- Auto-modify your Nginx config to add HTTPS
- Set up auto-renewal (certificates renew every 90 days automatically)

Verify auto-renewal:
```bash
sudo certbot renew --dry-run
```

---

## Step 8: Verify Everything

### Check Services

```bash
pm2 status                          # Backend should be "online"
sudo systemctl status nginx         # Should be "active (running)"
sudo systemctl status mongod        # Should be "active (running)"
sudo systemctl status redis-server  # Should be "active (running)"
```

### Test URLs

- `https://kidrootoys.co` → Frontend loads ✅
- `https://www.kidrootoys.co` → Frontend loads ✅
- `http://kidrootoys.co` → Redirects to HTTPS ✅
- `https://kidrootoys.co/health` → Returns `{"status":"ok"}` ✅
- `https://kidrootoys.co/api/categories` → Returns data ✅

---

## Updating the Application

When you push new code to GitHub:

```bash
ssh root@YOUR_VPS_IP
cd /opt/kidrootoys
./deploy/deploy.sh
```

Or manually:
```bash
cd /opt/kidrootoys
git pull
cd frontend && npm ci && npm run build
cd ../kidrooBackend && npm ci && npm run build
pm2 restart kidroo-backend
```

---

## Monitoring & Logs

```bash
# Backend logs (live)
pm2 logs kidroo-backend

# Backend logs (last 100 lines)
pm2 logs kidroo-backend --lines 100

# PM2 process status
pm2 status

# PM2 resource monitor
pm2 monit

# Nginx access logs
sudo tail -f /var/log/nginx/kidrootoys_access.log

# Nginx error logs
sudo tail -f /var/log/nginx/kidrootoys_error.log

# MongoDB logs
sudo tail -f /var/log/mongodb/mongod.log

# System resources
htop
df -h
free -h
```

---

## Backup & Restore

### Setup Daily Backups

```bash
chmod +x deploy/backup-mongodb.sh

# Edit the script — set your MongoDB password
nano deploy/backup-mongodb.sh

# Add to crontab (runs daily at 3 AM)
crontab -e
# Add this line:
0 3 * * * /opt/kidrootoys/deploy/backup-mongodb.sh >> /var/log/kidroo-backup.log 2>&1
```

### Restore from Backup

```bash
mongorestore \
  --uri="mongodb://kidroo_app:YOUR_APP_PASSWORD@localhost:27017/kidroo" \
  --archive --gzip --drop < /opt/kidrootoys/backups/kidroo_TIMESTAMP.gz
```

---

## Troubleshooting

### ❌ Backend Won't Start

```bash
pm2 logs kidroo-backend --lines 50
# Common causes:
# - Wrong DB_URL in .env
# - MongoDB not running: sudo systemctl start mongod
# - Port 5000 already in use: lsof -i :5000
```

### ❌ Nginx Shows 502 Bad Gateway

```bash
# Backend is not running — start it
pm2 status
pm2 restart kidroo-backend

# Check if backend is listening on port 5000
curl http://localhost:5000/health
```

### ❌ SSL Certificate Not Working

```bash
# Re-run Certbot
sudo certbot --nginx -d kidrootoys.co -d www.kidrootoys.co

# Check Nginx config
sudo nginx -t

# Common cause: DNS not pointing to VPS yet
nslookup kidrootoys.co
```

### ❌ CORS Errors

Check `ALLOWED_ORIGINS` in `kidrooBackend/.env`:
```env
ALLOWED_ORIGINS=https://kidrootoys.co,https://www.kidrootoys.co
```

### ❌ MongoDB Connection Refused

```bash
sudo systemctl status mongod
sudo systemctl start mongod
sudo tail -f /var/log/mongodb/mongod.log
```

---

## Quick Command Reference

```bash
# ── Application ────────────────────────────────────────────────
./deploy/deploy.sh                    # Full deploy
pm2 restart kidroo-backend            # Restart backend
pm2 logs kidroo-backend               # View backend logs
pm2 status                            # Check process status
pm2 monit                             # Resource monitor

# ── Nginx ──────────────────────────────────────────────────────
sudo nginx -t                         # Test config
sudo systemctl reload nginx           # Reload config
sudo systemctl restart nginx          # Full restart
sudo tail -f /var/log/nginx/kidrootoys_error.log

# ── MongoDB ────────────────────────────────────────────────────
sudo systemctl status mongod          # Check status
sudo systemctl restart mongod         # Restart
mongosh -u kidroo_app -p PASSWORD     # Connect to shell

# ── Redis ──────────────────────────────────────────────────────
sudo systemctl status redis-server    # Check status
redis-cli ping                        # Test connection

# ── SSL ────────────────────────────────────────────────────────
sudo certbot renew --dry-run          # Test renewal
sudo certbot certificates             # List certificates

# ── System ─────────────────────────────────────────────────────
htop                                  # Resource usage
df -h                                 # Disk space
free -h                               # RAM usage
ufw status                            # Firewall rules
```

---

## File Reference

| File | Purpose |
|------|---------|
| `deploy/setup-server.sh` | One-time VPS setup (installs all software) |
| `deploy/deploy.sh` | Deploy/update script |
| `deploy/nginx.conf` | Nginx site configuration |
| `deploy/mongo-init.js` | MongoDB database & user setup |
| `deploy/backup-mongodb.sh` | Daily MongoDB backup script |
| `.env.production.example` | Template for production env vars |
| `frontend/.env.production` | Frontend production API URL |
| `kidrooBackend/.env` | Backend environment config (on VPS only) |
