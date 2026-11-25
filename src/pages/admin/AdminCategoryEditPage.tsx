import { useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent, type ReactNode } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  BadgeCheck,
  Boxes,
  Check,
  ChevronDown,
  Clock,
  Eye,
  ImagePlus,
  Info,
  Palette,
  Percent,
  ShieldCheck,
  Store,
  Trash2,
  Upload,
  type LucideIcon,
} from 'lucide-react'
import AdminToast, { type ToastTone } from '../../components/admin/AdminToast'
import ConfirmDialog from '../../components/admin/ConfirmDialog'
import {
  loadCategories,
  persistCategories,
  type CategoryIconKey,
  type CategoryRecord,
  type CategoryStatus,
} from '../../lib/admin-category-data'
import { categoryIconOptions, categoryIcons } from '../../lib/category-icons'

const MAX_NAME = 40
const MAX_DESCRIPTION = 200
const MAX_IMAGE_BYTES = 2 * 1024 * 1024
const ALLOWED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']

const kbliOptions = [
  { value: '10794', label: '10794 - Industri Makanan Basah / Jajanan' },
  { value: '10791', label: '10791 - Industri Produk Roti dan Kue' },
  { value: '10792', label: '10792 - Industri Makanan dari Kakao dan Cokelat' },
  { value: '46313', label: '46313 - Perdagangan Besar Makanan dan Minuman' },
  { value: '56101', label: '56101 - Restoran / Rumah Makan' },
]

const auditTrail = [
  {
    title: 'Penyesuaian Tarif Komisi 1,0%',
    at: '18 Okt 2024, 14.22 WIB oleh Danu Nurdin',
    description:
      'Harmonisasi skema komisi program insentif kuliner tradisional daerah.',
    tone: 'bg-primary-soft text-primary',
  },
  {
    title: 'Pembaruan Gambar Thumbnail',
    at: '24 Mei 2024, 09.10 WIB oleh Admin Ratis',
    description: 'Thumbnail mini banner etalase diperbarui ke rasio 1:1.',
    tone: 'bg-slate-200 text-slate-500',
  },
  {
    title: 'Kategori Diterbitkan Pertama Kali',
    at: '12 Jan 2024, 08.00 WIB oleh Admin Ratis',
    description: 'Entitas taksonomi global dibuat dan diaktifkan untuk seluruh UMKM.',
    tone: 'bg-slate-200 text-slate-500',
  },
]

type Illustration = { name: string; size: number }
type ToastState = { id: number; message: string; tone: ToastTone }

const dateFormatter = new Intl.DateTimeFormat('id-ID', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  timeZone: 'Asia/Jakarta',
})

