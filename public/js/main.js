// main.js - mengatur DataTable, AJAX untuk CRUD, modal behavior

$(function() {
  const table = $('#tblBerkas').DataTable({
    ajax: {
      url: '/api/berkas',
      dataSrc: ''
    },
    columns: [
      { data: null, render: (data, type, row, meta) => meta.row + 1 },
      { data: 'nomor' },
      { data: 'tanggal', render: d => d ? new Date(d).toLocaleDateString() : '' },
      { data: 'direktur' },
      { data: 'perusahaan' },
      { data: 'desa' },
      { data: 'kecamatan' },
      { data: 'luas' },
      { data: 'peruntukan' },
      {
        data: null,
        orderable: false,
        searchable: false,
        render: (data, type, row) => {
          return `
            <div class="btn-group">
              <button class="btn btn-sm btn-primary btn-edit" data-id="${row.id}">Edit</button>
              <button class="btn btn-sm btn-danger btn-delete" data-id="${row.id}">Hapus</button>
            </div>
          `;
        }
      }
    ],
    lengthMenu: [10, 25, 50, 100],
    pageLength: 10,
    responsive: true,
    dom: '<"d-flex justify-content-between mb-2"<"col-sm-6"l><"col-sm-6"f>>tr<"d-flex justify-content-between mt-2"<"col-sm-6"i><"col-sm-6"p>>',
    language: {
      search: "Cari:",
      lengthMenu: "Tampilkan _MENU_",
      info: "Menampilkan _START_ sampai _END_ dari _TOTAL_ entri",
      paginate: { previous: "Sebelumnya", next: "Selanjutnya" }
    }
  });

  // Reset dan buka modal tambah
  $('#btn-add').on('click', () => {
    $('#modalFormLabel').text('Tambah Berkas');
    $('#formBerkas')[0].reset();
    $('#berkasId').val('');
  });

  // Submit form (tambah / edit)
  $('#formBerkas').on('submit', function (e) {
    e.preventDefault();
    const id = $('#berkasId').val();
    const data = {
      nomor: $('#nomor').val(),
      tanggal: $('#tanggal').val(),
      direktur: $('#direktur').val(),
      perusahaan: $('#perusahaan').val(),
      desa: $('#desa').val(),
      kecamatan: $('#kecamatan').val(),
      luas: $('#luas').val(),
      peruntukan: $('#peruntukan').val()
    };

    $('#btnSave').prop('disabled', true).text('Menyimpan...');

    if (id) {
      // update
      $.ajax({
        url: '/api/berkas/' + id,
        method: 'PUT',
        contentType: 'application/json',
        data: JSON.stringify(data)
      }).done((res) => {
        $('#modalForm').modal('hide');
        Swal.fire({ icon: 'success', title: 'Berhasil', text: 'Data berhasil diperbarui.' });
        table.ajax.reload(null, false);
      }).fail((xhr) => {
        Swal.fire({ icon: 'error', title: 'Error', text: xhr.responseJSON?.error || 'Terjadi kesalahan' });
      }).always(() => $('#btnSave').prop('disabled', false).text('Simpan'));
    } else {
      // create
      $.post('/api/berkas', data)
        .done((res) => {
          $('#modalForm').modal('hide');
          Swal.fire({ icon: 'success', title: 'Berhasil', text: 'Data berhasil ditambahkan.' });
          table.ajax.reload(null, false);
        })
        .fail((xhr) => {
          Swal.fire({ icon: 'error', title: 'Error', text: xhr.responseJSON?.error || 'Terjadi kesalahan' });
        })
        .always(() => $('#btnSave').prop('disabled', false).text('Simpan'));
    }
  });

  // Handle click Edit
  $('#tblBerkas tbody').on('click', 'button.btn-edit', function () {
    const id = $(this).data('id');
    // ambil data row langsung dari API (atau dari table)
    $.get('/api/berkas', function(rows) {
      const row = rows.find(r => r.id == id);
      if (!row) {
        Swal.fire({ icon: 'error', title: 'Tidak ditemukan' });
        return;
      }
      $('#modalFormLabel').text('Edit Berkas');
      $('#berkasId').val(row.id);
      $('#nomor').val(row.nomor);
      $('#tanggal').val(row.tanggal ? row.tanggal.split('T')[0] : '');
      $('#direktur').val(row.direktur);
      $('#perusahaan').val(row.perusahaan);
      $('#desa').val(row.desa);
      $('#kecamatan').val(row.kecamatan);
      $('#luas').val(row.luas);
      $('#peruntukan').val(row.peruntukan);
      $('#modalForm').modal('show');
    });
  });

  // Handle click Delete
  $('#tblBerkas tbody').on('click', 'button.btn-delete', function () {
    const id = $(this).data('id');
    Swal.fire({
      title: 'Hapus berkas ini?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Ya, hapus',
      cancelButtonText: 'Batal'
    }).then((result) => {
      if (result.isConfirmed) {
        $.ajax({
          url: '/api/berkas/' + id,
          method: 'DELETE'
        }).done((res) => {
          Swal.fire({ icon: 'success', title: 'Dihapus', text: 'Data berhasil dihapus.' });
          table.ajax.reload(null, false);
        }).fail((xhr) => {
          Swal.fire({ icon: 'error', title: 'Error', text: xhr.responseJSON?.error || 'Terjadi kesalahan' });
        });
      }
    });
  });

});
