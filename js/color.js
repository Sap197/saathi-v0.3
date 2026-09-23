/* Saathi: colour maths and the colour wheel in Settings.
 *
 * The student can pick any colour. accentPalette() turns it into the set of
 * colours the app needs and nudges it lighter or darker when needed so text on
 * buttons and links stays readable (WCAG AA, 4.5:1) in light and dark mode. */

/* ---------- conversions ---------- */
const clamp01 = x => Math.min(1, Math.max(0, x));
function hexToRgb(hex){ const n=parseInt(hex.slice(1),16); return [(n>>16)&255,(n>>8)&255,n&255]; }
function rgbToHex(r,g,b){ return "#"+[r,g,b].map(v=>Math.round(v).toString(16).padStart(2,"0")).join("").toUpperCase(); }
function rgbToHsl(r,g,b){
  r/=255; g/=255; b/=255;
  const mx=Math.max(r,g,b), mn=Math.min(r,g,b), l=(mx+mn)/2, d=mx-mn;
  let h=0, s=0;
  if(d){ s=d/(1-Math.abs(2*l-1)); h = mx===r ? ((g-b)/d)%6 : mx===g ? (b-r)/d+2 : (r-g)/d+4; h*=60; if(h<0) h+=360; }
  return [h,s,l];
}
function hslToRgb(h,s,l){
  const c=(1-Math.abs(2*l-1))*s, x=c*(1-Math.abs((h/60)%2-1)), m=l-c/2;
  const [r,g,b] = h<60?[c,x,0]:h<120?[x,c,0]:h<180?[0,c,x]:h<240?[0,x,c]:h<300?[x,0,c]:[c,0,x];
  return [(r+m)*255,(g+m)*255,(b+m)*255];
}
function hsvToRgb(h,s,v){
  const c=v*s, x=c*(1-Math.abs((h/60)%2-1)), m=v-c;
  const [r,g,b] = h<60?[c,x,0]:h<120?[x,c,0]:h<180?[0,c,x]:h<240?[0,x,c]:h<300?[x,0,c]:[c,0,x];
  return [(r+m)*255,(g+m)*255,(b+m)*255];
}
const hsvToHex = (h,s,v) => rgbToHex(...hsvToRgb(h,s,v));
function hexToHsv(hex){
  let [r,g,b]=hexToRgb(hex).map(v=>v/255);
  const mx=Math.max(r,g,b), mn=Math.min(r,g,b), d=mx-mn;
  let h=0;
  if(d){ h = mx===r ? ((g-b)/d)%6 : mx===g ? (b-r)/d+2 : (r-g)/d+4; h*=60; if(h<0) h+=360; }
  return [h, mx?d/mx:0, mx];
}
function luminance(hex){
  return hexToRgb(hex).map(v=>{ v/=255; return v<=0.03928 ? v/12.92 : Math.pow((v+0.055)/1.055,2.4); })
    .reduce((s,v,i)=>s+v*[0.2126,0.7152,0.0722][i],0);
}
function contrast(a,b){ const [x,y]=[luminance(a),luminance(b)].sort((p,q)=>q-p); return (x+0.05)/(y+0.05); }
function mix(a,b,t){ const A=hexToRgb(a), B=hexToRgb(b); return rgbToHex(...A.map((v,i)=>v*(1-t)+B[i]*t)); }

