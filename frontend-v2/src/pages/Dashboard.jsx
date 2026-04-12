import React, { useState, useEffect, useCallback } from 'react';
import api from '../lib/api';
import useAuthStore from '../store/authStore';
import { useLanguage } from '../i18n';

/* ── Stat card config ──────────────────────────────────────── */

const STAT_CARDS = [
  { key: 'isletmeSayisi', labelKey: 'nav.businesses',    icon: 'domain',       tintText: 'text-primary' },
  { key: 'depoSayisi',    labelKey: 'nav.warehouses',    icon: 'warehouse',    tintText: 'text-info' },
  { key: 'kullaniciSayisi',labelKey: 'nav.users',        icon: 'group',        tintText: 'text-success' },
  { key: 'urunSayisi',    labelKey: 'nav.products',      icon: 'inventory_2',  tintText: 'text-warning' },
  { key: 'aktifSayim',    labelKey: 'stat.ongoing',      icon: 'schedule',     tintText: 'text-tertiary' },
  { key: 'tamamlananSayim',labelKey: 'stat.completed',   icon: 'check_circle', tintText: 'text-success' },
];

/* ── Status chip colors ────────────────────────────────────── */

function statusChip(durum) {
  const lower = (durum || '').toLowerCase();
  if (lower === 'tamamlandi' || lower === 'tamamlandı') {
    return {
      bg: 'bg-success/10',
      text: 'text-success',
      label: durum,
    };
  }
  // devam, devam_ediyor, etc.
  return {
    bg: 'bg-info/10',
    text: 'text-info',
    label: durum || 'Devam',
  };
}

/* ── Skeleton helpers ──────────────────────────────────────── */

function SkeletonCard() {
  return (
    <div className="bg-surface-container-lowest rounded-2xl p-4 shadow-card">
      <div className="flex items-center gap-3 mb-2">
        <div className="skeleton w-9 h-9 rounded-xl" />
        <div className="skeleton h-3 w-20 rounded" />
      </div>
      <div className="skeleton h-8 w-16 rounded mt-1" />
      <div className="skeleton h-3 w-12 rounded mt-2" />
    </div>
  );
}

function SkeletonTableRow() {
  return (
    <tr>
      <td className="py-3 px-4"><div className="skeleton h-4 w-32 rounded" /></td>
      <td className="py-3 px-4"><div className="skeleton h-4 w-20 rounded" /></td>
      <td className="py-3 px-4"><div className="skeleton h-4 w-24 rounded" /></td>
      <td className="py-3 px-4"><div className="skeleton h-5 w-20 rounded-full" /></td>
    </tr>
  );
}

function SkeletonBar() {
  return (
    <div className="flex items-center gap-3">
      <div className="skeleton h-3 w-20 rounded" />
      <div className="flex-1 skeleton h-4 rounded-full" />
      <div className="skeleton h-3 w-8 rounded" />
    </div>
  );
}

/* ── Format helpers ────────────────────────────────────────── */

