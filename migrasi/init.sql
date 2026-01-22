-- migrations/init.sql
-- Skema tabel berkas
CREATE TABLE IF NOT EXISTS berkas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nomor TEXT NOT NULL,
  tanggal_direktur TEXT,
  perusahaan TEXT,
  desa TEXT,
  kecamatan TEXT,
  luas REAL,
  peruntukan TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
