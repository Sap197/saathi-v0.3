/* Saathi: reminders and notifications.
 *
 * How it works in this frontend-only version:
 *  - While Saathi is open (or open in the background), it checks every 20 seconds
 *    whether a reminder is due.
 *  - If Saathi is on screen, a pop-up appears with a chime and a vibration.
 *  - If Saathi is in the background, the phone shows a normal notification
 *    (with the phone's notification sound), through the service worker.
 *  - If Saathi is fully closed, nothing can run on the phone. Reminders then need
 *    Web Push from the server (see docs/backend) or the Android app version.
 */

const FIRED_KEY = "saathi-reminders-fired";   // device only: which reminders already rang today
const SNOOZE_MIN = 10, CATCH_UP_MIN = 10;     // ring up to 10 minutes late if the phone was asleep

let fired = {}, snoozes = [];
try{ fired = JSON.parse(localStorage.getItem(FIRED_KEY)) || {}; }catch(e){}
const saveFired = () => { try{ localStorage.setItem(FIRED_KEY, JSON.stringify(fired)); }catch(e){} };

const toMin = t => { const [h,m]=String(t).split(":").map(Number); return h*60+m; };
const fromMin = m => `${String(Math.floor(m/60)%24).padStart(2,"0")}:${String(m%60).padStart(2,"0")}`;
const nowMin = () => { const d=new Date(); return d.getHours()*60+d.getMinutes(); };
function time12(t){ const m=toMin(t), h=Math.floor(m/60)%24; return `${(h%12)||12}:${String(m%60).padStart(2,"0")} ${h<12?"am":"pm"}`; }

/* Every time a reminder rings today. Water repeats every 3 hours until 9 pm. */
function reminderTimes(r){
  if(r.kind!=="water") return [r.time];
  const out=[]; for(let m=toMin(r.time); m<=21*60; m+=180) out.push(fromMin(m)); return out;
}
function surveyDue(){ const ls=lastScreen(); return !ls || daysUntil(ls.date)<=-14; }
/* Should this reminder ring today at all? */
function reminderApplies(r){
  if(!r.on) return false;
  if(r.kind==="survey") return surveyDue();
  if(r.kind==="checkin") return !todays();
  return true;
}
/* Today's remaining reminders, soonest first (for the Today screen). */
function upcomingReminders(){
  const n=nowMin(), list=[];
  S.reminders.filter(reminderApplies).forEach(r=>reminderTimes(r).forEach(t=>{ if(toMin(t)>=n) list.push({r,t}); }));
  return list.sort((a,b)=>toMin(a.t)-toMin(b.t));
}
function reminderText(r){
  const k=REMINDER_KINDS[r.kind];
  // In discreet mode, notifications don't say what the app is or what it's about.
  if(S.prefs.discreet) return {title:"Notes", body:"You have a reminder."};
  return {title: r.kind==="work" && r.label ? r.label : k.title, body:k.body};
}

/* ---------- checking ---------- */
function checkReminders(){
  if(!S.onboarded) return;
  const n=nowMin(), d=today();
  for(const r of S.reminders){
    if(!reminderApplies(r)) continue;
    for(const t of reminderTimes(r)){
      const key=`${r.id}@${t}`, m=toMin(t);
      if(n>=m && n-m<=CATCH_UP_MIN && fired[key]!==d){ fired[key]=d; saveFired(); fireReminder(r); }
    }
  }
  const due=snoozes.filter(s=>s.at<=Date.now()); snoozes=snoozes.filter(s=>s.at>Date.now());
  due.forEach(s=>{ const r=S.reminders.find(x=>x.id===s.id); if(r) fireReminder(r); });
}

function fireReminder(r, {test=false}={}){
  const {title, body} = reminderText(r);
  const open = REMINDER_KINDS[r.kind].open;
  if(document.visibilityState==="visible"){
    showReminderPop(r, title, body, open);
    ring();
    if(test) systemNotify(title, body, r.id, open);   // so the test also shows what a background notification looks like
  } else {
    systemNotify(title, body, r.id, open);
  }
}