function formatDate(dateStr) {
  if (!dateStr) return '—';
  try {
    return new Intl.DateTimeFormat('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(new Date(dateStr));
  } catch {
    return dateStr;
  }
}

/* ── Dashboard Page ────────────────────────────────────────── */

export default function Dashboard() {
  const { t } = useLanguage();
  const kullanici = useAuthStore((s) => s.kullanici);

  const [stats, setStats] = useState(null);
  const [sonSayimlar, setSonSayimlar] = useState(null);
  const [isletmeSayimlar, setIsletmeSayimlar] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  /* ── Fetch data ────────────────────────────────────────── */

  const fetchData = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      setError(null);

      const [statsRes, isletmeRes, sonRes] = await Promise.allSettled([
        api.get('/stats'),
        api.get('/stats/isletme-sayimlar'),
        api.get('/stats/son-sayimlar'),
      ]);

      if (statsRes.status === 'fulfilled') setStats(statsRes.value.data);
      if (isletmeRes.status === 'fulfilled') setIsletmeSayimlar(isletmeRes.value.data);
      if (sonRes.status === 'fulfilled') setSonSayimlar(sonRes.value.data);

      // If all three failed, show error
      if (
        statsRes.status === 'rejected' &&
        isletmeRes.status === 'rejected' &&
        sonRes.status === 'rejected'
      ) {
        setError(statsRes.reason?.response?.data?.message || 'Veriler yuklenemedi');
      }
    } catch (err) {
      setError(err?.response?.data?.message || 'Veriler yuklenemedi');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /* ── Stat value getter ─────────────────────────────────── */

  function getStatValue(key) {
    if (!stats) return 0;
    const MAP = {
      isletmeSayisi: 'isletme',
      depoSayisi: 'depo',
      kullaniciSayisi: 'kullanici',
      urunSayisi: 'urun',
      aktifSayim: 'sayim_devam',
      tamamlananSayim: 'sayim_tamamlandi',
    };
    const apiKey = MAP[key] || key;
    return stats[apiKey] ?? stats[key] ?? 0;
  }

  function getStatChange(key) {
    if (!stats?.changes) return null;
    return stats.changes[key] ?? null;
  }

  /* ── Export handler (placeholder) ──────────────────────── */

  function handleExport() {
    // Future: call /stats/export endpoint
    window.alert('Rapor disa aktariliyor...');
  }

  /* ── Compute bar chart max ─────────────────────────────── */

  const barData = Array.isArray(isletmeSayimlar)
    ? isletmeSayimlar.slice(0, 5)
    : Array.isArray(isletmeSayimlar?.data)
      ? isletmeSayimlar.data.slice(0, 5)
      : [];

  const barMax = barData.reduce((mx, d) => Math.max(mx, d.toplam || d.sayi || d.count || 0), 1);

  /* ── Sayim list normalize ──────────────────────────────── */

  const sayimList = Array.isArray(sonSayimlar)
    ? sonSayimlar.slice(0, 5)
    : Array.isArray(sonSayimlar?.data)
      ? sonSayimlar.data.slice(0, 5)
      : [];

  /* ── Error state ───────────────────────────────────────── */

  if (error && !stats && !sonSayimlar && !isletmeSayimlar) {
    return (
      <div className="p-4 md:p-6">
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <span className="material-symbols-outlined text-[32px] text-error/60 mb-3">
            error
          </span>
          <p className="text-sm font-medium text-on-surface mb-2">
            {error}
          </p>
          <button
            onClick={() => fetchData()}
            className="mt-4 px-5 py-2.5 rounded-xl bg-cta-gradient text-white text-sm font-semibold shadow-card hover:shadow-elevated transition-shadow duration-200"
          >
            {t('dashboard.retryBtn')}
          </button>
        </div>
      </div>
    );
  }

  /* ── Render ─────────────────────────────────────────────── */

  return (
    <div className="p-4 md:p-6 space-y-4">

      {/* ── Page Header ──────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold font-headline text-on-surface">
            {t('nav.dashboard')}
          </h1>
          <p className="text-xs text-on-surface-variant mt-0.5">
            {kullanici?.ad
              ? `${t('dashboard.welcome')}, ${kullanici.ad}`
              : t('dashboard.allSystemsRunning')}
          </p>
        </div>
      </div>

      {/* ── Stats Row ────────────────────────────────────── */}
      {!loading && (
        <div className="flex items-center gap-4">
          {STAT_CARDS.map((card, idx) => {
            const value = getStatValue(card.key);
            return (
              <React.Fragment key={card.key}>
                {idx > 0 && <span className="w-px h-4 bg-outline-variant/20" />}
                <span className={`text-sm font-bold ${card.tintText}`}>
                  {typeof value === 'number' ? value.toLocaleString('tr-TR') : value}
                </span>
                <span className="text-[11px] text-on-surface-variant">
                  {t(card.labelKey)}
                </span>
              </React.Fragment>
            );
          })}
        </div>
      )}

      {/* ── Two-column grid ──────────────────────────────── */}
      <div className="grid lg:grid-cols-3 gap-3">

        {/* ── Left: Son Sayimlar Table (2 cols) ──────────── */}
        <div className="lg:col-span-2 bg-surface-container-lowest rounded-2xl shadow-card overflow-hidden">
          {/* Table header */}
          <div className="flex items-center justify-between px-5 py-4">
            <h2 className="text-sm font-bold font-headline text-on-surface">
              {t('dashboard.recentCounts')}
            </h2>
            <a
              href="/admin/sayimlar"
              className="text-xs font-semibold text-primary hover:text-primary-dark transition-colors"
            >
              {t('dashboard.viewAll')}
              <span className="material-symbols-outlined text-[14px] ml-1 align-middle">
                arrow_forward
              </span>
            </a>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-surface-container-low">
                  <th className="text-left text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant/60 py-2.5 px-5">
                    {t('table.countName')}
                  </th>
                  <th className="text-left text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant/60 py-2.5 px-4">
                    {t('table.warehouse')}
                  </th>
                  <th className="text-left text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant/60 py-2.5 px-4">
                    {t('table.date')}
                  </th>
                  <th className="text-left text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant/60 py-2.5 px-4">
                    {t('table.status')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => <SkeletonTableRow key={i} />)
                ) : sayimList.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-12 text-center text-on-surface-variant/50 text-sm">
                      <span className="material-symbols-outlined text-[32px] block mb-2 opacity-40">
                        inventory_2
                      </span>
                      {t('dashboard.noCountsYet')}
                    </td>
                  </tr>
                ) : (
                  sayimList.map((sayim, idx) => {
                    const chip = statusChip(sayim.durum || sayim.status);
                    return (
                      <tr
                        key={sayim.id || sayim._id || idx}
                        className="hover:bg-surface-container-low transition-colors duration-150"
                      >
                        <td className="py-2.5 px-5 font-medium text-on-surface">
                          {sayim.ad || sayim.name || sayim.sayimAdi || '—'}
                        </td>
                        <td className="py-2.5 px-4 text-on-surface-variant">
                          {sayim.depolar?.ad || sayim.depoAdi || sayim.depo || '—'}
                        </td>
                        <td className="py-2.5 px-4 text-on-surface-variant">
                          {formatDate(sayim.tarih || sayim.createdAt || sayim.olusturmaTarihi)}
                        </td>
                        <td className="py-2.5 px-4">
                          <span
                            className={`
                              inline-flex items-center rounded-full px-2.5 py-0.5
                              text-[11px] font-bold
                              ${chip.bg} ${chip.text}
                            `}
                          >
                            {chip.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Right: Isletme Bazli Sayimlar (1 col) ──────── */}
        <div className="bg-surface-container-lowest rounded-2xl shadow-card p-4 flex flex-col">
          <h2 className="text-sm font-bold font-headline text-on-surface mb-4">
            {t('dashboard.countByBusiness')}
          </h2>

          {loading ? (
            <div className="space-y-5 flex-1">
              {Array.from({ length: 5 }).map((_, i) => <SkeletonBar key={i} />)}
            </div>
          ) : barData.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-on-surface-variant/50 text-sm">
              <div className="text-center">
                <span className="material-symbols-outlined text-[32px] block mb-2 opacity-40">
                  bar_chart
                </span>
                {t('dashboard.noData')}
              </div>
            </div>
          ) : (
            <div className="space-y-4 flex-1">
              {barData.map((item, idx) => {
                const count = item.toplam || item.sayi || item.count || 0;
                const pct = Math.round((count / barMax) * 100);
                const name = item.isletmeAdi || item.ad || item.name || `Isletme ${idx + 1}`;

                return (
                  <div key={item.id || item._id || idx}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-medium text-on-surface-variant truncate mr-2">
                        {name}
                      </span>
                      <span className="text-xs font-bold text-on-surface tabular-nums">
                        {count}
                      </span>
                    </div>
                    <div className="w-full h-4 rounded-full bg-surface-container-high overflow-hidden">
                      <div
                        className="h-full rounded-full bg-cta-gradient transition-all duration-700 ease-out"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Bottom info card */}
          <div className="mt-4 p-3 rounded-xl bg-surface-container-low flex items-center gap-3">
            <span className="relative flex h-3 w-3 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-success" />
            </span>
            <span className="text-xs text-on-surface-variant font-medium">
              {t('dashboard.allSystemsRunning')}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
