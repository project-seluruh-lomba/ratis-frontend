export type StoreStatus = 'aktif' | 'pending' | 'nonaktif' | 'ditolak'
export type StoreStaffStatus = 'aktif' | 'nonaktif'

export type StoreStaffMember = {
  id: string
  name: string
  email: string
  userId: string
  role: string
  access: string
  status: StoreStaffStatus
}

export type StoreProduct = {
  name: string
  sku: string
  variant: string
  price: number
  sold: number
  availability: 'Tersedia' | 'Habis'
}

export type StoreHistoryEvent = {
  title: string
  at: string
  description: string
  tone: 'primary' | 'success' | 'neutral'
}

export type StoreOwner = {
  name: string
  email: string
  phone: string
  userId: string
  lastLogin: string
  ip: string
}

export type StoreDetail = {
  slug: string
  name: string
  tagline: string
  status: StoreStatus
  verified: boolean
  storeCode: string
  registeredAt: string
  certification: string
  category: string
  categoryRef: string
  nib: string
  nibVerified: boolean
  address: string
  contactEmail: string
  whatsapp: string
  coverLabel: string
  description: string
  productCount: number
  ordersCount: number
  rating: string
  reviewCount: number
  revenueTotal: number
  revenueGrowth: string
  escrowBalance: number
  escrowNote: string
  staff: StoreStaffMember[]
  products: StoreProduct[]
  owner: StoreOwner
  policyStatus: string
  policyNote: string
  policyWarning: string
  timeline: StoreHistoryEvent[]
}

const warungBuSari: StoreDetail = {
  slug: 'warung-bu-sari',
  name: 'Warung Bu Sari',
  tagline: 'Pusat Olahan Kuliner Tradisional Bantul',
  status: 'aktif',
  verified: true,
  storeCode: '#SHIP-KUL-012',
  registeredAt: '2024-11-12T09:00:00+07:00',
  certification: 'Sertifikasi OSS R/L',
  category: 'Kuliner & Makanan Basah',
  categoryRef: 'Ref ID: #CAT-0921 (Level 1)',
  nib: '9120008129384',
  nibVerified: true,
  address: 'Jl. Kebon Jeruk No. 14, RT 03/RW 02, Bantul, D.I. Yogyakarta 55711',
  contactEmail: 'warungsri@gmail.com',
  whatsapp: '+62 812-3344-5566 (WhatsApp Bisnis)',
  coverLabel: 'Dapur Produksi Utama - Bantul',
  description:
    'Spesialis masakan gudeg basah otentik Yogyakarta dengan resep turun temurun sejak 1998. Menggunakan bumbu rempah pilihan tanpa bahan pengawet sintetis, dikemas higienis mengikuti standar kurasi Ratis UMKM Nusantara.',
  productCount: 24,
  ordersCount: 1_480,
  rating: '4.9',
  reviewCount: 420,
  revenueTotal: 37_450_000,
  revenueGrowth: '+14,2% bln ini',
  escrowBalance: 1_840_000,
  escrowNote: 'BI-FAST BCA Ak…',
  staff: [
    {
      id: 'staff-owner',
      name: 'Bu Sri Wahyuni',
      email: 'warungsri@gmail.com',
      userId: 'USR-1082-SLL',
      role: 'Pemilik Utama (Owner)',
      access: 'Penuh (Keuangan, Etalase, Pajak)',
      status: 'aktif',
    },
    {
      id: 'staff-kasir',
      name: 'Bagus Anugrah',
      email: 'kasir1@batiksekar.id',
      userId: 'USR-2240-STF',
      role: 'Staf Kasir & Operasional',
      access: 'POS Kasir, Resi Pesanan',
      status: 'aktif',
    },
    {
      id: 'staff-dapur',
      name: 'Siti Rahayu',
      email: 's.rahayu99@gmail.com',
      userId: 'USR-3819-STF',
      role: 'Staf Dapur & Inventaris',
      access: 'Stok SKU, Status Pesanan, Laporan Harian',
      status: 'aktif',
    },
  ],
  products: [
    {
      name: 'Paket Gudeg Komplit Besek',
      sku: 'SKU-GUD-001',
      variant: 'Varian Porsi 2 Orang',
      price: 25_000,
      sold: 182,
      availability: 'Tersedia',
    },
    {
      name: 'Sambal Krecek Pedas Gurih',
      sku: 'SKU-KRC-004',
      variant: 'Toples Kaca 250gr',
      price: 18_000,
      sold: 94,
      availability: 'Tersedia',
    },
    {
      name: 'Ayam Kampung Bumbu Areh (1/2 Ekor)',
      sku: 'SKU-AYM-008',
      variant: 'Kemasan Vacuum Box',
      price: 35_000,
      sold: 67,
      availability: 'Tersedia',
    },
    {
      name: 'Nasi Gudeg Telur Puyuh',
      sku: 'SKU-GUD-002',
      variant: 'Porsi Tunggal',
      price: 22_000,
      sold: 143,
      availability: 'Tersedia',
    },
    {
      name: 'Krecek Kering Manis',
      sku: 'SKU-KRC-005',
      variant: 'Toples Kaca 150gr',
      price: 15_000,
      sold: 58,
      availability: 'Habis',
    },
    {
      name: 'Paket Oleh-Oleh 3 Box',
      sku: 'SKU-PKT-011',
      variant: 'Bundling Hemat',
      price: 68_000,
      sold: 39,
      availability: 'Tersedia',
    },
  ],
  owner: {
    name: 'Bu Sri Wahyuni',
    email: 'warungsri@gmail.com',
    phone: '+62 812-3344-5566',
    userId: 'USR-1082-SLL',
    lastLogin: 'Hari ini, 09:14 WIB',
    ip: '182.253.14.88 (Banten, ID)',
  },
  policyStatus: 'Normal di Etalase',
  policyNote:
    'Etalase dapat menerima pesanan baru. Rekening penampung saat memproses kliring escrow berkala.',
  policyWarning:
    'Jika akun pemilik Bu Sri ditangguhkan, toko tetap dapat menyelesaikan pesanan pending oleh 2 staf operasional yang ditunjuk.',
  timeline: [
    {
      title: 'Pencairan Saldo Diajukan',
      at: 'Hari ini, 08:30 WIB',
      description:
        'Permintaan Rp 1.845.000 via BI-FAST ke BCA 6372819283 (Menunggu Kliring Bank).',
      tone: 'primary',
    },
    {
      title: 'Verifikasi Berkas NIB',
      at: '18 Okt 2024',
      description:
        'Disetujui oleh Superadmin Ratis. Status operasional berlanjut ke Aktif Resmi.',
      tone: 'success',
    },
    {
      title: 'Pendaftaran Toko Perdana',
      at: '12 Nov 2024',
      description:
        'Akun Bu Sri Wahyuni mendaftarkan entitas toko dengan klasifikasi UMKM Kuliner.',
      tone: 'neutral',
    },
  ],
}

