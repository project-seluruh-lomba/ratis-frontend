export type UmkmStatus = 'pending' | 'aktif' | 'ditolak' | 'nonaktif'

export type UmkmAvatarTone = 'teal' | 'emerald' | 'lavender' | 'rose' | 'slate'

export type UmkmRecord = {
  slug: string
  name: string
  owner: string
  email: string
  phone: string
  registeredAt: string
  status: UmkmStatus
  avatarTone: UmkmAvatarTone
  isNew?: boolean
}

export const umkmRecords: UmkmRecord[] = [
  {
    slug: 'warung-bu-sari',
    name: 'Warung Bu Sari',
    owner: 'Sari Wulandari',
    email: 'sari@gmail.com',
    phone: '0812-3456-7890',
    registeredAt: '2026-11-12T14:20:00+07:00',
    status: 'pending',
    avatarTone: 'teal',
    isNew: true,
  },
  {
    slug: 'batik-sekar-wangi',
    name: 'Batik Sekar Wangi',
    owner: 'Sekar Ayu',
    email: 'sekar.ayu@outlook.co.id',
    phone: '0813-8899-1200',
    registeredAt: '2026-11-12T11:05:00+07:00',
    status: 'pending',
    avatarTone: 'emerald',
    isNew: true,
  },
  {
    slug: 'kripik-tempe-barokah',
    name: 'Kripik Tempe Barokah',
    owner: 'Ahmad Subagyo',
    email: 'ahmad.barokah@yahoo.com',
    phone: '0852-7711-4433',
    registeredAt: '2026-11-11T18:40:00+07:00',
    status: 'pending',
    avatarTone: 'emerald',
    isNew: true,
  },
  {
    slug: 'kopi-kenangan-senja',
    name: 'Kopi Kenangan Senja',
    owner: 'Budi Prasetyo',
    email: 'budi.senja@gmail.com',
    phone: '0819-4455-6677',
    registeredAt: '2026-11-08T09:12:00+07:00',
    status: 'aktif',
    avatarTone: 'lavender',
  },
  {
    slug: 'dapur-sambal-mak-inem',
    name: 'Dapur Sambal Mak Inem',
    owner: 'Siti Aminah',
    email: 'makinemsambal@gmail.com',
    phone: '0878-1122-9988',
    registeredAt: '2026-11-03T16:30:00+07:00',
    status: 'aktif',
    avatarTone: 'lavender',
  },
  {
    slug: 'madu-hutan-murni-riau',
    name: 'Madu Hutan Murni Riau',
    owner: 'Hendra Wijaya',
    email: 'hendra.riau@gmail.com',
    phone: '0821-9988-3344',
    registeredAt: '2026-10-29T10:15:00+07:00',
    status: 'aktif',
    avatarTone: 'lavender',
  },
  {
    slug: 'kerajinan-rotan-asli',
    name: 'Kerajinan Rotan Asli',
    owner: 'Joko Nugroho',
    email: 'joko.rotan@gmail.com',
    phone: '0813-7766-5544',
    registeredAt: '2026-10-24T13:45:00+07:00',
    status: 'ditolak',
    avatarTone: 'rose',
  },
  {
    slug: 'snack-pedas-jeletot',
    name: 'Snack Pedas Jeletot',
    owner: 'Rian Hidayat',
    email: 'rian.jeletot@gmail.com',
    phone: '0896-1234-5678',
    registeredAt: '2026-10-18T08:00:00+07:00',
    status: 'nonaktif',
    avatarTone: 'lavender',
  },
  {
    slug: 'toko-berkah-jaya',
    name: 'Toko Berkah Jaya',
    owner: 'Nur Aisyah',
    email: 'berkah.jaya@gmail.com',
    phone: '0812-7788-9900',
    registeredAt: '2026-10-15T09:30:00+07:00',
    status: 'aktif',
    avatarTone: 'teal',
  },
  {
    slug: 'warung-sambal-maknyus',
    name: 'Warung Sambal Maknyus',
    owner: 'Rudi Hartono',
    email: 'sambal.maknyus@gmail.com',
    phone: '0813-2211-3344',
    registeredAt: '2026-10-12T10:20:00+07:00',
    status: 'aktif',
    avatarTone: 'lavender',
  },
  {
    slug: 'tenun-ikat-lestari',
    name: 'Tenun Ikat Lestari',
    owner: 'Maria Kristina',
    email: 'tenun.lestari@gmail.com',
    phone: '0857-6655-4433',
    registeredAt: '2026-10-09T14:05:00+07:00',
    status: 'aktif',
    avatarTone: 'lavender',
  },
  {
    slug: 'kopi-lereng-merapi',
    name: 'Kopi Lereng Merapi',
    owner: 'Agus Setiawan',
    email: 'kopi.lereng@gmail.com',
    phone: '0812-3344-5566',
    registeredAt: '2026-10-06T08:45:00+07:00',
    status: 'aktif',
    avatarTone: 'lavender',
  },
  {
    slug: 'minyak-kelapa-alami',
    name: 'Minyak Kelapa Alami',
    owner: 'Dewi Lestari',
    email: 'minyak.alami@gmail.com',
    phone: '0821-1122-3344',
    registeredAt: '2026-10-03T11:10:00+07:00',
    status: 'aktif',
    avatarTone: 'lavender',
  },
  {
    slug: 'rajut-ceria-nusantara',
    name: 'Rajut Ceria Nusantara',
    owner: 'Fitri Handayani',
    email: 'rajut.ceria@gmail.com',
    phone: '0895-6677-8899',
    registeredAt: '2026-09-29T15:25:00+07:00',
    status: 'aktif',
    avatarTone: 'lavender',
  },
  {
    slug: 'tahu-bakso-mantap',
    name: 'Tahu Bakso Mantap',
    owner: 'Slamet Riyadi',
    email: 'tahubakso.mantap@gmail.com',
    phone: '0813-9988-7766',
    registeredAt: '2026-09-26T09:05:00+07:00',
    status: 'aktif',
    avatarTone: 'lavender',
  },
  {
    slug: 'gula-aren-sejahtera',
    name: 'Gula Aren Sejahtera',
    owner: 'Umi Kalsum',
    email: 'gula.aren@gmail.com',
    phone: '0822-3344-5566',
    registeredAt: '2026-09-22T13:50:00+07:00',
    status: 'aktif',
    avatarTone: 'lavender',
  },
  {
    slug: 'keripik-pisang-lestari',
    name: 'Keripik Pisang Lestari',
    owner: 'Lestari Ningsih',
    email: 'keripik.lestari@gmail.com',
    phone: '0852-1122-3344',
    registeredAt: '2026-09-19T10:40:00+07:00',
    status: 'ditolak',
    avatarTone: 'rose',
  },
  {
    slug: 'anyaman-bambu-asri',
    name: 'Anyaman Bambu Asri',
    owner: 'Bambang Sutrisno',
    email: 'anyaman.asri@gmail.com',
    phone: '0812-5566-7788',
    registeredAt: '2026-09-16T16:15:00+07:00',
    status: 'aktif',
    avatarTone: 'lavender',
  },
]

