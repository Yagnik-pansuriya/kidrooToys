export const displayTypes = [
  { value: 'single-banner', label: 'Single Image Banner', icon: '🖼️', desc: 'One promotional image with your text' },
  { value: 'slider', label: 'Image Slider', icon: '🎠', desc: 'Several images that cross-fade automatically' },
];

// Only pages that actually render offer slots on the storefront
export const pageTargets = [
  { value: 'home', label: '🏠 Home Page' },
  { value: 'shop', label: '🛍️ Shop Page' },
  { value: 'product', label: '📦 Product Page' },
  { value: 'offers', label: '🏷️ Offers Page' },
];

export const displayTypeLabel = (v) => displayTypes.find((t) => t.value === v)?.label || v || 'Banner';
export const pageLabel = (v) => pageTargets.find((p) => p.value === v)?.label || (v === 'custom' ? '⚙️ Custom (not shown)' : v);
export const sectionLabel = (page, section) =>
  (sectionPresets[page] || []).find((s) => s.value === section)?.label || section || 'main';

/** live | scheduled | expired | inactive — mirrors what the storefront will actually show */
export const getOfferStatus = (offer, now = Date.now()) => {
  const to = offer?.validity?.to ? new Date(offer.validity.to).getTime() : null;
  const from = offer?.validity?.from ? new Date(offer.validity.from).getTime() : null;
  if (to && to < now) return 'expired';
  if (!offer?.isActive) return 'inactive';
  if (from && from > now) return 'scheduled';
  return 'live';
};

export const statusMeta = {
  live: { label: 'Live', className: 'badge-active' },
  scheduled: { label: 'Scheduled', className: 'badge-scheduled' },
  expired: { label: 'Expired', className: 'badge-expired' },
  inactive: { label: 'Paused', className: 'badge-inactive' },
};

// <input type="datetime-local"> value for a date, in the browser's local time
export const toLocalInput = (date) => {
  const d = date ? new Date(date) : new Date();
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export const sectionPresets = {
  home: [
    { value: 'hero', label: '🔝 Hero / Top Section', desc: 'Large banner at the very top of the page' },
    { value: 'below-hero', label: '⬇️ Below Hero', desc: 'Promotional strip below the hero section' },
    { value: 'between-categories', label: '📂 Between Categories & Products', desc: 'Offer shown between category and product sections' },
    { value: 'before-footer', label: '🔚 Before Footer', desc: 'Promotional section near the bottom' },
    { value: 'top-strip', label: '📢 Top Announcement Strip', desc: 'Slim bar at the very top for announcements' },
  ],
  shop: [
    { value: 'top-banner', label: '🔝 Top Banner', desc: 'Banner at the top of shop page' },
    { value: 'sidebar', label: '📌 Sidebar', desc: 'Side promotional area' },
    { value: 'between-products', label: '🛒 Between Products', desc: 'Between product grid rows' },
  ],
  product: [
    { value: 'below-gallery', label: '📸 Below Product Gallery', desc: 'Under the product images' },
    { value: 'related-section', label: '🔗 Related Products Area', desc: 'Near the related products section' },
  ],
  offers: [
    { value: 'hero', label: '🔝 Hero Carousel', desc: 'Big rotating banner at the top of /offers' },
    { value: 'featured', label: '⭐ Featured', desc: 'Also shown in the hero carousel, after Hero offers' },
    { value: 'grid', label: '📐 Deals Grid', desc: 'Card in the "All Deals" grid' },
  ],
};

// Every live offer also appears in the /offers page grid, whatever page it targets
export const OFFERS_PAGE_NOTE = 'Every live offer is also listed on the /offers page.';

export const positionOptions = [
  { value: 1, label: '1st — First / Top Priority' },
  { value: 2, label: '2nd — Second' },
  { value: 3, label: '3rd — Third' },
  { value: 4, label: '4th — Fourth' },
  { value: 5, label: '5th — Fifth' },
  { value: 6, label: '6th — Sixth' },
  { value: 7, label: '7th — Seventh' },
  { value: 8, label: '8th — Eighth' },
  { value: 9, label: '9th — Ninth' },
  { value: 10, label: '10th — Tenth / Low Priority' },
];

export const initialOfferForm = {
  title: '',
  subtitle: '',
  description: '',
  badgeText: '',
  ctaText: '',
  displayType: 'single-banner',
  page: 'home',
  section: 'hero',
  position: 1,
  existingImages: [], // [{ url, altText, link }] already uploaded
  newImages: [],      // [{ file, preview, altText, link }] to upload
  bgColor: '#FF6B35',
  textColor: '#FFFFFF',
  overlayOpacity: 0,
  targetUrl: '',
  validFrom: '',
  validTo: '',
  isActive: true,
};

export const initialCouponForm = {
  code: '',
  description: '',
  discountType: 'percentage',
  discountValue: '',
  minOrderAmount: '',
  maxDiscount: '',
  minQuantity: '',
  isSpecificProduct: false,
  applicableProducts: [],
  validFrom: '',
  validTo: '',
  usageLimit: 100,
  perUserLimit: 1,
  isActive: true,
  visibility: 'public',
};
