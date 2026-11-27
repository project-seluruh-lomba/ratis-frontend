import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import {
  ArrowLeft,
  Banknote,
  Barcode,
  CakeSlice,
  Check,
  CheckCircle2,
  Clock,
  Info,
  Landmark,
  Leaf,
  MapPin,
  MessageCircle,
  Minus,
  PauseCircle,
  Plus,
  Printer,
  QrCode,
  RefreshCw,
  Search,
  ShoppingBag,
  ShoppingCart,
  Store,
  Trash2,
  Truck,
  User,
  Utensils,
  X,
} from 'lucide-react'
import { getOwnerSession } from '../../lib/owner-auth'
import {
  addOwnerOrder,
  getNextOwnerOrderSequence,
  type OwnerOrder,
} from '../../lib/owner-order-data'
import {
  getOwnerProducts,
  getProductStockStatus,
  productCategories,
  updateOwnerProduct,
  type OwnerProduct,
} from '../../lib/owner-product-data'

type OrderType = 'dine-in' | 'takeaway' | 'delivery'
type PaymentMethod = 'tunai' | 'qris' | 'transfer'
type ToastTone = 'success' | 'info' | 'danger'

type CartLine = {
  productId: string
  qty: number
}

const orderTypes: { id: OrderType; label: string; icon: typeof Utensils }[] = [
  { id: 'dine-in', label: 'Beli Langsung / Dine-in', icon: Utensils },
  { id: 'takeaway', label: 'Bawa Pulang (Takeaway)', icon: ShoppingBag },
  { id: 'delivery', label: 'WhatsApp / Delivery', icon: Truck },
]

const paymentMethods: {
  id: PaymentMethod
  label: string
  caption: string
  icon: typeof Banknote
}[] = [
  { id: 'tunai', label: 'Tunai (Cash)', caption: 'Bayar di kasir', icon: Banknote },
  { id: 'qris', label: 'QRIS Dinamis', caption: 'Pindai kode', icon: QrCode },
  { id: 'transfer', label: 'Transfer Bank', caption: 'BCA / transfer', icon: Landmark },
]

const orderTypeLabels: Record<OrderType, string> = {
  'dine-in': 'Dine-in',
  takeaway: 'Takeaway',
  delivery: 'Delivery',
}

const paymentLabels: Record<PaymentMethod, string> = {
  tunai: 'Tunai di Kasir',
  qris: 'QRIS Dinamis',
  transfer: 'Transfer Bank',
}

const productTiles: Record<string, { bg: string; text: string }> = {
  'Kue Basah & Tradisional': {
    bg: 'from-[#f7e8d1] via-[#efd5b1] to-[#dfbb8c]',
    text: 'text-[#8a5526]',
  },
  'Pastry & Roti': {
    bg: 'from-[#fde8e2] via-[#f8d2c6] to-[#edb09e]',
    text: 'text-[#934435]',
  },
  'Hampers & Paket': {
    bg: 'from-[#eaecfd] via-[#d9ddf8] to-[#c1c8f0]',
    text: 'text-[#4b4a9c]',
  },
}

function formatRupiah(value: number) {
  return `Rp ${value.toLocaleString('id-ID')}`
}

function initials(value: string) {
  return value
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase()
}

function pad(value: number) {
  return String(value).padStart(2, '0')
}

function buildPosReference(sequence: number, date: Date) {
  const stamp = `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}`
  return `RTS-MAN-${stamp}-${String(sequence).padStart(3, '0')}`
}

function formatDateLabel(date: Date) {
  const datePart = new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date)
  const timePart = new Intl.DateTimeFormat('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
    .format(date)
    .replace('.', ':')
  return `${datePart} • ${timePart} WIB`
}

function escapeHtml(value: string) {
  return value.replace(
    /[&<>"']/g,
    (character) =>
      ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;',
      })[character] ?? character,
  )
}

