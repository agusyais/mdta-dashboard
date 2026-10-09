let dataLaporanTerakhir = { periode: '', groups: [] };

function setupLaporan() {
  document.getElementById('laporanMode').addEventListener('change', gantiTampilanModeLaporan);
  document.getElementById('btnTampilkanLaporan').addEventListener('click', tampilkanLaporan);
  document.getElementById('btnExportExcel').addEventListener('click', exportLaporanKeExcel);

  document.getElementById('laporanTanggalHarian').value = tanggalKeStringData(new Date());
  document.getElementById('laporanTanggalMingguan').value = tanggalKeStringData(new Date());
  const now = new Date();
  document.getElementById('laporanBulan').value = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

async function siapkanHalamanLaporan() {
  if (daftarSantriGlobal.length === 0 && typeof muatDaftarSantri === 'function') {
    await muatDaftarSantri();
  }
  const daftarKelas = ['Semua Kelas', ...new Set(daftarSantriGlobal.map((s) => s.kelas).filter(Boolean))];
  const select = document.getElementById('laporanFilterKelas');
  select.innerHTML = daftarKelas.map((k) => `<option value="${escapeHtml(k)}">${escapeHtml(k)}</option>`).join('');
  gantiTampilanModeLaporan();
  tampilkanLaporan();
}

function gantiTampilanModeLaporan() {
  const mode = document.getElementById('laporanMode').value;
  document.getElementById('laporanTanggalHarian').style.display = mode === 'harian' ? 'block' : 'none';
  document.getElementById('laporanTanggalMingguan').style.display = mode === 'mingguan' ? 'block' : 'none';
  document.getElementById('laporanBulan').style.display = mode === 'bulanan' ? 'block' : 'none';
}

function ambilRentangTanggalTerpilih() {
  const mode = document.getElementById('laporanMode').value;

  if (mode === 'harian') {
    const tgl = document.getElementById('laporanTanggalHarian').value;
    return { mulaiStr: tgl, selesaiStr: tgl, label: formatTanggalIndo(new Date(tgl)) };
  }

  // Helper untuk hitung minggu (Senin - Minggu)
  const d = new Date(document.getElementById('laporanTanggalMingguan').value);
  const hari = d.getDay();
  const selisihKeSenin = (hari === 0 ? -6 : 1 - hari);
  const senin = new Date(d); senin.setDate(d.getDate() + selisihKeSenin);
  const minggu = new Date(senin); minggu.setDate(senin.getDate() + 6);

  if (mode === 'mingguan') {
    return {
      mulaiStr: tanggalKeStringData(senin),
      selesaiStr: tanggalKeStringData(minggu),
      label: `${formatTanggalIndo(senin)} — ${formatTanggalIndo(minggu)}`
    };
  }

  const bulanInput = document.getElementById('laporanBulan').value;
  const [tahun, bulan] = bulanInput.split('-').map(Number);
  const mulai = new Date(tahun, bulan - 1, 1);
  const selesai = new Date(tahun, bulan, 0);
  const namaBulan = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
  return {
    mulaiStr: tanggalKeStringData(mulai),
    selesaiStr: tanggalKeStringData(selesai),
    label: `${namaBulan[bulan - 1]} ${tahun}`
  };
}

async function tampilkanLaporan() {
  const rentang = ambilRentangTanggalTerpilih();
  const kelasTerpilih = document.getElementById('laporanFilterKelas').value;
  const container = document.getElementById('listLaporan');

  container.innerHTML = '<div class="empty-state">Memuat data dari Spreadsheet...</div>';

  try {
    const semuaRecord = await callApi('getAbsensi', null, 'GET');

    // Filter berdasarkan rentang tanggal
    const filteredRecord = semuaRecord.filter(r => {
      const tgl = r.tanggal.substring(0, 10);
      return tgl >= rentang.mulaiStr && tgl <= rentang.selesaiStr;
    });

    const totalHariTercatat = new Set(filteredRecord.map((r) => r.tanggal.substring(0, 10))).size;

    const daftarTampil = kelasTerpilih === 'Semua Kelas' || !kelasTerpilih
      ? daftarSantriGlobal
      : daftarSantriGlobal.filter((s) => (s.kelas || '').toString().trim().toLowerCase() === kelasTerpilih.toString().trim().toLowerCase());

    const hasilPerSantri = daftarTampil.map((santri) => {
      const recordSantri = filteredRecord.filter((r) => {
        const sId = (r.santriId || r.santriid || r.santrid || r.santri_id || '').toString().trim();
        return sId === santri.id.toString().trim();
      });
      const hadir = recordSantri.filter((r) => (r.status || '').trim().toLowerCase() === 'hadir').length;
      const izin = recordSantri.filter((r) => (r.status || '').trim().toLowerCase() === 'izin').length;
      const sakit = recordSantri.filter((r) => (r.status || '').trim().toLowerCase() === 'sakit').length;
      const alfa = recordSantri.filter((r) => (r.status || '').trim().toLowerCase() === 'alfa').length;
      const totalTercatatSantri = recordSantri.length;
      const persen = totalTercatatSantri > 0 ? Math.round((hadir / totalTercatatSantri) * 100) : 0;

      return {
        nama: santri.nama, kelas: santri.kelas || '(Tanpa Kelas)',
        hadir, izin, sakit, alfa,
        totalTercatat: totalTercatatSantri, persen
      };
    });

    const groups = kelompokkanLaporan(hasilPerSantri, 'kelas');
    dataLaporanTerakhir = { periode: rentang.label, groups };

    document.getElementById('laporanInfoPeriode').style.display = 'block';
    document.getElementById('laporanPeriodeText').textContent = rentang.label;
    document.getElementById('laporanTotalHari').textContent = totalHariTercatat + ' hari';

    renderLaporanTerkelompok(groups);
  } catch (err) {
    tampilkanToast('Gagal memuat laporan: ' + err.message, true);
    container.innerHTML = '<div class="empty-state">Gagal memuat laporan</div>';
  }
}

function kelompokkanLaporan(list, field) {
  const map = {};
  for (const item of list) {
    const key = item[field] || '(Tanpa Kelas)';
    if (!map[key]) map[key] = [];
    map[key].push(item);
  }
  return Object.keys(map).sort().map((key) => ({ kelas: key, items: map[key] }));
}

function renderLaporanTerkelompok(groups) {
  const container = document.getElementById('listLaporan');
  if (groups.length === 0 || groups.every(g => g.items.length === 0)) {
    container.innerHTML = '<div class="empty-state">Tidak ada data untuk periode/kelas ini</div>';
    return;
  }

  container.innerHTML = groups.map((group) => {
    const baris = group.items.map((r) => {
      const kelasPersen = r.persen >= 80 ? 'persen-tinggi' : (r.persen >= 60 ? 'persen-sedang' : 'persen-rendah');
      return `
        <tr>
          <td>${escapeHtml(r.nama)}</td>
          <td class="center">${r.hadir}</td>
          <td class="center">${r.izin}</td>
          <td class="center">${r.sakit}</td>
          <td class="center">${r.alfa}</td>
          <td class="center">${r.totalTercatat}</td>
          <td class="center ${kelasPersen}">${r.persen}%</td>
        </tr>
      `;
    }).join('');

    return `
      <h3 style="margin:18px 0 8px; font-size:14px; color:var(--accent-green);">Kelas ${escapeHtml(group.kelas)}</h3>
      <table class="report-table">
        <thead>
          <tr>
            <th>Nama Santri</th><th>Hadir</th><th>Izin</th>
            <th>Sakit</th><th>Alfa</th><th>Tercatat</th><th>% Hadir</th>
          </tr>
        </thead>
        <tbody>${baris}</tbody>
      </table>
    `;
  }).join('');
}

function exportLaporanKeExcel() {
  if (!dataLaporanTerakhir.groups || dataLaporanTerakhir.groups.length === 0) {
    tampilkanToast('Tampilkan laporan dulu sebelum export', true);
    return;
  }
  const workbook = XLSX.utils.book_new();
  for (const group of dataLaporanTerakhir.groups) {
    if (group.items.length === 0) continue;
    const dataUntukExcel = group.items.map((r) => ({
      'Nama Santri': r.nama,
      'Hadir': r.hadir, 'Izin': r.izin, 'Sakit': r.sakit, 'Alfa': r.alfa,
      'Total Tercatat': r.totalTercatat,
      '% Kehadiran': r.persen + '%'
    }));
    const worksheet = XLSX.utils.json_to_sheet(dataUntukExcel);
    worksheet['!cols'] = [{ wch: 24 }, { wch: 8 }, { wch: 8 }, { wch: 8 }, { wch: 8 }, { wch: 14 }, { wch: 12 }];
    const namaSheet = ('Kelas ' + group.kelas).replace(/[\\/*?:\[\]]/g, '').substring(0, 31);
    XLSX.utils.book_append_sheet(workbook, worksheet, namaSheet);
  }
  XLSX.writeFile(workbook, `Laporan-Absensi-${dataLaporanTerakhir.periode.replace(/[^a-zA-Z0-9]/g, '-')}.xlsx`);
}
