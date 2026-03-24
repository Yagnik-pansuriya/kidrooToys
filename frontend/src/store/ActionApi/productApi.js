import { baseApi, API_ENDPOINTS } from '../Api';
import { setProducts, setPaginationMeta } from '../ReducerApi/productSlice';

export const productApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({

    // GET /api/products?page=1&limit=10&search=...
    getProducts: builder.query({
      query: ({ page = 1, limit = 10, search = '' } = {}) => {
        const params = new URLSearchParams({ page, limit });
        if (search.trim()) params.append('search', search.trim());
        return `${API_ENDPOINTS.PRODUCTS}?${params.toString()}`;
      },
      providesTags: ['Products'],
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          // API shape: { data: [...], total, page, limit, totalPages }
          const productsArray = data?.data || data;
          dispatch(setProducts(productsArray));
          dispatch(setPaginationMeta({
            total: data?.total ?? (Array.isArray(data) ? data.length : 0),
            totalPages: data?.totalPages ?? 1,
            currentPage: data?.page ?? (arg?.page ?? 1),
            limit: data?.limit ?? (arg?.limit ?? 10),
          }));
        } catch (err) {
          console.error('Failed to load products', err);
        }
      },
    }),

    // POST /api/products  (multipart/form-data)
    addProduct: builder.mutation({
      query: (formData) => ({
        url: API_ENDPOINTS.PRODUCTS,
        method: 'POST',
        body: formData,
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
