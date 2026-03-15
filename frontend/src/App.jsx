import { Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import useAuthStoreAdm from './store/authStoreAdm';
import ProtectedRoute from './components/ui/ProtectedRoute';

// Auth
import LoginPage from './pages/auth/LoginPage';

// Admin sayfaları
import AdminLayout from './pages/admin/AdminLayout';
import AdminDashboard from './pages/admin/Dashboard';
import IsletmelerPage from './pages/admin/IsletmelerPage';
import AdminDepolarPage from './pages/admin/DepolarPage';
import KullanicilarPage from './pages/admin/KullanicilarPage';
import UrunlerPage from './pages/admin/UrunlerPage';
import RollerPage from './pages/admin/RollerPage';
import SayimlarAdminPage from './pages/admin/SayimlarPage';
import RaporlarPage from './pages/admin/RaporlarPage';
import ToplanmisSayimlarAdminPage from './pages/admin/ToplanmisSayimlarPage';
import AdminAyarlarPage from './pages/admin/AyarlarPage';

export default function App() {
  const { oturumKontrol } = useAuthStoreAdm();

  useEffect(() => {
    oturumKontrol();
  }, []);

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route path="/admin" element={
        <ProtectedRoute requireRole="admin">
          <AdminLayout />
        </ProtectedRoute>
      }>
        <Route index element={<AdminDashboard />} />
        <Route path="isletmeler" element={<IsletmelerPage />} />
        <Route path="depolar" element={<AdminDepolarPage />} />
        <Route path="kullanicilar" element={<KullanicilarPage />} />
        <Route path="urunler" element={<UrunlerPage />} />
        <Route path="roller" element={<RollerPage />} />
        <Route path="sayimlar" element={<SayimlarAdminPage />} />
        <Route path="raporlar" element={<RaporlarPage />} />
        <Route path="toplanmis-sayimlar" element={<ToplanmisSayimlarAdminPage />} />
        <Route path="ayarlar" element={<AdminAyarlarPage />} />
      </Route>

      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
