# 📋 KidrooToys — Production Commands Quick Reference

This guide contains the exact commands to manage your production VPS server. It details **what** the command is, **when** to run it, and **why** it is used.

---

## 🚀 1. Deploying Code Updates

| Command | When to Use | Why (Production Context) |
| :--- | :--- | :--- |
| **`cd /var/www/kidrooToys`**<br>**`./deploy/multi-deploy.sh`** | Run this after you push any new code, bug fixes, frontend changes, or backend changes to either repository. | Automatically configures Git safe directories, pulls updates from both repos, cleans up PM2 conflicts, builds the React frontend, builds/compiles TypeScript backend, reloads Nginx, and restarts PM2. |
| **`chmod +x deploy/multi-deploy.sh`** | Run if you get a `Permission denied` error when trying to run the multi-deploy script. | Grants execute permissions to the script. |

---

## ⚡ 2. PM2 (Backend Process Manager)

| Command | When to Use | Why (Production Context) |
| :--- | :--- | :--- |
| **`pm2 status`** | Run when you want to check if the Node/Express backend is running. | Shows a table of active processes, their uptime, memory usage, CPU load, and restart counts. Check if status says `online` or `errored`. |
| **`pm2 logs kidroo-backend`** | Run if the frontend loads but APIs fail (or if Nginx returns a `502 Bad Gateway` error). | Displays live terminal logs (including active database connections, API requests, and crash stack traces) to debug why the backend is failing. |
| **`pm2 restart kidroo-backend`** | Run after modifying backend environment variables in `kidrooBackend/.env`. | Gracefully stops the backend process and restarts it, forcing it to load the latest configuration. |
| **`pm2 delete <name>`** | Run when you see duplicate or conflicting processes (e.g., `kidroo-api` and `kidroo-backend` both active). | Cleans up the PM2 process list. You must delete duplicate backend processes to prevent port conflicts (EADDRINUSE: port 5000 already in use). |

---

## 🌐 3. Nginx (Web Server & Reverse Proxy)

| Command | When to Use | Why (Production Context) |
| :--- | :--- | :--- |
| **`sudo nginx -t`** | Run **before** reloading or restarting Nginx. | Tests Nginx configuration files for syntax errors. Running this prevents you from accidentally taking down the web server with a broken config. |
| **`sudo systemctl reload nginx`** | Run after manually editing Nginx configuration files. | Gracefully applies configuration changes without terminating active user connections (zero-downtime reload). |
| **`sudo systemctl status nginx`** | Run if you get a `Connection Timed Out` or `Connection Refused` error. | Verifies whether the Nginx system service daemon is actually running on the VPS. |
| **`sudo systemctl restart nginx`** | Run only if Nginx hangs or if a simple reload fails to apply changes. | Shuts down Nginx completely and starts it fresh. |

---

## 🔒 4. SSL Certificates (Certbot)

| Command | When to Use | Why (Production Context) |
| :--- | :--- | :--- |
| **`sudo certbot --nginx -d kidroo.in -d www.kidroo.in`** | Run if SSL certificates expire, or if you accidentally overwrite the Nginx configuration (removing HTTPS support). | Automatically requests Let's Encrypt SSL certificates, installs them, opens port `443` (HTTPS) in Nginx, and redirects all HTTP traffic to HTTPS. |
| **`sudo certbot renew --dry-run`** | Run once after initial setup to test certificate renewal. | Simulates the automatic 90-day SSL renewal process to ensure your site won't face certificate expiration downtime. |

---

## 💾 5. Databases & Services (Systemd)

| Command | When to Use | Why (Production Context) |
| :--- | :--- | :--- |
| **`sudo systemctl status mongod`** | Run if the backend cannot connect to the database (throws Mongoose connection errors in logs). | Checks the operational status of the MongoDB database service. |
| **`sudo systemctl restart mongod`** | Run if MongoDB hangs or fails to respond. | Restarts the MongoDB database server. |
| **`sudo systemctl status redis-server`** | Run if cache-dependent backend functions (like OTP verification or session caching) fail. | Checks the status of the Redis caching server. |

---

## 🛡️ 6. Firewall & Security (UFW)

| Command | When to Use | Why (Production Context) |
| :--- | :--- | :--- |
| **`sudo ufw status`** | Run if your VPS is completely unreachable (e.g. `ERR_CONNECTION_TIMED_OUT`). | Shows which ports are open. Ensure that `Nginx Full` (ports 80 & 443) and `22/tcp` (SSH) are allowed. |
| **`sudo systemctl status fail2ban`** | Run to check server security status. | Monitors the brute-force protection service that automatically bans IPs attempting too many failed SSH login attempts. |
