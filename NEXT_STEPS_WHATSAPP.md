# Next steps — WhatsApp messages (MSG91)

Checklist to switch on all WhatsApp messages. Do the steps in order.

What the site sends:

| Message | When | Template |
|---|---|---|
| Order confirmed | COD order placed / online payment done | `kidroo_order_confirmed_v2` |
| Order status | Admin changes order status | `kidroo_order_status_v2` |
| Offer alert | Admin → Offers → WhatsApp icon | `kidroo_offer_alert` |
| Cart reminder | Admin → Carts → Send WhatsApp | `kidroo_cart_reminder` |

- [x] Code for all 4 messages is written and pushed
- [ ] **Step 1** — Push the 2 small fixes
- [ ] **Step 2** — Get your MSG91 keys (auth key + WhatsApp number)
- [ ] **Step 3** — Create 4 templates in MSG91 and wait for approval
- [ ] **Step 4** — Put the keys in the server `.env` and deploy
- [ ] **Step 5** — Test with your own number
- [ ] **Step 6** — Before the first real offer send
- [ ] **Step 7** — Optional clean-up on the server

---

## Step 1 — Push the 2 small fixes

- Backend: `/api/whatsapp/test` was open to anyone (anyone could spend your MSG91 balance). Now admin-only.
- `.env.production.example`: added the missing `MSG91_WA_INTEGRATED_NUMBER` line.

```bash
cd /home/user/projects/projects/kidroo/kidrooBackend
git add src/routes/whatsappTestRoutes.ts
git commit -m "Make WhatsApp test route admin-only"
git push

cd /home/user/projects/projects/kidroo/kidrooToys
git add .env.production.example NEXT_STEPS_WHATSAPP.md
git commit -m "WhatsApp setup checklist and integrated number env"
git push
```

---

## Step 2 — Get your MSG91 keys

You need **2 values**. Write them down.

| Value | Where in MSG91 | Example |
|---|---|---|
| **Auth key** | Top-right profile → **Authkey** (create one if empty) | `4123xxxxxxxxxxxxxxxx` |
| **WhatsApp integrated number** | **WhatsApp** → **Numbers** (the number you connected) | `919876543210` (91 + 10 digits, no `+`, no spaces) |

Also check in MSG91 → WhatsApp → Numbers:

- [ ] Number status is **Connected / Active**
- [ ] Display name (**Kidroo**) is **Approved** by Meta
- [ ] Wallet / WhatsApp balance shows the money you added

If the Authkey has **IP whitelisting** turned on, add your server's IP there — otherwise every send fails with an IP error.

> No WhatsApp number connected yet? MSG91 → WhatsApp → **Add number** → follow the Meta (Facebook) sign-up. Use a number that is **not** active on the normal WhatsApp app.

---

## Step 3 — Create 4 templates in MSG91

**First delete the old templates:** MSG91 → **WhatsApp** → **Templates** → on `kidroo_order_confirmed`, `kidroo_order_status` and `kidroo_promo_blast` click **⋮** → **Delete**.
Meta blocks a deleted name for ~30 days, so the new order templates are named `..._v2` (the code already uses these names).

Then MSG91 → **WhatsApp** → **Templates** → **Create New Template**. Pick the **same number** (`918282939385`) each time.

Rules:
- Copy **names exactly**. Language **English** (code `en`; do not pick "English (US)").
- Body variables are `{{1}}`, `{{2}}`… in this order — the code fills them in this order.
- Submit → wait until all 4 show **Approved** (minutes to ~1 day).

### Template 1 — `kidroo_order_confirmed_v2`

| Field | Value |
|---|---|
| Category | **Utility** |
| Header | None |
| Footer | `Kidroo — toys for curious kids` |
| Button | **Visit website** → URL **Dynamic** → `https://kidroo.in/order-confirmation/{{1}}` — sample: `KDR-234521-4521` |

Body:

```
Hi {{1}}, thank you for your order at Kidroo! 🎉

Order ID: {{2}}
Total: {{3}}
Payment: {{4}}

We will message you when it ships.
```

Samples: `{{1}}` Asha · `{{2}}` KDR-234521-4521 · `{{3}}` ₹1,250.00 · `{{4}}` Cash on Delivery

### Template 2 — `kidroo_order_status_v2`

| Field | Value |
|---|---|
| Category | **Utility** |
| Header | None |
| Footer | `Kidroo — toys for curious kids` |
| Button | **Visit website** → URL **Dynamic** → `https://kidroo.in/order-confirmation/{{1}}` — sample: `KDR-234521-4521` |

Body:

```
Hi {{1}}, your Kidroo order {{2}} is now: *{{3}}*

Tap below to see your order.
```

Samples: `{{1}}` Asha · `{{2}}` KDR-234521-4521 · `{{3}}` Shipped

> Utility templates must be about the order only — no offers or discounts in the text, or Meta moves them to Marketing (costs more).

### Template 3 — `kidroo_offer_alert`

