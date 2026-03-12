import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../lib/api';
import useAuthStore from '../../store/authStore';
import { Eye, EyeOff, Lock, ArrowRight, Warehouse } from 'lucide-react';

const P = '#6c53f5';
const GRAD = 'linear-gradient(135deg,#6c53f5 0%,#8b5cf6 100%)';

export default function AppLoginPage() {
  const navigate = useNavigate();
  const { oturumKontrol } = useAuthStore();
  const [form, setForm] = useState({ email: '', sifre: '' });
  const [yukleniyor, setYukleniyor] = useState(false);
  const [sifreGoster, setSifreGoster] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.sifre) { toast.error('Email ve şifre zorunludur.'); return; }
    setYukleniyor(true);
    try {
      const { data } = await api.post('/auth/login', { email: form.email, password: form.sifre });
      if (!data.kullanici.aktif) {
        toast.error('Hesabınız pasif durumdadır.');
        setYukleniyor(false);
        return;
      }
      localStorage.setItem('stoksay-token', data.token);
      await oturumKontrol();
      navigate(data.kullanici.rol === 'admin' ? '/admin' : '/app');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Email veya şifre hatalı.');
      setYukleniyor(false);
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: 'linear-gradient(160deg,#1e1b4b 0%,#4c1d95 100%)' }}
    >
      {/* Dekoratif arkaplan */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 rounded-full opacity-20"
          style={{ background: 'radial-gradient(circle,#818CF8,transparent)', transform: 'translate(40%,-40%)' }} />
        <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full opacity-15"
          style={{ background: 'radial-gradient(circle,#A78BFA,transparent)', transform: 'translate(-40%,40%)' }} />
      </div>

      {/* Üst kısım — logo */}
      <div className="relative z-10 flex flex-col items-center pt-16 pb-8 px-6">
        <div
          className="w-20 h-20 rounded-3xl flex items-center justify-center mb-5 shadow-2xl"
          style={{ background: GRAD, boxShadow: '0 8px 32px rgba(108,83,245,0.5)' }}
        >
          <Warehouse className="w-10 h-10 text-white" strokeWidth={1.5} />
        </div>
        <h1 className="text-3xl font-black text-white tracking-tight">StokSay</h1>
        <p className="text-white/50 text-sm mt-1 tracking-wide">Depo Sayım Sistemi</p>
      </div>

      {/* Login kartı */}
      <div className="relative z-10 flex-1 flex flex-col justify-start px-5">
        <div
          className="bg-white rounded-3xl p-7 shadow-2xl"
          style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}
        >
          <h2 className="text-xl font-black text-gray-900 mb-1">Hoş geldiniz</h2>
          <p className="text-sm text-gray-400 mb-7">Hesabınıza giriş yapın</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">
                E-posta
              </label>
              <input
                type="email"
                placeholder="kullanici@ornek.com"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                autoComplete="email"
                className="w-full px-4 py-3.5 rounded-2xl text-sm outline-none bg-gray-50 border border-gray-200 focus:border-indigo-400 transition-colors"
              />
            </div>

            {/* Şifre */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">
                Şifre
              </label>
              <div className="relative">
                <input
                  type={sifreGoster ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={form.sifre}
                  onChange={e => setForm({ ...form, sifre: e.target.value })}
                  autoComplete="current-password"
                  className="w-full pl-4 pr-12 py-3.5 rounded-2xl text-sm outline-none bg-gray-50 border border-gray-200 focus:border-indigo-400 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setSifreGoster(!sifreGoster)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {sifreGoster ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Giriş butonu */}
            <button
              type="submit"
              disabled={yukleniyor}
              className="w-full py-4 rounded-2xl font-bold text-white flex items-center justify-center gap-2 mt-2 transition-opacity active:scale-[0.98]"
              style={{ background: GRAD, opacity: yukleniyor ? 0.7 : 1 }}
            >
              {yukleniyor ? (
                <>
                  <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Giriş yapılıyor...
                </>
              ) : (
                <>
                  Giriş Yap
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Alt not */}
        <p className="text-center text-xs text-white/30 mt-6 pb-8">
          StokSay v2.0.0 — Tüm hakları saklıdır
        </p>
      </div>
    </div>
  );
}
