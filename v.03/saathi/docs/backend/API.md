# Saathi API contract (v0.3)

This is the agreement between the frontend and the backend. The frontend's mock API is built from this file, so change it only together with the frontend developer.

## Conventions

- **Base path:** `/api`. Everything is sent and received as JSON (`Content-Type: application/json`).
- **Auth:** after register or login, send `Authorization: Bearer <token>` on every request.
- **Dates:** `YYYY-MM-DD` in the student's **local** date. Store them exactly as sent.
- **Times:** `HH:MM`, 24-hour, local.
- **Empty success:** `204 No Content` with no body.
- **Unknown fields:** ignore them. Don't save them.

## Errors

Every error has the same shape:

```json
{ "error": { "code": "VALIDATION_ERROR", "message": "Mood must be between 1 and 5.", "fields": { "mood": "1–5" } } }
```

`message` is shown to the student as-is, so write it in plain, friendly English. `fields` is optional.

| Status | `code` | When |
|---|---|---|
| 400 | `VALIDATION_ERROR` | Missing or invalid field, or invalid JSON |
| 401 | `UNAUTHENTICATED` | No token, or an expired or unknown token (the frontend sends the student back to sign-in) |
| 401 | `INVALID_CREDENTIALS` | Wrong sign-in code or PIN at login |
| 403 | `WRONG_PIN` | Wrong PIN on unlock or PIN change |
| 403 | `FORBIDDEN` | Staff role without access |
| 404 | `NOT_FOUND` | Unknown id |
| 413 | `TOO_LARGE` | Body over the limit (300 kB is plenty) |
| 429 | `TOO_MANY_ATTEMPTS` | Rate limit hit. Include the wait time in `message`. |
| 500 | `SERVER_ERROR` | Anything else. Log it on the server, but never the request body. |

---

## 1. Accounts

Students are anonymous. At sign-up they choose a nickname and a 4-digit PIN, and the server gives them a random **sign-in code** (for example `K7QP-3MXD-9WRT`). The code plus the PIN opens the account on any device. The code is shown once, and the server stores only a hash of it.

| Method | Endpoint | Request | Response | Errors |
|---|---|---|---|---|
| POST | `/api/auth/register` | `{"nickname":"Himal","pin":"2468","timezone":"Asia/Kathmandu"}` | `201` `{"token":"…","signInCode":"K7QP-3MXD-9WRT","user":{"nickname":"Himal"}}` | 400 |
| POST | `/api/auth/login` | `{"signInCode":"k7qp3mxd9wrt","pin":"2468"}` (ignore case, spaces and dashes in the code) | `200` `{"token":"…","user":{"nickname":"Himal"}}` | 401 `INVALID_CREDENTIALS`, 429 |
| POST | `/api/auth/verify-pin` | `{"pin":"2468"}` (unlocks the app on open) | `200` `{"ok":true}` | 403 `WRONG_PIN`, 429 |
| POST | `/api/auth/logout` | none | `204` | 401 |

Rules:
- `nickname` is 1–20 characters after trimming.
- `pin` must match `^\d{4}$`.
- `timezone` is an IANA name. It's optional, with `Asia/Kathmandu` as the default, and is needed for push reminders.
- After 5 wrong PINs for the same account (or code), lock it for 15 minutes and return 429.
- Student sessions last 30 days.

## 2. Profile and settings

`GET /api/me` returns everything the app needs at start-up, in one call.

| Method | Endpoint | Request | Response | Errors |
|---|---|---|---|---|
| GET | `/api/me` | none | `200` start-up bundle (below) | 401 |
| PATCH | `/api/me` | `{"nickname":"Moonlight"}` and/or `{"timezone":"Asia/Kathmandu"}` | `200` `{"user":{"nickname":"Moonlight","timezone":"Asia/Kathmandu"}}` | 400 |
| PUT | `/api/me/pin` | `{"currentPin":"2468","newPin":"1357"}` | `204` | 400, 403 `WRONG_PIN`, 429 |
| PUT | `/api/me/prefs` | account preferences object (below) | `200` `{"prefs":{…}}` | 400 |
| DELETE | `/api/me` | none | `204`. Deletes the account and **all** its data, and ends all sessions. | 401 |

Start-up bundle:

