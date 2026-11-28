import { useEffect, useMemo, useState } from 'react'
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
import type { ApiError } from '../../lib/api/client'
import { ordersApi, shopsApi } from '../../lib/api/services'
import type {
  AdminOrderDetail,
  AdminOrderListItem,
  AdminOrderSummary,
  OrderStatus,
  ShopListItem,
} from '../../lib/api/types'

type StatusFilter = OrderStatus | 'semua'
type PeriodFilter = 'hari-ini' | '7-hari' | '30-hari' | 'kustom'
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
  { value: 'kustom', label: 'Kustom' },
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
const dayKeyFormatter = new Intl.DateTimeFormat('en-CA', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
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
  if (value === 'hari-ini' || value === '7-hari' || value === '30-hari' || value === 'kustom') {
    return value
  }
  return '30-hari'
}

function wibDayKey(offsetDays: number) {
  const date = new Date()
  date.setDate(date.getDate() + offsetDays)
  return dayKeyFormatter.format(date)
}

function periodRange(period: PeriodFilter) {
  if (period === 'hari-ini') return { from: wibDayKey(0), to: wibDayKey(0) }
  if (period === '7-hari') return { from: wibDayKey(-6), to: wibDayKey(0) }
  return { from: wibDayKey(-29), to: wibDayKey(0) }
}

function statusHistoryTitle(status: OrderStatus) {
  if (status === 'pending') return 'Pesanan Dibuat'
  if (status === 'diproses') return 'Pesanan Diproses Toko'
  if (status === 'selesai') return 'Pesanan Selesai'
  return 'Pesanan Dibatalkan'
}

