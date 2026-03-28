import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import apiAdm from '../../lib/apiAdm';
import useAuthStoreAdm from '../../store/authStoreAdm';
import { useLanguage } from '../../i18n';
import { Eye, EyeOff, Mail, Lock, Zap, Warehouse, Users, ArrowRight, Sparkles, ShieldCheck } from 'lucide-react';

const GRAD_INDIGO = 'linear-gradient(135deg,#6366F1,#8B5CF6)';
const GRAD_GREEN  = 'linear-gradient(135deg,#10B981,#059669)';
const GRAD_AMBER  = 'linear-gradient(135deg,#F59E0B,#D97706)';
const GRAD_PINK   = 'linear-gradient(135deg,#EC4899,#DB2777)';

export default function LoginPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { setKullanici } = useAuthStoreAdm();
  const [form, setForm] = useState({ email: '', sifre: '' });
  const [yukleniyor, setYukleniyor] = useState(false);
  const [sifreGoster, setSifreGoster] = useState(false);

  const features = [
    { icon: Zap,         grad: GRAD_INDIGO, label: t('login.feature.multiCompany') },
    { icon: ShieldCheck, grad: GRAD_GREEN,  label: t('login.feature.userControl') },
    { icon: Warehouse,   grad: GRAD_AMBER,  label: t('login.feature.excelImport') },
    { icon: Users,       grad: GRAD_PINK,   label: t('login.feature.realTime') },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.sifre) { toast.error(t('login.required')); return; }
    setYukleniyor(true);
    try {
      const { data } = await apiAdm.post('/auth/login', { email: form.email, password: form.sifre });
      if (data.kullanici.rol !== 'admin') {
        toast.error(t('login.adminOnly'));
        setYukleniyor(false);
        return;
      }
      localStorage.setItem('stoksay-adm-token', data.token);
      setKullanici(data.kullanici);
      navigate('/admin');
    } catch (err) {
      toast.error(err.response?.data?.error || t('login.error'));
      setYukleniyor(false);
    }
  };

  return (
    <div className="min-h-screen flex" style={{ background: '#F0F0F5' }}>

      {/* ── Sol Panel ── */}
      <div className="hidden lg:flex lg:w-[52%] relative overflow-hidden flex-col justify-between p-10"
        style={{ background: 'linear-gradient(145deg,#1e1b4b 0%,#312e81 45%,#4c1d95 100%)' }}>

        {/* Dekoratif daireler */}
        <div className="absolute top-0 right-0 w-[400px] h-[400px] rounded-full opacity-20 pointer-events-none"
          style={{ background: 'radial-gradient(circle,#818CF8,transparent)', transform: 'translate(35%,-35%)' }} />
        <div className="absolute bottom-0 left-0 w-[340px] h-[340px] rounded-full opacity-15 pointer-events-none"
          style={{ background: 'radial-gradient(circle,#A78BFA,transparent)', transform: 'translate(-35%,35%)' }} />
        <div className="absolute top-1/2 left-1/2 w-[200px] h-[200px] rounded-full opacity-10 pointer-events-none"
          style={{ background: 'radial-gradient(circle,#C4B5FD,transparent)', transform: 'translate(-50%,-50%)' }} />

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <img src="/logo.png" alt="StokSay" className="w-12 h-12 rounded-xl shadow-lg" />
          <div>
            <h1 className="text-white text-xl font-black tracking-wide">StokSay</h1>
            <p className="text-xs tracking-widest font-medium" style={{ color: 'rgba(196,181,253,0.8)' }}>{t('app.subtitle')}</p>
          </div>
        </div>

        {/* Ana Icerik */}
        <div className="relative z-10 space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm"
            style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: 'rgba(196,181,253,0.9)' }}>
            <Sparkles className="w-4 h-4" />
            <span>{t('app.edition')}</span>
          </div>

          <div>
            <h2 className="text-5xl font-black text-white leading-tight">{t('layout.management')}</h2>
            <h2 className="text-5xl font-black leading-tight" style={{ color: '#A78BFA' }}>{t('layout.panel')}</h2>
            <p className="mt-4 text-base leading-relaxed whitespace-pre-line" style={{ color: 'rgba(255,255,255,0.55)' }}>
              {t('layout.manageFromOneScreen')}
            </p>
          </div>

          {/* Ozellik Kartlari */}
          <div className="grid grid-cols-2 gap-3">
            {features.map((f) => (
              <div key={f.label} className="flex items-center gap-3 px-4 py-3 rounded-xl"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm"
                  style={{ background: f.grad }}>
                  <f.icon className="w-4 h-4 text-white" />
                </div>
                <span className="text-xs font-medium leading-tight" style={{ color: 'rgba(255,255,255,0.8)' }}>{f.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Alt Bilgi */}
        <div className="relative z-10 flex items-center justify-between">
          <span className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>{t('app.version')}</span>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>{t('app.allSystemsRunning')}</span>
          </div>
        </div>
      </div>

      {/* ── Sag Panel ── */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">

          {/* Mobil Logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="inline-flex items-center gap-2.5 mb-2">
              <img src="/logo.png" alt="StokSay" className="w-10 h-10 rounded-xl" />
              <h1 className="text-2xl font-black text-gray-900">StokSay</h1>
            </div>
            <p className="text-sm text-gray-400">{t('app.subtitle')}</p>
          </div>

          {/* Login Karti */}
          <div className="bg-white rounded-2xl shadow-xl p-8">

            {/* Badge */}
            <div className="flex justify-center mb-6">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold"
                style={{ background: '#EEF2FF', color: '#6366F1', border: '1px solid #C7D2FE' }}>
                <ShieldCheck className="w-4 h-4" />
                {t('login.badge')}
              </div>
            </div>

            <div className="text-center mb-8">
              <h2 className="text-2xl font-black text-gray-900">{t('login.title')}</h2>
              <p className="mt-1.5 text-sm text-gray-400">{t('login.subtitle')}</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">{t('login.email')}</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="email"
                    placeholder={t('login.emailPlaceholder')}
                    value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })}
                    autoComplete="email"
                    className="w-full pl-11 pr-4 py-3 rounded-xl text-sm outline-none bg-gray-50 border border-gray-200 focus:border-indigo-400 transition-colors"
                  />
                </div>
              </div>

              {/* Sifre */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">{t('login.password')}</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type={sifreGoster ? 'text' : 'password'}
                    placeholder={t('login.passwordPlaceholder')}
                    value={form.sifre}
                    onChange={e => setForm({ ...form, sifre: e.target.value })}
                    autoComplete="current-password"
                    className="w-full pl-11 pr-12 py-3 rounded-xl text-sm outline-none bg-gray-50 border border-gray-200 focus:border-indigo-400 transition-colors"
                  />
                  <button type="button" onClick={() => setSifreGoster(!sifreGoster)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                    {sifreGoster ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Giris Butonu */}
              <button
                type="submit"
                disabled={yukleniyor}
                className="w-full py-3.5 rounded-xl font-bold text-white flex items-center justify-center gap-2 transition-opacity mt-2"
                style={{ background: GRAD_INDIGO, opacity: yukleniyor ? 0.7 : 1 }}
              >
                {yukleniyor ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    {t('login.loading')}
                  </>
                ) : (
                  <>
                    {t('login.submit')}
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              {/* Guvenlik */}
              <div className="flex items-center justify-center gap-2 pt-1">
                <span className="w-2 h-2 rounded-full bg-green-500" />
                <span className="text-xs text-gray-400">{t('login.sslSecure')}</span>
              </div>
            </form>
          </div>

          {/* Alt Not */}
          <p className="text-center text-xs text-gray-400 mt-5">
            {t('app.footer')}
          </p>
        </div>
      </div>
    </div>
  );
}
