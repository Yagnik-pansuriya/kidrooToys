import { configureStore } from '@reduxjs/toolkit';
import { baseApi } from './Api';
import authReducer from './ReducerApi/authSlice';

export const store = configureStore({
  reducer: {
    [baseApi.reducerPath]: baseApi.reducer,
    auth: authReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(baseApi.middleware),
});
