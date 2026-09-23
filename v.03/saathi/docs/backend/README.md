# Saathi backend: start here

This folder is for whoever builds the Saathi backend (Node.js + Express, with JSON files as the database for now). Read the files in this order:

1. **README.md** (this file): what the project is, what's already built, and what your job is.
2. **[API.md](API.md)**: every endpoint the frontend will call, with request and response JSON and errors.
3. **[DATA-MODEL.md](DATA-MODEL.md)**: what to store, in which file, the limits on each field, and the privacy rules.
4. **[NOTIFICATIONS-AND-SLEEP.md](NOTIFICATIONS-AND-SLEEP.md)**: Web Push reminders (a later milestone) and automatic sleep data (future, Android only).

## The project in one minute

Saathi is a student wellbeing app for a college in Nepal, built for an expo/IT project. It came out of the **ING Student Wellbeing Survey** (41 usable responses):

- 37% of students scored moderate or severe on the PHQ-4 screening questions.
- 29 of 39 had never seen a counsellor.
- The top reasons for not getting help were preferring to handle it alone (19), fear of judgement (17), cost (17) and privacy (11).

Those findings drive the design:

- **Anonymous by default.** Students use a nickname, never an email or phone number. The only real name in the whole system is on the optional emergency medical card.
- **The college can't see wellbeing data.** Check-ins, journal entries and screening scores belong to the student only. There is no staff route to them, ever.
- **Self-help first**, with counselling one tap away.
- **It's not a diagnosis.** The two-week check uses the PHQ-4 questions as a screening tool.

## What exists now

The frontend is plain HTML, CSS and vanilla JavaScript: no framework, no build step. Right now it saves everything in the browser's localStorage. Version 0.3 includes:

| Area | What the student can do |
|---|---|
| Today (front page) | Thought for the day, daily mood check-in, the two-week PHQ-4 check, today's reminders, a suggested tool for focus or stress |
| Tools | Breathing, grounding, journal, focus timer, deadline planner |
| Body | Last night's sleep (bedtime and wake-up sliders), water, movement, phone time, emergency medical card |
| Support | Helplines, counsellor request, safety plan, trusted contact, a note for family |
| Settings | Colour wheel (Venice blue default), themes, text size, reduce motion, Today-screen options, reminders, timers, discreet mode, PIN |

Two recent decisions affect you directly:

- **The emergency card QR is now offline.** The QR holds the card details as plain text (name, student ID, blood group, allergies, conditions, emergency contact and phone), so any phone camera reads it with no internet. That means **there is no QR token and no staff "scan to view" endpoint** anymore. You only store the card so it syncs between the student's devices.
- **Reminders ring from the browser** while the app is open or in the background. To make them ring when the app is fully closed, you'll add Web Push later (see NOTIFICATIONS-AND-SLEEP.md).

## Who does what

| Frontend developer | You (backend) |
|---|---|
| Builds a small API layer in the frontend (`js/api/…`) and a mock of your API to develop against | Build the API exactly as described in API.md |
| Replaces every localStorage write with an API call | Store data as described in DATA-MODEL.md |
| Sign-up, sign-in and PIN screens, loading and error states | Accounts, hashing, sessions, rate limits, validation |
| Asks for notification permission and sends you the push subscription | Store push subscriptions and send reminders (milestone 3) |
| Keeps helplines and SOS working offline, with no API needed | Nothing to do here, on purpose |

**The contract in API.md is shared.** If you need to change a URL, field name or response shape, agree it with the frontend developer first and update API.md in the same commit. The frontend mock is built from that file, so a quiet change breaks integration day.

## Your work, in order

### Milestone 1: accounts and core data (needed for the expo)
1. Set up the project: Express, a `data/` folder that git ignores, `npm start`, and a `.env` for `PORT` and `DATA_DIR`.
2. Build the JSON file store. Use one file per collection, safe writes (write a temp file, then rename), and load everything at start-up. See DATA-MODEL.md.
3. Add the standard error format and a JSON body size limit.
4. Accounts: register, login, verify-pin, logout. Hash PINs (scrypt or bcrypt), store only a hash of session tokens and sign-in codes, and lock an account for 15 minutes after 5 wrong PINs.
5. `GET /api/me`, which returns everything the app needs in one call, plus `PATCH /api/me`, `PUT /api/me/pin`, `PUT /api/me/prefs` and `DELETE /api/me`.
6. Check-ins, screenings (the server calculates the score), journal and deadlines.
7. Sleep, daily body logs, safety plan, trusted contact and medical card.
8. Counsellor requests (student side).
9. A demo script that creates one fictional student with sample data.

### Milestone 2: staff (after the student app works end to end)
10. Staff accounts (email and password), roles, and a command to add staff.
11. Counsellor view of requests: list them and update their status. Never expose the student's internal id.

### Milestone 3: reminders that ring when the app is closed
12. Web Push: a VAPID public key endpoint, saving and deleting subscriptions, and a scheduler that sends due reminders in the student's timezone. See NOTIFICATIONS-AND-SLEEP.md.

### Later
13. Counsellor dashboard: anonymous, aggregated trends only, with a minimum group size so no one can be singled out.
14. Import sleep from Android Health Connect (needs the Android app version first).

## Rules that aren't negotiable

- **Wellbeing data and the medical card live in separate files**, and no staff route reads wellbeing data.
- **Never store** a plain PIN, password, session token or sign-in code. Store hashes only.
- **Dates are the student's local date** (`YYYY-MM-DD`), exactly as the frontend sends them. Don't convert them to UTC, because Nepal is UTC+5:45 and that would move late-night check-ins onto the wrong day.
- **Deleting an account deletes everything**, including the medical card, requests and push subscriptions.
- **Only fictional data in demos.** The JSON files aren't encrypted, so they aren't ready for real students' data yet.
- **Don't log request bodies**, because they contain journal entries and health details.

## Open decisions to settle with the team

- **How anonymous students sign back in.** The suggestion in API.md is a random sign-in code shown once, plus the PIN.
- **Whether Node also serves the frontend files.** That's simplest (same address, no CORS). If not, enable CORS for the frontend's address only.
- **How the counsellor replies to an anonymous request.** Right now they can't, so an in-app reply is likely needed.
- **Where it's hosted.** It needs a host that keeps files between restarts (a VPS, a Render disk or a Railway volume), because the JSON files are the database.
