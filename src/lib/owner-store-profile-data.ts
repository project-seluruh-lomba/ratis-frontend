export type StoreVerificationEntry = {
  id: string
  title: string
  date: string
  description: string
  actor: string
  tone: 'success' | 'danger' | 'neutral'
  current?: boolean
  isReason?: boolean
}

export type StoreProfilePhoto = {
  id: string
  label: string
  caption: string
  visual: 'kitchen' | 'front' | 'pickup'
}

export type StoreProfileData = {
  name: string
  slug: string
  category: string
  tagline: string
  description: string
  registeredAt: string
  updatedAt: string
  whatsapp: string
  email: string
  address: string
  addressNote: string
  coordinates: string
  mapUrl: string
  operationalHours: { label: string; value: string }[]
  deliveryServices: { label: string; description: string }[]
  nib: string
  nibRegistration: string
  pirt: {
    value: string
    issuer: string
    validity: string
    status: string
  }
  halal: {
    value: string
    issuer: string
    validity: string
    status: string
  }
  bank: {
    shortName: string
    name: string
    accountNumber: string
    accountHolder: string
  }
  photos: StoreProfilePhoto[]
  verificationHistory: StoreVerificationEntry[]
}

export const ownerStoreProfile: StoreProfileData = {
  name: 'Dapur Bu Sari',
  slug: 'dapur-bu-sari',
  category: 'Kuliner (Kue, Roti, & Pastry Nusantara)',
  tagline:
    'Spesialis Lapis Legit Prune Wisman Asli & Aneka Kue Basah Tradisional Premium',
  description:
    'Dapur Bu Sari merupakan usaha keluarga di Jakarta Selatan yang berfokus pada pelestarian resep warisan lapis legit klasik premium dan aneka jajan pasar basah berkemasan eksklusif. Menggunakan 100% mentega Wisman murni tanpa bahan pengawet sintetis maupun pemutih bahan. Kami memproduksi hingga 120 loyang per hari dengan sistem standar dapur bersih bersertifikasi sanitasi, melayani kebutuhan hajatan, hantaran Idulfitri, Natal, Imlek, serta pesanan hampers korporasi skala besar di wilayah Jabodetabek.',
  registeredAt: '12 Januari 2026',
  updatedAt: 'Diperbarui 3 hari lalu',
  whatsapp: '+62 812-3456-7890',
  email: 'dapurbusari.jkt@gmail.com',
  address:
    'Jl. Gandaria Tengah II No. 18, RT 04 / RW 03, Kel. Kramat Pela, Kec. Kebayoran Baru, Jakarta Selatan, DKI Jakarta 12130',
  addressNote:
    'Titik Jemput: Pintu Gerbang Belakang Dapur Sari • Akses Truk Sedang / Motor OK',
  coordinates: '-6.246312, 106.793215',
  mapUrl: 'https://www.google.com/maps/search/?api=1&query=-6.246312,106.793215',
  operationalHours: [
    { label: 'Senin - Sabtu', value: '07.30 - 18.00 WIB' },
    { label: 'Minggu', value: '08.00 - 14.00 WIB (Pre-Order)' },
  ],
  deliveryServices: [
    {
      label: 'Instan & Same-day Jabodetabek',
      description: 'Dikirim dengan kurir instan mitra Ratis',
    },
    {
      label: 'Paket Khusus Frozen & Pastry Next-Day',
      description: 'Dikemas dengan cooler box dan es gel',
    },
  ],
  nib: '1204200098912',
  nibRegistration:
    'Terdaftar di OSS-RBA BKPM KBLI 10710 (Industri Produk Roti & Kue)',
  pirt: {
    value: 'P-IRT No. 2063174018019-26',
    issuer: 'Dinas Kesehatan Kota Administrasi Jakarta Selatan',
    validity: 'Masa berlaku s/d 2029',
    status: 'Aktif',
  },
  halal: {
    value: 'ID311100094928196324',
    issuer: 'BPJPH Kementerian Agama RI',
    validity: 'Status Halal Indonesia Valid',
    status: 'Self-Declare',
  },
  bank: {
    shortName: 'BCA',
    name: 'Bank Central Asia (BCA)',
    accountNumber: '8828-394-112',
    accountHolder: 'Sari Wulandari (Dapur Bu Sari)',
  },
  photos: [
    {
      id: 'kitchen',
      label: 'Area Dapur Bersih',
      caption: 'Standar higienitas produksi',
      visual: 'kitchen',
    },
    {
      id: 'front',
      label: 'Tampak Depan Toko',
      caption: 'Etalase & area pengambilan',
      visual: 'front',
    },
    {
      id: 'pickup',
      label: 'Luksel Pengambilan Kue',
      caption: 'Rak display pesanan pelanggan',
      visual: 'pickup',
    },
  ],
  verificationHistory: [
    {
      id: 'approved',
      title: 'Toko Disetujui & Aktif',
      date: '24 November 2026, 10:15 WIB',
      description:
        'Verifikasi dokumen NIB dan foto dapur disetujui penuh oleh Admin Ratis. Toko resmi berstatus mitra aktif storefront.',
      actor: 'Admin: Hendra Kusuma (Kepatuhan UMKM)',
      tone: 'success',
      current: true,
    },
    {
      id: 'resubmitted',
      title: 'Pengajuan Ulang Profil Selesai',
      date: '23 November 2026, 16:40 WIB',
      description:
        'Pemilik toko melengkapi foto dapur higienis baru dan memperbarui sertifikat P-IRT sesuai catatan revisi.',
      actor: 'Aktor: Bu Sari (Pemilik Toko)',
      tone: 'success',
    },
    {
      id: 'revision',
      title: 'Revisi Diminta (Ditolak Sementara)',
      date: '22 November 2026, 14:00 WIB',
      description:
        '"Foto tampak depan dapur agak buram dan perlu pencahayaan lebih jelas pada display produk hamper."',
      actor: 'Admin: Tim Kurasi Ratis',
      tone: 'danger',
      isReason: true,
    },
    {
      id: 'registered',
      title: 'Pendaftaran Toko Baru',
      date: '20 November 2026, 09:30 WIB',
      description:
        'Akun pemilik toko didaftarkan pertama kali untuk pembukaan storefront Ratis Bisnis.',
      actor: 'Aktor: Bu Sari (Pemilik Toko)',
      tone: 'success',
    },
  ],
}

