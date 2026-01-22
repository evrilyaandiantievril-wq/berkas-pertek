// public/app.js
// Interaksi frontend: fetch API, DataTables, modal add/edit/delete

let table;
let currentDeleteId = null;
const modalEl = new bootstrap.Modal(document.getElementById('modalForm'));
const modalDeleteEl = new bootstrap.Modal(document.getElementById('modalDelete'));

function formatDate(d) {
  if (!d) return '';
  const dt = new Date(d);
  if (isNaN(dt)) return d;
  return dt.toLocaleDateString('id-ID');
}

async function fetchBerkas(q) {
  const url = q ? `/api/berkas?q=${encodeURIComponent(q)}` : '/api/berkas';
  const res = await fetch(url);
  const data = await res.json();
  return data;
}

function renderTable(data) {
  if (!table) {
    table = $('#tableBerkas').DataTable({
      data,
      columns: [
        { data: null, render: (data, type, row, meta) => meta.row + 1 },
        { data: 'nomor' },
        { data: 'tanggal_direktur', render: d => formatDate(d) },
        { data: 'perusahaan' },
        { data: 'desa' },
        { data: 'kecamatan' },
        { data: 'luas', render: v => v ? Number(v).toLocaleString('id-ID') : '' },
        { data: 'peruntukan' },
        {
          data: null,
          orderable: false,
          render: (data, type, row) => {
            return `
              <div class="btn-group" role="group" aria-label="aksi">
                <button class="btn btn-sm btn-outline-primary btn-edit" data-id="${row.id}"><i class="bi bi-pencil-fill"></i></button>
                <button class="btn btn-sm btn-outline-danger btn-delete" data-id="${row.id}"><i class="bi bi-trash-fill"></i></button>
              </div>
            `;
          }
        }
      ],
      pageLength: 10,
      lengthMenu: [5,10,25,50],
      responsive: true
    });

    // Delegated event listeners
    $('#tableBerkas tbody').on('click', '.btn-edit', function () {
      const id = $(this).data('id');
      openEdit(id);
    });
    $('#tableBerkas tbody').on('click', '.btn-delete', function () {
      currentDeleteId = $(this).data('id');
      modalDeleteEl.show();
    });
  } else {
    table.clear();
    table.rows.add(data).draw();
  }
  $('#totalCount').text(data.length);
}

async function reload(q) {
  const data = await fetchBerkas(q);
  renderTable(data);
}

async function openEdit(id) {
  const res = await fetch(`/api/berkas/${id}`);
  if (!res.ok) return alert('Gagal memuat data');
  const row = await res.json();
  document.getElementById('berkasId').value = row.id;
  document.getElementById('nomor').value = row.nomor || '';
  document.getElementById('tanggal_direktur').value = row.tanggal_direktur ? row.tanggal_direktur.split('T')[0] : '';
  document.getElementById('perusahaan').value = row.perusahaan || '';
  document.getElementById('desa').value = row.desa || '';
  document.getElementById('kecamatan').value = row.kecamatan || '';
  document.getElementById('luas').value = row.luas || '';
  document.getElementById('peruntukan').value = row.peruntukan || '';
  document.getElementById('modalTitle').textContent = 'Edit Berkas';
  modalEl.show();
}

async function saveForm() {
  const id = document.getElementById('berkasId').value;
  const payload = {
    nomor: document.getElementById('nomor').value.trim(),
    tanggal_direktur: document.getElementById('tanggal_direktur').value || null,
    perusahaan: document.getElementById('perusahaan').value.trim(),
    desa: document.getElementById('desa').value.trim(),
    kecamatan: document.getElementById('kecamatan').value.trim(),
    luas: document.getElementById('luas').value ? Number(document.getElementById('luas').value) : null,
    peruntukan: document.getElementById('peruntukan').value.trim()
  };

  if (!payload.nomor) return alert('Nomor wajib diisi');

  const method = id ? 'PUT' : 'POST';
  const url = id ? `/api/berkas/${id}` : '/api/berkas';
  const res = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const e = await res.json().catch(()=>({error:'unknown'}));
    return alert('Gagal menyimpan: ' + (e.error || res.statusText));
  }
  modalEl.hide();
  document.getElementById('formBerkas').reset();
  document.getElementById('berkasId').value = '';
  await reload(document.getElementById('globalSearch').value);
}

async function confirmDelete() {
  if (!currentDeleteId) return;
  const res = await fetch(`/api/berkas/${currentDeleteId}`, { method: 'DELETE' });
  if (!res.ok) return alert('Gagal menghapus');
  modalDeleteEl.hide();
  currentDeleteId = null;
  await reload(document.getElementById('globalSearch').value);
}

$(document).ready(function () {
  // Init empty table
  renderTable([]);

  // Load data
  reload();

  // Search input (client-side search via DataTables, but also allow server q)
  $('#globalSearch').on('input', function (e) {
    const val = this.value;
    // For snappy UX: use DataTables search first
    if (table) {
      table.search(val).draw();
      $('#totalCount').text(table.rows({ filter: 'applied' }).data().length);
    }
  });

  // Buttons
  $('#btnAdd').on('click', function () {
    document.getElementById('formBerkas').reset();
    document.getElementById('berkasId').value = '';
    document.getElementById('modalTitle').textContent = 'Tambah Berkas';
    modalEl.show();
  });

  $('#btnRefresh').on('click', function () { reload(); });

  $('#btnSave').on('click', function () { saveForm(); });

  $('#confirmDelete').on('click', function () { confirmDelete(); });
});
