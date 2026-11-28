import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Boxes, Check, Info, Loader2 } from 'lucide-react'
import {
  fetchCategories,
  updateCategory,
  type CategoryRecord,
  type CategoryStatus,
} from '../../lib/admin-category-data'

const MAX_NAME = 40

const dateFormatter = new Intl.DateTimeFormat('id-ID', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  timeZone: 'Asia/Jakarta',
})

export default function AdminCategoryEditPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [records, setRecords] = useState<CategoryRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [name, setName] = useState('')
  const [status, setStatus] = useState<CategoryStatus>('aktif')
  const [touched, setTouched] = useState(false)
  const [saving, setSaving] = useState(false)
  const [submitError, setSubmitError] = useState('')

  useEffect(() => {
    fetchCategories()
      .then((items) => {
        setRecords(items)
        const found = items.find((item) => item.id === id)
        if (found) {
          setName(found.name)
          setStatus(found.status)
        }
      })
      .catch(() => undefined)
      .finally(() => setLoading(false))
  }, [id])

  const record = useMemo(() => records.find((item) => item.id === id), [records, id])

  const nameError = useMemo(() => {
    const trimmed = name.trim()
    if (!trimmed) return 'Nama kategori wajib diisi.'
    if (trimmed.length < 2) return 'Nama kategori minimal 2 karakter.'
    if (trimmed.length > MAX_NAME) return `Nama kategori maksimal ${MAX_NAME} karakter.`
    const duplicate = records.some(
      (item) => item.id !== id && item.name.trim().toLowerCase() === trimmed.toLowerCase(),
    )
    if (duplicate) return 'Nama kategori sudah digunakan.'
    return ''
  }, [name, records, id])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setTouched(true)
    setSubmitError('')
    if (!record || nameError) return

    setSaving(true)
    try {
      await updateCategory(record.id, { name: name.trim(), status })
      navigate('/admin/kategori')
    } catch (error) {
      setSubmitError(
        (error as { userMessage?: string })?.userMessage || 'Gagal menyimpan kategori.',
      )
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-xl rounded-2xl border border-line bg-white p-10 text-center text-sm text-muted shadow-sm">
        Memuat kategori...
      </div>
    )
  }

  if (!record) {
    return (
      <div className="mx-auto max-w-xl rounded-2xl border border-line bg-white p-10 text-center shadow-sm">
        <Boxes className="mx-auto size-9 text-slate-300" />
        <h1 className="mt-3 text-lg font-bold text-ink">Kategori tidak ditemukan</h1>
        <Link
          to="/admin/kategori"
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-white"
        >
          <ArrowLeft className="size-3.5" />
          Kembali ke Daftar Kategori
        </Link>
      </div>
    )
  }

  const isActive = status === 'aktif'

  return (
    <div>
      <Link
        to="/admin/kategori"
        className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-ink transition hover:text-primary"
      >
        <ArrowLeft className="size-3.5" />
        Kembali ke Daftar Kategori
      </Link>

      <div className="mt-3">
        <h1 className="text-2xl font-extrabold tracking-tight text-ink">Ubah Kategori</h1>
        <p className="mt-1.5 max-w-2xl text-xs leading-relaxed text-muted">
          Perbarui nama atau status kategori. Perubahan nama langsung terlihat pada produk yang
          memakai kategori ini.
        </p>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <form onSubmit={handleSubmit} className="min-w-0 space-y-4">
          <section className="rounded-2xl border border-line bg-white p-5 shadow-sm">
            <div className="flex items-start gap-2.5">
              <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-xl bg-primary-soft/60 text-primary">
                <Boxes className="size-4" />
              </span>
              <div>
                <h2 className="text-sm font-bold text-ink">Informasi Kategori</h2>
                <p className="mt-0.5 text-[10px] text-muted">
                  Dibuat {dateFormatter.format(new Date(record.createdAt))}
                </p>
              </div>
            </div>

            <div className="mt-4">
              <div className="mb-1 flex items-end justify-between gap-3">
                <label htmlFor="category-name" className="text-[11px] font-semibold text-ink">
                  Nama Kategori <span className="text-red-500">*</span>
                </label>
                <span className="text-[10px] text-muted">
                  {name.length} / {MAX_NAME} karakter
                </span>
              </div>
              <input
                id="category-name"
                type="text"
                maxLength={MAX_NAME}
                value={name}
                onChange={(event) => {
                  setName(event.target.value)
                  setTouched(true)
                  setSubmitError('')
                }}
                onBlur={() => setTouched(true)}
                aria-invalid={Boolean((nameError && touched) || submitError)}
                aria-describedby="category-name-help"
                className={`h-11 w-full rounded-xl border bg-white px-3 text-xs text-ink outline-none transition placeholder:text-slate-400 focus:ring-4 ${
                  (nameError && touched) || submitError
                    ? 'border-red-400 focus:border-red-500 focus:ring-red-500/10'
                    : 'border-line focus:border-primary focus:ring-primary/10'
                }`}
              />
              <div id="category-name-help" className="mt-1.5 text-[10px]">
                {submitError ? (
                  <p className="font-semibold text-red-500">{submitError}</p>
                ) : nameError && touched ? (
                  <p className="text-red-500">{nameError}</p>
                ) : (
                  <p className="text-muted">Panjang 2-40 karakter dan unik di seluruh sistem.</p>
                )}
              </div>
            </div>

            <div className="mt-5">
              <label htmlFor="category-slug" className="mb-1 block text-[11px] font-semibold text-ink">
                Slug URL
              </label>
              <input
                id="category-slug"
                type="text"
                readOnly
                value={record.slug}
                className="h-11 w-full rounded-xl border border-line bg-[#f4f5fa] px-3 font-mono text-xs text-slate-600 outline-none"
              />
              <p className="mt-1.5 text-[10px] text-muted">
                Slug mengikuti nama terbaru setelah disimpan dan dipakai pada URL katalog publik.
              </p>
            </div>

            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-[#f4f5fa] p-4">
              <div>
                <p className="text-[11px] font-bold text-ink">Status kategori</p>
                <p className="mt-0.5 text-[10px] leading-relaxed text-muted">
                  {isActive
                    ? 'Aktif: tersedia sebagai pilihan produk baru.'
                    : 'Nonaktif: tidak muncul untuk produk baru, tetapi produk lama tetap menampilkannya.'}
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={isActive}
                aria-label="Status kategori"
                onClick={() => setStatus(isActive ? 'nonaktif' : 'aktif')}
                className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition ${
                  isActive ? 'bg-primary' : 'bg-slate-300'
                }`}
              >
                <span
                  className={`inline-block size-5 rounded-full bg-white shadow transition-transform ${
                    isActive ? 'translate-x-[22px]' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>
          </section>

          <div className="flex flex-col-reverse gap-2 rounded-2xl border border-line bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-end">
            <button
              type="button"
              onClick={() => navigate('/admin/kategori')}
              className="inline-flex h-10 items-center justify-center rounded-xl border border-line bg-white px-4 text-[11px] font-semibold text-slate-600 transition hover:bg-slate-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-[11px] font-semibold text-white transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? <Loader2 className="size-3.5 animate-spin" /> : <Check className="size-3.5" />}
              Simpan Perubahan
            </button>
          </div>
        </form>

        <aside className="space-y-4">
          <section className="rounded-2xl border border-line bg-white p-5 shadow-sm">
            <h2 className="text-xs font-bold text-ink">Ringkasan</h2>
            <dl className="mt-3 space-y-2 text-[10px]">
              <div className="flex items-center justify-between gap-3">
                <dt className="text-muted">Produk memakai</dt>
                <dd className="font-bold text-ink">{record.productCount}</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-muted">Status</dt>
                <dd className="font-bold text-ink">{isActive ? 'Aktif' : 'Nonaktif'}</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-muted">Slug</dt>
                <dd className="max-w-[160px] truncate font-mono text-ink">{record.slug}</dd>
              </div>
            </dl>
          </section>

          <section className="rounded-2xl border border-line bg-white p-5 shadow-sm">
            <h2 className="flex items-center gap-2 text-xs font-bold text-ink">
              <Info className="size-4 text-primary" />
              Catatan
            </h2>
            <p className="mt-2 text-[10px] leading-relaxed text-muted">
              {record.productCount > 0
                ? `Kategori ini dipakai ${record.productCount} produk sehingga tidak dapat dihapus. Nonaktifkan bila tidak ingin dipakai untuk produk baru.`
                : 'Kategori ini belum dipakai produk sehingga dapat dihapus dari halaman daftar kategori.'}
            </p>
          </section>
        </aside>
      </div>
    </div>
  )
}
