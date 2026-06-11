import { baseApi } from '../Api';

export const adminCustomerApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({

    // GET /api/admin/customers/summary  — global KPI stats (cached 5 min)
    getAdminCustomerSummary: builder.query({
      query: () => 'admin/customers/summary',
      providesTags: ['AdminCustomers'],
      keepUnusedDataFor: 300,
    }),

    // GET /api/admin/customers
    getAllAdminCustomers: builder.query({
      query: (params = {}) => {
        const sp = new URLSearchParams();
        if (params.search)  sp.set('search', params.search);
        if (params.filter)  sp.set('filter', params.filter);
        if (params.sort)    sp.set('sort', params.sort);
        if (params.page)    sp.set('page', String(params.page));
        if (params.limit)   sp.set('limit', String(params.limit));
        const qs = sp.toString();
        return `admin/customers${qs ? `?${qs}` : ''}`;
      },
      providesTags: ['AdminCustomers'],
    }),

    // GET /api/admin/customers/:id
    getAdminCustomerById: builder.query({
      query: (id) => `admin/customers/${id}`,
      providesTags: (result, error, id) => [{ type: 'AdminCustomers', id }],
    }),

    // PATCH /api/admin/customers/:id/status
    toggleAdminCustomerStatus: builder.mutation({
      query: (id) => ({
        url: `admin/customers/${id}/status`,
        method: 'PATCH',
      }),
      invalidatesTags: ['AdminCustomers'],
    }),

  }),
});

export const {
  useGetAdminCustomerSummaryQuery,
  useGetAllAdminCustomersQuery,
  useGetAdminCustomerByIdQuery,
  useToggleAdminCustomerStatusMutation,
} = adminCustomerApi;
