import { useState } from 'react';
import api from '../lib/api';
import useAuthStore from '../store/authStore';
import { useLanguage } from '../i18n';
import toast from 'react-hot-toast';

/* ── Language config ──────────────────────────────────────── */

const LANGUAGES = [
  { code: 'tr', label: 'Turkce', flag: 'TR' },
  { code: 'az', label: 'Azerbaycanca', flag: 'AZ' },
  { code: 'ru', label: 'Rusca', flag: 'RU' },
];

/* ── Password input with toggle ───────────────────────────── */

function PasswordInput({ value, onChange, placeholder, label }) {
  const [show, setShow] = useState(false);

  return (
    <div>
      {label && (
        <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">
          {label}
        </label>
      )}
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none">
          <span className="material-symbols-outlined text-xl">lock</span>
        </span>
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full h-9 pl-10 pr-11 rounded-xl
                     bg-surface-container-low text-on-surface text-sm
                     placeholder:text-on-surface-variant/50
                     ghost-border ghost-border-focus
                     outline-none transition-shadow"
        />
        <button
          type="button"
          onClick={() => setShow((p) => !p)}
          className="absolute right-2 top-1/2 -translate-y-1/2
                     w-8 h-8 rounded-lg flex items-center justify-center
                     text-on-surface-variant hover:bg-surface-container-high
                     transition-colors"
          aria-label={show ? 'Hide' : 'Show'}
        >
          <span className="material-symbols-outlined text-lg">
            {show ? 'visibility_off' : 'visibility'}
          </span>
        </button>
      </div>
    </div>
  );
}

/* ── Main Page ────────────────────────────────────────────── */

