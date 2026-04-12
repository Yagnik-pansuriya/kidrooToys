import { baseApi, API_ENDPOINTS } from '../Api';
import { setCategories } from '../ReducerApi/categorySlice';

export const categoryApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getCategories: builder.query({
      query: () => API_ENDPOINTS.CATEGORIES,
      providesTags: ['Categories'],
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          const categoryArray = data?.data || data;
          dispatch(setCategories(categoryArray));
        } catch (err) {
          console.error('Failed to load categories automatically', err);
        }
      },
    }),

    addCategory: builder.mutation({
      query: (formData) => ({
        url: API_ENDPOINTS.CATEGORIES,
        method: 'POST',
        body: formData,
        formData: true,
      }),
      invalidatesTags: ['Categories'],
    }),

    updateCategory: builder.mutation({
      query: ({ id, formData }) => ({
        url: `${API_ENDPOINTS.CATEGORIES}/${id}`,
        method: 'PUT',
        body: formData,
        formData: true,
      }),
      invalidatesTags: ['Categories'],
    }),

    deleteCategory: builder.mutation({
      query: (id) => ({
        url: `${API_ENDPOINTS.CATEGORIES}/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Categories'],
    }),

    reorderCategories: builder.mutation({
      query: (items) => ({
        url: `${API_ENDPOINTS.CATEGORIES}/reorder`,
        method: 'PUT',
        body: { items },
      }),
      invalidatesTags: ['Categories'],
    }),
  }),
});

export const {
  useGetCategoriesQuery,
  useAddCategoryMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
  useReorderCategoriesMutation,
} = categoryApi;
