import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  AlertTriangle,
  ArrowLeft,
  BadgeCheck,
  Ban,
  Boxes,
  CalendarDays,
  Check,
  ExternalLink,
  Info,
  Lock,
  Mail,
  MapPin,
  Phone,
  ScrollText,
  ShieldCheck,
  ShoppingBag,
  Store,
  UserCog,
  Wallet,
} from 'lucide-react'
import AdminToast, { type ToastTone } from '../../components/admin/AdminToast'
import ConfirmDialog from '../../components/admin/ConfirmDialog'
import { shopsApi } from '../../lib/api/services'
import type { ShopDetail, ShopStatus } from '../../lib/api/types'

const numberFormatter = new Intl.NumberFormat('id-ID')

const dateFormatter = new Intl.DateTimeFormat('id-ID', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  timeZone: 'Asia/Jakarta',
})

const statusMeta: Record<ShopStatus, { label: string; badge: string; dot: string }> = {
  pending: { label: 'Menunggu Verifikasi', badge: 'bg-amber-50 text-amber-700', dot: 'bg-amber-500' },
  aktif: { label: 'Aktif', badge: 'bg-emerald-50 text-emerald-600', dot: 'bg-emerald-500' },
  ditolak: { label: 'Ditolak', badge: 'bg-red-50 text-red-600', dot: 'bg-red-500' },
  nonaktif: { label: 'Nonaktif', badge: 'bg-slate-100 text-slate-500', dot: 'bg-slate-400' },
}

const roleLabels: Record<string, string> = {
  OWNER: 'Pemilik',
  STAFF: 'Staf',
  ADMIN: 'Admin',
  CUSTOMER: 'Pelanggan',
}

function formatRupiah(value: number) {
  return `Rp ${numberFormatter.format(value)}`
}

function getInitials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')
}

function formatDate(iso: string) {
  return dateFormatter.format(new Date(iso))
}

async function fetchShopBySlug(slug: string): Promise<ShopDetail | undefined> {
  const result = await shopsApi.list({ q: slug, limit: 50, page: 1 })
  const found = result.data.find((shop) => shop.slug === slug || shop.id === slug)
  if (!found) return undefined
  return shopsApi.detail(found.id)
}

