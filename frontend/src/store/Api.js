import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { logout } from './ReducerApi/authSlice';
// const BASE_URL = "https://kidroo-backend.vercel.app/api/";
const BASE_URL = "http://localhost:5000/api/";

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
  tagTypes: ['Products', 'Categories', 'Offers', 'Variants', 'SiteSettings'],
  endpoints: () => ({}),
});