```json
{
  "user": { "nickname": "Himal", "timezone": "Asia/Kathmandu", "createdAt": "2026-09-23T08:10:00Z" },
  "prefs": { "checkStyle": "sky", "home": { "headline": true, "due": true, "reminders": true, "suggest": true, "week": true, "next": true },
             "focusMin": 25, "breakMin": 5, "waterGoal": 8, "discreet": false },
  "checkins":    [ { "date": "2026-09-23", "mood": 3, "sleep": 6.5, "energy": 3, "feelings": ["tired"], "causes": ["exams"], "note": "" } ],
  "screenings":  [ { "id": "…", "date": "2026-09-09", "score": 5, "anxiety": 3, "depression": 2 } ],
  "journal":     [ { "id": "…", "date": "2026-09-21", "prompt": "…", "text": "…" } ],
  "deadlines":   [ { "id": "…", "title": "DBMS assignment", "due": "2026-09-26" } ],
  "sleep":       [ { "date": "2026-09-23", "bed": "23:30", "wake": "06:30", "hours": 7, "source": "manual" } ],
  "bodyToday":   { "date": "2026-09-23", "water": 3, "moves": ["walk"], "screenHours": 5 },
  "reminders":   [ { "id": "checkin", "kind": "checkin", "on": true, "time": "20:00" } ],
  "safetyPlan":  { "signs": "", "helps": "", "people": "", "places": "" },
  "trustedContact": null,
  "medicalCard": { "fullName": "", "studentId": "", "blood": "Not sure", "allergies": "", "conditions": "", "contactName": "", "contactPhone": "" },
  "requestCount": 0
}
```

How much to send: check-ins and sleep for the **last 60 days**, all screenings, the **last 100** journal entries, and all deadlines. Older data is available from the list endpoints.

**Account preferences** (`PUT /api/me/prefs`): accept only these keys. The theme, colour, text size, reduce motion and PIN-on-open settings are **device** settings, and the frontend keeps them locally.

| Key | Type | Allowed |
|---|---|---|
| `checkStyle` | string | `sky`, `face` |
| `home` | object of booleans | `headline`, `due`, `reminders`, `suggest`, `week`, `next` |
| `focusMin` | number | 15, 25, 45 |
| `breakMin` | number | 5, 10, 15 |
| `waterGoal` | number | 6, 8, 10 |
| `discreet` | boolean | When true, push notifications must say only "Notes" / "You have a reminder." |

## 3. Daily check-in and two-week check

| Method | Endpoint | Request | Response | Errors |
|---|---|---|---|---|
| GET | `/api/checkins?from=2026-08-01&to=2026-09-23` | none | `200` `{"checkins":[…]}`, oldest first | 400 |
| PUT | `/api/checkins/:date` | `{"mood":3,"sleep":6.5,"energy":3,"feelings":["tired"],"causes":["exams"],"note":""}` | `200` `{"checkin":{…,"date":"2026-09-23"}}` | 400 |
| GET | `/api/screenings` | none | `200` `{"screenings":[…]}` | |
| POST | `/api/screenings` | `{"date":"2026-09-23","answers":[1,2,0,1]}` | `201` `{"screening":{"id","date","score":4,"anxiety":3,"depression":1}}` | 400 |

Check-in rules:
- One check-in per day. `PUT` creates it or replaces it.
- `mood` is an integer 1–5.
- `sleep` is 0–14 in steps of 0.5.
- `energy` is an integer 1–5.
- `feelings` is a subset of: `stressed anxious tired lonely overwhelmed homesick irritable calm hopeful motivated content numb`.
- `causes` is a subset of: `exams deadlines career money family relationships health social abroad`.
- `note` is up to 1000 characters.

Screening rules:
- `answers` is exactly 4 integers from 0 to 3, in this order: nervous, can't stop worrying, down, little interest.
- The **server** calculates `score` (the sum, 0–12), `anxiety` (answers 1 and 2) and `depression` (answers 3 and 4).
- Store the answers too.

## 4. Tools

| Method | Endpoint | Request | Response | Errors |
|---|---|---|---|---|
| GET | `/api/journal?limit=100&before=<id>` | none | `200` `{"entries":[…]}`, newest first | |
| POST | `/api/journal` | `{"date":"2026-09-23","prompt":"…","text":"…"}` | `201` `{"entry":{"id",…}}` | 400 (empty text, over 5000 characters) |
| DELETE | `/api/journal/:id` | none | `204` | 404 |
| GET | `/api/deadlines` | none | `200` `{"deadlines":[…]}` | |
| POST | `/api/deadlines` | `{"title":"Statistics quiz","due":"2026-09-30"}` | `201` `{"deadline":{"id",…}}` | 400 (title 1–80 characters) |
| DELETE | `/api/deadlines/:id` | none | `204` (the app calls this "Done") | 404 |

## 5. Body

Sleep is one record per morning. `date` is the day the student woke up.

| Method | Endpoint | Request | Response | Errors |
|---|---|---|---|---|
| GET | `/api/sleep?from=&to=` | none | `200` `{"sleep":[…]}` | 400 |
| PUT | `/api/sleep/:date` | `{"bed":"23:30","wake":"06:30","source":"manual"}` or `{"hours":6.5,"source":"check-in"}` | `200` `{"sleep":{"date","bed","wake","hours","source"}}` | 400 |
| GET | `/api/body/:date` | none | `200` `{"date","water":0,"moves":[],"screenHours":0}` (zeros if nothing is logged) | 400 |
| PUT | `/api/body/:date` | `{"water":3,"moves":["walk"],"screenHours":5}` (any subset) | `200` same shape | 400 |

Sleep rules:
- When `bed` and `wake` are sent, the server calculates `hours` itself, counting across midnight.
- `source` is one of `manual`, `check-in` or `health-connect`.
- A `check-in` record must never overwrite a `manual` or `health-connect` one for the same date.

