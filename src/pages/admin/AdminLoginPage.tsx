import { useEffect, useState, type FormEvent } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  CircleHelp,
  Clock3,
  Eye,
  EyeOff,
  House,
  KeyRound,
  Loader2,
  Lock,
  Mail,
  ShieldCheck,
  type LucideIcon,
} from 'lucide-react'
import { AuthError, getAdminSession, loginAdmin, saveAdminSession } from '../../lib/auth'

type FieldErrors = {
  email?: string
  password?: string
}

const EMAIL_FORMAT_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const features: { icon: LucideIcon; title: string; description: string }[] = [
  {
    icon: BadgeCheck,
    title: 'Validasi NIB & Geotagging Otomatis',
    description: 'Sinkronisasi data pedagang dengan basis data perizinan nasional OSS.',
  },
  {
    icon: ShieldCheck,
    title: 'Audit Trail Kriptografis SHA-256',
    description:
      'Setiap persetujuan, penolakan, dan perubahan status tercatat permanen tanpa celah modifikasi.',
  },
  {
    icon: Clock3,
    title: 'Perlindungan Integritas Transaksi',
    description: 'Akses monitoring read-only tanpa hak manipulasi nota operasional pedagang.',
  },
]

function inputClass(hasError: boolean) {
  const base =
    'h-12 w-full rounded-xl border bg-white pl-11 text-sm text-ink outline-none transition placeholder:text-slate-400 focus:ring-4'
  return hasError
    ? `${base} border-red-300 focus:border-red-400 focus:ring-red-100`
    : `${base} border-line focus:border-primary focus:ring-primary/10`
}

