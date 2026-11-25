import { useMemo, useRef, useState, type ChangeEvent, type FormEvent, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  BadgeCheck,
  Boxes,
  Check,
  CheckCircle2,
  Eye,
  ImagePlus,
  Info,
  Lock,
  Palette,
  Percent,
  Save,
  Send,
  ShieldCheck,
  Store,
  Unlock,
  Upload,
  X,
  Zap,
  type LucideIcon,
} from 'lucide-react'
import {
  loadCategories,
  persistCategories,
  slugifyCategoryName,
  type CategoryIconKey,
  type CategoryRecord,
  type CategoryStatus,
} from '../../lib/admin-category-data'
import { categoryIconOptions, categoryIcons } from '../../lib/category-icons'

const MAX_NAME = 40
const MAX_DESCRIPTION = 200
const MAX_IMAGE_BYTES = 2 * 1024 * 1024
const ALLOWED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']

type Illustration = { name: string; size: number }

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function Section({
  icon: Icon,
  title,
  subtitle,
  right,
  children,
}: {
  icon: LucideIcon
  title: string
  subtitle?: string
  right?: ReactNode
  children: ReactNode
}) {
  return (
    <section className="rounded-2xl border border-line bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-2.5">
          <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-xl bg-primary-soft/60 text-primary">
            <Icon className="size-4" />
          </span>
          <div className="min-w-0">
            <h2 className="text-sm font-bold text-ink">{title}</h2>
            {subtitle && (
              <p className="mt-0.5 text-[10px] leading-relaxed text-muted">{subtitle}</p>
            )}
          </div>
        </div>
        {right && <div className="shrink-0">{right}</div>}
      </div>
      <div className="mt-4">{children}</div>
    </section>
  )
}

