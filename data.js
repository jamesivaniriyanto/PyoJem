/* Pyojem Keuangan — lapisan data.
   - Tanpa konfigurasi Supabase: data disimpan di database IndexedDB lokal 'pyojem-keuangan'.
   - Dengan konfigurasi Supabase (config.js): data disimpan di project Supabase khusus Pyojem,
     dibagi berdua lewat login, dan perubahan dari HP pasangan masuk lewat Realtime. */
'use strict';

const uid = () => (window.crypto && crypto.randomUUID ? crypto.randomUUID()
  : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => { const r = Math.random() * 16 | 0; return (c === 'x' ? r : (r & 3 | 8)).toString(16); }));
const WHO = { j: 'James', s: 'Sabrina', b: 'Bersama' };
const NOTIF_DEFAULT = { big: true, bill: true, budget: true, partner: false, secret: false };

/* ---------- saldo dihitung dari saldo awal + transaksi yang tidak di sampah ---------- */
function walletEffects(txs) {
  const m = {};
  const add = (id, v) => { if (id) m[id] = (m[id] || 0) + v; };
  txs.forEach(t => {
    if (t.del) return;
    if (t.k === 'exp') add(t.w, -t.n);
    else if (t.k === 'inc') add(t.w, t.n);
    else { add(t.w, -t.n); add(t.w2, t.n); }
  });
  return m;
}
function recompute(s = S) { const m = walletEffects(s.txs); s.wallets.forEach(w => { w.bal = w.base + (m[w.id] || 0); }); }

