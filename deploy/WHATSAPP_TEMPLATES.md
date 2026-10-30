# WhatsApp templates (MSG91) — offer alerts & cart messages

WhatsApp only lets a business start a conversation with a **Meta-approved
template**. The admin panel fills in the variables (`{{1}}`, `{{2}}` …); the
fixed text around them must be approved first. Create these two in
**MSG91 → WhatsApp → Templates → Create template**, on the same integrated
number used for order messages.

Names must match exactly (or override with the env vars in `.env.production.example`).

---

## 1. `kidroo_offer_alert` — "Send on WhatsApp" button on an offer

| Field | Value |
|---|---|
| Category | **Marketing** |
| Language | **English** (`en`) |
| Header | **Image** (upload any sample image for approval — each send uses the offer's first image) |
| Footer | `Kidroo — toys for curious kids` |
| Button | **Visit website** → URL type **Dynamic** → `https://kidroo.in/{{1}}` (sample: `offers`) |

Body:

```
Hi {{1}}! 🎉 New offer at Kidroo:
*{{2}}*

{{3}}

Tap below to shop now.
```

Samples for approval: `{{1}}` = `Asha`, `{{2}}` = `Diwali Toy Fest — UP TO 40% OFF`,
`{{3}}` = `Puzzles, blocks and plush toys at festive prices. Valid till 5 Nov 2026.`

What the backend sends:

| Variable | Filled with |
|---|---|
| Header image | offer's first image |
| `{{1}}` | customer's full name |
| `{{2}}` | offer title + badge text |
| `{{3}}` | subtitle + description + "Valid till <end date>." |
| Button `{{1}}` | offer's **Target URL** path (e.g. `shop?category=puzzles`), `offers` if empty/external, plus `utm_source=whatsapp` |

## 2. `kidroo_cart_reminder` — "Send WhatsApp" button on a customer's cart

| Field | Value |
|---|---|
| Category | **Marketing** |
| Language | **English** (`en`) |
| Header | none |
| Footer | `Kidroo — toys for curious kids` |
| Button | **Visit website** → URL type **Static** → `https://kidroo.in/cart` |

Body:

```
Hi {{1}}, {{2}}

Your cart is saved at Kidroo — tap below to complete your order.
```

Samples: `{{1}}` = `Asha`, `{{2}}` = `you left Teddy Bear x1 in your cart worth ₹799. Complete your order today!`

`{{1}}` = customer's first name, `{{2}}` = the message the admin writes (pre-filled with the cart products).

---

## Rules worth knowing

- **Variables can't contain line breaks** — the backend turns them into ` · `.
- **Marketing messages cost money per message** (Meta's marketing rate for India, billed through MSG91). Check the cost before sending an offer to everyone.
- **Opt-in:** Meta requires that customers agreed to receive WhatsApp marketing. Too many "block / report" taps lowers the number's quality rating and can get it restricted. Send offers that are relevant, not too often.
- Meta may silently skip marketing messages to users who received many marketing messages recently ("frequency capping"); MSG91 still shows them as accepted.
- "Accepted" in the admin = MSG91 took the request. Actual delivery/read status is in **MSG91 → WhatsApp → Reports**.
- If you edit a template after approval, it goes back to review and sends fail until it's approved again.
