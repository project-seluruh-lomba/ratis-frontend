import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import {
  Boxes,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Download,
  Pause,
  Pencil,
  Plus,
  Search,
  Trash2,
  type LucideIcon,
} from 'lucide-react'
import AdminToast, { type ToastTone } from '../../components/admin/AdminToast'
import ConfirmDialog from '../../components/admin/ConfirmDialog'
import DeleteCategoryDialog from '../../components/admin/DeleteCategoryDialog'
import {
  deleteCategory,
  fetchCategories,
  updateCategory,
  type CategoryRecord,
  type CategoryStatus,
} from '../../lib/admin-category-data'
import { categoryIcons } from '../../lib/category-icons'

type StatusFilter = CategoryStatus | 'semua'
type SortOrder = 'produk' | 'nama' | 'terbaru'
type ToastState = { id: number; message: string; tone: ToastTone }

const jakartaDateFormatter = new Intl.DateTimeFormat('id-ID', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  timeZone: 'Asia/Jakarta',
})

const jakartaTimeFormatter = new Intl.DateTimeFormat('id-ID', {
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
  timeZone: 'Asia/Jakarta',
})

const jakartaDayKeyFormatter = new Intl.DateTimeFormat('en-CA', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  timeZone: 'Asia/Jakarta',
})

function formatDate(isoDate: string) {
  return jakartaDateFormatter.format(new Date(isoDate))
}

function formatUpdatedLabel(isoDate: string) {
  const date = new Date(isoDate)
  const now = new Date()
  const dayKey = jakartaDayKeyFormatter.format(date)

  if (dayKey === jakartaDayKeyFormatter.format(now)) {
    return `Hari ini, ${jakartaTimeFormatter.format(date)}`
  }

  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000)
  if (dayKey === jakartaDayKeyFormatter.format(yesterday)) {
    return `Kemarin, ${jakartaTimeFormatter.format(date)}`
  }

  return `${formatDate(isoDate)}, ${jakartaTimeFormatter.format(date)}`
}

function StatCard({
  label,
  value,
  unit,
  icon: Icon,
  iconClassName,
  footer,
}: {
  label: string
  value: string
  unit: string
  icon: LucideIcon
  iconClassName: string
  footer: ReactNode
}) {
  return (
    <article className="flex h-full flex-col rounded-2xl border border-line bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <p className="max-w-[140px] text-[9px] font-bold uppercase leading-relaxed tracking-[0.14em] text-muted">
          {label}
        </p>
        <span
          className={`flex size-9 shrink-0 items-center justify-center rounded-xl ${iconClassName}`}
        >
          <Icon className="size-4" />
        </span>
      </div>
      <div className="mt-3 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
        <span className="text-[32px] font-extrabold leading-none tracking-tight text-ink">
          {value}
        </span>
        <span className="text-[10px] font-medium text-muted">{unit}</span>
      </div>
      <div className="mt-auto pt-4 text-[10px] leading-relaxed text-muted">{footer}</div>
    </article>
  )
}

