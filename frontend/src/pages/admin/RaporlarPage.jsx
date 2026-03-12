import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import {
  BarChart3, ClipboardList, CheckCircle2, XCircle, Clock,
  Users, Warehouse, Building2, TrendingUp, Calendar, Package,
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import api from '../../lib/apiAdm';

/* ── Renkler ── */
const GRAD = {
  indigo: 'linear-gradient(135deg,#6366F1,#8B5CF6)',
  green:  'linear-gradient(135deg,#10B981,#059669)',
  amber:  'linear-gradient(135deg,#F59E0B,#D97706)',
  red:    'linear-gradient(135deg,#EF4444,#DC2626)',
  blue:   'linear-gradient(135deg,#0EA5E9,#2563EB)',
  teal:   'linear-gradient(135deg,#14B8A6,#0D9488)',
  pink:   'linear-gradient(135deg,#EC4899,#DB2777)',
  purple: 'linear-gradient(135deg,#6366F1,#4F46E5)',
};

const AY_ADLARI = ['Oca','Şub','Mar','Nis','May','Haz','Tem','Ağu','Eyl','Eki','Kas','Ara'];

const ARALIK_SECENEKLER = [
  { label: 'Son 7 gün',    value: 7   },
  { label: 'Son 30 gün',   value: 30  },
  { label: 'Son 3 ay',     value: 90  },
  { label: 'Son 6 ay',     value: 180 },
  { label: 'Son 1 yıl',    value: 365 },
  { label: 'Tüm zamanlar', value: 0   },
];

const SEKMELER = [
  { key: 'sayim',    label: 'Sayım',     icon: ClipboardList, grad: GRAD.teal   },
  { key: 'isletme',  label: 'İşletme',   icon: Building2,     grad: GRAD.indigo },
  { key: 'depo',     label: 'Depo',      icon: Warehouse,     grad: GRAD.blue   },
  { key: 'kullanici',label: 'Kullanıcı', icon: Users,         grad: GRAD.green  },
];

/* ── Yardımcı bileşenler ── */
function StatKart({ icon: Icon, label, value, alt, grad, light }) {
  return (
    <div className="bg-white rounded-2xl p-4 border border-gray-100 flex items-center gap-4 shadow-sm">
      <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-md"
        style={{ background: grad }}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <div>
        <p className="text-xs text-gray-400 font-medium">{label}</p>
        <p className="text-2xl font-black" style={{ color: light }}>{value ?? 0}</p>
        {alt && <p className="text-xs text-gray-400 mt-0.5">{alt}</p>}
      </div>
    </div>
  );
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white rounded-xl shadow-xl border border-gray-100 px-4 py-3 text-sm">
      <p className="font-bold text-gray-800 mb-1.5">{label}</p>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full" style={{ background: p.color }} />
          <span className="text-gray-500">{p.name}:</span>
          <span className="font-bold text-gray-800">{p.value}</span>
        </div>
      ))}
    </div>
  );
}

function Bos({ icon: Icon = ClipboardList }) {
  return (
    <div className="flex items-center justify-center h-48 text-gray-200">
      <Icon className="w-12 h-12" />
    </div>
  );
}

