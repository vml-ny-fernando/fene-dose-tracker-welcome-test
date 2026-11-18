// HTML pages as plain template functions. Every value from config is escaped.
const esc = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function layout({ title, body, arm = '', bodyClass = '' }) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="robots" content="noindex">
<title>${esc(title)}</title>
<link rel="stylesheet" href="/static/styles.css">
</head>
<body class="${bodyClass}" data-arm="${esc(arm)}">
${body}
<script src="/static/app.js" defer></script>
</body>
</html>`;
}

function slide({ id, label, title, manual, children, primary, nextText = 'Done, next' }) {
  return `<section class="slide" id="${id}" data-slide="${id}" aria-label="${esc(label)}">
  <div class="slide-inner">
    <p class="kicker">${label}${manual ? ' <span class="tag">In the Health app</span>' : ''}</p>
    <h2>${title}</h2>
    <div class="slide-body">${children}</div>
  </div>
  <div class="slide-actions">
    ${primary || ''}
    <button type="button" class="btn ${primary ? 'ghost' : ''}" data-next>${nextText}</button>
  </div>
</section>`;
}

function setup({ config, arm }) {
  const med = esc(config.medLabel);
  const sc = esc(config.shortcutName);
  const showNfc = arm !== 'a';
  const showQr = arm !== 'b';

  const install = config.shortcutIcloudUrl
    ? `<a class="btn" data-event="install_tapped" href="${esc(config.shortcutIcloudUrl)}">Install "${sc}"</a>`
    : '';
  const installNote = config.shortcutIcloudUrl
    ? ''
    : '<p class="notice">The install link isn\'t set yet. Add SHORTCUT_ICLOUD_URL in Heroku config vars.</p>';

  const nfc = `<div class="variant">
    ${showQr ? '<h3>If your sticker says "Tap here"</h3>' : ''}
    <ol>
      <li>In <b>Shortcuts</b>, tap <b>Automation</b>, then <b>New Automation</b>.</li>
      <li>Choose <b>NFC</b>, tap <b>Scan</b>, and hold your iPhone to the sticker.</li>
      <li>Choose <b>Run Immediately</b>, pick <b>${sc}</b>, and tap <b>Done</b>.</li>
    </ol>
  </div>`;
  const qr = `<div class="variant">
    ${showNfc ? '<h3>If your sticker has a QR code</h3>' : ''}
    <p>Nothing to set up. Each day, point your Camera at the sticker and tap the banner.</p>
  </div>`;

  const slides = [
    slide({
      id: 'welcome', label: 'Welcome', title: 'Set up your daily dose reminder',
      children: `<p class="big">5 quick steps, about 6 minutes.</p>
        <ul class="checks"><li>Your medication box</li><li>Your dose sticker</li><li>Your iPhone</li></ul>
        <p class="hint">Swipe or tap the button to move between steps.</p>`,
      nextText: 'Let\'s start',
    }),
    slide({
      id: 'add', label: 'Step 1 of 5', title: `Add ${med} to Health`, manual: true,
      children: `<ol>
        <li>In Health, tap <b>Search</b>, then <b>Medications</b>.</li>
        <li>Tap <b>Add a Medication</b> and scan the label or type the name.</li>
        <li>Choose <b>${esc(config.medStrength)}</b>.</li>
        <li>Set <b>Every Day</b> and your usual time. Tap <b>Done</b>.</li>
      </ol>`,
      primary: `<a class="btn" href="${config.healthUrl}">Open Health</a>`,
    }),
    slide({
      id: 'remind', label: 'Step 2 of 5', title: 'Turn on reminders', manual: true,
      children: `<ol>
        <li>In Health, open ${med} and scroll to <b>Options</b>.</li>
        <li>Turn on <b>Dose Reminders</b> and <b>Follow-up Reminders</b>.</li>
        <li>Tap <b>Add to Favorites</b>.</li>
      </ol>
      <p class="hint">Each reminder has a <b>Taken</b> button. That's the quickest way to log.</p>`,
      primary: `<a class="btn" href="${config.healthUrl}">Open Health</a>`,
    }),
    slide({
      id: 'install', label: 'Step 3 of 5', title: `Add the "${sc}" shortcut`,
      children: `<ol><li>Tap <b>Install</b> below.</li><li>Tap <b>Add Shortcut</b>. Keep the name as it is.</li></ol>${installNote}`,
      primary: install,
    }),
    slide({
      id: 'sticker', label: 'Step 4 of 5', title: 'Set up your sticker',
      children: `${showNfc ? nfc : ''}${showQr ? qr : ''}`,
    }),
    slide({
      id: 'test', label: 'Step 5 of 5', title: 'Stick it up and try it',
      children: `<ol>
        <li>Put the sticker where you keep your medication.</li>
        <li>${showNfc && !showQr ? 'Hold your iPhone to it' : showQr && !showNfc ? 'Scan it with the Camera' : 'Tap or scan it'}. If asked, tap <b>Allow</b>.</li>
        <li>In Health, tap <b>Log</b>, then <b>Taken</b>.</li>
      </ol>`,
      primary: `<a class="btn ghost" data-event="test_tapped" href="${esc(config.runShortcutUrl)}">Test the shortcut</a>`,
      nextText: 'Finish',
    }),
    `<section class="slide done-slide" id="finish" data-slide="finish" aria-label="All set">
  <div class="slide-inner">
    <div class="done-mark" aria-hidden="true">&#10003;</div>
    <h2>You're all set</h2>
    <p class="big">Each day, tap <b>Taken</b> on your reminder. Or use your sticker, then tap <b>Log</b> and <b>Taken</b>.</p>
    <p class="hint">Your doses are saved only in the Health app on your iPhone. This page collects no personal or health information.</p>
  </div>
  <div class="slide-actions"><button type="button" class="btn ghost" data-restart>Start over</button></div>
</section>`,
  ];

  const body = `<div class="pager-app">
  <header class="topbar">
    <span class="brand">${esc(config.brandName)}</span>
    <ol class="dots" aria-label="Progress">${slides.map((_, i) => `<li><button type="button" data-go="${i}" aria-label="Go to screen ${i + 1}"></button></li>`).join('')}</ol>
  </header>
  <main class="pager" id="pager" tabindex="-1">${slides.join('')}</main>
  <nav class="pager-nav" aria-label="Step navigation">
    <button type="button" class="navbtn" data-prev aria-label="Previous step">&#8249; Back</button>
    <span class="pos" id="pos">1 / ${slides.length}</span>
  </nav>
</div>`;
  return layout({ title: `${config.brandName} setup`, body, arm, bodyClass: 'setup' });
}

