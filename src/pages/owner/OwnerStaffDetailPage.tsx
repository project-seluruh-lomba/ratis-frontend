import { useEffect, useState, type ComponentType, type ReactNode } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import {
  AlertTriangle,
  ArrowLeft,
  BadgeCheck,
  Briefcase,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  CircleX,
  Clock3,
  Home,
  Info,
  KeyRound,
  LockKeyhole,
  LogIn,
  LogOut,
  Mail,
  MessageCircle,
  Monitor,
  Package,
  Pencil,
  Phone,
  Receipt,
  ShieldCheck,
  ShoppingBag,
  StickyNote,
  Store,
  Truck,
  User,
  UserCheck,
  UserX,
  Users,
  Wallet,
  Wifi,
  X,
} from 'lucide-react'
import ModalShell from '../../components/owner/ModalShell'
import ResetPasswordModal, {
  type ResetPasswordValues,
} from '../../components/owner/ResetPasswordModal'
import { getOwnerSession } from '../../lib/owner-auth'
import { formatWhatsappNumber, getWhatsappDigits } from '../../lib/owner-phone'
import {
  getOwnerStaffDetail,
  type StaffActivity,
  type StaffActivityCategory,
  type StaffActivityKind,
  type StaffActivityTagTone,
  type StaffDetailMetric,
  type StaffDetailMetricKey,
  type StaffMetricTone,
} from '../../lib/owner-staff-detail-data'
import {
  getAvailableStaffSlots,
  staffAvatarMeta,
  staffQuota,
  staffStatusMeta,
  updateOwnerStaffStatus,
} from '../../lib/owner-staff-data'

type ToastTone = 'success' | 'info' | 'danger'
type Toast = { message: string; tone: ToastTone }
type ModalKind = 'reset' | 'status' | 'force' | null
type ActivityFilter = 'Semua' | StaffActivityCategory

const activityFilters: ActivityFilter[] = ['Semua', 'Pesanan', 'Stok', 'Sesi Login']

const metricIcons: Record<StaffDetailMetricKey, ComponentType<{ className?: string }>> = {
  orders: ShoppingBag,
  pos: Wallet,
  stock: Package,
  device: Wifi,
}

const metricAccent: Record<
  StaffMetricTone,
  { icon: string; bar: string; badge: string }
> = {
  green: {
    icon: 'bg-[#e7f4f1] text-primary',
    bar: 'bg-primary',
    badge: 'bg-[#dcfce7] text-[#15803d]',
  },
  blue: {
    icon: 'bg-[#e8efff] text-[#3b5bdb]',
    bar: 'bg-[#3b5bdb]',
    badge: 'bg-[#eef2ff] text-[#3b5bdb]',
  },
  teal: {
    icon: 'bg-[#e6f7f4] text-[#0f766e]',
    bar: 'bg-[#0f766e]',
    badge: 'bg-[#dcf7ee] text-[#0f766e]',
  },
  slate: {
    icon: 'bg-[#eef2f7] text-slate-600',
    bar: 'bg-slate-400',
    badge: 'bg-[#e2e8f0] text-slate-600',
  },
}

const activityIconMeta: Record<
  StaffActivityKind,
  { icon: ComponentType<{ className?: string }>; box: string }
> = {
  check: { icon: CheckCircle2, box: 'bg-[#dcfce7] text-emerald-600' },
  order: { icon: ShoppingBag, box: 'bg-[#e8efff] text-[#3b5bdb]' },
  stock: { icon: Package, box: 'bg-[#e6f7f4] text-primary' },
  login: { icon: LogIn, box: 'bg-[#eef2ff] text-[#4f46e5]' },
  receipt: { icon: Receipt, box: 'bg-[#eef2ff] text-slate-500' },
  packing: { icon: Truck, box: 'bg-[#fdf0d9] text-[#a16207]' },
  warning: { icon: AlertTriangle, box: 'bg-[#fde7e7] text-red-500' },
}

const activityTagTone: Record<StaffActivityTagTone, string> = {
  green: 'bg-[#dcfce7] text-[#15803d]',
  blue: 'bg-[#eef2ff] text-[#3b5bdb]',
  amber: 'bg-[#fef3c7] text-[#b45309]',
  slate: 'bg-[#e2e8f0] text-[#475569]',
}

function DetailBreadcrumb({ name }: { name?: string }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <nav className="flex flex-wrap items-center gap-2 text-[11px] font-medium text-slate-500">
        <Link
          to="/owner/dashboard"
          className="flex items-center gap-1.5 transition hover:text-primary"
        >
          <Home className="size-3.5" />
          Ratis Bisnis
        </Link>
        <span className="text-slate-300">/</span>
        <Link to="/owner/pengaturan-usaha" className="transition hover:text-primary">
          Pengaturan Usaha
        </Link>
        <span className="text-slate-300">/</span>
        <Link to="/owner/kelola-staf" className="transition hover:text-primary">
          Staf Toko
        </Link>
        {name ? (
          <>
            <span className="text-slate-300">/</span>
            <span className="font-medium text-ink">Detail Staf: {name}</span>
          </>
        ) : null}
      </nav>
      <Link
        to="/owner/kelola-staf"
        className="inline-flex items-center gap-1.5 self-start text-[11px] font-semibold text-slate-600 transition hover:text-primary sm:self-auto"
      >
        <ArrowLeft className="size-3.5" />
        Kembali ke Daftar Staf
      </Link>
    </div>
  )
}

