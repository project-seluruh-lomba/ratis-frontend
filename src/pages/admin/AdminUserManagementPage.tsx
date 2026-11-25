import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  BadgeCheck,
  Ban,
  Check,
  ChevronDown,
  Copy,
  ChevronLeft,
  ChevronRight,
  Download,
  ExternalLink,
  Lock,
  Mail,
  Monitor,
  Phone,
  RotateCcw,
  Search,
  Send,
  ShieldAlert,
  ShieldCheck,
  ShoppingBag,
  Store,
  User,
  UserCheck,
  UserPlus,
  Users,
  UserX,
  X,
  type LucideIcon,
} from 'lucide-react'
import AdminToast, { type ToastTone } from '../../components/admin/AdminToast'
import ConfirmDialog from '../../components/admin/ConfirmDialog'
import {
  adminUsers,
  type AdminUser,
  type UserRole,
  type UserStatus,
} from '../../lib/admin-user-data'
import { umkmRecords } from '../../lib/admin-umkm-data'

type RoleTab = 'semua' | UserRole
type StatusFilter = 'semua' | UserStatus

type InviteRoleId = 'verifikasi' | 'monitoring' | 'full'

type InviteSuccess = {
  name: string
  email: string
  roleLabel: string
  activationUrl: string
  expiresAt: string
  logId: string
}

type InviteRoleOption = {
  id: InviteRoleId
  name: string
  badge: string
  badgeClass: string
  description: string
  chips: { label: string; dot: string }[]
  icon: LucideIcon
}

const inviteRoleOptions: InviteRoleOption[] = [
  {
    id: 'verifikasi',
    name: 'Operator Verifikasi UMKM',
    badge: 'Rekomendasi Kurator',
    badgeClass: 'bg-emerald-100 text-emerald-700',
    description:
      'Memvalidasi pendaftaran toko UMKM baru, audit kelengkapan NIB & foto fisik gerai, serta menyetujui atau menolak permohonan dengan jejak audit.',
    chips: [
      { label: 'Modul: Kelola UMKM', dot: 'bg-primary' },
      { label: 'Audit Trail Otomatis', dot: 'bg-primary' },
    ],
    icon: BadgeCheck,
  },
  {
    id: 'monitoring',
    name: 'Operator Monitoring Pesanan & Finansial',
    badge: 'Audit View',
    badgeClass: 'bg-slate-200/70 text-slate-500',
    description:
      'Akses pantau arus pesanan, rekonsiliasi dana escrow, dan investigasi komplain pengiriman lintas wilayah tanpa akses ubah saldo merchant.',
    chips: [
      { label: 'Modul: Transaksi & Escrow', dot: 'bg-primary' },
      { label: 'Hak Akses Read-Only', dot: 'bg-primary' },
    ],
    icon: Monitor,
  },
  {
    id: 'full',
    name: 'Admin Operasional Penuh (Full Admin)',
    badge: 'Hak Luas',
    badgeClass: 'bg-rose-100 text-rose-600',
    description:
      'Akses penuh ke seluruh modul operasional, manajemen kategori UMKM, dan perizinan staf. Pengecualian: tidak dapat menghapus akun Superadmin sistem.',
    chips: [
      { label: 'Semua Modul Aktif', dot: 'bg-rose-400' },
      { label: 'Perlu Persetujuan Supervisor', dot: 'bg-rose-400' },
    ],
    icon: ShieldCheck,
  },
]

const granularOptions = [
  { id: 'export', label: 'Izinkan ekspor data laporan (CSV/XLSX)' },
  { id: 'approval', label: 'Aksi sensitif wajib persetujuan supervisor' },
  { id: 'offhours', label: 'Batasi akses di luar jam operasional (08.00–17.00 WIB)' },
]

const PAGE_SIZE = 10