Body rules:
- `water` is an integer 0–20.
- `moves` is a subset of `walk sport yoga dance`.
- `screenHours` is 0–12 in steps of 0.5 (12 means "12 or more").
- The frontend sends these after the student stops tapping (about 600 ms of no changes), so expect small, frequent PUTs.

## 6. Support

| Method | Endpoint | Request | Response | Errors |
|---|---|---|---|---|
| PUT | `/api/safety-plan` | `{"signs":"…","helps":"…","people":"…","places":"…"}` | `200` `{"safetyPlan":{…}}` | 400 (each field up to 1000 characters) |
| PUT | `/api/trusted-contact` | `{"name":"Didi","phone":"+977 98…"}` | `200` `{"trustedContact":{…}}` | 400 (phone required) |
| DELETE | `/api/trusted-contact` | none | `204` | |
| POST | `/api/counsellor-requests` | `{"anonymous":true,"contactMethod":"Phone call","preferredTime":"This week, daytime","message":"…"}` | `201` `{"request":{"id","createdAt","status":"new"},"requestCount":1}` | 400 |
| GET | `/api/counsellor-requests` | none | `200` `{"requests":[{"id","createdAt","status"}]}` (the student's own requests only) | |

Counsellor request rules:
- If `anonymous` is `false`, copy the name and student ID from the student's medical card onto the request. Otherwise store only the nickname.
- `message` is up to 1000 characters.

## 7. Emergency medical card

The QR code is generated in the browser and holds the card text itself, so there is **no QR token** and no public card endpoint. The server only stores the card so it syncs between the student's devices.

| Method | Endpoint | Request | Response | Errors |
|---|---|---|---|---|
| GET | `/api/medical-card` | none | `200` `{"medicalCard":{…}}` | |
| PUT | `/api/medical-card` | `{"fullName","studentId","blood","allergies","conditions","contactName","contactPhone"}` | `200` `{"medicalCard":{…}}` | 400 |

Field limits (they keep the QR easy to scan):

| Field | Limit |
|---|---|
| `fullName` | 40 characters |
| `studentId` | 24 characters |
| `allergies` | 60 characters |
| `conditions` | 60 characters |
| `contactName` | 40 characters |
| `contactPhone` | 20 characters |
| `blood` | one of `A+ A− B+ B− AB+ AB− O+ O− Not sure` (the minus sign is U+2212; accept an ASCII `-` too) |

## 8. Reminders

The student's reminder list. The frontend rings these itself while the app is open. The server uses the same list for Web Push (milestone 3).

| Method | Endpoint | Request | Response | Errors |
|---|---|---|---|---|
| GET | `/api/reminders` | none | `200` `{"reminders":[…]}` | |
| PUT | `/api/reminders` | `{"reminders":[{"id":"checkin","kind":"checkin","on":true,"time":"20:00"}, …]}` (replaces the whole list) | `200` `{"reminders":[…]}` | 400 |

Reminder rules:
- At most 20 reminders, each with a unique `id` (1–40 characters).
- `kind` is one of `checkin`, `survey`, `meditation`, `work`, `water` or `bedtime`.
- `on` is a boolean.
- `time` is `HH:MM`.
- `label` is optional, up to 30 characters, and only used for `work`.

## 9. Web Push (milestone 3)

| Method | Endpoint | Request | Response | Errors |
|---|---|---|---|---|
| GET | `/api/push/public-key` | none | `200` `{"publicKey":"<VAPID public key, base64url>"}` | |
| POST | `/api/push/subscriptions` | `{"endpoint":"https://…","keys":{"p256dh":"…","auth":"…"}}` | `201` `{"ok":true}` (save it, or update it if the endpoint is already stored) | 400 |
| DELETE | `/api/push/subscriptions` | `{"endpoint":"https://…"}` | `204` | |

The push payload must be exactly `{"title","body","tag","open"}`, because `sw.js` reads those keys. See NOTIFICATIONS-AND-SLEEP.md.

## 10. Staff (milestone 2)

Staff sign in with an email and password. The roles are `counsellor` and `admin`; the `medical` role is no longer needed now that the QR works offline. Staff sessions last 12 hours.

| Method | Endpoint | Request | Response | Errors |
|---|---|---|---|---|
| POST | `/api/staff/login` | `{"email","password"}` | `200` `{"token","staff":{"name","role"}}` | 401, 429 |
| POST | `/api/staff/logout` | none | `204` | |
| GET | `/api/staff/counsellor-requests?status=open` | none | `200` `{"requests":[{"id","createdAt","nickname","anonymous","realName","studentId","contactMethod","preferredTime","message","status"}]}` | 401, 403 |
| PATCH | `/api/staff/counsellor-requests/:id` | `{"status":"contacted"}` (`new`, `contacted` or `closed`) | `200` `{"request":{…}}` | 400, 403, 404 |

Staff responses **never** include the student's internal id, and no staff endpoint returns check-ins, journal entries, screenings, sleep or body data.
