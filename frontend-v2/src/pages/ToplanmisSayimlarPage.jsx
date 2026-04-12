import { useState, useEffect, useCallback } from 'react';
import api from '../lib/api';
import useAuthStore from '../store/authStore';
import { useLanguage } from '../i18n';
import toast from 'react-hot-toast';
import SearchBox from '../components/shared/SearchBox';
import Pagination from '../components/shared/Pagination';
import StatusChip from '../components/ui/StatusChip';
import Modal from '../components/ui/Modal';
import ConfirmModal from '../components/ui/ConfirmModal';

const PER_PAGE = 50;

/* ── Skeleton loader ──────────────────────────────────────── */

function SkeletonCard() {
  return (
    <div className="bg-surface-container-lowest rounded-2xl shadow-card p-4 animate-pulse">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-surface-container-high" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-surface-container-high rounded-lg w-2/3" />
          <div className="h-3 bg-surface-container-high rounded-lg w-1/3" />
        </div>
      </div>
    </div>
  );
}

/* ── PDF Export ────────────────────────────────────────────── */

async function exportPDF(sayim, kalemler, t) {
  const { default: jsPDF } = await import('jspdf');
  await import('jspdf-autotable');

  const doc = new jsPDF();
  doc.setFontSize(16);
  doc.text(sayim.ad || t('mergedCounts.badge'), 14, 20);
  doc.setFontSize(10);
  doc.text(
    `${sayim.isletme_adi || ''} — ${new Date(sayim.created_at).toLocaleDateString()}`,
    14,
    28,
  );

  const head = [['#', t('totalCounts.countName'), t('totalCounts.items'), 'Birim']];
  const body = kalemler.map((k, i) => [
    i + 1,
    k.isletme_urunler?.urun_adi || k.urun_adi || k.urun_kodu || '-',
    k.miktar ?? '-',
    k.birim || '-',
  ]);

  doc.autoTable({ startY: 34, head, body, styles: { fontSize: 9 } });
  doc.save(`${sayim.ad || 'toplanmis-sayim'}.pdf`);
}

/* ── Excel Export ──────────────────────────────────────────── */

async function exportExcel(sayim, kalemler, t) {
  const XLSX = await import('xlsx');

  const rows = kalemler.map((k, i) => ({
    '#': i + 1,
    [t('totalCounts.countName')]: k.isletme_urunler?.urun_adi || k.urun_adi || k.urun_kodu || '-',
    [t('totalCounts.items')]: k.miktar ?? '-',
    Birim: k.birim || '-',
  }));

  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Sayim');
  XLSX.writeFile(wb, `${sayim.ad || 'toplanmis-sayim'}.xlsx`);
}

/* ── Main Page ────────────────────────────────────────────── */

