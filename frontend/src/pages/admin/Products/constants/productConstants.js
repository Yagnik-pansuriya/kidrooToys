// ─── Pagination ───────────────────────────────────────────────
export const PRODUCTS_PER_PAGE = 10;

// ─── Empty form state ─────────────────────────────────────────
export const emptyForm = {
  productName:        '',
  slug:               '',
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
  ageRangeFrom:       '',
  ageRangeTo:         '',
  tags:               '',
  isActive:           true,
  youtubeUrl:         '',
  hasVariants:        false,
  variants:           [],   // array of variant strings e.g. ['Red', 'Blue', 'XL']
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
};
