function setupHafalan() {
  document.getElementById('hafalanPilihSantri').addEventListener('change', muatRiwayatHafalanSantriTerpilih);
  document.getElementById('btnTambahHafalan').addEventListener('click', bukaModalHafalan);
  document.getElementById('btnBatalHafalan').addEventListener('click', () => tutupModal('modalHafalan'));
  document.getElementById('btnSimpanHafalan').addEventListener('click', simpanHafalan);

  // Isi dropdown surat sekali saja (data statis)
  const selectSurat = document.getElementById('hafalanSurat');
  selectSurat.innerHTML = DAFTAR_SURAT.map((s) => `<option value="${s.nomor}">${s.nomor}. ${s.nama}</option>`).join('');
}

function isiSelectSantriHafalan() {
  const select = document.getElementById('hafalanPilihSantri');
  const idTerpilihSebelumnya = select.value;
  select.innerHTML = daftarSantriGlobal.map((s) => `<option value="${s.id}">${escapeHtml(s.nama)}</option>`).join('');
  if (idTerpilihSebelumnya) select.value = idTerpilihSebelumnya;
  if (select.value) muatRiwayatHafalanSantriTerpilih();
}

async function muatRiwayatHafalanSantriTerpilih() {
  const santriId = document.getElementById('hafalanPilihSantri').value;
  if (!santriId) return;

  try {
    const list = await callApi('getHafalan', { santriId }, 'GET');
    renderDaftarHafalan(list);
  } catch (err) {
    tampilkanToast('Gagal memuat hafalan: ' + err.message, true);
  }
}

function renderDaftarHafalan(list) {
  const container = document.getElementById('listHafalan');
  if (list.length === 0) {
    container.innerHTML = '<div class="empty-state">Belum ada setoran hafalan tercatat</div>';
    return;
  }

  // Balik list agar terbaru di atas
  container.innerHTML = list.reverse().map((h) => `
    <div class="card">
      <div style="color:var(--accent-green); font-weight:600; margin-bottom:4px;">
        ${escapeHtml(h.surat)} : ${h.ayatMulai}-${h.ayatSelesai}
      </div>
      <div style="color:var(--text-secondary); font-size:12px; margin-bottom:6px;">Status: <b>${h.nilai}</b></div>
      <div style="color:var(--text-secondary); font-size:11px;">${formatStringTanggal(h.tanggal)}</div>
    </div>
  `).join('');
}

function bukaModalHafalan() {
  const santriId = document.getElementById('hafalanPilihSantri').value;
  if (!santriId) {
    tampilkanToast('Pilih santri dulu', true);
    return;
  }
  const santri = daftarSantriGlobal.find((s) => s.id === santriId);
  document.getElementById('modalHafalanTitle').textContent = `Catat Setoran untuk ${santri ? santri.nama : ''}`;
  document.getElementById('hafalanAyatDari').value = '';
  document.getElementById('hafalanAyatSampai').value = '';
  document.getElementById('hafalanCatatan').value = '';
  document.getElementById('hafalanError').textContent = '';
  bukaModal('modalHafalan');
}

async function simpanHafalan() {
  const santriId = document.getElementById('hafalanPilihSantri').value;
  const nomorSurat = parseInt(document.getElementById('hafalanSurat').value);
  const surat = DAFTAR_SURAT.find((s) => s.nomor === nomorSurat);
  const ayatDari = document.getElementById('hafalanAyatDari').value.trim();
  const ayatSampai = document.getElementById('hafalanAyatSampai').value.trim();
  const errorEl = document.getElementById('hafalanError');
  const btn = document.getElementById('btnSimpanHafalan');

  if (!surat || !ayatDari || !ayatSampai) {
    errorEl.textContent = 'Harap lengkapi semua kolom';
    return;
  }

  const now = new Date();
  const tglString = `${tanggalKeStringData(now)} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:00`;

  try {
    btn.disabled = true;
    btn.textContent = 'Menyimpan...';

    await callApi('addHafalan', {
      santriId,
      surat: surat.nama,
      ayatMulai: ayatDari,
      ayatSelesai: ayatSampai,
      nilai: "Lancar", // Default via web
      tanggal: tglString
    });

    tutupModal('modalHafalan');
    tampilkanToast('Setoran hafalan berhasil disimpan');
    muatRiwayatHafalanSantriTerpilih();
    updateStatHafalanCount();
  } catch (err) {
    errorEl.textContent = err.message;
  } finally {
    btn.disabled = false;
    btn.textContent = 'Simpan';
  }
}

async function updateStatHafalanCount() {
  try {
    const list = await callApi('getHafalan', null, 'GET');
    document.getElementById('statHafalan').textContent = list.length;
  } catch (e) {}
}
