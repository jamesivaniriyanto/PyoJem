/* Pyojem Keuangan — aplikasi keuangan rumah tangga berdua.
   Satu halaman, data disimpan di localStorage browser. */
'use strict';

/* ---------- utilitas ---------- */
const $ = (s, r = document) => r.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const ic = (k, st = '') => `<svg class="ic" viewBox="0 0 24 24" aria-hidden="true"${st ? ` style="${st}"` : ''}><path d="${I[k] || I.lainnya}"></path></svg>`;
const rp = n => 'Rp' + Math.round(Math.abs(n)).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
const jt = n => (n < 0 ? '−' : '') + 'Rp' + (Math.abs(n) / 1e6).toLocaleString('id-ID', { maximumFractionDigits: 2 }) + ' jt';
const sg = (k, n) => (k === 'inc' ? '+' : k === 'exp' ? '−' : '') + rp(n);
const pct = (a, b) => b ? Math.round(a / b * 100) : 0;
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
const pad2 = n => String(n).padStart(2, '0');
const HARI = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const BLN = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
const BULAN = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
const ymd = d => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
const nowIso = () => { const d = new Date(); return `${ymd(d)}T${pad2(d.getHours())}:${pad2(d.getMinutes())}`; };
const mkey = s => s.slice(0, 7);
const monthName = k => { const [y, m] = k.split('-').map(Number); return `${BULAN[m - 1]} ${y}`; };
const shiftMonth = (k, n) => { const [y, m] = k.split('-').map(Number); const d = new Date(y, m - 1 + n, 1); return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}`; };
const today = () => ymd(new Date());
const daysBetween = (a, b) => Math.round((new Date(b + 'T00:00') - new Date(a + 'T00:00')) / 864e5);
const dShort = s => { const d = new Date(s.length > 10 ? s : s + 'T00:00'); return `${d.getDate()} ${BLN[d.getMonth()]}`; };
const dLong = s => { const d = new Date(s); return `${HARI[d.getDay()]}, ${d.getDate()} ${BLN[d.getMonth()]} ${d.getFullYear()} · ${pad2(d.getHours())}.${pad2(d.getMinutes())}`; };
const dayLabel = s => {
  const d = new Date(s + 'T00:00'), diff = daysBetween(s, today());
  const base = `${HARI[d.getDay()]}, ${d.getDate()} ${BLN[d.getMonth()]}`;
  return diff === 0 ? 'Hari ini, ' + base : diff === 1 ? 'Kemarin, ' + base : base;
};
const timeLabel = s => {
  const diff = daysBetween(s.slice(0, 10), today());
  if (diff === 0) return s.slice(11, 16).replace(':', '.');
  if (diff === 1) return 'Kemarin';
  return dShort(s);
};

/* ---------- master data ---------- */
const CATS = {
  dapur: { n: 'Makan dan belanja dapur', s: 'Makan, dapur', ic: 'dapur', k: 'exp', g: 'need' },
  bensin: { n: 'Transportasi dan bensin', s: 'Bensin', ic: 'bensin', k: 'exp', g: 'need' },
  makanluar: { n: 'Makan di luar', s: 'Makan di luar', ic: 'makanluar', k: 'exp', g: 'want' },
  hiburan: { n: 'Hiburan', s: 'Hiburan', ic: 'hiburan', k: 'exp', g: 'want' },
  listrik: { n: 'Listrik', s: 'Listrik', ic: 'listrik', k: 'exp', g: 'need' },
  air: { n: 'Air', s: 'Air', ic: 'air', k: 'exp', g: 'need' },
  internet: { n: 'Internet dan pulsa', s: 'Internet', ic: 'internet', k: 'exp', g: 'need' },
  rumah: { n: 'Iuran dan rumah', s: 'Rumah', ic: 'rumah', k: 'exp', g: 'need' },
  pakaian: { n: 'Pakaian', s: 'Pakaian', ic: 'pakaian', k: 'exp', g: 'want' },
  kesehatan: { n: 'Kesehatan', s: 'Kesehatan', ic: 'kesehatan', k: 'exp', g: 'need' },
  kondangan: { n: 'Kondangan', s: 'Kondangan', ic: 'kondangan', k: 'exp', g: 'want' },
  keluarga: { n: 'Keluarga', s: 'Keluarga', ic: 'keluarga', k: 'exp', g: 'need' },
  cicilan: { n: 'Cicilan', s: 'Cicilan', ic: 'cicilan', k: 'exp', g: 'need' },
  zakat: { n: 'Zakat dan sedekah', s: 'Zakat', ic: 'zakat', k: 'exp', g: 'need' },
  investasi: { n: 'Investasi', s: 'Investasi', ic: 'investasi', k: 'exp', g: 'save' },
  gaji: { n: 'Gaji', s: 'Gaji', ic: 'gaji', k: 'inc' },
  usaha: { n: 'Hasil usaha', s: 'Hasil usaha', ic: 'usaha', k: 'inc' },
  bonus: { n: 'Bonus dan THR', s: 'Bonus, THR', ic: 'bonus', k: 'inc' },
  hasilinv: { n: 'Hasil investasi', s: 'Investasi', ic: 'hasilinv', k: 'inc' },
  masuklain: { n: 'Pemasukan lain', s: 'Lainnya', ic: 'lainnya', k: 'inc' },
  transfer: { n: 'Transfer', s: 'Transfer', ic: 'transfer', k: 'trf' }
};
const KIND = { inc: 'Pemasukan', exp: 'Pengeluaran', trf: 'Transfer' };
const WHO = { j: 'James', s: 'Sabrina', b: 'Bersama' };

function seed() {
  const W = (id, o, n, icn, sub, bal, save) => ({ id, o, n, ic: icn, sub, bal, save: !!save });
  const T = (t, k, cat, w, by, n, d, x = {}) => ({ id: uid(), t, k, cat, w, by, n, d, shared: ['rekber', 'kas', 'darurat', 'dprumah'].includes(w), note: '', tags: [], comments: [], hist: [{ by, what: 'mencatat transaksi ini', at: d }], ...x });
  return {
    v: 1, user: 'j', loggedIn: false, theme: 'auto',
    notif: { big: true, bill: true, budget: true, partner: false, secret: false },
    wallets: [
      W('rekber', 'b', 'Rekening Bersama', 'bank', 'BCA · dipakai belanja rumah', 11750000),
      W('kas', 'b', 'Kas Rumah', 'cash', 'Tunai di laci dapur', 1200000),
      W('darurat', 'b', 'Tabungan Dana Darurat', 'darurat', 'Terhubung ke tujuan', 42000000, true),
      W('dprumah', 'b', 'Tabungan DP Rumah', 'house', 'Terhubung ke tujuan', 38500000, true),
      W('bcaj', 'j', 'BCA James', 'bank', 'Rekening gaji', 8420500),
      W('tunaij', 'j', 'Tunai James', 'cash', 'Disesuaikan 1 Okt', 650000),
      W('gopay', 'j', 'GoPay James', 'phone', 'Dompet digital', 215000),
      W('mandiri', 's', 'Mandiri Sabrina', 'bank', 'Rekening gaji', 5180000),
      W('ovo', 's', 'OVO Sabrina', 'phone', 'Dompet digital', 142500),
      W('tunais', 's', 'Tunai Sabrina', 'cash', 'Disesuaikan 5 Okt', 400000)
    ],
    budgets: { dapur: 4500000, bensin: 1000000, makanluar: 1200000, hiburan: 600000, listrik: 700000, air: 250000, internet: 400000, pakaian: 500000, kesehatan: 500000, kondangan: 750000, keluarga: 1500000, cicilan: 2125000 },
    txs: [
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
          { by: 'j', text: 'Beras naik lagi ya? Bulan lalu masih 145 ribu.', at: '2026-10-11T12:03' },
          { by: 's', text: 'Iya, sekarang 152 ribu. Bulan depan coba beli di agen dekat rumah.', at: '2026-10-11T12:10' }
        ],
        hist: [
          { by: 'j', what: 'menambah tag #stokdapur', at: '2026-10-11T12:05' },
          { by: 's', what: 'mengubah nominal dari Rp1.254.800 menjadi Rp1.245.800', at: '2026-10-11T10:31' },
          { by: 's', what: 'mencatat transaksi ini', at: '2026-10-11T10:24' }
        ]
      }),
      T('Setor dana darurat', 'trf', 'transfer', 'rekber', 'j', 2000000, '2026-10-11T15:00', { w2: 'darurat' }),
      T('Kondangan Dita dan Raka', 'exp', 'kondangan', 'rekber', 's', 500000, '2026-10-12T11:00'),
      T('Makan malam rawon', 'exp', 'makanluar', 'gopay', 'j', 145000, '2026-10-12T19:30'),
      T('Bensin Pertamax', 'exp', 'bensin', 'bcaj', 'j', 200000, '2026-10-13T06:55'),
      T('Sayur dan lauk, Pasar Pucang', 'exp', 'dapur', 'kas', 's', 186500, '2026-10-13T07:40')
    ],
    bills: [
      { id: uid(), n: 'Iuran IPL perumahan', ic: 'house', cat: 'rumah', a: 450000, due: '2026-10-16', w: 'rekber' },
      { id: uid(), n: 'Pulsa dan paket data 2 HP', ic: 'phone', cat: 'internet', a: 200000, due: '2026-10-18', w: 'rekber' },
      { id: uid(), n: 'Cicilan laptop', ic: 'laptop', cat: 'cicilan', a: 875000, due: '2026-10-22', w: 'bcaj', loan: 'laptop' },
      { id: uid(), n: 'Langganan film dan musik', ic: 'hiburan', cat: 'hiburan', a: 120000, due: '2026-10-25', w: 'ovo' },
      { id: uid(), n: 'Asuransi jiwa James', ic: 'darurat', cat: 'kesehatan', a: 650000, due: '2026-10-28', w: 'bcaj' },
      { id: uid(), n: 'Cicilan motor', ic: 'motor', cat: 'cicilan', a: 1250000, due: '2026-10-05', w: 'bcaj', paid: { by: 'j', at: '2026-10-05' } },
      { id: uid(), n: 'BPJS Kesehatan keluarga', ic: 'kesehatan', cat: 'keluarga', a: 300000, due: '2026-10-10', w: 'bcaj', paid: { by: 'j', at: '2026-10-09' } },
      { id: uid(), n: 'PDAM', ic: 'air', cat: 'air', a: 185000, due: '2026-10-10', w: 'rekber', paid: { by: 's', at: '2026-10-07' } },
      { id: uid(), n: 'Internet rumah', ic: 'internet', cat: 'internet', a: 351000, due: '2026-10-08', w: 'bcaj', paid: { by: 'j', at: '2026-10-06' } }
    ],
    loans: [
      { id: 'motor', n: 'Cicilan motor', sub: 'Leasing · tiap tanggal 5 · BCA James', ic: 'motor', a: 1250000, paid: 18, tot: 35, end: 'Mar 2028', pokok: 19380000, next: '5 Nov' },
      { id: 'laptop', n: 'Laptop kerja 0%', sub: 'Kartu kredit · tiap tanggal 22', ic: 'laptop', a: 875000, paid: 4, tot: 12, end: 'Mei 2027', pokok: 7000000, next: '22 Okt' }
    ],
    goals: [
      { id: uid(), n: 'Liburan akhir tahun', ic: 'liburan', have: 12600000, target: 18000000, due: '2026-12-20', j: 6000000, s: 6600000, log: [] },
      { id: uid(), n: 'Dana darurat', ic: 'darurat', wallet: 'darurat', target: 90000000, due: '2027-12-31', j: 26000000, s: 16000000, log: [{ by: 'j', n: 2000000, at: '2026-10-11T15:00' }] },
      { id: uid(), n: 'DP rumah', ic: 'house', wallet: 'dprumah', target: 150000000, due: '2028-06-30', j: 24000000, s: 14500000, log: [] }
    ],
    debts: [
      { id: uid(), kind: 'in', n: 'Andi', sub: 'Teman kantor', by: 'j', total: 2000000, sisa: 1500000, due: 'Jatuh tempo 31 Okt', remind: 'Ingatkan 28 Okt' },
      { id: uid(), kind: 'in', n: 'Rina', sub: 'Sepupu', by: 's', total: 750000, sisa: 0, due: 'Dilunasi 2 Okt 2026', remind: '' },
      { id: uid(), kind: 'out', n: 'Koperasi kantor', sub: 'Cicil Rp500.000 tiap tanggal 25', by: 's', total: 5000000, sisa: 3000000, due: 'Sisa 6 kali · berikutnya 25 Okt', remind: '' },
      { id: uid(), kind: 'out', n: 'Bayu', sub: 'Talangan tiket konser', by: 'j', total: 300000, sisa: 300000, due: 'Janji dibayar 20 Okt', remind: 'Ingatkan 19 Okt' }
    ],
    assets: [
      { n: 'Reksa dana dan saham', ic: 'investasi', sub: '3 akun investasi', v: 64300000 },
      { n: 'Emas', ic: 'gold', sub: '20 gram', v: 46000000 },
      { n: 'Kendaraan', ic: 'motor', sub: 'Motor, nilai pasar', v: 22000000 }
    ],
    card: 3245000
  };
}

/* histori bulan lalu (sebelum aplikasi dipakai) */
const HIST = { '2026-05': [23.8e6, 18.9e6], '2026-06': [24.1e6, 21.4e6], '2026-07': [26.3e6, 19.7e6], '2026-08': [24.9e6, 22.8e6], '2026-09': [25.2e6, 20.1e6] };
const NW_HIST = [['2026-05', 178.6e6], ['2026-06', 184.2e6], ['2026-07', 190.9e6], ['2026-08', 196.4e6], ['2026-09', 203.1e6]];

/* ---------- penyimpanan ---------- */
const KEY = 'pyojem-keuangan.v1';
function load() { try { const s = JSON.parse(localStorage.getItem(KEY)); return s && s.v === 1 ? s : null; } catch { return null; } }
function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch { /* mode privat */ } }
let S = load() || seed();

/* ---------- state UI ---------- */
const ui = { route: '', prevRoute: '', sheet: null, toast: null, newId: null, draft: null, month: mkey(today()), f: { q: '', kind: 'all', by: 'all', w: 'all', cat: 'all' }, rptMonth: mkey(today()) };
if (!S.txs.some(t => mkey(t.d) === ui.month)) { const last = S.txs.map(t => mkey(t.d)).sort().pop(); if (last) ui.month = ui.rptMonth = last; }

/* ---------- selektor ---------- */
const W = id => S.wallets.find(w => w.id === id);
const wName = id => W(id)?.n || 'Dompet terhapus';
const me = () => S.user;
const other = () => (S.user === 'j' ? 's' : 'j');
const inMonth = (k = ui.month) => S.txs.filter(t => mkey(t.d) === k);
const sumK = (list, k) => list.filter(t => t.k === k).reduce((a, t) => a + t.n, 0);
const totalBal = (o) => S.wallets.filter(w => !o || w.o === o).reduce((a, w) => a + w.bal, 0);
const goalHave = g => (g.wallet && W(g.wallet) ? W(g.wallet).bal : g.have);
function budgetRows(k = ui.month) {
  const list = inMonth(k).filter(t => t.k === 'exp');
  return Object.entries(S.budgets).map(([cat, lim]) => {
    const used = list.filter(t => t.cat === cat).reduce((a, t) => a + t.n, 0);
    const p = lim ? used / lim : 0, st = p > 1 ? 'over' : p >= 0.8 ? 'warn' : 'ok';
    return { cat, c: CATS[cat], used, lim, p, st, pc: Math.round(p * 100), label: (st === 'over' ? 'Terlampaui ' : st === 'warn' ? 'Hampir habis ' : 'Aman ') + Math.round(p * 100) + '%' };
  }).sort((a, b) => b.p - a.p);
}
function daysLeftInMonth(k) {
  const [y, m] = k.split('-').map(Number), last = new Date(y, m, 0).getDate();
  if (k !== mkey(today())) return k < mkey(today()) ? 0 : last;
  return last - new Date().getDate();
}

/* ---------- penerapan transaksi ke saldo ---------- */
function applyTx(t, sign = 1) {
  const a = W(t.w), b = t.w2 && W(t.w2);
  if (t.k === 'exp' && a) a.bal -= sign * t.n;
  if (t.k === 'inc' && a) a.bal += sign * t.n;
  if (t.k === 'trf') { if (a) a.bal -= sign * t.n; if (b) b.bal += sign * t.n; }
}
function addTx(t) { S.txs.push(t); applyTx(t, 1); }
function removeTx(id) { const t = S.txs.find(x => x.id === id); if (!t) return null; applyTx(t, -1); S.txs = S.txs.filter(x => x.id !== id); return t; }

/* ---------- komponen ---------- */
const av = (o, size) => `<span class="av ${o}" title="${WHO[o]}"${size ? ` style="width:${size}px;height:${size}px"` : ''}>${WHO[o][0]}</span>`;
const catIc = (k, icn, st = '') => `<div class="cat ${k}"${st ? ` style="${st}"` : ''}>${ic(icn)}</div>`;
function txRow(t, withTime) {
  const c = CATS[t.cat] || CATS.transfer;
  const sub = t.k === 'trf' ? `${wName(t.w)} ke ${t.w2 ? wName(t.w2) : esc(t.to || 'tujuan')}` : `${c.n} · ${wName(t.w)}`;
  return `<a class="tx${t.id === ui.newId ? ' new' : ''}" href="#/detail/${t.id}">
    <div class="catw">${catIc(t.k, c.ic)}${av(t.by)}</div>
    <div class="grow"><div class="b ellip" style="font-size:14px">${esc(t.t)}</div><div class="c ellip">${esc(sub)}</div></div>
    <div class="meta"><span class="num ${t.k}" style="font-size:15px">${sg(t.k, t.n)}</span>${withTime ? `<span class="c">${timeLabel(t.d)}</span>` : ''}</div>
  </a>`;
}
const topBar = (title, opts = {}) => `<header class="top">
  ${opts.back ? `<a class="ib" href="${opts.back}" aria-label="Kembali">${ic('left')}</a>` : ''}
  <h1 class="${opts.center ? 'center' : ''}">${title}</h1>${opts.right || ''}</header>`;
const empty = (title, sub) => `<div class="empty"><img class="mascot" src="assets/maskot.png" alt=""><div class="h2">${title}</div><div class="s">${sub}</div></div>`;

/* ---------- layar ---------- */
const V = {};

V.login = () => `<div class="login">
  <div class="art"><img class="mascot" src="assets/maskot.png" alt="Maskot Pyojem, kelinci dan beruang"></div>
  <div style="text-align:center">
    <div class="c" style="font-weight:800;color:var(--hot);letter-spacing:.04em">PYOJEM KEUANGAN</div>
    <h1 class="h1" style="font-size:28px;line-height:36px">Halo lagi, yuk masuk</h1>
    <p class="s" style="margin:6px 0 0">Catat bersama, rencanakan bersama. Satu rumah tangga, dua HP.</p>
  </div>
  <form data-submit="login" style="display:flex;flex-direction:column;gap:14px">
    <div><span class="lab">Masuk sebagai</span>
      <div class="seg" role="radiogroup" aria-label="Masuk sebagai">
        ${['j', 's'].map(o => `<button type="button" role="radio" aria-checked="${S.user === o}" class="${S.user === o ? 'on' : ''}" data-act="pickUser" data-o="${o}">${av(o, 22)}${WHO[o]}</button>`).join('')}
      </div></div>
    <div><label class="lab" for="email">Email</label>
      <div class="field">${ic('mail')}<input id="email" name="email" type="email" value="${S.user === 'j' ? 'james' : 'sabrina'}@contoh.id" autocomplete="email" required></div></div>
    <div><label class="lab" for="sandi">Kata sandi</label>
      <div class="field">${ic('lock')}<input id="sandi" name="sandi" type="password" value="rahasia123" autocomplete="current-password" required>
      <button type="button" class="ib" aria-label="Tampilkan kata sandi" data-act="peek">${ic('eye')}</button></div></div>
    <button type="submit" class="btn p">Masuk</button>
  </form>
  <div class="c" style="text-align:center;display:flex;gap:6px;justify-content:center;align-items:center">${ic('lock', 'width:14px;height:14px')}Data rumah tangga hanya terlihat oleh kalian berdua</div>
