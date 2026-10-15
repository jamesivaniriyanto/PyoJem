-- Pindah ke rumah tangga pasangan dengan kode undangan.
-- Untuk akun yang terlanjur membuat rumah tangga sendiri (misalnya pasangan yang salah memilih
-- "Buat rumah tangga baru"). Hanya boleh jika akun ini satu-satunya anggota rumah tangganya:
-- rumah tangga lama beserta isinya dihapus, lalu akun bergabung ke rumah tangga tujuan.

create function public.pindah_rumah_tangga(p_kode_undangan text)
returns public.rumah_tangga
language plpgsql security definer set search_path = ''
as $$
declare
  v_lama uuid;
  r public.rumah_tangga;
  v_kode text;
begin
  if auth.uid() is null then
    raise exception 'Harus masuk dulu';
  end if;

  select rumah_tangga_id into v_lama from public.anggota where user_id = auth.uid();
  if v_lama is null then
    raise exception 'Akun ini belum tergabung di rumah tangga mana pun';
  end if;

  select * into r from public.rumah_tangga
  where kode_undangan = upper(trim(p_kode_undangan))
  for update;
  if not found then
    raise exception 'Kode undangan tidak ditemukan';
  end if;
  if r.id = v_lama then
    raise exception 'Ini kode rumah tangga kamu sendiri. Masukkan kode dari HP pasanganmu';
  end if;

  perform 1 from public.rumah_tangga where id = v_lama for update;
  if exists (select 1 from public.anggota where rumah_tangga_id = v_lama and user_id <> auth.uid()) then
    raise exception 'Rumah tangga kamu sudah punya dua anggota, jadi tidak bisa pindah';
  end if;

  select k into v_kode from unnest(array['j', 's']) as k
  where not exists (select 1 from public.anggota a where a.rumah_tangga_id = r.id and a.kode = k)
  limit 1;
  if v_kode is null then
    raise exception 'Rumah tangga ini sudah punya dua anggota';
  end if;

  delete from public.rumah_tangga where id = v_lama;
  insert into public.anggota (rumah_tangga_id, user_id, kode) values (r.id, auth.uid(), v_kode);
  return r;
end
$$;

revoke all on function public.pindah_rumah_tangga(text) from public, anon;
grant execute on function public.pindah_rumah_tangga(text) to authenticated;
