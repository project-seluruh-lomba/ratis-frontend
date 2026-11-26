import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from 'react'
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import {
  Bell,
  Bike,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleX,
  ClipboardCheck,
  Clock,
  Download,
  Eye,
  Filter,
  Info,
  Phone,
  Plus,
  Printer,
  RefreshCw,
  Search,
  Store,
  Trash2,
  Truck,
  X,
  Zap,
} from 'lucide-react'
import CancelOrderModal from '../../components/owner/CancelOrderModal'
import { getOwnerSession } from '../../lib/owner-auth'
import {
  addOwnerOrder,
  buildOwnerOrderCode,
  getNextOwnerOrderSequence,
  getOwnerOrders,
  ownerFulfillmentLabels,
  ownerOrderStatusMeta,
  ownerPaymentStatusMeta,
  updateOwnerOrder,
  type OwnerOrder,
  type OwnerOrderFulfillment,
  type OwnerOrderItem,
  type OwnerOrderStatus,
} from '../../lib/owner-order-data'
import { getOwnerProducts, type OwnerProduct } from '../../lib/owner-product-data'

type StatusFilter = 'semua' | OwnerOrderStatus
type ToastTone = 'success' | 'info' | 'danger'
type Toast = { message: string; tone: ToastTone }

const numberFormatter = new Intl.NumberFormat('id-ID')
const PAGE_SIZE = 5

const statusTabs: { key: StatusFilter; label: string; dot?: string }[] = [
  { key: 'semua', label: 'Semua' },
  { key: 'pending', label: 'Menunggu Konfirmasi', dot: 'bg-[#f59e0b]' },
  { key: 'diproses', label: 'Sedang Diproses', dot: 'bg-[#2563eb]' },
  { key: 'siap', label: 'Siap Dikirim/Diambil', dot: 'bg-[#7c3aed]' },
  { key: 'selesai', label: 'Selesai', dot: 'bg-[#22c55e]' },
  { key: 'dibatalkan', label: 'Dibatalkan', dot: 'bg-[#ef4444]' },
]

const fulfillmentIcons: Record<OwnerOrderFulfillment, typeof Store> = {
  ambil: Store,
  'kurir-instan': Bike,
  'kurir-toko': Truck,
  dikirim: Truck,
}

function formatNumber(value: number) {
  return numberFormatter.format(value)
}

function formatRupiah(value: number) {
  return `Rp${formatNumber(value)}`
}

function formatClock(iso: string) {
  const date = new Date(iso)
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(
    2,
    '0',
  )} WIB`
}

function isSameDay(iso: string, reference: Date) {
  const date = new Date(iso)
  return (
    date.getFullYear() === reference.getFullYear() &&
    date.getMonth() === reference.getMonth() &&
    date.getDate() === reference.getDate()
  )
}

function escapeCsv(value: string) {
  if (value.includes(';') || value.includes('"') || value.includes('\n')) {
    return `"${value.replaceAll('"', '""')}"`
  }
  return value
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
    <div className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center sm:p-4">
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
        {footer && (
          <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">{footer}</div>
        )}
      </div>
    </div>
  )
}

function FieldLabel({ children }: { children: ReactNode }) {
  return <span className="text-[12px] font-semibold text-ink">{children}</span>
}