</div>`;

V.beranda = () => {
  const m = ui.month, list = inMonth(m), inc = sumK(list, 'inc'), exp = sumK(list, 'exp');
  const rows = budgetRows(m), lim = rows.reduce((a, r) => a + r.lim, 0), used = rows.reduce((a, r) => a + r.used, 0);
  const left = daysLeftInMonth(m), perDay = left ? Math.max(0, Math.round((lim - used) / left / 1000) * 1000) : 0;
  const bill = S.bills.filter(b => !b.paid).sort((a, b) => a.due.localeCompare(b.due))[0];
  const recent = [...S.txs].sort((a, b) => b.d.localeCompare(a.d)).slice(0, 6);
  const h = new Date().getHours(), greet = h < 11 ? 'pagi' : h < 15 ? 'siang' : h < 18 ? 'sore' : 'malam';
  const d = new Date();
  return `<div class="screen wide">
  <header class="top" style="gap:12px">
    <div class="avs">${av('j', 40)}${av('s', 40)}</div>
    <div class="grow"><div class="h2">Selamat ${greet}, ${WHO[me()]}</div><div class="c">${HARI[d.getDay()]}, ${d.getDate()} ${BULAN[d.getMonth()]} ${d.getFullYear()} · Rumah tangga James dan Sabrina</div></div>
    <a class="ib" href="#/tagihan" aria-label="Tagihan">${ic('bell')}${bill ? '<span style="position:absolute;top:10px;right:11px;width:8px;height:8px;border-radius:50%;background:var(--exp);box-shadow:0 0 0 2px var(--bg)"></span>' : ''}</a>
  </header>
  <main class="pad">
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,340px),1fr));gap:16px;align-items:start">
    <div style="display:flex;flex-direction:column;gap:16px">
    <section class="hero">
      <div class="sec"><span class="lbl">Saldo semua dompet</span><a class="lnk" href="#/dompet">Dompet${ic('right', 'width:16px;height:16px')}</a></div>
      <div class="big" style="margin-top:-12px">${rp(totalBal())}</div>
      <div class="tiles">
        <div><div class="t">Bersama</div><div class="v">${jt(totalBal('b'))}</div></div>
        <div><div class="t"><span style="width:8px;height:8px;border-radius:50%;background:var(--hus)"></span>James</div><div class="v">${jt(totalBal('j'))}</div></div>
        <div><div class="t"><span style="width:8px;height:8px;border-radius:50%;background:var(--wif)"></span>Sabrina</div><div class="v">${jt(totalBal('s'))}</div></div>
      </div>
    </section>
    <section class="card cardpad">
      <div class="sec"><h2 class="h2">${monthName(m)}</h2><a class="lnk" href="#/laporan">Laporan${ic('right', 'width:16px;height:16px')}</a></div>
      <div class="grid2">
        <div class="stat" style="background:var(--incS)"><span class="c" style="color:var(--inc);display:flex;gap:4px;align-items:center">${ic('in', 'width:14px;height:14px')}Pemasukan</span><b class="inc">+${rp(inc)}</b></div>
        <div class="stat" style="background:var(--expS)"><span class="c" style="color:var(--exp);display:flex;gap:4px;align-items:center">${ic('out', 'width:14px;height:14px')}Pengeluaran</span><b class="exp">−${rp(exp)}</b></div>
        <div class="stat"><span class="c">Sisa</span><b>${inc - exp < 0 ? '−' : ''}${rp(inc - exp)}</b></div>
        <div class="stat"><span class="c">Rasio tabungan</span><b>${inc ? pct(inc - exp, inc) : 0}% <span class="c">target 20%</span></b></div>
      </div>
    </section>
    ${bill ? (() => { const dd = daysBetween(today(), bill.due); return `<a href="#/tagihan" class="card" style="padding:12px 16px;display:flex;align-items:center;gap:12px;text-decoration:none;min-height:64px">
      ${catIc('warn', 'bill')}<div class="grow"><div class="b" style="font-size:14px">${esc(bill.n)}</div><div class="c">Jatuh tempo ${dShort(bill.due)} · ${wName(bill.w)}</div></div>
      <div style="display:flex;flex-direction:column;align-items:flex-end;gap:4px"><span class="num" style="font-size:14px">${rp(bill.a)}</span><span class="badge ${dd < 0 ? 'over' : 'warn'}">${dd < 0 ? `Terlambat ${-dd} hari` : dd === 0 ? 'Hari ini' : `${dd} hari lagi`}</span></div></a>`; })() : ''}
    </div>
    <div style="display:flex;flex-direction:column;gap:16px">
    <section class="card cardpad" style="gap:14px">
      <div class="sec"><h2 class="h2">Anggaran</h2><a class="lnk" href="#/anggaran">Semua${ic('right', 'width:16px;height:16px')}</a></div>
      <div style="display:flex;flex-direction:column;gap:6px">
        <div class="sec s"><span>Terpakai <b style="color:var(--ink)">${rp(used)}</b> dari ${rp(lim)}</span><b style="color:var(--ink)">${pct(used, lim)}%</b></div>
        <div class="bar" style="height:10px"><i class="pri" style="width:${Math.min(100, pct(used, lim))}%"></i></div>
        <div class="c">${left} hari lagi · aman dipakai ${rp(perDay)} per hari</div>
      </div>
      ${rows.slice(0, 3).map(r => `<div class="row">${catIc('exp', r.c.ic, 'width:36px;height:36px')}
        <div class="grow" style="display:flex;flex-direction:column;gap:6px"><div class="sec"><span class="b" style="font-size:14px">${r.c.n}</span><span class="badge ${r.st}">${r.label}</span></div>
        <div class="bar"><i class="${r.st}" style="width:${Math.min(100, r.pc)}%"></i></div><div class="c">${rp(r.used)} dari ${rp(r.lim)}</div></div></div>`).join('')}
    </section>
    <section class="card" style="padding:8px 0">
      <div class="sec" style="padding:0 16px"><h2 class="h2">Transaksi terakhir</h2><a class="lnk" href="#/transaksi">Semua${ic('right', 'width:16px;height:16px')}</a></div>
      <div>${recent.length ? recent.map(t => txRow(t, true)).join('') : empty('Belum ada transaksi', 'Tekan tombol + untuk mencatat.')}</div>
    </section>
    </div></div>
  </main></div>`;
};

function filteredTx() {
  const f = ui.f, q = f.q.trim().toLowerCase();
  const numQ = /^[\d.\s]+$/.test(q) ? q.replace(/\D/g, '') : '';
  return inMonth().filter(t => (f.kind === 'all' || t.k === f.kind) && (f.by === 'all' || t.by === f.by) && (f.w === 'all' || t.w === f.w || t.w2 === f.w) && (f.cat === 'all' || t.cat === f.cat) &&
    (!q || [t.t, t.note, (t.tags || []).map(x => '#' + x).join(' '), CATS[t.cat]?.n, wName(t.w)].join(' ').toLowerCase().includes(q) || (numQ && String(t.n).includes(numQ))));
}
function txListHtml() {
  const list = filteredTx().sort((a, b) => b.d.localeCompare(a.d));
  if (!list.length) return empty('Tidak ada transaksi', ui.f.q ? `Tidak ada yang cocok dengan “${esc(ui.f.q)}”.` : 'Belum ada catatan di bulan ini.');
  const days = {};
  list.forEach(t => (days[t.d.slice(0, 10)] ||= []).push(t));
  return Object.entries(days).map(([d, items]) => {
    const tot = items.reduce((a, t) => a + (t.k === 'inc' ? t.n : t.k === 'exp' ? -t.n : 0), 0);
    return `<section><div class="day"><span class="c" style="font-weight:800;color:var(--ink2)">${dayLabel(d)}</span><span class="num ${tot >= 0 ? 'inc' : 'exp'}" style="font-size:12px">${tot >= 0 ? '+' : '−'}${rp(tot)}</span></div>
      <div class="card" style="margin:0 16px;overflow:hidden">${items.map(t => txRow(t)).join('')}</div></section>`;
  }).join('');
}
function txSums() { const l = filteredTx(); return `<div class="card" style="padding:10px 14px"><div class="c">Masuk</div><div class="num inc" style="text-align:left">+${rp(sumK(l, 'inc'))}</div></div>
  <div class="card" style="padding:10px 14px"><div class="c">Keluar</div><div class="num exp" style="text-align:left">−${rp(sumK(l, 'exp'))}</div></div>`; }
V.transaksi = () => {
  const f = ui.f, opt = (v, l, cur) => `<option value="${v}"${v === cur ? ' selected' : ''}>${l}</option>`;
  return `<div class="screen">${topBar('Transaksi')}
  <div class="pad" style="gap:12px;padding-bottom:0">
    <label class="search">${ic('search')}<input type="search" placeholder="Cari catatan, tag, nominal" aria-label="Cari transaksi" value="${esc(f.q)}" data-input="q"></label>
    <div class="row" style="gap:4px;justify-content:space-between">
      <button class="ib" data-act="month" data-n="-1" aria-label="Bulan sebelumnya">${ic('left')}</button>
      <b class="disp" style="font-size:16px">${monthName(ui.month)}</b>
      <button class="ib" data-act="month" data-n="1" aria-label="Bulan berikutnya">${ic('right')}</button>
    </div>
    <div class="hscroll">
      ${[['all', 'Semua'], ['inc', 'Masuk'], ['exp', 'Keluar'], ['trf', 'Transfer']].map(([k, l]) => `<button class="chip${f.kind === k ? ' on' : ''}" data-act="fkind" data-k="${k}">${l}</button>`).join('')}
      ${[['all', 'Berdua'], ['j', 'James'], ['s', 'Sabrina']].map(([k, l]) => `<button class="chip${f.by === k ? ' on' : ''}" data-act="fby" data-k="${k}">${k === 'all' ? av('j', 18) + `<span style="margin-left:-12px">${av('s', 18)}</span>` : av(k, 18)}${l}</button>`).join('')}
      <label class="sr" for="fw">Dompet</label><select id="fw" class="chip" data-change="fw">${opt('all', 'Semua dompet', f.w)}${S.wallets.map(w => opt(w.id, esc(w.n), f.w)).join('')}</select>
      <label class="sr" for="fc">Kategori</label><select id="fc" class="chip" data-change="fc">${opt('all', 'Semua kategori', f.cat)}${Object.entries(CATS).map(([k, c]) => opt(k, c.n, f.cat)).join('')}</select>
    </div>
    <div class="grid2" id="txsums">${txSums()}</div>
  </div>
  <main id="txlist">${txListHtml()}</main></div>`;
};

/* ---- Tambah transaksi ---- */
function newDraft(kind = 'exp') {
  const w = me() === 'j' ? 'bcaj' : 'mandiri';
  return { kind, digits: '', cat: kind === 'inc' ? 'gaji' : kind === 'trf' ? 'transfer' : 'dapur', w, w2: 'rekber', shared: false, note: '', date: today(), all: false, editId: null };
}
function catOrder(kind) {
  const used = {}; S.txs.forEach(t => { if (t.k === kind) used[t.cat] = (used[t.cat] || 0) + 1; });
  return Object.keys(CATS).filter(k => CATS[k].k === kind).sort((a, b) => (used[b] || 0) - (used[a] || 0));
}
const FAVS = [
  { n: 'Bensin', kind: 'exp', cat: 'bensin', a: 200000, note: 'Bensin Pertamax', w: 'bcaj' },
  { n: 'Galon dan gas', kind: 'exp', cat: 'dapur', a: 95000, note: 'Galon dan gas', w: 'kas', shared: true },
  { n: 'Sayur pasar', kind: 'exp', cat: 'dapur', a: 150000, note: 'Sayur pasar', w: 'kas', shared: true },
  { n: 'Parkir', kind: 'exp', cat: 'bensin', a: 5000, note: 'Parkir', w: 'gopay' },
  { n: 'Kopi', kind: 'exp', cat: 'makanluar', a: 28000, note: 'Kopi', w: 'gopay' }
];
V.tambah = () => {
  const d = ui.draft ||= newDraft();
  const amount = parseInt(d.digits || '0', 10), k = d.kind;
  let cats = catOrder(k); const many = k === 'exp' && cats.length > 8 && !d.all;
  if (many) { cats = cats.slice(0, 7); if (!cats.includes(d.cat)) cats[6] = d.cat; }
  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '000', '0', '⌫'];
  const wOpts = sel => S.wallets.map(w => `<option value="${w.id}"${w.id === sel ? ' selected' : ''}>${esc(w.n)}</option>`).join('');
  return `<div class="screen" style="padding-bottom:24px">
  ${topBar(d.editId ? 'Ubah transaksi' : 'Tambah transaksi', { center: true, back: d.editId ? `#/detail/${d.editId}` : '#/beranda', right: '<span style="width:44px"></span>' })}
  <div class="pad" style="gap:12px">
    <div class="seg" role="tablist" aria-label="Jenis transaksi">
      ${['inc', 'exp', 'trf'].map(x => `<button type="button" role="tab" aria-selected="${k === x}" class="${k === x ? 'on ' + x : ''}" data-act="dkind" data-k="${x}">${ic(x === 'inc' ? 'in' : x === 'exp' ? 'out' : 'transfer')}${KIND[x]}</button>`).join('')}
    </div>
    <div style="text-align:center;display:flex;flex-direction:column;gap:2px;padding:4px 0">
      <div class="c">Nominal ${KIND[k].toLowerCase()}</div>
      <div class="amt ${k}" aria-live="polite">${amount ? sg(k, amount) : 'Rp0'}</div>
      <div class="c">${k === 'trf' ? `${wName(d.w)} ke ${wName(d.w2)}` : `${CATS[d.cat].n} · ${wName(d.w)} · ${d.shared ? 'Bersama' : 'Pribadi'}`}</div>
    </div>
    ${k === 'exp' && !d.editId ? `<div style="display:flex;flex-direction:column;gap:6px"><div class="c" style="font-weight:800">Transaksi favorit, sekali tap</div>
      <div class="hscroll">${FAVS.map((f, i) => `<button type="button" class="chip fav" data-act="fav" data-i="${i}">${f.n} <b>${rp(f.a)}</b></button>`).join('')}</div></div>` : ''}
    ${k !== 'trf' ? `<div class="cats" role="group" aria-label="Kategori">
      ${cats.map(c => `<button type="button" class="tile${d.cat === c ? ' on' : ''}" aria-pressed="${d.cat === c}" data-act="dcat" data-c="${c}"><span class="i cat ${k}" style="width:32px;height:32px">${ic(CATS[c].ic)}</span>${CATS[c].s}</button>`).join('')}
      ${many ? `<button type="button" class="tile" data-act="dall"><span class="i cat pri" style="width:32px;height:32px">${ic('lainnya')}</span>Semua</button>` : ''}
    </div>` : `<div class="grid2">
      <div><label class="lab" for="dw">Dari</label><div class="field"><select id="dw" data-change="dw">${wOpts(d.w)}</select></div></div>
      <div><label class="lab" for="dw2">Ke</label><div class="field"><select id="dw2" data-change="dw2">${wOpts(d.w2)}</select></div></div></div>`}
    <div class="hscroll">
      ${k !== 'trf' ? `<label class="sr" for="dwal">Dompet</label><select id="dwal" class="chip" data-change="dw">${wOpts(d.w)}</select>` : ''}
      ${k !== 'trf' ? `<div class="mini" role="radiogroup" aria-label="Untuk siapa">
        <button type="button" role="radio" aria-checked="${!d.shared}" class="${d.shared ? '' : 'on'}" data-act="dshared" data-v="0">Pribadi</button>
        <button type="button" role="radio" aria-checked="${d.shared}" class="${d.shared ? 'on' : ''}" data-act="dshared" data-v="1">Bersama</button></div>` : ''}
      <label class="chip" style="cursor:pointer">${ic('cal')}<input type="date" value="${d.date}" data-change="ddate" aria-label="Tanggal" style="border:0;background:transparent;font:inherit;color:inherit;font-weight:700;width:128px"></label>
    </div>
    <div class="field"><label for="catatan" class="sr">Catatan</label>
      <input id="catatan" type="text" placeholder="Catatan, misalnya Pertamax motor" value="${esc(d.note)}" data-input="note">
      ${ic('tag', 'color:var(--ink3);margin-right:10px')}</div>
    <div class="keys">${keys.map(t => `<button type="button" class="key${t === '000' || t === '⌫' ? ' fn' : ''}" data-act="key" data-k="${t}" aria-label="${t === '⌫' ? 'Hapus satu angka' : t}">${t}</button>`).join('')}</div>
    <button type="button" class="btn p" data-act="saveTx" ${amount && !(k === 'trf' && d.w === d.w2) ? '' : 'disabled'}>${ic('check')}${d.editId ? 'Simpan perubahan' : 'Simpan'}</button>
  </div></div>`;
};

V.detail = (id) => {
  const t = S.txs.find(x => x.id === id);
  if (!t) return `<div class="screen">${topBar('Detail transaksi', { back: '#/transaksi' })}${empty('Transaksi tidak ditemukan', 'Mungkin sudah dihapus.')}</div>`;
  const c = CATS[t.cat] || CATS.transfer;
  return `<div class="screen">${topBar('Detail transaksi', { back: '#/transaksi', center: true, right: `<button class="ib" data-act="share" data-id="${t.id}" aria-label="Salin ringkasan">${ic('copy')}</button>` })}
  <main class="pad">
    <section class="card cardpad" style="align-items:center;text-align:center">
      ${catIc(t.k, c.ic, 'width:56px;height:56px;border-radius:18px')}
      <div class="b" style="font-size:17px">${esc(t.t)}</div>
      <div class="num ${t.k}" style="font-size:32px;line-height:40px;text-align:center">${sg(t.k, t.n)}</div>
      <div class="row" style="gap:6px;justify-content:center"><span class="badge ${t.k}">${KIND[t.k]}</span><span class="badge mut">${t.shared ? 'Bersama' : 'Pribadi'}</span></div>
    </section>
    <dl class="card" style="margin:0">
      ${t.k === 'trf' ? `<div class="kv"><dt>Dari</dt><dd>${wName(t.w)}</dd></div><div class="kv"><dt>Ke</dt><dd>${t.w2 ? wName(t.w2) : esc(t.to || '-')}</dd></div>` : `<div class="kv"><dt>Kategori</dt><dd>${c.n}</dd></div><div class="kv"><dt>Dompet</dt><dd>${wName(t.w)}</dd></div>`}
      <div class="kv"><dt>Tanggal</dt><dd>${dLong(t.d)}</dd></div>
      <div class="kv"><dt>Dicatat oleh</dt><dd>${av(t.by)}${WHO[t.by]}</dd></div>
      ${t.tags?.length ? `<div class="kv"><dt>Tag</dt><dd>${t.tags.map(x => `<span class="tag">#${esc(x)}</span>`).join('')}</dd></div>` : ''}
      ${t.note ? `<div class="kv"><dt>Catatan</dt><dd style="font-weight:600">${esc(t.note)}</dd></div>` : ''}
    </dl>
    <section class="card cardpad">
      <div class="row" style="gap:8px">${ic('chat')}<h2 class="h2 grow">Komentar</h2><span class="c">${t.comments.length}</span></div>
      ${t.comments.map(m => `<div class="row" style="align-items:flex-start">${av(m.by, 28)}<div class="grow"><div class="bub">${esc(m.text)}</div><div class="c" style="margin-top:4px">${WHO[m.by]} · ${dShort(m.at)}, ${m.at.slice(11, 16).replace(':', '.')}</div></div></div>`).join('')}
      <form class="field" data-submit="comment" data-id="${t.id}"><label for="komen" class="sr">Tulis komentar</label>
        <input id="komen" name="text" type="text" placeholder="Tulis komentar untuk ${WHO[other()]}" autocomplete="off" required>
        <button type="submit" class="ib" aria-label="Kirim komentar">${ic('send')}</button></form>
    </section>
    <section class="card cardpad">
      <div class="row" style="gap:8px">${ic('clock')}<h2 class="h2">Riwayat perubahan</h2></div>
      <ol style="list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:12px">
        ${t.hist.map(h => `<li class="row" style="align-items:flex-start">${av(h.by, 24)}<div><div style="font-size:14px"><b>${WHO[h.by]}</b> ${esc(h.what)}</div><div class="c">${dShort(h.at)} ${h.at.slice(0, 4)}, ${h.at.slice(11, 16).replace(':', '.')}</div></div></li>`).join('')}
      </ol>
    </section>
    <div class="grid2">
      <button type="button" class="btn d" data-act="askDelete" data-id="${t.id}">${ic('trash')}Hapus</button>
      <button type="button" class="btn p" data-act="editTx" data-id="${t.id}">${ic('edit')}Ubah</button>
    </div>
  </main></div>`;
};

V.anggaran = () => {
  const rows = budgetRows(), lim = rows.reduce((a, r) => a + r.lim, 0), used = rows.reduce((a, r) => a + r.used, 0);
  const cnt = st => rows.filter(r => r.st === st).length;
  return `<div class="screen">${topBar('Anggaran', { right: `<button class="ib" data-act="sheet" data-s="budget" aria-label="Atur anggaran">${ic('sliders')}</button>` })}
  <div class="row" style="gap:4px;justify-content:space-between;padding:0 12px">
    <button class="ib" data-act="month" data-n="-1" aria-label="Bulan sebelumnya">${ic('left')}</button>
    <b class="disp" style="font-size:16px">${monthName(ui.month)}</b>
    <button class="ib" data-act="month" data-n="1" aria-label="Bulan berikutnya">${ic('right')}</button>
  </div>
  <main class="pad">
    <section class="card cardpad">
      <div class="sec"><div><div class="c">Terpakai</div><div class="num" style="text-align:left;font-size:24px">${rp(used)}</div></div>
        <div style="text-align:right"><div class="c">Total anggaran</div><div class="num" style="font-size:17px">${rp(lim)}</div></div></div>
      <div class="bar" style="height:10px"><i class="pri" style="width:${Math.min(100, pct(used, lim))}%"></i></div>
      <div class="sec c"><span>${pct(used, lim)}% terpakai · ${used > lim ? 'lebih ' + rp(used - lim) : 'sisa ' + rp(lim - used)}</span><span>${daysLeftInMonth(ui.month)} hari lagi</span></div>
      <div class="grid3">
        <div class="stat" style="background:var(--incS)"><b class="inc">${cnt('ok')}</b><span class="c">Aman</span></div>
        <div class="stat" style="background:var(--warnS)"><b style="color:var(--warn)">${cnt('warn')}</b><span class="c">Hampir habis</span></div>
        <div class="stat" style="background:var(--expS)"><b class="exp">${cnt('over')}</b><span class="c">Terlampaui</span></div>
      </div>
    </section>
    <section class="card" style="overflow:hidden">
      ${rows.length ? rows.map(r => `<a class="tx" href="#/transaksi" data-act="budgetGo" data-c="${r.cat}" style="align-items:flex-start">
        ${catIc('exp', r.c.ic)}
        <div class="grow" style="display:flex;flex-direction:column;gap:6px">
          <div class="sec"><span class="b" style="font-size:14px">${r.c.n}</span><span class="badge ${r.st}">${ic(r.st === 'ok' ? 'check' : r.st === 'warn' ? 'alert' : 'over')}${r.label}</span></div>
          <div class="bar"><i class="${r.st}" style="width:${Math.min(100, r.pc)}%"></i></div>
          <div class="sec c"><span>${rp(r.used)} dari ${rp(r.lim)}</span><span style="color:${r.used > r.lim ? 'var(--exp)' : 'var(--ink2)'}">${r.used > r.lim ? 'Lebih ' + rp(r.used - r.lim) : 'Sisa ' + rp(r.lim - r.used)}</span></div>
        </div></a>`).join('') : empty('Belum ada anggaran', 'Atur batas per kategori lewat tombol di kanan atas.')}
    </section>
  </main></div>`;
};

V.lainnya = () => {
  const unpaid = S.bills.filter(b => !b.paid), soon = unpaid.map(b => daysBetween(today(), b.due)).sort((a, b) => a - b)[0];
  const goals = S.goals, gp = pct(goals.reduce((a, g) => a + goalHave(g), 0), goals.reduce((a, g) => a + g.target, 0));
  const nw = netWorth();
  const items = [
    ['Dompet', 'wallet', 'dompet', `${S.wallets.length} dompet · ${jt(totalBal())}`, '', '#DDF1FE'],
    ['Tagihan dan cicilan', 'bill', 'tagihan', `${unpaid.length} belum dibayar`, soon !== undefined && soon <= 3 ? (soon < 0 ? 'Terlambat' : `${soon} hari`) : '', '#FFE0E6'],
    ['Tujuan bersama', 'target', 'tujuan', `${goals.length} tujuan · ${gp}%`, '', '#FFF3CC'],
    ['Utang dan piutang', 'debt', 'utang', `${S.debts.filter(x => x.sisa > 0).length} belum lunas`, '', '#E2F5EA'],
    ['Aset dan kekayaan', 'asset', 'aset', `Bersih ${jt(nw.net)}`, '', '#DDF1FE'],
    ['Laporan', 'report', 'laporan', monthName(ui.month), '', '#FFE0E6'],
    ['Pengaturan', 'settings', 'pengaturan', 'Tema, notifikasi, data', '', '#FFF3CC']
  ];
  return `<div class="screen">
  <header class="hero" style="margin:16px 16px 12px;flex-direction:row;align-items:center;min-height:104px;padding:16px 20px">
    <div class="grow"><h1 class="h1" style="font-size:24px">Lainnya</h1><div class="s" style="font-weight:700">Semua alat keuangan berdua</div></div>
    <img class="mascot" src="assets/maskot.png" alt="" style="width:132px;margin:0 -8px -24px 0;align-self:flex-end">
  </header>
  <main class="pad"><div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:10px">
    ${items.map(([n, icn, r, sub, badge, bg]) => `<a class="mtile" href="#/${r}"><span class="i" style="background:${bg}">${ic(icn)}</span><b>${n}</b><span class="c">${sub}</span>${badge ? `<span class="dot">${badge}</span>` : ''}</a>`).join('')}
  </div></main></div>`;
};

V.dompet = () => {
  const tot = totalBal(), parts = ['b', 'j', 's'].map(o => [o, totalBal(o)]);
  const col = { b: 'var(--k4)', j: 'var(--hus)', s: 'var(--wif)' };
  return `<div class="screen">${topBar('Dompet', { back: '#/lainnya', right: `<button class="ib" data-act="sheet" data-s="wallet" aria-label="Tambah dompet">${ic('plus')}</button>` })}
  <main class="pad">
    <section class="hero">
      <div class="lbl">Total ${S.wallets.length} dompet</div><div class="big">${rp(tot)}</div>
      <div class="stack" role="img" aria-label="${parts.map(([o, v]) => `${WHO[o]} ${pct(v, tot)} persen`).join(', ')}">${parts.map(([o, v]) => `<span style="width:${Math.max(0, pct(v, tot))}%;background:${col[o]}"></span>`).join('')}</div>
      <div class="row c" style="gap:14px;flex-wrap:wrap">${parts.map(([o, v]) => `<span style="display:flex;gap:6px;align-items:center;color:var(--ink2)"><span style="width:10px;height:10px;border-radius:3px;background:${col[o]}"></span>${WHO[o]} ${pct(v, tot)}%</span>`).join('')}</div>
    </section>
    <div class="grid2">
      <a class="btn s sm" href="#/tambah" data-act="newTx" data-k="trf">${ic('transfer')}Transfer</a>
      <button class="btn s sm" data-act="sheet" data-s="adjust">${ic('edit')}Sesuaikan saldo</button>
    </div>
    ${['b', 'j', 's'].map(o => { const ws = S.wallets.filter(w => w.o === o); if (!ws.length) return ''; return `<section style="display:flex;flex-direction:column;gap:8px">
      <div class="row" style="padding:0 4px">${av(o, 28)}<h2 class="h2 grow">${o === 'b' ? 'Bersama' : 'Milik ' + WHO[o]}</h2><span class="num">${rp(totalBal(o))}</span></div>
      <div class="card" style="overflow:hidden">${ws.map(w => `<a class="tx" href="#/transaksi" data-act="walletGo" data-w="${w.id}">
        ${catIc(o === 'b' ? 'warn' : o === 'j' ? 'pri' : 'exp', w.ic)}
        <div class="grow"><div class="b" style="font-size:14px">${esc(w.n)}</div><div class="c">${esc(w.sub)}</div></div>
        <span class="num${w.bal < 0 ? ' exp' : ''}">${w.bal < 0 ? '−' : ''}${rp(w.bal)}</span></a>`).join('')}</div></section>`; }).join('')}
  </main></div>`;
};

V.tagihan = () => {
  const m = mkey(today());
  const unpaid = S.bills.filter(b => !b.paid).sort((a, b) => a.due.localeCompare(b.due));
  const paid = S.bills.filter(b => b.paid).sort((a, b) => b.paid.at.localeCompare(a.paid.at));
  const sp = paid.filter(b => mkey(b.paid.at) === m).reduce((a, b) => a + b.a, 0), su = unpaid.reduce((a, b) => a + b.a, 0);
  return `<div class="screen">${topBar('Tagihan dan cicilan', { back: '#/lainnya', right: `<button class="ib" data-act="sheet" data-s="bill" aria-label="Tambah tagihan">${ic('plus')}</button>` })}
  <main class="pad">
    <section class="card cardpad">
      <div class="c">${monthName(m)} · ${unpaid.length + paid.filter(b => mkey(b.paid.at) === m).length} tagihan</div>
      <div class="grid2"><div><div class="c">Sudah dibayar</div><div class="num inc" style="text-align:left;font-size:20px">${rp(sp)}</div></div>
        <div><div class="c">Belum dibayar</div><div class="num" style="text-align:left;font-size:20px">${rp(su)}</div></div></div>
      <div class="bar" style="height:10px"><i class="ok" style="width:${pct(sp, sp + su)}%"></i></div>
    </section>
    <div class="sec"><h2 class="h2">Akan datang</h2><span class="c">urut jatuh tempo</span></div>
    <section class="card" style="overflow:hidden">
      ${unpaid.length ? unpaid.map(b => { const dd = daysBetween(today(), b.due), due = dd <= 3; return `<div class="tx" style="cursor:default;align-items:flex-start">
        ${catIc(due ? 'warn' : 'pri', b.ic)}
        <div class="grow"><div class="b" style="font-size:14px">${esc(b.n)}</div>
          <div class="row" style="gap:8px;margin:2px 0"><span class="num">${rp(b.a)}</span><span class="badge ${dd < 0 ? 'over' : due ? 'warn' : 'mut'}">${ic('clock')}${dd < 0 ? `Terlambat ${-dd} hari` : dd === 0 ? 'Hari ini' : (due ? 'Jatuh tempo ' : '') + dd + ' hari lagi'}</span></div>
          <div class="c">${dShort(b.due)} · ${wName(b.w)}</div></div>
        <button type="button" class="btn ${due ? 'p' : 's'} sm" style="width:auto;padding:0 12px;font-size:13px" data-act="payBill" data-id="${b.id}">Sudah dibayar</button></div>`; }).join('') : empty('Semua lunas!', 'Tidak ada tagihan yang menunggu.')}
    </section>
    <div class="sec"><h2 class="h2">Cicilan</h2><span class="c">${S.loans.filter(l => l.paid < l.tot).length} aktif</span></div>
    ${S.loans.map(l => `<section class="card cardpad">
      <div class="row">${catIc('trf', l.ic)}<div class="grow"><div class="b" style="font-size:14px">${esc(l.n)}</div><div class="c">${esc(l.sub)}</div></div><span class="num">${rp(l.a)}</span></div>
      <div><div class="sec c" style="margin-bottom:6px"><span>Sudah ${l.paid} dari ${l.tot} kali</span><span>Lunas ${l.end}</span></div><div class="bar"><i class="pri" style="width:${pct(l.paid, l.tot)}%"></i></div></div>
      <div class="grid3"><div class="stat"><span class="c">Sisa</span><b style="font-size:15px">${l.tot - l.paid} kali</b></div><div class="stat"><span class="c">Sisa pokok</span><b style="font-size:15px">${jt(l.pokok)}</b></div><div class="stat"><span class="c">Berikutnya</span><b style="font-size:15px">${l.next}</b></div></div>
    </section>`).join('')}
    <div class="sec"><h2 class="h2">Sudah dibayar</h2><span class="c">${paid.length} tagihan</span></div>
    <section class="card" style="overflow:hidden">
      ${paid.map(b => `<div class="tx" style="cursor:default">${catIc('inc', b.ic)}<div class="grow"><div class="b" style="font-size:14px">${esc(b.n)}</div><div class="c">Dibayar ${WHO[b.paid.by]}, ${dShort(b.paid.at)}</div></div>
        <div class="meta"><span class="num">${rp(b.a)}</span><span class="badge ok">${ic('check')}Lunas</span></div></div>`).join('') || '<div class="c" style="padding:16px">Belum ada.</div>'}
    </section>
  </main></div>`;
};

function goalInfo(g) {
  const have = goalHave(g), left = Math.max(0, g.target - have);
  const months = Math.max(1, Math.round(daysBetween(today(), g.due) / 30.4));
  const saran = Math.round(left / months / 10000) * 10000, p = pct(have, g.target);
  const contrib = g.j + g.s || 1, jp = pct(g.j, contrib);
  return { have, left, saran, p, jp, ok: saran <= 4000000 || left === 0 };
}
V.tujuan = () => {
  const infos = S.goals.map(g => [g, goalInfo(g)]);
  const tot = infos.reduce((a, [, i]) => a + i.have, 0), target = S.goals.reduce((a, g) => a + g.target, 0), saran = infos.reduce((a, [, i]) => a + i.saran, 0);
  return `<div class="screen">${topBar('Tujuan bersama', { back: '#/lainnya', right: `<button class="ib" data-act="sheet" data-s="goal" aria-label="Tambah tujuan">${ic('plus')}</button>` })}
  <main class="pad">
    <section class="hero"><div class="lbl">Terkumpul untuk ${S.goals.length} tujuan</div><div class="big">${rp(tot)}</div>
      <div class="s" style="font-weight:700">dari target ${rp(target)} · saran setoran ${rp(saran)} per bulan</div></section>
    ${infos.map(([g, i]) => `<section class="card cardpad">
      <div class="row" style="gap:16px">
        <div class="ring" role="img" aria-label="${i.p} persen tercapai" style="background:conic-gradient(var(--priF) 0 ${i.p}%, var(--card2) ${i.p}% 100%)"><span>${i.p}%</span></div>
        <div class="grow" style="display:flex;flex-direction:column;gap:2px">
          <div class="row" style="gap:6px">${ic(g.ic, 'width:16px;height:16px;color:var(--ink3)')}<span class="b" style="font-size:14px">${esc(g.n)}</span></div>
          <div class="num" style="text-align:left;font-size:20px">${rp(i.have)}</div><div class="c">dari ${rp(g.target)}</div>
          <span class="badge ${i.ok ? 'ok' : 'warn'}" style="align-self:flex-start;margin-top:4px">${i.left === 0 ? 'Tercapai' : i.ok ? 'Sesuai jalur' : 'Perlu setoran lebih besar'}</span>
        </div></div>
      <div class="grid3"><div class="stat"><span class="c">Tenggat</span><b style="font-size:14px">${dShort(g.due)} ${g.due.slice(0, 4)}</b></div><div class="stat"><span class="c">Sisa</span><b style="font-size:14px">${jt(i.left)}</b></div><div class="stat"><span class="c">Saran / bulan</span><b style="font-size:14px">${jt(i.saran)}</b></div></div>
      <div style="display:flex;flex-direction:column;gap:6px"><div class="c">Kontribusi</div>
        <div class="stack" role="img" aria-label="James ${i.jp} persen, Sabrina ${100 - i.jp} persen"><span style="width:${i.jp}%;background:var(--hus)"></span><span style="width:${100 - i.jp}%;background:var(--wif)"></span></div>
        <div class="sec" style="font-size:13px"><span class="row" style="gap:6px">${av('j', 20)}James <b>${rp(g.j)}</b></span><span class="row" style="gap:6px"><b>${rp(g.s)}</b> Sabrina${av('s', 20)}</span></div></div>
      <div class="grid2"><button type="button" class="btn s sm" data-act="sheet" data-s="goalLog" data-id="${g.id}">Riwayat</button><button type="button" class="btn p sm" data-act="sheet" data-s="deposit" data-id="${g.id}">${ic('plus')}Setor</button></div>
    </section>`).join('')}
  </main></div>`;
};

V.utang = () => {
  const inn = S.debts.filter(d => d.kind === 'in' && d.sisa > 0), out = S.debts.filter(d => d.kind === 'out' && d.sisa > 0);
  const onlyOpen = ui.debtOpen;
  const sec = (title, kind) => { const items = S.debts.filter(d => d.kind === kind && (!onlyOpen || d.sisa > 0)); return items.length ? `<h2 class="h2" style="padding:0 4px">${title}</h2><section class="card" style="overflow:hidden">${items.map(d => { const paid = d.sisa === 0; return `<div style="padding:14px 16px;display:flex;flex-direction:column;gap:10px;border-top:1px solid var(--line)">
      <div class="row"><div class="cat pri" style="font-family:Fredoka,sans-serif;font-weight:700;font-size:17px">${esc(d.n[0])}</div>
        <div class="grow"><div class="b" style="font-size:14px">${esc(d.n)}</div><div class="c row" style="gap:4px">${av(d.by, 16)}${esc(d.sub)} · dicatat ${WHO[d.by]}</div></div>
        <div style="text-align:right"><div class="num" style="color:${paid ? 'var(--inc)' : 'var(--ink)'}">${paid ? 'Lunas' : 'Sisa ' + rp(d.sisa)}</div><div class="c">dari ${rp(d.total)}</div></div></div>
      <div class="bar"><i class="${paid ? 'ok' : 'pri'}" style="width:${pct(d.total - d.sisa, d.total)}%"></i></div>
      <div class="sec"><span class="badge ${paid ? 'ok' : 'warn'}">${ic(paid ? 'check' : 'clock')}${paid ? 'Lunas' : 'Belum lunas'}</span><span class="c">${esc(d.due)}</span></div>
      ${paid ? '' : `<div class="grid2"><button type="button" class="btn s sm" data-act="sheet" data-s="debtPay" data-id="${d.id}">${kind === 'in' ? 'Catat uang kembali' : 'Catat pembayaran'}</button>
        <button type="button" class="btn g sm" data-act="remind" data-id="${d.id}">${ic('bell')}${esc(d.remind || 'Ingatkan')}</button></div>`}
    </div>`; }).join('')}</section>` : ''; };
  return `<div class="screen">${topBar('Utang dan piutang', { back: '#/lainnya', right: `<button class="ib" data-act="sheet" data-s="debt" aria-label="Catat utang atau piutang">${ic('plus')}</button>` })}
  <main class="pad">
    <div class="grid2">
      <div class="card" style="padding:14px"><div class="c row" style="gap:4px;color:var(--inc)">${ic('in', 'width:14px;height:14px')}Akan diterima</div><div class="num inc" style="text-align:left;font-size:20px">${rp(inn.reduce((a, d) => a + d.sisa, 0))}</div><div class="c">${inn.length} pihak</div></div>
      <div class="card" style="padding:14px"><div class="c row" style="gap:4px;color:var(--exp)">${ic('out', 'width:14px;height:14px')}Harus dibayar</div><div class="num exp" style="text-align:left;font-size:20px">${rp(out.reduce((a, d) => a + d.sisa, 0))}</div><div class="c">${out.length} pihak</div></div>
    </div>
    <div class="seg" role="tablist" aria-label="Tampilkan"><button type="button" role="tab" aria-selected="${!onlyOpen}" class="${onlyOpen ? '' : 'on'}" data-act="debtFilter" data-v="0">Semua</button><button type="button" role="tab" aria-selected="${!!onlyOpen}" class="${onlyOpen ? 'on' : ''}" data-act="debtFilter" data-v="1">Belum lunas</button></div>
    ${sec('Yang kita pinjamkan', 'in')}${sec('Yang kita pinjam', 'out')}
  </main></div>`;
};

function netWorth() {
  const cash = totalBal(), piutang = S.debts.filter(d => d.kind === 'in').reduce((a, d) => a + d.sisa, 0);
  const assets = [{ n: 'Kas dan rekening', ic: 'wallet', sub: `${S.wallets.length} dompet`, v: cash }, ...S.assets, { n: 'Piutang', ic: 'debt', sub: S.debts.filter(d => d.kind === 'in' && d.sisa).map(d => d.n).join(', ') || '-', v: piutang }];
  const liabs = [
    ...S.loans.filter(l => l.pokok > 0).map(l => ({ n: 'Sisa ' + l.n.toLowerCase(), ic: l.ic, sub: `${l.tot - l.paid} kali lagi`, v: l.pokok })),
    { n: 'Tagihan kartu kredit', ic: 'card', sub: 'Jatuh tempo 2 Nov', v: S.card },
    ...S.debts.filter(d => d.kind === 'out' && d.sisa > 0).map(d => ({ n: 'Utang ke ' + d.n, ic: 'debt', sub: d.sub, v: d.sisa }))
  ];
  const ta = assets.reduce((a, x) => a + x.v, 0), tl = liabs.reduce((a, x) => a + x.v, 0);
  return { assets, liabs, ta, tl, net: ta - tl };
}
V.aset = () => {
  const nw = netWorth(), vals = [...NW_HIST.slice(-5), [mkey(today()), nw.net]];
  const min = Math.min(...vals.map(v => v[1])), max = Math.max(...vals.map(v => v[1])), span = (max - min) || 1;
  const pts = vals.map(([m, v], i) => ({ m: BLN[+m.slice(5) - 1], v: (v / 1e6).toLocaleString('id-ID', { maximumFractionDigits: 1 }), x: Math.round(16 + i * 57.6), y: Math.round(110 - (v - min) / span * 90) }));
  const line = pts.map(p => p.x + ',' + p.y).join(' '), prev = vals[vals.length - 2][1], diff = nw.net - prev;
  const list = (arr, cls) => arr.map(a => `<div class="tx" style="cursor:default">${catIc(cls === 'exp' ? 'exp' : 'inc', a.ic)}<div class="grow"><div class="b" style="font-size:14px">${esc(a.n)}</div><div class="c">${esc(a.sub)}</div></div><span class="num ${cls}">${rp(a.v)}</span></div>`).join('');
  return `<div class="screen">${topBar('Aset dan kekayaan bersih', { back: '#/lainnya' })}
  <main class="pad">
    <section class="card cardpad">
      <div class="c">Kekayaan bersih rumah tangga</div>
      <div class="num" style="text-align:left;font-size:30px;line-height:38px">${rp(nw.net)}</div>
      <div class="row ${diff >= 0 ? 'inc' : 'exp'}" style="gap:4px;font-size:13px;font-weight:800">${ic(diff >= 0 ? 'up' : 'out')}${diff >= 0 ? '+' : '−'}${rp(diff)} (${(diff / prev * 100).toLocaleString('id-ID', { maximumFractionDigits: 1 })}%) dari bulan lalu</div>
      <svg viewBox="0 0 320 130" role="img" aria-label="Grafik kekayaan bersih 6 bulan terakhir" style="width:100%;height:auto">
        ${[20, 65, 110].map(y => `<line x1="0" y1="${y}" x2="320" y2="${y}" stroke="var(--line)"></line>`).join('')}
        <polygon points="16,110 ${line} ${pts[pts.length - 1].x},110" fill="var(--priS)"></polygon>
        <polyline points="${line}" fill="none" stroke="var(--pri)" stroke-width="2.5" stroke-linejoin="round"></polyline>
        ${pts.map(p => `<circle cx="${p.x}" cy="${p.y}" r="4" fill="var(--card)" stroke="var(--pri)" stroke-width="2"></circle>`).join('')}
      </svg>
      <div class="c" style="display:grid;grid-template-columns:repeat(6,1fr);text-align:center">${pts.map(p => `<span>${p.m}<br><b style="color:var(--ink)">${p.v}</b></span>`).join('')}</div>
    </section>
    <div class="grid2"><div class="card" style="padding:14px"><div class="c">Total aset</div><div class="num inc" style="text-align:left;font-size:18px">${rp(nw.ta)}</div></div>
      <div class="card" style="padding:14px"><div class="c">Total kewajiban</div><div class="num exp" style="text-align:left;font-size:18px">${rp(nw.tl)}</div></div></div>
    <div class="sec"><h2 class="h2">Aset</h2><span class="c">${nw.assets.length} pos</span></div>
    <section class="card" style="overflow:hidden">${list(nw.assets, '')}</section>
    <div class="sec"><h2 class="h2">Kewajiban</h2><span class="c">${nw.liabs.length} pos</span></div>
    <section class="card" style="overflow:hidden">${list(nw.liabs, 'exp')}</section>
    <div class="c">Kas dan piutang dihitung otomatis dari dompet dan catatan utang. Nilai emas dan investasi diperbarui manual.</div>
  </main></div>`;
};

V.laporan = () => {
  const m = ui.rptMonth, list = inMonth(m), exp = list.filter(t => t.k === 'exp'), te = sumK(list, 'exp'), ti = sumK(list, 'inc');
  const byCat = {}; exp.forEach(t => byCat[t.cat] = (byCat[t.cat] || 0) + t.n);
  const sorted = Object.entries(byCat).sort((a, b) => b[1] - a[1]);
  const COLS = ['var(--k1)', 'var(--k2)', 'var(--k3)', 'var(--k4)', 'var(--k5)', 'var(--k6)'];
  let cats = sorted.slice(0, 5).map(([c, v]) => [CATS[c].n, v]);
  if (sorted.length > 5) cats.push([`Lainnya (${sorted.length - 5})`, sorted.slice(5).reduce((a, x) => a + x[1], 0)]);
  let acc = 0; const stops = cats.map(([, v], i) => { const s = acc; acc += v / (te || 1) * 100; return `${COLS[i]} ${s}% ${acc}%`; });
  const by = (k, o) => list.filter(t => t.k === k && t.by === o).reduce((a, t) => a + t.n, 0);
  const contrib = [['Pengeluaran yang dicatat', by('exp', 'j'), by('exp', 's')], ['Pemasukan', by('inc', 'j'), by('inc', 's')]];
  const months = Array.from({ length: 6 }, (_, i) => shiftMonth(m, i - 5));
  const trend = months.map(k => { const l = inMonth(k); const has = l.length; return { m: BLN[+k.slice(5) - 1], i: has ? sumK(l, 'inc') : (HIST[k]?.[0] || 0), e: has ? sumK(l, 'exp') : (HIST[k]?.[1] || 0), cur: k === mkey(today()) }; });
  const tmax = Math.max(1, ...trend.map(t => Math.max(t.i, t.e)));
  const weeks = []; for (let w = 0; w < 5; w++) { const l = list.filter(t => Math.floor((+t.d.slice(8, 10) - 1) / 7) === w); if (l.length) weeks.push({ n: `Minggu ${w + 1} · ${w * 7 + 1} sampai ${Math.min(w * 7 + 7, 31)} ${BLN[+m.slice(5) - 1]}`, i: sumK(l, 'inc'), e: sumK(l, 'exp') }); }
  const wmax = Math.max(1, ...weeks.map(w => Math.max(w.i, w.e)));
  const g = grp => exp.filter(t => CATS[t.cat]?.g === grp).reduce((a, t) => a + t.n, 0);
  const saveTrf = list.filter(t => t.k === 'trf' && W(t.w2)?.save).reduce((a, t) => a + t.n, 0);
  const rule = [['Kebutuhan', g('need'), 50, 'dapur, tagihan, cicilan, keluarga, zakat', 'var(--k1)'], ['Keinginan', g('want'), 30, 'makan di luar, hiburan, pakaian, kondangan', 'var(--k5)'], ['Tabungan', g('save') + saveTrf, 20, 'investasi dan dana darurat', 'var(--inc)']];
  const unalloc = ti ? 100 - rule.reduce((a, r) => a + pct(r[1], ti), 0) : 0;
  return `<div class="screen">${topBar('Laporan', { back: '#/lainnya', right: `<button class="ib" data-act="exportCsv" aria-label="Unduh CSV">${ic('download')}</button>` })}
  <div class="row" style="gap:4px;justify-content:space-between;padding:0 12px">
    <button class="ib" data-act="rptMonth" data-n="-1" aria-label="Bulan sebelumnya">${ic('left')}</button><b class="disp" style="font-size:16px">${monthName(m)}</b>
    <button class="ib" data-act="rptMonth" data-n="1" aria-label="Bulan berikutnya">${ic('right')}</button></div>
  <main class="pad">
    <section class="card cardpad"><h2 class="h2">Pengeluaran per kategori</h2>
      ${te ? `<div class="row" style="gap:20px;flex-wrap:wrap;justify-content:center">
        <div class="donut" role="img" aria-label="Total pengeluaran ${rp(te)}" style="background:conic-gradient(${stops.join(',')})"><span><span class="c">Total</span><b>${jt(te)}</b></span></div>
        <div class="grow" style="display:flex;flex-direction:column;gap:6px;min-width:160px">${cats.map(([n, v], i) => `<div class="lg"><span class="sq" style="background:${COLS[i]}"></span><span>${n}</span><b>${pct(v, te)}%</b></div>`).join('')}</div></div>` : empty('Belum ada pengeluaran', 'Bulan ini masih bersih.')}
    </section>
    <section class="card cardpad"><h2 class="h2">James dan Sabrina</h2>
      ${contrib.map(([n, j, s]) => { const t = j + s || 1; return `<div style="display:flex;flex-direction:column;gap:6px"><div class="c">${n}</div>
        <div class="stack" role="img" aria-label="James ${pct(j, t)} persen, Sabrina ${pct(s, t)} persen"><span style="width:${pct(j, t)}%;background:var(--hus)"></span><span style="width:${pct(s, t)}%;background:var(--wif)"></span></div>
        <div class="sec" style="font-size:13px"><span class="row" style="gap:6px">${av('j', 20)}<b>${rp(j)}</b><span class="c">${pct(j, t)}%</span></span><span class="row" style="gap:6px"><span class="c">${pct(s, t)}%</span><b>${rp(s)}</b>${av('s', 20)}</span></div></div>`; }).join('')}
    </section>
    <section class="card cardpad"><div class="sec"><h2 class="h2">Tren 6 bulan</h2><span class="c">juta rupiah</span></div>
      <div class="row c" style="gap:14px"><span class="row" style="gap:6px"><span style="width:10px;height:10px;border-radius:3px;background:var(--inc)"></span>Pemasukan</span><span class="row" style="gap:6px"><span style="width:10px;height:10px;border-radius:3px;background:var(--exp)"></span>Pengeluaran</span></div>
      <div class="tb" role="img" aria-label="Pemasukan dan pengeluaran 6 bulan terakhir">${trend.map(t => `<div class="g" title="${t.m}: +${jt(t.i)} / −${jt(t.e)}"><i style="height:${Math.round(t.i / tmax * 100)}%;background:var(--inc)"></i><i style="height:${Math.round(t.e / tmax * 100)}%;background:${t.cur ? 'var(--k6)' : 'var(--exp)'}"></i></div>`).join('')}</div>
      <div class="c" style="display:grid;grid-template-columns:repeat(6,1fr);text-align:center">${trend.map(t => `<span>${t.m}</span>`).join('')}</div>
      ${trend.some(t => t.cur) ? '<div class="c">Bulan ini masih berjalan (batang abu abu).</div>' : ''}
    </section>
    ${weeks.length ? `<section class="card cardpad"><h2 class="h2">Arus kas mingguan</h2>
      ${weeks.map(w => `<div style="display:flex;flex-direction:column;gap:6px"><div class="sec"><b style="font-size:14px">${w.n}</b><span class="num ${w.i - w.e >= 0 ? 'inc' : 'exp'}">${w.i - w.e >= 0 ? '+' : '−'}${rp(w.i - w.e)}</span></div>
        <div class="row c" style="gap:8px"><span style="width:56px">+ Masuk</span><div class="bar grow"><i class="ok" style="width:${pct(w.i, wmax)}%"></i></div><span class="num" style="width:104px">${rp(w.i)}</span></div>
        <div class="row c" style="gap:8px"><span style="width:56px">− Keluar</span><div class="bar grow"><i class="over" style="width:${pct(w.e, wmax)}%"></i></div><span class="num" style="width:104px">${rp(w.e)}</span></div></div>`).join('')}</section>` : ''}
    <section class="card cardpad"><div class="sec"><h2 class="h2">Aturan 50/30/20</h2><span class="c">dari pemasukan</span></div>
      ${rule.map(([n, v, t, note, col]) => `<div style="display:flex;flex-direction:column;gap:6px"><div class="sec"><span style="font-weight:800">${n}</span><span><b>${pct(v, ti)}%</b><span class="c"> · target ${t}%</span></span></div>
        <div class="bar" style="position:relative;overflow:visible"><i style="width:${Math.min(100, pct(v, ti))}%;background:${col}"></i><b aria-hidden="true" style="position:absolute;top:-3px;left:${t}%;width:2px;height:14px;background:var(--ink)"></b></div>
        <div class="c">${rp(v)} · ${note}</div></div>`).join('')}
      ${ti && unalloc > 0 ? `<div class="c">${unalloc}% pemasukan belum dialokasikan. Sisihkan ke tujuan bersama supaya tetap sesuai jalur.</div>` : ''}
    </section>
    <div class="grid2"><button type="button" class="btn s" data-act="exportCsv">${ic('sheet')}Ekspor CSV</button><button type="button" class="btn p" data-act="print">${ic('download')}Cetak / PDF</button></div>
  </main></div>`;
};

V.pengaturan = () => {
  const n = S.notif, tog = (k, t, sub) => `<div class="it"><div class="grow"><div class="t">${t}</div><div class="c">${sub}</div></div><button type="button" class="tog${n[k] ? ' on' : ''}" role="switch" aria-checked="${!!n[k]}" aria-label="${t}" data-act="tog" data-k="${k}"></button></div>`;
  return `<div class="screen">${topBar('Pengaturan', { back: '#/lainnya' })}
  <main class="pad">
    <section class="card" style="padding:16px;display:flex;align-items:center;gap:12px"><div class="avs">${av('j', 44)}${av('s', 44)}</div>
      <div class="grow"><div class="b">Rumah tangga James dan Sabrina</div><div class="c">2 anggota · masuk sebagai ${WHO[me()]}</div></div>
      <button class="btn s sm" style="width:auto" data-act="switchUser">Ganti ke ${WHO[other()]}</button></section>
    <div class="lbl">Tampilan</div>
    <section class="card cardpad"><div class="c">Tema</div>
      <div class="seg" role="radiogroup" aria-label="Tema">${[['light', 'Terang'], ['dark', 'Gelap'], ['auto', 'Ikuti HP']].map(([k, l]) => `<button type="button" role="radio" aria-checked="${S.theme === k}" class="${S.theme === k ? 'on' : ''}" data-act="theme" data-k="${k}">${l}</button>`).join('')}</div></section>
    <div class="lbl">Notifikasi</div>
    <section class="card">${tog('big', 'Pengeluaran besar', 'Beri tahu pasangan jika satu transaksi di atas Rp1.000.000')}${tog('bill', 'Pengingat tagihan', '3 hari sebelum jatuh tempo, pukul 08.00')}${tog('budget', 'Anggaran hampir habis', 'Saat kategori mencapai 80%')}${tog('partner', 'Catatan baru dari pasangan', 'Ringkasan sekali sehari, pukul 20.00')}</section>
    <div class="lbl">Uang pribadi</div>
    <section class="card"><div class="it">${av('j', 28)}<span class="t">Jatah pribadi James</span><span class="c">Rp1.500.000 / bln</span></div><div class="it">${av('s', 28)}<span class="t">Jatah pribadi Sabrina</span><span class="c">Rp1.500.000 / bln</span></div>
      ${tog('secret', 'Rahasiakan rincian dompet pribadi', 'Pasangan hanya melihat total, bukan tiap transaksi')}</section>
    <div class="lbl">Data</div>
    <section class="card">
      <button class="it" style="width:100%;background:none;border:0;cursor:pointer;text-align:left" data-act="exportAll">${ic('sheet')}<span class="t">Ekspor semua transaksi</span><span class="c">CSV</span>${ic('right')}</button>
      <button class="it" style="width:100%;background:none;border:0;cursor:pointer;text-align:left" data-act="askReset">${ic('trash')}<span class="t">Kembalikan data contoh</span><span class="c">Hapus perubahan</span>${ic('right')}</button>
    </section>
    <button type="button" class="btn d" data-act="logout">${ic('logout')}Keluar</button>
    <div class="c" style="text-align:center">Pyojem Keuangan versi 1.0 · data tersimpan di browser ini</div>
  </main></div>`;
};

/* ---------- lembar (sheet) ---------- */
const walletSelect = (name, sel) => `<div class="field"><select name="${name}" id="${name}">${S.wallets.map(w => `<option value="${w.id}"${w.id === sel ? ' selected' : ''}>${esc(w.n)} · ${rp(w.bal)}</option>`).join('')}</select></div>`;
const numField = (name, label, val = '') => `<div><label class="lab" for="${name}">${label}</label><div class="field"><span class="c" style="font-weight:800">Rp</span><input id="${name}" name="${name}" inputmode="numeric" pattern="[0-9.]*" placeholder="0" value="${val}" required></div></div>`;
const txtField = (name, label, val = '', ph = '') => `<div><label class="lab" for="${name}">${label}</label><div class="field"><input id="${name}" name="${name}" type="text" value="${esc(val)}" placeholder="${ph}" required></div></div>`;
const sheetHead = t => `<div class="sec"><h2 class="h2" style="font-size:20px">${t}</h2><button type="button" class="ib" data-act="closeSheet" aria-label="Tutup">${ic('x')}</button></div>`;
const SH = {
  budget: () => `<form class="sheet" data-submit="budget">${sheetHead('Atur anggaran bulanan')}
    <div class="c">Kosongkan atau isi 0 untuk mematikan anggaran kategori.</div>
    ${Object.entries(CATS).filter(([, c]) => c.k === 'exp').map(([k, c]) => `<div class="row">${catIc('exp', c.ic, 'width:36px;height:36px')}<label class="grow b" style="font-size:14px" for="b_${k}">${c.n}</label>
      <div class="field" style="width:150px"><input id="b_${k}" name="${k}" inputmode="numeric" value="${S.budgets[k] ? S.budgets[k].toLocaleString('id-ID') : ''}" placeholder="0"></div></div>`).join('')}
    <button class="btn p">${ic('check')}Simpan anggaran</button></form>`,
  wallet: () => `<form class="sheet" data-submit="wallet">${sheetHead('Tambah dompet')}
    ${txtField('n', 'Nama dompet', '', 'misalnya Jago Sabrina')}
    <div><span class="lab">Pemilik</span><div class="seg">${['b', 'j', 's'].map((o, i) => `<label style="display:contents"><input type="radio" name="o" value="${o}" class="sr"${i === 0 ? ' checked' : ''}><button type="button" class="${i === 0 ? 'on' : ''}" data-act="radioSeg">${WHO[o]}</button></label>`).join('')}</div></div>
    <div><label class="lab" for="icw">Jenis</label><div class="field"><select id="icw" name="ic"><option value="bank">Rekening bank</option><option value="phone">Dompet digital</option><option value="cash">Tunai</option><option value="darurat">Tabungan</option></select></div></div>
    ${numField('bal', 'Saldo awal')}<button class="btn p">${ic('check')}Simpan dompet</button></form>`,
  adjust: () => `<form class="sheet" data-submit="adjust">${sheetHead('Sesuaikan saldo')}
    <div><label class="lab" for="w">Dompet</label>${walletSelect('w', S.wallets[0].id)}</div>
    ${numField('bal', 'Saldo sebenarnya sekarang')}
    <div class="c">Selisih dicatat di keterangan dompet, tanpa membuat transaksi.</div><button class="btn p">${ic('check')}Simpan</button></form>`,
  bill: () => `<form class="sheet" data-submit="bill">${sheetHead('Tambah tagihan')}
    ${txtField('n', 'Nama tagihan', '', 'misalnya Iuran sampah')}${numField('a', 'Nominal')}
    <div><label class="lab" for="due">Jatuh tempo</label><div class="field"><input id="due" name="due" type="date" value="${today()}" required></div></div>
    <div><label class="lab" for="cat">Kategori</label><div class="field"><select id="cat" name="cat">${Object.entries(CATS).filter(([, c]) => c.k === 'exp').map(([k, c]) => `<option value="${k}">${c.n}</option>`).join('')}</select></div></div>
    <div><label class="lab" for="w">Dibayar dari</label>${walletSelect('w', 'rekber')}</div><button class="btn p">${ic('check')}Simpan tagihan</button></form>`,
  goal: () => `<form class="sheet" data-submit="goal">${sheetHead('Tujuan baru')}
    ${txtField('n', 'Nama tujuan', '', 'misalnya Umrah berdua')}${numField('target', 'Target')}
    <div><label class="lab" for="due">Tenggat</label><div class="field"><input id="due" name="due" type="date" value="${shiftMonth(mkey(today()), 12)}-01" required></div></div>
    <button class="btn p">${ic('check')}Simpan tujuan</button></form>`,
  deposit: (id) => { const g = S.goals.find(x => x.id === id); return `<form class="sheet" data-submit="deposit" data-id="${id}">${sheetHead('Setor ke ' + esc(g.n))}
    ${numField('n', 'Nominal setoran')}
    <div><label class="lab" for="w">Ambil dari</label>${walletSelect('w', me() === 'j' ? 'bcaj' : 'mandiri')}</div>
    <div class="c">Setoran dicatat sebagai transfer atas nama ${WHO[me()]}${g.wallet ? ' ke ' + wName(g.wallet) : ''}.</div>
    <button class="btn p">${ic('check')}Setor</button></form>`; },
  goalLog: (id) => { const g = S.goals.find(x => x.id === id); return `<div class="sheet">${sheetHead('Riwayat ' + esc(g.n))}
    ${g.log.length ? `<div class="card">${[...g.log].reverse().map(l => `<div class="it">${av(l.by, 28)}<div class="grow"><div class="t">${WHO[l.by]} menyetor</div><div class="c">${dShort(l.at)} ${l.at.slice(0, 4)}</div></div><span class="num inc">+${rp(l.n)}</span></div>`).join('')}</div>` : '<div class="c">Belum ada setoran yang dicatat di aplikasi.</div>'}</div>`; },
  debt: () => `<form class="sheet" data-submit="debt">${sheetHead('Catat utang atau piutang')}
    <div class="seg">${[['in', 'Kita pinjamkan'], ['out', 'Kita pinjam']].map(([k, l], i) => `<label style="display:contents"><input type="radio" name="kind" value="${k}" class="sr"${i === 0 ? ' checked' : ''}><button type="button" class="${i === 0 ? 'on' : ''}" data-act="radioSeg">${l}</button></label>`).join('')}</div>
    ${txtField('n', 'Nama orang atau pihak')}${txtField('sub', 'Keterangan', '', 'misalnya Teman kantor')}${numField('total', 'Jumlah')}
    <div><label class="lab" for="due">Jatuh tempo</label><div class="field"><input id="due" name="due" type="date" value="${today()}"></div></div>
    <button class="btn p">${ic('check')}Simpan</button></form>`,
  debtPay: (id) => { const d = S.debts.find(x => x.id === id); return `<form class="sheet" data-submit="debtPay" data-id="${id}">${sheetHead((d.kind === 'in' ? 'Uang kembali dari ' : 'Bayar ke ') + esc(d.n))}
    <div class="c">Sisa ${rp(d.sisa)} dari ${rp(d.total)}</div>${numField('n', 'Nominal', d.sisa.toLocaleString('id-ID'))}
    <button class="btn p">${ic('check')}Catat</button></form>`; },
  confirm: (o) => `<div class="sheet">${sheetHead(o.title)}<div class="s">${o.text}</div>
    <div class="grid2"><button class="btn s" data-act="closeSheet">Batal</button><button class="btn d" data-act="${o.act}" data-id="${o.id || ''}">${o.ok}</button></div></div>`
};
const parseNum = v => parseInt(String(v || '').replace(/[^\d]/g, ''), 10) || 0;

/* ---------- render ---------- */
const NAV = [['beranda', 'home', 'Beranda'], ['transaksi', 'list', 'Transaksi'], ['anggaran', 'pie', 'Anggaran'], ['dompet', 'wallet', 'Dompet'], ['tagihan', 'bill', 'Tagihan'], ['tujuan', 'target', 'Tujuan'], ['utang', 'debt', 'Utang'], ['aset', 'asset', 'Aset'], ['laporan', 'report', 'Laporan'], ['pengaturan', 'settings', 'Pengaturan']];
const MORE = ['lainnya', 'dompet', 'tagihan', 'tujuan', 'utang', 'aset', 'laporan', 'pengaturan'];
function render(keepScroll) {
  const [r, arg] = ui.route.split('/');
  const root = $('#app');
  if (!S.loggedIn) { root.innerHTML = V.login(); root.className = ''; applyTheme(); return; }
  const view = (V[r] || V.beranda)(arg);
  const navOn = k => (k === r || (k === 'lainnya' && MORE.includes(r)) || (k === 'transaksi' && r === 'detail')) ? ' class="on" aria-current="page"' : '';
  const y = window.scrollY;
  root.className = 'app';
  root.innerHTML = `<aside class="side" aria-label="Menu utama">
      <div class="brand"><img src="assets/avatar-bersama.png" alt=""><div><b>Pyojem</b><br><span>Keuangan</span></div></div>
      <a href="#/tambah" class="add" data-act="newTx" data-k="exp">${ic('plus')}Tambah transaksi</a>
      ${NAV.map(([k, i, n]) => `<a href="#/${k}"${navOn(k)}>${ic(i)}${n}</a>`).join('')}
      <div class="who"><div class="avs">${av('j', 28)}${av('s', 28)}</div><div><b>${WHO[me()]}</b><br><span class="c">Bersama ${WHO[other()]}</span></div></div>
    </aside>
    <div class="${ui.route !== ui.prevRoute ? 'enter' : ''}" id="view">${view}</div>
    ${r === 'tambah' ? '' : `<nav class="nav" aria-label="Navigasi utama">
      <a href="#/beranda"${navOn('beranda')}>${ic('home')}Beranda</a><a href="#/transaksi"${navOn('transaksi')}>${ic('list')}Transaksi</a>
      <a href="#/tambah" class="fab" aria-label="Tambah transaksi" data-act="newTx" data-k="exp">${ic('plus')}</a>
      <a href="#/anggaran"${navOn('anggaran')}>${ic('pie')}Anggaran</a><a href="#/lainnya"${navOn('lainnya')}>${ic('grid')}Lainnya</a></nav>`}
    <div id="sheet">${ui.sheet ? `<div class="scrim" data-act="scrim">${SH[ui.sheet.s](ui.sheet.s === 'confirm' ? ui.sheet : ui.sheet.id)}</div>` : ''}</div>
    <div id="toast">${ui.toast ? `<div class="toast" role="status"><img src="assets/maskot.png" alt=""><span class="grow">${esc(ui.toast.text)}</span>${ui.toast.undo ? '<button type="button" data-act="undo">Urungkan</button>' : ''}</div>` : ''}</div>`;
  ui.prevRoute = ui.route;
  if (keepScroll) window.scrollTo(0, y);
  applyTheme();
}
function applyTheme() { if (S.theme === 'auto') delete document.documentElement.dataset.theme; else document.documentElement.dataset.theme = S.theme; }
function commit(keepScroll = true) { save(); render(keepScroll); }
function toast(text, undo) {
  clearTimeout(ui.tm); ui.toast = { text, undo };
  ui.tm = setTimeout(() => { ui.toast = null; ui.newId = null; const t = $('#toast'); if (t) t.innerHTML = ''; }, 4500);
}
function go(route) { if (location.hash !== '#/' + route) location.hash = '#/' + route; else render(); }
window.addEventListener('hashchange', () => { ui.route = location.hash.replace(/^#\/?/, '') || 'beranda'; if (ui.route.startsWith('tambah') && !ui.draft) ui.draft = newDraft(); ui.sheet = null; render(); window.scrollTo(0, 0); });

/* ---------- aksi ---------- */
const A = {
  pickUser: d => { S.user = d.o; render(); },
  peek: (d, el) => { const i = $('#sandi'); i.type = i.type === 'password' ? 'text' : 'password'; },
  month: d => { ui.month = shiftMonth(ui.month, +d.n); render(true); },
  rptMonth: d => { ui.rptMonth = shiftMonth(ui.rptMonth, +d.n); render(true); },
  fkind: d => { ui.f.kind = d.k; render(true); },
  fby: d => { ui.f.by = d.k; render(true); },
  budgetGo: d => { ui.f = { ...ui.f, cat: d.c, kind: 'all', w: 'all' }; },
  walletGo: d => { ui.f = { ...ui.f, w: d.w, cat: 'all', kind: 'all' }; },
  newTx: d => { ui.draft = newDraft(d.k || 'exp'); if (ui.route === 'tambah') render(); },
  dkind: d => { const x = ui.draft; x.kind = d.k; x.cat = catOrder(d.k)[0] || 'transfer'; x.all = false; render(true); },
  dcat: d => { ui.draft.cat = d.c; render(true); },
  dall: () => { ui.draft.all = true; render(true); },
  dshared: d => { ui.draft.shared = d.v === '1'; render(true); },
  fav: d => { const f = FAVS[+d.i]; Object.assign(ui.draft, { kind: f.kind, cat: f.cat, digits: String(f.a), note: f.note, w: f.w, shared: !!f.shared }); render(true); },
  key: d => { const x = ui.draft; let s = x.digits; if (d.k === '⌫') s = s.slice(0, -1); else s = (s + d.k).replace(/^0+/, ''); if (s.length <= 12) { x.digits = s; render(true); } },
  saveTx: () => {
    const x = ui.draft, n = parseInt(x.digits || '0', 10); if (!n) return;
    const time = x.date === today() ? nowIso().slice(11) : '12:00';
    const base = { t: x.note.trim() || (x.kind === 'trf' ? `Transfer ke ${wName(x.w2)}` : CATS[x.cat].n), k: x.kind, cat: x.kind === 'trf' ? 'transfer' : x.cat, w: x.w, w2: x.kind === 'trf' ? x.w2 : undefined, n, shared: x.kind === 'trf' ? true : x.shared };
    if (x.editId) {
      const old = S.txs.find(t => t.id === x.editId); applyTx(old, -1);
      const changes = []; if (old.n !== n) changes.push(`mengubah nominal dari ${rp(old.n)} menjadi ${rp(n)}`); if (old.cat !== base.cat) changes.push(`mengubah kategori menjadi ${CATS[base.cat].n}`); if (old.t !== base.t) changes.push('mengubah catatan');
      Object.assign(old, base, { d: x.date + 'T' + old.d.slice(11) }); applyTx(old, 1);
      old.hist.unshift({ by: me(), what: changes.join(', ') || 'menyimpan ulang transaksi', at: nowIso() });
      ui.draft = null; save(); toast('Perubahan tersimpan'); go('detail/' + old.id); return;
    }
    const t = { id: uid(), ...base, by: me(), d: x.date + 'T' + time, note: '', tags: [], comments: [], hist: [{ by: me(), what: 'mencatat transaksi ini', at: nowIso() }] };
    addTx(t); ui.newId = t.id; ui.draft = null; ui.month = mkey(t.d); save();
    const warn = t.k === 'exp' && S.budgets[t.cat] && budgetRows(mkey(t.d)).find(r => r.cat === t.cat);
    toast(`Tersimpan. ${t.t} ${sg(t.k, n)}${warn && warn.st !== 'ok' ? ` · anggaran ${CATS[t.cat].s.toLowerCase()} ${warn.pc}%` : ''}`, () => { removeTx(t.id); });
    go('beranda');
  },
  undo: () => { const u = ui.toast?.undo; clearTimeout(ui.tm); ui.toast = null; if (u) { u(); commit(); } },
  editTx: d => { const t = S.txs.find(x => x.id === d.id); ui.draft = { kind: t.k, digits: String(t.n), cat: t.cat, w: t.w, w2: t.w2 || 'rekber', shared: t.shared, note: t.t, date: t.d.slice(0, 10), all: true, editId: t.id }; go('tambah'); },
  askDelete: d => { ui.sheet = { s: 'confirm', title: 'Hapus transaksi?', text: 'Saldo dompet akan dikembalikan. Kamu masih bisa mengurungkan sesaat setelahnya.', ok: 'Hapus', act: 'doDelete', id: d.id }; render(true); },
  doDelete: d => { const t = removeTx(d.id); ui.sheet = null; save(); toast('Transaksi dihapus', () => { addTx(t); }); go('transaksi'); },
  share: async d => { const t = S.txs.find(x => x.id === d.id); const txt = `${t.t} ${sg(t.k, t.n)} · ${CATS[t.cat].n} · ${wName(t.w)} · ${dLong(t.d)}`; try { await navigator.clipboard.writeText(txt); toast('Ringkasan disalin'); } catch { toast(txt); } render(true); },
  sheet: d => { ui.sheet = { s: d.s, id: d.id }; render(true); setTimeout(() => $('#sheet input:not([type=radio]), #sheet select')?.focus(), 50); },
  closeSheet: () => { ui.sheet = null; render(true); },
  scrim: (d, el, e) => { if (e.target === el) A.closeSheet(); },
  radioSeg: (d, el) => { const lab = el.closest('label'); lab.querySelector('input').checked = true; el.closest('.seg').querySelectorAll('button').forEach(b => b.classList.toggle('on', b === el)); },
  payBill: d => {
    const b = S.bills.find(x => x.id === d.id), at = nowIso();
    const t = { id: uid(), t: b.n, k: 'exp', cat: b.cat, w: b.w, by: me(), n: b.a, d: at, shared: W(b.w)?.o === 'b', note: 'Dibayar dari daftar tagihan', tags: ['tagihan'], comments: [], hist: [{ by: me(), what: 'mencatat transaksi ini', at }] };
    addTx(t); b.paid = { by: me(), at: at.slice(0, 10), tx: t.id };
    const l = b.loan && S.loans.find(x => x.id === b.loan); if (l) { l.paid++; l.pokok = Math.max(0, l.pokok - b.a); }
    save(); toast(`${b.n} lunas · ${rp(b.a)} dari ${wName(b.w)}`, () => { removeTx(t.id); delete b.paid; if (l) { l.paid--; l.pokok += b.a; } }); render(true);
  },
  debtFilter: d => { ui.debtOpen = d.v === '1'; render(true); },
  remind: d => { const x = S.debts.find(y => y.id === d.id); toast(`Pengingat untuk ${x.n} dijadwalkan`); render(true); },
  tog: d => { S.notif[d.k] = !S.notif[d.k]; commit(); },
  theme: d => { S.theme = d.k; commit(); },
  switchUser: () => { S.user = other(); commit(); toast(`Sekarang mencatat sebagai ${WHO[me()]}`); render(true); },
  logout: () => { S.loggedIn = false; save(); location.hash = '#/beranda'; render(); },
  askReset: () => { ui.sheet = { s: 'confirm', title: 'Kembalikan data contoh?', text: 'Semua transaksi, dompet, dan pengaturan yang kamu ubah akan diganti dengan data contoh.', ok: 'Kembalikan', act: 'doReset' }; render(true); },
  doReset: () => { const u = S.user; S = seed(); S.user = u; S.loggedIn = true; ui.sheet = null; save(); toast('Data contoh dikembalikan'); go('beranda'); },
  exportCsv: () => download(`pyojem-${ui.rptMonth}.csv`, csv(inMonth(ui.rptMonth))),
  exportAll: () => download('pyojem-semua.csv', csv(S.txs)),
  print: () => window.print()
};
function csv(list) {
  const q = v => `"${String(v ?? '').replace(/"/g, '""')}"`;
  return ['Tanggal,Jenis,Kategori,Catatan,Dompet,Ke dompet,Dicatat oleh,Nominal'].concat([...list].sort((a, b) => a.d.localeCompare(b.d)).map(t =>
    [t.d.replace('T', ' '), KIND[t.k], CATS[t.cat]?.n, t.t, wName(t.w), t.w2 ? wName(t.w2) : '', WHO[t.by], t.k === 'exp' ? -t.n : t.n].map(q).join(','))).join('\n');
}
function download(name, text) {
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(['﻿' + text], { type: 'text/csv' })); a.download = name; a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
const SUBMIT = {
  login: () => { S.loggedIn = true; save(); location.hash = '#/beranda'; render(); },
  comment: (f, el) => { const t = S.txs.find(x => x.id === el.dataset.id); const text = f.get('text').trim(); if (!text) return; t.comments.push({ by: me(), text, at: nowIso() }); commit(); },
  budget: f => { Object.keys(CATS).filter(k => CATS[k].k === 'exp').forEach(k => { const v = parseNum(f.get(k)); if (v) S.budgets[k] = v; else delete S.budgets[k]; }); ui.sheet = null; commit(); toast('Anggaran diperbarui'); render(true); },
  wallet: f => { S.wallets.push({ id: uid(), o: f.get('o'), n: f.get('n').trim(), ic: f.get('ic'), sub: 'Dompet baru', bal: parseNum(f.get('bal')), save: f.get('ic') === 'darurat' }); ui.sheet = null; commit(); toast('Dompet ditambahkan'); render(true); },
  adjust: f => { const w = W(f.get('w')), nb = parseNum(f.get('bal')), diff = nb - w.bal; w.bal = nb; w.sub = `Disesuaikan ${dShort(today())} (${diff >= 0 ? '+' : '−'}${rp(diff)})`; ui.sheet = null; commit(); toast(`Saldo ${w.n} disesuaikan`); render(true); },
  bill: f => { const cat = f.get('cat'); S.bills.push({ id: uid(), n: f.get('n').trim(), ic: CATS[cat].ic, cat, a: parseNum(f.get('a')), due: f.get('due'), w: f.get('w') }); ui.sheet = null; commit(); toast('Tagihan ditambahkan'); render(true); },
  goal: f => { S.goals.push({ id: uid(), n: f.get('n').trim(), ic: 'target', have: 0, target: parseNum(f.get('target')), due: f.get('due'), j: 0, s: 0, log: [] }); ui.sheet = null; commit(); toast('Tujuan baru dibuat'); render(true); },
  deposit: (f, el) => {
    const g = S.goals.find(x => x.id === el.dataset.id), n = parseNum(f.get('n')); if (!n) return; const at = nowIso();
    const t = { id: uid(), t: 'Setor ' + g.n.toLowerCase(), k: 'trf', cat: 'transfer', w: f.get('w'), w2: g.wallet, to: g.n, by: me(), n, d: at, shared: true, note: '', tags: ['tujuan'], comments: [], hist: [{ by: me(), what: 'mencatat transaksi ini', at }] };
    addTx(t); if (!g.wallet) g.have += n; g[me()] += n; g.log.push({ by: me(), n, at });
    ui.sheet = null; commit(); toast(`Setor ${rp(n)} ke ${g.n}`); render(true);
  },
  debt: f => { const due = f.get('due'); S.debts.push({ id: uid(), kind: f.get('kind'), n: f.get('n').trim(), sub: f.get('sub').trim(), by: me(), total: parseNum(f.get('total')), sisa: parseNum(f.get('total')), due: due ? 'Jatuh tempo ' + dShort(due) : '', remind: '' }); ui.sheet = null; commit(); toast('Catatan utang disimpan'); render(true); },
  debtPay: (f, el) => { const d = S.debts.find(x => x.id === el.dataset.id), n = Math.min(d.sisa, parseNum(f.get('n'))); d.sisa -= n; if (!d.sisa) d.due = 'Dilunasi ' + dShort(today()) + ' ' + today().slice(0, 4); ui.sheet = null; commit(); toast(d.sisa ? `Tercatat ${rp(n)}, sisa ${rp(d.sisa)}` : `${d.n} lunas`); render(true); }
};

