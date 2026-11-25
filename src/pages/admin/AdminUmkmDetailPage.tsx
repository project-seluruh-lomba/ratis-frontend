import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import {
  Activity,
  Archive,
  ArrowLeft,
  ArrowUpRight,
  BadgeCheck,
  Check,
  CheckCircle2,
  ClipboardList,
  Clock,
  FileText,
  Info,
  Lock,
  Mail,
  MapPin,
  Printer,
  ScrollText,
  ShieldCheck,
  ShoppingBag,
  Store,
  UserCheck,
  UtensilsCrossed,
  X,
  XCircle,
  type LucideIcon,
} from 'lucide-react'
import AdminToast, { type ToastTone } from '../../components/admin/AdminToast'
import ConfirmDialog from '../../components/admin/ConfirmDialog'
import {
  getUmkmDetail,
  persistUmkmStatus,
  type UmkmAuditEvent,
  type UmkmAuditTone,
  type UmkmDetail,
  type UmkmStatus,
} from '../../lib/admin-umkm-data'

type DialogKind = 'approve' | 'reject' | 'deactivate' | 'activate'
type ToastState = { id: number; message: string; tone: ToastTone }

const statusMeta: Record<UmkmStatus, { label: string; badge: string; dot: string }> = {
  pending: {
    label: 'Menunggu Verifikasi (Pending)',
    badge: 'border border-amber-200 bg-amber-50 text-amber-700',
    dot: 'bg-amber-500',
  },
  aktif: {
    label: 'Aktif & Tayang',
    badge: 'border border-emerald-200 bg-emerald-50 text-emerald-600',
    dot: 'bg-emerald-500',
  },
  ditolak: {
    label: 'Pendaftaran Ditolak',
    badge: 'border border-red-200 bg-red-50 text-red-600',
    dot: 'bg-red-500',
  },
  nonaktif: {
    label: 'Toko Nonaktif',
    badge: 'border border-slate-200 bg-slate-100 text-slate-500',
    dot: 'bg-slate-400',
  },
}

const auditDotTones: Record<UmkmAuditTone, string> = {
  warning: 'border-amber-400',
  success: 'border-emerald-500',
  neutral: 'border-slate-300',
}

const verifierGuidelines = [
  'Pastikan foto tempat usaha asli dan bukan foto contoh Google/Katalog pihak ketiga.',
  'Nomor WhatsApp dapat dihubungi dan format alamat mencakup kelurahan dan kecamatan.',
  'Harga yang dicantumkan wajar dan tidak terindikasi penipuan skema promo fiktif.',
]

function getInitials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')
}

function formatDate(isoDate: string) {
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'Asia/Jakarta',
  }).format(new Date(isoDate))
}

function formatTime(isoDate: string) {
  const time = new Intl.DateTimeFormat('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'Asia/Jakarta',
  }).format(new Date(isoDate))

  return `${time} WIB`
}

function formatAuditTime(isoDate: string) {
  const time = new Intl.DateTimeFormat('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    timeZone: 'Asia/Jakarta',
  }).format(new Date(isoDate))

  return `${formatDate(isoDate)}, ${time} WIB`
}

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
        <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary-soft/60 text-primary">
          <Icon className="size-3.5" />
        </span>
        <div className="min-w-0">
          <h2 className="text-sm font-bold text-ink">{title}</h2>
          <p className="mt-0.5 text-[10px] leading-relaxed text-muted">{subtitle}</p>
        </div>
      </div>
      {right && <div className="shrink-0">{right}</div>}
    </div>
  )
}

