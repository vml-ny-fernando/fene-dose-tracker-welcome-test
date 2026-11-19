const { test, before, after } = require('node:test');
const assert = require('node:assert');
const app = require('../server');

const IPHONE = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148';
const ANDROID = 'Mozilla/5.0 (Linux; Android 15; Pixel 9) AppleWebKit/537.36 Chrome/130 Mobile Safari/537.36';

let server, base;
before(() => new Promise((r) => { server = app.listen(0, () => { base = `http://127.0.0.1:${server.address().port}`; r(); }); }));
after(() => server.close());
const get = (path, ua) => fetch(base + path, { headers: ua ? { 'user-agent': ua } : {} });

test('setup detects the phone and offers a switch link', async () => {
  const ios = await (await get('/', IPHONE)).text();
  assert.match(ios, /Add a Medication/);
  assert.match(ios, /Switch to Android steps/);
  const android = await (await get('/', ANDROID)).text();
  assert.match(android, /Set a daily reminder/);
  assert.doesNotMatch(android, /Add a Medication/);
  const forced = await (await get('/?device=android', IPHONE)).text();
  assert.match(forced, /Set a daily reminder/);
});

test('decal page sends iPhone to Health and gives Android a dose log', async () => {
  assert.match(await (await get('/log', IPHONE)).text(), /data-autolaunch[^>]*x-apple-health:/);
  assert.match(await (await get('/log', ANDROID)).text(), /I took my dose/);
  assert.match(await (await get('/log')).text(), /I have an iPhone/);
});

test('QR codes, kit page and old link', async () => {
  for (const q of ['start', 'decal']) {
    const r = await get(`/qr/${q}.svg`);
    assert.strictEqual(r.status, 200);
    assert.match(r.headers.get('content-type'), /svg/);
  }
  assert.strictEqual((await get('/qr/nope.svg')).status, 404);
  assert.match(await (await get('/kit')).text(), /\/log/);
  const old = await fetch(base + '/tap', { redirect: 'manual' });
  assert.strictEqual(old.status, 302);
});

test('/log opens the Log Dose sheet when a medication name is given', async () => {
  const app = require('../server');
  const srv = app.listen(0); const port = srv.address().port;
  try {
    const r = await fetch(`http://127.0.0.1:${port}/log?device=ios&med=WPPRX002`);
    const html = await r.text();
    require('node:assert').ok(html.includes('x-apple-health://MedicationsHealthAppPlugin.healthplugin/logDose?presentWithAnimation=1&amp;medicationName=WPPRX002'));
    const q = await fetch(`http://127.0.0.1:${port}/qr/decal.svg?med=WPPRX002`);
    require('node:assert').equal(q.status, 200);
  } finally { srv.close(); }
});
