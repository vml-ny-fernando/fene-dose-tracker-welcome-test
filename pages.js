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

// Steps differ by phone. iPhone logs in Apple Health; Android has no built-in medication log,
// so Android patients get a calendar reminder and a simple dose log kept on their phone.
const STEPS = {
  ios: [
    { id: 'add', short: 'Add', long: 'Add your medication' },
    { id: 'remind', short: 'Remind', long: 'Turn on reminders' },
    { id: 'sticker', short: 'Sticker', long: 'Place your sticker and try it' },
  ],
  android: [
    { id: 'remind', short: 'Remind', long: 'Set a daily reminder' },
    { id: 'sticker', short: 'Sticker', long: 'Place your sticker and try it' },
  ],
};

function calendarUrl() {
  const q = new URLSearchParams({
    action: 'TEMPLATE',
    text: 'Take your medication',
    details: 'After your dose, scan the QR sticker to log it.',
    recur: 'RRULE:FREQ=DAILY',
  });
  return `https://calendar.google.com/calendar/render?${q.toString()}`;
}

function switchLink(device) {
  return device === 'android'
    ? '<a href="/?device=ios">Using an iPhone? Switch to iPhone steps</a>'
    : '<a href="/?device=android">Using an Android phone? Switch to Android steps</a>';
}

