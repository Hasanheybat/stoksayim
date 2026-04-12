import { useState, useEffect, useCallback, useMemo } from 'react';
import api from '../lib/api';
import { useLanguage } from '../i18n';
import toast from 'react-hot-toast';
import Modal from '../components/ui/Modal';
import ConfirmModal from '../components/ui/ConfirmModal';
import { SkeletonCard } from '../components/ui/Skeleton';
import React from 'react';

/* ── Permission categories & operations ──────────────────── */

const PERMISSION_CATEGORIES = [
  { key: 'urun', icon: 'inventory_2', label: 'Urunler' },
  { key: 'depo', icon: 'warehouse', label: 'Depolar' },
  { key: 'sayim', icon: 'assignment', label: 'Sayimlar' },
  { key: 'toplam_sayim', icon: 'summarize', label: 'Toplam Sayim' },
];

const PERMISSION_OPERATIONS = [
  { key: 'goruntule', label: 'Goruntule', icon: 'visibility' },
  { key: 'ekle', label: 'Ekle', icon: 'add_circle' },
  { key: 'duzenle', label: 'Duzenle', icon: 'edit' },
  { key: 'sil', label: 'Sil', icon: 'delete' },
];

function emptyPermissions() {
  const perms = {};
  PERMISSION_CATEGORIES.forEach((cat) => {
    perms[cat.key] = {};
    PERMISSION_OPERATIONS.forEach((op) => {
      perms[cat.key][op.key] = false;
    });
  });
  return perms;
}

function countPermissions(yetkiler) {
  if (!yetkiler) return 0;
  let count = 0;
  Object.values(yetkiler).forEach((ops) => {
    Object.values(ops).forEach((v) => {
      if (v) count++;
    });
  });
  return count;
}

const TOTAL_PERMISSIONS = PERMISSION_CATEGORIES.length * PERMISSION_OPERATIONS.length;

/* ── Toggle switch component ─────────────────────────────── */

function Toggle({ checked, onChange, disabled = false }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`
        relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors duration-200
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        ${checked ? 'bg-primary' : 'bg-surface-container-highest'}
      `}
    >
      <span
        className={`
          pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-sm
          transform transition-transform duration-200
          ${checked ? 'translate-x-[22px]' : 'translate-x-0.5'}
          mt-0.5
        `}
      />
    </button>
  );
}

/* ── Permissions Matrix ──────────────────────────────────── */

