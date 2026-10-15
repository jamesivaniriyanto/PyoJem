/* Pyojem Keuangan — aplikasi keuangan rumah tangga berdua.
   Layar dan interaksi. Penyimpanan ada di data.js (lokal atau Supabase). */
'use strict';

/* ---------- utilitas ---------- */
const $ = (s, r = document) => r.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const ic = (k, st = '') => `<svg class="ic" viewBox="0 0 24 24" aria-hidden="true"${st ? ` style="${st}"` : ''}><path d="${I[k] || I.lainnya}"></path></svg>`;
const rp = n => 'Rp' + Math.round(Math.abs(n)).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
const jt = n => (n < 0 ? '−' : '') + 'Rp' + (Math.abs(n) / 1e6).toLocaleString('id-ID', { maximumFractionDigits: 2 }) + ' jt';
const sg = (k, n) => (k === 'inc' ? '+' : k === 'exp' ? '−' : '') + rp(n);
const pct = (a, b) => b ? Math.round(a / b * 100) : 0;
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
const hm = s => s.slice(11, 16).replace(':', '.');
const dayLabel = s => {
  const d = new Date(s + 'T00:00'), diff = daysBetween(s, today());
  const base = `${HARI[d.getDay()]}, ${d.getDate()} ${BLN[d.getMonth()]}`;
  return diff === 0 ? 'Hari ini, ' + base : diff === 1 ? 'Kemarin, ' + base : base;
};
const timeLabel = s => {
  const diff = daysBetween(s.slice(0, 10), today());
  if (diff === 0) return hm(s);
  if (diff === 1) return 'Kemarin';
  return dShort(s);
};
const parseNum = v => parseInt(String(v || '').replace(/[^\d]/g, ''), 10) || 0;

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
/* histori bulan sebelum aplikasi dipakai (dari desain) */
const HIST = { '2026-05': [23.8e6, 18.9e6], '2026-06': [24.1e6, 21.4e6], '2026-07': [26.3e6, 19.7e6], '2026-08': [24.9e6, 22.8e6], '2026-09': [25.2e6, 20.1e6] };
const NW_HIST = [['2026-05', 178.6e6], ['2026-06', 184.2e6], ['2026-07', 190.9e6], ['2026-08', 196.4e6], ['2026-09', 203.1e6]];

/* ---------- state ---------- */
let S = null;
const ui = {
  phase: 'boot', route: '', prevRoute: '', sheet: null, toast: null, newId: null, draft: null, pending: false, err: '',
  authMode: 'masuk', authMsg: '', month: mkey(today()), rptMonth: mkey(today()),
  f: { q: '', kind: 'all', by: 'all', w: 'all', cat: 'all' }
};
const THEME_KEY = 'pyojem-keuangan:tema';
const getTheme = () => { try { return localStorage.getItem(THEME_KEY) || 'auto'; } catch { return 'auto'; } };
const setTheme = v => { try { localStorage.setItem(THEME_KEY, v); } catch { /* mode privat */ } };
function applyNames() { WHO.j = S.names.j; WHO.s = S.names.s; }
function initMonth() {
  ui.month = ui.rptMonth = mkey(today());
  if (!TX().some(t => mkey(t.d) === ui.month)) { const last = TX().map(t => mkey(t.d)).sort().pop(); if (last) ui.month = ui.rptMonth = last; }
}

/* ---------- selektor ---------- */
const TX = () => S.txs.filter(t => !t.del);
const W = id => S.wallets.find(w => w.id === id);
const wName = id => W(id)?.n || 'Dompet terhapus';
const me = () => S.user;
const other = () => (S.user === 'j' ? 's' : 'j');
const inMonth = (k = ui.month) => TX().filter(t => mkey(t.d) === k);
const sumK = (list, k) => list.filter(t => t.k === k).reduce((a, t) => a + t.n, 0);
const totalBal = o => S.wallets.filter(w => !o || w.o === o).reduce((a, w) => a + (w.bal || 0), 0);
const myWallet = () => S.wallets.find(w => w.o === me()) || S.wallets[0];
const sharedWallet = () => S.wallets.find(w => w.o === 'b') || S.wallets[0];
const deposits = g => TX().filter(t => t.goal === g.id);
const goalHave = g => (g.wallet && W(g.wallet) ? W(g.wallet).bal : g.have + deposits(g).reduce((a, t) => a + t.n, 0));
const goalBy = (g, o) => (g[o] || 0) + deposits(g).filter(t => t.by === o).reduce((a, t) => a + t.n, 0);
function budgetRows(k = ui.month) {
  const list = inMonth(k).filter(t => t.k === 'exp');
  return Object.entries(S.budgets).map(([cat, lim]) => {
    const used = list.filter(t => t.cat === cat).reduce((a, t) => a + t.n, 0);
    const p = lim ? used / lim : 0, st = p > 1 ? 'over' : p >= 0.8 ? 'warn' : 'ok';
    return { cat, c: CATS[cat] || { n: esc(cat), s: esc(cat), ic: 'lainnya' }, used, lim, p, st, pc: Math.round(p * 100), label: (st === 'over' ? 'Terlampaui ' : st === 'warn' ? 'Hampir habis ' : 'Aman ') + Math.round(p * 100) + '%' };
  }).sort((a, b) => b.p - a.p);
}
function daysLeftInMonth(k) {
  const [y, m] = k.split('-').map(Number), last = new Date(y, m, 0).getDate();
  if (k !== mkey(today())) return k < mkey(today()) ? 0 : last;
  return last - new Date().getDate();
}

/* ---------- perubahan transaksi ---------- */
function newTx(fields) {
  const at = nowIso();
  const t = { id: uid(), note: '', tags: [], comments: [], del: null, shared: false, ...fields, hist: [{ id: uid(), by: me(), what: 'mencatat transaksi ini', at }] };
  S.txs.push(t); P.put('tx', t); P.put('hist', t.hist[0], t.id);
  if (t.k !== 'trf') notifyPartner(t.id);
  return t;
}
function addHist(t, what) { const h = { id: uid(), by: me(), what, at: nowIso() }; t.hist.unshift(h); P.put('hist', h, t.id); }
function purgeTx(id) { if (!S.txs.some(t => t.id === id)) return; S.txs = S.txs.filter(t => t.id !== id); P.del('tx', id); }
function trashTx(id) { const t = S.txs.find(x => x.id === id); if (!t || t.del) return; t.del = { by: me(), at: nowIso() }; P.put('tx', t); addHist(t, 'memindahkan transaksi ini ke sampah'); }
function restoreTx(id) { const t = S.txs.find(x => x.id === id); if (!t || !t.del) return; t.del = null; P.put('tx', t); addHist(t, 'mengembalikan transaksi dari sampah'); }

/* ---------- komponen ---------- */
const av = (o, size) => `<span class="av ${o}" title="${esc(WHO[o])}"${size ? ` style="width:${size}px;height:${size}px"` : ''}>${esc(WHO[o][0])}</span>`;
const catIc = (k, icn, st = '') => `<div class="cat ${k}"${st ? ` style="${st}"` : ''}>${ic(icn)}</div>`;
function txRow(t, withTime) {
  const c = CATS[t.cat] || CATS.transfer;
  const sub = t.k === 'trf' ? `${wName(t.w)} ke ${t.w2 ? wName(t.w2) : (t.to || 'tujuan')}` : `${c.n} · ${wName(t.w)}`;
  return `<a class="tx${t.id === ui.newId ? ' new' : ''}" href="#/detail/${t.id}">
    <div class="catw">${catIc(t.k, c.ic)}${av(t.by)}</div>
    <div class="grow"><div class="b ellip" style="font-size:14px">${esc(t.t)}</div><div class="c ellip">${esc(sub)}</div></div>
    <div class="meta"><span class="num ${t.k}" style="font-size:15px">${sg(t.k, t.n)}</span>${withTime ? `<span class="c">${timeLabel(t.d)}</span>` : ''}</div>
  </a>`;
}
const topBar = (title, opts = {}) => `<header class="top">
  ${opts.back ? `<a class="ib" href="${opts.back}" data-back aria-label="Kembali">${ic('left')}</a>` : ''}
  <h1 class="${opts.center ? 'center' : ''}">${title}</h1>${opts.right || ''}</header>`;
const empty = (title, sub, extra = '') => `<div class="empty"><img class="mascot" src="assets/maskot.png" alt=""><div class="h2">${title}</div><div class="s">${sub}</div>${extra}</div>`;
const monthNav = (act, k) => `<div class="row" style="gap:4px;justify-content:space-between;padding:0 12px">
  <button class="ib" data-act="${act}" data-n="-1" aria-label="Bulan sebelumnya">${ic('left')}</button><b class="disp" style="font-size:16px">${monthName(k)}</b>
  <button class="ib" data-act="${act}" data-n="1" aria-label="Bulan berikutnya">${ic('right')}</button></div>`;

/* ---------- layar sebelum masuk ---------- */
const V = {};
const brandHead = (title, sub) => `<div class="art"><img class="mascot" src="assets/maskot.png" alt="Maskot Pyojem, kelinci dan beruang"></div>
  <div style="text-align:center">
    <div class="c" style="font-weight:800;color:var(--hot);letter-spacing:.04em">PYOJEM KEUANGAN</div>
    <h1 class="h1" style="font-size:28px;line-height:36px">${title}</h1>
    <p class="s" style="margin:6px 0 0">${sub}</p>
  </div>`;
V.loading = () => `<div class="login" style="text-align:center">${brandHead('Sebentar ya', 'Memuat data rumah tangga…')}</div>`;
V.error = () => `<div class="login">${brandHead('Ada kendala', esc(ui.err || 'Terjadi kesalahan.'))}
  <button class="btn p" data-act="retry">Coba lagi</button>${CLOUD && session ? '<button class="btn s" data-act="logout">Keluar</button>' : ''}</div>`;

/* Tombol pasang aplikasi di layar masuk, selama aplikasi belum dipasang. */
const VERSI = '1.8';
let installEvt = null;
const canInstall = () => !isStandalone();
const installHelpHtml = () => (ui.installHelp && !installEvt ? `<div class="card cardpad" role="status"><div class="c">${isIos()
  ? 'Di Safari, ketuk tombol <b>Bagikan</b> (kotak dengan panah ke atas), lalu pilih <b>Tambah ke Layar Utama</b>.'
  : 'Buka menu browser (titik tiga di pojok kanan atas), lalu pilih <b>Instal aplikasi</b> atau <b>Tambahkan ke layar utama</b>.'} Setelah itu buka Pyojem dari ikon di layar utama.</div></div>` : '');
const installBox = () => {
  if (!canInstall()) return '';
  return `<button type="button" class="btn s" data-act="install">${ic('download')}Pasang aplikasi di HP</button>${installHelpHtml()}`;
};
const refreshInstall = () => {
  document.querySelectorAll('.pasang').forEach(el => { el.innerHTML = installBox(); });
};
window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); installEvt = e; refreshInstall(); });
window.addEventListener('appinstalled', () => { installEvt = null; ui.installHelp = false; refreshInstall(); });

V.login = () => {
  if (!CLOUD) return `<div class="login">${brandHead('Halo lagi, yuk masuk', 'Catat bersama, rencanakan bersama. Satu rumah tangga, dua HP.')}
  <form data-submit="loginLocal" style="display:flex;flex-direction:column;gap:14px">
    <div><span class="lab">Masuk sebagai</span>
      <div class="seg" role="radiogroup" aria-label="Masuk sebagai">
        ${['j', 's'].map(o => `<button type="button" role="radio" aria-checked="${S.user === o}" class="${S.user === o ? 'on' : ''}" data-act="pickUser" data-o="${o}">${av(o, 22)}${esc(WHO[o])}</button>`).join('')}
      </div></div>
    <button type="submit" class="btn p">Masuk</button>
  </form>
  <div class="pasang" style="display:flex;flex-direction:column;gap:10px">${installBox()}</div>
  <div class="c" style="text-align:center;opacity:.7">Versi ${VERSI}</div>
  <div class="c" style="text-align:center">Mode lokal: data hanya tersimpan di browser ini. Isi <b>config.js</b> dengan project Supabase agar bisa dipakai berdua.</div>
</div>`;
  const daftar = ui.authMode === 'daftar';
  return `<div class="login">${brandHead(daftar ? 'Buat akun baru' : 'Halo lagi, yuk masuk', 'Catat bersama, rencanakan bersama. Satu rumah tangga, dua HP.')}
  <div class="seg" role="tablist" aria-label="Masuk atau daftar">
    <button type="button" role="tab" aria-selected="${!daftar}" class="${daftar ? '' : 'on'}" data-act="authMode" data-m="masuk">Masuk</button>
    <button type="button" role="tab" aria-selected="${daftar}" class="${daftar ? 'on' : ''}" data-act="authMode" data-m="daftar">Daftar</button>
  </div>
  <form data-submit="auth" style="display:flex;flex-direction:column;gap:14px">
    <div><label class="lab" for="email">Email</label>
      <div class="field">${ic('mail')}<input id="email" name="email" type="email" autocomplete="email" required></div></div>
    <div><label class="lab" for="sandi">Kata sandi${daftar ? ' (minimal 8 karakter)' : ''}</label>
      <div class="field">${ic('lock')}<input id="sandi" name="sandi" type="password" minlength="${daftar ? 8 : 1}" autocomplete="${daftar ? 'new-password' : 'current-password'}" required>
      <button type="button" class="ib" aria-label="Tampilkan kata sandi" data-act="peek">${ic('eye')}</button></div></div>
    <div id="msg" class="s" role="status" style="color:var(--exp);font-weight:700">${esc(ui.authMsg)}</div>
    <button type="submit" class="btn p">${daftar ? 'Daftar' : 'Masuk'}</button>
  </form>
  <div class="pasang" style="display:flex;flex-direction:column;gap:10px">${installBox()}</div>
  <div class="c" style="text-align:center;opacity:.7">Versi ${VERSI}</div>
  <div class="c" style="text-align:center;display:flex;gap:6px;justify-content:center;align-items:center">${ic('lock', 'width:14px;height:14px')}Data rumah tangga hanya terlihat oleh kalian berdua</div>
</div>`;
};