function ManualOrderModal({
  products,
  onClose,
  onCreate,
}: {
  products: OwnerProduct[]
  onClose: () => void
  onCreate: (order: OwnerOrder) => void
}) {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [fulfillment, setFulfillment] = useState<OwnerOrderFulfillment>('ambil')
  const [paymentMethod, setPaymentMethod] = useState('Tunai di Kasir')
  const [note, setNote] = useState('')
  const [error, setError] = useState('')
  const [lines, setLines] = useState<{ productId: string; qty: string }[]>(() => [
    { productId: products[0]?.id ?? '', qty: '1' },
  ])

  const selectedLines = lines
    .map((line) => {
      const product = products.find((item) => item.id === line.productId)
      const qty = Math.max(1, Math.floor(Number(line.qty) || 0))
      return product ? { product, qty } : null
    })
    .filter((line): line is { product: OwnerProduct; qty: number } => line !== null)

  const total = selectedLines.reduce((sum, line) => sum + line.product.price * line.qty, 0)

  function updateLine(index: number, patch: Partial<{ productId: string; qty: string }>) {
    setLines((current) =>
      current.map((line, lineIndex) => (lineIndex === index ? { ...line, ...patch } : line)),
    )
    setError('')
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!name.trim()) {
      setError('Nama pelanggan wajib diisi.')
      return
    }
    if (selectedLines.length === 0) {
      setError('Tambahkan minimal satu produk untuk pesanan ini.')
      return
    }

    const items: OwnerOrderItem[] = selectedLines.map(({ product, qty }) => ({
      name: product.name,
      qty,
      unitPrice: product.price,
      note: product.detail,
    }))
    const sequence = getNextOwnerOrderSequence()

    onCreate({
      id: `ord-${Date.now()}`,
      code: buildOwnerOrderCode(sequence),
      createdAt: new Date().toISOString(),
      customerName: name.trim(),
      customerPhone: phone.trim() || '-',
      fulfillment,
      items,
      total,
      paymentMethod,
      paymentStatus: paymentMethod === 'Tunai di Kasir' ? 'belum' : 'lunas',
      status: 'pending',
      isNew: true,
      note: note.trim() || undefined,
    })
  }

  return (
    <ModalShell
      title="Catat Pesanan Manual"
      subtitle="Gunakan untuk pesanan yang masuk lewat WhatsApp, telepon, atau langsung di kasir."
      onClose={onClose}
      wide
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="h-10 rounded-xl border border-line bg-white px-4 text-[11.5px] font-semibold text-slate-600 transition hover:bg-slate-50"
          >
            Batal
          </button>
          <button
            type="submit"
            form="manual-order-form"
            disabled={products.length === 0}
            className="h-10 rounded-xl bg-primary px-4 text-[11.5px] font-semibold text-white transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
          >
            Simpan Pesanan
          </button>
        </>
      }
    >
      <form id="manual-order-form" onSubmit={handleSubmit} className="space-y-3.5">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <FieldLabel>Nama pelanggan *</FieldLabel>
            <input
              type="text"
              value={name}
              onChange={(event) => {
                setName(event.target.value)
                setError('')
              }}
              placeholder="Contoh: Siti Rahmawati"
              className="mt-1.5 h-10 w-full rounded-xl border border-line bg-[#f7f9fc] px-3 text-[12px] text-ink outline-none transition placeholder:text-slate-400 focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10"
            />
          </label>
          <label className="block">
            <FieldLabel>Nomor HP</FieldLabel>
            <input
              type="tel"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              placeholder="+62 812-0000-0000"
              className="mt-1.5 h-10 w-full rounded-xl border border-line bg-[#f7f9fc] px-3 text-[12px] text-ink outline-none transition placeholder:text-slate-400 focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10"
            />
          </label>
        </div>

        <div>
          <FieldLabel>Produk *</FieldLabel>
          <div className="mt-1.5 space-y-2">
            {lines.map((line, index) => (
              <div key={index} className="flex items-start gap-2">
                <label className="relative block min-w-0 flex-1">
                  <span className="sr-only">Pilih produk</span>
                  <select
                    value={line.productId}
                    onChange={(event) => updateLine(index, { productId: event.target.value })}
                    className="h-10 w-full appearance-none rounded-xl border border-line bg-[#f7f9fc] px-3 pr-8 text-[11.5px] text-ink outline-none transition focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10"
                  >
                    {products.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.name} — {formatRupiah(product.price)}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                </label>
                <input
                  type="number"
                  min={1}
                  value={line.qty}
                  onChange={(event) => updateLine(index, { qty: event.target.value })}
                  aria-label="Jumlah item"
                  className="h-10 w-16 rounded-xl border border-line bg-[#f7f9fc] px-2 text-center text-[11.5px] font-semibold text-ink outline-none transition focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10"
                />
                <button
                  type="button"
                  onClick={() => setLines((current) => current.filter((_, i) => i !== index))}
                  disabled={lines.length === 1}
                  aria-label="Hapus item"
                  className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-line text-slate-500 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() =>
              setLines((current) => [
                ...current,
                { productId: products[0]?.id ?? '', qty: '1' },
              ])
            }
            className="mt-2 inline-flex items-center gap-1.5 text-[11px] font-semibold text-primary transition hover:text-primary-hover"
          >
            <Plus className="size-3.5" />
            Tambah produk
          </button>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="relative block">
            <FieldLabel>Pengiriman</FieldLabel>
            <select
              value={fulfillment}
              onChange={(event) =>
                setFulfillment(event.target.value as OwnerOrderFulfillment)
              }
              className="mt-1.5 h-10 w-full appearance-none rounded-xl border border-line bg-[#f7f9fc] px-3 pr-8 text-[11.5px] text-ink outline-none transition focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10"
            >
              <option value="ambil">Ambil di Toko</option>
              <option value="kurir-instan">Kurir Instan (GoSend)</option>
              <option value="kurir-toko">Kurir Toko (Pak Joko)</option>
              <option value="dikirim">Dikirim</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-2.5 top-[38px] size-4 text-slate-400" />
          </label>
          <label className="relative block">
            <FieldLabel>Pembayaran</FieldLabel>
            <select
              value={paymentMethod}
              onChange={(event) => setPaymentMethod(event.target.value)}
              className="mt-1.5 h-10 w-full appearance-none rounded-xl border border-line bg-[#f7f9fc] px-3 pr-8 text-[11.5px] text-ink outline-none transition focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10"
            >
              <option value="Tunai di Kasir">Tunai di Kasir</option>
              <option value="Transfer Bank (BCA)">Transfer Bank (BCA)</option>
              <option value="Transfer Bank (Mandiri)">Transfer Bank (Mandiri)</option>
              <option value="QRIS Dinamis">QRIS Dinamis</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-2.5 top-[38px] size-4 text-slate-400" />
          </label>
        </div>

        <label className="block">
          <FieldLabel>Catatan (opsional)</FieldLabel>
          <textarea
            value={note}
            onChange={(event) => setNote(event.target.value)}
            rows={2}
            maxLength={200}
            placeholder="Contoh: ambil jam 16.00, minta dibungkus kado."
            className="mt-1.5 w-full resize-none rounded-xl border border-line bg-[#f7f9fc] px-3 py-2.5 text-[11.5px] text-ink outline-none transition placeholder:text-slate-400 focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10"
          />
        </label>

        <div className="flex items-center justify-between rounded-xl border border-[#cfe8e3] bg-[#eaf7f4] px-3.5 py-2.5">
          <span className="text-[11.5px] font-semibold text-slate-600">Total pesanan</span>
          <span className="text-[15px] font-extrabold text-primary">{formatRupiah(total)}</span>
        </div>

        {error && (
          <p className="rounded-lg bg-[#fde7e7] px-3 py-2 text-[11px] font-medium text-[#b91c1c]">
            {error}
          </p>
        )}
      </form>
    </ModalShell>
  )
}

