export type FinanceAllocationGroupId =
  | 'bahan-baku'
  | 'kemasan'
  | 'operasional'
  | 'lainnya'

export type FinanceCategoryId =
  | 'bahan-baku'
  | 'kemasan'
  | 'operasional'
  | 'gaji'
  | 'sewa'
  | 'pemasaran'
  | 'lainnya'

export type FinancePaymentMethodId = 'kas' | 'transfer' | 'qris'

export type FinanceTransactionType = 'expense' | 'income'

export type FinanceTransactionSource = 'manual' | 'otomatis'

export type FinanceTransaction = {
  id: string
  reference: string
  type: FinanceTransactionType
  title: string
  detail?: string
  vendor?: string
  invoiceNumber?: string
  amount: number
  categoryId: FinanceCategoryId | null
  source: FinanceTransactionSource
  date: string
  time: string
  paymentMethodId: FinancePaymentMethodId | null
  paymentMethod: string
}

export const financeAllocationGroups: {
  id: FinanceAllocationGroupId
  label: string
  barClassName: string
  dotClassName: string
}[] = [
  {
    id: 'bahan-baku',
    label: 'Bahan Baku',
    barClassName: 'bg-[#0f766e]',
    dotClassName: 'bg-[#0f766e]',
  },
  {
    id: 'kemasan',
    label: 'Kemasan',
    barClassName: 'bg-[#5fbfae]',
    dotClassName: 'bg-[#5fbfae]',
  },
  {
    id: 'operasional',
    label: 'Operasional',
    barClassName: 'bg-[#99d8cb]',
    dotClassName: 'bg-[#99d8cb]',
  },
  {
    id: 'lainnya',
    label: 'Gaji & Lainnya',
    barClassName: 'bg-[#cbd5e1]',
    dotClassName: 'bg-[#cbd5e1]',
  },
]

export const financeCategoryMeta: Record<
  FinanceCategoryId,
  { label: string; group: FinanceAllocationGroupId }
> = {
  'bahan-baku': { label: 'Bahan Baku', group: 'bahan-baku' },
  kemasan: { label: 'Kemasan', group: 'kemasan' },
  operasional: { label: 'Operasional', group: 'operasional' },
  gaji: { label: 'Gaji & Upah', group: 'lainnya' },
  sewa: { label: 'Sewa & Utilitas', group: 'lainnya' },
  pemasaran: { label: 'Pemasaran', group: 'lainnya' },
  lainnya: { label: 'Lainnya', group: 'lainnya' },
}

export const financeCategories = (
  Object.entries(financeCategoryMeta) as [
    FinanceCategoryId,
    { label: string; group: FinanceAllocationGroupId },
  ][]
).map(([id, meta]) => ({ id, ...meta }))

export const financePaymentMethods: {
  id: FinancePaymentMethodId
  label: string
  shortLabel: string
}[] = [
  { id: 'kas', label: 'Kas Toko / Tunai', shortLabel: 'Kas Toko / Tunai' },
  { id: 'transfer', label: 'Transfer Bank', shortLabel: 'Transfer Bank' },
  { id: 'qris', label: 'QRIS / E-Wallet', shortLabel: 'QRIS / E-Wallet' },
]

export const financeQuickAmounts = [50000, 100000, 250000, 500000, 1_000_000]

export const financeInitialAllocation: Record<FinanceAllocationGroupId, number> = {
  'bahan-baku': 1_848_000,
  kemasan: 693_000,
  operasional: 539_000,
  lainnya: 770_000,
}

export const financeInitialManualCount = 16

export const financePeriodBase: Record<
  'hari' | '7d' | 'bulan' | 'tahun',
  { income: number; expense: number; orders: number }
> = {
  hari: { income: 610_000, expense: 235_000, orders: 2 },
  '7d': { income: 3_120_000, expense: 1_175_000, orders: 9 },
  bulan: { income: 12_450_000, expense: 3_850_000, orders: 38 },
  tahun: { income: 128_400_000, expense: 41_650_000, orders: 412 },
}

export const financeLiquidityAccounts: { id: string; label: string; amount: number }[] = [
  { id: 'bank', label: 'BCA Usaha', amount: 6_950_000 },
  { id: 'kas', label: 'Kas Tunai Laci Toko', amount: 1_650_000 },
]

