// All settings come from environment variables (Heroku: Settings > Config Vars).
// Nothing here is secret; the app stores no patient data.
const config = {
  brandName: process.env.BRAND_NAME || 'Welcome Kit',
  medLabel: process.env.MED_LABEL || 'your medication',
  medStrength: process.env.MED_STRENGTH || '200 mg tablet',
  shortcutName: process.env.SHORTCUT_NAME || 'Log My Dose',
  // iCloud share link of the shortcut, e.g. https://www.icloud.com/shortcuts/abc123
  shortcutIcloudUrl: process.env.SHORTCUT_ICLOUD_URL || '',
  // Public base URL, e.g. https://dose-kit-poc.herokuapp.com. If unset, taken from each request.
  appUrl: (process.env.APP_URL || '').replace(/\/$/, ''),
};

config.runShortcutUrl = `shortcuts://run-shortcut?name=${encodeURIComponent(config.shortcutName)}`;
config.healthUrl = 'x-apple-health://';

module.exports = config;
