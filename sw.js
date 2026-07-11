// mim — service worker (Fase 2: instalável + casca offline; ações offline ficam na fila do app)
const CACHE = 'mim-v11';
const SHELL = ['./index.html', './manifest.webmanifest', './icons/icon-192.png', './icons/icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
// alarmes / avisos empurrados pela Edge Function "push"
self.addEventListener('push', e => {
  let d = {}; try { d = e.data.json(); } catch {}
  e.waitUntil(self.registration.showNotification(d.title || 'MIM', {
    body: d.body || '', icon: './icons/icon-192.png', badge: './icons/icon-192.png'
  }));
});
self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(clients.matchAll({type:'window', includeUncontrolled:true})
    .then(ws => ws.length ? ws[0].focus() : clients.openWindow('./')));
});
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  // nunca intercepta chamadas ao Supabase ou a CDNs
  if (url.origin !== location.origin) return;
  e.respondWith(
    fetch(e.request).then(r => {
      const copia = r.clone();
      caches.open(CACHE).then(c => c.put(e.request, copia));
      return r;
    }).catch(() => caches.match(e.request))
  );
});
