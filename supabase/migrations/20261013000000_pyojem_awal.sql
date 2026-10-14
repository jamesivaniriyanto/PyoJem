-- Pyojem Keuangan: skema awal untuk project Supabase KHUSUS Pyojem.
-- Jalankan sekali di SQL Editor project Supabase yang baru (atau lewat `supabase db push`).
--
-- Model: satu rumah tangga berisi paling banyak dua anggota (kode 'j' dan 's').
-- Setiap tabel data punya kolom rumah_tangga_id, dan Row Level Security memastikan
-- pengguna hanya bisa membaca dan menulis data rumah tangganya sendiri.
-- Waktu yang diisi aplikasi (waktu transaksi, komentar, dll.) disimpan sebagai
-- `timestamp` tanpa zona waktu: jam dinding lokal, sama seperti yang dicatat pengguna.

-- ---------------------------------------------------------------------------
-- Rumah tangga dan anggota
-- ---------------------------------------------------------------------------
create table public.rumah_tangga (
  id uuid primary key default gen_random_uuid(),
  nama text not null default 'Rumah tangga kita' check (char_length(nama) between 1 and 80),
  nama_j text not null default 'James' check (char_length(nama_j) between 1 and 40),
  nama_s text not null default 'Sabrina' check (char_length(nama_s) between 1 and 40),
  kode_undangan text not null unique,
  notifikasi jsonb not null default '{"big": true, "bill": true, "budget": true, "partner": false, "secret": false}',
  dibuat_pada timestamptz not null default now()
);

create table public.anggota (
  rumah_tangga_id uuid not null references public.rumah_tangga (id) on delete cascade,
  user_id uuid not null unique references auth.users (id) on delete cascade,
  kode text not null check (kode in ('j', 's')),
  bergabung_pada timestamptz not null default now(),
  primary key (rumah_tangga_id, kode)
);

-- Rumah tangga milik pengguna yang sedang masuk (null jika belum tergabung).
create function public.rumah_tangga_saya() returns uuid
language sql stable security definer set search_path = ''
as $$
  select a.rumah_tangga_id from public.anggota a where a.user_id = auth.uid()
$$;

-- ---------------------------------------------------------------------------
-- Data keuangan
-- ---------------------------------------------------------------------------
create table public.dompet (
  id uuid primary key default gen_random_uuid(),
  rumah_tangga_id uuid not null default public.rumah_tangga_saya() references public.rumah_tangga (id) on delete cascade,
  nama text not null check (char_length(nama) between 1 and 80),
  pemilik text not null check (pemilik in ('b', 'j', 's')),
  ikon text not null default 'wallet',
  keterangan text not null default '',
  saldo_awal bigint not null default 0,
  tabungan boolean not null default false,
  urutan integer not null default 0,
  dibuat_pada timestamptz not null default now(),
  unique (rumah_tangga_id, id)
);

create table public.cicilan (
  id uuid primary key default gen_random_uuid(),
  rumah_tangga_id uuid not null default public.rumah_tangga_saya() references public.rumah_tangga (id) on delete cascade,
  nama text not null check (char_length(nama) between 1 and 80),
  keterangan text not null default '',
  ikon text not null default 'cicilan',
  nominal bigint not null check (nominal > 0),
  sudah integer not null default 0 check (sudah >= 0),
  total integer not null check (total > 0),
  lunas_label text not null default '',
  sisa_pokok bigint not null default 0 check (sisa_pokok >= 0),
  berikutnya text not null default '',
  dibuat_pada timestamptz not null default now(),
  unique (rumah_tangga_id, id)
);

create table public.tujuan (
  id uuid primary key default gen_random_uuid(),
  rumah_tangga_id uuid not null default public.rumah_tangga_saya() references public.rumah_tangga (id) on delete cascade,
  nama text not null check (char_length(nama) between 1 and 80),
  ikon text not null default 'target',
  dompet_id uuid,
  terkumpul_awal bigint not null default 0,
  target bigint not null check (target > 0),
  tenggat date not null,
  setoran_awal_j bigint not null default 0,
  setoran_awal_s bigint not null default 0,
  dibuat_pada timestamptz not null default now(),
  unique (rumah_tangga_id, id),
  foreign key (rumah_tangga_id, dompet_id) references public.dompet (rumah_tangga_id, id) on delete set null (dompet_id)
);

