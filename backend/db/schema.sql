-- ============================================================
-- StokSay — Veritabanı Şeması
-- Supabase SQL Editor'de çalıştır
-- ============================================================

-- ============================================================
-- 1. İşletmeler
-- ============================================================
CREATE TABLE isletmeler (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ad         VARCHAR(200) NOT NULL,
  kod        VARCHAR(50)  UNIQUE NOT NULL,
  adres      TEXT,
  telefon    VARCHAR(20),
  aktif      BOOLEAN      DEFAULT TRUE,
  created_at TIMESTAMPTZ  DEFAULT NOW(),
  updated_at TIMESTAMPTZ  DEFAULT NOW()
);

-- ============================================================
-- 2. Depolar
-- ============================================================
CREATE TABLE depolar (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  isletme_id UUID NOT NULL REFERENCES isletmeler(id) ON DELETE CASCADE,
  ad         VARCHAR(200) NOT NULL,
  kod        VARCHAR(50),
  konum      TEXT,
  aktif      BOOLEAN     DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(isletme_id, kod)
);

-- ============================================================
-- 3. Kullanıcılar (Supabase auth.users ile bağlantılı)
-- ============================================================
CREATE TABLE kullanicilar (
  id         UUID PRIMARY KEY REFERENCES auth.users(id),
  ad_soyad   VARCHAR(200) NOT NULL,
  email      VARCHAR(200) UNIQUE NOT NULL,
  rol        VARCHAR(20)  DEFAULT 'kullanici'
               CHECK (rol IN ('admin','kullanici')),
  telefon    VARCHAR(20),
  aktif      BOOLEAN DEFAULT TRUE,
  ayarlar    JSONB DEFAULT '{
    "birim_otomatik": true,
    "barkod_sesi":    true,
    "tema":           "light"
  }',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 4. Kullanıcı–İşletme Atama + Yetkiler
-- ============================================================
CREATE TABLE kullanici_isletme (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kullanici_id UUID NOT NULL REFERENCES kullanicilar(id) ON DELETE CASCADE,
  isletme_id   UUID NOT NULL REFERENCES isletmeler(id)  ON DELETE CASCADE,
  yetkiler     JSONB NOT NULL DEFAULT '{
    "urun":   { "goruntule":true, "ekle":false, "duzenle":false, "sil":false },
    "depo":   { "goruntule":true, "ekle":false, "duzenle":false, "sil":false },
    "sayim":  { "goruntule":true, "ekle":true,  "duzenle":false, "sil":false }
  }',
  aktif       BOOLEAN     DEFAULT TRUE,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(kullanici_id, isletme_id)
);

-- ============================================================
-- 5. İşletme Ürünleri (Ana ürün tablosu)
-- ============================================================
CREATE TABLE isletme_urunler (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  isletme_id  UUID NOT NULL REFERENCES isletmeler(id) ON DELETE CASCADE,

  urun_kodu   VARCHAR(100) NOT NULL,
  urun_adi    VARCHAR(500) NOT NULL,   -- İsim 1: Sayım ismi (günlük kullanılan ad)
  isim_2      VARCHAR(500) DEFAULT '', -- İsim 2: Stok ismi (sistem / resmi ad)
  birim       VARCHAR(50)  DEFAULT 'ADET',
  kategori    VARCHAR(100),
  aciklama    TEXT,

  -- Virgülle ayrılmış barkod string'i
  -- Örnek: "8690814000015,8691234567890"
  barkodlar   TEXT DEFAULT '',

  -- Çakışma yönetimi
  admin_version            INTEGER     DEFAULT 1,
  kullanici_guncelledi     BOOLEAN     DEFAULT FALSE,
  guncelleme_kaynagi       VARCHAR(20) DEFAULT 'admin',
  son_guncelleme           TIMESTAMPTZ DEFAULT NOW(),
  guncelleyen_kullanici_id UUID REFERENCES kullanicilar(id),

  aktif      BOOLEAN     DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(isletme_id, urun_kodu)
);

-- Barkod araması için GIN index
CREATE INDEX idx_urun_barkod
  ON isletme_urunler USING gin(to_tsvector('simple', barkodlar));

