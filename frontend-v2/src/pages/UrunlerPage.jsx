import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import api from '../lib/api';
import { useLanguage } from '../i18n';
import toast from 'react-hot-toast';
import StatusChip from '../components/ui/StatusChip';
import SearchBox from '../components/shared/SearchBox';
// Pagination removed — using infinite scroll
import React from 'react';

/* ── Constants ──────────────────────────────────────────────── */

const PER_PAGE = 50;
const LOAD_MORE_THRESHOLD = 200; // px from bottom to trigger load
const BIRIM_VARSAYILAN = ['ADET', 'KG', 'LT', 'MT', 'KUTU', 'PAKET', 'KOLI', 'TANE'];
const BOSH_FORM = {
  urun_kodu: '', urun_adi: '', isim_2: '', birim: 'ADET',
  kategori: '', barkodlar: '', isletme_id: '',
};
const KATEGORISIZ = '__kategorisiz__';

/* ── Inline UrunModal ──────────────────────────────────────── */

function UrunModal({ open, onClose, initial, isletmeId, isletmeler, mevcutKategoriler = [], onSaved }) {
  const { t } = useLanguage();
  const [form, setForm] = useState(BOSH_FORM);
  const [loading, setLoading] = useState(false);
  const [silOnay, setSilOnay] = useState(false);
  const [barkodGiris, setBarkodGiris] = useState('');
  const [birimler, setBirimler] = useState(BIRIM_VARSAYILAN);
  const barkodRef = useRef(null);
  const backdropRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    api.get('/urunler/birimler')
      .then(res => {
        const apiBirimler = res.data.map(b => b.ad);
        const hepsi = [...new Set([...apiBirimler, ...BIRIM_VARSAYILAN])].sort();
        setBirimler(hepsi);
      })
      .catch(() => setBirimler(BIRIM_VARSAYILAN));
  }, [open]);

  useEffect(() => {
    if (!open) return;
    if (initial) {
      setForm({
        urun_kodu: initial.urun_kodu || '',
        urun_adi: initial.urun_adi || '',
        isim_2: initial.isim_2 || '',
        birim: initial.birim || 'ADET',
        kategori: initial.kategori || '',
        barkodlar: initial.barkodlar || '',
        isletme_id: initial.isletme_id || isletmeId || '',
      });
    } else {
      setForm({ ...BOSH_FORM, isletme_id: isletmeId || '' });
    }
    setSilOnay(false);
    setBarkodGiris('');
  }, [open, initial, isletmeId]);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  if (!open) return null;

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

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

  const handleSubmit = async (e) => {
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

  const handleBackdropClick = (e) => {
    if (e.target === backdropRef.current) onClose();
  };

  const inputCls = 'w-full px-4 py-2.5 text-sm rounded-xl bg-surface-container-low text-on-surface outline-none ghost-border ghost-border-focus placeholder:text-on-surface-variant/50';
  const labelCls = 'block text-xs font-semibold text-on-surface-variant mb-1.5 uppercase tracking-wide';

  return (
    <div
      ref={backdropRef}
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center modal-backdrop"
      style={{ animation: 'fadeIn 0.15s ease' }}
    >
      <div
        className="relative w-full bg-surface-container-lowest rounded-t-2xl sm:rounded-2xl sm:max-w-lg sm:mx-4 shadow-elevated flex flex-col max-h-[90vh]"
        style={{ animation: 'slideUp 0.2s ease' }}
      >
        <div
          className="h-0.5 w-full rounded-t-2xl shrink-0"
          style={{ background: 'linear-gradient(135deg, #4343d5, #5d5fef)' }}
        />

        <div className="flex items-center gap-2.5 px-5 pt-4 pb-1 shrink-0">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
            style={{ backgroundColor: 'rgba(67,67,213,0.08)' }}
          >
            <span className="material-symbols-outlined text-lg" style={{ color: '#4343d5' }}>
              inventory_2
            </span>
          </div>
          <h3 className="text-base font-bold font-headline text-on-surface flex-1 leading-tight">
            {initial?.id ? t('products.edit') : t('products.new')}
          </h3>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-md flex items-center justify-center text-on-surface-variant/60 hover:bg-surface-container-high transition-colors shrink-0"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-5 pb-5 pt-2 overflow-y-auto flex-1 space-y-3.5">
          {!initial?.id && (
            <div>
              <label className={labelCls}>
                {t('products.business')} <span className="text-error">*</span>
              </label>
              <select
                value={form.isletme_id}
                onChange={e => set('isletme_id', e.target.value)}
                className={inputCls}
              >
                <option value="">{t('products.businessSelect')}</option>
                {isletmeler.map(i => (
                  <option key={i.id} value={i.id}>{i.ad}</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className={labelCls}>
              {t('products.code')} <span className="text-error">*</span>
            </label>
            <input
              type="text"
              value={form.urun_kodu}
              onChange={e => set('urun_kodu', e.target.value)}
              placeholder={t('products.codePlaceholder')}
              className={`${inputCls} font-mono`}
            />
          </div>

          <div>
            <label className={labelCls}>
              {t('products.name')} <span className="text-error">*</span>
            </label>
            <input
              type="text"
              value={form.urun_adi}
              onChange={e => set('urun_adi', e.target.value)}
              placeholder={t('products.namePlaceholder')}
              className={inputCls}
            />
          </div>

          <div>
            <label className={labelCls}>
              {t('products.secondName')}
              <span className="ml-1.5 text-on-surface-variant/50 normal-case font-normal tracking-normal">
                ({t('products.secondNameHint')})
              </span>
            </label>
            <input
              type="text"
              value={form.isim_2}
              onChange={e => set('isim_2', e.target.value)}
              placeholder={t('products.secondNamePlaceholder')}
              className={inputCls}
            />
          </div>

          <div>
            <label className={labelCls}>{t('products.unit')}</label>
            <select
              value={form.birim}
              onChange={e => set('birim', e.target.value)}
              className={inputCls}
            >
              {[...new Set([form.birim, ...birimler])].filter(Boolean).map(b => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelCls}>{t('products.barcodes')}</label>
            {pills.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-2">
                {pills.map(b => (
                  <span
                    key={b}
                    className="inline-flex items-center gap-1 text-xs font-mono px-2 py-1 rounded-lg bg-surface-container-low text-on-surface-variant"
                  >
                    {b}
                    <button
                      type="button"
                      onClick={() => barkodSil(b)}
                      className="text-on-surface-variant/40 hover:text-error transition-colors ml-0.5"
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 12 }}>close</span>
                    </button>
                  </span>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <input
                ref={barkodRef}
                type="text"
                value={barkodGiris}
                onChange={e => setBarkodGiris(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); barkodEkle(); } }}
                placeholder={t('products.barcodePlaceholder')}
                className={`flex-1 ${inputCls} font-mono`}
              />
              <button
                type="button"
                onClick={barkodEkle}
                className="px-3 py-2 rounded-xl text-sm font-bold text-white flex-shrink-0"
                style={{ background: 'linear-gradient(135deg, #4343d5, #5d5fef)' }}
              >
                <span className="material-symbols-outlined text-sm">add</span>
              </button>
            </div>
          </div>

          <div>
            <label className={labelCls}>Kategori</label>
            <div className="relative">
              <select
                value={form.kategori || ''}
                onChange={e => {
                  if (e.target.value === '__yeni__') {
                    const yeni = prompt('Yeni kategori adı:');
                    if (yeni?.trim()) set('kategori', yeni.trim());
                  } else {
                    set('kategori', e.target.value);
                  }
                }}
                className={inputCls + ' appearance-none cursor-pointer pr-8'}
              >
                <option value="">Kategorisiz</option>
                {mevcutKategoriler.map(k => (
                  <option key={k} value={k}>{k}</option>
                ))}
                <option value="__yeni__">+ Yeni Kategori...</option>
              </select>
              <span className="material-symbols-outlined text-sm text-on-surface-variant/50 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                expand_more
              </span>
            </div>
          </div>

          {!silOnay ? (
            <div className="flex items-center gap-2 pt-2">
              {/* Sil butonu — sadece aktif ürünlerde göster */}
              {initial?.id && initial?.aktif !== false && initial?.aktif !== 0 && (
                <button
                  type="button"
                  onClick={() => setSilOnay(true)}
                  className="h-9 px-4 rounded-xl text-xs font-semibold text-error bg-error/8 hover:bg-error/15 flex items-center gap-1.5 transition-colors"
                >
                  <span className="material-symbols-outlined text-sm">delete</span>
                  {t('products.delete')}
                </button>
              )}
              <button
                type="submit"
                disabled={loading}
                className="flex-1 h-9 rounded-xl text-sm font-bold text-white disabled:opacity-50 flex items-center justify-center gap-2"
                style={{ background: 'linear-gradient(135deg, #4343d5, #5d5fef)' }}
              >
                {loading ? t('action.saving') : (initial?.id ? t('action.update') : t('action.add'))}
              </button>
            </div>
          ) : (
            <div className="rounded-xl bg-error/8 p-3.5">
              <p className="text-xs text-error font-semibold text-center mb-3">
                {t('products.deleteConfirm')}
              </p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setSilOnay(false)}
                  className="py-2 rounded-xl text-sm font-semibold bg-surface-container-low text-on-surface-variant"
                >
                  {t('action.giveUp')}
                </button>
                <button
                  type="button"
                  onClick={handleSil}
                  disabled={loading}
                  className="py-2 rounded-xl text-sm font-bold text-white disabled:opacity-50"
                  style={{ background: 'linear-gradient(135deg, #EF4444, #DC2626)' }}
                >
                  {loading ? '...' : t('action.yesDelete')}
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}

/* ── Bulk Move Dropdown ────────────────────────────────────── */

function BulkMoveDropdown({ categories, onSelect, onClose }) {
  const ref = useRef(null);
  const [yeniKategoriMode, setYeniKategoriMode] = useState(false);
  const [yeniKategoriAdi, setYeniKategoriAdi] = useState('');
  const yeniInputRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  useEffect(() => {
    if (yeniKategoriMode && yeniInputRef.current) {
      yeniInputRef.current.focus();
    }
  }, [yeniKategoriMode]);

  const handleYeniKategoriSubmit = () => {
    const name = yeniKategoriAdi.trim();
    if (!name) return;
    onSelect(name);
    setYeniKategoriMode(false);
    setYeniKategoriAdi('');
  };

  return (
    <div
      ref={ref}
      className="absolute bottom-full left-0 mb-2 w-64 bg-surface-container-lowest rounded-xl shadow-elevated overflow-hidden"
      style={{ animation: 'slideUp 0.15s ease' }}
    >
      <div className="px-3 py-2 bg-surface-container-low">
        <p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
          Hedef Kategori
        </p>
      </div>
      <div className="max-h-48 overflow-y-auto py-1">
        <button
          onClick={() => onSelect('')}
          className="w-full text-left px-4 py-2 text-sm text-on-surface-variant hover:bg-surface-container-low transition-colors italic"
        >
          Kategorisiz
        </button>
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => onSelect(cat)}
            className="w-full text-left px-4 py-2 text-sm text-on-surface hover:bg-surface-container-low transition-colors"
          >
            {cat}
          </button>
        ))}

        {/* Yeni Kategori option */}
        {yeniKategoriMode ? (
          <div className="px-3 py-2">
            <input
              ref={yeniInputRef}
              type="text"
              value={yeniKategoriAdi}
              onChange={e => setYeniKategoriAdi(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') { e.preventDefault(); handleYeniKategoriSubmit(); }
                if (e.key === 'Escape') { setYeniKategoriMode(false); setYeniKategoriAdi(''); }
              }}
              placeholder="Kategori adi..."
              className="w-full px-3 py-1.5 text-sm rounded-lg bg-surface-container-low text-on-surface outline-none ghost-border-focus placeholder:text-on-surface-variant/50"
            />
          </div>
        ) : (
          <button
            onClick={() => setYeniKategoriMode(true)}
            className="w-full text-left px-4 py-2 text-sm text-primary hover:bg-surface-container-low transition-colors flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-sm">add</span>
            Yeni Kategori
          </button>
        )}
      </div>
    </div>
  );
}

/* ── Main Page ─────────────────────────────────────────────── */

export default function UrunlerPage() {
  const { t } = useLanguage();

  // Data
  const [isletmeler, setIsletmeler] = useState([]);
  const [seciliIsletme, setSeciliIsletme] = useState('');
  const [urunler, setUrunler] = useState([]);
  const [toplam, setToplam] = useState(0);
  const [statsFixed, setStatsFixed] = useState({ toplam: 0, aktif: 0, pasif: 0 });
  const [sayfa, setSayfa] = useState(1);
  const [arama, setArama] = useState('');
  const [yukleniyor, setYukleniyor] = useState(false);
  const [aktifFiltre, setAktifFiltre] = useState('aktif');

  // Modal state
  const [modalAcik, setModalAcik] = useState(false);
  const [seciliUrun, setSeciliUrun] = useState(null);

  // Restore
  const [geriAlUrun, setGeriAlUrun] = useState(null);

  // Excel
  const [excelAdim, setExcelAdim] = useState(0);
  const [onizleme, setOnizleme] = useState(null);
  const [excelYuk, setExcelYuk] = useState(false);
  const [seciliDosya, setSeciliDosya] = useState(null);
  const [excelIsletmeId, setExcelIsletmeId] = useState('');
  const dosyaRef = useRef(null);

  // Tree-table state
  const [expandedGroups, setExpandedGroups] = useState(new Set());
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [bulkMenuOpen, setBulkMenuOpen] = useState(false);
  const [bulkMoving, setBulkMoving] = useState(false);
  const [firstLoad, setFirstLoad] = useState(true);

  // Category management state
  // Kategori düzenleme modal
  const [catEditModal, setCatEditModal] = useState({ open: false, cat: '', products: [] });
  const [catEditName, setCatEditName] = useState('');
  const [catEditIsletmeler, setCatEditIsletmeler] = useState([]);
  const [catEditLoading, setCatEditLoading] = useState(false);
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'card'
  const [kategoriModalOpen, setKategoriModalOpen] = useState(false);
  const [kategoriModalAdi, setKategoriModalAdi] = useState('');
  const [kategoriModalIsletmeler, setKategoriModalIsletmeler] = useState([]);
  const [emptyCategories, setEmptyCategories] = useState([]); // client-only empty category placeholders
  // (toolbar ref removed — using modal now)
  // editCategoryRef removed — using modal

  // Load businesses
  useEffect(() => {
    api.get('/isletmeler?aktif=true').then(r => setIsletmeler(r.data));
  }, []);

  // Fetch GLOBAL stats once on mount
  useEffect(() => {
    api.get('/urunler?limit=1&aktif=all').then(res => {
      const toplamCount = res.data?.toplam ?? 0;
      api.get('/urunler?limit=1&aktif=0').then(res2 => {
        const pasifCount = res2.data?.toplam ?? 0;
        setStatsFixed({ toplam: toplamCount, aktif: toplamCount - pasifCount, pasif: pasifCount });
      });
    }).catch(() => {});
  }, []);

  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const scrollRef = useRef(null);

  // Load products — append mode for infinite scroll
  const getUrunler = useCallback(async (reset = false) => {
    const currentPage = reset ? 1 : sayfa;
    if (reset) {
      setYukleniyor(true);
      setSayfa(1);
    } else {
      setLoadingMore(true);
    }
    try {
      const p = new URLSearchParams({ sayfa: currentPage, limit: PER_PAGE });
      if (seciliIsletme) p.set('isletme_id', seciliIsletme);
      if (arama) p.set('q', arama);
      if (aktifFiltre === 'aktif') p.set('aktif', '1');
      else if (aktifFiltre === 'pasif') p.set('aktif', '0');
      else p.set('aktif', 'all');
      const { data } = await api.get(`/urunler?${p}`);
      const newItems = data.data || [];
      if (reset) {
        setUrunler(newItems);
        setSelectedIds(new Set());
      } else {
        setUrunler(prev => [...prev, ...newItems]);
      }
      setToplam(data.toplam);
      setHasMore(currentPage * PER_PAGE < data.toplam);
    } finally {
      setYukleniyor(false);
      setLoadingMore(false);
      setFirstLoad(false);
    }
  }, [seciliIsletme, sayfa, arama, aktifFiltre]);

  // Initial load + reset on filter change
  useEffect(() => {
    getUrunler(true);
  }, [seciliIsletme, arama, aktifFiltre]);

  // Infinite scroll handler
  useEffect(() => {
    const handleScroll = () => {
      if (loadingMore || !hasMore) return;
      const scrollY = window.scrollY + window.innerHeight;
      const docHeight = document.documentElement.scrollHeight;
      if (docHeight - scrollY < LOAD_MORE_THRESHOLD) {
        setSayfa(prev => prev + 1);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [loadingMore, hasMore]);

  // Load next page when sayfa changes (not on first load)
  useEffect(() => {
    if (sayfa > 1) getUrunler(false);
  }, [sayfa]);

  // Group products by category (client-side on current page data)
  const grouped = useMemo(() => {
    const map = new Map();
    for (const u of urunler) {
      const cat = u.kategori?.trim() || KATEGORISIZ;
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat).push(u);
    }
    // Add empty categories (client-only placeholders)
    for (const ec of emptyCategories) {
      if (!map.has(ec)) map.set(ec, []);
    }
    // Sort: named categories first (alphabetical), then Kategorisiz last
    const entries = [...map.entries()].sort((a, b) => {
      if (a[0] === KATEGORISIZ) return 1;
      if (b[0] === KATEGORISIZ) return -1;
      return a[0].localeCompare(b[0], 'tr');
    });
    return entries;
  }, [urunler, emptyCategories]);

  // Extract unique category names for bulk move
  const allCategories = useMemo(() => {
    const cats = new Set();
    for (const u of urunler) {
      if (u.kategori?.trim()) cats.add(u.kategori.trim());
    }
    for (const ec of emptyCategories) {
      cats.add(ec);
    }
    return [...cats].sort((a, b) => a.localeCompare(b, 'tr'));
  }, [urunler, emptyCategories]);

  // Start with all groups COLLAPSED (empty set = nothing expanded)
  // Only reset on filter/search change, not on every data load
  useEffect(() => {
    setExpandedGroups(new Set());
  }, [seciliIsletme, arama, aktifFiltre]);

  useEffect(() => {
    // kategori modal focus handled by modal itself
  }, []);

  useEffect(() => {
    // category edit focus removed — using modal now
  }, []);

  // Modal open handlers
  const handleYeniUrun = () => {
    setSeciliUrun(null);
    setModalAcik(true);
  };

  const openEdit = (u) => {
    setSeciliUrun(u);
    setModalAcik(true);
  };

  // Restore handler
  const handleGeriAl = async () => {
    if (!geriAlUrun) return;
    try {
      await api.put(`/urunler/${geriAlUrun.id}/restore`);
      toast.success(t('toast.productRestored'));
      setGeriAlUrun(null);
      getUrunler(true);
    } catch (err) {
      toast.error(err.response?.data?.hata || t('toast.restoreFailed'));
    }
  };

  // Toggle expand/collapse
  const toggleGroup = (cat) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  };

  // Checkbox logic
  const toggleSelectProduct = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectGroup = (products) => {
    const ids = products.map(u => u.id);
    const allSelected = ids.every(id => selectedIds.has(id));
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (allSelected) {
        ids.forEach(id => next.delete(id));
      } else {
        ids.forEach(id => next.add(id));
      }
      return next;
    });
  };

  const isGroupSelected = (products) => {
    return products.length > 0 && products.every(u => selectedIds.has(u.id));
  };

  const isGroupIndeterminate = (products) => {
    const sel = products.filter(u => selectedIds.has(u.id)).length;
    return sel > 0 && sel < products.length;
  };

  // Bulk move
  const handleBulkMove = async (targetKategori) => {
    setBulkMenuOpen(false);
    if (selectedIds.size === 0) return;
    setBulkMoving(true);
    try {
      const promises = [...selectedIds].map(id => {
        const urun = urunler.find(u => u.id === id);
        return api.put(`/urunler/${id}`, {
          urun_adi: urun?.urun_adi || '',
          urun_kodu: urun?.urun_kodu || '',
          kategori: targetKategori,
        });
      });
      await Promise.all(promises);
      toast.success(`${selectedIds.size} urun tasinildi`);
      setSelectedIds(new Set());
      getUrunler(true);
    } catch (err) {
      toast.error(err.response?.data?.hata || 'Tasima basarisiz');
    } finally {
      setBulkMoving(false);
    }
  };

  // Open category edit modal
  const openCatEditModal = (cat, products) => {
    setCatEditModal({ open: true, cat, products });
    setCatEditName(cat);
    // Find which isletmeler have products in this category
    const islIds = [...new Set(products.map(u => u.isletme_id).filter(Boolean))];
    setCatEditIsletmeler(islIds);
  };

  // Save category edit (rename)
  const handleCatEditSave = async () => {
    const trimmed = catEditName.trim();
    const { cat: oldCat, products } = catEditModal;
    if (!trimmed) return;
    setCatEditLoading(true);
    try {
      if (trimmed !== oldCat && products.length > 0) {
        const promises = products.map(u =>
          api.put(`/urunler/${u.id}`, { urun_adi: u.urun_adi, urun_kodu: u.urun_kodu, kategori: trimmed })
        );
        await Promise.all(promises);
      } else if (trimmed !== oldCat && products.length === 0) {
        setEmptyCategories(prev => prev.map(c => c === oldCat ? trimmed : c));
      }
      toast.success(`Kategori guncellendi`);
      setCatEditModal({ open: false, cat: '', products: [] });
      getUrunler(true);
    } catch (err) {
      toast.error(err.response?.data?.hata || 'Kategori guncellenemedi');
    } finally {
      setCatEditLoading(false);
    }
  };

  // Category delete — state for confirm modal
  const [catDeleteModal, setCatDeleteModal] = useState({ open: false, cat: '', products: [] });
  const [catDeleteLoading, setCatDeleteLoading] = useState(false);
  const [catRestoreModal, setCatRestoreModal] = useState({ open: false, cat: '', products: [] });
  const [catRestoreLoading, setCatRestoreLoading] = useState(false);

  const handleCategoryDelete = (cat, products) => {
    if (products.length === 0) {
      setEmptyCategories(prev => prev.filter(c => c !== cat));
      return;
    }
    setCatDeleteModal({ open: true, cat, products });
  };

  const confirmCategoryDelete = async () => {
    const { cat, products } = catDeleteModal;
    setCatDeleteLoading(true);
    try {
      // Ürünleri pasife çek (aktif=false) — kategori korunsun
      const promises = products.map(u =>
        api.put(`/urunler/${u.id}`, { urun_adi: u.urun_adi, urun_kodu: u.urun_kodu, kategori: u.kategori || '' })
          .then(() => api.delete(`/urunler/${u.id}`))
      );
      await Promise.all(promises);
      setEmptyCategories(prev => prev.filter(c => c !== cat));
      toast.success(`"${cat}" kategorisi silindi — ${products.length} urun pasife alindi`);
      setCatDeleteModal({ open: false, cat: '', products: [] });
      getUrunler(true);
    } catch (err) {
      toast.error(err.response?.data?.hata || 'Silme basarisiz');
    } finally {
      setCatDeleteLoading(false);
    }
  };

  // New category creation (toolbar)
  const handleKategoriModalSubmit = () => {
    const name = kategoriModalAdi.trim();
    if (!name) return;
    if (allCategories.includes(name)) {
      toast.error('Bu kategori zaten mevcut');
      return;
    }
    if (kategoriModalIsletmeler.length === 0) {
      toast.error('En az bir isletme secin');
      return;
    }
    setEmptyCategories(prev => [...prev, name]);
    setKategoriModalAdi('');
    setKategoriModalIsletmeler([]);
    setKategoriModalOpen(false);
    toast.success(`"${name}" kategorisi ${kategoriModalIsletmeler.length} isletme icin olusturuldu`);
  };

  // Excel modal open
  const handleExcelAc = () => {
    setExcelIsletmeId(seciliIsletme || '');
    setSeciliDosya(null);
    setOnizleme(null);
    setExcelAdim(1);
  };

  // Excel preview
  const handleOnizleme = async () => {
    if (!seciliDosya || !excelIsletmeId) {
      toast.error(!excelIsletmeId ? t('toast.selectBusiness') : t('toast.selectFile'));
      return;
    }
    setExcelYuk(true);
    const fd = new FormData();
    fd.append('dosya', seciliDosya);
    try {
      const { data } = await api.post(`/urunler/yukle?isletme_id=${excelIsletmeId}&preview=true`, fd);
      setOnizleme(data);
      setExcelAdim(2);
    } catch (err) {
      toast.error(err.response?.data?.hata || t('toast.fileReadFailed'));
    } finally {
      setExcelYuk(false);
    }
  };

  // Excel confirm
  const handleOnayla = async () => {
    setExcelYuk(true);
    const fd = new FormData();
    fd.append('dosya', seciliDosya);
    try {
      const { data } = await api.post(`/urunler/yukle?isletme_id=${excelIsletmeId}&preview=false`, fd);
      toast.success(`${data.yeni} yeni, ${data.degisecek} guncellendi.`);
      setExcelAdim(0);
      setSeciliDosya(null);
      setOnizleme(null);
      getUrunler(true);
    } catch {
      toast.error(t('toast.error'));
    } finally {
      setExcelYuk(false);
    }
  };

  // Template download
  const handleSablonIndir = async () => {
    try {
      const res = await api.get('/urunler/sablon', { responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = 'stoksay_sablon.xlsx';
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error(t('toast.templateFailed'));
    }
  };

  // Search handler
  const handleSearch = useCallback((val) => {
    setArama(val);
    setSayfa(1);
  }, []);

  const inputCls = 'w-full px-4 py-2.5 text-sm rounded-xl bg-surface-container-low text-on-surface outline-none ghost-border ghost-border-focus placeholder:text-on-surface-variant/50';

  return (
    <div className="p-4 md:p-6 space-y-4 pb-24">

      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold font-headline text-on-surface">
            {t('products.title')}
          </h1>
          <p className="text-xs text-on-surface-variant mt-0.5">
            {t('products.subtitle') || 'Urun yonetimi'}
          </p>
        </div>
        <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
          {/* Tablo / Kart görünüm geçişi */}
          <div className="flex items-center bg-surface-container-low rounded-lg p-0.5">
            <button
              onClick={() => setViewMode('table')}
              className={`h-7 w-7 rounded-md flex items-center justify-center transition-colors ${viewMode === 'table' ? 'bg-white shadow-sm text-primary' : 'text-on-surface-variant/50 hover:text-on-surface-variant'}`}
              title="Tablo görünümü"
            >
              <span className="material-symbols-outlined text-base">view_list</span>
            </button>
            <button
              onClick={() => setViewMode('card')}
              className={`h-7 w-7 rounded-md flex items-center justify-center transition-colors ${viewMode === 'card' ? 'bg-white shadow-sm text-primary' : 'text-on-surface-variant/50 hover:text-on-surface-variant'}`}
              title="Kart görünümü"
            >
              <span className="material-symbols-outlined text-base">grid_view</span>
            </button>
          </div>

          <button
            onClick={handleExcelAc}
            className="h-8 flex items-center gap-1.5 px-3 rounded-xl text-xs font-bold bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high transition-colors"
          >
            <span className="material-symbols-outlined text-sm">upload_file</span>
            Excel
          </button>

          {/* Yeni Kategori — renkli */}
          <button
            onClick={() => setKategoriModalOpen(true)}
            className="h-8 flex items-center gap-1.5 px-3 rounded-xl text-xs font-bold text-white transition-all hover:opacity-90"
            style={{ background: 'linear-gradient(135deg, #7f23cd, #9945e8)' }}
          >
            <span className="material-symbols-outlined text-sm">create_new_folder</span>
            Yeni Kategori
          </button>

          <button
            onClick={handleYeniUrun}
            className="h-8 flex items-center gap-1.5 px-3 rounded-xl text-xs font-bold text-white shadow-md hover:shadow-lg transition-shadow"
            style={{ background: 'linear-gradient(135deg, #4343d5, #5d5fef)' }}
          >
            <span className="material-symbols-outlined text-sm">add</span>
            {t('products.new')}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4">
        <span className="text-sm font-bold" style={{ color: '#4343d5' }}>{statsFixed.toplam}</span>
        <span className="text-[11px] text-on-surface-variant">{t('products.totalProducts')}</span>
        <span className="w-px h-4 bg-outline-variant/20" />
        <span className="text-sm font-bold text-success">{statsFixed.aktif}</span>
        <span className="text-[11px] text-on-surface-variant">Aktif</span>
        <span className="w-px h-4 bg-outline-variant/20" />
        <span className="text-sm font-bold text-error">{statsFixed.pasif}</span>
        <span className="text-[11px] text-on-surface-variant">Pasif</span>
      </div>

      {/* Toolbar: Search + Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="max-w-xs">
          <SearchBox
            value={arama}
            onChange={handleSearch}
            placeholder={t('products.search')}
          />
        </div>

        <select
          value={seciliIsletme}
          onChange={e => { setSeciliIsletme(e.target.value); setSayfa(1); }}
          className="h-8 text-xs px-3 rounded-xl bg-surface-container-low text-on-surface outline-none ghost-border ghost-border-focus font-medium min-w-[150px]"
        >
          <option value="">{t('filter.allBusinesses')}</option>
          {isletmeler.map(i => (
            <option key={i.id} value={i.id}>{i.ad}</option>
          ))}
        </select>

        <div className="flex items-center gap-1 bg-surface-container-low rounded-xl p-1">
          {[
            { k: 'tumu', l: t('filter.all'), icon: 'apps' },
            { k: 'aktif', l: t('filter.active'), icon: 'check_circle' },
            { k: 'pasif', l: t('filter.passive'), icon: 'cancel' },
          ].map(f => (
            <button
              key={f.k}
              onClick={() => { setAktifFiltre(f.k); setSayfa(1); }}
              className={`h-8 px-3 rounded-xl text-[11px] font-semibold transition-colors flex items-center gap-1.5 ${
                aktifFiltre === f.k
                  ? 'text-white shadow-sm'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
              style={aktifFiltre === f.k ? { background: 'linear-gradient(135deg, #4343d5, #5d5fef)', color: 'white' } : undefined}
            >
              <span className="material-symbols-outlined text-sm">{f.icon}</span>
              {f.l}
            </button>
          ))}
        </div>
      </div>

      {/* Tree Table Content */}
      <div className="space-y-0">
        {yukleniyor && firstLoad ? (
          <div className="space-y-1">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="h-10 bg-surface-container-low rounded-lg animate-pulse" />
            ))}
          </div>
        ) : urunler.length === 0 && emptyCategories.length === 0 ? (
          <div className="bg-surface-container-lowest rounded-2xl p-12 text-center shadow-card">
            <span className="material-symbols-outlined text-5xl text-on-surface-variant/30 mb-3 block">
              inventory_2
            </span>
            <p className="text-on-surface-variant font-medium">
              {arama ? `"${arama}" ${t('products.searchNotFound')}` : t('products.notFound')}
            </p>
          </div>
        ) : (
          <>
            {/* ── Table View ── */}
            {viewMode === 'table' && (
            <>
            {/* Table header */}
            <div className="hidden md:grid grid-cols-[40px_40px_1fr_120px_120px_100px_140px_80px_36px] items-center px-3 py-2 bg-surface-container-low rounded-t-xl">
              <div /> {/* checkbox col */}
              <div /> {/* expand col */}
              <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Urun Adi</span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Urun Kodu</span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Ikinci Isim</span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Birim</span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Barkod</span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant text-center">Durum</span>
              <div /> {/* edit button col */}
            </div>

            {/* Tree rows */}
            <div className={`rounded-b-xl overflow-hidden ${yukleniyor ? 'opacity-50 pointer-events-none' : ''}`}>
              {grouped.map(([cat, products]) => {
                const isExpanded = expandedGroups.has(cat);
                const displayCat = cat === KATEGORISIZ ? 'Kategorisiz' : cat;
                const groupSelected = isGroupSelected(products);
                const groupIndeterminate = isGroupIndeterminate(products);
                const isEditingThisCat = false; // inline editing removed — using modal
                const isRealCategory = cat !== KATEGORISIZ;

                return (
                  <div key={cat}>
                    {/* Category header row */}
                    <div
                      className={`group grid grid-cols-[40px_40px_1fr] md:grid-cols-[40px_40px_1fr_120px_120px_100px_140px_80px_36px] items-center px-3 py-2.5 cursor-pointer select-none transition-colors ${
                        products.length > 0 && products.every(u => u.aktif === false || u.aktif === 0)
                          ? 'bg-red-50 hover:bg-red-100/60'
                          : groupSelected ? 'bg-primary/8' : 'bg-primary/5 hover:bg-primary/8'
                      }`}
                      onClick={() => toggleGroup(cat)}
                    >
                      {/* Folder icon */}
                      <div className="flex items-center justify-center">
                        <span className={`material-symbols-outlined text-lg ${
                          products.length > 0 && products.every(u => u.aktif === false || u.aktif === 0)
                            ? 'text-red-400' : 'text-primary/70'
                        }`}>
                          {isExpanded ? 'folder_open' : 'folder'}
                        </span>
                      </div>

                      {/* Expand arrow */}
                      <div className="flex items-center justify-center">
                        <span className={`material-symbols-outlined text-lg text-primary transition-transform duration-150 ${isExpanded ? '' : '-rotate-90'}`}>
                          expand_more
                        </span>
                      </div>

                      {/* Category name + edit button */}
                      <div className="flex items-center gap-2 md:col-span-7">
                        <span className={`text-sm font-bold ${
                          products.length > 0 && products.every(u => u.aktif === false || u.aktif === 0)
                            ? 'text-red-400' : 'text-primary'
                        }`}>
                          {displayCat}
                        </span>
                        <span className={`text-xs font-medium ${
                          products.length > 0 && products.every(u => u.aktif === false || u.aktif === 0)
                            ? 'text-red-300' : 'text-primary/60'
                        }`}>
                          ({products.length} urun)
                        </span>

                        {/* Edit button — opens popup, hover only, not for Kategorisiz */}
                        {isRealCategory && (
                          <button
                            onClick={e => {
                              e.stopPropagation();
                              openCatEditModal(cat, products);
                            }}
                            className="w-6 h-6 rounded-md flex items-center justify-center text-on-surface-variant/40 hover:text-primary hover:bg-primary/10 transition-colors opacity-0 group-hover:opacity-100"
                          >
                            <span className="material-symbols-outlined text-sm">edit</span>
                          </button>
                        )}

                        {/* Toplu Geri Al — pasif ürünler varsa göster */}
                        {products.some(u => u.aktif === 0 || u.aktif === false) && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              const pasifUrunler = products.filter(u => u.aktif === 0 || u.aktif === false);
                              setCatRestoreModal({ open: true, cat: displayCat, products: pasifUrunler });
                            }}
                            className="h-6 px-2 rounded-md flex items-center gap-1 text-[10px] font-semibold text-success bg-success/10 hover:bg-success/20 transition-colors opacity-0 group-hover:opacity-100"
                          >
                            <span className="material-symbols-outlined text-xs">undo</span>
                            {t('action.restoreAll')}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Product rows */}
                    {isExpanded && products.map(u => {
                      const pasif = u.aktif === 0 || u.aktif === false;
                      const isSelected = selectedIds.has(u.id);
                      const barkod = u.barkodlar
                        ? u.barkodlar.split(',')[0]?.trim()
                        : '';

                      return (
                        <div
                          key={u.id}
                          className={`group/row grid grid-cols-[40px_40px_1fr_36px] md:grid-cols-[40px_40px_1fr_120px_120px_100px_140px_80px_36px] items-center px-3 py-2 cursor-pointer transition-colors ${
                            isSelected
                              ? 'bg-primary/8'
                              : pasif
                                ? 'bg-red-50 hover:bg-red-100/60'
                                : 'bg-surface-container-lowest hover:bg-surface-container-low'
                          }`}
                          onClick={() => toggleSelectProduct(u.id)}
                          onDoubleClick={() => openEdit(u)}
                        >
                          {/* Checkbox */}
                          <div className="flex items-center justify-center" onClick={e => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleSelectProduct(u.id)}
                              onClick={e => e.stopPropagation()}
                              className="w-4 h-4 rounded accent-primary cursor-pointer"
                            />
                          </div>

                          {/* Indent spacer (where expand arrow is for groups) */}
                          <div />

                          {/* Product name */}
                          <div className="min-w-0 pr-2">
                            <p className={`text-sm font-medium truncate ${pasif ? 'text-red-400' : 'text-on-surface'}`}>
                              {u.urun_adi}
                            </p>
                            {/* Mobile-only extra info */}
                            <div className="flex items-center gap-2 md:hidden mt-0.5">
                              <span className="text-xs text-on-surface-variant">{u.urun_kodu}</span>
                              <span className="text-xs text-on-surface-variant/60">{u.birim || 'ADET'}</span>
                              {pasif && <StatusChip status="pasif" size="sm" />}
                            </div>
                          </div>

                          {/* Product code - desktop */}
                          <span className="hidden md:block text-xs font-mono text-on-surface-variant truncate">
                            {u.urun_kodu}
                          </span>

                          {/* Second name - desktop */}
                          <span className="hidden md:block text-xs text-on-surface-variant truncate">
                            {u.isim_2 || ''}
                          </span>

                          {/* Unit - desktop */}
                          <span className="hidden md:block text-xs text-on-surface-variant">
                            {u.birim || 'ADET'}
                          </span>

                          {/* Barcode - desktop */}
                          <span className="hidden md:block text-xs font-mono text-on-surface-variant truncate">
                            {barkod}
                            {u.barkodlar && u.barkodlar.split(',').length > 1 && (
                              <span className="text-on-surface-variant/40 ml-1">
                                +{u.barkodlar.split(',').length - 1}
                              </span>
                            )}
                          </span>

                          {/* Status - desktop */}
                          <div className="hidden md:flex items-center justify-center">
                            <StatusChip status={pasif ? 'pasif' : 'aktif'} size="sm" />
                          </div>

                          {/* Action buttons */}
                          <div className="flex items-center justify-center gap-0.5">
                            {pasif ? (
                              <button
                                onClick={(e) => { e.stopPropagation(); setGeriAlUrun(u); }}
                                className="h-6 px-2 rounded-md flex items-center justify-center gap-1 text-[10px] font-semibold text-success bg-success/10 hover:bg-success/20 transition-colors"
                                title={t('action.restore')}
                              >
                                <span className="material-symbols-outlined text-xs">undo</span>
                                Geri Al
                              </button>
                            ) : (
                              <button
                                onClick={(e) => { e.stopPropagation(); openEdit(u); }}
                                className="w-6 h-6 rounded-md flex items-center justify-center text-on-surface-variant/40 hover:text-primary hover:bg-primary/10 transition-colors md:opacity-0 md:group-hover/row:opacity-100"
                                title={t('action.edit')}
                              >
                                <span className="material-symbols-outlined text-sm">edit</span>
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })}

            </div>

            {/* Infinite scroll: loading indicator */}
            {loadingMore && (
              <div className="flex items-center justify-center py-4 gap-2">
                <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                <span className="text-xs text-on-surface-variant">Yukleniyor...</span>
              </div>
            )}
            {!hasMore && urunler.length > 0 && (
              <p className="text-center text-[11px] text-on-surface-variant/50 py-3">
                {urunler.length} / {toplam} urun gosteriliyor
              </p>
            )}
            </>
            )}

            {/* ── Card View ── */}
            {viewMode === 'card' && !yukleniyor && urunler.length > 0 && (
              <>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-2">
                  {urunler.map(u => {
                    const pasif = u.aktif === false || u.aktif === 0;
                    return (
                      <div key={u.id}
                        onDoubleClick={() => openEdit(u)}
                        className={`rounded-xl p-3 shadow-card hover:shadow-elevated transition-shadow cursor-pointer flex flex-col min-h-[100px] ${pasif ? 'bg-red-50' : 'bg-surface-container-lowest'}`}
                      >
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <p className="text-[11px] font-bold text-primary truncate flex-1 min-w-0">{u.urun_kodu}</p>
                          <StatusChip status={pasif ? 'pasif' : 'aktif'} size="sm" />
                        </div>
                        <p className="text-[13px] font-semibold text-on-surface line-clamp-1">{u.urun_adi}</p>
                        {u.isim_2 && <p className="text-[11px] text-on-surface-variant/70 truncate">{u.isim_2}</p>}
                        <div className="flex items-center gap-1.5 mt-auto pt-1.5">
                          {u.birim && <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-surface-container-high text-on-surface-variant">{u.birim}</span>}
                          {u.kategori && <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-tertiary/10 text-tertiary truncate max-w-[80px]">{u.kategori}</span>}
                          {pasif ? (
                            <button onClick={(e) => { e.stopPropagation(); setGeriAlUrun(u); }}
                              className="ml-auto h-6 px-2 rounded-md flex items-center gap-1 text-[10px] font-semibold text-success bg-success/10 hover:bg-success/20 transition-colors">
                              <span className="material-symbols-outlined text-xs">undo</span>
                              Geri Al
                            </button>
                          ) : (
                            <button onClick={(e) => { e.stopPropagation(); openEdit(u); }}
                              className="ml-auto w-6 h-6 rounded-md flex items-center justify-center text-on-surface-variant/50 hover:text-primary hover:bg-primary/10 transition-colors">
                              <span className="material-symbols-outlined text-sm">edit</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
                {/* Infinite scroll indicators same as table mode */}
                {loadingMore && (
                  <div className="flex items-center justify-center py-4 gap-2">
                    <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                    <span className="text-xs text-on-surface-variant">Yukleniyor...</span>
                  </div>
                )}
                {!hasMore && urunler.length > 0 && (
                  <p className="text-center text-[11px] text-on-surface-variant/50 py-3">{urunler.length} / {toplam} urun</p>
                )}
              </>
            )}
          </>
        )}
      </div>

      {/* Bottom action bar - bulk move */}
      {selectedIds.size > 0 && (
        <div
          className="fixed bottom-0 left-0 right-0 z-40 bg-surface-container-lowest shadow-elevated"
          style={{ boxShadow: '0 -4px 20px rgba(0,0,0,0.08)' }}
        >
          <div className="max-w-screen-xl mx-auto px-4 md:px-6 py-3 flex items-center gap-4">
            {/* Selected count */}
            <div className="flex items-center gap-2">
              <span
                className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold"
                style={{ background: 'linear-gradient(135deg, #4343d5, #5d5fef)' }}
              >
                {selectedIds.size}
              </span>
              <span className="text-sm font-semibold text-on-surface">
                urun secildi
              </span>
            </div>

            {/* Clear selection */}
            <button
              onClick={() => setSelectedIds(new Set())}
              className="text-xs font-semibold text-on-surface-variant hover:text-on-surface transition-colors"
            >
              Temizle
            </button>

            <div className="flex-1" />

            {/* Restore button for passive filter */}
            {aktifFiltre === 'pasif' && (
              <button
                onClick={() => {
                  const firstSelected = urunler.find(u => selectedIds.has(u.id));
                  if (firstSelected) setGeriAlUrun(firstSelected);
                }}
                className="h-9 px-4 rounded-xl text-sm font-bold text-white flex items-center gap-2"
                style={{ background: 'linear-gradient(135deg, #10B981, #059669)' }}
              >
                <span className="material-symbols-outlined text-sm">undo</span>
                Geri Al
              </button>
            )}

            {/* Bulk move */}
            <div className="relative">
              <button
                onClick={() => setBulkMenuOpen(!bulkMenuOpen)}
                disabled={bulkMoving}
                className="h-9 px-5 rounded-xl text-sm font-bold text-white flex items-center gap-2 disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, #4343d5, #5d5fef)' }}
              >
                {bulkMoving ? (
                  <>
                    <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>
                    Tasiniyor...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-sm">drive_file_move</span>
                    Toplu Tasi
                    <span className="material-symbols-outlined text-sm">expand_more</span>
                  </>
                )}
              </button>

              {bulkMenuOpen && (
                <BulkMoveDropdown
                  categories={allCategories}
                  onSelect={handleBulkMove}
                  onClose={() => setBulkMenuOpen(false)}
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Product Add/Edit Modal */}
      <UrunModal
        open={modalAcik}
        onClose={() => setModalAcik(false)}
        initial={seciliUrun}
        isletmeId={seciliIsletme}
        isletmeler={isletmeler}
        mevcutKategoriler={allCategories}
        onSaved={() => getUrunler(true)}
      />

      {/* Excel Upload Modal */}
      {excelAdim > 0 && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center modal-backdrop"
          style={{ animation: 'fadeIn 0.15s ease' }}
          onClick={() => { setExcelAdim(0); setSeciliDosya(null); }}
        >
          <div
            className="relative bg-surface-container-lowest rounded-2xl shadow-elevated w-full max-w-lg mx-4 p-6"
            style={{ animation: 'slideUp 0.2s ease' }}
            onClick={e => e.stopPropagation()}
          >
            <div
              className="absolute top-0 left-0 right-0 h-0.5 rounded-t-2xl"
              style={{ background: 'linear-gradient(135deg, #4343d5, #5d5fef)' }}
            />

            {excelAdim === 1 && (
              <>
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: 'rgba(67,67,213,0.08)' }}
                    >
                      <span className="material-symbols-outlined text-xl" style={{ color: '#4343d5' }}>
                        upload_file
                      </span>
                    </div>
                    <h3 className="text-lg font-bold font-headline text-on-surface">
                      {t('products.excelUpload')}
                    </h3>
                  </div>
                  <button
                    onClick={handleSablonIndir}
                    className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary/80 bg-primary/8 hover:bg-primary/15 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    <span className="material-symbols-outlined text-sm">download</span>
                    Sablon Indir
                  </button>
                </div>

                <div className="mb-4">
                  <label className="block text-xs font-semibold text-on-surface-variant mb-1.5 uppercase tracking-wide">
                    {t('products.business')} <span className="text-error">*</span>
                  </label>
                  <select
                    value={excelIsletmeId}
                    onChange={e => setExcelIsletmeId(e.target.value)}
                    className={inputCls}
                  >
                    <option value="">{t('products.businessSelect')}</option>
                    {isletmeler.map(i => (
                      <option key={i.id} value={i.id}>{i.ad}</option>
                    ))}
                  </select>
                </div>

                <div
                  onClick={() => dosyaRef.current?.click()}
                  className={`rounded-2xl p-8 text-center cursor-pointer transition-colors mb-4 ${
                    seciliDosya ? 'bg-primary/8' : 'bg-surface-container-low'
                  }`}
                  style={{
                    border: '2px dashed',
                    borderColor: seciliDosya ? '#4343d5' : 'rgba(0,0,0,0.1)',
                  }}
                >
                  {seciliDosya ? (
                    <div>
                      <span className="material-symbols-outlined text-4xl mb-2 block" style={{ color: '#4343d5' }}>
                        upload_file
                      </span>
                      <p className="font-semibold text-on-surface text-sm">{seciliDosya.name}</p>
                      <p className="text-xs text-primary mt-1">Degistirmek icin tiklayin</p>
                    </div>
                  ) : (
                    <div>
                      <span className="material-symbols-outlined text-4xl text-on-surface-variant/30 mb-2 block">
                        upload_file
                      </span>
                      <p className="text-sm text-on-surface-variant font-medium">Dosya secmek icin tiklayin</p>
                      <p className="text-xs text-on-surface-variant/60 mt-1">.xlsx veya .xls</p>
                    </div>
                  )}
                </div>
                <input
                  ref={dosyaRef}
                  type="file"
                  accept=".xlsx,.xls"
                  className="hidden"
                  onChange={e => setSeciliDosya(e.target.files[0])}
                />

                <div className="flex gap-3">
                  <button
                    onClick={() => { setExcelAdim(0); setSeciliDosya(null); }}
                    className="flex-1 py-3 rounded-xl text-sm font-semibold bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high transition-colors"
                  >
                    {t('action.cancel')}
                  </button>
                  <button
                    onClick={handleOnizleme}
                    disabled={!seciliDosya || !excelIsletmeId || excelYuk}
                    className="flex-1 py-3 rounded-xl text-sm font-bold text-white disabled:opacity-50"
                    style={{ background: 'linear-gradient(135deg, #4343d5, #5d5fef)' }}
                  >
                    {excelYuk ? 'Analiz...' : 'Devam'}
                  </button>
                </div>
              </>
            )}

            {excelAdim === 2 && onizleme && (
              <>
                <h3 className="text-lg font-bold font-headline text-on-surface mb-5">Onizleme</h3>
                <div className="grid grid-cols-4 gap-3 mb-4">
                  {[
                    { l: 'Yeni', c: onizleme.yeni?.length, bg: 'bg-success/10', cl: 'text-success' },
                    { l: 'Degisecek', c: onizleme.degisecek?.length, bg: 'bg-warning/10', cl: 'text-warning' },
                    { l: 'Korunacak', c: onizleme.korunacak?.length, bg: 'bg-primary/10', cl: 'text-primary' },
                    { l: 'Hatali', c: onizleme.hatali?.length, bg: 'bg-error/10', cl: 'text-error' },
                  ].map(s => (
                    <div key={s.l} className={`rounded-2xl p-4 text-center ${s.bg}`}>
                      <p className={`text-2xl font-black ${s.cl}`}>{s.c ?? 0}</p>
                      <p className={`text-xs font-semibold mt-1 ${s.cl}`}>{s.l}</p>
                    </div>
                  ))}
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setExcelAdim(1)}
                    className="flex-1 py-3 rounded-xl text-sm font-semibold bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high transition-colors"
                  >
                    {t('action.back')}
                  </button>
                  <button
                    onClick={handleOnayla}
                    disabled={excelYuk}
                    className="flex-1 py-3 rounded-xl text-sm font-bold text-white disabled:opacity-50"
                    style={{ background: 'linear-gradient(135deg, #10B981, #059669)' }}
                  >
                    {excelYuk ? 'Yukleniyor...' : 'Onayla ve Yukle'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Restore Confirm Modal */}
      {geriAlUrun && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center p-4 modal-backdrop"
          style={{ animation: 'fadeIn 0.15s ease' }}
          onClick={() => setGeriAlUrun(null)}
        >
          <div
            className="bg-surface-container-lowest w-full max-w-sm rounded-2xl shadow-elevated overflow-hidden p-6"
            style={{ animation: 'slideUp 0.2s ease' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-success/10">
                <span className="material-symbols-outlined text-xl text-success">undo</span>
              </div>
              <div>
                <p className="font-bold text-on-surface text-sm">{t('action.restore')}</p>
                <p className="text-xs text-on-surface-variant">Bu urun tekrar aktif olacak</p>
              </div>
            </div>
            <p className="text-sm text-on-surface-variant mb-5">
              <span className="font-bold text-on-surface">{geriAlUrun.urun_adi}</span> geri alinacak. Devam etmek istiyor musunuz?
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setGeriAlUrun(null)}
                className="py-3 rounded-xl font-bold text-sm text-on-surface-variant bg-surface-container-low hover:bg-surface-container-high transition-colors"
              >
                {t('action.giveUp')}
              </button>
              <button
                onClick={handleGeriAl}
                className="py-3 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2"
                style={{ background: 'linear-gradient(135deg, #10B981, #059669)' }}
              >
                <span className="material-symbols-outlined text-sm">undo</span>
                {t('action.restore')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Yeni Kategori Modal ── */}
      {kategoriModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center modal-backdrop"
          onClick={e => { if (e.target === e.currentTarget) setKategoriModalOpen(false); }}>
          <div className="bg-surface-container-lowest rounded-2xl shadow-elevated w-full max-w-sm mx-4"
            style={{ animation: 'slideUp 0.2s ease' }}>
            <div className="h-0.5 w-full rounded-t-2xl" style={{ background: 'linear-gradient(135deg, #4343d5, #5d5fef)' }} />
            <div className="p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgba(67,67,213,0.1)' }}>
                  <span className="material-symbols-outlined text-lg" style={{ color: '#4343d5' }}>create_new_folder</span>
                </div>
                <h3 className="text-base font-bold font-headline text-on-surface flex-1">Yeni Kategori</h3>
                <button onClick={() => setKategoriModalOpen(false)}
                  className="w-7 h-7 rounded-md flex items-center justify-center text-on-surface-variant/60 hover:bg-surface-container-high">
                  <span className="material-symbols-outlined text-lg">close</span>
                </button>
              </div>

              {/* Kategori adı */}
              <label className="block text-[10px] font-bold text-on-surface-variant uppercase tracking-wide mb-1">Kategori Adı *</label>
              <input
                type="text"
                value={kategoriModalAdi}
                onChange={e => setKategoriModalAdi(e.target.value)}
                placeholder="Kategori adini yazin..."
                className="w-full h-9 px-3 rounded-xl bg-surface-container-low text-on-surface text-sm outline-none ghost-border ghost-border-focus mb-3"
                autoFocus
              />

              {/* İşletme seçimi — çoklu */}
              <label className="block text-[10px] font-bold text-on-surface-variant uppercase tracking-wide mb-1">
                İşletmeler * <span className="normal-case font-normal tracking-normal text-on-surface-variant/60">(birden çok seçilebilir)</span>
              </label>
              <div className="bg-surface-container-low rounded-xl p-2 max-h-40 overflow-y-auto space-y-0.5 mb-4">
                {isletmeler.length === 0 ? (
                  <p className="text-xs text-on-surface-variant/50 text-center py-2">İşletme bulunamadı</p>
                ) : isletmeler.map(isl => {
                  const checked = kategoriModalIsletmeler.includes(isl.id);
                  return (
                    <label key={isl.id}
                      className={`flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer transition-colors text-xs ${checked ? 'bg-primary/10 text-primary font-semibold' : 'text-on-surface hover:bg-surface-container-high'}`}>
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => {
                          setKategoriModalIsletmeler(prev =>
                            checked ? prev.filter(id => id !== isl.id) : [...prev, isl.id]
                          );
                        }}
                        className="accent-primary w-3.5 h-3.5 rounded"
                      />
                      <span className="material-symbols-outlined text-sm">domain</span>
                      {isl.ad}
                    </label>
                  );
                })}
              </div>

              {/* Seçili sayı */}
              {kategoriModalIsletmeler.length > 0 && (
                <p className="text-[11px] text-primary font-semibold mb-3">
                  {kategoriModalIsletmeler.length} işletme seçildi
                </p>
              )}

              {/* Butonlar */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => { setKategoriModalOpen(false); setKategoriModalAdi(''); setKategoriModalIsletmeler([]); }}
                  className="flex-1 h-9 rounded-xl text-xs font-semibold bg-surface-container-high text-on-surface hover:bg-surface-container-highest transition-colors"
                >
                  Vazgeç
                </button>
                <button
                  onClick={handleKategoriModalSubmit}
                  disabled={!kategoriModalAdi.trim() || kategoriModalIsletmeler.length === 0}
                  className="flex-1 h-9 rounded-xl text-xs font-bold text-white disabled:opacity-40 transition-all"
                  style={{ background: 'linear-gradient(135deg, #4343d5, #5d5fef)' }}
                >
                  Oluştur
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Kategori Düzenleme Modal ── */}
      {catEditModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center modal-backdrop"
          onClick={e => { if (e.target === e.currentTarget && !catEditLoading) setCatEditModal({ open: false, cat: '', products: [] }); }}>
          <div className="bg-surface-container-lowest rounded-2xl shadow-elevated w-full max-w-sm mx-4">
            <div className="h-0.5 w-full rounded-t-2xl" style={{ background: 'linear-gradient(135deg, #7f23cd, #9945e8)' }} />
            <div className="p-5">
              {/* Header */}
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgba(127,35,205,0.1)' }}>
                  <span className="material-symbols-outlined text-lg" style={{ color: '#7f23cd' }}>edit</span>
                </div>
                <h3 className="text-base font-bold font-headline text-on-surface flex-1">Kategori Duzenle</h3>
                <button onClick={() => setCatEditModal({ open: false, cat: '', products: [] })}
                  className="w-7 h-7 rounded-md flex items-center justify-center text-on-surface-variant/60 hover:bg-surface-container-high">
                  <span className="material-symbols-outlined text-lg">close</span>
                </button>
              </div>

              {/* Kategori adı */}
              <label className="block text-[10px] font-bold text-on-surface-variant uppercase tracking-wide mb-1">Kategori Adi</label>
              <input
                type="text"
                value={catEditName}
                onChange={e => setCatEditName(e.target.value)}
                className="w-full h-9 px-3 rounded-xl bg-surface-container-low text-on-surface text-sm outline-none ghost-border ghost-border-focus mb-3"
                autoFocus
              />

              {/* İşletme seçimi */}
              <label className="block text-[10px] font-bold text-on-surface-variant uppercase tracking-wide mb-1">
                Isletmeler <span className="normal-case font-normal tracking-normal text-on-surface-variant/60">(birden cok secilebilir)</span>
              </label>
              <div className="bg-surface-container-low rounded-xl p-2 max-h-36 overflow-y-auto space-y-0.5 mb-3">
                {isletmeler.map(isl => {
                  const checked = catEditIsletmeler.includes(isl.id);
                  return (
                    <label key={isl.id}
                      className={`flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer transition-colors text-xs ${checked ? 'bg-primary/10 text-primary font-semibold' : 'text-on-surface hover:bg-surface-container-high'}`}>
                      <input type="checkbox" checked={checked}
                        onChange={() => setCatEditIsletmeler(prev => checked ? prev.filter(id => id !== isl.id) : [...prev, isl.id])}
                        className="accent-primary w-3.5 h-3.5 rounded" />
                      <span className="material-symbols-outlined text-sm">domain</span>
                      {isl.ad}
                    </label>
                  );
                })}
              </div>

              {/* Ürün sayısı bilgisi */}
              <p className="text-[11px] text-on-surface-variant mb-4">
                Bu kategoride <span className="font-bold text-primary">{catEditModal.products.length}</span> urun bulunuyor.
              </p>

              {/* Butonlar */}
              <div className="flex items-center gap-2">
                {/* Sil butonu — sadece aktif ürünler varsa göster (zaten pasifse silmenin anlamı yok) */}
                {catEditModal.products.some(u => u.aktif !== false && u.aktif !== 0) && (
                  <button
                    onClick={() => {
                      setCatEditModal({ open: false, cat: '', products: [] });
                      handleCategoryDelete(catEditModal.cat, catEditModal.products);
                    }}
                    className="h-9 px-3 rounded-xl text-xs font-semibold text-error bg-error/8 hover:bg-error/15 flex items-center gap-1 transition-colors"
                  >
                    <span className="material-symbols-outlined text-sm">delete</span>
                    Sil
                  </button>
                )}
                {/* Kaydet */}
                <button
                  onClick={handleCatEditSave}
                  disabled={catEditLoading || !catEditName.trim()}
                  className="flex-1 h-9 rounded-xl text-xs font-bold text-white disabled:opacity-40 transition-all flex items-center justify-center gap-1.5"
                  style={{ background: 'linear-gradient(135deg, #7f23cd, #9945e8)' }}
                >
                  {catEditLoading ? (
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <span className="material-symbols-outlined text-sm">check</span>
                  )}
                  Kaydet
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Kategori Silme Onay Modal ── */}
      {catDeleteModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center modal-backdrop"
          onClick={e => { if (e.target === e.currentTarget && !catDeleteLoading) setCatDeleteModal({ open: false, cat: '', products: [] }); }}>
          <div className="bg-surface-container-lowest rounded-2xl shadow-elevated w-full max-w-sm mx-4">
            <div className="h-0.5 w-full rounded-t-2xl" style={{ background: 'linear-gradient(135deg, #ba1a1a, #ef4444)' }} />
            <div className="p-5">
              {/* Header */}
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-error/10">
                  <span className="material-symbols-outlined text-lg text-error">warning</span>
                </div>
                <h3 className="text-base font-bold font-headline text-on-surface">Kategori Sil</h3>
              </div>

              {/* Info */}
              <div className="bg-error/5 rounded-xl p-3 mb-4 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm text-error">folder</span>
                  <span className="text-sm font-bold text-on-surface">{catDeleteModal.cat}</span>
                </div>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  Bu kategoride <span className="font-bold text-error">{catDeleteModal.products.length} urun</span> bulunuyor.
                  Kategori silindiginde tum urunler <span className="font-bold">pasife</span> alinacak.
                </p>
                <p className="text-[11px] text-on-surface-variant/70">
                  Pasif urunleri "Pasif" filtresinden gorebilir ve geri yukleyebilirsiniz.
                </p>
              </div>

              {/* Buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCatDeleteModal({ open: false, cat: '', products: [] })}
                  disabled={catDeleteLoading}
                  className="flex-1 h-9 rounded-xl text-xs font-semibold bg-surface-container-high text-on-surface hover:bg-surface-container-highest transition-colors disabled:opacity-50"
                >
                  Vazgec
                </button>
                <button
                  onClick={confirmCategoryDelete}
                  disabled={catDeleteLoading}
                  className="flex-1 h-9 rounded-xl text-xs font-bold text-white bg-error hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  {catDeleteLoading ? (
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <span className="material-symbols-outlined text-sm">delete</span>
                  )}
                  Sil ({catDeleteModal.products.length} urun)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Kategori Toplu Geri Alma Modal ── */}
      {catRestoreModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center modal-backdrop"
          onClick={e => { if (e.target === e.currentTarget && !catRestoreLoading) setCatRestoreModal({ open: false, cat: '', products: [] }); }}>
          <div className="bg-surface-container-lowest rounded-2xl shadow-elevated w-full max-w-sm mx-4">
            <div className="h-0.5 w-full rounded-t-2xl" style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }} />
            <div className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-success/10">
                  <span className="material-symbols-outlined text-lg text-success">undo</span>
                </div>
                <h3 className="text-base font-bold font-headline text-on-surface">{t('action.restore')}</h3>
              </div>

              <div className="bg-success/5 rounded-xl p-3 mb-4 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm text-success">folder</span>
                  <span className="text-sm font-bold text-on-surface">{catRestoreModal.cat}</span>
                </div>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  Bu kategorideki <span className="font-bold text-success">{catRestoreModal.products.length} urun</span> tekrar aktif hale getirilecek.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCatRestoreModal({ open: false, cat: '', products: [] })}
                  disabled={catRestoreLoading}
                  className="flex-1 h-9 rounded-xl text-xs font-semibold bg-surface-container-high text-on-surface hover:bg-surface-container-highest transition-colors disabled:opacity-50"
                >
                  Vazgec
                </button>
                <button
                  onClick={async () => {
                    setCatRestoreLoading(true);
                    try {
                      await Promise.all(catRestoreModal.products.map(u => api.put(`/urunler/${u.id}/restore`)));
                      toast.success(`${catRestoreModal.products.length} urun geri alindi`);
                      setCatRestoreModal({ open: false, cat: '', products: [] });
                      getUrunler(true);
                    } catch (err) {
                      toast.error(err.response?.data?.hata || 'Geri alma basarisiz');
                    } finally {
                      setCatRestoreLoading(false);
                    }
                  }}
                  disabled={catRestoreLoading}
                  className="flex-1 h-9 rounded-xl text-xs font-bold text-white bg-success hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  {catRestoreLoading ? (
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <span className="material-symbols-outlined text-sm">undo</span>
                  )}
                  Geri Al ({catRestoreModal.products.length} urun)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
