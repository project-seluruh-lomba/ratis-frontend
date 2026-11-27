import { useRef, useState, type ChangeEvent, type FormEvent, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowUpRight,
  BadgeCheck,
  Building2,
  Cake,
  CalendarDays,
  Check,
  ChevronDown,
  Clock3,
  Copy,
  ExternalLink,
  Eye,
  FileText,
  Globe,
  Image as ImageIcon,
  Info,
  Lock,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Save,
  ShieldCheck,
  Store,
  Trash2,
  Truck,
  Upload,
  X,
  type LucideIcon,
} from 'lucide-react'
import StoreProfileCoverArt from '../../components/owner/StoreProfileCoverArt'
import {
  getOwnerSession,
  updateOwnerStoreName,
  type OwnerStoreStatus,
} from '../../lib/owner-auth'
import { ownerStatusMeta } from '../../lib/owner-dashboard-data'
import {
  getOwnerStoreProfile,
  getOwnerStoreSchedule,
  getStoreSlug,
  saveOwnerStoreProfile,
  type StoreScheduleEntry,
} from '../../lib/owner-store-profile-data'

type ToastTone = 'success' | 'info' | 'danger'

type Toast = {
  message: string
  tone: ToastTone
}

type FormErrors = {
  name?: string
  tagline?: string
  description?: string
  whatsapp?: string
  email?: string
  address?: string
  coordinates?: string
  nib?: string
  pirtValue?: string
  halalValue?: string
}

const storeCategoryOptions = [
  'Kuliner (Kue, Roti, & Pastry Nusantara)',
  'Kuliner (Makanan Berat & Katering)',
  'Kuliner (Jajanan Pasar & Camilan)',
  'Minuman & Kopi',
  'Hantaran & Hampers',
  'Fashion & Kriya',
  'Kebutuhan Harian',
]

const maxPhotoSize = 2 * 1024 * 1024
const acceptedPhotoTypes = ['image/jpeg', 'image/png', 'image/webp']

function getInitials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join('')
}

function onlyDigits(value: string) {
  return value.replace(/\D/g, '')
}

