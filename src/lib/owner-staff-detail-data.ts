import {
  formatStaffWorkDays,
  getOwnerStaff,
  staffQuota,
  staffShiftOptions,
  type AccessModule,
  type StaffMember,
  type StaffRole,
} from './owner-staff-data'

export type StaffActivityCategory = 'Pesanan' | 'Stok' | 'Sesi Login'
export type StaffActivityKind =
  | 'check'
  | 'order'
  | 'stock'
  | 'login'
  | 'receipt'
  | 'packing'
  | 'warning'
export type StaffActivityTagTone = 'green' | 'blue' | 'amber' | 'slate'

export type StaffActivity = {
  id: string
  category: StaffActivityCategory
  kind: StaffActivityKind
  title: string
  reference?: string
  time: string
  description: string
  meta?: string
  tag?: { label: string; tone: StaffActivityTagTone }
}

export type StaffAccessModule = {
  key: string
  title: string
  description: string
}

export type StaffDetailMetricKey = 'orders' | 'pos' | 'stock' | 'device'
export type StaffMetricTone = 'green' | 'blue' | 'teal' | 'slate'

export type StaffDetailMetric = {
  key: StaffDetailMetricKey
  label: string
  value: string
  helper: string
  badge?: string
  badgeTone?: StaffMetricTone
  progress: number
  accent: StaffMetricTone
  meta?: string
}

export type StaffDetailSession = {
  deviceName: string
  status: 'Online' | 'Offline'
  detail: string
  passwordChanged: string
  ip: string
}

export type StaffDetail = {
  staff: StaffMember
  staffCode: string
  roleLevel: string
  joinedAt: string
  tenure: string
  shiftName: string
  shiftTime: string
  branch: string
  internalNote: string
  internalNoteUpdated: string
  metrics: StaffDetailMetric[]
  accessModules: StaffAccessModule[]
  restrictedModules: StaffAccessModule[]
  activities: StaffActivity[]
  session: StaffDetailSession
  quotaPosition: string
}

type StaffProfileSeed = {
  staffCode: string
  joinedAt: string
  tenure: string
  shiftName: string
  shiftTime: string
  internalNote: string
  internalNoteUpdated: string
  passwordChanged: string
  deviceName: string
  sessionDetail: string
  ip: string
  deviceOnlineValue: string
  deviceHelper: string
}

type MetricSeed = {
  orders: {
    value: string
    helper: string
    badge?: string
    badgeTone?: StaffMetricTone
    progress: number
  }
  pos: {
    value: string
    helper: string
    badge?: string
    badgeTone?: StaffMetricTone
    progress: number
  }
  stock: {
    value: string
    helper: string
    badge?: string
    badgeTone?: StaffMetricTone
    progress: number
  }
}

const moduleCatalog: Record<string, StaffAccessModule> = {
  orders: {
    key: 'orders',
    title: 'Modul Manajemen Pesanan',
    description: 'Menerima, memproses, menyelesaikan order, dan cetak struk',
  },
  pos: {
    key: 'pos',
    title: 'Kasir Point-of-Sale (POS)',
    description: 'Input transaksi walk-in, pembayaran tunai fisik & status QRIS',
  },
  chat: {
    key: 'chat',
    title: 'Chat Pelanggan',
    description: 'Membalas pertanyaan pelanggan terkait pesanan toko',
  },
  stock: {
    key: 'stock',
    title: 'Penyesuaian Stok Harian',
    description: 'Update restock batch dapur dan laporkan produk kadaluarsa/rusak',
  },
  ingredients: {
    key: 'ingredients',
    title: 'Opname Bahan Baku',
    description: 'Catat sisa bahan harian dan penyesuaian porsi produksi',
  },
  label: {
    key: 'label',
    title: 'Cetak Label & Resi',
    description: 'Cetak label alamat dan nomor resi pengiriman pelanggan',
  },
  shipping: {
    key: 'shipping',
    title: 'Status Pengiriman',
    description: 'Validasi status kirim dan serah-terima ke kurir instan',
  },
  catalog: {
    key: 'catalog',
    title: 'Katalog Produk & Harga Jual',
    description: 'Melihat daftar harga katalog, varian kue, dan sisa stok toko',
  },
}

