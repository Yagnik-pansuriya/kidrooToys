import { baseApi, API_ENDPOINTS } from '../Api';
import { setProducts } from '../ReducerApi/productSlice';

export const productApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({

    // GET /api/products
    getProducts: builder.query({
      query: () => API_ENDPOINTS.PRODUCTS,
      providesTags: ['Products'],
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          // Action sets products. API provides payload under `data.data` (as seen in request block) or fallback to `data`.
          const productsArray = data?.data || data;
          dispatch(setProducts(productsArray));
        } catch (err) {
          console.error('Failed to load products automatically', err);
        }
      },
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
