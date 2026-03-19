import { baseApi, API_ENDPOINTS } from '../Api';
import { setCredentials } from '../ReducerApi/authSlice';

export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({

    login: builder.mutation({
      query: (credentials) => ({
        url: API_ENDPOINTS.LOGIN,   // ← URL from Api.js
        method: 'POST',
        body: credentials,          // { email, password }
      }),

      // onQueryStarted = built-in thunk that runs when request is made
      // queryFulfilled = promise that resolves when response arrives
      async onQueryStarted(_, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          // Auto-store response in authSlice reducer
          dispatch(setCredentials(data));
        } catch (err) {
          // Error handling is done in the component via .unwrap()
          // Nothing extra needed here
        }
      },
    }),

  }),
});

export const { useLoginMutation } = authApi;
