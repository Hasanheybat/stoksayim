import { useState, useRef, useEffect } from 'react';
import { X, Camera, ChevronDown, Plus, RotateCcw, Building2 } from 'lucide-react';
import api from '../../lib/api';
import toast from 'react-hot-toast';

const P  = '#6c53f5';
const PL = 'rgba(108,83,245,0.10)';

const BIRIMLER = ['ADET','KG','GR','LT','ML','KOLİ','PAKET','KUTU','ÇUVAL','METRE','RULO','TON'];

/* ─── Barkod Tarayıcı ─── */
function BarcodeScanner({ onDetect, onClose }) {
  const videoRef    = useRef(null);
  const streamRef   = useRef(null);
  const rafRef      = useRef(null);
  const detectorRef = useRef(null);
  const okununduRef = useRef(false);
  const [hata, setHata]   = useState(null);
  const [hazir, setHazir] = useState(false);

  useEffect(() => {
    const stop = () => {
      cancelAnimationFrame(rafRef.current);
      streamRef.current?.getTracks().forEach(t => t.stop());
    };

    const scan = async () => {
      if (okununduRef.current || !videoRef.current) return;
      try {
        const barcodes = await detectorRef.current.detect(videoRef.current);
        if (barcodes.length > 0 && !okununduRef.current) {
          okununduRef.current = true;
          stop();
          onDetect(barcodes[0].rawValue);
          return;
        }
      } catch {}
      rafRef.current = requestAnimationFrame(scan);
    };

    const start = async () => {
      try {
        if (!('BarcodeDetector' in window)) {
          setHata('Tarayıcınız BarcodeDetector API\'yi desteklemiyor.\nManüel olarak girin.');
          return;
        }
        detectorRef.current = new window.BarcodeDetector({
          formats: ['ean_13','ean_8','code_128','code_39','upc_a','upc_e','qr_code'],
        });
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } },
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          setHazir(true);
          scan();
        }
      } catch (e) {
        setHata('Kameraya erişilemiyor:\n' + e.message);
      }
    };

    start();
    return () => {
      okununduRef.current = true;
      stop();
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[70] bg-black flex flex-col">
      <div className="flex items-center justify-between px-5 pt-12 pb-4">
        <p className="text-white font-bold text-base">Barkod Okut</p>
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center"
        >
          <X className="w-4 h-4 text-white" />
        </button>
      </div>

      {hata ? (
        <div className="flex-1 flex flex-col items-center justify-center px-8 text-center gap-4">
          <Camera className="w-14 h-14 text-white/40" />
          <p className="text-white/70 text-sm leading-relaxed whitespace-pre-line">{hata}</p>
          <button onClick={onClose} className="px-6 py-2.5 rounded-xl font-bold text-sm text-white" style={{ background: P }}>
            Kapat
          </button>
        </div>
      ) : (
        <div className="flex-1 relative overflow-hidden">
          <video ref={videoRef} className="absolute inset-0 w-full h-full object-cover" playsInline muted />
          {hazir && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="relative w-72 h-36">
                {[['top-0 left-0','border-t-2 border-l-2'],['top-0 right-0','border-t-2 border-r-2'],
                  ['bottom-0 left-0','border-b-2 border-l-2'],['bottom-0 right-0','border-b-2 border-r-2']
                ].map(([pos, brd], i) => (
                  <div key={i} className={`absolute w-7 h-7 border-white ${pos} ${brd}`} />
                ))}
                <div
                  className="absolute left-0 right-0 h-0.5 bg-red-400 opacity-80"
                  style={{ top: '50%', boxShadow: '0 0 8px rgba(248,113,113,0.8)' }}
                />
              </div>
            </div>
          )}
          <div className="absolute bottom-8 left-0 right-0 text-center">
            <p className="text-white/70 text-xs">Barkodu çerçeve içine hizalayın</p>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Birim Seçici ─── */
function BirimPicker({ secili, onSec, onKapat }) {
  return (
    <div
      className="fixed inset-0 z-[60] flex flex-col justify-end"
      style={{ background: 'rgba(0,0,0,0.45)' }}
      onClick={e => e.target === e.currentTarget && onKapat()}
    >
      <div className="bg-white rounded-t-3xl px-5 pt-5 pb-10">
        <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-4" />
        <h3 className="text-base font-black text-gray-800 mb-4">Birim Seç</h3>
        <div className="grid grid-cols-3 gap-2">
          {BIRIMLER.map(b => (
            <button
              key={b}
              onClick={() => { onSec(b); onKapat(); }}
              className="py-3 rounded-xl text-sm font-bold transition-all active:scale-95"
              style={{ background: secili === b ? P : '#F3F4F6', color: secili === b ? 'white' : '#374151' }}
            >
              {b}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Ana Bileşen ─── */
export default function StokEkle({ isletmeler = [], isletmeId, onKapat, onKaydedildi }) {
  const bos = {
    urun_adi:  '',
    isim_2:    '',
    urun_kodu: '',
    barkodlar: [],
    birim:     'ADET',
  };

  const [form, setForm]                   = useState(bos);
  const [seciliIsletmeId, setSeciliIsletmeId] = useState(isletmeId);
  const [manuelBarkod, setManuelBarkod]   = useState('');
  const [scanner, setScanner]             = useState(false);
  const [birimPicker, setBirimPicker]     = useState(false);
  const [isletmePicker, setIsletmePicker] = useState(false);
  const [kaydediyor, setKaydediyor]       = useState(false);

  const seciliIsletme = isletmeler.find(i => i.id === seciliIsletmeId);

  /* ── Barkod İşlemleri ── */
  const barkodEkle = (deger) => {
    const temiz = deger.trim();
    if (!temiz) return;
    if (form.barkodlar.includes(temiz)) {
      toast.error('Bu barkod zaten ekli.');
      return;
    }
    setForm(f => ({ ...f, barkodlar: [...f.barkodlar, temiz] }));
    toast.success(`Barkod eklendi: ${temiz}`, { duration: 2000 });
    setScanner(false);
    setManuelBarkod('');
  };

  const barkodSil = (b) => {
    setForm(f => ({ ...f, barkodlar: f.barkodlar.filter(x => x !== b) }));
  };

  /* ── Temizle ── */
  const temizle = () => {
    setForm(bos);
    setSeciliIsletmeId(isletmeId);
    setManuelBarkod('');
    toast('Form temizlendi', { icon: '🗑️', duration: 1500 });
  };

  /* ── Kaydet (backend API üzerinden) ── */
  const kaydet = async () => {
    if (!seciliIsletmeId)       { toast.error('İşletme seçin.');   return; }
    if (!form.urun_adi.trim())  { toast.error('Stok adı girin.');  return; }
    if (!form.urun_kodu.trim()) { toast.error('Stok kodu girin.'); return; }

    setKaydediyor(true);
    try {
      const { data } = await api.post('/urunler', {
        isletme_id: seciliIsletmeId,
        urun_adi:   form.urun_adi.trim(),
        isim_2:     form.isim_2.trim(),
        urun_kodu:  form.urun_kodu.trim(),
        barkodlar:  form.barkodlar,
        birim:      form.birim,
      });

      toast.success('Stok eklendi!');
      onKaydedildi?.(data);
      onKapat();
    } catch (err) {
      toast.error(err.response?.data?.hata || 'Sunucuya bağlanılamadı.');
    } finally {
      setKaydediyor(false);
    }
  };

  return (
    <>
      {/* ── Overlay ── */}
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
              <h2 className="text-base font-black text-gray-800">Yeni Stok Ekle</h2>
              <p className="text-xs text-gray-400 mt-0.5">Tüm alanları doldurun</p>
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

            {/* İşletme Seçici */}
            <div>
              <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">
                İşletme
              </label>
              <button
                onClick={() => setIsletmePicker(true)}
                className="w-full px-4 py-3 rounded-xl text-sm border border-gray-200 bg-gray-50 flex items-center gap-3"
                onFocus={e => e.target.style.borderColor = P}
                onBlur={e => e.target.style.borderColor = '#E5E7EB'}
              >
                <Building2 className="w-4 h-4 flex-shrink-0" style={{ color: P }} />
                <span className="flex-1 text-left font-semibold truncate" style={{ color: seciliIsletme ? '#1F2937' : '#9CA3AF' }}>
                  {seciliIsletme ? seciliIsletme.ad : 'İşletme seçin...'}
                </span>
                <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
              </button>
            </div>

            {/* İsim 1 — Sayım İsmi */}
            <div>
              <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">
                İsim 1 — Sayım İsmi
              </label>
              <input
                value={form.urun_adi}
                onChange={e => setForm(f => ({ ...f, urun_adi: e.target.value }))}
                placeholder="Sayımda kullanılan isim... (örn: Patates)"
                className="w-full px-4 py-3 rounded-xl text-sm border border-gray-200 bg-gray-50 outline-none"
                style={{ fontFamily: 'inherit' }}
                onFocus={e => e.target.style.borderColor = P}
                onBlur={e => e.target.style.borderColor = '#E5E7EB'}
              />
            </div>

            {/* İsim 2 — Stok İsmi */}
            <div>
              <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">
                İsim 2 — Stok İsmi
                <span className="ml-1 normal-case font-normal text-gray-300">(opsiyonel)</span>
              </label>
              <input
                value={form.isim_2}
                onChange={e => setForm(f => ({ ...f, isim_2: e.target.value }))}
                placeholder="Sistem / resmi isim... (örn: Potato)"
                className="w-full px-4 py-3 rounded-xl text-sm border border-gray-200 bg-gray-50 outline-none"
                style={{ fontFamily: 'inherit' }}
                onFocus={e => e.target.style.borderColor = P}
                onBlur={e => e.target.style.borderColor = '#E5E7EB'}
              />
            </div>

            {/* Stok Kodu */}
            <div>
              <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">
                Stok Kodu
              </label>
              <input
                value={form.urun_kodu}
                onChange={e => setForm(f => ({ ...f, urun_kodu: e.target.value }))}
                placeholder="Örn: ALF-013"
                className="w-full px-4 py-3 rounded-xl text-sm border border-gray-200 bg-gray-50 outline-none font-mono"
                onFocus={e => e.target.style.borderColor = P}
                onBlur={e => e.target.style.borderColor = '#E5E7EB'}
              />
            </div>

            {/* Barkodlar */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">
                  Barkodlar
                </label>
                <button
                  onClick={() => setScanner(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold active:scale-95 transition-transform"
                  style={{ background: PL, color: P }}
                >
                  <Camera className="w-3.5 h-3.5" />
                  Kamera
                </button>
              </div>

              <div className="w-full min-h-[48px] px-3 py-2.5 rounded-xl border border-gray-200 bg-gray-50 flex flex-wrap gap-1.5">
                {form.barkodlar.length === 0 ? (
                  <span className="text-xs text-gray-400 self-center">
                    Barkod yok — kamera veya manuel ekle
                  </span>
                ) : (
                  form.barkodlar.map((b) => (
                    <button
                      key={b}
                      onClick={() => barkodSil(b)}
                      title="Silmek için dokun"
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-mono font-semibold active:scale-95 transition-transform"
                      style={{ background: PL, color: P }}
                    >
                      {b}
                      <X className="w-2.5 h-2.5 opacity-60" />
                    </button>
                  ))
                )}
              </div>

              {/* Manuel barkod girişi */}
              <div className="flex gap-2 mt-2">
                <input
                  value={manuelBarkod}
                  onChange={e => setManuelBarkod(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && barkodEkle(manuelBarkod)}
                  placeholder="Manuel barkod gir..."
                  className="flex-1 px-3 py-2.5 rounded-xl text-sm border border-gray-200 bg-gray-50 outline-none font-mono"
                  onFocus={e => e.target.style.borderColor = P}
                  onBlur={e => e.target.style.borderColor = '#E5E7EB'}
                />
                <button
                  onClick={() => barkodEkle(manuelBarkod)}
                  className="px-4 py-2.5 rounded-xl text-sm font-bold text-white active:scale-95 transition-transform"
                  style={{ background: P }}
                >
                  Ekle
                </button>
              </div>
            </div>

            {/* Birim */}
            <div>
              <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">
                Birim
              </label>
              <button
                onClick={() => setBirimPicker(true)}
                className="w-full px-4 py-3 rounded-xl text-sm border border-gray-200 bg-gray-50 flex items-center justify-between"
              >
                <span className="font-bold" style={{ color: P }}>{form.birim}</span>
                <ChevronDown className="w-4 h-4 text-gray-400" />
              </button>
            </div>

          </div>

          {/* Alt butonlar */}
          <div className="px-5 py-4 flex gap-3" style={{ borderTop: '1px solid #F3F4F6' }}>
            <button
              onClick={temizle}
              className="flex-1 py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 active:scale-95 transition-transform"
              style={{ background: '#F3F4F6', color: '#6B7280' }}
            >
              <RotateCcw className="w-4 h-4" />
              Temizle
            </button>
            <button
              onClick={kaydet}
              disabled={kaydediyor}
              className="flex-[2] py-3.5 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2 active:opacity-80 transition-opacity"
              style={{ background: `linear-gradient(135deg,${P},#8b5cf6)`, opacity: kaydediyor ? 0.7 : 1 }}
            >
              {kaydediyor ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              {kaydediyor ? 'Ekleniyor...' : 'Ekle'}
            </button>
          </div>
        </div>
      </div>

      {scanner && (
        <BarcodeScanner onDetect={barkodEkle} onClose={() => setScanner(false)} />
      )}

      {birimPicker && (
        <BirimPicker
          secili={form.birim}
          onSec={b => setForm(f => ({ ...f, birim: b }))}
          onKapat={() => setBirimPicker(false)}
        />
      )}

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
              {isletmeler.map((ist) => {
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
                      style={{ background: `linear-gradient(135deg,${P},#8b5cf6)` }}
                    >
                      {ist.ad.charAt(0)}
                    </div>
                    <div className="flex-1 text-left min-w-0">
                      <p className="font-bold text-sm text-gray-800 truncate">{ist.ad}</p>
                      {ist.kod && <p className="text-xs text-gray-400 mt-0.5">{ist.kod}</p>}
                    </div>
                    {aktif && (
                      <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: P }}>
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
    </>
  );
}
