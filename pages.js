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

// Every step screen has the same frame: a header row (step number, where it happens, completed tag),
// a heading, the instructions, and a fixed two-button action area pinned to the bottom
// (filled action button on top, outlined "Done, next" below).
function slide({ id, label, where, title, children, primary, nextText = 'Done, next' }) {
  return `<section class="slide" id="${id}" data-slide="${id}" data-step="${id}" aria-label="${esc(label)}">
  <div class="slide-inner">
    <div class="slide-head">
      <p class="kicker"><span>${label}</span><span class="kicker-sep" aria-hidden="true">/</span><span>${where}</span></p>
      <span class="done-tag" data-done-tag hidden>&#10003; Done</span>
    </div>
    <h2>${title}</h2>
    <div class="slide-body">${children}</div>
  </div>
  <div class="slide-actions">
    ${primary || ''}
    <button type="button" class="btn ${primary ? 'ghost' : ''}" data-next>${nextText}</button>
  </div>
</section>`;
}

const STEPS = [
  { id: 'add', short: 'Add', long: 'Add your medication' },
  { id: 'remind', short: 'Remind', long: 'Turn on reminders' },
  { id: 'install', short: 'Install', long: 'Add the shortcut' },
  { id: 'sticker', short: 'Sticker', long: 'Set up your sticker' },
  { id: 'test', short: 'Test', long: 'Try it once' },
];

function setup({ config, arm }) {
  const med = esc(config.medLabel);
  const sc = esc(config.shortcutName);
  const showNfc = arm !== 'a';
  const showQr = arm !== 'b';

  const install = config.shortcutIcloudUrl
    ? `<a class="btn" data-complete data-event="install_tapped" href="${esc(config.shortcutIcloudUrl)}">Install "${sc}"</a>`
    : `<button type="button" class="btn" disabled>Install "${sc}"</button>`;
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
    `<section class="slide splash" id="welcome" data-slide="welcome" aria-label="Welcome">
  <svg class="splash-art" viewBox="0 0 400 800" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">
    <polygon points="-40,0 120,0 440,560 440,800 360,800 -40,100" class="a1"/>
    <polygon points="440,0 280,0 -40,560 -40,800 40,800 440,100" class="a2"/>
    <polygon points="0,330 140,400 0,470" class="a3"/>
    <polygon points="400,330 260,400 400,470" class="a3"/>
    <line x1="24" y1="352" x2="376" y2="352" class="rule"/>
    <line x1="24" y1="512" x2="376" y2="512" class="rule"/>
  </svg>
  <div class="splash-inner">
    <p class="splash-brand">${esc(config.brandName)}</p>
    <div class="splash-copy">
      <h1>Welcome Kit</h1>
      <p class="splash-sub">Engineered For Your Routine</p>
    </div>
    <div class="splash-actions">
      <button type="button" class="btn" data-next>Get started</button>
      <p class="splash-note">5 quick steps · about 6 minutes</p>
    </div>
  </div>
</section>`,
    slide({
      id: 'add', label: 'Step 1 of 5', where: 'In Health', title: `Add ${med} to Health`,
      children: `<ol>
        <li>Tap <b>Add my medication</b>. Health opens on Medications.</li>
        <li>Tap <b>Add a Medication</b>, then scan the label or type the name.</li>
        <li>Enter your own dose from your prescription, like <b>${esc(config.medStrength)}</b>.</li>
        <li>Set how often and what time you take it. Tap <b>Done</b>.</li>
      </ol>`,
      primary: `<a class="btn" data-complete href="${config.healthUrl}">Add my medication</a>`,
    }),
    slide({
      id: 'remind', label: 'Step 2 of 5', where: 'In Health', title: 'Turn on reminders',
      children: `<ol>
        <li>In Health, open ${med} and scroll to <b>Options</b>.</li>
        <li>Turn on <b>Dose Reminders</b> and <b>Follow-up Reminders</b>.</li>
        <li>Tap <b>Add to Favorites</b>.</li>
      </ol>
      <p class="hint">Each reminder has a <b>Taken</b> button. That's the quickest way to log.</p>`,
      primary: `<a class="btn" data-complete href="${config.healthUrl}">Open Health</a>`,
    }),
    slide({
      id: 'install', label: 'Step 3 of 5', where: 'On this page', title: `Add the "${sc}" shortcut`,
      children: `<ol><li>Tap <b>Install</b> below.</li><li>Tap <b>Add Shortcut</b>. Keep the name as it is.</li></ol>${installNote}`,
      primary: install,
    }),
    slide({
      id: 'sticker', label: 'Step 4 of 5', where: arm === 'a' ? 'With your sticker' : 'In Shortcuts', title: 'Set up your sticker',
      children: `${showNfc ? nfc : ''}${showQr ? qr : ''}`,
      primary: showNfc ? `<a class="btn" href="shortcuts://">Open Shortcuts</a>` : '',
    }),
    slide({
      id: 'test', label: 'Step 5 of 5', where: 'With your sticker', title: 'Stick it up and try it',
      children: `<ol>
        <li>Put the sticker where you keep your medication.</li>
        <li>${showNfc && !showQr ? 'Hold your iPhone to it' : showQr && !showNfc ? 'Scan it with the Camera' : 'Tap or scan it'}. If asked, tap <b>Allow</b>.</li>
        <li>In Health, tap <b>Log</b>, then <b>Taken</b>.</li>
      </ol>`,
      primary: `<a class="btn" data-complete data-event="test_tapped" href="${esc(config.runShortcutUrl)}">Test the shortcut</a>`,
      nextText: 'Done, finish',
    }),
    `<section class="slide done-slide" id="finish" data-slide="finish" aria-label="All set">
  <div class="slide-inner">
    <div class="done-mark" aria-hidden="true"></div>
    <p class="kicker" id="finish-kicker">Setup summary</p>
    <h2 id="finish-title">You're all set</h2>
    <ul class="summary" aria-label="Setup steps">${STEPS.map((st, i) => `<li data-summary="${st.id}"><span class="sum-num">${String(i + 1).padStart(2, '0')}</span><span class="sum-label">${st.long}</span><span class="sum-state" data-sum-state>To do</span><button type="button" class="sum-go" data-go="${i + 1}" aria-label="Go back to step ${i + 1}: ${st.long}">Go</button></li>`).join('')}</ul>
    <p class="big">Each day, tap <b>Taken</b> on your reminder. Or use your sticker, then tap <b>Log</b> and <b>Taken</b>.</p>
    <p class="hint">Your doses are saved only in the Health app on your iPhone. This page collects no personal or health information.</p>
  </div>
  <div class="slide-actions"><button type="button" class="btn ghost" data-restart>Start over</button></div>
</section>`,
  ];

  const body = `<div class="pager-app">
  <header class="topbar">
    <span class="brand">${esc(config.brandName)}</span>
    <span class="tally" id="tally" aria-live="polite">0 of ${STEPS.length} done</span>
  </header>
  <nav class="stepper" aria-label="Setup steps">
    <ol>${STEPS.map((st, i) => `<li><button type="button" class="st" data-go="${i + 1}" data-st="${st.id}" aria-label="Step ${i + 1}: ${st.long}"><span class="st-num" aria-hidden="true">${i + 1}</span><span class="st-label">${st.short}</span><span class="st-state" data-st-state></span></button></li>`).join('')}</ol>
  </nav>
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