const restrictedModules: StaffAccessModule[] = [
  {
    key: 'finance',
    title: 'Laporan Keuangan & Ekspor CSV',
    description: 'Data omzet, laba bersih, dan histori pajak hanya untuk pemilik.',
  },
  {
    key: 'wallet',
    title: 'Buku Kas & Penarikan Dana Bank',
    description: 'Pencairan saldo dompet QRIS ke rekening bank toko.',
  },
  {
    key: 'store',
    title: 'Ubah Profil Toko & Dokumen Legalitas NIB',
    description: 'Konfigurasi alamat, domain storefront, dan legalitas badan usaha.',
  },
  {
    key: 'users',
    title: 'Kelola Akses Akun Staf Lain',
    description: 'Menambah, mengedit, atau menghapus hak akses staf lain.',
  },
]

const roleAccessKeys: Record<StaffRole, string[]> = {
  'Kasir & Layanan Pesanan': ['orders', 'pos', 'stock', 'catalog'],
  'Koordinator Dapur & Stok': ['orders', 'stock', 'ingredients', 'catalog'],
  'Packing & Kurir Hand-off': ['orders', 'shipping', 'label', 'catalog'],
  'Packing & Ekspedisi Kurir': ['orders', 'shipping', 'label', 'catalog'],
  'Staf Magang Dapur (Eks)': ['orders', 'catalog'],
}

const accessToModuleKey: Record<AccessModule, string> = {
  Pesanan: 'orders',
  'POS Kasir': 'pos',
  'Chat Pelanggan': 'chat',
  'Penyesuaian Stok': 'stock',
  'Opname Bahan': 'ingredients',
  'Cetak Resi': 'label',
  'Status Kirim': 'shipping',
}

const roleLevels: Record<StaffRole, string> = {
  'Kasir & Layanan Pesanan': 'Kasir Operasional',
  'Koordinator Dapur & Stok': 'Koordinator Dapur',
  'Packing & Kurir Hand-off': 'Packing & Hand-off',
  'Packing & Ekspedisi Kurir': 'Packing & Ekspedisi',
  'Staf Magang Dapur (Eks)': 'Staf Magang',
}

