import { useState } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import AdminSidebar from './AdminSidebar'
import AdminTopbar from './AdminTopbar'
import { getAdminSession } from '../../lib/auth'

export default function AdminLayout() {
  const [session] = useState(getAdminSession)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  if (!session) {
    return <Navigate to="/admin/login" replace />
  }

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
