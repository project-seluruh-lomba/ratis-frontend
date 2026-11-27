import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  CalendarCheck2,
  CalendarDays,
  Cake,
  CakeSlice,
  CheckCircle2,
  ChevronDown,
  Cookie,
  Download,
  Info,
  Package,
  ReceiptText,
  ShoppingBag,
  SlidersHorizontal,
  Soup,
  Store,
  Wallet,
  X,
  type LucideIcon,
} from 'lucide-react'
import OwnerReportChart from '../../components/owner/OwnerReportChart'
import OwnerReportExportModal from '../../components/owner/OwnerReportExportModal'
import { getOwnerSession } from '../../lib/owner-auth'
import {
  filterReportDays,
  formatReportDateMedium,
  formatReportMonth,
  formatReportRange,
  getPreviousReportDays,
  getReportDelta,
  getReportRange,
  isReportRangeTooWide,
  reportMinIso,
  reportTodayIso,
  shiftIsoDate,
  summarizeOwnerReport,
  type OwnerReportPeriodKey,
  type OwnerReportProductVisual,
} from '../../lib/owner-report-data'

const numberFormatter = new Intl.NumberFormat('id-ID')
const percentFormatter = new Intl.NumberFormat('id-ID', {
  maximumFractionDigits: 1,
})

const periodOptions: { key: OwnerReportPeriodKey; label: string }[] = [
  { key: '7d', label: '7 Hari Terakhir' },
  { key: '30d', label: '30 Hari Terakhir' },
  { key: 'bulan', label: `Bulan Ini (${formatReportMonth(reportTodayIso)})` },
  { key: 'kustom', label: 'Rentang Kustom (Maks. 90 Hari)' },
]

const productVisuals: Record<
  OwnerReportProductVisual,
  { icon: LucideIcon; className: string }
> = {
  lapis: {
    icon: Cake,
    className: 'from-[#fde7c7] to-[#f3c483] text-[#9a5b16]',
  },
  pastel: {
    icon: Cookie,
    className: 'from-[#f7ead2] to-[#e8cfa4] text-[#8a6a2f]',
  },
  risol: {
    icon: Soup,
    className: 'from-[#fbe0c0] to-[#f0b97f] text-[#925313]',
  },
  brownies: {
    icon: Package,
    className: 'from-[#e8d8c6] to-[#c8a98b] text-[#5f4226]',
  },
  bolu: {
    icon: CakeSlice,
    className: 'from-[#f3e7d7] to-[#dfc4a6] text-[#83603a]',
  },
}

const statusRows = [
  {
    id: 'selesai',
    label: 'Pesanan Selesai',
    description: 'Lunas, diambil/terkirim sesuai SOP',
    barClassName: 'bg-[#0f766e]',
    dotClassName: 'bg-[#0f766e]',
  },
  {
    id: 'pending',
    label: 'Menunggu Konfirmasi',
    description: 'Belum dikonfirmasi pemilik',
    barClassName: 'bg-[#f59e0b]',
    dotClassName: 'bg-[#f59e0b]',
  },
  {
    id: 'processing',
    label: 'Sedang Diproses',
    description: 'Sedang disiapkan dapur',
    barClassName: 'bg-[#2563eb]',
    dotClassName: 'bg-[#2563eb]',
  },
  {
    id: 'cancelled',
    label: 'Dibatalkan / Void',
    description: 'Stok habis, batal, atau refund',
    barClassName: 'bg-[#ef4444]',
    dotClassName: 'bg-[#ef4444]',
  },
] as const

function formatRupiah(value: number) {
  return `Rp ${numberFormatter.format(value)}`
}

function formatPercent(value: number) {
  return `${percentFormatter.format(value)}%`
}

function TrendBadge({ value }: { value: number | null }) {
  if (value === null) {
    return (
      <span className="inline-flex items-center rounded-full bg-slate-100 px-1.5 py-0.5 text-[9px] font-bold text-slate-500">
        Baru
      </span>
    )
  }

  const positive = value >= 0
  return (
    <span
      className={`inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[9px] font-bold ${
        positive
          ? 'bg-[#dcfce7] text-[#15803d]'
          : 'bg-[#fee2e2] text-[#b91c1c]'
      }`}
    >
      {positive ? (
        <ArrowUpRight className="size-2.5" />
      ) : (
        <ArrowDownRight className="size-2.5" />
      )}
      {formatPercent(Math.abs(value))}
    </span>
  )
}

