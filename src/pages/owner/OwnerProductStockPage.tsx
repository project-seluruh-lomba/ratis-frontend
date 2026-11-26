import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
  type ReactNode,
} from 'react'
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import {
  ArrowUpFromLine,
  BadgeCheck,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleSlash,
  ClipboardCheck,
  Download,
  Info,
  MoreVertical,
  Package,
  PackageCheck,
  Pencil,
  Plus,
  Search,
  Star,
  Trash2,
  TriangleAlert,
  X,
} from 'lucide-react'
import StockAdjustModal from '../../components/owner/StockAdjustModal'
import { getOwnerSession } from '../../lib/owner-auth'
import {
  addOwnerProduct,
  getOwnerProducts,
  getProductStockStatus,
  productCategories,
  stockStatusMeta,
  updateOwnerProduct,
  type OwnerProduct,
} from '../../lib/owner-product-data'

type ChipKey = 'semua' | 'aktif' | 'menipis' | 'habis' | 'nonaktif'
type ToastTone = 'success' | 'info' | 'danger'

type Toast = { message: string; tone: ToastTone }

type ProductFormValues = {
  name: string
  category: string
  price: string
  stock: string
  minStock: string
  stockUnit: string
  detail: string
}

type ProductFormErrors = Partial<Record<keyof ProductFormValues, string>>

const numberFormatter = new Intl.NumberFormat('id-ID')

const chipOrder: ChipKey[] = ['semua', 'aktif', 'menipis', 'habis', 'nonaktif']

const chipLabels: Record<ChipKey, string> = {
  semua: 'Semua',
  aktif: 'Aktif',
  menipis: 'Stok Menipis',
  habis: 'Stok Habis',
  nonaktif: 'Nonaktif',
}

const chipActiveClassName: Record<ChipKey, string> = {
  semua: 'border-primary/30 bg-primary-soft/70 text-primary',
  aktif: 'border-primary/30 bg-primary-soft/70 text-primary',
  menipis: 'border-[#f3cf8c] bg-[#fdf0d3] text-[#b45309]',
  habis: 'border-[#f5c2c2] bg-[#fde7e7] text-[#dc2626]',
  nonaktif: 'border-slate-300 bg-slate-100 text-slate-600',
}

const categoryTiles: Record<string, string> = {
  'Kue Basah & Tradisional': 'bg-[#fdf0d9] text-[#a16207]',
  'Pastry & Roti': 'bg-[#ffe4e6] text-[#9f1239]',
  'Hampers & Paket': 'bg-[#e6e9fd] text-[#3730a3]',
}

function formatNumber(value: number) {
  return numberFormatter.format(value)
}

function formatRupiah(value: number) {
  return `Rp${formatNumber(value)}`
}

function getInitials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join('')
}

function escapeCsv(value: string) {
  if (value.includes(';') || value.includes('"') || value.includes('\n')) {
    return `"${value.replaceAll('"', '""')}"`
  }
  return value
}

function getStockPercent(product: OwnerProduct) {
  const ceiling = Math.max(product.minStock * 4, 1)
  return Math.min(100, Math.round((product.stock / ceiling) * 100))
}

function etalaseMeta(product: OwnerProduct) {
  const status = getProductStockStatus(product)
  if (product.etalase === 'nonaktif') {
    return { label: 'Nonaktif', className: 'bg-slate-100 text-slate-600', dot: 'bg-slate-400' }
  }
  if (status === 'habis') {
    return { label: 'Tampil Habis', className: 'bg-slate-100 text-slate-600', dot: 'bg-slate-400' }
  }
  return { label: 'Aktif', className: 'bg-[#d9f7ea] text-primary', dot: 'bg-primary' }
}

