import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CircleHelp,
  Eye,
  EyeOff,
  Globe,
  IdCard,
  Info,
  Loader2,
  Lock,
  Mail,
  ShieldCheck,
  Sparkles,
  Star,
  Store,
  Trash2,
  Upload,
  User,
} from 'lucide-react'
import { AuthError } from '../../lib/auth'
import { registerOwner, saveOwnerSession } from '../../lib/owner-auth'

type FormState = {
  ownerName: string
  phone: string
  email: string
  password: string
  confirmPassword: string
  storeName: string
  description: string
  address: string
  nib: string
}

const initialForm: FormState = {
  ownerName: '',
  phone: '',
  email: '',
  password: '',
  confirmPassword: '',
  storeName: '',
  description: '',
  address: '',
  nib: '',
}

type FieldKey =
  | keyof FormState
  | 'photo'
  | 'terms'

type FieldErrors = Partial<Record<FieldKey, string>>

const EMAIL_FORMAT_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const benefits = [
  'Tanpa biaya pendaftaran & langsung siap pakai',
  'Siapkan katalog produk saat toko diverifikasi',
  'Laporan keuangan dan laba rugi otomatis',
  'Dukungan penuh tim verifikasi 1x24 jam',
]

const MAX_PHOTO_SIZE = 2 * 1024 * 1024

function inputClass(hasError: boolean) {
  const base =
    'h-12 w-full rounded-[10px] border bg-[#f7f9fc] px-3.5 text-sm text-ink outline-none transition placeholder:text-slate-400 focus:bg-white focus:ring-4'
  return hasError
    ? `${base} border-red-300 focus:border-red-400 focus:ring-red-100`
    : `${base} border-line focus:border-primary focus:ring-primary/10`
}

function textareaClass(hasError: boolean) {
  const base =
    'w-full rounded-[10px] border bg-[#f7f9fc] px-3.5 py-3 text-sm text-ink outline-none transition placeholder:text-slate-400 focus:bg-white focus:ring-4'
  return hasError
    ? `${base} border-red-300 focus:border-red-400 focus:ring-red-100`
    : `${base} border-line focus:border-primary focus:ring-primary/10`
}

