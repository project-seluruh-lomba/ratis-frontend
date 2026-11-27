import { useEffect, useState } from 'react'
import {
  AlertTriangle,
  Landmark,
  Layers,
  Loader2,
  ShieldCheck,
  X,
} from 'lucide-react'
import type { PayoutRecord, PayoutStatus } from '../../lib/admin-finance-data'

const statusMeta: Record<PayoutStatus, { label: string; badge: string; dot: string }> = {
  menunggu: { label: 'Menunggu Transfer', badge: 'bg-amber-50 text-amber-700', dot: 'bg-amber-500' },
  diverifikasi: { label: 'Diverifikasi', badge: 'bg-sky-50 text-sky-700', dot: 'bg-sky-500' },
  berhasil: { label: 'Berhasil', badge: 'bg-emerald-50 text-emerald-700', dot: 'bg-emerald-500' },
  terkirim: { label: 'Terkirim', badge: 'bg-slate-100 text-slate-600', dot: 'bg-slate-400' },
}

const numberFormatter = new Intl.NumberFormat('id-ID')

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

export default function BatchPayoutModal({
  payouts,
  processing = false,
  onClose,
  onConfirm,
}: {
  payouts: PayoutRecord[]
  processing?: boolean
  onClose: () => void
  onConfirm: () => void
}) {
  const [acknowledged, setAcknowledged] = useState(false)

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && !processing) onClose()
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose, processing])

  const totalNet = payouts.reduce((total, payout) => total + payout.netAmount, 0)
  const totalCommission = payouts.reduce((total, payout) => total + payout.commission, 0)
  const banks = [...new Set(payouts.map((payout) => payout.bank))]

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center sm:p-4">
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        onClick={() => {
          if (!processing) onClose()
        }}
        aria-hidden
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Proses batch pencairan dana"
        className="relative z-10 max-h-[92vh] w-full overflow-y-auto rounded-t-3xl bg-white p-5 shadow-2xl sm:max-w-lg sm:rounded-2xl sm:p-6"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-start gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary-soft/60 text-primary">
              <Layers className="size-5" />
            </span>
            <div className="min-w-0">
              <h2 className="text-[17px] font-extrabold tracking-tight text-ink">
                Proses Batch Pencairan
              </h2>
              <p className="mt-1 text-[11.5px] leading-relaxed text-slate-500">
                {payouts.length} pengajuan dipilih untuk diproses sekaligus.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={processing}
            aria-label="Tutup"
            className="flex size-8 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2">
          <div className="rounded-xl bg-[#f4f5fa] p-2.5">
            <p className="text-[8px] font-semibold uppercase tracking-[0.1em] text-muted">
              Pengajuan
            </p>
            <p className="mt-1 text-sm font-extrabold text-ink">{payouts.length}</p>
          </div>
          <div className="rounded-xl bg-[#f4f5fa] p-2.5">
            <p className="text-[8px] font-semibold uppercase tracking-[0.1em] text-muted">
              Dana Bersih
            </p>
            <p className="mt-1 text-sm font-extrabold text-ink">{formatRupiah(totalNet)}</p>
          </div>
          <div className="rounded-xl bg-[#f4f5fa] p-2.5">
            <p className="text-[8px] font-semibold uppercase tracking-[0.1em] text-muted">
              Komisi 1%
            </p>
            <p className="mt-1 text-sm font-extrabold text-ink">
              {formatRupiah(totalCommission)}
            </p>
          </div>
        </div>

        <div className="mt-3 rounded-xl bg-[#fef3c7] p-3 text-[11px] leading-relaxed text-[#92400e]">
          <div className="flex items-start gap-2">
            <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-amber-600" />
            <p>
              Batch akan diotorisasi dan diteruskan ke kliring berikutnya. Status pengajuan
              berubah menjadi <span className="font-bold">Berhasil</span> dan proses ini tidak
              dapat dibatalkan.
            </p>
          </div>
        </div>

        <div className="mt-3 rounded-xl border border-line">
          <div className="flex items-center justify-between gap-2 border-b border-line bg-[#f4f5fa] px-3 py-2">
            <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-muted">
              Rincian Pengajuan
            </p>
            <span className="inline-flex items-center gap-1 text-[9px] font-medium text-muted">
              <Landmark className="size-3" />
              {banks.length} bank tujuan
            </span>
          </div>
          <ul className="max-h-52 divide-y divide-line overflow-y-auto">
            {payouts.map((payout) => {
              const meta = statusMeta[payout.status]

              return (
                <li key={payout.id} className="flex items-center gap-2.5 px-3 py-2.5">
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary-soft/50 text-[9px] font-bold text-primary">
                    {getInitials(payout.storeName)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[10px] font-bold text-ink">{payout.storeName}</p>
                    <p className="truncate text-[9px] text-muted">
                      {payout.id} • {payout.bank} • {payout.account}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="whitespace-nowrap text-[10px] font-bold text-ink">
                      {formatRupiah(payout.netAmount)}
                    </p>
                    <span
                      className={`mt-0.5 inline-flex items-center gap-1 whitespace-nowrap rounded-full px-1.5 py-0.5 text-[8px] font-semibold ${meta.badge}`}
                    >
                      <span className={`size-1 rounded-full ${meta.dot}`} />
                      {meta.label}
                    </span>
                  </div>
                </li>
              )
            })}
          </ul>
        </div>

        <label className="mt-3 flex cursor-pointer items-start gap-2.5 rounded-xl border border-line bg-[#f7f9fc] p-3 text-[10.5px] leading-relaxed text-slate-600">
          <input
            type="checkbox"
            checked={acknowledged}
            onChange={(event) => setAcknowledged(event.target.checked)}
            disabled={processing}
            className="mt-0.5 size-3.5 shrink-0 cursor-pointer accent-[#0f766e] disabled:cursor-not-allowed disabled:opacity-40"
          />
          <span>
            Saya telah memverifikasi rekening tujuan dan memahami bahwa batch ini bersifat
            final serta tidak dapat dibatalkan.
          </span>
        </label>

        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={processing}
            className="h-10 rounded-xl border border-line bg-white px-4 text-[11.5px] font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={!acknowledged || processing}
            className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl bg-primary px-4 text-[11.5px] font-semibold text-white transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
          >
            {processing ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Memproses...
              </>
            ) : (
              <>
                <ShieldCheck className="size-4" />
                Konfirmasi &amp; Proses ({payouts.length})
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
