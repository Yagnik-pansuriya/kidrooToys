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

/**
 * validateProductForm
 * Performs frontend validation matching backend and product rules.
 * Returns an object containing error messages keyed by field name.
 */
export const validateProductForm = (form) => {
  const errors = {};

  // 1. Product Name
  if (!form.productName || !form.productName.trim()) {
    errors.productName = 'Product name is required';
  } else if (form.productName.trim().length < 2) {
    errors.productName = 'Product name must be at least 2 characters';
  }

  // 2. Slug
  if (!form.slug || !form.slug.trim()) {
    errors.slug = 'Slug is required';
  }

  // 3. Product Code
  if (!form.productCode || !form.productCode.trim()) {
    errors.productCode = 'Product code is required';
  }

  // 4. Description (check text content excluding HTML tags)
  const cleanDescription = (form.description || '').replace(/<[^>]*>/g, '').trim();
  if (!cleanDescription) {
    errors.description = 'Product description is required';
  }

  // 5. Price
  const priceNum = Number(form.price);
  if (form.price === '' || form.price === null || form.price === undefined || isNaN(priceNum)) {
    errors.price = 'Price is required';
  } else if (priceNum < 0) {
    errors.price = 'Price cannot be negative';
  }

  // 6. Original Price
  const origPriceNum = Number(form.originalPrice);
  if (form.originalPrice === '' || form.originalPrice === null || form.originalPrice === undefined || isNaN(origPriceNum)) {
    errors.originalPrice = 'Original price is required';
  } else if (origPriceNum < 0) {
    errors.originalPrice = 'Original price cannot be negative';
  } else if (!isNaN(priceNum) && origPriceNum > 0 && priceNum > origPriceNum) {
    errors.price = 'Sale price cannot be greater than original price';
  }

  // 7. Discount %
  if (form.discountPercentage !== '' && form.discountPercentage !== null && form.discountPercentage !== undefined) {
    const discNum = Number(form.discountPercentage);
    if (isNaN(discNum) || discNum < 0 || discNum > 100) {
      errors.discountPercentage = 'Discount must be between 0% and 100%';
    }
  }

  // 8. Stock
  const stockNum = Number(form.stock);
  if (form.stock === '' || form.stock === null || form.stock === undefined || isNaN(stockNum)) {
    errors.stock = 'Stock quantity is required';
  } else if (stockNum < 0) {
    errors.stock = 'Stock cannot be negative';
  } else if (!Number.isInteger(stockNum)) {
    errors.stock = 'Stock must be a whole number';
  }

  // 9. Ratings
  if (form.ratings !== '' && form.ratings !== null && form.ratings !== undefined) {
    const ratNum = Number(form.ratings);
    if (isNaN(ratNum) || ratNum < 0 || ratNum > 5) {
      errors.ratings = 'Rating must be between 0 and 5';
    }
  }

  // 10. Num Reviews
  if (form.numReviews !== '' && form.numReviews !== null && form.numReviews !== undefined) {
    const revNum = Number(form.numReviews);
    if (isNaN(revNum) || revNum < 0) {
      errors.numReviews = 'Number of reviews cannot be negative';
    }
  }

  // 11. Categories
  if (!Array.isArray(form.categories) || form.categories.length === 0) {
    errors.categories = 'At least one category must be selected';
  }

  // 12. Age Range
  if (!Array.isArray(form.ageRange) || form.ageRange.length === 0) {
    errors.ageRange = 'At least one age range must be selected';
  }

  // 13. Bullet points (tags)
  const validTags = Array.isArray(form.tags) ? form.tags.filter((t) => typeof t === 'string' && t.trim()) : [];
  if (validTags.length === 0) {
    errors.tags = 'At least one bullet point feature is required';
  }

  // 14. Images
  if (!Array.isArray(form.previewUrls) || form.previewUrls.length === 0) {
    errors.images = 'At least one product image is required';
  }

  // 15. YouTube URLs
  const urlRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/i;
  if (form.youtubeUrl && form.youtubeUrl.trim() && !urlRegex.test(form.youtubeUrl.trim())) {
    errors.youtubeUrl = 'Please enter a valid YouTube URL';
  }
  if (form.youtubeUrl2 && form.youtubeUrl2.trim() && !urlRegex.test(form.youtubeUrl2.trim())) {
    errors.youtubeUrl2 = 'Please enter a valid YouTube URL';
  }

  // 16. Warranty
  if (form.hasWarranty) {
    const wPeriod = Number(form.warrantyPeriod);
    if (form.warrantyPeriod === '' || form.warrantyPeriod === null || isNaN(wPeriod) || wPeriod <= 0) {
      errors.warrantyPeriod = 'Warranty period must be greater than 0 months';
    }
    if (!form.warrantyType) {
      errors.warrantyType = 'Please select a warranty type';
    }
  }

  // 17. Guarantee
  if (form.hasGuarantee) {
    const gPeriod = Number(form.guaranteePeriod);
    if (form.guaranteePeriod === '' || form.guaranteePeriod === null || isNaN(gPeriod) || gPeriod <= 0) {
      errors.guaranteePeriod = 'Guarantee period must be greater than 0 months';
    }
    if (!form.guaranteeTerms || !form.guaranteeTerms.trim()) {
      errors.guaranteeTerms = 'Guarantee terms are required';
    }
  }

  // 18. Specifications
  if (Array.isArray(form.specifications) && form.specifications.length > 0) {
    for (let idx = 0; idx < form.specifications.length; idx++) {
      const spec = form.specifications[idx];
      if ((spec.key && spec.key.trim() && !spec.value?.trim()) || (!spec.key?.trim() && spec.value && spec.value.trim())) {
        errors.specifications = `Specification #${idx + 1} must have both key and value filled`;
        break;
      }
    }
  }

  return errors;
};

