import { useEffect, useState, type ReactNode } from 'react'
import { Link, Navigate } from 'react-router-dom'
import {
  ArrowRight,
  ArrowUpRight,
  Ban,
  Cake,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Cookie,
  Eye,
  Info,
  Package,
  Plus,
  RotateCw,
  ShoppingBag,
  Soup,
  TriangleAlert,
  Wallet,
  XCircle,
  type LucideIcon,
} from 'lucide-react'
import OwnerSalesChart from '../../components/owner/OwnerSalesChart'
import { getOwnerSession, type OwnerStoreStatus } from '../../lib/owner-auth'
import {
  ownerLowStockItems,
  ownerOrdersNeedingAction,
  ownerSalesTrend30,
  ownerSalesTrend7,
  ownerTopProducts,
  type OwnerOrder,
  type OwnerOrderStatus,
  type OwnerProductVisual,
} from '../../lib/owner-dashboard-data'

type RangeKey = '7d' | '30d' | 'bulan'

type Toast = {
  message: string
  tone: 'success' | 'info' | 'danger'
}

const rangeOptions: { key: RangeKey; label: string }[] = [
  { key: '7d', label: '7 Hari Terakhir' },
  { key: '30d', label: '30 Hari Terakhir' },
  { key: 'bulan', label: 'Bulan Ini' },
]

const rangeSummary: Record<
  RangeKey,
  { average: string; totalLabel: string; total: string }
> = {
  '7d': { average: 'Rp 425.000', totalLabel: 'Total 7 Hari', total: 'Rp 2.975.000' },
  '30d': {
    average: 'Rp 391.000',
    totalLabel: 'Total 30 Hari',
    total: 'Rp 11.730.000',
  },
  bulan: {
    average: 'Rp 291.700',
    totalLabel: 'Total Bulan Ini',
    total: 'Rp 8.750.000',
  },
}

const productVisuals: Record<
  OwnerProductVisual,
  { icon: LucideIcon; className: string }
> = {
  lapis: {
    icon: Cake,
    className: 'bg-gradient-to-br from-[#fde7c7] to-[#f3c483] text-[#9a5b16]',
  },
  pastel: {
    icon: Cookie,
    className: 'bg-gradient-to-br from-[#f7ead2] to-[#e8cfa4] text-[#8a6a2f]',
  },
  risol: {
    icon: Soup,
    className: 'bg-gradient-to-br from-[#fbe0c0] to-[#f0b97f] text-[#925313]',
  },
  brownies: {
    icon: Package,
    className: 'bg-gradient-to-br from-[#e8d8c6] to-[#c8a98b] text-[#5f4226]',
  },
}

const orderStatusMeta: Record<
  Extract<OwnerOrderStatus, 'pending' | 'diproses'>,
  { label: string; className: string; dotClassName: string }
> = {
  pending: {
    label: 'Menunggu Konfirmasi',
    className: 'bg-[#fef3c7] text-[#b45309]',
    dotClassName: 'bg-[#f59e0b]',
  },
  diproses: {
    label: 'Sedang Diproses',
    className: 'bg-[#dbeafe] text-[#1d4ed8]',
    dotClassName: 'bg-[#2563eb]',
  },
}

const statusBannerConfig: Record<
  Exclude<OwnerStoreStatus, 'aktif'>,
  {
    icon: LucideIcon
    wrapperClassName: string
    iconClassName: string
    title: string
    description: string
  }
> = {
  pending: {
    icon: Clock3,
    wrapperClassName: 'border-amber-200 bg-amber-50 text-amber-900',
    iconClassName: 'text-amber-600',
    title: 'Toko Anda sedang ditinjau admin',
    description:
      'Toko baru dapat menerima pesanan setelah verifikasi selesai. Anda masih bisa menyiapkan produk dan melengkapi profil toko.',
  },
  ditolak: {
    icon: XCircle,
    wrapperClassName: 'border-red-200 bg-red-50 text-red-900',
    iconClassName: 'text-red-600',
    title: 'Pengajuan toko Anda ditolak',
    description:
      'Periksa kembali kelengkapan profil toko, lalu ajukan ulang agar dapat ditinjau admin kembali.',
  },
  nonaktif: {
    icon: Ban,
    wrapperClassName: 'border-slate-200 bg-slate-100 text-slate-800',
    iconClassName: 'text-slate-500',
    title: 'Toko Anda sedang nonaktif',
    description:
      'Pesanan baru tidak akan diterima sementara waktu. Hubungi admin Ratis untuk mengaktifkan kembali toko Anda.',
  },
}

