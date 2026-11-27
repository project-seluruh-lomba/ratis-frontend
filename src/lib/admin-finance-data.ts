import type { PayoutRecord, PayoutStatus } from './api/types'

export type { PayoutRecord, PayoutStatus }

export type FinanceDay = {
  date: string
  label: string
  gross: number
  disbursed: number
  commission: number
  orders: number
}

export type CommissionTier = {
  label: string
  rate: string
  note: string
}

export type AuditEntry = {
  title: string
  description: string
  time: string
  tone: 'success' | 'warning'
  badge?: string
}

const DAY_COUNT = 24
const TOTAL_GROSS = 142_850_000
const TOTAL_ORDERS = 1_480

const today = new Date()
const monthKey = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}`

const dateKeyFormatter = new Intl.DateTimeFormat('en-CA', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

const dayLabelFormatter = new Intl.DateTimeFormat('id-ID', {
  day: '2-digit',
  month: 'short',
})

export const financeMonthLabel = new Intl.DateTimeFormat('id-ID', {
  month: 'short',
  year: 'numeric',
}).format(today)

function buildFinanceDays(): FinanceDay[] {
  const weights = Array.from({ length: DAY_COUNT }, (_, index) => {
    return 0.82 + 0.26 * Math.sin(index / 2.15) + 0.12 * Math.cos(index / 1.4) + index * 0.01
  })
  const weightSum = weights.reduce((total, weight) => total + weight, 0)

  const grossValues = weights.map((weight) => Math.round((TOTAL_GROSS * weight) / weightSum))
  const orderValues = weights.map((weight) => Math.round((TOTAL_ORDERS * weight) / weightSum))

  grossValues[DAY_COUNT - 1] +=
    TOTAL_GROSS - grossValues.reduce((total, value) => total + value, 0)
  orderValues[DAY_COUNT - 1] +=
    TOTAL_ORDERS - orderValues.reduce((total, value) => total + value, 0)

  return grossValues.map((gross, index) => {
    const date = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate() - (DAY_COUNT - 1 - index),
    )

    return {
      date: dateKeyFormatter.format(date),
      label: index === DAY_COUNT - 1 ? 'Hari Ini' : dayLabelFormatter.format(date),
      gross,
      disbursed: Math.round(gross * (0.55 + 0.08 * Math.sin(index / 1.7))),
      commission: Math.round(gross * 0.01),
      orders: orderValues[index],
    }
  })
}

export const financeDays: FinanceDay[] = buildFinanceDays()

export const escrowAccount = {
  bank: 'Bank Rakyat Indonesia (BRI)',
  bankShort: 'BRI',
  accountNumber: '0206-01-003921-30-8',
  balance: 45_890_000,
}

export const commissionTiers: CommissionTier[] = [
  { label: 'Kuliner & Pangan Olahan', rate: '1.0%', note: 'Inklusif' },
  { label: 'Kriya & Kerajinan Tangan', rate: '1.5%', note: 'Standar' },
  { label: 'Fesyen & Tekstil Daerah', rate: '2.0%', note: 'Premium' },
]

function submittedAt(daysAgo: number, hour: number, minute: number) {
  return new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate() - daysAgo,
    hour,
    minute,
  ).toISOString()
}

const basePayouts: PayoutRecord[] = [
  {
    id: `#PAY-${monthKey}-094`,
    storeName: 'Warung Bu Sari',
    owner: 'Sari Wulandari',
    bank: 'Bank BCA',
    account: '8045-9812-90',
    method: 'BI-FAST',
    netAmount: 1_845_000,
    commission: 18_650,
    submittedAt: submittedAt(0, 8, 30),
    status: 'menunggu',
  },
  {
    id: `#PAY-${monthKey}-093`,
    storeName: 'Kopi Kenangan Senja',
    owner: 'Rian Pratama',
    bank: 'Bank Mandiri',
    account: '1370-0199-2810',
    method: 'Realtime RTGS',
    netAmount: 4_210_000,
    commission: 42_500,
    submittedAt: submittedAt(0, 7, 15),
    status: 'menunggu',
  },
  {
    id: `#PAY-${monthKey}-092`,
    storeName: 'Dapur Sambal Mak Iinem',
    owner: 'Iinem Rahayu',
    bank: 'Bank BRI',
    account: '0206-0105-9921',
    method: 'BI-FAST',
    netAmount: 980_000,
    commission: 9_900,
    submittedAt: submittedAt(1, 18, 40),
    status: 'berhasil',
  },
  {
    id: `#PAY-${monthKey}-091`,
    storeName: 'Batik Sekar Wangi',
    owner: 'Dewi Kusuma',
    bank: 'Bank BNI',
    account: '0941-2098-44',
    method: 'Kliring SKN',
    netAmount: 6_450_000,
    commission: 129_000,
    submittedAt: submittedAt(1, 16, 20),
    status: 'diverifikasi',
  },
  {
    id: `#PAY-${monthKey}-090`,
    storeName: 'Kripik Tempe Barokah',
    owner: 'Ahmad Fauzi',
    bank: 'BS Syariah',
    account: '7120-4491-02',
    method: 'BI-FAST',
    netAmount: 1_155_000,
    commission: 11_660,
    submittedAt: submittedAt(1, 14, 30),
    status: 'terkirim',
  },
]

