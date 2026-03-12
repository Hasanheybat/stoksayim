-- ============================================================
-- Migration: isim_2 kolonu + kullanıcı ataması
-- Supabase SQL Editor'de çalıştır (1 kez)
-- ============================================================

-- 1. isim_2 kolonu ekle (zaten varsa atla)
ALTER TABLE isletme_urunler
  ADD COLUMN IF NOT EXISTS isim_2 VARCHAR(500) DEFAULT '';

-- 2. Mevcut tüm kullanıcıları demo işletmelerine ata (zaten atanmışsa atla)
INSERT INTO kullanici_isletme (kullanici_id, isletme_id)
  SELECT k.id, i.id
  FROM kullanicilar k
  CROSS JOIN isletmeler i
  WHERE i.id IN (
    'aaaaaaaa-0001-0001-0001-000000000001',
    'aaaaaaaa-0002-0002-0002-000000000002'
  )
ON CONFLICT (kullanici_id, isletme_id) DO NOTHING;

-- Tamamlandı.
