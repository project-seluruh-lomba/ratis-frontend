import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Boxes, CheckCircle2, Info, Loader2, Send } from 'lucide-react'
import {
  createCategory,
  fetchCategories,
  slugifyCategoryName,
  updateCategory,
  type CategoryRecord,
  type CategoryStatus,
} from '../../lib/admin-category-data'

const MAX_NAME = 40

export default function AdminCategoryAddPage() {
  const navigate = useNavigate()
  const [records, setRecords] = useState<CategoryRecord[]>([])
  const [name, setName] = useState('')
  const [touched, setTouched] = useState(false)
  const [published, setPublished] = useState(true)
  const [saving, setSaving] = useState(false)
  const [submitError, setSubmitError] = useState('')

  useEffect(() => {
    fetchCategories().then(setRecords).catch(() => undefined)
  }, [])

  const nameError = useMemo(() => {
    const trimmed = name.trim()
    if (!trimmed) return 'Nama kategori wajib diisi.'
    if (trimmed.length < 2) return 'Nama kategori minimal 2 karakter.'
    if (trimmed.length > MAX_NAME) return `Nama kategori maksimal ${MAX_NAME} karakter.`
    if (records.some((record) => record.name.trim().toLowerCase() === trimmed.toLowerCase())) {
      return 'Nama kategori sudah digunakan.'
    }
    return ''
  }, [name, records])

  const slug = slugifyCategoryName(name) || 'nama-kategori'

  async function save(status: CategoryStatus) {
    setTouched(true)
    setSubmitError('')
    if (nameError) return

    setSaving(true)
    try {
      const created = await createCategory(name.trim())
      if (status === 'nonaktif') await updateCategory(created.id, { status: 'nonaktif' })
      navigate('/admin/kategori')
    } catch (error) {
      setSubmitError(
        (error as { userMessage?: string })?.userMessage || 'Gagal menambah kategori.',
      )
    } finally {
      setSaving(false)
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    void save(published ? 'aktif' : 'nonaktif')
  }

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
        <h1 className="text-2xl font-extrabold tracking-tight text-ink">Tambah Kategori Produk</h1>
        <p className="mt-1.5 max-w-2xl text-xs leading-relaxed text-muted">
          Kategori global dipakai seluruh toko UMKM saat menambahkan produk. Cukup isi nama; slug
          dibuat otomatis oleh sistem.
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
                  Nama harus unik, tidak peka huruf besar/kecil dan spasi tepi.
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
                autoFocus
                value={name}
                onChange={(event) => {
                  setName(event.target.value)
                  setTouched(true)
                  setSubmitError('')
                }}
                onBlur={() => setTouched(true)}
                placeholder="Contoh: Camilan Tradisional"
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
                  <p className="text-muted">
                    Panjang 2-40 karakter. Contoh: Makanan, Minuman, Kerajinan.
                  </p>
                )}
              </div>
            </div>

            <div className="mt-5">
              <label htmlFor="category-slug" className="mb-1 block text-[11px] font-semibold text-ink">
                Slug URL (otomatis)
              </label>
              <div className="flex h-11 items-center overflow-hidden rounded-xl border border-line bg-[#f4f5fa]">
                <span className="flex shrink-0 items-center border-r border-line px-3 font-mono text-[10px] text-slate-500">
                  /kategori/
                </span>
                <input
                  id="category-slug"
                  type="text"
                  readOnly
                  value={slug}
                  className="h-full min-w-0 flex-1 bg-transparent px-3 font-mono text-xs text-slate-600 outline-none"
                />
              </div>
              <p className="mt-1.5 text-[10px] text-muted">
                Dibentuk dari nama kategori oleh backend; tidak perlu diisi manual.
              </p>
            </div>

            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-[#f4f5fa] p-4">
              <div>
                <p className="text-[11px] font-bold text-ink">Aktifkan kategori</p>
                <p className="mt-0.5 text-[10px] leading-relaxed text-muted">
                  Kategori aktif langsung muncul sebagai pilihan produk baru. Kategori nonaktif tetap
                  tampil pada produk lama.
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={published}
                aria-label="Aktifkan kategori"
                onClick={() => setPublished((current) => !current)}
                className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition ${
                  published ? 'bg-primary' : 'bg-slate-300'
                }`}
              >
                <span
                  className={`inline-block size-5 rounded-full bg-white shadow transition-transform ${
                    published ? 'translate-x-[22px]' : 'translate-x-0.5'
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
              {saving ? <Loader2 className="size-3.5 animate-spin" /> : <Send className="size-3.5" />}
              Simpan Kategori
            </button>
          </div>
        </form>

        <aside className="space-y-4">
          <section className="rounded-2xl border border-line bg-white p-5 shadow-sm">
            <h2 className="text-xs font-bold text-ink">Pratinjau</h2>
            <div className="mt-3 rounded-2xl border border-line bg-[#f6f5fd] p-4">
              <span className="flex size-10 items-center justify-center rounded-full bg-primary-soft text-primary">
                <Boxes className="size-5" />
              </span>
              <p className="mt-3 break-words text-sm font-extrabold leading-snug text-ink">
                {name.trim() || 'Nama kategori baru'}
              </p>
              <p className="mt-1 font-mono text-[9px] text-muted">/kategori/{slug}</p>
              <span
                className={`mt-3 inline-flex rounded-full px-2 py-1 text-[9px] font-bold ${
                  published ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'
                }`}
              >
                {published ? 'Aktif' : 'Nonaktif'}
              </span>
            </div>
          </section>

          <section className="rounded-2xl border border-line bg-white p-5 shadow-sm">
            <h2 className="flex items-center gap-2 text-xs font-bold text-ink">
              <Info className="size-4 text-primary" />
              Aturan Kategori
            </h2>
            <ul className="mt-3 space-y-2.5">
              <li className="flex gap-2 text-[10px] leading-relaxed text-muted">
                <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-primary" />
                Nama unik tanpa peka huruf besar/kecil dan spasi tepi.
              </li>
              <li className="flex gap-2 text-[10px] leading-relaxed text-muted">
                <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-primary" />
                Kategori yang masih dipakai produk tidak dapat dihapus, hanya dinonaktifkan.
              </li>
              <li className="flex gap-2 text-[10px] leading-relaxed text-muted">
                <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-primary" />
                Setiap perubahan dicatat pada log aktivitas admin.
              </li>
            </ul>
          </section>
        </aside>
      </div>
    </div>
  )
}