/* ---------- data contoh Oktober 2026 ---------- */
function seed() {
  const id = {};
  ['rekber', 'kas', 'darurat', 'dprumah', 'bcaj', 'tunaij', 'gopay', 'mandiri', 'ovo', 'tunais', 'motor', 'laptop', 'gLibur', 'gDarurat', 'gDp'].forEach(k => { id[k] = uid(); });
  const Wl = (k, o, n, icn, sub, bal, save) => ({ id: id[k], o, n, ic: icn, sub, target: bal, save: !!save });
  const wallets = [
    Wl('rekber', 'b', 'Rekening Bersama', 'bank', 'BCA · dipakai belanja rumah', 11750000),
    Wl('kas', 'b', 'Kas Rumah', 'cash', 'Tunai di laci dapur', 1200000),
    Wl('darurat', 'b', 'Tabungan Dana Darurat', 'darurat', 'Terhubung ke tujuan', 42000000, true),
    Wl('dprumah', 'b', 'Tabungan DP Rumah', 'house', 'Terhubung ke tujuan', 38500000, true),
    Wl('bcaj', 'j', 'BCA James', 'bank', 'Rekening gaji', 8420500),
    Wl('tunaij', 'j', 'Tunai James', 'cash', 'Disesuaikan 1 Okt', 650000),
    Wl('gopay', 'j', 'GoPay James', 'phone', 'Dompet digital', 215000),
    Wl('mandiri', 's', 'Mandiri Sabrina', 'bank', 'Rekening gaji', 5180000),
    Wl('ovo', 's', 'OVO Sabrina', 'phone', 'Dompet digital', 142500),
    Wl('tunais', 's', 'Tunai Sabrina', 'cash', 'Disesuaikan 5 Okt', 400000)
  ];
  wallets.forEach((w, i) => { w.ord = i; });
  const H = (by, what, at) => ({ id: uid(), by, what, at });
  const T = (t, k, cat, w, by, n, d, x = {}) => ({ id: uid(), t, k, cat, w: id[w], by, n, d, shared: wallets.find(v => v.id === id[w]).o === 'b', note: '', tags: [], comments: [], hist: [H(by, 'mencatat transaksi ini', d)], del: null, ...x });
  const txs = [
    T('Gaji James', 'inc', 'gaji', 'bcaj', 'j', 12000000, '2026-10-01T08:00'),
    T('Gaji Sabrina', 'inc', 'gaji', 'mandiri', 's', 8500000, '2026-10-01T09:10'),
    T('Zakat penghasilan dan sedekah', 'exp', 'zakat', 'rekber', 's', 850000, '2026-10-01T19:00'),
    T('Kirim untuk orang tua', 'exp', 'keluarga', 'rekber', 'j', 1200000, '2026-10-01T20:00'),
    T('Tiket konser', 'exp', 'hiburan', 'bcaj', 'j', 400000, '2026-10-01T21:15'),
    T('Belanja buah dan susu', 'exp', 'dapur', 'rekber', 's', 445000, '2026-10-02T17:30'),
    T('Reksa dana bulanan', 'exp', 'investasi', 'bcaj', 'j', 2000000, '2026-10-02T10:00'),
    T('Langganan game', 'exp', 'hiburan', 'bcaj', 'j', 165000, '2026-10-02T22:00'),
    T('Galon dan gas', 'exp', 'dapur', 'kas', 'j', 95000, '2026-10-03T08:00'),
    T('Bensin motor', 'exp', 'bensin', 'tunais', 's', 200000, '2026-10-03T07:30'),
    T('Sate ayam Madura', 'exp', 'makanluar', 'gopay', 'j', 280000, '2026-10-03T19:40'),
    T('Parkir dan tol', 'exp', 'bensin', 'gopay', 'j', 50000, '2026-10-04T12:00'),
    T('Kemeja kerja', 'exp', 'pakaian', 'mandiri', 's', 349000, '2026-10-04T15:20'),
    T('Cicilan motor', 'exp', 'cicilan', 'bcaj', 'j', 1250000, '2026-10-05T09:00'),
    T('Makan siang keluarga', 'exp', 'makanluar', 'rekber', 's', 520000, '2026-10-05T13:00'),
    T('Belanja sayur dan lauk', 'exp', 'dapur', 'kas', 's', 412000, '2026-10-06T07:15'),
    T('Internet rumah', 'exp', 'internet', 'bcaj', 'j', 351000, '2026-10-06T10:00'),
    T('Bensin Pertamax', 'exp', 'bensin', 'bcaj', 'j', 200000, '2026-10-07T06:50'),
    T('PDAM', 'exp', 'air', 'rekber', 's', 185000, '2026-10-07T11:00'),
    T('Hasil usaha bulan September', 'inc', 'usaha', 'bcaj', 'j', 4750000, '2026-10-08T10:00'),
    T('Vitamin dan obat flu', 'exp', 'kesehatan', 'mandiri', 's', 96000, '2026-10-08T18:00'),
    T('Token listrik 1300 VA', 'exp', 'listrik', 'bcaj', 'j', 500000, '2026-10-09T09:00'),
    T('BPJS Kesehatan keluarga', 'exp', 'keluarga', 'bcaj', 'j', 300000, '2026-10-09T10:00'),
    T('Kopi dan roti', 'exp', 'makanluar', 'ovo', 's', 90000, '2026-10-09T16:00'),
    T('Hasil reksa dana pasar uang', 'inc', 'hasilinv', 'bcaj', 'j', 325000, '2026-10-10T09:00'),
    T('Nonton bioskop', 'exp', 'hiburan', 'ovo', 's', 120000, '2026-10-10T19:00'),
    T('Belanja bulanan', 'exp', 'dapur', 'rekber', 's', 1245800, '2026-10-11T10:24', {
      tags: ['bulanan', 'stokdapur'],
      note: 'Beras 10 kg, minyak 2 liter, telur 1 kg, sabun cuci, tisu',
      comments: [
        { id: uid(), by: 'j', text: 'Beras naik lagi ya? Bulan lalu masih 145 ribu.', at: '2026-10-11T12:03' },
        { id: uid(), by: 's', text: 'Iya, sekarang 152 ribu. Bulan depan coba beli di agen dekat rumah.', at: '2026-10-11T12:10' }
      ],
      hist: [
        H('j', 'menambah tag #stokdapur', '2026-10-11T12:05'),
        H('s', 'mengubah nominal dari Rp1.254.800 menjadi Rp1.245.800', '2026-10-11T10:31'),
        H('s', 'mencatat transaksi ini', '2026-10-11T10:24')
      ]
    }),
    T('Setor dana darurat', 'trf', 'transfer', 'rekber', 'j', 2000000, '2026-10-11T15:00', { w2: id.darurat, goal: id.gDarurat, to: 'Dana darurat', shared: true }),
    T('Kondangan Dita dan Raka', 'exp', 'kondangan', 'rekber', 's', 500000, '2026-10-12T11:00'),
    T('Makan malam rawon', 'exp', 'makanluar', 'gopay', 'j', 145000, '2026-10-12T19:30'),
    T('Bensin Pertamax', 'exp', 'bensin', 'bcaj', 'j', 200000, '2026-10-13T06:55'),
    T('Sayur dan lauk, Pasar Pucang', 'exp', 'dapur', 'kas', 's', 186500, '2026-10-13T07:40')
  ];
  // saldo awal = saldo sekarang di desain dikurangi efek transaksi contoh
  const eff = walletEffects(txs);
  wallets.forEach(w => { w.base = w.target - (eff[w.id] || 0); delete w.target; });
  return {
    v: 2, user: 'j', loggedIn: false,
    names: { j: 'James', s: 'Sabrina' }, hhName: 'Rumah tangga James dan Sabrina', invite: null, partnerJoined: true,
    notif: { ...NOTIF_DEFAULT },
    wallets, txs,
    budgets: { dapur: 4500000, bensin: 1000000, makanluar: 1200000, hiburan: 600000, listrik: 700000, air: 250000, internet: 400000, pakaian: 500000, kesehatan: 500000, kondangan: 750000, keluarga: 1500000, cicilan: 2125000 },
    loans: [
      { id: id.motor, n: 'Cicilan motor', sub: 'Leasing · tiap tanggal 5 · BCA James', ic: 'motor', a: 1250000, paid: 18, tot: 35, end: 'Mar 2028', pokok: 19380000, next: '5 Nov' },
      { id: id.laptop, n: 'Laptop kerja 0%', sub: 'Kartu kredit · tiap tanggal 22', ic: 'laptop', a: 875000, paid: 4, tot: 12, end: 'Mei 2027', pokok: 7000000, next: '22 Okt' }
    ],
    bills: [
      { id: uid(), n: 'Iuran IPL perumahan', ic: 'house', cat: 'rumah', a: 450000, due: '2026-10-16', w: id.rekber, paid: null },
      { id: uid(), n: 'Pulsa dan paket data 2 HP', ic: 'phone', cat: 'internet', a: 200000, due: '2026-10-18', w: id.rekber, paid: null },
      { id: uid(), n: 'Cicilan laptop', ic: 'laptop', cat: 'cicilan', a: 875000, due: '2026-10-22', w: id.bcaj, loan: id.laptop, paid: null },
      { id: uid(), n: 'Langganan film dan musik', ic: 'hiburan', cat: 'hiburan', a: 120000, due: '2026-10-25', w: id.ovo, paid: null },
      { id: uid(), n: 'Asuransi jiwa James', ic: 'darurat', cat: 'kesehatan', a: 650000, due: '2026-10-28', w: id.bcaj, paid: null },
      { id: uid(), n: 'Cicilan motor', ic: 'motor', cat: 'cicilan', a: 1250000, due: '2026-10-05', w: id.bcaj, loan: id.motor, paid: { by: 'j', at: '2026-10-05', tx: null } },
      { id: uid(), n: 'BPJS Kesehatan keluarga', ic: 'kesehatan', cat: 'keluarga', a: 300000, due: '2026-10-10', w: id.bcaj, paid: { by: 'j', at: '2026-10-09', tx: null } },
      { id: uid(), n: 'PDAM', ic: 'air', cat: 'air', a: 185000, due: '2026-10-10', w: id.rekber, paid: { by: 's', at: '2026-10-07', tx: null } },
      { id: uid(), n: 'Internet rumah', ic: 'internet', cat: 'internet', a: 351000, due: '2026-10-08', w: id.bcaj, paid: { by: 'j', at: '2026-10-06', tx: null } }
    ],
    goals: [
      { id: id.gLibur, n: 'Liburan akhir tahun', ic: 'liburan', wallet: null, have: 12600000, target: 18000000, due: '2026-12-20', j: 6000000, s: 6600000 },
      { id: id.gDarurat, n: 'Dana darurat', ic: 'darurat', wallet: id.darurat, have: 0, target: 90000000, due: '2027-12-31', j: 24000000, s: 16000000 },
      { id: id.gDp, n: 'DP rumah', ic: 'house', wallet: id.dprumah, have: 0, target: 150000000, due: '2028-06-30', j: 24000000, s: 14500000 }
    ],
    debts: [
      { id: uid(), kind: 'in', n: 'Andi', sub: 'Teman kantor', by: 'j', total: 2000000, sisa: 1500000, due: 'Jatuh tempo 31 Okt', remind: 'Ingatkan 28 Okt' },
      { id: uid(), kind: 'in', n: 'Rina', sub: 'Sepupu', by: 's', total: 750000, sisa: 0, due: 'Dilunasi 2 Okt 2026', remind: '' },
      { id: uid(), kind: 'out', n: 'Koperasi kantor', sub: 'Cicil Rp500.000 tiap tanggal 25', by: 's', total: 5000000, sisa: 3000000, due: 'Sisa 6 kali · berikutnya 25 Okt', remind: '' },
      { id: uid(), kind: 'out', n: 'Bayu', sub: 'Talangan tiket konser', by: 'j', total: 300000, sisa: 300000, due: 'Janji dibayar 20 Okt', remind: 'Ingatkan 19 Okt' }
    ],
    assets: [
      { id: uid(), kind: 'aset', n: 'Reksa dana dan saham', ic: 'investasi', sub: '3 akun investasi', v: 64300000 },
      { id: uid(), kind: 'aset', n: 'Emas', ic: 'gold', sub: '20 gram', v: 46000000 },
      { id: uid(), kind: 'aset', n: 'Kendaraan', ic: 'motor', sub: 'Motor, nilai pasar', v: 22000000 },
      { id: uid(), kind: 'kewajiban', n: 'Tagihan kartu kredit', ic: 'card', sub: 'Jatuh tempo 2 Nov', v: 3245000 }
    ]
  };
}