function toLocalWhatsapp(value: string) {
  return onlyDigits(value).replace(/^62/, '').replace(/^0/, '')
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

function formatKilobytes(bytes: number) {
  return `${Math.max(1, Math.round(bytes / 1024))} KB`
}

const inputBase =
  'h-10 w-full rounded-xl border bg-[#f7f9fc] px-3 text-[11.5px] text-ink outline-none transition placeholder:text-slate-400 focus:bg-white focus:ring-4 focus:ring-primary/10'

function fieldClass(hasError?: boolean) {
  return `${inputBase} ${
    hasError ? 'border-red-300 focus:border-red-400' : 'border-line focus:border-primary'
  }`
}

function FieldLabel({
  htmlFor,
  children,
  counter,
  required,
}: {
  htmlFor?: string
  children: ReactNode
  counter?: string
  required?: boolean
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <label htmlFor={htmlFor} className="text-[11px] font-semibold text-ink">
        {children}
        {required && <span className="ml-0.5 text-[#dc2626]">*</span>}
      </label>
      {counter && (
        <span className="text-[8.5px] font-medium tabular-nums text-slate-400">{counter}</span>
      )}
    </div>
  )
}

function FieldError({ children }: { children?: string }) {
  if (!children) return null
  return <p className="mt-1 text-[9px] font-medium text-red-600">{children}</p>
}

function SectionCard({
  icon: Icon,
  title,
  subtitle,
  badge,
  children,
}: {
  icon: LucideIcon
  title: string
  subtitle: string
  badge?: ReactNode
  children: ReactNode
}) {
  return (
    <section className="rounded-2xl border border-line bg-white shadow-[0_1px_2px_rgba(15,23,42,0.06)]">
      <div className="flex flex-col gap-2 border-b border-[#eef2f6] px-4 py-4 sm:flex-row sm:items-start sm:justify-between sm:px-5">
        <div className="flex items-start gap-2.5">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#eef7f4] text-primary">
            <Icon className="size-4" />
          </span>
          <div>
            <h2 className="text-[13px] font-bold text-ink">{title}</h2>
            <p className="mt-0.5 text-[10px] leading-relaxed text-slate-500">{subtitle}</p>
          </div>
        </div>
        {badge ? <div className="shrink-0">{badge}</div> : null}
      </div>
      <div className="px-4 py-4 sm:px-5">{children}</div>
    </section>
  )
}

function CoordinatesMap({
  coordinates,
  onAdjust,
}: {
  coordinates: string
  onAdjust: () => void
}) {
  return (
    <div className="mt-2.5 overflow-hidden rounded-xl border border-line">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-3 py-2">
        <p className="flex items-center gap-1 text-[8.5px] font-bold uppercase tracking-[0.06em] text-slate-400">
          <MapPin className="size-3 text-primary" />
          Titik Koordinat GPS &amp; Pemetaan
        </p>
        <button
          type="button"
          onClick={onAdjust}
          className="inline-flex items-center gap-1 rounded-lg border border-line bg-white px-2 py-1 text-[8.5px] font-semibold text-slate-600 transition hover:text-primary"
        >
          <MapPin className="size-2.5" />
          Sesuaikan Titik Koordinat GPS
        </button>
      </div>

      <div className="relative h-[136px] bg-[#eaf2e6]">
        <svg
          viewBox="0 0 620 160"
          preserveAspectRatio="xMidYMid slice"
          className="absolute inset-0 h-full w-full"
          aria-hidden
        >
          <rect width="620" height="160" fill="#eef3ea" />
          <rect x="24" y="18" width="120" height="46" rx="7" fill="#dcebd3" />
          <rect x="470" y="14" width="132" height="56" rx="7" fill="#d8e8d2" />
          <rect x="170" y="100" width="120" height="52" rx="7" fill="#e5ead8" />
          <rect x="356" y="94" width="96" height="60" rx="7" fill="#dcebd3" />
          <path
            d="M0 114 C100 100 180 134 280 118 S470 94 620 106 L620 160 L0 160 Z"
            fill="#cfe4ef"
            opacity="0.7"
          />
          <path d="M-10 70 H630" stroke="#ffffff" strokeWidth="11" />
          <path d="M140 -10 V170" stroke="#ffffff" strokeWidth="11" />
          <path d="M420 -10 V170" stroke="#ffffff" strokeWidth="9" />
          <path d="M-10 16 H630" stroke="#f8faf7" strokeWidth="5" />
          <path d="M300 -10 L380 170" stroke="#f8faf7" strokeWidth="6" />
          <text x="44" y="44" fontSize="8" fontWeight="600" fill="#7f9475">
            Kramat Pela
          </text>
          <text x="478" y="42" fontSize="8" fontWeight="600" fill="#7f9475">
            Kebayoran
          </text>
          <text x="182" y="128" fontSize="8" fontWeight="600" fill="#7f9475">
            Gandaria
          </text>
        </svg>

        <span className="absolute left-1/2 top-1/2 flex size-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-[3px] border-white bg-primary text-white shadow-lg">
          <MapPin className="size-3.5" />
        </span>

        <span className="absolute inset-x-2 bottom-2 flex items-center gap-1.5 rounded-lg bg-white/95 px-2.5 py-1.5 text-[8.5px] font-medium text-slate-600 shadow-sm backdrop-blur">
          <MapPin className="size-3 shrink-0 text-slate-400" />
          {coordinates}
        </span>
      </div>
    </div>
  )
}

const statusBannerCopy: Record<OwnerStoreStatus, string> = {
  aktif:
    'Perubahan data operasional (nama, alamat, deskripsi, foto, kontak, jam buka) akan langsung tayang tanpa verifikasi ulang. Slug toko tetap permanen demi menjaga reputasi SEO & bookmark pelanggan setia Anda.',
  ditolak:
    'Perbaiki data yang diminta admin, lalu ajukan ulang verifikasi. Pengajuan sebelumnya tetap tercatat pada riwayat verifikasi toko.',
  pending:
    'Profil dapat diubah setelah admin meninjau atau menolak toko. Tim Ratis sedang memeriksa kelengkapan data usaha Anda.',
  nonaktif:
    'Profil hanya dapat dibaca. Hubungi admin Ratis untuk mengaktifkan kembali toko sebelum melakukan perubahan data.',
}

export default function OwnerStoreEditPage() {
  const navigate = useNavigate()
  const [session] = useState(getOwnerSession)
  const [profile] = useState(() => getOwnerStoreProfile(session?.storeName))

  const bannerInputRef = useRef<HTMLInputElement>(null)
  const logoInputRef = useRef<HTMLInputElement>(null)

  const [name, setName] = useState(profile.name)
  const [category, setCategory] = useState(profile.category)
  const [tagline, setTagline] = useState(profile.tagline.slice(0, 120))
  const [description, setDescription] = useState(profile.description.slice(0, 500))
  const [whatsapp, setWhatsapp] = useState(toLocalWhatsapp(profile.whatsapp))
  const [email, setEmail] = useState(profile.email)
  const [address, setAddress] = useState(profile.address)
  const [addressNote, setAddressNote] = useState(profile.addressNote)
  const [coordinates, setCoordinates] = useState(profile.coordinates)
  const [nib, setNib] = useState(profile.nib)
  const [pirtValue, setPirtValue] = useState(profile.pirt.value)
  const [halalValue, setHalalValue] = useState(profile.halal.value)
  const [schedule, setSchedule] = useState<StoreScheduleEntry[]>(getOwnerStoreSchedule)
  const [openEveryDay, setOpenEveryDay] = useState(() =>
    schedule.every((entry) => entry.open),
  )
  const [internalNote, setInternalNote] = useState('')
  const [bannerPhoto, setBannerPhoto] = useState<string | null>(null)
  const [bannerSize, setBannerSize] = useState('JPG · 640 KB')
  const [logoPhoto, setLogoPhoto] = useState<string | null>(null)
  const [errors, setErrors] = useState<FormErrors>({})
  const [toast, setToast] = useState<Toast | null>(null)
  const [saving, setSaving] = useState(false)

  const storeStatus: OwnerStoreStatus = session?.storeStatus ?? 'aktif'
  const statusMeta = ownerStatusMeta[storeStatus]
  const slug = getStoreSlug(profile.name)
  const editorName = session?.name ?? 'Pemilik Usaha'

  function showToast(message: string, tone: ToastTone = 'success') {
    setToast({ message, tone })
    window.setTimeout(() => setToast(null), 4200)
  }

  function updateSchedule(id: StoreScheduleEntry['id'], patch: Partial<StoreScheduleEntry>) {
    setSchedule((current) =>
      current.map((entry) => (entry.id === id ? { ...entry, ...patch } : entry)),
    )
  }

  function handlePhoto(
    event: ChangeEvent<HTMLInputElement>,
    apply: (dataUrl: string, sizeLabel: string) => void,
  ) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    if (!acceptedPhotoTypes.includes(file.type)) {
      showToast('Format foto harus JPG, PNG, atau WebP.', 'danger')
      return
    }

    if (file.size > maxPhotoSize) {
      showToast('Ukuran foto melebihi 2 MB. Kompres foto terlebih dahulu.', 'danger')
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result !== 'string') return
      apply(reader.result, formatKilobytes(file.size))
      showToast('Foto siap dipakai. Tekan Simpan Perubahan untuk menerapkan.', 'info')
    }
    reader.onerror = () => showToast('Foto gagal dibaca. Coba unggah ulang.', 'danger')
    reader.readAsDataURL(file)
  }

  function activateEveryDay() {
    setOpenEveryDay(true)
    setSchedule((current) => current.map((entry) => ({ ...entry, open: true })))
  }

  function copySlug() {
    navigator.clipboard
      .writeText(`ratis.id/toko/${slug}`)
      .then(() => showToast('Tautan storefront toko disalin ke papan klip.'))
      .catch(() =>
        showToast('Gagal menyalin otomatis. Salin tautan dari alamat halaman.', 'info'),
      )
  }

  function validate() {
    const next: FormErrors = {}
    const trimmedName = name.trim()
    const localWhatsapp = toLocalWhatsapp(whatsapp)
    const nibDigits = onlyDigits(nib)

    if (trimmedName.length < 3) {
      next.name = 'Nama toko minimal 3 karakter.'
    } else if (trimmedName.length > 30) {
      next.name = 'Nama toko maksimal 30 karakter.'
    }

    if (tagline.trim().length < 10) {
      next.tagline = 'Slogan minimal 10 karakter agar mudah dikenali pembeli.'
    } else if (tagline.trim().length > 120) {
      next.tagline = 'Slogan maksimal 120 karakter.'
    }

    if (description.trim().length < 30) {
      next.description = 'Deskripsi minimal 30 karakter.'
    } else if (description.trim().length > 500) {
      next.description = 'Deskripsi maksimal 500 karakter.'
    }

    if (localWhatsapp.length < 9 || localWhatsapp.length > 15) {
      next.whatsapp = 'Nomor WhatsApp harus 9-15 digit.'
    }

    if (!isValidEmail(email.trim())) {
      next.email = 'Format email belum benar, contoh: toko@email.com.'
    }

    if (address.trim().length < 20) {
      next.address = 'Alamat lengkap minimal 20 karakter.'
    }

    if (!/^-?\d+(\.\d+)?,\s*-?\d+(\.\d+)?$/.test(coordinates.trim())) {
      next.coordinates = 'Format koordinat: -6.246312, 106.793215'
    }

    if (nibDigits.length > 0 && nibDigits.length !== 13) {
      next.nib = 'NIB harus 13 digit angka.'
    }

    if (pirtValue.trim().length > 0 && pirtValue.trim().length < 6) {
      next.pirtValue = 'Nomor P-IRT minimal 6 karakter.'
    }

    if (halalValue.trim().length > 0 && halalValue.trim().length < 6) {
      next.halalValue = 'Nomor sertifikat halal minimal 6 karakter.'
    }

    return next
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const nextErrors = validate()
    setErrors(nextErrors)

    if (Object.keys(nextErrors).length > 0) {
      showToast('Periksa kembali isian yang ditandai merah sebelum menyimpan.', 'danger')
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }

    setSaving(true)
    await new Promise((resolve) => setTimeout(resolve, 700))

    const localWhatsapp = toLocalWhatsapp(whatsapp)

    saveOwnerStoreProfile({
      name: name.trim(),
      category,
      tagline: tagline.trim(),
      description: description.trim(),
      whatsapp: `+62 ${localWhatsapp}`,
      email: email.trim(),
      address: address.trim(),
      addressNote: addressNote.trim(),
      coordinates: coordinates.trim(),
      nib: onlyDigits(nib),
      pirtValue: pirtValue.trim(),
      halalValue: halalValue.trim(),
      internalNote: internalNote.trim(),
      schedule,
    })
    updateOwnerStoreName(name.trim())

    navigate('/owner/toko', {
      state: {
        toast: `Profil ${name.trim()} berhasil diperbarui dan langsung tayang di storefront.`,
      },
    })
  }

  if (storeStatus === 'pending' || storeStatus === 'nonaktif') {
    return (
      <div className="rounded-2xl border border-line bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.06)]">
        <Link
          to="/owner/toko"
          className="inline-flex items-center gap-1.5 text-[10.5px] font-semibold text-slate-500 transition hover:text-primary"
        >
          <ArrowLeft className="size-3.5" />
          Kembali ke Profil Toko
        </Link>

        <span className="mt-4 flex size-11 items-center justify-center rounded-2xl bg-[#eef7f4] text-primary">
          <Lock className="size-5" />
        </span>
        <h1 className="mt-3 text-[20px] font-extrabold tracking-tight text-ink">
          Ubah Profil Toko
        </h1>
        <p className="mt-1 max-w-[560px] text-[11px] leading-relaxed text-slate-500">
          {statusBannerCopy[storeStatus]}
        </p>

        <Link
          to="/owner/toko"
          className="mt-4 inline-flex h-9 items-center justify-center rounded-xl bg-primary px-3.5 text-[10.5px] font-semibold text-white transition hover:bg-primary-hover"
        >
          Lihat Profil Toko
        </Link>
      </div>
    )
  }

  return (
    <div>
      {toast && (
        <div className="fixed right-4 top-20 z-[80] flex max-w-[calc(100vw-2rem)] items-start gap-2.5 rounded-xl border border-line bg-white px-3.5 py-3 shadow-[0_12px_40px_rgba(15,23,42,0.16)]">
          <ShieldCheck
            className={`mt-0.5 size-4 shrink-0 ${
              toast.tone === 'danger'
                ? 'text-red-500'
                : toast.tone === 'info'
                  ? 'text-[#3b5bdb]'
                  : 'text-primary'
            }`}
          />
          <p className="text-[11px] font-medium leading-relaxed text-slate-700">
            {toast.message}
          </p>
          <button
            type="button"
            onClick={() => setToast(null)}
            aria-label="Tutup notifikasi"
            className="ml-1 flex size-5 shrink-0 items-center justify-center rounded text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="size-3.5" />
          </button>
        </div>
      )}

      <form id="store-profile-form" onSubmit={handleSubmit} noValidate>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-start gap-3">
            <Link
              to="/owner/toko"
              aria-label="Kembali ke profil toko"
              className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-xl border border-line bg-white text-slate-500 transition hover:text-primary"
            >
              <ArrowLeft className="size-4" />
            </Link>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-[20px] font-extrabold tracking-tight text-ink">
                  Ubah Profil Toko
                </h1>
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold ${statusMeta.badgeClassName}`}
                >
                  <span className={`size-1.5 rounded-full ${statusMeta.dotClassName}`} />
                  {statusMeta.label}
                </span>
              </div>
              <p className="mt-1 text-[10.5px] leading-relaxed text-slate-500">
                Kelola identitas publik, narasi merek, jam operasional, dan lokasi dapur
                produksi.
              </p>
            </div>
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <Link
              to="/owner/toko"
              className="inline-flex h-9 items-center justify-center rounded-xl border border-line bg-white px-3.5 text-[10.5px] font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
            >
              Batal
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl bg-primary px-3.5 text-[10.5px] font-semibold text-white shadow-sm transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              <Save className="size-3.5" />
              {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
            </button>
          </div>
        </div>

        <div
          className={`mt-4 flex flex-col gap-3 rounded-2xl border px-4 py-3.5 sm:flex-row sm:items-start sm:justify-between ${
            storeStatus === 'aktif'
              ? 'border-[#c9ece3] bg-[#e8f8f3]'
              : 'border-red-200 bg-red-50'
          }`}
        >
          <div className="flex items-start gap-3">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-white text-primary shadow-sm">
              {storeStatus === 'aktif' ? (
                <ShieldCheck className="size-4" />
              ) : (
                <Info className="size-4 text-red-500" />
              )}
            </span>
            <div>
              <p className="text-[11.5px] font-bold text-ink">
                Toko Anda Berstatus {statusMeta.label}.
              </p>
              <p className="mt-0.5 max-w-[720px] text-[9.5px] leading-relaxed text-slate-600">
                {statusBannerCopy[storeStatus]}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() =>
              showToast(
                'Kebijakan perubahan profil: data operasional tayang langsung, slug dan legalitas ditinjau admin.',
                'info',
              )
            }
            className="inline-flex shrink-0 items-center gap-1 text-[9px] font-semibold text-primary transition hover:text-primary-hover"
          >
            Pelajari Kebijakan
            <ArrowUpRight className="size-3" />
          </button>
        </div>

        <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1fr)_352px]">
          <div className="min-w-0 space-y-4">
            <SectionCard
              icon={ImageIcon}
              title="Foto Sampul & Avatar Toko"
              subtitle="Tampilan visual yang pertama kali dilihat pembeli di storefront"
              badge={
                <span className="inline-flex items-center gap-1 rounded-md bg-[#f1f5f9] px-2 py-1 text-[8.5px] font-semibold text-slate-500">
                  <ImageIcon className="size-2.5" />
                  Rasio 16:9 &amp; 1:1
                </span>
              }
            >
              <FieldLabel>Banner Sampul Storefront</FieldLabel>
              <div className="relative mt-1.5 h-[180px] overflow-hidden rounded-xl border border-line sm:h-[196px]">
                {bannerPhoto ? (
                  <img
                    src={bannerPhoto}
                    alt="Pratinjau banner toko"
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                ) : (
                  <StoreProfileCoverArt />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-[#1b0f09]/60 via-transparent to-black/10" />

                <div className="absolute right-2 top-2 flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => bannerInputRef.current?.click()}
                    className="inline-flex items-center gap-1 rounded-lg border border-white/25 bg-black/30 px-2 py-1 text-[9px] font-semibold text-white backdrop-blur-sm transition hover:bg-black/45"
                  >
                    <Upload className="size-3" />
                    Ganti Sampul
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setBannerPhoto(null)
                      setBannerSize('JPG · 640 KB')
                    }}
                    aria-label="Hapus banner sampul"
                    title="Hapus banner sampul"
                    className="flex size-6 items-center justify-center rounded-lg border border-white/25 bg-black/30 text-white backdrop-blur-sm transition hover:bg-black/45"
                  >
                    <Trash2 className="size-3" />
                  </button>
                </div>

                <div className="absolute inset-x-2.5 bottom-2 flex flex-wrap items-center gap-1.5">
                  <span className="rounded bg-black/40 px-2 py-1 text-[8px] font-bold text-white backdrop-blur-sm">
                    {bannerPhoto ? 'BANNER BARU' : 'BANNER AKTIF'}
                  </span>
                  <span className="rounded bg-black/40 px-2 py-1 text-[8px] font-semibold text-white backdrop-blur-sm">
                    1200×480 piksel · {bannerSize}
                  </span>
                </div>
              </div>
              <input
                ref={bannerInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(event) =>
                  handlePhoto(event, (dataUrl, sizeLabel) => {
                    setBannerPhoto(dataUrl)
                    setBannerSize(sizeLabel)
                  })
                }
              />
              <p className="mt-1.5 text-[8.5px] leading-relaxed text-slate-400">
                Format JPG, WebP, PNG maksimal 2MB. Rasio ideal 1200×400 piksel untuk tampilan
                desktop terkini.
              </p>

              <div className="mt-3 flex flex-col gap-2.5 border-t border-line pt-3 sm:flex-row sm:items-center">
                <span className="relative flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-line bg-[#fdf7ed] text-[#9a5b16]">
                  {logoPhoto ? (
                    <img
                      src={logoPhoto}
                      alt="Logo toko"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <>
                      <Cake className="size-5" />
                      <span className="mt-0.5 text-[6.5px] font-extrabold uppercase tracking-wide">
                        {getInitials(name)}
                      </span>
                    </>
                  )}
                </span>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-[11px] font-semibold text-ink">Logo / Profil Toko</p>
                    <span className="rounded bg-[#f1f5f9] px-1.5 py-0.5 text-[8px] font-semibold text-slate-500">
                      Rasio 1:1
                    </span>
                  </div>
                  <p className="mt-0.5 text-[8.5px] leading-relaxed text-slate-500">
                    Avatar akan muncul di ringkasan avatar pencarian, struktur digital WhatsApp,
                    dan kartu produk.
                  </p>
                </div>

                <div className="flex shrink-0 flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => logoInputRef.current?.click()}
                    className="inline-flex h-8 items-center gap-1 rounded-lg border border-line bg-white px-2 text-[9px] font-semibold text-slate-600 transition hover:text-primary"
                  >
                    <Upload className="size-3" />
                    Unggah Logo Baru
                  </button>
                  <button
                    type="button"
                    onClick={() => setLogoPhoto(null)}
                    className="inline-flex h-8 items-center rounded-lg px-2 text-[9px] font-semibold text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                  >
                    Hapus
                  </button>
                </div>
              </div>
              <input
                ref={logoInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(event) =>
                  handlePhoto(event, (dataUrl) => setLogoPhoto(dataUrl))
                }
              />
            </SectionCard>

            <SectionCard
              icon={Building2}
              title="Identitas & Informasi Usaha"
              subtitle="Nama, kategori, dan narasi yang dibaca calon pembeli"
              badge={
                <span className="inline-flex items-center gap-1 rounded-md bg-[#eef7f4] px-2 py-1 text-[8.5px] font-semibold text-primary">
                  <Globe className="size-2.5" />
                  Publik
                </span>
              }
            >
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <FieldLabel htmlFor="store-name" counter={`${name.length}/30`} required>
                    Nama Merek / Toko
                  </FieldLabel>
                  <input
                    id="store-name"
                    value={name}
                    onChange={(event) => setName(event.target.value.slice(0, 30))}
                    placeholder="Contoh: Warung Madura"
                    className={`mt-1.5 ${fieldClass(Boolean(errors.name))}`}
                  />
                  <FieldError>{errors.name}</FieldError>
                  <p className="mt-1 text-[8.5px] leading-relaxed text-slate-400">
                    Nama resmi yang tampil di etalase pembeli dan struktur digital WhatsApp.
                  </p>
                </div>

                <div>
                  <FieldLabel htmlFor="store-category" required>
                    Kategori Usaha
                  </FieldLabel>
                  <div className="relative mt-1.5">
                    <select
                      id="store-category"
                      value={category}
                      onChange={(event) => setCategory(event.target.value)}
                      className={`${fieldClass()} appearance-none pr-8`}
                    >
                      {!storeCategoryOptions.includes(category) && (
                        <option value={category}>{category}</option>
                      )}
                      {storeCategoryOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-3.5 -translate-y-1/2 text-slate-400" />
                  </div>
                  <p className="mt-1 text-[8.5px] leading-relaxed text-slate-400">
                    Membantu pembeli menemukan toko Anda lewat pencarian kategori.
                  </p>
                </div>
              </div>

              <div className="mt-3">
                <FieldLabel>Tautan URL Toko (Slug)</FieldLabel>
                <div className="mt-1.5 flex items-center gap-2 rounded-xl border border-line bg-[#f7f9fc] px-3 py-2">
                  <span className="min-w-0 flex-1 truncate text-[11px] font-medium text-slate-500">
                    <span className="text-slate-400">https://</span>ratis.id/toko/{slug}
                  </span>
                  <span className="inline-flex shrink-0 items-center gap-1 rounded bg-white px-1.5 py-0.5 text-[8px] font-semibold text-slate-400">
                    <Lock className="size-2.5" />
                    Terkunci Permanen
                  </span>
                  <button
                    type="button"
                    onClick={copySlug}
                    aria-label="Salin tautan toko"
                    title="Salin tautan toko"
                    className="flex size-6 shrink-0 items-center justify-center rounded-md text-slate-400 transition hover:bg-white hover:text-primary"
                  >
                    <Copy className="size-3" />
                  </button>
                </div>
                <p className="mt-1 text-[8.5px] leading-relaxed text-slate-400">
                  Slug toko tidak dapat diubah untuk menjaga tautan pelanggan, hasil pencarian
                  Google, dan bookmark tetap konsisten.
                </p>
              </div>

              <div className="mt-3">
                <FieldLabel htmlFor="store-tagline" counter={`${tagline.length}/120`} required>
                  Slogan / Tagline Usaha
                </FieldLabel>
                <input
                  id="store-tagline"
                  value={tagline}
                  onChange={(event) => setTagline(event.target.value.slice(0, 120))}
                  placeholder="Keunggulan singkat toko Anda"
                  className={`mt-1.5 ${fieldClass(Boolean(errors.tagline))}`}
                />
                <FieldError>{errors.tagline}</FieldError>
                <p className="mt-1 text-[8.5px] leading-relaxed text-slate-400">
                  Kalimat singkat yang menggambarkan keunikan rasa dan bahan resep unggulan Anda.
                </p>
              </div>

              <div className="mt-3">
                <FieldLabel
                  htmlFor="store-description"
                  counter={`${description.length}/500`}
                  required
                >
                  Deskripsi / Sejarah Usaha
                </FieldLabel>
                <textarea
                  id="store-description"
                  rows={5}
                  value={description}
                  onChange={(event) => setDescription(event.target.value.slice(0, 500))}
                  placeholder="Ceritakan asal-usul, bahan utama, dan keunggulan produk toko Anda."
                  className={`mt-1.5 min-h-[104px] py-2.5 ${fieldClass(Boolean(errors.description))}`}
                />
                <FieldError>{errors.description}</FieldError>
                <p className="mt-1 flex items-start gap-1 text-[8.5px] leading-relaxed text-slate-400">
                  <Info className="mt-px size-2.5 shrink-0" />
                  Ceritakan bahan, cita rasa, serta komitmen higienitas Anda kepada calon
                  pembeli.
                </p>
              </div>
            </SectionCard>

            <SectionCard
              icon={Phone}
              title="Kontak & Alamat Dapur Produksi"
              subtitle="Nomor WhatsApp, email, dan titik penjemputan kurir"
              badge={
                <span className="inline-flex items-center gap-1 rounded-md bg-[#f1f5f9] px-2 py-1 text-[8.5px] font-semibold text-slate-500">
                  <Truck className="size-2.5" />
                  Logistik Kurir
                </span>
              }
            >
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <FieldLabel htmlFor="store-whatsapp" required>
                    Nomor WhatsApp Operasional
                  </FieldLabel>
                  <div className="relative mt-1.5">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 rounded bg-white px-1.5 py-0.5 text-[9px] font-bold text-slate-500 shadow-sm">
                      +62
                    </span>
                    <input
                      id="store-whatsapp"
                      value={whatsapp}
                      onChange={(event) => setWhatsapp(event.target.value.slice(0, 20))}
                      inputMode="tel"
                      className={`${fieldClass(Boolean(errors.whatsapp))} pl-11`}
                    />
                  </div>
                  <FieldError>{errors.whatsapp}</FieldError>
                  <p className="mt-1 inline-flex items-center gap-1 text-[8.5px] font-medium text-primary">
                    <BadgeCheck className="size-3" />
                    Nomor terverifikasi OTP
                  </p>
                  <p className="mt-0.5 text-[8.5px] leading-relaxed text-slate-400">
                    Digunakan pembeli untuk bertanya pesanan kustom & konfirmasi pengiriman.
                  </p>
                </div>

                <div>
                  <FieldLabel htmlFor="store-email" required>
                    Email Toko / Pemilik
                  </FieldLabel>
                  <input
                    id="store-email"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value.slice(0, 80))}
                    placeholder="toko@email.com"
                    className={`mt-1.5 ${fieldClass(Boolean(errors.email))}`}
                  />
                  <FieldError>{errors.email}</FieldError>
                  <p className="mt-1 text-[8.5px] leading-relaxed text-slate-400">
                    Untuk login atau rekomendasi harian dan tagihan platform Ratis.
                  </p>
                </div>
              </div>

              <div className="mt-3">
                <FieldLabel htmlFor="store-address" required>
                  Alamat Lengkap Dapur Produksi
                </FieldLabel>
                <textarea
                  id="store-address"
                  rows={3}
                  value={address}
                  onChange={(event) => setAddress(event.target.value)}
                  className={`mt-1.5 min-h-[76px] py-2.5 ${fieldClass(Boolean(errors.address))}`}
                />
                <FieldError>{errors.address}</FieldError>
                <p className="mt-1 text-[8.5px] leading-relaxed text-slate-400">
                  Alamat ini menjadi titik jemput kurir instan dan acuan ongkos kirim pembeli.
                </p>
              </div>

              <div className="mt-3">
                <FieldLabel htmlFor="store-driver-note">
                  Catatan Penjemputan Kurir (Driver Notes)
                </FieldLabel>
                <div className="relative mt-1.5">
                  <Truck className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-slate-400" />
                  <input
                    id="store-driver-note"
                    value={addressNote}
                    onChange={(event) => setAddressNote(event.target.value)}
                    className={`${fieldClass()} pl-9`}
                  />
                </div>
                <p className="mt-1 text-[8.5px] leading-relaxed text-slate-400">
                  Petunjuk khusus ini otomatis tercetak pada label kurir instan (GoSend/GrabExpress).
                </p>
              </div>

              <CoordinatesMap
                coordinates={coordinates}
                onAdjust={() =>
                  showToast(
                    'Silakan geser pin pada peta untuk menyesuaikan titik koordinat GPS dapur.',
                    'info',
                  )
                }
              />

              <div className="mt-2">
                <FieldLabel htmlFor="store-coordinates">
                  Koordinat GPS (Latitude, Longitude)
                </FieldLabel>
                <input
                  id="store-coordinates"
                  value={coordinates}
                  onChange={(event) => setCoordinates(event.target.value)}
                  placeholder="-6.246312, 106.793215"
                  className={`mt-1.5 ${fieldClass(Boolean(errors.coordinates))}`}
                />
                <FieldError>{errors.coordinates}</FieldError>
              </div>
            </SectionCard>

            <SectionCard
              icon={CalendarDays}
              title="Jadwal Operasional Dapur & Pengiriman"
              subtitle="Pesanan di luar jam buka otomatis masuk antrean pengiriman berikutnya"
              badge={
                <div className="flex rounded-lg border border-line bg-[#f7f9fc] p-0.5">
                  <button
                    type="button"
                    onClick={activateEveryDay}
                    className={`rounded-md px-2.5 py-1 text-[9px] font-semibold transition ${
                      openEveryDay
                        ? 'bg-white text-primary shadow-sm'
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    Buka Setiap Hari
                  </button>
                  <button
                    type="button"
                    onClick={() => setOpenEveryDay(false)}
                    className={`rounded-md px-2.5 py-1 text-[9px] font-semibold transition ${
                      !openEveryDay
                        ? 'bg-white text-primary shadow-sm'
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    Kustom Harian
                  </button>
                </div>
              }
            >
              <p className="mb-2.5 text-[9.5px] leading-relaxed text-slate-500">
                Pesanan yang masuk di luar jam buka otomatis dijadwalkan untuk pengiriman slot
                pagi hari berikutnya.
              </p>

              <div className="space-y-2">
                {schedule.map((entry) => (
                  <div
                    key={entry.id}
                    className="rounded-xl border border-line px-3 py-2.5"
                  >
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-2">
                      <label className="flex min-w-0 items-center gap-2">
                        <input
                          type="checkbox"
                          checked={entry.open}
                                                     onChange={(event) => {
                            updateSchedule(entry.id, { open: event.target.checked })
                            if (!event.target.checked) setOpenEveryDay(false)
                          }}
                          className="size-3.5 shrink-0 accent-[#0f766e]"
                        />
                        <span className="text-[11px] font-bold text-ink">{entry.label}</span>
                        <span className="truncate text-[8.5px] text-slate-400">
                          {entry.note}
                        </span>
                      </label>

                      <div className="ml-auto flex flex-wrap items-center gap-1.5">
                        <span className="text-[8.5px] font-medium text-slate-400">Buka</span>
                        <input
                          type="time"
                          aria-label={`Jam buka ${entry.label}`}
                          value={entry.openTime}
                          disabled={!entry.open}
                          onChange={(event) =>
                            updateSchedule(entry.id, { openTime: event.target.value })
                          }
                          className="h-8 w-[92px] rounded-lg border border-line bg-[#f7f9fc] px-2 text-[10px] text-ink outline-none transition focus:border-primary focus:bg-white disabled:text-slate-400"
                        />
                        <span className="text-[8.5px] font-medium text-slate-400">Tutup</span>
                        <input
                          type="time"
                          aria-label={`Jam tutup ${entry.label}`}
                          value={entry.closeTime}
                          disabled={!entry.open}
                          onChange={(event) =>
                            updateSchedule(entry.id, { closeTime: event.target.value })
                          }
                          className="h-8 w-[92px] rounded-lg border border-line bg-[#f7f9fc] px-2 text-[10px] text-ink outline-none transition focus:border-primary focus:bg-white disabled:text-slate-400"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </SectionCard>

            <SectionCard
              icon={FileText}
              title="Dokumen Legalitas & Kepercayaan Konsumen"
              subtitle="Pencantuman nomor legalitas meningkatkan konversi pembelian skala korporat"
              badge={
                <span className="inline-flex items-center gap-1 rounded-md bg-[#eef2ff] px-2 py-1 text-[8.5px] font-semibold text-[#3b5bdb]">
                  Opsional / Nilai Tambah
                </span>
              }
            >
              <div className="grid gap-3 sm:grid-cols-3">
                <div>
                  <FieldLabel htmlFor="store-nib" counter={nib ? '13 digit' : 'Opsional'}>
                    Nomor Induk Berusaha (NIB)
                  </FieldLabel>
                  <input
                    id="store-nib"
                    value={nib}
                    onChange={(event) => setNib(onlyDigits(event.target.value).slice(0, 13))}
                    inputMode="numeric"
                    placeholder="1204200098912"
                    className={`mt-1.5 ${fieldClass(Boolean(errors.nib))}`}
                  />
                  <FieldError>{errors.nib}</FieldError>
                  <p className="mt-1 inline-flex items-center gap-1 text-[8.5px] font-medium text-slate-500">
                    <ShieldCheck className="size-2.5 text-primary" />
                    Terverifikasi OSS RBA
                  </p>
                </div>

                <div>
                  <FieldLabel htmlFor="store-pirt" counter="Opsional">
                    Izin Edar P-IRT Dinkes
                  </FieldLabel>
                  <input
                    id="store-pirt"
                    value={pirtValue}
                    onChange={(event) => setPirtValue(event.target.value.slice(0, 40))}
                    placeholder="P-IRT No. 2063174018019-26"
                    className={`mt-1.5 ${fieldClass(Boolean(errors.pirtValue))}`}
                  />
                  <FieldError>{errors.pirtValue}</FieldError>
                  <p className="mt-1 text-[8.5px] font-medium text-slate-500">
                    Diterbitkan {profile.pirt.issuer}
                  </p>
                </div>

                <div>
                  <FieldLabel htmlFor="store-halal" counter="Opsional">
                    Sertifikat Halal BPJPH
                  </FieldLabel>
                  <input
                    id="store-halal"
                    value={halalValue}
                    onChange={(event) => setHalalValue(event.target.value.slice(0, 40))}
                    placeholder="ID311100094928196324"
                    className={`mt-1.5 ${fieldClass(Boolean(errors.halalValue))}`}
                  />
                  <FieldError>{errors.halalValue}</FieldError>
                  <p className="mt-1 inline-flex items-center gap-1 text-[8.5px] font-medium text-slate-500">
                    <Check className="size-2.5 text-primary" />
                    Self-Declare Aktif
                  </p>
                </div>
              </div>

              <div className="mt-3 flex items-start gap-2 rounded-xl border border-line bg-[#f8fafc] px-3 py-2.5">
                <Info className="mt-px size-3 shrink-0 text-slate-400" />
                <p className="text-[8.5px] leading-relaxed text-slate-500">
                  Jika Anda mengelola data badan usaha (perubahan menjadi PT atau CV), Anda dapat
                  mengajukan pembaruan data legal ke Tim Legal Ratis melalui menu Bantuan CS.
                </p>
              </div>
            </SectionCard>
          </div>

          <aside className="min-w-0 space-y-4 xl:sticky xl:top-[92px] xl:self-start">
            <section className="rounded-2xl border border-line bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.06)]">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="flex size-8 items-center justify-center rounded-xl bg-[#eef7f4] text-primary">
                    <Eye className="size-4" />
                  </span>
                  <h2 className="text-[12px] font-bold text-ink">
                    Pratinjau Langsung Storefront
                  </h2>
                </div>
                <span className="inline-flex items-center gap-1 rounded bg-[#dcfce7] px-1.5 py-0.5 text-[8px] font-bold text-[#15803d]">
                  <span className="size-1 rounded-full bg-emerald-500" />
                  Real-time
                </span>
              </div>
              <p className="mt-1.5 text-[8.5px] leading-relaxed text-slate-500">
                Begini tampilan profil toko Anda saat dilihat pembeli di halaman storefront.
              </p>

              <div className="mt-2.5 overflow-hidden rounded-xl border border-line">
                <div className="relative h-[104px]">
                  {bannerPhoto ? (
                    <img
                      src={bannerPhoto}
                      alt="Banner pratinjau storefront"
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                  ) : (
                    <StoreProfileCoverArt />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#1b0f09]/45 to-transparent" />
                  <span className="absolute right-2 top-2 rounded bg-black/40 px-1.5 py-0.5 text-[7.5px] font-bold text-white backdrop-blur-sm">
                    LIVE
                  </span>
                </div>

                <div className="px-3 pb-3">
                  <span className="-mt-5 flex size-10 items-center justify-center overflow-hidden rounded-xl border-[3px] border-white bg-[#fdf7ed] text-[#9a5b16] shadow-sm">
                    {logoPhoto ? (
                      <img src={logoPhoto} alt="Logo pratinjau" className="h-full w-full object-cover" />
                    ) : (
                      <Cake className="size-4" />
                    )}
                  </span>

                  <div className="mt-1 flex flex-wrap items-center gap-1.5">
                    <p className="max-w-full truncate text-[11px] font-extrabold text-ink">
                      {name.trim() || 'Nama Toko'}
                    </p>
                    <span className="inline-flex items-center gap-0.5 rounded-full bg-[#dcfce7] px-1 py-0.5 text-[7px] font-bold text-[#15803d]">
                      <BadgeCheck className="size-2" />
                      Aktif
                    </span>
                  </div>

                  <p className="mt-1 line-clamp-2 text-[8.5px] italic leading-relaxed text-slate-500">
                    {tagline.trim() || 'Slogan toko Anda tampil di sini.'}
                  </p>

                  <div className="mt-2 space-y-1 border-t border-line pt-2">
                    {schedule.map((entry) => (
                      <p
                        key={entry.id}
                        className="flex items-start gap-1 text-[8px] leading-relaxed text-slate-500"
                      >
                        <Clock3 className="mt-px size-2.5 shrink-0 text-slate-400" />
                        {entry.label}:{' '}
                        {entry.open
                          ? `${entry.openTime.replace(':', '.')} - ${entry.closeTime.replace(':', '.')} WIB`
                          : 'Tutup'}
                      </p>
                    ))}
                    <p className="flex items-start gap-1 text-[8px] leading-relaxed text-slate-500">
                      <MapPin className="mt-px size-2.5 shrink-0 text-slate-400" />
                      <span className="line-clamp-2">{address.trim() || 'Alamat toko Anda'}</span>
                    </p>
                  </div>

                  <Link
                    to="/owner/pratinjau"
                    className="mt-2.5 inline-flex h-8 w-full items-center justify-center gap-1 rounded-lg bg-primary text-[9px] font-semibold text-white transition hover:bg-primary-hover"
                  >
                    Kunjungi Storefront Publik
                    <ArrowUpRight className="size-2.5" />
                  </Link>
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-line bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.06)]">
              <div className="flex items-center gap-2">
                <span className="flex size-8 items-center justify-center rounded-xl bg-[#eef7f4] text-primary">
                  <Clock3 className="size-4" />
                </span>
                <h2 className="text-[12px] font-bold text-ink">Riwayat &amp; Catatan Log</h2>
              </div>

              <p className="mt-2 text-[8.5px] leading-relaxed text-slate-400">
                <span className="font-semibold text-slate-500">Terakhir diperbarui:</span> 1 hari
                lalu, 14.20 WIB
                <br />
                <span className="font-semibold text-slate-500">Editor terakhir:</span>{' '}
                {editorName} (Pemilik Usaha)
              </p>

              <div className="mt-2.5">
                <FieldLabel htmlFor="store-internal-note">
                  Catatan Perubahan (Internal Toko)
                </FieldLabel>
                <textarea
                  id="store-internal-note"
                  rows={3}
                  value={internalNote}
                  onChange={(event) => setInternalNote(event.target.value.slice(0, 240))}
                  placeholder="Contoh: Penyesuaian jam buka minggu ini untuk pesanan hampers korporat."
                  className="mt-1.5 min-h-[72px] w-full rounded-xl border border-line bg-[#f7f9fc] px-3 py-2 text-[10px] leading-relaxed text-ink outline-none transition placeholder:text-slate-400 focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10"
                />
                <p className="mt-1 text-[8px] leading-relaxed text-slate-400">
                  Catatan ini hanya disimpan oleh pemilik dan tidak ditampilkan ke pembeli.
                </p>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="mt-2.5 inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-xl bg-primary text-[10px] font-semibold text-white transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                <Save className="size-3.5" />
                {saving ? 'Menyimpan...' : 'Simpan Pembaruan Profil'}
              </button>

              <p className="mt-2 flex items-start gap-1 text-[8px] leading-relaxed text-slate-400">
                <Info className="mt-px size-2.5 shrink-0" />
                Semua pembaruan data tayang langsung melalui data terbaru dalam 3 detik.
              </p>
            </section>

            <section className="rounded-2xl border border-[#dbe3f4] bg-[#eef2ff] p-4">
              <span className="flex size-8 items-center justify-center rounded-xl bg-white text-[#3b5bdb] shadow-sm">
                <MessageCircle className="size-4" />
              </span>
              <h2 className="mt-2.5 text-[12px] font-bold text-ink">Butuh Bantuan?</h2>
              <p className="mt-1 text-[9px] leading-relaxed text-slate-600">
                Tim Pendamping UMKM Ratis siap membantu perubahan data legal, rekening, atau
                kendala unggah foto.
              </p>
              <button
                type="button"
                onClick={() =>
                  showToast(
                    'Chat dengan Tim Pendamping UMKM Ratis dimulai. Rata-rata balasan 5 menit.',
                    'info',
                  )
                }
                className="mt-2.5 inline-flex h-8 w-full items-center justify-center gap-1.5 rounded-lg bg-white/80 text-[9px] font-semibold text-slate-700 transition hover:bg-white"
              >
                <MessageCircle className="size-3 text-primary" />
                Chat Tim Pendamping
              </button>
            </section>
          </aside>
        </div>
      </form>

      <div className="mt-4 flex flex-wrap items-center gap-3 text-[8.5px] text-slate-400">
        <span className="inline-flex items-center gap-1">
          <ExternalLink className="size-2.5" />
          Perubahan tayang langsung tanpa verifikasi ulang.
        </span>
        <span className="inline-flex items-center gap-1">
          <Store className="size-2.5" />
          Data dipakai untuk storefront, invoice, dan etalase WhatsApp.
        </span>
        <span className="inline-flex items-center gap-1">
          <Mail className="size-2.5" />
          Konfirmasi perubahan dikirim ke email terdaftar.
        </span>
      </div>
    </div>
  )
}
