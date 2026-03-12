import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { LogOut, Zap, Volume2, Shield } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import useAuthStore from '../../store/authStore';

/* ── Native Toggle ── */
function Toggle({ checked, onChange }) {
  return (
    <button
      type="button"
      onClick={onChange}
      className="relative flex-shrink-0 w-12 h-6 rounded-full transition-colors duration-200"
      style={{ background: checked ? '#6366F1' : '#D1D5DB' }}
    >
      <div
        className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200"
        style={{ transform: checked ? 'translateX(24px)' : 'translateX(0)' }}
      />
    </button>
  );
}

const AYARLAR = [
  {
    key:     'birim_otomatik',
    icon:    Zap,
    grad:    'linear-gradient(135deg,#6366F1,#8B5CF6)',
    baslik:  'Birim Otomatik Gelsin',
    aciklama:'Açık: Birim direkt kaydedilir, onay gerekmez',
  },
  {
    key:     'barkod_sesi',
    icon:    Volume2,
    grad:    'linear-gradient(135deg,#10B981,#059669)',
    baslik:  'Barkod Okuma Sesi',
    aciklama:'Barkod okunduğunda bip sesi çıkar',
  },
];

export default function AyarlarPage() {
  const navigate = useNavigate();
  const { kullanici, setKullanici, cikisYap } = useAuthStore();
  const [ayarlar, setAyarlar] = useState(kullanici?.ayarlar || {});
  const harf = kullanici?.ad_soyad?.charAt(0)?.toUpperCase() || '?';

  const handleToggle = async (key) => {
    const yeni = { ...ayarlar, [key]: !ayarlar[key] };
    setAyarlar(yeni);
    const { error } = await supabase
      .from('kullanicilar')
      .update({ ayarlar: yeni })
      .eq('id', kullanici?.id);
    if (error) {
      setAyarlar(ayarlar);
      toast.error('Ayar kaydedilemedi.');
    } else {
      setKullanici({ ...kullanici, ayarlar: yeni });
      toast.success('Ayar kaydedildi.');
    }
  };

  const handleCikis = async () => {
    await cikisYap();
    navigate('/app-login');
  };

  return (
    <div className="p-4 space-y-4">

      {/* ── Hesap Kartı ── */}
      <div className="bg-white rounded-2xl p-5 shadow-sm flex items-center gap-4">
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center text-white text-xl font-black flex-shrink-0"
          style={{ background: 'linear-gradient(135deg,#6366F1,#8B5CF6)' }}
        >
          {harf}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-black text-gray-800 text-base leading-tight">{kullanici?.ad_soyad}</p>
          <p className="text-sm text-gray-400 truncate mt-0.5">{kullanici?.email}</p>
          <div
            className="mt-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold"
            style={{ background: '#EEF2FF', color: '#6366F1' }}
          >
            <Shield className="w-3 h-3" />
            Depo Kullanıcısı
          </div>
        </div>
      </div>

      {/* ── Ayarlar ── */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="px-5 py-3.5" style={{ borderBottom: '1px solid #F3F4F6' }}>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Uygulama Ayarları</p>
        </div>
        {AYARLAR.map((a, i) => (
          <div
            key={a.key}
            className="flex items-center justify-between px-5 py-4"
            style={{ borderBottom: i < AYARLAR.length - 1 ? '1px solid #F9FAFB' : 'none' }}
          >
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: a.grad }}
              >
                <a.icon className="w-4 h-4 text-white" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-800">{a.baslik}</p>
                <p className="text-xs text-gray-400 mt-0.5 leading-tight">{a.aciklama}</p>
              </div>
            </div>
            <div className="ml-4">
              <Toggle checked={!!ayarlar[a.key]} onChange={() => handleToggle(a.key)} />
            </div>
          </div>
        ))}
      </div>

      {/* ── Uygulama Bilgisi ── */}
      <div className="bg-white rounded-2xl px-5 py-4 shadow-sm">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Uygulama</p>
        <div className="flex justify-between text-sm mb-2">
          <span className="text-gray-500">Versiyon</span>
          <span className="font-semibold text-gray-700">v2.0.0</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Sistem</span>
          <span className="font-semibold flex items-center gap-1" style={{ color: '#059669' }}>
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse inline-block" />
            Aktif
          </span>
        </div>
      </div>

      {/* ── Çıkış ── */}
      <button
        onClick={handleCikis}
        className="w-full py-3.5 rounded-2xl font-bold text-white flex items-center justify-center gap-2 shadow-sm active:scale-95 transition-transform"
        style={{ background: 'linear-gradient(135deg,#EF4444,#DC2626)' }}
      >
        <LogOut className="w-4 h-4" />
        Çıkış Yap
      </button>

      <p className="text-center text-xs text-gray-300 pb-2">StokSay Depo Sayım Sistemi</p>
    </div>
  );
}
