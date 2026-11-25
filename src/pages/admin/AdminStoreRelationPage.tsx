import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Ban,
  Boxes,
  CalendarDays,
  ChevronDown,
  ExternalLink,
  Info,
  Lock,
  Mail,
  MapPin,
  MoreVertical,
  Phone,
  Plus,
  ScrollText,
  ShieldCheck,
  ShoppingBag,
  Store,
  Tag,
  TrendingUp,
  UserCog,
  UserPlus,
  Wallet,
  X,
} from 'lucide-react'
import AdminToast, { type ToastTone } from '../../components/admin/AdminToast'
import ConfirmDialog from '../../components/admin/ConfirmDialog'
import {
  getStoreDetail,
  type StoreStaffMember,
  type StoreStaffStatus,
  type StoreStatus,
} from '../../lib/admin-store-detail-data'
import { persistUmkmStatus } from '../../lib/admin-umkm-data'

const numberFormatter = new Intl.NumberFormat('id-ID')

const dateFormatter = new Intl.DateTimeFormat('id-ID', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  timeZone: 'Asia/Jakarta',
})

function formatRupiah(value: number) {
  return `Rp ${numberFormatter.format(value)}`
}

function formatCompactRupiah(value: number) {
  if (value >= 1_000_000) {
    return `Rp ${(value / 1_000_000).toLocaleString('id-ID', { maximumFractionDigits: 2 })} Jt`
  }
  return formatRupiah(value)
}

function getInitials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')
}

const staffRoleOptions = ['Staf Kasir & Operasional', 'Staf Dapur & Inventaris']

