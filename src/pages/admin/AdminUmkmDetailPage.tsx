import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import {
  Activity, Archive, ArrowLeft, BadgeCheck, Check, CheckCircle2, ClipboardList, Clock,
  FileText, Info, Lock, Mail, MapPin, Printer, ScrollText, ShieldCheck, ShoppingBag, Store, UserCheck,
  X, XCircle, type LucideIcon,
} from 'lucide-react'
import AdminToast, { type ToastTone } from '../../components/admin/AdminToast'
import ConfirmDialog from '../../components/admin/ConfirmDialog'
import { approveUmkm, fetchUmkmDetail, rejectUmkm, setUmkmStatus, type UmkmAuditTone, type UmkmDetail, type UmkmStatus } from '../../lib/admin-umkm-data'

type DialogKind = 'approve' | 'reject' | 'deactivate' | 'activate'
type ToastState = { id: number; message: string; tone: ToastTone }
const statusMeta: Record<UmkmStatus, { label: string; badge: string; dot: string }> = {
  pending: { label: 'Menunggu Verifikasi (Pending)', badge: 'border border-amber-200 bg-amber-50 text-amber-700', dot: 'bg-amber-500' },
  aktif: { label: 'Aktif & Tayang', badge: 'border border-emerald-200 bg-emerald-50 text-emerald-600', dot: 'bg-emerald-500' },
  ditolak: { label: 'Pendaftaran Ditolak', badge: 'border border-red-200 bg-red-50 text-red-600', dot: 'bg-red-500' },
  nonaktif: { label: 'Toko Nonaktif', badge: 'border border-slate-200 bg-slate-100 text-slate-500', dot: 'bg-slate-400' },
}
const auditDotTones: Record<UmkmAuditTone, string> = { warning: 'border-amber-400', success: 'border-emerald-500', neutral: 'border-slate-300' }
const verifierGuidelines = [
  'NIB bersifat opsional; toko tanpa NIB tetap dapat diverifikasi berdasarkan data lain.',
  'Cocokkan nama toko, nama pemilik, nomor HP, dan alamat dengan data pendaftaran.',
  'Jika foto usaha diunggah, pastikan menampilkan tempat usaha yang sesuai.',
]
const getInitials = (name: string) => name.split(' ').filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join('')
const formatDate = (iso: string) => new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'Asia/Jakarta' }).format(new Date(iso))
const formatAuditTime = (iso: string) => { const d = new Date(iso); const time = new Intl.DateTimeFormat('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false, timeZone: 'Asia/Jakarta' }).format(d); return `${formatDate(iso)}, ${time} WIB` }

function CardHeader({ icon: Icon, title, subtitle, right }: { icon: LucideIcon; title: string; subtitle: string; right?: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="flex min-w-0 items-start gap-2.5">
        <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary-soft/60 text-primary"><Icon className="size-3.5" /></span>
        <div className="min-w-0"><h2 className="text-sm font-bold text-ink">{title}</h2><p className="mt-0.5 text-[10px] leading-relaxed text-muted">{subtitle}</p></div>
      </div>
      {right && <div className="shrink-0">{right}</div>}
    </div>
  )
}

export default function AdminUmkmDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const [detail, setDetail] = useState<UmkmDetail | undefined>(undefined)
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState<ToastState | null>(null)
  const [dialog, setDialog] = useState<DialogKind | null>(null)
  const [reason, setReason] = useState('')

  const loadDetail = useCallback(async () => {
    if (!id) return
    setLoading(true)
    try { setDetail(await fetchUmkmDetail(id)) } finally { setLoading(false) }
  }, [id])

  useEffect(() => { loadDetail() }, [loadDetail])
  useEffect(() => { if (!toast) return; const t = window.setTimeout(() => setToast(null), 4000); return () => window.clearTimeout(t) }, [toast])

  if (loading) return <div className="mx-auto max-w-xl rounded-2xl border border-line bg-white p-10 text-center text-sm text-muted shadow-sm">Memuat detail UMKM...</div>
  if (!detail) {
    return (
      <div className="mx-auto max-w-xl rounded-2xl border border-line bg-white p-10 text-center shadow-sm">
        <span className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400"><Store className="size-5" /></span>
        <h1 className="mt-3 text-lg font-bold text-ink">UMKM tidak ditemukan</h1>
        <p className="mt-1 text-xs leading-relaxed text-muted">Data toko tidak tersedia atau tautan sudah tidak berlaku.</p>
        <Link to="/admin/umkm" className="mt-5 inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-4 text-xs font-semibold text-white transition hover:bg-primary-hover"><ArrowLeft className="size-4" />Kembali ke daftar UMKM</Link>
      </div>
    )
  }

  const record = detail.record
  const status = record.status
  const statusInfo = statusMeta[status]
  const events = detail.auditTrail ?? []
  const showToast = (message: string, tone: ToastTone) => setToast({ id: Date.now(), message, tone })
  const handleBack = () => { if (location.key !== 'default') navigate(-1); else navigate('/admin/umkm') }
  const openDialog = (kind: DialogKind) => { setDialog(kind); setReason('') }
  const closeDialog = () => { setDialog(null); setReason('') }

  async function handleConfirm() {
    if (!dialog) return
    const cleanReason = reason.trim()
    if ((dialog === 'reject' || dialog === 'deactivate') && cleanReason.length < 10) return
    try {
      if (dialog === 'approve') await approveUmkm(record.id)
      if (dialog === 'reject') await rejectUmkm(record.id, cleanReason)
      if (dialog === 'deactivate') await setUmkmStatus(record.id, 'nonaktif', cleanReason)
      if (dialog === 'activate') await setUmkmStatus(record.id, 'aktif')
      showToast('Status UMKM berhasil diperbarui.', 'success')
      closeDialog()
      await loadDetail()
    } catch (e: any) {
      if (e?.statusCode === 409) {
        showToast('Data sudah berubah. Memuat status terbaru...', 'info')
        await loadDetail()
      } else {
        showToast(e?.userMessage || 'Gagal memperbarui status UMKM.', 'error')
      }
    }
  }

  return (
    <div className="mx-auto max-w-[1320px]">
      <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400"><button type="button" onClick={handleBack} className="inline-flex items-center gap-1 hover:text-slate-600"><ArrowLeft className="size-3.5" />Kembali</button><span>/</span><span>UMKM</span><span>/</span><span className="text-primary">{record.name}</span></div>
      <section className="mt-3 rounded-2xl border border-line bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex min-w-0 items-start gap-4">
            <span className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-primary text-lg font-extrabold text-white">{getInitials(record.name)}</span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2"><h1 className="text-2xl font-extrabold tracking-tight text-ink">{record.name}</h1><span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold ${statusInfo.badge}`}><span className={`size-1.5 rounded-full ${statusInfo.dot}`} />{statusInfo.label}</span></div>
              <p className="mt-1 text-xs text-muted">Terdaftar {formatDate(record.registeredAt)} • ID {detail.shopId}</p>
              <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-600">{detail.description}</p>
            </div>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            {status === 'pending' && <><button type="button" onClick={() => openDialog('approve')} className="inline-flex h-10 items-center gap-2 rounded-xl bg-emerald-600 px-4 text-xs font-semibold text-white hover:bg-emerald-700"><CheckCircle2 className="size-4" />Setujui</button><button type="button" onClick={() => openDialog('reject')} className="inline-flex h-10 items-center gap-2 rounded-xl bg-rose-600 px-4 text-xs font-semibold text-white hover:bg-rose-700"><XCircle className="size-4" />Tolak</button></>}
            {status === 'aktif' && <button type="button" onClick={() => openDialog('deactivate')} className="inline-flex h-10 items-center gap-2 rounded-xl bg-rose-600 px-4 text-xs font-semibold text-white hover:bg-rose-700"><Archive className="size-4" />Nonaktifkan</button>}
            {status === 'nonaktif' && <button type="button" onClick={() => openDialog('activate')} className="inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-4 text-xs font-semibold text-white hover:bg-primary-hover"><Check className="size-4" />Aktifkan</button>}
            <button type="button" onClick={() => window.print()} className="inline-flex h-10 items-center gap-2 rounded-xl border border-line px-4 text-xs font-semibold text-slate-600 hover:bg-slate-50"><Printer className="size-4" />Cetak</button>
          </div>
        </div>
      </section>

      <div className="mt-4 grid gap-4 xl:grid-cols-[1.8fr_1fr]">
        <div className="space-y-4">
          <section className="rounded-2xl border border-line bg-white p-5 shadow-sm">
            <CardHeader icon={Store} title="Profil Toko" subtitle="Informasi utama toko yang didaftarkan pemilik UMKM." />
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-line p-4"><p className="text-[10px] font-bold uppercase tracking-[0.1em] text-muted">Alamat</p><p className="mt-1.5 text-sm text-slate-700"><MapPin className="mr-1 inline size-3.5 text-slate-400" />{detail.address}</p></div>
              <div className="rounded-xl border border-line p-4"><p className="text-[10px] font-bold uppercase tracking-[0.1em] text-muted">Kontak</p><p className="mt-1.5 text-sm text-slate-700"><Mail className="mr-1 inline size-3.5 text-slate-400" />{record.email}</p><p className="mt-1 text-sm text-slate-700">{record.phone}</p></div>
              <div className="rounded-xl border border-line p-4"><p className="text-[10px] font-bold uppercase tracking-[0.1em] text-muted">NIB</p><p className="mt-1.5 text-sm font-semibold text-slate-700">{detail.nib || 'Tidak diisi (opsional)'}</p></div>
              <div className="rounded-xl border border-line p-4 sm:col-span-2">
                <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-muted">Foto Usaha</p>
                {detail.photoUrl ? (
                  <a
                    href={detail.photoUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 block overflow-hidden rounded-lg border border-line"
                  >
                    <img
                      src={detail.photoUrl}
                      alt={`Foto usaha ${record.name}`}
                      className="h-44 w-full object-cover"
                    />
                  </a>
                ) : (
                  <p className="mt-1.5 text-sm text-slate-700">{detail.photoLabel}</p>
                )}
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-line bg-white p-5 shadow-sm">
            <CardHeader icon={UserCheck} title="Data Pemilik" subtitle="Identitas pemilik akun UMKM." />
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl bg-slate-50 p-4"><p className="text-[10px] font-bold uppercase tracking-[0.1em] text-muted">Nama Pemilik</p><p className="mt-1 text-sm font-semibold text-ink">{record.owner}</p></div>
              <div className="rounded-xl bg-slate-50 p-4"><p className="text-[10px] font-bold uppercase tracking-[0.1em] text-muted">Email</p><p className="mt-1 text-sm font-semibold text-ink">{record.email}</p></div>

            </div>
          </section>

          <section className="rounded-2xl border border-line bg-white p-5 shadow-sm">
            <CardHeader icon={ClipboardList} title="Ringkasan Toko" subtitle="Data operasional yang tersedia saat verifikasi." />
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-line p-4 text-center"><ShoppingBag className="mx-auto size-5 text-primary" /><p className="mt-2 text-xl font-extrabold text-ink">{detail.productSkus}</p><p className="text-[11px] text-muted">Produk</p></div>
              <div className="rounded-xl border border-line p-4 text-center"><Activity className="mx-auto size-5 text-primary" /><p className="mt-2 text-xl font-extrabold text-ink">{detail.ordersProcessed}</p><p className="text-[11px] text-muted">Pesanan</p></div>
              <div className="rounded-xl border border-line p-4 text-center"><Clock className="mx-auto size-5 text-primary" /><p className="mt-2 text-xl font-extrabold text-ink">{formatDate(record.registeredAt)}</p><p className="text-[11px] text-muted">Tanggal Daftar</p></div>
            </div>
          </section>

          <section id="audit-trail" className="rounded-2xl border border-line bg-white p-5 shadow-sm">
            <CardHeader icon={ScrollText} title="Riwayat Status & Audit" subtitle="Perubahan status toko dan jejak verifikasi admin." />
            <div className="mt-4 space-y-4">
              {events.length === 0 ? <p className="text-sm text-muted">Belum ada riwayat status.</p> : events.map((event) => (
                <div key={event.id} className="flex gap-3">
                  <span className={`mt-1 size-3 shrink-0 rounded-full border-2 bg-white ${auditDotTones[event.tone]}`} />
                  <div className="min-w-0 flex-1 border-b border-line pb-4 last:border-b-0 last:pb-0">
                    <div className="flex flex-wrap items-center gap-2"><p className="text-sm font-semibold text-ink">{event.title}</p>{event.statusLabel && <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">{event.statusLabel}</span>}</div>
                    <p className="mt-1 text-xs leading-relaxed text-muted">{event.description}</p>
                    <p className="mt-1.5 text-[11px] text-slate-400">{formatAuditTime(event.at)}{event.context ? ` • ${event.context}` : ''}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        <aside className="space-y-4">
          <section className="rounded-2xl border border-line bg-white p-5 shadow-sm">
            <CardHeader icon={ShieldCheck} title="Keputusan Verifikasi" subtitle="Tindakan admin untuk status UMKM ini." />
            <div className="mt-4 space-y-2">
              {status === 'pending' && <>
                <button type="button" onClick={() => openDialog('approve')} className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"><BadgeCheck className="size-4" />Setujui UMKM</button>
                <button type="button" onClick={() => openDialog('reject')} className="flex w-full items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm font-semibold text-rose-700 hover:bg-rose-100"><X className="size-4" />Tolak UMKM</button>
              </>}
              {status === 'aktif' && <button type="button" onClick={() => openDialog('deactivate')} className="flex w-full items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm font-semibold text-rose-700 hover:bg-rose-100"><Archive className="size-4" />Nonaktifkan Toko</button>}
              {status === 'nonaktif' && <button type="button" onClick={() => openDialog('activate')} className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-hover"><Check className="size-4" />Aktifkan Kembali</button>}
              {status === 'ditolak' && <div className="rounded-xl bg-amber-50 p-3 text-xs text-amber-800"><Info className="mr-1 inline size-4" />UMKM ditolak. Menunggu pemilik memperbaiki data dan mengajukan ulang.</div>}
            </div>
          </section>

          <section className="rounded-2xl border border-line bg-white p-5 shadow-sm">
            <CardHeader icon={FileText} title="Panduan Verifikasi" subtitle="Cek cepat sebelum mengambil keputusan." />
            <ul className="mt-4 space-y-2">
              {verifierGuidelines.map((item) => (
                <li key={item} className="flex gap-2 text-xs leading-relaxed text-slate-600"><Lock className="mt-0.5 size-3.5 shrink-0 text-primary" /><span>{item}</span></li>
              ))}
            </ul>
          </section>
        </aside>
      </div>

      <ConfirmDialog
        open={Boolean(dialog)}
        title={dialog === 'approve' ? 'Setujui UMKM?' : dialog === 'activate' ? 'Aktifkan UMKM?' : dialog === 'reject' ? 'Tolak UMKM?' : 'Nonaktifkan UMKM?'}
        description={
          dialog === 'reject' ? 'Berikan alasan penolakan. UMKM dapat mengajukan ulang setelah memperbaiki data.' :
          dialog === 'deactivate' ? 'Berikan alasan penonaktifan. Toko akan hilang dari publik.' :
          dialog === 'activate' ? 'UMKM akan diaktifkan kembali dan tampil di publik.' :
          'UMKM akan disetujui dan tampil di publik.'
        }
        confirmLabel={dialog === 'approve' ? 'Setujui' : dialog === 'activate' ? 'Aktifkan' : dialog === 'reject' ? 'Tolak' : 'Nonaktifkan'}
        onClose={closeDialog}
        onConfirm={handleConfirm}
        confirmDisabled={(dialog === 'reject' || dialog === 'deactivate') && reason.trim().length < 10}
      >
        {(dialog === 'reject' || dialog === 'deactivate') && (
          <div>
            <label htmlFor="decision-reason" className="mb-1.5 block text-xs font-semibold text-ink">{dialog === 'reject' ? 'Alasan penolakan' : 'Alasan penonaktifan'} <span className="text-red-500">*</span></label>
            <textarea id="decision-reason" rows={3} maxLength={300} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Tuliskan alasan minimal 10 karakter..." className="w-full resize-none rounded-xl border border-line bg-white px-3 py-2.5 text-xs text-ink outline-none transition placeholder:text-slate-400 focus:border-primary focus:ring-4 focus:ring-primary/10" />
            <div className="mt-1.5 flex items-center justify-between gap-3 text-[10px]"><span className={reason.trim().length < 10 ? 'text-red-500' : 'text-muted'}>Wajib 10-300 karakter.</span><span className="text-muted">{reason.length}/300</span></div>
          </div>
        )}
      </ConfirmDialog>

      {toast && <AdminToast key={toast.id} message={toast.message} tone={toast.tone} onClose={() => setToast(null)} />}
    </div>
  )
}

