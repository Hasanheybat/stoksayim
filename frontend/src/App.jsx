import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import useAuthStore from './store/authStore';
import useAuthStoreAdm from './store/authStoreAdm';
import ProtectedRoute from './components/ui/ProtectedRoute';

// Auth sayfaları
import LoginPage from './pages/auth/LoginPage';
import AppLoginPage from './pages/auth/AppLoginPage';
import SifremiUnuttumPage from './pages/auth/SifremiUnuttumPage';

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
import AdminAyarlarPage from './pages/admin/AyarlarPage';

// Uygulama sayfaları
import AppLayout from './pages/app/AppLayout';
import AnaPage from './pages/app/AnaPage';
import StoklarPage from './pages/app/StoklarPage';
import SayimlarPage from './pages/app/SayimlarPage';
import AyarlarPage from './pages/app/AyarlarPage';
import DepoEklePage   from './pages/app/DepoEklePage';
import DepolarPage    from './pages/app/DepolarPage';
import SayimDetayPage from './pages/app/SayimDetayPage';
import YeniSayimPage  from './pages/app/YeniSayimPage';
import UrunEklePage   from './pages/app/UrunEklePage';

export default function App() {
  const { oturumKontrol }    = useAuthStore();
  const { oturumKontrol: oturumKontrolAdm } = useAuthStoreAdm();
  const location             = useLocation();
  const background           = location.state?.background;

  useEffect(() => {
    oturumKontrol();    // App oturumu
    oturumKontrolAdm(); // Admin oturumu (bağımsız)
  }, []);

  return (
    <>
    <Routes location={background || location}>
      {/* Public */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/app-login" element={<AppLoginPage />} />
      <Route path="/sifremi-unuttum" element={<SifremiUnuttumPage />} />

      {/* Admin — sadece admin rolü */}
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
        <Route path="ayarlar"  element={<AdminAyarlarPage />} />
      </Route>

      {/* Kullanıcı Uygulaması */}
      <Route path="/app" element={
        <ProtectedRoute>
          <AppLayout />
        </ProtectedRoute>
      }>
        <Route index element={<AnaPage />} />
        <Route path="stoklar" element={<StoklarPage />} />
        <Route path="sayimlar" element={<SayimlarPage />} />
        <Route path="ayarlar" element={<AyarlarPage />} />
        <Route path="depolar"          element={<DepolarPage />} />
        <Route path="depo-ekle"        element={<DepoEklePage />} />
        <Route path="sayim/:sayimId"             element={<SayimDetayPage />} />
        <Route path="sayim/:sayimId/urun-ekle" element={<UrunEklePage />} />
        <Route path="yeni-sayim"               element={<YeniSayimPage />} />
      </Route>

      {/* Varsayılan yönlendirme */}
      <Route path="/" element={<Navigate to="/app-login" replace />} />
      <Route path="*" element={<Navigate to="/app-login" replace />} />
    </Routes>

    {/* ── Modal rotası: SayimlarPage arka planda kalır ── */}
    {background && (
      <Routes>
        <Route path="/app/yeni-sayim" element={<YeniSayimPage />} />
      </Routes>
    )}
    </>
  );
}
