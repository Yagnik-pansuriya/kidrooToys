import { baseApi, API_ENDPOINTS } from '../Api';

export const offerApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Admin: Get all offers
    getOffers: builder.query({
      query: ({ search } = {}) => {
        const params = new URLSearchParams();
        if (search) params.append('search', search);
        const qs = params.toString();
        return `${API_ENDPOINTS.OFFERS}${qs ? `?${qs}` : ''}`;
      },
      providesTags: ['Offers'],
    }),

    // Public: Get offers by page
    getOffersByPage: builder.query({
      query: (page) => `${API_ENDPOINTS.OFFERS}/page/${page}`,
      providesTags: ['Offers'],
    }),

    // Public: Get ALL active offers (for /offers page)
    getActiveOffers: builder.query({
      query: () => `${API_ENDPOINTS.OFFERS}/active`,
      providesTags: ['Offers'],
    }),

    // Admin: Get offer by ID
    getOfferById: builder.query({
      query: (id) => `${API_ENDPOINTS.OFFERS}/${id}`,
      providesTags: ['Offers'],
    }),

    // Admin: Create offer
    addOffer: builder.mutation({
      query: (formData) => ({
        url: API_ENDPOINTS.OFFERS,
        method: 'POST',
        body: formData,
        formData: true,
      }),
      invalidatesTags: ['Offers'],
    }),

    // Admin: Update offer
    updateOffer: builder.mutation({
      query: ({ id, formData }) => ({
        url: `${API_ENDPOINTS.OFFERS}/${id}`,
        method: 'PUT',
        body: formData,
        formData: true,
      }),
      invalidatesTags: ['Offers'],
    }),

    // Admin: Reorder offers
    reorderOffers: builder.mutation({
      query: ({ page, orderedIds }) => ({
        url: `${API_ENDPOINTS.OFFERS}/reorder`,
        method: 'PUT',
        body: { page, orderedIds },
      }),
      invalidatesTags: ['Offers'],
    }),

    // Admin: Delete offer
    deleteOffer: builder.mutation({
      query: (id) => ({
        url: `${API_ENDPOINTS.OFFERS}/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Offers'],
    }),
  }),
});

export const {
  useGetOffersQuery,
  useGetOffersByPageQuery,
  useGetActiveOffersQuery,
  useGetOfferByIdQuery,
  useAddOfferMutation,
  useUpdateOfferMutation,
  useReorderOffersMutation,
  useDeleteOfferMutation,
} = offerApi;
