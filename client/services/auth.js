import axios from 'axios';
import { store } from '../store';
import { updateAccessToken, clearCredentials } from '../store';

// Create axios instance with proper CORS configuration
const api = axios.create({
  baseURL: 'http://localhost:3001/api',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'X-Requested-With': 'XMLHttpRequest'
  },
  withCredentials: true
});

// Request interceptor for adding auth token
api.interceptors.request.use(
  (config) => {
    console.log('Making request:', {
      url: config.url,
      method: config.method,
      headers: config.headers,
      data: config.data
    });
    
    const state = store.getState();
    const token = state.auth.accessToken;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for token refresh
api.interceptors.response.use(
  (response) => {
    console.log('Response received:', {
      status: response.status,
      data: response.data,
      headers: response.headers
    });
    return response;
  },
  async (error) => {
    console.error('Response error:', {
      status: error.response?.status,
      data: error.response?.data,
      headers: error.response?.headers
    });

    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const state = store.getState();
        const refreshToken = state.auth.refreshToken;
        const response = await axios.post(
          'http://localhost:3001/api/auth/refresh',
          { refreshToken },
          {
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
              'X-Requested-With': 'XMLHttpRequest'
            },
            withCredentials: true
          }
        );
        const { accessToken } = response.data;
        const action = updateAccessToken(accessToken);
        console.log('Dispatching updateAccessToken action:', action);
        store.dispatch(action);
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (err) {
        const action = clearCredentials();
        console.log('Dispatching clearCredentials action:', action);
        store.dispatch(action);
        return Promise.reject(err);
      }
    }
    return Promise.reject(error);
  }
);

export const authService = {
  login: async (credentials) => {
    try {
      console.log('Sending login request with:', credentials);
      const response = await api.post('/auth/login', credentials);
      console.log('Raw login response:', response);
      
      if (!response.data) {
        throw new Error('No response data received');
      }

      const { data } = response;
      console.log('Login response data:', data);

      // Validate response data structure
      if (!data.user || !data.accessToken || !data.refreshToken) {
        console.error('Invalid response structure:', data);
        throw new Error('Invalid response format from server');
      }

      // Validate user object structure
      if (!data.user.id || !data.user.username || !Array.isArray(data.user.roles) || !Array.isArray(data.user.permissions)) {
        console.error('Invalid user object structure:', data.user);
        throw new Error('Invalid user data format');
      }

      return {
        user: {
          id: data.user.id,
          username: data.user.username,
          roles: data.user.roles,
          permissions: data.user.permissions
        },
        accessToken: data.accessToken,
        refreshToken: data.refreshToken
      };
    } catch (error) {
      console.error('Login request failed:', {
        error: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      throw error;
    }
  },
  logout: async () => {
    try {
      await api.post('/auth/logout');
      store.dispatch(clearCredentials());
    } catch (error) {
      console.error('Logout failed:', error);
      // Still clear credentials even if the request fails
      store.dispatch(clearCredentials());
    }
  },
  getCurrentUser: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  }
};

export default api; 