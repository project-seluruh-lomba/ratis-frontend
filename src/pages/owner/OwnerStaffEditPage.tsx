import { useEffect, useState, type ComponentType, type ReactNode } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  BadgeCheck,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ClipboardList,
  Clock3,
  Home,
  Info,
  KeyRound,
  Lock,
  Mail,
  MessageCircle,
  Package,
  Printer,
  Save,
  ShieldCheck,
  ShoppingBag,
  Store,
  Truck,
  User,
  Users,
  Wallet,
  X,
} from 'lucide-react'
import ResetPasswordModal, {
  type ResetPasswordValues,
} from '../../components/owner/ResetPasswordModal'
import { getOwnerSession } from '../../lib/owner-auth'
import { formatWhatsappNumber } from '../../lib/owner-phone'
import { getOwnerStaffDetail } from '../../lib/owner-staff-detail-data'
import {
  getActiveStaffCount,
  staffAvatarMeta,
  staffQuota,
  staffRoleOptions,
  staffShiftOptions,
  staffStatusMeta,
  staffWorkDayOptions,
  updateOwnerStaff,
  type AccessModule,
  type StaffRole,
  type StaffShiftId,
} from '../../lib/owner-staff-data'

type FormErrors = { name?: string; phone?: string; workDays?: string }

const accessIcons: Record<AccessModule, ComponentType<{ className?: string }>> = {
  Pesanan: ShoppingBag,
  'POS Kasir': Wallet,
  'Chat Pelanggan': MessageCircle,
  'Penyesuaian Stok': Package,
  'Opname Bahan': ClipboardList,
  'Cetak Resi': Printer,
  'Status Kirim': Truck,
}

const accessModuleTitles: Record<AccessModule, string> = {
  Pesanan: 'Modul Manajemen Pesanan',
  'POS Kasir': 'Kasir Point-of-Sale (POS)',
  'Chat Pelanggan': 'Chat Pelanggan',
  'Penyesuaian Stok': 'Penyesuaian Stok Harian',
  'Opname Bahan': 'Opname Bahan Baku',
  'Cetak Resi': 'Cetak Label & Resi',
  'Status Kirim': 'Status Pengiriman',
}

function getInitials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')
}

function getInitialShift(shiftName?: string): StaffShiftId {
  const name = shiftName?.toLowerCase() ?? ''
  if (name.includes('pagi')) return 'pagi'
  if (name.includes('siang') || name.includes('sore')) return 'sore'
  return 'fleksibel'
}

function onlyDigits(value: string) {
  return value.replace(/\D/g, '').replace(/^0+/, '')
}

function formatLocalPhone(digits: string) {
  const local = onlyDigits(digits)
  const parts = [
    local.slice(0, 3),
    local.slice(3, 7),
    local.slice(7, 11),
    local.slice(11),
  ].filter(Boolean)

  return parts.join('-')
}

function FormSection({
  icon,
  title,
  subtitle,
  step,
  children,
}: {
  icon: ReactNode
  title: string
  subtitle: string
  step: string
  children: ReactNode
}) {
  return (
    <section className="rounded-2xl border border-line bg-white shadow-[0_1px_2px_rgba(15,23,42,0.06)]">
      <div className="flex flex-col gap-2 border-b border-[#eef2f6] px-5 py-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#e3f6f1] text-primary">
            {icon}
          </span>
          <div>
            <h2 className="text-[13.5px] font-extrabold tracking-tight text-ink">{title}</h2>
            <p className="mt-0.5 text-[10.5px] leading-relaxed text-slate-500">{subtitle}</p>
          </div>
        </div>
        <span className="w-fit shrink-0 rounded-md bg-[#f8fafc] px-2 py-1 text-[9px] font-semibold text-slate-500">
          {step}
        </span>
      </div>
      <div className="p-5">{children}</div>
    </section>
  )
}

const inputBase =
  'h-10 w-full rounded-xl border bg-[#f7f9fc] px-3.5 text-[11.5px] text-ink outline-none transition placeholder:text-slate-400 focus:bg-white focus:ring-4'

