import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowLeftRight,
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  Ban,
  CalendarDays,
  ClipboardCheck,
  ClipboardList,
  Download,
  Info,
  ListFilter,
  RefreshCw,
  ShieldAlert,
  SlidersHorizontal,
  Store,
  TrendingUp,
  User,
  XCircle,
  type LucideIcon,
} from 'lucide-react'
import TrendChart from '../../components/admin/TrendChart'
import { pendingUmkm, topShops, trend30Hari, trend7Hari } from '../../lib/admin-dashboard-data'
import { getAdminSession } from '../../lib/auth'

type StatusTone = 'amber' | 'teal' | 'red' | 'slate'

const toneStyles: Record<StatusTone, string> = {
  amber: 'bg-amber-50 text-amber-500',
  teal: 'bg-primary-soft/50 text-primary',
  red: 'bg-red-50 text-red-500',
  slate: 'bg-slate-100 text-slate-500',
}

const umkmStats: {
  label: string
  value: number
  hint: string
  href: string
  icon: LucideIcon
  tone: StatusTone
}[] = [
  {
    label: 'Menunggu Review',
    value: 3,
    hint: 'Kebutuhan SLA 24 jam',
    href: '/admin/umkm?status=pending',
    icon: ClipboardList,
    tone: 'amber',
  },
  {
    label: 'UMKM Terverifikasi',
    value: 12,
    hint: '100% patuh perizinan',
    href: '/admin/umkm?status=aktif',
    icon: BadgeCheck,
    tone: 'teal',
  },
  {
    label: 'Permohonan Ditolak',
    value: 2,
    hint: 'Dokumen tidak cocok',
    href: '/admin/umkm?status=ditolak',
    icon: XCircle,
    tone: 'red',
  },
  {
    label: 'Toko Ditangguhkan',
    value: 1,
    hint: 'Masa berlaku habis',
    href: '/admin/umkm?status=nonaktif',
    icon: Ban,
    tone: 'slate',
  },
]

function formatRupiah(value: number) {
  return `Rp ${value.toLocaleString('id-ID')}`
}

