/* Pyojem Keuangan — service worker.
   - Membuat aplikasi bisa dipasang di HP dan tetap terbuka saat sinyal putus (cadangan offline).
   - Menampilkan notifikasi push saat pasangan mencatat pemasukan atau pengeluaran. */
'use strict';
const CACHE = 'pyojem-v11';
const SHELL = ['./', 'index.html', 'styles.css?v=1.10', 'config.js?v=1.10', 'icons.js?v=1.10', 'data.js?v=1.10', 'app.js?v=1.10', 'manifest.webmanifest', 'vendor/supabase-2.117.2.js',
  'assets/maskot.png', 'assets/avatar-bersama.png', 'assets/ikon-192.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

/* File aplikasi: ambil versi terbaru dari jaringan dulu. Jika jaringan tidak menjawab dalam
   beberapa detik (sinyal lemah atau situs lambat), pakai salinan tersimpan agar aplikasi tidak
   tertahan di layar memuat; salinan diperbarui di latar belakang begitu jaringan menjawab.
   Permintaan ke Supabase dan domain lain tidak disentuh. */
const NET_WAIT = 4000;
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  const net = fetch(req).then(res => {
    if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
    return res;
  });
  const cached = () => caches.match(req, { ignoreSearch: req.mode === 'navigate' }).then(r => r || (req.mode === 'navigate' ? caches.match('index.html') : null));
  e.waitUntil(net.catch(() => {}));
  e.respondWith(new Promise(resolve => {
    let done = false;
    const give = r => { if (!done && r) { done = true; resolve(r); } };
    const tm = setTimeout(() => cached().then(give), NET_WAIT);
    net.then(r => { clearTimeout(tm); give(r); }).catch(() => {
      clearTimeout(tm);
      cached().then(r => { give(r || Response.error()); });
    });
  }));
});

self.addEventListener('push', e => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch { d = { body: e.data && e.data.text() }; }
  e.waitUntil(self.registration.showNotification(d.title || 'Pyojem Keuangan', {
    body: d.body || 'Ada catatan baru dari pasanganmu.',
    tag: d.tag, renotify: false,
    icon: 'assets/ikon-192.png', badge: 'assets/ikon-192.png',
    data: { url: d.url || './#/beranda' }
  }));
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  const url = new URL(e.notification.data?.url || './', self.registration.scope).href;
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
    const win = list.find(c => c.url.startsWith(self.registration.scope));
    if (win) { win.navigate(url).catch(() => {}); return win.focus(); }
    return self.clients.openWindow(url);
  }));
});
