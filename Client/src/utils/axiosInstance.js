/**
 * axiosInstance.js
 * Central axios client for all API calls.
 *
 * What this fixes:
 *  - Attaches the JWT to every request automatically
 *  - Intercepts 401 responses and triggers logout + redirect
 *    so the user never gets a broken state after token expiry
 *  - Single place to set base URL -- change VITE_API_URL in .env only
 *
 * Usage (replace raw axios calls in every service):
 *   import api from '../utils/axiosInstance';
 *   const { data } = await api.get('/venues');
 */

import axios from 'axios';

const rawApiUrl = (import.meta.env.VITE_API_URL || 'http://localhost:3000').replace(/\/+$/, '');
const normalizedBaseURL = rawApiUrl.endsWith('/api') ? rawApiUrl : `${rawApiUrl}/api`;

const api = axios.create({
  baseURL: normalizedBaseURL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000, // 15 s -- prevents hanging requests on slow Render cold-starts
});

// Request interceptor: inject token
api.interceptors.request.use(
  (config) => {
    // Prevent "/api/api/*" when callers still send "/api/*".
    if (normalizedBaseURL.endsWith('/api') && typeof config.url === 'string') {
      const stripped = config.url.replace(/^\/api(?=\/|$)/, '');
      config.url = stripped || '/';
    }

    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Response interceptor: handle 401 globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear local auth state
      localStorage.removeItem('token');
      localStorage.removeItem('user');

      // Avoid redirect loop if already on /login
      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = '/login?expired=1';
      }
    }
    return Promise.reject(error);
  },
);

export default api;