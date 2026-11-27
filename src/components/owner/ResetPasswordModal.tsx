import { useState } from 'react'
import {
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Link2,
  LockKeyhole,
  Mail,
  MessageCircle,
  Monitor,
  ShieldCheck,
  Sparkles,
  X,
} from 'lucide-react'
import ModalShell from './ModalShell'

const passwordSymbols = '#!@$%&*?'

function generateStrongPassword() {
  const lower = 'abcdefghijkmnopqrstuvwxyz'
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ'
  const digits = '23456789'
  const pick = (set: string) => set[Math.floor(Math.random() * set.length)]
  const core = Array.from({ length: 9 }, () => pick(lower + upper + digits)).join('')

  return `${pick(upper)}${pick(lower)}${core}${pick(digits)}${pick(passwordSymbols)}`
}

function getPasswordStrength(password: string) {
  const hasLength = password.length >= 8
  const hasMixedCase = /[a-z]/.test(password) && /[A-Z]/.test(password)
  const hasDigit = /\d/.test(password)
  const hasSymbol = /[^A-Za-z0-9]/.test(password)
  const score = [hasLength, hasMixedCase, hasDigit, hasSymbol].filter(Boolean).length

  return {
    score,
    label:
      score <= 1 ? 'Lemah' : score === 2 ? 'Cukup' : score === 3 ? 'Kuat' : 'Sangat Kuat',
    description:
      score === 4
        ? 'Kombinasi huruf kapital, angka & simbol terdeteksi.'
        : 'Tambahkan huruf kapital, angka, dan simbol agar lebih kuat.',
  }
}

function PasswordStrengthMeter({ password }: { password: string }) {
  const strength = getPasswordStrength(password)
  const tone =
    strength.score <= 1
      ? 'bg-[#dc2626]'
      : strength.score === 2
        ? 'bg-[#d97706]'
        : 'bg-primary'

  return (
    <div className="mt-2 rounded-lg bg-[#f1f5f9] px-2.5 py-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-600">
          <ShieldCheck className="size-3.5 shrink-0 text-primary" />
          {strength.label}
        </p>
        <p className="text-[9.5px] leading-tight text-slate-500">{strength.description}</p>
      </div>
      <div className="mt-1.5 flex gap-1.5">
        {[0, 1, 2, 3].map((index) => (
          <span
            key={index}
            className={`h-1.5 flex-1 rounded-full ${
              index < strength.score ? tone : 'bg-[#e2e8f0]'
            }`}
          />
        ))}
      </div>
    </div>
  )
}

export type ResetPasswordValues = {
  mode: 'manual' | 'link'
  password?: string
  forceLogout: boolean
  sendWhatsapp: boolean
  note: string
}

