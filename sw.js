/* Pyojem Keuangan — service worker.
   - Membuat aplikasi bisa dipasang di HP dan tetap terbuka saat sinyal putus (cadangan offline).
   - Menampilkan notifikasi push saat pasangan mencatat pemasukan atau pengeluaran. */
'use strict';
const CACHE = 'pyojem-v8';
const SHELL = ['./', 'index.html', 'styles.css?v=1.7', 'config.js?v=1.7', 'icons.js?v=1.7', 'data.js?v=1.7', 'app.js?v=1.7', 'manifest.webmanifest',
  'assets/maskot.png', 'assets/avatar-bersama.png', 'assets/ikon-192.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

/* File aplikasi: ambil versi terbaru dari jaringan dulu, pakai cadangan jika offline.
   Permintaan ke Supabase dan domain lain tidak disentuh. */
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  e.respondWith(fetch(req).then(res => {
    if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
    return res;
  }).catch(() => caches.match(req, { ignoreSearch: true }).then(r => r || (req.mode === 'navigate' ? caches.match('index.html') : Response.error()))));
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
