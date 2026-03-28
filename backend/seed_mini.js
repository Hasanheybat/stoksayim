/**
 * Mini Seed: Mevcut stok/sayım/depo verilerini sil, 3 işletme × 3 depo × 20 ürün oluştur.
 * Kullanıcılar ve roller tablosuna DOKUNMAZ.
 * Tüm işletmeler demo0001@stoksay.demo kullanıcısına atanır.
 *
 * Kullanım:  cd backend && node seed_mini.js
 */
require('dotenv').config();
const { pool } = require('./lib/db');
const { randomUUID } = require('crypto');

async function run() {
  const conn = await pool.getConnection();
  try {
    // 1) demo0001 kullanıcısını bul
    const [users] = await conn.query(
      "SELECT id FROM kullanicilar WHERE email = 'demo001@stoksay.demo'"
    );
    if (users.length === 0) {
      console.error('❌ demo0001@stoksay.demo bulunamadı!');
      return;
    }
    const userId = users[0].id;
    console.log('👤 Kullanıcı:', userId);

    // 2) Mevcut verileri sil (FK sırasına göre)
    console.log('\n🗑  Mevcut veriler siliniyor...');
    await conn.query('DELETE FROM sayim_kalemleri');
    await conn.query('DELETE FROM sayimlar');
    await conn.query('DELETE FROM isletme_urunler');
    await conn.query('DELETE FROM depolar');
    await conn.query('DELETE FROM kullanici_isletme');
    await conn.query('DELETE FROM isletmeler');
    console.log('  ✓ Tüm stok/sayım/depo/işletme verileri silindi.');

    // 3) 3 İşletme
    const isletmeler = [
      { id: randomUUID(), ad: 'Merkez Market',  kod: 'MRK001' },
      { id: randomUUID(), ad: 'Liman Depo',     kod: 'LMN001' },
      { id: randomUUID(), ad: 'Sanayi Mağaza',  kod: 'SNY001' },
    ];
    for (const i of isletmeler) {
      await conn.query(
        'INSERT INTO isletmeler (id, ad, kod, aktif) VALUES (?, ?, ?, 1)',
        [i.id, i.ad, i.kod]
      );
    }
    console.log('\n🏢 3 işletme oluşturuldu.');

    // 4) Her işletmeye 3 depo
    const depoSablonlari = [
      { ad: 'Ana Depo',    kod: 'D01', konum: 'Zemin Kat' },
      { ad: 'Soğuk Oda',   kod: 'D02', konum: 'Bodrum' },
      { ad: 'Raf Bölümü',  kod: 'D03', konum: '1. Kat' },
    ];
    for (const isl of isletmeler) {
      for (const d of depoSablonlari) {
        await conn.query(
          'INSERT INTO depolar (id, isletme_id, ad, kod, konum, aktif) VALUES (?, ?, ?, ?, ?, 1)',
          [randomUUID(), isl.id, d.ad, d.kod, d.konum]
        );
      }
    }
    console.log('🏭 9 depo oluşturuldu (3 × 3).');

    // 5) Her işletmeye 20 ürün
    const urunler = [
      { kodu: 'URN001', adi: 'Domates',         birim: 'kg',   kategori: 'Sebze',      barkod: '8690001000011' },
      { kodu: 'URN002', adi: 'Salatalık',        birim: 'kg',   kategori: 'Sebze',      barkod: '8690001000028' },
      { kodu: 'URN003', adi: 'Patates',          birim: 'kg',   kategori: 'Sebze',      barkod: '8690001000035' },
      { kodu: 'URN004', adi: 'Soğan',            birim: 'kg',   kategori: 'Sebze',      barkod: '8690001000042' },
      { kodu: 'URN005', adi: 'Biber',            birim: 'kg',   kategori: 'Sebze',      barkod: '8690001000059' },
      { kodu: 'URN006', adi: 'Süt 1L',           birim: 'adet', kategori: 'Süt Ürünü',  barkod: '8690002000010' },
      { kodu: 'URN007', adi: 'Yoğurt 500g',      birim: 'adet', kategori: 'Süt Ürünü',  barkod: '8690002000027' },
      { kodu: 'URN008', adi: 'Peynir 250g',      birim: 'adet', kategori: 'Süt Ürünü',  barkod: '8690002000034' },
      { kodu: 'URN009', adi: 'Tereyağı 200g',    birim: 'adet', kategori: 'Süt Ürünü',  barkod: '8690002000041' },
      { kodu: 'URN010', adi: 'Un 2kg',           birim: 'adet', kategori: 'Temel Gıda', barkod: '8690003000019' },
      { kodu: 'URN011', adi: 'Şeker 1kg',        birim: 'adet', kategori: 'Temel Gıda', barkod: '8690003000026' },
      { kodu: 'URN012', adi: 'Tuz 750g',         birim: 'adet', kategori: 'Temel Gıda', barkod: '8690003000033' },
      { kodu: 'URN013', adi: 'Pirinç 1kg',       birim: 'adet', kategori: 'Temel Gıda', barkod: '8690003000040' },
      { kodu: 'URN014', adi: 'Makarna 500g',     birim: 'adet', kategori: 'Temel Gıda', barkod: '8690003000057' },
      { kodu: 'URN015', adi: 'Zeytinyağı 1L',    birim: 'adet', kategori: 'Yağ',        barkod: '8690004000018' },
      { kodu: 'URN016', adi: 'Ayçiçek Yağı 2L',  birim: 'adet', kategori: 'Yağ',        barkod: '8690004000025' },
      { kodu: 'URN017', adi: 'Elma',             birim: 'kg',   kategori: 'Meyve',      barkod: '8690005000017' },
      { kodu: 'URN018', adi: 'Portakal',         birim: 'kg',   kategori: 'Meyve',      barkod: '8690005000024' },
      { kodu: 'URN019', adi: 'Muz',              birim: 'kg',   kategori: 'Meyve',      barkod: '8690005000031' },
      { kodu: 'URN020', adi: 'Ekmek',            birim: 'adet', kategori: 'Fırın',      barkod: '8690006000016' },
    ];

    for (const isl of isletmeler) {
      for (const u of urunler) {
        await conn.query(
          `INSERT INTO isletme_urunler (id, isletme_id, urun_kodu, urun_adi, birim, kategori, barkodlar, aktif)
           VALUES (?, ?, ?, ?, ?, ?, ?, 1)`,
          [randomUUID(), isl.id, u.kodu, u.adi, u.birim, u.kategori, u.barkod]
        );
      }
    }
    console.log('📦 60 ürün oluşturuldu (3 × 20).');

    // 6) Tüm işletmeleri demo0001'e ata (roller tablosuna dokunma)
    const tamYetkiler = JSON.stringify({
      urun:  { goruntule: true, ekle: true, duzenle: true, sil: true },
      depo:  { goruntule: true, ekle: true, duzenle: true, sil: true },
      sayim: { goruntule: true, ekle: true, duzenle: true, sil: true },
    });

    for (const isl of isletmeler) {
      await conn.query(
        `INSERT INTO kullanici_isletme (id, kullanici_id, isletme_id, yetkiler, aktif)
         VALUES (?, ?, ?, ?, 1)`,
        [randomUUID(), userId, isl.id, tamYetkiler]
      );
    }
    console.log('🔗 3 işletme demo0001 kullanıcısına atandı.');

    console.log('\n✅ Seed tamamlandı!');
    console.log('   İşletmeler:', isletmeler.map(i => i.ad).join(', '));
    console.log('   Her birinde: 3 depo, 20 ürün');
    console.log('   Toplam: 3 işletme, 9 depo, 60 ürün');

  } catch (err) {
    console.error('❌ Hata:', err.message);
    console.error(err.stack);
  } finally {
    conn.release();
    await pool.end();
  }
}

run();
