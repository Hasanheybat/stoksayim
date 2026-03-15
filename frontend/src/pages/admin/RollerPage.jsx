import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import {
  ShieldCheck, Users, Check, Save, RotateCcw,
  Crown, User, Lock, Unlock, Building2, Plus,
  Trash2, AlertTriangle, X, ChevronRight,
} from 'lucide-react';
import api from '../../lib/apiAdm';

/* ── Yetki sabitleri ── */
const FABRIKA_YETKILER = {
  urun:         { goruntule: true,  ekle: false, duzenle: false, sil: false },
  depo:         { goruntule: true,  ekle: false, duzenle: false, sil: false },
  sayim:        { goruntule: true,  ekle: true,  duzenle: false, sil: false },
  toplam_sayim: { goruntule: false, ekle: false, duzenle: false, sil: false },
};

const ADMIN_YETKILER = {
  urun:         { goruntule: true, ekle: true, duzenle: true, sil: true },
  depo:         { goruntule: true, ekle: true, duzenle: true, sil: true },
  sayim:        { goruntule: true, ekle: true, duzenle: true, sil: true },
  toplam_sayim: { goruntule: true, ekle: true, duzenle: true, sil: true },
};

const KATEGORILER = [
  { key: 'urun',         label: 'Ürünler',         islemler: ['goruntule', 'ekle', 'duzenle', 'sil'] },
  { key: 'depo',         label: 'Depolar',          islemler: ['goruntule', 'ekle', 'duzenle', 'sil'] },
  { key: 'sayim',        label: 'Sayım',            islemler: ['goruntule', 'ekle', 'duzenle', 'sil'] },
  { key: 'toplam_sayim', label: 'Toplam Sayımlar',  islemler: ['goruntule', 'ekle', 'duzenle', 'sil'] },
];

const ISLEM_LABELS = {
  goruntule: 'Görüntüle',
  ekle:      'Ekle',
  duzenle:   'Düzenle',
  sil:       'Sil',
};

/* ── Yetki özet sayısı ── */
function yetkiSayisi(yetkiler) {
  let aktif = 0, toplam = 0;
  for (const kat of KATEGORILER) {
    for (const islem of kat.islemler) {
      toplam++;
      if (yetkiler?.[kat.key]?.[islem]) aktif++;
    }
  }
  return { aktif, toplam };
}

