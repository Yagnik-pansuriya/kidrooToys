# 🚀 KidrooToys — Deployment Guide

Complete guide to deploy KidrooToys on your own domain with a VPS server.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Current Setup (Vercel)](#current-setup-vercel)
3. [Step 1: Buy a Domain](#step-1-buy-a-domain)
4. [Step 2: Buy a VPS Server](#step-2-buy-a-vps-server)
5. [Step 3: Point DNS to Your Server](#step-3-point-dns-to-your-server)
6. [Step 4: Set Up the Server](#step-4-set-up-the-server)
7. [Step 5: Deploy the Application](#step-5-deploy-the-application)
8. [Step 6: Verify Everything Works](#step-6-verify-everything-works)
9. [Updating the Application](#updating-the-application)
10. [Rollback](#rollback)
11. [Monitoring & Logs](#monitoring--logs)
12. [Troubleshooting](#troubleshooting)
13. [Switching from Vercel to VPS](#switching-from-vercel-to-vps)

---

## Architecture Overview

```
Internet
    │
    ▼
┌──────────────────────────────┐
│  Caddy (Reverse Proxy)       │
│  Ports: 80, 443              │
│  Auto-HTTPS (Let's Encrypt)  │
├──────────────────────────────┤
│                              │
│  kidrootoys.co ───────────┐  │
│  www.kidrootoys.co ───────┼─►│ Frontend Container (Nginx :80)
│                           │  │ Serves React SPA
│  kidrootoys.co/api/* ─────┼─►│ Backend Container (Node :5000)
│                           │  │ Express API
│                           ▼  │
│                       Redis Container (:6379)
│                          │  Caching
└──────────────────────────────┘
          │
          ▼
   MongoDB Atlas (Cloud)
```

**Key points:**
- **Caddy** handles HTTPS automatically (Let's Encrypt certificates)
- **Frontend** is a static React build served by Nginx
- **Backend** is your Express API
- **Redis** runs locally in Docker for caching
- **MongoDB** stays on Atlas (cloud) — NOT in Docker

---

## Current Setup (Vercel)

Your app is currently deployed on Vercel (free tier):

| Service | URL |
|---------|-----|
| Frontend | `https://kidrootoys.vercel.app` |
| Backend API | `https://kidroo-backend.vercel.app` |

**This setup continues to work.** The VPS setup is an alternative — you can switch whenever you're ready.

---

## Step 1: Buy a Domain

### Recommended Providers
- **Hostinger** — ₹99-499/year for `.com`
- **Namecheap** — $8-10/year for `.com`
- **Cloudflare Registrar** — At-cost pricing

### What to Buy
- A domain like `kidrootoys.co`
- No need to buy hosting, SSL, or email from the registrar (we handle those ourselves)

---

## Step 2: Buy a VPS Server

### Recommended: Hostinger VPS

| Plan | RAM | CPU | Storage | Price |
|------|-----|-----|---------|-------|
| KVM 1 | 4 GB | 2 vCPU | 50 GB | ~₹299/month |
| KVM 2 | 8 GB | 4 vCPU | 100 GB | ~₹599/month |

> **Minimum requirement:** 2 GB RAM, 1 vCPU, 20 GB storage  
> **Recommended:** 4 GB RAM for smooth Docker builds

### VPS Setup at Purchase
1. Choose **Ubuntu 22.04** or **Ubuntu 24.04** as the OS
2. Set a **strong root password**
3. Add your **SSH key** (recommended over password login)
4. Note down the **server IP address** (e.g., `203.0.113.50`)

### Other VPS Providers
- **DigitalOcean** — $6/month (1GB) to $12/month (2GB)
- **Hetzner** — €4.5/month (best value in EU)
- **Linode (Akamai)** — $5/month

---

## Step 3: Point DNS to Your Server

You need to create **DNS records** that point your domain to your VPS IP address.

### If Domain is from Hostinger

1. Go to **Hostinger Dashboard** → **Domains** → your domain
2. Click **DNS / Nameservers** → **DNS Records**
3. Add these records:

| Type | Name | Value | TTL |
|------|------|-------|-----|
| A | `@` | `YOUR_SERVER_IP` | 3600 |
| A | `www` | `YOUR_SERVER_IP` | 3600 |

> Replace `YOUR_SERVER_IP` with your VPS IP (e.g., `203.0.113.50`)

### If Domain is from Namecheap

1. Go to **Dashboard** → **Domain List** → **Manage**
2. Click **Advanced DNS**
3. Add the same A records as above

### If Using Cloudflare DNS

1. Add your domain to Cloudflare
2. Go to **DNS** → **Records**
3. Add the same A records
4. **Important:** Set proxy status to **DNS only** (grey cloud) for Caddy's HTTPS to work

### Verify DNS is Working

After adding records, wait 5-30 minutes, then verify:

```bash
# From your local machine (or any terminal)
nslookup kidrootoys.co

# Should return your VPS IP address
```

> ⚠️ **DNS propagation can take up to 48 hours** in rare cases, but usually 5-30 minutes.

---

## Step 4: Set Up the Server

### 4.1. Connect to Your VPS via SSH

```bash
# From your local machine
ssh root@YOUR_SERVER_IP

# Or with SSH key
ssh -i ~/.ssh/your_key root@YOUR_SERVER_IP
```

### 4.2. Run the Setup Script

```bash
# Clone your project
cd /opt
git clone https://github.com/Yagnik-pansuriya/kidrooToys.git kidrootoys
cd kidrootoys

# Make scripts executable
chmod +x deploy/setup-server.sh deploy/deploy.sh

# Run server setup (installs Docker, configures firewall, etc.)
sudo ./deploy/setup-server.sh
```

This script automatically:
- ✅ Updates system packages
- ✅ Installs Docker + Docker Compose
- ✅ Configures firewall (UFW) — only ports 22, 80, 443
- ✅ Sets up Fail2Ban (SSH brute-force protection)
- ✅ Creates 2GB swap file (for small VPS)

**After running, log out and back in** for Docker permissions:
```bash
exit
ssh root@YOUR_SERVER_IP
cd /opt/kidrootoys
```

### 4.3. Configure Environment Variables

```bash
# Copy the template
cp .env.production.example kidrooBackend/.env

# Edit with your actual values
nano kidrooBackend/.env
```

**Fill in these critical values:**

```env
DB_URL=mongodb+srv://your-user:your-pass@cluster.mongodb.net/kidroo
JWT_SECRET=<generate-with: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))">
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
ALLOWED_ORIGINS=http://localhost,https://kidrootoys.co,https://www.kidrootoys.co
```

### 4.4. Configure Caddy (Your Domain)

```bash
nano Caddyfile
```

Replace the placeholder values:

```caddyfile
{
    email your-real-email@gmail.com     # ← Your email for SSL certificates
}

kidrootoys.co, www.kidrootoys.co {     # ← Your actual domain
    # Route API, Swagger Docs, and Health Check to backend
    handle /api/* {
        reverse_proxy backend:5000
    }
    handle /docs* {
        reverse_proxy backend:5000
    }
    handle /health {
        reverse_proxy backend:5000
    }

    # Route everything else to the frontend container
    handle {
        reverse_proxy frontend:80
    }
}
```

### 4.5. Configure Frontend API URL

```bash
nano frontend/.env.production
```

Set:
```env
VITE_API_URL=/api/
```

### 4.6. Update MongoDB Atlas Whitelist

Go to **MongoDB Atlas** → **Network Access** → **Add IP Address**:
- Add your VPS IP: `YOUR_SERVER_IP/32`
- Or allow from anywhere: `0.0.0.0/0` (less secure but simpler)

---

## Step 5: Deploy the Application

```bash
cd /opt/kidrootoys
./deploy/deploy.sh
```

This will:
1. Pull latest code from GitHub
2. Build Docker images (frontend + backend)
3. Start all 4 containers (Caddy, Frontend, Backend, Redis)
4. Caddy automatically obtains SSL certificates

**First deploy takes 2-5 minutes** (building images + getting certificates).

---

## Step 6: Verify Everything Works

### Check Services

```bash
# All 4 containers should be "Up"
docker compose -f docker-compose.prod.yml ps

# Expected output:
# caddy     ... Up   0.0.0.0:80->80/tcp, 0.0.0.0:443->443/tcp
# frontend  ... Up   80/tcp
# backend   ... Up   5000/tcp
# redis     ... Up   6379/tcp
```

### Test URLs

Open in your browser:
- `https://kidrootoys.co` → Should show the KidrooToys website
- `https://kidrootoys.co/health` → Should return `{"status":"ok"}`
- `http://kidrootoys.co` → Should auto-redirect to HTTPS

### Check Logs

```bash
# All services
docker compose -f docker-compose.prod.yml logs -f

# Specific service
docker compose -f docker-compose.prod.yml logs -f backend
docker compose -f docker-compose.prod.yml logs -f caddy
```

---

## Updating the Application

When you push new code to GitHub:

```bash
ssh root@YOUR_SERVER_IP
cd /opt/kidrootoys
./deploy/deploy.sh
```

Or for quick updates without rebuilding images:

```bash
cd /opt/kidrootoys
git pull
docker compose -f docker-compose.prod.yml up -d --build
```

---

## Rollback

If something breaks after an update:

```bash
# Find the previous working commit
git log --oneline -10

# Revert to it
git checkout <commit-hash>

# Redeploy
./deploy/deploy.sh
```

---

## Monitoring & Logs

### View Logs

```bash
# Live logs (all services)
docker compose -f docker-compose.prod.yml logs -f

# Backend only (last 100 lines)
docker compose -f docker-compose.prod.yml logs --tail=100 backend

# Caddy access logs
docker compose -f docker-compose.prod.yml exec caddy cat /data/logs/access.log
```

### Check Resource Usage

```bash
# Container resource usage
docker stats

# System overview
htop

# Disk usage
df -h
```

### Restart a Single Service

```bash
docker compose -f docker-compose.prod.yml restart backend
docker compose -f docker-compose.prod.yml restart frontend
```

---

## Troubleshooting

### ❌ SSL Certificate Not Working

```bash
# Check Caddy logs
docker compose -f docker-compose.prod.yml logs caddy

# Common causes:
# 1. DNS not pointing to your server yet (wait for propagation)
# 2. Ports 80/443 blocked by firewall
# 3. Using Cloudflare proxy (set to DNS-only / grey cloud)
```

### ❌ Backend Can't Connect to MongoDB

```bash
# Check backend logs
docker compose -f docker-compose.prod.yml logs backend

# Common causes:
# 1. VPS IP not whitelisted in MongoDB Atlas
# 2. Wrong DB_URL in kidrooBackend/.env
# 3. MongoDB Atlas network access set to specific IPs
```

### ❌ Frontend Shows Blank Page

```bash
# Check if frontend container is running
docker compose -f docker-compose.prod.yml ps frontend

# Rebuild frontend
docker compose -f docker-compose.prod.yml up -d --build frontend
```

### ❌ CORS Errors

Check `ALLOWED_ORIGINS` in `kidrooBackend/.env`:
```env
ALLOWED_ORIGINS=http://localhost,https://kidrootoys.co,https://www.kidrootoys.co
```

### ❌ Container Keeps Restarting

```bash
# Check exit code and logs
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs --tail=50 <service-name>
```

### ❌ Out of Disk Space

```bash
# Check disk usage
df -h

# Clean up Docker (remove unused images, containers, volumes)
docker system prune -a --volumes
```

---

## Switching from Vercel to VPS

Once your VPS is running perfectly:

### 1. Update CORS Origins (Backend)

In `kidrooBackend/.env` on the VPS, make sure `ALLOWED_ORIGINS` includes `https://kidrootoys.co` and `https://www.kidrootoys.co`.

### 2. Point Domain DNS

If your domain was previously pointing to Vercel:
- Update the A records to point to your VPS IP
- Wait for DNS propagation (5-30 minutes)

### 3. Update Frontend API URL

In `frontend/.env.production` ensure:
```env
VITE_API_URL=/api/
```

Then rebuild: `./deploy/deploy.sh`

### 4. Keep Vercel as Staging (Optional)

You can keep Vercel running as a staging/preview environment (pre-production):
- Vercel frontend: `kidrootoys.vercel.app` (set `VITE_API_URL` to your Vercel backend URL in Vercel project settings)
- VPS: `kidrootoys.co` (production)

---

## File Reference

| File | Purpose |
|------|---------|
| `Caddyfile` | Caddy reverse proxy config (domain → containers) |
| `docker-compose.prod.yml` | Production container orchestration |
| `docker-compose.yml` | Local development (unchanged) |
| `.env.production.example` | Template for production env vars |
| `frontend/.env.development` | Frontend dev API URL |
| `frontend/.env.production` | Frontend prod API URL |
| `frontend/Dockerfile` | Multi-stage: build React → serve with Nginx |
| `frontend/nginx.conf` | Nginx SPA config |
| `kidrooBackend/Dockerfile` | Multi-stage: compile TS → run with Node |
| `deploy/setup-server.sh` | One-time VPS setup script |
| `deploy/deploy.sh` | Deploy/update script |

---

## Quick Command Reference

```bash
# ── Deployment ──────────────────────────────────────────────
./deploy/deploy.sh                        # Full deploy

# ── Docker Compose (Production) ────────────────────────────
docker compose -f docker-compose.prod.yml up -d          # Start all
docker compose -f docker-compose.prod.yml down            # Stop all
docker compose -f docker-compose.prod.yml restart         # Restart all
docker compose -f docker-compose.prod.yml ps              # Status
docker compose -f docker-compose.prod.yml logs -f         # Live logs
docker compose -f docker-compose.prod.yml up -d --build   # Rebuild & restart

# ── Individual Services ────────────────────────────────────
docker compose -f docker-compose.prod.yml logs backend    # Backend logs
docker compose -f docker-compose.prod.yml restart caddy   # Restart Caddy
docker compose -f docker-compose.prod.yml exec backend sh # Shell into backend

# ── Cleanup ────────────────────────────────────────────────
docker system prune -a                    # Remove unused images
docker volume prune                       # Remove unused volumes
```
