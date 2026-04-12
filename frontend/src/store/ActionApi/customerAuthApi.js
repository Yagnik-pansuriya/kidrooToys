import { baseApi } from '../Api';
import { setCustomerCredentials } from '../ReducerApi/customerAuthSlice';

export const customerAuthApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({

    // POST /api/customer/auth/signup
    customerSignup: builder.mutation({
      query: (body) => ({
        url: 'customer/auth/signup',
        method: 'POST',
        body,
      }),
    }),

    // POST /api/customer/auth/send-otp
    sendOTP: builder.mutation({
      query: (body) => ({
        url: 'customer/auth/send-otp',
        method: 'POST',
        body,
      }),
    }),

    // POST /api/customer/auth/verify-otp
    verifyOTP: builder.mutation({
      query: (body) => ({
        url: 'customer/auth/verify-otp',
        method: 'POST',
        body,
      }),
      async onQueryStarted(_, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          if (data?.data?.customer) {
            dispatch(setCustomerCredentials({
              customer: data.data.customer,
              accessToken: data.data.accessToken || data.accessToken,
            }));
          }
        } catch {}
      },
    }),

    // POST /api/customer/auth/login
    customerLogin: builder.mutation({
      query: (body) => ({
        url: 'customer/auth/login',
        method: 'POST',
        body,
      }),
      async onQueryStarted(_, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          if (data?.data?.customer) {
            dispatch(setCustomerCredentials({
              customer: data.data.customer,
              accessToken: data.data.accessToken || data.accessToken,
            }));
          }
        } catch {}
      },
    }),

    // POST /api/customer/auth/logout
    customerLogout: builder.mutation({
      query: () => ({
        url: 'customer/auth/logout',
        method: 'POST',
      }),
    }),

    // POST /api/customer/auth/refresh
    customerRefresh: builder.mutation({
      query: (body) => ({
        url: 'customer/auth/refresh',
        method: 'POST',
        body,
      }),
    }),

    // GET /api/customer/auth/me
    getCustomerProfile: builder.query({
      query: () => 'customer/auth/me',
      providesTags: ['CustomerProfile'],
    }),

  }),
});

export const {
  useCustomerSignupMutation,
  useSendOTPMutation,
  useVerifyOTPMutation,
  useCustomerLoginMutation,
  useCustomerLogoutMutation,
  useCustomerRefreshMutation,
  useGetCustomerProfileQuery,
} = customerAuthApi;
