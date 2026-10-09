let statusAbsensiTerpilih = {}; // santriId -> "Hadir"/"Izin"/"Sakit"/"Alpa"

function setupAbsensi() {
  const inputTanggal = document.getElementById('absensiTanggal');
  inputTanggal.value = tanggalKeStringData(new Date());
  inputTanggal.addEventListener('change', muatAbsensiTanggalIni);

  document.getElementById('absensiFilterKelas').addEventListener('change', renderDaftarAbsensi);
  document.getElementById('btnSimpanAbsensi').addEventListener('click', simpanAbsensi);
}

async function siapkanHalamanAbsensi() {
  if (daftarSantriGlobal.length === 0 && typeof muatDaftarSantri === 'function') {
    await muatDaftarSantri();
  }
  // Isi dropdown kelas dari daftar santri yang ada
  const daftarKelas = ['Semua Kelas', ...new Set(daftarSantriGlobal.map((s) => s.kelas).filter(Boolean))];
  const select = document.getElementById('absensiFilterKelas');
  select.innerHTML = daftarKelas.map((k) => `<option value="${escapeHtml(k)}">${escapeHtml(k)}</option>`).join('');
  muatAbsensiTanggalIni();
}

async function muatAbsensiTanggalIni() {
  const tanggal = document.getElementById('absensiTanggal').value; // Format yyyy-mm-dd
  if (!tanggal) return;

  try {
    // Ambil semua riwayat absensi (bisa dioptimasi nanti jika data sangat besar)
    const list = await callApi('getAbsensi', null, 'GET');

    statusAbsensiTerpilih = {};
    // Default semua santri "Hadir"
    daftarSantriGlobal.forEach((s) => { statusAbsensiTerpilih[s.id] = 'Hadir'; });

    // Filter yang cocok dengan tanggal terpilih (format yyyy-mm-dd)
    list.forEach((data) => {
      const sId = (data.santriId || data.santriid || data.santrid || data.santri_id || '').toString().trim();
      if (data.tanggal && data.tanggal.startsWith(tanggal)) {
        statusAbsensiTerpilih[sId] = data.status;
      }
    });

    renderDaftarAbsensi();
  } catch (err) {
    tampilkanToast('Gagal memuat absensi: ' + err.message, true);
  }
}

function renderDaftarAbsensi() {
  const kelasTerpilih = document.getElementById('absensiFilterKelas').value;
  const container = document.getElementById('listAbsensi');

  const daftarTampil = kelasTerpilih === 'Semua Kelas' || !kelasTerpilih
    ? daftarSantriGlobal
    : daftarSantriGlobal.filter((s) => (s.kelas || '').toString().trim().toLowerCase() === kelasTerpilih.toString().trim().toLowerCase());

  if (daftarTampil.length === 0) {
    container.innerHTML = '<div class="empty-state">Tidak ada santri di kelas ini</div>';
    return;
  }

  container.innerHTML = daftarTampil.map((s) => {
    const status = statusAbsensiTerpilih[s.id] || 'Hadir';
    const opsi = ['Hadir', 'Izin', 'Sakit', 'Alfa']; // Disamakan dengan Android (Alfa bukan Alpa)
    const tombol = opsi.map((o) => {
      const kelasCss = status === o ? `selected-${o.toLowerCase()}` : '';
      return `<button class="${kelasCss}" onclick="pilihStatusAbsensi('${s.id}', '${o}')">${o}</button>`;
    }).join('');

    return `
      <div class="list-item">
        <div class="info">
          <div class="primary-text">${escapeHtml(s.nama)}</div>
          <div class="secondary-text">Kelas ${escapeHtml(s.kelas || '-')}</div>
        </div>
        <div class="status-buttons">${tombol}</div>
      </div>
    `;
  }).join('');
}

function pilihStatusAbsensi(santriId, status) {
  statusAbsensiTerpilih[santriId] = status;
  renderDaftarAbsensi();
}

async function simpanAbsensi() {
  const tanggalBase = document.getElementById('absensiTanggal').value;
  if (!tanggalBase) {
    tampilkanToast('Pilih tanggal dulu', true);
    return;
  }
  if (Object.keys(statusAbsensiTerpilih).length === 0) {
    tampilkanToast('Belum ada data santri', true);
    return;
  }

  // Gunakan jam saat ini untuk kelengkapan format yyyy-MM-dd HH:mm:ss
  const now = new Date();
  const jamFull = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
  const tanggalFull = `${tanggalBase} ${jamFull}`;

  const btn = document.getElementById('btnSimpanAbsensi');
  btn.disabled = true;
  btn.textContent = 'Menyimpan...';

  try {
    let successCount = 0;
    // Kirim satu per satu (untuk aplikasi sekolah skala kecil ini masih aman)
    for (const [santriId, status] of Object.entries(statusAbsensiTerpilih)) {
      await callApi('addAbsensi', {
        santriId,
        tanggal: tanggalFull,
        status,
        keterangan: "Dicatat via Web"
      });
      successCount++;
    }

    tampilkanToast(`Berhasil menyimpan ${successCount} data absensi`);
  } catch (err) {
    tampilkanToast('Gagal menyimpan: ' + err.message, true);
  } finally {
    btn.disabled = false;
    btn.textContent = 'Simpan Absensi';
  }
}
