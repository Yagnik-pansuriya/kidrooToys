# 🚀 KidrooToys — Hostinger VPS Deployment Plan

> **Goal:** Deploy KidrooToys on Hostinger VPS with Nginx, PM2, self-hosted MongoDB & Redis (No Docker, No Caddy)

---

## Which Hostinger Plan to Buy?

### ✅ Buy: **KVM 1** — ₹599/month

Go to: [hostinger.com/in/vps-hosting](https://www.hostinger.in/vps-hosting) → **KVM 1**

| Plan | RAM | vCPU | Storage | Price | Verdict |
|------|-----|------|---------|-------|---------|
| **KVM 1** | **4 GB** | **1** | **50 GB** | **₹599/mo** | **✅ BUY THIS** |
| KVM 2 | 8 GB | 2 | 100 GB | ₹779/mo | Upgrade later if needed |

### RAM Breakdown (No Docker = Low Usage)

| Service | RAM Usage |
|---------|----------|
| MongoDB | ~1.5 GB |
| Node.js (PM2) | ~200-400 MB |
| Nginx | ~30-50 MB |
| Redis | ~50-150 MB |
| OS | ~300-500 MB |
| **Total** | **~2.2-2.6 GB** |

**4 GB is plenty!** You have ~1.5 GB headroom.

---

## Total Monthly Cost

| Item | Cost |
|------|------|
| Hostinger VPS KVM 1 | ₹599/mo |
| MongoDB | ₹0 (self-hosted) |
| Redis | ₹0 (self-hosted) |
| SSL | ₹0 (Let's Encrypt via Certbot) |
| Cloudinary | ₹0 (free tier) |
| Brevo SMTP | ₹0 (free: 300 emails/day) |
| **Total** | **~₹599/mo** |

---

## Production Architecture

```
Internet → Nginx (80/443) → React static files (/)
                           → Node.js API (/api/*) ← MongoDB + Redis
```

- **Nginx:** serves frontend + reverse proxy to backend + SSL
- **Certbot:** free auto-renewing SSL certificates
- **PM2:** keeps Node.js running, auto-restarts on crash
- **MongoDB & Redis:** native systemd services

---

## Step-by-Step Summary

| Step | What | Time |
|------|------|------|
| 1 | Buy VPS + SSH in | 15 min |
| 2 | Point DNS (A records) | 5 min + wait |
| 3 | Run `setup-server.sh` | 10 min |
| 4 | Configure MongoDB | 10 min |
| 5 | Set `.env` + Nginx config | 10 min |
| 6 | Run `deploy.sh` | 5 min |
| 7 | Run `certbot` for SSL | 2 min |
| 8 | Verify everything | 10 min |
| **Total** | | **~1 hour** |

👉 **See [DEPLOYMENT.md](./DEPLOYMENT.md) for the full step-by-step guide.**
