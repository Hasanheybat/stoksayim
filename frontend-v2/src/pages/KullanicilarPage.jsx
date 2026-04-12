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

/* ── Constants ──────────────────────────────────────────────── */

const PER_PAGE = 50;
const ROLES = ['admin', 'kullanici'];

/* ── Helpers ────────────────────────────────────────────────── */

function roleBadge(rol) {
  if (rol === 'admin') {
    return {
      bg: 'bg-primary/10',
      text: 'text-primary',
      icon: 'shield_person',
    };
  }
  return {
    bg: 'bg-info/10',
    text: 'text-info',
    icon: 'person',
  };
}

function userStatus(user) {
  if (user.silindi || user.deleted_at) return 'silindi';
  if (user.aktif === false || user.aktif === 0) return 'pasif';
  return 'aktif';
}

/* ── Empty State ────────────────────────────────────────────── */

function EmptyState({ icon, title, subtitle }) {
  return (
    <div className="flex flex-col items-center justify-center py-14 text-center">
      <span className="material-symbols-outlined text-[32px] text-on-surface-variant/30 mb-3">
        {icon}
      </span>
      <p className="text-sm font-medium text-on-surface-variant">{title}</p>
      {subtitle && (
        <p className="text-xs text-on-surface-variant/60 mt-1">{subtitle}</p>
      )}
    </div>
  );
}

/* ── User Form Modal ────────────────────────────────────────── */

