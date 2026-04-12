import { useState, useEffect, useRef, useCallback } from 'react';
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import { useLanguage } from '../i18n';

/* ── Navigation config ────────────────────────────────────── */

const NAV_SECTIONS = [
  {
    labelKey: 'nav.mainMenu',
    items: [
      { to: '/admin',              icon: 'dashboard',    labelKey: 'nav.dashboard',    end: true },
      { to: '/admin/kullanicilar', icon: 'group',        labelKey: 'nav.users' },
      { to: '/admin/isletmeler',   icon: 'domain',       labelKey: 'nav.businesses' },
      { to: '/admin/depolar',      icon: 'warehouse',    labelKey: 'nav.warehouses' },
    ],
  },
  {
    labelKey: 'nav.stockManagement',
    items: [
      { to: '/admin/urunler',            icon: 'deployed_code', labelKey: 'nav.products' },
      { to: '/admin/sayimlar',           icon: 'assignment',    labelKey: 'nav.counts' },
      { to: '/admin/toplanmis-sayimlar', icon: 'stacks',        labelKey: 'nav.mergedCounts' },
      { to: '#raporlar',                  icon: 'assessment',  labelKey: 'nav.reports' },
    ],
  },
  {
    labelKey: 'nav.system',
    items: [
      { to: '/admin/roller',  icon: 'shield',   labelKey: 'nav.roles' },
      { to: '/admin/ayarlar', icon: 'settings',  labelKey: 'nav.settings' },
    ],
  },
];

/* ── Helper: user initials ────────────────────────────────── */

