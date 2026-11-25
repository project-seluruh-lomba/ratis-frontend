import { useCallback, useEffect, useMemo, useState } from 'react'
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
  Store,
} from 'lucide-react'
import AdminToast, { type ToastTone } from '../../components/admin/AdminToast'
import ConfirmDialog from '../../components/admin/ConfirmDialog'
import {
  approveUmkm,
  fetchUmkmRecords,
  setUmkmStatus,
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
  if (value === 'pending' || value === 'aktif' || value === 'ditolak' || value === 'nonaktif') return value
  return 'semua'
}

function getInitials(name: string) {
  return name.split(' ').filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('')
}

function formatDate(isoDate: string) {
  return new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'Asia/Jakarta' }).format(new Date(isoDate))
}

function formatTime(isoDate: string) {
  const time = new Intl.DateTimeFormat('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Jakarta' }).format(new Date(isoDate))
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
  const [records, setRecords] = useState<UmkmRecord[]>([])
  const [statusFilter, setStatusFilter] = useState<StatusFilter>(() => parseStatus(searchParams.get('status')))
  const [searchInput, setSearchInput] = useState(() => searchParams.get('cari') ?? '')
  const [debouncedQuery, setDebouncedQuery] = useState(() => searchParams.get('cari') ?? '')
  const [sortOrder, setSortOrder] = useState<SortOrder>('terbaru')
  const [page, setPage] = useState(() => { const raw = Number(searchParams.get('halaman') ?? '1'); return Number.isFinite(raw) && raw > 0 ? Math.floor(raw) : 1 })
  const [pageSize, setPageSize] = useState(10)
  const [loading, setLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const [toast, setToast] = useState<ToastState | null>(null)
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null)
  const [reason, setReason] = useState('')
  const [counts, setCounts] = useState<Record<StatusFilter, number>>({ semua: 0, pending: 0, aktif: 0, ditolak: 0, nonaktif: 0 })
  const [total, setTotal] = useState(0)

  const load = useCallback(async () => {
    setLoading(true)
    setHasError(false)
    try {
      const [res, all, p, a, d, n] = await Promise.all([
        fetchUmkmRecords({ status: statusFilter === 'semua' ? '' : statusFilter, q: debouncedQuery || undefined, page, limit: pageSize }),
        fetchUmkmRecords({ limit: 1, page: 1 }),
        fetchUmkmRecords({ status: 'pending', limit: 1, page: 1 }),
        fetchUmkmRecords({ status: 'aktif', limit: 1, page: 1 }),
        fetchUmkmRecords({ status: 'ditolak', limit: 1, page: 1 }),
        fetchUmkmRecords({ status: 'nonaktif', limit: 1, page: 1 }),
      ])
      setRecords(res.records)
      setTotal(res.meta.total)
      setCounts({ semua: all.meta.total, pending: p.meta.total, aktif: a.meta.total, ditolak: d.meta.total, nonaktif: n.meta.total })
    } catch {
      setHasError(true)
    } finally {
      setLoading(false)
    }
  }, [statusFilter, debouncedQuery, page, pageSize])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    const timer = window.setTimeout(() => { setDebouncedQuery(searchInput); setPage(1) }, 300)
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

  function showToast(message: string, tone: ToastTone) { setToast({ id: Date.now(), message, tone }) }

  const filteredRecords = useMemo(() => {
    const sorted = [...records]
    sorted.sort((first, second) => {
      if (sortOrder === 'nama') return first.name.localeCompare(second.name, 'id')
      const firstTime = new Date(first.registeredAt).getTime()
      const secondTime = new Date(second.registeredAt).getTime()
      return sortOrder === 'terbaru' ? secondTime - firstTime : firstTime - secondTime
    })
    return sorted
  }, [records, sortOrder])

  const totalResults = total
  const pageCount = Math.max(1, Math.ceil(totalResults / pageSize))
  const safePage = Math.min(page, pageCount)
  const startIndex = totalResults === 0 ? 0 : (safePage - 1) * pageSize + 1
  const endIndex = Math.min(safePage * pageSize, totalResults)
  const visibleRecords = filteredRecords
  const filtersActive = searchInput.trim() !== '' || statusFilter !== 'semua' || sortOrder !== 'terbaru'

  function handleStatusChange(nextStatus: StatusFilter) { setStatusFilter(nextStatus); setPage(1) }
  function handleResetFilters() { setSearchInput(''); setDebouncedQuery(''); setStatusFilter('semua'); setSortOrder('terbaru'); setPage(1) }
  function openAction(type: QuickAction, record: UmkmRecord) { setPendingAction({ type, record }); setReason('') }

  async function applyAction() {
    if (!pendingAction) return
    try {
      if (pendingAction.type === 'approve') await approveUmkm(pendingAction.record.id)
      if (pendingAction.type === 'activate') await setUmkmStatus(pendingAction.record.id, 'aktif')
      if (pendingAction.type === 'deactivate') await setUmkmStatus(pendingAction.record.id, 'nonaktif', reason.trim())
      setPendingAction(null)
      setReason('')
      showToast(
        pendingAction.type === 'approve' ? 'UMKM berhasil disetujui.' :
        pendingAction.type === 'activate' ? 'UMKM berhasil diaktifkan kembali.' :
        'UMKM berhasil dinonaktifkan.',
        'success',
      )
      load()
    } catch (e: any) {
      showToast(e?.userMessage || 'Gagal memproses aksi.', 'error')
    }
  }

  function handleExportCsv() {
    const header = ['Nama Toko', 'Pemilik', 'Email', 'Telepon', 'Tanggal Daftar', 'Status']
    const rows = filteredRecords.map((r) => [r.name, r.owner, r.email, r.phone, formatDate(r.registeredAt), statusConfig[r.status].label])
    const csv = [header, ...rows].map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'data-umkm-ratis.csv'
    link.click()
    URL.revokeObjectURL(url)
  }

  const dialogTitle = pendingAction?.type === 'approve' ? 'Setujui UMKM?' : pendingAction?.type === 'activate' ? 'Aktifkan kembali UMKM?' : 'Nonaktifkan UMKM?'
  const dialogMessage = pendingAction?.type === 'deactivate'
    ? `Toko ${pendingAction?.record.name ?? ''} akan dinonaktifkan. Alasan wajib diisi.`
    : `Anda akan mengubah status ${pendingAction?.record.name ?? ''}.`
  const dialogConfirm = pendingAction?.type === 'approve' ? 'Setujui' : pendingAction?.type === 'activate' ? 'Aktifkan' : 'Nonaktifkan'
  const canConfirm = pendingAction?.type !== 'deactivate' || reason.trim().length >= 10

  return (
    <div className="mx-auto max-w-[1320px]">
      <div className="mb-5">
        <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">
          <span>Admin</span><span>/</span><span>Kelola UMKM</span><span>/</span><span className="text-primary">Daftar &amp; Verifikasi</span>
        </div>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-ink">Direktori Pendaftar UMKM</h1>
        <p className="mt-1.5 max-w-2xl text-sm text-muted">Kelola dan tinjau status legalitas operasional pedagang di ekosistem Ratis.</p>
      </div>

      <section className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {filterTabs.filter((t) => t.value !== 'semua').map((tab) => (
          <button key={tab.value} type="button" onClick={() => handleStatusChange(tab.value)} className={`rounded-2xl border bg-white p-4 text-left shadow-sm transition hover:shadow-md ${statusFilter === tab.value ? 'border-primary/30 ring-1 ring-primary/20' : 'border-line'}`}>
            <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-muted">{tab.label}</p>
            <p className="mt-2 text-2xl font-extrabold text-ink">{counts[tab.value]}</p>
          </button>
        ))}
      </section>

      <section className="rounded-2xl border border-line bg-white shadow-sm">
        <div className="space-y-4 border-b border-line p-4 sm:p-5">
          <div className="flex flex-wrap gap-2">
            {filterTabs.map((tab) => (
              <button key={tab.value} type="button" onClick={() => handleStatusChange(tab.value)} className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold transition ${statusFilter === tab.value ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                {tab.label}
                <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${statusFilter === tab.value ? 'bg-white/15 text-white' : countStyles[tab.value]}`}>{counts[tab.value]}</span>
              </button>
            ))}
          </div>
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
            <label className="relative block flex-1">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <input value={searchInput} onChange={(e) => setSearchInput(e.target.value)} placeholder="Cari nama toko atau pemilik..." className="h-11 w-full rounded-xl border border-line bg-slate-50/60 pl-10 pr-4 text-sm outline-none transition focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10" />
            </label>
            <div className="flex flex-wrap items-center gap-2">
              <label className="inline-flex h-11 items-center gap-2 rounded-xl border border-line px-3 text-sm text-slate-600">
                <Filter className="size-4 text-slate-400" />
                <select value={sortOrder} onChange={(e) => { setSortOrder(e.target.value as SortOrder); setPage(1) }} className="bg-transparent text-sm outline-none">
                  <option value="terbaru">Terbaru</option><option value="terlama">Terlama</option><option value="nama">Nama A-Z</option>
                </select>
              </label>
              <button type="button" onClick={handleExportCsv} className="inline-flex h-11 items-center gap-2 rounded-xl border border-line px-4 text-sm font-semibold text-slate-600 hover:bg-slate-50"><Download className="size-4" />Export CSV</button>
              {filtersActive && <button type="button" onClick={handleResetFilters} className="inline-flex h-11 items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 text-sm font-semibold text-amber-700 hover:bg-amber-100"><RotateCcw className="size-4" />Reset</button>}
            </div>
          </div>
        </div>

        {hasError ? (
          <div className="p-8 text-center">
            <AlertTriangle className="mx-auto size-10 text-amber-500" />
            <p className="mt-3 font-semibold text-ink">Gagal memuat data UMKM</p>
            <p className="mt-1 text-sm text-muted">Periksa koneksi backend lalu coba lagi.</p>
            <button type="button" onClick={load} className="mt-4 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white">Coba lagi</button>
          </div>
        ) : loading ? <TableSkeleton /> : totalResults === 0 ? (
          <div className="p-10 text-center">
            <Store className="mx-auto size-10 text-slate-300" />
            <p className="mt-3 font-semibold text-ink">Tidak ada data UMKM</p>
            <p className="mt-1 text-sm text-muted">Coba ubah filter atau kata pencarian.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-[980px] w-full text-left">
                <thead className="bg-slate-50/70">
                  <tr className="border-b border-line text-[10px] font-bold uppercase tracking-[0.12em] text-muted">
                    <th className="px-5 py-3">Nama Toko</th><th className="px-5 py-3">Pemilik</th><th className="px-5 py-3">Kontak</th><th className="px-5 py-3">Tanggal Daftar</th><th className="px-5 py-3">Status</th><th className="px-5 py-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleRecords.map((record) => {
                    const status = statusConfig[record.status]
                    return (
                      <tr key={record.id} className="border-b border-line text-sm last:border-b-0 hover:bg-slate-50/40">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <span className={`flex size-10 shrink-0 items-center justify-center rounded-xl text-xs font-bold ${avatarStyles[record.avatarTone]}`}>{getInitials(record.name)}</span>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="truncate font-semibold text-ink">{record.name}</p>
                                {record.isNew && <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700">Baru</span>}
                              </div>
                              <p className="truncate text-[11px] text-muted">{record.slug}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4"><p className="font-medium text-slate-700">{record.owner}</p><p className="text-[11px] text-muted">{record.email}</p></td>
                        <td className="px-5 py-4 text-slate-600"><span className="inline-flex items-center gap-1.5"><MessageCircle className="size-3.5 text-slate-400" />{record.phone}</span></td>
                        <td className="px-5 py-4 text-slate-600"><p>{formatDate(record.registeredAt)}</p><p className="text-[11px] text-muted">{formatTime(record.registeredAt)}</p></td>
                        <td className="px-5 py-4"><span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold ${status.badge}`}><span className={`size-1.5 rounded-full ${status.dot}`} />{status.label}</span></td>
                        <td className="px-5 py-4">
                          <div className="flex justify-end gap-2">
                            <Link to={`/admin/umkm/${record.id}`} className="rounded-lg border border-line px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50">Detail</Link>
                            {record.status === 'pending' && <button type="button" onClick={() => openAction('approve', record)} className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700">Setujui</button>}
                            {record.status === 'aktif' && <button type="button" onClick={() => openAction('deactivate', record)} className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-700">Nonaktifkan</button>}
                            {record.status === 'nonaktif' && <button type="button" onClick={() => openAction('activate', record)} className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary-hover">Aktifkan</button>}
                            {record.status === 'ditolak' && <Link to={`/admin/umkm/${record.id}`} className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700 hover:bg-amber-100">Tinjau</Link>}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            <div className="flex flex-col gap-3 border-t border-line px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-muted">Menampilkan <span className="font-semibold text-slate-700">{startIndex}-{endIndex}</span> dari <span className="font-semibold text-slate-700">{totalResults}</span> UMKM</p>
              <div className="flex items-center gap-2">
                <label className="text-xs text-muted">Baris<select value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1) }} className="ml-2 rounded-lg border border-line px-2 py-1 text-xs"><option value={5}>5</option><option value={10}>10</option><option value={25}>25</option></select></label>
                <button type="button" disabled={safePage <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))} className="inline-flex size-9 items-center justify-center rounded-lg border border-line text-slate-500 disabled:opacity-40"><ChevronLeft className="size-4" /></button>
                <span className="px-2 text-xs font-semibold text-slate-600">{safePage} / {pageCount}</span>
                <button type="button" disabled={safePage >= pageCount} onClick={() => setPage((p) => Math.min(pageCount, p + 1))} className="inline-flex size-9 items-center justify-center rounded-lg border border-line text-slate-500 disabled:opacity-40"><ChevronRight className="size-4" /></button>
              </div>
            </div>
          </>
        )}
      </section>

      <ConfirmDialog
        open={!!pendingAction}
        title={dialogTitle}
        description={dialogMessage}
        confirmLabel={dialogConfirm}
        onClose={() => setPendingAction(null)}
        onConfirm={applyAction}
        confirmDisabled={!canConfirm}
      >
        {pendingAction?.type === 'deactivate' && (
          <label className="mt-4 block">
            <span className="mb-1.5 block text-xs font-semibold text-slate-700">Alasan nonaktif <span className="text-red-500">*</span></span>
            <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3} placeholder="Minimal 10 karakter..." className="w-full rounded-xl border border-line px-3 py-2 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10" />
            <span className="mt-1 block text-[11px] text-muted">{reason.trim().length}/300</span>
          </label>
        )}
      </ConfirmDialog>

      {toast && <AdminToast key={toast.id} message={toast.message} tone={toast.tone} onClose={() => setToast(null)} />}
    </div>
  )
}



