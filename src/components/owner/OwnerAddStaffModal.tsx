import {
  useEffect,
  useRef,
  useState,
  type ComponentType,
  type FormEvent,
  type ReactNode,
} from 'react'
import {
  ArrowLeft,
  BadgeCheck,
  Briefcase,
  CheckCircle2,
  Eye,
  EyeOff,
  Info,
  Loader2,
  LockKeyhole,
  Mail,
  Package,
  RefreshCw,
  ShieldCheck,
  ShoppingBag,
  Truck,
  User,
  UserPlus,
  X,
} from 'lucide-react'
import { getOwnerSession } from '../../lib/owner-auth'
import {
  addOwnerStaff,
  getAvailableStaffSlots,
  isStaffEmailTaken,
  staffQuota,
  staffRoleOptions,
  type StaffMember,
  type StaffRole,
} from '../../lib/owner-staff-data'

type FormValues = {
  name: string
  email: string
  whatsapp: string
  role: StaffRole
  password: string
  confirmPassword: string
  consent: boolean
}

type FormErrors = Partial<Record<keyof FormValues, string>>

const roleIcons: Record<string, ComponentType<{ className?: string }>> = {
  'Kasir & Layanan Pesanan': ShoppingBag,
  'Koordinator Dapur & Stok': Package,
  'Packing & Ekspedisi Kurir': Truck,
}

function getInitials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')
}