export default function AdminUmkmDetailPage() {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const location = useLocation()

  const detail = useMemo<UmkmDetail | undefined>(() => (slug ? getUmkmDetail(slug) : undefined), [slug])

  const [status, setStatus] = useState<UmkmStatus>(() => detail?.record.status ?? 'pending')
  const [events, setEvents] = useState<UmkmAuditEvent[]>(() => detail?.auditTrail ?? [])
  const [toast, setToast] = useState<ToastState | null>(null)
  const [dialog, setDialog] = useState<DialogKind | null>(null)
  const [reason, setReason] = useState('')
  const [now] = useState(() => Date.now())

  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => setToast(null), 4000)
    return () => window.clearTimeout(timer)
  }, [toast])

  if (!detail) {
    return (
      <div className="mx-auto max-w-xl rounded-2xl border border-line bg-white p-10 text-center shadow-sm">
        <span className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
          <Store className="size-5" />
        </span>
        <h1 className="mt-3 text-lg font-bold text-ink">UMKM tidak ditemukan</h1>
        <p className="mt-1 text-xs leading-relaxed text-muted">
          Data toko tidak tersedia atau tautan sudah tidak berlaku.
        </p>
        <Link
          to="/admin/umkm"
          className="mt-5 inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-4 text-xs font-semibold text-white transition hover:bg-primary-hover"
        >
          <ArrowLeft className="size-4" />
          Kembali ke daftar UMKM
        </Link>
      </div>
    )
  }

  const record = detail.record
  const statusInfo = statusMeta[status]
  const deadline = new Date(record.registeredAt).getTime() + 24 * 60 * 60 * 1000
  const remainingMs = deadline - now
  const slaLabel =
    remainingMs > 0
      ? `${Math.floor(remainingMs / 3_600_000)}j ${Math.floor((remainingMs % 3_600_000) / 60_000)}m`
      : 'Lewat SLA'
  const encodedCoordinates = encodeURIComponent(detail.coordinates)
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodedCoordinates}`
  const mapEmbedUrl = `https://maps.google.com/maps?q=${encodedCoordinates}&z=15&hl=id&output=embed`

  function showToast(message: string, tone: ToastTone) {
    setToast({ id: Date.now(), message, tone })
  }

  function handleBack() {
    if (location.key !== 'default') navigate(-1)
    else navigate('/admin/umkm')
  }

  function openDialog(kind: DialogKind) {
    setDialog(kind)
    setReason('')
  }

  function closeDialog() {
    setDialog(null)
    setReason('')
  }

  function handleConfirm() {
    if (!dialog) return
    if ((dialog === 'reject' || dialog === 'deactivate') && reason.trim().length < 10) return

    const nextStatusMap: Record<DialogKind, UmkmStatus> = {
      approve: 'aktif',
      reject: 'ditolak',
      deactivate: 'nonaktif',
      activate: 'aktif',
    }
    const titles: Record<DialogKind, string> = {
      approve: 'Verifikasi Toko Disetujui',
      reject: 'Pendaftaran Toko Ditolak',
      deactivate: 'Toko Dinonaktifkan',
      activate: 'Toko Diaktifkan Kembali',
    }
    const tones: Record<DialogKind, UmkmAuditTone> = {
      approve: 'success',
      reject: 'warning',
      deactivate: 'neutral',
      activate: 'success',
    }
    const descriptions: Record<DialogKind, string> = {
      approve: `Pendaftaran ${record.name} disetujui dan toko mulai tayang di storefront Ratis.`,
      reject: `Pendaftaran ${record.name} ditolak. Alasan: ${reason.trim()}`,
      deactivate: `${record.name} dinonaktifkan dari storefront. Alasan: ${reason.trim()}`,
      activate: `${record.name} diaktifkan kembali dan mulai tayang di storefront Ratis.`,
    }
    const toastMessages: Record<DialogKind, { message: string; tone: ToastTone }> = {
      approve: {
        message: `${record.name} disetujui dan sekarang tampil di storefront.`,
        tone: 'success',
      },
      reject: {
        message: `Pendaftaran ${record.name} ditolak. Alasan dikirim ke pemilik.`,
        tone: 'info',
      },
      deactivate: {
        message: `${record.name} dinonaktifkan dan tidak tampil di storefront.`,
        tone: 'info',
      },
      activate: {
        message: `${record.name} berhasil diaktifkan kembali.`,
        tone: 'success',
      },
    }

    const nextStatus = nextStatusMap[dialog]
    persistUmkmStatus(record.slug, nextStatus)
    setStatus(nextStatus)
    setEvents((current) => [
      {
        id: `${record.slug}-${dialog}-${Date.now()}`,
        title: titles[dialog],
        at: new Date().toISOString(),
        description: descriptions[dialog],
        statusLabel: `Status: ${statusMeta[nextStatus].label}`,
        context: 'Admin: Superadmin Platform',
        tone: tones[dialog],
      },
      ...current,
    ])

    const toastCopy = toastMessages[dialog]
    showToast(toastCopy.message, toastCopy.tone)
    closeDialog()
  }

  const dialogCopy = dialog
    ? {
        approve: {
          title: 'Setujui UMKM ini?',
          description: `${record.name} akan langsung tampil di storefront Ratis dan dapat menerima pesanan dari pelanggan.`,
          confirmLabel: 'Setujui UMKM',
          tone: 'primary' as const,
        },
        reject: {
          title: 'Tolak pendaftaran UMKM?',
          description: `Pendaftaran ${record.name} akan ditolak dan pemilik menerima alasan penolakan untuk memperbaiki data.`,
          confirmLabel: 'Tolak UMKM',
          tone: 'danger' as const,
        },
        deactivate: {
          title: 'Nonaktifkan toko ini?',
          description: `${record.name} akan hilang dari storefront publik dan tidak menerima pesanan baru. Data toko tetap tersimpan.`,
          confirmLabel: 'Nonaktifkan Toko',
          tone: 'danger' as const,
        },
        activate: {
          title: 'Aktifkan kembali toko?',
          description: `${record.name} akan tampil kembali di storefront Ratis dan dapat menerima pesanan dari pelanggan.`,
          confirmLabel: 'Aktifkan Toko',
          tone: 'primary' as const,
        },
      }[dialog]
    : null

  const reasonRequired = dialog === 'reject' || dialog === 'deactivate'

  return (
    <div>
      <button
        type="button"
        onClick={handleBack}
        className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-ink transition hover:text-primary"
      >
        <ArrowLeft className="size-3.5" />
        Kembali ke daftar UMKM
      </button>
      <span className="mx-2 text-slate-300">/</span>
      <span className="text-[9px] font-bold uppercase tracking-[0.16em] text-muted">
        Verifikasi Toko
      </span>

      <div className="mt-3 rounded-2xl border border-line bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-2xl font-extrabold tracking-tight text-ink">{record.name}</h1>
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold ${statusInfo.badge}`}
              >
                <span className={`size-1.5 rounded-full ${statusInfo.dot}`} />
                {statusInfo.label}
              </span>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] text-muted">
              <span>
                Terdaftar sejak {formatDate(record.registeredAt)}, {formatTime(record.registeredAt)}
              </span>
              <span className="size-1 rounded-full bg-slate-300" />
              <span className="font-semibold text-slate-600">ID: {detail.shopId}</span>
              <span className="size-1 rounded-full bg-slate-300" />
              <span>Kategori: {detail.category}</span>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex h-9 items-center gap-2 rounded-xl border border-line bg-white px-3 text-[11px] font-semibold text-slate-600 transition hover:bg-slate-50"
            >
              <Printer className="size-3.5" />
              Cetak Berkas
            </button>
            <button
              type="button"
              onClick={() =>
                document
                  .getElementById('audit-trail')
                  ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
              }
              className="inline-flex h-9 items-center gap-2 rounded-xl border border-line bg-white px-3 text-[11px] font-semibold text-slate-600 transition hover:bg-slate-50"
            >
              <ScrollText className="size-3.5" />
              Log Audit
            </button>
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0 space-y-4">
          <section className="rounded-2xl border border-line bg-white p-5 shadow-sm">
            <CardHeader
              icon={Store}
              title="Profil Toko"
              subtitle="Identitas usaha komersial dan kelengkapan lokasi usaha"
              right={
                <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-600">
                  <BadgeCheck className="size-3.5" />
                  Sesuai Standar
                </span>
              }
            />

            <div className="relative mt-4 aspect-[16/9] overflow-hidden rounded-xl bg-gradient-to-br from-slate-300 via-slate-400 to-slate-500">
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-white/70">
                <Store className="size-7" />
                <span className="text-[10px] font-semibold uppercase tracking-[0.14em]">
                  Foto Tempat Usaha
                </span>
              </div>
              <div className="absolute inset-x-0 bottom-0 flex items-end gap-3 bg-gradient-to-t from-slate-900/80 via-slate-900/30 to-transparent p-4">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-white text-xs font-extrabold text-primary">
                  {getInitials(record.name)}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-xs font-bold text-white">{detail.photoLabel}</p>
                  <p className="mt-0.5 text-[10px] text-white/70">
                    Dokumentasi fisik tempat usaha (Diunggah pemilik)
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-4">
              <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-slate-400">
                Deskripsi Usaha
              </p>
              <p className="mt-1.5 text-xs leading-relaxed text-slate-600">{detail.description}</p>
            </div>

            <div className="mt-4 rounded-xl border border-line p-4">
              <div className="flex items-start justify-between gap-3">
                <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.1em] text-ink">
                  <MapPin className="size-3.5 shrink-0 text-primary" />
                  Alamat Operasional &amp; Dapur
                </p>
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex shrink-0 items-center gap-1 text-[10px] font-semibold text-primary transition hover:underline"
                >
                  Buka di Peta
                  <ArrowUpRight className="size-3" />
                </a>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-slate-600">{detail.address}</p>
              <div className="relative mt-3 overflow-hidden rounded-lg border border-line">
                <iframe
                  title={`Peta lokasi ${record.name}`}
                  src={mapEmbedUrl}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  className="h-40 w-full grayscale-[15%]"
                />
                <div className="pointer-events-none absolute bottom-2 left-2 inline-flex items-center gap-1.5 rounded-lg bg-white/95 px-2.5 py-1.5 text-[10px] font-medium text-slate-600 shadow-sm">
                  <MapPin className="size-3 text-primary" />
                  Titik Koordinat: {detail.coordinates}
                </div>
              </div>
            </div>

            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl bg-[#f4f5fa] p-4">
                <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-muted">
                  Kontak &amp; WhatsApp Resmi
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <p className="text-sm font-bold text-ink">{record.phone}</p>
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-1.5 py-0.5 text-[9px] font-bold text-emerald-700">
                    <Check className="size-2.5" />
                    Aktif WA
                  </span>
                </div>
                <p className="mt-1.5 text-[10px] leading-relaxed text-muted">
                  Saluran komunikasi utama customer care.
                </p>
              </div>

              <div className="rounded-xl bg-[#f4f5fa] p-4">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-muted">
                    NIB (Nomor Induk Berusaha)
                  </p>
                  <div className="flex shrink-0 gap-1">
                    <span className="rounded border border-line bg-white px-1.5 py-0.5 text-[8px] font-semibold text-muted">
                      Opsional
                    </span>
                    <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[8px] font-bold text-emerald-700">
                      {detail.nib ? 'Terisi' : 'Kosong'}
                    </span>
                  </div>
                </div>
                <p className="mt-2 text-sm font-bold text-ink">{detail.nib ?? 'Belum diisi'}</p>
                {detail.nib ? (
                  <button
                    type="button"
                    onClick={() =>
                      showToast(`NIB ${detail.nib} terverifikasi di OSS RBA Kementerian Investasi.`, 'success')
                    }
                    className="mt-1 inline-flex items-center gap-1 text-[10px] font-semibold text-primary transition hover:underline"
                  >
                    <FileText className="size-3" />
                    Lihat NIB
                  </button>
                ) : (
                  <p className="mt-1 text-[10px] text-muted">Dokumen belum diunggah pemilik.</p>
                )}
                <p className="mt-1.5 text-[10px] leading-relaxed text-muted">
                  Terdaftar di OSS RBA Kementerian Investasi/BKPM RI.
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-line bg-white p-5 shadow-sm">
            <CardHeader
              icon={UserCheck}
              title="Data Pemilik Usaha"
              subtitle="Informasi identitas penanggung jawab hukum badan usaha"
              right={
                <span className="rounded-full bg-emerald-100 px-2 py-1 text-[9px] font-bold text-emerald-700">
                  KYC Terhubung Dukcapil
                </span>
              }
            />

            <div className="mt-4 flex flex-col gap-4 rounded-xl bg-[#f4f5fa] p-4 sm:flex-row sm:items-center">
              <div className="flex items-center gap-3 sm:w-[220px] sm:shrink-0">
                <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary-soft text-sm font-extrabold text-primary">
                  {getInitials(record.owner)}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-xs font-bold text-ink">{record.owner}</p>
                  <p className="mt-0.5 text-[10px] text-muted">Pemilik / Pengelola Utama</p>
                  <p className="mt-1 flex items-center gap-1 text-[9px] font-semibold text-emerald-600">
                    <BadgeCheck className="size-3" />
                    Akun Personal Terverifikasi
                  </p>
                </div>
              </div>

              <div className="grid flex-1 gap-3 sm:grid-cols-2 sm:divide-x sm:divide-line">
                <div className="min-w-0 sm:pl-4">
                  <p className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-[0.08em] text-muted">
                    <Mail className="size-3" />
                    Email Terdaftar
                  </p>
                  <p className="mt-1 truncate text-xs font-semibold text-ink">{record.email}</p>
                  <p className="mt-1 flex items-center gap-1 text-[9px] font-semibold text-emerald-600">
                    <CheckCircle2 className="size-3" />
                    Terverifikasi OTP
                  </p>
                </div>
                <div className="min-w-0 sm:pl-4">
                  <p className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-[0.08em] text-muted">
                    <Lock className="size-3" />
                    NIK / KTP (Masked)
                  </p>
                  <p className="mt-1 text-xs font-semibold text-ink">{detail.ownerNik}</p>
                  <p className="mt-1 text-[9px] text-muted">Sesuai KTP {detail.ownerCity}</p>
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-line bg-white p-5 shadow-sm">
            <CardHeader
              icon={Archive}
              title="Ringkasan Toko"
              subtitle="Volume inventaris produk pra-rilis dan kesiapan logistik"
              right={
                <span className="text-[10px] font-semibold text-muted">Katalog Draf</span>
              }
            />

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="relative rounded-xl border border-line bg-white p-4">
                <p className="text-[10px] font-semibold text-muted">Produk Siap Lancar</p>
                <p className="mt-1 text-2xl font-extrabold text-ink">
                  {detail.productSkus}{' '}
                  <span className="text-[10px] font-semibold text-emerald-600">SKU Aktif Draf</span>
                </p>
                <p className="mt-1 text-[10px] leading-relaxed text-muted">
                  Semua produk telah dilengkapi foto, deskripsi, dan varian harga porsi.
                </p>
                <Archive className="absolute right-4 top-4 size-4 text-slate-300" />
              </div>

              <div className="relative rounded-xl border border-line bg-white p-4">
                <p className="text-[10px] font-semibold text-muted">Pesanan Terproses</p>
                <p className="mt-1 text-2xl font-extrabold text-ink">
                  {detail.ordersProcessed > 0 ? detail.ordersProcessed : '(0)'}{' '}
                  <span
                    className={`text-[10px] font-semibold ${
                      detail.ordersProcessed > 0 ? 'text-emerald-600' : 'text-amber-600'
                    }`}
                  >
                    {detail.ordersProcessed > 0 ? 'transaksi' : 'belum aktif'}
                  </span>
                </p>
                <p className="mt-1 text-[10px] leading-relaxed text-muted">
                  {detail.ordersProcessed > 0
                    ? 'Total pesanan yang telah diproses oleh toko.'
                    : 'Toko belum menerima pesanan karena menunggu otorisasi administrasi publik.'}
                </p>
                <ShoppingBag className="absolute right-4 top-4 size-4 text-slate-300" />
              </div>
            </div>

            <div className="mt-3 rounded-xl bg-[#f4f5fa] p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-muted">
                  Pratinjau Sample Produk Terdaftar
                </p>
                <button
                  type="button"
                  onClick={() =>
                    showToast(
                      `Pratinjau seluruh ${detail.productSkus} SKU tersedia setelah toko aktif.`,
                      'info',
                    )
                  }
                  className="text-[10px] font-semibold text-primary transition hover:underline"
                >
                  Periksa Seluruh ({detail.productSkus} SKU) →
                </button>
              </div>
              <div className="mt-3 grid gap-2 sm:grid-cols-3">
                {detail.productPreviews.map((product) => (
                  <div
                    key={product.name}
                    className="flex items-center gap-2 rounded-lg border border-line bg-white px-3 py-2"
                  >
                    <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-primary-soft/60 text-primary">
                      <UtensilsCrossed className="size-3" />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-[10px] font-semibold text-ink">{product.name}</p>
                      <p className="text-[9px] text-muted">{product.price}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section
            id="audit-trail"
            className="scroll-mt-24 rounded-2xl border border-line bg-white p-5 shadow-sm"
          >
            <CardHeader
              icon={Activity}
              title="Riwayat Status (Audit Trail)"
              subtitle="Rekam jejak kepatuhan dan kronologi modifikasi sistem"
              right={
                <span className="rounded border border-line px-2 py-0.5 font-mono text-[8px] font-bold uppercase tracking-wider text-muted">
                  Immutable Log
                </span>
              }
            />

            <ol className="relative mt-5 space-y-5 before:absolute before:bottom-1 before:left-[5px] before:top-1 before:w-px before:bg-line">
              {events.map((event) => (
                <li key={event.id} className="relative pl-6">
                  <span
                    className={`absolute left-0 top-1 size-[11px] rounded-full border-2 bg-white ${auditDotTones[event.tone]}`}
                  />
                  <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1">
                    <p className="text-xs font-bold text-ink">{event.title}</p>
                    <p className="text-[9px] text-muted">{formatAuditTime(event.at)}</p>
                  </div>
                  <p className="mt-1 text-[10px] leading-relaxed text-muted">{event.description}</p>
                  {(event.statusLabel || event.context) && (
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      {event.statusLabel && (
                        <span className="rounded border border-line bg-slate-50 px-2 py-0.5 text-[8px] font-semibold text-slate-600">
                          {event.statusLabel}
                        </span>
                      )}
                      {event.context && (
                        <span className="text-[9px] text-slate-400">{event.context}</span>
                      )}
                    </div>
                  )}
                </li>
              ))}
            </ol>
          </section>
        </div>

        <aside className="min-w-0 space-y-4 xl:sticky xl:top-24 xl:self-start">
          <section className="rounded-2xl border border-line bg-white p-5 shadow-sm">
            <div className="flex items-start gap-2.5">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-white">
                <ShieldCheck className="size-4" />
              </span>
              <div>
                <h2 className="text-sm font-bold text-ink">Keputusan Verifikasi</h2>
                <p className="mt-0.5 text-[10px] text-muted">Otoritas Superadmin Platform</p>
              </div>
            </div>

            <div className="mt-4 flex gap-2 rounded-xl bg-[#f4f5fa] p-3">
              <Info className="mt-0.5 size-3.5 shrink-0 text-primary" />
              <p className="text-[10px] leading-relaxed text-muted">
                Pemeriksaan data UMKM sebelum toko dapat tampil di katalog publik storefront dan
                melayani transaksi pembayaran nasional QRIS.
              </p>
            </div>

            <dl className="mt-3 divide-y divide-line text-[10px]">
              <div className="flex items-start justify-between gap-3 py-2.5">
                <dt className="text-muted">Kesesuaian Berkas NIB</dt>
                <dd
                  className={`text-right font-semibold ${
                    detail.nib ? 'text-emerald-600' : 'text-slate-500'
                  }`}
                >
                  {detail.nib ? 'Terverifikasi OSS' : 'Belum Terisi'}
                </dd>
              </div>
              <div className="flex items-start justify-between gap-3 py-2.5">
                <dt className="text-muted">Wilayah Cakupan Jangkauan</dt>
                <dd className="text-right font-semibold text-ink">{detail.region}</dd>
              </div>
              <div className="flex items-start justify-between gap-3 py-2.5">
                <dt className="text-muted">Standar Sanitasi F&amp;B</dt>
                <dd className="text-right font-semibold text-ink">Swa-Deklarasi OK</dd>
              </div>
            </dl>

            <div className="mt-4 space-y-2">
              {status === 'pending' && (
                <>
                  <button
                    type="button"
                    onClick={() => openDialog('approve')}
                    className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-primary text-xs font-semibold text-white transition hover:bg-primary-hover"
                  >
                    <Check className="size-4" />
                    Setujui Ketersediaan Publik
                  </button>
                  <button
                    type="button"
                    onClick={() => openDialog('reject')}
                    className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 text-xs font-semibold text-red-600 transition hover:bg-red-100"
                  >
                    <X className="size-4" />
                    Tolak Pendaftaran
                  </button>
                  <p className="text-[9px] leading-relaxed text-red-600">
                    Aksi penetapan mempublikasikan profil pedagang secara instan ke jutaan calon
                    pembeli Ratis.
                  </p>
                </>
              )}

              {status === 'aktif' && (
                <>
                  <div className="flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2.5 text-[10px] font-semibold text-emerald-700">
                    <CheckCircle2 className="size-3.5 shrink-0" />
                    Toko aktif dan tayang di storefront.
                  </div>
                  <button
                    type="button"
                    onClick={() => openDialog('deactivate')}
                    className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 text-xs font-semibold text-red-600 transition hover:bg-red-100"
                  >
                    <X className="size-4" />
                    Nonaktifkan Toko
                  </button>
                </>
              )}

              {status === 'nonaktif' && (
                <button
                  type="button"
                  onClick={() => openDialog('activate')}
                  className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-primary text-xs font-semibold text-white transition hover:bg-primary-hover"
                >
                  <Check className="size-4" />
                  Aktifkan Toko
                </button>
              )}

              {status === 'ditolak' && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
                  <p className="flex items-center gap-1.5 text-[10px] font-bold text-amber-800">
                    <XCircle className="size-3.5 shrink-0" />
                    Menunggu pengajuan ulang pemilik
                  </p>
                  <p className="mt-1 text-[9px] leading-relaxed text-amber-700">
                    Pemilik dapat memperbaiki data dan mengajukan ulang. Admin tidak dapat
                    mengaktifkan pendaftaran yang ditolak secara langsung.
                  </p>
                </div>
              )}
            </div>
          </section>

          <section className="rounded-2xl border border-line bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2">
              <ClipboardList className="size-4 text-amber-600" />
              <h2 className="text-xs font-bold text-ink">Pedoman Verifikator UMKM</h2>
            </div>
            <ul className="mt-3 space-y-2.5">
              {verifierGuidelines.map((guideline) => (
                <li
                  key={guideline}
                  className="flex gap-2 text-[10px] leading-relaxed text-muted"
                >
                  <Check className="mt-0.5 size-3 shrink-0 text-emerald-600" />
                  {guideline}
                </li>
              ))}
            </ul>
          </section>

          {status === 'pending' && (
            <section className="flex items-center gap-3 rounded-2xl border border-line bg-white p-4 shadow-sm">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                <Clock className="size-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-muted">
                  Target SLA Verifikasi
                </p>
                <p className="mt-0.5 text-[10px] text-slate-600">Batas waktu maksimal 24 jam</p>
              </div>
              <span
                className={`shrink-0 rounded-lg px-2.5 py-1 text-[10px] font-bold ${
                  remainingMs > 0 ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-600'
                }`}
              >
                {slaLabel}
              </span>
            </section>
          )}
        </aside>
      </div>

      <ConfirmDialog
        open={Boolean(dialog)}
        title={dialogCopy?.title ?? ''}
        description={dialogCopy?.description ?? ''}
        confirmLabel={dialogCopy?.confirmLabel ?? 'Konfirmasi'}
        tone={dialogCopy?.tone}
        confirmDisabled={reasonRequired ? reason.trim().length < 10 : false}
        onConfirm={handleConfirm}
        onClose={closeDialog}
      >
        {reasonRequired && (
          <div>
            <label
              htmlFor="decision-reason"
              className="mb-1.5 block text-xs font-semibold text-ink"
            >
              {dialog === 'reject' ? 'Alasan penolakan' : 'Alasan penonaktifan'}{' '}
              <span className="text-red-500">*</span>
            </label>
            <textarea
              id="decision-reason"
              rows={3}
              maxLength={300}
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder={
                dialog === 'reject'
                  ? 'Tuliskan alasan penolakan minimal 10 karakter...'
                  : 'Tuliskan alasan penonaktifan minimal 10 karakter...'
              }
              className="w-full resize-none rounded-xl border border-line bg-white px-3 py-2.5 text-xs text-ink outline-none transition placeholder:text-slate-400 focus:border-primary focus:ring-4 focus:ring-primary/10"
            />
            <div className="mt-1.5 flex items-center justify-between gap-3 text-[10px]">
              <span className={reason.trim().length < 10 ? 'text-red-500' : 'text-muted'}>
                {dialog === 'reject'
                  ? 'Alasan akan dilihat oleh pemilik toko. Wajib 10-300 karakter.'
                  : 'Wajib diisi 10-300 karakter.'}
              </span>
              <span className="text-muted">{reason.length}/300</span>
            </div>
          </div>
        )}
      </ConfirmDialog>

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
