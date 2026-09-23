/* Saathi: Saved data, preferences and app state. Everything is stored in the browser (localStorage). */

/* ---------- state ---------- */
const KEY = "saathi-proto-v1";
const DAY = 86400000;
/* Dates are the student's LOCAL date as YYYY-MM-DD. (toISOString() gives the UTC
   date, which is wrong in Nepal between midnight and 5:45am.) */
const localDate = d => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
const today = () => localDate(new Date());
const dayOffset = n => { const d=new Date(); d.setDate(d.getDate()-n); return localDate(d); };
const DEFAULT_ACCENT = "#16587B";   // Venice blue

function seed(){
  const moods=[3,2,2,3,4,3], sleeps=[6,5,4.5,6.5,7,6];
  const checkins = moods.map((m,i)=>({date:dayOffset(6-i),mood:m,sleep:sleeps[i],energy:[3,2,2,3,4,3][i],feelings:[["stressed"],["tired","anxious"],["overwhelmed","tired"],["calm"],["hopeful","motivated"],["stressed"]][i],causes:[["exams"],["deadlines","career"],["exams","deadlines"],[],["career"],["money"]][i],note:""}));
  return {
    onboarded:false, nick:"", pin:"", lang:"en",
    checkins, screenings:[{date:dayOffset(15),score:5}],
    journal:[{date:dayOffset(2),prompt:"What's one thing that went better than you expected this week?",text:"Presentation practice went okay. I still felt shaky but nobody noticed."}],
    deadlines:[{id:1,title:"DBMS assignment",due:dayOffset(-3)},{id:2,title:"Marketing presentation",due:dayOffset(-6)}],
    sleep:[{date:dayOffset(1),bed:"23:45",wake:"06:30",hours:6.75,source:"manual"},{date:today(),bed:"00:30",wake:"06:30",hours:6,source:"manual"}],
    reminders:defaultReminders(),
    water:{date:today(),n:3}, move:{date:today(),kinds:[]}, screen:{date:today(),hours:5},
    medical:{fullName:"Anish Karki",studentId:"TIC-2025-0142",blood:"B+",allergies:"Penicillin",conditions:"Asthma (mild)",contactName:"Sita (sister)",contactPhone:"+977 98XXXXXXXX"},
    plan:{signs:"",helps:"",people:"",places:""},
    trusted:{name:"",phone:""},
    requests:[],
    prefs:defaultPrefs()
  };
}
function defaultPrefs(){ return {mode:"auto",accent:DEFAULT_ACCENT,text:"normal",motion:false,checkStyle:"sky",home:{headline:true,due:true,reminders:true,suggest:true,week:true,next:true},notify:{sound:true,vibrate:true},focusMin:25,breakMin:5,waterGoal:8,discreet:false,autoLock:true}; }
/* One entry per reminder. "time" is local HH:MM. Water repeats every 3 hours from its time until 21:00.
   The two-week survey reminder rings at the check-in time on the day the survey is due. */
function defaultReminders(){ return [
  {id:"checkin",   kind:"checkin",    on:true,  time:"20:00"},
  {id:"survey",    kind:"survey",     on:true,  time:"20:00"},
  {id:"meditation",kind:"meditation", on:true,  time:"07:00"},
  {id:"work",      kind:"work",       on:true,  time:"18:00", label:"Study block"},
  {id:"water",     kind:"water",      on:false, time:"10:00"},
  {id:"bedtime",   kind:"bedtime",    on:true,  time:"23:00"}
]; }
let S;
try{ S = JSON.parse(localStorage.getItem(KEY)) || seed(); }catch(e){ S = seed(); }
function save(){ try{ localStorage.setItem(KEY, JSON.stringify(S)); }catch(e){} }
/* Bring older saved data up to date. */
{ const d=defaultPrefs(), old=S.prefs||{};
  S.prefs=Object.assign(d,old);
  S.prefs.home=Object.assign(defaultPrefs().home,old.home);
  S.prefs.notify=Object.assign(defaultPrefs().notify,old.notify);
  const named={pine:"#2E5E4E",lake:"#2B5C7E",marigold:"#855700",plum:"#6B3F75"};   // v0.2 had four named colours
  if(!/^#[0-9a-f]{6}$/i.test(S.prefs.accent)) S.prefs.accent = S.prefs.accent==="pine" ? DEFAULT_ACCENT : (named[S.prefs.accent]||DEFAULT_ACCENT);
  if(!Array.isArray(S.reminders)){
    S.reminders=defaultReminders();
    if(old.remind){ const r=id=>S.reminders.find(x=>x.id===id);
      r("checkin").time=r("survey").time=old.remind.checkin||"20:00"; r("bedtime").time=old.remind.bedtime||"23:00"; r("water").on=!!old.remind.water;
      if(old.remind.on===false) S.reminders.forEach(x=>x.on=false); }
  }
  delete S.prefs.remind;
}
if(!Array.isArray(S.sleep)) S.sleep=[];
if(S.medical.fullName===undefined){ S.medical.fullName=""; S.medical.studentId=""; }
delete S.medical.token;   // the QR now holds the card details themselves, so no token is needed
if(S.water.date!==today()) S.water={date:today(),n:0};
if(S.move.date!==today()) S.move={date:today(),kinds:[]};
if(S.screen.date!==today()) S.screen={date:today(),hours:4};

let view = {tab:"today", sub:null};
let locked = !!(S.onboarded && S.pin && S.prefs.autoLock);
let pinChange = false;
let draft = null;       // check-in draft
let quiz = null;        // screening in progress
let timers = [];        // intervals/timeouts to clear on navigation

const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const $ = s => document.querySelector(s);
function clearTimers(){ timers.forEach(t=>{clearInterval(t);clearTimeout(t)}); timers=[]; }
