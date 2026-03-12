-- ============================================================
-- StokSay — Demo Veri
-- Supabase SQL Editor'de çalıştır
-- ============================================================

-- ── 1. Demo İşletmeler ──────────────────────────────────────
INSERT INTO isletmeler (id, ad, kod, adres, telefon) VALUES
  ('aaaaaaaa-0001-0001-0001-000000000001', 'Alfa Market A.Ş.',    'ALFA',  'İstanbul, Kadıköy', '0212 000 0001'),
  ('aaaaaaaa-0002-0002-0002-000000000002', 'Beta Teknoloji Ltd.', 'BETA',  'Ankara, Çankaya',   '0312 000 0002')
ON CONFLICT (kod) DO NOTHING;

-- ── 2. Demo Depolar ─────────────────────────────────────────
INSERT INTO depolar (id, isletme_id, ad, kod, konum) VALUES
  ('bbbbbbbb-0001-0001-0001-000000000001', 'aaaaaaaa-0001-0001-0001-000000000001', 'Ana Depo',      'ALFA-ANA',  'Zemin Kat'),
  ('bbbbbbbb-0002-0002-0002-000000000002', 'aaaaaaaa-0001-0001-0001-000000000001', 'Soğuk Depo',    'ALFA-SOG',  '1. Kat'),
  ('bbbbbbbb-0003-0003-0003-000000000003', 'aaaaaaaa-0002-0002-0002-000000000002', 'Merkez Depo',   'BETA-MRK',  'Bodrum'),
  ('bbbbbbbb-0004-0004-0004-000000000004', 'aaaaaaaa-0002-0002-0002-000000000002', 'Yedek Depo',    'BETA-YDK',  '2. Kat')
ON CONFLICT (isletme_id, kod) DO NOTHING;

-- ── 3. Demo Ürünler — Alfa Market ───────────────────────────
INSERT INTO isletme_urunler (isletme_id, urun_kodu, urun_adi, birim, kategori, barkodlar) VALUES
  ('aaaaaaaa-0001-0001-0001-000000000001', 'ALF-001', 'Ayçiçek Yağı 5L',         'ADET', 'Yağ & Sıvı', '8690000000001'),
  ('aaaaaaaa-0001-0001-0001-000000000001', 'ALF-002', 'Un 5 Kg',                 'ADET', 'Bakliyat',   '8690000000002'),
  ('aaaaaaaa-0001-0001-0001-000000000001', 'ALF-003', 'Şeker 2 Kg',              'ADET', 'Bakliyat',   '8690000000003'),
  ('aaaaaaaa-0001-0001-0001-000000000001', 'ALF-004', 'Makarna 500g',            'ADET', 'Bakliyat',   '8690000000004'),
  ('aaaaaaaa-0001-0001-0001-000000000001', 'ALF-005', 'Pirinç 1 Kg',             'ADET', 'Bakliyat',   '8690000000005'),
  ('aaaaaaaa-0001-0001-0001-000000000001', 'ALF-006', 'Domates Salçası 700g',    'ADET', 'Konserve',   '8690000000006'),
  ('aaaaaaaa-0001-0001-0001-000000000001', 'ALF-007', 'Zeytinyağı 1L',           'ADET', 'Yağ & Sıvı', '8690000000007'),
  ('aaaaaaaa-0001-0001-0001-000000000001', 'ALF-008', 'Mercimek Kırmızı 1 Kg',  'ADET', 'Bakliyat',   '8690000000008'),
  ('aaaaaaaa-0001-0001-0001-000000000001', 'ALF-009', 'Tuz 1 Kg',               'ADET', 'Baharat',    '8690000000009'),
  ('aaaaaaaa-0001-0001-0001-000000000001', 'ALF-010', 'Nohut 1 Kg',             'ADET', 'Bakliyat',   '8690000000010'),
  ('aaaaaaaa-0001-0001-0001-000000000001', 'ALF-011', 'Sıvı Deterjan 3L',       'ADET', 'Temizlik',   '8690000000011'),
  ('aaaaaaaa-0001-0001-0001-000000000001', 'ALF-012', 'Çamaşır Suyu 3L',        'ADET', 'Temizlik',   '8690000000012')
