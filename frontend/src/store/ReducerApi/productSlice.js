import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  products: [],
  isLoading: false,
  error: null,
  // Pagination metadata returned by the API
  total: 0,
  totalPages: 1,
  currentPage: 1,
  limit: 10,
};

const productSlice = createSlice({
  name: 'product',
  initialState,
  reducers: {
    setProducts: (state, action) => {
      state.products = action.payload || [];
    },
    clearProducts: (state) => {
      state.products = [];
    },
    setPaginationMeta: (state, action) => {
      const { total, totalPages, currentPage, limit } = action.payload || {};
      if (total      !== undefined) state.total       = total;
      if (totalPages !== undefined) state.totalPages  = totalPages;
      if (currentPage!== undefined) state.currentPage = currentPage;
      if (limit      !== undefined) state.limit       = limit;
    },
  },
});

export const { setProducts, clearProducts, setPaginationMeta } = productSlice.actions;
export default productSlice.reducer;
