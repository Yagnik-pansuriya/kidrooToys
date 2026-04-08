import { baseApi, API_ENDPOINTS } from '../Api';

export const bannerApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({

    // GET /api/banners?activeOnly=true (public)
    getBanners: builder.query({
      query: ({ activeOnly = false } = {}) => {
        const params = new URLSearchParams();
        if (activeOnly) params.append('activeOnly', 'true');
        const qs = params.toString();
        return `${API_ENDPOINTS.BANNERS}${qs ? `?${qs}` : ''}`;
      },
      providesTags: ['Banners'],
    }),

    // POST /api/banners (admin, multipart)
    addBanner: builder.mutation({
      query: (formData) => ({
        url: API_ENDPOINTS.BANNERS,
        method: 'POST',
        body: formData,
        formData: true,
      }),
      invalidatesTags: ['Banners'],
    }),

    // PUT /api/banners/:id (admin, multipart)
    updateBanner: builder.mutation({
      query: ({ id, formData }) => ({
        url: `${API_ENDPOINTS.BANNERS}/${id}`,
        method: 'PUT',
        body: formData,
        formData: true,
      }),
      invalidatesTags: ['Banners'],
    }),

    // DELETE /api/banners/:id (admin)
    deleteBanner: builder.mutation({
      query: (id) => ({
        url: `${API_ENDPOINTS.BANNERS}/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Banners'],
    }),

  }),
});

export const {
  useGetBannersQuery,
  useAddBannerMutation,
  useUpdateBannerMutation,
  useDeleteBannerMutation,
} = bannerApi;
