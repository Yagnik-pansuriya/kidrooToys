import { baseApi, API_ENDPOINTS } from '../Api';

export const couponApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Admin: Get all coupons
    getCoupons: builder.query({
      query: ({ search, visibility } = {}) => {
        const params = new URLSearchParams();
        if (search) params.append('search', search);
        if (visibility) params.append('visibility', visibility);
        const qs = params.toString();
        return `${API_ENDPOINTS.COUPONS}${qs ? `?${qs}` : ''}`;
      },
      providesTags: ['Coupons'],
    }),

    // Public: Get public coupons
    getPublicCoupons: builder.query({
      query: () => `${API_ENDPOINTS.COUPONS}/public`,
      providesTags: ['Coupons'],
    }),

    // Admin: Get coupon by ID
    getCouponById: builder.query({
      query: (id) => `${API_ENDPOINTS.COUPONS}/${id}`,
      providesTags: ['Coupons'],
    }),

    // Admin: Create coupon
    createCoupon: builder.mutation({
      query: (data) => ({
        url: API_ENDPOINTS.COUPONS,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Coupons'],
    }),

    // Admin: Update coupon
    updateCoupon: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `${API_ENDPOINTS.COUPONS}/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Coupons'],
    }),

    // Admin: Delete coupon
    deleteCoupon: builder.mutation({
      query: (id) => ({
        url: `${API_ENDPOINTS.COUPONS}/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Coupons'],
    }),

    // Customer: Validate coupon
    validateCoupon: builder.mutation({
      query: ({ code, cartItems }) => ({
        url: `${API_ENDPOINTS.COUPONS}/validate`,
        method: 'POST',
        body: { code, cartItems },
      }),
    }),
  }),
});

export const {
  useGetCouponsQuery,
  useGetPublicCouponsQuery,
  useGetCouponByIdQuery,
  useCreateCouponMutation,
  useUpdateCouponMutation,
  useDeleteCouponMutation,
  useValidateCouponMutation,
} = couponApi;
