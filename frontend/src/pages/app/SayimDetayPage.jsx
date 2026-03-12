import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ChevronLeft, Plus, X, CheckCircle, Info, Pencil, Trash2, Share2, FileSpreadsheet, FileText } from 'lucide-react';
import api from '../../lib/api';
import useAuthStore from '../../store/authStore';
import toast from 'react-hot-toast';

const P  = '#6c53f5';
const PL = 'rgba(108,83,245,0.10)';

/* HTML injection'a karşı güvenli escape */
const esc = (s) => String(s ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#039;');

/* ════════════════════════════════════════
   Hesap Makinesi
════════════════════════════════════════ */
function Hesap({ mevcut, onKapat, onEkle }) {
  const [ifade, setIfade] = useState(mevcut || '');
  const [sonuc, setSonuc] = useState(null);

  const tus = (v) => {
    if (sonuc !== null) {
      if (/[0-9.]/.test(v)) { setIfade(v); setSonuc(null); }
      else                   { setIfade(sonuc + v); setSonuc(null); }
      return;
    }
    setIfade(p => p + v);
  };

  const sil      = () => { if (sonuc !== null) { setIfade(''); setSonuc(null); return; } setIfade(p => p.slice(0, -1)); };
  const temizle  = () => { setIfade(''); setSonuc(null); };

  const hesapla = () => {
    if (!ifade) return;
    try {
      // eslint-disable-next-line no-new-func
      const r = Function('"use strict"; return (' + ifade.replace(/×/g, '*').replace(/÷/g, '/') + ')')();
      if (!isFinite(r) || isNaN(r)) { toast.error('Geçersiz işlem'); return; }
      setSonuc(parseFloat(r.toFixed(8)).toString());
    } catch { toast.error('Geçersiz işlem'); }
  };

  const sayimaEkle = () => {
    let val;
    if (sonuc !== null) { val = sonuc; }
    else if (ifade) {
      try {
        // eslint-disable-next-line no-new-func
        const r = Function('"use strict"; return (' + ifade.replace(/×/g, '*').replace(/÷/g, '/') + ')')();
        val = isFinite(r) && !isNaN(r) ? parseFloat(r.toFixed(8)).toString() : ifade;
      } catch { val = ifade; }
    } else { val = '0'; }
    onEkle(val);
  };

  const mainText = sonuc !== null ? sonuc : (ifade || '0');
  const subText  = sonuc !== null ? ifade + ' =' : '';

  const ROWS = [
    ['7', '8', '9', '÷'],
    ['4', '5', '6', '×'],
    ['1', '2', '3', '-'],
    ['.', '0', '⌫', '+'],
  ];

  return (
    <div
      className="fixed inset-0 z-[70] flex flex-col justify-end"
      style={{ background: 'rgba(0,0,0,0.5)' }}
      onClick={e => e.target === e.currentTarget && onKapat()}
    >
      <div className="bg-white rounded-t-3xl pb-8">
        <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mt-4 mb-4" />

        {/* Ekran */}
        <div
          className="mx-4 mb-4 px-5 py-4 rounded-2xl bg-gray-50 border border-gray-100 text-right"
          style={{ minHeight: 88 }}
        >
          <p className="text-xs text-gray-400 h-5 leading-5">{subText}</p>
          <p className="text-3xl font-black text-gray-800 leading-none mt-1 break-all">{mainText}</p>
        </div>

        {/* Tuş Takımı */}
        <div className="px-4 space-y-2">
          {ROWS.map((row, ri) => (
            <div key={ri} className="grid grid-cols-4 gap-2">
              {row.map(t => (
                <button
                  key={t}
                  onPointerDown={() => t === '⌫' ? sil() : tus(t)}
                  className="h-[56px] rounded-2xl flex items-center justify-center font-bold active:scale-95 transition-transform select-none"
                  style={{
                    background: /[+\-×÷]/.test(t) ? PL : t === '⌫' ? '#FEF2F2' : '#F3F4F6',
                    color:      /[+\-×÷]/.test(t) ? P   : t === '⌫' ? '#EF4444' : '#1F2937',
                    fontSize:   /[0-9.]/.test(t) ? '20px' : '18px',
                  }}
                >
                  {t}
                </button>
              ))}
            </div>
          ))}

          {/* C  =  Sayıma Ekle */}
          <div className="grid grid-cols-3 gap-2">
            <button
              onPointerDown={temizle}
              className="h-[56px] rounded-2xl flex items-center justify-center font-bold text-xl active:scale-95 transition-transform"
              style={{ background: '#FEF2F2', color: '#EF4444' }}
            >C</button>
            <button
              onPointerDown={hesapla}
              className="h-[56px] rounded-2xl flex items-center justify-center font-bold text-2xl active:scale-95 transition-transform"
              style={{ background: P, color: 'white' }}
            >=</button>
            <button
              onPointerDown={sayimaEkle}
              className="h-[56px] rounded-2xl flex items-center justify-center font-black text-[11px] leading-tight text-center active:scale-95 transition-transform px-2"
              style={{ background: 'linear-gradient(135deg,#10B981,#059669)', color: 'white' }}
            >Sayıma<br />Ekle</button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════
   Ana Sayfa
════════════════════════════════════════ */
export default function SayimDetayPage() {
  const { sayimId }                      = useParams();
  const navigate                         = useNavigate();
  const location                         = useLocation();
  const { kullanici, isletmeYetkisi }    = useAuthStore();

  const [sayim,        setSayim]        = useState(null);
  const [yukleniyor,   setYukleniyor]   = useState(true);
  const [kalemler,      setKalemler]      = useState([]);
  const [tamamlaniyor,  setTamamlaniyor]  = useState(false);
  const [bilgiAcik,     setBilgiAcik]     = useState(false);
  const [duzenleKalem,  setDuzenleKalem]  = useState(null);
  const [duzenleMiktar, setDuzenleMiktar] = useState('');
  const [duzenleHesap,  setDuzenleHesap]  = useState(false);
  const [guncelleniyor, setGuncelleniyor] = useState(false);
  const [silOnay,       setSilOnay]       = useState(null); // kalem id
  const [paylasAcik,    setPaylasAcik]    = useState(false);
  const [tamamlaOnay,   setTamamlaOnay]   = useState(false);

  // Yetki hesapları — sayım yüklendikten sonra isletme_id belli olur
  const canDuzenle = sayim ? isletmeYetkisi(sayim.isletme_id, 'sayim', 'duzenle') : false;
  const canSil     = sayim ? isletmeYetkisi(sayim.isletme_id, 'sayim', 'sil')     : false;
  const canEkle    = sayim ? isletmeYetkisi(sayim.isletme_id, 'sayim', 'ekle')    : false;

  useEffect(() => { if (sayimId) fetchSayim(); }, [sayimId]); // eslint-disable-line react-hooks/exhaustive-deps
  /* Ürün ekleme sayfasından döndüğünde kalemler yenile */
  useEffect(() => {
    if (sayimId && location.pathname === `/app/sayim/${sayimId}`) fetchKalemler();
  }, [location.pathname]); // eslint-disable-line react-hooks/exhaustive-deps


  /* ── Veri ── */
  const fetchSayim = async () => {
    setYukleniyor(true);
    try {
      const { data } = await api.get(`/sayimlar/${sayimId}`);
      // Kalemler embedded olarak geliyor — ayrı tutuyoruz
      const { sayim_kalemleri, ...sayimData } = data;
      setSayim(sayimData);
      // Backend created_at ASC döndürüyor, UI'da yeniden ekleneni üstte göster
      setKalemler((sayim_kalemleri || []).slice().reverse());
    } catch (err) {
      toast.error(err.response?.data?.hata || 'Sayım yüklenemedi.');
    }
    setYukleniyor(false);
  };

  const fetchKalemler = async () => {
    try {
      const { data } = await api.get(`/sayimlar/${sayimId}/kalemler`);
      // Backend created_at ASC döndürüyor — ters çevir
      setKalemler((data || []).slice().reverse());
    } catch {
      // Sessiz hata — sayfa çökmez
    }
  };


  const handleKalemSil = async (kalemId) => {
    try {
      await api.delete(`/sayimlar/${sayimId}/kalem/${kalemId}`);
      setKalemler(prev => prev.filter(k => k.id !== kalemId));
      setDuzenleKalem(null);
      toast.success('Kalem silindi.');
    } catch (err) {
      toast.error(err.response?.data?.hata || 'Kalem silinemedi.');
    }
  };

  const handleGuncelle = async (kalemId, yeniMiktar) => {
    if (!yeniMiktar) { toast.error('Miktar girin.'); return; }
    setGuncelleniyor(true);
    try {
      await api.put(`/sayimlar/${sayimId}/kalem/${kalemId}`, { miktar: parseFloat(yeniMiktar) });
      setKalemler(prev => prev.map(k => k.id === kalemId ? { ...k, miktar: parseFloat(yeniMiktar) } : k));
      setDuzenleKalem(null);
      setDuzenleMiktar('');
      toast.success('Miktar güncellendi.');
    } catch (err) {
      toast.error(err.response?.data?.hata || 'Güncelleme başarısız.');
    }
    setGuncelleniyor(false);
  };

  const handleTamamla = async () => {
    if (kalemler.length === 0) { toast.error('Sayıma en az 1 ürün ekleyin.'); return; }
    setTamamlaniyor(true);
    try {
      await api.put(`/sayimlar/${sayimId}/tamamla`);
      toast.success('Sayım tamamlandı!');
      navigate(-1);
    } catch (err) {
      toast.error(err.response?.data?.hata || 'Sayım tamamlanamadı.');
    }
    setTamamlaniyor(false);
  };

  /* ── Paylaş ── */
  const dosyaAdi = () => {
    const depo = (sayim?.depolar?.ad || 'depo').replace(/[^a-zA-Z0-9ğüşıöçĞÜŞİÖÇ\s]/g, '').trim().replace(/\s+/g, '-');
    const id   = sayimId?.split('-')[0]?.toUpperCase() || '';
    return `${depo}-${id}`;
  };

  const handleExcel = async () => {
    const isletmeAd = sayim?.isletmeler?.ad || '';
    const depoAd    = sayim?.depolar?.ad    || '';
    const tarih     = sayim?.tarih          || '';
    const kisiler   = Array.isArray(sayim?.kisiler) ? sayim.kisiler.join(', ') : '—';

    const satirlar = [
      [`İşletme: ${isletmeAd}`, `Depo: ${depoAd}`, `Tarih: ${tarih}`, `Sayım Yapanlar: ${kisiler}`],
      [],
      ['#', 'Ürün Adı', 'İsim 2', 'Ürün Kodu', 'Birim', 'Miktar'],
      ...kalemler.map((k, i) => [
        i + 1,
        k.isletme_urunler?.urun_adi  || '',
        k.isletme_urunler?.isim_2    || '',
        k.isletme_urunler?.urun_kodu || '',
        k.birim   || '',
        k.miktar  ?? '',
      ]),
    ];

    const BOM  = '\uFEFF';
    const csv  = BOM + satirlar
      .map(row => row.map(c => `"${String(c).replace(/"/g, '""')}"`).join(';'))
      .join('\r\n');
    const ad   = `${dosyaAdi()}.csv`;
    const file = new File([csv], ad, { type: 'text/csv;charset=utf-8;' });

    try {
      await navigator.share({ files: [file], title: ad });
    } catch (e) {
      if (e?.name !== 'AbortError') {
        const url = URL.createObjectURL(file);
        const a   = document.createElement('a');
        a.href = url; a.download = ad; a.click();
        URL.revokeObjectURL(url);
        toast.success('Excel dosyası indirildi.');
      }
    }
    setPaylasAcik(false);
  };

  const handlePDF = async () => {
    const isletmeAd = sayim?.isletmeler?.ad || '';
    const depoAd    = sayim?.depolar?.ad    || '';
    const tarih     = sayim?.tarih          || '';
    const kisiler   = Array.isArray(sayim?.kisiler) ? sayim.kisiler.join(', ') : '—';

    const satirlar = kalemler.map((k, i) => `
      <tr>
        <td>${i + 1}</td>
        <td>${esc(k.isletme_urunler?.urun_adi)  || '—'}</td>
        <td>${esc(k.isletme_urunler?.isim_2)    || ''}</td>
        <td>${esc(k.isletme_urunler?.urun_kodu) || ''}</td>
        <td>${esc(k.birim)}</td>
        <td><b>${esc(k.miktar)}</b></td>
      </tr>`).join('');

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${esc(dosyaAdi())}</title>
    <style>
      body{font-family:Arial,sans-serif;font-size:12px;margin:24px;color:#1f2937}
      h2{color:#6c53f5;margin:0 0 12px}
      .info{display:grid;grid-template-columns:1fr 1fr;gap:8px;padding:12px;background:#f9fafb;border-radius:8px;margin-bottom:16px}
      .lbl{font-size:10px;color:#9ca3af;font-weight:700;text-transform:uppercase;margin-bottom:2px}
      .val{font-size:13px;font-weight:700}
      table{width:100%;border-collapse:collapse}
      th{background:#6c53f5;color:#fff;padding:8px;text-align:left;font-size:11px}
      td{padding:7px 8px;border-bottom:1px solid #f3f4f6;font-size:11px}
      tr:nth-child(even){background:#f9fafb}
      .foot{margin-top:12px;font-size:11px;color:#6c53f5;font-weight:700}
    </style></head><body>
    <h2>Sayım Raporu</h2>
    <div class="info">
      <div><div class="lbl">İşletme</div><div class="val">${esc(isletmeAd)}</div></div>
      <div><div class="lbl">Depo</div><div class="val">${esc(depoAd)}</div></div>
      <div><div class="lbl">Tarih</div><div class="val">${esc(tarih)}</div></div>
      <div><div class="lbl">Sayım Yapanlar</div><div class="val">${esc(kisiler)}</div></div>
    </div>
    <table>
      <thead><tr><th>#</th><th>Ürün Adı</th><th>İsim 2</th><th>Ürün Kodu</th><th>Birim</th><th>Miktar</th></tr></thead>
      <tbody>${satirlar}</tbody>
    </table>
    <p class="foot">Toplam: ${kalemler.length} kalem</p>
    </body></html>`;

    const ad   = `${dosyaAdi()}.pdf`;
    const file = new File([html], ad, { type: 'text/html' });

    try {
      await navigator.share({ files: [file], title: ad });
    } catch (e) {
      if (e?.name !== 'AbortError') {
        const url = URL.createObjectURL(new Blob([html], { type: 'text/html' }));
        window.open(url, '_blank');
      }
    }
    setPaylasAcik(false);
  };

  /* ── Yükleniyor ── */
  if (yukleniyor) return (
    <div className="flex items-center justify-center" style={{ height: 'calc(100vh - 56px - 44px)' }}>
      <div className="w-8 h-8 border-[3px] rounded-full animate-spin" style={{ borderColor: P, borderTopColor: 'transparent' }} />
    </div>
  );

  const isletmePasif = sayim?.isletmeler?.aktif === false;
  const devam        = sayim?.durum === 'devam' && !isletmePasif;
  const tarihStr = sayim?.tarih
    ? new Date(sayim.tarih).toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric' })
    : '—';

  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 56px - 44px)', overflow: 'hidden' }}>

      {/* ── Üst Bar ── */}
      <div className="bg-white px-3 py-2.5 flex items-center gap-2" style={{ borderBottom: '1px solid #F3F4F6' }}>
        <button
          onClick={() => navigate(-1)}
          className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: '#F3F4F6' }}
        >
          <ChevronLeft className="w-5 h-5 text-gray-600" />
        </button>

        <p className="flex-1 text-sm font-black text-gray-800 truncate min-w-0">{sayim?.ad || 'Sayım'}</p>

        {/* Bilgi ikonu */}
        <button
          onClick={() => setBilgiAcik(true)}
          className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: '#F3F4F6' }}
        >
          <Info className="w-4 h-4 text-gray-500" />
        </button>

        {/* Paylaş */}
        <button
          onClick={() => setPaylasAcik(true)}
          className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: '#F3F4F6' }}
        >
          <Share2 className="w-4 h-4 text-gray-500" />
        </button>

        {/* Tamamla — devam + duzenle yetkisi */}
        {devam && canDuzenle && (
          <button
            onClick={() => { if (kalemler.length === 0) { toast.error('Sayıma en az 1 ürün ekleyin.'); return; } setTamamlaOnay(true); }}
            disabled={tamamlaniyor}
            className="flex items-center gap-1 px-3 h-8 rounded-xl text-xs font-bold flex-shrink-0 active:scale-95 transition-transform disabled:opacity-40"
            style={{ background: '#ECFDF5', color: '#059669' }}
          >
            <CheckCircle className="w-3.5 h-3.5" />
            Tamamla
          </button>
        )}

        {/* Ürün Ekle — devam + ekle yetkisi */}
        {devam && canEkle && (
          <button
            onClick={() => navigate(`/app/sayim/${sayimId}/urun-ekle`)}
            className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 active:scale-90 transition-transform"
            style={{ background: `linear-gradient(135deg,${P},#8b5cf6)` }}
          >
            <Plus className="w-4 h-4 text-white" strokeWidth={2.5} />
          </button>
        )}
      </div>

      {/* ── Pasif İşletme Uyarı Bandı ── */}
      {isletmePasif && (
        <div className="px-4 py-2.5 flex items-center gap-2"
          style={{ background: '#FEF2F2', borderBottom: '1px solid #FECACA' }}>
          <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: '#DC2626' }} />
          <p className="text-xs font-semibold text-red-600">
            Pasif işletme — sayım yalnızca görüntüleme modunda
          </p>
        </div>
      )}

      {/* ── Kalemler Listesi ── */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
        {kalemler.length === 0 ? (
          <p className="text-center text-sm text-gray-400 py-12">
            {devam ? 'Henüz ürün eklenmedi.' : 'Bu sayımda kalem bulunmuyor.'}
          </p>
        ) : (
          kalemler.map(k => (
            <div
              key={k.id}
              className="bg-white rounded-2xl px-4 py-3 flex items-center gap-3"
              style={{ border: '1px solid #F3F4F6' }}
            >
              {/* Sol: ürün bilgileri */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-800 leading-tight truncate">
                  {k.isletme_urunler?.urun_adi || '—'}
                </p>
                {(k.isletme_urunler?.isim_2 || k.isletme_urunler?.urun_kodu) && (
                  <p className="text-[11px] text-gray-400 mt-0.5 truncate">
                    {[k.isletme_urunler.isim_2, k.isletme_urunler.urun_kodu].filter(Boolean).join(' · ')}
                  </p>
                )}
              </div>
              {/* Miktar */}
              <span className="text-sm font-black flex-shrink-0" style={{ color: P }}>
                {k.miktar} <span className="text-[11px] font-semibold text-gray-400">{k.birim}</span>
              </span>
              {/* Düzenle — devam + sayim.duzenle yetkisi */}
              {devam && canDuzenle && (
                <button
                  onClick={() => { setDuzenleKalem(k); setDuzenleMiktar(String(k.miktar)); }}
                  className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 active:scale-90 transition-transform"
                  style={{ background: PL }}
                >
                  <Pencil className="w-3.5 h-3.5" style={{ color: P }} />
                </button>
              )}
            </div>
          ))
        )}
      </div>

      {/* ── Bilgi Bottom Sheet ── */}
      {bilgiAcik && (
        <div
          className="fixed inset-0 z-50 flex flex-col justify-end"
          style={{ background: 'rgba(0,0,0,0.45)' }}
          onClick={e => e.target === e.currentTarget && setBilgiAcik(false)}
        >
          <div className="bg-white rounded-t-3xl px-5 pt-4 pb-10">
            <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-5" />
            <p className="text-sm font-black text-gray-800 mb-4">Sayım Bilgileri</p>
            <div className="space-y-3">
              {[
                { label: 'Ad',            val: sayim?.ad },
                { label: 'Tarih',         val: tarihStr },
                { label: 'Depo',          val: sayim?.depolar?.ad },
                { label: 'Durum',         val: devam ? 'Devam Ediyor' : '✓ Tamamlandı', color: devam ? '#6366F1' : '#059669' },
                { label: 'Toplam Kalem',  val: `${kalemler.length} kalem`, color: P },
              ].map(({ label, val, color }) => (
                <div key={label} className="flex justify-between items-start gap-3">
                  <span className="text-xs text-gray-400 font-semibold flex-shrink-0">{label}</span>
                  <span className="text-xs font-bold text-right" style={{ color: color || '#374151' }}>{val || '—'}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Düzenleme Bottom Sheet ── */}
      {duzenleKalem && (
        <div
          className="fixed inset-0 z-50 flex flex-col justify-end"
          style={{ background: 'rgba(0,0,0,0.45)' }}
          onClick={e => e.target === e.currentTarget && setDuzenleKalem(null)}
        >
          <div className="bg-white rounded-t-3xl pb-8">
            <div className="flex items-center justify-between px-4 pt-4 pb-3" style={{ borderBottom: '1px solid #F3F4F6' }}>
              <p className="text-sm font-black text-gray-800">Kalemi Düzenle</p>
              <button
                onClick={() => setDuzenleKalem(null)}
                className="w-7 h-7 rounded-full flex items-center justify-center"
                style={{ background: '#F3F4F6' }}
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            <div className="px-4 py-4 space-y-4">
              {/* Ürün adı (salt okunur) */}
              <div className="px-4 py-3 rounded-xl bg-gray-50 border border-gray-100">
                <p className="text-[10px] text-gray-400 font-semibold mb-0.5">Ürün</p>
                <p className="text-sm font-bold text-gray-800">{duzenleKalem.isletme_urunler?.urun_adi || '—'}</p>
              </div>

              {/* Miktar */}
              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">Miktar</label>
                <div className="flex items-center gap-2">
                  <div className="px-4 py-3 rounded-xl text-sm font-bold flex-shrink-0 text-center" style={{ background: PL, color: P, minWidth: 76 }}>
                    {duzenleKalem.birim}
                  </div>
                  <button
                    onClick={() => setDuzenleHesap(true)}
                    className="flex-1 px-4 py-3 rounded-xl text-sm border border-gray-200 bg-gray-50 text-left active:bg-gray-100 transition-colors font-bold text-gray-800"
                  >
                    {duzenleMiktar || duzenleKalem.miktar}
                  </button>
                </div>
              </div>
            </div>

            <div className="px-4 pt-0 pb-4 grid grid-cols-2 gap-3">
              {canDuzenle && (
                <button
                  onClick={() => setSilOnay(duzenleKalem.id)}
                  className="py-3.5 rounded-xl font-bold text-sm active:scale-95 transition-transform flex items-center justify-center gap-1.5"
                  style={{ background: '#FEF2F2', color: '#EF4444' }}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Sil
                </button>
              )}
              {canDuzenle && (
                <button
                  onClick={() => handleGuncelle(duzenleKalem.id, duzenleMiktar || String(duzenleKalem.miktar))}
                  disabled={guncelleniyor}
                  className="py-3.5 rounded-xl font-bold text-sm text-white active:scale-95 transition-transform flex items-center justify-center gap-2 disabled:opacity-60"
                  style={{ background: `linear-gradient(135deg,${P},#8b5cf6)` }}
                >
                  {guncelleniyor && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                  Kaydet
                </button>
              )}
            </div>
          </div>
        </div>
      )}


      {/* ── Kalem Silme Onayı ── */}
      {silOnay && (
        <div
          className="fixed inset-0 z-[60] flex flex-col justify-end"
          style={{ background: 'rgba(0,0,0,0.45)' }}
          onClick={e => e.target === e.currentTarget && setSilOnay(null)}
        >
          <div className="bg-white rounded-t-3xl px-5 pt-6 pb-10">
            <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-5" />
            <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: '#FEF2F2' }}>
              <Trash2 className="w-6 h-6 text-red-500" />
            </div>
            <p className="text-center font-black text-gray-800 text-base mb-1.5">Ürünü Sil</p>
            <p className="text-center text-xs text-gray-400 mb-6">
              Bu ürün sayımdan kalıcı olarak silinecek.
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
                onClick={() => { handleKalemSil(silOnay); setSilOnay(null); }}
                className="py-3.5 rounded-xl font-bold text-sm text-white active:scale-95 transition-transform"
                style={{ background: '#EF4444' }}
              >
                Evet, Sil
              </button>
            </div>
          </div>
        </div>
      )}


      {/* ── Tamamla Onay Bottom Sheet ── */}
      {tamamlaOnay && (
        <div
          className="fixed inset-0 z-50 flex flex-col justify-end"
          style={{ background: 'rgba(0,0,0,0.45)' }}
          onClick={e => e.target === e.currentTarget && setTamamlaOnay(false)}
        >
          <div className="bg-white rounded-t-3xl px-5 pt-4 pb-10">
            <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-5" />

            {/* İkon */}
            <div className="flex flex-col items-center text-center mb-6">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-3"
                style={{ background: '#ECFDF5' }}>
                <CheckCircle className="w-8 h-8" style={{ color: '#059669' }} />
              </div>
              <p className="text-base font-black text-gray-800">Sayımı Tamamla</p>
              <p className="text-sm text-gray-400 mt-1">
                Tamamlandıktan sonra ürün ekleyemez veya düzenleyemezsiniz.
              </p>
              <p className="text-sm font-semibold text-gray-600 mt-2">
                {kalemler.length} ürün kaydedilecek.
              </p>
            </div>

            {/* Butonlar */}
            <button
              onClick={async () => { setTamamlaOnay(false); await handleTamamla(); }}
              disabled={tamamlaniyor}
              className="w-full h-12 rounded-2xl font-bold text-sm text-white flex items-center justify-center gap-2 active:scale-95 transition-transform mb-3 disabled:opacity-50"
              style={{ background: '#059669' }}
            >
              {tamamlaniyor
                ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                : <CheckCircle className="w-4 h-4" />
              }
              Evet, Tamamla
            </button>
            <button
              onClick={() => setTamamlaOnay(false)}
              className="w-full h-12 rounded-2xl font-bold text-sm text-gray-600 flex items-center justify-center active:scale-95 transition-transform"
              style={{ background: '#F3F4F6' }}
            >
              Vazgeç
            </button>
          </div>
        </div>
      )}

      {/* ── Paylaş Bottom Sheet ── */}
      {paylasAcik && (
        <div
          className="fixed inset-0 z-50 flex flex-col justify-end"
          style={{ background: 'rgba(0,0,0,0.45)' }}
          onClick={e => e.target === e.currentTarget && setPaylasAcik(false)}
        >
          <div className="bg-white rounded-t-3xl px-5 pt-4 pb-10">
            <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-5" />
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-black text-gray-800">Paylaş / İndir</p>
              <button onClick={() => setPaylasAcik(false)} className="w-7 h-7 rounded-full flex items-center justify-center bg-gray-100">
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            {/* Sayım özeti */}
            <div className="rounded-xl p-3 mb-5 space-y-1" style={{ background: PL }}>
              <p className="text-xs font-bold text-gray-700">{sayim?.isletmeler?.ad || '—'} · {sayim?.depolar?.ad || '—'}</p>
              <p className="text-[11px] text-gray-500">{tarihStr} · {kalemler.length} kalem</p>
              {Array.isArray(sayim?.kisiler) && sayim.kisiler.length > 0 && (
                <p className="text-[11px] text-gray-500">Sayım yapanlar: {sayim.kisiler.join(', ')}</p>
              )}
            </div>

            <div className="space-y-3">
              {/* Excel */}
              <button
                onClick={handleExcel}
                className="w-full flex items-center gap-4 p-4 rounded-2xl active:scale-[0.98] transition-transform"
                style={{ background: '#F0FDF4', border: '1.5px solid #BBF7D0' }}
              >
                <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: '#16A34A' }}>
                  <FileSpreadsheet className="w-5 h-5 text-white" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-bold text-gray-800">Excel (CSV)</p>
                  <p className="text-[11px] text-gray-500 mt-0.5">Tüm veriler Excel'de açılabilir formatta</p>
                </div>
              </button>

              {/* PDF */}
              <button
                onClick={handlePDF}
                className="w-full flex items-center gap-4 p-4 rounded-2xl active:scale-[0.98] transition-transform"
                style={{ background: '#FEF2F2', border: '1.5px solid #FECACA' }}
              >
                <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: '#EF4444' }}>
                  <FileText className="w-5 h-5 text-white" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-bold text-gray-800">PDF / Yazdır</p>
                  <p className="text-[11px] text-gray-500 mt-0.5">Yazdır veya PDF olarak kaydet</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hesap Makinesi – düzenleme */}
      {duzenleHesap && (
        <Hesap
          mevcut={duzenleMiktar}
          onKapat={() => setDuzenleHesap(false)}
          onEkle={val => { setDuzenleMiktar(val); setDuzenleHesap(false); }}
        />
      )}

    </div>
  );
}