function toTitleCase(slug: string) {
  return slug
    .split('-')
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join(' ')
}

function buildFallbackDetail(slug: string): StoreDetail {
  const name = toTitleCase(slug)
  const initials = name.split(' ').map((part) => part[0]).join('').slice(0, 3).toUpperCase()
  const email = `pemilik.${slug.replace(/-/g, '')}@gmail.com`

  return {
    slug,
    name,
    tagline: 'Mitra UMKM Terkurasi Ratis',
    status: 'aktif',
    verified: true,
    storeCode: `#SHIP-${initials}-000`,
    registeredAt: '2025-02-18T09:00:00+07:00',
    certification: 'Sertifikasi OSS R/L',
    category: 'Kuliner & Makanan Basah',
    categoryRef: 'Ref ID: #CAT-0000 (Level 1)',
    nib: '—',
    nibVerified: false,
    address: 'Alamat lengkap toko belum dilengkapi oleh pemilik.',
    contactEmail: email,
    whatsapp: '+62 812-0000-0000 (WhatsApp Bisnis)',
    coverLabel: `Foto Etalase ${name}`,
    description: `Toko ${name} dikelola langsung oleh pemiliknya dengan produk unggulan lokal yang telah melewati kurasi Ratis UMKM.`,
    productCount: 8,
    ordersCount: 120,
    rating: '4.7',
    reviewCount: 38,
    revenueTotal: 4_250_000,
    revenueGrowth: '+6,1% bln ini',
    escrowBalance: 420_000,
    escrowNote: 'Menunggu Kliring',
    staff: [],
    products: [],
    owner: {
      name: 'Pemilik Terdaftar',
      email,
      phone: '+62 812-0000-0000',
      userId: 'USR-0000-SLL',
      lastLogin: 'Hari ini, 08:00 WIB',
      ip: '103.28.14.20 (Jawa Barat, ID)',
    },
    policyStatus: 'Normal di Etalase',
    policyNote:
      'Etalase dapat menerima pesanan baru. Rekening penampung saat memproses kliring escrow berkala.',
    policyWarning:
      'Jika akun pemilik ditangguhkan, toko tetap dapat menyelesaikan pesanan pending oleh staf operasional yang ditunjuk.',
    timeline: [
      {
        title: 'Pendaftaran Toko Perdana',
        at: '18 Feb 2025',
        description: 'Entitas toko didaftarkan dan diverifikasi oleh Superadmin Ratis.',
        tone: 'neutral',
      },
    ],
  }
}

export function getStoreDetail(slug: string): StoreDetail {
  if (slug === warungBuSari.slug) return warungBuSari
  return buildFallbackDetail(slug)
}
