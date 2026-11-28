import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Database,
  Download,
  ExternalLink,
  Lock,
  RefreshCw,
  RotateCcw,
  Search,
  ShieldCheck,
  X,
  Zap,
} from 'lucide-react'
import AdminToast, { type ToastTone } from '../../components/admin/AdminToast'
import type { ApiError } from '../../lib/api/client'
import { logsApi } from '../../lib/api/services'
import type { AdminLogEntry, LogSummary } from '../../lib/api/types'

type Period = 'today' | '7d' | '30d' | 'all'

type ActivityActionTone =
  | 'emerald'
  | 'violet'
  | 'rose'
  | 'indigo'
  | 'amber'
  | 'teal'
  | 'slate'

type ActivityActorTone = 'emerald' | 'indigo' | 'teal' | 'rose' | 'slate'

type ActivityCategory =
  | 'Verifikasi UMKM'
  | 'Status UMKM'
  | 'Kategori'
  | 'Pengguna'
  | 'Autentikasi'

type ActivityEntry = {
  id: string
  at: string
  actor: { name: string; email: string; initials: string; tone: ActivityActorTone }
  action: string
  tone: ActivityActionTone
  category: ActivityCategory
  objectName: string
  objectMeta: string
  objectHref: string | null
  description: string
  reference: string
  referenceTone: string
}

const PAGE_SIZE = 8

const numberFormatter = new Intl.NumberFormat('id-ID')

const dateFormatter = new Intl.DateTimeFormat('id-ID', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  timeZone: 'Asia/Jakarta',
})

const timeFormatter = new Intl.DateTimeFormat('en-GB', {
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hourCycle: 'h23',
  timeZone: 'Asia/Jakarta',
})

const dayKeyFormatter = new Intl.DateTimeFormat('en-CA', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  timeZone: 'Asia/Jakarta',
})

const actionStyles: Record<ActivityActionTone, string> = {
  emerald: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  violet: 'border-violet-200 bg-violet-50 text-violet-700',
  rose: 'border-rose-200 bg-rose-50 text-rose-600',
  indigo: 'border-indigo-200 bg-indigo-50 text-indigo-700',
  amber: 'border-amber-200 bg-amber-50 text-amber-700',
  teal: 'border-teal-200 bg-teal-50 text-teal-700',
  slate: 'border-slate-200 bg-slate-100 text-slate-600',
}

const actorStyles: Record<ActivityActorTone, string> = {
  emerald: 'bg-primary text-white',
  indigo: 'bg-indigo-500 text-white',
  teal: 'bg-teal-600 text-white',
  rose: 'bg-rose-500 text-white',
  slate: 'bg-slate-400 text-white',
}

const actorTones: ActivityActorTone[] = ['emerald', 'indigo', 'teal', 'rose', 'slate']

const periodLabels: Record<Period, string> = {
  today: 'Hari Ini',
  '7d': '7 Hari Terakhir',
  '30d': '30 Hari Terakhir',
  all: 'Semua Waktu',
}

const activityCategories: ActivityCategory[] = [
  'Verifikasi UMKM',
  'Status UMKM',
  'Kategori',
  'Pengguna',
  'Autentikasi',
]

const actionPresentation: Record<
  string,
  {
    category: ActivityCategory
    tone: ActivityActionTone
    referenceTone: string
    description: (name: string) => string
  }
