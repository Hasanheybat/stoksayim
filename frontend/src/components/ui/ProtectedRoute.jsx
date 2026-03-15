import { Navigate } from 'react-router-dom';
import useAuthStoreAdm from '../../store/authStoreAdm';

const Spinner = () => (
  <div className="min-h-screen flex items-center justify-center" style={{ background: '#F0F0F5' }}>
    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-500" />
  </div>
);

export default function ProtectedRoute({ children }) {
  const { kullanici, yukleniyor } = useAuthStoreAdm();

  if (yukleniyor) return <Spinner />;
  if (!kullanici || kullanici.aktif === false) return <Navigate to="/login" replace />;
  if (kullanici.rol !== 'admin') return <Navigate to="/login" replace />;
  return children;
}