const profileSeeds: Record<string, StaffProfileSeed> = {
  'staff-1': {
    staffCode: 'STF-2026-003',
    joinedAt: '15 Januari 2026',
    tenure: '4 bulan 9 hari bekerja',
    shiftName: 'Shift Pagi',
    shiftTime: '07.30 - 15.30 WIB (Senin - Sabtu)',
    internalNote:
      'Staf senior kasir depan yang sangat teliti dalam rekonsiliasi uang fisik kasir dan pencatatan transaksi QRIS harian. Handal mengoperasikan tablet kasir dan cetakan saat antrean toko sedang ramai di jam sarapan & makan siang.',
    internalNoteUpdated: 'Diperbarui 10 Feb 2026',
    passwordChanged: '12 Feb 2026 oleh Bu Sari',
    deviceName: 'Kasir POS Meja Toko',
    sessionDetail:
      'Chrome 122 • Windows 11 • Terkoneksi sejak 07:28 WIB hari ini',
    ip: '182.253.14.90',
    deviceOnlineValue: 'Sedang Aktif Bekerja',
    deviceHelper: 'Web Kasir POS • Chrome Windows',
  },
  'staff-2': {
    staffCode: 'STF-2026-001',
    joinedAt: '3 Februari 2026',
    tenure: '9 bulan 24 hari bekerja',
    shiftName: 'Shift Siang',
    shiftTime: '11.00 - 19.00 WIB (Senin - Sabtu)',
    internalNote:
      'Koordinator dapur yang disiplin dalam opname bahan baku dan menjaga konsistensi porsi produksi. Perlu pendampingan saat jam sibuk untuk memastikan menu sold-out diperbarui tepat waktu.',
    internalNoteUpdated: 'Diperbarui 18 Mar 2026',
    passwordChanged: '20 Mar 2026 oleh Bu Sari',
    deviceName: 'Tablet Dapur',
    sessionDetail:
      'Android Tablet Dapur • Chrome • Terkoneksi sejak 12:10 WIB hari ini',
    ip: '182.253.14.91',
    deviceOnlineValue: 'Aktif di Tablet Dapur',
    deviceHelper: 'Android Tablet Dapur • Chrome',
  },
  'staff-3': {
    staffCode: 'STF-2026-002',
    joinedAt: '20 Maret 2026',
    tenure: '8 bulan 7 hari bekerja',
    shiftName: 'Shift Siang',
    shiftTime: '11.00 - 19.00 WIB (Senin - Sabtu)',
    internalNote:
      'Cekatan dalam packing pesanan katering dan konsisten memvalidasi alamat pengiriman sebelum hand-off ke kurir. Komunikatif saat berkoordinasi dengan pelanggan via chat toko.',
    internalNoteUpdated: 'Diperbarui 5 Apr 2026',
    passwordChanged: '20 Mar 2026 oleh Bu Sari',
    deviceName: 'Mobile App Staf',
    sessionDetail:
      'Mobile App Staf • Android 14 • Terkoneksi sejak 11:30 WIB hari ini',
    ip: '182.253.14.92',
    deviceOnlineValue: 'Aktif di Mobile App Staf',
    deviceHelper: 'Mobile App Staf • Android 14',
  },
  'staff-4': {
    staffCode: 'STF-2025-018',
    joinedAt: '18 November 2025',
    tenure: 'Program magang selesai',
    shiftName: 'Shift Pagi',
    shiftTime: '07.30 - 15.30 WIB (Senin - Jumat)',
    internalNote:
      'Peserta magang dapur yang menyelesaikan program dengan baik. Seluruh akses dicabut setelah masa magang berakhir dan riwayat aktivitas tetap tersimpan untuk audit.',
    internalNoteUpdated: 'Diperbarui 18 Mei 2026',
    passwordChanged: '18 Nov 2025 oleh Bu Sari',
    deviceName: 'Tidak ada perangkat aktif',
    sessionDetail: 'Akun dinonaktifkan sejak 18 Mei 2026.',
    ip: '-',
    deviceOnlineValue: 'Tidak Ada Sesi Aktif',
    deviceHelper: 'Akses akun sudah dinonaktifkan',
  },
}

const metricSeeds: Record<string, MetricSeed> = {
  'staff-1': {
    orders: {
      value: '142',
      helper: 'Pesanan selesai bulan ini',
      badge: '+18%',
      badgeTone: 'green',
      progress: 72,
    },
    pos: {
      value: 'Rp18.450.000',
      helper: 'Tunai fisik & QRIS',
      badge: 'Bulan Nov',
      badgeTone: 'blue',
      progress: 58,
    },
    stock: {
      value: '12 Kali',
      helper: 'Opname & restock dapur pagi',
      badge: 'Akurat',
      badgeTone: 'green',
      progress: 42,
    },
  },
  'staff-2': {
    orders: {
      value: '96',
      helper: 'Pesanan selesai bulan ini',
      badge: '+9%',
      badgeTone: 'green',
      progress: 55,
    },
    pos: {
      value: 'Rp0',
      helper: 'Tidak memegang kasir POS',
      badge: 'Tidak Aktif',
      badgeTone: 'slate',
      progress: 0,
    },
    stock: {
      value: '24 Kali',
      helper: 'Opname bahan & update porsi',
      badge: 'Akurat',
      badgeTone: 'green',
      progress: 68,
    },
  },
  'staff-3': {
    orders: {
      value: '118',
      helper: 'Pesanan selesai bulan ini',
      badge: '+12%',
      badgeTone: 'green',
      progress: 64,
    },
    pos: {
      value: 'Rp0',
      helper: 'Tidak memegang kasir POS',
      badge: 'Tidak Aktif',
      badgeTone: 'slate',
      progress: 0,
    },
    stock: {
      value: '8 Kali',
      helper: 'Validasi stok bahan packing',
      badge: 'Akurat',
      badgeTone: 'green',
      progress: 36,
    },
  },
  'staff-4': {
    orders: {
      value: '0',
      helper: 'Tidak ada pesanan aktif',
      badge: 'Nonaktif',
      badgeTone: 'slate',
      progress: 0,
    },
    pos: {
      value: 'Rp0',
      helper: 'Tidak memegang kasir POS',
      badge: 'Tidak Aktif',
      badgeTone: 'slate',
      progress: 0,
    },
    stock: {
      value: '0 Kali',
      helper: 'Tidak ada penyesuaian stok',
      badge: 'Nonaktif',
      badgeTone: 'slate',
      progress: 0,
    },
  },
}

