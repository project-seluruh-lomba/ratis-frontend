import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
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
  Store,
  TrendingUp,
  User,
  XCircle,
  type LucideIcon,
} from 'lucide-react'
import TrendChart from '../../components/admin/TrendChart'
import { dashboardApi } from '../../lib/api/services'
import { getAdminSession } from '../../lib/auth'

type StatusTone = 'amber' | 'teal' | 'red' | 'slate'

const toneStyles: Record<StatusTone, string> = {
  amber: 'bg-amber-50 text-amber-500',
  teal: 'bg-primary-soft/50 text-primary',
  red: 'bg-red-50 text-red-500',
  slate: 'bg-slate-100 text-slate-500',
}

function formatRupiah(value: number) {
  return `Rp ${value.toLocaleString('id-ID')}`
}

function formatCompactRupiah(value: number) {
  if (value >= 1_000_000_000) return `Rp ${(value / 1_000_000_000).toFixed(1).replace('.', ',')} Miliar`
  if (value >= 1_000_000) return `Rp ${(value / 1_000_000).toFixed(1).replace('.', ',')} Juta`
  return formatRupiah(value)
}

function formatDateLabel(dateStr: string, isLast: boolean) {
  if (isLast) return 'Hari Ini'
  const d = new Date(dateStr)
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins} menit lalu`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours} jam lalu`
  const days = Math.floor(hours / 24)
  return `${days} hari lalu`
}

