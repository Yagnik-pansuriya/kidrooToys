import { baseApi } from '../Api';

export const realtimeApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({

    // GET /api/admin/realtime/token  — Mercure hub URL, topics and subscriber JWT
    getRealtimeToken: builder.query({
      query: () => 'admin/realtime/token',
      keepUnusedDataFor: 0,
    }),

  }),
});

export const { useLazyGetRealtimeTokenQuery } = realtimeApi;
