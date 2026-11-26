import { useEffect, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowRight,
  Banknote,
  Bell,
  Bike,
  Check,
  CheckCircle2,
  CircleX,
  ClipboardCopy,
  Clock,
  Info,
  MapPin,
  Maximize2,
  MessageCircle,
  Phone,
  Printer,
  ShieldCheck,
  StickyNote,
  Store,
  Truck,
  User,
  Wallet,
  X,
} from 'lucide-react'
import CancelOrderModal from '../../components/owner/CancelOrderModal'
import { getOwnerSession } from '../../lib/owner-auth'
import {
  getOwnerOrders,
  ownerFulfillmentLabels,
  ownerOrderStatusMeta,
  ownerPaymentStatusMeta,
  ownerStoreBankAccount,
  ownerStorePickupAddress,
  updateOwnerOrder,
  type OwnerOrder,
  type OwnerOrderFulfillment,
} from '../../lib/owner-order-data'
import { getOwnerProducts, type OwnerProduct } from '../../lib/owner-product-data'

type ToastTone = 'success' | 'info' | 'danger'
type Toast = { message: string; tone: ToastTone }
type StepState = 'done' | 'current' | 'todo' | 'danger'
type DetailStep = {
  title: string
  time?: string
  description: string
  state: StepState
}

const numberFormatter = new Intl.NumberFormat('id-ID')