> = {
  LOGIN: {
    category: 'Autentikasi',
    tone: 'indigo',
    referenceTone: 'text-indigo-500',
    description: () => 'Sesi login berhasil pada konsol admin Ratis.',
  },
  APPROVE_SHOP: {
    category: 'Verifikasi UMKM',
    tone: 'emerald',
    referenceTone: 'text-emerald-600',
    description: (name) => `Menyetujui pendaftaran UMKM ${name}.`,
  },
  REJECT_SHOP: {
    category: 'Verifikasi UMKM',
    tone: 'amber',
    referenceTone: 'text-slate-400',
    description: (name) => `Menolak pengajuan pendaftaran UMKM ${name}.`,
  },
  ACTIVATE_SHOP: {
    category: 'Status UMKM',
    tone: 'emerald',
    referenceTone: 'text-emerald-600',
    description: (name) => `Mengaktifkan kembali UMKM ${name}.`,
  },
  DEACTIVATE_SHOP: {
    category: 'Status UMKM',
    tone: 'rose',
    referenceTone: 'text-rose-500',
    description: (name) => `Menonaktifkan UMKM ${name}.`,
  },
  CREATE_CATEGORY: {
    category: 'Kategori',
    tone: 'violet',
    referenceTone: 'text-indigo-500',
    description: (name) => `Menambahkan kategori baru ${name}.`,
  },
  UPDATE_CATEGORY: {
    category: 'Kategori',
    tone: 'violet',
    referenceTone: 'text-indigo-500',
    description: (name) => `Memperbarui data kategori ${name}.`,
  },
  DELETE_CATEGORY: {
    category: 'Kategori',
    tone: 'rose',
    referenceTone: 'text-rose-500',
    description: (name) => `Menghapus kategori ${name}.`,
  },
  ACTIVATE_USER: {
    category: 'Pengguna',
    tone: 'emerald',
    referenceTone: 'text-emerald-600',
    description: (name) => `Mengaktifkan kembali akun ${name}.`,
  },
  DEACTIVATE_USER: {
    category: 'Pengguna',
    tone: 'rose',
    referenceTone: 'text-rose-500',
    description: (name) => `Menonaktifkan akun ${name}.`,
  },
}

function getInitials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')
}

function actorToneFor(name: string) {
  const seed = [...name].reduce((sum, char) => sum + char.charCodeAt(0), 0)
  return actorTones[seed % actorTones.length]
}

function mapEntry(entry: AdminLogEntry): ActivityEntry {
  const presentation = actionPresentation[entry.action] ?? {
    category: 'Autentikasi' as ActivityCategory,
    tone: 'slate' as ActivityActionTone,
    referenceTone: 'text-slate-400',
    description: () => `Aksi ${entry.action} dijalankan.`,
  }
  const objectName = entry.targetName ?? entry.targetId

  return {
    id: entry.id,
    at: entry.createdAt,
    actor: {
      name: entry.admin.name,
      email: entry.admin.email,
      initials: getInitials(entry.admin.name),
      tone: actorToneFor(entry.admin.name),
    },
    action: entry.action,
    tone: presentation.tone,
    category: presentation.category,
    objectName,
    objectMeta: entry.targetMeta ?? `Entitas: ${entry.targetType}`,
    objectHref:
      entry.targetType === 'SHOP'
        ? `/admin/umkm/${entry.targetId}`
        : entry.targetType === 'USER'
          ? `/admin/pengguna?q=${encodeURIComponent(objectName)}`
          : null,
    description: presentation.description(objectName),
    reference: entry.reason ? `Alasan: ${entry.reason}` : '',
    referenceTone: presentation.referenceTone,
  }
}

function formatStamp(entry: ActivityEntry) {
  const date = new Date(entry.at)
  return {
    date: dateFormatter.format(date),
    time: timeFormatter.format(date),
  }
}

function wibDayKey(offsetDays: number) {
  const date = new Date()
  date.setDate(date.getDate() + offsetDays)
  return dayKeyFormatter.format(date)
}

function periodRange(period: Period) {
  if (period === 'all') return {}
  if (period === 'today') return { from: wibDayKey(0), to: wibDayKey(0) }
  if (period === '7d') return { from: wibDayKey(-6), to: wibDayKey(0) }
  return { from: wibDayKey(-29), to: wibDayKey(0) }
}

function escapeCsv(value: string) {
  return `"${value.replace(/"/g, '""')}"`
}

