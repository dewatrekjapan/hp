/* 合同会社Dewatrek — 最小限のService Worker
   目的はオフライン表示とホーム画面アプリ化だけ。凝ったことはしない。
   ★サイトを更新したら CACHE の日付を必ず変えること（変えないと古い画面が出続ける） */
const CACHE = 'dewatrek-20260807e';
const ASSETS = [
  './',
  './index.html',
  './assets/css/style.css?v=20260807e',
  './assets/js/main.js?v=20260807e',
  './assets/img/hero-shonai.jpg',
  './assets/img/akiya.jpg',
  './assets/img/koshi.jpg',
  './assets/img/icon-192.png'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || !req.url.startsWith(self.location.origin)) return;

  // HTMLは新しいものを優先（内容が古いまま出ると困るため）。落ちたらキャッシュ。
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).catch(() => caches.match('./index.html')));
    return;
  }
  // それ以外はキャッシュ優先。
  e.respondWith(caches.match(req).then(hit => hit || fetch(req)));
});
