import axios, { AxiosError } from 'axios';
import { clearAdminSession, getAdminToken } from '../auth';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = getAdminToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => {
    const body = response.data;
    if (body && typeof body === 'object' && 'data' in body && 'meta' in body) return { ...response, data: body };
    if (body && typeof body === 'object' && 'data' in body) return { ...response, data: body.data };
    return response;
  },
  (error: AxiosError<any>) => {
    const status = error.response?.status;
    if (status === 401) {
      clearAdminSession();
      if (window.location.pathname !== '/admin/login') {
        window.location.assign('/admin/login');
      }
    }
    const message =
      (Array.isArray(error.response?.data?.message) ? error.response?.data?.message[0] : error.response?.data?.message) ||
      error.message ||
      'Terjadi kesalahan';
    return Promise.reject(Object.assign(error, { userMessage: message, statusCode: status }));
  },
);

export type ApiError = AxiosError & { userMessage?: string; statusCode?: number };
