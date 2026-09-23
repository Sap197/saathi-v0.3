/* Saathi: Body tab: sleep, water, movement, phone time and the emergency medical card. */

/* Sleep sliders count minutes from a start time, so the bedtime slider can run past midnight. */
const BED = {start:18*60, span:10*60, ticks:["6 pm","9 pm","12 am","3 am"]};   // 6 pm → 4 am
const WAKE = {start:3*60, span:9*60, ticks:["3 am","6 am","9 am","12 pm"]};     // 3 am → 12 pm
const sliderToTime = (cfg,v) => fromMin((cfg.start+ +v)%1440);
const timeToSlider = (cfg,t) => ((toMin(t)-cfg.start)+1440)%1440;
function sleepHours(bed,wake){ return (((toMin(wake)-toMin(bed))+1440)%1440)/60; }
function sleepDraft(){
  if(!view.sleep){
    const s=S.sleep.find(x=>x.date===today()), prev=S.sleep.slice().sort((a,b)=>a.date<b.date?-1:1).at(-1);
    view.sleep = s ? {bed:s.bed, wake:s.wake, saved:true} : {bed:prev?.bed||"23:00", wake:prev?.wake||"07:00", saved:false};
  }
  return view.sleep;
}
function rangeTicks(labels){ return `<div class="ticks" aria-hidden="true">${labels.map(l=>`<span>${l}</span>`).join("")}</div>`; }

function renderBody(){
  if(view.sub==="medical") return renderMedical();
  const week=sleepWeek();
  const avgSleep=week.length?(week.reduce((s,x)=>s+x,0)/week.length).toFixed(1):"–";
  const r=S.checkins.filter(x=>daysUntil(x.date)>-7);
  const avgEnergy=r.length?(r.reduce((s,x)=>s+ +x.energy,0)/r.length).toFixed(1):"–";
  const moves=[["walk","Walk"],["sport","Sport or gym"],["yoga","Yoga or stretching"],["dance","Dance"]];
  const sl=sleepDraft(), hrs=sleepHours(sl.bed,sl.wake), m=S.medical, goal=S.prefs.waterGoal;
  return `
  <h1 class="hello">Body<small>Sleep, energy and the basics.</small></h1>
  <div class="tiles">
    <div class="tile"><div class="small muted">Sleep, 7 day average</div><div class="v">${avgSleep}<span class="small muted"> h</span></div><div class="small ${avgSleep<7?"":"muted"}">${avgSleep==="–"?"Log last night below":avgSleep<7?"Below the 7–9 h most students need":"In a healthy range"}</div></div>
    <div class="tile"><div class="small muted">Energy, 7 day average</div><div class="v">${avgEnergy}<span class="small muted"> /5</span></div><div class="small muted">From your check-ins</div></div>
  </div>

  <section class="sec"><h2>Last night</h2>
    <div class="panel">
      <div class="row"><div><div class="big" id="sl-h">${hoursText(hrs)}</div><div class="small muted" id="sl-range">${time12(sl.bed)} to ${time12(sl.wake)}</div></div>
        <span class="small ${hrs<7?"warn-text":"muted"}" id="sl-note">${hrs<7?"Less than 7 h":"Good amount"}</span></div>
      <label class="slabel" for="sl-bed"><span>Went to sleep</span><b id="sl-bed-v">${time12(sl.bed)}</b></label>
      <input type="range" class="range" id="sl-bed" data-sleep="bed" min="0" max="${BED.span}" step="15" value="${timeToSlider(BED,sl.bed)}" aria-valuetext="${time12(sl.bed)}">
      ${rangeTicks(BED.ticks)}
      <label class="slabel" for="sl-wake"><span>Woke up</span><b id="sl-wake-v">${time12(sl.wake)}</b></label>
      <input type="range" class="range" id="sl-wake" data-sleep="wake" min="0" max="${WAKE.span}" step="15" value="${timeToSlider(WAKE,sl.wake)}" aria-valuetext="${time12(sl.wake)}">
      ${rangeTicks(WAKE.ticks)}
      <button class="btn block ${sl.saved?"ghost":""}" style="margin-top:16px" data-action="save-sleep" id="sl-save">${sl.saved?"Saved. Update sleep":"Save sleep"}</button>
    </div>
  </section>

  <section class="sec"><h2>Today</h2>
    <div class="panel">
      <div class="row"><strong>Water</strong><span class="small muted">${S.water.n} of ${goal} glasses</span></div>
      <div class="glasses" role="group" aria-label="Glasses of water today">${Array.from({length:goal},(_,i)=>`<button class="glass" aria-pressed="${i<S.water.n}" aria-label="${i+1} glass${i?"es":""}" data-action="water-set" data-v="${i<S.water.n&&i===S.water.n-1?i:i+1}"></button>`).join("")}</div>
      <p class="small muted" style="margin:8px 0 0">Tap a glass to fill up to it. Tap the last one again to undo.</p>
    </div>
    <div class="panel"><strong>Did you move today?</strong><div class="chips" style="margin-top:10px">${moves.map(([k,l])=>`<button class="chip" aria-pressed="${S.move.kinds.includes(k)}" data-action="move" data-v="${k}">${l}</button>`).join("")}</div></div>
    <div class="panel">
      <label class="slabel" for="scr" style="margin-top:0"><strong>Phone time today</strong><b id="scrh">${S.screen.hours>=12?"12+ h":S.screen.hours+" h"}</b></label>
      <input type="range" class="range ${S.screen.hours>=6?"high":""}" id="scr" min="0" max="12" step="0.5" value="${S.screen.hours}" data-action="screen" aria-valuetext="${S.screen.hours} hours">
      ${rangeTicks(["0","3 h","6 h","9 h","12 h+"])}
      <p class="small muted" id="scrp" style="margin:8px 0 0">${screenNote(S.screen.hours)}</p>
    </div>
  </section>

  <section class="sec"><h2>Emergency medical card</h2>
    <button class="idcard" style="width:100%;border:0;text-align:left" data-action="medical">
      <div><div style="font-weight:700">${esc(m.fullName||"Add your name")}</div><div class="small" style="opacity:.75;margin-bottom:8px">${esc(m.studentId||"Student ID")}</div><div class="small" style="opacity:.75">Blood group</div><div class="blood">${esc(m.blood)}</div>${m.allergies?`<span class="warn">Allergy: ${esc(m.allergies)}</span>`:""}<div class="small" style="margin-top:10px;opacity:.85">Tap to edit, print or download</div></div>
      <div class="qr">${qrSvg(m)}</div>
    </button>
  </section>
  <section class="sec"><h2>Nearby care</h2>
    <div class="panel row"><div><strong>Hospitals near you</strong><div class="small muted">Opens your maps app</div></div><a class="call soft" href="https://www.google.com/maps/search/hospital+near+me" target="_blank" rel="noopener">Find</a></div>
    <div class="panel row"><div><strong>Ambulance</strong><div class="small muted">Medical emergency</div></div><a class="call" href="tel:102">Call 102</a></div>
  </section>`;
}
function screenNote(h){ return h>=6 ? "That's a lot of scrolling. Comparing yourself to others online can make low days lower." : "A rough guess is fine. This is just for you."; }

