/* Konfigurasi Supabase untuk Pyojem Keuangan.
   - Biarkan kosong untuk mode lokal: data hanya tersimpan di browser ini.
   - Untuk dipakai berdua, isi dengan Project URL dan anon/publishable key dari project
     Supabase KHUSUS Pyojem (Supabase › Project Settings › API).
   Kunci anon/publishable memang aman dipasang di aplikasi web karena dilindungi Row Level Security.
   JANGAN PERNAH mengisi service_role atau secret key di sini. */
window.PYOJEM_CONFIG = {
  supabaseUrl: 'https://nfqfbhlltjmmyyuogors.supabase.co',
  supabaseAnonKey: 'sb_publishable_wbCJdTT6J6M8SG1MSgu1cA_9Xx0pwC1'
};
