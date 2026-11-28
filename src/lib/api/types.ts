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
export type ShopStaff = { id: string; name: string; email: string; role: string; isActive: boolean; createdAt: string };
export type ShopProduct = { id: string; name: string; price: number; stock: number; isActive: boolean; category: { id: string; name: string }; createdAt: string };
export type ShopDetail = ShopListItem & {
  summary: {
    productCount: number;
    orderCount: number;
    revenue: number;
    lastOrderAt: string | null;
    outstandingPayout: number;
  };
  staff: ShopStaff[];
  products: ShopProduct[];
  statusHistory: ShopHistory[];
};
export type Category = { id: string; name: string; slug: string; isActive: boolean; productCount: number; createdAt: string };
export type DashboardData = {
  shops: { pending: number; aktif: number; ditolak: number; nonaktif: number; total: number };
  totalOrders: number; completedOrders: number; omzet: number;
  trend: { date: string; orders: number; omzet: number }[];
  pendingUmkm: { id: string; name: string; slug: string; ownerName: string; createdAt: string }[];
  topShops: { shopId: string; name: string; slug: string; ownerName: string; omzet: number; completedOrders: number }[];
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

export type OrderStatus = 'pending' | 'diproses' | 'selesai' | 'dibatalkan';

export type AdminOrderListItem = {
  id: string;
  code: string;
  shopId: string;
  shopName: string;
  shopSlug: string | null;
  shopOwner: string;
  shopNib: string | null;
  shopPhone: string | null;
  shopAddress: string | null;
  customerId: string;
  customerName: string;
  total: number;
  status: OrderStatus;
  createdAt: string;
};

export type AdminOrderSummary = {
  count: number;
  totalValue: number;
  statusCounts: Record<OrderStatus, number>;
};

export type PaginatedOrders = {
  data: AdminOrderListItem[];
  meta: { page: number; limit: number; total: number };
  summary: AdminOrderSummary;
};

export type AdminOrderItem = {
  id: string;
  name: string;
  qty: number;
  unitPrice: number;
  subtotal: number;
};

export type AdminOrderHistory = {
  id: string;
  fromStatus: OrderStatus | null;
  toStatus: OrderStatus;
  note: string | null;
  changedBy: { id: string; name: string } | null;
  createdAt: string;
};

export type AdminOrderDetail = {
  id: string;
  code: string;
  shop: {
    id: string;
    name: string;
    slug: string;
    nib: string | null;
    phone: string | null;
    address: string | null;
    ownerName: string;
    ownerEmail: string;
  };
  customer: { id: string; name: string };
  items: AdminOrderItem[];
  total: number;
  status: OrderStatus;
  createdAt: string;
  statusHistory: AdminOrderHistory[];
};

export type ManagedUserRole = 'ADMIN' | 'OWNER' | 'STAFF' | 'CUSTOMER';

export type ManagedUser = {
  id: string;
  name: string;
  email: string;
  role: ManagedUserRole;
  isActive: boolean;
  createdAt: string;
  shopId: string | null;
  shopName: string | null;
  shopSlug: string | null;
  phone: string | null;
};

export type UserSummary = {
  total: number;
  roles: Record<ManagedUserRole, number>;
  inactive: number;
  activeAdmins: number;
};

export type PaginatedUsers = {
  data: ManagedUser[];
  meta: { page: number; limit: number; total: number };
  summary: UserSummary;
};

export type AdminLogEntry = {
  id: string;
  admin: { id: string; name: string; email: string };
  action: string;
  targetType: string;
  targetId: string;
  targetName: string | null;
  targetMeta: string | null;
  reason: string | null;
  createdAt: string;
};

export type LogSummary = {
  total: number;
  todayCount: number;
  todayAdmins: number;
};

export type PaginatedLogs = {
  data: AdminLogEntry[];
  meta: { page: number; limit: number; total: number };
  summary: LogSummary;
};

export type FinanceDay = {
  date: string;
  gross: number;
  orders: number;
  completedOrders: number;
  disbursed: number;
  commission: number;
};

export type FinanceActivity = {
  id: string;
  title: string;
  description: string;
  at: string;
  tone: 'success' | 'warning';
  badge?: string;
};

export type FinanceSummary = {
  range: { from: string; to: string; days: number };
  daily: FinanceDay[];
  totals: {
    gross: number;
    orders: number;
    completedOrders: number;
    disbursed: number;
    commission: number;
    averageDaily: number;
    commissionRate: number;
  };
  payouts: {
    total: number;
    readyCount: number;
    readyTotal: number;
    statusCounts: Record<PayoutStatus, number>;
  };
  escrow: { bank: string | null; accountNumber: string | null; outstanding: number };
  activities: FinanceActivity[];
};
