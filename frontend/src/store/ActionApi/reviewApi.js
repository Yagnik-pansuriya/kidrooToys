import { baseApi } from '../Api';

export const reviewApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({

    // GET /api/reviews/product/:productId (public)
    getProductReviews: builder.query({
      query: (productId) => `reviews/product/${productId}`,
      providesTags: (result, error, productId) => [{ type: 'Reviews', id: productId }],
    }),

    // GET /api/reviews/product/:productId/stats (public)
    getProductReviewStats: builder.query({
      query: (productId) => `reviews/product/${productId}/stats`,
      providesTags: (result, error, productId) => [{ type: 'Reviews', id: `stats-${productId}` }],
    }),

    // POST /api/reviews/product/:productId (public)
    addReview: builder.mutation({
      query: ({ productId, body }) => ({
        url: `reviews/product/${productId}`,
        method: 'POST',
        body,
      }),
      invalidatesTags: (result, error, { productId }) => [
        { type: 'Reviews', id: productId },
        { type: 'Reviews', id: `stats-${productId}` },
      ],
    }),

    // GET /api/reviews (admin)
    getAllReviews: builder.query({
      query: () => 'reviews',
      providesTags: ['Reviews'],
    }),

    // DELETE /api/reviews/:id (admin)
    deleteReview: builder.mutation({
      query: (id) => ({
        url: `reviews/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Reviews'],
    }),

    // PATCH /api/reviews/:id/toggle (admin)
    toggleReviewApproval: builder.mutation({
      query: (id) => ({
        url: `reviews/${id}/toggle`,
        method: 'PATCH',
      }),
      invalidatesTags: ['Reviews'],
    }),

  }),
});

export const {
  useGetProductReviewsQuery,
  useGetProductReviewStatsQuery,
  useAddReviewMutation,
  useGetAllReviewsQuery,
  useDeleteReviewMutation,
  useToggleReviewApprovalMutation,
} = reviewApi;
