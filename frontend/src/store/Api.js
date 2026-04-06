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
};

const baseQuery = fetchBaseQuery({
  baseUrl: BASE_URL,
  prepareHeaders: (headers, { getState }) => {
    const token = getState().auth?.token || localStorage.getItem('token');
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    headers.set('Accept', 'application/json');
    return headers;
  },
});

const baseQueryWithReauth = async (args, api, extraOptions) => {
  let result = await baseQuery(args, api, extraOptions);
  
  if (result.error && result.error.status === 401) {
    // Clear token & auth state
    api.dispatch(logout());
    
    // Redirect to admin login if not already there
    if (window.location.pathname !== '/admin') {
      window.location.href = '/admin';
    }
  }
  
  return result;
};


export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Products', 'Categories', 'Offers', 'Variants', 'SiteSettings', 'Users', 'Permissions', 'PermissionRoutes'],
  endpoints: () => ({}),
});