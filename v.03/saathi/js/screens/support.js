/* Saathi: Support tab: crisis helplines, counsellor request, safety plan, trusted contact and family note. */

function crisisBlock(){
  return `<div class="crisis" style="margin:14px 0">
    <h2>Talk to someone now</h2>
    <p class="small muted" style="margin:4px 0 6px">Free lines in Nepal. Some have set hours, so if one doesn't answer, try the next.</p>
    ${LINES.map(l=>`<div class="line"><div><b>${l.name}</b><span class="small muted">${l.note}</span></div><a class="call" href="tel:${l.tel}">${l.show}</a></div>`).join("")}
  </div>`;
}

function renderSupport(){
  const s=view.sub;
  if(s==="plan"){
    const p=S.plan;
    return `
    <button class="back" data-action="goto" data-tab="support">${ic.back}Support</button>
    <h1 class="hello">My safety plan<small>Fill this in on a calmer day, so it's ready on a hard one.</small></h1>
    <label class="f" for="p1">Signs that I'm starting to struggle</label><textarea class="t" id="p1" placeholder="e.g. I stop replying to friends, I can't sleep">${esc(p.signs)}</textarea>
    <label class="f" for="p2">Things that help me, even a little</label><textarea class="t" id="p2" placeholder="e.g. a walk, music, a shower">${esc(p.helps)}</textarea>
    <label class="f" for="p3">People I can reach out to</label><textarea class="t" id="p3" placeholder="Names and numbers">${esc(p.people)}</textarea>
    <label class="f" for="p4">Places where I feel safe</label><textarea class="t" id="p4" placeholder="e.g. the library, my cousin's place">${esc(p.places)}</textarea>
    <button class="btn block" style="margin-top:16px" data-action="save-plan">Save plan</button>`;
  }
  if(s==="counsellor") return `
    <button class="back" data-action="goto" data-tab="support">${ic.back}Support</button>
    <h1 class="hello">Talk to the counsellor<small>Free for students. You don't need a reason that feels "serious enough".</small></h1>
    <div class="panel"><label class="row" style="font-weight:700"><span>Stay anonymous</span><input type="checkbox" id="anon" checked style="width:22px;height:22px;accent-color:var(--pine)"></label><p class="small muted" style="margin:4px 0 0">The counsellor sees your nickname "${esc(S.nick)}" only. You can share your name later if you want to.</p></div>
    <label class="f" for="how">How would you like to talk?</label>
    <select class="t" id="how"><option>Chat in the app</option><option>Phone call</option><option>Meet in person</option></select>
    <label class="f" for="when">When suits you?</label>
    <select class="t" id="when"><option>As soon as possible</option><option>This week, daytime</option><option>This week, evening</option></select>
    <label class="f" for="what">Anything you'd like them to know first?</label>
    <textarea class="t" id="what" placeholder="Optional"></textarea>
    <button class="btn block" style="margin-top:16px" data-action="send-request">Send request</button>
    ${S.requests.length?`<p class="small muted">You've sent ${S.requests.length} request${S.requests.length>1?"s":""}. The counsellor usually replies within one working day.</p>`:""}`;
  if(s==="family") return `
    <button class="back" data-action="goto" data-tab="support">${ic.back}Support</button>
    <h1 class="hello">Talking to family<small>For when "they wouldn't understand" feels true.</small></h1>
    <div class="panel"><p style="margin-top:0">Some students find it easier to share a short note than to start the conversation. You can copy this and send it as it is, or change it.</p>
    <textarea class="t" id="fam" style="min-height:150px">I've been finding college stressful lately and it's been affecting my sleep and focus. I'm not in danger, but I'd like your support. Could we talk this weekend? I don't need you to fix it, I just want you to know.</textarea>
    <button class="btn block" style="margin-top:12px" data-action="copy-fam">Copy note</button></div>`;
  const t=S.trusted;
  return `
  <h1 class="hello">Support<small>Free help first. Everything here is optional.</small></h1>
  ${crisisBlock()}
  <button class="tool" data-action="sub-counsellor"><span class="ic">${ic.support}</span><span><strong>Talk to the campus counsellor</strong><span>Free, and you can stay anonymous</span></span></button>
  <button class="tool" data-action="sub-plan"><span class="ic">${ic.pen}</span><span><strong>My safety plan</strong><span>${S.plan.signs||S.plan.helps?"Saved. Tap to review":"Not filled in yet"}</span></span></button>
  <button class="tool" data-action="sub-family"><span class="ic">${ic.body}</span><span><strong>Talking to family</strong><span>A note you can send</span></span></button>
  <section class="sec"><h2>Someone I trust</h2>
    <div class="panel">
      ${t.phone?`<div class="row"><div><strong>${esc(t.name)}</strong><div class="small muted">${esc(t.phone)}</div></div><button class="link small" data-action="edit-trusted">Change</button></div>
      <a class="btn block" style="display:block;text-align:center;text-decoration:none;margin-top:12px" href="sms:${esc(t.phone)}?body=${encodeURIComponent("Hey, I'm having a hard day. Could you check on me when you get a chance?")}">Send "check on me" message</a>`
      :`<p class="muted small" style="margin-top:0">Add one person you'd be okay messaging on a hard day. They won't be told anything unless you send the message yourself.</p>
      <label class="f" for="tn" style="margin-top:0">Name</label><input class="t" id="tn" placeholder="e.g. Aayush">
      <label class="f" for="tp">Phone</label><input class="t" id="tp" inputmode="tel" placeholder="+977">
      <button class="btn block" style="margin-top:12px" data-action="save-trusted">Save contact</button>`}
    </div>
  </section>`;
}