document.addEventListener('click', e => {
  const el = e.target.closest('[data-act]'); if (!el) return;
  const fn = A[el.dataset.act]; if (!fn) return;
  if (el.tagName === 'BUTTON') e.preventDefault();
  fn(el.dataset, el, e);
});
document.addEventListener('submit', e => {
  const el = e.target.closest('[data-submit]'); if (!el) return;
  e.preventDefault(); SUBMIT[el.dataset.submit]?.(new FormData(el), el);
});
document.addEventListener('input', e => {
  const k = e.target.dataset.input; if (!k) return;
  if (k === 'q') { ui.f.q = e.target.value; $('#txlist').innerHTML = txListHtml(); $('#txsums').innerHTML = txSums(); }
  if (k === 'note' && ui.draft) ui.draft.note = e.target.value;
});
document.addEventListener('change', e => {
  const k = e.target.dataset.change; if (!k) return;
  const v = e.target.value;
  if (k === 'fw') ui.f.w = v; else if (k === 'fc') ui.f.cat = v;
  else if (k === 'dw') ui.draft.w = v; else if (k === 'dw2') ui.draft.w2 = v; else if (k === 'ddate') ui.draft.date = v || today();
  if (k === 'dw' && ui.draft) ui.draft.shared = W(v)?.o === 'b';
  render(true);
});
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && ui.sheet) A.closeSheet();
  if (ui.route === 'tambah' && ui.draft && !/INPUT|SELECT|TEXTAREA/.test(document.activeElement?.tagName)) {
    if (/^\d$/.test(e.key)) A.key({ k: e.key }); else if (e.key === 'Backspace') A.key({ k: '⌫' }); else if (e.key === 'Enter') A.saveTx();
  }
});

ui.route = location.hash.replace(/^#\/?/, '') || 'beranda';
if (ui.route.startsWith('tambah')) ui.draft = newDraft();
render();