function ConfirmModal({
  title,
  description,
  confirmLabel,
  tone = 'primary',
  icon: Icon,
  onCancel,
  onConfirm,
}: {
  title: string
  description: string
  confirmLabel: string
  tone?: 'primary' | 'danger'
  icon: ComponentType<{ className?: string }>
  onCancel: () => void
  onConfirm: () => void
}) {
  return (
    <ModalShell labelledBy="staff-confirm-title" onClose={onCancel}>
      <div className="flex items-start justify-between gap-3">
        <span
          className={`flex size-11 items-center justify-center rounded-xl ${
            tone === 'danger'
              ? 'bg-red-50 text-red-600'
              : 'bg-primary-soft/60 text-primary'
          }`}
        >
          <Icon className="size-5" />
        </span>
        <button
          type="button"
          onClick={onCancel}
          aria-label="Tutup dialog"
          className="flex size-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
        >
          <X className="size-4" />
        </button>
      </div>
      <h2 id="staff-confirm-title" className="mt-4 text-[18px] font-bold text-ink">
        {title}
      </h2>
      <p className="mt-2 text-[12.5px] leading-relaxed text-slate-500">{description}</p>
      <div className="mt-6 flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="h-10 rounded-xl border border-line px-4 text-[12px] font-semibold text-slate-600 transition hover:bg-slate-50"
        >
          Batal
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className={`h-10 rounded-xl px-4 text-[12px] font-semibold text-white transition ${
            tone === 'danger'
              ? 'bg-red-600 hover:bg-red-700'
              : 'bg-primary hover:bg-primary-hover'
          }`}
        >
          {confirmLabel}
        </button>
      </div>
    </ModalShell>
  )
}

const deactivationReasons = [
  'Rotasi Shift / Cuti Sementara',
  'Pelanggaran SOP Operasional',
  'Evaluasi Kinerja Internal',
  'Masa Kontrak / Magang Selesai',
  'Permintaan Pengunduran Diri Staf',
  'Lainnya (catat pada catatan internal)',
]

