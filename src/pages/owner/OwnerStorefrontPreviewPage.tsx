import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import {
  ArrowRight,
  ArrowUpRight,
  AtSign,
  Ban,
  Cake,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Cookie,
  Copy,
  ExternalLink,
  Lock,
  MapPin,
  MessageCircle,
  Monitor,
  MoreVertical,
  Package,
  QrCode,
  RefreshCw,
  Search,
  Share2,
  ShieldCheck,
  ShoppingCart,
  SlidersHorizontal,
  Smartphone,
  Soup,
  Star,
  Store,
  TrendingUp,
  XCircle,
  type LucideIcon,
} from 'lucide-react'
import { getOwnerSession, type OwnerStoreStatus } from '../../lib/owner-auth'
import { ownerStatusMeta } from '../../lib/owner-dashboard-data'
import {
  storefrontCategories,
  storefrontProducts,
  type StorefrontCategoryId,
  type StorefrontProduct,
  type StorefrontVisual,
} from '../../lib/owner-storefront-data'

type DeviceMode = 'desktop' | 'mobile'
type SortMode = 'popular' | 'price-asc' | 'price-desc'

type StorefrontSettings = {
  showOutOfStock: boolean
  showReviews: boolean
  showWhatsApp: boolean
}

type Toast = {
  message: string
  tone: 'success' | 'info' | 'danger'
}

const sortOptions: { value: SortMode; label: string }[] = [
  { value: 'popular', label: 'Paling Populer' },
  { value: 'price-asc', label: 'Harga Terendah' },
  { value: 'price-desc', label: 'Harga Tertinggi' },
]

const settingsRows: {
  key: keyof StorefrontSettings
  title: string
  description: string
}[] = [
  {
    key: 'showOutOfStock',
    title: 'Tampilkan Produk Stok Habis',
    description: 'Tetap tampilkan item sold-out dengan label penanda',
  },
  {
    key: 'showReviews',
    title: 'Bintang & Ulasan Pelanggan',
    description: 'Tampilkan rating rata-rata di bagian header',
  },
  {
    key: 'showWhatsApp',
    title: 'Tombol WhatsApp Langsung',
    description: 'Memudahkan pembeli memesan langsung',
  },
]

const productVisuals: Record<
  StorefrontVisual,
  { icon: LucideIcon; className: string; accentClassName: string }
> = {
  cake: {
    icon: Cake,
    className: 'from-[#f8e5c0] via-[#efd19d] to-[#d8a766] text-[#7c4a1a]',
    accentClassName: 'bg-[#fff5df]/70',
  },
  cookie: {
    icon: Cookie,
    className: 'from-[#f7ebd7] via-[#ecd6b5] to-[#d3ac7d] text-[#7a5024]',
    accentClassName: 'bg-[#fff8ea]/70',
  },
  soup: {
    icon: Soup,
    className: 'from-[#f9d9b9] via-[#eebd8d] to-[#d1925e] text-[#874716]',
    accentClassName: 'bg-[#fff0e1]/70',
  },
  package: {
    icon: Package,
    className: 'from-[#ece0d3] via-[#dcc6ad] to-[#b99a78] text-[#5b4128]',
    accentClassName: 'bg-[#fbf3ea]/70',
  },
}

const storeStatusLabels: Record<OwnerStoreStatus, string> = {
  aktif: 'Toko Aktif Online',
  pending: 'Menunggu Verifikasi',
  ditolak: 'Pengajuan Ditolak',
  nonaktif: 'Toko Nonaktif',
}

const visitorValues = [6, 10, 8, 14, 12, 20, 18, 24, 22, 28, 31, 34]
const visitorMax = Math.max(...visitorValues)
const visitorLine = visitorValues
  .map((value, index) => {
    const x = (index / (visitorValues.length - 1)) * 100
    const y = 34 - (value / visitorMax) * 28
    return `${index === 0 ? 'M' : 'L'} ${x} ${y}`
  })
  .join(' ')
const visitorArea = `${visitorLine} L 100 34 L 0 34 Z`

function formatRupiah(value: number) {
  return `Rp ${new Intl.NumberFormat('id-ID').format(value)}`
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function SettingToggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean
  onChange: () => void
  label: string
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={onChange}
      className={`relative h-[22px] w-10 shrink-0 rounded-full transition-colors ${
        checked ? 'bg-primary' : 'bg-slate-200'
      }`}
    >
      <span
        className={`absolute top-[3px] size-4 rounded-full bg-white shadow-sm transition-transform ${
          checked ? 'translate-x-[21px]' : 'translate-x-[3px]'
        }`}
      />
    </button>
  )
}

