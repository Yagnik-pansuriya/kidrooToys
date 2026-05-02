import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  skills: [],
  isLoading: false,
  error: null,
};

const skillSlice = createSlice({
  name: 'skill',
  initialState,
  reducers: {
    setSkills: (state, action) => {
      state.skills = action.payload || [];
    },
    clearSkills: (state) => {
      state.skills = [];
    },
  },
});

export const { setSkills, clearSkills } = skillSlice.actions;
export default skillSlice.reducer;