/* Isi awal rumah tangga baru tanpa data contoh: tiga dompet kosong. */
function starter(names) {
  const w = (o, n, icn, sub, ord) => ({ id: uid(), o, n, ic: icn, sub, base: 0, save: false, ord });
  return {
    wallets: [w('b', 'Rekening Bersama', 'bank', 'Untuk kebutuhan rumah', 0), w('j', 'Tunai ' + names.j, 'cash', 'Uang tunai', 1), w('s', 'Tunai ' + names.s, 'cash', 'Uang tunai', 2)],
    txs: [], budgets: {}, loans: [], bills: [], goals: [], debts: [], assets: []
  };
}

/* ---------- database lokal: IndexedDB 'pyojem-keuangan' ---------- */
const DB_NAME = 'pyojem-keuangan', DB_VERSION = 1, DB_STORE = 'rumahTangga', DB_KEY = 'utama';
const FALLBACK_KEY = 'pyojem-keuangan:cadangan'; // hanya dipakai jika IndexedDB tidak tersedia
let localDb = null, localSaveTm = null;
function openLocalDb() {
  return new Promise((res, rej) => {
    if (!window.indexedDB) return rej(new Error('IndexedDB tidak tersedia'));
    const r = indexedDB.open(DB_NAME, DB_VERSION);
    r.onupgradeneeded = () => { if (!r.result.objectStoreNames.contains(DB_STORE)) r.result.createObjectStore(DB_STORE); };
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
    r.onblocked = () => rej(new Error('Database sedang dipakai tab lain'));
  });
}
const validLocal = s => (s && s.v === 2 ? s : null);
async function loadLocal() {
  try {
    localDb = await openLocalDb();
    return validLocal(await new Promise((res, rej) => { const q = localDb.transaction(DB_STORE).objectStore(DB_STORE).get(DB_KEY); q.onsuccess = () => res(q.result); q.onerror = () => rej(q.error); }));
  } catch {
    localDb = null;
    try { return validLocal(JSON.parse(localStorage.getItem(FALLBACK_KEY))); } catch { return null; }
  }
}
function saveLocalNow() {
  if (!S) return;
  if (localDb) { try { localDb.transaction(DB_STORE, 'readwrite').objectStore(DB_STORE).put(S, DB_KEY); return; } catch { /* lanjut ke cadangan */ } }
  try { localStorage.setItem(FALLBACK_KEY, JSON.stringify(S)); } catch { /* mode privat */ }
}
function saveLocalSoon() { clearTimeout(localSaveTm); localSaveTm = setTimeout(saveLocalNow, 0); }

