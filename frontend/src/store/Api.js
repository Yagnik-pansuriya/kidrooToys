import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
const path = location.hostname;
if(path === 'localhost'){
  path = 'http://localhost:5000/api/';
}
else{
  path = 'https://kidrooapi.vercel.app/api/';
}
const BASE_URL = import.meta.env.VITE_API_URL || path;

export const API_ENDPOINTS = {
  LOGIN: 'auth/login',
  PRODUCTS: 'products',
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

// ─── Base API (all endpoints injected from feature files) ─────────────────────
export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery,
  tagTypes: ['Products'],
  endpoints: () => ({}),
});