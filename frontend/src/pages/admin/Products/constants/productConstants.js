// ─── Pagination ───────────────────────────────────────────────
export const PRODUCTS_PER_PAGE = 10;

// ─── Image limit ──────────────────────────────────────────────
export const MAX_IMAGES = 10;

// ─── Generate a random Product Code ───────────────────────────
export const generateProductCode = () => {
  const num = Math.floor(10000 + Math.random() * 90000); // 5-digit
  return `KIDROO-TOY-${num}`;
};
// Legacy alias (safe to remove after full cache clear)
export const generateSku = generateProductCode;

// ─── Generate a random SKU Code ───────────────────────────────
export const generateSkuCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const seg1 = Array.from({ length: 5 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  const seg2 = Array.from({ length: 2 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  return `SKU-${seg1}-${seg2}`;
};

// ─── Empty form state ─────────────────────────────────────────
export const emptyForm = {
  productName:        '',
  slug:               '',
  productCode:          '',
  description:        '',
  price:              '',
  originalPrice:      '',
  discountPercentage: '',
  stock:              '',
  categories:         [],   // array of category IDs (multi-select)
  ratings:            '',
  numReviews:         '',
  featured:           false,
  newArrival:         false,
  bestSeller:         false,
  ageRange:           [],
  tags:               [],
  isActive:           true,
  youtubeUrl:         '',
  youtubeUrl2:        '',
  skuCode:            '',
  images:             [],   // File objects for new uploads
  previewUrls:        [],   // Blob / remote URLs for preview
  // ── Warranty / Guarantee fields ──
  hasWarranty:        false,
  warrantyPeriod:     '',
  warrantyType:       'manufacturer',
  hasGuarantee:       false,
  guaranteePeriod:    '',
  guaranteeTerms:     '',
  // ── Skills ──
  skills:             [],   // array of skill IDs (multi-select)
  // ── SEO ──
  seoKeywords:        '',   // comma-separated SEO keywords
  seoTitle:           '',   // custom SEO meta title
  seoDescription:     '',   // custom SEO meta description
  // ── Product Specifications ──
  specifications:     [],   // array of { key: '', value: '' }
};
