import { NavLink } from 'react-router-dom'
import {
  Boxes,
  History,
  House,
  LayoutDashboard,
  ShoppingBag,
  Store,
  Users,
  X,
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { shopsApi } from '../../lib/api/services'

type AdminSidebarProps = {
  open: boolean
  onClose: () => void
}

const navigation = [
  { label: 'Dashboard', to: '/admin/dashboard', icon: LayoutDashboard },
  { label: 'Kelola UMKM', to: '/admin/umkm', icon: Store, badge: 'pending' },
  { label: 'Kelola Kategori', to: '/admin/kategori', icon: Boxes },
  { label: 'Monitoring Pesanan', to: '/admin/pesanan', icon: ShoppingBag },
  { label: 'Kelola Pengguna', to: '/admin/kelola-pengguna', icon: Users },
  { label: 'Log Aktivitas', to: '/admin/log', icon: History, tag: 'Cloud' },
]

const usePending = () => { const { data } = useQuery({ queryKey: ['pending-shops-sidebar'], queryFn: () => shopsApi.list({ status: 'pending', limit: 1, page: 1 }) }); return data?.meta?.total ?? 0 };

function SidebarContent({
  onNavigate,
  drawer = false,
}: {
  onNavigate?: () => void
  drawer?: boolean
}) {
  const pendingCount = usePending()
  return (
    <>
      <div
        className={`flex h-[72px] shrink-0 items-center gap-3 border-b border-line px-5 ${
          drawer ? 'pr-14' : ''
        }`}
      >
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary text-white">
          <House className="size-5" />
        </div>
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 text-lg font-extrabold leading-none tracking-tight text-ink">
            Ratis
            <span className="rounded bg-primary-soft px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-primary">
              Admin
            </span>
          </p>
          <p className="mt-1.5 truncate text-[10px] font-medium text-muted">
            Portal Pengawasan &amp; Kurasi UMKM
          </p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-5">
        <p className="px-2 pb-2.5 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
          Menu
        </p>
        <ul className="space-y-1">
          {navigation.map(({ label, to, icon: Icon, badge, tag }) => (
            <li key={to}>
              <NavLink
                to={to}
                end={to === '/admin/dashboard'}
                onClick={onNavigate}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${
                    isActive
                      ? 'bg-primary-soft/60 font-semibold text-primary'
                      : 'font-medium text-slate-600 hover:bg-slate-50 hover:text-ink'
                  }`
                }
              >
                <Icon className="size-[18px] shrink-0" />
                <span className="flex-1 truncate">{label}</span>
                {(badge === 'pending' ? pendingCount > 0 : !!badge) ? (
                  <span className="rounded-full bg-rose-100 px-1.5 py-0.5 text-[10px] font-bold text-rose-600">
                    {badge === 'pending' ? pendingCount : badge}
                  </span>
                ) : null}
                {tag ? (
                  <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[9px] font-semibold text-slate-500">
                    {tag}
                  </span>
                ) : null}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className="shrink-0 border-t border-line p-3">
        <div className="rounded-xl border border-line bg-slate-50/80 p-3">
          <div className="flex items-center gap-2">
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-60" />
              <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
            </span>
            <p className="text-[11px] font-bold text-ink">System Normal</p>
          </div>
          <p className="mt-1 text-[10px] leading-relaxed text-muted">
            Server Operasional Terhubung ke Pusat Data
          </p>
          <p className="mt-2 text-right text-[9px] font-semibold text-slate-400">v1.2.0</p>
        </div>
      </div>
    </>
  )
}

export default function AdminSidebar({ open, onClose }: AdminSidebarProps) {
  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[264px] flex-col border-r border-line bg-white lg:flex print:hidden">
        <SidebarContent />
      </aside>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden
          />
          <aside className="absolute inset-y-0 left-0 flex w-[288px] max-w-[85vw] flex-col bg-white shadow-2xl print:hidden">
            <button
              type="button"
              onClick={onClose}
              aria-label="Tutup menu"
              className="absolute right-3 top-3 z-10 flex size-8 items-center justify-center rounded-lg bg-slate-100 text-slate-500 transition hover:bg-slate-200 hover:text-slate-700"
            >
              <X className="size-4" />
            </button>
            <SidebarContent onNavigate={onClose} drawer />
          </aside>
        </div>
      )}
    </>
  )
}



