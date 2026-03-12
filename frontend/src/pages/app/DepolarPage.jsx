import { useState, useEffect, useRef } from 'react';
import { Search, Plus, ChevronDown, Building2, Pencil, Warehouse } from 'lucide-react';
import DepoDuzenle from '../../components/app/DepoDuzenle';
import DepoEkle    from '../../components/app/DepoEkle';
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

export default function DepolarPage() {
  const { kullanici, isletmeYetkisi } = useAuthStore();
  const isAdmin = kullanici?.rol === 'admin';

  const [isletmeler,      setIsletmeler]      = useState([]);
  const [seciliIsletme,   setSeciliIsletme]   = useState(null);
  const [depolar,         setDepolar]         = useState([]);
  const [filtreliDepolar, setFiltreliDepolar] = useState([]);
  const [aramaStr,        setAramaStr]        = useState('');
  const [yukleniyor,      setYukleniyor]      = useState(false);
  const [picker,          setPicker]          = useState(false);
  const [duzenle,         setDuzenle]         = useState(null);
  const [ekleAcik,        setEkleAcik]        = useState(false);

  const searchRef = useRef(null);

  useEffect(() => { if (kullanici?.id) fetchIsletmeler(); }, [kullanici?.id]); // eslint-disable-line
  useEffect(() => { if (seciliIsletme) fetchDepolar(seciliIsletme); }, [seciliIsletme]); // eslint-disable-line

  useEffect(() => {
    if (!aramaStr.trim()) { setFiltreliDepolar(depolar); return; }
    const q = aramaStr.toLowerCase();
    setFiltreliDepolar(depolar.filter(d => d.ad.toLowerCase().includes(q)));
  }, [aramaStr, depolar]);

  const fetchIsletmeler = async () => {
    let list = [];
    if (isAdmin) {
      const { data } = await api.get('/isletmeler');
      list = data || [];
    } else {
      const { data } = await api.get('/profil/isletmelerim');
      list = (data || []).filter(i => isletmeYetkisi(i.id, 'depo', 'goruntule'));
    }
    setIsletmeler(list);
    if (list.length > 0) setSeciliIsletme(list[0].id);
  };

  const fetchDepolar = async (isletmeId) => {
    setYukleniyor(true);
    try {
      const { data } = await api.get(`/depolar?isletme_id=${isletmeId}`);
      const list = data?.data || data || [];
      setDepolar(list);
      setFiltreliDepolar(list);
    } catch {
      setDepolar([]);
      setFiltreliDepolar([]);
    }
    setYukleniyor(false);
  };

  const seciliIsletmeObj = isletmeler.find(i => i.id === seciliIsletme);
  const seciliPasif      = seciliIsletmeObj?.aktif === false;
  const canEkle          = seciliIsletme && isletmeYetkisi(seciliIsletme, 'depo', 'ekle');
  const canDuzenle       = seciliIsletme && isletmeYetkisi(seciliIsletme, 'depo', 'duzenle');

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
            onBlur={e  => e.target.style.borderColor = '#E5E7EB'}
          />
        </div>

        {/* Depo Ekle — yetki + pasif kontrolü */}
        {canEkle && (
          <button
            onClick={() => { if (!seciliPasif) setEkleAcik(true); }}
            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 active:scale-90 transition-transform"
            style={{
              background: seciliPasif ? '#E5E7EB' : `linear-gradient(135deg,${P},#8b5cf6)`,
              cursor: seciliPasif ? 'not-allowed' : 'pointer',
            }}
            title={seciliPasif ? 'Pasif işletmeye depo eklenemez' : 'Depo Ekle'}
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
      {!yukleniyor && depolar.length > 0 && (
        <div className="px-4 pt-3 pb-1">
          <p className="text-xs text-gray-400">
            {filtreliDepolar.length} / {depolar.length} depo
            {seciliIsletmeObj && (
              <span className="ml-1.5 font-semibold" style={{ color: P }}>
                · {seciliIsletmeObj.ad}
              </span>
            )}
          </p>
        </div>
      )}

      {/* ── Depo Listesi ── */}
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
        ) : filtreliDepolar.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <Warehouse className="w-12 h-12 mb-3 opacity-30" />
            <p className="text-sm font-semibold">
              {aramaStr ? 'Depo bulunamadı' : 'Henüz depo eklenmemiş'}
            </p>
            {!aramaStr && !seciliPasif && (
              <p className="text-xs mt-1 text-center px-8">
                + butonuna basarak ilk depoyu ekleyin
              </p>
            )}
          </div>
        ) : (
          filtreliDepolar.map((d, i) => (
            <div
              key={d.id}
              className="bg-white rounded-2xl px-4 py-3.5 shadow-sm flex items-center gap-3"
              style={{ border: `1px solid ${seciliPasif ? '#FEE2E2' : '#F3F4F6'}` }}
            >
              {/* Renk ikonu */}
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 font-black text-sm text-white"
                style={{ background: seciliPasif ? '#9CA3AF' : GRADS[i % GRADS.length] }}
              >
                {d.ad.charAt(0).toUpperCase()}
              </div>

              {/* İsim / Konum */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold leading-tight truncate"
                  style={{ color: seciliPasif ? '#9CA3AF' : '#1F2937' }}>{d.ad}</p>
                {d.konum && (
                  <p className="text-xs text-gray-400 truncate mt-0.5">{d.konum}</p>
                )}
              </div>

              {/* Düzenle — yetki + pasif kontrolü */}
              {!seciliPasif && canDuzenle && (
                <button
                  onClick={() => setDuzenle(d)}
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

      {/* ── Depo Düzenle ── */}
      {duzenle && (
        <DepoDuzenle
          depo={duzenle}
          onKapat={() => setDuzenle(null)}
          onKaydedildi={(guncellenen) => {
            if (guncellenen?.id) {
              setDepolar(prev => prev.map(d => d.id === guncellenen.id ? guncellenen : d));
              setFiltreliDepolar(prev => prev.map(d => d.id === guncellenen.id ? guncellenen : d));
            } else {
              fetchDepolar(seciliIsletme);
            }
          }}
          onSilindi={(silId) => {
            setDepolar(prev => prev.filter(d => d.id !== silId));
            setFiltreliDepolar(prev => prev.filter(d => d.id !== silId));
            setDuzenle(null);
          }}
        />
      )}

      {/* ── Depo Ekle ── */}
      {ekleAcik && !seciliPasif && (
        <DepoEkle
          isletmeler={isletmeler.filter(i => i.aktif !== false)}
          isletmeId={seciliIsletme}
          onKapat={() => setEkleAcik(false)}
          onKaydedildi={(yeni) => {
            if (yeni?.isletme_id === seciliIsletme) {
              const liste = [...depolar, yeni].sort((a, b) => a.ad.localeCompare(b.ad, 'tr'));
              setDepolar(liste);
              setFiltreliDepolar(liste);
            } else {
              fetchDepolar(seciliIsletme);
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
                    className="w-full flex items-center gap-4 p-4 rounded-2xl active:scale-[0.98] transition-transform"
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
