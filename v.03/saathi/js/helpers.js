/* Saathi: Small shared helpers: dates, PHQ-4 score bands, toasts and navigation. */

/* ---------- helpers ---------- */
function latest(){ return S.checkins.slice().sort((a,b)=>a.date<b.date?-1:1).at(-1); }
function todays(){ return S.checkins.find(c=>c.date===today()); }
function daysUntil(d){ return Math.round((new Date(d+"T00:00:00") - new Date(today()+"T00:00:00"))/DAY); }
function greeting(){ const h=new Date().getHours(); return h<12?"Good morning":h<17?"Good afternoon":"Good evening"; }
function lastScreen(){ return S.screenings.slice().sort((a,b)=>a.date<b.date?-1:1).at(-1); }
function band(score){
  if(score<=2) return {t:"Things look steady right now.", d:"Your answers don't point to much distress. Keep checking in so you notice if that changes.", lvl:0};
  if(score<=5) return {t:"Some signs of stress.", d:"This is common, especially around exams. The tools below can help, and it's always fine to talk to someone.", lvl:1};
  if(score<=8) return {t:"It could really help to talk to someone.", d:"Your answers suggest you've been struggling for a while. A counsellor can help you work out what to do next, and you don't have to be in crisis to ask.", lvl:2};
  return {t:"You're carrying a lot right now.", d:"Please reach out today. You can call a free helpline below, or ask the campus counsellor to contact you.", lvl:3};
}
function toast(msg){
  const t=document.createElement("div"); t.className="toast"; t.setAttribute("role","status"); t.textContent=msg;
  $("#phone").appendChild(t); setTimeout(()=>t.remove(),2200);
}
function go(tab, sub=null, extra={}){ clearTimers(); view={tab, sub, ...extra}; render(); $("#main").scrollTop=0; }

/* ---------- sleep ---------- */
/* Hours slept on the night before `date`: from the sleep log if there is one, otherwise the check-in. */
function sleepFor(date){
  const s=S.sleep.find(x=>x.date===date); if(s) return +s.hours;
  const c=S.checkins.find(x=>x.date===date); return c ? +c.sleep : null;
}
function sleepWeek(){ const out=[]; for(let i=0;i<7;i++){ const h=sleepFor(dayOffset(i)); if(h!=null) out.push(h); } return out; }
function hoursText(h){ const m=Math.round(h*60); return `${Math.floor(m/60)} h${m%60?` ${m%60} min`:""}`; }

/* ---------- sliders ---------- */
/* Styled sliders (class "range") colour the track up to the thumb using --fill. */
function fillRange(el){ const min=+el.min||0, max=+el.max||100; el.style.setProperty("--fill", ((el.value-min)/(max-min)*100)+"%"); }
function initRanges(){ document.querySelectorAll("input.range").forEach(fillRange); }
function reducedMotion(){ return S.prefs.motion || matchMedia("(prefers-reduced-motion: reduce)").matches; }
