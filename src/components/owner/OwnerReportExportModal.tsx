import { useEffect, useRef, useState } from 'react'
import {
  CalendarDays,
  Download,
  FileSpreadsheet,
  Info,
  Loader2,
  Lock,
  TriangleAlert,
  X,
} from 'lucide-react'
import ModalShell from './ModalShell'
import {
  escapeReportCsv,
  filterReportDays,
  formatReportDate,
  formatReportRange,
  isReportRangeTooWide,
  reportMinIso,
  reportTodayIso,
  shiftIsoDate,
} from '../../lib/owner-report-data'

type ExportType = 'pesanan' | 'keuangan'

const exportTypeOptions: {
  id: ExportType
  label: string
  description: string
}[] = [
  {
    id: 'pesanan',
    label: 'Pesanan Penjualan',
    description: 'Rekap pesanan, status selesai, dan omzet harian.',
  },
  {
    id: 'keuangan',
    label: 'Entri Keuangan',
    description: 'Rekap pemasukan omzet dan rata-rata nilai pesanan.',
  },
]

function buildCsv(type: ExportType, start: string, end: string) {
  const days = filterReportDays(start, end)
  const header =
    type === 'pesanan'
      ? [
          'Tanggal',
          'Jumlah Pesanan',
          'Pesanan Selesai',
          'Pesanan Dibatalkan',
          'Omzet Selesai',
          'Pesanan Online',
          'Pesanan POS',
        ]
      : [
          'Tanggal',
          'Pemasukan Omzet',
          'Pesanan Selesai',
          'Rata-rata Nilai Pesanan',
        ]

  const rows = days.map((day) => {
    if (type === 'pesanan') {
      return [
        formatReportDate(day.date),
        day.orders,
        day.completed,
        day.cancelled,
        day.omzet,
        day.onlineOrders,
        day.posOrders,
      ]
    }

    return [
      formatReportDate(day.date),
      day.omzet,
      day.completed,
      day.completed > 0 ? Math.round(day.omzet / day.completed) : 0,
    ]
  })

  const csv = [header, ...rows]
    .map((row) => row.map(escapeReportCsv).join(';'))
    .join('\r\n')

  return { csv, rows: rows.length }
}

