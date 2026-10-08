# Dashboard Web Guru — MDTA Shirotul Jannah

Dashboard web untuk Guru, sinkron langsung dengan data yang sama dipakai aplikasi Android (Firestore). Fitur: Kelola Santri, Pengumuman, Absensi (dengan filter kelas), Hafalan Qur'an.

Dibangun murni HTML/CSS/JS (tanpa perlu Node.js/build tools), di-hosting gratis di **Firebase Hosting**.

---

## Langkah Setup

### 1. Daftarkan Web App di Firebase Console
1. Buka [Firebase Console](https://console.firebase.google.com) → pilih project Anda (yang sama dengan aplikasi Android)
2. Klik ⚙️ **Project Settings** → scroll ke bagian **"Your apps"**
3. Klik ikon **`</>`** (Add app → Web)
4. Kasih nama app, misal `MDTA Web Dashboard` → **Register app**
5. Anda akan lihat kode konfigurasi seperti ini:
   ```javascript
   const firebaseConfig = {
     apiKey: "AIzaSy...",
     authDomain: "mdta1-af06f.firebaseapp.com",
     projectId: "mdta1-af06f",
     storageBucket: "mdta1-af06f.firebasestorage.app",
     messagingSenderId: "...",
     appId: "..."
   };
   ```
6. **Copy semua isinya**

### 2. Masukkan Config ke Project
1. Buka file: `web-dashboard/js/firebase-config.js`
2. **Ganti seluruh isi `firebaseConfig`** dengan yang Anda copy tadi
3. Simpan file

### 3. Deploy ke Firebase Hosting
Di terminal (folder root project, yang berisi `firebase.json`):
```bash
firebase deploy --only hosting
```
Tunggu sampai selesai (~1 menit). Nanti akan muncul URL seperti:
```
Hosting URL: https://mdta1-af06f.web.app
```

**Itu link dashboard-nya!** Bisa dibuka dari komputer/laptop mana saja, bisa juga di-bookmark.

### 4. Login
Pakai **akun guru yang sama** dengan yang dipakai login di aplikasi Android (email + password yang dibuat manual di Firebase Console dulu).

---

## Fitur

- **Beranda**: ringkasan jumlah santri, pengumuman terkirim, total setoran hafalan
- **Kelola Santri**: tambah/edit/hapus santri, lihat & generate kode pendaftaran
- **Pengumuman**: buat pengumuman (umum/khusus santri) + riwayat 50 terakhir
- **Absensi**: tandai Hadir/Izin/Sakit/Alpa per tanggal, bisa difilter per kelas, simpan sekaligus semua kelas
- **Hafalan Qur'an**: pilih santri → lihat riwayat setoran → catat setoran baru (pilih dari 114 surat)

Semua data yang diinput dari web ini **langsung muncul juga di aplikasi Android** (dan sebaliknya), karena satu database yang sama.

## Catatan Keamanan

- Dashboard ini **cuma bisa diakses akun dengan role "guru"** — kalau ada yang coba login pakai akun orang tua, otomatis ditolak & logout
- Notifikasi push (dari fitur Vercel, kalau sudah di-setup) **tidak otomatis terpicu** dari aksi di web dashboard ini untuk pengumuman/pesan — kalau ingin notifikasi juga aktif dari web, beri tahu saya, bisa ditambahkan panggilan ke server Vercel yang sama

## Update Konten Setelah Perubahan

Kalau nanti ada perubahan pada file-file di folder `web-dashboard/`, deploy ulang dengan perintah yang sama:
```bash
firebase deploy --only hosting
```