/**
 * Pola arus kas harian 30 hari terakhir (dalam ribuan rupiah). Nilai dipakai
 * sebagai bentuk tren, lalu diskalakan ke total periode pada halaman keuangan.
 */
export const financeCashflowTrend = {
  income: [
    420, 380, 460, 520, 390, 410, 610, 290, 350, 400, 450, 480, 510, 440, 390,
    470, 530, 620, 380, 420, 460, 540, 720, 1480, 640, 520, 480, 430, 400, 610,
  ],
  expense: [
    120, 90, 130, 150, 100, 110, 210, 80, 105, 115, 125, 140, 135, 105, 95, 120,
    145, 230, 90, 110, 125, 155, 260, 350, 175, 140, 130, 120, 105, 190,
  ],
}

function toLocalIsoDate(date: Date) {
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  return `${year}-${month}-${day}`
}

function isoDaysAgo(days: number) {
  const date = new Date()
  date.setDate(date.getDate() - days)
  return toLocalIsoDate(date)
}

function reference(prefix: string, daysAgo: number, sequence: string) {
  return `${prefix}-${isoDaysAgo(daysAgo).replaceAll('-', '')}-${sequence}`
}

function orderReference(daysAgo: number, sequence: string) {
  return reference('RTS', daysAgo, sequence)
}