export default function AdminLoginPage() {
  const navigate = useNavigate()
  const location = useLocation()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [notice, setNotice] = useState<string | null>(() => {
    const state = location.state as { expired?: boolean } | null
    return state?.expired ? 'Sesi Anda berakhir. Silakan masuk kembali.' : null
  })

  useEffect(() => {
    if (getAdminSession()) {
      navigate('/admin/dashboard', { replace: true })
    }
  }, [navigate])

  function clearFeedback() {
    setFormError(null)
    setNotice(null)
  }

  function handleEmailChange(value: string) {
    setEmail(value)
    clearFeedback()
    setFieldErrors((current) => ({ ...current, email: undefined }))
  }

  function handlePasswordChange(value: string) {
    setPassword(value)
    clearFeedback()
    setFieldErrors((current) => ({ ...current, password: undefined }))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (loading) return

    const nextErrors: FieldErrors = {}
    const trimmedEmail = email.trim()

    if (!trimmedEmail) {
      nextErrors.email = 'Email dinas wajib diisi.'
    } else if (!EMAIL_FORMAT_PATTERN.test(trimmedEmail)) {
      nextErrors.email = 'Format email tidak valid.'
    }

    if (!password) {
      nextErrors.password = 'Kata sandi wajib diisi.'
    } else if (password.length < 8) {
      nextErrors.password = 'Kata sandi minimal 8 karakter.'
    }

    setFieldErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    clearFeedback()
    setLoading(true)

    try {
      const session = await loginAdmin({ email: trimmedEmail, password })
      saveAdminSession(session, remember)
      navigate('/admin/dashboard', { replace: true })
    } catch (error) {
      if (error instanceof AuthError) {
        setFormError(error.message)
      } else {
        setFormError('Gagal masuk. Periksa koneksi lalu coba lagi.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <aside className="relative hidden min-h-screen flex-col justify-between overflow-hidden px-12 py-10 text-white lg:flex lg:w-[45%] xl:px-14">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-[#0f8078] via-[#0f766e] to-[#0a4b46]" />
          <div className="absolute -left-52 top-[16%] size-[620px] rounded-full border border-white/10" />
          <div className="absolute -left-24 top-[28%] size-[420px] rounded-full border border-white/10" />
          <div className="absolute -bottom-44 -right-32 size-[520px] rounded-full border border-white/10" />
          <div
            className="absolute inset-0 opacity-[0.16]"
            style={{
              backgroundImage: 'radial-gradient(rgba(255, 255, 255, 0.7) 1px, transparent 1px)',
              backgroundSize: '26px 26px',
            }}
          />
        </div>

        <div className="relative z-10 flex items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-2xl border border-white/30 bg-white/10">
              <House className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-extrabold tracking-tight">Ratis</span>
                <span className="rounded-md bg-white/95 px-2 py-0.5 text-[11px] font-bold text-primary">
                  Admin
                </span>
              </div>
              <p className="mt-0.5 text-xs font-medium text-white/70">
                Portal Pengawasan &amp; Kurasi UMKM
              </p>
            </div>
          </div>
        </div>

        <div className="relative z-10 max-w-[520px] py-14">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3.5 py-1.5 text-xs font-semibold text-white/90">
            <Lock className="size-3.5" />
            Pusat Tata Kelola Otoritas Tinggi
          </span>

          <h1 className="mt-8 text-[42px] font-extrabold leading-[1.08] tracking-[-0.02em] xl:text-[48px]">
            Kelola ekosistem UMKM dalam satu panel terpercaya.
          </h1>

          <p className="mt-6 max-w-[450px] text-[15px] leading-relaxed text-white/80">
            Verifikasi legalitas toko baru, pantau aliran pesanan lintas pedagang, dan pastikan
            kepatuhan standar kualitas nasional secara real-time.
          </p>

          <ul className="mt-8 space-y-5 border-t border-white/15 pt-7">
            {features.map(({ icon: Icon, title, description }) => (
              <li key={title} className="flex gap-4">
                <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/10">
                  <Icon className="size-[18px]" />
                </span>
                <div>
                  <p className="text-sm font-bold">{title}</p>
                  <p className="mt-1 text-[13px] leading-relaxed text-white/70">{description}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="relative z-10 flex flex-col gap-2 border-t border-white/15 pt-5 text-[11px] text-white/60 sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 Platform Ratis UMKM Indonesia.</p>
          <div className="flex gap-6">
            <span>Panduan Keamanan</span>
            <span>Pusat Bantuan Admin</span>
          </div>
        </div>
      </aside>

      <div className="flex min-h-screen flex-1 flex-col">
        <header className="flex items-center justify-between px-6 py-6 lg:justify-end lg:px-10 lg:py-8">
          <div className="flex items-center gap-2.5 lg:hidden">
            <div className="flex size-9 items-center justify-center rounded-xl bg-primary text-white">
              <House className="size-4" />
            </div>
            <span className="text-lg font-extrabold tracking-tight text-ink">
              Ratis <span className="ml-1 rounded bg-primary-soft px-1.5 py-0.5 text-[10px] font-bold text-primary">Admin</span>
            </span>
          </div>
          <button
            type="button"
            onClick={() => setNotice('Hubungi superadmin platform melalui kanal dukungan internal Ratis.')}
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 transition hover:text-primary"
          >
            <CircleHelp className="size-4" />
            Butuh Bantuan Akses?
          </button>
        </header>

        <main className="flex flex-1 items-center justify-center px-5 pb-10 sm:px-8">
          <section className="w-full max-w-[560px] rounded-3xl border border-line bg-white p-6 shadow-[0_24px_60px_-24px_rgba(15,23,42,0.18)] sm:p-9">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-primary-soft/50 text-primary">
              <Lock className="size-6" />
            </div>

            <h1 className="mt-6 text-[30px] font-extrabold leading-tight tracking-tight text-ink sm:text-[32px]">
              Masuk ke Panel Admin
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-slate-500">
              Gunakan akun resmi dengan role <span className="font-bold text-ink">SUPERADMIN</span>{' '}
              atau <span className="font-bold text-ink">VERIFIKATOR</span> yang telah terdaftar di
              direktori Ratis.
            </p>

            <div className="mt-6 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50/80 p-4 text-sm leading-relaxed text-amber-900">
              <AlertTriangle className="mt-0.5 size-[18px] shrink-0 text-amber-600" />
              <p>
                <span className="font-bold">Proteksi Batas Percobaan:</span> Maksimal 10 percobaan
                per menit per alamat IP. Sesi login admin berlaku selama 8 jam kerja.
              </p>
            </div>

            {notice && (
              <div
                role="status"
                className="mt-4 flex items-start gap-2.5 rounded-xl border border-sky-200 bg-sky-50 p-3.5 text-sm leading-relaxed text-sky-900"
              >
                <CircleHelp className="mt-0.5 size-4 shrink-0 text-sky-600" />
                <p>{notice}</p>
              </div>
            )}

            {formError && (
              <div
                role="alert"
                className="mt-4 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3.5 text-sm leading-relaxed text-red-900"
              >
                <AlertTriangle className="mt-0.5 size-4 shrink-0 text-red-600" />
                <p>{formError}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-5">
              <div>
                <label htmlFor="email" className="mb-2 block text-sm font-semibold text-ink">
                  Alamat Email Dinas <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                  <input
                    id="email"
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    autoFocus
                    placeholder="nama@ratis.id"
                    value={email}
                    onChange={(event) => handleEmailChange(event.target.value)}
                    aria-invalid={Boolean(fieldErrors.email)}
                    aria-describedby={fieldErrors.email ? 'email-error' : 'email-help'}
                    className={inputClass(Boolean(fieldErrors.email))}
                  />
                </div>
                {fieldErrors.email ? (
                  <p id="email-error" className="mt-1.5 text-xs font-medium text-red-600">
                    {fieldErrors.email}
                  </p>
                ) : (
                  <p id="email-help" className="mt-1.5 text-xs text-slate-400">
                    Harus menggunakan domain resmi @ratis.id
                  </p>
                )}
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <label htmlFor="password" className="block text-sm font-semibold text-ink">
                    Kata Sandi <span className="text-red-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      setNotice('Pemulihan kata sandi dilakukan oleh superadmin Ratis.')
                    }
                    className="text-xs font-semibold text-primary transition hover:text-primary-hover hover:underline"
                  >
                    Lupa Sandi?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="Masukkan kata sandi"
                    value={password}
                    onChange={(event) => handlePasswordChange(event.target.value)}
                    aria-invalid={Boolean(fieldErrors.password)}
                    aria-describedby={fieldErrors.password ? 'password-error' : undefined}
                    className={`${inputClass(Boolean(fieldErrors.password))} pr-12`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((current) => !current)}
                    aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                    className="absolute right-3 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
                {fieldErrors.password && (
                  <p id="password-error" className="mt-1.5 text-xs font-medium text-red-600">
                    {fieldErrors.password}
                  </p>
                )}
              </div>

              <label className="flex cursor-pointer items-center gap-2.5 text-sm text-slate-600">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(event) => setRemember(event.target.checked)}
                  className="size-4 rounded border-line accent-primary"
                />
                Ingat sesi di perangkat terpercaya ini
              </label>

              <button
                type="submit"
                disabled={loading}
                className="group flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/25 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loading ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Memproses...
                  </>
                ) : (
                  <>
                    Masuk ke Panel Operasional
                    <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 flex items-center gap-3">
              <span className="h-px flex-1 bg-line" />
              <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                Prosedur Keamanan Khusus
              </span>
              <span className="h-px flex-1 bg-line" />
            </div>

            <button
              type="button"
              onClick={() => setNotice('Metode FIDO2 / SSO belum tersedia di versi demo ini.')}
              className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-line bg-white px-6 text-sm font-semibold text-ink transition hover:border-slate-300 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/15"
            >
              <KeyRound className="size-4 text-slate-500" />
              Masuk Menggunakan Kunci Keamanan FIDO2 / SSO
            </button>

            <p className="mt-6 text-center text-xs leading-relaxed text-slate-500">
              Bukan staf pengelola portal? Kunjungi{' '}
              <button
                type="button"
                onClick={() => setNotice('Halaman publik Ratis akan tersedia pada rilis berikutnya.')}
                className="font-semibold text-primary transition hover:text-primary-hover hover:underline"
              >
                Halaman Utama Publik Ratis
              </button>{' '}
              atau{' '}
              <button
                type="button"
                onClick={() => navigate('/')}
                className="font-semibold text-primary transition hover:text-primary-hover hover:underline"
              >
                Portal Mitra Pedagang
              </button>
            </p>
          </section>
        </main>
      </div>
    </div>
  )
}
