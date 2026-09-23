/* Saathi: Settings tab: themes, colours, text size, check-in style, reminders, goals, privacy and data. */

function appName(){ return S.prefs.discreet?"Notes":"Saathi"; }
const darkQuery = matchMedia("(prefers-color-scheme: dark)"), motionQuery = matchMedia("(prefers-reduced-motion: reduce)");
function applyPrefs(){
  const r=document.documentElement, p=S.prefs;
  if(p.mode==="auto") delete r.dataset.theme; else r.dataset.theme=p.mode;
  // The accent colour is worked out for light or dark mode so text on it stays readable.
  const dark = p.mode==="dark" || (p.mode==="auto" && darkQuery.matches), pal = accentPalette(p.accent, dark);
  r.style.setProperty("--pine", pal.accent); r.style.setProperty("--pine-soft", pal.soft); r.style.setProperty("--on-pine", pal.on);
  const tc=document.querySelector('meta[name="theme-color"]'); if(tc) tc.content = accentPalette(p.accent,false).accent;
  r.style.fontSize={normal:"100%",large:"112.5%",xl:"125%"}[p.text]||"100%";
  // Reduce motion is on if the student turns it on here OR their phone already asks for it.
  if(p.motion || motionQuery.matches) r.dataset.motion="reduce"; else delete r.dataset.motion;
  const b=document.getElementById("brandname"); if(b) b.textContent=appName();
  document.title=p.discreet?"Notes":"Saathi: student wellbeing prototype";
}
function seg(key,opts,cur){ return `<div class="seg" role="group">${opts.map(([v,l])=>`<button aria-pressed="${String(cur)===String(v)}" data-action="pref" data-k="${key}" data-v="${v}">${l}</button>`).join("")}</div>`; }
function sw(key,on,label){ return `<input type="checkbox" class="switch" data-pref="${key}" ${on?"checked":""} aria-label="${label}">`; }
function renderSettings(){
  const p=S.prefs;
  return `
  <h1 class="hello">Settings<small>Make ${appName()} feel like yours.</small></h1>

  <section class="sec" style="margin-top:6px"><h2>Profile</h2><div class="set">
    <div class="it"><label for="setnick"><b>Nickname</b><span class="small muted">Shown on Today and to the counsellor</span></label></div>
    <div style="padding:0 0 14px;display:flex;gap:8px"><input class="t" id="setnick" maxlength="20" value="${esc(S.nick)}"><button class="btn ghost" data-action="save-nick">Save</button></div>
  </div></section>

  <section class="sec"><h2>Appearance</h2><div class="set">
    <div class="it" style="flex-wrap:wrap"><b>Theme</b>${seg("mode",[["auto","Match device"],["light","Light"],["dark","Dark"]],p.mode)}</div>
    <div class="it" style="display:block"><div><b>Colour</b><span class="small muted">Drag around the wheel, or type a colour code</span></div>${renderColourPicker()}</div>
    <div class="it" style="flex-wrap:wrap"><b>Text size</b>${seg("text",[["normal","A"],["large","A+"],["xl","A++"]],p.text)}</div>
    ${motionQuery.matches
      ?`<div class="it"><div><b>Reduce motion</b><span class="small muted">On, because your device is set to reduce motion</span></div><input type="checkbox" class="switch" checked disabled aria-label="Reduce motion (set by your device)"></div>`
      :`<div class="it"><div><b>Reduce motion</b><span class="small muted">Stops sliding, growing and fading effects. Breathing uses a countdown instead.</span></div>${sw("motion",p.motion,"Reduce motion")}</div>`}
    <div class="preview"><strong>Preview</strong><p class="small" style="margin:4px 0 10px">This is how buttons and text will look.</p><button class="btn" tabindex="-1">Save check-in</button></div>
    <div style="height:14px"></div>
  </div></section>

  <section class="sec"><h2>Check-in</h2><div class="set">
    <div class="it" style="flex-wrap:wrap"><div><b>Mood style</b><span class="small muted">How you pick your mood</span></div>${seg("checkStyle",[["sky","Skies"],["face","Faces"]],p.checkStyle)}</div>
  </div></section>

  <section class="sec"><h2>Today screen</h2><div class="set">
    <div class="it"><b>Thought for the day</b>${sw("home.headline",p.home.headline,"Show thought for the day")}</div>
    <div class="it"><b>Two-week check</b>${sw("home.due",p.home.due,"Show two-week check")}</div>
    <div class="it"><b>Reminders today</b>${sw("home.reminders",p.home.reminders,"Show reminders")}</div>
    <div class="it"><b>Try a tool</b>${sw("home.suggest",p.home.suggest,"Show tool suggestion")}</div>
    <div class="it"><b>Your week chart</b>${sw("home.week",p.home.week,"Show week chart")}</div>
    <div class="it"><b>Coming up deadlines</b>${sw("home.next",p.home.next,"Show deadlines")}</div>
  </div></section>

  <section class="sec" id="reminders"><h2>Reminders</h2><div class="set">
    ${notifyRow()}
    ${S.reminders.map(r=>`
    <div class="it rem-set"><div><b>${REMINDER_KINDS[r.kind].name}</b><span class="small muted">${remHint(r)}</span></div>
      <div class="rem-ctl">${r.kind==="survey"?"":`<input type="time" class="time" data-rem="${r.id}" data-field="time" value="${r.time}" aria-label="${REMINDER_KINDS[r.kind].name} time">`}
      <input type="checkbox" class="switch" data-rem="${r.id}" data-field="on" ${r.on?"checked":""} aria-label="${REMINDER_KINDS[r.kind].name} on"></div></div>
    ${r.kind==="work"&&r.on?`<div style="padding:0 0 14px"><label class="small muted" for="wl">What to call it</label><input class="t" id="wl" data-rem="work" data-field="label" maxlength="30" value="${esc(r.label||"")}" placeholder="e.g. Study block, Shift, Revision"></div>`:""}`).join("")}
    <div class="it"><b>Play a sound</b>${sw("notify.sound",p.notify.sound,"Play a sound")}</div>
    <div class="it"><div><b>Vibrate</b><span class="small muted">Android phones</span></div>${sw("notify.vibrate",p.notify.vibrate,"Vibrate")}</div>
    <div class="it"><div><b>Test it</b><span class="small muted">Rings now so you can check the sound</span></div><button class="btn ghost" data-action="test-reminder">Test</button></div>
  </div>
  <p class="small muted" style="margin:10px 4px 0">Reminders ring while Saathi is open or in the background. If you fully close it, they can't ring yet. That needs the server version.</p>
  </section>

  <section class="sec"><h2>Goals and timers</h2><div class="set">
    <div class="it" style="flex-wrap:wrap"><b>Focus block</b>${seg("focusMin",[[15,"15 min"],[25,"25 min"],[45,"45 min"]],p.focusMin)}</div>
    <div class="it" style="flex-wrap:wrap"><b>Break</b>${seg("breakMin",[[5,"5 min"],[10,"10 min"],[15,"15 min"]],p.breakMin)}</div>
    <div class="it" style="flex-wrap:wrap"><b>Daily water goal</b>${seg("waterGoal",[[6,"6"],[8,"8"],[10,"10"]],p.waterGoal)}</div>
  </div></section>

  <section class="sec"><h2>Privacy and security</h2><div class="set">
    <div class="it"><div><b>Discreet mode</b><span class="small muted">Shows the app as "Notes", and reminders just say "You have a reminder"</span></div>${sw("discreet",p.discreet,"Discreet mode")}</div>
    <div class="it"><div><b>Ask for PIN on open</b><span class="small muted">${S.pin?"PIN is set":"No PIN set yet"}</span></div>${S.pin?sw("autoLock",p.autoLock,"Ask for PIN on open"):""}</div>
    <div class="it"><b>${S.pin?"Change PIN":"Set a PIN"}</b><button class="btn ghost" data-action="change-pin">${S.pin?"Change":"Set"}</button></div>
    ${S.pin?`<div class="it"><b>Lock now</b><button class="btn ghost" data-action="lock-now">Lock</button></div>`:""}
    <div class="it"><div><b>Who can see my data</b><span class="small muted">Only you. The counsellor sees only what you send them. Campus staff see only your emergency medical card.</span></div></div>
  </div></section>

  <section class="sec"><h2>Language</h2><div class="set">
    <div class="it" style="flex-wrap:wrap"><b>App language</b><div class="seg"><button aria-pressed="true">English</button><button disabled style="opacity:.5">नेपाली (soon)</button></div></div>
  </div></section>

  <section class="sec"><h2>Your data</h2><div class="set">
    <div class="it"><div><b>Reset settings</b><span class="small muted">Keeps your check-ins and journal</span></div><button class="btn ghost" data-action="reset-prefs">Reset</button></div>
    <div class="it"><div><b>Delete everything</b><span class="small muted">Removes all data on this device</span></div><button class="btn danger" data-action="reset">Delete</button></div>
  </div></section>
  <p class="small muted" style="text-align:center;margin-top:18px">Saathi prototype, version 0.3</p>`;
}
function notifyRow(){
  const p=notifyPermission();
  if(p==="granted") return `<div class="it"><div><b>Phone notifications</b><span class="small muted">On for this browser</span></div></div>`;
  if(p==="denied") return `<div class="it"><div><b>Phone notifications</b><span class="small muted">Blocked. To allow them, open your browser's site settings for Saathi.</span></div></div>`;
  if(p==="unsupported") return `<div class="it"><div><b>Phone notifications</b><span class="small muted">This browser can't show them. Reminders pop up inside Saathi instead.</span></div></div>`;
  return `<div class="it"><div><b>Phone notifications</b><span class="small muted">Needed for reminders to ring when Saathi is in the background</span></div><button class="btn" data-action="notify-on">Turn on</button></div>`;
}
function remHint(r){
  if(r.kind==="survey") return "Rings at your check-in time on the day it's due";
  if(r.kind==="water") return `Every 3 hours from ${time12(r.time)} until 9 pm`;
  return REMINDER_KINDS[r.kind].body;
}
function setPref(path,val){
  const k=path.split("."); let o=S.prefs; while(k.length>1) o=o[k.shift()];
  const cur=o[k[0]]; o[k[0]]= typeof cur==="number"? +val : val;
  save(); applyPrefs(); render();
}
