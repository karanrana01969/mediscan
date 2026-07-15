import axios from 'axios';
import { storageService } from './storageService';

// Replace with your machine IP when running on a physical device
// export const BASE_URL = 'http://10.0.2.2:8000/api';  // Android emulator
export const BASE_URL = 'http://192.168.0.199:8000/api';  // Physical device

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ─── Request Interceptor: attach JWT ───────────────
api.interceptors.request.use(
  async (config) => {
    const token = await storageService.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Response Interceptor: handle 401 ─────────────
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid — clear storage
      await storageService.clearAll();
      // Navigation to Login is handled by AppNavigator checking token state
    }
    return Promise.reject(error);
  }
);

export default api;
