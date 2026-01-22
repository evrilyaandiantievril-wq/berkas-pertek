const apiBase = '/api/berkas';
const tableBody = document.getElementById('tableBody');
const searchInput = document.getElementById('searchInput');
const btnSearch = document.getElementById('btnSearch');
const btnRefresh = document.getElementById('btnRefresh');
const btnTambah = document.getElementById('btnTambah');
const selectLimit = document.getElementById('selectLimit');
const btnPrev = document.getElementById('btnPrev');
const btnNext = document.getElementById('btnNext');
const pageInfo = document.getElementById('pageInfo');

const modalTitle = document.getElementById('modalTitle');
const formBerkas = document.getElementById('formBerkas');
const berkasId = document.getElementById('berkasId');
const nomor = document.getElementById('nomor');
const tanggal = document.getElementById('tanggal');
const direktur = document.getElementById('direktur');
const perusahaan = document.getElementById('perusahaan');
const desa = document.getElementById('desa');
const kecamatan = document.getElementById('kecamatan');
const luas = document.getElementById('luas');
const peruntukan = document.getElementById('peruntukan');
const btnSave = document.getElementById('btnSave');
const modalEl = document.getElementById('modalForm');
const modal = new bootstrap.Modal(modalEl);

// state
let currentPage = 1;
let totalPages = 1;
let currentLimit = Number(selectLimit.value || 10);
let currentSortBy = 'id';
let currentSortDir = 'DESC';
let currentQuery = '';

// Helpers
function formatDate(d) {
  if (!d) return '';
  const dt = new Date(d);
  if (isNaN(dt)) return d;
  return dt.toLocaleDateString('id-ID');
}

function escapeHtml(text) {
  if (!text) return '';
  return String(text).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
}

async function fetchData({ q = '', page = 1, limit = 10, sortBy = 'id', sortDir = 'DESC' } = {}) {
  try {
    const params = new URLSearchParams();
    if (q) params.append('q', q);
    params.append('page', String(page));
    params.append('limit', String(limit));
    params.append('sortBy', sortBy);
    params.append('sortDir', sortDir);
    const url = `${apiBase}?${params.toString()}`;
    const res = await fetch(url);
    const json = await res.json();
    return json;
  } catch (err) {
    console.error('Fetch data error', err);
    return { data: [], total: 0, page: 1, limit, totalPages: 1 };
  }
}

