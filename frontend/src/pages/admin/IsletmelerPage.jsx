import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Building2, Plus, Pencil, Power, MapPin, Phone, Search, Users, Copy, Check, ChevronLeft, ChevronRight } from 'lucide-react';
import api from '../../lib/apiAdm';

const GRAD = {
  indigo: 'linear-gradient(135deg,#6366F1,#8B5CF6)',
  green: 'linear-gradient(135deg,#10B981,#059669)',
  red: 'linear-gradient(135deg,#EF4444,#DC2626)',
  blue: 'linear-gradient(135deg,#0EA5E9,#2563EB)',
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

function Modal({ open, onClose, initial, onSave }) {
  const [form, setForm] = useState({ ad: '', kod: '', adres: '', telefon: '' });
  const [loading, setLoading] = useState(false);
  useEffect(() => { setForm(initial || { ad: '', kod: '', adres: '', telefon: '' }); }, [initial, open]);
  if (!open) return null;
  const submit = async e => { e.preventDefault(); setLoading(true); await onSave(form); setLoading(false); };
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: GRAD.indigo }}>
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <h3 className="text-lg font-bold text-gray-900">{initial?.id ? 'İşletme Düzenle' : 'Yeni İşletme'}</h3>
        </div>
        <form onSubmit={submit} className="space-y-4">
          {[{l:'Ad *',k:'ad'},{l:'Telefon',k:'telefon'},{l:'Adres',k:'adres'}].map(f=>(
            <div key={f.k}>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">{f.l}</label>
              <input type="text" value={form[f.k]||''} required={f.l.includes('*')}
                onChange={e=>setForm({...form,[f.k]:e.target.value})}
                className="w-full px-4 py-2.5 text-sm rounded-xl border border-gray-200 outline-none focus:border-indigo-400 transition-colors bg-gray-50" />
            </div>
          ))}
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Kod *</label>
            <input type="text" value={form.kod||''} required disabled={!!initial?.id}
              onChange={e=>setForm({...form,kod:e.target.value.toUpperCase()})}
              className="w-full px-4 py-2.5 text-sm rounded-xl border border-gray-200 outline-none focus:border-indigo-400 font-mono bg-gray-50 disabled:opacity-50" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-3 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50">İptal</button>
            <button type="submit" disabled={loading} className="flex-1 py-3 rounded-xl text-sm font-bold text-white" style={{background:GRAD.indigo}}>
              {loading?'Kaydediliyor...':'Kaydet'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ── Onay Sheet ── */
function OnayModal({ open, onClose, onConfirm, tip, isletmeAd }) {
  if (!open) return null;
  const pasif = tip === 'pasif';
  return (
    <div
      className="fixed inset-0 z-50 flex flex-col justify-end sm:items-center sm:justify-center"
      style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(2px)' }}
      onClick={onClose}
    >
      {/* Sheet / Modal */}
      <div
        className="bg-white w-full sm:max-w-md sm:rounded-3xl rounded-t-3xl shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Üst renkli bant */}
        <div
          className="h-1.5 w-full"
          style={{ background: pasif ? GRAD.red : GRAD.green }}
        />

        {/* Handle (sadece mobilde görünür) */}
        <div className="sm:hidden flex justify-center pt-3">
          <div className="w-10 h-1 bg-gray-200 rounded-full" />
        </div>

        <div className="px-6 pt-6 pb-4">
          {/* İkon */}
          <div className="flex justify-center mb-5">
            <div
              className="w-20 h-20 rounded-3xl flex items-center justify-center shadow-sm"
              style={{ background: pasif ? '#FEF2F2' : '#F0FDF4' }}
            >
              <Power
                className="w-10 h-10"
                style={{ color: pasif ? '#EF4444' : '#22C55E' }}
              />
            </div>
          </div>

          {/* Başlık */}
          <h3 className="text-center text-xl font-black text-gray-900 mb-2">
            {pasif ? 'Pasife Al' : 'Aktife Al'}
          </h3>

          {/* İşletme adı */}
          <div
            className="mx-auto w-fit px-4 py-2 rounded-xl mb-4 text-sm font-bold"
            style={{
              background: pasif ? '#FEF2F2' : '#F0FDF4',
              color: pasif ? '#DC2626' : '#16A34A',
            }}
          >
            {isletmeAd}
          </div>

          {/* Açıklama */}
          {pasif ? (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6">
              <p className="text-sm font-semibold text-amber-800 mb-1">⚠️ Dikkat</p>
              <p className="text-xs text-amber-700 leading-relaxed">
                Bu işletme pasife alındığında kullanıcılar erişemeyecek ve uygulama listesinden kaybolacak. Mevcut sayımlar korunur.
              </p>
            </div>
          ) : (
            <div className="bg-green-50 border border-green-200 rounded-2xl p-4 mb-6">
              <p className="text-sm font-semibold text-green-800 mb-1">✓ Aktifleştir</p>
              <p className="text-xs text-green-700 leading-relaxed">
                Bu işletme tekrar aktif hale getirilecek. Atanmış kullanıcılar yeniden erişebilecek.
              </p>
            </div>
          )}

          {/* Butonlar */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-3.5 rounded-2xl text-sm font-bold border-2 border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors"
            >
              Vazgeç
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 py-3.5 rounded-2xl text-sm font-bold text-white shadow-sm transition-all hover:opacity-90 active:scale-[0.98]"
              style={{ background: pasif ? GRAD.red : GRAD.green }}
            >
              {pasif ? 'Evet, Pasife Al' : 'Evet, Aktife Al'}
            </button>
          </div>
        </div>

        {/* Güvenli alan (mobil için) */}
        <div className="pb-safe sm:pb-0 h-4 sm:h-0" />
      </div>
    </div>
  );
}

function KopyaBtn({ text }) {
  const [kopya, setKopya] = useState(false);
  const handleKopya = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text).then(() => {
      setKopya(true);
      setTimeout(() => setKopya(false), 1500);
    });
  };
  return (
    <button onClick={handleKopya}
      className="inline-flex items-center gap-1 text-xs font-mono px-2 py-1 rounded-lg border transition-all"
      style={{ background: '#F8FAFC', borderColor: '#E2E8F0', color: '#64748B' }}
      title="ID'yi kopyala">
      <span className="truncate max-w-[110px]">{text.slice(0, 8)}…</span>
      {kopya
        ? <Check style={{ width: 11, height: 11, color: '#16A34A', flexShrink: 0 }} />
        : <Copy style={{ width: 11, height: 11, flexShrink: 0 }} />}
    </button>
  );
}