const payoutPartners = [
  {
    storeName: 'Kopi Nusantara Lestari',
    owner: 'Bagas Pratama',
    bank: 'Bank Mandiri',
    account: '1370-2114-8890',
    method: 'Realtime RTGS',
  },
  {
    storeName: 'Dapur Oma Elly',
    owner: 'Elly Kusnadi',
    bank: 'Bank BCA',
    account: '8045-1120-77',
    method: 'BI-FAST',
  },
  {
    storeName: 'Toko Berkah Jaya',
    owner: 'Nur Aisyah',
    bank: 'Bank BRI',
    account: '0206-0112-8834',
    method: 'BI-FAST',
  },
  {
    storeName: 'Batik Malakota Solo',
    owner: 'Agus Setiawan',
    bank: 'Bank BNI',
    account: '0941-2280-15',
    method: 'Kliring SKN',
  },
  {
    storeName: 'Madu Hutan Murni Riau',
    owner: 'Hendra Wijaya',
    bank: 'BS Syariah',
    account: '7120-5581-90',
    method: 'BI-FAST',
  },
  {
    storeName: 'Anyaman Bambu Asri',
    owner: 'Bambang Sutrisno',
    bank: 'Bank BCA',
    account: '8045-2298-41',
    method: 'BI-FAST',
  },
  {
    storeName: 'Rajut Ceria Nusantara',
    owner: 'Fitri Handayani',
    bank: 'Bank Mandiri',
    account: '1370-4471-02',
    method: 'Realtime RTGS',
  },
  {
    storeName: 'Gula Aren Sejahtera',
    owner: 'Umi Kalsum',
    bank: 'Bank BRI',
    account: '0206-7712-45',
    method: 'BI-FAST',
  },
  {
    storeName: 'Keripik Tempe Mbok Nem',
    owner: 'Dewi Lestari',
    bank: 'Bank BNI',
    account: '0941-6630-28',
    method: 'Kliring SKN',
  },
  {
    storeName: 'Es Cendol Dawet Bu Inem',
    owner: 'Inem Sunarti',
    bank: 'BS Syariah',
    account: '7120-9034-11',
    method: 'BI-FAST',
  },
  {
    storeName: 'Tenun Ikat Lestari',
    owner: 'Sri Hartati',
    bank: 'Bank BCA',
    account: '8045-8821-39',
    method: 'BI-FAST',
  },
  {
    storeName: 'Minyak Kelapa Alami',
    owner: 'Rina Marlina',
    bank: 'Bank Mandiri',
    account: '1370-3320-87',
    method: 'Realtime RTGS',
  },
  {
    storeName: 'Warung Sambal Maknyus',
    owner: 'Yanto Susilo',
    bank: 'Bank BRI',
    account: '0206-4419-82',
    method: 'BI-FAST',
  },
  {
    storeName: 'Kopi Lereng Merapi',
    owner: 'Dimas Prakoso',
    bank: 'Bank BNI',
    account: '0941-7712-40',
    method: 'Kliring SKN',
  },
  {
    storeName: 'Sambal Bawang Bu Tuti',
    owner: 'Tuti Alawiyah',
    bank: 'BS Syariah',
    account: '7120-1188-27',
    method: 'BI-FAST',
  },
  {
    storeName: 'Roti Ketawa Bintang',
    owner: 'Hendra Gunawan',
    bank: 'Bank BCA',
    account: '8045-5540-63',
    method: 'BI-FAST',
  },
  {
    storeName: 'Madu Lebah Hutan',
    owner: 'Siti Fatimah',
    bank: 'Bank Mandiri',
    account: '1370-8890-31',
    method: 'Realtime RTGS',
  },
  {
    storeName: 'Tas Rajut Nusantara',
    owner: 'Lina Marlina',
    bank: 'Bank BRI',
    account: '0206-9921-14',
    method: 'BI-FAST',
  },
  {
    storeName: 'Batik Tulis Sogan',
    owner: 'Retno Wulandari',
    bank: 'Bank BNI',
    account: '0941-3302-77',
    method: 'Kliring SKN',
  },
]