const defaultMetricSeed: MetricSeed = {
  orders: {
    value: '0',
    helper: 'Belum ada pesanan bulan ini',
    badge: 'Baru',
    badgeTone: 'slate',
    progress: 0,
  },
  pos: {
    value: 'Rp0',
    helper: 'Belum ada transaksi kasir',
    badge: 'Bulan Nov',
    badgeTone: 'blue',
    progress: 0,
  },
  stock: {
    value: '0 Kali',
    helper: 'Belum ada penyesuaian stok',
    badge: 'Belum ada',
    badgeTone: 'slate',
    progress: 0,
  },
}

const activitySeeds: Record<string, StaffActivity[]> = {
  'staff-1': [
    {
      id: 'staff-1-activity-1',
      category: 'Pesanan',
      kind: 'check',
      title: 'Menyelesaikan Pesanan Transaksi Kasir',
      reference: '#RTS-20261123-004',
      time: '18 menit yang lalu',
      description:
        '2 item (1x Bolu Gulung Pandan, 1x Pastel Telur Sayur) • Total Rp185.000 (Tunai Kasir POS - LaciKasir Utama).',
      meta: 'Struk fisik dicetak otomatis',
    },
    {
      id: 'staff-1-activity-2',
      category: 'Pesanan',
      kind: 'order',
      title: 'Menerima & Memproses Pesanan Online',
      reference: '#RTS-20261123-001',
      time: '1 jam yang lalu',
      description:
        'Pesanan masuk dari Storefront Web Dapur Bu Sari atas nama pelanggan Ibu Dewi Wardani. Menyiapkan paket kue basah.',
    },
    {
      id: 'staff-1-activity-3',
      category: 'Stok',
      kind: 'stock',
      title: 'Penyesuaian Stok Produk (Opname Pagi)',
      time: '3 jam yang lalu',
      description:
        'Tambah stok: Lapis Legit Spesial Wisman (Batch Produksi Dapur Pagi #DP-01). Sisa stok saat ini: 18 Loyang.',
      tag: { label: '+10 Loyang', tone: 'green' },
    },
    {
      id: 'staff-1-activity-4',
      category: 'Sesi Login',
      kind: 'login',
      title: 'Sesi Login Kasir POS Terverifikasi',
      time: 'Hari ini, 07:28 WIB',
      description:
        'Login dari Desktop Kasir Meja Depan (Chrome 122 on Windows 11) • IP: 182.253.14.90 (Koneksi WiFi Dapur Bu Sari Tebet).',
      tag: { label: 'Sukses', tone: 'green' },
    },
    {
      id: 'staff-1-activity-5',
      category: 'Pesanan',
      kind: 'receipt',
      title: 'Cetak Ulang Struk Pembayaran',
      reference: '#RTS-20261122-019',
      time: 'Kemarin, 16:45 WIB',
      description:
        'Permintaan struk fisik tambahan untuk arsip klaim konsumsi kantor pelanggan PT Nusantara Raya.',
    },
    {
      id: 'staff-1-activity-6',
      category: 'Stok',
      kind: 'stock',
      title: 'Restock Bahan Baku Tepung & Gula',
      time: 'Kemarin, 09:10 WIB',
      description:
        'Menerima pasokan 25 kg tepung serbaguna dan 10 kg gula pasir dari supplier langganan. Stok opname disesuaikan.',
      tag: { label: '+35 kg', tone: 'green' },
    },
    {
      id: 'staff-1-activity-7',
      category: 'Sesi Login',
      kind: 'login',
      title: 'Login Aplikasi Staf via Ponsel',
      time: '23 Nov 2026, 07:15 WIB',
      description:
        'Login dari Mobile App Staf (Android 14) • IP: 182.253.14.90. Perangkat dikenali sebagai perangkat pribadi Rina.',
      tag: { label: 'Sukses', tone: 'green' },
    },
    {
      id: 'staff-1-activity-8',
      category: 'Pesanan',
      kind: 'packing',
      title: 'Serah Terima Pesanan ke Kurir',
      reference: '#RTS-20261122-012',
      time: '22 Nov 2026, 14:20 WIB',
      description:
        'Pesanan katering 12 box diserahkan ke kurir internal toko. Bukti foto serah-terima tersimpan di arsip.',
      meta: 'Dokumentasi foto tersimpan',
    },
  ],
  'staff-2': [
    {
      id: 'staff-2-activity-1',
      category: 'Stok',
      kind: 'stock',
      title: 'Opname Bahan Baku Harian',
      time: 'Hari ini, 12:05 WIB',
      description:
        'Mencatat sisa 18 kg ayam, 25 kg beras, dan 6 liter minyak goreng. Selisih stok sudah disesuaikan.',
      tag: { label: '+3 Bahan', tone: 'green' },
    },
    {
      id: 'staff-2-activity-2',
      category: 'Stok',
      kind: 'stock',
      title: 'Menandai Menu Sold Out',
      time: 'Hari ini, 10:42 WIB',
      description:
        'Produk Nasi Bakar Ayam Kemangi ditandai habis untuk shift siang.',
      tag: { label: 'Sold Out', tone: 'amber' },
    },
    {
      id: 'staff-2-activity-3',
      category: 'Sesi Login',
      kind: 'login',
      title: 'Sesi Login Tablet Dapur Terverifikasi',
      time: 'Hari ini, 09:12 WIB',
      description:
        'Login dari Android Tablet Dapur (Chrome) • IP: 182.253.14.91 (WiFi Dapur Bu Sari Tebet).',
      tag: { label: 'Sukses', tone: 'green' },
    },
    {
      id: 'staff-2-activity-4',
      category: 'Pesanan',
      kind: 'packing',
      title: 'Serah Terima Pesanan Katering',
      reference: '#RTS-20261122-008',
      time: 'Kemarin, 15:10 WIB',
      description:
        'Memverifikasi 20 box pesanan katering dan menyerahkan ke kurir internal.',
      meta: 'Dokumentasi foto tersimpan',
    },
  ],
  'staff-3': [
    {
      id: 'staff-3-activity-1',
      category: 'Pesanan',
      kind: 'packing',
      title: 'Mencetak Label Pengiriman',
      reference: '#RTS-20261123-006',
      time: 'Hari ini, 11:20 WIB',
      description:
        'Mencetak 6 label alamat untuk pesanan kurir instan.',
      tag: { label: '6 Label', tone: 'blue' },
    },
    {
      id: 'staff-3-activity-2',
      category: 'Pesanan',
      kind: 'check',
      title: 'Validasi Status Kirim Kurir',
      reference: '#RTS-20261122-014',
      time: 'Kemarin, 16:05 WIB',
      description:
        'Memperbarui status pengiriman menjadi Dalam Perjalanan untuk 4 pesanan.',
      tag: { label: '4 Pesanan', tone: 'blue' },
    },
    {
      id: 'staff-3-activity-3',
      category: 'Sesi Login',
      kind: 'login',
      title: 'Sesi Login Mobile App Staf',
      time: 'Hari ini, 11:30 WIB',
      description:
        'Login dari Mobile App Staf (Android 14) • IP: 182.253.14.92.',
      tag: { label: 'Sukses', tone: 'green' },
    },
  ],
  'staff-4': [
    {
      id: 'staff-4-activity-1',
      category: 'Sesi Login',
      kind: 'warning',
      title: 'Akses Akun Dinonaktifkan',
      time: '18 Mei 2026, 17:00 WIB',
      description:
        'Masa magang selesai. Akses akun dicabut oleh pemilik toko.',
      tag: { label: 'Nonaktif', tone: 'slate' },
    },
    {
      id: 'staff-4-activity-2',
      category: 'Pesanan',
      kind: 'check',
      title: 'Menyelesaikan Pesanan Terakhir',
      reference: '#RTS-20260518-003',
      time: '18 Mei 2026, 14:20 WIB',
      description:
        'Menyelesaikan 2 pesanan storefront sebelum penonaktifan akun.',
      tag: { label: 'Selesai', tone: 'green' },
    },
    {
      id: 'staff-4-activity-3',
      category: 'Stok',
      kind: 'stock',
      title: 'Opname Bahan Penutupan Magang',
      time: '18 Mei 2026, 13:00 WIB',
      description:
        'Menyerahkan catatan stok akhir kepada koordinator dapur.',
    },
  ],
}