export default function ToplanmisSayimlarPage() {
  const { t } = useLanguage();
  const { kullanici } = useAuthStore();

  /* ── List state ─────────────────────────────────────────── */
  const [sayimlar, setSayimlar] = useState([]);
  const [toplam, setToplam] = useState(0);
  const [sayfa, setSayfa] = useState(1);
  const [arama, setArama] = useState('');
  const [isletmeId, setIsletmeId] = useState('');
  const [isletmeler, setIsletmeler] = useState([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [durumFilter, setDurumFilter] = useState('');
  const [statsFixed, setStatsFixed] = useState({ toplam: 0 });

  /* ── Detail modal state ─────────────────────────────────── */
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailSayim, setDetailSayim] = useState(null);
  const [detailKalemler, setDetailKalemler] = useState([]);
  const [detailKaynaklar, setDetailKaynaklar] = useState([]);
  const [detailLoading, setDetailLoading] = useState(false);

  /* ── Edit modal state ───────────────────────────────────── */
  const [editOpen, setEditOpen] = useState(false);
  const [editSayim, setEditSayim] = useState(null);
  const [editAd, setEditAd] = useState('');
  const [editLoading, setEditLoading] = useState(false);

  /* ── Delete modal state ─────────────────────────────────── */
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteSayim, setDeleteSayim] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  /* ── Restore loading map ────────────────────────────────── */
  const [restoreLoading, setRestoreLoading] = useState({});

  /* ── Fetch businesses ───────────────────────────────────── */
  useEffect(() => {
    api
      .get('/isletmeler')
      .then(({ data }) => setIsletmeler(data.isletmeler || data || []))
      .catch(() => {});
  }, []);

  /* ── Fetch GLOBAL stats once on mount ──────────────────── */
  useEffect(() => {
    api.get('/sayimlar', { params: { toplama: 1, limit: 1 } })
      .then(({ data }) => {
        setStatsFixed({ toplam: data.toplam ?? data.total ?? 0 });
      })
      .catch(() => {});
  }, []);

  /* ── Fetch list ─────────────────────────────────────────── */
  const fetchList = useCallback(async () => {
    setYukleniyor(true);
    try {
      const params = {
        toplama: 1,
        sayfa,
        limit: PER_PAGE,
      };
      if (isletmeId) params.isletme_id = isletmeId;
      if (arama) params.q = arama;
      if (durumFilter === 'aktif') params.durum = 'tamamlandi';
      if (durumFilter === 'silindi') params.aktif = '0';

      const { data } = await api.get('/sayimlar', { params });
      setSayimlar(data.sayimlar || data.data || []);
      setToplam(data.toplam ?? data.total ?? 0);
    } catch {
      toast.error(t('toast.updateFailed'));
    } finally {
      setYukleniyor(false);
    }
  }, [sayfa, isletmeId, arama, durumFilter, t]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  /* ── Reset page on filter change ────────────────────────── */
  useEffect(() => {
    setSayfa(1);
  }, [arama, isletmeId, durumFilter]);

  /* ── Open detail modal ──────────────────────────────────── */
  const openDetail = async (sayim) => {
    setDetailSayim(sayim);
    setDetailOpen(true);
    setDetailLoading(true);
    try {
      const { data } = await api.get(`/sayimlar/${sayim.id}`);
      setDetailSayim(data);
      setDetailKalemler(data.sayim_kalemleri || data.kalemler || data.items || []);
      setDetailKaynaklar(data.kaynaklar || data.sources || []);
    } catch {
      toast.error(t('toast.updateFailed'));
    } finally {
      setDetailLoading(false);
    }
  };

  /* ── Open edit modal ────────────────────────────────────── */
  const openEdit = (sayim) => {
    setEditSayim(sayim);
    setEditAd(sayim.ad || '');
    setEditOpen(true);
  };

  /* ── Save rename ────────────────────────────────────────── */
  const handleRename = async () => {
    if (!editAd.trim()) return;
    setEditLoading(true);
    try {
      await api.put(`/sayimlar/${editSayim.id}`, { ad: editAd.trim() });
      toast.success(t('toast.nameUpdated'));
      setEditOpen(false);
      fetchList();
    } catch {
      toast.error(t('toast.updateFailed'));
    } finally {
      setEditLoading(false);
    }
  };

  /* ── Delete ─────────────────────────────────────────────── */
  const openDeleteFromEdit = () => {
    setDeleteSayim(editSayim);
    setEditOpen(false);
    setDeleteOpen(true);
  };

  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      await api.delete(`/sayimlar/${deleteSayim.id}`);
      toast.success(t('toast.countDeleted'));
      setDeleteOpen(false);
      fetchList();
    } catch {
      toast.error(t('toast.deleteFailed'));
    } finally {
      setDeleteLoading(false);
    }
  };

  /* ── Restore ────────────────────────────────────────────── */
  const handleRestore = async (sayim) => {
    setRestoreLoading((p) => ({ ...p, [sayim.id]: true }));
    try {
      await api.put(`/sayimlar/${sayim.id}/restore`);
      toast.success(t('toast.countRestored'));
      fetchList();
    } catch {
      toast.error(t('toast.updateFailed'));
    } finally {
      setRestoreLoading((p) => ({ ...p, [sayim.id]: false }));
    }
  };

  /* ── Empty / Search-not-found state ─────────────────────── */
  const isEmpty = !yukleniyor && sayimlar.length === 0;

  return (
    <div className="p-4 md:p-6 space-y-4">
      {/* ── Header ──────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold font-headline text-on-surface">
            {t('mergedCounts.title')}
          </h1>
          <p className="text-xs text-on-surface-variant mt-0.5">
            {t('totalCounts.mergedInfo', { n: toplam })}
          </p>
        </div>
      </div>

      {/* ── Stats ───────────────────────────────────────────── */}
      <div className="flex items-center gap-4">
        <span className="text-sm font-bold text-primary">{statsFixed.toplam}</span>
        <span className="text-[11px] text-on-surface-variant">{t('stat.total')}</span>
      </div>

      {/* ── Filters ─────────────────────────────────────────── */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="max-w-xs">
          <SearchBox
            value={arama}
            onChange={setArama}
            placeholder={t('totalCounts.searchPlaceholder')}
          />
        </div>

        {/* Durum filter */}
        <div className="flex items-center gap-1 bg-surface-container-low rounded-xl p-1 shrink-0">
          {[
            { k: '', l: t('filter.all') || 'Tumu', icon: 'apps' },
            { k: 'aktif', l: t('filter.active') || 'Aktif', icon: 'check_circle' },
            { k: 'silindi', l: t('filter.passive') || 'Silindi', icon: 'cancel' },
          ].map((f) => (
            <button
              key={f.k}
              onClick={() => { setDurumFilter(f.k); setSayfa(1); }}
              className={`h-8 px-3 rounded-xl text-[11px] font-semibold transition-colors flex items-center gap-1.5 ${
                durumFilter === f.k
                  ? 'text-white shadow-sm'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
              style={durumFilter === f.k ? { background: 'linear-gradient(135deg, #4343d5, #5d5fef)', color: 'white' } : undefined}
            >
              <span className="material-symbols-outlined text-sm">{f.icon}</span>
              {f.l}
            </button>
          ))}
        </div>

        {/* Business filter */}
        <select
          value={isletmeId}
          onChange={(e) => setIsletmeId(e.target.value)}
          className="h-8 text-xs px-3 rounded-xl appearance-none
                     bg-surface-container-low text-on-surface
                     ghost-border ghost-border-focus
                     outline-none transition-shadow cursor-pointer min-w-[160px]"
        >
          <option value="">{t('filter.allBusinesses')}</option>
          {isletmeler.map((isl) => (
            <option key={isl.id} value={isl.id}>
              {isl.ad}
            </option>
          ))}
        </select>
      </div>

      {/* ── List ────────────────────────────────────────────── */}
      {yukleniyor ? (
        <div className="grid gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : isEmpty ? (
        <div className="bg-surface-container-lowest rounded-2xl shadow-card p-6 text-center">
          <span className="material-symbols-outlined text-3xl text-on-surface-variant/30 mb-3 block">
            join_full
          </span>
          <p className="text-on-surface-variant text-sm">
            {arama
              ? `"${arama}" ${t('mergedCounts.searchNotFound')}`
              : t('mergedCounts.notFound')}
          </p>
        </div>
      ) : (
        <div className="grid gap-1.5">
          {sayimlar.map((sayim) => {
            const silindi = sayim.silindi_mi || sayim.deleted_at || sayim.durum === 'silindi' || sayim.aktif === false || sayim.aktif === 0;

            return (
              <div
                key={sayim.id}
                className={`rounded-xl shadow-card p-2.5
                  transition-all hover:shadow-elevated
                  ${silindi ? 'bg-red-50 hover:bg-red-100/60' : 'bg-surface-container-lowest cursor-pointer'}`}
                onClick={() => !silindi && openDetail(sayim)}
              >
                <div className="flex items-center gap-2.5">
                  {/* Icon */}
                  <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-primary text-base">
                      join_full
                    </span>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className={`text-[13px] font-bold truncate ${silindi ? 'text-red-600' : 'text-on-surface'}`}>
                        {sayim.ad || t('mergedCounts.badge')}
                      </h3>
                      <StatusChip
                        status={silindi ? 'silindi' : 'tamamlandi'}
                        size="sm"
                      />
                    </div>
                    <div className="flex items-center gap-2.5 mt-0.5 text-[11px] text-on-surface-variant">
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm">domain</span>
                        {sayim.isletmeler?.ad || sayim.isletme_adi || '—'}
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm">warehouse</span>
                        {sayim.depolar?.ad || sayim.depo_adi || '—'}
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm">calendar_today</span>
                        {sayim.tarih
                          ? new Date(sayim.tarih).toLocaleDateString('tr-TR')
                          : new Date(sayim.created_at).toLocaleDateString('tr-TR')}
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm">person</span>
                        {sayim.kullanicilar?.ad_soyad || '—'}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-0.5 shrink-0">
                    {silindi ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRestore(sayim);
                        }}
                        disabled={restoreLoading[sayim.id]}
                        className="h-7 px-2.5 rounded-lg text-[11px] font-semibold
                                   bg-primary/10 text-primary
                                   hover:bg-primary/20 transition-colors
                                   disabled:opacity-50 flex items-center gap-1"
                      >
                        <span className="material-symbols-outlined text-sm">undo</span>
                        {t('action.restore')}
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openEdit(sayim);
                          }}
                          className="w-7 h-7 rounded-md flex items-center justify-center
                                     text-on-surface-variant hover:bg-surface-container-high
                                     transition-colors"
                        >
                          <span className="material-symbols-outlined text-base">edit</span>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteSayim(sayim);
                            setDeleteOpen(true);
                          }}
                          className="w-7 h-7 rounded-md flex items-center justify-center
                                     text-error/70 hover:bg-error/10
                                     transition-colors"
                        >
                          <span className="material-symbols-outlined text-base">delete</span>
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

      {/* ── Pagination ──────────────────────────────────────── */}
      {!yukleniyor && toplam > PER_PAGE && (
        <div className="flex justify-center pt-2">
          <Pagination
            current={sayfa}
            total={toplam}
            perPage={PER_PAGE}
            onChange={setSayfa}
          />
        </div>
      )}

      {/* ── Detail Modal ────────────────────────────────────── */}
      <Modal
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        title={detailSayim?.ad || t('mergedCounts.badge')}
        icon="join_full"
        iconColor="#4343d5"
        maxWidth="lg"
      >
        {detailLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-3 border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
        ) : (
          <div className="space-y-4">
            {/* Info grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-surface-container-low rounded-xl p-3">
                <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wide">
                  {t('table.business')}
                </p>
                <p className="text-sm font-medium text-on-surface mt-1">
                  {detailSayim?.isletmeler?.ad || detailSayim?.isletme_adi || '-'}
                </p>
              </div>
              <div className="bg-surface-container-low rounded-xl p-3">
                <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wide">
                  {t('table.warehouse')}
                </p>
                <p className="text-sm font-medium text-on-surface mt-1">
                  {detailSayim?.depolar?.ad || detailSayim?.depo_adi || '-'}
                </p>
              </div>
              <div className="bg-surface-container-low rounded-xl p-3">
                <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wide">
                  {t('table.date')}
                </p>
                <p className="text-sm font-medium text-on-surface mt-1">
                  {detailSayim?.tarih
                    ? new Date(detailSayim.tarih).toLocaleDateString('tr-TR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                      })
                    : detailSayim?.created_at
                      ? new Date(detailSayim.created_at).toLocaleDateString('tr-TR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                        })
                      : '-'}
                </p>
              </div>
              <div className="bg-surface-container-low rounded-xl p-3">
                <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wide">
                  {t('table.createdBy')}
                </p>
                <p className="text-sm font-medium text-on-surface mt-1">
                  {detailSayim?.kullanicilar?.ad_soyad || detailSayim?.olusturan_adi || '-'}
                </p>
              </div>
            </div>

            {/* Source details */}
            {detailKaynaklar.length > 0 && (
              <div className="bg-surface-container-low rounded-xl p-3 space-y-2">
                <h4 className="text-xs font-bold text-on-surface-variant uppercase tracking-wide">
                  {t('totalCounts.sourceDetails')}
                </h4>
                <div className="space-y-1.5">
                  {detailKaynaklar.map((k, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2 text-sm text-on-surface"
                    >
                      <span className="material-symbols-outlined text-base text-on-surface-variant">
                        description
                      </span>
                      <span className="truncate">
                        {k.ad || k.name || `${t('totalCounts.sourceCounts')} ${i + 1}`}
                      </span>
                      {k.depo_adi && (
                        <span className="text-xs text-on-surface-variant">
                          ({k.depo_adi})
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Items list */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-on-surface-variant">
                  {t('counts.items')}
                </label>
                <span className="text-[10px] font-bold text-on-surface-variant bg-surface-container-high px-2 py-0.5 rounded-full">
                  {detailKalemler.length} kalem
                </span>
              </div>

              {detailKalemler.length > 0 ? (
                <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
                  {detailKalemler.map((k, i) => {
                    const urun = k.isletme_urunler || {};
                    const pasif = urun.aktif === 0 || urun.aktif === false;
                    return (
                      <div key={k.id || i} className="bg-surface-container-low rounded-xl px-4 py-3 flex items-center gap-3">
                        <span className="text-[10px] font-bold text-on-surface-variant w-6 text-center shrink-0">
                          {i + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className={`text-sm font-bold truncate ${pasif ? 'text-error' : 'text-on-surface'}`}>
                              {urun.urun_adi || k.urun_adi || k.urun_kodu || '-'}
                            </p>
                            {pasif && (
                              <span className="shrink-0 px-1.5 py-0.5 text-[10px] font-bold text-error bg-error/10 border border-error/20 rounded">
                                {t('stat.passive')}
                              </span>
                            )}
                          </div>
                          {urun.isim_2 && (
                            <p className="text-xs text-on-surface-variant truncate">{urun.isim_2}</p>
                          )}
                        </div>
                        <span className="text-sm font-bold text-on-surface tabular-nums">
                          {k.miktar ?? '-'}
                        </span>
                        <span className="text-[10px] text-on-surface-variant">
                          {k.birim || ''}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 bg-surface-container-low rounded-xl">
                  <span className="material-symbols-outlined text-3xl text-on-surface-variant/30">
                    inventory_2
                  </span>
                  <p className="text-xs text-on-surface-variant mt-2">
                    {t('mergedCounts.itemsNotFound')}
                  </p>
                </div>
              )}
            </div>

            {/* Export buttons */}
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => exportPDF(detailSayim, detailKalemler, t)}
                className="flex-1 h-9 rounded-xl text-sm font-semibold
                           bg-error/10 text-error
                           hover:bg-error/20 transition-colors
                           flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-lg">
                  picture_as_pdf
                </span>
                {t('action.pdf')}
              </button>
              <button
                onClick={() => exportExcel(detailSayim, detailKalemler, t)}
                className="flex-1 h-9 rounded-xl text-sm font-semibold
                           bg-success/10 text-success
                           hover:bg-success/20 transition-colors
                           flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-lg">
                  table_chart
                </span>
                {t('action.excel')}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* ── Edit Modal ──────────────────────────────────────── */}
      <Modal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title={t('totalCounts.editCount')}
        icon="edit"
        iconColor="#4343d5"
        maxWidth="sm"
      >
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">
              {t('totalCounts.countName')}
            </label>
            <input
              type="text"
              value={editAd}
              onChange={(e) => setEditAd(e.target.value)}
              className="w-full h-9 px-4 rounded-xl
                         bg-surface-container-low text-on-surface text-sm
                         ghost-border ghost-border-focus
                         outline-none transition-shadow"
              placeholder={t('totalCounts.countName')}
            />
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={openDeleteFromEdit}
              disabled={editLoading}
              className="h-9 px-4 rounded-xl text-sm font-semibold
                         bg-error/10 text-error
                         hover:bg-error/20 transition-colors
                         disabled:opacity-50 flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-lg">delete</span>
              {t('action.delete')}
            </button>
            <div className="flex-1" />
            <button
              onClick={() => setEditOpen(false)}
              disabled={editLoading}
              className="h-9 px-5 rounded-xl text-sm font-semibold
                         bg-surface-container-high text-on-surface
                         hover:bg-surface-container-highest transition-colors
                         disabled:opacity-50"
            >
              {t('action.cancel')}
            </button>
            <button
              onClick={handleRename}
              disabled={editLoading || !editAd.trim()}
              className="h-9 px-5 rounded-xl text-sm font-semibold
                         bg-cta-gradient text-white
                         hover:opacity-90 transition-opacity
                         disabled:opacity-50 flex items-center gap-2"
            >
              {editLoading && (
                <svg
                  className="animate-spin h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
              )}
              {t('action.save')}
            </button>
          </div>
        </div>
      </Modal>

      {/* ── Delete Confirm Modal ────────────────────────────── */}
      <ConfirmModal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        title={t('totalCounts.deleteTitle')}
        message={`"${deleteSayim?.ad || ''}" ${t('totalCounts.deleteConfirmText')}`}
        type="danger"
        confirmText={t('action.yesDelete')}
        cancelText={t('action.giveUp')}
        loading={deleteLoading}
      />
    </div>
  );
}
