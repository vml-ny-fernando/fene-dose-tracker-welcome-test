// Swipeable step pager with a stepper that shows current and completed steps.
// A step counts as completed only after a clear action: tapping its action button
// (Add my medication, Open Health, Install, Test) or its confirm button ("Done, next").
// Swiping past a step does not complete it. State stays on this phone only.
(function () {
  var device = document.body.getAttribute('data-arm') || '';
  function send(name) {
    try { navigator.sendBeacon('/e/' + name + (device ? '?device=' + device : '')); } catch (e) {}
  }
  document.querySelectorAll('[data-event]').forEach(function (a) {
    a.addEventListener('click', function () { send(a.getAttribute('data-event')); });
  });

  // iPhone decal page: open Health right away; the button stays as a fallback.
  var auto = document.querySelector('[data-autolaunch]');
  if (auto) setTimeout(function () { window.location.href = auto.getAttribute('href'); }, 400);

  // Android decal page: a simple dose log kept on this phone.
  var logEl = document.getElementById('dose-log');
  if (logEl) doseLog();

  scanner();

  var pager = document.getElementById('pager');
  if (!pager) return;
  var slides = Array.prototype.slice.call(pager.querySelectorAll('.slide'));
  var stepIds = slides.filter(function (s) { return s.hasAttribute('data-step'); }).map(function (s) { return s.id; });
  var prev = document.querySelector('[data-prev]');
  var pos = document.getElementById('pos');
  var SLIDE_KEY = 'dose-kit-slide', DONE_KEY = 'dose-kit-done';
  var current = -1;

  function read(k, fallback) { try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : fallback; } catch (e) { return fallback; } }
  function write(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  var done = read(DONE_KEY, {});

  function complete(id) {
    if (!id || done[id]) return;
    done[id] = true;
    write(DONE_KEY, done);
    send('step_done');
    render();
  }

  function render() {
    var count = stepIds.filter(function (id) { return done[id]; }).length;
    var curId = slides[current] ? slides[current].id : '';
    // Top progress dots: white = not started, navy = completed, lime = current
    document.querySelectorAll('[data-dot]').forEach(function (d, k) {
      var id = d.getAttribute('data-dot');
      var isCur = id === curId, isDone = !!done[id];
      d.className = isCur ? 'is-current' : isDone ? 'is-done' : '';
      d.querySelector('[data-dot-state]').textContent = 'Step ' + (k + 1) + ': ' + (isCur ? 'current' : isDone ? 'completed' : 'not started');
    });

    document.querySelectorAll('[data-st]').forEach(function (b) {
      var id = b.getAttribute('data-st');
      var isDone = !!done[id], isCur = id === curId;
      b.classList.toggle('is-done', isDone);
      b.classList.toggle('is-current', isCur);
      if (isCur) b.setAttribute('aria-current', 'step'); else b.removeAttribute('aria-current');
      var st = b.querySelector('[data-st-state]');
      if (st) st.textContent = isDone ? 'Completed' : isCur ? 'Current step' : 'Not done yet';
    });
    slides.forEach(function (s) {
      var tag = s.querySelector('[data-done-tag]');
      if (tag) tag.hidden = !done[s.id];
      s.classList.toggle('is-done', !!done[s.id]);
    });
    document.querySelectorAll('[data-summary]').forEach(function (li) {
      var isDone = !!done[li.getAttribute('data-summary')];
      li.classList.toggle('is-done', isDone);
      li.querySelector('[data-sum-state]').innerHTML = isDone ? '&#10003; Done' : 'Finish &#8250;';
      var row = li.querySelector('.sum-row');
      row.setAttribute('aria-label', li.querySelector('.sum-label').textContent + (isDone ? ', done. Review this step' : ', not done. Go to this step'));
    });
    var title = document.getElementById('finish-title');
    var kicker = document.getElementById('finish-kicker');
    if (title) title.textContent = count === stepIds.length ? "You're all set" : 'Almost there';
    if (kicker) kicker.textContent = count + ' of ' + stepIds.length + ' steps done';
  }

  function go(i, smooth) {
    i = Math.max(0, Math.min(slides.length - 1, i));
    pager.scrollTo({ left: i * pager.clientWidth, behavior: smooth === false ? 'instant' : 'smooth' });
  }
  function update(i) {
    current = i;
    document.body.classList.toggle('on-splash', slides[i].id === 'welcome');
    document.body.classList.toggle('on-finish', slides[i].id === 'finish');
    var inner = slides[i].querySelector('.slide-inner'); if (inner) inner.scrollTop = 0;
    if (prev) prev.disabled = i === 0;
    if (pos) pos.textContent = (i + 1) + ' / ' + slides.length;
    render();
  }

  var t;
  pager.addEventListener('scroll', function () {
    clearTimeout(t);
    t = setTimeout(function () {
      var i = Math.round(pager.scrollLeft / pager.clientWidth);
      if (i !== current) update(i);
    }, 80);
  }, { passive: true });

  document.querySelectorAll('[data-complete]').forEach(function (a) {
    a.addEventListener('click', function () {
      var s = a.closest('.slide');
      complete(s && s.getAttribute('data-step'));
    });
  });
  document.querySelectorAll('[data-next]').forEach(function (b) {
    b.addEventListener('click', function () {
      var s = b.closest('.slide');
      complete(s && s.getAttribute('data-step'));
      go(current + 1);
    });
  });
  if (prev) prev.addEventListener('click', function () { go(current - 1); });
  document.querySelectorAll('[data-go]').forEach(function (d) {
    d.addEventListener('click', function () { go(parseInt(d.getAttribute('data-go'), 10)); });
  });
  var restart = document.querySelector('[data-restart]');
  if (restart) restart.addEventListener('click', function () { done = {}; write(DONE_KEY, done); go(0); render(); });

  document.addEventListener('keydown', function (e) {
    if (e.target && /INPUT|TEXTAREA/.test(e.target.tagName)) return;
    if (e.key === 'ArrowRight') go(current + 1);
    if (e.key === 'ArrowLeft') go(current - 1);
  });
  window.addEventListener('resize', function () { go(current, false); });

  // Every visit (scan or refresh) starts on the splash screen. Only an explicit link
  // such as /#sticker opens a specific step. Completed ticks are kept on this phone.
  var hashIdx = slides.findIndex(function (s) { return '#' + s.id === location.hash; });
  var start = hashIdx > 0 ? hashIdx : 0;
  if (hashIdx > 0 && history.replaceState) history.replaceState(null, '', location.pathname + location.search);
  try { localStorage.removeItem(SLIDE_KEY); } catch (e) {}
  requestAnimationFrame(function () { window.scrollTo(0, 0); go(start, false); update(start); });

  function doseLog() {
    var KEY = 'dose-log';
    var take = document.getElementById('dose-take');
    var undo = document.getElementById('dose-undo');
    var status = document.getElementById('dose-status');
    var week = document.getElementById('dose-week');
    function dayKey(d) { return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); }
    function load() { try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch (e) { return []; } }
    function save(list) { try { localStorage.setItem(KEY, JSON.stringify(list.slice(-400))); } catch (e) {} }
    function render() {
      var list = load(), today = dayKey(new Date());
      var todays = list.filter(function (t) { return dayKey(new Date(t)) === today; });
      if (todays.length) {
        var t = new Date(todays[todays.length - 1]);
        status.textContent = 'Logged today at ' + t.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) + '.';
      } else {
        status.textContent = "You haven't logged a dose today.";
      }
      take.textContent = todays.length ? 'Log another dose' : 'I took my dose';
      undo.hidden = !todays.length;
      week.innerHTML = '';
      for (var i = 6; i >= 0; i--) {
        var d = new Date(); d.setDate(d.getDate() - i);
        var hit = list.some(function (x) { return dayKey(new Date(x)) === dayKey(d); });
        var li = document.createElement('li');
        li.className = hit ? 'is-done' : '';
        li.innerHTML = '<span class="wk-day">' + d.toLocaleDateString([], { weekday: 'narrow' }) + '</span><span class="wk-mark" aria-hidden="true"></span>';
        li.setAttribute('aria-label', d.toLocaleDateString([], { weekday: 'long' }) + (hit ? ': logged' : ': not logged'));
        week.appendChild(li);
      }
    }
    take.addEventListener('click', function () { var l = load(); l.push(new Date().toISOString()); save(l); render(); });
    undo.addEventListener('click', function () {
      var l = load(), today = dayKey(new Date());
      for (var i = l.length - 1; i >= 0; i--) { if (dayKey(new Date(l[i])) === today) { l.splice(i, 1); break; } }
      save(l); render();
    });
    render();
  }

  // In-page camera scanner for the "Scan my sticker" button. It reads the sticker's QR
  // and goes to the log page, which opens Health on Medications (iPhone) or the dose log
  // (Android). Video frames stay in the browser; nothing is uploaded.
  function scanner() {
    var box = document.getElementById('scanner');
    if (!box) return;
    var video = document.getElementById('scan-video');
    var msg = document.getElementById('scan-msg');
    var alt = document.getElementById('scan-alt');
    var stream = null, timer = null, detector = null, canvas = null, ctx = null, opener = null;

    function say(t, showAlt) { msg.textContent = t || ''; alt.hidden = !showAlt; }
    function stop() {
      clearTimeout(timer); timer = null;
      if (stream) stream.getTracks().forEach(function (t) { t.stop(); });
      stream = null; video.srcObject = null;
    }
    function close() { stop(); box.hidden = true; document.body.classList.remove('scanning'); if (opener) opener.focus(); }
    function isSticker(text) {
      try { return new URL(text, location.href).pathname.replace(/\/$/, '') === '/log'; } catch (e) { return false; }
    }
    function logPath(text) {
      // Keep the sticker's own settings (like ?med=Name) and add this phone's type.
      var q = new URL(text, location.href).searchParams;
      if (device) q.set('device', device);
      return '/log?' + q.toString();
    }
    function found(text) {
      if (!isSticker(text)) { say("That code isn't your dose sticker. Try again."); return false; }
      if (navigator.vibrate) navigator.vibrate(60);
      say('Got it. Opening your medication…');
      stop();
      window.location.href = logPath(text);
      return true;
    }
    function loadJsQR() {
      return new Promise(function (res, rej) {
        if (window.jsQR) return res();
        var sc = document.createElement('script');
        sc.src = '/static/vendor/jsQR.js'; sc.onload = res; sc.onerror = rej;
        document.head.appendChild(sc);
      });
    }
    function tick() {
      if (!stream) return;
      var next = function () { if (stream) timer = setTimeout(tick, 150); };
      if (video.readyState < 2 || !video.videoWidth) return next();
      if (detector) {
        detector.detect(video).then(function (codes) {
          if (codes.length && found(codes[0].rawValue)) return;
          next();
        }).catch(next);
        return;
      }
      var w = 480, h = Math.round(video.videoHeight * (w / video.videoWidth));
      if (!canvas) { canvas = document.createElement('canvas'); ctx = canvas.getContext('2d', { willReadFrequently: true }); }
      canvas.width = w; canvas.height = h;
      ctx.drawImage(video, 0, 0, w, h);
      var code = window.jsQR(ctx.getImageData(0, 0, w, h).data, w, h, { inversionAttempts: 'dontInvert' });
      if (code && code.data && found(code.data)) return;
      next();
    }
    function open(btn) {
      opener = btn;
      box.hidden = false; document.body.classList.add('scanning');
      say('');
      document.getElementById('scan-close').focus();
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        say("This browser can't open the camera here. Use your Camera app, or open your log below.", true);
        return;
      }
      var ready = ('BarcodeDetector' in window)
        ? window.BarcodeDetector.getSupportedFormats().then(function (f) {
            if (f.indexOf('qr_code') > -1) detector = new window.BarcodeDetector({ formats: ['qr_code'] });
            else return loadJsQR();
          }).catch(loadJsQR)
        : loadJsQR();
      Promise.all([ready, navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false })])
        .then(function (r) {
          if (box.hidden) { r[1].getTracks().forEach(function (t) { t.stop(); }); return; }
          stream = r[1]; video.srcObject = stream;
          var p = video.play(); if (p && p.catch) p.catch(function () {});
          tick();
        })
        .catch(function (err) {
          var denied = err && (err.name === 'NotAllowedError' || err.name === 'SecurityError');
          say(denied
            ? 'Camera access is off. Tap Allow when asked, or use your Camera app to scan the sticker.'
            : "The camera couldn't start. Use your Camera app to scan the sticker, or open your log below.", true);
        });
    }
    document.querySelectorAll('[data-scan]').forEach(function (b) {
      b.addEventListener('click', function () { open(b); });
    });
    document.getElementById('scan-close').addEventListener('click', close);
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !box.hidden) close(); });
    document.addEventListener('visibilitychange', function () { if (document.hidden && !box.hidden) close(); });
  }
})();