function formatDate(isoDate: string) {
  return dateFormatter.format(new Date(isoDate))
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function Section({
  icon: Icon,
  title,
  part,
  children,
}: {
  icon: LucideIcon
  title: string
  part: string
  children: ReactNode
}) {
  return (
    <section className="rounded-2xl border border-line bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-2.5">
          <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-xl bg-primary-soft/60 text-primary">
            <Icon className="size-4" />
          </span>
          <h2 className="text-sm font-bold text-ink">{title}</h2>
        </div>
        <span className="shrink-0 text-[9px] font-bold uppercase tracking-[0.14em] text-muted">
          {part}
        </span>
      </div>
      <div className="mt-4">{children}</div>
    </section>
  )
}

export default function AdminCategoryEditPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const records = useMemo(() => loadCategories(), [])
  const record = useMemo(() => records.find((item) => item.id === id), [records, id])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [name, setName] = useState(record?.name ?? '')
  const [nameTouched, setNameTouched] = useState(false)
  const [slug, setSlug] = useState(record?.slug ?? '')
  const [parent, setParent] = useState('')
  const [kbli, setKbli] = useState('10794')
  const [description, setDescription] = useState(record?.description ?? '')
  const [icon, setIcon] = useState<CategoryIconKey>(record?.icon ?? 'lainnya')
  const [status, setStatus] = useState<CategoryStatus>(record?.status ?? 'aktif')
  const [showInNav, setShowInNav] = useState(true)
  const [illustration, setIllustration] = useState<Illustration | null>(() =>
    record
      ? { name: `${record.slug}-banner-sq.webp`, size: 48 * 1024 }
      : null,
  )
  const [illustrationError, setIllustrationError] = useState('')
  const [confirmDeactivate, setConfirmDeactivate] = useState(false)
  const [toast, setToast] = useState<ToastState | null>(null)

  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => setToast(null), 4000)
    return () => window.clearTimeout(timer)
  }, [toast])

  const nameError = useMemo(() => {
    const trimmed = name.trim()

    if (!trimmed) return 'Nama kategori wajib diisi.'
    if (trimmed.length < 2) return 'Nama kategori minimal 2 karakter.'
    if (trimmed.length > MAX_NAME) return `Nama kategori maksimal ${MAX_NAME} karakter.`
    const duplicate = records.some(
      (item) =>
        item.id !== record?.id && item.name.trim().toLowerCase() === trimmed.toLowerCase(),
    )
    if (duplicate) return 'Nama kategori sudah digunakan.'
    return ''
  }, [name, records, record?.id])

  const slugError = slug.trim() ? '' : 'Slug URL wajib diisi.'
  const parentOptions = records.filter((item) => item.id !== record?.id)
  const Icon = categoryIcons[icon] ?? Boxes
  const isActive = status === 'aktif'
  const productCount = record?.productCount ?? 0
  const displayName = name.trim() || record?.name || 'Kategori'
  const displayDescription = description.trim() || record?.description || ''

  function showToast(message: string, tone: ToastTone) {
    setToast({ id: Date.now(), message, tone })
  }

  function handleIllustrationChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setIllustrationError('Format harus PNG, JPG, WEBP, atau SVG.')
      return
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setIllustrationError('Ukuran gambar maksimal 2 MB.')
      return
    }

    setIllustrationError('')
    setIllustration({ name: file.name, size: file.size })
  }

  function persist(nextStatus: CategoryStatus) {
    if (!record) return

    const updated: CategoryRecord = {
      ...record,
      name: name.trim(),
      description: description.trim(),
      slug: slug.trim(),
      status: nextStatus,
      icon,
      updatedAt: new Date().toISOString(),
    }

    persistCategories(records.map((item) => (item.id === record.id ? updated : item)))
    return updated
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setNameTouched(true)
    if (nameError || slugError) return

    if (!persist(status)) return
    navigate('/admin/kategori')
  }

  function handleDeactivate() {
    if (!persist('nonaktif')) return
    setStatus('nonaktif')
    setConfirmDeactivate(false)
    showToast(`Kategori ${displayName} dinonaktifkan dari storefront.`, 'info')
  }

  if (!record) {
    return (
      <div className="mx-auto max-w-xl rounded-2xl border border-line bg-white p-10 text-center shadow-sm">
        <span className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
          <Boxes className="size-5" />
        </span>
        <h1 className="mt-3 text-lg font-bold text-ink">Kategori tidak ditemukan</h1>
        <p className="mt-1 text-xs leading-relaxed text-muted">
          Data kategori tidak tersedia atau tautan sudah tidak berlaku.
        </p>
        <Link
          to="/admin/kategori"
          className="mt-5 inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-4 text-xs font-semibold text-white transition hover:bg-primary-hover"
        >
          <ArrowLeft className="size-4" />
          Kembali ke daftar kategori
        </Link>
      </div>
    )
  }

  return (
    <div>
      <Link
        to="/admin/kategori"
        className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-ink transition hover:text-primary"
      >
        <ArrowLeft className="size-3.5" />
        Kembali ke Kelola Kategori
      </Link>

      <div className="mt-3 flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-2 text-[10px] text-muted">
            <span className="rounded-md bg-[#ece9fb] px-2 py-1 font-mono font-semibold text-slate-600">
              ID Kategori: #{record.id.replace('cat-', 'CAT-').toUpperCase()}
            </span>
            <span className="size-1 rounded-full bg-slate-300" />
            <span>Dibuat {formatDate(record.createdAt)}</span>
            <span className="size-1 rounded-full bg-slate-300" />
            <span>
              Terakhir Diperbarui {formatDate(record.updatedAt)} oleh Admin Ratis
            </span>
          </div>

          <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-ink">
            Edit Kategori Produk
          </h1>
          <p className="mt-1.5 max-w-2xl text-xs leading-relaxed text-muted">
            Perbarui metadata, konfigurasi etalase, dan aturan komisi taksonomi global dalam
            sistem katalog terpusat.
          </p>
        </div>

        <span
          className={`inline-flex shrink-0 items-center gap-1.5 self-start rounded-full px-3 py-1.5 text-[10px] font-semibold ${
            isActive
              ? 'bg-primary-soft/60 text-primary'
              : 'bg-slate-100 text-slate-500'
          }`}
        >
          <span className={`size-1.5 rounded-full ${isActive ? 'bg-primary' : 'bg-slate-400'}`} />
          Status: {isActive ? 'Terpublikasi Aktif' : 'Nonaktif / Diarsipkan'}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
        <form onSubmit={handleSubmit} className="min-w-0 space-y-4">
          <Section icon={Boxes} title="Informasi Dasar Kategori" part="Bagian 01">
            <div>
              <div className="mb-1 flex items-end justify-between gap-3">
                <label htmlFor="edit-category-name" className="text-[11px] font-semibold text-ink">
                  Nama Kategori Resmi <span className="text-red-500">*</span>
                </label>
                <div className="flex shrink-0 items-center gap-3">
                  {name.trim().length >= 2 && !nameError && (
                    <span className="inline-flex items-center gap-1 text-[9px] font-semibold text-primary">
                      <Check className="size-3" />
                      Nama valid dan tersedia
                    </span>
                  )}
                  <span className="text-[10px] text-muted">
                    {name.length} / {MAX_NAME}
                  </span>
                </div>
              </div>
              <input
                id="edit-category-name"
                type="text"
                maxLength={MAX_NAME}
                value={name}
                onChange={(event) => {
                  setName(event.target.value)
                  setNameTouched(true)
                }}
                onBlur={() => setNameTouched(true)}
                aria-invalid={Boolean(nameError && nameTouched)}
                className={`h-11 w-full rounded-xl border bg-white px-3 text-xs text-ink outline-none transition focus:ring-4 ${
                  nameError && nameTouched
                    ? 'border-red-400 focus:border-red-500 focus:ring-red-500/10'
                    : 'border-line focus:border-primary focus:ring-primary/10'
                }`}
              />
              <p
                className={`mt-1.5 text-[10px] leading-relaxed ${
                  nameError && nameTouched ? 'text-red-500' : 'text-muted'
                }`}
              >
                {nameError && nameTouched
                  ? nameError
                  : 'Nama taksonomi utama yang akan muncul pada filter, bilah navigasi, dan sertifikat produk binaan.'}
              </p>
            </div>

            <div className="mt-5">
              <label htmlFor="edit-category-slug" className="mb-1 block text-[11px] font-semibold text-ink">
                Slug URL Sistem &amp; Tautan Direktori <span className="text-red-500">*</span>
              </label>
              <div className="flex h-11 overflow-hidden rounded-xl border border-line bg-white transition focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/10">
                <span className="flex shrink-0 items-center border-r border-line bg-[#f4f5fa] px-3 font-mono text-[10px] text-slate-500">
                  https://ratis.id/kategori/
                </span>
                <input
                  id="edit-category-slug"
                  type="text"
                  value={slug}
                  onChange={(event) => setSlug(event.target.value)}
                  className="h-full min-w-0 flex-1 bg-transparent px-3 font-mono text-xs text-ink outline-none placeholder:text-slate-400"
                />
              </div>
              {slugError ? (
                <p className="mt-1.5 text-[10px] font-semibold text-red-500">{slugError}</p>
              ) : (
                <div className="mt-2 flex gap-2 rounded-xl bg-[#f4f5fa] p-3">
                  <Info className="mt-0.5 size-3.5 shrink-0 text-slate-400" />
                  <p className="text-[10px] leading-relaxed text-muted">
                    Mengubah slug URL dapat memengaruhi SEO dan tautan promosi yang sudah beredar.
                    Redirect HTTP 301 otomatis akan diterbitkan ke pusat rute secara aman.
                  </p>
                </div>
              )}
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="edit-category-parent"
                  className="mb-1 block text-[11px] font-semibold text-ink"
                >
                  Tingkatan Taksonomi (Kategori Induk)
                </label>
                <div className="relative">
                  <select
                    id="edit-category-parent"
                    value={parent}
                    onChange={(event) => setParent(event.target.value)}
                    className="h-11 w-full cursor-pointer appearance-none rounded-xl border border-line bg-white pl-3 pr-9 text-xs text-ink outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
                  >
                    <option value="">-- Kategori Utama (Level 1 / Root) --</option>
                    {parentOptions.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-3.5 -translate-y-1/2 text-slate-400" />
                </div>
                <p className="mt-1.5 text-[10px] leading-relaxed text-muted">
                  Kategori ini berada di hierarki puncak (Root Catalog).
                </p>
              </div>

              <div>
                <label
                  htmlFor="edit-category-kbli"
                  className="mb-1 block text-[11px] font-semibold text-ink"
                >
                  Penyelarasan Klasifikasi KBLI / OSS
                </label>
                <div className="relative">
                  <select
                    id="edit-category-kbli"
                    value={kbli}
                    onChange={(event) => setKbli(event.target.value)}
                    className="h-11 w-full cursor-pointer appearance-none rounded-xl border border-line bg-white pl-3 pr-9 text-[10px] text-ink outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
                  >
                    {kbliOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-3.5 -translate-y-1/2 text-slate-400" />
                </div>
                <p className="mt-1.5 text-[10px] leading-relaxed text-muted">
                  Sinkronisasi otomatis dengan standar Kementerian Investasi/BKPM.
                </p>
              </div>
            </div>

            <div className="mt-5">
              <div className="mb-1 flex items-end justify-between gap-3">
                <label
                  htmlFor="edit-category-description"
                  className="text-[11px] font-semibold text-ink"
                >
                  Deskripsi Singkat &amp; Ringkasan Etalase
                </label>
                <span className="text-[10px] text-muted">
                  {description.length} / {MAX_DESCRIPTION} karakter
                </span>
              </div>
              <textarea
                id="edit-category-description"
                rows={4}
                maxLength={MAX_DESCRIPTION}
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                className="w-full resize-none rounded-xl border border-line bg-white px-3 py-2.5 text-xs leading-relaxed text-ink outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
              />
              <p className="mt-1.5 text-[10px] leading-relaxed text-muted">
                Teks kurasi etalase untuk membantu calon pembeli menemukan ragam kuliner khas.
              </p>
            </div>
          </Section>

          <Section icon={Palette} title="Atribut Visual & Ikonografi" part="Bagian 02">
            <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-muted">
              Pilih Ikon Simbol Taksonomi
            </p>
            <p className="mt-1 text-[10px] leading-relaxed text-muted">
              Pilih lambang navigasi standar untuk etalase pembeli, aplikasi mobile, dan peta
              direktori.
            </p>
            <div className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-8">
              {categoryIconOptions.map((option) => {
                const OptionIcon = categoryIcons[option.key]
                const selected = option.key === icon

                return (
                  <button
                    key={option.key}
                    type="button"
                    aria-pressed={selected}
                    aria-label={`Ikon ${option.label}`}
                    onClick={() => setIcon(option.key)}
                    className={`flex flex-col items-center gap-1.5 rounded-xl border px-2 py-3 transition ${
                      selected
                        ? 'border-primary bg-primary-soft/50 text-primary'
                        : 'border-line bg-white text-slate-500 hover:border-primary/30 hover:bg-slate-50 hover:text-ink'
                    }`}
                  >
                    <OptionIcon className="size-4" />
                    <span className="text-[9px] font-semibold">{option.label}</span>
                  </button>
                )
              })}
            </div>

            <div className="mt-5">
              <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-muted">
                Thumbnail &amp; Mini Banner Etalase
              </p>
              <div className="mt-3 flex flex-col gap-3 rounded-xl bg-[#f4f5fa] p-3 sm:flex-row sm:items-center">
                <div className="relative flex size-24 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-slate-200 text-slate-400">
                  <ImagePlus className="size-6" />
                  <span className="absolute bottom-1.5 right-1.5 rounded bg-slate-900/60 px-1 py-0.5 text-[8px] font-bold text-white">
                    1:1
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="break-all text-[11px] font-bold text-ink">
                    {illustration ? illustration.name : 'Belum ada thumbnail'}
                  </p>
                  <p className="mt-0.5 text-[10px] text-muted">
                    {illustration
                      ? `Dimensi 600 × 600 px • Rasio 1:1 • WebP • ${formatBytes(illustration.size)}`
                      : 'Unggah gambar mini banner rasio 1:1 untuk kartu etalase.'}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-line bg-white px-2.5 text-[10px] font-semibold text-slate-600 transition hover:bg-slate-50"
                    >
                      <Upload className="size-3" />
                      Ganti Gambar
                    </button>
                    {illustration && (
                      <button
                        type="button"
                        onClick={() => {
                          setIllustration(null)
                          setIllustrationError('')
                        }}
                        className="inline-flex h-8 items-center gap-1.5 rounded-lg px-2 text-[10px] font-semibold text-red-500 transition hover:bg-red-50"
                      >
                        <Trash2 className="size-3" />
                        Hapus
                      </button>
                    )}
                  </div>
                  {illustrationError && (
                    <p className="mt-1.5 text-[10px] font-semibold text-red-500">
                      {illustrationError}
                    </p>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept={ALLOWED_IMAGE_TYPES.join(',')}
                    onChange={handleIllustrationChange}
                    className="hidden"
                    aria-label="Unggah thumbnail kategori"
                  />
                </div>
              </div>
              <p className="mt-1.5 text-[10px] leading-relaxed text-muted">
                Gambar akan dipakai pada kartu kategori beranda, carousel jelajah, dan katalog
                unduhan PDF.
              </p>
            </div>
          </Section>

          <Section icon={ShieldCheck} title="Visibilitas & Skema Tarif" part="Bagian 03">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex items-center justify-between gap-3 rounded-xl bg-[#f4f5fa] p-4">
                <div>
                  <p className="text-[11px] font-bold text-ink">Status Kategori</p>
                  <p className="mt-0.5 text-[10px] text-muted">
                    {isActive ? 'Aktif (Tampil di Storefront)' : 'Nonaktif (Disembunyikan)'}
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={isActive}
                  aria-label="Status kategori"
                  onClick={() => setStatus(isActive ? 'nonaktif' : 'aktif')}
                  className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition ${
                    isActive ? 'bg-primary' : 'bg-slate-300'
                  }`}
                >
                  <span
                    className={`inline-block size-5 rounded-full bg-white shadow transition-transform ${
                      isActive ? 'translate-x-[22px]' : 'translate-x-0.5'
                    }`}
                  />
                </button>
              </div>

              <label className="flex cursor-pointer items-start gap-2.5 rounded-xl bg-[#f4f5fa] p-4">
                <input
                  type="checkbox"
                  checked={showInNav}
                  onChange={(event) => setShowInNav(event.target.checked)}
                  className="mt-0.5 size-3.5 shrink-0 accent-[#0f766e]"
                />
                <span>
                  <span className="block text-[11px] font-bold text-ink">Navigasi Utama</span>
                  <span className="mt-0.5 block text-[10px] leading-relaxed text-muted">
                    Ditampilkan di Menu Navigasi Beranda
                  </span>
                </span>
              </label>
            </div>

            <div className="mt-4">
              <div className="flex flex-wrap items-end justify-between gap-2">
                <p className="text-[11px] font-bold text-ink">
                  Skema Bagi Hasil / Tarif Komisi Transaksi
                </p>
                <span className="rounded-full bg-[#ece9fb] px-2 py-1 text-[9px] font-semibold text-slate-600">
                  Kebijakan Pemerintah / Inklusif
                </span>
              </div>
              <div className="mt-2 flex flex-col gap-2 rounded-xl border border-line p-3 sm:flex-row sm:items-center sm:justify-between">
                <span className="inline-flex items-center gap-2 text-[11px] font-semibold text-ink">
                  <Percent className="size-3.5 text-slate-400" />
                  1,0% (Standar Kategori Kuliner &amp; Pangan Olahan)
                </span>
                <button
                  type="button"
                  onClick={() =>
                    showToast(
                      'Perubahan tarif komisi memerlukan izin kebijakan Superadmin.',
                      'info',
                    )
                  }
                  className="inline-flex h-8 shrink-0 items-center justify-center rounded-lg border border-line bg-white px-3 text-[10px] font-semibold text-slate-600 transition hover:bg-slate-50"
                >
                  Ubah Izin
                </button>
              </div>
              <p className="mt-1.5 text-[10px] leading-relaxed text-muted">
                Tarif komisi operasional platform disesuaikan dengan regulasi subsidi pangan UMKM
                daerah untuk menjamin keberlanjutan margin pedagang.
              </p>
            </div>
          </Section>

          <section className="flex flex-col gap-3 rounded-2xl border border-emerald-100 bg-[#effaf6] p-5 shadow-sm sm:flex-row sm:items-start">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary text-white">
              <ShieldCheck className="size-4" />
            </span>
            <div className="min-w-0">
              <h2 className="text-xs font-bold text-ink">Zona Proteksi Integritas Produk</h2>
              <p className="mt-1 text-[10px] leading-relaxed text-slate-600">
                Kategori ini memiliki{' '}
                <span className="font-bold text-ink">
                  {productCount.toLocaleString('id-ID')} Produk Terhubung
                </span>{' '}
                dan 42 UMKM binaan aktif. Penghapusan permanen dinonaktifkan secara otomatis oleh
                tata kelola sistem. Setiap pembaruan atribut akan langsung tersinkronisasi ke
                seluruh etalase dalam tempo kurang dari 5 detik.
              </p>
            </div>
          </section>

          <div className="rounded-2xl border border-line bg-white p-4 shadow-sm">
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="button"
                onClick={() => setConfirmDeactivate(true)}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl px-3 text-[11px] font-semibold text-red-600 transition hover:bg-red-50"
              >
                <Trash2 className="size-3.5" />
                Nonaktifkan Kategori
              </button>
              <div className="flex flex-col gap-2 sm:flex-row">
                <button
                  type="button"
                  onClick={() => navigate('/admin/kategori')}
                  className="inline-flex h-10 items-center justify-center rounded-xl border border-line bg-white px-4 text-[11px] font-semibold text-slate-600 transition hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-[11px] font-semibold text-white transition hover:bg-primary-hover"
                >
                  <Check className="size-3.5" />
                  Simpan Perubahan Kategori
                </button>
              </div>
            </div>
          </div>
        </form>

        <aside className="min-w-0 space-y-4 xl:sticky xl:top-24 xl:self-start">
          <section className="rounded-2xl border border-line bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-2">
              <h2 className="flex items-center gap-2 text-xs font-bold text-ink">
                <Eye className="size-4 text-primary" />
                Pratinjau Storefront
              </h2>
              <span className="inline-flex items-center gap-1.5 text-[9px] font-semibold text-emerald-600">
                <span className="size-1.5 rounded-full bg-emerald-500" />
                Live Sync
              </span>
            </div>
            <p className="mt-1.5 text-[10px] leading-relaxed text-muted">
              Tampilan interaktif kartu kategori pada aplikasi pembeli Ratis.
            </p>

            <div className="mt-3 rounded-2xl border border-line bg-[#f6f5fd] p-4">
              <div className="flex items-start justify-between gap-2">
                <span className="flex size-10 items-center justify-center rounded-xl bg-primary text-white">
                  <Icon className="size-5" />
                </span>
                <span className="rounded-full bg-white px-2 py-1 text-[8px] font-bold uppercase tracking-wide text-slate-500">
                  {productCount.toLocaleString('id-ID')} Produk
                </span>
              </div>
              <p className="mt-3 break-words text-sm font-extrabold leading-snug text-ink">
                {displayName}
              </p>
              <p className="mt-1 line-clamp-3 text-[10px] leading-relaxed text-muted">
                {displayDescription || 'Deskripsi kategori belum diisi.'}
              </p>
              <div className="mt-3 flex items-center justify-between gap-2">
                <span className="text-[10px] font-bold text-primary">Jelajahi Koleksi</span>
                <span className="text-[10px] font-bold text-primary">→</span>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-line bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-2">
              <h2 className="flex items-center gap-2 text-xs font-bold text-ink">
                <Clock className="size-4 text-primary" />
                Metrik Taksonomi 30 Hari
              </h2>
              <span className="text-[9px] text-muted">Per Hari Ini</span>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2">
              <div className="rounded-xl bg-[#f4f5fa] p-3">
                <p className="text-[9px] text-muted">Produk Aktif</p>
                <p className="mt-1 text-xl font-extrabold leading-none text-ink">
                  {productCount.toLocaleString('id-ID')}{' '}
                  <span className="text-[9px] font-semibold text-muted">SKU</span>
                </p>
                <p className="mt-1 text-[9px] font-semibold text-emerald-600">+18 produk baru</p>
              </div>
              <div className="rounded-xl bg-[#f4f5fa] p-3">
                <p className="text-[9px] text-muted">Mitra UMKM</p>
                <p className="mt-1 text-xl font-extrabold leading-none text-ink">
                  42 <span className="text-[9px] font-semibold text-muted">Toko</span>
                </p>
                <p className="mt-1 text-[9px] font-semibold text-primary">100% Terverifikasi</p>
              </div>
              <div className="col-span-2 rounded-xl bg-[#ece9fb] p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[9px] text-muted">Omzet Transaksi Kategori</p>
                  <span className="text-[9px] font-bold text-emerald-600">+14,2%</span>
                </div>
                <p className="mt-1 text-lg font-extrabold leading-none text-ink">Rp 48.250.000</p>
                <p className="mt-1 text-[9px] text-muted">1.120 pesanan terverifikasi lunas</p>
                <svg
                  viewBox="0 0 200 44"
                  className="mt-2 h-10 w-full text-primary"
                  fill="none"
                  preserveAspectRatio="none"
                  aria-hidden
                >
                  <path
                    d="M2 34 L27 28 L52 31 L77 21 L102 25 L127 15 L152 19 L177 9 L198 13"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-line bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-2">
              <h2 className="flex items-center gap-2 text-xs font-bold text-ink">
                <BadgeCheck className="size-4 text-primary" />
                Log Audit Taksonomi
              </h2>
              <span className="text-slate-400">
                <Clock className="size-3.5" />
              </span>
            </div>
            <ol className="relative mt-4 space-y-4 before:absolute before:bottom-1 before:left-[5px] before:top-1 before:w-px before:bg-line">
              {auditTrail.map((event) => (
                <li key={event.title} className="relative pl-5">
                  <span
                    className={`absolute left-0 top-1 size-[11px] rounded-full border-2 border-white ${event.tone}`}
                  />
                  <p className="text-[10px] font-bold leading-snug text-ink">{event.title}</p>
                  <p className="mt-0.5 text-[9px] text-muted">{event.at}</p>
                  <p className="mt-1 text-[9px] leading-relaxed text-muted">{event.description}</p>
                </li>
              ))}
            </ol>
          </section>

          <section className="flex items-center gap-2 rounded-2xl border border-line bg-white p-4 text-[9px] text-muted shadow-sm">
            <Store className="size-3.5 shrink-0 text-primary" />
            Perubahan atribut berlaku untuk seluruh toko UMKM di platform.
          </section>
        </aside>
      </div>

      <ConfirmDialog
        open={confirmDeactivate}
        title={`Nonaktifkan kategori ${displayName}?`}
        description="Kategori tidak akan muncul saat produk baru dibuat. Produk lama yang sudah memakai kategori ini tetap tampil seperti biasa."
        confirmLabel="Nonaktifkan Kategori"
        tone="danger"
        onConfirm={handleDeactivate}
        onClose={() => setConfirmDeactivate(false)}
      />

      {toast && (
        <AdminToast
          key={toast.id}
          message={toast.message}
          tone={toast.tone}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  )
}
