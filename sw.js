// 離線快取：網頁本身「先抓網路、失敗才用快取」（確保拿到最新版）；路燈、建築、隧道資料「先用快取」（不常變動、省流量）
const CACHE = 'sunsv-v1';
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(['./', 'index.html', 'manifest.webmanifest', 'icons/icon-192.png'])).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return;   // Google 地圖、天氣等外部服務不快取
  if (url.pathname.includes('/lights/')) {
    e.respondWith(caches.open(CACHE).then(async c => {
      const hit = await c.match(e.request);
      if (hit) return hit;
      const res = await fetch(e.request);
      if (res.ok) c.put(e.request, res.clone());
      return res;
    }));
    return;
  }
  e.respondWith(fetch(e.request).then(res => {
    if (res.ok) caches.open(CACHE).then(c => c.put(e.request, res.clone()));
    return res;
  }).catch(() => caches.match(e.request).then(r => r || caches.match('index.html'))));
});