export default function OwnerOrderListPage() {
  const navigate = useNavigate()
  const [session] = useState(getOwnerSession)
  const [searchParams, setSearchParams] = useSearchParams()
  const [orders, setOrders] = useState<OwnerOrder[]>(getOwnerOrders)
  const [products] = useState<OwnerProduct[]>(getOwnerProducts)
  const [status, setStatus] = useState<StatusFilter>('semua')
  const [fulfillment, setFulfillment] = useState<'semua' | OwnerOrderFulfillment>('semua')
  const [range, setRange] = useState<'hari-ini' | '7' | '30'>('hari-ini')
  const [query, setQuery] = useState(() => searchParams.get('cari') ?? '')
  const [page, setPage] = useState(1)
  const [cancelTarget, setCancelTarget] = useState<OwnerOrder | null>(null)
  const [manualOpen, setManualOpen] = useState(false)
  const [toast, setToast] = useState<Toast | null>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const keyword = searchParams.get('cari')
    if (keyword !== null) {
      setQuery(keyword)
      setPage(1)
    }
  }, [searchParams])

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
    const result: Record<StatusFilter, number> = {
      semua: orders.length,
      pending: 0,
      diproses: 0,
      siap: 0,
      selesai: 0,
      dibatalkan: 0,
    }
    for (const order of orders) result[order.status] += 1
    return result
  }, [orders])

  const filteredOrders = useMemo(() => {
    const keyword = query.trim().toLowerCase()
    const now = new Date()
    return orders.filter((order) => {
      if (status !== 'semua' && order.status !== status) return false
      if (fulfillment !== 'semua' && order.fulfillment !== fulfillment) return false
      if (range === '7' || range === '30') {
        const limit = range === '7' ? 7 : 30
        const difference =
          (now.getTime() - new Date(order.createdAt).getTime()) / (1000 * 60 * 60 * 24)
        if (difference > limit) return false
      } else if (!isSameDay(order.createdAt, now)) {
        return false
      }
      if (keyword) {
        const haystack = `${order.code} ${order.customerName} ${order.customerPhone} ${order.items
          .map((item) => item.name)
          .join(' ')}`.toLowerCase()
        if (!haystack.includes(keyword)) return false
      }
      return true
    })
  }, [fulfillment, orders, query, range, status])

  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const pageStart = (currentPage - 1) * PAGE_SIZE
  const pageItems = filteredOrders.slice(pageStart, pageStart + PAGE_SIZE)

  const pendingOrders = orders.filter((order) => order.status === 'pending')
  const processingCount = counts.diproses
  const completedToday = orders.filter(
    (order) => order.status === 'selesai' && isSameDay(order.createdAt, new Date()),
  )
  const completedOmzet = completedToday.reduce((sum, order) => sum + order.total, 0)
  const nextPending = [...pendingOrders].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  )[0]

  if (!session) {
    return <Navigate to="/" replace />
  }

  const shortDate = new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date())

  function showToast(message: string, tone: ToastTone = 'success') {
    setToast({ message, tone })
  }

  function resetFilters() {
    setStatus('semua')
    setFulfillment('semua')
    setRange('hari-ini')
    setQuery('')
    setPage(1)
    if (searchParams.has('cari')) {
      const next = new URLSearchParams(searchParams)
      next.delete('cari')
      setSearchParams(next, { replace: true })
    }
  }

  function updateStatus(
    order: OwnerOrder,
    nextStatus: OwnerOrderStatus,
    extra?: Partial<OwnerOrder>,
  ) {
    const nextOrder: OwnerOrder = { ...order, ...extra, status: nextStatus }
    updateOwnerOrder(nextOrder)
    setOrders((current) =>
      current.map((item) => (item.id === nextOrder.id ? nextOrder : item)),
    )
  }

  function handleProcess(order: OwnerOrder) {
    updateStatus(order, 'diproses')
    showToast(`Pesanan ${order.code} mulai diproses.`)
  }

  function handleComplete(order: OwnerOrder) {
    updateStatus(order, 'selesai')
    showToast(`Pesanan ${order.code} ditandai selesai.`)
  }

  function openCancel(order: OwnerOrder) {
    setCancelTarget(order)
  }

  function handleCancelOrder(reason: string) {
    if (!cancelTarget) return
    updateStatus(cancelTarget, 'dibatalkan', {
      cancelReason: reason,
      paymentStatus: 'batal',
    })
    showToast(`Pesanan ${cancelTarget.code} dibatalkan.`, 'info')
    setCancelTarget(null)
  }

  function handleCreateManual(order: OwnerOrder) {
    addOwnerOrder(order)
    setOrders((current) => [order, ...current])
    setManualOpen(false)
    setStatus('semua')
    setRange('hari-ini')
    setQuery('')
    setPage(1)
    showToast(`Pesanan manual ${order.code} berhasil dicatat.`)
  }

  function handleExport() {
    if (filteredOrders.length === 0) {
      showToast('Tidak ada pesanan untuk diekspor.', 'info')
      return
    }

    const header = [
      'Kode Pesanan',
      'Waktu',
      'Pelanggan',
      'No HP',
      'Pengiriman',
      'Item',
      'Total',
      'Metode Pembayaran',
      'Status Pembayaran',
      'Status Pesanan',
    ]
    const rows = filteredOrders.map((order) => [
      order.code,
      formatClock(order.createdAt),
      order.customerName,
      order.customerPhone,
      ownerFulfillmentLabels[order.fulfillment],
      order.items.map((item) => `${item.qty}x ${item.name}`).join(', '),
      String(order.total),
      order.paymentMethod,
      ownerPaymentStatusMeta[order.paymentStatus].label,
      ownerOrderStatusMeta[order.status].label,
    ])
    const csv = [header, ...rows].map((row) => row.map(escapeCsv).join(';')).join('\r\n')
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `pesanan-${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(anchor)
    anchor.click()
    anchor.remove()
    URL.revokeObjectURL(url)
    showToast('Data pesanan berhasil diekspor.')
  }

  function handleRefresh() {
    setOrders(getOwnerOrders())
    showToast('Daftar pesanan sudah diperbarui.', 'info')
  }

  function handlePrintReceipt(order: OwnerOrder) {
    if (!session) return
    const escape = (value: string) =>
      value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    const win = window.open('', '_blank', 'width=400,height=640')
    if (!win) {
      showToast('Popup diblokir browser. Izinkan popup untuk mencetak struk.', 'danger')
      return
    }
    const itemRows = order.items
      .map(
        (item) => `<tr><td>${escape(item.name)}<div class="muted">${item.qty} x ${formatRupiah(
          item.unitPrice,
        )}</div></td><td class="right">${formatRupiah(item.qty * item.unitPrice)}</td></tr>`,
      )
      .join('')
    win.document.write(`<!doctype html><html lang="id"><head><meta charset="utf-8" />
<title>Struk ${escape(order.code)}</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: ui-sans-serif, system-ui, sans-serif; padding: 18px; color: #0f172a; font-size: 12px; }
  h1 { font-size: 15px; margin: 0; text-align: center; }
  .muted { color: #64748b; font-size: 10px; }
  .center { text-align:center; }
  .row { display:flex; justify-content:space-between; gap:10px; margin-top:4px; }
  .divider { border-top:1px dashed #cbd5e1; margin:12px 0; }
  table { width:100%; border-collapse:collapse; }
  td { padding:5px 0; vertical-align:top; }
  .right { text-align:right; white-space:nowrap; }
  .total { font-size:14px; font-weight:700; }
  .status { display:inline-block; margin-top:6px; padding:2px 8px; border-radius:999px; background:#dcfce7; color:#15803d; font-size:10px; font-weight:600; }
</style></head><body>
  <h1>${escape(session.storeName)}</h1>
  <p class="center muted">Struk Pesanan Ratis Bisnis</p>
  <div class="divider"></div>
  <div class="row"><span class="muted">Kode</span><strong>${escape(order.code)}</strong></div>
  <div class="row"><span class="muted">Waktu</span><span>${escape(formatClock(order.createdAt))}</span></div>
  <div class="row"><span class="muted">Pelanggan</span><span>${escape(order.customerName)}</span></div>
  <div class="row"><span class="muted">Pengiriman</span><span>${escape(
    ownerFulfillmentLabels[order.fulfillment],
  )}</span></div>
  <div class="divider"></div>
  <table>${itemRows}</table>
  <div class="divider"></div>
  <div class="row total"><span>Total</span><span>${formatRupiah(order.total)}</span></div>
  <div class="row"><span class="muted">Pembayaran</span><span>${escape(order.paymentMethod)}</span></div>
  <div class="row"><span class="muted">Status</span><span>${escape(
    ownerPaymentStatusMeta[order.paymentStatus].label,
  )}</span></div>
  <div class="divider"></div>
  <p class="center muted">Terima kasih telah memesan di ${escape(session.storeName)}.</p>
</body></html>`)
    win.document.close()
    win.focus()
    win.print()
  }

  const kpiCards = [
    {
      label: 'Perlu Diproses',
      value: pendingOrders.length,
      icon: Bell,
      iconTile: 'bg-[#fef3c7] text-[#d97706]',
      note: (
        <span className="flex min-w-0 items-center gap-1.5">
          <span className="size-1.5 shrink-0 rounded-full bg-[#f59e0b]" />
          <span className="truncate">
            {nextPending ? `${nextPending.code} butuh konfirmasi` : 'Tidak ada pesanan baru'}
          </span>
        </span>
      ),
    },
    {
      label: 'Sedang Diproses',
      value: processingCount,
      icon: Clock,
      iconTile: 'bg-[#dbeafe] text-[#2563eb]',
      note: (
        <span className="flex items-center gap-1.5">
          <Clock className="size-3 text-[#2563eb]" />
          Estimasi siap &lt; 25 menit
        </span>
      ),
    },
    {
      label: 'Selesai Hari Ini',
      value: completedToday.length,
      icon: CheckCircle2,
      iconTile: 'bg-[#dcfce7] text-[#16a34a]',
      note: (
        <span className="flex items-center justify-between gap-2">
          <span>Omzet Masuk</span>
          <span className="font-semibold text-ink">{formatRupiah(completedOmzet)}</span>
        </span>
      ),
    },
    {
      label: 'Dibatalkan',
      value: counts.dibatalkan,
      icon: CircleX,
      iconTile: 'bg-[#fee2e2] text-[#dc2626]',
      note: (
        <span className="flex items-center gap-1.5">
          <Info className="size-3 text-[#dc2626]" />0 retur / 100% stok aman
        </span>
      ),
    },
  ]

  return (
    <div>
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="max-w-[650px]">
          <h1 className="text-[26px] font-extrabold tracking-tight text-ink sm:text-[30px]">
            Kelola Pesanan Masuk
          </h1>
          <p className="mt-1 max-w-[620px] text-[13px] leading-relaxed text-slate-500">
            Pantau pesanan pelanggan, verifikasi pembayaran luar sistem, dan proses
            pengiriman tepat waktu.
          </p>
        </div>

        <div className="flex w-full flex-wrap gap-2.5 sm:flex-nowrap xl:w-auto">
          <button
            type="button"
            onClick={handleExport}
            className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-line bg-white px-4 text-[11.5px] font-semibold text-slate-700 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition hover:bg-slate-50 sm:flex-none"
          >
            <Download className="size-4 text-slate-500" />
            Ekspor Pesanan (CSV)
          </button>
          <button
            type="button"
            onClick={() => setManualOpen(true)}
            className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-[11.5px] font-semibold text-white shadow-sm transition hover:bg-primary-hover sm:flex-none"
          >
            <Plus className="size-4" />
            Catat Pesanan Manual/POS
          </button>
          <button
            type="button"
            onClick={handleRefresh}
            aria-label="Muat ulang daftar pesanan"
            className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-line bg-white text-slate-500 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition hover:bg-slate-50 hover:text-ink"
          >
            <RefreshCw className="size-4" />
          </button>
        </div>
      </div>

      <div className="mt-5 grid gap-3.5 sm:grid-cols-2 xl:grid-cols-4">
        {kpiCards.map(({ label, value, icon: Icon, iconTile, note }) => (
          <section
            key={label}
            className="rounded-2xl border border-line bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.06)] sm:p-5"
          >
            <div className="flex items-start justify-between gap-2">
              <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-slate-500">
                {label}
              </p>
              <span
                className={`flex size-9 shrink-0 items-center justify-center rounded-xl ${iconTile}`}
              >
                <Icon className="size-[17px]" />
              </span>
            </div>
            <p className="mt-2 flex items-baseline gap-1.5">
              <span className="text-[30px] font-extrabold leading-none tracking-tight text-ink">
                {value}
              </span>
              <span className="text-[11px] font-medium text-slate-500">Pesanan</span>
            </p>
            <div className="mt-3 text-[10.5px] text-slate-500">{note}</div>
          </section>
        ))}
      </div>

      <section className="mt-4 rounded-2xl border border-line bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.06)]">
        <div className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-1">
          {statusTabs.map((tab) => {
            const isActive = status === tab.key
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => {
                  setStatus(tab.key)
                  setPage(1)
                }}
                className={`inline-flex shrink-0 items-center gap-2 rounded-full border px-3.5 py-2 text-[11.5px] font-semibold transition ${
                  isActive
                    ? 'border-[#cfe8e3] bg-[#eaf7f4] text-primary'
                    : 'border-transparent text-slate-600 hover:border-line hover:bg-slate-50'
                }`}
              >
                {tab.dot && <span className={`size-1.5 rounded-full ${tab.dot}`} />}
                {tab.label}
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[9.5px] font-bold ${
                    isActive ? 'bg-white text-primary' : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {counts[tab.key]}
                </span>
              </button>
            )
          })}
        </div>

        <div className="mt-3 grid gap-2.5 sm:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_190px_210px_auto]">
          <div className="relative sm:col-span-2 xl:col-span-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <input
              ref={searchRef}
              type="search"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value)
                setPage(1)
              }}
              placeholder="Cari kode, pesanan, nama pelanggan, atau no. telepon..."
              className="h-10 w-full rounded-xl border border-line bg-[#f7f9fc] pl-10 pr-14 text-[11.5px] text-ink outline-none transition placeholder:text-slate-400 focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10"
            />
            <span className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 rounded border border-line bg-white px-1.5 py-0.5 text-[9px] font-semibold text-slate-400 sm:block">
              ⌘K
            </span>
          </div>

          <label className="relative block">
            <span className="sr-only">Filter pengiriman</span>
            <Truck className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <select
              value={fulfillment}
              onChange={(event) => {
                setFulfillment(event.target.value as 'semua' | OwnerOrderFulfillment)
                setPage(1)
              }}
              className="h-10 w-full appearance-none rounded-xl border border-line bg-white pl-9 pr-8 text-[11.5px] font-medium text-ink outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
            >
              <option value="semua">Semua Pengiriman</option>
              <option value="ambil">Ambil di Toko</option>
              <option value="kurir-instan">Kurir Instan</option>
              <option value="kurir-toko">Kurir Toko</option>
              <option value="dikirim">Dikirim</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          </label>

          <label className="relative block">
            <span className="sr-only">Filter tanggal</span>
            <CalendarDays className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <select
              value={range}
              onChange={(event) => {
                setRange(event.target.value as 'hari-ini' | '7' | '30')
                setPage(1)
              }}
              className="h-10 w-full appearance-none rounded-xl border border-line bg-white pl-9 pr-8 text-[11.5px] font-medium text-ink outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
            >
              <option value="hari-ini">Hari ini, {shortDate}</option>
              <option value="7">7 hari terakhir</option>
              <option value="30">30 hari terakhir</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          </label>

          <button
            type="button"
            onClick={resetFilters}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl px-3 text-[11.5px] font-semibold text-slate-600 transition hover:bg-slate-50 hover:text-ink"
          >
            <Filter className="size-4" />
            Reset
          </button>
        </div>
      </section>

      <section className="mt-4 overflow-hidden rounded-2xl border border-line bg-white shadow-[0_1px_2px_rgba(15,23,42,0.06)]">
        {pageItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
            <span className="flex size-14 items-center justify-center rounded-2xl bg-primary-soft/50 text-primary">
              <ClipboardCheck className="size-6" />
            </span>
            <h2 className="mt-4 text-[16px] font-extrabold text-ink">Belum ada pesanan</h2>
            <p className="mt-1 max-w-sm text-[11.5px] leading-relaxed text-slate-500">
              Pesanan akan muncul di sini setelah toko aktif dan pelanggan melakukan
              pemesanan. Ubah filter atau catat pesanan manual jika pesanan masuk lewat
              jalur lain.
            </p>
            <button
              type="button"
              onClick={() => setManualOpen(true)}
              className="mt-4 inline-flex h-9 items-center gap-2 rounded-xl bg-primary px-3.5 text-[11.5px] font-semibold text-white transition hover:bg-primary-hover"
            >
              <Plus className="size-4" />
              Catat Pesanan Manual
            </button>
          </div>
        ) : (
          <>
            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full min-w-[1160px] border-collapse">
                <thead>
                  <tr className="bg-[#f1f4fd] text-left text-[9.5px] font-bold uppercase tracking-[0.07em] text-slate-500">
                    <th className="px-4 py-3">No. Pesanan &amp; Waktu</th>
                    <th className="px-3 py-3">Pelanggan &amp; Pengiriman</th>
                    <th className="px-3 py-3">Menu &amp; Rincian Item</th>
                    <th className="px-3 py-3">Total &amp; Pembayaran</th>
                    <th className="px-3 py-3">Status Pesanan</th>
                    <th className="px-3 py-3 text-right">Aksi Cepat</th>
                  </tr>
                </thead>
                <tbody>
                  {pageItems.map((order) => {
                    const statusMeta = ownerOrderStatusMeta[order.status]
                    const paymentMeta = ownerPaymentStatusMeta[order.paymentStatus]
                    const FulfillmentIcon = fulfillmentIcons[order.fulfillment]
                    const canCancel =
                      order.status === 'pending' ||
                      order.status === 'diproses' ||
                      order.status === 'siap'
                    return (
                      <tr
                        key={order.id}
                        onClick={() => navigate(`/owner/pesanan/${order.id}`)}
                        className="cursor-pointer border-t border-[#eef2f6] align-top transition hover:bg-[#fbfcfe]"
                      >
                        <td className="px-4 py-4">
                          <div className="flex items-start justify-between gap-2">
                            <p className="max-w-[132px] break-all text-[11.5px] font-extrabold leading-tight tracking-tight text-ink">
                              {order.code}
                            </p>
                            {order.isNew && (
                              <span className="shrink-0 rounded-md bg-[#d9f7ea] px-1.5 py-0.5 text-[9px] font-bold text-primary">
                                Baru
                              </span>
                            )}
                          </div>
                          <p className="mt-1.5 flex items-center gap-1 text-[10.5px] text-slate-500">
                            <Clock className="size-3" />
                            {formatClock(order.createdAt)}
                          </p>
                        </td>

                        <td className="px-3 py-4">
                          <p className="text-[12px] font-bold text-ink">{order.customerName}</p>
                          <p className="mt-0.5 flex items-start gap-1 text-[10.5px] text-slate-500">
                            <Phone className="mt-0.5 size-3 shrink-0" />
                            <span>{order.customerPhone}</span>
                          </p>
                          <p className="mt-1 flex items-start gap-1 text-[10.5px] text-slate-500">
                            <FulfillmentIcon className="mt-0.5 size-3 shrink-0" />
                            <span>{ownerFulfillmentLabels[order.fulfillment]}</span>
                          </p>
                        </td>

                        <td className="px-3 py-4">
                          <div className="space-y-0.5">
                            {order.items.slice(0, 2).map((item, index) => (
                              <p
                                key={`${item.name}-${index}`}
                                className="text-[11px] leading-snug text-ink"
                              >
                                <span className="font-semibold">{item.qty}x</span> {item.name}
                                {item.note && (
                                  <span className="text-slate-500"> {item.note}</span>
                                )}
                              </p>
                            ))}
                            {order.items.length > 2 && (
                              <p className="text-[10px] font-semibold text-primary">
                                +{order.items.length - 2} item lainnya
                              </p>
                            )}
                          </div>
                        </td>

                        <td className="px-3 py-4">
                          <p
                            className={`text-[12px] font-bold ${
                              order.status === 'dibatalkan'
                                ? 'text-slate-400 line-through'
                                : 'text-ink'
                            }`}
                          >
                            {formatRupiah(order.total)}
                          </p>
                          <p className="mt-0.5 text-[10.5px] text-slate-500">
                            {order.paymentMethod}
                          </p>
                          <p
                            className={`mt-0.5 flex items-center gap-1 text-[9.5px] font-medium ${paymentMeta.textClassName}`}
                          >
                            <span className={`size-1 rounded-full ${paymentMeta.dotClassName}`} />
                            {paymentMeta.label}
                          </p>
                        </td>

                        <td className="px-3 py-4">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold ${statusMeta.className}`}
                          >
                            <span className={`size-1.5 rounded-full ${statusMeta.dotClassName}`} />
                            {statusMeta.label}
                          </span>
                          {order.status === 'selesai' && (
                            <p className="mt-1 text-[9.5px] text-slate-500">Kas Toko Tercatat</p>
                          )}
                          {order.status === 'dibatalkan' && (
                            <p className="mt-1 text-[9.5px] text-slate-500">Stok Dikembalikan</p>
                          )}
                        </td>

                        <td
                          className="px-3 py-4"
                          onClick={(event) => event.stopPropagation()}
                        >
                          <div className="flex items-center justify-end gap-1.5">
                            {order.status === 'pending' && (
                              <button
                                type="button"
                                onClick={() => handleProcess(order)}
                                className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-primary px-2.5 text-[10.5px] font-semibold text-white shadow-sm transition hover:bg-primary-hover"
                              >
                                <Zap className="size-3.5" />
                                Proses
                              </button>
                            )}
                            {(order.status === 'diproses' || order.status === 'siap') && (
                              <button
                                type="button"
                                onClick={() => handleComplete(order)}
                                className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-primary px-2.5 text-[10.5px] font-semibold text-white shadow-sm transition hover:bg-primary-hover"
                              >
                                <CheckCircle2 className="size-3.5" />
                                Selesaikan
                              </button>
                            )}
                            {order.status === 'selesai' && (
                              <button
                                type="button"
                                onClick={() => handlePrintReceipt(order)}
                                className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-line bg-white px-2.5 text-[10.5px] font-semibold text-slate-700 transition hover:bg-slate-50"
                              >
                                <Printer className="size-3.5" />
                                Struk
                              </button>
                            )}
                            {canCancel && (
                              <button
                                type="button"
                                onClick={() => openCancel(order)}
                                aria-label={`Batalkan pesanan ${order.code}`}
                                className="flex size-8 items-center justify-center rounded-lg border border-[#f5c2c2] bg-white text-[#dc2626] transition hover:bg-red-50"
                              >
                                <X className="size-4" />
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => navigate(`/owner/pesanan/${order.id}`)}
                              aria-label={`Lihat detail ${order.code}`}
                              className="flex size-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                            >
                              <Eye className="size-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            <ul className="divide-y divide-[#eef2f6] lg:hidden">
              {pageItems.map((order) => {
                const statusMeta = ownerOrderStatusMeta[order.status]
                const paymentMeta = ownerPaymentStatusMeta[order.paymentStatus]
                const FulfillmentIcon = fulfillmentIcons[order.fulfillment]
                return (
                  <li key={order.id} className="p-4">
                    <div
                      onClick={() => navigate(`/owner/pesanan/${order.id}`)}
                      className="cursor-pointer"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="break-all text-[11.5px] font-extrabold tracking-tight text-ink">
                          {order.code}
                        </p>
                        {order.isNew && (
                          <span className="rounded-md bg-[#d9f7ea] px-1.5 py-0.5 text-[9px] font-bold text-primary">
                            Baru
                          </span>
                        )}
                        <span
                          className={`ml-auto inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[9.5px] font-semibold ${statusMeta.className}`}
                        >
                          <span className={`size-1.5 rounded-full ${statusMeta.dotClassName}`} />
                          {statusMeta.label}
                        </span>
                      </div>
                      <p className="mt-1 flex items-center gap-1 text-[10.5px] text-slate-500">
                        <Clock className="size-3" />
                        {formatClock(order.createdAt)}
                      </p>

                      <div className="mt-2.5 flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-[12px] font-bold text-ink">{order.customerName}</p>
                          <p className="mt-0.5 text-[10.5px] text-slate-500">
                            {order.customerPhone}
                          </p>
                          <p className="mt-1 flex items-center gap-1 text-[10.5px] text-slate-500">
                            <FulfillmentIcon className="size-3" />
                            {ownerFulfillmentLabels[order.fulfillment]}
                          </p>
                        </div>
                        <div className="shrink-0 text-right">
                          <p
                            className={`text-[13px] font-bold ${
                              order.status === 'dibatalkan'
                                ? 'text-slate-400 line-through'
                                : 'text-ink'
                            }`}
                          >
                            {formatRupiah(order.total)}
                          </p>
                          <p
                            className={`mt-0.5 flex items-center justify-end gap-1 text-[9.5px] font-medium ${paymentMeta.textClassName}`}
                          >
                            <span className={`size-1 rounded-full ${paymentMeta.dotClassName}`} />
                            {paymentMeta.label}
                          </p>
                        </div>
                      </div>

                      <p className="mt-2 text-[10.5px] leading-snug text-slate-600">
                        {order.items[0]
                          ? `${order.items[0].qty}x ${order.items[0].name}`
                          : ''}
                        {order.items.length > 1 && (
                          <span className="text-primary">
                            {' '}
                            +{order.items.length - 1} item lainnya
                          </span>
                        )}
                      </p>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-1.5">
                      {order.status === 'pending' && (
                        <button
                          type="button"
                          onClick={() => handleProcess(order)}
                          className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-primary px-3 text-[10.5px] font-semibold text-white transition hover:bg-primary-hover"
                        >
                          <Zap className="size-3.5" />
                          Proses
                        </button>
                      )}
                      {(order.status === 'diproses' || order.status === 'siap') && (
                        <button
                          type="button"
                          onClick={() => handleComplete(order)}
                          className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-primary px-3 text-[10.5px] font-semibold text-white transition hover:bg-primary-hover"
                        >
                          <CheckCircle2 className="size-3.5" />
                          Selesaikan
                        </button>
                      )}
                      {order.status === 'selesai' && (
                        <button
                          type="button"
                          onClick={() => handlePrintReceipt(order)}
                          className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-line bg-white px-3 text-[10.5px] font-semibold text-slate-700 transition hover:bg-slate-50"
                        >
                          <Printer className="size-3.5" />
                          Struk
                        </button>
                      )}
                      {(order.status === 'pending' ||
                        order.status === 'diproses' ||
                        order.status === 'siap') && (
                        <button
                          type="button"
                          onClick={() => openCancel(order)}
                          className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-[#f5c2c2] bg-white px-3 text-[10.5px] font-semibold text-[#dc2626] transition hover:bg-red-50"
                        >
                          <X className="size-3.5" />
                          Batalkan
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => navigate(`/owner/pesanan/${order.id}`)}
                        className="ml-auto inline-flex h-8 items-center gap-1.5 rounded-lg px-2 text-[10.5px] font-semibold text-slate-500 transition hover:bg-slate-50 hover:text-ink"
                      >
                        <Eye className="size-3.5" />
                        Detail
                      </button>
                    </div>
                  </li>
                )
              })}
            </ul>

            <div className="flex flex-col gap-3 border-t border-line px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-[11px] text-slate-500">
                Menampilkan {filteredOrders.length === 0 ? 0 : pageStart + 1} –{' '}
                {pageStart + pageItems.length} dari {filteredOrders.length} pesanan
              </p>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                  disabled={currentPage === 1}
                  className="inline-flex h-8 items-center gap-1 rounded-lg px-2 text-[11px] font-semibold text-slate-500 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronLeft className="size-4" />
                  Sebelumnya
                </button>
                {Array.from({ length: totalPages }, (_, index) => index + 1).map((number) => (
                  <button
                    key={number}
                    type="button"
                    onClick={() => setPage(number)}
                    className={`size-8 rounded-lg text-[11px] font-semibold transition ${
                      number === currentPage
                        ? 'bg-primary text-white'
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {number}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                  disabled={currentPage === totalPages}
                  className="inline-flex h-8 items-center gap-1 rounded-lg bg-[#eef2ff] px-2.5 text-[11px] font-semibold text-slate-600 transition hover:bg-[#e3e9ff] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Berikutnya
                  <ChevronRight className="size-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </section>

      <section className="mt-4 flex items-start gap-3 rounded-2xl border border-[#cfe8e3] bg-[#eaf7f4] p-5">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#0b3b3a] text-white">
          <ClipboardCheck className="size-5" />
        </span>
        <div>
          <h2 className="text-[13px] font-bold text-ink">Tips Operasional Toko</h2>
          <p className="mt-1 max-w-[860px] text-[11.5px] leading-relaxed text-slate-600">
            Tekan <span className="font-semibold text-ink">Proses</span> setelah pembayaran
            terverifikasi, lalu <span className="font-semibold text-ink">Selesaikan</span>{' '}
            ketika pesanan sudah diserahkan ke pelanggan. Setiap perubahan status tercatat
            pada riwayat pesanan.
          </p>
        </div>
      </section>

      {toast && (
        <div className="fixed bottom-24 left-1/2 z-[80] w-full max-w-sm -translate-x-1/2 px-4 sm:bottom-6">
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
                <CircleX className="size-3.5" />
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

      {cancelTarget && (
        <CancelOrderModal
          order={cancelTarget}
          onClose={() => setCancelTarget(null)}
          onConfirm={handleCancelOrder}
        />
      )}

      {manualOpen && (
        <ManualOrderModal
          products={products}
          onClose={() => setManualOpen(false)}
          onCreate={handleCreateManual}
        />
      )}
    </div>
  )
}
