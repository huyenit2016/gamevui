// Service worker của /claude-learning: học offline. Ưu tiên mạng (luôn mới), lưu bản sao để đọc khi mất mạng.
const C = 'cl-v1', SHELL = ['./', 'index.html', 'style.css', 'app.js', 'tracks.js', 'content/index.json'];
self.addEventListener('install', e => { e.waitUntil(caches.open(C).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== C).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const r = e.request; if (r.method !== 'GET' || new URL(r.url).origin !== location.origin) return;
  e.respondWith(fetch(r).then(res => { if (res.ok) { const cp = res.clone(); caches.open(C).then(c => c.put(r, cp)); } return res; }).catch(() => caches.match(r).then(m => m || caches.match('index.html'))));
});
