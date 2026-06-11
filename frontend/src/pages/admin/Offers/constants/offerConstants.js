export const displayTypes = [
  { value: 'single-banner', label: '🖼️ Single Image Banner', desc: 'One full-width promotional image' },
  { value: 'slider', label: '🎠 Image Slider / Carousel', desc: 'Multiple images that auto-scroll' },
];

export const pageTargets = [
  { value: 'home', label: '🏠 Home Page' },
  { value: 'shop', label: '🛍️ Shop Page' },
  { value: 'product', label: '📦 Product Page' },
  { value: 'offers', label: '🏷️ Offers Page' },
  { value: 'custom', label: '⚙️ Custom Section' },
];

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
    { value: 'hero', label: '🔝 Hero Banner', desc: 'Main hero at the top of offers page' },
    { value: 'featured', label: '⭐ Featured Section', desc: 'Highlighted promotional area' },
    { value: 'grid', label: '📐 Offers Grid', desc: 'Part of the main offers grid' },
  ],
  custom: [
    { value: 'custom-1', label: '⚙️ Custom Section 1', desc: 'Custom placement area 1' },
    { value: 'custom-2', label: '⚙️ Custom Section 2', desc: 'Custom placement area 2' },
  ],
};

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
  displayType: 'single-banner',
  page: 'home',
  section: 'hero',
  position: 1,
  images: [],
  existingImages: [],
  imageAltTexts: [],
  imageLinks: [],
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
