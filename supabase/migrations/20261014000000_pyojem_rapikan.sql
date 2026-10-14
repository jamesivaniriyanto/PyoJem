-- Pyojem Keuangan: perapian setelah pemeriksaan Supabase Advisors.

-- Fungsi bantu RLS dipindah ke skema yang tidak dibuka lewat API (/rest/v1/rpc),
-- jadi hanya dipakai oleh kebijakan RLS dan nilai bawaan kolom. Kebijakan dan nilai
-- bawaan merujuk fungsi lewat OID, sehingga tetap berjalan setelah dipindah.
create schema if not exists pribadi;
revoke all on schema pribadi from public;
grant usage on schema pribadi to authenticated;
alter function public.rumah_tangga_saya() set schema pribadi;

-- Indeks untuk relasi antartabel (dan filter RLS per rumah tangga).
create index aset_rumah_tangga_idx on public.aset (rumah_tangga_id);
create index utang_rumah_tangga_idx on public.utang (rumah_tangga_id);
create index komentar_rumah_tangga_transaksi_idx on public.komentar (rumah_tangga_id, transaksi_id);
create index riwayat_rumah_tangga_transaksi_idx on public.riwayat_transaksi (rumah_tangga_id, transaksi_id);
create index tagihan_dompet_idx on public.tagihan (rumah_tangga_id, dompet_id);
create index tagihan_cicilan_idx on public.tagihan (rumah_tangga_id, cicilan_id);
create index tagihan_transaksi_idx on public.tagihan (rumah_tangga_id, transaksi_id);
create index transaksi_dompet_idx on public.transaksi (rumah_tangga_id, dompet_id);
create index transaksi_dompet_tujuan_idx on public.transaksi (rumah_tangga_id, dompet_tujuan_id);
create index transaksi_tujuan_idx on public.transaksi (rumah_tangga_id, tujuan_id);
create index tujuan_dompet_idx on public.tujuan (rumah_tangga_id, dompet_id);
