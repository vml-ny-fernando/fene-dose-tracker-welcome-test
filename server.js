const path = require('path');
const express = require('express');
const QRCode = require('qrcode');
const config = require('./config');
const pages = require('./pages');

const app = express();
app.set('trust proxy', true); // Heroku terminates TLS in front of the app

app.use('/static', express.static(path.join(__dirname, 'public'), { maxAge: '1h' }));

// A/B arm from ?arm=a (QR sticker) or ?arm=b (NFC sticker). Anything else = unknown.
function armOf(req) {
  const a = String(req.query.arm || '').toLowerCase();
  return a === 'a' || a === 'b' ? a : '';
}

function baseUrl(req) {
  return config.appUrl || `${req.protocol}://${req.get('host')}`;
}

// Anonymous event line for Heroku logs: no IP, no user agent, no identifiers.
function logEvent(name, req) {
  console.log(JSON.stringify({ event: name, arm: armOf(req) || 'none', at: new Date().toISOString() }));
}

app.get('/', (req, res) => {
  logEvent('setup_view', req);
  res.send(pages.setup({ config, arm: armOf(req) }));
});

app.get('/tap', (req, res) => {
  logEvent('tap_fallback_view', req);
  res.send(pages.tap({ config, arm: armOf(req) }));
});

app.get('/kit', (req, res) => {
  res.send(pages.kit({ config, base: baseUrl(req) }));
});

// QR images: /qr/start-a.svg, /qr/start-b.svg, /qr/sticker.svg
app.get('/qr/:which.svg', async (req, res, next) => {
  const base = baseUrl(req);
  const targets = {
    'start-a': `${base}/?arm=a`,
    'start-b': `${base}/?arm=b`,
    sticker: config.runShortcutUrl,
  };
  const text = targets[req.params.which];
  if (!text) return res.status(404).send('Unknown QR code');
  try {
    const svg = await QRCode.toString(text, { type: 'svg', errorCorrectionLevel: 'M', margin: 2 });
    res.type('image/svg+xml').set('Cache-Control', 'public, max-age=300').send(svg);
  } catch (err) {
    next(err);
  }
});

// Small client-side events (step ticked, test button pressed), same anonymous format.
app.post('/e/:name', (req, res) => {
  const allowed = new Set(['step_done', 'install_tapped', 'test_tapped', 'tap_run_tapped']);
  if (allowed.has(req.params.name)) logEvent(req.params.name, req);
  res.status(204).end();
});

app.get('/healthz', (req, res) => res.send('ok'));

if (require.main === module) {
  const port = process.env.PORT || 3000;
  app.listen(port, () => console.log(`dose-kit-poc listening on ${port}`));
}

module.exports = app;
