import { useState } from 'react'
import {
  ArrowRight,
  ArrowUpDown,
  Check,
  Minus,
  Plus,
  Printer,
  RefreshCw,
  ShieldCheck,
  X,
} from 'lucide-react'
import type { OwnerProduct } from '../../lib/owner-product-data'

export type StockAdjustPayload = {
  mode: 'tambah' | 'kurangi'
  amount: number
  reason: string
  note: string
}

type StockAdjustModalProps = {
  product: OwnerProduct
  actorName: string
  initialMode?: 'tambah' | 'kurangi'
  onClose: () => void
  onSave: (payload: StockAdjustPayload) => void
}

const reasons = [
  { label: 'Hasil Produksi Dapur (Batch Baru)', danger: false },
  { label: 'Koreksi Selisih Stok Opname', danger: false },
  { label: 'Retur / Batal Kirim Outlet', danger: false },
  { label: 'Kerusakan / Gosong / Expired', danger: true },
  { label: 'Sample / Tester Pengunjung', danger: false },
  { label: 'Penyelesaian Lainnya', danger: false },
] as const

const noteLimit = 200

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1)
}

function getEstimateMeta(stock: number, minStock: number) {
  if (stock <= 0) return { label: 'Habis', className: 'bg-[#fde7e7] text-[#b91c1c]' }
  if (stock <= minStock) return { label: 'Menipis', className: 'bg-[#fdf0d3] text-[#b45309]' }
  if (stock > minStock * 3) return { label: 'Melimpah', className: 'bg-[#d9f7ea] text-primary' }
  return { label: 'Aman', className: 'bg-[#d9f7ea] text-primary' }
}

