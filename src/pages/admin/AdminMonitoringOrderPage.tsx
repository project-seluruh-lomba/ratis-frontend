import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  Activity,
  ArrowRight,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  FileText,
  Info,
  Lock,
  MapPin,
  RefreshCw,
  Search,
  ShieldCheck,
  ShoppingBag,
  Store,
  TrendingUp,
  User,
  X,
} from 'lucide-react'
import {
  orderRecords,
  orderShops,
  type OrderRecord,
  type OrderStatus,
} from '../../lib/admin-order-data'

type StatusFilter = OrderStatus | 'semua'
type PeriodFilter = 'hari-ini' | '7-hari' | '30-hari'
type SortOrder = 'terbaru' | 'terlama'

const PAGE_SIZE = 10

const statusMeta: Record<OrderStatus, { label: string; badge: string; dot: string }> = {
  pending: { label: 'Pending', badge: 'bg-amber-50 text-amber-700', dot: 'bg-amber-500' },
  diproses: {
    label: 'Diproses',
    badge: 'bg-primary-soft/60 text-primary',
    dot: 'bg-primary',
  },
  selesai: { label: 'Selesai', badge: 'bg-emerald-50 text-emerald-700', dot: 'bg-emerald-500' },
  dibatalkan: { label: 'Dibatalkan', badge: 'bg-red-50 text-red-600', dot: 'bg-red-500' },
}

const statusTabs: { value: StatusFilter; label: string }[] = [
  { value: 'semua', label: 'Semua' },
  { value: 'pending', label: 'Pending' },
  { value: 'diproses', label: 'Diproses' },
  { value: 'selesai', label: 'Selesai' },
  { value: 'dibatalkan', label: 'Dibatalkan' },
]

const periodOptions: { value: PeriodFilter; label: string }[] = [
  { value: 'hari-ini', label: 'Hari Ini' },
  { value: '7-hari', label: '7 Hari Terakhir' },
  { value: '30-hari', label: '30 Hari Terakhir' },
]

const rupiahFormatter = new Intl.NumberFormat('id-ID')
const dateTimeFormatter = new Intl.DateTimeFormat('id-ID', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
  timeZone: 'Asia/Jakarta',
})
const clockFormatter = new Intl.DateTimeFormat('id-ID', {
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: false,
  timeZone: 'Asia/Jakarta',
})
const timeFormatter = new Intl.DateTimeFormat('id-ID', {
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
  timeZone: 'Asia/Jakarta',
})

function formatRupiah(value: number) {
  return `Rp ${rupiahFormatter.format(value)}`
}

function formatDateTime(isoDate: string) {
  return `${dateTimeFormatter.format(new Date(isoDate))} WIB`
}

function formatTime(isoDate: string) {
  return `${timeFormatter.format(new Date(isoDate))} WIB`
}

function parseStatus(value: string | null): StatusFilter {
  if (value === 'pending' || value === 'diproses' || value === 'selesai' || value === 'dibatalkan') {
    return value
  }
  return 'semua'
}

function parsePeriod(value: string | null): PeriodFilter {
  if (value === 'hari-ini' || value === '7-hari' || value === '30-hari') return value
  return '30-hari'
}

function buildTimeline(order: OrderRecord) {
  const created = new Date(order.createdAt).getTime()
  const minutes = (amount: number) => new Date(created + amount * 60 * 1000).toISOString()

  const events: {
    title: string
    description: string
    at: string
    tone: 'primary' | 'muted'
  }[] = [
    {
      title: 'Pesanan Dibuat oleh Pelanggan',
      description: 'Checkout aplikasi mobile Ratis UMKM',
      at: order.createdAt,
      tone: 'muted',
    },
  ]

  if (order.status === 'pending') {
    events.unshift({
      title: 'Menunggu Pembayaran QRIS',
      description: 'Pesanan belum dibayar dan masih menunggu konfirmasi kliring.',
      at: minutes(2),
      tone: 'primary',
    })
  } else if (order.status === 'dibatalkan') {
    events.unshift({
      title: 'Pesanan Dibatalkan',
      description: 'Dibatalkan sebelum pesanan diproses oleh toko.',
      at: minutes(9),
      tone: 'muted',
    })
  } else {
    events.unshift({
      title: 'Pembayaran QRIS Berhasil',
      description: 'Dana masuk ke rekening penampungan kliring pedagang.',
      at: minutes(3),
      tone: 'muted',
    })
    events.unshift({
      title: 'Pesanan Sedang Disiapkan',
      description: `${order.shopName} mengonfirmasi pesanan dan memulai peracikan menu.`,
      at: minutes(5),
      tone: 'primary',
    })

    if (order.status === 'selesai') {
      events.unshift({
        title: 'Pesanan Selesai',
        description: 'Pesanan diterima pelanggan dan transaksi dinyatakan lunas.',
        at: minutes(95),
        tone: 'primary',
      })
    }
  }

  return events
}