export default function ResetPasswordModal({
  staffName,
  staffInitials,
  staffAvatarClassName,
  staffCode,
  role,
  email,
  whatsappNumber,
  sessionStatus,
  sessionDevice,
  onClose,
  onConfirm,
}: {
  staffName: string
  staffInitials: string
  staffAvatarClassName: string
  staffCode: string
  role: string
  email: string
  whatsappNumber: string
  sessionStatus: string
  sessionDevice: string
  onClose: () => void
  onConfirm: (values: ResetPasswordValues) => void
}) {
  const [mode, setMode] = useState<'manual' | 'link'>('manual')
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [forceLogout, setForceLogout] = useState(true)
  const [sendWhatsapp, setSendWhatsapp] = useState(true)
  const [note, setNote] = useState('')
  const [errors, setErrors] = useState<{ password?: string; confirmation?: string }>({})

  const passwordsMatch = confirmation.length > 0 && confirmation === password

  function handleSubmit() {
    if (mode === 'link') {
      onConfirm({ mode, forceLogout, sendWhatsapp, note: note.trim() })
      return
    }

    const nextErrors: { password?: string; confirmation?: string } = {}

    if (password.length < 8) {
      nextErrors.password = 'Kata sandi baru wajib diisi minimal 8 karakter.'
    }
    if (!confirmation) {
      nextErrors.confirmation = 'Konfirmasi kata sandi wajib diisi.'
    } else if (confirmation !== password) {
      nextErrors.confirmation = 'Konfirmasi kata sandi tidak cocok.'
    }

    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    onConfirm({ mode, password, forceLogout, sendWhatsapp, note: note.trim() })
  }

  return (
    <ModalShell
      labelledBy="reset-password-title"
      onClose={onClose}
      width="max-w-[560px]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#e7f4f1] text-primary">
            <KeyRound className="size-5" />
          </span>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 id="reset-password-title" className="text-[16px] font-bold text-ink">
                Reset Kata Sandi Staf
              </h2>
              <span className="rounded bg-[#eef2ff] px-1.5 py-0.5 text-[9px] font-semibold text-[#3b5bdb]">
                Keamanan
              </span>
            </div>
            <p className="mt-1 text-[11px] leading-relaxed text-slate-500">
              Perbarui kredensial masuk akun staf operasional atau buat tautan akses baru.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Tutup modal reset kata sandi"
          className="flex size-8 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
        >
          <X className="size-4" />
        </button>
      </div>

      <div className="mt-4 flex items-center gap-3 rounded-xl bg-[#f1f5f9] px-3.5 py-3">
        <span
          className={`flex size-10 shrink-0 items-center justify-center rounded-lg text-[12px] font-extrabold ${staffAvatarClassName}`}
        >
          {staffInitials}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <p className="truncate text-[12px] font-bold text-ink">{staffName}</p>
            <span className="rounded bg-[#e2e8f0] px-1.5 py-0.5 text-[8.5px] font-bold tracking-wide text-slate-500">
              {staffCode}
            </span>
          </div>
          <p className="mt-0.5 truncate text-[10px] font-medium text-slate-500">{role}</p>
          <p className="mt-0.5 truncate text-[10px] text-slate-400">{email}</p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[9px] font-semibold ${
              sessionStatus === 'Online'
                ? 'bg-[#dcfce7] text-[#15803d]'
                : 'bg-[#e2e8f0] text-slate-500'
            }`}
          >
            <span
              className={`size-1.5 rounded-full ${
                sessionStatus === 'Online' ? 'bg-emerald-500' : 'bg-slate-400'
              }`}
            />
            {sessionStatus === 'Online' ? 'Sesi Aktif' : 'Tidak Ada Sesi'}
          </span>
          <span className="inline-flex items-center gap-1 text-[9.5px] text-slate-500">
            <Monitor className="size-3 shrink-0" />
            {sessionDevice}
          </span>
        </div>
      </div>

      <p className="mt-4 text-[9px] font-bold uppercase tracking-[0.1em] text-slate-500">
        Metode Reset Kata Sandi
      </p>
      <div className="mt-2 grid gap-2.5 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => setMode('manual')}
          aria-pressed={mode === 'manual'}
          className={`relative rounded-xl border p-3 text-left transition ${
            mode === 'manual'
              ? 'border-primary bg-[#e7f4f1]'
              : 'border-line bg-white hover:bg-slate-50'
          }`}
        >
          <span
            className={`flex size-7 items-center justify-center rounded-full ${
              mode === 'manual' ? 'bg-primary text-white' : 'bg-[#eef2ff] text-[#3b5bdb]'
            }`}
          >
            <KeyRound className="size-3.5" />
          </span>
          <span
            className={`absolute right-3 top-3 flex size-4 items-center justify-center rounded-full border-2 ${
              mode === 'manual' ? 'border-primary' : 'border-slate-300'
            }`}
          >
            {mode === 'manual' ? (
              <span className="size-2 rounded-full bg-primary" />
            ) : null}
          </span>
          <p className="mt-2 text-[11.5px] font-bold text-ink">Buat Sandi Baru Manual</p>
          <p className="mt-0.5 text-[10px] leading-relaxed text-slate-500">
            Tentukan atau acak langsung kata sandi baru untuk staf.
          </p>
        </button>

        <button
          type="button"
          onClick={() => setMode('link')}
          aria-pressed={mode === 'link'}
          className={`relative rounded-xl border p-3 text-left transition ${
            mode === 'link'
              ? 'border-primary bg-[#e7f4f1]'
              : 'border-line bg-white hover:bg-slate-50'
          }`}
        >
          <span
            className={`flex size-7 items-center justify-center rounded-full ${
              mode === 'link' ? 'bg-primary text-white' : 'bg-[#eef2ff] text-[#3b5bdb]'
            }`}
          >
            <Link2 className="size-3.5" />
          </span>
          <span
            className={`absolute right-3 top-3 flex size-4 items-center justify-center rounded-full border-2 ${
              mode === 'link' ? 'border-primary' : 'border-slate-300'
            }`}
          >
            {mode === 'link' ? <span className="size-2 rounded-full bg-primary" /> : null}
          </span>
          <p className="mt-2 text-[11.5px] font-bold text-ink">Kirim Tautan Mandiri</p>
          <p className="mt-0.5 text-[10px] leading-relaxed text-slate-500">
            Kirim link reset instan via WhatsApp atau email staf.
          </p>
        </button>
      </div>

      {mode === 'manual' ? (
        <div className="mt-4 space-y-3">
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label
                htmlFor="reset-password-new"
                className="text-[10.5px] font-medium text-ink"
              >
                Kata Sandi Baru <span className="text-red-500">*</span>
              </label>
              <button
                type="button"
                onClick={() => {
                  const next = generateStrongPassword()
                  setPassword(next)
                  setConfirmation(next)
                  setShowPassword(true)
                  setErrors({})
                }}
                className="inline-flex items-center gap-1 text-[9.5px] font-semibold text-primary transition hover:text-primary-hover"
              >
                <Sparkles className="size-3" />
                Acak Sandi Kuat
              </button>
            </div>
            <div className="relative mt-1.5">
              <KeyRound className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-slate-400" />
              <input
                id="reset-password-new"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value)
                  setErrors((current) => ({ ...current, password: undefined }))
                }}
                aria-invalid={Boolean(errors.password)}
                className={`h-10 w-full rounded-xl border bg-[#f7f9fc] pl-9 pr-10 text-[12px] text-ink outline-none transition placeholder:text-slate-400 focus:bg-white focus:ring-4 ${
                  errors.password
                    ? 'border-red-400 focus:border-red-400 focus:ring-red-100'
                    : 'border-transparent focus:border-primary focus:ring-primary/10'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword((current) => !current)}
                aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                className="absolute right-2.5 top-1/2 flex size-6 -translate-y-1/2 items-center justify-center rounded text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
              >
                {showPassword ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
              </button>
            </div>
            {errors.password ? (
              <p className="mt-1 text-[10px] font-medium text-red-500">{errors.password}</p>
            ) : password ? (
              <PasswordStrengthMeter password={password} />
            ) : null}
          </div>

          <div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label
                htmlFor="reset-password-confirm"
                className="text-[10.5px] font-medium text-ink"
              >
                Konfirmasi Kata Sandi Baru <span className="text-red-500">*</span>
              </label>
              {passwordsMatch ? (
                <span className="inline-flex items-center gap-1 text-[9.5px] font-semibold text-primary">
                  <CheckCircle2 className="size-3" />
                  Kata sandi cocok
                </span>
              ) : null}
            </div>
            <div className="relative mt-1.5">
              <ShieldCheck className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-slate-400" />
              <input
                id="reset-password-confirm"
                type={showConfirmation ? 'text' : 'password'}
                autoComplete="new-password"
                value={confirmation}
                onChange={(event) => {
                  setConfirmation(event.target.value)
                  setErrors((current) => ({ ...current, confirmation: undefined }))
                }}
                aria-invalid={Boolean(errors.confirmation)}
                className={`h-10 w-full rounded-xl border bg-[#f7f9fc] pl-9 pr-10 text-[12px] text-ink outline-none transition placeholder:text-slate-400 focus:bg-white focus:ring-4 ${
                  errors.confirmation
                    ? 'border-red-400 focus:border-red-400 focus:ring-red-100'
                    : 'border-transparent focus:border-primary focus:ring-primary/10'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowConfirmation((current) => !current)}
                aria-label={
                  showConfirmation ? 'Sembunyikan konfirmasi sandi' : 'Tampilkan konfirmasi sandi'
                }
                className="absolute right-2.5 top-1/2 flex size-6 -translate-y-1/2 items-center justify-center rounded text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
              >
                {showConfirmation ? (
                  <EyeOff className="size-3.5" />
                ) : (
                  <Eye className="size-3.5" />
                )}
              </button>
            </div>
            {errors.confirmation ? (
              <p className="mt-1 text-[10px] font-medium text-red-500">
                {errors.confirmation}
              </p>
            ) : null}
          </div>
        </div>
      ) : (
        <div className="mt-4 rounded-xl border border-[#dbe3f4] bg-[#eef2ff]/70 px-3.5 py-3">
          <p className="flex items-center gap-1.5 text-[11px] font-semibold text-[#3b5bdb]">
            <Link2 className="size-3.5 shrink-0" />
            Tautan reset instan akan dikirim ke staf
          </p>
          <p className="mt-1.5 text-[10.5px] leading-relaxed text-slate-600">
            Tautan berlaku 30 menit dan hanya dapat dipakai satu kali. Staf wajib membuat
            kata sandi baru sendiri saat membuka tautan.
          </p>
          <ul className="mt-2 space-y-1 text-[10.5px] text-slate-500">
            <li className="flex items-center gap-1.5">
              <Mail className="size-3 shrink-0" /> {email}
            </li>
            <li className="flex items-center gap-1.5">
              <MessageCircle className="size-3 shrink-0" /> {whatsappNumber}
            </li>
          </ul>
        </div>
      )}

      <div className="mt-4 space-y-2">
        <label className="flex cursor-pointer items-start gap-2.5 rounded-xl border border-line px-3 py-2.5 transition hover:bg-slate-50">
          <input
            type="checkbox"
            checked={forceLogout}
            onChange={(event) => setForceLogout(event.target.checked)}
            className="mt-0.5 size-3.5 shrink-0 accent-[#0f766e]"
          />
          <span>
            <span className="block text-[11px] font-semibold text-ink">
              Keluarkan akun dari semua sesi &amp; perangkat aktif (Force Logout)
            </span>
            <span className="mt-0.5 block text-[10px] leading-relaxed text-slate-500">
              Staf diwajibkan login ulang menggunakan kredensial baru ini pada aplikasi POS
              atau tablet kasir.
            </span>
          </span>
        </label>

        <label className="flex cursor-pointer items-start gap-2.5 rounded-xl border border-line px-3 py-2.5 transition hover:bg-slate-50">
          <input
            type="checkbox"
            checked={sendWhatsapp}
            onChange={(event) => setSendWhatsapp(event.target.checked)}
            className="mt-0.5 size-3.5 shrink-0 accent-[#0f766e]"
          />
          <span>
            <span className="block text-[11px] font-semibold text-ink">
              {mode === 'manual'
                ? `Kirim rincian kata sandi ke WhatsApp staf (${whatsappNumber})`
                : `Kirim tautan reset ke WhatsApp staf (${whatsappNumber})`}
            </span>
            <span className="mt-0.5 block text-[10px] leading-relaxed text-slate-500">
              {mode === 'manual'
                ? 'Kirim ringkasan info login otomatis agar kasir dapat segera melanjutkan layanan pesanan.'
                : 'Selain WhatsApp, tautan juga selalu dikirim ke email login staf.'}
            </span>
          </span>
        </label>
      </div>

      <div className="mt-3 rounded-xl bg-[#f8fafc] px-3 py-2.5">
        <label
          htmlFor="reset-password-note"
          className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-600"
        >
          <MessageCircle className="size-3 shrink-0" />
          Catatan Audit Keamanan Toko
        </label>
        <textarea
          id="reset-password-note"
          rows={2}
          maxLength={200}
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder="Opsional — mis. sandi lama diduga bocor, staf kehilangan perangkat, atau permintaan reset dari pemilik."
          className="mt-1.5 w-full resize-none rounded-lg border border-line bg-white px-2.5 py-2 text-[10.5px] leading-relaxed text-ink outline-none transition placeholder:text-slate-400 focus:border-primary focus:ring-4 focus:ring-primary/10"
        />
      </div>

      <div className="-mx-5 -mb-5 mt-4 flex flex-col-reverse gap-2 border-t border-line bg-white px-5 py-3.5 sm:-mx-6 sm:-mb-6 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={onClose}
          className="h-10 rounded-xl border border-line px-5 text-[11.5px] font-semibold text-slate-600 transition hover:bg-slate-50"
        >
          Batal
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-[11.5px] font-semibold text-white transition hover:bg-primary-hover"
        >
          <LockKeyhole className="size-3.5" />
          {mode === 'manual' ? 'Simpan & Terapkan Sandi Baru' : 'Kirim Tautan Reset'}
        </button>
      </div>
    </ModalShell>
  )
}
