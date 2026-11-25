export type ActivityActionTone =
  | 'emerald'
  | 'violet'
  | 'rose'
  | 'indigo'
  | 'amber'
  | 'teal'
  | 'slate'

export type ActivityActorTone = 'emerald' | 'indigo' | 'teal' | 'rose' | 'slate'

export type ActivityCategory =
  | 'Verifikasi UMKM'
  | 'Kategori'
  | 'Pengguna'
  | 'Autentikasi'
  | 'Pesanan'

export type ActivityActor = {
  name: string
  initials: string
  ip: string
  tone: ActivityActorTone
}

export type ActivityEntry = {
  id: string
  at: string
  seq: number
  actor: ActivityActor
  action: string
  tone: ActivityActionTone
  category: ActivityCategory
  objectName: string
  objectMeta: string
  showObjectLink: boolean
  description: string
  reference: string
  referenceTone: string
}

const ADMINS: ActivityActor[] = [
  { name: 'Admin Ratis', initials: 'AR', ip: '182.253.110.45', tone: 'emerald' },
  { name: 'Dian Nurdin', initials: 'DN', ip: '36.88.204.12', tone: 'indigo' },
  { name: 'Bagus Santoso', initials: 'BS', ip: '103.144.18.9', tone: 'teal' },
  { name: 'Rina Kartika', initials: 'RK', ip: '120.61.4.88', tone: 'rose' },
  { name: 'Fajar Nugraha', initials: 'FN', ip: '180.244.9.71', tone: 'slate' },
]

const SHOPS = [
  { name: 'Warung Bu Sari', code: '#SHOP-88219' },
  { name: 'Kripik Singkong Mandiri', code: '#SHOP-88190' },
  { name: 'Kain Tenun Jepara', code: '#SHOP-88188' },
  { name: 'Bakso Pak Kumis', code: '#SHOP-88142' },
  { name: 'Kopi Klotok Lereng', code: '#SHOP-88097' },
  { name: 'Tempe Mendoan Bu Rini', code: '#SHOP-88061' },
  { name: 'Sambal Bu Tum', code: '#SHOP-88024' },
  { name: 'Tahu Bakso Bu Tini', code: '#SHOP-87988' },
  { name: 'Gula Aren Sumber Rejeki', code: '#SHOP-87941' },
  { name: 'Batik Tulis Giriloyo', code: '#SHOP-87903' },
]

const USERS = [
  { name: 'Joko Nugroho', code: '#USR-1048' },
  { name: 'Siti Rahmawati', code: '#USR-0891' },
  { name: 'Rudi Hartono', code: '#USR-1033' },
  { name: 'Ayu Lestari', code: '#USR-1021' },
  { name: 'Bambang Prasetyo', code: '#USR-0994' },
  { name: 'Nur Aini', code: '#USR-0972' },
]

const CATEGORIES = [
  { name: 'Bahan Pokok & Sembako', code: '#CAT-09' },
  { name: 'Makanan Olahan', code: '#CAT-04' },
  { name: 'Fashion & Kriya', code: '#CAT-07' },
  { name: 'Minuman Herbal', code: '#CAT-11' },
  { name: 'Jasa & Perbaikan', code: '#CAT-02' },
]

type GeneratedTemplate = {
  action: string
  category: ActivityCategory
  tone: ActivityActionTone
  objectKind: 'umkm' | 'kategori' | 'pengguna' | 'autentikasi' | 'pesanan'
  description: (objectName: string) => string
  reference: (seed: number) => string
  referenceTone: string
}

