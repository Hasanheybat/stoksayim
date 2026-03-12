import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Building2, ChevronDown, Save, RotateCcw } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import useAuthStore from '../../store/authStore';
import toast from 'react-hot-toast';

const P  = '#6c53f5';
const PL = 'rgba(108,83,245,0.10)';
const API = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const GRADS = [
  'linear-gradient(135deg,#6c53f5,#8B5CF6)',
  'linear-gradient(135deg,#0EA5E9,#2563EB)',
  'linear-gradient(135deg,#10B981,#059669)',
  'linear-gradient(135deg,#F59E0B,#D97706)',
  'linear-gradient(135deg,#EC4899,#DB2777)',
];

export default function DepoEklePage() {
  const navigate      = useNavigate();
  const { kullanici } = useAuthStore();

  const [isletmeler,      setIsletmeler]      = useState([]);
  const [seciliIsletmeId, setSeciliIsletmeId] = useState(null);
  const [depoAdi,         setDepoAdi]         = useState('');
  const [isletmePicker,   setIsletmePicker]   = useState(false);
  const [kaydediyor,      setKaydediyor]      = useState(false);

  useEffect(() => { if (kullanici?.id) fetchIsletmeler(); }, [kullanici?.id]);

  const fetchIsletmeler = async () => {
    const { data } = await supabase
      .from('kullanici_isletme')
      .select('isletmeler(id, ad, kod)')
      .eq('kullanici_id', kullanici.id)
      .eq('aktif', true);
    const list = (data || []).map(k => k.isletmeler).filter(Boolean);
    setIsletmeler(list);
    if (list.length > 0) setSeciliIsletmeId(list[0].id);
  };

  const sifirla = () => {
    setDepoAdi('');
    toast('Form sıfırlandı', { icon: '↩️', duration: 1500 });
  };

  const kaydet = async () => {
    if (!seciliIsletmeId)   { toast.error('Lütfen işletme seçin.'); return; }
    if (!depoAdi.trim())    { toast.error('Depo adı girin.');       return; }

    setKaydediyor(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) { toast.error('Oturum bulunamadı.'); return; }

      const res = await fetch(`${API}/api/depolar`, {
        method: 'POST',
        headers: {
          'Content-Type':  'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ isletme_id: seciliIsletmeId, ad: depoAdi.trim() }),
      });
      const json = await res.json();
      if (!res.ok) { toast.error(json.hata || 'Kaydedilemedi.'); return; }

      toast.success('Depo eklendi!');
      navigate(-1);
    } catch {
      toast.error('Sunucuya bağlanılamadı.');
    } finally {
      setKaydediyor(false);
    }
  };

  const kapat          = () => navigate(-1);
  const seciliIsletme  = isletmeler.find(i => i.id === seciliIsletmeId);

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col justify-end"
      style={{ background: 'rgba(0,0,0,0.5)' }}
      onClick={e => e.target === e.currentTarget && kapat()}
    >
      <div className="bg-white rounded-t-3xl flex flex-col" style={{ maxHeight: '85vh' }}>

        {/* Handle */}
        <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mt-4" />

        {/* Başlık */}
        <div className="flex items-center justify-between px-5 py-4">
          <h2 className="text-base font-black text-gray-800">Depo Ekle</h2>
          <button
            onClick={kapat}
            className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-gray-500"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <div className="flex-1 overflow-y-auto px-5 space-y-5 pb-4">

          {/* İşletme Seçici */}
          <div>
            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">
              İşletme
            </label>
            <button
              onClick={() => setIsletmePicker(true)}
              className="w-full px-4 py-3 rounded-xl text-sm border border-gray-200 bg-gray-50 flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4" style={{ color: P }} />
                <span
                  className="font-semibold"
                  style={{ color: seciliIsletme ? '#1F2937' : '#9CA3AF' }}
                >
                  {seciliIsletme ? seciliIsletme.ad : 'İşletme seçin...'}
                </span>
              </div>
              <ChevronDown className="w-4 h-4 text-gray-400" />
            </button>
          </div>

          {/* Depo Adı */}
          <div>
            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">
              Depo Adı
            </label>
            <input
              value={depoAdi}
              onChange={e => setDepoAdi(e.target.value)}
              placeholder="Örn: Ana Depo, Soğuk Depo..."
              className="w-full px-4 py-3 rounded-xl text-sm border border-gray-200 bg-gray-50 outline-none"
              onFocus={e  => e.target.style.borderColor = P}
              onBlur={e   => e.target.style.borderColor = '#E5E7EB'}
            />
          </div>

        </div>

        {/* Alt Butonlar */}
        <div className="px-5 py-4 flex gap-2" style={{ borderTop: '1px solid #F3F4F6' }}>
          <button
            onClick={sifirla}
            className="flex-1 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-1.5 active:scale-95 transition-transform"
            style={{ background: '#F3F4F6', color: '#6B7280' }}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Sıfırla
          </button>
          <button
            onClick={kaydet}
            disabled={kaydediyor}
            className="flex-[2] py-3 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-1.5 active:opacity-80 transition-opacity"
            style={{ background: `linear-gradient(135deg,${P},#8b5cf6)`, opacity: kaydediyor ? 0.7 : 1 }}
          >
            {kaydediyor
              ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              : <Save className="w-3.5 h-3.5" />}
            {kaydediyor ? 'Kaydediliyor...' : 'Kaydet'}
          </button>
        </div>
      </div>

      {/* ── İşletme Picker Bottom Sheet ── */}
      {isletmePicker && (
        <div
          className="fixed inset-0 z-[60] flex flex-col justify-end"
          style={{ background: 'rgba(0,0,0,0.45)' }}
          onClick={e => e.target === e.currentTarget && setIsletmePicker(false)}
        >
          <div className="bg-white rounded-t-3xl px-5 pt-5 pb-10">
            <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-4" />

            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: PL }}>
                  <Building2 className="w-4 h-4" style={{ color: P }} />
                </div>
                <h3 className="text-base font-black text-gray-800">İşletme Seç</h3>
              </div>
              <button
                onClick={() => setIsletmePicker(false)}
                className="w-7 h-7 rounded-full flex items-center justify-center bg-gray-100 text-gray-500 font-bold text-sm"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2">
              {isletmeler.map((ist, i) => {
                const aktif = seciliIsletmeId === ist.id;
                return (
                  <button
                    key={ist.id}
                    onClick={() => { setSeciliIsletmeId(ist.id); setIsletmePicker(false); }}
                    className="w-full flex items-center gap-4 p-4 rounded-2xl transition-colors active:scale-[0.98]"
                    style={{
                      background: aktif ? PL : '#F9FAFB',
                      border: aktif ? `1.5px solid rgba(108,83,245,0.25)` : '1.5px solid transparent',
                    }}
                  >
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 font-black text-sm text-white"
                      style={{ background: GRADS[i % GRADS.length] }}
                    >
                      {ist.ad.charAt(0)}
                    </div>
                    <div className="flex-1 text-left min-w-0">
                      <p className="font-bold text-sm text-gray-800 truncate">{ist.ad}</p>
                      {ist.kod && <p className="text-xs text-gray-400 mt-0.5">{ist.kod}</p>}
                    </div>
                    {aktif && (
                      <div
                        className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ background: P }}
                      >
                        <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                          <path d="M1 4l2.5 2.5L9 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
