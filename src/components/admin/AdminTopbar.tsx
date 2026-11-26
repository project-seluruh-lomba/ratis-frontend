import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  Bell,
  ChevronDown,
  ChevronRight,
  LogOut,
  Menu,
  Search,
  Store,
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { shopsApi } from '../../lib/api/services'
import { clearAdminSession } from '../../lib/auth'

type AdminTopbarProps = {
  onMenuClick: () => void
  adminName: string
  adminEmail: string
  role: string
}

function getInitials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')
}

export default function AdminTopbar({
  onMenuClick,
  adminName,
  adminEmail,
  role,
}: AdminTopbarProps) {
  const navigate = useNavigate()
  const { data: pendingData } = useQuery({ queryKey: ['pending-shops-topbar'], queryFn: () => shopsApi.list({ status: 'pending', limit: 5, page: 1 }) })
  const pendingList = pendingData?.data ?? []
  const pendingTotal = pendingData?.meta?.total ?? 0
  const [query, setQuery] = useState('')
  const [bellOpen, setBellOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const keyword = query.trim()
    if (!keyword) return
    navigate(`/admin/umkm?cari=${encodeURIComponent(keyword)}`)
  }

  function handleLogout() {
    clearAdminSession()
    navigate('/admin-login', { replace: true })
  }

  return (
    <header className="sticky top-0 z-30 flex h-[72px] items-center gap-3 border-b border-line bg-white/95 px-4 backdrop-blur sm:px-6 lg:px-8 print:hidden">
      <button
        type="button"
        onClick={onMenuClick}
        aria-label="Buka menu"
        className="flex size-9 shrink-0 items-center justify-center rounded-lg text-slate-600 transition hover:bg-slate-100 lg:hidden"
      >
        <Menu className="size-5" />
      </button>

      <nav className="hidden items-center gap-2 text-sm md:flex">
        <span className="text-muted">Portal Admin</span>
        <ChevronRight className="size-3.5 text-slate-300" />
        <span className="font-semibold text-ink">Pusat Operasional UMKM</span>
      </nav>

      <span className="text-sm font-bold text-ink md:hidden">Pusat Operasional</span>

      <form onSubmit={handleSearch} className="relative ml-auto hidden w-full max-w-sm md:block">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Cari pedagang, NIB, atau no. transaksi..."
          className="h-10 w-full rounded-xl border border-line bg-slate-50/70 pl-10 pr-4 text-xs text-ink outline-none transition placeholder:text-slate-400 focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10"
        />
      </form>

      <div className="ml-auto flex items-center gap-1.5 md:ml-0">
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setBellOpen((current) => !current)
              setProfileOpen(false)
            }}
            aria-label="Notifikasi"
            className="relative flex size-10 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
          >
            <Bell className="size-[18px]" />
            <span className="absolute right-2.5 top-2.5 size-2 rounded-full bg-red-500 ring-2 ring-white" />
          </button>

          {bellOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setBellOpen(false)} aria-hidden />
              <div className="absolute right-0 z-50 mt-2 w-[320px] max-w-[calc(100vw-2rem)] rounded-2xl border border-line bg-white p-2.5 shadow-xl">
                <div className="flex items-center justify-between px-2 pb-1.5 pt-1">
                  <p className="text-sm font-bold text-ink">Notifikasi</p>
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                    {pendingTotal} baru
                  </span>
                </div>
                <ul className="mt-1 space-y-0.5">
                  {pendingList.map((item) => (
                    <li key={item.id}>
                      <Link
                        to={`/admin/umkm/${item.slug}`}
                        onClick={() => setBellOpen(false)}
                        className="flex items-start gap-2.5 rounded-xl px-2 py-2 transition hover:bg-slate-50"
                      >
                        <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary-soft/50 text-primary">
                          <Store className="size-4" />
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate text-xs font-semibold text-ink">
                            {item.name}
                          </span>
                          <span className="mt-0.5 block text-[10px] text-muted">
                            Menunggu verifikasi â€¢ {new Date(item.createdAt).toLocaleDateString('id-ID')}
                          </span>
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
                <Link
                  to="/admin/umkm?status=pending"
                  onClick={() => setBellOpen(false)}
                  className="mt-2 flex items-center justify-center gap-1.5 border-t border-line pt-2.5 text-xs font-semibold text-primary transition hover:text-primary-hover"
                >
                  Lihat semua antrean
                  <ArrowRight className="size-3.5" />
                </Link>
              </div>
            </>
          )}
        </div>

        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setProfileOpen((current) => !current)
              setBellOpen(false)
            }}
            className="flex items-center gap-2.5 rounded-xl px-1.5 py-1.5 transition hover:bg-slate-50"
          >
            <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-xs font-bold text-slate-500">
              {getInitials(adminName)}
            </span>
            <span className="hidden text-left md:block">
              <span className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-ink">{adminName}</span>
                <span className="rounded bg-primary-soft px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wide text-primary">
                  {role}
                </span>
              </span>
              <span className="mt-0.5 block text-[10px] text-muted">{adminEmail}</span>
            </span>
            <ChevronDown className="hidden size-3.5 text-slate-400 md:block" />
          </button>

          {profileOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setProfileOpen(false)}
                aria-hidden
              />
              <div className="absolute right-0 z-50 mt-2 w-60 rounded-2xl border border-line bg-white p-1.5 shadow-xl">
                <div className="border-b border-line px-3 py-2.5 md:hidden">
                  <p className="text-xs font-bold text-ink">{adminName}</p>
                  <p className="mt-0.5 truncate text-[10px] text-muted">{adminEmail}</p>
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-red-600 transition hover:bg-red-50"
                >
                  <LogOut className="size-4" />
                  Keluar dari panel
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  )
}






