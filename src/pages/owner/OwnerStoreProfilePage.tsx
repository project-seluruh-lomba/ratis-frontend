import { useEffect, useState, type ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  ArrowUpRight,
  BadgeCheck,
  Building2,
  Cake,
  Check,
  Clock3,
  CookingPot,
  Copy,
  ExternalLink,
  Eye,
  FileText,
  Landmark,
  LifeBuoy,
  Lock,
  Mail,
  MapPin,
  MessageCircle,
  PackageCheck,
  Pencil,
  Phone,
  RefreshCw,
  Settings2,
  Share2,
  ShieldCheck,
  Snowflake,
  Store,
  Truck,
  UserRound,
  UtensilsCrossed,
  X,
  XCircle,
  type LucideIcon,
} from 'lucide-react'
import StoreProfileCoverArt from '../../components/owner/StoreProfileCoverArt'
import {
  getOwnerSession,
  type OwnerStoreStatus,
} from '../../lib/owner-auth'
import { ownerStatusMeta } from '../../lib/owner-dashboard-data'
import {
  getOwnerStoreProfile,
  getStoreSlug,
  type StoreProfilePhoto,
  type StoreVerificationEntry,
} from '../../lib/owner-store-profile-data'

type ToastTone = 'success' | 'info' | 'danger'

type Toast = {
  message: string
  tone: ToastTone
}

const statusBannerMeta: Record<
  OwnerStoreStatus,
  {
    icon: LucideIcon
    wrapperClassName: string
    iconWrapperClassName: string
    title: string
  }
> = {
  aktif: {
    icon: ShieldCheck,
    wrapperClassName: 'border-[#c9ece3] bg-[#e8f8f3]',
    iconWrapperClassName: 'bg-white text-primary',
    title: 'Status Toko: Aktif & Terverifikasi Platform',
  },
  pending: {
    icon: Clock3,
    wrapperClassName: 'border-amber-200 bg-amber-50',
    iconWrapperClassName: 'bg-white text-amber-600',
    title: 'Status Toko: Menunggu Verifikasi Admin',
  },
  ditolak: {
    icon: XCircle,
    wrapperClassName: 'border-red-200 bg-red-50',
    iconWrapperClassName: 'bg-white text-red-600',
    title: 'Status Toko: Pengajuan Ditolak',
  },
  nonaktif: {
    icon: Lock,
    wrapperClassName: 'border-line bg-slate-100',
    iconWrapperClassName: 'bg-white text-slate-500',
    title: 'Status Toko: Nonaktif',
  },
}

const photoVisuals: Record<
  StoreProfilePhoto['visual'],
  { icon: LucideIcon; className: string }
> = {
  kitchen: {
    icon: CookingPot,
    className: 'from-[#f4e3ca] via-[#e8cfaa] to-[#c9a777] text-[#70471f]',
  },
  front: {
    icon: Store,
    className: 'from-[#e3ebdd] via-[#cbd9c1] to-[#a6b99a] text-[#4b5f3d]',
  },
  pickup: {
    icon: PackageCheck,
    className: 'from-[#f0e1d6] via-[#ddc4b0] to-[#b9977c] text-[#6b4630]',
  },
}

const deliveryIcons = [Truck, Snowflake]

