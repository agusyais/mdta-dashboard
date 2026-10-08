function setupPengumuman() {
  document.getElementById('btnBuatPengumuman').addEventListener('click', bukaModalPengumuman);
  document.getElementById('btnBatalPengumuman').addEventListener('click', () => tutupModal('modalPengumuman'));
  document.getElementById('btnKirimPengumuman').addEventListener('click', kirimPengumuman);
  document.getElementById('pengumumanTarget').addEventListener('change', (e) => {
    document.getElementById('pengumumanPilihSantri').style.display =
      e.target.value === 'santri' ? 'block' : 'none';
  });
}

function bukaModalPengumuman() {
  document.getElementById('pengumumanTarget').value = 'umum';
  document.getElementById('pengumumanPilihSantri').style.display = 'none';
  document.getElementById('pengumumanJudul').value = '';
  document.getElementById('pengumumanIsi').value = '';
  document.getElementById('pengumumanError').textContent = '';
  isiSelectSantriPengumuman();
  bukaModal('modalPengumuman');
}

function isiSelectSantriPengumuman() {
  const select = document.getElementById('pengumumanPilihSantri');
  select.innerHTML = daftarSantriGlobal.map((s) => `<option value="${s.id}">${escapeHtml(s.nama)}</option>`).join('');
}

async function kirimPengumuman() {
  const target = document.getElementById('pengumumanTarget').value;
  const judul = document.getElementById('pengumumanJudul').value.trim();
  const isi = document.getElementById('pengumumanIsi').value.trim();
  const errorEl = document.getElementById('pengumumanError');
  const btn = document.getElementById('btnKirimPengumuman');

  if (!judul || !isi) {
    errorEl.textContent = 'Judul dan isi wajib diisi';
    return;
  }

  const targetSantriId = target === 'santri' ? document.getElementById('pengumumanPilihSantri').value : "";
  const targetType = target === 'santri' ? "PERSONAL" : "SEMUA";

  const now = new Date();
  const tglString = formatTanggalIndo(now).split(', ')[1]; // Format "09 Sep 2026"

  try {
    btn.disabled = true;
    btn.textContent = 'Mengirim...';

    // Menukar pengiriman data agar sesuai dengan pemetaan kolom di Spreadsheet (sama dengan Android)
    // Teks pengumuman dikirim ke parameter 'tanggal' dan Tanggal dikirim ke parameter 'isi'.
    await callApi('addPengumuman', {
      judul: judul,
      isi: tglString,
      tanggal: isi,
      penulis: profilGuruSaatIni.nama,
      targetType: targetType,
      targetSantriId: targetSantriId
    });

    tutupModal('modalPengumuman');
    tampilkanToast('Pengumuman berhasil terbit!');
    muatDaftarPengumuman();
  } catch (err) {
    errorEl.textContent = err.message;
  } finally {
    btn.disabled = false;
    btn.textContent = 'Kirim';
  }
}

async function muatDaftarPengumuman() {
  try {
    const list = await callApi('getPengumuman', null, 'GET');
    renderDaftarPengumuman(list);
    document.getElementById('statPengumuman').textContent = list.length;
  } catch (err) {
    tampilkanToast('Gagal memuat pengumuman: ' + err.message, true);
  }
}

function renderDaftarPengumuman(list) {
  const container = document.getElementById('listPengumuman');
  if (list.length === 0) {
    container.innerHTML = '<div class="empty-state">Belum ada pengumuman terkirim</div>';
    return;
  }

  // Reverse agar terbaru di atas
  container.innerHTML = list.reverse().slice(0, 50).map((p) => {
    let targetLabel = 'UNTUK SEMUA ORANG TUA';
    if (p.targetType === 'PERSONAL') {
      const santri = daftarSantriGlobal.find((s) => s.id === p.targetSantriId);
      targetLabel = 'KHUSUS: ' + (santri ? escapeHtml(santri.nama) : 'Santri');
    }

    // Sesuaikan mapping: p.tanggal berisi teks pesan, p.isi berisi tanggal
    const pesanText = p.tanggal;
    const tglText = p.isi;

    return `
      <div class="card">
        <div style="color:var(--accent-green); font-size:11px; font-weight:600; margin-bottom:4px;">${targetLabel}</div>
        <div style="font-weight:600; margin-bottom:4px;">${escapeHtml(p.judul)}</div>
        <div style="color:var(--text-secondary); font-size:13px; margin-bottom:8px;">${escapeHtml(pesanText)}</div>
        <div style="color:var(--text-secondary); font-size:11px;">${escapeHtml(tglText)} • Oleh: ${escapeHtml(p.penulis)}</div>
      </div>
    `;
  }).join('');
}
