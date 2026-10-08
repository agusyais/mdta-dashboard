document.addEventListener('DOMContentLoaded', () => {
  setupAuth();
  setupSantri();
  setupPengumuman();
  setupAbsensi();
  setupLaporan();
  setupLaporanHafalan();
  setupHafalan();
  setupNavigasi();
});

function setupNavigasi() {
  const navItems = document.querySelectorAll('.nav-item');
  navItems.forEach((item) => {
    item.addEventListener('click', () => {
      const halaman = item.getAttribute('data-page');
      pindahHalaman(halaman);
    });
  });
}

function pindahHalaman(halaman) {
  document.querySelectorAll('.nav-item').forEach((el) => {
    el.classList.toggle('active', el.getAttribute('data-page') === halaman);
  });
  document.querySelectorAll('.page').forEach((el) => {
    el.classList.toggle('active', el.id === 'page-' + halaman);
  });

  // Muat data terbaru setiap kali pindah ke halaman tertentu
  if (halaman === 'absensi') siapkanHalamanAbsensi();
  if (halaman === 'laporan') siapkanHalamanLaporan();
  if (halaman === 'laporan-hafalan') siapkanHalamanLaporanHafalan();
  if (halaman === 'hafalan') isiSelectSantriHafalan();
  if (halaman === 'pengumuman') muatDaftarPengumuman();
}

async function inisialisasiSemuaData() {
  try {
    await muatDaftarSantri((list) => {
      document.getElementById('statJumlahSantri').textContent = list.length;
      isiSelectSantriDiHalamanLain();
    });

    // Muat pengumuman
    const listP = await callApi('getPengumuman', null, 'GET');
    document.getElementById('statPengumuman').textContent = listP.length;

    // Muat statistik hafalan (opsional, set 0 dulu)
    document.getElementById('statHafalan').textContent = '...';
  } catch (e) {
    console.error("Gagal inisialisasi dashboard:", e);
  }
}
