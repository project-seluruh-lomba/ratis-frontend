import { useMemo, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  AlertTriangle,
  Banknote,
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Copy,
  Download,
  Hammer,
  History,
  Landmark,
  Layers,
  Percent,
  QrCode,
  RefreshCw,
  Search,
  ShieldCheck,
  Shirt,
  Store,
  TrendingUp,
  UtensilsCrossed,
  Wallet,
} from 'lucide-react'
import AdminToast, { type ToastTone } from '../../components/admin/AdminToast'
import BatchPayoutModal from '../../components/admin/BatchPayoutModal'
import FinanceTrendChart from '../../components/admin/FinanceTrendChart'
import {
  auditEntries,
  commissionTiers,
  escrowAccount,
  financeDays,
  financeMonthLabel,
  type PayoutRecord,
  type PayoutStatus,
} from '../../lib/admin-finance-data'
import { payoutsApi } from '../../lib/api/services'

type Period = 'hari-ini' | '7-hari' | 'bulan-ini' | 'kustom'
type PayoutTab = 'semua' | PayoutStatus

const PAGE_SIZE = 5
const AUDIT_PREVIEW_COUNT = 3

const payoutStatusMeta: Record<PayoutStatus, { label: string; badge: string; dot: string }> = {
  menunggu: { label: 'Menunggu Transfer', badge: 'bg-amber-50 text-amber-700', dot: 'bg-amber-500' },
  diverifikasi: {
    label: 'Diverifikasi',
    badge: 'bg-sky-50 text-sky-700',
    dot: 'bg-sky-500',
  },
  berhasil: {
    label: 'Berhasil',
    badge: 'bg-emerald-50 text-emerald-700',
    dot: 'bg-emerald-500',
  },
  terkirim: { label: 'Terkirim', badge: 'bg-slate-100 text-slate-600', dot: 'bg-slate-400' },
}

const payoutTabs: { value: PayoutTab; label: string }[] = [
  { value: 'semua', label: 'Semua' },
  { value: 'menunggu', label: 'Menunggu Transfer' },
  { value: 'berhasil', label: 'Berhasil' },
  { value: 'diverifikasi', label: 'Diverifikasi' },
  { value: 'terkirim', label: 'Terkirim' },
]

const tierIcons = [UtensilsCrossed, Hammer, Shirt]

function isActionable(status: PayoutStatus) {
  return status === 'menunggu' || status === 'diverifikasi'
}

const numberFormatter = new Intl.NumberFormat('id-ID')

const clockFormatter = new Intl.DateTimeFormat('id-ID', {
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
  timeZone: 'Asia/Jakarta',
})

const payoutTimeFormatter = new Intl.DateTimeFormat('id-ID', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
  timeZone: 'Asia/Jakarta',
})

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