function UserFormModal({
  open,
  onClose,
  onSave,
  user,
  isletmeler,
  loading,
  t,
}) {
  const isEdit = !!user;

  const [form, setForm] = useState({
    ad_soyad: '',
    email: '',
    sifre: '',
    telefon: '',
    rol: 'kullanici',
  });

  const [assignments, setAssignments] = useState([]);
  const [addSearch, setAddSearch] = useState('');
  const [showAddDropdown, setShowAddDropdown] = useState(false);
  const [errors, setErrors] = useState({});

  /* ── Populate on open ──────────────────────────────────── */
  useEffect(() => {
    if (!open) return;
    if (isEdit && user) {
      setForm({
        ad_soyad: user.ad_soyad || '',
        email: user.email || '',
        sifre: '',
        telefon: user.telefon || '',
        rol: user.rol || 'kullanici',
      });
      setAssignments(
        (user.isletmeler || []).map((i) => ({
          id: i.id || i.isletme_id,
          ad: i.ad || i.isletme_adi,
        }))
      );
    } else {
      setForm({ ad_soyad: '', email: '', sifre: '', telefon: '', rol: 'kullanici' });
      setAssignments([]);
    }
    setErrors({});
    setAddSearch('');
    setShowAddDropdown(false);
  }, [open, user, isEdit]);

  /* ── Validation ────────────────────────────────────────── */
  function validate() {
    const e = {};
    if (!form.ad_soyad.trim()) e.ad_soyad = true;
    if (!form.email.trim() || !form.email.includes('@')) e.email = true;
    if (!isEdit && form.sifre.length < 8) e.sifre = true;
    if (isEdit && form.sifre && form.sifre.length < 8) e.sifre = true;
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSubmit() {
    if (!validate()) return;
    const payload = { ...form };
    if (isEdit && !payload.sifre) delete payload.sifre;
    onSave(payload, assignments);
  }

  /* ── Business assignment helpers ───────────────────────── */
  const assignedIds = new Set(assignments.map((a) => a.id));

  const filteredIsletmeler = (isletmeler || []).filter(
    (i) =>
      !assignedIds.has(i.id) &&
      (i.ad || '').toLowerCase().includes(addSearch.toLowerCase())
  );

  function addAssignment(isl) {
    setAssignments((prev) => [...prev, { id: isl.id, ad: isl.ad }]);
    setAddSearch('');
    setShowAddDropdown(false);
  }

  function removeAssignment(id) {
    setAssignments((prev) => prev.filter((a) => a.id !== id));
  }

  /* ── Input classes ─────────────────────────────────────── */
  const inputCls = (field) =>
    `w-full h-9 px-4 rounded-xl bg-surface-container-low text-on-surface text-sm
     placeholder:text-on-surface-variant/50 outline-none transition-shadow
     ghost-border ghost-border-focus
     ${errors[field] ? 'ring-2 ring-error/40' : ''}`;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? t('action.edit') : t('users.new')}
      icon={isEdit ? 'edit' : 'person_add'}
      iconColor={isEdit ? '#4343d5' : '#10b981'}
      maxWidth="md"
      showHandle
    >
      <div className="space-y-4">
        {/* Ad Soyad */}
        <div>
          <label className="text-xs font-semibold text-on-surface-variant mb-1.5 block">
            {t('users.fullName')}
          </label>
          <input
            type="text"
            value={form.ad_soyad}
            onChange={(e) => setForm((p) => ({ ...p, ad_soyad: e.target.value }))}
            placeholder={t('users.fullName')}
            className={inputCls('ad_soyad')}
          />
        </div>

        {/* Email */}
        <div>
          <label className="text-xs font-semibold text-on-surface-variant mb-1.5 block">
            {t('users.email')}
          </label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
            placeholder={t('users.email')}
            className={inputCls('email')}
          />
        </div>

        {/* Sifre */}
        <div>
          <label className="text-xs font-semibold text-on-surface-variant mb-1.5 block">
            {isEdit ? t('users.newPassword') : t('users.password')}
          </label>
          <input
            type="password"
            value={form.sifre}
            onChange={(e) => setForm((p) => ({ ...p, sifre: e.target.value }))}
            placeholder={
              isEdit
                ? t('users.newPasswordHint')
                : t('users.minChars', { n: 8 })
            }
            className={inputCls('sifre')}
          />
          {errors.sifre && (
            <p className="text-[11px] text-error mt-1">
              {t('users.minChars', { n: 8 })}
            </p>
          )}
        </div>

        {/* Telefon */}
        <div>
          <label className="text-xs font-semibold text-on-surface-variant mb-1.5 block">
            {t('users.phone')}
          </label>
          <input
            type="tel"
            value={form.telefon}
            onChange={(e) => setForm((p) => ({ ...p, telefon: e.target.value }))}
            placeholder={t('users.phone')}
            className={inputCls('telefon')}
          />
        </div>

        {/* Rol */}
        <div>
          <label className="text-xs font-semibold text-on-surface-variant mb-1.5 block">
            {t('users.role')}
          </label>
          <div className="flex gap-2">
            {ROLES.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setForm((p) => ({ ...p, rol: r }))}
                className={`flex-1 h-9 rounded-xl text-sm font-semibold transition-colors ${
                  form.rol === r
                    ? 'bg-primary text-on-primary'
                    : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high'
                }`}
              >
                {r === 'admin' ? t('users.admin') : t('users.user')}
              </button>
            ))}
          </div>
        </div>

        {/* Business Assignments (edit only) */}
        {isEdit && (
          <div>
            <label className="text-xs font-semibold text-on-surface-variant mb-1.5 block">
              {t('users.businessAssignments')}
            </label>

            {/* Assigned chips */}
            {assignments.length > 0 ? (
              <div className="flex flex-wrap gap-2 mb-3">
                {assignments.map((a) => (
                  <span
                    key={a.id}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg
                               bg-primary/8 text-primary text-xs font-semibold"
                  >
                    {a.ad}
                    <button
                      type="button"
                      onClick={() => removeAssignment(a.id)}
                      className="hover:text-error transition-colors"
                    >
                      <span className="material-symbols-outlined text-sm">close</span>
                    </button>
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-on-surface-variant/50 mb-3">
                {t('users.noAssignments')}
              </p>
            )}

            {/* Add business dropdown */}
            <div className="relative">
              <input
                type="text"
                value={addSearch}
                onChange={(e) => {
                  setAddSearch(e.target.value);
                  setShowAddDropdown(true);
                }}
                onFocus={() => setShowAddDropdown(true)}
                placeholder={t('users.addBusinessPlaceholder')}
                className="w-full h-10 px-3 rounded-xl bg-surface-container-low text-on-surface text-sm
                           placeholder:text-on-surface-variant/50 outline-none ghost-border ghost-border-focus"
              />
              {showAddDropdown && filteredIsletmeler.length > 0 && (
                <div className="absolute z-10 top-full left-0 right-0 mt-1 bg-surface-container-lowest
                                rounded-xl shadow-elevated max-h-40 overflow-y-auto">
                  {filteredIsletmeler.map((isl) => (
                    <button
                      key={isl.id}
                      type="button"
                      onClick={() => addAssignment(isl)}
                      className="w-full text-left px-4 py-2.5 text-sm text-on-surface
                                 hover:bg-surface-container-low transition-colors first:rounded-t-xl last:rounded-b-xl"
                    >
                      {isl.ad}
                    </button>
                  ))}
                </div>
              )}
              {showAddDropdown && filteredIsletmeler.length === 0 && addSearch && (
                <div className="absolute z-10 top-full left-0 right-0 mt-1 bg-surface-container-lowest
                                rounded-xl shadow-elevated px-4 py-3 text-xs text-on-surface-variant">
                  {t('users.noResults')}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 mt-5">
        <button
          onClick={onClose}
          disabled={loading}
          className="flex-1 h-9 rounded-xl text-sm font-semibold
                     bg-surface-container-high text-on-surface
                     hover:bg-surface-container-highest transition-colors disabled:opacity-50"
        >
          {t('action.cancel')}
        </button>
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="flex-1 h-9 rounded-xl text-sm font-semibold text-white
                     bg-cta-gradient hover:opacity-90 transition-opacity
                     disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading && (
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          )}
          {isEdit
            ? loading ? t('action.saving') : t('action.save')
            : loading ? t('users.creating') : t('users.create')
          }
        </button>
      </div>
    </Modal>
  );
}

/* ── Page Component ─────────────────────────────────────────── */

export default function KullanicilarPage() {
  const { t } = useLanguage();

  /* ── State ─────────────────────────────────────────────── */
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState({ toplam: 0, aktif: 0, pasif: 0, admin: 0 });
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [rolFilter, setRolFilter] = useState('all');
  const [aktifFilter, setAktifFilter] = useState('all'); // all | aktif | pasif
  const [loading, setLoading] = useState(true);

  const [isletmeler, setIsletmeler] = useState([]);

  // Modals
  const [formOpen, setFormOpen] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [formLoading, setFormLoading] = useState(false);

  const [confirmModal, setConfirmModal] = useState({
    open: false,
    type: 'danger',
    title: '',
    message: '',
    user: null,
    action: null,
  });
  const [confirmLoading, setConfirmLoading] = useState(false);

  /* ── Fetch GLOBAL stats once on mount ──────────────────── */
  useEffect(() => {
    Promise.all([
      api.get('/kullanicilar').catch(() => ({ data: [] })),
      api.get('/kullanicilar?filtre=Pasif').catch(() => ({ data: [] })),
    ]).then(([allRes, pasifRes]) => {
      const all = Array.isArray(allRes.data) ? allRes.data : (allRes.data?.kullanicilar || allRes.data?.data || []);
      const pasif = Array.isArray(pasifRes.data) ? pasifRes.data : (pasifRes.data?.kullanicilar || pasifRes.data?.data || []);
      const toplamCount = allRes.data?.toplam ?? allRes.data?.total ?? all.length;
      const pasifCount = pasifRes.data?.toplam ?? pasifRes.data?.total ?? pasif.length;
      const adminCount = all.filter(u => u.rol === 'admin').length;
      setStats({ toplam: toplamCount, aktif: toplamCount - pasifCount, pasif: pasifCount, admin: adminCount });
    });
  }, []);

  /* ── Fetch users ───────────────────────────────────────── */
  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const params = { sayfa: page, limit: PER_PAGE };
      if (search) params.q = search;
      if (rolFilter !== 'all') params.rol = rolFilter;
      if (aktifFilter === 'aktif') params.filtre = 'Aktif';
      else if (aktifFilter === 'pasif') params.filtre = 'Pasif';
      const { data } = await api.get('/kullanicilar', { params });
      setUsers(data.kullanicilar || data.data || []);
      setTotal(data.toplam ?? data.total ?? 0);
    } catch (err) {
      toast.error(t('toast.usersLoadFailed'));
    } finally {
      setLoading(false);
    }
  }, [page, search, rolFilter, aktifFilter, t]);

  /* ── Fetch businesses (for assignments) ────────────────── */
  const fetchIsletmeler = useCallback(async () => {
    try {
      const { data } = await api.get('/isletmeler', { params: { limit: 500 } });
      setIsletmeler(data.isletmeler || data.data || data || []);
    } catch {
      // Silently fail — not critical
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    fetchIsletmeler();
  }, [fetchIsletmeler]);

  /* ── Reset page on filter change ───────────────────────── */
  useEffect(() => {
    setPage(1);
  }, [search, rolFilter, aktifFilter]);

  /* ── Handlers ──────────────────────────────────────────── */

  function openCreate() {
    setEditUser(null);
    setFormOpen(true);
  }

  function openEdit(user) {
    setEditUser(user);
    setFormOpen(true);
  }

  async function handleSave(formData, assignments) {
    try {
      setFormLoading(true);
      if (editUser) {
        // Update user
        await api.put(`/kullanicilar/${editUser.id}`, formData);

        // Sync business assignments
        const prevIds = new Set((editUser.isletmeler || []).map((i) => i.id || i.isletme_id));
        const nextIds = new Set(assignments.map((a) => a.id));

        // Add new
        for (const a of assignments) {
          if (!prevIds.has(a.id)) {
            await api.post(`/kullanicilar/${editUser.id}/isletme`, { isletme_id: a.id });
          }
        }
        // Remove old
        for (const prev of editUser.isletmeler || []) {
          const pid = prev.id || prev.isletme_id;
          if (!nextIds.has(pid)) {
            await api.delete(`/kullanicilar/${editUser.id}/isletme/${pid}`);
          }
        }

        toast.success(t('toast.userUpdated'));
      } else {
        // Create user
        await api.post('/kullanicilar', formData);
        toast.success(t('toast.userCreated'));
      }
      setFormOpen(false);
      setEditUser(null);
      fetchUsers();
    } catch (err) {
      toast.error(err?.response?.data?.message || t('toast.operationFailed'));
    } finally {
      setFormLoading(false);
    }
  }

  function openDeactivate(user) {
    setConfirmModal({
      open: true,
      type: 'danger',
      title: t('users.deactivateTitle'),
      message: t('users.deactivateConsequences'),
      user,
      action: 'deactivate',
    });
  }

  function openActivate(user) {
    setConfirmModal({
      open: true,
      type: 'success',
      title: t('users.activateTitle'),
      message: t('users.activateInfo'),
      user,
      action: 'activate',
    });
  }

  function openRestore(user) {
    setConfirmModal({
      open: true,
      type: 'success',
      title: t('action.restore'),
      message: `${user.ad_soyad} — ${t('action.restore')}?`,
      user,
      action: 'restore',
    });
  }

  async function handleConfirmAction() {
    const { user, action } = confirmModal;
    if (!user || !action) return;

    try {
      setConfirmLoading(true);
      if (action === 'deactivate') {
        await api.put(`/kullanicilar/${user.id}`, { aktif: false });
        toast.success(t('toast.userDeactivated'));
      } else if (action === 'activate') {
        await api.put(`/kullanicilar/${user.id}`, { aktif: true });
        toast.success(t('toast.userActivated'));
      } else if (action === 'restore') {
        await api.put(`/kullanicilar/${user.id}/restore`);
        toast.success(t('toast.userRestored'));
      }
      setConfirmModal((p) => ({ ...p, open: false }));
      fetchUsers();
    } catch (err) {
      toast.error(err?.response?.data?.message || t('toast.operationFailed'));
    } finally {
      setConfirmLoading(false);
    }
  }

  function confirmText() {
    const { action } = confirmModal;
    if (action === 'deactivate') return t('action.yesDeactivate');
    if (action === 'activate') return t('action.yesActivate');
    return t('action.confirm');
  }

  /* ── Render ────────────────────────────────────────────── */
  return (
    <div className="p-4 md:p-6 space-y-4">
      {/* ── Header ───────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold font-headline text-on-surface">
            {t('users.title')}
          </h1>
          <p className="text-xs text-on-surface-variant mt-0.5">
            {t('users.subtitle') || 'Kullanici yonetimi'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={openCreate}
            className="h-8 px-3 rounded-xl text-xs font-semibold text-white
                       shadow-md hover:shadow-lg transition-shadow flex items-center gap-2 shrink-0"
            style={{ background: 'linear-gradient(135deg, #4343d5, #5d5fef)' }}
          >
            <span className="material-symbols-outlined text-sm">person_add</span>
            {t('users.new')}
          </button>
        </div>
      </div>

      {/* ── Stats ────────────────────────────────────────── */}
      <div className="flex items-center gap-4">
        <span className="text-sm font-bold text-primary">{stats.toplam}</span>
        <span className="text-[11px] text-on-surface-variant">{t('users.title')}</span>
        <span className="w-px h-4 bg-outline-variant/20" />
        <span className="text-sm font-bold" style={{ color: '#4343d5' }}>{stats.admin}</span>
        <span className="text-[11px] text-on-surface-variant">{t('users.admin')}</span>
        <span className="w-px h-4 bg-outline-variant/20" />
        <span className="text-sm font-bold text-success">{stats.aktif}</span>
        <span className="text-[11px] text-on-surface-variant">Aktif</span>
        <span className="w-px h-4 bg-outline-variant/20" />
        <span className="text-sm font-bold text-error">{stats.pasif}</span>
        <span className="text-[11px] text-on-surface-variant">Pasif</span>
      </div>

      {/* ── Filters ──────────────────────────────────────── */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="max-w-xs">
          <SearchBox
            value={search}
            onChange={setSearch}
            placeholder={t('users.search')}
          />
        </div>

        {/* Aktif/Pasif filter */}
        <div className="flex items-center gap-1 bg-surface-container-low rounded-xl p-1">
          {[
            { key: 'all', label: t('filter.all'), icon: 'apps' },
            { key: 'aktif', label: t('filter.active'), icon: 'check_circle' },
            { key: 'pasif', label: t('filter.passive'), icon: 'cancel' },
          ].map((f) => (
            <button
              key={f.key}
              onClick={() => { setAktifFilter(f.key); setPage(1); }}
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

        {/* Role filter */}
        <div className="flex items-center gap-1 bg-surface-container-low rounded-xl p-1">
          {['all', 'admin', 'kullanici'].map((r) => (
            <button
              key={r}
              onClick={() => setRolFilter(r)}
              className={`h-8 px-3 rounded-xl text-[11px] font-semibold transition-colors ${
                rolFilter === r
                  ? 'text-white shadow-sm'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
              style={rolFilter === r ? { background: 'linear-gradient(135deg, #4343d5, #5d5fef)', color: 'white' } : undefined}
            >
              {r === 'all'
                ? t('status.all')
                : r === 'admin'
                  ? t('users.admin')
                  : t('users.user')}
            </button>
          ))}
        </div>
      </div>

      {/* ── User List ────────────────────────────────────── */}
      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : users.length === 0 ? (
        <EmptyState
          icon="group_off"
          title={t('users.notFound')}
        />
      ) : (
        <>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {users.map((user) => {
              const status = userStatus(user);
              const badge = roleBadge(user.rol);
              const assignCount = (user.isletmeler || user.isletme_sayisi || []).length ?? user.isletme_sayisi ?? 0;

              return (
                <div
                  key={user.id}
                  className={`rounded-2xl p-4 shadow-card
                             hover:shadow-elevated transition-shadow duration-200
                             flex flex-col gap-2.5 h-full ${
                               status === 'pasif' || status === 'silindi'
                                 ? 'bg-red-50 hover:bg-red-100/60'
                                 : 'bg-surface-container-lowest'
                             }`}
                >
                  {/* Top row */}
                  <div className="flex items-start gap-3">
                    {/* Avatar */}
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${badge.bg}`}
                    >
                      <span className={`material-symbols-outlined text-lg ${badge.text}`}>
                        {badge.icon}
                      </span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-semibold truncate ${
                        status === 'pasif' || status === 'silindi' ? 'text-red-600' : 'text-on-surface'
                      }`}>
                        {user.ad_soyad}
                      </p>
                      <p className="text-xs text-on-surface-variant truncate">
                        {user.email}
                      </p>
                    </div>

                    <StatusChip status={status} size="sm" />
                  </div>

                  {/* Details */}
                  <div className="flex items-center gap-3 text-xs text-on-surface-variant">
                    {/* Role badge */}
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-bold tracking-wide ${badge.bg} ${badge.text}`}
                    >
                      {user.rol === 'admin' ? t('users.admin') : t('users.user')}
                    </span>

                    {/* Business count */}
                    <span className="inline-flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm">domain</span>
                      {typeof assignCount === 'number' ? assignCount : Array.isArray(assignCount) ? assignCount.length : 0}
                    </span>

                    {user.telefon && (
                      <span className="truncate">{user.telefon}</span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 mt-auto pt-1">
                    {status === 'silindi' ? (
                      <button
                        onClick={() => openRestore(user)}
                        className="flex-1 h-9 rounded-lg text-xs font-semibold
                                   bg-success/10 text-success
                                   hover:bg-success/20 transition-colors
                                   flex items-center justify-center gap-1.5"
                      >
                        <span className="material-symbols-outlined text-sm">restore</span>
                        {t('action.restore')}
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={() => openEdit(user)}
                          className="flex-1 h-9 rounded-lg text-xs font-semibold
                                     bg-surface-container-high text-on-surface
                                     hover:bg-surface-container-highest transition-colors
                                     flex items-center justify-center gap-1.5"
                        >
                          <span className="material-symbols-outlined text-sm">edit</span>
                          {t('action.edit')}
                        </button>

                        {status === 'aktif' ? (
                          <button
                            onClick={() => openDeactivate(user)}
                            className="h-9 px-3 rounded-lg text-xs font-semibold
                                       bg-error/8 text-error
                                       hover:bg-error/15 transition-colors
                                       flex items-center justify-center gap-1.5"
                          >
                            <span className="material-symbols-outlined text-sm">block</span>
                            {t('action.deactivate')}
                          </button>
                        ) : (
                          <button
                            onClick={() => openActivate(user)}
                            className="h-9 px-3 rounded-lg text-xs font-semibold
                                       bg-success/10 text-success
                                       hover:bg-success/20 transition-colors
                                       flex items-center justify-center gap-1.5"
                          >
                            <span className="material-symbols-outlined text-sm">check_circle</span>
                            {t('action.activate')}
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          <div className="flex justify-center pt-2">
            <Pagination
              current={page}
              total={total}
              perPage={PER_PAGE}
              onChange={setPage}
            />
          </div>
        </>
      )}

      {/* ── Create/Edit Modal ────────────────────────────── */}
      <UserFormModal
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditUser(null);
        }}
        onSave={handleSave}
        user={editUser}
        isletmeler={isletmeler}
        loading={formLoading}
        t={t}
      />

      {/* ── Confirm Modal ────────────────────────────────── */}
      <ConfirmModal
        open={confirmModal.open}
        onClose={() => setConfirmModal((p) => ({ ...p, open: false }))}
        onConfirm={handleConfirmAction}
        title={confirmModal.title}
        message={confirmModal.message}
        type={confirmModal.type}
        confirmText={confirmText()}
        cancelText={t('action.giveUp')}
        loading={confirmLoading}
      >
        {/* Consequences list for deactivate */}
        {confirmModal.action === 'deactivate' && (
          <ul className="space-y-2 mt-2">
            {[
              { icon: 'lock', text: t('users.deactivate.noLogin') },
              { icon: 'timer_off', text: t('users.deactivate.sessionEnd') },
              { icon: 'shield', text: t('users.deactivate.permsSuspended') },
            ].map((item, i) => (
              <li key={i} className="flex items-center gap-2 text-xs text-on-surface-variant">
                <span className="material-symbols-outlined text-sm text-error/70">{item.icon}</span>
                {item.text}
              </li>
            ))}
          </ul>
        )}

        {/* Info list for activate */}
        {confirmModal.action === 'activate' && (
          <ul className="space-y-2 mt-2">
            {[
              { icon: 'login', text: t('users.activate.canLogin') },
              { icon: 'shield', text: t('users.activate.permsRestore') },
              { icon: 'lock_open', text: t('users.activate.unblocked') },
            ].map((item, i) => (
              <li key={i} className="flex items-center gap-2 text-xs text-on-surface-variant">
                <span className="material-symbols-outlined text-sm text-success/70">{item.icon}</span>
                {item.text}
              </li>
            ))}
          </ul>
        )}
      </ConfirmModal>
    </div>
  );
}
