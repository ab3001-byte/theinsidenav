/* The Inside NAV: soft subscribe gate.
   New readers see the first part of an article, then a free email sign-up to continue.
   Subscribers are remembered three ways, so they are not asked again:
   1. localStorage, 2. a cookie, 3. a server-set cookie from /.netlify/functions/remember
   (server cookies survive Safari's 7-day wipe of script storage).
   Links with ?sub=1 (use these in emails to subscribers) also unlock.
   Placement: <div id="gate-here"></div> inside .story, or, if missing, before the 3rd section heading. */
(function () {
  var KEY = 'tin_subscribed', REF = 'tin_sub_ref', DAY = 864e5;
  function ls(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; } }
  function hasCookie() { return /(?:^|;\s*)tin_sub=1\b/.test(document.cookie); }
  function isSub() { return ls(KEY) === '1' || hasCookie(); }
  function serverRemember() {
    ls(REF, String(Date.now()));
    try { fetch('/.netlify/functions/remember', { method: 'POST', credentials: 'same-origin', keepalive: true }).catch(function () {}); } catch (e) {}
  }
  function setSub() {
    ls(KEY, '1');
    try { document.cookie = 'tin_sub=1; Max-Age=34560000; Path=/; SameSite=Lax; Secure'; } catch (e) {}
    serverRemember();
  }
  window.tinRemember = setSub;

  if (/[?&]sub=1\b/.test(location.search)) setSub();
  if (isSub()) {
    // Keep all three in sync, and refresh the server cookie about once a month.
    if (ls(KEY) !== '1' || !hasCookie() || Date.now() - Number(ls(REF) || 0) > 30 * DAY) setSub();
    return;
  }

  var story = document.querySelector('.story');
  if (!story) return;
  var marker = document.getElementById('gate-here');
  if (!marker) {
    var hs = story.querySelectorAll(':scope > h2');
    if (hs.length < 3) return;
    marker = hs[2];
  }

  var css = document.createElement('style');
  css.textContent =
    '.tin-hide{display:none!important}' +
    '.tin-fade{position:relative;height:120px;margin-top:-120px;background:linear-gradient(to bottom,rgba(255,255,255,0),var(--md-surface,#fff) 85%);pointer-events:none}' +
    '.tin-gate{margin:8px 0 40px;padding:32px 28px;border-radius:24px;background:var(--md-surface-container,#F3F1EC);border:1px solid var(--md-outline-variant,#E2DED6);text-align:center}' +
    '.tin-gate img{height:38px;width:auto;margin:0 auto 18px;display:block}' +
    '.tin-gate h3{font-family:var(--md-serif,Georgia,serif);font-weight:500;font-size:clamp(1.6rem,4.5vw,2.1rem);line-height:1.2;margin:0 0 10px;color:var(--md-on-surface,#1b1b1b)}' +
    '.tin-gate p{margin:0 auto 22px;max-width:30em;font-size:18px;line-height:1.5;color:var(--md-on-surface-variant,#4C515A)}' +
    '.tin-gate form{display:flex;gap:10px;flex-wrap:wrap;justify-content:center;max-width:460px;margin:0 auto}' +
    '.tin-gate input[type=email]{flex:1 1 240px;min-width:0;font:inherit;font-size:17px;padding:14px 16px;border-radius:14px;border:1.5px solid var(--md-outline,#B9B4AA);background:#fff;color:#1b1b1b}' +
    '.tin-gate button{flex:0 0 auto;font:inherit;font-size:17px;font-weight:600;padding:14px 22px;border-radius:999px;border:0;background:var(--md-primary,#3D5A80);color:#fff;cursor:pointer}' +
    '.tin-gate button[disabled]{opacity:.6;cursor:default}' +
    '.tin-gate small{display:block;margin-top:14px;font-size:14px;color:var(--md-on-surface-variant,#4C515A)}' +
    '.tin-gate .hp{position:absolute;left:-9999px}';
  document.head.appendChild(css);

  // Hide everything after the marker in the article, plus the sections below it.
  var hidden = [];
  var n = marker;
  if (marker.id !== 'gate-here') { marker.classList.add('tin-hide'); hidden.push(marker); }
  while ((n = n.nextElementSibling)) { n.classList.add('tin-hide'); hidden.push(n); }
  var after = story.nextElementSibling;
  while (after) { if (after.tagName !== 'SCRIPT') { after.classList.add('tin-hide'); hidden.push(after); } after = after.nextElementSibling; }

  var fade = document.createElement('div'); fade.className = 'tin-fade';
  var gate = document.createElement('section'); gate.className = 'tin-gate'; gate.id = 'continue';
  gate.innerHTML =
    '<img src="/logo-wordmark.png" alt="The Inside NAV">' +
    '<h3>Continue reading, free</h3>' +
    '<p>Subscribe with your email to read the rest of this article and every new one. It is free. No spam.</p>' +
    '<form name="subscribe" novalidate>' +
      '<p class="hp"><label>Leave empty <input name="company" tabindex="-1" autocomplete="off"></label></p>' +
      '<input type="email" name="email" placeholder="Your email address" required autocomplete="email">' +
      '<button type="submit">Continue reading</button>' +
    '</form>' +
    '<small>Already subscribed? Enter your email once and this device will remember you.</small>';
  marker.parentNode.insertBefore(fade, marker);
  marker.parentNode.insertBefore(gate, marker);

  var form = gate.querySelector('form');
  var btn = gate.querySelector('button');
  var email = gate.querySelector('input[type=email]');

  function unlock() {
    setSub();
    hidden.forEach(function (el) { el.classList.remove('tin-hide'); });
    fade.remove(); gate.remove();
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var v = (email.value || '').trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) { email.focus(); email.style.borderColor = '#D9785B'; return; }
    if (form.company.value) return; // bot
    btn.disabled = true; btn.textContent = 'One moment…';
    var body = 'form-name=subscribe&email=' + encodeURIComponent(v) + '&source=' + encodeURIComponent(location.pathname);
    fetch('/', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: body })
      .catch(function () {})
      .then(unlock);
  });
})();