function StorefrontCover() {
  return (
    <div className="relative h-[220px] overflow-hidden sm:h-[270px]">
      <svg
        viewBox="0 0 960 290"
        preserveAspectRatio="xMidYMid slice"
        className="absolute inset-0 h-full w-full"
        aria-hidden
      >
        <defs>
          <linearGradient id="sfWall" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#3c2316" />
            <stop offset="0.48" stopColor="#925a34" />
            <stop offset="1" stopColor="#d29a63" />
          </linearGradient>
          <linearGradient id="sfWindow" x1="0" y1="0" x2="0" y2="1">
            <stop stopColor="#fff4d6" stopOpacity="0.95" />
            <stop offset="1" stopColor="#eec47f" stopOpacity="0.28" />
          </linearGradient>
          <radialGradient id="sfLight" cx="50%" cy="50%" r="50%">
            <stop stopColor="#ffedc2" stopOpacity="0.8" />
            <stop offset="1" stopColor="#ffedc2" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="sfTable" x1="0" y1="0" x2="0" y2="1">
            <stop stopColor="#4a2e1d" />
            <stop offset="1" stopColor="#28160e" />
          </linearGradient>
        </defs>
        <rect width="960" height="290" fill="url(#sfWall)" />
        <circle cx="760" cy="50" r="240" fill="url(#sfLight)" />
        <circle cx="180" cy="50" r="170" fill="url(#sfLight)" opacity="0.35" />
        <rect
          x="620"
          y="10"
          width="270"
          height="190"
          rx="14"
          fill="url(#sfWindow)"
          opacity="0.32"
        />
        <line x1="755" y1="10" x2="755" y2="200" stroke="#3b2417" strokeWidth="8" opacity="0.5" />
        <line x1="620" y1="105" x2="890" y2="105" stroke="#3b2417" strokeWidth="8" opacity="0.5" />
        <rect x="0" y="218" width="960" height="72" fill="url(#sfTable)" />
        <rect x="0" y="212" width="960" height="8" fill="#6f472c" />
        <rect x="30" y="147" width="290" height="9" rx="3" fill="#3b2417" />
        <g opacity="0.9">
          <rect x="58" y="103" width="34" height="44" rx="6" fill="#d7b27a" />
          <rect x="64" y="94" width="22" height="10" rx="3" fill="#8a5a34" />
          <rect x="110" y="96" width="28" height="51" rx="6" fill="#e5c494" />
          <rect x="153" y="108" width="38" height="39" rx="6" fill="#b98756" />
          <circle cx="242" cy="124" r="22" fill="#d9ad73" />
          <circle cx="242" cy="124" r="14" fill="#f0d6a4" />
        </g>
        <g>
          <ellipse cx="420" cy="231" rx="128" ry="15" fill="#1b100b" opacity="0.35" />
          <rect x="410" y="205" width="20" height="24" fill="#d6c2a7" />
          <ellipse cx="420" cy="205" rx="110" ry="20" fill="#f1e3cb" />
          <ellipse cx="420" cy="198" rx="86" ry="14" fill="#caa06a" />
          <path d="M334 198 Q420 118 506 198 Z" fill="#e0a85e" />
          <path d="M354 190 Q420 134 486 190 Z" fill="#f3d59d" />
          <circle cx="420" cy="142" r="10" fill="#b91c1c" />
          <path d="M420 132 q8 -15 0 -24" stroke="#5b7c3a" strokeWidth="4" fill="none" />
          <circle cx="438" cy="162" r="5" fill="#7c2d12" opacity="0.6" />
          <circle cx="396" cy="168" r="4" fill="#7c2d12" opacity="0.5" />
        </g>
        <g>
          <ellipse cx="700" cy="238" rx="116" ry="13" fill="#1b100b" opacity="0.35" />
          <path d="M600 208 h200 l-22 40 h-156 z" fill="#ac7a4c" />
          <ellipse cx="700" cy="208" rx="100" ry="20" fill="#d8ad77" />
          <ellipse cx="660" cy="198" rx="37" ry="17" fill="#e9bd7f" />
          <ellipse cx="714" cy="195" rx="41" ry="19" fill="#f0c98d" />
          <ellipse cx="768" cy="200" rx="28" ry="14" fill="#dcae73" />
        </g>
        <rect width="960" height="290" fill="#2b160d" opacity="0.06" />
      </svg>
      <div className="absolute inset-0 bg-gradient-to-t from-[#1b0f09]/55 via-transparent to-black/10" />
      <span className="absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-black/25 px-2.5 py-1 text-[9.5px] font-semibold text-white backdrop-blur-sm sm:right-4 sm:top-4">
        <ShieldCheck className="size-3.5" />
        Mitra Terverifikasi Ratis
      </span>
    </div>
  )
}