V.onboard = () => `<div class="login" style="justify-content:flex-start;gap:16px">
  ${brandHead('Satu langkah lagi', 'Pasanganmu sudah memakai Pyojem? Gabung dengan kode undangannya. Kalau belum, buat rumah tangga baru.')}
  <form class="card cardpad" data-submit="joinHh">
    <h2 class="h2">Gabung dengan kode undangan</h2>
    <div class="c">Kode ada di HP pasanganmu: Lainnya › Pengaturan › Undangan.</div>
    <div><label class="lab" for="kode">Kode dari pasanganmu</label><div class="field"><input id="kode" name="kode" placeholder="7F3A9C21" autocomplete="off" style="text-transform:uppercase;letter-spacing:.1em" required></div></div>
    <button class="btn p" type="submit">Gabung</button>
  </form>
  <form class="card cardpad" data-submit="createHh">
    <h2 class="h2">Buat rumah tangga baru</h2>
    <div class="c">Hanya untuk orang pertama. Pasangan cukup gabung dengan kode, jangan membuat lagi.</div>
    <div><label class="lab" for="hh">Nama rumah tangga</label><div class="field"><input id="hh" name="nama" value="Rumah tangga James dan Sabrina" maxlength="80" required></div></div>
    <div class="grid2">
      <div><label class="lab" for="nj">Nama beruang</label><div class="field"><input id="nj" name="nama_j" value="James" maxlength="40" required></div></div>
      <div><label class="lab" for="ns">Nama kelinci</label><div class="field"><input id="ns" name="nama_s" value="Sabrina" maxlength="40" required></div></div>
    </div>
    <div><span class="lab">Kamu yang mana?</span><div class="seg">${['j', 's'].map((o, i) => `<label style="display:contents"><input type="radio" name="kode" value="${o}" class="sr"${i === 0 ? ' checked' : ''}><button type="button" class="${i === 0 ? 'on' : ''}" data-act="radioSeg">${av(o, 22)}${o === 'j' ? 'Beruang' : 'Kelinci'}</button></label>`).join('')}</div></div>
    <label class="row s" style="gap:10px;cursor:pointer"><input type="checkbox" name="contoh" value="1" style="width:20px;height:20px">Isi dengan data contoh Oktober 2026 untuk mencoba</label>
    <button class="btn s" type="submit">${ic('plus')}Buat rumah tangga</button>
  </form>
  <div id="msg" class="s" role="status" style="color:var(--exp);font-weight:700;text-align:center"></div>
  <button class="lnk" style="align-self:center" data-act="logout">Keluar dari ${esc(session?.user?.email || 'akun ini')}</button>
</div>`;

/* ---------- layar utama ---------- */
V.beranda = () => {
  const m = ui.month, list = inMonth(m), inc = sumK(list, 'inc'), exp = sumK(list, 'exp');
  const rows = budgetRows(m), lim = rows.reduce((a, r) => a + r.lim, 0), used = rows.reduce((a, r) => a + r.used, 0);
  const left = daysLeftInMonth(m), perDay = left ? Math.max(0, Math.round((lim - used) / left / 1000) * 1000) : 0;
  const bill = S.bills.filter(b => !b.paid).sort((a, b) => a.due.localeCompare(b.due))[0];
  const recent = [...TX()].sort((a, b) => b.d.localeCompare(a.d)).slice(0, 6);
  const h = new Date().getHours(), greet = h < 11 ? 'pagi' : h < 15 ? 'siang' : h < 18 ? 'sore' : 'malam';
  const d = new Date();
  return `<div class="screen wide">
  <header class="top" style="gap:12px">
    <div class="avs">${av('j', 40)}${av('s', 40)}</div>
    <div class="grow"><div class="h2">Selamat ${greet}, ${esc(WHO[me()])}</div><div class="c">${HARI[d.getDay()]}, ${d.getDate()} ${BULAN[d.getMonth()]} ${d.getFullYear()} · ${esc(S.hhName)}</div></div>
    <a class="ib" href="#/tagihan" aria-label="Tagihan">${ic('bell')}${bill ? '<span style="position:absolute;top:10px;right:11px;width:8px;height:8px;border-radius:50%;background:var(--exp);box-shadow:0 0 0 2px var(--bg)"></span>' : ''}</a>
  </header>
  <main class="pad">
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,340px),1fr));gap:16px;align-items:start">
    <div style="display:flex;flex-direction:column;gap:16px">
    <section class="hero">
      <div class="sec"><span class="lbl">Saldo semua dompet</span><a class="lnk" href="#/dompet">Dompet${ic('right', 'width:16px;height:16px')}</a></div>
      <div class="big" style="margin-top:-12px">${totalBal() < 0 ? '−' : ''}${rp(totalBal())}</div>
      <div class="tiles">
        <div><div class="t">Bersama</div><div class="v">${jt(totalBal('b'))}</div></div>
        <div><div class="t"><span style="width:8px;height:8px;border-radius:50%;background:var(--hus)"></span>${esc(WHO.j)}</div><div class="v">${jt(totalBal('j'))}</div></div>
        <div><div class="t"><span style="width:8px;height:8px;border-radius:50%;background:var(--wif)"></span>${esc(WHO.s)}</div><div class="v">${jt(totalBal('s'))}</div></div>
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
      ${catIc('warn', 'bill')}<div class="grow"><div class="b" style="font-size:14px">${esc(bill.n)}</div><div class="c">Jatuh tempo ${dShort(bill.due)} · ${esc(wName(bill.w))}</div></div>
      <div style="display:flex;flex-direction:column;align-items:flex-end;gap:4px"><span class="num" style="font-size:14px">${rp(bill.a)}</span><span class="badge ${dd < 0 ? 'over' : 'warn'}">${dd < 0 ? `Terlambat ${-dd} hari` : dd === 0 ? 'Hari ini' : `${dd} hari lagi`}</span></div></a>`; })() : ''}
    </div>
    <div style="display:flex;flex-direction:column;gap:16px">
    ${rows.length ? `<section class="card cardpad" style="gap:14px">
      <div class="sec"><h2 class="h2">Anggaran</h2><a class="lnk" href="#/anggaran">Semua${ic('right', 'width:16px;height:16px')}</a></div>
      <div style="display:flex;flex-direction:column;gap:6px">
        <div class="sec s"><span>Terpakai <b style="color:var(--ink)">${rp(used)}</b> dari ${rp(lim)}</span><b style="color:var(--ink)">${pct(used, lim)}%</b></div>
        <div class="bar" style="height:10px"><i class="pri" style="width:${Math.min(100, pct(used, lim))}%"></i></div>
        <div class="c">${left} hari lagi · aman dipakai ${rp(perDay)} per hari</div>
      </div>
      ${rows.slice(0, 3).map(r => `<div class="row">${catIc('exp', r.c.ic, 'width:36px;height:36px')}
        <div class="grow" style="display:flex;flex-direction:column;gap:6px"><div class="sec"><span class="b" style="font-size:14px">${r.c.n}</span><span class="badge ${r.st}">${r.label}</span></div>
        <div class="bar"><i class="${r.st}" style="width:${Math.min(100, r.pc)}%"></i></div><div class="c">${rp(r.used)} dari ${rp(r.lim)}</div></div></div>`).join('')}
    </section>` : ''}
    <section class="card" style="padding:8px 0">
      <div class="sec" style="padding:0 16px"><h2 class="h2">Transaksi terakhir</h2><a class="lnk" href="#/transaksi">Semua${ic('right', 'width:16px;height:16px')}</a></div>
      <div>${recent.length ? recent.map(t => txRow(t, true)).join('') : empty('Belum ada transaksi', 'Tekan tombol + untuk mencatat yang pertama.')}</div>
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
  const trash = S.txs.filter(t => t.del).length;
  return `<div class="screen">${topBar('Transaksi', { right: `<a class="ib" href="#/sampah" aria-label="Sampah, ${trash} transaksi">${ic('trash')}${trash ? `<span style="position:absolute;top:4px;right:2px;min-width:18px;height:18px;border-radius:9px;background:var(--exp);color:#fff;font-size:10px;font-weight:800;display:flex;align-items:center;justify-content:center">${trash}</span>` : ''}</a>` })}
  <div class="pad" style="gap:12px;padding-bottom:0">
    <label class="search">${ic('search')}<input type="search" placeholder="Cari catatan, tag, nominal" aria-label="Cari transaksi" value="${esc(f.q)}" data-input="q"></label>
  </div>
  ${monthNav('month', ui.month)}
  <div class="pad" style="gap:12px;padding-bottom:0;padding-top:0">
    <div class="hscroll">
      ${[['all', 'Semua'], ['inc', 'Masuk'], ['exp', 'Keluar'], ['trf', 'Transfer']].map(([k, l]) => `<button class="chip${f.kind === k ? ' on' : ''}" data-act="fkind" data-k="${k}">${l}</button>`).join('')}
      ${[['all', 'Berdua'], ['j', WHO.j], ['s', WHO.s]].map(([k, l]) => `<button class="chip${f.by === k ? ' on' : ''}" data-act="fby" data-k="${k}">${k === 'all' ? av('j', 18) + `<span style="margin-left:-12px">${av('s', 18)}</span>` : av(k, 18)}${esc(l)}</button>`).join('')}
      <label class="sr" for="fw">Dompet</label><select id="fw" class="chip" data-change="fw">${opt('all', 'Semua dompet', f.w)}${S.wallets.map(w => opt(w.id, esc(w.n), f.w)).join('')}</select>
      <label class="sr" for="fc">Kategori</label><select id="fc" class="chip" data-change="fc">${opt('all', 'Semua kategori', f.cat)}${Object.entries(CATS).map(([k, c]) => opt(k, c.n, f.cat)).join('')}</select>
    </div>
    <div class="grid2" id="txsums">${txSums()}</div>
  </div>
  <main id="txlist">${txListHtml()}</main></div>`;
};

V.sampah = () => {
  const list = S.txs.filter(t => t.del).sort((a, b) => b.del.at.localeCompare(a.del.at));
  return `<div class="screen">${topBar('Sampah', { back: '#/transaksi', right: list.length ? `<button class="btn s sm" style="width:auto" data-act="askEmptyTrash">Kosongkan</button>` : '' })}
  <main class="pad">
    <div class="c">Transaksi di sampah tidak dihitung di saldo, anggaran, dan laporan. Kembalikan kalau terhapus tidak sengaja.</div>
    ${list.length ? `<section class="card" style="overflow:hidden">${list.map(t => `<div style="border-top:1px solid var(--line)">${txRow(t)}
      <div style="padding:0 16px 12px;display:flex;flex-direction:column;gap:8px"><span class="c">Dihapus ${esc(WHO[t.del.by])}, ${dShort(t.del.at)} ${hm(t.del.at)}</span>
        <div class="grid2"><button class="btn s sm" data-act="restore" data-id="${t.id}">Kembalikan</button>
        <button class="btn d sm" data-act="askPurge" data-id="${t.id}">Hapus permanen</button></div></div></div>`).join('')}</section>`
      : empty('Sampah kosong', 'Tidak ada transaksi yang dihapus.')}
  </main></div>`;
};

