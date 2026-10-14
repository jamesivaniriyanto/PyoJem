-- Pyojem Keuangan: notifikasi push ke HP saat pasangan mencatat pemasukan atau pengeluaran.
-- Ketiga tabel ini hanya diakses oleh Edge Function `kirim-notifikasi` (service role).
-- RLS aktif tanpa kebijakan, jadi aplikasi (anon/authenticated) tidak bisa membaca atau menulisnya langsung.

-- Langganan push per perangkat (satu baris per HP/browser yang mengaktifkan notifikasi).
create table public.langganan_push (
  endpoint text primary key check (endpoint like 'https://%'),
  rumah_tangga_id uuid not null references public.rumah_tangga (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  kode text not null check (kode in ('j', 's')),
  p256dh text not null,
  auth text not null,
  dibuat_pada timestamptz not null default now()
);
create index langganan_push_rumah_tangga_idx on public.langganan_push (rumah_tangga_id, kode);
create index langganan_push_user_idx on public.langganan_push (user_id);

-- Transaksi yang notifikasinya sudah dikirim, supaya satu transaksi hanya diberitahukan sekali.
create table public.push_terkirim (
  transaksi_id uuid primary key references public.transaksi (id) on delete cascade,
  dikirim_pada timestamptz not null default now()
);

-- Pasangan kunci VAPID untuk Web Push. Dibuat otomatis oleh Edge Function saat pertama dipakai.
create table public.kunci_vapid (
  id smallint primary key default 1 check (id = 1),
  publik text not null,
  privat text not null,
  dibuat_pada timestamptz not null default now()
);

alter table public.langganan_push enable row level security;
alter table public.push_terkirim enable row level security;
alter table public.kunci_vapid enable row level security;
revoke all on public.langganan_push, public.push_terkirim, public.kunci_vapid from anon, authenticated;

-- Rumah tangga baru: notifikasi catatan pasangan langsung aktif.
alter table public.rumah_tangga alter column notifikasi
  set default '{"big": true, "bill": true, "budget": true, "partner": true, "secret": false}';