const roleMeta: Record<UserRole, { label: string; badge: string; avatar: string }> = {
  admin: {
    label: 'Superadmin',
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
    'Akun admin akan kehilangan seluruh hak akses panel. Pastikan minimal satu Superadmin tetap aktif sebelum melanjutkan.',
  pemilik:
    'Akun tidak akan bisa login ke dashboard seller. Catatan: Menonaktifkan pemilik tidak otomatis menonaktifkan toko atau membatalkan pesanan berjalan.',
  staf: 'Akun staf tidak akan bisa mengakses dashboard toko. Pemilik tetap dapat mengundang staf pengganti kapan saja.',
  pelanggan:
    'Akun pelanggan tidak akan bisa masuk ke aplikasi. Riwayat pesanan dan saldo tetap tersimpan pada arsip platform.',
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

function getStoreSlug(storeName: string) {
  const match = umkmRecords.find((store) => store.name === storeName)
  if (match) return match.slug

  return storeName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
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
  const [users, setUsers] = useState(adminUsers)
  const [roleTab, setRoleTab] = useState<RoleTab>('semua')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('semua')
  const [keyword, setKeyword] = useState('')
  const [page, setPage] = useState(1)
  const [target, setTarget] = useState<AdminUser | null>(null)
  const [reason, setReason] = useState('')
  const [confirmed, setConfirmed] = useState(false)
  const [activateTarget, setActivateTarget] = useState<AdminUser | null>(null)
  const [inviteOpen, setInviteOpen] = useState(false)
  const [inviteName, setInviteName] = useState('')
  const [inviteEmail, setInviteEmail] = useState('')
  const [invitePhone, setInvitePhone] = useState('')
  const [inviteRole, setInviteRole] = useState<InviteRoleId>('verifikasi')
  const [inviteErrors, setInviteErrors] = useState<{
    name?: string
    email?: string
    phone?: string
  }>({})
  const [granularOpen, setGranularOpen] = useState(false)
  const [granularPermissions, setGranularPermissions] = useState<string[]>([])
  const [inviteSuccess, setInviteSuccess] = useState<InviteSuccess | null>(null)
  const [toast, setToast] = useState<{ message: string; tone: ToastTone } | null>(null)

  function showToast(message: string, tone: ToastTone = 'success') {
    setToast({ message, tone })
    window.setTimeout(() => setToast(null), 4200)
  }

  const roleCounts = useMemo(
    () => ({
      semua: users.length,
      admin: users.filter((user) => user.role === 'admin').length,
      pemilik: users.filter((user) => user.role === 'pemilik').length,
      staf: users.filter((user) => user.role === 'staf').length,
      pelanggan: users.filter((user) => user.role === 'pelanggan').length,
    }),
    [users],
  )

  const suspendedCount = users.filter((user) => user.status === 'nonaktif').length
  const activeAdminCount = users.filter(
    (user) => user.role === 'admin' && user.status === 'aktif',
  ).length
  const suspendedRatio = users.length
    ? (Math.round((suspendedCount / users.length) * 1000) / 10).toLocaleString('id-ID')
    : '0'

  const filteredUsers = useMemo(() => {
    const search = keyword.trim().toLowerCase()

    return users.filter((user) => {
      if (roleTab !== 'semua' && user.role !== roleTab) return false
      if (statusFilter !== 'semua' && user.status !== statusFilter) return false
      if (!search) return true
      return [user.name, user.email, user.phone, user.id, user.storeName ?? ''].some((value) =>
        value.toLowerCase().includes(search),
      )
    })
  }, [users, roleTab, statusFilter, keyword])

  const pageCount = Math.max(1, Math.ceil(filteredUsers.length / PAGE_SIZE))
  const safePage = Math.min(page, pageCount)
  const visibleUsers = filteredUsers.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

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

  function handleConfirmDeactivate() {
    if (!target || reason.trim().length < 10 || !confirmed) return

    setUsers((current) =>
      current.map((user) =>
        user.id === target.id ? { ...user, status: 'nonaktif', online: false } : user,
      ),
    )
    showToast(
      `Akun ${target.name} dinonaktifkan. Alasan tersimpan pada log audit platform.`,
      'success',
    )
    closeDeactivate()
  }

  function handleConfirmActivate() {
    if (!activateTarget) return

    setUsers((current) =>
      current.map((user) =>
        user.id === activateTarget.id ? { ...user, status: 'aktif' } : user,
      ),
    )
    showToast(`Akun ${activateTarget.name} berhasil diaktifkan kembali.`, 'success')
    setActivateTarget(null)
  }

  function handleResetFilters() {
    setRoleTab('semua')
    setStatusFilter('semua')
    setKeyword('')
    setPage(1)
  }

  function handleExportCsv() {
    const rows = [
      ['ID Pengguna', 'Nama', 'Email', 'Telepon', 'Role', 'Status', 'Toko', 'Terdaftar', 'Aktivitas'],
      ...filteredUsers.map((user) => [
        user.id,
        user.name,
        user.email,
        user.phone,
        roleMeta[user.role].label,
        user.status === 'aktif' ? 'Aktif' : 'Nonaktif',
        user.storeName ?? '-',
        dateFormatter.format(new Date(user.joinedAt)),
        user.lastActive,
      ]),
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
    showToast(`${numberFormatter.format(filteredUsers.length)} pengguna diekspor ke CSV.`)
  }

  function openInvite() {
    setInviteName('')
    setInviteEmail('')
    setInvitePhone('')
    setInviteRole('verifikasi')
    setInviteErrors({})
    setGranularOpen(false)
    setGranularPermissions([])
    setInviteOpen(true)
  }

  function closeInvite() {
    setInviteOpen(false)
    setInviteErrors({})
  }

  function handleSendInvite() {
    const nextErrors: typeof inviteErrors = {}
    const email = inviteEmail.trim().toLowerCase()

    if (inviteName.trim().length < 3) {
      nextErrors.name = 'Nama lengkap minimal 3 karakter sesuai identitas resmi.'
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      nextErrors.email = 'Masukkan alamat email dinas yang valid, contoh: operator@ratis.id'
    }
    if (invitePhone.replace(/\D/g, '').length < 8) {
      nextErrors.phone = 'Nomor WhatsApp minimal 8 digit angka.'
    }

    setInviteErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    const roleLabel =
      inviteRoleOptions.find((option) => option.id === inviteRole)?.name ?? 'Operator'
    const token = Array.from(crypto.getRandomValues(new Uint8Array(6)))
      .map((byte) => byte.toString(16).padStart(2, '0'))
      .join('')
    const expiresAt = new Intl.DateTimeFormat('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Jakarta',
    }).format(new Date(Date.now() + 24 * 60 * 60 * 1000))
    const logId = `#LOG-AUTH-${Math.floor(100000 + Math.random() * 900000)}`

    setInviteSuccess({
      name: inviteName.trim(),
      email,
      roleLabel,
      activationUrl: `https://admin.ratis.id/auth/activate?token=rt_${token}`,
      expiresAt: `${expiresAt} WIB`,
      logId,
    })
    setInviteOpen(false)
  }

  function handleCopyActivation() {
    if (!inviteSuccess) return
    void navigator.clipboard.writeText(inviteSuccess.activationUrl).then(() => {
      showToast('Tautan aktivasi manual disalin ke clipboard.')
    })
  }

  function toggleGranular(id: string) {
    setGranularPermissions((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    )
  }

  const canSubmitDeactivation = reason.trim().length >= 10 && confirmed

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
            Manajemen hak akses akun, audit otentikasi identitas, dan tata kelola keamanan seluruh
            pengguna ekosistem Ratis.
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
          <button
            type="button"
            onClick={openInvite}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-[11px] font-semibold text-white transition hover:bg-primary-hover"
          >
            <UserPlus className="size-4" />
            Undang Operator
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
            <span className="text-[9px] font-semibold text-emerald-600">+8% bln ini</span>
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
            <span className="text-[9px] font-bold text-emerald-600">Terverifikasi</span>
          </div>
          <p className="mt-auto border-t border-line pt-2 text-[9px] leading-relaxed text-muted">
            Pengelola toko aktif
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
            <span className="text-[9px] font-semibold text-emerald-600">+114 minggu ini</span>
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
            Pelanggaran regulasi/SLA
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
                  placeholder="Cari nama, email, atau nomor telepon..."
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
                  <th className="px-3 py-3 font-bold">Kontak &amp; Keamanan</th>
                  <th className="px-3 py-3 font-bold">Role Akun</th>
                  <th className="px-3 py-3 font-bold">Toko Terkait</th>
                  <th className="px-3 py-3 font-bold">Status</th>
                  <th className="px-3 py-3 font-bold">Terdaftar</th>
                  <th className="px-4 py-3 text-right font-bold">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {visibleUsers.length === 0 ? (
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
                              <p className="flex items-center gap-1 truncate text-[11px] font-bold text-ink">
                                {user.name}
                                {user.online && (
                                  <span
                                    className="size-1.5 shrink-0 rounded-full bg-emerald-500"
                                    title="Sedang online"
                                  />
                                )}
                              </p>
                              <p className="truncate text-[9px] text-slate-400">{user.id}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-3">
                          <p className="flex items-center gap-1 text-[10px] text-slate-600">
                            <span className="truncate">{user.email}</span>
                            {user.verified ? (
                              <ShieldCheck
                                className="size-3 shrink-0 text-emerald-500"
                                aria-label="Email terverifikasi"
                              />
                            ) : (
                              <ShieldAlert
                                className="size-3 shrink-0 text-amber-500"
                                aria-label="Email belum terverifikasi"
                              />
                            )}
                          </p>
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
                            <span className="flex max-w-[150px] items-center gap-1 text-[10px] text-slate-600">
                              <Store className="size-3 shrink-0 text-slate-400" />
                              <span className="truncate">{user.storeName}</span>
                            </span>
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
                {filteredUsers.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1}-
                {Math.min(safePage * PAGE_SIZE, filteredUsers.length)}
              </span>{' '}
              dari{' '}
              <span className="font-semibold text-ink">
                {numberFormatter.format(filteredUsers.length)}
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
                  <Link
                    to={`/admin/kelola-pengguna/toko-terkait/${getStoreSlug(target.storeName)}`}
                    className="inline-flex shrink-0 items-center gap-1 text-[9px] font-semibold text-primary transition hover:text-primary-hover"
                  >
                    Lihat Toko Terkait
                    <ExternalLink className="size-2.5" />
                  </Link>
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
                  Saya mengonfirmasi bahwa tindakan ini telah diverifikasi dan dicatat pada lembar
                  kepatuhan platform Ratis.
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
        confirmLabel="Aktifkan Akun"
        onConfirm={handleConfirmActivate}
        onClose={() => setActivateTarget(null)}
      />

      {inviteOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={closeInvite}
            aria-hidden
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Undang operator baru"
            className="relative flex max-h-[92vh] w-full max-w-[720px] flex-col overflow-hidden rounded-[20px] border border-line bg-white shadow-[0_16px_40px_rgba(15,23,42,0.16)]"
          >
            <div className="h-1 w-full shrink-0 bg-gradient-to-r from-primary via-primary/70 to-primary/20" />

            <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-5 pt-5">
              <button
                type="button"
                onClick={closeInvite}
                aria-label="Tutup dialog undang operator"
                className="absolute right-4 top-5 flex size-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="size-4" />
              </button>

              <div className="flex items-start gap-3 pr-8">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
                  <UserPlus className="size-5" />
                </span>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-[22px] font-extrabold tracking-tight text-ink">
                      Undang Operator Baru
                    </h2>
                    <span className="rounded-md bg-primary-soft/80 px-2 py-0.5 text-[8px] font-bold uppercase leading-tight tracking-[0.16em] text-primary">
                      Internal
                      <br />
                      Ratis
                    </span>
                  </div>
                  <p className="mt-1 max-w-lg text-[11px] leading-relaxed text-muted">
                    Kirim undangan akses tim operasional platform Ratis dengan perizinan peran
                    berbasis Role-Based Access Control (RBAC).
                  </p>
                </div>
              </div>

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="invite-name" className="text-[10px] font-bold text-ink">
                    Nama Lengkap <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative mt-1.5">
                    <User className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-slate-400" />
                    <input
                      id="invite-name"
                      type="text"
                      value={inviteName}
                      onChange={(event) => {
                        setInviteName(event.target.value)
                        setInviteErrors((current) => ({ ...current, name: undefined }))
                      }}
                      placeholder="e.g., Rizky Ramadhan, S.Kom."
                      className="h-10 w-full rounded-xl border border-line bg-[#f7f7fb] pl-9 pr-3 text-[11px] text-ink outline-none transition placeholder:text-slate-400 focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10"
                    />
                  </div>
                  {inviteErrors.name ? (
                    <p className="mt-1 text-[9px] font-medium text-rose-600">{inviteErrors.name}</p>
                  ) : (
                    <p className="mt-1 text-[9px] leading-relaxed text-muted">
                      Sesuai nama identitas KTP resmi operasional.
                    </p>
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between gap-2">
                    <label htmlFor="invite-email" className="text-[10px] font-bold text-ink">
                      Email Dinas / Resmi <span className="text-rose-500">*</span>
                    </label>
                    <span className="rounded bg-rose-100 px-1.5 py-0.5 text-[7px] font-bold uppercase tracking-wider text-rose-600">
                      Wajib
                    </span>
                  </div>
                  <div className="relative mt-1.5">
                    <Mail className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-slate-400" />
                    <input
                      id="invite-email"
                      type="email"
                      value={inviteEmail}
                      onChange={(event) => {
                        setInviteEmail(event.target.value)
                        setInviteErrors((current) => ({ ...current, email: undefined }))
                      }}
                      placeholder="operator@ratis.id atau nama@dinasumkm.go.id"
                      className="h-10 w-full rounded-xl border border-line bg-[#f7f7fb] pl-9 pr-3 text-[11px] text-ink outline-none transition placeholder:text-slate-400 focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10"
                    />
                  </div>
                  {inviteErrors.email ? (
                    <p className="mt-1 text-[9px] font-medium text-rose-600">{inviteErrors.email}</p>
                  ) : (
                    <p className="mt-1 text-[9px] leading-relaxed text-muted">
                      Tautan aktivasi dikirim ke alamat ini (berlaku 24 jam).
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <label htmlFor="invite-phone" className="text-[10px] font-bold text-ink">
                    Nomor Kontak / WhatsApp Operasional
                  </label>
                  <span className="text-[8px] text-slate-400">Autentikasi 2FA SMS/WA</span>
                </div>
                <div className="mt-1.5 flex">
                  <span className="flex h-10 shrink-0 items-center gap-1 rounded-l-xl border border-r-0 border-line bg-[#f1f1f7] px-2.5 text-[10px] font-semibold text-slate-500">
                    ID <span className="text-slate-400">+62</span>
                  </span>
                  <div className="relative min-w-0 flex-1">
                    <Phone className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-slate-400" />
                    <input
                      id="invite-phone"
                      type="tel"
                      value={invitePhone}
                      onChange={(event) => {
                        setInvitePhone(event.target.value)
                        setInviteErrors((current) => ({ ...current, phone: undefined }))
                      }}
                      placeholder="812-3456-7890"
                      className="h-10 w-full rounded-r-xl border border-line bg-[#f7f7fb] pl-9 pr-3 text-[11px] text-ink outline-none transition placeholder:text-slate-400 focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10"
                    />
                  </div>
                </div>
                {inviteErrors.phone && (
                  <p className="mt-1 text-[9px] font-medium text-rose-600">{inviteErrors.phone}</p>
                )}
              </div>

              <div className="mt-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-[11px] font-bold text-ink">Tentukan Peran Akun (RBAC Role)</p>
                  <span className="inline-flex items-center gap-1 text-[9px] font-semibold text-primary">
                    <ShieldCheck className="size-3" />
                    3 Pilihan
                  </span>
                </div>
                <p className="mt-0.5 text-[9px] text-muted">
                  Pilih tingkat hak akses operasional yang relevan dengan tugas harian.
                </p>

                <div className="mt-2 space-y-2">
                  {inviteRoleOptions.map((option) => {
                    const selected = inviteRole === option.id
                    const RoleIcon = option.icon
                    return (
                      <label
                        key={option.id}
                        className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition ${
                          selected
                            ? 'border-primary/40 bg-primary-soft/40 ring-1 ring-primary/20'
                            : 'border-line bg-[#f8f8fc] hover:border-slate-300'
                        }`}
                      >
                        <input
                          type="radio"
                          name="invite-role"
                          value={option.id}
                          checked={selected}
                          onChange={() => setInviteRole(option.id)}
                          className="sr-only"
                        />
                        <span
                          className={`mt-1 flex size-4 shrink-0 items-center justify-center rounded-full border bg-white ${
                            selected ? 'border-primary' : 'border-slate-300'
                          }`}
                        >
                          {selected && <span className="size-2 rounded-full bg-primary" />}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                            <span className="text-[11px] font-bold text-ink">{option.name}</span>
                            <span
                              className={`rounded-full px-1.5 py-0.5 text-[7px] font-bold ${option.badgeClass}`}
                            >
                              {option.badge}
                            </span>
                          </div>
                          <p className="mt-1 text-[9px] leading-relaxed text-muted">
                            {option.description}
                          </p>
                          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
                            {option.chips.map((chip) => (
                              <span
                                key={chip.label}
                                className="inline-flex items-center gap-1 text-[8px] font-medium text-slate-500"
                              >
                                <span className={`size-1 rounded-full ${chip.dot}`} />
                                {chip.label}
                              </span>
                            ))}
                          </div>
                        </div>
                        <span className="mt-0.5 shrink-0">
                          {selected ? (
                            <span className="flex size-4 items-center justify-center rounded-[4px] bg-primary text-white">
                              <Check className="size-3" />
                            </span>
                          ) : (
                            <RoleIcon className="size-3.5 text-slate-400" />
                          )}
                        </span>
                      </label>
                    )
                  })}
                </div>
              </div>

              <div className="mt-4 rounded-xl border border-line bg-[#f8f8fc]">
                <button
                  type="button"
                  onClick={() => setGranularOpen((value) => !value)}
                  aria-expanded={granularOpen}
                  className="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left"
                >
                  <span className="text-[10px] font-bold text-ink">
                    Izin Granular &amp; Pembatasan Kunci
                  </span>
                  <span className="inline-flex items-center gap-1 text-[9px] font-semibold text-slate-500">
                    Konfigurasi Hak Khusus
                    <ChevronDown
                      className={`size-3 transition ${granularOpen ? 'rotate-180' : ''}`}
                    />
                  </span>
                </button>

                {granularOpen && (
                  <div className="space-y-2 border-t border-line px-3 py-2.5">
                    {granularOptions.map((permission) => {
                      const checked = granularPermissions.includes(permission.id)
                      return (
                        <label
                          key={permission.id}
                          className="flex cursor-pointer items-start gap-2 text-[9px] leading-relaxed text-slate-600"
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleGranular(permission.id)}
                            className="sr-only"
                          />
                          <span
                            className={`mt-0.5 flex size-3.5 shrink-0 items-center justify-center rounded border ${
                              checked ? 'border-primary bg-primary text-white' : 'border-slate-300 bg-white'
                            }`}
                          >
                            {checked && <Check className="size-2.5" />}
                          </span>
                          {permission.label}
                        </label>
                      )
                    })}
                  </div>
                )}
              </div>

              <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
                <span className="inline-flex items-center gap-1.5 text-[9px] text-slate-400">
                  <Lock className="size-3" />
                  Transmisi TLS 1.3 Terenkripsi
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={closeInvite}
                    className="inline-flex h-10 items-center justify-center rounded-xl border border-line bg-white px-4 text-[10px] font-semibold text-slate-600 transition hover:bg-slate-50"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={handleSendInvite}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-[10px] font-semibold text-white transition hover:bg-primary-hover"
                  >
                    <Send className="size-3.5" />
                    Kirim Tautan Undangan
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {inviteSuccess && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => setInviteSuccess(null)}
            aria-hidden
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Undangan operator berhasil dikirim"
            className="relative max-h-[92vh] w-full max-w-[560px] overflow-y-auto rounded-[20px] border border-line bg-white px-7 py-8 shadow-[0_16px_40px_rgba(15,23,42,0.16)]"
          >
            <div className="flex flex-col items-center text-center">
              <div className="relative">
                <span className="flex size-[76px] items-center justify-center rounded-full bg-primary-soft/50">
                  <span className="flex size-[52px] items-center justify-center rounded-full bg-primary">
                    <Check className="size-6 text-white" />
                  </span>
                </span>
                <span className="absolute -right-0.5 -top-0.5 flex size-6 items-center justify-center rounded-full border-2 border-white bg-primary text-white">
                  <ShieldCheck className="size-3.5" />
                </span>
              </div>

              <p className="mt-4 text-[8px] font-bold uppercase tracking-[0.28em] text-muted">
                Autentikasi Akses
              </p>
              <p className="mt-0.5 text-[8px] font-bold uppercase tracking-[0.28em] text-slate-400">
                Baru
              </p>
              <h2 className="mt-1 text-[23px] font-extrabold leading-tight tracking-tight text-ink">
                Undangan Operator Berhasil Dikirim
              </h2>
              <p className="mt-2 max-w-md text-[10px] leading-relaxed text-muted">
                Email formal sistem Ratis telah terkirim beserta token otorisasi role operator
                terbatas waktu.
              </p>
            </div>

            <div className="mt-5 space-y-2 rounded-xl bg-[#f5f4fd] px-4 py-3.5">
              <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-0.5">
                <span className="text-[9px] text-slate-500">Penerima Undangan</span>
                <span className="text-right text-[10px] font-semibold text-ink">
                  {inviteSuccess.name}{' '}
                  <span className="font-normal text-slate-400">({inviteSuccess.email})</span>
                </span>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                <span className="text-[9px] text-slate-500">Peran Akses (RBAC)</span>
                <span className="inline-flex items-center gap-1 rounded-full bg-primary px-2 py-0.5 text-[8px] font-semibold text-white">
                  <span className="size-1 rounded-full bg-white/90" />
                  {inviteSuccess.roleLabel}
                </span>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                <span className="text-[9px] text-slate-500">Masa Berlaku Token</span>
                <span className="text-[9px] font-semibold text-ink">
                  24 Jam (Besok, {inviteSuccess.expiresAt})
                </span>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                <span className="text-[9px] text-slate-500">Status Akun Saat Ini</span>
                <span className="rounded-full bg-[#d7f3e8] px-2 py-0.5 text-[8px] font-semibold text-primary">
                  Menunggu Aktivasi
                </span>
              </div>
            </div>

            <p className="mt-4 text-[9px] text-slate-500">
              Salin Tautan Aktivasi Manual (Alternatif Kanal Pesan)
            </p>
            <div className="mt-1 flex items-center gap-2 rounded-xl border border-line bg-[#f5f4fd] p-1.5">
              <span className="min-w-0 flex-1 truncate px-1.5 font-mono text-[9px] text-slate-500">
                {inviteSuccess.activationUrl}
              </span>
              <button
                type="button"
                onClick={handleCopyActivation}
                className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg bg-[#e4e1f7] px-2.5 text-[9px] font-semibold text-slate-700 transition hover:bg-[#d9d5f3]"
              >
                <Copy className="size-3" />
                Salin Tautan
              </button>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setInviteSuccess(null)
                  openInvite()
                }}
                className="inline-flex h-10 items-center justify-center rounded-xl bg-[#f2f1fb] px-3 text-[10px] font-semibold text-slate-700 transition hover:bg-[#e8e6f6]"
              >
                Undang Operator Lain
              </button>
              <button
                type="button"
                onClick={() => setInviteSuccess(null)}
                className="inline-flex h-10 items-center justify-center rounded-xl bg-primary px-3 text-[10px] font-semibold text-white transition hover:bg-primary-hover"
              >
                Selesai &amp; Kelola Direktori
              </button>
            </div>

            <p className="mt-4 flex items-center justify-center gap-1.5 text-center text-[8px] text-slate-400">
              <RotateCcw className="size-3 shrink-0" />
              Penerbitan kredensial dicatat pada log audit keamanan institusi{' '}
              {inviteSuccess.logId}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
