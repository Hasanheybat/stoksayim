import { useState } from 'react';
import { Settings, Shield, Mail, Lock, Eye, EyeOff, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import useAuthStoreAdm from '../../store/authStoreAdm';
import apiAdm from '../../lib/apiAdm';
import { useLanguage, SUPPORTED_LANGS } from '../../i18n';

export default function AdminAyarlarPage() {
  const { t, lang, setLang } = useLanguage();
  const { kullanici } = useAuthStoreAdm();
  const harf = kullanici?.ad_soyad?.charAt(0)?.toUpperCase() || 'A';

  const [email, setEmail]           = useState('');
  const [emailYukleniyor, setEmailY] = useState(false);

  const [sifreGuncelle, setSifreG]  = useState({ eski: '', yeni: '', tekrar: '' });
  const [sifreGoster, setSifreGoster] = useState({ eski: false, yeni: false, tekrar: false });
  const [sifreYukleniyor, setSifreY]  = useState(false);

  const handleEmailGuncelle = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    setEmailY(true);
    try {
      await apiAdm.put('/auth/update-email', { email: email.trim() });
      toast.success(t('toast.emailUpdated'));
      setEmail('');
    } catch (err) {
      toast.error(err.response?.data?.hata || t('toast.emailUpdateFailed'));
    } finally {
      setEmailY(false);
    }
  };

  const handleSifreGuncelle = async (e) => {
    e.preventDefault();
    if (!sifreGuncelle.eski || !sifreGuncelle.yeni || !sifreGuncelle.tekrar) return;
    if (sifreGuncelle.yeni !== sifreGuncelle.tekrar) {
      toast.error(t('settings.passwordMismatch'));
      return;
    }
    if (sifreGuncelle.yeni.length < 8) {
      toast.error(t('settings.passwordTooShort'));
      return;
    }
    setSifreY(true);
    try {
      await apiAdm.put('/auth/update-password', { eskiSifre: sifreGuncelle.eski, yeniSifre: sifreGuncelle.yeni });
      toast.success(t('toast.passwordUpdated'));
      setSifreG({ eski: '', yeni: '', tekrar: '' });
    } catch (err) {
      toast.error(err.response?.data?.hata || t('toast.passwordUpdateFailed'));
    } finally {
      setSifreY(false);
    }
  };

  const passwordFields = [
    { key: 'eski',   label: t('settings.oldPassword'),       placeholder: t('settings.oldPasswordPlaceholder') },
    { key: 'yeni',   label: t('settings.newPassword'),       placeholder: t('settings.newPasswordPlaceholder') },
    { key: 'tekrar', label: t('settings.confirmPassword'),     placeholder: t('settings.confirmPasswordPlaceholder') },
  ];

  return (
    <div className="p-4 sm:p-6 space-y-3 max-w-2xl">

      {/* ── Baslik ── */}
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg,#64748B,#475569)' }}>
          <Settings className="w-3.5 h-3.5 text-white" />
        </div>
        <h1 className="text-base font-black text-gray-900">{t('settings.title')}</h1>
      </div>

      {/* ── Hesap Karti ── */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-3 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-base font-black flex-shrink-0"
          style={{ background: 'linear-gradient(135deg,#6366F1,#8B5CF6)' }}>
          {harf}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-gray-800 text-sm leading-tight">{kullanici?.ad_soyad || 'Admin'}</p>
          <p className="text-xs text-gray-400 truncate">{kullanici?.email || '\u2014'}</p>
        </div>
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold flex-shrink-0"
          style={{ background: '#EEF2FF', color: '#6366F1' }}>
          <Shield className="w-2.5 h-2.5" /> Admin
        </span>
      </div>

      {/* ── Iki Form Yan Yana ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

        {/* E-posta */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center gap-1.5 px-3 py-2.5 border-b border-gray-100">
            <div className="w-5 h-5 rounded-md flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg,#0EA5E9,#2563EB)' }}>
              <Mail className="w-3 h-3 text-white" />
            </div>
            <p className="text-xs font-bold text-gray-700">{t('settings.emailUpdate')}</p>
          </div>
          <form onSubmit={handleEmailGuncelle} className="p-3 space-y-2">
            <div>
              <label className="text-[10px] font-semibold text-gray-400 mb-1 block">{t('settings.currentEmail')}</label>
              <div className="px-2.5 py-1.5 rounded-lg bg-gray-50 text-xs text-gray-400 border border-gray-100 truncate">
                {kullanici?.email || '\u2014'}
              </div>
            </div>
            <div>
              <label className="text-[10px] font-semibold text-gray-400 mb-1 block">{t('settings.newEmail')}</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder={t('settings.newEmailPlaceholder')}
                className="w-full px-2.5 py-1.5 rounded-lg border border-gray-200 text-xs focus:outline-none focus:border-indigo-400 transition-colors"
              />
            </div>
            <button type="submit" disabled={emailYukleniyor || !email.trim()}
              className="w-full py-1.5 rounded-lg text-xs font-bold text-white flex items-center justify-center gap-1.5 transition-opacity disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg,#0EA5E9,#2563EB)' }}>
              {emailYukleniyor
                ? <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                : <><Check className="w-3 h-3" /> {t('action.update')}</>
              }
            </button>
          </form>
        </div>

        {/* Sifre */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center gap-1.5 px-3 py-2.5 border-b border-gray-100">
            <div className="w-5 h-5 rounded-md flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg,#6366F1,#8B5CF6)' }}>
              <Lock className="w-3 h-3 text-white" />
            </div>
            <p className="text-xs font-bold text-gray-700">{t('settings.passwordUpdate')}</p>
          </div>
          <form onSubmit={handleSifreGuncelle} className="p-3 space-y-2">
            {passwordFields.map(({ key, label, placeholder }) => (
              <div key={key}>
                <label className="text-[10px] font-semibold text-gray-400 mb-1 block">{label}</label>
                <div className="relative">
                  <input
                    type={sifreGoster[key] ? 'text' : 'password'}
                    value={sifreGuncelle[key]}
                    onChange={e => setSifreG(p => ({ ...p, [key]: e.target.value }))}
                    placeholder={placeholder}
                    className="w-full px-2.5 py-1.5 pr-8 rounded-lg border border-gray-200 text-xs focus:outline-none focus:border-indigo-400 transition-colors"
                  />
                  <button type="button"
                    onClick={() => setSifreGoster(p => ({ ...p, [key]: !p[key] }))}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {sifreGoster[key] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            ))}
            {sifreGuncelle.yeni && sifreGuncelle.tekrar && sifreGuncelle.yeni !== sifreGuncelle.tekrar && (
              <p className="text-[10px] text-red-500 font-medium">{t('settings.passwordMismatch')}</p>
            )}
            <button type="submit"
              disabled={sifreYukleniyor || !sifreGuncelle.eski || !sifreGuncelle.yeni || !sifreGuncelle.tekrar}
              className="w-full py-1.5 rounded-lg text-xs font-bold text-white flex items-center justify-center gap-1.5 transition-opacity disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg,#6366F1,#8B5CF6)' }}>
              {sifreYukleniyor
                ? <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                : <><Check className="w-3 h-3" /> {t('action.update')}</>
              }
            </button>
          </form>
        </div>

      </div>

      {/* ── Dil Secici ── */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-3 max-w-xs">
        <p className="text-xs font-bold text-gray-700 mb-2">{t('settings.language')}</p>
        <p className="text-[10px] text-gray-400 mb-2">{t('settings.languageDesc')}</p>
        <div className="flex gap-1.5">
          {SUPPORTED_LANGS.map(l => (
            <button key={l} onClick={() => setLang(l)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
              style={lang === l ? { background: '#6366F1', color: 'white' } : { background: '#F3F4F6', color: '#6B7280' }}>
              {t(`lang.${l}`)}
            </button>
          ))}
        </div>
      </div>

      <p className="text-center text-xs text-gray-300 pb-1">{t('app.footer')}</p>
    </div>
  );
}
