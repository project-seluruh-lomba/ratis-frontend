export type CategoryStatus = 'aktif' | 'nonaktif'

export type CategoryIconKey =
  | 'kuliner'
  | 'kriya'
  | 'fashion'
  | 'minuman'
  | 'herbal'
  | 'sembako'
  | 'elektronik'
  | 'dekorasi'
  | 'bayi'
  | 'pertanian'
  | 'peternakan'
  | 'aksesoris'
  | 'ibadah'
  | 'otomotif'
  | 'alat-tulis'
  | 'jasa'
  | 'furnitur'
  | 'logam'
  | 'lainnya'

export type CategoryRecord = {
  id: string
  name: string
  description: string
  slug: string
  productCount: number
  createdAt: string
  updatedAt: string
  status: CategoryStatus
  icon: CategoryIconKey
}

export const categoryMonthlyGrowth = 142

function daysAgoAt(days: number, hour: number, minute: number) {
  const date = new Date()
  date.setDate(date.getDate() - days)
  date.setHours(hour, minute, 0, 0)
  return date.toISOString()
}

export const categoryRecords: CategoryRecord[] = [
  {
    id: 'cat-kuliner',
    name: 'Kuliner & Makanan Basah',
    description: 'Aneka penganan basah, kue tradisional, olahan dapur',
    slug: 'kuliner-makanan-basah',
    productCount: 384,
    createdAt: '2024-01-12T09:00:00+07:00',
    updatedAt: '2024-10-18T14:10:00+07:00',
    status: 'aktif',
    icon: 'kuliner',
  },
  {
    id: 'cat-kriya',
    name: 'Kriya & Kerajinan',
    description: 'Anyaman rotan, keramik tanah liat, ukiran kayu jati',
    slug: 'kriya-kerajinan',
    productCount: 241,
    createdAt: '2024-01-15T09:00:00+07:00',
    updatedAt: '2024-09-02T09:22:00+07:00',
    status: 'aktif',
    icon: 'kriya',
  },
  {
    id: 'cat-fashion',
    name: 'Fashion & Batik',
    description: 'Kain tenun ikat, busana batik tulis nusantara',
    slug: 'fashion-batik',
    productCount: 198,
    createdAt: '2024-01-20T09:00:00+07:00',
    updatedAt: daysAgoAt(1, 16, 45),
    status: 'aktif',
    icon: 'fashion',
  },
  {
    id: 'cat-minuman',
    name: 'Minuman Olahan',
    description: 'Sirup buah lokal, bubuk kopi nusantara, sari kedelai',
    slug: 'minuman-olahan',
    productCount: 162,
    createdAt: '2024-01-22T09:00:00+07:00',
    updatedAt: '2024-10-11T11:05:00+07:00',
    status: 'aktif',
    icon: 'minuman',
  },
  {
    id: 'cat-herbal',
    name: 'Herbal & Kesehatan',
    description: 'Jamu instan kemasan, minyak atsiri, aromaterapi',
    slug: 'herbal-kesehatan',
    productCount: 115,
    createdAt: '2024-02-01T09:00:00+07:00',
    updatedAt: '2024-10-05T08:30:00+07:00',
    status: 'aktif',
    icon: 'herbal',
  },
  {
    id: 'cat-sembako',
    name: 'Bahan Pokok & Sembako',
    description: 'Beras organik binaan, gula aren semut, minyak kelapa',
    slug: 'bahan-pokok-sembako',
    productCount: 89,
    createdAt: '2024-02-14T09:00:00+07:00',
    updatedAt: '2024-09-15T13:40:00+07:00',
    status: 'aktif',
    icon: 'sembako',
  },
  {
    id: 'cat-elektronik',
    name: 'Elektronik Rumah Tangga',
    description: 'Kompor hemat energi, perakitan lokal',
    slug: 'elektronik-rumah-tangga',
    productCount: 0,
    createdAt: '2024-03-05T09:00:00+07:00',
    updatedAt: '2024-10-01T10:15:00+07:00',
    status: 'nonaktif',
    icon: 'elektronik',
  },
  {
    id: 'cat-dekorasi',
    name: 'Dekorasi & Interior',
    description: 'Lampu hias, tekstil rumah, aksen dekorasi kayu',
    slug: 'dekorasi-interior',
    productCount: 43,
    createdAt: '2024-03-12T09:00:00+07:00',
    updatedAt: '2024-08-12T10:20:00+07:00',
    status: 'aktif',
    icon: 'dekorasi',
  },
  {
    id: 'cat-bayi',
    name: 'Perlengkapan Bayi & Anak',
    description: 'Pakaian bayi, mainan edukatif, perlengkapan menyusui',
    slug: 'perlengkapan-bayi-anak',
    productCount: 42,
    createdAt: '2024-03-20T09:00:00+07:00',
    updatedAt: '2024-09-03T14:05:00+07:00',
    status: 'aktif',
    icon: 'bayi',
  },
  {
    id: 'cat-pertanian',
    name: 'Pertanian & Bibit Unggul',
    description: 'Bibit sayur, benih buah, media tanam organik',
    slug: 'pertanian-bibit-unggul',
    productCount: 36,
    createdAt: '2024-04-02T09:00:00+07:00',
    updatedAt: '2024-09-21T09:15:00+07:00',
    status: 'aktif',
    icon: 'pertanian',
  },
  {
    id: 'cat-peternakan',
    name: 'Peternakan & Perikanan',
    description: 'Ikan segar, telur ayam kampung, pakan ternak',
    slug: 'peternakan-perikanan',
    productCount: 28,
    createdAt: '2024-04-18T09:00:00+07:00',
    updatedAt: '2024-10-07T16:20:00+07:00',
    status: 'aktif',
    icon: 'peternakan',
  },
  {
    id: 'cat-aksesoris',
    name: 'Aksesoris & Perhiasan',
    description: 'Perhiasan perak, manik-manik, aksesori etnik',
    slug: 'aksesoris-perhiasan',
    productCount: 24,
    createdAt: '2024-05-06T09:00:00+07:00',
    updatedAt: '2024-10-14T11:30:00+07:00',
    status: 'aktif',
    icon: 'aksesoris',
  },
  {
    id: 'cat-ibadah',
    name: 'Perlengkapan Ibadah',
    description: 'Sajadah, mukena, tasbih, perlengkapan ibadah',
    slug: 'perlengkapan-ibadah',
    productCount: 20,
    createdAt: '2024-05-21T09:00:00+07:00',
    updatedAt: '2024-09-28T13:25:00+07:00',
    status: 'aktif',
    icon: 'ibadah',
  },
  {
    id: 'cat-otomotif',
    name: 'Otomotif & Aksesoris',
    description: 'Sparepart motor, aksesori kendaraan, oli lokal',
    slug: 'otomotif-aksesoris',
    productCount: 15,
    createdAt: '2024-06-10T09:00:00+07:00',
    updatedAt: '2024-10-09T15:10:00+07:00',
    status: 'aktif',
    icon: 'otomotif',
  },
  {
    id: 'cat-alat-tulis',
    name: 'Alat Tulis & Kertas',
    description: 'Buku tulis, alat gambar, perlengkapan kantor',
    slug: 'alat-tulis-kertas',
    productCount: 8,
    createdAt: '2024-07-02T09:00:00+07:00',
    updatedAt: '2024-09-17T08:45:00+07:00',
    status: 'aktif',
    icon: 'alat-tulis',
  },
  {
    id: 'cat-jasa',
    name: 'Jasa & Layanan Kreatif',
    description: 'Desain grafis, fotografi produk, konsultasi merek',
    slug: 'jasa-layanan-kreatif',
    productCount: 3,
    createdAt: '2024-07-19T09:00:00+07:00',
    updatedAt: '2024-09-30T10:50:00+07:00',
    status: 'aktif',
    icon: 'jasa',
  },
  {
    id: 'cat-furnitur',
    name: 'Furnitur & Kayu Olahan',
    description: 'Meja kayu, rak dinding, kursi anyaman',
    slug: 'furnitur-kayu-olahan',
    productCount: 12,
    createdAt: '2024-08-05T09:00:00+07:00',
    updatedAt: '2024-09-25T12:35:00+07:00',
    status: 'nonaktif',
    icon: 'furnitur',
  },
  {
    id: 'cat-logam',
    name: 'Logam & Kerajinan Besi',
    description: 'Pagar besi, alat dapur logam, kerajinan tempa',
    slug: 'logam-kerajinan-besi',
    productCount: 0,
    createdAt: '2024-08-22T09:00:00+07:00',
    updatedAt: '2024-10-03T09:05:00+07:00',
    status: 'nonaktif',
    icon: 'logam',
  },
]