ON CONFLICT (isletme_id, urun_kodu) DO NOTHING;

-- ── 4. Demo Ürünler — Beta Teknoloji ────────────────────────
INSERT INTO isletme_urunler (isletme_id, urun_kodu, urun_adi, birim, kategori, barkodlar) VALUES
  ('aaaaaaaa-0002-0002-0002-000000000002', 'BET-001', 'USB-C Kablo 1m',          'ADET', 'Aksesuar',   '8691000000001'),
  ('aaaaaaaa-0002-0002-0002-000000000002', 'BET-002', 'HDMI Kablo 2m',           'ADET', 'Aksesuar',   '8691000000002'),
  ('aaaaaaaa-0002-0002-0002-000000000002', 'BET-003', 'Kablosuz Mouse',          'ADET', 'Çevre Birimi','8691000000003'),
  ('aaaaaaaa-0002-0002-0002-000000000002', 'BET-004', 'Mekanik Klavye',          'ADET', 'Çevre Birimi','8691000000004'),
  ('aaaaaaaa-0002-0002-0002-000000000002', 'BET-005', 'USB Hub 4 Port',          'ADET', 'Aksesuar',   '8691000000005'),
  ('aaaaaaaa-0002-0002-0002-000000000002', 'BET-006', 'SSD 512GB',               'ADET', 'Depolama',   '8691000000006'),
  ('aaaaaaaa-0002-0002-0002-000000000002', 'BET-007', 'Ram DDR4 8GB',            'ADET', 'Bileşen',    '8691000000007'),
  ('aaaaaaaa-0002-0002-0002-000000000002', 'BET-008', 'Monitör 24" FHD',         'ADET', 'Ekran',      '8691000000008'),
  ('aaaaaaaa-0002-0002-0002-000000000002', 'BET-009', 'Laptop Stand',            'ADET', 'Aksesuar',   '8691000000009'),
  ('aaaaaaaa-0002-0002-0002-000000000002', 'BET-010', 'Webcam 1080p',            'ADET', 'Çevre Birimi','8691000000010')
ON CONFLICT (isletme_id, urun_kodu) DO NOTHING;

-- ── 5. Admin'i her iki işletmeye ata ────────────────────────
-- NOT: Aşağıdaki satırda admin kullanıcı id'sini gir
-- Supabase Dashboard > Authentication > Users > admin kullanıcının UUID'si
-- Örnek: ADMIN_UUID yerine gerçek UUID yaz

-- INSERT INTO kullanici_isletme (kullanici_id, isletme_id) VALUES
--   ('ADMIN_UUID', 'aaaaaaaa-0001-0001-0001-000000000001'),
--   ('ADMIN_UUID', 'aaaaaaaa-0002-0002-0002-000000000002')
-- ON CONFLICT (kullanici_id, isletme_id) DO NOTHING;

-- ── VEYA: Mevcut tüm kullanıcıları tüm işletmelere ata (test için) ──
INSERT INTO kullanici_isletme (kullanici_id, isletme_id)
  SELECT k.id, i.id
  FROM kullanicilar k
  CROSS JOIN isletmeler i
  WHERE i.id IN (
    'aaaaaaaa-0001-0001-0001-000000000001',
    'aaaaaaaa-0002-0002-0002-000000000002'
  )
ON CONFLICT (kullanici_id, isletme_id) DO NOTHING;

-- ── 6. Demo Sayımlar (mevcut kullanıcılar için) ─────────────
INSERT INTO sayimlar (isletme_id, depo_id, kullanici_id, ad, tarih, durum)
  SELECT
    'aaaaaaaa-0001-0001-0001-000000000001',
    'bbbbbbbb-0001-0001-0001-000000000001',
    k.id,
    'Mart 2026 Sayımı',
    '2026-03-01',
    'devam'
  FROM kullanicilar k
ON CONFLICT DO NOTHING;

-- ── Özet ────────────────────────────────────────────────────
-- 2 işletme, 4 depo, 22 ürün eklendi.
-- Tüm mevcut kullanıcılar her iki işletmeye atandı.
