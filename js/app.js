/* Saathi: Main render loop, all button and input events, and app start-up. Load this file last. */

/* ---------- render ---------- */
function render(){
  const main=$("#main");
  const fn={today:renderToday,checkin:renderCheckin,tools:renderTools,body:renderBody,support:renderSupport,settings:renderSettings}[view.tab];
  main.innerHTML=fn();
  const active = view.tab==="checkin" ? "today" : view.tab;   // the check-in lives under Today
  $("#tabs").innerHTML=TABS.map(([k,l])=>`<button data-action="goto" data-tab="${k}" ${active===k?'aria-current="page"':""}>${ic[k]}<span>${l}</span></button>`).join("");
  if(!S.onboarded) $("#layer").innerHTML=renderOnboard();
  else if(locked) $("#layer").innerHTML=renderLock();
  else if(pinChange) $("#layer").innerHTML=`<div class="overlay" style="justify-content:center">${pinPad("Choose a new PIN","Four digits you'll remember.","new-pin")}<button class="link" style="margin:18px auto 0;display:block" data-action="cancel-pin">Cancel</button></div>`;
  else if($("#layer .overlay")) $("#layer").innerHTML="";
  // things that need the new HTML to be on the page first
  initRanges(); drawCardPreview(); initColourPicker();
}

