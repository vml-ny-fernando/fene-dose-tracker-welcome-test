# Dose Kit proof of concept

A tiny Node app for testing a Welcome Kit that helps iPhone patients set up medication reminders in Apple Health and log doses by scanning a QR sticker or tapping an NFC sticker. It stores no patient data.

## Pages

| Path | What it is |
| --- | --- |
| `/` | Mobile setup page the Start card opens. `?arm=a` = QR sticker group, `?arm=b` = NFC sticker group |
| `/tap` | Fallback page written to the NFC sticker, for patients who skipped the NFC automation |
| `/kit` | Printable sheet with the Start card QR codes (A and B), the QR dose sticker, and the URL to write to NFC tags |
| `/qr/start-a.svg`, `/qr/start-b.svg`, `/qr/sticker.svg` | QR images |

## What Apple allows (why there is still a tap in Health)

Apps and shortcuts cannot add a medication to Health or mark a dose as taken; that data is read-only for them in iOS 26. So the sticker runs a shortcut that opens Health, and the patient taps Log, then Taken. iPhone also ignores `shortcuts://` links on NFC tags, so NFC patients link the sticker once with a Shortcuts NFC automation (setup step 4).

## Deploy to Heroku

1. Create the app: Heroku dashboard > New > Create new app.
2. Deploy tab > GitHub > connect this repo > Deploy Branch (main).
3. Settings > Config Vars:

| Var | Example | Needed |
| --- | --- | --- |
| `SHORTCUT_ICLOUD_URL` | `https://www.icloud.com/shortcuts/…` | Yes, for step 3 |
| `APP_URL` | `https://dose-kit-poc.herokuapp.com` | Recommended, so QR codes use the right address |
| `BRAND_NAME` | `Welcome Kit` | Optional |
| `MED_LABEL` | `your medication` | Optional |
| `MED_STRENGTH` | `200 mg tablet` | Optional |
| `SHORTCUT_NAME` | `Log My Dose` | Must match the shared shortcut's name |

4. Open `/kit`, print, and test on an iPhone.

## The shortcut

Build it once in the Shortcuts app on a test or company Apple ID: one action, **Open App > Health**, named exactly as `SHORTCUT_NAME`. Then Share > Copy iCloud Link and paste it into `SHORTCUT_ICLOUD_URL`.

## A/B measurement

The app writes anonymous lines to the Heroku log (`heroku logs --tail`), such as `{"event":"step_done","arm":"b"}`. No IP addresses, device details or identifiers are logged. Events: `setup_view`, `step_done`, `install_tapped`, `test_tapped`, `tap_fallback_view`, `tap_run_tapped`.

## Local run

```
npm install
npm start      # http://localhost:3000
npm test
```