export default function AdminStoreRelationPage() {
  const { slug = '' } = useParams()
  const queryClient = useQueryClient()
  const [statusAction, setStatusAction] = useState<'nonaktif' | 'aktif' | null>(null)
  const [reason, setReason] = useState('')
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<{ message: string; tone: ToastTone } | null>(null)

  const { data: shop, isLoading, isError, refetch } = useQuery({
    queryKey: ['admin-shop-relation', slug],
    queryFn: () => fetchShopBySlug(slug),
    enabled: Boolean(slug),
  })

  const status = shop?.status ?? 'pending'
  const statusInfo = statusMeta[status]
  const owner = shop?.owner

  const staffCount = shop?.staff.length ?? 0
  const activeProducts = useMemo(
    () => (shop?.products ?? []).filter((product) => product.isActive).length,
    [shop],
  )

  function showToast(message: string, tone: ToastTone = 'success') {
    setToast({ message, tone })
    window.setTimeout(() => setToast(null), 4200)
  }

  function openStatusAction(next: 'nonaktif' | 'aktif') {
    setReason('')
    setStatusAction(next)
  }

  async function handleConfirmStatus() {
    if (!shop || !statusAction) return
    const cleanReason = reason.trim()
    if (statusAction === 'nonaktif' && cleanReason.length < 10) return

    setSaving(true)
    try {
      await shopsApi.updateStatus(
        shop.id,
        statusAction,
        statusAction === 'nonaktif' ? cleanReason : undefined,
      )
      await queryClient.invalidateQueries({ queryKey: ['admin-shop-relation', slug] })
      await queryClient.invalidateQueries({ queryKey: ['pending-shops-sidebar'] })
      showToast(
        statusAction === 'nonaktif'
          ? `Toko ${shop.name} dinonaktifkan dan hilang dari etalase publik.`
          : `Toko ${shop.name} diaktifkan kembali.`,
      )
      setStatusAction(null)
      setReason('')
    } catch (error) {
      showToast(
        (error as { userMessage?: string })?.userMessage || 'Gagal mengubah status toko.',
        'error',
      )
    } finally {
      setSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-xl rounded-2xl border border-line bg-white p-10 text-center text-sm text-muted shadow-sm">
        Memuat data toko...
      </div>
    )
  }

  if (isError) {
    return (
      <div className="mx-auto max-w-xl rounded-2xl border border-line bg-white p-10 text-center shadow-sm">
        <AlertTriangle className="mx-auto size-9 text-amber-500" />
        <h1 className="mt-3 text-lg font-bold text-ink">Gagal memuat data toko</h1>
        <p className="mt-1 text-xs text-muted">Periksa koneksi backend lalu coba lagi.</p>
        <button
          type="button"
          onClick={() => void refetch()}
          className="mt-4 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-white"
        >
          Coba lagi
        </button>
      </div>
    )
  }

  if (!shop) {
    return (
      <div className="mx-auto max-w-xl rounded-2xl border border-line bg-white p-10 text-center shadow-sm">
        <Store className="mx-auto size-9 text-slate-300" />
        <h1 className="mt-3 text-lg font-bold text-ink">Toko tidak ditemukan</h1>
        <p className="mt-1 text-xs text-muted">Tautan mungkin sudah tidak berlaku.</p>
        <Link
          to="/admin/kelola-pengguna"
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-white"
        >
          <ArrowLeft className="size-3.5" />
          Kembali ke Kelola Pengguna
        </Link>
      </div>
    )
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
          Slug toko: <span className="font-mono font-semibold text-ink">{shop.slug}</span>
        </span>
      </div>

      <section className="mt-2 flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-extrabold tracking-tight text-ink sm:text-[28px]">
              {shop.name}
            </h1>
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[9px] font-semibold ${statusInfo.badge}`}
            >
              <span className={`size-1.5 rounded-full ${statusInfo.dot}`} />
              {statusInfo.label}
            </span>
            {shop.verifiedAt && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-[9px] font-semibold text-emerald-600">
                <BadgeCheck className="size-3" />
                Terverifikasi
              </span>
            )}
            <span className="rounded-md border border-line bg-white px-2 py-1 font-mono text-[9px] font-semibold text-slate-500">
              {shop.id}
            </span>
          </div>

          <p className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] text-muted">
            <span className="inline-flex items-center gap-1">
              <CalendarDays className="size-3" />
              Terdaftar sejak {formatDate(shop.createdAt)}
            </span>
            <span className="inline-flex items-center gap-1">
              <ShieldCheck className="size-3" />
              {shop.nib ? `NIB ${shop.nib}` : 'Tanpa NIB (opsional)'}
            </span>
            <span className="inline-flex items-center gap-1">
              <UserCog className="size-3" />
              {staffCount} staf terdaftar
            </span>
          </p>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <Link
            to={`/admin/umkm/${shop.id}`}
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-line bg-white px-3 text-[10px] font-semibold text-slate-600 transition hover:bg-slate-50"
          >
            Detail Verifikasi UMKM
            <ExternalLink className="size-3" />
          </Link>

          {status === 'aktif' && (
            <button
              type="button"
              onClick={() => openStatusAction('nonaktif')}
              className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3 text-[10px] font-semibold text-rose-700 transition hover:bg-rose-100"
            >
              <Ban className="size-3.5" />
              Nonaktifkan Toko
            </button>
          )}
          {status === 'nonaktif' && (
            <button
              type="button"
              onClick={() => openStatusAction('aktif')}
              className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl bg-primary px-3 text-[10px] font-semibold text-white transition hover:bg-primary-hover"
            >
              <Check className="size-3.5" />
              Aktifkan Toko
            </button>
          )}

          <Link
            to={`/admin/kelola-pengguna/toko-terkait/${shop.slug}/audit-log-hubungan`}
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl bg-primary px-3 text-[10px] font-semibold text-white transition hover:bg-primary-hover"
          >
            <ScrollText className="size-3.5" />
            Audit Log Aktivitas
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
              <h2 className="text-[11px] font-bold text-ink">
                Hubungan Akun Pemilik &amp; Entitas Toko
              </h2>
              <p className="mt-1 text-[9px] leading-relaxed text-muted">
                Akun <span className="font-semibold text-ink">{owner?.name ?? '-'}</span> (
                {owner?.email ?? '-'}) terhubung sebagai pemilik toko. Menonaktifkan akun pemilik
                tidak otomatis mengubah status toko; keduanya dikelola terpisah agar operasional
                tetap dapat diselesaikan staf.
              </p>
            </div>
          </section>

          <section className="overflow-hidden rounded-2xl border border-line bg-white shadow-sm">
            <div className="relative h-[150px] overflow-hidden bg-gradient-to-br from-slate-500 via-slate-600 to-slate-800">
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-4 text-center">
                <span className="flex size-11 items-center justify-center rounded-2xl bg-white/15 text-white backdrop-blur-sm">
                  <Store className="size-5" />
                </span>
                <p className="truncate text-base font-bold text-white">{shop.name}</p>
                <p className="truncate text-[9px] text-white/70">{shop.slug}</p>
              </div>
            </div>
            <div className="p-4 sm:p-5">
              <p className="text-[9px] leading-relaxed text-muted">
                {shop.description || 'Deskripsi toko belum diisi oleh pemilik.'}
              </p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-line p-3">
                  <p className="text-[8px] font-bold uppercase tracking-[0.12em] text-muted">
                    Alamat
                  </p>
                  <p className="mt-1 text-[10px] leading-relaxed text-slate-700">
                    <MapPin className="mr-1 inline size-3 text-slate-400" />
                    {shop.address || 'Belum diisi'}
                  </p>
                </div>
                <div className="rounded-xl border border-line p-3">
                  <p className="text-[8px] font-bold uppercase tracking-[0.12em] text-muted">
                    Kontak Toko
                  </p>
                  <p className="mt-1 text-[10px] text-slate-700">
                    <Mail className="mr-1 inline size-3 text-slate-400" />
                    {owner?.email ?? '-'}
                  </p>
                  <p className="mt-0.5 text-[10px] text-slate-700">
                    <Phone className="mr-1 inline size-3 text-slate-400" />
                    {shop.phone || 'Belum diisi'}
                  </p>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded-xl bg-slate-50 p-3 text-center">
                  <Boxes className="mx-auto size-4 text-primary" />
                  <p className="mt-1.5 text-base font-extrabold text-ink">{shop.summary.productCount}</p>
                  <p className="text-[9px] text-muted">Produk ({activeProducts} aktif)</p>
                </div>
                <div className="rounded-xl bg-slate-50 p-3 text-center">
                  <ShoppingBag className="mx-auto size-4 text-primary" />
                  <p className="mt-1.5 text-base font-extrabold text-ink">{shop.summary.orderCount}</p>
                  <p className="text-[9px] text-muted">Pesanan</p>
                </div>
                <div className="rounded-xl bg-slate-50 p-3 text-center">
                  <Wallet className="mx-auto size-4 text-primary" />
                  <p className="mt-1.5 text-base font-extrabold text-ink">
                    {formatRupiah(shop.summary.revenue)}
                  </p>
                  <p className="text-[9px] text-muted">Omzet selesai</p>
                </div>
                <div className="rounded-xl bg-slate-50 p-3 text-center">
                  <CalendarDays className="mx-auto size-4 text-primary" />
                  <p className="mt-1.5 text-base font-extrabold text-ink">
                    {shop.summary.lastOrderAt ? formatDate(shop.summary.lastOrderAt) : '-'}
                  </p>
                  <p className="text-[9px] text-muted">Pesanan terakhir</p>
                </div>
              </div>
            </div>
          </section>

          <section className="overflow-hidden rounded-2xl border border-line bg-white shadow-sm">
            <div className="flex items-center justify-between gap-2 border-b border-line p-4">
              <div>
                <h2 className="text-sm font-bold text-ink">Staf Terdaftar</h2>
                <p className="mt-0.5 text-[10px] text-muted">
                  Data hanya baca. Pengelolaan staf dilakukan oleh pemilik toko.
                </p>
              </div>
              <span className="rounded-full bg-slate-100 px-2 py-1 text-[9px] font-bold text-slate-600">
                {staffCount} akun
              </span>
            </div>
            {staffCount === 0 ? (
              <p className="px-4 py-8 text-center text-xs text-muted">
                Toko ini belum memiliki staf.
              </p>
            ) : (
              <ul className="divide-y divide-line">
                {shop.staff.map((member) => (
                  <li key={member.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary-soft/50 text-[10px] font-bold text-primary">
                      {getInitials(member.name)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[11px] font-semibold text-ink">{member.name}</p>
                      <p className="truncate text-[9px] text-muted">{member.email}</p>
                    </div>
                    <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[8px] font-bold text-slate-600">
                      {roleLabels[member.role] ?? member.role}
                    </span>
                    <span
                      className={`rounded-full px-1.5 py-0.5 text-[8px] font-semibold ${
                        member.isActive
                          ? 'bg-emerald-50 text-emerald-600'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {member.isActive ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="overflow-hidden rounded-2xl border border-line bg-white shadow-sm">
            <div className="flex items-center justify-between gap-2 border-b border-line p-4">
              <div>
                <h2 className="text-sm font-bold text-ink">Produk Toko</h2>
                <p className="mt-0.5 text-[10px] text-muted">
                  Daftar produk aktual dari database, hanya baca.
                </p>
              </div>
              <span className="rounded-full bg-slate-100 px-2 py-1 text-[9px] font-bold text-slate-600">
                {shop.products.length} SKU
              </span>
            </div>
            {shop.products.length === 0 ? (
              <p className="px-4 py-8 text-center text-xs text-muted">
                Toko ini belum menambahkan produk.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[560px] text-left">
                  <thead className="bg-[#f4f5fa] text-[8px] uppercase tracking-[0.08em] text-muted">
                    <tr>
                      <th className="px-4 py-2.5 font-bold">Produk</th>
                      <th className="px-3 py-2.5 font-bold">Kategori</th>
                      <th className="px-3 py-2.5 text-right font-bold">Harga</th>
                      <th className="px-3 py-2.5 text-center font-bold">Stok</th>
                      <th className="px-4 py-2.5 font-bold">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {shop.products.map((product) => (
                      <tr key={product.id}>
                        <td className="px-4 py-2.5 text-[10px] font-semibold text-ink">
                          {product.name}
                        </td>
                        <td className="px-3 py-2.5 text-[10px] text-muted">{product.category.name}</td>
                        <td className="px-3 py-2.5 text-right text-[10px] font-semibold text-ink">
                          {formatRupiah(product.price)}
                        </td>
                        <td className="px-3 py-2.5 text-center text-[10px] text-slate-600">
                          {product.stock}
                        </td>
                        <td className="px-4 py-2.5">
                          <span
                            className={`rounded-full px-1.5 py-0.5 text-[8px] font-semibold ${
                              product.isActive
                                ? 'bg-emerald-50 text-emerald-600'
                                : 'bg-slate-100 text-slate-500'
                            }`}
                          >
                            {product.isActive ? 'Tayang' : 'Nonaktif'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>

        <aside className="space-y-4">
          <section className="rounded-2xl border border-line bg-white p-4 shadow-sm">
            <h2 className="text-sm font-bold text-ink">Data Pemilik</h2>
            <div className="mt-3 flex items-center gap-2.5">
              <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-[11px] font-bold text-white">
                {getInitials(owner?.name ?? '-')}
              </span>
              <div className="min-w-0">
                <p className="truncate text-[11px] font-bold text-ink">{owner?.name ?? '-'}</p>
                <p className="truncate text-[9px] text-muted">{owner?.email ?? '-'}</p>
              </div>
            </div>
            <dl className="mt-3 space-y-2 text-[10px]">
              <div className="flex items-center justify-between gap-3">
                <dt className="text-muted">Status akun</dt>
                <dd className="font-semibold text-ink">
                  {owner?.isActive === false ? 'Nonaktif' : 'Aktif'}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-muted">Telepon toko</dt>
                <dd className="text-right font-semibold text-ink">{shop.phone || '-'}</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-muted">Terakhir pesanan</dt>
                <dd className="text-right font-semibold text-ink">
                  {shop.summary.lastOrderAt ? formatDate(shop.summary.lastOrderAt) : '-'}
                </dd>
              </div>
            </dl>
            <Link
              to={`/admin/kelola-pengguna?cari=${encodeURIComponent(owner?.email ?? '')}`}
              className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-line px-3 py-2 text-[10px] font-semibold text-slate-600 transition hover:bg-slate-50"
            >
              <UserCog className="size-3.5" />
              Lihat Akun di Kelola Pengguna
            </Link>
          </section>

          <section className="rounded-2xl border border-line bg-white p-4 shadow-sm">
            <h2 className="text-sm font-bold text-ink">Dampak Status Toko</h2>
            <div className="mt-2 rounded-xl bg-[#f4f5fa] p-3">
              <p className="text-[10px] font-bold text-ink">{statusInfo.label}</p>
              <p className="mt-0.5 text-[9px] leading-relaxed text-muted">
                {status === 'aktif'
                  ? 'Toko tampil di etalase publik dan dapat menerima pesanan baru.'
                  : status === 'pending'
                    ? 'Toko menunggu verifikasi admin dan belum tampil di publik.'
                    : status === 'ditolak'
                      ? 'Pemilik dapat memperbaiki data lalu mengajukan ulang.'
                      : 'Toko tidak tampil di publik dan pesanan baru ditolak. Data tetap tersimpan.'}
              </p>
            </div>
            {shop.statusReason && (
              <div className="mt-2 rounded-xl border border-amber-200 bg-amber-50 p-3">
                <p className="flex items-center gap-1 text-[9px] font-bold text-amber-800">
                  <Info className="size-3" />
                  Alasan terakhir
                </p>
                <p className="mt-0.5 text-[9px] leading-relaxed text-amber-800">
                  {shop.statusReason}
                </p>
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-line bg-white p-4 shadow-sm">
            <h2 className="text-sm font-bold text-ink">Riwayat Status</h2>
            {shop.statusHistory.length === 0 ? (
              <p className="mt-3 text-[10px] text-muted">Belum ada riwayat perubahan status.</p>
            ) : (
              <ol className="mt-3 space-y-3">
                {shop.statusHistory.map((event) => (
                  <li key={event.id} className="flex gap-2">
                    <span
                      className={`mt-1.5 size-1.5 shrink-0 rounded-full ${
                        event.toStatus === 'aktif'
                          ? 'bg-emerald-500'
                          : event.toStatus === 'ditolak'
                            ? 'bg-rose-500'
                            : 'bg-slate-400'
                      }`}
                    />
                    <div className="min-w-0">
                      <p className="text-[10px] font-semibold text-ink">
                        {event.fromStatus ?? 'Baru'} → {event.toStatus}
                      </p>
                      {event.reason && (
                        <p className="mt-0.5 text-[9px] leading-relaxed text-muted">{event.reason}</p>
                      )}
                      <p className="mt-0.5 text-[8px] text-slate-400">
                        {formatDate(event.createdAt)}
                        {event.changedBy ? ` • ${event.changedBy.name}` : ''}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </section>
        </aside>
      </div>

      <ConfirmDialog
        open={Boolean(statusAction)}
        title={
          statusAction === 'nonaktif'
            ? `Nonaktifkan ${shop.name}?`
            : `Aktifkan kembali ${shop.name}?`
        }
        description={
          statusAction === 'nonaktif'
            ? 'Toko akan hilang dari etalase publik dan tidak menerima pesanan baru. Data produk, pesanan, dan keuangan tetap tersimpan.'
            : 'Toko akan tampil kembali di etalase publik dan dapat menerima pesanan baru.'
        }
        confirmLabel={statusAction === 'nonaktif' ? 'Nonaktifkan' : 'Aktifkan'}
        onClose={() => setStatusAction(null)}
        onConfirm={handleConfirmStatus}
        confirmDisabled={
          saving || (statusAction === 'nonaktif' && reason.trim().length < 10)
        }
      >
        {statusAction === 'nonaktif' && (
          <label className="mt-4 block">
            <span className="mb-1.5 block text-xs font-semibold text-slate-700">
              Alasan penonaktifan <span className="text-red-500">*</span>
            </span>
            <textarea
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              rows={3}
              maxLength={300}
              placeholder="Minimal 10 karakter..."
              className="w-full rounded-xl border border-line px-3 py-2 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
            />
            <span className="mt-1 block text-[11px] text-muted">{reason.length}/300</span>
          </label>
        )}
      </ConfirmDialog>
    </div>
  )
}