function setup({ config, device }) {
  const med = esc(config.medLabel);
  const isAndroid = device === 'android';
  const steps = STEPS[isAndroid ? 'android' : 'ios'];
  const n = steps.length;
  const of = (i) => `Step ${i} of ${n}`;

  const splash = `<section class="slide splash" id="welcome" data-slide="welcome" aria-label="Welcome">
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
    </div>
  </div>
</section>`;

  const iosSlides = [
    slide({
      id: 'add', label: of(1), where: 'In Health', title: `Add ${med} to Health`,
      children: `<ol>
        <li>Tap <b>Add my medication</b>. Health opens on Medications.</li>
        <li>Tap <b>Add a Medication</b>, then scan the label or type the name.</li>
        <li>Enter your own dose from your prescription, like <b>${esc(config.medStrength)}</b>.</li>
        <li>Set how often and what time you take it. Tap <b>Done</b>.</li>
      </ol>
      <p class="hint switch">${switchLink(device)}</p>`,
      primary: `<a class="btn" data-complete href="${esc(config.healthUrl)}">Add my medication</a>`,
    }),
    slide({
      id: 'remind', label: of(2), where: 'In Health', title: 'Turn on reminders',
      children: `<ol>
        <li>Tap <b>Open Health</b>. You'll see your list of medications.</li>
        <li>Scroll to the bottom of that list and tap <b>Options</b>.</li>
        <li>Turn on <b>Dose Reminders</b>. Turn on <b>Follow-up Reminders</b> too.</li>
      </ol>
      <p class="hint">Reminders arrive at the times you set in step 1. Each one has a <b>Taken</b> button, the quickest way to log.</p>`,
      primary: `<a class="btn" data-complete href="${esc(config.healthUrl)}">Open Health</a>`,
    }),
    slide({
      id: 'sticker', label: of(3), where: 'With your sticker', title: 'Place your sticker and try it',
      children: `<ol>
        <li>Put the QR sticker where you keep your medication.</li>
        <li>Tap <b>Scan my sticker</b> and point the camera at it.</li>
        <li>Tap <b>Open</b> if asked. Health opens on Medications.</li>
        <li>Tap <b>Log</b> next to ${med}, then <b>Taken</b>.</li>
      </ol>
      <p class="hint">After today, just scan the sticker with your Camera app.</p>`,
      primary: `<button type="button" class="btn" data-complete data-scan data-event="test_tapped">Scan my sticker</button>`,
      nextText: 'Done, finish',
    }),
  ];

  const androidSlides = [
    slide({
      id: 'remind', label: of(1), where: 'In Calendar', title: 'Set a daily reminder',
      children: `<ol>
        <li>Tap <b>Add reminder</b>. A daily calendar event opens.</li>
        <li>Set the time you usually take ${med}.</li>
        <li>Check it repeats <b>Every day</b>, then tap <b>Save</b>.</li>
      </ol>
      <p class="hint">Samsung phone? You can also add ${med} in <b>Samsung Health</b> under <b>Medications</b>.</p>
      <p class="hint switch">${switchLink(device)}</p>`,
      primary: `<a class="btn" data-complete data-event="calendar_tapped" href="${esc(calendarUrl())}" target="_blank" rel="noopener">Add reminder</a>`,
    }),
    slide({
      id: 'sticker', label: of(2), where: 'With your sticker', title: 'Place your sticker and try it',
      children: `<ol>
        <li>Put the QR sticker where you keep your medication.</li>
        <li>Tap <b>Scan my sticker</b> and point the camera at it.</li>
        <li>Tap <b>I took my dose</b>. It's saved on this phone.</li>
      </ol>
      <p class="hint">After today, just scan the sticker with your Camera or Google Lens.</p>`,
      primary: `<button type="button" class="btn" data-complete data-scan data-event="test_tapped">Scan my sticker</button>`,
      nextText: 'Done, finish',
    }),
  ];

  const finish = `<section class="slide done-slide" id="finish" data-slide="finish" aria-label="All set">
  <div class="slide-inner">
    <p class="kicker" id="finish-kicker">Setup summary</p>
    <h2 id="finish-title">You're all set</h2>
    <ol class="summary" aria-label="Setup steps">${steps.map((st, i) => `<li data-summary="${st.id}">
      <button type="button" class="sum-row" data-go="${i + 1}">
        <span class="sum-num" aria-hidden="true">${i + 1}</span>
        <span class="sum-label">${st.long}</span>
        <span class="sum-state" data-sum-state>Finish &#8250;</span>
      </button>
    </li>`).join('')}</ol>
    <p class="big">${isAndroid
      ? 'Each day, when your reminder goes off, take your dose and scan your sticker.'
      : 'Each day, tap <b>Taken</b> on your reminder. Or scan your sticker, then tap <b>Log</b> and <b>Taken</b>.'}</p>
    <p class="hint">${isAndroid
      ? 'Your doses are saved only on this phone. This site collects no personal or health information.'
      : 'Your doses are saved only in the Health app on your iPhone. This site collects no personal or health information.'}</p>
  </div>
  <div class="slide-actions"><button type="button" class="btn ghost" data-restart>Start over</button></div>
</section>`;

  const slides = [splash, ...(isAndroid ? androidSlides : iosSlides), finish];

  const body = `<div class="pager-app">
  <header class="topbar">
    <span class="brand">${esc(config.brandName)}</span>
    <ol class="progress-dots" aria-label="Progress">${steps.map((st, i) => `<li data-dot="${st.id}"><span class="sr" data-dot-state>Step ${i + 1}: not started</span></li>`).join('')}</ol>
  </header>
  <nav class="stepper" aria-label="Setup steps">
    <ol style="grid-template-columns:repeat(${n},1fr)">${steps.map((st, i) => `<li><button type="button" class="st" data-go="${i + 1}" data-st="${st.id}" aria-label="Step ${i + 1}: ${st.long}"><span class="st-num" aria-hidden="true">${i + 1}</span><span class="st-label">${st.short}</span><span class="st-state" data-st-state></span></button></li>`).join('')}</ol>
  </nav>
  <main class="pager" id="pager" tabindex="-1">${slides.join('')}</main>
</div>
<div class="scanner" id="scanner" role="dialog" aria-modal="true" aria-labelledby="scan-title" hidden>
  <video id="scan-video" playsinline muted autoplay></video>
  <div class="scan-frame" aria-hidden="true"></div>
  <div class="scan-bar">
    <p class="scan-title" id="scan-title">Point your camera at the sticker</p>
    <p class="scan-msg" id="scan-msg" role="status" aria-live="polite"></p>
    <a class="btn ghost scan-alt" id="scan-alt" href="/log?device=${device}" hidden>Open my log without scanning</a>
    <button type="button" class="btn ghost" id="scan-close">Cancel</button>
  </div>
</div>`;
  return layout({ title: `${config.brandName} setup`, body, arm: device, bodyClass: `setup device-${device}` });
}

