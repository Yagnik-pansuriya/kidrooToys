import { baseApi, API_ENDPOINTS } from '../Api';
import { setCategories } from '../ReducerApi/categorySlice';

export const categoryApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getCategories: builder.query({
      query: ({ search } = {}) => {
        const params = new URLSearchParams();
        if (search) params.append('search', search);
        const qs = params.toString();
        return `${API_ENDPOINTS.CATEGORIES}${qs ? `?${qs}` : ''}`;
      },
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

    getCategoryBySlug: builder.query({
      query: (slug) => `${API_ENDPOINTS.CATEGORIES}/slug/${slug}`,
      providesTags: (result, error, slug) => [{ type: 'Categories', id: slug }],
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

    moveCategoryPosition: builder.mutation({
      query: ({ id, targetPosition }) => ({
        url: `${API_ENDPOINTS.CATEGORIES}/move-position`,
        method: 'PUT',
        body: { id, targetPosition },
      }),
      invalidatesTags: ['Categories'],
    }),

    toggleCategoryStatus: builder.mutation({
      query: (id) => ({
        url: `${API_ENDPOINTS.CATEGORIES}/${id}/toggle-status`,
        method: 'PATCH',
      }),
      invalidatesTags: ['Categories'],
    }),
  }),
});

export const {
  useGetCategoriesQuery,
  useGetCategoryBySlugQuery,
  useAddCategoryMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
  useReorderCategoriesMutation,
  useMoveCategoryPositionMutation,
  useToggleCategoryStatusMutation,
} = categoryApi;