function ModalShell({
  title,
  subtitle,
  onClose,
  children,
  footer,
  wide = false,
}: {
  title: string
  subtitle?: string
  onClose: () => void
  children: ReactNode
  footer?: ReactNode
  wide?: boolean
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />
      <div
        role="dialog"
        aria-modal="true"
        className={`relative z-10 max-h-[92vh] w-full overflow-y-auto rounded-t-3xl bg-white p-5 shadow-2xl sm:rounded-2xl sm:p-6 ${
          wide ? 'sm:max-w-2xl' : 'sm:max-w-lg'
        }`}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 className="text-[17px] font-extrabold tracking-tight text-ink">{title}</h2>
            {subtitle && (
              <p className="mt-1 text-[11.5px] leading-relaxed text-slate-500">{subtitle}</p>
            )}
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
        <div className="mt-4">{children}</div>
        {footer && <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">{footer}</div>}
      </div>
    </div>
  )
}

function FieldLabel({ children, required }: { children: ReactNode; required?: boolean }) {
  return (
    <span className="text-[12px] font-semibold text-ink">
      {children}
      {required && <span className="text-[#dc2626]"> *</span>}
    </span>
  )
}

function TextField({
  label,
  value,
  onChange,
  error,
  hint,
  required,
  type = 'text',
  inputMode,
  disabled,
  placeholder,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  error?: string
  hint?: string
  required?: boolean
  type?: string
  inputMode?: 'numeric' | 'text'
  disabled?: boolean
  placeholder?: string
}) {
  return (
    <label className="block">
      <FieldLabel required={required}>{label}</FieldLabel>
      <input
        type={type}
        inputMode={inputMode}
        value={value}
        disabled={disabled}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className={`mt-1.5 h-11 w-full rounded-xl border bg-[#f7f9fc] px-3.5 text-[12px] text-ink outline-none transition placeholder:text-slate-400 focus:bg-white focus:ring-4 disabled:cursor-not-allowed disabled:text-slate-400 ${
          error
            ? 'border-red-300 focus:border-red-400 focus:ring-red-100'
            : 'border-line focus:border-primary focus:ring-primary/10'
        }`}
      />
      <span
        className={`mt-1.5 block text-[10px] ${error ? 'text-red-600' : 'text-slate-400'}`}
      >
        {error ?? hint}
      </span>
    </label>
  )
}

export default function OwnerProductStockPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [session] = useState(getOwnerSession)
  const [products, setProducts] = useState<OwnerProduct[]>(getOwnerProducts)
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('semua')
  const [etalase, setEtalase] = useState('semua')
  const [chip, setChip] = useState<ChipKey>('semua')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [selected, setSelected] = useState<string[]>([])
  const [actionTarget, setActionTarget] = useState<OwnerProduct | null>(null)
  const [stockTarget, setStockTarget] = useState<OwnerProduct | null>(null)
  const [formState, setFormState] = useState<{ product: OwnerProduct | null } | null>(() => {
    const editId = searchParams.get('edit')
    if (!editId) return null
    const target = getOwnerProducts().find((item) => item.id === editId)
    return target ? { product: target } : null
  })
  const [deleteTarget, setDeleteTarget] = useState<OwnerProduct | null>(null)
  const [toast, setToast] = useState<Toast | null>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => setToast(null), 4000)
    return () => window.clearTimeout(timer)
  }, [toast])

  useEffect(() => {
    function handleShortcut(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        searchRef.current?.focus()
      }
    }
    window.addEventListener('keydown', handleShortcut)
    return () => window.removeEventListener('keydown', handleShortcut)
  }, [])

  const counts = useMemo(() => {
    const result: Record<ChipKey, number> = {
      semua: products.length,
      aktif: 0,
      menipis: 0,
      habis: 0,
      nonaktif: 0,
    }
    for (const product of products) {
      const status = getProductStockStatus(product)
      if (product.etalase === 'aktif') result.aktif += 1
      if (product.etalase === 'nonaktif') result.nonaktif += 1
      if (status === 'menipis') result.menipis += 1
      if (status === 'habis') result.habis += 1
    }
    return result
  }, [products])

  const lowStockProducts = useMemo(
    () => products.filter((product) => getProductStockStatus(product) !== 'aman'),
    [products],
  )

  const filteredProducts = useMemo(() => {
    const keyword = query.trim().toLowerCase()
    return products.filter((product) => {
      const status = getProductStockStatus(product)
      if (chip === 'aktif' && product.etalase !== 'aktif') return false
      if (chip === 'nonaktif' && product.etalase !== 'nonaktif') return false
      if (chip === 'menipis' && status !== 'menipis') return false
      if (chip === 'habis' && status !== 'habis') return false
      if (category !== 'semua' && product.category !== category) return false
      if (etalase !== 'semua' && product.etalase !== etalase) return false
      if (
        keyword &&
        !`${product.name} ${product.sku} ${product.category}`.toLowerCase().includes(keyword)
      ) {
        return false
      }
      return true
    })
  }, [category, chip, etalase, products, query])

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const pageStart = (currentPage - 1) * pageSize
  const pageItems = filteredProducts.slice(pageStart, pageStart + pageSize)
  const pageIds = pageItems.map((product) => product.id)
  const allPageSelected = pageIds.length > 0 && pageIds.every((id) => selected.includes(id))

  if (!session) {
    return <Navigate to="/" replace />
  }

  function showToast(message: string, tone: ToastTone = 'success') {
    setToast({ message, tone })
  }

  function resetPage() {
    setPage(1)
  }

  function closeForm() {
    setFormState(null)
    if (searchParams.has('edit')) {
      const next = new URLSearchParams(searchParams)
      next.delete('edit')
      setSearchParams(next, { replace: true })
    }
  }

  function toggleProduct(id: string) {
    setSelected((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    )
  }

  function togglePage() {
    setSelected((current) => {
      if (allPageSelected) return current.filter((id) => !pageIds.includes(id))
      return Array.from(new Set([...current, ...pageIds]))
    })
  }

  function setEtalaseStatus(ids: string[], status: OwnerProduct['etalase']) {
    setProducts((current) =>
      current.map((product) =>
        ids.includes(product.id) ? { ...product, etalase: status } : product,
      ),
    )
    setSelected([])
    showToast(
      status === 'aktif'
        ? `${ids.length} produk diaktifkan di etalase.`
        : `${ids.length} produk dinonaktifkan dari etalase.`,
      'info',
    )
  }

  function adjustStock(product: OwnerProduct, delta: number, reason: string) {
    const nextProduct = { ...product, stock: Math.max(0, product.stock + delta) }
    updateOwnerProduct(nextProduct)
    setProducts((current) =>
      current.map((item) => (item.id === nextProduct.id ? nextProduct : item)),
    )
    const sign = delta > 0 ? '+' : ''
    showToast(
      `Stok ${product.name} diperbarui ${sign}${delta} ${product.stockUnit} (${reason.toLowerCase()}).`,
    )
  }

  function handleSaveProduct(values: ProductFormValues, product: OwnerProduct | null) {
    const price = Number(values.price)
    const stock = Number(values.stock)
    const minStock = Number(values.minStock)

    if (product) {
      const edited: OwnerProduct = {
        ...product,
        name: values.name.trim(),
        category: values.category,
        price,
        detail: values.detail.trim(),
        minStock,
        stockUnit: values.stockUnit.trim() || product.stockUnit,
      }
      updateOwnerProduct(edited)
      setProducts((current) => current.map((item) => (item.id === edited.id ? edited : item)))
      showToast('Perubahan produk berhasil disimpan.')
    } else {
      const nextProduct: OwnerProduct = {
        id: `prd-${Date.now()}`,
        name: values.name.trim(),
        sku: `SKU-${String(Date.now()).slice(-6)}`,
        category: values.category,
        price,
        detail: values.detail.trim() || 'per pcs',
        stock,
        stockUnit: values.stockUnit.trim() || 'pcs',
        minStock,
        sold: 0,
        soldUnit: values.stockUnit.trim() || 'pcs',
        soldPeriod: 'belum ada',
        etalase: 'aktif',
      }
      addOwnerProduct(nextProduct)
      setProducts((current) => [nextProduct, ...current])
      showToast('Produk baru berhasil ditambahkan ke katalog.')
    }

    setFormState(null)
    resetPage()
  }

  function handleDelete() {
    if (!deleteTarget) return
    setProducts((current) => current.filter((item) => item.id !== deleteTarget.id))
    setSelected((current) => current.filter((id) => id !== deleteTarget.id))
    setDeleteTarget(null)
    showToast('Produk dihapus dari katalog.')
  }

  function handleExport() {
    if (filteredProducts.length === 0) {
      showToast('Tidak ada produk untuk diekspor.', 'info')
      return
    }

    const header = [
      'Nama Produk',
      'SKU',
      'Kategori',
      'Harga Jual',
      'Stok',
      'Satuan',
      'Stok Minimal',
      'Status Stok',
      'Status Etalase',
      'Terjual',
    ]
    const rows = filteredProducts.map((product) => [
      product.name,
      product.sku,
      product.category,
      String(product.price),
      String(product.stock),
      product.stockUnit,
      String(product.minStock),
      stockStatusMeta[getProductStockStatus(product)].label,
      product.etalase === 'aktif' ? 'Aktif' : 'Nonaktif',
      `${product.sold} ${product.soldUnit}`,
    ])
    const csv = [header, ...rows].map((row) => row.map(escapeCsv).join(';')).join('\r\n')
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `produk-stok-${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(anchor)
    anchor.click()
    anchor.remove()
    URL.revokeObjectURL(url)
    showToast('Data produk berhasil diekspor.')
  }

  const criticalProduct =
    lowStockProducts.find((product) => getProductStockStatus(product) === 'habis') ??
    lowStockProducts[0]

  const amanCount = products.length - counts.menipis - counts.habis
  const kpiCards = [
    {
      label: 'Total Produk Katalog',
      value: String(products.length),
      note: `${counts.aktif} produk tayang di etalase`,
      tone: 'text-ink',
      iconTile: 'bg-[#eef2ff] text-[#4f46e5]',
      icon: Package,
    },
    {
      label: 'Stok Aman',
      value: String(amanCount),
      note: 'Stok di atas batas minimal',
      tone: 'text-ink',
      iconTile: 'bg-[#dcf7ee] text-primary',
      icon: PackageCheck,
    },
    {
      label: 'Stok Menipis',
      value: String(counts.menipis),
      note: 'Perlu restock dapur',
      tone: 'text-[#b45309]',
      iconTile: 'bg-[#fdf0d3] text-[#d97706]',
      icon: TriangleAlert,
    },
    {
      label: 'Stok Habis',
      value: String(counts.habis),
      note: 'Otomatis ditandai etalase',
      tone: 'text-[#dc2626]',
      iconTile: 'bg-[#fde7e7] text-[#dc2626]',
      icon: CircleSlash,
    },
  ]

  return (
    <div>
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="max-w-[650px]">
          <h1 className="text-[26px] font-extrabold tracking-tight text-ink sm:text-[28px]">
            Produk &amp; Stok
          </h1>
          <p className="mt-1 max-w-[620px] text-[13px] leading-relaxed text-slate-500">
            Kelola katalog produk, pantau ketersediaan stok fisik gudang, dan atur status
            etalase toko Anda secara akurat &amp; real-time.
          </p>
        </div>

        <div className="flex w-full flex-col gap-2.5 sm:flex-row xl:w-auto">
          <button
            type="button"
            onClick={handleExport}
            className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-line bg-white px-4 text-[11.5px] font-semibold text-slate-700 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition hover:bg-slate-50 sm:flex-none"
          >
            <Download className="size-4 text-slate-500" />
            Ekspor CSV
          </button>
          <button
            type="button"
            onClick={() => navigate('/owner/produk/baru')}
            className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-[11.5px] font-semibold text-white shadow-sm transition hover:bg-primary-hover sm:flex-none"
          >
            <Plus className="size-4" />
            Tambah Produk Baru
          </button>
        </div>
      </div>

      <div className="mt-5 grid gap-3.5 sm:grid-cols-2 xl:grid-cols-4">
        {kpiCards.map(({ label, value, note, tone, iconTile, icon: Icon }) => (
          <section
            key={label}
            className="rounded-2xl border border-line bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.06)]"
          >
            <div className="flex items-start justify-between gap-3">
              <p className="text-[11.5px] font-semibold text-slate-600">{label}</p>
              <span className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${iconTile}`}>
                <Icon className="size-[18px]" />
              </span>
            </div>
            <p className={`mt-2 text-[32px] font-extrabold leading-none tracking-tight ${tone}`}>
              {value}
            </p>
            <p className="mt-3 flex items-center gap-1.5 border-t border-[#eef2f6] pt-2.5 text-[10.5px] text-slate-500">
              <span className="size-1.5 shrink-0 rounded-full bg-slate-300" />
              {note}
            </p>
          </section>
        ))}
      </div>

      <section className="mt-4 rounded-2xl border border-line bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.06)]">
        <div className="flex flex-col gap-2.5 lg:flex-row lg:items-center">
          <div className="relative w-full lg:max-w-[420px]">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <input
              ref={searchRef}
              type="search"
              value={query}
              onChange={(event: ChangeEvent<HTMLInputElement>) => {
                setQuery(event.target.value)
                resetPage()
              }}
              placeholder="Cari nama produk, SKU, atau kategori..."
              className="h-11 w-full rounded-xl border border-line bg-[#f7f9fc] pl-10 pr-14 text-[12px] text-ink outline-none transition placeholder:text-slate-400 focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10"
            />
            <span className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 rounded border border-line bg-white px-1.5 py-0.5 text-[9px] font-semibold text-slate-400 sm:block">
              ⌘K
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2.5 lg:flex lg:flex-1 lg:items-center">
            <label className="relative block">
              <span className="sr-only">Filter kategori</span>
              <select
                value={category}
                onChange={(event) => {
                  setCategory(event.target.value)
                  resetPage()
                }}
                className="h-11 w-full appearance-none rounded-xl border border-line bg-[#f7f9fc] px-3.5 pr-9 text-[11.5px] font-medium text-ink outline-none transition focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10"
              >
                <option value="semua">Semua Kategori</option>
                {productCategories.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            </label>

            <label className="relative block">
              <span className="sr-only">Filter status etalase</span>
              <select
                value={etalase}
                onChange={(event) => {
                  setEtalase(event.target.value)
                  resetPage()
                }}
                className="h-11 w-full appearance-none rounded-xl border border-line bg-[#f7f9fc] px-3.5 pr-9 text-[11.5px] font-medium text-ink outline-none transition focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10"
              >
                <option value="semua">Semua Status Etalase</option>
                <option value="aktif">Aktif</option>
                <option value="nonaktif">Nonaktif</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            </label>

          </div>
        </div>

        <div className="mt-3 flex flex-col gap-3 border-t border-[#eef2f6] pt-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-2">
            {chipOrder.map((key) => {
              const isActive = chip === key
              const count = counts[key]
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => {
                    setChip(key)
                    resetPage()
                  }}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-semibold transition ${
                    isActive
                      ? chipActiveClassName[key]
                      : 'border-line bg-white text-slate-600 hover:border-slate-300 hover:text-ink'
                  }`}
                >
                  {chipLabels[key]}
                  <span
                    className={`rounded-full px-1.5 py-0.5 text-[9.5px] font-bold ${
                      isActive ? 'bg-white/70' : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              )
            })}
          </div>
          <p className="text-[11px] text-slate-500">
            Menampilkan {filteredProducts.length} dari {products.length} produk
          </p>
        </div>
      </section>

      <section className="mt-4 overflow-hidden rounded-2xl border border-line bg-white shadow-[0_1px_2px_rgba(15,23,42,0.06)]">
        {selected.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 border-b border-line bg-[#eaf7f4] px-4 py-2.5">
            <p className="text-[11.5px] font-semibold text-primary">
              {selected.length} produk dipilih
            </p>
            <div className="ml-auto flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setEtalaseStatus(selected, 'aktif')}
                className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-white px-2.5 text-[10.5px] font-semibold text-primary shadow-sm transition hover:bg-slate-50"
              >
                <BadgeCheck className="size-3.5" />
                Aktifkan Etalase
              </button>
              <button
                type="button"
                onClick={() => setEtalaseStatus(selected, 'nonaktif')}
                className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-white px-2.5 text-[10.5px] font-semibold text-slate-600 shadow-sm transition hover:bg-slate-50"
              >
                <CircleSlash className="size-3.5" />
                Nonaktifkan
              </button>
              <button
                type="button"
                onClick={() => setSelected([])}
                className="inline-flex h-8 items-center rounded-lg px-2 text-[10.5px] font-semibold text-slate-500 transition hover:text-ink"
              >
                Batalkan
              </button>
            </div>
          </div>
        )}

        {pageItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
            <span className="flex size-14 items-center justify-center rounded-2xl bg-primary-soft/50 text-primary">
              <Package className="size-6" />
            </span>
            <h2 className="mt-4 text-[16px] font-extrabold text-ink">Belum ada produk</h2>
            <p className="mt-1 max-w-sm text-[11.5px] leading-relaxed text-slate-500">
              Tidak ada produk yang cocok dengan filter saat ini. Ubah kata kunci atau tambahkan
              produk baru ke katalog.
            </p>
            <button
              type="button"
              onClick={() => navigate('/owner/produk/baru')}
              className="mt-4 inline-flex h-9 items-center gap-2 rounded-xl bg-primary px-3.5 text-[11.5px] font-semibold text-white transition hover:bg-primary-hover"
            >
              <Plus className="size-4" />
              Tambah Produk
            </button>
          </div>
        ) : (
          <>
            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full min-w-[940px] border-collapse">
                <thead>
                  <tr className="bg-[#f4f7fb] text-left text-[10px] font-semibold uppercase tracking-[0.06em] text-slate-500">
                    <th className="w-12 px-4 py-3">
                      <input
                        type="checkbox"
                        checked={allPageSelected}
                        onChange={togglePage}
                        aria-label="Pilih semua produk pada halaman ini"
                        className="size-4 rounded border-slate-300 accent-[#0f766e]"
                      />
                    </th>
                    <th className="px-3 py-3">Info Produk</th>
                    <th className="w-[130px] px-3 py-3">Harga Jual</th>
                    <th className="w-[210px] px-3 py-3">Stok Tersedia &amp; Status</th>
                    <th className="w-[120px] px-3 py-3">Status Etalase</th>
                    <th className="w-[110px] px-3 py-3">Terjual</th>
                    <th className="w-14 px-3 py-3">
                      <span className="sr-only">Aksi</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {pageItems.map((product) => {
                    const status = getProductStockStatus(product)
                    const meta = stockStatusMeta[status]
                    const etalaseInfo = etalaseMeta(product)
                    const isSelected = selected.includes(product.id)
                    return (
                      <tr
                        key={product.id}
                        onClick={() => navigate(`/owner/produk/${product.id}`)}
                        className={`cursor-pointer border-t border-[#eef2f6] transition hover:bg-slate-50/70 ${
                          isSelected ? 'bg-[#f4fbf9]' : ''
                        }`}
                      >
                        <td
                          className="px-4 py-3.5 align-top"
                          onClick={(event) => event.stopPropagation()}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleProduct(product.id)}
                            aria-label={`Pilih ${product.name}`}
                            className="mt-1 size-4 rounded border-slate-300 accent-[#0f766e]"
                          />
                        </td>
                        <td className="px-3 py-3.5">
                          <div className="flex items-start gap-3">
                            <span
                              className={`flex size-12 shrink-0 items-center justify-center rounded-xl text-[12px] font-extrabold ${
                                categoryTiles[product.category] ?? 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              {getInitials(product.name)}
                            </span>
                            <div className="min-w-0">
                              <p className="flex items-center gap-1.5 text-[12.5px] font-bold text-ink">
                                <span className="truncate">{product.name}</span>
                                {product.favorite && (
                                  <Star className="size-3.5 shrink-0 fill-[#f0a52b] text-[#f0a52b]" />
                                )}
                              </p>
                              <p className="mt-0.5 flex flex-wrap items-center gap-x-1.5 text-[10.5px] text-slate-500">
                                <span>SKU: {product.sku}</span>
                                <span className="text-slate-300">•</span>
                                <span>{product.category}</span>
                              </p>
                              <div className="mt-1 flex flex-wrap gap-1.5">
                                {product.favorite && (
                                  <span className="rounded-full bg-[#fdf0d3] px-2 py-0.5 text-[9px] font-semibold text-[#b45309]">
                                    Favorit pelanggan
                                  </span>
                                )}
                                {product.seasonal && (
                                  <span className="rounded-full bg-[#e8ecfd] px-2 py-0.5 text-[9px] font-semibold text-[#4338ca]">
                                    Seasonal
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-3.5 align-top">
                          <p className="text-[13px] font-bold text-ink">
                            {formatRupiah(product.price)}
                          </p>
                          <p className="mt-0.5 text-[10.5px] text-slate-500">{product.detail}</p>
                        </td>
                        <td className="px-3 py-3.5 align-top">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-[12px] font-bold">
                              <span
                                className={
                                  status === 'habis'
                                    ? 'text-[#dc2626]'
                                    : status === 'menipis'
                                      ? 'text-[#d97706]'
                                      : 'text-ink'
                                }
                              >
                                {product.stock} {product.stockUnit}
                              </span>
                            </p>
                            <span
                              className={`rounded-full px-2 py-0.5 text-[9.5px] font-semibold ${meta.className}`}
                            >
                              {meta.label}
                            </span>
                          </div>
                          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-[#eef2f6]">
                            <div
                              className={`h-full rounded-full ${meta.barClassName}`}
                              style={{ width: `${Math.max(getStockPercent(product), 3)}%` }}
                            />
                          </div>
                          <div className="mt-1.5 flex items-center justify-between gap-2">
                            <p className="text-[9.5px] text-slate-500">
                              Min. stok aman: {product.minStock} {product.stockUnit}
                            </p>
                            {status !== 'aman' && (
                              <button
                                type="button"
                                onClick={(event) => {
                                  event.stopPropagation()
                                  setStockTarget(product)
                                }}
                                className={`text-[9.5px] font-semibold transition hover:underline ${
                                  status === 'habis' || status === 'menipis'
                                    ? 'text-[#dc2626]'
                                    : 'text-primary'
                                }`}
                              >
                                Input restock
                              </button>
                            )}
                          </div>
                        </td>
                        <td className="px-3 py-3.5 align-top">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold ${etalaseInfo.className}`}
                          >
                            <span className={`size-1.5 rounded-full ${etalaseInfo.dot}`} />
                            {etalaseInfo.label}
                          </span>
                        </td>
                        <td className="px-3 py-3.5 align-top">
                          <p className="text-[12px] font-semibold text-ink">
                            {product.sold} {product.soldUnit}
                          </p>
                          <p className="mt-0.5 text-[9.5px] text-slate-500">{product.soldPeriod}</p>
                        </td>
                        <td className="px-3 py-3.5 align-top">
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation()
                              setActionTarget(product)
                            }}
                            aria-label={`Aksi untuk ${product.name}`}
                            className="flex size-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                          >
                            <MoreVertical className="size-4" />
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            <ul className="divide-y divide-[#eef2f6] lg:hidden">
              {pageItems.map((product) => {
                const status = getProductStockStatus(product)
                const meta = stockStatusMeta[status]
                const etalaseInfo = etalaseMeta(product)
                return (
                  <li
                    key={product.id}
                    onClick={() => navigate(`/owner/produk/${product.id}`)}
                    className="cursor-pointer p-4 transition hover:bg-slate-50/70"
                  >
                    <div className="flex items-start gap-3">
                      <span
                        className={`flex size-12 shrink-0 items-center justify-center rounded-xl text-[12px] font-extrabold ${
                          categoryTiles[product.category] ?? 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {getInitials(product.name)}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-[12.5px] font-bold leading-snug text-ink">
                            {product.name}
                          </p>
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation()
                              setActionTarget(product)
                            }}
                            aria-label={`Aksi untuk ${product.name}`}
                            className="flex size-7 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100"
                          >
                            <MoreVertical className="size-4" />
                          </button>
                        </div>
                        <p className="mt-0.5 text-[10.5px] text-slate-500">
                          {product.sku} • {product.category}
                        </p>
                        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                          <span className={`rounded-full px-2 py-0.5 text-[9.5px] font-semibold ${meta.className}`}>
                            {meta.label}
                          </span>
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9.5px] font-semibold ${etalaseInfo.className}`}
                          >
                            <span className={`size-1.5 rounded-full ${etalaseInfo.dot}`} />
                            {etalaseInfo.label}
                          </span>
                        </div>
                        <div className="mt-2 flex items-end justify-between gap-2">
                          <div>
                            <p className="text-[13px] font-bold text-ink">
                              {formatRupiah(product.price)}
                            </p>
                            <p className="text-[10px] text-slate-500">{product.detail}</p>
                          </div>
                          <p className="text-[11px] font-semibold text-slate-600">
                            Stok {product.stock} {product.stockUnit}
                          </p>
                        </div>
                        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-[#eef2f6]">
                          <div
                            className={`h-full rounded-full ${meta.barClassName}`}
                            style={{ width: `${Math.max(getStockPercent(product), 3)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </li>
                )
              })}
            </ul>

            <div className="flex flex-col gap-3 border-t border-line px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-[11px] text-slate-500">
                Menampilkan {filteredProducts.length === 0 ? 0 : pageStart + 1} –{' '}
                {pageStart + pageItems.length} dari {filteredProducts.length} produk terdaftar
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <label className="flex items-center gap-2 text-[11px] text-slate-500">
                  Tampilkan:
                  <select
                    value={pageSize}
                    onChange={(event) => {
                      setPageSize(Number(event.target.value))
                      setPage(1)
                    }}
                    className="h-8 rounded-lg border border-line bg-white px-2 text-[11px] font-semibold text-ink outline-none focus:border-primary"
                  >
                    {[10, 25, 50].map((size) => (
                      <option key={size} value={size}>
                        {size}
                      </option>
                    ))}
                  </select>
                </label>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setPage((current) => Math.max(1, current - 1))}
                    disabled={currentPage === 1}
                    className="flex size-8 items-center justify-center rounded-lg border border-line text-slate-500 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                    aria-label="Halaman sebelumnya"
                  >
                    <ChevronLeft className="size-4" />
                  </button>
                  {Array.from({ length: totalPages }, (_, index) => index + 1).map((number) => (
                    <button
                      key={number}
                      type="button"
                      onClick={() => setPage(number)}
                      className={`size-8 rounded-lg text-[11px] font-semibold transition ${
                        number === currentPage
                          ? 'bg-primary text-white'
                          : 'border border-line text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {number}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                    disabled={currentPage === totalPages}
                    className="flex h-8 items-center gap-1 rounded-lg border border-line px-2 text-[11px] font-semibold text-slate-500 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Selanjutnya
                    <ChevronRight className="size-4" />
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </section>

      {lowStockProducts.length > 0 ? (
        <section className="mt-4 flex flex-col gap-4 rounded-2xl border border-[#fbe3b3] bg-[#fef7e0] p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[#fbe7b5] text-[#b45309]">
              <TriangleAlert className="size-5" />
            </span>
            <div className="min-w-0">
              <h2 className="text-[14px] font-bold text-[#8a4b0f]">
                Pemberitahuan Restock Dapur: {lowStockProducts.length} Produk Memerlukan
                Perhatian
              </h2>
              <p className="mt-1 max-w-[720px] text-[11.5px] leading-relaxed text-[#8a5a2b]">
                {lowStockProducts
                  .map(
                    (product) =>
                      `${product.name} (${product.stock} ${product.stockUnit})`,
                  )
                  .join(' dan ')}{' '}
                telah berada di bawah batas minimum stok. Tambahkan hasil produksi sebelum jam
                buka pesanan ramai untuk mencegah pembatalan pesanan otomatis.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              if (criticalProduct) setStockTarget(criticalProduct)
            }}
            className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl bg-[#dd8a12] px-4 text-[11.5px] font-semibold text-white shadow-sm transition hover:bg-[#c47a0e]"
          >
            <ArrowUpFromLine className="size-4" />
            Sesuaikan Stok Hari Ini
          </button>
        </section>
      ) : (
        <section className="mt-4 flex items-center gap-3 rounded-2xl border border-[#cfe8e3] bg-[#eaf7f4] p-5">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[#d5f2ea] text-primary">
            <ClipboardCheck className="size-5" />
          </span>
          <div>
            <h2 className="text-[14px] font-bold text-primary">Semua stok dalam kondisi aman</h2>
            <p className="mt-1 text-[11.5px] text-slate-600">
              Tidak ada produk yang berada di bawah batas minimum stok saat ini.
            </p>
          </div>
        </section>
      )}

      {toast && (
        <div className="fixed bottom-24 left-1/2 z-[60] w-full max-w-sm -translate-x-1/2 px-4 sm:bottom-6">
          <div className="flex items-start gap-2.5 rounded-xl border border-line bg-white p-3.5 shadow-xl">
            <span
              className={`mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full ${
                toast.tone === 'danger'
                  ? 'bg-[#fde7e7] text-[#dc2626]'
                  : toast.tone === 'info'
                    ? 'bg-[#eef2ff] text-[#4f46e5]'
                    : 'bg-[#dcf7ee] text-primary'
              }`}
            >
              {toast.tone === 'danger' ? (
                <TriangleAlert className="size-3.5" />
              ) : toast.tone === 'info' ? (
                <Info className="size-3.5" />
              ) : (
                <Check className="size-3.5" />
              )}
            </span>
            <p className="flex-1 text-[11.5px] font-medium leading-relaxed text-ink">
              {toast.message}
            </p>
            <button
              type="button"
              onClick={() => setToast(null)}
              aria-label="Tutup notifikasi"
              className="text-slate-400 transition hover:text-slate-600"
            >
              <X className="size-3.5" />
            </button>
          </div>
        </div>
      )}

      {actionTarget && (
        <ModalShell
          title="Aksi Produk"
          subtitle={actionTarget.name}
          onClose={() => setActionTarget(null)}
        >
          <div className="space-y-1.5">
            <button
              type="button"
              onClick={() => {
                setStockTarget(actionTarget)
                setActionTarget(null)
              }}
              className="flex w-full items-center gap-2.5 rounded-xl border border-line px-3.5 py-3 text-left text-[12px] font-semibold text-ink transition hover:bg-slate-50"
            >
              <ArrowUpFromLine className="size-4 text-primary" />
              Sesuaikan Stok
              <span className="ml-auto text-[10.5px] font-medium text-slate-500">
                {actionTarget.stock} {actionTarget.stockUnit}
              </span>
            </button>
            <button
              type="button"
              onClick={() => {
                setFormState({ product: actionTarget })
                setActionTarget(null)
              }}
              className="flex w-full items-center gap-2.5 rounded-xl border border-line px-3.5 py-3 text-left text-[12px] font-semibold text-ink transition hover:bg-slate-50"
            >
              <Pencil className="size-4 text-slate-500" />
              Ubah Detail Produk
            </button>
            <button
              type="button"
              onClick={() => {
                setEtalaseStatus(
                  [actionTarget.id],
                  actionTarget.etalase === 'aktif' ? 'nonaktif' : 'aktif',
                )
                setActionTarget(null)
              }}
              className="flex w-full items-center gap-2.5 rounded-xl border border-line px-3.5 py-3 text-left text-[12px] font-semibold text-ink transition hover:bg-slate-50"
            >
              {actionTarget.etalase === 'aktif' ? (
                <CircleSlash className="size-4 text-slate-500" />
              ) : (
                <BadgeCheck className="size-4 text-primary" />
              )}
              {actionTarget.etalase === 'aktif'
                ? 'Nonaktifkan dari Etalase'
                : 'Aktifkan di Etalase'}
            </button>
            <button
              type="button"
              disabled={actionTarget.sold > 0}
              title={
                actionTarget.sold > 0
                  ? 'Produk yang pernah dipesan tidak dapat dihapus.'
                  : undefined
              }
              onClick={() => {
                setDeleteTarget(actionTarget)
                setActionTarget(null)
              }}
              className="flex w-full items-center gap-2.5 rounded-xl border border-red-100 px-3.5 py-3 text-left text-[12px] font-semibold text-[#dc2626] transition hover:bg-red-50 disabled:cursor-not-allowed disabled:border-line disabled:text-slate-400 disabled:hover:bg-white"
            >
              <Trash2 className="size-4" />
              Hapus Produk
              {actionTarget.sold > 0 && (
                <span className="ml-auto text-[9.5px] font-medium text-slate-400">
                  Pernah dipesan
                </span>
              )}
            </button>
          </div>
        </ModalShell>
      )}

      {formState && (
        <ProductFormModal
          product={formState.product}
          onClose={closeForm}
          onSave={(values) => handleSaveProduct(values, formState.product)}
        />
      )}

      {stockTarget && (
        <StockAdjustModal
          product={stockTarget}
          actorName={session.name}
          onClose={() => setStockTarget(null)}
          onSave={({ mode, amount, reason }) => {
            adjustStock(stockTarget, mode === 'tambah' ? amount : -amount, reason)
            setStockTarget(null)
          }}
        />
      )}

      {deleteTarget && (
        <ModalShell
          title="Hapus Produk?"
          subtitle={`${deleteTarget.name} akan dihapus dari katalog toko Anda.`}
          onClose={() => setDeleteTarget(null)}
          footer={
            <>
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="inline-flex h-10 items-center justify-center rounded-xl border border-line px-4 text-[11.5px] font-semibold text-slate-600 transition hover:bg-slate-50"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#dc2626] px-4 text-[11.5px] font-semibold text-white transition hover:bg-[#b91c1c]"
              >
                <Trash2 className="size-4" />
                Hapus Produk
              </button>
            </>
          }
        >
          <div className="flex items-start gap-2.5 rounded-xl bg-[#fef2f2] p-3.5">
            <TriangleAlert className="mt-0.5 size-4 shrink-0 text-[#dc2626]" />
            <p className="text-[11.5px] leading-relaxed text-slate-600">
              Tindakan ini tidak dapat dibatalkan. Riwayat stok produk akan tetap tersimpan pada
              catatan gudang.
            </p>
          </div>
        </ModalShell>
      )}
    </div>
  )
}

function ProductFormModal({
  product,
  onClose,
  onSave,
}: {
  product: OwnerProduct | null
  onClose: () => void
  onSave: (values: ProductFormValues) => void
}) {
  const [values, setValues] = useState<ProductFormValues>({
    name: product?.name ?? '',
    category: product?.category ?? productCategories[0],
    price: product ? String(product.price) : '',
    stock: product ? String(product.stock) : '',
    minStock: product ? String(product.minStock) : '5',
    stockUnit: product?.stockUnit ?? 'pcs',
    detail: product?.detail ?? '',
  })
  const [errors, setErrors] = useState<ProductFormErrors>({})

  function update(field: keyof ProductFormValues, value: string) {
    setValues((current) => ({ ...current, [field]: value }))
    setErrors((current) => ({ ...current, [field]: undefined }))
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const nextErrors: ProductFormErrors = {}
    const name = values.name.trim()
    const price = Number(values.price)
    const stock = Number(values.stock)
    const minStock = Number(values.minStock)

    if (name.length < 3 || name.length > 100) {
      nextErrors.name = 'Nama produk harus 3–100 karakter.'
    }
    if (!values.category) nextErrors.category = 'Pilih kategori produk.'
    if (!values.price || price <= 0) nextErrors.price = 'Harga harus lebih dari Rp0.'
    if (!product) {
      if (values.stock === '' || stock < 0) nextErrors.stock = 'Stok awal tidak boleh negatif.'
    }
    if (values.minStock === '' || minStock < 0) {
      nextErrors.minStock = 'Batas minimal stok tidak boleh negatif.'
    }
    if (!values.stockUnit.trim()) nextErrors.stockUnit = 'Satuan stok wajib diisi.'

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      return
    }

    onSave(values)
  }

  return (
    <ModalShell
      title={product ? 'Ubah Produk' : 'Tambah Produk'}
      subtitle={
        product
          ? 'Perbarui informasi produk yang tampil di etalase toko.'
          : 'Lengkapi detail produk baru untuk ditampilkan di etalase.'
      }
      onClose={onClose}
      wide
    >
      <form onSubmit={handleSubmit} noValidate>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <TextField
              label="Nama Produk"
              required
              value={values.name}
              onChange={(value) => update('name', value)}
              error={errors.name}
              placeholder="Contoh: Kue Lapis Legit Prune Wisman"
              hint="3–100 karakter"
            />
          </div>

          <label className="block">
            <FieldLabel required>Kategori</FieldLabel>
            <span className="relative mt-1.5 block">
              <select
                value={values.category}
                onChange={(event) => update('category', event.target.value)}
                className="h-11 w-full appearance-none rounded-xl border border-line bg-[#f7f9fc] px-3.5 pr-10 text-[12px] text-ink outline-none transition focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10"
              >
                {productCategories.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            </span>
            {errors.category && (
              <span className="mt-1.5 block text-[10px] text-red-600">{errors.category}</span>
            )}
          </label>

          <TextField
            label="Harga Jual (Rp)"
            required
            type="number"
            inputMode="numeric"
            value={values.price}
            onChange={(value) => update('price', value)}
            error={errors.price}
            placeholder="150000"
          />

          <TextField
            label="Stok Awal"
            type="number"
            inputMode="numeric"
            value={values.stock}
            onChange={(value) => update('stock', value)}
            error={errors.stock}
            disabled={Boolean(product)}
            hint={
              product
                ? 'Stok diubah melalui tombol Sesuaikan Stok.'
                : 'Jumlah stok saat produk ditambahkan.'
            }
          />

          <TextField
            label="Batas Minimal Stok"
            type="number"
            inputMode="numeric"
            value={values.minStock}
            onChange={(value) => update('minStock', value)}
            error={errors.minStock}
            hint="Default 5, memicu peringatan restock."
          />

          <TextField
            label="Satuan Stok"
            required
            value={values.stockUnit}
            onChange={(value) => update('stockUnit', value)}
            error={errors.stockUnit}
            placeholder="loyang, box, porsi"
          />

          <TextField
            label="Keterangan Singkat"
            value={values.detail}
            onChange={(value) => update('detail', value)}
            placeholder="per loyang, isi 5 pcs/pack"
            hint="Tampil di bawah harga pada tabel produk."
          />
        </div>

        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 items-center justify-center rounded-xl border border-line px-4 text-[11.5px] font-semibold text-slate-600 transition hover:bg-slate-50"
          >
            Batal
          </button>
          <button
            type="submit"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-[11.5px] font-semibold text-white transition hover:bg-primary-hover"
          >
            <Check className="size-4" />
            {product ? 'Simpan Perubahan' : 'Simpan Produk'}
          </button>
        </div>
      </form>
    </ModalShell>
  )
}
