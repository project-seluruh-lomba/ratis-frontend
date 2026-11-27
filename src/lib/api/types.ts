export type AdminUser = { id: string; name: string; email: string; role: string; isActive?: boolean };
export type LoginResponse = { accessToken: string; user: AdminUser };
export type ShopStatus = 'pending' | 'aktif' | 'ditolak' | 'nonaktif';
export type ShopOwner = { id: string; name: string; email: string; isActive?: boolean };
export type ShopListItem = {
  id: string; name: string; slug: string; description?: string | null; phone?: string | null; address?: string | null;
  nib?: string | null; photoUrl?: string | null; status: ShopStatus; statusReason?: string | null;
  verifiedAt?: string | null; createdAt: string; owner: ShopOwner;
};
export type ShopHistory = { id: string; fromStatus: ShopStatus | null; toStatus: ShopStatus; reason?: string | null; changedBy?: { id: string; name: string } | null; createdAt: string };
export type ShopDetail = ShopListItem & { summary: { productCount: number; orderCount: number }; statusHistory: ShopHistory[] };
export type Category = { id: string; name: string; slug: string; isActive: boolean; productCount: number; createdAt: string };
export type DashboardData = {
  shops: { pending: number; aktif: number; ditolak: number; nonaktif: number; total: number };
  totalOrders: number; omzet: number;
  trend: { date: string; orders: number; omzet: number }[];
  pendingUmkm: { id: string; name: string; slug: string; ownerName: string; createdAt: string }[];
  topShops: { shopId: string; name: string; slug: string; omzet: number; completedOrders: number }[];
};
export type Paginated<T> = { data: T[]; meta: { page: number; limit: number; total: number } };
export type PayoutStatus = 'menunggu' | 'diverifikasi' | 'berhasil' | 'terkirim';
export type PayoutRecord = {
  id: string;
  storeName: string;
  owner: string;
  bank: string;
  account: string;
  method: string;
  netAmount: number;
  commission: number;
  submittedAt: string;
  status: PayoutStatus;
};
export type BatchPayoutResult = {
  processedCount: number;
  processedIds: string[];
  skippedIds: string[];
  totalNet: number;
  totalCommission: number;
  processedAt: string;
};
