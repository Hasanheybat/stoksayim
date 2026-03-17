import { useCallback, useEffect, useState, useRef } from 'react';
import toast from 'react-hot-toast';
import { Users, ShieldCheck, UserCheck, Plus, Pencil, Power, Search, Building2, ChevronDown, Check, X, AlertTriangle, Save, Shield, ChevronLeft, ChevronRight, RotateCcw, Eye, Mail, Phone } from 'lucide-react';
import api from '../../lib/apiAdm';

/* ── Yetki sabitleri ── */
const FABRIKA_YETKILER = {
  urun:   { goruntule: true,  ekle: false, duzenle: false, sil: false },
  depo:   { goruntule: true,  ekle: false, duzenle: false, sil: false },
  sayim:        { goruntule: true,  ekle: true,  duzenle: false, sil: false },
  toplam_sayim: { goruntule: false, ekle: false, duzenle: false, sil: false },
};

const LS_KEY = 'stoksay_default_yetkiler_kullanici';

function getDefaultYetkiler() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return JSON.parse(JSON.stringify(FABRIKA_YETKILER));
}

// Backward-compat alias
const DEFAULT_YETKILER = FABRIKA_YETKILER;

const KATEGORILER = [
  { key: 'urun',   label: 'Ürünler', islemler: ['goruntule', 'ekle', 'duzenle', 'sil'] },
  { key: 'depo',   label: 'Depolar', islemler: ['goruntule', 'ekle', 'duzenle', 'sil'] },
  { key: 'sayim',        label: 'Sayım',          islemler: ['goruntule', 'ekle', 'duzenle', 'sil'] },
  { key: 'toplam_sayim', label: 'Toplam Sayımlar', islemler: ['goruntule', 'ekle', 'duzenle', 'sil'] },
];

const ISLEM_LABELS = {
  goruntule: 'Görüntüle',
  ekle:      'Ekle',
  duzenle:   'Düzenle',
  sil:       'Sil',
};

