import { useEffect, useState, type FormEvent } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  Calculator,
  ChevronRight,
  CircleHelp,
  ClipboardList,
  Eye,
  EyeOff,
  Info,
  Loader2,
  Lock,
  Mail,
  ShieldCheck,
  Store,
  TrendingUp,
  type LucideIcon,
} from 'lucide-react'
import { AuthError } from '../../lib/auth'
import {
  getOwnerSession,
  loginOwner,
  saveOwnerSession,
} from '../../lib/owner-auth'

type FieldErrors = {
  email?: string
  password?: string
}

const EMAIL_FORMAT_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const features: { icon: LucideIcon; title: string; description: string }[] = [
  {
    icon: TrendingUp,
    title: 'Pantau Penjualan Real-time',
    description: 'Grafik omzet harian dan pergerakan kas masuk sekitar tanpa jeda.',
  },
  {
    icon: ClipboardList,
    title: 'Kelola Stok & Pesanan Cepat',
    description: 'Notifikasi otomatis saat stok menipis dan proses transaksi kilat.',
  },
  {
    icon: Calculator,
    title: 'Catatan Keuangan Otomatis',
    description: 'Rekapitulasi laba rugi bulanan rapi, siap cetak untuk perbankan.',
  },
]

const trustedOwners = ['JK', 'BD', 'SM']

function inputClass(hasError: boolean) {
  const base =
    'h-[52px] w-full rounded-xl border bg-white pl-11 text-sm text-ink outline-none transition placeholder:text-slate-400 focus:ring-4'
  return hasError
    ? `${base} border-red-300 focus:border-red-400 focus:ring-red-100`
    : `${base} border-line focus:border-primary focus:ring-primary/10`
}

