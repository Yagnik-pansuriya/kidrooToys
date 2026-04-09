import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  // Restore full session from localStorage on every page load / refresh
  user: (() => {
    try {
      const saved = localStorage.getItem('kidroo_admin_user');
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  })(),
  token: localStorage.getItem('token') || null,
  isAuthenticated: !!localStorage.getItem('token'),
  permissions: (() => {
    try {
      return JSON.parse(localStorage.getItem('permissions') || '[]');
    } catch { return []; }
  })(),
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

      // Persist to localStorage so refresh restores full session
      localStorage.setItem('token', accessToken);
      localStorage.setItem('kidroo_admin_user', JSON.stringify(user));

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
      localStorage.removeItem('kidroo_admin_user');
      localStorage.removeItem('permissions');
    },
  },
});

export const { setCredentials, setPermissions, logout } = authSlice.actions;
export default authSlice.reducer;
