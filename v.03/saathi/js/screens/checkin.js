/* Saathi: Check in tab: daily mood check-in and the two-week PHQ-4 screening. */

function renderCheckin(){
  if(view.sub==="screen") return renderScreen();
  if(!draft){
    const c=todays();
    draft = c? JSON.parse(JSON.stringify(c)) : {date:today(),mood:0,sleep:sleepFor(today()) ?? 7,energy:3,feelings:[],causes:[],note:""};
    draft.prompt = PROMPTS[new Date().getDate()%PROMPTS.length];
  }
  const d=draft;
  return `
  <button class="back" data-action="goto" data-tab="today">${ic.back}Today</button>
  <h1 class="hello">Check in<small>Private to you. Skip anything you like.</small></h1>
  <label class="f" id="skyl">${S.prefs.checkStyle==="face"?"How are you feeling today?":"What's your sky like today?"}</label>
  <div class="skypick" role="group" aria-labelledby="skyl">
    ${[1,2,3,4,5].map(i=>S.prefs.checkStyle==="face"?`<button class="face" aria-pressed="${d.mood===i}" data-action="mood" data-v="${i}"><span aria-hidden="true">${FACES[i]}</span>${SKIES[i].n}</button>`:`<button class="${SKIES[i].cls} ${SKIES[i].dark?"dk":""}" aria-pressed="${d.mood===i}" data-action="mood" data-v="${i}">${SKIES[i].n}</button>`).join("")}
  </div>
  <label class="f">Which words fit?</label>
  <div class="chips">${FEELINGS.map(f=>`<button class="chip" aria-pressed="${d.feelings.includes(f)}" data-action="feel" data-v="${f}">${f}</button>`).join("")}</div>
  <label class="f">Anything weighing on you?</label>
  <div class="chips">${CAUSES.map(([k,l])=>`<button class="chip" aria-pressed="${d.causes.includes(k)}" data-action="cause" data-v="${k}">${l}</button>`).join("")}</div>
  <div class="tiles" style="margin-top:18px">
    <div class="tile"><div class="small muted">Sleep last night</div><div class="stepper" style="margin-top:6px"><button data-action="sleep" data-v="-0.5" aria-label="Less sleep">−</button><span class="v" style="font-family:var(--display);font-size:1.4rem;font-weight:700">${d.sleep}h</span><button data-action="sleep" data-v="0.5" aria-label="More sleep">+</button></div></div>
    <div class="tile"><div class="small muted">Energy</div><div class="stepper" style="margin-top:6px"><button data-action="energy" data-v="-1" aria-label="Less energy">−</button><span style="font-family:var(--display);font-size:1.4rem;font-weight:700">${d.energy}/5</span><button data-action="energy" data-v="1" aria-label="More energy">+</button></div></div>
  </div>
  <label class="f" for="note">${esc(d.prompt)}</label>
  <textarea class="t" id="note" placeholder="Optional. A few words is enough.">${esc(d.note)}</textarea>
  <button class="btn block" style="margin-top:18px" data-action="save-checkin" ${d.mood?"":"disabled"}>Save check-in</button>
  <p class="small muted" style="text-align:center">Pick ${S.prefs.checkStyle==="face"?"a face":"a sky"} to save. <button class="link" data-action="screen-start">Take the two-week check</button></p>
  `;
}

function renderScreen(){
  if(quiz.done){
    const b=band(quiz.score), a=quiz.ans[0]+quiz.ans[1], dp=quiz.ans[2]+quiz.ans[3];
    return `
    <button class="back" data-action="goto" data-tab="today">${ic.back}Done</button>
    <h1 class="hello">Your two-week check</h1>
    <div class="result ${b.lvl>=2?"high":""}"><h2 style="font-size:1.3rem">${b.t}</h2><p style="margin:8px 0 0">${b.d}</p></div>
    <p class="small muted">Score ${quiz.score} of 12. Worry items ${a}/6, mood items ${dp}/6. This is a screening tool, not a diagnosis.</p>
    ${b.lvl>=3?crisisBlock():""}
    ${b.lvl>=2?`<button class="btn block" data-action="goto" data-tab="support">Ask the counsellor to reach me</button>`:""}
    ${b.lvl<2?`<button class="btn block ghost" data-action="goto" data-tab="tools">Open tools</button>`:`<button class="btn block ghost" style="margin-top:10px" data-action="goto" data-tab="tools">Open tools</button>`}
    `;
  }
  const i=quiz.i, q=PHQ[i];
  return `
  <button class="back" data-action="screen-quit">${ic.back}Stop</button>
  <h1 class="hello">Over the last two weeks<small>How often have you been bothered by this?</small></h1>
  <div class="progress" aria-hidden="true"><i style="width:${(i/PHQ.length)*100}%"></i></div>
  <p class="small muted">Question ${i+1} of ${PHQ.length}</p>
  <h2 style="font-size:1.35rem">${q.q}</h2>
  ${OPTS.map((o,v)=>`<button class="qopt" aria-pressed="${quiz.ans[i]===v}" data-action="answer" data-v="${v}">${o}</button>`).join("")}
  `;
}
