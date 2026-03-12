import { useEffect, useRef, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import {
  ClipboardList, Building2, Search, X, ChevronDown, Check,
  Calendar, User, Warehouse, Package, ChevronLeft, ChevronRight,
  LockKeyhole, LockKeyholeOpen, FileText, FileSpreadsheet,
} from 'lucide-react';
import api from '../../lib/apiAdm';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

const GRAD = {
  indigo: 'linear-gradient(135deg,#6366F1,#8B5CF6)',
  teal:   'linear-gradient(135deg,#14B8A6,#0D9488)',
  green:  'linear-gradient(135deg,#10B981,#059669)',
  amber:  'linear-gradient(135deg,#F59E0B,#D97706)',
  blue:   'linear-gradient(135deg,#0EA5E9,#2563EB)',
};

const DURUM_MAP = {
  devam:      { label: 'Devam Ediyor', bg: '#EFF6FF', color: '#2563EB', dot: '#3B82F6' },
  tamamlandi: { label: 'Tamamlandı',   bg: '#F0FDF4', color: '#15803D', dot: '#22C55E' },
};

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

/* ── Çoklu İşletme Seçici ── */
function IsletmeFiltre({ isletmeler, secili, onChange }) {
  const [acik, setAcik] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = e => { if (ref.current && !ref.current.contains(e.target)) setAcik(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const toggle = id => onChange(secili.includes(id) ? secili.filter(s => s !== id) : [...secili, id]);
  const temizle = e => { e.stopPropagation(); onChange([]); };

  const label = secili.length === 0
    ? 'Tüm İşletmeler'
    : secili.length === 1
      ? isletmeler.find(i => i.id === secili[0])?.ad || '1 İşletme'
      : `${secili.length} İşletme Seçili`;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setAcik(v => !v)}
        className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl border bg-white text-sm font-medium transition-colors min-w-[170px]"
        style={{ borderColor: secili.length > 0 ? '#6366F1' : '#E5E7EB', color: secili.length > 0 ? '#6366F1' : '#374151' }}
      >
        <Building2 className="w-4 h-4 flex-shrink-0" />
        <span className="flex-1 text-left truncate">{label}</span>
        {secili.length > 0
          ? <X className="w-3.5 h-3.5 flex-shrink-0 hover:text-red-500 transition-colors" onClick={temizle} />
          : <ChevronDown className={`w-4 h-4 flex-shrink-0 transition-transform ${acik ? 'rotate-180' : ''}`} />
        }
      </button>

      {acik && (
        <div className="absolute top-full left-0 mt-1.5 bg-white rounded-2xl shadow-xl border border-gray-100 z-20 py-2 min-w-[220px] max-h-64 overflow-y-auto">
          <button
            onClick={() => onChange(secili.length === isletmeler.length ? [] : isletmeler.map(i => i.id))}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-semibold hover:bg-gray-50 text-gray-600 border-b border-gray-100 mb-1"
          >
            <div className={`w-[18px] h-[18px] rounded flex items-center justify-center border-2 flex-shrink-0 transition-colors ${secili.length === isletmeler.length ? 'border-indigo-500 bg-indigo-500' : 'border-gray-300'}`}>
              {secili.length === isletmeler.length && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
            </div>
            Tümünü Seç
          </button>
          {isletmeler.map(i => {
            const aktif = secili.includes(i.id);
            return (
              <button key={i.id}
                onClick={() => toggle(i.id)}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors"
              >
                <div className={`w-[18px] h-[18px] rounded flex items-center justify-center border-2 flex-shrink-0 ${aktif ? 'border-indigo-500 bg-indigo-500' : 'border-gray-300'}`}>
                  {aktif && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                </div>
                <span className={`flex-1 text-left truncate ${aktif ? 'font-semibold text-gray-900' : 'text-gray-600'}`}>{i.ad}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ── Export helpers ── */
function exportPDF(sayim, kalemler) {
  const doc = new jsPDF();
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(sayim.ad || 'Sayım Raporu', 14, 18);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100);
  let y = 28;
  const bilgiler = [
    ['Depo',      sayim.depolar?.ad],
    ['İşletme',   sayim.isletmeler?.ad],
    ['Tarih',     sayim.tarih ? new Date(sayim.tarih).toLocaleDateString('tr-TR') : null],
    ['Kullanıcı', sayim.kullanicilar?.ad_soyad],
    ['Durum',     DURUM_MAP[sayim.durum]?.label || sayim.durum],
    ['Notlar',    sayim.notlar],
  ].filter(([, v]) => v);
  bilgiler.forEach(([k, v]) => {
    doc.setFont('helvetica', 'bold'); doc.text(`${k}:`, 14, y);
    doc.setFont('helvetica', 'normal'); doc.text(String(v), 45, y);
    y += 6;
  });
  autoTable(doc, {
    startY: y + 4,
    head: [['#', 'Ürün Adı', 'İkinci İsim', 'Ürün Kodu', 'Miktar', 'Birim']],
    body: kalemler.map((k, i) => [
      i + 1,
      k.isletme_urunler?.urun_adi || '—',
      k.isletme_urunler?.isim_2 || '',
      k.isletme_urunler?.urun_kodu || '—',
      k.miktar,
      k.birim || '',
    ]),
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: [20, 184, 166], fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [248, 249, 250] },
  });
  doc.save(`${(sayim.ad || 'sayim').replace(/\s+/g, '_')}.pdf`);
}

function exportExcel(sayim, kalemler) {
  const wb = XLSX.utils.book_new();
  const rows = [
    ['Sayım Adı',  sayim.ad || ''],
    ['Depo',       sayim.depolar?.ad || ''],
    ['İşletme',    sayim.isletmeler?.ad || ''],
    ['Tarih',      sayim.tarih ? new Date(sayim.tarih).toLocaleDateString('tr-TR') : ''],
    ['Kullanıcı',  sayim.kullanicilar?.ad_soyad || ''],
    ['Durum',      DURUM_MAP[sayim.durum]?.label || sayim.durum || ''],
    [],
    ['#', 'Ürün Adı', 'İkinci İsim', 'Ürün Kodu', 'Miktar', 'Birim'],
    ...kalemler.map((k, i) => [
      i + 1,
      k.isletme_urunler?.urun_adi || '',
      k.isletme_urunler?.isim_2 || '',
      k.isletme_urunler?.urun_kodu || '',
      k.miktar,
      k.birim || '',
    ]),
  ];
  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws['!cols'] = [{ wch: 5 }, { wch: 35 }, { wch: 25 }, { wch: 18 }, { wch: 10 }, { wch: 10 }];
  XLSX.utils.book_append_sheet(wb, ws, 'Sayım');
  XLSX.writeFile(wb, `${(sayim.ad || 'sayim').replace(/\s+/g, '_')}.xlsx`);
}

/* ── Sayım Detay Modalı ── */
function SayimDetayModal({ sayimId, onClose, onStatusChange }) {
  const [sayim, setSayim]       = useState(null);
  const [kalemler, setKalemler] = useState([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [islem, setIslem]       = useState(false);

  useEffect(() => {
    if (!sayimId) return;
    setYukleniyor(true);
    Promise.all([
      api.get(`/sayimlar/${sayimId}`),
      api.get(`/sayimlar/${sayimId}/kalemler`),
    ]).then(([rs, rk]) => {
      setSayim(rs.data);
      setKalemler(rk.data || []);
    }).catch(() => toast.error('Detay yüklenemedi.'))
      .finally(() => setYukleniyor(false));
  }, [sayimId]);

  const eylem = async tip => {
    setIslem(true);
    try {
      await api.put(`/sayimlar/${sayimId}/${tip}`);
      toast.success(
        tip === 'tamamla'    ? 'Sayım kapatıldı.' :
        'Sayım yeniden açıldı.'
      );
      onStatusChange();
      onClose();
    } catch (e) {
      toast.error(e.response?.data?.hata || 'İşlem başarısız.');
    } finally {
      setIslem(false);
    }
  };

  const d = DURUM_MAP[sayim?.durum] || DURUM_MAP.devam;

  return (
    <div className="fixed inset-0 z-[60] flex flex-col justify-end sm:items-center sm:justify-center p-0 sm:p-4"
      style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(3px)' }}
      onClick={onClose}>
      <div className="bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
        onClick={e => e.stopPropagation()}>

        {/* Handle (mobil) */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-10 h-1 rounded-full bg-gray-200" />
        </div>

        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-100 transition-colors -ml-1">
            <ChevronLeft className="w-5 h-5 text-gray-500" />
          </button>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-gray-900 truncate">{sayim?.ad || '—'}</h3>
            {sayim && (
              <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full mt-0.5"
                style={{ background: d.bg, color: d.color }}>
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: d.dot }} />
                {d.label}
              </span>
            )}
          </div>
        </div>

        {yukleniyor ? (
          <div className="p-6 space-y-3">
            {[1, 2, 3].map(i => <div key={i} className="h-10 bg-gray-100 rounded-xl animate-pulse" />)}
          </div>
        ) : sayim && (
          <>
            {/* Bilgi satırları */}
            <div className="px-5 py-4 space-y-2.5 border-b border-gray-100">
              {[
                { label: 'İşletme',  value: sayim.isletmeler?.ad },
                { label: 'Depo',     value: sayim.depolar?.ad },
                { label: 'Tarih',    value: sayim.tarih ? new Date(sayim.tarih).toLocaleDateString('tr-TR') : null },
                { label: 'Kullanıcı', value: sayim.kullanicilar?.ad_soyad },
                { label: 'Notlar',   value: sayim.notlar },
              ].filter(r => r.value).map(r => (
                <div key={r.label} className="flex items-center justify-between gap-4">
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{r.label}</span>
                  <span className="text-sm text-gray-700 text-right">{r.value}</span>
                </div>
              ))}
            </div>

            {/* Kalemler */}
            <div className="flex-1 overflow-y-auto">
              <div className="px-5 py-3 flex items-center gap-2 border-b border-gray-100">
                <Package className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-500">
                  <span className="font-bold text-gray-900">{kalemler.length}</span> kalem
                </span>
              </div>
              {kalemler.length === 0 ? (
                <div className="text-center py-8 text-sm text-gray-400">Kalem eklenmemiş</div>
              ) : (
                <div className="divide-y divide-gray-50 max-h-52 overflow-y-auto">
                  {kalemler.map(k => (
                    <div key={k.id} className="flex items-center justify-between px-5 py-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-900 truncate">{k.isletme_urunler?.urun_adi || '—'}</p>
                        {k.isletme_urunler?.isim_2 && (
                          <p className="text-xs text-indigo-500 truncate">{k.isletme_urunler.isim_2}</p>
                        )}
                        <p className="text-xs text-gray-400">{k.isletme_urunler?.urun_kodu}</p>
                      </div>
                      <span className="ml-3 text-sm font-bold text-gray-700">
                        {k.miktar} <span className="text-xs font-normal text-gray-400">{k.birim || ''}</span>
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* İndirme butonları */}
            <div className="px-5 pt-4 pb-2 grid grid-cols-2 gap-2 border-t border-gray-100">
              <button onClick={() => { try { exportPDF(sayim, kalemler); } catch { toast.error('PDF oluşturulamadı.'); } }}
                className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-semibold transition-colors"
                style={{ borderColor: '#FECACA', color: '#DC2626', background: '#FEF2F2', border: '1px solid #FECACA' }}>
                <FileText className="w-4 h-4" /> PDF İndir
              </button>
              <button onClick={() => { try { exportExcel(sayim, kalemler); } catch { toast.error('Excel oluşturulamadı.'); } }}
                className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-semibold transition-colors"
                style={{ borderColor: '#BBF7D0', color: '#15803D', background: '#F0FDF4', border: '1px solid #BBF7D0' }}>
                <FileSpreadsheet className="w-4 h-4" /> Excel İndir
              </button>
            </div>

            {/* Açma / Kapama butonları */}
            <div className="px-5 py-3 border-t border-gray-100 flex gap-3">
              {sayim.durum === 'devam' && (
                <button onClick={() => eylem('tamamla')} disabled={islem}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold text-white transition-opacity disabled:opacity-60"
                  style={{ background: GRAD.green }}>
                  <LockKeyhole className="w-4 h-4" />
                  Sayımı Kapat
                </button>
              )}
              {sayim.durum !== 'devam' && (
                <button onClick={() => eylem('yeniden-ac')} disabled={islem}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold text-white transition-opacity disabled:opacity-60"
                  style={{ background: GRAD.indigo }}>
                  <LockKeyholeOpen className="w-4 h-4" />
                  Sayımı Yeniden Aç
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

const LIMIT = 50;

/* ── Ana Sayfa ── */
export default function SayimlarAdminPage() {
  const [isletmeler, setIsletmeler]           = useState([]);
  const [depolar, setDepolar]                 = useState([]);
  const [sayimlar, setSayimlar]               = useState([]);
  const [seciliIsletmeler, setSeciliIsletmeler] = useState([]);
  const [seciliDepo, setSeciliDepo]           = useState('');
  const [seciliDurum, setSeciliDurum]         = useState('');
  const [aramaInput, setAramaInput]           = useState('');
  const [arama, setArama]                     = useState('');
  const [yukleniyor, setYukleniyor]           = useState(false);
  const [seciliSayimId, setSeciliSayimId]     = useState(null);
  const [sayfa, setSayfa]                     = useState(1);
  const [toplam, setToplam]                   = useState(0);

  // Arama debounce
  useEffect(() => {
    const t = setTimeout(() => { setArama(aramaInput); setSayfa(1); }, 350);
    return () => clearTimeout(t);
  }, [aramaInput]);

  // İşletmeleri yükle
  useEffect(() => {
    api.get('/isletmeler').then(r => setIsletmeler(r.data || []));
  }, []);

  // Seçili işletmelere göre depoları yükle
  useEffect(() => {
    if (seciliIsletmeler.length === 0) {
      setDepolar([]);
      setSeciliDepo('');
      return;
    }
    Promise.all(seciliIsletmeler.map(id => api.get(`/depolar?isletme_id=${id}`).then(r => r.data || [])))
      .then(results => setDepolar(results.flat()));
  }, [seciliIsletmeler]);

  // Sayımları yükle
  const getSayimlar = useCallback(async () => {
    setYukleniyor(true);
    try {
      const p = new URLSearchParams({ sayfa, limit: LIMIT });
      if (seciliIsletmeler.length === 1) p.set('isletme_id', seciliIsletmeler[0]);
      else if (seciliIsletmeler.length > 1) p.set('isletme_ids', seciliIsletmeler.join(','));
      if (seciliDepo)  p.set('depo_id', seciliDepo);
      if (seciliDurum) p.set('durum', seciliDurum);
      if (arama)       p.set('q', arama);
      const { data: res } = await api.get(`/sayimlar?${p}`);
      setSayimlar((res.data || []).filter(s => s.durum !== 'silindi'));
      setToplam(res.toplam || 0);
    } catch {
      toast.error('Sayımlar yüklenemedi.');
    } finally {
      setYukleniyor(false);
    }
  }, [sayfa, seciliIsletmeler, seciliDepo, seciliDurum, arama]);

  useEffect(() => { getSayimlar(); }, [getSayimlar]);

  // Reset page when filters change
  const handleIsletmeChange = (v) => { setSeciliIsletmeler(v); setSayfa(1); };
  const handleDepoChange = (v) => { setSeciliDepo(v); setSayfa(1); };
  const handleDurumChange = (v) => { setSeciliDurum(v); setSayfa(1); };

  const sayfaSayisi = Math.max(1, Math.ceil(toplam / LIMIT));
  const devamEden  = sayimlar.filter(s => s.durum === 'devam').length;
  const tamamlanan = sayimlar.filter(s => s.durum === 'tamamlandi').length;

  return (
    <div className="flex flex-col h-full">
      <PageHeader title="Sayım Yönetimi" stats={[
        { icon: ClipboardList,   label: 'Toplam Sayım', value: toplam,     color: GRAD.teal  },
        { icon: LockKeyholeOpen, label: 'Devam Eden',   value: devamEden,  color: GRAD.blue  },
        { icon: LockKeyhole,     label: 'Tamamlanan',   value: tamamlanan, color: GRAD.green },
      ]} />

      <div className="p-4 sm:p-6 lg:p-8 flex-1 space-y-4 overflow-auto">

        {/* Toolbar */}
        <div className="flex flex-wrap gap-2 items-center">
          {/* Arama */}
          <div className="relative flex-1 min-w-[160px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" placeholder="Sayım adı ara..."
              value={aramaInput} onChange={e => setAramaInput(e.target.value)}
              className="w-full pl-10 pr-8 py-2.5 text-sm rounded-xl border border-gray-200 bg-white outline-none focus:border-indigo-400" />
            {aramaInput && (
              <button onClick={() => setAramaInput('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* İşletme filtresi */}
          <IsletmeFiltre
            isletmeler={isletmeler}
            secili={seciliIsletmeler}
            onChange={handleIsletmeChange}
          />

          {/* Depo filtresi — sadece tek işletme seçili ise göster */}
          {seciliIsletmeler.length === 1 && depolar.length > 0 && (
            <select value={seciliDepo}
              onChange={e => handleDepoChange(e.target.value)}
              className="px-3.5 py-2.5 text-sm rounded-xl border border-gray-200 bg-white outline-none focus:border-indigo-400 text-gray-700 min-w-[140px]">
              <option value="">Tüm Depolar</option>
              {depolar.map(d => <option key={d.id} value={d.id}>{d.ad}</option>)}
            </select>
          )}

          {/* Durum filtresi */}
          <select value={seciliDurum}
            onChange={e => handleDurumChange(e.target.value)}
            className="px-3.5 py-2.5 text-sm rounded-xl border border-gray-200 bg-white outline-none focus:border-indigo-400 text-gray-700 min-w-[140px]"
            style={{ borderColor: seciliDurum ? '#6366F1' : undefined, color: seciliDurum ? '#6366F1' : undefined }}>
            <option value="">Tüm Durumlar</option>
            <option value="devam">Devam Ediyor</option>
            <option value="tamamlandi">Tamamlandı</option>
          </select>
        </div>

        {/* İçerik */}
        {yukleniyor ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-28 bg-white rounded-xl animate-pulse border border-gray-100" />
            ))}
          </div>
        ) : sayimlar.length === 0 ? (
          <div className="bg-white rounded-2xl p-16 text-center border border-gray-100">
            <ClipboardList className="w-12 h-12 mx-auto mb-3 text-gray-200" />
            <p className="text-gray-400 font-medium">
              {arama ? `"${arama}" için sayım bulunamadı.` : 'Henüz sayım yok.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
            {sayimlar.map(s => {
              const d = DURUM_MAP[s.durum] || DURUM_MAP.devam;
              return (
                <button key={s.id}
                  onClick={() => setSeciliSayimId(s.id)}
                  className="bg-white rounded-xl px-3 py-2.5 border border-gray-100 hover:border-teal-200 hover:shadow-sm transition-all text-left flex flex-col gap-2">

                  {/* Üst: başlık + durum */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ background: GRAD.teal }}>
                        <ClipboardList className="w-3.5 h-3.5 text-white" />
                      </div>
                      <p className="text-sm font-semibold text-gray-900 truncate leading-tight">{s.ad}</p>
                    </div>
                    <span className="flex items-center gap-1 text-xs font-semibold px-1.5 py-0.5 rounded-full flex-shrink-0"
                      style={{ background: d.bg, color: d.color }}>
                      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: d.dot }} />
                      {d.label}
                    </span>
                  </div>

                  {/* Alt: meta bilgileri */}
                  <div className="space-y-1">
                    {s.depolar?.ad && (
                      <div className="flex items-center gap-1.5 text-xs text-gray-500">
                        <Warehouse className="w-3 h-3 flex-shrink-0 text-gray-400" />
                        <span className="truncate">{s.depolar.ad}</span>
                      </div>
                    )}
                    {s.isletmeler?.ad && (
                      <div className="flex items-center gap-1.5 text-xs text-gray-500">
                        <Building2 className="w-3 h-3 flex-shrink-0 text-gray-400" />
                        <span className="truncate">{s.isletmeler.ad}</span>
                      </div>
                    )}
                  </div>

                  {/* En alt: tarih + kullanıcı */}
                  <div className="flex items-center gap-3 text-xs text-gray-400 border-t border-gray-100 pt-1.5 mt-0.5">
                    {s.tarih && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(s.tarih).toLocaleDateString('tr-TR')}
                      </span>
                    )}
                    {s.kullanicilar?.ad_soyad && (
                      <span className="flex items-center gap-1 truncate">
                        <User className="w-3 h-3 flex-shrink-0" />
                        <span className="truncate">{s.kullanicilar.ad_soyad}</span>
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
        {/* Sayfalama */}
        {sayfaSayisi > 1 && (
          <div className="flex items-center justify-center gap-3 py-2">
            <button onClick={() => setSayfa(s => s - 1)} disabled={sayfa === 1}
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
              <ChevronLeft className="w-4 h-4 text-gray-600" />
            </button>
            <span className="text-sm text-gray-500">
              <span className="font-bold text-gray-900">{sayfa}</span> / {sayfaSayisi}
            </span>
            <button onClick={() => setSayfa(s => s + 1)} disabled={sayfa === sayfaSayisi}
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
              <ChevronRight className="w-4 h-4 text-gray-600" />
            </button>
          </div>
        )}
      </div>

      {/* Detay Modal */}
      {seciliSayimId && (
        <SayimDetayModal
          sayimId={seciliSayimId}
          onClose={() => setSeciliSayimId(null)}
          onStatusChange={getSayimlar}
        />
      )}
    </div>
  );
}