/* Live updates while a slider moves, without redrawing the whole screen. */
function onSleepSlide(el){
  const sl=sleepDraft(), cfg=el.dataset.sleep==="bed"?BED:WAKE, t=sliderToTime(cfg,el.value);
  sl[el.dataset.sleep]=t; sl.saved=false;
  el.setAttribute("aria-valuetext", time12(t));
  $(`#sl-${el.dataset.sleep}-v`).textContent=time12(t);
  const h=sleepHours(sl.bed,sl.wake);
  $("#sl-h").textContent=hoursText(h); $("#sl-range").textContent=`${time12(sl.bed)} to ${time12(sl.wake)}`;
  const note=$("#sl-note"); note.textContent=h<7?"Less than 7 h":"Good amount"; note.className=`small ${h<7?"warn-text":"muted"}`;
  const b=$("#sl-save"); b.textContent="Save sleep"; b.classList.remove("ghost");
}
function onScreenSlide(el){
  S.screen.hours=+el.value; save();
  $("#scrh").textContent=S.screen.hours>=12?"12+ h":S.screen.hours+" h";
  el.setAttribute("aria-valuetext", `${S.screen.hours} hours`);
  el.classList.toggle("high", S.screen.hours>=6);
  $("#scrp").textContent=screenNote(S.screen.hours);
}

function renderMedical(){
  const m=S.medical, L=MED_LIMITS;
  return `
  <button class="back" data-action="goto" data-tab="body">${ic.back}Body</button>
  <h1 class="hello">Emergency medical card<small>Print it or save it, and keep it with your student ID.</small></h1>
  <img id="cardprev" class="cardprev" alt="Your emergency medical card, with a QR code">
  <div class="row" style="margin-top:12px;gap:10px">
    <button class="btn block" data-action="card-download">Download</button>
    <button class="btn block ghost" data-action="card-print">Print</button>
  </div>
  <div class="notice" style="margin-top:14px"><span><b>Anyone who scans the QR can read these details</b>, even with no internet. It works like a medical ID bracelet, so only add what you're comfortable sharing. Your check-ins, journal and screening results are never on it.</span></div>
  <p class="small muted" style="margin:12px 0 0">Staff need to know who you are in an emergency, so this card uses your real name. Everything else in Saathi still uses your nickname.</p>
  <label class="f" for="mfn">Full name</label><input class="t" id="mfn" value="${esc(m.fullName)}" maxlength="${L.fullName}" placeholder="As on your student ID" autocomplete="name">
  <label class="f" for="msid">Student ID</label><input class="t" id="msid" value="${esc(m.studentId)}" maxlength="${L.studentId}" placeholder="e.g. TIC-2025-0142">
  <label class="f" for="mb">Blood group</label>
  <select class="t" id="mb">${["A+","A−","B+","B−","AB+","AB−","O+","O−","Not sure"].map(b=>`<option ${b===m.blood?"selected":""}>${b}</option>`).join("")}</select>
  <label class="f" for="ma">Allergies</label><input class="t" id="ma" value="${esc(m.allergies)}" maxlength="${L.allergies}" placeholder="e.g. Penicillin, peanuts">
  <label class="f" for="mc">Conditions staff should know about</label><input class="t" id="mc" value="${esc(m.conditions)}" maxlength="${L.conditions}" placeholder="e.g. Asthma, epilepsy">
  <label class="f" for="mn">Emergency contact</label><input class="t" id="mn" value="${esc(m.contactName)}" maxlength="${L.contactName}" placeholder="Name and relationship">
  <label class="f" for="mp">Their phone</label><input class="t" id="mp" value="${esc(m.contactPhone)}" maxlength="${L.contactPhone}" inputmode="tel">
  <button class="btn block" style="margin-top:16px" data-action="save-medical">Save card</button>
  <p class="small muted" style="text-align:center">After changing anything, print or download the card again. Old printed cards keep the old details.</p>`;
}
