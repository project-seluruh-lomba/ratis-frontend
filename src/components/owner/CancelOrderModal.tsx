import { useState } from 'react'
import {
  Check,
  CircleAlert,
  CircleCheck,
  CircleX,
  Package,
  PenLine,
  TriangleAlert,
  X,
} from 'lucide-react'
import type { OwnerOrder } from '../../lib/owner-order-data'
import { findOwnerProductByName } from '../../lib/owner-product-data'

export type CancelReasonId =
  | 'bahan-baku'
  | 'kapasitas'
  | 'pelanggan'
  | 'bukti'
  | 'lainnya'

export type CancelOrderResult = {
  reason: string
  category: CancelReasonId
  notifyWhatsApp: boolean
}

const cancelReasonOptions: { id: CancelReasonId; label: string }[] = [
  { id: 'bahan-baku', label: 'Bahan baku habis / rusak' },
  { id: 'kapasitas', label: 'Kapasitas dapur penuh' },
  { id: 'pelanggan', label: 'Pelanggan meminta pembatalan' },
  { id: 'bukti', label: 'Bukti transfer tidak valid' },
  { id: 'lainnya', label: 'Lainnya' },
]

type CancelFormErrors = {
  category?: string
  reason?: string
}

export default function CancelOrderModal({
  order,
  onClose,
  onConfirm,
}: {
  order: OwnerOrder
  onClose: () => void
  onConfirm: (result: CancelOrderResult) => void
}) {
  const [category, setCategory] = useState<CancelReasonId | ''>('')
  const [reason, setReason] = useState('')
  const [notifyWhatsApp, setNotifyWhatsApp] = useState(true)
  const [errors, setErrors] = useState<CancelFormErrors>({})

  const totalQuantity = order.items.reduce((sum, item) => sum + item.qty, 0)
  const isReasonValid = reason.trim().length >= 10

  function getStockUnit(itemName: string) {
    return findOwnerProductByName(itemName)?.stockUnit ?? 'unit'
  }

  function handleConfirm() {
    const nextErrors: CancelFormErrors = {}

    if (!category) {
      nextErrors.category = 'Pilih kategori alasan pembatalan.'
    }
    if (reason.trim().length < 10) {
      nextErrors.reason = 'Alasan pembatalan wajib diisi minimal 10 karakter.'
    }
    if (reason.trim().length > 300) {
      nextErrors.reason = 'Alasan pembatalan maksimal 300 karakter.'
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      return
    }

    onConfirm({
      reason: reason.trim(),
      category: category as CancelReasonId,
      notifyWhatsApp,
    })
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center sm:p-4">
      <div
        className="absolute inset-0 bg-slate-900/45 backdrop-blur-[2px]"
        onClick={onClose}
        aria-hidden
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="cancel-order-title"
        className="relative z-10 flex max-h-[93vh] w-full flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:max-w-[600px] sm:rounded-2xl"
      >
        <span aria-hidden className="h-1 w-full shrink-0 bg-[#c81e1e]" />

        <div className="flex items-start justify-between gap-3 px-5 pb-4 pt-5 sm:px-6">
          <div className="flex min-w-0 items-start gap-3">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-[#fde8e8] text-[#c0392b]">
              <TriangleAlert className="size-6" />
            </span>
            <div className="min-w-0">
              <h2
                id="cancel-order-title"
                className="text-[19px] font-extrabold leading-snug tracking-tight text-ink"
              >
                Batalkan Pesanan Ini?
              </h2>
              <p className="mt-1 truncate text-[11px] text-slate-500">
                #{order.code} &bull; {order.customerName}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup modal"
            className="flex size-8 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto bg-[#f7f8fd] px-4 py-4 sm:px-6">
          <div className="flex items-start gap-3 rounded-xl bg-[#fdf0f0] px-4 py-3.5">
            <CircleAlert className="mt-0.5 size-4 shrink-0 text-[#c0392b]" />
            <p className="text-[10.5px] leading-relaxed text-slate-700">
              <span className="font-bold text-[#b91c1c]">Peringatan:</span> Tindakan
              ini bersifat permanen dan tidak dapat dibatalkan. Stok sebanyak{' '}
              <span className="font-bold text-ink">{totalQuantity} item</span> akan
              otomatis dikembalikan ke katalog toko secara instan.
            </p>
          </div>

          <div className="mt-3 rounded-xl bg-[#eef1fb] p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.07em] text-slate-600">
                <Package className="size-3.5" />
                Pemulihan Inventaris Otomatis
              </p>
              <span className="rounded-full bg-[#d9f7ea] px-2 py-1 text-[9px] font-semibold text-[#15803d]">
                +{totalQuantity} Unit Bertambah
              </span>
            </div>

            <div className="mt-2.5 space-y-2">
              {order.items.map((item, index) => (
                <div
                  key={`${item.name}-${index}`}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-white px-3 py-2"
                >
                  <p className="flex min-w-0 items-center gap-2 text-[10.5px] font-medium text-ink">
                    <span className="size-1.5 shrink-0 rounded-full bg-[#15803d]" />
                    <span className="truncate">{item.name}</span>
                  </p>
                  <span className="shrink-0 rounded-md bg-[#d9f7ea] px-2 py-0.5 text-[9px] font-semibold text-[#15803d]">
                    +{item.qty} {getStockUnit(item.name)} ke stok
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4">
            <div className="flex items-center justify-between gap-2">
              <p className="text-[11px] font-semibold text-ink">
                Pilih Kategori Alasan Pembatalan{' '}
                <span className="text-[#dc2626]">*</span>
              </p>
              <span className="text-[9px] text-slate-400">Wajib diisi</span>
            </div>

            <div className="mt-2 flex flex-wrap gap-2">
              {cancelReasonOptions.map((option) => {
                const isActive = category === option.id
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => {
                      setCategory(option.id)
                      setErrors((current) => ({ ...current, category: undefined }))
                    }}
                    aria-pressed={isActive}
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[10px] font-semibold transition ${
                      isActive
                        ? 'bg-primary text-white shadow-sm'
                        : 'bg-[#eef1fb] text-slate-600 hover:bg-[#e4e9f7] hover:text-ink'
                    }`}
                  >
                    {isActive && <CircleCheck className="size-3.5" />}
                    {option.label}
                  </button>
                )
              })}
            </div>
            {errors.category && (
              <p className="mt-1.5 text-[9.5px] text-red-600">{errors.category}</p>
            )}
          </div>

          <div className="mt-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-[11px] font-semibold text-ink">
                Tuliskan Alasan Pembatalan Lengkap{' '}
                <span className="text-[#dc2626]">*</span>
              </p>
              <span
                className={`inline-flex items-center gap-1 text-[9px] ${
                  isReasonValid ? 'text-[#15803d]' : 'text-slate-400'
                }`}
              >
                {isReasonValid && <Check className="size-3" />}
                {reason.length} / 300 karakter
              </span>
            </div>

            <textarea
              value={reason}
              onChange={(event) => {
                setReason(event.target.value)
                setErrors((current) => ({ ...current, reason: undefined }))
              }}
              rows={4}
              maxLength={300}
              placeholder="Contoh: Mohon maaf, pasokan bahan baku untuk pesanan ini belum tersedia sehingga pesanan tidak dapat kami proses."
              className={`mt-2 w-full resize-none rounded-xl border bg-white px-3.5 py-3 text-[11.5px] leading-relaxed text-ink outline-none transition placeholder:text-slate-400 focus:ring-4 ${
                errors.reason
                  ? 'border-red-300 focus:border-red-400 focus:ring-red-100'
                  : 'border-[#e3e8f2] focus:border-primary focus:ring-primary/10'
              }`}
            />
            {errors.reason && (
              <p className="mt-1.5 text-[9.5px] text-red-600">{errors.reason}</p>
            )}
          </div>

          <p className="mt-2 flex items-start gap-1.5 text-[9.5px] leading-relaxed text-slate-500">
            <PenLine className="mt-0.5 size-3.5 shrink-0" />
            Alasan ini akan tercatat permanen di riwayat audit pesanan dan dikirimkan
            otomatis ke WhatsApp pelanggan.
          </p>

          <label className="mt-3 flex cursor-pointer items-start gap-2.5 rounded-xl bg-[#eef1fb] px-3.5 py-3">
            <input
              type="checkbox"
              checked={notifyWhatsApp}
              onChange={(event) => setNotifyWhatsApp(event.target.checked)}
              className="peer sr-only"
            />
            <span
              className={`mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-[4px] border transition ${
                notifyWhatsApp
                  ? 'border-primary bg-primary text-white'
                  : 'border-slate-300 bg-white text-transparent'
              }`}
            >
              <Check className="size-3" />
            </span>
            <span className="min-w-0">
              <span className="flex flex-wrap items-center gap-1.5">
                <span className="text-[10.5px] font-semibold text-ink">
                  Kirim notifikasi &amp; permohonan maaf via WhatsApp
                </span>
                <span className="rounded bg-[#d9f7ea] px-1.5 py-0.5 text-[8px] font-bold text-[#15803d]">
                  Auto WA
                </span>
              </span>
              <span className="mt-0.5 block text-[9.5px] leading-relaxed text-slate-500">
                Pesan terformat otomatis dikirimkan ke {order.customerName} (
                {order.customerPhone})
              </span>
            </span>
          </label>
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-[#e8ecf5] bg-[#f2f4fd] px-5 py-4 sm:flex-row sm:items-center sm:justify-end sm:px-6">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-11 items-center justify-center rounded-xl border border-[#e3e8f2] bg-white px-4 text-[11.5px] font-semibold text-slate-600 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition hover:bg-slate-50 sm:w-auto"
          >
            Kembali/Batal
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="inline-flex h-11 items-center justify-center gap-1.5 rounded-xl bg-[#c81e1e] px-4 text-[11.5px] font-semibold text-white shadow-sm transition hover:bg-[#a51616] sm:w-auto"
          >
            <CircleX className="size-4" />
            Ya, Batalkan Pesanan
          </button>
        </div>
      </div>
    </div>
  )
}
