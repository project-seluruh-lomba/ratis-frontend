import { Navigate, Route, Routes } from 'react-router-dom'
import AdminActivityLogPage from './pages/admin/AdminActivityLogPage'
import AdminLayout from './components/admin/AdminLayout'
import AdminCategoryPage from './pages/admin/AdminCategoryPage'
import AdminCategoryAddPage from './pages/admin/AdminCategoryAddPage'
import AdminCategoryEditPage from './pages/admin/AdminCategoryEditPage'
import AdminDashboardPage from './pages/admin/AdminDashboardPage'
import AdminLoginPage from './pages/admin/AdminLoginPage'
import AdminMonitoringOrderPage from './pages/admin/AdminMonitoringOrderPage'
import AdminStoreAuditLogPage from './pages/admin/AdminStoreAuditLogPage'
import AdminStoreRelationPage from './pages/admin/AdminStoreRelationPage'
import AdminUmkmDetailPage from './pages/admin/AdminUmkmDetailPage'
import AdminUmkmListPage from './pages/admin/AdminUmkmListPage'
import AdminUserManagementPage from './pages/admin/AdminUserManagementPage'
import OwnerDashboardPage from './pages/owner/OwnerDashboardPage'
import OwnerFinancePage from './pages/owner/OwnerFinancePage'
import OwnerLoginPage from './pages/owner/OwnerLoginPage'
import OwnerOrderDetailPage from './pages/owner/OwnerOrderDetailPage'
import OwnerOrderListPage from './pages/owner/OwnerOrderListPage'
import OwnerPosPage from './pages/owner/OwnerPosPage'
import OwnerPlaceholderPage from './pages/owner/OwnerPlaceholderPage'
import OwnerProductDetailPage from './pages/owner/OwnerProductDetailPage'
import OwnerProductFormPage from './pages/owner/OwnerProductFormPage'
import OwnerProductStockPage from './pages/owner/OwnerProductStockPage'
import OwnerReportPage from './pages/owner/OwnerReportPage'
import OwnerRegisterPage from './pages/owner/OwnerRegisterPage'
import OwnerStorefrontPreviewPage from './pages/owner/OwnerStorefrontPreviewPage'
import KelolaStafPage from './pages/owner/KelolaStafPage'
import OwnerStaffDetailPage from './pages/owner/OwnerStaffDetailPage'
import OwnerStaffEditPage from './pages/owner/OwnerStaffEditPage'
import OwnerStoreProfilePage from './pages/owner/OwnerStoreProfilePage'
import OwnerStoreEditPage from './pages/owner/OwnerStoreEditPage'
import OwnerLayout from './components/owner/OwnerLayout'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<OwnerLoginPage />} />
      <Route path="/owner/login" element={<Navigate to="/" replace />} />
      <Route path="/owner/daftar" element={<OwnerRegisterPage />} />
      <Route element={<OwnerLayout />}>
        <Route path="/owner" element={<Navigate to="/owner/dashboard" replace />} />
        <Route path="/owner/dashboard" element={<OwnerDashboardPage />} />
        <Route path="/owner/pesanan" element={<OwnerOrderListPage />} />
        <Route path="/owner/pesanan/baru" element={<OwnerPosPage />} />
        <Route path="/owner/pesanan/:id" element={<OwnerOrderDetailPage />} />
        <Route path="/owner/keuangan" element={<OwnerFinancePage />} />
        <Route path="/owner/laporan-keuangan" element={<OwnerReportPage />} />
        <Route path="/owner/laporan" element={<OwnerReportPage />} />
        <Route path="/owner/produk" element={<OwnerProductStockPage />} />
        <Route path="/owner/produk/baru" element={<OwnerProductFormPage />} />
        <Route path="/owner/produk/:id" element={<OwnerProductDetailPage />} />
        <Route path="/owner/produk-stok" element={<OwnerProductStockPage />} />
        <Route path="/owner/pratinjau" element={<OwnerStorefrontPreviewPage />} />
        <Route path="/owner/toko" element={<OwnerStoreProfilePage />} />
        <Route path="/owner/toko/ubah" element={<OwnerStoreEditPage />} />
        <Route path="/owner/kelola-staf" element={<KelolaStafPage />} />
        <Route
          path="/owner/kelola-staf/detail-staf/:id"
          element={<OwnerStaffDetailPage />}
        />
        <Route
          path="/owner/kelola-staf/detail-staf/:id/ubah"
          element={<OwnerStaffEditPage />}
        />
        <Route path="/owner/*" element={<OwnerPlaceholderPage />} />
      </Route>
      <Route path="/admin-login" element={<AdminLoginPage />} />
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
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

