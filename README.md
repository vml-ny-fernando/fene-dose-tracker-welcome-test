# Dose Kit proof of concept

A tiny Node app for testing a Welcome Kit that helps patients set up medication reminders and log doses by scanning a QR decal, on iPhone and Android. It stores no patient data on the server.

## Pages

| Path | What it is |
| --- | --- |
| `/` | Mobile setup page the Start card opens. Detects iPhone or Android; `?device=ios` or `?device=android` overrides |
| `/log` | The page the QR dose decal opens. iPhone: opens Apple Health on Medications. Android: a simple dose log kept on the phone. Desktop: asks which phone |
| `/kit` | Printable sheet with the Start card QR and the dose decal QR |
| `/qr/start.svg`, `/qr/decal.svg` | QR images |

One printed decal works for both phones because it holds a normal web link (`/log`) and the page decides what to do.

## What the phones allow

- **iPhone:** apps and shortcuts can't add a medication to Health or mark a dose as taken. The patient adds the medication in Health once, and each scan opens Health on Medications so they tap Log, then Taken. No shortcut install is needed.
- **Android:** there is no built-in medication log like Apple Health's. Health Connect stores medication lists and prescriptions, not dose-taken events. So Android patients set a daily Google Calendar reminder and log doses on `/log`, saved in their browser. Samsung Health has its own Medications feature that Samsung owners can use too.

## Deploy to Heroku

1. Deploy tab > GitHub > connect this repo > Deploy Branch (main).
2. Optional Config Vars:

| Var | Example | What it does |
| --- | --- | --- |
| `APP_URL` | `https://your-app.herokuapp.com` | Address used in printed QR codes (otherwise taken from the request) |
| `BRAND_NAME` | `KODAMANTRO` | Shown on the splash screen and top bar |
| `MED_LABEL` | `your medication` | How the medication is named in the steps |
| `MED_STRENGTH` | `200 mg tablet` | Example dose shown in step 1 |
| `HEALTH_URL` | `x-apple-health://MedicationsHealthAppPlugin.healthplugin` | Link that opens Apple Health |

3. Open `/kit`, print, and test on an iPhone and an Android phone.

## Measurement

Anonymous lines go to the Heroku log (`heroku logs --tail`), such as `{"event":"decal_scan","device":"android"}`. No IP addresses, user agent strings or identifiers are logged. Events: `setup_view`, `step_done`, `test_tapped`, `calendar_tapped`, `decal_scan`, `log_open_health`, `log_taken`.

## Local run

```
npm install
npm start      # http://localhost:3000
npm test
```
