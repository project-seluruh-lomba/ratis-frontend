import { useEffect, useState } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import AdminSidebar from './AdminSidebar'
import AdminTopbar from './AdminTopbar'
import { clearAdminSession, getAdminSession } from '../../lib/auth'
import { authApi } from '../../lib/api/services'

export default function AdminLayout() {
  const [session, setSession] = useState(getAdminSession)
  const [checking, setChecking] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    const s = getAdminSession()
    if (!s?.token) { setChecking(false); setSession(null); return }
    authApi
      .me()
      .then((user) => {
        if (user.role !== 'ADMIN') {
          clearAdminSession()
          setSession(null)
          return
        }
        setSession({ ...s, id: user.id, name: user.name, email: user.email, role: 'ADMIN' })
      })
      .catch(() => {
        clearAdminSession()
        setSession(null)
      })
      .finally(() => setChecking(false))
  }, [])

  if (checking) return <div className="flex min-h-screen items-center justify-center text-sm text-slate-500">Memuat sesi...</div>
  if (!session) return <Navigate to="/admin/login" replace />

  return (
    <div className="min-h-screen bg-slate-50">
      <AdminSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="lg:pl-[264px]">
        <AdminTopbar
          onMenuClick={() => setSidebarOpen(true)}
          adminName={session.name}
          adminEmail={session.email}
          role={session.role}
        />
        <main className="mx-auto w-full max-w-[1440px] p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

