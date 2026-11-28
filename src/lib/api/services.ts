import { api } from './client';
import type {
  AdminLogEntry,
  AdminOrderDetail,
  BatchPayoutResult,
  Category,
  DashboardData,
  FinanceSummary,
  LoginResponse,
  ManagedUser,
  OrderStatus,
  Paginated,
  PaginatedLogs,
  PaginatedOrders,
  PaginatedUsers,
  PayoutRecord,
  ShopDetail,
  ShopListItem,
  ShopStatus,
} from './types';

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

export const payoutsApi = {
  list: () => api.get<PayoutRecord[]>('/admin/payouts').then((r) => r.data),
  processBatch: (ids: string[]) =>
    api.post<BatchPayoutResult>('/admin/payouts/batch-process', { ids }).then((r) => r.data),
};

export const ordersApi = {
  list: (params: {
    status?: OrderStatus;
    shopId?: string;
    from?: string;
    to?: string;
    q?: string;
    sort?: 'terbaru' | 'terlama';
    page?: number;
    limit?: number;
  }) =>
    api
      .get<PaginatedOrders>('/admin/orders', { params })
      .then((r) => r.data as unknown as PaginatedOrders),
  detail: (id: string) =>
    api.get<AdminOrderDetail>(`/admin/orders/${id}`).then((r) => r.data),
};

export const usersApi = {
  list: (params: {
    role?: string;
    isActive?: boolean;
    q?: string;
    page?: number;
    limit?: number;
  }) =>
    api
      .get<PaginatedUsers>('/admin/users', { params })
      .then((r) => r.data as unknown as PaginatedUsers),
  updateStatus: (id: string, isActive: boolean, reason?: string) =>
    api
      .patch<ManagedUser>(`/admin/users/${id}/status`, {
        isActive,
        ...(reason ? { reason } : {}),
      })
      .then((r) => r.data),
};

export const financeApi = {
  get: (params: { from?: string; to?: string }) =>
    api.get<FinanceSummary>('/admin/finance', { params }).then((r) => r.data),
};

export const logsApi = {
  list: (params: {
    action?: string;
    category?: string;
    from?: string;
    to?: string;
    q?: string;
    targetType?: string;
    targetId?: string;
    page?: number;
    limit?: number;
  }) =>
    api
      .get<PaginatedLogs>('/admin/logs', { params })
      .then((r) => r.data as unknown as PaginatedLogs),
};

export type { AdminLogEntry };
