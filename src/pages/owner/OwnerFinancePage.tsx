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
  ArrowUpRight,
  CalendarDays,
  Camera,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CookingPot,
  Download,
  FileText,
  Flame,
  Info,
  Landmark,
  Lightbulb,
  Loader2,
  Lock,
  Megaphone,
  Package,
  Pencil,
  Plus,
  ReceiptText,
  RefreshCw,
  Search,
  ShieldCheck,
  Store,
  Trash2,
  TrendingDown,
  TrendingUp,
  TriangleAlert,
  Users,
  Wrench,
  X,
} from 'lucide-react'
import OwnerCashflowChart from '../../components/owner/OwnerCashflowChart'
import { getOwnerSession } from '../../lib/owner-auth'
import {
  financeAllocationGroups,
  financeCashflowTrend,
  financeCategories,
  financeCategoryMeta,
  financeInitialAllocation,
  financeInitialManualCount,
  financeInitialTransactions,
  financeLiquidityAccounts,
  financePaymentMethods,
  financePeriodBase,
  financeQuickAmounts,
  type FinanceAllocationGroupId,
  type FinanceCategoryId,
  type FinancePaymentMethodId,
  type FinanceTransaction,
} from '../../lib/owner-finance-data'

type PeriodKey = 'hari' | '7d' | 'bulan' | 'tahun' | 'kustom'
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

const PAGE_SIZE = 6

const transactionTabs: { key: TransactionTab; label: string }[] = [
  { key: 'semua', label: 'Semua' },
  { key: 'pemasukan', label: 'Pemasukan' },
  { key: 'pengeluaran', label: 'Pengeluaran' },
]

const financeCategoryCards: {
  id: FinanceCategoryId
  title: string
  description: string
  icon: typeof CookingPot
}[] = [
  {
    id: 'bahan-baku',
    title: 'Bahan Baku Dapur',
    description: 'Belanja bahan baku dapur',
    icon: CookingPot,
  },
  {
    id: 'kemasan',
    title: 'Kemasan & Dus',
    description: 'Box, plastik, dan packaging',
    icon: Package,
  },
  {
    id: 'operasional',
    title: 'Utilitas Dapur',
    description: 'Gas, listrik, dan air',
    icon: Flame,
  },
  {
    id: 'gaji',
    title: 'Gaji & Upah Harian',
    description: 'Untuk gaji karyawan harian',
    icon: Users,
  },
  {
    id: 'sewa',
    title: 'Sewa & Retribusi',
    description: 'Sewa tempat dan retribusi',
    icon: Store,
  },
  {
    id: 'pemasaran',
    title: 'Pemasaran & Promosi',
    description: 'Iklan, brosur, dan promosi',
    icon: Megaphone,
  },
  {
    id: 'lainnya',
    title: 'Servis & Lainnya',
    description: 'Perbaikan alat dan biaya lain',
    icon: Wrench,
  },
]

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
  return value < 0 ? `-Rp ${absolute}` : `Rp ${absolute}`
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

function getTransactionSubline(transaction: FinanceTransaction) {
  const vendorLine = transaction.vendor
    ? `${transaction.vendor}${
        transaction.invoiceNumber
          ? ` (Faktur No. ${transaction.invoiceNumber})`
          : ''
      }`
    : ''
  return [transaction.detail, vendorLine].filter(Boolean).join(' \u2022 ')
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

function getPageItems(total: number, current: number): (number | 'ellipsis')[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, index) => index + 1)
  }

  const items: (number | 'ellipsis')[] = [1]
  const start = Math.max(2, current - 1)
  const end = Math.min(total - 1, current + 1)

  if (start > 2) items.push('ellipsis')
  for (let page = start; page <= end; page += 1) items.push(page)
  if (end < total - 1) items.push('ellipsis')
  items.push(total)
  return items
}