function PermissionsMatrix({ yetkiler, onChange, disabled = false }) {
  const handleToggle = (category, operation, value) => {
    if (disabled) return;
    const updated = { ...yetkiler };
    updated[category] = { ...updated[category], [operation]: value };
    onChange(updated);
  };

  const handleToggleCategory = (category) => {
    if (disabled) return;
    const ops = yetkiler[category] || {};
    const allOn = PERMISSION_OPERATIONS.every((op) => ops[op.key]);
    const updated = { ...yetkiler };
    updated[category] = {};
    PERMISSION_OPERATIONS.forEach((op) => {
      updated[category][op.key] = !allOn;
    });
    onChange(updated);
  };

  return (
    <div className="space-y-3">
      {PERMISSION_CATEGORIES.map((cat) => {
        const ops = yetkiler[cat.key] || {};
        const enabledCount = PERMISSION_OPERATIONS.filter((op) => ops[op.key]).length;
        const allOn = enabledCount === PERMISSION_OPERATIONS.length;

        return (
          <div
            key={cat.key}
            className="bg-surface-container-low rounded-xl p-3"
          >
            {/* Category header */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-base text-on-surface-variant">
                  {cat.icon}
                </span>
                <span className="text-sm font-semibold text-on-surface">
                  {cat.label}
                </span>
                <span className="text-[10px] font-bold text-on-surface-variant bg-surface-container-high px-1.5 py-0.5 rounded-full">
                  {enabledCount}/{PERMISSION_OPERATIONS.length}
                </span>
              </div>
              <Toggle checked={allOn} onChange={() => handleToggleCategory(cat.key)} disabled={disabled} />
            </div>

            {/* Operations */}
            <div className="grid grid-cols-2 gap-2">
              {PERMISSION_OPERATIONS.map((op) => (
                <div
                  key={op.key}
                  className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-surface-container transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-base text-on-surface-variant">
                      {op.icon}
                    </span>
                    <span className="text-xs text-on-surface-variant">{op.label}</span>
                  </div>
                  <Toggle
                    checked={!!ops[op.key]}
                    onChange={(v) => handleToggle(cat.key, op.key, v)}
                    disabled={disabled}
                  />
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ── Role Card ───────────────────────────────────────────── */

function RoleCard({ rol, onClick }) {
  const { t } = useLanguage();
  const permCount = countPermissions(rol.yetkiler);

  return (
    <button
      onClick={onClick}
      className="bg-surface-container-lowest rounded-2xl p-4 shadow-card
                 text-left transition-all hover:shadow-elevated hover:-translate-y-0.5
                 flex flex-col gap-2.5 w-full h-full"
    >
      {/* Header */}
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
          <span className="material-symbols-outlined text-lg text-primary">
            {rol.sistem ? 'admin_panel_settings' : 'shield_person'}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-on-surface truncate">{rol.ad}</h3>
            {rol.sistem && (
              <span className="text-[9px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded-full shrink-0">
                SISTEM
              </span>
            )}
          </div>
          {rol.kullanici_sayisi != null && (
            <p className="text-xs text-on-surface-variant mt-0.5">
              {rol.kullanici_sayisi} kullanici
            </p>
          )}
        </div>
      </div>

      {/* Permission bar */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-on-surface-variant">{t('roles.permissions')}</span>
          <span className="text-[10px] font-bold text-on-surface-variant">
            {permCount}/{TOTAL_PERMISSIONS}
          </span>
        </div>
        <div className="h-1.5 bg-surface-container-high rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-300"
            style={{ width: `${(permCount / TOTAL_PERMISSIONS) * 100}%` }}
          />
        </div>
      </div>

      {/* Permission tags */}
      <div className="flex flex-wrap gap-1">
        {PERMISSION_CATEGORIES.map((cat) => {
          const ops = rol.yetkiler?.[cat.key] || {};
          const active = PERMISSION_OPERATIONS.filter((op) => ops[op.key]).length;
          if (active === 0) return null;
          return (
            <span
              key={cat.key}
              className="text-[9px] font-medium text-on-surface-variant bg-surface-container-high px-1.5 py-0.5 rounded-full"
            >
              {cat.label} ({active})
            </span>
          );
        })}
      </div>
    </button>
  );
}

/* ── Main Page ───────────────────────────────────────────── */

export default function RollerPage() {
  const { t } = useLanguage();

  const [roller, setRoller] = useState([]);
  const [loading, setLoading] = useState(true);

  /* Detail / edit modal */
  const [selectedRol, setSelectedRol] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [editYetkiler, setEditYetkiler] = useState({});
  const [editAd, setEditAd] = useState('');
  const [saving, setSaving] = useState(false);

  /* Create modal */
  const [createOpen, setCreateOpen] = useState(false);
  const [createAd, setCreateAd] = useState('');
  const [createYetkiler, setCreateYetkiler] = useState(emptyPermissions);
  const [creating, setCreating] = useState(false);

  /* Delete modal */
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [assignedUsers, setAssignedUsers] = useState([]);
  const [reassignRolId, setReassignRolId] = useState('');
  const [deleting, setDeleting] = useState(false);

  /* ── Fetch ─────────────────────────────────────────────── */

  const fetchRoller = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/roller');
      setRoller(data);
    } catch {
      toast.error('Roller yuklenemedi');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRoller();
  }, [fetchRoller]);

  /* ── Open detail ───────────────────────────────────────── */

  const openDetail = (rol) => {
    setSelectedRol(rol);
    setEditAd(rol.ad);
    setEditYetkiler(JSON.parse(JSON.stringify(rol.yetkiler || emptyPermissions())));
    setDetailOpen(true);
  };

  const closeDetail = () => {
    setDetailOpen(false);
    setSelectedRol(null);
  };

  /* ── Save role ─────────────────────────────────────────── */

  const hasChanges = useMemo(() => {
    if (!selectedRol) return false;
    if (editAd !== selectedRol.ad) return true;
    return JSON.stringify(editYetkiler) !== JSON.stringify(selectedRol.yetkiler);
  }, [selectedRol, editAd, editYetkiler]);

  const handleSave = async () => {
    if (!selectedRol || !hasChanges) return;
    try {
      setSaving(true);
      await api.put(`/roller/${selectedRol.id}`, {
        ad: editAd,
        yetkiler: editYetkiler,
      });
      toast.success('Rol guncellendi');
      closeDetail();
      fetchRoller();
    } catch (err) {
      toast.error(err.response?.data?.mesaj || 'Guncelleme basarisiz');
    } finally {
      setSaving(false);
    }
  };

  /* ── Create role ───────────────────────────────────────── */

  const openCreate = () => {
    setCreateAd('');
    setCreateYetkiler(emptyPermissions());
    setCreateOpen(true);
  };

  const handleCreate = async () => {
    if (!createAd.trim()) {
      toast.error('Rol adi gerekli');
      return;
    }
    try {
      setCreating(true);
      await api.post('/roller', {
        ad: createAd.trim(),
        yetkiler: createYetkiler,
      });
      toast.success('Rol olusturuldu');
      setCreateOpen(false);
      fetchRoller();
    } catch (err) {
      toast.error(err.response?.data?.mesaj || 'Olusturma basarisiz');
    } finally {
      setCreating(false);
    }
  };

  /* ── Delete role ───────────────────────────────────────── */

  const openDelete = async (rol) => {
    setDeleteTarget(rol);
    setReassignRolId('');
    setDeleting(false);
    try {
      const { data } = await api.get(`/roller/${rol.id}/atanmislar`);
      setAssignedUsers(data);
    } catch {
      setAssignedUsers([]);
    }
    setDeleteOpen(true);
    setDetailOpen(false);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    if (assignedUsers.length > 0 && !reassignRolId) {
      toast.error('Kullanicilari baska bir role atamalisiniz');
      return;
    }
    try {
      setDeleting(true);
      await api.delete(`/roller/${deleteTarget.id}`, {
        data: reassignRolId ? { yeni_rol_id: reassignRolId } : undefined,
      });
      toast.success('Rol silindi');
      setDeleteOpen(false);
      setDeleteTarget(null);
      fetchRoller();
    } catch (err) {
      toast.error(err.response?.data?.mesaj || 'Silme basarisiz');
    } finally {
      setDeleting(false);
    }
  };

  /* ── Available roles for reassign (exclude delete target) ─ */

  const reassignOptions = useMemo(
    () => roller.filter((r) => r.id !== deleteTarget?.id),
    [roller, deleteTarget]
  );

  /* ── Render ────────────────────────────────────────────── */

  return (
    <div className="p-4 md:p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold font-headline text-on-surface">
            {t('roles.title')}
          </h1>
          <p className="text-xs text-on-surface-variant mt-0.5">
            {t('roles.subtitle')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={openCreate}
            className="h-8 px-3 rounded-xl text-xs font-semibold text-white
                       shadow-md hover:shadow-lg transition-shadow
                       flex items-center gap-2 shrink-0"
            style={{ background: 'linear-gradient(135deg, #4343d5, #5d5fef)' }}
          >
            <span className="material-symbols-outlined text-sm">add</span>
            {t('roles.newRole')}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4">
        <span className="text-sm font-bold text-primary">{roller.length}</span>
        <span className="text-[11px] text-on-surface-variant">{t('roles.totalRoles')}</span>
        <span className="w-px h-4 bg-outline-variant/20" />
        <span className="text-sm font-bold" style={{ color: '#4343d5' }}>{roller.filter((r) => r.sistem).length}</span>
        <span className="text-[11px] text-on-surface-variant">{t('roles.systemRoles')}</span>
        <span className="w-px h-4 bg-outline-variant/20" />
        <span className="text-sm font-bold text-success">{roller.filter((r) => !r.sistem).length}</span>
        <span className="text-[11px] text-on-surface-variant">{t('roles.customRoles')}</span>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {Array.from({ length: 6 }, (_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : roller.length === 0 ? (
        <div className="text-center py-12">
          <span className="material-symbols-outlined text-3xl text-on-surface-variant/30">
            shield
          </span>
          <p className="text-sm text-on-surface-variant mt-3">
            {t('roles.noRoles')}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {roller.map((rol) => (
            <RoleCard key={rol.id} rol={rol} onClick={() => openDetail(rol)} />
          ))}
        </div>
      )}

      {/* ── Detail / Edit Modal ────────────────────────────── */}
      <Modal
        open={detailOpen}
        onClose={closeDetail}
        title={selectedRol?.ad || t('roles.detail')}
        icon="shield_person"
        iconColor="#4343d5"
        maxWidth="lg"
      >
        {selectedRol && (
          <div className="space-y-4">
            {/* Role name */}
            <div>
              <label className="text-xs font-semibold text-on-surface-variant mb-1.5 block">
                {t('roles.roleName')}
              </label>
              <input
                type="text"
                value={editAd}
                onChange={(e) => setEditAd(e.target.value)}
                disabled={selectedRol.sistem}
                className="w-full h-9 px-4 rounded-xl bg-surface-container-low text-on-surface text-sm
                           ghost-border ghost-border-focus outline-none transition-shadow
                           disabled:opacity-60 disabled:cursor-not-allowed"
                placeholder={t('roles.roleName')}
              />
            </div>

            {/* Permissions */}
            <div>
              <label className="text-xs font-semibold text-on-surface-variant mb-2 block">
                {t('roles.permissions')}
              </label>
              <PermissionsMatrix
                yetkiler={editYetkiler}
                onChange={setEditYetkiler}
                disabled={selectedRol.sistem}
              />
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 pt-2">
              {!selectedRol.sistem && (
                <button
                  onClick={() => openDelete(selectedRol)}
                  className="h-9 px-4 rounded-xl text-sm font-semibold
                             bg-error/10 text-error hover:bg-error/20
                             transition-colors flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-lg">delete</span>
                  {t('action.delete')}
                </button>
              )}
              <div className="flex-1" />
              <button
                onClick={closeDetail}
                className="h-9 px-5 rounded-xl text-sm font-semibold
                           bg-surface-container-high text-on-surface
                           hover:bg-surface-container-highest transition-colors"
              >
                {t('action.close')}
              </button>
              {!selectedRol.sistem && (
                <button
                  onClick={handleSave}
                  disabled={!hasChanges || saving}
                  className="h-9 px-5 rounded-xl text-sm font-semibold text-white
                             bg-cta-gradient hover:opacity-90 transition-opacity
                             disabled:opacity-50 disabled:cursor-not-allowed
                             flex items-center gap-2"
                >
                  {saving && (
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  )}
                  {t('action.save')}
                </button>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* ── Create Role Modal ──────────────────────────────── */}
      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title={t('roles.createTitle')}
        icon="add_circle"
        iconColor="#10b981"
        maxWidth="lg"
      >
        <div className="space-y-4">
          {/* Name */}
          <div>
            <label className="text-xs font-semibold text-on-surface-variant mb-1.5 block">
              {t('roles.roleName')}
            </label>
            <input
              type="text"
              value={createAd}
              onChange={(e) => setCreateAd(e.target.value)}
              className="w-full h-9 px-4 rounded-xl bg-surface-container-low text-on-surface text-sm
                         ghost-border ghost-border-focus outline-none transition-shadow"
              placeholder={t('roles.roleName')}
              autoFocus
            />
          </div>

          {/* Permissions */}
          <div>
            <label className="text-xs font-semibold text-on-surface-variant mb-2 block">
              {t('roles.permissions')}
            </label>
            <PermissionsMatrix
              yetkiler={createYetkiler}
              onChange={setCreateYetkiler}
            />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-2">
            <div className="flex-1" />
            <button
              onClick={() => setCreateOpen(false)}
              className="h-9 px-5 rounded-xl text-sm font-semibold
                         bg-surface-container-high text-on-surface
                         hover:bg-surface-container-highest transition-colors"
            >
              {t('action.cancel')}
            </button>
            <button
              onClick={handleCreate}
              disabled={!createAd.trim() || creating}
              className="h-9 px-5 rounded-xl text-sm font-semibold text-white
                         bg-cta-gradient hover:opacity-90 transition-opacity
                         disabled:opacity-50 disabled:cursor-not-allowed
                         flex items-center gap-2"
            >
              {creating && (
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              )}
              {t('action.create')}
            </button>
          </div>
        </div>
      </Modal>

      {/* ── Delete Confirm Modal ───────────────────────────── */}
      <ConfirmModal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        title={`"${deleteTarget?.ad}" rolunu sil`}
        message={
          assignedUsers.length > 0
            ? `Bu role atanmis ${assignedUsers.length} kullanici bulunuyor. Silmeden once bu kullanicilari baska bir role atamaniz gerekiyor.`
            : 'Bu rolu silmek istediginizden emin misiniz? Bu islem geri alinamaz.'
        }
        type="danger"
        confirmText="Sil"
        cancelText="Vazgec"
        loading={deleting}
      >
        {/* Assigned users list */}
        {assignedUsers.length > 0 && (
          <div className="space-y-3">
            {/* Users preview */}
            <div className="bg-surface-container-low rounded-xl p-3 max-h-32 overflow-y-auto">
              <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wide mb-2">
                {t('roles.assignedUsers')}
              </p>
              <div className="space-y-1.5">
                {assignedUsers.slice(0, 10).map((u) => (
                  <div key={u.id} className="flex items-center gap-2 text-xs text-on-surface">
                    <span className="material-symbols-outlined text-sm text-on-surface-variant">person</span>
                    {u.ad || u.email}
                  </div>
                ))}
                {assignedUsers.length > 10 && (
                  <p className="text-[10px] text-on-surface-variant">
                    +{assignedUsers.length - 10} daha...
                  </p>
                )}
              </div>
            </div>

            {/* Reassign dropdown */}
            <div>
              <label className="text-xs font-semibold text-on-surface-variant mb-1.5 block">
                {t('roles.assignRole')}
              </label>
              <select
                value={reassignRolId}
                onChange={(e) => setReassignRolId(e.target.value)}
                className="w-full h-9 px-4 rounded-xl bg-surface-container-low text-on-surface text-sm
                           ghost-border outline-none appearance-none cursor-pointer"
              >
                <option value="">{t('roles.selectRole')}</option>
                {reassignOptions.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.ad}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </ConfirmModal>
    </div>
  );
}