function tap({ config, arm }) {
  const med = esc(config.medLabel);
  const body = `<div class="pager-app">
  <header class="topbar"><span class="brand">${esc(config.brandName)}</span></header>
  <main class="single">
    <section class="slide">
      <div class="slide-inner">
        <p class="kicker">Daily dose</p>
        <h2>Log today's dose</h2>
        <p class="big">Tap below. Health opens. Then tap <b>Log</b> next to ${med}, and <b>Taken</b>.</p>
        <p class="hint">Want this to skip straight to Health next time? <a href="/?arm=${esc(arm || 'b')}#sticker">Link your sticker</a> (30 seconds).</p>
      </div>
      <div class="slide-actions">
        <a class="btn" data-event="tap_run_tapped" href="${esc(config.runShortcutUrl)}">Log my dose</a>
        <a class="btn ghost" href="${config.healthUrl}">Open Health instead</a>
      </div>
    </section>
  </main>
</div>`;
  return layout({ title: 'Log today\'s dose', body, arm, bodyClass: 'tap' });
}

function kit({ config, base }) {
  const body = `<main class="wrap print">
  <header class="hero">
    <p class="eyebrow">Print and test</p>
    <h1>${esc(config.brandName)} print sheet</h1>
    <p class="lead">Print this page at 100% scale. Cut out the cards. QR codes are generated for <code>${esc(base)}</code>.</p>
  </header>
  <div class="cards">
    <figure class="card">
      <img src="/qr/start-a.svg" alt="QR code to the setup page, group A">
      <figcaption><b>Start card · Group A (QR sticker)</b><br>Opens ${esc(base)}/?arm=a</figcaption>
    </figure>
    <figure class="card">
      <img src="/qr/start-b.svg" alt="QR code to the setup page, group B">
      <figcaption><b>Start card · Group B (NFC sticker)</b><br>Opens ${esc(base)}/?arm=b</figcaption>
    </figure>
    <figure class="card">
      <img src="/qr/sticker.svg" alt="QR code that runs the shortcut">
      <figcaption><b>Dose sticker · Group A</b><br>Runs the "${esc(config.shortcutName)}" shortcut</figcaption>
    </figure>
    <div class="card nfc-card">
      <div class="nfc-mark">TAP<br>HERE</div>
      <p><b>Dose sticker · Group B (NFC)</b></p>
      <p>Write one URL record to the NFC tag (NTAG213 or similar) with an app like NFC Tools:</p>
      <code>${esc(base)}/tap?arm=b</code>
      <p class="hint">Patients who did the step 4 automation never see this link. It catches anyone who skipped it.</p>
    </div>
  </div>
</main>`;
  return layout({ title: 'Print sheet', body, bodyClass: 'kit' });
}

module.exports = { setup, tap, kit, esc };
