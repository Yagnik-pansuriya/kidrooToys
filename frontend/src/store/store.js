import { configureStore } from '@reduxjs/toolkit';
import { baseApi } from './Api';
import authReducer from './ReducerApi/authSlice';
import customerAuthReducer from './ReducerApi/customerAuthSlice';
import productReducer from './ReducerApi/productSlice';
import categoryReducer from './ReducerApi/categorySlice';
import offerReducer from './ReducerApi/offerSlice';
import skillReducer from './ReducerApi/skillSlice';

export const store = configureStore({
  reducer: {
    [baseApi.reducerPath]: baseApi.reducer,
    auth: authReducer,
    customerAuth: customerAuthReducer,
    product: productReducer,
    category: categoryReducer,
    offer: offerReducer,
    skill: skillReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(baseApi.middleware),
});