export default function AdminMonitoringOrderPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [syncedAt, setSyncedAt] = useState(() => new Date())
  const [selectedCode, setSelectedCode] = useState<string | null>(
    () => orderRecords[0]?.code ?? null,
  )

  const statusFilter = parseStatus(searchParams.get('status'))
  const period = parsePeriod(searchParams.get('periode'))
  const shopFilter = searchParams.get('toko') ?? 'semua'
  const keyword = searchParams.get('q') ?? ''
  const sortOrder: SortOrder = searchParams.get('sort') === 'terlama' ? 'terlama' : 'terbaru'
  const page = Math.max(1, Number(searchParams.get('page') ?? '1') || 1)

  function updateParam(key: string, value: string, defaultValue: string) {
    const next = new URLSearchParams(searchParams)
    if (!value || value === defaultValue) next.delete(key)
    else next.set(key, value)
    if (key !== 'page') next.delete('page')
    setSearchParams(next, { replace: true })
  }

  const periodStart = useMemo(() => {
    if (period === 'hari-ini') {
      const start = new Date(syncedAt.getTime())
      start.setHours(0, 0, 0, 0)
      return start.getTime()
    }
    const days = period === '7-hari' ? 7 : 30
    return syncedAt.getTime() - days * 24 * 60 * 60 * 1000
  }, [period, syncedAt])

  const baseFiltered = useMemo(() => {
    const search = keyword.trim().toLowerCase()

    return orderRecords.filter((order) => {
      if (new Date(order.createdAt).getTime() < periodStart) return false
      if (shopFilter !== 'semua' && order.shopName !== shopFilter) return false
      if (search && !order.code.toLowerCase().includes(search)) return false
      return true
    })
  }, [periodStart, shopFilter, keyword])

  const statusCounts = useMemo(
    () => ({
      semua: baseFiltered.length,
      pending: baseFiltered.filter((order) => order.status === 'pending').length,
      diproses: baseFiltered.filter((order) => order.status === 'diproses').length,
      selesai: baseFiltered.filter((order) => order.status === 'selesai').length,
      dibatalkan: baseFiltered.filter((order) => order.status === 'dibatalkan').length,
    }),
    [baseFiltered],
  )

  const filteredOrders = useMemo(() => {
    const orders =
      statusFilter === 'semua'
        ? [...baseFiltered]
        : baseFiltered.filter((order) => order.status === statusFilter)

    return orders.sort((first, second) => {
      const firstTime = new Date(first.createdAt).getTime()
      const secondTime = new Date(second.createdAt).getTime()
      return sortOrder === 'terbaru' ? secondTime - firstTime : firstTime - secondTime
    })
  }, [baseFiltered, statusFilter, sortOrder])

  const totalValue = filteredOrders.reduce((total, order) => total + order.total, 0)
  const averageTicket = filteredOrders.length
    ? Math.round(totalValue / filteredOrders.length)
    : 0
  const paidShare = baseFiltered.length
    ? Math.round(
        ((statusCounts.selesai + statusCounts.diproses) / baseFiltered.length) * 100,
      )
    : 0

  const pageCount = Math.max(1, Math.ceil(filteredOrders.length / PAGE_SIZE))
  const safePage = Math.min(page, pageCount)
  const visibleOrders = filteredOrders.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE,
  )

  const selectedOrder = selectedCode
    ? (filteredOrders.find((order) => order.code === selectedCode) ?? null)
    : null

  const hasActiveFilter =
    statusFilter !== 'semua' || shopFilter !== 'semua' || Boolean(keyword) || period !== '30-hari'

  function resetFilters() {
    setSearchParams(new URLSearchParams())
  }

  function goToPage(target: number) {
    const next = new URLSearchParams(searchParams)
    if (target <= 1) next.delete('page')
    else next.set('page', String(target))
    setSearchParams(next)
  }

  const pageNumbers = Array.from({ length: pageCount }, (_, index) => index + 1).filter(
    (number) =>
      number === 1 ||
      number === pageCount ||
      Math.abs(number - safePage) <= 1,
  )

  return (
    <div>
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-[#ece9fb] px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.14em] text-slate-600">
              Audit Log &amp; Transaksi
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-soft/60 px-2.5 py-1 text-[10px] font-semibold text-primary">
              <span className="size-1.5 rounded-full bg-primary" />
              Live Sync
            </span>
          </div>

          <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-ink">
            Monitoring Pesanan
          </h1>
          <p className="mt-1.5 max-w-2xl text-xs leading-relaxed text-muted">
            Pantau transaksi dan distribusi pesanan lintas toko secara real-time. Mode halaman
            baca (read-only).
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-3 rounded-2xl border border-line bg-white px-4 py-3 shadow-sm">
          <span className="flex size-8 items-center justify-center rounded-lg bg-[#f4f5fa] text-slate-500">
            <Clock className="size-4" />
          </span>
          <div>
            <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-muted">
              Sinkronisasi terakhir:
            </p>
            <p className="mt-0.5 text-[11px] font-bold text-ink">
              Baru saja ({clockFormatter.format(syncedAt)} WIB)
            </p>
          </div>
          <button
            type="button"
            onClick={() => setSyncedAt(new Date())}
            aria-label="Segarkan data pemantauan"
            className="flex size-7 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-ink"
          >
            <RefreshCw className="size-3.5" />
          </button>
        </div>
      </div>

      <section className="mt-4 flex flex-col gap-3 rounded-2xl bg-[#f3f4fa] p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-white text-primary shadow-sm">
            <ShieldCheck className="size-4" />
          </span>
          <div>
            <p className="text-[11px] font-bold text-ink">Protokol Pemantauan Terpusat</p>
            <p className="mt-0.5 max-w-2xl text-[10px] leading-relaxed text-muted">
              Halaman ini bersifat pemantauan. Admin tidak dapat memodifikasi status operasional
              toko demi menjaga integritas pembukuan pedagang.
            </p>
          </div>
        </div>
        <span className="inline-flex shrink-0 items-center gap-1.5 self-start rounded-full border border-line bg-white px-3 py-1.5 text-[10px] font-semibold text-slate-600">
          <Lock className="size-3" />
          Hak Akses: Read Only
        </span>
      </section>

      <section className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <article className="flex h-full flex-col rounded-2xl border border-line bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <p className="max-w-[140px] text-[9px] font-bold uppercase leading-relaxed tracking-[0.14em] text-muted">
              Total Nilai Terpilih
            </p>
            <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary-soft/60 text-primary">
              <FileText className="size-4" />
            </span>
          </div>
          <p className="mt-3 text-[26px] font-extrabold leading-none tracking-tight text-ink">
            {formatRupiah(totalValue)}
          </p>
          <p className="mt-auto flex items-center gap-1.5 pt-4 text-[10px] leading-relaxed text-muted">
            <TrendingUp className="size-3.5 text-emerald-600" />
            <span>
              <span className="font-bold text-emerald-600">{paidShare}%</span> pesanan lunas
              terverifikasi
            </span>
          </p>
        </article>

        <article className="flex h-full flex-col rounded-2xl border border-line bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <p className="max-w-[140px] text-[9px] font-bold uppercase leading-relaxed tracking-[0.14em] text-muted">
              Total Transaksi
            </p>
            <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-400">
              <ShoppingBag className="size-4" />
            </span>
          </div>
          <p className="mt-3 flex flex-wrap items-baseline gap-x-2 text-[26px] font-extrabold leading-none tracking-tight text-ink">
            {rupiahFormatter.format(filteredOrders.length)}
            <span className="text-[10px] font-medium text-muted">pesanan</span>
          </p>
          <p className="mt-auto pt-4 text-[10px] leading-relaxed text-muted">
            <span className="font-bold text-ink">100%</span> terhubung ke sistem NIB
          </p>
        </article>

        <article className="flex h-full flex-col rounded-2xl border border-line bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <p className="max-w-[140px] text-[9px] font-bold uppercase leading-relaxed tracking-[0.14em] text-muted">
              Rata Tiket Pesanan
            </p>
            <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-primary">
              <TrendingUp className="size-4" />
            </span>
          </div>
          <p className="mt-3 text-[26px] font-extrabold leading-none tracking-tight text-ink">
            {formatRupiah(averageTicket)}
          </p>
          <p className="mt-auto pt-4 text-[10px] leading-relaxed text-muted">
            Rata-rata nilai per pesanan pada rentang aktif
          </p>
        </article>

        <article className="relative flex h-full flex-col overflow-hidden rounded-2xl bg-primary p-5 text-white shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <p className="max-w-[120px] text-[9px] font-bold uppercase leading-relaxed tracking-[0.14em] text-white/70">
              Arus Pesanan Aktif
            </p>
            <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2 py-0.5 text-[8px] font-bold uppercase tracking-wide text-white">
              <span className="size-1.5 rounded-full bg-emerald-300" />
              Live
            </span>
          </div>
          <p className="mt-3 flex items-baseline gap-2 text-[26px] font-extrabold leading-none">
            {statusCounts.diproses}
            <span className="text-[10px] font-medium text-white/70">dalam pengiriman</span>
          </p>
          <button
            type="button"
            onClick={() => updateParam('status', 'pending', 'semua')}
            className="mt-auto flex items-center justify-between gap-2 pt-4 text-left text-[10px] font-semibold text-white/90 transition hover:text-white"
          >
            <span>{statusCounts.pending} Butuh Verifikasi Toko</span>
            <ArrowRight className="size-3.5 shrink-0" />
          </button>
        </article>
      </section>

      <section className="mt-4 rounded-2xl border border-line bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-wrap items-center gap-1">
            {statusTabs.map((tab) => {
              const active = statusFilter === tab.value

              return (
                <button
                  key={tab.value}
                  type="button"
                  onClick={() => updateParam('status', tab.value, 'semua')}
                  aria-pressed={active}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-[11px] transition ${
                    active
                      ? 'bg-primary font-bold text-white'
                      : 'font-medium text-slate-600 hover:bg-slate-50 hover:text-ink'
                  }`}
                >
                  {tab.label}
                  <span
                    className={`rounded px-1.5 py-0.5 text-[9px] font-bold ${
                      active
                        ? 'bg-white/20 text-white'
                        : tab.value === 'pending'
                          ? 'bg-amber-100 text-amber-700'
                          : tab.value === 'diproses'
                            ? 'bg-primary-soft/70 text-primary'
                            : tab.value === 'selesai'
                              ? 'bg-emerald-100 text-emerald-700'
                              : tab.value === 'dibatalkan'
                                ? 'bg-red-100 text-red-600'
                                : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {statusCounts[tab.value]}
                  </span>
                </button>
              )
            })}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-semibold text-muted">Periode:</span>
            {periodOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => updateParam('periode', option.value, '30-hari')}
                aria-pressed={period === option.value}
                className={`rounded-lg px-2.5 py-1.5 text-[10px] transition ${
                  period === option.value
                    ? 'bg-[#f4f5fa] font-bold text-ink'
                    : 'font-medium text-slate-500 hover:bg-slate-50 hover:text-ink'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 size-3.5 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={keyword}
              onChange={(event) => updateParam('q', event.target.value, '')}
              placeholder="#ORD-20261123-019"
              aria-label="Cari kode pesanan"
              className="h-11 w-full rounded-xl border border-line bg-[#f7f7fb] pl-9 pr-3 text-xs text-ink outline-none transition placeholder:text-slate-400 focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10"
            />
          </div>
          <div className="relative sm:w-[240px]">
            <select
              value={shopFilter}
              onChange={(event) => updateParam('toko', event.target.value, 'semua')}
              aria-label="Filter toko UMKM"
              className="h-11 w-full cursor-pointer appearance-none rounded-xl border border-line bg-[#f7f7fb] pl-9 pr-9 text-[10px] text-ink outline-none transition focus:border-primary focus:bg-white"
            >
              <option value="semua">Semua Toko UMKM</option>
              {orderShops.map((shop) => (
                <option key={shop} value={shop}>
                  {shop}
                </option>
              ))}
            </select>
            <Store className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-slate-400" />
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-3.5 -translate-y-1/2 text-slate-400" />
          </div>
        </div>
      </section>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_400px]">
        <section className="min-w-0 overflow-hidden rounded-2xl border border-line bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-5 py-3.5">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-sm font-bold text-ink">Daftar Transaksi UMKM</h2>
              <span className="rounded-full bg-[#f4f5fa] px-2 py-0.5 text-[9px] font-semibold text-slate-500">
                {filteredOrders.length} dari {orderRecords.length} pesanan
              </span>
            </div>
            <div className="relative">
              <select
                value={sortOrder}
                onChange={(event) => updateParam('sort', event.target.value, 'terbaru')}
                aria-label="Urutkan pesanan"
                className="h-8 cursor-pointer appearance-none rounded-lg border border-line bg-white pl-2.5 pr-7 text-[10px] font-semibold text-slate-600 outline-none transition focus:border-primary"
              >
                <option value="terbaru">Sortir: Terbaru</option>
                <option value="terlama">Sortir: Terlama</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-2 top-1/2 size-3 -translate-y-1/2 text-slate-400" />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left">
              <thead>
                <tr className="bg-[#f4f5fa] text-[9px] uppercase tracking-[0.08em] text-muted">
                  <th className="px-4 py-3 font-bold">Kode Pesanan</th>
                  <th className="px-3 py-3 font-bold">Toko UMKM</th>
                  <th className="px-3 py-3 font-bold">Pelanggan</th>
                  <th className="px-3 py-3 text-right font-bold">Total Tagihan</th>
                  <th className="px-3 py-3 font-bold">Status</th>
                  <th className="px-4 py-3 font-bold">Waktu</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {visibleOrders.length === 0 ? (
                  <tr>
                    <td colSpan={6}>
                      <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
                        <span className="flex size-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                          <ShoppingBag className="size-5" />
                        </span>
                        <h3 className="mt-3 text-sm font-bold text-ink">
                          Tidak ada pesanan yang cocok
                        </h3>
                        <p className="mt-1 text-xs text-muted">
                          Coba ubah kata kunci, status, atau periode pemantauan.
                        </p>
                        {hasActiveFilter && (
                          <button
                            type="button"
                            onClick={resetFilters}
                            className="mt-4 rounded-xl border border-line bg-white px-4 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
                          >
                            Reset filter
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  visibleOrders.map((order) => {
                    const meta = statusMeta[order.status]
                    const isSelected = order.code === selectedOrder?.code

                    return (
                      <tr
                        key={order.code}
                        onClick={() => setSelectedCode(order.code)}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault()
                            setSelectedCode(order.code)
                          }
                        }}
                        tabIndex={0}
                        aria-selected={isSelected}
                        className={`cursor-pointer transition focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 ${
                          isSelected
                            ? 'bg-primary-soft/25 shadow-[inset_2px_0_0_0_#0f766e]'
                            : 'hover:bg-slate-50/70'
                        }`}
                      >
                        <td className="px-4 py-3.5">
                          <span className="font-mono text-[10px] font-bold text-ink">
                            {order.code}
                          </span>
                        </td>
                        <td className="px-3 py-3.5">
                          <p className="text-[11px] font-bold text-ink">{order.shopName}</p>
                          <p className="mt-0.5 text-[9px] text-muted">{order.shopCategory}</p>
                        </td>
                        <td className="px-3 py-3.5 text-[11px] text-slate-600">
                          {order.customer}
                        </td>
                        <td className="px-3 py-3.5 text-right text-[11px] font-bold text-ink">
                          {formatRupiah(order.total)}
                        </td>
                        <td className="px-3 py-3.5">
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[9px] font-semibold ${meta.badge}`}
                          >
                            <span className={`size-1.5 rounded-full ${meta.dot}`} />
                            {meta.label}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-[10px] text-muted">
                          {formatDateTime(order.createdAt)}
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col gap-3 border-t border-line px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[10px] text-muted">
              Menampilkan{' '}
              <span className="font-semibold text-ink">
                {filteredOrders.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1}-
                {Math.min(safePage * PAGE_SIZE, filteredOrders.length)}
              </span>{' '}
              dari <span className="font-semibold text-ink">{filteredOrders.length}</span> pesanan
            </p>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => goToPage(Math.max(1, safePage - 1))}
                disabled={safePage <= 1}
                aria-label="Halaman sebelumnya"
                className="flex size-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-300"
              >
                <ChevronLeft className="size-3.5" />
              </button>
              {pageNumbers.map((pageNumber, index) => {
                const previous = pageNumbers[index - 1]
                const showEllipsis = previous !== undefined && pageNumber - previous > 1

                return (
                  <span key={pageNumber} className="flex items-center gap-1">
                    {showEllipsis && <span className="px-0.5 text-[10px] text-slate-400">…</span>}
                    <button
                      type="button"
                      onClick={() => goToPage(pageNumber)}
                      aria-current={pageNumber === safePage ? 'page' : undefined}
                      className={`flex size-8 items-center justify-center rounded-lg text-[10px] font-semibold transition ${
                        pageNumber === safePage
                          ? 'bg-primary text-white'
                          : 'border border-line bg-white text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {pageNumber}
                    </button>
                  </span>
                )
              })}
              <button
                type="button"
                onClick={() => goToPage(Math.min(pageCount, safePage + 1))}
                disabled={safePage >= pageCount}
                aria-label="Halaman berikutnya"
                className="flex size-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-300"
              >
                <ChevronRight className="size-3.5" />
              </button>
            </div>
          </div>
        </section>

        <aside className="min-w-0 xl:sticky xl:top-24 xl:self-start">
          {selectedOrder ? (
            <section className="rounded-2xl border border-line bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="break-all font-mono text-xs font-bold text-ink">
                    {selectedOrder.code}
                  </p>
                  <span
                    className={`mt-2 inline-flex items-center gap-1 rounded-full px-2 py-1 text-[9px] font-semibold ${
                      statusMeta[selectedOrder.status].badge
                    }`}
                  >
                    <span
                      className={`size-1.5 rounded-full ${statusMeta[selectedOrder.status].dot}`}
                    />
                    {selectedOrder.status === 'diproses'
                      ? 'Diproses Toko'
                      : statusMeta[selectedOrder.status].label}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedCode(null)}
                  aria-label="Tutup detail pesanan"
                  className="flex size-7 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                >
                  <X className="size-4" />
                </button>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3 border-t border-line pt-4">
                <div className="min-w-0">
                  <p className="text-[8px] font-bold uppercase tracking-[0.12em] text-muted">
                    Toko Terkait
                  </p>
                  <p className="mt-1 text-[11px] font-bold text-ink">
                    {selectedOrder.shopName}
                  </p>
                  <p className="mt-1 flex items-center gap-1 text-[9px] text-muted">
                    <User className="size-2.5 shrink-0" />
                    <span className="truncate">Pemilik: {selectedOrder.shopOwner}</span>
                  </p>
                  <p className="mt-1 break-all text-[9px] text-muted">
                    NIB: {selectedOrder.shopNib}
                  </p>
                  <p className="mt-1 text-[9px] text-muted">{selectedOrder.shopCity}</p>
                </div>
                <div className="min-w-0">
                  <p className="text-[8px] font-bold uppercase tracking-[0.12em] text-muted">
                    Pelanggan
                  </p>
                  <p className="mt-1 text-[11px] font-bold text-ink">{selectedOrder.customer}</p>
                  <p className="mt-1 flex items-center gap-1 text-[9px] text-slate-400">
                    <Lock className="size-2.5 shrink-0" />
                    Privasi Data Aktif
                  </p>
                  <p className="mt-1 flex items-start gap-1 text-[9px] text-muted">
                    <MapPin className="mt-0.5 size-2.5 shrink-0" />
                    <span>Alamat tujuan: {selectedOrder.destinationCity}</span>
                  </p>
                </div>
              </div>

              <div className="mt-4">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-[11px] font-bold text-ink">Rincian Item Belanja</h3>
                  <span className="text-[9px] text-muted">
                    {selectedOrder.items.length} macam menu
                  </span>
                </div>
                <div className="mt-2 divide-y divide-line rounded-xl border border-line">
                  {selectedOrder.items.map((item) => (
                    <div
                      key={item.name}
                      className="flex items-start justify-between gap-3 px-3 py-2.5"
                    >
                      <div className="min-w-0">
                        <p className="text-[10px] font-semibold leading-snug text-ink">
                          {item.name}
                        </p>
                        <p className="mt-0.5 text-[9px] text-muted">
                          {item.qty}x @ {formatRupiah(item.unitPrice)}
                        </p>
                      </div>
                      <p className="shrink-0 text-[10px] font-bold text-ink">
                        {formatRupiah(item.qty * item.unitPrice)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-3 rounded-xl bg-[#f4f5fa] p-3.5">
                <div className="space-y-1.5 text-[10px]">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-muted">Subtotal Produk</span>
                    <span className="font-semibold text-ink">
                      {formatRupiah(selectedOrder.subtotal)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-muted">
                      Ongkos Kirim Kurir Lokal{' '}
                      <span className="rounded bg-white px-1 py-0.5 text-[8px] font-semibold text-slate-500">
                        Reguler
                      </span>
                    </span>
                    <span className="font-semibold text-ink">
                      {selectedOrder.shippingFee === 0
                        ? 'Gratis'
                        : formatRupiah(selectedOrder.shippingFee)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-muted">Biaya Layanan Gerbang UMKM</span>
                    <span className="font-semibold text-emerald-600">Gratis (Subsidi)</span>
                  </div>
                </div>
                <div className="mt-2 flex items-end justify-between gap-2 border-t border-line pt-2.5">
                  <div>
                    <p className="text-[11px] font-bold text-ink">Total Pembayaran</p>
                    <p className="mt-0.5 text-[9px] text-muted">{selectedOrder.paymentLabel}</p>
                  </div>
                  <p className="text-lg font-extrabold leading-none text-primary">
                    {formatRupiah(selectedOrder.total)}
                  </p>
                </div>
              </div>

              <div className="mt-4">
                <h3 className="text-[11px] font-bold text-ink">Jejak Status Transaksi</h3>
                <ol className="relative mt-3 space-y-3.5 before:absolute before:bottom-1 before:left-[5px] before:top-1 before:w-px before:bg-line">
                  {buildTimeline(selectedOrder).map((event) => (
                    <li key={`${event.title}-${event.at}`} className="relative pl-5">
                      <span
                        className={`absolute left-0 top-1 size-[11px] rounded-full border-2 border-white ${
                          event.tone === 'primary' ? 'bg-primary' : 'bg-slate-300'
                        }`}
                      />
                      <p className="text-[10px] font-bold leading-snug text-ink">{event.title}</p>
                      <p className="mt-0.5 text-[9px] leading-relaxed text-muted">
                        {event.description}
                      </p>
                      <p className="mt-0.5 text-[8px] text-slate-400">{formatTime(event.at)}</p>
                    </li>
                  ))}
                </ol>
              </div>

              <div className="mt-4 flex gap-2 rounded-xl bg-[#f4f5fa] p-3">
                <Info className="mt-0.5 size-3.5 shrink-0 text-slate-400" />
                <p className="text-[9px] leading-relaxed text-muted">
                  Mode Monitoring: perubahan status pesanan dikelola secara mandiri oleh pemilik
                  toko dan mitra kurir pengiriman.
                </p>
              </div>
            </section>
          ) : (
            <section className="flex flex-col items-center rounded-2xl border border-line bg-white px-6 py-12 text-center shadow-sm">
              <span className="flex size-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                <Activity className="size-5" />
              </span>
              <h3 className="mt-3 text-sm font-bold text-ink">Pilih pesanan</h3>
              <p className="mt-1 text-[10px] leading-relaxed text-muted">
                Klik salah satu baris pada daftar transaksi untuk melihat rincian pesanan dan jejak
                statusnya.
              </p>
            </section>
          )}
        </aside>
      </div>
    </div>
  )
}
