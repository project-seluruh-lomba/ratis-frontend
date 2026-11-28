import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  AlertTriangle,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Download,
  History,
  RotateCcw,
  Search,
  ShieldCheck,
  Store,
  Users,
} from 'lucide-react'
import AdminToast, { type ToastTone } from '../../components/admin/AdminToast'
import { logsApi, shopsApi } from '../../lib/api/services'
import type { AdminLogEntry, ShopDetail } from '../../lib/api/types'

const dateTimeFormatter = new Intl.DateTimeFormat('id-ID', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
  timeZone: 'Asia/Jakarta',
})

const actionLabels: Record<string, string> = {
  LOGIN: 'Login admin',
  APPROVE_SHOP: 'Setujui UMKM',
  REJECT_SHOP: 'Tolak UMKM',
  ACTIVATE_SHOP: 'Aktifkan UMKM',
  DEACTIVATE_SHOP: 'Nonaktifkan UMKM',
  CREATE_CATEGORY: 'Tambah kategori',
  UPDATE_CATEGORY: 'Ubah kategori',
  DELETE_CATEGORY: 'Hapus kategori',
  ACTIVATE_USER: 'Aktifkan pengguna',
  DEACTIVATE_USER: 'Nonaktifkan pengguna',
  PROCESS_PAYOUT_BATCH: 'Proses batch pencairan',
}

const actionCategory: Record<string, string> = {
  APPROVE_SHOP: 'Verifikasi UMKM',
  REJECT_SHOP: 'Verifikasi UMKM',
  ACTIVATE_SHOP: 'Verifikasi UMKM',
  DEACTIVATE_SHOP: 'Verifikasi UMKM',
  CREATE_CATEGORY: 'Kategori',
  UPDATE_CATEGORY: 'Kategori',
  DELETE_CATEGORY: 'Kategori',
  ACTIVATE_USER: 'Pengguna',
  DEACTIVATE_USER: 'Pengguna',
  LOGIN: 'Autentikasi',
  PROCESS_PAYOUT_BATCH: 'Payout',
}

const categoryFilters = ['Semua', 'Verifikasi UMKM', 'Kategori', 'Pengguna', 'Payout'] as const

function formatDate(iso: string) {
  return dateTimeFormatter.format(new Date(iso))
}

async function fetchShopBySlug(slug: string): Promise<ShopDetail | undefined> {
  const result = await shopsApi.list({ q: slug, limit: 50, page: 1 })
  const found = result.data.find((shop) => shop.slug === slug || shop.id === slug)
  if (!found) return undefined
  return shopsApi.detail(found.id)
}