function getInitials(name) {
  if (!name) return '??';
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

/* ── Sidebar component ────────────────────────────────────── */

function Sidebar({ open, onClose }) {
  const { t } = useLanguage();
  const kullanici = useAuthStore((s) => s.kullanici);
  const cikisYap = useAuthStore((s) => s.cikisYap);
  const location = useLocation();
  const sidebarRef = useRef(null);

  /* Close sidebar on route change (mobile) */
  useEffect(() => {
    onClose();
  }, [location.pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  /* Close on outside click (mobile) */
  useEffect(() => {
    function handleClick(e) {
      if (open && sidebarRef.current && !sidebarRef.current.contains(e.target)) {
        onClose();
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open, onClose]);

  return (
    <>
      {/* Mobile overlay */}
      <div
        className={`
          fixed inset-0 bg-on-surface/30 backdrop-blur-sm z-40
          transition-opacity duration-300
          md:hidden
          ${open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}
        `}
        aria-hidden="true"
      />

      {/* Sidebar panel */}
      <aside
        ref={sidebarRef}
        className={`
          fixed top-0 left-0 z-50 h-screen w-64
          flex flex-col
          bg-slate-50 sidebar-panel
          transition-transform duration-300 ease-out
          md:translate-x-0
          ${open ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* ── Logo area ─────────────────────────────────── */}
        <div className="flex items-center gap-3 px-5 py-6">
          <div
            className="flex flex-col items-center justify-center w-10 h-10 rounded-xl text-white select-none"
            style={{ background: 'linear-gradient(135deg, #4343d5, #5d5fef)' }}
          >
            <span style={{ fontFamily: 'Manrope', fontWeight: 800, fontSize: '18px', lineHeight: 1 }}>M</span>
            <span className="material-symbols-outlined" style={{ fontSize: '11px', opacity: 0.7, marginTop: '-2px' }}>layers</span>
          </div>
          <div className="flex flex-col">
            <span className="text-base font-bold font-headline text-[#191c1e] leading-tight">
              Minupos
            </span>
            <span className="text-[10px] text-on-surface-variant/60 leading-tight">
              Inventory v4.1.3
            </span>
          </div>
        </div>

        {/* ── Navigation ────────────────────────────────── */}
        <nav className="flex-1 overflow-y-auto px-3 space-y-6 mt-2">
          {NAV_SECTIONS.map((section) => (
            <div key={section.labelKey}>
              <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant/60">
                {t(section.labelKey)}
              </p>
              <ul className="space-y-0.5">
                {section.items.map((item) => {
                  /* Raporlar placeholder -- not a real route yet */
                  if (item.to.startsWith('#')) {
                    return (
                      <li key={item.to}>
                        <span className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-on-surface-variant/50 cursor-not-allowed select-none">
                          <span className="material-symbols-outlined text-[20px]">
                            {item.icon}
                          </span>
                          {t(item.labelKey)}
                        </span>
                      </li>
                    );
                  }

                  return (
                    <li key={item.to}>
                      <NavLink
                        to={item.to}
                        end={item.end}
                        className={({ isActive }) =>
                          `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150 relative
                          ${
                            isActive
                              ? 'bg-primary/10 text-primary'
                              : 'text-on-surface-variant hover:bg-slate-100 hover:text-[#191c1e]'
                          }`
                        }
                      >
                        {({ isActive }) => (
                          <>
                            {/* Active left accent */}
                            {isActive && (
                              <span
                                className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full"
                                style={{ background: 'linear-gradient(135deg, #4343d5, #5d5fef)' }}
                              />
                            )}
                            <span className="material-symbols-outlined text-[20px]">
                              {item.icon}
                            </span>
                            {t(item.labelKey)}
                          </>
                        )}
                      </NavLink>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        {/* ── Footer: user info ─────────────────────────── */}
        <div
          className="px-4 py-4 mt-auto"
          style={{
            boxShadow: '0 -1px 0 rgba(67, 67, 213, 0.06)',
          }}
        >
          <div className="flex items-center gap-3">
            {/* Avatar */}
            <div
              className="flex items-center justify-center w-9 h-9 rounded-lg text-xs font-bold text-white select-none shrink-0"
              style={{ background: 'linear-gradient(135deg, #4343d5, #5d5fef)' }}
            >
              {getInitials(kullanici?.ad)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[#191c1e] truncate">
                {kullanici?.ad || 'Kullanici'}
              </p>
              <p className="text-[11px] text-on-surface-variant truncate">
                {kullanici?.rol?.ad || 'Rol'}
              </p>
            </div>
            <button
              onClick={cikisYap}
              className="p-1.5 rounded-lg text-on-surface-variant/60 hover:text-red-500 hover:bg-red-50 transition-colors"
              title={t('nav.logout')}
            >
              <span className="material-symbols-outlined text-[20px]">logout</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}

/* ── Topbar component ─────────────────────────────────────── */

function Topbar({ onMenuToggle }) {
  const navigate = useNavigate();
  const { t, lang, setLang } = useLanguage();
  const kullanici = useAuthStore((s) => s.kullanici);
  const cikisYap = useAuthStore((s) => s.cikisYap);
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('theme') === 'dark');
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const userMenuRef = useRef(null);
  const langMenuRef = useRef(null);

  // Dark mode toggle
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) setUserMenuOpen(false);
      if (langMenuRef.current && !langMenuRef.current.contains(e.target)) setLangMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const LANGS = [
    { code: 'tr', flag: '🇹🇷', full: 'Türkçe' },
    { code: 'az', flag: '🇦🇿', full: 'Azərbaycanca' },
    { code: 'ru', flag: '🇷🇺', full: 'Русский' },
  ];

  return (
    <header
      className="sticky top-0 z-30 flex items-center justify-between px-4 md:px-6 py-1.5 md:ml-64 topbar-glass"
    >
      {/* Left: hamburger (mobile) */}
      <div className="flex items-center">
        <button
          onClick={onMenuToggle}
          className="md:hidden p-1.5 -ml-1 rounded-lg text-on-surface-variant hover:bg-slate-100 transition-colors"
          aria-label="Menu"
        >
          <span className="material-symbols-outlined text-[20px]">menu</span>
        </button>
      </div>

      {/* Right: dark mode + lang + user */}
      <div className="flex items-center gap-1">

        {/* Dark mode toggle */}
        <button
          onClick={() => setDarkMode(prev => !prev)}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-on-surface-variant hover:bg-slate-100 transition-colors"
          title={darkMode ? t('theme.light') : t('theme.dark')}
        >
          <span className="material-symbols-outlined text-[18px]">
            {darkMode ? 'light_mode' : 'dark_mode'}
          </span>
        </button>

        {/* Language selector */}
        <div ref={langMenuRef} className="relative">
          <button
            onClick={() => { setLangMenuOpen(prev => !prev); setUserMenuOpen(false); }}
            className="h-8 px-2 rounded-lg flex items-center gap-1 text-[12px] font-bold text-on-surface-variant hover:bg-slate-100 transition-colors"
          >
            <span className="text-[14px]">{LANGS.find(l => l.code === lang)?.flag || '🇦🇿'}</span>
            {lang?.toUpperCase() || 'AZ'}
          </button>
          {langMenuOpen && (
            <div className="absolute right-0 top-full mt-1 bg-surface-container-lowest rounded-xl shadow-elevated py-1 min-w-[140px] z-50 dropdown-menu">
              {LANGS.map(l => (
                <button
                  key={l.code}
                  onClick={() => { setLang(l.code); setLangMenuOpen(false); }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs transition-colors ${
                    lang === l.code ? 'text-primary font-bold bg-primary/5' : 'text-on-surface-variant hover:bg-surface-container-low'
                  }`}
                >
                  <span className="text-[14px]">{l.flag}</span>
                  {l.full}
                  {lang === l.code && <span className="material-symbols-outlined text-sm ml-auto text-primary">check</span>}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* User menu */}
        <div ref={userMenuRef} className="relative">
          <button
            onClick={() => { setUserMenuOpen(prev => !prev); setLangMenuOpen(false); }}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-[11px] font-bold select-none"
            style={{ background: 'linear-gradient(135deg, #4343d5, #5d5fef)' }}
            title={kullanici?.ad_soyad || 'Kullanici'}
          >
            {getInitials(kullanici?.ad_soyad)}
          </button>
          {userMenuOpen && (
            <div className="absolute right-0 top-full mt-1 bg-surface-container-lowest rounded-xl shadow-elevated py-1 min-w-[180px] z-50 dropdown-menu">
              {/* User info */}
              <div className="px-3 py-2 border-b border-surface-container-high">
                <p className="text-xs font-bold text-on-surface truncate">{kullanici?.ad_soyad || 'Kullanici'}</p>
                <p className="text-[10px] text-on-surface-variant truncate">{kullanici?.email}</p>
              </div>
              {/* Ayarlar */}
              <button
                onClick={() => { setUserMenuOpen(false); navigate('/admin/ayarlar'); }}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-on-surface-variant hover:bg-surface-container-low transition-colors"
              >
                <span className="material-symbols-outlined text-[16px]">settings</span>
                {t('nav.ayarlar')}
              </button>
              {/* Cikis */}
              <button
                onClick={() => { setUserMenuOpen(false); cikisYap(); navigate('/login'); }}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-error hover:bg-error/5 transition-colors"
              >
                <span className="material-symbols-outlined text-[16px]">logout</span>
                {t('nav.logout')}
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

/* ── AdminLayout ──────────────────────────────────────────── */

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  /* Lock body scroll when mobile sidebar is open */
  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [sidebarOpen]);

  return (
    <div className="min-h-screen bg-surface">
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <Topbar onMenuToggle={() => setSidebarOpen((prev) => !prev)} />

      {/* Main content */}
      <main className="md:ml-64 min-h-[calc(100vh-64px)]">
        <Outlet />
      </main>
    </div>
  );
}
