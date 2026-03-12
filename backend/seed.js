/**
 * StokSay — Demo Veri Seed Script (MariaDB)
 *
 * Oluşturur:
 *   1 admin kullanıcı (admin@stoksay.com / Admin1234!)
 *   100 kullanıcı
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
const { pool } = require('./lib/db');
const bcrypt   = require('bcryptjs');
const { randomUUID } = require('crypto');

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
    .toISOString().slice(0, 19).replace('T', ' ');
}

async function batchInsert(conn, table, columns, rows, batchSize = 500) {
  let done = 0;
  const placeholders = `(${columns.map(() => '?').join(',')})`;
  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);
    const sql = `INSERT INTO ${table} (${columns.join(',')}) VALUES ${batch.map(() => placeholders).join(',')}`;
    const values = batch.flat();
    await conn.execute(sql, values);
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
  const conn = await pool.getConnection();

  try {
    const passwordHash = await bcrypt.hash('Demo1234!', 10);
    const adminHash    = await bcrypt.hash('Admin1234!', 10);

    // ── 0. ADMIN ─────────────────────────────────────────────
    console.log('\n👑 Admin kullanıcı oluşturuluyor...');
    const adminId = randomUUID();
    await conn.execute(
      'INSERT IGNORE INTO kullanicilar (id, ad_soyad, email, password_hash, rol, aktif, ayarlar) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [adminId, 'Admin', 'admin@stoksay.com', adminHash, 'admin', true, JSON.stringify({ tema: 'light' })]
    );
    console.log('  ↳ admin@stoksay.com / Admin1234!');

    // ── 1. KULLANICILAR ──────────────────────────────────────
    console.log(`\n👤 Kullanıcılar oluşturuluyor (${N_KULLANICI})...`);
    const kullaniciIds = [];
    const kullaniciRows = [];
    for (let i = 1; i <= N_KULLANICI; i++) {
      const id = randomUUID();
      kullaniciIds.push(id);
      kullaniciRows.push([
        id,
        `Demo Kullanıcı ${pad(i)}`,
        `demo${pad(i)}@stoksay.demo`,
        passwordHash,
        'kullanici',
        true,
        JSON.stringify({ birim_otomatik: false, barkod_sesi: true, tema: 'light' }),
      ]);
    }
    await batchInsert(conn, 'kullanicilar',
      ['id', 'ad_soyad', 'email', 'password_hash', 'rol', 'aktif', 'ayarlar'],
      kullaniciRows, N_KULLANICI);

    // ── 2. İŞLETMELER ────────────────────────────────────────
    console.log(`\n🏢 İşletmeler oluşturuluyor (${N_ISLETME})...`);
    const sehirler = ['İstanbul','Ankara','İzmir','Bursa','Antalya','Adana','Konya','Gaziantep','Mersin','Kayseri'];
    const isletmeIds = [];
    const isletmeRows = [];
    for (let i = 0; i < N_ISLETME; i++) {
      const id = randomUUID();
      isletmeIds.push(id);
      isletmeRows.push([
        id,
        `Demo İşletme ${pad(i + 1)}`,
        `ISL${pad(i + 1)}`,
        `Demo Cad. No:${i + 1}, ${sehirler[i % sehirler.length]}`,
        `0212${pad(1000000 + i, 7).slice(-7)}`,
        true,
      ]);
    }
    await batchInsert(conn, 'isletmeler',
      ['id', 'ad', 'kod', 'adres', 'telefon', 'aktif'],
      isletmeRows, N_ISLETME);

    // ── 3. KULLANICI-İŞLETME BAĞLANTISI ──────────────────────
    console.log('\n🔗 Kullanıcı-İşletme bağlantıları...');
    const baglantiRows = kullaniciIds.map((uid, i) => [
      randomUUID(),
      uid,
      isletmeIds[i % N_ISLETME],
      JSON.stringify({
        urun:   { goruntule: true, ekle: true, duzenle: true, sil: false },
        depo:   { goruntule: true, ekle: false, duzenle: false, sil: false },
        barkod: { tanimla: true, duzenle: false, sil: false },
        sayim:  { goruntule: true, ekle: true, duzenle: true, sil: false },
      }),
      true,
    ]);
    await batchInsert(conn, 'kullanici_isletme',
      ['id', 'kullanici_id', 'isletme_id', 'yetkiler', 'aktif'],
      baglantiRows, N_KULLANICI);

    // ── 4. DEPOLAR ────────────────────────────────────────────
    console.log(`\n🏭 Depolar oluşturuluyor (${N_ISLETME * N_DEPO})...`);
    const depoIds = [];
    const depoIsletmeMap = [];
    const depoRows = [];
    for (let iIdx = 0; iIdx < N_ISLETME; iIdx++) {
      for (let d = 1; d <= N_DEPO; d++) {
        const id = randomUUID();
        depoIds.push(id);
        depoIsletmeMap.push(iIdx);
        depoRows.push([
          id,
          isletmeIds[iIdx],
          `Depo ${d}`,
          `D${pad(d, 2)}`,
          `Kat ${Math.ceil(d / 2)}, Bölge ${String.fromCharCode(64 + d)}`,
          true,
        ]);
      }
    }
    await batchInsert(conn, 'depolar',
      ['id', 'isletme_id', 'ad', 'kod', 'konum', 'aktif'],
      depoRows, 500);

    // ── 5. ÜRÜNLER ────────────────────────────────────────────
    console.log(`\n📦 Ürünler oluşturuluyor (${N_ISLETME * N_URUN})...`);
    // Ürünler çok fazla — batch'ler halinde işle
    for (let iIdx = 0; iIdx < N_ISLETME; iIdx++) {
      const urunBatch = [];
      for (let u = 1; u <= N_URUN; u++) {
        const kat  = KATEGORILER[u % KATEGORILER.length];
        const birim = BIRIMLER[u % BIRIMLER.length];
        urunBatch.push([
          isletmeIds[iIdx],
          `ISL${pad(iIdx + 1)}-U${pad(u, 4)}`,
          `${kat} Ürün ${pad(u, 4)}`,
          `Stok-${kat.substring(0, 3).toUpperCase()}${pad(u, 4)}`,
          birim,
          kat,
          `869${pad(iIdx * N_URUN + u, 10)}`,
          true,
        ]);
      }
      await batchInsert(conn, 'isletme_urunler',
        ['isletme_id', 'urun_kodu', 'urun_adi', 'isim_2', 'birim', 'kategori', 'barkodlar', 'aktif'],
        urunBatch, 1000);
      process.stdout.write(`  ↳ İşletme ${iIdx + 1}/${N_ISLETME} tamamlandı\n`);
    }

    // ── 6. SAYIMLAR ───────────────────────────────────────────
    console.log(`\n📋 Sayımlar oluşturuluyor (${N_ISLETME * N_DEPO * N_SAYIM})...`);
    const sayimRows = [];
    for (let dIdx = 0; dIdx < depoIds.length; dIdx++) {
      const iIdx = depoIsletmeMap[dIdx];
      const kIdx = iIdx % kullaniciIds.length;
      for (let s = 1; s <= N_SAYIM; s++) {
        sayimRows.push([
          randomUUID(),
          isletmeIds[iIdx],
          depoIds[dIdx],
          kullaniciIds[kIdx],
          `Sayım ${pad(s, 2)} — Depo ${(dIdx % N_DEPO) + 1}`,
          rndDate(180),
          DURUMLAR[(dIdx + s) % DURUMLAR.length],
          s % 3 === 0 ? 'Otomatik demo sayımı.' : null,
        ]);
      }
    }
    await batchInsert(conn, 'sayimlar',
      ['id', 'isletme_id', 'depo_id', 'kullanici_id', 'ad', 'tarih', 'durum', 'notlar'],
      sayimRows, 500);

    // ── ÖZET ─────────────────────────────────────────────────
    const sure = ((Date.now() - t0) / 1000).toFixed(1);
    console.log('\n╔═══════════════════════════════════════╗');
    console.log('║          ✅  TAMAMLANDI                ║');
    console.log('╠═══════════════════════════════════════╣');
    console.log(`║  ⏱  Süre        : ${String(sure + 's').padEnd(19)}║`);
    console.log(`║  👤 Kullanıcılar : ${String(N_KULLANICI + 1).padEnd(19)}║`);
    console.log(`║  🏢 İşletmeler  : ${String(N_ISLETME).padEnd(19)}║`);
    console.log(`║  🏭 Depolar     : ${String(depoIds.length).padEnd(19)}║`);
    console.log(`║  📦 Ürünler     : ${String(N_ISLETME * N_URUN).padEnd(19)}║`);
    console.log(`║  📋 Sayımlar    : ${String(sayimRows.length).padEnd(19)}║`);
    console.log('╚═══════════════════════════════════════╝\n');
    console.log('🔑 Test giriş bilgileri:');
    console.log('   Admin  : admin@stoksay.com / Admin1234!');
    console.log('   Demo   : demo001@stoksay.demo ... demo100@stoksay.demo / Demo1234!\n');
  } finally {
    conn.release();
    await pool.end();
  }
}

// ─── TEMIZLE ─────────────────────────────────────────────────
async function temizle() {
  console.log('🗑  Demo veriler siliniyor...\n');
  const t0 = Date.now();
  const conn = await pool.getConnection();

  try {
    // Demo işletme id'lerini bul
    const [isletmeler] = await conn.execute("SELECT id FROM isletmeler WHERE kod LIKE 'ISL%'");
    const isletmeIds = isletmeler.map(i => i.id);
    console.log(`  ↳ ${isletmeIds.length} demo işletme bulundu.`);

    if (isletmeIds.length > 0) {
      const ph = isletmeIds.map(() => '?').join(',');

      console.log('  ↳ Sayımlar siliniyor...');
      await conn.execute(`DELETE FROM sayimlar WHERE isletme_id IN (${ph})`, isletmeIds);

      console.log('  ↳ Ürünler siliniyor...');
      await conn.execute(`DELETE FROM isletme_urunler WHERE isletme_id IN (${ph})`, isletmeIds);

      console.log('  ↳ Depolar siliniyor...');
      await conn.execute(`DELETE FROM depolar WHERE isletme_id IN (${ph})`, isletmeIds);

      console.log('  ↳ Kullanıcı-İşletme bağlantıları siliniyor...');
      await conn.execute(`DELETE FROM kullanici_isletme WHERE isletme_id IN (${ph})`, isletmeIds);

      console.log('  ↳ İşletmeler siliniyor...');
      await conn.execute(`DELETE FROM isletmeler WHERE id IN (${ph})`, isletmeIds);
    }

    console.log('  ↳ Demo kullanıcılar siliniyor...');
    await conn.execute("DELETE FROM kullanicilar WHERE email LIKE '%@stoksay.demo'");

    const sure = ((Date.now() - t0) / 1000).toFixed(1);
    console.log(`\n✅ Temizleme tamamlandı! (${sure}s)\n`);
  } finally {
    conn.release();
    await pool.end();
  }
}

// ─── MAIN ─────────────────────────────────────────────────────
const args = process.argv.slice(2);
if (args.includes('--temizle') || args.includes('-t')) {
  temizle().catch(err => { console.error('\n❌ Hata:', err.message); process.exit(1); });
} else {
  seed().catch(err => { console.error('\n❌ Hata:', err.message); process.exit(1); });
}
