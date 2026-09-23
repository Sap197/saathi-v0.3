# Saathi data model (JSON files)

## Where the data comes from

Everything below is what the frontend keeps in its `S` object (`js/state.js`) today. Your job is to move it onto the server. If you want to see the real shapes, open the app, press F12, and type `S` in the console. Demo data comes from `seed()` in `js/state.js`.

## Files

Keep one JSON file per collection in `DATA_DIR` (default `./data`, and git must ignore it). Each file is an object keyed by id.

| File | Key | Contents | Who can read it |
|---|---|---|---|
| `users.json` | userId | nickname, PIN hash, sign-in code hash, timezone, account preferences, createdAt | the student |
| `wellbeing.json` | userId | check-ins, screenings, journal, deadlines, sleep, daily body logs, safety plan, trusted contact, reminders | **the student only. No staff route, ever.** |
| `medical.json` | userId | the emergency card | the student (the card itself is shared by the student on paper) |
| `requests.json` | requestId | counsellor requests | the student (their own), and counsellors |
| `push.json` | hash of the endpoint | push subscriptions `{userId, endpoint, keys, createdAt}` | the server only |
| `sessions.json` | hash of the token | `{kind:"student"\|"staff", sub, exp}` | the server only |
| `staff.json` | staffId | email, name, role, password hash | the server only |

`wellbeing.json` and `medical.json` are **separate on purpose**. Keep them that way even if merging them looks simpler.

### Writing files safely
- Load every file into memory at start-up.
- On each change, write to `<file>.tmp` and then `rename` it over the real file. A rename is atomic, so a crash can't leave half a file.
- Node runs one request at a time between awaits, so do the change and the write together (synchronously) to avoid two requests overwriting each other.
- If a file can't be parsed at start-up, **stop the server** with a clear error. Don't silently start with empty data.
- Back up `DATA_DIR`. It's the whole database.

## Records

### User (`users.json`)
```json
{
  "id": "uuid",
  "nickname": "Himal",
  "pinHash": "scrypt$<salt>$<hash>",
  "codeHash": "<sha256 of the normalised sign-in code>",
  "timezone": "Asia/Kathmandu",
  "prefs": { "checkStyle": "sky", "home": {"headline":true,"due":true,"reminders":true,"suggest":true,"week":true,"next":true},
             "focusMin": 25, "breakMin": 5, "waterGoal": 8, "discreet": false },
  "createdAt": "2026-09-23T08:10:00Z"
}
```

### Wellbeing (`wellbeing.json`, one object per user)
```json
{
  "checkins":   [ {"date":"2026-09-23","mood":3,"sleep":6.5,"energy":3,"feelings":["tired"],"causes":["exams"],"note":"","updatedAt":"…"} ],
  "screenings": [ {"id":"…","date":"2026-09-09","answers":[1,2,1,1],"score":5,"anxiety":3,"depression":2} ],
  "journal":    [ {"id":"…","date":"2026-09-21","prompt":"…","text":"…","createdAt":"…"} ],
  "deadlines":  [ {"id":"…","title":"DBMS assignment","due":"2026-09-26"} ],
  "sleep":      [ {"date":"2026-09-23","bed":"23:30","wake":"06:30","hours":7,"source":"manual"} ],
  "body":       { "2026-09-23": {"water":3,"moves":["walk"],"screenHours":5} },
  "safetyPlan": {"signs":"","helps":"","people":"","places":""},
  "trustedContact": null,
  "reminders":  [ {"id":"checkin","kind":"checkin","on":true,"time":"20:00"},
                  {"id":"survey","kind":"survey","on":true,"time":"20:00"},
                  {"id":"meditation","kind":"meditation","on":true,"time":"07:00"},
                  {"id":"work","kind":"work","on":true,"time":"18:00","label":"Study block"},
                  {"id":"water","kind":"water","on":false,"time":"10:00"},
                  {"id":"bedtime","kind":"bedtime","on":true,"time":"23:00"} ]
}
```
The reminders above are the defaults. Create them on register.

Differences from the old prototype that you should know about:
- `body` replaces the prototype's `water`, `move` and `screen` objects, which only held today and were wiped each day. Keep one entry per date so trends are possible later.
- `sleep` is new in v0.3. A check-in also carries a `sleep` number. The Body screen's sleep log wins when both exist (see the `source` rules in API.md).
- Deadline ids were `Date.now()` numbers in the prototype. Use string UUIDs on the server.

### Medical card (`medical.json`)
```json
{ "fullName":"Anish Karki", "studentId":"TIC-2025-0142", "blood":"B+", "allergies":"Penicillin",
  "conditions":"Asthma (mild)", "contactName":"Sita (sister)", "contactPhone":"+977 98XXXXXXXX", "updatedAt":"…" }
```
There is no QR token. The QR is made in the browser from these fields.

### Counsellor request (`requests.json`)
```json
{ "id":"…", "ownerId":"<userId, never sent to staff>", "createdAt":"…", "nickname":"Himal", "anonymous":true,
  "realName":null, "studentId":null, "contactMethod":"Phone call", "preferredTime":"This week, daytime",
  "message":"…", "status":"new" }
```

## What stays in the browser only

These never go to the server:
- Temporary screen state: the current tab, drafts, the timer, the PIN pad
- Fixed content: moods, prompts, PHQ questions, **helplines**, the thoughts for the day
- Device settings: theme, colour, text size, reduce motion, whether to ask for the PIN on open, reminder sound and vibration
- Which reminders already rang today on this device
- The session token

## Deleting an account

`DELETE /api/me` removes the user, their wellbeing object, medical card, counsellor requests, push subscriptions and sessions. Nothing is kept "just in case".

## Things not to do

- Don't log request or response bodies, because they contain journal text and health details.
- Don't add wellbeing fields to anything staff can read, including error messages.
- Don't use real students' data until the team has agreed on hosting, encryption at rest and who can access the server.