/* ---------- palette ---------- */
const LIGHT_SURFACE = "#FFFFFF", DARK_SURFACE = "#1B252C", DARK_ON = "#0E1A20";
function accentPalette(hex, dark){
  if(!/^#[0-9a-f]{6}$/i.test(hex)) hex = DEFAULT_ACCENT;
  let [h,s,l] = rgbToHsl(...hexToRgb(hex)), accent = hex.toUpperCase(), adjusted = false;
  if(!dark){
    // White text sits on the colour, and the colour is used for links on white.
    while(contrast(accent,"#FFFFFF")<4.5 && l>0.05){ l-=0.01; accent=rgbToHex(...hslToRgb(h,s,l)); adjusted=true; }
    return {accent, on:"#FFFFFF", soft:mix(accent,"#FFFFFF",0.86), adjusted};
  }
  // Dark mode: the colour needs to stand out against the dark surface, with dark text on it.
  if(l<0.62){ l=Math.max(l,0.62); accent=rgbToHex(...hslToRgb(h,Math.min(s,0.6),l)); }
  while((contrast(accent,DARK_SURFACE)<4.5 || contrast(accent,DARK_ON)<4.5) && l<0.95){ l+=0.01; accent=rgbToHex(...hslToRgb(h,Math.min(s,0.6),l)); }
  return {accent, on:DARK_ON, soft:mix(accent,DARK_SURFACE,0.8), adjusted:false};
}

/* ---------- colour wheel ---------- */
/* Hue goes around the wheel and strength goes from the centre (grey) to the edge.
   The slider below it sets brightness. Arrow keys work on the wheel too. */
let wheelV = null;   // brightness the wheel is drawn at (0.2–1)

function renderColourPicker(){
  const hex = S.prefs.accent, [,,v] = hexToHsv(hex);
  if(wheelV===null) wheelV = Math.max(0.2, v);
  const light = accentPalette(hex,false);
  return `
  <div class="picker">
    <div class="wheel-wrap">
      <canvas id="wheel" width="440" height="440" aria-hidden="true"></canvas>
      <div id="wheel-knob" class="wheel-knob" role="slider" tabindex="0"
        aria-label="Colour wheel. Left and right arrows change the colour, up and down change how strong it is."
        aria-valuetext="${hex}"></div>
    </div>
    <label class="small muted" for="wheel-v" style="display:block;margin-top:12px">Brightness</label>
    <input type="range" class="range" id="wheel-v" min="20" max="100" step="1" value="${Math.round(wheelV*100)}">
    <div class="picker-row">
      <span class="picked" id="picked" style="background:${hex}"></span>
      <label class="sr" for="hexin">Colour code</label>
      <input class="t hexin" id="hexin" value="${hex}" maxlength="7" spellcheck="false" autocomplete="off">
      <label class="native-pick" title="Pick with your device's colour picker"><input type="color" id="nativepick" value="${hex.toLowerCase()}"><span class="sr">Pick with your device's colour picker</span></label>
    </div>
    <p class="small muted" id="adj" style="margin:8px 0 0;min-height:1.3em">${light.adjusted?`Made a little darker (${light.accent}) so text stays easy to read.`:""}</p>
    <div class="swatches" role="group" aria-label="Quick colours" style="margin-top:10px;flex-wrap:wrap">
      ${ACCENT_PRESETS.map(([c,n])=>`<button class="swatch" style="background:${c}" aria-pressed="${hex.toUpperCase()===c}" aria-label="${n}" title="${n}" data-action="accent" data-v="${c}"></button>`).join("")}
    </div>
    ${hex.toUpperCase()!==DEFAULT_ACCENT?`<button class="link small" style="margin-top:12px" data-action="accent" data-v="${DEFAULT_ACCENT}">Back to Venice blue</button>`:""}
  </div>`;
}

function drawWheel(){
  const cv = document.getElementById("wheel"); if(!cv) return;
  const ctx = cv.getContext("2d"), W = cv.width, R = W/2, img = ctx.createImageData(W,W), d = img.data;
  for(let y=0;y<W;y++) for(let x=0;x<W;x++){
    const dx=x-R, dy=y-R, r=Math.sqrt(dx*dx+dy*dy), i=(y*W+x)*4;
    if(r>R){ d[i+3]=0; continue; }
    let h=Math.atan2(dy,dx)*180/Math.PI; if(h<0) h+=360;
    const [rr,gg,bb]=hsvToRgb(h, r/R, wheelV);
    d[i]=rr; d[i+1]=gg; d[i+2]=bb; d[i+3]= r>R-1.5 ? 255*(R-r)/1.5 : 255;   // soft edge
  }
  ctx.putImageData(img,0,0);
  placeKnob();
}
function placeKnob(){
  const knob = document.getElementById("wheel-knob"), cv = document.getElementById("wheel"); if(!knob||!cv) return;
  const [h,s] = hexToHsv(S.prefs.accent), R = cv.clientWidth/2, a = h*Math.PI/180;
  knob.style.left = (R + Math.cos(a)*s*R) + "px";
  knob.style.top  = (R + Math.sin(a)*s*R) + "px";
  knob.style.background = S.prefs.accent;
  knob.setAttribute("aria-valuetext", S.prefs.accent);
}

/* Updates the colour everywhere without redrawing the whole screen (used while dragging). */
function previewAccent(hex){
  S.prefs.accent = hex.toUpperCase();
  applyPrefs(); placeKnob();
  const p = document.getElementById("picked"); if(p) p.style.background = hex;
  const h = document.getElementById("hexin"); if(h && document.activeElement!==h) h.value = S.prefs.accent;
  const n = document.getElementById("nativepick"); if(n) n.value = hex.toLowerCase();
  const adj = document.getElementById("adj"), pal = accentPalette(hex,false);
  if(adj) adj.textContent = pal.adjusted ? `Made a little darker (${pal.accent}) so text stays easy to read.` : "";
  document.querySelectorAll(".swatch[data-action='accent']").forEach(b=>b.setAttribute("aria-pressed", b.dataset.v===S.prefs.accent));
}
function commitAccent(hex){ previewAccent(hex); save(); }

function initColourPicker(){
  const cv = document.getElementById("wheel"); if(!cv || cv.dataset.ready) return;
  cv.dataset.ready = "1";
  drawWheel();
  const pick = e => {
    const b = cv.getBoundingClientRect(), R = b.width/2, dx = e.clientX-b.left-R, dy = e.clientY-b.top-R;
    let h = Math.atan2(dy,dx)*180/Math.PI; if(h<0) h+=360;
    previewAccent(hsvToHex(h, Math.min(1, Math.hypot(dx,dy)/R), wheelV));
  };
  let dragging = false;
  cv.addEventListener("pointerdown", e=>{ dragging=true; cv.setPointerCapture(e.pointerId); pick(e); });
  cv.addEventListener("pointermove", e=>{ if(dragging) pick(e); });
  const end = ()=>{ if(dragging){ dragging=false; save(); } };
  cv.addEventListener("pointerup", end); cv.addEventListener("pointercancel", end);

  const knob = document.getElementById("wheel-knob");
  knob.addEventListener("keydown", e=>{
    let [h,s] = hexToHsv(S.prefs.accent);
    if(e.key==="ArrowLeft") h=(h+355)%360; else if(e.key==="ArrowRight") h=(h+5)%360;
    else if(e.key==="ArrowUp") s=clamp01(s+0.05); else if(e.key==="ArrowDown") s=clamp01(s-0.05);
    else return;
    e.preventDefault(); commitAccent(hsvToHex(h,s,wheelV));
  });
  knob.addEventListener("pointerdown", e=>{ dragging=true; cv.setPointerCapture(e.pointerId); });

  const vIn = document.getElementById("wheel-v");
  vIn.addEventListener("input", ()=>{
    wheelV = +vIn.value/100; fillRange(vIn); drawWheel();
    const [h,s] = hexToHsv(S.prefs.accent); previewAccent(hsvToHex(h,s,wheelV));
  });
  vIn.addEventListener("change", ()=>save());

  const hexIn = document.getElementById("hexin");
  hexIn.addEventListener("input", ()=>{ let v=hexIn.value.trim(); if(!v.startsWith("#")) v="#"+v; if(/^#[0-9a-f]{6}$/i.test(v)){ wheelV=Math.max(0.2,hexToHsv(v)[2]); document.getElementById("wheel-v").value=Math.round(wheelV*100); fillRange(vIn); drawWheel(); commitAccent(v); } });
  document.getElementById("nativepick").addEventListener("input", e=>{ wheelV=Math.max(0.2,hexToHsv(e.target.value)[2]); vIn.value=Math.round(wheelV*100); fillRange(vIn); drawWheel(); commitAccent(e.target.value); });
}