export type UmkmAuditTone = 'warning' | 'success' | 'neutral'

export type UmkmAuditEvent = {
  id: string
  title: string
  at: string
  description: string
  statusLabel?: string
  context?: string
  tone: UmkmAuditTone
}

export type UmkmProductPreview = {
  name: string
  price: string
}

export type UmkmDetail = {
  record: UmkmRecord
  shopId: string
  category: string
  region: string
  description: string
  address: string
  coordinates: string
  photoLabel: string
  nib: string | null
  ownerNik: string
  ownerCity: string
  productSkus: number
  ordersProcessed: number
  productPreviews: UmkmProductPreview[]
  auditTrail: UmkmAuditEvent[]
}

type UmkmDetailOverrides = Partial<Omit<UmkmDetail, 'record' | 'auditTrail'>>

const umkmStatusStorageKey = 'ratis.admin.umkm-status-overrides'

const categoryBySlug: Record<string, string> = {
  'warung-bu-sari': 'Kuliner & Katering, Jawa-04',
  'batik-sekar-wangi': 'Fashion & Kriya, Jawa-04',
  'kripik-tempe-barokah': 'Makanan Ringan, Jawa-04',
  'kopi-kenangan-senja': 'Minuman & Kopi, Jawa-04',
  'dapur-sambal-mak-inem': 'Bumbu & Sambal, Jawa-04',
  'madu-hutan-murni-riau': 'Agro & Madu, Riau',
  'kerajinan-rotan-asli': 'Kriya & Furnitur, Jawa-04',
  'snack-pedas-jeletot': 'Makanan Ringan, Jawa-04',
  'toko-berkah-jaya': 'Sembako, Jawa-04',
  'warung-sambal-maknyus': 'Makanan Siap Saji, Jawa-04',
}