export default function AyarlarPage() {
  const { t, lang, setLang } = useLanguage();
  const { kullanici, setKullanici } = useAuthStore();

  /* ── Email state ────────────────────────────────────────── */
  const [email, setEmail] = useState(kullanici?.email || '');
  const [emailLoading, setEmailLoading] = useState(false);

  /* ── Password state ─────────────────────────────────────── */
  const [eskiSifre, setEskiSifre] = useState('');
  const [yeniSifre, setYeniSifre] = useState('');
  const [yeniSifreTekrar, setYeniSifreTekrar] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);

  /* ── Email update ───────────────────────────────────────── */
  const handleEmailUpdate = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    setEmailLoading(true);
    try {
      await api.put('/auth/update-email', { email: email.trim() });
      setKullanici({ ...kullanici, email: email.trim() });
      toast.success(t('toast.emailUpdated'));
    } catch {
      toast.error(t('toast.emailUpdateFailed'));
    } finally {
      setEmailLoading(false);
    }
  };

  /* ── Password update ────────────────────────────────────── */
  const handlePasswordUpdate = async (e) => {
    e.preventDefault();

    if (yeniSifre.length < 8) {
      toast.error(t('settings.passwordTooShort'));
      return;
    }
    if (yeniSifre !== yeniSifreTekrar) {
      toast.error(t('settings.passwordMismatch'));
      return;
    }

    setPasswordLoading(true);
    try {
      await api.put('/auth/update-password', { eskiSifre, yeniSifre });
      toast.success(t('toast.passwordUpdated'));
      setEskiSifre('');
      setYeniSifre('');
      setYeniSifreTekrar('');
    } catch {
      toast.error(t('toast.passwordUpdateFailed'));
    } finally {
      setPasswordLoading(false);
    }
  };

  /* ── Initials for avatar ────────────────────────────────── */
  const initials = (kullanici?.ad || kullanici?.name || 'U')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="space-y-6 max-w-2xl">
      {/* ── Header ──────────────────────────────────────────── */}
      <div>
        <h1 className="text-2xl font-bold font-headline text-on-surface">
          {t('settings.title')}
        </h1>
      </div>

      {/* ══════════════════════════════════════════════════════
          Section 1: Account Info
          ══════════════════════════════════════════════════════ */}
      <div className="bg-surface-container-lowest rounded-2xl shadow-card p-4">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className="w-11 h-11 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
            <span className="text-sm font-bold text-primary">{initials}</span>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-on-surface-variant text-lg">
                person
              </span>
              <h3 className="text-sm font-bold text-on-surface truncate">
                {kullanici?.ad || kullanici?.name || '-'}
              </h3>
            </div>
            <div className="flex items-center gap-4 mt-1 text-sm text-on-surface-variant">
              {kullanici?.rol_adi && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-semibold">
                  {kullanici.rol_adi}
                </span>
              )}
              <span className="flex items-center gap-1 truncate">
                <span className="material-symbols-outlined text-sm">mail</span>
                {kullanici?.email || '-'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════
          Section 2: Language Switcher
          ══════════════════════════════════════════════════════ */}
      <div className="bg-surface-container-lowest rounded-2xl shadow-card p-4">
        <div className="flex items-center gap-2 mb-3">
          <span className="material-symbols-outlined text-on-surface-variant">
            translate
          </span>
          <div>
            <h3 className="text-sm font-bold text-on-surface">
              {t('settings.language')}
            </h3>
            <p className="text-xs text-on-surface-variant">
              {t('settings.languageDesc')}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          {LANGUAGES.map((l) => {
            const active = lang === l.code;
            return (
              <button
                key={l.code}
                onClick={() => setLang(l.code)}
                className={`flex-1 h-9 rounded-xl text-sm font-semibold
                  transition-colors flex items-center justify-center gap-2
                  ${
                    active
                      ? 'bg-primary text-on-primary shadow-sm'
                      : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high'
                  }`}
              >
                <span className="text-xs font-bold opacity-70">{l.flag}</span>
                {l.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════
          Section 3: Email Update
          ══════════════════════════════════════════════════════ */}
      <form
        onSubmit={handleEmailUpdate}
        className="bg-surface-container-lowest rounded-2xl shadow-card p-4"
      >
        <div className="flex items-center gap-2 mb-3">
          <span className="material-symbols-outlined text-on-surface-variant">
            mail
          </span>
          <h3 className="text-sm font-bold text-on-surface">
            {t('settings.emailUpdate')}
          </h3>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">
              {t('settings.newEmail')}
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none">
                <span className="material-symbols-outlined text-xl">mail</span>
              </span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t('settings.newEmailPlaceholder')}
                className="w-full h-9 pl-10 pr-4 rounded-xl
                           bg-surface-container-low text-on-surface text-sm
                           placeholder:text-on-surface-variant/50
                           ghost-border ghost-border-focus
                           outline-none transition-shadow"
              />
            </div>
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              disabled={emailLoading || !email.trim()}
              className="h-9 px-6 rounded-xl text-sm font-semibold
                         bg-cta-gradient text-white
                         hover:opacity-90 transition-opacity
                         disabled:opacity-50 flex items-center gap-2"
            >
              {emailLoading && (
                <svg
                  className="animate-spin h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
              )}
              {t('action.save')}
            </button>
          </div>
        </div>
      </form>

      {/* ══════════════════════════════════════════════════════
          Section 4: Password Change
          ══════════════════════════════════════════════════════ */}
      <form
        onSubmit={handlePasswordUpdate}
        className="bg-surface-container-lowest rounded-2xl shadow-card p-4"
      >
        <div className="flex items-center gap-2 mb-3">
          <span className="material-symbols-outlined text-on-surface-variant">
            lock
          </span>
          <h3 className="text-sm font-bold text-on-surface">
            {t('settings.passwordUpdate')}
          </h3>
        </div>

        <div className="space-y-3">
          <PasswordInput
            label={t('settings.oldPassword')}
            value={eskiSifre}
            onChange={setEskiSifre}
            placeholder={t('settings.oldPasswordPlaceholder')}
          />

          <PasswordInput
            label={t('settings.newPassword')}
            value={yeniSifre}
            onChange={setYeniSifre}
            placeholder={t('settings.newPasswordPlaceholder')}
          />
          <p className="text-[11px] text-on-surface-variant -mt-1 ml-1">
            {t('settings.passwordTooShort')}
          </p>

          <PasswordInput
            label={t('settings.confirmPassword')}
            value={yeniSifreTekrar}
            onChange={setYeniSifreTekrar}
            placeholder={t('settings.confirmPasswordPlaceholder')}
          />

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              disabled={
                passwordLoading || !eskiSifre || !yeniSifre || !yeniSifreTekrar
              }
              className="h-9 px-6 rounded-xl text-sm font-semibold
                         bg-cta-gradient text-white
                         hover:opacity-90 transition-opacity
                         disabled:opacity-50 flex items-center gap-2"
            >
              {passwordLoading && (
                <svg
                  className="animate-spin h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
              )}
              {t('action.save')}
            </button>
          </div>
        </div>
      </form>

      {/* Tema Seçimi */}
      <div className="bg-surface-container-lowest rounded-2xl shadow-card p-4 space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #4343d5, #5d5fef)' }}>
            <span className="material-symbols-outlined text-white text-lg">palette</span>
          </div>
          <div>
            <p className="text-xs font-bold text-on-surface">{t('settings.theme') || 'Arayüz Teması'}</p>
            <p className="text-[10px] text-on-surface-variant">{t('settings.themeDesc') || 'Arayüz görünümünü değiştirin'}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => {
              document.cookie = 'stoksay_theme=; Path=/; Max-Age=0';
              window.location.reload();
            }}
            className="flex-1 h-9 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5"
            style={!document.cookie.includes('stoksay_theme=ether')
              ? { background: '#6366F1', color: 'white' }
              : { background: 'var(--color-surface-container-low)', color: 'var(--color-on-surface-variant)' }}
          >
            <span className="material-symbols-outlined text-sm">view_compact</span>
            Klasik
          </button>
          <button
            onClick={() => {
              document.cookie = 'stoksay_theme=ether; Path=/; Max-Age=31536000; SameSite=Lax';
              window.location.reload();
            }}
            className="flex-1 h-9 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5"
            style={document.cookie.includes('stoksay_theme=ether')
              ? { background: 'linear-gradient(135deg, #4343d5, #5d5fef)', color: 'white' }
              : { background: 'var(--color-surface-container-low)', color: 'var(--color-on-surface-variant)' }}
          >
            <span className="material-symbols-outlined text-sm">auto_awesome</span>
            Minupos Ether
          </button>
        </div>
      </div>
    </div>
  );
}