const extraPayoutPlans: { status: PayoutStatus; netAmount: number }[] = [
  { status: 'menunggu', netAmount: 1_240_000 },
  { status: 'menunggu', netAmount: 1_500_000 },
  { status: 'diverifikasi', netAmount: 620_000 },
  { status: 'diverifikasi', netAmount: 640_000 },
  { status: 'diverifikasi', netAmount: 1_425_000 },
  { status: 'diverifikasi', netAmount: 710_000 },
  { status: 'berhasil', netAmount: 2_340_000 },
  { status: 'berhasil', netAmount: 1_120_000 },
  { status: 'berhasil', netAmount: 3_850_000 },
  { status: 'berhasil', netAmount: 900_000 },
  { status: 'berhasil', netAmount: 2_760_000 },
  { status: 'berhasil', netAmount: 1_480_000 },
  { status: 'berhasil', netAmount: 5_120_000 },
  { status: 'berhasil', netAmount: 1_760_000 },
  { status: 'berhasil', netAmount: 2_050_000 },
  { status: 'berhasil', netAmount: 980_000 },
  { status: 'berhasil', netAmount: 3_300_000 },
  { status: 'terkirim', netAmount: 1_240_000 },
  { status: 'terkirim', netAmount: 4_600_000 },
]

const extraPayouts: PayoutRecord[] = extraPayoutPlans.map((plan, index) => {
  const partner = payoutPartners[index]

  return {
    id: `#PAY-${monthKey}-${String(89 - index).padStart(3, '0')}`,
    storeName: partner.storeName,
    owner: partner.owner,
    bank: partner.bank,
    account: partner.account,
    method: partner.method,
    netAmount: plan.netAmount,
    commission: Math.round((plan.netAmount * 0.01) / 10) * 10,
    submittedAt: submittedAt(2 + Math.floor(index / 2), 9 + (index % 7), (index * 11) % 60),
    status: plan.status,
  }
})

export const payoutRequests: PayoutRecord[] = [...basePayouts, ...extraPayouts].sort(
  (first, second) =>
    new Date(second.submittedAt).getTime() - new Date(first.submittedAt).getTime(),
)

export const auditEntries: AuditEntry[] = [
  {
    title: 'Settlement Berhasil',
    description: 'Jalur BI-FAST • #PAY-092 diproses Bank Mandiri senilai Rp 980.000',
    time: 'Hari ini, 09:12 WIB',
    tone: 'success',
    badge: 'Selesai',
  },
  {
    title: 'Kliring QRIS Harian Tuntas',
    description: 'Total batch Rp 12.450.000 masuk rekening kustodian BRI',
    time: 'Hari ini, 06:00 WIB',
    tone: 'success',
  },
  {
    title: 'Rekonsiliasi Otomatis Berhasil',
    description: 'Semua data pesanan selaras dengan catatan core banking.',
    time: 'Kemarin, 23:59 WIB',
    tone: 'success',
  },
  {
    title: 'Pencairan Ditahan Sementara',
    description: '4 pengajuan menunggu verifikasi dua faktor Super-Admin.',
    time: 'Kemarin, 21:10 WIB',
    tone: 'warning',
    badge: 'Perlu Tindakan',
  },
  {
    title: 'Perubahan Skema Komisi',
    description: 'Kriya & Kerajinan naik ke 1,5% sesuai kesepakatan mitra daerah.',
    time: '22 Nov 2026, 14:35 WIB',
    tone: 'success',
  },
  {
    title: 'Audit Akses Rekening Escrow',
    description: 'Dua Super-Admin membuka rekening kustodian untuk peninjauan.',
    time: '21 Nov 2026, 10:02 WIB',
    tone: 'success',
  },
]