export default function AdminActivityLogPage() {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<'all' | ActivityCategory>('all')
  const [period, setPeriod] = useState<Period>('7d')
  const [page, setPage] = useState(1)
  const [entries, setEntries] = useState<ActivityEntry[]>([])
  const [summary, setSummary] = useState<LogSummary | null>(null)
  const [totalEntries, setTotalEntries] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)
  const [syncedAt, setSyncedAt] = useState(() => new Date())
  const [toast, setToast] = useState<{ message: string; tone: ToastTone } | null>(null)

  const range = useMemo(() => periodRange(period), [period])

  function showToast(message: string, tone: ToastTone = 'success') {
    setToast({ message, tone })
    window.setTimeout(() => setToast(null), 4200)
  }

  useEffect(() => {
    let cancelled = false
    const timer = window.setTimeout(() => {
      setLoading(true)
      setError(null)
      logsApi
        .list({
          ...(category !== 'all' ? { category } : {}),
          ...(range.from ? { from: range.from } : {}),
          ...(range.to ? { to: range.to } : {}),
          ...(query.trim() ? { q: query.trim() } : {}),
          page,
          limit: PAGE_SIZE,
        })
        .then((response) => {
          if (cancelled) return
          setEntries(response.data.map(mapEntry))
          setSummary(response.summary)
          setTotalEntries(response.meta.total)
          setSyncedAt(new Date())
        })
        .catch((err: ApiError) => {
          if (!cancelled) setError(err.userMessage ?? 'Gagal memuat log aktivitas')
        })
        .finally(() => {
          if (!cancelled) setLoading(false)
        })
    }, 250)
    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [category, range, query, page, refreshKey])

  const pageCount = Math.max(1, Math.ceil(totalEntries / PAGE_SIZE))
  const safePage = Math.min(page, pageCount)
  const startIndex = totalEntries === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1
  const endIndex = Math.min(safePage * PAGE_SIZE, totalEntries)

  const pageNumbers = Array.from({ length: pageCount }, (_, index) => index + 1).filter(
    (number) => number === 1 || number === pageCount || Math.abs(number - safePage) <= 1,
  )

  const filtersActive = query.trim().length > 0 || category !== 'all' || period !== '7d'

  function resetFilters() {
    setQuery('')
    setCategory('all')
    setPeriod('7d')
    setPage(1)
  }

  function changePeriod(next: Period) {
    setPeriod(next)
    setPage(1)
  }

  function refresh() {
    setRefreshKey((value) => value + 1)
    showToast('Memuat ulang catatan audit terbaru…', 'info')
  }

  async function handleExport() {
    try {
      const response = await logsApi.list({
        ...(category !== 'all' ? { category } : {}),
        ...(range.from ? { from: range.from } : {}),
        ...(range.to ? { to: range.to } : {}),
        ...(query.trim() ? { q: query.trim() } : {}),
        page: 1,
        limit: 50,
      })
      const header = [
        'ID Log',
        'Waktu (WIB)',
        'Admin',
        'Email',
        'Aksi',
        'Kategori Aksi',
        'Objek Sasaran',
        'Deskripsi',
        'Dasar Perubahan',
      ]
      const rows = response.data.map((log) => {
        const entry = mapEntry(log)
        const stamp = formatStamp(entry)
        return [
          entry.id,
          `${stamp.date} ${stamp.time}`,
          entry.actor.name,
          entry.actor.email,
          entry.action,
          entry.category,
          `${entry.objectName} (${entry.objectMeta})`,
          entry.description,
          entry.reference,
        ]
      })
      const csv = [header, ...rows]
        .map((row) => row.map(escapeCsv).join(','))
        .join('\r\n')
      const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `log-aktivitas-admin-${new Date().toISOString().slice(0, 10)}.csv`
      link.click()
      URL.revokeObjectURL(url)
      showToast(
        `${numberFormatter.format(response.meta.total)} entri audit diekspor ke berkas CSV.`,
      )
    } catch (err) {
      showToast((err as ApiError).userMessage ?? 'Gagal mengekspor log audit.', 'error')
    }
  }

  return (
    <div>
      {toast && (
        <AdminToast message={toast.message} tone={toast.tone} onClose={() => setToast(null)} />
      )}

      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2.5 text-[9px] font-bold uppercase tracking-[0.14em] text-muted">
            <span className="inline-flex items-center gap-1.5">
              <span className="size-1.5 rounded-full bg-primary" />
              Audit &amp; Kepatuhan
            </span>
          </div>

          <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-ink sm:text-[30px]">
            Log Aktivitas Admin
          </h1>
          <p className="mt-1.5 max-w-2xl text-[10px] leading-relaxed text-muted">
            Catatan rekam jejak tindakan administratif untuk menjaga akuntabilitas dan transparansi
            tata kelola platform.
          </p>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-white px-3 py-1.5 text-[10px] font-semibold text-emerald-700 shadow-sm">
            <ShieldCheck className="size-3.5 text-emerald-600" />
            Log Audit Aktif
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#eef0fa] px-3 py-1.5 text-[10px] font-semibold text-slate-600">
            <Lock className="size-3.5" />
            Hak Akses Read-Only
          </span>
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <article className="flex items-start justify-between gap-3 rounded-2xl border border-line bg-white p-4 shadow-sm">
          <div className="min-w-0">
            <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-muted">
              Total Catatan Tersimpan
            </p>
            <p className="mt-1 flex items-baseline gap-1.5">
              <span className="text-3xl font-extrabold tracking-tight text-ink">
                {numberFormatter.format(summary?.total ?? 0)}
              </span>
              <span className="text-[10px] font-medium text-muted">entri</span>
            </p>
            <p className="mt-0.5 text-[9px] text-slate-400">Tersimpan di database platform</p>
          </div>
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#eef1fb] text-indigo-500">
            <Database className="size-4.5" />
          </span>
        </article>

        <article className="flex items-start justify-between gap-3 rounded-2xl border border-line bg-white p-4 shadow-sm">
          <div className="min-w-0">
            <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-muted">
              Aksi Sesi Hari Ini
            </p>
            <p className="mt-1 flex items-baseline gap-1.5">
              <span className="text-3xl font-extrabold tracking-tight text-ink">
                {numberFormatter.format(summary?.todayCount ?? 0)}
              </span>
              <span className="text-[9px] font-semibold text-emerald-600">WIB</span>
            </p>
            <p className="mt-0.5 text-[9px] text-slate-400">
              Dari {summary?.todayAdmins ?? 0} admin aktif
            </p>
          </div>
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#e7f7f4] text-teal-600">
            <Zap className="size-4.5" />
          </span>
        </article>

        <article className="flex items-start justify-between gap-3 rounded-2xl border border-line bg-white p-4 shadow-sm">
          <div className="min-w-0">
            <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-muted">
              Admin Pelaku Hari Ini
            </p>
            <p className="mt-1 flex items-center gap-2">
              <span className="text-3xl font-extrabold tracking-tight text-ink">
                {numberFormatter.format(summary?.todayAdmins ?? 0)}
              </span>
              <span className="text-[9px] font-semibold text-slate-500">admin</span>
            </p>
            <p className="mt-0.5 text-[9px] text-slate-400">Tercatat pada log hari ini</p>
          </div>
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#eef1fb] text-indigo-500">
            <ShieldCheck className="size-4.5" />
          </span>
        </article>
      </div>

      <section className="mt-3 rounded-2xl border border-line bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value)
                setPage(1)
              }}
              placeholder="Cari nama admin, ID target, atau alasan..."
              aria-label="Cari log aktivitas"
              className="h-9 w-full rounded-xl border border-line bg-[#f7f7fb] pl-9 pr-3 text-[10px] text-ink outline-none transition placeholder:text-slate-400 focus:border-primary focus:bg-white"
            />
          </div>

          <select
            value={category}
            onChange={(event) => {
              setCategory(event.target.value as 'all' | ActivityCategory)
              setPage(1)
            }}
            aria-label="Filter kategori aksi"
            className="h-9 cursor-pointer rounded-xl border border-line bg-white px-2.5 text-[10px] text-slate-600 outline-none focus:border-primary"
          >
            <option value="all">Semua Kategori Aksi</option>
            {activityCategories.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>

          <div className="flex shrink-0 items-center gap-1 rounded-xl bg-[#f4f5fa] p-1">
            {(['today', '7d', '30d'] as Period[]).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => changePeriod(option)}
                aria-pressed={period === option}
                className={`h-7 rounded-lg px-2.5 text-[10px] font-semibold transition ${
                  period === option
                    ? 'bg-white text-ink shadow-sm'
                    : 'text-slate-500 hover:text-ink'
                }`}
              >
                {option === 'today' ? 'Hari Ini' : option === '7d' ? '7 Hari' : '30 Hari'}
              </button>
            ))}
            <span className="flex size-7 items-center justify-center rounded-lg text-slate-400">
              <Calendar className="size-3.5" />
            </span>
          </div>

          <button
            type="button"
            onClick={refresh}
            className="inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-xl border border-line bg-white px-3 text-[10px] font-semibold text-slate-600 transition hover:bg-slate-50"
          >
            <RefreshCw className={`size-3.5 ${loading ? 'animate-spin' : ''}`} />
            Segarkan
          </button>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleExport}
            disabled={totalEntries === 0 || loading}
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl bg-[#0b3b36] px-3.5 text-[10px] font-semibold text-white transition hover:bg-[#124b43] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Download className="size-3.5" />
            Ekspor Audit (.CSV)
          </button>

          <span className="ml-1 text-[9px] font-medium text-slate-400">Filter aktif:</span>

          {period !== '7d' ? (
            <button
              type="button"
              onClick={() => changePeriod('7d')}
              className="inline-flex items-center gap-1.5 rounded-full border border-indigo-200 bg-indigo-50 py-1 pl-2.5 pr-1.5 text-[9px] font-semibold text-indigo-700 transition hover:bg-indigo-100"
            >
              Rentang: {periodLabels[period]}
              <X className="size-3" />
            </button>
          ) : (
            <span className="rounded-full border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-[9px] font-semibold text-indigo-700">
              Rentang: 7 Hari Terakhir
            </span>
          )}

          {category === 'all' ? (
            <span className="rounded-full bg-[#f4f5fa] px-2.5 py-1 text-[9px] font-semibold text-slate-500">
              Semua Modul
            </span>
          ) : (
            <button
              type="button"
              onClick={() => {
                setCategory('all')
                setPage(1)
              }}
              className="inline-flex items-center gap-1.5 rounded-full bg-[#f4f5fa] py-1 pl-2.5 pr-1.5 text-[9px] font-semibold text-slate-500 transition hover:bg-slate-200"
            >
              Modul: {category}
              <X className="size-3" />
            </button>
          )}

          <button
            type="button"
            onClick={resetFilters}
            disabled={!filtersActive}
            className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-[9px] font-semibold text-slate-500 transition hover:text-ink disabled:cursor-not-allowed disabled:opacity-40"
          >
            <RotateCcw className="size-3" />
            Reset Semua
          </button>

          <span className="ml-auto hidden text-[9px] text-slate-400 sm:inline">
            Sinkron {timeFormatter.format(syncedAt)} WIB
          </span>
        </div>
      </section>

      <section className="mt-3 overflow-hidden rounded-2xl border border-line bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1000px] text-left">
            <thead>
              <tr className="bg-[#f4f5fa] text-[8px] uppercase tracking-[0.12em] text-muted">
                <th className="px-4 py-3 font-bold">Stempel Waktu (WIB)</th>
                <th className="px-4 py-3 font-bold">Pelaksana / Admin</th>
                <th className="px-4 py-3 font-bold">Kategori &amp; Aksi</th>
                <th className="px-4 py-3 font-bold">Objek Sasaran</th>
                <th className="px-4 py-3 font-bold">Deskripsi &amp; Dasar Perubahan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {loading && entries.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-14 text-center">
                    <RefreshCw className="mx-auto size-5 animate-spin text-slate-400" />
                    <p className="mt-2 text-[11px] font-semibold text-ink">Memuat log audit</p>
                    <p className="mt-1 text-[9px] text-muted">
                      Mengambil catatan aktivitas admin dari server.
                    </p>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={5} className="px-4 py-14 text-center">
                    <p className="text-[11px] font-semibold text-ink">Gagal memuat log audit</p>
                    <p className="mt-1 text-[9px] text-muted">{error}</p>
                    <button
                      type="button"
                      onClick={refresh}
                      className="mt-3 inline-flex h-8 items-center justify-center gap-1.5 rounded-lg bg-primary px-3 text-[9px] font-semibold text-white transition hover:bg-primary-hover"
                    >
                      <RefreshCw className="size-3" />
                      Coba Lagi
                    </button>
                  </td>
                </tr>
              ) : entries.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-14 text-center">
                    <p className="text-[11px] font-semibold text-ink">
                      Belum ada log aktivitas pada filter ini
                    </p>
                    <p className="mt-1 text-[9px] text-muted">
                      Ubah kata kunci, kategori aksi, atau rentang waktu untuk melihat catatan
                      lainnya.
                    </p>
                    <button
                      type="button"
                      onClick={resetFilters}
                      className="mt-3 inline-flex h-8 items-center justify-center gap-1.5 rounded-lg bg-primary px-3 text-[9px] font-semibold text-white transition hover:bg-primary-hover"
                    >
                      <RotateCcw className="size-3" />
                      Reset Filter
                    </button>
                  </td>
                </tr>
              ) : (
                entries.map((entry) => {
                  const stamp = formatStamp(entry)
                  return (
                    <tr key={entry.id} className="align-top transition hover:bg-slate-50/70">
                      <td className="whitespace-nowrap px-4 py-3.5">
                        <p className="text-[10px] font-bold text-ink">
                          {stamp.date}, {stamp.time}
                        </p>
                        <p className="mt-1 font-mono text-[8px] text-slate-400">
                          UTC+07:00 • ID #{entry.id.slice(-8)}
                        </p>
                      </td>

                      <td className="px-4 py-3.5">
                        <div className="flex items-start gap-2">
                          <span
                            className={`flex size-6 shrink-0 items-center justify-center rounded-full text-[8px] font-bold ${
                              actorStyles[entry.actor.tone]
                            }`}
                          >
                            {entry.actor.initials}
                          </span>
                          <div className="min-w-0">
                            <p className="whitespace-nowrap text-[10px] font-bold text-ink">
                              {entry.actor.name}
                            </p>
                            <p className="mt-0.5 whitespace-nowrap font-mono text-[8px] text-slate-400">
                              {entry.actor.email}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-1 font-mono text-[8px] font-semibold ${
                            actionStyles[entry.tone]
                          }`}
                        >
                          <span className="size-1.5 rounded-full bg-current opacity-70" />
                          {entry.action}
                        </span>
                        <p className="mt-1 text-[8px] font-medium text-slate-400">
                          {entry.category}
                        </p>
                      </td>

                      <td className="px-4 py-3.5">
                        <p className="flex items-center gap-1 whitespace-nowrap text-[10px] font-semibold text-ink">
                          {entry.objectHref ? (
                            <Link
                              to={entry.objectHref}
                              className="inline-flex items-center gap-1 transition hover:text-primary hover:underline"
                            >
                              {entry.objectName}
                              <ExternalLink className="size-2.5 shrink-0 text-slate-400" />
                            </Link>
                          ) : (
                            entry.objectName
                          )}
                        </p>
                        <p className="mt-0.5 max-w-[220px] truncate text-[8px] text-slate-400">
                          {entry.objectMeta}
                        </p>
                      </td>

                      <td className="max-w-[360px] px-4 py-3.5">
                        <p className="text-[9px] leading-relaxed text-slate-600">
                          {entry.description}{' '}
                          {entry.reference && (
                            <span className={`font-semibold ${entry.referenceTone}`}>
                              {entry.reference}
                            </span>
                          )}
                        </p>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-2 border-t border-line px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[9px] text-muted">
            Menampilkan{' '}
            <span className="font-semibold text-ink">
              {startIndex} - {endIndex}
            </span>{' '}
            dari {numberFormatter.format(totalEntries)} entri audit log
          </p>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setPage(Math.max(1, safePage - 1))}
              disabled={safePage <= 1}
              aria-label="Halaman sebelumnya"
              className="inline-flex size-7 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-300"
            >
              <ChevronLeft className="size-3.5" />
            </button>

            {pageNumbers.map((pageNumber, index) => {
              const previous = pageNumbers[index - 1]
              const showGap = previous !== undefined && pageNumber - previous > 1
              return (
                <span key={pageNumber} className="flex items-center gap-1">
                  {showGap && <span className="px-0.5 text-[9px] text-slate-400">…</span>}
                  <button
                    type="button"
                    onClick={() => setPage(pageNumber)}
                    aria-current={pageNumber === safePage ? 'page' : undefined}
                    className={`flex size-7 items-center justify-center rounded-lg text-[9px] font-semibold transition ${
                      pageNumber === safePage
                        ? 'bg-[#0b3b36] text-white'
                        : 'border border-line bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {pageNumber}
                  </button>
                </span>
              )
            })}

            <button
              type="button"
              onClick={() => setPage(Math.min(pageCount, safePage + 1))}
              disabled={safePage >= pageCount}
              aria-label="Halaman berikutnya"
              className="inline-flex size-7 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-300"
            >
              <ChevronRight className="size-3.5" />
            </button>
          </div>
        </div>
      </section>

      <section className="mt-3 flex flex-col gap-3 rounded-2xl border border-line bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-line bg-[#f7f7fb] text-emerald-600">
            <ShieldCheck className="size-4" />
          </span>
          <div className="min-w-0">
            <p className="text-[10px] font-bold text-ink">Audit Trail Aktif</p>
            <p className="mt-0.5 text-[9px] text-slate-400">
              Setiap aksi admin tercatat otomatis beserta waktu, pelaksana, dan objek sasaran.
            </p>
          </div>
        </div>
        <p className="inline-flex shrink-0 items-center gap-1.5 text-[10px] font-semibold text-ink">
          <span className="size-1.5 rounded-full bg-emerald-500" />
          Log Tersinkron
        </p>
      </section>
    </div>
  )
}
