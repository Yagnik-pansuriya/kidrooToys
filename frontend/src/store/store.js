import { configureStore } from '@reduxjs/toolkit';
import { baseApi } from './Api';
import authReducer from './ReducerApi/authSlice';
import productReducer from './ReducerApi/productSlice';
import categoryReducer from './ReducerApi/categorySlice';
import offerReducer from './ReducerApi/offerSlice';

export const store = configureStore({
  reducer: {
    [baseApi.reducerPath]: baseApi.reducer,
    auth: authReducer,
    product: productReducer,
    category: categoryReducer,
    offer: offerReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(baseApi.middleware),
});
