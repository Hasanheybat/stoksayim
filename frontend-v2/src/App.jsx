import { Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import useAuthStore from './store/authStore';
import AdminLayout from './layouts/AdminLayout';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import IsletmelerPage from './pages/IsletmelerPage';
import DepolarPage from './pages/DepolarPage';
import KullanicilarPage from './pages/KullanicilarPage';
import UrunlerPage from './pages/UrunlerPage';
import RollerPage from './pages/RollerPage';
import SayimlarPage from './pages/SayimlarPage';
import ToplanmisSayimlarPage from './pages/ToplanmisSayimlarPage';
import AyarlarPage from './pages/AyarlarPage';

/* ── Protected route wrapper ──────────────────────────────── */

function ProtectedRoute({ children }) {
  const kullanici = useAuthStore((s) => s.kullanici);
  const yukleniyor = useAuthStore((s) => s.yukleniyor);

  if (yukleniyor) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-primary" />
      </div>
    );
  }

  if (!kullanici) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

/* ── App ──────────────────────────────────────────────────── */

export default function App() {
  const oturumKontrol = useAuthStore((s) => s.oturumKontrol);

  useEffect(() => {
    oturumKontrol();
  }, [oturumKontrol]);

  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={<LoginPage />} />

      {/* Protected admin area */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="isletmeler" element={<IsletmelerPage />} />
        <Route path="depolar" element={<DepolarPage />} />
        <Route path="kullanicilar" element={<KullanicilarPage />} />
        <Route path="urunler" element={<UrunlerPage />} />
        <Route path="roller" element={<RollerPage />} />
        <Route path="sayimlar" element={<SayimlarPage />} />
        <Route path="toplanmis-sayimlar" element={<ToplanmisSayimlarPage />} />
        <Route path="ayarlar" element={<AyarlarPage />} />
      </Route>

      {/* Redirect root to admin */}
      <Route path="/" element={<Navigate to="/admin" replace />} />
      <Route path="*" element={<Navigate to="/admin" replace />} />
    </Routes>
  );
}
