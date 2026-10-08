let profilGuruSaatIni = null;

/**
 * Inisialisasi Auth berbasis Spreadsheet
 */
function setupAuth() {
  document.getElementById('btnLogin').addEventListener('click', prosesLogin);
  document.getElementById('loginPassword').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') prosesLogin();
  });

  // Login Google dinonaktifkan sementara karena beralih ke Spreadsheet
  const btnGoogle = document.getElementById('btnLoginGoogle');
  if (btnGoogle) btnGoogle.style.display = 'none';

  document.getElementById('btnLogout').addEventListener('click', prosesLogout);

  // Cek session di localStorage
  const savedUser = localStorage.getItem('mdta_user');
  if (savedUser) {
    profilGuruSaatIni = JSON.parse(savedUser);
    tampilkanAppShell();
  } else {
    tampilkanLoginView();
  }
}

async function prosesLogin() {
  const username = document.getElementById('loginEmail').value.trim(); // Re-use email field for username
  const password = document.getElementById('loginPassword').value.trim();
  const errorEl = document.getElementById('loginError');
  const btn = document.getElementById('btnLogin');

  errorEl.textContent = '';

  if (!username || !password) {
    errorEl.textContent = 'Username dan kata sandi wajib diisi';
    return;
  }

  try {
    btn.disabled = true;
    btn.textContent = 'Memproses...';

    const result = await callApi('login', { username, password });

    if (result.status === 'success') {
      if (result.role !== 'guru') {
        errorEl.textContent = 'Dashboard ini hanya untuk akun Guru.';
        return;
      }

      profilGuruSaatIni = result;
      localStorage.setItem('mdta_user', JSON.stringify(result));
      tampilkanAppShell();
    } else {
      errorEl.textContent = result.message || 'Login gagal';
    }
  } catch (err) {
    errorEl.textContent = 'Terjadi kesalahan koneksi ke server.';
  } finally {
    btn.disabled = false;
    btn.textContent = 'Masuk';
  }
}

function prosesLogout() {
  localStorage.removeItem('mdta_user');
  profilGuruSaatIni = null;
  tampilkanLoginView();
}

function tampilkanLoginView() {
  document.getElementById('loginView').style.display = 'flex';
  document.getElementById('appShell').style.display = 'none';
}

function tampilkanAppShell() {
  document.getElementById('loginView').style.display = 'none';
  document.getElementById('appShell').style.display = 'flex';
  document.getElementById('sidebarNamaGuru').textContent = profilGuruSaatIni.nama || 'Guru';
  document.getElementById('sidebarEmailGuru').textContent = profilGuruSaatIni.username || '';

  // Trigger pemuatan data beranda
  if (typeof inisialisasiSemuaData === 'function') inisialisasiSemuaData();
}
