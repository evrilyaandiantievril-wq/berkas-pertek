/**
 * server.js
 * - Express server: REST API untuk CRUD berkas
 * - Menyajikan static frontend dari folder /public
 */

const express = require('express');
const path = require('path');
const fs = require('fs');
const { initDb, DB_FILE, sqlite3 } = require('./db');

const PORT = process.env.PORT || 3000;
const app = express();

// Pastikan DB sudah ada
if (!fs.existsSync(DB_FILE)) {
  initDb();
}

const db = new sqlite3.Database(DB_FILE);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// API: ambil semua berkas (opsional q untuk pencarian server-side)
app.get('/api/berkas', (req, res) => {
  const q = req.query.q;
  let sql = 'SELECT * FROM berkas';
  const params = [];
  if (q) {
    // Cari di beberapa kolom
    sql += ` WHERE nomor LIKE ? OR perusahaan LIKE ? OR desa LIKE ? OR kecamatan LIKE ? OR peruntukan LIKE ?`;
    const pat = `%${q}%`;
    params.push(pat, pat, pat, pat, pat);
  }
  sql += ' ORDER BY created_at DESC';
  db.all(sql, params, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// API: ambil satu berkas by id
app.get('/api/berkas/:id', (req, res) => {
  const id = req.params.id;
  db.get('SELECT * FROM berkas WHERE id = ?', [id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: 'Not found' });
    res.json(row);
  });
});

// API: create
app.post('/api/berkas', (req, res) => {
  const { nomor, tanggal_direktur, perusahaan, desa, kecamatan, luas, peruntukan } = req.body;
  const sql = `INSERT INTO berkas (nomor, tanggal_direktur, perusahaan, desa, kecamatan, luas, peruntukan) VALUES (?, ?, ?, ?, ?, ?, ?)`;
  db.run(sql, [nomor, tanggal_direktur, perusahaan, desa, kecamatan, luas || null, peruntukan], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    db.get('SELECT * FROM berkas WHERE id = ?', [this.lastID], (err2, row) => {
      if (err2) return res.status(500).json({ error: err2.message });
      res.status(201).json(row);
    });
  });
});

// API: update
app.put('/api/berkas/:id', (req, res) => {
  const id = req.params.id;
  const { nomor, tanggal_direktur, perusahaan, desa, kecamatan, luas, peruntukan } = req.body;
  const sql = `UPDATE berkas SET nomor=?, tanggal_direktur=?, perusahaan=?, desa=?, kecamatan=?, luas=?, peruntukan=?, updated_at=CURRENT_TIMESTAMP WHERE id=?`;
  db.run(sql, [nomor, tanggal_direktur, perusahaan, desa, kecamatan, luas || null, peruntukan, id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    db.get('SELECT * FROM berkas WHERE id = ?', [id], (err2, row) => {
      if (err2) return res.status(500).json({ error: err2.message });
      res.json(row);
    });
  });
});

// API: delete
app.delete('/api/berkas/:id', (req, res) => {
  const id = req.params.id;
  db.run('DELETE FROM berkas WHERE id = ?', [id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ deleted: this.changes });
  });
});

// Fallback: serve index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start
app.listen(PORT, () => {
  console.log(`Server berjalan di http://localhost:${PORT}`);
});
