import { baseApi } from '../Api';

export const cartApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({

    // ── Customer cart ─────────────────────────────────────────

    // GET /api/customer/cart
    getCustomerCart: builder.query({
      query: () => 'customer/cart',
      providesTags: ['CustomerCart'],
    }),

    // PUT /api/customer/cart  — replace server cart with local cart
    syncCustomerCart: builder.mutation({
      query: (items) => ({
        url: 'customer/cart',
        method: 'PUT',
        body: { items },
      }),
    }),

    // ── Admin carts ───────────────────────────────────────────

    // GET /api/admin/carts/summary
    getAdminCartSummary: builder.query({
      query: () => 'admin/carts/summary',
      providesTags: ['AdminCarts'],
    }),

    // GET /api/admin/carts
    getAllAdminCarts: builder.query({
      query: (params = {}) => {
        const sp = new URLSearchParams();
        if (params.search) sp.set('search', params.search);
        if (params.filter) sp.set('filter', params.filter);
        if (params.sort)   sp.set('sort', params.sort);
        if (params.page)   sp.set('page', String(params.page));
        if (params.limit)  sp.set('limit', String(params.limit));
        const qs = sp.toString();
        return `admin/carts${qs ? `?${qs}` : ''}`;
      },
      providesTags: ['AdminCarts'],
    }),

    // GET /api/admin/carts/:customerId
    getAdminCartByCustomer: builder.query({
      query: (customerId) => `admin/carts/${customerId}`,
      providesTags: (result, error, id) => [{ type: 'AdminCarts', id }],
    }),

  }),
});

export const {
  useLazyGetCustomerCartQuery,
  useSyncCustomerCartMutation,
  useGetAdminCartSummaryQuery,
  useGetAllAdminCartsQuery,
  useGetAdminCartByCustomerQuery,
} = cartApi;
