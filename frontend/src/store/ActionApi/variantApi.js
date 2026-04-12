import { baseApi } from '../Api';

// ─── Helper: build FormData from a variant body object ────────────────────────
// Mirrors the product pattern (useProductForm → buildFormData).
// dimensions and attributes are JSON.stringify'd (backend expects string).
const buildVariantFormData = (body) => {
  const fd = new FormData();

  // scalar fields
  const scalarFields = [
    'sku', 'barcode',
    'price', 'originalPrice',
    'stock', 'lowStockAlert',
    'weight',
    'status', 'isDefault', 'isActive',
    'youtubeUrl',
  ];
  scalarFields.forEach((key) => {
    if (body[key] !== undefined && body[key] !== '') {
      fd.append(key, body[key]);
    }
  });

  // dimensions → JSON string  e.g. { length: 10, width: 5, height: 3 }
  if (body.dimensions !== undefined) {
    fd.append('dimensions', JSON.stringify(body.dimensions));
  }

  // images: append each new File object  (same as product)
  if (Array.isArray(body.imageFiles)) {
    body.imageFiles.forEach((file) => fd.append('images', file));
  }

  // existingImages: remote CDN URLs to keep (JSON array of strings)
  // The backend will merge: finalImages = existingImages + newly uploaded URLs
  if (Array.isArray(body.existingImageUrls) && body.existingImageUrls.length > 0) {
    fd.append('existingImages', JSON.stringify(body.existingImageUrls));
  }

  // attributes → JSON string  e.g. { Color: 'Red', Size: 'XL' }
  if (body.attributes !== undefined) {
    fd.append('attributes', JSON.stringify(body.attributes));
  }

  return fd;
};

export const variantApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({

    // GET /api/products/:productId/variants
    getVariants: builder.query({
      query: (productId) => `products/${productId}/variants`,
      // keepUnusedDataFor: 0 forces a fresh fetch every time the component mounts
      keepUnusedDataFor: 0,
      providesTags: (result, error, productId) => [
        { type: 'Variants', id: productId },
        { type: 'Variants', id: 'LIST' },
      ],
    }),

    // POST /api/products/:productId/variants  (multipart/form-data)
    addVariant: builder.mutation({
      query: ({ productId, body }) => ({
        url: `products/${productId}/variants`,
        method: 'POST',
        body: buildVariantFormData(body),
        // NOTE: do NOT set Content-Type — the browser sets it automatically
        // with the correct multipart boundary when body is FormData
      }),
      invalidatesTags: (result, error, { productId }) => [
        { type: 'Variants', id: productId },
        { type: 'Variants', id: 'LIST' },
      ],
    }),

    // PUT /api/products/variants/:variantId  (multipart/form-data)
    updateVariant: builder.mutation({
      query: ({ variantId, productId, body }) => ({
        url: `products/variants/${variantId}`,
        method: 'PUT',
        body: buildVariantFormData(body),
      }),
      invalidatesTags: (result, error, { productId }) => [
        { type: 'Variants', id: productId },
        { type: 'Variants', id: 'LIST' },
      ],
    }),

    // DELETE /api/products/variants/:variantId
    deleteVariant: builder.mutation({
      query: ({ variantId }) => ({
        url: `products/variants/${variantId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, { productId }) => [
        { type: 'Variants', id: productId },
        { type: 'Variants', id: 'LIST' },
      ],
    }),

  }),
});

export const {
  useGetVariantsQuery,
  useAddVariantMutation,
  useUpdateVariantMutation,
  useDeleteVariantMutation,
} = variantApi;