export default function AdminStoreAuditLogPage() {
  const { slug = '' } = useParams()
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<(typeof categoryFilters)[number]>('Semua')
  const [page, setPage] = useState(1)
  const [toast, setToast] = useState<{ message: string; tone: ToastTone } | null>(null)

  const shopQuery = useQuery({
    queryKey: ['admin-shop-relation', slug],
    queryFn: () => fetchShopBySlug(slug),
    enabled: Boolean(slug),
  })
  const shop = shopQuery.data

  const logsQuery = useQuery({
    queryKey: ['admin-shop-logs', shop?.id],
    queryFn: () =>
      logsApi.list({ targetType: 'SHOP', targetId: shop!.id, limit: 50, page: 1 }),
    enabled: Boolean(shop?.id),
  })

  const logs: AdminLogEntry[] = logsQuery.data?.data ?? []

  const filteredLogs = useMemo(() => {
    const keyword = query.trim().toLowerCase()
    return logs.filter((log) => {
      const logCategory = actionCategory[log.action] ?? 'Lainnya'
      if (category !== 'Semua' && logCategory !== category) return false
      if (!keyword) return true
      return [log.admin.name, log.admin.email, log.action, log.reason ?? '', log.targetId].some(
        (value) => value.toLowerCase().includes(keyword),
      )
    })
  }, [logs, category, query])

  const pageSize = 10
  const pageCount = Math.max(1, Math.ceil(filteredLogs.length / pageSize))
  const safePage = Math.min(page, pageCount)
  const visibleLogs = filteredLogs.slice((safePage - 1) * pageSize, safePage * pageSize)
  const activeAdmins = new Set(logs.map((log) => log.admin.id)).size
  const lastActivity = logs[0]?.createdAt

  function showToast(message: string, tone: ToastTone = 'success') {
    setToast({ message, tone })
    window.setTimeout(() => setToast(null), 4200)
  }

  function resetFilters() {
    setQuery('')
    setCategory('Semua')
    setPage(1)
  }

  function handleDownloadCsv() {
    const header = ['Waktu', 'Admin', 'Email Admin', 'Aksi', 'Objek', 'Alasan']
    const rows = filteredLogs.map((log) => [
      formatDate(log.createdAt),
      log.admin.name,
      log.admin.email,
      actionLabels[log.action] ?? log.action,
      `${log.targetType} • ${log.targetId}`,
      log.reason ?? '',
    ])
    const escape = (value: string) => `"${value.replace(/"/g, '""')}"`
    const csv = [header, ...rows].map((row) => row.map(escape).join(',')).join('\r\n')
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `audit-log-${slug}.csv`
    link.click()
    URL.revokeObjectURL(url)
    showToast(`${filteredLogs.length} baris log aktivitas diunduh.`)
  }

  if (shopQuery.isError || logsQuery.isError) {
    return (
      <div className="mx-auto max-w-xl rounded-2xl border border-line bg-white p-10 text-center shadow-sm">
        <AlertTriangle className="mx-auto size-9 text-amber-500" />
        <h1 className="mt-3 text-lg font-bold text-ink">Gagal memuat log aktivitas</h1>
        <p className="mt-1 text-xs text-muted">Periksa koneksi backend lalu coba lagi.</p>
        <button
          type="button"
          onClick={() => {
            void shopQuery.refetch()
            void logsQuery.refetch()
          }}
          className="mt-4 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-white"
        >
          Coba lagi
        </button>
      </div>
    )
  }

  if (shopQuery.isLoading || logsQuery.isLoading) {
    return (
      <div className="mx-auto max-w-xl rounded-2xl border border-line bg-white p-10 text-center text-sm text-muted shadow-sm">
        Memuat log aktivitas...
      </div>
    )
  }

  if (!shop) {
    return (
      <div className="mx-auto max-w-xl rounded-2xl border border-line bg-white p-10 text-center shadow-sm">
        <Store className="mx-auto size-9 text-slate-300" />
        <h1 className="mt-3 text-lg font-bold text-ink">Toko tidak ditemukan</h1>
        <Link
          to="/admin/kelola-pengguna"
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-white"
        >
          <ArrowLeft className="size-3.5" />
          Kembali ke Kelola Pengguna
        </Link>
      </div>
    )
  }

  return (
    <div>
      {toast && (
        <AdminToast message={toast.message} tone={toast.tone} onClose={() => setToast(null)} />
      )}

      <div className="flex flex-wrap items-center justify-between gap-2">
        <Link
          to={`/admin/kelola-pengguna/toko-terkait/${shop.slug}`}
          className="inline-flex items-center gap-1.5 text-[10px] font-medium text-muted transition hover:text-ink"
        >
          <ArrowLeft className="size-3.5" />
          Kembali ke Toko Terkait ({shop.name})
        </Link>
        <span className="inline-flex items-center gap-1 rounded-full bg-primary-soft/60 px-2 py-1 text-[9px] font-semibold text-primary">
          <ShieldCheck className="size-2.5" />
          Sumber: tabel log aktivitas admin
        </span>
      </div>

      <section className="mt-3 flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0 max-w-3xl">
          <p className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.14em] text-muted">
            <span className="size-1.5 rounded-full bg-primary" />
            Jejak Audit Operasional
          </p>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-ink sm:text-[30px]">
            Audit Log Aktivitas Toko
          </h1>
          <p className="mt-1.5 max-w-2xl text-[10px] leading-relaxed text-muted">
            Riwayat tindakan admin yang menyentuh entitas{' '}
            <span className="font-semibold text-ink">{shop.name}</span> beserta alasan dan pelakunya.
            Catatan diambil langsung dari database dan tidak dapat diedit dari halaman ini.
          </p>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              void shopQuery.refetch()
              void logsQuery.refetch()
            }}
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-line bg-white px-3 text-[10px] font-semibold text-slate-600 transition hover:bg-slate-50"
          >
            <History className="size-3.5 text-primary" />
            Muat Ulang
          </button>
          <button
            type="button"
            onClick={handleDownloadCsv}
            disabled={filteredLogs.length === 0}
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl bg-primary px-3 text-[10px] font-semibold text-white transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Download className="size-3.5" />
            Unduh CSV
          </button>
        </div>
      </section>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-line bg-white p-4 shadow-sm">
          <p className="text-[8px] font-bold uppercase tracking-[0.12em] text-muted">
            Total Aktivitas Tercatat
          </p>
          <p className="mt-1.5 text-xl font-extrabold text-ink">{logs.length}</p>
        </div>
        <div className="rounded-2xl border border-line bg-white p-4 shadow-sm">
          <p className="text-[8px] font-bold uppercase tracking-[0.12em] text-muted">
            Admin Terlibat
          </p>
          <p className="mt-1.5 flex items-center gap-1.5 text-xl font-extrabold text-ink">
            <Users className="size-4 text-primary" />
            {activeAdmins}
          </p>
        </div>
        <div className="rounded-2xl border border-line bg-white p-4 shadow-sm">
          <p className="text-[8px] font-bold uppercase tracking-[0.12em] text-muted">
            Aktivitas Terakhir
          </p>
          <p className="mt-1.5 text-[11px] font-bold text-ink">
            {lastActivity ? formatDate(lastActivity) : 'Belum ada'}
          </p>
        </div>
        <div className="rounded-2xl border border-line bg-white p-4 shadow-sm">
          <p className="text-[8px] font-bold uppercase tracking-[0.12em] text-muted">
            Status Toko Saat Ini
          </p>
          <p className="mt-1.5 text-[11px] font-bold capitalize text-ink">{shop.status}</p>
        </div>
      </div>

      <section className="mt-4 rounded-2xl border border-line bg-white shadow-sm">
        <div className="space-y-3 border-b border-line p-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full sm:max-w-md">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value)
                  setPage(1)
                }}
                placeholder="Cari admin, aksi, atau alasan..."
                className="h-9 w-full rounded-xl border border-line bg-[#f7f7fb] pl-9 pr-3 text-[10px] text-ink outline-none transition placeholder:text-slate-400 focus:border-primary focus:bg-white"
              />
            </div>
            <p className="text-[10px] text-muted">
              Menampilkan <span className="font-bold text-ink">{filteredLogs.length}</span> dari{' '}
              {logs.length} aktivitas
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-1">
            {categoryFilters.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => {
                  setCategory(item)
                  setPage(1)
                }}
                aria-pressed={category === item}
                className={`inline-flex h-8 items-center rounded-lg px-3 text-[10px] transition ${
                  category === item
                    ? 'bg-primary text-white'
                    : 'bg-[#f4f5fa] font-medium text-slate-600 hover:bg-slate-100'
                }`}
              >
                {item}
              </button>
            ))}
            {(query || category !== 'Semua') && (
              <button
                type="button"
                onClick={resetFilters}
                className="inline-flex h-8 items-center gap-1 rounded-lg border border-amber-200 bg-amber-50 px-2.5 text-[10px] font-semibold text-amber-700"
              >
                <RotateCcw className="size-3" />
                Reset
              </button>
            )}
          </div>
        </div>

        {visibleLogs.length === 0 ? (
          <div className="px-6 py-14 text-center">
            <History className="mx-auto size-9 text-slate-300" />
            <p className="mt-2 text-sm font-bold text-ink">Belum ada log yang cocok</p>
            <p className="mt-1 text-[11px] text-muted">
              Aktivitas admin untuk toko ini akan muncul setelah ada tindakan verifikasi atau
              perubahan status.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-left">
              <thead className="bg-[#f4f5fa] text-[8px] uppercase tracking-[0.08em] text-muted">
                <tr>
                  <th className="px-4 py-2.5 font-bold">Waktu</th>
                  <th className="px-3 py-2.5 font-bold">Admin</th>
                  <th className="px-3 py-2.5 font-bold">Aksi</th>
                  <th className="px-3 py-2.5 font-bold">Objek</th>
                  <th className="px-4 py-2.5 font-bold">Alasan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {visibleLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/60">
                    <td className="whitespace-nowrap px-4 py-3 text-[10px] text-slate-600">
                      {formatDate(log.createdAt)}
                    </td>
                    <td className="px-3 py-3">
                      <p className="text-[10px] font-semibold text-ink">{log.admin.name}</p>
                      <p className="text-[9px] text-muted">{log.admin.email}</p>
                    </td>
                    <td className="px-3 py-3">
                      <span className="rounded-full bg-primary-soft/60 px-2 py-1 text-[9px] font-semibold text-primary">
                        {actionLabels[log.action] ?? log.action}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-[9px] text-muted">
                      <p className="font-semibold text-slate-600">
                        {log.targetName ?? log.targetType}
                      </p>
                      <p className="font-mono text-[8px] text-slate-400">{log.targetId}</p>
                    </td>
                    <td className="max-w-[280px] px-4 py-3 text-[10px] leading-relaxed text-slate-600">
                      {log.reason || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex flex-col gap-2 border-t border-line px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[9px] text-muted">
            Halaman {safePage} dari {pageCount}
          </p>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setPage(Math.max(1, safePage - 1))}
              disabled={safePage <= 1}
              aria-label="Halaman sebelumnya"
              className="flex size-8 items-center justify-center rounded-lg border border-line text-slate-500 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft className="size-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setPage(Math.min(pageCount, safePage + 1))}
              disabled={safePage >= pageCount}
              aria-label="Halaman berikutnya"
              className="flex size-8 items-center justify-center rounded-lg border border-line text-slate-500 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronRight className="size-3.5" />
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}
