import { Navigate, Route, Routes } from 'react-router-dom'
import AdminActivityLogPage from './pages/admin/AdminActivityLogPage'
import AdminLayout from './components/admin/AdminLayout'
import AdminCategoryPage from './pages/admin/AdminCategoryPage'
import AdminCategoryAddPage from './pages/admin/AdminCategoryAddPage'
import AdminCategoryEditPage from './pages/admin/AdminCategoryEditPage'
import AdminDashboardPage from './pages/admin/AdminDashboardPage'
import AdminFinancialReportPage from './pages/admin/AdminFinancialReportPage'
import AdminLoginPage from './pages/admin/AdminLoginPage'
import AdminMonitoringOrderPage from './pages/admin/AdminMonitoringOrderPage'
import AdminStoreAuditLogPage from './pages/admin/AdminStoreAuditLogPage'
import AdminStoreRelationPage from './pages/admin/AdminStoreRelationPage'
import AdminUmkmDetailPage from './pages/admin/AdminUmkmDetailPage'
import AdminUmkmListPage from './pages/admin/AdminUmkmListPage'
import AdminUserManagementPage from './pages/admin/AdminUserManagementPage'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/admin/login" replace />} />
      <Route path="/admin/login" element={<AdminLoginPage />} />
      <Route element={<AdminLayout />}>
        <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
        <Route path="/admin/umkm" element={<AdminUmkmListPage />} />
        <Route path="/admin/kelola-umkm" element={<AdminUmkmListPage />} />
        <Route path="/admin/umkm/detail/:id" element={<AdminUmkmDetailPage />} />
        <Route path="/admin/umkm/:id" element={<AdminUmkmDetailPage />} />
        <Route path="/admin/kategori" element={<AdminCategoryPage />} />
        <Route
          path="/admin/kategori/tambah-kategori"
          element={<AdminCategoryAddPage />}
        />
        <Route
          path="/admin/kategori/edit-kategori/:id"
          element={<AdminCategoryEditPage />}
        />
        <Route path="/admin/pesanan" element={<AdminMonitoringOrderPage />} />
        <Route path="/admin/laporan-keuangan" element={<AdminFinancialReportPage />} />
        <Route path="/admin/pengguna" element={<AdminUserManagementPage />} />
        <Route path="/admin/kelola-pengguna" element={<AdminUserManagementPage />} />
        <Route
          path="/admin/kelola-pengguna/toko-terkait/:slug"
          element={<AdminStoreRelationPage />}
        />
        <Route
          path="/admin/kelola-pengguna/toko-terkait/:slug/audit-log-hubungan"
          element={<AdminStoreAuditLogPage />}
        />
        <Route path="/admin/log" element={<AdminActivityLogPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/admin/login" replace />} />
    </Routes>
  )
}