export const financeInitialTransactions: FinanceTransaction[] = [
  {
    id: 'fin-exp-001',
    reference: reference('EXP', 0, '003'),
    type: 'expense',
    title: 'Beli Mentega Wijsman 2 Kaleng & Tepung Cakra 10kg',
    detail: 'Toko Bahan Kue Wahab (Nota #: 8941)',
    amount: 680_000,
    categoryId: 'bahan-baku',
    source: 'manual',
    date: isoDaysAgo(0),
    time: '09:15 WIB',
    paymentMethodId: 'kas',
    paymentMethod: 'Kas Toko / Tunai',
  },
  {
    id: 'fin-inc-001',
    reference: orderReference(0, '001'),
    type: 'income',
    title: 'Pesanan Selesai – Siti Rahmawati',
    detail: '1x Lapis Legit Prune • 6x Pastel Tutup Spesial',
    amount: 360_000,
    categoryId: null,
    source: 'otomatis',
    date: isoDaysAgo(0),
    time: '11:30 WIB',
    paymentMethodId: 'transfer',
    paymentMethod: 'Online Transfer',
  },
  {
    id: 'fin-exp-002',
    reference: reference('EXP', 1, '002'),
    type: 'expense',
    title: 'Isi Ulang Gas LPG 12kg',
    detail: '2 Tabung • Pangkalan Gas Berkah',
    amount: 350_000,
    categoryId: 'operasional',
    source: 'manual',
    date: isoDaysAgo(1),
    time: '16:45 WIB',
    paymentMethodId: 'kas',
    paymentMethod: 'Kas Toko / Tunai',
  },
  {
    id: 'fin-inc-002',
    reference: reference('POS', 1, '009'),
    type: 'income',
    title: 'Penjualan Langsung Toko (Kasir POS)',
    detail: '3x Pastel Panggang • 2x Pisang Molen',
    amount: 125_000,
    categoryId: null,
    source: 'otomatis',
    date: isoDaysAgo(1),
    time: '14:10 WIB',
    paymentMethodId: 'kas',
    paymentMethod: 'Kasir POS',
  },
  {
    id: 'fin-exp-003',
    reference: reference('EXP', 2, '001'),
    type: 'expense',
    title: 'Cetak Box Hard Cover Hampers Idul Adha',
    detail: 'Percetakan Sinar Grafika (100 pcs + foil)',
    amount: 693_000,
    categoryId: 'kemasan',
    source: 'manual',
    date: isoDaysAgo(2),
    time: '10:00 WIB',
    paymentMethodId: 'transfer',
    paymentMethod: 'Transfer Bank',
  },
  {
    id: 'fin-inc-003',
    reference: orderReference(2, '004'),
    type: 'income',
    title: 'Pesanan Selesai – PT Bina Nusantara (Catering)',
    detail: '25 Box Snack • 15 Kotak Kue Tradisional',
    amount: 1_250_000,
    categoryId: null,
    source: 'otomatis',
    date: isoDaysAgo(2),
    time: '08:20 WIB',
    paymentMethodId: 'qris',
    paymentMethod: 'QRIS Toko',
  },
  {
    id: 'fin-exp-004',
    reference: reference('EXP', 3, '004'),
    type: 'expense',
    title: 'Gaji Harian Staf Produksi',
    detail: '3 staf • Minggu ke-4',
    amount: 770_000,
    categoryId: 'gaji',
    source: 'manual',
    date: isoDaysAgo(3),
    time: '17:05 WIB',
    paymentMethodId: 'kas',
    paymentMethod: 'Kas Toko / Tunai',
  },
  {
    id: 'fin-exp-005',
    reference: reference('EXP', 4, '002'),
    type: 'expense',
    title: 'Kotak Kue Dus Premium & Paper Bag',
    detail: 'Toko Kemasan Jaya (50 set)',
    amount: 180_000,
    categoryId: 'kemasan',
    source: 'manual',
    date: isoDaysAgo(4),
    time: '09:15 WIB',
    paymentMethodId: 'kas',
    paymentMethod: 'Kas Toko / Tunai',
  },
  {
    id: 'fin-inc-004',
    reference: orderReference(4, '002'),
    type: 'income',
    title: 'Pesanan Selesai – Andi Wijaya',
    detail: '2x Brownies Kukus • 1x Lapis Surabaya',
    amount: 650_000,
    categoryId: null,
    source: 'otomatis',
    date: isoDaysAgo(4),
    time: '13:40 WIB',
    paymentMethodId: 'transfer',
    paymentMethod: 'Online Transfer',
  },
  {
    id: 'fin-exp-006',
    reference: reference('EXP', 5, '003'),
    type: 'expense',
    title: 'Isi Ulang Gas LPG 12kg & Air Mineral',
    detail: '1 Tabung • Depot Air Minum Sehat',
    amount: 235_000,
    categoryId: 'operasional',
    source: 'manual',
    date: isoDaysAgo(5),
    time: '16:40 WIB',
    paymentMethodId: 'qris',
    paymentMethod: 'QRIS / E-Wallet',
  },
  {
    id: 'fin-exp-007',
    reference: reference('EXP', 6, '001'),
    type: 'expense',
    title: 'Beli Keju Cream & Susu Kental Manis',
    detail: 'Toko Bahan Kue Wahab (Nota #: 8874)',
    amount: 495_000,
    categoryId: 'bahan-baku',
    source: 'manual',
    date: isoDaysAgo(6),
    time: '08:50 WIB',
    paymentMethodId: 'kas',
    paymentMethod: 'Kas Toko / Tunai',
  },
  {
    id: 'fin-exp-008',
    reference: reference('EXP', 7, '005'),
    type: 'expense',
    title: 'Listrik & Air Bulan Ini',
    detail: 'Tagihan PLN & PDAM • Dapur produksi',
    amount: 300_000,
    categoryId: 'sewa',
    source: 'manual',
    date: isoDaysAgo(7),
    time: '10:30 WIB',
    paymentMethodId: 'transfer',
    paymentMethod: 'Transfer Bank',
  },
  {
    id: 'fin-inc-005',
    reference: orderReference(8, '006'),
    type: 'income',
    title: 'Pesanan Selesai – Rina Kartika',
    detail: '4x Bolu Pandan • 2x Kue Lumpur',
    amount: 480_000,
    categoryId: null,
    source: 'otomatis',
    date: isoDaysAgo(8),
    time: '15:25 WIB',
    paymentMethodId: 'qris',
    paymentMethod: 'QRIS Toko',
  },
  {
    id: 'fin-exp-009',
    reference: reference('EXP', 9, '002'),
    type: 'expense',
    title: 'Cetak Stiker & Brosur Promo',
    detail: 'Percetakan Sinar Grafika (200 lembar)',
    amount: 150_000,
    categoryId: 'pemasaran',
    source: 'manual',
    date: isoDaysAgo(9),
    time: '11:20 WIB',
    paymentMethodId: 'kas',
    paymentMethod: 'Kas Toko / Tunai',
  },
]