/* ---------- Supabase ---------- */
const CFG = window.PYOJEM_CONFIG || {};
const CLOUD = !!(CFG.supabaseUrl && CFG.supabaseAnonKey);
const SUPABASE_JS = {
  src: 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.js',
  integrity: 'sha384-0w2KAL2YHP6wKOkUDzkCDGgVvfmHnj02DHeQ6XcHOgTfFsGyonKOpShMH1x6nk9o'
};
let sb = null, session = null, HH_ID = null, channel = null;

function ensureSupabase() {
  if (window.supabase) return Promise.resolve();
  return new Promise((res, rej) => {
    const s = document.createElement('script');
    s.src = SUPABASE_JS.src; s.integrity = SUPABASE_JS.integrity; s.crossOrigin = 'anonymous';
    s.onload = () => (window.supabase ? res() : rej(new Error('Pustaka Supabase tidak termuat')));
    s.onerror = () => rej(new Error('Gagal memuat pustaka Supabase. Periksa koneksi internet.'));
    document.head.appendChild(s);
  });
}

const TBL = { wallet: 'dompet', loan: 'cicilan', goal: 'tujuan', tx: 'transaksi', comment: 'komentar', hist: 'riwayat_transaksi', budget: 'anggaran', bill: 'tagihan', debt: 'utang', asset: 'aset' };
const ts = v => (v ? String(v).replace(' ', 'T').slice(0, 16) : null);
const ROW = {
  wallet: w => ({ id: w.id, nama: w.n, pemilik: w.o, ikon: w.ic, keterangan: w.sub || '', saldo_awal: w.base, tabungan: !!w.save, urutan: w.ord || 0 }),
  loan: l => ({ id: l.id, nama: l.n, keterangan: l.sub || '', ikon: l.ic, nominal: l.a, sudah: l.paid, total: l.tot, lunas_label: l.end || '', sisa_pokok: l.pokok, berikutnya: l.next || '' }),
  goal: g => ({ id: g.id, nama: g.n, ikon: g.ic, dompet_id: g.wallet || null, terkumpul_awal: g.have || 0, target: g.target, tenggat: g.due, setoran_awal_j: g.j || 0, setoran_awal_s: g.s || 0 }),
  tx: t => ({ id: t.id, judul: t.t, jenis: t.k, kategori: t.cat, dompet_id: t.w, dompet_tujuan_id: t.w2 || null, tujuan_id: t.goal || null, tujuan_label: t.to || null, nominal: t.n, waktu: t.d, bersama: !!t.shared, catatan: t.note || '', tag: t.tags || [], dicatat_oleh: t.by, dihapus_pada: t.del ? t.del.at : null, dihapus_oleh: t.del ? t.del.by : null }),
  comment: (c, txId) => ({ id: c.id, transaksi_id: txId, oleh: c.by, isi: c.text, waktu: c.at }),
  hist: (h, txId) => ({ id: h.id, transaksi_id: txId, oleh: h.by, isi: h.what, waktu: h.at }),
  budget: b => ({ kategori: b.cat, batas: b.lim }),
  bill: b => ({ id: b.id, nama: b.n, ikon: b.ic, kategori: b.cat, nominal: b.a, jatuh_tempo: b.due, dompet_id: b.w, cicilan_id: b.loan || null, dibayar_oleh: b.paid ? b.paid.by : null, dibayar_pada: b.paid ? b.paid.at : null, transaksi_id: b.paid ? b.paid.tx || null : null }),
  debt: d => ({ id: d.id, arah: d.kind, nama: d.n, keterangan: d.sub || '', dicatat_oleh: d.by, total: d.total, sisa: d.sisa, keterangan_tempo: d.due || '', pengingat: d.remind || '' }),
  asset: a => ({ id: a.id, jenis: a.kind, nama: a.n, ikon: a.ic, keterangan: a.sub || '', nilai: a.v })
};
const OBJ = {
  wallet: r => ({ id: r.id, n: r.nama, o: r.pemilik, ic: r.ikon, sub: r.keterangan, base: Number(r.saldo_awal), save: r.tabungan, ord: r.urutan }),
  loan: r => ({ id: r.id, n: r.nama, sub: r.keterangan, ic: r.ikon, a: Number(r.nominal), paid: r.sudah, tot: r.total, end: r.lunas_label, pokok: Number(r.sisa_pokok), next: r.berikutnya }),
  goal: r => ({ id: r.id, n: r.nama, ic: r.ikon, wallet: r.dompet_id, have: Number(r.terkumpul_awal), target: Number(r.target), due: r.tenggat, j: Number(r.setoran_awal_j), s: Number(r.setoran_awal_s) }),
  tx: r => ({ id: r.id, t: r.judul, k: r.jenis, cat: r.kategori, w: r.dompet_id, w2: r.dompet_tujuan_id || undefined, goal: r.tujuan_id || undefined, to: r.tujuan_label || undefined, n: Number(r.nominal), d: ts(r.waktu), shared: r.bersama, note: r.catatan, tags: r.tag || [], by: r.dicatat_oleh, del: r.dihapus_pada ? { at: ts(r.dihapus_pada), by: r.dihapus_oleh } : null, comments: [], hist: [] }),
  comment: r => ({ id: r.id, by: r.oleh, text: r.isi, at: ts(r.waktu) }),
  hist: r => ({ id: r.id, by: r.oleh, what: r.isi, at: ts(r.waktu) }),
  bill: r => ({ id: r.id, n: r.nama, ic: r.ikon, cat: r.kategori, a: Number(r.nominal), due: r.jatuh_tempo, w: r.dompet_id, loan: r.cicilan_id || undefined, paid: r.dibayar_pada ? { by: r.dibayar_oleh, at: r.dibayar_pada, tx: r.transaksi_id } : null }),
  debt: r => ({ id: r.id, kind: r.arah, n: r.nama, sub: r.keterangan, by: r.dicatat_oleh, total: Number(r.total), sisa: Number(r.sisa), due: r.keterangan_tempo, remind: r.pengingat }),
  asset: r => ({ id: r.id, kind: r.jenis, n: r.nama, ic: r.ikon, sub: r.keterangan, v: Number(r.nilai) })
};

