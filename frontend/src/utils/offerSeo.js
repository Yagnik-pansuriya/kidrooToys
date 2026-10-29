  /**
 * Builds the /offers page SEO (title, description, image, JSON-LD) from the
 * offers and public coupons that are live right now.
 *
 * Mirrors buildOfferSeo() in kidrooBackend/src/routes/seoRenderRoutes.ts —
 * the server-rendered tags and these must match, so change both together.
 */
const SITE_URL = 'https://kidroo.in';

export const OFFERS_FALLBACK_TITLE = 'Toy Offers & Deals - Discounts on Kids Toys | Kidroo Toys';
export const OFFERS_FALLBACK_DESCRIPTION = "Today's best deals on kids toys at Kidroo - discounts on baby rattle sets, puzzles, board games and gifts. Limited-time toy offers in India.";

const plain = (text) => String(text || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

const truncate = (text, max) => {
  const clean = plain(text);
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max - 1);
  const lastSpace = cut.lastIndexOf(' ');
  return `${(lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).replace(/[\s,;:|-]+$/, '')}…`;
};

const shortDate = (value) =>
  new Date(value).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', timeZone: 'Asia/Kolkata' });

const absoluteUrl = (url) => {
  if (!url) return `${SITE_URL}/offers`;
  if (/^https?:\/\//i.test(url)) return url;
  return `${SITE_URL}${url.startsWith('/') ? '' : '/'}${url}`;
};

const offerImage = (offer) => {
  const first = offer?.images?.[0];
  return typeof first === 'string' ? first : first?.url;
};

const couponLabel = (c) =>
  c.discountType === 'percentage' ? `${c.discountValue}% off` : `₹${c.discountValue} off`;

export const buildOfferSeo = (offers = [], coupons = []) => {
  const headline = offers[0];
  const coupon = coupons[0];

  if (!headline && !coupon) {
    return { title: OFFERS_FALLBACK_TITLE, description: OFFERS_FALLBACK_DESCRIPTION, image: undefined, catalog: null };
  }

  const lead = headline ? plain(headline.title) : `Coupon ${coupon.code}: ${couponLabel(coupon)}`;
  const title = `${truncate(`${lead} - Toy Offers & Deals`, 55)} | Kidroo Toys`;

  const parts = [];
  if (headline) {
    parts.push(`${plain(headline.title)}${headline.subtitle ? ` - ${plain(headline.subtitle)}` : ''}.`);
    if (offers.length > 1) parts.push(`Plus ${offers.length - 1} more deal${offers.length > 2 ? 's' : ''}.`);
  }
  if (coupon) {
    parts.push(`Use code ${coupon.code} for ${couponLabel(coupon)}${coupon.minOrderAmount > 0 ? ` on orders over ₹${coupon.minOrderAmount}` : ''}.`);
  }
  const endsAt = headline?.validity?.to || coupon?.validTo;
  if (endsAt) parts.push(`Valid till ${shortDate(endsAt)}.`);
  parts.push('Shop kids toys at Kidroo.');
  const description = truncate(parts.join(' '), 160);

  const catalog = {
    '@type': 'OfferCatalog',
    '@id': `${SITE_URL}/offers#catalog`,
    name: 'Kidroo Toys Offers & Deals',
    url: `${SITE_URL}/offers`,
    itemListElement: [
      ...offers.map((o) => ({
        '@type': 'Offer',
        name: plain(o.title),
        ...(o.subtitle || o.description ? { description: truncate(o.description || o.subtitle, 300) } : {}),
        url: absoluteUrl(o.targetUrl),
        ...(offerImage(o) ? { image: offerImage(o) } : {}),
        ...(o.validity?.from ? { validFrom: new Date(o.validity.from).toISOString() } : {}),
        ...(o.validity?.to ? { validThrough: new Date(o.validity.to).toISOString() } : {}),
        offeredBy: { '@id': `${SITE_URL}/#organization` },
      })),
      ...coupons.map((c) => ({
        '@type': 'Offer',
        name: `${couponLabel(c)} with coupon ${c.code}`,
        ...(c.description ? { description: truncate(c.description, 300) } : {}),
        category: 'Coupon',
        url: `${SITE_URL}/offers`,
        ...(c.validFrom ? { validFrom: new Date(c.validFrom).toISOString() } : {}),
        ...(c.validTo ? { validThrough: new Date(c.validTo).toISOString() } : {}),
        ...(c.minOrderAmount > 0
          ? { eligibleTransactionVolume: { '@type': 'PriceSpecification', minPrice: c.minOrderAmount, priceCurrency: 'INR' } }
          : {}),
        offeredBy: { '@id': `${SITE_URL}/#organization` },
      })),
    ],
  };

  return { title, description, image: headline ? offerImage(headline) : undefined, catalog };
};
