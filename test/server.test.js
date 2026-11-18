const { test, before, after } = require('node:test');
const assert = require('node:assert');
const app = require('../server');

let server, base;
before(() => new Promise((r) => { server = app.listen(0, () => { base = `http://127.0.0.1:${server.address().port}`; r(); }); }));
after(() => server.close());

test('setup page shows NFC steps only for arm b', async () => {
  const b = await (await fetch(`${base}/?arm=b`)).text();
  assert.match(b, /New Automation/);
  assert.doesNotMatch(b, /If your sticker has a QR code/);
  const a = await (await fetch(`${base}/?arm=a`)).text();
  assert.doesNotMatch(a, /New Automation/);
});

test('sticker QR is an SVG', async () => {
  const r = await fetch(`${base}/qr/sticker.svg`);
  assert.strictEqual(r.status, 200);
  assert.match(r.headers.get('content-type'), /svg/);
});

test('unknown QR is 404, tap and kit pages load', async () => {
  assert.strictEqual((await fetch(`${base}/qr/nope.svg`)).status, 404);
  assert.match(await (await fetch(`${base}/tap`)).text(), /Log my dose/);
  assert.match(await (await fetch(`${base}/kit`)).text(), /tap\?arm=b/);
});
