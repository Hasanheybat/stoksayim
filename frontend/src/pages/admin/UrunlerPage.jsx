import { useEffect, useRef, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import {
  Package, Building2, Upload, Plus, Search,
  ChevronLeft, ChevronRight, Pencil, Trash2, X, Check, RotateCcw, ChevronDown,
} from 'lucide-react';
import api from '../../lib/apiAdm';
import { useLanguage } from '../../i18n';

const GRAD = {
  indigo: 'linear-gradient(135deg,#6366F1,#8B5CF6)',
  amber:  'linear-gradient(135deg,#F59E0B,#D97706)',
  pink:   'linear-gradient(135deg,#EC4899,#DB2777)',
  green:  'linear-gradient(135deg,#10B981,#059669)',
  red:    'linear-gradient(135deg,#EF4444,#DC2626)',
};

const BIRIM_VARSAYILAN = ['ADET', 'KG', 'LT', 'MT', 'KUTU', 'PAKET', 'KOLI', 'TANE'];

/* ── Page Header ── */
function PageHeader({ title, stats }) {
  return (
    <div className="bg-white border-b border-gray-200 px-6 lg:px-8 py-5">
      <h1 className="text-xl font-black text-gray-900">{title}</h1>
      <div className="flex items-center gap-6 mt-3">
        {stats.map((s, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: s.color }}>
              <s.icon className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-xs text-gray-400">{s.label}</p>
              <p className="text-sm font-bold" style={{ color: '#6366F1' }}>{s.value ?? '—'}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Ürün Ekleme / Düzenleme Modal ── */
const BOSH_FORM = { urun_kodu: '', urun_adi: '', isim_2: '', birim: 'ADET', kategori: '', barkodlar: '', isletme_id: '' };

function UrunModal({ open, onClose, initial, isletmeId, isletmeler, onSaved }) {
  const { t } = useLanguage();
  const [form, setForm]         = useState(BOSH_FORM);
  const [loading, setLoading]   = useState(false);
  const [silOnay, setSilOnay]   = useState(false);
  const [barkodGiris, setBarkodGiris] = useState('');
  const [birimler, setBirimler] = useState(BIRIM_VARSAYILAN);
  const barkodRef = useRef();

  // Birimleri API'den çek
  useEffect(() => {
    api.get('/urunler/birimler').then(res => {
      const apiBirimler = res.data.map(b => b.ad);
      // API + varsayılanları birleştir, tekrar olmasın
      const hepsi = [...new Set([...apiBirimler, ...BIRIM_VARSAYILAN])].sort();
      setBirimler(hepsi);
    }).catch(() => setBirimler(BIRIM_VARSAYILAN));
  }, [open]);

  useEffect(() => {
    if (!open) return;
    if (initial) {
      setForm({
        urun_kodu:  initial.urun_kodu  || '',
        urun_adi:   initial.urun_adi   || '',
        isim_2:     initial.isim_2     || '',
        birim:      initial.birim      || 'ADET',
        kategori:   initial.kategori   || '',
        barkodlar:  initial.barkodlar  || '',
        isletme_id: initial.isletme_id || isletmeId || '',
      });
    } else {
      setForm({ ...BOSH_FORM, isletme_id: isletmeId || '' });
    }
    setSilOnay(false);
    setBarkodGiris('');
  }, [open, initial, isletmeId]);

  if (!open) return null;

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.isletme_id) {
      toast.error(t('toast.selectBusiness'));
      return;
    }
    if (!form.urun_kodu.trim() || !form.urun_adi.trim()) {
      toast.error(t('toast.productCodeRequired'));
      return;
    }
    setLoading(true);
    try {
      if (initial?.id) {
        await api.put(`/urunler/${initial.id}`, { ...form });
        toast.success(t('toast.productUpdated'));
      } else {
        await api.post('/urunler', { ...form });
        toast.success(t('toast.productAdded'));
      }
      onSaved();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.hata || t('toast.operationFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleSil = async () => {
    setLoading(true);
    try {
      await api.delete(`/urunler/${initial.id}`);
      toast.success(t('toast.productDeleted'));
      onSaved();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.hata || t('toast.deleteFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      >
      <div className="bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl w-full sm:max-w-lg max-h-[90vh] overflow-y-auto"
        >

        {/* Başlık */}
        <div className="sticky top-0 bg-white px-5 pt-5 pb-4 border-b border-gray-100 flex items-center gap-3 z-10">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: GRAD.indigo }}>
            <Package className="w-4 h-4 text-white" />
          </div>
          <h3 className="text-base font-bold text-gray-900 flex-1">
            {initial?.id ? t('products.edit') : t('products.new')}
          </h3>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-3.5">

          {/* İşletme — sadece yeni ürün eklerken göster */}
          {!initial?.id && (
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
                {t('products.business')} <span className="text-red-400">*</span>
              </label>
              <select value={form.isletme_id} onChange={e => set('isletme_id', e.target.value)}
                className="w-full px-4 py-2.5 text-sm rounded-xl border border-gray-200 outline-none focus:border-indigo-400 bg-gray-50 text-gray-700">
                <option value="">{t('products.businessSelect')}</option>
                {isletmeler.map(i => <option key={i.id} value={i.id}>{i.ad}</option>)}
              </select>
            </div>
          )}

          {/* Ürün Kodu */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
              {t('products.code')} <span className="text-red-400">*</span>
            </label>
            <input type="text" value={form.urun_kodu}
              onChange={e => set('urun_kodu', e.target.value)}
              placeholder={t('products.codePlaceholder')}
              className="w-full px-4 py-2.5 text-sm rounded-xl border border-gray-200 outline-none focus:border-indigo-400 bg-gray-50 font-mono" />
          </div>

          {/* Ürün Adı */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
              {t('products.name')} <span className="text-red-400">*</span>
            </label>
            <input type="text" value={form.urun_adi}
              onChange={e => set('urun_adi', e.target.value)}
              placeholder={t('products.namePlaceholder')}
              className="w-full px-4 py-2.5 text-sm rounded-xl border border-gray-200 outline-none focus:border-indigo-400 bg-gray-50" />
          </div>

          {/* İkinci İsim */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
              {t('products.secondName')}
              <span className="ml-1.5 text-gray-300 normal-case font-normal tracking-normal">({t('products.secondNameHint')})</span>
            </label>
            <input type="text" value={form.isim_2}
              onChange={e => set('isim_2', e.target.value)}
              placeholder={t('products.secondNamePlaceholder')}
              className="w-full px-4 py-2.5 text-sm rounded-xl border border-gray-200 outline-none focus:border-indigo-400 bg-gray-50" />
          </div>

          {/* Birim */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">{t('products.unit')}</label>
            <select value={form.birim} onChange={e => set('birim', e.target.value)}
              className="w-full px-4 py-2.5 text-sm rounded-xl border border-gray-200 outline-none focus:border-indigo-400 bg-gray-50">
              {[...new Set([form.birim, ...birimler])].filter(Boolean).map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>

          {/* Barkodlar */}
          {(() => {
            const pills = form.barkodlar
              ? form.barkodlar.split(',').map(b => b.trim()).filter(Boolean)
              : [];
            const barkodEkle = () => {
              const yeni = barkodGiris.trim();
              if (!yeni) return;
              if (!pills.includes(yeni)) {
                set('barkodlar', [...pills, yeni].join(','));
              }
              setBarkodGiris('');
              barkodRef.current?.focus();
            };
            const barkodSil = (b) => {
              set('barkodlar', pills.filter(x => x !== b).join(','));
            };
            return (
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
                  {t('products.barcodes')}
                </label>
                {/* Mevcut barkodlar */}
                {pills.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {pills.map(b => (
                      <span key={b} className="inline-flex items-center gap-1 text-xs font-mono px-2 py-1 rounded-lg"
                        style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', color: '#475569' }}>
                        {b}
                        <button type="button" onClick={() => barkodSil(b)}
                          className="text-gray-300 hover:text-red-400 transition-colors ml-0.5">
                          <X style={{ width: 10, height: 10 }} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                {/* Yeni barkod ekle */}
                <div className="flex gap-2">
                  <input
                    ref={barkodRef}
                    type="text"
                    value={barkodGiris}
                    onChange={e => setBarkodGiris(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); barkodEkle(); } }}
                    placeholder={t('products.barcodePlaceholder')}
                    className="flex-1 px-3 py-2 text-sm rounded-xl border border-gray-200 outline-none focus:border-indigo-400 bg-gray-50 font-mono" />
                  <button type="button" onClick={barkodEkle}
                    className="px-3 py-2 rounded-xl text-sm font-bold text-white flex-shrink-0"
                    style={{ background: GRAD.indigo }}>
                    <Plus style={{ width: 15, height: 15 }} />
                  </button>
                </div>
              </div>
            );
          })()}

          {/* Butonlar */}
          <div className="pt-1 space-y-2.5">
            <button type="submit" disabled={loading}
              className="w-full py-3 rounded-xl text-sm font-bold text-white disabled:opacity-50 flex items-center justify-center gap-2"
              style={{ background: GRAD.indigo }}>
              <Check className="w-4 h-4" />
              {loading ? t('action.saving') : (initial?.id ? t('action.update') : t('action.add'))}
            </button>

            {initial?.id && !silOnay && (
              <button type="button" onClick={() => setSilOnay(true)}
                className="w-full py-2.5 rounded-xl text-sm font-semibold text-red-400 border border-red-100 hover:bg-red-50 flex items-center justify-center gap-2">
                <Trash2 className="w-3.5 h-3.5" />
                {t('products.delete')}
              </button>
            )}

            {silOnay && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-3.5">
                <p className="text-xs text-red-600 font-semibold text-center mb-3">
                  {t('products.deleteConfirm')}
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <button type="button" onClick={() => setSilOnay(false)}
                    className="py-2 rounded-xl text-sm font-semibold border border-gray-200 text-gray-600 bg-white">
                    {t('action.giveUp')}
                  </button>
                  <button type="button" onClick={handleSil} disabled={loading}
                    className="py-2 rounded-xl text-sm font-bold text-white disabled:opacity-50"
                    style={{ background: GRAD.red }}>
                    {loading ? '...' : t('action.yesDelete')}
                  </button>
                </div>
              </div>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

/* ── Ana Sayfa ── */
export default function UrunlerPage() {
  const { t } = useLanguage();
  const [isletmeler, setIsletmeler]       = useState([]);
  const [seciliIsletme, setSeciliIsletme] = useState('');
  const [urunler, setUrunler]             = useState([]);
  const [toplam, setToplam]               = useState(0);
  const [sayfa, setSayfa]                 = useState(1);
  const [arama, setArama]                 = useState('');
  const [aramaInput, setAramaInput]       = useState('');
  const [yukleniyor, setYukleniyor]       = useState(false);
  const [aktifFiltre, setAktifFiltre]     = useState('aktif'); // 'tumu' | 'aktif' | 'pasif'
  const [geriAlUrun, setGeriAlUrun]       = useState(null);

  // Modal state
  const [modalAcik, setModalAcik]   = useState(false);
  const [seciliUrun, setSeciliUrun] = useState(null);

  // Excel
  const [excelAdim, setExcelAdim]       = useState(0);
  const [onizleme, setOnizleme]         = useState(null);
  const [excelYuk, setExcelYuk]         = useState(false);
  const [seciliDosya, setSeciliDosya]   = useState(null);
  const [excelIsletmeId, setExcelIsletmeId] = useState('');
  const dosyaRef = useRef();

  // Arama debounce
  useEffect(() => {
    const t = setTimeout(() => { setArama(aramaInput); setSayfa(1); }, 350);
    return () => clearTimeout(t);
  }, [aramaInput]);

  // İşletmeleri yükle
  useEffect(() => {
    api.get('/isletmeler?aktif=true').then(r => setIsletmeler(r.data));
  }, []);

  // Ürünleri yükle
  const getUrunler = useCallback(async () => {
    setYukleniyor(true);
    try {
      const p = new URLSearchParams({ sayfa, limit: 50 });
      if (seciliIsletme) p.set('isletme_id', seciliIsletme);
      if (arama)         p.set('q', arama);
      if (aktifFiltre === 'aktif') p.set('aktif', '1');
      else if (aktifFiltre === 'pasif') p.set('aktif', '0');
      else p.set('aktif', 'all');
      const { data } = await api.get(`/urunler?${p}`);
      setUrunler(data.data);
      setToplam(data.toplam);
    } finally {
      setYukleniyor(false);
    }
  }, [seciliIsletme, sayfa, arama, aktifFiltre]);

  useEffect(() => { getUrunler(); }, [getUrunler]);

  // Modal aç
  const handleYeniUrun = () => { setSeciliUrun(null); setModalAcik(true); };
  const handleDuzenle  = (u, e) => { e.stopPropagation(); setSeciliUrun(u); setModalAcik(true); };

  // Geri al
  const handleGeriAl = async () => {
    if (!geriAlUrun) return;
    try {
      await api.put(`/urunler/${geriAlUrun.id}/restore`);
      toast.success(t('toast.productRestored'));
      setGeriAlUrun(null);
      getUrunler();
    } catch (err) {
      toast.error(err.response?.data?.hata || t('toast.restoreFailed'));
    }
  };

  // Excel modal aç
  const handleExcelAc = () => {
    setExcelIsletmeId(seciliIsletme || '');
    setSeciliDosya(null);
    setOnizleme(null);
    setExcelAdim(1);
  };

  // Excel
  const handleOnizleme = async () => {
    if (!seciliDosya || !excelIsletmeId) {
      toast.error(!excelIsletmeId ? t('toast.selectBusiness') : t('toast.selectFile'));
      return;
    }
    setExcelYuk(true);
    const fd = new FormData(); fd.append('dosya', seciliDosya);
    try {
      const { data } = await api.post(`/urunler/yukle?isletme_id=${excelIsletmeId}&preview=true`, fd);
      setOnizleme(data); setExcelAdim(2);
    } catch (err) {
      toast.error(err.response?.data?.hata || t('toast.fileReadFailed'));
    } finally { setExcelYuk(false); }
  };

  const handleOnayla = async () => {
    setExcelYuk(true);
    const fd = new FormData(); fd.append('dosya', seciliDosya);
    try {
      const { data } = await api.post(`/urunler/yukle?isletme_id=${excelIsletmeId}&preview=false`, fd);
      toast.success(`${data.yeni} yeni, ${data.degisecek} güncellendi.`);
      setExcelAdim(0); setSeciliDosya(null); setOnizleme(null); getUrunler();
    } catch { toast.error(t('toast.error')); }
    finally { setExcelYuk(false); }
  };

  const handleSablonIndir = async () => {
    try {
      const res = await api.get('/urunler/sablon', { responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url; a.download = 'stoksay_sablon.xlsx'; a.click();
      URL.revokeObjectURL(url);
    } catch { toast.error(t('toast.templateFailed')); }
  };

  const sayfaSayisi = Math.ceil(toplam / 50);

  return (
    <div className="flex flex-col h-full">
      <PageHeader title={t('products.title')} stats={[
        { icon: Package,   label: t('products.totalProducts'), value: toplam,                                                                        color: GRAD.indigo },
        { icon: Building2, label: t('stat.business'),     value: seciliIsletme ? isletmeler.find(i => i.id === seciliIsletme)?.ad : t('filter.all'),    color: GRAD.amber },
        { icon: Package,   label: t('products.thisPage'),  value: urunler.length,                                                                color: GRAD.green },
      ]} />

      <div className="p-6 lg:p-8 flex-1 space-y-5 overflow-auto">

        {/* Toolbar */}
        <div className="flex flex-wrap gap-3 items-center">
          {/* Arama — en sola */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text"
              placeholder={t('products.search')}
              value={aramaInput}
              onChange={e => setAramaInput(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-gray-200 bg-white outline-none focus:border-indigo-400" />
            {aramaInput && (
              <button onClick={() => setAramaInput('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* İşletme filtre */}
          <select
            value={seciliIsletme}
            onChange={e => { setSeciliIsletme(e.target.value); setSayfa(1); }}
            className="px-4 py-2.5 text-sm rounded-xl border border-gray-200 bg-white outline-none focus:border-indigo-400 text-gray-700 font-medium min-w-[150px]">
            <option value="">{t('filter.allBusinesses')}</option>
            {isletmeler.map(i => <option key={i.id} value={i.id}>{i.ad}</option>)}
          </select>

          {/* Aktif/Pasif filtre */}
          <div className="flex bg-white rounded-xl border border-gray-200 p-1">
            {[{ k: 'tumu', l: t('filter.all') }, { k: 'aktif', l: t('filter.active') }, { k: 'pasif', l: t('filter.passive') }].map(f => (
              <button key={f.k} onClick={() => { setAktifFiltre(f.k); setSayfa(1); }}
                className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all"
                style={aktifFiltre === f.k ? { background: '#6366F1', color: 'white' } : { color: '#94A3B8' }}>
                {f.l}
              </button>
            ))}
          </div>

          {/* Excel Yükle */}
          <button onClick={handleExcelAc}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold border border-gray-200 bg-white text-gray-600 hover:bg-gray-50">
            <Upload className="w-4 h-4" /> {t('products.excelUpload')}
          </button>

          {/* Yeni Ürün — her zaman aktif */}
          <button onClick={handleYeniUrun}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white shadow-sm"
            style={{ background: GRAD.indigo }}>
            <Plus className="w-4 h-4" /> {t('products.new')}
          </button>
        </div>

        {/* İçerik */}
        {yukleniyor ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-1.5">
            {Array.from({length: 20}).map((_, i) => <div key={i} className="h-9 bg-gray-100 rounded-lg animate-pulse" />)}
          </div>
        ) : urunler.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-gray-100">
            <Package className="w-12 h-12 mx-auto mb-3 text-gray-200" />
            <p className="text-gray-400 font-medium">
              {arama ? `"${arama}" ${t('products.searchNotFound')}` : t('products.notFound')}
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-1.5">
              {urunler.map(u => {
                const pasif = u.aktif === 0 || u.aktif === false;
                return (
                <div key={u.id}
                  className={`rounded-lg px-3 py-2.5 border transition-all group flex flex-col gap-1.5 cursor-pointer ${u._acik ? 'ring-1 ring-indigo-200' : ''} ${pasif ? 'bg-red-50 border-red-200' : 'bg-white border-gray-100 hover:border-indigo-100 hover:bg-indigo-50/30'}`}
                  onClick={() => setUrunler(prev => prev.map(p => p.id === u.id ? { ...p, _acik: !p._acik } : p))}
                >

                  <div className="flex items-center gap-2">
                    {/* Bilgiler */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className={`text-sm font-semibold truncate leading-tight ${pasif ? 'text-red-500' : 'text-gray-800'}`}>{u.urun_adi}</p>
                        {pasif && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0"
                            style={{ background: '#FEE2E2', color: '#DC2626' }}>{t('status.passive')}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-xs text-gray-400">{u.birim || 'ADET'}</span>
                        {!seciliIsletme && u.isletmeler?.ad && (
                          <span className="text-xs font-medium px-1.5 py-0.5 rounded-md"
                            style={{ background: '#F0FDF4', color: '#16A34A' }}>
                            {u.isletmeler.ad}
                          </span>
                        )}
                      </div>
                    </div>

                    <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform flex-shrink-0 ${u._acik ? 'rotate-180' : ''}`} />

                    {/* Düzenle (sadece aktif) */}
                    {!pasif && (
                      <button
                        onClick={e => handleDuzenle(u, e)}
                        className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0"
                        style={{ background: '#EEF2FF' }}>
                        <Pencil style={{ width: 11, height: 11, color: '#6366F1' }} />
                      </button>
                    )}
                  </div>

                  {/* Genişletilmiş detay bilgileri */}
                  {u._acik && (
                    <div className="border-t border-gray-100 pt-1.5 grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
                      {u.urun_kodu && (
                        <><span className="text-gray-400 font-medium">{t('table.productCode')}</span><span className="text-gray-700 font-semibold text-right">{u.urun_kodu}</span></>
                      )}
                      {u.isim_2 && (
                        <><span className="text-gray-400 font-medium">{t('table.secondName')}</span><span className="text-gray-700 font-semibold text-right">{u.isim_2}</span></>
                      )}
                      {u.barkodlar && (
                        <><span className="text-gray-400 font-medium">{t('table.barcode')}</span><span className="text-gray-700 font-semibold text-right">{u.barkodlar}</span></>
                      )}
                      <span className="text-gray-400 font-medium">{t('table.unit')}</span><span className="text-gray-700 font-semibold text-right">{u.birim || 'ADET'}</span>
                      {pasif && (
                        <><span className="text-gray-400 font-medium">{t('table.status')}</span><span className="text-red-600 font-semibold text-right">{t('table.passiveProduct')}</span></>
                      )}
                    </div>
                  )}

                  {/* Geri Al (pasif - tam genişlik alt kısım) */}
                  {pasif && (
                    <div className="border-t border-red-200 pt-1.5">
                      <button onClick={e => { e.stopPropagation(); setGeriAlUrun(u); }}
                        className="flex items-center justify-center gap-1 w-full py-1.5 rounded-lg text-xs font-semibold border border-green-200 hover:bg-green-100 text-green-600 transition-colors"
                        style={{ background: '#DCFCE7' }}>
                        <RotateCcw className="w-3 h-3" />{t('action.restore')}
                      </button>
                    </div>
                  )}
                </div>
                );
              })}
            </div>

            {/* Sayfalama */}
            {toplam > 50 && (
              <div className="flex items-center justify-center gap-3">
                <button onClick={() => setSayfa(s => Math.max(1, s - 1))} disabled={sayfa === 1}
                  className="flex items-center gap-1.5 px-4 py-2 text-sm border border-gray-200 rounded-xl disabled:opacity-40 hover:bg-white bg-white">
                  <ChevronLeft className="w-4 h-4" />Önceki
                </button>
                <span className="text-sm text-gray-500 font-medium">
                  {sayfa} / {sayfaSayisi}
                  <span className="text-gray-400 font-normal ml-2">({toplam} ürün)</span>
                </span>
                <button onClick={() => setSayfa(s => s + 1)} disabled={sayfa >= sayfaSayisi}
                  className="flex items-center gap-1.5 px-4 py-2 text-sm border border-gray-200 rounded-xl disabled:opacity-40 hover:bg-white bg-white">
                  Sonraki<ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Ürün Ekle / Düzenle Modal */}
      <UrunModal
        open={modalAcik}
        onClose={() => setModalAcik(false)}
        initial={seciliUrun}
        isletmeId={seciliIsletme}
        isletmeler={isletmeler}
        onSaved={getUrunler}
      />

      {/* Excel Modal */}
      {excelAdim > 0 && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6">
            {excelAdim === 1 && (
              <>
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: GRAD.pink }}>
                      <Upload className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">{t('products.excelUpload')}</h3>
                  </div>
                  <button onClick={handleSablonIndir}
                    className="flex items-center gap-1.5 text-xs font-semibold text-indigo-500 hover:text-indigo-700 border border-indigo-200 hover:border-indigo-400 px-3 py-1.5 rounded-lg transition-colors">
                    <Package className="w-3.5 h-3.5" /> Şablon İndir
                  </button>
                </div>

                {/* İşletme Seç */}
                <div className="mb-4">
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
                    {t('products.business')} <span className="text-red-400">*</span>
                  </label>
                  <select value={excelIsletmeId} onChange={e => setExcelIsletmeId(e.target.value)}
                    className="w-full px-4 py-2.5 text-sm rounded-xl border border-gray-200 outline-none focus:border-indigo-400 bg-gray-50 text-gray-700">
                    <option value="">{t('products.businessSelect')}</option>
                    {isletmeler.map(i => <option key={i.id} value={i.id}>{i.ad}</option>)}
                  </select>
                </div>

                {/* Dosya Seç */}
                <div onClick={() => dosyaRef.current?.click()}
                  className="border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-colors mb-4"
                  style={{ borderColor: seciliDosya ? '#6366F1' : '#E2E8F0', background: seciliDosya ? '#EEF2FF' : '#FAFAFA' }}>
                  {seciliDosya ? (
                    <div>
                      <Upload className="w-9 h-9 mx-auto mb-2" style={{ color: '#6366F1' }} />
                      <p className="font-semibold text-gray-800 text-sm">{seciliDosya.name}</p>
                      <p className="text-xs text-indigo-400 mt-1">Değiştirmek için tıklayın</p>
                    </div>
                  ) : (
                    <div>
                      <Upload className="w-9 h-9 mx-auto mb-2 text-gray-300" />
                      <p className="text-sm text-gray-500 font-medium">Dosya seçmek için tıklayın</p>
                      <p className="text-xs text-gray-400 mt-1">.xlsx veya .xls</p>
                    </div>
                  )}
                </div>
                <input ref={dosyaRef} type="file" accept=".xlsx,.xls" className="hidden"
                  onChange={e => setSeciliDosya(e.target.files[0])} />
                <div className="flex gap-3">
                  <button onClick={() => { setExcelAdim(0); setSeciliDosya(null); }}
                    className="flex-1 py-3 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600">
                    İptal
                  </button>
                  <button onClick={handleOnizleme} disabled={!seciliDosya || !excelIsletmeId || excelYuk}
                    className="flex-1 py-3 rounded-xl text-sm font-bold text-white disabled:opacity-50"
                    style={{ background: GRAD.indigo }}>
                    {excelYuk ? 'Analiz...' : 'Devam →'}
                  </button>
                </div>
              </>
            )}
            {excelAdim === 2 && onizleme && (
              <>
                <h3 className="text-lg font-bold text-gray-900 mb-5">Önizleme</h3>
                <div className="grid grid-cols-4 gap-3 mb-4">
                  {[
                    { l: 'Yeni',      c: onizleme.yeni?.length,      bg: '#DCFCE7', cl: '#16A34A' },
                    { l: 'Değişecek', c: onizleme.degisecek?.length,  bg: '#FEF9C3', cl: '#A16207' },
                    { l: 'Korunacak', c: onizleme.korunacak?.length,  bg: '#EEF2FF', cl: '#6366F1' },
                    { l: 'Hatalı',    c: onizleme.hatali?.length,     bg: '#FEE2E2', cl: '#DC2626' },
                  ].map(s => (
                    <div key={s.l} className="rounded-2xl p-4 text-center" style={{ background: s.bg }}>
                      <p className="text-2xl font-black" style={{ color: s.cl }}>{s.c}</p>
                      <p className="text-xs font-semibold mt-1" style={{ color: s.cl }}>{s.l}</p>
                    </div>
                  ))}
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setExcelAdim(1)}
                    className="flex-1 py-3 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600">
                    ← Geri
                  </button>
                  <button onClick={handleOnayla} disabled={excelYuk}
                    className="flex-1 py-3 rounded-xl text-sm font-bold text-white disabled:opacity-50"
                    style={{ background: GRAD.green }}>
                    {excelYuk ? 'Yükleniyor...' : '✓ Onayla ve Yükle'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Geri Al Onay Modalı */}
      {geriAlUrun && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(3px)' }}
          onClick={() => setGeriAlUrun(null)}>
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden p-6"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: '#DCFCE7' }}>
                <RotateCcw className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="font-bold text-gray-900 text-sm">Ürünü Geri Al</p>
                <p className="text-xs text-gray-400">Bu ürün tekrar aktif olacak</p>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-5">
              <span className="font-bold">{geriAlUrun.urun_adi}</span> geri alınacak. Devam etmek istiyor musunuz?
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => setGeriAlUrun(null)}
                className="py-3 rounded-xl font-bold text-sm text-gray-500 transition-colors"
                style={{ background: '#F3F4F6' }}>
                Vazgeç
              </button>
              <button onClick={handleGeriAl}
                className="py-3 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2 transition-colors"
                style={{ background: '#10B981' }}>
                <RotateCcw className="w-4 h-4" />
                Geri Al
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
