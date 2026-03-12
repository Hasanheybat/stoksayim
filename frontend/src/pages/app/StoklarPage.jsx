import { useState, useEffect, useRef } from 'react';
import { Search, Plus, ChevronDown, Building2, Pencil } from 'lucide-react';
import StokDuzenle from '../../components/app/StokDuzenle';
import StokEkle from '../../components/app/StokEkle';
import api from '../../lib/api';
import useAuthStore from '../../store/authStore';

const P  = '#6c53f5';
const PL = 'rgba(108,83,245,0.10)';

const GRADS = [
  'linear-gradient(135deg,#6c53f5,#8B5CF6)',
  'linear-gradient(135deg,#0EA5E9,#2563EB)',
  'linear-gradient(135deg,#10B981,#059669)',
  'linear-gradient(135deg,#F59E0B,#D97706)',
  'linear-gradient(135deg,#EC4899,#DB2777)',
];

export default function StoklarPage() {
  const { kullanici, isletmeYetkisi } = useAuthStore();
  const isAdmin = kullanici?.rol === 'admin';

  const [isletmeler, setIsletmeler]           = useState([]);
  const [seciliIsletme, setSeciliIsletme]     = useState(null);
  const [urunler, setUrunler]                 = useState([]);
  const [filtreliUrunler, setFiltreliUrunler] = useState([]);
  const [aramaStr, setAramaStr]               = useState('');
  const [yukleniyor, setYukleniyor]           = useState(false);
  const [picker, setPicker]                   = useState(false);
  const [duzenle, setDuzenle]                 = useState(null);
  const [ekleAcik, setEkleAcik]               = useState(false);
  const searchRef = useRef(null);

  useEffect(() => { if (kullanici?.id) fetchIsletmeler(); }, [kullanici?.id]); // eslint-disable-line
  useEffect(() => { if (seciliIsletme) fetchUrunler(seciliIsletme); }, [seciliIsletme]); // eslint-disable-line

  useEffect(() => {
    if (!aramaStr.trim()) { setFiltreliUrunler(urunler); return; }
    const q = aramaStr.toLowerCase();
    setFiltreliUrunler(
      urunler.filter(u =>
        u.urun_adi.toLowerCase().includes(q) ||
        (u.isim_2 || '').toLowerCase().includes(q) ||
        u.urun_kodu.toLowerCase().includes(q) ||
        (u.barkodlar || '').includes(q)
      )
    );
  }, [aramaStr, urunler]);

  const fetchIsletmeler = async () => {
    let list = [];
    if (isAdmin) {
      const { data } = await api.get('/isletmeler');
      list = data || [];
    } else {
      const { data } = await api.get('/profil/isletmelerim');
      // Sadece urun.goruntule yetkisi olan işletmeleri göster
      list = (data || []).filter(i => isletmeYetkisi(i.id, 'urun', 'goruntule'));
    }
    setIsletmeler(list);
    if (list.length > 0) setSeciliIsletme(list[0].id);
  };

  const fetchUrunler = async (isletmeId) => {
    setYukleniyor(true);
    try {
      const { data } = await api.get(`/urunler?isletme_id=${isletmeId}`);
      // Admin: backend returns paginated {data,toplam}; user: returns plain array
      const list = Array.isArray(data) ? data : (data?.data || []);
      setUrunler(list);
      setFiltreliUrunler(list);
    } catch {
      setUrunler([]);
      setFiltreliUrunler([]);
    }
    setYukleniyor(false);
  };

  const seciliIsletmeObj = isletmeler.find(i => i.id === seciliIsletme);
  const seciliPasif      = seciliIsletmeObj?.aktif === false;
  const isletmeIdx       = isletmeler.findIndex(i => i.id === seciliIsletme);
  const urunGrad         = GRADS[isletmeIdx % GRADS.length] || GRADS[0]; // eslint-disable-line no-unused-vars
  const canEkle          = seciliIsletme && isletmeYetkisi(seciliIsletme, 'urun', 'ekle');
  const canDuzenle       = seciliIsletme && isletmeYetkisi(seciliIsletme, 'urun', 'duzenle');

  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 56px - 44px)', overflow: 'hidden' }}>

      {/* ── Üst Bar ── */}
      <div
        className="bg-white px-3 py-3 shadow-sm flex items-center gap-2"
        style={{ borderBottom: '1px solid #F3F4F6' }}
      >
        {/* İşletme seçici */}
        <button
          onClick={() => setPicker(true)}
          className="flex items-center gap-1.5 flex-shrink-0 px-3 py-2 rounded-xl text-xs font-bold transition-colors active:scale-95 flex-1 min-w-0"
          style={{
            background: seciliPasif ? '#FEF2F2' : PL,
            color: seciliPasif ? '#DC2626' : P,
            border: `1px solid ${seciliPasif ? 'rgba(220,38,38,0.2)' : 'rgba(108,83,245,0.15)'}`,
          }}
        >
          <Building2 className="w-3.5 h-3.5 flex-shrink-0" />
          <span className="truncate">
            {seciliIsletmeObj ? seciliIsletmeObj.ad : 'İşletme'}
          </span>
          {seciliPasif && (
            <span className="flex-shrink-0 text-[9px] font-black px-1.5 py-0.5 rounded-full"
              style={{ background: '#FEE2E2', color: '#DC2626' }}>
              PASİF
            </span>
          )}
          <ChevronDown className="w-3 h-3 flex-shrink-0 opacity-60" />
        </button>

        {/* Arama */}
        <div className="relative w-28 flex-shrink-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input
            ref={searchRef}
            value={aramaStr}
            onChange={e => setAramaStr(e.target.value)}
            placeholder="Ara..."
            className="w-full pl-9 pr-3 py-2 rounded-xl text-xs border border-gray-200 outline-none bg-gray-50"
            onFocus={e => e.target.style.borderColor = P}
            onBlur={e => e.target.style.borderColor = '#E5E7EB'}
          />
        </div>

        {/* Stok Ekle — yetki + pasif kontrolü */}
        {canEkle && (
          <button
            onClick={() => { if (!seciliPasif) setEkleAcik(true); }}
            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 active:scale-90 transition-transform"
            style={{
              background: seciliPasif ? '#E5E7EB' : `linear-gradient(135deg,${P},#8b5cf6)`,
              cursor: seciliPasif ? 'not-allowed' : 'pointer',
            }}
            title={seciliPasif ? 'Pasif işletmeye stok eklenemez' : 'Stok Ekle'}
          >
            <Plus className="w-4 h-4" style={{ color: seciliPasif ? '#9CA3AF' : 'white' }} strokeWidth={2.5} />
          </button>
        )}
      </div>

      {/* ── Pasif Uyarı Bandı ── */}
      {seciliPasif && (
        <div className="px-4 py-2.5 flex items-center gap-2"
          style={{ background: '#FEF2F2', borderBottom: '1px solid #FECACA' }}>
          <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: '#DC2626' }} />
          <p className="text-xs font-semibold text-red-600">
            Bu işletme pasif — yalnızca görüntüleme modunda
          </p>
        </div>
      )}

      {/* ── Sonuç Sayısı ── */}
      {!yukleniyor && urunler.length > 0 && (
        <div className="px-4 pt-3 pb-1">
          <p className="text-xs text-gray-400">
            {filtreliUrunler.length} / {urunler.length} ürün
            {seciliIsletmeObj && (
              <span className="ml-1.5 font-semibold" style={{ color: P }}>
                · {seciliIsletmeObj.ad}
              </span>
            )}
          </p>
        </div>
      )}

      {/* ── Ürün Listesi ── */}
      <div className="flex-1 overflow-y-auto px-4 pb-4 pt-2 space-y-2">
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
            <p className="text-xs mt-1 text-center px-8">Yöneticinizle iletişime geçin</p>
          </div>
        ) : filtreliUrunler.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <Search className="w-10 h-10 mb-3 opacity-30" />
            <p className="text-sm font-semibold">Ürün bulunamadı</p>
          </div>
        ) : (
          filtreliUrunler.map(u => (
            <div key={u.id} className="bg-white rounded-2xl px-4 py-3 shadow-sm flex items-center gap-3"
              style={{ border: `1px solid ${seciliPasif ? '#FEE2E2' : '#F3F4F6'}` }}>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold leading-tight truncate"
                  style={{ color: seciliPasif ? '#9CA3AF' : '#1F2937' }}>{u.urun_adi}</p>
                {u.isim_2 && (
                  <p className="text-xs text-gray-400 truncate mt-0.5 italic">{u.isim_2}</p>
                )}
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  <span className="text-xs text-gray-400 font-mono">{u.urun_kodu}</span>
                  {u.kategori && (
                    <span
                      className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
                      style={{ background: PL, color: P }}
                    >
                      {u.kategori}
                    </span>
                  )}
                </div>
              </div>
              <span
                className="text-xs font-bold px-2.5 py-1 rounded-lg flex-shrink-0"
                style={{ background: PL, color: P }}
              >
                {u.birim}
              </span>
              {/* Düzenle — yetki + pasif işletmede gizle */}
              {!seciliPasif && canDuzenle && (
                <button
                  onClick={() => setDuzenle(u)}
                  className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 active:scale-90 transition-transform"
                  style={{ background: '#F3F4F6' }}
                >
                  <Pencil className="w-3.5 h-3.5 text-gray-500" />
                </button>
              )}
            </div>
          ))
        )}
      </div>

      {/* ── Stok Düzenle ── */}
      {duzenle && (
        <StokDuzenle
          stok={duzenle}
          onKapat={() => setDuzenle(null)}
          onKaydedildi={(guncellenen) => {
            if (guncellenen?.id) {
              setUrunler(prev => prev.map(u => u.id === guncellenen.id ? guncellenen : u));
              setFiltreliUrunler(prev => prev.map(u => u.id === guncellenen.id ? guncellenen : u));
            } else {
              fetchUrunler(seciliIsletme);
            }
          }}
          onSilindi={(silId) => {
            setUrunler(prev => prev.filter(u => u.id !== silId));
            setFiltreliUrunler(prev => prev.filter(u => u.id !== silId));
            setDuzenle(null);
          }}
        />
      )}

      {/* ── Stok Ekle ── */}
      {ekleAcik && !seciliPasif && (
        <StokEkle
          isletmeler={isletmeler.filter(i => i.aktif !== false)}
          isletmeId={seciliIsletme}
          onKapat={() => setEkleAcik(false)}
          onKaydedildi={(yeni) => {
            if (yeni?.id) {
              const liste = [...urunler, yeni].sort((a, b) =>
                a.urun_adi.localeCompare(b.urun_adi, 'tr')
              );
              setUrunler(liste);
              setFiltreliUrunler(liste);
            } else {
              fetchUrunler(seciliIsletme);
            }
          }}
        />
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
                const secili  = seciliIsletme === ist.id;
                const isPasif = ist.aktif === false;
                return (
                  <button
                    key={ist.id}
                    onClick={() => { setSeciliIsletme(ist.id); setAramaStr(''); setPicker(false); }}
                    className="w-full flex items-center gap-4 p-4 rounded-2xl transition-colors active:scale-[0.98]"
                    style={{
                      background: secili ? (isPasif ? '#FEF2F2' : PL) : '#F9FAFB',
                      border: secili
                        ? `1.5px solid ${isPasif ? 'rgba(220,38,38,0.25)' : 'rgba(108,83,245,0.25)'}`
                        : '1.5px solid transparent',
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
                          <span className="flex-shrink-0 text-[9px] font-black px-1.5 py-0.5 rounded-full"
                            style={{ background: '#FEE2E2', color: '#DC2626' }}>
                            PASİF
                          </span>
                        )}
                      </div>
                      {ist.kod && <p className="text-xs text-gray-400 mt-0.5">{ist.kod}</p>}
                    </div>
                    {secili && (
                      <div
                        className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ background: isPasif ? '#DC2626' : P }}
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
