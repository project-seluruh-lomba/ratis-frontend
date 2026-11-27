import type { OwnerStoreStatus } from './owner-auth'

export type OwnerTrendPoint = {
  label: string
  omzet: number
}

export const ownerStatusMeta: Record<
  OwnerStoreStatus,
  { label: string; badgeClassName: string; dotClassName: string }
> = {
  pending: {
    label: 'Menunggu Verifikasi',
    badgeClassName: 'bg-[#fef3c7] text-[#b45309]',
    dotClassName: 'bg-[#f59e0b]',
  },
  ditolak: {
    label: 'Ditolak',
    badgeClassName: 'bg-[#fee2e2] text-[#b91c1c]',
    dotClassName: 'bg-[#ef4444]',
  },
  aktif: {
    label: 'Aktif',
    badgeClassName: 'bg-[#dcfce7] text-[#15803d]',
    dotClassName: 'bg-[#22c55e]',
  },
  nonaktif: {
    label: 'Nonaktif',
    badgeClassName: 'bg-[#e2e8f0] text-[#475569]',
    dotClassName: 'bg-slate-400',
  },
}

export const ownerSalesTrend7: OwnerTrendPoint[] = [
  { label: 'Sen', omzet: 190000 },
  { label: 'Sel', omzet: 210000 },
  { label: 'Rab', omzet: 250000 },
  { label: 'Kam', omzet: 265000 },
  { label: 'Jum', omzet: 350000 },
  { label: 'Sab', omzet: 580000 },
  { label: 'Min', omzet: 455000 },
]

export const ownerSalesTrend30: OwnerTrendPoint[] = Array.from(
  { length: 30 },
  (_, index) => {
    const wave = Math.sin(index / 3.2) * 90000 + Math.cos(index / 1.7) * 40000
    const spike = index === 20 ? 260000 : 0
    const value = Math.max(120000, 250000 + wave + spike)
    return {
      label: `${index + 1}`,
      omzet: Math.round(value / 10000) * 10000,
    }
  },
)

export type OwnerProductVisual = 'lapis' | 'pastel' | 'risol' | 'brownies'

export type OwnerTopProduct = {
  id: string
  name: string
  sold: number
  remaining: number
  unit: string
  revenue: string
  rank: number
  visual: OwnerProductVisual
}

export const ownerTopProducts: OwnerTopProduct[] = [
  {
    id: 'kue-lapis-legit',
    name: 'Kue Lapis Legit',
    sold: 48,
    remaining: 12,
    unit: 'pcs',
    revenue: 'Rp 7,2 jt',
    rank: 1,
    visual: 'lapis',
  },
  {
    id: 'pastel-tutup',
    name: 'Pastel Tutup',
    sold: 35,
    remaining: 20,
    unit: 'porsi',
    revenue: 'Rp 1,57 jt',
    rank: 2,
    visual: 'pastel',
  },
  {
    id: 'risol-rogout',
    name: 'Risol Rogout Ayam',
    sold: 28,
    remaining: 8,
    unit: 'pcs',
    revenue: 'Rp 420 rb',
    rank: 3,
    visual: 'risol',
  },
  {
    id: 'brownies-fudgy',
    name: 'Brownies Fudgy Almond',
    sold: 22,
    remaining: 15,
    unit: 'box',
    revenue: 'Rp 1,1 jt',
    rank: 4,
    visual: 'brownies',
  },
]

export type OwnerOrderStatus = 'pending' | 'diproses' | 'selesai' | 'dibatalkan'

export type OwnerOrder = {
  id: string
  code: string
  time: string
  customer: string
  items: string[]
  fulfillment: string
  total: number
  status: OwnerOrderStatus
}

export const ownerOrdersNeedingAction: OwnerOrder[] = [
  {
    id: 'ord-001',
    code: 'RTS-20261123-001',
    time: '10:15 WIB',
    customer: 'Siti Rahmawati',
    items: ['2x Kue Lapis Legit'],
    fulfillment: 'Ambil di Toko (Pick-up)',
    total: 300000,
    status: 'pending',
  },
  {
    id: 'ord-002',
    code: 'RTS-20261123-002',
    time: '09:40 WIB',
    customer: 'Budi Santoso',
    items: ['1x Pastel Tutup', '2x Risol Rogout Ayam'],
    fulfillment: 'Kurir Instan (GoSend)',
    total: 75000,
    status: 'diproses',
  },
  {
    id: 'ord-003',
    code: 'RTS-20261123-003',
    time: '08:30 WIB',
    customer: 'Maya Anggraini',
    items: ['1x Brownies Fudgy Almond'],
    fulfillment: 'Ambil di Toko (Pick-up)',
    total: 50000,
    status: 'diproses',
  },
]

export type OwnerLowStockItem = {
  id: string
  name: string
  category: string
  remaining: number
  minimum: number
  unit: string
  level: 'kritis' | 'hampir'
}

export const ownerLowStockItems: OwnerLowStockItem[] = [
  {
    id: 'risol-rogout-ayam',
    name: 'Risol Rogout Ayam',
    category: 'Gorengan & Snack',
    remaining: 4,
    minimum: 10,
    unit: 'pcs',
    level: 'kritis',
  },
  {
    id: 'bumbu-sambal-roa',
    name: 'Bumbu Sambal Roa Botol',
    category: 'Pelengkap & Saus',
    remaining: 2,
    minimum: 5,
    unit: 'botol',
    level: 'hampir',
  },
]

export type OwnerNotification = {
  id: string
  title: string
  message: string
  time: string
  to: string
}

export const ownerNotifications: OwnerNotification[] = [
  {
    id: 'notif-001',
    title: 'Pesanan baru masuk',
    message: 'RTS-20261123-001 • Rp 300.000',
    time: '10 menit lalu',
    to: '/owner/pesanan',
  },
  {
    id: 'notif-002',
    title: 'Stok menipis',
    message: 'Risol Rogout Ayam tersisa 4 pcs',
    time: '32 menit lalu',
    to: '/owner/produk',
  },
  {
    id: 'notif-003',
    title: 'Pesanan sedang diproses',
    message: 'RTS-20261123-002 • Rp 75.000',
    time: '1 jam lalu',
    to: '/owner/pesanan',
  },
  {
    id: 'notif-004',
    title: 'Target omzet tercapai',
    message: '70% target bulan ini sudah tercapai',
    time: '3 jam lalu',
    to: '/owner/laporan-keuangan',
  },
  {
    id: 'notif-005',
    title: 'Stok menipis',
    message: 'Bumbu Sambal Roa Botol tersisa 2 botol',
    time: 'Kemarin',
    to: '/owner/produk',
  },
]
