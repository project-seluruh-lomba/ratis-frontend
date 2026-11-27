export type OwnerReportPeriodKey = '7d' | '30d' | 'bulan' | 'kustom'

export type OwnerReportDay = {
  date: string
  orders: number
  completed: number
  pending: number
  processing: number
  cancelled: number
  omzet: number
  onlineOrders: number
  posOrders: number
  onlineOmzet: number
  posOmzet: number
}

export type OwnerReportProductVisual =
  | 'lapis'
  | 'pastel'
  | 'risol'
  | 'brownies'
  | 'bolu'

export type OwnerReportProduct = {
  id: string
  name: string
  category: string
  unit: string
  sold: number
  revenue: number
  visual: OwnerReportProductVisual
  tag?: string
}

export type OwnerReportSummary = {
  totalOrders: number
  completedOrders: number
  pendingOrders: number
  processingOrders: number
  cancelledOrders: number
  omzet: number
  averageOrderValue: number
  successRate: number
  onlineOrders: number
  posOrders: number
  onlineOmzet: number
  posOmzet: number
  peakDay: OwnerReportDay | null
  averageDailyOmzet: number
  products: OwnerReportProduct[]
}

const BASE_ORDERS_30 = [
  1, 2, 1, 1, 2, 1, 2, 1, 1, 2, 1, 1, 2, 1, 1, 2, 1, 1, 1, 2, 1, 1, 1, 2, 1,
  1, 1, 1, 1, 1,
]

/**
 * Hari dengan pesanan dibatalkan. Tiga hari ini masing-masing memiliki dua
 * pesanan sehingga tetap ada satu pesanan selesai yang menyumbang omzet.
 */
const BASE_CANCELLED_30 = new Set([1, 9, 19])

/** Hari dengan satu pesanan yang tercatat sebagai transaksi kasir POS. */
const BASE_SINGLE_POS_30 = new Set([3, 25])

/** Omzet harian dalam ribuan rupiah; total 30 hari = Rp 12.450.000. */
const BASE_OMZET_30_THOUSANDS = [
  330, 304, 368, 416, 312, 328, 488, 232, 280, 320, 360, 384, 408, 352, 312,
  376, 424, 496, 304, 336, 368, 432, 576, 1480, 512, 416, 384, 344, 320, 488,
]

const BASE_30_OMZET = 12_450_000

const PRODUCT_SEEDS: {
  id: string
  name: string
  category: string
  unit: string
  sold: number
  visual: OwnerReportProductVisual
  share: number
  tag?: string
}[] = [
  {
    id: 'lapis-legit-prune',
    name: 'Lapis Legit Prune Wisman',
    category: 'Kue Basah',
    unit: 'Loyang',
    sold: 46,
    visual: 'lapis',
    share: 0.3,
    tag: 'Juara 1',
  },
  {
    id: 'pastel-tutup-jumbo',
    name: 'Pastel Tutup Panggang Jumbo',
    category: 'Pastry & Roti',
    unit: 'Porsi',
    sold: 32,
    visual: 'pastel',
    share: 0.21,
  },
  {
    id: 'risol-rogout-crispy',
    name: 'Risol Rogout Ayam Crispy',
    category: 'Kue Basah',
    unit: 'Box',
    sold: 28,
    visual: 'risol',
    share: 0.16,
  },
  {
    id: 'brownies-fudgy-sea-salt',
    name: 'Brownies Fudgy Almond Sea Salt',
    category: 'Kue Kering',
    unit: 'Box',
    sold: 18,
    visual: 'brownies',
    share: 0.13,
  },
  {
    id: 'bolu-gulung-keju',
    name: 'Bolu Gulung Keju Spesial',
    category: 'Kue Basah',
    unit: 'Roll',
    sold: 8,
    visual: 'bolu',
    share: 0.08,
  },
]

function toLocalIsoDate(date: Date) {
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function parseReportDate(value: string) {
  const [year, month, day] = value.split('-').map(Number)
  return new Date(year, month - 1, day)
}

export function shiftIsoDate(value: string, days: number) {
  const date = parseReportDate(value)
  date.setDate(date.getDate() + days)
  return toLocalIsoDate(date)
}

export const reportTodayIso = toLocalIsoDate(new Date())

export const reportMinIso = shiftIsoDate(reportTodayIso, -89)

const shortDateFormatter = new Intl.DateTimeFormat('id-ID', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
})

const mediumDateFormatter = new Intl.DateTimeFormat('id-ID', {
  weekday: 'long',
  day: 'numeric',
  month: 'short',
  year: 'numeric',
})

const dayMonthFormatter = new Intl.DateTimeFormat('id-ID', {
  day: '2-digit',
  month: 'short',
})

const monthYearFormatter = new Intl.DateTimeFormat('id-ID', {
  month: 'long',
  year: 'numeric',
})

export function formatReportDate(value: string) {
  return shortDateFormatter.format(parseReportDate(value))
}

export function formatReportDateMedium(value: string) {
  return mediumDateFormatter.format(parseReportDate(value))
}

export function formatReportDateShort(value: string) {
  return dayMonthFormatter.format(parseReportDate(value))
}

export function formatReportMonth(value: string) {
  return monthYearFormatter.format(parseReportDate(value))
}

export function formatReportRange(start: string, end: string) {
  return `${formatReportDateShort(start)} - ${formatReportDate(end)}`
}

