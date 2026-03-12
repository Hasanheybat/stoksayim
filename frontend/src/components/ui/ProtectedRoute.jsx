import { Navigate } from 'react-router-dom';
import useAuthStore    from '../../store/authStore';
import useAuthStoreAdm from '../../store/authStoreAdm';

const Spinner = () => (
  <div className="min-h-screen flex items-center justify-center" style={{ background: '#F0F0F5' }}>
    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-500" />
  </div>
);

export default function ProtectedRoute({ children, requireRole }) {
  const isAdminRoute = requireRole === 'admin';

  // Admin route → admin store (bağımsız oturum)
  // App route   → app store   (bağımsız oturum)
  const { kullanici: admKullanici, yukleniyor: admYukleniyor } = useAuthStoreAdm();
  const { kullanici: appKullanici, yukleniyor: appYukleniyor } = useAuthStore();

  if (isAdminRoute) {
    if (admYukleniyor) return <Spinner />;
    if (!admKullanici || admKullanici.aktif === false) return <Navigate to="/login" replace />;
    if (admKullanici.rol !== 'admin') return <Navigate to="/app" replace />;
    return children;
  }

  // App route
  if (appYukleniyor) return <Spinner />;
  if (!appKullanici || appKullanici.aktif === false) return <Navigate to="/app-login" replace />;
  return children;
}
