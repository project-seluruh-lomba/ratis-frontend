import { useState, type FormEvent } from 'react'
import {
  Link,
  Navigate,
  NavLink,
  Outlet,
  useLocation,
  useNavigate,
} from 'react-router-dom'
import {
  BarChart3,
  Bell,
  CalendarDays,
  ChevronDown,
  ChevronsUpDown,
  Eye,
  Headphones,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  Search,
  ShoppingBag,
  Store,
  Users,
  Wallet,
  X,
} from 'lucide-react'
import {
  clearOwnerSession,
  getOwnerSession,
  type OwnerSession,
} from '../../lib/owner-auth'
import { ownerNotifications, ownerStatusMeta } from '../../lib/owner-dashboard-data'

const navigation = [
  { label: 'Dashboard', to: '/owner/dashboard', icon: LayoutDashboard, end: true },
  { label: 'Pesanan', to: '/owner/pesanan', icon: ShoppingBag, badge: '3 Baru' },
  { label: 'Produk & Stok', to: '/owner/produk', icon: Package },
  { label: 'Keuangan', to: '/owner/keuangan', icon: Wallet },
  { label: 'Staf Toko', to: '/owner/staf', icon: Users },
  { label: 'Laporan & Ekspor', to: '/owner/laporan', icon: BarChart3 },
]

const secondaryNavigation = [
  { label: 'Profil Toko', to: '/owner/toko', icon: Store },
  { label: 'Pratinjau Storefront', to: '/owner/pratinjau', icon: Eye },
]

const pageTitles: Record<string, string> = {
  dashboard: 'Ringkasan Toko',
  pratinjau: 'Pratinjau Storefront Toko',
  pesanan: 'Pesanan',
  produk: 'Produk & Stok',
  keuangan: 'Keuangan',
  staf: 'Staf Toko',
  laporan: 'Laporan & Ekspor',
  toko: 'Profil Toko',
  notifikasi: 'Notifikasi',
  bantuan: 'Pusat Bantuan',
}

function getInitials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')
}

function formatDate() {
  return new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date())
}

