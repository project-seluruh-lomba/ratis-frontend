import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Download,
  Filter,
  MessageCircle,
  RotateCcw,
  Search,
  ShieldCheck,
  Store,
} from 'lucide-react'
import AdminToast, { type ToastTone } from '../../components/admin/AdminToast'
import ConfirmDialog from '../../components/admin/ConfirmDialog'
import {
  applyUmkmStatusOverrides,
  persistUmkmStatus,
  umkmRecords,
  type UmkmAvatarTone,
  type UmkmRecord,
  type UmkmStatus,
} from '../../lib/admin-umkm-data'

type StatusFilter = UmkmStatus | 'semua'
type SortOrder = 'terbaru' | 'terlama' | 'nama'
type QuickAction = 'approve' | 'deactivate' | 'activate'
type PendingAction = { type: QuickAction; record: UmkmRecord }
type ToastState = { id: number; message: string; tone: ToastTone }

const statusConfig: Record<UmkmStatus, { label: string; badge: string; dot: string }> = {
  pending: { label: 'Pending', badge: 'bg-amber-50 text-amber-700', dot: 'bg-amber-500' },
  aktif: { label: 'Aktif', badge: 'bg-emerald-50 text-emerald-600', dot: 'bg-emerald-500' },
  ditolak: { label: 'Ditolak', badge: 'bg-red-50 text-red-600', dot: 'bg-red-500' },
  nonaktif: { label: 'Nonaktif', badge: 'bg-slate-100 text-slate-500', dot: 'bg-slate-400' },
}

const avatarStyles: Record<UmkmAvatarTone, string> = {
  teal: 'bg-primary text-white',
  emerald: 'bg-emerald-700 text-white',
  lavender: 'bg-indigo-100 text-indigo-500',
  rose: 'bg-rose-100 text-rose-500',
  slate: 'bg-slate-200 text-slate-500',
}

const filterTabs: { value: StatusFilter; label: string }[] = [
  { value: 'semua', label: 'Semua' },
  { value: 'pending', label: 'Pending' },
  { value: 'aktif', label: 'Aktif' },
  { value: 'ditolak', label: 'Ditolak' },
  { value: 'nonaktif', label: 'Nonaktif' },
]

const countStyles: Record<StatusFilter, string> = {
  semua: 'bg-slate-900 text-white',
  pending: 'bg-amber-100 text-amber-700',
  aktif: 'bg-emerald-100 text-emerald-700',
  ditolak: 'bg-red-100 text-red-600',
  nonaktif: 'bg-slate-200 text-slate-600',
}

function parseStatus(value: string | null): StatusFilter {
  if (value === 'pending' || value === 'aktif' || value === 'ditolak' || value === 'nonaktif') {
    return value
  }
  return 'semua'
}

function getInitials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')
}

function formatDate(isoDate: string) {
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'Asia/Jakarta',
  }).format(new Date(isoDate))
}

function formatTime(isoDate: string) {
  const time = new Intl.DateTimeFormat('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'Asia/Jakarta',
  }).format(new Date(isoDate))

  return `${time} WIB`
}

function TableSkeleton() {
  return (
    <div className="space-y-2.5 p-5">
      {Array.from({ length: 8 }).map((_, index) => (
        <div key={index} className="flex items-center gap-4">
          <div className="size-11 shrink-0 animate-pulse rounded-xl bg-slate-200/70" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-44 animate-pulse rounded bg-slate-200/70" />
            <div className="h-2.5 w-28 animate-pulse rounded bg-slate-200/70" />
          </div>
          <div className="hidden h-3 w-32 animate-pulse rounded bg-slate-200/70 md:block" />
          <div className="hidden h-3 w-24 animate-pulse rounded bg-slate-200/70 lg:block" />
          <div className="h-7 w-20 animate-pulse rounded-lg bg-slate-200/70" />
        </div>
      ))}
    </div>
  )
}