/* ---- Tambah transaksi ---- */
function catOrder(kind) {
  const used = {}; TX().forEach(t => { if (t.k === kind) used[t.cat] = (used[t.cat] || 0) + 1; });
  return Object.keys(CATS).filter(k => CATS[k].k === kind).sort((a, b) => (used[b] || 0) - (used[a] || 0));
}
function newDraft(kind = 'exp') {
  const w = myWallet()?.id || '';
  const w2 = (sharedWallet() && sharedWallet().id !== w ? sharedWallet().id : S.wallets.find(x => x.id !== w)?.id) || w;
  return { kind, digits: '', cat: kind === 'inc' ? (catOrder('inc')[0] || 'gaji') : kind === 'trf' ? 'transfer' : (catOrder('exp')[0] || 'dapur'), w, w2, shared: W(w)?.o === 'b', note: '', date: today(), all: false, editId: null };
}
/* Favorit: pengeluaran yang paling sering dan paling baru dicatat. */
function favs() {
  const m = {};
  TX().filter(t => t.k === 'exp' && W(t.w)).forEach(t => {
    const key = t.t + '|' + t.n + '|' + t.cat, f = m[key] ||= { n: t.t, cat: t.cat, a: t.n, w: t.w, shared: t.shared, c: 0, last: '' };
    f.c++; if (t.d > f.last) { f.last = t.d; f.w = t.w; f.shared = t.shared; }
  });
  return Object.values(m).sort((a, b) => b.c - a.c || b.last.localeCompare(a.last)).slice(0, 5);
}
V.tambah = () => {
  if (!S.wallets.length) return `<div class="screen">${topBar('Tambah transaksi', { back: '#/beranda', center: true, right: '<span style="width:44px"></span>' })}
    ${empty('Belum ada dompet', 'Tambahkan dompet dulu, misalnya rekening atau uang tunai.', `<button class="btn p" style="max-width:280px" data-act="sheet" data-s="wallet">${ic('plus')}Tambah dompet</button>`)}</div>`;
  const d = ui.draft ||= newDraft();
  const amount = parseInt(d.digits || '0', 10), k = d.kind;
  let cats = catOrder(k); const many = k === 'exp' && cats.length > 8 && !d.all;
  if (many) { cats = cats.slice(0, 7); if (!cats.includes(d.cat)) cats[6] = d.cat; }
  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '000', '0', '⌫'];
  const wOpts = sel => S.wallets.map(w => `<option value="${w.id}"${w.id === sel ? ' selected' : ''}>${esc(w.n)}</option>`).join('');
  const F = k === 'exp' && !d.editId ? favs() : [];
  return `<div class="screen" style="padding-bottom:24px">
  ${topBar(d.editId ? 'Ubah transaksi' : 'Tambah transaksi', { center: true, back: d.editId ? `#/detail/${d.editId}` : '#/beranda', right: '<span style="width:44px"></span>' })}
  <div class="pad" style="gap:12px">
    <div class="seg" role="tablist" aria-label="Jenis transaksi">
      ${['inc', 'exp', 'trf'].map(x => `<button type="button" role="tab" aria-selected="${k === x}" class="${k === x ? 'on ' + x : ''}" data-act="dkind" data-k="${x}">${ic(x === 'inc' ? 'in' : x === 'exp' ? 'out' : 'transfer')}${KIND[x]}</button>`).join('')}
    </div>
    <div style="text-align:center;display:flex;flex-direction:column;gap:2px;padding:4px 0">
      <div class="c">Nominal ${KIND[k].toLowerCase()}</div>
      <div class="amt ${k}" aria-live="polite">${amount ? sg(k, amount) : 'Rp0'}</div>
      <div class="c">${esc(k === 'trf' ? `${wName(d.w)} ke ${wName(d.w2)}` : `${CATS[d.cat].n} · ${wName(d.w)} · ${d.shared ? 'Bersama' : 'Pribadi'}`)}</div>
    </div>
    ${F.length ? `<div style="display:flex;flex-direction:column;gap:6px"><div class="c" style="font-weight:800">Sering dicatat, sekali tap</div>
      <div class="hscroll">${F.map((f, i) => `<button type="button" class="chip fav" data-act="fav" data-i="${i}"><span class="ellip" style="max-width:140px">${esc(f.n)}</span> <b>${rp(f.a)}</b></button>`).join('')}</div></div>` : ''}
    ${k !== 'trf' ? `<div class="cats" role="group" aria-label="Kategori">
      ${cats.map(c => `<button type="button" class="tile${d.cat === c ? ' on' : ''}" aria-pressed="${d.cat === c}" data-act="dcat" data-c="${c}"><span class="i cat ${k}" style="width:32px;height:32px">${ic(CATS[c].ic)}</span>${CATS[c].s}</button>`).join('')}
      ${many ? `<button type="button" class="tile" data-act="dall"><span class="i cat pri" style="width:32px;height:32px">${ic('lainnya')}</span>Semua</button>` : ''}
    </div>` : `<div class="grid2">
      <div><label class="lab" for="dw">Dari</label><div class="field"><select id="dw" data-change="dw">${wOpts(d.w)}</select></div></div>
      <div><label class="lab" for="dw2">Ke</label><div class="field"><select id="dw2" data-change="dw2">${wOpts(d.w2)}</select></div></div></div>`}
    <div class="hscroll">
      ${k !== 'trf' ? `<label class="sr" for="dwal">Dompet</label><select id="dwal" class="chip" data-change="dw">${wOpts(d.w)}</select>
      <div class="mini" role="radiogroup" aria-label="Untuk siapa">
        <button type="button" role="radio" aria-checked="${!d.shared}" class="${d.shared ? '' : 'on'}" data-act="dshared" data-v="0">Pribadi</button>
        <button type="button" role="radio" aria-checked="${d.shared}" class="${d.shared ? 'on' : ''}" data-act="dshared" data-v="1">Bersama</button></div>` : ''}
      <label class="chip" style="cursor:pointer">${ic('cal')}<input type="date" value="${d.date}" data-change="ddate" aria-label="Tanggal" style="border:0;background:transparent;font:inherit;color:inherit;font-weight:700;width:128px"></label>
    </div>
    <div class="field"><label for="catatan" class="sr">Catatan</label>
      <input id="catatan" type="text" maxlength="200" placeholder="Catatan, misalnya Pertamax motor" value="${esc(d.note)}" data-input="note">
      ${ic('tag', 'color:var(--ink3);margin-right:10px')}</div>
    <div class="keys">${keys.map(t => `<button type="button" class="key${t === '000' || t === '⌫' ? ' fn' : ''}" data-act="key" data-k="${t}" aria-label="${t === '⌫' ? 'Hapus satu angka' : t}">${t}</button>`).join('')}</div>
    <button type="button" class="btn p" data-act="saveTx" ${amount && !(k === 'trf' && d.w === d.w2) ? '' : 'disabled'}>${ic('check')}${d.editId ? 'Simpan perubahan' : 'Simpan'}</button>
  </div></div>`;
};

V.detail = (id) => {
  const t = S.txs.find(x => x.id === id);
  if (!t) return `<div class="screen">${topBar('Detail transaksi', { back: '#/transaksi' })}${empty('Transaksi tidak ditemukan', 'Mungkin sudah dihapus permanen.')}</div>`;
  const c = CATS[t.cat] || CATS.transfer;
  return `<div class="screen">${topBar('Detail transaksi', { back: t.del ? '#/sampah' : '#/transaksi', center: true, right: `<button class="ib" data-act="share" data-id="${t.id}" aria-label="Salin ringkasan">${ic('copy')}</button>` })}
  <main class="pad">
    ${t.del ? `<section class="card cardpad" style="background:var(--expS)"><div class="row">${ic('trash')}<div class="grow b" style="font-size:14px">Ada di sampah · dihapus ${esc(WHO[t.del.by])}, ${dShort(t.del.at)} ${hm(t.del.at)}</div></div>
      <div class="grid2"><button class="btn s sm" data-act="restore" data-id="${t.id}">Kembalikan</button><button class="btn d sm" data-act="askPurge" data-id="${t.id}">Hapus permanen</button></div></section>` : ''}
    <section class="card cardpad" style="align-items:center;text-align:center">
      ${catIc(t.k, c.ic, 'width:56px;height:56px;border-radius:18px')}
      <div class="b" style="font-size:17px">${esc(t.t)}</div>
      <div class="num ${t.k}" style="font-size:32px;line-height:40px;text-align:center">${sg(t.k, t.n)}</div>
      <div class="row" style="gap:6px;justify-content:center"><span class="badge ${t.k}">${KIND[t.k]}</span><span class="badge mut">${t.shared ? 'Bersama' : 'Pribadi'}</span></div>
    </section>
    <dl class="card" style="margin:0">
      ${t.k === 'trf' ? `<div class="kv"><dt>Dari</dt><dd>${esc(wName(t.w))}</dd></div><div class="kv"><dt>Ke</dt><dd>${esc(t.w2 ? wName(t.w2) : (t.to || '-'))}</dd></div>` : `<div class="kv"><dt>Kategori</dt><dd>${c.n}</dd></div><div class="kv"><dt>Dompet</dt><dd>${esc(wName(t.w))}</dd></div>`}
      <div class="kv"><dt>Tanggal</dt><dd>${dLong(t.d)}</dd></div>
      <div class="kv"><dt>Dicatat oleh</dt><dd>${av(t.by)}${esc(WHO[t.by])}</dd></div>
      ${t.tags?.length ? `<div class="kv"><dt>Tag</dt><dd>${t.tags.map(x => `<span class="tag">#${esc(x)}</span>`).join('')}</dd></div>` : ''}
      ${t.note ? `<div class="kv"><dt>Catatan</dt><dd style="font-weight:600">${esc(t.note)}</dd></div>` : ''}
    </dl>
    <section class="card cardpad">
      <div class="row" style="gap:8px">${ic('chat')}<h2 class="h2 grow">Komentar</h2><span class="c">${t.comments.length}</span></div>
      ${t.comments.map(m => `<div class="row" style="align-items:flex-start">${av(m.by, 28)}<div class="grow"><div class="bub">${esc(m.text)}</div><div class="c" style="margin-top:4px">${esc(WHO[m.by])} · ${dShort(m.at)}, ${hm(m.at)}</div></div></div>`).join('')}
      <form class="field" data-submit="comment" data-id="${t.id}"><label for="komen" class="sr">Tulis komentar</label>
        <input id="komen" name="text" type="text" maxlength="1000" placeholder="Tulis komentar untuk ${esc(WHO[other()])}" autocomplete="off" required>
        <button type="submit" class="ib" aria-label="Kirim komentar">${ic('send')}</button></form>
    </section>
    <section class="card cardpad">
      <div class="row" style="gap:8px">${ic('clock')}<h2 class="h2">Riwayat perubahan</h2></div>
      <ol style="list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:12px">
        ${t.hist.map(h => `<li class="row" style="align-items:flex-start">${av(h.by, 24)}<div><div style="font-size:14px"><b>${esc(WHO[h.by])}</b> ${esc(h.what)}</div><div class="c">${dShort(h.at)} ${h.at.slice(0, 4)}, ${hm(h.at)}</div></div></li>`).join('')}
      </ol>
    </section>
    ${t.del ? '' : `<div class="grid2">
      <button type="button" class="btn d" data-act="askDelete" data-id="${t.id}">${ic('trash')}Hapus</button>
      <button type="button" class="btn p" data-act="editTx" data-id="${t.id}">${ic('edit')}Ubah</button>
    </div>`}
  </main></div>`;
};

V.anggaran = () => {
  const rows = budgetRows(), lim = rows.reduce((a, r) => a + r.lim, 0), used = rows.reduce((a, r) => a + r.used, 0);
  const cnt = st => rows.filter(r => r.st === st).length;
  return `<div class="screen">${topBar('Anggaran', { right: `<button class="ib" data-act="sheet" data-s="budget" aria-label="Atur anggaran">${ic('sliders')}</button>` })}
  ${monthNav('month', ui.month)}
  <main class="pad">
    ${rows.length ? `<section class="card cardpad">
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
      ${rows.map(r => `<a class="tx" href="#/transaksi" data-act="budgetGo" data-c="${r.cat}" style="align-items:flex-start">
        ${catIc('exp', r.c.ic)}
        <div class="grow" style="display:flex;flex-direction:column;gap:6px">
          <div class="sec"><span class="b" style="font-size:14px">${r.c.n}</span><span class="badge ${r.st}">${ic(r.st === 'ok' ? 'check' : r.st === 'warn' ? 'alert' : 'over')}${r.label}</span></div>
          <div class="bar"><i class="${r.st}" style="width:${Math.min(100, r.pc)}%"></i></div>
          <div class="sec c"><span>${rp(r.used)} dari ${rp(r.lim)}</span><span style="color:${r.used > r.lim ? 'var(--exp)' : 'var(--ink2)'}">${r.used > r.lim ? 'Lebih ' + rp(r.used - r.lim) : 'Sisa ' + rp(r.lim - r.used)}</span></div>
        </div></a>`).join('')}
    </section>` : empty('Belum ada anggaran', 'Atur batas pengeluaran per kategori supaya tahu kapan harus mengerem.', `<button class="btn p" style="max-width:280px" data-act="sheet" data-s="budget">${ic('sliders')}Atur anggaran</button>`)}
  </main></div>`;
};

V.lainnya = () => {
  const unpaid = S.bills.filter(b => !b.paid), soon = unpaid.map(b => daysBetween(today(), b.due)).sort((a, b) => a - b)[0];
  const goals = S.goals, gp = pct(goals.reduce((a, g) => a + goalHave(g), 0), goals.reduce((a, g) => a + g.target, 0));
  const trash = S.txs.filter(t => t.del).length;
  const items = [
    ['Dompet', 'wallet', 'dompet', `${S.wallets.length} dompet · ${jt(totalBal())}`, '', '#DDF1FE'],
    ['Tagihan dan cicilan', 'bill', 'tagihan', `${unpaid.length} belum dibayar`, soon !== undefined && soon <= 3 ? (soon < 0 ? 'Terlambat' : `${soon} hari`) : '', '#FFE0E6'],
    ['Tujuan bersama', 'target', 'tujuan', `${goals.length} tujuan · ${gp}%`, '', '#FFF3CC'],
    ['Utang dan piutang', 'debt', 'utang', `${S.debts.filter(x => x.sisa > 0).length} belum lunas`, '', '#E2F5EA'],
    ['Aset dan kekayaan', 'asset', 'aset', `Bersih ${jt(netWorth().net)}`, '', '#DDF1FE'],
    ['Laporan', 'report', 'laporan', monthName(ui.month), '', '#FFE0E6'],
    ['Sampah', 'trash', 'sampah', `${trash} transaksi`, '', '#FFF3CC'],
    ['Pengaturan', 'settings', 'pengaturan', 'Tema, notifikasi, akun', '', '#E2F5EA']
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
  const tot = totalBal(), parts = ['b', 'j', 's'].map(o => [o, Math.max(0, totalBal(o))]), ptot = parts.reduce((a, p) => a + p[1], 0);
  const col = { b: 'var(--k4)', j: 'var(--hus)', s: 'var(--wif)' };
  return `<div class="screen">${topBar('Dompet', { back: '#/lainnya', right: `<button class="ib" data-act="sheet" data-s="wallet" aria-label="Tambah dompet">${ic('plus')}</button>` })}
  <main class="pad">
    <section class="hero">
      <div class="lbl">Total ${S.wallets.length} dompet</div><div class="big">${tot < 0 ? '−' : ''}${rp(tot)}</div>
      <div class="stack" role="img" aria-label="${parts.map(([o, v]) => `${esc(WHO[o])} ${pct(v, ptot)} persen`).join(', ')}">${parts.map(([o, v]) => `<span style="width:${pct(v, ptot)}%;background:${col[o]}"></span>`).join('')}</div>
      <div class="row c" style="gap:14px;flex-wrap:wrap">${parts.map(([o, v]) => `<span style="display:flex;gap:6px;align-items:center;color:var(--ink2)"><span style="width:10px;height:10px;border-radius:3px;background:${col[o]}"></span>${esc(WHO[o])} ${pct(v, ptot)}%</span>`).join('')}</div>
    </section>
    <div class="grid2">
      <a class="btn s sm" href="#/tambah" data-act="newTx" data-k="trf">${ic('transfer')}Transfer</a>
      <button class="btn s sm" data-act="sheet" data-s="adjust" ${S.wallets.length ? '' : 'disabled'}>${ic('edit')}Sesuaikan saldo</button>
    </div>
    ${['b', 'j', 's'].map(o => { const ws = S.wallets.filter(w => w.o === o); if (!ws.length) return ''; return `<section style="display:flex;flex-direction:column;gap:8px">
      <div class="row" style="padding:0 4px">${av(o, 28)}<h2 class="h2 grow">${o === 'b' ? 'Bersama' : 'Milik ' + esc(WHO[o])}</h2><span class="num">${rp(totalBal(o))}</span></div>
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
  return `<div class="screen">${topBar('Tagihan dan cicilan', { back: '#/lainnya', right: `<button class="ib" data-act="sheet" data-s="bill" aria-label="Tambah tagihan" ${S.wallets.length ? '' : 'disabled'}>${ic('plus')}</button>` })}
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
          <div class="c">${dShort(b.due)} · ${esc(wName(b.w))}</div></div>
        <button type="button" class="btn ${due ? 'p' : 's'} sm" style="width:auto;padding:0 12px;font-size:13px" data-act="payBill" data-id="${b.id}">Sudah dibayar</button></div>`; }).join('') : empty('Semua lunas!', 'Tidak ada tagihan yang menunggu.')}
    </section>
    ${S.loans.length ? `<div class="sec"><h2 class="h2">Cicilan</h2><span class="c">${S.loans.filter(l => l.paid < l.tot).length} aktif</span></div>
    ${S.loans.map(l => `<section class="card cardpad">
      <div class="row">${catIc('trf', l.ic)}<div class="grow"><div class="b" style="font-size:14px">${esc(l.n)}</div><div class="c">${esc(l.sub)}</div></div><span class="num">${rp(l.a)}</span></div>
      <div><div class="sec c" style="margin-bottom:6px"><span>Sudah ${l.paid} dari ${l.tot} kali</span><span>Lunas ${esc(l.end)}</span></div><div class="bar"><i class="pri" style="width:${pct(l.paid, l.tot)}%"></i></div></div>
      <div class="grid3"><div class="stat"><span class="c">Sisa</span><b style="font-size:15px">${l.tot - l.paid} kali</b></div><div class="stat"><span class="c">Sisa pokok</span><b style="font-size:15px">${jt(l.pokok)}</b></div><div class="stat"><span class="c">Berikutnya</span><b style="font-size:15px">${esc(l.next)}</b></div></div>
    </section>`).join('')}` : ''}
    <div class="sec"><h2 class="h2">Sudah dibayar</h2><span class="c">${paid.length} tagihan</span></div>
    <section class="card" style="overflow:hidden">
      ${paid.map(b => `<div class="tx" style="cursor:default">${catIc('inc', b.ic)}<div class="grow"><div class="b" style="font-size:14px">${esc(b.n)}</div><div class="c">Dibayar ${esc(WHO[b.paid.by])}, ${dShort(b.paid.at)}</div></div>
        <div class="meta"><span class="num">${rp(b.a)}</span><span class="badge ok">${ic('check')}Lunas</span></div></div>`).join('') || '<div class="c" style="padding:16px">Belum ada.</div>'}
    </section>
  </main></div>`;
};

function goalInfo(g) {
  const have = goalHave(g), left = Math.max(0, g.target - have);
  const months = Math.max(1, Math.round(daysBetween(today(), g.due) / 30.4));
  const saran = Math.round(left / months / 10000) * 10000, p = pct(have, g.target);
  const j = goalBy(g, 'j'), s = goalBy(g, 's'), jp = pct(j, j + s || 1);
  return { have, left, saran, p, j, s, jp, ok: saran <= 4000000 || left === 0 };
}
V.tujuan = () => {
  const infos = S.goals.map(g => [g, goalInfo(g)]);
  const tot = infos.reduce((a, [, i]) => a + i.have, 0), target = S.goals.reduce((a, g) => a + g.target, 0), saran = infos.reduce((a, [, i]) => a + i.saran, 0);
  return `<div class="screen">${topBar('Tujuan bersama', { back: '#/lainnya', right: `<button class="ib" data-act="sheet" data-s="goal" aria-label="Tambah tujuan">${ic('plus')}</button>` })}
  <main class="pad">
    ${S.goals.length ? `<section class="hero"><div class="lbl">Terkumpul untuk ${S.goals.length} tujuan</div><div class="big">${rp(tot)}</div>
      <div class="s" style="font-weight:700">dari target ${rp(target)} · saran setoran ${rp(saran)} per bulan</div></section>` : empty('Belum ada tujuan', 'Buat tujuan bersama, misalnya dana darurat atau liburan.', `<button class="btn p" style="max-width:280px" data-act="sheet" data-s="goal">${ic('plus')}Tujuan baru</button>`)}
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
        <div class="stack" role="img" aria-label="${esc(WHO.j)} ${i.jp} persen, ${esc(WHO.s)} ${100 - i.jp} persen"><span style="width:${i.jp}%;background:var(--hus)"></span><span style="width:${100 - i.jp}%;background:var(--wif)"></span></div>
        <div class="sec" style="font-size:13px"><span class="row" style="gap:6px">${av('j', 20)}${esc(WHO.j)} <b>${rp(i.j)}</b></span><span class="row" style="gap:6px"><b>${rp(i.s)}</b> ${esc(WHO.s)}${av('s', 20)}</span></div></div>
      <div class="grid2"><button type="button" class="btn s sm" data-act="sheet" data-s="goalLog" data-id="${g.id}">Riwayat</button><button type="button" class="btn p sm" data-act="sheet" data-s="deposit" data-id="${g.id}" ${S.wallets.length ? '' : 'disabled'}>${ic('plus')}Setor</button></div>
    </section>`).join('')}
  </main></div>`;
};

V.utang = () => {
  const inn = S.debts.filter(d => d.kind === 'in' && d.sisa > 0), out = S.debts.filter(d => d.kind === 'out' && d.sisa > 0);
  const onlyOpen = ui.debtOpen;
  const sec = (title, kind) => { const items = S.debts.filter(d => d.kind === kind && (!onlyOpen || d.sisa > 0)); return items.length ? `<h2 class="h2" style="padding:0 4px">${title}</h2><section class="card" style="overflow:hidden">${items.map(d => { const paid = d.sisa === 0; return `<div style="padding:14px 16px;display:flex;flex-direction:column;gap:10px;border-top:1px solid var(--line)">
      <div class="row"><div class="cat pri" style="font-family:Fredoka,sans-serif;font-weight:700;font-size:17px">${esc(d.n[0])}</div>
        <div class="grow"><div class="b" style="font-size:14px">${esc(d.n)}</div><div class="c row" style="gap:4px">${av(d.by, 16)}${esc(d.sub)} · dicatat ${esc(WHO[d.by])}</div></div>
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
    ${S.debts.length ? '' : empty('Tidak ada utang', 'Catat pinjaman ke atau dari orang lain supaya tidak lupa.')}
  </main></div>`;
};

function netWorth() {
  const cash = totalBal(), piutang = S.debts.filter(d => d.kind === 'in').reduce((a, d) => a + d.sisa, 0);
  const assets = [{ n: 'Kas dan rekening', ic: 'wallet', sub: `${S.wallets.length} dompet`, v: cash }, ...S.assets.filter(a => a.kind === 'aset'),
    ...(piutang ? [{ n: 'Piutang', ic: 'debt', sub: S.debts.filter(d => d.kind === 'in' && d.sisa).map(d => d.n).join(', '), v: piutang }] : [])];
  const liabs = [
    ...S.loans.filter(l => l.pokok > 0).map(l => ({ n: 'Sisa ' + l.n.toLowerCase(), ic: l.ic, sub: `${l.tot - l.paid} kali lagi`, v: l.pokok })),
    ...S.assets.filter(a => a.kind === 'kewajiban'),
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
      <div class="num" style="text-align:left;font-size:30px;line-height:38px">${nw.net < 0 ? '−' : ''}${rp(nw.net)}</div>
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
    <section class="card" style="overflow:hidden">${list(nw.liabs, 'exp') || '<div class="c" style="padding:16px">Tidak ada kewajiban.</div>'}</section>
    <div class="c">Kas, piutang, cicilan, dan utang dihitung otomatis. Nilai emas, investasi, dan kendaraan diperbarui manual.</div>
  </main></div>`;
};

V.laporan = () => {
  const m = ui.rptMonth, list = inMonth(m), exp = list.filter(t => t.k === 'exp'), te = sumK(list, 'exp'), ti = sumK(list, 'inc');
  const byCat = {}; exp.forEach(t => { byCat[t.cat] = (byCat[t.cat] || 0) + t.n; });
  const sorted = Object.entries(byCat).sort((a, b) => b[1] - a[1]);
  const COLS = ['var(--k1)', 'var(--k2)', 'var(--k3)', 'var(--k4)', 'var(--k5)', 'var(--k6)'];
  const cats = sorted.slice(0, 5).map(([c, v]) => [CATS[c]?.n || esc(c), v]);
  if (sorted.length > 5) cats.push([`Lainnya (${sorted.length - 5})`, sorted.slice(5).reduce((a, x) => a + x[1], 0)]);
  let acc = 0; const stops = cats.map(([, v], i) => { const s = acc; acc += v / (te || 1) * 100; return `${COLS[i]} ${s}% ${acc}%`; });
  const by = (k, o) => list.filter(t => t.k === k && t.by === o).reduce((a, t) => a + t.n, 0);
  const contrib = [['Pengeluaran yang dicatat', by('exp', 'j'), by('exp', 's')], ['Pemasukan', by('inc', 'j'), by('inc', 's')]];
  const months = Array.from({ length: 6 }, (_, i) => shiftMonth(m, i - 5));
  const trend = months.map(k => { const l = inMonth(k); return { m: BLN[+k.slice(5) - 1], i: l.length ? sumK(l, 'inc') : (HIST[k]?.[0] || 0), e: l.length ? sumK(l, 'exp') : (HIST[k]?.[1] || 0), cur: k === mkey(today()) }; });
  const tmax = Math.max(1, ...trend.map(t => Math.max(t.i, t.e)));
  const weeks = []; for (let w = 0; w < 5; w++) { const l = list.filter(t => Math.floor((+t.d.slice(8, 10) - 1) / 7) === w); if (l.length) weeks.push({ n: `Minggu ${w + 1} · ${w * 7 + 1} sampai ${Math.min(w * 7 + 7, 31)} ${BLN[+m.slice(5) - 1]}`, i: sumK(l, 'inc'), e: sumK(l, 'exp') }); }
  const wmax = Math.max(1, ...weeks.map(w => Math.max(w.i, w.e)));
  const g = grp => exp.filter(t => CATS[t.cat]?.g === grp).reduce((a, t) => a + t.n, 0);
  const saveTrf = list.filter(t => t.k === 'trf' && W(t.w2)?.save).reduce((a, t) => a + t.n, 0);
  const rule = [['Kebutuhan', g('need'), 50, 'dapur, tagihan, cicilan, keluarga, zakat', 'var(--k1)'], ['Keinginan', g('want'), 30, 'makan di luar, hiburan, pakaian, kondangan', 'var(--k5)'], ['Tabungan', g('save') + saveTrf, 20, 'investasi dan dana darurat', 'var(--inc)']];
  const unalloc = ti ? 100 - rule.reduce((a, r) => a + pct(r[1], ti), 0) : 0;
  return `<div class="screen">${topBar('Laporan', { back: '#/lainnya', right: `<button class="ib" data-act="exportCsv" aria-label="Unduh CSV">${ic('download')}</button>` })}
  ${monthNav('rptMonth', m)}
  <main class="pad">
    <section class="card cardpad"><h2 class="h2">Pengeluaran per kategori</h2>
      ${te ? `<div class="row" style="gap:20px;flex-wrap:wrap;justify-content:center">
        <div class="donut" role="img" aria-label="Total pengeluaran ${rp(te)}" style="background:conic-gradient(${stops.join(',')})"><span><span class="c">Total</span><b>${jt(te)}</b></span></div>
        <div class="grow" style="display:flex;flex-direction:column;gap:6px;min-width:160px">${cats.map(([n, v], i) => `<div class="lg"><span class="sq" style="background:${COLS[i]}"></span><span>${n}</span><b>${pct(v, te)}%</b></div>`).join('')}</div></div>` : empty('Belum ada pengeluaran', 'Bulan ini masih bersih.')}
    </section>
    <section class="card cardpad"><h2 class="h2">${esc(WHO.j)} dan ${esc(WHO.s)}</h2>
      ${contrib.map(([n, j, s]) => { const t = j + s || 1; return `<div style="display:flex;flex-direction:column;gap:6px"><div class="c">${n}</div>
        <div class="stack" role="img" aria-label="${esc(WHO.j)} ${pct(j, t)} persen, ${esc(WHO.s)} ${pct(s, t)} persen"><span style="width:${pct(j, t)}%;background:var(--hus)"></span><span style="width:${pct(s, t)}%;background:var(--wif)"></span></div>
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

/* Status notifikasi push di perangkat ini (diperbarui setelah layar Pengaturan tampil). */
const PUSH_TEXT = {
  on: ['Notifikasi aktif di HP ini', 'Kamu akan diberi tahu saat pasangan mencatat pemasukan atau pengeluaran.'],
  off: ['Notifikasi di HP ini mati', 'Aktifkan supaya catatan baru dari pasangan langsung muncul di HP.'],
  denied: ['Izin notifikasi ditolak', 'Izinkan notifikasi untuk Pyojem di pengaturan browser atau HP, lalu buka layar ini lagi.'],
  install: ['Pasang aplikasi dulu', 'Di iPhone, notifikasi hanya bisa untuk aplikasi yang sudah dipasang: Safari › Bagikan › Tambah ke Layar Utama, lalu buka Pyojem dari ikonnya.'],
  unsupported: ['Notifikasi tidak didukung', 'Browser ini belum mendukung notifikasi push. Coba Chrome di Android atau aplikasi yang sudah dipasang di iPhone.'],
  wait: ['Memeriksa notifikasi…', '']
};
const pushRow = () => {
  const st = ui.push || 'wait', [t, sub] = PUSH_TEXT[st];
  const btn = st === 'on' ? '<button type="button" class="btn s sm" style="width:auto" data-act="pushOff">Matikan</button>'
    : st === 'off' ? `<button type="button" class="btn p sm" style="width:auto" data-act="pushOn">${ic('bell')}Aktifkan</button>` : '';
  return `<div class="it"><div class="grow"><div class="t">${t}</div><div class="c">${sub}</div></div>${btn}</div>`;
};
async function refreshPush() {
  try { ui.push = await pushState(); } catch { ui.push = 'unsupported'; }
  const el = $('#pushrow'); if (el) el.innerHTML = pushRow();
}

V.pengaturan = () => {
  const n = S.notif, tog = (k, t, sub) => `<div class="it"><div class="grow"><div class="t">${t}</div><div class="c">${sub}</div></div><button type="button" class="tog${n[k] ? ' on' : ''}" role="switch" aria-checked="${!!n[k]}" aria-label="${t}" data-act="tog" data-k="${k}"></button></div>`;
  const theme = getTheme(), btnRow = (act, icn, t, v) => `<button class="it" style="width:100%;background:none;border:0;cursor:pointer;text-align:left" data-act="${act}">${ic(icn)}<span class="t">${t}</span><span class="c">${v}</span>${ic('right')}</button>`;
  return `<div class="screen">${topBar('Pengaturan', { back: '#/lainnya' })}
  <main class="pad">
    <section class="card" style="padding:16px;display:flex;align-items:center;gap:12px;flex-wrap:wrap"><div class="avs">${av('j', 44)}${av('s', 44)}</div>
      <div class="grow"><div class="b">${esc(S.hhName)}</div><div class="c">${CLOUD ? `${S.partnerJoined ? '2 anggota' : 'Menunggu ' + esc(WHO[other()])} · masuk sebagai ${esc(WHO[me()])} (${esc(session?.user?.email || '')})` : `Mode lokal · masuk sebagai ${esc(WHO[me()])}`}</div></div>
      ${CLOUD ? '' : `<button class="btn s sm" style="width:auto" data-act="switchUser">Ganti ke ${esc(WHO[other()])}</button>`}</section>
    ${CLOUD ? `<div class="lbl">Undangan</div>
    <section class="card cardpad">${S.partnerJoined ? '<div class="c">Kalian berdua sudah tergabung.</div>' : `<div class="c">Bagikan kode ini ke ${esc(WHO[other()])}. Setelah mendaftar, pilih “Gabung dengan kode undangan”.</div>
      <div class="row"><b class="disp grow" style="font-size:24px;letter-spacing:.14em">${esc(S.invite)}</b><button class="btn s sm" style="width:auto" data-act="copyInvite">${ic('copy')}Salin</button></div>`}</section>
    ${S.partnerJoined ? '' : `<form class="card cardpad" data-submit="moveHh">
      <h2 class="h2">Punya kode dari pasanganmu?</h2>
      <div class="c">Kalau pasanganmu yang lebih dulu membuat rumah tangga, masukkan kodenya di sini untuk pindah ke rumah tangganya. Rumah tangga di akun ini beserta isinya akan dihapus.</div>
      <div><label class="lab" for="kodepindah">Kode dari pasanganmu</label><div class="field"><input id="kodepindah" name="kode" placeholder="7F3A9C21" autocomplete="off" style="text-transform:uppercase;letter-spacing:.1em" required></div></div>
      <div id="msg" class="s" role="status" style="color:var(--exp);font-weight:700"></div>
      <button class="btn p" type="submit">Pindah dan gabung</button>
    </form>`}` : ''}
    <div class="lbl">Tampilan</div>
    <section class="card cardpad"><div class="c">Tema (khusus perangkat ini)</div>
      <div class="seg" role="radiogroup" aria-label="Tema">${[['light', 'Terang'], ['dark', 'Gelap'], ['auto', 'Ikuti HP']].map(([k, l]) => `<button type="button" role="radio" aria-checked="${theme === k}" class="${theme === k ? 'on' : ''}" data-act="theme" data-k="${k}">${l}</button>`).join('')}</div></section>
    <div class="lbl">Notifikasi</div>
    ${CLOUD ? `<section class="card" id="pushrow">${pushRow()}</section>` : ''}
    <section class="card">${tog('partner', 'Pemasukan dan pengeluaran dari pasangan', 'Langsung muncul di HP setiap kali pasangan mencatat')}${tog('big', 'Pengeluaran besar', 'Beri tahu pasangan jika satu transaksi di atas Rp1.000.000')}${tog('bill', 'Pengingat tagihan', '3 hari sebelum jatuh tempo, pukul 08.00')}${tog('budget', 'Anggaran hampir habis', 'Saat kategori mencapai 80%')}</section>
    <div class="lbl">Uang pribadi</div>
    <section class="card">${tog('secret', 'Rahasiakan rincian dompet pribadi', 'Pasangan hanya melihat total, bukan tiap transaksi')}</section>
    <div class="lbl">Data</div>
    <section class="card">
      <div class="it">${ic(CLOUD ? 'internet' : 'phone')}<span class="t">Tempat penyimpanan</span><span class="c">${CLOUD ? 'Supabase, tersinkron berdua' : (localDb ? 'Database pyojem-keuangan di browser ini' : 'Penyimpanan cadangan browser')}</span></div>
      <a class="it" href="#/sampah">${ic('trash')}<span class="t">Sampah</span><span class="c">${S.txs.filter(t => t.del).length} transaksi</span>${ic('right')}</a>
      ${btnRow('exportAll', 'sheet', 'Ekspor semua transaksi', 'CSV')}
      ${CLOUD ? '' : btnRow('askReset', 'trash', 'Kembalikan data contoh', 'Hapus perubahan')}
    </section>
    <button type="button" class="btn d" data-act="logout">${ic('logout')}Keluar</button>
    <div class="c" style="text-align:center">Pyojem Keuangan versi ${VERSI}</div>
  </main></div>`;
};

/* ---------- lembar (sheet) ---------- */
const walletSelect = (name, sel) => `<div class="field"><select name="${name}" id="${name}">${S.wallets.map(w => `<option value="${w.id}"${w.id === sel ? ' selected' : ''}>${esc(w.n)} · ${rp(w.bal)}</option>`).join('')}</select></div>`;
const numField = (name, label, val = '') => `<div><label class="lab" for="${name}">${label}</label><div class="field"><span class="c" style="font-weight:800">Rp</span><input id="${name}" name="${name}" inputmode="numeric" pattern="[0-9.]*" placeholder="0" value="${val}" required></div></div>`;
const txtField = (name, label, val = '', ph = '', req = true) => `<div><label class="lab" for="${name}">${label}</label><div class="field"><input id="${name}" name="${name}" type="text" maxlength="80" value="${esc(val)}" placeholder="${ph}"${req ? ' required' : ''}></div></div>`;
const sheetHead = t => `<div class="sec"><h2 class="h2" style="font-size:20px">${t}</h2><button type="button" class="ib" data-act="closeSheet" aria-label="Tutup">${ic('x')}</button></div>`;
const segRadio = (name, opts) => `<div class="seg">${opts.map(([v, l], i) => `<label style="display:contents"><input type="radio" name="${name}" value="${v}" class="sr"${i === 0 ? ' checked' : ''}><button type="button" class="${i === 0 ? 'on' : ''}" data-act="radioSeg">${l}</button></label>`).join('')}</div>`;
const SH = {
  budget: () => `<form class="sheet" data-submit="budget">${sheetHead('Atur anggaran bulanan')}
    <div class="c">Kosongkan atau isi 0 untuk mematikan anggaran kategori.</div>
    ${Object.entries(CATS).filter(([, c]) => c.k === 'exp').map(([k, c]) => `<div class="row">${catIc('exp', c.ic, 'width:36px;height:36px')}<label class="grow b" style="font-size:14px" for="b_${k}">${c.n}</label>
      <div class="field" style="width:150px"><input id="b_${k}" name="${k}" inputmode="numeric" value="${S.budgets[k] ? S.budgets[k].toLocaleString('id-ID') : ''}" placeholder="0"></div></div>`).join('')}
    <button class="btn p">${ic('check')}Simpan anggaran</button></form>`,
  wallet: () => `<form class="sheet" data-submit="wallet">${sheetHead('Tambah dompet')}
    ${txtField('n', 'Nama dompet', '', 'misalnya Jago ' + esc(WHO.s))}
    <div><span class="lab">Pemilik</span>${segRadio('o', [['b', 'Bersama'], ['j', esc(WHO.j)], ['s', esc(WHO.s)]])}</div>
    <div><label class="lab" for="icw">Jenis</label><div class="field"><select id="icw" name="ic"><option value="bank">Rekening bank</option><option value="phone">Dompet digital</option><option value="cash">Tunai</option><option value="darurat">Tabungan</option></select></div></div>
    ${numField('bal', 'Saldo sekarang')}<button class="btn p">${ic('check')}Simpan dompet</button></form>`,
  adjust: () => `<form class="sheet" data-submit="adjust">${sheetHead('Sesuaikan saldo')}
    <div><label class="lab" for="w">Dompet</label>${walletSelect('w', S.wallets[0]?.id)}</div>
    ${numField('bal', 'Saldo sebenarnya sekarang')}
    <div class="c">Selisih dicatat di keterangan dompet, tanpa membuat transaksi.</div><button class="btn p">${ic('check')}Simpan</button></form>`,
  bill: () => `<form class="sheet" data-submit="bill">${sheetHead('Tambah tagihan')}
    ${txtField('n', 'Nama tagihan', '', 'misalnya Iuran sampah')}${numField('a', 'Nominal')}
    <div><label class="lab" for="due">Jatuh tempo</label><div class="field"><input id="due" name="due" type="date" value="${today()}" required></div></div>
    <div><label class="lab" for="cat">Kategori</label><div class="field"><select id="cat" name="cat">${Object.entries(CATS).filter(([, c]) => c.k === 'exp').map(([k, c]) => `<option value="${k}">${c.n}</option>`).join('')}</select></div></div>
    <div><label class="lab" for="w">Dibayar dari</label>${walletSelect('w', sharedWallet()?.id)}</div><button class="btn p">${ic('check')}Simpan tagihan</button></form>`,
  goal: () => `<form class="sheet" data-submit="goal">${sheetHead('Tujuan baru')}
    ${txtField('n', 'Nama tujuan', '', 'misalnya Umrah berdua')}${numField('target', 'Target')}
    <div><label class="lab" for="due">Tenggat</label><div class="field"><input id="due" name="due" type="date" value="${shiftMonth(mkey(today()), 12)}-01" required></div></div>
    <button class="btn p">${ic('check')}Simpan tujuan</button></form>`,
  deposit: (id) => { const g = S.goals.find(x => x.id === id); if (!g) return ''; const from = myWallet()?.id === g.wallet ? S.wallets.find(w => w.id !== g.wallet)?.id : myWallet()?.id; return `<form class="sheet" data-submit="deposit" data-id="${id}">${sheetHead('Setor ke ' + esc(g.n))}
    ${numField('n', 'Nominal setoran')}
    <div><label class="lab" for="w">Ambil dari</label>${walletSelect('w', from)}</div>
    <div class="c">Setoran dicatat sebagai transfer atas nama ${esc(WHO[me()])}${g.wallet ? ' ke ' + esc(wName(g.wallet)) : ''}.</div>
    <button class="btn p">${ic('check')}Setor</button></form>`; },
  goalLog: (id) => { const g = S.goals.find(x => x.id === id); if (!g) return ''; const log = deposits(g).sort((a, b) => b.d.localeCompare(a.d)); return `<div class="sheet">${sheetHead('Riwayat ' + esc(g.n))}
    ${log.length ? `<div class="card">${log.map(t => `<a class="it" href="#/detail/${t.id}">${av(t.by, 28)}<div class="grow"><div class="t">${esc(WHO[t.by])} menyetor</div><div class="c">${dShort(t.d)} ${t.d.slice(0, 4)} · dari ${esc(wName(t.w))}</div></div><span class="num inc">+${rp(t.n)}</span></a>`).join('')}</div>` : '<div class="c">Belum ada setoran yang dicatat di aplikasi.</div>'}</div>`; },
  debt: () => `<form class="sheet" data-submit="debt">${sheetHead('Catat utang atau piutang')}
    ${segRadio('kind', [['in', 'Kita pinjamkan'], ['out', 'Kita pinjam']])}
    ${txtField('n', 'Nama orang atau pihak')}${txtField('sub', 'Keterangan', '', 'misalnya Teman kantor', false)}${numField('total', 'Jumlah')}
    <div><label class="lab" for="due">Jatuh tempo</label><div class="field"><input id="due" name="due" type="date" value="${today()}"></div></div>
    <button class="btn p">${ic('check')}Simpan</button></form>`,
  debtPay: (id) => { const d = S.debts.find(x => x.id === id); if (!d) return ''; return `<form class="sheet" data-submit="debtPay" data-id="${id}">${sheetHead((d.kind === 'in' ? 'Uang kembali dari ' : 'Bayar ke ') + esc(d.n))}
    <div class="c">Sisa ${rp(d.sisa)} dari ${rp(d.total)}</div>${numField('n', 'Nominal', d.sisa.toLocaleString('id-ID'))}
    <button class="btn p">${ic('check')}Catat</button></form>`; },
  confirm: (o) => `<div class="sheet">${sheetHead(o.title)}<div class="s">${o.text}</div>
    <div class="grid2"><button class="btn s" data-act="closeSheet">Batal</button><button class="btn d" data-act="${o.act}" data-id="${o.id || ''}">${o.ok}</button></div></div>`
};

/* ---------- render ---------- */
const NAV = [['beranda', 'home', 'Beranda'], ['transaksi', 'list', 'Transaksi'], ['anggaran', 'pie', 'Anggaran'], ['dompet', 'wallet', 'Dompet'], ['tagihan', 'bill', 'Tagihan'], ['tujuan', 'target', 'Tujuan'], ['utang', 'debt', 'Utang'], ['aset', 'asset', 'Aset'], ['laporan', 'report', 'Laporan'], ['sampah', 'trash', 'Sampah'], ['pengaturan', 'settings', 'Pengaturan']];
const MORE = ['lainnya', 'dompet', 'tagihan', 'tujuan', 'utang', 'aset', 'laporan', 'pengaturan', 'sampah'];
function applyTheme() { const t = getTheme(); if (t === 'auto') delete document.documentElement.dataset.theme; else document.documentElement.dataset.theme = t; }
function render(keepScroll) {
  applyTheme();
  const root = $('#app');
  if (ui.phase !== 'app' || !S) {
    root.className = '';
    root.innerHTML = (ui.phase === 'login' && (CLOUD || S)) ? V.login() : ui.phase === 'onboard' ? V.onboard() : ui.phase === 'error' ? V.error() : V.loading();
    syncHistory();
    return;
  }
  recompute();
  const [r, arg] = ui.route.split('/');
  const view = (V[r] || V.beranda)(arg);
  const navOn = k => (k === r || (k === 'lainnya' && MORE.includes(r)) || (k === 'transaksi' && r === 'detail')) ? ' class="on" aria-current="page"' : '';
  const y = window.scrollY;
  root.className = 'app';
  root.innerHTML = `<aside class="side" aria-label="Menu utama">
      <div class="brand"><img src="assets/avatar-bersama.png" alt=""><div><b>Pyojem</b><br><span>Keuangan</span></div></div>
      <a href="#/tambah" class="add" data-act="newTx" data-k="exp">${ic('plus')}Tambah transaksi</a>
      ${NAV.map(([k, i, n]) => `<a href="#/${k}"${navOn(k)}>${ic(i)}${n}</a>`).join('')}
      <div class="who"><div class="avs">${av('j', 28)}${av('s', 28)}</div><div><b>${esc(WHO[me()])}</b><br><span class="c">Bersama ${esc(WHO[other()])}</span></div></div>
    </aside>
    <div class="${ui.route !== ui.prevRoute ? 'enter' : ''}" id="view">${view}</div>
    ${r === 'tambah' ? '' : `<nav class="nav" aria-label="Navigasi utama">
      <a href="#/beranda"${navOn('beranda')}>${ic('home')}Beranda</a><a href="#/transaksi"${navOn('transaksi')}>${ic('list')}Transaksi</a>
      <a href="#/tambah" class="fab" aria-label="Tambah transaksi" data-act="newTx" data-k="exp">${ic('plus')}</a>
      <a href="#/anggaran"${navOn('anggaran')}>${ic('pie')}Anggaran</a><a href="#/lainnya"${navOn('lainnya')}>${ic('grid')}Lainnya</a></nav>`}
    <div id="sheet">${ui.sheet ? `<div class="scrim" data-act="scrim">${SH[ui.sheet.s](ui.sheet.s === 'confirm' ? ui.sheet : ui.sheet.id)}</div>` : ''}</div>
    <div id="toast">${toastHtml()}</div>`;
  ui.prevRoute = ui.route;
  if (keepScroll) window.scrollTo(0, y);
  if (r === 'pengaturan' && CLOUD) refreshPush();
  syncHistory();
}
const toastHtml = () => (ui.toast ? `<div class="toast" role="status"><img src="assets/maskot.png" alt=""><span class="grow">${esc(ui.toast.text)}</span>${ui.toast.undo ? '<button type="button" data-act="undo">Urungkan</button>' : ''}</div>` : '');
function toast(text, undo) {
  clearTimeout(ui.tm); ui.toast = { text, undo };
  const el = $('#toast'); if (el) el.innerHTML = toastHtml();
  ui.tm = setTimeout(() => { ui.toast = null; ui.newId = null; const t = $('#toast'); if (t) t.innerHTML = ''; }, 4500);
}
/* ---------- navigasi ala aplikasi ----------
   Jumlah entri riwayat browser disamakan dengan jumlah langkah back di dalam aplikasi:
   tutup lembar → layar sebelumnya → … → Beranda. Di Beranda tidak ada entri tersisa,
   jadi back berikutnya ditangani HP sendiri, yaitu keluar dari aplikasi.
   Entri hanya ditambah saat ada sentuhan/tombol, karena Chrome melewati entri yang
   dibuat tanpa interaksi (akibatnya back langsung keluar). */
const TABS = ['beranda', 'transaksi', 'anggaran', 'lainnya'];
const nav = { stack: [], pos: 0, jalan: false };
function parentOf(route) {
  const [r, arg] = route.split('/');
  if (r === 'beranda') return null;
  if (TABS.includes(r)) return 'beranda';
  if (r === 'detail') return S?.txs.find(t => t.id === arg)?.del ? 'sampah' : 'transaksi';
  if (r === 'sampah') return 'transaksi';
  if (r === 'tambah') return ui.draft?.editId ? 'detail/' + ui.draft.editId : 'beranda';
  return 'lainnya';
}
function show(route, y) {
  ui.route = route; ui.sheet = null;
  if (!route.startsWith('tambah')) ui.draft = null;
  history.replaceState(history.state, '', '#/' + route);
  render(); window.scrollTo(0, y || 0);
  if (ui.pending) syncRemote();
}
function go(route) {
  if (route === ui.route) { render(); return; }
  if (TABS.includes(route)) nav.stack = route === 'beranda' ? [] : [{ r: 'beranda', y: 0 }];
  else {
    const i = nav.stack.findIndex(s => s.r === route);
    if (i >= 0) nav.stack.length = i;
    else nav.stack.push({ r: ui.route, y: window.scrollY });
  }
  show(route);
}
// Mengembalikan false jika sudah di Beranda dan tidak ada yang bisa ditutup.
function goBack() {
  if (ui.phase !== 'app') return false;
  if (ui.sheet) { A.closeSheet(); return true; }
  const prev = nav.stack.pop();
  if (prev) { show(prev.r, prev.y); return true; }
  const p = parentOf(ui.route);
  if (!p) return false;
  nav.stack = TABS.includes(p) && p !== 'beranda' ? [{ r: 'beranda', y: 0 }] : [];
  show(p);
  return true;
}
// Berapa kali back bisa ditekan sebelum keluar dari aplikasi.
function backSteps() {
  if (ui.phase !== 'app' || !S) return 0;
  let n = (ui.sheet ? 1 : 0) + nav.stack.length, r = nav.stack.length ? nav.stack[0].r : ui.route;
  for (let i = 0; i < 5 && (r = parentOf(r)); i++) n++;
  return n;
}
// Dipanggil setiap render: tambah atau kurangi entri riwayat agar sama dengan backSteps().
function syncHistory() {
  if (nav.jalan) return;
  const want = backSteps();
  if (want < nav.pos) { nav.jalan = true; history.go(want - nav.pos); return; }
  if (want > nav.pos && navigator.userActivation?.isActive !== false) {
    while (nav.pos < want) history.pushState({ pyo: ++nav.pos }, '', location.hash);
  }
}
window.addEventListener('popstate', e => {
  const pos = typeof e.state?.pyo === 'number' ? e.state.pyo : 0;
  history.replaceState({ pyo: pos }, '', '#/' + ui.route); // supaya hashchange dari entri lama tidak ikut berpindah layar
  const n = nav.pos - pos;
  nav.pos = pos;
  if (nav.jalan) nav.jalan = false; // mundur yang dilakukan aplikasi sendiri
  else for (let i = 0; i < n && goBack(); i++); // tombol back HP
  syncHistory();
});
// Dibuka langsung ke sub-halaman: entri riwayat baru bisa dipasang setelah sentuhan pertama.
document.addEventListener('click', () => syncHistory());
const parseRoute = () => location.hash.replace(/^#\/?/, '') || 'beranda';
// Alamat diubah manual (atau dari notifikasi): perlakukan seperti membuka layar baru.
window.addEventListener('hashchange', () => { const r = parseRoute(); if (r !== ui.route) go(r); });
const setMsg = text => { const m = $('#msg'); if (m) m.textContent = text; };
const busy = (form, on) => form?.querySelectorAll('button, input').forEach(b => { b.disabled = on; });

/* ---------- sinkronisasi Supabase ---------- */
async function enterCloud() {
  ui.phase = 'boot'; render();
  try {
    const s = await loadCloud();
    if (s) { S = s; applyNames(); initMonth(); ui.phase = 'app'; subscribeCloud(); }
    else ui.phase = 'onboard';
  } catch (e) { console.error(e); ui.err = e.message || String(e); ui.phase = 'error'; }
  render();
}
let remoteTm = null;
function onRemoteChange() { clearTimeout(remoteTm); remoteTm = setTimeout(syncRemote, 400); }
const typing = () => { const a = document.activeElement; return a && /INPUT|TEXTAREA/.test(a.tagName) && a.type !== 'search' && a.value; };
async function syncRemote() {
  if (!CLOUD || ui.phase !== 'app') return;
  if (ui.sheet || ui.route.startsWith('tambah') || typing()) { ui.pending = true; return; }
  ui.pending = false;
  await writeQ;
  const known = new Set(S.txs.map(t => t.id));
  try { const s = await loadCloud(); if (s && ui.phase === 'app') { S = s; applyNames(); render(true); announce(S.txs.filter(t => !known.has(t.id))); } }
  catch (e) { console.error(e); ui.pending = true; }
}
setInterval(() => { if (ui.pending) syncRemote(); }, 3000);
/* Catatan baru dari pasangan: toast jika aplikasi sedang dilihat, notifikasi jika di latar belakang.
   Notifikasi memakai tag yang sama dengan push dari server, jadi tidak muncul dobel. */
const wantNotify = t => S.notif.partner !== false || (S.notif.big !== false && t.k === 'exp' && t.n >= 1e6);
function announce(list) {
  const fresh = list.filter(t => t.by !== me() && !t.del && t.k !== 'trf');
  if (!fresh.length) return;
  if (document.visibilityState === 'visible') {
    const t = fresh[fresh.length - 1];
    toast(`${WHO[t.by]} mencatat ${t.t} ${sg(t.k, t.n)}${fresh.length > 1 ? ` dan ${fresh.length - 1} lainnya` : ''}`);
    return;
  }
  if (!pushSupported() || Notification.permission !== 'granted') return;
  navigator.serviceWorker.getRegistration().then(reg => fresh.filter(wantNotify).slice(-3).forEach(t => reg?.showNotification(
    `${WHO[t.by]} mencatat ${t.k === 'exp' ? (t.n >= 1e6 ? 'pengeluaran besar' : 'pengeluaran') : 'pemasukan'}`,
    { body: `${t.t} · ${sg(t.k, t.n)}`, tag: 'tx-' + t.id, icon: 'assets/ikon-192.png', badge: 'assets/ikon-192.png', data: { url: './#/detail/' + t.id } })));
}
function onWriteError(err) {
  const msg = /row-level security|permission/i.test(err?.message || '') ? 'Tidak punya izin menyimpan.' : 'Gagal menyimpan ke server.';
  toast(msg + ' Data dimuat ulang.');
  ui.pending = true; setTimeout(syncRemote, 300);
}
const authError = e => {
  const m = e?.message || '';
  if (/invalid login/i.test(m)) return 'Email atau kata sandi salah.';
  if (/already registered/i.test(m)) return 'Email ini sudah terdaftar. Silakan masuk.';
  if (/not confirmed/i.test(m)) return 'Email belum dikonfirmasi. Cek kotak masuk email kamu.';
  if (/password/i.test(m) && /least|short/i.test(m)) return 'Kata sandi terlalu pendek.';
  if (/rate limit/i.test(m)) return 'Terlalu banyak percobaan. Tunggu sebentar lalu coba lagi.';
  return m || 'Terjadi kesalahan. Coba lagi.';
};

/* ---------- aksi ---------- */
const A = {
  pickUser: d => { S.user = d.o; render(); },
  peek: () => { const i = $('#sandi'); i.type = i.type === 'password' ? 'text' : 'password'; },
  authMode: d => { ui.authMode = d.m; ui.authMsg = ''; render(); },
  retry: () => { if (!CLOUD) location.reload(); else if (session) enterCloud(); else { ui.phase = 'login'; render(); } },
  month: d => { ui.month = shiftMonth(ui.month, +d.n); render(true); },
  rptMonth: d => { ui.rptMonth = shiftMonth(ui.rptMonth, +d.n); render(true); },
  fkind: d => { ui.f.kind = d.k; render(true); },
  fby: d => { ui.f.by = d.k; render(true); },
  budgetGo: d => { ui.f = { ...ui.f, cat: d.c, kind: 'all', w: 'all' }; },
  walletGo: d => { ui.f = { ...ui.f, w: d.w, cat: 'all', kind: 'all' }; },
  newTx: d => { ui.draft = S.wallets.length ? newDraft(d.k || 'exp') : null; if (ui.route === 'tambah') render(); },
  dkind: d => { const x = ui.draft; x.kind = d.k; x.cat = d.k === 'trf' ? 'transfer' : (catOrder(d.k)[0] || 'gaji'); x.all = false; render(true); },
  dcat: d => { ui.draft.cat = d.c; render(true); },
  dall: () => { ui.draft.all = true; render(true); },
  dshared: d => { ui.draft.shared = d.v === '1'; render(true); },
  fav: d => { const f = favs()[+d.i]; if (!f) return; Object.assign(ui.draft, { kind: 'exp', cat: f.cat, digits: String(f.a), note: f.n, w: f.w, shared: !!f.shared }); render(true); },
  key: d => { const x = ui.draft; if (!x) return; let s = x.digits; if (d.k === '⌫') s = s.slice(0, -1); else s = (s + d.k).replace(/^0+/, ''); if (s.length <= 12) { x.digits = s; render(true); } },
  saveTx: () => {
    const x = ui.draft; if (!x) return; const n = parseInt(x.digits || '0', 10); if (!n || (x.kind === 'trf' && x.w === x.w2)) return;
    const time = x.date === today() ? nowIso().slice(11) : '12:00';
    const base = { t: x.note.trim() || (x.kind === 'trf' ? `Transfer ke ${wName(x.w2)}` : CATS[x.cat].n), k: x.kind, cat: x.kind === 'trf' ? 'transfer' : x.cat, w: x.w, w2: x.kind === 'trf' ? x.w2 : undefined, n, shared: x.kind === 'trf' ? true : x.shared };
    if (x.editId) {
      const old = S.txs.find(t => t.id === x.editId); if (!old) { ui.draft = null; go('transaksi'); return; }
      const changes = []; if (old.n !== n) changes.push(`mengubah nominal dari ${rp(old.n)} menjadi ${rp(n)}`); if (old.cat !== base.cat) changes.push(`mengubah kategori menjadi ${CATS[base.cat].n}`); if (old.t !== base.t) changes.push('mengubah catatan');
      Object.assign(old, base, { d: x.date + 'T' + old.d.slice(11) }); if (base.k !== 'trf') { delete old.w2; delete old.goal; delete old.to; }
      P.put('tx', old); addHist(old, changes.join(', ') || 'menyimpan ulang transaksi');
      ui.draft = null; toast('Perubahan tersimpan'); go('detail/' + old.id); return;
    }
    const t = newTx({ ...base, by: me(), d: x.date + 'T' + time });
    ui.newId = t.id; ui.draft = null; ui.month = mkey(t.d);
    const warn = t.k === 'exp' && S.budgets[t.cat] && budgetRows(mkey(t.d)).find(r => r.cat === t.cat);
    toast(`Tersimpan. ${t.t} ${sg(t.k, n)}${warn && warn.st !== 'ok' ? ` · anggaran ${CATS[t.cat].s.toLowerCase()} ${warn.pc}%` : ''}`, () => purgeTx(t.id));
    go('beranda');
  },
  undo: () => { const u = ui.toast?.undo; clearTimeout(ui.tm); ui.toast = null; if (u) u(); render(true); },
  editTx: d => { const t = S.txs.find(x => x.id === d.id); if (!t) return; ui.draft = { kind: t.k, digits: String(t.n), cat: CATS[t.cat] ? t.cat : (t.k === 'inc' ? 'masuklain' : t.k === 'trf' ? 'transfer' : 'dapur'), w: t.w, w2: t.w2 || sharedWallet()?.id, shared: t.shared, note: t.t, date: t.d.slice(0, 10), all: true, editId: t.id }; go('tambah'); },
  askDelete: d => { ui.sheet = { s: 'confirm', title: 'Hapus transaksi?', text: 'Transaksi dipindah ke Sampah dan tidak dihitung lagi. Kalian berdua masih bisa mengembalikannya dari Sampah.', ok: 'Pindah ke sampah', act: 'doDelete', id: d.id }; render(true); },
  doDelete: d => { trashTx(d.id); ui.sheet = null; toast('Dipindah ke sampah', () => restoreTx(d.id)); go('transaksi'); },
  restore: d => { restoreTx(d.id); toast('Transaksi dikembalikan'); render(true); },
  askPurge: d => { ui.sheet = { s: 'confirm', title: 'Hapus permanen?', text: `Transaksi ini beserta komentarnya akan hilang selamanya${CLOUD ? ` dari HP ${esc(WHO[other()])} juga` : ''}. Tindakan ini tidak bisa dibatalkan.`, ok: 'Hapus permanen', act: 'doPurge', id: d.id }; render(true); },
  doPurge: d => { purgeTx(d.id); ui.sheet = null; toast('Dihapus permanen'); if (ui.route.startsWith('detail')) go('sampah'); else render(true); },
  askEmptyTrash: () => { ui.sheet = { s: 'confirm', title: 'Kosongkan sampah?', text: 'Semua transaksi di sampah akan dihapus permanen dan tidak bisa dikembalikan.', ok: 'Kosongkan', act: 'doEmptyTrash' }; render(true); },
  doEmptyTrash: () => { S.txs.filter(t => t.del).map(t => t.id).forEach(purgeTx); ui.sheet = null; toast('Sampah dikosongkan'); render(true); },
  share: async d => { const t = S.txs.find(x => x.id === d.id); const txt = `${t.t} ${sg(t.k, t.n)} · ${(CATS[t.cat] || CATS.transfer).n} · ${wName(t.w)} · ${dLong(t.d)}`; try { await navigator.clipboard.writeText(txt); toast('Ringkasan disalin'); } catch { toast(txt); } },
  copyInvite: async () => { try { await navigator.clipboard.writeText(S.invite); toast('Kode undangan disalin'); } catch { toast('Kode undangan: ' + S.invite); } },
  sheet: d => { ui.sheet = { s: d.s, id: d.id }; render(true); setTimeout(() => $('#sheet input:not([type=radio]), #sheet select')?.focus(), 50); },
  closeSheet: () => { ui.sheet = null; render(true); if (ui.pending) syncRemote(); },
  scrim: (d, el, e) => { if (e.target === el) A.closeSheet(); },
  radioSeg: (d, el) => { el.closest('label').querySelector('input').checked = true; el.closest('.seg').querySelectorAll('button').forEach(b => b.classList.toggle('on', b === el)); },
  payBill: d => {
    const b = S.bills.find(x => x.id === d.id); if (!b || b.paid) return;
    const at = nowIso(), amt = b.a, bid = b.id;
    const t = newTx({ t: b.n, k: 'exp', cat: b.cat, w: b.w, by: me(), n: amt, d: at, shared: W(b.w)?.o === 'b', note: 'Dibayar dari daftar tagihan', tags: ['tagihan'] });
    b.paid = { by: me(), at: at.slice(0, 10), tx: t.id }; P.put('bill', b);
    const l = b.loan && S.loans.find(x => x.id === b.loan), lid = l?.id;
    if (l) { l.paid++; l.pokok = Math.max(0, l.pokok - amt); P.put('loan', l); }
    toast(`${b.n} lunas · ${rp(amt)} dari ${wName(b.w)}`, () => {
      const b2 = S.bills.find(x => x.id === bid); if (b2) { b2.paid = null; P.put('bill', b2); }
      purgeTx(t.id);
      const l2 = lid && S.loans.find(x => x.id === lid); if (l2) { l2.paid = Math.max(0, l2.paid - 1); l2.pokok += amt; P.put('loan', l2); }
    });
    render(true);
  },
  debtFilter: d => { ui.debtOpen = d.v === '1'; render(true); },
  remind: d => { const x = S.debts.find(y => y.id === d.id); toast(`Pengingat untuk ${x.n} dicatat`); },
  tog: d => { S.notif[d.k] = !S.notif[d.k]; P.settings(); render(true); },
  theme: d => { setTheme(d.k); render(true); },
  install: async () => {
    if (!installEvt) { ui.installHelp = !ui.installHelp; refreshInstall(); return; }
    const e = installEvt; installEvt = null;
    try { await e.prompt(); await e.userChoice; } catch (err) { console.error(err); }
    refreshInstall();
  },
  pushOn: async (d, el) => {
    el.disabled = true;
    try {
      const r = await enablePush();
      if (r === 'granted') {
        if (S.notif.partner === false) { S.notif.partner = true; P.settings(); render(true); }
        toast('Notifikasi aktif. Catatan pasangan akan muncul di HP ini.');
      } else toast('Izin notifikasi tidak diberikan');
    } catch (e) { console.error(e); toast('Gagal mengaktifkan notifikasi. Periksa koneksi lalu coba lagi.'); }
    refreshPush();
  },
  pushOff: async (d, el) => { el.disabled = true; try { await disablePush(); toast('Notifikasi di HP ini dimatikan'); } catch (e) { console.error(e); } refreshPush(); },
  switchUser: () => { S.user = other(); saveLocalSoon(); render(true); toast(`Sekarang mencatat sebagai ${WHO[me()]}`); },
  logout: async () => {
    if (CLOUD) { unsubscribeCloud(); ui.phase = 'login'; try { await disablePush(); } catch { /* lanjut keluar */ } try { await sb.auth.signOut(); } catch { /* tetap keluar di perangkat ini */ } S = null; HH_ID = null; ui.authMsg = ''; }
    else { S.loggedIn = false; saveLocalSoon(); ui.phase = 'login'; }
    nav.stack = []; ui.route = 'beranda'; history.replaceState(history.state, '', '#/beranda'); render();
  },
  askReset: () => { ui.sheet = { s: 'confirm', title: 'Kembalikan data contoh?', text: 'Semua transaksi, dompet, dan pengaturan yang kamu ubah di perangkat ini akan diganti dengan data contoh.', ok: 'Kembalikan', act: 'doReset' }; render(true); },
  doReset: () => { const u = S.user; S = seed(); S.user = u; S.loggedIn = true; applyNames(); initMonth(); ui.sheet = null; saveLocalSoon(); toast('Data contoh dikembalikan'); go('beranda'); },
  exportCsv: () => download(`pyojem-${ui.rptMonth}.csv`, csv(inMonth(ui.rptMonth))),
  exportAll: () => download('pyojem-semua.csv', csv(TX())),
  print: () => window.print()
};
function csv(list) {
  const q = v => `"${String(v ?? '').replace(/"/g, '""')}"`;
  return ['Tanggal,Jenis,Kategori,Catatan,Dompet,Ke dompet,Dicatat oleh,Nominal'].concat([...list].sort((a, b) => a.d.localeCompare(b.d)).map(t =>
    [t.d.replace('T', ' '), KIND[t.k], CATS[t.cat]?.n, t.t, wName(t.w), t.w2 ? wName(t.w2) : (t.to || ''), WHO[t.by], t.k === 'exp' ? -t.n : t.n].map(q).join(','))).join('\n');
}
function download(name, text) {
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(['﻿' + text], { type: 'text/csv' })); a.download = name; a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
const closeWith = text => { ui.sheet = null; toast(text); render(true); };
const SUBMIT = {
  loginLocal: () => { S.loggedIn = true; saveLocalSoon(); ui.phase = 'app'; nav.stack = []; show('beranda'); },
  auth: async (f, el) => {
    const email = String(f.get('email')).trim(), password = String(f.get('sandi'));
    const daftar = ui.authMode === 'daftar';
    busy(el, true); setMsg('');
    const res = daftar
      ? await sb.auth.signUp({ email, password, options: { emailRedirectTo: location.origin + location.pathname } })
      : await sb.auth.signInWithPassword({ email, password });
    busy(el, false);
    if (res.error) { ui.authMsg = authError(res.error); setMsg(ui.authMsg); return; }
    if (!res.data.session) { ui.authMode = 'masuk'; ui.authMsg = 'Akun dibuat. Ketuk tautan di email konfirmasi, lalu kembali ke sini dan masuk dengan email dan kata sandi tadi.'; render(); return; }
    session = res.data.session; ui.authMsg = ''; await enterCloud();
  },
  createHh: async (f, el) => {
    busy(el, true); setMsg('Menyiapkan rumah tangga…');
    const names = { j: String(f.get('nama_j')).trim(), s: String(f.get('nama_s')).trim() };
    const { data, error } = await sb.rpc('buat_rumah_tangga', { p_nama: f.get('nama'), p_kode: f.get('kode'), p_nama_j: names.j, p_nama_s: names.s });
    if (error) { busy(el, false); setMsg(error.message); return; }
    HH_ID = data.id;
    try { await seedCloud(f.get('contoh') === '1' ? seed() : starter(names)); }
    catch (e) { console.error(e); setMsg('Rumah tangga dibuat, tapi isi awal gagal disimpan: ' + (e.message || e)); }
    await enterCloud();
  },
  joinHh: async (f, el) => {
    busy(el, true); setMsg('');
    const { error } = await sb.rpc('gabung_rumah_tangga', { p_kode_undangan: String(f.get('kode')).trim() });
    if (error) { busy(el, false); setMsg(error.message); return; }
    await enterCloud();
  },
  moveHh: async (f, el) => {
    if (!confirm('Pindah ke rumah tangga pasangan? Rumah tangga di akun ini beserta semua isinya akan dihapus.')) return;
    busy(el, true); setMsg('');
    const { error } = await sb.rpc('pindah_rumah_tangga', { p_kode_undangan: String(f.get('kode')).trim() });
    if (error) { busy(el, false); setMsg(error.message); return; }
    unsubscribeCloud(); nav.stack = []; ui.route = 'beranda';
    await enterCloud();
    toast('Sudah tergabung dengan pasanganmu');
  },
  comment: (f, el) => { const t = S.txs.find(x => x.id === el.dataset.id); const text = String(f.get('text')).trim(); if (!t || !text) return; const c = { id: uid(), by: me(), text, at: nowIso() }; t.comments.push(c); P.put('comment', c, t.id); render(true); },
  budget: f => {
    Object.keys(CATS).filter(k => CATS[k].k === 'exp').forEach(k => {
      const v = parseNum(f.get(k));
      if (v && v !== S.budgets[k]) { S.budgets[k] = v; P.put('budget', { cat: k, lim: v }); }
      else if (!v && S.budgets[k]) { delete S.budgets[k]; P.del('budget', k); }
    });
    closeWith('Anggaran diperbarui');
  },
  wallet: f => { const icn = String(f.get('ic')); const w = { id: uid(), o: f.get('o'), n: String(f.get('n')).trim(), ic: icn, sub: 'Dompet baru', base: parseNum(f.get('bal')), save: icn === 'darurat', ord: S.wallets.length }; S.wallets.push(w); P.put('wallet', w); closeWith('Dompet ditambahkan'); },
  adjust: f => { recompute(); const w = W(f.get('w')); if (!w) return; const nb = parseNum(f.get('bal')), diff = nb - w.bal; w.base += diff; w.sub = `Disesuaikan ${dShort(today())} (${diff >= 0 ? '+' : '−'}${rp(diff)})`; P.put('wallet', w); closeWith(`Saldo ${w.n} disesuaikan`); },
  bill: f => { const cat = String(f.get('cat')); const b = { id: uid(), n: String(f.get('n')).trim(), ic: CATS[cat].ic, cat, a: parseNum(f.get('a')), due: f.get('due'), w: f.get('w'), paid: null }; if (!b.a) return; S.bills.push(b); P.put('bill', b); closeWith('Tagihan ditambahkan'); },
  goal: f => { const g = { id: uid(), n: String(f.get('n')).trim(), ic: 'target', wallet: null, have: 0, target: parseNum(f.get('target')), due: f.get('due'), j: 0, s: 0 }; if (!g.target) return; S.goals.push(g); P.put('goal', g); closeWith('Tujuan baru dibuat'); },
  deposit: (f, el) => {
    const g = S.goals.find(x => x.id === el.dataset.id), n = parseNum(f.get('n')), w = String(f.get('w'));
    if (!g || !n) return;
    if (w === g.wallet) { toast('Pilih dompet sumber yang berbeda dari dompet tujuan'); return; }
    newTx({ t: 'Setor ' + g.n.toLowerCase(), k: 'trf', cat: 'transfer', w, w2: g.wallet || undefined, goal: g.id, to: g.n, by: me(), n, d: nowIso(), shared: true, tags: ['tujuan'] });
    closeWith(`Setor ${rp(n)} ke ${g.n}`);
  },
  debt: f => { const due = f.get('due'), total = parseNum(f.get('total')); if (!total) return; const d = { id: uid(), kind: f.get('kind'), n: String(f.get('n')).trim(), sub: String(f.get('sub') || '').trim(), by: me(), total, sisa: total, due: due ? 'Jatuh tempo ' + dShort(due) : '', remind: '' }; S.debts.push(d); P.put('debt', d); closeWith('Catatan utang disimpan'); },
  debtPay: (f, el) => { const d = S.debts.find(x => x.id === el.dataset.id); if (!d) return; const n = Math.min(d.sisa, parseNum(f.get('n'))); if (!n) return; d.sisa -= n; if (!d.sisa) d.due = 'Dilunasi ' + dShort(today()) + ' ' + today().slice(0, 4); P.put('debt', d); closeWith(d.sisa ? `Tercatat ${rp(n)}, sisa ${rp(d.sisa)}` : `${d.n} lunas`); }
};

document.addEventListener('click', e => {
  const el = e.target.closest('[data-act]'); if (!el) return;
  const fn = A[el.dataset.act]; if (!fn) return;
  if (el.tagName === 'BUTTON') e.preventDefault();
  fn(el.dataset, el, e);
});
// Tautan di dalam aplikasi tidak menambah riwayat browser.
document.addEventListener('click', e => {
  const a = e.target.closest('a[href^="#/"]'); if (!a || e.defaultPrevented || e.ctrlKey || e.metaKey) return;
  e.preventDefault();
  if (a.dataset.back !== undefined) { if (!goBack()) go(a.getAttribute('href').slice(2)); return; }
  go(a.getAttribute('href').slice(2));
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
  else if (k === 'dw') { ui.draft.w = v; ui.draft.shared = W(v)?.o === 'b'; }
  else if (k === 'dw2') ui.draft.w2 = v; else if (k === 'ddate') ui.draft.date = v || today();
  render(true);
});
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && ui.sheet) A.closeSheet();
  if (ui.phase === 'app' && ui.route === 'tambah' && ui.draft && !/INPUT|SELECT|TEXTAREA/.test(document.activeElement?.tagName)) {
    if (/^\d$/.test(e.key)) A.key({ k: e.key }); else if (e.key === 'Backspace') A.key({ k: '⌫' }); else if (e.key === 'Enter') A.saveTx();
  }
});

/* ---------- mulai ---------- */
/* Sisa tautan konfirmasi email di alamat: ?code=… (PKCE) atau #error=… dari Supabase. */
function readAuthUrl() {
  const q = new URLSearchParams(location.search), h = new URLSearchParams(location.hash.replace(/^#\/?/, ''));
  const hash = h.has('error') || h.has('error_code') || h.has('access_token');
  const err = q.get('error_code') || h.get('error_code') || q.get('error') || h.get('error') || '';
  return { hash, any: hash || q.has('code') || q.has('error'), expired: /expired|invalid|denied/i.test(err) };
}
function isSecretKey(k) {
  if (/^sb_secret_/.test(k)) return true;
  try { return JSON.parse(atob(k.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))).role === 'service_role'; } catch { return false; }
}
(async () => {
  registerSw();
  const authUrl = readAuthUrl();
  ui.route = authUrl.hash ? 'beranda' : parseRoute();
  nav.pos = typeof history.state?.pyo === 'number' ? history.state.pyo : 0;
  history.replaceState({ pyo: nav.pos }, '', '#/' + ui.route);
  render();
  if (CLOUD) {
    if (isSecretKey(CFG.supabaseAnonKey)) { ui.err = 'config.js berisi kunci rahasia (service_role/secret). Ganti dengan anon/publishable key, lalu cabut kunci rahasia itu di Supabase.'; ui.phase = 'error'; render(); return; }
    try { await ensureSupabase(); }
    catch (e) { ui.err = e.message; ui.phase = 'error'; render(); return; }
    sb = window.supabase.createClient(CFG.supabaseUrl, CFG.supabaseAnonKey, { auth: { flowType: 'pkce', persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } });
    sb.auth.onAuthStateChange((event, sess) => {
      session = sess;
      if (event === 'SIGNED_OUT' && ui.phase !== 'login') { unsubscribeCloud(); S = null; HH_ID = null; ui.phase = 'login'; render(); }
    });
    const { data } = await sb.auth.getSession();
    session = data.session;
    if (authUrl.any) history.replaceState(history.state, '', location.pathname + '#/' + ui.route);
    if (session) await enterCloud();
    else {
      // Tautan email dibuka di browser lain (atau sudah kedaluwarsa): sesi tidak bisa dibuat di sini,
      // tapi email biasanya sudah terkonfirmasi, jadi cukup masuk dengan kata sandi.
      if (authUrl.any) { ui.authMode = 'masuk'; ui.authMsg = authUrl.expired ? 'Tautan konfirmasi sudah kedaluwarsa atau sudah dipakai. Coba masuk dengan email dan kata sandi; kalau belum bisa, daftar ulang untuk mendapat email baru.' : 'Email sudah dikonfirmasi. Silakan masuk dengan email dan kata sandi.'; }
      ui.phase = 'login'; render();
    }
  } else {
    S = (await loadLocal()) || seed();
    applyNames(); initMonth();
    ui.phase = S.loggedIn ? 'app' : 'login';
    render();
  }
})();
