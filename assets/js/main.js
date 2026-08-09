/* 合同会社Dewatrek — 最小限の挙動。ライブラリなし。JS無効でも全文読める。 */
(function () {
  'use strict';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* 以前入れていたService Worker（オフライン用キャッシュ）を確実に取り除く。
     これが残っていると、リンクを押しても古い画面が出続ける。
     ホーム画面に追加したときのアイコンと全画面表示は manifest.json の機能なので影響しない。 */
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(function (regs) {
      regs.forEach(function (r) { r.unregister(); });
    }).catch(function () {});
  }
  if (window.caches && caches.keys) {
    caches.keys().then(function (keys) {
      keys.forEach(function (k) { caches.delete(k); });
    }).catch(function () {});
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

  /* 別ページから #〜 付きで来たとき、画像の読み込みで高さが変わるため
     ブラウザ任せだと目的の位置に飛べないことがある。読み込み完了後に自分で合わせる。 */
  if (location.hash && location.hash.length > 1) {
    window.addEventListener('load', function () {
      var target = null;
      try { target = document.querySelector(location.hash); } catch (e) { /* 不正なハッシュは無視 */ }
      if (target) {
        var prev = document.documentElement.style.scrollBehavior;
        document.documentElement.style.scrollBehavior = 'auto';
        target.scrollIntoView();
        document.documentElement.style.scrollBehavior = prev;
      }
    });
  }

  /* メールアドレスのコピー。クリップボードAPIが使えない環境でも動くよう二段構え。 */
  Array.prototype.forEach.call(document.querySelectorAll('.copy'), function (btn) {
    btn.addEventListener('click', function () {
      var text = btn.getAttribute('data-copy');
      var done = function () {
        var label = btn.textContent;
        btn.textContent = 'コピーしました';
        btn.classList.add('done');
        setTimeout(function () { btn.textContent = label; btn.classList.remove('done'); }, 2000);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done).catch(fallback);
      } else {
        fallback();
      }
      function fallback() {
        var ta = document.createElement('textarea');
        ta.value = text;
        ta.setAttribute('readonly', '');
        ta.style.cssText = 'position:fixed;top:-1000px';
        document.body.appendChild(ta);
        ta.select();
        try { document.execCommand('copy'); done(); } catch (e) { /* 手で選択してもらう */ }
        document.body.removeChild(ta);
      }
    });
  });

  /* 問い合わせフォーム
     ------------------------------------------------------------------
     ★FORM_ENDPOINT を空のままにしてある間は、サーバへは送らず
       「メールソフトへ引き渡す＋内容をクリップボードにコピー」で動く。
       Formspree 等に登録したら、下の1行に送信先URLを入れるだけで本当の送信になる。
       例: var FORM_ENDPOINT = 'https://formspree.io/f/xxxxxxxx';
     ------------------------------------------------------------------ */
  var FORM_ENDPOINT = '';
  var MAIL_TO = 'dewatrek.japan@gmail.com';

  var form = document.getElementById('cform');
  if (form) {
    var err = document.getElementById('cform-err');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var v = function (id) { return (document.getElementById(id).value || '').trim(); };
      var name = v('f-name'), mail = v('f-mail'), body = v('f-body');

      var missing = [];
      if (!name) missing.push('お名前');
      if (!mail || mail.indexOf('@') < 1) missing.push('ご返信先メールアドレス');
      if (!body) missing.push('ご相談内容');
      if (missing.length) {
        err.textContent = missing.join('と') + 'をご記入ください。';
        err.hidden = false;
        (document.getElementById(missing[0] === 'お名前' ? 'f-name' : 'f-mail')).focus();
        return;
      }
      err.hidden = true;

      var text =
        '【ご相談の種類】' + v('f-type') + '\n' +
        '【お名前】' + name + '\n' +
        '【会社名・屋号】' + (v('f-org') || '（なし）') + '\n' +
        '【ご返信先】' + mail + '\n\n' +
        '【ご相談内容】\n' + body + '\n';

      var finish = function (msg) {
        var ok = form.querySelector('.cform-ok');
        if (!ok) { ok = document.createElement('p'); ok.className = 'cform-ok'; form.appendChild(ok); }
        ok.textContent = msg;
      };

      if (FORM_ENDPOINT) {
        fetch(FORM_ENDPOINT, {
          method: 'POST',
          headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: v('f-type'), name: name, org: v('f-org'), email: mail, message: body })
        }).then(function (r) {
          if (!r.ok) throw new Error('ng');
          form.reset();
          finish('送信しました。ご連絡ありがとうございます。追ってご返信します。');
        }).catch(function () {
          err.textContent = '送信できませんでした。お手数ですが ' + MAIL_TO + ' 宛にお送りください。';
          err.hidden = false;
        });
        return;
      }

      /* 送信先が未設定のあいだ：内容をコピーしてメールソフトへ引き渡す */
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).catch(function () {});
      }
      window.location.href = 'mailto:' + MAIL_TO +
        '?subject=' + encodeURIComponent('お問い合わせ（' + v('f-type') + '）') +
        '&body=' + encodeURIComponent(text);
      finish('入力内容をクリップボードにコピーしました。メールソフトが開かない場合は、下のアドレス宛に貼り付けてお送りください。');
    });
  }

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