function DeactivateStaffModal({
  staffName,
  staffInitials,
  staffAvatarClassName,
  staffCode,
  staffEmail,
  shiftName,
  deviceLabel,
  completedOrders,
  slotsAfterDeactivation,
  ownerName,
  onClose,
  onConfirm,
}: {
  staffName: string
  staffInitials: string
  staffAvatarClassName: string
  staffCode: string
  staffEmail: string
  shiftName: string
  deviceLabel: string
  completedOrders: string
  slotsAfterDeactivation: number
  ownerName: string
  onClose: () => void
  onConfirm: (reason: string, note: string) => void
}) {
  const [reason, setReason] = useState(deactivationReasons[0])
  const [note, setNote] = useState('')
  const [auditId] = useState(
    () =>
      `#SEC-DEACT-${new Date().getFullYear()}-${Math.floor(10 + Math.random() * 89)}`,
  )

  return (
    <ModalShell
      labelledBy="deactivate-staff-title"
      onClose={onClose}
      width="max-w-[520px]"
    >
      <div className="-mx-5 -mt-5 h-1.5 bg-gradient-to-r from-[#f5b301] via-[#22c55e] to-[#dc2626] sm:-mx-6 sm:-mt-6" />

      <div className="mt-4 flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[#fde7e7] text-[#dc2626]">
            <AlertTriangle className="size-5" />
          </span>
          <div>
            <p className="text-[9.5px] font-bold uppercase tracking-[0.12em] text-[#dc2626]">
              Konfirmasi Keamanan Toko
            </p>
            <h2
              id="deactivate-staff-title"
              className="mt-1 text-[17px] font-bold leading-snug text-ink sm:text-[18px]"
            >
              Nonaktifkan Akses Staf Toko?
            </h2>
            <p className="mt-1.5 text-[11.5px] leading-relaxed text-slate-500">
              Tindakan ini akan menghentikan seluruh wewenang operasional kasir secara
              seketika.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Tutup modal nonaktifkan staf"
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
          <p className="mt-0.5 truncate text-[10.5px] text-slate-500">{staffEmail}</p>
        </div>
        <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-[9.5px] font-semibold text-slate-600">
          <span className="size-1.5 rounded-full bg-emerald-500" />
          {shiftName}
        </span>
      </div>

      <div className="mt-3.5 rounded-xl border border-[#fbe3bb] bg-[#fff8ec] px-3.5 py-3">
        <p className="flex items-center gap-1.5 text-[11px] font-bold text-[#b45309]">
          <AlertTriangle className="size-3.5 shrink-0" />
          Dampak Langsung Penonaktifan:
        </p>
        <ul className="mt-2 list-disc space-y-1.5 pl-4 text-[10.5px] leading-relaxed text-slate-600 marker:text-[#b45309]">
          <li>
            Staf akan <span className="font-semibold text-ink">langsung dikeluarkan
            (force log-out)</span> dari sesi aktif di{' '}
            <span className="font-semibold text-ink">{deviceLabel}</span>.
          </li>
          <li>
            Akses login staf dicabut seketika. Staf{' '}
            <span className="font-semibold text-ink">tidak dapat memproses pesanan
            baru</span>, melayani meja kasir, atau mengubah stok bahan.
          </li>
          <li>
            Slot kuota staf Anda akan bertambah{' '}
            <span className="font-semibold text-ink">1 slot kosong</span> (menjadi{' '}
            {slotsAfterDeactivation} slot kosong dari total {staffQuota} kuota paket UMKM).
          </li>
        </ul>
      </div>

      <div className="mt-3 rounded-xl bg-[#eef2ff] px-3.5 py-3">
        <p className="flex items-center gap-1.5 text-[11px] font-bold text-[#3b5bdb]">
          <ShieldCheck className="size-3.5 shrink-0" />
          Jaminan Integritas &amp; Rekam Jejak Audit:
        </p>
        <p className="mt-2 text-[10.5px] leading-relaxed text-slate-600">
          Riwayat <span className="font-semibold text-ink">{completedOrders} pesanan
          selesai</span>, catatan opname pagi, dan log kasir yang pernah dikerjakan oleh{' '}
          {staffName} <span className="font-semibold text-ink">TETAP TERSIMPAN ABADI</span>{' '}
          dan tidak akan pernah terhapus demi akuntabilitas pembukuan toko.
        </p>
        <p className="mt-2 flex items-center gap-1.5 text-[10px] font-semibold text-[#3b5bdb]">
          <CheckCircle2 className="size-3.5 shrink-0" />
          Aksi ini dapat diaktifkan kembali sewaktu-waktu oleh Pemilik Toko.
        </p>
      </div>

      <div className="mt-4">
        <label
          htmlFor="deactivation-reason"
          className="text-[11px] font-medium text-ink"
        >
          Alasan Penonaktifan{' '}
          <span className="text-[9.5px] text-slate-400">
            (Wajib dicatat untuk histori UMKM)
          </span>
        </label>
        <div className="relative mt-1.5">
          <select
            id="deactivation-reason"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            className="h-10 w-full appearance-none rounded-xl border border-line bg-white pl-3.5 pr-9 text-[11.5px] text-ink outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
          >
            {deactivationReasons.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
        </div>
      </div>

      <div className="mt-3.5">
        <label
          htmlFor="deactivation-note"
          className="text-[11px] font-medium text-ink"
        >
          Catatan Internal Pemilik{' '}
          <span className="text-[9.5px] text-slate-400">
            (Opsional, hanya dibaca oleh {ownerName})
          </span>
        </label>
        <textarea
          id="deactivation-note"
          rows={2}
          maxLength={240}
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder="Contoh: Mengambil cuti persiapan wisuda hingga akhir bulan, akses POS dialihkan ke staf cadangan..."
          className="mt-1.5 w-full resize-none rounded-xl border border-line bg-white px-3.5 py-2.5 text-[11.5px] leading-relaxed text-ink outline-none transition placeholder:text-slate-400 focus:border-primary focus:ring-4 focus:ring-primary/10"
        />
      </div>

      <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-center">
        <button
          type="button"
          onClick={onClose}
          className="h-10 rounded-xl border border-line bg-[#f8fafc] px-5 text-[11.5px] font-semibold text-slate-600 transition hover:bg-slate-100"
        >
          Batal, Pertahankan Akun
        </button>
        <button
          type="button"
          onClick={() => onConfirm(reason, note.trim())}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#dc2626] px-5 text-[11.5px] font-semibold text-white transition hover:bg-[#b91c1c]"
        >
          <UserX className="size-3.5" />
          Ya, Nonaktifkan Akses Staf
        </button>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3 border-t border-line bg-[#f8fafc] px-3.5 py-2.5 -mx-5 -mb-5 rounded-b-2xl sm:-mx-6 sm:-mb-6">
        <p className="flex items-center gap-1.5 text-[9px] font-medium text-slate-500">
          <LockKeyhole className="size-3 shrink-0" />
          Sistem Autentikasi Enkripsi POS Ratis
        </p>
        <p className="shrink-0 text-[9px] font-semibold text-slate-500">
          Audit ID: <span className="font-mono">{auditId}</span>
        </p>
      </div>
    </ModalShell>
  )
}

function ProfileField({
  icon: Icon,
  label,
  value,
  helper,
  extra,
}: {
  icon: ComponentType<{ className?: string }>
  label: string
  value: string
  helper?: string
  extra?: ReactNode
}) {
  return (
    <div className="min-w-0">
      <p className="text-[9.5px] font-bold uppercase tracking-[0.08em] text-slate-400">
        {label}
      </p>
      <div className="mt-1.5 flex flex-wrap items-center gap-2">
        <Icon className="size-4 shrink-0 text-slate-500" />
        <p className="min-w-0 break-words text-[12.5px] font-semibold text-ink">{value}</p>
        {extra}
      </div>
      {helper ? (
        <p className="mt-1 pl-6 text-[10.5px] leading-relaxed text-slate-400">{helper}</p>
      ) : null}
    </div>
  )
}

function MetricCard({ metric }: { metric: StaffDetailMetric }) {
  const Icon = metricIcons[metric.key]
  const accent = metricAccent[metric.accent]
  const isDevice = metric.key === 'device'
  const online = isDevice && metric.progress > 0

  return (
    <div className="rounded-2xl border border-line bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.06)]">
      <div className="flex items-start justify-between gap-2">
        <p className="text-[9.5px] font-bold uppercase tracking-[0.08em] text-slate-500">
          {metric.label}
        </p>
        <span
          className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${accent.icon}`}
        >
          <Icon className="size-4" />
        </span>
      </div>
      <div className="mt-3 flex flex-wrap items-end justify-between gap-2">
        <p
          className={`flex items-center gap-1.5 font-extrabold leading-tight text-ink ${
            isDevice ? 'text-[16px]' : 'text-[23px]'
          }`}
        >
          {online ? <span className="size-2 shrink-0 rounded-full bg-emerald-500" /> : null}
          {metric.value}
        </p>
        {metric.badge ? (
          <span
            className={`rounded-full px-2 py-0.5 text-[9.5px] font-bold ${accent.badge}`}
          >
            {metric.badge}
          </span>
        ) : null}
      </div>
      <p className="mt-1 text-[10.5px] leading-relaxed text-slate-500">{metric.helper}</p>
      {isDevice ? (
        <div className="mt-3 flex items-center justify-between gap-2 border-t border-line pt-2.5 text-[9.5px]">
          <span className="truncate text-slate-400">{metric.meta}</span>
          <span
            className={`shrink-0 font-semibold ${online ? 'text-primary' : 'text-slate-400'}`}
          >
            {online ? 'Sesi Aktif' : 'Tidak Aktif'}
          </span>
        </div>
      ) : (
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100">
          <div
            className={`h-full rounded-full ${accent.bar}`}
            style={{ width: `${metric.progress}%` }}
          />
        </div>
      )}
    </div>
  )
}

function ActivityTimeline({ activities }: { activities: StaffActivity[] }) {
  if (activities.length === 0) {
    return (
      <div className="mt-5 rounded-xl border border-dashed border-line px-4 py-10 text-center">
        <span className="mx-auto flex size-10 items-center justify-center rounded-full bg-slate-100 text-slate-400">
          <Receipt className="size-5" />
        </span>
        <p className="mt-3 text-[12px] font-semibold text-ink">Belum ada aktivitas</p>
        <p className="mt-1 text-[10.5px] text-slate-500">
          Tidak ada log pada kategori yang dipilih.
        </p>
      </div>
    )
  }

  return (
    <ol className="mt-5">
      {activities.map((activity, index) => {
        const meta = activityIconMeta[activity.kind]
        const Icon = meta.icon

        return (
          <li key={activity.id} className="relative flex gap-3 pb-5 last:pb-0">
            {index < activities.length - 1 ? (
              <span
                className="absolute left-4 top-8 h-[calc(100%-1.25rem)] w-px bg-line"
                aria-hidden
              />
            ) : null}
            <span
              className={`relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full ${meta.box}`}
            >
              <Icon className="size-4" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1">
                <div className="flex min-w-0 flex-wrap items-center gap-2">
                  <p className="text-[12.5px] font-semibold text-ink">{activity.title}</p>
                  {activity.reference ? (
                    <span className="rounded bg-[#eef2ff] px-1.5 py-0.5 text-[9px] font-semibold text-[#3b5bdb]">
                      {activity.reference}
                    </span>
                  ) : null}
                  {activity.tag ? (
                    <span
                      className={`rounded-full px-2 py-0.5 text-[9px] font-semibold ${activityTagTone[activity.tag.tone]}`}
                    >
                      {activity.tag.label}
                    </span>
                  ) : null}
                </div>
                <span className="shrink-0 text-[9.5px] font-medium text-slate-400">
                  {activity.time}
                </span>
              </div>
              <p className="mt-1 text-[11px] leading-relaxed text-slate-500">
                {activity.description}
              </p>
              {activity.meta ? (
                <p className="mt-1.5 flex items-center gap-1.5 text-[10px] text-slate-400">
                  <Receipt className="size-3 shrink-0" />
                  {activity.meta}
                </p>
              ) : null}
            </div>
          </li>
        )
      })}
    </ol>
  )
}

export default function OwnerStaffDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const [session] = useState(getOwnerSession)
  const [, setRefreshKey] = useState(0)
  const [forceLoggedOut, setForceLoggedOut] = useState(false)
  const [modal, setModal] = useState<ModalKind>(null)
  const [activityFilter, setActivityFilter] = useState<ActivityFilter>('Semua')
  const [showAllActivities, setShowAllActivities] = useState(false)
  const [toast, setToast] = useState<Toast | null>(() => {
    const state = location.state as { toast?: string } | null
    return state?.toast ? { message: state.toast, tone: 'success' } : null
  })

  const storeName = session?.storeName ?? 'Dapur Bu Sari'
  const ownerName = session?.name ?? 'Pemilik Toko'

  const detail = id
    ? getOwnerStaffDetail(id, storeName, { forceLoggedOut })
    : undefined

  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => setToast(null), 4000)
    return () => window.clearTimeout(timer)
  }, [toast])

  useEffect(() => {
    if (!location.state) return
    navigate(location.pathname, { replace: true })
  }, [location.pathname, location.state, navigate])

  const filteredActivities = detail
    ? detail.activities.filter(
        (activity) => activityFilter === 'Semua' || activity.category === activityFilter,
      )
    : []
  const visibleActivities = showAllActivities
    ? filteredActivities
    : filteredActivities.slice(0, 5)

  function showToast(message: string, tone: ToastTone = 'success') {
    setToast({ message, tone })
  }

  function refreshDetail() {
    setRefreshKey((current) => current + 1)
  }

  function handleActivate() {
    if (!detail) return

    updateOwnerStaffStatus(detail.staff.id, 'Aktif')
    setForceLoggedOut(false)
    setModal(null)
    refreshDetail()
    showToast(`${detail.staff.name} berhasil diaktifkan kembali.`)
  }

  function handleDeactivate(reason: string) {
    if (!detail) return

    updateOwnerStaffStatus(detail.staff.id, 'Nonaktif')
    setForceLoggedOut(false)
    setModal(null)
    refreshDetail()
    showToast(`Akses ${detail.staff.name} dinonaktifkan (${reason}).`, 'danger')
  }

  function handleResetPassword(values: ResetPasswordValues) {
    if (!detail) return

    const whatsapp = formatWhatsappNumber(detail.staff.phone)

    if (values.forceLogout) setForceLoggedOut(true)
    setModal(null)
    refreshDetail()

    if (values.mode === 'link') {
      showToast(
        values.sendWhatsapp
          ? `Tautan reset sandi dikirim ke ${detail.staff.email} dan WhatsApp ${whatsapp}.`
          : `Tautan reset sandi dikirim ke ${detail.staff.email}.`,
        'info',
      )
      return
    }

    showToast(
      values.sendWhatsapp
        ? `Sandi ${detail.staff.name} berhasil diperbarui dan rinciannya dikirim ke WhatsApp ${whatsapp}.`
        : `Sandi ${detail.staff.name} berhasil diperbarui.`,
    )
  }

  function handleForceLogout() {
    if (!detail) return
    setForceLoggedOut(true)
    setModal(null)
    showToast(`${detail.staff.name} dikeluarkan dari semua perangkat.`)
  }

  if (!detail) {
    return (
      <div>
        <DetailBreadcrumb />
        <section className="mt-6 rounded-2xl border border-line bg-white px-6 py-16 text-center shadow-[0_1px_2px_rgba(15,23,42,0.06)]">
          <span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
            <UserX className="size-7" />
          </span>
          <h1 className="mt-4 text-[20px] font-extrabold tracking-tight text-ink">
            Staf tidak ditemukan
          </h1>
          <p className="mx-auto mt-2 max-w-md text-[12px] leading-relaxed text-slate-500">
            Data staf yang Anda cari tidak tersedia atau sudah tidak terdaftar di toko ini.
          </p>
          <Link
            to="/owner/kelola-staf"
            className="mt-5 inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-5 text-[12px] font-semibold text-white transition hover:bg-primary-hover"
          >
            <ArrowLeft className="size-4" />
            Kembali ke Daftar Staf
          </Link>
        </section>
      </div>
    )
  }

  const isActive = detail.staff.status === 'Aktif'
  const deviceHelper =
    detail.metrics.find((metric) => metric.key === 'device')?.helper ?? ''
  const deviceParts = deviceHelper.split(' • ')
  const deviceLabel =
    detail.session.status === 'Online' && deviceParts.length > 1
      ? `${deviceParts[0]} (${deviceParts.slice(1).join(' ')})`
      : detail.session.deviceName
  const whatsappDigits = getWhatsappDigits(detail.staff.phone)
  const whatsappHref = whatsappDigits ? `https://wa.me/${whatsappDigits}` : undefined

  return (
    <div>
      <DetailBreadcrumb name={detail.staff.name} />

      <section className="mt-4 rounded-2xl border border-line bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.06)] sm:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex min-w-0 items-start gap-4">
            <span
              className={`relative flex size-16 shrink-0 items-center justify-center rounded-2xl text-[18px] font-extrabold ${staffAvatarMeta[detail.staff.avatarColor]}`}
            >
              {detail.staff.avatarInitials}
              <span
                className={`absolute -bottom-1 -right-1 size-4 rounded-full border-2 border-white ${staffStatusMeta[detail.staff.status].dot}`}
              />
            </span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-[24px] font-extrabold tracking-tight text-ink sm:text-[26px]">
                  {detail.staff.name}
                </h1>
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10.5px] font-semibold ${staffStatusMeta[detail.staff.status].badge}`}
                >
                  <span
                    className={`size-1.5 rounded-full ${staffStatusMeta[detail.staff.status].dot}`}
                  />
                  {detail.staff.status}
                </span>
                <span className="rounded-full border border-line bg-[#f8fafc] px-2.5 py-1 text-[10.5px] font-semibold text-slate-500">
                  # {detail.staffCode}
                </span>
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11.5px] text-slate-600">
                <span className="inline-flex items-center gap-1.5">
                  <Briefcase className="size-3.5 text-slate-500" />
                  {detail.staff.role}
                </span>
                <span className="hidden h-3 w-px bg-line sm:block" />
                <span className="inline-flex items-center gap-1.5">
                  <Clock3 className="size-3.5 text-slate-500" />
                  {detail.shiftName}
                  <span className="text-slate-400">({detail.shiftTime})</span>
                </span>
              </div>

              <p className="mt-2 inline-flex items-center gap-1.5 text-[10.5px] font-semibold text-slate-500">
                <BadgeCheck className="size-3.5 text-primary" />
                Terverifikasi Pemilik
              </p>
            </div>
          </div>

          <div className="flex w-full flex-col gap-2 lg:w-auto lg:items-end">
            <div className="grid grid-cols-2 gap-2 sm:flex">
              <button
                type="button"
                onClick={() => setModal('reset')}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-line bg-white px-4 text-[11.5px] font-semibold text-slate-600 transition hover:bg-slate-50"
              >
                <KeyRound className="size-3.5" />
                Reset Sandi
              </button>
              <button
                type="button"
                onClick={() =>
                  navigate(`/owner/kelola-staf/detail-staf/${detail.staff.id}/ubah`)
                }
                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-primary/20 bg-[#e7f4f1] px-4 text-[11.5px] font-semibold text-primary transition hover:bg-primary-soft"
              >
                <Pencil className="size-3.5" />
                Ubah Data Staf
              </button>
            </div>
            <button
              type="button"
              onClick={() => setModal('status')}
              className={`inline-flex h-10 items-center justify-center gap-2 rounded-xl px-4 text-[11.5px] font-semibold transition ${
                isActive
                  ? 'bg-[#fde7e7] text-red-600 hover:bg-red-100'
                  : 'bg-[#dcf7ee] text-primary hover:bg-primary-soft'
              }`}
            >
              {isActive ? <UserX className="size-3.5" /> : <UserCheck className="size-3.5" />}
              {isActive ? 'Nonaktifkan Akses' : 'Aktifkan Akses'}
            </button>
          </div>
        </div>

        {!isActive ? (
          <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-red-100 bg-red-50 px-3.5 py-2.5 text-[11px] leading-relaxed text-red-700">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" />
            <p>
              <span className="font-semibold">Akses akun sedang dicabut.</span> Staf tidak
              dapat login sampai pemilik mengaktifkan kembali aksesnya.
            </p>
          </div>
        ) : null}
      </section>

      <section className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {detail.metrics.map((metric) => (
          <MetricCard key={metric.key} metric={metric} />
        ))}
      </section>

      <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-5">
          <section className="rounded-2xl border border-line bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.06)] sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="flex items-center gap-2.5 text-[14px] font-bold text-ink">
                <span className="flex size-8 items-center justify-center rounded-lg bg-[#eef2ff] text-[#3b5bdb]">
                  <User className="size-4" />
                </span>
                Informasi Profil &amp; Kontak Staf
              </h2>
              <button
                type="button"
                onClick={() =>
                  navigate(`/owner/kelola-staf/detail-staf/${detail.staff.id}/ubah`)
                }
                className="inline-flex items-center gap-1.5 text-[10.5px] font-semibold text-primary transition hover:text-primary-hover"
              >
                <Pencil className="size-3.5" />
                Sunting Data
              </button>
            </div>

            <div className="mt-5 grid gap-x-8 gap-y-5 sm:grid-cols-2">
              <ProfileField
                icon={User}
                label="Nama Lengkap KTP"
                value={detail.staff.name}
                helper="Sesuai KTP"
              />
              <ProfileField
                icon={Mail}
                label="Email Akun Login"
                value={detail.staff.email}
                extra={
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-semibold ${
                      isActive
                        ? 'bg-[#dcfce7] text-[#15803d]'
                        : 'bg-[#e2e8f0] text-slate-500'
                    }`}
                  >
                    <CheckCircle2 className="size-3" />
                    {isActive ? 'Aktif' : 'Nonaktif'}
                  </span>
                }
              />
              <ProfileField
                icon={Phone}
                label="Nomor WhatsApp Operasional"
                value={formatWhatsappNumber(detail.staff.phone)}
                extra={
                  whatsappHref ? (
                    <a
                      href={whatsappHref}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex h-6 items-center gap-1 rounded-md bg-[#dcfce7] px-2 text-[9px] font-semibold text-[#15803d] transition hover:bg-[#bbf7d0]"
                    >
                      <MessageCircle className="size-3" />
                      Kirim Pesan
                    </a>
                  ) : null
                }
              />
              <ProfileField
                icon={CalendarDays}
                label="Tanggal Bergabung Toko"
                value={detail.joinedAt}
                helper={detail.tenure}
              />
              <ProfileField
                icon={Clock3}
                label="Jadwal Shift Rutin"
                value={detail.shiftName}
                helper={detail.shiftTime}
              />
              <ProfileField
                icon={Store}
                label="Penempatan Cabang"
                value={detail.branch}
              />
            </div>

            <div className="mt-5 rounded-xl border border-[#dbe3f4] bg-[#eef2ff]/50 p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <p className="flex items-center gap-2 text-[11.5px] font-semibold text-[#3b5bdb]">
                  <StickyNote className="size-3.5 shrink-0" />
                  Catatan Internal Pemilik (Hanya Dilihat {ownerName})
                </p>
                <span className="text-[9.5px] font-medium text-slate-400">
                  {detail.internalNoteUpdated}
                </span>
              </div>
              <p className="mt-3 text-[11.5px] italic leading-relaxed text-slate-600">
                &ldquo;{detail.internalNote}&rdquo;
              </p>
            </div>
          </section>

          <section className="rounded-2xl border border-line bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.06)] sm:p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-start gap-2.5">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#eef2ff] text-[#3b5bdb]">
                  <Clock3 className="size-4" />
                </span>
                <div>
                  <h2 className="text-[14px] font-bold text-ink">
                    Jejak Audit &amp; Aktivitas Terkini
                  </h2>
                  <p className="mt-0.5 text-[10.5px] leading-relaxed text-slate-500">
                    Log rekaman aktivitas operasional staf secara realtime
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {activityFilters.map((filter) => (
                  <button
                    key={filter}
                    type="button"
                    onClick={() => {
                      setActivityFilter(filter)
                      setShowAllActivities(false)
                    }}
                    className={`rounded-full px-3 py-1.5 text-[10px] font-semibold transition ${
                      activityFilter === filter
                        ? 'bg-[#d8f5ec] text-primary'
                        : 'bg-[#f8fafc] text-slate-500 hover:bg-slate-100'
                    }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>
            </div>

            <ActivityTimeline activities={visibleActivities} />

            {filteredActivities.length > 5 ? (
              <div className="mt-2 border-t border-line pt-4 text-center">
                <button
                  type="button"
                  onClick={() => setShowAllActivities((current) => !current)}
                  className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-primary transition hover:text-primary-hover"
                >
                  {showAllActivities
                    ? 'Tampilkan Lebih Sedikit'
                    : 'Tampilkan Seluruh Log Aktivitas Staf'}
                  <ChevronDown
                    className={`size-3.5 transition ${showAllActivities ? 'rotate-180' : ''}`}
                  />
                </button>
              </div>
            ) : null}
          </section>
        </div>

        <aside className="space-y-5">
          <section className="rounded-2xl border border-line bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.06)]">
            <div className="flex items-start gap-2.5">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#e7f4f1] text-primary">
                <ShieldCheck className="size-5" />
              </span>
              <div>
                <h2 className="text-[14px] font-bold text-ink">Hak Akses Modul</h2>
                <p className="mt-0.5 text-[10.5px] text-slate-500">
                  Level Peran: {detail.roleLevel}
                </p>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-3 rounded-xl bg-[#eef2ff] px-3.5 py-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-white text-[#3b5bdb]">
                <Users className="size-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-medium text-slate-500">
                  Penggunaan Kuota Staf
                </p>
                <p className="mt-0.5 text-[11.5px] font-bold text-ink">
                  {detail.quotaPosition}
                </p>
              </div>
              <span className="shrink-0 rounded-full bg-white px-2 py-1 text-[9px] font-bold text-[#3b5bdb]">
                {isActive ? 'Aktif' : 'Dicabut'}
              </span>
            </div>

            {!isActive ? (
              <p className="mt-4 rounded-lg bg-[#fef2f2] px-3 py-2 text-[10px] leading-relaxed text-red-600">
                Akses modul sedang dicabut karena akun nonaktif.
              </p>
            ) : null}

            <div className="mt-5 flex items-center justify-between gap-2">
              <p className="text-[9.5px] font-bold uppercase tracking-[0.08em] text-slate-500">
                Modul Diberikan Akses (Aktif)
              </p>
              <span className="text-[9px] font-semibold text-primary">
                {detail.accessModules.length} Modul Terbuka
              </span>
            </div>
            <ul
              className={`mt-2.5 space-y-2 ${
                isActive ? '' : 'opacity-60'
              }`}
            >
              {detail.accessModules.map((module) => (
                <li
                  key={module.key}
                  className="flex items-start gap-2.5 rounded-lg border border-[#d9f2e8] bg-[#f7fdfb] p-2.5"
                >
                  <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-[#dcfce7] text-emerald-600">
                    <CheckCircle2 className="size-3.5" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold text-ink">{module.title}</p>
                    <p className="mt-0.5 text-[9.5px] leading-relaxed text-slate-500">
                      {module.description}
                    </p>
                  </div>
                </li>
              ))}
            </ul>

            <div className="mt-5 flex items-center justify-between gap-2">
              <p className="text-[9.5px] font-bold uppercase tracking-[0.08em] text-slate-500">
                Modul Dibatasi (Terkunci)
              </p>
              <span className="text-[8.5px] font-bold uppercase tracking-wide text-red-500">
                Khusus Pemilik
              </span>
            </div>
            <ul className="mt-2.5 space-y-2">
              {detail.restrictedModules.map((module) => (
                <li
                  key={module.key}
                  className="flex items-start gap-2.5 rounded-lg border border-line bg-[#f8fafc] p-2.5"
                >
                  <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-[#e2e8f0] text-slate-500">
                    <LockKeyhole className="size-3" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[10.5px] font-semibold text-slate-500">
                      {module.title}
                    </p>
                    <p className="mt-0.5 text-[9.5px] leading-relaxed text-slate-400">
                      {module.description}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-2xl border border-line bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.06)]">
            <div className="flex items-start gap-2.5">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#e7f4f1] text-primary">
                <ShieldCheck className="size-5" />
              </span>
              <div>
                <h2 className="text-[14px] font-bold text-ink">Keamanan &amp; Sesi Login</h2>
                <p className="mt-0.5 text-[10.5px] text-slate-500">
                  Manajemen otentikasi akun kasir
                </p>
              </div>
            </div>

            <div className="mt-4 rounded-xl border border-line p-3.5">
              <div className="flex items-start justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2">
                  <Monitor className="size-4 shrink-0 text-slate-500" />
                  <p className="truncate text-[11.5px] font-semibold text-ink">
                    {detail.session.deviceName}
                  </p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-[9px] font-bold ${
                    detail.session.status === 'Online'
                      ? 'bg-[#dcfce7] text-[#15803d]'
                      : 'bg-[#e2e8f0] text-slate-500'
                  }`}
                >
                  {detail.session.status}
                </span>
              </div>
              <p className="mt-2 text-[10.5px] leading-relaxed text-slate-500">
                {detail.session.detail}
              </p>
              {detail.session.ip !== '-' ? (
                <p className="mt-1 text-[10px] text-slate-400">IP: {detail.session.ip}</p>
              ) : null}
            </div>

            <p className="mt-3 text-[10.5px] leading-relaxed text-slate-500">
              Sandi Terakhir Diganti:{' '}
              <span className="font-semibold text-slate-700">
                {detail.session.passwordChanged}
              </span>
            </p>

            <button
              type="button"
              disabled={detail.session.status === 'Offline'}
              onClick={() => setModal('force')}
              className="mt-3 flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-3 text-[10.5px] font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-400 disabled:hover:bg-white"
            >
              <LogOut className="size-3.5" />
              Keluarkan dari Semua Perangkat (Force Logout)
            </button>
          </section>

          <section className="rounded-2xl bg-[#e7f4f1] p-5">
            <span className="flex size-9 items-center justify-center rounded-xl bg-white/70 text-primary">
              <ShieldCheck className="size-5" />
            </span>
            <h2 className="mt-3 text-[13px] font-bold text-ink">
              Integritas Audit Trail Ratis
            </h2>
            <p className="mt-1.5 text-[10.5px] leading-relaxed text-slate-600">
              Jejak audit dan aktivitas operasional staf dienkripsi secara digital dan tidak
              dapat diubah maupun dihapus oleh pihak mana pun demi integritas transparansi
              pembukuan UMKM {storeName}.
            </p>
          </section>
        </aside>
      </div>

      {modal === 'reset' ? (
        <ResetPasswordModal
          staffName={detail.staff.name}
          staffInitials={detail.staff.avatarInitials}
          staffAvatarClassName={staffAvatarMeta[detail.staff.avatarColor]}
          staffCode={detail.staffCode}
          role={detail.staff.role}
          email={detail.staff.email}
          whatsappNumber={formatWhatsappNumber(detail.staff.phone)}
          sessionStatus={detail.session.status}
          sessionDevice={
            detail.session.status === 'Online' ? deviceHelper : detail.session.deviceName
          }
          onClose={() => setModal(null)}
          onConfirm={handleResetPassword}
        />
      ) : null}

      {modal === 'status' && isActive ? (
        <DeactivateStaffModal
          staffName={detail.staff.name}
          staffInitials={detail.staff.avatarInitials}
          staffAvatarClassName={staffAvatarMeta[detail.staff.avatarColor]}
          staffCode={detail.staffCode}
          staffEmail={detail.staff.email}
          shiftName={detail.shiftName}
          deviceLabel={deviceLabel}
          completedOrders={
            detail.metrics.find((metric) => metric.key === 'orders')?.value ?? '0'
          }
          slotsAfterDeactivation={getAvailableStaffSlots() + 1}
          ownerName={ownerName}
          onClose={() => setModal(null)}
          onConfirm={handleDeactivate}
        />
      ) : null}

      {modal === 'status' && !isActive ? (
        <ConfirmModal
          icon={UserCheck}
          title="Aktifkan kembali akses staf?"
          description={`${detail.staff.name} akan bisa login kembali dan menerima akses operasional sesuai modul yang dimiliki.`}
          confirmLabel="Aktifkan"
          onCancel={() => setModal(null)}
          onConfirm={handleActivate}
        />
      ) : null}

      {modal === 'force' ? (
        <ConfirmModal
          icon={LogOut}
          title="Keluarkan staf dari semua perangkat?"
          description={`Semua sesi aktif ${detail.staff.name} akan dihentikan. Staf harus login ulang untuk mengakses kasir POS atau aplikasi staf.`}
          confirmLabel="Force Logout"
          tone="danger"
          onCancel={() => setModal(null)}
          onConfirm={handleForceLogout}
        />
      ) : null}

      {toast ? (
        <div className="fixed bottom-24 left-1/2 z-[80] w-full max-w-sm -translate-x-1/2 px-4 sm:bottom-6">
          <div className="flex items-start gap-2.5 rounded-xl border border-line bg-white p-3.5 shadow-xl">
            <span
              className={`mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full ${
                toast.tone === 'danger'
                  ? 'bg-[#fde7e7] text-[#dc2626]'
                  : toast.tone === 'info'
                    ? 'bg-[#eef2ff] text-[#4f46e5]'
                    : 'bg-[#dcf7ee] text-primary'
              }`}
            >
              {toast.tone === 'danger' ? (
                <CircleX className="size-3.5" />
              ) : toast.tone === 'info' ? (
                <Info className="size-3.5" />
              ) : (
                <Check className="size-3.5" />
              )}
            </span>
            <p className="flex-1 text-[11.5px] font-medium leading-relaxed text-ink">
              {toast.message}
            </p>
            <button
              type="button"
              onClick={() => setToast(null)}
              aria-label="Tutup notifikasi"
              className="text-slate-400 transition hover:text-slate-600"
            >
              <X className="size-3.5" />
            </button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
