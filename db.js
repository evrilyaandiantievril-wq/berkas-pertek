/**
 * db.js
 * - Menginisialisasi SQLite database dan membuat tabel `berkas` jika belum ada.
 * - Jika dijalankan dengan --init akan membuat file database dan keluar.
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const DB_FILE = path.join(__dirname, 'database.sqlite');
const CREATE_SQL = `
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
`;

// create DB file & table
function initDb() {
  const db = new sqlite3.Database(DB_FILE);
  db.serialize(() => {
    db.run(CREATE_SQL);
  });
  db.close();
}

// If run directly with --init, create DB and exit
if (require.main === module) {
  if (!fs.existsSync(DB_FILE)) {
    console.log('Membuat database baru di', DB_FILE);
  } else {
    console.log('Database sudah ada di', DB_FILE);
  }
  initDb();
  console.log('Inisialisasi DB selesai.');
  process.exit(0);
}

module.exports = {
  DB_FILE,
  initDb,
  sqlite3
};
