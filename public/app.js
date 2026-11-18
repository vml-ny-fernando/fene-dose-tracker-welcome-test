// Remembers ticked steps on this phone only, and sends anonymous step events.
(function () {
  var arm = document.body.getAttribute('data-arm') || '';
  var KEY = 'dose-kit-steps';
  var boxes = Array.prototype.slice.call(document.querySelectorAll('[data-done]'));

  function send(name) {
    try { navigator.sendBeacon('/e/' + name + (arm ? '?arm=' + arm : '')); } catch (e) {}
  }
  function load() {
    try { return JSON.parse(localStorage.getItem(KEY) || '{}'); } catch (e) { return {}; }
  }
  function save(state) {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {}
  }
  function render() {
    var done = 0;
    boxes.forEach(function (b) {
      var step = document.getElementById(b.getAttribute('data-done'));
      if (step) step.classList.toggle('is-done', b.checked);
      if (b.checked) done++;
    });
    var bar = document.querySelector('.progress');
    if (bar) {
      bar.setAttribute('aria-valuenow', done);
      bar.firstElementChild.style.width = (done / boxes.length) * 100 + '%';
    }
    var count = document.getElementById('done-count');
    if (count) count.textContent = done;
    var fin = document.getElementById('finish');
    if (fin) fin.hidden = done < boxes.length;
  }

  var state = load();
  boxes.forEach(function (b) {
    b.checked = !!state[b.getAttribute('data-done')];
    b.addEventListener('change', function () {
      state[b.getAttribute('data-done')] = b.checked;
      save(state);
      if (b.checked) send('step_done');
      render();
      if (b.checked) {
        var next = b.closest('.step').nextElementSibling;
        if (next && next.classList.contains('step')) next.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });
  document.querySelectorAll('[data-event]').forEach(function (a) {
    a.addEventListener('click', function () { send(a.getAttribute('data-event')); });
  });
  render();
})();
