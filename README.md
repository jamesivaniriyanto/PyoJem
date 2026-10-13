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

Data contoh Oktober 2026 dimuat saat pertama dibuka. Semua perubahan disimpan di `localStorage` browser,
jadi hanya ada di perangkat itu. Untuk kembali ke data contoh: Pengaturan › Kembalikan data contoh.