const fulfillmentIcons: Record<OwnerOrderFulfillment, typeof Store> = {
  ambil: Store,
  'kurir-instan': Bike,
  'kurir-toko': Truck,
  dikirim: Truck,
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

function formatClock(iso: string) {
  const date = new Date(iso)
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(
    2,
    '0',
  )} WIB`
}

function formatLongDate(iso: string) {
  return new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(iso))
}

function formatShortDate(iso: string) {
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(iso))
}

function addMinutes(iso: string, minutes: number) {
  return new Date(new Date(iso).getTime() + minutes * 60_000).toISOString()
}

function getInitials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join('')
}

function getPhoneDigits(phone: string) {
  return phone.replace(/\D/g, '').replace(/^0/, '62')
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function buildTimeline(order: OwnerOrder): DetailStep[] {
  const totalQuantity = order.items.reduce((sum, item) => sum + item.qty, 0)
  const created: DetailStep = {
    title: 'Pesanan Masuk',
    time: formatClock(order.createdAt),
    description: `Dibuat oleh ${order.customerName} melalui web storefront. ${totalQuantity} stok produk berhasil dialokasikan.`,
    state: 'done',
  }

  if (order.status === 'dibatalkan') {
    return [
      created,
      {
        title: 'Pesanan Dibatalkan',
        description: order.cancelReason
          ? `Alasan: ${order.cancelReason}. Pembayaran ditandai batal.`
          : 'Pesanan dibatalkan oleh toko.',
        state: 'danger',
      },
    ]
  }

  const paid = order.paymentStatus === 'lunas'
  const paymentMethod = order.paymentMethod
  const paymentStep: DetailStep = paid
    ? {
        title: paymentMethod.startsWith('Transfer')
          ? 'Bukti Transfer Diverifikasi'
          : 'Pembayaran Diterima',
        time: formatClock(addMinutes(order.createdAt, 3)),
        description: `${paymentMethod} senilai ${formatRupiah(order.total)} telah diterima.`,
        state: 'done',
      }
    : {
        title: 'Pembayaran di Tempat',
        description: `Pelanggan membayar ${formatRupiah(order.total)} saat pesanan diserahkan.`,
        state: order.status === 'selesai' ? 'done' : 'todo',
      }

  const confirmationStep: DetailStep =
    order.status === 'pending'
      ? {
          title: 'Menunggu Konfirmasi Toko',
          description:
            'Menunggu verifikasi pembayaran dan persetujuan mulai produksi oleh toko.',
          state: 'current',
        }
      : {
          title: 'Pesanan Sedang Diproses',
          time: formatClock(addMinutes(order.createdAt, 10)),
          description:
            order.status === 'siap' || order.status === 'selesai'
              ? 'Pesanan telah selesai disiapkan oleh staf dapur.'
              : 'Pembayaran terverifikasi. Staf dapur mulai menyiapkan pesanan.',
          state: order.status === 'diproses' ? 'current' : 'done',
        }

  const pickup = order.fulfillment === 'ambil'
  const handoverStep: DetailStep = {
    title: pickup ? 'Siap Diambil di Toko' : 'Siap Dikirim ke Pelanggan',
    time:
      order.status === 'selesai' ? formatClock(addMinutes(order.createdAt, 40)) : undefined,
    description: pickup
      ? `Pelanggan mengambil pesanan di ${ownerStorePickupAddress}.`
      : 'Pesanan diserahkan ke kurir dan dalam perjalanan ke alamat pelanggan.',
    state:
      order.status === 'selesai' ? 'done' : order.status === 'siap' ? 'current' : 'todo',
  }

  const finishedStep: DetailStep = {
    title: 'Pesanan Selesai',
    time: order.status === 'selesai' ? formatClock(addMinutes(order.createdAt, 45)) : undefined,
    description: 'Pelanggan menerima pesanan. Pembayaran dilakukan di luar sistem.',
    state: order.status === 'selesai' ? 'done' : 'todo',
  }

  return [created, paymentStep, confirmationStep, handoverStep, finishedStep]
}

function buildOrderSummaryText(order: OwnerOrder, storeName: string) {
  const lines = [
    `Pesanan ${order.code} — ${storeName}`,
    `Pelanggan: ${order.customerName} (${order.customerPhone})`,
    `Pengiriman: ${ownerFulfillmentLabels[order.fulfillment]}`,
    '',
    ...order.items.map(
      (item) =>
        `- ${item.qty}x ${item.name} (${formatRupiah(item.unitPrice)}): ${formatRupiah(
          item.qty * item.unitPrice,
        )}`,
    ),
    '',
    `Total: ${formatRupiah(order.total)}`,
    `Pembayaran: ${order.paymentMethod} (${ownerPaymentStatusMeta[order.paymentStatus].label})`,
    `Status: ${ownerOrderStatusMeta[order.status].label}`,
  ]

  if (order.note) lines.push(`Catatan: ${order.note}`)
  if (order.cancelReason) lines.push(`Alasan batal: ${order.cancelReason}`)

  return lines.join('\n')
}

function buildWhatsAppMessage(order: OwnerOrder, storeName: string) {
  const statusLine =
    order.status === 'pending'
      ? 'sudah kami terima dan akan segera kami konfirmasi'
      : order.status === 'diproses'
        ? 'sedang kami siapkan'
        : order.status === 'siap'
          ? 'sudah siap untuk diserahkan'
          : order.status === 'selesai'
            ? 'sudah selesai kami proses'
            : 'telah dibatalkan'

  return `Halo Kak ${order.customerName}, terima kasih sudah memesan di ${storeName}.\n\nPesanan ${order.code} senilai ${formatRupiah(
    order.total,
  )} ${statusLine}.\n\nRincian: ${order.items
    .map((item) => `${item.qty}x ${item.name}`)
    .join(', ')}.\n\n${
    order.fulfillment === 'ambil'
      ? `Pesanan dapat diambil di ${ownerStorePickupAddress}.`
      : `Pesanan akan dikirim ke alamat yang terdaftar.`
  }\n\nSalam, ${storeName}`
}

function TransferProofMock({
  amount,
  bankName,
  large = false,
}: {
  amount: number
  bankName: string
  large?: boolean
}) {
  return (
    <div
      className={`relative overflow-hidden bg-gradient-to-br from-[#e8f0fb] via-[#f4f8fd] to-[#e3edf9] ${
        large ? 'h-[360px]' : 'h-[132px]'
      }`}
    >
      <div className="absolute inset-x-0 top-0 flex h-4 items-center gap-1 border-b border-white/80 bg-white/70 px-2">
        <span className="size-1 rounded-full bg-[#fca5a5]" />
        <span className="size-1 rounded-full bg-[#fcd34d]" />
        <span className="size-1 rounded-full bg-[#86efac]" />
        <span className="ml-auto h-1.5 w-10 rounded-full bg-slate-200" />
      </div>

      <div
        className={`absolute rotate-[-2deg] rounded-[3px] bg-white shadow-md ${
          large
            ? 'right-[6%] top-[16%] h-[68%] w-[66%] p-4'
            : 'right-[5%] top-[18%] h-[68%] w-[65%] p-1.5'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className={`font-bold text-ink ${large ? 'text-[11px]' : 'text-[4px]'}`}>
            Detail Pesanan
          </span>
          <span className={`text-slate-400 ${large ? 'text-[8px]' : 'text-[3px]'}`}>
            #RTS-2026
          </span>
        </div>
        <div className={`mt-1 border-t border-line ${large ? 'pt-2' : 'pt-1'}`}>
          <div className="flex items-center justify-between">
            <span className={`text-slate-400 ${large ? 'text-[8px]' : 'text-[3px]'}`}>
              Status
            </span>
            <span
              className={`font-semibold text-[#15803d] ${large ? 'text-[8px]' : 'text-[3px]'}`}
            >
              Transaksi Berhasil
            </span>
          </div>
          <div className={`mt-1 font-extrabold text-ink ${large ? 'text-[14px]' : 'text-[5px]'}`}>
            Rp{formatNumber(amount)}
          </div>
          <div className={`mt-1.5 ${large ? 'space-y-1.5' : 'space-y-0.5'}`}>
            {[70, 55, 63, 48].map((width, index) => (
              <div
                key={index}
                className={`${large ? 'h-1.5' : 'h-0.5'} rounded-full bg-slate-100`}
                style={{ width: `${width}%` }}
              />
            ))}
          </div>
          <div className={`mt-2 ${large ? 'space-y-2' : 'space-y-0.5'}`}>
            {[82, 74, 60].map((width, index) => (
              <div
                key={index}
                className={`${large ? 'h-2' : 'h-1'} rounded-sm bg-slate-50`}
                style={{ width: `${width}%` }}
              />
            ))}
          </div>
        </div>
      </div>

      <div
        className={`absolute rotate-[3deg] rounded-[10px] border-[3px] border-[#1f2937] bg-[#1f2937] shadow-xl ${
          large
            ? 'bottom-[-6%] left-[8%] h-[82%] w-[150px]'
            : 'bottom-[-8%] left-[7%] h-[84%] w-[48px]'
        }`}
      >
        <div className="flex h-full w-full flex-col overflow-hidden rounded-[7px] bg-white">
          <div className="flex items-center justify-between bg-[#f1f5f9] px-1 py-0.5">
            <span
              className={`font-bold text-[#1e3a8a] ${large ? 'text-[8px]' : 'text-[3px]'}`}
            >
              {bankName}
            </span>
            <span className="size-0.5 rounded-full bg-slate-400" />
          </div>
          <div
            className={`flex flex-1 flex-col items-center px-1 text-center ${
              large ? 'pt-6' : 'pt-1.5'
            }`}
          >
            <span
              className={`flex items-center justify-center rounded-full bg-[#d9f7ea] text-[#15803d] ${
                large ? 'size-9' : 'size-3'
              }`}
            >
              <Check className={large ? 'size-5' : 'size-2'} />
            </span>
            <p className={`mt-1 font-bold text-ink ${large ? 'text-[10px]' : 'text-[3px]'}`}>
              Transfer Berhasil
            </p>
            <p
              className={`mt-0.5 font-extrabold text-slate-700 ${
                large ? 'text-[13px]' : 'text-[4px]'
              }`}
            >
              Rp{formatNumber(amount)}
            </p>
            <div className="mt-1.5 flex w-full flex-col items-center gap-1">
              {[80, 65, 70].map((width, index) => (
                <span
                  key={index}
                  className={`${large ? 'h-1.5' : 'h-0.5'} rounded-full bg-slate-100`}
                  style={{ width: `${width}%` }}
                />
              ))}
            </div>
            <span
              className={`mt-auto rounded bg-[#1e3a8a] px-1 py-0.5 font-bold text-white ${
                large ? 'mb-4 text-[7px]' : 'mb-1 text-[2.5px]'
              }`}
            >
              {bankName}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function OwnerOrderDetailPage() {
  const { id } = useParams()
  const [session] = useState(getOwnerSession)
  const [allOrders] = useState<OwnerOrder[]>(getOwnerOrders)
  const [products] = useState<OwnerProduct[]>(getOwnerProducts)
  const [order, setOrder] = useState<OwnerOrder | null>(
    () => getOwnerOrders().find((item) => item.id === id) ?? null,
  )
  const [cancelOpen, setCancelOpen] = useState(false)
  const [proofOpen, setProofOpen] = useState(false)
  const [toast, setToast] = useState<Toast | null>(null)

  useEffect(() => {
    setOrder(getOwnerOrders().find((item) => item.id === id) ?? null)
  }, [id])

  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => setToast(null), 4000)
    return () => window.clearTimeout(timer)
  }, [toast])

  if (!session) {
    return <Navigate to="/" replace />
  }

  function showToast(message: string, tone: ToastTone = 'success') {
    setToast({ message, tone })
  }

  if (!order) {
    return (
      <div className="flex min-h-[calc(100vh-12rem)] items-center justify-center">
        <div className="w-full max-w-md rounded-2xl border border-line bg-white p-8 text-center shadow-[0_1px_2px_rgba(15,23,42,0.06)]">
          <span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-[#fef3c7] text-[#b45309]">
            <Info className="size-6" />
          </span>
          <h1 className="mt-4 text-xl font-extrabold tracking-tight text-ink">
            Pesanan tidak ditemukan
          </h1>
          <p className="mt-1.5 text-[12px] leading-relaxed text-slate-500">
            Pesanan ini mungkin sudah dihapus atau tautannya tidak lagi berlaku.
          </p>
          <Link
            to="/owner/pesanan"
            className="mt-5 inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-[11.5px] font-semibold text-white transition hover:bg-primary-hover"
          >
            <ArrowLeft className="size-4" />
            Kembali ke Daftar Pesanan
          </Link>
        </div>
      </div>
    )
  }

  const statusMeta = ownerOrderStatusMeta[order.status]
  const paymentMeta = ownerPaymentStatusMeta[order.paymentStatus]
  const FulfillmentIcon = fulfillmentIcons[order.fulfillment]
  const totalQuantity = order.items.reduce((sum, item) => sum + item.qty, 0)
  const timeline = buildTimeline(order)
  const isTransfer = order.paymentMethod.startsWith('Transfer')
  const bankName = isTransfer
    ? (order.paymentMethod.match(/\(([^)]+)\)/)?.[1] ?? ownerStoreBankAccount.bank)
    : null
  const paymentReference = `TRX-${bankName ?? 'KAS'}-${order.code.split('-').at(-1) ?? '001'}`
  const paymentHeaderClass =
    order.paymentStatus === 'lunas'
      ? 'bg-[#d9f7ea] text-[#15803d]'
      : order.paymentStatus === 'belum'
        ? 'bg-[#fbecc9] text-[#b45309]'
        : 'bg-[#fee2e2] text-[#b91c1c]'
  const paymentHeaderLabel =
    order.paymentStatus === 'lunas'
      ? 'Terverifikasi Toko'
      : order.paymentStatus === 'belum'
        ? 'Menunggu Verifikasi Toko'
        : 'Pembayaran Dibatalkan'
  const proofBadgeClass =
    order.paymentStatus === 'batal'
      ? 'bg-[#fee2e2] text-[#b91c1c]'
      : 'bg-[#d9f7ea] text-[#15803d]'
  const proofBadgeLabel =
    order.paymentStatus === 'batal' ? 'Dibatalkan' : 'Tergambar Jelas'
  const phoneDigits = getPhoneDigits(order.customerPhone)
  const canWhatsApp = phoneDigits.length >= 8
  const loyaltyCount = allOrders.filter(
    (item) => item.customerPhone === order.customerPhone,
  ).length
  const canCancel =
    order.status === 'pending' || order.status === 'diproses' || order.status === 'siap'
  const estimateTime = formatClock(addMinutes(order.createdAt, 30))

  const actionNote =
    order.status === 'pending'
      ? 'Pesanan ini membutuhkan konfirmasi toko untuk mulai dimasak dan dipersiapkan staf kitchen.'
      : order.status === 'diproses'
        ? 'Pesanan sedang disiapkan. Tandai selesai setelah pesanan diserahkan ke pelanggan.'
        : order.status === 'siap'
          ? 'Pesanan sudah siap. Serahkan ke pelanggan lalu tandai selesai.'
          : order.status === 'selesai'
            ? 'Pesanan selesai dan bersifat final. Tidak ada tindakan lanjutan yang diperlukan.'
            : 'Pesanan dibatalkan dan bersifat final. Hubungi tim Ratis jika perlu bantuan.'

  function handleProcess() {
    if (!order) return
    const next: OwnerOrder = { ...order, status: 'diproses' }
    updateOwnerOrder(next)
    setOrder(next)
    showToast(`Pesanan ${order.code} mulai diproses.`)
  }

  function handleComplete() {
    if (!order) return
    const next: OwnerOrder = { ...order, status: 'selesai' }
    updateOwnerOrder(next)
    setOrder(next)
    showToast(`Pesanan ${order.code} ditandai selesai.`)
  }

  function handleCancel(reason: string) {
    if (!order) return
    const next: OwnerOrder = {
      ...order,
      status: 'dibatalkan',
      cancelReason: reason,
      paymentStatus: 'batal',
    }
    updateOwnerOrder(next)
    setOrder(next)
    setCancelOpen(false)
    showToast(`Pesanan ${order.code} dibatalkan.`, 'info')
  }

  async function handleCopyInfo() {
    if (!order || !session) return
    try {
      await navigator.clipboard.writeText(buildOrderSummaryText(order, session.storeName))
      showToast('Info pesanan disalin ke clipboard.')
    } catch {
      showToast('Gagal menyalin info pesanan. Salin manual dari halaman ini.', 'danger')
    }
  }

  function handlePrintInvoice() {
    if (!order || !session) return
    const win = window.open('', '_blank', 'width=460,height=720')
    if (!win) {
      showToast('Popup diblokir browser. Izinkan popup untuk mencetak invoice.', 'danger')
      return
    }

    const itemRows = order.items
      .map(
        (item) => `<tr>
          <td>${escapeHtml(item.name)}${
            item.note ? `<div class="muted">${escapeHtml(item.note)}</div>` : ''
          }</td>
          <td class="right">${item.qty} x ${formatRupiah(item.unitPrice)}</td>
          <td class="right">${formatRupiah(item.qty * item.unitPrice)}</td>
        </tr>`,
      )
      .join('')

    win.document.write(`<!doctype html><html lang="id"><head><meta charset="utf-8" />
<title>Invoice ${escapeHtml(order.code)}</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: ui-sans-serif, system-ui, sans-serif; padding: 22px; color: #0f172a; font-size: 12px; }
  h1 { font-size: 17px; margin: 0; }
  h2 { font-size: 10px; letter-spacing: .08em; text-transform: uppercase; color: #64748b; margin: 18px 0 6px; }
  .center { text-align: center; }
  .muted { color: #64748b; font-size: 10px; }
  .row { display: flex; justify-content: space-between; gap: 12px; margin-top: 4px; }
  .divider { border-top: 1px solid #e2e8f0; margin: 12px 0; }
  table { width: 100%; border-collapse: collapse; }
  th { text-align: left; font-size: 9px; text-transform: uppercase; color: #64748b; border-bottom: 1px solid #e2e8f0; padding: 6px 0; }
  td { padding: 7px 0; border-bottom: 1px solid #f1f5f9; vertical-align: top; }
  .right { text-align: right; white-space: nowrap; }
  .total { font-size: 15px; font-weight: 700; }
  .box { background: #f7f9fc; border-radius: 8px; padding: 10px; }
  .badge { display: inline-block; padding: 2px 8px; border-radius: 999px; background: #dcfce7; color: #15803d; font-size: 10px; font-weight: 600; }
  .sign { margin-top: 36px; display: flex; justify-content: space-between; }
  .sign div { width: 45%; border-top: 1px solid #cbd5e1; padding-top: 6px; text-align: center; color: #64748b; font-size: 10px; }
</style></head><body>
  <div class="row">
    <div>
      <h1>${escapeHtml(session.storeName)}</h1>
      <div class="muted">${escapeHtml(ownerStorePickupAddress)}</div>
    </div>
    <div class="right">
      <strong>INVOICE / SURAT JALAN</strong>
      <div class="muted">${escapeHtml(order.code)}</div>
      <div class="muted">${formatLongDate(order.createdAt)} • ${formatClock(order.createdAt)}</div>
    </div>
  </div>
  <div class="divider"></div>
  <div class="row">
    <div>
      <h2 style="margin:0 0 4px">Pelanggan</h2>
      <strong>${escapeHtml(order.customerName)}</strong>
      <div class="muted">${escapeHtml(order.customerPhone)}</div>
      ${
        order.address
          ? `<div class="muted">${escapeHtml(order.address)}</div>`
          : '<div class="muted">Ambil di toko</div>'
      }
    </div>
    <div class="right">
      <h2 style="margin:0 0 4px">Pengiriman</h2>
      <strong>${escapeHtml(ownerFulfillmentLabels[order.fulfillment])}</strong>
      <div class="muted">${escapeHtml(order.paymentMethod)}</div>
      <span class="badge">${escapeHtml(ownerPaymentStatusMeta[order.paymentStatus].label)}</span>
    </div>
  </div>
  <h2>Rincian Item</h2>
  <table>
    <thead><tr><th>Produk</th><th class="right">Qty x Harga</th><th class="right">Subtotal</th></tr></thead>
    <tbody>${itemRows}</tbody>
  </table>
  <div class="row total" style="margin-top:10px"><span>Total</span><span>${formatRupiah(order.total)}</span></div>
  <div class="muted">Pembayaran dilakukan di luar sistem.</div>
  ${
    order.note
      ? `<div class="box" style="margin-top:12px"><strong>Catatan pelanggan</strong><div>${escapeHtml(
          order.note,
        )}</div></div>`
      : ''
  }
  ${
    order.cancelReason
      ? `<div class="box" style="margin-top:12px;color:#b91c1c"><strong>Pesanan dibatalkan</strong><div>Alasan: ${escapeHtml(
          order.cancelReason,
        )}</div></div>`
      : ''
  }
  <div class="sign">
    <div>Hormat kami, ${escapeHtml(session.storeName)}</div>
    <div>Penerima / Kurir</div>
  </div>
</body></html>`)
    win.document.close()
    win.focus()
    win.print()
  }

  const whatsAppMessage = buildWhatsAppMessage(order, session.storeName)
  const whatsAppLink = `https://wa.me/${phoneDigits}?text=${encodeURIComponent(
    whatsAppMessage,
  )}`

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[11px] text-slate-500">
          Detail Pesanan{' '}
          <span className="font-semibold text-slate-700">#{order.code}</span>
        </p>
        <Link
          to="/owner/pesanan"
          className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-[11.5px] font-semibold text-slate-600 transition hover:bg-white hover:text-primary"
        >
          <ArrowLeft className="size-4" />
          Kembali ke Daftar Pesanan
        </Link>
      </div>

      <section className="mt-3 rounded-2xl border border-line bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.06)] sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <h1 className="break-all text-[24px] font-extrabold tracking-tight text-ink sm:text-[27px]">
              Pesanan #{order.code}
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10.5px] font-semibold ${statusMeta.className}`}
              >
                <span className={`size-1.5 rounded-full ${statusMeta.dotClassName}`} />
                {statusMeta.label}
              </span>
              {order.isNew && (
                <span className="rounded-full bg-[#e6f9f0] px-2.5 py-1 text-[10px] font-semibold text-primary">
                  Pesanan Baru
                </span>
              )}
            </div>
            <div className="mt-2.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[11px] text-slate-500">
              <span className="flex items-center gap-1">
                <Clock className="size-3.5" />
                {formatLongDate(order.createdAt)} • {formatClock(order.createdAt)}
              </span>
              <span className="text-slate-300">•</span>
              <span>
                {order.items.length} Jenis Produk ({totalQuantity} Total Item)
              </span>
              <span className="text-slate-300">•</span>
              <span className="flex items-center gap-1">
                <FulfillmentIcon className="size-3.5" />
                {ownerFulfillmentLabels[order.fulfillment]}
              </span>
            </div>
          </div>

          <div className="flex w-full flex-col gap-2 sm:flex-row sm:flex-wrap lg:w-auto lg:justify-end">
            <button
              type="button"
              onClick={handleCopyInfo}
              className="inline-flex h-9 items-center justify-center gap-2 rounded-xl border border-line bg-white px-3.5 text-[11px] font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              <ClipboardCopy className="size-4 text-slate-500" />
              Salin Info Pesanan
            </button>
            <button
              type="button"
              onClick={handlePrintInvoice}
              className="inline-flex h-9 items-center justify-center gap-2 rounded-xl border border-line bg-white px-3.5 text-[11px] font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              <Printer className="size-4 text-slate-500" />
              Cetak Invoice / Surat Jalan
            </button>
            {canWhatsApp ? (
              <a
                href={whatsAppLink}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-9 items-center justify-center gap-2 rounded-xl bg-primary-soft/70 px-3.5 text-[11px] font-semibold text-primary transition hover:bg-primary-soft sm:order-last sm:w-full lg:w-auto"
              >
                <MessageCircle className="size-4" />
                Kirim Update WA
              </a>
            ) : (
              <span className="inline-flex h-9 items-center justify-center gap-2 rounded-xl bg-slate-100 px-3.5 text-[11px] font-semibold text-slate-400 sm:order-last sm:w-full lg:w-auto">
                <MessageCircle className="size-4" />
                Nomor WA belum tersedia
              </span>
            )}
          </div>
        </div>
      </section>

      <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1fr)_342px]">
        <div className="space-y-4">
          <section className="rounded-2xl border border-line bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.06)]">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="flex items-center gap-2 text-[13.5px] font-bold text-ink">
                <MapPin className="size-4 text-primary" />
                Informasi Pelanggan &amp; Pengambilan
              </h2>
              <span className="rounded-full bg-[#f1f5f9] px-2.5 py-1 text-[9.5px] font-semibold text-slate-500">
                {loyaltyCount > 1
                  ? `Pelanggan Setia • ${loyaltyCount}x Order`
                  : 'Pelanggan'}
              </span>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <div className="rounded-xl bg-[#f1f5f9] p-4">
                <div className="flex items-start gap-3">
                  <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-[#d9f7ea] text-[13px] font-extrabold text-primary">
                    {getInitials(order.customerName)}
                  </span>
                  <div className="min-w-0">
                    <p className="text-[13px] font-bold text-ink">{order.customerName}</p>
                    <a
                      href={`tel:${order.customerPhone.replace(/[^\d+]/g, '')}`}
                      className="mt-0.5 flex items-center gap-1 text-[10.5px] text-slate-500 transition hover:text-primary"
                    >
                      <Phone className="size-3" />
                      {order.customerPhone}
                    </a>
                  </div>
                </div>

                <div className="mt-3 flex items-center gap-2">
                  {canWhatsApp && (
                    <a
                      href={whatsAppLink}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-[#15803d] px-2.5 text-[10px] font-semibold text-white transition hover:bg-[#166534]"
                    >
                      <MessageCircle className="size-3.5" />
                      Chat WhatsApp
                    </a>
                  )}
                  <span className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-line bg-white px-2.5 text-[10px] font-semibold text-slate-600">
                    <User className="size-3.5" />
                    {order.fulfillment === 'ambil' ? 'Ambil sendiri' : 'Dikirim'}
                  </span>
                </div>

                <p className="mt-3 flex items-start gap-1.5 text-[10.5px] leading-relaxed text-slate-600">
                  <MapPin className="mt-0.5 size-3.5 shrink-0 text-slate-400" />
                  {order.address
                    ? `Alamat: ${order.address}`
                    : `Alamat pengambilan: ${ownerStorePickupAddress}`}
                </p>
              </div>

              <div className="rounded-xl border border-line bg-[#f8fafc] p-4">
                <p className="text-[9.5px] font-bold uppercase tracking-[0.07em] text-slate-500">
                  Metode Pengiriman / Serah Terima
                </p>
                <p className="mt-2 flex items-center gap-2 text-[12px] font-bold text-ink">
                  <FulfillmentIcon className="size-4 text-primary" />
                  {ownerFulfillmentLabels[order.fulfillment]}
                </p>
                <p className="mt-1 text-[10.5px] leading-relaxed text-slate-500">
                  {order.fulfillment === 'ambil'
                    ? `Lokasi pengambilan: ${ownerStorePickupAddress}.`
                    : order.address
                      ? `Dikirim ke: ${order.address}.`
                      : 'Alamat pengiriman belum dicantumkan.'}
                </p>
                <div className="mt-2.5 flex items-start gap-2 rounded-lg bg-[#fef3c7] px-2.5 py-2 text-[10px] leading-relaxed text-[#92400e]">
                  <Clock className="mt-0.5 size-3.5 shrink-0" />
                  {order.status === 'dibatalkan'
                    ? 'Pesanan dibatalkan. Informasi pengambilan tidak berlaku.'
                    : order.status === 'selesai'
                      ? 'Pesanan sudah diserahkan ke pelanggan.'
                      : `Estimasi siap: hari ini, ${estimateTime}.`}
                </div>
              </div>
            </div>

            {order.note && (
              <div className="mt-3 rounded-xl border border-[#cfe8e3] bg-[#eef9f6] p-4">
                <p className="flex items-center gap-1.5 text-[9.5px] font-bold uppercase tracking-[0.07em] text-primary">
                  <StickyNote className="size-3.5" />
                  Catatan Khusus dari Pelanggan
                </p>
                <p className="mt-2 text-[11px] italic leading-relaxed text-slate-600">
                  “{order.note}”
                </p>
              </div>
            )}

            {order.status === 'dibatalkan' && order.cancelReason && (
              <div className="mt-3 rounded-xl border border-[#f5c2c2] bg-[#fdf2f2] p-4">
                <p className="flex items-center gap-1.5 text-[9.5px] font-bold uppercase tracking-[0.07em] text-[#b91c1c]">
                  <CircleX className="size-3.5" />
                  Alasan Pembatalan
                </p>
                <p className="mt-2 text-[11px] leading-relaxed text-[#7f1d1d]">
                  {order.cancelReason}
                </p>
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-line bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.06)]">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="flex items-center gap-2 text-[13.5px] font-bold text-ink">
                <Wallet className="size-4 text-primary" />
                Rincian Item yang Dipesan
              </h2>
              <p className="text-[10.5px] font-medium text-slate-500">
                {order.items.length} Produk • {totalQuantity} Kuantitas
              </p>
            </div>

            <ul className="mt-3 divide-y divide-[#eef2f6]">
              {order.items.map((item, index) => {
                const product = products.find((entry) => entry.name === item.name)
                const tileClass = product
                  ? (categoryTiles[product.category] ?? 'bg-[#eef2ff] text-[#4f46e5]')
                  : 'bg-[#eef2ff] text-[#4f46e5]'
                return (
                  <li key={`${item.name}-${index}`} className="flex items-start gap-3 py-3">
                    <span
                      className={`flex size-12 shrink-0 items-center justify-center rounded-xl text-[12px] font-extrabold ${tileClass}`}
                    >
                      {getInitials(item.name)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[12px] font-bold leading-snug text-ink">
                        {item.name}
                      </p>
                      {item.note && (
                        <p className="mt-0.5 text-[10px] text-slate-500">{item.note}</p>
                      )}
                      {product && (
                        <p className="mt-0.5 flex items-center gap-1 text-[9.5px] text-slate-400">
                          <Check className="size-3 text-primary" />
                          Stok gudang tersisa {product.stock} {product.stockUnit}
                        </p>
                      )}
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-[10px] text-slate-500">
                        {formatRupiah(item.unitPrice)} × {item.qty}
                      </p>
                      <p className="mt-0.5 text-[12px] font-bold text-ink">
                        {formatRupiah(item.unitPrice * item.qty)}
                      </p>
                    </div>
                  </li>
                )
              })}
            </ul>

            <div className="mt-3 rounded-xl bg-[#f7f9fc] p-4">
              <div className="flex items-center justify-between gap-3 text-[11px] text-slate-600">
                <span>Subtotal Produk ({totalQuantity} item)</span>
                <span className="font-semibold text-ink">{formatRupiah(order.total)}</span>
              </div>
              <div className="mt-1.5 flex items-center justify-between gap-3 text-[11px] text-slate-600">
                <span>
                  {order.fulfillment === 'ambil'
                    ? 'Ongkos Kirim (Ambil di Toko)'
                    : 'Ongkos Kirim'}
                </span>
                <span className="font-semibold text-primary">
                  {order.fulfillment === 'ambil' ? 'Gratis (Rp0)' : 'Di luar sistem'}
                </span>
              </div>
              <div className="mt-2.5 flex items-end justify-between gap-3 border-t border-line pt-2.5">
                <div>
                  <p className="text-[12.5px] font-bold text-ink">Total Nilai Pesanan</p>
                  <p className="mt-0.5 text-[9.5px] text-slate-500">
                    Pembayaran dilakukan di luar sistem.
                  </p>
                </div>
                <p className="text-[22px] font-extrabold leading-none tracking-tight text-primary">
                  {formatRupiah(order.total)}
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-[#dfe6f5] bg-[#eef2fb] p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)] sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="flex items-center gap-2.5 text-[13.5px] font-bold text-ink">
                <span className="flex size-8 items-center justify-center rounded-lg bg-white text-[#0b3b3a] shadow-sm">
                  <Wallet className="size-4" />
                </span>
                Status Pembayaran &amp; Verifikasi Rekening
              </h2>
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[10px] font-semibold ${paymentHeaderClass}`}
              >
                <span className="size-1.5 rounded-full bg-current opacity-70" />
                {paymentHeaderLabel}
              </span>
            </div>

            <div className="mt-3.5 grid gap-3 md:grid-cols-2">
              <div className="rounded-xl bg-[#e7edfa] p-4">
                <p className="text-[9.5px] font-bold uppercase tracking-[0.08em] text-slate-600">
                  {isTransfer ? 'Rekening Tujuan Pembayaran Toko' : 'Metode Pembayaran'}
                </p>

                <div className="mt-2.5 flex items-center gap-3">
                  <span className="flex h-10 min-w-[54px] items-center justify-center rounded-lg bg-white px-2.5 text-[12px] font-extrabold text-[#0f766e] shadow-sm">
                    {isTransfer
                      ? bankName
                      : order.paymentMethod === 'QRIS Dinamis'
                        ? 'QRIS'
                        : 'KAS'}
                  </span>
                  <div className="min-w-0">
                    <p className="text-[16px] font-bold leading-tight tracking-tight text-ink">
                      {isTransfer
                        ? ownerStoreBankAccount.accountNumber
                        : order.paymentMethod}
                    </p>
                    <p className="mt-0.5 text-[10px] text-slate-500">
                      {isTransfer
                        ? `a.n ${session.storeName} (Usaha)`
                        : 'Pembayaran dilakukan di luar sistem.'}
                    </p>
                  </div>
                </div>

                <div className="mt-3 rounded-xl bg-white p-3.5 shadow-sm">
                  <dl className="space-y-2.5 text-[10.5px]">
                    <div className="flex items-center justify-between gap-3">
                      <dt className="text-slate-500">Metode</dt>
                      <dd className="text-right font-semibold text-ink">
                        {isTransfer ? 'Transfer Manual Bank' : order.paymentMethod}
                      </dd>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <dt className="text-slate-500">Nominal Dibayar</dt>
                      <dd className="text-right font-semibold text-ink">
                        {formatRupiah(order.total)}
                      </dd>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <dt className="text-slate-500">
                        {isTransfer ? 'Waktu Transfer' : 'Waktu Transaksi'}
                      </dt>
                      <dd className="text-right font-semibold text-ink">
                        {formatShortDate(order.createdAt)},{' '}
                        {formatClock(addMinutes(order.createdAt, 3))}
                      </dd>
                    </div>
                    {isTransfer && (
                      <div className="flex items-center justify-between gap-3">
                        <dt className="text-slate-500">Referensi</dt>
                        <dd className="text-right font-semibold text-ink">
                          {paymentReference}
                        </dd>
                      </div>
                    )}
                  </dl>
                </div>

                <p className="mt-3 flex items-start gap-1.5 text-[9.5px] leading-relaxed text-slate-500">
                  <Info className="mt-0.5 size-3.5 shrink-0" />
                  Sesuai PRD Ratis, transaksi dilakukan di luar sistem payment gateway.
                  Verifikasi saldo masuk pada mutasi m-banking Anda sebelum mengonfirmasi
                  pesanan.
                </p>
              </div>

              <div className="rounded-xl bg-[#e7edfa] p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-[9.5px] font-bold uppercase tracking-[0.08em] text-slate-600">
                    {isTransfer ? 'Bukti Transfer Pelanggan' : 'Status Pembayaran'}
                  </p>
                  {isTransfer ? (
                    <span
                      className={`rounded-full px-2.5 py-1 text-[9.5px] font-semibold ${proofBadgeClass}`}
                    >
                      {proofBadgeLabel}
                    </span>
                  ) : (
                    <span
                      className={`flex items-center gap-1 text-[9.5px] font-semibold ${paymentMeta.textClassName}`}
                    >
                      <span className={`size-1.5 rounded-full ${paymentMeta.dotClassName}`} />
                      {paymentMeta.label}
                    </span>
                  )}
                </div>

                {isTransfer ? (
                  <>
                    <div className="mt-2 overflow-hidden rounded-lg bg-white p-2 shadow-sm">
                      <TransferProofMock
                        amount={order.total}
                        bankName={bankName ?? ownerStoreBankAccount.bank}
                      />
                    </div>
                    <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2">
                      <p className="text-[9.5px] text-slate-500">
                        Ref:{' '}
                        <span className="font-semibold text-slate-700">
                          {paymentReference}
                        </span>
                      </p>
                      <button
                        type="button"
                        onClick={() => setProofOpen(true)}
                        className="inline-flex items-center gap-1 text-[9.5px] font-semibold text-primary transition hover:text-primary-hover"
                      >
                        <Maximize2 className="size-3.5" />
                        Lihat Ukuran Penuh
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="mt-2 flex min-h-[168px] flex-col items-center justify-center rounded-lg bg-white p-4 text-center shadow-sm">
                    <span className="flex size-10 items-center justify-center rounded-full bg-[#eef9f6] text-primary">
                      <Banknote className="size-5" />
                    </span>
                    <p className="mt-2 text-[11px] font-semibold text-ink">
                      {order.paymentStatus === 'lunas'
                        ? 'Pembayaran diterima'
                        : order.paymentStatus === 'batal'
                          ? 'Pembayaran dibatalkan'
                          : 'Pembayaran di tempat'}
                    </p>
                    <p className="mt-1 max-w-[220px] text-[9.5px] leading-relaxed text-slate-500">
                      {order.paymentStatus === 'lunas'
                        ? `Dibayar melalui ${order.paymentMethod}.`
                        : order.paymentStatus === 'batal'
                          ? 'Pesanan dibatalkan sebelum pembayaran diterima.'
                          : 'Pembayaran dilakukan saat pesanan diambil atau diserahkan.'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </section>

        </div>

        <div className="space-y-4 xl:sticky xl:top-[88px] xl:self-start">
          <section className="rounded-2xl border border-line bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.06)]">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-[13.5px] font-bold text-ink">Tindakan Pesanan</h2>
              <span
                className={`size-2 rounded-full ${
                  order.status === 'pending'
                    ? 'bg-[#f59e0b]'
                    : order.status === 'selesai'
                      ? 'bg-[#22c55e]'
                      : order.status === 'dibatalkan'
                        ? 'bg-[#ef4444]'
                        : 'bg-[#2563eb]'
                }`}
              />
            </div>

            <div className="mt-3 flex items-start gap-2 rounded-xl border border-line bg-[#f8fafc] p-3 text-[10.5px] leading-relaxed text-slate-600">
              <Bell className="mt-0.5 size-3.5 shrink-0 text-[#b45309]" />
              {actionNote}
            </div>

            {order.status === 'pending' && (
              <>
                <button
                  type="button"
                  onClick={handleProcess}
                  className="mt-3 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 text-[11.5px] font-semibold text-white shadow-sm transition hover:bg-primary-hover"
                >
                  <CheckCircle2 className="size-4" />
                  Terima &amp; Proses Pesanan
                </button>
                <p className="mt-2 text-center text-[9px] leading-relaxed text-slate-400">
                  Mengubah status ke &quot;Sedang Diproses&quot; dan menandai pesanan
                  siap disiapkan.
                </p>
              </>
            )}

            {(order.status === 'diproses' || order.status === 'siap') && (
              <>
                <button
                  type="button"
                  onClick={handleComplete}
                  className="mt-3 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 text-[11.5px] font-semibold text-white shadow-sm transition hover:bg-primary-hover"
                >
                  <CheckCircle2 className="size-4" />
                  Selesaikan Pesanan
                </button>
                <p className="mt-2 text-center text-[9px] leading-relaxed text-slate-400">
                  Menyelesaikan pesanan dan menutup alur transaksi. Status selesai
                  bersifat final.
                </p>
              </>
            )}

            {order.status === 'selesai' && (
              <div className="mt-3 flex items-start gap-2 rounded-xl border border-[#cfe8e3] bg-[#eef9f6] p-3 text-[10.5px] leading-relaxed text-primary">
                <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
                Pesanan sudah selesai. Pembayaran dilakukan di luar sistem.
              </div>
            )}

            {order.status === 'dibatalkan' && (
              <div className="mt-3 flex items-start gap-2 rounded-xl border border-[#f5c2c2] bg-[#fdf2f2] p-3 text-[10.5px] leading-relaxed text-[#b91c1c]">
                <CircleX className="mt-0.5 size-4 shrink-0" />
                Pesanan sudah dibatalkan dan tidak dapat diproses kembali.
              </div>
            )}

            {canCancel && (
              <button
                type="button"
                onClick={() => setCancelOpen(true)}
                className="mt-3 inline-flex h-9 w-full items-center justify-center gap-2 rounded-xl border border-[#f5c2c2] bg-white px-3 text-[10.5px] font-semibold text-[#dc2626] transition hover:bg-red-50"
              >
                <CircleX className="size-3.5" />
                Tolak / Batalkan Pesanan Ini
              </button>
            )}

            <p className="mt-3 flex items-start gap-1.5 border-t border-line pt-2.5 text-[9px] leading-relaxed text-slate-400">
              <ShieldCheck className="mt-0.5 size-3.5 shrink-0" />
              Perubahan status tercatat pada riwayat pesanan toko.
            </p>
          </section>

          <section className="rounded-2xl border border-line bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.06)]">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-[13.5px] font-bold text-ink">
                Riwayat &amp; Alur Pesanan
              </h2>
              <Info className="size-3.5 text-slate-400" />
            </div>

            <ol className="mt-3.5">
              {timeline.map((step, index) => (
                <li
                  key={`${step.title}-${index}`}
                  className="relative flex gap-3 pb-4 last:pb-0"
                >
                  {index < timeline.length - 1 && (
                    <span className="absolute bottom-0 left-[9px] top-[22px] w-px bg-line" />
                  )}
                  <span
                    className={`relative z-10 mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full ${
                      step.state === 'done'
                        ? 'bg-primary text-white'
                        : step.state === 'danger'
                          ? 'bg-[#fee2e2] text-[#dc2626]'
                          : step.state === 'current'
                            ? 'bg-[#fef3c7] text-[#d97706] ring-2 ring-[#fde68a]'
                            : 'bg-slate-100 text-slate-400'
                    }`}
                  >
                    {step.state === 'done' ? (
                      <Check className="size-3" />
                    ) : step.state === 'danger' ? (
                      <X className="size-3" />
                    ) : (
                      <span
                        className={`size-1.5 rounded-full ${
                          step.state === 'current' ? 'bg-[#d97706]' : 'bg-slate-300'
                        }`}
                      />
                    )}
                  </span>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <p
                        className={`text-[11px] leading-snug ${
                          step.state === 'todo'
                            ? 'font-medium text-slate-400'
                            : 'font-semibold text-ink'
                        }`}
                      >
                        {step.title}
                      </p>
                      {step.time && (
                        <span className="text-[9px] font-medium text-slate-400">
                          {step.time}
                        </span>
                      )}
                      {step.state === 'current' && (
                        <span className="rounded bg-[#fef3c7] px-1.5 py-0.5 text-[8px] font-bold text-[#b45309]">
                          KINI
                        </span>
                      )}
                    </div>
                    <p
                      className={`mt-0.5 text-[9.5px] leading-relaxed ${
                        step.state === 'todo' ? 'text-slate-400' : 'text-slate-500'
                      }`}
                    >
                      {step.description}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          <section className="rounded-2xl border border-[#dbe3f4] bg-[#eef2ff]/70 p-5">
            <h2 className="flex items-center gap-2 text-[12px] font-bold text-ink">
              <ShieldCheck className="size-4 text-[#3b5bdb]" />
              Kebijakan Operasional UMKM
            </h2>
            <p className="mt-2 text-[10px] leading-relaxed text-slate-600">
              Jika pelanggan tidak kunjung membayar atau mengonfirmasi hingga 3 jam
              setelah pemesanan (17:00 WIB), hubungi tim Bantuan Ratis untuk pendampingan
              verifikasi pesanan.
            </p>
            <Link
              to="/owner/bantuan"
              className="mt-3 inline-flex items-center gap-1.5 text-[10px] font-semibold text-[#3b5bdb] transition hover:text-[#2f4ac4]"
            >
              Buka Panduan Penanganan Pesanan
              <ArrowRight className="size-3.5" />
            </Link>
          </section>
        </div>
      </div>

      {proofOpen && (
        <div className="fixed inset-0 z-[75] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
            onClick={() => setProofOpen(false)}
            aria-hidden
          />
          <div
            role="dialog"
            aria-modal="true"
            className="relative z-10 w-full max-w-2xl rounded-2xl bg-white p-4 shadow-2xl sm:p-5"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[9.5px] font-bold uppercase tracking-[0.08em] text-slate-500">
                  Bukti Transfer Pelanggan
                </p>
                <p className="mt-0.5 text-[12px] font-bold text-ink">
                  {order.customerName} • {formatRupiah(order.total)}
                </p>
                <p className="text-[10px] text-slate-500">Ref: {paymentReference}</p>
              </div>
              <button
                type="button"
                onClick={() => setProofOpen(false)}
                aria-label="Tutup bukti transfer"
                className="flex size-8 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="size-4" />
              </button>
            </div>
            <div className="mt-3 overflow-hidden rounded-xl border border-line">
              <TransferProofMock
                amount={order.total}
                bankName={bankName ?? ownerStoreBankAccount.bank}
                large
              />
            </div>
            <p className="mt-2 text-[9.5px] leading-relaxed text-slate-500">
              Pratinjau bukti transfer yang diunggah pelanggan. Verifikasi nominal dan
              waktu pada mutasi rekening toko sebelum mengonfirmasi pesanan.
            </p>
          </div>
        </div>
      )}

      {cancelOpen && (
        <CancelOrderModal
          order={order}
          onClose={() => setCancelOpen(false)}
          onConfirm={handleCancel}
        />
      )}

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
    </div>
  )
}
