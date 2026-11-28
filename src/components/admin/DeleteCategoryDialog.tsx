import { useEffect, useState } from 'react'
import {
  AlertTriangle,
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
  onClose: () => void
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
  onClose,
  onDelete,
}: DeleteCategoryDialogProps) {
  const [confirmText, setConfirmText] = useState('')

  useEffect(() => {
    if (!open) return

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open, onClose])

  useEffect(() => {
    if (!open) setConfirmText('')
  }, [open])

  if (!open || !record) return null

  const Icon = categoryIcons[record.icon] ?? FolderOpen
  const isLocked = record.productCount > 0
  const isActive = record.status === 'aktif'
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
            <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-red-600">
              Konfirmasi Hapus
            </p>
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
              Kategori Masih Dipakai
            </p>
            <p className="mt-1 text-[10px] leading-relaxed text-red-800/80">
              Kategori ini dipakai {record.productCount.toLocaleString('id-ID')} produk sehingga tidak
              dapat dihapus. Nonaktifkan kategori agar tidak muncul sebagai pilihan produk baru.
            </p>
          </div>
        ) : (
          <>
            <div className="mt-3 rounded-xl border border-emerald-100 bg-emerald-50 p-4">
              <p className="flex items-center gap-2 text-[11px] font-bold text-emerald-700">
                <ShieldAlert className="size-3.5 shrink-0" />
                Tidak Ada Produk Terhubung
              </p>
              <p className="mt-1 text-[10px] leading-relaxed text-emerald-800/80">
                Kategori ini tidak dipakai produk mana pun dan aman dihapus permanen.
              </p>
            </div>

            <div className="mt-4">
              <label
                htmlFor="delete-category-confirm"
                className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-600"
              >
                <Lock className="size-3 shrink-0 text-slate-400" />
                Ketik HAPUS untuk mengonfirmasi:
              </label>
              <input
                id="delete-category-confirm"
                type="text"
                value={confirmText}
                onChange={(event) => setConfirmText(event.target.value)}
                placeholder="HAPUS"
                className="mt-1.5 h-10 w-full rounded-xl border border-line bg-white px-3 text-xs text-ink outline-none transition placeholder:text-slate-400 focus:border-primary focus:ring-4 focus:ring-primary/10"
              />
            </div>
          </>
        )}

        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 items-center justify-center rounded-xl border border-line bg-white px-4 text-[11px] font-semibold text-slate-600 transition hover:bg-slate-50"
          >
            Batal
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
  )
}