function formatNumber(value: number) {
  return new Intl.NumberFormat('id-ID').format(value)
}

function formatLongDate(date: Date) {
  return new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date)
}

function getGreeting(date: Date) {
  const hour = date.getHours()
  if (hour < 11) return 'Selamat pagi'
  if (hour < 15) return 'Selamat siang'
  if (hour < 19) return 'Selamat sore'
  return 'Selamat malam'
}

function KpiCard({
  to,
  label,
  value,
  icon: Icon,
  iconClassName,
  accentClassName,
  children,
}: {
  to: string
  label: string
  value: string
  icon: LucideIcon
  iconClassName: string
  accentClassName: string
  children: ReactNode
}) {
  return (
    <Link
      to={to}
      className="group relative overflow-hidden rounded-2xl border border-line bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.06)] transition hover:border-primary/30 hover:shadow-md"
    >
      <span
        aria-hidden
        className={`absolute -right-6 -top-6 size-20 rounded-full ${accentClassName}`}
      />
      <div className="relative flex items-start justify-between gap-3">
        <p className="text-[13px] font-semibold text-slate-600">{label}</p>
        <span
          className={`flex size-9 shrink-0 items-center justify-center rounded-xl ${iconClassName}`}
        >
          <Icon className="size-[18px]" />
        </span>
      </div>
      <p className="relative mt-3 text-[26px] font-extrabold leading-tight tracking-tight text-ink">
        {value}
      </p>
      <div className="relative mt-3">{children}</div>
    </Link>
  )
}