export default function AdminCategoryAddPage() {
  const navigate = useNavigate()
  const records = useMemo(() => loadCategories(), [])
  const nameInputRef = useRef<HTMLInputElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [name, setName] = useState('')
  const [nameTouched, setNameTouched] = useState(false)
  const [slug, setSlug] = useState('')
  const [slugLocked, setSlugLocked] = useState(false)
  const [parent, setParent] = useState('')
  const [description, setDescription] = useState('')
  const [icon, setIcon] = useState<CategoryIconKey>('kuliner')
  const [published, setPublished] = useState(true)
  const [showInNav, setShowInNav] = useState(true)
  const [illustration, setIllustration] = useState<Illustration | null>(null)
  const [illustrationError, setIllustrationError] = useState('')

  const nameError = useMemo(() => {
    const trimmed = name.trim()

    if (!trimmed) return 'Nama kategori wajib diisi.'
    if (trimmed.length < 2) return 'Nama kategori minimal 2 karakter.'
    if (trimmed.length > MAX_NAME) return `Nama kategori maksimal ${MAX_NAME} karakter.`
    if (
      records.some(
        (record) => record.name.trim().toLowerCase() === trimmed.toLowerCase(),
      )
    ) {
      return 'Nama kategori sudah digunakan.'
    }
    return ''
  }, [name, records])

  const autoSlug = slugifyCategoryName(name)
  const slugValue = slugLocked ? slug : autoSlug
  const slugTaken = records.some((record) => record.slug === slugValue)
  const parentName = records.find((record) => record.id === parent)?.name
  const Icon = categoryIcons[icon] ?? Boxes
  const descriptionLength = description.length
  const nameAvailabilityVisible = nameTouched && name.trim().length >= 2 && !nameError

  function handleNameChange(value: string) {
    setName(value)
    if (!slugLocked) setSlug(slugifyCategoryName(value))
  }

  function toggleSlugLock() {
    if (!slugLocked) setSlug(autoSlug)
    setSlugLocked((current) => !current)
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

  function makeUniqueSlug(base: string) {
    const root = base || `kategori-${Date.now()}`
    let candidate = root
    let counter = 2

    while (records.some((record) => record.slug === candidate)) {
      candidate = `${root}-${counter}`
      counter += 1
    }

    return candidate
  }

  function save(status: CategoryStatus) {
    setNameTouched(true)
    if (nameError) {
      nameInputRef.current?.focus()
      return
    }

    const now = new Date().toISOString()
    const record: CategoryRecord = {
      id: `cat-${Date.now()}`,
      name: name.trim(),
      description: description.trim(),
      slug: makeUniqueSlug(slugValue.trim()),
      productCount: 0,
      createdAt: now,
      updatedAt: now,
      status,
      icon,
    }

    persistCategories([record, ...records])
    navigate('/admin/kategori')
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    save(published ? 'aktif' : 'nonaktif')
  }

  return (
    <div>
      <Link
        to="/admin/kategori"
        className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-ink transition hover:text-primary"
      >
        <ArrowLeft className="size-3.5" />
        Kembali ke Daftar Kategori
      </Link>

      <div className="mt-3 min-w-0">
        <h1 className="text-2xl font-extrabold tracking-tight text-ink">
          Tambah Kategori Produk Baru
        </h1>
        <p className="mt-1.5 max-w-2xl text-xs leading-relaxed text-muted">
          Definisi entitas taksonomi global baru untuk klasifikasi produk UMKM di etalase
          storefront dan filter pencarian nasional.
        </p>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
        <form onSubmit={handleSubmit} className="min-w-0 space-y-4">
          <Section
            icon={Boxes}
            title="Informasi Dasar Kategori"
            subtitle="Identitas utama kategori yang tampil di katalog dan pencarian storefront."
            right={
              <span className="text-[9px] font-semibold uppercase tracking-[0.1em] text-muted">
                * Wajib diisi
              </span>
            }
          >
            <div>
              <div className="mb-1 flex items-end justify-between gap-3">
                <label htmlFor="category-name" className="text-[11px] font-semibold text-ink">
                  Nama Kategori <span className="text-red-500">*</span>
                </label>
                <span className="text-[10px] text-muted">
                  {name.length} / {MAX_NAME} karakter
                </span>
              </div>
              <input
                id="category-name"
                ref={nameInputRef}
                type="text"
                maxLength={MAX_NAME}
                value={name}
                onChange={(event) => {
                  handleNameChange(event.target.value)
                  setNameTouched(true)
                }}
                onBlur={() => setNameTouched(true)}
                placeholder="Contoh: Camilan Tradisional & Keripik"
                aria-invalid={Boolean(nameError && nameTouched)}
                aria-describedby="category-name-help"
                className={`h-11 w-full rounded-xl border bg-white px-3 text-xs text-ink outline-none transition placeholder:text-slate-400 focus:ring-4 ${
                  nameError && nameTouched
                    ? 'border-red-400 focus:border-red-500 focus:ring-red-500/10'
                    : 'border-line focus:border-primary focus:ring-primary/10'
                }`}
              />
              <div
                id="category-name-help"
                className="mt-1.5 flex flex-wrap items-start justify-between gap-2 text-[10px]"
              >
                <span className={nameError && nameTouched ? 'text-red-500' : 'text-muted'}>
                  {nameError && nameTouched
                    ? nameError
                    : 'Panjang 2-40 karakter. Nama harus unik di seluruh sistem (tidak sensitif huruf besar/kecil).'}
                </span>
                {nameAvailabilityVisible && (
                  <span className="inline-flex shrink-0 items-center gap-1 font-semibold text-primary">
                    <Check className="size-3" />
                    Nama kategori tersedia
                  </span>
                )}
              </div>
            </div>

            <div className="mt-5">
              <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
                <label htmlFor="category-slug" className="text-[11px] font-semibold text-ink">
                  Slug URL Sistem <span className="text-red-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={toggleSlugLock}
                  className="inline-flex items-center gap-1 text-[10px] font-semibold text-primary transition hover:underline"
                >
                  {slugLocked ? <Unlock className="size-3" /> : <Lock className="size-3" />}
                  {slugLocked ? 'Buka Kunci' : 'Kunci / Ubah Manual'}
                </button>
              </div>
              <div
                className={`flex h-11 overflow-hidden rounded-xl border transition ${
                  slugLocked
                    ? 'border-primary/40 bg-white focus-within:ring-4 focus-within:ring-primary/10'
                    : 'border-line bg-[#f4f5fa]'
                }`}
              >
                <span className="flex shrink-0 items-center border-r border-line px-3 font-mono text-[10px] text-slate-500">
                  https://ratis.id/kategori/
                </span>
                <input
                  id="category-slug"
                  type="text"
                  readOnly={!slugLocked}
                  value={slugValue}
                  onChange={(event) => setSlug(slugifyCategoryName(event.target.value))}
                  placeholder="nama-kategori"
                  className="h-full min-w-0 flex-1 bg-transparent px-3 font-mono text-xs text-ink outline-none placeholder:text-slate-400 read-only:cursor-not-allowed"
                />
              </div>
              <p className="mt-1.5 text-[10px] leading-relaxed text-muted">
                Slug URL permanen dipakai untuk rute SEO storefront dan katalog publik. Otomatis
                dibentuk dari nama kategori.
                {slugTaken && (
                  <span className="ml-1 font-semibold text-amber-600">
                    Slug ini sudah dipakai, sistem akan menambahkan akhiran otomatis.
                  </span>
                )}
              </p>
            </div>

            <div className="mt-5">
              <label htmlFor="category-parent" className="mb-1 block text-[11px] font-semibold text-ink">
                Kategori Induk (Parent Category)
              </label>
              <div className="relative">
                <select
                  id="category-parent"
                  value={parent}
                  onChange={(event) => setParent(event.target.value)}
                  className="h-11 w-full cursor-pointer appearance-none rounded-xl border border-line bg-white pl-3 pr-9 text-xs text-ink outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
                >
                  <option value="">Tanpa induk (kategori utama)</option>
                  {records.map((record) => (
                    <option key={record.id} value={record.id}>
                      {record.name} (Induk)
                    </option>
                  ))}
                </select>
                <svg
                  aria-hidden
                  viewBox="0 0 20 20"
                  fill="none"
                  className="pointer-events-none absolute right-3 top-1/2 size-3.5 -translate-y-1/2 text-slate-400"
                >
                  <path d="M6 8l4 4 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <p className="mt-1.5 text-[10px] leading-relaxed text-muted">
                Gunakan jika kategori baru merupakan sub-kategori spesifik untuk memudahkan
                navigasi pembeli.
              </p>
            </div>

            <div className="mt-5">
              <div className="mb-1 flex items-end justify-between gap-3">
                <label
                  htmlFor="category-description"
                  className="text-[11px] font-semibold text-ink"
                >
                  Deskripsi Singkat Kategori
                </label>
                <span className="text-[10px] text-muted">
                  {descriptionLength} / {MAX_DESCRIPTION} karakter
                </span>
              </div>
              <textarea
                id="category-description"
                rows={4}
                maxLength={MAX_DESCRIPTION}
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Aneka camilan kering, keripik umbi-umbian, peyek, dan kudapan tradisional khas daerah hasil olahan pangan UMKM binaan lokal."
                className="w-full resize-none rounded-xl border border-line bg-white px-3 py-2.5 text-xs leading-relaxed text-ink outline-none transition placeholder:text-slate-400 focus:border-primary focus:ring-4 focus:ring-primary/10"
              />
              <p className="mt-1.5 text-[10px] leading-relaxed text-muted">
                Deskripsi muncul pada hasil pencarian metadata Google serta ringkasan etalase
                storefront.
              </p>
            </div>
          </Section>

          <Section
            icon={Palette}
            title="Atribut Visual & Ikonografi"
            subtitle="Simbol taksonomi yang membantu pembeli mengenali kategori di etalase."
            right={
              <span className="rounded-lg bg-[#f4f5fa] px-2 py-1 text-[9px] font-semibold text-slate-500">
                Tampilan Frontend
              </span>
            }
          >
            <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-muted">
              Pilih Ikon Simbol Taksonomi
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
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-muted">
                  Ilustrasi Mini Etalase (Opsional)
                </p>
                <span className="text-[9px] text-muted">
                  Rasio 1:1, Format PNG/SVG/WEBP (Maks. 2 MB)
                </span>
              </div>

              <div className="mt-3 flex flex-col gap-3 rounded-xl bg-[#f4f5fa] p-3 sm:flex-row sm:items-center">
                <div className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-slate-200 text-slate-400">
                  <ImagePlus className="size-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex items-center gap-1.5 text-[10px] font-bold text-ink transition hover:text-primary"
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
                        className="inline-flex items-center gap-1 text-[10px] font-semibold text-red-500 transition hover:underline"
                      >
                        <X className="size-3" />
                        Hapus
                      </button>
                    )}
                  </div>
                  <p className="mt-1 break-all text-[10px] leading-relaxed text-muted">
                    {illustration
                      ? `${illustration.name} (${formatBytes(illustration.size)}). Optimal untuk kartu slider kategori di aplikasi Android pembeli.`
                      : 'Gambar tampil sebagai kartu slider kategori. Kosongkan untuk memakai ikon simbol bawaan.'}
                  </p>
                  {illustrationError && (
                    <p className="mt-1 text-[10px] font-semibold text-red-500">
                      {illustrationError}
                    </p>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={ALLOWED_IMAGE_TYPES.join(',')}
                  onChange={handleIllustrationChange}
                  className="hidden"
                  aria-label="Unggah ilustrasi mini etalase"
                />
              </div>
            </div>
          </Section>

          <Section
            icon={ShieldCheck}
            title="Pengaturan Visibilitas & Kepatuhan Katalog"
            subtitle="Kendali publikasi kategori ke storefront dan skema bagi hasil platform."
          >
            <div className="rounded-xl bg-[#f4f5fa] p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-[11px] font-bold text-ink">
                      Publikasikan &amp; Aktifkan Segera
                    </p>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${
                        published
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      STATUS: {published ? 'AKTIF' : 'NONAKTIF'}
                    </span>
                  </div>
                  <p className="mt-1.5 max-w-xl text-[10px] leading-relaxed text-muted">
                    Jika aktif, kategori ini langsung tersedia bagi pemilik toko UMKM untuk
                    menambahkan produk baru serta dapat disortir di storefront publik.
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={published}
                  aria-label="Publikasikan dan aktifkan kategori"
                  onClick={() => setPublished((current) => !current)}
                  className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition ${
                    published ? 'bg-primary' : 'bg-slate-300'
                  }`}
                >
                  <span
                    className={`inline-block size-5 rounded-full bg-white shadow transition-transform ${
                      published ? 'translate-x-[22px]' : 'translate-x-0.5'
                    }`}
                  />
                </button>
              </div>
            </div>

            <label className="mt-3 flex cursor-pointer items-start gap-2.5">
              <input
                type="checkbox"
                checked={showInNav}
                onChange={(event) => setShowInNav(event.target.checked)}
                className="mt-0.5 size-3.5 shrink-0 accent-[#0f766e]"
              />
              <span>
                <span className="block text-[11px] font-semibold text-ink">
                  Tampilkan di Navigasi Utama Storefront Beranda
                </span>
                <span className="mt-0.5 block text-[10px] leading-relaxed text-muted">
                  Kategori akan di-pin pada bilah menu atas etalase marketplace web desktop dan
                  slider navigasi cepat mobile.
                </span>
              </span>
            </label>

            <div className="mt-3 flex flex-col gap-2 rounded-xl border border-line p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-2.5">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#ece9fb] text-slate-500">
                  <Percent className="size-4" />
                </span>
                <div>
                  <p className="text-[11px] font-bold text-ink">Estimasi Tingkat Komisi Platform</p>
                  <p className="mt-0.5 text-[10px] leading-relaxed text-muted">
                    Skema bagi hasil transaksi reguler UMKM.
                  </p>
                </div>
              </div>
              <span className="shrink-0 rounded-lg bg-[#f4f5fa] px-2.5 py-1.5 text-[10px] font-bold text-ink">
                1,0% (Standar Kategori Pangan &amp; Olahan)
              </span>
            </div>
          </Section>

          <div className="rounded-2xl border border-line bg-white p-4 shadow-sm">
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="button"
                onClick={() => navigate('/admin/kategori')}
                className="inline-flex h-10 items-center justify-center rounded-xl border border-line bg-white px-4 text-[11px] font-semibold text-slate-600 transition hover:bg-slate-50"
              >
                Batal
              </button>
              <div className="flex flex-col gap-2 sm:flex-row">
                <button
                  type="button"
                  onClick={() => save('nonaktif')}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-line bg-white px-4 text-[11px] font-semibold text-slate-600 transition hover:bg-slate-50"
                >
                  <Save className="size-3.5" />
                  Simpan sebagai Draf
                </button>
                <button
                  type="submit"
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-[11px] font-semibold text-white transition hover:bg-primary-hover"
                >
                  <Send className="size-3.5" />
                  Terbitkan Kategori Baru
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
              Berikut simulasi render kartu kategori pada etalase web dan mobile aplikasi pembeli
              Ratis UMKM.
            </p>

            <div className="mt-3 rounded-2xl border border-line bg-[#f6f5fd] p-4">
              <div className="flex items-start justify-between gap-2">
                <span className="flex size-10 items-center justify-center rounded-full bg-primary-soft text-primary">
                  <Icon className="size-5" />
                </span>
                <span className="rounded-full bg-white px-2 py-1 text-[8px] font-bold uppercase tracking-wide text-slate-500">
                  0 Produk Terhubung (Baru)
                </span>
              </div>
              <p className="mt-3 break-words text-sm font-extrabold leading-snug text-ink">
                {name.trim() || 'Nama kategori baru'}
              </p>
              <p className="mt-1 line-clamp-3 text-[10px] leading-relaxed text-muted">
                {description.trim() ||
                  'Deskripsi singkat kategori akan tampil di sini sebagai ringkasan etalase storefront.'}
              </p>
              <div className="mt-3 flex items-end justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-[9px] text-slate-400">Induk</p>
                  <p className="truncate text-[10px] font-semibold text-slate-600">
                    {parentName ?? 'Kategori Utama'}
                  </p>
                </div>
                <span className="inline-flex shrink-0 items-center gap-1 text-[9px] font-bold text-primary">
                  Jelajahi →
                </span>
              </div>
              <div className="mt-3 flex items-center gap-2 rounded-lg border border-dashed border-line px-2 py-1.5">
                <span className="flex size-6 items-center justify-center rounded bg-slate-200 text-slate-400">
                  <ImagePlus className="size-3" />
                </span>
                <p className="min-w-0 flex-1 truncate text-[9px] text-muted">
                  {illustration ? illustration.name : 'Ilustrasi mini etalase'}
                </p>
                <span className="shrink-0 text-[8px] font-semibold text-muted">
                  {published ? 'Tayang' : 'Draf'}
                </span>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-line bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2">
              <ShieldCheck className="size-4 text-primary" />
              <h2 className="text-xs font-bold text-ink">Aturan Validasi &amp; Kebijakan</h2>
            </div>
            <ul className="mt-3 space-y-3">
              <li className="flex gap-2 text-[10px] leading-relaxed text-muted">
                <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-primary" />
                Nama kategori harus unik di seluruh sistem, tidak peka terhadap huruf besar/kecil
                atau spasi tepi.
              </li>
              <li className="flex gap-2 text-[10px] leading-relaxed text-muted">
                <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-primary" />
                Kategori yang baru terbit otomatis sinkron dengan sistem integrasi katalog agregasi
                UMKM nasional.
              </li>
              <li className="flex gap-2 text-[10px] leading-relaxed text-muted">
                <Info className="mt-0.5 size-3.5 shrink-0 text-slate-400" />
                Kategori yang telah memuat produk aktif tidak dapat dihapus permanen guna menjaga
                integritas riwayat transaksi.
              </li>
              <li className="flex gap-2 text-[10px] leading-relaxed text-muted">
                <Zap className="mt-0.5 size-3.5 shrink-0 text-amber-500" />
                Setiap penambahan atau modifikasi taksonomi akan dicatat otomatis pada Log Aktivitas
                Audit Superadmin.
              </li>
            </ul>
          </section>

          <section className="rounded-2xl border border-line bg-white p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary-soft/60 text-primary">
                <BadgeCheck className="size-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-bold text-ink">Admin Ratis (Superadmin)</p>
                <p className="mt-0.5 text-[9px] text-muted">Modul: Pangkalan Data Taksonomi</p>
              </div>
              <span className="shrink-0 rounded-lg bg-[#f4f5fa] px-2 py-1 font-mono text-[9px] font-semibold text-slate-500">
                ID: TK-9042
              </span>
            </div>
            <div className="mt-3 flex items-center gap-2 rounded-xl bg-[#f4f5fa] px-3 py-2 text-[9px] leading-relaxed text-muted">
              <Store className="size-3.5 shrink-0 text-primary" />
              Perubahan langsung berlaku untuk seluruh toko UMKM di platform.
            </div>
          </section>
        </aside>
      </div>
    </div>
  )
}
