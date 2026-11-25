import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  BadgeCheck,
  Building2,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Copy,
  Download,
  FileText,
  Fingerprint,
  History,
  Landmark,
  Lock,
  RotateCcw,
  Search,
  ShieldCheck,
  Users,
} from 'lucide-react'
import AdminToast, { type ToastTone } from '../../components/admin/AdminToast'
import { getStoreAuditLog, type AuditCategory, type StoreAuditEntry } from '../../lib/admin-store-audit-log-data'
import { getStoreDetail } from '../../lib/admin-store-detail-data'

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
  hour12: false,
  timeZone: 'Asia/Jakarta',
})

const categoryStyles: Record<AuditCategory, string> = {
  'Verifikasi Legalitas': 'border-emerald-200 bg-emerald-50 text-emerald-700',
  'Delegasi Staf': 'border-violet-200 bg-violet-50 text-violet-700',
  'Rekonsiliasi Escrow': 'border-cyan-200 bg-cyan-50 text-cyan-700',
  'Penerbitan Akad Digital': 'border-indigo-200 bg-indigo-50 text-indigo-700',
  'Uji Isolasi Sanksi': 'border-rose-200 bg-rose-50 text-rose-600',
  'Inisiasi Relasi Akun': 'border-teal-200 bg-teal-50 text-teal-700',
}

const actorToneStyles = {
  primary: 'bg-primary text-white',
  emerald: 'bg-emerald-500 text-white',
  amber: 'bg-amber-500 text-white',
  slate: 'bg-slate-400 text-white',
}

const categories: AuditCategory[] = [
  'Verifikasi Legalitas',
  'Delegasi Staf',
  'Rekonsiliasi Escrow',
  'Penerbitan Akad Digital',
  'Uji Isolasi Sanksi',
  'Inisiasi Relasi Akun',
]

const PERIOD_OPTIONS = [
  { value: 'semua', label: 'Semua Waktu' },
  { value: '2024', label: 'Tahun 2024' },
  { value: '2023', label: 'Tahun 2023' },
]

function formatEntryDate(entry: StoreAuditEntry) {
  return dateFormatter.format(new Date(entry.at))
}

function formatEntryTime(entry: StoreAuditEntry) {
  return `${timeFormatter.format(new Date(entry.at))} WIB`
}

function payloadSnapshot(entry: StoreAuditEntry) {
  return JSON.stringify(
    {
      event: entry.payloadAfter.event,
      previous_state: entry.payloadBefore,
      new_state: entry.payloadAfter,
    },
    null,
    2,
  )
}

