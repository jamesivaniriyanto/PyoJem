# Pyojem Keuangan

Aplikasi keuangan rumah tangga berdua (James dan Sabrina), dibuat dari kanvas desain "Pyojem Keuangan".
Tidak perlu build: cukup HTML, CSS, dan JavaScript biasa.

## Isi

- `index.html`: halaman utama
- `config.js`: alamat dan kunci project Supabase (kosong = mode lokal)
- `data.js`: data contoh, database lokal, dan sambungan ke Supabase
- `app.js`: seluruh layar dan logika aplikasi
- `styles.css`: tema pastel ceria (terang, gelap, ikuti HP)
- `icons.js`: ikon garis dari desain
- `assets/`: maskot, avatar, dan gambar lain dari desain
- `supabase/migrations/`: skema database Supabase (tabel, keamanan, fungsi undangan)

## Layar

Masuk dan daftar, buat atau gabung rumah tangga, Beranda, Transaksi (cari dan filter), Tambah/ubah transaksi
(keypad, favorit, kategori, transfer), Detail (komentar, riwayat), Sampah, Anggaran, Dompet, Tagihan dan cicilan,
Tujuan bersama, Utang dan piutang, Aset dan kekayaan bersih, Laporan (ekspor CSV, cetak PDF), dan Pengaturan.
Di layar lebar (960px ke atas) navigasi bawah berganti menjadi sidebar.

## Dua cara menyimpan data

**Mode lokal** (bawaan, `config.js` kosong): data disimpan di database IndexedDB `pyojem-keuangan` di browser.
Hanya ada di satu perangkat, tidak sinkron, dan hilang jika data browser dibersihkan. Cocok untuk mencoba.

**Mode Supabase** (`config.js` diisi): data disimpan di project Supabase khusus Pyojem. James dan Sabrina
masuk dengan akun masing-masing, melihat data yang sama, dan perubahan dari HP pasangan langsung muncul.

- Setiap tabel dilindungi Row Level Security: pengguna hanya bisa membaca dan menulis data rumah tangganya sendiri.
- Satu rumah tangga paling banyak dua anggota. Pasangan bergabung lewat kode undangan.
- Transaksi yang dihapus masuk **Sampah** dulu dan bisa dikembalikan oleh siapa pun dari kalian berdua.
  Hapus permanen hanya lewat Sampah, dengan konfirmasi.

## Memasang Supabase

1. Buat project **baru** di [supabase.com](https://supabase.com), misalnya `pyojem-keuangan`.
   Jangan memakai project milik aplikasi lain.
2. Buka **SQL Editor**, buat query baru, tempel seluruh isi
   `supabase/migrations/20261013000000_pyojem_awal.sql`, lalu **Run**.
3. Buka **Authentication › URL Configuration**. Isi **Site URL** dengan alamat aplikasi
   (misalnya `https://jamesivaniriyanto.github.io/PyoJem/`), dan tambahkan alamat yang sama ke **Redirect URLs**.
   Ini dipakai untuk tautan konfirmasi email.
4. Buka **Project Settings › API**. Salin **Project URL** dan kunci **anon public** (atau **publishable**),
   lalu isi ke `config.js`. Kunci ini memang boleh ada di aplikasi web.
   **Jangan pernah** memakai kunci `service_role` atau secret; aplikasi akan menolak jalan jika kunci itu terpasang.
5. Buka aplikasi, pilih **Daftar**, lalu **Buat rumah tangga baru**. Centang "Isi dengan data contoh" jika
   ingin mencoba dengan data Oktober 2026; tanpa centang, rumah tangga dimulai dengan tiga dompet kosong.
6. Bagikan kode undangan (ada di Beranda dan Pengaturan) ke pasangan. Pasangan mendaftar dengan emailnya sendiri,
   lalu memilih **Gabung dengan kode undangan**.

Aplikasi perlu dibuka lewat `https://` (misalnya GitHub Pages: Settings › Pages › Deploy from branch `main`)
supaya login dan tautan konfirmasi email berjalan.

## Preferensi perangkat

Pilihan tema disimpan per perangkat di `localStorage` dengan kunci `pyojem-keuangan:tema`.
Sesi login Supabase disimpan oleh pustaka Supabase di browser.
