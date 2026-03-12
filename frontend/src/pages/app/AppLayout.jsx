import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Settings } from 'lucide-react';
import useAuthStore from '../../store/authStore';

const SAYFA_ADLARI = {
  '/app/sayimlar': 'Sayımlar',
  '/app/stoklar':  'Stoklar',
  '/app/depolar':  'Depolar',
  '/app/ayarlar':  'Ayarlar',
};

export default function AppLayout() {
  const { kullanici } = useAuthStore();
  const navigate  = useNavigate();
  const location  = useLocation();

  const harf    = kullanici?.ad_soyad?.charAt(0)?.toUpperCase() || '?';
  const rol     = kullanici?.rol === 'admin' ? 'Yönetici' : 'Depo Kullanıcısı';
  const anaSayfa = location.pathname === '/app' || location.pathname === '/app/';

  // Aktif sayfa adı — tam eşleşme veya prefix eşleşme
  const sayfaAdi = Object.entries(SAYFA_ADLARI).find(([path]) =>
    location.pathname.startsWith(path)
  )?.[1] || '';

  return (
    <div className="min-h-screen" style={{ background: '#f4f7fe' }}>

      {/* ── Üst Bar ── */}
      <header
        className="px-5 pt-11 pb-3 flex items-center justify-between"
        style={{
          background: 'linear-gradient(135deg,#6c53f5 0%,#8b5cf6 100%)',
          boxShadow: '0 4px 16px rgba(108,83,245,0.25)',
          position: 'relative',
          zIndex: 10,
        }}
      >
        {/* Sol — avatar + isim */}
        <button
          onClick={() => navigate('/app')}
          className="flex items-center gap-3 active:scale-95 transition-transform"
        >
          <div
            className="w-11 h-11 rounded-2xl flex items-center justify-center text-white text-base font-extrabold flex-shrink-0"
            style={{
              background: 'rgba(255,255,255,0.2)',
              border: '1.5px solid rgba(255,255,255,0.35)',
              backdropFilter: 'blur(8px)',
            }}
          >
            {harf}
          </div>
          <div className="text-left">
            <p className="text-white font-bold text-sm leading-tight">
              {kullanici?.ad_soyad || 'Kullanıcı'}
            </p>
            <p className="text-white/60 text-xs mt-0.5">
              {anaSayfa ? rol : sayfaAdi}
            </p>
          </div>
        </button>

        {/* Sağ — Ayarlar (sadece ana sayfada) */}
        {anaSayfa && (
          <button
            onClick={() => navigate('/app/ayarlar')}
            className="w-10 h-10 rounded-2xl flex items-center justify-center active:scale-90 transition-transform"
            style={{ background: 'rgba(255,255,255,0.15)', border: '1.5px solid rgba(255,255,255,0.25)' }}
          >
            <Settings className="w-5 h-5 text-white" strokeWidth={1.8} />
          </button>
        )}
      </header>

      {/* ── İçerik ── */}
      <main className="relative px-5 pb-8" style={{ zIndex: 20 }}>
        <Outlet />
      </main>

    </div>
  );
}
