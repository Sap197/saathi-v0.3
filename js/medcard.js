/* Saathi: the emergency medical card.
 *
 * The QR code holds the card details as plain text, so any phone camera can
 * read it with no internet and no app. The card can be downloaded as a PNG
 * (credit-card size at 300 dpi) or printed.
 *
 * Because anyone who scans the code can read it, the Body screen tells the
 * student this, the same way a medical ID bracelet works. */

qrcode.stringToBytes = qrcode.stringToBytesFuncs["UTF-8"];   // so names in Nepali script work

const CARD_W = 1012, CARD_H = 638;   // 85.6 × 54 mm (ID-1 card) at 300 dpi
const MED_LIMITS = {fullName:40, studentId:24, allergies:60, conditions:60, contactName:40, contactPhone:20};

/* The text inside the QR. Kept short so the code stays easy to scan when printed small. */
function medicalText(m){
  const v = (x, none="Not given") => (String(x||"").trim() || none).replace(/−/g,"-");
  return [
    "EMERGENCY MEDICAL INFO",
    `Name: ${v(m.fullName)}`,
    `Student ID: ${v(m.studentId)}`,
    `Blood group: ${v(m.blood)}`,
    `Allergies: ${v(m.allergies)}`,
    `Conditions: ${v(m.conditions)}`,
    `Emergency contact: ${v(m.contactName)}`,
    `Contact phone: ${v(m.contactPhone)}`
  ].join("\n");
}
function makeQR(text){ const q = qrcode(0,"M"); q.addData(text,"Byte"); q.make(); return q; }

/* Crisp SVG version for the screen. */
function qrSvg(m, label="Emergency medical QR code"){
  const q = makeQR(medicalText(m)), n = q.getModuleCount(), pad = 2;
  let d = "";
  for(let r=0;r<n;r++) for(let c=0;c<n;c++) if(q.isDark(r,c)) d += `M${c+pad} ${r+pad}h1v1h-1z`;
  return `<svg viewBox="0 0 ${n+pad*2} ${n+pad*2}" role="img" aria-label="${label}" shape-rendering="crispEdges"><rect width="100%" height="100%" fill="#fff"/><path d="${d}" fill="#000"/></svg>`;
}

/* ---------- card image ---------- */
function fitText(ctx, text, maxW){
  if(ctx.measureText(text).width<=maxW) return text;
  let t = text; while(t.length>1 && ctx.measureText(t+"…").width>maxW) t=t.slice(0,-1);
  return t+"…";
}
function roundRect(ctx,x,y,w,h,r){   // ctx.roundRect isn't in older phone browsers
  ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath();
}
function cardCanvas(m){
  const cv = document.createElement("canvas"); cv.width = CARD_W; cv.height = CARD_H;
  const ctx = cv.getContext("2d"), accent = accentPalette(S.prefs.accent,false).accent;
  const font = (w,px) => `${w} ${px}px "Atkinson Hyperlegible", "Segoe UI", Arial, sans-serif`;
  const ink = "#14212B", muted = "#536B78", red = "#B3243C";

  // card shape with rounded corners
  roundRect(ctx,0,0,CARD_W,CARD_H,34); ctx.clip();
  ctx.fillStyle = "#fff"; ctx.fillRect(0,0,CARD_W,CARD_H);
  ctx.fillStyle = accent; ctx.fillRect(0,0,CARD_W,104);
  ctx.fillStyle = "#fff"; ctx.font = font(700,40); ctx.textBaseline = "middle";
  ctx.fillText("EMERGENCY MEDICAL INFO", 44, 54);

  const L = 44, colW = 560; ctx.textBaseline = "alphabetic";
  const label = (t,y,c=muted) => { ctx.fillStyle=c; ctx.font=font(400,24); ctx.fillText(t,L,y); };
  const value = (t,y,px=32,c=ink) => { ctx.fillStyle=c; ctx.font=font(700,px); ctx.fillText(fitText(ctx,t,colW),L,y); };

  value(m.fullName || "Name not added", 172, 48);
  ctx.fillStyle = muted; ctx.font = font(400,28); ctx.fillText(fitText(ctx, m.studentId ? `Student ID ${m.studentId}` : "Student ID not added", colW), L, 214);

  label("Blood group", 270);
  ctx.fillStyle = ink; ctx.font = font(700,64); ctx.fillText(String(m.blood||"Not sure"), L, 332);

  label("Allergies", 388, red); value(m.allergies || "Not given", 426, 32, m.allergies ? red : ink);
  label("Conditions", 476); value(m.conditions || "Not given", 514);
  label("Emergency contact", 564);
  value([m.contactName, m.contactPhone].filter(Boolean).join(", ") || "Not added", 602);

  // QR on the right, with a white quiet zone
  const q = makeQR(medicalText(m)), n = q.getModuleCount(), size = 330, x0 = CARD_W-size-40, y0 = 140, cell = size/(n+4);
  ctx.fillStyle = "#fff"; ctx.fillRect(x0,y0,size,size); ctx.fillStyle = "#000";
  for(let r=0;r<n;r++) for(let c=0;c<n;c++) if(q.isDark(r,c)) ctx.fillRect(Math.floor(x0+(c+2)*cell), Math.floor(y0+(r+2)*cell), Math.ceil(cell), Math.ceil(cell));
  ctx.fillStyle = muted; ctx.font = font(400,22); ctx.textAlign = "center";
  ctx.fillText("Scan with any phone camera.", x0+size/2, y0+size+34);
  ctx.fillText("Works without internet.", x0+size/2, y0+size+62);
  ctx.textAlign = "left";

  // thin border so it's easy to cut out after printing
  ctx.strokeStyle = "#CFDCE3"; ctx.lineWidth = 4; roundRect(ctx,2,2,CARD_W-4,CARD_H-4,32); ctx.stroke();
  return cv;
}
async function cardReady(){ try{ await document.fonts.load('700 40px "Atkinson Hyperlegible"'); }catch(e){} }

/* Preview on the medical card screen. */
async function drawCardPreview(){
  const img = document.getElementById("cardprev"); if(!img) return;
  await cardReady();
  img.src = cardCanvas(S.medical).toDataURL("image/png");
}

async function downloadCard(){
  await cardReady();
  const name = (S.medical.fullName||"card").trim().replace(/[^\p{L}\p{N}]+/gu,"-").toLowerCase();
  cardCanvas(S.medical).toBlob(blob=>{
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = `emergency-card-${name}.png`;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(()=>URL.revokeObjectURL(a.href), 4000);
  }, "image/png");
}

/* Prints two copies at real card size (one for the ID holder, one for a bag or wallet). */
async function printCard(){
  await cardReady();
  const src = cardCanvas(S.medical).toDataURL("image/png"), area = document.getElementById("print-area");
  area.innerHTML = `<p class="print-note">Cut along the grey border. Print at 100% ("Actual size"), not "Fit to page", so the card is 85.6 × 54 mm.</p>
    <img src="${src}" alt="Emergency medical card"><img src="${src}" alt="Emergency medical card (copy)">`;
  const imgs = [...area.querySelectorAll("img")];
  await Promise.all(imgs.map(i=>i.complete ? 0 : new Promise(r=>{ i.onload=r; i.onerror=r; })));
  window.print();
}
