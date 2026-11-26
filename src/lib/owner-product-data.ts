export type ProductStockStatus = 'aman' | 'menipis' | 'habis'
export type ProductEtalaseStatus = 'aktif' | 'nonaktif'

export type OwnerProduct = {
  id: string
  name: string
  sku: string
  category: string
  price: number
  detail: string
  stock: number
  stockUnit: string
  minStock: number
  sold: number
  soldUnit: string
  soldPeriod: string
  etalase: ProductEtalaseStatus
  description?: string
  favorite?: boolean
  seasonal?: boolean
}

export const productCategories = [
  'Kue Basah & Tradisional',
  'Pastry & Roti',
  'Hampers & Paket',
] as const

export const stockAdjustReasons = [
  'Restock produksi',
  'Koreksi stok opname',
  'Produk rusak / kedaluwarsa',
  'Pesanan offline',
  'Retur pelanggan',
] as const

export const ownerProducts: OwnerProduct[] = [
  {
    id: 'prd-001',
    name: 'Kue Lapis Legit Prune Wisman Spesial',
    sku: 'KUE-LLP-001',
    category: 'Kue Basah & Tradisional',
    price: 150_000,
    detail: 'per loyang',
    stock: 23,
    stockUnit: 'loyang',
    minStock: 5,
    sold: 46,
    soldUnit: 'loyang',
    soldPeriod: 'bulan ini',
    etalase: 'aktif',
  },
  {
    id: 'prd-002',
    name: 'Pastel Tutup Panggang Jumbo',
    sku: 'PST-TTP-002',
    category: 'Pastry & Roti',
    price: 75_000,
    detail: 'isi 450g',
    stock: 11,
    stockUnit: 'porsi',
    minStock: 5,
    sold: 32,
    soldUnit: 'porsi',
    soldPeriod: 'bulan ini',
    etalase: 'aktif',
  },
  {
    id: 'prd-003',
    name: 'Risol Rogout Ayam Crispy',
    sku: 'RSL-RGT-003',
    category: 'Kue Basah & Tradisional',
    price: 45_000,
    detail: 'isi 5 pcs/pack',
    stock: 3,
    stockUnit: 'box',
    minStock: 5,
    sold: 68,
    soldUnit: 'box',
    soldPeriod: 'bulan ini',
    etalase: 'aktif',
    favorite: true,
  },
  {
    id: 'prd-004',
    name: 'Brownies Fudgy Almond Sea Salt',
    sku: 'BRN-FDG-004',
    category: 'Pastry & Roti',
    price: 65_000,
    detail: 'ukuran 22x10 sekat',
    stock: 2,
    stockUnit: 'box',
    minStock: 5,
    sold: 28,
    soldUnit: 'box',
    soldPeriod: 'bulan ini',
    etalase: 'aktif',
  },
  {
    id: 'prd-005',
    name: 'Bolu Gulung Keju Spesial',
    sku: 'BLG-KJU-005',
    category: 'Pastry & Roti',
    price: 85_000,
    detail: 'roll panjang 24cm',
    stock: 10,
    stockUnit: 'roll',
    minStock: 4,
    sold: 19,
    soldUnit: 'roll',
    soldPeriod: 'bulan ini',
    etalase: 'aktif',
  },
  {
    id: 'prd-006',
    name: 'Lemper Bakar Ayam Gurih',
    sku: 'LMP-BKR-006',
    category: 'Kue Basah & Tradisional',
    price: 35_000,
    detail: 'isi 5 mika',
    stock: 18,
    stockUnit: 'mika',
    minStock: 6,
    sold: 54,
    soldUnit: 'mika',
    soldPeriod: 'bulan ini',
    etalase: 'aktif',
  },
  {
    id: 'prd-007',
    name: 'Chiffon Pandan Santan Murni',
    sku: 'CHF-PDN-007',
    category: 'Pastry & Roti',
    price: 60_000,
    detail: 'diameter 20cm bulat',
    stock: 6,
    stockUnit: 'box',
    minStock: 4,
    sold: 14,
    soldUnit: 'box',
    soldPeriod: 'bulan ini',
    etalase: 'aktif',
  },
  {
    id: 'prd-008',
    name: 'Kue Lumpur Kentang Keju',
    sku: 'KLU-KTG-008',
    category: 'Kue Basah & Tradisional',
    price: 40_000,
    detail: 'box isi 6 pcs',
    stock: 0,
    stockUnit: 'box',
    minStock: 5,
    sold: 42,
    soldUnit: 'box',
    soldPeriod: 'bulan ini',
    etalase: 'aktif',
  },
  {
    id: 'prd-009',
    name: 'Nastar Wisman Premium Toples',
    sku: 'NST-WSM-009',
    category: 'Hampers & Paket',
    price: 125_000,
    detail: 'toples 500g',
    stock: 15,
    stockUnit: 'toples',
    minStock: 5,
    sold: 0,
    soldUnit: 'toples',
    soldPeriod: 'belum dibuka',
    etalase: 'nonaktif',
    seasonal: true,
  },
  {
    id: 'prd-010',
    name: 'Lapis Surabaya Kenari',
    sku: 'LPR-SRB-010',
    category: 'Kue Basah & Tradisional',
    price: 95_000,
    detail: 'per loyang 20cm',
    stock: 12,
    stockUnit: 'loyang',
    minStock: 5,
    sold: 21,
    soldUnit: 'loyang',
    soldPeriod: 'bulan ini',
    etalase: 'aktif',
  },
  {
    id: 'prd-011',
    name: 'Kroket Kentang Isi Ragout',
    sku: 'KRK-KTG-011',
    category: 'Kue Basah & Tradisional',
    price: 30_000,
    detail: 'isi 10 pcs',
    stock: 26,
    stockUnit: 'pack',
    minStock: 10,
    sold: 74,
    soldUnit: 'pack',
    soldPeriod: 'bulan ini',
    etalase: 'aktif',
  },
  {
    id: 'prd-012',
    name: 'Tumpeng Mini Nasi Kuning',
    sku: 'TMP-NSK-012',
    category: 'Hampers & Paket',
    price: 150_000,
    detail: 'set lengkap 1 porsi',
    stock: 8,
    stockUnit: 'set',
    minStock: 3,
    sold: 12,
    soldUnit: 'set',
    soldPeriod: 'bulan ini',
    etalase: 'aktif',
  },
]

const productStore: OwnerProduct[] = [...ownerProducts]

export function getOwnerProducts(): OwnerProduct[] {
  return [...productStore]
}

export function addOwnerProduct(product: OwnerProduct) {
  productStore.unshift(product)
}

export function updateOwnerProduct(product: OwnerProduct) {
  const index = productStore.findIndex((item) => item.id === product.id)
  if (index >= 0) productStore[index] = { ...product }
}

export function getProductStockStatus(product: OwnerProduct): ProductStockStatus {
  if (product.stock <= 0) return 'habis'
  if (product.stock <= product.minStock) return 'menipis'
  return 'aman'
}

export const stockStatusMeta: Record<
  ProductStockStatus,
  { label: string; className: string; barClassName: string }
> = {
  aman: {
    label: 'Stok Aman',
    className: 'bg-[#d9f7ea] text-primary',
    barClassName: 'bg-primary',
  },
  menipis: {
    label: 'Menipis',
    className: 'bg-[#fdf0d3] text-[#b45309]',
    barClassName: 'bg-[#f0a52b]',
  },
  habis: {
    label: 'Stok Habis',
    className: 'bg-[#fde7e7] text-[#dc2626]',
    barClassName: 'bg-[#ef4444]',
  },
}