const ok = ({ data, error }) => { if (error) throw error; return data; };
async function fetchAll(table, orders) {
  const out = [];
  for (let from = 0; ; from += 1000) {
    let q = sb.from(table).select('*');
    orders.forEach(c => { q = q.order(c); });
    const data = ok(await q.range(from, from + 999));
    out.push(...data);
    if (data.length < 1000) return out;
  }
}

/* Membaca seluruh data rumah tangga pengguna. null = belum tergabung di rumah tangga. */
async function loadCloud() {
  const mem = ok(await sb.from('anggota').select('kode, rumah_tangga_id').eq('user_id', session.user.id).maybeSingle());
  if (!mem) return null;
  HH_ID = mem.rumah_tangga_id;
  const [hh, members, wallets, loans, goals, txs, comments, hist, budgets, bills, debts, assets] = await Promise.all([
    sb.from('rumah_tangga').select('*').eq('id', HH_ID).single().then(ok),
    sb.from('anggota').select('kode').then(ok),
    fetchAll('dompet', ['urutan', 'dibuat_pada', 'id']),
    fetchAll('cicilan', ['dibuat_pada', 'id']),
    fetchAll('tujuan', ['dibuat_pada', 'id']),
    fetchAll('transaksi', ['waktu', 'id']),
    fetchAll('komentar', ['waktu', 'id']),
    fetchAll('riwayat_transaksi', ['waktu', 'id']),
    fetchAll('anggaran', ['kategori']),
    fetchAll('tagihan', ['jatuh_tempo', 'id']),
    fetchAll('utang', ['dibuat_pada', 'id']),
    fetchAll('aset', ['dibuat_pada', 'id'])
  ]);
  const txList = txs.map(OBJ.tx), byId = new Map(txList.map(t => [t.id, t]));
  comments.forEach(r => byId.get(r.transaksi_id)?.comments.push(OBJ.comment(r)));
  hist.forEach(r => byId.get(r.transaksi_id)?.hist.unshift(OBJ.hist(r)));
  return {
    v: 2, user: mem.kode, loggedIn: true,
    names: { j: hh.nama_j, s: hh.nama_s }, hhName: hh.nama, invite: hh.kode_undangan, partnerJoined: members.length >= 2,
    notif: { ...NOTIF_DEFAULT, ...(hh.notifikasi || {}) },
    wallets: wallets.map(OBJ.wallet), txs: txList,
    budgets: Object.fromEntries(budgets.map(r => [r.kategori, Number(r.batas)])),
    loans: loans.map(OBJ.loan), bills: bills.map(OBJ.bill), goals: goals.map(OBJ.goal), debts: debts.map(OBJ.debt), assets: assets.map(OBJ.asset)
  };
}

