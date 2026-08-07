/* 合同会社Dewatrek — 最小限の挙動。ライブラリなし。JS無効でも全文読める。 */
(function () {
  'use strict';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ホーム画面に追加したときにアプリとして開けるようにする（PWA）。
     file:// で開いたときは登録されない（https か localhost のみ）。 */
  if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('sw.js').catch(function () { /* 失敗しても表示に影響しない */ });
    });
  }

  var y = document.getElementById('y');
  if (y) y.textContent = String(new Date().getFullYear());

  /* ヘッダー: スクロールしたら紙色にする */
  var hdr = document.getElementById('hdr');
  var busy = false;
  function onScroll() {
    if (busy) return;
    busy = true;
    requestAnimationFrame(function () {
      hdr.classList.toggle('stuck', window.scrollY > 60);
      busy = false;
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* スマホメニュー */
  var burger = document.getElementById('burger');
  var nav = document.getElementById('nav');
  function close() {
    nav.classList.remove('open');
    burger.setAttribute('aria-expanded', 'false');
    burger.setAttribute('aria-label', 'メニューを開く');
  }
  burger.addEventListener('click', function () {
    var open = nav.classList.toggle('open');
    burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    burger.setAttribute('aria-label', open ? 'メニューを閉じる' : 'メニューを開く');
  });
  nav.addEventListener('click', function (e) { if (e.target.closest('a')) close(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });

  /* メールの雛形を差し込む。
     何を書けばいいか分からない、が問い合わせをやめる一番の理由なので、先に埋めておく。
     JSが動かなくても href の宛先と件名は生きている。 */
  var BODIES = {
    building:
      '合同会社Dewatrek 御中\n\n建物のことでご相談です。\n\n' +
      '■ 所在地（市町村までで結構です）：\n' +
      '■ 建物の種類（住宅／店舗／倉庫など）：\n' +
      '■ おおよその築年：\n' +
      '■ 今の使われ方（空き家／一部使用／使用中）：\n' +
      '■ 今いちばん困っていること：\n' +
      '■ ご希望（貸したい／売りたい／まだ決めていない）：\n\n' +
      '■ お名前：\n■ ご連絡先（電話）：\n',
    rent:
      '合同会社Dewatrek 御中\n\n物件のご相談です。\n\n' +
      '■ ご希望の地域（鶴岡市／酒田市／どちらでも）：\n' +
      '■ 用途（住居／店舗／事務所）：\n' +
      '■ ご入居の希望時期：\n' +
      '■ ご予算（月額）：\n' +
      '■ 譲れない条件（ペット・駐車場・広さなど）：\n\n' +
      '■ お名前：\n■ ご連絡先（電話）：\n',
    biz:
      '合同会社Dewatrek 御中\n\n業務のことでご相談です。\n\n' +
      '■ 会社・団体名：\n' +
      '■ 困っている業務：\n' +
      '■ きっかけ（監査の指摘／親会社からの依頼／人手不足など）：\n' +
      '■ いつまでに：\n' +
      '■ ご予算の目安（未定でも構いません）：\n\n' +
      '■ お名前・部署：\n■ ご連絡先（電話）：\n'
  };
  Array.prototype.forEach.call(document.querySelectorAll('[data-mail]'), function (a) {
    var body = BODIES[a.getAttribute('data-mail')];
    if (body) a.href += '&body=' + encodeURIComponent(body);
  });

  /* スクロールで静かに表示 */
  var items = document.querySelectorAll('.fade');
  if (reduce || !('IntersectionObserver' in window)) {
    Array.prototype.forEach.call(items, function (el) { el.classList.add('in'); });
    return;
  }
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (!en.isIntersecting) return;
      en.target.classList.add('in');
      io.unobserve(en.target);
    });
  }, { rootMargin: '0px 0px -10% 0px', threshold: 0.1 });
  Array.prototype.forEach.call(items, function (el) { io.observe(el); });
})();
