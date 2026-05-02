import { baseApi } from '../Api';

export const customerApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({

    // ── Profile ───────────────────────────────────────────────
    updateCustomerProfile: builder.mutation({
      query: (body) => ({
        url: 'customer/profile',
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['CustomerProfile'],
    }),

    changeCustomerPassword: builder.mutation({
      query: (body) => ({
        url: 'customer/change-password',
        method: 'POST',
        body,
      }),
    }),

    // ── Addresses ─────────────────────────────────────────────
    addAddress: builder.mutation({
      query: (body) => ({
        url: 'customer/addresses',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['CustomerProfile'],
    }),

    updateAddress: builder.mutation({
      query: ({ addressId, ...body }) => ({
        url: `customer/addresses/${addressId}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['CustomerProfile'],
    }),

    deleteAddress: builder.mutation({
      query: (addressId) => ({
        url: `customer/addresses/${addressId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['CustomerProfile'],
    }),

    setDefaultAddress: builder.mutation({
      query: (addressId) => ({
        url: `customer/addresses/${addressId}/default`,
        method: 'PATCH',
      }),
      invalidatesTags: ['CustomerProfile'],
    }),

    // ── Wishlist ──────────────────────────────────────────────
    getWishlist: builder.query({
      query: () => 'customer/wishlist',
      providesTags: ['Wishlist'],
    }),

    toggleWishlist: builder.mutation({
      query: (productId) => ({
        url: `customer/wishlist/${productId}`,
        method: 'POST',
      }),
      invalidatesTags: ['Wishlist', 'CustomerProfile'],
    }),

    clearWishlist: builder.mutation({
      query: () => ({
        url: 'customer/wishlist',
        method: 'DELETE',
      }),
      invalidatesTags: ['Wishlist', 'CustomerProfile'],
    }),

  }),
});

export const {
  useUpdateCustomerProfileMutation,
  useChangeCustomerPasswordMutation,
  useAddAddressMutation,
  useUpdateAddressMutation,
  useDeleteAddressMutation,
  useSetDefaultAddressMutation,
  useGetWishlistQuery,
  useToggleWishlistMutation,
  useClearWishlistMutation,
} = customerApi;
