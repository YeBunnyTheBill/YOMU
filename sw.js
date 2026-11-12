// YOMU – działanie offline.
// Własne pliki: najpierw internet (żeby nowa wersja z GitHuba od razu działała), bez internetu – kopia.
// Czcionki i wzory kresek: najpierw kopia, w tle odświeżenie.
const VERSION = 'yomu-v2';
const EXT = 'yomu-ext';
const FILES = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== VERSION && k !== EXT).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  if (url.origin === location.origin){
    e.respondWith(
      fetch(req)
        .then(res => {
          if (res.ok){ const copy = res.clone(); caches.open(VERSION).then(c => c.put(req, copy)); }
          return res;
        })
        .catch(() => caches.match(req, {ignoreSearch: true})
          .then(hit => hit || (req.mode === 'navigate' ? caches.match('./index.html') : Response.error())))
    );
    return;
  }

  if (/^(fonts\.googleapis\.com|fonts\.gstatic\.com|cdn\.jsdelivr\.net|raw\.githubusercontent\.com)$/.test(url.hostname)){
    e.respondWith(caches.open(EXT).then(async c => {
      const hit = await c.match(req);
      const net = fetch(req)
        .then(res => { if (res.ok || res.type === 'opaque') c.put(req, res.clone()); return res; })
        .catch(() => hit || Response.error());
      return hit || net;
    }));
  }
});
