// All settings come from environment variables (Heroku: Settings > Config Vars).
// Nothing here is secret; the app stores no patient data.
const config = {
  brandName: process.env.BRAND_NAME || 'KODAMANTRO',
  medLabel: process.env.MED_LABEL || 'your medication',
  medStrength: process.env.MED_STRENGTH || '200 mg tablet',
  shortcutName: process.env.SHORTCUT_NAME || 'Log My Dose',
  // iCloud share link of the shortcut, e.g. https://www.icloud.com/shortcuts/abc123
  shortcutIcloudUrl: process.env.SHORTCUT_ICLOUD_URL || '',
  // Public base URL, e.g. https://dose-kit-poc.herokuapp.com. If unset, taken from each request.
  appUrl: (process.env.APP_URL || '').replace(/\/$/, ''),
};

config.runShortcutUrl = `shortcuts://run-shortcut?name=${encodeURIComponent(config.shortcutName)}`;
// Deep link into Health > Medications (undocumented by Apple; override with HEALTH_URL).
config.healthUrl = process.env.HEALTH_URL || 'x-apple-health://MedicationsHealthAppPlugin.healthplugin';

// Name of the medication exactly as it appears in Health (case sensitive). When set, the
// sticker opens Health's Log Dose sheet for it directly. A sticker can also carry ?med=Name.
config.medHealthName = process.env.MED_HEALTH_NAME || '';
config.logDoseUrl = (name) =>
  `x-apple-health://MedicationsHealthAppPlugin.healthplugin/logDose?presentWithAnimation=1&medicationName=${encodeURIComponent(name)}`;

module.exports = config;
