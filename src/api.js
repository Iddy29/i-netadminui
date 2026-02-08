import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'https://api.i-nettz.site/api';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Attach token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('admin_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 responses — only redirect if not already on login page
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Don't redirect if the failed request was the login endpoint itself
      const requestUrl = error.config?.url || '';
      if (!requestUrl.includes('/auth/login')) {
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_user');
        // Use replace to avoid back-button loops
        if (window.location.pathname !== '/login') {
          window.location.replace('/login');
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
