// Pyojem Keuangan — Edge Function `kirim-notifikasi`.
// Dipanggil aplikasi (dengan sesi login pengguna) untuk:
//   { aksi: 'kunci' }                         → kunci publik VAPID untuk berlangganan push
//   { aksi: 'daftar', langganan: {...} }      → menyimpan langganan push perangkat ini
//   { aksi: 'hapus', endpoint }               → menghapus langganan push perangkat ini
//   { aksi: 'kirim', transaksi_id }           → memberi tahu HP pasangan tentang transaksi baru
import webpush from 'npm:web-push@3.6.7';
import { createClient } from 'npm:@supabase/supabase-js@2.117.2';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...CORS, 'Content-Type': 'application/json' } });

function serviceKey(): string {
  const legacy = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (legacy) return legacy;
  try { return JSON.parse(Deno.env.get('SUPABASE_SECRET_KEYS') || '{}').default; } catch { return ''; }
}
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const admin = createClient(SUPABASE_URL, serviceKey(), { auth: { persistSession: false, autoRefreshToken: false } });

let vapid: { publik: string; privat: string } | null = null;
async function getVapid() {
  if (vapid) return vapid;
  let { data } = await admin.from('kunci_vapid').select('publik, privat').eq('id', 1).maybeSingle();
  if (!data) {
    const k = webpush.generateVAPIDKeys();
    await admin.from('kunci_vapid').upsert({ id: 1, publik: k.publicKey, privat: k.privateKey }, { onConflict: 'id', ignoreDuplicates: true });
    ({ data } = await admin.from('kunci_vapid').select('publik, privat').eq('id', 1).single());
  }
  vapid = data!;
  webpush.setVapidDetails(SUPABASE_URL, vapid.publik, vapid.privat);
  return vapid;
}

const rupiah = (n: number) => 'Rp' + Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');

Deno.serve(async req => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return json({ error: 'Metode tidak didukung' }, 405);
  try {
    const token = (req.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '');
    const { data: u } = await admin.auth.getUser(token);
    if (!u?.user) return json({ error: 'Harus masuk dulu' }, 401);
    const { data: mem } = await admin.from('anggota').select('rumah_tangga_id, kode').eq('user_id', u.user.id).maybeSingle();
    if (!mem) return json({ error: 'Belum tergabung di rumah tangga' }, 403);
    const body = await req.json().catch(() => ({}));

    if (body.aksi === 'kunci') return json({ kunci: (await getVapid()).publik });

    if (body.aksi === 'daftar') {
      const s = body.langganan || {};
      if (typeof s.endpoint !== 'string' || !s.endpoint.startsWith('https://') || !s.keys?.p256dh || !s.keys?.auth) return json({ error: 'Langganan tidak valid' }, 400);
      const { error } = await admin.from('langganan_push').upsert({ endpoint: s.endpoint, p256dh: s.keys.p256dh, auth: s.keys.auth, user_id: u.user.id, rumah_tangga_id: mem.rumah_tangga_id, kode: mem.kode });
      if (error) throw error;
      return json({ ok: true });
    }

    if (body.aksi === 'hapus') {
      const { error } = await admin.from('langganan_push').delete().eq('endpoint', String(body.endpoint || '')).eq('user_id', u.user.id);
      if (error) throw error;
      return json({ ok: true });
    }

    if (body.aksi === 'kirim') {
      const { data: t } = await admin.from('transaksi').select('id, judul, jenis, nominal, dicatat_oleh, dibuat_pada, dihapus_pada')
        .eq('id', String(body.transaksi_id || '')).eq('rumah_tangga_id', mem.rumah_tangga_id).maybeSingle();
      // Hanya transaksi baru (10 menit terakhir) yang dicatat oleh pemanggil sendiri.
      if (!t || t.dicatat_oleh !== mem.kode || t.dihapus_pada || !['inc', 'exp'].includes(t.jenis)
        || Date.now() - new Date(t.dibuat_pada).getTime() > 10 * 60 * 1000) return json({ terkirim: 0 });
      const { data: hh } = await admin.from('rumah_tangga').select('nama_j, nama_s, notifikasi').eq('id', mem.rumah_tangga_id).single();
      const n = hh!.notifikasi || {};
      const besar = t.jenis === 'exp' && Number(t.nominal) >= 1_000_000;
      if (n.partner === false && !(n.big !== false && besar)) return json({ terkirim: 0 });
      const { error: dup } = await admin.from('push_terkirim').insert({ transaksi_id: t.id });
      if (dup) return json({ terkirim: 0 }); // sudah pernah dikirim

      const nama = t.dicatat_oleh === 'j' ? hh!.nama_j : hh!.nama_s;
      const payload = JSON.stringify({
        title: `${nama} mencatat ${t.jenis === 'exp' ? (besar ? 'pengeluaran besar' : 'pengeluaran') : 'pemasukan'}`,
        body: `${t.judul} · ${t.jenis === 'exp' ? '−' : '+'}${rupiah(Number(t.nominal))}`,
        tag: 'tx-' + t.id,
        url: './#/detail/' + t.id
      });
      await getVapid();
      const { data: subs } = await admin.from('langganan_push').select('endpoint, p256dh, auth')
        .eq('rumah_tangga_id', mem.rumah_tangga_id).neq('kode', t.dicatat_oleh);
      let terkirim = 0;
      await Promise.all((subs || []).map(async s => {
        try {
          await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, payload, { TTL: 86400, urgency: 'high' });
          terkirim++;
        } catch (e) {
          const code = (e as { statusCode?: number }).statusCode;
          if (code === 404 || code === 410) await admin.from('langganan_push').delete().eq('endpoint', s.endpoint);
          else console.error('push gagal', code, (e as Error).message);
        }
      }));
      return json({ terkirim });
    }

    return json({ error: 'Aksi tidak dikenal' }, 400);
  } catch (e) {
    console.error(e);
    return json({ error: (e as Error).message || String(e) }, 500);
  }
});
