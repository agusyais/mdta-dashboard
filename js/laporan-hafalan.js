let dataLaporanHafalanTerakhir = { periode: '', groups: [] };

function setupLaporanHafalan() {
  document.getElementById('laporanHafalanMode').addEventListener('change', gantiTampilanModeLaporanHafalan);
  document.getElementById('btnTampilkanLaporanHafalan').addEventListener('click', tampilkanLaporanHafalan);
  document.getElementById('btnExportExcelHafalan').addEventListener('click', exportLaporanHafalanKeExcel);

  document.getElementById('laporanHafalanTanggalHarian').value = tanggalKeStringData(new Date());
  document.getElementById('laporanHafalanTanggalMingguan').value = tanggalKeStringData(new Date());
  const now = new Date();
  document.getElementById('laporanHafalanBulan').value = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

async function siapkanHalamanLaporanHafalan() {
  if (daftarSantriGlobal.length === 0 && typeof muatDaftarSantri === 'function') {
    await muatDaftarSantri();
  }
  const daftarKelas = ['Semua Kelas', ...new Set(daftarSantriGlobal.map((s) => s.kelas).filter(Boolean))];
  const select = document.getElementById('laporanHafalanFilterKelas');
  select.innerHTML = daftarKelas.map((k) => `<option value="${escapeHtml(k)}">${escapeHtml(k)}</option>`).join('');
  gantiTampilanModeLaporanHafalan();
  tampilkanLaporanHafalan();
}

function gantiTampilanModeLaporanHafalan() {
  const mode = document.getElementById('laporanHafalanMode').value;
  document.getElementById('laporanHafalanTanggalHarian').style.display = mode === 'harian' ? 'block' : 'none';
  document.getElementById('laporanHafalanTanggalMingguan').style.display = mode === 'mingguan' ? 'block' : 'none';
  document.getElementById('laporanHafalanBulan').style.display = mode === 'bulanan' ? 'block' : 'none';
}

function ambilRentangWaktuHafalan() {
  const mode = document.getElementById('laporanHafalanMode').value;
  if (mode === 'harian') {
    const tgl = document.getElementById('laporanHafalanTanggalHarian').value;
    return { mulai: tgl + " 00:00:00", selesai: tgl + " 23:59:59", label: formatTanggalIndo(new Date(tgl)) };
  }

  const d = new Date(document.getElementById('laporanHafalanTanggalMingguan').value);
  const hari = d.getDay();
  const selisihKeSenin = (hari === 0 ? -6 : 1 - hari);
  const senin = new Date(d); senin.setDate(d.getDate() + selisihKeSenin);
  const minggu = new Date(senin); minggu.setDate(senin.getDate() + 6);

  if (mode === 'mingguan') {
    return {
      mulai: tanggalKeStringData(senin) + " 00:00:00",
      selesai: tanggalKeStringData(minggu) + " 23:59:59",
      label: `${formatTanggalIndo(senin)} — ${formatTanggalIndo(minggu)}`
    };
  }

  const bulanInput = document.getElementById('laporanHafalanBulan').value;
  const [tahun, bulan] = bulanInput.split('-').map(Number);
  const mulai = new Date(tahun, bulan - 1, 1);
  const selesai = new Date(tahun, bulan, 0);
  const namaBulan = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
  return {
    mulai: tanggalKeStringData(mulai) + " 00:00:00",
    selesai: tanggalKeStringData(selesai) + " 23:59:59",
    label: `${namaBulan[bulan - 1]} ${tahun}`
  };
}

async function tampilkanLaporanHafalan() {
  const rentang = ambilRentangWaktuHafalan();
  const kelasTerpilih = document.getElementById('laporanHafalanFilterKelas').value;
  const container = document.getElementById('listLaporanHafalan');

  container.innerHTML = '<div class="empty-state">Memuat riwayat hafalan...</div>';

  try {
    const semuaHafalan = await callApi('getHafalan', null, 'GET');

    const daftarTampil = kelasTerpilih === 'Semua Kelas' || !kelasTerpilih
      ? daftarSantriGlobal
      : daftarSantriGlobal.filter((s) => s.kelas === kelasTerpilih);

    const hasilPerSantri = daftarTampil.map((santri) => {
      const recordSantri = semuaHafalan.filter((h) => {
        const sId = (h.santriId || h.santriid || h.santrid || h.santri_id || '').toString().trim();
        return sId === santri.id.toString().trim();
      });

      const dalamPeriode = recordSantri.filter((h) => {
        return h.tanggal >= rentang.mulai && h.tanggal <= rentang.selesai;
      });

      // Cari setoran paling terakhir (all-time)
      const sorted = [...recordSantri].sort((a, b) => b.tanggal.localeCompare(a.tanggal));
      const terakhir = sorted[0] || null;

      return {
        nama: santri.nama,
        kelas: santri.kelas || '(Tanpa Kelas)',
        jumlahSetoranPeriode: dalamPeriode.length,
        suratTerakhir: terakhir ? terakhir.surat : '-',
        ayatTerakhir: terakhir ? `${terakhir.ayatMulai}-${terakhir.ayatSelesai}` : '-',
        totalSetoranKeseluruhan: recordSantri.length
      };
    });

    const groups = kelompokkanLaporan(hasilPerSantri, 'kelas');
    dataLaporanHafalanTerakhir = { periode: rentang.label, groups };

    document.getElementById('laporanHafalanInfoPeriode').style.display = 'block';
    document.getElementById('laporanHafalanPeriodeText').textContent = rentang.label;

    renderLaporanHafalanTerkelompok(groups);
  } catch (err) {
    tampilkanToast('Gagal memuat laporan: ' + err.message, true);
    container.innerHTML = '<div class="empty-state">Gagal memuat laporan</div>';
  }
}

function renderLaporanHafalanTerkelompok(groups) {
  const container = document.getElementById('listLaporanHafalan');
  if (groups.length === 0 || groups.every(g => g.items.length === 0)) {
    container.innerHTML = '<div class="empty-state">Tidak ada data setoran untuk periode ini</div>';
    return;
  }

  container.innerHTML = groups.map((group) => {
    const baris = group.items.map((r) => `
      <tr>
        <td>${escapeHtml(r.nama)}</td>
        <td class="center">${r.jumlahSetoranPeriode}</td>
        <td>${escapeHtml(r.suratTerakhir)}</td>
        <td class="center">${escapeHtml(r.ayatTerakhir)}</td>
        <td class="center">${r.totalSetoranKeseluruhan}</td>
      </tr>
    `).join('');

    return `
      <h3 style="margin:18px 0 8px; font-size:14px; color:var(--accent-green);">Kelas ${escapeHtml(group.kelas)}</h3>
      <table class="report-table">
        <thead>
          <tr>
            <th>Nama Santri</th><th>Setoran (Periode Ini)</th>
            <th>Surat Terakhir</th><th>Ayat</th><th>Total Setoran (Keseluruhan)</th>
          </tr>
        </thead>
        <tbody>${baris}</tbody>
      </table>
    `;
  }).join('');
}

function exportLaporanHafalanKeExcel() {
  if (!dataLaporanHafalanTerakhir.groups || dataLaporanHafalanTerakhir.groups.length === 0) {
    tampilkanToast('Tampilkan laporan dulu sebelum export', true);
    return;
  }
  const workbook = XLSX.utils.book_new();
  for (const group of dataLaporanHafalanTerakhir.groups) {
    if (group.items.length === 0) continue;
    const dataUntukExcel = group.items.map((r) => ({
      'Nama Santri': r.nama,
      'Setoran (Periode Ini)': r.jumlahSetoranPeriode,
      'Surat Terakhir': r.suratTerakhir,
      'Ayat Terakhir': r.ayatTerakhir,
      'Total Setoran (Keseluruhan)': r.totalSetoranKeseluruhan
    }));
    const worksheet = XLSX.utils.json_to_sheet(dataUntukExcel);
    worksheet['!cols'] = [{ wch: 24 }, { wch: 16 }, { wch: 18 }, { wch: 10 }, { wch: 20 }];
    const namaSheet = ('Kelas ' + group.kelas).replace(/[\\/*?:\[\]]/g, '').substring(0, 31);
    XLSX.utils.book_append_sheet(workbook, worksheet, namaSheet);
  }
  XLSX.writeFile(workbook, `Laporan-Hafalan-${dataLaporanHafalanTerakhir.periode.replace(/[^a-zA-Z0-9]/g, '-')}.xlsx`);
}