function renderRows(rows) {
  tableBody.innerHTML = '';
  if (!rows.length) {
    tableBody.innerHTML = `<tr><td colspan="10" class="text-center text-muted py-3">Tidak ada data</td></tr>`;
    return;
  }
  rows.forEach((r, idx) => {
    const number = (currentPage - 1) * currentLimit + idx + 1;
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="fw-semibold">${number}</td>
      <td>${escapeHtml(r.nomor || '')}</td>
      <td>${formatDate(r.tanggal)}</td>
      <td>${escapeHtml(r.direktur || '')}</td>
      <td>${escapeHtml(r.perusahaan || '')}</td>
      <td>${escapeHtml(r.desa || '')}</td>
      <td>${escapeHtml(r.kecamatan || '')}</td>
      <td>${r.luas ?? ''}</td>
      <td>${escapeHtml(r.peruntukan || '')}</td>
      <td>
        <div class="btn-group" role="group">
          <button class="btn btn-sm btn-primary btn-edit" data-id="${r.id}">Edit</button>
          <button class="btn btn-sm btn-danger btn-delete" data-id="${r.id}">Delete</button>
        </div>
      </td>
    `;
    tableBody.appendChild(tr);
  });

  // Attach handlers
  document.querySelectorAll('.btn-edit').forEach(b => {
    b.addEventListener('click', onEditClick);
  });
  document.querySelectorAll('.btn-delete').forEach(b => {
    b.addEventListener('click', onDeleteClick);
  });
}

function updatePaginationControls() {
  pageInfo.textContent = `Page ${currentPage} of ${totalPages} (${totalItemsText})`;
  btnPrev.disabled = currentPage <= 1;
  btnNext.disabled = currentPage >= totalPages;
}

// totalItemsText is set in loadAndRender when response arrives
let totalItemsText = '';

async function loadAndRender(page = 1) {
  currentPage = page;
  btnSearch.disabled = true;
  btnRefresh.disabled = true;
  btnPrev.disabled = true;
  btnNext.disabled = true;

  const resp = await fetchData({
    q: currentQuery,
    page: currentPage,
    limit: currentLimit,
    sortBy: currentSortBy,
    sortDir: currentSortDir
  });

  const rows = resp.data || [];
  renderRows(rows);

  totalPages = resp.totalPages || 1;
  currentPage = resp.page || 1;
  currentLimit = resp.limit || currentLimit;
  totalItemsText = resp.total !== undefined ? `${resp.total} items` : '';
  updatePaginationControls();

  // update sort indicators
  document.querySelectorAll('th.sortable').forEach(th => {
    const s = th.dataset.sort;
    const span = th.querySelector('.sort-indicator');
    if (!span) return;
    if (s === currentSortBy) {
      span.textContent = currentSortDir === 'ASC' ? '▲' : '▼';
      span.style.color = '#fff';
    } else {
      span.textContent = '';
      span.style.color = '#e9ecef';
    }
  });

  btnSearch.disabled = false;
  btnRefresh.disabled = false;
}

// Events
btnSearch.addEventListener('click', () => {
  currentQuery = searchInput.value.trim();
  loadAndRender(1);
});
btnRefresh.addEventListener('click', () => {
  searchInput.value = '';
  currentQuery = '';
  loadAndRender(1);
});

selectLimit.addEventListener('change', () => {
  currentLimit = Number(selectLimit.value);
  loadAndRender(1);
});

btnPrev.addEventListener('click', () => {
  if (currentPage > 1) loadAndRender(currentPage - 1);
});
btnNext.addEventListener('click', () => {
  if (currentPage < totalPages) loadAndRender(currentPage + 1);
});

// Sorting by clicking headers
document.querySelectorAll('th.sortable').forEach(th => {
  th.addEventListener('click', () => {
    const key = th.dataset.sort;
    if (!key) return;
    if (currentSortBy === key) {
      currentSortDir = currentSortDir === 'ASC' ? 'DESC' : 'ASC';
    } else {
      currentSortBy = key;
      currentSortDir = 'ASC';
    }
    loadAndRender(1);
  });
});

btnTambah.addEventListener('click', () => {
  modalTitle.textContent = 'Tambah Berkas';
  berkasId.value = '';
  formBerkas.reset();
  // default tanggal hari ini
  const today = new Date().toISOString().slice(0,10);
  tanggal.value = today;
});

// Submit (Tambah / Edit)
formBerkas.addEventListener('submit', async (e) => {
  e.preventDefault();
  btnSave.disabled = true;

  const payload = {
    nomor: nomor.value.trim(),
    tanggal: tanggal.value,
    direktur: direktur.value.trim(),
    perusahaan: perusahaan.value.trim(),
    desa: desa.value.trim(),
    kecamatan: kecamatan.value.trim(),
    luas: luas.value ? Number(luas.value) : 0,
    peruntukan: peruntukan.value.trim()
  };

  try {
    if (berkasId.value) {
      // Edit
      const id = berkasId.value;
      const res = await fetch(`${apiBase}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        const err = await res.json().catch(()=>({error:'Update gagal'}));
        throw new Error(err.error || 'Update gagal');
      }
    } else {
      // Create
      const res = await fetch(apiBase, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        const err = await res.json().catch(()=>({error:'Simpan gagal'}));
        throw new Error(err.error || 'Simpan gagal');
      }
    }
    modal.hide();
    await loadAndRender(currentPage);
  } catch (err) {
    alert('Terjadi kesalahan: ' + err.message);
  } finally {
    btnSave.disabled = false;
  }
});

async function onEditClick(e) {
  const id = e.currentTarget.dataset.id;
  try {
    const res = await fetch(`${apiBase}/${id}`);
    if (!res.ok) throw new Error('Gagal mengambil data');
    const json = await res.json();
    const row = json.data;
    if (!row) return alert('Data tidak ditemukan');
    fillFormForEdit(row);
    modalTitle.textContent = 'Edit Berkas';
    modal.show();
  } catch (err) {
    console.error(err);
    alert('Gagal mengambil data untuk edit.');
  }
}

function fillFormForEdit(row) {
  berkasId.value = row.id;
  nomor.value = row.nomor || '';
  tanggal.value = row.tanggal ? row.tanggal.slice(0,10) : '';
  direktur.value = row.direktur || '';
  perusahaan.value = row.perusahaan || '';
  desa.value = row.desa || '';
  kecamatan.value = row.kecamatan || '';
  luas.value = row.luas ?? '';
  peruntukan.value = row.peruntukan || '';
}

async function onDeleteClick(e) {
  const id = e.currentTarget.dataset.id;
  if (!confirm('Hapus berkas ini? Aksi tidak dapat dibatalkan.')) return;
  try {
    const res = await fetch(`${apiBase}/${id}`, { method: 'DELETE' });
    if (!res.ok) {
      const err = await res.json().catch(()=>({error:'Delete gagal'}));
      throw new Error(err.error || 'Delete gagal');
    }
    // Jika setelah hapus halaman saat ini kosong dan bukan halaman 1, pindah satu halaman ke belakang
    await loadAndRender(currentPage);
    // If current page now has no data and currentPage>1, go back one page
    const tbl = document.getElementById('tableBody');
    if (tbl && tbl.children.length === 1) {
      const only = tbl.children[0];
      if (only && only.textContent.includes('Tidak ada data') && currentPage > 1) {
        loadAndRender(currentPage - 1);
      }
    }
  } catch (err) {
    console.error(err);
    alert('Gagal menghapus: ' + err.message);
  }
}

// initial load
loadAndRender();