function SkeletonLine({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-slate-200/70 ${className}`} />
}

function DashboardSkeleton() {
  return (
    <div className="mt-4 space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="rounded-2xl border border-line bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div className="w-full space-y-3">
                <SkeletonLine className="h-2.5 w-28" />
                <SkeletonLine className="h-8 w-12" />
              </div>
              <SkeletonLine className="size-10 rounded-xl" />
            </div>
            <div className="mt-5 flex items-center justify-between border-t border-line pt-3">
              <SkeletonLine className="h-2.5 w-28" />
              <SkeletonLine className="h-2.5 w-16" />
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        {Array.from({ length: 2 }).map((_, index) => (
          <div key={index} className="rounded-2xl border border-line bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div className="flex w-full items-center gap-4">
                <SkeletonLine className="size-11 rounded-xl" />
                <div className="w-full space-y-2.5">
                  <SkeletonLine className="h-2.5 w-36" />
                  <SkeletonLine className="h-7 w-44" />
                </div>
              </div>
              <SkeletonLine className="h-6 w-24 rounded-full" />
            </div>
            <SkeletonLine className="mt-5 h-2 w-full rounded-full" />
          </div>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.8fr_1fr]">
        <div className="rounded-2xl border border-line bg-white p-5 shadow-sm">
          <SkeletonLine className="h-5 w-48" />
          <SkeletonLine className="mt-2 h-2.5 w-72 max-w-full" />
          <SkeletonLine className="mt-6 h-[260px] w-full rounded-xl" />
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <SkeletonLine className="h-12 w-full" />
            <SkeletonLine className="h-12 w-full" />
            <SkeletonLine className="h-12 w-full" />
          </div>
        </div>
        <div className="rounded-2xl border border-line bg-white p-5 shadow-sm">
          <SkeletonLine className="h-5 w-44" />
          <SkeletonLine className="mt-2 h-2.5 w-52" />
          <div className="mt-5 space-y-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <SkeletonLine key={index} className="h-[92px] w-full rounded-xl" />
            ))}
          </div>
          <SkeletonLine className="mt-4 h-10 w-full rounded-xl" />
        </div>
      </div>

      <div className="rounded-2xl border border-line bg-white p-5 shadow-sm">
        <SkeletonLine className="h-5 w-56" />
        <SkeletonLine className="mt-2 h-2.5 w-80 max-w-full" />
        <div className="mt-5 space-y-2">
          {Array.from({ length: 5 }).map((_, index) => (
            <SkeletonLine key={index} className="h-12 w-full" />
          ))}
        </div>
      </div>
    </div>
  )
}

export default function AdminDashboardPage() {
  const [session] = useState(getAdminSession)
  const [range, setRange] = useState<'7' | '30'>('7')
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState('2 menit yang lalu')
  const [clock] = useState(() => {
    const now = new Date()
    const hour = now.getHours()

    return {
      greeting:
        hour < 11
          ? 'Selamat pagi'
          : hour < 15
            ? 'Selamat siang'
            : hour < 19
              ? 'Selamat sore'
              : 'Selamat malam',
      dateLabel: new Intl.DateTimeFormat('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }).format(now),
    }
  })

  useEffect(() => {
    const timer = window.setTimeout(() => setLoading(false), 800)
    return () => window.clearTimeout(timer)
  }, [])

  function handleReload() {
    if (loading) return
    setLoading(true)
    window.setTimeout(() => {
      setLoading(false)
      setLastUpdated('baru saja')
    }, 900)
  }

  function handleDownloadRecap() {
    const header = [
      'Peringkat',
      'Nama Toko',
      'Lokasi',
      'NIB',
      'Kategori',
      'Jumlah Pesanan',
      'Total Omzet',
      'Status',
    ]
    const rows = topShops.map((shop) => [
      shop.rank,
      shop.name,
      shop.location,
      shop.nib,
      shop.category,
      shop.orders,
      shop.omzet,
      'Aktif',
    ])
    const csv = [header, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n')

    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'rekap-umkm-ratis-november-2026.csv'
    link.click()
    URL.revokeObjectURL(url)
  }

  const adminFirstName = session?.name.split(' ')[0] ?? 'Admin'
  const trendData = range === '7' ? trend7Hari : trend30Hari

  return (
    <div>
      <section className="rounded-2xl border border-line bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-primary">
              Ringkasan Eksekutif
            </span>
            <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-ink">
              {clock.greeting}, {adminFirstName}
            </h1>
            <p className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-muted">
              <CalendarDays className="size-3.5" />
              {clock.dateLabel}
              <span className="text-slate-300">•</span>
              Pembaruan terakhir {lastUpdated}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={handleReload}
              disabled={loading}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-line bg-white px-4 text-xs font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw className={`size-4 ${loading ? 'animate-spin' : ''}`} />
              Muat ulang
            </button>
            <button
              type="button"
              onClick={handleDownloadRecap}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-xs font-semibold text-white transition hover:bg-primary-hover"
            >
              <Download className="size-4" />
              Unduh Rekap
            </button>
          </div>
        </div>
      </section>

      <section className="mt-4 flex flex-col gap-4 rounded-2xl border border-amber-200 bg-[#fffbeb] p-4 sm:p-5 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex items-start gap-3.5">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
            <ShieldAlert className="size-5" />
          </span>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-sm font-bold text-ink sm:text-base">
                3 UMKM menunggu verifikasi legalitas &amp; kurasi
              </h2>
              <span className="rounded-full bg-amber-200/70 px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.08em] text-amber-900">
                Prioritas Tinggi
              </span>
            </div>
            <p className="mt-1 max-w-3xl text-xs leading-relaxed text-amber-900/80">
              Tinjau pendaftaran baru agar toko pedagang dapat segera mengaktifkan etalase produk dan
              menerima transaksi publik di storefront Ratis.
            </p>
          </div>
        </div>
        <Link
          to="/admin/umkm?status=pending"
          className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl bg-[#57402f] px-4 text-xs font-semibold text-amber-50 transition hover:bg-[#463326] xl:self-center"
        >
          Tinjau sekarang
          <ArrowRight className="size-4" />
        </Link>
      </section>

      {loading ? (
        <DashboardSkeleton />
      ) : (
        <>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {umkmStats.map(({ label, value, hint, href, icon: Icon, tone }) => (
              <Link
                key={label}
                to={href}
                className="group rounded-2xl border border-line bg-white p-5 shadow-sm transition hover:border-primary/30 hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted">
                      {label}
                    </p>
                    <p className="mt-1.5 text-3xl font-extrabold leading-none text-ink">{value}</p>
                  </div>
                  <span
                    className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${toneStyles[tone]}`}
                  >
                    <Icon className="size-5" />
                  </span>
                </div>
                <div className="mt-4 flex items-center justify-between gap-3 border-t border-line pt-3 text-[11px]">
                  <span className="text-muted">{hint}</span>
                  <span className="inline-flex items-center gap-1 font-semibold text-primary">
                    Lihat daftar
                    <ArrowUpRight className="size-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                  </span>
                </div>
              </Link>
            ))}
          </div>

          <div className="mt-4 grid gap-4 xl:grid-cols-2">
            <div className="rounded-2xl border border-line bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary-soft/50 text-primary">
                    <ClipboardCheck className="size-5" />
                  </span>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted">
                      Total Pesanan Selesai
                    </p>
                    <p className="mt-1 text-[26px] font-extrabold leading-none text-ink">
                      128{' '}
                      <span className="text-xs font-medium text-muted">transaksi terselesaikan</span>
                    </p>
                  </div>
                </div>
                <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-600">
                  <TrendingUp className="size-3.5" />
                  +14% minggu ini
                </span>
              </div>
              <div className="mt-5 h-2 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full w-[64%] rounded-full bg-primary" />
              </div>
            </div>

            <div className="rounded-2xl border border-line bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary-soft/50 text-primary">
                    <ArrowLeftRight className="size-5" />
                  </span>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted">
                      Total Omzet Terverifikasi
                    </p>
                    <p className="mt-1 text-[26px] font-extrabold leading-none text-ink">
                      Rp 12.450.000
                    </p>
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-slate-400">
                    Rekening
                  </p>
                  <p className="text-[11px] font-bold text-primary">ESCROW</p>
                </div>
              </div>
              <p className="mt-4 flex items-center gap-1.5 border-t border-line pt-3 text-[11px] text-muted">
                <Info className="size-3.5 shrink-0" />
                Hanya menghitung dana pesanan dengan status selesai &amp; lunas.
              </p>
            </div>
          </div>

          <div className="mt-4 grid gap-4 xl:grid-cols-[1.8fr_1fr]">
            <section className="flex h-full flex-col rounded-2xl border border-line bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 className="text-base font-bold text-ink">Tren Pesanan &amp; Omzet</h2>
                  <p className="mt-0.5 text-[11px] text-muted">
                    Dinamika volume transaksi dan pergerakan bruto merchant
                  </p>
                </div>
                <div className="inline-flex shrink-0 items-center rounded-xl bg-slate-100 p-1">
                  <button
                    type="button"
                    onClick={() => setRange('7')}
                    className={`rounded-lg px-3 py-1.5 text-[11px] font-semibold transition ${
                      range === '7' ? 'bg-primary text-white shadow-sm' : 'text-slate-500 hover:text-ink'
                    }`}
                  >
                    7
                  </button>
                  <button
                    type="button"
                    onClick={() => setRange('30')}
                    className={`rounded-lg px-3 py-1.5 text-[11px] font-semibold transition ${
                      range === '30' ? 'bg-primary text-white shadow-sm' : 'text-slate-500 hover:text-ink'
                    }`}
                  >
                    30 Hari
                  </button>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-5 text-[11px] text-muted">
                <span className="inline-flex items-center gap-2">
                  <span className="size-2 rounded-full bg-primary" />
                  Omzet Harian (Juta Rp)
                </span>
                <span className="inline-flex items-center gap-2">
                  <span className="h-0.5 w-4 rounded-full bg-teal-300" />
                  Frekuensi Pesanan
                </span>
              </div>

              <div className="mt-4 flex-1">
                <TrendChart data={trendData} />
              </div>

              <div className="mt-5 grid gap-3 rounded-xl bg-slate-50 px-4 py-3 sm:grid-cols-3">
                <div>
                  <p className="text-[10px] font-medium text-muted">Rata-rata Nilai Order</p>
                  <p className="mt-0.5 text-sm font-bold text-ink">Rp 97.260</p>
                </div>
                <div>
                  <p className="text-[10px] font-medium text-muted">Puncak Penjualan</p>
                  <p className="mt-0.5 text-sm font-bold text-ink">14:00 - 17:30</p>
                </div>
                <div>
                  <p className="text-[10px] font-medium text-muted">Tingkat Retensi Merchant</p>
                  <p className="mt-0.5 text-sm font-bold text-ink">94,8%</p>
                </div>
              </div>
            </section>

            <section className="flex h-full flex-col rounded-2xl border border-line bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-ink">Menunggu Verifikasi</h2>
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[9px] font-bold text-amber-700">
                      {pendingUmkm.length} Antrean
                    </span>
                  </div>
                  <p className="mt-1.5 text-[11px] text-muted">Perlu audit NIB &amp; sampel foto produk.</p>
                </div>
                <ListFilter className="size-4 shrink-0 text-slate-400" />
              </div>

              {pendingUmkm.length === 0 ? (
                <div className="mt-4 flex flex-1 flex-col items-center justify-center rounded-xl border border-dashed border-line bg-slate-50/60 p-8 text-center">
                  <Store className="size-8 text-slate-300" />
                  <p className="mt-3 text-sm font-semibold text-ink">
                    Tidak ada UMKM yang menunggu verifikasi
                  </p>
                  <p className="mt-1 text-[11px] text-muted">Antrean pendaftaran sudah bersih.</p>
                </div>
              ) : (
                <ul className="mt-4 space-y-2.5">
                  {pendingUmkm.map((item) => (
                    <li
                      key={item.slug}
                      className="rounded-xl border border-line bg-slate-50/60 p-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex min-w-0 items-center gap-2.5">
                          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-line bg-white text-primary">
                            <Store className="size-4" />
                          </span>
                          <div className="min-w-0">
                            <p className="truncate text-xs font-bold text-ink">{item.name}</p>
                            <p className="truncate text-[10px] text-muted">{item.category}</p>
                          </div>
                        </div>
                        <span className="shrink-0 rounded-md bg-amber-50 px-1.5 py-1 text-[9px] font-semibold text-amber-700">
                          {item.waiting}
                        </span>
                      </div>
                      <div className="mt-2.5 flex items-center justify-between gap-2">
                        <p className="flex min-w-0 items-center gap-1 text-[10px] text-muted">
                          <User className="size-3 shrink-0" />
                          <span className="truncate">Pemilik: {item.owner}</span>
                        </p>
                        <Link
                          to={`/admin/umkm/${item.slug}`}
                          className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-primary px-2.5 py-1.5 text-[10px] font-semibold text-white transition hover:bg-primary-hover"
                        >
                          Tinjau
                          <ArrowRight className="size-3" />
                        </Link>
                      </div>
                    </li>
                  ))}
                </ul>
              )}

              <div className="mt-auto pt-4">
                <Link
                  to="/admin/umkm?status=pending"
                  className="flex items-center justify-center gap-1.5 rounded-xl border border-line bg-slate-50 px-4 py-2.5 text-[11px] font-semibold text-ink transition hover:bg-slate-100"
                >
                  Buka Semua Antrean Pendaftaran
                  <ArrowUpRight className="size-3.5" />
                </Link>
              </div>
            </section>
          </div>

          <section className="mt-4 overflow-hidden rounded-2xl border border-line bg-white shadow-sm">
            <div className="flex flex-col gap-3 border-b border-line px-5 py-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-base font-bold text-ink">Toko dengan Omzet Tertinggi</h2>
                <p className="mt-0.5 text-[11px] text-muted">
                  Peringkat 5 pedagang teratas berdasarkan akumulasi transaksi lunas bulan November
                  2026
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-2 rounded-lg bg-slate-100 px-3 py-1.5 text-[10px] font-medium text-slate-600">
                  <CalendarDays className="size-3.5" />
                  Periode: 1 Nov - 23 Nov
                </span>
                <button
                  type="button"
                  title="Filter lanjutan segera hadir"
                  className="flex size-8 items-center justify-center rounded-lg border border-line text-slate-500 transition hover:bg-slate-50"
                >
                  <SlidersHorizontal className="size-4" />
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[920px] text-left text-sm">
                <thead>
                  <tr className="bg-slate-50/80 text-[9px] uppercase tracking-[0.08em] text-muted">
                    <th className="px-5 py-3 font-bold">Peringkat</th>
                    <th className="px-5 py-3 font-bold">Nama Toko &amp; Pedagang</th>
                    <th className="px-5 py-3 font-bold">Kategori Industri</th>
                    <th className="px-5 py-3 font-bold">Jumlah Pesanan</th>
                    <th className="px-5 py-3 font-bold">Total Omzet</th>
                    <th className="px-5 py-3 font-bold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {topShops.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-5 py-10 text-center text-xs text-muted">
                        Belum ada data transaksi pada periode ini.
                      </td>
                    </tr>
                  ) : (
                    topShops.map((shop) => (
                      <tr key={shop.rank} className="transition hover:bg-slate-50/60">
                        <td className="px-5 py-3.5">
                          <span
                            className={`flex size-7 items-center justify-center rounded-full text-[10px] font-bold ${
                              shop.rank === 1
                                ? 'bg-amber-100 text-amber-700'
                                : 'bg-slate-100 text-slate-500'
                            }`}
                          >
                            #{shop.rank}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary-soft/40 text-primary">
                              <Store className="size-4" />
                            </span>
                            <div>
                              <p className="text-xs font-semibold text-ink">{shop.name}</p>
                              <p className="mt-0.5 text-[10px] text-muted">
                                {shop.location} • NIB {shop.nib}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="rounded-md bg-slate-100 px-2.5 py-1 text-[10px] font-medium text-slate-600">
                            {shop.category}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-xs text-slate-600">{shop.orders} pesanan</td>
                        <td className="px-5 py-3.5 text-xs font-bold text-ink">
                          {formatRupiah(shop.omzet)}
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold text-emerald-600">
                            <span className="size-1.5 rounded-full bg-emerald-500" />
                            Aktif
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col gap-3 border-t border-line px-5 py-3.5 text-[11px] text-muted sm:flex-row sm:items-center sm:justify-between">
              <p>Menampilkan 5 dari 12 UMKM terdaftar aktif</p>
              <Link
                to="/admin/laporan-keuangan"
                className="inline-flex items-center gap-1.5 font-semibold text-primary transition hover:text-primary-hover"
              >
                Lihat Analisis Penjualan Lengkap
                <ArrowRight className="size-3.5" />
              </Link>
            </div>
          </section>
        </>
      )}
    </div>
  )
}
