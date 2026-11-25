import { api } from './client';
import type { Category, DashboardData, LoginResponse, Paginated, ShopDetail, ShopListItem, ShopStatus } from './types';

export const authApi = {
  login: (body: { email: string; password: string }) => api.post<LoginResponse>('/auth/login', body).then((r) => r.data),
  me: () => api.get<import('./types').AdminUser>('/auth/me').then((r) => r.data),
};

export const shopsApi = {
  list: (params: { status?: ShopStatus; q?: string; page?: number; limit?: number }) =>
    api.get<Paginated<ShopListItem>>('/admin/shops', { params }).then((r) => r.data as unknown as Paginated<ShopListItem>),
  detail: (id: string) => api.get<ShopDetail>(`/admin/shops/${id}`).then((r) => r.data),
  approve: (id: string) => api.patch<ShopListItem>(`/admin/shops/${id}/approve`).then((r) => r.data),
  reject: (id: string, reason: string) => api.patch<ShopListItem>(`/admin/shops/${id}/reject`, { reason }).then((r) => r.data),
  updateStatus: (id: string, status: 'aktif' | 'nonaktif', reason?: string) =>
    api.patch<ShopListItem>(`/admin/shops/${id}/status`, { status, ...(reason ? { reason } : {}) }).then((r) => r.data),
};

export const categoriesApi = {
  list: (q?: string) => api.get<Category[]>('/admin/categories', { params: q ? { q } : undefined }).then((r) => r.data),
  create: (name: string) => api.post<Category>('/admin/categories', { name }).then((r) => r.data),
  update: (id: string, body: { name?: string; isActive?: boolean }) => api.patch<Category>(`/admin/categories/${id}`, body).then((r) => r.data),
  remove: (id: string) => api.delete(`/admin/categories/${id}`).then(() => undefined),
};

export const dashboardApi = {
  get: (range: 7 | 30) => api.get<DashboardData>('/admin/dashboard', { params: { range } }).then((r) => r.data),
};