/* Mengisi rumah tangga baru (data contoh atau isi awal kosong). */
async function seedCloud(s) {
  const ins = async (kind, rows) => { if (rows.length) ok(await sb.from(TBL[kind]).insert(rows.map(r => ({ ...r, rumah_tangga_id: HH_ID })))); };
  await ins('wallet', s.wallets.map(w => ROW.wallet(w)));
  await ins('loan', s.loans.map(l => ROW.loan(l)));
  await ins('goal', s.goals.map(g => ROW.goal(g)));
  await ins('tx', s.txs.map(t => ROW.tx(t)));
  await ins('comment', s.txs.flatMap(t => t.comments.map(c => ROW.comment(c, t.id))));
  await ins('hist', s.txs.flatMap(t => t.hist.map(h => ROW.hist(h, t.id))));
  await ins('budget', Object.entries(s.budgets).map(([cat, lim]) => ROW.budget({ cat, lim })));
  await ins('bill', s.bills.map(b => ROW.bill(b)));
  await ins('debt', s.debts.map(d => ROW.debt(d)));
  await ins('asset', s.assets.map(a => ROW.asset(a)));
}

/* Antrean tulis: perubahan dikirim berurutan supaya relasi antartabel selalu valid. */
let writeQ = Promise.resolve();
function enqueue(fn) {
  writeQ = writeQ.then(async () => ok(await fn())).catch(err => { console.error(err); onWriteError(err); });
  return writeQ;
}
/* API penyimpanan yang dipakai layar: lokal menyimpan seluruh data, Supabase per baris. */
const P = {
  put(kind, obj, parentId) {
    if (!CLOUD) return saveLocalSoon();
    const row = { ...ROW[kind](obj, parentId), rumah_tangga_id: HH_ID };
    return enqueue(() => sb.from(TBL[kind]).upsert(row, kind === 'budget' ? { onConflict: 'rumah_tangga_id,kategori' } : undefined));
  },
  del(kind, id) {
    if (!CLOUD) return saveLocalSoon();
    return enqueue(() => (kind === 'budget' ? sb.from('anggaran').delete().eq('kategori', id) : sb.from(TBL[kind]).delete().eq('id', id)));
  },
  settings() {
    if (!CLOUD) return saveLocalSoon();
    return enqueue(() => sb.from('rumah_tangga').update({ notifikasi: S.notif }).eq('id', HH_ID));
  }
};

function subscribeCloud() {
  if (channel) return;
  channel = sb.channel('pyojem-perubahan');
  [...Object.values(TBL), 'rumah_tangga', 'anggota'].forEach(table => channel.on('postgres_changes', { event: '*', schema: 'public', table }, onRemoteChange));
  channel.subscribe();
}
function unsubscribeCloud() { if (channel) { sb.removeChannel(channel); channel = null; } }
