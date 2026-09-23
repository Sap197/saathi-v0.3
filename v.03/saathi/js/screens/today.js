/* Saathi: Today tab: greeting, check-in card, week chart, suggestion and next deadline. */

/* ---------- screens ---------- */
function weekChart(){
  let html='<div class="week" aria-label="Mood over the last 7 days">';
  for(let i=6;i>=0;i--){
    const d=dayOffset(i), c=S.checkins.find(x=>x.date===d);
    const lbl=new Date(d+"T00:00:00").toLocaleDateString("en",{weekday:"narrow"});
    if(c){
      const sk=SKIES[c.mood];
      html+=`<div class="d"><div class="b ${sk.cls}" style="height:${18+c.mood*16}px" title="${sk.n}, ${c.sleep}h sleep"></div><span class="l">${lbl}</span></div>`;
    } else html+=`<div class="d"><div class="b empty"></div><span class="l">${lbl}</span></div>`;
  }
  return html+'</div>';
}
/* Picks one tool that fits right now: something for focus or something to calm down. */
function suggestion(){
  const c=latest(), h=new Date().getHours();
  const soon=S.deadlines.find(d=>{const n=daysUntil(d.due); return n>=0&&n<=3;});
  const recent = c && daysUntil(c.date)>=-1;
  const feel = recent ? (c.feelings||[]) : [];
  if(feel.some(f=>f==="anxious"||f==="overwhelmed")) return {t:"Mind racing?", d:"Grounding pulls your attention back to the room you're in. It takes about two minutes.", a:"tool-ground", b:"Try grounding", kind:"calm"};
  if(h>=21 || h<4) return {t:"Winding down", d:"A slow breathing round before bed helps your body switch off.", a:"tool-breathe", b:"Start breathing", kind:"calm"};
  if(recent && c.sleep<6) return {t:"Short on sleep", d:`About ${c.sleep} hours last time. Keep study blocks short today, and try breathing before bed.`, a:"tool-breathe", b:"Start breathing", kind:"calm"};
  if(recent && c.mood<=2) return {t:"A heavy day", d:"Writing it down can make it feel more manageable. Try one guided prompt.", a:"tool-journal", b:"Open journal", kind:"calm"};
  if(soon || feel.includes("stressed") || (c&&(c.causes||[]).some(x=>x==="exams"||x==="deadlines"))) return {t:soon?`${soon.title} is coming up`:"Deadlines on your mind", d:`One ${S.prefs.focusMin}-minute focus block, then a real break. Starting is the hardest part.`, a:"tool-focus", b:"Start a focus block", kind:"focus"};
  return {t:"Keep what's working", d:"A quick grounding exercise takes two minutes and works anywhere.", a:"tool-ground", b:"Try grounding", kind:"calm"};
}
function calmTool(){ const c=latest(); return (c&&(c.feelings||[]).some(f=>f==="anxious"||f==="overwhelmed")) ? "tool-ground" : "tool-breathe"; }
function headline(){ const n=Math.floor(new Date(today()+"T00:00:00").getTime()/DAY); return HEADLINES[((n%HEADLINES.length)+HEADLINES.length)%HEADLINES.length]; }

function remindersCard(){
  const list=upcomingReminders().slice(0,3), perm=notifyPermission();
  const permRow = perm==="default" ? `<div class="notice"><span>Let reminders ring on this phone, even when Saathi is in the background.</span><button class="btn" data-action="notify-on">Turn on</button></div>`
    : perm==="denied" ? `<p class="small muted" style="margin:10px 0 0">Notifications are blocked for Saathi in your browser settings, so reminders only pop up while the app is open.</p>` : "";
  return `<section class="sec"><div class="row"><h2>Reminders today</h2><button class="link small" data-action="edit-reminders">Edit</button></div>
    <div class="panel">
      ${list.length?list.map(({r,t},i)=>`<div class="rem ${i===0?"next":""}"><span class="rem-t">${time12(t)}</span><span><b>${esc(r.kind==="work"&&r.label?r.label:REMINDER_KINDS[r.kind].name)}</b>${i===0?`<span class="small muted">Next</span>`:""}</span></div>`).join("")
        :`<p class="muted" style="margin:0">No more reminders today.</p>`}
      ${permRow}
    </div></section>`;
}

function renderToday(){
  const c=todays(), sk=c?SKIES[c.mood]:null, p=S.prefs.home;
  const ls=lastScreen(), due=surveyDue(), nextIn=ls?14+daysUntil(ls.date):0;
  const next=S.deadlines.slice().sort((a,b)=>a.due<b.due?-1:1).find(d=>daysUntil(d.due)>=0);
  const sg=suggestion();
  const avgSleep = (()=>{const r=sleepWeek(); return r.length? (r.reduce((s,x)=>s+ +x,0)/r.length).toFixed(1):"–";})();
  return `
  <h1 class="hello">${greeting()}, ${esc(S.nick||"friend")}<small>${new Date().toLocaleDateString("en",{weekday:"long",day:"numeric",month:"long"})}</small></h1>
  ${p.headline?`<p class="headline">${esc(headline())}</p>`:""}
  <div class="sky ${c?sk.cls:"s0"} ${c&&sk.dark?"dark":""}">
    ${c?`<h2>${S.prefs.checkStyle==="face"?`Today: ${FACES[c.mood]} ${sk.n}`:`Today's sky: ${sk.n}`}</h2><p>${sk.line}</p><button class="btn" data-action="open-checkin">Update check-in</button>`
       :`<h2>${S.prefs.checkStyle==="face"?"How are you feeling today?":"How's your sky today?"}</h2><p>A 30-second check-in. Only you can see it.</p><button class="btn" data-action="open-checkin">Check in</button>`}
  </div>
  ${p.due?(due
    ?`<div class="panel sec row survey due"><div><strong>Two-week check is due</strong><div class="muted small">Four questions, about a minute.</div></div><button class="btn" data-action="screen-start">Start</button></div>`
    :`<div class="panel sec row survey"><div><strong>Two-week check</strong><div class="muted small">Next one in ${nextIn} day${nextIn===1?"":"s"}. Last score ${ls.score} of 12.</div></div><button class="link small" data-action="screen-start">Take it now</button></div>`):""}
  ${p.reminders?remindersCard():""}
  ${p.suggest?`<section class="sec"><h2>Try a tool</h2><div class="panel">
    <span class="tag ${sg.kind}">${sg.kind==="focus"?"For focus":"For stress"}</span>
    <strong style="display:block;margin-top:8px">${esc(sg.t)}</strong><p class="muted small" style="margin:4px 0 12px">${sg.d}</p>
    <button class="btn block" data-action="${sg.a}">${sg.b}</button>
    <div class="quick"><span class="small muted">Or, right now I need to</span>
      <div class="chips"><button class="chip" data-action="tool-focus">focus</button><button class="chip" data-action="${calmTool()}">calm down</button></div></div>
  </div></section>`:""}
  ${p.week?`<section class="sec"><h2>Your week</h2><div class="panel">${weekChart()}<div class="row small muted" style="margin-top:10px"><span>Average sleep ${avgSleep} h</span><button class="link" data-action="goto" data-tab="body">Body</button></div></div></section>`:""}
  ${next&&p.next?`<section class="sec"><h2>Coming up</h2><div class="panel row"><div><strong>${esc(next.title)}</strong><div class="muted small">${daysUntil(next.due)===0?"Due today":`Due in ${daysUntil(next.due)} day${daysUntil(next.due)===1?"":"s"}`}</div></div><button class="btn ghost" data-action="tool-deadlines">Planner</button></div></section>`:""}
  `;
}
