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
- `assets/`: maskot, avatar, ikon aplikasi, dan gambar lain dari desain
- `manifest.webmanifest` dan `sw.js`: supaya bisa dipasang di HP, cadangan offline, dan notifikasi push
- `supabase/migrations/`: skema database Supabase (tabel, keamanan, fungsi undangan, langganan notifikasi)
- `supabase/functions/kirim-notifikasi/`: Edge Function yang mengirim notifikasi push ke HP pasangan

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

## Project Supabase Pyojem

Aplikasi ini sudah tersambung ke project Supabase **pyojem-keuangan** (region Singapura,
`https://nfqfbhlltjmmyyuogors.supabase.co`). Skema dari `supabase/migrations/` sudah terpasang di sana.
Project ini khusus Pyojem dan terpisah dari project aplikasi lain.

## Memasang Supabase dari nol

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

Pyojem diterbitkan ke Cloudflare Workers (`pyojem-keuangan`). Cloudflare membangun otomatis dari branch **`main`**
(Workers › pyojem-keuangan › Settings › Build › Branch control), jadi setiap perubahan yang digabung ke `main`
langsung terbit.

## Pasang di HP dan notifikasi

**Pasang aplikasi.** Di layar masuk (selama belum dipasang) ada tombol
**Pasang aplikasi di HP**. Di Chrome Android tombol ini membuka dialog pasang bawaan; di iPhone atau browser lain
tombol ini menampilkan langkahnya (Safari › Bagikan › Tambah ke Layar Utama). Setelah dipasang, Pyojem terbuka
dari ikon di layar utama seperti aplikasi biasa, dengan tampilan HP (navigasi bawah). Di layar lebar tetap
tampil sebagai dashboard dengan sidebar.

**Notifikasi.** Buka **Pengaturan › Notifikasi**, lalu ketuk **Aktifkan** di tiap HP. Setelah itu, setiap kali
pasangan mencatat pemasukan atau pengeluaran, HP kamu menerima notifikasi (walaupun aplikasi sedang ditutup).
Ketuk notifikasinya untuk membuka detail transaksi.

- Sakelar **Pemasukan dan pengeluaran dari pasangan** mengatur notifikasi tiap catatan; jika dimatikan,
  hanya **Pengeluaran besar** (di atas Rp1.000.000) yang tetap diberitahukan.
- Di iPhone (iOS 16.4 ke atas) notifikasi hanya bisa untuk aplikasi yang sudah dipasang ke layar utama.
- Hanya untuk mode Supabase. Notifikasi dikirim lewat Edge Function `kirim-notifikasi`; kunci VAPID dibuat
  otomatis saat pertama dipakai dan disimpan di tabel `kunci_vapid` yang tidak bisa dibaca aplikasi.
- Memasang dari nol: jalankan juga `supabase/migrations/20261014120000_pyojem_notifikasi.sql`, lalu
  `supabase functions deploy kirim-notifikasi`.

## Preferensi perangkat

Pilihan tema disimpan per perangkat di `localStorage` dengan kunci `pyojem-keuangan:tema`.
Sesi login Supabase disimpan oleh pustaka Supabase di browser.
