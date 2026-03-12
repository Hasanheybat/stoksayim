import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2, Building, Warehouse, Package,
  ClipboardList, ClipboardPlus, RefreshCw, Check,
} from 'lucide-react';
import api from '../../lib/api';
import useAuthStore from '../../store/authStore';

/* ── Renkler ── */
const P   = '#6c53f5';
const PL  = 'rgba(108,83,245,0.10)';
const GRN = '#10b981';

/* ── Grid kartları (tüm olası) ── */
const TUM_GRID = [
  { icon: Building2,     label: 'İşletmeler', action: 'isletmeler',          badge: '✓', bc: GRN, yetki: null },
  { icon: Package,       label: 'Stoklar',    to: '/app/stoklar',            badge: '✓', bc: GRN, yetki: ['urun',  'goruntule'] },
  { icon: ClipboardList, label: 'Sayımlar',   to: '/app/sayimlar',           badge: '✓', bc: GRN, yetki: ['sayim', 'goruntule'] },
  { icon: Warehouse,     label: 'Depolar',    to: '/app/depolar',            badge: '✓', bc: GRN, yetki: ['depo',  'goruntule'] },
];

/* ── Kart ortak stili ── */
const CARD = {
  background: '#ffffff',
  borderRadius: 28,
  border: '1px solid rgba(255,255,255,0.9)',
  boxShadow: '0 2px 14px rgba(0,0,0,0.06)',
};