/* ---------- events ---------- */
document.addEventListener("click", e=>{
  const el=e.target.closest("[data-action]"); if(!el) return;
  const a=el.dataset.action, v=el.dataset.v;
  if(a==="close-sheet" && e.target!==el) return;
  switch(a){
    case "goto": draft=null; quiz=null; go(el.dataset.tab); break;
    case "sos": sosSheet(); break;
    case "pref": setPref(el.dataset.k, v); break;
    case "save-nick": { const n=$("#setnick").value.trim(); if(!n){ $("#setnick").focus(); return; } S.nick=n; save(); render(); toast("Nickname saved"); break; }
    case "change-pin": pinChange=true; pinBuf=""; render(); break;
    case "cancel-pin": pinChange=false; pinBuf=""; $("#layer").innerHTML=""; render(); break;
    case "reset-prefs": S.prefs=defaultPrefs(); wheelV=null; save(); applyPrefs(); render(); toast("Settings reset"); break;
    case "accent": wheelV=Math.max(0.2,hexToHsv(v)[2]); commitAccent(v); render(); break;
    case "close-sheet": case "close-sheet-btn": $("#layer").innerHTML=""; break;

    /* onboarding + pin */
    case "ob-next": view.ob=1; render(); setTimeout(()=>$("#nick")?.focus(),50); break;
    case "ob-nick": { const n=$("#nick").value.trim(); if(!n){ $("#nick").focus(); $("#nick").placeholder="Add a nickname to continue"; return; } S.nick=n; view.ob=2; pinBuf=""; save(); render(); break; }
    case "ob-skip": S.onboarded=true; save(); render(); toast(`Welcome, ${S.nick}`); break;
    case "pin": {
      if(v==="⌫") pinBuf=pinBuf.slice(0,-1); else if(pinBuf.length<4) pinBuf+=v;
      const mode=el.dataset.mode;
      if(pinBuf.length===4){
        if(mode==="ob-pin"){ S.pin=pinBuf; S.onboarded=true; pinBuf=""; save(); render(); toast(`Welcome, ${S.nick}. Your PIN is set.`); return; }
        if(mode==="new-pin"){ S.pin=pinBuf; S.prefs.autoLock=true; pinBuf=""; pinChange=false; save(); $("#layer").innerHTML=""; render(); toast("PIN saved"); return; }
        if(mode==="unlock"){ if(pinBuf===S.pin){ locked=false; pinBuf=""; render(); return; } pinBuf=""; render(); $("#pinmsg").textContent="That PIN doesn't match. Try again."; return; }
      }
      render(); break;
    }
    case "forgot": case "reset":
      if(a==="reset" && !confirm("Reset all demo data on this device?")) return;
      try{ localStorage.removeItem(KEY); }catch(_){}
      S=seed(); wheelV=null; applyPrefs(); locked=false; pinChange=false; pinBuf=""; view={tab:"today",sub:null}; $("#layer").innerHTML=""; render(); break;
    case "lock-now": locked=true; pinBuf=""; $("#layer").innerHTML=""; render(); break;

    /* Today */
    case "open-checkin": draft=null; go("checkin"); break;
    case "notify-on":
      askNotifyPermission().then(p=>{ render();
        toast(p==="granted"?"Reminders will ring on this phone":p==="denied"?"Notifications are blocked. You can allow them in your browser's site settings.":p==="unsupported"?"This browser can't show notifications. Reminders will pop up in Saathi.":"Notifications are still off"); });
      break;
    case "edit-reminders": go("settings"); setTimeout(()=>$("#reminders")?.scrollIntoView({block:"start"}),50); break;

    /* reminders */
    case "test-reminder": fireReminder({id:"test",kind:"checkin"},{test:true}); break;
    case "pop-open": $("#pop").innerHTML=""; openTarget(v); break;
    case "pop-snooze": snoozeReminder(v); $("#pop").innerHTML=""; toast("Okay, again in 10 minutes"); break;
    case "pop-close": $("#pop").innerHTML=""; break;

    /* check-in */
    case "mood": draft.mood=+v; keepNote(); render(); break;
    case "feel": toggle(draft.feelings,v); keepNote(); render(); break;
    case "cause": toggle(draft.causes,v); keepNote(); render(); break;
    case "sleep": draft.sleep=Math.min(14,Math.max(0,draft.sleep+ +v)); keepNote(); render(); break;
    case "energy": draft.energy=Math.min(5,Math.max(1,draft.energy+ +v)); keepNote(); render(); break;
    case "save-checkin": {
      keepNote(); const {prompt,...c}=draft;
      S.checkins=S.checkins.filter(x=>x.date!==today()).concat(c);
      // keep the sleep log in step, unless last night was logged on the Body screen
      const sl=S.sleep.find(x=>x.date===c.date);
      if(!sl) S.sleep.push({date:c.date,hours:+c.sleep,source:"check-in"}); else if(sl.source==="check-in") sl.hours=+c.sleep;
      save(); draft=null;
      if(c.mood<=1) { go("today"); toast("Check-in saved"); setTimeout(()=>openSheet(`<h2>That sounds like a heavy day</h2><p class="muted">Would any of these help right now?</p><button class="btn block" data-action="sos-breathe">Two-minute breathing</button><button class="btn block ghost" style="margin-top:10px" data-action="goto-support">See support options</button><button class="btn block ghost" style="margin-top:10px" data-action="close-sheet-btn">Not now</button>`),400); }
      else { go("today"); toast("Check-in saved"); }
      break;
    }
    case "goto-support": $("#layer").innerHTML=""; go("support"); break;

    /* screening */
    case "screen-start": startScreening(); break;
    case "screen-quit": quiz=null; go("today"); break;
    case "answer": {
      if(quiz.lock) return; quiz.lock=true; quiz.ans[quiz.i]=+v; render();
      timers.push(setTimeout(()=>{
        if(quiz.i<PHQ.length-1){ quiz.i++; }
        else { quiz.done=true; quiz.score=quiz.ans.reduce((s,x)=>s+x,0); S.screenings.push({date:today(),score:quiz.score}); save(); }
        quiz.lock=false; render(); $("#main").scrollTop=0;
      },250));
      break;
    }

    /* tools */
    case "tool-breathe": go("tools","breathe"); break;
    case "tool-ground": go("tools","ground",{step:0}); break;
    case "tool-journal": go("tools","journal",{prompt:PROMPTS[Math.floor(Math.random()*PROMPTS.length)]}); break;
    case "tool-focus": go("tools","focus",{focus:{mode:"focus",left:S.prefs.focusMin*60,running:false}}); break;
    case "tool-deadlines": go("tools","deadlines"); break;
    case "sos-breathe": $("#layer").innerHTML=""; go("tools","breathe"); setTimeout(startBreathing,300); break;
    case "breathe-start": startBreathing(); break;
    case "ground-next": if((view.step||0)<4){ view.step=(view.step||0)+1; render(); } else { toast("Well done. Take a moment before you carry on."); go("tools"); } break;
    case "new-prompt": { const cur=view.prompt; let p; do{ p=PROMPTS[Math.floor(Math.random()*PROMPTS.length)]; }while(p===cur); const txt=$("#jtext").value; view.prompt=p; render(); $("#jtext").value=txt; break; }
    case "save-journal": { const t=$("#jtext").value.trim(); if(!t){ $("#jtext").focus(); return; } S.journal.push({date:today(),prompt:view.prompt,text:t}); save(); render(); toast("Entry saved"); break; }
    case "focus-mode": clearTimers(); view.focus={mode:v,left:(v==="focus"?S.prefs.focusMin:S.prefs.breakMin)*60,running:false}; render(); break;
    case "focus-toggle": { const f=view.focus; f.running=!f.running; clearTimers(); if(f.running) timers.push(setInterval(focusTick,1000)); render(); break; }
    case "focus-reset": clearTimers(); view.focus.running=false; view.focus.left=(view.focus.mode==="focus"?S.prefs.focusMin:S.prefs.breakMin)*60; render(); break;
    case "add-deadline": { const t=$("#dtitle").value.trim(), d=$("#ddate").value; if(!t){ $("#dtitle").focus(); return; } S.deadlines.push({id:Date.now(),title:t,due:d||today()}); save(); render(); toast("Deadline added"); break; }
    case "del-deadline": S.deadlines=S.deadlines.filter(d=>String(d.id)!==v); save(); render(); toast("Marked as done"); break;

    /* body */
    case "water-set": S.water.n=Math.min(S.prefs.waterGoal,Math.max(0,+v)); save(); render(); break;
    case "save-sleep": {
      const sl=sleepDraft(), hours=sleepHours(sl.bed,sl.wake), c=todays();
      S.sleep=S.sleep.filter(x=>x.date!==today()).concat({date:today(),bed:sl.bed,wake:sl.wake,hours,source:"manual"});
      if(c) c.sleep=hours;   // the check-in shows the same number
      sl.saved=true; save(); render(); toast(`Saved: ${hoursText(hours)} of sleep`); break;
    }
    case "move": toggle(S.move.kinds,v); save(); render(); break;
    case "medical": go("body","medical"); break;
    case "save-medical": Object.assign(S.medical,{fullName:$("#mfn").value.trim(),studentId:$("#msid").value.trim(),blood:$("#mb").value,allergies:$("#ma").value.trim(),conditions:$("#mc").value.trim(),contactName:$("#mn").value.trim(),contactPhone:$("#mp").value.trim()}); save(); render(); toast("Card saved. Print or download it again to update the QR."); break;
    case "card-download": downloadCard(); break;
    case "card-print": printCard(); break;

    /* support */
    case "sub-plan": go("support","plan"); break;
    case "sub-counsellor": go("support","counsellor"); break;
    case "sub-family": go("support","family"); break;
    case "save-plan": S.plan={signs:$("#p1").value,helps:$("#p2").value,people:$("#p3").value,places:$("#p4").value}; save(); go("support"); toast("Safety plan saved"); break;
    case "send-request": S.requests.push({date:today(),anon:$("#anon").checked,how:$("#how").value,when:$("#when").value}); save(); go("support"); toast("Request sent to the counsellor (demo)"); break;
    case "save-trusted": { const n=$("#tn").value.trim(), p=$("#tp").value.trim(); if(!p){ $("#tp").focus(); return; } S.trusted={name:n||"My contact",phone:p}; save(); render(); toast("Contact saved"); break; }
    case "edit-trusted": S.trusted={name:"",phone:""}; save(); render(); break;
    case "copy-fam": { const t=$("#fam").value; (navigator.clipboard?navigator.clipboard.writeText(t):Promise.reject()).then(()=>toast("Note copied")).catch(()=>{ $("#fam").select(); toast("Select the text and copy it"); }); break; }
    case "sos-sms": {
      const send=(loc)=>{ window.location.href=`sms:${S.trusted.phone}?body=${encodeURIComponent("I'm having a really hard time and need someone. Can you call me?"+(loc?` I'm here: ${loc}`:""))}`; };
      if(navigator.geolocation) navigator.geolocation.getCurrentPosition(p=>send(`https://maps.google.com/?q=${p.coords.latitude.toFixed(5)},${p.coords.longitude.toFixed(5)}`),()=>send(""),{timeout:5000});
      else send("");
      break;
    }
  }
});
document.addEventListener("change", e=>{
  const el=e.target;
  if(el.dataset.pref){ setPref(el.dataset.pref, el.type==="checkbox"?el.checked:el.value); }
  if(el.dataset.rem){
    const r=S.reminders.find(x=>x.id===el.dataset.rem); if(!r) return;
    const f=el.dataset.field;
    if(f==="on") r.on=el.checked; else if(f==="time" && el.value) r.time=el.value; else if(f==="label") r.label=el.value.trim();
    // changing the check-in time moves the two-week check reminder with it
    if(r.id==="checkin" && f==="time"){ const sv=S.reminders.find(x=>x.id==="survey"); if(sv) sv.time=r.time; }
    save(); if(f!=="label") render();
  }
});
document.addEventListener("input", e=>{
  const el=e.target;
  if(el.classList.contains("range")) fillRange(el);
  if(el.dataset.action==="screen") onScreenSlide(el);
  if(el.dataset.sleep) onSleepSlide(el);
});
function startScreening(){ quiz={i:0,ans:[null,null,null,null],done:false}; view={tab:"checkin",sub:"screen"}; clearTimers(); render(); $("#main").scrollTop=0; }
/* Where a reminder (pop-up or phone notification) takes you. */
function openTarget(open){
  if(locked) return;   // unlock first; the reminder can be opened again from Today
  if(open==="checkin"){ draft=null; go("checkin"); }
  else if(open==="survey") startScreening();
  else if(open==="breathe") go("tools","breathe");
  else if(open==="focus") go("tools","focus",{focus:{mode:"focus",left:S.prefs.focusMin*60,running:false}});
  else go(open==="body"?"body":"today");
}
function toggle(arr,v){ const i=arr.indexOf(v); i>=0?arr.splice(i,1):arr.push(v); }
function keepNote(){ const n=$("#note"); if(n&&draft) draft.note=n.value; }
// keep scroll position when re-rendering the check-in form
const _render=render;
render=function(){ const m=$("#main"), sc=m.scrollTop, sameTab=m.dataset.k===view.tab+(view.sub||""); _render(); m.dataset.k=view.tab+(view.sub||""); if(sameTab) m.scrollTop=sc; };

/* ---------- start-up ---------- */
darkQuery.addEventListener("change", applyPrefs);
motionQuery.addEventListener("change", ()=>{ applyPrefs(); render(); });
// Offline support and phone notifications need the service worker (only works over http/https, not file://).
if("serviceWorker" in navigator && location.protocol.startsWith("http")){
  navigator.serviceWorker.register("sw.js").catch(()=>{});
  navigator.serviceWorker.addEventListener("message", e=>{ if(e.data?.type==="open") openTarget(e.data.open); });
}
applyPrefs();
render();
{ const o=new URLSearchParams(location.search).get("open"); if(o){ history.replaceState(null,"",location.pathname); openTarget(o); } }
checkReminders();
