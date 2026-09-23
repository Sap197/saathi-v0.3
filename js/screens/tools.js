/* Saathi: Tools tab: breathing, grounding, journal, focus timer and deadlines. */

function renderTools(){
  const s=view.sub;
  if(s==="breathe") return `
    <button class="back" data-action="goto" data-tab="tools">${ic.back}Tools</button>
    <h1 class="hello">Breathe<small>In for 4, hold for 4, out for 6. Four rounds.</small></h1>
    <div class="breath"><div class="orb" id="orb"></div></div>
    <div class="phase" id="phase" aria-live="polite">Ready when you are</div>
    <button class="btn block" id="bstart" data-action="breathe-start">Start</button>`;
  if(s==="ground"){
    const steps=[["5","things you can see","Look around slowly. Name them in your head."],["4","things you can touch","Your chair, your sleeve, the floor under your feet."],["3","things you can hear","Near sounds and far sounds."],["2","things you can smell","Or two smells you like, if nothing's around."],["1","thing you can taste","Or take a sip of water."]];
    const k=view.step||0, st=steps[k];
    return `
    <button class="back" data-action="goto" data-tab="tools">${ic.back}Tools</button>
    <h1 class="hello">Ground yourself<small>For when your mind is racing.</small></h1>
    <div class="progress" aria-hidden="true"><i style="width:${((k+1)/5)*100}%"></i></div>
    <div class="panel" style="text-align:center;padding:28px 16px">
      <div class="timer" style="font-size:5rem">${st[0]}</div>
      <h2 style="font-size:1.4rem">${st[1]}</h2><p class="muted">${st[2]}</p>
    </div>
    <button class="btn block" style="margin-top:14px" data-action="ground-next">${k<4?"Next":"Finish"}</button>`;
  }
  if(s==="journal") {
    const p=view.prompt ?? PROMPTS[0];
    return `
    <button class="back" data-action="goto" data-tab="tools">${ic.back}Tools</button>
    <h1 class="hello">Journal<small>Only you can read this.</small></h1>
    <div class="panel"><div class="row"><strong>${esc(p)}</strong></div><button class="link small" data-action="new-prompt" style="margin-top:6px">Different prompt</button>
    <textarea class="t" id="jtext" style="margin-top:10px" placeholder="Write as much or as little as you like."></textarea>
    <button class="btn block" style="margin-top:12px" data-action="save-journal">Save entry</button></div>
    <section class="sec"><h2>Past entries</h2><div class="panel">${S.journal.length?S.journal.slice().reverse().map(j=>`<div class="entry"><div class="small muted">${new Date(j.date+"T00:00:00").toLocaleDateString("en",{day:"numeric",month:"short"})} · ${esc(j.prompt)}</div><div>${esc(j.text)}</div></div>`).join(""):'<p class="muted">Nothing yet. Your first entry will show here.</p>'}</div></section>`;
  }
  if(s==="focus") {
    const f=view.focus;
    return `
    <button class="back" data-action="goto" data-tab="tools">${ic.back}Tools</button>
    <h1 class="hello">Focus timer<small>${S.prefs.focusMin} minutes on one thing, then a ${S.prefs.breakMin} minute break.</small></h1>
    <div class="chips" style="justify-content:center"><button class="chip" aria-pressed="${f.mode==="focus"}" data-action="focus-mode" data-v="focus">Focus</button><button class="chip" aria-pressed="${f.mode==="break"}" data-action="focus-mode" data-v="break">Break</button></div>
    <div class="timer" id="clock" style="margin:28px 0" aria-live="off">${fmt(f.left)}</div>
    <div class="row"><button class="btn block" data-action="focus-toggle">${f.running?"Pause":"Start"}</button><button class="btn ghost" data-action="focus-reset">Reset</button></div>
    <p class="small muted" style="text-align:center;margin-top:18px">Put your phone face down. Saathi will tell you when it's time.</p>`;
  }
  if(s==="deadlines") return `
    <button class="back" data-action="goto" data-tab="tools">${ic.back}Tools</button>
    <h1 class="hello">Deadlines<small>Seeing it all in one place makes it smaller.</small></h1>
    <div class="panel">${S.deadlines.length?S.deadlines.slice().sort((a,b)=>a.due<b.due?-1:1).map(d=>{const n=daysUntil(d.due);return `<div class="line"><div><b>${esc(d.title)}</b><span class="small muted">${n<0?`${-n} day${n===-1?"":"s"} ago`:n===0?"Due today":`In ${n} day${n===1?"":"s"}`}</span></div><button class="link small" data-action="del-deadline" data-v="${d.id}">Done</button></div>`}).join(""):'<p class="muted" style="margin:0">No deadlines yet. Add your next one below.</p>'}</div>
    <label class="f" for="dtitle">What's due?</label><input class="t" id="dtitle" placeholder="e.g. Statistics quiz">
    <label class="f" for="ddate">When?</label><input class="t" id="ddate" type="date" value="${dayOffset(-7)}">
    <button class="btn block" style="margin-top:14px" data-action="add-deadline">Add deadline</button>`;
  return `
  <h1 class="hello">Tools<small>Things you can do on your own, any time.</small></h1>
  <button class="tool" data-action="tool-breathe"><span class="ic">${ic.wind}</span><span><strong>Breathe</strong><span>Two minutes to slow things down</span></span></button>
  <button class="tool" data-action="tool-ground"><span class="ic">${ic.hand}</span><span><strong>Ground yourself</strong><span>5-4-3-2-1 for a racing mind</span></span></button>
  <button class="tool" data-action="tool-journal"><span class="ic">${ic.pen}</span><span><strong>Journal</strong><span>A prompt when feelings are hard to explain</span></span></button>
  <button class="tool" data-action="tool-focus"><span class="ic">${ic.clock}</span><span><strong>Focus timer</strong><span>Study in short, focused blocks</span></span></button>
  <button class="tool" data-action="tool-deadlines"><span class="ic">${ic.cal}</span><span><strong>Deadlines</strong><span>Exams and assignments in one list</span></span></button>
  `;
}
const fmt = s => `${String(Math.floor(s/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`;


