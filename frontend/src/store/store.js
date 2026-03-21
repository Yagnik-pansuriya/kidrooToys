import { configureStore } from '@reduxjs/toolkit';
import { baseApi } from './Api';
import authReducer from './ReducerApi/authSlice';
import productReducer from './ReducerApi/productSlice';
import categoryReducer from './ReducerApi/categorySlice';

export const store = configureStore({
  reducer: {
    [baseApi.reducerPath]: baseApi.reducer,
    auth: authReducer,
    product: productReducer,
    category: categoryReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(baseApi.middleware),
});
