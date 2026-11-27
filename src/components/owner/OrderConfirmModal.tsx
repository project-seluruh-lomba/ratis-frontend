import { useState } from 'react'
import {
  CalendarDays,
  Check,
  CheckCircle2,
  CircleCheck,
  HandPlatter,
  Package,
  X,
} from 'lucide-react'
import {
  ownerFulfillmentLabels,
  type OwnerOrder,
} from '../../lib/owner-order-data'

export type OrderConfirmMode = 'process' | 'complete'

export type OrderConfirmResult = {
  readiness: 'recommended' | 'thirty'
  notifyWhatsApp: boolean
}

const numberFormatter = new Intl.NumberFormat('id-ID')

function formatNumber(value: number) {
  return numberFormatter.format(value)
}

function formatRupiah(value: number) {
  return `Rp ${formatNumber(value)}`
}

function formatClock(date: Date) {
  return `${String(date.getHours()).padStart(2, '0')}:${String(
    date.getMinutes(),
  ).padStart(2, '0')} WIB`
}

function formatScheduleDate(value: string) {
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value))
}

function addMinutes(date: Date, minutes: number) {
  return new Date(date.getTime() + minutes * 60_000)
}

export default function OrderConfirmModal({
  order,
  mode,
  onClose,
  onConfirm,
}: {
  order: OwnerOrder
  mode: OrderConfirmMode
  onClose: () => void
  onConfirm: (result: OrderConfirmResult) => void
}) {
  const [readiness, setReadiness] = useState<'recommended' | 'thirty'>('recommended')
  const [notifyWhatsApp, setNotifyWhatsApp] = useState(true)

  const isProcess = mode === 'process'
  const totalQuantity = order.items.reduce((sum, item) => sum + item.qty, 0)
  const itemSummary = order.items
    .map((item) => `${item.qty}x ${item.name}`)
    .join(' & ')

  const schedule = addMinutes(new Date(order.createdAt), 240)
  const recommendedTime = addMinutes(schedule, -30)
  const quickTime = addMinutes(new Date(), 30)
  const scheduleLabel = order.fulfillment === 'ambil' ? 'Jadwal Pengambilan' : 'Jadwal Pengiriman'

  const bankMatch = order.paymentMethod.match(/\(([^)]+)\)/)
  const paymentSource = bankMatch?.[1]
    ? `${bankMatch[1]} Valid`
    : order.paymentMethod.startsWith('QRIS')
      ? 'QRIS Valid'
      : order.paymentMethod.includes('Tunai') || order.paymentMethod.includes('Kas')
        ? 'Tunai'
        : order.paymentStatus === 'lunas'
          ? 'Pembayaran Valid'
          : 'Belum Dibayar'
  const paymentBadge =
    order.paymentStatus === 'lunas'
      ? `${paymentSource} • ${formatRupiah(order.total)}`
      : `Belum Dibayar • ${formatRupiah(order.total)}`

  return (
    <div className="fixed inset-0 z-[72] flex items-end justify-center sm:items-center sm:p-4">
      <div
        className="absolute inset-0 bg-slate-900/45 backdrop-blur-[2px]"
        onClick={onClose}
        aria-hidden
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="order-confirm-title"
        className="relative z-10 flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:max-w-[520px] sm:rounded-2xl"
      >
        <div className="flex items-start justify-between gap-3 border-b border-[#e8ecf5] px-5 pb-4 pt-5 sm:px-6">
          <div className="flex min-w-0 items-start gap-3">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-[#dcf7ee] text-primary">
              {isProcess ? (
                <HandPlatter className="size-[22px]" />
              ) : (
                <CheckCircle2 className="size-[22px]" />
              )}
            </span>
            <div className="min-w-0">
              <h2
                id="order-confirm-title"
                className="text-[19px] font-extrabold leading-snug tracking-tight text-ink"
              >
                {isProcess
                  ? 'Konfirmasi Terima & Proses Pesanan?'
                  : 'Konfirmasi Selesaikan Pesanan?'}
              </h2>
              <p className="mt-1 truncate text-[11px] text-slate-500">
                Pesanan #{order.code} &bull; {order.customerName}
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

        <div className="min-h-0 flex-1 overflow-y-auto bg-[#f6f8fe] px-4 py-4 sm:px-6">
          <div className="rounded-xl bg-[#eef1fb] p-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <p className="text-[9.5px] font-bold uppercase tracking-[0.08em] text-slate-500">
                Ringkasan Pesanan &amp; Verifikasi
              </p>
              <span
                className={`rounded-full px-2.5 py-1 text-[9.5px] font-semibold ${
                  order.paymentStatus === 'lunas'
                    ? 'bg-[#dcfce7] text-[#15803d]'
                    : 'bg-[#fef3c7] text-[#b45309]'
                }`}
              >
                {paymentBadge}
              </span>
            </div>

            <div className="mt-3 space-y-2.5 text-[11px] leading-relaxed text-slate-600">
              <p className="flex items-start gap-2">
                <Package className="mt-0.5 size-4 shrink-0 text-slate-500" />
                <span>
                  <span className="font-bold text-ink">
                    {order.items.length} Jenis Produk ({totalQuantity} Total Item):
                  </span>{' '}
                  {itemSummary}
                </span>
              </p>
              <p className="flex items-start gap-2">
                <CalendarDays className="mt-0.5 size-4 shrink-0 text-slate-500" />
                <span>
                  <span className="font-bold text-ink">{scheduleLabel}:</span> Hari ini,{' '}
                  {formatScheduleDate(order.createdAt)} &bull; {formatClock(schedule)} (
                  {ownerFulfillmentLabels[order.fulfillment]})
                </span>
              </p>
            </div>
          </div>

          {isProcess ? (
            <>
              <p className="mt-4 text-[11.5px] font-semibold text-ink">
                Estimasi Kesiapan Pesanan Dapur
              </p>
              <div className="mt-2.5 grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setReadiness('recommended')}
                  aria-pressed={readiness === 'recommended'}
                  className={`flex items-start gap-2.5 rounded-xl border px-3.5 py-3 text-left transition ${
                    readiness === 'recommended'
                      ? 'border-primary bg-[#eafaf4]'
                      : 'border-[#e6eaf5] bg-[#f1f3fc] hover:border-primary/30'
                  }`}
                >
                  <span
                    className={`mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border-2 ${
                      readiness === 'recommended'
                        ? 'border-primary'
                        : 'border-slate-300'
                    }`}
                  >
                    {readiness === 'recommended' && (
                      <span className="size-2 rounded-full bg-primary" />
                    )}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[12px] font-bold leading-tight text-ink">
                      Pukul {formatClock(recommendedTime)}
                    </span>
                    <span className="mt-1 block text-[10px] text-slate-500">
                      Rekomendasi (-30 mnt)
                    </span>
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setReadiness('thirty')}
                  aria-pressed={readiness === 'thirty'}
                  className={`flex items-start gap-2.5 rounded-xl border px-3.5 py-3 text-left transition ${
                    readiness === 'thirty'
                      ? 'border-primary bg-[#eafaf4]'
                      : 'border-[#e6eaf5] bg-[#f1f3fc] hover:border-primary/30'
                  }`}
                >
                  <span
                    className={`mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border-2 ${
                      readiness === 'thirty' ? 'border-primary' : 'border-slate-300'
                    }`}
                  >
                    {readiness === 'thirty' && (
                      <span className="size-2 rounded-full bg-primary" />
                    )}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[12px] font-bold leading-tight text-ink">
                      30 Menit Saja
                    </span>
                    <span className="mt-1 block text-[10px] text-slate-500">
                      Selesai &plusmn; {formatClock(quickTime)}
                    </span>
                  </span>
                </button>
              </div>

              <p className="mt-3 flex items-start gap-1.5 text-[10.5px] leading-relaxed text-[#15803d]">
                <CircleCheck className="mt-0.5 size-4 shrink-0" />
                Status otomatis diperbarui ke &ldquo;Sedang Diproses&rdquo; &amp; tiket
                produksi dikirim ke antrean dapur.
              </p>
            </>
          ) : (
            <p className="mt-4 flex items-start gap-2 rounded-xl bg-[#eef9f6] p-3.5 text-[10.5px] leading-relaxed text-slate-600">
              <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" />
              <span>
                <span className="font-bold text-ink">
                  Status akan diperbarui ke &ldquo;Selesai&rdquo;.
                </span>{' '}
                Pastikan pesanan sudah diserahkan ke pelanggan. Pemasukan pesanan
                tercatat otomatis di buku kas.
              </span>
            </p>
          )}

          <label className="mt-3 flex cursor-pointer items-start gap-2.5 rounded-xl bg-[#eef1fb] px-3.5 py-3">
            <input
              type="checkbox"
              checked={notifyWhatsApp}
              onChange={(event) => setNotifyWhatsApp(event.target.checked)}
              className="peer sr-only"
            />
            <span
              className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-[5px] border transition ${
                notifyWhatsApp
                  ? 'border-[#2563eb] bg-[#2563eb] text-white'
                  : 'border-slate-300 bg-white text-transparent'
              }`}
            >
              <Check className="size-3" />
            </span>
            <span className="text-[10.5px] leading-relaxed text-slate-600">
              Kirim notifikasi {isProcess ? 'konfirmasi pesanan' : 'pesanan selesai'}{' '}
              otomatis via WhatsApp ke {order.customerName} ({order.customerPhone})
            </span>
          </label>
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-[#e8ecf5] bg-[#f7f9fe] px-5 py-4 sm:flex-row sm:items-center sm:justify-end sm:px-6">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-11 items-center justify-center rounded-xl border border-[#e3e8f2] bg-white px-4 text-[11.5px] font-semibold text-slate-600 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition hover:bg-slate-50 sm:w-auto"
          >
            Batal / Kembali
          </button>
          <button
            type="button"
            onClick={() => onConfirm({ readiness, notifyWhatsApp })}
            className="inline-flex h-11 items-center justify-center gap-1.5 rounded-xl bg-primary px-4 text-[11.5px] font-semibold text-white shadow-sm transition hover:bg-primary-hover sm:w-auto"
          >
            <Check className="size-4" />
            {isProcess ? 'Ya, Terima & Mulai Proses' : 'Ya, Selesaikan Pesanan'}
          </button>
        </div>
      </div>
    </div>
  )
}