| Field | Value |
|---|---|
| Category | **Marketing** |
| Header | **Image** — upload any sample image (each send uses the offer's own image) |
| Footer | `Kidroo — toys for curious kids` |
| Button | **Visit website** → URL **Dynamic** → `https://kidroo.in/{{1}}` — sample: `offers` |

Body:

```
Hi {{1}}! 🎉 New offer at Kidroo:
*{{2}}*

{{3}}

Tap below to shop now.
```

Samples: `{{1}}` Asha · `{{2}}` Diwali Toy Fest — UP TO 40% OFF · `{{3}}` Puzzles, blocks and plush toys at festive prices. Valid till 5 Nov 2026.

### Template 4 — `kidroo_cart_reminder`

| Field | Value |
|---|---|
| Category | **Marketing** |
| Header | None |
| Footer | `Kidroo — toys for curious kids` |
| Button | **Visit website** → URL **Static** → `https://kidroo.in/cart` |

Body:

```
Hi {{1}}, {{2}}

Your cart is saved at Kidroo — tap below to complete your order.
```

Samples: `{{1}}` Asha · `{{2}}` you left Teddy Bear x1 in your cart worth ₹799. Complete your order today!

---

## Step 4 — Server `.env` and deploy

Can be done before the templates are approved (nothing breaks; sends just fail until approval).

```bash
ssh root@<your-server-ip>
nano /var/www/kidrooToys/kidrooBackend/.env
```

Make sure these lines exist **once** (if `MSG91_AUTH_KEY` is already there for SMS/OTP, keep that one — it is the same key):

```
MSG91_AUTH_KEY=<auth key from Step 2>
MSG91_WA_INTEGRATED_NUMBER=<number from Step 2, e.g. 919876543210>
```

Only if you used **different template names** in Step 3, also add:

```
MSG91_WA_TEMPLATE_ORDER_CONFIRMED=<name>
MSG91_WA_TEMPLATE_ORDER_STATUS=<name>
MSG91_WA_TEMPLATE_OFFER=<name>
MSG91_WA_TEMPLATE_CART_REMINDER=<name>
```

Save, then deploy (this also restarts the backend so it reads the new `.env`):

```bash
cd /var/www/kidrooToys && ./deploy/multi-deploy.sh
pm2 status            # kidroo-backend must be "online"
```

Quick checks (both should say *No token provided*, not *Route not found*):

```bash
curl -s https://kidroo.in/api/admin/whatsapp/carts/000000000000000000000000; echo
curl -s -X POST https://kidroo.in/api/whatsapp/test; echo
```

---

## Step 5 — Test with your own number (after all 4 templates are Approved)

Log in to **https://kidroo.in/admin** as an **admin** and hard-refresh (**Ctrl+Shift+R**).

### Order messages
1. On the website, log in as a customer that uses **your own mobile number**
2. Place a small **Cash on Delivery** order → you should get **Order confirmed** on WhatsApp
3. Admin → Orders → open that order → change status to **Shipped** → you should get **Order status**
4. Tap the button in both → it must open that order's page
5. Cancel the test order afterwards

### Offer message
1. **Admin → Offers & Coupons** → pick an offer that is **active**, **not expired** and **has an image**
2. Click the green **WhatsApp** icon → type **your own 10-digit number** → **Send test**
3. Check: image ✓ · text ✓ · button opens the right page ✓

### Cart message
1. With the same customer account, add a product to the cart
2. **Admin → Carts** → open that customer → **Send WhatsApp** → **Send WhatsApp**
3. Check it arrives and the button opens `kidroo.in/cart`

### If a send fails

```bash
pm2 logs kidroo-backend --lines 100 --nostream | grep -i msg91
```

| Log says | Fix |
|---|---|
| `credentials not configured` / `MSG91_AUTH_KEY not set` | Step 4 `.env` lines missing → add, then `pm2 restart kidroo-backend` |
| `template not found` / not approved | Name typo, or template still in review |
| `parameter` / `component` mismatch | Template differs from Step 3 (number of `{{ }}`, header not Image, button not Dynamic) |
| `IP` / `whitelist` | Add the server IP to the Authkey whitelist in MSG91 |
| `insufficient balance` | Recharge the MSG91 WhatsApp wallet |
| Nothing in logs at all | Customer has no mobile number saved, or backend wasn't restarted |

Delivery / read status: **MSG91 → WhatsApp → Reports** (the admin panel only shows "accepted by MSG91").

---

## Step 6 — Before the first real offer send

- [ ] **Cost:** every marketing message is charged. Check the rate in MSG91 × the customer count shown in the dialog.
- [ ] **Consent:** customers should have agreed to WhatsApp marketing. Many blocks/reports can get the number restricted — which would also stop order messages. Start with a small group (e.g. *Repeat buyers*) rather than *All customers*.
- [ ] **Frequency:** max 1–2 offers per week.
- [ ] **Don't edit approved templates** — an edit sends them back to review and sends fail until re-approved.

---

## Step 7 — Optional clean-up on the server

1. **Leftover backup file with secrets** — check, then delete:
   ```bash
   cat /var/www/kidrooToys/.env.save     # look first
   rm /var/www/kidrooToys/.env.save
   ```
2. **Duplicate keys in the backend `.env`** (`NODE_ENV`, `PORT`, `DB_URL`, `JWT_SECRET`, `CLOUDINARY_*`, `REDIS_URL` appear twice — the **last** one wins). Remove the older duplicate of each, keep the `MERCURE_*` lines at the bottom, then `pm2 restart kidroo-backend`.

---

## Possible next features (ask Claude)

- WhatsApp **opt-in checkbox** at customer signup, and send offers only to opted-in customers
- Stop the old "New WhatsApp Campaign" broadcast (`kidroo_promo_blast`) from showing **fake numbers** when MSG91 keys are missing
