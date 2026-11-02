-- Struktur database kuesioner WKI (MySQL 5.7+/MariaDB 10.3+).
-- Jalankan sekali di phpMyAdmin: pilih database u443105861_quiz → tab SQL → tempel → Go.
-- Aman dijalankan ulang (tidak menghapus data yang sudah ada).

CREATE TABLE IF NOT EXISTS responses (
  id               CHAR(36)      NOT NULL,              -- ID unik dari browser (mencegah data ganda)
  version          VARCHAR(16)   NOT NULL,              -- versi kuesioner
  submitted_at     DATETIME      NOT NULL,              -- waktu diterima server
  started_at       DATETIME      NULL,                  -- waktu mulai mengisi (dari browser)
  duration_minutes DECIMAL(6,1)  NULL,                  -- lama pengisian
  divisi           VARCHAR(255)  NULL,                  -- salinan jawaban 1.4, untuk filter cepat
  peran            VARCHAR(100)  NULL,                  -- salinan jawaban 1.6, untuk filter cepat
  answers          LONGTEXT      NOT NULL,              -- JSON: { "nama kolom": nilai, ... }
  raw              LONGTEXT      NULL,                  -- JSON jawaban mentah (cadangan)
  created_at       TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_submitted (submitted_at),
  KEY idx_divisi (divisi(64)),
  KEY idx_peran (peran)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Baris tabel isian berulang (2.6 tarif vendor, 4.4 kebutuhan alat):
-- satu baris per alat.
CREATE TABLE IF NOT EXISTS response_items (
  id          INT UNSIGNED      NOT NULL AUTO_INCREMENT,
  response_id CHAR(36)          NOT NULL,
  table_name  VARCHAR(100)      NOT NULL,               -- mis. "4.2 Kebutuhan alat"
  row_no      SMALLINT UNSIGNED NOT NULL,
  data        LONGTEXT          NOT NULL,               -- JSON: { "Jenis dan kapasitas alat": "...", ... }
  PRIMARY KEY (id),
  KEY idx_response (response_id),
  KEY idx_table (table_name),
  CONSTRAINT fk_items_response FOREIGN KEY (response_id) REFERENCES responses (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
