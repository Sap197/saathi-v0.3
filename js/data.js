/* Saathi: Fixed content: moods, feelings, stressors, journal prompts, PHQ-4 questions, helplines, icons and tabs. */

/* ---------- constants ---------- */
const SKIES = [
  null,
  {n:"Heavy", cls:"s1", dark:true, line:"Heavy days happen. Go gently."},
  {n:"Low", cls:"s2", dark:true, line:"A low day. Small things count today."},
  {n:"Okay", cls:"s3", dark:false, line:"Steady enough. Keep an eye on yourself."},
  {n:"Good", cls:"s4", dark:false, line:"A good day. Notice what helped."},
  {n:"Bright", cls:"s5", dark:false, line:"Bright skies. Worth remembering."}
];
const FEELINGS = ["stressed","anxious","tired","lonely","overwhelmed","homesick","irritable","calm","hopeful","motivated","content","numb"];
const CAUSES = [["exams","Exams"],["deadlines","Deadlines"],["career","Career worries"],["money","Money or fees"],["family","Family"],["relationships","Relationships"],["health","Health"],["social","Social media"],["abroad","Pressure to go abroad"]];
const PROMPTS = [
  "What's taking up the most space in your head right now?",
  "If a friend felt the way you do today, what would you tell them?",
  "What's one thing that went better than you expected this week?",
  "What would make tomorrow 10% easier?",
  "Name something you're carrying that isn't yours to carry."
];
const PHQ = [
  {q:"Feeling nervous, anxious or on edge", k:"a"},
  {q:"Not being able to stop or control worrying", k:"a"},
  {q:"Feeling down, depressed or hopeless", k:"d"},
  {q:"Little interest or pleasure in doing things", k:"d"}
];
const OPTS = ["Not at all","Several days","More than half the days","Nearly every day"];
const LINES = [
  {name:"National Suicide Prevention Helpline", note:"Government line run with TPO Nepal", tel:"1166", show:"1166"},
  {name:"TPO Nepal psychosocial support", note:"Free counselling by phone", tel:"16600102005", show:"1660-010-2005"},
  {name:"TU Teaching Hospital helpline", note:"Mental health support", tel:"16600121600", show:"1660-012-1600"},
  {name:"Ambulance", note:"Medical emergency", tel:"102", show:"102"},
  {name:"Police", note:"If you're in danger", tel:"100", show:"100"}
];

/* ---------- icons ---------- */
const ic = {
  today:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>',
  checkin:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M3 17c3-4 6-4 9 0s6 4 9 0"/><path d="M3 11c3-4 6-4 9 0s6 4 9 0"/></svg>',
  tools:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4"/></svg>',
  body:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20.8 5.6a5 5 0 0 0-7.1 0L12 7.3l-1.7-1.7a5 5 0 0 0-7.1 7.1L12 21.5l8.8-8.8a5 5 0 0 0 0-7.1z"/></svg>',
  support:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20.5l1.4-5A8 8 0 1 1 21 12z"/></svg>',
  back:'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M15 18l-6-6 6-6"/></svg>',
  wind:'<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M3 8h11a3 3 0 1 0-3-3M3 16h15a3 3 0 1 1-3 3M3 12h7"/></svg>',
  hand:'<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M8 13V5a1.5 1.5 0 0 1 3 0v6M11 11V4a1.5 1.5 0 0 1 3 0v7M14 11V5.5a1.5 1.5 0 0 1 3 0V14a7 7 0 0 1-12.3 4.6L3 16a1.6 1.6 0 0 1 2.4-2L8 16"/></svg>',
  pen:'<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/></svg>',
  clock:'<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="13" r="8"/><path d="M12 9v4l2 2M9 2h6"/></svg>',
  settings:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0"/><circle cx="16" cy="6" r="2"/><circle cx="10" cy="12" r="2"/><circle cx="18" cy="18" r="2"/></svg>',
  cal:'<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><rect x="3" y="5" width="18" height="16" rx="3"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>'
};
/* The daily check-in and two-week check open from the Today screen, so they have no tab. */
const TABS = [["today","Today"],["tools","Tools"],["body","Body"],["support","Support"],["settings","Settings"]];
const FACES = ["","😞","🙁","😐","🙂","😄"];
/* Quick picks under the colour wheel. Venice blue is the default. */
const ACCENT_PRESETS = [["#16587B","Venice blue"],["#2E5E4E","Pine"],["#7A3E9D","Plum"],["#B4543A","Terracotta"],["#8A6008","Marigold"],["#B03A63","Rhododendron"]];

/* A short thought for the top of the Today screen. One per day, in order. */
const HEADLINES = [
  "You don't have to feel ready to start. Five minutes counts.",
  "Rest is part of studying, not a break from it.",
  "A bad day isn't a bad week. Tomorrow starts fresh.",
  "Comparing your inside to someone else's outside never works.",
  "Asking for help is a skill, not a weakness.",
  "Drink some water. Your brain is mostly water too.",
  "One thing at a time is still progress.",
  "You're allowed to not have your whole career figured out.",
  "Sleep is when your brain files away what you studied.",
  "Being kind to yourself makes it easier to keep going.",
  "Small breaks stop small stress becoming big stress.",
  "It's okay if today was just about getting through it.",
  "You've handled hard weeks before. This one too.",
  "Talking about it out loud often makes it smaller."
];

/* Reminder types: what the notification says, and what opens when it's tapped. */
const REMINDER_KINDS = {
  checkin:    {name:"Daily check-in",      title:"Time for your check-in",     body:"30 seconds. How was today?",                          open:"checkin"},
  survey:     {name:"Two-week check",      title:"Your two-week check is due",  body:"Four quick questions. It helps you spot patterns.",   open:"survey"},
  meditation: {name:"Meditation",          title:"Two minutes to breathe",      body:"A short breathing session before the day gets busy.", open:"breathe"},
  work:       {name:"Work or study block", title:"Study block",                 body:"One focus session. Phone face down.",                 open:"focus"},
  water:      {name:"Water",               title:"Water break",                 body:"Have a glass of water.",                              open:"body"},
  bedtime:    {name:"Wind down for bed",   title:"Time to wind down",           body:"Screens down soon. A slow breath helps you sleep.",   open:"breathe"}
};
