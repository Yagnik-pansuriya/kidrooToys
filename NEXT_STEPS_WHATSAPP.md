# Next steps — WhatsApp offer alerts & cart messages

Checklist to finish the WhatsApp feature. Do the steps in order.

- [ ] **Step 1** — Push the code (on the computer that has the changes)
- [ ] **Step 2** — Create 2 templates in MSG91 and wait for approval
- [ ] **Step 3** — Deploy on the server
- [ ] **Step 4** — Test with your own number
- [ ] **Step 5** — Before the first real offer send
- [ ] **Step 6** — Optional clean-up on the server

---

## Step 1 — Push the code

Run on the computer where the code was changed (not needed on the other device):

```bash
cd /home/user/kidroo/kidrooBackend
git add -A src
git commit -m "WhatsApp offer alerts and cart reminders via MSG91"
git push

cd /home/user/kidroo/kidrooToys
git add -A frontend/src deploy/WHATSAPP_TEMPLATES.md .env.production.example NEXT_STEPS_WHATSAPP.md
git commit -m "Admin WhatsApp send for offers and carts"
git push
```

Check both pushes say `main -> main` with no error.

---

## Step 2 — Create 2 templates in MSG91

WhatsApp only allows business-started messages through **templates approved by Meta**.

1. Log in to **MSG91** → **WhatsApp** → **Templates** → **Create template**
2. Choose the **same WhatsApp number** you already use for order messages
3. Create both templates below **exactly** (names, category, header, body, button)
4. Submit → wait until both show **Approved** (a few minutes to ~1 day)

> Copy names exactly: `kidroo_offer_alert` and `kidroo_cart_reminder`.
> If you use other names, you must add them to the server `.env` (see the note at the end of this step).

### Template A — `kidroo_offer_alert` (for the offer "Send on WhatsApp" button)

| Field | Value |
|---|---|
| Name | `kidroo_offer_alert` |
| Category | **Marketing** |
| Language | **English** |
| Header | **Image** — upload any sample image (each send uses the offer's own image) |
| Footer | `Kidroo — toys for curious kids` |
| Button | **Visit website** → URL type **Dynamic** → `https://kidroo.in/{{1}}` — sample value: `offers` |

Body (copy exactly, including the empty lines):

```
Hi {{1}}! 🎉 New offer at Kidroo:
*{{2}}*

{{3}}

Tap below to shop now.
```

Sample values MSG91 asks for:

| Variable | Sample |
|---|---|
| `{{1}}` | `Asha` |
| `{{2}}` | `Diwali Toy Fest — UP TO 40% OFF` |
| `{{3}}` | `Puzzles, blocks and plush toys at festive prices. Valid till 5 Nov 2026.` |

### Template B — `kidroo_cart_reminder` (for the cart "Send WhatsApp" button)

| Field | Value |
|---|---|
| Name | `kidroo_cart_reminder` |
| Category | **Marketing** |
| Language | **English** |
| Header | **None** |
| Footer | `Kidroo — toys for curious kids` |
| Button | **Visit website** → URL type **Static** → `https://kidroo.in/cart` |

Body (copy exactly):

```
Hi {{1}}, {{2}}

Your cart is saved at Kidroo — tap below to complete your order.
```

Sample values:

| Variable | Sample |
|---|---|
| `{{1}}` | `Asha` |
| `{{2}}` | `you left Teddy Bear x1 in your cart worth ₹799. Complete your order today!` |

### Only if you used different template names

On the server, add to `/var/www/kidrooToys/kidrooBackend/.env`, then `pm2 restart kidroo-backend`:

```
MSG91_WA_TEMPLATE_OFFER=<your offer template name>
MSG91_WA_TEMPLATE_CART_REMINDER=<your cart template name>
```

---

## Step 3 — Deploy on the server

Can be done before the templates are approved (nothing breaks; sends just fail until approval).

```bash
ssh root@<your-server-ip>
cd /var/www/kidrooToys && ./deploy/multi-deploy.sh
```

Check the end says **Deployment complete** and `pm2 status` shows `kidroo-backend` **online**.

Quick check the new API exists (should say *No token provided*, not *Route not found*):

```bash
curl -s https://kidroo.in/api/admin/whatsapp/carts/000000000000000000000000; echo
```

---

## Step 4 — Test with your own number (after both templates are Approved)

Log in to **https://kidroo.in/admin** as an **admin** and hard-refresh (**Ctrl+Shift+R**).

### Offer test
1. **Admin → Offers & Coupons** → pick an offer that is **active**, **not expired** and **has an image**
2. Click the green **WhatsApp** icon in its row
3. Type **your own 10-digit number** → **Send test**
4. On your phone, check: image ✓ · text ✓ · "Visit website" button opens the right page ✓

### Cart test
1. On the website, log in as a **customer account that uses your own mobile number** and add a product to the cart
2. **Admin → Carts** → open that customer → **Send WhatsApp**
3. Edit the message if you like → **Send WhatsApp**
4. Check it arrives and the button opens `kidroo.in/cart`

### If a send fails

On the server:

```bash
pm2 logs kidroo-backend --lines 80 --nostream | grep -i msg91
```

Common causes:

| Error mentions | Fix |
|---|---|
| template not found / not approved | Name typo, or template still in review |
| parameter / component mismatch | Template structure differs (e.g. header not set to Image, button not Dynamic) — compare with Step 2 |
| `MSG91_AUTH_KEY` / not configured | MSG91 keys missing in the backend `.env` |

---

## Step 5 — Before the first real offer send

- [ ] **Cost:** every marketing message is charged (Meta rate via MSG91). Check the rate in MSG91 × the customer count shown in the dialog.
- [ ] **Consent:** customers should have agreed to WhatsApp marketing. Many blocks/reports can get the number restricted — which would also stop order messages. Start with a small group (e.g. *Repeat buyers*) rather than *All customers*.
- [ ] **Frequency:** don't send offers too often (e.g. max 1–2 per week).
- [ ] **Numbers:** the admin shows *accepted* by MSG91. Real delivered/read numbers → **MSG91 → WhatsApp → Reports**.
- [ ] **Don't edit approved templates** in MSG91 — an edit sends them back to review and sends fail until re-approved.

---

## Step 6 — Optional clean-up on the server

Found during the Mercure deploy; not urgent.

1. **Leftover backup file with secrets** — check, then delete:
   ```bash
   cat /var/www/kidrooToys/.env.save     # look first
   rm /var/www/kidrooToys/.env.save
   ```
2. **Duplicate keys in the backend `.env`** (`NODE_ENV`, `PORT`, `DB_URL`, `JWT_SECRET`, `CLOUDINARY_*`, `REDIS_URL` appear twice — the **last** one wins). Open it and remove the older duplicate of each:
   ```bash
   nano /var/www/kidrooToys/kidrooBackend/.env
   pm2 restart kidroo-backend
   ```
   Keep the `MERCURE_*` lines at the bottom.

---

## Possible next features (ask Claude)

- WhatsApp **opt-in checkbox** at customer signup, and send offers only to opted-in customers
- Stop the old "New WhatsApp Campaign" broadcast from showing **fake numbers** when MSG91 keys are missing