function buildFallbackProfile(staff: StaffMember): StaffProfileSeed {
  const joinedAt = new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date())

  return {
    staffCode: `STF-${new Date().getFullYear()}-${String(getOwnerStaff().length).padStart(3, '0')}`,
    joinedAt,
    tenure: 'Baru bergabung',
    shiftName: 'Belum dijadwalkan',
    shiftTime: 'Menunggu penjadwalan shift',
    internalNote: 'Belum ada catatan internal untuk staf ini.',
    internalNoteUpdated: 'Belum diperbarui',
    passwordChanged: 'Belum pernah diganti',
    deviceName: staff.lastActiveDevice || 'Tidak ada perangkat aktif',
    sessionDetail: 'Staf belum pernah login ke perangkat operasional.',
    ip: '-',
    deviceOnlineValue: 'Belum Pernah Login',
    deviceHelper: 'Menunggu login pertama staf',
  }
}

function buildSession(
  staff: StaffMember,
  profile: StaffProfileSeed,
  forceLoggedOut: boolean,
): StaffDetailSession {
  const hasSession =
    staff.status === 'Aktif' &&
    Boolean(staff.lastActiveDevice) &&
    staff.lastActiveDevice !== 'Belum pernah login' &&
    staff.lastActive !== 'Baru ditambahkan'

  if (forceLoggedOut || !hasSession) {
    const detail = forceLoggedOut
      ? 'Sesi aktif telah dikeluarkan oleh pemilik toko.'
      : staff.status === 'Nonaktif'
        ? 'Akun dinonaktifkan. Staf tidak dapat login sampai akses diaktifkan kembali.'
        : staff.lastActiveDevice === 'Belum pernah login'
          ? 'Staf belum pernah login. Menunggu aktivasi perangkat pertama.'
          : 'Tidak ada perangkat yang sedang aktif.'

    return {
      deviceName: forceLoggedOut
        ? 'Tidak ada perangkat aktif'
        : staff.lastActiveDevice || 'Tidak ada perangkat aktif',
      status: 'Offline',
      detail,
      passwordChanged: profile.passwordChanged,
      ip: '-',
    }
  }

  return {
    deviceName: profile.deviceName,
    status: 'Online',
    detail: profile.sessionDetail,
    passwordChanged: profile.passwordChanged,
    ip: profile.ip,
  }
}

