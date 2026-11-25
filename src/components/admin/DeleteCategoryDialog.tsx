import { useEffect, useState } from 'react'
import {
  AlertTriangle,
  ArrowRightLeft,
  ChevronDown,
  FolderOpen,
  Lock,
  ShieldAlert,
  Trash2,
  X,
} from 'lucide-react'
import type { CategoryRecord } from '../../lib/admin-category-data'
import { categoryIcons } from '../../lib/category-icons'

type DeleteCategoryDialogProps = {
  open: boolean
  record: CategoryRecord | null
  categories: CategoryRecord[]
  onClose: () => void
  onDeactivate: () => void
  onMigrate: (replacementId: string) => void
  onDelete: () => void
}

const dateFormatter = new Intl.DateTimeFormat('id-ID', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  timeZone: 'Asia/Jakarta',
})

export default function DeleteCategoryDialog({
  open,
  record,
  categories,
  onClose,
  onDeactivate,
  onMigrate,
  onDelete,
}: DeleteCategoryDialogProps) {
  const [replacement, setReplacement] = useState('')
  const [confirmText, setConfirmText] = useState('')
  const [showHelp, setShowHelp] = useState(false)

  useEffect(() => {
    if (!open) return

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open, onClose])

  if (!open || !record) return null

  const Icon = categoryIcons[record.icon] ?? FolderOpen
  const productCount = record.productCount
  const isLocked = productCount > 0
  const isActive = record.status === 'aktif'
  const replacementOptions = categories.filter(
    (item) => item.id !== record.id && item.status === 'aktif',
  )
  const selectedReplacement = replacementOptions.find((item) => item.id === replacement)
  const confirmMatches = confirmText.trim().toUpperCase() === 'HAPUS'
  const deleteDisabled = isLocked || !confirmMatches

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto p-4">
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-category-title"
        className="relative my-auto w-full max-w-lg overflow-hidden rounded-[20px] border border-line bg-white p-6 shadow-[0_16px_40px_rgba(15,23,42,0.16)]"
      >
        <div className="absolute inset-x-0 top-0 h-1 bg-red-500" aria-hidden />

        <button
          type="button"
          onClick={onClose}
          aria-label="Tutup dialog"
          className="absolute right-4 top-5 flex size-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
        >
          <X className="size-4" />
        </button>

        <div className="flex items-start gap-3 pr-8">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-500">
            <AlertTriangle className="size-5" />
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-red-600">
                Validasi Keamanan
              </p>
              <span className="rounded bg-[#ece9fb] px-1.5 py-0.5 font-mono text-[9px] font-bold text-slate-600">
                KODE: 409
              </span>
            </div>
            <h2
              id="delete-category-title"
              className="mt-1 text-lg font-extrabold tracking-tight text-ink"
            >
              Hapus Kategori Produk?
            </h2>
          </div>
        </div>

        <div className="mt-4 rounded-xl bg-[#f4f5fa] p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="flex min-w-0 items-center gap-2 text-xs font-bold text-ink">
              <Icon className="size-4 shrink-0 text-primary" />
              <span className="break-words">{record.name}</span>
            </p>
            <span
              className={`shrink-0 rounded-full px-2 py-0.5 text-[9px] font-bold ${
                isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-500'
              }`}
            >
              Status: {isActive ? 'Aktif' : 'Nonaktif'}
            </span>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] text-muted">
            <span>
              Slug: <span className="font-mono">/kategori/{record.slug}</span>
            </span>
            <span className="size-1 rounded-full bg-slate-300" />
            <span>Dibuat {dateFormatter.format(new Date(record.createdAt))}</span>
          </div>
        </div>

        {isLocked ? (
          <div className="mt-3 rounded-xl border border-red-100 bg-red-50 p-4">
            <p className="flex items-center gap-2 text-[11px] font-bold text-red-700">
              <Lock className="size-3.5 shrink-0" />
              Proteksi Integritas Katalog Aktif
            </p>
            <p className="mt-1 text-[10px] leading-relaxed text-red-800/80">
              Kategori ini masih memiliki{' '}
              <span className="font-bold text-red-700">
                {productCount.toLocaleString('id-ID')} Produk Terhubung
              </span>{' '}
              dari mitra UMKM yang terdaftar aktif di etalase pembeli.
            </p>
          </div>
        ) : (
          <div className="mt-3 rounded-xl border border-emerald-100 bg-emerald-50 p-4">
            <p className="flex items-center gap-2 text-[11px] font-bold text-emerald-700">
              <ShieldAlert className="size-3.5 shrink-0" />
              Tidak Ada Produk Terhubung
            </p>
            <p className="mt-1 text-[10px] leading-relaxed text-emerald-800/80">
              Kategori ini aman dihapus permanen karena tidak lagi dipakai oleh SKU mana pun.
            </p>
          </div>
        )}

        <div className="mt-3 rounded-xl bg-[#f4f5fa] p-4">
          <p className="text-[10px] leading-relaxed text-slate-600">
            Sesuai standar operasional PRD Ratis (Kode 409: Integritas Data), kategori yang
            memiliki riwayat produk aktif tidak dapat dihapus permanen agar tidak merusak relasi
            transaksi dan SKU penjualan. Anda disarankan untuk mempertahankan status nonaktif.
          </p>
        </div>

        {isLocked && (
          <div className="mt-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-[11px] font-bold text-ink">Opsi Alihkan Produk Sebelum Hapus</p>
              <button
                type="button"
                onClick={() => setShowHelp((current) => !current)}
                className="text-[10px] font-semibold text-primary transition hover:underline"
              >
                Bantuan Migrasi
              </button>
            </div>

            {showHelp && (
              <p className="mt-1.5 rounded-lg bg-primary-soft/30 px-2.5 py-2 text-[9px] leading-relaxed text-slate-600">
                Pilih kategori pengganti yang masih aktif. Seluruh produk, riwayat harga, dan
                tautan etalase ikut dipindahkan tanpa menghapus SKU penjual.
              </p>
            )}

            <div className="mt-2 flex flex-col gap-2 sm:flex-row">
              <div className="relative min-w-0 flex-1">
                <select
                  value={replacement}
                  onChange={(event) => setReplacement(event.target.value)}
                  aria-label="Pilih kategori pengganti"
                  className="h-10 w-full cursor-pointer appearance-none rounded-xl border border-line bg-white pl-3 pr-9 text-[10px] text-ink outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
                >
                  <option value="">
                    -- Pilih Kategori Pengganti untuk {productCount.toLocaleString('id-ID')} Produk
                    --
                  </option>
                  {replacementOptions.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-3.5 -translate-y-1/2 text-slate-400" />
              </div>
              <button
                type="button"
                disabled={!replacement}
                onClick={() => onMigrate(replacement)}
                className="inline-flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-xl bg-primary px-3 text-[10px] font-semibold text-white transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ArrowRightLeft className="size-3.5" />
                Alihkan Produk
              </button>
            </div>

            <p className="mt-1.5 text-[10px] leading-relaxed text-muted">
              {selectedReplacement
                ? `${productCount.toLocaleString('id-ID')} produk akan dipindahkan ke ${selectedReplacement.name} setelah Anda menekan Alihkan Produk.`
                : 'Setelah semua produk dialihkan, opsi hapus permanen akan otomatis terbuka.'}
            </p>
          </div>
        )}

        <div className="mt-4">
          <label
            htmlFor="delete-category-confirm"
            className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-600"
          >
            <Lock className="size-3 shrink-0 text-slate-400" />
            Konfirmasi Keamanan (Terkunci hingga produk bernilai 0):
          </label>
          <input
            id="delete-category-confirm"
            type="text"
            value={confirmText}
            disabled={isLocked}
            onChange={(event) => setConfirmText(event.target.value)}
            placeholder="Ketik 'HAPUS' jika produk sudah dialihkan"
            className="mt-1.5 h-10 w-full rounded-xl border border-line bg-[#f4f5fa] px-3 text-xs text-ink outline-none transition placeholder:text-slate-400 focus:border-primary focus:ring-4 focus:ring-primary/10 disabled:cursor-not-allowed disabled:text-slate-400"
          />
        </div>

        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:items-center">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 items-center justify-center rounded-xl border border-line bg-white px-4 text-[11px] font-semibold text-slate-600 transition hover:bg-slate-50"
          >
            Batal
          </button>
          <div className="flex flex-col gap-2 sm:ml-auto sm:flex-row">
            <button
              type="button"
              onClick={onDeactivate}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-[11px] font-semibold text-white transition hover:bg-primary-hover"
            >
              <ShieldAlert className="size-3.5" />
              Nonaktifkan Saja
            </button>
            <button
              type="button"
              onClick={onDelete}
              disabled={deleteDisabled}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-red-600 px-4 text-[11px] font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
            >
              {deleteDisabled ? <Lock className="size-3.5" /> : <Trash2 className="size-3.5" />}
              Hapus Permanen
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
