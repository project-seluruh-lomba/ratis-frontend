import { useState } from 'react'
import { X } from 'lucide-react'
import type { OwnerOrder } from '../../lib/owner-order-data'

const quickCancelReasons = [
  'Permintaan pembeli',
  'Stok habis',
  'Pembayaran tidak masuk',
  'Alamat di luar jangkauan',
]

export default function CancelOrderModal({
  order,
  onClose,
  onConfirm,
}: {
  order: OwnerOrder
  onClose: () => void
  onConfirm: (reason: string) => void
}) {
  const [reason, setReason] = useState('')
  const [error, setError] = useState('')

  function handleConfirm() {
    if (reason.trim().length < 10) {
      setError('Alasan pembatalan wajib diisi minimal 10 karakter.')
      return
    }
    onConfirm(reason.trim())
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center sm:p-4">
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />
      <div
        role="dialog"
        aria-modal="true"
        className="relative z-10 max-h-[92vh] w-full overflow-y-auto rounded-t-3xl bg-white p-5 shadow-2xl sm:max-w-lg sm:rounded-2xl sm:p-6"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 className="text-[17px] font-extrabold tracking-tight text-ink">
              Batalkan Pesanan?
            </h2>
            <p className="mt-1 text-[11.5px] leading-relaxed text-slate-500">
              {order.code} • {order.customerName}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup"
            className="flex size-8 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="mt-4 rounded-xl bg-[#fef3c7] p-3 text-[11px] leading-relaxed text-[#92400e]">
          Pesanan yang dibatalkan bersifat final dan tidak dapat diproses kembali. Status
          pembayaran ikut ditandai batal.
        </div>

        <div className="mt-3.5">
          <span className="text-[12px] font-semibold text-ink">Alasan pembatalan *</span>
          <textarea
            value={reason}
            onChange={(event) => {
              setReason(event.target.value)
              setError('')
            }}
            rows={3}
            maxLength={300}
            placeholder="Tuliskan alasan pembatalan (minimal 10 karakter)..."
            className="mt-1.5 w-full resize-none rounded-xl border border-line bg-[#f7f9fc] px-3 py-2.5 text-[11.5px] text-ink outline-none transition placeholder:text-slate-400 focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10"
          />
          <div className="mt-1 flex items-center justify-between gap-2">
            <p className="text-[10px] text-slate-400">Minimal 10 karakter, maksimal 300.</p>
            <p className="text-[10px] text-slate-400">{reason.length}/300</p>
          </div>
        </div>

        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {quickCancelReasons.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => {
                setReason(item)
                setError('')
              }}
              className="rounded-full border border-line bg-white px-2.5 py-1 text-[10px] font-medium text-slate-600 transition hover:border-primary/30 hover:bg-primary-soft/30 hover:text-primary"
            >
              {item}
            </button>
          ))}
        </div>

        {error && (
          <p className="mt-2 rounded-lg bg-[#fde7e7] px-3 py-2 text-[11px] font-medium text-[#b91c1c]">
            {error}
          </p>
        )}

        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="h-10 rounded-xl border border-line bg-white px-4 text-[11.5px] font-semibold text-slate-600 transition hover:bg-slate-50"
          >
            Kembali
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={reason.trim().length < 10}
            className="h-10 rounded-xl bg-[#dc2626] px-4 text-[11.5px] font-semibold text-white transition hover:bg-[#b91c1c] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Batalkan Pesanan
          </button>
        </div>
      </div>
    </div>
  )
}
