// Swipeable step pager. Remembers the last screen on this phone only and sends anonymous events.
(function () {
  var arm = document.body.getAttribute('data-arm') || '';
  function send(name) {
    try { navigator.sendBeacon('/e/' + name + (arm ? '?arm=' + arm : '')); } catch (e) {}
  }
  document.querySelectorAll('[data-event]').forEach(function (a) {
    a.addEventListener('click', function () { send(a.getAttribute('data-event')); });
  });

  var pager = document.getElementById('pager');
  if (!pager) return;
  var slides = Array.prototype.slice.call(pager.querySelectorAll('.slide'));
  var dots = Array.prototype.slice.call(document.querySelectorAll('[data-go]'));
  var prev = document.querySelector('[data-prev]');
  var pos = document.getElementById('pos');
  var KEY = 'dose-kit-slide';
  var current = 0, maxSeen = 0;

  function store(i) { try { localStorage.setItem(KEY, String(i)); } catch (e) {} }
  function stored() { try { return parseInt(localStorage.getItem(KEY) || '0', 10) || 0; } catch (e) { return 0; } }

  function go(i, smooth) {
    i = Math.max(0, Math.min(slides.length - 1, i));
    pager.scrollTo({ left: i * pager.clientWidth, behavior: smooth === false ? 'auto' : 'smooth' });
  }
  function update(i) {
    if (i === current && pos.textContent) { /* still refresh below */ }
    current = i;
    if (i > maxSeen) maxSeen = i;
    dots.forEach(function (d, k) {
      if (k === i) d.setAttribute('aria-current', 'step'); else d.removeAttribute('aria-current');
      d.classList.toggle('seen', k < i);
    });
    prev.disabled = i === 0;
    pos.textContent = (i + 1) + ' / ' + slides.length;
    store(i);
    var id = slides[i].id;
    if (history.replaceState) history.replaceState(null, '', location.pathname + location.search + '#' + id);
  }

  var t;
  pager.addEventListener('scroll', function () {
    clearTimeout(t);
    t = setTimeout(function () {
      var i = Math.round(pager.scrollLeft / pager.clientWidth);
      if (i !== current) {
        if (i > current) send('step_done');
        update(i);
      }
    }, 80);
  }, { passive: true });

  document.querySelectorAll('[data-next]').forEach(function (b) {
    b.addEventListener('click', function () { go(current + 1); });
  });
  prev.addEventListener('click', function () { go(current - 1); });
  dots.forEach(function (d) {
    d.addEventListener('click', function () { go(parseInt(d.getAttribute('data-go'), 10)); });
  });
  var restart = document.querySelector('[data-restart]');
  if (restart) restart.addEventListener('click', function () { go(0); });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowRight') go(current + 1);
    if (e.key === 'ArrowLeft') go(current - 1);
  });
  window.addEventListener('resize', function () { go(current, false); });

  // Start where the link points (#sticker) or where this phone left off.
  var start = 0;
  var hashIdx = slides.findIndex(function (s) { return '#' + s.id === location.hash; });
  if (hashIdx > 0) start = hashIdx; else start = Math.min(stored(), slides.length - 1);
  current = -1;
  requestAnimationFrame(function () { window.scrollTo(0, 0); go(start, false); update(start); });
})();