const CATEGORY_STORAGE_KEY = 'ratis.admin.categories'

function isCategoryRecord(value: unknown): value is CategoryRecord {
  if (!value || typeof value !== 'object') return false

  const record = value as Partial<CategoryRecord>
  return (
    typeof record.id === 'string' &&
    typeof record.name === 'string' &&
    typeof record.description === 'string' &&
    typeof record.slug === 'string' &&
    typeof record.productCount === 'number' &&
    typeof record.createdAt === 'string' &&
    typeof record.updatedAt === 'string' &&
    (record.status === 'aktif' || record.status === 'nonaktif') &&
    typeof record.icon === 'string'
  )
}

export function loadCategories(): CategoryRecord[] {
  if (typeof window === 'undefined') return categoryRecords

  try {
    const raw = window.sessionStorage.getItem(CATEGORY_STORAGE_KEY)
    if (!raw) return categoryRecords
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed) || !parsed.every(isCategoryRecord)) return categoryRecords
    return parsed
  } catch {
    return categoryRecords
  }
}

export function persistCategories(records: CategoryRecord[]) {
  if (typeof window === 'undefined') return

  try {
    window.sessionStorage.setItem(CATEGORY_STORAGE_KEY, JSON.stringify(records))
  } catch {
    return
  }
}

export function slugifyCategoryName(name: string) {
  return name
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/&/g, 'dan')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-')
}