function StorefrontProductCard({ product }: { product: StorefrontProduct }) {
  const visual = productVisuals[product.visual]
  const Icon = visual.icon
  const isOutOfStock = product.stock === 0
  const isLowStock = product.stock > 0 && product.stock <= 5
  const discount = product.originalPrice
    ? Math.round((1 - product.price / product.originalPrice) * 100)
    : 0

  return (
    <article className="overflow-hidden rounded-xl border border-line bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
      <div
        className={`relative aspect-[4/3] overflow-hidden bg-gradient-to-br ${visual.className} ${
          isOutOfStock ? 'opacity-65' : ''
        }`}
      >
        <span
          aria-hidden
          className={`absolute -right-7 -top-7 size-24 rounded-full ${visual.accentClassName}`}
        />
        <span
          aria-hidden
          className="absolute -bottom-8 -left-5 size-20 rounded-full bg-white/20"
        />
        <Icon
          className="absolute left-1/2 top-1/2 size-12 -translate-x-1/2 -translate-y-1/2 drop-shadow-sm"
          strokeWidth={1.35}
        />
        <div className="absolute left-2 top-2 flex flex-col items-start gap-1">
          {discount > 0 && (
            <span className="rounded bg-[#dc2626] px-1.5 py-0.5 text-[9px] font-bold text-white shadow-sm">
              -{discount}%
            </span>
          )}
          {isOutOfStock ? (
            <span className="rounded bg-[#dc2626] px-1.5 py-0.5 text-[9px] font-bold text-white shadow-sm">
              Stok Habis
            </span>
          ) : isLowStock ? (
            <span className="rounded bg-[#d97706] px-1.5 py-0.5 text-[9px] font-bold text-white shadow-sm">
              Stok Menipis
            </span>
          ) : null}
        </div>
      </div>

      <div className="p-2.5">
        <div className="flex items-center justify-between gap-1 text-[9px] text-slate-500">
          <span className="inline-flex items-center gap-0.5 font-semibold text-[#b45309]">
            <Star className="size-2.5 fill-current" />
            {product.rating}
          </span>
          <span>{product.sold} terjual</span>
        </div>
        <p className="mt-1 line-clamp-2 min-h-[30px] text-[11px] font-semibold leading-snug text-ink">
          {product.name}
        </p>
        <div className="mt-1.5 flex flex-wrap items-end gap-x-1.5 gap-y-0.5">
          <p className="text-[12px] font-extrabold text-ink">{formatRupiah(product.price)}</p>
          {product.originalPrice && (
            <p className="text-[9px] text-slate-400 line-through">
              {formatRupiah(product.originalPrice)}
            </p>
          )}
        </div>
        <p
          className={`mt-1 text-[9px] font-medium ${
            isOutOfStock
              ? 'text-red-600'
              : isLowStock
                ? 'text-amber-600'
                : 'text-slate-400'
          }`}
        >
          {isOutOfStock
            ? 'Stok habis'
            : `Sisa stok ${product.stock} ${product.unit}`}
        </p>
      </div>
    </article>
  )
}

