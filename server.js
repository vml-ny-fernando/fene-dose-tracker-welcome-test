const path = require('path');
const express = require('express');
const QRCode = require('qrcode');
const config = require('./config');
const pages = require('./pages');

const app = express();
app.set('trust proxy', true); // Heroku terminates TLS in front of the app

app.use('/static', express.static(path.join(__dirname, 'public'), { maxAge: '1h' }));

// Which phone? ?device=ios|android wins (the "switch" links), otherwise the browser's user agent.
function deviceOf(req) {
  const q = String(req.query.device || '').toLowerCase();
  if (q === 'ios' || q === 'android') return q;
  const ua = req.get('user-agent') || '';
  if (/android/i.test(ua)) return 'android';
  if (/iphone|ipad|ipod/i.test(ua) || (/macintosh/i.test(ua) && /mobile/i.test(ua))) return 'ios';
  return 'unknown';
}

function baseUrl(req) {
  return config.appUrl || `${req.protocol}://${req.get('host')}`;
}

// Anonymous event line for Heroku logs: no IP, no user agent string, no identifiers.
function logEvent(name, req) {
  console.log(JSON.stringify({ event: name, device: deviceOf(req), at: new Date().toISOString() }));
}

app.get('/', (req, res) => {
  logEvent('setup_view', req);
  const device = deviceOf(req);
  res.send(pages.setup({ config, device: device === 'unknown' ? 'ios' : device }));
});

// The QR decal points here: one printed code for iPhone and Android.
app.get('/log', (req, res) => {
  logEvent('decal_scan', req);
  res.set('Cache-Control', 'no-store').send(pages.log({ config, device: deviceOf(req) }));
});
app.get('/tap', (req, res) => res.redirect(302, '/log')); // old NFC fallback link

app.get('/kit', (req, res) => {
  res.send(pages.kit({ config, base: baseUrl(req) }));
});

// QR images: /qr/start.svg (Start card) and /qr/decal.svg (dose decal)
app.get('/qr/:which.svg', async (req, res, next) => {
  const base = baseUrl(req);
  const targets = { start: `${base}/`, decal: `${base}/log` };
  const text = targets[req.params.which];
  if (!text) return res.status(404).send('Unknown QR code');
  try {
    const svg = await QRCode.toString(text, { type: 'svg', errorCorrectionLevel: 'Q', margin: 2 });
    res.type('image/svg+xml').set('Cache-Control', 'public, max-age=300').send(svg);
  } catch (err) {
    next(err);
  }
});

// Small client-side events, same anonymous format.
app.post('/e/:name', (req, res) => {
  const allowed = new Set(['step_done', 'test_tapped', 'calendar_tapped', 'log_open_health', 'log_taken']);
  if (allowed.has(req.params.name)) logEvent(req.params.name, req);
  res.status(204).end();
});

app.get('/healthz', (req, res) => res.send('ok'));

if (require.main === module) {
  const port = process.env.PORT || 3000;
  app.listen(port, () => console.log(`dose-kit-poc listening on ${port}`));
}

module.exports = app;
