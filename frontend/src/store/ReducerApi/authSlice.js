import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  user: null,
  token: localStorage.getItem('token') || null,
  isAuthenticated: !!localStorage.getItem('token'),
  permissions: JSON.parse(localStorage.getItem('permissions') || '[]'),
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (state, action) => {
      const { data: user, accessToken } = action.payload;
      state.user = user;
      state.token = accessToken;
      state.isAuthenticated = true;
      localStorage.setItem('token', accessToken);

      // Store permissions from login response if available
      if (user?.permissions) {
        state.permissions = user.permissions;
        localStorage.setItem('permissions', JSON.stringify(user.permissions));
      }
    },
    setPermissions: (state, action) => {
      state.permissions = action.payload;
      localStorage.setItem('permissions', JSON.stringify(action.payload));
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.permissions = [];
      localStorage.removeItem('token');
      localStorage.removeItem('permissions');
    },
  },
});

export const { setCredentials, setPermissions, logout } = authSlice.actions;
export default authSlice.reducer;
