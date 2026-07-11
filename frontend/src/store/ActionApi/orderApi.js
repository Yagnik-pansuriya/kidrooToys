import { baseApi, API_ENDPOINTS } from '../Api';

export const orderApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({

    // ═══════════════════════════════════════════════════════════
    //  CUSTOMER ENDPOINTS
    // ═══════════════════════════════════════════════════════════

    // POST /api/customer/orders
    createOrder: builder.mutation({
      query: (body) => ({
        url: API_ENDPOINTS.CUSTOMER_ORDERS,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['CustomerOrders'],
    }),

    // POST /api/customer/orders/verify-payment
    verifyPayment: builder.mutation({
      query: (body) => ({
        url: `${API_ENDPOINTS.CUSTOMER_ORDERS}/verify-payment`,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['CustomerOrders'],
    }),

    // GET /api/customer/orders
    getMyOrders: builder.query({
      query: () => API_ENDPOINTS.CUSTOMER_ORDERS,
      providesTags: ['CustomerOrders'],
    }),

    // GET /api/customer/orders/:id
    getMyOrderById: builder.query({
      query: (id) => `${API_ENDPOINTS.CUSTOMER_ORDERS}/${id}`,
      providesTags: (result, error, id) => [{ type: 'CustomerOrders', id }],
    }),

    // ═══════════════════════════════════════════════════════════
    //  ADMIN ENDPOINTS
    // ═══════════════════════════════════════════════════════════

    // GET /api/orders
    getAllOrders: builder.query({
      query: (params = {}) => {
        const searchParams = new URLSearchParams();
        if (params.status) searchParams.set('status', params.status);
        if (params.paymentStatus) searchParams.set('paymentStatus', params.paymentStatus);
        if (params.paymentMethod) searchParams.set('paymentMethod', params.paymentMethod);
        if (params.search) searchParams.set('search', params.search);
        if (params.page) searchParams.set('page', params.page.toString());
        if (params.limit) searchParams.set('limit', params.limit.toString());
        const qs = searchParams.toString();
        return `${API_ENDPOINTS.ORDERS}${qs ? `?${qs}` : ''}`;
      },
      providesTags: ['Orders'],
    }),

    // GET /api/orders/:id
    getAdminOrderById: builder.query({
      query: (id) => `${API_ENDPOINTS.ORDERS}/${id}`,
      providesTags: (result, error, id) => [{ type: 'Orders', id }],
    }),

    // PATCH /api/orders/:id/status
    updateOrderStatus: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `${API_ENDPOINTS.ORDERS}/${id}/status`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: ['Orders'],
    }),

    // POST /api/orders/:id/confirm
    confirmAdminOrder: builder.mutation({
      query: (id) => ({
        url: `${API_ENDPOINTS.ORDERS}/${id}/confirm`,
        method: 'POST',
      }),
      invalidatesTags: ['Orders'],
    }),

    // GET /api/customer/orders/shipping-estimate
    getShippingEstimate: builder.query({
      query: ({ pincode, weight = 0.5, cod = false }) => 
        `${API_ENDPOINTS.CUSTOMER_ORDERS}/shipping-estimate?pincode=${pincode}&weight=${weight}&cod=${cod}`,
    }),

  }),
});

export const {
  // Customer hooks
  useCreateOrderMutation,
  useVerifyPaymentMutation,
  useGetMyOrdersQuery,
  useGetMyOrderByIdQuery,
  useGetShippingEstimateQuery,
  useLazyGetShippingEstimateQuery,
  // Admin hooks
  useGetAllOrdersQuery,
  useGetAdminOrderByIdQuery,
  useUpdateOrderStatusMutation,
  useConfirmAdminOrderMutation,
} = orderApi;

