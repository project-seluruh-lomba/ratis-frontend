import { useMemo, useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowDownToLine,
  ArrowUpRight,
  BadgeCheck,
  Check,
  CircleMinus,
  EyeOff,
  Image as ImageIcon,
  Info,
  Minus,
  Package,
  Pencil,
  Plus,
  PencilLine,
  ShieldAlert,
  ShieldCheck,
  Store,
  TrendingUp,
  X,
} from 'lucide-react'
import StockAdjustModal, {
  type StockAdjustPayload,
} from '../../components/owner/StockAdjustModal'
import { getOwnerSession } from '../../lib/owner-auth'
import {
  getOwnerProducts,
  getProductStockStatus,
  stockStatusMeta,
  updateOwnerProduct,
  type OwnerProduct,
} from '../../lib/owner-product-data'

type LogCategory = 'penjualan' | 'restock' | 'penyesuaian'

type StockLog = {
  id: string
  date: string
  time: string
  type: string
  delta: number
  category: LogCategory
  reference: string
  note: string[]
  actor: string
  actorRole: string
}

type LogFilter = 'semua' | LogCategory

const logFilters: { key: LogFilter; label: string }[] = [
  { key: 'semua', label: 'Semua Mutasi' },
  { key: 'penjualan', label: 'Penjualan' },
  { key: 'restock', label: 'Restock Masuk' },
  { key: 'penyesuaian', label: 'Penyesuaian' },
]

const baseLogs: Omit<StockLog, 'id'>[] = [
  {
    date: '23 Nov 2026',
    time: '10.15 WIB',
    type: 'Pesanan Baru',
    delta: -2,
    category: 'penjualan',
    reference: '#RTS-20261123-001',
    note: ['Pelanggan: Siti Rahmawati', '(Alokasi Antar)'],
    actor: 'Sistem Toko',
    actorRole: 'Otomatis',
  },
  {
    date: '22 Nov 2026',
    time: '08.30 WIB',
    type: 'Produksi Masuk',
    delta: 10,
    category: 'restock',
    reference: 'Batch Produksi Pagi',
    note: ['Kloter Wisman #B-044', '(Lolos Uji Wangi)'],
    actor: 'Bu Sari',
    actorRole: 'Pemilik',
  },
  {
    date: '20 Nov 2026',
    time: '16.45 WIB',
    type: 'Kasir Toko (POS)',
    delta: -11,
    category: 'penjualan',
    reference: '#RTS-20261120-004',
    note: ['Pembelian langsung', 'tunai di outlet'],
    actor: 'Rina',
    actorRole: 'Kasir',
  },
  {
    date: '19 Nov 2026',
    time: '14.00 WIB',
    type: 'Quality Check',
    delta: -1,
    category: 'penyesuaian',
    reference: 'Tester & Display Etalase',
    note: ['Pemotongan tester', 'cicip tamu pameran'],
    actor: 'Bu Sari',
    actorRole: 'Pemilik',
  },
  {
    date: '18 Nov 2026',
    time: '09.00 WIB',
    type: 'Restorasi Batal',
    delta: 2,
    category: 'penyesuaian',
    reference: '#RTS-20261118-009',
    note: ['Dibatalkan pembeli via', 'WhatsApp Toko'],
    actor: 'Sistem Toko',
    actorRole: 'Otomatis',
  },
]

const logTone: Record<LogCategory, string> = {
  penjualan: 'bg-[#fde7e7] text-[#dc2626]',
  restock: 'bg-[#d9f7ea] text-primary',
  penyesuaian: 'bg-[#e8ecfd] text-[#4338ca]',
}

const numberFormatter = new Intl.NumberFormat('id-ID')

function formatNumber(value: number) {
  return numberFormatter.format(value)
}

