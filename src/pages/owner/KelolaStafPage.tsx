import { useState, type ComponentType, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import {
  Briefcase,
  CheckCircle2,
  ChefHat,
  ChevronDown,
  Eye,
  Home,
  Info,
  KeyRound,
  LockKeyhole,
  Mail,
  Pencil,
  Phone,
  RotateCw,
  ScrollText,
  Search,
  ShieldCheck,
  TrendingUp,
  UserCheck,
  UserPlus,
  Users,
  UserX,
  XCircle,
} from 'lucide-react'
import OwnerAddStaffModal from '../../components/owner/OwnerAddStaffModal'
import { getOwnerSession } from '../../lib/owner-auth'
import {
  getOwnerStaff,
  staffAvatarMeta,
  staffQuota,
  staffStatusMeta,
  updateOwnerStaffStatus,
  type StaffMember,
  type StaffRole,
} from '../../lib/owner-staff-data'

function SummaryCard({
  title,
  value,
  icon: Icon,
  children,
}: {
  title: string
  value: string
  icon: ComponentType<{ className?: string }>
  children: ReactNode
}) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-2xl border border-line bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.06)]">
      <div className="min-w-0">
        <p className="text-[12px] font-semibold text-slate-500">{title}</p>
        <p className="mt-2 text-[24px] font-extrabold leading-tight text-ink">{value}</p>
        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10.5px] font-medium text-slate-500">
          {children}
        </div>
      </div>
      <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[#e8f4f1] text-primary">
        <Icon className="size-5" />
      </span>
    </div>
  )
}

