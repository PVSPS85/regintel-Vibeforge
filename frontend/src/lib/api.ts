import axios from 'axios';
import { getToken, clearToken } from './auth';

// Safely access Vite env without strict ImportMeta type errors
const env = (import.meta as any).env ?? {};
const BASE_URL = env.VITE_API_URL ?? 'http://127.0.0.1:8000';

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ── Request interceptor: inject JWT ──────────────────────────────────────────
api.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response interceptor: handle 401 globally ────────────────────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      clearToken();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