function CardHeader({
  icon: Icon,
  title,
  subtitle,
  right,
}: {
  icon: LucideIcon
  title: string
  subtitle: string
  right?: ReactNode
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="flex min-w-0 items-start gap-2.5">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-[#eef7f4] text-primary">
          <Icon className="size-4" />
        </span>
        <div className="min-w-0">
          <h2 className="text-[13px] font-bold leading-snug text-ink">{title}</h2>
          <p className="mt-0.5 text-[9.5px] leading-relaxed text-slate-500">
            {subtitle}
          </p>
        </div>
      </div>
      {right ? <div className="shrink-0">{right}</div> : null}
    </div>
  )
}

function StoreMapEmbed({ mapUrl, coordinates }: { mapUrl: string; coordinates: string }) {
  return (
    <div className="relative mt-2.5 overflow-hidden rounded-xl border border-line">
      <div className="relative h-[158px] bg-[#eaf2e6]">
        <svg
          viewBox="0 0 620 180"
          preserveAspectRatio="xMidYMid slice"
          className="absolute inset-0 h-full w-full"
          aria-hidden
        >
          <rect width="620" height="180" fill="#eef3ea" />
          <rect x="24" y="20" width="120" height="52" rx="7" fill="#dcebd3" />
          <rect x="470" y="16" width="132" height="62" rx="7" fill="#d8e8d2" />
          <rect x="170" y="112" width="120" height="58" rx="7" fill="#e5ead8" />
          <rect x="356" y="104" width="96" height="66" rx="7" fill="#dcebd3" />
          <path
            d="M0 128 C100 112 180 150 280 132 S470 104 620 118 L620 180 L0 180 Z"
            fill="#cfe4ef"
            opacity="0.75"
          />
          <path d="M-10 78 H630" stroke="#ffffff" strokeWidth="11" />
          <path d="M140 -10 V190" stroke="#ffffff" strokeWidth="11" />
          <path d="M420 -10 V190" stroke="#ffffff" strokeWidth="9" />
          <path d="M-10 18 H630" stroke="#f8faf7" strokeWidth="5" />
          <path d="M300 -10 L380 190" stroke="#f8faf7" strokeWidth="6" />
          <path
            d="M140 78 H300 L380 118 H420"
            stroke="#0f766e"
            strokeWidth="2.5"
            strokeDasharray="5 5"
            opacity="0.45"
            fill="none"
          />
          <text x="44" y="50" fontSize="8" fontWeight="600" fill="#7f9475">
            Kramat Pela
          </text>
          <text x="478" y="46" fontSize="8" fontWeight="600" fill="#7f9475">
            Kebayoran
          </text>
          <text x="182" y="142" fontSize="8" fontWeight="600" fill="#7f9475">
            Gandaria
          </text>
        </svg>

        <span className="absolute left-1/2 top-[43%] flex size-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-[3px] border-white bg-primary text-white shadow-lg">
          <MapPin className="size-4" />
        </span>

        <div className="absolute inset-x-2 bottom-2 flex flex-wrap items-center justify-between gap-2 rounded-lg bg-white/95 px-2.5 py-1.5 shadow-sm backdrop-blur">
          <span className="text-[8.5px] font-medium text-slate-500">
            Koordinat: {coordinates}
          </span>
          <a
            href={mapUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-[8.5px] font-bold text-primary transition hover:text-primary-hover"
          >
            Buka Google Maps
            <ExternalLink className="size-2.5" />
          </a>
        </div>
      </div>
    </div>
  )
}

function VerificationTimeline({ entries }: { entries: StoreVerificationEntry[] }) {
  return (
    <ol className="relative mt-4 space-y-4 before:absolute before:bottom-2 before:left-[11px] before:top-2 before:w-px before:bg-line">
      {entries.map((entry) => {
        const success = entry.tone === 'success'
        return (
          <li key={entry.id} className="relative pl-8">
            <span
              className={`absolute left-0 top-0 flex size-6 items-center justify-center rounded-full ${
                success ? 'bg-[#dcfce7] text-[#15803d]' : 'bg-[#fee2e2] text-[#b91c1c]'
              }`}
            >
              {success ? <Check className="size-3" /> : <X className="size-3" />}
            </span>

            <div className="flex items-start justify-between gap-2">
              <p className="text-[10.5px] font-bold leading-snug text-ink">
                {entry.title}
              </p>
              {entry.current && (
                <span className="mt-1 flex size-1.5 shrink-0 rounded-full bg-emerald-500 ring-4 ring-emerald-100" />
              )}
            </div>
            <p className="mt-0.5 text-[8.5px] font-medium text-slate-400">
              {entry.date}
            </p>
            <p
              className={`mt-1 text-[9px] leading-relaxed ${
                entry.isReason
                  ? 'rounded-lg border border-[#f3d3d6] bg-[#fff5f5] px-2 py-1.5 text-slate-600'
                  : 'text-slate-500'
              }`}
            >
              {entry.description}
            </p>
            <p className="mt-1 flex items-center gap-1 text-[8.5px] text-slate-400">
              <UserRound className="size-2.5 shrink-0" />
              {entry.actor}
            </p>
          </li>
        )
      })}
    </ol>
  )
}

export default function OwnerStoreProfilePage() {
  const location = useLocation()
  const [session] = useState(getOwnerSession)
  const [storeStatus, setStoreStatus] = useState<OwnerStoreStatus>(
    session?.storeStatus ?? 'aktif',
  )
  const [toast, setToast] = useState<Toast | null>(() => {
    const message = (location.state as { toast?: string } | null)?.toast
    return message ? { message, tone: 'success' } : null
  })

  const [profile] = useState(() => getOwnerStoreProfile(session?.storeName))
  const storeName = profile.name
  const slug = getStoreSlug(storeName)
  const statusMeta = ownerStatusMeta[storeStatus]
  const banner = statusBannerMeta[storeStatus]
  const BannerIcon = banner.icon
  const rejectionReason =
    profile.verificationHistory.find((entry) => entry.isReason)?.description ??
    'Periksa kembali kelengkapan dokumen dan foto usaha Anda.'

  useEffect(() => {
    if (!toast) return

    const timer = window.setTimeout(() => setToast(null), 4200)
    return () => window.clearTimeout(timer)
  }, [toast])

  function showToast(message: string, tone: ToastTone = 'success') {
    setToast({ message, tone })
  }

  async function handleCopySlug() {
    try {
      await navigator.clipboard.writeText(`ratis.id/toko/${slug}`)
      showToast('Tautan storefront toko disalin ke papan klip.')
    } catch {
      showToast('Gagal menyalin otomatis. Salin tautan dari alamat halaman.', 'info')
    }
  }

  function handleResubmit() {
    setStoreStatus('pending')
    showToast(
      'Pengajuan ulang terkirim. Status toko kembali menunggu peninjauan admin.',
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

      <section className="overflow-hidden rounded-2xl border border-line bg-white shadow-[0_1px_2px_rgba(15,23,42,0.06)]">
        <div className="relative h-[172px] sm:h-[224px]">
          <StoreProfileCoverArt />
          <div className="absolute inset-0 bg-gradient-to-t from-[#1b0f09]/60 via-transparent to-black/5" />

          <div className="absolute right-3 top-3 flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-black/25 px-2.5 py-1 text-[9px] font-semibold text-white backdrop-blur-sm">
              <ShieldCheck className="size-3.5" />
              Mitra Terverifikasi OSS
            </span>
            <button
              type="button"
              onClick={handleCopySlug}
              aria-label="Bagikan tautan toko"
              title="Bagikan tautan toko"
              className="flex size-7 items-center justify-center rounded-lg border border-white/25 bg-black/25 text-white backdrop-blur-sm transition hover:bg-black/40"
            >
              <Share2 className="size-3.5" />
            </button>
          </div>
        </div>

        <div className="px-4 pb-4 sm:px-5">
          <div className="relative z-10 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex min-w-0 items-start gap-3">
              <span className="-mt-7 flex size-14 shrink-0 flex-col items-center justify-center rounded-2xl border-4 border-white bg-[#fdf7ed] text-[#9a5b16] shadow-sm sm:-mt-8 sm:size-16">
                <Cake className="size-5 sm:size-6" />
                <span className="mt-0.5 text-[6.5px] font-extrabold uppercase tracking-wide">
                  Bu Sari
                </span>
              </span>

              <div className="min-w-0 pt-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="truncate text-[22px] font-extrabold tracking-tight text-ink">
                    {storeName}
                  </h1>
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold ${statusMeta.badgeClassName}`}
                  >
                    <span className={`size-1.5 rounded-full ${statusMeta.dotClassName}`} />
                    {statusMeta.label}
                  </span>
                </div>

                <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                  <span className="inline-flex items-center gap-1 rounded-md bg-[#f1f5f9] px-2 py-1 text-[8.5px] font-semibold text-slate-600">
                    <UtensilsCrossed className="size-3 shrink-0" />
                    UMKM Kuliner Mandiri
                  </span>
                  <button
                    type="button"
                    onClick={handleCopySlug}
                    className="inline-flex max-w-full items-center gap-1.5 rounded-md border border-line bg-white px-2 py-1 text-[8.5px] font-medium text-slate-500 transition hover:text-primary"
                  >
                    <span className="truncate">ratis.id/toko/{slug}</span>
                    <Copy className="size-2.5 shrink-0" />
                  </button>
                </div>

                <p className="mt-1.5 flex items-center gap-1.5 text-[9.5px] text-slate-500">
                  <Store className="size-3 shrink-0 text-slate-400" />
                  Mitra sejak {profile.registeredAt}
                </p>
              </div>
            </div>

            <div className="flex shrink-0 flex-wrap gap-2 pt-1">
              <Link
                to="/owner/pratinjau"
                className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-line bg-white px-3 text-[10.5px] font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
              >
                Pratinjau Storefront
                <ArrowUpRight className="size-3.5" />
              </Link>
              {storeStatus === 'pending' || storeStatus === 'nonaktif' ? (
                <span className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl bg-slate-300 px-3.5 text-[10.5px] font-semibold text-white">
                  <Pencil className="size-3.5" />
                  Ubah Profil Toko
                </span>
              ) : (
                <Link
                  to="/owner/toko/ubah"
                  className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl bg-primary px-3.5 text-[10.5px] font-semibold text-white shadow-sm transition hover:bg-primary-hover"
                >
                  <Pencil className="size-3.5" />
                  Ubah Profil Toko
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      <section
        className={`mt-3.5 flex flex-col gap-3 rounded-2xl border px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between ${banner.wrapperClassName}`}
      >
        <div className="flex items-start gap-3">
          <span
            className={`flex size-9 shrink-0 items-center justify-center rounded-xl shadow-sm ${banner.iconWrapperClassName}`}
          >
            <BannerIcon className="size-4" />
          </span>
          <div>
            <p className="text-[12px] font-bold text-ink">{banner.title}</p>
            <p className="mt-0.5 max-w-[640px] text-[10px] leading-relaxed text-slate-600">
              {storeStatus === 'aktif' &&
                'Pembaruan informasi operasional (jam buka, kontak WhatsApp, deskripsi kuliner, dan foto display) dapat langsung diperbarui tanpa menunggu persetujuan admin. Slug tautan toko bersifat permanen demi menjaga SEO pelanggan Anda.'}
              {storeStatus === 'pending' &&
                'Profil dapat diubah setelah admin meninjau atau menolak toko. Tim Ratis sedang memeriksa kelengkapan data usaha Anda.'}
              {storeStatus === 'ditolak' &&
                `Pengajuan sebelumnya ditolak sementara. Alasan admin: ${rejectionReason}`}
              {storeStatus === 'nonaktif' &&
                'Profil hanya dapat dibaca. Hubungi admin untuk mengaktifkan kembali toko sebelum melakukan perubahan data.'}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2 sm:justify-end">
          {storeStatus === 'aktif' && (
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-primary/20 bg-white/70 px-2.5 py-1.5 text-[9px] font-semibold text-primary">
              <Lock className="size-3" />
              Slug Permanen
            </span>
          )}

          {storeStatus === 'pending' && (
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-amber-200 bg-white/70 px-2.5 py-1.5 text-[9px] font-semibold text-amber-700">
              <Clock3 className="size-3" />
              Menunggu Peninjauan
            </span>
          )}

          {storeStatus === 'ditolak' && (
            <>
              <Link
                to="/owner/toko/ubah"
                className="inline-flex h-9 items-center rounded-xl border border-red-200 bg-white px-3 text-[10px] font-semibold text-red-700 transition hover:bg-red-50"
              >
                Perbaiki Profil
              </Link>
              <button
                type="button"
                onClick={handleResubmit}
                className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-primary px-3 text-[10px] font-semibold text-white transition hover:bg-primary-hover"
              >
                <RefreshCw className="size-3" />
                Ajukan Ulang Verifikasi
              </button>
            </>
          )}

          {storeStatus === 'nonaktif' && (
            <button
              type="button"
              onClick={() =>
                showToast(
                  'Permintaan aktivasi dikirim ke tim admin Ratis. Anda akan dihubungi melalui email terdaftar.',
                  'info',
                )
              }
              className="h-9 rounded-xl border border-line bg-white px-3 text-[10px] font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Hubungi Admin
            </button>
          )}
        </div>
      </section>

      <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="min-w-0 space-y-4">
          <section className="rounded-2xl border border-line bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.06)] sm:p-5">
            <CardHeader
              icon={Building2}
              title="Identitas Resmi Usaha"
              subtitle="Informasi entitas yang tayang pada etalase digital pembeli"
              right={
                <span className="text-[8.5px] font-medium text-slate-400">
                  {profile.updatedAt}
                </span>
              }
            />

            <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
              <div className="rounded-xl bg-[#f8fafc] px-3 py-2.5">
                <p className="text-[8px] font-bold uppercase tracking-[0.08em] text-slate-400">
                  Nama Merek / Toko
                </p>
                <p className="mt-1 text-[11.5px] font-bold text-ink">{storeName}</p>
              </div>
              <div className="rounded-xl bg-[#f8fafc] px-3 py-2.5">
                <p className="text-[8px] font-bold uppercase tracking-[0.08em] text-slate-400">
                  Kategori Usaha
                </p>
                <p className="mt-1 flex items-start gap-1.5 text-[11px] font-semibold leading-snug text-ink">
                  <UtensilsCrossed className="mt-0.5 size-3.5 shrink-0 text-primary" />
                  {profile.category}
                </p>
              </div>
            </div>

            <div className="mt-2.5 rounded-xl border border-[#dcebe6] bg-[#f1faf7] px-3.5 py-3">
              <p className="text-[8px] font-bold uppercase tracking-[0.08em] text-primary">
                Slogan &amp; Keunikan Merek
              </p>
              <p className="mt-1 text-[11px] font-semibold italic leading-relaxed text-ink">
                {profile.tagline}
              </p>
            </div>

            <div className="mt-3">
              <p className="text-[8px] font-bold uppercase tracking-[0.08em] text-slate-400">
                Deskripsi &amp; Profil Produk Toko
              </p>
              <p className="mt-1 text-[10.5px] leading-relaxed text-slate-600">
                {profile.description}
              </p>
            </div>

            <div className="mt-3 rounded-xl border border-line p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-[8px] font-bold uppercase tracking-[0.08em] text-slate-400">
                  Jadwal Operasional Dapur &amp; Pengiriman
                </p>
                <span className="inline-flex items-center gap-1 text-[8.5px] font-semibold text-[#15803d]">
                  <span className="size-1.5 rounded-full bg-emerald-500" />
                  Sesuai Jam Kasir POS
                </span>
              </div>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                {profile.operationalHours.map((schedule) => (
                  <div
                    key={schedule.label}
                    className="flex items-center gap-2 rounded-lg bg-[#f8fafc] px-2.5 py-2"
                  >
                    <Clock3 className="size-3.5 shrink-0 text-slate-400" />
                    <div className="min-w-0">
                      <p className="text-[9px] font-semibold text-ink">
                        {schedule.label}
                      </p>
                      <p className="mt-0.5 text-[8.5px] text-slate-500">
                        {schedule.value}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-line bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.06)] sm:p-5">
            <CardHeader
              icon={Phone}
              title="Kontak & Titik Dapur Produksi"
              subtitle="Penyampaian pesanan katering logistik dan konfirmasi pelanggan"
            />

            <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
              <div className="rounded-xl border border-line px-3 py-2.5">
                <p className="flex items-center gap-1 text-[8px] font-bold uppercase tracking-[0.06em] text-slate-400">
                  <MessageCircle className="size-3 text-[#25d366]" />
                  WhatsApp Kemitraan / CS
                </p>
                <p className="mt-1 text-[11.5px] font-bold text-ink">
                  {profile.whatsapp}
                </p>
                <p className="mt-1 inline-flex items-center gap-1 text-[8.5px] font-medium text-primary">
                  <BadgeCheck className="size-3" />
                  Terverifikasi OTP
                </p>
              </div>
              <div className="rounded-xl border border-line px-3 py-2.5">
                <p className="flex items-center gap-1 text-[8px] font-bold uppercase tracking-[0.06em] text-slate-400">
                  <Mail className="size-3 text-slate-400" />
                  Email Korespondensi
                </p>
                <p className="mt-1 break-all text-[11px] font-bold text-ink">
                  {profile.email}
                </p>
                <p className="mt-1 text-[8.5px] font-medium text-slate-500">
                  Faktur Otomatis Aktif
                </p>
              </div>
            </div>

            <div className="mt-2.5 rounded-xl border border-line px-3 py-2.5">
              <p className="flex items-center gap-1 text-[8px] font-bold uppercase tracking-[0.06em] text-slate-400">
                <MapPin className="size-3 text-primary" />
                Alamat Fisik Dapur &amp; Pengiriman
              </p>
              <p className="mt-1 text-[10.5px] font-medium leading-relaxed text-ink">
                {profile.address}
              </p>
              <p className="mt-1.5 border-t border-line pt-1.5 text-[8.5px] leading-relaxed text-slate-500">
                {profile.addressNote}
              </p>
            </div>

            <StoreMapEmbed mapUrl={profile.mapUrl} coordinates={profile.coordinates} />

            <div className="mt-3">
              <p className="text-[8px] font-bold uppercase tracking-[0.08em] text-slate-400">
                Layanan Terhubung
              </p>
              <div className="mt-1.5 space-y-1.5">
                {profile.deliveryServices.map((service, index) => {
                  const Icon = deliveryIcons[index] ?? Truck
                  return (
                    <div
                      key={service.label}
                      className="flex items-center gap-2.5 rounded-lg bg-[#f8fafc] px-2.5 py-2"
                    >
                      <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-white text-slate-500 shadow-sm">
                        <Icon className="size-3.5" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-[9px] font-semibold text-ink">
                          {service.label}
                        </p>
                        <p className="mt-0.5 text-[8px] text-slate-400">
                          {service.description}
                        </p>
                      </div>
                      <Check className="size-3.5 shrink-0 text-primary" />
                    </div>
                  )
                })}
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-line bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.06)] sm:p-5">
            <CardHeader
              icon={FileText}
              title="Dokumen & Legalitas Usaha"
              subtitle="Data legal untuk menaikkan kepercayaan calon pembeli"
              right={
                <span className="rounded bg-[#eef2ff] px-1.5 py-0.5 text-[8px] font-bold text-[#3b5bdb]">
                  Kepatuhan OSS
                </span>
              }
            />

            <div className="mt-3 rounded-xl border border-line px-3 py-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-[8px] font-bold uppercase tracking-[0.06em] text-slate-400">
                  Nomor Induk Berusaha (NIB)
                </p>
                <span className="inline-flex items-center gap-1 rounded bg-[#dcfce7] px-1.5 py-0.5 text-[8px] font-bold text-[#15803d]">
                  <BadgeCheck className="size-2.5" />
                  Terverifikasi
                </span>
              </div>
              <div className="mt-1 flex flex-wrap items-end justify-between gap-2">
                <p className="font-mono text-[13px] font-bold tracking-wide text-ink">
                  {profile.nib}
                </p>
                <button
                  type="button"
                  onClick={() =>
                    showToast('Pratinjau PDF NIB dibuka pada dokumen mitra.', 'info')
                  }
                  className="inline-flex items-center gap-1 text-[8.5px] font-semibold text-slate-500 transition hover:text-primary"
                >
                  <Eye className="size-3" />
                  Lihat PDF NIB
                </button>
              </div>
              <p className="mt-1 text-[8.5px] leading-relaxed text-slate-500">
                {profile.nibRegistration}
              </p>
            </div>

            <div className="mt-2.5 grid gap-2.5 sm:grid-cols-2">
              <div className="rounded-xl border border-line px-3 py-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-[8px] font-bold uppercase tracking-[0.06em] text-slate-400">
                    Sertifikat Produksi P-IRT
                  </p>
                  <span className="inline-flex items-center gap-1 rounded bg-[#dcfce7] px-1.5 py-0.5 text-[8px] font-bold text-[#15803d]">
                    <span className="size-1 rounded-full bg-emerald-500" />
                    {profile.pirt.status}
                  </span>
                </div>
                <p className="mt-1 text-[10.5px] font-bold text-ink">
                  {profile.pirt.value}
                </p>
                <p className="mt-1 text-[8.5px] leading-relaxed text-slate-500">
                  Diterbitkan oleh {profile.pirt.issuer}
                </p>
                <p className="mt-1.5 flex items-center gap-1 text-[8.5px] font-medium text-slate-500">
                  <Check className="size-3 text-primary" />
                  {profile.pirt.validity}
                </p>
              </div>

              <div className="rounded-xl border border-line px-3 py-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-[8px] font-bold uppercase tracking-[0.06em] text-slate-400">
                    Sertifikasi Halal Dapur
                  </p>
                  <span className="inline-flex items-center gap-1 rounded bg-[#f1f5f9] px-1.5 py-0.5 text-[8px] font-bold text-slate-500">
                    {profile.halal.status}
                  </span>
                </div>
                <p className="mt-1 text-[10.5px] font-bold text-ink">
                  {profile.halal.value}
                </p>
                <p className="mt-1 text-[8.5px] leading-relaxed text-slate-500">
                  Diterbitkan oleh {profile.halal.issuer}
                </p>
                <p className="mt-1.5 flex items-center gap-1 text-[8.5px] font-medium text-slate-500">
                  <Check className="size-3 text-primary" />
                  {profile.halal.validity}
                </p>
              </div>
            </div>

            <div className="mt-3">
              <p className="text-[8px] font-bold uppercase tracking-[0.08em] text-slate-400">
                Foto Tempat Usaha Fisik &amp; Higienitas Dapur
              </p>
              <div className="mt-1.5 grid grid-cols-3 gap-2">
                {profile.photos.map((photo) => {
                  const visual = photoVisuals[photo.visual]
                  const Icon = visual.icon
                  return (
                    <div
                      key={photo.id}
                      className="group relative aspect-[4/3] overflow-hidden rounded-xl border border-line"
                      title={photo.caption}
                    >
                      <div
                        className={`absolute inset-0 bg-gradient-to-br ${visual.className}`}
                      />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Icon className="size-7 opacity-60" />
                      </div>
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/55 to-transparent px-2 pb-1.5 pt-5">
                        <p className="text-[8px] font-semibold leading-tight text-white">
                          {photo.label}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </section>
        </div>

        <aside className="min-w-0 space-y-4">
          <section className="rounded-2xl border border-line bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.06)]">
            <CardHeader
              icon={ShieldCheck}
              title="Riwayat Verifikasi Toko"
              subtitle="Log audit & catatan hasil keputusan Ratis"
              right={
                <span className="inline-flex items-center gap-1 text-[8.5px] font-semibold text-[#15803d]">
                  <span className="size-1.5 rounded-full bg-emerald-500" />
                  Sinkron
                </span>
              }
            />
            <VerificationTimeline entries={profile.verificationHistory} />
          </section>

          <section className="rounded-2xl border border-line bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.06)]">
            <CardHeader
              icon={Landmark}
              title="Rekening Bank Pencairan"
              subtitle="Penampung dana penjualan kasir & online"
              right={
                <button
                  type="button"
                  onClick={() =>
                    showToast(
                      'Pengaturan rekening pencairan dibuka melalui verifikasi ulang pemilik.',
                      'info',
                    )
                  }
                  aria-label="Pengaturan rekening bank"
                  title="Pengaturan rekening"
                  className="flex size-7 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                >
                  <Settings2 className="size-3.5" />
                </button>
              }
            />

            <div className="mt-3 rounded-xl border border-line p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#eaf0ff] text-[9px] font-extrabold text-[#1d4ed8]">
                    BCA
                  </span>
                  <div>
                    <p className="text-[10px] font-bold leading-snug text-ink">
                      {profile.bank.name}
                    </p>
                    <p className="mt-0.5 text-[8px] text-slate-400">
                      Rekening Usaha Terverifikasi
                    </p>
                  </div>
                </div>
                <span className="rounded bg-[#dcfce7] px-1.5 py-0.5 text-[8px] font-bold text-[#15803d]">
                  Utama
                </span>
              </div>

              <p className="mt-2.5 font-mono text-[14px] font-bold tracking-wider text-ink">
                {profile.bank.accountNumber}
              </p>
              <p className="mt-0.5 text-[8.5px] text-slate-500">
                Atas Nama: {profile.bank.accountHolder}
              </p>

              <div className="mt-2.5 flex items-center justify-between gap-2 border-t border-line pt-2">
                <span className="inline-flex items-center gap-1 text-[8.5px] font-semibold text-slate-500">
                  <RefreshCw className="size-3 text-primary" />
                  Rekonsiliasi Otomatis
                </span>
                <Check className="size-3.5 text-primary" />
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-[#dbe3f4] bg-[#eef2ff] p-4">
            <span className="flex size-9 items-center justify-center rounded-xl bg-white text-[#3b5bdb] shadow-sm">
              <LifeBuoy className="size-4" />
            </span>
            <h2 className="mt-3 text-[13px] font-bold text-ink">
              Butuh Bantuan atau Revisi Dokumen?
            </h2>
            <p className="mt-1 text-[9.5px] leading-relaxed text-slate-600">
              Jika terdapat perubahan legalitas usaha (misalnya peningkatan ke
              CV/PT atau perubahan rekening bank), Anda dapat mengajukan
              pembaruan data resmi ke tim kurasi kami.
            </p>
            <button
              type="button"
              onClick={() =>
                showToast(
                  'Formulir pembaruan data resmi dibuka. Tim kurasi akan meninjau dokumen Anda.',
                  'info',
                )
              }
              className="mt-3 inline-flex h-9 w-full items-center justify-center gap-2 rounded-xl bg-primary px-3 text-[10px] font-semibold text-white transition hover:bg-primary-hover"
            >
              <FileText className="size-3.5" />
              Buka Formulir Pembaruan Data
            </button>
            <button
              type="button"
              onClick={() =>
                showToast(
                  'Chat dengan Tim Pendamping UMKM Ratis dimulai. Rata-rata balasan 5 menit.',
                  'info',
                )
              }
              className="mt-1.5 inline-flex h-9 w-full items-center justify-center gap-2 rounded-xl bg-white/70 px-3 text-[10px] font-semibold text-slate-700 transition hover:bg-white"
            >
              <MessageCircle className="size-3.5 text-primary" />
              Chat Tim Pendamping UMKM Ratis
            </button>
          </section>
        </aside>
      </div>
    </div>
  )
}