function StaffActions({
  staff,
  onToggle,
}: {
  staff: StaffMember
  onToggle: (staff: StaffMember) => void
}) {
  if (staff.status === 'Nonaktif') {
    return (
      <div className="flex items-center justify-end gap-1.5">
        <Link
          to={`/owner/kelola-staf/detail-staf/${staff.id}`}
          title="Lihat detail staf"
          aria-label={`Lihat detail ${staff.name}`}
          className="flex size-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-ink"
        >
          <Eye className="size-4" />
        </Link>
        <button
          type="button"
          onClick={() => onToggle(staff)}
          className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-[#eef2ff] px-2.5 text-[10.5px] font-semibold text-[#3b5bdb] transition hover:bg-[#e0e7ff]"
        >
          <UserCheck className="size-3.5" />
          Aktifkan
        </button>
        <button
          type="button"
          title="Lihat jejak audit"
          aria-label={`Lihat jejak audit ${staff.name}`}
          className="flex size-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-ink"
        >
          <ScrollText className="size-4" />
        </button>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-end gap-0.5">
      <Link
        to={`/owner/kelola-staf/detail-staf/${staff.id}`}
        title="Lihat detail staf"
        aria-label={`Lihat detail ${staff.name}`}
        className="flex size-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-ink"
      >
        <Eye className="size-4" />
      </Link>
      <button
        type="button"
        title="Reset sandi"
        aria-label={`Reset sandi ${staff.name}`}
        className="flex size-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-ink"
      >
        <KeyRound className="size-4" />
      </button>
      <button
        type="button"
        title="Ubah staf"
        aria-label={`Ubah data ${staff.name}`}
        className="flex size-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-ink"
      >
        <Pencil className="size-4" />
      </button>
      <button
        type="button"
        onClick={() => onToggle(staff)}
        title="Nonaktifkan akses"
        aria-label={`Nonaktifkan akses ${staff.name}`}
        className="flex size-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-red-50 hover:text-red-600"
      >
        <UserX className="size-4" />
      </button>
    </div>
  )
}

function StaffAccessChips({ staff }: { staff: StaffMember }) {
  const modules = staff.status === 'Nonaktif' ? ['Akses Dicabut'] : staff.access

  return (
    <div className="flex max-w-[240px] flex-wrap gap-1.5">
      {modules.map((module) => (
        <span
          key={module}
          className={`rounded-full px-2.5 py-1 text-[10.5px] font-medium ${
            module === 'Akses Dicabut'
              ? 'bg-slate-100 text-slate-500'
              : 'bg-[#eef2ff] text-slate-600'
          }`}
        >
          {module}
        </span>
      ))}
    </div>
  )
}

export default function KelolaStafPage() {
  const [session] = useState(getOwnerSession)
  const [staffList, setStaffList] = useState<StaffMember[]>(getOwnerStaff)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedStatus, setSelectedStatus] = useState<'All' | StaffMember['status']>('All')
  const [selectedRole, setSelectedRole] = useState<'All' | StaffRole>('All')
  const [pendingStaff, setPendingStaff] = useState<StaffMember | null>(null)
  const [addStaffOpen, setAddStaffOpen] = useState(false)

  const storeName = session?.storeName ?? 'Dapur Bu Sari'
  const totalStaff = staffList.length
  const activeStaff = staffList.filter((staff) => staff.status === 'Aktif').length
  const inactiveStaff = totalStaff - activeStaff
  const quota = staffQuota
  const availableSlots = Math.max(0, quota - activeStaff)
  const quotaProgress = Math.min(100, Math.round((activeStaff / quota) * 100))
  const activeRoles = new Set(
    staffList.filter((staff) => staff.status === 'Aktif').map((staff) => staff.role),
  ).size
  const cashierPackingCount = staffList.filter(
    (staff) =>
      staff.status === 'Aktif' &&
      (staff.role.includes('Kasir') || staff.role.includes('Packing')),
  ).length
  const kitchenCount = staffList.filter(
    (staff) => staff.status === 'Aktif' && staff.role.includes('Dapur'),
  ).length
  const atLimit = activeStaff >= quota

  const filteredStaff = staffList.filter((staff) => {
    const keyword = searchQuery.toLowerCase()
    const matchesSearch =
      staff.name.toLowerCase().includes(keyword) ||
      staff.email.toLowerCase().includes(keyword) ||
      staff.phone.toLowerCase().includes(keyword)
    const matchesStatus = selectedStatus === 'All' || staff.status === selectedStatus
    const matchesRole = selectedRole === 'All' || staff.role === selectedRole

    return matchesSearch && matchesStatus && matchesRole
  })

  function resetFilters() {
    setSearchQuery('')
    setSelectedStatus('All')
    setSelectedRole('All')
  }

  function confirmToggleStatus() {
    if (!pendingStaff) return

    updateOwnerStaffStatus(
      pendingStaff.id,
      pendingStaff.status === 'Aktif' ? 'Nonaktif' : 'Aktif',
    )
    setStaffList(getOwnerStaff())
    setPendingStaff(null)
  }

  return (
    <div>
      <header>
        <nav className="flex flex-wrap items-center gap-2 text-[11px] font-medium text-slate-500">
          <Link
            to="/owner/dashboard"
            className="flex items-center gap-1.5 transition hover:text-primary"
          >
            <Home className="size-3.5" />
            Ratis Bisnis
          </Link>
          <span className="text-slate-300">/</span>
          <Link to="/owner/pengaturan-usaha" className="transition hover:text-primary">
            Pengaturan Usaha
          </Link>
          <span className="text-slate-300">/</span>
          <span className="font-medium text-ink">Staf Toko</span>
        </nav>

        <div className="mt-4 flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <h1 className="text-[26px] font-extrabold tracking-tight text-ink sm:text-[28px]">
              Manajemen Staf Toko
            </h1>
            <p className="mt-1.5 max-w-2xl text-[13px] leading-relaxed text-slate-500">
              Bantu delegasi operasional harian dapur dan kasir dengan pembatasan hak akses
              yang aman.
            </p>
          </div>

          <div className="flex w-full flex-col gap-3 lg:w-auto lg:items-end">
            <div className="flex w-full items-center gap-4 rounded-2xl border border-line bg-white px-4 py-3 lg:w-[340px]">
              <div className="min-w-0 flex-1">
                <p className="text-[12px] font-semibold text-slate-600">
                  {activeStaff} dari {quota} Kuota Digunakan
                </p>
                <div className="mt-2 flex items-center gap-3">
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{ width: `${quotaProgress}%` }}
                    />
                  </div>
                  <span className="shrink-0 rounded-full bg-primary-soft/60 px-2 py-0.5 text-[10px] font-bold text-primary">
                    {availableSlots} Slot Tersedia
                  </span>
                </div>
              </div>
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#eef2ff] text-slate-500">
                <Users className="size-5" />
              </span>
            </div>

            {atLimit ? (
              <button
                type="button"
                disabled
                title="Batas maksimal 5 staf aktif tercapai"
                className="inline-flex h-11 cursor-not-allowed items-center justify-center gap-2 rounded-xl bg-slate-300 px-5 text-[13px] font-semibold text-white"
              >
                <UserPlus className="size-4" />
                Tambah Staf Baru
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setAddStaffOpen(true)}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-[13px] font-semibold text-white shadow-sm transition hover:bg-primary-hover"
              >
                <UserPlus className="size-4" />
                Tambah Staf Baru
              </button>
            )}
          </div>
        </div>
      </header>

      <div className="mt-6 space-y-5">
        <section className="rounded-2xl bg-[#e7f4f1] p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#0b4f4a] text-white">
              <ShieldCheck className="size-5" />
            </span>
            <div>
              <h2 className="text-[15px] font-bold text-primary">
                Matriks Batasan Hak Akses Staf {storeName}
              </h2>
              <p className="mt-1 text-[11.5px] leading-relaxed text-slate-500">
                Dirancang khusus untuk UMKM agar operasional lancar tanpa membocorkan rahasia
                keuangan usaha.
              </p>
            </div>
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <div className="rounded-xl bg-white p-5">
              <h3 className="flex items-center gap-2 text-[13px] font-semibold text-slate-700">
                <CheckCircle2 className="size-4 text-primary" />
                Fitur yang Dapat Diakses Staf
              </h3>
              <ul className="mt-3 space-y-2.5 text-[12.5px] leading-relaxed text-slate-600">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-emerald-500" />
                  <span>Memproses &amp; mengemas pesanan pelanggan (POS &amp; Storefront online)</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-emerald-500" />
                  <span>Menyesuaikan stok dapur &amp; mencatat alasan restock / barang rusak</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-emerald-500" />
                  <span>Melihat katalog produk aktif dan harga satuan</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-emerald-500" />
                  <span>Menerima notifikasi pesanan baru secara real-time</span>
                </li>
              </ul>
            </div>

            <div className="rounded-xl bg-white p-5">
              <h3 className="flex items-center gap-2 text-[13px] font-semibold text-slate-700">
                <LockKeyhole className="size-4 text-red-500" />
                Khusus Akses Pemilik Toko (Terkunci)
              </h3>
              <ul className="mt-3 space-y-2.5 text-[12.5px] leading-relaxed text-slate-600">
                <li className="flex items-start gap-2">
                  <XCircle className="mt-0.5 size-3.5 shrink-0 text-red-500" />
                  <span>Tidak dapat melihat ringkasan keuangan, mutasi kas, atau omzet toko (Akses 403)</span>
                </li>
                <li className="flex items-start gap-2">
                  <XCircle className="mt-0.5 size-3.5 shrink-0 text-red-500" />
                  <span>Tidak dapat mengubah profil toko, rekening bank pencairan, atau legalitas NIB</span>
                </li>
                <li className="flex items-start gap-2">
                  <XCircle className="mt-0.5 size-3.5 shrink-0 text-red-500" />
                  <span>Tidak dapat mengunduh laporan penjualan &amp; ekspor data CSV toko</span>
                </li>
                <li className="flex items-start gap-2">
                  <XCircle className="mt-0.5 size-3.5 shrink-0 text-red-500" />
                  <span>Tidak dapat menambah atau menonaktifkan akun staf lainnya</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <SummaryCard title="Total Staf Terdaftar" value={`${totalStaff} Orang`} icon={Users}>
            <span className="inline-flex items-center gap-1.5">
              <span className="size-1.5 rounded-full bg-emerald-500" />
              {activeStaff} Aktif
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="size-1.5 rounded-full bg-slate-400" />
              {inactiveStaff} Nonaktif
            </span>
          </SummaryCard>

          <SummaryCard title="Peran Operasional" value={`${activeRoles} Posisi`} icon={Briefcase}>
            <span className="inline-flex items-center gap-1.5">
              <span className="size-1.5 rounded-full bg-emerald-500" />
              {cashierPackingCount} Kasir &amp; Packing
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="size-1.5 rounded-full bg-emerald-500" />
              {kitchenCount} Tim Dapur &amp; Stok
            </span>
          </SummaryCard>

          <SummaryCard title="Pesanan Ditangani Hari Ini" value="28 Pesanan" icon={ChefHat}>
            <span className="inline-flex items-center gap-1.5 text-primary">
              <TrendingUp className="size-3" />
              100% diproses staf tepat waktu
            </span>
          </SummaryCard>
        </section>

        <section className="flex flex-col gap-3 rounded-2xl border border-line bg-white p-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari nama staf atau email operasional..."
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="h-11 w-full rounded-xl border border-transparent bg-[#f7f9fc] pl-10 pr-4 text-[13px] text-ink outline-none transition placeholder:text-slate-400 focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <select
                value={selectedStatus}
                onChange={(event) =>
                  setSelectedStatus(event.target.value as typeof selectedStatus)
                }
                className="h-11 appearance-none rounded-xl border border-line bg-white pl-4 pr-9 text-[12px] font-medium text-slate-600 outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
              >
                <option value="All">Semua Status ({totalStaff})</option>
                <option value="Aktif">Aktif</option>
                <option value="Nonaktif">Nonaktif</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-3.5 -translate-y-1/2 text-slate-500" />
            </div>

            <div className="relative">
              <select
                value={selectedRole}
                onChange={(event) => setSelectedRole(event.target.value as typeof selectedRole)}
                className="h-11 max-w-[230px] appearance-none rounded-xl border border-line bg-white pl-4 pr-9 text-[12px] font-medium text-slate-600 outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
              >
                <option value="All">Semua Peran Operasional</option>
                {Array.from(new Set(staffList.map((staff) => staff.role))).map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-3.5 -translate-y-1/2 text-slate-500" />
            </div>

            <button
              type="button"
              onClick={resetFilters}
              title="Muat ulang data"
              aria-label="Muat ulang data staf"
              className="flex size-11 items-center justify-center rounded-full border border-line bg-white text-slate-500 transition hover:bg-slate-50 hover:text-ink"
            >
              <RotateCw className="size-4" />
            </button>
          </div>
        </section>

        {filteredStaff.length === 0 ? (
          <section className="rounded-2xl border border-line bg-white px-6 py-14 text-center">
            <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
              <Users className="size-6" />
            </span>
            <p className="mt-3 text-sm font-semibold text-ink">Staf tidak ditemukan</p>
            <p className="mt-1 text-[12px] text-slate-500">
              Coba ubah kata kunci atau filter yang dipilih.
            </p>
            <button
              type="button"
              onClick={resetFilters}
              className="mt-4 inline-flex h-9 items-center gap-2 rounded-xl bg-primary px-4 text-[12px] font-semibold text-white transition hover:bg-primary-hover"
            >
              <RotateCw className="size-3.5" />
              Reset Filter
            </button>
          </section>
        ) : (
          <section className="overflow-hidden rounded-2xl border border-line bg-white shadow-[0_1px_2px_rgba(15,23,42,0.06)]">
            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full min-w-[1100px] text-left">
                <thead className="border-b border-line bg-[#f8fafc]">
                  <tr className="text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-500">
                    <th className="px-5 py-3.5">Staf &amp; Kontak</th>
                    <th className="px-5 py-3.5">Peran Operasional</th>
                    <th className="px-5 py-3.5">Hak Akses Modul</th>
                    <th className="px-5 py-3.5">Terakhir Aktif</th>
                    <th className="px-5 py-3.5">Status Akun</th>
                    <th className="px-5 py-3.5 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {filteredStaff.map((staff) => (
                    <tr key={staff.id} className="align-middle transition hover:bg-slate-50/60">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <span
                            className={`flex size-11 shrink-0 items-center justify-center rounded-full text-[12px] font-bold ${staffAvatarMeta[staff.avatarColor]}`}
                          >
                            {staff.avatarInitials}
                          </span>
                          <div className="min-w-0">
                            <Link
                              to={`/owner/kelola-staf/detail-staf/${staff.id}`}
                              className="text-[14px] font-semibold text-ink transition hover:text-primary"
                            >
                              {staff.name}
                            </Link>
                            <p className="mt-1 flex items-center gap-1.5 text-[11px] text-slate-500">
                              <Mail className="size-3 shrink-0" />
                              {staff.email}
                            </p>
                            <p className="mt-0.5 flex items-center gap-1.5 text-[11px] text-slate-500">
                              <Phone className="size-3 shrink-0" />
                              {staff.phone}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className="inline-flex items-center gap-1.5 rounded-lg bg-[#eef2ff] px-2.5 py-1.5 text-[11px] font-medium text-slate-600">
                          <Briefcase className="size-3.5 text-slate-500" />
                          {staff.role}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <StaffAccessChips staff={staff} />
                      </td>
                      <td className="px-5 py-4">
                        <p className="flex items-center gap-1.5 text-[12px] font-semibold text-slate-700">
                          {staff.status === 'Aktif' && staff.lastActive.startsWith('Sedang Aktif') ? (
                            <span className="size-1.5 shrink-0 rounded-full bg-emerald-500" />
                          ) : null}
                          {staff.lastActive}
                        </p>
                        {staff.lastActiveDevice ? (
                          <p className="mt-1 text-[10.5px] text-slate-500">
                            {staff.lastActiveDevice}
                          </p>
                        ) : null}
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10.5px] font-semibold ${staffStatusMeta[staff.status].badge}`}
                        >
                          <span className={`size-1.5 rounded-full ${staffStatusMeta[staff.status].dot}`} />
                          {staff.status}
                        </span>
                        {staff.status === 'Nonaktif' ? (
                          <p className="mt-1.5 text-[10px] font-medium text-red-500">
                            Akun Dinonaktifkan
                          </p>
                        ) : null}
                      </td>
                      <td className="px-5 py-4">
                        <StaffActions staff={staff} onToggle={setPendingStaff} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="divide-y divide-line lg:hidden">
              {filteredStaff.map((staff) => (
                <div key={staff.id} className="p-4">
                  <div className="flex items-start gap-3">
                    <span
                      className={`flex size-11 shrink-0 items-center justify-center rounded-full text-[12px] font-bold ${staffAvatarMeta[staff.avatarColor]}`}
                    >
                      {staff.avatarInitials}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Link
                          to={`/owner/kelola-staf/detail-staf/${staff.id}`}
                          className="text-[14px] font-semibold text-ink transition hover:text-primary"
                        >
                          {staff.name}
                        </Link>
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-semibold ${staffStatusMeta[staff.status].badge}`}
                        >
                          <span className={`size-1.5 rounded-full ${staffStatusMeta[staff.status].dot}`} />
                          {staff.status}
                        </span>
                      </div>
                      <p className="mt-1 flex items-center gap-1.5 truncate text-[11px] text-slate-500">
                        <Mail className="size-3 shrink-0" />
                        {staff.email}
                      </p>
                      <p className="mt-0.5 flex items-center gap-1.5 text-[11px] text-slate-500">
                        <Phone className="size-3 shrink-0" />
                        {staff.phone}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-lg bg-[#eef2ff] px-2.5 py-1.5 text-[10.5px] font-medium text-slate-600">
                      <Briefcase className="size-3.5 text-slate-500" />
                      {staff.role}
                    </span>
                    <StaffAccessChips staff={staff} />
                  </div>

                  <div className="mt-3 flex items-end justify-between gap-3">
                    <div>
                      <p className="flex items-center gap-1.5 text-[11.5px] font-semibold text-slate-700">
                        {staff.status === 'Aktif' &&
                        staff.lastActive.startsWith('Sedang Aktif') ? (
                          <span className="size-1.5 shrink-0 rounded-full bg-emerald-500" />
                        ) : null}
                        {staff.lastActive}
                      </p>
                      {staff.lastActiveDevice ? (
                        <p className="mt-0.5 text-[10px] text-slate-500">
                          {staff.lastActiveDevice}
                        </p>
                      ) : null}
                      {staff.status === 'Nonaktif' ? (
                        <p className="mt-1 text-[10px] font-medium text-red-500">
                          Akun Dinonaktifkan
                        </p>
                      ) : null}
                    </div>
                    <StaffActions staff={staff} onToggle={setPendingStaff} />
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-col gap-2 border-t border-line px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-[11px] text-slate-500">
                Menampilkan {filteredStaff.length} staf toko &bull; Data diperbarui otomatis
                setiap 30 detik
              </p>
              <div className="flex items-center gap-1 text-[11px] font-medium">
                <button
                  type="button"
                  disabled
                  className="cursor-not-allowed rounded-lg px-2.5 py-1.5 text-slate-300"
                >
                  Sebelumnya
                </button>
                <span className="rounded-md bg-primary px-2.5 py-1.5 text-[11px] font-bold text-white">
                  1
                </span>
                <button
                  type="button"
                  className="rounded-lg px-2.5 py-1.5 text-slate-500 transition hover:bg-slate-50"
                >
                  Selanjutnya
                </button>
              </div>
            </div>
          </section>
        )}

        <section className="rounded-2xl bg-[#f2f6fa] p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <Info className="mt-0.5 size-4.5 shrink-0 text-slate-700" />
            <div>
              <h3 className="text-[14px] font-bold text-ink">Kebijakan Keamanan Akun Ratis</h3>
              <p className="mt-1.5 text-[12px] leading-relaxed text-slate-600">
                Akun staf yang dinonaktifkan tidak dapat login ke sistem, namun seluruh riwayat
                pencatatan pesanan dan penyesuaian stok yang pernah dilakukan tetap tersimpan
                abadi untuk audit toko Anda. Demi keamanan bisnis, tombol hapus permanen
                ditiadakan untuk menjaga integritas data pembukuan.
              </p>
            </div>
          </div>
        </section>
      </div>

      {pendingStaff ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => setPendingStaff(null)}
            aria-hidden
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="toggle-staff-title"
            className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-[0_16px_40px_rgba(15,23,42,0.16)]"
          >
            <span
              className={`flex size-11 items-center justify-center rounded-xl ${
                pendingStaff.status === 'Aktif'
                  ? 'bg-red-50 text-red-600'
                  : 'bg-primary-soft/60 text-primary'
              }`}
            >
              {pendingStaff.status === 'Aktif' ? (
                <UserX className="size-5" />
              ) : (
                <UserCheck className="size-5" />
              )}
            </span>
            <h3 id="toggle-staff-title" className="mt-4 text-[18px] font-bold text-ink">
              {pendingStaff.status === 'Aktif'
                ? 'Nonaktifkan akses staf?'
                : 'Aktifkan kembali akses staf?'}
            </h3>
            <p className="mt-2 text-[12.5px] leading-relaxed text-slate-500">
              {pendingStaff.status === 'Aktif'
                ? `${pendingStaff.name} tidak akan bisa login ke sistem. Riwayat pesanan dan penyesuaian stok yang pernah dilakukan tetap tersimpan untuk audit toko.`
                : `${pendingStaff.name} akan bisa login kembali dan menerima akses operasional sesuai modul yang dimiliki.`}
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setPendingStaff(null)}
                className="h-10 rounded-xl border border-line px-4 text-[12px] font-semibold text-slate-600 transition hover:bg-slate-50"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={confirmToggleStatus}
                className={`h-10 rounded-xl px-4 text-[12px] font-semibold text-white transition ${
                  pendingStaff.status === 'Aktif'
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-primary hover:bg-primary-hover'
                }`}
              >
                {pendingStaff.status === 'Aktif' ? 'Nonaktifkan' : 'Aktifkan'}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {addStaffOpen ? (
        <OwnerAddStaffModal
          onClose={() => setAddStaffOpen(false)}
          onCreated={() => setStaffList(getOwnerStaff())}
        />
      ) : null}
    </div>
  )
}
