// GANTI seluruh objek di bawah ini dengan konfigurasi Web App Anda sendiri.
// Cara mendapatkannya: Firebase Console -> Project Settings -> scroll ke
// "Your apps" -> klik ikon "</>" (Add app -> Web) -> copy config yang muncul.
// Lihat README.md di folder ini untuk langkah lengkap bergambar.
const firebaseConfig = {
  apiKey: "GANTI_DENGAN_API_KEY_ANDA",
  authDomain: "GANTI.firebaseapp.com",
  projectId: "GANTI_PROJECT_ID",
  storageBucket: "GANTI.firebasestorage.app",
  messagingSenderId: "GANTI_SENDER_ID",
  appId: "GANTI_APP_ID"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
