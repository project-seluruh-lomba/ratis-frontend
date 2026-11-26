export type StorefrontCategoryId = 'semua' | 'kue-basah' | 'pastry' | 'hampers'

export type StorefrontProductCategory = Exclude<StorefrontCategoryId, 'semua'>

export type StorefrontVisual = 'cake' | 'cookie' | 'soup' | 'package'

export type StorefrontProduct = {
  id: string
  name: string
  categoryId: StorefrontProductCategory
  price: number
  originalPrice?: number
  rating: number
  sold: number
  stock: number
  unit: string
  visual: StorefrontVisual
}

export const storefrontCategories: {
  id: StorefrontCategoryId
  label: string
}[] = [
  { id: 'semua', label: 'Semua Produk' },
  { id: 'kue-basah', label: 'Kue Basah & Tradisional' },
  { id: 'pastry', label: 'Pastry & Roti' },
  { id: 'hampers', label: 'Hampers & Paket' },
]

export const storefrontProducts: StorefrontProduct[] = [
  {
    id: 'lapis-legit-premium-prune',
    name: 'Lapis Legit Premium Prune',
    categoryId: 'kue-basah',
    price: 85500,
    originalPrice: 99000,
    rating: 4.9,
    sold: 48,
    stock: 12,
    unit: 'loyang',
    visual: 'cake',
  },
  {
    id: 'pastel-tutup-spesial',
    name: 'Pastel Tutup Spesial',
    categoryId: 'kue-basah',
    price: 45000,
    rating: 4.8,
    sold: 35,
    stock: 20,
    unit: 'porsi',
    visual: 'cookie',
  },
  {
    id: 'risol-rogout-ayam',
    name: 'Risol Rogout Ayam',
    categoryId: 'pastry',
    price: 15000,
    rating: 4.7,
    sold: 28,
    stock: 4,
    unit: 'pcs',
    visual: 'soup',
  },
  {
    id: 'brownies-fudgy-almond',
    name: 'Brownies Fudgy Almond',
    categoryId: 'pastry',
    price: 55000,
    rating: 4.8,
    sold: 22,
    stock: 15,
    unit: 'box',
    visual: 'cookie',
  },
  {
    id: 'bolu-tape-keju',
    name: 'Bolu Tape Keju',
    categoryId: 'kue-basah',
    price: 65000,
    rating: 4.7,
    sold: 19,
    stock: 9,
    unit: 'loyang',
    visual: 'cake',
  },
  {
    id: 'nastar-keju-premium',
    name: 'Nastar Keju Premium',
    categoryId: 'hampers',
    price: 75000,
    rating: 4.9,
    sold: 31,
    stock: 24,
    unit: 'toples',
    visual: 'cookie',
  },
  {
    id: 'pie-susu-bali',
    name: 'Pie Susu Bali',
    categoryId: 'pastry',
    price: 35000,
    rating: 4.6,
    sold: 17,
    stock: 18,
    unit: 'box',
    visual: 'cake',
  },
  {
    id: 'kroket-kentang-spesial',
    name: 'Kroket Kentang Spesial',
    categoryId: 'pastry',
    price: 12000,
    rating: 4.5,
    sold: 14,
    stock: 30,
    unit: 'pcs',
    visual: 'soup',
  },
  {
    id: 'lapis-surabaya-kenari',
    name: 'Lapis Surabaya Kenari',
    categoryId: 'kue-basah',
    price: 95000,
    rating: 4.8,
    sold: 16,
    stock: 7,
    unit: 'loyang',
    visual: 'cake',
  },
  {
    id: 'sosis-solo-premium',
    name: 'Sosis Solo Premium',
    categoryId: 'kue-basah',
    price: 8000,
    rating: 4.6,
    sold: 12,
    stock: 25,
    unit: 'pcs',
    visual: 'cookie',
  },
  {
    id: 'paket-hampers-lebaran',
    name: 'Paket Hampers Lebaran',
    categoryId: 'hampers',
    price: 185000,
    rating: 4.9,
    sold: 9,
    stock: 0,
    unit: 'paket',
    visual: 'package',
  },
  {
    id: 'sagu-keju-renyah',
    name: 'Sagu Keju Renyah',
    categoryId: 'hampers',
    price: 45000,
    rating: 4.7,
    sold: 8,
    stock: 11,
    unit: 'toples',
    visual: 'cookie',
  },
]
