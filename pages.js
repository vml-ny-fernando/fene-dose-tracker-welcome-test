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

function step({ id, n, title, time, manual, children }) {
  return `<section class="step" id="${id}" data-step="${id}">
  <header class="step-head">
    <span class="step-num" aria-hidden="true">${n}</span>
    <div>
      <h2>${title}</h2>
      <p class="step-meta">${time}${manual ? ' · <span class="tag">You do this in Health</span>' : ''}</p>
    </div>
  </header>
  <div class="step-body">${children}</div>
  <label class="done"><input type="checkbox" id="done-${id}" data-done="${id}"> I've done this step</label>
</section>`;
}

function setup({ config, arm }) {
  const med = esc(config.medLabel);
  const sc = esc(config.shortcutName);
  const showNfc = arm !== 'a';
  const showQr = arm !== 'b';

  const install = config.shortcutIcloudUrl
    ? `<a class="btn" data-event="install_tapped" href="${esc(config.shortcutIcloudUrl)}">Install "${sc}"</a>`
    : `<p class="notice">The install link isn't set yet. Add SHORTCUT_ICLOUD_URL in Heroku config vars.</p>`;

  const nfc = `<div class="variant">
    ${showQr ? '<h3>If your sticker says "Tap here"</h3>' : ''}
    <ol>
      <li>Open the <b>Shortcuts</b> app and tap <b>Automation</b> at the bottom.</li>
      <li>Tap <b>New Automation</b> (or <b>+</b>), then choose <b>NFC</b>.</li>
      <li>Tap <b>Scan</b> and hold the top of your iPhone to the sticker. Name it "Dose sticker".</li>
      <li>Choose <b>Run Immediately</b>, then pick <b>${sc}</b> and tap <b>Done</b>.</li>
    </ol>
    <p class="hint">iPhone needs this one-time link before a sticker tap can open the shortcut.</p>
  </div>`;

  const qr = `<div class="variant">
    ${showNfc ? '<h3>If your sticker has a QR code</h3>' : ''}
    <p>Nothing to set up. Each day, open the Camera, point it at the sticker, and tap the banner that appears.</p>
  </div>`;

  const body = `<main class="wrap">
  <header class="hero">
    <p class="eyebrow">${esc(config.brandName)}</p>
    <h1>Set up your daily dose reminder</h1>
    <p class="lead">Five short steps, about 6 minutes. Keep your medication box and the dose sticker nearby.</p>
    <div class="progress" role="progressbar" aria-valuemin="0" aria-valuemax="5" aria-valuenow="0"><span></span></div>
    <p class="progress-label"><span id="done-count">0</span> of 5 done</p>
  </header>

  ${step({
    id: 'add', n: 1, title: `Add ${med} to the Health app`, time: 'About 2 minutes', manual: true,
    children: `<ol>
      <li>Tap <b>Open Health</b> below.</li>
      <li>Tap <b>Search</b>, then <b>Medications</b>, then <b>Add a Medication</b>.</li>
      <li>Tap the camera icon to scan the box label, or type the name.</li>
      <li>Choose <b>${esc(config.medStrength)}</b>.</li>
      <li>Set <b>Every Day</b> and the time you usually take it, then tap <b>Done</b>.</li>
    </ol>
    <a class="btn" href="${config.healthUrl}">Open Health</a>
    <p class="hint">Come back to this page when you're done. It remembers where you were.</p>`,
  })}

  ${step({
    id: 'remind', n: 2, title: 'Turn on reminders and pin it', time: 'About 30 seconds', manual: true,
    children: `<ol>
      <li>In Health, open ${med} and scroll down to <b>Options</b>.</li>
      <li>Make sure <b>Dose Reminders</b> is on. Turn on <b>Follow-up Reminders</b> too.</li>
      <li>Tap <b>Add to Favorites</b>. Your medication now shows at the top of Health.</li>
    </ol>
    <p class="hint">Each day the reminder has a <b>Taken</b> button. That's the quickest way to log.</p>`,
  })}

  ${step({
    id: 'install', n: 3, title: `Add the "${sc}" shortcut`, time: 'About 20 seconds',
    children: `<ol><li>Tap the button below.</li><li>Tap <b>Add Shortcut</b>. Keep the name as it is.</li></ol>${install}`,
  })}

  ${step({
    id: 'sticker', n: 4, title: 'Set up your dose sticker', time: arm === 'a' ? 'No setup needed' : 'About 30 seconds',
    children: `${showNfc ? nfc : ''}${showQr ? qr : ''}`,
  })}

  ${step({
    id: 'test', n: 5, title: 'Stick it up and try it', time: 'About 30 seconds',
    children: `<ol>
      <li>Put the sticker where you keep your medication, like the bathroom mirror.</li>
      <li>${showNfc && !showQr ? 'Hold your iPhone to it' : showQr && !showNfc ? 'Scan it with the Camera' : 'Tap or scan it'}. If asked, tap <b>Allow</b>.</li>
      <li>Health opens. Tap <b>Log</b> next to ${med}, then <b>Taken</b>.</li>
    </ol>
    <a class="btn ghost" data-event="test_tapped" href="${esc(config.runShortcutUrl)}">Or test the shortcut from here</a>`,
  })}

  <section class="finish" id="finish" hidden>
    <h2>You're all set</h2>
    <p>Each day: tap <b>Taken</b> on the reminder, or use your sticker and tap <b>Log</b>, then <b>Taken</b>.</p>
  </section>

  <footer class="foot">
    <p>This page doesn't collect personal or health information. Your doses are saved only in the Health app on your iPhone. Requires iPhone with iOS 18 or later.</p>
  </footer>
</main>`;
  return layout({ title: `${config.brandName} setup`, body, arm });
}

function tap({ config, arm }) {
  const med = esc(config.medLabel);
  const body = `<main class="wrap narrow">
  <header class="hero">
    <p class="eyebrow">${esc(config.brandName)}</p>
    <h1>Log today's dose</h1>
    <p class="lead">Tap below. Health opens, then tap <b>Log</b> next to ${med} and <b>Taken</b>.</p>
  </header>
  <a class="btn big" data-event="tap_run_tapped" href="${esc(config.runShortcutUrl)}">Log my dose</a>
  <a class="btn ghost" href="${config.healthUrl}">Open Health instead</a>
  <section class="step">
    <h2>Skip this page next time</h2>
    <p>Link your sticker once and a tap will open Health straight away.</p>
    <a class="btn ghost" href="/?arm=${esc(arm || 'b')}#sticker">Show me how (30 seconds)</a>
  </section>
</main>`;
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