function SkeletonLine({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-slate-200/70 ${className}`} />
}

function DashboardSkeleton() {
  return (
    <div className="mt-4 space-y-4">
      <p className="text-center text-xs font-medium text-muted">Menyiapkan data, mohon tunggu</p>
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
  const [clock] = useState(() => {
    const now = new Date()
    const hour = now.getHours()
    return {
      greeting: hour < 11 ? 'Selamat pagi' : hour < 15 ? 'Selamat siang' : hour < 19 ? 'Selamat sore' : 'Selamat malam',
      dateLabel: new Intl.DateTimeFormat('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(now),
    }
  })

  const { data, isLoading, isError, error, refetch, dataUpdatedAt } = useQuery({
    queryKey: ['admin-dashboard', range],
    queryFn: () => dashboardApi.get(Number(range) as 7 | 30),
  })

  const lastUpdated = dataUpdatedAt
    ? new Date(dataUpdatedAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB'
    : 'memuat...'

  const shops = data?.shops
  const umkmStats: { label: string; value: number; hint: string; href: string; icon: LucideIcon; tone: StatusTone }[] = [
    { label: 'Menunggu Review', value: shops?.pending ?? 0, hint: 'Perlu tindakan admin', href: '/admin/umkm?status=pending', icon: ClipboardList, tone: 'amber' },
    { label: 'UMKM Terverifikasi', value: shops?.aktif ?? 0, hint: 'Tampil di storefront', href: '/admin/umkm?status=aktif', icon: BadgeCheck, tone: 'teal' },
    { label: 'Permohonan Ditolak', value: shops?.ditolak ?? 0, hint: 'Dapat diajukan ulang', href: '/admin/umkm?status=ditolak', icon: XCircle, tone: 'red' },
    { label: 'Toko Nonaktif', value: shops?.nonaktif ?? 0, hint: 'Disembunyikan dari publik', href: '/admin/umkm?status=nonaktif', icon: Ban, tone: 'slate' },
  ]

  const trendData = (data?.trend ?? []).map((t, i, arr) => ({
    label: formatDateLabel(t.date, i === arr.length - 1),
    omzet: t.omzet,
    orders: t.orders,
  }))

  const pendingList = data?.pendingUmkm ?? []
  const topShopsData = (data?.topShops ?? []).map((s, i) => ({
    rank: i + 1, id: s.shopId, name: s.name, slug: s.slug, ownerName: s.ownerName, omzet: s.omzet, orders: s.completedOrders,
  }))

  function handleDownloadRecap() {
    const header = ['Peringkat', 'Nama Toko', 'Pemilik', 'Slug', 'Jumlah Pesanan Selesai', 'Total Omzet']
    const rows = topShopsData.map((shop) => [shop.rank, shop.name, shop.ownerName, shop.slug, shop.orders, shop.omzet])
    const csv = [header, ...rows].map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `rekap-umkm-ratis-${range}hari.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  const adminFirstName = session?.name.split(' ')[0] ?? 'Admin'
  const totalOrders = data?.totalOrders ?? 0
  const completedOrders = data?.completedOrders ?? 0
  const totalOmzet = data?.omzet ?? 0

  return (
    <div>
      <section className="rounded-2xl border border-line bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-primary">Ringkasan Eksekutif</span>
            <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-ink">{clock.greeting}, {adminFirstName}</h1>
            <p className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-muted">
              <CalendarDays className="size-3.5" />
              {clock.dateLabel}
              <span className="text-slate-300">•</span>
              Pembaruan terakhir {lastUpdated}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            <button type="button" onClick={() => refetch()} disabled={isLoading} className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-line bg-white px-4 text-xs font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60">
              <RefreshCw className={`size-4 ${isLoading ? 'animate-spin' : ''}`} />
              Muat ulang
            </button>
            <button type="button" onClick={handleDownloadRecap} className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-xs font-semibold text-white transition hover:bg-primary-hover">
              <Download className="size-4" />
              Unduh Rekap
            </button>
          </div>
        </div>
      </section>

      <section className="mt-4 flex flex-col gap-4 rounded-2xl border border-amber-200 bg-[#fffbeb] p-4 sm:p-5 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex items-start gap-3.5">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-600"><ShieldAlert className="size-5" /></span>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-sm font-bold text-ink sm:text-base">{shops?.pending ?? 0} UMKM menunggu verifikasi</h2>
              <span className="rounded-full bg-amber-200/70 px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.08em] text-amber-900">Prioritas Tinggi</span>
            </div>
            <p className="mt-1 max-w-3xl text-xs leading-relaxed text-amber-900/80">Tinjau pendaftaran baru agar toko dapat segera tampil di storefront dan menerima pesanan dari pelanggan.</p>
          </div>
        </div>
        <Link to="/admin/umkm?status=pending" className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl bg-[#57402f] px-4 text-xs font-semibold text-amber-50 transition hover:bg-[#463326] xl:self-center">
          Tinjau sekarang
          <ArrowRight className="size-4" />
        </Link>
      </section>

      {isLoading ? (
        <DashboardSkeleton />
      ) : isError ? (
        <div className="mt-4 rounded-2xl border border-red-200 bg-white p-10 text-center shadow-sm">
          <h2 className="text-base font-bold text-ink">Gagal memuat dashboard</h2>
          <p className="mt-1 text-xs leading-relaxed text-muted">
            {error instanceof Error ? error.message : 'Periksa koneksi lalu coba lagi.'}
          </p>
          <button
            type="button"
            onClick={() => refetch()}
            className="mt-4 inline-flex h-9 items-center gap-2 rounded-xl bg-primary px-4 text-xs font-semibold text-white transition hover:bg-primary-hover"
          >
            <RefreshCw className="size-3.5" />
            Coba lagi
          </button>
        </div>
      ) : (
        <>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {umkmStats.map(({ label, value, hint, href, icon: Icon, tone }) => (
              <Link key={label} to={href} className="group rounded-2xl border border-line bg-white p-5 shadow-sm transition hover:border-primary/30 hover:shadow-md">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted">{label}</p>
                    <p className="mt-1.5 text-3xl font-extrabold leading-none text-ink">{value}</p>
                  </div>
                  <span className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${toneStyles[tone]}`}><Icon className="size-5" /></span>
                </div>
                <div className="mt-4 flex items-center justify-between gap-3 border-t border-line pt-3 text-[11px]">
                  <span className="text-muted">{hint}</span>
                  <span className="inline-flex items-center gap-1 font-semibold text-primary">Lihat daftar <ArrowUpRight className="size-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" /></span>
                </div>
              </Link>
            ))}
          </div>

          <div className="mt-4 grid gap-4 xl:grid-cols-2">
            <div className="rounded-2xl border border-line bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary-soft/50 text-primary"><ClipboardCheck className="size-5" /></span>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted">Total Pesanan</p>
                    <p className="mt-1 text-[26px] font-extrabold leading-none text-ink">{totalOrders} <span className="text-xs font-medium text-muted">{completedOrders} selesai</span></p>
                  </div>
                </div>
                <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-600"><TrendingUp className="size-3.5" />Data platform</span>
              </div>

            </div>

            <div className="rounded-2xl border border-line bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary-soft/50 text-primary"><ArrowLeftRight className="size-5" /></span>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted">Total Omzet</p>
                    <p className="mt-1 text-[26px] font-extrabold leading-none text-ink">{formatCompactRupiah(totalOmzet)}</p>
                  </div>
                </div>
                <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-600"><TrendingUp className="size-3.5" />Pesanan selesai</span>
              </div>

            </div>
          </div>

          <div className="mt-4 grid gap-4 xl:grid-cols-[1.8fr_1fr]">
            <section className="rounded-2xl border border-line bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 className="flex items-center gap-2 text-base font-bold text-ink"><ListFilter className="size-4 text-primary" />Tren Aktivitas Pasar</h2>
                  <p className="mt-1 text-[11px] text-muted">Pantauan akumulasi pesanan dan omzet harian platform.</p>
                </div>
                <div className="inline-flex shrink-0 items-center rounded-xl bg-slate-100 p-1">
                  <button type="button" onClick={() => setRange('7')} className={`rounded-lg px-4 py-1.5 text-[11px] font-semibold transition ${range === '7' ? 'bg-primary text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>7 Hari</button>
                  <button type="button" onClick={() => setRange('30')} className={`rounded-lg px-4 py-1.5 text-[11px] font-semibold transition ${range === '30' ? 'bg-primary text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>30 Hari</button>
                </div>
              </div>
              <TrendChart data={trendData} />
              <div className="mt-5 grid gap-3 border-t border-line pt-4 sm:grid-cols-3 sm:gap-0">
                <div className="sm:pr-4"><p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted">Rata-rata Pesanan</p><p className="mt-1 text-sm font-bold text-ink">{trendData.length ? Math.round(trendData.reduce((a,b)=>a+b.orders,0)/trendData.length) : 0} pesanan / hari</p></div>
                <div className="border-slate-200 sm:border-l sm:px-4"><p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted">Puncak Omzet</p><p className="mt-1 text-sm font-bold text-primary">{formatRupiah(Math.max(0, ...trendData.map(t=>t.omzet)))}</p></div>
                <div className="border-slate-200 sm:border-l sm:pl-4"><p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted">Total Omzet</p><p className="mt-1 text-sm font-bold text-ink">{formatRupiah(totalOmzet)}</p></div>
              </div>
            </section>

            <section className="rounded-2xl border border-line bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="flex items-center gap-2 text-base font-bold text-ink"><Info className="size-4 text-primary" />UMKM Perlu Direview</h2>
                  <p className="mt-1 text-[11px] text-muted">Pendaftaran baru menunggu tindakan admin.</p>
                </div>
                <span className="rounded-full bg-primary-soft/40 px-2.5 py-1 text-[10px] font-bold text-primary">{shops?.pending ?? 0} menunggu</span>
              </div>
              <div className="mt-4 space-y-3">
                {pendingList.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-line p-4 text-center text-xs text-muted">Tidak ada UMKM yang menunggu verifikasi.</p>
                ) : pendingList.map((umkm) => (
                  <article key={umkm.id} className="rounded-xl border border-line p-3.5 transition hover:border-primary/30 hover:bg-slate-50/40">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-start gap-3">
                        <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500"><Store className="size-4" /></span>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold text-ink">{umkm.name}</p>
                          <p className="mt-0.5 truncate text-[11px] text-muted">{umkm.ownerName}</p>
                        </div>
                      </div>
                      <span className="shrink-0 text-[10px] font-medium italic text-slate-400">{timeAgo(umkm.createdAt)}</span>
                    </div>
                    <div className="mt-3 flex items-center justify-between gap-3 border-t border-line pt-3 pl-11">
                      <span className="inline-flex items-center gap-1.5 text-[11px] text-muted"><User className="size-3.5" />{umkm.ownerName}</span>
                      <Link to={`/admin/umkm/${umkm.id}`} className="inline-flex items-center gap-1 rounded-lg border border-primary/25 bg-primary-soft/20 px-3 py-1.5 text-[11px] font-semibold text-primary transition hover:bg-primary-soft/40">Tinjau <ArrowUpRight className="size-3.5" /></Link>
                    </div>
                  </article>
                ))}
              </div>
              <Link to="/admin/umkm?status=pending" className="mt-4 flex h-10 items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 text-xs font-semibold text-slate-600 transition hover:border-primary/40 hover:bg-primary-soft/20 hover:text-primary">Lihat Semua Antrean <ArrowRight className="size-4" /></Link>
            </section>
          </div>

          <section className="mt-4 overflow-hidden rounded-2xl border border-line bg-white shadow-sm">
            <div className="flex flex-col gap-4 border-b border-line px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-base font-bold text-ink">Performa UMKM Teratas</h2>
                <p className="mt-1 text-[11px] text-muted">5 toko dengan omzet pesanan selesai tertinggi pada {range} hari terakhir.</p>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-[760px] w-full text-left">
                <thead className="bg-slate-50/70">
                  <tr className="border-b border-line text-[10px] font-bold uppercase tracking-[0.12em] text-muted">
                    <th className="px-5 py-3">Nama Toko &amp; Pemilik</th>
                    <th className="px-5 py-3">Pesanan Selesai</th>
                    <th className="px-5 py-3">Total Omzet</th>
                    <th className="px-5 py-3 text-right">Detail</th>
                  </tr>
                </thead>
                <tbody>
                  {topShopsData.length === 0 ? (
                    <tr><td colSpan={4} className="px-5 py-8 text-center text-sm text-muted">Belum ada data omzet.</td></tr>
                  ) : topShopsData.map((shop) => (
                    <tr key={shop.id} className="border-b border-line text-[13px] last:border-b-0 hover:bg-slate-50/40">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary-soft/40 text-xs font-bold text-primary">{shop.rank}</span>
                          <div>
                            <p className="font-semibold text-ink">{shop.name}</p>
                            <p className="text-[11px] text-muted">{shop.ownerName} • {shop.slug}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 font-semibold text-slate-600">{shop.orders}</td>
                      <td className="px-5 py-3.5 font-bold text-ink">{formatRupiah(shop.omzet)}</td>
                      <td className="px-5 py-3.5 text-right">
                        <Link
                          to={`/admin/umkm/${shop.id}`}
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:text-primary-hover"
                        >
                          Tinjau <ArrowUpRight className="size-3.5" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex flex-col gap-3 border-t border-line bg-slate-50/50 px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-[11px] text-muted">Menampilkan <span className="font-semibold text-slate-700">{topShopsData.length}</span> toko beromzet tertinggi.</p>
              <div className="flex items-center gap-5">
                <Link to="/admin/umkm?status=aktif" className="inline-flex items-center gap-1.5 text-[11px] font-bold text-primary transition hover:text-primary-hover">Buka Direktori UMKM <ArrowRight className="size-3.5" /></Link>
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  )
}
