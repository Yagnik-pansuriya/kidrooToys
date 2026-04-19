import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { logout } from './ReducerApi/authSlice';

// ── Auto-switch: localhost in dev, Vercel backend in production ───────────────
// This prevents Chrome's "Private Network Access" permission popup on Vercel.
const BASE_URL = import.meta.env.DEV
  ? 'http://localhost:5000/api/'
  : (import.meta.env.VITE_API_URL || 'https://kidroo-backend.vercel.app/api/');

export const API_ENDPOINTS = {
  LOGIN: 'auth/login',
  PRODUCTS: 'products',
  CATEGORIES: 'categories',
  OFFERS: 'offers',
  VARIANTS: 'products',   
  SITE_SETTINGS: 'site-settings',
  BANNERS: 'banners',
  SKILLS: 'skills',
};

const baseQuery = fetchBaseQuery({
  baseUrl: BASE_URL,
  prepareHeaders: (headers, { getState }) => {
    // Admin token
    const adminToken = getState().auth?.token || localStorage.getItem('token');
    // Customer token (takes priority for customer endpoints)
    const customerToken = getState().customerAuth?.customerToken || localStorage.getItem('customerToken');

    // Use customer token for customer/* endpoints, admin token for others
    // The actual endpoint URL is not available here, so we send customer token
    // if it exists and no admin token is set
    if (customerToken && !adminToken) {
      headers.set('Authorization', `Bearer ${customerToken}`);
    } else if (adminToken) {
      headers.set('Authorization', `Bearer ${adminToken}`);
    }

    // Also set customer token as a custom header so both can coexist
    if (customerToken) {
      headers.set('X-Customer-Token', `Bearer ${customerToken}`);
    }

    headers.set('Accept', 'application/json');
    return headers;
  },
});

const baseQueryWithReauth = async (args, api, extraOptions) => {
  // For customer endpoints, use customer token in Authorization header
  const url = typeof args === 'string' ? args : args?.url || '';
  const isCustomerEndpoint = url.startsWith('customer/');

  if (isCustomerEndpoint) {
    const customerToken = api.getState().customerAuth?.customerToken || localStorage.getItem('customerToken');
    if (customerToken) {
      const modifiedArgs = typeof args === 'string'
        ? { url: args, headers: { Authorization: `Bearer ${customerToken}` } }
        : { ...args, headers: { ...args?.headers, Authorization: `Bearer ${customerToken}` } };
      let result = await baseQuery(modifiedArgs, api, extraOptions);
      // Don't redirect customer 401s to admin login
      return result;
    }
  }

  let result = await baseQuery(args, api, extraOptions);
  
  if (result.error && result.error.status === 401 && !isCustomerEndpoint) {
    // Clear token & auth state (admin only)
    api.dispatch(logout());
    
    // Redirect to admin login if not already there
    if (window.location.pathname.startsWith('/admin') && window.location.pathname !== '/admin') {
      window.location.href = '/admin';
    }
  }
  
  return result;
};


export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Products', 'Categories', 'Offers', 'Variants', 'SiteSettings', 'Users', 'Permissions', 'PermissionRoutes', 'Newsletter', 'Reviews', 'Banners', 'CustomerProfile', 'Wishlist', 'Skills'],
  endpoints: () => ({}),
});