export default function OwnerStorefrontPreviewPage() {
  const [session] = useState(getOwnerSession)
  const [device, setDevice] = useState<DeviceMode>('desktop')
  const [category, setCategory] = useState<StorefrontCategoryId>('semua')
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState<SortMode>('popular')
  const [settings, setSettings] = useState<StorefrontSettings>({
    showOutOfStock: true,
    showReviews: true,
    showWhatsApp: true,
  })
  const [toast, setToast] = useState<Toast | null>(null)

  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => setToast(null), 4000)
    return () => window.clearTimeout(timer)
  }, [toast])

  const visibleProducts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()

    return storefrontProducts
      .filter((product) => category === 'semua' || product.categoryId === category)
      .filter((product) => settings.showOutOfStock || product.stock > 0)
      .filter(
        (product) =>
          !normalizedQuery || product.name.toLowerCase().includes(normalizedQuery),
      )
      .sort((first, second) => {
        if (sort === 'price-asc') return first.price - second.price
        if (sort === 'price-desc') return second.price - first.price
        return second.sold - first.sold
      })
  }, [category, query, settings.showOutOfStock, sort])

  if (!session) {
    return <Navigate to="/" replace />
  }

  const isActive = session.storeStatus === 'aktif'
  const storeName = session.storeName
  const statusMeta = ownerStatusMeta[session.storeStatus]
  const slug = slugify(session.storeName) || 'toko-ratis'
  const publicUrl = `https://ratis.id/${slug}`
  const whatsappHandle = `@${slug.replace(/-/g, '')}`
  const totalProducts = storefrontProducts.length
  const readyProducts = storefrontProducts.filter((product) => product.stock > 0).length
  const outOfStockProducts = totalProducts - readyProducts
  const BannerIcon = isActive
    ? Store
    : session.storeStatus === 'pending'
      ? Clock3
      : session.storeStatus === 'ditolak'
        ? XCircle
        : Ban
  const StatusIcon = isActive
    ? CheckCircle2
    : session.storeStatus === 'pending'
      ? Clock3
      : session.storeStatus === 'ditolak'
        ? XCircle
        : Ban

  function showToast(message: string, tone: Toast['tone'] = 'success') {
    setToast({ message, tone })
  }

  function categoryCount(id: StorefrontCategoryId) {
    if (id === 'semua') return totalProducts
    return storefrontProducts.filter((product) => product.categoryId === id).length
  }

  function toggleSetting(key: keyof StorefrontSettings) {
    setSettings((current) => ({ ...current, [key]: !current[key] }))
  }

  async function handleCopyLink() {
    try {
      await navigator.clipboard.writeText(publicUrl)
      showToast('Tautan toko publik berhasil disalin.')
    } catch {
      showToast('Gagal menyalin tautan. Salin manual dari kolom tautan.', 'danger')
    }
  }

  function handleDownloadQr() {
    showToast('Fitur unduh QR kasir akan aktif setelah integrasi backend.', 'info')
  }

  function handleWhatsApp() {
    const message = `Cek storefront ${storeName}: ${publicUrl}`
    window.open(
      `https://wa.me/?text=${encodeURIComponent(message)}`,
      '_blank',
      'noopener,noreferrer',
    )
  }

  function handleOpenPublic() {
    if (!isActive) {
      showToast('Storefront publik baru aktif setelah toko disetujui admin.', 'info')
      return
    }

    window.open(publicUrl, '_blank', 'noopener,noreferrer')
  }

  function resetFilters() {
    setQuery('')
    setCategory('semua')
    setSettings((current) => ({ ...current, showOutOfStock: true }))
  }

  return (
    <div>
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-[26px] font-extrabold tracking-tight text-ink sm:text-[28px]">
              Pratinjau Storefront Toko
            </h1>
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10.5px] font-semibold ${statusMeta.badgeClassName}`}
            >
              <span className={`size-1.5 rounded-full ${statusMeta.dotClassName}`} />
              {storeStatusLabels[session.storeStatus]}
            </span>
          </div>
          <p className="mt-1.5 text-[13px] leading-relaxed text-slate-500">
            {isActive ? (
              <>
                Storefront publik sedang tayang dan dapat diakses pembeli di{' '}
                <span className="font-semibold text-slate-700">
                  {publicUrl.replace('https://', '')}
                </span>
                .
              </>
            ) : (
              'Pratinjau etalase toko Anda sebelum tayang untuk pelanggan.'
            )}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center rounded-xl border border-line bg-white p-1 shadow-sm">
            <button
              type="button"
              aria-pressed={device === 'desktop'}
              onClick={() => setDevice('desktop')}
              className={`inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-[10.5px] font-semibold transition ${
                device === 'desktop'
                  ? 'bg-slate-100 text-ink'
                  : 'text-slate-500 hover:text-ink'
              }`}
            >
              <Monitor className="size-3.5" />
              Desktop (Web)
            </button>
            <button
              type="button"
              aria-pressed={device === 'mobile'}
              onClick={() => setDevice('mobile')}
              className={`inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-[10.5px] font-semibold transition ${
                device === 'mobile'
                  ? 'bg-slate-100 text-ink'
                  : 'text-slate-500 hover:text-ink'
              }`}
            >
              <Smartphone className="size-3.5" />
              Ponsel (Mobile)
            </button>
          </div>

          <button
            type="button"
            onClick={handleCopyLink}
            className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-line bg-white px-3 text-[11.5px] font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            <Copy className="size-3.5" />
            Salin Tautan
          </button>

          <button
            type="button"
            onClick={handleOpenPublic}
            className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-primary px-3.5 text-[11.5px] font-semibold text-white shadow-sm transition hover:bg-primary-hover"
          >
            Buka Toko Publik
            <ExternalLink className="size-3.5" />
          </button>
        </div>
      </div>

      <div
        className={`relative mt-5 overflow-hidden rounded-2xl border p-4 sm:p-5 ${
          isActive
            ? 'border-[#b8e7df] bg-gradient-to-r from-[#d9f5ef] via-[#e9f9f5] to-[#ddf4ef]'
            : 'border-amber-200 bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50'
        }`}
      >
        <span
          aria-hidden
          className={`pointer-events-none absolute -right-16 -top-20 size-56 rounded-full ${
            isActive ? 'bg-white/35' : 'bg-amber-100/60'
          }`}
        />
        <div className="relative flex items-start gap-3.5">
          <span
            className={`flex size-11 shrink-0 items-center justify-center rounded-full text-white shadow-sm ${
              isActive ? 'bg-[#0f766e]' : 'bg-amber-500'
            }`}
          >
            <BannerIcon className="size-5" />
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-bold text-ink">
                {isActive ? 'Mode Pratinjau Pemilik Usaha' : 'Pratinjau — toko belum tayang'}
              </p>
              <span
                className={`rounded-md px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.08em] ${
                  isActive
                    ? 'bg-white/75 text-primary'
                    : 'bg-white/80 text-amber-700'
                }`}
              >
                {isActive ? 'Live Preview' : 'Preview Mode'}
              </span>
            </div>
            <p className="mt-1 max-w-4xl text-[12px] leading-relaxed text-slate-600">
              {isActive ? (
                <>
                  Anda sedang melihat simulasi langsung etalase publik toko{' '}
                  <span className="font-semibold text-slate-800">{session.storeName}</span>{' '}
                  seperti yang dilihat oleh calon pembeli. Semua penambahan produk ke
                  keranjang hanya bersifat demonstrasi visual dan checkout pembayaran
                  sengaja dinonaktifkan dalam mode ini.
                </>
              ) : (
                <>
                  Etalase ini belum dapat diakses pembeli. Toko akan tayang setelah admin
                  menyetujui pengajuan. Anda tetap dapat mencoba pengaturan tampilan di
                  bawah ini untuk menyiapkan storefront.
                </>
              )}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_356px]">
        <div>
          <div
            className={`transition-all duration-300 ${
              device === 'mobile' ? 'mx-auto w-full max-w-[400px]' : 'w-full'
            }`}
          >
            <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-[0_18px_40px_-30px_rgba(15,23,42,0.35)]">
              <div className="flex h-11 items-center gap-2 border-b border-line bg-[#f8fafc] px-3">
                <div className="hidden items-center gap-1.5 sm:flex">
                  <span className="size-2.5 rounded-full bg-[#f87171]" />
                  <span className="size-2.5 rounded-full bg-[#fbbf24]" />
                  <span className="size-2.5 rounded-full bg-[#34d399]" />
                </div>
                <div className="mx-auto flex h-7 min-w-0 max-w-[440px] flex-1 items-center gap-1.5 rounded-lg border border-line bg-white px-2.5">
                  <Lock className="size-3 shrink-0 text-emerald-600" />
                  <span className="min-w-0 flex-1 truncate text-[9.5px] text-slate-500">
                    {publicUrl}
                  </span>
                  <button
                    type="button"
                    onClick={() => showToast('Pratinjau storefront berhasil dimuat ulang.', 'info')}
                    aria-label="Muat ulang pratinjau"
                    className="text-slate-400 transition hover:text-slate-600"
                  >
                    <RefreshCw className="size-3" />
                  </button>
                </div>
                <div className="hidden items-center gap-2 text-slate-400 sm:flex">
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    aria-label="Bagikan tautan toko"
                    className="transition hover:text-slate-600"
                  >
                    <Share2 className="size-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => showToast('Menu pratinjau tambahan belum tersedia.', 'info')}
                    aria-label="Menu pratinjau lainnya"
                    className="transition hover:text-slate-600"
                  >
                    <MoreVertical className="size-3.5" />
                  </button>
                </div>
              </div>

              <div className="bg-[#f8fafc]">
                <div className="relative">
                  <StorefrontCover />

                  <div className="relative z-10 -mt-16 px-3 sm:px-5">
                    <div className="rounded-2xl border border-line bg-white p-4 shadow-[0_12px_30px_-24px_rgba(15,23,42,0.45)] sm:p-5">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
                        <div className="relative -mt-10 w-fit shrink-0 sm:-mt-9">
                          <div className="flex size-[68px] items-center justify-center rounded-2xl border-4 border-white bg-[#0f766e] text-white shadow-md sm:size-[78px]">
                            <Soup className="size-8" strokeWidth={1.6} />
                          </div>
                          <span className="absolute -bottom-1 -right-1 flex size-6 items-center justify-center rounded-full border-2 border-white bg-[#22c55e] text-white">
                            <Check className="size-3.5" strokeWidth={3} />
                          </span>
                        </div>

                        <div className="min-w-0 flex-1">
                          <h2 className="truncate text-[18px] font-extrabold tracking-tight text-ink sm:text-[20px]">
                            {session.storeName}
                          </h2>
                          <span className="mt-1 inline-flex rounded-md bg-[#d8f5ec] px-1.5 py-0.5 text-[9px] font-bold text-primary">
                            Toko Asli UMKM
                          </span>
                          <p className="mt-2 text-[11px] leading-relaxed text-slate-600">
                            Kue Tradisional &amp; Pastry Rumahan Asli Mentega Wijsman
                          </p>

                          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[9.5px] text-slate-500">
                            {settings.showReviews && (
                              <span className="inline-flex items-center gap-1">
                                <Star className="size-3 fill-amber-400 text-amber-400" />
                                <span className="font-semibold text-slate-700">4.9</span>
                                (128 ulasan)
                                <span className="ml-1 size-1 rounded-full bg-slate-300" />
                              </span>
                            )}
                            <span className="inline-flex items-center gap-1">
                              <MapPin className="size-3 text-slate-400" />
                              Kebayoran Baru, Jakarta Selatan
                            </span>
                            <span className="inline-flex items-center gap-1">
                              <Clock3 className="size-3 text-slate-400" />
                              Buka • 08.00 - 17.00 WIB
                            </span>
                          </div>
                        </div>

                        <div className="flex shrink-0 flex-wrap gap-2 sm:flex-col">
                          {settings.showWhatsApp && (
                            <button
                              type="button"
                              onClick={handleWhatsApp}
                              className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-[#dcf5e9] px-2.5 text-[9.5px] font-semibold text-[#15803d] transition hover:bg-[#c9efdd]"
                            >
                              <MessageCircle className="size-3.5" />
                              WhatsApp
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={handleCopyLink}
                            className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-[#efe7ff] px-2.5 text-[9.5px] font-semibold text-[#6d46b8] transition hover:bg-[#e5d9ff]"
                          >
                            <AtSign className="size-3.5" />
                            {whatsappHandle}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="px-3 pb-4 pt-4 sm:px-5">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                      <label className="relative min-w-0 flex-1">
                        <span className="sr-only">Cari produk di storefront</span>
                        <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-slate-400" />
                        <input
                          type="search"
                          value={query}
                          onChange={(event) => setQuery(event.target.value)}
                          placeholder="Cari kue, bolu, pastel..."
                          className="h-10 w-full rounded-xl border border-line bg-white pl-9 pr-3 text-[10.5px] text-ink outline-none transition placeholder:text-slate-400 focus:border-primary focus:ring-4 focus:ring-primary/10"
                        />
                      </label>

                      <div className="relative sm:w-[176px]">
                        <select
                          aria-label="Urutkan produk"
                          value={sort}
                          onChange={(event) => setSort(event.target.value as SortMode)}
                          className="h-10 w-full appearance-none rounded-xl border border-line bg-white pl-3 pr-8 text-[10.5px] font-medium text-slate-600 outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
                        >
                          {sortOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              Urutkan: {option.label}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-3.5 -translate-y-1/2 text-slate-400" />
                      </div>
                    </div>

                    <div className="mt-3 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                      {storefrontCategories.map((item) => {
                        const isSelected = category === item.id
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => setCategory(item.id)}
                            className={`shrink-0 rounded-full px-3 py-1.5 text-[9.5px] font-semibold transition ${
                              isSelected
                                ? 'bg-primary text-white shadow-sm'
                                : 'border border-line bg-white text-slate-600 hover:border-primary/30 hover:text-primary'
                            }`}
                          >
                            {item.label} ({categoryCount(item.id)})
                          </button>
                        )
                      })}
                    </div>

                    {visibleProducts.length > 0 ? (
                      <div
                        className={`mt-3 grid gap-2.5 ${
                          device === 'mobile'
                            ? 'grid-cols-2'
                            : 'grid-cols-2 sm:grid-cols-3'
                        }`}
                      >
                        {visibleProducts.map((product) => (
                          <StorefrontProductCard key={product.id} product={product} />
                        ))}
                      </div>
                    ) : (
                      <div className="mt-3 flex flex-col items-center justify-center rounded-xl border border-dashed border-line bg-white px-4 py-10 text-center">
                        <span className="flex size-11 items-center justify-center rounded-full bg-primary-soft/50 text-primary">
                          <Search className="size-5" />
                        </span>
                        <p className="mt-3 text-xs font-semibold text-ink">
                          Produk tidak ditemukan
                        </p>
                        <p className="mt-1 max-w-[260px] text-[10px] leading-relaxed text-slate-500">
                          Coba kata kunci lain atau tampilkan kembali produk yang stoknya
                          habis.
                        </p>
                        <button
                          type="button"
                          onClick={resetFilters}
                          className="mt-3 inline-flex h-8 items-center rounded-lg bg-primary px-3 text-[10px] font-semibold text-white transition hover:bg-primary-hover"
                        >
                          Reset Pencarian
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="border-t border-line bg-white/95 p-3 backdrop-blur">
                    <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-2.5">
                        <span className="relative flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#e8f7f2] text-primary">
                          <ShoppingCart className="size-[17px]" />
                          <span className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-primary text-[8px] font-bold text-white ring-2 ring-white">
                            0
                          </span>
                        </span>
                        <div>
                          <p className="text-[10.5px] font-bold text-ink">
                            Simulasi Keranjang Belanja
                          </p>
                          <p className="mt-0.5 text-[9px] text-slate-500">
                            Pratinjau Pelanggan • 0 item Dipilih
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-col items-stretch gap-1.5 sm:flex-row sm:items-center">
                        <p className="flex items-center gap-1 text-[8.5px] leading-snug text-slate-500 sm:max-w-[150px]">
                          <Lock className="size-3 shrink-0" />
                          Fitur checkout dinonaktifkan di pratinjau
                        </p>
                        <button
                          type="button"
                          disabled
                          className="inline-flex h-9 cursor-not-allowed items-center justify-center rounded-lg bg-[#ecebff] px-3 text-[9.5px] font-semibold text-[#6d5bd0]"
                        >
                          Lanjut Pembayaran (Nonaktif)
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4 xl:sticky xl:top-[88px] xl:self-start">
          <section className="rounded-2xl border border-line bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.06)]">
            <div className="flex items-center justify-between gap-3">
              <p className="text-[9.5px] font-bold uppercase tracking-[0.13em] text-slate-500">
                Status Tayang Etalase
              </p>
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[9.5px] font-semibold ${
                  isActive
                    ? 'bg-[#dcfce7] text-[#15803d]'
                    : 'bg-amber-100 text-amber-700'
                }`}
              >
                <span
                  className={`size-1.5 rounded-full ${
                    isActive ? 'bg-[#22c55e]' : 'bg-amber-500'
                  }`}
                />
                {isActive ? 'Publik Aktif' : 'Belum Tayang'}
              </span>
            </div>

            <div className="mt-4 flex items-start gap-3">
              <span
                className={`flex size-9 shrink-0 items-center justify-center rounded-full ${
                  isActive ? 'bg-[#e3f5ef] text-primary' : 'bg-amber-50 text-amber-600'
                }`}
              >
                <StatusIcon className="size-[18px]" />
              </span>
              <div>
                <h2 className="text-[13px] font-bold leading-snug text-ink">
                  {isActive ? 'Storefront Siap Menerima Pesanan' : 'Storefront Belum Tayang'}
                </h2>
                <p className="mt-1.5 text-[10.5px] leading-relaxed text-slate-600">
                  {isActive
                    ? 'Pelanggan Anda dapat langsung membuka katalog toko lewat peramban ponsel maupun laptop tanpa perlu mengunduh aplikasi tambahan.'
                    : 'Toko akan terlihat oleh pelanggan setelah admin menyetujui pengajuan. Lengkapi profil dan katalog untuk mempercepat verifikasi.'}
                </p>
              </div>
            </div>

            <div className="mt-4">
              <p className="text-[10px] text-slate-500">Tautan Toko Publik:</p>
              <div className="mt-1.5 flex h-10 items-center gap-2 rounded-xl border border-line bg-[#f7f9fc] px-3">
                <span className="min-w-0 flex-1 truncate text-[9.5px] text-slate-600">
                  {publicUrl.replace('https://', '')}
                </span>
                <button
                  type="button"
                  onClick={handleCopyLink}
                  aria-label="Salin tautan toko publik"
                  className="flex size-7 shrink-0 items-center justify-center rounded-lg text-slate-500 transition hover:bg-white hover:text-primary"
                >
                  <Copy className="size-3.5" />
                </button>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleDownloadQr}
                className="inline-flex h-11 items-center justify-center gap-1.5 rounded-xl border border-line bg-white px-2 text-[9.5px] font-semibold leading-tight text-slate-700 transition hover:bg-slate-50"
              >
                <QrCode className="size-4 shrink-0" />
                Unduh QR Kasir
              </button>
              <button
                type="button"
                onClick={handleWhatsApp}
                className="inline-flex h-11 items-center justify-center gap-1.5 rounded-xl bg-[#d9f5ec] px-2 text-[9.5px] font-semibold leading-tight text-[#0f766e] transition hover:bg-[#c8f0e3]"
              >
                <MessageCircle className="size-4 shrink-0" />
                Kirim via WA
              </button>
            </div>
          </section>

          <section className="rounded-2xl border border-line bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.06)]">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-[13px] font-bold text-ink">Pengaturan Etalase</h2>
              <SlidersHorizontal className="size-4 text-slate-500" />
            </div>

            <div className="mt-3 divide-y divide-line">
              {settingsRows.map((row) => (
                <div key={row.key} className="flex items-center justify-between gap-3 py-3 first:pt-1">
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold leading-snug text-ink">
                      {row.title}
                    </p>
                    <p className="mt-0.5 text-[9px] leading-relaxed text-slate-500">
                      {row.description}
                    </p>
                  </div>
                  <SettingToggle
                    checked={settings[row.key]}
                    onChange={() => toggleSetting(row.key)}
                    label={row.title}
                  />
                </div>
              ))}
            </div>

            <div className="mt-4 border-t border-line pt-4">
              <p className="truncate text-[9px] font-bold uppercase tracking-[0.1em] text-slate-400">
                Ringkasan Katalog {session.storeName}
              </p>
              <div className="mt-3 grid grid-cols-3 gap-2">
                <div className="rounded-xl bg-[#eef2ff] px-2 py-3 text-center">
                  <p className="text-base font-extrabold leading-none text-ink">
                    {totalProducts}
                  </p>
                  <p className="mt-1 text-[8.5px] leading-tight text-slate-500">
                    Total
                    <br />
                    Produk
                  </p>
                </div>
                <div className="rounded-xl bg-[#ecfdf5] px-2 py-3 text-center">
                  <p className="text-base font-extrabold leading-none text-ink">
                    {readyProducts}
                  </p>
                  <p className="mt-1 text-[8.5px] leading-tight text-slate-500">
                    Stok
                    <br />
                    Ready
                  </p>
                </div>
                <div className="rounded-xl bg-[#fef2f2] px-2 py-3 text-center">
                  <p className="text-base font-extrabold leading-none text-[#dc2626]">
                    {outOfStockProducts}
                  </p>
                  <p className="mt-1 text-[8.5px] leading-tight text-slate-500">
                    Stok
                    <br />
                    Habis
                  </p>
                </div>
              </div>
            </div>

            <Link
              to="/owner/produk"
              className="mt-4 flex h-10 items-center justify-between gap-2 rounded-xl border border-line bg-white px-3.5 text-[10.5px] font-semibold text-slate-700 transition hover:border-primary/30 hover:text-primary"
            >
              <span className="flex items-center gap-2">
                <Package className="size-3.5" />
                Kelola Produk &amp; Katalog
              </span>
              <ArrowRight className="size-3.5" />
            </Link>
          </section>

          <section className="rounded-2xl border border-line bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.06)]">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-[13px] font-bold text-ink">
                Kunjungan Storefront Hari Ini
              </h2>
              <TrendingUp className="size-4 text-primary" />
            </div>

            <div className="mt-3 flex flex-wrap items-end gap-2">
              <p className="text-[28px] font-extrabold leading-none tracking-tight text-ink">
                142
              </p>
              <p className="flex items-center pb-0.5 text-[9.5px] font-semibold text-[#16a34a]">
                <ArrowUpRight className="size-3.5" />
                +18.5% dibanding kemarin
              </p>
            </div>

            <svg
              viewBox="0 0 100 36"
              preserveAspectRatio="none"
              className="mt-3 h-11 w-full overflow-visible"
              aria-hidden
            >
              <defs>
                <linearGradient id="visitorArea" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0f766e" stopOpacity="0.15" />
                  <stop offset="100%" stopColor="#0f766e" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path d={visitorArea} fill="url(#visitorArea)" />
              <path
                d={visitorLine}
                fill="none"
                stroke="#0f766e"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle cx="100" cy="6" r="2.4" fill="#0f766e" />
            </svg>

            <p className="mt-2 text-[9.5px] leading-relaxed text-slate-500">
              Paling banyak diakses via link Instagram Story dan chat broadcast WhatsApp
              pelanggan setia.
            </p>
          </section>
        </div>
      </div>

      {toast && (
        <div
          role="status"
          className={`fixed bottom-20 right-4 z-50 max-w-[320px] rounded-xl px-4 py-3 text-xs font-semibold shadow-lg lg:bottom-6 ${
            toast.tone === 'success'
              ? 'bg-[#0f766e] text-white'
              : toast.tone === 'danger'
                ? 'bg-red-600 text-white'
                : 'bg-slate-900 text-white'
          }`}
        >
          {toast.message}
        </div>
      )}
    </div>
  )
}