export default function OwnerFinancePage() {
  const [session] = useState(getOwnerSession)
  const [today] = useState(() => new Date())
  const [period, setPeriod] = useState<PeriodKey>('bulan')
  const [tab, setTab] = useState<TransactionTab>('semua')
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<FinanceCategoryId | ''>('')
  const [methodFilter, setMethodFilter] = useState<FinancePaymentMethodId | ''>('')
  const [transactions, setTransactions] = useState<FinanceTransaction[]>(() => [
    ...financeInitialTransactions,
  ])
  const [allocation, setAllocation] = useState<Record<FinanceAllocationGroupId, number>>(
    () => ({ ...financeInitialAllocation }),
  )
  const [manualCount, setManualCount] = useState(financeInitialManualCount)
  const [formOpen, setFormOpen] = useState(false)
  const [date, setDate] = useState(() => toLocalIsoDate(today))
  const [categoryId, setCategoryId] = useState<FinanceCategoryId | ''>('')
  const [amount, setAmount] = useState('')
  const [quickAddValue, setQuickAddValue] = useState<number | null>(null)
  const [description, setDescription] = useState('')
  const [vendor, setVendor] = useState('')
  const [invoiceNumber, setInvoiceNumber] = useState('')
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

  const amountRef = useRef<HTMLInputElement>(null)
  const formBodyRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => setToast(null), 4000)
    return () => window.clearTimeout(timer)
  }, [toast])

  const todayIso = toLocalIsoDate(today)
  const monthLabel = getMonthLabel(today)
  const yearLabel = today.getFullYear()
  const periodOptions: { key: PeriodKey; label: string; icon?: typeof CalendarDays }[] = [
    { key: 'hari', label: 'Hari Ini' },
    { key: '7d', label: '7 Hari' },
    { key: 'bulan', label: `Bulan Ini: ${monthLabel}` },
    { key: 'tahun', label: `Tahun ${yearLabel}` },
    { key: 'kustom', label: 'Kustom Kalender', icon: CalendarDays },
  ]

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
  const expenseRatio = income > 0 ? (expense / income) * 100 : 0
  const isProfitable = profit >= 0
  const onlineIncome = Math.round(income * 0.87)
  const posIncome = income - onlineIncome
  const averageDailyIncome = Math.round(financePeriodBase.bulan.income / 30)
  const monthlyExpenseRatio =
    (financePeriodBase.bulan.expense / financePeriodBase.bulan.income) * 100

  const allocationRows = financeAllocationGroups.map((group) => {
    const value = allocation[group.id]
    const percent = allocationTotal > 0 ? Math.round((value / allocationTotal) * 100) : 0
    return { ...group, value, percent }
  })

  const liquidityKasBase =
    financeLiquidityAccounts.find((account) => account.id === 'kas')?.amount ?? 0
  const liquidityBank =
    financeLiquidityAccounts.find((account) => account.id === 'bank')?.amount ?? 0
  const liquidityKas = Math.max(0, liquidityKasBase - Math.max(0, expenseDelta))
  const liquidityTotal = liquidityBank + liquidityKas

  const cashflowPoints = useMemo(() => {
    const incomeUnits = financeCashflowTrend.income.reduce(
      (total, value) => total + value,
      0,
    )
    const expenseUnits = financeCashflowTrend.expense.reduce(
      (total, value) => total + value,
      0,
    )
    const incomeScale = financePeriodBase.bulan.income / (incomeUnits * 1000)
    const expenseScale = financePeriodBase.bulan.expense / (expenseUnits * 1000)
    const formatter = new Intl.DateTimeFormat('id-ID', {
      day: '2-digit',
      month: 'short',
    })

    return financeCashflowTrend.income.map((value, index) => {
      const pointDate = new Date(today)
      pointDate.setDate(
        pointDate.getDate() - (financeCashflowTrend.income.length - 1 - index),
      )
      return {
        label: formatter.format(pointDate),
        income: Math.round(value * 1000 * incomeScale),
        expense: Math.round(financeCashflowTrend.expense[index] * 1000 * expenseScale),
      }
    })
  }, [today])

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

    if (period === 'tahun') {
      return { start: `${today.getFullYear()}-01-01`, end }
    }

    const startDate = new Date(today)
    if (period === '7d') {
      startDate.setDate(startDate.getDate() - 6)
      return { start: toLocalIsoDate(startDate), end }
    }

    return { start: end, end }
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

  const tabCounts = useMemo(() => {
    const incomeCount = periodTransactions.filter(
      (transaction) => transaction.type === 'income',
    ).length
    return {
      semua: periodTransactions.length,
      pemasukan: incomeCount,
      pengeluaran: periodTransactions.length - incomeCount,
    }
  }, [periodTransactions])

  const filteredTransactions = useMemo(() => {
    let list = periodTransactions

    if (tab === 'pengeluaran') {
      list = list.filter((transaction) => transaction.type === 'expense')
    } else if (tab === 'pemasukan') {
      list = list.filter((transaction) => transaction.type === 'income')
    }

    const keyword = search.trim().toLowerCase()
    if (keyword) {
      list = list.filter((transaction) => {
        const categoryLabel = transaction.categoryId
          ? financeCategoryMeta[transaction.categoryId].label
          : 'Penjualan'
        const haystack = [
          transaction.title,
          getTransactionSubline(transaction),
          transaction.reference,
          transaction.paymentMethod,
          categoryLabel,
        ]
          .join(' ')
          .toLowerCase()
        return haystack.includes(keyword)
      })
    }

    if (categoryFilter) {
      list = list.filter((transaction) => transaction.categoryId === categoryFilter)
    }

    if (methodFilter) {
      list = list.filter(
        (transaction) => transaction.paymentMethodId === methodFilter,
      )
    }

    return list
  }, [categoryFilter, methodFilter, periodTransactions, search, tab])

  const totalPages = Math.max(1, Math.ceil(filteredTransactions.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const pageStart = (currentPage - 1) * PAGE_SIZE
  const paginatedTransactions = filteredTransactions.slice(
    pageStart,
    pageStart + PAGE_SIZE,
  )

  if (!session) {
    return <Navigate to="/" replace />
  }

  function showToast(message: string, tone: ToastTone = 'success') {
    setToast({ message, tone })
  }

  function openCreateForm() {
    resetForm()
    setFormOpen(true)
    window.setTimeout(() => amountRef.current?.focus(), 280)
  }

  function handleCustomStart(value: string) {
    setCustomStart(value)
    if (value && value > customEnd) setCustomEnd(value)
    setPage(1)
  }

  function handleCustomEnd(value: string) {
    setCustomEnd(value)
    if (value && value < customStart) setCustomStart(value)
    setPage(1)
  }

  function resetForm() {
    setDate(todayIso)
    setCategoryId('')
    setAmount('')
    setQuickAddValue(null)
    setDescription('')
    setVendor('')
    setInvoiceNumber('')
    setPaymentMethodId('kas')
    setAttachment(null)
    setErrors({})
    setEditingId(null)
    setSaving(false)
    setDragActive(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  function handleQuickAmount(value: number) {
    const current = Number(amount || '0')
    setAmount(String(current + value))
    setQuickAddValue(value)
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

  function handleDrop(event: DragEvent<HTMLDivElement>) {
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

  async function saveExpense(keepOpen: boolean) {
    if (saving) return

    const nextErrors = validateForm()
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      formBodyRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
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
      reference:
        previousTransaction?.reference ??
        `EXP-${date.replaceAll('-', '')}-${String(Date.now()).slice(-3)}`,
      type: 'expense',
      title: description.trim(),
      vendor: vendor.trim() || undefined,
      invoiceNumber: invoiceNumber.trim() || undefined,
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
        keepOpen
          ? `Pengeluaran ${formatRupiah(
              nextTransaction.amount,
            )} tercatat. Lanjut catat berikutnya.`
          : `Pengeluaran ${formatRupiah(nextTransaction.amount)} berhasil dicatat.`,
      )
    }

    setPage(1)
    resetForm()
    if (keepOpen) {
      setFormOpen(true)
      window.setTimeout(() => amountRef.current?.focus(), 250)
    } else {
      setFormOpen(false)
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    void saveExpense(false)
  }

  function handleEdit(transaction: FinanceTransaction) {
    if (transaction.type !== 'expense' || transaction.source !== 'manual') return

    setEditingId(transaction.id)
    setDate(transaction.date)
    setCategoryId(transaction.categoryId ?? '')
    setAmount(String(transaction.amount))
    setQuickAddValue(null)
    setDescription(transaction.title)
    setVendor(transaction.vendor ?? '')
    setInvoiceNumber(transaction.invoiceNumber ?? '')
    setPaymentMethodId(transaction.paymentMethodId ?? 'kas')
    setAttachment(null)
    setErrors({})
    setFormOpen(true)
    window.setTimeout(() => amountRef.current?.focus(), 280)
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

    if (editingId === deleteTarget.id) {
      resetForm()
      setFormOpen(false)
    }

    setDeleteTarget(null)
    setPage(1)
    showToast('Catatan pengeluaran dihapus. Ringkasan laba diperbarui.')
  }

  function handleExport() {
    if (filteredTransactions.length === 0) {
      showToast('Tidak ada transaksi pada periode ini untuk diekspor.', 'info')
      return
    }

    const header = [
      'Tanggal',
      'Waktu',
      'Jenis',
      'No. Referensi',
      'Deskripsi',
      'Kategori',
      'Metode Pembayaran',
      'Sumber',
      'Nominal',
    ]
    const rows = filteredTransactions.map((transaction) => [
      formatTransactionDate(transaction.date),
      transaction.time,
      transaction.type === 'income' ? 'Pemasukan' : 'Pengeluaran',
      transaction.reference,
      getTransactionSubline(transaction)
        ? `${transaction.title} - ${getTransactionSubline(transaction)}`
        : transaction.title,
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
        <div className="max-w-[680px]">
          <h1 className="text-[27px] font-extrabold tracking-tight text-ink sm:text-[30px]">
            Keuangan &amp; Buku Toko
          </h1>
          <p className="mt-1.5 max-w-[640px] text-[12.5px] leading-relaxed text-slate-500">
            Pantau pemasukan otomatis dari pesanan selesai, catat pengeluaran
            operasional, dan pantau laba bersih {session.storeName} secara transparan.
          </p>
        </div>

        <div className="flex w-full flex-wrap gap-2 xl:w-auto xl:justify-end">
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
            onClick={openCreateForm}
            className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-[11.5px] font-semibold text-white shadow-sm transition hover:bg-primary-hover sm:flex-none"
          >
            <Plus className="size-4" />
            Tambah Pengeluaran
          </button>
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex w-full overflow-x-auto rounded-xl bg-[#f1f5f9] p-1 sm:w-auto">
          {periodOptions.map((option) => {
            const isActive = period === option.key
            const Icon = option.icon
            return (
              <button
                key={option.key}
                type="button"
                onClick={() => {
                  setPeriod(option.key)
                  setPage(1)
                }}
                className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-[11px] font-semibold transition ${
                  isActive
                    ? 'bg-white text-ink shadow-sm'
                    : 'text-slate-500 hover:text-ink'
                }`}
              >
                {Icon ? <Icon className="size-3.5" /> : null}
                {option.label}
              </button>
            )
          })}
        </div>

        <p className="inline-flex items-center gap-1.5 px-1 text-[10.5px] text-slate-500">
          <RefreshCw className="size-3.5 text-primary" />
          Sinkronisasi otomatis aktif &middot; 2 menit yang lalu
        </p>
      </div>

      {period === 'kustom' && (
        <div className="mt-3 flex flex-col gap-3 rounded-2xl border border-line bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.06)] sm:flex-row sm:items-end">
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

      <div className="mt-4 grid gap-3.5 sm:grid-cols-2 xl:grid-cols-4">
        <section className="flex flex-col rounded-2xl border border-line bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.06)]">
          <div className="flex items-start justify-between gap-3">
            <p className="text-[10.5px] font-semibold leading-snug text-slate-500">
              Pemasukan Kas
              <span className="mt-0.5 block text-[9.5px] font-normal text-slate-400">
                (Total Inflow)
              </span>
            </p>
            <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#dff7ee] text-primary">
              <TrendingUp className="size-4" />
            </span>
          </div>
          <div className="mt-2.5 flex flex-wrap items-baseline gap-2">
            <p className="text-[26px] font-extrabold leading-none tracking-tight text-ink">
              {formatRupiah(income)}
            </p>
            <span className="inline-flex items-center gap-0.5 rounded-full bg-[#dcfce7] px-1.5 py-0.5 text-[9px] font-bold text-[#15803d]">
              <ArrowUpRight className="size-2.5" />
              22%
            </span>
          </div>

          <div className="mt-auto pt-4">
            <div className="rounded-xl bg-[#f0faf7] p-3">
              <p className="flex items-center gap-1.5 text-[9.5px] font-semibold text-[#0f766e]">
                <Lock className="size-3" />
                Otomatis dari {currentBase.orders} Pesanan Selesai
              </p>
              <p className="mt-1 text-[9.5px] leading-relaxed text-slate-500">
                <span className="font-semibold text-slate-600">
                  {formatRupiah(onlineIncome)}
                </span>{' '}
                Pesanan Online &bull;{' '}
                <span className="font-semibold text-slate-600">
                  {formatRupiah(posIncome)}
                </span>{' '}
                Kasir POS
              </p>
            </div>
          </div>
        </section>

        <section className="flex flex-col rounded-2xl border border-line bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.06)]">
          <div className="flex items-start justify-between gap-3">
            <p className="text-[10.5px] font-semibold leading-snug text-slate-500">
              Pengeluaran Operasional
              <span className="mt-0.5 block text-[9.5px] font-normal text-slate-400">
                ({manualCount} catatan)
              </span>
            </p>
            <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#fee7e7] text-[#dc2626]">
              <TrendingDown className="size-4" />
            </span>
          </div>
          <p className="mt-2.5 text-[26px] font-extrabold leading-none tracking-tight text-ink">
            {formatRupiah(expense)}
          </p>

          <div className="mt-auto pt-4">
            <div className="border-t border-[#eef2f6] pt-2.5">
              <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[9.5px] text-slate-500">
                {allocationRows.slice(0, 3).map((row) => (
                  <span key={row.id} className="inline-flex items-center gap-1">
                    <span className={`size-1.5 rounded-full ${row.dotClassName}`} />
                    {row.label} ({row.percent}%)
                  </span>
                ))}
              </p>
              <button
                type="button"
                onClick={openCreateForm}
                className="mt-2 inline-flex items-center gap-1 text-[10px] font-semibold text-primary transition hover:text-primary-hover"
              >
                <Plus className="size-3" />
                Catat Biaya Baru
              </button>
            </div>
          </div>
        </section>

        <section className="relative flex flex-col overflow-hidden rounded-2xl border border-[#0f766e] bg-[linear-gradient(135deg,#0a4b47_0%,#0f766e_100%)] p-4 text-white shadow-[0_8px_24px_rgba(15,118,110,0.22)]">
          <span
            aria-hidden
            className="absolute -right-10 -top-12 size-36 rounded-full border-[16px] border-white/5"
          />
          <span
            aria-hidden
            className="absolute -bottom-14 right-6 size-36 rounded-full bg-white/[0.04]"
          />
          <div className="relative flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[10.5px] font-semibold leading-snug text-white/70">
                Estimasi Laba Bersih
              </p>
              <p
                className={`mt-2.5 text-[26px] font-extrabold leading-none tracking-tight ${
                  isProfitable ? 'text-white' : 'text-[#fecaca]'
                }`}
              >
                {formatRupiah(profit)}
              </p>
            </div>
            <span
              className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold ${
                isProfitable
                  ? 'bg-[#d1fae5] text-[#065f46]'
                  : 'bg-[#fee2e2] text-[#991b1b]'
              }`}
            >
              {!isProfitable && <TriangleAlert className="size-2.5" />}
              {isProfitable ? 'Sehat' : 'Perlu Perhatian'}
            </span>
          </div>

          <div className="relative mt-auto pt-4">
            <div className="grid grid-cols-2 gap-3 border-t border-white/10 pt-2.5">
              <div>
                <p className="text-[8.5px] font-semibold uppercase tracking-[0.06em] text-white/50">
                  Margin Operasional
                </p>
                <p className="mt-0.5 text-[14px] font-bold text-white">
                  {margin.toFixed(1)}%
                </p>
              </div>
              <div>
                <p className="text-[8.5px] font-semibold uppercase tracking-[0.06em] text-white/50">
                  Rasio Beban
                </p>
                <p className="mt-0.5 text-[14px] font-bold text-white">
                  {expenseRatio.toFixed(1)}%
                </p>
              </div>
            </div>
            <p className="mt-2 text-[8.5px] leading-relaxed text-white/45">
              Formula: pemasukan kas selesai &ndash; pengeluaran riil tercatat.
            </p>
          </div>
        </section>

        <section className="flex flex-col rounded-2xl border border-line bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.06)]">
          <div className="flex items-start justify-between gap-3">
            <p className="text-[10.5px] font-semibold leading-snug text-slate-500">
              Likuiditas Kas &amp; Bank
              <span className="mt-0.5 block text-[9.5px] font-normal text-slate-400">
                Saldo siap pakai
              </span>
            </p>
            <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#eef2ff] text-[#3b5bdb]">
              <Landmark className="size-4" />
            </span>
          </div>
          <p className="mt-2.5 text-[26px] font-extrabold leading-none tracking-tight text-ink">
            {formatRupiah(liquidityTotal)}
          </p>

          <div className="mt-auto pt-4">
            <div className="space-y-1 rounded-xl bg-[#f7f9fc] px-3 py-2">
              <div className="flex items-center justify-between gap-2 text-[9.5px]">
                <span className="text-slate-500">BCA Usaha</span>
                <span className="font-semibold text-ink">{formatRupiah(liquidityBank)}</span>
              </div>
              <div className="flex items-center justify-between gap-2 text-[9.5px]">
                <span className="text-slate-500">Kas Tunai Laci Toko</span>
                <span className="font-semibold text-ink">{formatRupiah(liquidityKas)}</span>
              </div>
            </div>
            <p className="mt-2 inline-flex items-center gap-1 text-[9px] font-medium text-[#15803d]">
              <Check className="size-3" />
              Rekonsiliasi Kas Cocok (0 Selisih)
            </p>
          </div>
        </section>
      </div>

      <div className="mt-4 grid gap-3.5 xl:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)]">
        <section className="rounded-2xl border border-line bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.06)] sm:p-5">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h2 className="text-[15px] font-bold tracking-tight text-ink">
                Arus Kas Masuk &amp; Keluar
              </h2>
              <p className="mt-0.5 text-[10.5px] text-slate-500">
                Tren perbandingan harian 30 hari terakhir
              </p>
            </div>
            <div className="flex items-center gap-3 text-[9.5px] font-semibold text-slate-500">
              <span className="inline-flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-primary" />
                Pemasukan
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-[#dc2626]" />
                Pengeluaran
              </span>
            </div>
          </div>

          <OwnerCashflowChart
            data={cashflowPoints}
            peakNote="Pesanan 8 Box Lapis Legit Spesial"
          />

          <div className="mt-1 flex flex-col gap-2 border-t border-[#eef2f6] pt-3 text-[9.5px] text-slate-500 sm:flex-row sm:items-center sm:gap-5">
            <p>
              Rata-rata Pemasukan Harian:{' '}
              <span className="font-bold text-ink">
                {formatRupiah(averageDailyIncome)}/hari
              </span>
            </p>
            <span aria-hidden className="hidden h-3 w-px bg-line sm:block" />
            <p>
              Rasio Beban:{' '}
              <span className="font-bold text-ink">
                {monthlyExpenseRatio.toFixed(1)}%
              </span>{' '}
              <span className="font-medium text-[#15803d]">(Sangat Terkendali)</span>
            </p>
          </div>
        </section>

        <section className="flex flex-col rounded-2xl border border-line bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.06)] sm:p-5">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h2 className="text-[15px] font-bold tracking-tight text-ink">
                Struktur Alokasi Biaya Operasional
              </h2>
              <p className="mt-0.5 text-[10.5px] text-slate-500">
                Rincian beban bahan &amp; operasional berjalan
              </p>
            </div>
            <span className="shrink-0 rounded-full bg-[#f7f9fc] px-2.5 py-1 text-[9px] font-semibold text-slate-500">
              Total {formatRupiah(allocationTotal)}
            </span>
          </div>

          <div className="mt-4 space-y-3">
            {allocationRows.map((row) => (
              <div key={row.id}>
                <div className="flex items-center justify-between gap-2 text-[10px]">
                  <span className="flex min-w-0 items-center gap-1.5 font-medium text-slate-600">
                    <span className={`size-1.5 shrink-0 rounded-full ${row.dotClassName}`} />
                    <span className="truncate">{row.label}</span>
                  </span>
                  <span className="shrink-0 font-bold text-ink">
                    {row.percent}%{' '}
                    <span className="font-medium text-slate-400">
                      ({formatRupiah(row.value)})
                    </span>
                  </span>
                </div>
                <div className="mt-1.5 flex h-2 overflow-hidden rounded-full bg-slate-100">
                  <span
                    className={`h-full rounded-full ${row.barClassName}`}
                    style={{ width: `${row.percent}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-auto pt-4">
            <div className="flex items-start gap-2.5 rounded-xl border border-[#d9f0e8] bg-[#f0faf7] p-3">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-white text-[#d97706] shadow-sm">
                <Lightbulb className="size-3.5" />
              </span>
              <p className="text-[9.5px] leading-relaxed text-slate-600">
                <span className="font-bold text-ink">Tip UMKM:</span> Efisiensi pembelian
                bahan dalam jumlah besar dapat menghemat biaya operasional hingga ~7% per
                bulan.
              </p>
            </div>
          </div>
        </section>
      </div>

      <section className="mt-4 overflow-hidden rounded-2xl border border-line bg-white shadow-[0_1px_2px_rgba(15,23,42,0.06)]">
        <div className="flex flex-col gap-3 px-4 pt-4 sm:px-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h2 className="text-[16px] font-bold tracking-tight text-ink">
              Mutasi &amp; Buku Kas
            </h2>
            <p className="mt-0.5 text-[10.5px] text-slate-500">
              Semua catatan kas otomatis dan pengeluaran operasional terdokumentasi.
            </p>
          </div>

          <div className="flex rounded-xl bg-[#f1f5f9] p-1">
            {transactionTabs.map((option) => {
              const isActive = tab === option.key
              return (
                <button
                  key={option.key}
                  type="button"
                  onClick={() => {
                    setTab(option.key)
                    setPage(1)
                  }}
                  className={`rounded-lg px-2.5 py-1.5 text-[10px] font-semibold transition ${
                    isActive
                      ? 'bg-white text-ink shadow-sm'
                      : 'text-slate-500 hover:text-ink'
                  }`}
                >
                  {option.label}
                  <span
                    className={`ml-1 text-[9px] ${
                      isActive ? 'text-slate-400' : 'text-slate-400/80'
                    }`}
                  >
                    ({tabCounts[option.key]})
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        <div className="mt-3 flex flex-col gap-2 px-4 pb-3 sm:flex-row sm:px-5">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value)
                setPage(1)
              }}
              placeholder="Cari referensi, nama bahan, pesanan, atau vendor..."
              className="h-9 w-full rounded-xl border border-line bg-[#f7f9fc] pl-9 pr-3 text-[11px] text-ink outline-none transition placeholder:text-slate-400 focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10"
            />
          </div>

          <div className="grid grid-cols-2 gap-2 sm:flex">
            <div className="relative">
              <select
                value={categoryFilter}
                onChange={(event) => {
                  setCategoryFilter(event.target.value as FinanceCategoryId | '')
                  setPage(1)
                }}
                className="h-9 w-full appearance-none rounded-xl border border-line bg-white pl-3 pr-8 text-[10.5px] text-slate-600 outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10 sm:w-40"
              >
                <option value="">Semua Kategori</option>
                {financeCategories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 size-3.5 -translate-y-1/2 text-slate-400" />
            </div>

            <div className="relative">
              <select
                value={methodFilter}
                onChange={(event) => {
                  setMethodFilter(event.target.value as FinancePaymentMethodId | '')
                  setPage(1)
                }}
                className="h-9 w-full appearance-none rounded-xl border border-line bg-white pl-3 pr-8 text-[10.5px] text-slate-600 outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10 sm:w-44"
              >
                <option value="">Semua Metode Bayar</option>
                {financePaymentMethods.map((method) => (
                  <option key={method.id} value={method.id}>
                    {method.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 size-3.5 -translate-y-1/2 text-slate-400" />
            </div>
          </div>
        </div>

        <div className="hidden overflow-x-auto lg:block">
          <table className="w-full min-w-[940px] border-collapse text-left">
            <thead>
              <tr className="bg-[#f8fafc] [&>th:first-child]:pl-5 [&>th:last-child]:pr-5">
                <th className="whitespace-nowrap px-3 py-2.5 text-[9px] font-semibold uppercase tracking-[0.08em] text-slate-400">
                  Tanggal &amp; Waktu
                </th>
                <th className="whitespace-nowrap px-3 py-2.5 text-[9px] font-semibold uppercase tracking-[0.08em] text-slate-400">
                  Jenis &amp; Sumber
                </th>
                <th className="whitespace-nowrap px-3 py-2.5 text-[9px] font-semibold uppercase tracking-[0.08em] text-slate-400">
                  No. Referensi
                </th>
                <th className="whitespace-nowrap px-3 py-2.5 text-[9px] font-semibold uppercase tracking-[0.08em] text-slate-400">
                  Deskripsi Transaksi
                </th>
                <th className="whitespace-nowrap px-3 py-2.5 text-[9px] font-semibold uppercase tracking-[0.08em] text-slate-400">
                  Kategori
                </th>
                <th className="whitespace-nowrap px-3 py-2.5 text-right text-[9px] font-semibold uppercase tracking-[0.08em] text-slate-400">
                  Nominal
                </th>
                <th className="whitespace-nowrap px-3 py-2.5 text-right text-[9px] font-semibold uppercase tracking-[0.08em] text-slate-400">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#eef2f6]">
              {paginatedTransactions.map((transaction) => {
                const isExpense = transaction.type === 'expense'
                const isEditable = isExpense && transaction.source === 'manual'
                const categoryLabel = transaction.categoryId
                  ? financeCategoryMeta[transaction.categoryId].label
                  : transaction.paymentMethod === 'Kasir POS'
                    ? 'Penjualan Toko'
                    : 'Penjualan Pesanan'
                return (
                  <tr
                    key={transaction.id}
                    className="transition hover:bg-[#fbfcfe] [&>td:first-child]:pl-5 [&>td:last-child]:pr-5"
                  >
                    <td className="whitespace-nowrap px-3 py-3">
                      <p className="text-[11px] font-semibold text-ink">
                        {formatTransactionDate(transaction.date)}
                      </p>
                      <p className="mt-0.5 text-[9.5px] text-slate-400">
                        {transaction.time}
                      </p>
                    </td>
                    <td className="whitespace-nowrap px-3 py-3">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[9px] font-semibold ${
                          isExpense
                            ? 'bg-[#fee2e2] text-[#b91c1c]'
                            : 'bg-[#dcfce7] text-[#15803d]'
                        }`}
                      >
                        <span className="size-1.5 rounded-full bg-current" />
                        {isExpense ? 'Pengeluaran' : 'Pemasukan'} &bull;{' '}
                        {transaction.source === 'manual' ? 'Manual' : 'Otomatis'}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-3 py-3">
                      <span className="font-mono text-[9.5px] text-slate-500">
                        {transaction.reference}
                      </span>
                    </td>
                    <td className="max-w-[280px] px-3 py-3">
                      <p className="truncate text-[11px] font-semibold text-ink">
                        {transaction.title}
                      </p>
                      {getTransactionSubline(transaction) ? (
                        <p className="mt-0.5 truncate text-[9.5px] text-slate-400">
                          {getTransactionSubline(transaction)}
                        </p>
                      ) : null}
                    </td>
                    <td className="whitespace-nowrap px-3 py-3">
                      <span className="rounded-md bg-[#f1f5f9] px-2 py-1 text-[9.5px] font-medium text-slate-600">
                        {categoryLabel}
                      </span>
                    </td>
                    <td
                      className={`whitespace-nowrap px-3 py-3 text-right text-[11px] font-bold tabular-nums ${
                        isExpense ? 'text-[#dc2626]' : 'text-[#059669]'
                      }`}
                    >
                      {isExpense ? '-' : '+'} {formatRupiah(transaction.amount)}
                    </td>
                    <td className="whitespace-nowrap px-3 py-3">
                      {isEditable ? (
                        <div className="flex items-center justify-end gap-1">
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
                        <div className="flex justify-end">
                          <span
                            title="Transaksi otomatis dari pesanan selesai"
                            className="flex size-7 items-center justify-center text-slate-300"
                          >
                            <Lock className="size-3.5" />
                          </span>
                        </div>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>

          {filteredTransactions.length === 0 && (
            <div className="flex flex-col items-center justify-center px-5 py-12 text-center">
              <span className="flex size-11 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                <ReceiptText className="size-5" />
              </span>
              <p className="mt-3 text-[12.5px] font-semibold text-ink">
                Belum ada transaksi
              </p>
              <p className="mt-1 max-w-[280px] text-[10.5px] leading-relaxed text-slate-500">
                Catatan pemasukan dan pengeluaran pada periode ini akan muncul di sini.
              </p>
              <button
                type="button"
                onClick={openCreateForm}
                className="mt-3 inline-flex h-8 items-center gap-1.5 rounded-lg bg-primary px-3 text-[10.5px] font-semibold text-white transition hover:bg-primary-hover"
              >
                <Plus className="size-3.5" />
                Tambah Pengeluaran
              </button>
            </div>
          )}
        </div>

        <div className="divide-y divide-[#eef2f6] lg:hidden">
          {paginatedTransactions.map((transaction) => {
            const isExpense = transaction.type === 'expense'
            const isEditable = isExpense && transaction.source === 'manual'
            const categoryLabel = transaction.categoryId
              ? financeCategoryMeta[transaction.categoryId].label
              : transaction.paymentMethod === 'Kasir POS'
                ? 'Penjualan Toko'
                : 'Penjualan Pesanan'
            return (
              <div key={transaction.id} className="px-4 py-3.5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[8.5px] font-semibold ${
                          isExpense
                            ? 'bg-[#fee2e2] text-[#b91c1c]'
                            : 'bg-[#dcfce7] text-[#15803d]'
                        }`}
                      >
                        <span className="size-1.5 rounded-full bg-current" />
                        {isExpense ? 'Pengeluaran' : 'Pemasukan'} &bull;{' '}
                        {transaction.source === 'manual' ? 'Manual' : 'Otomatis'}
                      </span>
                      <span className="text-[9px] text-slate-400">
                        {formatTransactionDate(transaction.date)} &bull;{' '}
                        {transaction.time}
                      </span>
                    </div>
                    <p className="mt-1.5 text-[11.5px] font-semibold text-ink">
                      {transaction.title}
                    </p>
                    {getTransactionSubline(transaction) ? (
                      <p className="mt-0.5 text-[9.5px] text-slate-400">
                        {getTransactionSubline(transaction)}
                      </p>
                    ) : null}
                    <p className="mt-1 text-[9px] text-slate-400">
                      {transaction.reference} &bull; {categoryLabel} &bull;{' '}
                      {transaction.paymentMethod}
                    </p>
                  </div>
                  <p
                    className={`shrink-0 text-[11px] font-bold ${
                      isExpense ? 'text-[#dc2626]' : 'text-[#059669]'
                    }`}
                  >
                    {isExpense ? '-' : '+'} {formatRupiah(transaction.amount)}
                  </p>
                </div>

                {isEditable ? (
                  <div className="mt-1.5 flex justify-end gap-1">
                    <button
                      type="button"
                      onClick={() => handleEdit(transaction)}
                      className="inline-flex h-7 items-center gap-1 rounded-md px-2 text-[9.5px] font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-primary"
                    >
                      <Pencil className="size-3" />
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(transaction)}
                      className="inline-flex h-7 items-center gap-1 rounded-md px-2 text-[9.5px] font-semibold text-slate-500 transition hover:bg-red-50 hover:text-red-500"
                    >
                      <Trash2 className="size-3" />
                      Hapus
                    </button>
                  </div>
                ) : null}
              </div>
            )
          })}

          {filteredTransactions.length === 0 && (
            <div className="flex flex-col items-center justify-center px-4 py-10 text-center">
              <span className="flex size-11 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                <ReceiptText className="size-5" />
              </span>
              <p className="mt-3 text-[12.5px] font-semibold text-ink">
                Belum ada transaksi
              </p>
              <p className="mt-1 max-w-[240px] text-[10.5px] leading-relaxed text-slate-500">
                Catatan pemasukan dan pengeluaran pada periode ini akan muncul di sini.
              </p>
              <button
                type="button"
                onClick={openCreateForm}
                className="mt-3 inline-flex h-8 items-center gap-1.5 rounded-lg bg-primary px-3 text-[10.5px] font-semibold text-white transition hover:bg-primary-hover"
              >
                <Plus className="size-3.5" />
                Tambah Pengeluaran
              </button>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-3 border-t border-line px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <p className="text-[10px] text-slate-500">
            {filteredTransactions.length === 0
              ? 'Tidak ada transaksi untuk ditampilkan'
              : `Menampilkan ${pageStart + 1} – ${Math.min(
                  pageStart + PAGE_SIZE,
                  filteredTransactions.length,
                )} dari ${filteredTransactions.length} transaksi keuangan`}
          </p>

          <div className="flex items-center gap-0.5">
            <button
              type="button"
              onClick={() => setPage(Math.max(1, currentPage - 1))}
              disabled={currentPage <= 1}
              className="inline-flex h-7 items-center gap-1 rounded-lg px-2 text-[10px] font-semibold text-slate-500 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft className="size-3.5" />
              Sebelumnya
            </button>

            {getPageItems(totalPages, currentPage).map((item, index) =>
              item === 'ellipsis' ? (
                <span
                  key={`ellipsis-${index}`}
                  className="flex size-7 items-center justify-center text-[10px] text-slate-400"
                >
                  ...
                </span>
              ) : (
                <button
                  key={item}
                  type="button"
                  onClick={() => setPage(item)}
                  aria-current={item === currentPage ? 'page' : undefined}
                  className={`flex size-7 items-center justify-center rounded-lg text-[10px] font-semibold transition ${
                    item === currentPage
                      ? 'bg-primary text-white'
                      : 'text-slate-500 hover:bg-slate-100'
                  }`}
                >
                  {item}
                </button>
              ),
            )}

            <button
              type="button"
              onClick={() => setPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage >= totalPages}
              className="inline-flex h-7 items-center gap-1 rounded-lg px-2 text-[10px] font-semibold text-slate-500 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Selanjutnya
              <ChevronRight className="size-3.5" />
            </button>
          </div>
        </div>
      </section>

      <section className="mt-4 rounded-2xl border border-[#cfe8df] bg-[#f0faf7] p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white text-primary shadow-sm">
            <ShieldCheck className="size-[18px]" />
          </span>
          <div>
            <h2 className="text-[12.5px] font-bold text-ink">
              Prinsip Pembukuan Finansial Ratis untuk UMKM Indonesia
            </h2>
            <p className="mt-1 max-w-[1050px] text-[10.5px] leading-relaxed text-slate-600">
              Pemasukan tercatat otomatis secara transparan saat status pesanan berubah ke{' '}
              &ldquo;Selesai&rdquo; untuk mencegah kesalahan catat ganda. Pengeluaran
              dicatat berbasis kas riil (cash basis) untuk menjamin akurasi laporan laba
              bersih {session.storeName} saat evaluasi pajak atau pengajuan modal usaha.
            </p>
          </div>
        </div>
      </section>

      {formOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="expense-form-title"
          className="fixed inset-0 z-[70] flex items-end justify-center bg-slate-900/40 backdrop-blur-sm sm:items-center sm:p-4"
        >
          <div className="flex max-h-[94vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl">
            <span aria-hidden className="h-1 w-full shrink-0 bg-[#dc2626]" />
            <div className="flex items-start justify-between gap-3 border-b border-line px-5 py-4">
              <div className="flex items-start gap-3">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-[#fde8e8] text-[#c0392b]">
                  <ReceiptText className="size-5" />
                </span>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2
                      id="expense-form-title"
                      className="text-[17px] font-extrabold tracking-tight text-ink"
                    >
                      {editingId ? 'Ubah Catatan Pengeluaran' : 'Catat Pengeluaran Baru'}
                    </h2>
                    <span className="rounded-full bg-[#fde8e8] px-2 py-0.5 text-[9px] font-semibold text-[#b91c1c]">
                      {editingId ? 'Mode Edit' : 'Beban Operasional'}
                    </span>
                  </div>
                  <p className="mt-1 max-w-[430px] text-[10.5px] leading-relaxed text-slate-500">
                    Catat biaya riil operasional {session.storeName} untuk perhitungan laba
                    bersih otomatis.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setFormOpen(false)
                  resetForm()
                }}
                aria-label="Tutup form"
                className="flex size-8 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="size-4" />
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
              className="flex min-h-0 flex-1 flex-col"
              noValidate
            >
              <div
                ref={formBodyRef}
                className="min-h-0 flex-1 overflow-y-auto px-5 py-4"
              >
                <div className="rounded-2xl bg-[#eff2fb] p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-[11px] font-semibold text-ink">
                      Nominal Biaya Operasional{' '}
                      <span className="text-[#dc2626]">*</span>
                    </span>
                    <span className="inline-flex items-center gap-1 text-[9px] font-medium text-slate-500">
                      <span className="flex size-3 items-center justify-center rounded-full bg-[#dcfce7] text-[#15803d]">
                        <Check className="size-2" />
                      </span>
                      Format Rupiah Otomatis
                    </span>
                  </div>

                  <div className="mt-2 flex items-center gap-2 rounded-xl bg-white px-3.5 py-2.5 shadow-[0_1px_2px_rgba(15,23,42,0.06)]">
                    <span className="text-[20px] font-bold text-[#dc2626]">Rp</span>
                    <input
                      ref={amountRef}
                      type="text"
                      inputMode="numeric"
                      value={amount ? formatNumber(Number(amount)) : ''}
                      onChange={(event) => {
                        const digits = event.target.value.replace(/\D/g, '')
                        setAmount(digits.replace(/^0+(?=\d)/, ''))
                        setQuickAddValue(null)
                        setErrors((current) => ({ ...current, amount: undefined }))
                      }}
                      placeholder="0"
                      aria-label="Nominal biaya operasional"
                      className="min-w-0 flex-1 bg-transparent text-[26px] font-extrabold leading-none tracking-tight text-ink outline-none placeholder:text-slate-300"
                    />
                    <span className="hidden shrink-0 items-center gap-1 rounded-full bg-[#f1f5f9] px-2 py-1 text-[8.5px] font-semibold text-slate-500 sm:inline-flex">
                      <span className="size-1.5 rounded-full bg-[#22c55e]" />
                      WIB &bull; Kas Keluar
                    </span>
                  </div>

                  <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                    <span className="mr-0.5 text-[9px] font-medium text-slate-500">
                      Tambah Cepat:
                    </span>
                    {financeQuickAmounts.map((value) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => handleQuickAmount(value)}
                        className={`rounded-full border px-2 py-1 text-[9px] font-semibold transition ${
                          quickAddValue === value
                            ? 'border-[#a7e8d2] bg-[#dcfce7] text-[#15803d]'
                            : 'border-line bg-white text-slate-600 hover:border-primary/30 hover:text-primary'
                        }`}
                      >
                        + {formatRupiah(value)}
                      </button>
                    ))}
                  </div>
                  {errors.amount && (
                    <p className="mt-1.5 text-[9.5px] text-red-600">{errors.amount}</p>
                  )}
                </div>

                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <label className="block">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="text-[11px] font-semibold text-ink">
                        Tanggal Pengeluaran <span className="text-[#dc2626]">*</span>
                      </span>
                      <span className="text-[8.5px] font-medium text-slate-400">
                        Basis Kas
                      </span>
                    </div>
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
                        className={`h-10 w-full appearance-none rounded-xl border bg-[#f7f9fc] pl-9 pr-3 text-[11px] text-ink outline-none transition focus:bg-white focus:ring-4 ${
                          errors.date
                            ? 'border-red-300 focus:border-red-400 focus:ring-red-100'
                            : 'border-line focus:border-primary focus:ring-primary/10'
                        }`}
                      />
                      <CalendarDays className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-slate-400" />
                    </span>
                    <span
                      className={`mt-1.5 flex items-start gap-1 text-[9px] leading-relaxed ${
                        errors.date ? 'text-red-600' : 'text-slate-400'
                      }`}
                    >
                      <Info className="mt-0.5 size-3 shrink-0" />
                      {errors.date ??
                        'Tanggal masa depan dibatasi sesuai ketetapan hari ini.'}
                    </span>
                  </label>

                  <label className="block">
                    <span className="text-[11px] font-semibold text-ink">
                      Dibayar Menggunakan <span className="text-[#dc2626]">*</span>
                    </span>
                    <span className="relative mt-1.5 block">
                      <select
                        value={paymentMethodId}
                        onChange={(event) =>
                          setPaymentMethodId(
                            event.target.value as FinancePaymentMethodId,
                          )
                        }
                        className="h-10 w-full appearance-none rounded-xl border border-line bg-[#f7f9fc] pl-3 pr-9 text-[11px] text-ink outline-none transition focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10"
                      >
                        <option value="kas">
                          Kas Tunai Laci Toko (Saldo: {formatRupiah(liquidityKas)})
                        </option>
                        <option value="transfer">
                          BCA Usaha (Saldo: {formatRupiah(liquidityBank)})
                        </option>
                        <option value="qris">QRIS / E-Wallet</option>
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-3.5 -translate-y-1/2 text-slate-400" />
                    </span>
                    <span className="mt-1.5 flex items-start gap-1 text-[9px] leading-relaxed text-[#15803d]">
                      <Check className="mt-0.5 size-3 shrink-0" />
                      {paymentMethodId === 'qris'
                        ? 'Saldo e-wallet mengikuti pencatatan kasir.'
                        : 'Saldo rekening mencukupi untuk biaya ini.'}
                    </span>
                  </label>
                </div>

                <div className="mt-4">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-semibold text-ink">
                      Kategori Beban Operasional{' '}
                      <span className="text-[#dc2626]">*</span>
                    </span>
                    <span className="text-[9px] font-semibold text-primary">
                      Alokasi HPP Dapur
                    </span>
                  </div>

                  <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {financeCategoryCards.map(
                      ({ id, title, description, icon: Icon }) => {
                        const isActive = categoryId === id
                        return (
                          <button
                            key={id}
                            type="button"
                            onClick={() => {
                              setCategoryId(id)
                              setErrors((current) => ({
                                ...current,
                                category: undefined,
                              }))
                            }}
                            aria-pressed={isActive}
                            className={`relative flex min-h-[72px] flex-col items-start rounded-xl border p-2.5 pr-6 text-left transition ${
                              isActive
                                ? 'border-primary/50 bg-[#eafaf4] shadow-[0_1px_2px_rgba(15,118,110,0.08)]'
                                : 'border-[#e6eaf2] bg-[#f8fafc] hover:border-primary/25 hover:bg-white'
                            }`}
                          >
                            <Icon
                              className={`size-4 ${
                                isActive ? 'text-primary' : 'text-slate-400'
                              }`}
                            />
                            <span className="mt-1.5 text-[10px] font-bold leading-tight text-ink">
                              {title}
                            </span>
                            <span className="mt-0.5 text-[8.5px] leading-snug text-slate-400">
                              {description}
                            </span>
                            <span
                              className={`absolute right-2 top-2 flex size-4 items-center justify-center rounded-full border ${
                                isActive
                                  ? 'border-primary bg-primary text-white'
                                  : 'border-slate-300 bg-white'
                              }`}
                            >
                              {isActive ? <Check className="size-2.5" /> : null}
                            </span>
                          </button>
                        )
                      },
                    )}
                  </div>

                  {errors.category && (
                    <p className="mt-1.5 text-[9.5px] text-red-600">{errors.category}</p>
                  )}
                </div>

                <label className="mt-4 block">
                  <span className="text-[11px] font-semibold text-ink">
                    Deskripsi / Keterangan Pembelian{' '}
                    <span className="text-[#dc2626]">*</span>
                  </span>
                  <textarea
                    value={description}
                    maxLength={150}
                    onChange={(event) => {
                      setDescription(event.target.value)
                      setErrors((current) => ({ ...current, description: undefined }))
                    }}
                    placeholder="Contoh: Beli Mentega Wijsman 2 Kaleng (2kg) & Tepung Terigu Segitiga Biru 1 Karung"
                    rows={2}
                    className={`mt-1.5 w-full resize-none rounded-xl border bg-[#f7f9fc] px-3 py-2.5 text-[12px] leading-relaxed text-ink outline-none transition placeholder:text-slate-400 focus:bg-white focus:ring-4 ${
                      errors.description
                        ? 'border-red-300 focus:border-red-400 focus:ring-red-100'
                        : 'border-line focus:border-primary focus:ring-primary/10'
                    }`}
                  />
                  <span
                    className={`mt-1 flex items-start justify-between gap-3 text-[9px] leading-relaxed ${
                      errors.description ? 'text-red-600' : 'text-slate-400'
                    }`}
                  >
                    <span>
                      {errors.description ??
                        'Cantumkan rincian barang, kuantitas, dan nama toko tempat belanja.'}
                    </span>
                    <span className="shrink-0">
                      {description.length}/150 karakter
                    </span>
                  </span>
                </label>

                <div className="mt-3.5 grid gap-3 sm:grid-cols-2">
                  <label className="block">
                    <span className="text-[11px] font-semibold text-ink">
                      Nama Vendor / Toko Rekanan{' '}
                      <span className="text-[9px] font-normal text-slate-400">
                        (Opsional)
                      </span>
                    </span>
                    <span className="relative mt-1.5 block">
                      <Store className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        value={vendor}
                        maxLength={80}
                        onChange={(event) => setVendor(event.target.value)}
                        placeholder="Contoh: Toko Bahan Kue Wahab"
                        className="h-10 w-full rounded-xl border border-line bg-[#f7f9fc] pl-9 pr-3 text-[11px] text-ink outline-none transition placeholder:text-slate-400 focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10"
                      />
                    </span>
                  </label>

                  <label className="block">
                    <span className="text-[11px] font-semibold text-ink">
                      No. Faktur Toko{' '}
                      <span className="text-[9px] font-normal text-slate-400">
                        (Opsional)
                      </span>
                    </span>
                    <input
                      type="text"
                      value={invoiceNumber}
                      maxLength={40}
                      onChange={(event) => setInvoiceNumber(event.target.value)}
                      placeholder="Contoh: WB-8941"
                      className="mt-1.5 h-10 w-full rounded-xl border border-line bg-[#f7f9fc] px-3 text-[11px] text-ink outline-none transition placeholder:text-slate-400 focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10"
                    />
                  </label>
                </div>

                <div className="mt-3.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-semibold text-ink">
                      Lampiran Nota / Bukti Struk Fisik{' '}
                      <span className="text-[9px] font-normal text-slate-400">
                        (Opsional)
                      </span>
                    </span>
                    <label
                      htmlFor="expense-attachment"
                      className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-lg border border-line bg-white px-2.5 text-[9.5px] font-semibold text-slate-600 transition hover:border-primary/30 hover:text-primary"
                    >
                      <Camera className="size-3.5" />
                      Foto/PDF
                    </label>
                  </div>

                  <div
                    onDragOver={(event) => {
                      event.preventDefault()
                      setDragActive(true)
                    }}
                    onDragLeave={() => setDragActive(false)}
                    onDrop={handleDrop}
                    className={`mt-1.5 rounded-xl border border-dashed p-3 transition ${
                      dragActive
                        ? 'border-primary bg-primary-soft/30'
                        : errors.attachment
                          ? 'border-red-300 bg-red-50/40'
                          : 'border-[#cbd5e1] bg-[#f8fafc]'
                    }`}
                  >
                    {attachment ? (
                      <div className="flex items-center gap-2.5">
                        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-white text-primary shadow-sm">
                          <FileText className="size-4" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[10.5px] font-semibold text-ink">
                            {attachment.name}
                          </p>
                          <p className="mt-0.5 text-[9px] text-slate-500">
                            {formatFileSize(attachment.size)} &bull; Terlampir
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={clearAttachment}
                          aria-label="Hapus lampiran"
                          className="flex size-7 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-white hover:text-red-500"
                        >
                          <X className="size-3.5" />
                        </button>
                      </div>
                    ) : (
                      <label
                        htmlFor="expense-attachment"
                        className="block cursor-pointer text-center text-[9px] leading-relaxed text-slate-400"
                      >
                        Seret file ke sini atau klik Foto/PDF. Format JPG, PNG, atau PDF
                        (maks. 2 MB).
                      </label>
                    )}
                    <input
                      ref={fileInputRef}
                      id="expense-attachment"
                      type="file"
                      accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf"
                      onChange={handleAttachmentChange}
                      className="sr-only"
                    />
                  </div>
                  {errors.attachment && (
                    <p className="mt-1 text-[9.5px] text-red-600">{errors.attachment}</p>
                  )}
                </div>
              </div>

              <div className="flex flex-col-reverse gap-2 border-t border-line px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between">
                <button
                  type="button"
                  onClick={() => {
                    setFormOpen(false)
                    resetForm()
                  }}
                  className="inline-flex h-9 items-center justify-center px-1 text-[11px] font-semibold text-slate-500 transition hover:text-ink sm:justify-start"
                >
                  Batal
                </button>
                <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center">
                  {!editingId && (
                    <button
                      type="button"
                      onClick={() => void saveExpense(true)}
                      disabled={saving}
                      className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-line bg-white px-3.5 text-[10.5px] font-semibold text-slate-700 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition hover:border-primary/30 hover:text-primary disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <Plus className="size-3.5" />
                      Simpan &amp; Catat Lainnya
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex h-9 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-[11px] font-semibold text-white shadow-sm transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-70"
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
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-expense-title"
          className="fixed inset-0 z-[80] flex items-end justify-center bg-slate-900/40 backdrop-blur-sm sm:items-center sm:p-4"
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
              &ldquo;{deleteTarget.title}&rdquo; sebesar{' '}
              <span className="font-semibold text-ink">
                {formatRupiah(deleteTarget.amount)}
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
          className={`fixed bottom-20 right-4 z-[90] max-w-[320px] rounded-xl px-4 py-3 text-sm font-medium shadow-lg lg:bottom-6 ${
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
