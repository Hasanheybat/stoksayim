import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Plus, ClipboardList, Clock, CheckCircle, XCircle, Building2, Warehouse, ChevronDown, X, Pencil, Trash2 } from 'lucide-react';
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

const DURUM = {
  devam:      { bg: '#EEF2FF', color: '#6366F1', label: 'Devam Ediyor', Icon: Clock       },
  tamamlandi: { bg: '#ECFDF5', color: '#059669', label: 'Tamamlandı',   Icon: CheckCircle },
};

function DurumBadge({ durum }) {
  const d = DURUM[durum] || DURUM.devam;
  return (
    <span
      className="flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full flex-shrink-0"
      style={{ background: d.bg, color: d.color }}
    >
      <d.Icon className="w-3 h-3" />
      {d.label}
    </span>
  );
}

const FILTRELER = [
  { key: 'hepsi',      label: 'Tümü'      },
  { key: 'devam',      label: 'Devam'     },
  { key: 'tamamlandi', label: 'Tamamlanan'},
];

export default function SayimlarPage() {
  const navigate                              = useNavigate();
  const location                              = useLocation();
  const { kullanici, isletmeYetkisi }         = useAuthStore();

  const [isletmeler,    setIsletmeler]    = useState([]);
  const [seciliIsletme, setSeciliIsletme] = useState(null);
  const [sayimlar,      setSayimlar]      = useState([]);
  const [yukleniyor,    setYukleniyor]    = useState(false);
  const [aktifFiltre,   setAktifFiltre]   = useState('hepsi');
  const [picker,        setPicker]        = useState(false);

  /* Düzenleme */
  const [duzenleSheet,  setDuzenleSheet]  = useState(null);
  const [duzDepolar,    setDuzDepolar]    = useState([]);
  const [duzDepoId,     setDuzDepoId]     = useState('');
  const [duzKisiler,    setDuzKisiler]    = useState([]);
  const [duzKisiInput,  setDuzKisiInput]  = useState('');
  const [duzDepoPicker, setDuzDepoPicker] = useState(false);
  const [duzKaydediyor, setDuzKaydediyor] = useState(false);

  /* Silme onayı */
  const [silOnay,   setSilOnay]   = useState(null);  // sayim id
  const [siliniyor, setSiliniyor] = useState(false);


  const isAdmin = kullanici?.rol === 'admin';

  useEffect(() => { if (kullanici?.id) fetchIsletmeler(); }, [kullanici?.id]);
  useEffect(() => { if (seciliIsletme) fetchSayimlar(seciliIsletme); }, [seciliIsletme]);

  const fetchIsletmeler = async () => {
    let list = [];
    if (isAdmin) {
      // Admin aktif + pasif tüm işletmeleri görür
      const { data } = await api.get('/isletmeler');
      list = data || [];
    } else {
      const { data } = await api.get('/profil/isletmelerim');
      list = (data || []).filter(i => isletmeYetkisi(i.id, 'sayim', 'goruntule'));
    }
    setIsletmeler(list);
    if (list.length > 0) setSeciliIsletme(list[0].id);
  };

  const fetchSayimlar = async (isletmeId) => {
    setYukleniyor(true);
    try {
      const { data } = await api.get(`/sayimlar?isletme_id=${isletmeId}&limit=500`);
      const rows = (data.data || []).filter(s => s.durum !== 'silindi');
      setSayimlar(rows.map(s => ({ ...s, _depoAd: s.depolar?.ad || '—' })));
    } catch (err) {
      console.error('fetchSayimlar:', err);
    }
    setYukleniyor(false);
  };

  const handleDuzenleAc = async (sayim) => {
    setDuzenleSheet(sayim);
    setDuzDepoId(sayim.depo_id || '');
    setDuzKisiInput('');

    // kisiler zaten list response'da geliyor — ayrı DB çağrısına gerek yok
    setDuzKisiler(Array.isArray(sayim.kisiler) ? sayim.kisiler : []);

    try {
      // sayfa=1 ekleyerek admin endpoint'inde de {data:[]} formatı garanti edilir
      const { data } = await api.get(`/depolar?isletme_id=${sayim.isletme_id || seciliIsletme}&sayfa=1&limit=500`);
      setDuzDepolar(data?.data || []);
    } catch {
      setDuzDepolar([]);
    }
  };

  const handleDuzenleKaydet = async () => {
    if (!duzDepoId) { toast.error('Depo seçin.'); return; }
    const depoAd    = duzDepolar.find(d => d.id === duzDepoId)?.ad || '';
    const isletmeAd = duzenleSheet.isletmeler?.ad || '';
    const yeniAd    = `${isletmeAd} — ${depoAd} (${duzenleSheet.tarih})`;
    setDuzKaydediyor(true);
    try {
      await api.put(`/sayimlar/${duzenleSheet.id}`, {
        depo_id: duzDepoId,
        ad: yeniAd,
        kisiler: duzKisiler,
      });
      toast.success('Sayım güncellendi!');
      setDuzenleSheet(null);
      fetchSayimlar(seciliIsletme);
    } catch (err) {
      toast.error(err.response?.data?.hata || 'Güncellenemedi.');
    }
    setDuzKaydediyor(false);
  };

  const handleSayimSil = async () => {
    setSiliniyor(true);
    try {
      await api.delete(`/sayimlar/${silOnay}`);
      toast.success('Sayım silindi.');
      setSilOnay(null);
      setSayimlar(prev => prev.filter(s => s.id !== silOnay));
    } catch (err) {
      toast.error(err.response?.data?.hata || 'Silinemedi.');
    }
    setSiliniyor(false);
  };


  const seciliIsletmeObj  = isletmeler.find(i => i.id === seciliIsletme);
  const seciliPasif       = seciliIsletmeObj && seciliIsletmeObj.aktif === false;
  const canEkle           = seciliIsletme && isletmeYetkisi(seciliIsletme, 'sayim', 'ekle');
  const canDuzenle        = seciliIsletme && isletmeYetkisi(seciliIsletme, 'sayim', 'duzenle');
  const canSil            = seciliIsletme && isletmeYetkisi(seciliIsletme, 'sayim', 'sil');
  const gosterilenSayimlar = aktifFiltre === 'hepsi'
    ? sayimlar
    : sayimlar.filter(s => s.durum === aktifFiltre);

  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 56px - 44px)', overflow: 'hidden' }}>

      {/* ── Üst Bar ── */}
      <div
        className="bg-white px-3 py-3 flex items-center gap-2"
        style={{ borderBottom: '1px solid #F3F4F6' }}
      >
        {/* İşletme seçici */}
        <button
          onClick={() => setPicker(true)}
          className="flex items-center gap-1.5 flex-shrink-0 px-3 py-2 rounded-xl text-xs font-bold active:scale-95 transition-transform flex-1 min-w-0"
          style={{
            background: seciliPasif ? '#FEF2F2' : PL,
            color: seciliPasif ? '#DC2626' : P,
            border: `1px solid ${seciliPasif ? 'rgba(220,38,38,0.2)' : 'rgba(108,83,245,0.15)'}`,
          }}
        >
          <Building2 className="w-3.5 h-3.5 flex-shrink-0" />
          <span className="truncate">{seciliIsletmeObj ? seciliIsletmeObj.ad : 'İşletme'}</span>
          {seciliPasif && (
            <span className="flex-shrink-0 text-[9px] font-black px-1.5 py-0.5 rounded-full"
              style={{ background: '#FEE2E2', color: '#DC2626' }}>
              PASİF
            </span>
          )}
          <ChevronDown className="w-3 h-3 flex-shrink-0 opacity-60" />
        </button>

        {/* Sayım Ekle — yetki kontrolü */}
        {canEkle && (
          <button
            onClick={() => {
              if (seciliPasif) { toast.error('Pasif işletmeye sayım eklenemez.'); return; }
              navigate('/app/yeni-sayim', { state: { background: location } });
            }}
            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 active:scale-90 transition-transform"
            style={{ background: seciliPasif ? '#E5E7EB' : `linear-gradient(135deg,${P},#8b5cf6)` }}
          >
            <Plus className="w-4 h-4" style={{ color: seciliPasif ? '#9CA3AF' : 'white' }} strokeWidth={2.5} />
          </button>
        )}
      </div>

      {/* ── Filtreler ── */}
      <div className="bg-white px-3 py-2.5 flex gap-2" style={{ borderBottom: '1px solid #F3F4F6' }}>
        {FILTRELER.map(f => (
          <button
            key={f.key}
            onClick={() => setAktifFiltre(f.key)}
            className="flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-bold transition-all"
            style={{
              background: aktifFiltre === f.key ? `linear-gradient(135deg,${P},#8b5cf6)` : '#F3F4F6',
              color: aktifFiltre === f.key ? 'white' : '#6B7280',
            }}
          >
            {f.label}
            {f.key !== 'hepsi' && (
              <span className="ml-1 opacity-70">
                ({sayimlar.filter(s => s.durum === f.key).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Sonuç sayısı ── */}
      {!yukleniyor && sayimlar.length > 0 && (
        <div className="px-4 pt-3 pb-1">
          <p className="text-xs text-gray-400">
            {gosterilenSayimlar.length} / {sayimlar.length} sayım
            {seciliIsletmeObj && (
              <span className="ml-1.5 font-semibold" style={{ color: P }}>
                · {seciliIsletmeObj.ad}
              </span>
            )}
          </p>
        </div>
      )}

      {/* ── Sayım Listesi ── */}
      <div className="flex-1 overflow-y-auto px-4 pb-4 pt-2 space-y-3">
        {yukleniyor ? (
          <div className="flex items-center justify-center py-20">
            <div
              className="w-8 h-8 border-[3px] rounded-full animate-spin"
              style={{ borderColor: P, borderTopColor: 'transparent' }}
            />
          </div>
        ) : isletmeler.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <Building2 className="w-12 h-12 mb-3 opacity-30" />
            <p className="text-sm font-semibold">Atanmış işletme yok</p>
            <p className="text-xs mt-1">Yöneticinizle iletişime geçin</p>
          </div>
        ) : gosterilenSayimlar.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <ClipboardList className="w-12 h-12 mb-3 opacity-30" />
            <p className="text-sm font-semibold">
              {aktifFiltre === 'hepsi' ? 'Henüz sayım yok' : 'Sayım bulunamadı'}
            </p>
            {aktifFiltre === 'hepsi' && (
              <p className="text-xs mt-1">+ butonuna basarak yeni sayım başlatın</p>
            )}
          </div>
        ) : (
          gosterilenSayimlar.map(s => (
            <div
              key={s.id}
              className="bg-white rounded-2xl shadow-sm overflow-hidden active:bg-gray-50 transition-colors cursor-pointer"
              style={{ border: '1px solid #F3F4F6' }}
              onClick={() => navigate(`/app/sayim/${s.id}`)}
            >
              <div className="p-4">
                <div className="flex items-start justify-between gap-2 mb-2.5">
                  <p className="font-bold text-gray-800 text-sm leading-snug flex-1">{s._depoAd}</p>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <DurumBadge durum={s.durum} />
                    {s.durum === 'devam' && !seciliPasif && (
                      <>
                        {/* Metadata düzenle — yetki gerektirmez */}
                        <button
                          onClick={e => { e.stopPropagation(); handleDuzenleAc(s); }}
                          className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 active:scale-90 transition-transform"
                          style={{ background: '#F3F4F6' }}
                        >
                          <Pencil className="w-3.5 h-3.5 text-gray-400" />
                        </button>
                        {/* Sil — sayim.sil yetkisi gerekli */}
                        {canSil && (
                          <button
                            onClick={e => { e.stopPropagation(); setSilOnay(s.id); }}
                            className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 active:scale-90 transition-transform"
                            style={{ background: '#FEF2F2' }}
                          >
                            <Trash2 className="w-3.5 h-3.5 text-red-400" />
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-400">
                  <span className="flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5" />
                    {isletmeler.find(i => i.id === s.isletme_id)?.ad || '—'}
                  </span>
                  <span className="font-mono text-[10px] bg-gray-100 px-1.5 py-0.5 rounded">
                    #{s.id?.split('-')[0]?.toUpperCase()}
                  </span>
                  <span className="ml-auto">{s.tarih}</span>
                </div>
              </div>

            </div>
          ))
        )}
      </div>


      {/* ── Sayım Düzenleme Bottom Sheet ── */}
      {duzenleSheet && (
        <div
          className="fixed inset-0 z-50 flex flex-col justify-end"
          style={{ background: 'rgba(0,0,0,0.45)' }}
          onClick={e => e.target === e.currentTarget && setDuzenleSheet(null)}
        >
          <div className="bg-white rounded-t-3xl flex flex-col" style={{ maxHeight: '88vh' }}>
            <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mt-4" />
            <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid #F3F4F6' }}>
              <p className="text-sm font-black text-gray-800">Sayımı Düzenle</p>
              <button
                onClick={() => setDuzenleSheet(null)}
                className="w-7 h-7 rounded-full flex items-center justify-center bg-gray-100 text-gray-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">
              {/* Depo */}
              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">Depo</label>
                <button
                  onClick={() => setDuzDepoPicker(true)}
                  className="w-full px-4 py-3 rounded-xl text-sm border border-gray-200 bg-gray-50 flex items-center justify-between active:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Warehouse className="w-4 h-4" style={{ color: P }} />
                    <span className="font-semibold" style={{ color: duzDepoId ? '#1F2937' : '#9CA3AF' }}>
                      {duzDepolar.find(d => d.id === duzDepoId)?.ad || 'Depo seçin...'}
                    </span>
                  </div>
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                </button>
              </div>

              {/* Kişiler */}
              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">Sayım Yapan Kişiler</label>
                <div className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 flex flex-wrap gap-1.5 mb-2">
                  {duzKisiler.length === 0 ? (
                    <span className="text-xs text-gray-400 self-center">Kişi eklenmedi</span>
                  ) : (
                    duzKisiler.map(k => (
                      <button
                        key={k}
                        onClick={() => setDuzKisiler(prev => prev.filter(p => p !== k))}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold"
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
                    value={duzKisiInput}
                    onChange={e => setDuzKisiInput(e.target.value)}
                    onKeyDown={e => {
                      if (e.key !== 'Enter') return;
                      const t = duzKisiInput.trim();
                      if (!t) return;
                      if (!duzKisiler.includes(t)) setDuzKisiler(prev => [...prev, t]);
                      setDuzKisiInput('');
                    }}
                    placeholder="Kişi adı girin..."
                    className="flex-1 px-3 py-2.5 rounded-xl text-sm border border-gray-200 bg-gray-50 outline-none"
                    onFocus={e => e.target.style.borderColor = P}
                    onBlur={e  => e.target.style.borderColor = '#E5E7EB'}
                  />
                  <button
                    onClick={() => {
                      const t = duzKisiInput.trim();
                      if (!t) return;
                      if (!duzKisiler.includes(t)) setDuzKisiler(prev => [...prev, t]);
                      setDuzKisiInput('');
                    }}
                    className="px-4 py-2.5 rounded-xl text-sm font-bold text-white"
                    style={{ background: P }}
                  >
                    Ekle
                  </button>
                </div>
              </div>
            </div>

            <div className="px-5 py-4" style={{ borderTop: '1px solid #F3F4F6' }}>
              <button
                onClick={handleDuzenleKaydet}
                disabled={duzKaydediyor}
                className="w-full py-3.5 rounded-xl font-bold text-white flex items-center justify-center gap-2 active:scale-95 transition-transform disabled:opacity-70"
                style={{ background: `linear-gradient(135deg,${P},#8b5cf6)` }}
              >
                {duzKaydediyor && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                Kaydet
              </button>
            </div>
          </div>

          {/* Depo Picker (düzenleme içinde) */}
          {duzDepoPicker && (
            <div
              className="fixed inset-0 z-[60] flex flex-col justify-end"
              style={{ background: 'rgba(0,0,0,0.45)' }}
              onClick={e => e.target === e.currentTarget && setDuzDepoPicker(false)}
            >
              <div className="bg-white rounded-t-3xl px-5 pt-5 flex flex-col" style={{ maxHeight: '70vh' }}>
                <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-4 flex-shrink-0" />
                <div className="flex items-center justify-between mb-5 flex-shrink-0">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: PL }}>
                      <Warehouse className="w-4 h-4" style={{ color: P }} />
                    </div>
                    <h3 className="text-base font-black text-gray-800">Depo Seç</h3>
                  </div>
                  <button onClick={() => setDuzDepoPicker(false)} className="w-7 h-7 rounded-full flex items-center justify-center bg-gray-100 text-gray-500">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="space-y-2 overflow-y-auto pb-10" style={{ WebkitOverflowScrolling: 'touch' }}>
                  {duzDepolar.map((d, i) => {
                    const aktif = duzDepoId === d.id;
                    return (
                      <button
                        key={d.id}
                        onClick={() => { setDuzDepoId(d.id); setDuzDepoPicker(false); }}
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
      )}

      {/* ── Silme Onayı ── */}
      {silOnay && (
        <div
          className="fixed inset-0 z-50 flex flex-col justify-end"
          style={{ background: 'rgba(0,0,0,0.45)' }}
          onClick={e => e.target === e.currentTarget && setSilOnay(null)}
        >
          <div className="bg-white rounded-t-3xl px-5 pt-6 pb-10">
            <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-5" />
            <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: '#FEF2F2' }}>
              <Trash2 className="w-6 h-6 text-red-500" />
            </div>
            <p className="text-center font-black text-gray-800 text-base mb-1.5">Sayımı Sil</p>
            <p className="text-center text-xs text-gray-400 mb-6 leading-relaxed">
              Bu sayım sisteminizde silinmiş olarak işaretlenecek.<br />Bu işlem geri alınamaz.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setSilOnay(null)}
                className="py-3.5 rounded-xl font-bold text-sm active:scale-95 transition-transform"
                style={{ background: '#F3F4F6', color: '#6B7280' }}
              >
                Vazgeç
              </button>
              <button
                onClick={handleSayimSil}
                disabled={siliniyor}
                className="py-3.5 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2 active:scale-95 transition-transform disabled:opacity-70"
                style={{ background: '#EF4444' }}
              >
                {siliniyor && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                Evet, Sil
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── İşletme Seçici Bottom Sheet ── */}
      {picker && (
        <div
          className="fixed inset-0 z-50 flex flex-col justify-end"
          style={{ background: 'rgba(0,0,0,0.45)' }}
          onClick={e => e.target === e.currentTarget && setPicker(false)}
        >
          <div className="bg-white rounded-t-3xl px-5 pt-5 flex flex-col" style={{ maxHeight: '70vh' }}>
            <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-4 flex-shrink-0" />

            <div className="flex items-center justify-between mb-5 flex-shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: PL }}>
                  <Building2 className="w-4 h-4" style={{ color: P }} />
                </div>
                <h3 className="text-base font-black text-gray-800">İşletme Seç</h3>
              </div>
              <button
                onClick={() => setPicker(false)}
                className="w-7 h-7 rounded-full flex items-center justify-center bg-gray-100 text-gray-500 font-bold text-sm"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 overflow-y-auto pb-10" style={{ WebkitOverflowScrolling: 'touch' }}>
              {isletmeler.map((ist, i) => {
                const secili = seciliIsletme === ist.id;
                const isPasif = ist.aktif === false;
                return (
                  <button
                    key={ist.id}
                    onClick={() => { setSeciliIsletme(ist.id); setAktifFiltre('hepsi'); setPicker(false); }}
                    className="w-full flex items-center gap-4 p-4 rounded-2xl active:scale-[0.98] transition-transform"
                    style={{
                      background: secili ? PL : '#F9FAFB',
                      border: secili ? `1.5px solid rgba(108,83,245,0.25)` : '1.5px solid transparent',
                    }}
                  >
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 font-black text-sm text-white"
                      style={{ background: isPasif ? '#9CA3AF' : GRADS[i % GRADS.length] }}
                    >
                      {ist.ad.charAt(0)}
                    </div>
                    <div className="flex-1 text-left min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-sm text-gray-800 truncate">{ist.ad}</p>
                        {isPasif && (
                          <span className="flex-shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                            style={{ background: '#FEE2E2', color: '#DC2626' }}>
                            Pasif
                          </span>
                        )}
                      </div>
                      {ist.kod && <p className="text-xs text-gray-400 mt-0.5">{ist.kod}</p>}
                    </div>
                    {secili && (
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
