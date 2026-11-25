export type TrendPoint = {
  label: string
  omzet: number
  orders: number
}

export type PendingUmkm = {
  slug: string
  name: string
  category: string
  owner: string
  waiting: string
}

export type TopShop = {
  rank: number
  name: string
  location: string
  nib: string
  category: string
  orders: number
  omzet: number
}

const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']

export const trend7Hari: TrendPoint[] = [
  { label: '17 Nov', omzet: 46, orders: 32 },
  { label: '18 Nov', omzet: 52, orders: 36 },
  { label: '19 Nov', omzet: 48, orders: 31 },
  { label: '20 Nov', omzet: 61, orders: 42 },
  { label: '21 Nov', omzet: 58, orders: 39 },
  { label: '22 Nov', omzet: 66, orders: 46 },
  { label: 'Hari Ini', omzet: 74, orders: 51 },
]

export const trend30Hari: TrendPoint[] = Array.from({ length: 30 }, (_, index) => {
  const date = new Date(2026, 9, 25 + index)
  const isToday = index === 29

  return {
    label: isToday ? 'Hari Ini' : `${date.getDate()} ${monthLabels[date.getMonth()]}`,
    omzet: Math.round(46 + index * 0.55 + Math.sin(index / 2.2) * 8),
    orders: Math.round(30 + index * 0.35 + Math.sin(index / 3.1) * 5),
  }
})

export const pendingUmkm: PendingUmkm[] = [
  {
    slug: 'warung-bu-sari',
    name: 'Warung Bu Sari',
    category: 'Kuliner & Makanan Basah',
    owner: 'Sari Wulandari',
    waiting: '2 jam lalu',
  },
  {
    slug: 'kripik-tempe-barokah',
    name: 'Kripik Tempe Barokah',
    category: 'Camilan Tradisional',
    owner: 'Ahmad Subagyo',
    waiting: '5 jam lalu',
  },
  {
    slug: 'batik-sekar-wangi',
    name: 'Batik Sekar Wangi',
    category: 'Fashion & Tekstil',
    owner: 'Sekar Ayu',
    waiting: '1 hari lalu',
  },
]

export const topShops: TopShop[] = [
  {
    rank: 1,
    name: 'Toko Berkah Jaya',
    location: 'Kudus, Jawa Tengah',
    nib: '9120003412',
    category: 'Sembako & Pangan',
    orders: 44,
    omzet: 4_200_000,
  },
  {
    rank: 2,
    name: 'Warung Sambal Maknyus',
    location: 'Surabaya, Jawa Timur',
    nib: '8129038102',
    category: 'Kuliner Cepat Saji',
    orders: 31,
    omzet: 3_100_000,
  },
  {
    rank: 3,
    name: 'Tenun Ikat Lestari',
    location: 'Jepara, Jawa Tengah',
    nib: '1029482711',
    category: 'Kriya & Kerajinan',
    orders: 18,
    omzet: 2_450_000,
  },
  {
    rank: 4,
    name: 'Kopi Lereng Merapi',
    location: 'Sleman, D.I. Yogyakarta',
    nib: '7362910482',
    category: 'Minuman Olahan',
    orders: 22,
    omzet: 1_620_000,
  },
  {
    rank: 5,
    name: 'Minyak Kelapa Alami',
    location: 'Bantul, D.I. Yogyakarta',
    nib: '5529103847',
    category: 'Herbal & Kesehatan',
    orders: 13,
    omzet: 1_080_000,
  },
]
