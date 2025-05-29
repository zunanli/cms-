import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  user: null,
  accessToken: null,
  refreshToken: null,
  permissions: [],
  roles: []
};

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (state, action) => {
      const { user, accessToken, refreshToken } = action.payload;
      state.user = user;
      state.accessToken = accessToken;
      state.refreshToken = refreshToken;
      state.roles = user?.roles || [];
      state.permissions = user?.permissions || [];
    },
    clearCredentials: (state) => {
      state.user = null;
      state.accessToken = null;
      state.refreshToken = null;
      state.permissions = [];
      state.roles = [];
    },
    updateAccessToken: (state, action) => {
      state.accessToken = action.payload;
    }
  }
});

// Export the action creators
export const { setCredentials, clearCredentials, updateAccessToken } = authSlice.actions;

// Export the reducer
export default authSlice.reducer; 