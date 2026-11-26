import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
  type FormEvent,
} from 'react'
import { Navigate } from 'react-router-dom'
import {
  ArrowRight,
  ArrowUpRight,
  Banknote,
  CalendarDays,
  Check,
  ChevronDown,
  Download,
  FileText,
  Info,
  Landmark,
  Lightbulb,
  Loader2,
  Lock,
  Pencil,
  PieChart,
  Plus,
  QrCode,
  ReceiptText,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Trash2,
  TrendingDown,
  TrendingUp,
  TriangleAlert,
  X,
} from 'lucide-react'
import { getOwnerSession } from '../../lib/owner-auth'
import {
  financeAllocationGroups,
  financeCategories,
  financeCategoryMeta,
  financeInitialAllocation,
  financeInitialManualCount,
  financeInitialTransactions,
  financePaymentMethods,
  financePeriodBase,
  financeQuickAmounts,
  type FinanceAllocationGroupId,
  type FinanceCategoryId,
  type FinancePaymentMethodId,
  type FinanceTransaction,
} from '../../lib/owner-finance-data'

type PeriodKey = '7d' | '30d' | 'bulan' | 'kustom'
type TransactionTab = 'semua' | 'pengeluaran' | 'pemasukan'
type ToastTone = 'success' | 'info' | 'danger'

type Toast = {
  message: string
  tone: ToastTone
}

type ExpenseFormErrors = {
  date?: string
  category?: string
  amount?: string
  description?: string
  attachment?: string
}

const periodOptions: { key: PeriodKey; label: string }[] = [
  { key: '7d', label: '7 Hari' },
  { key: '30d', label: '30 Hari' },
  { key: 'bulan', label: 'Bulan Ini' },
  { key: 'kustom', label: 'Kustom' },
]

const transactionTabs: { key: TransactionTab; label: string }[] = [
  { key: 'semua', label: 'Semua' },
  { key: 'pengeluaran', label: 'Pengeluaran' },
  { key: 'pemasukan', label: 'Pemasukan' },
]

const paymentMethodIcons = {
  kas: Banknote,
  transfer: Landmark,
  qris: QrCode,
}

const numberFormatter = new Intl.NumberFormat('id-ID')

const initialAllocationTotal = Object.values(financeInitialAllocation).reduce(
  (total, value) => total + value,
  0,
)

function formatNumber(value: number) {
  return numberFormatter.format(value)
}

function formatRupiah(value: number) {
  const absolute = formatNumber(Math.abs(value))
  return value < 0 ? `-Rp${absolute}` : `Rp${absolute}`
}

function toLocalIsoDate(date: Date) {
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  return `${year}-${month}-${day}`
}

function parseIsoDate(value: string) {
  const [year, month, day] = value.split('-').map(Number)
  return new Date(year, month - 1, day)
}

function formatTransactionDate(value: string) {
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(parseIsoDate(value))
}

function formatFileSize(size: number) {
  if (size < 1024) return `${size} B`
  return `${(size / 1024).toFixed(1).replace('.', ',')} KB`
}

function getCurrentWibTime() {
  const time = new Intl.DateTimeFormat('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'Asia/Jakarta',
  }).format(new Date())
  return `${time} WIB`
}

function getMonthLabel(date: Date) {
  return new Intl.DateTimeFormat('id-ID', {
    month: 'long',
    year: 'numeric',
  }).format(date)
}

function escapeCsv(value: string) {
  if (value.includes(';') || value.includes('"') || value.includes('\n')) {
    return `"${value.replaceAll('"', '""')}"`
  }
  return value
}

