import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import { useLanguage } from '../i18n';

/* ── Feature cards config ────────────────────────────────── */

const FEATURES = [
  { icon: 'domain',      title: 'Coklu Isletme',     desc: 'Birden fazla isletmeyi tek panelden yonetin' },
  { icon: 'shield',      title: 'Kullanici Kontrolu', desc: 'Rol bazli yetkilendirme ve erisim kontrolu' },
  { icon: 'upload_file', title: 'Excel Import',       desc: 'Toplu urun yuklemesi ile hizli baslangic' },
  { icon: 'speed',       title: 'Gercek Zamanli',     desc: 'Canli sayim takibi ve anlik raporlama' },
];

/* ── Feature card component ──────────────────────────────── */

function FeatureCard({ icon, title, desc }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl bg-white/10 p-3 backdrop-blur-sm transition-smooth hover:bg-white/15">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/15">
        <span className="material-symbols-outlined text-white/90 text-xl">{icon}</span>
      </div>
      <div>
        <p className="text-sm font-semibold text-white">{title}</p>
        <p className="mt-0.5 text-xs text-white/70 leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}

/* ── Login Page ──────────────────────────────────────────── */

export default function LoginPage() {
  const navigate = useNavigate();
  const { kullanici, girisYap } = useAuthStore();
  const { t } = useLanguage();

  const [email, setEmail] = useState('');
  const [sifre, setSifre] = useState('');
  const [sifreGoster, setSifreGoster] = useState(false);
  const [hata, setHata] = useState('');
  const [yukleniyor, setYukleniyor] = useState(false);

  /* Already logged in -> redirect */
  useEffect(() => {
    if (kullanici) {
      navigate('/admin', { replace: true });
    }
  }, [kullanici, navigate]);

  /* Form submit */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setHata('');
    setYukleniyor(true);

    try {
      await girisYap(email, sifre);
      navigate('/admin');
    } catch (err) {
      const msg =
        err?.response?.data?.mesaj ||
        err?.response?.data?.message ||
        t('login.error');
      setHata(msg);
    } finally {
      setYukleniyor(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-surface">
      {/* ── Left brand panel (hidden on mobile) ────────────── */}
      <div className="hidden lg:flex lg:w-[440px] xl:w-[500px] flex-col justify-between bg-cta-gradient p-8 relative overflow-hidden">
        {/* Decorative circles */}
        <div className="pointer-events-none absolute -top-24 -left-24 h-80 w-80 rounded-full bg-white/5" />
        <div className="pointer-events-none absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-white/5" />

        {/* Top section */}
        <div className="relative z-10">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="flex flex-col h-12 w-12 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm">
              <span className="text-xl font-bold text-white font-headline leading-none">M</span>
              <span className="material-symbols-outlined text-[10px] text-white/70 leading-none -mt-0.5">layers</span>
            </div>
            <span className="text-2xl font-bold text-white font-headline tracking-tight">
              Minupos Inventory
            </span>
          </div>

          {/* Tagline */}
          <h1 className="mt-6 text-2xl font-bold leading-tight text-white font-headline">
            Depo sayimlarinizi<br />
            kolayca yonetin.
          </h1>
          <p className="mt-3 text-base text-white/70 leading-relaxed max-w-sm">
            Gercek zamanli stok takibi, coklu isletme destegi ve akilli raporlama ile is sureclerinizi hizlandirin.
          </p>
        </div>

        {/* Feature cards */}
        <div className="relative z-10 mt-6 grid grid-cols-1 gap-2">
          {FEATURES.map((f) => (
            <FeatureCard key={f.icon} {...f} />
          ))}
        </div>

        {/* Bottom */}
        <p className="relative z-10 mt-6 text-xs text-white/40">
          &copy; 2024 Minupos. Tum haklari saklidir.
        </p>
      </div>

      {/* ── Right login form ───────────────────────────────── */}
      <div className="flex flex-1 items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex flex-col items-center mb-8">
            <div className="flex flex-col h-14 w-14 items-center justify-center rounded-full bg-cta-gradient shadow-elevated">
              <span className="text-2xl font-bold text-white font-headline leading-none">M</span>
              <span className="material-symbols-outlined text-[11px] text-white/70 leading-none -mt-0.5">layers</span>
            </div>
            <h2 className="mt-4 text-2xl font-bold text-on-surface font-headline tracking-tight">
              Minupos Inventory
            </h2>
            <p className="mt-1 text-sm text-on-surface-variant">
              {t('login.subtitle')}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Error message */}
            {hata && (
              <div className="flex items-center gap-2 rounded-xl bg-error-container px-4 py-3 transition-smooth">
                <span className="material-symbols-outlined text-on-error-container text-lg">error</span>
                <p className="text-sm text-on-error-container">{hata}</p>
              </div>
            )}

            {/* Email */}
            <div className="relative">
              <span className="material-symbols-outlined pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant text-xl">
                mail
              </span>
              <input
                type="email"
                placeholder={t('login.emailPlaceholder')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="
                  w-full rounded-xl bg-surface-container-low py-3 pl-12 pr-4
                  text-sm text-on-surface placeholder:text-on-surface-variant/60
                  outline-none transition-smooth
                  focus:bg-surface-container-lowest focus:shadow-[inset_0_0_0_1.5px_rgba(67,67,213,0.2)]
                "
              />
            </div>

            {/* Password */}
            <div className="relative">
              <span className="material-symbols-outlined pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant text-xl">
                lock
              </span>
              <input
                type={sifreGoster ? 'text' : 'password'}
                placeholder={t('login.passwordPlaceholder')}
                value={sifre}
                onChange={(e) => setSifre(e.target.value)}
                required
                autoComplete="current-password"
                className="
                  w-full rounded-xl bg-surface-container-low py-3 pl-12 pr-12
                  text-sm text-on-surface placeholder:text-on-surface-variant/60
                  outline-none transition-smooth
                  focus:bg-surface-container-lowest focus:shadow-[inset_0_0_0_1.5px_rgba(67,67,213,0.2)]
                "
              />
              <button
                type="button"
                onClick={() => setSifreGoster(!sifreGoster)}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-on-surface-variant/60 transition-smooth hover:text-on-surface-variant"
                tabIndex={-1}
                aria-label={sifreGoster ? 'Sifreyi gizle' : 'Sifreyi goster'}
              >
                <span className="material-symbols-outlined text-xl">
                  {sifreGoster ? 'visibility_off' : 'visibility'}
                </span>
              </button>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={yukleniyor}
              className="
                relative flex w-full items-center justify-center rounded-xl
                bg-cta-gradient py-3 text-sm font-semibold text-white
                shadow-ambient transition-smooth
                hover:shadow-elevated hover:brightness-110
                active:scale-[0.98]
                disabled:opacity-70 disabled:cursor-not-allowed
              "
            >
              {yukleniyor ? (
                <>
                  <svg
                    className="mr-2 h-5 w-5 animate-spin text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  {t('login.loading')}
                </>
              ) : (
                t('login.submit')
              )}
            </button>
          </form>

          {/* Footer */}
          <p className="mt-10 text-center text-xs text-on-surface-variant/50">
            v4.1.3 Premium Edition
          </p>
        </div>
      </div>
    </div>
  );
}
