import { useCallback, useEffect, useState, useRef } from 'react';
import toast from 'react-hot-toast';
import { Warehouse, Building2, MapPin, Plus, Pencil, ClipboardList, Search, ChevronDown, Check, X, ChevronRight, Calendar, User, Package, LockKeyhole, LockKeyholeOpen, ChevronLeft, FileText, FileSpreadsheet, RotateCcw } from 'lucide-react';
import api from '../../lib/apiAdm';
import useAuthStoreAdm from '../../store/authStoreAdm';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

const GRAD = {
  indigo: 'linear-gradient(135deg,#6366F1,#8B5CF6)',
  blue: 'linear-gradient(135deg,#0EA5E9,#2563EB)',
  green: 'linear-gradient(135deg,#10B981,#059669)',
  amber: 'linear-gradient(135deg,#F59E0B,#D97706)',
};

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

  // Dışarı tıklayınca kapat
  useEffect(() => {
    const handler = e => { if (ref.current && !ref.current.contains(e.target)) setAcik(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const toggle = (id) => {
    onChange(secili.includes(id) ? secili.filter(s => s !== id) : [...secili, id]);
  };
  const temizle = (e) => { e.stopPropagation(); onChange([]); };

  const label = secili.length === 0
    ? 'Tüm İşletmeler'
    : secili.length === 1
      ? isletmeler.find(i => i.id === secili[0])?.ad || '1 İşletme'
      : `${secili.length} İşletme Seçili`;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setAcik(v => !v)}
        className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl border bg-white text-sm font-medium transition-colors min-w-[180px]"
        style={{
          borderColor: secili.length > 0 ? '#6366F1' : '#E5E7EB',
          color: secili.length > 0 ? '#6366F1' : '#374151',
        }}
      >
        <Building2 className="w-4 h-4 flex-shrink-0" />
        <span className="flex-1 text-left truncate">{label}</span>
        {secili.length > 0 ? (
          <X className="w-3.5 h-3.5 flex-shrink-0 hover:text-red-500 transition-colors" onClick={temizle} />
        ) : (
          <ChevronDown className={`w-4 h-4 flex-shrink-0 transition-transform ${acik ? 'rotate-180' : ''}`} />
        )}
      </button>

      {acik && (
        <div className="absolute top-full left-0 mt-1.5 bg-white rounded-2xl shadow-xl border border-gray-100 z-20 py-2 min-w-[220px] max-h-64 overflow-y-auto">
          {/* Tümünü seç / kaldır */}
          <button
            onClick={() => onChange(secili.length === isletmeler.length ? [] : isletmeler.map(i => i.id))}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-semibold hover:bg-gray-50 transition-colors text-gray-600 border-b border-gray-100 mb-1"
          >
            <div className={`w-4.5 h-4.5 w-[18px] h-[18px] rounded flex items-center justify-center border-2 flex-shrink-0 transition-colors ${
              secili.length === isletmeler.length ? 'border-indigo-500 bg-indigo-500' : 'border-gray-300'
            }`}>
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
                <div className={`w-[18px] h-[18px] rounded flex items-center justify-center border-2 flex-shrink-0 transition-colors ${
                  aktif ? 'border-indigo-500 bg-indigo-500' : 'border-gray-300'
                }`}>
                  {aktif && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                </div>
                <span className={`flex-1 text-left truncate ${aktif ? 'font-semibold text-gray-900' : 'text-gray-600'}`}>{i.ad}</span>
                {i.kod && <span className="text-xs font-mono text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">{i.kod}</span>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ── Export yardımcıları ── */
function exportPDF(sayim, kalemler) {
  const doc = new jsPDF();

  // Başlık
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(sayim.ad || 'Sayım Raporu', 14, 18);

  // Bilgi satırları
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100);
  let y = 28;
  const bilgiler = [
    ['Depo',      sayim.depolar?.ad],
    ['İşletme',   sayim.isletmeler?.ad],
    ['Tarih',     sayim.tarih ? new Date(sayim.tarih).toLocaleDateString('tr-TR') : null],
    ['Kullanıcı', sayim.kullanicilar?.ad_soyad],
    ['Durum',     sayim.durum === 'tamamlandi' ? 'Tamamlandı' : 'Devam Ediyor'],
    ['Notlar',    sayim.notlar],
  ].filter(([, v]) => v);

  bilgiler.forEach(([k, v]) => {
    doc.setFont('helvetica', 'bold');
    doc.text(`${k}:`, 14, y);
    doc.setFont('helvetica', 'normal');
    doc.text(String(v), 45, y);
    y += 6;
  });

  // Tablo
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
    headStyles: { fillColor: [99, 102, 241], fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [248, 249, 250] },
  });

  const dosyaAdi = `${(sayim.ad || 'sayim').replace(/\s+/g, '_')}.pdf`;
  doc.save(dosyaAdi);
}

function exportExcel(sayim, kalemler) {
  const wb = XLSX.utils.book_new();

  // ── Bilgi sayfası ──
  const bilgiRows = [
    ['Sayım Adı',  sayim.ad || ''],
    ['Depo',       sayim.depolar?.ad || ''],
    ['İşletme',    sayim.isletmeler?.ad || ''],
    ['Tarih',      sayim.tarih ? new Date(sayim.tarih).toLocaleDateString('tr-TR') : ''],
    ['Kullanıcı',  sayim.kullanicilar?.ad_soyad || ''],
    ['Durum',      sayim.durum === 'tamamlandi' ? 'Tamamlandı' : 'Devam Ediyor'],
    ['Notlar',     sayim.notlar || ''],
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

  const ws = XLSX.utils.aoa_to_sheet(bilgiRows);

  // Sütun genişlikleri
  ws['!cols'] = [
    { wch: 5 },   // #
    { wch: 35 },  // Ürün Adı
    { wch: 25 },  // İkinci İsim
    { wch: 18 },  // Ürün Kodu
    { wch: 10 },  // Miktar
    { wch: 10 },  // Birim
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Sayım');

  const dosyaAdi = `${(sayim.ad || 'sayim').replace(/\s+/g, '_')}.xlsx`;
  XLSX.writeFile(wb, dosyaAdi);
}


/* ── Sayım Detay Modalı ── */
function SayimDetayModal({ sayimId, onClose, onStatusChange }) {
  const { kullanici } = useAuthStoreAdm();
  const isAdmin = kullanici?.rol === 'admin';
  const [sayim, setSayim]     = useState(null);
  const [kalemler, setKalemler] = useState([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [islem, setIslem]     = useState(false);

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

  const handlePDF = () => {
    if (!sayim) return;
    try { exportPDF(sayim, kalemler); }
    catch { toast.error('PDF oluşturulamadı.'); }
  };

  const handleExcel = () => {
    if (!sayim) return;
    try { exportExcel(sayim, kalemler); }
    catch { toast.error('Excel oluşturulamadı.'); }
  };

  const eylem = async (tip) => {
    setIslem(true);
    try {
      await api.put(`/sayimlar/${sayimId}/${tip}`);
      toast.success(tip === 'tamamla' ? 'Sayım kapatıldı.' : 'Sayım yeniden açıldı.');
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
            {[1,2,3].map(i => <div key={i} className="h-10 bg-gray-100 rounded-xl animate-pulse" />)}
          </div>
        ) : sayim && (
          <>
            {/* Bilgi satırları */}
            <div className="px-5 py-4 space-y-2.5 border-b border-gray-100">
              {[
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
                      <span className="ml-3 text-sm font-bold text-gray-700">{k.miktar} <span className="text-xs font-normal text-gray-400">{k.birim || ''}</span></span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* İndirme butonları */}
            <div className="px-5 pt-4 pb-2 grid grid-cols-2 gap-2">
              <button
                onClick={handlePDF}
                className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-semibold border transition-colors hover:bg-red-50"
                style={{ borderColor: '#FECACA', color: '#DC2626', background: '#FEF2F2' }}
              >
                <FileText className="w-4 h-4" />
                PDF İndir
              </button>
              <button
                onClick={handleExcel}
                className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-semibold border transition-colors hover:bg-green-50"
                style={{ borderColor: '#BBF7D0', color: '#15803D', background: '#F0FDF4' }}
              >
                <FileSpreadsheet className="w-4 h-4" />
                Excel İndir
              </button>
            </div>

            {/* Aksiyon butonları */}
            <div className="px-5 py-3 border-t border-gray-100 flex gap-3">
              {sayim.durum === 'devam' && (
                <button onClick={() => eylem('tamamla')} disabled={islem}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold text-white transition-opacity"
                  style={{ background: 'linear-gradient(135deg,#10B981,#059669)', opacity: islem ? 0.7 : 1 }}>
                  <LockKeyhole className="w-4 h-4" />
                  Sayımı Kapat
                </button>
              )}
              {sayim.durum !== 'devam' && isAdmin && (
                <button onClick={() => eylem('yeniden-ac')} disabled={islem}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold text-white transition-opacity"
                  style={{ background: 'linear-gradient(135deg,#6366F1,#8B5CF6)', opacity: islem ? 0.7 : 1 }}>
                  <LockKeyholeOpen className="w-4 h-4" />
                  Sayımı Aç
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ── Sayımlar Yan Paneli ── */
const DURUM_MAP = {
  devam:       { label: 'Devam Ediyor', bg: '#EFF6FF', color: '#2563EB', dot: '#3B82F6' },
  tamamlandi:  { label: 'Tamamlandı',   bg: '#F0FDF4', color: '#15803D', dot: '#22C55E' },
  silindi:     { label: 'Silinmiş',     bg: '#FEF2F2', color: '#DC2626', dot: '#EF4444' },
};

function SayimlarPanel({ depo, onClose }) {
  const [sayimlar, setSayimlar] = useState([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [seciliSayimId, setSeciliSayimId] = useState(null);

  const fetchSayimlar = () => {
    if (!depo) return;
    setYukleniyor(true);
    api.get(`/sayimlar?isletme_id=${depo.isletme_id}&depo_id=${depo.id}&limit=500`)
      .then(r => setSayimlar((r.data.data || []).filter(s => s.durum !== 'silindi')))
      .catch(() => toast.error('Sayımlar yüklenemedi.'))
      .finally(() => setYukleniyor(false));
  };

  useEffect(() => { fetchSayimlar(); }, [depo]);

  if (!depo) return null;

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div className="fixed right-0 top-0 h-full z-50 w-full sm:w-[420px] bg-white shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: GRAD.blue }}>
            <Warehouse className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-bold text-gray-900 truncate">{depo.ad}</h2>
            <p className="text-xs text-gray-400 truncate">{depo.isletme_adi}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-100 transition-colors">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {/* Sayım sayısı özeti */}
        {!yukleniyor && (
          <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-2">
            <ClipboardList className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-500">
              <span className="font-bold text-gray-900">{sayimlar.length}</span> sayım bulundu
            </span>
          </div>
        )}

        {/* Liste */}
        <div className="flex-1 overflow-y-auto">
          {yukleniyor ? (
            <div className="p-5 space-y-3">
              {[1, 2, 3].map(i => <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />)}
            </div>
          ) : sayimlar.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-center px-8">
              <ClipboardList className="w-10 h-10 text-gray-200 mb-3" />
              <p className="text-gray-400 font-medium text-sm">Bu depoya ait sayım yok</p>
            </div>
          ) : (
            <div className="p-4 space-y-2">
              {sayimlar.map(s => {
                const d = DURUM_MAP[s.durum] || DURUM_MAP.devam;
                return (
                  <button key={s.id} onClick={() => setSeciliSayimId(s.id)}
                    className="w-full text-left bg-white border border-gray-100 rounded-xl p-4 hover:shadow-sm hover:border-indigo-200 transition-all">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="font-semibold text-gray-900 text-sm leading-tight flex-1">{s.ad}</h3>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <span className="flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full"
                          style={{ background: d.bg, color: d.color }}>
                          <span className="w-1.5 h-1.5 rounded-full" style={{ background: d.dot }} />
                          {d.label}
                        </span>
                        <ChevronRight className="w-4 h-4 text-gray-300" />
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-gray-400">
                      {s.tarih && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(s.tarih).toLocaleDateString('tr-TR')}
                        </span>
                      )}
                      {s.kullanicilar?.ad_soyad && (
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {s.kullanicilar.ad_soyad}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Sayım Detay Modalı */}
      {seciliSayimId && (
        <SayimDetayModal
          sayimId={seciliSayimId}
          onClose={() => setSeciliSayimId(null)}
          onStatusChange={fetchSayimlar}
        />
      )}
    </>
  );
}

function Modal({ open, onClose, onSave, initial, isletmeler }) {
  const [form, setForm] = useState({ isletme_id: '', ad: '', kod: '', konum: '' });
  const [loading, setLoading] = useState(false);
  useEffect(() => { setForm(initial || { isletme_id: '', ad: '', kod: '', konum: '' }); }, [initial, open]);
  if (!open) return null;
  const submit = async e => { e.preventDefault(); setLoading(true); await onSave(form); setLoading(false); };
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: GRAD.blue }}>
            <Warehouse className="w-5 h-5 text-white" />
          </div>
          <h3 className="text-lg font-bold text-gray-900">{initial?.id ? 'Depo Düzenle' : 'Yeni Depo'}</h3>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">İşletme *</label>
            <select value={form.isletme_id} disabled={!!initial?.id} required
              onChange={e => setForm({ ...form, isletme_id: e.target.value })}
              className="w-full px-4 py-2.5 text-sm rounded-xl border border-gray-200 outline-none bg-gray-50 disabled:opacity-50">
              <option value="">Seçin...</option>
              {isletmeler.map(i => <option key={i.id} value={i.id}>{i.ad}</option>)}
            </select>
          </div>
          {[{ l: 'Ad *', k: 'ad' }, { l: 'Kod', k: 'kod' }, { l: 'Konum', k: 'konum', ph: 'Örn: 2. kat, raf A' }].map(f => (
            <div key={f.k}>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">{f.l}</label>
              <input type="text" value={form[f.k] || ''} required={f.l.includes('*')} placeholder={f.ph || ''}
                onChange={e => setForm({ ...form, [f.k]: f.k === 'kod' ? e.target.value.toUpperCase() : e.target.value })}
                className="w-full px-4 py-2.5 text-sm rounded-xl border border-gray-200 outline-none focus:border-indigo-400 bg-gray-50" />
            </div>
          ))}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-3 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50">İptal</button>
            <button type="submit" disabled={loading} className="flex-1 py-3 rounded-xl text-sm font-bold text-white" style={{ background: GRAD.blue }}>
              {loading ? 'Kaydediliyor...' : 'Kaydet'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const LIMIT = 50;

export default function DepolarPage() {
  const [depolar, setDepolar] = useState([]);
  const [isletmeler, setIsletmeler] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState('');
  const [aramaDebounce, setAramaDebounce] = useState('');
  const [seciliIsletmeler, setSeciliIsletmeler] = useState([]);
  const [sayimlarDepo, setSayimlarDepo] = useState(null);
  const [sayfa, setSayfa] = useState(1);
  const [toplam, setToplam] = useState(0);
  const [aktifFiltre, setAktifFiltre] = useState('aktif'); // 'tumu' | 'aktif' | 'pasif'
  const [geriAlDepo, setGeriAlDepo]   = useState(null);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => { setAramaDebounce(search); setSayfa(1); }, 350);
    return () => clearTimeout(t);
  }, [search]);

  // İşletmeleri bir kez yükle (modal + filtre için)
  useEffect(() => {
    api.get('/isletmeler').then(r => setIsletmeler(r.data || []));
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const p = new URLSearchParams({ sayfa, limit: LIMIT });
      if (aramaDebounce) p.set('q', aramaDebounce);
      if (seciliIsletmeler.length === 1) p.set('isletme_id', seciliIsletmeler[0]);
      else if (seciliIsletmeler.length > 1) p.set('isletme_ids', seciliIsletmeler.join(','));
      if (aktifFiltre === 'aktif') p.set('aktif', 'true');
      else if (aktifFiltre === 'pasif') p.set('aktif', 'false');
      const { data } = await api.get(`/depolar?${p}`);
      // Backend returns sayim_sayisi and isletmeler join
      setDepolar((data.data || []).map(d => ({
        ...d,
        isletme_adi: d.isletmeler?.ad,
        isletme_aktif: d.isletmeler?.aktif,
        sayimSayisi: d.sayim_sayisi || 0,
      })));
      setToplam(data.toplam || 0);
    } catch { toast.error('Depolar yüklenemedi.'); }
    finally { setLoading(false); }
  }, [sayfa, aramaDebounce, seciliIsletmeler, aktifFiltre]);

  useEffect(() => { load(); }, [load]);

  const handleSeciliIsletmelerChange = (val) => { setSeciliIsletmeler(val); setSayfa(1); };

  const handleGeriAl = async () => {
    if (!geriAlDepo) return;
    try {
      await api.put(`/depolar/${geriAlDepo.id}/restore`);
      toast.success('Depo geri alındı.');
      setGeriAlDepo(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.hata || 'Geri alma başarısız.');
    }
  };

  const handleSave = async (form) => {
    try {
      editing?.id ? await api.put(`/depolar/${editing.id}`, form) : await api.post('/depolar', form);
      toast.success(editing?.id ? 'Güncellendi.' : 'Eklendi.'); setModalOpen(false); setEditing(null); load();
    } catch (err) { toast.error(err.response?.data?.hata || 'Hata.'); }
  };

  const sayfaSayisi = Math.max(1, Math.ceil(toplam / LIMIT));

  return (
    <div className="flex flex-col h-full">
      <PageHeader title="Depo Yönetimi" stats={[
        { icon: Warehouse, label: 'Toplam Depo', value: toplam, color: GRAD.blue },
        { icon: Building2, label: 'İşletme', value: isletmeler.length, color: GRAD.indigo },
      ]} />

      <div className="p-4 sm:p-6 lg:p-8 flex-1 space-y-4">
        {/* Toolbar */}
        <div className="flex gap-2 flex-wrap items-center">
          {/* Arama */}
          <div className="relative flex-1 min-w-[140px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" placeholder="Depo ara..." value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-gray-200 bg-white outline-none focus:border-indigo-400" />
          </div>
          {/* İşletme filtresi */}
          <IsletmeFiltre
            isletmeler={isletmeler}
            secili={seciliIsletmeler}
            onChange={handleSeciliIsletmelerChange}
          />
          {/* Aktif/Pasif filtre */}
          <div className="flex bg-white rounded-xl border border-gray-200 p-1">
            {[{ k: 'tumu', l: 'Tümü' }, { k: 'aktif', l: 'Aktif' }, { k: 'pasif', l: 'Pasif' }].map(f => (
              <button key={f.k} onClick={() => { setAktifFiltre(f.k); setSayfa(1); }}
                className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all"
                style={aktifFiltre === f.k ? { background: '#6366F1', color: 'white' } : { color: '#94A3B8' }}>
                {f.l}
              </button>
            ))}
          </div>

          {/* Yeni Depo */}
          <button onClick={() => { setEditing(null); setModalOpen(true); }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white shadow-sm whitespace-nowrap flex-shrink-0"
            style={{ background: GRAD.blue }}>
            <Plus className="w-4 h-4" />Yeni Depo
          </button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
            {[1, 2, 3, 4].map(i => <div key={i} className="h-28 bg-white rounded-xl animate-pulse" />)}
          </div>
        ) : depolar.length === 0 ? (
          <div className="bg-white rounded-2xl p-16 text-center border border-gray-100">
            <Warehouse className="w-12 h-12 mx-auto mb-3 text-gray-200" />
            <p className="text-gray-400 font-medium">Depo bulunamadı.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
            {depolar.map(d => {
              const pasif = d.aktif === 0 || d.aktif === false;
              return (
              <div key={d.id} className={`rounded-xl px-3 py-2.5 border transition-all flex flex-col gap-2 ${pasif ? 'bg-red-50 border-red-200' : 'bg-white border-gray-100 hover:border-blue-100 hover:shadow-sm'}`}>
                {/* Üst: ikon + ad + badges */}
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: pasif ? 'linear-gradient(135deg,#EF4444,#DC2626)' : GRAD.blue }}>
                    <Warehouse className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h3 className={`font-semibold text-sm truncate leading-tight ${pasif ? 'text-red-400 line-through' : 'text-gray-900'}`}>{d.ad}</h3>
                      {pasif && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0"
                          style={{ background: '#FEE2E2', color: '#DC2626' }}>Silinmiş</span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 mt-0.5 flex-wrap">
                      {d.kod && <span className="text-[11px] font-mono bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full">{d.kod}</span>}
                      {d.isletme_adi && (
                        <span className="text-[11px] font-medium px-1.5 py-0.5 rounded-full flex items-center gap-0.5"
                          style={{ background: d.isletme_aktif === false ? '#FEE2E2' : '#EEF2FF', color: d.isletme_aktif === false ? '#DC2626' : '#6366F1' }}>
                          <Building2 className="w-2.5 h-2.5" />{d.isletme_adi}
                          {d.isletme_aktif === false && <span className="font-black">(Pasif)</span>}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                {d.konum && (
                  <div className="flex items-center gap-1.5 text-xs text-gray-400">
                    <MapPin className="w-3 h-3 flex-shrink-0" /><span className="truncate">{d.konum}</span>
                  </div>
                )}
                {/* Butonlar */}
                <div className="flex gap-1.5 border-t border-gray-100 pt-2">
                  {pasif ? (
                    <button onClick={() => setGeriAlDepo(d)}
                      className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs font-semibold border border-green-200 hover:bg-green-100 text-green-600 transition-colors"
                      style={{ background: '#DCFCE7' }}>
                      <RotateCcw className="w-3 h-3" />Geri Al
                    </button>
                  ) : (
                    <>
                      <button onClick={() => setSayimlarDepo(d)}
                        className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs font-semibold border border-gray-200 hover:bg-gray-50 text-gray-600 transition-colors">
                        <ClipboardList className="w-3 h-3" />Sayımlar
                        {d.sayimSayisi > 0 && (
                          <span className="px-1.5 py-0.5 rounded-full text-[10px] font-black"
                            style={{ background: '#F0FDF4', color: '#15803D' }}>
                            {d.sayimSayisi}
                          </span>
                        )}
                      </button>
                      <button onClick={() => { setEditing(d); setModalOpen(true); }}
                        className="w-8 flex items-center justify-center py-1.5 rounded-lg border border-gray-200 hover:bg-indigo-50 transition-colors"
                        style={{background:'#EEF2FF'}} title="Düzenle">
                        <Pencil className="w-3.5 h-3.5" style={{color:'#6366F1'}}/>
                      </button>
                    </>
                  )}
                </div>
              </div>
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
      <Modal open={modalOpen} onClose={() => { setModalOpen(false); setEditing(null); }} onSave={handleSave} initial={editing} isletmeler={isletmeler} />
      <SayimlarPanel depo={sayimlarDepo} onClose={() => setSayimlarDepo(null)} />

      {/* Geri Al Onay Modalı */}
      {geriAlDepo && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(3px)' }}
          onClick={() => setGeriAlDepo(null)}>
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden p-6"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: '#DCFCE7' }}>
                <RotateCcw className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="font-bold text-gray-900 text-sm">Depoyu Geri Al</p>
                <p className="text-xs text-gray-400">Bu depo tekrar aktif olacak</p>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-5">
              <span className="font-bold">{geriAlDepo.ad}</span> geri alınacak. Devam etmek istiyor musunuz?
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => setGeriAlDepo(null)}
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
