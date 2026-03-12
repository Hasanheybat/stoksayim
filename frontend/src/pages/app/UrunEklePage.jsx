import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Camera, X } from 'lucide-react';
import api from '../../lib/api';
import useAuthStore from '../../store/authStore';
import toast from 'react-hot-toast';

const P  = '#6c53f5';
const PL = 'rgba(108,83,245,0.10)';

/* ── Bip sesi ── */
function bipSesi() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1480, ctx.currentTime);
    gain.gain.setValueAtTime(0.4, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.12);
  } catch { /* ses desteklenmiyor */ }
}

/* ════════════════════════════════════════
   Barkod Tarayıcı
════════════════════════════════════════ */
function BarkodTarayici({ isletmeId, onBul, onKapat, sesAcik }) {
  const videoRef  = useRef(null);
  const streamRef = useRef(null);
  const animRef   = useRef(null);
  const destekleniyor = 'BarcodeDetector' in window;
  const [hata, setHata]         = useState('');
  const [araniyor, setAraniyor] = useState(false);

  useEffect(() => {
    if (!destekleniyor) return;
    kameraBaslat();
    return () => {
      streamRef.current?.getTracks().forEach(t => t.stop());
      cancelAnimationFrame(animRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const kameraBaslat = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      streamRef.current = stream;
      if (videoRef.current) { videoRef.current.srcObject = stream; await videoRef.current.play(); taramaDongusu(); }
    } catch { setHata('Kamera erişimi sağlanamadı. Lütfen izin verin.'); }
  };

  const taramaDongusu = async () => {
    const detector = new window.BarcodeDetector({ formats: ['ean_13','ean_8','code_128','code_39','upc_a','upc_e','qr_code'] });
    const tara = async () => {
      if (!videoRef.current || videoRef.current.paused || videoRef.current.ended) return;
      try {
        const barkodlar = await detector.detect(videoRef.current);
        if (barkodlar.length > 0) {
          cancelAnimationFrame(animRef.current);
          streamRef.current?.getTracks().forEach(t => t.stop());
          if (sesAcik) bipSesi();
          setAraniyor(true);
          const deger = barkodlar[0].rawValue;
          try {
            const { data } = await api.get(`/urunler/barkod/${encodeURIComponent(deger)}?isletme_id=${isletmeId}`);
            setAraniyor(false);
            onBul(data);
          } catch {
            setAraniyor(false);
            toast.error(`"${deger}" barkoduna ait ürün bulunamadı.`);
            onKapat();
          }
          return;
        }
      } catch { /* sessizce geç */ }
      animRef.current = requestAnimationFrame(tara);
    };
    animRef.current = requestAnimationFrame(tara);
  };

  if (!destekleniyor) return (
    <div className="fixed inset-0 z-[80] flex flex-col justify-end" style={{ background: 'rgba(0,0,0,0.5)' }} onClick={e => e.target === e.currentTarget && onKapat()}>
      <div className="bg-white rounded-t-3xl px-5 pt-5 pb-10">
        <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-5" />
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: PL }}><Camera className="w-7 h-7" style={{ color: P }} /></div>
        <p className="text-center text-sm font-semibold text-gray-700 mb-1">Barkod tarayıcı desteklenmiyor</p>
        <p className="text-center text-xs text-gray-400 mb-5">Bu tarayıcı barkod okumayı desteklemiyor.<br />Ürün adıyla arama yapabilirsiniz.</p>
        <button onClick={onKapat} className="w-full py-3 rounded-xl font-bold text-sm" style={{ background: '#F3F4F6', color: '#6B7280' }}>Kapat</button>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[80] bg-black flex flex-col">
      <div className="flex items-center justify-between px-4 pb-3" style={{ paddingTop: 52, background: 'rgba(0,0,0,0.7)' }}>
        <p className="text-white font-bold text-sm">Barkod Okut</p>
        <button onClick={onKapat} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.2)' }}><X className="w-4 h-4 text-white" /></button>
      </div>
      <div className="flex-1 relative overflow-hidden">
        {hata ? (
          <div className="flex flex-col items-center justify-center h-full gap-4 px-8">
            <Camera className="w-12 h-12 text-white/40" />
            <p className="text-white text-center text-sm">{hata}</p>
            <button onClick={onKapat} className="px-6 py-2.5 rounded-xl font-bold text-sm text-white" style={{ background: 'rgba(255,255,255,0.2)' }}>Kapat</button>
          </div>
        ) : (
          <>
            <video ref={videoRef} className="absolute inset-0 w-full h-full object-cover" muted playsInline autoPlay />
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-72 h-36 rounded-2xl relative" style={{ boxShadow: '0 0 0 9999px rgba(0,0,0,0.5)' }}>
                {['top-0 left-0 border-t-2 border-l-2','top-0 right-0 border-t-2 border-r-2','bottom-0 left-0 border-b-2 border-l-2','bottom-0 right-0 border-b-2 border-r-2'].map((cls,i) => (
                  <div key={i} className={`absolute w-7 h-7 border-white rounded-sm ${cls}`} />
                ))}
              </div>
            </div>
            <div className="absolute bottom-10 left-0 right-0 flex justify-center pointer-events-none">
              <p className="text-white/70 text-xs">Barkodu çerçeve içine getirin</p>
            </div>
            {araniyor && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3" style={{ background: 'rgba(0,0,0,0.65)' }}>
                <div className="w-10 h-10 border-[3px] border-white border-t-transparent rounded-full animate-spin" />
                <p className="text-white text-sm font-semibold">Ürün aranıyor...</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════
   Hesap Makinesi
════════════════════════════════════════ */
function Hesap({ mevcut, onKapat, onEkle }) {
  const [ifade, setIfade] = useState(mevcut || '');
  const [sonuc, setSonuc] = useState(null);
  const tus = (v) => { if (sonuc !== null) { if (/[0-9.]/.test(v)) { setIfade(v); setSonuc(null); } else { setIfade(sonuc + v); setSonuc(null); } return; } setIfade(p => p + v); };
  const sil = () => { if (sonuc !== null) { setIfade(''); setSonuc(null); return; } setIfade(p => p.slice(0,-1)); };
  const temizle = () => { setIfade(''); setSonuc(null); };
  const hesapla = () => {
    if (!ifade) return;
    try {
      // eslint-disable-next-line no-new-func
      const r = Function('"use strict"; return (' + ifade.replace(/×/g,'*').replace(/÷/g,'/') + ')')();
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
        const r = Function('"use strict"; return (' + ifade.replace(/×/g,'*').replace(/÷/g,'/') + ')')();
        val = isFinite(r) && !isNaN(r) ? parseFloat(r.toFixed(8)).toString() : ifade;
      } catch { val = ifade; }
    } else { val = '0'; }
    onEkle(val);
  };
  const mainText = sonuc !== null ? sonuc : (ifade || '0');
  const subText  = sonuc !== null ? ifade + ' =' : '';
  const ROWS = [['7','8','9','÷'],['4','5','6','×'],['1','2','3','-'],['.','0','⌫','+']];
  return (
    <div className="fixed inset-0 z-[70] flex flex-col justify-end" style={{ background: 'rgba(0,0,0,0.5)' }} onClick={e => e.target === e.currentTarget && onKapat()}>
      <div className="bg-white rounded-t-3xl pb-8">
        <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mt-4 mb-4" />
        <div className="mx-4 mb-4 px-5 py-4 rounded-2xl bg-gray-50 border border-gray-100 text-right" style={{ minHeight: 88 }}>
          <p className="text-xs text-gray-400 h-5 leading-5">{subText}</p>
          <p className="text-3xl font-black text-gray-800 leading-none mt-1 break-all">{mainText}</p>
        </div>
        <div className="px-4 space-y-2">
          {ROWS.map((row,ri) => (
            <div key={ri} className="grid grid-cols-4 gap-2">
              {row.map(t => (
                <button key={t} onPointerDown={() => t === '⌫' ? sil() : tus(t)}
                  className="h-[56px] rounded-2xl flex items-center justify-center font-bold active:scale-95 transition-transform select-none"
                  style={{ background: /[+\-×÷]/.test(t) ? PL : t === '⌫' ? '#FEF2F2' : '#F3F4F6', color: /[+\-×÷]/.test(t) ? P : t === '⌫' ? '#EF4444' : '#1F2937', fontSize: /[0-9.]/.test(t) ? '20px' : '18px' }}
                >{t}</button>
              ))}
            </div>
          ))}
          <div className="grid grid-cols-3 gap-2">
            <button onPointerDown={temizle} className="h-[56px] rounded-2xl flex items-center justify-center font-bold text-xl active:scale-95 transition-transform" style={{ background: '#FEF2F2', color: '#EF4444' }}>C</button>
            <button onPointerDown={hesapla} className="h-[56px] rounded-2xl flex items-center justify-center font-bold text-2xl active:scale-95 transition-transform" style={{ background: P, color: 'white' }}>=</button>
            <button onPointerDown={sayimaEkle} className="h-[56px] rounded-2xl flex items-center justify-center font-black text-[11px] leading-tight text-center active:scale-95 transition-transform px-2" style={{ background: 'linear-gradient(135deg,#10B981,#059669)', color: 'white' }}>Sayıma<br/>Ekle</button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════
   Öneri Dropdown
════════════════════════════════════════ */
function OnerilerDropdown({ oneriler, bos, onSec }) {
  return (
    <div className="absolute left-0 right-0 z-20 bg-white rounded-2xl shadow-lg overflow-hidden" style={{ top: 'calc(100% + 4px)', border: '1px solid #E5E7EB', maxHeight: 200, overflowY: 'auto' }}>
      {bos ? (
        <div className="px-4 py-3 text-center"><p className="text-xs text-gray-400">Ürün bulunamadı.</p><p className="text-[10px] text-gray-300 mt-0.5">Farklı bir kelime deneyin.</p></div>
      ) : oneriler.map((u, i) => (
        <button key={i} onMouseDown={e => { e.preventDefault(); onSec(u); }}
          className="w-full text-left px-4 py-3 active:bg-gray-50 transition-colors"
          style={{ borderBottom: i < oneriler.length - 1 ? '1px solid #F3F4F6' : 'none' }}
        >
          <p className="text-sm font-bold text-gray-800 leading-tight">{u.urun_adi}</p>
          {(u.isim_2 || u.urun_kodu || u.birim) && (
            <p className="text-xs text-gray-400 mt-0.5">{[u.isim_2, u.urun_kodu, u.birim].filter(Boolean).join(' · ')}</p>
          )}
        </button>
      ))}
    </div>
  );
}

/* ════════════════════════════════════════
   Ana Sayfa
════════════════════════════════════════ */
export default function UrunEklePage() {
  const { sayimId }   = useParams();
  const navigate      = useNavigate();
  const { kullanici } = useAuthStore();
  const birimOtomatik = kullanici?.ayarlar?.birim_otomatik ?? true;

  const [isletmeId,    setIsletmeId]    = useState(null);
  const [ekleniyor,    setEkleniyor]    = useState(false);
  const [hesapAcik,    setHesapAcik]    = useState(false);
  const [kameraAcik,   setKameraAcik]   = useState(false);
  const [sonEklenen,   setSonEklenen]   = useState('');
  const [birimPicker,  setBirimPicker]  = useState(false);

  const [form, setForm] = useState({
    urun_id: null, isim: '', isim2: '', kod: '', birim: '', miktar: '', barkodlar: [],
  });

  const [on1, setOn1] = useState([]); const [ac1, setAc1] = useState(false); const [bos1, setBos1] = useState(false);
  const [on2, setOn2] = useState([]); const [ac2, setAc2] = useState(false); const [bos2, setBos2] = useState(false);

  const isimRef  = useRef(null);
  const skip1Ref = useRef(false);
  const skip2Ref = useRef(false);

  useEffect(() => { if (sayimId) fetchIsletmeId(); }, [sayimId]); // eslint-disable-line react-hooks/exhaustive-deps

  /* Debounce İsim 1 */
  useEffect(() => {
    if (skip1Ref.current) { skip1Ref.current = false; return; }
    if (!form.isim || !isletmeId) { setOn1([]); setAc1(false); setBos1(false); return; }
    const t = setTimeout(() => araUrun(form.isim, 1), 300);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.isim, isletmeId]);

  /* Debounce İsim 2 */
  useEffect(() => {
    if (skip2Ref.current) { skip2Ref.current = false; return; }
    if (!form.isim2 || !isletmeId) { setOn2([]); setAc2(false); setBos2(false); return; }
    const t = setTimeout(() => araUrun(form.isim2, 2), 300);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.isim2, isletmeId]);

  const fetchIsletmeId = async () => {
    try {
      const { data } = await api.get(`/sayimlar/${sayimId}`);
      if (data?.isletme_id) setIsletmeId(data.isletme_id);
    } catch { /* sessiz hata */ }
  };

  const araUrun = async (q, alan) => {
    if (!isletmeId) return;
    try {
      const { data } = await api.get(`/urunler?isletme_id=${isletmeId}&q=${encodeURIComponent(q)}`);
      const sonuclar = (Array.isArray(data) ? data : (data?.data || [])).slice(0, 10);
      if (alan === 1) { setOn1(sonuclar); setBos1(sonuclar.length === 0); setAc1(true); }
      else            { setOn2(sonuclar); setBos2(sonuclar.length === 0); setAc2(true); }
    } catch { /* sessiz hata */ }
  };

  const urunSec = (u) => {
    skip1Ref.current = true;
    skip2Ref.current = true;
    setForm(f => ({
      ...f,
      urun_id:    u.id        || null,
      isim:       u.urun_adi  || '',
      isim2:      u.isim_2    || '',
      kod:        u.urun_kodu || '',
      birim:      birimOtomatik ? (u.birim || '') : '',
      _urunBirim: u.birim     || '',   // her zaman sakla — picker için
      barkodlar:  Array.isArray(u.barkodlar) ? u.barkodlar : (u.barkodlar ? [u.barkodlar] : []),
    }));
    setOn1([]); setAc1(false); setBos1(false);
    setOn2([]); setAc2(false); setBos2(false);
  };

  const handleTemizle = () => {
    setForm({ urun_id: null, isim: '', isim2: '', kod: '', birim: '', _urunBirim: '', miktar: '', barkodlar: [] });
    setOn1([]); setAc1(false); setBos1(false);
    setOn2([]); setAc2(false); setBos2(false);
    setTimeout(() => isimRef.current?.focus(), 50);
  };

  const handleEkle = async (miktarOverride) => {
    const miktar = miktarOverride ?? form.miktar;
    if (!form.isim.trim())  { toast.error('Ürün ismi boş olamaz.');    return; }
    if (!miktar)             { toast.error('Miktar girin.');             return; }
    if (!form.urun_id)       { toast.error('Listeden bir ürün seçin.'); return; }

    setEkleniyor(true);
    try {
      await api.post(`/sayimlar/${sayimId}/kalem`, {
        urun_id:  form.urun_id,
        miktar:   parseFloat(miktar),
        birim:    form.birim || 'ADET',
      });
    } catch (err) {
      setEkleniyor(false);
      toast.error('Kalem eklenemedi: ' + (err.response?.data?.hata || err.message));
      return;
    }
    setEkleniyor(false);

    setSonEklenen(form.isim);
    toast.success('Ürün sayıma eklendi!');
    handleTemizle();
  };

  return (
    <div className="flex flex-col bg-white" style={{ height: 'calc(100vh - 56px - 44px)', overflow: 'hidden' }}>

      {/* ── Üst Bar ── */}
      <div className="bg-white px-3 py-2.5 flex items-center gap-2 flex-shrink-0" style={{ borderBottom: '1px solid #F3F4F6' }}>
        <button
          onClick={() => navigate(-1)}
          className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: '#F3F4F6' }}
        >
          <ChevronLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div className="flex-1 flex items-center gap-4 min-w-0">
          <p className="text-sm font-black text-gray-800 flex-shrink-0">Ürün Ekle</p>
          {sonEklenen && (
            <div
              className="flex items-center px-2.5 py-1 rounded-full text-xs font-black min-w-0"
              style={{ background: '#ECFDF5', color: '#059669' }}
            >
              <span className="truncate">✓ {sonEklenen}</span>
            </div>
          )}
        </div>
      </div>

      {/* ── Form ── */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">

        {/* Ürün İsmi 1 + Kamera */}
        <div className="relative">
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">
              Ürün İsmi 1
              {form.urun_id && <span className="ml-1.5 text-[10px] font-black" style={{ color: '#10B981' }}>✓ seçildi</span>}
            </label>
            <button onClick={() => setKameraAcik(true)} className="w-7 h-7 rounded-lg flex items-center justify-center active:scale-90 transition-transform" style={{ background: PL }}>
              <Camera className="w-3.5 h-3.5" style={{ color: P }} />
            </button>
          </div>
          <input
            ref={isimRef}
            value={form.isim}
            onChange={e => setForm(f => ({ ...f, isim: e.target.value, urun_id: null }))}
            placeholder="Ürün adı girin veya arayın..."
            autoComplete="off"
            className="w-full px-4 py-3 rounded-xl text-sm border bg-gray-50 outline-none transition-colors"
            style={{ borderColor: form.urun_id ? '#10B981' : '#E5E7EB' }}
            onFocus={e => { e.target.style.borderColor = form.urun_id ? '#10B981' : P; if (on1.length > 0 || bos1) setAc1(true); }}
            onBlur={e  => { e.target.style.borderColor = form.urun_id ? '#10B981' : '#E5E7EB'; setTimeout(() => setAc1(false), 150); }}
          />
          {ac1 && <OnerilerDropdown oneriler={on1} bos={bos1} onSec={urunSec} />}
        </div>

        {/* Birim + Miktar */}
        <div>
          <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">Birim / Miktar</label>
          <div className="flex items-center gap-2">
            {/* Birim — otomatik modda statik, manuel modda tıklanabilir */}
            {birimOtomatik ? (
              <div className="px-4 py-3 rounded-xl text-sm font-bold flex-shrink-0 text-center" style={{ background: PL, color: P, minWidth: 76 }}>
                {form.birim || 'Birim'}
              </div>
            ) : (
              <button
                onClick={() => { if (form._urunBirim) setBirimPicker(true); else toast('Önce ürün seçin.', { icon: '⚠️' }); }}
                className="px-4 py-3 rounded-xl text-sm font-bold flex-shrink-0 text-center active:scale-95 transition-transform"
                style={{
                  background: form.birim ? PL : '#F3F4F6',
                  color: form.birim ? P : '#9CA3AF',
                  minWidth: 76,
                  border: form.birim ? 'none' : '1.5px dashed #D1D5DB',
                }}
              >
                {form.birim || 'Birim'}
              </button>
            )}
            <button
              onClick={() => setHesapAcik(true)}
              className="flex-1 px-4 py-3 rounded-xl text-sm border border-gray-200 bg-gray-50 text-left active:bg-gray-100 transition-colors"
              style={{ color: form.miktar ? '#1F2937' : '#9CA3AF', fontWeight: form.miktar ? 700 : 400 }}
            >
              {form.miktar || 'Miktarı girin...'}
            </button>
          </div>
        </div>

        {/* Ürün İsmi 2 */}
        <div className="relative">
          <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">Ürün İsmi 2</label>
          <input
            value={form.isim2}
            onChange={e => setForm(f => ({ ...f, isim2: e.target.value }))}
            placeholder="İkinci isim girin veya arayın..."
            autoComplete="off"
            className="w-full px-4 py-3 rounded-xl text-sm border border-gray-200 bg-gray-50 outline-none"
            onFocus={e => { e.target.style.borderColor = P; if (on2.length > 0 || bos2) setAc2(true); }}
            onBlur={e  => { e.target.style.borderColor = '#E5E7EB'; setTimeout(() => setAc2(false), 150); }}
          />
          {ac2 && <OnerilerDropdown oneriler={on2} bos={bos2} onSec={urunSec} />}
        </div>

        {/* Ürün Kodu */}
        <div>
          <label className="block text-[10px] font-bold text-gray-300 uppercase tracking-wide mb-1">Ürün Kodu</label>
          <input
            value={form.kod}
            onChange={e => setForm(f => ({ ...f, kod: e.target.value }))}
            placeholder="—"
            autoComplete="off"
            className="w-full px-3 py-2 rounded-lg text-xs border outline-none text-gray-600"
            style={{ borderColor: '#F3F4F6', background: '#FAFAFA' }}
            onFocus={e => e.target.style.borderColor = P}
            onBlur={e  => e.target.style.borderColor = '#F3F4F6'}
          />
        </div>

        {/* Barkodlar */}
        {form.barkodlar.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {form.barkodlar.map(b => (
              <span key={b} className="px-2 py-0.5 rounded text-[10px] font-mono" style={{ background: '#F3F4F6', color: '#6B7280' }}>{b}</span>
            ))}
          </div>
        )}
      </div>

      {/* ── Alt Butonlar ── */}
      <div className="bg-white px-4 pb-6 pt-3 flex-shrink-0" style={{ borderTop: '1px solid #F3F4F6' }}>
        <button
          onClick={handleTemizle}
          className="w-full py-3.5 rounded-xl font-bold text-sm active:scale-95 transition-transform"
          style={{ background: '#F3F4F6', color: '#6B7280' }}
        >
          Temizle
        </button>
      </div>

      {/* ── Birim Picker ── */}
      {birimPicker && form._urunBirim && (
        <div
          className="fixed inset-0 z-50 flex flex-col justify-end"
          style={{ background: 'rgba(0,0,0,0.45)' }}
          onClick={e => e.target === e.currentTarget && setBirimPicker(false)}
        >
          <div className="bg-white rounded-t-3xl px-5 pt-4 pb-10">
            <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-5" />
            <p className="text-sm font-black text-gray-800 mb-1">Birim Seç</p>
            <p className="text-xs text-gray-400 mb-5">{form.isim}</p>

            {/* Ürünün birimi — büyük hızlı seçim butonu */}
            <button
              onClick={() => { setForm(f => ({ ...f, birim: f._urunBirim })); setBirimPicker(false); }}
              className="w-full py-5 rounded-2xl font-black text-xl active:scale-95 transition-transform"
              style={{ background: PL, color: P }}
            >
              {form._urunBirim}
            </button>
          </div>
        </div>
      )}

      {/* Hesap Makinesi */}
      {hesapAcik && (
        <Hesap
          mevcut={form.miktar}
          onKapat={() => setHesapAcik(false)}
          onEkle={val => { setHesapAcik(false); handleEkle(val); }}
        />
      )}

      {/* Barkod Tarayıcı */}
      {kameraAcik && (
        <BarkodTarayici
          isletmeId={isletmeId}
          sesAcik={kullanici?.ayarlar?.barkod_sesi ?? false}
          onBul={u => { urunSec(u); setKameraAcik(false); toast.success('Ürün bulundu!'); }}
          onKapat={() => setKameraAcik(false)}
        />
      )}
    </div>
  );
}