/* ── Yetki Matrisi ── */
function YetkiMatrisi({ yetkiler, onChange, readonly = false }) {
  return (
    <div className="space-y-4">
      {KATEGORILER.map(kat => (
        <div key={kat.key}>
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">{kat.label}</p>
          <div className="flex flex-wrap gap-2">
            {kat.islemler.map(islem => {
              const aktif = yetkiler?.[kat.key]?.[islem] ?? false;
              return readonly ? (
                <span key={islem}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border"
                  style={aktif
                    ? { background: '#EEF2FF', borderColor: 'rgba(99,102,241,0.35)', color: '#4F46E5' }
                    : { background: '#F9FAFB', borderColor: '#E5E7EB', color: '#CBD5E1' }
                  }
                >
                  <div className={`w-3 h-3 rounded-sm border-2 flex items-center justify-center flex-shrink-0 ${aktif ? 'bg-indigo-500 border-indigo-500' : 'border-gray-300'}`}>
                    {aktif && <Check className="w-2 h-2 text-white" strokeWidth={3} />}
                  </div>
                  {ISLEM_LABELS[islem]}
                </span>
              ) : (
                <button key={islem} type="button"
                  onClick={() => onChange({ ...yetkiler, [kat.key]: { ...(yetkiler?.[kat.key] || {}), [islem]: !aktif } })}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all hover:shadow-sm active:scale-95"
                  style={aktif
                    ? { background: '#EEF2FF', borderColor: 'rgba(99,102,241,0.4)', color: '#4F46E5' }
                    : { background: '#F9FAFB', borderColor: '#E5E7EB', color: '#9CA3AF' }
                  }
                >
                  <div className={`w-3.5 h-3.5 rounded-sm border-2 flex items-center justify-center flex-shrink-0 transition-colors ${aktif ? 'bg-indigo-500 border-indigo-500' : 'border-gray-300'}`}>
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
  );
}

/* ── Mini Avatar ── */
function Avatar({ ad }) {
  const COLORS = ['#6366F1','#0EA5E9','#10B981','#F59E0B','#EF4444','#EC4899','#8B5CF6','#14B8A6'];
  const initials = ad ? ad.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) : '??';
  const color  = COLORS[Math.abs((ad?.charCodeAt(0) ?? 0) + (ad?.charCodeAt(1) ?? 0)) % COLORS.length];
  return (
    <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-black flex-shrink-0"
      style={{ background: color }}>
      {initials}
    </div>
  );
}

/* ── Rol Detay Modalı ── */
function RolDetayModal({ rol, kullanicilar, onClose, onSave, onDelete }) {
  const [yetkiler,  setYetkiler]  = useState(rol.yetkiler || {});
  const [degisti,   setDegisti]   = useState(false);
  const [kayit,     setKayit]     = useState(false);
  const [siliyor,   setSiliyor]   = useState(false);
  const [silOnay,   setSilOnay]   = useState(false);

  useEffect(() => { setYetkiler(rol.yetkiler || {}); setDegisti(false); }, [rol]);

  const isAdminRol = rol._admin === true; // hardcoded admin satırı
  const isReadonly = isAdminRol;

  const handleSave = async () => {
    setKayit(true);
    try {
      const { data } = await api.put(`/roller/${rol.id}`, { yetkiler });
      toast.success(`"${rol.ad}" yetkiler kaydedildi.`);
      onSave(data);
      setDegisti(false);
    } catch { toast.error('Kayıt başarısız.'); }
    finally { setKayit(false); }
  };

  const handleSil = async () => {
    setSiliyor(true);
    try {
      await api.delete(`/roller/${rol.id}`);
      toast.success(`"${rol.ad}" rolü silindi.`);
      onDelete(rol.id);
      onClose();
    } catch (err) { toast.error(err.response?.data?.hata || 'Silinemedi.'); }
    finally { setSiliyor(false); setSilOnay(false); }
  };

  const handleReset = () => {
    setYetkiler(JSON.parse(JSON.stringify(FABRIKA_YETKILER)));
    setDegisti(true);
    toast('Varsayılana sıfırlandı.', { icon: '↺' });
  };

  const bandColor = isAdminRol
    ? 'linear-gradient(90deg,#F59E0B,#D97706)'
    : rol.sistem
      ? 'linear-gradient(90deg,#6366F1,#8B5CF6)'
      : 'linear-gradient(90deg,#10B981,#059669)';

  const kulRol = isAdminRol
    ? kullanicilar.filter(k => k.rol === 'admin')
    : rol.sistem
      ? kullanicilar.filter(k => k.rol === 'kullanici')
      : [];

  const matrisYetkiler = isAdminRol ? ADMIN_YETKILER : yetkiler;

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end sm:items-center sm:justify-center"
      style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(2px)' }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white w-full sm:max-w-lg sm:rounded-3xl rounded-t-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">

        {/* Üst bant */}
        <div className="h-1.5 w-full flex-shrink-0" style={{ background: bandColor }} />

        {/* Drag handle (mobil) */}
        <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mt-4 sm:hidden flex-shrink-0" />

        {/* Başlık */}
        <div className="flex items-center gap-3 px-6 pt-5 pb-4 flex-shrink-0">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{ background: isAdminRol
              ? 'linear-gradient(135deg,#FEF9C3,#FDE68A)'
              : rol.sistem
                ? 'linear-gradient(135deg,#EEF2FF,#E0E7FF)'
                : 'linear-gradient(135deg,#DCFCE7,#BBF7D0)' }}>
            {isAdminRol
              ? <Crown className="w-5 h-5" style={{ color: '#A16207' }} />
              : rol.sistem
                ? <User className="w-5 h-5 text-indigo-600" />
                : <ShieldCheck className="w-5 h-5 text-emerald-600" />
            }
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-black text-gray-900 leading-tight">{rol.ad}</h3>
            <p className="text-xs text-gray-400 mt-0.5">
              {isAdminRol ? 'Sistem rolü • Değiştirilemez' : rol.sistem ? 'Sistem rolü' : 'Özel rol'}
            </p>
          </div>
          {/* Silme — özel rol */}
          {!rol.sistem && !isAdminRol && (
            silOnay ? (
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <button onClick={() => setSilOnay(false)}
                  className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-gray-100 text-gray-500">
                  Vazgeç
                </button>
                <button onClick={handleSil} disabled={siliyor}
                  className="px-2.5 py-1.5 rounded-lg text-xs font-bold text-white flex items-center gap-1"
                  style={{ background: '#EF4444' }}>
                  {siliyor
                    ? <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    : null}
                  Sil
                </button>
              </div>
            ) : (
              <button onClick={() => setSilOnay(true)}
                className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-red-50 transition-colors flex-shrink-0"
                title="Rolü sil">
                <Trash2 className="w-4 h-4 text-red-400" />
              </button>
            )
          )}
          {/* Admin kilit */}
          {isAdminRol && (
            <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: '#FEF9C3' }}>
              <Lock className="w-4 h-4" style={{ color: '#D97706' }} />
            </div>
          )}
          <button onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center bg-gray-100 text-gray-500 flex-shrink-0">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable içerik */}
        <div className="overflow-y-auto flex-1 px-6 pb-2 space-y-4">

          {/* Bilgi kutusu */}
          {isAdminRol && (
            <div className="rounded-xl p-3.5 flex items-start gap-3"
              style={{ background: '#FFFBEB', border: '1px solid #FDE68A' }}>
              <Lock className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: '#D97706' }} />
              <p className="text-xs leading-relaxed" style={{ color: '#92400E' }}>
                Admin rolü tüm işlemlere tam erişime sahiptir. Bu rol değiştirilemez ve silinemez.
              </p>
            </div>
          )}
          {!isAdminRol && rol.sistem && (
            <div className="rounded-xl p-3.5 flex items-start gap-3"
              style={{ background: '#EEF2FF', border: '1px solid rgba(99,102,241,0.2)' }}>
              <Unlock className="w-4 h-4 flex-shrink-0 mt-0.5 text-indigo-500" />
              <p className="text-xs leading-relaxed text-indigo-700">
                Sistem rolü — yetki matrisini düzenleyebilirsiniz. Ad değiştirilemez.
              </p>
            </div>
          )}
          {!isAdminRol && !rol.sistem && (
            <div className="rounded-xl p-3.5 flex items-start gap-3"
              style={{ background: '#F0FDF4', border: '1px solid #BBF7D0' }}>
              <ShieldCheck className="w-4 h-4 flex-shrink-0 mt-0.5 text-emerald-600" />
              <p className="text-xs leading-relaxed text-emerald-700">
                Özel rol — yetki matrisini ve adını düzenleyebilirsiniz.
              </p>
            </div>
          )}

          {/* Yetki Matrisi */}
          <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
            <YetkiMatrisi
              yetkiler={matrisYetkiler}
              onChange={(yeni) => { setYetkiler(yeni); setDegisti(true); }}
              readonly={isReadonly}
            />
          </div>

          {/* Kullanıcı listesi */}
          {kulRol.length > 0 && (
            <div>
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" /> Bu Roldeki Kullanıcılar
              </p>
              <div className="space-y-1.5 max-h-36 overflow-y-auto">
                {kulRol.map(k => (
                  <div key={k.id} className="flex items-center gap-2.5 p-2 rounded-xl bg-gray-50">
                    <Avatar ad={k.ad_soyad} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-800 truncate">{k.ad_soyad}</p>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0"
                      style={{ background: k.aktif ? '#DCFCE7' : '#FEE2E2', color: k.aktif ? '#15803D' : '#DC2626' }}>
                      {k.aktif ? 'Aktif' : 'Pasif'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer butonları */}
        {!isReadonly && (
          <div className="grid grid-cols-2 gap-3 px-6 py-5 flex-shrink-0 border-t border-gray-100">
            {!rol.sistem ? (
              <button onClick={handleReset}
                className="flex items-center justify-center gap-1.5 py-3 rounded-2xl text-sm font-semibold"
                style={{ background: '#F3F4F6', color: '#6B7280' }}>
                <RotateCcw className="w-3.5 h-3.5" /> Sıfırla
              </button>
            ) : (
              <button onClick={onClose}
                className="py-3 rounded-2xl font-bold text-sm"
                style={{ background: '#F3F4F6', color: '#6B7280' }}>
                Kapat
              </button>
            )}
            <button onClick={handleSave} disabled={kayit || !degisti}
              className="flex items-center justify-center gap-1.5 py-3 rounded-2xl text-sm font-bold text-white transition-all disabled:opacity-50"
              style={{ background: degisti ? 'linear-gradient(135deg,#6366F1,#8B5CF6)' : '#D1D5DB' }}>
              {kayit
                ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                : <Save className="w-4 h-4" />
              }
              {degisti ? 'Kaydet' : 'Kaydedildi'}
            </button>
          </div>
        )}
        {isReadonly && (
          <div className="px-6 py-5 flex-shrink-0 border-t border-gray-100">
            <button onClick={onClose}
              className="w-full py-3 rounded-2xl font-bold text-sm"
              style={{ background: '#F3F4F6', color: '#6B7280' }}>
              Kapat
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Yeni Rol Modalı ── */
function YeniRolModal({ onClose, onCreated }) {
  const [ad,       setAd]       = useState('');
  const [yetkiler, setYetkiler] = useState(JSON.parse(JSON.stringify(FABRIKA_YETKILER)));
  const [kayit,    setKayit]    = useState(false);

  const handleSubmit = async () => {
    if (!ad.trim()) { toast.error('Rol adı zorunludur.'); return; }
    setKayit(true);
    try {
      const { data } = await api.post('/roller', { ad: ad.trim(), yetkiler });
      toast.success(`"${data.ad}" rolü oluşturuldu.`);
      onCreated(data);
    } catch (err) {
      toast.error(err.response?.data?.hata || 'Oluşturulamadı.');
    } finally { setKayit(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end sm:items-center sm:justify-center"
      style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(2px)' }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white w-full sm:max-w-lg sm:rounded-3xl rounded-t-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="h-1.5 w-full flex-shrink-0" style={{ background: 'linear-gradient(90deg,#10B981,#059669)' }} />
        <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mt-4 sm:hidden flex-shrink-0" />

        <div className="flex items-center gap-3 px-6 pt-5 pb-4 flex-shrink-0">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'linear-gradient(135deg,#DCFCE7,#BBF7D0)' }}>
            <Plus className="w-5 h-5 text-emerald-600" />
          </div>
          <h3 className="text-base font-black text-gray-900 flex-1">Yeni Rol Oluştur</h3>
          <button onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center bg-gray-100 text-gray-500 flex-shrink-0">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-6 pb-2 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Rol Adı *</label>
            <input
              type="text"
              value={ad}
              onChange={e => setAd(e.target.value)}
              placeholder="Örn: Depo Sorumlusu, Muhasebeci..."
              className="w-full px-4 py-2.5 text-sm rounded-xl border border-gray-200 outline-none focus:border-indigo-400 bg-gray-50"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">Yetkiler</label>
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
              <YetkiMatrisi yetkiler={yetkiler} onChange={setYetkiler} />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 px-6 py-5 flex-shrink-0 border-t border-gray-100">
          <button onClick={onClose}
            className="py-3 rounded-2xl font-bold text-sm"
            style={{ background: '#F3F4F6', color: '#6B7280' }}>
            İptal
          </button>
          <button onClick={handleSubmit} disabled={kayit || !ad.trim()}
            className="py-3 rounded-2xl font-bold text-sm text-white flex items-center justify-center gap-2 disabled:opacity-60"
            style={{ background: 'linear-gradient(135deg,#10B981,#059669)' }}>
            {kayit
              ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              : <Plus className="w-4 h-4" />
            }
            Oluştur
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Kompakt Rol Satırı ── */
function RolSatiri({ rol, onClick }) {
  const { aktif, toplam } = yetkiSayisi(rol._admin ? ADMIN_YETKILER : (rol.yetkiler || {}));

  const isAdminRol = rol._admin === true;
  const iconBg = isAdminRol
    ? 'linear-gradient(135deg,#FEF9C3,#FDE68A)'
    : rol.sistem
      ? 'linear-gradient(135deg,#EEF2FF,#E0E7FF)'
      : 'linear-gradient(135deg,#DCFCE7,#BBF7D0)';
  const bandColor = isAdminRol
    ? '#F59E0B'
    : rol.sistem
      ? '#6366F1'
      : '#10B981';

  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-4 py-3 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-gray-200 transition-all text-left active:scale-[0.99]"
    >
      {/* Sol renk çizgisi */}
      <div className="w-1 h-10 rounded-full flex-shrink-0" style={{ background: bandColor }} />

      {/* İkon */}
      <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: iconBg }}>
        {isAdminRol
          ? <Crown className="w-4 h-4" style={{ color: '#A16207' }} />
          : rol.sistem
            ? <User className="w-4 h-4 text-indigo-600" />
            : <ShieldCheck className="w-4 h-4 text-emerald-600" />
        }
      </div>

      {/* Metinler */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-gray-900 truncate">{rol.ad}</p>
        <p className="text-xs text-gray-400 mt-0.5">
          {isAdminRol ? 'Sistem rolü • Değiştirilemez' : rol.sistem ? 'Sistem rolü' : 'Özel rol'}
        </p>
      </div>

      {/* Yetki sayacı */}
      <div className="flex-shrink-0 text-right">
        <span className="text-xs font-bold px-2 py-1 rounded-lg"
          style={{ background: '#EEF2FF', color: '#4F46E5' }}>
          {aktif}/{toplam}
        </span>
      </div>

      {/* Kilit / chevron */}
      {isAdminRol
        ? <Lock className="w-4 h-4 text-amber-400 flex-shrink-0" />
        : <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
      }
    </button>
  );
}

/* ── Ana Sayfa ── */
export default function RollerPage() {
  const [roller,       setRoller]       = useState([]);
  const [kullanicilar, setKullanicilar] = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [yeniModal,    setYeniModal]    = useState(false);
  const [seciliRol,    setSeciliRol]    = useState(null); // detay modal

  const load = async () => {
    setLoading(true);
    try {
      const [{ data: r }, { data: k }] = await Promise.all([
        api.get('/roller'),
        api.get('/kullanicilar'),
      ]);
      setRoller(r || []);
      setKullanicilar(k || []);
    } catch { toast.error('Veriler yüklenemedi.'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleSave    = (updated) => setRoller(r => r.map(x => x.id === updated.id ? updated : x));
  const handleDelete  = (id)      => setRoller(r => r.filter(x => x.id !== id));
  const handleCreated = (yeni)    => { setRoller(r => [...r, yeni]); setYeniModal(false); };

  const adminler    = kullanicilar.filter(k => k.rol === 'admin');
  const kullaniciLi = kullanicilar.filter(k => k.rol !== 'admin');
  const ozelRoller  = roller.filter(r => !r.sistem);

  // Admin satırı için sahte nesne
  const adminRolNesnesi = { _admin: true, ad: 'Admin', sistem: true };

  // Listedeki roller: Admin (sabit) + DB'den gelenler
  const tumRoller = [adminRolNesnesi, ...roller];

  return (
    <div className="flex flex-col h-full">

      {/* ── Başlık ── */}
      <div className="bg-white border-b border-gray-200 px-6 lg:px-8 py-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-black text-gray-900">Rol Yönetimi</h1>
            <div className="flex items-center gap-6 mt-3">
              {[
                { icon: ShieldCheck, label: 'Toplam Rol',  value: loading ? '…' : roller.length + 1, color: 'linear-gradient(135deg,#6366F1,#8B5CF6)' },
                { icon: Crown,       label: 'Admin',       value: loading ? '…' : adminler.length,   color: 'linear-gradient(135deg,#F59E0B,#D97706)' },
                { icon: User,        label: 'Kullanıcı',   value: loading ? '…' : kullaniciLi.length, color: 'linear-gradient(135deg,#10B981,#059669)' },
                { icon: ShieldCheck, label: 'Özel Rol',    value: loading ? '…' : ozelRoller.length, color: 'linear-gradient(135deg,#EC4899,#DB2777)' },
              ].map((s, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: s.color }}>
                    <s.icon className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">{s.label}</p>
                    <p className="text-sm font-bold text-indigo-600">{s.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <button onClick={() => setYeniModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white shadow-sm flex-shrink-0"
            style={{ background: 'linear-gradient(135deg,#10B981,#059669)' }}>
            <Plus className="w-4 h-4" /> Yeni Rol
          </button>
        </div>
      </div>

      {/* ── İçerik ── */}
      <div className="p-6 lg:p-8 flex-1 overflow-y-auto">

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <div key={i} className="h-16 bg-white rounded-2xl animate-pulse" />)}
          </div>
        ) : (
          <>
            <div className="space-y-2">
              {tumRoller.map((rol, i) => (
                <RolSatiri
                  key={rol._admin ? '__admin__' : rol.id}
                  rol={rol}
                  onClick={() => setSeciliRol(rol)}
                />
              ))}
            </div>

            {/* Uyarı: Özel roller şimdilik sadece şablon */}
            {ozelRoller.length > 0 && (
              <div className="mt-6 rounded-2xl p-4 flex items-start gap-3"
                style={{ background: '#FFFBEB', border: '1px solid #FDE68A' }}>
                <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: '#D97706' }} />
                <p className="text-xs text-amber-800 leading-relaxed">
                  <strong>Özel roller yetki şablonu olarak kullanılır.</strong> Kullanıcı düzenleme ekranında bir işletmeye atama yaparken bu şablonlardan birini seçerek yetkileri otomatik doldurabilirsiniz.
                </p>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Rol Detay Modalı ── */}
      {seciliRol && (
        <RolDetayModal
          rol={seciliRol}
          kullanicilar={kullanicilar}
          onClose={() => setSeciliRol(null)}
          onSave={(updated) => { handleSave(updated); setSeciliRol(updated); }}
          onDelete={(id) => { handleDelete(id); setSeciliRol(null); }}
        />
      )}

      {/* ── Yeni Rol Modalı ── */}
      {yeniModal && (
        <YeniRolModal
          onClose={() => setYeniModal(false)}
          onCreated={handleCreated}
        />
      )}
    </div>
  );
}