const LIMIT = 50;

export default function IsletmelerPage() {
  const [isletmeler, setIsletmeler] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState('');
  const [aramaDebounce, setAramaDebounce] = useState('');
  const [filtre, setFiltre] = useState('Tümü');
  const [sayfa, setSayfa] = useState(1);
  const [toplam, setToplam] = useState(0);
  const [onay, setOnay] = useState(null); // { id, tip: 'pasif'|'aktif', ad }

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => { setAramaDebounce(search); setSayfa(1); }, 350);
    return () => clearTimeout(t);
  }, [search]);

  const load = useCallback(async (sp = sayfa) => {
    setLoading(true);
    try {
      const p = new URLSearchParams({ sayfa: sp, limit: LIMIT });
      if (aramaDebounce) p.set('q', aramaDebounce);
      if (filtre === 'Aktif') p.set('aktif', 'true');
      if (filtre === 'Pasif') p.set('aktif', 'false');
      const { data } = await api.get(`/isletmeler?${p}`);
      setIsletmeler(data.data || []);
      setToplam(data.toplam || 0);
    } catch { toast.error('Veriler yüklenemedi.'); }
    finally { setLoading(false); }
  }, [sayfa, aramaDebounce, filtre]);

  useEffect(() => { load(); }, [load]);

  const handleFiltre = (f) => { setFiltre(f); setSayfa(1); };

  const handleSave = async (form) => {
    try {
      editing?.id ? await api.put(`/isletmeler/${editing.id}`,form) : await api.post('/isletmeler',form);
      toast.success(editing?.id?'Güncellendi.':'Eklendi.'); setModalOpen(false); setEditing(null); load();
    } catch(err){toast.error(err.response?.data?.hata||'Hata.');}
  };

  const handleDeact = (i) => setOnay({ id: i.id, tip: 'pasif', ad: i.ad });
  const handleAktifle = (i) => setOnay({ id: i.id, tip: 'aktif', ad: i.ad });

  const handleOnayConfirm = async () => {
    const { id, tip } = onay;
    setOnay(null);
    try {
      if (tip === 'pasif') { await api.delete(`/isletmeler/${id}`); toast.success('Pasife alındı.'); }
      else                 { await api.put(`/isletmeler/${id}`, { aktif: true }); toast.success('Aktife alındı.'); }
      load();
    } catch { toast.error('Hata.'); }
  };

  const sayfaSayisi = Math.max(1, Math.ceil(toplam / LIMIT));

  return (
    <div className="flex flex-col h-full">
      <PageHeader title="İşletme Yönetimi" stats={[
        {icon:Building2,label:'Toplam',value:toplam,color:GRAD.indigo},
        {icon:Power,label:'Aktif',value:filtre==='Aktif'?toplam:undefined,color:GRAD.green},
        {icon:Users,label:'Pasif',value:filtre==='Pasif'?toplam:undefined,color:GRAD.red},
      ]} />

      <div className="p-4 sm:p-6 lg:p-8 flex-1 space-y-4">
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Arama */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"/>
            <input type="text" placeholder="İşletme ara..." value={search} onChange={e=>setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-gray-200 bg-white outline-none focus:border-indigo-400"/>
          </div>
          {/* Filtre + Yeni İşletme */}
          <div className="flex gap-2">
            <div className="flex bg-white rounded-xl border border-gray-200 p-1">
              {['Tümü','Aktif','Pasif'].map(f=>(
                <button key={f} onClick={()=>handleFiltre(f)}
                  className="px-3 sm:px-4 py-1.5 rounded-lg text-sm font-medium transition-all"
                  style={filtre===f?{background:'#6366F1',color:'white'}:{color:'#94A3B8'}}>
                  {f}
                </button>
              ))}
            </div>
            <button onClick={()=>{setEditing(null);setModalOpen(true);}}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white shadow-sm whitespace-nowrap"
              style={{background:GRAD.indigo}}>
              <Plus className="w-4 h-4"/><span className="hidden sm:inline">Yeni İşletme</span><span className="sm:hidden">Yeni</span>
            </button>
          </div>
        </div>

        {/* Grid */}
        {loading?(
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
            {[1,2,3,4].map(i=><div key={i} className="h-28 bg-white rounded-xl animate-pulse"/>)}
          </div>
        ):isletmeler.length===0?(
          <div className="bg-white rounded-2xl p-16 text-center border border-gray-100">
            <Building2 className="w-12 h-12 mx-auto mb-3 text-gray-200"/>
            <p className="text-gray-400 font-medium">İşletme bulunamadı.</p>
          </div>
        ):(
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
            {isletmeler.map(i=>(
              <div key={i.id} className="bg-white rounded-xl px-3 py-2.5 border border-gray-100 hover:border-indigo-100 hover:shadow-sm transition-all flex flex-col gap-1.5">
                {/* Üst: ikon + ad + butonlar */}
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{background:GRAD.indigo}}>
                    <Building2 className="w-4 h-4 text-white"/>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 text-sm truncate leading-tight">{i.ad}</h3>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-[11px] font-mono bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full">{i.kod}</span>
                      <span className="text-[11px] font-bold px-1.5 py-0.5 rounded-full"
                        style={i.aktif?{background:'#DCFCE7',color:'#16A34A'}:{background:'#FEE2E2',color:'#DC2626'}}>
                        {i.aktif?'Aktif':'Pasif'}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <button onClick={()=>{setEditing(i);setModalOpen(true);}}
                      className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-indigo-100 transition-colors"
                      style={{background:'#EEF2FF'}} title="Düzenle">
                      <Pencil className="w-3.5 h-3.5" style={{color:'#6366F1'}}/>
                    </button>
                    {i.aktif ? (
                      <button onClick={()=>handleDeact(i)}
                        className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-100 transition-colors"
                        style={{background:'#FEF2F2'}} title="Pasifleştir">
                        <Power className="w-3.5 h-3.5" style={{color:'#EF4444'}}/>
                      </button>
                    ) : (
                      <button onClick={()=>handleAktifle(i)}
                        className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-green-100 transition-colors"
                        style={{background:'#DCFCE7'}} title="Aktifleştir">
                        <Power className="w-3.5 h-3.5" style={{color:'#16A34A'}}/>
                      </button>
                    )}
                  </div>
                </div>
                {/* ID + adres + telefon */}
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-gray-400">ID:</span>
                    <KopyaBtn text={i.id} />
                  </div>
                  {i.adres&&<div className="flex items-center gap-1.5 text-xs text-gray-400"><MapPin className="w-3 h-3 flex-shrink-0"/><span className="truncate">{i.adres}</span></div>}
                  {i.telefon&&<div className="flex items-center gap-1.5 text-xs text-gray-400"><Phone className="w-3 h-3 flex-shrink-0"/>{i.telefon}</div>}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Sayfalama */}
        {sayfaSayisi > 1 && (
          <div className="flex items-center justify-center gap-3 py-2">
            <button onClick={()=>setSayfa(s=>s-1)} disabled={sayfa===1}
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
              <ChevronLeft className="w-4 h-4 text-gray-600"/>
            </button>
            <span className="text-sm text-gray-500">
              <span className="font-bold text-gray-900">{sayfa}</span> / {sayfaSayisi}
            </span>
            <button onClick={()=>setSayfa(s=>s+1)} disabled={sayfa===sayfaSayisi}
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
              <ChevronRight className="w-4 h-4 text-gray-600"/>
            </button>
          </div>
        )}
      </div>
      <Modal open={modalOpen} onClose={()=>{setModalOpen(false);setEditing(null);}} onSave={handleSave} initial={editing}/>
      <OnayModal
        open={!!onay}
        onClose={()=>setOnay(null)}
        onConfirm={handleOnayConfirm}
        tip={onay?.tip}
        isletmeAd={onay?.ad}
      />
    </div>
  );
}
