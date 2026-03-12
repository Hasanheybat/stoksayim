import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Warehouse, ChevronDown, X, Plus } from 'lucide-react';
import api from '../../lib/api';
import useAuthStore from '../../store/authStore';
import toast from 'react-hot-toast';

const P  = '#6c53f5';
const PL = 'rgba(108,83,245,0.10)';
const GRADS = [
  'linear-gradient(135deg,#6c53f5,#8B5CF6)',
  'linear-gradient(135deg,#0EA5E9,#2563EB)',
  'linear-gradient(135deg,#10B981,#059669)',
  'linear-gradient(135deg,#F59E0B,#D97706)',
  'linear-gradient(135deg,#EC4899,#DB2777)',
];

export default function YeniSayimPage() {
  const navigate      = useNavigate();
  const { kullanici } = useAuthStore();

  const [isletmeler,    setIsletmeler]    = useState([]);
  const [depolar,       setDepolar]       = useState([]);
  const [kaydediyor,    setKaydediyor]    = useState(false);
  const [isletmePicker, setIsletmePicker] = useState(false);
  const [depoPicker,    setDepoPicker]    = useState(false);
  const [manuelKisi,    setManuelKisi]    = useState('');

  const [form, setForm] = useState({
    isletme_id: '',
    depo_id:    '',
    tarih:      new Date().toISOString().split('T')[0],
    kisiler:    [],
  });

  useEffect(() => { if (kullanici?.id) fetchIsletmeler(); }, [kullanici?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchIsletmeler = async () => {
    try {
      const { data } = await api.get('/isletmeler');
      const list = Array.isArray(data) ? data : (data?.data || []);
      setIsletmeler(list);
      if (list.length === 1) handleIsletme(list[0].id);
    } catch { /* sessiz hata */ }
  };

  const fetchDepolar = async (isletmeId) => {
    try {
      const { data } = await api.get(`/depolar?isletme_id=${isletmeId}`);
      setDepolar(Array.isArray(data) ? data : (data?.data || []));
      setForm(f => ({ ...f, depo_id: '' }));
    } catch { /* sessiz hata */ }
  };

  const handleIsletme = (id) => {
    setForm(f => ({ ...f, isletme_id: id, depo_id: '' }));
    if (id) fetchDepolar(id);
  };

  const kisiEkle = (ad) => {
    const temiz = ad.trim();
    if (!temiz) return;
    if (form.kisiler.includes(temiz)) { toast.error('Bu kişi zaten eklendi.'); return; }
    setForm(f => ({ ...f, kisiler: [...f.kisiler, temiz] }));
    setManuelKisi('');
  };

  const kisiSil = (ad) => {
    setForm(f => ({ ...f, kisiler: f.kisiler.filter(k => k !== ad) }));
  };

  const handleKaydet = async () => {
    if (!form.isletme_id) { toast.error('İşletme seçin.'); return; }
    if (!form.depo_id)    { toast.error('Depo seçin.');    return; }

    const isletmeAd = isletmeler.find(i => i.id === form.isletme_id)?.ad || '';
    const depoAd    = depolar.find(d => d.id === form.depo_id)?.ad || '';
    const ad        = `${isletmeAd} — ${depoAd} (${form.tarih})`;

    setKaydediyor(true);
    try {
      const { data } = await api.post('/sayimlar', {
        isletme_id: form.isletme_id,
        depo_id:    form.depo_id,
        ad,
        tarih:      form.tarih,
        kisiler:    form.kisiler,
      });
      toast.success('Sayım başlatıldı!');
      navigate(`/app/sayim/${data.id}`, { replace: true });
    } catch (err) {
      const msg = err.response?.data?.hata || 'Sayım oluşturulamadı.';
      toast.error(msg);
      setKaydediyor(false);
    }
  };

  /* ── Modal overlay — SayimlarPage arka planda görünür ── */
  return (
    <div
      className="fixed inset-0 z-[200] flex flex-col justify-end"
      style={{ background: 'rgba(0,0,0,0.45)' }}
      onClick={e => e.target === e.currentTarget && navigate(-1)}
    >
      <div className="bg-white rounded-t-3xl flex flex-col" style={{ maxHeight: '92vh' }}>

        {/* Drag handle */}
        <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mt-4 flex-shrink-0" />

        {/* Başlık */}
        <div
          className="flex items-center justify-between px-5 py-4 flex-shrink-0"
          style={{ borderBottom: '1px solid #F3F4F6' }}
        >
          <div>
            <p className="text-sm font-black text-gray-800">Yeni Sayım Başlat</p>
          </div>
          <button
            onClick={() => navigate(-1)}
            className="w-8 h-8 rounded-full flex items-center justify-center bg-gray-100 text-gray-500 active:scale-90 transition-transform"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">

          {/* İşletme */}
          <div>
            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">İşletme</label>
            <button
              onClick={() => setIsletmePicker(true)}
              className="w-full px-4 py-3 rounded-xl text-sm border border-gray-200 bg-gray-50 flex items-center justify-between active:bg-gray-100 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4" style={{ color: P }} />
                <span className="font-semibold" style={{ color: form.isletme_id ? '#1F2937' : '#9CA3AF' }}>
                  {isletmeler.find(i => i.id === form.isletme_id)?.ad || 'İşletme seçin...'}
                </span>
              </div>
              <ChevronDown className="w-4 h-4 text-gray-400" />
            </button>
          </div>

          {/* Depo */}
          <div>
            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">Depo</label>
            <button
              onClick={() => form.isletme_id && setDepoPicker(true)}
              className="w-full px-4 py-3 rounded-xl text-sm border border-gray-200 bg-gray-50 flex items-center justify-between active:bg-gray-100 transition-colors"
              style={{ opacity: form.isletme_id ? 1 : 0.5 }}
            >
              <div className="flex items-center gap-2">
                <Warehouse className="w-4 h-4" style={{ color: P }} />
                <span className="font-semibold" style={{ color: form.depo_id ? '#1F2937' : '#9CA3AF' }}>
                  {!form.isletme_id
                    ? 'Önce işletme seçin'
                    : depolar.find(d => d.id === form.depo_id)?.ad || (depolar.length === 0 ? 'Bu işletmede depo yok' : 'Depo seçin...')}
                </span>
              </div>
              <ChevronDown className="w-4 h-4 text-gray-400" />
            </button>
          </div>

          {/* Tarih */}
          <div>
            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">Tarih</label>
            <input
              type="date"
              value={form.tarih}
              onChange={e => setForm(f => ({ ...f, tarih: e.target.value }))}
              className="w-full px-4 py-3 rounded-xl text-sm border border-gray-200 bg-gray-50 outline-none"
              onFocus={e => e.target.style.borderColor = P}
              onBlur={e  => e.target.style.borderColor = '#E5E7EB'}
            />
          </div>

          {/* Sayım Yapan Kişiler */}
          <div>
            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">Sayım Yapan Kişiler</label>
            <div className="w-full min-h-[48px] px-3 py-2.5 rounded-xl border border-gray-200 bg-gray-50 flex flex-wrap gap-1.5 mb-2">
              {form.kisiler.length === 0 ? (
                <span className="text-xs text-gray-400 self-center">Kişi eklenmedi</span>
              ) : (
                form.kisiler.map(k => (
                  <button
                    key={k}
                    onClick={() => kisiSil(k)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold active:scale-95 transition-transform"
                    style={{ background: PL, color: P }}
                  >
                    {k}
                    <X className="w-2.5 h-2.5 opacity-60" />
                  </button>
                ))
              )}
            </div>
            <div className="flex gap-2">
              <input
                value={manuelKisi}
                onChange={e => setManuelKisi(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && kisiEkle(manuelKisi)}
                placeholder="Kişi adı girin..."
                className="flex-1 px-3 py-2.5 rounded-xl text-sm border border-gray-200 bg-gray-50 outline-none"
                onFocus={e => e.target.style.borderColor = P}
                onBlur={e  => e.target.style.borderColor = '#E5E7EB'}
              />
              <button
                onClick={() => kisiEkle(manuelKisi)}
                className="px-4 py-2.5 rounded-xl text-sm font-bold text-white active:scale-95 transition-transform"
                style={{ background: P }}
              >
                Ekle
              </button>
            </div>
          </div>
        </div>

        {/* Alt Buton */}
        <div className="bg-white px-5 py-4 flex-shrink-0" style={{ borderTop: '1px solid #F3F4F6' }}>
          <button
            onClick={handleKaydet}
            disabled={kaydediyor}
            className="w-full py-3.5 rounded-xl font-bold text-white flex items-center justify-center gap-2 active:scale-95 transition-transform disabled:opacity-70"
            style={{ background: `linear-gradient(135deg,${P},#8b5cf6)` }}
          >
            {kaydediyor ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Plus className="w-4 h-4" strokeWidth={2.5} />
            )}
            {kaydediyor ? 'Başlatılıyor...' : 'Sayımı Başlat'}
          </button>
        </div>
      </div>

      {/* ── İşletme Picker ── */}
      {isletmePicker && (
        <div
          className="fixed inset-0 z-[210] flex flex-col justify-end"
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
              <button onClick={() => setIsletmePicker(false)} className="w-7 h-7 rounded-full flex items-center justify-center bg-gray-100 text-gray-500">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-2">
              {isletmeler.map((ist, i) => {
                const aktif = form.isletme_id === ist.id;
                return (
                  <button
                    key={ist.id}
                    onClick={() => { handleIsletme(ist.id); setIsletmePicker(false); }}
                    className="w-full flex items-center gap-4 p-4 rounded-2xl active:scale-[0.98] transition-transform"
                    style={{ background: aktif ? PL : '#F9FAFB', border: aktif ? `1.5px solid rgba(108,83,245,0.25)` : '1.5px solid transparent' }}
                  >
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 font-black text-sm text-white" style={{ background: GRADS[i % GRADS.length] }}>
                      {ist.ad.charAt(0)}
                    </div>
                    <div className="flex-1 text-left min-w-0">
                      <p className="font-bold text-sm text-gray-800 truncate">{ist.ad}</p>
                      {ist.kod && <p className="text-xs text-gray-400 mt-0.5">{ist.kod}</p>}
                    </div>
                    {aktif && (
                      <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: P }}>
                        <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4l2.5 2.5L9 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── Depo Picker ── */}
      {depoPicker && (
        <div
          className="fixed inset-0 z-[210] flex flex-col justify-end"
          style={{ background: 'rgba(0,0,0,0.45)' }}
          onClick={e => e.target === e.currentTarget && setDepoPicker(false)}
        >
          <div className="bg-white rounded-t-3xl px-5 pt-5 pb-10">
            <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-4" />
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: PL }}>
                  <Warehouse className="w-4 h-4" style={{ color: P }} />
                </div>
                <h3 className="text-base font-black text-gray-800">Depo Seç</h3>
              </div>
              <button onClick={() => setDepoPicker(false)} className="w-7 h-7 rounded-full flex items-center justify-center bg-gray-100 text-gray-500">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-2">
              {depolar.map((d, i) => {
                const aktif = form.depo_id === d.id;
                return (
                  <button
                    key={d.id}
                    onClick={() => { setForm(f => ({ ...f, depo_id: d.id })); setDepoPicker(false); }}
                    className="w-full flex items-center gap-4 p-4 rounded-2xl active:scale-[0.98] transition-transform"
                    style={{ background: aktif ? PL : '#F9FAFB', border: aktif ? `1.5px solid rgba(108,83,245,0.25)` : '1.5px solid transparent' }}
                  >
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 font-black text-sm text-white" style={{ background: GRADS[i % GRADS.length] }}>
                      {d.ad.charAt(0)}
                    </div>
                    <p className="flex-1 text-left font-bold text-sm text-gray-800 truncate">{d.ad}</p>
                    {aktif && (
                      <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: P }}>
                        <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4l2.5 2.5L9 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
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
