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
  type: FinanceTransactionType
  title: string
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
    label: 'Lainnya',
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

export const financeQuickAmounts = [50000, 150000, 350000, 500000]

export const financeInitialAllocation: Record<FinanceAllocationGroupId, number> = {
  'bahan-baku': 1_495_000,
  kemasan: 345_000,
  operasional: 276_000,
  lainnya: 184_000,
}

export const financeInitialManualCount = 12

export const financePeriodBase: Record<
  '7d' | '30d' | 'bulan',
  { income: number; expense: number; orders: number }
> = {
  '7d': { income: 2_975_000, expense: 975_000, orders: 8 },
  '30d': { income: 8_750_000, expense: 2_300_000, orders: 28 },
  bulan: { income: 8_750_000, expense: 2_300_000, orders: 28 },
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

function orderCode(daysAgo: number, sequence: string) {
  return `RTS-${isoDaysAgo(daysAgo).replaceAll('-', '')}-${sequence}`
}

export const financeInitialTransactions: FinanceTransaction[] = [
  {
    id: 'fin-exp-001',
    type: 'expense',
    title: 'Mentega Wijsman 2 Kaleng',
    amount: 350_000,
    categoryId: 'bahan-baku',
    source: 'manual',
    date: isoDaysAgo(0),
    time: '11:30 WIB',
    paymentMethodId: 'kas',
    paymentMethod: 'Kas Toko / Tunai',
  },
  {
    id: 'fin-inc-001',
    type: 'income',
    title: `Pesanan #${orderCode(0, '004')}`,
    amount: 300_000,
    categoryId: null,
    source: 'otomatis',
    date: isoDaysAgo(0),
    time: '10:15 WIB',
    paymentMethodId: 'transfer',
    paymentMethod: 'Online Transfer',
  },
  {
    id: 'fin-exp-002',
    type: 'expense',
    title: 'Kotak Kue Dus Premium & Paper Bag',
    amount: 180_000,
    categoryId: 'kemasan',
    source: 'manual',
    date: isoDaysAgo(1),
    time: '09:15 WIB',
    paymentMethodId: 'kas',
    paymentMethod: 'Kas Toko / Tunai',
  },
  {
    id: 'fin-exp-003',
    type: 'expense',
    title: 'Isi Ulang Gas LPG 12kg & Air Mineral',
    amount: 235_000,
    categoryId: 'operasional',
    source: 'manual',
    date: isoDaysAgo(2),
    time: '16:40 WIB',
    paymentMethodId: 'qris',
    paymentMethod: 'QRIS / E-Wallet',
  },
  {
    id: 'fin-inc-002',
    type: 'income',
    title: `Pesanan #${orderCode(2, '002')}`,
    amount: 735_000,
    categoryId: null,
    source: 'otomatis',
    date: isoDaysAgo(2),
    time: '14:20 WIB',
    paymentMethodId: 'qris',
    paymentMethod: 'QRIS Toko',
  },
]