export default function AdminUmkmListPage() {
  const [searchParams, setSearchParams] = useSearchParams()

  const [records, setRecords] = useState<UmkmRecord[]>(() =>
    applyUmkmStatusOverrides(umkmRecords),
  )
  const [statusFilter, setStatusFilter] = useState<StatusFilter>(() =>
    parseStatus(searchParams.get('status')),
  )
  const [searchInput, setSearchInput] = useState(() => searchParams.get('cari') ?? '')
  const [debouncedQuery, setDebouncedQuery] = useState(() => searchParams.get('cari') ?? '')
  const [sortOrder, setSortOrder] = useState<SortOrder>('terbaru')
  const [page, setPage] = useState(() => {
    const raw = Number(searchParams.get('halaman') ?? '1')
    return Number.isFinite(raw) && raw > 0 ? Math.floor(raw) : 1
  })
  const [pageSize, setPageSize] = useState(10)
  const [loading, setLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const [toast, setToast] = useState<ToastState | null>(null)
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null)
  const [reason, setReason] = useState('')

  useEffect(() => {
    const timer = window.setTimeout(() => setLoading(false), 600)
    return () => window.clearTimeout(timer)
  }, [])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedQuery(searchInput)
      setPage(1)
    }, 300)

    return () => window.clearTimeout(timer)
  }, [searchInput])

  useEffect(() => {
    const params = new URLSearchParams()
    if (statusFilter !== 'semua') params.set('status', statusFilter)
    const keyword = debouncedQuery.trim()
    if (keyword) params.set('cari', keyword)
    if (page > 1) params.set('halaman', String(page))
    setSearchParams(params, { replace: true })
  }, [statusFilter, debouncedQuery, page, setSearchParams])

  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => setToast(null), 4000)
    return () => window.clearTimeout(timer)
  }, [toast])

  function showToast(message: string, tone: ToastTone) {
    setToast({ id: Date.now(), message, tone })
  }

  const counts = useMemo<Record<StatusFilter, number>>(
    () => ({
      semua: records.length,
      pending: records.filter((record) => record.status === 'pending').length,
      aktif: records.filter((record) => record.status === 'aktif').length,
      ditolak: records.filter((record) => record.status === 'ditolak').length,
      nonaktif: records.filter((record) => record.status === 'nonaktif').length,
    }),
    [records],
  )

  const filteredRecords = useMemo(() => {
    const keyword = debouncedQuery.trim().toLowerCase()

    return records
      .filter((record) => statusFilter === 'semua' || record.status === statusFilter)
      .filter(
        (record) =>
          !keyword ||
          record.name.toLowerCase().includes(keyword) ||
          record.owner.toLowerCase().includes(keyword),
      )
      .sort((first, second) => {
        if (sortOrder === 'nama') return first.name.localeCompare(second.name, 'id')
        const firstTime = new Date(first.registeredAt).getTime()
        const secondTime = new Date(second.registeredAt).getTime()
        return sortOrder === 'terbaru' ? secondTime - firstTime : firstTime - secondTime
      })
  }, [records, statusFilter, debouncedQuery, sortOrder])

  const totalResults = filteredRecords.length
  const pageCount = Math.max(1, Math.ceil(totalResults / pageSize))
  const safePage = Math.min(page, pageCount)
  const startIndex = totalResults === 0 ? 0 : (safePage - 1) * pageSize + 1
  const endIndex = Math.min(safePage * pageSize, totalResults)
  const visibleRecords = filteredRecords.slice((safePage - 1) * pageSize, safePage * pageSize)
  const filtersActive =
    searchInput.trim() !== '' || statusFilter !== 'semua' || sortOrder !== 'terbaru'

  function handleStatusChange(nextStatus: StatusFilter) {
    setStatusFilter(nextStatus)
    setPage(1)
  }

  function handleResetFilters() {
    setSearchInput('')
    setDebouncedQuery('')
    setStatusFilter('semua')
    setSortOrder('terbaru')
    setPage(1)
  }

  function handlePageSizeChange(nextSize: number) {
    setPageSize(nextSize)
    setPage(1)
  }

  function handleExport() {
    const header = [
      'Nama Toko',
      'Slug',
      'Pemilik',
      'Email',
      'Kontak WhatsApp',
      'Tanggal Registrasi',
      'Status',
    ]
    const rows = filteredRecords.map((record) => [
      record.name,
      record.slug,
      record.owner,
      record.email,
      record.phone,
      `${formatDate(record.registeredAt)} ${formatTime(record.registeredAt)}`,
      statusConfig[record.status].label,
    ])
    const csv = [header, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n')

    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'daftar-umkm-ratis.csv'
    link.click()
    URL.revokeObjectURL(url)
    showToast(`${filteredRecords.length} data UMKM berhasil diekspor.`, 'success')
  }

  function openAction(type: QuickAction, record: UmkmRecord) {
    setPendingAction({ type, record })
    setReason('')
  }

  function closeAction() {
    setPendingAction(null)
    setReason('')
  }

  function handleConfirmAction() {
    if (!pendingAction) return
    if (pendingAction.type === 'deactivate' && reason.trim().length < 10) return

    const { type, record } = pendingAction
    const nextStatus: UmkmStatus = type === 'deactivate' ? 'nonaktif' : 'aktif'

    persistUmkmStatus(record.slug, nextStatus)
    setRecords((current) =>
      current.map((item) => (item.slug === record.slug ? { ...item, status: nextStatus } : item)),
    )

    if (type === 'approve') {
      showToast(`${record.name} disetujui dan sekarang tampil di storefront.`, 'success')
    } else if (type === 'deactivate') {
      showToast(`${record.name} dinonaktifkan dan tidak tampil di storefront.`, 'info')
    } else {
      showToast(`${record.name} berhasil diaktifkan kembali.`, 'success')
    }

    closeAction()
  }

  const pendingCount = counts.pending
  const actionConfig = pendingAction
    ? pendingAction.type === 'approve'
      ? {
          title: 'Setujui UMKM ini?',
          description: `${pendingAction.record.name} akan langsung tampil di storefront Ratis dan dapat menerima pesanan dari pelanggan.`,
          confirmLabel: 'Setujui UMKM',
          tone: 'primary' as const,
        }
      : pendingAction.type === 'deactivate'
        ? {
            title: 'Nonaktifkan toko ini?',
            description: `${pendingAction.record.name} akan hilang dari storefront publik dan tidak menerima pesanan baru. Data toko tetap tersimpan.`,
            confirmLabel: 'Nonaktifkan Toko',
            tone: 'danger' as const,
          }
        : {
            title: 'Aktifkan kembali toko?',
            description: `${pendingAction.record.name} akan tampil kembali di storefront Ratis dan dapat menerima pesanan dari pelanggan.`,
            confirmLabel: 'Aktifkan Toko',
            tone: 'primary' as const,
          }
    : null

  return (
    <div>
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <div className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.16em] text-muted">
            <span>Manajemen Entitas</span>
            <span className="text-slate-300">/</span>
            <span>Pangkalan Data UMKM</span>
          </div>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-ink">Kelola UMKM</h1>
          <p className="mt-1.5 max-w-2xl text-xs leading-relaxed text-muted">
            Verifikasi pendaftar baru dan kelola operasional seluruh toko UMKM terdaftar di ekosistem
            Ratis.
          </p>
        </div>

        <div className="flex shrink-0 flex-col gap-2 rounded-2xl border border-line bg-white p-3 shadow-sm sm:flex-row sm:items-center sm:p-4">
          <div className="flex items-center gap-2.5">
            <span className="size-2 rounded-full bg-amber-500" />
            <div>
              <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-muted">
                Perlu Tindakan
              </p>
              <p className="mt-0.5 text-xs font-bold text-ink">{pendingCount} UMKM Menunggu</p>
            </div>
          </div>
          <span className="hidden h-9 w-px bg-line sm:block" />
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="size-4 shrink-0 text-emerald-600" />
            <p className="text-xs font-semibold text-ink">Validitas NIB Terhubung OSS</p>
          </div>
        </div>
      </div>

      <section className="mt-4 rounded-2xl bg-[#f3f4fa] p-3.5">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
          <div className="relative w-full xl:w-[330px] xl:shrink-0">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 size-3.5 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Cari nama toko atau nama pemilik..."
              className="h-10 w-full rounded-xl border border-line bg-white pl-9 pr-3 text-xs text-ink outline-none transition placeholder:text-slate-400 focus:border-primary focus:ring-4 focus:ring-primary/10"
            />
          </div>

          <div className="flex flex-1 flex-wrap items-center gap-1">
            {filterTabs.map((tab) => {
              const active = statusFilter === tab.value
              return (
                <button
                  key={tab.value}
                  type="button"
                  onClick={() => handleStatusChange(tab.value)}
                  className={`inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-[11px] transition ${
                    active
                      ? 'bg-white font-bold text-ink shadow-sm'
                      : 'font-medium text-slate-500 hover:bg-white/60 hover:text-ink'
                  }`}
                >
                  {tab.label}
                  <span
                    className={`rounded-full px-1.5 py-0.5 text-[9px] font-bold ${countStyles[tab.value]}`}
                  >
                    {counts[tab.value]}
                  </span>
                </button>
              )
            })}
          </div>

          <div className="flex items-center gap-1 xl:ml-auto">
            <button
              type="button"
              onClick={handleResetFilters}
              disabled={!filtersActive}
              className="inline-flex h-10 items-center gap-1.5 rounded-xl px-3 text-[11px] font-semibold text-slate-500 transition hover:bg-white/70 hover:text-ink disabled:cursor-not-allowed disabled:opacity-40"
            >
              <RotateCcw className="size-3.5" />
              Reset Filter
            </button>
            <button
              type="button"
              onClick={handleExport}
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#e7e9f5] px-3.5 text-[11px] font-semibold text-slate-700 transition hover:bg-[#dde0f0]"
            >
              <Download className="size-4" />
              Ekspor CSV
            </button>
          </div>
        </div>

        <div className="mt-3 flex flex-col gap-2 border-t border-white/70 pt-3 text-[10px] text-muted sm:flex-row sm:items-center sm:justify-between">
          <p className="flex items-center gap-1.5">
            <Filter className="size-3.5" />
            Menampilkan {startIndex}-{endIndex} dari {totalResults} UMKM
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <label className="flex items-center gap-1.5">
              Urutan:
              <select
                value={sortOrder}
                onChange={(event) => {
                  setSortOrder(event.target.value as SortOrder)
                  setPage(1)
                }}
                className="cursor-pointer bg-transparent text-[10px] font-bold text-ink outline-none"
              >
                <option value="terbaru">Pendaftaran Terbaru</option>
                <option value="terlama">Pendaftaran Terlama</option>
                <option value="nama">Nama Toko A-Z</option>
              </select>
            </label>
            <span className="size-1 rounded-full bg-slate-300" />
            <span>Zona Waktu: WIB (UTC+7)</span>
          </div>
        </div>
      </section>

      <section className="mt-4 overflow-hidden rounded-2xl border border-line bg-white shadow-sm">
        {loading ? (
          <TableSkeleton />
        ) : hasError ? (
          <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
            <AlertTriangle className="size-8 text-red-400" />
            <h2 className="mt-3 text-sm font-bold text-ink">Gagal memuat data</h2>
            <p className="mt-1 text-xs text-muted">Periksa koneksi lalu coba lagi.</p>
            <button
              type="button"
              onClick={() => {
                setHasError(false)
                setLoading(true)
                window.setTimeout(() => setLoading(false), 600)
              }}
              className="mt-4 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-white transition hover:bg-primary-hover"
            >
              Coba lagi
            </button>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1000px] text-left">
                <thead>
                  <tr className="bg-[#f4f5fa] text-[9px] uppercase tracking-[0.08em] text-muted">
                    <th className="px-5 py-3.5 font-bold">Nama Toko &amp; Identitas</th>
                    <th className="px-5 py-3.5 font-bold">Pemilik &amp; Akun</th>
                    <th className="px-5 py-3.5 font-bold">Kontak WhatsApp</th>
                    <th className="px-5 py-3.5 font-bold">Tanggal Registrasi</th>
                    <th className="px-5 py-3.5 font-bold">Status</th>
                    <th className="px-5 py-3.5 text-right font-bold">Tindakan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {visibleRecords.length === 0 ? (
                    <tr>
                      <td colSpan={6}>
                        <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
                          <span className="flex size-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                            <Store className="size-5" />
                          </span>
                          <h2 className="mt-3 text-sm font-bold text-ink">
                            Tidak ada UMKM yang cocok
                          </h2>
                          <p className="mt-1 text-xs text-muted">
                            Coba ubah kata kunci atau reset filter pencarian.
                          </p>
                          <button
                            type="button"
                            onClick={handleResetFilters}
                            className="mt-4 rounded-xl border border-line bg-white px-4 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
                          >
                            Reset filter
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    visibleRecords.map((record) => {
                      const status = statusConfig[record.status]

                      return (
                        <tr key={record.slug} className="transition hover:bg-slate-50/60">
                          <td
                            className={`border-l-2 px-5 py-3.5 ${
                              record.status === 'pending'
                                ? 'border-l-amber-400'
                                : 'border-l-transparent'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <span
                                className={`flex size-11 shrink-0 items-center justify-center rounded-xl text-xs font-bold ${avatarStyles[record.avatarTone]}`}
                              >
                                {getInitials(record.name)}
                              </span>
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <p className="truncate text-xs font-bold text-ink">
                                    {record.name}
                                  </p>
                                  {record.isNew && record.status === 'pending' && (
                                    <span className="shrink-0 rounded border border-amber-300 bg-amber-50 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wide text-amber-700">
                                      Baru
                                    </span>
                                  )}
                                </div>
                                <p className="mt-0.5 text-[10px] text-muted">{record.slug}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-3.5">
                            <p className="text-xs font-semibold text-ink">{record.owner}</p>
                            <p className="mt-0.5 text-[10px] text-muted">{record.email}</p>
                          </td>
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-2 text-xs text-slate-600">
                              <MessageCircle className="size-3.5 shrink-0 text-emerald-500" />
                              <span className="whitespace-nowrap">{record.phone}</span>
                            </div>
                          </td>
                          <td className="px-5 py-3.5">
                            <p className="text-xs text-slate-600">
                              {formatDate(record.registeredAt)}
                            </p>
                            <p className="mt-0.5 text-[10px] text-muted">
                              {formatTime(record.registeredAt)}
                            </p>
                          </td>
                          <td className="px-5 py-3.5">
                            <span
                              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold ${status.badge}`}
                            >
                              <span className={`size-1.5 rounded-full ${status.dot}`} />
                              {status.label}
                            </span>
                          </td>
                          <td className="px-5 py-3.5">
                            <div className="flex items-center justify-end gap-2">
                              {record.status === 'pending' && (
                                <button
                                  type="button"
                                  onClick={() => openAction('approve', record)}
                                  className="rounded-lg bg-primary px-3 py-1.5 text-[10px] font-semibold text-white transition hover:bg-primary-hover"
                                >
                                  Setujui
                                </button>
                              )}
                              {record.status === 'aktif' && (
                                <button
                                  type="button"
                                  onClick={() => openAction('deactivate', record)}
                                  className="px-1 text-[10px] font-semibold text-slate-600 transition hover:text-red-600 hover:underline"
                                >
                                  Nonaktifkan
                                </button>
                              )}
                              {record.status === 'ditolak' && (
                                <Link
                                  to={`/admin/umkm/detail/${record.slug}`}
                                  className="px-1 text-[10px] font-semibold text-primary transition hover:underline"
                                >
                                  Tinjau Ulang
                                </Link>
                              )}
                              {record.status === 'nonaktif' && (
                                <button
                                  type="button"
                                  onClick={() => openAction('activate', record)}
                                  className="px-1 text-[10px] font-semibold text-primary transition hover:underline"
                                >
                                  Aktifkan
                                </button>
                              )}
                              <Link
                                to={`/admin/umkm/detail/${record.slug}`}
                                className="rounded-lg bg-slate-100 px-3 py-1.5 text-[10px] font-semibold text-slate-600 transition hover:bg-slate-200"
                              >
                                Detail
                              </Link>
                            </div>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col gap-3 border-t border-line px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-muted">
                Menampilkan
                <select
                  value={pageSize}
                  onChange={(event) => handlePageSizeChange(Number(event.target.value))}
                  className="h-7 rounded-lg border border-line bg-white px-1.5 text-[10px] font-semibold text-slate-600 outline-none focus:border-primary"
                >
                  {[5, 10, 25].map((size) => (
                    <option key={size} value={size}>
                      {size}
                    </option>
                  ))}
                </select>
                per halaman
                <span className="mx-1 text-slate-300">•</span>
                Halaman <span className="font-semibold text-ink">{safePage}</span> dari {pageCount}
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setPage(Math.max(1, safePage - 1))}
                  disabled={safePage <= 1}
                  className="inline-flex h-8 items-center gap-1 rounded-lg px-2.5 text-[10px] font-semibold text-slate-500 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-300"
                >
                  <ChevronLeft className="size-3.5" />
                  Sebelumnya
                </button>
                {Array.from({ length: pageCount }, (_, index) => index + 1).map((pageNumber) => (
                  <button
                    key={pageNumber}
                    type="button"
                    onClick={() => setPage(pageNumber)}
                    className={`flex size-8 items-center justify-center rounded-lg text-[10px] font-semibold transition ${
                      pageNumber === safePage
                        ? 'bg-primary text-white'
                        : 'border border-line bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {pageNumber}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setPage(Math.min(pageCount, safePage + 1))}
                  disabled={safePage >= pageCount}
                  className="inline-flex h-8 items-center gap-1 rounded-lg px-2.5 text-[10px] font-semibold text-slate-500 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-300"
                >
                  Berikutnya
                  <ChevronRight className="size-3.5" />
                </button>
              </div>
            </div>
          </>
        )}
      </section>

      <ConfirmDialog
        open={Boolean(pendingAction)}
        title={actionConfig?.title ?? ''}
        description={actionConfig?.description ?? ''}
        confirmLabel={actionConfig?.confirmLabel ?? 'Konfirmasi'}
        tone={actionConfig?.tone}
        confirmDisabled={
          pendingAction?.type === 'deactivate' ? reason.trim().length < 10 : false
        }
        onConfirm={handleConfirmAction}
        onClose={closeAction}
      >
        {pendingAction?.type === 'deactivate' && (
          <div>
            <label htmlFor="deactivate-reason" className="mb-1.5 block text-xs font-semibold text-ink">
              Alasan penonaktifan <span className="text-red-500">*</span>
            </label>
            <textarea
              id="deactivate-reason"
              rows={3}
              maxLength={300}
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="Tuliskan alasan minimal 10 karakter..."
              className="w-full resize-none rounded-xl border border-line bg-white px-3 py-2.5 text-xs text-ink outline-none transition placeholder:text-slate-400 focus:border-primary focus:ring-4 focus:ring-primary/10"
            />
            <div className="mt-1.5 flex items-center justify-between gap-3 text-[10px]">
              <span className={reason.trim().length < 10 ? 'text-red-500' : 'text-muted'}>
                Wajib diisi 10-300 karakter.
              </span>
              <span className="text-muted">{reason.length}/300</span>
            </div>
          </div>
        )}
      </ConfirmDialog>

      {toast && (
        <AdminToast
          key={toast.id}
          message={toast.message}
          tone={toast.tone}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  )
}
