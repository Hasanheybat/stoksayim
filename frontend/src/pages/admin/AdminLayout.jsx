import { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation, NavLink } from 'react-router-dom';
import { LogOut, Bell, Settings, User, ChevronLeft, Building2, Warehouse, Users, Package, ShieldCheck, ClipboardList, Calculator } from 'lucide-react';
import useAuthStoreAdm from '../../store/authStoreAdm';
import { useLanguage } from '../../i18n';

const GRAD = {
  indigo: 'linear-gradient(135deg,#6366F1,#8B5CF6)',
  blue:   'linear-gradient(135deg,#0EA5E9,#2563EB)',
  green:  'linear-gradient(135deg,#10B981,#059669)',
  amber:  'linear-gradient(135deg,#F59E0B,#D97706)',
  pink:   'linear-gradient(135deg,#EC4899,#DB2777)',
  teal:   'linear-gradient(135deg,#14B8A6,#0D9488)',
  gray:   'linear-gradient(135deg,#64748B,#475569)',
  purple: 'linear-gradient(135deg,#6366F1,#4F46E5)',
};

function useClock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => { const timer = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(timer); }, []);
  const saat  = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
  return { saat, now };
}

export default function AdminLayout() {
  const { t } = useLanguage();
  const navigate  = useNavigate();
  const location  = useLocation();
  const { kullanici, cikisYap } = useAuthStoreAdm();
  const { saat, now } = useClock();
  const tarih = `${now.getDate()} ${t('month.' + now.getMonth())} ${now.getFullYear()}`;
  const anaSayfa = location.pathname === '/admin' || location.pathname === '/admin/';

  const handleCikis = async () => { await cikisYap(); navigate('/login'); };

  const initials = kullanici?.ad_soyad?.trim()
    ? kullanici.ad_soyad.trim().split(' ').filter(Boolean).map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : 'AD';

  const NAV_LINKS = [
    { icon: Building2,    grad: GRAD.indigo, label: t('nav.businesses'),    to: '/admin/isletmeler'  },
    { icon: Warehouse,    grad: GRAD.blue,   label: t('nav.warehouses'),    to: '/admin/depolar'     },
    { icon: Users,        grad: GRAD.green,  label: t('nav.users'),         to: '/admin/kullanicilar'},
    { icon: Package,      grad: GRAD.amber,  label: t('nav.products'),      to: '/admin/urunler'     },
    { icon: ShieldCheck,  grad: GRAD.pink,   label: t('nav.roles'),         to: '/admin/roller'      },
    { icon: ClipboardList,grad: GRAD.teal,   label: t('nav.counts'),        to: '/admin/sayimlar'    },
    { icon: Calculator,   grad: GRAD.purple, label: t('nav.mergedCounts'),  to: '/admin/toplanmis-sayimlar' },
    { icon: Settings,     grad: GRAD.gray,   label: t('nav.settings'),      to: '/admin/ayarlar'     },
  ];

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#F0F0F5' }}>

      {/* ── TOP BAR ── */}
      <header className="bg-white border-b border-gray-200 h-14 flex items-center px-5 gap-4 flex-shrink-0 z-30 sticky top-0">
        {/* Geri butonu (ana sayfada degilken) */}
        {!anaSayfa && (
          <button
            onClick={() => navigate(-1)}
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-100 transition-colors mr-1"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
        )}

        {/* Logo */}
        <button
          onClick={() => navigate('/admin')}
          className="flex items-center gap-2.5 mr-4 hover:opacity-80 transition-opacity"
        >
          <img src="/logo.png" alt="StokSay" className="w-8 h-8 rounded-lg" />
          <span className="font-black text-gray-900 text-lg">StokSay</span>
        </button>

        {/* Status */}
        <div className="hidden sm:flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-xs font-medium text-gray-500">{t('app.systemActive')}</span>
        </div>

        <div className="flex-1" />

        {/* Kullanici */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl border border-gray-200">
          <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold"
            style={{ background: '#6366F1' }}>
            {initials}
          </div>
          <span className="text-sm font-medium text-gray-700">{kullanici?.ad_soyad?.split(' ')[0] || 'Admin'}</span>
        </div>

        {/* Cikis */}
        <button onClick={handleCikis}
          className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold text-white transition-colors"
          style={{ background: '#EF4444' }}
          onMouseEnter={e => e.currentTarget.style.background = '#DC2626'}
          onMouseLeave={e => e.currentTarget.style.background = '#EF4444'}>
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline">{t('nav.logout')}</span>
        </button>
      </header>

      {/* ── Kompakt Nav Bar (ana sayfa disinda) ── */}
      {!anaSayfa && (
        <div className="bg-white border-b border-gray-200 sticky top-14 z-20 flex-shrink-0">
          <div className="flex items-center justify-center gap-0.5 px-3 overflow-x-auto scrollbar-hide">
            {NAV_LINKS.map((n) => {
              const active = location.pathname.startsWith(n.to);
              return (
                <button
                  key={n.to}
                  onClick={() => navigate(n.to)}
                  className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold whitespace-nowrap border-b-2 transition-all flex-shrink-0 ${
                    active
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-400 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <div
                    className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0"
                    style={{ background: active ? n.grad : '#F3F4F6' }}
                  >
                    <n.icon className={`w-3 h-3 ${active ? 'text-white' : 'text-gray-400'}`} />
                  </div>
                  {n.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── BODY ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── Sol Panel ── */}
        <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-gray-200 flex-shrink-0 overflow-y-auto">

          {/* Saat */}
          <div className="px-6 pt-6 pb-4 border-b border-gray-100">
            <div className="text-5xl font-black tabular-nums" style={{ color: '#6366F1' }}>{saat}</div>
            <div className="text-sm font-medium text-gray-500 mt-1">{tarih}</div>
            <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold"
              style={{ background: '#FEF9C3', color: '#A16207' }}>
              {t('app.systemActive')}
            </div>
          </div>

          {/* Hesap Bilgileri */}
          <div className="px-4 py-4 border-b border-gray-100">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5" />
              {t('sidebar.accountInfo')}
            </p>
            <div className="space-y-2">
              {[
                { label: t('sidebar.fullName'), value: kullanici?.ad_soyad || 'Admin' },
                { label: t('sidebar.role'),     value: kullanici?.rol === 'admin' ? t('sidebar.roleAdmin') : t('sidebar.roleUser') },
                { label: t('sidebar.email'), value: kullanici?.email?.split('@')[0] || '\u2014' },
              ].map(row => (
                <div key={row.label} className="flex justify-between items-center">
                  <span className="text-xs text-gray-400">{row.label}</span>
                  <span className="text-xs font-semibold text-gray-700">{row.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Ayarlar */}
          <div className="px-3 py-3 border-b border-gray-100">
            <NavLink to="/admin/ayarlar"
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive ? 'text-white' : 'text-gray-500 hover:bg-gray-50'
                }`
              }
              style={({ isActive }) => isActive ? { background: '#6366F1' } : {}}>
              <Settings className="w-4 h-4" />
              {t('nav.settings')}
            </NavLink>
          </div>
        </aside>

        {/* Ana Icerik */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>

      </div>
    </div>
  );
}