export default function OwnerPosPage() {
  const [session] = useState(() => getOwnerSession())
  const [now] = useState(() => new Date())
  const [products, setProducts] = useState<OwnerProduct[]>(() => getOwnerProducts())
  const [referenceCode, setReferenceCode] = useState(() =>
    buildPosReference(getNextOwnerOrderSequence(), new Date()),
  )

  const [orderType, setOrderType] = useState<OrderType>('dine-in')
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<string>('semua')
  const [cart, setCart] = useState<CartLine[]>([])
  const [promoActive, setPromoActive] = useState(false)

  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [customerNote, setCustomerNote] = useState('')
  const [deliveryAddress, setDeliveryAddress] = useState('')

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('tunai')
  const [cashReceived, setCashReceived] = useState('')

  const [lastOrder, setLastOrder] = useState<OwnerOrder | null>(null)
  const [toast, setToast] = useState<{ message: string; tone: ToastTone } | null>(null)

  const searchRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => setToast(null), 4200)
    return () => window.clearTimeout(timer)
  }, [toast])

  useEffect(() => {
    if (cart.length === 0 && promoActive) setPromoActive(false)
  }, [cart.length, promoActive])

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

  const sellableProducts = useMemo(
    () => products.filter((product) => product.etalase === 'aktif'),
    [products],
  )

  const categoryChips = useMemo(() => {
    return [
      { id: 'semua', label: 'Semua Menu', count: sellableProducts.length },
      ...productCategories.map((item) => ({
        id: item,
        label: item,
        count: sellableProducts.filter((product) => product.category === item).length,
      })),
    ]
  }, [sellableProducts])

  const filteredProducts = useMemo(() => {
    const keyword = query.trim().toLowerCase()
    return sellableProducts.filter((product) => {
      const matchesCategory = category === 'semua' || product.category === category
      const matchesKeyword =
        !keyword ||
        product.name.toLowerCase().includes(keyword) ||
        product.sku.toLowerCase().includes(keyword)
      return matchesCategory && matchesKeyword
    })
  }, [sellableProducts, category, query])

  const cartLines = useMemo(
    () =>
      cart.flatMap((line) => {
        const product = products.find((item) => item.id === line.productId)
        return product ? [{ product, qty: line.qty }] : []
      }),
    [cart, products],
  )

  const totalQty = cartLines.reduce((sum, line) => sum + line.qty, 0)
  const subtotal = cartLines.reduce((sum, line) => sum + line.product.price * line.qty, 0)
  const discount = promoActive ? Math.round(subtotal * 0.1) : 0
  const ecoBagFee = cartLines.length > 0 ? 2000 : 0
  const total = Math.max(0, subtotal - discount + ecoBagFee)
  const cashValue = Number(cashReceived || 0)
  const changeAmount = cashValue - total
  const cashShort = cashValue > 0 && cashValue < total

  const roundedCash = Math.ceil(total / 10_000) * 10_000
  const quickCash =
    total > 0
      ? Array.from(new Set([roundedCash, roundedCash + 50_000, roundedCash + 150_000]))
      : []

  if (!session) {
    return <Navigate to="/owner/login" replace />
  }

  const activeSession = session

  function showToast(message: string, tone: ToastTone = 'info') {
    setToast({ message, tone })
  }

  function addToCart(product: OwnerProduct) {
    if (product.stock <= 0) {
      showToast(`${product.name} sedang habis.`, 'danger')
      return
    }
    const existing = cart.find((line) => line.productId === product.id)
    if (existing && existing.qty >= product.stock) {
      showToast(`Stok ${product.name} tersisa ${product.stock} ${product.stockUnit}.`, 'info')
      return
    }
    setLastOrder(null)
    setCart((current) => {
      const line = current.find((item) => item.productId === product.id)
      if (line) {
        return current.map((item) =>
          item.productId === product.id ? { ...item, qty: item.qty + 1 } : item,
        )
      }
      return [...current, { productId: product.id, qty: 1 }]
    })
  }

  function changeQty(productId: string, delta: number) {
    setCart((current) =>
      current.map((line) => {
        if (line.productId !== productId) return line
        const product = products.find((item) => item.id === productId)
        const max = product?.stock ?? line.qty
        return { ...line, qty: Math.min(max, Math.max(1, line.qty + delta)) }
      }),
    )
  }

  function removeLine(productId: string) {
    setCart((current) => current.filter((line) => line.productId !== productId))
  }

  function handleUmum() {
    setCustomerName('Pelanggan Umum')
    setCustomerPhone('')
  }

  function handleScan() {
    searchRef.current?.focus()
    showToast('Arahkan scanner ke kolom pencarian, atau ketik SKU produk.', 'info')
  }

  function handleGantiKasir() {
    showToast('Pergantian kasir mengikuti akun staf yang sedang login.', 'info')
  }

  function printReceipt(order: OwnerOrder) {
    const receiptWindow = window.open('', '_blank', 'width=420,height=680')
    if (!receiptWindow) {
      showToast('Struk tidak dapat dibuka. Izinkan pop-up untuk mencetak.', 'info')
      return
    }

    const rows = order.items
      .map(
        (item) => `
          <tr>
            <td>${item.qty}x ${escapeHtml(item.name)}</td>
            <td class="right">${formatRupiah(item.unitPrice * item.qty)}</td>
          </tr>`,
      )
      .join('')

    const changeLine =
      order.paymentMethod === paymentLabels.tunai && cashValue > 0
        ? `<div class="row"><span>Kembalian</span><span>${formatRupiah(Math.max(0, changeAmount))}</span></div>`
        : ''

    receiptWindow.document.write(`<!doctype html>
      <html lang="id">
        <head>
          <meta charset="utf-8" />
          <title>Struk ${order.code}</title>
          <style>
            * { box-sizing: border-box; }
            body { margin: 0; padding: 18px; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; color: #0f172a; font-size: 11px; }
            h1 { font-size: 14px; margin: 0 0 2px; text-align: center; }
            .muted { color: #64748b; text-align: center; margin: 0; font-size: 9px; }
            .divider { border-top: 1px dashed #cbd5e1; margin: 10px 0; }
            .row { display: flex; justify-content: space-between; gap: 8px; margin: 3px 0; }
            .right { text-align: right; white-space: nowrap; }
            table { width: 100%; border-collapse: collapse; }
            td { padding: 2px 0; vertical-align: top; }
            .total { font-size: 13px; font-weight: 700; }
            .footer { text-align: center; color: #64748b; margin-top: 12px; font-size: 9px; }
          </style>
        </head>
        <body>
          <h1>${escapeHtml(activeSession.storeName)}</h1>
          <p class="muted">Struk Pembayaran</p>
          <div class="divider"></div>
          <div class="row"><span>${escapeHtml(order.code)}</span><span>${new Date(order.createdAt).toLocaleString('id-ID')}</span></div>
          <div class="row"><span>Kasir</span><span>${escapeHtml(activeSession.name)}</span></div>
          <div class="row"><span>Pelanggan</span><span>${escapeHtml(order.customerName)}</span></div>
          <div class="row"><span>Tipe</span><span>${escapeHtml(orderTypeLabels[orderType])}</span></div>
          <div class="divider"></div>
          <table>${rows}</table>
          <div class="divider"></div>
          <div class="row"><span>Subtotal</span><span>${formatRupiah(subtotal)}</span></div>
          <div class="row"><span>Diskon</span><span>-${formatRupiah(discount)}</span></div>
          <div class="row"><span>Kantong ramah lingkungan</span><span>${formatRupiah(ecoBagFee)}</span></div>
          <div class="row total"><span>Total</span><span>${formatRupiah(order.total)}</span></div>
          <div class="divider"></div>
          <div class="row"><span>Metode</span><span>${escapeHtml(order.paymentMethod)}</span></div>
          ${
            order.paymentMethod === paymentLabels.tunai
              ? `<div class="row"><span>Tunai</span><span>${formatRupiah(cashValue)}</span></div>${changeLine}`
              : ''
          }
          <p class="footer">Terima kasih sudah berbelanja.<br />Simpan struk ini sebagai bukti pembayaran.</p>
        </body>
      </html>`)
    receiptWindow.document.close()
    receiptWindow.focus()
    receiptWindow.print()
  }

  function handlePay() {
    if (cartLines.length === 0) {
      showToast('Pilih minimal satu produk sebelum membayar.', 'danger')
      return
    }

    if (paymentMethod === 'tunai' && cashValue < total) {
      showToast(
        `Uang diterima kurang ${formatRupiah(total - cashValue)} dari total tagihan.`,
        'danger',
      )
      return
    }

    const outOfStock = cartLines.find((line) => line.qty > line.product.stock)
    if (outOfStock) {
      showToast(
        `Stok ${outOfStock.product.name} tinggal ${outOfStock.product.stock} ${outOfStock.product.stockUnit}.`,
        'danger',
      )
      return
    }

    const createdAt = new Date()
    const sequence = getNextOwnerOrderSequence()
    const code = buildPosReference(sequence, createdAt)
    const order: OwnerOrder = {
      id: `ord-pos-${Date.now()}`,
      code,
      createdAt: createdAt.toISOString(),
      customerName: customerName.trim() || 'Pelanggan Umum',
      customerPhone: customerPhone.trim() || '-',
      fulfillment: orderType === 'delivery' ? 'dikirim' : 'ambil',
      address: orderType === 'delivery' ? deliveryAddress.trim() || undefined : undefined,
      items: cartLines.map((line) => ({
        name: line.product.name,
        qty: line.qty,
        unitPrice: line.product.price,
        note: line.product.detail,
      })),
      total,
      paymentMethod: paymentLabels[paymentMethod],
      paymentStatus: 'lunas',
      status: 'selesai',
      isNew: false,
      note:
        [
          orderTypeLabels[orderType],
          customerNote.trim(),
          orderType === 'delivery' && deliveryAddress.trim()
            ? `Alamat: ${deliveryAddress.trim()}`
            : '',
        ]
          .filter(Boolean)
          .join(' • ') || undefined,
    }

    for (const line of cartLines) {
      updateOwnerProduct({
        ...line.product,
        stock: Math.max(0, line.product.stock - line.qty),
      })
    }
    addOwnerOrder(order)

    setProducts(getOwnerProducts())
    setLastOrder(order)
    setCart([])
    setPromoActive(false)
    setCashReceived('')
    setCustomerName('')
    setCustomerPhone('')
    setCustomerNote('')
    setDeliveryAddress('')
    setReferenceCode(buildPosReference(getNextOwnerOrderSequence(), new Date()))
    printReceipt(order)
    showToast(`Transaksi ${code} berhasil dan stok produk sudah diperbarui.`, 'success')
  }

  function handleHold() {
    if (cartLines.length === 0) {
      showToast('Belum ada produk untuk ditahan.', 'info')
      return
    }
    showToast('Pesanan ditahan sementara. Keranjang tetap tersimpan di halaman ini.', 'info')
  }

  function handleWhatsApp() {
    if (cartLines.length === 0) {
      showToast('Tambahkan produk dulu sebelum mengirim rincian.', 'info')
      return
    }

    const digits = customerPhone.replace(/\D/g, '').replace(/^0/, '62')
    if (digits.length < 9) {
      showToast('Isi nomor WhatsApp pelanggan terlebih dahulu.', 'info')
      return
    }

    const message = [
      `Halo ${customerName.trim() || 'Kak'}, berikut rincian pesanan Anda di ${activeSession.storeName}:`,
      '',
      ...cartLines.map(
        (line) =>
          `${line.qty}x ${line.product.name} — ${formatRupiah(line.product.price * line.qty)}`,
      ),
      '',
      `Subtotal: ${formatRupiah(subtotal)}`,
      `Total: ${formatRupiah(total)}`,
      '',
      'Silakan konfirmasi pesanan ini. Terima kasih.',
    ].join('\n')

    window.open(
      `https://wa.me/${digits}?text=${encodeURIComponent(message)}`,
      '_blank',
      'noopener,noreferrer',
    )
  }

  return (
    <div className="pb-10">
      <section className="rounded-2xl border border-line bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.06)] sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            to="/owner/pesanan"
            className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 transition hover:text-primary"
          >
            <ArrowLeft className="size-4" />
            Kembali ke Daftar Pesanan
          </Link>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-slate-500">
            <span>
              No. Referensi:{' '}
              <span className="font-bold text-ink">#{referenceCode}</span>
            </span>
            <span className="hidden h-3 w-px bg-line sm:block" />
            <span className="inline-flex items-center gap-1.5">
              <Clock className="size-3.5 text-slate-400" />
              {formatDateLabel(now)}
            </span>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <span className="inline-flex items-center gap-2 rounded-full bg-[#eaf7f4] px-3 py-1.5 text-[10px] font-semibold text-primary">
            <Store className="size-3.5" />
            Mode Kasir &amp; Pesanan Langsung
          </span>
          <div className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-full bg-[#dff3ee] text-[9px] font-bold text-primary">
              {initials(session.name)}
            </span>
            <div className="min-w-0">
              <p className="max-w-[180px] truncate text-[10.5px] font-bold text-ink">
                {session.name}
              </p>
              <p className="text-[9px] text-slate-400">Kasir</p>
            </div>
            <button
              type="button"
              onClick={handleGantiKasir}
              className="ml-1 text-[10px] font-semibold text-primary transition hover:text-primary-hover"
            >
              Ganti
            </button>
          </div>
        </div>
      </section>

      <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1fr)_370px]">
        <div className="min-w-0 space-y-4">
          <section className="rounded-2xl border border-line bg-white p-3.5 shadow-[0_1px_2px_rgba(15,23,42,0.06)] sm:p-4">
            <div className="grid gap-1.5 rounded-xl bg-[#f1f4fd] p-1.5 sm:grid-cols-3">
              {orderTypes.map(({ id, label, icon: Icon }) => {
                const active = orderType === id
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setOrderType(id)}
                    className={`flex min-h-12 items-center justify-center gap-2 rounded-lg px-2 py-2 text-center text-[10px] font-semibold transition ${
                      active
                        ? 'bg-white text-primary shadow-[0_1px_2px_rgba(15,23,42,0.08)]'
                        : 'text-slate-500 hover:bg-white/60 hover:text-ink'
                    }`}
                  >
                    <Icon className={`size-4 shrink-0 ${active ? 'text-primary' : 'text-slate-400'}`} />
                    {label}
                  </button>
                )
              })}
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleScan}
                className="inline-flex h-9 items-center gap-2 rounded-lg bg-[#f1f4fd] px-3 text-[10px] font-semibold text-primary transition hover:bg-[#e8edfa]"
              >
                <Barcode className="size-4" />
                Scan Barcode
              </button>
              <span className="text-[9px] text-slate-400">
                Pindai atau ketik SKU di kolom pencarian
              </span>
            </div>

            <div className="relative mt-3">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <input
                ref={searchRef}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Cari nama kue, bolu, snack renyah, atau ketik SKU..."
                className="h-11 w-full rounded-xl border border-line bg-[#f8fafc] pl-9 pr-14 text-[11px] text-ink outline-none transition placeholder:text-slate-400 focus:border-primary/40 focus:bg-white focus:ring-2 focus:ring-primary/10"
              />
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rounded border border-line bg-white px-1.5 py-0.5 text-[8px] font-semibold text-slate-400">
                ⌘K
              </span>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              {categoryChips.map((chip) => {
                const active = category === chip.id
                return (
                  <button
                    key={chip.id}
                    type="button"
                    onClick={() => setCategory(chip.id)}
                    className={`inline-flex h-8 items-center gap-1 rounded-full px-3 text-[9.5px] font-semibold transition ${
                      active
                        ? 'bg-[#dff3ee] text-primary'
                        : 'bg-[#f1f4fd] text-slate-500 hover:bg-[#e8edfa] hover:text-ink'
                    }`}
                  >
                    {chip.label} ({chip.count})
                  </button>
                )
              })}
            </div>
          </section>

          {filteredProducts.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-line bg-white p-10 text-center">
              <Search className="mx-auto size-7 text-slate-300" />
              <p className="mt-2 text-[12px] font-semibold text-ink">Produk tidak ditemukan</p>
              <p className="mt-1 text-[10px] text-slate-400">
                Coba kata kunci lain atau pilih kategori Semua Menu.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
              {filteredProducts.map((product) => {
                const line = cart.find((item) => item.productId === product.id)
                const stockStatus = getProductStockStatus(product)
                const isHabis = stockStatus === 'habis'
                const isMenipis = stockStatus === 'menipis'
                const tile = productTiles[product.category] ?? {
                  bg: 'from-[#eef2f7] to-[#dbe3ec]',
                  text: 'text-slate-600',
                }

                return (
                  <article
                    key={product.id}
                    className={`flex flex-col rounded-2xl border bg-white p-2.5 transition ${
                      line
                        ? 'border-primary shadow-[0_0_0_1px_rgba(15,118,110,0.12)]'
                        : 'border-line hover:border-primary/30'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => addToCart(product)}
                      disabled={isHabis}
                      aria-label={`Tambah ${product.name}`}
                      className={`relative block h-[108px] w-full overflow-hidden rounded-xl bg-gradient-to-br ${tile.bg} transition ${
                        isHabis ? 'cursor-not-allowed' : 'hover:brightness-[1.03]'
                      }`}
                    >
                      <span className="absolute -right-6 -top-7 size-20 rounded-full bg-white/30" />
                      <span className="absolute -bottom-9 -left-6 size-20 rounded-full bg-white/20" />
                      <CakeSlice className={`absolute left-2.5 top-2.5 size-3.5 opacity-40 ${tile.text}`} />
                      <span
                        className={`relative flex h-full items-center justify-center text-[24px] font-extrabold tracking-[-0.04em] ${tile.text}`}
                      >
                        {initials(product.name)}
                      </span>

                      {line && (
                        <span className="absolute right-2 top-2 flex size-5 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-white shadow-sm">
                          {line.qty}
                        </span>
                      )}

                      <span
                        className={`absolute bottom-2 left-2 rounded-md px-1.5 py-0.5 text-[8px] font-semibold ${
                          isHabis
                            ? 'bg-[#fee2e2] text-[#b91c1c]'
                            : isMenipis
                              ? 'bg-[#fee2e2] text-[#b91c1c]'
                              : 'bg-white/90 text-slate-600'
                        }`}
                      >
                        {isHabis
                          ? 'Habis'
                          : `${product.stock} ${product.stockUnit}${isMenipis ? ' (Menipis)' : ''}`}
                      </span>

                      {isHabis && (
                        <span className="absolute inset-0 flex items-center justify-center bg-white/55 text-[10px] font-bold uppercase tracking-[0.08em] text-slate-500">
                          Stok Habis
                        </span>
                      )}
                    </button>

                    <h3
                      title={product.name}
                      className="mt-2 line-clamp-2 min-h-[30px] text-[10.5px] font-bold leading-snug text-ink"
                    >
                      {product.name}
                    </h3>
                    <p className="mt-0.5 truncate text-[9px] text-slate-400">{product.detail}</p>
                    <p className="mt-1 text-[13px] font-extrabold text-ink">
                      {formatRupiah(product.price)}
                    </p>

                    <button
                      type="button"
                      onClick={() => addToCart(product)}
                      disabled={isHabis}
                      className={`mt-2 inline-flex h-8 items-center justify-center gap-1 rounded-lg text-[9.5px] font-semibold transition ${
                        isHabis
                          ? 'cursor-not-allowed bg-slate-100 text-slate-400'
                          : line
                            ? 'bg-[#dff3ee] text-primary hover:bg-[#d2eee7]'
                            : 'bg-[#f1f4fd] text-primary hover:bg-[#e6ecfa]'
                      }`}
                    >
                      {isHabis ? (
                        'Stok Habis'
                      ) : line ? (
                        <>
                          <Check className="size-3.5" />
                          Terpilih ({line.qty})
                        </>
                      ) : (
                        <>
                          <Plus className="size-3.5" />
                          Tambah
                        </>
                      )}
                    </button>
                  </article>
                )
              })}
            </div>
          )}

          <div className="flex flex-col gap-2 rounded-2xl border border-[#d9f0e8] bg-[#f0faf7] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="flex items-start gap-2 text-[9.5px] leading-relaxed text-slate-600">
              <RefreshCw className="mt-0.5 size-3.5 shrink-0 text-primary" />
              Sinkronisasi inventaris langsung aktif: Pembelian POS akan otomatis memotong
              stok gudang fisik.
            </p>
            <p className="flex shrink-0 items-center gap-1.5 text-[9.5px] font-semibold text-ink">
              <span className="size-1.5 rounded-full bg-primary" />
              {sellableProducts.length} Produk Aktif Tersedia
            </p>
          </div>
        </div>

        <aside className="space-y-4 xl:sticky xl:top-[88px] xl:max-h-[calc(100vh_-_104px)] xl:self-start xl:overflow-y-auto xl:pr-1">
          {lastOrder && (
            <div className="rounded-2xl border border-[#cfe8e3] bg-[#eafaf4] p-3.5">
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" />
                <div className="min-w-0">
                  <p className="text-[10.5px] font-bold text-ink">
                    Transaksi {lastOrder.code} selesai
                  </p>
                  <p className="mt-0.5 text-[9px] leading-relaxed text-slate-500">
                    {formatRupiah(lastOrder.total)} sudah dibayar. Stok produk diperbarui.
                  </p>
                  <Link
                    to={`/owner/pesanan/${lastOrder.id}`}
                    className="mt-1.5 inline-flex text-[9.5px] font-semibold text-primary hover:underline"
                  >
                    Lihat Detail Pesanan
                  </Link>
                </div>
              </div>
            </div>
          )}

          <section className="rounded-2xl border border-line bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.06)]">
            <div className="flex items-center justify-between gap-2">
              <h2 className="inline-flex items-center gap-2 text-[13px] font-bold text-ink">
                <ShoppingCart className="size-4 text-primary" />
                Rincian Kasir
              </h2>
              <span className="rounded-full bg-[#eaf7f4] px-2.5 py-1 text-[8.5px] font-semibold text-primary">
                {cartLines.length} Item Terpilih
              </span>
            </div>

            <div className="mt-3 rounded-xl bg-[#f1f4fd] p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="inline-flex items-center gap-1.5 text-[9.5px] font-bold text-ink">
                  <User className="size-3.5 text-primary" />
                  Informasi Pelanggan
                </p>
                <button
                  type="button"
                  onClick={handleUmum}
                  className="rounded-full bg-white px-2 py-0.5 text-[8px] font-semibold text-primary transition hover:bg-primary-soft"
                >
                  Umum
                </button>
              </div>

              <div className="mt-2 grid grid-cols-2 gap-2">
                <label className="block min-w-0">
                  <span className="mb-1 block text-[8.5px] font-medium text-slate-500">
                    Nama Pemesan
                  </span>
                  <input
                    value={customerName}
                    onChange={(event) => setCustomerName(event.target.value)}
                    placeholder="Pelanggan Umum"
                    className="h-8 w-full rounded-lg border border-transparent bg-white px-2 text-[10px] text-ink outline-none transition placeholder:text-slate-400 focus:border-primary/40"
                  />
                </label>
                <label className="block min-w-0">
                  <span className="mb-1 block text-[8.5px] font-medium text-slate-500">
                    No. WhatsApp
                  </span>
                  <input
                    type="tel"
                    inputMode="tel"
                    value={customerPhone}
                    onChange={(event) => setCustomerPhone(event.target.value)}
                    placeholder="0812-xxxx-xxxx"
                    className="h-8 w-full rounded-lg border border-transparent bg-white px-2 text-[10px] text-ink outline-none transition placeholder:text-slate-400 focus:border-primary/40"
                  />
                </label>
              </div>

              {orderType === 'delivery' && (
                <label className="mt-2 block">
                  <span className="mb-1 inline-flex items-center gap-1 text-[8.5px] font-medium text-slate-500">
                    <MapPin className="size-3" />
                    Alamat Pengiriman
                  </span>
                  <input
                    value={deliveryAddress}
                    onChange={(event) => setDeliveryAddress(event.target.value)}
                    placeholder="Alamat lengkap tujuan kirim"
                    className="h-8 w-full rounded-lg border border-transparent bg-white px-2 text-[10px] text-ink outline-none transition placeholder:text-slate-400 focus:border-primary/40"
                  />
                </label>
              )}

              <label className="mt-2 block">
                <span className="mb-1 block text-[8.5px] font-medium text-slate-500">
                  Catatan Struk / Pengemasan
                </span>
                <textarea
                  rows={2}
                  value={customerNote}
                  onChange={(event) => setCustomerNote(event.target.value)}
                  placeholder="Contoh: minta dibungkus pita untuk hantaran arisan"
                  className="w-full resize-none rounded-lg border border-transparent bg-white px-2 py-1.5 text-[10px] leading-relaxed text-ink outline-none transition placeholder:text-slate-400 focus:border-primary/40"
                />
              </label>
            </div>

            {cartLines.length === 0 ? (
              <div className="mt-3 rounded-xl border border-dashed border-line px-4 py-7 text-center">
                <ShoppingCart className="mx-auto size-6 text-slate-300" />
                <p className="mt-2 text-[10.5px] font-semibold text-ink">
                  Keranjang masih kosong
                </p>
                <p className="mt-0.5 text-[9px] text-slate-400">
                  Pilih produk di katalog untuk mulai transaksi.
                </p>
              </div>
            ) : (
              <div className="mt-3 max-h-[300px] space-y-2 overflow-y-auto pr-0.5">
                {cartLines.map(({ product, qty }) => (
                  <div key={product.id} className="rounded-xl bg-[#f7f9fc] p-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-[10px] font-bold text-ink">
                          {product.name}
                        </p>
                        <p className="mt-0.5 text-[8.5px] text-slate-400">
                          {formatRupiah(product.price)} / {product.stockUnit}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeLine(product.id)}
                        aria-label={`Hapus ${product.name}`}
                        className="flex size-6 shrink-0 items-center justify-center rounded-md text-slate-400 transition hover:bg-[#fee2e2] hover:text-[#b91c1c]"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                    <div className="mt-2 flex items-center justify-between gap-2">
                      <div className="inline-flex items-center rounded-lg border border-line bg-white">
                        <button
                          type="button"
                          onClick={() => changeQty(product.id, -1)}
                          disabled={qty <= 1}
                          aria-label={`Kurangi ${product.name}`}
                          className="flex size-7 items-center justify-center text-slate-500 transition hover:text-ink disabled:cursor-not-allowed disabled:text-slate-300"
                        >
                          <Minus className="size-3" />
                        </button>
                        <span className="w-6 text-center text-[10px] font-bold text-ink">
                          {qty}
                        </span>
                        <button
                          type="button"
                          onClick={() => changeQty(product.id, 1)}
                          disabled={qty >= product.stock}
                          aria-label={`Tambah ${product.name}`}
                          className="flex size-7 items-center justify-center text-slate-500 transition hover:text-ink disabled:cursor-not-allowed disabled:text-slate-300"
                        >
                          <Plus className="size-3" />
                        </button>
                      </div>
                      <p className="text-[10.5px] font-bold text-ink">
                        {formatRupiah(product.price * qty)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-3 rounded-xl bg-[#eef1fb] p-3">
              <div className="flex items-center justify-between text-[9.5px] text-slate-600">
                <span>Subtotal Produk ({totalQty} pcs)</span>
                <span className="font-semibold text-ink">{formatRupiah(subtotal)}</span>
              </div>
              <div className="mt-1.5 flex items-center justify-between gap-2 text-[9.5px] text-slate-600">
                <span className="inline-flex flex-wrap items-center gap-1">
                  Diskon Toko/Promo
                  {promoActive && <span className="text-[8px] text-primary">(10%)</span>}
                  <button
                    type="button"
                    onClick={() => setPromoActive((current) => !current)}
                    disabled={cartLines.length === 0}
                    className="text-[8.5px] font-semibold text-primary transition hover:underline disabled:cursor-not-allowed disabled:text-slate-300"
                  >
                    {promoActive ? 'Hapus' : '+ Tambah'}
                  </button>
                </span>
                <span className="font-semibold text-ink">- {formatRupiah(discount)}</span>
              </div>
              <div className="mt-1.5 flex items-center justify-between text-[9.5px] text-slate-600">
                <span className="inline-flex items-center gap-1">
                  <Leaf className="size-3 text-primary" />
                  Kantong Ramah Lingkungan
                </span>
                <span className="font-semibold text-ink">+ {formatRupiah(ecoBagFee)}</span>
              </div>

              <div className="mt-2 flex items-end justify-between gap-2 border-t border-[#dde4f3] pt-2">
                <div>
                  <p className="text-[9.5px] font-bold uppercase tracking-[0.04em] text-ink">
                    Total Tagihan
                  </p>
                  <p className="mt-0.5 text-[8px] text-slate-400">Termasuk PPN &amp; Kemasan</p>
                </div>
                <p className="text-[22px] font-extrabold leading-none text-primary">
                  {formatRupiah(total)}
                </p>
              </div>
            </div>

            <p className="mt-3 text-[9.5px] font-semibold text-ink">Metode Pembayaran</p>
            <div className="mt-1.5 grid grid-cols-3 gap-1.5">
              {paymentMethods.map(({ id, label, caption, icon: Icon }) => {
                const active = paymentMethod === id
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setPaymentMethod(id)}
                    className={`flex min-h-[54px] flex-col items-center justify-center gap-1 rounded-lg border px-1 py-1.5 text-center transition ${
                      active
                        ? 'border-primary/40 bg-[#dff3ee] text-primary'
                        : 'border-transparent bg-[#f1f4fd] text-slate-500 hover:bg-[#e8edfa]'
                    }`}
                  >
                    <Icon className={`size-4 ${active ? 'text-primary' : 'text-slate-400'}`} />
                    <span className="text-[8px] font-semibold leading-tight">{label}</span>
                    <span className="text-[7px] leading-tight text-slate-400">{caption}</span>
                  </button>
                )
              })}
            </div>

            {paymentMethod === 'tunai' ? (
              <div className="mt-2.5 rounded-xl bg-[#eef1fb] p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[9px] text-slate-500">Uang Diterima:</span>
                  <div className="flex items-center gap-1 rounded-lg bg-white px-2 py-1">
                    <span className="text-[8.5px] text-slate-400">Rp</span>
                    <input
                      inputMode="numeric"
                      value={cashReceived ? Number(cashReceived).toLocaleString('id-ID') : ''}
                      onChange={(event) =>
                        setCashReceived(event.target.value.replace(/\D/g, '').slice(0, 12))
                      }
                      placeholder="0"
                      className="w-20 bg-transparent text-right text-[11px] font-semibold text-ink outline-none placeholder:text-slate-300"
                    />
                  </div>
                </div>

                {quickCash.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {quickCash.map((value) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setCashReceived(String(value))}
                        className={`rounded-md px-2 py-1 text-[8.5px] font-semibold transition ${
                          cashValue === value
                            ? 'bg-white text-primary ring-1 ring-primary/30'
                            : 'bg-white/70 text-slate-500 hover:bg-white hover:text-ink'
                        }`}
                      >
                        {value.toLocaleString('id-ID')}
                      </button>
                    ))}
                  </div>
                )}

                <div className="mt-2 flex items-center justify-between gap-2 text-[9.5px]">
                  <span className="text-slate-500">Kembalian:</span>
                  <span
                    className={`text-[12px] font-bold ${
                      cashShort ? 'text-[#b91c1c]' : 'text-ink'
                    }`}
                  >
                    {cashShort
                      ? `Kurang ${formatRupiah(total - cashValue)}`
                      : formatRupiah(Math.max(0, changeAmount))}
                  </span>
                </div>
              </div>
            ) : (
              <div className="mt-2.5 rounded-xl bg-[#eef1fb] p-3 text-[9px] leading-relaxed text-slate-500">
                Pembayaran {paymentLabels[paymentMethod]} dicatat{' '}
                <span className="font-semibold text-primary">lunas</span> saat transaksi
                diselesaikan.
              </div>
            )}

            <button
              type="button"
              onClick={handlePay}
              disabled={cartLines.length === 0}
              className="mt-3 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary px-3 text-[11px] font-semibold text-white shadow-sm transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              <Printer className="size-4" />
              Bayar &amp; Cetak Struk (Selesai)
            </button>

            <div className="mt-2 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleHold}
                className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-line bg-white text-[9.5px] font-semibold text-slate-600 transition hover:bg-slate-50"
              >
                <PauseCircle className="size-3.5 text-slate-400" />
                Tahan (Hold)
              </button>
              <button
                type="button"
                onClick={handleWhatsApp}
                className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-line bg-white text-[9.5px] font-semibold text-slate-600 transition hover:bg-slate-50"
              >
                <MessageCircle className="size-3.5 text-slate-400" />
                Kirim WhatsApp
              </button>
            </div>

            {cartLines.length > 0 && (
              <div className="mt-3 flex items-start gap-2 rounded-xl bg-[#eafaf4] p-3">
                <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-primary" />
                <p className="text-[8.5px] leading-relaxed text-slate-500">
                  Pesanan ini langsung memotong stok produk dan membukukan pemasukan kas{' '}
                  <span className="font-semibold text-ink">{formatRupiah(total)}</span> ke
                  laporan harian {session.storeName}.
                </p>
              </div>
            )}
          </section>
        </aside>
      </div>

      {toast && (
        <div
          className={`fixed bottom-5 left-4 right-4 z-50 flex max-w-sm items-start gap-2.5 rounded-xl border p-3 shadow-lg sm:left-auto sm:right-5 ${
            toast.tone === 'success'
              ? 'border-[#bde8db] bg-[#f0fdf9]'
              : toast.tone === 'danger'
                ? 'border-[#fecaca] bg-[#fff7f7]'
                : 'border-line bg-white'
          }`}
          role="status"
        >
          {toast.tone === 'success' ? (
            <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" />
          ) : (
            <Info
              className={`mt-0.5 size-4 shrink-0 ${
                toast.tone === 'danger' ? 'text-[#b91c1c]' : 'text-slate-400'
              }`}
            />
          )}
          <p className="flex-1 text-[10px] leading-relaxed text-slate-600">{toast.message}</p>
          <button
            type="button"
            onClick={() => setToast(null)}
            aria-label="Tutup notifikasi"
            className="flex size-5 shrink-0 items-center justify-center rounded text-slate-400 transition hover:bg-slate-100 hover:text-ink"
          >
            <X className="size-3.5" />
          </button>
        </div>
      )}
    </div>
  )
}
