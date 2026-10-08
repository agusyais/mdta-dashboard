let daftarSantriGlobal = [];

function setupSantri() {
  document.getElementById('btnTambahSantri').addEventListener('click', () => bukaModalTambahSantri());
  document.getElementById('btnBatalSantri').addEventListener('click', () => tutupModal('modalSantri'));
  document.getElementById('btnSimpanSantri').addEventListener('click', simpanSantri);
  document.getElementById('btnTutupModalKode').addEventListener('click', () => tutupModal('modalKode'));
}

async function muatDaftarSantri(callback) {
  try {
    const list = await callApi('getSantri', null, 'GET');
    daftarSantriGlobal = list;
    renderDaftarSantri();
    if (callback) callback(daftarSantriGlobal);
  } catch (err) {
    tampilkanToast('Gagal memuat santri: ' + err.message, true);
  }
}

function renderDaftarSantri() {
  const container = document.getElementById('listSantri');
  if (daftarSantriGlobal.length === 0) {
    container.innerHTML = '<div class="empty-state">Belum ada data santri</div>';
    return;
  }

  container.innerHTML = daftarSantriGlobal.map((s) => `
    <div class="list-item">
      <div class="info">
        <div class="primary-text">${escapeHtml(s.nama)}</div>
        <div class="secondary-text">Kelas ${escapeHtml(s.kelas || '-')} • ID: ${escapeHtml(s.id)}</div>
        <div class="secondary-text">Ortu: ${escapeHtml(s.nama_ortu || '-')} • Telp: ${escapeHtml(s.no_telp || '-')}</div>
      </div>
      <div class="actions">
        <button class="icon-btn" title="Edit" onclick="bukaModalEditSantri('${s.id}')">✏️</button>
      </div>
    </div>
  `).join('');
}

function bukaModalTambahSantri() {
  document.getElementById('modalSantriTitle').textContent = 'Tambah Santri';
  document.getElementById('santriEditId').value = '';
  document.getElementById('santriNama').value = '';
  document.getElementById('santriKelas').value = '';
  document.getElementById('santriNamaOrtu').value = '';
  document.getElementById('santriNoHp').value = '';
  // Field Alamat (jika ada di HTML nanti, kita tambahkan sementara sebagai input baru)
  if (document.getElementById('santriAlamat')) document.getElementById('santriAlamat').value = '';

  document.getElementById('santriError').textContent = '';
  bukaModal('modalSantri');
}

function bukaModalEditSantri(id) {
  // Gunakan pencocokan ID yang fleksibel (konversi ke string)
  const s = daftarSantriGlobal.find((x) => x.id.toString() === id.toString());
  if (!s) {
    console.error("Santri tidak ditemukan untuk ID:", id);
    return;
  }

  document.getElementById('modalSantriTitle').textContent = 'Edit Santri';
  document.getElementById('santriEditId').value = s.id;
  document.getElementById('santriNama').value = s.nama || '';
  document.getElementById('santriKelas').value = s.kelas || '';
  document.getElementById('santriNamaOrtu').value = s.nama_ortu || '';
  document.getElementById('santriNoHp').value = s.no_telp || '';
  if (document.getElementById('santriAlamat')) {
    document.getElementById('santriAlamat').value = s.alamat || '';
  }

  document.getElementById('santriError').textContent = '';
  bukaModal('modalSantri');
}
// Pastikan fungsi tersedia di global scope untuk onclick
window.bukaModalEditSantri = bukaModalEditSantri;

async function simpanSantri() {
  const id = document.getElementById('santriEditId').value;
  const nama = document.getElementById('santriNama').value.trim();
  const kelas = document.getElementById('santriKelas').value.trim();
  const namaOrtu = document.getElementById('santriNamaOrtu').value.trim();
  const noTelp = document.getElementById('santriNoHp').value.trim();
  const alamat = document.getElementById('santriAlamat') ? document.getElementById('santriAlamat').value.trim() : '';
  const errorEl = document.getElementById('santriError');
  const btn = document.getElementById('btnSimpanSantri');

  if (!nama || !kelas) {
    errorEl.textContent = 'Nama dan kelas wajib diisi';
    return;
  }

  try {
    btn.disabled = true;
    btn.textContent = 'Menyimpan...';

    const action = id ? 'updateSantri' : 'addSantri';
    const payload = {
      id, nama, kelas,
      nama_ortu: namaOrtu,
      no_telp: noTelp,
      alamat: alamat
    };

    const result = await callApi(action, payload);

    if (result.status === 'success') {
      tutupModal('modalSantri');
      tampilkanToast(id ? 'Data santri diperbarui' : 'Santri berhasil ditambah');
      muatDaftarSantri();

      // Jika baru tambah, beri tahu ID-nya (Username Wali)
      if (!id) {
        alert(`Santri Berhasil Ditambah!\n\nID Santri: ${result.id}\n(ID ini juga digunakan sebagai Username & Password Wali)`);
      }
    } else {
      errorEl.textContent = result.message || 'Gagal menyimpan data';
    }
  } catch (err) {
    errorEl.textContent = 'Gagal terhubung ke server.';
  } finally {
    btn.disabled = false;
    btn.textContent = 'Simpan';
  }
}

function isiSelectSantriDiHalamanLain() {
  if (typeof isiSelectSantriPengumuman === 'function') isiSelectSantriPengumuman();
  if (typeof isiSelectSantriHafalan === 'function') isiSelectSantriHafalan();
}