/* ---------- phone notification ---------- */
function notifyPermission(){ return "Notification" in window ? Notification.permission : "unsupported"; }
async function askNotifyPermission(){
  if(!("Notification" in window)) return "unsupported";
  try{ return await Notification.requestPermission(); }catch(e){ return Notification.permission; }
}
async function systemNotify(title, body, tag, open){
  if(notifyPermission()!=="granted") return;
  const opts = { body, tag, renotify:true, icon:"icons/icon-192.png", badge:"icons/icon-192.png",
    silent:!S.prefs.notify.sound, vibrate: S.prefs.notify.vibrate ? [200,100,200,100,300] : undefined, data:{open} };
  try{
    const reg = "serviceWorker" in navigator && await navigator.serviceWorker.getRegistration();
    if(reg){ await reg.showNotification(title, opts); return; }
    new Notification(title, opts);   // desktop browsers without a service worker (e.g. opened as a file)
  }catch(e){ /* some browsers refuse without a service worker; the in-app pop-up still works */ }
}

/* ---------- in-app pop-up, chime and vibration ---------- */
function showReminderPop(r, title, body, open){
  const pop=$("#pop"); if(!pop) return;
  const hide = locked;   // don't show details over the PIN screen
  pop.innerHTML = `<div class="remind-pop" role="alertdialog" aria-live="assertive" aria-labelledby="pop-t">
    <div><b id="pop-t">${esc(hide?"Reminder":title)}</b><span class="small">${esc(hide?"Unlock to see it.":body)}</span></div>
    <div class="pop-btns">
      ${hide?"":`<button class="btn" data-action="pop-open" data-v="${open}">Open</button>`}
      <button class="btn ghost" data-action="pop-snooze" data-v="${r.id}">In ${SNOOZE_MIN} min</button>
      <button class="link small" data-action="pop-close">Dismiss</button>
    </div></div>`;
  pop.querySelector("button")?.focus();
}
function snoozeReminder(id){ snoozes.push({id, at:Date.now()+SNOOZE_MIN*60000}); }

let audioCtx = null;
// Browsers only allow sound after the person has tapped something, so unlock it on the first tap.
document.addEventListener("pointerdown", ()=>{
  try{ if(!audioCtx) audioCtx = new (window.AudioContext||window.webkitAudioContext)(); if(audioCtx.state==="suspended") audioCtx.resume(); }catch(e){}
}, {passive:true});
function ring(){
  if(S.prefs.notify.vibrate && navigator.vibrate) navigator.vibrate([200,100,200,100,300]);
  if(!S.prefs.notify.sound || !audioCtx) return;
  const t0 = audioCtx.currentTime;
  [[660,0],[880,0.22],[660,0.9],[880,1.12]].forEach(([f,at])=>{
    const o=audioCtx.createOscillator(), g=audioCtx.createGain();
    o.type="sine"; o.frequency.value=f;
    g.gain.setValueAtTime(0.0001,t0+at); g.gain.exponentialRampToValueAtTime(0.25,t0+at+0.02); g.gain.exponentialRampToValueAtTime(0.0001,t0+at+0.45);
    o.connect(g).connect(audioCtx.destination); o.start(t0+at); o.stop(t0+at+0.5);
  });
}

/* ---------- Web Push (for the backend, later) ----------
 * When the backend is ready it gives a public VAPID key. Call pushSubscription(key)
 * after the student turns notifications on, and send the result to
 * POST /api/push/subscriptions. The service worker already shows pushed messages. */
async function pushSubscription(vapidPublicKey){
  const reg = await navigator.serviceWorker.ready;
  const b64 = vapidPublicKey.replace(/-/g,"+").replace(/_/g,"/"), padded = b64 + "=".repeat((4-b64.length%4)%4);
  const key = Uint8Array.from(atob(padded), c=>c.charCodeAt(0));
  const sub = await reg.pushManager.subscribe({userVisibleOnly:true, applicationServerKey:key});
  return sub.toJSON();   // {endpoint, keys:{p256dh, auth}}
}

setInterval(checkReminders, 20000);
document.addEventListener("visibilitychange", ()=>{ if(document.visibilityState==="visible") checkReminders(); });