function buildMetrics(
  staff: StaffMember,
  session: StaffDetailSession,
  profile: StaffProfileSeed,
): StaffDetailMetric[] {
  const seed = metricSeeds[staff.id] ?? defaultMetricSeed
  const online = session.status === 'Online'

  return [
    {
      key: 'orders',
      label: 'Pesanan Diproses',
      value: seed.orders.value,
      helper: seed.orders.helper,
      badge: seed.orders.badge,
      badgeTone: seed.orders.badgeTone ?? 'green',
      progress: seed.orders.progress,
      accent: 'green',
    },
    {
      key: 'pos',
      label: 'Transaksi Kasir POS',
      value: seed.pos.value,
      helper: seed.pos.helper,
      badge: seed.pos.badge,
      badgeTone: seed.pos.badgeTone ?? 'blue',
      progress: seed.pos.progress,
      accent: 'blue',
    },
    {
      key: 'stock',
      label: 'Penyesuaian Stok',
      value: seed.stock.value,
      helper: seed.stock.helper,
      badge: seed.stock.badge,
      badgeTone: seed.stock.badgeTone ?? 'green',
      progress: seed.stock.progress,
      accent: 'teal',
    },
    {
      key: 'device',
      label: 'Status Perangkat Sesi',
      value: online ? profile.deviceOnlineValue : 'Tidak Ada Sesi Aktif',
      helper: online ? profile.deviceHelper : 'Tidak ada perangkat yang sedang aktif',
      badge: online ? 'Sesi Aktif' : 'Offline',
      badgeTone: online ? 'green' : 'slate',
      progress: online ? 100 : 0,
      accent: 'slate',
      meta: online ? `IP: ${session.ip}` : 'IP: -',
    },
  ]
}

