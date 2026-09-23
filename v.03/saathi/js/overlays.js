/* Saathi: Onboarding, PIN pad, lock screen, bottom sheets and the SOS sheet. */

/* ---------- overlays ---------- */
function renderOnboard(){
  const step = view.ob || 0;
  if(step===0) return `<div class="overlay">
    <div class="sky s4" style="min-height:190px"><h2 style="font-size:2rem">Saathi</h2><p>A private space to check in with yourself, and find help when you want it.</p></div>
    <ul class="promise">
      <li>No real name needed. Pick any nickname.</li>
      <li>Your check-ins and journal stay private. The college can't see them.</li>
      <li>A PIN keeps the app locked on your phone.</li>
      <li>Saathi isn't a diagnosis or a doctor. It helps you notice patterns and find support.</li>
    </ul>
    <label class="f" for="lang" style="margin-top:0">Language</label>
    <select class="t" id="lang"><option value="en">English</option><option value="ne" disabled>नेपाली (coming in the next version)</option></select>
    <button class="btn block" style="margin-top:20px" data-action="ob-next">Get started</button>
  </div>`;
  if(step===1) return `<div class="overlay">
    <h1 class="hello">What should we call you?<small>Anything works. It doesn't have to be your name.</small></h1>
    <input class="t" id="nick" maxlength="20" placeholder="e.g. Himal, Moonlight, K" value="${esc(S.nick)}">
    <button class="btn block" style="margin-top:20px" data-action="ob-nick">Continue</button>
  </div>`;
  return `<div class="overlay">${pinPad("Set a 4-digit PIN","You'll use it to open Saathi. For this demo, pick something easy.","ob-pin")}
    <button class="link" style="margin:18px auto 0;display:block" data-action="ob-skip">Skip for now</button></div>`;
}
let pinBuf="";
function pinPad(title, sub, mode){
  return `<h1 class="hello" style="text-align:center">${title}<small>${sub}</small></h1>
  <div class="pinrow" aria-label="${pinBuf.length} of 4 digits entered">${[0,1,2,3].map(i=>`<i class="${i<pinBuf.length?"on":""}"></i>`).join("")}</div>
  <p id="pinmsg" class="small" style="text-align:center;min-height:1.5em;color:var(--rhodo)" role="alert"></p>
  <div class="pad">${[1,2,3,4,5,6,7,8,9,"",0,"⌫"].map(k=>k===""?'<button class="blank" tabindex="-1" aria-hidden="true"></button>':`<button data-action="pin" data-mode="${mode}" data-v="${k}" aria-label="${k==="⌫"?"Delete":k}">${k}</button>`).join("")}</div>`;
}
function renderLock(){
  return `<div class="overlay" style="justify-content:center">${pinPad(`Welcome back, ${esc(S.nick)}`,`Enter your PIN to open ${appName()}.`,"unlock")}
  <button class="link" style="margin:18px auto 0;display:block" data-action="forgot">Forgot PIN? Reset the demo</button></div>`;
}
function openSheet(html){
  $("#layer").innerHTML=`<div class="sheet-wrap" data-action="close-sheet"><div class="sheet" role="dialog" aria-modal="true">${html}</div></div>`;
  const f=$("#layer .sheet button, #layer .sheet a"); f&&f.focus();
}
function sosSheet(){
  const t=S.trusted;
  openSheet(`<h2>You're not alone</h2><p class="muted" style="margin-top:0">Choose what feels right. If you're in immediate danger, call 100 or 102.</p>
  <div class="line"><div><b>National Suicide Prevention Helpline</b><span class="small muted">Free call</span></div><a class="call" href="tel:1166">1166</a></div>
  <div class="line"><div><b>Ambulance</b><span class="small muted">Medical emergency</span></div><a class="call" href="tel:102">102</a></div>
  ${t.phone?`<div class="line"><div><b>Message ${esc(t.name)}</b><span class="small muted">Sends your location</span></div><button class="call soft" style="border:0" data-action="sos-sms">Send</button></div>`:""}
  <div class="line"><div><b>Calm down first</b><span class="small muted">Two-minute breathing</span></div><button class="call soft" style="border:0" data-action="sos-breathe">Start</button></div>
  <button class="btn block ghost" style="margin-top:14px" data-action="close-sheet-btn">Close</button>`);
}