export type StoreScheduleEntry = {
  id: 'weekday' | 'sunday'
  label: string
  note: string
  open: boolean
  openTime: string
  closeTime: string
}

export const defaultStoreSchedule: StoreScheduleEntry[] = [
  {
    id: 'weekday',
    label: 'Senin - Sabtu',
    note: 'Kuliner Reguler & Instant Driver',
    open: true,
    openTime: '07:30',
    closeTime: '18:00',
  },
  {
    id: 'sunday',
    label: 'Minggu',
    note: 'Khusus Pre-Order (H-1)',
    open: true,
    openTime: '08:00',
    closeTime: '14:00',
  },
]

export type OwnerStoreProfileOverride = {
  name?: string
  category?: string
  tagline?: string
  description?: string
  whatsapp?: string
  email?: string
  address?: string
  addressNote?: string
  coordinates?: string
  nib?: string
  pirtValue?: string
  halalValue?: string
  internalNote?: string
  schedule?: StoreScheduleEntry[]
}

const STORE_PROFILE_KEY = 'ratis.owner.store-profile'
let cachedOverride: OwnerStoreProfileOverride | null | undefined

function readOverride(): OwnerStoreProfileOverride {
  if (cachedOverride !== undefined) return cachedOverride ?? {}

  try {
    const raw = localStorage.getItem(STORE_PROFILE_KEY)
    cachedOverride = raw ? (JSON.parse(raw) as OwnerStoreProfileOverride) : null
  } catch {
    cachedOverride = null
  }

  return cachedOverride ?? {}
}

function formatScheduleHours(entry: StoreScheduleEntry) {
  if (!entry.open) return 'Tutup'

  const suffix = entry.id === 'sunday' ? ' (Pre-Order)' : ''
  return `${entry.openTime.replace(':', '.')} - ${entry.closeTime.replace(':', '.')} WIB${suffix}`
}

export function getOwnerStoreSchedule(): StoreScheduleEntry[] {
  const schedule = readOverride().schedule ?? defaultStoreSchedule
  return schedule.map((entry) => ({ ...entry }))
}

export function getOwnerStoreProfile(fallbackName?: string): StoreProfileData {
  const override = readOverride()
  const schedule = override.schedule ?? defaultStoreSchedule
  const coordinates = override.coordinates ?? ownerStoreProfile.coordinates

  return {
    ...ownerStoreProfile,
    name: override.name ?? fallbackName ?? ownerStoreProfile.name,
    category: override.category ?? ownerStoreProfile.category,
    tagline: override.tagline ?? ownerStoreProfile.tagline,
    description: override.description ?? ownerStoreProfile.description,
    whatsapp: override.whatsapp ?? ownerStoreProfile.whatsapp,
    email: override.email ?? ownerStoreProfile.email,
    address: override.address ?? ownerStoreProfile.address,
    addressNote: override.addressNote ?? ownerStoreProfile.addressNote,
    coordinates,
    mapUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(coordinates)}`,
    operationalHours: schedule.map((entry) => ({
      label: entry.label,
      value: formatScheduleHours(entry),
    })),
    nib: override.nib ?? ownerStoreProfile.nib,
    pirt: {
      ...ownerStoreProfile.pirt,
      value: override.pirtValue ?? ownerStoreProfile.pirt.value,
    },
    halal: {
      ...ownerStoreProfile.halal,
      value: override.halalValue ?? ownerStoreProfile.halal.value,
    },
  }
}

export function saveOwnerStoreProfile(override: OwnerStoreProfileOverride) {
  const next = { ...readOverride(), ...override }
  cachedOverride = next

  try {
    localStorage.setItem(STORE_PROFILE_KEY, JSON.stringify(next))
  } catch {
    // Data tetap tersimpan di memori bila penyimpanan browser tidak tersedia.
  }
}

export function getStoreSlug(name: string) {
  return name
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}