export default function AdminFinancialReportPage() {
  const [period, setPeriod] = useState<Period>('bulan-ini')
  const [customStart, setCustomStart] = useState(financeDays[0].date)
  const [customEnd, setCustomEnd] = useState(financeDays[financeDays.length - 1].date)
  const [syncedAt, setSyncedAt] = useState(() => new Date())
  const queryClient = useQueryClient()
  const {
    data: payouts = [],
    isLoading: payoutsLoading,
    isError: payoutsError,
    refetch: refetchPayouts,
  } = useQuery({ queryKey: ['admin-payouts'], queryFn: payoutsApi.list })
  const [processing, setProcessing] = useState(false)
  const [statusTab, setStatusTab] = useState<PayoutTab>('semua')
  const [keyword, setKeyword] = useState('')
  const [bankFilter, setBankFilter] = useState('semua')
  const [page, setPage] = useState(1)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [batchOpen, setBatchOpen] = useState(false)
  const [auditFilter, setAuditFilter] = useState<'terbaru' | 'semua'>('terbaru')
  const [toast, setToast] = useState<{ message: string; tone: ToastTone } | null>(null)

  const periodOptions: { value: Period; label: string }[] = [
    { value: 'hari-ini', label: 'Hari Ini' },
    { value: '7-hari', label: '7 Hari' },
    { value: 'bulan-ini', label: `Bulan Ini (${financeMonthLabel})` },
    { value: 'kustom', label: 'Kustom' },
  ]

  const periodLabel = period === 'bulan-ini' ? `Bulan Ini (${financeMonthLabel})` : periodOptions.find((option) => option.value === period)?.label ?? ''

  function showToast(message: string, tone: ToastTone = 'success') {
    setToast({ message, tone })
    window.setTimeout(() => setToast(null), 4200)
  }

  const daysInPeriod = useMemo(() => {
    if (period === 'hari-ini') return financeDays.slice(-1)
    if (period === '7-hari') return financeDays.slice(-7)
    if (period === 'kustom') {
      return financeDays.filter((day) => day.date >= customStart && day.date <= customEnd)
    }
    return financeDays
  }, [period, customStart, customEnd])

  const grossTotal = daysInPeriod.reduce((total, day) => total + day.gross, 0)
  const ordersTotal = daysInPeriod.reduce((total, day) => total + day.orders, 0)
  const commissionTotal = Math.round(grossTotal * 0.01)
  const averageDaily = daysInPeriod.length ? Math.round(grossTotal / daysInPeriod.length) : 0
  const qrisIncoming = Math.round((financeDays[financeDays.length - 1]?.gross ?? 0) * 0.52)

  const readyPayouts = payouts.filter(
    (payout) => payout.status === 'menunggu' || payout.status === 'diverifikasi',
  )
  const readyTotal = readyPayouts.reduce((total, payout) => total + payout.netAmount, 0)

  const payoutBanks = useMemo(
    () =>
      [...new Set(payouts.map((payout) => payout.bank))].sort((first, second) =>
        first.localeCompare(second, 'id'),
      ),
    [payouts],
  )

  const payoutCounts = useMemo(
    () => ({
      semua: payouts.length,
      menunggu: payouts.filter((payout) => payout.status === 'menunggu').length,
      berhasil: payouts.filter((payout) => payout.status === 'berhasil').length,
      diverifikasi: payouts.filter((payout) => payout.status === 'diverifikasi').length,
      terkirim: payouts.filter((payout) => payout.status === 'terkirim').length,
    }),
    [payouts],
  )

  const filteredPayouts = useMemo(() => {
    const search = keyword.trim().toLowerCase()

    return payouts.filter((payout) => {
      if (statusTab !== 'semua' && payout.status !== statusTab) return false
      if (bankFilter !== 'semua' && payout.bank !== bankFilter) return false
      if (!search) return true
      return [payout.id, payout.storeName, payout.owner, payout.bank, payout.account].some((value) =>
        value.toLowerCase().includes(search),
      )
    })
  }, [payouts, statusTab, bankFilter, keyword])

  const pageCount = Math.max(1, Math.ceil(filteredPayouts.length / PAGE_SIZE))
  const safePage = Math.min(page, pageCount)
  const visiblePayouts = filteredPayouts.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  const pageNumbers = Array.from({ length: pageCount }, (_, index) => index + 1).filter(
    (number) => number === 1 || number === pageCount || Math.abs(number - safePage) <= 1,
  )

  const selectableVisiblePayouts = visiblePayouts.filter((payout) => isActionable(payout.status))
  const allVisibleSelected =
    selectableVisiblePayouts.length > 0 &&
    selectableVisiblePayouts.every((payout) => selectedIds.includes(payout.id))
  const selectedPayouts = payouts.filter((payout) => selectedIds.includes(payout.id))

  const visibleAudit =
    auditFilter === 'terbaru' ? auditEntries.slice(0, AUDIT_PREVIEW_COUNT) : auditEntries

  function handleOpenBatch() {
    if (selectedPayouts.length === 0) return
    setBatchOpen(true)
  }

  async function handleConfirmBatch() {
    const actionableIds = selectedPayouts
      .filter((payout) => isActionable(payout.status))
      .map((payout) => payout.id)

    if (actionableIds.length === 0) {
      setBatchOpen(false)
      return
    }

    setProcessing(true)
    try {
      const result = await payoutsApi.processBatch(actionableIds)
      queryClient.setQueryData<PayoutRecord[]>(['admin-payouts'], (current) =>
        current?.map((payout) =>
          result.processedIds.includes(payout.id) ? { ...payout, status: 'berhasil' } : payout,
        ),
      )
      setSelectedIds([])
      setBatchOpen(false)
      showToast(
        `${result.processedCount} pengajuan pencairan diproses. Dana akan masuk ke rekening merchant pada kliring berikutnya.`,
      )
    } catch (error) {
      const message =
        (error as { userMessage?: string })?.userMessage ||
        'Gagal memproses batch pencairan. Periksa koneksi ke server lalu coba lagi.'
      showToast(message, 'error')
    } finally {
      setProcessing(false)
    }
  }

  function handleToggleSelect(id: string) {
    const payout = payouts.find((item) => item.id === id)
    if (!payout || !isActionable(payout.status)) return

    setSelectedIds((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    )
  }

  function handleToggleSelectAll() {
    if (allVisibleSelected) {
      setSelectedIds((current) =>
        current.filter((id) => !selectableVisiblePayouts.some((payout) => payout.id === id)),
      )
      return
    }

    setSelectedIds((current) => [
      ...current,
      ...selectableVisiblePayouts
        .filter((payout) => !current.includes(payout.id))
        .map((payout) => payout.id),
    ])
  }

  function handleResetPayoutFilters() {
    setStatusTab('semua')
    setKeyword('')
    setBankFilter('semua')
    setPage(1)
  }

  function handleDownloadReport() {
    const rows: (string | number)[][] = [
      ['Laporan Keuangan Platform Ratis'],
      ['Periode', periodLabel],
      ['Total Omzet Kotor (GMV)', grossTotal],
      ['Pendapatan Komisi (1%)', commissionTotal],
      ['Dana Siap Settlement', readyTotal],
      ['Dana Kini QRIS (H+1)', qrisIncoming],
      [],
      ['Tanggal', 'Omzet Masuk', 'Dana Dicairkan', 'Komisi Platform', 'Jumlah Pesanan'],
      ...daysInPeriod.map((day) => [
        day.date,
        day.gross,
        day.disbursed,
        day.commission,
        day.orders,
      ]),
      [],
      [
        'ID Payout',
        'Toko UMKM',
        'Pemilik',
        'Bank',
        'Rekening',
        'Metode',
        'Jumlah Bersih',
        'Komisi',
        'Waktu Pengajuan',
        'Status',
      ],
      ...payouts.map((payout) => [
        payout.id,
        payout.storeName,
        payout.owner,
        payout.bank,
        payout.account,
        payout.method,
        payout.netAmount,
        payout.commission,
        payoutTimeFormatter.format(new Date(payout.submittedAt)),
        payoutStatusMeta[payout.status].label,
      ]),
    ]

    const csv = rows
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n')
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `laporan-keuangan-ratis-${daysInPeriod[daysInPeriod.length - 1]?.date ?? 'periode'}.csv`
    link.click()
    URL.revokeObjectURL(url)
    showToast('Laporan keuangan berhasil diunduh dalam format CSV.')
  }

  async function handleCopyAccount() {
    try {
      await navigator.clipboard.writeText(escrowAccount.accountNumber)
      showToast('Nomor rekening escrow disalin ke papan klip.', 'info')
    } catch {
      showToast('Gagal menyalin otomatis. Salin nomor rekening langsung dari kartu escrow.', 'error')
    }
  }

  return (
    <div>
      {toast && (
        <AdminToast message={toast.message} tone={toast.tone} onClose={() => setToast(null)} />
      )}

      {batchOpen && (
        <BatchPayoutModal
          payouts={selectedPayouts}
          processing={processing}
          onClose={() => setBatchOpen(false)}
          onConfirm={handleConfirmBatch}
        />
      )}

      <section>
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-soft/70 px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.14em] text-primary">
                <span className="size-1.5 rounded-full bg-primary" />
                Audit Finansial &amp; Settlement
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/25 px-2.5 py-1 text-[9px] font-semibold text-primary">
                <span className="size-1.5 rounded-full bg-emerald-500" />
                Otomatisasi Kliring Hari Aktif
              </span>
            </div>

            <p className="mt-2.5 flex items-center gap-1.5 text-[10px] text-muted">
              Sinkronisasi terakhir: Hari Ini {clockFormatter.format(syncedAt)} WIB
              <button
                type="button"
                onClick={() => setSyncedAt(new Date())}
                aria-label="Segarkan laporan keuangan"
                title="Segarkan laporan"
                className="flex size-5 items-center justify-center rounded-md text-slate-400 transition hover:bg-slate-100 hover:text-ink"
              >
                <RefreshCw className="size-3" />
              </button>
            </p>

            <h1 className="mt-2.5 text-2xl font-extrabold leading-tight tracking-tight text-ink sm:text-[30px]">
              Laporan &amp; Keuntungan Platform
            </h1>
            <p className="mt-2 max-w-xl text-xs leading-relaxed text-muted">
              Agregasi omzet GMV nasional, rekonsiliasi bagi hasil komisi platform (1.0%), dan
              pengawasan payout saldo merchant UMKM.
            </p>
          </div>

          <div className="flex shrink-0 flex-col gap-2 sm:flex-row sm:items-center">
            <div className="inline-flex flex-wrap items-center gap-0.5 rounded-xl bg-[#f4f5fa] p-1">
              {periodOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    setPeriod(option.value)
                    setPage(1)
                  }}
                  aria-pressed={period === option.value}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-[10px] transition ${
                    period === option.value
                      ? 'bg-white font-bold text-ink shadow-sm'
                      : 'font-medium text-slate-500 hover:text-ink'
                  }`}
                >
                  {option.value === 'kustom' && <CalendarDays className="size-3" />}
                  {option.label}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={handleDownloadReport}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-[11px] font-semibold text-white transition hover:bg-primary-hover"
            >
              <Download className="size-4" />
              Unduh Laporan (CSV / PDF)
            </button>
          </div>
        </div>
      </section>

      {period === 'kustom' && (
        <section className="mt-3 flex flex-wrap items-center gap-3 rounded-2xl border border-line bg-white p-3.5 shadow-sm">
          <label className="flex items-center gap-2 text-[10px] font-semibold text-slate-600">
            Dari
            <input
              type="date"
              value={customStart}
              min={financeDays[0].date}
              max={customEnd}
              onChange={(event) => {
                setCustomStart(event.target.value)
                setPage(1)
              }}
              className="h-9 rounded-lg border border-line bg-[#f7f7fb] px-2.5 text-[10px] text-ink outline-none focus:border-primary focus:bg-white"
            />
          </label>
          <label className="flex items-center gap-2 text-[10px] font-semibold text-slate-600">
            Sampai
            <input
              type="date"
              value={customEnd}
              min={customStart}
              max={financeDays[financeDays.length - 1].date}
              onChange={(event) => {
                setCustomEnd(event.target.value)
                setPage(1)
              }}
              className="h-9 rounded-lg border border-line bg-[#f7f7fb] px-2.5 text-[10px] text-ink outline-none focus:border-primary focus:bg-white"
            />
          </label>
          <span className="text-[10px] text-muted">
            {daysInPeriod.length} hari transaksi pada rentang terpilih
          </span>
        </section>
      )}

      <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="min-w-0 space-y-4">
          <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
            <article className="flex flex-col rounded-2xl border border-line bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-2">
                <p className="text-[8px] font-bold uppercase leading-relaxed tracking-[0.12em] text-muted">
                  Total Omzet Kotor (GMV)
                </p>
                <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary-soft/60 text-primary">
                  <Wallet className="size-3.5" />
                </span>
              </div>
              <p className="mt-3 text-[9px] font-medium text-muted">Rp</p>
              <p className="text-[21px] font-extrabold leading-tight tracking-tight text-ink">
                {numberFormatter.format(grossTotal)}
              </p>
              <div className="mt-auto pt-3 text-[9px] leading-relaxed text-muted">
                <p>vs {numberFormatter.format(ordersTotal)} pesanan</p>
                <p className="mt-1 flex items-start gap-1">
                  <TrendingUp className="mt-0.5 size-3 shrink-0 text-emerald-600" />
                  <span>
                    <span className="font-bold text-emerald-600">+12,4%</span> dibanding rata-rata
                    lalu lintas
                  </span>
                </p>
              </div>
            </article>

            <article className="flex flex-col rounded-2xl border border-line bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-2">
                <p className="text-[8px] font-bold uppercase leading-relaxed tracking-[0.12em] text-muted">
                  Pendapatan Komisi (1.0%)
                </p>
                <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary text-white">
                  <Percent className="size-3.5" />
                </span>
              </div>
              <p className="mt-3 text-[9px] font-medium text-muted">Rp</p>
              <p className="text-[21px] font-extrabold leading-tight tracking-tight text-ink">
                {numberFormatter.format(commissionTotal)}
              </p>
              <p className="mt-auto flex items-start gap-1 pt-3 text-[9px] leading-relaxed text-muted">
                <TrendingUp className="mt-0.5 size-3 shrink-0 text-emerald-600" />
                <span>
                  <span className="font-bold text-emerald-600">+14,1%</span> laju pertumbuhan
                  bulanan
                </span>
              </p>
            </article>

            <article className="flex flex-col rounded-2xl border border-line bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-2">
                <p className="text-[8px] font-bold uppercase leading-relaxed tracking-[0.12em] text-muted">
                  Dana Siap Settlement (Payout)
                </p>
                <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-sky-50 text-sky-500">
                  <Banknote className="size-3.5" />
                </span>
              </div>
              <p className="mt-3 text-[9px] font-medium text-muted">Rp</p>
              <p className="text-[21px] font-extrabold leading-tight tracking-tight text-ink">
                {numberFormatter.format(readyTotal)}
              </p>
              <div className="mt-auto flex flex-wrap items-center justify-between gap-x-2 gap-y-1 pt-3 text-[9px]">
                <span className="inline-flex items-center gap-1 text-muted">
                  <Store className="size-3 shrink-0" />
                  {numberFormatter.format(payouts.length)} Pengajuan
                </span>
                <span className="font-semibold text-emerald-600">Siap ditransfer</span>
              </div>
            </article>

            <article className="flex flex-col rounded-2xl border border-line bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-2">
                <p className="text-[8px] font-bold uppercase leading-relaxed tracking-[0.12em] text-muted">
                  Dana Kini QRIS (H+1)
                </p>
                <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-400">
                  <QrCode className="size-3.5" />
                </span>
              </div>
              <p className="mt-3 text-[9px] font-medium text-muted">Rp</p>
              <p className="text-[21px] font-extrabold leading-tight tracking-tight text-ink">
                {numberFormatter.format(qrisIncoming)}
              </p>
              <div className="mt-auto space-y-0.5 pt-3 text-[9px] leading-relaxed text-muted">
                <p className="flex items-center gap-1">
                  <Landmark className="size-3 shrink-0" />
                  Kliring Bank Indonesia
                </p>
                <p>Pukul 23:59 WIB</p>
              </div>
            </article>
          </section>

          <section className="rounded-2xl border border-line bg-white p-4 shadow-sm sm:p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-base font-bold text-ink">Tren Arus Kas &amp; Komisi Harian</h2>
                <p className="mt-1 max-w-sm text-[10px] leading-relaxed text-muted">
                  Perbandingan volume penjaminan masuk (Gross) terhadap realisasi transfer saldo
                  merchant UMKM.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[9px] font-medium text-muted">
                <span className="inline-flex items-center gap-1.5">
                  <span className="size-2 rounded-sm bg-primary" />
                  Omzet Masuk
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="size-2 rounded-sm bg-teal-200" />
                  Dana Dicairkan
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-0.5 w-3.5 rounded-full bg-[#0b3b38]" />
                  Net Komisi 1%
                </span>
              </div>
            </div>

            <div className="mt-4">
              <FinanceTrendChart data={daysInPeriod} />
            </div>

            <div className="mt-4 grid gap-3 rounded-xl bg-[#f4f5fa] p-3 sm:grid-cols-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-[9px] text-muted">Rata-rata Harian GMV</p>
                  <p className="mt-0.5 text-xs font-bold text-ink">{formatRupiah(averageDaily)}</p>
                </div>
                <Wallet className="size-3.5 shrink-0 text-slate-400" />
              </div>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-[9px] text-muted">Rasio Sukses Settlement</p>
                  <p className="mt-0.5 text-xs font-bold text-ink">99,4%</p>
                </div>
                <ShieldCheck className="size-3.5 shrink-0 text-slate-400" />
              </div>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-[9px] text-muted">Retensi Saldo Escrow</p>
                  <p className="mt-0.5 text-xs font-bold text-ink">
                    {formatRupiah(escrowAccount.balance)}
                  </p>
                </div>
                <Landmark className="size-3.5 shrink-0 text-slate-400" />
              </div>
            </div>
          </section>

          <section className="overflow-hidden rounded-2xl border border-line bg-white shadow-sm">
            <div className="flex flex-col gap-3 px-4 pt-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-base font-bold text-ink">
                  Daftar Pengajuan Pencairan Dana UMKM
                </h2>
                <p className="mt-0.5 text-[10px] leading-relaxed text-muted">
                  Verifikasi rekening, komisi terpotong, dan otorisasi pembayaran ke rekening
                  terdaftar merchant.
                </p>
              </div>
              <button
                type="button"
                onClick={handleOpenBatch}
                disabled={selectedIds.length === 0}
                className="inline-flex h-9 shrink-0 items-center justify-center gap-1.5 self-start rounded-lg bg-primary px-3 text-[10px] font-semibold text-white transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                <Layers className="size-3.5" />
                Proses Batch ({selectedIds.length} terpilih)
              </button>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-1 border-b border-line px-4">
              {payoutTabs.map((tab) => {
                const active = statusTab === tab.value

                return (
                  <button
                    key={tab.value}
                    type="button"
                    onClick={() => {
                      setStatusTab(tab.value)
                      setPage(1)
                    }}
                    aria-pressed={active}
                    className={`-mb-px inline-flex items-center gap-1.5 border-b-2 px-2.5 pb-2.5 pt-1 text-[10px] transition ${
                      active
                        ? 'border-primary font-bold text-primary'
                        : 'border-transparent font-medium text-slate-500 hover:text-ink'
                    }`}
                  >
                    {tab.label}
                    <span
                      className={`rounded px-1.5 py-0.5 text-[9px] font-bold ${
                        active ? 'bg-primary-soft/70 text-primary' : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {payoutCounts[tab.value]}
                    </span>
                  </button>
                )
              })}
            </div>

            <div className="flex flex-col gap-2 px-4 py-3 sm:flex-row">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-slate-400" />
                <input
                  type="search"
                  value={keyword}
                  onChange={(event) => {
                    setKeyword(event.target.value)
                    setPage(1)
                  }}
                  placeholder="Cari ID payout, nama toko, pemilik, atau rekening..."
                  aria-label="Cari pengajuan pencairan"
                  className="h-9 w-full rounded-xl border border-line bg-[#f7f7fb] pl-9 pr-3 text-[10px] text-ink outline-none transition placeholder:text-slate-400 focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10"
                />
              </div>
              <div className="relative sm:w-[150px]">
                <select
                  value={bankFilter}
                  onChange={(event) => {
                    setBankFilter(event.target.value)
                    setPage(1)
                  }}
                  aria-label="Filter bank tujuan"
                  className="h-9 w-full cursor-pointer appearance-none rounded-xl border border-line bg-[#f7f7fb] pl-3 pr-8 text-[10px] text-ink outline-none transition focus:border-primary focus:bg-white"
                >
                  <option value="semua">Filter Bank</option>
                  {payoutBanks.map((bank) => (
                    <option key={bank} value={bank}>
                      {bank}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 size-3.5 -translate-y-1/2 text-slate-400" />
              </div>
            </div>

            <div className="overflow-x-auto border-t border-line">
              <table className="w-full min-w-[860px] text-left">
                <thead>
                  <tr className="bg-[#f4f5fa] text-[8px] uppercase tracking-[0.1em] text-muted">
                    <th className="w-10 px-3 py-2.5">
                      <input
                        type="checkbox"
                        checked={allVisibleSelected}
                        onChange={handleToggleSelectAll}
                        disabled={selectableVisiblePayouts.length === 0}
                        aria-label="Pilih semua pengajuan pada halaman ini"
                        title={
                          selectableVisiblePayouts.length === 0
                            ? 'Tidak ada pengajuan yang dapat diproses pada halaman ini'
                            : 'Pilih semua pengajuan yang dapat diproses'
                        }
                        className="size-3.5 cursor-pointer accent-[#0f766e] disabled:cursor-not-allowed disabled:opacity-40"
                      />
                    </th>
                    <th className="px-2 py-2.5 font-bold">ID Payout</th>
                    <th className="px-2 py-2.5 font-bold">Toko UMKM &amp; Rekening</th>
                    <th className="px-2 py-2.5 text-right font-bold">Jumlah Bersih</th>
                    <th className="px-2 py-2.5 text-right font-bold">Komisi (1%)</th>
                    <th className="px-2 py-2.5 font-bold">Waktu Pengajuan</th>
                    <th className="px-3 py-2.5 font-bold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {payoutsLoading ? (
                    <tr>
                      <td colSpan={7}>
                        <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
                          <span className="flex size-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                            <RefreshCw className="size-5 animate-spin" />
                          </span>
                          <h3 className="mt-3 text-sm font-bold text-ink">
                            Memuat pengajuan pencairan
                          </h3>
                          <p className="mt-1 max-w-xs text-[10px] leading-relaxed text-muted">
                            Mengambil data terbaru dari server...
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : payoutsError ? (
                    <tr>
                      <td colSpan={7}>
                        <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
                          <span className="flex size-11 items-center justify-center rounded-2xl bg-red-50 text-red-500">
                            <AlertTriangle className="size-5" />
                          </span>
                          <h3 className="mt-3 text-sm font-bold text-ink">
                            Gagal memuat pengajuan
                          </h3>
                          <p className="mt-1 max-w-xs text-[10px] leading-relaxed text-muted">
                            Periksa koneksi ke server backend lalu coba lagi.
                          </p>
                          <button
                            type="button"
                            onClick={() => void refetchPayouts()}
                            className="mt-3 rounded-xl border border-line bg-white px-3.5 py-1.5 text-[10px] font-semibold text-slate-600 transition hover:bg-slate-50"
                          >
                            Coba lagi
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : visiblePayouts.length === 0 ? (
                    <tr>
                      <td colSpan={7}>
                        <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
                          <span className="flex size-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                            <Banknote className="size-5" />
                          </span>
                          <h3 className="mt-3 text-sm font-bold text-ink">
                            Tidak ada pengajuan pencairan
                          </h3>
                          <p className="mt-1 max-w-xs text-[10px] leading-relaxed text-muted">
                            Ubah status, bank, atau kata kunci untuk melihat pengajuan lainnya.
                          </p>
                          <button
                            type="button"
                            onClick={handleResetPayoutFilters}
                            className="mt-3 rounded-xl border border-line bg-white px-3.5 py-1.5 text-[10px] font-semibold text-slate-600 transition hover:bg-slate-50"
                          >
                            Reset filter
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    visiblePayouts.map((payout) => {
                      const meta = payoutStatusMeta[payout.status]
                      const checked = selectedIds.includes(payout.id)

                      return (
                        <tr
                          key={payout.id}
                          className={`transition ${
                            checked ? 'bg-primary-soft/25' : 'hover:bg-slate-50/60'
                          }`}
                        >
                          <td className="px-3 py-3">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => handleToggleSelect(payout.id)}
                              disabled={!isActionable(payout.status)}
                              aria-label={`Pilih pengajuan ${payout.id}`}
                              title={
                                isActionable(payout.status)
                                  ? `Pilih pengajuan ${payout.id}`
                                  : 'Pengajuan ini sudah diproses'
                              }
                              className="size-3.5 cursor-pointer accent-[#0f766e] disabled:cursor-not-allowed disabled:opacity-40"
                            />
                          </td>
                          <td className="whitespace-nowrap px-2 py-3">
                            <p className="font-mono text-[10px] font-bold text-ink">{payout.id}</p>
                            <p className="mt-0.5 text-[9px] text-muted">
                              Metode: {payout.method}
                            </p>
                          </td>
                          <td className="px-2 py-3">
                            <div className="flex items-center gap-2.5">
                              <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary-soft/50 text-[9px] font-bold text-primary">
                                {getInitials(payout.storeName)}
                              </span>
                              <div className="min-w-0">
                                <p className="truncate text-[10px] font-bold text-ink">
                                  {payout.storeName}
                                </p>
                                <p className="truncate text-[9px] text-muted">{payout.owner}</p>
                                <p className="truncate text-[9px] text-slate-400">
                                  {payout.bank} • {payout.account}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="whitespace-nowrap px-2 py-3 text-right text-[10px] font-bold text-ink">
                            {formatRupiah(payout.netAmount)}
                          </td>
                          <td className="whitespace-nowrap px-2 py-3 text-right text-[10px] text-slate-500">
                            {formatRupiah(payout.commission)}
                          </td>
                          <td className="whitespace-nowrap px-2 py-3 text-[9px] leading-relaxed text-muted">
                            {payoutTimeFormatter.format(new Date(payout.submittedAt))} WIB
                          </td>
                          <td className="px-3 py-3">
                            <span
                              className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-1 text-[8px] font-semibold ${meta.badge}`}
                            >
                              <span className={`size-1.5 rounded-full ${meta.dot}`} />
                              {meta.label}
                            </span>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col gap-3 border-t border-line px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-[9px] text-muted">
                Menampilkan{' '}
                <span className="font-semibold text-ink">
                  {filteredPayouts.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1}-
                  {Math.min(safePage * PAGE_SIZE, filteredPayouts.length)}
                </span>{' '}
                dari <span className="font-semibold text-ink">{filteredPayouts.length}</span>{' '}
                pengajuan
              </p>

              <div className="flex flex-wrap items-center gap-2.5">
                <span className="rounded-lg bg-slate-100 px-2 py-1 text-[9px] font-semibold text-slate-600">
                  {selectedIds.length} batch dipilih
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setPage(Math.max(1, safePage - 1))}
                    disabled={safePage <= 1}
                    aria-label="Halaman sebelumnya"
                    className="flex size-7 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-300"
                  >
                    <ChevronLeft className="size-3.5" />
                  </button>
                  {pageNumbers.map((pageNumber, index) => {
                    const previous = pageNumbers[index - 1]
                    const showEllipsis = previous !== undefined && pageNumber - previous > 1

                    return (
                      <span key={pageNumber} className="flex items-center gap-1">
                        {showEllipsis && (
                          <span className="px-0.5 text-[10px] text-slate-400">…</span>
                        )}
                        <button
                          type="button"
                          onClick={() => setPage(pageNumber)}
                          aria-current={pageNumber === safePage ? 'page' : undefined}
                          className={`flex size-7 items-center justify-center rounded-lg text-[10px] font-semibold transition ${
                            pageNumber === safePage
                              ? 'bg-primary text-white'
                              : 'border border-line bg-white text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          {pageNumber}
                        </button>
                      </span>
                    )
                  })}
                  <button
                    type="button"
                    onClick={() => setPage(Math.min(pageCount, safePage + 1))}
                    disabled={safePage >= pageCount}
                    aria-label="Halaman berikutnya"
                    className="flex size-7 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-300"
                  >
                    <ChevronRight className="size-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </section>
        </div>

        <aside className="min-w-0 space-y-4">
          <section className="rounded-2xl border border-line bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#f4f5fa] text-slate-500">
                  <Landmark className="size-3.5" />
                </span>
                <h2 className="text-[11px] font-bold leading-snug text-ink">
                  Rekening Penampung
                  <br />
                  (Escrow)
                </h2>
              </div>
              <span className="shrink-0 rounded bg-primary-soft/60 px-1.5 py-1 text-[8px] font-bold uppercase tracking-wide text-primary">
                Terverifikasi {escrowAccount.bankShort}
              </span>
            </div>

            <div className="mt-3 rounded-xl bg-[#f4f5fa] p-3.5">
              <div className="flex items-start justify-between gap-2">
                <p className="text-[8px] font-semibold uppercase tracking-[0.1em] text-muted">
                  Bank Kustodian Resmi
                </p>
                <Landmark className="size-3.5 shrink-0 text-slate-400" />
              </div>
              <p className="mt-1 text-xs font-bold leading-snug text-ink">{escrowAccount.bank}</p>

              <div className="mt-3 border-t border-line pt-2.5">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-[8px] font-semibold uppercase leading-relaxed tracking-[0.1em] text-muted">
                    Nomor Rekening Escrow
                    <br />
                    Terkunci
                  </p>
                  <button
                    type="button"
                    onClick={handleCopyAccount}
                    aria-label="Salin nomor rekening escrow"
                    title="Salin nomor rekening"
                    className="flex size-6 items-center justify-center rounded-md border border-line bg-white text-slate-400 transition hover:text-ink"
                  >
                    <Copy className="size-3" />
                  </button>
                </div>
                <p className="mt-1 break-all font-mono text-[10px] font-semibold tracking-wide text-ink">
                  {escrowAccount.accountNumber}
                </p>
              </div>

              <div className="mt-3 flex items-end justify-between gap-2 border-t border-line pt-2.5">
                <p className="text-[9px] leading-relaxed text-muted">
                  Saldo Escrow
                  <br />
                  Tersedia:
                </p>
                <p className="text-sm font-extrabold leading-none text-ink">
                  {formatRupiah(escrowAccount.balance)}
                </p>
              </div>
            </div>

            <div className="mt-3 flex gap-2">
              <ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-primary" />
              <div>
                <p className="text-[9px] font-bold text-ink">Protokol Multi-Signature Aktif</p>
                <p className="mt-0.5 text-[9px] leading-relaxed text-muted">
                  Fondasi Rekening Rp 10.000.000 dimitigasi otorisasi 2 dari 3 Super-Admin
                  platform.
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-line bg-white p-4 shadow-sm">
            <div className="flex items-center gap-2">
              <span className="flex size-6 items-center justify-center rounded-lg bg-primary-soft/60 text-primary">
                <Percent className="size-3" />
              </span>
              <h2 className="text-[11px] font-bold text-ink">Skema Bagi Hasil UMKM</h2>
            </div>
            <p className="mt-1.5 text-[9px] leading-relaxed text-muted">
              Kebijakan komisi transaksi sesuai program kemitraan digital Pemda dan standarisasi
              Ratis 2026.
            </p>

            <ul className="mt-3 space-y-2">
              {commissionTiers.map((tier, index) => {
                const Icon = tierIcons[index]

                return (
                  <li
                    key={tier.label}
                    className="flex items-center gap-2.5 rounded-xl border border-line px-2.5 py-2"
                  >
                    <span className="flex size-6 shrink-0 items-center justify-center rounded-lg bg-[#f4f5fa] text-slate-500">
                      <Icon className="size-3" />
                    </span>
                    <p className="min-w-0 flex-1 text-[9px] font-semibold leading-snug text-ink">
                      {tier.label}
                    </p>
                    <span
                      className={`shrink-0 rounded-md px-1.5 py-1 text-center text-[9px] font-bold leading-tight ${
                        index === 0
                          ? 'bg-primary-soft text-primary'
                          : 'bg-[#f4f5fa] text-slate-600'
                      }`}
                    >
                      {tier.rate}
                      {index === 0 && (
                        <span className="block text-[7px] font-semibold">(Inklusif)</span>
                      )}
                    </span>
                  </li>
                )
              })}
            </ul>

            <div className="mt-3 rounded-xl border border-line bg-[#f4f5fa] p-2.5">
              <p className="text-[9px] font-bold text-ink">Biaya Penarikan Pembeli: Rp 0</p>
              <p className="mt-0.5 text-[9px] leading-relaxed text-muted">
                Seluruh biaya gateway QRIS ditanggung subsidi terintegrasi dinas koperasi setempat
                demi mempercepat penetrasi transaksi digital para pelaku UMKM.
              </p>
            </div>
          </section>

          <section className="rounded-2xl border border-line bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="flex size-6 items-center justify-center rounded-lg bg-[#f4f5fa] text-slate-500">
                  <History className="size-3" />
                </span>
                <h2 className="text-[11px] font-bold text-ink">Log Audit Kliring</h2>
              </div>
              <div className="inline-flex rounded-lg bg-[#f4f5fa] p-0.5 text-[8px] font-semibold">
                <button
                  type="button"
                  onClick={() => setAuditFilter('semua')}
                  aria-pressed={auditFilter === 'semua'}
                  className={`rounded-md px-1.5 py-1 transition ${
                    auditFilter === 'semua' ? 'bg-white text-ink shadow-sm' : 'text-slate-500'
                  }`}
                >
                  Semua Log
                </button>
                <button
                  type="button"
                  onClick={() => setAuditFilter('terbaru')}
                  aria-pressed={auditFilter === 'terbaru'}
                  className={`rounded-md px-1.5 py-1 transition ${
                    auditFilter === 'terbaru' ? 'bg-white text-ink shadow-sm' : 'text-slate-500'
                  }`}
                >
                  Terbaru
                </button>
              </div>
            </div>

            <ol className="mt-3 space-y-3">
              {visibleAudit.map((entry) => (
                <li key={entry.title} className="flex gap-2">
                  <span
                    className={`mt-1.5 size-1.5 shrink-0 rounded-full ${
                      entry.tone === 'success' ? 'bg-emerald-500' : 'bg-amber-500'
                    }`}
                  />
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <p className="text-[9px] font-bold text-ink">{entry.title}</p>
                      {entry.badge && (
                        <span
                          className={`rounded px-1 py-0.5 text-[7px] font-bold ${
                            entry.tone === 'success'
                              ? 'bg-emerald-50 text-emerald-600'
                              : 'bg-amber-50 text-amber-700'
                          }`}
                        >
                          {entry.badge}
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-[9px] leading-relaxed text-muted">
                      {entry.description}
                    </p>
                    <p className="mt-0.5 text-[8px] text-slate-400">{entry.time}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>
        </aside>
      </div>
    </div>
  )
}