function formatWhatsapp(value: string) {
  const digits = value.replace(/\D/g, '')
  if (!digits) return '-'
  const local = digits.startsWith('62')
    ? digits.slice(2)
    : digits.startsWith('0')
      ? digits.slice(1)
      : digits
  return `+62 ${local}`
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

function ModalShell({
  children,
  labelledBy,
  onClose,
}: {
  children: ReactNode
  labelledBy: string
  onClose: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        className="relative flex max-h-[calc(100vh-2rem)] w-full max-w-[600px] flex-col overflow-hidden rounded-3xl bg-white shadow-[0_24px_70px_rgba(15,23,42,0.28)]"
      >
        {children}
      </div>
    </div>
  )
}

export default function OwnerAddStaffModal({
  onClose,
  onCreated,
}: {
  onClose: () => void
  onCreated?: () => void
}) {
  const [session] = useState(getOwnerSession)
  const [availableSlots, setAvailableSlots] = useState(getAvailableStaffSlots)
  const [values, setValues] = useState<FormValues>({
    name: '',
    email: '',
    whatsapp: '',
    role: staffRoleOptions[0].role,
    password: '',
    confirmPassword: '',
    consent: false,
  })
  const [errors, setErrors] = useState<FormErrors>({})
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [createdStaff, setCreatedStaff] = useState<StaffMember | null>(null)
  const nameInputRef = useRef<HTMLInputElement>(null)
  const submitTimerRef = useRef<number | null>(null)
  const onCloseRef = useRef(onClose)

  useEffect(() => {
    onCloseRef.current = onClose
  }, [onClose])

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null
    nameInputRef.current?.focus()
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onCloseRef.current()
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = previousOverflow
      if (submitTimerRef.current !== null) {
        window.clearTimeout(submitTimerRef.current)
      }
      previouslyFocused?.focus()
    }
  }, [])

  const storeName = session?.storeName ?? 'Dapur Bu Sari'
  const atLimit = availableSlots <= 0
  const passwordsMatch =
    values.confirmPassword.length > 0 && values.confirmPassword === values.password
  const passwordStrong = values.password.length >= 8

  function updateField<K extends keyof FormValues>(key: K, value: FormValues[K]) {
    setValues((current) => ({ ...current, [key]: value }))
    setErrors((current) => ({ ...current, [key]: undefined }))
  }

  function validate(): FormErrors {
    const next: FormErrors = {}

    if (values.name.trim().length < 2) {
      next.name = 'Nama lengkap wajib diisi minimal 2 karakter.'
    }

    if (!isValidEmail(values.email.trim())) {
      next.email = 'Masukkan format email yang valid.'
    } else if (isStaffEmailTaken(values.email)) {
      next.email = 'Email sudah terdaftar. Gunakan email lain.'
    }

    const whatsappDigits = values.whatsapp.replace(/\D/g, '')
    if (
      values.whatsapp.trim() &&
      (whatsappDigits.length < 8 || whatsappDigits.length > 15)
    ) {
      next.whatsapp = 'Nomor WhatsApp tidak valid.'
    }

    if (values.password.length < 8) {
      next.password = 'Kata sandi minimal 8 karakter.'
    }

    if (values.confirmPassword !== values.password) {
      next.confirmPassword = 'Konfirmasi kata sandi belum cocok.'
    }

    if (!values.consent) {
      next.consent = 'Setujui kebijakan privasi & data pribadi untuk melanjutkan.'
    }

    return next
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (submitting || atLimit) return

    const nextErrors = validate()
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    setSubmitting(true)
    submitTimerRef.current = window.setTimeout(() => {
      const selectedOption =
        staffRoleOptions.find((option) => option.role === values.role) ?? staffRoleOptions[0]
      const newStaff: StaffMember = {
        id: `staff-${Date.now()}`,
        name: values.name.trim(),
        email: values.email.trim().toLowerCase(),
        phone: formatWhatsapp(values.whatsapp),
        avatarColor: 'blue',
        avatarInitials: getInitials(values.name),
        role: values.role,
        access: [...selectedOption.access],
        lastActive: 'Baru ditambahkan',
        lastActiveDevice: 'Belum pernah login',
        status: 'Aktif',
      }

      addOwnerStaff(newStaff)
      onCreated?.()
      setAvailableSlots(getAvailableStaffSlots())
      setCreatedStaff(newStaff)
      setSubmitting(false)
      submitTimerRef.current = null
    }, 700)
  }

  function resetForm() {
    setCreatedStaff(null)
    setValues({
      name: '',
      email: '',
      whatsapp: '',
      role: staffRoleOptions[0].role,
      password: '',
      confirmPassword: '',
      consent: false,
    })
    setErrors({})
    setShowPassword(false)
    setShowConfirmPassword(false)
  }

  if (createdStaff) {
    return (
      <ModalShell labelledBy="add-staff-success-title" onClose={onClose}>
        <div className="relative min-h-0 flex-1 overflow-y-auto p-6 text-center sm:p-8">
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup modal"
            className="absolute right-4 top-4 flex size-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="size-4" />
          </button>
          <span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-[#dcfce7] text-emerald-600">
            <CheckCircle2 className="size-7" />
          </span>
          <h2
            id="add-staff-success-title"
            className="mt-4 text-[20px] font-extrabold tracking-tight text-ink"
          >
            Staf berhasil didaftarkan
          </h2>
          <p className="mx-auto mt-2 max-w-sm text-[12.5px] leading-relaxed text-slate-500">
            Akun {createdStaff.name} sudah aktif dan dapat login menggunakan email serta kata
            sandi awal yang Anda buat.
          </p>

          <div className="mx-auto mt-5 max-w-sm rounded-xl border border-line bg-[#f8fafc] p-4 text-left">
            <div className="flex items-center gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#e2ecff] text-[12px] font-bold text-[#3b5bdb]">
                {createdStaff.avatarInitials}
              </span>
              <div className="min-w-0">
                <p className="truncate text-[13px] font-semibold text-ink">
                  {createdStaff.name}
                </p>
                <p className="mt-0.5 truncate text-[11px] text-slate-500">
                  {createdStaff.email}
                </p>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-[#eef2ff] px-2.5 py-1 text-[10.5px] font-medium text-slate-600">
                {createdStaff.role}
              </span>
              <span className="rounded-full bg-[#dcfce7] px-2.5 py-1 text-[10.5px] font-semibold text-[#15803d]">
                Aktif
              </span>
            </div>
          </div>

          <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-[12px] font-semibold text-white transition hover:bg-primary-hover"
            >
              <ArrowLeft className="size-4" />
              Kembali ke Daftar Staf
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-line bg-white px-5 text-[12px] font-semibold text-slate-600 transition hover:bg-slate-50"
            >
              <UserPlus className="size-4" />
              Tambah Staf Lain
            </button>
          </div>
        </div>
      </ModalShell>
    )
  }

  return (
    <ModalShell labelledBy="add-staff-title" onClose={onClose}>
      <form
        onSubmit={handleSubmit}
        noValidate
        autoComplete="off"
        className="flex min-h-0 flex-1 flex-col"
      >
        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="border-b border-line p-4 sm:p-5">
          <div className="flex items-start gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#e7f4f1] text-primary">
              <UserPlus className="size-5" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1
                  id="add-staff-title"
                  className="text-[18px] font-extrabold tracking-tight text-ink"
                >
                  Tambah Staf Toko Baru
                </h1>
                <span className="rounded-full bg-primary-soft/60 px-2 py-0.5 text-[9.5px] font-semibold text-primary">
                  {storeName}
                </span>
              </div>
              <p className="mt-1 max-w-lg text-[11px] leading-relaxed text-slate-500">
                Beri akses operasional terbatas untuk kasir atau dapur tanpa membuka laporan
                omzet &amp; mutasi rekening usaha.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Tutup modal tambah staf"
              className="flex size-8 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
            >
              <X className="size-4" />
            </button>
          </div>

          <div className="mt-4 flex flex-col gap-2.5 rounded-xl bg-[#e7f4f1] px-3.5 py-2.5 sm:flex-row sm:items-center sm:justify-between">
            <p className="flex flex-wrap items-center gap-2 text-[10.5px] font-medium text-primary">
              <CheckCircle2 className="size-3.5 shrink-0" />
              Slot Kuota Staf Tersedia:
              <span className="font-bold">
                {availableSlots} dari {staffQuota} Staf
              </span>
              <span className="text-slate-500">(Batas Maksimal UMKM)</span>
            </p>
            <span className="inline-flex items-center justify-center gap-1.5 self-start rounded-full border border-line bg-white px-2.5 py-1 text-[9.5px] font-semibold text-primary sm:self-auto">
              <BadgeCheck className="size-3" />
              Paket Usaha Aktif
            </span>
          </div>

          {atLimit ? (
            <p className="mt-2 text-[10.5px] font-medium text-amber-600">
              Kuota staf aktif sudah penuh. Nonaktifkan staf lain untuk menambah staf baru.
            </p>
          ) : null}
        </div>

        <div className="space-y-4 p-4 sm:p-5">
          <div>
            <div className="flex items-center justify-between gap-2">
              <label htmlFor="staff-name" className="text-[11.5px] font-semibold text-ink">
                Nama Lengkap Staf <span className="text-red-500">*</span>
              </label>
              <span className="text-[10px] text-slate-400">Sesuai KTP / Panggilan</span>
            </div>
            <div className="relative mt-1.5">
              <User className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <input
                id="staff-name"
                ref={nameInputRef}
                type="text"
                autoComplete="off"
                value={values.name}
                onChange={(event) => updateField('name', event.target.value)}
                placeholder="Siti Rahmawati"
                aria-invalid={Boolean(errors.name)}
                className={`h-10 w-full rounded-xl border bg-[#f7f9fc] pl-10 pr-3 text-[12px] text-ink outline-none transition placeholder:text-slate-400 focus:bg-white focus:ring-4 ${
                  errors.name
                    ? 'border-red-400 focus:border-red-400 focus:ring-red-100'
                    : 'border-transparent focus:border-primary focus:ring-primary/10'
                }`}
              />
            </div>
            {errors.name ? (
              <p className="mt-1 text-[10.5px] font-medium text-red-500">{errors.name}</p>
            ) : (
              <p className="mt-1.5 flex items-start gap-1.5 text-[10.5px] leading-relaxed text-slate-500">
                <Info className="mt-0.5 size-3 shrink-0" />
                Nama ini dicetak pada struk kasir &amp; tercatat di log audit saat input barang
                masuk.
              </p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <div className="flex items-center justify-between gap-2">
                <label htmlFor="staff-email" className="text-[11.5px] font-semibold text-ink">
                  Email Login Petugas <span className="text-red-500">*</span>
                </label>
                <span className="rounded bg-[#eef2ff] px-1.5 py-0.5 text-[8.5px] font-bold uppercase tracking-wide text-slate-500">
                  ID Akses
                </span>
              </div>
              <div className="relative mt-1.5">
                <Mail className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                <input
                  id="staff-email"
                  type="email"
                  autoComplete="off"
                  value={values.email}
                  onChange={(event) => updateField('email', event.target.value)}
                  placeholder="siti.rahmawati@gmail.com"
                  aria-invalid={Boolean(errors.email)}
                  className={`h-10 w-full rounded-xl border bg-[#f7f9fc] pl-10 pr-3 text-[12px] text-ink outline-none transition placeholder:text-slate-400 focus:bg-white focus:ring-4 ${
                    errors.email
                      ? 'border-red-400 focus:border-red-400 focus:ring-red-100'
                      : 'border-transparent focus:border-primary focus:ring-primary/10'
                  }`}
                />
              </div>
              {errors.email ? (
                <p className="mt-1 text-[10.5px] font-medium text-red-500">{errors.email}</p>
              ) : (
                <p className="mt-1.5 text-[10.5px] leading-relaxed text-slate-500">
                  Digunakan staf login ke Web Kasir POS atau Aplikasi Staf Ratis.
                </p>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between gap-2">
                <label
                  htmlFor="staff-whatsapp"
                  className="text-[11.5px] font-semibold text-ink"
                >
                  Nomor WhatsApp Aktif{' '}
                  <span className="font-normal text-slate-400">(Opsional)</span>
                </label>
                <span className="text-[9px] font-semibold text-slate-400">
                  Notifikasi Shift
                </span>
              </div>
              <div className="relative mt-1.5">
                <span className="pointer-events-none absolute left-3 top-1/2 flex -translate-y-1/2 items-center gap-1.5">
                  <span className="rounded bg-red-50 px-1 py-0.5 text-[8.5px] font-bold text-red-500">
                    ID
                  </span>
                  <span className="text-[12px] font-semibold text-slate-500">+62</span>
                </span>
                <input
                  id="staff-whatsapp"
                  type="tel"
                  inputMode="tel"
                  autoComplete="off"
                  value={values.whatsapp}
                  onChange={(event) => updateField('whatsapp', event.target.value)}
                  placeholder="812-9871-2244"
                  aria-invalid={Boolean(errors.whatsapp)}
                  className={`h-10 w-full rounded-xl border bg-[#f7f9fc] pl-[72px] pr-3 text-[12px] text-ink outline-none transition placeholder:text-slate-400 focus:bg-white focus:ring-4 ${
                    errors.whatsapp
                      ? 'border-red-400 focus:border-red-400 focus:ring-red-100'
                      : 'border-transparent focus:border-primary focus:ring-primary/10'
                  }`}
                />
              </div>
              {errors.whatsapp ? (
                <p className="mt-1 text-[10.5px] font-medium text-red-500">
                  {errors.whatsapp}
                </p>
              ) : (
                <p className="mt-1.5 text-[10.5px] leading-relaxed text-slate-500">
                  Untuk pengiriman tautan aktivasi instan via pesan WhatsApp resmi Ratis.
                </p>
              )}
            </div>
          </div>

          <div className="pt-1">
            <div className="flex items-center justify-between gap-2">
              <p id="staff-role-label" className="text-[11.5px] font-semibold text-ink">
                Pilih Peran Operasional &amp; Fokus Tugas{' '}
                <span className="text-red-500">*</span>
              </p>
              <span className="text-[10px] font-medium text-slate-400">
                Hak Akses Terspesialisasi
              </span>
            </div>

            <div
              role="radiogroup"
              aria-labelledby="staff-role-label"
              className="mt-2 space-y-2"
            >
              {staffRoleOptions.map((option) => {
                const selected = values.role === option.role
                const RoleIcon = roleIcons[option.role] ?? Briefcase

                return (
                  <label
                    key={option.role}
                    className={`flex cursor-pointer items-start gap-2.5 rounded-xl border p-3 transition focus-within:ring-4 focus-within:ring-primary/10 ${
                      selected
                        ? 'border-primary bg-[#e7f4f1]'
                        : 'border-line bg-[#f8fafc] hover:border-slate-300 hover:bg-white'
                    }`}
                  >
                    <input
                      type="radio"
                      name="staff-role"
                      value={option.role}
                      checked={selected}
                      onChange={() => updateField('role', option.role)}
                      className="sr-only"
                    />
                    <span
                      className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border-2 ${
                        selected ? 'border-primary' : 'border-slate-300'
                      }`}
                    >
                      {selected ? <span className="size-2.5 rounded-full bg-primary" /> : null}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-center justify-between gap-2">
                        <span className="flex items-center gap-2 text-[12px] font-semibold text-ink">
                          <RoleIcon className="size-3.5 text-slate-600" />
                          {option.role}
                        </span>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[9px] font-semibold ${
                            selected
                              ? 'bg-primary-soft/70 text-primary'
                              : 'bg-[#eef2ff] text-slate-500'
                          }`}
                        >
                          {option.badge}
                        </span>
                      </span>
                      <span className="mt-0.5 block text-[10.5px] leading-relaxed text-slate-500">
                        {option.description}
                      </span>
                    </span>
                  </label>
                )
              })}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <div className="flex items-center justify-between gap-2">
                <label
                  htmlFor="staff-password"
                  className="text-[11.5px] font-semibold text-ink"
                >
                  Kata Sandi Awal <span className="text-red-500">*</span>
                </label>
                <span className="text-[9.5px] text-slate-400">Min. 8 Karakter</span>
              </div>
              <div className="relative mt-1.5">
                <LockKeyhole className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                <input
                  id="staff-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={values.password}
                  onChange={(event) => updateField('password', event.target.value)}
                  placeholder="••••••••••••"
                  aria-invalid={Boolean(errors.password)}
                  className={`h-10 w-full rounded-xl border bg-[#f7f9fc] pl-10 pr-10 text-[12px] text-ink outline-none transition placeholder:text-slate-400 focus:bg-white focus:ring-4 ${
                    errors.password
                      ? 'border-red-400 focus:border-red-400 focus:ring-red-100'
                      : 'border-transparent focus:border-primary focus:ring-primary/10'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  aria-label={
                    showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'
                  }
                  className="absolute right-2 top-1/2 flex size-7 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
              {errors.password ? (
                <p className="mt-1 text-[10.5px] font-medium text-red-500">
                  {errors.password}
                </p>
              ) : (
                <p className="mt-1.5 flex items-start gap-1.5 text-[10.5px] leading-relaxed text-slate-500">
                  <Info className="mt-0.5 size-3 shrink-0" />
                  Staf disarankan langsung mengganti sandi setelah login perdana.
                </p>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between gap-2">
                <label
                  htmlFor="staff-confirm-password"
                  className="text-[11.5px] font-semibold text-ink"
                >
                  Ulangi Kata Sandi <span className="text-red-500">*</span>
                </label>
                {passwordsMatch ? (
                  <span className="flex items-center gap-1 text-[9.5px] font-semibold text-emerald-600">
                    <CheckCircle2 className="size-3" />
                    Cocok
                  </span>
                ) : values.confirmPassword ? (
                  <span className="text-[9.5px] font-semibold text-red-500">
                    Belum cocok
                  </span>
                ) : null}
              </div>
              <div className="relative mt-1.5">
                <RefreshCw className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                <input
                  id="staff-confirm-password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={values.confirmPassword}
                  onChange={(event) => updateField('confirmPassword', event.target.value)}
                  placeholder="••••••••••••"
                  aria-invalid={Boolean(errors.confirmPassword)}
                  className={`h-10 w-full rounded-xl border bg-[#f7f9fc] pl-10 pr-10 text-[12px] text-ink outline-none transition placeholder:text-slate-400 focus:bg-white focus:ring-4 ${
                    errors.confirmPassword
                      ? 'border-red-400 focus:border-red-400 focus:ring-red-100'
                      : 'border-transparent focus:border-primary focus:ring-primary/10'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((current) => !current)}
                  aria-label={
                    showConfirmPassword
                      ? 'Sembunyikan ulangi kata sandi'
                      : 'Tampilkan ulangi kata sandi'
                  }
                  className="absolute right-2 top-1/2 flex size-7 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="size-4" />
                  ) : (
                    <Eye className="size-4" />
                  )}
                </button>
              </div>
              {errors.confirmPassword ? (
                <p className="mt-1 text-[10.5px] font-medium text-red-500">
                  {errors.confirmPassword}
                </p>
              ) : (
                <p
                  className={`mt-1.5 flex items-start gap-1.5 text-[10.5px] leading-relaxed ${
                    passwordStrong ? 'text-emerald-600' : 'text-slate-500'
                  }`}
                >
                  <ShieldCheck className="mt-0.5 size-3 shrink-0" />
                  {passwordStrong
                    ? 'Kombinasi sandi kuat dan siap digunakan.'
                    : 'Gunakan minimal 8 karakter agar sandi lebih aman.'}
                </p>
              )}
            </div>
          </div>

          <div>
            <label
              className={`flex cursor-pointer items-start gap-2.5 rounded-xl border p-3 transition ${
                values.consent
                  ? 'border-primary/30 bg-[#e7f4f1]/60'
                  : 'border-line bg-[#f8fafc]'
              }`}
            >
              <input
                type="checkbox"
                checked={values.consent}
                onChange={(event) => updateField('consent', event.target.checked)}
                className="mt-0.5 size-4 shrink-0 rounded border-line accent-primary focus:ring-primary/20"
              />
              <span className="min-w-0">
                <span className="block text-[11px] font-semibold text-ink">
                  Saya menyetujui Kebijakan Privasi &amp; Data Pribadi Ratis
                </span>
                <span className="mt-0.5 block text-[10px] leading-relaxed text-slate-500">
                  Data staf hanya digunakan untuk operasional toko dan tidak dibagikan ke pihak
                  ketiga.
                </span>
              </span>
            </label>
            {errors.consent ? (
              <p className="mt-1 text-[10.5px] font-medium text-red-500">
                {errors.consent}
              </p>
            ) : null}
          </div>
        </div>
        </div>

        <div className="flex shrink-0 flex-wrap items-center justify-between gap-2.5 border-t border-line bg-[#f8fafc] px-4 py-3.5 sm:px-5">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 items-center justify-center rounded-xl border border-line bg-white px-5 text-[12px] font-semibold text-slate-600 transition hover:bg-slate-50"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={submitting || atLimit}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-[12px] font-semibold text-white shadow-sm transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {submitting ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <UserPlus className="size-4" />
            )}
            {submitting ? 'Menyimpan...' : 'Simpan & Daftarkan Staf'}
          </button>
        </div>
      </form>
    </ModalShell>
  )
}
