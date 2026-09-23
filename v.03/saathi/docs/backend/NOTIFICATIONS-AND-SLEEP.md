# Reminders (Web Push) and automatic sleep data

## Reminders: what the frontend already does

`js/reminders.js` checks every 20 seconds whether a reminder is due, and rings it.

- **App on screen:** a pop-up with a chime and a vibration.
- **App in the background:** a phone notification through the service worker (`sw.js`).
- **App fully closed:** nothing, because a web page can't run code when it isn't open. **Fixing this is your part.**

## Your part: Web Push (milestone 3)

Web Push lets the server wake the phone and show a notification even when Saathi is closed. It works on:
- Android with Chrome, Edge or Samsung Internet
- desktop browsers
- iPhone only when Saathi is **installed to the home screen** (iOS 16.4 or later)

### Setup
1. Generate VAPID keys once and keep them in `.env` (for example with the `web-push` npm package: `npx web-push generate-vapid-keys`). Never commit the private key.
2. `GET /api/push/public-key` returns the public key.
3. The frontend calls `pushSubscription(publicKey)` (already in `js/reminders.js`) and sends the result to `POST /api/push/subscriptions`. Store it against the user. One user can have several devices.

### Scheduler
Every minute, for each user who has at least one push subscription:
1. Work out the student's local time from `user.timezone` (default `Asia/Kathmandu`, UTC+5:45).
2. For each reminder with `on: true`, check whether its time is now. Water repeats every 3 hours from its time until 21:00.
3. Apply the same rules as the frontend's `reminderApplies()`:
   - `checkin`: skip it if today's check-in already exists.
   - `survey`: only send it if the last screening is 14 or more days old (or there is none).
   - Everything else: always send it.
4. Send each reminder at most **once per day per time**. Remember what was sent, so a restart doesn't resend it.
5. If sending returns 404 or 410, the subscription has expired, so delete it.

### Payload
`sw.js` shows exactly these fields:

```json
{ "title": "Time for your check-in", "body": "30 seconds. How was today?", "tag": "checkin", "open": "checkin" }
```

`open` is one of `checkin`, `survey`, `breathe`, `focus`, `body` or `today`. Use the same text as `REMINDER_KINDS` in `js/data.js`. For `work`, use the student's `label` as the title.

**Discreet mode:** if `user.prefs.discreet` is true, send `{"title":"Notes","body":"You have a reminder.","tag":"<id>","open":"<open>"}`. Notifications show on the lock screen, so the text must not reveal that this is a mental health app.

### Don't ring twice
Once a device has a push subscription, the frontend will stop showing its own background notifications (it keeps the in-app pop-up). Tell the frontend developer when push is live, so both sides switch at the same time.

## Automatic sleep (future: Android app only)

The request was for sleep to be detected automatically, the way Samsung Health does. Here's where that stands:

- **A website or PWA can't read Samsung Health or any phone health data.** Browsers don't allow it.
- Samsung Health shares sleep sessions with **Android Health Connect**. An Android app version of Saathi (for example, the same web code wrapped with Capacitor, plus a Health Connect plugin) could ask for permission and read the last night's sleep.
- For now, students log sleep with the bedtime and wake-up sliders on the Body screen (`source: "manual"`), or through the check-in (`source: "check-in"`).

What this means for you now: nothing to build yet. Just make sure `PUT /api/sleep/:date` accepts `source: "health-connect"`, and that a check-in never overwrites it. When the Android app exists, it will send imported nights to the same endpoint.

Sleep is health data. Keep it in `wellbeing.json` with everything else that staff can't see.
