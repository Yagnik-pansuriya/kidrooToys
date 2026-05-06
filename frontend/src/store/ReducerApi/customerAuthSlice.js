import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  customer: (() => {
    try {
      const saved = localStorage.getItem('kidroo_customer');
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  })(),
  customerToken: localStorage.getItem('customerToken') || null,
  isCustomerAuthenticated: !!localStorage.getItem('customerToken'),
  wishlistIds: (() => {
    try {
      return JSON.parse(localStorage.getItem('kidroo_wishlist_ids') || '[]');
    } catch { return []; }
  })(),
};

const customerAuthSlice = createSlice({
  name: 'customerAuth',
  initialState,
  reducers: {
    setCustomerCredentials: (state, action) => {
      const { customer, accessToken } = action.payload;
      state.customer = customer;
      state.customerToken = accessToken;
      state.isCustomerAuthenticated = true;

      localStorage.setItem('customerToken', accessToken);
      localStorage.setItem('kidroo_customer', JSON.stringify(customer));

      // Store wishlist IDs for quick lookup
      if (customer?.wishlist) {
        const ids = customer.wishlist.map((w) => (typeof w === 'string' ? w : w._id || w));
        state.wishlistIds = ids;
        localStorage.setItem('kidroo_wishlist_ids', JSON.stringify(ids));
      }
    },

    updateCustomerProfile: (state, action) => {
      state.customer = { ...state.customer, ...action.payload };
      localStorage.setItem('kidroo_customer', JSON.stringify(state.customer));
    },

    setWishlistIds: (state, action) => {
      state.wishlistIds = action.payload;
      localStorage.setItem('kidroo_wishlist_ids', JSON.stringify(action.payload));
    },

    toggleWishlistId: (state, action) => {
      const productId = action.payload;
      const index = state.wishlistIds.indexOf(productId);
      if (index > -1) {
        state.wishlistIds.splice(index, 1);
      } else {
        state.wishlistIds.push(productId);
      }
      localStorage.setItem('kidroo_wishlist_ids', JSON.stringify(state.wishlistIds));
    },

    customerLogout: (state) => {
      state.customer = null;
      state.customerToken = null;
      state.isCustomerAuthenticated = false;
      state.wishlistIds = [];
      localStorage.removeItem('customerToken');
      localStorage.removeItem('kidroo_customer');
      localStorage.removeItem('kidroo_wishlist_ids');
    },
  },
});

export const {
  setCustomerCredentials,
  updateCustomerProfile,
  setWishlistIds,
  toggleWishlistId,
  customerLogout,
} = customerAuthSlice.actions;

export default customerAuthSlice.reducer;
