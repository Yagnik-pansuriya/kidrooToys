import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  offers: [],
  isLoading: false,
  error: null,
};

const offerSlice = createSlice({
  name: 'offer',
  initialState,
  reducers: {
    setOffers: (state, action) => {
      state.offers = action.payload || [];
    },
    clearOffers: (state) => {
      state.offers = [];
    },
  },
});

export const { setOffers, clearOffers } = offerSlice.actions;
export default offerSlice.reducer;
