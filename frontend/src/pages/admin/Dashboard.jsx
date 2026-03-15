import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2, Warehouse, Users, Package, ShieldCheck,
  ClipboardList, Calculator, Settings, ChevronRight,
  CheckCircle2, Clock, TrendingUp,
} from 'lucide-react';
import api from '../../lib/apiAdm';
import useAuthStoreAdm from '../../store/authStoreAdm';

/* ── Renkler ── */
const GRAD = {
  indigo: 'linear-gradient(135deg,#6366F1,#8B5CF6)',
  blue:   'linear-gradient(135deg,#0EA5E9,#2563EB)',
  green:  'linear-gradient(135deg,#10B981,#059669)',
  amber:  'linear-gradient(135deg,#F59E0B,#D97706)',
  pink:   'linear-gradient(135deg,#EC4899,#DB2777)',
  teal:   'linear-gradient(135deg,#14B8A6,#0D9488)',
  gray:   'linear-gradient(135deg,#64748B,#475569)',
  purple: 'linear-gradient(135deg,#6366F1,#4F46E5)',
};

/* ── SVG Donut Chart ── */
function DonutChart({ segments, total }) {
  const R = 54;
  const cx = 72;
  const cy = 72;
  const circumference = 2 * Math.PI * R;

  if (!total || total === 0) {
    return (
      <svg width="144" height="144">
        <circle cx={cx} cy={cy} r={R} fill="none" stroke="#F3F4F6" strokeWidth="18" />
      </svg>
    );
  }

  let offset = 0;
  const arcs = segments.map(seg => {
    const dash  = (seg.value / total) * circumference;
    const gap   = circumference - dash;
    const start = offset;
    offset += dash + 3; // 3px gap between segments
    return { ...seg, dash, gap: circumference - dash, start };
  });

  return (
    <svg width="144" height="144" style={{ transform: 'rotate(-90deg)' }}>
      {/* Track */}
      <circle cx={cx} cy={cy} r={R} fill="none" stroke="#F3F4F6" strokeWidth="18" />
      {arcs.map((arc, i) => (
        <circle key={i}
          cx={cx} cy={cy} r={R}
          fill="none"
          stroke={arc.color}
          strokeWidth="18"
          strokeDasharray={`${arc.dash} ${arc.gap}`}
          strokeDashoffset={-arc.start}
          strokeLinecap="round"
        />
      ))}
    </svg>
  );
}

