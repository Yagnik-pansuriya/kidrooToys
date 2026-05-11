// ─── Pagination ───────────────────────────────────────────────
export const PRODUCTS_PER_PAGE = 10;

// ─── Generate a random Product Code ───────────────────────────
export const generateProductCode = () => {
  const num = Math.floor(10000 + Math.random() * 90000); // 5-digit
  return `KIDROO-TOY-${num}`;
};
// Legacy alias (safe to remove after full cache clear)
export const generateSku = generateProductCode;

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
  tags:               '',
  isActive:           true,
  youtubeUrl:         '',
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
};