export default function OwnerLoginPage() {
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
    if (getOwnerSession()) {
      navigate('/owner/dashboard', { replace: true })
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
      nextErrors.email = 'Email usaha wajib diisi.'
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
      const session = await loginOwner({ email: trimmedEmail, password })
      saveOwnerSession(session, remember)
      navigate('/owner/dashboard', { replace: true })
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
            <button
              type="button"
              onClick={() =>
                setNotice(
                  'Koneksi Ratis dilindungi enkripsi SSL 256-bit. Data toko Anda tidak dibagikan tanpa izin.',
                )
              }
              className="flex items-center gap-2 transition hover:text-primary"
            >
              <ShieldCheck className="size-[18px] text-slate-600" />
              <span className="hidden sm:inline">Aman &amp; Terenkripsi</span>
            </button>
            <span aria-hidden className="hidden h-6 w-px bg-line sm:block" />
            <button
              type="button"
              onClick={() => setNotice('Pusat bantuan pemilik UMKM akan tersedia pada rilis berikutnya.')}
              className="flex items-center gap-2 transition hover:text-primary"
            >
              <CircleHelp className="size-[18px] text-slate-600" />
              <span>Bantuan</span>
            </button>
          </div>
        </div>
      </header>

      <main className="flex flex-1 flex-col lg:flex-row">
        <aside className="relative hidden overflow-hidden bg-[#0d7a70] lg:flex lg:w-[45%] lg:flex-col lg:justify-between">
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

          <div className="relative z-10 px-12 py-10 xl:px-16 xl:py-12">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-semibold text-white/90">
              <Store className="size-4" />
              Khusus Pemilik &amp; Pengelola UMKM
            </span>

            <div className="mt-7 flex items-center gap-3.5">
              <div className="flex size-12 items-center justify-center rounded-2xl bg-white text-[#0d7a70] shadow-sm">
                <Store className="size-6" />
              </div>
              <div>
                <p className="text-[22px] font-extrabold leading-none tracking-tight text-white">
                  RatisBisnis
                </p>
                <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/60">
                  Solusi Ekosistem Dagang
                </p>
              </div>
            </div>

            <h1 className="mt-7 max-w-[460px] text-[34px] font-extrabold leading-[1.15] tracking-[-0.02em] text-white xl:text-[38px]">
              Usaha Anda, dalam satu genggaman
            </h1>

            <p className="mt-4 max-w-[430px] text-sm leading-relaxed text-white/75">
              Kelola pesanan, stok, dan keuangan toko Anda dengan mudah dan cepat. Dirancang
              khusus untuk memajukan pemilik UMKM Indonesia.
            </p>

            <ul className="mt-7 max-w-[470px] space-y-3">
              {features.map(({ icon: Icon, title, description }) => (
                <li
                  key={title}
                  className="flex gap-3.5 rounded-2xl border border-white/10 bg-white/[0.07] p-3.5"
                >
                  <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl bg-white/10 text-white">
                    <Icon className="size-[18px]" />
                  </span>
                  <div>
                    <p className="text-sm font-bold text-white">{title}</p>
                    <p className="mt-0.5 text-[12.5px] leading-relaxed text-white/65">
                      {description}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="relative z-10 flex items-center gap-4 px-12 pb-10 xl:px-16 xl:pb-12">
            <div className="flex -space-x-2.5">
              {trustedOwners.map((initials, index) => (
                <span
                  key={initials}
                  className={`flex size-8 items-center justify-center rounded-full border-2 border-[#0d7a70] text-[10px] font-bold ${
                    ['bg-[#ccfbf1] text-[#0f766e]', 'bg-[#a7f3d0] text-[#115e59]', 'bg-[#e2e8f0] text-[#334155]'][index]
                  }`}
                >
                  {initials}
                </span>
              ))}
            </div>
            <p className="max-w-[300px] text-xs leading-snug text-white/80">
              Dipercaya lebih dari <span className="font-bold text-white">45.000+</span>{' '}
              wirausaha mandiri di seluruh Indonesia.
            </p>
          </div>
        </aside>

        <section className="flex flex-1 flex-col items-center justify-center px-5 py-10 sm:px-8 lg:px-12 lg:py-8">
          <div className="w-full max-w-[540px]">
            <div className="rounded-2xl border border-line bg-white p-6 shadow-[0_24px_60px_-32px_rgba(15,23,42,0.25)] sm:p-9">
              <h1 className="text-[28px] font-extrabold leading-tight tracking-tight text-ink sm:text-[30px]">
                Masuk ke Akun Usaha
              </h1>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-500">
                Masukkan email dan kata sandi yang terdaftar di Ratis.
              </p>

              {notice && (
                <div
                  role="status"
                  className="mt-5 flex items-start gap-2.5 rounded-xl border border-sky-200 bg-sky-50 p-3.5 text-sm leading-relaxed text-sky-900"
                >
                  <Info className="mt-0.5 size-4 shrink-0 text-sky-600" />
                  <p>{notice}</p>
                </div>
              )}

              {formError && (
                <div
                  role="alert"
                  className="mt-5 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3.5 text-sm leading-relaxed text-red-900"
                >
                  <Info className="mt-0.5 size-4 shrink-0 text-red-600" />
                  <p>{formError}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-5">
                <div>
                  <label htmlFor="email" className="mb-2 block text-sm font-semibold text-ink">
                    Email Usaha / Akun Pemilik
                  </label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-4 top-1/2 size-[18px] -translate-y-1/2 text-slate-400" />
                    <input
                      id="email"
                      type="email"
                      inputMode="email"
                      autoComplete="email"
                      autoFocus
                      placeholder="contoh@tokosari.com"
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
                    <p id="email-help" className="mt-2 flex items-center gap-1.5 text-xs text-slate-500">
                      <Info className="size-3.5 shrink-0 text-slate-400" />
                      Gunakan email aktif yang terdaftar di sistem toko.
                    </p>
                  )}
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <label htmlFor="password" className="block text-sm font-semibold text-ink">
                      Kata Sandi
                    </label>
                    <button
                      type="button"
                      onClick={() =>
                        setNotice(
                          'Tautan pemulihan kata sandi akan dikirim ke email usaha Anda yang terdaftar.',
                        )
                      }
                      className="text-xs font-semibold text-primary transition hover:text-primary-hover hover:underline"
                    >
                      Lupa kata sandi?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-4 top-1/2 size-[18px] -translate-y-1/2 text-slate-400" />
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      placeholder="Minimal 8 karakter"
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
                      {showPassword ? <EyeOff className="size-[18px]" /> : <Eye className="size-[18px]" />}
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
                  Ingat saya di perangkat ini
                </label>

                <button
                  type="submit"
                  disabled={loading}
                  className="group flex h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/25 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {loading ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Memproses...
                    </>
                  ) : (
                    <>
                      Masuk ke Panel Usaha
                      <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                    </>
                  )}
                </button>
              </form>

              <div className="mt-6 rounded-xl bg-[#eef4ff] p-4">
                <div className="flex items-center gap-2">
                  <Info className="size-4 shrink-0 text-[#3457d5]" />
                  <p className="text-[13px] font-semibold text-[#1e40af]">Pemberitahuan Akun</p>
                </div>
                <p className="mt-1.5 pl-6 text-[13px] leading-relaxed text-slate-600">
                  Pemilik dengan status toko <span className="font-semibold text-slate-700">Pending</span>,{' '}
                  <span className="font-semibold text-slate-700">Ditolak</span>, atau{' '}
                  <span className="font-semibold text-slate-700">Nonaktif</span> tetap dapat masuk
                  untuk memeriksa status dan melengkapi data toko.
                </p>
              </div>
            </div>

            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={() => navigate('/owner/daftar')}
                className="group inline-flex items-center gap-1.5 text-sm text-slate-600 transition hover:text-primary"
              >
                Belum memiliki akun usaha?
                <span className="font-semibold text-primary group-hover:underline">
                  Daftarkan Toko Sekarang
                </span>
                <ChevronRight className="size-4 text-primary transition-transform group-hover:translate-x-0.5" />
              </button>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-line bg-[#f5f7fb]">
        <div className="flex flex-col gap-3 px-5 py-5 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-16">
          <p>© 2024 Ratis Indonesia. Platform Solusi Bisnis &amp; Pembukuan UMKM Digital.</p>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <button
              type="button"
              onClick={() => setNotice('Kebijakan privasi Ratis akan tersedia pada rilis berikutnya.')}
              className="transition hover:text-primary"
            >
              Kebijakan Privasi
            </button>
            <button
              type="button"
              onClick={() => setNotice('Syarat dan ketentuan Ratis akan tersedia pada rilis berikutnya.')}
              className="transition hover:text-primary"
            >
              Syarat &amp; Ketentuan
            </button>
            <button
              type="button"
              onClick={() => setNotice('Pusat bantuan UMKM akan tersedia pada rilis berikutnya.')}
              className="transition hover:text-primary"
            >
              Pusat Bantuan UMKM
            </button>
          </div>
        </div>
      </footer>
    </div>
  )
}
