import { useState } from 'react';
import { X, Save, RotateCcw, Trash2 } from 'lucide-react';
import api from '../../lib/api';
import toast from 'react-hot-toast';

const P  = '#6c53f5';

export default function DepoDuzenle({ depo, onKapat, onKaydedildi, onSilindi }) {
  const baslangic = { ad: depo?.ad || '' };

  const [form,       setForm]       = useState(baslangic);
  const [kaydediyor, setKaydediyor] = useState(false);
  const [onayModu,   setOnayModu]   = useState(null); // 'sifirla' | 'sil' | null

  const temizle = () => {
    setForm({ ad: depo?.ad || '' });
    setOnayModu(null);
    toast('Form sıfırlandı', { icon: '↩️', duration: 1500 });
  };

  const sil = async () => {
    setOnayModu(null);
    try {
      await api.delete(`/depolar/${depo.id}`);

      toast.success('Depo silindi.');
      onSilindi?.(depo.id);
      onKapat();
    } catch (err) {
      toast.error(err.response?.data?.hata || 'Sunucuya bağlanılamadı.');
    }
  };

  const kaydet = async () => {
    if (!form.ad.trim()) { toast.error('Depo adı girin.'); return; }

    setKaydediyor(true);
    try {
      const { data } = await api.put(`/depolar/${depo.id}`, { ad: form.ad.trim() });

      toast.success('Depo güncellendi!');
      onKaydedildi?.(data);
      onKapat();
    } catch (err) {
      toast.error(err.response?.data?.hata || 'Sunucuya bağlanılamadı.');
    } finally {
      setKaydediyor(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col justify-end"
      style={{ background: 'rgba(0,0,0,0.5)' }}
      onClick={e => e.target === e.currentTarget && onKapat()}
    >
      <div className="bg-white rounded-t-3xl flex flex-col" style={{ maxHeight: '92vh' }}>

        {/* Handle */}
        <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mt-4" />

        {/* Başlık */}
        <div className="flex items-center justify-between px-5 py-4">
          <div>
            <h2 className="text-base font-black text-gray-800">Depo Düzenle</h2>
            <p className="text-xs text-gray-400 mt-0.5">{depo?.ad}</p>
          </div>
          <button
            onClick={onKapat}
            className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-gray-500"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <div className="flex-1 overflow-y-auto px-5 space-y-5 pb-4">
          <div>
            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">
              Depo Adı
            </label>
            <input
              value={form.ad}
              onChange={e => setForm(f => ({ ...f, ad: e.target.value }))}
              placeholder="Depo adı..."
              className="w-full px-4 py-3 rounded-xl text-sm border border-gray-200 bg-gray-50 outline-none"
              onFocus={e => e.target.style.borderColor = P}
              onBlur={e  => e.target.style.borderColor = '#E5E7EB'}
            />
          </div>
        </div>

        {/* Alt Butonlar */}
        <div className="px-5 py-4 space-y-3" style={{ borderTop: '1px solid #F3F4F6' }}>

          {/* Onay bar */}
          {onayModu && (
            <div className="px-4 py-3 rounded-2xl border" style={{
              background:   onayModu === 'sil' ? '#FEF2F2' : '#FFFBEB',
              borderColor:  onayModu === 'sil' ? '#FECACA' : '#FDE68A',
            }}>
              <p className="text-xs font-semibold mb-2.5" style={{ color: onayModu === 'sil' ? '#991B1B' : '#92400E' }}>
                {onayModu === 'sil'
                  ? '⚠️ Bu depoyu silmek istediğinizden emin misiniz?'
                  : '↩️ Yapılan değişiklikler geri alınacak. Emin misiniz?'}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setOnayModu(null)}
                  className="flex-1 py-2 rounded-xl text-xs font-bold bg-white border border-gray-200 text-gray-600 active:scale-95 transition-transform"
                >
                  İptal
                </button>
                <button
                  onClick={onayModu === 'sil' ? sil : temizle}
                  className="flex-1 py-2 rounded-xl text-xs font-bold text-white active:scale-95 transition-transform"
                  style={{ background: onayModu === 'sil' ? '#EF4444' : '#F59E0B' }}
                >
                  {onayModu === 'sil' ? 'Evet, Sil' : 'Evet, Sıfırla'}
                </button>
              </div>
            </div>
          )}

          {/* Ana butonlar */}
          <div className="flex gap-2">
            <button
              onClick={() => setOnayModu('sifirla')}
              className="flex-1 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-1.5 active:scale-95 transition-transform"
              style={{ background: '#F3F4F6', color: '#6B7280' }}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Sıfırla
            </button>
            <button
              onClick={() => setOnayModu('sil')}
              className="flex-1 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-1.5 active:scale-95 transition-transform"
              style={{ background: '#FEE2E2', color: '#EF4444' }}
            >
              <Trash2 className="w-3.5 h-3.5" />
              Sil
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
      </div>
    </div>
  );
}