export default function AdminCategoryPage() {
  const [records, setRecords] = useState<CategoryRecord[]>([])
  const [loading, setLoading] = useState(true)
  async function load(){ setLoading(true); try{ setRecords(await fetchCategories()) }catch(e:any){ showToast(e?.userMessage||'Gagal memuat kategori.','error') } finally { setLoading(false) } }
  useEffect(()=>{ load() },[])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('semua')
  const [sortOrder, setSortOrder] = useState<SortOrder>('produk')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [toast, setToast] = useState<ToastState | null>(null)
  const [toggleTarget, setToggleTarget] = useState<CategoryRecord | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<CategoryRecord | null>(null)



  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => setToast(null), 4000)
    return () => window.clearTimeout(timer)
  }, [toast])

  function showToast(message: string, tone: ToastTone) {
    setToast({ id: Date.now(), message, tone })
  }

  const counts = useMemo(
    () => ({
      semua: records.length,
      aktif: records.filter((record) => record.status === 'aktif').length,
      nonaktif: records.filter((record) => record.status === 'nonaktif').length,
    }),
    [records],
  )

  const totalProducts = useMemo(
    () => records.reduce((total, record) => total + record.productCount, 0),
    [records],
  )

  const activePercentage = counts.semua
    ? ((counts.aktif / counts.semua) * 100).toFixed(1)
    : '0'

  const inactiveWithProducts = useMemo(
    () =>
      records.filter((record) => record.status === 'nonaktif' && record.productCount > 0)
        .length,
    [records],
  )

  const filteredCategories = useMemo(() => {
    const keyword = search.trim().toLowerCase()

    return records
      .filter((record) => statusFilter === 'semua' || record.status === statusFilter)
      .filter(
        (record) =>
          !keyword ||
          record.name.toLowerCase().includes(keyword) ||
          record.slug.toLowerCase().includes(keyword),
      )
      .sort((first, second) => {
        if (sortOrder === 'nama') return first.name.localeCompare(second.name, 'id')
        if (sortOrder === 'terbaru') {
          return new Date(second.updatedAt).getTime() - new Date(first.updatedAt).getTime()
        }
        return second.productCount - first.productCount || first.name.localeCompare(second.name, 'id')
      })
  }, [records, statusFilter, search, sortOrder])

  const totalResults = filteredCategories.length
  const pageCount = Math.max(1, Math.ceil(totalResults / pageSize))
  const safePage = Math.min(page, pageCount)
  const visibleCategories = filteredCategories.slice(
    (safePage - 1) * pageSize,
    safePage * pageSize,
  )

  async function handleToggleCategory() {
    if (!toggleTarget) return
    const nextStatus: CategoryStatus = toggleTarget.status === 'aktif' ? 'nonaktif' : 'aktif'
    try {
      await updateCategory(toggleTarget.id, { status: nextStatus })
      await load()
      showToast(nextStatus === 'aktif' ? `Kategori ${toggleTarget.name} diaktifkan kembali.` : `Kategori ${toggleTarget.name} dinonaktifkan.`, nextStatus === 'aktif' ? 'success' : 'info')
      setToggleTarget(null)
    } catch (e: any) {
      showToast(e?.userMessage || 'Gagal mengubah status.', 'error')
    }
  }

  async function handleDeleteCategory() {
    if (!deleteTarget || deleteTarget.productCount > 0) return
    try {
      await deleteCategory(deleteTarget.id)
      await load()
      showToast(`Kategori ${deleteTarget.name} dihapus.`, 'success')
      setDeleteTarget(null)
    } catch (e: any) {
      showToast(e?.userMessage || 'Gagal menghapus kategori.', 'error')
    }
  }
  function handleExport() {
    const header = [
      'Nama Kategori',
      'Slug URL',
      'Jumlah Produk',
      'Status',
      'Dibuat',
      'Pembaruan',
    ]
    const rows = filteredCategories.map((record) => [
      record.name,
      `/kategori/${record.slug}`,
      String(record.productCount),
      record.status === 'aktif' ? 'Aktif' : 'Nonaktif',
      formatDate(record.createdAt),
      formatUpdatedLabel(record.updatedAt),
    ])
    const csv = [header, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n')

    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'kategori-ratis.csv'
    link.click()
    URL.revokeObjectURL(url)
    showToast(`${filteredCategories.length} data kategori berhasil diekspor.`, 'success')
  }

  function handleResetFilters() {
    setSearch('')
    setStatusFilter('semua')
    setSortOrder('produk')
    setPage(1)
  }

  const filterTabs: { value: StatusFilter; label: string; count: number }[] = [
    { value: 'semua', label: 'Semua', count: counts.semua },
    { value: 'aktif', label: 'Aktif', count: counts.aktif },
    { value: 'nonaktif', label: 'Nonaktif', count: counts.nonaktif },
  ]

  const toggleCopy = toggleTarget
    ? toggleTarget.status === 'aktif'
      ? {
          title: `Nonaktifkan kategori ${toggleTarget.name}?`,
          description:
            'Kategori tidak akan muncul saat produk baru dibuat. Produk lama yang sudah memakai kategori ini tetap tampil seperti biasa.',
          confirmLabel: 'Nonaktifkan',
          tone: 'danger' as const,
        }
      : {
          title: `Aktifkan kategori ${toggleTarget.name}?`,
          description:
            'Kategori akan kembali tersedia saat produk baru dibuat dan tetap terhubung ke produk lama yang sudah memakainya.',
          confirmLabel: 'Aktifkan',
          tone: 'primary' as const,
        }
    : null

  return (
    <div>
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <div className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.16em] text-muted">
            <span>Portal Admin</span>
            <span className="text-slate-300">/</span>
            <span>Taksonomi Global</span>
          </div>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-ink">Kelola Kategori</h1>
          <p className="mt-1.5 max-w-2xl text-xs leading-relaxed text-muted">
            Manajemen taksonomi kategori global produk UMKM lintas etalase dan kurasi nasional.
          </p>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleExport}
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-line bg-white px-4 text-[11px] font-semibold text-slate-600 transition hover:bg-slate-50"
          >
            <Download className="size-3.5" />
            Ekspor CSV
          </button>
          <Link
            to="/admin/kategori/tambah-kategori"
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-4 text-[11px] font-semibold text-white transition hover:bg-primary-hover"
          >
            <Plus className="size-4" />
            Tambah Kategori
          </Link>
        </div>
      </div>

      <section className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total Kategori"
          value={String(counts.semua)}
          unit="Entitas Terdaftar"
          icon={Boxes}
          iconClassName="bg-primary-soft/60 text-primary"
          footer={
            <>
              <span className="font-bold text-primary">100%</span> sinkron ke etalase nasional
            </>
          }
        />
        <StatCard
          label="Kategori Aktif"
          value={String(counts.aktif)}
          unit="Siap Dipakai"
          icon={CheckCircle2}
          iconClassName="bg-emerald-50 text-emerald-500"
          footer={
            <span className="flex items-center gap-1.5">
              <span className="size-1.5 rounded-full bg-emerald-500" />
              <span>
                <span className="font-bold text-ink">{activePercentage}%</span> dari total
                portofolio
              </span>
            </span>
          }
        />
        <StatCard
          label="Kategori Nonaktif"
          value={String(counts.nonaktif)}
          unit="Diarsipkan"
          icon={Pause}
          iconClassName="bg-indigo-50 text-indigo-400"
          footer={
            <>
              <span className="font-bold text-red-500">{inactiveWithProducts} kategori</span>{' '}
              belum dialihkan produknya
            </>
          }
        />
        <StatCard
          label="Total Produk Terkategori"
          value={totalProducts.toLocaleString('id-ID')}
          unit="SKU UMKM"
          icon={ClipboardList}
          iconClassName="bg-teal-50 text-primary"
          footer={<span>Dihitung dari seluruh produk UMKM</span>}
        />
      </section>

      <section className="mt-4 rounded-2xl bg-[#f3f4fa] p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full lg:max-w-[520px]">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 size-3.5 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value)
                setPage(1)
              }}
              placeholder="Cari nama kategori atau slug URL..."
              className="h-11 w-full rounded-xl border border-line bg-white pl-9 pr-3 text-xs text-ink outline-none transition placeholder:text-slate-400 focus:border-primary focus:ring-4 focus:ring-primary/10"
            />
          </div>
          <p className="flex items-center gap-2 text-[10px] text-muted">
            <span className="size-1.5 rounded-full bg-emerald-500" />
            Menampilkan{' '}
            <span className="font-bold text-ink">{totalResults} Kategori</span> ditemukan
          </p>
        </div>

        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-1">
            {filterTabs.map((tab) => {
              const active = statusFilter === tab.value
              return (
                <button
                  key={tab.value}
                  type="button"
                  onClick={() => {
                    setStatusFilter(tab.value)
                    setPage(1)
                  }}
                  className={`inline-flex h-9 items-center rounded-lg px-3.5 text-[11px] transition ${
                    active
                      ? 'bg-white font-bold text-ink shadow-sm'
                      : 'font-medium text-slate-500 hover:bg-white/60 hover:text-ink'
                  }`}
                >
                  {tab.label} ({tab.count})
                </button>
              )
            })}
          </div>

          <div className="relative w-full sm:w-auto">
            <select
              value={sortOrder}
              onChange={(event) => {
                setSortOrder(event.target.value as SortOrder)
                setPage(1)
              }}
              aria-label="Urutkan kategori"
              className="h-9 w-full cursor-pointer appearance-none rounded-lg border border-white/70 bg-white pl-3 pr-8 text-[11px] font-semibold text-slate-700 outline-none transition focus:border-primary sm:w-[210px]"
            >
              <option value="produk">Urutkan: Produk Terbanyak</option>
              <option value="nama">Urutkan: Nama A-Z</option>
              <option value="terbaru">Urutkan: Pembaruan Terbaru</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 size-3.5 -translate-y-1/2 text-slate-400" />
          </div>
        </div>
      </section>

      <section className="mt-4 overflow-hidden rounded-2xl border border-line bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1040px] text-left">
            <thead>
              <tr className="bg-[#f4f5fa] text-[9px] uppercase tracking-[0.08em] text-muted">
                <th className="px-5 py-3.5 font-bold">Nama Kategori</th>
                <th className="px-4 py-3.5 font-bold">Slug URL Resmi</th>
                <th className="px-4 py-3.5 text-center font-bold">Jumlah Produk</th>
                <th className="px-4 py-3.5 font-bold">Dibuat &amp; Pembaruan</th>
                <th className="px-4 py-3.5 font-bold">Status</th>
                <th className="px-5 py-3.5 text-right font-bold">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {loading ? (<tr><td colSpan={6} className="px-4 py-10 text-center text-sm text-slate-500">Memuat kategori...</td></tr>) : visibleCategories.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
                      <span className="flex size-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                        <Boxes className="size-5" />
                      </span>
                      <h2 className="mt-3 text-sm font-bold text-ink">
                        {records.length === 0
                          ? 'Belum ada kategori'
                          : 'Tidak ada kategori yang cocok'}
                      </h2>
                      <p className="mt-1 text-xs text-muted">
                        {records.length === 0
                          ? 'Tambahkan kategori pertama untuk mulai menata katalog UMKM.'
                          : 'Coba ubah kata kunci atau reset filter pencarian.'}
                      </p>
                      {records.length === 0 ? (
                        <Link
                          to="/admin/kategori/tambah-kategori"
                          className="mt-4 rounded-xl border border-line bg-white px-4 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
                        >
                          Tambah kategori
                        </Link>
                      ) : (
                        <button
                          type="button"
                          onClick={handleResetFilters}
                          className="mt-4 rounded-xl border border-line bg-white px-4 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
                        >
                          Reset filter
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                visibleCategories.map((record) => {
                  const Icon = categoryIcons[record.icon] ?? Boxes
                  const isActive = record.status === 'aktif'
                  const isInactive = !isActive

                  return (
                    <tr
                      key={record.id}
                      className={`transition hover:bg-slate-50/60 ${
                        isInactive ? 'bg-slate-50/40' : ''
                      }`}
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <span
                            className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${
                              isInactive
                                ? 'bg-slate-100 text-slate-400'
                                : 'bg-[#ece9fb] text-slate-700'
                            }`}
                          >
                            <Icon className="size-[18px]" />
                          </span>
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <p
                                className={`text-xs font-bold ${
                                  isInactive ? 'text-slate-400' : 'text-ink'
                                }`}
                              >
                                {record.name}
                              </p>
                              {isInactive && (
                                <span className="rounded border border-line bg-white px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wide text-slate-400">
                                  Arsip
                                </span>
                              )}
                            </div>
                            {record.description && (
                              <p
                                className={`mt-1 text-[10px] ${
                                  isInactive ? 'text-slate-400/80' : 'text-muted'
                                }`}
                              >
                                {record.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className="inline-block max-w-[210px] break-all rounded-md bg-[#f1effb] px-2 py-1 font-mono text-[9px] leading-relaxed text-slate-500">
                          /kategori/{record.slug}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex justify-center">
                          <span
                            className={`inline-flex min-w-[64px] flex-col items-center rounded-full px-3 py-1.5 ${
                              record.productCount === 0
                                ? 'bg-[#f0edf8] text-slate-400'
                                : 'bg-[#d9f2ee] text-primary'
                            }`}
                          >
                            <span className="text-xs font-extrabold leading-none">
                              {record.productCount.toLocaleString('id-ID')}
                            </span>
                            <span className="mt-0.5 text-[8px] font-semibold">produk</span>
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <p className="text-[11px] text-slate-600">{formatDate(record.createdAt)}</p>
                        <p className="mt-1 text-[10px] text-muted">
                          Update: {formatUpdatedLabel(record.updatedAt)}
                        </p>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2.5">
                          <button
                            type="button"
                            role="switch"
                            aria-checked={isActive}
                            aria-label={`${isActive ? 'Nonaktifkan' : 'Aktifkan'} kategori ${record.name}`}
                            onClick={() => setToggleTarget(record)}
                            className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition ${
                              isActive ? 'bg-primary' : 'bg-slate-200'
                            }`}
                          >
                            <span
                              className={`inline-block size-5 rounded-full bg-white shadow transition-transform ${
                                isActive ? 'translate-x-[22px]' : 'translate-x-0.5'
                              }`}
                            />
                          </button>
                          <span
                            className={`text-[11px] font-semibold ${
                              isActive ? 'text-ink' : 'text-slate-400'
                            }`}
                          >
                            {isActive ? 'Aktif' : 'Nonaktif'}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-1">
                          <Link
                            to={`/admin/kategori/edit-kategori/${record.id}`}
                            title={`Ubah kategori ${record.name}`}
                            aria-label={`Ubah kategori ${record.name}`}
                            className="flex size-7 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-ink"
                          >
                            <Pencil className="size-3.5" />
                          </Link>
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(record)}
                            disabled={record.productCount > 0}
                            title={
                              record.productCount > 0
                                ? `Tidak dapat dihapus: dipakai ${record.productCount} produk. Nonaktifkan kategori ini.`
                                : `Hapus kategori ${record.name}`
                            }
                            aria-label={`Hapus kategori ${record.name}`}
                            className="flex size-7 items-center justify-center rounded-lg text-slate-400 transition hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:text-slate-300 disabled:hover:bg-transparent"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-3 border-t border-line px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-muted">
            Tampilkan
            <select
              value={pageSize}
              onChange={(event) => {
                setPageSize(Number(event.target.value))
                setPage(1)
              }}
              className="h-7 rounded-lg border border-line bg-white px-1.5 text-[10px] font-semibold text-slate-600 outline-none focus:border-primary"
            >
              {[10, 25, 50].map((size) => (
                <option key={size} value={size}>
                  {size} data
                </option>
              ))}
            </select>
            dari total{' '}
            <span className="font-semibold text-ink">{totalResults} data kategori</span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setPage(Math.max(1, safePage - 1))}
              disabled={safePage <= 1}
              aria-label="Halaman sebelumnya"
              className="flex size-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-300"
            >
              <ChevronLeft className="size-3.5" />
            </button>
            {Array.from({ length: pageCount }, (_, index) => index + 1).map((pageNumber) => (
              <button
                key={pageNumber}
                type="button"
                onClick={() => setPage(pageNumber)}
                aria-current={pageNumber === safePage ? 'page' : undefined}
                className={`flex size-8 items-center justify-center rounded-lg text-[10px] font-semibold transition ${
                  pageNumber === safePage
                    ? 'bg-primary text-white'
                    : 'border border-line bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                {pageNumber}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setPage(Math.min(pageCount, safePage + 1))}
              disabled={safePage >= pageCount}
              aria-label="Halaman berikutnya"
              className="flex size-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-300"
            >
              <ChevronRight className="size-3.5" />
            </button>
          </div>
        </div>
      </section>

      <ConfirmDialog
        open={Boolean(toggleTarget)}
        title={toggleCopy?.title ?? ''}
        description={toggleCopy?.description ?? ''}
        confirmLabel={toggleCopy?.confirmLabel ?? 'Konfirmasi'}
        tone={toggleCopy?.tone}
        onConfirm={handleToggleCategory}
        onClose={() => setToggleTarget(null)}
      />

      {deleteTarget && (
        <DeleteCategoryDialog
          open
          record={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onDelete={handleDeleteCategory}
        />
      )}

      {toast && (
        <AdminToast
          key={toast.id}
          message={toast.message}
          tone={toast.tone}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  )
}
