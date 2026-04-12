import { useState, useEffect, useCallback } from 'react';
import api from '../lib/api';
import { useLanguage } from '../i18n';
import toast from 'react-hot-toast';
import Modal from '../components/ui/Modal';
import ConfirmModal from '../components/ui/ConfirmModal';
import StatusChip from '../components/ui/StatusChip';
import { SkeletonCard } from '../components/ui/Skeleton';
import SearchBox from '../components/shared/SearchBox';
import Pagination from '../components/shared/Pagination';
import React from 'react';

const PER_PAGE = 50;

/* ── Filter dropdown component ───────────────────────────── */

function FilterSelect({ value, onChange, options, placeholder, icon }) {
  return (
    <div className="relative">
      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none">
        <span className="material-symbols-outlined text-base">{icon}</span>
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-8 pl-8 pr-6 rounded-xl bg-surface-container-low text-on-surface text-xs
                   ghost-border outline-none appearance-none cursor-pointer min-w-[140px]"
      >
        <option value="">{placeholder}</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

/* ── Export helpers ───────────────────────────────────────── */

async function exportPDF(sayim) {
  const { default: jsPDF } = await import('jspdf');
  await import('jspdf-autotable');

  const doc = new jsPDF();

  /* Header */
  doc.setFontSize(18);
  doc.text(sayim.ad || 'Sayim Raporu', 14, 22);

  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Depo: ${sayim.depolar?.ad || sayim.depo_adi || '-'}`, 14, 32);
  doc.text(`Isletme: ${sayim.isletmeler?.ad || sayim.isletme_adi || '-'}`, 14, 38);
  doc.text(`Tarih: ${new Date(sayim.tarih || sayim.olusturma_tarihi).toLocaleDateString('tr-TR')}`, 14, 44);
  doc.text(`Durum: ${sayim.durum === 'tamamlandi' ? 'Tamamlandi' : 'Devam Ediyor'}`, 14, 50);
  doc.text(`Olusturan: ${sayim.kullanicilar?.ad_soyad || sayim.olusturan_adi || '-'}`, 14, 56);

  /* Items table */
  const items = sayim.sayim_kalemleri || [];
  if (items.length > 0) {
    doc.autoTable({
      startY: 64,
      head: [['#', 'Urun Adi', 'Urun Kodu', 'Barkod', 'Miktar', 'Birim']],
      body: items.map((item, idx) => [
        idx + 1,
        item.isletme_urunler?.urun_adi || item.urun_adi || '-',
        item.isletme_urunler?.urun_kodu || item.urun_kodu || '-',
        item.barkod || '-',
        item.miktar ?? '-',
        item.birim || '-',
      ]),
      styles: { fontSize: 9 },
      headStyles: { fillColor: [67, 67, 213] },
    });
  }

  doc.save(`${sayim.ad || 'sayim'}-rapor.pdf`);
}

async function exportExcel(sayim) {
  const XLSX = await import('xlsx');

  const items = sayim.sayim_kalemleri || [];
  const wsData = [
    ['Sayim Raporu'],
    [],
    ['Sayim Adi', sayim.ad || '-'],
    ['Depo', sayim.depo_adi || '-'],
    ['Isletme', sayim.isletme_adi || '-'],
    ['Tarih', new Date(sayim.tarih || sayim.created_at).toLocaleDateString('tr-TR')],
    ['Durum', sayim.durum === 'tamamlandi' ? 'Tamamlandi' : 'Devam Ediyor'],
    ['Olusturan', sayim.kullanicilar?.ad_soyad || '-'],
    [],
    ['#', 'Urun Adi', 'Urun Kodu', 'Barkod', 'Miktar', 'Birim'],
    ...items.map((item, idx) => [
      idx + 1,
      item.isletme_urunler?.urun_adi || item.urun_adi || '-',
      item.isletme_urunler?.urun_kodu || item.urun_kodu || '-',
      item.barkod || '-',
      item.miktar ?? '-',
      item.birim || '-',
    ]),
  ];

  const ws = XLSX.utils.aoa_to_sheet(wsData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Sayim');

  /* Column widths */
  ws['!cols'] = [
    { wch: 5 },
    { wch: 30 },
    { wch: 15 },
    { wch: 18 },
    { wch: 10 },
    { wch: 10 },
  ];

  XLSX.writeFile(wb, `${sayim.ad || 'sayim'}-rapor.xlsx`);
}

/* ── Count Card ──────────────────────────────────────────── */

function CountCard({ sayim, onClick, onDelete, onRestore, t }) {
  const silindi = sayim.durum === 'silindi' || sayim.deleted_at;
  return (
    <div
      className={`rounded-2xl shadow-card p-4 flex flex-col gap-2.5 h-full group ${
        silindi ? 'bg-red-50 hover:bg-red-100/60' : 'bg-surface-container-lowest'
      }`}
    >
      {/* Top: name + status */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h3 className={`text-sm font-bold truncate ${silindi ? 'text-red-600' : 'text-on-surface'}`}>
            {sayim.ad}
          </h3>
          <p className="text-xs text-on-surface-variant mt-0.5 truncate">
            {sayim.depolar?.ad || sayim.depo_adi || '—'} &middot; {sayim.isletmeler?.ad || sayim.isletme_adi || '—'}
          </p>
        </div>
        <StatusChip status={sayim.durum} size="sm" />
      </div>

      {/* Info rows */}
      <div className="flex flex-col gap-1.5 text-xs text-on-surface-variant">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-sm opacity-60">calendar_today</span>
          <span>{sayim.tarih ? new Date(sayim.tarih).toLocaleDateString('tr-TR') : sayim.created_at ? new Date(sayim.created_at).toLocaleDateString('tr-TR') : '—'}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-sm opacity-60">person</span>
          <span>{sayim.kullanicilar?.ad_soyad || sayim.olusturan_adi || '—'}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 mt-auto pt-2">
        {silindi ? (
          <button
            onClick={() => onRestore(sayim)}
            className="flex-1 h-9 rounded-xl text-xs font-semibold
                       bg-success/10 text-success hover:bg-success/20
                       transition-colors flex items-center justify-center gap-1.5"
          >
            <span className="material-symbols-outlined text-sm">undo</span>
            {t('action.restore')}
          </button>
        ) : (
          <>
            <button
              onClick={() => onClick(sayim)}
              className="flex-1 h-9 rounded-xl text-xs font-semibold
                         bg-surface-container-high text-on-surface
                         hover:bg-surface-container-highest transition-colors
                         flex items-center justify-center gap-1.5"
            >
              <span className="material-symbols-outlined text-sm">visibility</span>
              {t('action.view') || 'Detay'}
            </button>
            <button
              onClick={() => onDelete(sayim)}
              className="h-9 px-3 rounded-xl text-xs font-semibold
                         text-error bg-error/8 hover:bg-error/15
                         transition-colors flex items-center justify-center gap-1.5"
            >
              <span className="material-symbols-outlined text-sm">delete</span>
              {t('action.delete')}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

/* ── Expandable Item Row ─────────────────────────────────── */

function ItemRow({ item, index }) {
  const { t } = useLanguage();
  const [expanded, setExpanded] = useState(false);
  const urun = item.isletme_urunler || {};
  const pasif = urun.aktif === 0 || urun.aktif === false;

  return (
    <div className="bg-surface-container-low rounded-xl overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-surface-container transition-colors"
      >
        <span className="text-[10px] font-bold text-on-surface-variant w-6 text-center shrink-0">
          {index + 1}
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <p className={`text-sm font-bold truncate ${pasif ? 'text-error' : 'text-on-surface'}`}>
              {urun.urun_adi || item.urun_adi || '-'}
            </p>
            {pasif && (
              <span className="shrink-0 px-1.5 py-0.5 text-[10px] font-bold text-error bg-error/10 border border-error/20 rounded">
                Pasif
              </span>
            )}
          </div>
          {urun.isim_2 && (
            <p className="text-xs text-on-surface-variant truncate">{urun.isim_2}</p>
          )}
        </div>
        <span className="text-sm font-bold text-on-surface tabular-nums">
          {item.miktar ?? '-'}
        </span>
        <span className="text-[10px] text-on-surface-variant">
          {item.birim || ''}
        </span>
        <span
          className={`material-symbols-outlined text-base text-on-surface-variant transition-transform ${
            expanded ? 'rotate-180' : ''
          }`}
        >
          expand_more
        </span>
      </button>

      {expanded && (
        <div className="px-4 pb-3 pt-0 grid grid-cols-2 gap-2 ml-9">
          <div>
            <p className="text-[10px] text-on-surface-variant">Urun Kodu</p>
            <p className="text-xs font-medium text-on-surface">{urun.urun_kodu || item.urun_kodu || '-'}</p>
          </div>
          <div>
            <p className="text-[10px] text-on-surface-variant">Birim</p>
            <p className="text-xs font-medium text-on-surface">{item.birim || 'ADET'}</p>
          </div>
          {urun.isim_2 && (
            <div>
              <p className="text-[10px] text-on-surface-variant">Ikinci Isim</p>
              <p className="text-xs font-medium text-on-surface">{urun.isim_2}</p>
            </div>
          )}
          {pasif && (
            <div>
              <p className="text-[10px] text-on-surface-variant">Durum</p>
              <p className="text-xs font-medium text-error">Pasif Urun</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Main Page ───────────────────────────────────────────── */

export default function SayimlarPage() {
  const { t } = useLanguage();

  /* List state */
  const [sayimlar, setSayimlar] = useState([]);
  const [toplam, setToplam] = useState(0);
  const [loading, setLoading] = useState(true);
  const [statsFixed, setStatsFixed] = useState({ toplam: 0, devam: 0, tamamlandi: 0 });

  /* Filters */
  const [search, setSearch] = useState('');
  const [sayfa, setSayfa] = useState(1);
  const [durumFilter, setDurumFilter] = useState('');
  const [isletmeFilter, setIsletmeFilter] = useState('');
  const [depoFilter, setDepoFilter] = useState('');
  const [aktifFilter, setAktifFilter] = useState('aktif'); // 'all' | 'aktif' | 'pasif'

  /* Filter options */
  const [isletmeler, setIsletmeler] = useState([]);
  const [depolar, setDepolar] = useState([]);

  /* Detail modal */
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedSayim, setSelectedSayim] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  /* Delete / restore */
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [restoreOpen, setRestoreOpen] = useState(false);
  const [restoreTarget, setRestoreTarget] = useState(null);
  const [restoring, setRestoring] = useState(false);

  /* Export loading */
  const [exporting, setExporting] = useState(null);

  /* ── Fetch filter options ──────────────────────────────── */

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const [isletmeRes, depoRes] = await Promise.all([
          api.get('/isletmeler').catch(() => ({ data: [] })),
          api.get('/depolar').catch(() => ({ data: [] })),
        ]);
        const isletmeData = Array.isArray(isletmeRes.data) ? isletmeRes.data : isletmeRes.data?.data || [];
        const depoData = Array.isArray(depoRes.data) ? depoRes.data : depoRes.data?.data || [];
        setIsletmeler(isletmeData);
        setDepolar(depoData);
      } catch {
        /* silently fail */
      }
    };
    fetchOptions();
  }, []);

  /* ── Fetch GLOBAL stats once on mount ────────────────── */
  useEffect(() => {
    api.get('/stats').then(({ data }) => {
      setStatsFixed({
        toplam: data.sayim_toplam || 0,
        devam: data.sayim_devam || 0,
        tamamlandi: data.sayim_tamamlandi || 0,
      });
    }).catch(() => {});
  }, []);

  /* ── Fetch list ────────────────────────────────────────── */

  const fetchSayimlar = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        sayfa,
        limit: PER_PAGE,
      };
      if (search) params.q = search;
      if (durumFilter) params.durum = durumFilter;
      if (aktifFilter === 'pasif') params.durum = 'silindi';
      if (isletmeFilter) params.isletme_id = isletmeFilter;
      if (depoFilter) params.depo_id = depoFilter;

      const { data } = await api.get('/sayimlar', { params });
      let list;
      if (Array.isArray(data)) {
        list = data;
        setToplam(data.length);
      } else {
        list = data.data || data.sayimlar || [];
        setToplam(data.toplam ?? data.total ?? 0);
      }
      // Client-side filter: hide silindi when aktif selected
      if (aktifFilter === 'aktif') {
        list = list.filter(s => s.durum !== 'silindi' && !s.deleted_at);
      }
      setSayimlar(list);
    } catch {
      toast.error('Sayimlar yuklenemedi');
    } finally {
      setLoading(false);
    }
  }, [sayfa, search, durumFilter, isletmeFilter, depoFilter, aktifFilter]);

  useEffect(() => {
    fetchSayimlar();
  }, [fetchSayimlar]);

  /* Reset page on filter change */
  useEffect(() => {
    setSayfa(1);
  }, [search, durumFilter, isletmeFilter, depoFilter]);

  /* ── Fetch detail ──────────────────────────────────────── */

  const openDetail = async (sayim) => {
    setDetailOpen(true);
    setSelectedSayim(null);
    setDetailLoading(true);
    try {
      const { data } = await api.get(`/sayimlar/${sayim.id}`);
      setSelectedSayim(data);
    } catch {
      toast.error('Sayim detayi yuklenemedi');
      setDetailOpen(false);
    } finally {
      setDetailLoading(false);
    }
  };

  const closeDetail = () => {
    setDetailOpen(false);
    setSelectedSayim(null);
  };

  /* ── Complete / Reopen ─────────────────────────────────── */

  const handleComplete = async () => {
    if (!selectedSayim) return;
    try {
      setActionLoading(true);
      await api.put(`/sayimlar/${selectedSayim.id}/tamamla`);
      toast.success('Sayim tamamlandi');
      closeDetail();
      fetchSayimlar();
    } catch (err) {
      toast.error(err.response?.data?.mesaj || 'Tamamlama basarisiz');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReopen = async () => {
    if (!selectedSayim) return;
    try {
      setActionLoading(true);
      await api.put(`/sayimlar/${selectedSayim.id}/yeniden-ac`);
      toast.success('Sayim yeniden acildi');
      closeDetail();
      fetchSayimlar();
    } catch (err) {
      toast.error(err.response?.data?.mesaj || 'Yeniden acma basarisiz');
    } finally {
      setActionLoading(false);
    }
  };

  /* ── Delete ────────────────────────────────────────────── */

  const openDeleteConfirm = (sayim) => {
    setDeleteTarget(sayim);
    setDeleteOpen(true);
    setDetailOpen(false);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      setDeleting(true);
      await api.delete(`/sayimlar/${deleteTarget.id}`);
      toast.success('Sayim silindi');
      setDeleteOpen(false);
      setDeleteTarget(null);
      fetchSayimlar();
    } catch (err) {
      toast.error(err.response?.data?.mesaj || 'Silme basarisiz');
    } finally {
      setDeleting(false);
    }
  };

  /* ── Restore ───────────────────────────────────────────── */

  const openRestoreConfirm = (sayim) => {
    setRestoreTarget(sayim);
    setRestoreOpen(true);
  };

  const handleRestore = async () => {
    if (!restoreTarget) return;
    try {
      setRestoring(true);
      await api.put(`/sayimlar/${restoreTarget.id}/restore`);
      toast.success('Sayim geri yuklendi');
      setRestoreOpen(false);
      setRestoreTarget(null);
      fetchSayimlar();
    } catch (err) {
      toast.error(err.response?.data?.mesaj || 'Geri yukleme basarisiz');
    } finally {
      setRestoring(false);
    }
  };

  /* ── Export handlers ───────────────────────────────────── */

  const handleExportPDF = async () => {
    if (!selectedSayim) return;
    try {
      setExporting('pdf');
      await exportPDF(selectedSayim);
      toast.success('PDF indirildi');
    } catch {
      toast.error('PDF olusturulamadi');
    } finally {
      setExporting(null);
    }
  };

  const handleExportExcel = async () => {
    if (!selectedSayim) return;
    try {
      setExporting('excel');
      await exportExcel(selectedSayim);
      toast.success('Excel indirildi');
    } catch {
      toast.error('Excel olusturulamadi');
    } finally {
      setExporting(null);
    }
  };

  /* ── Render ────────────────────────────────────────────── */

  return (
    <div className="p-4 md:p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold font-headline text-on-surface">
            {t('counts.title')}
          </h1>
          <p className="text-xs text-on-surface-variant mt-0.5">
            {t('counts.subtitle')}
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4">
        <span className="text-sm font-bold text-primary">{statsFixed.toplam}</span>
        <span className="text-[11px] text-on-surface-variant">{t('stat.total')}</span>
        <span className="w-px h-4 bg-outline-variant/20" />
        <span className="text-sm font-bold text-info">{statsFixed.devam}</span>
        <span className="text-[11px] text-on-surface-variant">{t('stat.ongoing')}</span>
        <span className="w-px h-4 bg-outline-variant/20" />
        <span className="text-sm font-bold text-success">{statsFixed.tamamlandi}</span>
        <span className="text-[11px] text-on-surface-variant">{t('stat.completed')}</span>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="max-w-xs">
          <SearchBox
            value={search}
            onChange={setSearch}
            placeholder={t('counts.searchPlaceholder')}
          />
        </div>
        {/* Aktif/Pasif filter — same as other pages */}
        <div className="flex items-center gap-1 bg-surface-container-low rounded-xl p-1">
          {[
            { key: 'all', label: t('filter.all'), icon: 'apps' },
            { key: 'aktif', label: t('filter.active'), icon: 'check_circle' },
            { key: 'pasif', label: t('filter.passive'), icon: 'cancel' },
          ].map((f) => (
            <button
              key={f.key}
              onClick={() => { setAktifFilter(f.key); setSayfa(1); }}
              className={`h-8 px-3 rounded-xl text-[11px] font-semibold transition-colors flex items-center gap-1.5 ${
                aktifFilter === f.key
                  ? 'text-white shadow-sm'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
              style={aktifFilter === f.key ? { background: 'linear-gradient(135deg, #4343d5, #5d5fef)', color: 'white' } : undefined}
            >
              <span className="material-symbols-outlined text-sm">{f.icon}</span>
              {f.label}
            </button>
          ))}
        </div>

        <FilterSelect
          value={isletmeFilter}
          onChange={setIsletmeFilter}
          options={isletmeler.map((i) => ({ value: String(i.id), label: i.ad }))}
          placeholder={t('filter.allBusinesses')}
          icon="domain"
        />
        <FilterSelect
          value={depoFilter}
          onChange={setDepoFilter}
          options={depolar.map((d) => ({ value: String(d.id), label: d.ad }))}
          placeholder={t('counts.allWarehouses')}
          icon="warehouse"
        />
        <FilterSelect
          value={durumFilter}
          onChange={setDurumFilter}
          options={[
            { value: 'devam', label: t('stat.ongoing') },
            { value: 'tamamlandi', label: t('stat.completed') },
          ]}
          placeholder={t('counts.allStatuses')}
          icon="filter_list"
        />
      </div>

      {/* List */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {Array.from({ length: 6 }, (_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : sayimlar.length === 0 ? (
        <div className="text-center py-12">
          <span className="material-symbols-outlined text-3xl text-on-surface-variant/30">
            assignment
          </span>
          <p className="text-sm text-on-surface-variant mt-3">
            {search || durumFilter || isletmeFilter || depoFilter
              ? t('counts.notFound')
              : t('dashboard.noCountsYet')}
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {sayimlar.map((sayim) => (
              <CountCard
                key={sayim.id}
                sayim={sayim}
                onClick={openDetail}
                onDelete={(s) => { setDeleteTarget(s); setDeleteOpen(true); }}
                onRestore={openRestoreConfirm}
                t={t}
              />
            ))}
          </div>

          {/* Pagination */}
          <div className="flex justify-center pt-2">
            <Pagination
              current={sayfa}
              total={toplam}
              perPage={PER_PAGE}
              onChange={setSayfa}
            />
          </div>
        </>
      )}

      {/* ── Detail Modal ───────────────────────────────────── */}
      <Modal
        open={detailOpen}
        onClose={closeDetail}
        title={selectedSayim?.ad || t('counts.title')}
        icon="assignment"
        iconColor="#3b82f6"
        maxWidth="lg"
      >
        {detailLoading ? (
          <div className="flex flex-col items-center gap-3 py-8">
            <svg className="animate-spin h-8 w-8 text-primary" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <p className="text-sm text-on-surface-variant">{t('loading.text')}</p>
          </div>
        ) : selectedSayim ? (
          <div className="space-y-4">
            {/* Status badge */}
            <div className="flex items-center gap-2">
              <StatusChip status={selectedSayim.durum} />
            </div>

            {/* Info grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-surface-container-low rounded-xl p-3">
                <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wide">
                  {t('table.business')}
                </p>
                <p className="text-sm font-medium text-on-surface mt-1">
                  {selectedSayim.isletmeler?.ad || selectedSayim.isletme_adi || '-'}
                </p>
              </div>
              <div className="bg-surface-container-low rounded-xl p-3">
                <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wide">
                  {t('table.warehouse')}
                </p>
                <p className="text-sm font-medium text-on-surface mt-1">
                  {selectedSayim.depolar?.ad || selectedSayim.depo_adi || '-'}
                </p>
              </div>
              <div className="bg-surface-container-low rounded-xl p-3">
                <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wide">
                  {t('table.date')}
                </p>
                <p className="text-sm font-medium text-on-surface mt-1">
                  {selectedSayim.tarih
                    ? new Date(selectedSayim.tarih).toLocaleDateString('tr-TR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                      })
                    : new Date(selectedSayim.created_at).toLocaleDateString('tr-TR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                      })}
                </p>
              </div>
              <div className="bg-surface-container-low rounded-xl p-3">
                <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wide">
                  {t('table.createdBy')}
                </p>
                <p className="text-sm font-medium text-on-surface mt-1">
                  {selectedSayim.kullanicilar?.ad_soyad || selectedSayim.olusturan_adi || '-'}
                </p>
              </div>
            </div>

            {/* Items list */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-on-surface-variant">
                  {t('counts.items')}
                </label>
                <span className="text-[10px] font-bold text-on-surface-variant bg-surface-container-high px-2 py-0.5 rounded-full">
                  {selectedSayim.sayim_kalemleri?.length || 0} kalem
                </span>
              </div>

              {(!selectedSayim.sayim_kalemleri || selectedSayim.sayim_kalemleri.length === 0) ? (
                <div className="text-center py-8 bg-surface-container-low rounded-xl">
                  <span className="material-symbols-outlined text-3xl text-on-surface-variant/30">
                    inventory_2
                  </span>
                  <p className="text-xs text-on-surface-variant mt-2">
                    {t('counts.noItems')}
                  </p>
                </div>
              ) : (
                <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
                  {selectedSayim.sayim_kalemleri.map((item, idx) => (
                    <ItemRow key={item.id || idx} item={item} index={idx} />
                  ))}
                </div>
              )}
            </div>

            {/* Export buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleExportPDF}
                disabled={exporting === 'pdf'}
                className="h-9 px-4 rounded-xl text-xs font-semibold
                           bg-error/10 text-error hover:bg-error/20
                           transition-colors flex items-center gap-1.5
                           disabled:opacity-50"
              >
                {exporting === 'pdf' ? (
                  <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : (
                  <span className="material-symbols-outlined text-base">picture_as_pdf</span>
                )}
                PDF
              </button>
              <button
                onClick={handleExportExcel}
                disabled={exporting === 'excel'}
                className="h-9 px-4 rounded-xl text-xs font-semibold
                           bg-success/10 text-success hover:bg-success/20
                           transition-colors flex items-center gap-1.5
                           disabled:opacity-50"
              >
                {exporting === 'excel' ? (
                  <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : (
                  <span className="material-symbols-outlined text-base">table_view</span>
                )}
                Excel
              </button>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => openDeleteConfirm(selectedSayim)}
                className="h-9 px-4 rounded-xl text-sm font-semibold
                           bg-error/10 text-error hover:bg-error/20
                           transition-colors flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-lg">delete</span>
                {t('action.delete')}
              </button>

              <div className="flex-1" />

              <button
                onClick={closeDetail}
                className="h-9 px-5 rounded-xl text-sm font-semibold
                           bg-surface-container-high text-on-surface
                           hover:bg-surface-container-highest transition-colors"
              >
                {t('action.close')}
              </button>

              {selectedSayim.durum === 'devam' && (
                <button
                  onClick={handleComplete}
                  disabled={actionLoading}
                  className="h-9 px-5 rounded-xl text-sm font-semibold text-white
                             bg-cta-gradient hover:opacity-90 transition-opacity
                             disabled:opacity-50 flex items-center gap-2"
                >
                  {actionLoading && (
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  )}
                  <span className="material-symbols-outlined text-lg">check_circle</span>
                  {t('action.complete')}
                </button>
              )}

              {selectedSayim.durum === 'tamamlandi' && (
                <button
                  onClick={handleReopen}
                  disabled={actionLoading}
                  className="h-9 px-5 rounded-xl text-sm font-semibold
                             text-warning bg-warning/10 hover:bg-warning/20
                             transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {actionLoading && (
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  )}
                  <span className="material-symbols-outlined text-lg">refresh</span>
                  {t('action.reopen')}
                </button>
              )}
            </div>
          </div>
        ) : null}
      </Modal>

      {/* ── Delete Confirm Modal ───────────────────────────── */}
      <ConfirmModal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        title={t('counts.deleteTitle')}
        message={`"${deleteTarget?.ad}" sayimini silmek istediginizden emin misiniz?`}
        type="danger"
        confirmText="Sil"
        cancelText="Vazgec"
        loading={deleting}
      />

      {/* ── Restore Confirm Modal ──────────────────────────── */}
      <ConfirmModal
        open={restoreOpen}
        onClose={() => setRestoreOpen(false)}
        onConfirm={handleRestore}
        title={t('counts.restoreTitle')}
        message={`"${restoreTarget?.ad}" sayimini geri yuklemek istediginizden emin misiniz?`}
        type="success"
        confirmText="Geri Yukle"
        cancelText="Vazgec"
        loading={restoring}
      />
    </div>
  );
}