/* ── Skeleton ── */
function Skel({ h = 'h-20', cls = '' }) {
  return <div className={`${h} rounded-2xl bg-gray-100 animate-pulse ${cls}`} />;
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { kullanici } = useAuthStoreAdm();

  const [stats, setStats]           = useState(null);
  const [donut, setDonut]           = useState({ devam: 0, tamamlandi: 0, toplam: 0 });
  const [isletmeSayim, setIsletmeSayim] = useState([]);
  const [sonSayimlar, setSonSayimlar]   = useState([]);
  const [loading, setLoading]       = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        // Tek sorguda tüm sayılar + ayrı endpoint'ler
        const [rStats, rTrend, rSon] = await Promise.all([
          api.get('/stats'),
          api.get('/stats/isletme-sayimlar'),
          api.get('/stats/son-sayimlar'),
        ]);

        if (cancelled) return;

        const s = rStats.data || {};
        setStats({
          isletme:   s.isletme   || 0,
          kullanici: s.kullanici || 0,
          depo:      s.depo      || 0,
          urun:      s.urun      || 0,
          sayim:     s.sayim_toplam || 0,
        });
        setDonut({
          devam:      s.sayim_devam      || 0,
          tamamlandi: s.sayim_tamamlandi || 0,
          toplam:     s.sayim_toplam     || 0,
        });
        setIsletmeSayim(rTrend.data || []);
        setSonSayimlar(rSon.data   || []);
      } catch {
        // sessizce devam
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, []);

  const { devam, tamamlandi, toplam } = donut;

  const donutSegments = [
    { value: tamamlandi, color: '#10B981' },
    { value: devam,      color: '#3B82F6' },
  ].filter(s => s.value > 0);

  const maxSayim = Math.max(...isletmeSayim.map(i => i.toplam), 1);

  const navLinks = [
    { icon: Building2,    grad: GRAD.indigo, label: 'İşletmeler',   to: '/admin/isletmeler',   count: stats?.isletme   },
    { icon: Warehouse,    grad: GRAD.blue,   label: 'Depolar',      to: '/admin/depolar',       count: stats?.depo      },
    { icon: Users,        grad: GRAD.green,  label: 'Kullanıcılar', to: '/admin/kullanicilar',  count: stats?.kullanici },
    { icon: Package,      grad: GRAD.amber,  label: 'Ürünler',      to: '/admin/urunler',       count: stats?.urun      },
    { icon: ShieldCheck,  grad: GRAD.pink,   label: 'Roller',       to: '/admin/roller'                                 },
    { icon: ClipboardList,grad: GRAD.teal,   label: 'Sayımlar',     to: '/admin/sayimlar',      count: stats?.sayim     },
    { icon: Calculator,   grad: GRAD.purple, label: 'Toplam Sayımlar', to: '/admin/toplanmis-sayimlar'                    },
    { icon: Settings,     grad: GRAD.gray,   label: 'Ayarlar',      to: '/admin/ayarlar'                                },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-5 overflow-auto">

      {/* ── Hızlı Navigasyon ── */}
      <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
        {navLinks.map((n, i) => (
          <button key={i} onClick={() => navigate(n.to)}
            className="flex flex-col items-center gap-1.5 py-3 px-1 rounded-2xl bg-white border border-gray-100 hover:border-indigo-200 hover:shadow-md transition-all group">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shadow-sm"
              style={{ background: n.grad }}>
              <n.icon className="w-4 h-4 text-white" />
            </div>
            <span className="text-[10px] font-semibold text-gray-500 group-hover:text-indigo-600 text-center leading-tight transition-colors">
              {n.label}
            </span>
            {n.count != null && (
              <span className="text-[10px] font-black text-indigo-500">{n.count}</span>
            )}
          </button>
        ))}
      </div>

      {/* ── Orta Satır ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Sayım Durumu */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h2 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
            <ClipboardList className="w-4 h-4 text-indigo-400" />
            Sayım Durumu
          </h2>
          {loading
            ? <Skel h="h-44" />
            : toplam === 0
            ? (
              <div className="flex flex-col items-center justify-center h-44 text-gray-200 gap-2">
                <ClipboardList className="w-10 h-10" />
                <span className="text-sm text-gray-300">Henüz sayım yok</span>
              </div>
            ) : (
              <div className="flex items-center gap-5">
                {/* SVG Donut */}
                <div className="relative flex-shrink-0">
                  <DonutChart segments={donutSegments} total={toplam} />
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-2xl font-black text-gray-900">{toplam}</span>
                    <span className="text-[10px] text-gray-400 font-medium">Toplam</span>
                  </div>
                </div>
                {/* Detay kartları */}
                <div className="flex-1 space-y-2.5">
                  {[
                    { icon: CheckCircle2, label: 'Tamamlandı',   value: tamamlandi, color: '#10B981', bg: '#F0FDF4' },
                    { icon: Clock,        label: 'Devam Ediyor', value: devam,      color: '#3B82F6', bg: '#EFF6FF' },
                  ].map((r, i) => (
                    <div key={i} className="flex items-center gap-3 px-3 py-2.5 rounded-xl" style={{ background: r.bg }}>
                      <r.icon className="w-4 h-4 flex-shrink-0" style={{ color: r.color }} />
                      <span className="text-xs text-gray-600 flex-1">{r.label}</span>
                      <span className="text-sm font-black" style={{ color: r.color }}>{r.value}</span>
                      <span className="text-xs text-gray-400 w-8 text-right">
                        %{toplam > 0 ? Math.round(r.value / toplam * 100) : 0}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )
          }
        </div>

        {/* İşletme Bazlı */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h2 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-indigo-400" />
            İşletme Bazlı Sayım
          </h2>
          {loading
            ? <Skel h="h-44" />
            : isletmeSayim.length === 0 || isletmeSayim[0]?.toplam === 0
            ? (
              <div className="flex flex-col items-center justify-center h-44 text-gray-200 gap-2">
                <Building2 className="w-10 h-10" />
                <span className="text-sm text-gray-300">Veri yok</span>
              </div>
            ) : (
              <div className="space-y-3.5">
                {isletmeSayim.map((il, idx) => (
                  <div key={idx}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-semibold text-gray-700 truncate max-w-[55%]">{il.ad}</span>
                      <div className="flex items-center gap-1.5 text-xs">
                        <span className="font-bold text-green-600">{il.tamamlandi}</span>
                        <span className="text-gray-300">/</span>
                        <span className="font-bold text-gray-700">{il.toplam}</span>
                      </div>
                    </div>
                    <div className="h-2 rounded-full overflow-hidden bg-gray-100">
                      <div className="h-full flex overflow-hidden rounded-full">
                        <div className="h-full transition-all duration-500"
                          style={{ width: `${(il.tamamlandi / maxSayim) * 100}%`, background: '#10B981' }} />
                        <div className="h-full transition-all duration-500"
                          style={{ width: `${(il.devam / maxSayim) * 100}%`, background: '#3B82F6' }} />
                      </div>
                    </div>
                  </div>
                ))}
                <div className="flex items-center gap-4 pt-1">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-green-500 inline-block" />
                    <span className="text-[11px] text-gray-400">Tamamlandı</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block" />
                    <span className="text-[11px] text-gray-400">Devam Ediyor</span>
                  </div>
                </div>
              </div>
            )
          }
        </div>
      </div>

      {/* ── Son Sayımlar ── */}
      {!loading && sonSayimlar.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-gray-800 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-indigo-400" />
              Son Sayımlar
            </h2>
            <button onClick={() => navigate('/admin/sayimlar')}
              className="text-xs text-indigo-500 hover:text-indigo-700 font-semibold flex items-center gap-1">
              Tümünü Gör <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="space-y-1.5">
            {sonSayimlar.map(s => {
              const d = s.durum === 'tamamlandi'
                ? { bg: '#F0FDF4', color: '#15803D', dot: '#22C55E', label: 'Tamamlandı' }
                : { bg: '#EFF6FF', color: '#2563EB', dot: '#3B82F6', label: 'Devam Ediyor' };
              return (
                <div key={s.id}
                  onClick={() => navigate('/admin/sayimlar')}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: GRAD.teal }}>
                    <ClipboardList className="w-3.5 h-3.5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">{s.ad}</p>
                    <p className="text-xs text-gray-400 truncate">
                      {s.depolar?.ad || '—'} · {s.isletmeler?.ad || '—'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {s.tarih && (
                      <span className="text-xs text-gray-400 hidden sm:block">
                        {new Date(s.tarih).toLocaleDateString('tr-TR')}
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full"
                      style={{ background: d.bg, color: d.color }}>
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: d.dot }} />
                      {d.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <p className="text-center text-xs text-gray-200 pb-1">StokSay v2.0.0</p>
    </div>
  );
}