// The page the QR decal opens. One printed code for every phone.
function log({ config, device, medName = '' }) {
  const med = esc(config.medLabel);
  const shell = (kicker, title, inner, actions) => `<div class="pager-app">
  <header class="topbar"><span class="brand">${esc(config.brandName)}</span></header>
  <main class="single">
    <section class="slide">
      <div class="slide-inner">
        <div class="slide-head"><p class="kicker"><span>${kicker}</span></p></div>
        <h2>${title}</h2>
        ${inner}
      </div>
      <div class="slide-actions">${actions}</div>
    </section>
  </main>
</div>`;

  if (device === 'ios') {
    const body = shell('Daily dose', "Log today's dose",
      medName
        ? `<p class="big">Health is opening to log ${esc(medName)}. Tap <b>Open</b> if asked, then tap <b>Taken</b>.</p>
       <p class="hint">Nothing happened? Tap the button below.</p>`
        : `<p class="big">Health is opening. Tap <b>Open</b> if asked, then tap <b>Log</b> next to ${med}, and <b>Taken</b>.</p>
       <p class="hint">Nothing happened? Tap the button below.</p>`,
      `<a class="btn" id="open-health" data-autolaunch data-event="log_open_health" href="${esc(medName ? config.logDoseUrl(medName) : config.healthUrl)}">${medName ? 'Log my dose' : 'Open Health'}</a>
       <a class="btn ghost" href="/?device=ios">Setup help</a>`);
    return layout({ title: "Log today's dose", body, arm: 'ios', bodyClass: 'tap' });
  }

  if (device === 'android') {
    const body = shell('Daily dose', "Log today's dose",
      `<div class="dose-log" id="dose-log">
         <p class="big" id="dose-status">You haven't logged a dose today.</p>
         <ol class="week" id="dose-week" aria-label="Last 7 days"></ol>
         <p class="hint">Saved only on this phone, in this browser. Clearing browser data removes it.</p>
       </div>`,
      `<button type="button" class="btn" id="dose-take" data-event="log_taken">I took my dose</button>
       <button type="button" class="btn ghost" id="dose-undo" hidden>Undo today's log</button>`);
    return layout({ title: "Log today's dose", body, arm: 'android', bodyClass: 'tap' });
  }

  const body = shell('Daily dose', 'Open this on your phone',
    `<p class="big">Scan the sticker with your phone's camera to log a dose.</p>`,
    `<a class="btn" href="/log?device=ios">I have an iPhone</a>
     <a class="btn ghost" href="/log?device=android">I have an Android phone</a>`);
  return layout({ title: "Log today's dose", body, bodyClass: 'tap' });
}

function kit({ config, base }) {
  const body = `<main class="wrap print">
  <header class="hero">
    <p class="eyebrow">Print and test</p>
    <h1>${esc(config.brandName)} print sheet</h1>
    <p class="lead">Print at 100% scale and cut out. Both codes work on iPhone and Android. QR codes point to <code>${esc(base)}</code>.</p>
  </header>
  <div class="cards">
    <figure class="card">
      <img src="/qr/start.svg" alt="QR code to the setup page">
      <figcaption><b>Start card</b><br>Opens setup: ${esc(base)}/</figcaption>
    </figure>
    <figure class="card">
      <img src="/qr/decal.svg" alt="QR code for the dose decal">
      <figcaption><b>Dose decal</b><br>Logs a dose: ${esc(base)}/log</figcaption>
    </figure>
  </div>
</main>`;
  return layout({ title: 'Print sheet', body, bodyClass: 'kit' });
}

module.exports = { setup, log, kit, esc, calendarUrl };