function getAccessModules(staff: StaffMember): StaffAccessModule[] {
  const roleKeys = roleAccessKeys[staff.role]

  if (roleKeys) {
    return roleKeys.flatMap((key) => {
      const module = moduleCatalog[key]
      return module ? [{ ...module }] : []
    })
  }

  const keys = Array.from(
    new Set([...staff.access.map((access) => accessToModuleKey[access]), 'catalog']),
  )

  return keys.flatMap((key) => {
    const module = moduleCatalog[key]
    return module ? [{ ...module }] : []
  })
}

function getActivities(staff: StaffMember): StaffActivity[] {
  const seeded = activitySeeds[staff.id]

  if (seeded) return seeded

  if (staff.lastActive === 'Baru ditambahkan') {
    return [
      {
        id: `${staff.id}-activity-created`,
        category: 'Sesi Login',
        kind: 'login',
        title: 'Akun Staf Baru Terdaftar',
        time: 'Baru saja',
        description: `Akun ${staff.name} berhasil dibuat oleh pemilik toko. Staf dapat login menggunakan email ${staff.email}.`,
        tag: { label: 'Baru', tone: 'blue' },
      },
    ]
  }

  return [
    {
      id: `${staff.id}-activity-last`,
      category: 'Sesi Login',
      kind: 'login',
      title: 'Aktivitas Terakhir Staf',
      time: staff.lastActive,
      description: staff.lastActiveDevice
        ? `Tercatat aktivitas terakhir dari ${staff.lastActiveDevice}.`
        : 'Belum ada aktivitas operasional yang tercatat.',
      tag: { label: staff.status, tone: staff.status === 'Aktif' ? 'green' : 'slate' },
    },
  ]
}

export function getOwnerStaffDetail(
  id: string,
  storeName = 'Dapur Bu Sari',
  options: { forceLoggedOut?: boolean } = {},
): StaffDetail | undefined {
  const staffList = getOwnerStaff()
  const staff = staffList.find((item) => item.id === id)

  if (!staff) return undefined

  const profile = profileSeeds[staff.id] ?? buildFallbackProfile(staff)
  const session = buildSession(staff, profile, Boolean(options.forceLoggedOut))
  const index = staffList.findIndex((item) => item.id === staff.id)
  const shift = staff.shiftId
    ? staffShiftOptions.find((option) => option.id === staff.shiftId)
    : undefined
  const internalNote =
    staff.internalNote !== undefined
      ? staff.internalNote.trim() || 'Belum ada catatan internal untuk staf ini.'
      : profile.internalNote

  return {
    staff,
    staffCode: profile.staffCode,
    roleLevel: roleLevels[staff.role],
    joinedAt: profile.joinedAt,
    tenure: profile.tenure,
    shiftName: shift?.name ?? profile.shiftName,
    shiftTime: shift
      ? `${shift.range} WIB (${formatStaffWorkDays(staff.workDays)})`
      : profile.shiftTime,
    branch: staff.branch ?? `${storeName} - Outlet Utama (Tebet)`,
    internalNote,
    internalNoteUpdated:
      staff.internalNote !== undefined ? 'Diperbarui hari ini' : profile.internalNoteUpdated,
    metrics: buildMetrics(staff, session, profile),
    accessModules: getAccessModules(staff),
    restrictedModules: restrictedModules.map((module) => ({ ...module })),
    activities: getActivities(staff),
    session,
    quotaPosition: `Staf ${index + 1} dari ${staffQuota} Kuota`,
  }
}