const TEMPLATES: GeneratedTemplate[] = [
  {
    action: 'APPROVE_UMKM',
    category: 'Verifikasi UMKM',
    tone: 'emerald',
    objectKind: 'umkm',
    description: (name) =>
      `Verifikasi berkas NIB dan sertifikat halal ${name} berhasil divalidasi.`,
    reference: (seed) => `Ref.Dok: KEMENKOP-VERIF-${7000 + (seed % 999)}.pdf`,
    referenceTone: 'text-emerald-600',
  },
  {
    action: 'UPDATE_CATEGORY',
    category: 'Kategori',
    tone: 'violet',
    objectKind: 'kategori',
    description: (name) =>
      `Memperbarui tarif komisi platform kategori ${name} sesuai program insentif pangan.`,
    reference: (seed) => `SK Direksi No. ${40 + (seed % 20)}/RATIS/OPS/2026`,
    referenceTone: 'text-indigo-500',
  },
  {
    action: 'SUSPEND_USER',
    category: 'Pengguna',
    tone: 'rose',
    objectKind: 'pengguna',
    description: (name) =>
      `Penangguhan paksa akun ${name} atas indikasi manipulasi pesanan fiktif (brushing).`,
    reference: (seed) => `Tiket Fraud Detection #FRD-${99000 + (seed % 999)}`,
    referenceTone: 'text-rose-500',
  },
  {
    action: 'REJECT_UMKM',
    category: 'Verifikasi UMKM',
    tone: 'amber',
    objectKind: 'umkm',
    description: (name) =>
      `Penolakan pengajuan ${name}: berkas legalitas tidak lengkap dan nomor induk berusaha tidak valid.`,
    reference: (seed) => `Catatan Verifikator #REJ-${100 + (seed % 899)}`,
    referenceTone: 'text-slate-400',
  },
  {
    action: 'UPDATE_ORDER',
    category: 'Pesanan',
    tone: 'teal',
    objectKind: 'pesanan',
    description: (name) =>
      `Override status pengiriman manual menjadi TERKIRIM atas konfirmasi Berita Acara ${name}.`,
    reference: (seed) => `BAP Pos ID: #POS-IDN-${990000 + (seed % 9999)}`,
    referenceTone: 'text-emerald-600',
  },
  {
    action: 'RESET_PASSWORD',
    category: 'Pengguna',
    tone: 'teal',
    objectKind: 'pengguna',
    description: (name) =>
      `Pengiriman tautan atur ulang kata sandi terenkripsi untuk ${name} atas permintaan resmi via Helpdesk.`,
    reference: (seed) => `Tiket Dukungan #HD-${5000 + (seed % 999)}`,
    referenceTone: 'text-slate-400',
  },
  {
    action: 'ADMIN_LOGIN',
    category: 'Autentikasi',
    tone: 'indigo',
    objectKind: 'autentikasi',
    description: () =>
      'Sesi login berhasil via 2FA Hardware Key pada konsol admin terenkripsi.',
    reference: (seed) => `Session Token #tok_${(seed * 7919).toString(16).slice(0, 6)}f4c`,
    referenceTone: 'text-indigo-500',
  },
  {
    action: 'EXPORT_AUDIT',
    category: 'Autentikasi',
    tone: 'slate',
    objectKind: 'autentikasi',
    description: () =>
      'Unduhan berkas rekonsiliasi audit kuartalan oleh tim kepatuhan internal.',
    reference: (seed) => `Batch Ekspor #EXP-2026-${String(10 + (seed % 89)).padStart(2, '0')}`,
    referenceTone: 'text-slate-400',
  },
]

