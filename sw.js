/* 自己削除用のService Worker（2026-08-07）
 *
 * 【なぜ消したか】
 * オフライン表示のためにキャッシュを持たせていたが、これが原因で
 * 「リンクを押しても前の画面のまま」「更新が反映されない」が起きた。
 * 特に、通信が一瞬でも失敗すると全ての遷移をトップページに差し戻す作りだったため、
 * 「リンクが繋がっていない」ように見えていた。
 *
 * 会社案内のサイトにオフライン表示は要らない。リンクが確実に動くことのほうが大事。
 * ホーム画面に追加したときのアイコンと全画面表示は manifest.json 側の機能なので、
 * これを消しても失われない。
 *
 * このファイルは、既に端末に入ってしまった古いService Workerを
 * 自分で削除させるためだけに残してある。消してはいけない。
 */
self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.map(k => caches.delete(k)));
    await self.registration.unregister();
    const windows = await self.clients.matchAll({ type: 'window' });
    windows.forEach(w => w.navigate(w.url));
  })());
});

/* fetch は一切横取りしない。すべて通常どおりネットワークから取得する。 */
