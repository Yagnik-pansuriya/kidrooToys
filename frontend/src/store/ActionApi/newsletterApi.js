import { baseApi } from '../Api';

export const newsletterApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({

    // POST /api/newsletter/subscribe (public)
    subscribe: builder.mutation({
      query: (email) => ({
        url: 'newsletter/subscribe',
        method: 'POST',
        body: { email },
      }),
      invalidatesTags: ['Newsletter'],
    }),

    // GET /api/newsletter (admin)
    getSubscribers: builder.query({
      query: () => 'newsletter',
      providesTags: ['Newsletter'],
    }),

    // GET /api/newsletter/stats (admin)
    getNewsletterStats: builder.query({
      query: () => 'newsletter/stats',
      providesTags: ['Newsletter'],
    }),

    // DELETE /api/newsletter/:id (admin)
    removeSubscriber: builder.mutation({
      query: (id) => ({
        url: `newsletter/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Newsletter'],
    }),

  }),
});

export const {
  useSubscribeMutation,
  useGetSubscribersQuery,
  useGetNewsletterStatsQuery,
  useRemoveSubscriberMutation,
} = newsletterApi;