/* ---------- breathing + focus ---------- */
function startBreathing(){
  clearTimers();
  const orb=$("#orb"), ph=$("#phase"), btn=$("#bstart"); if(!orb) return;
  if(reducedMotion()) return startBreathingStill(orb, ph, btn);
  btn.disabled=true; let round=0;
  const cycle=()=>{
    if(round>=4){ ph.textContent="Nice. Notice how you feel now."; orb.classList.remove("big"); btn.disabled=false; btn.textContent="Again"; return; }
    round++;
    orb.style.transitionDuration="4s"; orb.classList.add("big"); ph.textContent=`Breathe in… (round ${round} of 4)`;
    timers.push(setTimeout(()=>{ ph.textContent="Hold…"; },4000));
    timers.push(setTimeout(()=>{ orb.style.transitionDuration="6s"; orb.classList.remove("big"); ph.textContent="Breathe out slowly…"; },8000));
    timers.push(setTimeout(cycle,14000));
  };
  cycle();
}
/* Reduce motion version: the circle doesn't grow. It changes colour for each
   phase and counts down the seconds, so the rhythm is still easy to follow. */
function startBreathingStill(orb, ph, btn){
  btn.disabled=true;
  const phases=[["in","Breathe in",4],["hold","Hold",4],["out","Breathe out slowly",6]];
  let round=1, p=0, left=phases[0][2];
  const show=()=>{ const [k,label]=phases[p]; orb.dataset.phase=k; orb.textContent=left; ph.textContent=`${label}… (round ${round} of 4)`; };
  show();
  timers.push(setInterval(()=>{
    left--;
    if(left<=0){ p++; if(p===phases.length){ p=0; round++; } if(round>4){ clearTimers(); delete orb.dataset.phase; orb.textContent=""; ph.textContent="Nice. Notice how you feel now."; btn.disabled=false; btn.textContent="Again"; return; } left=phases[p][2]; }
    show();
  },1000));
}
function focusTick(){
  const f=view.focus; if(!f||!f.running) return;
  f.left--; const c=$("#clock"); if(c) c.textContent=fmt(f.left);
  if(f.left<=0){ clearTimers(); f.running=false; f.mode=f.mode==="focus"?"break":"focus"; f.left=(f.mode==="focus"?S.prefs.focusMin:S.prefs.breakMin)*60; toast(f.mode==="break"?"Focus block done. Take a real break.":"Break's over. Ready for another block?"); render(); }
}
