# Mercure hub — live admin alerts

Written for **Mercure 1.x** (tested with v1.1.5). 1.x is not compatible with 0.x
clients: tokens are RFC 9068 access tokens (`typ: at+jwt`, `iss`, `aud`,
`authorization_details`), subscribers use `?match=` instead of `?topic=`, and
the token must go in the `Authorization` header (never the URL). The admin panel
therefore reads the stream with `fetch()` (`frontend/src/utils/sseStream.js`)
instead of `EventSource`.

When a customer **places an order** or **adds to cart**, the backend publishes a
private update to a [Mercure](https://mercure.rocks) hub. Every open admin panel
is subscribed to the hub. It plays a sound, shows a toast and refreshes the
Orders / Carts lists.

```
Customer ──► Backend ──POST (publisher JWT)──► Mercure hub ──SSE──► Admin panel
                     ▲                                               │
                     └──── GET /api/admin/realtime/token ◄───────────┘
                           (subscriber JWT, 12h)
```

| Event       | Topic                              | Who receives       | When                                                   |
|-------------|------------------------------------|--------------------|--------------------------------------------------------|
| `new-order` | `https://kidroo.in/admin/orders`   | all admin roles    | COD order placed, or online payment verified           |
| `cart-add`  | `https://kidroo.in/admin/carts`    | `admin` role only  | a logged-in customer adds an item / raises a quantity  |

Guest carts live only in the browser, so the server never sees them and sends no alert.
Online orders alert only after payment succeeds, so an abandoned Razorpay checkout makes no sound.

## Production (VPS)

```bash
# 1. Install the hub binary (Linux x86_64 build from the GitHub releases page)
sudo mkdir -p /opt/mercure && cd /opt/mercure
sudo curl -fL -o mercure.tar.gz https://github.com/dunglas/mercure/releases/download/v1.1.5/mercure_Linux_x86_64.tar.gz
sudo tar xzf mercure.tar.gz mercure && sudo rm mercure.tar.gz
sudo cp /var/www/kidrooToys/deploy/mercure/Caddyfile /opt/mercure/Caddyfile

# 2. Keys (same values go into kidrooBackend/.env)
sudo tee /opt/mercure/.env >/dev/null <<ENV
SERVER_NAME=:3001
MERCURE_BIND=127.0.0.1
XDG_CONFIG_HOME=/opt/mercure/config
XDG_DATA_HOME=/opt/mercure/data
MERCURE_PUBLISHER_JWT_KEY=<publisher-secret>
MERCURE_SUBSCRIBER_JWT_KEY=<subscriber-secret>
ENV
sudo chown -R www-data:www-data /opt/mercure

# 3. Run it as a service
sudo cp /var/www/kidrooToys/deploy/mercure/mercure.service /etc/systemd/system/
sudo systemctl daemon-reload && sudo systemctl enable --now mercure
curl -s http://127.0.0.1:3001/healthz   # → 200
curl -s "http://127.0.0.1:3001/.well-known/mercure?match=x"   # → Unauthorized (correct: no token)

# 4. Nginx already proxies /.well-known/mercure → 127.0.0.1:3001 (deploy/nginx.conf)
sudo nginx -t && sudo systemctl reload nginx

# 5. Backend env (see .env.production.example), then: pm2 restart all
```

## Local development

```bash
docker run --rm -p 3001:3001 \
  -e SERVER_NAME=:3001 \
  -e MERCURE_PUBLISHER_JWT_KEY=dev-publisher-key-change-me-0123456789 \
  -e MERCURE_SUBSCRIBER_JWT_KEY=dev-subscriber-key-change-me-0123456789 \
  -e MERCURE_CORS_ORIGINS=http://localhost:5173 \
  -v "$PWD/deploy/mercure/Caddyfile:/etc/caddy/Caddyfile:ro" \
  dunglas/mercure
```

`kidrooBackend/.env`:

```
MERCURE_HUB_URL=http://localhost:3001/.well-known/mercure
MERCURE_PUBLISHER_JWT_KEY=dev-publisher-key-change-me-0123456789
MERCURE_SUBSCRIBER_JWT_KEY=dev-subscriber-key-change-me-0123456789
```

If the `MERCURE_*` vars are missing, the backend logs one warning and keeps
working. The admin bell turns grey ("Live alerts unavailable").

## Admin bell (top bar)

- 🟢 live · 🟡 reconnecting · ⚪ not configured
- Click to mute or unmute (the choice is saved per browser). Unmuting also asks for desktop-notification permission, so alerts still show while the tab is in the background.
- Browsers block audio until the page has been clicked once. The bell pulses until then.