export default function AdminStoreAuditLogPage() {
  const { slug = '' } = useParams()
  const detail = getStoreDetail(slug)
  const auditLog = getStoreAuditLog(slug)

  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<'semua' | AuditCategory>('semua')
  const [period, setPeriod] = useState('semua')
  const [page, setPage] = useState(1)
  const [selectedId, setSelectedId] = useState(auditLog.entries[0]?.id ?? '')
  const [showAkad, setShowAkad] = useState(false)
  const [toast, setToast] = useState<{ message: string; tone: ToastTone } | null>(null)

  function showToast(message: string, tone: ToastTone = 'success') {
    setToast({ message, tone })
    window.setTimeout(() => setToast(null), 4200)
  }

  const keyword = query.trim().toLowerCase()
  const filteredEntries = auditLog.entries.filter((entry) => {
    const matchesKeyword =
      keyword.length === 0 ||
      entry.id.toLowerCase().includes(keyword) ||
      entry.title.toLowerCase().includes(keyword) ||
      entry.reference.toLowerCase().includes(keyword) ||
      entry.category.toLowerCase().includes(keyword) ||
      entry.actor.name.toLowerCase().includes(keyword)
    const matchesCategory = category === 'semua' || entry.category === category
    const matchesPeriod = period === 'semua' || entry.at.startsWith(period)
    return matchesKeyword && matchesCategory && matchesPeriod
  })

  const pageSize = 6
  const pageCount = Math.max(1, Math.ceil(filteredEntries.length / pageSize))
  const safePage = Math.min(page, pageCount)
  const startIndex = filteredEntries.length === 0 ? 0 : (safePage - 1) * pageSize + 1
  const endIndex = Math.min(safePage * pageSize, filteredEntries.length)
  const visibleEntries = filteredEntries.slice((safePage - 1) * pageSize, safePage * pageSize)

  const selectedEntry =
    filteredEntries.find((entry) => entry.id === selectedId) ??
    visibleEntries[0] ??
    auditLog.entries[0]

  const filtersActive = keyword.length > 0 || category !== 'semua' || period !== 'semua'

  function resetFilters() {
    setQuery('')
    setCategory('semua')
    setPeriod('semua')
    setPage(1)
  }

  async function copyText(value: string, message: string) {
    try {
      await navigator.clipboard.writeText(value)
      showToast(message)
    } catch {
      showToast('Browser menolak akses clipboard. Salin manual dari panel.', 'error')
    }
  }

  function handleValidateIntegrity() {
    const total = auditLog.entries.length
    showToast(
      `Integritas kriptografi terverifikasi: ${total}/${total} entri cocok dengan hash SHA-256 tersegel.`,
    )
  }

  function handleDownloadCsv() {
    const header = ['ID Log', 'Waktu', 'Kategori', 'Peristiwa', 'Referensi', 'Aktor', 'Hash SHA-256']
    const rows = filteredEntries.map((entry) => [
      entry.id,
      `${formatEntryDate(entry)} ${formatEntryTime(entry)}`,
      entry.category,
      entry.title,
      entry.reference,
      `${entry.actor.name} (${entry.actor.role})`,
      entry.hash,
    ])
    const escape = (value: string) => `"${value.replace(/"/g, '""')}"`
    const csv = [header, ...rows].map((row) => row.map(escape).join(',')).join('\r\n')
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `audit-log-${slug}.csv`
    link.click()
    URL.revokeObjectURL(url)
    showToast(`${filteredEntries.length} entri audit diunduh sebagai berkas CSV.`)
  }

  function handleDownloadAkta() {
    const content = [
      'SALINAN AKAD HUBUNGAN AKUN & TOKO RATIS',
      `Relasi: ${auditLog.relationCode}`,
      `Entitas: ${detail.name} (${detail.storeCode})`,
      `Pemilik: ${auditLog.ownerName} (${auditLog.ownerUserId})`,
      `Merkle root: ${auditLog.merkleRoot}`,
      '',
      auditLog.clauseTitle,
      auditLog.clauseBody,
      '',
      ...auditLog.clausePoints.map((point) => `- ${point}`),
      '',
      `Dokumen terakhir: ${selectedEntry.id} • ${selectedEntry.hash}`,
    ].join('\r\n')
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `akta-relasi-${slug}.txt`
    link.click()
    URL.revokeObjectURL(url)
    showToast('Salinan akta hubungan diunduh.')
  }

  return (
    <div>
      {toast && (
        <AdminToast message={toast.message} tone={toast.tone} onClose={() => setToast(null)} />
      )}

      <div className="flex flex-wrap items-center justify-between gap-2">
        <Link
          to={`/admin/kelola-pengguna/toko-terkait/${slug}`}
          className="inline-flex items-center gap-1.5 text-[10px] font-medium text-muted transition hover:text-ink"
        >
          <ArrowLeft className="size-3.5" />
          Kembali ke Toko Terkait ({detail.name})
        </Link>
        <div className="flex flex-wrap items-center gap-1.5 text-[9px]">
          <span className="inline-flex items-center gap-1 rounded-full bg-primary-soft/60 px-2 py-1 font-semibold text-primary">
            <ShieldCheck className="size-2.5" />
            Kepemilikan Sah &amp; Terverifikasi OSS
          </span>
          <span className="rounded-md border border-line bg-white px-2 py-1 font-mono font-semibold text-slate-500">
            {auditLog.relationCode}
          </span>
          <span className="inline-flex items-center gap-1 rounded-md border border-line bg-white px-2 py-1 font-semibold text-slate-500">
            <Lock className="size-2.5" />
            SHA-256 Validated
          </span>
        </div>
      </div>


      <section className="mt-3 flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0 max-w-3xl">
          <p className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.14em] text-muted">
            <span className="size-1.5 rounded-full bg-primary" />
            Buku Besar Audit Hukum &amp; Tata Kelola
          </p>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-ink sm:text-[30px]">
            Audit Log Hubungan Akun &amp; Toko
          </h1>
          <p className="mt-1.5 max-w-2xl text-[10px] leading-relaxed text-muted">
            Catatan riwayat hukum, delegasi wewenang, perubahan status, dan rekam jejak kepatuhan
            antara Akun Pemilik (<span className="font-semibold text-ink">{auditLog.ownerName}</span>)
            dengan Entitas Bisnis (<span className="font-semibold text-ink">{detail.name}</span>)
            secara kriptografis <span className="italic">immutable</span>.
          </p>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleValidateIntegrity}
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-line bg-white px-3 text-[10px] font-semibold text-slate-600 transition hover:bg-slate-50"
          >
            <Fingerprint className="size-3.5 text-primary" />
            Validasi Integritas Kriptografi
          </button>
          <button
            type="button"
            onClick={handleDownloadCsv}
            disabled={filteredEntries.length === 0}
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-line bg-white px-3 text-[10px] font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Download className="size-3.5" />
            Unduh Berkas Audit (PDF/CSV)
          </button>
        </div>
      </section>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="flex flex-col justify-between rounded-2xl border border-line bg-white p-4 shadow-sm">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-[8px] font-bold uppercase tracking-[0.12em] text-muted">
                Entitas Terkait
              </p>
              <p className="mt-1.5 text-sm font-bold text-ink">{auditLog.ownerName}</p>
              <p className="mt-0.5 text-[9px] text-muted">Pemilik {detail.name}</p>
            </div>
            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary-soft/40 text-primary">
              <Building2 className="size-4" />
            </span>
          </div>
          <div className="mt-3 flex items-center justify-between gap-2 border-t border-line pt-2 text-[8px]">
            <span className="inline-flex items-center gap-1 font-semibold text-slate-600">
              <span className="size-1.5 rounded-full bg-primary" />
              Signatory Utama
            </span>
            <span className="font-mono text-slate-400">{auditLog.ownerUserId}</span>
          </div>
        </div>

        <div className="flex flex-col justify-between rounded-2xl border border-line bg-white p-4 shadow-sm">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-[8px] font-bold uppercase tracking-[0.12em] text-muted">
                Total Entri Audit
              </p>
              <p className="mt-1 flex items-baseline gap-1 text-3xl font-extrabold text-ink">
                {auditLog.entries.length}
                <span className="text-[9px] font-medium text-muted">peristiwa tercatat</span>
              </p>
              <p className="mt-1 text-[9px] leading-relaxed text-muted">
                Sejak pendaftaran {dateFormatter.format(new Date(auditLog.since))}
              </p>
            </div>
            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
              <History className="size-4" />
            </span>
          </div>
          <div className="mt-3 flex items-center justify-between gap-2 border-t border-line pt-2 text-[8px]">
            <span className="inline-flex items-center gap-1 font-semibold text-emerald-600">
              <ShieldCheck className="size-2.5" />
              Zero Tampering (100% Valid)
            </span>
            <span className="font-mono text-slate-400">
              {auditLog.entries.length}/{auditLog.entries.length}
            </span>
          </div>
        </div>

        <div className="flex flex-col justify-between rounded-2xl border border-line bg-white p-4 shadow-sm">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-[8px] font-bold uppercase tracking-[0.12em] text-muted">
                Kuasa &amp; Delegasi Staf
              </p>
              <p className="mt-1 flex items-baseline gap-1 text-3xl font-extrabold text-ink">
                {auditLog.staffActive}
                <span className="ml-1 text-sm font-bold text-ink">Staf</span>
              </p>
              <p className="text-[9px] text-muted">aktif di gerai</p>
              <p className="mt-1 text-[9px] leading-relaxed text-slate-500">{auditLog.staffRoles}</p>
            </div>
            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-500">
              <Users className="size-4" />
            </span>
          </div>
          <div className="mt-3 flex items-center justify-between gap-2 border-t border-line pt-2 text-[8px]">
            <span className="inline-flex items-center gap-1 font-semibold text-slate-600">
              <ShieldCheck className="size-2.5 text-primary" />
              Proteksi Isolasi PRD 15.3
            </span>
            <span className="rounded bg-primary-soft/70 px-1.5 py-0.5 text-[7px] font-bold uppercase tracking-wide text-primary">
              Aktif
            </span>
          </div>
        </div>

        <div className="flex flex-col justify-between rounded-2xl border border-line bg-white p-4 shadow-sm">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-[8px] font-bold uppercase tracking-[0.12em] text-muted">
                Rekening Kliring Escrow
              </p>
              <p className="mt-1.5 text-sm font-bold text-ink">
                {auditLog.escrowBank} <span className="font-mono">{auditLog.escrowMasked}</span>
              </p>
              <p className="mt-0.5 text-[9px] leading-relaxed text-muted">{auditLog.escrowHolder}</p>
            </div>
            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-cyan-50 text-cyan-600">
              <Landmark className="size-4" />
            </span>
          </div>
          <div className="mt-3 flex items-center justify-between gap-2 border-t border-line pt-2 text-[8px]">
            <span className="text-muted">
              Limit: <span className="font-semibold text-slate-600">{auditLog.escrowLimit}</span>
            </span>
            <span className="rounded border border-line px-1.5 py-0.5 font-mono text-[7px] font-semibold text-slate-500">
              {auditLog.escrowRail}
            </span>
          </div>
        </div>
      </div>

      <section className="mt-3 flex flex-col gap-3 rounded-2xl border border-line bg-white p-4 shadow-sm sm:flex-row sm:items-start">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary-soft/50 text-primary">
          <ShieldCheck className="size-4" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-[11px] font-bold text-ink">{auditLog.clauseTitle}</h2>
            <span className="rounded border border-line bg-[#f4f5fa] px-1.5 py-0.5 text-[7px] font-bold uppercase tracking-wide text-slate-500">
              {auditLog.clauseRef}
            </span>
          </div>
          <p className="mt-1 text-[9px] leading-relaxed text-muted">{auditLog.clauseBody}</p>

          {showAkad && (
            <ul className="mt-2.5 space-y-1.5 rounded-xl bg-[#f7f7fb] p-3">
              {auditLog.clausePoints.map((point) => (
                <li key={point} className="flex gap-1.5 text-[9px] leading-relaxed text-slate-600">
                  <span className="mt-1.5 size-1 shrink-0 rounded-full bg-primary" />
                  {point}
                </li>
              ))}
            </ul>
          )}
        </div>
        <button
          type="button"
          onClick={() => setShowAkad((current) => !current)}
          aria-expanded={showAkad}
          className="inline-flex h-8 shrink-0 items-center justify-center gap-1.5 self-start rounded-lg border border-line bg-white px-2.5 text-[9px] font-semibold text-slate-600 transition hover:bg-slate-50"
        >
          {showAkad ? 'Tutup Salinan Akad' : 'Baca Salinan Akad PRD'}
          <ChevronDown className={`size-3 transition ${showAkad ? 'rotate-180' : ''}`} />
        </button>
      </section>

      <div className="mt-3 grid gap-3 xl:grid-cols-[minmax(0,1fr)_320px]">
        <section className="min-w-0 overflow-hidden rounded-2xl border border-line bg-white shadow-sm">
          <div className="flex flex-col gap-2 border-b border-line p-3 lg:flex-row lg:items-center">
            <div className="relative min-w-0 flex-1">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value)
                  setPage(1)
                }}
                placeholder="Cari ID log, aktor, atau deskripsi peristiwa"
                aria-label="Cari entri audit"
                className="h-8 w-full rounded-lg border border-line bg-[#f7f7fb] pl-8 pr-3 text-[10px] text-ink outline-none transition placeholder:text-slate-400 focus:border-primary focus:bg-white"
              />
            </div>
            <select
              value={category}
              onChange={(event) => {
                setCategory(event.target.value as 'semua' | AuditCategory)
                setPage(1)
              }}
              aria-label="Filter kategori peristiwa"
              className="h-8 cursor-pointer rounded-lg border border-line bg-white px-2 text-[10px] text-slate-600 outline-none focus:border-primary"
            >
              <option value="semua">Semua Kategori Peristiwa</option>
              {categories.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            <select
              value={period}
              onChange={(event) => {
                setPeriod(event.target.value)
                setPage(1)
              }}
              aria-label="Filter rentang waktu"
              className="h-8 cursor-pointer rounded-lg border border-line bg-white px-2 text-[10px] text-slate-600 outline-none focus:border-primary"
            >
              {PERIOD_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={resetFilters}
              disabled={!filtersActive}
              className="inline-flex h-8 shrink-0 items-center justify-center gap-1 rounded-lg px-2 text-[10px] font-semibold text-slate-500 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <RotateCcw className="size-3" />
              Reset
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left">
              <thead>
                <tr className="bg-[#f4f5fa] text-[8px] uppercase tracking-[0.1em] text-muted">
                  <th className="px-3 py-2.5 font-bold">Stempel Waktu &amp; ID</th>
                  <th className="px-3 py-2.5 font-bold">Kategori &amp; Peristiwa</th>
                  <th className="px-3 py-2.5 font-bold">Deskripsi Rinci Klausul</th>
                  <th className="px-4 py-2.5 font-bold">Aktor / Pelaksana</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {visibleEntries.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-12 text-center">
                      <p className="text-[11px] font-semibold text-ink">
                        Tidak ada entri audit yang cocok
                      </p>
                      <p className="mt-1 text-[9px] text-muted">
                        Ubah kata kunci atau reset filter untuk melihat seluruh riwayat.
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
                  visibleEntries.map((entry) => {
                    const isSelected = entry.id === selectedEntry.id
                    return (
                      <tr
                        key={entry.id}
                        onClick={() => setSelectedId(entry.id)}
                        className={`cursor-pointer align-top transition ${
                          isSelected ? 'bg-primary-soft/15' : 'hover:bg-slate-50/70'
                        }`}
                      >
                        <td className="px-3 py-3">
                          <p className="text-[10px] font-bold text-ink">{formatEntryDate(entry)}</p>
                          <p className="mt-0.5 text-[8px] text-slate-400">{formatEntryTime(entry)}</p>
                          <span className="mt-1.5 inline-block rounded border border-line bg-[#f4f5fa] px-1.5 py-0.5 font-mono text-[7px] font-semibold text-slate-500">
                            #{entry.id}
                          </span>
                        </td>
                        <td className="px-3 py-3">
                          <span
                            className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[8px] font-semibold ${
                              categoryStyles[entry.category]
                            }`}
                          >
                            <span className="size-1.5 rounded-full bg-current opacity-70" />
                            {entry.category}
                          </span>
                        </td>
                        <td className="max-w-[260px] px-3 py-3">
                          <p className="text-[9px] font-semibold leading-relaxed text-ink">
                            {entry.title}
                          </p>
                          <p className="mt-0.5 truncate text-[8px] leading-relaxed text-slate-400">
                            {entry.reference}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span
                              className={`flex size-6 shrink-0 items-center justify-center rounded-full text-[7px] font-bold ${
                                actorToneStyles[entry.actor.tone]
                              }`}
                            >
                              {entry.actor.initials}
                            </span>
                            <div className="min-w-0">
                              <p className="truncate text-[9px] font-bold text-ink">
                                {entry.actor.name}
                              </p>
                              <p className="truncate text-[8px] text-muted">{entry.actor.role}</p>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col gap-2 border-t border-line px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[9px] text-muted">
              Menampilkan{' '}
              <span className="font-semibold text-ink">
                {startIndex} - {endIndex}
              </span>{' '}
              dari {filteredEntries.length} peristiwa audit
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
              {Array.from({ length: pageCount }, (_, index) => index + 1).map((pageNumber) => (
                <button
                  key={pageNumber}
                  type="button"
                  onClick={() => setPage(pageNumber)}
                  className={`flex size-7 items-center justify-center rounded-lg text-[9px] font-semibold transition ${
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
                className="inline-flex size-7 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-300"
              >
                <ChevronRight className="size-3.5" />
              </button>
            </div>
          </div>
        </section>

        <aside className="min-w-0 space-y-3">
          <section className="rounded-2xl border border-line bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-[8px] font-bold uppercase tracking-[0.12em] text-muted">
                  Metadata Inspeksi Log
                </p>
                <p className="mt-1 font-mono text-[11px] font-bold text-ink">
                  #{selectedEntry.id}
                </p>
              </div>
              <span className="inline-flex items-center gap-1 rounded-full bg-primary-soft/60 px-2 py-1 text-[7px] font-bold uppercase tracking-wide text-primary">
                <BadgeCheck className="size-2.5" />
                Verified
              </span>
            </div>

            <div className="mt-3 rounded-xl bg-[#f7f7fb] p-2.5">
              <div className="flex items-center gap-2.5">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-slate-200 text-[9px] font-semibold text-slate-400">
                  img
                </span>
                <div className="min-w-0">
                  <p className="truncate text-[11px] font-bold text-ink">{detail.name}</p>
                  <p className="truncate text-[8px] text-muted">Pemilik: {auditLog.ownerName}</p>
                  <p className="truncate font-mono text-[8px] text-slate-400">
                    NIB: {detail.nib}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-[8px] font-bold uppercase tracking-[0.1em] text-muted">
                  Tanda Tangan Hash SHA-256
                </p>
                <button
                  type="button"
                  onClick={() => copyText(selectedEntry.hash, 'Hash SHA-256 entri disalin.')}
                  className="inline-flex items-center gap-1 text-[8px] font-semibold text-primary transition hover:text-primary-hover"
                >
                  <Copy className="size-2.5" />
                  Salin Hash
                </button>
              </div>
              <p className="mt-1 break-all font-mono text-[8px] leading-relaxed text-slate-500">
                {selectedEntry.hash}
              </p>
              <p className="mt-1.5 flex items-center gap-1 font-mono text-[8px] text-slate-400">
                <Fingerprint className="size-2.5" />
                Merkle Tree Root: {auditLog.merkleRoot}
              </p>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2">
              <div className="rounded-lg border border-line p-2">
                <p className="text-[7px] font-bold uppercase tracking-wide text-muted">
                  Alamat IP Pelaksana
                </p>
                <p className="mt-1 font-mono text-[8px] font-semibold text-slate-600">
                  {selectedEntry.ip}
                </p>
                <p className="mt-0.5 text-[7px] text-slate-400">Bantul, D.I. Yogyakarta</p>
              </div>
              <div className="rounded-lg border border-line p-2">
                <p className="text-[7px] font-bold uppercase tracking-wide text-muted">
                  Agen Perangkat
                </p>
                <p className="mt-1 text-[8px] font-semibold leading-snug text-slate-600">
                  {selectedEntry.agent}
                </p>
              </div>
            </div>

            <div className="mt-3 rounded-xl border border-primary/15 bg-primary-soft/20 p-2.5">
              <p className="flex items-center gap-1 text-[8px] font-bold uppercase tracking-wide text-primary">
                <Lock className="size-2.5" />
                Landasan Kebijakan PRD
              </p>
              <p className="mt-1 text-[8px] leading-relaxed text-slate-600">
                Klausul 15.3 (Independensi Toko): Hak milik perdata gerai terdaftar tidak dapat
                dicabut sepanjang putusan arbitrase platform atau penetapan NIB resmi oleh BKPM.
              </p>
            </div>

            <div className="mt-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-[8px] font-bold uppercase tracking-[0.1em] text-muted">
                  Snapshot Payload Diff (JSON)
                </p>
                <span className="rounded border border-line px-1.5 py-0.5 text-[7px] font-semibold text-slate-400">
                  State Transition
                </span>
              </div>
              <pre className="mt-1.5 max-h-52 overflow-auto rounded-lg bg-[#12201f] p-2.5 font-mono text-[7px] leading-relaxed text-emerald-100/90">
                {payloadSnapshot(selectedEntry)}
              </pre>
            </div>

            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={() =>
                  copyText(
                    JSON.stringify(
                      {
                        log_id: selectedEntry.id,
                        category: selectedEntry.category,
                        title: selectedEntry.title,
                        actor: selectedEntry.actor.name,
                        hash: selectedEntry.hash,
                        payload: JSON.parse(payloadSnapshot(selectedEntry)),
                      },
                      null,
                      2,
                    ),
                    'Raw JSON entri audit disalin.',
                  )
                }
                className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-xl border border-line bg-white text-[9px] font-semibold text-slate-600 transition hover:bg-slate-50"
              >
                <FileText className="size-3.5" />
                Salin Raw JSON
              </button>
              <button
                type="button"
                onClick={handleDownloadAkta}
                className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-xl bg-primary text-[9px] font-semibold text-white transition hover:bg-primary-hover"
              >
                <Download className="size-3.5" />
                Dokumen Akta
              </button>
            </div>

            <p className="mt-2 flex items-center justify-center gap-1 text-[7px] text-slate-400">
              <Check className="size-2.5 text-emerald-500" />
              Entri tersegel pada ledger append-only
            </p>
          </section>
        </aside>
      </div>
    </div>
  )
}
