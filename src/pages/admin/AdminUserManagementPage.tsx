import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  Ban,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Download,
  ExternalLink,
  Phone,
  RotateCcw,
  Search,
  ShieldAlert,
  ShoppingBag,
  Store,
  UserCheck,
  Users,
  UserX,
  X,
} from 'lucide-react'
import AdminToast, { type ToastTone } from '../../components/admin/AdminToast'
import ConfirmDialog from '../../components/admin/ConfirmDialog'
import { getAdminSession } from '../../lib/auth'
import type { ApiError } from '../../lib/api/client'
import { usersApi } from '../../lib/api/services'
import type { ManagedUser, ManagedUserRole, UserSummary } from '../../lib/api/types'

type UserRole = 'admin' | 'pemilik' | 'staf' | 'pelanggan'
type UserStatus = 'aktif' | 'nonaktif'
type RoleTab = 'semua' | UserRole
type StatusFilter = 'semua' | UserStatus

type AdminUser = {
  id: string
  name: string
  email: string
  phone: string
  role: UserRole
  status: UserStatus
  storeId: string | null
  storeName: string | null
  storeSlug: string | null
  joinedAt: string
  isCurrentAdmin: boolean
}

const roleFromApi: Record<ManagedUserRole, UserRole> = {
  ADMIN: 'admin',
  OWNER: 'pemilik',
  STAFF: 'staf',
  CUSTOMER: 'pelanggan',
}

const roleToApi: Record<UserRole, ManagedUserRole> = {
  admin: 'ADMIN',
  pemilik: 'OWNER',
  staf: 'STAFF',
  pelanggan: 'CUSTOMER',
}

function mapUser(user: ManagedUser, currentAdminId: string): AdminUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone ?? '—',
    role: roleFromApi[user.role],
    status: user.isActive ? 'aktif' : 'nonaktif',
    storeId: user.shopId,
    storeName: user.shopName,
    storeSlug: user.shopSlug,
    joinedAt: user.createdAt,
    isCurrentAdmin: Boolean(currentAdminId) && user.id === currentAdminId,
  }
}

const PAGE_SIZE = 10

const roleMeta: Record<UserRole, { label: string; badge: string; avatar: string }> = {
  admin: {
    label: 'Admin',
    badge: 'border border-indigo-200 bg-indigo-50 text-indigo-600',
    avatar: 'bg-indigo-600',
  },
  pemilik: {
    label: 'Pemilik UMKM',
    badge: 'border border-primary/20 bg-primary-soft/60 text-primary',
    avatar: 'bg-primary',
  },
  staf: {
    label: 'Staf Toko',
    badge: 'border border-sky-200 bg-sky-50 text-sky-700',
    avatar: 'bg-sky-600',
  },
  pelanggan: {
    label: 'Pelanggan',
    badge: 'border border-line bg-slate-100 text-slate-600',
    avatar: 'bg-slate-500',
  },
}

const roleTabs: { value: RoleTab; label: string }[] = [
  { value: 'semua', label: 'Semua' },
  { value: 'admin', label: 'Admin' },
  { value: 'pemilik', label: 'Pemilik UMKM' },
  { value: 'staf', label: 'Staf Toko' },
  { value: 'pelanggan', label: 'Pelanggan' },
]

const statusOptions: { value: StatusFilter; label: string }[] = [
  { value: 'semua', label: 'Status: Semua' },
  { value: 'aktif', label: 'Status: Aktif' },
  { value: 'nonaktif', label: 'Status: Nonaktif' },
]

const deactivationNotes: Record<UserRole, string> = {
  admin:
    'Akun admin akan kehilangan seluruh hak akses panel. Pastikan masih ada minimal satu admin aktif sebelum melanjutkan.',
  pemilik:
    'Akun tidak akan bisa login ke dashboard pemilik. Catatan: Menonaktifkan pemilik tidak otomatis menonaktifkan toko atau membatalkan pesanan berjalan.',
  staf: 'Akun staf tidak akan bisa mengakses dashboard toko. Data operasional yang pernah ia proses tetap tersimpan.',
  pelanggan:
    'Akun pelanggan tidak akan bisa masuk ke aplikasi. Riwayat pesanan tetap tersimpan pada arsip platform.',
}

const numberFormatter = new Intl.NumberFormat('id-ID')

const dateFormatter = new Intl.DateTimeFormat('id-ID', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  timeZone: 'Asia/Jakarta',
})

