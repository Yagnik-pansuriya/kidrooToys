import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
const BASE_URL = "https://kidrooapi.vercel.app/api/";
// const BASE_URL = "http://localhost:5000/api/";


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