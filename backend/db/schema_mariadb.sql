-- ============================================================
-- StokSay — MariaDB Veritabanı Şeması
-- phpMyAdmin SQL sekmesinde veya CLI'da çalıştır
-- ============================================================

SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;

-- ============================================================
-- 1. İşletmeler
-- ============================================================
CREATE TABLE IF NOT EXISTS isletmeler (
  id         CHAR(36)     NOT NULL PRIMARY KEY DEFAULT (UUID()),
  ad         VARCHAR(200) NOT NULL,
  kod        VARCHAR(50)  NOT NULL,
  adres      TEXT,
  telefon    VARCHAR(20),
  aktif      TINYINT(1)   DEFAULT 1,
  created_at DATETIME     DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_isletme_kod (kod)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 2. Depolar
-- ============================================================
CREATE TABLE IF NOT EXISTS depolar (
  id         CHAR(36)     NOT NULL PRIMARY KEY DEFAULT (UUID()),
  isletme_id CHAR(36)     NOT NULL,
  ad         VARCHAR(200) NOT NULL,
  kod        VARCHAR(50),
  konum      TEXT,
  aktif      TINYINT(1)   DEFAULT 1,
  created_at DATETIME     DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_depo_isletme_kod (isletme_id, kod),
  CONSTRAINT fk_depo_isletme FOREIGN KEY (isletme_id) REFERENCES isletmeler(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 3. Roller (Yetki Şablonları)
-- ============================================================
CREATE TABLE IF NOT EXISTS roller (
  id         CHAR(36)     NOT NULL PRIMARY KEY DEFAULT (UUID()),
  ad         VARCHAR(100) NOT NULL,
  yetkiler   JSON         NOT NULL,
  sistem     TINYINT(1)   DEFAULT 0,
  created_at DATETIME     DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_rol_ad (ad)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 4. Kullanıcılar (kendi auth sistemi — password_hash eklendi)
-- ============================================================
CREATE TABLE IF NOT EXISTS kullanicilar (
  id            CHAR(36)     NOT NULL PRIMARY KEY DEFAULT (UUID()),
  ad_soyad      VARCHAR(200) NOT NULL,
  email         VARCHAR(200) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  rol           VARCHAR(20)  DEFAULT 'kullanici',
  telefon       VARCHAR(20),
  aktif         TINYINT(1)   DEFAULT 1,
  ayarlar       JSON         DEFAULT NULL,
  created_at    DATETIME     DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_kullanici_email (email),
  CHECK (rol IN ('admin','kullanici'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 5. Kullanıcı–İşletme Atama + Yetkiler
-- ============================================================
CREATE TABLE IF NOT EXISTS kullanici_isletme (
  id           CHAR(36)   NOT NULL PRIMARY KEY DEFAULT (UUID()),
  kullanici_id CHAR(36)   NOT NULL,
  isletme_id   CHAR(36)   NOT NULL,
  rol_id       CHAR(36)   DEFAULT NULL,
  yetkiler     JSON       NOT NULL,
  aktif        TINYINT(1) DEFAULT 1,
  created_at   DATETIME   DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_kullanici_isletme (kullanici_id, isletme_id),
  CONSTRAINT fk_ki_kullanici FOREIGN KEY (kullanici_id) REFERENCES kullanicilar(id) ON DELETE CASCADE,
  CONSTRAINT fk_ki_isletme   FOREIGN KEY (isletme_id)   REFERENCES isletmeler(id)   ON DELETE CASCADE,
  CONSTRAINT fk_ki_rol       FOREIGN KEY (rol_id)       REFERENCES roller(id)       ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 6. İşletme Ürünleri
-- ============================================================
CREATE TABLE IF NOT EXISTS isletme_urunler (
  id                       CHAR(36)     NOT NULL PRIMARY KEY DEFAULT (UUID()),
  isletme_id               CHAR(36)     NOT NULL,
  urun_kodu                VARCHAR(100) NOT NULL,
  urun_adi                 VARCHAR(500) NOT NULL,
  isim_2                   VARCHAR(500) DEFAULT '',
  birim                    VARCHAR(50)  DEFAULT 'ADET',
  kategori                 VARCHAR(100),
  aciklama                 TEXT,
  barkodlar                VARCHAR(5000) DEFAULT '',
  admin_version            INT          DEFAULT 1,
  kullanici_guncelledi     TINYINT(1)   DEFAULT 0,
  guncelleme_kaynagi       VARCHAR(20)  DEFAULT 'admin',
  son_guncelleme           DATETIME     DEFAULT CURRENT_TIMESTAMP,
  guncelleyen_kullanici_id CHAR(36)     DEFAULT NULL,
  aktif                    TINYINT(1)   DEFAULT 1,
  created_at               DATETIME     DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_isletme_urun (isletme_id, urun_kodu),
  INDEX idx_urun_isletme_aktif (isletme_id, aktif),
  CONSTRAINT fk_urun_isletme    FOREIGN KEY (isletme_id)               REFERENCES isletmeler(id)   ON DELETE CASCADE,
  CONSTRAINT fk_urun_guncelleyen FOREIGN KEY (guncelleyen_kullanici_id) REFERENCES kullanicilar(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 7. Sayımlar
-- ============================================================
CREATE TABLE IF NOT EXISTS sayimlar (
  id           CHAR(36)     NOT NULL PRIMARY KEY DEFAULT (UUID()),
  isletme_id   CHAR(36)     NOT NULL,
  depo_id      CHAR(36)     NOT NULL,
  kullanici_id CHAR(36)     NOT NULL,
  ad           VARCHAR(300) NOT NULL,
  tarih        DATE         NOT NULL DEFAULT (CURRENT_DATE),
  durum        VARCHAR(30)  DEFAULT 'devam',
  kisiler      TEXT         DEFAULT NULL,
  notlar       TEXT,
  created_at   DATETIME     DEFAULT CURRENT_TIMESTAMP,
  updated_at   DATETIME     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CHECK (durum IN ('devam','tamamlandi','silindi')),
  INDEX idx_sayim_isletme (isletme_id),
  INDEX idx_sayim_depo (depo_id),
  INDEX idx_sayim_kullanici (kullanici_id),
  CONSTRAINT fk_sayim_isletme   FOREIGN KEY (isletme_id)   REFERENCES isletmeler(id),
  CONSTRAINT fk_sayim_depo      FOREIGN KEY (depo_id)      REFERENCES depolar(id),
  CONSTRAINT fk_sayim_kullanici FOREIGN KEY (kullanici_id) REFERENCES kullanicilar(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 8. Sayım Kalemleri
-- ============================================================
CREATE TABLE IF NOT EXISTS sayim_kalemleri (
  id         CHAR(36)      NOT NULL PRIMARY KEY DEFAULT (UUID()),
  sayim_id   CHAR(36)      NOT NULL,
  urun_id    CHAR(36)      NOT NULL,
  miktar     DECIMAL(12,3) NOT NULL,
  birim      VARCHAR(50)   NOT NULL,
  notlar     TEXT,
  created_at DATETIME      DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME      DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_kalem_sayim (sayim_id),
  CONSTRAINT fk_kalem_sayim FOREIGN KEY (sayim_id) REFERENCES sayimlar(id) ON DELETE CASCADE,
  CONSTRAINT fk_kalem_urun  FOREIGN KEY (urun_id)  REFERENCES isletme_urunler(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 9. Ürün Log (Değişiklik geçmişi)
-- ============================================================
CREATE TABLE IF NOT EXISTS urun_log (
  id           CHAR(36)    NOT NULL PRIMARY KEY DEFAULT (UUID()),
  urun_id      CHAR(36)    NOT NULL,
  isletme_id   CHAR(36)    NOT NULL,
  kullanici_id CHAR(36)    DEFAULT NULL,
  islem        VARCHAR(30),
  onceki_deger JSON,
  yeni_deger   JSON,
  created_at   DATETIME    DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_log_urun      FOREIGN KEY (urun_id)      REFERENCES isletme_urunler(id),
  CONSTRAINT fk_log_kullanici  FOREIGN KEY (kullanici_id) REFERENCES kullanicilar(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