-- ============================================================
-- 6. Sayımlar
-- ============================================================
CREATE TABLE sayimlar (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  isletme_id   UUID NOT NULL REFERENCES isletmeler(id),
  depo_id      UUID NOT NULL REFERENCES depolar(id),
  kullanici_id UUID NOT NULL REFERENCES kullanicilar(id),
  ad           VARCHAR(300) NOT NULL,
  tarih        DATE         NOT NULL DEFAULT CURRENT_DATE,
  durum        VARCHAR(30)  DEFAULT 'devam'
                 CHECK (durum IN ('devam','tamamlandi')),
  notlar       TEXT,
  created_at   TIMESTAMPTZ  DEFAULT NOW(),
  updated_at   TIMESTAMPTZ  DEFAULT NOW()
);

-- ============================================================
-- 7. Sayım Kalemleri
-- ============================================================
CREATE TABLE sayim_kalemleri (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sayim_id  UUID NOT NULL REFERENCES sayimlar(id) ON DELETE CASCADE,
  urun_id   UUID NOT NULL REFERENCES isletme_urunler(id),
  miktar    DECIMAL(12,3) NOT NULL,
  birim     VARCHAR(50)   NOT NULL,
  notlar    TEXT,
  created_at TIMESTAMPTZ  DEFAULT NOW(),
  updated_at TIMESTAMPTZ  DEFAULT NOW()
);

-- ============================================================
-- 8. Ürün Log (Değişiklik geçmişi)
-- ============================================================
CREATE TABLE urun_log (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  urun_id      UUID NOT NULL REFERENCES isletme_urunler(id),
  isletme_id   UUID NOT NULL,
  kullanici_id UUID REFERENCES kullanicilar(id),
  islem        VARCHAR(30),
  onceki_deger JSONB,
  yeni_deger   JSONB,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- updated_at otomatik güncelleme trigger'ı
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_isletmeler_updated_at
  BEFORE UPDATE ON isletmeler
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_depolar_updated_at
  BEFORE UPDATE ON depolar
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_kullanicilar_updated_at
  BEFORE UPDATE ON kullanicilar
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_sayimlar_updated_at
  BEFORE UPDATE ON sayimlar
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_sayim_kalemleri_updated_at
  BEFORE UPDATE ON sayim_kalemleri
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- Row Level Security (RLS) Politikaları
-- ============================================================

-- kullanicilar: sadece kendi kaydını okuyabilir
ALTER TABLE kullanicilar ENABLE ROW LEVEL SECURITY;

CREATE POLICY "kullanici_kendi_kaydini_okur"
  ON kullanicilar FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "kullanici_kendi_kaydini_gunceller"
  ON kullanicilar FOR UPDATE
  USING (auth.uid() = id);

-- isletme_urunler: sadece atandığı işletmelerin ürünlerini okuyabilir
ALTER TABLE isletme_urunler ENABLE ROW LEVEL SECURITY;

CREATE POLICY "kullanici_atandigi_isletme_urunleri"
  ON isletme_urunler FOR SELECT
  USING (
    isletme_id IN (
      SELECT isletme_id FROM kullanici_isletme
      WHERE kullanici_id = auth.uid() AND aktif = TRUE
    )
  );

-- sayimlar: sadece kendi sayımlarını okuyabilir
ALTER TABLE sayimlar ENABLE ROW LEVEL SECURITY;

CREATE POLICY "kullanici_kendi_sayimlari"
  ON sayimlar FOR SELECT
  USING (kullanici_id = auth.uid());

CREATE POLICY "kullanici_sayim_ekleyebilir"
  ON sayimlar FOR INSERT
  WITH CHECK (kullanici_id = auth.uid());

CREATE POLICY "kullanici_kendi_sayimini_gunceller"
  ON sayimlar FOR UPDATE
  USING (kullanici_id = auth.uid());

-- sayim_kalemleri: kendi sayımlarının kalemlerini yönetebilir
ALTER TABLE sayim_kalemleri ENABLE ROW LEVEL SECURITY;

CREATE POLICY "kullanici_kendi_sayim_kalemleri"
  ON sayim_kalemleri FOR ALL
  USING (
    sayim_id IN (
      SELECT id FROM sayimlar WHERE kullanici_id = auth.uid()
    )
  );

-- ============================================================
-- Admin: RLS bypass için service role kullanılır
-- Backend'de SUPABASE_SERVICE_ROLE_KEY ile bağlanılınca
-- tüm RLS politikaları atlanır (admin işlemleri için)
-- ============================================================