const detailOverrides: Record<string, UmkmDetailOverrides> = {
  'warung-bu-sari': {
    shopId: 'SHOP-SS219',
    category: 'Kuliner & Katering, Jawa-04',
    region: 'Jawa Barat',
    ownerCity: 'Kota Depok',
    description:
      'Produksi masakan rumahan siap saji dan katering harian khas Jawa Timur higienis dan terpercaya. Memproduksi aneka rawon daging, soto ayam kampung, rendang empuk jowo, serta paket bento sehat untuk perkantoran dan pernikahan.',
    address:
      'Jl. Melati No. 14, RT 02/RW 05, Kel. Sukamaju, Kec. Ciledug, Kota Depok, Jawa Barat 16415',
    coordinates: '-6.42781, 106.84912',
    photoLabel: 'Dapur Produksi Utama - Sukamaju',
    nib: '1289004561234',
    ownerNik: '3276***********',
    productSkus: 24,
    ordersProcessed: 0,
    productPreviews: [
      { name: 'Rawon Daging', price: 'Rp 38.000' },
      { name: 'Soto Ayam Kampung', price: 'Rp 26.000' },
      { name: 'Paket Bento Sehat', price: 'Rp 32.500' },
    ],
  },
  'madu-hutan-murni-riau': {
    region: 'Riau',
    ownerCity: 'Kota Pekanbaru',
  },
}

function readStatusOverrides(): Record<string, UmkmStatus> {
  if (typeof window === 'undefined') return {}

  try {
    const raw = window.sessionStorage.getItem(umkmStatusStorageKey)
    if (!raw) return {}
    const parsed: unknown = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') return {}
    return parsed as Record<string, UmkmStatus>
  } catch {
    return {}
  }
}

export function applyUmkmStatusOverrides(records: UmkmRecord[]): UmkmRecord[] {
  const overrides = readStatusOverrides()
  return records.map((record) =>
    overrides[record.slug] ? { ...record, status: overrides[record.slug] } : record,
  )
}

export function persistUmkmStatus(slug: string, status: UmkmStatus) {
  if (typeof window === 'undefined') return

  try {
    const overrides = readStatusOverrides()
    overrides[slug] = status
    window.sessionStorage.setItem(umkmStatusStorageKey, JSON.stringify(overrides))
  } catch {
    return
  }
}

const statusDecision: Partial<
  Record<
    UmkmStatus,
    {
      title: string
      statusLabel: string
      tone: UmkmAuditTone
      description: (record: UmkmRecord) => string
    }
  >
> = {
  aktif: {
    title: 'Verifikasi Toko Disetujui',
    statusLabel: 'Aktif',
    tone: 'success',
    description: (record) =>
      `Pendaftaran ${record.name} disetujui dan toko mulai tayang di storefront Ratis.`,
  },
  ditolak: {
    title: 'Pendaftaran Toko Ditolak',
    statusLabel: 'Ditolak',
    tone: 'warning',
    description: (record) =>
      `Pendaftaran ${record.name} ditolak karena dokumen usaha belum memenuhi standar verifikasi. Pemilik dapat mengajukan ulang.`,
  },
  nonaktif: {
    title: 'Toko Dinonaktifkan',
    statusLabel: 'Nonaktif',
    tone: 'neutral',
    description: (record) =>
      `${record.name} dinonaktifkan sementara dari storefront karena evaluasi kepatuhan operasional.`,
  },
}