export default function AnaPage() {
  const navigate                   = useNavigate();
  const { kullanici, hasYetki }    = useAuthStore();

  // Kullanıcının yetkisine göre görünecek kartlar
  const GRID = TUM_GRID.filter(b =>
    !b.yetki || hasYetki(b.yetki[0], b.yetki[1])
  );

  const [loading,   setLoading]   = useState(false);
  const [syncState, setSyncState] = useState('idle');
  const [syncStats, setSyncStats] = useState({ sayimlar: 0, urunler: 0, depolar: 0 });

  /* ── İşletmeler popup ── */
  const [isletmePopup, setIsletmePopup]   = useState(false);
  const [isletmeler,   setIsletmeler]     = useState([]);
  const [isletmeYuk,   setIsletmeYuk]     = useState(false);

  /* ── İşletmeleri getir & popup aç ── */
  const handleIsletmeler = async () => {
    setIsletmePopup(true);
    setIsletmeYuk(true);
    const { data } = await supabase
      .from('kullanici_isletme')
      .select('isletmeler(id, ad, kod, aktif)')
      .eq('kullanici_id', kullanici.id)
      .eq('aktif', true);
    setIsletmeler((data || []).map(k => k.isletmeler).filter(i => i?.aktif === true));
    setIsletmeYuk(false);
  };

  /* ── Güncelle ── */
  const handleGuncelle = async () => {
    if (loading) return;
    setLoading(true);
    setSyncState('loading');
    try {
      const { data: stats } = await api.get('/profil/stats');
      setSyncStats({ sayimlar: stats?.sayimlar ?? 0, urunler: stats?.urunler ?? 0, depolar: stats?.depolar ?? 0 });
      setSyncState('done');
      setTimeout(() => setSyncState('idle'), 3500);
    } catch {
      setSyncState('idle');
    } finally {
      setLoading(false);
    }
  };

  const isDone    = syncState === 'done';
  const isLoading = syncState === 'loading';

  const iconBg    = isDone ? GRN : P;
  const iconGlow  = isDone
    ? '0 4px 14px rgba(16,185,129,0.38)'
    : '0 4px 14px rgba(108,83,245,0.35)';
  const dotColor  = isLoading ? '#f59e0b' : GRN;
  const dotGlow   = isLoading
    ? '0 0 0 4px rgba(245,158,11,0.18)'
    : '0 0 0 4px rgba(16,185,129,0.18)';

  return (
    <>
      <style>{`
        @keyframes cardPress {
          to { transform: scale(0.96); }
        }
        .g-card:active { transform: scale(0.96); background-color: #f9fafb !important; }
      `}</style>

      <div className="space-y-4">

        {/* ════ Güncelle Kartı ════ */}
        <button
          onClick={handleGuncelle}
          disabled={isLoading}
          className="g-card w-full p-5 flex items-center justify-between transition-transform duration-150"
          style={CARD}
        >
          <div className="flex items-center gap-4">

            {/* İkon kutu */}
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{
                background: iconBg,
                boxShadow: iconGlow,
                transition: 'background 0.35s, box-shadow 0.35s',
              }}
            >
              {isDone
                ? <Check  className="w-6 h-6 text-white" strokeWidth={2.5} />
                : <RefreshCw className={`w-6 h-6 text-white ${isLoading ? 'animate-spin' : ''}`} />
              }
            </div>

            {/* Metin */}
            <div className="text-left">
              <p className="font-bold text-gray-800 text-sm leading-tight">
                {isLoading ? 'Güncelleniyor...'
                 : isDone  ? 'Tamamlandı!'
                 :            'Verileri Güncelle'}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                {isLoading
                  ? 'Lütfen bekleyin'
                  : isDone
                    ? `${syncStats.sayimlar} sayım · ${syncStats.urunler} ürün · ${syncStats.depolar} depo`
                    : 'Tüm verileri senkronize et'}
              </p>
            </div>
          </div>

          {/* Durum noktası */}
          <div
            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
            style={{
              background: dotColor,
              boxShadow: dotGlow,
              transition: 'background 0.3s, box-shadow 0.3s',
            }}
          />
        </button>

        {/* ════ 2-Kolon Grid ════ */}
        <div className="grid grid-cols-2 gap-4">
          {GRID.map((b) => (
            <button
              key={b.label}
              onClick={() => b.action === 'isletmeler' ? handleIsletmeler() : navigate(b.to)}
              className="g-card p-6 flex flex-col items-center text-center transition-transform duration-150"
              style={CARD}
            >
              {/* İkon + badge */}
              <div className="relative mb-3">
                <div
                  className="w-16 h-16 rounded-[20px] flex items-center justify-center"
                  style={{ background: PL }}
                >
                  <b.icon className="w-8 h-8" style={{ color: P }} strokeWidth={1.75} />
                </div>
                <div
                  className="absolute -top-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center
                              text-[11px] font-black text-white"
                  style={{ background: b.bc, border: '2px solid white' }}
                >
                  {b.badge}
                </div>
              </div>
              <span className="font-bold text-gray-700 text-sm">{b.label}</span>
            </button>
          ))}
        </div>

      </div>

      {/* ════ İşletmeler Bottom Sheet ════ */}
      {isletmePopup && (
        <div
          className="fixed inset-0 z-50 flex flex-col justify-end"
          style={{ background: 'rgba(0,0,0,0.45)' }}
          onClick={e => e.target === e.currentTarget && setIsletmePopup(false)}
        >
          <div className="bg-white rounded-t-3xl px-5 pt-5 pb-10 max-h-[75vh] flex flex-col">

            {/* Handle */}
            <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-4" />

            {/* Başlık */}
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center"
                  style={{ background: PL }}
                >
                  <Building2 className="w-4 h-4" style={{ color: P }} />
                </div>
                <h3 className="text-base font-black text-gray-800">İşletmelerim</h3>
              </div>
              <button
                onClick={() => setIsletmePopup(false)}
                className="w-7 h-7 rounded-full flex items-center justify-center bg-gray-100 text-gray-500 font-bold text-sm"
              >
                ✕
              </button>
            </div>

            {/* İçerik */}
            <div className="overflow-y-auto space-y-3 flex-1">
              {isletmeYuk ? (
                <div className="flex items-center justify-center py-12">
                  <div
                    className="w-7 h-7 border-[3px] rounded-full animate-spin"
                    style={{ borderColor: P, borderTopColor: 'transparent' }}
                  />
                </div>
              ) : isletmeler.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                  <Building2 className="w-10 h-10 mb-2 opacity-25" />
                  <p className="text-sm font-medium">Atanmış işletme bulunamadı</p>
                </div>
              ) : (
                isletmeler.map((ist, i) => (
                  <div
                    key={ist.id}
                    className="flex items-center gap-4 p-4 rounded-2xl"
                    style={{ background: '#f8f7ff', border: '1px solid rgba(108,83,245,0.08)' }}
                  >
                    {/* Numara */}
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 font-black text-sm text-white"
                      style={{ background: `linear-gradient(135deg,${P},#8b5cf6)` }}
                    >
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-gray-800 text-sm truncate">{ist.ad}</p>
                      {ist.kod && (
                        <p className="text-xs text-gray-400 mt-0.5">{ist.kod}</p>
                      )}
                    </div>
                    {/* Aktif dot */}
                    <div
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ background: GRN, boxShadow: '0 0 0 3px rgba(16,185,129,0.18)' }}
                    />
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
