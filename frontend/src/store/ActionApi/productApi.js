import { baseApi, API_ENDPOINTS } from '../Api';

export const productApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({

    // GET /api/products
    getProducts: builder.query({
      query: () => API_ENDPOINTS.PRODUCTS,
      providesTags: ['Products'],
    }),

    // POST /api/products  (multipart/form-data — name, description, price, category, images[])
    addProduct: builder.mutation({
      query: (formData) => ({
        url: API_ENDPOINTS.PRODUCTS,
        method: 'POST',
        body: formData,          // FormData object with files included
        // Do NOT set Content-Type; browser sets it automatically with the correct boundary
        formData: true,
      }),
      invalidatesTags: ['Products'],
    }),

    // PUT /api/products/:id
    updateProduct: builder.mutation({
      query: ({ id, formData }) => ({
        url: `${API_ENDPOINTS.PRODUCTS}/${id}`,
        method: 'PUT',
        body: formData,
        formData: true,
      }),
      invalidatesTags: ['Products'],
    }),

    // DELETE /api/products/:id
    deleteProduct: builder.mutation({
      query: (id) => ({
        url: `${API_ENDPOINTS.PRODUCTS}/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Products'],
    }),

  }),
});

export const {
  useGetProductsQuery,
  useAddProductMutation,
  useUpdateProductMutation,
  useDeleteProductMutation,
} = productApi;