/* ── Yetki Editörü Bileşeni ── */
function YetkiEditor({ isletme, yetkiler, onChange }) {
  const [acik, setAcik] = useState(false);

  const toggleYetki = (kat, islem) => {
    onChange({
      ...yetkiler,
      [kat]: {
        ...(yetkiler[kat] || {}),
        [islem]: !yetkiler[kat]?.[islem],
      },
    });
  };

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={() => setAcik(v => !v)}
        className="w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold bg-gray-50 hover:bg-gray-100 transition-colors text-left"
      >
        <Building2 className="w-4 h-4 text-indigo-500 flex-shrink-0" />
        <span className="flex-1 truncate text-gray-700">{isletme.ad}</span>
        {isletme.kod && (
          <span className="text-[10px] font-mono text-gray-400 bg-white px-1.5 py-0.5 rounded border border-gray-200 flex-shrink-0">
            {isletme.kod}
          </span>
        )}
        <ChevronDown className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform ${acik ? 'rotate-180' : ''}`} />
      </button>

      {acik && (
        <div className="px-4 py-3 space-y-3 border-t border-gray-100">
          {KATEGORILER.map(kat => (
            <div key={kat.key}>
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-2">{kat.label}</p>
              <div className="flex flex-wrap gap-2">
                {kat.islemler.map(islem => {
                  const aktif = yetkiler[kat.key]?.[islem] ?? false;
                  return (
                    <button
                      key={islem}
                      type="button"
                      onClick={() => toggleYetki(kat.key, islem)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all"
                      style={aktif
                        ? { background: '#EEF2FF', borderColor: 'rgba(99,102,241,0.4)', color: '#4F46E5' }
                        : { background: '#F9FAFB', borderColor: '#E5E7EB', color: '#9CA3AF' }
                      }
                    >
                      <div className={`w-3.5 h-3.5 rounded-sm border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                        aktif ? 'bg-indigo-500 border-indigo-500' : 'border-gray-300'
                      }`}>
                        {aktif && <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />}
                      </div>
                      {ISLEM_LABELS[islem]}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const GRAD = {
  indigo: 'linear-gradient(135deg,#6366F1,#8B5CF6)',
  blue:   'linear-gradient(135deg,#0EA5E9,#2563EB)',
  green:  'linear-gradient(135deg,#10B981,#059669)',
  amber:  'linear-gradient(135deg,#F59E0B,#D97706)',
};
const AVT_COLORS = ['#6366F1','#0EA5E9','#10B981','#F59E0B','#EF4444','#EC4899','#8B5CF6','#14B8A6'];
const getInitials = n => n ? n.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) : '??';
const getAvatarColor = n => {
  if (!n) return AVT_COLORS[0];
  let h = 0;
  for (let i = 0; i < n.length; i++) h = n.charCodeAt(i) + ((h << 5) - h);
  return AVT_COLORS[Math.abs(h) % AVT_COLORS.length];
};

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

/* ── Çoklu İşletme Filtresi ── */
function IsletmeFiltre({ isletmeler, secili, onChange }) {
  const [acik, setAcik] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = e => { if (ref.current && !ref.current.contains(e.target)) setAcik(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const toggle  = id => onChange(secili.includes(id) ? secili.filter(s => s !== id) : [...secili, id]);
  const temizle = e  => { e.stopPropagation(); onChange([]); };

  const label = secili.length === 0
    ? 'Tüm İşletmeler'
    : secili.length === 1
      ? isletmeler.find(i => i.id === secili[0])?.ad || '1 İşletme'
      : `${secili.length} İşletme Seçili`;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setAcik(v => !v)}
        className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl border bg-white text-sm font-medium transition-colors min-w-[180px]"
        style={{
          borderColor: secili.length > 0 ? '#6366F1' : '#E5E7EB',
          color: secili.length > 0 ? '#6366F1' : '#374151',
        }}
      >
        <Building2 className="w-4 h-4 flex-shrink-0" />
        <span className="flex-1 text-left truncate">{label}</span>
        {secili.length > 0 ? (
          <X className="w-3.5 h-3.5 flex-shrink-0 hover:text-red-500 transition-colors" onClick={temizle} />
        ) : (
          <ChevronDown className={`w-4 h-4 flex-shrink-0 transition-transform ${acik ? 'rotate-180' : ''}`} />
        )}
      </button>

      {acik && (
        <div className="absolute top-full left-0 mt-1.5 bg-white rounded-2xl shadow-xl border border-gray-100 z-20 py-2 min-w-[220px] max-h-64 overflow-y-auto">
          <button
            onClick={() => onChange(secili.length === isletmeler.length ? [] : isletmeler.map(i => i.id))}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-semibold hover:bg-gray-50 transition-colors text-gray-600 border-b border-gray-100 mb-1"
          >
            <div className={`w-[18px] h-[18px] rounded flex items-center justify-center border-2 flex-shrink-0 transition-colors ${
              secili.length === isletmeler.length ? 'border-indigo-500 bg-indigo-500' : 'border-gray-300'
            }`}>
              {secili.length === isletmeler.length && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
            </div>
            Tümünü Seç
          </button>
          {isletmeler.map(i => {
            const aktif = secili.includes(i.id);
            return (
              <button key={i.id} onClick={() => toggle(i.id)}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors">
                <div className={`w-[18px] h-[18px] rounded flex items-center justify-center border-2 flex-shrink-0 transition-colors ${
                  aktif ? 'border-indigo-500 bg-indigo-500' : 'border-gray-300'
                }`}>
                  {aktif && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                </div>
                <span className={`flex-1 text-left truncate ${aktif ? 'font-semibold text-gray-900' : 'text-gray-600'}`}>{i.ad}</span>
                {i.kod && <span className="text-xs font-mono text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">{i.kod}</span>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ── İşletme Listesi (kart içi, popover) ── */
function IsletmeListesi({ isletmeler, acik, onToggle }) {
  const ref = useRef(null);

  useEffect(() => {
    if (!acik) return;
    const handler = e => { if (ref.current && !ref.current.contains(e.target)) onToggle(); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [acik]);

  if (!isletmeler || isletmeler.length === 0) {
    return <p className="text-xs text-gray-400 italic">İşletme atanmamış</p>;
  }

  if (isletmeler.length === 1) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full"
        style={{ background: '#EEF2FF', color: '#6366F1' }}>
        <Building2 className="w-3 h-3" />
        {isletmeler[0].ad}
        {isletmeler[0].kod && (
          <span className="text-[10px] font-mono opacity-60 ml-0.5">{isletmeler[0].kod}</span>
        )}
      </span>
    );
  }

  // Birden fazla — ⓘ butonu + popover (layout'u bozmaz)
  return (
    <div ref={ref} className="relative inline-flex items-center gap-1.5">
      <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full"
        style={{ background: '#EEF2FF', color: '#6366F1' }}>
        <Building2 className="w-3 h-3" />
        {isletmeler.length} işletme
      </span>
      <button
        onClick={onToggle}
        className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold transition-colors flex-shrink-0"
        style={acik
          ? { background: '#6366F1', color: 'white' }
          : { background: '#E0E7FF', color: '#6366F1' }}
        title="İşletmeleri göster"
      >
        i
      </button>

      {acik && (
        <div className="absolute bottom-full left-0 mb-2 z-30 bg-white rounded-xl shadow-xl border border-gray-100 py-2 min-w-[180px]">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide px-3 pb-1.5">İşletmeler</p>
          {isletmeler.map(ist => (
            <div key={ist.id} className="flex items-center gap-2 px-3 py-1.5">
              <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: '#6366F1' }} />
              <span className="text-xs font-medium text-gray-700 truncate flex-1">{ist.ad}</span>
              {ist.kod && (
                <span className="text-[10px] font-mono text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded flex-shrink-0">
                  {ist.kod}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const LIMIT = 50;

export default function KullanicilarPage() {
  const [kullanicilar,   setKullanicilar]   = useState([]);
  const [isletmeler,     setIsletmeler]     = useState([]);   // filtre için tüm işletmeler
  const [loading,        setLoading]        = useState(true);
  const [modalOpen,      setModalOpen]      = useState(false);
  const [filtre,         setFiltre]         = useState('Tümü');
  const [aktifFiltre,    setAktifFiltre]    = useState('tumu'); // 'tumu' | 'aktif' | 'pasif'
  const [geriAlKullanici, setGeriAlKullanici] = useState(null);
  const [search,         setSearch]         = useState('');
  const [aramaDebounce,  setAramaDebounce]  = useState('');
  const [seciliIsletmeler, setSeciliIsletmeler] = useState([]);
  const [sayfa,          setSayfa]          = useState(1);
  const [toplam,         setToplam]         = useState(0);
  const [form, setForm] = useState({ ad_soyad: '', email: '', sifre: '', rol: 'kullanici', telefon: '' });
  const [saving, setSaving] = useState(false);
  const [pasifOnay, setPasifOnay] = useState(null);   // { id, ad_soyad }
  const [pasifIsleniyor, setPasifIsleniyor] = useState(false);
  const [aktifOnay, setAktifOnay] = useState(null);   // { id, ad_soyad }
  const [aktifIsleniyor, setAktifIsleniyor] = useState(false);
  const [duzenleKul, setDuzenleKul] = useState(null); // düzenlenen kullanıcı
  const [duzenleForm, setDuzenleForm] = useState({ ad_soyad: '', email: '', telefon: '', rol: 'kullanici', yeni_sifre: '', isletmeler: [] });
  const [duzenleKayit,  setDuzenleKayit]  = useState(false);
  const [rollerList,    setRollerList]    = useState([]);
  const [duzenleRolId,  setDuzenleRolId]  = useState(null);
  const [isletmeArama,       setIsletmeArama]       = useState('');
  const [isletmeDropdownAcik, setIsletmeDropdownAcik] = useState(false);
  const isletmeInputRef = useRef(null);
  const [acikIsletmeId, setAcikIsletmeId] = useState(null);
  const [goruntuleKul, setGoruntuleKul] = useState(null); // pasif kullanıcı salt okunur popup

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => { setAramaDebounce(search); setSayfa(1); }, 350);
    return () => clearTimeout(t);
  }, [search]);

  // İşletmeleri bir kez yükle
  useEffect(() => {
    api.get('/isletmeler').then(r => setIsletmeler(r.data || []));
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const p = new URLSearchParams({ sayfa, limit: LIMIT });
      if (aramaDebounce) p.set('q', aramaDebounce);
      if (filtre === 'Admin')    p.set('rol', 'admin');
      if (filtre === 'Kullanıcı') p.set('rol', 'kullanici');
      if (aktifFiltre === 'aktif') p.set('filtre', 'Aktif');
      else if (aktifFiltre === 'pasif') p.set('filtre', 'Pasif');
      const { data } = await api.get(`/kullanicilar?${p}`);
      setKullanicilar(data.data || []);
      setToplam(data.toplam || 0);
    } catch {
      toast.error('Veriler yüklenemedi.');
    } finally {
      setLoading(false);
    }
  }, [sayfa, aramaDebounce, filtre, aktifFiltre]);

  useEffect(() => { load(); }, [load]);

  const handleFiltre = (f) => { setFiltre(f); setSayfa(1); };

  const handleGeriAl = async () => {
    if (!geriAlKullanici) return;
    try {
      await api.put(`/kullanicilar/${geriAlKullanici.id}/restore`);
      toast.success('Kullanıcı geri alındı.');
      setGeriAlKullanici(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.hata || 'Geri alma başarısız.');
    }
  };

  const handleSave = async e => {
    e.preventDefault();
    if (!form.sifre || form.sifre.length < 8) {
      toast.error('Şifre en az 8 karakter olmalıdır.');
      return;
    }
    setSaving(true);
    try {
      await api.post('/kullanicilar', form);
      toast.success('Kullanıcı oluşturuldu.');
      setModalOpen(false);
      setForm({ ad_soyad: '', email: '', sifre: '', rol: 'kullanici', telefon: '' });
      load();
    } catch (err) { toast.error(err.response?.data?.hata || 'Hata.'); }
    finally { setSaving(false); }
  };

  const handleAktif = async () => {
    if (!aktifOnay) return;
    setAktifIsleniyor(true);
    try {
      await api.put(`/kullanicilar/${aktifOnay.id}`, { aktif: true });
      toast.success('Kullanıcı aktife alındı.');
      setAktifOnay(null);
      load();
    } catch { toast.error('İşlem başarısız.'); }
    finally { setAktifIsleniyor(false); }
  };

  const handleDuzenleAc = async (k) => {
    setIsletmeArama('');
    setIsletmeDropdownAcik(false);
    setDuzenleKul(k);
    setDuzenleForm({
      ad_soyad:   k.ad_soyad || '',
      email:      k.email    || '',
      telefon:    k.telefon  || '',
      rol:        k.rol      || 'kullanici',
      yeni_sifre: '',
      isletmeler: (k.isletmeler || []).map(i => i.id),
    });

    // Kullanıcının mevcut rol_id'sini ilk işletmeden al
    const ilkIstId = (k.isletmeler || [])[0]?.id;
    let mevcutRolId = null;
    if (ilkIstId) {
      try {
        const { data } = await api.get(`/kullanicilar/${k.id}/yetkiler?isletme_id=${ilkIstId}`);
        mevcutRolId = data?.rol_id || null;
      } catch { /* ignore */ }
    }
    setDuzenleRolId(mevcutRolId);

    try {
      const { data: rList } = await api.get('/roller');
      setRollerList(rList || []);
    } catch {
      setRollerList([]);
    }
  };

  const handleDuzenleKaydet = async () => {
    if (duzenleForm.yeni_sifre.trim() && duzenleForm.yeni_sifre.trim().length < 8) {
      toast.error('Şifre en az 8 karakter olmalıdır.');
      return;
    }
    setDuzenleKayit(true);
    try {
      // 1) Temel bilgileri güncelle
      const payload = {
        ad_soyad: duzenleForm.ad_soyad,
        email:    duzenleForm.email,
        telefon:  duzenleForm.telefon,
        rol:      duzenleForm.rol,
      };
      if (duzenleForm.yeni_sifre.trim()) payload.sifre = duzenleForm.yeni_sifre.trim();
      await api.put(`/kullanicilar/${duzenleKul.id}`, payload);

      // 2) İşletme atamalarını senkronize et
      const eskiIds = (duzenleKul.isletmeler || []).map(i => i.id);
      const yeniIds = duzenleForm.isletmeler;

      const eklenecek  = yeniIds.filter(id => !eskiIds.includes(id));
      const cikarilacak = eskiIds.filter(id => !yeniIds.includes(id));

      await Promise.all([
        ...eklenecek.map(id  => api.post(`/kullanicilar/${duzenleKul.id}/isletme`, { isletme_id: id })),
        ...cikarilacak.map(id => api.delete(`/kullanicilar/${duzenleKul.id}/isletme/${id}`)),
      ]);

      // 3) Rol → yetkiler tüm işletmelere kaydet
      if (duzenleForm.rol !== 'admin' && yeniIds.length > 0) {
        const secRol = duzenleRolId
          ? rollerList.find(r => String(r.id) === String(duzenleRolId))
          : null;
        // Rol seçilmediyse → tüm yetkiler kapalı (rolsüz kullanıcı)
        const bosYetkiler = {
          urun:         { goruntule: false, ekle: false, duzenle: false, sil: false },
          depo:         { goruntule: false, ekle: false, duzenle: false, sil: false },
          sayim:        { goruntule: false, ekle: false, duzenle: false, sil: false },
          toplam_sayim: { goruntule: false, ekle: false, duzenle: false, sil: false },
        };
        const yetkiler = secRol
          ? JSON.parse(JSON.stringify(secRol.yetkiler))
          : bosYetkiler;
        await Promise.all(
          yeniIds.map(id => api.put(`/kullanicilar/${duzenleKul.id}/yetkiler`, {
            isletme_id: id,
            yetkiler,
            rol_id: duzenleRolId || null,
          }))
        );
      }

      toast.success('Kullanıcı güncellendi.');
      setDuzenleKul(null);
      load();
    } catch { toast.error('Güncelleme başarısız.'); }
    finally { setDuzenleKayit(false); }
  };

  const handleDeact = async () => {
    if (!pasifOnay) return;
    setPasifIsleniyor(true);
    try {
      await api.delete(`/kullanicilar/${pasifOnay.id}`);
      toast.success('Kullanıcı pasife alındı.');
      setPasifOnay(null);
      load();
    } catch { toast.error('İşlem başarısız.'); }
    finally { setPasifIsleniyor(false); }
  };

  // İşletme filtresi sadece mevcut sayfaya uygulanır (search + rol sunucu tarafında)
  const filtered = seciliIsletmeler.length === 0
    ? kullanicilar
    : kullanicilar.filter(k =>
        (k.isletmeler || []).some(i => seciliIsletmeler.includes(i.id))
      );

  const sayfaSayisi = Math.max(1, Math.ceil(toplam / LIMIT));

  return (
    <div className="flex flex-col h-full">
      <PageHeader title="Kullanıcı Yönetimi" stats={[
        { icon: Users,      label: 'Toplam', value: toplam,             color: GRAD.indigo },
        { icon: ShieldCheck, label: 'Admin', value: filtre === 'Admin' ? toplam : undefined,    color: GRAD.amber },
        { icon: UserCheck,  label: 'Aktif',  value: kullanicilar.filter(k => k.aktif).length,  color: GRAD.green },
      ]} />

      <div className="p-6 lg:p-8 flex-1 space-y-5">

        {/* ── Toolbar ── */}
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">

          {/* Arama */}
          <div className="relative flex-1 min-w-[180px] w-full sm:w-auto">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" placeholder="Kullanıcı ara..." value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-gray-200 bg-white outline-none focus:border-indigo-400" />
          </div>

          {/* İşletme filtresi */}
          <IsletmeFiltre
            isletmeler={isletmeler}
            secili={seciliIsletmeler}
            onChange={setSeciliIsletmeler}
          />

          {/* Rol filtresi */}
          <div className="flex bg-white rounded-xl border border-gray-200 p-1 flex-shrink-0">
            {['Tümü', 'Admin', 'Kullanıcı'].map(f => (
              <button key={f} onClick={() => handleFiltre(f)}
                className="px-4 py-1.5 rounded-lg text-sm font-medium transition-all"
                style={filtre === f ? { background: '#6366F1', color: 'white' } : { color: '#94A3B8' }}>
                {f}
              </button>
            ))}
          </div>

          {/* Aktif/Pasif filtre */}
          <div className="flex bg-white rounded-xl border border-gray-200 p-1 flex-shrink-0">
            {[{ k: 'tumu', l: 'Tümü' }, { k: 'aktif', l: 'Aktif' }, { k: 'pasif', l: 'Pasif' }].map(f => (
              <button key={f.k} onClick={() => { setAktifFiltre(f.k); setSayfa(1); }}
                className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all"
                style={aktifFiltre === f.k ? { background: '#10B981', color: 'white' } : { color: '#94A3B8' }}>
                {f.l}
              </button>
            ))}
          </div>

          {/* Yeni Kullanıcı */}
          <button onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white shadow-sm flex-shrink-0"
            style={{ background: GRAD.green }}>
            <Plus className="w-4 h-4" />Yeni Kullanıcı
          </button>
        </div>

        {/* ── Liste ── */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
            {[1, 2, 3, 4].map(i => <div key={i} className="h-28 bg-white rounded-xl animate-pulse" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl p-16 text-center border border-gray-100">
            <Users className="w-12 h-12 mx-auto mb-3 text-gray-200" />
            <p className="text-gray-400 font-medium">Kullanıcı bulunamadı.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
            {filtered.map(k => {
              const isAdmin = k.rol === 'admin';
              const rolAdi = !isAdmin && (k.isletmeler || []).length > 0
                ? k.isletmeler[0].atanan_rol_adi || null
                : null;
              return (
                <div key={k.id} onClick={() => !k.aktif && setGoruntuleKul(k)} className={`rounded-xl px-3 py-2.5 border transition-all flex flex-col gap-1.5 ${k.aktif ? 'bg-white border-gray-100 hover:border-indigo-100 hover:shadow-sm' : 'bg-red-50 border-red-200 opacity-75 cursor-pointer hover:border-red-300'}`}>

                  {/* ── Üst: Avatar + İsim + Butonlar ── */}
                  <div className="flex items-center gap-2">
                    <div className="relative flex-shrink-0">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs"
                        style={{ background: getAvatarColor(k.ad_soyad) }}>
                        {getInitials(k.ad_soyad)}
                      </div>
                      {isAdmin && (
                        <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center"
                          style={{ background: '#F59E0B' }}>
                          <ShieldCheck className="w-2.5 h-2.5 text-white" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1 flex flex-col gap-0.5">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <h3 className={`font-semibold text-sm leading-tight truncate ${k.aktif ? 'text-gray-900' : 'text-red-600'}`}>{k.ad_soyad}</h3>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0"
                          style={k.aktif ? { background: '#DCFCE7', color: '#16A34A' } : { background: '#FEE2E2', color: '#DC2626' }}>
                          {k.aktif ? 'Aktif' : 'Pasif'}
                        </span>
                      </div>
                      <div>
                        {isAdmin ? (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold"
                            style={{ background: '#FEF9C3', color: '#A16207' }}>
                            <ShieldCheck className="w-2.5 h-2.5" />Admin
                          </span>
                        ) : rolAdi ? (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold"
                            style={{ background: '#F0F9FF', color: '#0369A1' }}>
                            <Shield className="w-2.5 h-2.5" />{rolAdi}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold"
                            style={{ background: '#EEF2FF', color: '#6366F1' }}>
                            <ShieldCheck className="w-2.5 h-2.5" />Kullanıcı
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      {k.aktif && (
                        <button onClick={() => handleDuzenleAc(k)}
                          className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-indigo-100 transition-colors"
                          style={{ background: '#EEF2FF' }} title="Düzenle">
                          <Pencil className="w-3.5 h-3.5" style={{ color: '#6366F1' }} />
                        </button>
                      )}
                      {k.aktif ? (
                        <button onClick={() => setPasifOnay({ id: k.id, ad_soyad: k.ad_soyad })}
                          className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-100 transition-colors"
                          style={{ background: '#FEF2F2' }} title="Pasifleştir">
                          <Power className="w-3.5 h-3.5" style={{ color: '#EF4444' }} />
                        </button>
                      ) : (
                        <button onClick={() => setGeriAlKullanici(k)}
                          className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-green-100 transition-colors"
                          style={{ background: '#DCFCE7' }} title="Geri Al">
                          <RotateCcw className="w-3.5 h-3.5" style={{ color: '#16A34A' }} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* ── İşletmeler ── */}
                  <IsletmeListesi
                    isletmeler={k.isletmeler}
                    acik={acikIsletmeId === k.id}
                    onToggle={() => setAcikIsletmeId(v => v === k.id ? null : k.id)}
                  />
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

      {/* ── Pasife Al Onay Modalı ── */}
      {pasifOnay && (
        <div
          className="fixed inset-0 z-50 flex flex-col justify-end sm:items-center sm:justify-center"
          style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(2px)' }}
          onClick={e => e.target === e.currentTarget && setPasifOnay(null)}
        >
          <div className="bg-white w-full sm:max-w-md sm:rounded-3xl rounded-t-3xl shadow-2xl overflow-hidden">
            {/* Kırmızı üst bant */}
            <div className="h-1.5 w-full" style={{ background: 'linear-gradient(90deg,#EF4444,#DC2626)' }} />

            {/* Drag handle (mobil) */}
            <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mt-4 sm:hidden" />

            {/* İkon + Başlık */}
            <div className="flex flex-col items-center pt-6 pb-4 px-6">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
                style={{ background: '#FEF2F2' }}>
                <Power className="w-8 h-8 text-red-500" />
              </div>
              <h3 className="text-lg font-black text-gray-900 mb-1">Kullanıcıyı Pasife Al</h3>

              {/* Kullanıcı adı chip */}
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full mb-5"
                style={{ background: '#F3F4F6' }}>
                <div className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] font-black"
                  style={{ background: getAvatarColor(pasifOnay.ad_soyad) }}>
                  {getInitials(pasifOnay.ad_soyad)}
                </div>
                <span className="text-sm font-bold text-gray-700">{pasifOnay.ad_soyad}</span>
              </div>

              {/* Uyarı kutusu */}
              <div className="w-full rounded-2xl p-4 mb-2"
                style={{ background: '#FEF2F2', border: '1px solid #FECACA' }}>
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-red-700">Bu işlemin sonuçları:</p>
                    <ul className="text-xs text-red-600 space-y-0.5">
                      <li>• Kullanıcı sisteme giriş yapamaz</li>
                      <li>• Mevcut oturumu anında sonlandırılır</li>
                      <li>• Tüm yetkiler askıya alınır</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Butonlar */}
            <div className="grid grid-cols-2 gap-3 px-6 pb-8 sm:pb-6">
              <button
                onClick={() => setPasifOnay(null)}
                className="py-3.5 rounded-2xl font-bold text-sm transition-colors"
                style={{ background: '#F3F4F6', color: '#6B7280' }}
              >
                Vazgeç
              </button>
              <button
                onClick={handleDeact}
                disabled={pasifIsleniyor}
                className="py-3.5 rounded-2xl font-bold text-sm text-white flex items-center justify-center gap-2 transition-opacity disabled:opacity-70"
                style={{ background: 'linear-gradient(135deg,#EF4444,#DC2626)' }}
              >
                {pasifIsleniyor && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                Evet, Pasife Al
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Aktife Al Onay Modalı ── */}
      {aktifOnay && (
        <div
          className="fixed inset-0 z-50 flex flex-col justify-end sm:items-center sm:justify-center"
          style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(2px)' }}
          onClick={e => e.target === e.currentTarget && setAktifOnay(null)}
        >
          <div className="bg-white w-full sm:max-w-md sm:rounded-3xl rounded-t-3xl shadow-2xl overflow-hidden">
            {/* Yeşil üst bant */}
            <div className="h-1.5 w-full" style={{ background: 'linear-gradient(90deg,#22C55E,#16A34A)' }} />

            {/* Drag handle (mobil) */}
            <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mt-4 sm:hidden" />

            {/* İkon + Başlık */}
            <div className="flex flex-col items-center pt-6 pb-4 px-6">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
                style={{ background: '#F0FDF4' }}>
                <Power className="w-8 h-8" style={{ color: '#16A34A' }} />
              </div>
              <h3 className="text-lg font-black text-gray-900 mb-1">Kullanıcıyı Aktife Al</h3>

              {/* Kullanıcı adı chip */}
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full mb-5"
                style={{ background: '#F3F4F6' }}>
                <div className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] font-black"
                  style={{ background: getAvatarColor(aktifOnay.ad_soyad) }}>
                  {getInitials(aktifOnay.ad_soyad)}
                </div>
                <span className="text-sm font-bold text-gray-700">{aktifOnay.ad_soyad}</span>
              </div>

              {/* Bilgi kutusu */}
              <div className="w-full rounded-2xl p-4 mb-2"
                style={{ background: '#F0FDF4', border: '1px solid #BBF7D0' }}>
                <div className="flex items-start gap-3">
                  <UserCheck className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: '#16A34A' }} />
                  <div className="space-y-1">
                    <p className="text-xs font-bold" style={{ color: '#15803D' }}>Aktife alınca ne olur?</p>
                    <ul className="text-xs space-y-0.5" style={{ color: '#166534' }}>
                      <li>• Kullanıcı sisteme tekrar giriş yapabilir</li>
                      <li>• Tüm yetkileri yeniden devreye girer</li>
                      <li>• Hesap engeli kaldırılır</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Butonlar */}
            <div className="grid grid-cols-2 gap-3 px-6 pb-8 sm:pb-6">
              <button
                onClick={() => setAktifOnay(null)}
                className="py-3.5 rounded-2xl font-bold text-sm transition-colors"
                style={{ background: '#F3F4F6', color: '#6B7280' }}
              >
                Vazgeç
              </button>
              <button
                onClick={handleAktif}
                disabled={aktifIsleniyor}
                className="py-3.5 rounded-2xl font-bold text-sm text-white flex items-center justify-center gap-2 transition-opacity disabled:opacity-70"
                style={{ background: 'linear-gradient(135deg,#22C55E,#16A34A)' }}
              >
                {aktifIsleniyor && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                Evet, Aktife Al
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Yeni Kullanıcı Modalı ── */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setModalOpen(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: GRAD.green }}>
                <Users className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Yeni Kullanıcı</h3>
            </div>
            <form onSubmit={handleSave} className="space-y-4">
              {[
                { l: 'Ad Soyad *', k: 'ad_soyad', t: 'text'     },
                { l: 'E-posta *',  k: 'email',    t: 'email'    },
                { l: 'Şifre *',    k: 'sifre',    t: 'password', min: 8 },
                { l: 'Telefon',    k: 'telefon',  t: 'tel'      },
              ].map(f => (
                <div key={f.k}>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">{f.l}</label>
                  <input type={f.t} value={form[f.k]} required={f.l.includes('*')}
                    minLength={f.min || undefined}
                    onChange={e => setForm({ ...form, [f.k]: e.target.value })}
                    className="w-full px-4 py-2.5 text-sm rounded-xl border border-gray-200 outline-none focus:border-indigo-400 bg-gray-50" />
                  {f.min && <p className="text-[10px] text-gray-400 mt-1">En az {f.min} karakter</p>}
                </div>
              ))}
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Rol</label>
                <select value={form.rol} onChange={e => setForm({ ...form, rol: e.target.value })}
                  className="w-full px-4 py-2.5 text-sm rounded-xl border border-gray-200 outline-none bg-gray-50">
                  <option value="kullanici">Kullanıcı</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setModalOpen(false)}
                  className="flex-1 py-3 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50">
                  İptal
                </button>
                <button type="submit" disabled={saving}
                  className="flex-1 py-3 rounded-xl text-sm font-bold text-white"
                  style={{ background: GRAD.green }}>
                  {saving ? 'Oluşturuluyor...' : 'Oluştur'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Kullanıcı Düzenle Modalı ── */}
      {duzenleKul && (
        <div
          className="fixed inset-0 z-50 flex flex-col justify-end sm:items-center sm:justify-center"
          style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(2px)' }}
          onClick={e => e.target === e.currentTarget && setDuzenleKul(null)}
        >
          <div className="bg-white w-full sm:max-w-lg sm:rounded-3xl rounded-t-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Mor üst bant */}
            <div className="h-1.5 w-full flex-shrink-0" style={{ background: 'linear-gradient(90deg,#6366F1,#8B5CF6)' }} />

            {/* Drag handle (mobil) */}
            <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mt-4 sm:hidden flex-shrink-0" />

            {/* Başlık */}
            <div className="flex items-center gap-3 px-6 pt-5 pb-4 flex-shrink-0">
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                style={{ background: getAvatarColor(duzenleKul.ad_soyad) }}>
                {getInitials(duzenleKul.ad_soyad)}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-black text-gray-900 leading-tight truncate">{duzenleKul.ad_soyad}</h3>
                <p className="text-xs text-gray-400 truncate">{duzenleKul.email}</p>
              </div>
              <button onClick={() => setDuzenleKul(null)}
                className="w-8 h-8 rounded-full flex items-center justify-center bg-gray-100 text-gray-500 font-bold text-sm flex-shrink-0">
                ✕
              </button>
            </div>

            {/* Form alanları */}
            <div className="overflow-y-auto flex-1 px-6 pb-2 space-y-4">

              {/* Ad Soyad */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Ad Soyad</label>
                <input
                  type="text"
                  value={duzenleForm.ad_soyad}
                  onChange={e => setDuzenleForm(f => ({ ...f, ad_soyad: e.target.value }))}
                  className="w-full px-4 py-2.5 text-sm rounded-xl border border-gray-200 outline-none focus:border-indigo-400 bg-gray-50"
                />
              </div>

              {/* E-posta */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">E-posta</label>
                <input
                  type="email"
                  value={duzenleForm.email}
                  onChange={e => setDuzenleForm(f => ({ ...f, email: e.target.value }))}
                  className="w-full px-4 py-2.5 text-sm rounded-xl border border-gray-200 outline-none focus:border-indigo-400 bg-gray-50"
                />
              </div>

              {/* Telefon */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Telefon</label>
                <input
                  type="tel"
                  value={duzenleForm.telefon}
                  onChange={e => setDuzenleForm(f => ({ ...f, telefon: e.target.value }))}
                  className="w-full px-4 py-2.5 text-sm rounded-xl border border-gray-200 outline-none focus:border-indigo-400 bg-gray-50"
                />
              </div>

              {/* Yeni Şifre */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
                  Yeni Şifre <span className="normal-case font-normal text-gray-400">(boş bırakılırsa değişmez)</span>
                </label>
                <input
                  type="password"
                  value={duzenleForm.yeni_sifre}
                  onChange={e => setDuzenleForm(f => ({ ...f, yeni_sifre: e.target.value }))}
                  placeholder="••••••••"
                  className="w-full px-4 py-2.5 text-sm rounded-xl border border-gray-200 outline-none focus:border-indigo-400 bg-gray-50"
                />
              </div>

              {/* Rol */}
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Panel Erişimi</label>
                <div className="flex bg-gray-100 rounded-lg p-0.5 gap-0.5">
                  {[
                    { val: 'kullanici', label: 'Kullanıcı' },
                    { val: 'admin',     label: 'Admin'     },
                  ].map(r => (
                    <button
                      key={r.val}
                      type="button"
                      onClick={() => setDuzenleForm(f => ({ ...f, rol: r.val }))}
                      className="px-3 py-1 rounded-md text-xs font-semibold transition-all"
                      style={duzenleForm.rol === r.val
                        ? { background: '#6366F1', color: 'white' }
                        : { color: '#9CA3AF' }}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* İşletme Atamaları */}
              {isletmeler.length > 0 && (
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">İşletme Atamaları</label>

                  {/* Seçili işletmeler — chip'ler */}
                  <div className="flex flex-wrap gap-1.5 mb-2 min-h-[28px]">
                    {duzenleForm.isletmeler.length === 0 ? (
                      <span className="text-xs text-gray-400 italic self-center">Henüz atama yok</span>
                    ) : duzenleForm.isletmeler.map(id => {
                      const ist = isletmeler.find(i => i.id === id);
                      if (!ist) return null;
                      return (
                        <span key={id}
                          className="inline-flex items-center gap-1 pl-2.5 pr-1.5 py-1 rounded-lg text-xs font-semibold"
                          style={{ background: '#EEF2FF', border: '1px solid rgba(99,102,241,0.3)', color: '#4338CA' }}>
                          {ist.ad}
                          {ist.kod && <span className="text-indigo-300 text-[10px] ml-0.5">({ist.kod})</span>}
                          <button
                            type="button"
                            onClick={() => setDuzenleForm(f => ({ ...f, isletmeler: f.isletmeler.filter(i => i !== id) }))}
                            className="ml-0.5 w-4 h-4 rounded-full flex items-center justify-center hover:bg-indigo-200 transition-colors flex-shrink-0"
                          >
                            <X className="w-2.5 h-2.5" />
                          </button>
                        </span>
                      );
                    })}
                  </div>

                  {/* Arama + dropdown */}
                  {isletmeler.filter(i => !duzenleForm.isletmeler.includes(i.id)).length > 0 && (
                    <div className="relative">
                      <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus-within:border-indigo-400 transition-colors">
                        <Search className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                        <input
                          ref={isletmeInputRef}
                          type="text"
                          value={isletmeArama}
                          onChange={e => setIsletmeArama(e.target.value)}
                          onFocus={() => setIsletmeDropdownAcik(true)}
                          onBlur={() => setTimeout(() => setIsletmeDropdownAcik(false), 150)}
                          placeholder="İşletme ekle..."
                          className="flex-1 text-xs bg-transparent outline-none text-gray-700 placeholder-gray-400"
                        />
                      </div>

                      {isletmeDropdownAcik && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-20 max-h-44 overflow-y-auto">
                          {isletmeler
                            .filter(ist => !duzenleForm.isletmeler.includes(ist.id))
                            .filter(ist =>
                              !isletmeArama ||
                              ist.ad.toLowerCase().includes(isletmeArama.toLowerCase()) ||
                              ist.kod?.toLowerCase().includes(isletmeArama.toLowerCase())
                            )
                            .map(ist => (
                              <button key={ist.id} type="button"
                                onMouseDown={() => {
                                  setDuzenleForm(f => ({ ...f, isletmeler: [...f.isletmeler, ist.id] }));
                                  setIsletmeArama('');
                                  setIsletmeDropdownAcik(false);
                                }}
                                className="w-full flex items-center gap-2.5 px-3 py-2.5 hover:bg-indigo-50 text-left transition-colors first:rounded-t-xl last:rounded-b-xl">
                                <Building2 className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                                <span className="text-sm text-gray-700 flex-1 truncate">{ist.ad}</span>
                                {ist.kod && <span className="text-[10px] text-gray-400 font-mono flex-shrink-0">{ist.kod}</span>}
                              </button>
                            ))
                          }
                          {isletmeler
                            .filter(ist => !duzenleForm.isletmeler.includes(ist.id))
                            .filter(ist =>
                              !isletmeArama ||
                              ist.ad.toLowerCase().includes(isletmeArama.toLowerCase()) ||
                              ist.kod?.toLowerCase().includes(isletmeArama.toLowerCase())
                            ).length === 0 && (
                            <p className="px-4 py-3 text-xs text-gray-400 italic">Sonuç yok</p>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Rol Atama */}
              {duzenleForm.rol !== 'admin' && rollerList.length > 0 && (
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-indigo-400" />
                    Rol
                  </label>
                  <select
                    value={duzenleRolId || ''}
                    onChange={e => setDuzenleRolId(e.target.value || null)}
                    className="w-full text-sm px-3 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-700 outline-none focus:border-indigo-400 cursor-pointer"
                  >
                    <option value="">Rol seçilmedi</option>
                    {rollerList.map(r => (
                      <option key={r.id} value={r.id}>{r.ad}{r.sistem ? ' ★' : ''}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Kaydet / İptal */}
            <div className="grid grid-cols-2 gap-3 px-6 py-5 flex-shrink-0 border-t border-gray-100">
              <button
                onClick={() => setDuzenleKul(null)}
                className="py-3 rounded-2xl font-bold text-sm transition-colors"
                style={{ background: '#F3F4F6', color: '#6B7280' }}
              >
                İptal
              </button>
              <button
                onClick={handleDuzenleKaydet}
                disabled={duzenleKayit || !duzenleForm.ad_soyad.trim()}
                className="py-3 rounded-2xl font-bold text-sm text-white flex items-center justify-center gap-2 transition-opacity disabled:opacity-60"
                style={{ background: 'linear-gradient(135deg,#6366F1,#8B5CF6)' }}
              >
                {duzenleKayit
                  ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  : <Save className="w-4 h-4" />
                }
                Kaydet
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pasif Kullanıcı Bilgi Popup */}
      {goruntuleKul && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(3px)' }}
          onClick={() => setGoruntuleKul(null)}>
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden"
            onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="px-6 pt-5 pb-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm"
                  style={{ background: getAvatarColor(goruntuleKul.ad_soyad) }}>
                  {getInitials(goruntuleKul.ad_soyad)}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-gray-900 text-sm truncate">{goruntuleKul.ad_soyad}</h3>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                    style={{ background: '#FEE2E2', color: '#DC2626' }}>Pasif</span>
                </div>
                <button onClick={() => setGoruntuleKul(null)}
                  className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100">
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              </div>
            </div>
            {/* Bilgiler */}
            <div className="px-6 py-4 space-y-3">
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <span className="text-sm text-gray-700 truncate">{goruntuleKul.email || '—'}</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <span className="text-sm text-gray-700">{goruntuleKul.telefon || '—'}</span>
              </div>
              <div className="flex items-center gap-3">
                <Shield className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <span className="text-sm text-gray-700">
                  {goruntuleKul.rol === 'admin' ? 'Admin' : (goruntuleKul.isletmeler?.[0]?.atanan_rol_adi || 'Kullanıcı')}
                </span>
              </div>
              {(goruntuleKul.isletmeler || []).length > 0 && (
                <div className="flex items-start gap-3">
                  <Building2 className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-gray-700">
                    {goruntuleKul.isletmeler.map(i => (
                      <span key={i.id} className="inline-block mr-1.5 mb-1 px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-600">{i.ad}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
            {/* Alt — sadece Kapat + Geri Al */}
            <div className="grid grid-cols-2 gap-3 px-6 py-4 border-t border-gray-100">
              <button onClick={() => setGoruntuleKul(null)}
                className="py-2.5 rounded-xl font-bold text-sm text-gray-500 transition-colors"
                style={{ background: '#F3F4F6' }}>
                Kapat
              </button>
              <button onClick={() => { setGeriAlKullanici(goruntuleKul); setGoruntuleKul(null); }}
                className="py-2.5 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2"
                style={{ background: '#10B981' }}>
                <RotateCcw className="w-4 h-4" />Geri Al
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Geri Al Onay Modalı */}
      {geriAlKullanici && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(3px)' }}
          onClick={() => setGeriAlKullanici(null)}>
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden p-6"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: '#DCFCE7' }}>
                <RotateCcw className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="font-bold text-gray-900 text-sm">Kullanıcıyı Geri Al</p>
                <p className="text-xs text-gray-400">Bu kullanıcı tekrar aktif olacak</p>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-5">
              <span className="font-bold">{geriAlKullanici.ad_soyad}</span> geri alınacak. Devam etmek istiyor musunuz?
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => setGeriAlKullanici(null)}
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
