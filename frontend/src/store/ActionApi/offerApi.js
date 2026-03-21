import { baseApi, API_ENDPOINTS } from '../Api';
import { setOffers } from '../ReducerApi/offerSlice';

export const offerApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getOffers: builder.query({
      query: () => API_ENDPOINTS.OFFERS,
      providesTags: ['Offers'],
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          const offerArray = data?.data || data;
          dispatch(setOffers(offerArray));
        } catch (err) {
          console.error('Failed to load offers automatically', err);
        }
      },
    }),

    addOffer: builder.mutation({
      query: (formData) => ({
        url: API_ENDPOINTS.OFFERS,
        method: 'POST',
        body: formData,
        formData: true,
      }),
      invalidatesTags: ['Offers'],
    }),

    updateOffer: builder.mutation({
      query: ({ id, formData }) => ({
        url: `${API_ENDPOINTS.OFFERS}/${id}`,
        method: 'PUT',
        body: formData,
        formData: true,
      }),
      invalidatesTags: ['Offers'],
    }),

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
  useAddOfferMutation,
  useUpdateOfferMutation,
  useDeleteOfferMutation,
} = offerApi;
