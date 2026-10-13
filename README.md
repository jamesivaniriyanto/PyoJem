# Pyojem Keuangan

Aplikasi keuangan rumah tangga berdua (James dan Sabrina), dibuat dari kanvas desain "Pyojem Keuangan".
Cukup buka `index.html` di browser. Tidak perlu build atau server.

## Isi

- `index.html`: halaman utama
- `styles.css`: tema pastel ceria (terang, gelap, ikuti HP)
- `icons.js`: ikon garis dari desain
- `app.js`: seluruh layar dan logika aplikasi
- `assets/`: maskot, avatar, dan gambar lain dari desain

## Layar

Masuk, Beranda, Transaksi (cari dan filter), Tambah/ubah transaksi (keypad, favorit, kategori, transfer),
Detail (komentar, riwayat, hapus dengan urungkan), Anggaran (atur batas), Dompet (tambah, sesuaikan saldo),
Tagihan dan cicilan (tandai sudah dibayar), Tujuan bersama (setor, riwayat), Utang dan piutang,
Aset dan kekayaan bersih, Laporan (ekspor CSV, cetak PDF), dan Pengaturan.

Di layar lebar (960px ke atas) navigasi bawah berganti menjadi sidebar.

## Data

Pyojem punya database sendiri: IndexedDB bernama `pyojem-keuangan` (tabel `rumahTangga`), terpisah dari
aplikasi lain walaupun di-host di domain yang sama. Database ini baru dan tidak mengambil data dari aplikasi lain.
Saat pertama dibuka, isinya data contoh Oktober 2026; semua perubahan disimpan di sana, hanya di perangkat itu.
Jika browser tidak mendukung IndexedDB, aplikasi memakai cadangan `localStorage` dengan kunci `pyojem-keuangan:cadangan`.

Untuk kembali ke data contoh: Pengaturan › Kembalikan data contoh.