export default function AdminMonitoringOrderPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [syncedAt, setSyncedAt] = useState(() => new Date())
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [orders, setOrders] = useState<AdminOrderListItem[]>([])
  const [summary, setSummary] = useState<AdminOrderSummary | null>(null)
  const [totalOrders, setTotalOrders] = useState(0)
  const [shops, setShops] = useState<ShopListItem[]>([])
  const [shopPickerOpen, setShopPickerOpen] = useState(false)
  const [shopQuery, setShopQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [detail, setDetail] = useState<AdminOrderDetail | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailError, setDetailError] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  const statusFilter = parseStatus(searchParams.get('status'))
  const period = parsePeriod(searchParams.get('periode'))
  const shopFilter = searchParams.get('toko') ?? 'semua'
  const keyword = searchParams.get('q') ?? ''
  const sortOrder: SortOrder = searchParams.get('sort') === 'terlama' ? 'terlama' : 'terbaru'
  const page = Math.max(1, Number(searchParams.get('page') ?? '1') || 1)

  const fromParam = searchParams.get('dari') ?? ''
  const toParam = searchParams.get('sampai') ?? ''
  const range = useMemo(
    () =>
      period === 'kustom'
        ? { from: fromParam || wibDayKey(-29), to: toParam || wibDayKey(0) }
        : periodRange(period),
    [period, fromParam, toParam],
  )
  const selectedShop = shops.find((shop) => shop.id === shopFilter)
  const filteredShops = shops.filter((shop) =>
    shop.name.toLowerCase().includes(shopQuery.trim().toLowerCase()),
  )

  function updateParam(key: string, value: string, defaultValue: string) {
    const next = new URLSearchParams(searchParams)
    if (!value || value === defaultValue) next.delete(key)
    else next.set(key, value)
    if (key !== 'page') next.delete('page')
    setSearchParams(next, { replace: true })
  }

  useEffect(() => {
    let cancelled = false
    shopsApi
      .list({ limit: 50 })
      .then((response) => {
        if (!cancelled) setShops(response.data)
      })
      .catch(() => undefined)
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    const timer = window.setTimeout(() => {
      setLoading(true)
      setError(null)
      ordersApi
        .list({
          ...(statusFilter !== 'semua' ? { status: statusFilter } : {}),
          ...(shopFilter !== 'semua' ? { shopId: shopFilter } : {}),
          ...(range.from ? { from: range.from } : {}),
          ...(range.to ? { to: range.to } : {}),
          ...(keyword.trim() ? { q: keyword.trim() } : {}),
          sort: sortOrder,
          page,
          limit: PAGE_SIZE,
        })
        .then((response) => {
          if (cancelled) return
          setOrders(response.data)
          setSummary(response.summary)
          setTotalOrders(response.meta.total)
          setSyncedAt(new Date())
        })
        .catch((err: ApiError) => {
          if (cancelled) return
          setError(err.userMessage ?? 'Gagal memuat data pesanan')
        })
        .finally(() => {
          if (!cancelled) setLoading(false)
        })
    }, 250)
    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [statusFilter, shopFilter, keyword, range, sortOrder, page, refreshKey])

  useEffect(() => {
    if (!selectedId) {
      setDetail(null)
      setDetailError(null)
      return
    }
    let cancelled = false
    setDetailLoading(true)
    setDetailError(null)
    ordersApi
      .detail(selectedId)
      .then((response) => {
        if (!cancelled) setDetail(response)
      })
      .catch((err: ApiError) => {
        if (cancelled) return
        setDetail(null)
        setDetailError(err.userMessage ?? 'Gagal memuat detail pesanan')
      })
      .finally(() => {
        if (!cancelled) setDetailLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [selectedId, refreshKey])

  const statusCounts = useMemo(
    () => ({
      semua: summary?.count ?? 0,
      pending: summary?.statusCounts.pending ?? 0,
      diproses: summary?.statusCounts.diproses ?? 0,
      selesai: summary?.statusCounts.selesai ?? 0,
      dibatalkan: summary?.statusCounts.dibatalkan ?? 0,
    }),
    [summary],
  )

  const totalValue = summary?.totalValue ?? 0
  const averageTicket =
    summary && summary.count > 0 ? Math.round(summary.totalValue / summary.count) : 0
  const pageCount = Math.max(1, Math.ceil(totalOrders / PAGE_SIZE))
  const safePage = Math.min(page, pageCount)

  const hasActiveFilter =
    statusFilter !== 'semua' || shopFilter !== 'semua' || Boolean(keyword) || period !== '30-hari'

  const pageNumbers = Array.from({ length: pageCount }, (_, index) => index + 1).filter(
    (number) => number === 1 || number === pageCount || Math.abs(number - safePage) <= 1,
  )

  function resetFilters() {
    setSearchParams(new URLSearchParams())
  }

  function goToPage(target: number) {
    const next = new URLSearchParams(searchParams)
    if (target <= 1) next.delete('page')
    else next.set('page', String(target))
    setSearchParams(next)
  }

  function refresh() {
    setSyncedAt(new Date())
    setRefreshKey((value) => value + 1)
  }

  const subtotal = detail
    ? detail.items.reduce((total, item) => total + item.subtotal, 0)
    : 0
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
              {clockFormatter.format(syncedAt)} WIB
            </p>
          </div>
          <button
            type="button"
            onClick={refresh}
            aria-label="Segarkan data pemantauan"
            className="flex size-7 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-ink"
          >
            <RefreshCw className={`size-3.5 ${loading ? 'animate-spin' : ''}`} />
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
          <p className="mt-auto pt-4 text-[10px] leading-relaxed text-muted">
            <span className="font-bold text-ink">{statusCounts.selesai}</span> selesai ·{' '}
            <span className="font-bold text-ink">{statusCounts.diproses}</span> diproses
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
            {rupiahFormatter.format(statusCounts.semua)}
            <span className="text-[10px] font-medium text-muted">pesanan</span>
          </p>
          <p className="mt-auto pt-4 text-[10px] leading-relaxed text-muted">
            <span className="font-bold text-ink">{statusCounts.pending}</span> menunggu tindakan
            toko
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
            <span className="text-[10px] font-medium text-white/70">sedang diproses</span>
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
            {period === 'kustom' && (
              <div className="flex w-full flex-wrap items-center gap-1.5 pt-1 sm:w-auto sm:pt-0">
                <input
                  type="date"
                  value={fromParam || wibDayKey(-29)}
                  max={toParam || wibDayKey(0)}
                  onChange={(event) => updateParam('dari', event.target.value, wibDayKey(-29))}
                  aria-label="Tanggal awal"
                  className="h-8 rounded-lg border border-line bg-white px-2 text-[10px] text-ink outline-none focus:border-primary"
                />
                <span className="text-[10px] text-muted">s.d.</span>
                <input
                  type="date"
                  value={toParam || wibDayKey(0)}
                  min={fromParam || wibDayKey(-29)}
                  max={wibDayKey(0)}
                  onChange={(event) => updateParam('sampai', event.target.value, wibDayKey(0))}
                  aria-label="Tanggal akhir"
                  className="h-8 rounded-lg border border-line bg-white px-2 text-[10px] text-ink outline-none focus:border-primary"
                />
              </div>
            )}
          </div>
        </div>

        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 size-3.5 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={keyword}
              onChange={(event) => updateParam('q', event.target.value, '')}
              placeholder="#ORD-0001"
              aria-label="Cari kode pesanan"
              className="h-11 w-full rounded-xl border border-line bg-[#f7f7fb] pl-9 pr-3 text-xs text-ink outline-none transition placeholder:text-slate-400 focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10"
            />
          </div>
          <div className="relative sm:w-[240px]">
            <button
              type="button"
              onClick={() => setShopPickerOpen((current) => !current)}
              aria-expanded={shopPickerOpen}
              aria-label="Filter toko UMKM"
              className="flex h-11 w-full items-center gap-2 rounded-xl border border-line bg-[#f7f7fb] pl-9 pr-9 text-left text-[10px] text-ink outline-none transition focus:border-primary focus:bg-white"
            >
              <span className="truncate">{selectedShop?.name ?? 'Semua Toko UMKM'}</span>
            </button>
            <Store className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-slate-400" />
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-3.5 -translate-y-1/2 text-slate-400" />

            {shopPickerOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShopPickerOpen(false)}
                  aria-hidden
                />
                <div className="absolute left-0 right-0 z-50 mt-1 rounded-xl border border-line bg-white p-2 shadow-xl">
                  <input
                    type="search"
                    autoFocus
                    value={shopQuery}
                    onChange={(event) => setShopQuery(event.target.value)}
                    placeholder="Cari nama toko..."
                    aria-label="Cari toko UMKM"
                    className="h-9 w-full rounded-lg border border-line bg-[#f7f7fb] px-2.5 text-[10px] text-ink outline-none focus:border-primary"
                  />
                  <ul className="mt-1 max-h-56 divide-y divide-line overflow-y-auto">
                    <li>
                      <button
                        type="button"
                        onClick={() => {
                          updateParam('toko', 'semua', 'semua')
                          setShopPickerOpen(false)
                        }}
                        className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-[10px] font-semibold text-slate-600 hover:bg-slate-50"
                      >
                        Semua Toko UMKM
                      </button>
                    </li>
                    {filteredShops.length === 0 ? (
                      <li className="px-2 py-3 text-center text-[10px] text-muted">
                        Toko tidak ditemukan.
                      </li>
                    ) : (
                      filteredShops.map((shop) => (
                        <li key={shop.id}>
                          <button
                            type="button"
                            onClick={() => {
                              updateParam('toko', shop.id, 'semua')
                              setShopPickerOpen(false)
                            }}
                            className={`flex w-full items-center justify-between gap-2 rounded-lg px-2 py-2 text-left text-[10px] hover:bg-slate-50 ${
                              shopFilter === shop.id
                                ? 'font-bold text-primary'
                                : 'font-medium text-slate-600'
                            }`}
                          >
                            <span className="truncate">{shop.name}</span>
                          </button>
                        </li>
                      ))
                    )}
                  </ul>
                </div>
              </>
            )}
          </div>
        </div>
      </section>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_400px]">
        <section className="min-w-0 overflow-hidden rounded-2xl border border-line bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-5 py-3.5">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-sm font-bold text-ink">Daftar Transaksi UMKM</h2>
              <span className="rounded-full bg-[#f4f5fa] px-2 py-0.5 text-[9px] font-semibold text-slate-500">
                {loading ? 'Memuat…' : `${totalOrders} pesanan`}
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
                {loading && orders.length === 0 ? (
                  <tr>
                    <td colSpan={6}>
                      <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
                        <span className="flex size-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                          <RefreshCw className="size-5 animate-spin" />
                        </span>
                        <h3 className="mt-3 text-sm font-bold text-ink">Memuat pesanan</h3>
                        <p className="mt-1 text-xs text-muted">
                          Mengambil data transaksi terbaru dari server.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan={6}>
                      <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
                        <span className="flex size-12 items-center justify-center rounded-2xl bg-red-50 text-red-500">
                          <Info className="size-5" />
                        </span>
                        <h3 className="mt-3 text-sm font-bold text-ink">Gagal memuat pesanan</h3>
                        <p className="mt-1 max-w-md text-xs text-muted">{error}</p>
                        <button
                          type="button"
                          onClick={refresh}
                          className="mt-4 rounded-xl border border-line bg-white px-4 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
                        >
                          Coba lagi
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : orders.length === 0 ? (
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
                  orders.map((order) => {
                    const meta = statusMeta[order.status]
                    const isSelected = order.id === selectedId

                    return (
                      <tr
                        key={order.id}
                        onClick={() => setSelectedId(order.id)}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault()
                            setSelectedId(order.id)
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
                          <p className="mt-0.5 text-[9px] text-muted">{order.shopOwner}</p>
                        </td>
                        <td className="px-3 py-3.5 text-[11px] text-slate-600">
                          {order.customerName}
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
                {totalOrders === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1}-
                {Math.min(safePage * PAGE_SIZE, totalOrders)}
              </span>{' '}
              dari <span className="font-semibold text-ink">{totalOrders}</span> pesanan
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
          {selectedId ? (
            detailError ? (
              <section className="flex flex-col items-center rounded-2xl border border-line bg-white px-6 py-12 text-center shadow-sm">
                <span className="flex size-12 items-center justify-center rounded-2xl bg-red-50 text-red-500">
                  <Info className="size-5" />
                </span>
                <h3 className="mt-3 text-sm font-bold text-ink">Detail gagal dimuat</h3>
                <p className="mt-1 text-[10px] leading-relaxed text-muted">{detailError}</p>
                <button
                  type="button"
                  onClick={refresh}
                  className="mt-4 rounded-xl border border-line bg-white px-4 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
                >
                  Coba lagi
                </button>
              </section>
            ) : detailLoading || !detail ? (
              <section className="flex flex-col items-center rounded-2xl border border-line bg-white px-6 py-12 text-center shadow-sm">
                <span className="flex size-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                  <RefreshCw className="size-5 animate-spin" />
                </span>
                <h3 className="mt-3 text-sm font-bold text-ink">Memuat detail</h3>
                <p className="mt-1 text-[10px] leading-relaxed text-muted">
                  Mengambil rincian item dan jejak status pesanan.
                </p>
              </section>
            ) : (
              <section className="rounded-2xl border border-line bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="break-all font-mono text-xs font-bold text-ink">{detail.code}</p>
                    <span
                      className={`mt-2 inline-flex items-center gap-1 rounded-full px-2 py-1 text-[9px] font-semibold ${
                        statusMeta[detail.status].badge
                      }`}
                    >
                      <span className={`size-1.5 rounded-full ${statusMeta[detail.status].dot}`} />
                      {detail.status === 'diproses'
                        ? 'Diproses Toko'
                        : statusMeta[detail.status].label}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedId(null)}
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
                    <p className="mt-1 text-[11px] font-bold text-ink">{detail.shop.name}</p>
                    <p className="mt-1 flex items-center gap-1 text-[9px] text-muted">
                      <User className="size-2.5 shrink-0" />
                      <span className="truncate">Pemilik: {detail.shop.ownerName}</span>
                    </p>
                    <p className="mt-1 break-all text-[9px] text-muted">
                      NIB: {detail.shop.nib ?? 'Belum terdaftar'}
                    </p>
                    <p className="mt-1 text-[9px] text-muted">{detail.shop.phone ?? '-'}</p>
                  </div>
                  <div className="min-w-0">
                    <p className="text-[8px] font-bold uppercase tracking-[0.12em] text-muted">
                      Pelanggan
                    </p>
                    <p className="mt-1 text-[11px] font-bold text-ink">{detail.customer.name}</p>
                    <p className="mt-1 flex items-center gap-1 text-[9px] text-slate-400">
                      <Lock className="size-2.5 shrink-0" />
                      Privasi Data Aktif
                    </p>
                    <p className="mt-1 flex items-start gap-1 text-[9px] text-muted">
                      <MapPin className="mt-0.5 size-2.5 shrink-0" />
                      <span>Alamat toko: {detail.shop.address ?? '-'}</span>
                    </p>
                  </div>
                </div>

                <div className="mt-4">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-[11px] font-bold text-ink">Rincian Item Belanja</h3>
                    <span className="text-[9px] text-muted">
                      {detail.items.length} macam produk
                    </span>
                  </div>
                  <div className="mt-2 divide-y divide-line rounded-xl border border-line">
                    {detail.items.length === 0 ? (
                      <p className="px-3 py-4 text-center text-[10px] text-muted">
                        Tidak ada rincian item pada pesanan ini.
                      </p>
                    ) : (
                      detail.items.map((item) => (
                        <div
                          key={item.id}
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
                            {formatRupiah(item.subtotal)}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="mt-3 rounded-xl bg-[#f4f5fa] p-3.5">
                  <div className="space-y-1.5 text-[10px]">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-muted">Subtotal Produk</span>
                      <span className="font-semibold text-ink">{formatRupiah(subtotal)}</span>
                    </div>
                  </div>
                  <div className="mt-2 flex items-end justify-between gap-2 border-t border-line pt-2.5">
                    <div>
                      <p className="text-[11px] font-bold text-ink">Total Pembayaran</p>
                      <p className="mt-0.5 text-[9px] text-muted">
                        Status: {statusMeta[detail.status].label}
                      </p>
                    </div>
                    <p className="text-lg font-extrabold leading-none text-primary">
                      {formatRupiah(detail.total)}
                    </p>
                  </div>
                </div>

                <div className="mt-4">
                  <h3 className="text-[11px] font-bold text-ink">Jejak Status Transaksi</h3>
                  {detail.statusHistory.length === 0 ? (
                    <p className="mt-3 rounded-xl border border-dashed border-line px-3 py-4 text-center text-[10px] text-muted">
                      Belum ada riwayat status untuk pesanan ini.
                    </p>
                  ) : (
                    <ol className="relative mt-3 space-y-3.5 before:absolute before:bottom-1 before:left-[5px] before:top-1 before:w-px before:bg-line">
                      {detail.statusHistory.map((event, index) => {
                        const isLatest = index === detail.statusHistory.length - 1
                        return (
                          <li key={event.id} className="relative pl-5">
                            <span
                              className={`absolute left-0 top-1 size-[11px] rounded-full border-2 border-white ${
                                isLatest ? 'bg-primary' : 'bg-slate-300'
                              }`}
                            />
                            <p className="text-[10px] font-bold leading-snug text-ink">
                              {statusHistoryTitle(event.toStatus)}
                            </p>
                            <p className="mt-0.5 text-[9px] leading-relaxed text-muted">
                              {event.note ?? 'Status pesanan diperbarui.'}
                            </p>
                            <p className="mt-0.5 text-[8px] text-slate-400">
                              {formatTime(event.createdAt)}
                              {event.changedBy ? ` · oleh ${event.changedBy.name}` : ''}
                            </p>
                          </li>
                        )
                      })}
                    </ol>
                  )}
                </div>

                <div className="mt-4 flex gap-2 rounded-xl bg-[#f4f5fa] p-3">
                  <Info className="mt-0.5 size-3.5 shrink-0 text-slate-400" />
                  <p className="text-[9px] leading-relaxed text-muted">
                    Mode Monitoring: perubahan status pesanan dikelola secara mandiri oleh pemilik
                    toko. Admin hanya dapat membaca data.
                  </p>
                </div>
              </section>
            )
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
