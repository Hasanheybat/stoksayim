/**
 * StokSay — Demo Veri Seed Script
 *
 * Oluşturur:
 *   100 kullanıcı  (Supabase Auth + kullanicilar tablosu)
 *   100 işletme
 *   100 kullanici_isletme bağlantısı (her kullanıcı 1 işletmeye)
 * 1.000 depo       (her işletmeye 10)
 * 150.000 ürün     (her işletmeye 1.500)
 *  10.000 sayım    (her depoya 10)
 *
 * Kullanım:
 *   cd backend
 *   node seed.js
 *
 * Silmek için:
 *   node seed.js --temizle
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const { randomUUID }   = require('crypto');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

// ─── Sabitler ────────────────────────────────────────────────
const KATEGORILER = [
  'Elektronik','Gıda','Temizlik','Tekstil',
  'Kırtasiye','Mobilya','Beyaz Eşya','Spor','Oyuncak','Kozmetik',
];
const BIRIMLER  = ['ADET','KG','LT','MT','PKT','KOL','KUTU'];
const DURUMLAR  = ['devam','tamamlandi'];

const N_KULLANICI = 100;
const N_ISLETME   = 100;
const N_DEPO      = 10;   // işletme başına
const N_URUN      = 1500; // işletme başına
const N_SAYIM     = 10;   // depo başına

// ─── Yardımcılar ─────────────────────────────────────────────
function pad(n, len = 3) { return String(n).padStart(len, '0'); }

function rndDate(daysBack = 180) {
  return new Date(Date.now() - Math.random() * daysBack * 86400000)
    .toISOString().split('T')[0];
}

async function batchInsert(table, rows, batchSize = 500) {
  let done = 0;
  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);
    const { error } = await supabase.from(table).insert(batch);
    if (error) throw new Error(`[${table}] ${error.message}`);
    done += batch.length;
    process.stdout.write(`\r  ↳ ${table}: ${done}/${rows.length} satır`);
  }
  process.stdout.write('\n');
}

// ─── SEED ────────────────────────────────────────────────────
async function seed() {
  console.log('╔════════════════════════════════════╗');
  console.log('║   StokSay — Demo Veri Oluşturucu   ║');
  console.log('╚════════════════════════════════════╝\n');
  const t0 = Date.now();

  // ── 1. KULLANICILAR ──────────────────────────────────────
  console.log(`\n👤 Kullanıcılar oluşturuluyor (${N_KULLANICI})...`);
  const authUsers = [];
  const CONCURRENT = 10;
  for (let b = 0; b < N_KULLANICI / CONCURRENT; b++) {
    const batch = Array.from({ length: CONCURRENT }, (_, k) => {
      const idx = b * CONCURRENT + k + 1;
      return supabase.auth.admin.createUser({
        email:          `demo${pad(idx)}@stoksay.demo`,
        password:       'Demo1234!',
        email_confirm:  true,
        user_metadata:  { ad_soyad: `Demo Kullanıcı ${pad(idx)}` },
      });
    });
    const results = await Promise.all(batch);
    results.forEach(({ data, error }) => {
      if (error) { console.error('\n  ⚠ Auth error:', error.message); return; }
      authUsers.push(data.user);
    });
    process.stdout.write(`\r  ↳ auth.users: ${authUsers.length}/${N_KULLANICI}`);
  }
  process.stdout.write('\n');

  const profilRows = authUsers.map((u, i) => ({
    id:       u.id,
    ad_soyad: `Demo Kullanıcı ${pad(i + 1)}`,
    email:    u.email,
    rol:      'kullanici',
    aktif:    true,
    ayarlar:  { birim_otomatik: false, barkod_sesi: true, tema: 'light' },
  }));
  await batchInsert('kullanicilar', profilRows, N_KULLANICI);

  // ── 2. İŞLETMELER ────────────────────────────────────────
  console.log(`\n🏢 İşletmeler oluşturuluyor (${N_ISLETME})...`);
  const sehirler = ['İstanbul','Ankara','İzmir','Bursa','Antalya','Adana','Konya','Gaziantep','Mersin','Kayseri'];
  const isletmeRows = Array.from({ length: N_ISLETME }, (_, i) => ({
    id:      randomUUID(),
    ad:      `Demo İşletme ${pad(i + 1)}`,
    kod:     `ISL${pad(i + 1)}`,
    adres:   `Demo Cad. No:${i + 1}, ${sehirler[i % sehirler.length]}`,
    telefon: `0212${pad(1000000 + i, 7).slice(-7)}`,
    aktif:   true,
  }));
  await batchInsert('isletmeler', isletmeRows, N_ISLETME);

  // ── 3. KULLANICI-İŞLETME BAĞLANTISI ──────────────────────
  console.log('\n🔗 Kullanıcı-İşletme bağlantıları...');
  const baglantiRows = authUsers.map((u, i) => ({
    kullanici_id: u.id,
    isletme_id:   isletmeRows[i % N_ISLETME].id,
    yetkiler: {
      urun_ekle:    true,
      urun_duzenle: true,
      barkod_ekle:  true,
      sayim_baslat: true,
    },
    aktif: true,
  }));
  await batchInsert('kullanici_isletme', baglantiRows, N_KULLANICI);

  // ── 4. DEPOLAR ────────────────────────────────────────────
  console.log(`\n🏭 Depolar oluşturuluyor (${N_ISLETME * N_DEPO})...`);
  const depoRows = [];
  for (const isletme of isletmeRows) {
    for (let d = 1; d <= N_DEPO; d++) {
      depoRows.push({
        id:          randomUUID(),
        isletme_id:  isletme.id,
        ad:          `Depo ${d}`,
        kod:         `D${pad(d, 2)}`,
        konum:       `Kat ${Math.ceil(d / 2)}, Bölge ${String.fromCharCode(64 + d)}`,
        aktif:       true,
      });
    }
  }
  await batchInsert('depolar', depoRows, 500);

  // ── 5. ÜRÜNLER ────────────────────────────────────────────
  console.log(`\n📦 Ürünler oluşturuluyor (${N_ISLETME * N_URUN})...`);
  const urunRows = [];
  for (let iIdx = 0; iIdx < isletmeRows.length; iIdx++) {
    const isletme = isletmeRows[iIdx];
    for (let u = 1; u <= N_URUN; u++) {
      const kat  = KATEGORILER[u % KATEGORILER.length];
      const birim = BIRIMLER[u % BIRIMLER.length];
      urunRows.push({
        isletme_id: isletme.id,
        urun_kodu:  `${isletme.kod}-U${pad(u, 4)}`,
        urun_adi:   `${kat} Ürün ${pad(u, 4)}`,
        isim_2:     `Stok-${kat.substring(0, 3).toUpperCase()}${pad(u, 4)}`,
        birim,
        kategori:   kat,
        barkodlar:  `869${pad(iIdx * N_URUN + u, 10)}`,
        aktif:      true,
      });
    }
    if ((iIdx + 1) % 20 === 0)
      process.stdout.write(`\r  ↳ isletme_urunler hazırlanıyor: ${urunRows.length}/${N_ISLETME * N_URUN}`);
  }
  process.stdout.write('\n');
  await batchInsert('isletme_urunler', urunRows, 1000);

  // ── 6. SAYIMLAR ───────────────────────────────────────────
  console.log(`\n📋 Sayımlar oluşturuluyor (${N_ISLETME * N_DEPO * N_SAYIM})...`);
  const sayimRows = [];
  for (let dIdx = 0; dIdx < depoRows.length; dIdx++) {
    const depo     = depoRows[dIdx];
    const isletme  = isletmeRows[Math.floor(dIdx / N_DEPO)];
    const kullanici = authUsers[Math.floor(dIdx / N_DEPO) % authUsers.length];
    for (let s = 1; s <= N_SAYIM; s++) {
      sayimRows.push({
        isletme_id:   isletme.id,
        depo_id:      depo.id,
        kullanici_id: kullanici.id,
        ad:           `Sayım ${pad(s, 2)} — ${depo.ad}`,
        tarih:        rndDate(180),
        durum:        DURUMLAR[(dIdx + s) % DURUMLAR.length],
        notlar:       s % 3 === 0 ? 'Otomatik demo sayımı.' : null,
      });
    }
  }
  await batchInsert('sayimlar', sayimRows, 500);

  // ── ÖZET ─────────────────────────────────────────────────
  const sure = ((Date.now() - t0) / 1000).toFixed(1);
  console.log('\n╔═══════════════════════════════════════╗');
  console.log('║          ✅  TAMAMLANDI                ║');
  console.log('╠═══════════════════════════════════════╣');
  console.log(`║  ⏱  Süre        : ${String(sure + 's').padEnd(19)}║`);
  console.log(`║  👤 Kullanıcılar : ${String(authUsers.length).padEnd(19)}║`);
  console.log(`║  🏢 İşletmeler  : ${String(isletmeRows.length).padEnd(19)}║`);
  console.log(`║  🏭 Depolar     : ${String(depoRows.length).padEnd(19)}║`);
  console.log(`║  📦 Ürünler     : ${String(urunRows.length).padEnd(19)}║`);
  console.log(`║  📋 Sayımlar    : ${String(sayimRows.length).padEnd(19)}║`);
  console.log('╚═══════════════════════════════════════╝\n');
  console.log('🔑 Test giriş bilgileri:');
  console.log('   Email   : demo001@stoksay.demo ... demo100@stoksay.demo');
  console.log('   Şifre   : Demo1234!\n');
}

// ─── TEMIZLE ─────────────────────────────────────────────────
async function temizle() {
  console.log('🗑  Demo veriler siliniyor...\n');
  const t0 = Date.now();

  // Demo e-postalarını bul
  console.log('  ↳ Demo kullanıcılar aranıyor...');
  const { data: profiller, error: pErr } = await supabase
    .from('kullanicilar')
    .select('id, email')
    .like('email', '%@stoksay.demo');
  if (pErr) throw new Error(pErr.message);
  console.log(`  ↳ ${profiller.length} demo kullanıcı bulundu.`);

  if (profiller.length === 0) {
    console.log('  ℹ  Silinecek demo veri bulunamadı.');
    return;
  }

  const kullaniciIds = profiller.map(p => p.id);

  // Demo işletmelerini bul
  const { data: isletmeler } = await supabase
    .from('isletmeler')
    .select('id')
    .like('kod', 'ISL%');
  const isletmeIds = (isletmeler || []).map(i => i.id);
  console.log(`  ↳ ${isletmeIds.length} demo işletme bulundu.`);

  // Sıralı silme (foreign key'ler nedeniyle)
  if (isletmeIds.length > 0) {
    // sayim_kalemleri → sayimlar cascade ile silinir
    console.log('  ↳ Sayımlar siliniyor...');
    const { error: sErr } = await supabase.from('sayimlar').delete().in('isletme_id', isletmeIds);
    if (sErr) console.warn('  ⚠ sayimlar:', sErr.message);

    console.log('  ↳ Ürünler siliniyor...');
    const { error: uErr } = await supabase.from('isletme_urunler').delete().in('isletme_id', isletmeIds);
    if (uErr) console.warn('  ⚠ isletme_urunler:', uErr.message);

    console.log('  ↳ Depolar siliniyor...');
    const { error: dErr } = await supabase.from('depolar').delete().in('isletme_id', isletmeIds);
    if (dErr) console.warn('  ⚠ depolar:', dErr.message);

    console.log('  ↳ Kullanıcı-İşletme bağlantıları siliniyor...');
    const { error: bErr } = await supabase.from('kullanici_isletme').delete().in('isletme_id', isletmeIds);
    if (bErr) console.warn('  ⚠ kullanici_isletme:', bErr.message);

    console.log('  ↳ İşletmeler siliniyor...');
    const { error: iErr } = await supabase.from('isletmeler').delete().in('id', isletmeIds);
    if (iErr) console.warn('  ⚠ isletmeler:', iErr.message);
  }

  console.log('  ↳ Kullanıcı profilleri siliniyor...');
  const { error: kErr } = await supabase.from('kullanicilar').delete().in('id', kullaniciIds);
  if (kErr) console.warn('  ⚠ kullanicilar:', kErr.message);

  console.log('  ↳ Auth kullanıcılar siliniyor...');
  let authSilinen = 0;
  for (const id of kullaniciIds) {
    const { error } = await supabase.auth.admin.deleteUser(id);
    if (!error) authSilinen++;
  }

  const sure = ((Date.now() - t0) / 1000).toFixed(1);
  console.log(`\n✅ Temizleme tamamlandı! (${sure}s)`);
  console.log(`   🗑  ${authSilinen} auth kullanıcı, ${isletmeIds.length} işletme ve tüm ilişkili veriler silindi.\n`);
}

// ─── MAIN ─────────────────────────────────────────────────────
const args = process.argv.slice(2);
if (args.includes('--temizle') || args.includes('-t')) {
  temizle().catch(err => { console.error('\n❌ Hata:', err.message); process.exit(1); });
} else {
  seed().catch(err => { console.error('\n❌ Hata:', err.message); process.exit(1); });
}