function getInitials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join('')
}

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean
  onChange: (value: boolean) => void
  label: string
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-11 shrink-0 rounded-full transition ${
        checked ? 'bg-primary' : 'bg-slate-300'
      }`}
    >
      <span
        className={`absolute top-0.5 size-5 rounded-full bg-white shadow-sm transition ${
          checked ? 'left-[22px]' : 'left-0.5'
        }`}
      />
    </button>
  )
}

export default function OwnerProductDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [session] = useState(getOwnerSession)
  const [product, setProduct] = useState<OwnerProduct | undefined>(() =>
    getOwnerProducts().find((item) => item.id === id),
  )
  const [filter, setFilter] = useState<LogFilter>('semua')
  const [stockModal, setStockModal] = useState<'tambah' | 'kurangi' | null>(null)
  const [manualLogs, setManualLogs] = useState<Omit<StockLog, 'id' | 'after' | 'before'>[]>([])
  const [etalase, setEtalase] = useState(product?.etalase === 'aktif')
  const [stockProtection, setStockProtection] = useState(true)
  const [preOrder, setPreOrder] = useState(true)
  const [toast, setToast] = useState<string | null>(null)

  const logs = useMemo(() => {
    if (!product) return []
    let running = product.stock
    return [...manualLogs, ...baseLogs].map((log, index) => {
      const after = Math.max(0, running)
      const before = Math.max(0, after - log.delta)
      running = before
      return { ...log, id: `${log.reference}-${index}`, after, before }
    })
  }, [product, manualLogs])

  const filteredLogs = filter === 'semua' ? logs : logs.filter((log) => log.category === filter)

  if (!session) {
    return <Navigate to="/" replace />
  }

  if (!product) {
    return (
      <div className="rounded-2xl border border-line bg-white p-10 text-center shadow-[0_1px_2px_rgba(15,23,42,0.06)]">
        <span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-primary-soft/50 text-primary">
          <Package className="size-6" />
        </span>
        <h1 className="mt-4 text-[18px] font-extrabold text-ink">Produk tidak ditemukan</h1>
        <p className="mt-1 text-[12px] text-slate-500">
          Produk mungkin sudah dihapus atau tautannya tidak lagi berlaku.
        </p>
        <Link
          to="/owner/produk"
          className="mt-4 inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-4 text-[11.5px] font-semibold text-white transition hover:bg-primary-hover"
        >
          <ArrowLeft className="size-4" />
          Kembali ke Katalog Produk
        </Link>
      </div>
    )
  }

  const status = getProductStockStatus(product)
  const statusMeta = stockStatusMeta[status]
  const hpp = Math.round(product.price * 0.63)
  const margin = product.price > 0 ? ((product.price - hpp) / product.price) * 100 : 0
  const quota = Math.max(product.minStock * 6, product.stock, 1)
  const quotaPercent = Math.min(100, Math.round((product.stock / quota) * 100))
  const locked = Math.min(2, product.stock)
  const available = Math.max(0, product.stock - locked)
  const dailyAverage = (product.sold / 30).toFixed(1)
  const lifetimeRevenue = product.sold * product.price

  const description =
    product.description ??
    `${product.name} dibuat segar setiap hari dengan bahan pilihan dan tanpa pengawet buatan. Tekstur lembut, rasa manis yang pas, cocok untuk hantaran perayaan dan hampers keluarga. Disajikan dalam kemasan ${product.detail}.`

  function showToast(message: string) {
    setToast(message)
    window.setTimeout(() => setToast(null), 3500)
  }

  function handleAdjustStock({ mode, amount, reason, note }: StockAdjustPayload) {
    if (!product || !session) return
    const delta = mode === 'tambah' ? amount : -amount
    const now = new Date()
    const months = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'Mei',
      'Jun',
      'Jul',
      'Agu',
      'Sep',
      'Okt',
      'Nov',
      'Des',
    ]
    const time = `${String(now.getHours()).padStart(2, '0')}.${String(
      now.getMinutes(),
    ).padStart(2, '0')} WIB`

    const nextProduct = { ...product, stock: Math.max(0, product.stock + delta) }
    setProduct(nextProduct)
    updateOwnerProduct(nextProduct)
    setManualLogs((current) => [
      {
        date: `${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`,
        time,
        type: mode === 'tambah' ? 'Produksi Masuk' : 'Koreksi Stok',
        delta,
        category: mode === 'tambah' ? 'restock' : 'penyesuaian',
        reference: reason,
        note: note ? [note] : [],
        actor: session.name,
        actorRole: 'Pemilik',
      },
      ...current,
    ])
    showToast(
      `Stok ${product.name} diperbarui ${delta > 0 ? '+' : ''}${delta} ${product.stockUnit}.`,
    )
    setStockModal(null)
  }

  function handleDownloadLog() {
    if (!product) return
    const header = ['Tanggal', 'Waktu', 'Aktivitas', 'Perubahan', 'Sisa Stok', 'Referensi', 'Pelaku']
    const rows = logs.map((log) => [
      log.date,
      log.time,
      log.type,
      `${log.delta > 0 ? '+' : ''}${log.delta} ${product.stockUnit}`,
      `${log.after} ${product.stockUnit}`,
      `${log.reference} ${log.note.join(' ')}`.trim(),
      `${log.actor} (${log.actorRole})`,
    ])
    const csv = [header, ...rows]
      .map((row) => row.map((cell) => `"${cell.replaceAll('"', '""')}"`).join(';'))
      .join('\r\n')
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `rekap-mutasi-${product.sku.toLowerCase()}.csv`
    document.body.appendChild(anchor)
    anchor.click()
    anchor.remove()
    URL.revokeObjectURL(url)
    showToast('Rekap mutasi stok berhasil diunduh.')
  }

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <p className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500">
          <Link to="/owner/dashboard" className="transition hover:text-primary">
            Ratis Bisnis
          </Link>
          <span className="text-slate-300">/</span>
          <Link to="/owner/produk" className="transition hover:text-primary">
            Produk &amp; Stok
          </Link>
          <span className="text-slate-300">/</span>
          <span className="font-semibold text-ink">{product.name}</span>
        </p>

        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold ${
              etalase ? 'bg-[#d9f7ea] text-primary' : 'bg-slate-100 text-slate-600'
            }`}
          >
            <span className={`size-1.5 rounded-full ${etalase ? 'bg-primary' : 'bg-slate-400'}`} />
            {etalase ? 'Aktif di Etalase' : 'Nonaktif di Etalase'}
          </span>
          <span className="rounded-full border border-line bg-white px-2.5 py-1 text-[10px] font-medium text-slate-600">
            Kategori: {product.category}
          </span>
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <button
            type="button"
            onClick={() => navigate('/owner/produk')}
            aria-label="Kembali ke katalog produk"
            className="mt-1 flex size-9 shrink-0 items-center justify-center rounded-xl border border-line bg-white text-slate-600 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition hover:bg-slate-50"
          >
            <ArrowLeft className="size-4" />
          </button>
          <div className="min-w-0">
            <h1 className="text-[22px] font-extrabold leading-tight tracking-tight text-ink sm:text-[26px]">
              {product.name}
            </h1>
            <p className="mt-1 text-[11.5px] text-slate-500">
              Pencatatan {session.storeName} <span className="mx-1 text-slate-300">•</span>
              Terakhir dimutasi: Hari ini, 10.15 WIB
            </p>
            <p className="mt-2 text-[10.5px] font-semibold uppercase tracking-[0.06em] text-slate-400">
              SKU: {product.sku}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
          <Link
            to="/owner/pratinjau"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-line bg-white px-3.5 text-[11.5px] font-semibold text-slate-700 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition hover:bg-slate-50"
          >
            <ArrowUpRight className="size-4 text-slate-500" />
            Pratinjau di Toko
          </Link>
          <button
            type="button"
            onClick={() => setStockModal('tambah')}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-line bg-white px-3.5 text-[11.5px] font-semibold text-slate-700 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition hover:bg-slate-50"
          >
            <PencilLine className="size-4 text-slate-500" />
            Sesuaikan Stok
          </button>
          <button
            type="button"
            onClick={() => navigate(`/owner/produk?edit=${product.id}`)}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#0b3b3a] px-3.5 text-[11.5px] font-semibold text-white shadow-sm transition hover:bg-primary-hover"
          >
            <Pencil className="size-4" />
            Ubah Produk
          </button>
        </div>
      </div>

      <div className="mt-5 grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_336px]">
        <div className="space-y-4">
          <section className="rounded-2xl border border-line bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.06)] sm:p-5">
            <div className="grid gap-5 lg:grid-cols-[240px_minmax(0,1fr)]">
              <div>
                <div className="relative aspect-square overflow-hidden rounded-xl border border-line bg-gradient-to-br from-[#f7e8d2] via-[#eed7b7] to-[#dcc09b]">
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 text-[#8a5a2b]">
                    <span className="text-[34px] font-extrabold tracking-tight text-[#7a4a1d]/70">
                      {getInitials(product.name)}
                    </span>
                    <ImageIcon className="size-4 opacity-60" />
                  </div>
                  <span className="absolute left-2.5 top-2.5 inline-flex items-center gap-1 rounded-full bg-white/90 px-2 py-0.5 text-[9px] font-semibold text-ink shadow-sm">
                    Foto Utama
                  </span>
                  <span className="absolute bottom-2.5 right-2.5 rounded-md bg-[#0b3b3a]/80 px-2 py-0.5 text-[9px] font-semibold text-white">
                    20 × 20 cm
                  </span>
                </div>
                <div className="mt-2.5 flex items-center gap-2">
                  {[0, 1].map((index) => (
                    <span
                      key={index}
                      className="flex size-16 items-center justify-center rounded-lg border border-line bg-gradient-to-br from-[#f7e8d2] to-[#e6cba8] text-[10px] font-bold text-[#8a5a2b]"
                    >
                      {getInitials(product.name).slice(0, 1)}
                      {index + 1}
                    </span>
                  ))}
                  <span className="flex size-16 items-center justify-center rounded-lg border border-dashed border-[#cfd8e3] bg-[#f7f9fc] text-slate-400">
                    <ImageIcon className="size-4" />
                  </span>
                </div>
              </div>

              <div className="min-w-0">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <p className="text-[9.5px] font-semibold uppercase tracking-[0.12em] text-[#b45309]">
                    Koleksi {product.category}
                  </p>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-[#cfe8e3] bg-[#eaf7f4] px-2.5 py-1 text-[9.5px] font-semibold text-primary">
                    <BadgeCheck className="size-3" />
                    Bahan pilihan &amp; higienis
                  </span>
                </div>

                <h2 className="mt-1.5 text-[19px] font-extrabold leading-snug tracking-tight text-ink">
                  {product.name}
                </h2>
                <p className="mt-1 flex flex-wrap items-center gap-x-1.5 text-[10px] text-slate-500">
                  <span>SKU: {product.sku}</span>
                  <span className="text-slate-300">•</span>
                  <span>Dibuat: 12 Jan 2026</span>
                  <span className="text-slate-300">•</span>
                  <span>Diperbarui: 20 Mei 2026</span>
                </p>

                <div className="mt-3 grid gap-3 rounded-xl border border-[#eef2f6] bg-[#f8fafc] p-3.5 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] sm:items-center">
                  <div>
                    <p className="text-[9px] font-semibold uppercase tracking-[0.06em] text-slate-500">
                      Harga Jual Konsumen
                    </p>
                    <p className="mt-1 flex flex-wrap items-baseline gap-1">
                      <span className="text-[11px] font-semibold text-slate-500">Rp</span>
                      <span className="text-[24px] font-extrabold leading-none tracking-tight text-ink">
                        {formatNumber(product.price)}
                      </span>
                      <span className="text-[10.5px] text-slate-500">/ {product.stockUnit}</span>
                    </p>
                  </div>
                  <div className="sm:border-l sm:border-[#e6ecf3] sm:pl-3">
                    <p className="text-[9px] font-semibold uppercase tracking-[0.06em] text-slate-500">
                      Estimasi HPP Bahan
                    </p>
                    <p className="mt-1 flex items-baseline gap-1">
                      <span className="text-[10.5px] font-semibold text-slate-500">Rp</span>
                      <span className="text-[17px] font-extrabold leading-none tracking-tight text-ink">
                        {formatNumber(hpp)}
                      </span>
                    </p>
                  </div>
                  <span className="inline-flex w-fit items-center gap-1 rounded-lg bg-[#d9f7ea] px-2.5 py-1.5 text-[11px] font-bold text-primary">
                    <TrendingUp className="size-3.5" />
                    Margin {margin.toFixed(1)}%
                  </span>
                </div>

                <p className="mt-4 text-[9.5px] font-semibold uppercase tracking-[0.08em] text-slate-500">
                  Deskripsi Produk
                </p>
                <p className="mt-1 text-[11.5px] leading-relaxed text-slate-600">{description}</p>

                <div className="mt-3 flex flex-wrap gap-1.5">
                  {[
                    `Satuan jual ${product.stockUnit}`,
                    'Kemasan siap kirim',
                    'Berat bersih: ±1.200 gram',
                  ].map((chip) => (
                    <span
                      key={chip}
                      className="inline-flex items-center gap-1 rounded-lg bg-[#eef2fb] px-2 py-1 text-[9.5px] font-medium text-[#4338ca]"
                    >
                      <Check className="size-2.5" />
                      {chip}
                    </span>
                  ))}
                </div>

                <div className="mt-4 rounded-xl border border-[#e2e8f0] bg-[#f4f7fb] p-3.5">
                  <p className="flex items-center gap-1.5 text-[11px] font-bold text-ink">
                    <Info className="size-3.5 shrink-0 text-primary" />
                    Status Riwayat Penjualan &amp; Kebijakan Audit
                  </p>
                  <p className="mt-1.5 text-[10.5px] leading-relaxed text-slate-600">
                    Produk ini telah terjual {product.sold} {product.soldUnit} ({product.soldPeriod}).
                    Sesuai standar operasional Ratis Bisnis, produk dengan riwayat transaksi terkunci
                    dari penghapusan permanen guna menjaga validitas pembukuan kas, rekap pajak, dan
                    jejak audit kasir.
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-line bg-white shadow-[0_1px_2px_rgba(15,23,42,0.06)]">
            <div className="flex flex-col gap-3 border-b border-[#eef2f6] px-5 pb-4 pt-5 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <h2 className="text-[14px] font-extrabold tracking-tight text-ink">
                  Riwayat Pergerakan Stok
                </h2>
                <p className="mt-0.5 text-[11px] leading-relaxed text-slate-500">
                  Seluruh log penambahan, penjualan fisik, dan penyesuaian resep tercatat otomatis
                </p>
              </div>
              <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-[#cfe8e3] bg-[#eaf7f4] px-2.5 py-1 text-[9.5px] font-semibold text-primary">
                <ShieldCheck className="size-3" />
                Audit Mutasi
              </span>
            </div>

            <div className="flex flex-wrap gap-2 px-5 py-3">
              {logFilters.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setFilter(item.key)}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[10.5px] font-semibold transition ${
                    filter === item.key
                      ? 'border-[#0b3b3a] bg-[#0b3b3a] text-white'
                      : 'border-line bg-white text-slate-600 hover:border-slate-300 hover:text-ink'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            {filteredLogs.length === 0 ? (
              <div className="px-5 py-10 text-center">
                <p className="text-[12px] font-semibold text-ink">Belum ada mutasi pada kategori ini</p>
                <p className="mt-1 text-[11px] text-slate-500">
                  Coba pilih kategori lain atau lihat semua mutasi.
                </p>
              </div>
            ) : (
              <>
                <div className="hidden overflow-x-auto lg:block">
                  <table className="w-full min-w-[760px] border-collapse">
                    <thead>
                      <tr className="bg-[#f4f7fb] text-left text-[9px] font-semibold uppercase tracking-[0.08em] text-slate-500">
                        <th className="px-4 py-2.5">Waktu &amp; Tanggal</th>
                        <th className="px-3 py-2.5">Aktivitas / Jenis</th>
                        <th className="px-3 py-2.5">Perubahan</th>
                        <th className="px-3 py-2.5">Sisa Stok Fisik</th>
                        <th className="px-3 py-2.5">Keterangan &amp; Dokumen Referensi</th>
                        <th className="px-3 py-2.5">Penanggung Jawab</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredLogs.map((log) => (
                        <tr key={log.id} className="border-t border-[#eef2f6] align-top">
                          <td className="px-4 py-4">
                            <p className="text-[11.5px] font-semibold text-ink">{log.date}</p>
                            <p className="mt-0.5 text-[10px] text-slate-500">{log.time}</p>
                          </td>
                          <td className="px-3 py-4">
                            <span
                              className={`inline-flex items-center rounded-full px-2.5 py-1 text-[9.5px] font-semibold ${logTone[log.category]}`}
                            >
                              {log.type}
                            </span>
                          </td>
                          <td className="px-3 py-4">
                            <span
                              className={`text-[12.5px] font-bold ${
                                log.delta > 0 ? 'text-primary' : 'text-[#dc2626]'
                              }`}
                            >
                              {log.delta > 0 ? '+' : ''}
                              {log.delta} {product.stockUnit}
                            </span>
                          </td>
                          <td className="px-3 py-4">
                            <p className="text-[12.5px] font-bold text-ink">
                              {log.after} {product.stockUnit}
                            </p>
                            <p className="mt-0.5 text-[10px] text-slate-500">dari {log.before}</p>
                          </td>
                          <td className="px-3 py-4">
                            <p className="text-[10.5px] font-semibold text-[#4338ca]">
                              {log.reference}
                            </p>
                            {log.note.map((line) => (
                              <p key={line} className="text-[10px] leading-relaxed text-slate-500">
                                {line}
                              </p>
                            ))}
                          </td>
                          <td className="px-3 py-4">
                            <p className="text-[10.5px] font-semibold text-ink">{log.actor}</p>
                            <p className="mt-0.5 text-[10px] text-slate-500">({log.actorRole})</p>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <ul className="divide-y divide-[#eef2f6] lg:hidden">
                  {filteredLogs.map((log) => (
                    <li key={log.id} className="p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-[11.5px] font-semibold text-ink">{log.date}</p>
                          <p className="text-[10px] text-slate-500">{log.time}</p>
                        </div>
                        <span
                          className={`rounded-full px-2.5 py-1 text-[9.5px] font-semibold ${logTone[log.category]}`}
                        >
                          {log.type}
                        </span>
                      </div>
                      <div className="mt-2 flex items-center justify-between gap-2 rounded-lg bg-[#f8fafc] px-3 py-2">
                        <span
                          className={`text-[12.5px] font-bold ${
                            log.delta > 0 ? 'text-primary' : 'text-[#dc2626]'
                          }`}
                        >
                          {log.delta > 0 ? '+' : ''}
                          {log.delta} {product.stockUnit}
                        </span>
                        <span className="text-[10.5px] text-slate-500">
                          Sisa{' '}
                          <span className="font-semibold text-ink">
                            {log.after} {product.stockUnit}
                          </span>{' '}
                          dari {log.before}
                        </span>
                      </div>
                      <p className="mt-2 text-[10.5px] font-semibold text-[#4338ca]">
                        {log.reference}
                      </p>
                      {log.note.map((line) => (
                        <p key={line} className="text-[10px] leading-relaxed text-slate-500">
                          {line}
                        </p>
                      ))}
                      <p className="mt-1.5 text-[10px] text-slate-500">
                        {log.actor} ({log.actorRole})
                      </p>
                    </li>
                  ))}
                </ul>
              </>
            )}

            <div className="flex flex-col gap-2 border-t border-line px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-[10.5px] text-slate-500">
                Menampilkan {filteredLogs.length} aktivitas terbaru dari 34 catatan audit mutasi.
              </p>
              <button
                type="button"
                onClick={handleDownloadLog}
                className="inline-flex w-fit items-center gap-1.5 text-[10.5px] font-semibold text-primary transition hover:text-primary-hover"
              >
                <ArrowDownToLine className="size-3.5" />
                Unduh Rekap Mutasi Bulanan (.csv)
              </button>
            </div>
          </section>
        </div>

        <aside className="space-y-4">
          <section className="rounded-2xl border border-line bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.06)]">
            <div className="flex items-start justify-between gap-2">
              <h2 className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-500">
                Kondisi Stok Real-Time
              </h2>
              <span
                className={`rounded-full px-2.5 py-1 text-[9.5px] font-semibold ${statusMeta.className}`}
              >
                {statusMeta.label}
              </span>
            </div>

            <p className="mt-2.5 flex flex-wrap items-baseline gap-1.5">
              <span className="text-[32px] font-extrabold leading-none tracking-tight text-ink">
                {product.stock}
              </span>
              <span className="text-[12px] font-medium text-slate-500">
                {product.stockUnit} siap
              </span>
            </p>
            <p className="mt-1 text-[10.5px] text-slate-500">
              Batas peringatan minimum: {product.minStock} {product.stockUnit}
            </p>

            <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-[#eef2f6]">
              <div
                className={`h-full rounded-full ${statusMeta.barClassName}`}
                style={{ width: `${Math.max(quotaPercent, 3)}%` }}
              />
            </div>
            <p className="mt-1.5 text-[10px] text-slate-500">
              Tingkat Keterisian Kuota{' '}
              <span className="font-semibold text-ink">
                {product.stock}/{quota} {product.stockUnit} ({quotaPercent}%)
              </span>
            </p>

            <div className="mt-3 grid grid-cols-2 gap-2">
              <div className="rounded-xl bg-[#f4f7fb] p-2.5">
                <p className="text-[9px] font-semibold text-slate-500">Alokasi Terkunci</p>
                <p className="mt-1 text-[13px] font-extrabold text-ink">
                  {locked} {product.stockUnit}
                </p>
                <p className="mt-0.5 text-[9px] text-slate-500">Pesanan pelanggan</p>
              </div>
              <div className="rounded-xl bg-[#eaf7f4] p-2.5">
                <p className="text-[9px] font-semibold text-slate-500">Bebas Dijual (ATP)</p>
                <p className="mt-1 text-[13px] font-extrabold text-primary">
                  {available} {product.stockUnit}
                </p>
                <p className="mt-0.5 text-[9px] text-slate-500">Tersedia di web/kasir</p>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setStockModal('tambah')}
                className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl bg-[#0b3b3a] px-3 text-[10.5px] font-semibold text-white transition hover:bg-primary-hover"
              >
                <Plus className="size-3.5" />
                Tambah Stok
              </button>
              <button
                type="button"
                onClick={() => setStockModal('kurangi')}
                className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border border-line bg-white px-3 text-[10.5px] font-semibold text-[#dc2626] transition hover:bg-red-50"
              >
                <Minus className="size-3.5" />
                Catat Kurang
              </button>
            </div>
          </section>

          <section className="rounded-2xl border border-line bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.06)]">
            <div className="flex items-start justify-between gap-2">
              <h2 className="text-[12.5px] font-extrabold tracking-tight text-ink">
                Etalase &amp; Pemesanan
              </h2>
              <Pencil className="size-3.5 text-slate-400" />
            </div>

            <div className="mt-3 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold text-ink">Tampilkan di Etalase</p>
                  <p className="mt-0.5 text-[9.5px] leading-relaxed text-slate-500">
                    Pembeli dapat melihat &amp; memesan kue ini online
                  </p>
                </div>
                <Toggle
                  checked={etalase}
                  onChange={(value) => {
                    const nextProduct: OwnerProduct = {
                      ...product,
                      etalase: value ? 'aktif' : 'nonaktif',
                    }
                    setProduct(nextProduct)
                    updateOwnerProduct(nextProduct)
                    setEtalase(value)
                    showToast(
                      value
                        ? 'Produk ditampilkan di etalase toko.'
                        : 'Produk disembunyikan dari etalase toko.',
                    )
                  }}
                  label="Tampilkan di etalase"
                />
              </div>

              <div className="flex items-start justify-between gap-3 border-t border-[#eef2f6] pt-3">
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold text-ink">Proteksi Stok Habis</p>
                  <p className="mt-0.5 text-[9.5px] leading-relaxed text-slate-500">
                    Tandai &quot;Habis&quot; jika saldo fisik mencapai 0
                  </p>
                </div>
                <Toggle
                  checked={stockProtection}
                  onChange={setStockProtection}
                  label="Proteksi stok habis"
                />
              </div>

              <div className="flex items-start justify-between gap-3 border-t border-[#eef2f6] pt-3">
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold text-ink">Mode Pre-Order (PO) H-1</p>
                  <p className="mt-0.5 text-[9.5px] leading-relaxed text-slate-500">
                    Terima pesanan khusus hantaran dengan waktu proses
                  </p>
                </div>
                <Toggle checked={preOrder} onChange={setPreOrder} label="Mode pre-order" />
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-line bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.06)]">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h2 className="text-[12.5px] font-extrabold tracking-tight text-ink">
                  Performa Penjualan
                </h2>
                <p className="mt-0.5 text-[9.5px] text-slate-500">Data agregat toko 30 hari</p>
              </div>
              <span className="inline-flex items-center gap-1 rounded-full bg-[#d9f7ea] px-2 py-0.5 text-[9.5px] font-bold text-primary">
                <TrendingUp className="size-3" />
                +18% bln ini
              </span>
            </div>

            <p className="mt-3 text-[9.5px] text-slate-500">Omzet Sepanjang Masa</p>
            <p className="flex items-baseline gap-1">
              <span className="text-[11px] font-semibold text-slate-500">Rp</span>
              <span className="text-[22px] font-extrabold tracking-tight text-ink">
                {formatNumber(lifetimeRevenue)}
              </span>
            </p>

            <div className="mt-3 flex items-end gap-1.5 rounded-lg bg-[#f4f7fb] p-2.5">
              {[38, 46, 30, 52, 44, 34, 78].map((height, index) => (
                <span
                  key={index}
                  className={`flex-1 rounded-sm ${index === 6 ? 'bg-primary' : 'bg-[#cfd8e3]'}`}
                  style={{ height: `${height * 0.6}px` }}
                />
              ))}
            </div>
            <div className="mt-1 flex items-center justify-between text-[8.5px] text-slate-500">
              <span>6 Pekan Lalu</span>
              <span>Pekan Berjalan</span>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2 border-t border-[#eef2f6] pt-3">
              <div>
                <p className="text-[9px] text-slate-500">Rata-rata {product.stockUnit}/hari</p>
                <p className="mt-0.5 text-[12px] font-extrabold text-ink">{dailyAverage}</p>
              </div>
              <div>
                <p className="text-[9px] text-slate-500">Kontribusi Omzet</p>
                <p className="mt-0.5 text-[12px] font-extrabold text-ink">32% Toko</p>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-line bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.06)]">
            <div className="flex items-center gap-2">
              <ShieldAlert className="size-4 text-[#dc2626]" />
              <h2 className="text-[12.5px] font-extrabold tracking-tight text-ink">
                Zona Kebijakan Data
              </h2>
            </div>
            <p className="mt-2 text-[10.5px] leading-relaxed text-slate-600">
              Produk tidak dapat dihapus jika telah memiliki riwayat pesanan ({product.sold}{' '}
              transaksi). Anda dapat menonaktifkan kue ini dari etalase pelanggan kapan saja.
            </p>

            <button
              type="button"
              onClick={() => {
                const nextProduct: OwnerProduct = { ...product, etalase: 'nonaktif' }
                setProduct(nextProduct)
                updateOwnerProduct(nextProduct)
                setEtalase(false)
                showToast('Produk dinonaktifkan sementara dari etalase.')
              }}
              className="mt-3 flex w-full items-center gap-2 rounded-xl border border-line bg-[#f7f9fc] px-3 py-2.5 text-left text-[10.5px] font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              <EyeOff className="size-3.5 text-slate-500" />
              Sembunyikan / Nonaktifkan Sementara
            </button>

            <button
              type="button"
              disabled
              title="Produk dengan riwayat pesanan terkunci dari penghapusan permanen."
              className="mt-2 flex w-full cursor-not-allowed items-center gap-2 rounded-xl border border-line bg-[#f8fafc] px-3 py-2.5 text-left text-[10.5px] font-semibold text-slate-400"
            >
              <CircleMinus className="size-3.5" />
              Hapus Produk Permanen
              <span className="ml-auto rounded bg-slate-200 px-1.5 py-0.5 text-[8px] font-bold tracking-wide text-slate-500">
                TERKUNCI
              </span>
            </button>
          </section>
        </aside>
      </div>

      <section className="mt-4 flex flex-col gap-3 rounded-2xl border border-line bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.06)] sm:flex-row sm:items-center sm:justify-between">
        <p className="flex items-start gap-2 text-[10.5px] leading-relaxed text-slate-500">
          <Store className="mt-0.5 size-3.5 shrink-0 text-slate-400" />
          Perubahan pada halaman ini berlaku untuk etalase {session.storeName}.
        </p>
        <Link
          to="/owner/produk"
          className="inline-flex w-fit items-center gap-1.5 text-[10.5px] font-semibold text-primary transition hover:text-primary-hover"
        >
          <ArrowLeft className="size-3.5" />
          Kembali ke Katalog Produk
        </Link>
      </section>

      {stockModal && product && (
        <StockAdjustModal
          product={product}
          actorName={session.name}
          initialMode={stockModal}
          onClose={() => setStockModal(null)}
          onSave={handleAdjustStock}
        />
      )}

      {toast && (
        <div className="fixed bottom-24 left-1/2 z-[60] w-full max-w-sm -translate-x-1/2 px-4 sm:bottom-6">
          <div className="flex items-start gap-2.5 rounded-xl border border-line bg-white p-3.5 shadow-xl">
            <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-[#dcf7ee] text-primary">
              <Check className="size-3.5" />
            </span>
            <p className="flex-1 text-[11.5px] font-medium leading-relaxed text-ink">{toast}</p>
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
