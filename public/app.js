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

  var pager = document.getElementById('pager');
  if (!pager) return;
  var slides = Array.prototype.slice.call(pager.querySelectorAll('.slide'));
  var stepIds = slides.filter(function (s) { return s.hasAttribute('data-step'); }).map(function (s) { return s.id; });
  var prev = document.querySelector('[data-prev]');
  var pos = document.getElementById('pos');
  var tally = document.getElementById('tally');
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
    if (tally) tally.textContent = count + ' of ' + stepIds.length + ' done';
    var curId = slides[current] ? slides[current].id : '';

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
      li.querySelector('[data-sum-state]').textContent = isDone ? 'Done' : 'To do';
      li.querySelector('.sum-go').hidden = isDone;
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
    prev.disabled = i === 0;
    pos.textContent = (i + 1) + ' / ' + slides.length;
    write(SLIDE_KEY, i);
    if (history.replaceState) history.replaceState(null, '', location.pathname + location.search + '#' + slides[i].id);
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
  prev.addEventListener('click', function () { go(current - 1); });
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

  // Start where the link points (#sticker) or where this phone left off.
  var hashIdx = slides.findIndex(function (s) { return '#' + s.id === location.hash; });
  var start = hashIdx > 0 ? hashIdx : Math.min(read(SLIDE_KEY, 0) || 0, slides.length - 1);
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
})();