export default function OwnerReportPage() {
  const [session] = useState(getOwnerSession)
  const storeName = session?.storeName ?? 'Toko Anda'

  const [period, setPeriod] = useState<OwnerReportPeriodKey>('30d')
  const [customStart, setCustomStart] = useState(shiftIsoDate(reportTodayIso, -29))
  const [customEnd, setCustomEnd] = useState(reportTodayIso)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [exportOpen, setExportOpen] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  const range = useMemo(
    () => getReportRange(period, customStart, customEnd),
    [period, customStart, customEnd],
  )

  const days = useMemo(
    () => filterReportDays(range.start, range.end),
    [range.start, range.end],
  )
  const previousDays = useMemo(
    () => getPreviousReportDays(range.start, range.end),
    [range.start, range.end],
  )
  const summary = useMemo(() => summarizeOwnerReport(days), [days])
  const previous = useMemo(
    () => summarizeOwnerReport(previousDays),
    [previousDays],
  )

  const orderDelta = getReportDelta(summary.totalOrders, previous.totalOrders)
  const omzetDelta = getReportDelta(summary.omzet, previous.omzet)
  const averageDelta = getReportDelta(
    summary.averageOrderValue,
    previous.averageOrderValue,
  )

  const customTooWide =
    period === 'kustom' && isReportRangeTooWide(customStart, customEnd)
  const showDateFields = filtersOpen || period === 'kustom'

  const onlineShare =
    summary.omzet > 0 ? (summary.onlineOmzet / summary.omzet) * 100 : 0
  const posShare =
    summary.omzet > 0 ? (summary.posOmzet / summary.omzet) * 100 : 0

  const statusValues: Record<(typeof statusRows)[number]['id'], number> = {
    selesai: summary.completedOrders,
    pending: summary.pendingOrders,
    processing: summary.processingOrders,
    cancelled: summary.cancelledOrders,
  }

  const activePeriodLabel =
    period === '7d'
      ? '7 Hari'
      : period === '30d'
        ? '30 Hari'
        : period === 'bulan'
          ? 'Bulan Ini'
          : 'Kustom'

  function showToast(message: string) {
    setToast(message)
    window.setTimeout(() => setToast(null), 4200)
  }

  function handleCustomStart(value: string) {
    setCustomStart(value)
    setPeriod('kustom')
  }

  function handleCustomEnd(value: string) {
    setCustomEnd(value)
    setPeriod('kustom')
  }

  return (
    <div>
      {toast && (
        <div className="fixed right-4 top-20 z-[80] flex max-w-[calc(100vw-2rem)] items-start gap-2.5 rounded-xl border border-line bg-white px-3.5 py-3 shadow-[0_12px_40px_rgba(15,23,42,0.16)]">
          <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" />
          <p className="text-[11px] font-medium leading-relaxed text-slate-700">
            {toast}
          </p>
          <button
            type="button"
            onClick={() => setToast(null)}
            aria-label="Tutup notifikasi"
            className="ml-1 flex size-5 shrink-0 items-center justify-center rounded text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="size-3.5" />
          </button>
        </div>
      )}

      {exportOpen && (
        <OwnerReportExportModal
          storeName={storeName}
          initialStart={range.start}
          initialEnd={range.end}
          onClose={() => setExportOpen(false)}
          onExported={(rowCount) => {
            setExportOpen(false)
            showToast(
              rowCount > 0
                ? `Laporan CSV berhasil diunduh (${numberFormatter.format(
                    rowCount,
                  )} baris data).`
                : 'File CSV kosong berhasil diunduh dengan baris header saja.',
            )
          }}
        />
      )}

      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="max-w-[700px]">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-soft/70 px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.14em] text-primary">
              <span className="size-1.5 rounded-full bg-primary" />
              Audit Pembukuan
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/25 px-2.5 py-1 text-[9px] font-semibold text-primary">
              <span className="size-1.5 rounded-full bg-emerald-500" />
              Terverifikasi Kas Riil
            </span>
          </div>

          <h1 className="mt-2.5 text-[27px] font-extrabold tracking-tight text-ink sm:text-[30px]">
            Laporan Penjualan &amp; Ekspor
          </h1>
          <p className="mt-1.5 max-w-[640px] text-[12.5px] leading-relaxed text-slate-500">
            Analisis performa penjualan riil, tren pesanan selesai, dan unduh data
            transaksi CSV untuk pembukuan {storeName}.
          </p>
        </div>

        <div className="flex w-full flex-wrap gap-2 xl:w-auto xl:justify-end">
          <button
            type="button"
            onClick={() => {
              setFiltersOpen((current) => !current)
              setPeriod('kustom')
            }}
            className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-xl border border-line bg-white px-3.5 text-[11.5px] font-semibold text-slate-700 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition hover:bg-slate-50 sm:flex-none"
          >
            <SlidersHorizontal className="size-4 text-slate-500" />
            Kustomisasi Filter
          </button>
          <button
            type="button"
            onClick={() => setExportOpen(true)}
            className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-[11.5px] font-semibold text-white shadow-sm transition hover:bg-primary-hover sm:flex-none"
          >
            <Download className="size-4" />
            Ekspor CSV
            <span className="rounded bg-white/15 px-1.5 py-0.5 text-[9px] font-bold">
              {activePeriodLabel}
            </span>
          </button>
        </div>
      </div>

      <section className="mt-4 rounded-2xl border border-line bg-white p-3.5 shadow-[0_1px_2px_rgba(15,23,42,0.06)]">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-wrap gap-1.5">
            {periodOptions.map((option) => {
              const active = period === option.key
              return (
                <button
                  key={option.key}
                  type="button"
                  onClick={() => {
                    setPeriod(option.key)
                    if (option.key === 'kustom') setFiltersOpen(true)
                  }}
                  aria-pressed={active}
                  className={`rounded-xl border px-3 py-2 text-[10.5px] font-semibold transition ${
                    active
                      ? 'border-transparent bg-[#0b3b3a] text-white shadow-sm'
                      : 'border-line bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {option.label}
                </button>
              )
            })}
          </div>

          <button
            type="button"
            onClick={() => {
              setPeriod('kustom')
              setFiltersOpen(true)
            }}
            className="inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-xl bg-[#eef2ff] px-3 text-[10.5px] font-semibold text-[#3b5bdb] transition hover:bg-[#e3e9ff]"
          >
            <CalendarDays className="size-3.5" />
            {formatReportRange(range.start, range.end)}
            <ChevronDown className="size-3.5" />
          </button>
        </div>

        {showDateFields && (
          <div className="mt-3 flex flex-col gap-3 rounded-xl border border-line bg-[#fafbfe] p-3 sm:flex-row sm:items-end">
            <label className="block sm:w-44">
              <span className="text-[10px] font-semibold text-slate-600">
                Tanggal mulai
              </span>
              <input
                type="date"
                value={customStart}
                min={reportMinIso}
                max={customEnd || reportTodayIso}
                onChange={(event) => handleCustomStart(event.target.value)}
                className="mt-1.5 h-9 w-full rounded-xl border border-line bg-white px-3 text-[11px] text-ink outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
              />
            </label>
            <label className="block sm:w-44">
              <span className="text-[10px] font-semibold text-slate-600">
                Tanggal akhir
              </span>
              <input
                type="date"
                value={customEnd}
                min={customStart}
                max={reportTodayIso}
                onChange={(event) => handleCustomEnd(event.target.value)}
                className="mt-1.5 h-9 w-full rounded-xl border border-line bg-white px-3 text-[11px] text-ink outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
              />
            </label>
            <p
              className={`pb-2 text-[10px] leading-relaxed sm:ml-1 ${
                customTooWide ? 'font-semibold text-amber-700' : 'text-slate-500'
              }`}
            >
              {customTooWide
                ? 'Rentang maksimal 90 hari. Tanggal mulai dipersempit otomatis.'
                : `${days.length} hari dalam rentang terpilih.`}
            </p>
          </div>
        )}

        <div className="mt-3 flex items-start gap-2.5 rounded-xl bg-[#f8fafc] px-3 py-2.5">
          <Info className="mt-0.5 size-3.5 shrink-0 text-slate-400" />
          <p className="text-[10px] leading-relaxed text-slate-500">
            Omzet &amp; penjualan hanya menghitung pesanan berstatus{' '}
            <span className="font-semibold text-slate-700">Selesai</span> sesuai SOP
            akuntansi kas Ratis. Pesanan batal atau refund tidak dihitung sebagai
            pemasukan.
          </p>
        </div>
      </section>

      <div className="mt-4 grid gap-3.5 sm:grid-cols-2 xl:grid-cols-4">
        <section className="flex flex-col rounded-2xl border border-line bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.06)]">
          <div className="flex items-start justify-between gap-2">
            <p className="text-[10.5px] font-semibold leading-snug text-slate-500">
              Total Pesanan Masuk
            </p>
            <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#dff7ee] text-primary">
              <ShoppingBag className="size-4" />
            </span>
          </div>
          <div className="mt-2.5 flex flex-wrap items-baseline gap-2">
            <p className="text-[26px] font-extrabold leading-none tracking-tight text-ink">
              {numberFormatter.format(summary.totalOrders)}
            </p>
            <span className="text-[10.5px] font-medium text-slate-500">Pesanan</span>
            <span className="ml-auto">
              <TrendBadge value={orderDelta} />
            </span>
          </div>
          <p className="mt-auto border-t border-[#eef2f6] pt-3 text-[9.5px] leading-relaxed text-slate-500">
            Kombinasi {summary.onlineOrders} pesanan online &amp;{' '}
            {summary.posOrders} pesanan kasir POS.
          </p>
        </section>

        <section className="flex flex-col rounded-2xl border border-line bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.06)]">
          <div className="flex items-start justify-between gap-2">
            <p className="text-[10.5px] font-semibold leading-snug text-slate-500">
              Pesanan Selesai
              <span className="mt-0.5 block text-[9.5px] font-normal text-slate-400">
                (Success Rate)
              </span>
            </p>
            <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#dff7ee] text-primary">
              <CheckCircle2 className="size-4" />
            </span>
          </div>
          <div className="mt-2.5 flex flex-wrap items-baseline gap-2">
            <p className="text-[26px] font-extrabold leading-none tracking-tight text-ink">
              {numberFormatter.format(summary.completedOrders)}
            </p>
            <span className="text-[10.5px] font-medium text-slate-500">Selesai</span>
            <span className="ml-auto rounded-full bg-[#dcfce7] px-2 py-0.5 text-[9px] font-bold text-[#15803d]">
              {formatPercent(summary.successRate)}
              <span className="block text-[8px] font-semibold">Selesai Sempurna</span>
            </span>
          </div>
          <p className="mt-auto flex items-center gap-1.5 border-t border-[#eef2f6] pt-3 text-[9.5px] text-slate-500">
            {summary.cancelledOrders > 0 ? (
              <>
                <span className="size-1.5 rounded-full bg-[#ef4444]" />
                {summary.cancelledOrders} pesanan dibatalkan/diretur
              </>
            ) : (
              <>
                <span className="size-1.5 rounded-full bg-emerald-500" />
                Tidak ada pesanan batal pada periode ini
              </>
            )}
          </p>
        </section>

        <section className="flex flex-col rounded-2xl border border-line bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.06)]">
          <div className="flex items-start justify-between gap-2">
            <p className="text-[10.5px] font-semibold leading-snug text-slate-500">
              Total Omzet Penjualan
              <span className="mt-0.5 block text-[9.5px] font-normal text-slate-400">
                (Omzet bersih)
              </span>
            </p>
            <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#dff7ee] text-primary">
              <Wallet className="size-4" />
            </span>
          </div>
          <div className="mt-2.5 flex flex-wrap items-baseline gap-2">
            <p className="text-[26px] font-extrabold leading-none tracking-tight text-ink">
              {formatRupiah(summary.omzet)}
            </p>
            <span className="ml-auto">
              <TrendBadge value={omzetDelta} />
            </span>
          </div>
          <p className="mt-auto border-t border-[#eef2f6] pt-3 text-[9.5px] leading-relaxed text-slate-500">
            Pemasukan riil dari{' '}
            <span className="font-semibold text-slate-600">
              {summary.completedOrders} pesanan selesai
            </span>
            .
          </p>
        </section>

        <section className="flex flex-col rounded-2xl border border-line bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.06)]">
          <div className="flex items-start justify-between gap-2">
            <p className="text-[10.5px] font-semibold leading-snug text-slate-500">
              Rata-rata Nilai Pesanan
              <span className="mt-0.5 block text-[9.5px] font-normal text-slate-400">
                (Average Order Value)
              </span>
            </p>
            <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#dff7ee] text-primary">
              <ReceiptText className="size-4" />
            </span>
          </div>
          <div className="mt-2.5 flex flex-wrap items-baseline gap-1.5">
            <p className="text-[26px] font-extrabold leading-none tracking-tight text-ink">
              {formatRupiah(summary.averageOrderValue)}
            </p>
            <span className="text-[10.5px] font-medium text-slate-500">/order</span>
            <span className="ml-auto">
              <TrendBadge value={averageDelta} />
            </span>
          </div>
          <p className="mt-auto border-t border-[#eef2f6] pt-3 text-[9.5px] leading-relaxed text-slate-500">
            Rata-rata belanja keranjang pelanggan untuk pesanan selesai.
          </p>
        </section>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0 space-y-4">
          <section className="rounded-2xl border border-line bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.06)] sm:p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-[17px] font-bold tracking-tight text-ink">
                  Tren Penjualan Harian &amp; Nilai Omzet
                </h2>
                <p className="mt-1 max-w-sm text-[11px] leading-relaxed text-slate-500">
                  Grafik dinamika omzet harian (Rp) berbanding volume pesanan
                  sukses.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center gap-1.5 text-[9.5px] font-medium text-slate-500">
                  <span className="size-2 rounded-full bg-primary" />
                  Omzet Bersih (Rp)
                </span>
                <span className="inline-flex items-center gap-1.5 text-[9.5px] font-medium text-slate-500">
                  <span className="h-0 w-4 border-t-2 border-dashed border-slate-400" />
                  Volume Pesanan
                </span>
                <span className="rounded-lg bg-[#eef2ff] px-2.5 py-1.5 text-center text-[9px] font-bold leading-tight text-[#3b5bdb]">
                  {formatReportMonth(range.end)}
                </span>
              </div>
            </div>

            <div className="mt-3">
              <OwnerReportChart data={days} />
            </div>

            <div className="mt-3 flex flex-col gap-3 rounded-xl bg-[#f8fafc] p-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2.5">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary-soft/70 text-primary">
                  <CalendarCheck2 className="size-4" />
                </span>
                <div>
                  <p className="text-[9px] font-semibold uppercase tracking-[0.08em] text-slate-400">
                    Hari Tertinggi Periode Ini
                  </p>
                  <p className="mt-0.5 text-[12px] font-bold text-ink">
                    {summary.peakDay
                      ? formatReportDateMedium(summary.peakDay.date)
                      : 'Belum ada omzet'}
                    {summary.peakDay && (
                      <span className="ml-2 rounded bg-white px-1.5 py-0.5 text-[8.5px] font-semibold text-primary">
                        {summary.peakDay.orders} pesanan
                      </span>
                    )}
                  </p>
                  <p className="mt-0.5 text-[9.5px] text-slate-500">
                    Puncak penjualan periode ini.
                  </p>
                </div>
              </div>
              <div className="sm:text-right">
                <p className="text-[9px] font-semibold uppercase tracking-[0.08em] text-slate-400">
                  Rata-rata Omzet Bersih
                </p>
                <p className="mt-0.5 text-[14px] font-extrabold text-ink">
                  {formatRupiah(summary.averageDailyOmzet)}
                  <span className="ml-1 text-[9px] font-medium text-slate-400">
                    /hari
                  </span>
                </p>
              </div>
            </div>
          </section>

          <section className="overflow-hidden rounded-2xl border border-line bg-white shadow-[0_1px_2px_rgba(15,23,42,0.06)]">
            <div className="flex flex-col gap-3 px-4 pt-4 sm:flex-row sm:items-start sm:justify-between sm:px-5">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-[17px] font-bold tracking-tight text-ink">
                    Daftar 5 Produk Terlaris
                  </h2>
                  <span className="rounded-full bg-primary-soft/70 px-2 py-0.5 text-[8.5px] font-bold uppercase tracking-wide text-primary">
                    Top Performers
                  </span>
                </div>
                <p className="mt-1 text-[11px] leading-relaxed text-slate-500">
                  Produk penyumbang kontribusi omzet terbesar selama periode{' '}
                  {formatReportMonth(range.end)}.
                </p>
              </div>
              <Link
                to="/owner/produk"
                className="inline-flex shrink-0 items-center gap-1.5 self-start text-[10.5px] font-semibold text-slate-600 transition hover:text-primary"
              >
                Lihat Semua Produk
                <ArrowRight className="size-3.5" />
              </Link>
            </div>

            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[600px] text-left">
                <thead>
                  <tr className="bg-[#f8fafc] text-[8.5px] font-bold uppercase tracking-[0.1em] text-slate-400">
                    <th className="w-14 px-4 py-2.5 text-center sm:px-5">Rank</th>
                    <th className="px-3 py-2.5">Foto &amp; Nama Produk</th>
                    <th className="px-3 py-2.5">Kategori</th>
                    <th className="px-4 py-2.5 text-right sm:px-5">Terjual</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {summary.products.map((product, index) => {
                    const visual = productVisuals[product.visual]
                    const Icon = visual.icon
                    return (
                      <tr
                        key={product.id}
                        className="transition hover:bg-slate-50/70"
                      >
                        <td className="px-4 py-3.5 text-center sm:px-5">
                          <span
                            className={`inline-flex size-6 items-center justify-center rounded-full text-[10px] font-bold ${
                              index === 0
                                ? 'bg-primary text-white'
                                : 'text-slate-400'
                            }`}
                          >
                            {index + 1}
                          </span>
                        </td>
                        <td className="px-3 py-3.5">
                          <div className="flex items-center gap-3">
                            <span
                              className={`flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${visual.className}`}
                            >
                              <Icon className="size-[18px]" />
                            </span>
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-1.5">
                                <p className="truncate text-[12px] font-semibold text-ink">
                                  {product.name}
                                </p>
                                {product.tag && (
                                  <span className="rounded bg-primary-soft/70 px-1.5 py-0.5 text-[7.5px] font-bold text-primary">
                                    {product.tag}
                                  </span>
                                )}
                              </div>
                              <p className="mt-0.5 text-[9.5px] text-slate-400">
                                Kontribusi {formatRupiah(product.revenue)}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-3 py-3.5">
                          <span className="inline-flex rounded-md bg-[#f1f5f9] px-2 py-1 text-[9px] font-medium text-slate-600">
                            {product.category}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3.5 text-right sm:px-5">
                          <p className="text-[13px] font-bold text-ink">
                            {numberFormatter.format(product.sold)}
                          </p>
                          <p className="text-[9px] text-slate-400">{product.unit}</p>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {summary.products.length === 0 && (
              <div className="px-4 py-12 text-center">
                <Package className="mx-auto size-6 text-slate-300" />
                <p className="mt-2 text-[12px] font-bold text-ink">
                  Belum ada produk terjual
                </p>
                <p className="mt-1 text-[10px] text-slate-500">
                  Produk terlaris akan muncul setelah ada pesanan selesai.
                </p>
              </div>
            )}
          </section>
        </div>

        <aside className="min-w-0 space-y-4">
          <section className="rounded-2xl border border-line bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.06)]">
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-[13px] font-bold text-ink">
                Komposisi Status Pesanan
              </h2>
              <p className="shrink-0 text-right text-[9px] leading-tight text-slate-400">
                Total {summary.totalOrders}
                <span className="block font-semibold text-slate-500">Transaksi</span>
              </p>
            </div>

            <div className="mt-3 flex h-2.5 overflow-hidden rounded-full bg-[#eef2f6]">
              {statusRows.map((row) => {
                const value = statusValues[row.id]
                const percent =
                  summary.totalOrders > 0
                    ? (value / summary.totalOrders) * 100
                    : 0
                if (percent <= 0) return null
                return (
                  <span
                    key={row.id}
                    className={row.barClassName}
                    style={{ width: `${percent}%` }}
                    title={`${row.label}: ${formatPercent(percent)}`}
                  />
                )
              })}
            </div>

            <ul className="mt-3 space-y-1.5">
              {statusRows.map((row) => {
                const value = statusValues[row.id]
                const percent =
                  summary.totalOrders > 0
                    ? (value / summary.totalOrders) * 100
                    : 0
                return (
                  <li
                    key={row.id}
                    className="flex items-start justify-between gap-3 rounded-xl border border-line px-2.5 py-2"
                  >
                    <div className="flex min-w-0 items-start gap-2">
                      <span
                        className={`mt-1 size-2 shrink-0 rounded-full ${row.dotClassName}`}
                      />
                      <div className="min-w-0">
                        <p className="text-[10px] font-semibold leading-snug text-ink">
                          {row.label}
                        </p>
                        <p className="mt-0.5 text-[8.5px] leading-relaxed text-slate-400">
                          {row.description}
                        </p>
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-[13px] font-bold leading-none text-ink">
                        {numberFormatter.format(value)}
                      </p>
                      <p className="mt-1 text-[8.5px] font-medium text-slate-400">
                        {formatPercent(percent)}
                      </p>
                    </div>
                  </li>
                )
              })}
            </ul>

            <div className="mt-2.5 flex items-start gap-2 rounded-xl bg-[#eef2ff]/70 px-2.5 py-2.5">
              <Info className="mt-0.5 size-3.5 shrink-0 text-[#3b5bdb]" />
              <p className="text-[9px] leading-relaxed text-slate-600">
                Tingkat keberhasilan pesanan {storeName} sebesar{' '}
                <span className="font-bold text-ink">
                  {formatPercent(summary.successRate)}
                </span>{' '}
                {summary.successRate >= 88
                  ? 'berada di atas rata-rata UMKM Kuliner (88%).'
                  : 'masih di bawah rata-rata UMKM Kuliner (88%).'}
              </p>
            </div>
          </section>

          <section className="rounded-2xl border border-line bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.06)]">
            <div>
              <h2 className="text-[13px] font-bold text-ink">Saluran Penjualan</h2>
              <p className="mt-0.5 text-[9.5px] leading-relaxed text-slate-500">
                Distribusi transaksi fisik vs kanal daring.
              </p>
            </div>

            <div className="mt-3 space-y-3.5">
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-[#f1f5f9] text-slate-500">
                      <ShoppingBag className="size-3.5" />
                    </span>
                    <p className="text-[10px] font-semibold leading-snug text-ink">
                      Storefront Online Toko
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-[9px] text-slate-400">Rp</p>
                    <p className="text-[11px] font-bold leading-none text-ink">
                      {numberFormatter.format(summary.onlineOmzet)}
                    </p>
                  </div>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#eef2f6]">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${onlineShare}%` }}
                  />
                </div>
                <p className="mt-1.5 flex items-center justify-between gap-2 text-[8.5px] text-slate-500">
                  <span>
                    {summary.onlineOrders} Pesanan Masuk (Web {storeName})
                  </span>
                  <span className="font-semibold text-slate-600">
                    {formatPercent(onlineShare)}
                  </span>
                </p>
              </div>

              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-[#f1f5f9] text-slate-500">
                      <Store className="size-3.5" />
                    </span>
                    <p className="text-[10px] font-semibold leading-snug text-ink">
                      Kasir POS / Outlet Langsung
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-[9px] text-slate-400">Rp</p>
                    <p className="text-[11px] font-bold leading-none text-ink">
                      {numberFormatter.format(summary.posOmzet)}
                    </p>
                  </div>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#eef2f6]">
                  <div
                    className="h-full rounded-full bg-[#5fbfae]"
                    style={{ width: `${posShare}%` }}
                  />
                </div>
                <p className="mt-1.5 flex items-center justify-between gap-2 text-[8.5px] text-slate-500">
                  <span>{summary.posOrders} Transaksi Walk-In / Kasir Cepat</span>
                  <span className="font-semibold text-slate-600">
                    {formatPercent(posShare)}
                  </span>
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-[#dbe3f4] bg-[#eef2ff] p-4">
            <span className="flex size-9 items-center justify-center rounded-xl bg-white text-[#3b5bdb] shadow-sm">
              <ReceiptText className="size-4" />
            </span>
            <h2 className="mt-3 text-[13px] font-bold text-ink">
              Siap Kirim ke Akuntan?
            </h2>
            <p className="mt-1 text-[9.5px] leading-relaxed text-slate-600">
              Unduh data penjualan periode ini untuk pelaporan pajak UMKM atau
              integrasi pembukuan offline. Format CSV kompatibel Excel &amp; Sheets.
            </p>
            <button
              type="button"
              onClick={() => setExportOpen(true)}
              className="mt-3 inline-flex h-9 w-full items-center justify-center gap-2 rounded-xl bg-primary px-3 text-[10.5px] font-semibold text-white transition hover:bg-primary-hover"
            >
              <Download className="size-3.5" />
              Buka Dialog Ekspor CSV
            </button>
          </section>
        </aside>
      </div>
    </div>
  )
}
