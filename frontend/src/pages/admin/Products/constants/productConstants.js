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
  category:           '',
  ratings:            '',
  numReviews:         '',
  featured:           false,
  newArrival:         false,
  bestSeller:         false,
  ageRangeFrom:       '',
  ageRangeTo:         '',
  tags:               '',
  isActive:           true,
  images:             [],   // File objects for new uploads
  previewUrls:        [],   // Blob / remote URLs for preview
};
