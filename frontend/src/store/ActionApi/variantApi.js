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
      providesTags: (result, error, productId) => [{ type: 'Variants', id: productId }],
    }),

    // POST /api/products/:productId/variants  (multipart/form-data)
    addVariant: builder.mutation({
      query: ({ productId, body }) => ({
        url: `products/${productId}/variants`,
        method: 'POST',
        body: buildVariantFormData(body),
        formData: true,
      }),
      invalidatesTags: (result, error, { productId }) => [{ type: 'Variants', id: productId }],
    }),

    // PUT /api/products/variants/:variantId  (multipart/form-data)
    updateVariant: builder.mutation({
      query: ({ variantId, productId, body }) => ({
        url: `products/variants/${variantId}`,
        method: 'PUT',
        body: buildVariantFormData(body),
        formData: true,
      }),
      invalidatesTags: (result, error, { productId }) => [{ type: 'Variants', id: productId }],
    }),

    // DELETE /api/products/variants/:variantId
    deleteVariant: builder.mutation({
      query: ({ variantId }) => ({
        url: `products/variants/${variantId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, { productId }) => [{ type: 'Variants', id: productId }],
    }),

  }),
});

export const {
  useGetVariantsQuery,
  useAddVariantMutation,
  useUpdateVariantMutation,
  useDeleteVariantMutation,
} = variantApi;