export default function OwnerFinancePage() {
  const [session] = useState(getOwnerSession)
  const [today] = useState(() => new Date())
  const [period, setPeriod] = useState<PeriodKey>('bulan')
  const [tab, setTab] = useState<TransactionTab>('semua')
  const [showAllTransactions, setShowAllTransactions] = useState(false)
  const [transactions, setTransactions] = useState<FinanceTransaction[]>(() => [
    ...financeInitialTransactions,
  ])
  const [allocation, setAllocation] = useState<Record<FinanceAllocationGroupId, number>>(
    () => ({ ...financeInitialAllocation }),
  )
  const [manualCount, setManualCount] = useState(financeInitialManualCount)
  const [date, setDate] = useState(() => toLocalIsoDate(today))
  const [categoryId, setCategoryId] = useState<FinanceCategoryId | ''>('')
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [paymentMethodId, setPaymentMethodId] =
    useState<FinancePaymentMethodId>('kas')
  const [attachment, setAttachment] = useState<File | null>(null)
  const [errors, setErrors] = useState<ExpenseFormErrors>({})
  const [editingId, setEditingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<FinanceTransaction | null>(null)
  const [toast, setToast] = useState<Toast | null>(null)
  const [customStart, setCustomStart] = useState(() => {
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1)
    return toLocalIsoDate(firstDay)
  })
  const [customEnd, setCustomEnd] = useState(() => toLocalIsoDate(today))

  const formRef = useRef<HTMLElement>(null)
  const categoryRef = useRef<HTMLSelectElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => setToast(null), 4000)
    return () => window.clearTimeout(timer)
  }, [toast])

  const todayIso = toLocalIsoDate(today)
  const monthLabel = getMonthLabel(today)
  const currentBase = financePeriodBase[period === 'kustom' ? 'bulan' : period]
  const allocationTotal = Object.values(allocation).reduce(
    (total, value) => total + value,
    0,
  )
  const expenseDelta = allocationTotal - initialAllocationTotal
  const income = currentBase.income
  const expense = Math.max(0, currentBase.expense + expenseDelta)
  const profit = income - expense
  const margin = income > 0 ? (profit / income) * 100 : 0
  const isProfitable = profit >= 0

  const allocationRows = financeAllocationGroups.map((group) => {
    const value = allocation[group.id]
    const percent = allocationTotal > 0 ? Math.round((value / allocationTotal) * 100) : 0
    return { ...group, value, percent }
  })
  const topAllocation = allocationRows.reduce((top, item) =>
    item.value > top.value ? item : top,
  )

  const periodRange = useMemo(() => {
    const end = todayIso
    if (period === 'kustom') {
      return {
        start: customStart || '0000-01-01',
        end: customEnd || end,
      }
    }

    if (period === 'bulan') {
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1)
      return { start: toLocalIsoDate(firstDay), end }
    }

    const startDate = new Date(today)
    startDate.setDate(startDate.getDate() - (period === '7d' ? 6 : 29))
    return { start: toLocalIsoDate(startDate), end }
  }, [customEnd, customStart, period, today, todayIso])

  const periodTransactions = useMemo(
    () =>
      transactions
        .filter(
          (transaction) =>
            transaction.date >= periodRange.start && transaction.date <= periodRange.end,
        )
        .sort(
          (first, second) =>
            second.date.localeCompare(first.date) ||
            second.time.localeCompare(first.time),
        ),
    [periodRange.end, periodRange.start, transactions],
  )

  const filteredTransactions = useMemo(() => {
    if (tab === 'pengeluaran') {
      return periodTransactions.filter((transaction) => transaction.type === 'expense')
    }
    if (tab === 'pemasukan') {
      return periodTransactions.filter((transaction) => transaction.type === 'income')
    }
    return periodTransactions
  }, [periodTransactions, tab])

  const displayedTransactions = showAllTransactions
    ? filteredTransactions
    : filteredTransactions.slice(0, 5)

  if (!session) {
    return <Navigate to="/" replace />
  }

  function showToast(message: string, tone: ToastTone = 'success') {
    setToast({ message, tone })
  }

  function scrollToForm() {
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    window.setTimeout(() => categoryRef.current?.focus(), 350)
  }

  function handleCustomStart(value: string) {
    setCustomStart(value)
    if (value && value > customEnd) setCustomEnd(value)
  }

  function handleCustomEnd(value: string) {
    setCustomEnd(value)
    if (value && value < customStart) setCustomStart(value)
  }

  function resetForm() {
    setDate(todayIso)
    setCategoryId('')
    setAmount('')
    setDescription('')
    setPaymentMethodId('kas')
    setAttachment(null)
    setErrors({})
    setEditingId(null)
    setSaving(false)
    setDragActive(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  function handleSampleData() {
    setEditingId(null)
    setDate(todayIso)
    setCategoryId('bahan-baku')
    setAmount('350000')
    setDescription(
      'Pembelian Mentega Wijsman 2 kaleng & Tepung Terigu Cakra Kembar 10kg di Toko Bahan Kue Wahab',
    )
    setPaymentMethodId('kas')
    setAttachment(null)
    setErrors({})
    showToast('Contoh data pengeluaran berhasil diisi.', 'info')
  }

  function handleQuickAmount(value: number) {
    setAmount(String(value))
    setErrors((current) => ({ ...current, amount: undefined }))
  }

  function processAttachment(file: File) {
    const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf']
    if (!allowedTypes.includes(file.type)) {
      setErrors((current) => ({
        ...current,
        attachment: 'Format file harus JPG, PNG, atau PDF.',
      }))
      setAttachment(null)
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      setErrors((current) => ({
        ...current,
        attachment: 'Ukuran file maksimal 2 MB.',
      }))
      setAttachment(null)
      return
    }

    setAttachment(file)
    setErrors((current) => ({ ...current, attachment: undefined }))
  }

  function handleAttachmentChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    processAttachment(file)
    event.target.value = ''
  }

  function handleDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault()
    setDragActive(false)
    const file = event.dataTransfer.files?.[0]
    if (file) processAttachment(file)
  }

  function clearAttachment() {
    setAttachment(null)
    setErrors((current) => ({ ...current, attachment: undefined }))
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  function validateForm() {
    const nextErrors: ExpenseFormErrors = {}
    const numericAmount = Number(amount)

    if (!date) {
      nextErrors.date = 'Tanggal pengeluaran wajib diisi.'
    } else if (date > todayIso) {
      nextErrors.date = 'Tanggal tidak boleh melewati hari ini.'
    }

    if (!categoryId) nextErrors.category = 'Pilih kategori pengeluaran.'

    if (!amount || numericAmount <= 0) {
      nextErrors.amount = 'Nominal harus lebih besar dari Rp0.'
    } else if (numericAmount > 1_000_000_000) {
      nextErrors.amount = 'Nominal maksimal Rp1.000.000.000.'
    }

    if (description.trim().length < 3) {
      nextErrors.description = 'Deskripsi minimal 3 karakter.'
    }

    if (errors.attachment) nextErrors.attachment = errors.attachment

    return nextErrors
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (saving) return

    const nextErrors = validateForm()
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      return
    }

    setSaving(true)
    await new Promise((resolve) => window.setTimeout(resolve, 650))

    const selectedCategory = categoryId as FinanceCategoryId
    const categoryMeta = financeCategoryMeta[selectedCategory]
    const selectedMethod =
      financePaymentMethods.find((method) => method.id === paymentMethodId) ??
      financePaymentMethods[0]
    const previousTransaction = editingId
      ? transactions.find((transaction) => transaction.id === editingId)
      : null
    const nextTransaction: FinanceTransaction = {
      id: editingId ?? `fin-exp-${Date.now()}`,
      type: 'expense',
      title: description.trim(),
      amount: Number(amount),
      categoryId: selectedCategory,
      source: 'manual',
      date,
      time: previousTransaction?.time ?? getCurrentWibTime(),
      paymentMethodId,
      paymentMethod: selectedMethod.label,
    }

    setAllocation((current) => {
      const next = { ...current }
      if (previousTransaction?.categoryId) {
        const previousGroup = financeCategoryMeta[previousTransaction.categoryId].group
        next[previousGroup] = Math.max(
          0,
          next[previousGroup] - previousTransaction.amount,
        )
      }
      next[categoryMeta.group] += nextTransaction.amount
      return next
    })

    setTransactions((current) => {
      const next = editingId
        ? current.map((transaction) =>
            transaction.id === editingId ? nextTransaction : transaction,
          )
        : [nextTransaction, ...current]
      return next.sort(
        (first, second) =>
          second.date.localeCompare(first.date) ||
          second.time.localeCompare(first.time),
      )
    })

    if (editingId) {
      showToast('Catatan pengeluaran berhasil diperbarui.')
    } else {
      setManualCount((current) => current + 1)
      showToast(
        `Pengeluaran Rp${formatNumber(nextTransaction.amount)} berhasil dicatat.`,
      )
    }

    resetForm()
  }

  function handleEdit(transaction: FinanceTransaction) {
    if (transaction.type !== 'expense' || transaction.source !== 'manual') return

    setEditingId(transaction.id)
    setDate(transaction.date)
    setCategoryId(transaction.categoryId ?? '')
    setAmount(String(transaction.amount))
    setDescription(transaction.title)
    setPaymentMethodId(transaction.paymentMethodId ?? 'kas')
    setAttachment(null)
    setErrors({})
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    window.setTimeout(() => categoryRef.current?.focus(), 350)
  }

  function handleDeleteConfirm() {
    if (!deleteTarget) return

    setTransactions((current) =>
      current.filter((transaction) => transaction.id !== deleteTarget.id),
    )

    if (deleteTarget.categoryId) {
      const group = financeCategoryMeta[deleteTarget.categoryId].group
      setAllocation((current) => ({
        ...current,
        [group]: Math.max(0, current[group] - deleteTarget.amount),
      }))
    }

    if (deleteTarget.source === 'manual') {
      setManualCount((current) => Math.max(0, current - 1))
    }

    if (editingId === deleteTarget.id) resetForm()

    setDeleteTarget(null)
    showToast('Catatan pengeluaran dihapus. Ringkasan laba diperbarui.')
  }

  function handleExport() {
    if (periodTransactions.length === 0) {
      showToast('Tidak ada transaksi pada periode ini untuk diekspor.', 'info')
      return
    }

    const header = [
      'Tanggal',
      'Waktu',
      'Jenis',
      'Deskripsi',
      'Kategori',
      'Metode Pembayaran',
      'Sumber',
      'Nominal',
    ]
    const rows = periodTransactions.map((transaction) => [
      formatTransactionDate(transaction.date),
      transaction.time,
      transaction.type === 'income' ? 'Pemasukan' : 'Pengeluaran',
      transaction.title,
      transaction.categoryId
        ? financeCategoryMeta[transaction.categoryId].label
        : 'Penjualan Pesanan',
      transaction.paymentMethod,
      transaction.source === 'manual' ? 'Manual' : 'Otomatis',
      String(transaction.amount),
    ])
    const csv = [header, ...rows]
      .map((row) => row.map(escapeCsv).join(';'))
      .join('\r\n')
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `laporan-keuangan-${todayIso}.csv`
    document.body.appendChild(anchor)
    anchor.click()
    anchor.remove()
    URL.revokeObjectURL(url)
    showToast('Laporan CSV berhasil diunduh.')
  }

  return (
    <div>
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="max-w-[650px]">
          <h1 className="text-[26px] font-extrabold tracking-tight text-ink sm:text-[28px]">
            Keuangan &amp; Catat Pengeluaran
          </h1>
          <p className="mt-1 max-w-[600px] text-[13px] leading-relaxed text-slate-500">
            Pantau arus kas masuk otomatis, catat pengeluaran operasional toko, dan
            hitung laba bersih usaha secara akurat.
          </p>
        </div>

        <div className="flex w-full flex-col gap-2.5 xl:w-auto xl:items-end">
          <div className="flex w-full overflow-x-auto rounded-xl bg-[#f1f5f9] p-1 xl:w-auto">
            {periodOptions.map((option) => {
              const isActive = period === option.key
              const label =
                option.key === 'bulan' ? `Bulan Ini: ${monthLabel}` : option.label
              return (
                <button
                  key={option.key}
                  type="button"
                  onClick={() => {
                    setPeriod(option.key)
                    setShowAllTransactions(false)
                  }}
                  className={`shrink-0 rounded-lg px-3 py-2 text-[11px] font-semibold transition ${
                    isActive
                      ? 'bg-white text-ink shadow-sm'
                      : 'text-slate-500 hover:text-ink'
                  }`}
                >
                  {label}
                </button>
              )
            })}
          </div>

          <div className="flex w-full flex-wrap gap-2 xl:justify-end">
            <button
              type="button"
              onClick={handleExport}
              className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-xl border border-line bg-white px-3.5 text-[11.5px] font-semibold text-slate-700 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition hover:bg-slate-50 sm:flex-none"
            >
              <Download className="size-4 text-slate-500" />
              Ekspor Laporan (CSV)
            </button>
            <button
              type="button"
              onClick={scrollToForm}
              className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-[11.5px] font-semibold text-white shadow-sm transition hover:bg-primary-hover sm:flex-none"
            >
              <Plus className="size-4" />
              Tambah Pengeluaran
            </button>
          </div>
        </div>
      </div>

      {period === 'kustom' && (
        <div className="mt-4 flex flex-col gap-3 rounded-2xl border border-line bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.06)] sm:flex-row sm:items-end">
          <label className="block sm:w-44">
            <span className="text-[11px] font-semibold text-slate-600">
              Tanggal mulai
            </span>
            <input
              type="date"
              value={customStart}
              max={customEnd || todayIso}
              onChange={(event) => handleCustomStart(event.target.value)}
              className="mt-1.5 h-10 w-full rounded-xl border border-line bg-[#f7f9fc] px-3 text-xs text-ink outline-none transition focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10"
            />
          </label>
          <label className="block sm:w-44">
            <span className="text-[11px] font-semibold text-slate-600">
              Tanggal akhir
            </span>
            <input
              type="date"
              value={customEnd}
              min={customStart}
              max={todayIso}
              onChange={(event) => handleCustomEnd(event.target.value)}
              className="mt-1.5 h-10 w-full rounded-xl border border-line bg-[#f7f9fc] px-3 text-xs text-ink outline-none transition focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10"
            />
          </label>
          <p className="pb-2 text-[11px] text-slate-500 sm:ml-1">
            Menampilkan transaksi dalam rentang tanggal yang dipilih.
          </p>
        </div>
      )}

      <div className="mt-5 grid gap-3.5 sm:grid-cols-2 xl:grid-cols-3">
        <section className="relative overflow-hidden rounded-2xl border border-line bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.06)]">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">
                Pemasukan
                <Lock className="size-3 text-slate-400" />
              </p>
              <p className="mt-2 text-[30px] font-extrabold leading-none tracking-tight text-ink">
                {formatRupiah(income)}
              </p>
            </div>
            <div className="relative shrink-0">
              <span
                aria-hidden
                className="absolute -bottom-9 -right-7 size-28 rounded-full bg-[#eefbf6]"
              />
              <span className="relative flex size-12 items-center justify-center rounded-2xl bg-[#dff7ee] text-primary">
                <TrendingUp className="size-5" />
              </span>
            </div>
          </div>
          <div className="relative mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-[#eef2f6] pt-3">
            <span className="inline-flex items-center gap-0.5 rounded-full bg-[#dcfce7] px-2 py-1 text-[10px] font-bold text-[#15803d]">
              <ArrowUpRight className="size-3" />
              18%
            </span>
            <span className="text-[10.5px] text-slate-500">vs bulan lalu</span>
            <span className="text-[10.5px] text-slate-500">
              {currentBase.orders} pesanan selesai
            </span>
          </div>
        </section>

        <section className="relative overflow-hidden rounded-2xl border border-line bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.06)]">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="flex flex-wrap items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">
                Pengeluaran Operasional
                <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[9px] font-semibold normal-case tracking-normal text-slate-500">
                  Manual
                </span>
              </p>
              <p className="mt-2 text-[30px] font-extrabold leading-none tracking-tight text-[#dc2626]">
                {formatRupiah(expense)}
              </p>
            </div>
            <div className="relative shrink-0">
              <span
                aria-hidden
                className="absolute -bottom-9 -right-7 size-28 rounded-full bg-[#fff2f2]"
              />
              <span className="relative flex size-12 items-center justify-center rounded-2xl bg-[#fee7e7] text-[#dc2626]">
                <TrendingDown className="size-5" />
              </span>
            </div>
          </div>
          <div className="relative mt-5 flex flex-wrap items-center justify-between gap-2 border-t border-[#eef2f6] pt-3">
            <p className="max-w-[220px] text-[10.5px] leading-snug text-slate-500">
              Belanja bahan &amp; operasional ({manualCount} catatan)
            </p>
            <button
              type="button"
              onClick={scrollToForm}
              className="text-[10.5px] font-semibold text-primary transition hover:text-primary-hover"
            >
              + Catat Biaya
            </button>
          </div>
        </section>

        <section className="relative overflow-hidden rounded-2xl border border-[#0f766e] bg-[linear-gradient(135deg,#0a4b47_0%,#0f766e_100%)] p-5 text-white shadow-[0_8px_24px_rgba(15,118,110,0.22)] sm:col-span-2 xl:col-span-1">
          <span
            aria-hidden
            className="absolute -right-12 -top-14 size-40 rounded-full border-[18px] border-white/5"
          />
          <span
            aria-hidden
            className="absolute -bottom-16 right-8 size-40 rounded-full bg-white/[0.04]"
          />
          <div className="relative flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-white/65">
                Estimasi Laba Bersih
              </p>
              <p
                className={`mt-2 text-[30px] font-extrabold leading-none tracking-tight ${
                  isProfitable ? 'text-white' : 'text-[#fecaca]'
                }`}
              >
                {formatRupiah(profit)}
              </p>
              <p className="mt-1.5 text-[10.5px] text-white/60">
                Pemasukan dikurangi pengeluaran riil
              </p>
            </div>
            <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-white ring-1 ring-inset ring-white/10">
              {isProfitable ? (
                <Landmark className="size-5" />
              ) : (
                <TriangleAlert className="size-5 text-[#fecaca]" />
              )}
            </span>
          </div>
          <div className="relative mt-5 flex flex-wrap items-center gap-1.5 border-t border-white/10 pt-3">
            <span className="rounded-full bg-white/10 px-2 py-1 text-[9.5px] font-semibold text-white/90">
              Margin {margin.toFixed(1)}%
            </span>
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[9.5px] font-semibold ${
                isProfitable
                  ? 'bg-[#d1fae5]/15 text-[#d1fae5]'
                  : 'bg-[#fee2e2]/15 text-[#fecaca]'
              }`}
            >
              {isProfitable ? (
                <ShieldCheck className="size-3" />
              ) : (
                <TriangleAlert className="size-3" />
              )}
              {isProfitable ? 'Kondisi Sehat' : 'Perlu Perhatian'}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2 py-1 text-[9.5px] font-semibold text-white/90">
              <span className="size-1.5 rounded-full bg-[#5eead4]" />
              Real-time
            </span>
          </div>
        </section>
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)]">
        <section
          ref={formRef}
          id="catat-pengeluaran"
          className="scroll-mt-24 rounded-2xl border border-line bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.06)] sm:p-6"
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-3">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary-soft/60 text-primary">
                <ReceiptText className="size-5" />
              </span>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-[19px] font-extrabold tracking-tight text-ink">
                    {editingId ? 'Ubah Catatan Pengeluaran' : 'Form Catat Pengeluaran Baru'}
                  </h2>
                  <span className="rounded-full bg-primary-soft/60 px-2 py-0.5 text-[9.5px] font-semibold text-primary">
                    {editingId ? 'Mode Edit' : 'Pencatatan Cepat'}
                  </span>
                </div>
                <p className="mt-1 text-[11.5px] leading-relaxed text-slate-500">
                  Catatan pengeluaran harian toko {session.storeName}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleSampleData}
              className="inline-flex h-8 shrink-0 items-center justify-center gap-1.5 self-start rounded-lg px-2 text-[10.5px] font-semibold text-slate-500 transition hover:bg-slate-50 hover:text-primary"
            >
              <Sparkles className="size-3.5" />
              Contoh Data
            </button>
          </div>

          <div className="mt-4 flex items-start gap-3 rounded-xl border border-[#dce5f5] bg-[#eef2fb] p-4">
            <Info className="mt-0.5 size-4 shrink-0 text-[#4f6fab]" />
            <p className="text-[11.5px] leading-relaxed text-slate-600">
              <span className="font-semibold text-slate-700">Catatan penting:</span>{' '}
              Pengeluaran manual langsung memotong estimasi laba bersih di dashboard dan
              pembukuan bulanan secara otomatis.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="mt-5" noValidate>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="text-[12px] font-semibold text-ink">
                  Tanggal Pengeluaran <span className="text-[#dc2626]">*</span>
                </span>
                <span className="relative mt-1.5 block">
                  <input
                    id="owner-expense-date"
                    type="date"
                    value={date}
                    max={todayIso}
                    onChange={(event) => {
                      setDate(event.target.value)
                      setErrors((current) => ({ ...current, date: undefined }))
                    }}
                    className={`h-11 w-full appearance-none rounded-xl border bg-[#f7f9fc] px-3.5 pr-10 text-[12px] text-ink outline-none transition focus:bg-white focus:ring-4 ${
                      errors.date
                        ? 'border-red-300 focus:border-red-400 focus:ring-red-100'
                        : 'border-line focus:border-primary focus:ring-primary/10'
                    }`}
                  />
                  <CalendarDays className="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                </span>
                <span
                  className={`mt-1.5 block text-[10px] ${
                    errors.date ? 'text-red-600' : 'text-slate-400'
                  }`}
                >
                  {errors.date ?? 'Tidak boleh memilih tanggal di masa depan.'}
                </span>
              </label>

              <label className="block">
                <span className="text-[12px] font-semibold text-ink">
                  Kategori Pengeluaran <span className="text-[#dc2626]">*</span>
                </span>
                <span className="relative mt-1.5 block">
                  <select
                    ref={categoryRef}
                    value={categoryId}
                    onChange={(event) => {
                      setCategoryId(event.target.value as FinanceCategoryId | '')
                      setErrors((current) => ({ ...current, category: undefined }))
                    }}
                    className={`h-11 w-full appearance-none rounded-xl border bg-[#f7f9fc] px-3.5 pr-10 text-[12px] outline-none transition focus:bg-white focus:ring-4 ${
                      categoryId ? 'text-ink' : 'text-slate-400'
                    } ${
                      errors.category
                        ? 'border-red-300 focus:border-red-400 focus:ring-red-100'
                        : 'border-line focus:border-primary focus:ring-primary/10'
                    }`}
                  >
                    <option value="">Pilih Kategori Pembukuan...</option>
                    {financeCategories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                </span>
                <span
                  className={`mt-1.5 block text-[10px] leading-relaxed ${
                    errors.category ? 'text-red-600' : 'text-slate-400'
                  }`}
                >
                  {errors.category ??
                    'Gunakan kategori tepat agar laporan laba rugi teratur.'}
                </span>
              </label>
            </div>

            <div className="mt-4">
              <label className="block">
                <span className="text-[12px] font-semibold text-ink">
                  Nominal Pengeluaran (Rupiah) <span className="text-[#dc2626]">*</span>
                </span>
                <span className="relative mt-1.5 block">
                  <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[12px] font-semibold text-slate-400">
                    Rp
                  </span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={amount ? formatNumber(Number(amount)) : ''}
                    onChange={(event) => {
                      const digits = event.target.value.replace(/\D/g, '')
                      setAmount(digits.replace(/^0+(?=\d)/, ''))
                      setErrors((current) => ({ ...current, amount: undefined }))
                    }}
                    placeholder="0"
                    className={`h-11 w-full rounded-xl border bg-[#f7f9fc] pl-11 pr-3.5 text-[12px] font-semibold text-ink outline-none transition placeholder:font-normal placeholder:text-slate-400 focus:bg-white focus:ring-4 ${
                      errors.amount
                        ? 'border-red-300 focus:border-red-400 focus:ring-red-100'
                        : 'border-line focus:border-primary focus:ring-primary/10'
                    }`}
                  />
                </span>
              </label>
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                <span className="mr-1 text-[10px] text-slate-500">Saran cepat:</span>
                {financeQuickAmounts.map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => handleQuickAmount(value)}
                    className="rounded-lg bg-[#eef3fa] px-2.5 py-1.5 text-[10px] font-semibold text-[#3b5f8f] transition hover:bg-[#e0eafa]"
                  >
                    Rp {formatNumber(value)}
                  </button>
                ))}
              </div>
              {errors.amount && (
                <p className="mt-1.5 text-[10px] text-red-600">{errors.amount}</p>
              )}
            </div>

            <label className="mt-4 block">
              <span className="text-[12px] font-semibold text-ink">
                Deskripsi / Keterangan Pembelian{' '}
                <span className="text-[#dc2626]">*</span>
              </span>
              <textarea
                value={description}
                maxLength={500}
                onChange={(event) => {
                  setDescription(event.target.value)
                  setErrors((current) => ({ ...current, description: undefined }))
                }}
                placeholder="Contoh: Pembelian Mentega Wijsman 2 kaleng & Tepung Terigu Cakra Kembar 10kg di Toko Bahan Kue Wahab"
                rows={3}
                className={`mt-1.5 w-full resize-none rounded-xl border bg-[#f7f9fc] px-3.5 py-3 text-[12px] leading-relaxed text-ink outline-none transition placeholder:text-slate-400 focus:bg-white focus:ring-4 ${
                  errors.description
                    ? 'border-red-300 focus:border-red-400 focus:ring-red-100'
                    : 'border-line focus:border-primary focus:ring-primary/10'
                }`}
              />
              <span
                className={`mt-1.5 flex items-start justify-between gap-3 text-[10px] leading-relaxed ${
                  errors.description ? 'text-red-600' : 'text-slate-400'
                }`}
              >
                <span>
                  {errors.description ??
                    'Cantumkan rincian barang, kuantitas, dan nama toko tempat belanja.'}
                </span>
                <span className="shrink-0">{description.length}/500</span>
              </span>
            </label>

            <fieldset className="mt-4">
              <legend className="text-[12px] font-semibold text-ink">
                Metode Pembayaran Sumber Dana <span className="text-[#dc2626]">*</span>
              </legend>
              <div className="mt-1.5 grid grid-cols-3 gap-2">
                {financePaymentMethods.map((method) => {
                  const Icon = paymentMethodIcons[method.id]
                  const isActive = paymentMethodId === method.id
                  return (
                    <button
                      key={method.id}
                      type="button"
                      onClick={() => setPaymentMethodId(method.id)}
                      aria-pressed={isActive}
                      className={`flex min-h-[58px] items-center gap-2 rounded-xl border px-2.5 py-2 text-left transition sm:px-3 ${
                        isActive
                          ? 'border-primary/40 bg-primary-soft/45 text-ink'
                          : 'border-line bg-[#f8fafc] text-slate-600 hover:border-primary/25 hover:bg-white'
                      }`}
                    >
                      <span
                        className={`flex size-7 shrink-0 items-center justify-center rounded-full border ${
                          isActive
                            ? 'border-primary bg-primary text-white'
                            : 'border-slate-300 bg-white text-slate-500'
                        }`}
                      >
                        {isActive ? (
                          <Check className="size-3.5" />
                        ) : (
                          <Icon className="size-3.5" />
                        )}
                      </span>
                      <span className="text-[10.5px] font-semibold leading-tight">
                        {method.label}
                      </span>
                    </button>
                  )
                })}
              </div>
            </fieldset>

            <div className="mt-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-[12px] font-semibold text-ink">
                  Lampiran Bukti Struk / Nota Fisik
                </span>
                <span className="text-[10px] text-slate-400">(Opsional)</span>
              </div>

              {attachment ? (
                <div className="mt-1.5 flex items-center gap-3 rounded-xl border border-[#cfe8df] bg-[#f3fbf8] p-3">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-white text-primary shadow-sm">
                    <FileText className="size-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[11.5px] font-semibold text-ink">
                      {attachment.name}
                    </p>
                    <p className="mt-0.5 text-[10px] text-slate-500">
                      {formatFileSize(attachment.size)} • Siap dilampirkan
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={clearAttachment}
                    aria-label="Hapus lampiran"
                    className="flex size-8 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-white hover:text-red-500"
                  >
                    <X className="size-4" />
                  </button>
                </div>
              ) : (
                <label
                  htmlFor="expense-attachment"
                  onDragOver={(event) => {
                    event.preventDefault()
                    setDragActive(true)
                  }}
                  onDragLeave={() => setDragActive(false)}
                  onDrop={handleDrop}
                  className={`mt-1.5 flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed px-4 py-7 text-center transition ${
                    dragActive
                      ? 'border-primary bg-primary-soft/30'
                      : errors.attachment
                        ? 'border-red-300 bg-red-50/40'
                        : 'border-[#cbd5e1] bg-[#f8fafc] hover:border-primary/40 hover:bg-[#f2fbf8]'
                  }`}
                >
                  <span className="flex size-10 items-center justify-center rounded-full bg-[#eef2fa] text-[#4f6fab]">
                    <FileText className="size-4" />
                  </span>
                  <span className="mt-2 text-[11.5px] font-semibold text-ink">
                    Klik atau seret foto nota ke sini
                  </span>
                  <span className="mt-1 text-[10px] text-slate-400">
                    Format JPG, PNG, atau PDF (Maksimal 2 MB)
                  </span>
                  <input
                    ref={fileInputRef}
                    id="expense-attachment"
                    type="file"
                    accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf"
                    onChange={handleAttachmentChange}
                    className="sr-only"
                  />
                </label>
              )}
              {errors.attachment && (
                <p className="mt-1.5 text-[10px] text-red-600">{errors.attachment}</p>
              )}
            </div>

            <div className="mt-6 flex flex-col-reverse gap-2 border-t border-line pt-5 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={resetForm}
                className="inline-flex h-10 items-center justify-center rounded-xl border border-transparent bg-[#f1f5f9] px-4 text-[11.5px] font-semibold text-slate-600 transition hover:bg-slate-200/70"
              >
                {editingId ? 'Batalkan Edit' : 'Reset Form'}
              </button>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-[11.5px] font-semibold text-white shadow-sm transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-70"
              >
                {saving ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Check className="size-4" />
                )}
                {saving
                  ? 'Menyimpan...'
                  : editingId
                    ? 'Perbarui Pengeluaran'
                    : 'Simpan Pengeluaran'}
              </button>
            </div>
          </form>
        </section>

        <div className="space-y-5">
          <section className="rounded-2xl border border-line bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.06)]">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <PieChart className="size-[18px] text-primary" />
                <h2 className="text-[17px] font-bold text-ink">Alokasi Biaya Terbesar</h2>
              </div>
              <span className="rounded-full bg-[#f1f5f9] px-2.5 py-1 text-[9.5px] font-semibold text-slate-500">
                Bulan Ini
              </span>
            </div>

            <div className="mt-4 flex items-start gap-3 rounded-xl bg-[#f0faf7] p-4">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white text-primary shadow-sm">
                <PieChart className="size-4" />
              </span>
              <p className="text-[11px] leading-relaxed text-slate-600">
                <span className="font-semibold text-ink">
                  {topAllocation.label} &amp; Dapur
                </span>{' '}
                mendominasi{' '}
                <span className="font-semibold text-ink">{topAllocation.percent}%</span>{' '}
                dari total pengeluaran dialokasikan untuk kebutuhan operasional{' '}
                {session.storeName}.
              </p>
            </div>

            <div className="mt-4 flex h-3 overflow-hidden rounded-full bg-slate-100">
              {allocationRows.map((row) => (
                <span
                  key={row.id}
                  className={`h-full ${row.barClassName}`}
                  style={{ width: `${row.percent}%` }}
                />
              ))}
            </div>

            <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2">
              {allocationRows.map((row) => (
                <div key={row.id} className="flex items-center gap-2">
                  <span className={`size-2 shrink-0 rounded-full ${row.dotClassName}`} />
                  <p className="min-w-0 truncate text-[10.5px] text-slate-600">
                    {row.label}{' '}
                    <span className="font-semibold text-ink">({row.percent}%)</span>
                  </p>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-line bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.06)]">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <h2 className="max-w-[120px] text-[17px] font-bold leading-tight text-ink">
                Transaksi Terbaru
              </h2>
              <div className="flex rounded-lg bg-[#eef2f7] p-1">
                {transactionTabs.map((option) => (
                  <button
                    key={option.key}
                    type="button"
                    onClick={() => {
                      setTab(option.key)
                      setShowAllTransactions(false)
                    }}
                    className={`rounded-md px-2.5 py-1.5 text-[9.5px] font-semibold transition ${
                      tab === option.key
                        ? 'bg-white text-ink shadow-sm'
                        : 'text-slate-500 hover:text-ink'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {filteredTransactions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <span className="flex size-11 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                  <ReceiptText className="size-5" />
                </span>
                <p className="mt-3 text-[12.5px] font-semibold text-ink">
                  Belum ada transaksi
                </p>
                <p className="mt-1 max-w-[220px] text-[10.5px] leading-relaxed text-slate-500">
                  Catatan pemasukan dan pengeluaran pada periode ini akan muncul di sini.
                </p>
              </div>
            ) : (
              <div className="mt-2 divide-y divide-[#eef2f6]">
                {displayedTransactions.map((transaction) => {
                  const isExpense = transaction.type === 'expense'
                  const categoryLabel = transaction.categoryId
                    ? financeCategoryMeta[transaction.categoryId].label
                    : null
                  return (
                    <div
                      key={transaction.id}
                      className="group flex items-start gap-3 py-3.5 first:pt-3 last:pb-2"
                    >
                      <span
                        className={`mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-xl ${
                          isExpense
                            ? 'bg-[#fef2f2] text-[#ef4444]'
                            : 'bg-[#e7f7f2] text-primary'
                        }`}
                      >
                        {isExpense ? (
                          <ShoppingBag className="size-[18px]" />
                        ) : (
                          <ReceiptText className="size-[18px]" />
                        )}
                      </span>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <p className="min-w-0 truncate text-[11.5px] font-semibold text-ink">
                            {transaction.title}
                          </p>
                          <p
                            className={`shrink-0 text-[11.5px] font-bold ${
                              isExpense ? 'text-[#dc2626]' : 'text-[#059669]'
                            }`}
                          >
                            {isExpense ? '-' : '+'}Rp
                            {formatNumber(transaction.amount)}
                          </p>
                        </div>

                        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[8.5px] font-semibold ${
                              transaction.source === 'manual'
                                ? 'bg-[#f1f5f9] text-slate-500'
                                : 'bg-[#dcfce7] text-[#15803d]'
                            }`}
                          >
                            {transaction.source === 'manual' ? (
                              <span className="size-1 rounded-full bg-slate-400" />
                            ) : (
                              <Check className="size-2.5" />
                            )}
                            {transaction.source === 'manual' ? 'Manual' : 'Otomatis'}
                          </span>
                          <span className="min-w-0 truncate text-[9.5px] text-slate-500">
                            {isExpense ? categoryLabel : 'Selesai'} •{' '}
                            {formatTransactionDate(transaction.date)},{' '}
                            {transaction.time}
                          </span>
                        </div>

                        {isExpense && transaction.source === 'manual' ? (
                          <div className="mt-1.5 flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => handleEdit(transaction)}
                              aria-label={`Edit ${transaction.title}`}
                              className="flex size-7 items-center justify-center rounded-md text-slate-400 transition hover:bg-slate-100 hover:text-primary"
                            >
                              <Pencil className="size-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteTarget(transaction)}
                              aria-label={`Hapus ${transaction.title}`}
                              className="flex size-7 items-center justify-center rounded-md text-slate-400 transition hover:bg-red-50 hover:text-red-500"
                            >
                              <Trash2 className="size-3.5" />
                            </button>
                          </div>
                        ) : (
                          <p className="mt-1.5 text-right text-[9px] text-slate-400">
                            {transaction.paymentMethod}
                          </p>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            <button
              type="button"
              onClick={() => setShowAllTransactions((current) => !current)}
              className="mt-3 flex w-full items-center justify-center gap-1.5 border-t border-line pt-4 text-[10.5px] font-semibold text-slate-600 transition hover:text-primary"
            >
              {showAllTransactions
                ? 'Ringkas Catatan Pembukuan'
                : 'Lihat Semua Catatan Pembukuan'}
              <ArrowRight className="size-3.5" />
            </button>
          </section>

          <section className="rounded-2xl border border-[#e9edf5] bg-[#f5f7fc] p-5">
            <div className="flex items-start gap-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-white text-primary shadow-sm">
                <Lightbulb className="size-4" />
              </span>
              <div>
                <h2 className="text-[13px] font-bold text-ink">
                  Tips {session.storeName}
                </h2>
                <p className="mt-1.5 text-[10.5px] leading-relaxed text-slate-500">
                  Selalu foto nota belanja fisik segera setelah belanja bahan di pasar atau
                  toko bahan kue agar tidak hilang dan pembukuan tidak selisih.
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>

      {deleteTarget && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-expense-title"
          className="fixed inset-0 z-[70] flex items-end justify-center bg-slate-900/40 backdrop-blur-sm sm:items-center sm:p-4"
        >
          <div className="w-full max-w-sm rounded-t-2xl bg-white p-5 shadow-2xl sm:rounded-2xl">
            <div className="flex items-start justify-between gap-4">
              <span className="flex size-10 items-center justify-center rounded-full bg-red-50 text-red-500">
                <Trash2 className="size-5" />
              </span>
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                aria-label="Tutup dialog"
                className="flex size-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="size-4" />
              </button>
            </div>
            <h2
              id="delete-expense-title"
              className="mt-4 text-[17px] font-bold text-ink"
            >
              Hapus catatan pengeluaran?
            </h2>
            <p className="mt-1.5 text-[11.5px] leading-relaxed text-slate-500">
              “{deleteTarget.title}” sebesar{' '}
              <span className="font-semibold text-ink">
                Rp{formatNumber(deleteTarget.amount)}
              </span>{' '}
              akan dihapus dan ringkasan laba bersih diperbarui.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="inline-flex h-9 items-center justify-center rounded-xl bg-[#f1f5f9] px-4 text-[11.5px] font-semibold text-slate-600 transition hover:bg-slate-200/70"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl bg-red-600 px-4 text-[11.5px] font-semibold text-white shadow-sm transition hover:bg-red-700"
              >
                <Trash2 className="size-3.5" />
                Hapus Catatan
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div
          role="status"
          className={`fixed bottom-20 right-4 z-[80] max-w-[320px] rounded-xl px-4 py-3 text-sm font-medium shadow-lg lg:bottom-6 ${
            toast.tone === 'success'
              ? 'bg-[#0f766e] text-white'
              : toast.tone === 'danger'
                ? 'bg-red-600 text-white'
                : 'bg-slate-900 text-white'
          }`}
        >
          {toast.message}
        </div>
      )}
    </div>
  )
}