function buildReportDays(totalDays: number): OwnerReportDay[] {
  const days: OwnerReportDay[] = []
  const firstDate = parseReportDate(reportTodayIso)
  firstDate.setDate(firstDate.getDate() - (totalDays - 1))

  for (let index = 0; index < totalDays; index += 1) {
    const daysFromEnd = totalDays - 1 - index
    const cycle = Math.floor(daysFromEnd / 30)
    const patternIndex = 29 - (daysFromEnd % 30)
    const factor = cycle === 0 ? 1 : cycle === 1 ? 0.88 : 0.76

    const baseOrders = BASE_ORDERS_30[patternIndex]
    const orders = Math.max(1, Math.round(baseOrders * factor))
    const cancelled = BASE_CANCELLED_30.has(patternIndex) && orders > 1 ? 1 : 0
    const completed = Math.max(0, orders - cancelled)

    const omzet =
      completed === 0
        ? 0
        : Math.round(BASE_OMZET_30_THOUSANDS[patternIndex] * 1000 * factor)

    const posOrders =
      orders > 1
        ? 1
        : BASE_SINGLE_POS_30.has(patternIndex)
          ? 1
          : 0
    const onlineOrders = orders - posOrders
    const onlineOmzet = Math.round(omzet * 0.871)

    const date = new Date(firstDate)
    date.setDate(firstDate.getDate() + index)

    days.push({
      date: toLocalIsoDate(date),
      orders,
      completed,
      pending: 0,
      processing: 0,
      cancelled,
      omzet,
      onlineOrders,
      posOrders,
      onlineOmzet,
      posOmzet: omzet - onlineOmzet,
    })
  }

  return days
}

export const ownerReportDays = buildReportDays(90)

export function getReportRange(
  period: OwnerReportPeriodKey,
  customStart: string,
  customEnd: string,
): { start: string; end: string } {
  if (period === '7d') {
    return { start: shiftIsoDate(reportTodayIso, -6), end: reportTodayIso }
  }

  if (period === '30d') {
    return { start: shiftIsoDate(reportTodayIso, -29), end: reportTodayIso }
  }

  if (period === 'bulan') {
    const today = parseReportDate(reportTodayIso)
    return {
      start: toLocalIsoDate(new Date(today.getFullYear(), today.getMonth(), 1)),
      end: reportTodayIso,
    }
  }

  const end = customEnd > reportTodayIso ? reportTodayIso : customEnd
  const earliestStart = shiftIsoDate(end, -89)
  let start = customStart

  if (start < reportMinIso) start = reportMinIso
  if (start < earliestStart) start = earliestStart
  if (start > end) start = end

  return { start, end }
}

export function filterReportDays(start: string, end: string) {
  return ownerReportDays.filter((day) => day.date >= start && day.date <= end)
}

export function isReportRangeTooWide(start: string, end: string) {
  const diff = parseReportDate(end).getTime() - parseReportDate(start).getTime()
  return Math.round(diff / 86_400_000) + 1 > 90
}

export function getPreviousReportDays(start: string, end: string) {
  const startIndex = ownerReportDays.findIndex((day) => day.date >= start)
  const endIndex = ownerReportDays.findIndex((day) => day.date === end)
  if (startIndex < 0 || endIndex < 0 || endIndex < startIndex) return []

  const length = endIndex - startIndex + 1
  return ownerReportDays.slice(Math.max(0, startIndex - length), startIndex)
}

function buildReportProducts(omzet: number): OwnerReportProduct[] {
  const scale = omzet / BASE_30_OMZET

  return PRODUCT_SEEDS.map((product) => ({
    id: product.id,
    name: product.name,
    category: product.category,
    unit: product.unit,
    visual: product.visual,
    tag: product.tag,
    sold:
      omzet === 0
        ? 0
        : Math.max(product.sold > 0 ? 1 : 0, Math.round(product.sold * scale)),
    revenue: Math.round(omzet * product.share),
  }))
}

export function summarizeOwnerReport(days: OwnerReportDay[]): OwnerReportSummary {
  const totals = days.reduce(
    (accumulator, day) => ({
      totalOrders: accumulator.totalOrders + day.orders,
      completedOrders: accumulator.completedOrders + day.completed,
      pendingOrders: accumulator.pendingOrders + day.pending,
      processingOrders: accumulator.processingOrders + day.processing,
      cancelledOrders: accumulator.cancelledOrders + day.cancelled,
      omzet: accumulator.omzet + day.omzet,
      onlineOrders: accumulator.onlineOrders + day.onlineOrders,
      posOrders: accumulator.posOrders + day.posOrders,
      onlineOmzet: accumulator.onlineOmzet + day.onlineOmzet,
      posOmzet: accumulator.posOmzet + day.posOmzet,
    }),
    {
      totalOrders: 0,
      completedOrders: 0,
      pendingOrders: 0,
      processingOrders: 0,
      cancelledOrders: 0,
      omzet: 0,
      onlineOrders: 0,
      posOrders: 0,
      onlineOmzet: 0,
      posOmzet: 0,
    },
  )

  const peakDay = days.reduce<OwnerReportDay | null>(
    (peak, day) => (peak === null || day.omzet > peak.omzet ? day : peak),
    null,
  )

  return {
    ...totals,
    averageOrderValue:
      totals.completedOrders > 0
        ? Math.round(totals.omzet / totals.completedOrders)
        : 0,
    successRate:
      totals.totalOrders > 0
        ? (totals.completedOrders / totals.totalOrders) * 100
        : 0,
    peakDay: peakDay && peakDay.omzet > 0 ? peakDay : null,
    averageDailyOmzet:
      days.length > 0 ? Math.round(totals.omzet / days.length) : 0,
    products: buildReportProducts(totals.omzet),
  }
}

export function getReportDelta(current: number, previous: number) {
  if (previous <= 0) return null
  return ((current - previous) / previous) * 100
}

export function escapeReportCsv(value: string | number) {
  const text = String(value)
  if (text.includes(';') || text.includes('"') || text.includes('\n')) {
    return `"${text.replaceAll('"', '""')}"`
  }
  return text
}