export default function StockAdjustModal({
  product,
  actorName,
  initialMode = 'tambah',
  onClose,
  onSave,
}: StockAdjustModalProps) {
  const [mode, setMode] = useState<'tambah' | 'kurangi'>(initialMode)
  const [amountInput, setAmountInput] = useState('10')
  const [reason, setReason] = useState<string>(reasons[0].label)
  const [note, setNote] = useState('')
  const [error, setError] = useState('')
  const [printedAt] = useState(() => new Date())

  const unit = product.stockUnit
  const unitLabel = capitalize(unit)
  const capacity = Math.max(50, Math.ceil((product.stock * 2) / 10) * 10)
  const amount = Math.max(0, Math.floor(Number(amountInput) || 0))
  const delta = mode === 'tambah' ? amount : -amount
  const estimatedStock = Math.max(0, product.stock + delta)
  const estimateMeta = getEstimateMeta(estimatedStock, product.minStock)
  const quickAmounts = [5, 10, 20]
  const clock = `${String(printedAt.getHours()).padStart(2, '0')}.${String(
    printedAt.getMinutes(),
  ).padStart(2, '0')}`

  function changeAmount(next: number) {
    setAmountInput(String(Math.max(0, next)))
    setError('')
  }

  function handleSave() {
    if (amount <= 0) {
      setError('Jumlah penyesuaian harus lebih dari 0.')
      return
    }
    if (mode === 'kurangi' && amount > product.stock) {
      setError('Jumlah pengurangan melebihi stok tersedia.')
      return
    }
    onSave({ mode, amount, reason, note: note.trim() })
  }

  function handlePrintLabel() {
    const escape = (value: string) =>
      value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    const win = window.open('', '_blank', 'width=420,height=560')
    if (!win) {
      setError('Popup diblokir browser. Izinkan popup untuk mencetak label batch.')
      return
    }
    win.document.write(`<!doctype html><html lang="id"><head><meta charset="utf-8" />
<title>Label Batch ${escape(product.sku)}</title>
<style>
  body{font-family:Arial,Helvetica,sans-serif;margin:24px;color:#0f172a}
  .card{border:2px dashed #0f766e;border-radius:14px;padding:18px}
  h1{font-size:16px;margin:0 0 2px}
  .sku{font-size:11px;color:#64748b;letter-spacing:.08em}
  .row{display:flex;justify-content:space-between;font-size:12px;margin-top:12px}
  .big{font-size:34px;font-weight:800;margin:14px 0 0}
  .note{margin-top:12px;font-size:11px;line-height:1.5;border-top:1px solid #e2e8f0;padding-top:10px}
  .muted{color:#64748b}
</style></head><body>
  <div class="card">
    <p class="sku">RATIS BISNIS • LABEL BATCH</p>
    <h1>${escape(product.name)}</h1>
    <p class="sku">SKU: ${escape(product.sku)}</p>
    <p class="big">${mode === 'tambah' ? '+' : '-'}${amount} ${escape(unit)}</p>
    <div class="row"><span class="muted">Alasan</span><strong>${escape(reason)}</strong></div>
    <div class="row"><span class="muted">Stok akhir</span><strong>${estimatedStock} ${escape(unit)}</strong></div>
    <div class="row"><span class="muted">Waktu</span><strong>${clock} WIB</strong></div>
    <div class="row"><span class="muted">Dicatat oleh</span><strong>${escape(actorName)}</strong></div>
    ${note ? `<p class="note">${escape(note)}</p>` : ''}
  </div>
</body></html>`)
    win.document.close()
    win.focus()
    win.print()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} aria-hidden />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Sesuaikan stok fisik"
        className="relative z-10 flex max-h-[94dvh] w-full flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:max-w-[720px] sm:rounded-2xl"
      >
        <div className="flex shrink-0 items-start gap-3 px-5 pb-4 pt-5 sm:px-6 sm:pt-6">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary-soft/60 text-primary">
            <ArrowUpDown className="size-5" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-[17px] font-extrabold tracking-tight text-ink sm:text-[19px]">
                Sesuaikan Stok Fisik
              </h2>
              <span className="rounded-full border border-line px-2 py-0.5 text-[8.5px] font-semibold tracking-[0.08em] text-slate-500">
                AUDIT SOP 5.5
              </span>
            </div>
            <p className="mt-0.5 text-[11px] leading-relaxed text-slate-500">
              Penyesuaian sinkron otomatis ke Kasir POS &amp; Laporan Harian
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

        <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-5 sm:px-6">
          <div className="flex items-center gap-3 rounded-xl bg-[#f4f7fb] p-3">
            <span className="flex size-14 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#f7e8d2] to-[#e3c8a5] text-[15px] font-extrabold text-[#8a5a2b]">
              {product.name
                .split(' ')
                .filter(Boolean)
                .slice(0, 2)
                .map((word) => word[0]?.toUpperCase())
                .join('')}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-bold text-ink">{product.name}</p>
              <p className="mt-0.5 truncate text-[10px] text-slate-500">
                SKU: {product.sku} <span className="text-slate-300">•</span> Satuan: {unitLabel}
              </p>
            </div>
            <div className="shrink-0 text-right">
              <p className="inline-flex items-center gap-1.5 text-[10.5px] font-semibold text-primary">
                <span className="size-1.5 rounded-full bg-primary" />
                {product.stock} {unitLabel} Ada
              </p>
              <p className="mt-0.5 text-[9.5px] text-slate-500">
                Min. Aman: {product.minStock} {unit}
              </p>
            </div>
          </div>

          <div className="mt-4">
            <div className="flex flex-wrap items-baseline justify-between gap-1">
              <p className="text-[11.5px] font-semibold text-ink">
                Jenis Perubahan Inventori <span className="text-[#dc2626]">*</span>
              </p>
              <p className="text-[10px] text-slate-500">Pilih arah mutasi barang</p>
            </div>
            <div className="mt-2 grid grid-cols-2 gap-1 rounded-xl bg-[#f1f4fa] p-1">
              {(
                [
                  { key: 'tambah', label: 'Tambah Stok Dapur' },
                  { key: 'kurangi', label: 'Kurangi / Koreksi Min' },
                ] as const
              ).map((option) => {
                const active = mode === option.key
                const Icon = option.key === 'tambah' ? Plus : Minus
                return (
                  <button
                    key={option.key}
                    type="button"
                    onClick={() => {
                      setMode(option.key)
                      setError('')
                    }}
                    className={`flex items-center justify-center gap-2 rounded-lg px-2 py-2.5 text-[11.5px] font-semibold transition ${
                      active
                        ? 'border border-[#bfe3da] bg-white text-ink shadow-sm'
                        : 'border border-transparent text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    <span
                      className={`flex size-6 items-center justify-center rounded-full ${
                        active ? 'bg-primary-soft text-primary' : 'bg-white/70 text-slate-400'
                      }`}
                    >
                      <Icon className="size-3.5" />
                    </span>
                    {option.label}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-baseline justify-between gap-1">
            <p className="text-[11.5px] font-semibold text-ink">Jumlah {unitLabel} Disesuaikan</p>
            <p className="text-[10px] text-slate-500">
              Kapasitas rak {unit}: {capacity} unit
            </p>
          </div>
          <div className="mt-2 flex items-stretch gap-2">
            <button
              type="button"
              onClick={() => changeAmount(amount - 1)}
              aria-label={`Kurangi jumlah ${unit}`}
              className="flex w-11 shrink-0 items-center justify-center rounded-xl bg-[#f1f4fa] text-slate-600 transition hover:bg-[#e6ebf5]"
            >
              <Minus className="size-4" />
            </button>
            <div className="relative flex flex-1 items-center justify-center rounded-xl bg-[#f1f4fa]">
              <input
                type="text"
                inputMode="numeric"
                aria-label={`Jumlah ${unit}`}
                value={amountInput}
                onChange={(event) => {
                  const raw = event.target.value.replace(/\D/g, '')
                  setAmountInput(raw.slice(0, 4))
                  setError('')
                }}
                className="h-14 w-full bg-transparent px-14 text-center text-[26px] font-extrabold tracking-tight text-ink outline-none"
              />
              <span className="pointer-events-none absolute right-4 text-[10.5px] font-medium text-slate-500">
                {unitLabel}
              </span>
            </div>
            <button
              type="button"
              onClick={() => changeAmount(amount + 1)}
              aria-label={`Tambah jumlah ${unit}`}
              className="flex w-11 shrink-0 items-center justify-center rounded-xl bg-primary text-white transition hover:bg-primary-hover"
            >
              <Plus className="size-4" />
            </button>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            <span className="text-[9.5px] text-slate-500">Pilih Cepat</span>
            {quickAmounts.map((value) => {
              const active = amount === value
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => changeAmount(value)}
                  className={`rounded-full border px-2.5 py-1 text-[9.5px] font-semibold transition ${
                    active
                      ? 'border-primary/40 bg-primary-soft text-primary'
                      : 'border-[#e6ebf5] bg-[#f4f7fb] text-slate-600 hover:border-slate-300'
                  }`}
                >
                  {mode === 'tambah' ? '+' : '−'}
                  {value} {unitLabel}
                  {value === 10 ? ' (1 Oven)' : ''}
                </button>
              )
            })}
            <button
              type="button"
              onClick={() => changeAmount(10)}
              className="rounded-full border border-[#e6ebf5] bg-[#f4f7fb] px-2.5 py-1 text-[9.5px] font-semibold text-slate-600 transition hover:border-slate-300"
            >
              1 Kloter Penuh
            </button>
          </div>

          <div className="mt-4 rounded-xl bg-[#f4f7fb] p-3.5">
            <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)_auto_minmax(0,1fr)] sm:items-center">
              <div>
                <p className="text-[9.5px] text-slate-500">Stok Saat Ini</p>
                <p className="mt-0.5">
                  <span className="text-[18px] font-extrabold text-ink">{product.stock}</span>{' '}
                  <span className="text-[10px] text-slate-500">{unit}</span>
                </p>
              </div>
              <span className="hidden size-7 items-center justify-center rounded-full bg-white text-primary shadow-sm sm:flex">
                <Plus className="size-3.5" />
              </span>
              <div>
                <p className="text-[9.5px] text-slate-500">Perubahan</p>
                <p
                  className={`mt-0.5 text-[18px] font-extrabold ${
                    delta >= 0 ? 'text-primary' : 'text-[#dc2626]'
                  }`}
                >
                  {delta >= 0 ? '+' : ''}
                  {delta} <span className="text-[10px] font-medium">{unit}</span>
                </p>
              </div>
              <span className="hidden items-center justify-center text-slate-400 sm:flex">
                <ArrowRight className="size-4" />
              </span>
              <div className="sm:text-right">
                <p className="text-[9.5px] text-slate-500">Estimasi Stok Baru</p>
                <p className="mt-0.5 flex items-center gap-1.5 sm:justify-end">
                  <span className="text-[18px] font-extrabold text-ink">{estimatedStock}</span>
                  <span className="text-[10px] text-slate-500">{unitLabel}</span>
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-semibold ${estimateMeta.className}`}
                  >
                    <Check className="size-2.5" />
                    {estimateMeta.label}
                  </span>
                </p>
              </div>
            </div>
            <p className="mt-2.5 flex items-center gap-1.5 border-t border-[#e6ecf3] pt-2 text-[9.5px] text-slate-500">
              <RefreshCw className="size-3 shrink-0 text-slate-400" />
              Nilai ini langsung diperbarui di inventori kasir POS &amp; katalog pesanan online.
            </p>
          </div>

          <div className="mt-4">
            <div className="flex flex-wrap items-baseline justify-between gap-1">
              <p className="text-[11.5px] font-semibold text-ink">
                Pilih Alasan Penyesuaian <span className="text-[#dc2626]">*</span>
              </p>
              <p className="text-[10px] text-slate-500">Wajib untuk pembukuan stok</p>
            </div>
            <div className="mt-2 grid gap-1.5 sm:grid-cols-2">
              {reasons.map((option) => {
                const active = reason === option.label
                return (
                  <label
                    key={option.label}
                    className={`flex cursor-pointer items-center gap-2 rounded-lg border px-2.5 py-2.5 text-[10.5px] font-medium transition ${
                      active
                        ? 'border-[#bfe3da] bg-[#e9f7f3] text-ink'
                        : option.danger
                          ? 'border-[#e6ebf5] bg-[#f7f9fc] text-[#b91c1c] hover:border-slate-300'
                          : 'border-[#e6ebf5] bg-[#f7f9fc] text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="stock-adjust-reason"
                      value={option.label}
                      checked={active}
                      onChange={() => setReason(option.label)}
                      className="sr-only"
                    />
                    <span
                      className={`flex size-3.5 shrink-0 items-center justify-center rounded-full border ${
                        active ? 'border-primary' : 'border-slate-400'
                      }`}
                    >
                      {active && <span className="size-2 rounded-full bg-primary" />}
                    </span>
                    {option.label}
                  </label>
                )
              })}
            </div>
          </div>

          <div className="mt-4">
            <div className="flex flex-wrap items-baseline justify-between gap-1">
              <p className="text-[11.5px] font-semibold text-ink">
                Catatan Tambahan &amp; Nomor Kloter{' '}
                <span className="font-normal text-slate-500">(Opsional)</span>
              </p>
              <p className="text-[10px] text-slate-500">
                {note.length} / {noteLimit} karakter
              </p>
            </div>
            <textarea
              rows={3}
              maxLength={noteLimit}
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Contoh: Batch oven pagi kloter #045, selesai pk 09.30 WIB"
              className="mt-2 w-full resize-none rounded-xl border border-transparent bg-[#f4f7fb] px-3.5 py-3 text-[11.5px] leading-relaxed text-ink outline-none transition placeholder:text-slate-400 focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10"
            />
          </div>

          {error && (
            <p className="mt-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[10.5px] font-medium text-red-600">
              {error}
            </p>
          )}
        </div>

        <div className="shrink-0 border-t border-line bg-white px-5 pb-5 pt-3 sm:px-6">
          <p className="flex items-center gap-1.5 text-[9.5px] text-slate-500">
            <ShieldCheck className="size-3 shrink-0 text-slate-400" />
            Tercatat oleh: {actorName} (Pemilik Toko) <span className="text-slate-300">•</span>{' '}
            {clock} WIB <span className="text-slate-300">•</span> Masuk ke log audit permanen.
          </p>
          <div className="mt-2.5 flex flex-col-reverse gap-2 sm:flex-row">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-11 items-center justify-center rounded-xl border border-line px-4 text-[11.5px] font-semibold text-slate-600 transition hover:bg-slate-50"
            >
              Batalkan
            </button>
            <button
              type="button"
              onClick={handlePrintLabel}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-line px-4 text-[11px] font-semibold leading-tight text-slate-700 transition hover:bg-slate-50"
            >
              <Printer className="size-4 text-slate-500" />
              Cetak Label Batch
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-[11.5px] font-semibold text-white shadow-sm transition hover:bg-primary-hover"
            >
              <Check className="size-4" />
              Simpan Penyesuaian Stok
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