export default function OwnerReportExportModal({
  storeName,
  initialStart,
  initialEnd,
  onClose,
  onExported,
}: {
  storeName: string
  initialStart: string
  initialEnd: string
  onClose: () => void
  onExported: (rowCount: number) => void
}) {
  const [type, setType] = useState<ExportType>('pesanan')
  const [start, setStart] = useState(
    initialStart < reportMinIso ? reportMinIso : initialStart,
  )
  const [end, setEnd] = useState(
    initialEnd > reportTodayIso ? reportTodayIso : initialEnd,
  )
  const [loading, setLoading] = useState(false)
  const timerRef = useRef<number | null>(null)

  useEffect(
    () => () => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current)
    },
    [],
  )

  const invalidOrder = start > end
  const tooWide = !invalidOrder && isReportRangeTooWide(start, end)
  const periodDays = invalidOrder ? [] : filterReportDays(start, end)
  const rowCount = periodDays.length
  const blocked = loading || invalidOrder || tooWide

  function handleQuickRange(days: number) {
    const nextStart = shiftIsoDate(reportTodayIso, -(days - 1))
    setStart(nextStart < reportMinIso ? reportMinIso : nextStart)
    setEnd(reportTodayIso)
  }

  function handleDownload() {
    if (blocked) return

    setLoading(true)
    timerRef.current = window.setTimeout(() => {
      const { csv, rows } = buildCsv(type, start, end)
      const blob = new Blob([`\uFEFF${csv}`], {
        type: 'text/csv;charset=utf-8;',
      })
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = `laporan-${type}-${storeName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')}-${start}-${end}.csv`
      document.body.appendChild(anchor)
      anchor.click()
      anchor.remove()
      URL.revokeObjectURL(url)
      setLoading(false)
      onExported(rows)
    }, 700)
  }

  return (
    <ModalShell
      labelledBy="report-export-title"
      onClose={loading ? () => undefined : onClose}
      width="max-w-[540px]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#e7f4f1] text-primary">
            <Download className="size-5" />
          </span>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 id="report-export-title" className="text-[16px] font-bold text-ink">
                Ekspor Laporan CSV
              </h2>
              <span className="rounded bg-[#eef2ff] px-1.5 py-0.5 text-[9px] font-semibold text-[#3b5bdb]">
                Excel &amp; Sheets
              </span>
            </div>
            <p className="mt-1 text-[11px] leading-relaxed text-slate-500">
              Unduh data {storeName} untuk pelaporan pajak UMKM atau pembukuan
              offline.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          disabled={loading}
          aria-label="Tutup dialog ekspor"
          className="flex size-8 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 disabled:opacity-40"
        >
          <X className="size-4" />
        </button>
      </div>

      <p className="mt-4 text-[9px] font-bold uppercase tracking-[0.1em] text-slate-500">
        Jenis Data
      </p>
      <div className="mt-2 grid gap-2.5 sm:grid-cols-2">
        {exportTypeOptions.map((option) => {
          const active = type === option.id
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => setType(option.id)}
              aria-pressed={active}
              className={`relative rounded-xl border p-3 text-left transition ${
                active
                  ? 'border-primary bg-[#e7f4f1]'
                  : 'border-line bg-white hover:bg-slate-50'
              }`}
            >
              <span
                className={`flex size-7 items-center justify-center rounded-full ${
                  active ? 'bg-primary text-white' : 'bg-[#eef2ff] text-[#3b5bdb]'
                }`}
              >
                <FileSpreadsheet className="size-3.5" />
              </span>
              <span
                className={`absolute right-3 top-3 flex size-4 items-center justify-center rounded-full border-2 ${
                  active ? 'border-primary' : 'border-slate-300'
                }`}
              >
                {active ? <span className="size-2 rounded-full bg-primary" /> : null}
              </span>
              <p className="mt-2 text-[11.5px] font-bold text-ink">{option.label}</p>
              <p className="mt-0.5 text-[10px] leading-relaxed text-slate-500">
                {option.description}
              </p>
            </button>
          )
        })}
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
        <p className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.1em] text-slate-500">
          <CalendarDays className="size-3.5 text-slate-400" />
          Periode Ekspor
        </p>
        <div className="flex gap-1">
          {[7, 30, 90].map((days) => (
            <button
              key={days}
              type="button"
              onClick={() => handleQuickRange(days)}
              className="rounded-md bg-[#f1f5f9] px-2 py-1 text-[9px] font-semibold text-slate-600 transition hover:bg-slate-200"
            >
              {days} hari
            </button>
          ))}
        </div>
      </div>

      <div className="mt-2 grid gap-2.5 sm:grid-cols-2">
        <label className="block">
          <span className="text-[10px] font-medium text-slate-600">Dari tanggal</span>
          <input
            type="date"
            value={start}
            min={reportMinIso}
            max={end > reportTodayIso ? reportTodayIso : end}
            onChange={(event) => setStart(event.target.value)}
            className="mt-1.5 h-10 w-full rounded-xl border border-line bg-[#f7f9fc] px-3 text-[11px] text-ink outline-none transition focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10"
          />
        </label>
        <label className="block">
          <span className="text-[10px] font-medium text-slate-600">Sampai tanggal</span>
          <input
            type="date"
            value={end}
            min={start}
            max={reportTodayIso}
            onChange={(event) => setEnd(event.target.value)}
            className="mt-1.5 h-10 w-full rounded-xl border border-line bg-[#f7f9fc] px-3 text-[11px] text-ink outline-none transition focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10"
          />
        </label>
      </div>

      <div
        className={`mt-2.5 flex items-start gap-2 rounded-xl px-3 py-2.5 ${
          tooWide || invalidOrder
            ? 'border border-amber-200 bg-amber-50'
            : 'bg-[#f8fafc]'
        }`}
      >
        {tooWide || invalidOrder ? (
          <TriangleAlert className="mt-0.5 size-3.5 shrink-0 text-amber-600" />
        ) : (
          <Info className="mt-0.5 size-3.5 shrink-0 text-slate-400" />
        )}
        <div className="min-w-0">
          {invalidOrder ? (
            <p className="text-[10px] font-semibold leading-relaxed text-amber-700">
              Tanggal mulai harus lebih awal atau sama dengan tanggal akhir.
            </p>
          ) : tooWide ? (
            <p className="text-[10px] font-semibold leading-relaxed text-amber-700">
              Rentang melebihi 90 hari. Persempit periode ekspor terlebih dahulu.
            </p>
          ) : (
            <>
              <p className="text-[10px] font-semibold text-slate-600">
                {formatReportRange(start, end)}
              </p>
              <p className="mt-0.5 text-[9.5px] leading-relaxed text-slate-500">
                Maksimal 90 hari dan 5.000 baris per ekspor. Periode tanpa data
                tetap menghasilkan file dengan baris header saja.
              </p>
            </>
          )}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-[#f1f5f9] px-3 py-2.5">
        <p className="text-[10px] text-slate-500">
          Perkiraan isi file:{' '}
          <span className="font-bold text-ink">{rowCount} baris data</span>
        </p>
        <p className="inline-flex items-center gap-1 text-[9px] font-medium text-slate-500">
          <Lock className="size-3 shrink-0" />
          Tanpa nomor HP &amp; alamat pelanggan
        </p>
      </div>

      <div className="-mx-5 -mb-5 mt-4 flex flex-col-reverse gap-2 border-t border-line bg-white px-5 py-3.5 sm:-mx-6 sm:-mb-6 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={onClose}
          disabled={loading}
          className="h-10 rounded-xl border border-line px-5 text-[11.5px] font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
        >
          Batal
        </button>
        <button
          type="button"
          onClick={handleDownload}
          disabled={blocked}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-[11.5px] font-semibold text-white transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {loading ? (
            <>
              <Loader2 className="size-3.5 animate-spin" />
              Menyiapkan CSV...
            </>
          ) : (
            <>
              <Download className="size-3.5" />
              Unduh CSV
            </>
          )}
        </button>
      </div>
    </ModalShell>
  )
}