/* ══════════════════════════════════════════ */
export default function RaporlarPage() {
  const [sayimlar, setSayimlar]         = useState([]);
  const [isletmeler, setIsletmeler]     = useState([]);
  const [kullanicilar, setKullanicilar] = useState([]);
  const [depolar, setDepolar]           = useState([]);
  const [aralik, setAralik]             = useState(180);
  const [sekme, setSekme]               = useState('sayim');
  const [yukleniyor, setYukleniyor]     = useState(true);

  useEffect(() => {
    setYukleniyor(true);
    Promise.all([
      api.get('/sayimlar?limit=9999'),
      api.get('/isletmeler'),
      api.get('/kullanicilar'),
    ]).then(([rs, ri, rk]) => {
      setSayimlar((rs.data.data || []).filter(s => s.durum !== 'silindi'));
      setIsletmeler(ri.data || []);
      setKullanicilar(rk.data || []);
      return Promise.all((ri.data || []).map(i =>
        api.get(`/depolar?isletme_id=${i.id}`)
          .then(r => (r.data || []).map(d => ({ ...d, isletme_adi: i.ad })))
          .catch(() => [])
      ));
    }).then(ds => setDepolar(ds.flat()))
      .catch(() => toast.error('Veriler yüklenemedi.'))
      .finally(() => setYukleniyor(false));
  }, []);

  /* Tarih filtresi */
  const aralikBas = aralik > 0
    ? new Date(Date.now() - aralik * 24 * 60 * 60 * 1000)
    : null;
  const f = aralikBas
    ? sayimlar.filter(s => new Date(s.created_at) >= aralikBas)
    : sayimlar;

  /* ── Sayım hesapları ── */
  const toplam     = f.length;
  const tamamlandi = f.filter(s => s.durum === 'tamamlandi').length;
  const devam      = f.filter(s => s.durum === 'devam').length;

  const aylikTrend = (() => {
    const bugun  = new Date();
    const ayAdet = aralik === 0 ? 12 : Math.min(Math.ceil(aralik / 30), 12);
    const aylar  = [];
    for (let i = ayAdet - 1; i >= 0; i--) {
      const d = new Date(bugun.getFullYear(), bugun.getMonth() - i, 1);
      aylar.push({ yil: d.getFullYear(), ay: d.getMonth() });
    }
    return aylar.map(({ yil, ay }) => {
      const ayStr  = `${AY_ADLARI[ay]} ${yil !== bugun.getFullYear() ? yil : ''}`.trim();
      const ayData = f.filter(s => {
        const d = new Date(s.created_at);
        return d.getFullYear() === yil && d.getMonth() === ay;
      });
      return {
        ad: ayStr,
        Tamamlanan:   ayData.filter(s => s.durum === 'tamamlandi').length,
        'Devam Eden': ayData.filter(s => s.durum === 'devam').length,
      };
    });
  })();

  const durumPie = [
    { name: 'Tamamlandı',   value: tamamlandi, fill: '#10B981' },
    { name: 'Devam Ediyor', value: devam,       fill: '#3B82F6' },
  ].filter(d => d.value > 0);

  /* ── İşletme hesapları ── */
  const isletmeBazli = isletmeler.map(i => ({
    ad:   i.ad.length > 16 ? i.ad.slice(0, 14) + '…' : i.ad,
    adTam: i.ad,
    Tamamlanan:   f.filter(s => s.isletme_id === i.id && s.durum === 'tamamlandi').length,
    'Devam Eden': f.filter(s => s.isletme_id === i.id && s.durum === 'devam').length,
    toplam:       f.filter(s => s.isletme_id === i.id).length,
  })).filter(i => i.toplam > 0).sort((a, b) => b.toplam - a.toplam);

  const isletmePie = isletmeler.map(i => ({
    name:  i.ad,
    value: sayimlar.filter(s => s.isletme_id === i.id).length,
    fill:  ['#6366F1','#10B981','#F59E0B','#EC4899','#0EA5E9','#14B8A6'][isletmeler.indexOf(i) % 6],
  })).filter(i => i.value > 0);

  /* ── Depo hesapları ── */
  const depoTablo = depolar.map(d => {
    const ds  = sayimlar.filter(s => s.depo_id === d.id);
    const son = ds[0];
    return {
      ...d,
      toplamSayim:   ds.length,
      tamamlandi:    ds.filter(s => s.durum === 'tamamlandi').length,
      devam:         ds.filter(s => s.durum === 'devam').length,
      sonTarih:      son?.tarih || son?.created_at || null,
      sonDurum:      son?.durum || null,
    };
  }).sort((a, b) => b.toplamSayim - a.toplamSayim);

  const depoBar = depoTablo.slice(0, 10).map(d => ({
    ad:           d.ad.length > 12 ? d.ad.slice(0, 10) + '…' : d.ad,
    Tamamlanan:   d.tamamlandi,
    'Devam Eden': d.devam,
    toplam:       d.toplamSayim,
  })).filter(d => d.toplam > 0);

  /* ── Kullanıcı hesapları ── */
  const kullaniciBazli = kullanicilar
    .map(k => ({
      ad:   k.ad_soyad?.split(' ')[0] || '—',
      adTam: k.ad_soyad || '—',
      Tamamlanan:   f.filter(s => s.kullanicilar?.id === k.id && s.durum === 'tamamlandi').length,
      'Devam Eden': f.filter(s => s.kullanicilar?.id === k.id && s.durum === 'devam').length,
      toplam:       f.filter(s => s.kullanicilar?.id === k.id).length,
    }))
    .filter(k => k.toplam > 0)
    .sort((a, b) => b.toplam - a.toplam)
    .slice(0, 10);

  const aktifKullanici = kullanicilar.filter(k =>
    f.some(s => s.kullanicilar?.id === k.id)
  ).length;

  /* ── Durum badge yardımcısı ── */
  const durumBadge = (durum) => {
    if (!durum) return <span className="text-xs text-gray-300">—</span>;
    const cfg = durum === 'tamamlandi'
      ? { bg: '#F0FDF4', color: '#15803D', dot: '#22C55E', label: 'Tamamlandı' }
      : { bg: '#EFF6FF', color: '#2563EB', dot: '#3B82F6', label: 'Devam Ediyor' };
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full"
        style={{ background: cfg.bg, color: cfg.color }}>
        <span className="w-1.5 h-1.5 rounded-full" style={{ background: cfg.dot }} />
        {cfg.label}
      </span>
    );
  };

  if (yukleniyor) {
    return (
      <div className="flex flex-col h-full">
        <div className="bg-white border-b border-gray-200 px-6 py-5">
          <div className="h-7 w-40 bg-gray-200 rounded-lg animate-pulse" />
        </div>
        <div className="p-6 grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <div key={i} className="h-24 bg-white rounded-2xl animate-pulse border border-gray-100" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-auto">

      {/* ── Sticky Header ── */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">

        {/* Başlık + tarih filtresi */}
        <div className="flex items-center justify-between gap-4 flex-wrap px-6 lg:px-8 pt-5 pb-3">
          <h1 className="text-xl font-black text-gray-900 flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: GRAD.indigo }}>
              <BarChart3 className="w-4 h-4 text-white" />
            </div>
            Raporlar
          </h1>
          <div className="flex items-center gap-1 bg-gray-50 rounded-xl p-1 border border-gray-100 overflow-x-auto">
            {ARALIK_SECENEKLER.map(s => (
              <button key={s.value}
                onClick={() => setAralik(s.value)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex-shrink-0"
                style={aralik === s.value
                  ? { background: GRAD.indigo, color: 'white', boxShadow: '0 2px 8px rgba(99,102,241,0.4)' }
                  : { color: '#6B7280' }}>
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Sekme çubuğu */}
        <div className="flex items-center gap-1 px-6 lg:px-8">
          {SEKMELER.map(s => {
            const aktif = sekme === s.key;
            return (
              <button key={s.key}
                onClick={() => setSekme(s.key)}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-all ${
                  aktif ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-400 hover:text-gray-700'
                }`}
              >
                <div className="w-5 h-5 rounded-md flex items-center justify-center"
                  style={{ background: aktif ? s.grad : '#F3F4F6' }}>
                  <s.icon className={`w-3 h-3 ${aktif ? 'text-white' : 'text-gray-400'}`} />
                </div>
                {s.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="p-4 sm:p-6 lg:p-8 space-y-5">

        {/* ════════════ SAYIM SEKMESİ ════════════ */}
        {sekme === 'sayim' && (
          <>
            {/* Stat kartları */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <StatKart icon={ClipboardList} label="Toplam Sayım"  value={toplam}      grad={GRAD.teal}  light="#14B8A6" />
              <StatKart icon={CheckCircle2}  label="Tamamlanan"    value={tamamlandi}  grad={GRAD.green} light="#10B981"
                alt={toplam > 0 ? `%${Math.round(tamamlandi / toplam * 100)} oran` : null} />
              <StatKart icon={Clock}         label="Devam Eden"    value={devam}       grad={GRAD.blue}  light="#3B82F6"
                alt={toplam > 0 ? `%${Math.round(devam / toplam * 100)} oran` : null} />
            </div>

            {/* Aylık trend + durum pie */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="w-4 h-4 text-indigo-500" />
                  <h2 className="text-sm font-bold text-gray-800">Aylık Sayım Trendi</h2>
                </div>
                {aylikTrend.every(a => a.Tamamlanan + a['Devam Eden'] === 0)
                  ? <Bos />
                  : (
                    <ResponsiveContainer width="100%" height={220}>
                      <AreaChart data={aylikTrend} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="gT" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10B981" stopOpacity={0.25} />
                            <stop offset="95%" stopColor="#10B981" stopOpacity={0.02} />
                          </linearGradient>
                          <linearGradient id="gD" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.2} />
                            <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.02} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                        <XAxis dataKey="ad" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                        <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend iconType="circle" iconSize={8}
                          formatter={v => <span style={{ fontSize: 11, color: '#6B7280' }}>{v}</span>} />
                        <Area type="monotone" dataKey="Tamamlanan"   stroke="#10B981" strokeWidth={2.5} fill="url(#gT)" dot={false} activeDot={{ r: 5 }} />
                        <Area type="monotone" dataKey="Devam Eden"   stroke="#3B82F6" strokeWidth={2.5} fill="url(#gD)" dot={false} activeDot={{ r: 5 }} />
                      </AreaChart>
                    </ResponsiveContainer>
                  )
                }
              </div>

              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col">
                <div className="flex items-center gap-2 mb-4">
                  <BarChart3 className="w-4 h-4 text-indigo-500" />
                  <h2 className="text-sm font-bold text-gray-800">Durum Dağılımı</h2>
                </div>
                {durumPie.length === 0 ? <Bos /> : (
                  <>
                    <ResponsiveContainer width="100%" height={180}>
                      <PieChart>
                        <Pie data={durumPie} cx="50%" cy="50%" innerRadius={52} outerRadius={80}
                          paddingAngle={3} dataKey="value" stroke="none">
                          {durumPie.map((d, i) => <Cell key={i} fill={d.fill} />)}
                        </Pie>
                        <Tooltip content={({ active, payload }) => {
                          if (!active || !payload?.length) return null;
                          const p = payload[0];
                          return (
                            <div className="bg-white rounded-xl shadow-xl border border-gray-100 px-4 py-3 text-sm">
                              <div className="flex items-center gap-2">
                                <span className="w-2.5 h-2.5 rounded-full" style={{ background: p.payload.fill }} />
                                <span className="font-bold text-gray-800">{p.name}</span>
                                <span className="text-gray-500 ml-1">{p.value}</span>
                              </div>
                            </div>
                          );
                        }} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="space-y-2 mt-2">
                      {durumPie.map((d, i) => (
                        <div key={i} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full" style={{ background: d.fill }} />
                            <span className="text-xs text-gray-500">{d.name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-gray-800">{d.value}</span>
                            <span className="text-xs text-gray-400">%{toplam > 0 ? Math.round(d.value / toplam * 100) : 0}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          </>
        )}

        {/* ════════════ İŞLETME SEKMESİ ════════════ */}
        {sekme === 'isletme' && (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
              <StatKart icon={Building2}    label="Toplam İşletme"  value={isletmeler.length}                       grad={GRAD.indigo} light="#6366F1" />
              <StatKart icon={ClipboardList} label="Toplam Sayım"   value={toplam}                                  grad={GRAD.teal}   light="#14B8A6" />
              <StatKart icon={TrendingUp}   label="Aktif İşletme"   value={isletmeBazli.length}                     grad={GRAD.green}  light="#10B981" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Bar chart */}
              <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Building2 className="w-4 h-4 text-indigo-500" />
                  <h2 className="text-sm font-bold text-gray-800">İşletme Bazlı Sayımlar</h2>
                </div>
                {isletmeBazli.length === 0 ? <Bos icon={Building2} /> : (
                  <ResponsiveContainer width="100%" height={Math.max(200, isletmeBazli.length * 48)}>
                    <BarChart data={isletmeBazli} layout="vertical" margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" horizontal={false} />
                      <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                      <YAxis type="category" dataKey="ad" width={90} tick={{ fontSize: 11, fill: '#374151' }} axisLine={false} tickLine={false} />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend iconType="circle" iconSize={8} formatter={v => <span style={{ fontSize: 11, color: '#6B7280' }}>{v}</span>} />
                      <Bar dataKey="Tamamlanan"   stackId="a" fill="#10B981" radius={[0,0,0,0]} />
                      <Bar dataKey="Devam Eden"   stackId="a" fill="#3B82F6" radius={[4,4,0,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>

              {/* Pie dağılım */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <div className="flex items-center gap-2 mb-4">
                  <BarChart3 className="w-4 h-4 text-indigo-500" />
                  <h2 className="text-sm font-bold text-gray-800">Sayım Payları</h2>
                </div>
                {isletmePie.length === 0 ? <Bos icon={Building2} /> : (
                  <>
                    <ResponsiveContainer width="100%" height={180}>
                      <PieChart>
                        <Pie data={isletmePie} cx="50%" cy="50%" innerRadius={45} outerRadius={75}
                          paddingAngle={3} dataKey="value" stroke="none">
                          {isletmePie.map((d, i) => <Cell key={i} fill={d.fill} />)}
                        </Pie>
                        <Tooltip formatter={(v, n) => [v + ' sayım', n]} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="space-y-1.5 mt-2 max-h-40 overflow-y-auto">
                      {isletmePie.map((d, i) => (
                        <div key={i} className="flex items-center justify-between">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: d.fill }} />
                            <span className="text-xs text-gray-600 truncate">{d.name}</span>
                          </div>
                          <span className="text-xs font-bold text-gray-800 ml-2 flex-shrink-0">{d.value}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          </>
        )}

        {/* ════════════ DEPO SEKMESİ ════════════ */}
        {sekme === 'depo' && (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
              <StatKart icon={Warehouse}    label="Toplam Depo"     value={depolar.length}                          grad={GRAD.blue}  light="#2563EB" />
              <StatKart icon={ClipboardList} label="Sayım Yapılan"  value={depoTablo.filter(d => d.toplamSayim > 0).length} grad={GRAD.teal}  light="#14B8A6" />
              <StatKart icon={CheckCircle2} label="Son Sayım Tamam" value={depoTablo.filter(d => d.sonDurum === 'tamamlandi').length} grad={GRAD.green} light="#10B981" />
            </div>

            {/* Depo bar */}
            {depoBar.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Warehouse className="w-4 h-4 text-indigo-500" />
                  <h2 className="text-sm font-bold text-gray-800">Depo Bazlı Sayım (İlk 10)</h2>
                </div>
                <ResponsiveContainer width="100%" height={Math.max(200, depoBar.length * 48)}>
                  <BarChart data={depoBar} layout="vertical" margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" horizontal={false} />
                    <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="ad" width={90} tick={{ fontSize: 11, fill: '#374151' }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend iconType="circle" iconSize={8} formatter={v => <span style={{ fontSize: 11, color: '#6B7280' }}>{v}</span>} />
                    <Bar dataKey="Tamamlanan"   stackId="a" fill="#10B981" radius={[0,0,0,0]} />
                    <Bar dataKey="Devam Eden"   stackId="a" fill="#3B82F6" radius={[4,4,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Depo tablosu */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-center gap-2 mb-4">
                <Warehouse className="w-4 h-4 text-indigo-500" />
                <h2 className="text-sm font-bold text-gray-800">Depo Detay Tablosu</h2>
                <span className="ml-auto text-xs text-gray-400">{depoTablo.length} depo</span>
              </div>
              {depoTablo.length === 0 ? (
                <div className="text-center py-10 text-gray-300 text-sm">Depo bulunamadı</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100">
                        <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide pb-3 pr-4">Depo</th>
                        <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide pb-3 pr-4">İşletme</th>
                        <th className="text-center text-xs font-semibold text-gray-400 uppercase tracking-wide pb-3 pr-4">Toplam</th>
                        <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide pb-3 pr-4">Son Sayım</th>
                        <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide pb-3">Durum</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {depoTablo.map(d => (
                        <tr key={d.id} className="hover:bg-gray-50/60 transition-colors">
                          <td className="py-3 pr-4">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0"
                                style={{ background: 'linear-gradient(135deg,#0EA5E9,#2563EB)' }}>
                                <Warehouse className="w-3 h-3 text-white" />
                              </div>
                              <span className="font-medium text-gray-800">{d.ad}</span>
                              {d.kod && <span className="text-[10px] font-mono text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">{d.kod}</span>}
                            </div>
                          </td>
                          <td className="py-3 pr-4">
                            <span className="text-xs font-medium px-2 py-1 rounded-lg" style={{ background: '#EEF2FF', color: '#6366F1' }}>
                              {d.isletme_adi}
                            </span>
                          </td>
                          <td className="py-3 pr-4 text-center">
                            <span className="text-sm font-bold text-gray-800">{d.toplamSayim}</span>
                            <span className="text-xs text-gray-400 ml-1">sayım</span>
                          </td>
                          <td className="py-3 pr-4">
                            {d.sonTarih ? (
                              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                                <Calendar className="w-3 h-3 text-gray-400" />
                                {new Date(d.sonTarih).toLocaleDateString('tr-TR')}
                              </div>
                            ) : <span className="text-xs text-gray-300">—</span>}
                          </td>
                          <td className="py-3">{durumBadge(d.sonDurum)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}

        {/* ════════════ KULLANICI SEKMESİ ════════════ */}
        {sekme === 'kullanici' && (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
              <StatKart icon={Users}        label="Toplam Kullanıcı" value={kullanicilar.length}  grad={GRAD.green}  light="#10B981" />
              <StatKart icon={TrendingUp}   label="Aktif Kullanıcı"  value={aktifKullanici}       grad={GRAD.indigo} light="#6366F1"
                alt={`${aralik > 0 ? `Son ${aralik} günde` : 'Tüm zamanlarda'}`} />
              <StatKart icon={ClipboardList} label="Toplam Sayım"    value={toplam}               grad={GRAD.teal}   light="#14B8A6" />
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-center gap-2 mb-4">
                <Users className="w-4 h-4 text-indigo-500" />
                <h2 className="text-sm font-bold text-gray-800">Kullanıcı Aktivitesi</h2>
              </div>
              {kullaniciBazli.length === 0 ? <Bos icon={Users} /> : (
                <ResponsiveContainer width="100%" height={Math.max(200, kullaniciBazli.length * 48)}>
                  <BarChart data={kullaniciBazli} layout="vertical" margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" horizontal={false} />
                    <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="ad" width={80} tick={{ fontSize: 11, fill: '#374151' }} axisLine={false} tickLine={false} />
                    <Tooltip content={({ active, payload, label }) => {
                      if (!active || !payload?.length) return null;
                      const k = kullaniciBazli.find(x => x.ad === label);
                      return (
                        <div className="bg-white rounded-xl shadow-xl border border-gray-100 px-4 py-3 text-sm">
                          <p className="font-bold text-gray-800 mb-1.5">{k?.adTam || label}</p>
                          {payload.map((p, i) => (
                            <div key={i} className="flex items-center gap-2">
                              <span className="w-2.5 h-2.5 rounded-full" style={{ background: p.color }} />
                              <span className="text-gray-500">{p.name}:</span>
                              <span className="font-bold text-gray-800">{p.value}</span>
                            </div>
                          ))}
                        </div>
                      );
                    }} />
                    <Legend iconType="circle" iconSize={8} formatter={v => <span style={{ fontSize: 11, color: '#6B7280' }}>{v}</span>} />
                    <Bar dataKey="Tamamlanan"   stackId="a" fill="#6366F1" radius={[0,0,0,0]} />
                    <Bar dataKey="Devam Eden"   stackId="a" fill="#A5B4FC" radius={[4,4,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Kullanıcı tablosu */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-center gap-2 mb-4">
                <Users className="w-4 h-4 text-indigo-500" />
                <h2 className="text-sm font-bold text-gray-800">Kullanıcı Detayları</h2>
              </div>
              {kullaniciBazli.length === 0 ? (
                <div className="text-center py-8 text-gray-300 text-sm">Bu dönemde aktif kullanıcı yok</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100">
                        <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide pb-3 pr-4">Kullanıcı</th>
                        <th className="text-center text-xs font-semibold text-gray-400 uppercase tracking-wide pb-3 pr-4">Toplam</th>
                        <th className="text-center text-xs font-semibold text-gray-400 uppercase tracking-wide pb-3 pr-4">Tamamlanan</th>
                        <th className="text-center text-xs font-semibold text-gray-400 uppercase tracking-wide pb-3">Devam Eden</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {kullaniciBazli.map((k, i) => (
                        <tr key={i} className="hover:bg-gray-50/60 transition-colors">
                          <td className="py-3 pr-4">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                                style={{ background: GRAD.indigo }}>
                                {k.adTam.charAt(0).toUpperCase()}
                              </div>
                              <span className="font-medium text-gray-800">{k.adTam}</span>
                            </div>
                          </td>
                          <td className="py-3 pr-4 text-center">
                            <span className="text-sm font-bold text-gray-800">{k.toplam}</span>
                          </td>
                          <td className="py-3 pr-4 text-center">
                            <span className="text-sm font-bold text-green-600">{k.Tamamlanan}</span>
                          </td>
                          <td className="py-3 text-center">
                            <span className="text-sm font-bold text-blue-500">{k['Devam Eden']}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}

      </div>
    </div>
  );
}
