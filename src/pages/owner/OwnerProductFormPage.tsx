import { useMemo, useRef, useState, type ChangeEvent, type FormEvent, type ReactNode } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowUpRight,
  Camera,
  Check,
  ChevronDown,
  ClipboardList,
  Eye,
  Image as ImageIcon,
  Info,
  Lightbulb,
  ShoppingCart,
  Smartphone,
  Sparkles,
  Star,
  Upload,
  X,
} from 'lucide-react'
import { getOwnerSession } from '../../lib/owner-auth'
import { addOwnerProduct, productCategories, type OwnerProduct } from '../../lib/owner-product-data'

type FormErrors = {
  name?: string
  category?: string
  description?: string
  price?: string
  comparePrice?: string
  stock?: string
  minStock?: string
}

const stockUnits = [
  'pcs',
  'loyang',
  'box',
  'pack',
  'porsi',
  'toples',
  'set',
  'mika',
  'roll',
  'botol',
]

const maxDescription = 500
const maxPhotos = 5

function onlyDigits(value: string) {
  return value.replace(/\D/g, '')
}

function formatThousands(value: string) {
  const digits = onlyDigits(value)
  if (!digits) return ''
  return new Intl.NumberFormat('id-ID').format(Number(digits))
}

function formatRupiah(value: number) {
  return `Rp${new Intl.NumberFormat('id-ID').format(value)}`
}

function formatClock() {
  const formatted = new Intl.DateTimeFormat('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Jakarta',
  }).format(new Date())
  return formatted.replace(':', '.')
}

function getInitials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join('')
}

function CardHeader({
  icon,
  title,
  subtitle,
  badge,
}: {
  icon: ReactNode
  title: string
  subtitle: string
  badge?: ReactNode
}) {
  return (
    <div className="flex flex-col gap-3 border-b border-[#eef2f6] px-5 pb-4 pt-5 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#e3f6f1] text-primary">
          {icon}
        </span>
        <div>
          <h2 className="text-[14px] font-extrabold tracking-tight text-ink">{title}</h2>
          <p className="mt-0.5 text-[11px] leading-relaxed text-slate-500">{subtitle}</p>
        </div>
      </div>
      {badge}
    </div>
  )
}

function Label({
  children,
  required,
  optional,
}: {
  children: ReactNode
  required?: boolean
  optional?: boolean
}) {
  return (
    <span className="flex flex-wrap items-center gap-1.5 text-[12px] font-semibold text-ink">
      {children}
      {required && <span className="text-[#dc2626]">*</span>}
      {optional && (
        <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-slate-500">
          Opsional
        </span>
      )}
    </span>
  )
}