create table public.transaksi (
  id uuid primary key default gen_random_uuid(),
  rumah_tangga_id uuid not null default public.rumah_tangga_saya() references public.rumah_tangga (id) on delete cascade,
  judul text not null check (char_length(judul) between 1 and 200),
  jenis text not null check (jenis in ('inc', 'exp', 'trf')),
  kategori text not null,
  dompet_id uuid not null,
  dompet_tujuan_id uuid,
  tujuan_id uuid,
  tujuan_label text,
  nominal bigint not null check (nominal > 0),
  waktu timestamp not null,
  bersama boolean not null default false,
  catatan text not null default '',
  tag text[] not null default '{}',
  dicatat_oleh text not null check (dicatat_oleh in ('j', 's')),
  -- Sampah: transaksi yang dihapus disimpan dulu dan bisa dikembalikan.
  dihapus_pada timestamp,
  dihapus_oleh text check (dihapus_oleh in ('j', 's')),
  dibuat_pada timestamptz not null default now(),
  diubah_pada timestamptz not null default now(),
  unique (rumah_tangga_id, id),
  foreign key (rumah_tangga_id, dompet_id) references public.dompet (rumah_tangga_id, id),
  foreign key (rumah_tangga_id, dompet_tujuan_id) references public.dompet (rumah_tangga_id, id),
  foreign key (rumah_tangga_id, tujuan_id) references public.tujuan (rumah_tangga_id, id) on delete set null (tujuan_id)
);
create index transaksi_waktu_idx on public.transaksi (rumah_tangga_id, waktu desc);

create table public.komentar (
  id uuid primary key default gen_random_uuid(),
  rumah_tangga_id uuid not null default public.rumah_tangga_saya() references public.rumah_tangga (id) on delete cascade,
  transaksi_id uuid not null,
  oleh text not null check (oleh in ('j', 's')),
  isi text not null check (char_length(isi) between 1 and 1000),
  waktu timestamp not null,
  dibuat_pada timestamptz not null default now(),
  foreign key (rumah_tangga_id, transaksi_id) references public.transaksi (rumah_tangga_id, id) on delete cascade
);
create index komentar_transaksi_idx on public.komentar (transaksi_id);

create table public.riwayat_transaksi (
  id uuid primary key default gen_random_uuid(),
  rumah_tangga_id uuid not null default public.rumah_tangga_saya() references public.rumah_tangga (id) on delete cascade,
  transaksi_id uuid not null,
  oleh text not null check (oleh in ('j', 's')),
  isi text not null,
  waktu timestamp not null,
  dibuat_pada timestamptz not null default now(),
  foreign key (rumah_tangga_id, transaksi_id) references public.transaksi (rumah_tangga_id, id) on delete cascade
);
create index riwayat_transaksi_idx on public.riwayat_transaksi (transaksi_id);

create table public.anggaran (
  rumah_tangga_id uuid not null default public.rumah_tangga_saya() references public.rumah_tangga (id) on delete cascade,
  kategori text not null,
  batas bigint not null check (batas > 0),
  dibuat_pada timestamptz not null default now(),
  primary key (rumah_tangga_id, kategori)
);

create table public.tagihan (
  id uuid primary key default gen_random_uuid(),
  rumah_tangga_id uuid not null default public.rumah_tangga_saya() references public.rumah_tangga (id) on delete cascade,
  nama text not null check (char_length(nama) between 1 and 80),
  ikon text not null default 'bill',
  kategori text not null,
  nominal bigint not null check (nominal > 0),
  jatuh_tempo date not null,
  dompet_id uuid not null,
  cicilan_id uuid,
  dibayar_oleh text check (dibayar_oleh in ('j', 's')),
  dibayar_pada date,
  transaksi_id uuid,
  dibuat_pada timestamptz not null default now(),
  foreign key (rumah_tangga_id, dompet_id) references public.dompet (rumah_tangga_id, id),
  foreign key (rumah_tangga_id, cicilan_id) references public.cicilan (rumah_tangga_id, id) on delete set null (cicilan_id),
  foreign key (rumah_tangga_id, transaksi_id) references public.transaksi (rumah_tangga_id, id) on delete set null (transaksi_id)
);

create table public.utang (
  id uuid primary key default gen_random_uuid(),
  rumah_tangga_id uuid not null default public.rumah_tangga_saya() references public.rumah_tangga (id) on delete cascade,
  arah text not null check (arah in ('in', 'out')),
  nama text not null check (char_length(nama) between 1 and 80),
  keterangan text not null default '',
  dicatat_oleh text not null check (dicatat_oleh in ('j', 's')),
  total bigint not null check (total > 0),
  sisa bigint not null check (sisa >= 0),
  keterangan_tempo text not null default '',
  pengingat text not null default '',
  dibuat_pada timestamptz not null default now(),
  check (sisa <= total)
);

create table public.aset (
  id uuid primary key default gen_random_uuid(),
  rumah_tangga_id uuid not null default public.rumah_tangga_saya() references public.rumah_tangga (id) on delete cascade,
  jenis text not null check (jenis in ('aset', 'kewajiban')),
  nama text not null check (char_length(nama) between 1 and 80),
  ikon text not null default 'asset',
  keterangan text not null default '',
  nilai bigint not null check (nilai >= 0),
  dibuat_pada timestamptz not null default now()
);

create function public.isi_diubah_pada() returns trigger
language plpgsql set search_path = ''
as $$
begin
  new.diubah_pada := now();
  return new;
