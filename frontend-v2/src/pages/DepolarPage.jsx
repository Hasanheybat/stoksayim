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

const EMPTY_FORM = { isletme_id: '', ad: '', kod: '', konum: '' };

export default function DepolarPage() {
  const { t } = useLanguage();

  /* ── State ─────────────────────────────────────────────────── */
  const [data, setData] = useState([]);
  const [toplam, setToplam] = useState(0);
  const [stats, setStats] = useState({ toplam: 0, aktif: 0, pasif: 0 });
  const [loading, setLoading] = useState(true);
  const [sayfa, setSayfa] = useState(1);
  const [search, setSearch] = useState('');
  const [isletmeFilter, setIsletmeFilter] = useState('');
  const [aktifFilter, setAktifFilter] = useState('all'); // all | active | passive

  // businesses for dropdown
  const [isletmeler, setIsletmeler] = useState([]);

  // modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  // confirm (restore)
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState(null);
  const [confirmAction, setConfirmAction] = useState('deactivate'); // deactivate | restore
  const [actionLoading, setActionLoading] = useState(false);

  /* ── Fetch businesses for dropdowns ────────────────────────── */
  useEffect(() => {
    (async () => {
      try {
        const { data: res } = await api.get('/isletmeler', {
          params: { aktif: true, limit: 500 },
        });
        setIsletmeler(res.data || []);
      } catch {
        /* silent */
      }
    })();
  }, []);

  /* ── Fetch GLOBAL stats once on mount ──────────────────────── */
  useEffect(() => {
    Promise.all([
      api.get('/depolar').catch(() => ({ data: [] })),
      api.get('/depolar?aktif=false').catch(() => ({ data: [] })),
    ]).then(([allRes, pasifRes]) => {
      const all = Array.isArray(allRes.data) ? allRes.data : (allRes.data?.data || []);
      const pasif = Array.isArray(pasifRes.data) ? pasifRes.data : (pasifRes.data?.data || []);
      const toplamCount = allRes.data?.toplam ?? all.length;
      const pasifCount = pasifRes.data?.toplam ?? pasif.length;
      setStats({ toplam: toplamCount, aktif: toplamCount - pasifCount, pasif: pasifCount });
    });
  }, []);

  /* ── Fetch warehouses ──────────────────────────────────────── */
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = { sayfa, limit: PER_PAGE };
      if (search) params.q = search;
      if (isletmeFilter) params.isletme_id = isletmeFilter;
      if (aktifFilter === 'active') params.aktif = 'true';
      else if (aktifFilter === 'passive') params.aktif = 'false';

      const { data: res } = await api.get('/depolar', { params });
      setData(res.data || []);
      setToplam(res.toplam || 0);
    } catch {
      toast.error(t('toast.loadFailed'));
    } finally {
      setLoading(false);
    }
  }, [sayfa, search, isletmeFilter, aktifFilter, t]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /* ── Handlers ──────────────────────────────────────────────── */
  const handleSearch = useCallback((val) => {
    setSearch(val);
    setSayfa(1);
  }, []);

  const handleIsletmeFilter = (val) => {
    setIsletmeFilter(val);
    setSayfa(1);
  };

  const handleAktifFilter = (val) => {
    setAktifFilter(val);
    setSayfa(1);
  };

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  };

  const openEdit = (item) => {
    setEditing(item);
    setForm({
      isletme_id: item.isletme_id || '',
      ad: item.ad || '',
      kod: item.kod || '',
      konum: item.konum || '',
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditing(null);
    setForm(EMPTY_FORM);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.ad.trim() || !form.kod.trim() || !form.isletme_id) return;

    setSaving(true);
    try {
      if (editing) {
        await api.put(`/depolar/${editing.id}`, {
          ad: form.ad.trim(),
          kod: form.kod.trim().toUpperCase(),
          konum: form.konum.trim(),
        });
        toast.success(t('toast.updated'));
      } else {
        await api.post('/depolar', {
          isletme_id: form.isletme_id,
          ad: form.ad.trim(),
          kod: form.kod.trim().toUpperCase(),
          konum: form.konum.trim(),
        });
        toast.success(t('toast.added'));
      }
      closeModal();
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.mesaj || t('toast.saveFailed'));
    } finally {
      setSaving(false);
    }
  };

  const openConfirm = (item, action) => {
    setConfirmTarget(item);
    setConfirmAction(action);
    setConfirmOpen(true);
  };

  const handleConfirmAction = async () => {
    if (!confirmTarget) return;
    setActionLoading(true);
    try {
      if (confirmAction === 'deactivate') {
        await api.delete(`/depolar/${confirmTarget.id}`);
        toast.success(t('toast.deactivated'));
      } else {
        await api.put(`/depolar/${confirmTarget.id}/restore`);
        toast.success(t('toast.warehouseRestored'));
      }
      setConfirmOpen(false);
      setConfirmTarget(null);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.mesaj || t('toast.operationFailed'));
    } finally {
      setActionLoading(false);
    }
  };

  /* ── Helpers ───────────────────────────────────────────────── */
  const getIsletmeAd = (isletme_id) => {
    const found = isletmeler.find((i) => i.id === isletme_id);
    return found?.ad || '';
  };

  /* ── Input class ───────────────────────────────────────────── */
  const inputCls =
    'w-full h-9 px-4 rounded-xl bg-surface-container-low text-on-surface text-sm placeholder:text-on-surface-variant/50 ghost-border ghost-border-focus outline-none transition-shadow';

  /* ── Aktif/Pasif filter config ───────────────────────────── */
  const aktifFilters = [
    { key: 'all', label: t('filter.all'), icon: 'apps' },
    { key: 'active', label: t('filter.active'), icon: 'check_circle' },
    { key: 'passive', label: t('filter.passive'), icon: 'cancel' },
  ];

  return (
    <div className="p-4 md:p-6 space-y-4">
      {/* ── Title + CTA ──────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold font-headline text-on-surface">
            {t('warehouses.title')}
          </h1>
          <p className="text-xs text-on-surface-variant mt-0.5">
            {t('warehouses.subtitle') || 'Depo yonetimi'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={openCreate}
            className="h-8 px-3 rounded-xl text-white text-xs font-semibold
                       shadow-md hover:shadow-lg transition-shadow flex items-center gap-2 shrink-0"
            style={{ background: 'linear-gradient(135deg, #4343d5, #5d5fef)' }}
          >
            <span className="material-symbols-outlined text-sm">add</span>
            {t('warehouses.new')}
          </button>
        </div>
      </div>

      {/* ── Stats ────────────────────────────────────────────── */}
      <div className="flex items-center gap-4">
        <span className="text-sm font-bold text-primary">{stats.toplam}</span>
        <span className="text-[11px] text-on-surface-variant">{t('stat.total')}</span>
        <span className="w-px h-4 bg-outline-variant/20" />
        <span className="text-sm font-bold text-success">{stats.aktif}</span>
        <span className="text-[11px] text-on-surface-variant">{t('stat.active')}</span>
        <span className="w-px h-4 bg-outline-variant/20" />
        <span className="text-sm font-bold text-error">{stats.pasif}</span>
        <span className="text-[11px] text-on-surface-variant">{t('stat.passive')}</span>
      </div>

      {/* ── Search + Filters ─────────────────────────────────── */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="max-w-xs">
          <SearchBox
            value={search}
            onChange={handleSearch}
            placeholder={t('warehouses.search')}
          />
        </div>
        <select
          value={isletmeFilter}
          onChange={(e) => handleIsletmeFilter(e.target.value)}
          className="h-8 text-xs px-3 rounded-xl bg-surface-container-low text-on-surface ghost-border outline-none appearance-none cursor-pointer min-w-[160px]"
        >
          <option value="">{t('filter.allBusinesses')}</option>
          {isletmeler.map((i) => (
            <option key={i.id} value={i.id}>
              {i.ad}
            </option>
          ))}
        </select>
        <div className="flex items-center gap-1 bg-surface-container-low rounded-xl p-1">
          {aktifFilters.map((f) => (
            <button
              key={f.key}
              onClick={() => handleAktifFilter(f.key)}
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
      </div>

      {/* ── Grid ─────────────────────────────────────────────── */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }, (_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : data.length === 0 ? (
        <div className="bg-surface-container-lowest rounded-2xl shadow-card py-14 flex flex-col items-center justify-center gap-3">
          <span className="material-symbols-outlined text-3xl text-on-surface-variant/30">
            warehouse
          </span>
          <p className="text-sm text-on-surface-variant">
            {t('warehouses.notFound')}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {data.map((item) => (
            <div
              key={item.id}
              className={`rounded-2xl shadow-card p-4 flex flex-col gap-2.5 h-full group ${
                !item.aktif ? 'bg-red-50 hover:bg-red-100/60' : 'bg-surface-container-lowest'
              }`}
            >
              {/* Line 1: name + code badge + status */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <h3 className={`text-sm font-bold truncate ${!item.aktif ? 'text-red-600' : 'text-on-surface'}`}>
                    {item.ad}
                  </h3>
                  <span className="inline-block px-2 py-0.5 rounded-md bg-primary/10 text-primary text-[10px] font-bold font-mono tracking-wide shrink-0">
                    {item.kod}
                  </span>
                </div>
                <StatusChip status={item.aktif ? 'aktif' : 'pasif'} size="sm" />
              </div>

              {/* Line 2: Isletme chip */}
              <div className="flex items-center gap-1.5">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-success/10 text-success text-[11px] font-semibold">
                  <span className="material-symbols-outlined text-sm">domain</span>
                  {item.isletmeler?.ad || item.isletme_ad || getIsletmeAd(item.isletme_id)}
                </span>
              </div>

              {/* Line 3: Konum */}
              {item.konum && (
                <div className="flex items-center gap-2 text-xs text-on-surface-variant">
                  <span className="material-symbols-outlined text-sm opacity-60">
                    location_on
                  </span>
                  <span className="truncate">{item.konum}</span>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-2 mt-auto pt-2">
                <button
                  onClick={() => openEdit(item)}
                  className="flex-1 h-9 rounded-xl text-xs font-semibold
                             bg-surface-container-high text-on-surface
                             hover:bg-surface-container-highest transition-colors
                             flex items-center justify-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-sm">edit</span>
                  {t('action.edit')}
                </button>
                {item.aktif ? (
                  <button
                    onClick={() => openConfirm(item, 'deactivate')}
                    className="h-9 px-3 rounded-xl text-xs font-semibold
                               bg-error/8 text-error hover:bg-error/15
                               transition-colors flex items-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-sm">
                      delete
                    </span>
                    {t('action.delete')}
                  </button>
                ) : (
                  <button
                    onClick={() => openConfirm(item, 'restore')}
                    className="h-9 px-3 rounded-xl text-xs font-semibold
                               bg-success/8 text-success hover:bg-success/15
                               transition-colors flex items-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-sm">
                      restore
                    </span>
                    {t('action.restore')}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Pagination ───────────────────────────────────────── */}
      {!loading && toplam > PER_PAGE && (
        <div className="flex justify-center pt-2">
          <Pagination
            current={sayfa}
            total={toplam}
            perPage={PER_PAGE}
            onChange={setSayfa}
          />
        </div>
      )}

      {/* ── Create / Edit Modal ──────────────────────────────── */}
      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={editing ? t('warehouses.edit') : t('warehouses.new')}
        icon={editing ? 'edit' : 'add_business'}
        iconColor="#4343d5"
      >
        <form onSubmit={handleSave} className="space-y-4">
          {/* Isletme */}
          <div>
            <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">
              {t('table.business')} *
            </label>
            <div className="relative">
              <select
                required
                value={form.isletme_id}
                onChange={(e) =>
                  setForm((f) => ({ ...f, isletme_id: e.target.value }))
                }
                className={`${inputCls} appearance-none cursor-pointer pr-10`}
                disabled={!!editing}
              >
                <option value="">{t('filter.allBusinesses')}</option>
                {isletmeler.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.ad} ({i.kod})
                  </option>
                ))}
              </select>
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none">
                <span className="material-symbols-outlined text-lg">
                  expand_more
                </span>
              </span>
            </div>
          </div>

          {/* Ad */}
          <div>
            <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">
              {t('warehouses.name')} *
            </label>
            <input
              type="text"
              required
              value={form.ad}
              onChange={(e) => setForm((f) => ({ ...f, ad: e.target.value }))}
              placeholder={t('warehouses.name')}
              className={inputCls}
              autoFocus
            />
          </div>

          {/* Kod */}
          <div>
            <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">
              {t('warehouses.code')} *
            </label>
            <input
              type="text"
              required
              value={form.kod}
              onChange={(e) =>
                setForm((f) => ({ ...f, kod: e.target.value.toUpperCase() }))
              }
              placeholder={t('warehouses.code')}
              className={inputCls}
              disabled={!!editing}
            />
          </div>

          {/* Konum */}
          <div>
            <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">
              {t('warehouses.location')}
            </label>
            <input
              type="text"
              value={form.konum}
              onChange={(e) =>
                setForm((f) => ({ ...f, konum: e.target.value }))
              }
              placeholder={t('warehouses.locationPlaceholder')}
              className={inputCls}
            />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={closeModal}
              disabled={saving}
              className="flex-1 h-9 rounded-xl text-sm font-semibold
                         bg-surface-container-high text-on-surface
                         hover:bg-surface-container-highest transition-colors
                         disabled:opacity-50"
            >
              {t('action.cancel')}
            </button>
            <button
              type="submit"
              disabled={
                saving ||
                !form.ad.trim() ||
                !form.kod.trim() ||
                !form.isletme_id
              }
              className="flex-1 h-9 rounded-xl text-sm font-semibold
                         bg-cta-gradient text-white shadow-md
                         hover:shadow-lg transition-shadow
                         disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saving && (
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
              {saving ? t('action.saving') : t('action.save')}
            </button>
          </div>
        </form>
      </Modal>

      {/* ── Confirm Modal ────────────────────────────────────── */}
      <ConfirmModal
        open={confirmOpen}
        onClose={() => {
          setConfirmOpen(false);
          setConfirmTarget(null);
        }}
        onConfirm={handleConfirmAction}
        title={
          confirmAction === 'deactivate'
            ? t('action.delete')
            : t('action.restore')
        }
        message={
          confirmAction === 'deactivate'
            ? `"${confirmTarget?.ad || ''}" ${t('warehouses.name').toLowerCase()} silinecek.`
            : `"${confirmTarget?.ad || ''}" geri yüklenecek.`
        }
        type={confirmAction === 'deactivate' ? 'danger' : 'success'}
        confirmText={
          confirmAction === 'deactivate'
            ? t('action.yesDelete')
            : t('action.restore')
        }
        cancelText={t('action.giveUp')}
        loading={actionLoading}
      />
    </div>
  );
}