export default function OwnerProductFormPage() {
  const navigate = useNavigate()
  const [session] = useState(getOwnerSession)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const extraInputRef = useRef<HTMLInputElement>(null)

  const [name, setName] = useState('')
  const [category, setCategory] = useState<string>('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [comparePrice, setComparePrice] = useState('')
  const [stock, setStock] = useState('')
  const [stockUnit, setStockUnit] = useState('pcs')
  const [minStock, setMinStock] = useState('5')
  const [active, setActive] = useState(true)
  const [featured, setFeatured] = useState(false)
  const [photo, setPhoto] = useState<string | null>(null)
  const [extraPhotos, setExtraPhotos] = useState<string[]>([])
  const [errors, setErrors] = useState<FormErrors>({})
  const [lastSaved] = useState(formatClock)

  const priceNumber = Number(onlyDigits(price))
  const comparePriceNumber = Number(onlyDigits(comparePrice))
  const stockNumber = Number(stock || 0)
  const minStockNumber = Number(minStock || 0)
  const discountActive = comparePriceNumber > priceNumber && priceNumber > 0

  const checklist = useMemo(
    () => [
      {
        label: 'Nama dan kategori produk valid',
        done: name.trim().length >= 3 && Boolean(category),
      },
      {
        label: 'Harga jual telah ditentukan secara akurat',
        done: priceNumber > 0,
      },
      {
        label: 'Stok awal berada di atas batas minimum',
        done: stock !== '' && stockNumber > minStockNumber,
      },
      {
        label: 'Foto produk utama beresolusi tajam',
        done: Boolean(photo),
      },
    ],
    [category, minStockNumber, name, photo, priceNumber, stock, stockNumber],
  )
  const completeness = Math.round(
    (checklist.filter((item) => item.done).length / checklist.length) * 100,
  )

  if (!session) {
    return <Navigate to="/" replace />
  }

  function readPhoto(event: ChangeEvent<HTMLInputElement>, onLoad: (value: string) => void) {
    const file = event.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => onLoad(String(reader.result))
    reader.readAsDataURL(file)
    event.target.value = ''
  }

  function validate(publish: boolean) {
    const nextErrors: FormErrors = {}

    if (name.trim().length < 3 || name.trim().length > 100) {
      nextErrors.name = 'Nama produk harus 3–100 karakter.'
    }
    if (publish && !category) nextErrors.category = 'Pilih kategori produk terlebih dahulu.'
    if (description.length > maxDescription) {
      nextErrors.description = `Deskripsi maksimal ${maxDescription} karakter.`
    }
    if (!price || priceNumber <= 0) nextErrors.price = 'Harga jual harus lebih dari Rp0.'
    if (comparePrice && comparePriceNumber <= priceNumber) {
      nextErrors.comparePrice = 'Harga coret harus lebih tinggi dari harga jual.'
    }
    if (!publish && stock === '') {
      nextErrors.stock = 'Isi stok awal atau biarkan 0.'
    }
    if (stockNumber < 0) nextErrors.stock = 'Stok awal tidak boleh negatif.'
    if (minStock === '' || minStockNumber < 0) {
      nextErrors.minStock = 'Batas minimum stok tidak boleh negatif.'
    }

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  function save(publish: boolean) {
    if (!validate(publish)) return

    const product: OwnerProduct = {
      id: `prd-${Date.now()}`,
      name: name.trim(),
      sku: `${getInitials(name)}-${String(Date.now()).slice(-6)}`,
      category: category || productCategories[0],
      price: priceNumber,
      detail: `per ${stockUnit}`,
      stock: stockNumber,
      stockUnit,
      minStock: minStockNumber,
      sold: 0,
      soldUnit: stockUnit,
      soldPeriod: 'belum ada',
      etalase: publish && active ? 'aktif' : 'nonaktif',
      description: description.trim() || undefined,
      favorite: featured || undefined,
    }

    addOwnerProduct(product)
    navigate('/owner/produk')
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    save(true)
  }

  function clearError(field: keyof FormErrors) {
    setErrors((current) => ({ ...current, [field]: undefined }))
  }

  const inputBase =
    'h-11 w-full rounded-xl border bg-[#f7f9fc] px-3.5 text-[12px] text-ink outline-none transition placeholder:text-slate-400 focus:bg-white focus:ring-4'

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500">
            <Link to="/owner/dashboard" className="transition hover:text-primary">
              Ratis Bisnis
            </Link>
            <span className="text-slate-300">/</span>
            <Link to="/owner/produk" className="transition hover:text-primary">
              Produk &amp; Stok
            </Link>
            <span className="text-slate-300">/</span>
            <span className="font-semibold text-ink">Tambah Produk Baru</span>
          </p>
          <h1 className="mt-2 text-[26px] font-extrabold tracking-tight text-ink sm:text-[28px]">
            Tambah Produk Baru
          </h1>
          <p className="mt-1 max-w-[560px] text-[13px] leading-relaxed text-slate-500">
            Tambahkan produk kuliner atau barang dagangan Anda ke katalog toko{' '}
            {session.storeName}. Lengkapi informasi agar menarik minat pelanggan.
          </p>
        </div>

        <Link
          to="/owner/produk"
          className="inline-flex items-center gap-1.5 text-[11.5px] font-semibold text-primary transition hover:text-primary-hover"
        >
          <ArrowLeft className="size-4" />
          Kembali ke Katalog Produk
        </Link>
      </div>

      <form onSubmit={handleSubmit} noValidate className="mt-5">
        <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_336px]">
          <div className="space-y-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
              <button
                type="button"
                onClick={() => navigate('/owner/produk')}
                className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border border-line bg-white px-4 text-[11.5px] font-semibold text-slate-700 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition hover:bg-slate-50"
              >
                <X className="size-4 text-slate-500" />
                Batal
              </button>
              <button
                type="submit"
                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#0b3b3a] px-4 text-[11.5px] font-semibold text-white shadow-sm transition hover:bg-primary-hover"
              >
                <Upload className="size-4" />
                Simpan &amp; Publikasikan
              </button>
            </div>

            <section className="rounded-2xl border border-line bg-white shadow-[0_1px_2px_rgba(15,23,42,0.06)]">
              <CardHeader
                icon={<ClipboardList className="size-[18px]" />}
                title="Informasi Utama Produk"
                subtitle="Detail pengenal produk untuk pencarian di katalog"
                badge={
                  <span className="inline-flex w-fit items-center rounded-full bg-[#d9f7ea] px-2.5 py-1 text-[10px] font-semibold text-primary">
                    Wajib Diisi
                  </span>
                }
              />

              <div className="space-y-4 p-5">
                <label className="block">
                  <Label required>Nama Produk</Label>
                  <input
                    type="text"
                    value={name}
                    maxLength={100}
                    onChange={(event) => {
                      setName(event.target.value)
                      clearError('name')
                    }}
                    placeholder="Contoh: Kue Lapis Legit Prune Wisman Spesial"
                    className={`${inputBase} mt-1.5 ${
                      errors.name
                        ? 'border-red-300 focus:border-red-400 focus:ring-red-100'
                        : 'border-line focus:border-primary focus:ring-primary/10'
                    }`}
                  />
                  <span className="mt-1.5 flex items-start gap-1.5 text-[10px] leading-relaxed text-slate-500">
                    <Info className="mt-0.5 size-3 shrink-0 text-slate-400" />
                    {errors.name ?? 'Nama yang jelas dan spesifik memudahkan pembeli menemukan produk di pencarian.'}
                  </span>
                </label>

                <label className="block">
                  <Label required>Kategori Produk</Label>
                  <span className="relative mt-1.5 block">
                    <select
                      value={category}
                      onChange={(event) => {
                        setCategory(event.target.value)
                        clearError('category')
                      }}
                      className={`${inputBase} appearance-none pr-10 ${
                        errors.category
                          ? 'border-red-300 focus:border-red-400 focus:ring-red-100'
                          : 'border-line focus:border-primary focus:ring-primary/10'
                      } ${category ? 'text-ink' : 'text-slate-400'}`}
                    >
                      <option value="">Pilih kategori produk</option>
                      {productCategories.map((item) => (
                        <option key={item} value={item}>
                          {item}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                  </span>
                  <span className="mt-1.5 block text-[10px] leading-relaxed text-slate-500">
                    {errors.category ??
                      'Pilih rumpun etalase yang paling tepat agar pembeli mudah menemukan menu.'}
                  </span>
                </label>

                <label className="block">
                  <div className="flex items-center justify-between gap-2">
                    <Label optional>Deskripsi Produk</Label>
                    <span className="text-[10px] font-medium text-slate-500">
                      {description.length}/{maxDescription} karakter
                    </span>
                  </div>
                  <textarea
                    value={description}
                    rows={5}
                    maxLength={maxDescription}
                    onChange={(event) => {
                      setDescription(event.target.value)
                      clearError('description')
                    }}
                    placeholder="Dibuat segar dengan 100% Mentega Wisman murni dan lapisan buah prune premium pilihan. Memiliki tekstur super lembut, kaya rempah speok harum, dan rasa manis legit yang pas. Ukuran loyang 20x20 cm. Tahan 5 hari pada suhu ruang atau 3 minggu di dalam lemari pendingin."
                    className={`mt-1.5 w-full resize-none rounded-xl border bg-[#f7f9fc] px-3.5 py-3 text-[12px] leading-relaxed text-ink outline-none transition placeholder:text-slate-400 focus:bg-white focus:ring-4 ${
                      errors.description
                        ? 'border-red-300 focus:border-red-400 focus:ring-red-100'
                        : 'border-line focus:border-primary focus:ring-primary/10'
                    }`}
                  />
                  <span className="mt-1.5 block text-[10px] leading-relaxed text-slate-500">
                    {errors.description ??
                      'Jelaskan detail bahan, ukuran/loyang, daya tahan simpan, dan saran penyajian. Maksimal 500 karakter'}
                  </span>
                </label>
              </div>
            </section>

            <section className="rounded-2xl border border-line bg-white shadow-[0_1px_2px_rgba(15,23,42,0.06)]">
              <CardHeader
                icon={<ImageIcon className="size-[18px]" />}
                title="Harga &amp; Pengaturan Stok"
                subtitle="Atur skema penetapan nominal jual dan persediaan inventaris gudang"
              />

              <div className="space-y-4 p-5">
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block">
                    <Label required>Harga Jual</Label>
                    <span
                      className={`mt-1.5 flex h-11 items-center gap-1 rounded-xl border bg-[#f7f9fc] px-3.5 transition focus-within:bg-white focus-within:ring-4 ${
                        errors.price
                          ? 'border-red-300 focus-within:border-red-400 focus-within:ring-red-100'
                          : 'border-line focus-within:border-primary focus-within:ring-primary/10'
                      }`}
                    >
                      <span className="text-[12px] font-semibold text-slate-500">Rp</span>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={formatThousands(price)}
                        onChange={(event) => {
                          setPrice(onlyDigits(event.target.value))
                          clearError('price')
                        }}
                        placeholder="150.000"
                        className="h-full w-full bg-transparent text-[12px] text-ink outline-none placeholder:text-slate-400"
                      />
                    </span>
                    <span
                      className={`mt-1.5 block text-[10px] ${
                        errors.price ? 'text-red-600' : 'text-slate-500'
                      }`}
                    >
                      {errors.price ?? 'Nominal yang dibayarkan pelanggan per satuan.'}
                    </span>
                  </label>

                  <label className="block">
                    <span className="flex flex-wrap items-center justify-between gap-2">
                      <Label optional>Harga Coret / Asli</Label>
                      {discountActive && (
                        <span className="inline-flex items-center rounded-full bg-[#d9f7ea] px-2 py-0.5 text-[9.5px] font-semibold text-primary">
                          Diskon Aktif
                        </span>
                      )}
                    </span>
                    <span
                      className={`mt-1.5 flex h-11 items-center gap-1 rounded-xl border bg-[#f7f9fc] px-3.5 transition focus-within:bg-white focus-within:ring-4 ${
                        errors.comparePrice
                          ? 'border-red-300 focus-within:border-red-400 focus-within:ring-red-100'
                          : 'border-line focus-within:border-primary focus-within:ring-primary/10'
                      }`}
                    >
                      <span className="text-[12px] font-semibold text-slate-500">Rp</span>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={formatThousands(comparePrice)}
                        onChange={(event) => {
                          setComparePrice(onlyDigits(event.target.value))
                          clearError('comparePrice')
                        }}
                        placeholder="175.000"
                        className="h-full w-full bg-transparent text-[12px] text-ink outline-none placeholder:text-slate-400"
                      />
                    </span>
                    <span
                      className={`mt-1.5 block text-[10px] ${
                        errors.comparePrice ? 'text-red-600' : 'text-slate-500'
                      }`}
                    >
                      {errors.comparePrice ??
                        'Kosongkan bila produk tidak sedang berdiskon.'}
                    </span>
                  </label>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block">
                    <Label required>Stok Awal Tersedia</Label>
                    <span className="mt-1.5 flex gap-2">
                      <input
                        type="number"
                        inputMode="numeric"
                        min={0}
                        value={stock}
                        onChange={(event) => {
                          setStock(event.target.value)
                          clearError('stock')
                        }}
                        placeholder="0"
                        className={`${inputBase} ${
                          errors.stock
                            ? 'border-red-300 focus:border-red-400 focus:ring-red-100'
                            : 'border-line focus:border-primary focus:ring-primary/10'
                        }`}
                      />
                      <span className="relative w-28 shrink-0">
                        <select
                          value={stockUnit}
                          onChange={(event) => setStockUnit(event.target.value)}
                          aria-label="Satuan stok"
                          className={`${inputBase} appearance-none pr-8`}
                        >
                          {stockUnits.map((unit) => (
                            <option key={unit} value={unit}>
                              {unit}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                      </span>
                    </span>
                    <span
                      className={`mt-1.5 block text-[10px] ${
                        errors.stock ? 'text-red-600' : 'text-slate-500'
                      }`}
                    >
                      {errors.stock ?? 'Jumlah stok fisik yang langsung siap dipesan saat ini.'}
                    </span>
                  </label>

                  <label className="block">
                    <Label required>Batas Minimum Stok (Peringatan)</Label>
                    <span className="mt-1.5 flex gap-2">
                      <input
                        type="number"
                        inputMode="numeric"
                        min={0}
                        value={minStock}
                        onChange={(event) => {
                          setMinStock(event.target.value)
                          clearError('minStock')
                        }}
                        placeholder="5"
                        className={`${inputBase} ${
                          errors.minStock
                            ? 'border-red-300 focus:border-red-400 focus:ring-red-100'
                            : 'border-line focus:border-primary focus:ring-primary/10'
                        }`}
                      />
                      <span className="flex w-28 shrink-0 items-center justify-center rounded-xl border border-line bg-[#f1f5f9] text-[11.5px] font-medium text-slate-500">
                        Unit
                      </span>
                    </span>
                    <span
                      className={`mt-1.5 block text-[10px] ${
                        errors.minStock ? 'text-red-600' : 'text-slate-500'
                      }`}
                    >
                      {errors.minStock ??
                        'Sistem otomatis memberi notifikasi restock saat stok tersisa di angka ini.'}
                    </span>
                  </label>
                </div>

                <div className="flex items-start gap-2.5 rounded-xl border border-[#e2e8f0] bg-[#f4f7fb] p-3.5">
                  <Info className="mt-0.5 size-4 shrink-0 text-primary" />
                  <p className="text-[10.5px] leading-relaxed text-slate-600">
                    <span className="font-semibold text-ink">Pengingat Otomatisasi Ratis:</span>{' '}
                    Stok akan terpotong otomatis jika pembeli menyelesaikan pembayaran pesanan, dan
                    otomatis dikembalikan ke inventaris jika pesanan dibatalkan.
                  </p>
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-line bg-white shadow-[0_1px_2px_rgba(15,23,42,0.06)]">
              <CardHeader
                icon={<Camera className="size-[18px]" />}
                title="Foto &amp; Media Produk"
                subtitle="Tampilan foto hidangan yang menarik selalu meningkatkan konversi pesanan"
                badge={
                  <span className="w-fit rounded-full bg-[#f1f5f9] px-2.5 py-1 text-[10px] font-semibold text-slate-500">
                    {1 + extraPhotos.length}/{maxPhotos} Terunggah
                  </span>
                }
              />

              <div className="p-5">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={(event) => readPhoto(event, (value) => setPhoto(value))}
                />
                <input
                  ref={extraInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={(event) =>
                    readPhoto(event, (value) =>
                      setExtraPhotos((current) =>
                        current.length >= maxPhotos - 1 ? current : [...current, value],
                      ),
                    )
                  }
                />

                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="relative aspect-square overflow-hidden rounded-xl border border-line bg-[#f1f5f9]">
                    {photo ? (
                      <>
                        <img
                          src={photo}
                          alt="Foto utama produk"
                          className="size-full object-cover"
                        />
                        <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-[#0b3b3a]/90 px-2 py-0.5 text-[9px] font-semibold text-white">
                          <Star className="size-2.5 fill-white" />
                          Foto Utama
                        </span>
                        <button
                          type="button"
                          onClick={() => setPhoto(null)}
                          aria-label="Hapus foto utama"
                          className="absolute right-2 top-2 flex size-6 items-center justify-center rounded-full bg-white/90 text-slate-600 shadow-sm transition hover:bg-white"
                        >
                          <X className="size-3.5" />
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="flex size-full flex-col items-center justify-center gap-2 bg-[#f4f7fb] p-4 text-center transition hover:bg-[#eaf7f4]"
                      >
                        <span className="flex size-10 items-center justify-center rounded-full bg-white text-primary shadow-sm">
                          <Camera className="size-5" />
                        </span>
                        <span className="text-[11px] font-semibold text-ink">
                          Unggah Foto Utama
                        </span>
                        <span className="text-[9.5px] leading-relaxed text-slate-500">
                          Tampak depan produk, pencahayaan terang
                        </span>
                      </button>
                    )}
                  </div>

                  {extraPhotos.map((source, index) => (
                    <div
                      key={`${source.slice(0, 24)}-${index}`}
                      className="relative aspect-square overflow-hidden rounded-xl border border-line bg-[#f1f5f9]"
                    >
                      <img
                        src={source}
                        alt={`Foto tambahan ${index + 1}`}
                        className="size-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setExtraPhotos((current) =>
                            current.filter((_, itemIndex) => itemIndex !== index),
                          )
                        }
                        aria-label={`Hapus foto tambahan ${index + 1}`}
                        className="absolute right-2 top-2 flex size-6 items-center justify-center rounded-full bg-white/90 text-slate-600 shadow-sm transition hover:bg-white"
                      >
                        <X className="size-3.5" />
                      </button>
                    </div>
                  ))}

                  {extraPhotos.length < maxPhotos - 1 && (
                    <button
                      type="button"
                      onClick={() => extraInputRef.current?.click()}
                      className="flex aspect-square flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-[#cfd8e3] bg-[#f7f9fc] p-4 text-center transition hover:border-primary/40 hover:bg-[#eaf7f4]"
                    >
                      <span className="flex size-10 items-center justify-center rounded-full bg-white text-slate-500 shadow-sm">
                        <ImageIcon className="size-5" />
                      </span>
                      <span className="text-[11px] font-semibold text-ink">
                        Tambah Foto Tambahan
                      </span>
                      <span className="text-[9.5px] leading-relaxed text-slate-500">
                        Sudut kemasan atau potongan
                      </span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => extraInputRef.current?.click()}
                    className="flex aspect-square flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-[#cfd8e3] bg-[#f7f9fc] p-4 text-center transition hover:border-primary/40 hover:bg-[#eaf7f4]"
                  >
                    <span className="flex size-10 items-center justify-center rounded-full bg-white text-slate-500 shadow-sm">
                      <ClipboardList className="size-5" />
                    </span>
                    <span className="text-[11px] font-semibold text-ink">
                      Foto Varian / Detail
                    </span>
                    <span className="text-[9.5px] leading-relaxed text-slate-500">
                      Opsional (Maks 2MB)
                    </span>
                  </button>
                </div>

                <div className="mt-4 space-y-1.5 text-[10px] text-slate-500">
                  <p className="flex items-center gap-1.5">
                    <Info className="size-3 shrink-0 text-slate-400" />
                    Format didukung: JPG, PNG, atau WebP (Maksimum 2 MB)
                  </p>
                  <p className="flex items-center gap-1.5">
                    <ImageIcon className="size-3 shrink-0 text-slate-400" />
                    Rasio persegi 1:1 direkomendasikan untuk tampilan terbaik
                  </p>
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-line bg-white shadow-[0_1px_2px_rgba(15,23,42,0.06)]">
              <CardHeader
                icon={<Eye className="size-[18px]" />}
                title="Status &amp; Visibilitas Produk"
                subtitle="Tentukan apakah produk ini langsung dapat dibeli pelanggan"
              />

              <div className="space-y-3 p-5">
                <div className="flex flex-col gap-3 rounded-xl border border-line bg-[#f7f9fc] p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="flex flex-wrap items-center gap-2 text-[12px] font-bold text-ink">
                      Aktifkan di Storefront / Katalog Publik
                      <span className="rounded-full bg-[#d9f7ea] px-2 py-0.5 text-[9.5px] font-semibold text-primary">
                        {active ? 'Aktif Sekarang' : 'Nonaktif'}
                      </span>
                    </p>
                    <p className="mt-1 max-w-[420px] text-[10.5px] leading-relaxed text-slate-500">
                      Jika dinonaktifkan, produk hanya tersimpan sebagai draft internal dan tidak
                      dapat ditemukan atau dipesan oleh pelanggan.
                    </p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={active}
                    aria-label="Aktifkan produk di storefront"
                    onClick={() => setActive((current) => !current)}
                    className={`relative h-6 w-11 shrink-0 rounded-full transition ${
                      active ? 'bg-primary' : 'bg-slate-300'
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 size-5 rounded-full bg-white shadow-sm transition ${
                        active ? 'left-[22px]' : 'left-0.5'
                      }`}
                    />
                  </button>
                </div>

                <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-line bg-[#f7f9fc] p-4">
                  <input
                    type="checkbox"
                    checked={featured}
                    onChange={(event) => setFeatured(event.target.checked)}
                    className="mt-0.5 size-4 shrink-0 rounded border-slate-300 accent-[#0f766e]"
                  />
                  <span className="min-w-0">
                    <span className="block text-[12px] font-bold text-ink">
                      Tandai sebagai Produk Unggulan / Rekomendasi Toko
                    </span>
                    <span className="mt-1 block text-[10.5px] leading-relaxed text-slate-500">
                      Produk ini akan ditampilkan di baris paling atas halaman muka toko dengan
                      badge rekomendasi khusus.
                    </span>
                  </span>
                </label>
              </div>
            </section>
          </div>

          <aside className="space-y-4 xl:sticky xl:top-[92px]">
            <section className="rounded-2xl border border-line bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.06)]">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2">
                  <Smartphone className="mt-0.5 size-4 shrink-0 text-slate-500" />
                  <div>
                    <h2 className="text-[12.5px] font-extrabold tracking-tight text-ink">
                      Pratinjau Toko Pembeli
                    </h2>
                    <p className="mt-0.5 text-[10px] text-slate-500">Simulasi Live</p>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1 rounded-full bg-[#d9f7ea] px-2 py-0.5 text-[9px] font-semibold text-primary">
                  <span className="size-1.5 rounded-full bg-primary" />
                  Live
                </span>
              </div>

              <div className="mt-4 rounded-2xl border border-line bg-[#f8fafc] p-2.5">
                <div className="rounded-xl bg-white p-2.5 shadow-sm">
                  <div className="flex items-center justify-between gap-2 border-b border-[#eef2f6] pb-2">
                    <div className="flex items-center gap-1.5">
                      <span className="flex size-6 items-center justify-center rounded-full bg-[#0b3b3a] text-[9px] font-bold text-white">
                        {getInitials(session.storeName) || 'R'}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-[9px] font-bold text-ink">
                          {session.storeName}
                        </p>
                        <p className="flex items-center gap-0.5 text-[8px] text-slate-500">
                          <Star className="size-2 fill-[#f0a52b] text-[#f0a52b]" />
                          5.0 (Baru)
                        </p>
                      </div>
                    </div>
                    <span className="rounded-full bg-primary px-1.5 py-0.5 text-[7px] font-bold text-white">
                      Buka
                    </span>
                  </div>

                  <div className="mt-2 overflow-hidden rounded-lg border border-line">
                    {photo ? (
                      <img src={photo} alt="Pratinjau foto produk" className="aspect-square w-full object-cover" />
                    ) : (
                      <div className="flex aspect-square w-full flex-col items-center justify-center gap-1 bg-[#f1f5f9] text-slate-400">
                        <ImageIcon className="size-6" />
                        <span className="text-[8px]">Foto produk 1:1</span>
                      </div>
                    )}
                  </div>

                  <p className="mt-2 line-clamp-2 text-[10px] font-bold leading-snug text-ink">
                    {name.trim() || 'Nama Produk Anda'}
                  </p>
                  <p className="mt-0.5 text-[8.5px] text-slate-500">
                    {category || 'Kategori produk'}
                  </p>
                  <p className="mt-1 flex flex-wrap items-baseline gap-1">
                    <span className="text-[12px] font-extrabold text-ink">
                      {priceNumber > 0 ? formatRupiah(priceNumber) : 'Rp0'}
                    </span>
                    {discountActive && (
                      <span className="text-[9px] font-medium text-slate-400 line-through">
                        {formatRupiah(comparePriceNumber)}
                      </span>
                    )}
                  </p>
                  <p className="mt-1 flex items-center gap-1 text-[8.5px] text-slate-500">
                    <span
                      className={`size-1.5 rounded-full ${
                        stockNumber > 0 ? 'bg-primary' : 'bg-[#dc2626]'
                      }`}
                    />
                    {stockNumber > 0
                      ? `Stok Tersedia: ${stockNumber} ${stockUnit}`
                      : 'Stok Habis'}
                  </p>
                  <div className="mt-2 flex h-7 items-center justify-center gap-1 rounded-lg bg-[#cfe8e3] text-[9px] font-semibold text-primary">
                    <ShoppingCart className="size-3" />
                    Tambah ke Keranjang
                  </div>
                </div>
              </div>

              <p className="mt-3 text-[9.5px] leading-relaxed text-slate-500">
                Pratinjau tampilan kartu di smartphone pembeli atau POS kasir Ratis.
              </p>
            </section>

            <section className="rounded-2xl border border-line bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.06)]">
              <div className="flex items-start justify-between gap-2">
                <h2 className="text-[12.5px] font-extrabold tracking-tight text-ink">
                  Kelengkapan Data Produk
                </h2>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                    completeness === 100
                      ? 'bg-[#d9f7ea] text-primary'
                      : 'bg-[#fdf0d3] text-[#b45309]'
                  }`}
                >
                  {completeness}%
                </span>
              </div>
              <p className="text-[10px] text-slate-500">
                {completeness === 100 ? 'Siap' : 'Lengkapi data'}
              </p>

              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-[#eef2f6]">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${completeness}%` }}
                />
              </div>

              <ul className="mt-3 space-y-2">
                {checklist.map((item) => (
                  <li key={item.label} className="flex items-start gap-2 text-[10.5px]">
                    <span
                      className={`mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full ${
                        item.done
                          ? 'bg-[#d9f7ea] text-primary'
                          : 'border border-slate-200 text-slate-300'
                      }`}
                    >
                      <Check className="size-2.5" />
                    </span>
                    <span className={item.done ? 'text-slate-600' : 'text-slate-400'}>
                      {item.label}
                    </span>
                  </li>
                ))}
              </ul>
            </section>

            <section className="rounded-2xl border border-line bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.06)]">
              <div className="flex items-center gap-2">
                <Lightbulb className="size-4 text-[#f0a52b]" />
                <h2 className="text-[12.5px] font-extrabold tracking-tight text-ink">
                  Tips Menjual di Ratis
                </h2>
              </div>
              <p className="mt-2 text-[10.5px] leading-relaxed text-slate-600">
                UMKM kuliner yang mencantumkan ukuran porsi/loyang/bod dan daya tahan simpan di
                deskripsi mencatatkan <span className="font-bold text-ink">32% lebih sedikit</span>{' '}
                pertanyaan pelanggan dan konversi checkout lebih cepat.
              </p>
              <Link
                to="/owner/bantuan"
                className="mt-3 inline-flex items-center gap-1 text-[10.5px] font-semibold text-primary transition hover:text-primary-hover"
              >
                Baca panduan foto menu
                <ArrowUpRight className="size-3.5" />
              </Link>
            </section>
          </aside>
        </div>

        <div className="sticky bottom-20 z-20 mt-4 rounded-2xl border border-line bg-white/95 p-3.5 shadow-[0_8px_24px_rgba(15,23,42,0.12)] backdrop-blur lg:bottom-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-2">
              <Sparkles className="mt-0.5 size-4 shrink-0 text-primary" />
              <div>
                <p className="text-[10.5px] font-semibold text-ink">
                  Semua perubahan tersimpan otomatis sebagai draft lokal
                </p>
                <p className="mt-0.5 text-[9.5px] text-slate-500">
                  Terakhir pukul {lastSaved} WIB
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <button
                type="button"
                onClick={() => save(false)}
                className="inline-flex h-10 items-center justify-center rounded-xl border border-line bg-white px-4 text-[11.5px] font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Simpan sebagai Draft
              </button>
              <button
                type="submit"
                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#0b3b3a] px-4 text-[11.5px] font-semibold text-white shadow-sm transition hover:bg-primary-hover"
              >
                Terbitkan Produk Sekarang
                <ArrowUpRight className="size-4" />
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}