export default function OwnerStaffEditPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [session] = useState(getOwnerSession)

  const storeName = session?.storeName ?? 'Dapur Bu Sari'
  const ownerName = session?.name ?? 'Pemilik Toko'
  const detail = id ? getOwnerStaffDetail(id, storeName) : undefined
  const staff = detail?.staff

  const defaultBranch = `${storeName} - Outlet Utama (Tebet, Jakarta Selatan)`
  const initialShift = getInitialShift(detail?.shiftName)
  const initialPhone = staff ? onlyDigits(staff.phone) : ''
  const initialWorkDays = staff?.workDays ?? staffWorkDayOptions.slice(0, 6)
  const initialBranch = staff?.branch ?? defaultBranch
  const initialNote = detail?.internalNote ?? ''
  const initialRole: StaffRole = staff?.role ?? 'Kasir & Layanan Pesanan'
  const [auditId] = useState(
    () =>
      `#AUD-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${Math.floor(10 + Math.random() * 89)}`,
  )

  const [name, setName] = useState(staff?.name ?? '')
  const [phone, setPhone] = useState(initialPhone)
  const [shiftId, setShiftId] = useState<StaffShiftId>(initialShift)
  const [workDays, setWorkDays] = useState<string[]>(initialWorkDays)
  const [branch, setBranch] = useState(initialBranch)
  const [role, setRole] = useState<StaffRole>(initialRole)
  const [note, setNote] = useState(initialNote)
  const [errors, setErrors] = useState<FormErrors>({})
  const [resetOpen, setResetOpen] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => setToast(null), 4000)
    return () => window.clearTimeout(timer)
  }, [toast])

  if (!detail || !staff) {
    return (
      <div>
        <Link
          to="/owner/kelola-staf"
          className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-600 transition hover:text-primary"
        >
          <ArrowLeft className="size-3.5" />
          Kembali ke Daftar Staf
        </Link>
        <section className="mt-6 rounded-2xl border border-line bg-white px-6 py-16 text-center shadow-[0_1px_2px_rgba(15,23,42,0.06)]">
          <span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
            <User className="size-7" />
          </span>
          <h1 className="mt-4 text-[20px] font-extrabold tracking-tight text-ink">
            Staf tidak ditemukan
          </h1>
          <p className="mx-auto mt-2 max-w-md text-[12px] leading-relaxed text-slate-500">
            Data staf yang Anda cari tidak tersedia atau sudah tidak terdaftar di toko ini.
          </p>
        </section>
      </div>
    )
  }

  const selectedRole = staffRoleOptions.find((option) => option.role === role) ?? staffRoleOptions[0]
  const orderedWorkDays = staffWorkDayOptions.filter((day) => workDays.includes(day))
  const offDays = staffWorkDayOptions.length - orderedWorkDays.length
  const activeStaffCount = getActiveStaffCount()

  const dirty =
    name.trim() !== staff.name ||
    phone !== initialPhone ||
    role !== initialRole ||
    shiftId !== initialShift ||
    orderedWorkDays.join(',') !== initialWorkDays.join(',') ||
    branch !== initialBranch ||
    note.trim() !== initialNote.trim()

  function toggleWorkDay(day: string) {
    setWorkDays((current) =>
      current.includes(day) ? current.filter((item) => item !== day) : [...current, day],
    )
    setErrors((current) => ({ ...current, workDays: undefined }))
  }

  function handleSave() {
    if (!staff) return

    const nextErrors: FormErrors = {}
    const trimmedName = name.trim()
    const digits = onlyDigits(phone)

    if (trimmedName.length < 2) {
      nextErrors.name = 'Nama lengkap wajib diisi minimal 2 karakter.'
    }
    if (digits.length < 8 || digits.length > 13) {
      nextErrors.phone = 'Nomor WhatsApp aktif tidak valid.'
    }
    if (orderedWorkDays.length === 0) {
      nextErrors.workDays = 'Pilih minimal satu hari kerja aktif.'
    }

    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    updateOwnerStaff(staff.id, {
      name: trimmedName,
      phone: `0${digits}`,
      avatarInitials: getInitials(trimmedName),
      role,
      shiftId,
      workDays: orderedWorkDays,
      branch,
      internalNote: note.trim(),
    })

    navigate(`/owner/kelola-staf/detail-staf/${staff.id}`, {
      state: {
        toast: `Data ${trimmedName} berhasil diperbarui dan tercatat pada audit log ${storeName}.`,
      },
    })
  }

  function handleResetPassword(values: ResetPasswordValues) {
    if (!staff) return

    setResetOpen(false)
    setToast(
      values.mode === 'link'
        ? `Tautan reset sandi dikirim ke ${staff.email}${values.sendWhatsapp ? ` dan WhatsApp ${formatWhatsappNumber(staff.phone)}` : ''}.`
        : `Sandi ${staff.name} berhasil diperbarui${values.sendWhatsapp ? ` dan rinciannya dikirim ke WhatsApp ${formatWhatsappNumber(staff.phone)}` : ''}.`,
    )
  }

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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
          <Link to="/owner/kelola-staf" className="transition hover:text-primary">
            Staf Toko
          </Link>
          <span className="text-slate-300">/</span>
          <Link
            to={`/owner/kelola-staf/detail-staf/${staff.id}`}
            className="transition hover:text-primary"
          >
            Detail Staf: {staff.name}
          </Link>
          <span className="text-slate-300">/</span>
          <span className="font-medium text-ink">Ubah Data Staf</span>
        </nav>
        <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-[#dbe3f4] bg-[#eef2ff]/60 px-2.5 py-1 text-[9.5px] font-semibold text-[#3b5bdb]">
          <ShieldCheck className="size-3" />
          Audit ID: <span className="font-mono">{auditId}</span>
        </span>
      </div>

      <Link
        to={`/owner/kelola-staf/detail-staf/${staff.id}`}
        className="mt-4 inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-600 transition hover:text-primary"
      >
        <ArrowLeft className="size-3.5" />
        Kembali ke Detail Staf
      </Link>

      <div className="mt-2">
        <h1 className="text-[26px] font-extrabold tracking-tight text-ink sm:text-[28px]">
          Ubah Data Staf Operasional
        </h1>
        <p className="mt-1 max-w-[620px] text-[12.5px] leading-relaxed text-slate-500">
          Perbarui informasi profil, kontak WhatsApp, jadwal shift kerja, dan pembagian
          peran staf operasional {storeName}.
        </p>
      </div>

      <section className="mt-4 rounded-2xl border border-line bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.06)]">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <span
              className={`relative flex size-12 shrink-0 items-center justify-center rounded-xl text-[14px] font-extrabold ${staffAvatarMeta[staff.avatarColor]}`}
            >
              {staff.avatarInitials}
              <span
                className={`absolute -bottom-0.5 -right-0.5 size-3.5 rounded-full border-2 border-white ${staffStatusMeta[staff.status].dot}`}
              />
            </span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-1.5">
                <p className="truncate text-[14px] font-extrabold text-ink">{staff.name}</p>
                <span className="rounded bg-[#e2e8f0] px-1.5 py-0.5 text-[8.5px] font-bold tracking-wide text-slate-500">
                  #{detail.staffCode}
                </span>
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-semibold ${staffStatusMeta[staff.status].badge}`}
                >
                  <span
                    className={`size-1.5 rounded-full ${staffStatusMeta[staff.status].dot}`}
                  />
                  {staff.status}
                </span>
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10.5px] text-slate-500">
                <span className="inline-flex items-center gap-1.5">
                  <Clock3 className="size-3 text-slate-400" />
                  {detail.shiftName} ({detail.shiftTime})
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Store className="size-3 text-slate-400" />
                  {detail.branch}
                </span>
              </div>
            </div>
          </div>
          <div className="flex shrink-0 flex-col gap-0.5 rounded-lg bg-[#f8fafc] px-3 py-2 sm:items-end">
            <p className="text-[8.5px] font-bold uppercase tracking-[0.1em] text-slate-400">
              Login Terakhir
            </p>
            <p className="text-[10.5px] font-semibold text-slate-600">{staff.lastActive}</p>
          </div>
        </div>
      </section>

      <form
        className="mt-4"
        onSubmit={(event) => {
          event.preventDefault()
          handleSave()
        }}
        noValidate
      >
        <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-4">
            <FormSection
              icon={<User className="size-[18px]" />}
              title="Identitas & Kontak Staf"
              subtitle="Informasi biodata operasional terdaftar pada sistem kasir Ratis."
              step="Bagian 1 dari 4"
            >
              <div className="space-y-4">
                <label className="block">
                  <span className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-[11.5px] font-semibold text-ink">
                      Nama Lengkap Sesuai KTP <span className="text-red-500">*</span>
                    </span>
                    <span className="rounded-md bg-[#eef2ff] px-2 py-0.5 text-[8.5px] font-semibold text-[#3b5bdb]">
                      Wajib Diisi
                    </span>
                  </span>
                  <input
                    type="text"
                    value={name}
                    maxLength={100}
                    onChange={(event) => {
                      setName(event.target.value)
                      setErrors((current) => ({ ...current, name: undefined }))
                    }}
                    aria-invalid={Boolean(errors.name)}
                    className={`mt-1.5 ${inputBase} ${
                      errors.name
                        ? 'border-red-300 focus:border-red-400 focus:ring-red-100'
                        : 'border-line focus:border-primary focus:ring-primary/10'
                    }`}
                  />
                  <span
                    className={`mt-1.5 flex items-start gap-1.5 text-[10px] leading-relaxed ${
                      errors.name ? 'text-red-600' : 'text-slate-500'
                    }`}
                  >
                    <Info className="mt-0.5 size-3 shrink-0 text-slate-400" />
                    {errors.name ??
                      'Nama ini dicetak pada struk kasir & tercatat di log audit saat input transaksi.'}
                  </span>
                </label>

                <label className="block">
                  <span className="flex flex-wrap items-center justify-between gap-2">
                    <span className="flex items-center gap-1.5 text-[11.5px] font-semibold text-ink">
                      <Lock className="size-3 text-slate-400" />
                      Email Akun Login Petugas
                    </span>
                    <span className="rounded-md bg-[#f1f5f9] px-2 py-0.5 text-[8.5px] font-semibold text-slate-500">
                      Terkunci (Sistem)
                    </span>
                  </span>
                  <span className="mt-1.5 flex h-10 items-center gap-2 rounded-xl border border-line bg-[#f1f5f9] px-3.5">
                    <Mail className="size-3.5 shrink-0 text-slate-400" />
                    <input
                      type="email"
                      value={staff.email}
                      readOnly
                      aria-label="Email akun login petugas"
                      className="h-full w-full cursor-not-allowed bg-transparent text-[11.5px] text-slate-500 outline-none"
                    />
                    <BadgeCheck className="size-3.5 shrink-0 text-primary" />
                  </span>
                  <span className="mt-1.5 flex items-start gap-1.5 text-[10px] leading-relaxed text-slate-500">
                    <Info className="mt-0.5 size-3 shrink-0 text-slate-400" />
                    Email login terhubung dengan akun autentikasi sistem Ratis dan tidak dapat
                    diubah sembarangan demi keamanan riwayat audit.
                  </span>
                </label>

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block">
                    <span className="text-[11.5px] font-semibold text-ink">
                      Nomor WhatsApp Aktif <span className="text-red-500">*</span>
                    </span>
                    <span
                      className={`mt-1.5 flex h-10 items-center rounded-xl border bg-[#f7f9fc] pl-3 pr-3.5 transition focus-within:bg-white focus-within:ring-4 ${
                        errors.phone
                          ? 'border-red-300 focus-within:border-red-400 focus-within:ring-red-100'
                          : 'border-line focus-within:border-primary focus-within:ring-primary/10'
                      }`}
                    >
                      <span className="border-r border-line pr-2 text-[11px] font-semibold text-slate-500">
                        +62
                      </span>
                      <input
                        type="tel"
                        inputMode="tel"
                        value={formatLocalPhone(phone)}
                        onChange={(event) => {
                          setPhone(event.target.value)
                          setErrors((current) => ({ ...current, phone: undefined }))
                        }}
                        aria-invalid={Boolean(errors.phone)}
                        className="h-full w-full bg-transparent pl-2.5 text-[11.5px] text-ink outline-none placeholder:text-slate-400"
                      />
                    </span>
                    <span
                      className={`mt-1.5 block text-[10px] leading-relaxed ${
                        errors.phone ? 'text-red-600' : 'text-slate-500'
                      }`}
                    >
                      {errors.phone ??
                        'Digunakan untuk notifikasi jadwal dinas & pergantian kasir.'}
                    </span>
                  </label>

                  <div>
                    <p className="text-[11.5px] font-semibold text-ink">Masa Kerja Toko</p>
                    <div className="mt-1.5 flex h-10 items-center gap-2 rounded-xl border border-line bg-[#f1f5f9] px-3">
                      <CalendarDays className="size-3.5 shrink-0 text-slate-400" />
                      <span className="truncate text-[11px] font-medium text-slate-600">
                        {detail.joinedAt}
                      </span>
                      <span className="ml-auto shrink-0 rounded-full bg-[#dcf7ee] px-1.5 py-0.5 text-[8.5px] font-bold text-primary">
                        {detail.tenure}
                      </span>
                    </div>
                    <p className="mt-1.5 text-[10px] leading-relaxed text-slate-500">
                      Terdaftar di pencatatan absensi digital {storeName}.
                    </p>
                  </div>
                </div>
              </div>
            </FormSection>

            <FormSection
              icon={<Clock3 className="size-[18px]" />}
              title="Jadwal Kerja & Shift Toko"
              subtitle="Tentukan jam dinas harian dan penempatan lokasi fisik staf."
              step="Bagian 2 dari 4"
            >
              <p className="text-[10.5px] font-medium text-ink">Pilih Shift Kerja Rutin</p>
              <div className="mt-2 grid gap-2.5 sm:grid-cols-3">
                {staffShiftOptions.map((option) => {
                  const active = shiftId === option.id

                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => setShiftId(option.id)}
                      aria-pressed={active}
                      className={`relative rounded-xl border p-3 text-left transition ${
                        active
                          ? 'border-primary bg-[#f3fbf8] shadow-[0_0_0_1px_rgba(15,118,110,0.25)]'
                          : 'border-line bg-white hover:bg-slate-50'
                      }`}
                    >
                      <span
                        className={`absolute right-3 top-3 flex size-3.5 items-center justify-center rounded-full border-2 ${
                          active ? 'border-primary' : 'border-slate-300'
                        }`}
                      >
                        {active ? <span className="size-1.5 rounded-full bg-primary" /> : null}
                      </span>
                      <p className="pr-5 text-[11px] font-bold text-ink">{option.name}</p>
                      <p className="mt-1 text-[11px] font-semibold tracking-wide text-slate-600">
                        {option.range}
                      </p>
                      <p className="mt-1 text-[9.5px] leading-relaxed text-slate-500">
                        {option.description}
                      </p>
                    </button>
                  )
                })}
              </div>

              <div className="mt-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-[10.5px] font-medium text-ink">Hari Kerja Aktif</p>
                  <p className="text-[9.5px] font-medium text-slate-500">
                    {orderedWorkDays.length} Hari Terpilih • {offDays} Hari Libur
                  </p>
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {staffWorkDayOptions.map((day) => {
                    const active = workDays.includes(day)

                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={() => toggleWorkDay(day)}
                        aria-pressed={active}
                        className={`rounded-lg border px-3 py-1.5 text-[10px] font-semibold transition ${
                          active
                            ? 'border-primary bg-primary text-white'
                            : 'border-line bg-white text-slate-500 hover:bg-slate-50'
                        }`}
                      >
                        {day}
                        {day === 'Minggu' && !active ? ' (Libur Rutin)' : ''}
                      </button>
                    )
                  })}
                </div>
                <p
                  className={`mt-2 text-[10px] leading-relaxed ${
                    errors.workDays ? 'text-red-600' : 'text-slate-500'
                  }`}
                >
                  {errors.workDays ??
                    'Penggantian hari off dadakan dapat dicatat langsung di modul presensi harian.'}
                </p>
              </div>

              <div className="mt-4">
                <label
                  htmlFor="staff-branch"
                  className="text-[10.5px] font-medium text-ink"
                >
                  Penempatan Lokasi Cabang Toko
                </label>
                <div className="relative mt-1.5">
                  <select
                    id="staff-branch"
                    value={branch}
                    onChange={(event) => setBranch(event.target.value)}
                    className={`${inputBase} appearance-none pr-9`}
                  >
                    <option value={defaultBranch}>{defaultBranch}</option>
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-3.5 -translate-y-1/2 text-slate-400" />
                </div>
              </div>
            </FormSection>

            <FormSection
              icon={<Users className="size-[18px]" />}
              title="Peran & Tanggung Jawab Operasional"
              subtitle="Penentuan hak akses menu kasir dan alat cetak operasional."
              step="Bagian 3 dari 4"
            >
              <div className="space-y-2.5">
                {staffRoleOptions.map((option) => {
                  const active = role === option.role

                  return (
                    <button
                      key={option.role}
                      type="button"
                      onClick={() => setRole(option.role)}
                      aria-pressed={active}
                      className={`w-full rounded-xl border p-3.5 text-left transition ${
                        active
                          ? 'border-primary bg-[#f7fdfb] shadow-[0_0_0_1px_rgba(15,118,110,0.25)]'
                          : 'border-line bg-white hover:bg-slate-50'
                      }`}
                    >
                      <span className="flex items-start gap-2.5">
                        <span
                          className={`mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border-2 ${
                            active ? 'border-primary' : 'border-slate-300'
                          }`}
                        >
                          {active ? <span className="size-2 rounded-full bg-primary" /> : null}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="flex flex-wrap items-center gap-2">
                            <span className="text-[11.5px] font-bold text-ink">
                              {option.role}
                            </span>
                            <span className="rounded-full bg-[#dcf7ee] px-2 py-0.5 text-[8.5px] font-semibold text-primary">
                              {option.badge}
                            </span>
                          </span>
                          <span className="mt-1 block text-[10px] leading-relaxed text-slate-500">
                            {option.description}
                          </span>
                          <span className="mt-2 flex flex-wrap gap-1.5">
                            {option.access.map((access) => {
                              const Icon = accessIcons[access]

                              return (
                                <span
                                  key={access}
                                  className="inline-flex items-center gap-1 rounded-md border border-line bg-white px-1.5 py-0.5 text-[8.5px] font-semibold text-slate-500"
                                >
                                  <Icon className="size-2.5 text-primary" />
                                  {access}
                                </span>
                              )
                            })}
                          </span>
                        </span>
                      </span>
                    </button>
                  )
                })}
              </div>
            </FormSection>

            <FormSection
              icon={<ClipboardList className="size-[18px]" />}
              title="Catatan Internal Pemilik (Opsional)"
              subtitle="Evaluasi perilaku, catatan keahlian khusus, atau riwayat kerja kasir."
              step="Bagian 4 dari 4"
            >
              <div className="flex items-start justify-between gap-3">
                <span className="inline-flex items-center gap-1 rounded-full bg-[#fef3c7] px-2 py-0.5 text-[8.5px] font-bold text-[#b45309]">
                  <Lock className="size-2.5" />
                  Privat
                </span>
              </div>
              <textarea
                rows={5}
                maxLength={500}
                value={note}
                onChange={(event) => setNote(event.target.value)}
                placeholder="Tulis catatan internal untuk pemilik toko..."
                className="mt-2 w-full resize-none rounded-xl border border-line bg-[#f7f9fc] px-3.5 py-3 text-[11.5px] leading-relaxed text-ink outline-none transition placeholder:text-slate-400 focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10"
              />
              <div className="mt-2 flex items-start justify-between gap-3">
                <p className="flex items-start gap-1.5 text-[9.5px] leading-relaxed text-slate-500">
                  <Lock className="mt-0.5 size-2.5 shrink-0 text-slate-400" />
                  Hanya dapat dilihat oleh pemilik toko ({ownerName}). Staf bersangkutan tidak
                  dapat membaca catatan ini.
                </p>
                <p className="shrink-0 text-[9.5px] font-medium text-slate-400">
                  {note.length} / 500
                </p>
              </div>
            </FormSection>
          </div>

          <aside className="space-y-4">
            <section className="rounded-2xl border border-line bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.06)]">
              <div className="flex items-start gap-2.5">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#fde7e7] text-[#dc2626]">
                  <KeyRound className="size-4" />
                </span>
                <div className="min-w-0">
                  <h2 className="text-[13px] font-extrabold text-ink">Keamanan &amp; Kata Sandi</h2>
                  <span className="mt-1 inline-flex rounded-md bg-[#fde7e7] px-2 py-0.5 text-[8.5px] font-semibold text-[#dc2626]">
                    Autentikasi Akun Petugas
                  </span>
                </div>
              </div>
              <p className="mt-3 text-[10px] leading-relaxed text-slate-500">
                Sesuai kebijakan keamanan Ratis UMKM, penggantian kata sandi staf dikelola
                pada modul keamanan terpisah untuk mencegah kebocoran kredensial dan menjaga
                kepatuhan audit.
              </p>
              <p className="mt-2 flex items-start gap-1.5 text-[9.5px] leading-relaxed text-slate-500">
                <Clock3 className="mt-0.5 size-3 shrink-0 text-slate-400" />
                Terakhir diganti: {detail.session.passwordChanged}
              </p>
              <button
                type="button"
                onClick={() => setResetOpen(true)}
                className="mt-3 flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-primary/30 bg-[#e7f4f1] px-3 text-[10.5px] font-semibold text-primary transition hover:bg-primary-soft"
              >
                <KeyRound className="size-3.5" />
                Buka Modal Reset Kata Sandi
              </button>
            </section>

            <section className="rounded-2xl border border-line bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.06)]">
              <div className="flex items-start gap-2.5">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#e7f4f1] text-primary">
                  <ShieldCheck className="size-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <h2 className="text-[13px] font-extrabold text-ink">
                    Batasan Akses Modul Staf
                  </h2>
                  <p className="mt-0.5 text-[9.5px] leading-relaxed text-slate-500">
                    Ringkasan hak akses peran aktif
                  </p>
                </div>
                <span className="shrink-0 rounded-full bg-[#e7f4f1] px-2 py-1 text-[8.5px] font-bold text-primary">
                  {activeStaffCount}/{staffQuota} Kuota Aktif
                </span>
              </div>

              <p className="mt-4 flex items-center gap-1.5 text-[8.5px] font-bold uppercase tracking-[0.08em] text-emerald-600">
                <CheckCircle2 className="size-3" />
                Diberikan Izin ({selectedRole.access.length} Fitur)
              </p>
              <ul className="mt-2 space-y-1.5">
                {selectedRole.access.map((access) => (
                  <li
                    key={access}
                    className="flex items-center gap-2 rounded-lg border border-[#d9f2e8] bg-[#f7fdfb] px-2.5 py-2"
                  >
                    <CheckCircle2 className="size-3 shrink-0 text-emerald-600" />
                    <span className="min-w-0 flex-1 truncate text-[10px] font-semibold text-slate-600">
                      {accessModuleTitles[access]}
                    </span>
                    <span className="shrink-0 rounded-full bg-[#dcf7ee] px-1.5 py-0.5 text-[8px] font-bold text-primary">
                      {access === 'POS Kasir' ? 'Buka/Tutup Kas' : 'Penuh'}
                    </span>
                  </li>
                ))}
              </ul>

              <p className="mt-4 flex items-center gap-1.5 text-[8.5px] font-bold uppercase tracking-[0.08em] text-red-500">
                <Lock className="size-3" />
                Terkunci / Khusus Pemilik ({detail.restrictedModules.length} Fitur)
              </p>
              <ul className="mt-2 space-y-1.5">
                {detail.restrictedModules.map((module) => (
                  <li
                    key={module.key}
                    className="flex items-center gap-2 rounded-lg border border-line bg-[#f8fafc] px-2.5 py-2"
                  >
                    <Lock className="size-3 shrink-0 text-slate-400" />
                    <span className="min-w-0 flex-1 truncate text-[10px] font-semibold text-slate-500">
                      {module.title}
                    </span>
                    <span className="shrink-0 rounded-full bg-[#fde7e7] px-1.5 py-0.5 text-[8px] font-bold text-[#dc2626]">
                      Ditolak
                    </span>
                  </li>
                ))}
              </ul>

              <p className="mt-3 flex items-start gap-1.5 rounded-lg bg-[#eef2ff]/70 px-2.5 py-2 text-[9px] leading-relaxed text-slate-600">
                <Info className="mt-0.5 size-3 shrink-0 text-[#3b5bdb]" />
                Hak akses laporan keuangan dan pengaturan toko tetap khusus pemilik, tidak
                dapat dibuka melalui perubahan peran staf.
              </p>
            </section>

            <section className="sticky top-5 rounded-2xl border border-line bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.08)]">
              <div className="flex items-start justify-between gap-2">
                <p className="flex items-center gap-1.5 text-[9.5px] font-semibold text-slate-600">
                  <span
                    className={`size-1.5 rounded-full ${dirty ? 'bg-amber-500' : 'bg-emerald-500'}`}
                  />
                  {dirty ? 'Perubahan belum disimpan' : 'Tidak ada perubahan'}
                </p>
                <p className="shrink-0 text-[8.5px] text-slate-400">
                  Form ID: <span className="font-mono">#STF-MOD-01</span>
                </p>
              </div>
              <button
                type="submit"
                disabled={!dirty}
                className="mt-2.5 flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-primary px-3 text-[11px] font-semibold text-white transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                <Save className="size-3.5" />
                Simpan Perubahan Data
              </button>
              <button
                type="button"
                onClick={() => navigate(`/owner/kelola-staf/detail-staf/${staff.id}`)}
                className="mt-2 h-10 w-full rounded-xl border border-line bg-white text-[11px] font-semibold text-slate-600 transition hover:bg-slate-50"
              >
                Batalkan
              </button>
              <p className="mt-2 flex items-start gap-1 text-[8.5px] leading-relaxed text-slate-400">
                <Info className="mt-px size-2.5 shrink-0" />
                Disimpan otomatis ke audit log {storeName} dengan pencatatan waktu WIB.
              </p>
            </section>
          </aside>
        </div>
      </form>

      {resetOpen ? (
        <ResetPasswordModal
          staffName={staff.name}
          staffInitials={staff.avatarInitials}
          staffAvatarClassName={staffAvatarMeta[staff.avatarColor]}
          staffCode={detail.staffCode}
          role={staff.role}
          email={staff.email}
          whatsappNumber={formatWhatsappNumber(staff.phone)}
          sessionStatus={detail.session.status}
          sessionDevice={
            detail.session.status === 'Online'
              ? (detail.metrics.find((metric) => metric.key === 'device')?.helper ??
                detail.session.deviceName)
              : detail.session.deviceName
          }
          onClose={() => setResetOpen(false)}
          onConfirm={handleResetPassword}
        />
      ) : null}

      {toast ? (
        <div className="fixed bottom-24 left-1/2 z-[80] w-full max-w-sm -translate-x-1/2 px-4 sm:bottom-6">
          <div className="flex items-start gap-2.5 rounded-xl border border-line bg-white p-3.5 shadow-xl">
            <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-[#dcf7ee] text-primary">
              <CheckCircle2 className="size-3.5" />
            </span>
            <p className="flex-1 text-[11.5px] font-medium leading-relaxed text-ink">{toast}</p>
            <button
              type="button"
              onClick={() => setToast(null)}
              aria-label="Tutup notifikasi"
              className="text-slate-400 transition hover:text-slate-600"
            >
              <X className="size-3.5" />
            </button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