function SidebarContent({
  session,
  onNavigate,
  drawer = false,
}: {
  session: OwnerSession
  onNavigate?: () => void
  drawer?: boolean
}) {
  const navigate = useNavigate()
  const status = ownerStatusMeta[session.storeStatus]

  function handleLogout() {
    clearOwnerSession()
    navigate('/', { replace: true })
  }

  return (
    <>
      <div
        className={`flex h-[72px] shrink-0 items-center gap-3 border-b border-line px-5 ${
          drawer ? 'pr-14' : ''
        }`}
      >
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#0b3b3a] text-lg font-extrabold text-white">
          R
        </div>
        <div className="min-w-0">
          <p className="truncate text-[17px] font-extrabold leading-none tracking-tight text-ink">
            Ratis<span className="text-primary">Bisnis</span>
          </p>
          <p className="mt-1.5 text-[10px] font-medium text-muted">Platform UMKM</p>
        </div>
      </div>

      <div className="shrink-0 px-4 pt-4">
        <Link
          to="/owner/toko"
          onClick={onNavigate}
          className="flex items-center justify-between gap-2 rounded-xl bg-[#f1f5f9] px-3 py-2.5 transition hover:bg-slate-200/70"
        >
          <div className="min-w-0">
            <p className="truncate text-xs font-bold text-ink">{session.storeName}</p>
            <p className="mt-1 flex items-center gap-1.5 text-[10px] font-medium text-slate-500">
              <span className={`size-1.5 shrink-0 rounded-full ${status.dotClassName}`} />
              <span className="truncate">Toko {status.label}</span>
            </p>
          </div>
          <ChevronsUpDown className="size-4 shrink-0 text-slate-400" />
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="space-y-1">
          {navigation.map(({ label, to, icon: Icon, badge, end }) => (
            <li key={to}>
              <NavLink
                to={to}
                end={end}
                onClick={onNavigate}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13.5px] transition ${
                    isActive
                      ? 'bg-[#d8f5ec] font-semibold text-primary'
                      : 'font-medium text-slate-600 hover:bg-slate-50 hover:text-ink'
                  }`
                }
              >
                <Icon className="size-[18px] shrink-0" />
                <span className="flex-1 truncate">{label}</span>
                {badge ? (
                  <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-white">
                    {badge}
                  </span>
                ) : null}
              </NavLink>
            </li>
          ))}
        </ul>

        <div className="my-3 border-t border-line" />

        <ul className="space-y-1">
          {secondaryNavigation.map(({ label, to, icon: Icon }) => (
            <li key={to}>
              <NavLink
                to={to}
                onClick={onNavigate}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13.5px] transition ${
                    isActive
                      ? 'bg-[#d8f5ec] font-semibold text-primary'
                      : 'font-medium text-slate-600 hover:bg-slate-50 hover:text-ink'
                  }`
                }
              >
                <Icon className="size-[18px] shrink-0" />
                <span className="flex-1 truncate">{label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className="shrink-0 border-t border-line p-3">
        <div className="rounded-xl bg-[#eef2ff] p-3.5">
          <div className="flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-full bg-white text-[#3b5bdb]">
              <Headphones className="size-4" />
            </span>
            <p className="text-[12px] font-bold text-ink">Bantuan CS</p>
          </div>
          <p className="mt-1.5 text-[10.5px] leading-relaxed text-slate-600">
            Kendala operasional toko? Tim Ratis siap mendampingi.
          </p>
          <Link
            to="/owner/bantuan"
            onClick={onNavigate}
            className="mt-2.5 flex h-8 items-center justify-center rounded-lg bg-white text-[11px] font-semibold text-ink shadow-sm transition hover:bg-slate-50"
          >
            Hubungi Dukungan
          </Link>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="mt-3 flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-[13px] font-semibold text-red-600 transition hover:bg-red-50"
        >
          <LogOut className="size-[18px]" />
          Keluar Akun
        </button>
      </div>
    </>
  )
}

function MobileBottomNav({ onMenuClick }: { onMenuClick: () => void }) {
  const items = [
    { label: 'Dashboard', to: '/owner/dashboard', icon: LayoutDashboard, end: true },
    { label: 'Pesanan', to: '/owner/pesanan', icon: ShoppingBag },
    { label: 'Produk', to: '/owner/produk', icon: Package },
    { label: 'Keuangan', to: '/owner/keuangan', icon: Wallet },
  ]

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-white pb-[env(safe-area-inset-bottom)] lg:hidden">
      <div className="grid grid-cols-5">
        {items.map(({ label, to, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center gap-1 py-2.5 text-[10px] font-semibold transition ${
                isActive ? 'text-primary' : 'text-slate-500'
              }`
            }
          >
            <Icon className="size-5" />
            {label}
          </NavLink>
        ))}
        <button
          type="button"
          onClick={onMenuClick}
          className="flex flex-col items-center justify-center gap-1 py-2.5 text-[10px] font-semibold text-slate-500"
        >
          <Menu className="size-5" />
          Menu
        </button>
      </div>
    </nav>
  )
}

export default function OwnerLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const [session] = useState(getOwnerSession)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [bellOpen, setBellOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [query, setQuery] = useState('')

  if (!session) {
    return <Navigate to="/" replace />
  }

  const status = ownerStatusMeta[session.storeStatus]
  const activeSegment = location.pathname.split('/')[2] ?? 'dashboard'
  const pageTitle = pageTitles[activeSegment] ?? 'Ringkasan Toko'
  const showDashboardCrumb = activeSegment !== 'dashboard'

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const keyword = query.trim()
    if (!keyword) return
    navigate(`/owner/pesanan?cari=${encodeURIComponent(keyword)}`)
    setQuery('')
  }

  function handleLogout() {
    clearOwnerSession()
    navigate('/', { replace: true })
  }

  return (
    <div className="min-h-screen bg-[#f6f8fc]">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[264px] flex-col border-r border-line bg-white lg:flex">
        <SidebarContent session={session} />
      </aside>

      <div className="lg:pl-[264px]">
        <header className="sticky top-0 z-30 border-b border-line bg-white/95 backdrop-blur">
          <div className="flex h-16 items-center gap-3 px-4 sm:px-6 lg:h-[72px] lg:px-8">
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              aria-label="Buka menu"
              className="flex size-9 shrink-0 items-center justify-center rounded-lg text-slate-600 transition hover:bg-slate-100 lg:hidden"
            >
              <Menu className="size-5" />
            </button>

            <div className="hidden shrink-0 lg:block">
              <nav className="flex items-center gap-2 text-xs">
                <span className="font-semibold text-ink">Ratis Bisnis</span>
                <span className="text-slate-300">/</span>
                {showDashboardCrumb && (
                  <>
                    <Link
                      to="/owner/dashboard"
                      className="font-medium text-slate-500 transition hover:text-primary"
                    >
                      Dashboard
                    </Link>
                    <span className="text-slate-300">/</span>
                  </>
                )}
                <span className="text-slate-500">{pageTitle}</span>
              </nav>
              <p className="mt-1.5 flex items-center gap-1.5 text-[11px] text-slate-500">
                <CalendarDays className="size-3.5 text-slate-400" />
                Hari ini, {formatDate()}
              </p>
            </div>

            <div className="min-w-0 lg:hidden">
              <p className="truncate text-[13px] font-bold text-ink">{session.storeName}</p>
              <p className="mt-0.5 flex items-center gap-1.5 text-[10px] font-medium text-slate-500">
                <span className={`size-1.5 rounded-full ${status.dotClassName}`} />
                Toko {status.label}
              </p>
            </div>

            <form
              onSubmit={handleSearch}
              className="relative ml-auto hidden w-full max-w-[420px] md:block"
            >
              <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Cari pesanan, produk..."
                className="h-10 w-full rounded-xl border border-line bg-[#f7f9fc] pl-10 pr-14 text-xs text-ink outline-none transition placeholder:text-slate-400 focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10"
              />
              <span className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 rounded border border-line bg-white px-1.5 py-0.5 text-[9px] font-semibold text-slate-400 sm:block">
                ⌘K
              </span>
            </form>

            <div className="ml-auto flex items-center gap-1 md:ml-0">
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setBellOpen((current) => !current)
                    setProfileOpen(false)
                  }}
                  aria-label="Notifikasi"
                  className="relative flex size-9 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
                >
                  <Bell className="size-[18px]" />
                  <span className="absolute right-2 top-2 size-2 rounded-full bg-red-500 ring-2 ring-white" />
                </button>

                {bellOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setBellOpen(false)}
                      aria-hidden
                    />
                    <div className="absolute right-0 z-50 mt-2 w-[320px] max-w-[calc(100vw-2rem)] rounded-2xl border border-line bg-white p-2.5 shadow-xl">
                      <div className="flex items-center justify-between px-2 pb-1.5 pt-1">
                        <p className="text-sm font-bold text-ink">Notifikasi</p>
                        <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-700">
                          5 baru
                        </span>
                      </div>
                      <ul className="mt-1 space-y-0.5">
                        {ownerNotifications.slice(0, 3).map((item) => (
                          <li key={item.id}>
                            <Link
                              to={item.to}
                              onClick={() => setBellOpen(false)}
                              className="flex items-start gap-2.5 rounded-xl px-2 py-2 transition hover:bg-slate-50"
                            >
                              <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary-soft/50 text-primary">
                                <Bell className="size-4" />
                              </span>
                              <span className="min-w-0">
                                <span className="block truncate text-xs font-semibold text-ink">
                                  {item.title}
                                </span>
                                <span className="mt-0.5 block truncate text-[10px] text-muted">
                                  {item.message} • {item.time}
                                </span>
                              </span>
                            </Link>
                          </li>
                        ))}
                      </ul>
                      <Link
                        to="/owner/notifikasi"
                        onClick={() => setBellOpen(false)}
                        className="mt-2 flex items-center justify-center gap-1.5 border-t border-line pt-2.5 text-xs font-semibold text-primary transition hover:text-primary-hover"
                      >
                        Lihat semua notifikasi
                      </Link>
                    </div>
                  </>
                )}
              </div>

              <span
                className={`ml-1 hidden items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold sm:flex ${status.badgeClassName}`}
              >
                <span className={`size-1.5 rounded-full ${status.dotClassName}`} />
                {status.label}
              </span>

              <span aria-hidden className="mx-2 hidden h-6 w-px bg-line sm:block" />

              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setProfileOpen((current) => !current)
                    setBellOpen(false)
                  }}
                  className="flex items-center gap-2.5 rounded-xl px-1 py-1 transition hover:bg-slate-50"
                >
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#0f766e] text-[11px] font-bold text-white">
                    {getInitials(session.name)}
                  </span>
                  <span className="hidden text-left sm:block">
                    <span className="block max-w-[120px] truncate text-xs font-bold text-ink">
                      {session.name}
                    </span>
                    <span className="mt-0.5 block text-[10px] text-muted">Pemilik Toko</span>
                  </span>
                  <ChevronDown className="hidden size-3.5 text-slate-400 sm:block" />
                </button>

                {profileOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setProfileOpen(false)}
                      aria-hidden
                    />
                    <div className="absolute right-0 z-50 mt-2 w-60 rounded-2xl border border-line bg-white p-1.5 shadow-xl">
                      <div className="border-b border-line px-3 py-2.5">
                        <p className="truncate text-xs font-bold text-ink">{session.name}</p>
                        <p className="mt-0.5 truncate text-[10px] text-muted">{session.email}</p>
                      </div>
                      <Link
                        to="/owner/toko"
                        onClick={() => setProfileOpen(false)}
                        className="mt-1 flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                      >
                        <Store className="size-4" />
                        Profil Toko
                      </Link>
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-red-600 transition hover:bg-red-50"
                      >
                        <LogOut className="size-4" />
                        Keluar Akun
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1320px] px-4 pb-24 pt-5 sm:px-6 lg:px-8 lg:pb-10 lg:pt-7">
          <Outlet />
        </main>
      </div>

      <MobileBottomNav onMenuClick={() => setDrawerOpen(true)} />

      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => setDrawerOpen(false)}
            aria-hidden
          />
          <aside className="absolute inset-y-0 left-0 flex w-[288px] max-w-[85vw] flex-col bg-white shadow-2xl">
            <button
              type="button"
              onClick={() => setDrawerOpen(false)}
              aria-label="Tutup menu"
              className="absolute right-3 top-3 z-10 flex size-8 items-center justify-center rounded-lg bg-slate-100 text-slate-500 transition hover:bg-slate-200 hover:text-slate-700"
            >
              <X className="size-4" />
            </button>
            <SidebarContent
              session={session}
              onNavigate={() => setDrawerOpen(false)}
              drawer
            />
          </aside>
        </div>
      )}
    </div>
  )
}