function getInitials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')
}

function getDeactivationBlock(user: AdminUser, activeAdminCount: number) {
  if (user.isCurrentAdmin) {
    return 'Akun yang sedang Anda gunakan tidak dapat dinonaktifkan.'
  }
  if (user.role === 'admin' && activeAdminCount <= 1) {
    return 'Admin aktif terakhir tidak dapat dinonaktifkan.'
  }
  return ''
}

export default function AdminUserManagementPage() {
  const [searchParams] = useSearchParams()
  const [users, setUsers] = useState<AdminUser[]>([])
  const [roleTab, setRoleTab] = useState<RoleTab>('semua')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('semua')
  const [keyword, setKeyword] = useState(() => searchParams.get('q') ?? '')
  const [page, setPage] = useState(1)
  const [totalUsers, setTotalUsers] = useState(0)
  const [summary, setSummary] = useState<UserSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const [target, setTarget] = useState<AdminUser | null>(null)
  const [reason, setReason] = useState('')
  const [confirmed, setConfirmed] = useState(false)
  const [activateTarget, setActivateTarget] = useState<AdminUser | null>(null)
  const [toast, setToast] = useState<{ message: string; tone: ToastTone } | null>(null)

  const currentAdminId = useMemo(() => getAdminSession()?.id ?? '', [])

  useEffect(() => {
    let cancelled = false
    const timer = window.setTimeout(() => {
      setLoading(true)
      setError(null)
      usersApi
        .list({
          ...(roleTab !== 'semua' ? { role: roleToApi[roleTab] } : {}),
          ...(statusFilter !== 'semua' ? { isActive: statusFilter === 'aktif' } : {}),
          ...(keyword.trim() ? { q: keyword.trim() } : {}),
          page,
          limit: PAGE_SIZE,
        })
        .then((response) => {
          if (cancelled) return
          setUsers(response.data.map((user) => mapUser(user, currentAdminId)))
          setSummary(response.summary)
          setTotalUsers(response.meta.total)
        })
        .catch((err: ApiError) => {
          if (cancelled) return
          setError(err.userMessage ?? 'Gagal memuat data pengguna')
        })
        .finally(() => {
          if (!cancelled) setLoading(false)
        })
    }, 250)
    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [roleTab, statusFilter, keyword, page, currentAdminId, refreshKey])

  function showToast(message: string, tone: ToastTone = 'success') {
    setToast({ message, tone })
    window.setTimeout(() => setToast(null), 4200)
  }

  function refresh() {
    setRefreshKey((value) => value + 1)
  }

  const roleCounts = useMemo(
    () => ({
      semua: summary?.total ?? 0,
      admin: summary?.roles.ADMIN ?? 0,
      pemilik: summary?.roles.OWNER ?? 0,
      staf: summary?.roles.STAFF ?? 0,
      pelanggan: summary?.roles.CUSTOMER ?? 0,
    }),
    [summary],
  )

  const suspendedCount = summary?.inactive ?? 0
  const activeAdminCount = summary?.activeAdmins ?? 0
  const suspendedRatio =
    summary && summary.total > 0
      ? (Math.round((suspendedCount / summary.total) * 1000) / 10).toLocaleString('id-ID')
      : '0'

  const pageCount = Math.max(1, Math.ceil(totalUsers / PAGE_SIZE))
  const safePage = Math.min(page, pageCount)
  const visibleUsers = users

  const pageNumbers = Array.from({ length: pageCount }, (_, index) => index + 1).filter(
    (number) => number === 1 || number === pageCount || Math.abs(number - safePage) <= 1,
  )

  const hasActiveFilter =
    roleTab !== 'semua' || statusFilter !== 'semua' || keyword.trim().length > 0

  function openDeactivate(user: AdminUser) {
    setTarget(user)
    setReason('')
    setConfirmed(false)
  }

  function closeDeactivate() {
    setTarget(null)
    setReason('')
    setConfirmed(false)
  }

  async function handleConfirmDeactivate() {
    if (!target || reason.trim().length < 10 || !confirmed || saving) return

    setSaving(true)
    try {
      await usersApi.updateStatus(target.id, false, reason.trim())
      showToast(
        `Akun ${target.name} dinonaktifkan. Alasan tersimpan pada log audit platform.`,
        'success',
      )
      closeDeactivate()
      refresh()
    } catch (err) {
      showToast(
        (err as ApiError).userMessage ?? 'Gagal menonaktifkan akun. Silakan coba lagi.',
        'error',
      )
    } finally {
      setSaving(false)
    }
  }

  async function handleConfirmActivate() {
    if (!activateTarget || saving) return

    setSaving(true)
    try {
      await usersApi.updateStatus(activateTarget.id, true)
      showToast(`Akun ${activateTarget.name} berhasil diaktifkan kembali.`, 'success')
      setActivateTarget(null)
      refresh()
    } catch (err) {
      showToast(
        (err as ApiError).userMessage ?? 'Gagal mengaktifkan akun. Silakan coba lagi.',
        'error',
      )
    } finally {
      setSaving(false)
    }
  }

  function handleResetFilters() {
    setRoleTab('semua')
    setStatusFilter('semua')
    setKeyword('')
    setPage(1)
  }

  async function handleExportCsv() {
    try {
      const response = await usersApi.list({
        ...(roleTab !== 'semua' ? { role: roleToApi[roleTab] } : {}),
        ...(statusFilter !== 'semua' ? { isActive: statusFilter === 'aktif' } : {}),
        ...(keyword.trim() ? { q: keyword.trim() } : {}),
        page: 1,
        limit: 50,
      })
      const rows = [
        ['ID Pengguna', 'Nama', 'Email', 'Telepon', 'Role', 'Status', 'Toko', 'Terdaftar'],
        ...response.data.map((user) => {
          const view = mapUser(user, currentAdminId)
          return [
            view.id,
            view.name,
            view.email,
            view.phone,
            roleMeta[view.role].label,
            view.status === 'aktif' ? 'Aktif' : 'Nonaktif',
            view.storeName ?? '-',
            dateFormatter.format(new Date(view.joinedAt)),
          ]
        }),
      ]

      const csv = rows
        .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
        .join('\n')
      const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `pengguna-ratis-${new Date().toISOString().slice(0, 10)}.csv`
      link.click()
      URL.revokeObjectURL(url)
      showToast(`${numberFormatter.format(response.meta.total)} pengguna diekspor ke CSV.`)
    } catch (err) {
      showToast(
        (err as ApiError).userMessage ?? 'Gagal mengekspor data pengguna.',
        'error',
      )
    }
  }

  const canSubmitDeactivation = reason.trim().length >= 10 && confirmed && !saving

  return (
    <div>
      {toast && (
        <AdminToast message={toast.message} tone={toast.tone} onClose={() => setToast(null)} />
      )}

      <section className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 text-[10px] text-muted">
            Portal Admin
            <ChevronRight className="size-3 text-slate-300" />
            <span className="font-semibold text-ink">Otoritas &amp; Akses</span>
          </p>
          <h1 className="mt-1.5 text-2xl font-extrabold tracking-tight text-ink sm:text-[28px]">
            Kelola Pengguna
          </h1>
          <p className="mt-1.5 max-w-2xl text-xs leading-relaxed text-muted">
            Kelola akun admin, pemilik UMKM, staf, dan pelanggan. Nonaktifkan akun bermasalah tanpa
            menghapus data pesanan atau toko terkait.
          </p>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleExportCsv}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-line bg-white px-4 text-[11px] font-semibold text-slate-600 transition hover:bg-slate-50"
          >
            <Download className="size-4" />
            Ekspor CSV
          </button>
        </div>
      </section>

      <section className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        <article className="flex flex-col rounded-2xl border border-line bg-white p-4 shadow-sm">
          <div className="flex items-start justify-between gap-2">
            <p className="text-[8px] font-bold uppercase tracking-[0.12em] text-muted">
              Total Pengguna
            </p>
            <Users className="size-4 shrink-0 text-primary" />
          </div>
          <div className="mt-2 flex flex-wrap items-baseline gap-x-2 gap-y-1">
            <p className="text-[22px] font-extrabold leading-none text-ink">
              {numberFormatter.format(roleCounts.semua)}
            </p>
            <span className="text-[9px] font-semibold text-slate-500">Semua role</span>
          </div>
          <p className="mt-auto border-t border-line pt-2 text-[9px] leading-relaxed text-muted">
            Total terdaftar di direktori
          </p>
        </article>

        <article className="flex flex-col rounded-2xl border border-line bg-white p-4 shadow-sm">
          <div className="flex items-start justify-between gap-2">
            <p className="text-[8px] font-bold uppercase tracking-[0.12em] text-muted">
              Pemilik UMKM
            </p>
            <Store className="size-4 shrink-0 text-primary" />
          </div>
          <div className="mt-2 flex flex-wrap items-baseline gap-x-2 gap-y-1">
            <p className="text-[22px] font-extrabold leading-none text-ink">
              {numberFormatter.format(roleCounts.pemilik)}
            </p>
            <span className="text-[9px] font-bold text-slate-500">Pemilik toko</span>
          </div>
          <p className="mt-auto border-t border-line pt-2 text-[9px] leading-relaxed text-muted">
            Akun pemilik terdaftar
          </p>
        </article>

        <article className="flex flex-col rounded-2xl border border-line bg-white p-4 shadow-sm">
          <div className="flex items-start justify-between gap-2">
            <p className="text-[8px] font-bold uppercase tracking-[0.12em] text-muted">
              Staf Toko
            </p>
            <UserCheck className="size-4 shrink-0 text-primary" />
          </div>
          <div className="mt-2 flex flex-wrap items-baseline gap-x-2 gap-y-1">
            <p className="text-[22px] font-extrabold leading-none text-ink">
              {numberFormatter.format(roleCounts.staf)}
            </p>
            <span className="text-[9px] font-semibold text-slate-500">Kasir &amp; Admin</span>
          </div>
          <p className="mt-auto border-t border-line pt-2 text-[9px] leading-relaxed text-muted">
            Akses terbatas toko
          </p>
        </article>

        <article className="flex flex-col rounded-2xl border border-line bg-white p-4 shadow-sm">
          <div className="flex items-start justify-between gap-2">
            <p className="text-[8px] font-bold uppercase tracking-[0.12em] text-muted">
              Pelanggan
            </p>
            <ShoppingBag className="size-4 shrink-0 text-slate-500" />
          </div>
          <div className="mt-2 flex flex-wrap items-baseline gap-x-2 gap-y-1">
            <p className="text-[22px] font-extrabold leading-none text-ink">
              {numberFormatter.format(roleCounts.pelanggan)}
            </p>
            <span className="text-[9px] font-semibold text-slate-500">Akun pembeli</span>
          </div>
          <p className="mt-auto border-t border-line pt-2 text-[9px] leading-relaxed text-muted">
            Pembeli ekosistem
          </p>
        </article>

        <article className="flex flex-col rounded-2xl border border-line bg-white p-4 shadow-sm">
          <div className="flex items-start justify-between gap-2">
            <p className="text-[8px] font-bold uppercase tracking-[0.12em] text-rose-500">
              Ditangguhkan
            </p>
            <Ban className="size-4 shrink-0 text-rose-400" />
          </div>
          <div className="mt-2 flex flex-wrap items-baseline gap-x-2 gap-y-1">
            <p className="text-[22px] font-extrabold leading-none text-rose-600">
              {numberFormatter.format(suspendedCount)}
            </p>
            <span className="rounded bg-rose-50 px-1.5 py-0.5 text-[9px] font-bold text-rose-500">
              {suspendedRatio}% rasio
            </span>
          </div>
          <p className="mt-auto border-t border-line pt-2 text-[9px] leading-relaxed text-muted">
            Akun dinonaktifkan
          </p>
        </article>
      </section>

      <div
        className={`mt-4 grid gap-4 ${
          target ? 'xl:grid-cols-[minmax(0,1fr)_400px]' : 'grid-cols-1'
        }`}
      >
        <section className="min-w-0 overflow-hidden rounded-2xl border border-line bg-white shadow-sm">
          <div className="border-b border-line px-4 py-4">
            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-slate-400" />
                <input
                  type="search"
                  value={keyword}
                  onChange={(event) => {
                    setKeyword(event.target.value)
                    setPage(1)
                  }}
                  placeholder="Cari nama atau email..."
                  aria-label="Cari pengguna"
                  className="h-9 w-full rounded-xl border border-line bg-[#f7f7fb] pl-9 pr-3 text-[10px] text-ink outline-none transition placeholder:text-slate-400 focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10"
                />
              </div>

              <div className="relative sm:w-[150px]">
                <select
                  value={statusFilter}
                  onChange={(event) => {
                    setStatusFilter(event.target.value as StatusFilter)
                    setPage(1)
                  }}
                  aria-label="Filter status akun"
                  className="h-9 w-full cursor-pointer appearance-none rounded-xl border border-line bg-[#f7f7fb] pl-3 pr-8 text-[10px] font-medium text-ink outline-none transition focus:border-primary focus:bg-white"
                >
                  {statusOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 size-3.5 -translate-y-1/2 text-slate-400" />
              </div>

              <button
                type="button"
                onClick={handleResetFilters}
                className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl px-3 text-[10px] font-semibold text-slate-500 transition hover:bg-slate-50 hover:text-ink"
              >
                <RotateCcw className="size-3.5" />
                Reset
              </button>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              {roleTabs.map((tab) => {
                const active = roleTab === tab.value

                return (
                  <button
                    key={tab.value}
                    type="button"
                    onClick={() => {
                      setRoleTab(tab.value)
                      setPage(1)
                    }}
                    aria-pressed={active}
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[10px] transition ${
                      active
                        ? 'bg-primary font-bold text-white'
                        : 'border border-line bg-[#f7f7fb] font-medium text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {tab.label}
                    <span
                      className={`rounded px-1 text-[9px] font-bold ${
                        active ? 'bg-white/20 text-white' : 'text-slate-500'
                      }`}
                    >
                      ({numberFormatter.format(roleCounts[tab.value])})
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-left">
              <thead>
                <tr className="bg-[#f4f5fa] text-[8px] uppercase tracking-[0.1em] text-muted">
                  <th className="px-4 py-3 font-bold">Identitas Pengguna</th>
                  <th className="px-3 py-3 font-bold">Email &amp; Kontak</th>
                  <th className="px-3 py-3 font-bold">Role Akun</th>
                  <th className="px-3 py-3 font-bold">Toko Terkait</th>
                  <th className="px-3 py-3 font-bold">Status</th>
                  <th className="px-3 py-3 font-bold">Terdaftar</th>
                  <th className="px-4 py-3 text-right font-bold">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {loading && visibleUsers.length === 0 ? (
                  <tr>
                    <td colSpan={7}>
                      <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
                        <span className="flex size-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                          <RotateCcw className="size-5 animate-spin" />
                        </span>
                        <h3 className="mt-3 text-sm font-bold text-ink">Memuat pengguna</h3>
                        <p className="mt-1 text-[10px] text-muted">
                          Mengambil direktori pengguna dari server.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan={7}>
                      <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
                        <span className="flex size-12 items-center justify-center rounded-2xl bg-red-50 text-red-500">
                          <ShieldAlert className="size-5" />
                        </span>
                        <h3 className="mt-3 text-sm font-bold text-ink">Gagal memuat pengguna</h3>
                        <p className="mt-1 max-w-sm text-[10px] leading-relaxed text-muted">
                          {error}
                        </p>
                        <button
                          type="button"
                          onClick={refresh}
                          className="mt-3 rounded-xl border border-line bg-white px-3.5 py-1.5 text-[10px] font-semibold text-slate-600 transition hover:bg-slate-50"
                        >
                          Coba lagi
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : visibleUsers.length === 0 ? (
                  <tr>
                    <td colSpan={7}>
                      <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
                        <span className="flex size-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                          <Users className="size-5" />
                        </span>
                        <h3 className="mt-3 text-sm font-bold text-ink">
                          Tidak ada pengguna yang cocok
                        </h3>
                        <p className="mt-1 max-w-xs text-[10px] leading-relaxed text-muted">
                          Coba ubah kata kunci, role, atau status akun untuk melihat pengguna lain.
                        </p>
                        {hasActiveFilter && (
                          <button
                            type="button"
                            onClick={handleResetFilters}
                            className="mt-3 rounded-xl border border-line bg-white px-3.5 py-1.5 text-[10px] font-semibold text-slate-600 transition hover:bg-slate-50"
                          >
                            Reset filter
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  visibleUsers.map((user) => {
                    const meta = roleMeta[user.role]
                    const blockReason = getDeactivationBlock(user, activeAdminCount)

                    return (
                      <tr
                        key={user.id}
                        className={`transition ${
                          target?.id === user.id ? 'bg-primary-soft/20' : 'hover:bg-slate-50/60'
                        }`}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <span
                              className={`flex size-8 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white ${meta.avatar}`}
                            >
                              {getInitials(user.name)}
                            </span>
                            <div className="min-w-0">
                              <p className="truncate text-[11px] font-bold text-ink">{user.name}</p>
                              <p className="truncate text-[9px] text-slate-400">{user.id}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-3">
                          <p className="truncate text-[10px] text-slate-600">{user.email}</p>
                          <p className="mt-0.5 flex items-center gap-1 text-[9px] text-muted">
                            <Phone className="size-2.5 shrink-0" />
                            {user.phone}
                          </p>
                        </td>
                        <td className="px-3 py-3">
                          <span
                            className={`inline-flex rounded-md px-2 py-1 text-[9px] font-semibold ${meta.badge}`}
                          >
                            {meta.label}
                          </span>
                        </td>
                        <td className="px-3 py-3">
                          {user.storeName ? (
                            user.storeId ? (
                              <Link
                                to={`/admin/umkm/${user.storeId}`}
                                className="flex max-w-[150px] items-center gap-1 text-[10px] text-slate-600 transition hover:text-primary"
                              >
                                <Store className="size-3 shrink-0 text-slate-400" />
                                <span className="truncate">{user.storeName}</span>
                              </Link>
                            ) : (
                              <span className="flex max-w-[150px] items-center gap-1 text-[10px] text-slate-600">
                                <Store className="size-3 shrink-0 text-slate-400" />
                                <span className="truncate">{user.storeName}</span>
                              </span>
                            )
                          ) : (
                            <span className="text-[10px] text-slate-300">—</span>
                          )}
                        </td>
                        <td className="px-3 py-3">
                          {user.status === 'aktif' ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-[8px] font-semibold text-emerald-600">
                              <span className="size-1.5 rounded-full bg-emerald-500" />
                              Aktif
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-1 text-[8px] font-semibold text-rose-600">
                              <span className="size-1.5 rounded-full bg-rose-500" />
                              Nonaktif
                            </span>
                          )}
                        </td>
                        <td className="whitespace-nowrap px-3 py-3 text-[9px] text-muted">
                          {dateFormatter.format(new Date(user.joinedAt))}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {user.status === 'aktif' ? (
                            <button
                              type="button"
                              disabled={Boolean(blockReason)}
                              title={blockReason || `Nonaktifkan akun ${user.name}`}
                              onClick={() => openDeactivate(user)}
                              className="inline-flex items-center justify-center rounded-lg border border-line bg-white px-2.5 py-1.5 text-[9px] font-semibold text-rose-600 transition hover:border-rose-200 hover:bg-rose-50 disabled:cursor-not-allowed disabled:border-line disabled:text-slate-300 disabled:hover:bg-white"
                            >
                              Nonaktifkan
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setActivateTarget(user)}
                              className="inline-flex items-center justify-center rounded-lg border border-line bg-white px-2.5 py-1.5 text-[9px] font-semibold text-primary transition hover:border-primary/30 hover:bg-primary-soft/30"
                            >
                              Aktifkan
                            </button>
                          )}
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col gap-3 border-t border-line px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[9px] text-muted">
              Menampilkan{' '}
              <span className="font-semibold text-ink">
                {totalUsers === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1}-
                {Math.min(safePage * PAGE_SIZE, totalUsers)}
              </span>{' '}
              dari{' '}
              <span className="font-semibold text-ink">
                {numberFormatter.format(totalUsers)}
              </span>{' '}
              pengguna
            </p>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setPage(Math.max(1, safePage - 1))}
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
                      onClick={() => setPage(pageNumber)}
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
                onClick={() => setPage(Math.min(pageCount, safePage + 1))}
                disabled={safePage >= pageCount}
                aria-label="Halaman berikutnya"
                className="flex size-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-300"
              >
                <ChevronRight className="size-3.5" />
              </button>
            </div>
          </div>
        </section>

        {target && (
          <aside className="min-w-0 xl:sticky xl:top-24 xl:self-start">
            <section className="rounded-2xl border border-line bg-white p-4 shadow-[0_16px_40px_rgba(15,23,42,0.08)] sm:p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-500">
                    <UserX className="size-4" />
                  </span>
                  <div>
                    <h2 className="text-sm font-bold leading-snug text-ink">
                      Nonaktifkan Akun {roleMeta[target.role].label}?
                    </h2>
                    <p className="mt-0.5 text-[10px] text-muted">
                      Prosedur Keamanan &amp; Audit Pengguna
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={closeDeactivate}
                  aria-label="Tutup panel nonaktifkan akun"
                  className="flex size-7 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                >
                  <X className="size-4" />
                </button>
              </div>

              <div className="mt-3 flex items-center gap-2.5 rounded-xl bg-[#f4f5fa] p-3">
                <span
                  className={`flex size-8 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white ${roleMeta[target.role].avatar}`}
                >
                  {getInitials(target.name)}
                </span>
                <div className="min-w-0">
                  <p className="flex items-center gap-1.5 truncate text-[11px] font-bold text-ink">
                    {target.name}
                    <span
                      className={`rounded px-1 py-0.5 text-[7px] font-bold uppercase tracking-wide ${roleMeta[target.role].badge}`}
                    >
                      {target.role === 'admin' ? 'Admin' : roleMeta[target.role].label}
                    </span>
                  </p>
                  <p className="truncate text-[9px] text-muted">
                    {target.email} • ID: {target.id}
                  </p>
                </div>
              </div>

              <div className="mt-3 flex gap-2 rounded-xl border border-amber-200 bg-amber-50/70 p-3">
                <ShieldAlert className="mt-0.5 size-3.5 shrink-0 text-amber-600" />
                <p className="text-[9px] leading-relaxed text-amber-900/90">
                  {deactivationNotes[target.role]}
                </p>
              </div>

              {target.storeName && (
                <div className="mt-3 flex items-center justify-between gap-2 border-b border-line pb-3">
                  <p className="text-[9px] text-muted">
                    Toko terasosiasi:{' '}
                    <span className="font-bold text-ink">{target.storeName}</span>
                  </p>
                  {target.storeId && (
                    <Link
                      to={`/admin/umkm/${target.storeId}`}
                      className="inline-flex shrink-0 items-center gap-1 text-[9px] font-semibold text-primary transition hover:text-primary-hover"
                    >
                      Lihat Toko Terkait
                      <ExternalLink className="size-2.5" />
                    </Link>
                  )}
                </div>
              )}

              <div className="mt-3">
                <div className="flex items-center justify-between gap-2">
                  <label
                    htmlFor="deactivation-reason"
                    className="text-[9px] font-semibold text-ink"
                  >
                    Alasan Penonaktifan <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[8px] text-slate-400">{reason.length} / 300</span>
                </div>
                <textarea
                  id="deactivation-reason"
                  value={reason}
                  onChange={(event) => setReason(event.target.value.slice(0, 300))}
                  rows={4}
                  placeholder="Tuliskan alasan spesifik dan terdokumentasi (contoh: Laporan indikasi fraud #7712, permintaan pemilik resmi via tiket #2938)..."
                  className="mt-1.5 w-full resize-none rounded-xl border border-line bg-[#f7f7fb] p-2.5 text-[10px] leading-relaxed text-ink outline-none transition placeholder:text-slate-400 focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10"
                />
                <p className="mt-1 text-[8px] leading-relaxed text-muted">
                  Minimal 10 karakter untuk validasi catatan audit log sistem.
                </p>
              </div>

              <label className="mt-3 flex cursor-pointer items-start gap-2">
                <input
                  type="checkbox"
                  checked={confirmed}
                  onChange={(event) => setConfirmed(event.target.checked)}
                  className="mt-0.5 size-3.5 shrink-0 cursor-pointer accent-[#0f766e]"
                />
                <span className="text-[9px] leading-relaxed text-slate-600">
                  Saya yakin menonaktifkan akun ini dan memahami dampaknya terhadap pengguna.
                </span>
              </label>

              <div className="mt-4 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={closeDeactivate}
                  className="inline-flex h-9 items-center justify-center rounded-xl px-3 text-[10px] font-semibold text-slate-600 transition hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDeactivate}
                  disabled={!canSubmitDeactivation}
                  className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl bg-rose-500 px-3.5 text-[10px] font-semibold text-white transition hover:bg-rose-600 disabled:cursor-not-allowed disabled:bg-rose-300"
                >
                  <UserX className="size-3.5" />
                  Konfirmasi Nonaktifkan
                </button>
              </div>
            </section>
          </aside>
        )}
      </div>

      <ConfirmDialog
        open={Boolean(activateTarget)}
        title={`Aktifkan akun ${activateTarget?.name ?? ''}?`}
        description="Akun akan kembali dapat masuk ke platform dengan hak akses sebelumnya. Tindakan ini tercatat pada log audit."
        confirmLabel={saving ? 'Memproses…' : 'Aktifkan Akun'}
        confirmDisabled={saving}
        onConfirm={handleConfirmActivate}
        onClose={() => setActivateTarget(null)}
      />

    </div>
  )
}
