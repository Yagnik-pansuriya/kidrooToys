import { baseApi, API_ENDPOINTS } from '../Api';
import { setProducts, setPaginationMeta } from '../ReducerApi/productSlice';

export const productApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({

    // GET /api/products?page=1&limit=10&search=...&category=...&minPrice=...&maxPrice=...&featured=...&newArrival=...&bestSeller=...
    getProducts: builder.query({
      query: ({ page = 1, limit = 10, search = '', category = '', minPrice = '', maxPrice = '', featured = '', newArrival = '', bestSeller = '' } = {}) => {
        const params = new URLSearchParams({ page, limit });
        if (search.trim())   params.append('search', search.trim());
        if (category)        params.append('category', category);
        if (minPrice !== '')  params.append('minPrice', minPrice);
        if (maxPrice !== '')  params.append('maxPrice', maxPrice);
        if (featured !== '')  params.append('featured', featured);
        if (newArrival !== '') params.append('newArrival', newArrival);
        if (bestSeller !== '') params.append('bestSeller', bestSeller);
        return `${API_ENDPOINTS.PRODUCTS}?${params.toString()}`;
      },
      providesTags: ['Products'],
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          const { data: resp } = await queryFulfilled;
          // Backend sendSuccessResponse wraps as: { success, data: { data: [...], total, page, limit } }
          const inner = resp?.data || resp;
          const productsArray = Array.isArray(inner?.data) ? inner.data
            : Array.isArray(inner) ? inner : [];
          const total      = Number(inner?.total) || productsArray.length;
          const limit      = Number(inner?.limit) || Number(arg?.limit) || 10;
          const page       = Number(inner?.page)  || Number(arg?.page)  || 1;
          const totalPages = Math.ceil(total / limit) || 1;

          dispatch(setProducts(productsArray));
          dispatch(setPaginationMeta({ total, totalPages, currentPage: page, limit }));
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
