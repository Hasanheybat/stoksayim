import { useEffect, useRef, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import {
  Calculator, Building2, Search, X, ChevronDown, Check,
  Calendar, User, ClipboardList, ChevronLeft, ChevronRight,
  Info, Pencil, Trash2, Package, FileText, FileSpreadsheet, RotateCcw,
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
  purple: 'linear-gradient(135deg,#6366F1,#4F46E5)',
};

const GRADS = [
  'linear-gradient(135deg,#6366F1,#8B5CF6)',
  'linear-gradient(135deg,#0EA5E9,#2563EB)',
  'linear-gradient(135deg,#10B981,#059669)',
  'linear-gradient(135deg,#F59E0B,#D97706)',
  'linear-gradient(135deg,#EC4899,#DB2777)',
];

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

/* ── Kaynak sayımları parse et ── */
function parseKaynaklar(notlar) {
  try {
    if (!notlar) return [];
    const obj = typeof notlar === 'string' ? JSON.parse(notlar) : notlar;
    return obj?.toplanan_sayimlar || [];
  } catch { return []; }
}

function formatTarih(tarih) {
  if (!tarih) return '';
  try {
    return new Date(tarih).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  } catch { return tarih; }
}

/* ── Export helpers ── */
function exportPDF(sayim, kalemler) {
  const doc = new jsPDF();
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(sayim.ad || 'Toplanmış Sayım', 14, 18);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100);
  let y = 28;
  const bilgiler = [
    ['Isletme',   sayim.isletmeler?.ad],
    ['Tarih',     sayim.tarih ? new Date(sayim.tarih).toLocaleDateString('tr-TR') : null],
    ['Kullanici', sayim.kullanicilar?.ad_soyad],
  ].filter(([, v]) => v);
  bilgiler.forEach(([k, v]) => {
    doc.setFont('helvetica', 'bold'); doc.text(`${k}:`, 14, y);
    doc.setFont('helvetica', 'normal'); doc.text(String(v), 45, y);
    y += 6;
  });
  autoTable(doc, {
    startY: y + 4,
    head: [['#', 'Urun Adi', 'Ikinci Isim', 'Urun Kodu', 'Miktar', 'Birim']],
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
  doc.save(`${(sayim.ad || 'toplanmis-sayim').replace(/\s+/g, '_')}.pdf`);
}

function exportExcel(sayim, kalemler) {
  const wb = XLSX.utils.book_new();
  const rows = [
    ['Sayım Adı',  sayim.ad || ''],
    ['İşletme',    sayim.isletmeler?.ad || ''],
    ['Tarih',      sayim.tarih ? new Date(sayim.tarih).toLocaleDateString('tr-TR') : ''],
    ['Kullanıcı',  sayim.kullanicilar?.ad_soyad || ''],
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
  XLSX.utils.book_append_sheet(wb, ws, 'Toplanmış Sayım');
  XLSX.writeFile(wb, `${(sayim.ad || 'toplanmis-sayim').replace(/\s+/g, '_')}.xlsx`);
}

/* ── Detay Modal — kalemler + PDF/Excel ── */
function DetayModal({ sayimId, sayimObj, onClose }) {
  const [sayim, setSayim]       = useState(sayimObj || null);
  const [kalemler, setKalemler] = useState([]);
  const [yukleniyor, setYukleniyor] = useState(true);

  useEffect(() => {
    if (!sayimId) return;
    setYukleniyor(true);
    Promise.all([
      sayimObj ? Promise.resolve({ data: sayimObj }) : api.get(`/sayimlar/${sayimId}`),
      api.get(`/sayimlar/${sayimId}/kalemler`),
    ]).then(([rs, rk]) => {
      if (!sayimObj) setSayim(rs.data);
      setKalemler(rk.data || []);
    }).catch(() => toast.error('Detay yüklenemedi.'))
      .finally(() => setYukleniyor(false));
  }, [sayimId]);

  const kaynaklar = parseKaynaklar(sayim?.notlar);

  return (
    <div className="fixed inset-0 z-[60] flex flex-col justify-end sm:items-center sm:justify-center p-0 sm:p-4"
      style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(3px)' }}
      onClick={onClose}>
      <div className="bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
        onClick={e => e.stopPropagation()}>

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
            <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full mt-0.5"
              style={{ background: '#EEF2FF', color: '#6366F1' }}>
              <Calculator className="w-3 h-3" />
              Toplanmış Sayım
            </span>
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
                { label: 'İşletme',   value: sayim.isletmeler?.ad },
                { label: 'Tarih',     value: formatTarih(sayim.tarih) },
                { label: 'Kullanıcı', value: sayim.kullanicilar?.ad_soyad },
                { label: 'Toplanan',  value: `${kaynaklar.length} sayım birleştirildi` },
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
                <div className="text-center py-8 text-sm text-gray-400">Kalem bulunamadı</div>
              ) : (
                <div className="divide-y divide-gray-50 max-h-64 overflow-y-auto">
                  {kalemler.map(k => {
                    const urun = k.isletme_urunler || {};
                    const pasif = urun.aktif === 0 || urun.aktif === false;
                    return (
                      <div key={k.id}
                        className="px-5 py-3 cursor-pointer hover:bg-gray-50 transition-colors"
                        onClick={() => setKalemler(prev => prev.map(p => p.id === k.id ? { ...p, _acik: !p._acik } : p))}
                      >
                        <div className="flex items-center justify-between">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <p className={`text-sm font-medium truncate ${pasif ? 'text-red-500' : 'text-gray-900'}`}>{urun.urun_adi || '—'}</p>
                              {pasif && (
                                <span className="shrink-0 px-1.5 py-0.5 text-[10px] font-bold text-red-600 bg-red-50 border border-red-200 rounded">Pasif</span>
                              )}
                            </div>
                            {urun.isim_2 && <p className="text-xs text-indigo-500 truncate">{urun.isim_2}</p>}
                          </div>
                          <div className="ml-3 flex items-center gap-2">
                            <span className="text-sm font-bold text-gray-700">
                              {k.miktar} <span className="text-xs font-normal text-gray-400">{k.birim || ''}</span>
                            </span>
                            <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform ${k._acik ? 'rotate-180' : ''}`} />
                          </div>
                        </div>
                        {k._acik && (
                          <div className="mt-2 p-2.5 bg-gray-50 rounded-lg border border-gray-100 grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                            {urun.urun_kodu && (
                              <><span className="text-gray-400 font-medium">Ürün Kodu</span><span className="text-gray-700 font-semibold text-right">{urun.urun_kodu}</span></>
                            )}
                            {urun.isim_2 && (
                              <><span className="text-gray-400 font-medium">İkinci İsim</span><span className="text-gray-700 font-semibold text-right">{urun.isim_2}</span></>
                            )}
                            {urun.barkodlar && (
                              <><span className="text-gray-400 font-medium">Barkod</span><span className="text-gray-700 font-semibold text-right">{urun.barkodlar}</span></>
                            )}
                            <span className="text-gray-400 font-medium">Birim</span><span className="text-gray-700 font-semibold text-right">{k.birim || 'ADET'}</span>
                            {pasif && (
                              <><span className="text-gray-400 font-medium">Durum</span><span className="text-red-600 font-semibold text-right">Pasif Ürün</span></>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
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

            {/* Kapat */}
            <div className="px-5 py-3">
              <button onClick={onClose}
                className="w-full py-3 rounded-xl text-sm font-bold text-gray-500 transition-colors hover:bg-gray-50"
                style={{ background: '#F3F4F6' }}>
                Kapat
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ── Info Modal ── */
function InfoModal({ sayim, onClose }) {
  const kaynaklar = parseKaynaklar(sayim.notlar);
  return (
    <div className="fixed inset-0 z-[60] flex flex-col justify-end sm:items-center sm:justify-center p-0 sm:p-4"
      style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(3px)' }}
      onClick={onClose}>
      <div className="bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
        onClick={e => e.stopPropagation()}>

        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-10 h-1 rounded-full bg-gray-200" />
        </div>

        <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-100 transition-colors -ml-1">
            <ChevronLeft className="w-5 h-5 text-gray-500" />
          </button>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-gray-900 truncate">{sayim.ad}</h3>
            <p className="text-xs text-gray-400">Toplanan sayımların detayları</p>
          </div>
        </div>

        <div className="px-5 py-4 space-y-2.5 border-b border-gray-100">
          {[
            { label: 'Sayım ID', value: `#${sayim.id?.split('-')[0]?.toUpperCase()}` },
            { label: 'İşletme', value: sayim.isletmeler?.ad },
            { label: 'Tarih', value: formatTarih(sayim.tarih) },
            { label: 'Kullanıcı', value: sayim.kullanicilar?.ad_soyad },
          ].filter(r => r.value).map(r => (
            <div key={r.label} className="flex items-center justify-between gap-4">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{r.label}</span>
              <span className="text-sm text-gray-700 text-right">{r.value}</span>
            </div>
          ))}
        </div>

        <div className="px-5 py-3 flex items-center gap-2 border-b border-gray-100">
          <Calculator className="w-4 h-4 text-gray-400" />
          <span className="text-sm text-gray-500">
            <span className="font-bold text-gray-900">{kaynaklar.length}</span> sayım toplandı
          </span>
        </div>

        <div className="flex-1 overflow-y-auto max-h-64">
          {kaynaklar.length === 0 ? (
            <div className="text-center py-8 text-sm text-gray-400">Kaynak bilgisi bulunamadı</div>
          ) : (
            <div className="divide-y divide-gray-50 px-5">
              {kaynaklar.map((k, i) => (
                <div key={i} className="flex items-center gap-3 py-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 font-black text-xs text-white"
                    style={{ background: GRADS[i % GRADS.length] }}>
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{k.ad}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-gray-400 font-mono">#{k.id?.split('-')[0]?.toUpperCase()}</span>
                      {k.tarih && <span className="text-[10px] text-gray-400">{formatTarih(k.tarih)}</span>}
                      {k.depo && <span className="text-[10px] text-gray-400">{k.depo}</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="px-5 py-4 border-t border-gray-100">
          <button onClick={onClose}
            className="w-full py-3 rounded-xl text-sm font-bold text-gray-500 transition-colors hover:bg-gray-50"
            style={{ background: '#F3F4F6' }}>
            Kapat
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Düzenle Modal ── */
function DuzenleModal({ sayim, onClose, onSave, onDelete }) {
  const [isim, setIsim] = useState(sayim.ad);
  const [yukleniyor, setYukleniyor] = useState(false);

  const kaydet = async () => {
    if (!isim.trim() || isim.trim() === sayim.ad) return;
    setYukleniyor(true);
    try {
      await api.put(`/sayimlar/${sayim.id}`, { ad: isim.trim() });
      toast.success('İsim güncellendi');
      onSave();
    } catch {
      toast.error('Güncelleme başarısız');
    }
    setYukleniyor(false);
  };

  return (
    <div className="fixed inset-0 z-[60] flex flex-col justify-end sm:items-center sm:justify-center p-0 sm:p-4"
      style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(3px)' }}
      onClick={onClose}>
      <div className="bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}>

        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-10 h-1 rounded-full bg-gray-200" />
        </div>

        <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-100 transition-colors -ml-1">
            <ChevronLeft className="w-5 h-5 text-gray-500" />
          </button>
          <div>
            <h3 className="font-bold text-gray-900">Sayımı Düzenle</h3>
            <p className="text-xs text-gray-400">{sayim.ad}</p>
          </div>
        </div>

        <div className="px-5 py-5">
          <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">Sayım İsmi</label>
          <input
            type="text"
            value={isim}
            onChange={e => setIsim(e.target.value)}
            className="w-full mt-1.5 px-4 py-3 rounded-xl text-sm font-semibold text-gray-800 outline-none border-[1.5px] border-gray-200 focus:border-indigo-400 transition-colors"
            style={{ background: '#F9FAFB' }}
            placeholder="Sayım ismi"
          />
        </div>

        <div className="px-5 pb-5 flex gap-3">
          <button
            onClick={() => onDelete(sayim)}
            disabled={yukleniyor}
            className="py-3 px-5 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-40"
            style={{ background: '#FEF2F2', color: '#EF4444', border: '1px solid #FECACA' }}>
            <Trash2 className="w-4 h-4" />
            Sil
          </button>
          <button
            onClick={kaydet}
            disabled={yukleniyor || !isim.trim() || isim.trim() === sayim.ad}
            className="flex-1 py-3 rounded-xl font-bold text-white flex items-center justify-center gap-2 transition-colors disabled:opacity-40"
            style={{ background: GRAD.indigo }}>
            <Pencil className="w-4 h-4" />
            Kaydet
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Silme Onay Modalı ── */
function SilOnayModal({ sayim, onClose, onConfirm }) {
  const [yukleniyor, setYukleniyor] = useState(false);

  const sil = async () => {
    setYukleniyor(true);
    try {
      await api.delete(`/sayimlar/${sayim.id}`);
      toast.success('Sayım silindi');
      onConfirm();
    } catch {
      toast.error('Silme başarısız');
    }
    setYukleniyor(false);
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(3px)' }}
      onClick={onClose}>
      <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden p-6"
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: '#FEF2F2' }}>
            <Trash2 className="w-5 h-5 text-red-500" />
          </div>
          <div>
            <p className="font-bold text-gray-900 text-sm">Toplanmış Sayımı Sil</p>
            <p className="text-xs text-gray-400">Bu işlem geri alınamaz</p>
          </div>
        </div>
        <p className="text-sm text-gray-600 mb-5">
          <span className="font-bold">{sayim.ad}</span> silinecek. Orijinal sayımlar etkilenmez.
        </p>
        <div className="grid grid-cols-2 gap-3">
          <button onClick={onClose}
            className="py-3 rounded-xl font-bold text-sm text-gray-500 transition-colors"
            style={{ background: '#F3F4F6' }}>
            Vazgeç
          </button>
          <button onClick={sil} disabled={yukleniyor}
            className="py-3 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2 transition-colors disabled:opacity-70"
            style={{ background: '#EF4444' }}>
            {yukleniyor && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
            Evet, Sil
          </button>
        </div>
      </div>
    </div>
  );
}

const LIMIT = 50;

/* ── Ana Sayfa ── */
export default function ToplanmisSayimlarAdminPage() {
  const [isletmeler, setIsletmeler]             = useState([]);
  const [sayimlar, setSayimlar]                 = useState([]);
  const [seciliIsletmeler, setSeciliIsletmeler] = useState([]);
  const [aramaInput, setAramaInput]             = useState('');
  const [arama, setArama]                       = useState('');
  const [yukleniyor, setYukleniyor]             = useState(false);
  const [sayfa, setSayfa]                       = useState(1);
  const [toplam, setToplam]                     = useState(0);

  const [durumFiltre, setDurumFiltre]      = useState('aktif');
  const [geriAlSayim, setGeriAlSayim]    = useState(null);

  // Modals
  const [detaySayim, setDetaySayim]     = useState(null);
  const [infoSayim, setInfoSayim]       = useState(null);
  const [duzenleSayim, setDuzenleSayim] = useState(null);
  const [silSayim, setSilSayim]         = useState(null);

  // Arama debounce
  useEffect(() => {
    const t = setTimeout(() => { setArama(aramaInput); setSayfa(1); }, 350);
    return () => clearTimeout(t);
  }, [aramaInput]);

  // İşletmeleri yükle
  useEffect(() => {
    api.get('/isletmeler').then(r => setIsletmeler(r.data || []));
  }, []);

  // Sayımları yükle
  const getSayimlar = useCallback(async () => {
    setYukleniyor(true);
    try {
      const p = new URLSearchParams({ sayfa, limit: LIMIT, toplama: 1 });
      if (seciliIsletmeler.length === 1) p.set('isletme_id', seciliIsletmeler[0]);
      else if (seciliIsletmeler.length > 1) p.set('isletme_ids', seciliIsletmeler.join(','));
      if (durumFiltre === 'pasif') p.set('durum', 'silindi');
      if (arama) p.set('q', arama);
      const { data: res } = await api.get(`/sayimlar?${p}`);
      let liste = res.data || [];
      if (durumFiltre === 'aktif') liste = liste.filter(s => s.durum !== 'silindi');
      setSayimlar(liste);
      setToplam(res.toplam || 0);
    } catch {
      toast.error('Sayımlar yüklenemedi.');
    } finally {
      setYukleniyor(false);
    }
  }, [sayfa, seciliIsletmeler, durumFiltre, arama]);

  useEffect(() => { getSayimlar(); }, [getSayimlar]);

  const handleIsletmeChange = (v) => { setSeciliIsletmeler(v); setSayfa(1); };
  const handleDurumFiltreChange = (v) => { setDurumFiltre(v); setSayfa(1); };

  const handleGeriAl = async () => {
    if (!geriAlSayim) return;
    try {
      await api.put(`/sayimlar/${geriAlSayim.id}/restore`);
      toast.success('Sayım geri alındı.');
      setGeriAlSayim(null);
      getSayimlar();
    } catch (err) {
      toast.error(err.response?.data?.hata || 'Geri alma başarısız.');
    }
  };

  const sayfaSayisi = Math.max(1, Math.ceil(toplam / LIMIT));

  return (
    <div className="flex flex-col h-full">
      <PageHeader title="Toplanmış Sayımlar" stats={[
        { icon: Calculator,    label: 'Toplam',      value: toplam, color: GRAD.purple },
        { icon: ClipboardList, label: 'Bu Sayfada',  value: sayimlar.length, color: GRAD.teal },
      ]} />

      <div className="p-4 sm:p-6 lg:p-8 flex-1 space-y-4 overflow-auto">

        {/* Toolbar */}
        <div className="flex flex-wrap gap-2 items-center">
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

          <IsletmeFiltre
            isletmeler={isletmeler}
            secili={seciliIsletmeler}
            onChange={handleIsletmeChange}
          />

          {/* Aktif / Pasif toggle */}
          <div className="flex bg-white rounded-xl border border-gray-200 p-1">
            {[{ k: 'tumu', l: 'Tümü' }, { k: 'aktif', l: 'Aktif' }, { k: 'pasif', l: 'Pasif' }].map(f => (
              <button key={f.k} onClick={() => handleDurumFiltreChange(f.k)}
                className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all"
                style={durumFiltre === f.k ? { background: '#6366F1', color: 'white' } : { color: '#94A3B8' }}>
                {f.l}
              </button>
            ))}
          </div>
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
            <Calculator className="w-12 h-12 mx-auto mb-3 text-gray-200" />
            <p className="text-gray-400 font-medium">
              {arama ? `"${arama}" için toplanmış sayım bulunamadı.` : 'Henüz toplanmış sayım yok.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
            {sayimlar.map(s => {
              const kaynaklar = parseKaynaklar(s.notlar);
              const silindi = s.durum === 'silindi';
              return (
                <div key={s.id}
                  onClick={() => setDetaySayim(s)}
                  className={`rounded-xl px-3 py-2.5 border transition-all text-left flex flex-col gap-2 cursor-pointer ${silindi ? 'bg-red-50 border-red-200 hover:border-red-300 hover:shadow-sm' : 'bg-white border-gray-100 hover:border-indigo-200 hover:shadow-sm'}`}>

                  {/* Üst: başlık + kaç sayım toplandı */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ background: silindi ? 'linear-gradient(135deg,#EF4444,#DC2626)' : GRAD.purple }}>
                        {silindi ? <Trash2 className="w-3.5 h-3.5 text-white" /> : <Calculator className="w-3.5 h-3.5 text-white" />}
                      </div>
                      <p className={`text-sm font-semibold truncate leading-tight ${silindi ? 'text-red-500' : 'text-gray-900'}`}>{s.ad}</p>
                    </div>
                    {silindi ? (
                      <span className="flex items-center gap-1 text-xs font-semibold px-1.5 py-0.5 rounded-full flex-shrink-0"
                        style={{ background: '#FEF2F2', color: '#DC2626' }}>
                        <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: '#EF4444' }} />
                        Pasif
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs font-semibold px-1.5 py-0.5 rounded-full flex-shrink-0"
                        style={{ background: '#EEF2FF', color: '#6366F1' }}>
                        <Calculator className="w-3 h-3" />
                        {kaynaklar.length} sayım
                      </span>
                    )}
                  </div>

                  {/* İşletme */}
                  {s.isletmeler?.ad && (
                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                      <Building2 className="w-3 h-3 flex-shrink-0 text-gray-400" />
                      <span className="truncate">{s.isletmeler.ad}</span>
                    </div>
                  )}

                  {/* Alt: tarih + kullanıcı + butonlar + geri al */}
                  <div className={`flex items-center gap-2 border-t pt-1.5 mt-0.5 ${silindi ? 'border-red-200' : 'border-gray-100'}`}>
                    <div className="flex items-center gap-3 text-xs text-gray-400 flex-1 min-w-0">
                      {s.tarih && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatTarih(s.tarih)}
                        </span>
                      )}
                      {s.kullanicilar?.ad_soyad && (
                        <span className="flex items-center gap-1 truncate">
                          <User className="w-3 h-3 flex-shrink-0" />
                          <span className="truncate">{s.kullanicilar.ad_soyad}</span>
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {silindi ? (
                        <button onClick={(e) => { e.stopPropagation(); setGeriAlSayim(s); }}
                          className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold border border-green-200 hover:bg-green-100 text-green-600 transition-colors"
                          style={{ background: '#DCFCE7' }}>
                          <RotateCcw className="w-3 h-3" />Geri Al
                        </button>
                      ) : (
                        <>
                          <button
                            onClick={(e) => { e.stopPropagation(); setInfoSayim(s); }}
                            className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-indigo-50 transition-colors"
                            title="Kaynak Sayımlar">
                            <Info className="w-3.5 h-3.5 text-indigo-500" />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); setDuzenleSayim(s); }}
                            className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-amber-50 transition-colors"
                            title="Düzenle">
                            <Pencil className="w-3.5 h-3.5 text-amber-600" />
                          </button>
                        </>
                      )}
                    </div>
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

      {/* Modals */}
      {detaySayim && (
        <DetayModal
          sayimId={detaySayim.id}
          sayimObj={detaySayim}
          onClose={() => setDetaySayim(null)}
        />
      )}
      {infoSayim && <InfoModal sayim={infoSayim} onClose={() => setInfoSayim(null)} />}
      {duzenleSayim && (
        <DuzenleModal
          sayim={duzenleSayim}
          onClose={() => setDuzenleSayim(null)}
          onSave={() => { setDuzenleSayim(null); getSayimlar(); }}
          onDelete={(s) => { setDuzenleSayim(null); setSilSayim(s); }}
        />
      )}
      {silSayim && (
        <SilOnayModal
          sayim={silSayim}
          onClose={() => setSilSayim(null)}
          onConfirm={() => { setSilSayim(null); getSayimlar(); }}
        />
      )}

      {/* Geri Al Onay Modalı */}
      {geriAlSayim && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(3px)' }}
          onClick={() => setGeriAlSayim(null)}>
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden p-6"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: '#DCFCE7' }}>
                <RotateCcw className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="font-bold text-gray-900 text-sm">Sayımı Geri Al</p>
                <p className="text-xs text-gray-400">Bu sayım tekrar aktif olacak</p>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-5">
              <span className="font-bold">{geriAlSayim.ad}</span> geri alınacak. Devam etmek istiyor musunuz?
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => setGeriAlSayim(null)}
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