function buildAuditTrail(record: UmkmRecord): UmkmAuditEvent[] {
  const registered = new Date(record.registeredAt).getTime()
  const events: UmkmAuditEvent[] = [
    {
      id: `${record.slug}-register`,
      title: 'Pendaftaran Toko Baru Diterima',
      at: record.registeredAt,
      description: `Toko didaftarkan langsung oleh pemilik ${record.owner} melalui formulir registrasi mandiri merchant Ratis.`,
      statusLabel: 'Status: Pending Verification',
      context: 'IP 182.253.110.45 • Client Web Chrome Android',
      tone: 'warning',
    },
    {
      id: `${record.slug}-otp`,
      title: 'Verifikasi Nomor Handphone Berhasil',
      at: new Date(registered - 6 * 60 * 1000).toISOString(),
      description: `Kode OTP SMS via gateway berhasil divalidasi untuk nomor ${record.phone}.`,
      tone: 'neutral',
    },
  ]

  const decision = statusDecision[record.status]
  if (decision) {
    events.push({
      id: `${record.slug}-decision`,
      title: decision.title,
      at: new Date(registered + 2 * 60 * 60 * 1000).toISOString(),
      description: decision.description(record),
      statusLabel: `Status: ${decision.statusLabel}`,
      context: 'Admin: Superadmin Platform',
      tone: decision.tone,
    })
  }

  return events.sort((first, second) => new Date(second.at).getTime() - new Date(first.at).getTime())
}

function buildFallbackDetail(
  record: UmkmRecord,
  index: number,
): Omit<UmkmDetail, 'record' | 'auditTrail'> {
  const category = categoryBySlug[record.slug] ?? 'Kuliner & Katering, Jawa-04'
  const shopCode = record.slug
    .split('-')
    .map((part) => part[0])
    .join('')
    .slice(0, 3)
    .toUpperCase()

  return {
    shopId: `SHOP-${shopCode}${100 + index}`,
    category,
    region: record.slug === 'madu-hutan-murni-riau' ? 'Riau' : 'Jawa Barat',
    ownerCity: record.slug === 'madu-hutan-murni-riau' ? 'Kota Pekanbaru' : 'Kota Depok',
    description: `Usaha ${category.split(',')[0].toLowerCase()} yang dikelola langsung oleh ${record.owner}. Seluruh produk dibuat dengan bahan baku lokal pilihan dan proses produksi yang higienis.`,
    address: `Jl. Merdeka No. ${8 + index}, RT 0${(index % 4) + 1}/RW 0${(index % 6) + 1}, Kel. Sukamaju, Kec. Ciledug, Kota Depok, Jawa Barat 16415`,
    coordinates: `-6.${42781 + index * 11}, 106.${84912 - index * 7}`,
    photoLabel: `Tempat Produksi ${record.name}`,
    nib: `12890045${61234 + index}`,
    ownerNik: '3276***********',
    productSkus: 8 + ((index * 7) % 30),
    ordersProcessed: record.status === 'aktif' ? 12 + index * 6 : 0,
    productPreviews: [
      { name: 'Paket Produk Unggulan', price: 'Rp 45.000' },
      { name: 'Varian Favorit', price: 'Rp 32.000' },
      { name: 'Bundling Hemat', price: 'Rp 58.000' },
    ],
  }
}

export function getUmkmDetail(slug: string): UmkmDetail | undefined {
  const records = applyUmkmStatusOverrides(umkmRecords)
  const index = records.findIndex((record) => record.slug === slug)
  if (index === -1) return undefined

  const record = records[index]
  const fallback = buildFallbackDetail(record, index)
  const overrides = detailOverrides[record.slug] ?? {}

  return {
    record,
    ...fallback,
    ...overrides,
    auditTrail: buildAuditTrail(record),
  }
}