const BASE_ENTRIES: ActivityEntry[] = [
  {
    id: 'LOG-ACT-9842',
    at: '',
    seq: 9842,
    actor: { name: 'Admin Ratis', initials: 'AR', ip: '182.253.110.45', tone: 'emerald' },
    action: 'APPROVE_UMKM',
    tone: 'emerald',
    category: 'Verifikasi UMKM',
    objectName: 'Warung Bu Sari',
    objectMeta: 'Entitas: UMKM [#SHOP-88219]',
    showObjectLink: true,
    description: 'Verifikasi berkas NIB (02201099281) dan sertifikat halal manual berhasil divalidasi.',
    reference: 'Ref.Dok: KEMENKOP-VERIF-7721.pdf',
    referenceTone: 'text-emerald-600',
  },
  {
    id: 'LOG-ACT-9841',
    at: '',
    seq: 9841,
    actor: { name: 'Dian Nurdin', initials: 'DN', ip: '36.88.204.12', tone: 'indigo' },
    action: 'UPDATE_CATEGORY',
    tone: 'violet',
    category: 'Kategori',
    objectName: 'Bahan Pokok & Sembako',
    objectMeta: 'Entitas: Kategori [#CAT-09]',
    showObjectLink: false,
    description:
      'Memperbarui tarif komisi platform dari 1.2 menjadi 1.0% sesuai program insentif pangan.',
    reference: 'SK Direksi No. 44/RATIS/OPS/2026',
    referenceTone: 'text-indigo-500',
  },
  {
    id: 'LOG-ACT-9840',
    at: '',
    seq: 9840,
    actor: { name: 'Admin Ratis', initials: 'AR', ip: '182.253.110.45', tone: 'rose' },
    action: 'SUSPEND_USER',
    tone: 'rose',
    category: 'Pengguna',
    objectName: 'Joko Nugroho',
    objectMeta: 'Entitas: Pengguna [#USR-1048]',
    showObjectLink: true,
    description:
      'Penangguhan paksa akun merchant atas indikasi manipulasi pesanan fiktif (brushing).',
    reference: 'Tiket Fraud Detection #FRD-99120',
    referenceTone: 'text-rose-500',
  },
  {
    id: 'LOG-ACT-9839',
    at: '',
    seq: 9839,
    actor: { name: 'Admin Ratis', initials: 'AR', ip: '182.253.110.45', tone: 'emerald' },
    action: 'ADMIN_LOGIN',
    tone: 'indigo',
    category: 'Autentikasi',
    objectName: 'Pusat Autentikasi SSO',
    objectMeta: 'Modul: Core Auth',
    showObjectLink: false,
    description:
      'Sesi login berhasil via 2FA Hardware Key. User-Agent: Mozilla/5.0 (macOS, Intel Mac OS X 14_2).',
    reference: 'Session Token #tok_88921f4c',
    referenceTone: 'text-indigo-500',
  },
  {
    id: 'LOG-ACT-9838',
    at: '',
    seq: 9838,
    actor: { name: 'Bagus Santoso', initials: 'BS', ip: '103.144.18.9', tone: 'teal' },
    action: 'REJECT_UMKM',
    tone: 'amber',
    category: 'Verifikasi UMKM',
    objectName: 'Kripik Singkong Mandiri',
    objectMeta: 'Entitas: UMKM [#SHOP-88190]',
    showObjectLink: true,
    description:
      'Penolakan pengajuan toko: Foto KTP pemilik buram dan nomor induk berusaha tidak cocok.',
    reference: 'Catatan Verifikator #REJ-098',
    referenceTone: 'text-slate-400',
  },
  {
    id: 'LOG-ACT-9837',
    at: '',
    seq: 9837,
    actor: { name: 'Dian Nurdin', initials: 'DN', ip: '36.88.204.12', tone: 'indigo' },
    action: 'UPDATE_ORDER',
    tone: 'teal',
    category: 'Pesanan',
    objectName: 'Pesanan #ORD-44910',
    objectMeta: 'Entitas: Transaksi Logistik',
    showObjectLink: true,
    description:
      'Override status pengiriman manual menjadi TERKIRIM atas konfirmasi Berita Acara.',
    reference: 'BAP Pos ID: #POS-IDN-991202',
    referenceTone: 'text-emerald-600',
  },
  {
    id: 'LOG-ACT-9836',
    at: '',
    seq: 9836,
    actor: { name: 'Admin Ratis', initials: 'AR', ip: '182.253.110.45', tone: 'emerald' },
    action: 'APPROVE_UMKM',
    tone: 'emerald',
    category: 'Verifikasi UMKM',
    objectName: 'Kain Tenun Jepara',
    objectMeta: 'Entitas: UMKM [#SHOP-88188]',
    showObjectLink: true,
    description:
      'Validasi kurasi produk kriya lokal Jawa Tengah dan persetujuan kemitraan binaan Dekranas.',
    reference: 'Binaan Dinas Koperasi No. 71/DK/26',
    referenceTone: 'text-emerald-600',
  },
  {
    id: 'LOG-ACT-9835',
    at: '',
    seq: 9835,
    actor: { name: 'Bagus Santoso', initials: 'BS', ip: '103.144.18.9', tone: 'teal' },
    action: 'RESET_PASSWORD',
    tone: 'teal',
    category: 'Pengguna',
    objectName: 'Siti Rahmawati',
    objectMeta: 'Entitas: Pengguna [#USR-0891]',
    showObjectLink: true,
    description:
      'Pengiriman tautan atur ulang kata sandi terenkripsi atas permintaan resmi via Helpdesk.',
    reference: 'Tiket Dukungan #HD-5510',
    referenceTone: 'text-slate-400',
  },
]

