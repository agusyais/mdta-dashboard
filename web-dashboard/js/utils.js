/**
 * Helper untuk memanggil API Google Apps Script (GET/POST)
 */
async function callApi(action, data = null, method = 'POST') {
  try {
    let url = CONFIG.API_URL;
    let options = {
      method: method,
      mode: 'cors',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' } // Apps Script lebih suka text/plain untuk bypass CORS preflight
    };

    if (method === 'GET') {
      const params = new URLSearchParams({ action, ...data });
      url += (url.includes('?') ? '&' : '?') + params.toString();
    } else {
      options.body = JSON.stringify({ action, ...data });
    }

    const response = await fetch(url, options);
    if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
    return await response.json();
  } catch (err) {
    console.error("API Error:", err);
    throw err;
  }
}

function tampilkanToast(pesan, isError = false) {
  const toast = document.getElementById('toast');
  toast.textContent = pesan;
  toast.className = 'toast show' + (isError ? ' error' : '');
  setTimeout(() => { toast.className = 'toast'; }, 3000);
}

function formatTanggalIndo(dateObj) {
  const hari = ['Minggu','Senin','Selasa','Rabu','Kamis',"Jum'at",'Sabtu'];
  const bulan = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
  return `${hari[dateObj.getDay()]}, ${dateObj.getDate()} ${bulan[dateObj.getMonth()]} ${dateObj.getFullYear()}`;
}

/** Format string yyyy-MM-dd HH:mm:ss menjadi tampilan ramah user */
function formatStringTanggal(dateStr) {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr.replace(' ', 'T')); // Kompatibilitas ISO
    if (isNaN(d.getTime())) return dateStr; // Fallback ke teks asli jika gagal

    const bulan = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];
    const jam = String(d.getHours()).padStart(2, '0');
    const menit = String(d.getMinutes()).padStart(2, '0');
    return `${d.getDate()} ${bulan[d.getMonth()]} ${d.getFullYear()}, ${jam}:${menit}`;
  } catch (e) {
    return dateStr;
  }
}

function tanggalKeStringData(dateObj) {
  const y = dateObj.getFullYear();
  const m = String(dateObj.getMonth() + 1).padStart(2, '0');
  const d = String(dateObj.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function bukaModal(id) {
  document.getElementById(id).classList.add('active');
}
function tutupModal(id) {
  document.getElementById(id).classList.remove('active');
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