end
$$;
create trigger transaksi_diubah before update on public.transaksi
for each row execute function public.isi_diubah_pada();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.rumah_tangga enable row level security;
alter table public.anggota enable row level security;

create policy "anggota membaca rumah tangganya" on public.rumah_tangga
  for select to authenticated using (id = (select public.rumah_tangga_saya()));
create policy "anggota mengubah rumah tangganya" on public.rumah_tangga
  for update to authenticated
  using (id = (select public.rumah_tangga_saya()))
  with check (id = (select public.rumah_tangga_saya()));
-- Kode undangan dan id tidak boleh diubah dari aplikasi.
revoke insert, update, delete on public.rumah_tangga from anon, authenticated;
grant update (nama, nama_j, nama_s, notifikasi) on public.rumah_tangga to authenticated;

create policy "anggota melihat sesama anggota" on public.anggota
  for select to authenticated using (rumah_tangga_id = (select public.rumah_tangga_saya()));
-- Bergabung dan membuat rumah tangga hanya lewat fungsi di bawah.
revoke insert, update, delete on public.anggota from anon, authenticated;

do $$
declare t text;
begin
  foreach t in array array['dompet', 'cicilan', 'tujuan', 'transaksi', 'komentar', 'riwayat_transaksi', 'anggaran', 'tagihan', 'utang', 'aset']
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format(
      'create policy "data rumah tangga sendiri" on public.%I for all to authenticated
         using (rumah_tangga_id = (select public.rumah_tangga_saya()))
         with check (rumah_tangga_id = (select public.rumah_tangga_saya()))', t);
    execute format('revoke all on public.%I from anon', t);
  end loop;
end
$$;

-- ---------------------------------------------------------------------------
-- Membuat dan bergabung ke rumah tangga
-- ---------------------------------------------------------------------------
create function public.buat_rumah_tangga(p_nama text, p_kode text, p_nama_j text, p_nama_s text)
returns public.rumah_tangga
language plpgsql security definer set search_path = ''
as $$
declare
  r public.rumah_tangga;
begin
  if auth.uid() is null then
    raise exception 'Harus masuk dulu';
  end if;
  if exists (select 1 from public.anggota where user_id = auth.uid()) then
    raise exception 'Akun ini sudah tergabung di sebuah rumah tangga';
  end if;
  if p_kode is null or p_kode not in ('j', 's') then
    raise exception 'Pilihan anggota tidak valid';
  end if;

  insert into public.rumah_tangga (nama, nama_j, nama_s, kode_undangan)
  values (
    coalesce(nullif(trim(p_nama), ''), 'Rumah tangga kita'),
    coalesce(nullif(trim(p_nama_j), ''), 'James'),
    coalesce(nullif(trim(p_nama_s), ''), 'Sabrina'),
    upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8))
  )
  returning * into r;

  insert into public.anggota (rumah_tangga_id, user_id, kode) values (r.id, auth.uid(), p_kode);
  return r;
end
$$;

create function public.gabung_rumah_tangga(p_kode_undangan text)
returns public.rumah_tangga
language plpgsql security definer set search_path = ''
as $$
declare
  r public.rumah_tangga;
  v_kode text;
begin
  if auth.uid() is null then
    raise exception 'Harus masuk dulu';
  end if;
  if exists (select 1 from public.anggota where user_id = auth.uid()) then
    raise exception 'Akun ini sudah tergabung di sebuah rumah tangga';
  end if;

  select * into r from public.rumah_tangga
  where kode_undangan = upper(trim(p_kode_undangan))
  for update;
  if not found then
    raise exception 'Kode undangan tidak ditemukan';
  end if;

  select k into v_kode from unnest(array['j', 's']) as k
  where not exists (select 1 from public.anggota a where a.rumah_tangga_id = r.id and a.kode = k)
  limit 1;
  if v_kode is null then
    raise exception 'Rumah tangga ini sudah punya dua anggota';
  end if;

  insert into public.anggota (rumah_tangga_id, user_id, kode) values (r.id, auth.uid(), v_kode);
  return r;
end
$$;

revoke all on function public.rumah_tangga_saya() from public, anon;
revoke all on function public.buat_rumah_tangga(text, text, text, text) from public, anon;
revoke all on function public.gabung_rumah_tangga(text) from public, anon;
grant execute on function public.rumah_tangga_saya() to authenticated;
grant execute on function public.buat_rumah_tangga(text, text, text, text) to authenticated;
grant execute on function public.gabung_rumah_tangga(text) to authenticated;

-- ---------------------------------------------------------------------------
-- Realtime: perubahan dari HP pasangan langsung muncul
-- ---------------------------------------------------------------------------
alter publication supabase_realtime add table
  public.rumah_tangga, public.anggota, public.dompet, public.cicilan, public.tujuan, public.transaksi,
  public.komentar, public.riwayat_transaksi, public.anggaran, public.tagihan, public.utang, public.aset;