export default function AdminStoreRelationPage() {
  const { slug = '' } = useParams()
  const detail = getStoreDetail(slug)

  const [status, setStatus] = useState<StoreStatus>(detail.status)
  const [statusMenuOpen, setStatusMenuOpen] = useState(false)
  const [statusAction, setStatusAction] = useState<'suspend' | 'activate' | null>(null)
  const [reason, setReason] = useState('')
  const [staffList, setStaffList] = useState(detail.staff)
  const [staffAccessTarget, setStaffAccessTarget] = useState<StoreStaffMember | null>(null)
  const [inviteOpen, setInviteOpen] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState(staffRoleOptions[0])
  const [inviteError, setInviteError] = useState('')
  const [showAllProducts, setShowAllProducts] = useState(false)
  const [toast, setToast] = useState<{ message: string; tone: ToastTone } | null>(null)

  function showToast(message: string, tone: ToastTone = 'success') {
    setToast({ message, tone })
    window.setTimeout(() => setToast(null), 4200)
  }

  const suspended = status !== 'aktif'
  const visibleProducts = showAllProducts ? detail.products : detail.products.slice(0, 3)

  function openSuspend() {
    setStatusMenuOpen(false)
    setReason('')
    setStatusAction('suspend')
  }

  function handleConfirmSuspend() {
    if (reason.trim().length < 10) return

    setStatus('nonaktif')
    persistUmkmStatus(detail.slug, 'nonaktif')
    setStatusAction(null)
    setReason('')
    showToast(`Toko ${detail.name} ditangguhkan sementara. Alasan tercatat pada log audit.`)
  }

  function handleConfirmActivate() {
    setStatus('aktif')
    persistUmkmStatus(detail.slug, 'aktif')
    setStatusAction(null)
    showToast(`Toko ${detail.name} diaktifkan kembali dan tampil di etalase publik.`)
  }

  function handleToggleStaffAccess() {
    if (!staffAccessTarget) return

    const nextStatus: StoreStaffStatus =
      staffAccessTarget.status === 'aktif' ? 'nonaktif' : 'aktif'

    setStaffList((current) =>
      current.map((member) =>
        member.id === staffAccessTarget.id ? { ...member, status: nextStatus } : member,
      ),
    )
    showToast(
      nextStatus === 'aktif'
        ? `Akses ${staffAccessTarget.name} dipulihkan.`
        : `Akses ${staffAccessTarget.name} dinonaktifkan sementara.`,
    )
    setStaffAccessTarget(null)
  }

  function handleSendInvite() {
    const email = inviteEmail.trim().toLowerCase()

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setInviteError('Masukkan alamat email staf yang valid, contoh: staf@toko.id')
      return
    }

    setStaffList((current) => [
      ...current,
      {
        id: `staff-invite-${current.length + 1}`,
        name: email.split('@')[0].replace(/[._-]+/g, ' '),
        email,
        userId: `USR-${String(3800 + current.length)}-STF`,
        role: inviteRole,
        access:
          inviteRole === staffRoleOptions[0]
            ? 'POS Kasir, Resi Pesanan'
            : 'Stok SKU, Status Pesanan, Laporan Harian',
        status: 'aktif',
      },
    ])
    setInviteOpen(false)
    setInviteEmail('')
    setInviteError('')
    showToast(`Undangan akses staf terkirim ke ${email}.`)
  }

  return (
    <div>
      {toast && (
        <AdminToast message={toast.message} tone={toast.tone} onClose={() => setToast(null)} />
      )}

      <div className="flex flex-wrap items-center justify-between gap-2">
        <Link
          to="/admin/kelola-pengguna"
          className="inline-flex items-center gap-1.5 text-[10px] font-medium text-muted transition hover:text-ink"
        >
          <ArrowLeft className="size-3.5" />
          Kembali ke Kelola Pengguna
        </Link>
        <span className="rounded-lg border border-line bg-white px-2.5 py-1.5 text-[9px] text-muted">
          Konteks Navigasi Pengguna:{' '}
          <span className="font-mono font-semibold text-ink">{detail.owner.userId}</span>
        </span>
      </div>

      <section className="mt-2 flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-extrabold tracking-tight text-ink sm:text-[28px]">
              {detail.name}
            </h1>
            {suspended ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-1 text-[9px] font-semibold text-rose-600">
                <span className="size-1.5 rounded-full bg-rose-500" />
                Ditangguhkan
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-primary-soft/60 px-2 py-1 text-[9px] font-semibold text-primary">
                <span className="size-1.5 rounded-full bg-primary" />
                Aktif
              </span>
            )}
            {detail.verified && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-[9px] font-semibold text-emerald-600">
                <BadgeCheck className="size-3" />
                Terverifikasi
              </span>
            )}
            <span className="rounded-md border border-line bg-white px-2 py-1 font-mono text-[9px] font-semibold text-slate-500">
              {detail.storeCode}
            </span>
          </div>

          <p className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] text-muted">
            <span className="inline-flex items-center gap-1">
              <CalendarDays className="size-3" />
              Terdaftar sejak {dateFormatter.format(new Date(detail.registeredAt))}
            </span>
            <span className="inline-flex items-center gap-1">
              <ShieldCheck className="size-3" />
              {detail.certification}
            </span>
          </p>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <Link
            to={`/admin/umkm/${detail.slug}`}
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-line bg-white px-3 text-[10px] font-semibold text-slate-600 transition hover:bg-slate-50"
            title="Buka halaman etalase dan verifikasi UMKM"
          >
            Kunjungi Etalase Toko
            <ExternalLink className="size-3" />
          </Link>

          <div className="relative">
            <button
              type="button"
              onClick={() => setStatusMenuOpen((current) => !current)}
              aria-expanded={statusMenuOpen}
              className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-line bg-white px-3 text-[10px] font-semibold text-slate-600 transition hover:bg-slate-50"
            >
              Kelola Status
              <ChevronDown className="size-3" />
            </button>

            {statusMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setStatusMenuOpen(false)}
                  aria-hidden
                />
                <div className="absolute right-0 z-50 mt-2 w-60 rounded-xl border border-line bg-white p-1.5 shadow-xl">
                  {suspended ? (
                    <button
                      type="button"
                      onClick={() => {
                        setStatusMenuOpen(false)
                        setStatusAction('activate')
                      }}
                      className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-[10px] font-medium text-primary transition hover:bg-primary-soft/30"
                    >
                      <BadgeCheck className="size-3.5" />
                      Aktifkan Toko Kembali
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={openSuspend}
                      className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-[10px] font-medium text-rose-600 transition hover:bg-rose-50"
                    >
                      <Ban className="size-3.5" />
                      Tangguhkan Toko Sementara
                    </button>
                  )}
                  <Link
                    to={`/admin/umkm/${detail.slug}`}
                    className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-[10px] font-medium text-slate-600 transition hover:bg-slate-50"
                  >
                    <Store className="size-3.5" />
                    Detail Verifikasi UMKM
                  </Link>
                </div>
              </>
            )}
          </div>

          <Link
            to={`/admin/kelola-pengguna/toko-terkait/${detail.slug}/audit-log-hubungan`}
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl bg-primary px-3 text-[10px] font-semibold text-white transition hover:bg-primary-hover"
          >
            <ScrollText className="size-3.5" />
            Audit Log Hubungan
          </Link>
        </div>
      </section>

      <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0 space-y-4">
          <section className="flex gap-3 rounded-2xl border border-line border-l-4 border-l-primary bg-white p-4 shadow-sm">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary-soft/60 text-primary">
              <Lock className="size-4" />
            </span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-[11px] font-bold text-ink">
                  Hubungan &amp; Toko Berdasarkan Tata Kelola PRD Ratis
                </h2>
                <span className="rounded border border-line bg-[#f4f5fa] px-1.5 py-0.5 text-[7px] font-bold uppercase tracking-wide text-slate-500">
                  Privilege
                </span>
              </div>
              <p className="mt-1 text-[9px] leading-relaxed text-muted">
                Akun <span className="font-semibold text-ink">{detail.owner.name}</span> (
                {detail.owner.userId}) bertindak sebagai Pemilik Utama (Owner &amp; Legal
                Signatory). Sesuai klausul kepatuhan PRD Ratis, tindakan penonaktifan akun pemilik
                personal tidak otomatis membatalkan operasional toko atau mencairkan saldo escrow
                yang tertahan guna menjamin perlindungan transaksi konsumen berjalan.
              </p>
            </div>
          </section>

          <section className="overflow-hidden rounded-2xl border border-line bg-white shadow-sm">
            <div className="relative h-[150px] overflow-hidden bg-gradient-to-br from-slate-400 via-slate-500 to-slate-700">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="flex items-center gap-2 rounded-lg border border-white/30 bg-white/15 px-3 py-2 text-[10px] font-semibold text-white/80 backdrop-blur-sm">
                  <Store className="size-4" />
                  {detail.coverLabel}
                </div>
              </div>
              <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 bg-gradient-to-t from-slate-900/80 to-transparent p-4">
                <div className="min-w-0">
                  <p className="truncate text-base font-bold text-white">{detail.name}</p>
                  <p className="truncate text-[9px] text-white/70">{detail.tagline}</p>
                </div>
                <span className="shrink-0 rounded-full bg-white/90 px-2 py-1 text-[8px] font-bold text-slate-700">
                  Gerai Utama
                </span>
              </div>
            </div>

            <div className="p-5">
              <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-muted">
                Deskripsi Usaha
              </p>
              <p className="mt-1.5 text-[10px] leading-relaxed text-slate-600">
                {detail.description}
              </p>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl bg-[#f7f7fb] p-3">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-[8px] font-bold uppercase tracking-[0.1em] text-muted">
                      Kategori Utama Usaha
                    </p>
                    <Tag className="size-3.5 shrink-0 text-slate-400" />
                  </div>
                  <p className="mt-1 text-[11px] font-bold text-ink">{detail.category}</p>
                  <p className="mt-0.5 text-[9px] text-muted">{detail.categoryRef}</p>
                </div>

                <div className="rounded-xl bg-[#f7f7fb] p-3">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-[8px] font-bold uppercase tracking-[0.1em] text-muted">
                      Nomor Induk Berusaha (NIB)
                    </p>
                    <ShieldCheck className="size-3.5 shrink-0 text-slate-400" />
                  </div>
                  <p className="mt-1 font-mono text-[11px] font-bold text-ink">{detail.nib}</p>
                  <p className="mt-0.5 flex items-center gap-1 text-[9px] font-semibold text-emerald-600">
                    {detail.nibVerified && <BadgeCheck className="size-2.5" />}
                    {detail.nibVerified ? 'Terverifikasi OSS BKPM' : 'Belum diverifikasi'}
                  </p>
                </div>

                <div className="rounded-xl bg-[#f7f7fb] p-3">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-[8px] font-bold uppercase tracking-[0.1em] text-muted">
                      Alamat Operasional Gerai
                    </p>
                    <MapPin className="size-3.5 shrink-0 text-slate-400" />
                  </div>
                  <p className="mt-1 text-[10px] leading-relaxed text-slate-600">
                    {detail.address}
                  </p>
                  <a
                    href={`https://www.openstreetmap.org/search?query=${encodeURIComponent(detail.address)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-1 inline-flex items-center gap-1 text-[9px] font-semibold text-primary transition hover:text-primary-hover"
                  >
                    Buka di Peta Logistik
                    <ExternalLink className="size-2.5" />
                  </a>
                </div>

                <div className="rounded-xl bg-[#f7f7fb] p-3">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-[8px] font-bold uppercase tracking-[0.1em] text-muted">
                      Saluran Kontak Resmi Toko
                    </p>
                    <Mail className="size-3.5 shrink-0 text-slate-400" />
                  </div>
                  <p className="mt-1 flex items-center gap-1 break-all text-[10px] text-slate-600">
                    <Mail className="size-2.5 shrink-0 text-slate-400" />
                    {detail.contactEmail}
                  </p>
                  <p className="mt-0.5 flex items-center gap-1 text-[10px] text-slate-600">
                    <Phone className="size-2.5 shrink-0 text-slate-400" />
                    {detail.whatsapp}
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-line bg-white p-4 shadow-sm sm:p-5">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="text-[8px] font-bold uppercase tracking-[0.14em] text-muted">
                  Kinerja Bisnis
                </p>
                <h2 className="mt-1 text-base font-bold text-ink">
                  Metrik &amp; Kinerja Operasional Toko
                </h2>
              </div>
              <p className="text-[9px] text-muted">Sinkronisasi: 5 menit lalu</p>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2.5 xl:grid-cols-4">
              <div className="rounded-xl bg-[#f7f7fb] p-3">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-[8px] font-semibold text-muted">Produk Aktif</p>
                  <Boxes className="size-3.5 shrink-0 text-slate-400" />
                </div>
                <p className="mt-2 flex items-baseline gap-1 text-xl font-extrabold text-ink">
                  {detail.productCount}
                  <span className="text-[9px] font-medium text-muted">SKU</span>
                </p>
                <p className="mt-2 border-t border-line pt-1.5 text-[8px] text-muted">
                  Semua Terkunci
                </p>
              </div>

              <div className="rounded-xl bg-[#f7f7fb] p-3">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-[8px] font-semibold text-muted">Pesanan Tuntas</p>
                  <ShoppingBag className="size-3.5 shrink-0 text-slate-400" />
                </div>
                <p className="mt-2 text-xl font-extrabold text-ink">
                  {numberFormatter.format(detail.ordersCount)}
                </p>
                <p className="mt-2 border-t border-line pt-1.5 text-[8px] text-muted">
                  {detail.rating} / 5.0 ({detail.reviewCount} ulasan)
                </p>
              </div>

              <div className="rounded-xl bg-[#f7f7fb] p-3">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-[8px] font-semibold text-muted">Total Omzet</p>
                  <TrendingUp className="size-3.5 shrink-0 text-slate-400" />
                </div>
                <p className="mt-2 text-xl font-extrabold text-ink">
                  {formatCompactRupiah(detail.revenueTotal)}
                </p>
                <p className="mt-2 border-t border-line pt-1.5 text-[8px] font-semibold text-emerald-600">
                  {detail.revenueGrowth}
                </p>
              </div>

              <div className="rounded-xl bg-[#f7f7fb] p-3">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-[8px] font-semibold text-muted">Saldo Escrow</p>
                  <Wallet className="size-3.5 shrink-0 text-slate-400" />
                </div>
                <p className="mt-2 text-xl font-extrabold text-ink">
                  {formatCompactRupiah(detail.escrowBalance)}
                </p>
                <p className="mt-2 truncate border-t border-line pt-1.5 text-[8px] text-muted">
                  {detail.escrowNote}
                </p>
              </div>
            </div>
          </section>

          <section className="overflow-hidden rounded-2xl border border-line bg-white shadow-sm">
            <div className="flex flex-col gap-2 px-4 pt-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-[8px] font-bold uppercase tracking-[0.14em] text-muted">
                  Struktur Manajemen Toko
                </p>
                <h2 className="mt-1 text-base font-bold text-ink">
                  Daftar Staf &amp; Delegasi Akses Toko
                </h2>
              </div>
              <button
                type="button"
                onClick={() => {
                  setInviteOpen(true)
                  setInviteError('')
                }}
                className="inline-flex h-8 shrink-0 items-center justify-center gap-1.5 self-start rounded-lg border border-line bg-white px-2.5 text-[9px] font-semibold text-slate-600 transition hover:bg-slate-50"
              >
                <Plus className="size-3" />
                Tambah Akses Staf Toko
              </button>
            </div>

            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[680px] text-left">
                <thead>
                  <tr className="bg-[#f4f5fa] text-[8px] uppercase tracking-[0.1em] text-muted">
                    <th className="px-4 py-2.5 font-bold">Nama &amp; Identitas Akun</th>
                    <th className="px-3 py-2.5 font-bold">Peran Toko</th>
                    <th className="px-3 py-2.5 font-bold">Hak Akses Sistem</th>
                    <th className="px-3 py-2.5 font-bold">Status</th>
                    <th className="px-4 py-2.5 text-right font-bold">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {staffList.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-10 text-center">
                        <p className="text-[11px] font-semibold text-ink">
                          Belum ada staf delegasi
                        </p>
                        <p className="mt-1 text-[9px] text-muted">
                          Tambahkan akses staf agar operasional toko tetap berjalan.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    staffList.map((member, index) => (
                      <tr key={member.id} className="transition hover:bg-slate-50/60">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <span
                              className={`flex size-7 shrink-0 items-center justify-center rounded-lg text-[9px] font-bold text-white ${
                                index === 0 ? 'bg-primary' : 'bg-slate-400'
                              }`}
                            >
                              {getInitials(member.name)}
                            </span>
                            <div className="min-w-0">
                              <p className="truncate text-[10px] font-bold text-ink">
                                {member.name}
                              </p>
                              <p className="truncate font-mono text-[8px] text-slate-400">
                                {member.userId}
                              </p>
                              <p className="truncate text-[9px] text-muted">{member.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-3">
                          <span
                            className={`inline-flex rounded-md px-1.5 py-1 text-[8px] font-semibold leading-snug ${
                              index === 0
                                ? 'bg-primary-soft/60 text-primary'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {member.role}
                          </span>
                        </td>
                        <td className="max-w-[180px] px-3 py-3 text-[9px] leading-relaxed text-slate-600">
                          {member.access}
                        </td>
                        <td className="px-3 py-3">
                          {member.status === 'aktif' ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-[8px] font-semibold text-emerald-600">
                              <span className="size-1.5 rounded-full bg-emerald-500" />
                              Aktif
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-1 text-[8px] font-semibold text-rose-600">
                              <span className="size-1.5 rounded-full bg-rose-500" />
                              Nonaktif
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            type="button"
                            onClick={() => setStaffAccessTarget(member)}
                            aria-label={`Kelola akses ${member.name}`}
                            title={`Kelola akses ${member.name}`}
                            className="inline-flex size-7 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                          >
                            <MoreVertical className="size-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <p className="flex items-start gap-1.5 border-t border-line px-4 py-3 text-[9px] leading-relaxed text-muted">
              <Info className="mt-0.5 size-3 shrink-0" />
              Delegasi staf memungkinkan toko tetap beroperasi normal bahkan saat akun Bu Sri
              sedang dalam mode non-aktif sementara.
            </p>
          </section>

          <section className="rounded-2xl border border-line bg-white p-4 shadow-sm sm:p-5">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="text-[8px] font-bold uppercase tracking-[0.14em] text-muted">
                  Katalog Etalase
                </p>
                <h2 className="mt-1 text-base font-bold text-ink">Sampel Produk Unggulan Toko</h2>
              </div>
              <button
                type="button"
                onClick={() => setShowAllProducts((current) => !current)}
                className="inline-flex items-center gap-1 text-[9px] font-semibold text-primary transition hover:text-primary-hover"
              >
                {showAllProducts
                  ? 'Tampilkan 3 SKU Sampel'
                  : `Lihat Semua ${detail.productCount} SKU`}
                <ArrowRight
                  className={`size-3 transition ${showAllProducts ? 'rotate-90' : ''}`}
                />
              </button>
            </div>

            <ul className="mt-3 divide-y divide-line">
              {visibleProducts.length === 0 ? (
                <li className="py-8 text-center text-[10px] text-muted">
                  Belum ada produk unggulan yang dipublikasikan.
                </li>
              ) : (
                visibleProducts.map((product) => (
                  <li key={product.sku} className="flex items-center gap-3 py-3">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[#f4f5fa] text-[9px] font-semibold text-slate-400">
                      img
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[10px] font-bold text-ink">{product.name}</p>
                      <p className="truncate text-[8px] text-slate-400">
                        {product.sku} • {product.variant}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-[10px] font-bold text-ink">
                        {formatRupiah(product.price)}
                      </p>
                      <p className="text-[8px] text-muted">{product.sold} terjual</p>
                    </div>
                    <span
                      className={`shrink-0 rounded-md px-1.5 py-1 text-[8px] font-semibold ${
                        product.availability === 'Tersedia'
                          ? 'bg-primary-soft/50 text-primary'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {product.availability}
                    </span>
                  </li>
                ))
              )}
            </ul>
          </section>
        </div>

        <aside className="min-w-0 space-y-4">
          <section className="rounded-2xl border border-line bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between gap-2">
              <p className="text-[8px] font-bold uppercase tracking-[0.12em] text-muted">
                Akun Pengguna
              </p>
              <span className="inline-flex items-center gap-1 rounded-full bg-primary-soft/60 px-2 py-0.5 text-[8px] font-semibold text-primary">
                <ShieldCheck className="size-2.5" />
                {suspended ? 'Akun Ditangguhkan' : 'Akun Aktif'}
              </span>
            </div>

            <div className="mt-3 flex items-center gap-2.5">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-white">
                {getInitials(detail.owner.name)}
              </span>
              <div className="min-w-0">
                <p className="truncate text-[12px] font-bold text-ink">{detail.owner.name}</p>
                <div className="mt-0.5 flex items-center gap-1">
                  <span className="rounded bg-primary-soft/60 px-1 py-0.5 text-[7px] font-bold uppercase tracking-wide text-primary">
                    Pemilik UMKM
                  </span>
                  <span className="font-mono text-[8px] text-slate-400">
                    {detail.owner.userId}
                  </span>
                </div>
              </div>
            </div>

            <dl className="mt-3 divide-y divide-line text-[9px]">
              <div className="flex items-start justify-between gap-3 py-2">
                <dt className="text-muted">Email Terdaftar</dt>
                <dd className="break-all text-right font-semibold text-ink">
                  {detail.owner.email}
                </dd>
              </div>
              <div className="flex items-start justify-between gap-3 py-2">
                <dt className="text-muted">Nomor Telepon</dt>
                <dd className="text-right font-semibold text-ink">{detail.owner.phone}</dd>
              </div>
              <div className="flex items-start justify-between gap-3 py-2">
                <dt className="text-muted">Terakhir Login</dt>
                <dd className="text-right font-semibold text-ink">{detail.owner.lastLogin}</dd>
              </div>
              <div className="flex items-start justify-between gap-3 py-2">
                <dt className="text-muted">Alamat IP</dt>
                <dd className="text-right font-mono text-[8px] font-semibold leading-relaxed text-slate-600">
                  {detail.owner.ip}
                </dd>
              </div>
            </dl>

            <Link
              to="/admin/kelola-pengguna"
              className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl bg-[#f4f5fa] px-3 py-2.5 text-[10px] font-semibold text-slate-600 transition hover:bg-slate-100"
            >
              <UserCog className="size-3.5" />
              Kelola Profil Pengguna
            </Link>
          </section>

          <section className="rounded-2xl border border-line bg-white p-4 shadow-sm">
            <h2 className="flex items-center gap-1.5 text-[11px] font-bold text-ink">
              <AlertTriangle className="size-3.5 text-amber-500" />
              Penegakan Kebijakan &amp; Tata Kelola
            </h2>

            <p className="mt-2 text-[8px] font-bold uppercase tracking-[0.1em] text-muted">
              Status Publikasi Toko:{' '}
              <span className={suspended ? 'text-rose-600' : 'text-emerald-600'}>
                {suspended ? 'Ditangguhkan sementara' : detail.policyStatus}
              </span>
            </p>
            <p className="mt-1 text-[9px] leading-relaxed text-muted">
              {suspended
                ? 'Etalase disembunyikan dari storefront dan tidak menerima pesanan baru sampai status diaktifkan kembali oleh Superadmin.'
                : detail.policyNote}
            </p>

            <div className="mt-3 rounded-xl border border-rose-100 bg-rose-50/70 p-2.5">
              <p className="flex items-center gap-1 text-[8px] font-bold uppercase tracking-wide text-rose-600">
                <AlertTriangle className="size-3" />
                Aturan Isolasi Sanksi
              </p>
              <p className="mt-1 text-[9px] leading-relaxed text-rose-900/80">
                {detail.policyWarning}
              </p>
            </div>

            {suspended ? (
              <button
                type="button"
                onClick={() => setStatusAction('activate')}
                className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl bg-primary px-3 py-2.5 text-[9px] font-bold uppercase tracking-wide text-white transition hover:bg-primary-hover"
              >
                <BadgeCheck className="size-3.5" />
                Aktifkan Toko Kembali
              </button>
            ) : (
              <button
                type="button"
                onClick={openSuspend}
                className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl bg-rose-500 px-3 py-2.5 text-[9px] font-bold uppercase tracking-wide text-white transition hover:bg-rose-600"
              >
                <Ban className="size-3.5" />
                Tangguhkan Toko Ini Sementara
              </button>
            )}
          </section>

          <section
            id="riwayat-rekonsiliasi"
            className="scroll-mt-24 rounded-2xl border border-line bg-white p-4 shadow-sm"
          >
            <h2 className="text-[11px] font-bold text-ink">Riwayat &amp; Rekonsiliasi</h2>
            <ol className="mt-3 space-y-3">
              {detail.timeline.map((event) => (
                <li key={`${event.title}-${event.at}`} className="flex gap-2">
                  <span
                    className={`mt-1 size-1.5 shrink-0 rounded-full ${
                      event.tone === 'primary'
                        ? 'bg-primary'
                        : event.tone === 'success'
                          ? 'bg-emerald-500'
                          : 'bg-slate-300'
                    }`}
                  />
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center justify-between gap-x-2">
                      <p className="text-[9px] font-bold text-ink">{event.title}</p>
                      <p className="text-[8px] text-slate-400">{event.at}</p>
                    </div>
                    <p className="mt-0.5 text-[9px] leading-relaxed text-muted">
                      {event.description}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </section>
        </aside>
      </div>

      <ConfirmDialog
        open={statusAction === 'suspend'}
        title={`Tangguhkan ${detail.name} sementara?`}
        description="Toko akan disembunyikan dari storefront publik dan tidak menerima pesanan baru. Pemilik dan staf tetap dapat login untuk menyelesaikan pesanan berjalan."
        confirmLabel="Tangguhkan Toko"
        tone="danger"
        confirmDisabled={reason.trim().length < 10}
        onConfirm={handleConfirmSuspend}
        onClose={() => setStatusAction(null)}
      >
        <label htmlFor="suspend-reason" className="text-[10px] font-semibold text-ink">
          Alasan penangguhan <span className="text-rose-500">*</span>
        </label>
        <textarea
          id="suspend-reason"
          value={reason}
          onChange={(event) => setReason(event.target.value.slice(0, 300))}
          rows={3}
          placeholder="Contoh: Laporan pelanggaran higienitas #7712, peninjauan ulang izin edar."
          className="mt-1.5 w-full resize-none rounded-xl border border-line bg-[#f7f7fb] p-2.5 text-[10px] leading-relaxed text-ink outline-none transition placeholder:text-slate-400 focus:border-primary focus:bg-white"
        />
        <div className="mt-1 flex items-center justify-between gap-2 text-[8px] text-muted">
          <span>Minimal 10 karakter untuk catatan audit log.</span>
          <span>{reason.length} / 300</span>
        </div>
      </ConfirmDialog>

      <ConfirmDialog
        open={statusAction === 'activate'}
        title={`Aktifkan kembali ${detail.name}?`}
        description="Toko akan tampil kembali di storefront publik dan dapat menerima pesanan baru. Tindakan ini tercatat pada log audit platform."
        confirmLabel="Aktifkan Toko"
        onConfirm={handleConfirmActivate}
        onClose={() => setStatusAction(null)}
      />

      <ConfirmDialog
        open={Boolean(staffAccessTarget)}
        title={
          staffAccessTarget
            ? `${staffAccessTarget.status === 'aktif' ? 'Nonaktifkan' : 'Aktifkan'} akses ${staffAccessTarget.name}?`
            : 'Kelola akses staf'
        }
        description={
          staffAccessTarget?.status === 'aktif'
            ? 'Staf tidak akan bisa mengakses dashboard toko sampai pemilik mengaktifkan kembali. Riwayat pekerjaan tetap tersimpan.'
            : 'Staf akan kembali dapat mengakses dashboard toko sesuai hak akses yang tercatat.'
        }
        confirmLabel={
          staffAccessTarget?.status === 'aktif' ? 'Nonaktifkan Akses' : 'Aktifkan Akses'
        }
        tone={staffAccessTarget?.status === 'aktif' ? 'danger' : 'primary'}
        onConfirm={handleToggleStaffAccess}
        onClose={() => setStaffAccessTarget(null)}
      />

      {inviteOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => setInviteOpen(false)}
            aria-hidden
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Tambah akses staf toko"
            className="relative w-full max-w-md rounded-[20px] border border-line bg-white p-6 shadow-[0_16px_40px_rgba(15,23,42,0.16)]"
          >
            <button
              type="button"
              onClick={() => setInviteOpen(false)}
              aria-label="Tutup dialog tambah akses staf"
              className="absolute right-4 top-4 flex size-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
            >
              <X className="size-4" />
            </button>

            <div className="flex items-start gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary-soft/50 text-primary">
                <UserPlus className="size-5" />
              </span>
              <div>
                <h2 className="text-base font-bold text-ink">Tambah Akses Staf Toko</h2>
                <p className="mt-1 text-xs leading-relaxed text-muted">
                  Kirim undangan delegasi operasional untuk {detail.name}.
                </p>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              <div>
                <label htmlFor="staff-invite-email" className="text-[10px] font-semibold text-ink">
                  Email Staf
                </label>
                <input
                  id="staff-invite-email"
                  type="email"
                  value={inviteEmail}
                  onChange={(event) => {
                    setInviteEmail(event.target.value)
                    setInviteError('')
                  }}
                  placeholder="staf@toko.id"
                  className="mt-1 h-10 w-full rounded-xl border border-line bg-[#f7f7fb] px-3 text-[11px] text-ink outline-none transition placeholder:text-slate-400 focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10"
                />
                {inviteError && (
                  <p className="mt-1 text-[9px] font-medium text-rose-600">{inviteError}</p>
                )}
              </div>

              <div>
                <label htmlFor="staff-invite-role" className="text-[10px] font-semibold text-ink">
                  Peran di Toko
                </label>
                <select
                  id="staff-invite-role"
                  value={inviteRole}
                  onChange={(event) => setInviteRole(event.target.value)}
                  className="mt-1 h-10 w-full cursor-pointer rounded-xl border border-line bg-[#f7f7fb] px-3 text-[11px] text-ink outline-none transition focus:border-primary focus:bg-white"
                >
                  {staffRoleOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setInviteOpen(false)}
                className="inline-flex h-9 items-center justify-center rounded-xl border border-line bg-white px-3.5 text-[10px] font-semibold text-slate-600 transition hover:bg-slate-50"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSendInvite}
                className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl bg-primary px-3.5 text-[10px] font-semibold text-white transition hover:bg-primary-hover"
              >
                <UserPlus className="size-3.5" />
                Kirim Undangan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
