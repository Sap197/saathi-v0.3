# Saathi – student wellbeing app (prototype)

A clickable prototype of a student mental and physical wellbeing app, based on the ING Student Wellbeing Survey (41 responses). Built with plain HTML, CSS and JavaScript. No framework and no server.

## Run it

Serve the folder with any static server, then open the address it prints:

```bash
npx serve .            # or: python3 -m http.server 8080, or VS Code "Live Server"
```

Opening `index.html` directly also works, but then the service worker can't run, so offline mode and background notifications are off. GitHub Pages (the workflow below) serves it over https, which is what a phone needs to install it and show notifications.

All data is saved in the browser on your device (localStorage), so each person who opens it gets their own copy. A backend is being built separately (see `docs/backend/`).

## What's in version 0.3

- **Today** is the front page: thought for the day, the daily check-in (the check-in screen now opens from here instead of having its own tab), the two-week check, today's reminders and a "Try a tool" suggestion for focus or stress.
- **Reminders** for check-in, the two-week check, meditation, a work or study block, water and bedtime. They pop up with a chime and vibration inside the app, and ring as phone notifications when Saathi is in the background. When Saathi is fully closed, only the server (Web Push) or the Android app can ring the phone. Discreet mode makes notifications say only "You have a reminder".
- **Body**: bedtime and wake-up sliders for last night's sleep, tap-to-fill water glasses and a styled phone-time slider.
- **Emergency card**: the QR holds the card details as plain text, so any phone camera can read it with no internet. The card downloads as a PNG (85.6 × 54 mm at 300 dpi) or prints at real size. The QR library is in `js/vendor/`, so nothing loads from a CDN.
- **Colour wheel** in Settings, with Venice blue (#16587B) as the default. Colours are adjusted automatically so text stays readable in light and dark mode.
- **Reduce motion** now also covers the device setting, all transitions, the reminder pop-up and the breathing circle (which shows a countdown instead of growing).
- **Offline and installable** (PWA) through `sw.js` and `manifest.webmanifest`.

## Project structure

```
saathi/
├── index.html              Page layout, loads the CSS and JS files
├── sw.js                   Service worker: offline copy, notification taps, Web Push (later)
├── manifest.webmanifest    Makes it installable (icons in icons/, placeholders until the logo is chosen)
├── docs/backend/           Everything the backend developer needs
├── css/
│   └── styles.css          All styles: colours, light/dark themes, components
├── js/
│   ├── state.js            Saved data, preferences and app state
│   ├── data.js             Moods, prompts, PHQ-4 questions, helplines, icons
│   ├── helpers.js          Dates, score bands, toasts, navigation, sleep and slider helpers
│   ├── color.js            Colour maths and the colour wheel
│   ├── reminders.js        Reminder schedule, pop-up, chime, phone notifications
│   ├── medcard.js          Emergency card QR, PNG download and print
│   ├── vendor/qrcode.js    QR code generator (MIT, Kazuhiko Arase)
│   ├── overlays.js         Onboarding, PIN lock, SOS sheet
│   ├── app.js              Render loop, button events, start-up (loads last)
│   └── screens/
│       ├── today.js        Today tab (front page)
│       ├── checkin.js      Daily check-in and two-week PHQ-4 screening (opened from Today)
│       ├── tools.js        Breathing, grounding, journal, focus timer, deadlines
│       ├── body.js         Sleep sliders, water, movement, phone time, emergency card
│       ├── support.js      Helplines, counsellor request, safety plan
│       └── settings.js     Themes, text size, reminders, privacy
└── .github/workflows/
    └── static.yml          Publishes the site to GitHub Pages
```

The scripts are plain `<script>` files that share variables, so **the order in `index.html` matters**: `vendor/qrcode.js` and `state.js` first, `app.js` last. When you add or rename a file, also add it to `FILES` in `sw.js` and bump `VERSION` there.

## How it works

- Every screen is a function (for example `renderToday()`) that returns HTML.
- `render()` in `app.js` draws the current tab. Call it after changing any data.
- Buttons use `data-action="..."` attributes. All clicks are handled in one place in `app.js`, so to add a button, add a `data-action` and a matching `case` there.
- Saved data lives in the `S` object (`state.js`). Call `save()` after changing it.

## Adding a new screen

1. Create `js/screens/yourscreen.js` with a `renderYourscreen()` function.
2. Add a `<script>` tag for it in `index.html`, before `app.js`.
3. Add it to `TABS` in `data.js` and to the list in `render()` in `app.js`.

## Reset the demo

Settings → Your data → Delete everything.

## Important notes

- This is a prototype. Counsellor requests are not sent anywhere yet.
- Anyone who scans the emergency card QR can read it, like a medical ID bracelet. The app tells students this. Only use fictional details in demos.
- Helpline numbers (1166, TPO Nepal, TU Teaching Hospital, 102, 100) came from public listings. Confirm numbers and hours with the college counsellor before real use.
- The two-week check uses the PHQ-4 questions. It is a screening tool, not a diagnosis.
- Use fictional data for demos, never real students' details.

## Next steps for a real version

- Accounts and a database (for example Supabase) so the counsellor can receive requests
- Staff login and role-based access for the emergency medical QR card
- Nepali translation
- Web Push so reminders ring when the app is closed (needs the backend)
- Automatic sleep from Samsung Health via Android Health Connect (needs the Android app version)