const TOTAL_ENTRIES = 2418

/** Jarak waktu (menit) entri pertama terhadap waktu muat halaman. */
const BASE_OFFSETS = [45, 118, 211, 371, 1042, 1143, 1268, 1493]

function createRandom(seed: number) {
  let state = seed >>> 0
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0
    return state / 4294967296
  }
}

function anchorDate() {
  return new Date(Date.now() - BASE_OFFSETS[0] * 60 * 1000)
}

function buildEntries(): ActivityEntry[] {
  const anchor = anchorDate()
  const entries: ActivityEntry[] = BASE_ENTRIES.map((entry, index) => ({
    ...entry,
    at: new Date(anchor.getTime() - (BASE_OFFSETS[index] - BASE_OFFSETS[0]) * 60 * 1000).toISOString(),
  }))

  const random = createRandom(20261124)
  let offsetMinutes = BASE_OFFSETS[BASE_OFFSETS.length - 1] + 19
  let seq = 9834

  while (entries.length < TOTAL_ENTRIES) {
    offsetMinutes += 5 + Math.floor(random() * 34)
    const template = TEMPLATES[Math.floor(random() * TEMPLATES.length)]
    const actor = ADMINS[Math.floor(random() * ADMINS.length)]

    let objectName = ''
    let objectMeta = ''
    let showObjectLink = false

    if (template.objectKind === 'umkm') {
      const shop = SHOPS[Math.floor(random() * SHOPS.length)]
      objectName = shop.name
      objectMeta = `Entitas: UMKM [${shop.code}]`
      showObjectLink = true
    } else if (template.objectKind === 'kategori') {
      const category = CATEGORIES[Math.floor(random() * CATEGORIES.length)]
      objectName = category.name
      objectMeta = `Entitas: Kategori [${category.code}]`
    } else if (template.objectKind === 'pengguna') {
      const user = USERS[Math.floor(random() * USERS.length)]
      objectName = user.name
      objectMeta = `Entitas: Pengguna [${user.code}]`
      showObjectLink = true
    } else if (template.objectKind === 'pesanan') {
      objectName = `Pesanan #ORD-${40000 + Math.floor(random() * 8999)}`
      objectMeta = 'Entitas: Transaksi Logistik'
      showObjectLink = true
    } else {
      objectName = random() > 0.5 ? 'Pusat Autentikasi SSO' : 'Konsol Ledger Audit'
      objectMeta = 'Modul: Core Auth'
    }

    const seed = Math.floor(random() * 1_000_000)

    entries.push({
      id: `LOG-ACT-${seq}`,
      at: new Date(anchor.getTime() - (offsetMinutes - BASE_OFFSETS[0]) * 60 * 1000).toISOString(),
      seq,
      actor,
      action: template.action,
      tone: template.tone,
      category: template.category,
      objectName,
      objectMeta,
      showObjectLink,
      description: template.description(objectName),
      reference: template.reference(seed),
      referenceTone: template.referenceTone,
    })

    seq -= 1
  }

  return entries
}

export const activityEntries: ActivityEntry[] = buildEntries()

export const activityCategories: ActivityCategory[] = [
  'Verifikasi UMKM',
  'Kategori',
  'Pengguna',
  'Autentikasi',
  'Pesanan',
]

export const activityLedger = {
  ledgerId: '#RATIS-AUD-2026-Q4',
  merkleRoot:
    '7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069',
  retentionLabel: 'Retensi 5 tahun sesuai UU PDP',
  criticalIncidents: 0,
}