export default function OwnerRegisterPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState<FormState>(initialForm)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [photo, setPhoto] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState<1 | 2>(1)

  const stageOneFields = [
    form.ownerName,
    form.phone,
    form.email,
    form.password,
    form.confirmPassword,
  ]
  const stageOneFilled = stageOneFields.filter((value) => value.trim().length > 0).length
  const stageTwoFilled =
    (form.storeName.trim() ? 1 : 0) +
    (form.address.trim() ? 1 : 0) +
    (termsAccepted ? 1 : 0)
  const progress = Math.round(
    (stageOneFilled / stageOneFields.length) * 50 + (stageTwoFilled / 3) * 50,
  )

  useEffect(() => {
    if (!photoPreview) return
    return () => {
      URL.revokeObjectURL(photoPreview)
    }
  }, [photoPreview])

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }))
    setFormError(null)
    setFieldErrors((current) => ({ ...current, [key]: undefined }))
  }

  function handlePhoneChange(value: string) {
    updateField('phone', value.replace(/[^\d\s+-]/g, ''))
  }

  function handleNibChange(value: string) {
    updateField('nib', value.replace(/\D/g, '').slice(0, 13))
  }

  function handlePhotoChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    if (file.type !== 'image/jpeg' && file.type !== 'image/png') {
      setFieldErrors((current) => ({
        ...current,
        photo: 'Format foto harus JPG atau PNG. Anda dapat melanjutkan tanpa foto.',
      }))
      return
    }

    if (file.size > MAX_PHOTO_SIZE) {
      setFieldErrors((current) => ({
        ...current,
        photo: 'Foto gagal diunggah, ukuran maksimal 2 MB. Anda dapat melanjutkan tanpa foto.',
      }))
      return
    }

    setPhoto(file)
    setPhotoPreview(URL.createObjectURL(file))
    setFieldErrors((current) => ({ ...current, photo: undefined }))
  }

  function handleRemovePhoto() {
    setPhoto(null)
    setPhotoPreview(null)
    setFieldErrors((current) => ({ ...current, photo: undefined }))
  }

  function validateAccount(): FieldErrors {
    const next: FieldErrors = {}
    const phoneDigits = form.phone.replace(/\D/g, '').replace(/^0+/, '')

    if (form.ownerName.trim().length < 3) {
      next.ownerName = 'Nama lengkap pemilik minimal 3 karakter.'
    }

    if (phoneDigits.length < 9) {
      next.phone = 'Nomor WhatsApp/HP minimal 9 digit.'
    } else if (phoneDigits.length > 13) {
      next.phone = 'Nomor WhatsApp/HP terlalu panjang.'
    }

    if (!form.email.trim()) {
      next.email = 'Email aktif wajib diisi.'
    } else if (!EMAIL_FORMAT_PATTERN.test(form.email.trim())) {
      next.email = 'Format email tidak valid.'
    }

    if (!form.password) {
      next.password = 'Kata sandi wajib diisi.'
    } else if (form.password.length < 8) {
      next.password = 'Kata sandi minimal 8 karakter.'
    } else if (!/[A-Za-z]/.test(form.password) || !/\d/.test(form.password)) {
      next.password = 'Kata sandi harus kombinasi huruf dan angka.'
    }

    if (!form.confirmPassword) {
      next.confirmPassword = 'Konfirmasi kata sandi wajib diisi.'
    } else if (form.confirmPassword !== form.password) {
      next.confirmPassword = 'Konfirmasi kata sandi tidak sama.'
    }

    return next
  }

  function validateStore(): FieldErrors {
    const next: FieldErrors = {}

    if (form.storeName.trim().length < 3) {
      next.storeName = 'Nama toko/usaha minimal 3 karakter.'
    }

    if (form.description.length > 200) {
      next.description = 'Deskripsi singkat maksimal 200 karakter.'
    }

    if (form.address.trim().length < 10) {
      next.address = 'Alamat lengkap toko wajib diisi minimal 10 karakter.'
    }

    if (form.nib && form.nib.length !== 13) {
      next.nib = 'NIB harus terdiri dari 13 digit angka.'
    }

    if (!termsAccepted) {
      next.terms = 'Anda harus menyetujui Ketentuan Layanan dan Kebijakan Privasi.'
    }

    return next
  }

  function handleNext() {
    const nextErrors = validateAccount()
    setFieldErrors(nextErrors)
    setFormError(null)
    if (Object.keys(nextErrors).length > 0) return
    setStep(2)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function handleBack() {
    setStep(1)
    setFormError(null)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (loading) return

    const accountErrors = validateAccount()
    const storeErrors = validateStore()
    const nextErrors = { ...accountErrors, ...storeErrors }
    setFieldErrors(nextErrors)
    setFormError(null)

    if (Object.keys(nextErrors).length > 0) {
      if (Object.keys(accountErrors).length > 0) {
        setStep(1)
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }
      return
    }

    setLoading(true)

    try {
      const session = await registerOwner({
        ownerName: form.ownerName,
        email: form.email,
        phone: form.phone,
        password: form.password,
        storeName: form.storeName,
        storeDescription: form.description,
        storeAddress: form.address,
        nib: form.nib,
      })
      saveOwnerSession(session, true)
      navigate('/owner/dashboard', { replace: true, state: { registered: true } })
    } catch (error) {
      if (error instanceof AuthError) {
        if (error.code === 'email-taken') {
          setStep(1)
          setFieldErrors((current) => ({ ...current, email: error.message }))
          window.scrollTo({ top: 0, behavior: 'smooth' })
        } else {
          setFormError(error.message)
        }
      } else {
        setFormError('Pendaftaran gagal. Periksa koneksi lalu coba lagi.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#f5f7fb]">
      <header className="border-b border-line bg-white">
        <div className="flex h-[76px] items-center justify-between gap-4 px-5 sm:px-8 lg:px-16">
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-xl bg-[#0b3b3a] text-lg font-extrabold text-white">
              R
            </div>
            <div className="leading-tight">
              <p className="text-[22px] font-extrabold tracking-tight text-ink">Ratis</p>
              <p className="text-xs font-medium text-slate-500">Portal Pemilik UMKM</p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-sm font-semibold text-slate-700 sm:gap-6">
            <span className="flex items-center gap-2">
              <ShieldCheck className="size-[18px] text-slate-600" />
              <span className="hidden sm:inline">Aman &amp; Terenkripsi</span>
            </span>
            <span aria-hidden className="hidden h-6 w-px bg-line sm:block" />
            <span className="flex items-center gap-2">
              <CircleHelp className="size-[18px] text-slate-600" />
              <span>Bantuan</span>
            </span>
          </div>
        </div>
      </header>

      <main className="flex flex-1 flex-col lg:flex-row">
        <aside className="relative hidden overflow-hidden bg-[#0d7a70] lg:flex lg:w-[36%] lg:flex-col">
          <div aria-hidden className="pointer-events-none absolute inset-0">
            <div className="absolute inset-0 bg-gradient-to-br from-[#0f857a] via-[#0d7a70] to-[#0a655d]" />
            <div
              className="absolute inset-0"
              style={{
                backgroundImage:
                  'linear-gradient(45deg, rgba(255,255,255,0.045) 25%, transparent 25%, transparent 75%, rgba(255,255,255,0.045) 75%), linear-gradient(45deg, rgba(255,255,255,0.045) 25%, transparent 25%, transparent 75%, rgba(255,255,255,0.045) 75%)',
                backgroundPosition: '0 0, 56px 56px',
                backgroundSize: '112px 112px',
              }}
            />
            <div className="absolute -right-40 -top-40 size-[520px] rounded-full bg-white/5 blur-3xl" />
          </div>

          <div className="relative z-10 px-10 py-10 xl:px-12 xl:py-12">
            <div className="flex items-center gap-3.5">
              <div className="flex size-12 items-center justify-center rounded-2xl bg-white text-primary shadow-sm">
                <span className="text-xl font-extrabold">R</span>
              </div>
              <div>
                <p className="text-[22px] font-extrabold leading-none tracking-tight text-white">
                  RatisBisnis
                </p>
                <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/60">
                  Ekosistem UMKM Mandiri
                </p>
              </div>
            </div>

            <span className="mt-7 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-1.5 text-xs font-semibold text-white/90">
              <Sparkles className="size-4" />
              Registrasi Cepat Mitra Baru
            </span>

            <h1 className="mt-5 max-w-[400px] text-[32px] font-extrabold leading-[1.18] tracking-[-0.02em] text-white xl:text-[34px]">
              Mulai Perjalanan Digital Usaha Anda
            </h1>

            <p className="mt-4 max-w-[390px] text-sm leading-relaxed text-white/75">
              Bergabunglah bersama ribuan mitra UMKM Ratis. Kelola pesanan, stok, dan pembukuan
              dalam satu aplikasi terintegrasi.
            </p>

            <ul className="mt-7 space-y-3.5">
              {benefits.map((benefit) => (
                <li key={benefit} className="flex items-start gap-3 text-[13px] font-medium text-white/90">
                  <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-[#0a9c8c] text-white">
                    <Check className="size-3" strokeWidth={3} />
                  </span>
                  {benefit}
                </li>
              ))}
            </ul>
          </div>

          <div className="relative z-10 mt-auto px-10 pb-10 xl:px-12 xl:pb-12">
            <div className="rounded-2xl border border-white/10 bg-white/[0.07] p-4">
              <div className="flex gap-1 text-white">
                {[0, 1, 2, 3, 4].map((index) => (
                  <Star key={index} className="size-3.5" />
                ))}
              </div>
              <p className="mt-2.5 text-[12.5px] italic leading-relaxed text-white/85">
                “Pencatatan kas dan stok diwarung saya jadi rapi tanpa pusing selisih.
                Verifikasinya cepat dan didampingi sampai bisa.”
              </p>
              <div className="mt-3 flex items-center gap-2.5">
                <span className="flex size-8 items-center justify-center rounded-full bg-[#a7f3d0] text-[10px] font-bold text-[#0f766e]">
                  SN
                </span>
                <div>
                  <p className="text-xs font-bold text-white">Siti Nurhaliza</p>
                  <p className="text-[10.5px] text-white/60">
                    Pemilik Kopi Seduh Nusantara, Bandung
                  </p>
                </div>
              </div>
            </div>

            <p className="mt-4 flex items-center gap-2 text-[11px] text-white/60">
              <Lock className="size-3.5" />
              Data Usaha Terenkripsi &amp; Terlindungi Standar BI
            </p>
          </div>
        </aside>

        <section className="flex flex-1 justify-center px-5 py-8 sm:px-8 lg:px-10 lg:py-10">
          <div className="w-full max-w-[780px]">
            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => navigate('/')}
                className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-primary"
              >
                <ArrowLeft className="size-4" />
                Kembali Login
              </button>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-white px-3 py-1.5 text-xs font-semibold text-slate-600">
                <Globe className="size-3.5" />
                ID (Bahasa Indonesia)
              </span>
            </div>

            <h1 className="mt-6 text-[28px] font-extrabold leading-tight tracking-tight text-ink sm:text-[32px]">
              Daftarkan Akun &amp; Toko Anda
            </h1>
            <p className="mt-1.5 max-w-[560px] text-sm leading-relaxed text-slate-500">
              Lengkapi formulir di bawah ini untuk memulai registrasi usaha. Proses hanya
              membutuhkan waktu kurang dari 5 menit.
            </p>

            <div className="mt-5 flex items-center gap-3 rounded-xl border border-line bg-white px-4 py-3.5 sm:gap-4 sm:px-5">
              <div className="flex items-center gap-2.5">
                {step === 2 ? (
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#dcfce7] text-[#15803d]">
                    <Check className="size-4" strokeWidth={3} />
                  </span>
                ) : (
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">
                    1
                  </span>
                )}
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                    Tahap 1
                  </p>
                  <p className="text-[13px] font-semibold text-ink">Data Akun Pemilik</p>
                </div>
              </div>
              <span className="h-[3px] flex-1 overflow-hidden rounded-full bg-primary/20">
                <span
                  className="block h-full rounded-full bg-primary transition-[width] duration-500 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </span>
              <div className="flex items-center gap-2.5">
                <span
                  className={`flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                    step === 2 ? 'bg-primary text-white' : 'bg-primary-soft text-primary'
                  }`}
                >
                  2
                </span>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                    Tahap 2
                  </p>
                  <p className="text-[13px] font-semibold text-ink">Data Profil Toko</p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} noValidate className="mt-5 space-y-5">
              {step === 1 && (
              <section className="overflow-hidden rounded-2xl border border-line bg-white shadow-[0_1px_2px_rgba(15,23,42,0.06)]">
                <header className="flex items-center justify-between gap-3 border-b border-line bg-[#f4f6fa] px-5 py-4 sm:px-6">
                  <div className="flex items-center gap-3">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#e3f5ef] text-primary">
                      <IdCard className="size-5" />
                    </span>
                    <div>
                      <h2 className="text-[17px] font-bold text-ink">Data Akun Pemilik</h2>
                      <p className="text-xs text-slate-500">Identitas penanggung jawab resmi toko</p>
                    </div>
                  </div>
                  <span className="shrink-0 rounded-full bg-primary-soft/70 px-2.5 py-1 text-[11px] font-semibold text-primary">
                    Langkah 1/2
                  </span>
                </header>

                <div className="space-y-5 p-5 sm:p-6">
                  <div className="grid gap-5 sm:grid-cols-2">
                    <div>
                      <label htmlFor="ownerName" className="mb-1.5 block text-[13px] font-semibold text-slate-700">
                        Nama Lengkap Pemilik <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <User className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                        <input
                          id="ownerName"
                          type="text"
                          autoComplete="name"
                          autoFocus
                          placeholder="Contoh: Budi Santoso"
                          value={form.ownerName}
                          onChange={(event) => updateField('ownerName', event.target.value)}
                          aria-invalid={Boolean(fieldErrors.ownerName)}
                          className={`${inputClass(Boolean(fieldErrors.ownerName))} pl-10`}
                        />
                      </div>
                      {fieldErrors.ownerName && (
                        <p className="mt-1.5 text-xs font-medium text-red-600">{fieldErrors.ownerName}</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="phone" className="mb-1.5 block text-[13px] font-semibold text-slate-700">
                        Nomor WhatsApp/HP <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-500">
                          +62
                        </span>
                        <input
                          id="phone"
                          type="tel"
                          inputMode="tel"
                          autoComplete="tel"
                          placeholder="812-3456-7890"
                          value={form.phone}
                          onChange={(event) => handlePhoneChange(event.target.value)}
                          aria-invalid={Boolean(fieldErrors.phone)}
                          className={`${inputClass(Boolean(fieldErrors.phone))} pl-14`}
                        />
                      </div>
                      {fieldErrors.phone && (
                        <p className="mt-1.5 text-xs font-medium text-red-600">{fieldErrors.phone}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label htmlFor="email" className="mb-1.5 block text-[13px] font-semibold text-slate-700">
                      Email Aktif <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Mail className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                      <input
                        id="email"
                        type="email"
                        inputMode="email"
                        autoComplete="email"
                        placeholder="namausaha@gmail.com"
                        value={form.email}
                        onChange={(event) => updateField('email', event.target.value)}
                        aria-invalid={Boolean(fieldErrors.email)}
                        aria-describedby={fieldErrors.email ? 'email-error' : 'email-help'}
                        className={`${inputClass(Boolean(fieldErrors.email))} pl-10`}
                      />
                    </div>
                    {fieldErrors.email ? (
                      <p id="email-error" className="mt-1.5 text-xs font-medium text-red-600">
                        {fieldErrors.email}
                      </p>
                    ) : (
                      <p id="email-help" className="mt-1.5 flex items-center gap-1.5 text-xs text-slate-500">
                        <Info className="size-3.5 shrink-0 text-slate-400" />
                        Digunakan untuk verifikasi akun dan laporan bulanan
                      </p>
                    )}
                  </div>

                  <div className="grid gap-5 sm:grid-cols-2">
                    <div>
                      <label htmlFor="password" className="mb-1.5 block text-[13px] font-semibold text-slate-700">
                        Kata Sandi <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          id="password"
                          type={showPassword ? 'text' : 'password'}
                          autoComplete="new-password"
                          placeholder="Minimal 8 karakter"
                          value={form.password}
                          onChange={(event) => updateField('password', event.target.value)}
                          aria-invalid={Boolean(fieldErrors.password)}
                          className={`${inputClass(Boolean(fieldErrors.password))} pr-11`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((current) => !current)}
                          aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                          className="absolute right-2.5 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                        >
                          {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                        </button>
                      </div>
                      {fieldErrors.password ? (
                        <p className="mt-1.5 text-xs font-medium text-red-600">{fieldErrors.password}</p>
                      ) : (
                        <p className="mt-1.5 text-xs text-slate-500">
                          Min. 8 karakter kombinasi huruf &amp; angka
                        </p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="confirmPassword" className="mb-1.5 block text-[13px] font-semibold text-slate-700">
                        Konfirmasi Kata Sandi <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          id="confirmPassword"
                          type={showConfirmPassword ? 'text' : 'password'}
                          autoComplete="new-password"
                          placeholder="Ulangi kata sandi"
                          value={form.confirmPassword}
                          onChange={(event) => updateField('confirmPassword', event.target.value)}
                          aria-invalid={Boolean(fieldErrors.confirmPassword)}
                          className={`${inputClass(Boolean(fieldErrors.confirmPassword))} pr-11`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword((current) => !current)}
                          aria-label={
                            showConfirmPassword ? 'Sembunyikan konfirmasi kata sandi' : 'Tampilkan konfirmasi kata sandi'
                          }
                          className="absolute right-2.5 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                        >
                          {showConfirmPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                        </button>
                      </div>
                      {fieldErrors.confirmPassword ? (
                        <p className="mt-1.5 text-xs font-medium text-red-600">{fieldErrors.confirmPassword}</p>
                      ) : (
                        <p className="mt-1.5 text-xs text-slate-500">Pastikan kata sandi identik</p>
                      )}
                    </div>
                  </div>

                  <div className="border-t border-line pt-5 sm:flex sm:justify-end">
                    <button
                      type="button"
                      onClick={handleNext}
                      className="group flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/25 sm:w-auto"
                    >
                      Lanjut ke Data Toko
                      <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                    </button>
                  </div>
                </div>
              </section>
              )}

              {step === 2 && (
              <>
              <section className="overflow-hidden rounded-2xl border border-line bg-white shadow-[0_1px_2px_rgba(15,23,42,0.06)]">
                <header className="flex items-center justify-between gap-3 border-b border-line bg-[#f4f6fa] px-5 py-4 sm:px-6">
                  <div className="flex items-center gap-3">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#e3f5ef] text-primary">
                      <Store className="size-5" />
                    </span>
                    <div>
                      <h2 className="text-[17px] font-bold text-ink">Data Toko &amp; Usaha</h2>
                      <p className="text-xs text-slate-500">
                        Informasi gerai yang akan ditampilkan ke pelanggan
                      </p>
                    </div>
                  </div>
                  <span className="shrink-0 rounded-full bg-primary-soft/70 px-2.5 py-1 text-[11px] font-semibold text-primary">
                    Langkah 2/2
                  </span>
                </header>

                <div className="space-y-5 p-5 sm:p-6">
                  <div>
                    <label htmlFor="storeName" className="mb-1.5 block text-[13px] font-semibold text-slate-700">
                      Nama Toko/Usaha <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Store className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                      <input
                        id="storeName"
                        type="text"
                        autoComplete="organization"
                        autoFocus
                        placeholder="Contoh: Toko Berkah Jaya Snack"
                        value={form.storeName}
                        onChange={(event) => updateField('storeName', event.target.value)}
                        aria-invalid={Boolean(fieldErrors.storeName)}
                        className={`${inputClass(Boolean(fieldErrors.storeName))} pl-10`}
                      />
                    </div>
                    {fieldErrors.storeName && (
                      <p className="mt-1.5 text-xs font-medium text-red-600">{fieldErrors.storeName}</p>
                    )}
                  </div>

                  <div>
                    <div className="mb-1.5 flex items-center justify-between gap-3">
                      <label htmlFor="description" className="block text-[13px] font-semibold text-slate-700">
                        Deskripsi Singkat Toko
                      </label>
                      <span className="text-xs tabular-nums text-slate-400">
                        {form.description.length}/200
                      </span>
                    </div>
                    <textarea
                      id="description"
                      rows={3}
                      maxLength={200}
                      placeholder="Jelaskan produk utama, jam operasional, atau keunggulan usaha Anda..."
                      value={form.description}
                      onChange={(event) => updateField('description', event.target.value)}
                      aria-invalid={Boolean(fieldErrors.description)}
                      className={textareaClass(Boolean(fieldErrors.description))}
                    />
                    {fieldErrors.description && (
                      <p className="mt-1.5 text-xs font-medium text-red-600">{fieldErrors.description}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="address" className="mb-1.5 block text-[13px] font-semibold text-slate-700">
                      Alamat Lengkap Toko/Lokasi Produksi <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      id="address"
                      rows={3}
                      placeholder="Jl. Merdeka No. 12, Kelurahan, Kecamatan, Kota/Kabupaten, Kode Pos"
                      value={form.address}
                      onChange={(event) => updateField('address', event.target.value)}
                      aria-invalid={Boolean(fieldErrors.address)}
                      className={textareaClass(Boolean(fieldErrors.address))}
                    />
                    {fieldErrors.address && (
                      <p className="mt-1.5 text-xs font-medium text-red-600">{fieldErrors.address}</p>
                    )}
                  </div>

                  <div className="grid gap-5 sm:grid-cols-2">
                    <div>
                      <div className="mb-1.5 flex flex-wrap items-center gap-2">
                        <label htmlFor="nib" className="text-[13px] font-semibold text-slate-700">
                          Nomor Induk Berusaha (NIB)
                        </label>
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500">
                          Opsional
                        </span>
                      </div>
                      <input
                        id="nib"
                        type="text"
                        inputMode="numeric"
                        placeholder="13 digit angka NIB jika ada"
                        value={form.nib}
                        onChange={(event) => handleNibChange(event.target.value)}
                        aria-invalid={Boolean(fieldErrors.nib)}
                        className={inputClass(Boolean(fieldErrors.nib))}
                      />
                      {fieldErrors.nib ? (
                        <p className="mt-1.5 text-xs font-medium text-red-600">{fieldErrors.nib}</p>
                      ) : (
                        <p className="mt-1.5 text-xs text-slate-500">
                          Dapat dilengkapi nanti di menu pengaturan toko
                        </p>
                      )}
                    </div>

                    <div>
                      <div className="mb-1.5 flex flex-wrap items-center gap-2">
                        <span className="text-[13px] font-semibold text-slate-700">
                          Foto Tempat Usaha/Produk Utama
                        </span>
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500">
                          Opsional
                        </span>
                      </div>

                      {photoPreview ? (
                        <div className="relative overflow-hidden rounded-[10px] border border-line">
                          <img
                            src={photoPreview}
                            alt="Pratinjau foto tempat usaha"
                            className="h-[104px] w-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={handleRemovePhoto}
                            aria-label="Hapus foto tempat usaha"
                            className="absolute right-2 top-2 flex size-8 items-center justify-center rounded-lg bg-white/90 text-red-600 shadow-sm transition hover:bg-white"
                          >
                            <Trash2 className="size-4" />
                          </button>
                          <p className="truncate border-t border-line bg-white px-3 py-1.5 text-xs text-slate-500">
                            {photo?.name}
                          </p>
                        </div>
                      ) : (
                        <label
                          htmlFor="photo"
                          className="flex h-[104px] cursor-pointer items-center justify-center gap-3 rounded-[10px] border border-line bg-[#f7f9fc] px-4 text-center transition hover:border-primary/40 hover:bg-primary-soft/20"
                        >
                          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#e3f5ef] text-primary">
                            <Upload className="size-4" />
                          </span>
                          <span>
                            <span className="block text-[13px] font-semibold text-ink">
                              Unggah Berkas Foto
                            </span>
                            <span className="mt-0.5 block text-[11px] text-slate-500">
                              JPG, PNG (Maks 2 MB)
                            </span>
                          </span>
                          <input
                            id="photo"
                            type="file"
                            accept="image/jpeg,image/png"
                            className="sr-only"
                            onChange={handlePhotoChange}
                          />
                        </label>
                      )}

                      {fieldErrors.photo && (
                        <p className="mt-1.5 text-xs font-medium text-red-600">{fieldErrors.photo}</p>
                      )}
                    </div>
                  </div>
                </div>
              </section>

              <section className="rounded-2xl border border-line bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.06)] sm:p-6">
                {formError && (
                  <div
                    role="alert"
                    className="mb-4 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3.5 text-sm leading-relaxed text-red-900"
                  >
                    <Info className="mt-0.5 size-4 shrink-0 text-red-600" />
                    <p>{formError}</p>
                  </div>
                )}

                <label className="flex cursor-pointer items-start gap-2.5 text-[13px] leading-relaxed text-slate-600">
                  <input
                    type="checkbox"
                    checked={termsAccepted}
                    onChange={(event) => {
                      setTermsAccepted(event.target.checked)
                      setFieldErrors((current) => ({ ...current, terms: undefined }))
                    }}
                    className="mt-0.5 size-4 shrink-0 rounded border-line accent-primary"
                  />
                  <span>
                    Saya menyetujui{' '}
                    <span className="font-semibold text-ink">Ketentuan Layanan</span> dan{' '}
                    <span className="font-semibold text-ink">Kebijakan Privasi</span> Ratis UMKM.
                  </span>
                </label>
                {fieldErrors.terms && (
                  <p className="mt-1.5 text-xs font-medium text-red-600">{fieldErrors.terms}</p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="group mt-5 flex h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/25 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {loading ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Mendaftarkan...
                    </>
                  ) : (
                    <>
                      Daftarkan Usaha Saya
                      <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleBack}
                  disabled={loading}
                  className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-semibold text-slate-600 transition hover:text-primary disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <ArrowLeft className="size-4" />
                  Kembali ke Data Akun
                </button>

                <p className="mt-2 text-center text-sm text-slate-600">
                  Sudah memiliki akun?{' '}
                  <button
                    type="button"
                    onClick={() => navigate('/')}
                    className="font-semibold text-primary transition hover:text-primary-hover hover:underline"
                  >
                    Masuk
                  </button>
                </p>
              </section>
              </>
              )}
            </form>
          </div>
        </section>
      </main>

      <footer className="border-t border-line bg-[#f5f7fb]">
        <div className="flex flex-col gap-3 px-5 py-5 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-16">
          <p>© 2024 Ratis Indonesia. Platform Solusi Bisnis &amp; Pembukuan UMKM Digital.</p>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <span>Kebijakan Privasi</span>
            <span>Syarat &amp; Ketentuan</span>
            <span>Pusat Bantuan UMKM</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