export default function OwnerDashboardPage() {
  const [session] = useState(getOwnerSession)
  const [today] = useState(() => new Date())
  const [range, setRange] = useState<RangeKey>('7d')
  const [orders, setOrders] = useState<OwnerOrder[]>(ownerOrdersNeedingAction)
  const [refreshing, setRefreshing] = useState(false)
  const [lastUpdated, setLastUpdated] = useState('2 menit lalu')
  const [toast, setToast] = useState<Toast | null>(null)

  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => setToast(null), 4000)
    return () => window.clearTimeout(timer)
  }, [toast])

  if (!session) {
    return <Navigate to="/" replace />
  }

  const greetingName = session.name.startsWith('Pemilik ')
    ? session.name.slice('Pemilik '.length)
    : session.name.split(' ')[0]
  const activeOrders = orders.length
  const chartData =
    range === '7d'
      ? ownerSalesTrend7
      : range === '30d'
        ? ownerSalesTrend30
        : ownerSalesTrend30.slice(0, today.getDate())
  const summary = rangeSummary[range]
  const banner = session.storeStatus === 'aktif' ? null : statusBannerConfig[session.storeStatus]

  function showToast(message: string, tone: Toast['tone'] = 'success') {
    setToast({ message, tone })
  }

  function handleRefresh() {
    if (refreshing) return
    setRefreshing(true)
    window.setTimeout(() => {
      setRefreshing(false)
      setLastUpdated('Baru saja')
      showToast('Data dashboard berhasil diperbarui.', 'info')
    }, 800)
  }

  function handleProcess(order: OwnerOrder) {
    setOrders((current) =>
      current.map((item) =>
        item.id === order.id ? { ...item, status: 'diproses' } : item,
      ),
    )
    showToast(`Pesanan ${order.code} diproses.`)
  }

  function handleComplete(order: OwnerOrder) {
    setOrders((current) => current.filter((item) => item.id !== order.id))
    showToast(`Pesanan ${order.code} selesai. Pemasukan tercatat otomatis.`)
  }

  function handleCancel(order: OwnerOrder) {
    setOrders((current) => current.filter((item) => item.id !== order.id))
    showToast(`Pesanan ${order.code} dibatalkan. Stok sudah dikembalikan.`, 'danger')
  }

  return (
    <div>
      {banner && (
        <div
          className={`mb-5 flex flex-col gap-3 rounded-2xl border p-4 sm:flex-row sm:items-center sm:justify-between ${banner.wrapperClassName}`}
        >
          <div className="flex items-start gap-3">
            <banner.icon className={`mt-0.5 size-5 shrink-0 ${banner.iconClassName}`} />
            <div>
              <p className="text-sm font-bold">{banner.title}</p>
              <p className="mt-1 text-[12.5px] leading-relaxed opacity-90">
                {banner.description}
              </p>
            </div>
          </div>
          <Link
            to="/owner/toko"
            className="inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-xl bg-white/80 px-3 text-xs font-semibold shadow-sm transition hover:bg-white"
          >
            Lihat Profil Toko
            <ArrowRight className="size-3.5" />
          </Link>
        </div>
      )}

      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <h1 className="text-[26px] font-extrabold tracking-tight text-ink sm:text-[28px]">
            {getGreeting(today)}, {greetingName}
          </h1>
          <p className="mt-1 text-[13px] leading-relaxed text-slate-500">
            Pantau kinerja toko dan kelola pesanan masuk hari ini, {formatLongDate(today)}.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 text-[11px] text-slate-500">
            <span>Terakhir diperbarui {lastUpdated}</span>
            <button
              type="button"
              onClick={handleRefresh}
              aria-label="Muat ulang data dashboard"
              className="flex size-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-ink"
            >
              <RotateCw className={`size-4 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
          <Link
            to="/owner/pratinjau"
            className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-line bg-white px-3 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            <Eye className="size-4" />
            Pratinjau Toko
          </Link>
          <Link
            to="/owner/keuangan"
            className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-line bg-white px-3 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            <Wallet className="size-4" />
            Catat Pengeluaran
          </Link>
          <Link
            to="/owner/produk/baru"
            className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-primary px-3 text-xs font-semibold text-white shadow-sm transition hover:bg-primary-hover"
          >
            <Plus className="size-4" />
            Tambah Produk
          </Link>
        </div>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          to="/owner/laporan"
          label="Omzet Hari Ini"
          value="Rp 450.000"
          icon={Wallet}
          iconClassName="bg-[#e3f5ef] text-primary"
          accentClassName="bg-[#e3f5ef]/70"
        >
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-0.5 rounded-full bg-[#dcfce7] px-1.5 py-0.5 text-[10px] font-bold text-[#15803d]">
              <ArrowUpRight className="size-3" />
              15%
            </span>
            <span className="text-[10.5px] text-slate-500">dari kemarin (6 transaksi)</span>
          </div>
        </KpiCard>

        <KpiCard
          to="/owner/laporan"
          label="Omzet Bulan Ini"
          value="Rp 8.750.000"
          icon={CalendarDays}
          iconClassName="bg-[#e3f5ef] text-primary"
          accentClassName="bg-[#e3f5ef]/70"
        >
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-0.5 rounded-full bg-[#dcfce7] px-1.5 py-0.5 text-[10px] font-bold text-[#15803d]">
              <ArrowUpRight className="size-3" />
              24%
            </span>
            <span className="text-[10.5px] text-slate-500">target 70% tercapai</span>
          </div>
        </KpiCard>

        <KpiCard
          to="/owner/pesanan"
          label="Perlu Diproses"
          value={`${activeOrders} Pesanan`}
          icon={ShoppingBag}
          iconClassName="bg-[#e6efff] text-[#2563eb]"
          accentClassName="bg-[#dbeafe]/70"
        >
          <span className="inline-flex items-center gap-1 rounded-full bg-[#dbeafe] px-2 py-1 text-[10.5px] font-semibold text-[#1d4ed8]">
            <span className="size-1.5 rounded-full bg-[#2563eb]" />
            Perlu Segera Ditindak
          </span>
        </KpiCard>

        <KpiCard
          to="/owner/produk"
          label="Stok Menipis"
          value={`${ownerLowStockItems.length} Produk`}
          icon={TriangleAlert}
          iconClassName="bg-[#fee7e7] text-[#dc2626]"
          accentClassName="bg-[#fee2e2]/70"
        >
          <p className="flex items-center gap-1.5 text-[11px] font-medium text-[#dc2626]">
            <span className="size-1.5 rounded-full bg-[#dc2626]" />
            Segera restock sebelum habis
          </p>
        </KpiCard>
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.95fr)_minmax(0,1fr)]">
        <section className="rounded-2xl border border-line bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.06)]">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-[17px] font-bold text-ink">Tren Penjualan &amp; Omzet</h2>
              <p className="mt-0.5 text-[11.5px] text-slate-500">
                Performa arus kas operasional toko Anda
              </p>
            </div>
            <div className="flex shrink-0 rounded-xl bg-slate-100/80 p-1">
              {rangeOptions.map((option) => (
                <button
                  key={option.key}
                  type="button"
                  onClick={() => setRange(option.key)}
                  className={`rounded-lg px-2.5 py-1.5 text-[10.5px] font-semibold transition sm:text-[11px] ${
                    range === option.key
                      ? 'bg-white text-ink shadow-sm'
                      : 'text-slate-500 hover:text-ink'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4">
            <OwnerSalesChart data={chartData} />
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-x-8 gap-y-3 border-t border-line pt-4">
            <div>
              <p className="text-[10.5px] text-slate-500">Rata-rata Harian</p>
              <p className="mt-0.5 text-sm font-bold text-ink">{summary.average}</p>
            </div>
            <div>
              <p className="text-[10.5px] text-slate-500">{summary.totalLabel}</p>
              <p className="mt-0.5 text-sm font-bold text-ink">{summary.total}</p>
            </div>
            <p className="flex items-center gap-1.5 text-[10.5px] text-slate-500 sm:ml-auto">
              <RotateCw className="size-3.5 text-slate-400" />
              Perhitungan Otomatis POS &amp; Web
            </p>
          </div>
        </section>

        <section className="rounded-2xl border border-line bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.06)]">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-[17px] font-bold text-ink">Produk Terlaris</h2>
              <p className="mt-0.5 text-[11.5px] text-slate-500">Mingguan</p>
            </div>
            <button
              type="button"
              onClick={() => showToast('Produk terlaris berhasil diperbarui.', 'info')}
              aria-label="Muat ulang produk terlaris"
              className="flex size-8 items-center justify-center rounded-lg bg-slate-50 text-slate-500 transition hover:bg-slate-100 hover:text-ink"
            >
              <RotateCw className="size-4" />
            </button>
          </div>

          <ul className="mt-3 divide-y divide-line">
            {ownerTopProducts.map((product) => {
              const visual = productVisuals[product.visual]
              const Icon = visual.icon
              return (
                <li key={product.id} className="flex items-center gap-3 py-3 first:pt-1 last:pb-1">
                  <span
                    className={`flex size-11 shrink-0 items-center justify-center rounded-xl ${visual.className}`}
                  >
                    <Icon className="size-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[12.5px] font-semibold text-ink">
                      {product.name}
                    </p>
                    <p className="mt-0.5 text-[10.5px] text-slate-500">
                      {product.sold} terjual • Sisa {product.remaining} {product.unit}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-[12.5px] font-bold text-ink">{product.revenue}</p>
                    <p className="mt-0.5 text-[10px] text-slate-400">Rank #{product.rank}</p>
                  </div>
                </li>
              )
            })}
          </ul>

          <Link
            to="/owner/laporan"
            className="mt-4 flex items-center justify-center gap-1.5 border-t border-line pt-4 text-[11.5px] font-semibold text-primary transition hover:text-primary-hover"
          >
            Lihat Laporan Produk Selengkapnya
            <ArrowRight className="size-3.5" />
          </Link>
        </section>
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.95fr)_minmax(0,1fr)]">
        <section className="rounded-2xl border border-line bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.06)]">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2.5">
              <h2 className="text-[17px] font-bold text-ink">Pesanan Perlu Ditindak</h2>
              <span className="rounded-full bg-primary-soft/70 px-2.5 py-1 text-[10.5px] font-semibold text-primary">
                {activeOrders} Pesanan Aktif
              </span>
            </div>
            <Link
              to="/owner/pesanan"
              className="inline-flex items-center gap-1.5 text-[11.5px] font-semibold text-slate-600 transition hover:text-primary"
            >
              Lihat Semua Pesanan
              <ArrowRight className="size-3.5" />
            </Link>
          </div>

          {orders.length === 0 ? (
            <div className="mt-6 flex flex-col items-center justify-center gap-2 py-10 text-center">
              <span className="flex size-11 items-center justify-center rounded-full bg-primary-soft/50 text-primary">
                <CheckCircle2 className="size-5" />
              </span>
              <p className="text-sm font-semibold text-ink">Semua pesanan sudah ditindak</p>
              <p className="text-xs text-slate-500">
                Pesanan baru akan muncul di sini secara otomatis.
              </p>
            </div>
          ) : (
            <div className="mt-2 divide-y divide-line">
              {orders.map((order) => {
                const status = orderStatusMeta[
                  order.status === 'pending' ? 'pending' : 'diproses'
                ]
                return (
                  <div key={order.id} className="py-4 first:pt-2 last:pb-1">
                    <p className="text-[11px] text-slate-500">
                      <span className="font-semibold text-slate-600">{order.code}</span>
                      <span className="mx-1.5">•</span>
                      {order.time}
                    </p>
                    <div className="mt-2.5 grid gap-3 md:grid-cols-[1.1fr_1.2fr_auto] md:items-start xl:grid-cols-[1.1fr_1.2fr_auto_auto]">
                      <div>
                        <p className="text-[13px] font-semibold text-ink">{order.customer}</p>
                        <p className="mt-1 text-[11px] text-slate-500">{order.fulfillment}</p>
                      </div>
                      <div className="space-y-0.5">
                        {order.items.map((item) => (
                          <p key={item} className="text-[12px] text-slate-600">
                            {item}
                          </p>
                        ))}
                      </div>
                      <div className="md:text-right">
                        <p className="text-[10px] text-slate-400">Total</p>
                        <p className="text-[13px] font-bold text-ink">
                          Rp {formatNumber(order.total)}
                        </p>
                      </div>
                      <div className="flex flex-col items-start gap-2 md:items-end">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${status.className}`}
                        >
                          <span className={`size-1.5 rounded-full ${status.dotClassName}`} />
                          {status.label}
                        </span>
                        <div className="flex gap-2">
                          {order.status === 'pending' && (
                            <button
                              type="button"
                              onClick={() => handleCancel(order)}
                              className="inline-flex h-8 items-center justify-center rounded-lg border border-line bg-white px-3 text-[11px] font-semibold text-slate-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                            >
                              Batalkan
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() =>
                              order.status === 'pending'
                                ? handleProcess(order)
                                : handleComplete(order)
                            }
                            className="inline-flex h-8 items-center justify-center rounded-lg bg-primary px-3 text-[11px] font-semibold text-white shadow-sm transition hover:bg-primary-hover"
                          >
                            {order.status === 'pending' ? 'Proses Pesanan' : 'Selesaikan Pesanan'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-line bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.06)]">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <h2 className="text-[17px] font-bold text-ink">Peringatan Stok Menipis</h2>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-[#fee2e2] px-2 py-1 text-[10px] font-semibold text-[#b91c1c]">
                {ownerLowStockItems.length} Perlu Restock
              </span>
              <Link
                to="/owner/produk"
                className="text-[11px] font-semibold text-slate-500 transition hover:text-primary"
              >
                Kelola Stok
              </Link>
            </div>
          </div>

          <div className="mt-3 space-y-3">
            {ownerLowStockItems.map((item) => {
              const percent = Math.min(
                100,
                Math.max(6, Math.round((item.remaining / item.minimum) * 100)),
              )
              const isCritical = item.level === 'kritis'
              return (
                <div key={item.id} className="rounded-xl border border-line p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-[12.5px] font-semibold text-ink">
                        {item.name}
                      </p>
                      <p className="mt-0.5 text-[10.5px] text-slate-500">
                        Kategori: {item.category}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                        isCritical
                          ? 'bg-[#fee2e2] text-[#b91c1c]'
                          : 'bg-[#fef3c7] text-[#b45309]'
                      }`}
                    >
                      {isCritical ? 'Kritis' : 'Hampir Habis'}
                    </span>
                  </div>

                  <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className={`h-full rounded-full ${
                        isCritical ? 'bg-[#dc2626]' : 'bg-[#d97706]'
                      }`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>

                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                    <p className="text-[11px] text-slate-600">
                      Sisa:{' '}
                      <span className="font-bold text-ink">
                        {item.remaining} {item.unit}
                      </span>{' '}
                      <span className="text-slate-400">
                        (Batas min: {item.minimum} {item.unit})
                      </span>
                    </p>
                    <Link
                      to="/owner/produk"
                      className="inline-flex h-8 items-center justify-center rounded-lg border border-line bg-white px-3 text-[11px] font-semibold text-slate-600 transition hover:border-primary/40 hover:text-primary"
                    >
                      Sesuaikan Stok
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="mt-3 flex gap-2.5 rounded-xl bg-[#eef2ff] p-3.5">
            <Info className="mt-0.5 size-4 shrink-0 text-[#3b5bdb]" />
            <p className="text-[11px] leading-relaxed text-slate-600">
              <span className="font-semibold text-slate-700">Tips Pengelolaan:</span> Stok
              otomatis terpotong saat pelanggan menyelesaikan pembayaran. Pesanan yang
              dibatalkan akan mengembalikan kuota stok secara otomatis.
            </p>
          </div>
        </section>
      </div>

      {toast && (
        <div
          role="status"
          className={`fixed bottom-20 right-4 z-50 max-w-[320px] rounded-xl px-4 py-3 text-sm font-medium shadow-lg lg:bottom-6 ${
            toast.tone === 'success'
              ? 'bg-[#0f766e] text-white'
              : toast.tone === 'danger'
                ? 'bg-red-600 text-white'
                : 'bg-slate-900 text-white'
          }`}
        >
          {toast.message}
        </div>
      )}
    </div>
  )
}
