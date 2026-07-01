import{useState,useEffect,useCallback,useMemo,useRef}from"react";
import{MUSCLES,EXERCISES}from"./exercises.js";

// ── STORAGE ──
const ld=(k,fb)=>{try{const v=localStorage.getItem(k);return v?JSON.parse(v):fb}catch{return fb}};
const sv=(k,d)=>{try{localStorage.setItem(k,JSON.stringify(d))}catch(e){console.error(e)}};
const SK={anchors:"wg2-anchors",anchorLog:"wg2-anchor-log",accLog:"wg2-acc-log",fatigue:"wg2-fatigue",
  banned:"wg2-banned",prefs:"wg2-prefs",nutrition:"wg2-nutrition",body:"wg2-body",cardio:"wg2-cardio",
  daytargets:"wg2-daytargets",
  profile:"wg2-profile",
  meso:"wg2-meso",history:"wg2-history",metgoal:"wg2-metgoal",eccentrix:"wg2-eccentrix",power:"wg2-power",anchorcfg:"wg2-anchorcfg",pacelookback:"wg2-pacelookback"};

// ── DESIGN TOKENS ──
const mono="'JetBrains Mono','Fira Code',monospace";
const disp="'Big Shoulders Display',sans-serif";
const C={ink:"#0C0F16",panel:"#151A23",raised:"#1F2733",line:"#2A3442",bone:"#ECF1F8",
  steel:"#8C99AC",dim:"#5A6678",amber:"#FFB02E",arc:"#5CA8FF",go:"#34D399",alarm:"#FF5A5A",warn:"#F4C152"};

const CSS=`
:root{color-scheme:dark}
*{box-sizing:border-box;-webkit-tap-highlight-color:transparent}
body{margin:0;background:${C.ink}}
input,select,button{font:inherit}
input[type=number]::-webkit-outer-spin-button,input[type=number]::-webkit-inner-spin-button{-webkit-appearance:none;margin:0}
input[type=number]{-moz-appearance:textfield}
.app{background:${C.ink};min-height:100vh;color:${C.bone};font-family:${mono};padding-bottom:96px}
.masthead{display:flex;align-items:baseline;justify-content:space-between;padding:14px 16px 8px}
.brand{font-family:${disp};font-weight:800;font-size:24px;letter-spacing:1.5px;color:${C.bone};text-transform:uppercase;line-height:1}
.brand b{color:${C.amber};font-weight:800}
.mast-date{font-size:11px;color:${C.dim};letter-spacing:.5px}
.tabs{display:flex;position:sticky;top:0;z-index:20;background:rgba(12,15,22,.92);backdrop-filter:blur(10px);border-bottom:1px solid ${C.line}}
.tab{flex:1;padding:13px 0 11px;background:none;border:none;border-bottom:3px solid transparent;color:${C.dim};cursor:pointer;
  font-family:${disp};font-weight:700;font-size:15px;letter-spacing:2.5px;text-transform:uppercase;transition:color .15s}
.tab.on{color:${C.amber};border-bottom-color:${C.amber}}
.wrap{padding:14px 12px}
.eyebrow{display:flex;align-items:center;gap:10px;margin:18px 0 10px}
.eyebrow:first-child{margin-top:4px}
.eyebrow span{font-family:${disp};font-weight:700;font-size:14px;letter-spacing:3px;text-transform:uppercase;white-space:nowrap}
.eyebrow::after{content:"";flex:1;height:1px;background:${C.line}}
.eyebrow .act{margin-left:auto}
.eyebrow .act::after{display:none}
.card{background:${C.panel};border:1px solid ${C.line};border-radius:10px;padding:12px;margin-bottom:10px}
.plate{border-left:3px solid ${C.arc}}
.pat-eyebrow{font-family:${disp};font-weight:700;font-size:12px;letter-spacing:2.5px;text-transform:uppercase;color:${C.arc}}
.ex-name{font-family:${disp};font-weight:700;font-size:19px;letter-spacing:.5px;color:${C.bone};line-height:1.15;margin-top:1px}
.sub{font-size:11px;color:${C.dim};margin-top:3px;line-height:1.5}
.readout{background:${C.ink};border:1px solid ${C.line};border-radius:8px;padding:8px 10px;margin:9px 0;display:flex;gap:9px;align-items:flex-start}
.chip{font-family:${disp};font-weight:700;font-size:11px;letter-spacing:1.5px;padding:3px 7px;border-radius:5px;white-space:nowrap;flex-shrink:0;margin-top:1px}
.readout p{margin:0;font-size:12px;line-height:1.55;color:${C.steel}}
.readout .tgt{color:${C.amber}}
.setrow{display:flex;align-items:center;gap:7px;padding:4px 0}
.setnum{width:24px;height:24px;border-radius:7px;background:${C.raised};color:${C.dim};font-size:11px;display:flex;align-items:center;justify-content:center;flex-shrink:0}
.in{height:44px;background:${C.raised};border:1px solid ${C.line};border-radius:9px;color:${C.bone};padding:0 11px;font-size:15px;font-family:${mono};width:100%;min-width:0;transition:border-color .12s,box-shadow .12s}
.in::placeholder{color:${C.dim};font-size:12px}
.in:focus{outline:none;border-color:${C.amber};box-shadow:0 0 0 2px rgba(255,176,46,.18)}
.in.sm{height:40px;font-size:13px}
.bw-tag{width:44px;text-align:center;font-size:12px;color:${C.dim};letter-spacing:1px;flex-shrink:0}
.x{width:34px;height:34px;background:none;border:none;color:${C.dim};cursor:pointer;font-size:15px;border-radius:8px;flex-shrink:0;transition:color .12s}
.x:hover,.x:active{color:${C.alarm}}
.btn{border:none;border-radius:10px;cursor:pointer;font-family:${disp};font-weight:700;text-transform:uppercase;letter-spacing:2px;transition:filter .12s,transform .05s}
.btn:active{transform:translateY(1px)}
.btn-amber{background:${C.amber};color:${C.ink}}
.btn-go{background:${C.go};color:${C.ink}}
.btn-ghost{background:${C.raised};border:1px solid ${C.line};color:${C.steel};font-size:11px;letter-spacing:1.5px;padding:7px 12px;border-radius:7px}
.btn-ghost.amber{color:${C.amber};border-color:rgba(255,176,46,.35)}
.btn-ghost.red{color:${C.alarm};border-color:rgba(255,90,90,.3)}
.btn-ghost.green{color:${C.go};border-color:rgba(52,211,153,.3)}
.addset{width:100%;height:38px;background:transparent;border:1px dashed ${C.line};border-radius:8px;color:${C.dim};font-size:12px;cursor:pointer;font-family:${mono};margin-top:6px;letter-spacing:1px}
.addset:active{border-color:${C.steel};color:${C.steel}}
.hazard{position:relative;overflow:hidden}
.hazard::before{content:"";position:absolute;top:0;left:0;right:0;height:4px;
  background:repeating-linear-gradient(-45deg,${C.amber} 0 8px,${C.ink} 8px 16px)}
.hazard.red::before{background:repeating-linear-gradient(-45deg,${C.alarm} 0 8px,${C.ink} 8px 16px)}
.live{display:flex;align-items:center;justify-content:space-between;padding:14px 14px 12px;margin-bottom:12px}
.live-label{font-family:${disp};font-weight:700;font-size:13px;letter-spacing:3px;color:${C.amber}}
.live-label .dot{display:inline-block;width:8px;height:8px;border-radius:50%;background:${C.amber};margin-right:8px;animation:pulse 1.6s ease-in-out infinite}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.25}}
.timer{font-family:${disp};font-weight:800;font-size:30px;letter-spacing:2px;color:${C.amber};font-variant-numeric:tabular-nums;
  text-shadow:0 0 18px rgba(255,176,46,.45);line-height:1}
.mode-chip{font-size:10px;color:${C.dim};letter-spacing:1.5px;margin-left:10px}
.startrow{display:flex;gap:8px;margin-bottom:14px}
.start-full{flex:2;height:58px;font-size:17px}
.start-quick{flex:1;height:58px;background:${C.panel};border:1.5px solid rgba(255,176,46,.45);color:${C.amber};font-size:15px}
.pillwrap{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px}
.pill{padding:9px 13px;border-radius:8px;border:1px solid ${C.line};cursor:pointer;font-size:12px;font-family:${mono};
  background:${C.raised};color:${C.steel};transition:all .12s}
.pill.on{background:${C.arc};border-color:${C.arc};color:${C.ink};font-weight:600}
.vol-row{display:flex;align-items:center;gap:8px;margin-bottom:5px}
.vol-name{width:62px;font-family:${disp};font-weight:600;font-size:12px;letter-spacing:1.5px;text-transform:uppercase;color:${C.steel}}
.vol-track{flex:1;height:12px;background:${C.raised};border-radius:3px;overflow:hidden;position:relative}
.vol-tick{position:absolute;top:0;width:1.5px;height:100%;background:rgba(236,241,248,.18)}
.vol-fill{height:100%;border-radius:3px;transition:width .3s}
.vol-val{width:62px;font-size:10px;font-family:${mono};text-align:right}
.flag{font-family:${disp};font-weight:700;font-size:11px;letter-spacing:1.5px;color:${C.alarm};padding:4px 8px;background:rgba(255,90,90,.12);border:1px solid rgba(255,90,90,.3);border-radius:6px;height:fit-content}
.daytypes{display:flex;gap:5px;margin-bottom:12px}
.daytype{flex:1;height:42px;border:1px solid ${C.line};border-radius:8px;cursor:pointer;font-family:${disp};font-weight:700;
  font-size:11px;letter-spacing:1px;text-transform:uppercase;background:${C.raised};color:${C.dim};transition:all .12s;line-height:1.15;padding:0 2px}
.daytype.on{background:${C.amber};border-color:${C.amber};color:${C.ink}}
.target-line{font-size:11px;color:${C.dim};margin-bottom:5px}
.today-line{font-size:14px;margin-bottom:11px;font-variant-numeric:tabular-nums}
.entry{display:flex;justify-content:space-between;align-items:center;padding:7px 2px;font-size:12px;color:${C.steel};border-bottom:1px solid rgba(42,52,66,.5)}
.entry:last-child{border-bottom:none}
.grid3{display:flex;gap:6px;margin-bottom:6px}
.grid4{display:flex;gap:6px;margin-bottom:6px}
.bars{display:flex;align-items:flex-end;gap:3px;height:36px;margin-top:8px}
.bar{flex:1;border-radius:2px 2px 0 0;min-height:3px}
.stat{font-size:11px;color:${C.steel};margin-top:6px;display:flex;justify-content:space-between;align-items:center}
.delta-box{font-size:12px;color:${C.steel};background:${C.panel};border:1px solid ${C.line};padding:10px 12px;border-radius:9px;margin-top:8px;line-height:1.8}
.empty{font-size:12px;color:${C.dim};padding:14px 0;text-align:center}
@media(prefers-reduced-motion:reduce){.live-label .dot{animation:none}.btn:active{transform:none}}
`;

// ── SEMANTIC COLORS ──
const PAIN_C=v=>v<=2?C.go:v<=5?C.warn:C.alarm;
const RIR_C=v=>v<=1?C.alarm:v<=2?"#FF8A3D":v<=3?C.warn:C.go;

const PATTERNS=[
  {id:"hpress",label:"H. Press",full:"Horizontal Press",muscles:["chest","triceps","shoulders"]},
  {id:"vpress",label:"V. Press",full:"Vertical Press",muscles:["shoulders","triceps"]},
  {id:"hpull",label:"H. Pull",full:"Horizontal Pull",muscles:["back","biceps"]},
  {id:"vpull",label:"V. Pull",full:"Vertical Pull",muscles:["back","biceps"]},
  {id:"squat",label:"Squat",full:"Squat Pattern",muscles:["quads","glutes"]},
  {id:"hinge",label:"Hinge",full:"Hip Hinge",muscles:["hamstrings","glutes","back"]},
];
const PATTERN_MAP={
  hpress:["Dumbbell Bench Press","Incline Dumbbell Press","Decline Dumbbell Press","Dumbbell Floor Press","Push-ups","Dips","Close-grip Barbell Bench","Diamond Push-ups","Barbell Bench Press","Incline Barbell Bench Press"],
  vpress:["Barbell Overhead Press","Dumbbell Arnold Press","Landmine Press","Single-arm Landmine Press","Pike Push-ups","Barbell Push Press"],
  hpull:["Barbell Rows","Pendlay Rows","Dumbbell Rows","Chest-supported Incline DB Rows","Meadow Rows","Inverted Rows"],
  vpull:["Pull-ups","Chin-ups","Wide-grip Pull-ups","Commando Pull-ups"],
  squat:["Belt Squat","Landmine Squat","Dumbbell Goblet Squat","Dumbbell Bulgarian Split Squat","Dumbbell Lunges","Dumbbell Step-ups","Pistol Squats","Barbell Back Squat","Barbell Front Squat"],
  hinge:["Barbell Romanian Deadlifts","Dumbbell Romanian Deadlifts","Single-leg DB Romanian Deadlift","Conventional Deadlift","Sumo Deadlift","Barbell Hip Thrusts","B-stance Hip Thrust","Barbell Good Mornings","Nordic Curls","Landmine Romanian Deadlift"],
};
const ALL_PAT_EX=new Set(Object.values(PATTERN_MAP).flat());
const ACC_POOL=EXERCISES.filter(e=>!ALL_PAT_EX.has(e.name));
const ACC_PER_CAT=4;   // top-N accessories per movement category in the pick window (cross-pattern variety)

// Monday-anchored week key (YYYY-MM-DD of that week's Monday); sortable.
function weekStart(dstr){const ds=String(dstr).slice(0,10);const d=new Date(ds+"T00:00:00");const off=d.getDay();d.setDate(d.getDate()-off);return d.toISOString().slice(0,10);}
// Least-squares slope of [{x,y}] points (0 if <2 points).
function slope(pts){const n=pts.length;if(n<2)return 0;const sx=pts.reduce((a,p)=>a+p.x,0),sy=pts.reduce((a,p)=>a+p.y,0),sxy=pts.reduce((a,p)=>a+p.x*p.y,0),sxx=pts.reduce((a,p)=>a+p.x*p.x,0);const d=n*sxx-sx*sx;return d===0?0:(n*sxy-sx*sy)/d;}

// Per-week trend for a body metric. When there are >=5 measurements logged across a
// spread of times of day (>=~1h std), time-of-day is added as a covariate (2-variable
// least squares) so the long-term trend is separated from intraday timing variation;
// otherwise a plain date slope. Uses the auto-captured log timestamp as the measure time,
// so it works best when you log promptly after measuring. null if <2 points.
function bodyTrend(entries,key){
  const pts=(entries||[]).filter(e=>e[key]!=null&&e[key]!==""&&e.time).map(e=>{const t=new Date(e.time);
    return{d:new Date(String(e.date).slice(0,10)+"T00:00:00").getTime()/86400000,h:t.getHours()+t.getMinutes()/60,y:+e[key]};});
  if(pts.length<2)return null;
  const plain=()=>slope(pts.map(p=>({x:p.d,y:p.y})))*7;
  if(pts.length<5)return plain();
  const n=pts.length,md=pts.reduce((a,p)=>a+p.d,0)/n,mh=pts.reduce((a,p)=>a+p.h,0)/n,my=pts.reduce((a,p)=>a+p.y,0)/n;
  let Sdd=0,Shh=0,Sdh=0,Sdy=0,Shy=0;
  pts.forEach(p=>{const d=p.d-md,h=p.h-mh,y=p.y-my;Sdd+=d*d;Shh+=h*h;Sdh+=d*h;Sdy+=d*y;Shy+=h*y;});
  const det=Sdd*Shh-Sdh*Sdh;
  if(Shh<n||Math.abs(det)<1e-9)return plain();                 // no real time spread or collinear -> plain slope
  return ((Sdy*Shh-Shy*Sdh)/det)*7;                            // day slope, controlling for time of day
}

// Formats the optional cardio metrics (distance, rowing 500m split, zone minutes) for display.
function cardioExtra(e){
  let s="";
  if(e.distance){s+=` · ${e.distance}m`;
    if(e.type==="rowing"&&e.duration){const sp=Math.round(e.duration*60/(e.distance/500));s+=` · ${Math.floor(sp/60)}:${String(sp%60).padStart(2,"0")}/500m`;}}
  if(e.zones&&e.zones.some(z=>z>0))s+=` · Z ${e.zones.join("/")}`;
  return s;
}
// Pearson r of [[x,y],...]; null if <3 pairs or zero variance.
function pearson(pairs){const n=pairs.length;if(n<3)return null;const sx=pairs.reduce((a,p)=>a+p[0],0),sy=pairs.reduce((a,p)=>a+p[1],0),sxy=pairs.reduce((a,p)=>a+p[0]*p[1],0),sxx=pairs.reduce((a,p)=>a+p[0]*p[0],0),syy=pairs.reduce((a,p)=>a+p[1]*p[1],0);const num=n*sxy-sx*sy,den=Math.sqrt((n*sxx-sx*sx)*(n*syy-sy*sy));return den===0?null:num/den;}

const DOW3=["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

// ── CARDIO ENERGY (Keytel, ported from cut-tracker) ──
// cal/min male:   (-55.0969 + 0.6309*HR + 0.1988*kg + 0.2017*age)/4.184
// cal/min female: (-20.4022 + 0.4472*HR - 0.1263*kg + 0.074*age)/4.184
function keytelCpm(hr,kg,age,sex){
  if(!hr||!kg)return 0;
  const v=sex==="female"
    ?(-20.4022+0.4472*hr-0.1263*kg+0.074*age)/4.184
    :(-55.0969+0.6309*hr+0.1988*kg+0.2017*age)/4.184;
  return Math.max(0,v);
}
// Format a duration in (fractional) minutes as H:MM:SS, or M:SS when under an hour.
const fmtDur=min=>{const s=Math.round((+min||0)*60);const h=Math.floor(s/3600),m=Math.floor(s%3600/60),ss=s%60;return h>0?`${h}:${String(m).padStart(2,"0")}:${String(ss).padStart(2,"0")}`:`${m}:${String(ss).padStart(2,"0")}`;};
// HR-zone metabolic cost, kcal/kg/hr for Z1..Z5. Zones are set against the user's OWN max HR on their
// device, so intensity is already personalized; the same %HRmax costs ~the same METs across modalities
// (HR reflects cardiovascular load), so one set covers rowing/steady/etc. Tunable.
const ZONE_MET=[4,6,8,10,13];
// Cardio calories. PREFERS logged zone-time (the intensity distribution): kcal = sum(zone-min * zoneMET *
// kg / 60). That tracks how a chest strap integrates HR far better than one avg-HR number and pulls
// fit-athlete estimates down toward their device. Falls back to avg-HR Keytel only when no zones logged.
// HIIT keeps the ~15% EPOC bump either way (post-session cost the during-session math misses). Needs a
// bodyweight plus either zones or HR; else null.
function cardioBurn(e,weightLb,age,sex){
  if(!e)return null;
  const kg=(+weightLb||0)*0.4536;
  if(!kg)return null;
  if(e.zones&&e.zones.some(z=>+z>0)){
    let k=0;e.zones.forEach((z,i)=>{k+=(+z||0)*(ZONE_MET[i]||0)*kg/60;});
    return Math.round(e.type==="hiit"?k*1.15:k);
  }
  if(!e.avgHR)return null;
  const base=keytelCpm(+e.avgHR,kg,+age||0,sex)*(+e.duration||0);
  return Math.round(e.type==="hiit"?base*1.15:base);
}

// ── PROGRESSION ──
// Research-grounded RIR (reps-in-reserve) targets. Meta-regressions (Robinson 2023;
// Refalo 2023/2024, Sports Medicine) place the hypertrophy-productive zone at ~1-3 RIR:
// gains drop off past ~4-5 RIR, while training to failure (0 RIR) adds fatigue without
// proportional hypertrophy and doesn't aid strength. So bodyweight clean reps progress
// when there's slack (>=RIR_PROGRESS), hold in the optimal 1-2 band, and at failure
// (0 RIR) a fixed-load movement gets eccentric overload -- load can't be dropped, and
// eccentric actions are ~40% stronger and fatigue less, so negatives are the lever past
// a sticking point. Once eccentrics are in play, logged RIR refers to the eccentric reps.
const RIR_PROGRESS=3;
// MET-hours: 1 MET = 1 kcal/kg/hr, so cardio MET-hr = kcal/bodyweight-kg. When kcal is
// unavailable (no HR/weight), fall back to type METs x hours. Resistance has no kcal log,
// so it always uses a MET value x duration. All tunable.
const RESIST_MET=5;                                    // vigorous resistance training
const CARDIO_MET={steady:7,hiit:9,rowing:7};                    // fallback when kcal/kg unavailable
// ── POWER (ballistic) tunables ──
// Time is the fixed constant (the window); user logs reps done fast inside it. Flat target,
// no velocity-loss autoregulation. Load ~50% e1RM — submaximal load moved at maximal velocity
// trains power (Cormie 2007; Wilson 1993: 30–60% 1RM develops force+velocity). Plate-rounded,
// user-editable. Power is a third goal alongside hypertrophy and strength.
const POWER_WINDOW=15;   // s, effort window
const POWER_REPS=5;      // target reps inside the window
const POWER_PCT=0.5;     // fraction of e1RM for the starting load
const POWER_INC=5;       // lb added next session when target is met
// ── BODYWEIGHT PROGRESSION ──
// For bw-tagged exercises: load is fixed (bodyweight + any added), progress by
// reps (or seconds for holds). Reads sets by reps only, never the weight filter.
// Returns the same 9-key shape as C; weight:"" so cards/gen show no lb target.
function bwProgression(ex,last,repRange,targetRIR,bodyWeight,eccOn=false){
  const isHold=!!ex.hold;
  const ls=last.sets.filter(s=>eccOn?(s.reps||s.ecc):s.reps);
  if(!ls.length)return{weight:"",reps:repRange[0],sets:3,note:`First session. ${isHold?"Hold for time":`Hit ${repRange[0]} reps`} @ RIR ${targetRIR}.`,isNew:true,ramp:null};
  const added=ls.map(s=>+s.weight||0);
  const avgAdd=Math.round(added.reduce((a,b)=>a+b,0)/added.length);
  const load=(+bodyWeight||0)+avgAdd;
  const loadStr=load>0?`${load}lb`:"BW";
  const rs=ls.filter(s=>s.rir!=null&&s.rir!=="");
  const R=rs.length?Math.round(rs.reduce((a,x)=>a+(+x.rir),0)/rs.length):null; // avg RIR; refers to eccentric reps when eccentrics are present
  const step=isHold?5:1,ceiling=repRange[1],floor=repRange[0];
  const C=Math.round(ls.reduce((a,s)=>a+(+s.reps||0),0)/ls.length);          // avg clean reps (or seconds for holds)

  // ── HOLDS (isometric): time progression, no rep/eccentric bands ──
  if(isHold){
    if(R!==null&&R<1){const t=Math.max(floor,C-step);return{weight:"",reps:t,sets:ls.length,note:`${loadStr} · last ${C}s @ RIR ${R}, at failure. Hold ${t}s.`,tooHard:true,ramp:added};}
    const t=C+step;return{weight:"",reps:t,sets:ls.length,note:`${loadStr} · last ${C}s${R!==null?` @ RIR ${R}`:""}. Target ${t}s.`,ramp:added};
  }

  const E=eccOn?Math.round(ls.reduce((a,s)=>a+(+s.ecc||0),0)/ls.length):0;    // avg eccentric reps
  const total=C+E;

  // ── ECCENTRIC PHASE: eccentrics in play; RIR is read as the eccentric reserve ──
  if(eccOn&&E>0){
    if(R===null||R>=RIR_PROGRESS){                                            // eccentrics have slack: trade one for a clean rep
      const nC=Math.min(C+1,ceiling),nE=Math.max(0,total-nC);
      if(nE===0)return{weight:"",reps:Math.min(total,ceiling),eccTarget:0,sets:ls.length,note:`${loadStr} · ${C} clean + ${E} ecc → ${Math.min(total,ceiling)} all clean now. Off eccentrics.`,progressed:true,ramp:added};
      return{weight:"",reps:nC,eccTarget:nE,sets:ls.length,note:`${loadStr} · ecc RIR ${R} (slack) → ${nC} clean + ${nE} ecc.`,ramp:added};
    }
    if(R<1){                                                                  // eccentric failure: ease the mix (fewer clean, more eccentric)
      if(C>1)return{weight:"",reps:C-1,eccTarget:E+1,sets:ls.length,note:`${loadStr} · ${C} clean + ${E} ecc @ ecc RIR 0. Ease → ${C-1} clean + ${E+1} ecc.`,tooHard:true,ramp:added};
      return{weight:"",reps:C,eccTarget:E,sets:ls.length,note:`${loadStr} · ${C} clean + ${E} ecc @ ecc RIR 0. Hold ${C}+${E}.`,tooHard:true,ramp:added};
    }
    return{weight:"",reps:C,eccTarget:E,sets:ls.length,note:`${loadStr} · ${C} clean + ${E} ecc @ ecc RIR ${R} (optimal). Hold ${C}+${E}.`,ramp:added};
  }

  // ── PURE CLEAN: RIR is read as the clean reserve ──
  if(C>=ceiling)                                                              // maxed the rep range: raise difficulty
    return{weight:"",reps:ceiling,sets:ls.length,note:`${loadStr} · ${ceiling}r ceiling${R!==null?` @ RIR ${R}`:""}. Add load or harder variation.`,progressed:true,ramp:added};
  if(eccOn&&R!==null&&R<1){                                                  // clean failure: back clean reps down into the productive RIR zone, eccentrics carry the overload
    const nC=Math.max(1,C-targetRIR),nE=C-nC;                               // ~1 rep below failure per RIR -> drop targetRIR reps to reach the target zone
    return{weight:"",reps:nC,eccTarget:nE,sets:ls.length,note:`${loadStr} · ${C}r @ RIR 0 (failure). Back off → ${nC} clean (~RIR ${targetRIR}) + ${nE} ecc; eccentrics carry the overload.`,ramp:added};
  }
  if(R===null||R>=RIR_PROGRESS){                                             // slack: add a clean rep
    const t=Math.min(C+1,ceiling);
    return{weight:"",reps:t,sets:ls.length,note:`${loadStr} · ${C}r${R!==null?` @ RIR ${R}`:""} → ${t}r @ target RIR ${targetRIR}.`,ramp:added};
  }
  return{weight:"",reps:C,sets:ls.length,note:`${loadStr} · ${C}r @ RIR ${R} (optimal zone). Hold ${C}r.`,ramp:added}; // RIR 1-2: hold
}

// ── POWER PROGRESSION (flat target) ──
// Reads prior power sets (pwr flag). Met target reps inside the window → add load; else hold.
// First power session derives the load from e1RM (or 60% of the top working set if no RIR
// history exists). Same return contract as getProgression (weight,reps,sets,note + flags),
// plus power:true and win (the window) for the UI. Loaded movements only.
function powerProg(name,log){
  const r5=x=>Math.round(x/5)*5;
  const h=log[name];
  if(!h||!h.length)return{weight:"",reps:POWER_REPS,sets:3,win:POWER_WINDOW,power:true,isNew:true,note:`Power: find a load you can move fast for ${POWER_REPS} reps inside ${POWER_WINDOW}s (~${Math.round(POWER_PCT*100)}% 1RM).`};
  const last=h[h.length-1];
  const ls=last.sets.filter(s=>s.reps&&s.weight);
  if(!ls.length)return{weight:"",reps:POWER_REPS,sets:3,win:POWER_WINDOW,power:true,isNew:true,note:"No data last session."};
  const lastPwr=ls.filter(s=>s.pwr);
  if(lastPwr.length){
    const topLoad=Math.max(...lastPwr.map(s=>+s.weight));
    const topReps=Math.max(...lastPwr.filter(s=>+s.weight===topLoad).map(s=>+s.reps));
    if(topReps>=POWER_REPS){const w=topLoad+POWER_INC;return{weight:w,reps:POWER_REPS,sets:lastPwr.length,win:POWER_WINDOW,power:true,progressed:true,note:`Power: ${topReps}≥${POWER_REPS} fast reps in ${POWER_WINDOW}s. Up to ${w}lb.`};}
    return{weight:topLoad,reps:POWER_REPS,sets:lastPwr.length,win:POWER_WINDOW,power:true,note:`Power: ${topReps}/${POWER_REPS} in ${POWER_WINDOW}s. Hold ${topLoad}lb, chase ${POWER_REPS} fast reps.`};
  }
  const rs=ls.filter(s=>s.rir!=null&&s.rir!=="");
  if(rs.length){let num=0,den=0;rs.forEach(s=>{const rtf=(+s.reps)+(+s.rir);const e=(+s.weight)*(1+rtf/30);const rel=1/(1+(+s.rir));num+=e*rel;den+=rel;});const e1rm=Math.round(num/den);const w=r5(e1rm*POWER_PCT);return{weight:w,reps:POWER_REPS,sets:3,win:POWER_WINDOW,power:true,note:`Power start: ${Math.round(POWER_PCT*100)}% of e1RM ${e1rm} = ${w}lb, ${POWER_REPS} fast reps in ${POWER_WINDOW}s.`};}
  const top=Math.max(...ls.map(s=>+s.weight));const w=r5(top*0.6);
  return{weight:w,reps:POWER_REPS,sets:3,win:POWER_WINDOW,power:true,note:`Power start: ~${w}lb (60% of ${top}), ${POWER_REPS} fast reps in ${POWER_WINDOW}s.`};
}
function getProgression(name,log,repRange=[6,10],targetRIR=2,bodyWeight=0,powerMode=false,eccOn=false){
  const h=log[name];
  const exDef=EXERCISES.find(x=>x.name===name);
  if(powerMode&&!(exDef&&exDef.bw))return powerProg(name,log);   // loaded power routes first (handles first session internally)
  if(!h||!h.length)return{weight:"",reps:repRange[0],sets:3,note:`First session. Find weight for ${repRange[0]} reps @ RIR ${targetRIR}.`,isNew:true};
  const last=h[h.length-1];
  if(exDef&&exDef.bw)return bwProgression(exDef,last,repRange,targetRIR,bodyWeight,eccOn);
  const ls=last.sets.filter(s=>s.reps&&s.weight);
  if(!ls.length)return{weight:"",reps:repRange[0],sets:3,note:"No data last session.",isNew:true,ramp:null};
  // ── PROGRESSION MODEL C: weighted e1RM across ALL sets ──
  // Every set is one (weight,reps,RIR) data point. RIR turns a submaximal set
  // into a 1RM estimate: reps-to-failure = reps + RIR, e1RM = w*(1+RTF/30) [Epley].
  // Estimates are blended, weighted toward near-failure sets (low RIR predicts
  // 1RM more accurately). This reads ramped loading natively. ramp[] is returned
  // for the dormant ramp pre-fill (see genSession, line ~358); live code ignores it.
  const ramp=ls.map(s=>+s.weight);
  const top=Math.max(...ramp);          // heaviest set = true working load
  const r5=x=>Math.round(x/5)*5;
  // deload guard: 3-session volume regression (unchanged trigger, anchored to top set)
  if(h.length>=3){
    const recent3=h.slice(-3);
    const vols=recent3.map(s=>{const ss=s.sets.filter(x=>x.reps&&x.weight);return ss.reduce((a,x)=>a+(+x.reps)*(+x.weight),0);});
    const lr=last.sets.map(s=>s.rir!=null&&s.rir!==""?+s.rir:null).filter(r=>r!=null);
    const lastMinRir=lr.length?Math.min(...lr):99;   // high RIR = under-loading / a correction, not fatigue
    if(vols[2]<vols[0]*0.9&&vols[1]<vols[0]*0.95&&lastMinRir<=1)
      return{weight:r5(top*0.7),reps:repRange[0],sets:ls.length,note:`Grinding and dropping 3 sessions. Cut to 70% (${r5(top*0.7)}lb) for a week.`,deload:true,ramp};
  }
  // ── DOUBLE PROGRESSION ── climb reps within the range at a fixed load, then add load & reset reps.
  const wsets=ls.filter(s=>+s.weight===top);                 // working sets at the heaviest load
  const wReps=Math.max(...wsets.map(s=>+s.reps));            // best reps achieved at that load
  const wr=wsets.map(s=>s.rir!=null&&s.rir!==""?+s.rir:null).filter(r=>r!=null);
  const wRir=wr.length?Math.min(...wr):null;                 // hardest effort at that load (null = no RIR)
  const inc=top>=100?10:5;                                    // load step
  // (a) load far too light → jump load so the CURRENT reps land at target RIR
  if(wRir!=null&&wRir>=targetRIR+3){
    const tr=Math.min(wReps,repRange[1]);                       // recalibrate into the range — never target reps above the ceiling
    const e=Math.round(top*(1+(wReps+wRir)/30));const nw=r5(e/(1+(tr+targetRIR)/30));
    if(nw>top)return{weight:nw,reps:tr,sets:ls.length,note:`${wReps}r @ RIR ${wRir} — too light. Jump to ${nw}lb for ${tr}r @ RIR ${targetRIR}.`,progressed:true,ramp};
  }
  // (b) room left in the range → add one rep at the same load
  if(wReps<repRange[1]&&(wRir==null||wRir>=1)){
    const nr=wReps+1;
    return{weight:top,reps:nr,sets:ls.length,note:`${wReps}r @ ${top}lb${wRir!=null?` · RIR ${wRir}`:""} — add a rep → ${nr}r, same load.`,progressed:true,repUp:true,ramp};
  }
  // (c) topped the range with reps to spare → add load, reset to bottom of range
  if(wReps>=repRange[1]&&(wRir==null||wRir>=targetRIR)){
    const nw=r5(top+inc);
    return{weight:nw,reps:repRange[0],sets:ls.length,note:`${wReps}r @ ${top}lb — top of range. Add load → ${nw}lb for ${repRange[0]}r.`,progressed:true,ramp};
  }
  // (d) topped reps but hard, or failed mid-range → hold and consolidate
  return{weight:top,reps:Math.min(wReps,repRange[1]),sets:ls.length,note:`Hold ${top}lb for ${Math.min(wReps,repRange[1])}r until RIR ${targetRIR}+.`,ramp};
}

// ── VOLUME ──
function calcWeeklyVolume(anchorLog,accLog){
  const vol={};MUSCLES.forEach(m=>vol[m]=0);
  // Current CALENDAR week (latest week with any logged set) — matches every other "this wk"
  // card and is stable, unlike a Date.now() rolling window that drifts between re-renders.
  const wks=[];
  Object.values(anchorLog).forEach(es=>(es||[]).forEach(e=>wks.push(weekStart(e.date))));
  (accLog||[]).forEach(e=>wks.push(weekStart(e.date)));
  if(!wks.length)return vol;
  const curWk=wks.sort().slice(-1)[0];
  const isHard=s=>s.reps&&(s.rir==null||s.rir===""||+s.rir<=4);   // same definition for anchors AND accessories
  Object.entries(anchorLog).forEach(([name,entries])=>{
    (entries||[]).filter(e=>weekStart(e.date)===curWk).forEach(entry=>{
      const ex=EXERCISES.find(x=>x.name===name);if(!ex)return;
      const hardSets=entry.sets.filter(isHard).length;
      [...ex.p,...ex.s].forEach(({m,p})=>{vol[m]+=hardSets*(p/100);});
    });
  });
  (accLog||[]).filter(e=>weekStart(e.date)===curWk).forEach(entry=>{
    entry.exercises?.forEach(ex=>{
      const ref=EXERCISES.find(x=>x.name===ex.name);if(!ref)return;
      const hardSets=(ex.sets||[]).filter(isHard).length;
      [...ref.p,...ref.s].forEach(({m,p})=>{vol[m]+=hardSets*(p/100);});
    });
  });
  return vol;
}
const VOL_LANDMARKS={chest:{mev:8,mav:16,mrv:22},back:{mev:8,mav:16,mrv:22},shoulders:{mev:8,mav:16,mrv:26},
  biceps:{mev:6,mav:14,mrv:20},triceps:{mev:6,mav:12,mrv:18},quads:{mev:6,mav:14,mrv:20},
  hamstrings:{mev:4,mav:10,mrv:16},glutes:{mev:4,mav:12,mrv:16},calves:{mev:6,mav:12,mrv:16},
  core:{mev:4,mav:10,mrv:16},traps:{mev:4,mav:10,mrv:16},forearms:{mev:2,mav:8,mrv:14}};
// Per-muscle LOAD trend: tonnage (reps*weight*involvement) of the last COMPLETED week vs the
// prior completed week. Stable — ignores the current partial week, so it won't fight the pace
// color. Bodyweight work (no external load) contributes no tonnage. Returns up/flat/down/null.
function muscleLoadTrend(anchorLog,accLog,todayStr){
  const curWk=weekStart(todayStr);
  const byWk={};MUSCLES.forEach(m=>byWk[m]={});
  const add=(dateStr,name,sets)=>{
    const ref=EXERCISES.find(x=>x.name===name);if(!ref)return;
    const wk=weekStart(dateStr);if(wk>=curWk)return;
    let ton=0;(sets||[]).forEach(s=>{if(s.reps&&s.weight)ton+=(+s.reps)*(+s.weight);});
    if(!ton)return;
    [...ref.p,...ref.s].forEach(({m,p})=>{if(byWk[m])byWk[m][wk]=(byWk[m][wk]||0)+ton*(p/100);});
  };
  Object.entries(anchorLog).forEach(([name,entries])=>(entries||[]).forEach(e=>add(e.date,name,e.sets)));
  (accLog||[]).forEach(e=>(e.exercises||[]).forEach(x=>add(e.date,x.name,x.sets)));
  const trend={};
  MUSCLES.forEach(m=>{const wks=Object.keys(byWk[m]).sort();
    if(wks.length<2){trend[m]=null;return;}
    const a=byWk[m][wks[wks.length-2]],b=byWk[m][wks[wks.length-1]];
    if(!a){trend[m]=null;return;}
    const r=b/a;trend[m]=r>1.05?"up":r<0.95?"down":"flat";});
  return trend;
}

// ── MESOCYCLE ──
function getMesoState(meso){
  if(!meso||!meso.startDate)return{week:0,phase:"none"};
  const weeks=Math.floor((Date.now()-new Date(meso.startDate).getTime())/(7*86400000));
  const len=meso.length||5;
  if(weeks>=len)return{week:weeks,phase:"deload"};
  return{week:weeks+1,phase:"accumulation",totalWeeks:len};
}

// ── ACCESSORIES ──
// Per-muscle load (hard-set-equivalent: sets x muscle involvement%) from today's
// anchors. Read-only input to accessory selection; anchors are never modified.
function anchorMuscleLoad(anchors,sets,slots=PATTERNS){
  const load={};MUSCLES.forEach(m=>load[m]=0);
  slots.forEach(p=>{const nm=anchors[p.id];if(!nm)return;const ex=EXERCISES.find(x=>x.name===nm);if(!ex)return;
    const nSets=(sets[p.id]||[]).length||3;
    [...ex.p,...ex.s].forEach(({m,p:pct})=>{load[m]=(load[m]||0)+nSets*(pct/100);});});
  return load;
}

// Starting weight for a new accessory, seeded from recent loads on OTHER
// accessories sharing the same primary muscle (median). null if none.
function muscleSeedWeight(primaryMuscle,accProg){
  if(!primaryMuscle)return null;
  const weights=[];
  Object.entries(accProg).forEach(([nm,hist])=>{
    const ex=EXERCISES.find(x=>x.name===nm);if(!ex||ex.bw)return;
    if((ex.p[0]||{}).m!==primaryMuscle)return;
    const last=hist&&hist[hist.length-1];if(!last||!last.sets)return;
    const w=Math.max(...last.sets.map(s=>+s.weight||0));
    if(w>0)weights.push(w);
  });
  if(!weights.length)return null;
  weights.sort((a,b)=>a-b);
  return weights[Math.floor(weights.length/2)];
}

// Build one accessory object (prescription + seeded weight) for a given exercise.
// Shared by the auto-selector (genAcc) and manual search-add so both behave identically.
function buildAcc(ex,accProg,repRange,bwLoad,isDeload,locked=false){
  const sug=getProgression(ex.name,accProg,repRange,2,bwLoad);
  let sw=sug.weight||"";
  if(sw===""&&!ex.bw&&sug.isNew){const seed=muscleSeedWeight((ex.p[0]||{}).m,accProg);if(seed)sw=seed;}
  if(isDeload&&sw)sw=Math.round(+sw*0.7);
  const nSets=isDeload?1:2;
  return{id:crypto.randomUUID(),name:ex.name,eq:ex.eq,cat:ex.cat,p:ex.p,s:ex.s,
    sugReps:sug.reps||10,sugWeight:sw,locked,
    sets:Array.from({length:nSets},()=>({reps:sug.reps||"",weight:sw||"",rir:"",...(sug.eccTarget?{ecc:sug.eccTarget}:{})}))};
}
// ── SET-COUNT PROGRESSION (mesocycle volume ramp, MEV -> MRV) ──
// Anchors start near MEV (SET_BASE) and earn +1 set when last session topped its rep range
// with RIR at/under target (room for more volume), climbing toward a per-exercise ceiling
// derived from the primary muscle's MRV. Deload cuts to 2. Realizes reps -> add a set ->
// (load rises via the e1RM/bw model). Research: weekly set progression within a meso then
// deload is the standard hypertrophy volume-landmark scheme (Israetel/RP; MEV<MAV<MRV).
const SET_BASE=3, SET_CAP=5;
function setCeiling(name){
  const ex=EXERCISES.find(x=>x.name===name);
  const prim=ex&&ex.p&&[...ex.p].sort((a,b)=>b.p-a.p)[0];
  const lm=prim&&VOL_LANDMARKS[prim.m];
  if(!lm)return SET_CAP;
  return Math.max(SET_BASE,Math.min(SET_CAP,Math.round(lm.mrv/4)));  // ~half weekly MRV, ~2 sessions/wk
}
function lastSetCount(name,log){
  const h=log&&log[name]; if(!h||!h.length)return 0;
  return h[h.length-1].sets.filter(s=>s.reps&&(s.weight||s.ecc)).length;
}
function earnedSet(name,log,repRange,targetRIR){
  const h=log&&log[name]; if(!h||!h.length)return false;
  const ls=h[h.length-1].sets.filter(s=>s.reps&&(s.weight||s.ecc)); if(!ls.length)return false;
  const ex=EXERCISES.find(x=>x.name===name)||{};
  const rirs=ls.filter(s=>s.rir!=null&&s.rir!=="").map(s=>+s.rir);
  if(ex.bw){const top=Math.max(...ls.map(s=>+s.reps||0));return top>=repRange[1]&&(!rirs.length||Math.min(...rirs)>=targetRIR);}
  const best=ls.filter(s=>s.reps&&s.weight).sort((a,b)=>(b.weight*b.reps)-(a.weight*a.reps))[0]; if(!best)return false;
  const rir=best.rir!=null&&best.rir!==""?+best.rir:null;
  return (+best.reps)>=repRange[1]&&(rir==null||rir<=targetRIR);
}
function setTarget(name,log,repRange,targetRIR,phase){
  if(phase==="deload")return 2;
  const cur=lastSetCount(name,log)||SET_BASE;
  const ceil=setCeiling(name);
  const t=(earnedSet(name,log,repRange,targetRIR)&&cur<ceil)?cur+1:cur;
  return Math.max(SET_BASE,Math.min(t,ceil));
}
function genAcc(n,banned,prefs,fatigue,weekVol,anchorLoad,recentNames=[],repRange=[10,15],exclude=[],isDeload=false){
  const pool=ACC_POOL.filter(e=>!banned.includes(e.name));
  const cap=m=>VOL_LANDMARKS[m]?.mav||12;                 // per-session target ceiling
  const load={};MUSCLES.forEach(m=>load[m]=(anchorLoad&&anchorLoad[m])||0); // seed with anchor load
  const fw={};MUSCLES.forEach(m=>{const f=fatigue[m]||0;fw[m]=f>=4?0.1:f===3?0.4:f===2?0.7:f===1?0.9:1.0;});
  const bwLoad=(ld(SK.body,[]).slice().reverse().find(e=>e.weight)||{}).weight||0;
  const accProg=ld(SK.accLog+"_prog",{});
  const ACC_SETS=2;
  const sel=[];const used=new Set(exclude);                // exclude already-kept (locked) exercises
  while(sel.length<n){
    // score every remaining candidate against CURRENT running load (anchors + picks so far)
    const scored=pool.filter(e=>!used.has(e.name)).map(ex=>{
      const stars=prefs[ex.name]||0;const mult=stars===0?1:stars===1?1.3:stars===2?1.6:2.0;
      const allM=[...ex.p,...ex.s];let fit=0,wsum=0;
      allM.forEach(({m,p:pct})=>{const w=pct/100;const head=Math.max(0,cap(m)-(load[m]||0));const frac=0.5+0.5*(head/(cap(m)||1));fit+=frac*w*fw[m];wsum+=w;});
      fit=wsum?fit/wsum:0;
      const underBoost=allM.some(({m})=>weekVol[m]<(VOL_LANDMARKS[m]?.mev||6))?1.3:1;
      const recencyPen=recentNames.includes(ex.name)?(0.3+(stars/3)*0.7):1;  // recent picks cycle out; stars protect favorites (3 stars = no penalty)
      return{ex,allM,score:mult*fit*underBoost*recencyPen};
    }).filter(x=>x.score>0.001).sort((a,b)=>b.score-a.score);
    if(!scored.length)break;                               // nothing left with headroom: round-up complete
    const byCat={};scored.forEach(x=>{const c=(x.ex.cat)||"other";(byCat[c]=byCat[c]||[]).push(x);});const top=Object.values(byCat).flatMap(arr=>arr.slice(0,ACC_PER_CAT));   // top-N per category, then weighted-random -> variety across push/pull/legs/core
    const tot=top.reduce((s,x)=>s+x.score,0);let r=Math.random()*tot,pick=top[0];
    for(const c of top){r-=c.score;if(r<=0){pick=c;break;}}
    pick.allM.forEach(({m,p:pct})=>{load[m]=(load[m]||0)+ACC_SETS*(pct/100);}); // add this pick's load
    sel.push(buildAcc(pick.ex,accProg,repRange,bwLoad,isDeload,false));
    used.add(pick.ex.name);
  }
  return sel;
}

// ── QUICK MODE ──
const QUICK_POOLS={
  pull:[
    {name:"Pull-ups",muscles:"back, biceps"},
    {name:"Chin-ups",muscles:"back, biceps"},
    {name:"Wide-grip Pull-ups",muscles:"back, biceps"},
    {name:"Commando Pull-ups",muscles:"back, biceps, core"},
  ],
  push:[
    {name:"Push-ups",muscles:"chest, triceps, shoulders"},
    {name:"Diamond Push-ups",muscles:"triceps, chest, core"},
    {name:"Decline Push-ups",muscles:"chest, shoulders, triceps"},
    {name:"Dips",muscles:"chest, triceps, shoulders"},
    {name:"Pike Push-ups",muscles:"shoulders, triceps, core"},
  ],
  legs_push:[
    {name:"Bodyweight Squats (20-30 reps)",muscles:"quads, glutes"},
    {name:"Pistol Squats",muscles:"quads, glutes, core"},
    {name:"Sissy Squats",muscles:"quads, core"},
    {name:"Wall Sit (60s hold)",muscles:"quads, glutes"},
    {name:"Jump Squats",muscles:"quads, glutes, calves"},
  ],
  legs_pull:[
    {name:"Nordic Curls",muscles:"hamstrings, glutes"},
    {name:"Single-leg Hip Thrust",muscles:"glutes, hamstrings"},
    {name:"Glute Bridge (20 reps)",muscles:"glutes, hamstrings"},
    {name:"Single-leg Glute Bridge",muscles:"glutes, hamstrings, core"},
  ],
  core:[
    {name:"Hanging Leg Raises",muscles:"core, grip"},
    {name:"Hanging Knee Raises",muscles:"core"},
    {name:"Plank Hold (60s)",muscles:"core, shoulders"},
    {name:"Hollow Body Hold (45s)",muscles:"core, quads"},
    {name:"Mountain Climbers (30s)",muscles:"core, shoulders, quads"},
    {name:"Dead Bugs (12 each)",muscles:"core"},
    {name:"L-Sit Hold",muscles:"core, quads, triceps"},
  ],
};
function genQuickSession(){
  const pick=arr=>arr[Math.floor(Math.random()*arr.length)];
  return Object.values(QUICK_POOLS).map(pool=>{
    const ex=pick(pool);
    return{id:crypto.randomUUID(),name:ex.name,muscles:ex.muscles,sugReps:"max",
      sets:[{reps:"",weight:"BW",rir:"",pain:""}]};
  });
}

// ── SMALL COMPONENTS ──
function SessionTimer({start}){
  const[now,setNow]=useState(Date.now());
  useEffect(()=>{const t=setInterval(()=>setNow(Date.now()),1000);return()=>clearInterval(t);},[]);
  const s=Math.floor((now-start)/1000);const m=Math.floor(s/60);const h=Math.floor(m/60);
  return<div className="timer">{h>0?`${h}:${String(m%60).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`:`${m}:${String(s%60).padStart(2,"0")}`}</div>;
}

const Stars=({value,onChange,size=18})=>(<div style={{display:"flex",gap:4}}>
  {[1,2,3].map(s=><span key={s} onClick={e=>{e.stopPropagation();onChange(value===s?0:s);}}
    style={{cursor:"pointer",fontSize:size,color:s<=value?C.amber:C.line,userSelect:"none",lineHeight:1}}>★</span>)}</div>);

function SetRow({set,i,onUp,onRm,showPain,isHold,showEcc,showPwr,win=POWER_WINDOW}){
  const rc=set.rir!=null&&set.rir!==""?RIR_C(+set.rir):C.line;
  const pc=set.pain!=null&&set.pain!==""?PAIN_C(+set.pain):C.line;
  const[running,setRunning]=useState(false);
  const[elapsed,setElapsed]=useState(0);
  const[pwrMode,setPwrMode]=useState("idle"); // idle | edit | run | done
  const[pwrWin,setPwrWin]=useState(win);
  const[pwrLeft,setPwrLeft]=useState(win);
  const audioRef=useRef(null);
  useEffect(()=>{                                          // countdown
    if(pwrMode!=="run")return;
    const end=Date.now()+pwrLeft*1000;
    const iv=setInterval(()=>{const r=Math.max(0,Math.ceil((end-Date.now())/1000));setPwrLeft(r);if(r<=0){clearInterval(iv);setPwrMode("done");}},150);
    return()=>clearInterval(iv);
  },[pwrMode]);
  useEffect(()=>{                                          // alarm: sound + vibrate + flash until dismissed
    if(pwrMode!=="done")return;
    const fire=()=>{
      try{const ac=audioRef.current;if(ac){[0,0.18,0.36].forEach(dt=>{const o=ac.createOscillator(),g=ac.createGain();o.connect(g);g.connect(ac.destination);o.type="square";o.frequency.value=988;const t=ac.currentTime+dt;g.gain.setValueAtTime(0.0001,t);g.gain.exponentialRampToValueAtTime(0.35,t+0.02);g.gain.exponentialRampToValueAtTime(0.0001,t+0.14);o.start(t);o.stop(t+0.16);});}}catch(e){}
      try{if(navigator.vibrate)navigator.vibrate([400,120,400,120,600]);}catch(e){}
    };
    fire();const iv=setInterval(fire,1100);
    return()=>{clearInterval(iv);try{if(navigator.vibrate)navigator.vibrate(0);}catch(e){}};
  },[pwrMode]);
  const pwrStart=()=>{                                     // create/resume AudioContext inside the gesture so the alarm can sound later
    try{if(!audioRef.current){const AC=window.AudioContext||window.webkitAudioContext;if(AC)audioRef.current=new AC();}if(audioRef.current&&audioRef.current.state==="suspended")audioRef.current.resume();}catch(e){}
    setPwrLeft(+pwrWin>0?+pwrWin:win);setPwrMode("run");
  };
  const pwrTap=()=>{
    if(pwrMode==="idle")setPwrMode("edit");
    else setPwrMode("idle");                                // running -> cancel, done -> dismiss alarm
  };
  useEffect(()=>{
    if(!running)return;
    const t0=Date.now()-elapsed*1000;
    const iv=setInterval(()=>setElapsed(Math.floor((Date.now()-t0)/1000)),250);
    return()=>clearInterval(iv);
  },[running]);
  const toggle=()=>{
    if(running){setRunning(false);onUp(i,"reps",String(elapsed));}
    else{setElapsed(set.reps?+set.reps:0);setRunning(true);}
  };
  return(<div className="setrow">
    <div className="setnum">{i+1}</div>
    <input className="in" type="number" inputMode="numeric" placeholder={isHold?"sec":"reps"} value={set.reps||""} onChange={e=>onUp(i,"reps",e.target.value)} style={{flex:1}}/>
    {isHold&&<button className="x" onClick={toggle} title="Hold timer"
      style={{width:62,flexShrink:0,fontFamily:mono,fontSize:12,color:running?C.alarm:C.amber,borderColor:running?C.alarm:C.line}}>{running?`${elapsed}s`:"time"}</button>}
    {showPwr&&!isHold&&(pwrMode==="edit"
      ? <span style={{display:"flex",gap:2,flexShrink:0,alignItems:"center"}}>
          <input className="in" type="number" inputMode="numeric" autoFocus value={pwrWin} onChange={e=>setPwrWin(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")pwrStart();}} title="Seconds, then tap the play button" style={{width:42,flexShrink:0,padding:"0 4px",textAlign:"center"}}/>
          <button className="x" onClick={pwrStart} title="Start timer" style={{width:30,flexShrink:0,fontFamily:mono,fontSize:14,color:C.go,borderColor:C.go}}>▶</button>
        </span>
      : <button className="x" onClick={pwrTap} title="Power timer — tap to set seconds, tap again to start"
          style={{width:62,flexShrink:0,fontFamily:mono,fontSize:12,color:pwrMode==="done"?"#fff":pwrMode==="run"?C.arc:C.go,borderColor:pwrMode==="done"?C.alarm:pwrMode==="run"?C.arc:C.go,background:pwrMode==="done"?C.alarm:"transparent"}}>{pwrMode==="run"?`${pwrLeft}s`:pwrMode==="done"?"⏰ UP":`⏱ ${pwrWin||win}s`}</button>
    )}
    {showEcc&&<input className="in" type="number" inputMode="numeric" placeholder="ecc" value={set.ecc??""} onChange={e=>onUp(i,"ecc",e.target.value)} title="Eccentric (negative-only) reps, half credit"
      style={{width:48,flexShrink:0,color:set.ecc?C.warn:C.bone,borderColor:set.ecc?C.warn:C.line}}/>}
    <input className="in" type="number" inputMode="decimal" placeholder="lbs" value={set.weight||""} onChange={e=>onUp(i,"weight",e.target.value)} style={{width:76,flexShrink:0}}/>
    <input className="in" type="number" inputMode="numeric" placeholder="RIR" value={set.rir!=null?set.rir:""} onChange={e=>onUp(i,"rir",e.target.value)}
      min="0" max="5" style={{width:58,flexShrink:0,borderColor:rc,color:set.rir!==""&&set.rir!=null?rc:C.bone}}/>
    {showPain&&<input className="in" type="number" inputMode="numeric" placeholder="P" value={set.pain!=null?set.pain:""} onChange={e=>onUp(i,"pain",e.target.value)}
      min="0" max="10" title="Joint pain 0-10" style={{width:50,flexShrink:0,borderColor:pc,color:set.pain!==""&&set.pain!=null?pc:C.bone}}/>}
    <button className="x" onClick={()=>onRm(i)}>✕</button>
  </div>);
}

// Per-muscle AVERAGE weekly hard sets over the last `weeks` COMPLETED weeks — your typical volume.
// Stable: ignores the current partial week so it never reads low just because the week is young.
// null when there are no completed weeks yet (brand-new user) -> bar falls back to this week.
function avgWeeklyVolume(anchorLog,accLog,todayStr,weeks){
  const curWk=weekStart(todayStr);
  const isHard=s=>s.reps&&(s.rir==null||s.rir===""||+s.rir<=4);
  const byWk={};
  const add=(dateStr,name,sets)=>{
    const ref=EXERCISES.find(x=>x.name===name);if(!ref)return;
    const wk=weekStart(dateStr);if(wk>=curWk)return;
    const hs=(sets||[]).filter(isHard).length;if(!hs)return;
    byWk[wk]=byWk[wk]||{};
    [...ref.p,...ref.s].forEach(({m,p})=>{byWk[wk][m]=(byWk[wk][m]||0)+hs*(p/100);});
  };
  Object.entries(anchorLog).forEach(([name,es])=>(es||[]).forEach(e=>add(e.date,name,e.sets)));
  (accLog||[]).forEach(e=>(e.exercises||[]).forEach(x=>add(e.date,x.name,x.sets)));
  const wks=Object.keys(byWk).sort().slice(-(weeks||4));
  if(!wks.length)return null;
  const avg={};MUSCLES.forEach(m=>avg[m]=0);
  wks.forEach(w=>MUSCLES.forEach(m=>{avg[m]+=byWk[w][m]||0;}));
  MUSCLES.forEach(m=>avg[m]=avg[m]/wks.length);
  return avg;
}
function Dropdown({value,options,onChange,style}){
  const[open,setOpen]=useState(false);
  const cur=options.find(o=>o.v===value);
  return(<div style={{position:"relative",...style}}>
    <button type="button" className="in sm" onClick={()=>setOpen(o=>!o)} style={{width:"100%",textAlign:"left",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"space-between",gap:4}}>
      <span style={{fontFamily:mono,fontSize:13,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{cur?cur.l:"\u2014"}</span><span style={{color:C.dim,fontSize:11,flexShrink:0}}>\u25be</span>
    </button>
    {open&&<><div onClick={()=>setOpen(false)} style={{position:"fixed",inset:0,zIndex:150}}/>
    <div style={{position:"absolute",top:"calc(100% + 4px)",left:0,right:0,zIndex:151,background:C.panel,border:`1px solid ${C.line}`,borderRadius:10,padding:4,boxShadow:"0 12px 40px rgba(0,0,0,.5)",minWidth:120}}>
      {options.map(o=><button type="button" key={o.v} onClick={()=>{onChange(o.v);setOpen(false);}} style={{display:"block",width:"100%",textAlign:"left",padding:"9px 10px",borderRadius:7,border:"none",background:o.v===value?C.raised:"transparent",color:o.v===value?C.bone:C.steel,fontFamily:mono,fontSize:13,cursor:"pointer"}}>{o.l}</button>)}
    </div></>}
  </div>);
}
function ConfirmModal({open,title,msg,confirmLabel,danger,onConfirm,onCancel}){
  if(!open)return null;
  return(<div onClick={onCancel} style={{position:"fixed",inset:0,zIndex:200,background:"rgba(0,0,0,.62)",backdropFilter:"blur(3px)",display:"flex",alignItems:"center",justifyContent:"center",padding:24}}>
    <div onClick={e=>e.stopPropagation()} style={{background:C.panel,border:`1px solid ${C.line}`,borderRadius:14,padding:20,maxWidth:360,width:"100%",boxShadow:"0 20px 60px rgba(0,0,0,.55)"}}>
      {title&&<div style={{fontFamily:disp,fontWeight:700,fontSize:15,letterSpacing:1,color:C.bone,marginBottom:8}}>{title}</div>}
      <div style={{fontFamily:mono,fontSize:13,color:C.steel,lineHeight:1.5,marginBottom:18}}>{msg}</div>
      <div style={{display:"flex",gap:10}}>
        <button type="button" className="daytype" onClick={onCancel}>Cancel</button>
        <button type="button" className="daytype" onClick={onConfirm} style={{background:danger?C.alarm:C.go,borderColor:"transparent",color:C.ink}}>{confirmLabel||"Confirm"}</button>
      </div>
    </div>
  </div>);
}
function DatePicker({value,max,onChange,style}){
  const[open,setOpen]=useState(false);
  const todayStr=new Date().toISOString().slice(0,10);
  const sel=value?new Date(value+"T00:00:00"):new Date(todayStr+"T00:00:00");
  const[view,setView]=useState({y:sel.getFullYear(),m:sel.getMonth()});
  const maxD=max?new Date(max+"T00:00:00"):null;
  const fmt=value?new Date(value+"T00:00:00").toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"}):"Pick date";
  const first=new Date(view.y,view.m,1);
  const ndays=new Date(view.y,view.m+1,0).getDate();
  const cells=[];for(let i=0;i<first.getDay();i++)cells.push(null);for(let d=1;d<=ndays;d++)cells.push(d);
  const ds=d=>`${view.y}-${String(view.m+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
  const openCal=()=>{if(!open)setView({y:sel.getFullYear(),m:sel.getMonth()});setOpen(o=>!o);};
  const shift=n=>setView(v=>{const d=new Date(v.y,v.m+n,1);return{y:d.getFullYear(),m:d.getMonth()};});
  return(<div style={{position:"relative",...style}}>
    <button type="button" className="in sm" onClick={openCal} style={{width:"100%",textAlign:"left",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
      <span style={{fontFamily:mono,fontSize:13}}>{fmt}</span><span style={{color:C.dim,fontSize:11}}>▾</span>
    </button>
    {open&&<><div onClick={()=>setOpen(false)} style={{position:"fixed",inset:0,zIndex:150}}/>
    <div style={{position:"absolute",top:"calc(100% + 4px)",left:0,zIndex:151,background:C.panel,border:`1px solid ${C.line}`,borderRadius:12,padding:10,width:258,boxShadow:"0 16px 48px rgba(0,0,0,.5)"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:6}}>
        <button type="button" className="x" onClick={()=>shift(-1)}>‹</button>
        <span style={{fontFamily:disp,fontWeight:700,fontSize:13,color:C.bone}}>{first.toLocaleDateString("en-US",{month:"long",year:"numeric"})}</span>
        <button type="button" className="x" onClick={()=>shift(1)}>›</button>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:2,marginBottom:3}}>
        {["S","M","T","W","T","F","S"].map((d,i)=><div key={i} style={{textAlign:"center",fontFamily:mono,fontSize:10,color:C.dim}}>{d}</div>)}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:2}}>
        {cells.map((d,i)=>{if(!d)return<div key={i}/>;
          const v=ds(d),dis=maxD&&new Date(v+"T00:00:00")>maxD,isSel=v===value,isTod=v===todayStr;
          return<button type="button" key={i} disabled={dis} onClick={()=>{onChange(v);setOpen(false);}} style={{height:32,border:isTod&&!isSel?`1px solid ${C.steel}`:"1px solid transparent",borderRadius:7,background:isSel?C.go:"transparent",color:dis?C.line:isSel?C.ink:C.bone,fontFamily:mono,fontSize:13,cursor:dis?"default":"pointer",opacity:dis?.45:1,padding:0}}>{d}</button>;})}
      </div>
    </div></>}
  </div>);
}
function VolDash({weekVol,avgVol,trend}){
  const main=["chest","back","shoulders","quads","hamstrings","glutes","biceps","triceps"];
  return(<div className="card" style={{padding:"12px 12px 8px"}}>
    <div style={{fontFamily:disp,fontWeight:700,fontSize:12,letterSpacing:2.5,color:C.steel,textTransform:"uppercase",marginBottom:2}}>Weekly volume · hard sets</div>
    <div style={{fontFamily:mono,fontSize:9.5,color:C.dim,marginBottom:9}}>typical / wk · ▏this wk · ↕ load vs last wk</div>
    {main.map(m=>{
      const lm=VOL_LANDMARKS[m]||{mev:6,mav:14,mrv:20};
      const cur=Math.round(weekVol[m]||0);                        // this week so far (the tick)
      const avgRaw=avgVol&&avgVol[m]!=null?avgVol[m]:cur;         // your typical weekly volume (the bar)
      const avg=Math.round(avgRaw*10)/10;
      const pct=Math.min(avgRaw/lm.mrv*100,110);                  // bar = typical
      const curPct=Math.min(cur/lm.mrv*100,100);                  // tick = this week
      let c,label;
      if(avgRaw>=lm.mrv){c=C.warn;label=">MRV";}                  // very high volume — amber, not alarm
      else if(avgRaw>=lm.mev){c=C.go;label=avgRaw<=lm.mav?"MEV+":"MAV+";}  // at/above your weekly minimum
      else if(avgRaw>=lm.mev*0.7){c=C.warn;label="building";}     // close to it — amber, not red
      else{c=C.alarm;label="low";}                                // genuinely light on this muscle
      return(<div key={m} className="vol-row">
        <div className="vol-name">{m.slice(0,6)}</div>
        <div className="vol-track">
          <div className="vol-tick" style={{left:`${lm.mev/lm.mrv*100}%`}}/>
          <div className="vol-tick" style={{left:`${lm.mav/lm.mrv*100}%`}}/>
          <div className="vol-fill" style={{width:`${pct}%`,background:c}}/>
          <div title="this week so far" style={{position:"absolute",left:`${curPct}%`,top:-2,bottom:-2,width:2,background:C.bone,opacity:0.9,borderRadius:1}}/>
        </div>
        <div className="vol-val" style={{color:c}}>{avg} {label}{trend&&trend[m]&&<span style={{marginLeft:5,fontSize:11,color:trend[m]==="up"?C.go:trend[m]==="down"?C.warn:C.dim}} title={`load ${trend[m]} vs last wk`}>{trend[m]==="up"?"↑":trend[m]==="down"?"↓":"→"}</span>}</div>
      </div>);
    })}
  </div>);
}

// ── MAIN ──
export default function App(){
  const[view,setView]=useState("lift");
  const[anchors,setAnchors]=useState(()=>ld(SK.anchors,{}));
  const[anchorLog,setAnchorLog]=useState(()=>ld(SK.anchorLog,{}));
  const[accLog,setAccLog]=useState(()=>ld(SK.accLog,[]));
  const[anchorSets,setAnchorSets]=useState({});
  const[accs,setAccs]=useState([]);
  const[banned,setBanned]=useState(()=>ld(SK.banned,[]));
  const[prefs,setPrefs]=useState(()=>ld(SK.prefs,{}));
  const[fatigue,setFatigue]=useState(()=>{const f={};MUSCLES.forEach(m=>f[m]=0);return ld(SK.fatigue,f)});
  const[nutrition,setNutrition]=useState(()=>ld(SK.nutrition,[]));
  const[bodyData,setBodyData]=useState(()=>ld(SK.body,[]));
  const latestBW=useMemo(()=>{const e=[...bodyData].reverse().find(x=>x.weight);return e?+e.weight:0;},[bodyData]);
  const[cardioData,setCardioData]=useState(()=>ld(SK.cardio,[]));
  const[meso,setMeso]=useState(()=>ld(SK.meso,{startDate:null,length:5}));
  const[sessHist,setSessHist]=useState(()=>ld(SK.history,[]));
  const[editDur,setEditDur]=useState(null);const[editDurVal,setEditDurVal]=useState("");
  const[metGoal,setMetGoal]=useState(()=>ld(SK.metgoal,40));
  const[eccBySlot,setEccBySlot]=useState({});   // per-exercise eccentric, in-memory (resets each session)
  const[powerEnabled,setPowerEnabled]=useState(()=>{sv(SK.power,false);return false;});
  const[setup,setSetup]=useState(false);
  const[anchorCfg,setAnchorCfg]=useState(()=>ld(SK.anchorcfg,{mode:"default",slots:[]}));
  const activeSlots=useMemo(()=>{
    if(anchorCfg.mode==="custom"&&Array.isArray(anchorCfg.slots)&&anchorCfg.slots.length>=1){
      return anchorCfg.slots.map(s=>{const t=PATTERNS.find(p=>p.id===s.type)||PATTERNS[0];return{id:s.id,type:s.type,label:t.label,full:t.full,muscles:t.muscles};});
    }
    return PATTERNS.map(p=>({...p,type:p.id}));   // default = the fixed 6, ids unchanged (behavior-preserving)
  },[anchorCfg]);
  const cfgSet=(fn)=>setAnchorCfg(prev=>{const n=fn(prev);sv(SK.anchorcfg,n);return n;});
  const newSlotId=()=>"c"+Math.random().toString(36).slice(2,8);
  const chooseDefault=()=>cfgSet(()=>({mode:"default",slots:[]}));
  const chooseCustom=()=>{
    if(anchorCfg.mode==="custom"&&(anchorCfg.slots||[]).length)return;
    const slots=PATTERNS.map(p=>({id:newSlotId(),type:p.id}));
    setAnchors(a=>{const na={...a};slots.forEach(s=>{if(a[s.type])na[s.id]=a[s.type];});sv(SK.anchors,na);return na;});  // carry current picks into the new slots
    cfgSet(()=>({mode:"custom",slots}));
  };
  const addSlot=()=>cfgSet(prev=>((prev.slots||[]).length>=12?prev:{...prev,slots:[...prev.slots,{id:newSlotId(),type:"hpress"}]}));
  const removeSlot=(id)=>cfgSet(prev=>((prev.slots||[]).length<=6?prev:{...prev,slots:prev.slots.filter(s=>s.id!==id)}));
  const setSlotType=(id,type)=>cfgSet(prev=>({...prev,slots:(prev.slots||[]).map(s=>s.id===id?{...s,type}:s)}));
  const moveSlot=(id,dir)=>cfgSet(prev=>{const a=[...(prev.slots||[])];const i=a.findIndex(s=>s.id===id);const j=i+dir;if(i<0||j<0||j>=a.length)return prev;[a[i],a[j]]=[a[j],a[i]];return{...prev,slots:a};});
  const[dayTargets,setDayTargets]=useState(()=>ld(SK.daytargets,Array.from({length:7},()=>({cal:2400,pro:190,carb:208,fat:90}))));
  const[logDate,setLogDate]=useState(()=>new Date().toISOString().slice(0,10));
  const[paceLookback,setPaceLookback]=useState(()=>ld(SK.pacelookback,2));
  const[advOpen,setAdvOpen]=useState(false);
  const[showTgtEd,setShowTgtEd]=useState(false);
  const[accCount]=useState(3);
  const[accSearch,setAccSearch]=useState("");
  const[sessionStart,setSessionStart]=useState(null);
  const[sessionMode,setSessionMode]=useState("full");
  const[quickExs,setQuickExs]=useState([]);

  const allSet=activeSlots.every(p=>anchors[p.id]);
  const mesoState=getMesoState(meso);
  const weekVol=useMemo(()=>calcWeeklyVolume(anchorLog,accLog),[anchorLog,accLog]);
  const today=new Date().toISOString().slice(0,10);
  const avgVol=useMemo(()=>avgWeeklyVolume(anchorLog,accLog,today,paceLookback),[anchorLog,accLog,today,paceLookback]);
  const loadTrend=useMemo(()=>muscleLoadTrend(anchorLog,accLog,today),[anchorLog,accLog,today]);
  const dow=new Date(logDate+"T00:00:00").getDay();
  const targets=dayTargets[dow]||{cal:2400,pro:190,carb:208,fat:90};
  const dayNut=nutrition.filter(d=>d.date===logDate);
  const nutTotals=dayNut.reduce((s,e)=>({cal:s.cal+e.cal,pro:s.pro+e.pro,carb:s.carb+e.carb,fat:s.fat+e.fat}),{cal:0,pro:0,carb:0,fat:0});

  const initSession=useCallback(()=>{
    const sets={};const isDeload=mesoState.phase==="deload";
    activeSlots.forEach(p=>{
      if(!anchors[p.id])return;
      const prog=getProgression(anchors[p.id],anchorLog,[6,12],2,latestBW,powerEnabled,!!eccBySlot[anchors[p.id]]);
      const n=setTarget(anchors[p.id],anchorLog,[6,10],2,mesoState.phase);
      const ex0=EXERCISES.find(x=>x.name===anchors[p.id])||{};
      let baseW=prog.weight;
      if((baseW===""||baseW==null)&&!ex0.bw&&prog.isNew){const seed=muscleSeedWeight(((ex0.p&&ex0.p[0])||{}).m,{...ld(SK.accLog+"_prog",{}),...anchorLog});if(seed)baseW=seed;}
      const w=isDeload&&baseW?Math.round(+baseW*0.7):baseW;
      // ── LIVE: flat prescription (every set same weight) ──
      sets[p.id]=Array.from({length:n},()=>({reps:prog.reps||"",weight:w||"",rir:"",pain:"",...(prog.eccTarget?{ecc:prog.eccTarget}:{}),...(prog.power?{pwr:1}:{})}));
      // ── DORMANT: ramp/progressive pre-fill. Marker: RAMP_PREFILL ──
      // To enable ascending per-set loading: comment out the flat line above,
      // uncomment the block below. Reuses last session's ramp shape (prog.ramp),
      // scaled so its top set = this session's target weight `w`. Touches nothing else.
      // const rampShape = prog.ramp && prog.ramp.length ? prog.ramp : null;
      // const rampTop = rampShape ? Math.max(...rampShape) : 0;
      // if (rampShape && rampTop > 0) {
      //   sets[p.id] = Array.from({length:n}, (_,i) => ({
      //     reps: prog.reps||"",
      //     weight: Math.round(((rampShape[i] ?? rampTop)/rampTop)*(w||rampTop)/5)*5 || "",
      //     rir:"", pain:"", ts:null
      //   }));
      // } else {
      //   sets[p.id] = Array.from({length:n}, () => ({reps:prog.reps||"",weight:w||"",rir:"",pain:"",ts:null}));
      // }
    });
    setAnchorSets(sets);
    const recentNames=[...new Set((accLog||[]).slice(-3).flatMap(e=>(e.exercises||[]).map(x=>x.name)))];
    const accRange=[[8,12],[12,15],[15,20]][((accLog&&accLog.length)||0)%3];
    setAccs(genAcc(accCount,banned,prefs,fatigue,weekVol,anchorMuscleLoad(anchors,sets,activeSlots),recentNames,accRange,[],isDeload));
  },[anchors,anchorLog,accCount,banned,prefs,fatigue,weekVol,mesoState.phase,latestBW,accLog,powerEnabled,eccBySlot]);

  useEffect(()=>{if(allSet&&!setup)initSession();},[allSet,setup,powerEnabled]);

  const updAS=useCallback((pid,idx,f,v)=>setAnchorSets(p=>({...p,[pid]:p[pid].map((s,i)=>i===idx?{...s,[f]:v}:s)})),[]);
  const rmAS=useCallback((pid,idx)=>setAnchorSets(p=>({...p,[pid]:p[pid].filter((_,i)=>i!==idx)})),[]);
  const addAS=useCallback(pid=>setAnchorSets(p=>({...p,[pid]:[...(p[pid]||[]),{reps:"",weight:"",rir:"",pain:""}]})),[]);
  const updAcc=useCallback((id,idx,f,v)=>setAccs(p=>p.map(a=>a.id===id?{...a,sets:a.sets.map((s,i)=>i===idx?{...s,[f]:v}:s)}:a)),[]);
  const rmAcc=useCallback((id,idx)=>setAccs(p=>p.map(a=>a.id===id?{...a,sets:a.sets.filter((_,i)=>i!==idx)}:a)),[]);
  const addAccSet=useCallback(id=>setAccs(p=>p.map(a=>a.id===id?{...a,sets:[...a.sets,{reps:"",weight:"",rir:""}]}:a)),[]);
  const togLock=useCallback(id=>setAccs(p=>p.map(a=>a.id===id?{...a,locked:!a.locked}:a)),[]);
  const toggleBan=useCallback(name=>{setBanned(p=>{const n=p.includes(name)?p.filter(x=>x!==name):[...p,name];sv(SK.banned,n);return n;});setAccs(p=>p.filter(a=>a.name!==name));},[]);
  const rerollAcc=useCallback(()=>{const locked=accs.filter(a=>a.locked);const isDeload=mesoState.phase==="deload";
    const seed=anchorMuscleLoad(anchors,anchorSets,activeSlots);
    locked.forEach(a=>[...a.p,...a.s].forEach(({m,p:pct})=>{seed[m]=(seed[m]||0)+(a.sets.length)*(pct/100);}));
    const recentNames=[...new Set((accLog||[]).slice(-3).flatMap(e=>(e.exercises||[]).map(x=>x.name)))];
    const accRange=[[8,12],[12,15],[15,20]][((accLog&&accLog.length)||0)%3];
    const newAccs=genAcc(accCount-locked.length,banned,prefs,fatigue,weekVol,seed,recentNames,accRange,locked.map(a=>a.name),isDeload);setAccs([...locked,...newAccs]);},[accs,accCount,banned,prefs,fatigue,weekVol,anchors,anchorSets,accLog,mesoState.phase]);
  const addAccByName=useCallback((name)=>{
    const ex=EXERCISES.find(x=>x.name===name);if(!ex)return;
    const isDeload=mesoState.phase==="deload";
    const accProg=ld(SK.accLog+"_prog",{});
    const accRange=[[8,12],[12,15],[15,20]][((accLog&&accLog.length)||0)%3];
    setAccs(prev=>{
      const locked=prev.filter(a=>a.locked);
      if(locked.some(a=>a.name===name))return prev;
      const newLocked=[...locked,buildAcc(ex,accProg,accRange,latestBW,isDeload,true)];
      const seed=anchorMuscleLoad(anchors,anchorSets,activeSlots);
      newLocked.forEach(a=>[...a.p,...a.s].forEach(({m,p:pct})=>{seed[m]=(seed[m]||0)+(a.sets.length)*(pct/100);}));
      const recentNames=[...new Set((accLog||[]).slice(-3).flatMap(e=>(e.exercises||[]).map(x=>x.name)))];
      const fill=genAcc(Math.max(0,accCount-newLocked.length),banned,prefs,fatigue,weekVol,seed,recentNames,accRange,newLocked.map(a=>a.name),isDeload);
      return[...newLocked,...fill];
    });
    setAccSearch("");
  },[accCount,banned,prefs,fatigue,weekVol,anchors,anchorSets,accLog,mesoState.phase,latestBW]);

  const saveSession=useCallback(()=>{
    const newAL={...anchorLog};
    activeSlots.forEach(p=>{
      if(!anchors[p.id]||!anchorSets[p.id])return;
      const logged=anchorSets[p.id].filter(s=>s.reps||s.ecc);if(!logged.length)return;
      const nm=anchors[p.id];if(!newAL[nm])newAL[nm]=[];
      newAL[nm].push({date:new Date().toISOString(),sets:logged.map(s=>({reps:+s.reps||0,weight:+s.weight||0,rir:s.rir!==""?+s.rir:null,pain:s.pain!==""?+s.pain:null,...(s.ecc?{ecc:+s.ecc}:{}),...(s.pwr?{pwr:1}:{})}))});
      if(newAL[nm].length>40)newAL[nm]=newAL[nm].slice(-40);
    });
    setAnchorLog(newAL);sv(SK.anchorLog,newAL);
    const accEntry={date:new Date().toISOString(),exercises:accs.filter(a=>a.sets.some(s=>s.reps||s.ecc)).map(a=>({name:a.name,sets:a.sets.filter(s=>s.reps||s.ecc).map(s=>({reps:+s.reps||0,weight:+s.weight||0,rir:s.rir!==""?+s.rir:null,...(s.ecc?{ecc:+s.ecc}:{})}))}))};
    const newAccLog=[...accLog,accEntry].slice(-40);setAccLog(newAccLog);sv(SK.accLog,newAccLog);
    const accProg=ld(SK.accLog+"_prog",{});
    accs.forEach(a=>{const lsd=a.sets.filter(s=>s.reps||s.ecc);if(!lsd.length)return;
      if(!accProg[a.name])accProg[a.name]=[];
      accProg[a.name].push({date:new Date().toISOString(),sets:lsd.map(s=>({reps:+s.reps||0,weight:+s.weight||0,rir:s.rir!==""?+s.rir:null,...(s.ecc?{ecc:+s.ecc}:{})}))});
      if(accProg[a.name].length>20)accProg[a.name]=accProg[a.name].slice(-20);
    });sv(SK.accLog+"_prog",accProg);
    const nf={...fatigue};
    activeSlots.forEach(p=>{
      const sets=anchorSets[p.id]||[];
      const pains=sets.filter(s=>s.pain!=null&&s.pain!=="").map(s=>+s.pain);
      if(pains.length){const avg=pains.reduce((a,b)=>a+b,0)/pains.length;
        p.muscles.forEach(m=>{nf[m]=Math.min(4,Math.max(nf[m]||0,Math.round(avg/2.5)));});}
    });
    setFatigue(nf);sv(SK.fatigue,nf);
    if(!meso.startDate){const nm={startDate:new Date().toISOString(),length:5};setMeso(nm);sv(SK.meso,nm);}
    const duration=sessionStart?Math.round((Date.now()-sessionStart)/60000):null;
    const histEntry={date:new Date().toISOString(),mode:sessionMode,durationMin:duration,
      anchors:Object.fromEntries(activeSlots.map(p=>[p.id,{name:anchors[p.id],sets:anchorSets[p.id]||[]}])),
      accessories:accEntry.exercises};
    const histArr=[...sessHist,histEntry].slice(-50);
    setSessHist(histArr);sv(SK.history,histArr);
    setSessionStart(null);setSessionMode("full");
    initSession();
  },[anchorLog,anchors,anchorSets,accs,accLog,fatigue,meso,initSession,sessionStart,sessionMode,sessHist]);

  const delHistEntry=useCallback(date=>{const all=sessHist.filter(x=>x.date!==date);setSessHist(all);sv(SK.history,all);},[sessHist]);
  const saveDur=useCallback(()=>{const all=sessHist.map(x=>x.date===editDur?{...x,durationMin:+editDurVal||null}:x);setSessHist(all);sv(SK.history,all);setEditDur(null);setEditDurVal("");},[sessHist,editDur,editDurVal]);
  const selAnchor=useCallback((pid,name)=>setAnchors(p=>{const n={...p,[pid]:name};sv(SK.anchors,n);return n;}),[]);
  const startDeload=useCallback(()=>{const nm={startDate:new Date().toISOString(),length:1};setMeso(nm);sv(SK.meso,nm);},[]);
  const newMeso=useCallback(()=>{const nm={startDate:new Date().toISOString(),length:5};setMeso(nm);sv(SK.meso,nm);initSession();},[initSession]);

  // Nutrition
  const[nCal,setNCal]=useState("");const[nPro,setNPro]=useState("");const[nCarb,setNCarb]=useState("");const[nFat,setNFat]=useState("");const[nNote,setNNote]=useState("");
  const addNut=useCallback(()=>{if(!nCal)return;const e={date:logDate,cal:+nCal||0,pro:+nPro||0,carb:+nCarb||0,fat:+nFat||0,note:nNote,time:new Date().toISOString()};
    setNutrition(p=>{const n=[...p,e].slice(-1000);sv(SK.nutrition,n);return n;});setNCal("");setNPro("");setNCarb("");setNFat("");setNNote("");},[nCal,nPro,nCarb,nFat,nNote,logDate]);
  const delNut=useCallback(time=>{setNutrition(p=>{const n=p.filter(e=>e.time!==time);sv(SK.nutrition,n);return n;});},[]);
  const setDT=(idx,field,val)=>setDayTargets(p=>{const n=p.map((d,i)=>i===idx?{...d,[field]:+val||0}:d);sv(SK.daytargets,n);return n;});
  // Body
  const[bW,setBW]=useState("");const[bWa,setBWa]=useState("");const[bNa,setBNa]=useState("");
  const addBody=useCallback(()=>{if(!bW&&!bWa&&!bNa)return;
    const e={date:today,weight:+bW||null,waist:+bWa||null,navel:+bNa||null,time:new Date().toISOString()};
    setBodyData(p=>{const n=[...p,e].slice(-500);sv(SK.body,n);return n;});
    setBW("");setBWa("");setBNa("");},[bW,bWa,bNa,today]);
  const delBody=useCallback(time=>{setBodyData(p=>{const n=p.filter(e=>e.time!==time);sv(SK.body,n);return n;});},[]);
  // Cardio
  const[cType,setCType]=useState("steady");const[cH,setCH]=useState("");const[cM,setCM]=useState("");const[cS,setCS]=useState("");const[cHR,setCHR]=useState("");const[cConf,setCConf]=useState("");const[cDist,setCDist]=useState("");const[cZones,setCZones]=useState(["","","","",""]);const[cDate,setCDate]=useState(today);const[confirmClear,setConfirmClear]=useState(false);
  const[profile,setProfile]=useState(()=>ld(SK.profile,{age:26,sex:"male"}));
  const setProf=(f,v)=>setProfile(p=>{const n={...p,[f]:f==="age"?(+v||0):v};sv(SK.profile,n);return n;});
  const addCardio=useCallback(()=>{const durMin=(+cH||0)*60+(+cM||0)+(+cS||0)/60;if(!durMin)return;const e={date:cDate||today,type:cType,duration:durMin,avgHR:+cHR||null,config:cType==="hiit"?cConf:"",...(+cDist?{distance:+cDist}:{}),...(cZones.some(z=>+z>0)?{zones:cZones.map(z=>+z||0)}:{}),time:new Date().toISOString()};
    e.burn=cardioBurn(e,latestBW,profile.age,profile.sex);
    setCardioData(p=>{const n=[...p,e].slice(-500);sv(SK.cardio,n);return n;});setCH("");setCM("");setCS("");setCHR("");setCConf("");setCDist("");setCZones(["","","","",""]);setCDate(today);},[cType,cH,cM,cS,cHR,cConf,cDist,cZones,cDate,today,latestBW,profile.age,profile.sex]);
  const delCardio=useCallback(time=>{setCardioData(p=>{const n=p.filter(e=>e.time!==time);sv(SK.cardio,n);return n;});},[]);
  const clearAllData=useCallback(()=>{setConfirmClear(false);
    Object.values(SK).forEach(k=>localStorage.removeItem(k));localStorage.removeItem(SK.accLog+"_prog");
    window.location.reload();},[]);

  const dateStr=new Date().toLocaleDateString("en-US",{weekday:"short",month:"short",day:"numeric"});

  // ── PHASE 4: insight series + correlations ──
  const weeklyAgg=useMemo(()=>{
    const strW={};
    activeSlots.forEach(p=>{const nm=anchors[p.id];if(!nm)return;const h=anchorLog[nm];if(!h||!h.length)return;
      const ex=EXERCISES.find(x=>x.name===nm);const bw=!!ex?.bw;
      const val=e=>{if(bw){const ss=e.sets.filter(s=>s.reps);return ss.length?ss.reduce((a,s)=>a+(+s.reps),0)/ss.length:0;}const b=e.sets.filter(s=>s.weight&&s.reps).sort((a,b)=>(b.weight*b.reps)-(a.weight*a.reps))[0];return b?b.weight*(1+b.reps/30):0;};
      const base=val(h[0]);if(!base)return;
      h.forEach(e=>{const v=val(e);if(!v)return;const w=weekStart(e.date);(strW[w]=strW[w]||[]).push(v/base);});});
    const strength={};Object.keys(strW).forEach(w=>strength[w]=strW[w].reduce((a,b)=>a+b,0)/strW[w].length*100);
    const byDay={};nutrition.forEach(e=>{byDay[e.date]=(byDay[e.date]||0)+(+e.cal||0);});
    const balance={};Object.keys(byDay).forEach(date=>{const dw=new Date(String(date).slice(0,10)+"T00:00:00").getDay();const tgt=(dayTargets[dw])?.cal||0;const w=weekStart(date);balance[w]=(balance[w]||0)+(byDay[date]-tgt);});
    const wW={};bodyData.filter(e=>e.weight).forEach(e=>{const w=weekStart(e.date);(wW[w]=wW[w]||[]).push(+e.weight);});
    const weight={};Object.keys(wW).forEach(w=>weight[w]=wW[w].reduce((a,b)=>a+b,0)/wW[w].length);
    const cK={},cH={};cardioData.forEach(e=>{const w=weekStart(e.date);const b=e.burn!=null?e.burn:cardioBurn(e,latestBW,profile.age,profile.sex);if(b)cK[w]=(cK[w]||0)+b;if(e.avgHR)(cH[w]=cH[w]||[]).push(+e.avgHR);});
    const cardioHR={};Object.keys(cH).forEach(w=>cardioHR[w]=cH[w].reduce((a,b)=>a+b,0)/cH[w].length);
    return{strength,balance,weight,cardioKcal:cK,cardioHR};
  },[anchorLog,anchors,nutrition,dayTargets,bodyData,cardioData,latestBW,profile]);

  const bodyVerdict=useMemo(()=>{
    const sl=k=>bodyTrend(bodyData,k);
    const w=sl("weight"),wa=sl("waist");
    if(w==null&&wa==null)return null;
    const fW=0.3,fI=0.1;
    const wd=w==null?null:(w<-fW?"down":w>fW?"up":"flat");
    const wad=wa==null?null:(wa<-fI?"down":wa>fI?"up":"flat");
    let text,tone;
    if(wad==="up"){text=`Waist rising ${wa>0?"+":""}${wa.toFixed(2)}"/wk${wd==="up"?` with weight up ${w.toFixed(2)} lb/wk`:""}. Trending toward fat gain.`;tone=C.alarm;}
    else if(wad==="down"&&wd==="flat"){text=`Waist down ${wa.toFixed(2)}"/wk at stable weight. Recomposition: fat down, muscle holding.`;tone=C.go;}
    else if(wad==="down"&&wd==="down"){text=`Weight and waist falling together (${w.toFixed(2)} lb/wk, ${wa.toFixed(2)}"/wk). Fat loss.`;tone=C.go;}
    else if(wad==="down"&&wd==="up"){text=`Waist down while weight climbs. Lean gain / recomposition.`;tone=C.go;}
    else if(wd==="down"){text=`Weight down ${w.toFixed(2)} lb/wk, waist flat. Mostly on track; watch composition.`;tone=C.go;}
    else if(wd==="up"){text=`Weight up ${w.toFixed(2)} lb/wk, waist flat. Surplus; lean if intended, watch if not.`;tone=C.warn;}
    else{text=`Body metrics roughly flat. Hold or adjust the lever you want to move.`;tone=C.dim;}
    return{text,tone};
  },[bodyData]);

  const align=(a,b)=>{const weeks=Object.keys(a).filter(w=>w in b).sort();return weeks.map(w=>[a[w],b[w]]);};
  const confOf=n=>n<4?{t:"insufficient",c:C.dim}:n<7?{t:"low",c:C.warn}:{t:"emerging",c:C.go};

  return(<div className="app">
    <link href="https://fonts.googleapis.com/css2?family=Big+Shoulders+Display:wght@500;600;700;800&family=JetBrains+Mono:wght@400;600;700&display=swap" rel="stylesheet"/>
    <style>{CSS}</style>

    <div className="masthead">
      <div className="brand">Workout<b>·</b>Gen</div>
      <div className="mast-date">{dateStr}</div>
    </div>

    <nav className="tabs">
      <button className={`tab${view==="lift"?" on":""}`} onClick={()=>setView("lift")}>Lift</button>
      <button className={`tab${view==="log"?" on":""}`} onClick={()=>setView("log")}>Log</button>
      <button className={`tab${view==="trends"?" on":""}`} onClick={()=>setView("trends")}>Trends</button>
    </nav>

    <div className="wrap">
    {/* ════ LIFT ════ */}
    {view==="lift"&&<>
      {meso.startDate&&<div className={`card hazard${mesoState.phase==="deload"?" red":""}`} style={{display:"flex",justifyContent:"space-between",alignItems:"center",paddingTop:14}}>
        <div style={{fontFamily:disp,fontWeight:700,fontSize:13,letterSpacing:2,color:mesoState.phase==="deload"?C.alarm:C.arc,textTransform:"uppercase"}}>
          {mesoState.phase==="deload"?"Deload week":"Accumulation"} <span style={{color:C.dim,letterSpacing:1}}>· Wk {mesoState.week}/{meso.length}</span></div>
        <div style={{display:"flex",gap:6}}>
          {mesoState.phase!=="deload"&&<button className="btn-ghost red" onClick={startDeload}>Deload</button>}
          <button className="btn-ghost green" onClick={newMeso}>New meso</button>
        </div>
      </div>}

      <VolDash weekVol={weekVol} avgVol={avgVol} trend={loadTrend}/>

      <div style={{display:"flex",gap:8,alignItems:"center",margin:"0 0 10px",flexWrap:"wrap"}}>
        <span style={{fontFamily:mono,fontSize:10,color:C.steel}}>eccentric-assisted BW progression</span>
      </div>

      <div style={{display:"flex",gap:8,alignItems:"center",margin:"0 0 10px",flexWrap:"wrap"}}>
        <span style={{fontFamily:mono,fontSize:11,color:C.dim,flexShrink:0}}>POWER</span>
        <button className={`daytype${powerEnabled?" on":""}`} style={{flex:0,padding:"0 12px",height:32}} onClick={()=>setPowerEnabled(v=>{const n=!v;sv(SK.power,n);return n;})}>{powerEnabled?"ON":"OFF"}</button>
        <span style={{fontFamily:mono,fontSize:10,color:C.steel}}>ballistic · {POWER_REPS} fast reps / {POWER_WINDOW}s window</span>
      </div>

      {!allSet||setup?<>
        <div className="eyebrow"><span style={{color:C.arc}}>{allSet?"Anchors · pick, then Done":"Set up anchors"}</span>{allSet&&setup&&<button className="btn-ghost act" onClick={()=>setSetup(false)}>Done</button>}</div>
        <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:12}}>
          <button onClick={chooseDefault} className="card plate" style={{textAlign:"left",cursor:"pointer",border:`1.5px solid ${anchorCfg.mode!=="custom"?C.arc:C.line}`,padding:14}}>
            <div style={{fontFamily:disp,fontSize:17,color:anchorCfg.mode!=="custom"?C.bone:C.steel,lineHeight:1.1}}>Default anchor configuration</div>
            <div style={{fontFamily:mono,fontSize:11,color:C.dim,marginTop:4}}>The standard 6 · H/V press, H/V pull, squat, hinge.</div>
          </button>
          <button onClick={chooseCustom} className="card" style={{textAlign:"left",cursor:"pointer",border:`1px solid ${anchorCfg.mode==="custom"?C.arc:C.line}`,padding:10,opacity:anchorCfg.mode==="custom"?1:0.72}}>
            <div style={{fontFamily:disp,fontSize:13,color:anchorCfg.mode==="custom"?C.bone:C.steel,lineHeight:1.1}}>Custom configuration</div>
            <div style={{fontFamily:mono,fontSize:10,color:C.dim,marginTop:2}}>6–12 slots · any pattern (repeats ok) · reorder.</div>
          </button>
        </div>
        {anchorCfg.mode==="custom"
          ? <>{activeSlots.map((p,idx)=><div key={p.id} className="card plate">
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
                <div style={{display:"flex",flexDirection:"column",gap:3}}>
                  <button className="x" disabled={idx===0} style={{width:30,height:20,padding:0,fontSize:11,opacity:idx===0?0.25:1}} onClick={()=>moveSlot(p.id,-1)}>▲</button>
                  <button className="x" disabled={idx===activeSlots.length-1} style={{width:30,height:20,padding:0,fontSize:11,opacity:idx===activeSlots.length-1?0.25:1}} onClick={()=>moveSlot(p.id,1)}>▼</button>
                </div>
                <div className="pat-eyebrow" style={{flex:1,margin:0}}>Slot {idx+1} · {p.full}</div>
                {activeSlots.length>6&&<button className="btn-ghost red" style={{fontSize:9,padding:"3px 8px"}} onClick={()=>removeSlot(p.id)}>remove</button>}
              </div>
              <div style={{fontFamily:mono,fontSize:9,color:C.dim,marginBottom:4,letterSpacing:1}}>PATTERN</div>
              <div className="pillwrap" style={{marginBottom:10}}>
                {PATTERNS.map(t=><button key={t.id} className={`pill${p.type===t.id?" on":""}`} onClick={()=>setSlotType(p.id,t.id)}>{t.label}</button>)}
              </div>
              <div style={{fontFamily:mono,fontSize:9,color:C.dim,marginBottom:4,letterSpacing:1}}>EXERCISE</div>
              <div className="pillwrap">
                {(PATTERN_MAP[p.type]||[]).filter(n=>!banned.includes(n)).map(name=>(
                  <button key={name} className={`pill${anchors[p.id]===name?" on":""}`} onClick={()=>selAnchor(p.id,name)}>{name}</button>))}
              </div>
            </div>)}
            {activeSlots.length<12&&<button className="btn start-quick" style={{width:"100%",marginTop:2,marginBottom:4,height:44,fontSize:13,borderRadius:10}} onClick={addSlot}>+ Add slot · {activeSlots.length}/12</button>}
            </>
          : activeSlots.map(p=><div key={p.id} className="card plate">
              <div className="pat-eyebrow">{p.full}</div>
              <div className="pillwrap">
                {(PATTERN_MAP[p.type]||[]).filter(n=>!banned.includes(n)).map(name=>(
                  <button key={name} className={`pill${anchors[p.id]===name?" on":""}`} onClick={()=>selAnchor(p.id,name)}>{name}</button>))}
              </div>
            </div>)}
        {allSet&&<button className="btn btn-amber" style={{width:"100%",height:54,fontSize:16,marginTop:6}} onClick={()=>{setSetup(false);initSession();}}>Start session</button>}
        <button className="btn start-quick" style={{width:"100%",marginTop:8,height:48,fontSize:14,borderRadius:10}}
          onClick={()=>{setSetup(false);setSessionStart(Date.now());setSessionMode("quick");setQuickExs(genQuickSession());setAccs([]);}}>Quick bodyweight · maintenance</button>
      </>:<>

        {sessionStart&&<div className="card hazard live">
          <div>
            <div className="live-label"><span className="dot"/>Session live<span className="mode-chip">{sessionMode==="quick"?"QUICK":"FULL"}</span></div>
          </div>
          <SessionTimer start={sessionStart}/>
        </div>}

        {!sessionStart&&<div className="startrow">
          <button className="btn btn-amber start-full" onClick={()=>{setSessionStart(Date.now());setSessionMode("full");initSession();}}>Start full</button>
          <button className="btn start-quick" onClick={()=>{setSessionStart(Date.now());setSessionMode("quick");setQuickExs(genQuickSession());setAccs([]);}}>Quick</button>
        </div>}

        <div className="eyebrow">
          <span style={{color:sessionMode==="quick"?C.amber:C.arc}}>{sessionMode==="quick"?"Bodyweight circuit":"Anchors"}</span>
          {sessionMode==="quick"
            ?<button className="btn-ghost act" onClick={()=>setQuickExs(genQuickSession())}>Reroll</button>
            :<button className="btn-ghost act" onClick={()=>setSetup(true)}>Change</button>}
        </div>

        {sessionMode==="quick"&&<>
          <div className="sub" style={{margin:"-4px 0 10px"}}>5 exercises · 1 set each to near-failure · no equipment</div>
          {quickExs.map(ex=><div key={ex.id} className="card" style={{borderLeft:`3px solid ${C.amber}`}}>
            <div className="ex-name" style={{fontSize:17}}>{ex.name}</div>
            <div className="sub">{ex.muscles} · 1 set to {ex.sugReps}</div>
            {ex.sets.map((s,i)=><div key={i} className="setrow" style={{marginTop:6}}>
              <div className="setnum">{i+1}</div>
              <input className="in" type="number" inputMode="numeric" placeholder="reps" value={s.reps||""} style={{flex:1}}
                onChange={e=>{setQuickExs(p=>p.map(x=>x.id===ex.id?{...x,sets:x.sets.map((ss,j)=>j===i?{...ss,reps:e.target.value}:ss)}:x));}}/>
              <div className="bw-tag">BW</div>
              <input className="in" type="number" inputMode="numeric" placeholder="RIR" value={s.rir||""} min="0" max="5" style={{width:58,flexShrink:0}}
                onChange={e=>{setQuickExs(p=>p.map(x=>x.id===ex.id?{...x,sets:x.sets.map((ss,j)=>j===i?{...ss,rir:e.target.value}:ss)}:x));}}/>
            </div>)}
          </div>)}
        </>}

        {sessionMode==="full"&&<>
          {activeSlots.map(p=>{
            if(!anchors[p.id])return null;
            const prog=getProgression(anchors[p.id],anchorLog,[6,12],2,latestBW,powerEnabled,!!eccBySlot[anchors[p.id]]);
            const sets=anchorSets[p.id]||[];
            const hasPain=sets.some(s=>s.pain!=null&&s.pain!==""&&+s.pain>=6);
            const stripe=hasPain?C.alarm:prog.deload?C.alarm:prog.progressed?C.go:C.arc;
            const chip=prog.deload?{t:"DELOAD",c:C.alarm}:prog.repUp?{t:"ADD REP",c:C.go}:prog.progressed?{t:"LOAD UP",c:C.go}:prog.tooHard?{t:"BACK OFF",c:C.alarm}:prog.isNew?{t:"NEW",c:C.steel}:{t:"TARGET",c:C.arc};
            const lastN=lastSetCount(anchors[p.id],anchorLog);const tgtN=setTarget(anchors[p.id],anchorLog,[6,10],2,mesoState.phase);const addedSet=lastN>0&&tgtN>lastN&&mesoState.phase!=="deload";
            return(<div key={p.id} className="card" style={{borderLeft:`3px solid ${stripe}`}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                <div>
                  <div className="pat-eyebrow">{p.label}</div>
                  <div className="ex-name">{anchors[p.id]}</div>
                </div>
                <div style={{display:"flex",alignItems:"center",gap:6,flexShrink:0}}>
                  {!!(EXERCISES.find(x=>x.name===anchors[p.id])||{}).bw&&!(EXERCISES.find(x=>x.name===anchors[p.id])||{}).hold&&<button className={`daytype${eccBySlot[anchors[p.id]]?" on":""}`} style={{flex:0,padding:"0 9px",height:26,fontSize:10}} onClick={()=>{const nm=anchors[p.id];const on=!eccBySlot[nm];setEccBySlot(m=>({...m,[nm]:on}));const pr=getProgression(nm,anchorLog,[6,12],2,latestBW,powerEnabled,on);setAnchorSets(prev=>({...prev,[p.id]:(prev[p.id]||[]).map(s=>({...s,reps:pr.reps||s.reps,ecc:on&&pr.eccTarget?pr.eccTarget:""}))}));}} title="Eccentric-assisted reps for this exercise">ECC {eccBySlot[anchors[p.id]]?"ON":"OFF"}</button>}
                  {hasPain&&<div className="flag">RED PAIN</div>}
                </div>
              </div>
              <div className="readout">
                <span className="chip" style={{color:chip.c,background:`${chip.c}1c`,border:`1px solid ${chip.c}44`}}>{chip.t}</span>
                {addedSet&&<span className="chip" style={{color:C.go,background:`${C.go}1c`,border:`1px solid ${C.go}44`}}>+1 SET → {tgtN}</span>}
                <p>{prog.note}{prog.weight?<span className="tgt"> → {prog.reps}r × {prog.weight}lb</span>:null}</p>
              </div>
              {sets.map((s,i)=><SetRow key={i} set={s} i={i} showPain={p.id==="squat"||p.id==="hinge"} isHold={!!(EXERCISES.find(x=>x.name===anchors[p.id])||{}).hold} showEcc={(()=>{const e=EXERCISES.find(x=>x.name===anchors[p.id])||{};return !!e.bw&&!e.hold&&!!eccBySlot[anchors[p.id]];})()} showPwr={(()=>{const e=EXERCISES.find(x=>x.name===anchors[p.id])||{};return powerEnabled&&!e.hold;})()} win={prog.win||POWER_WINDOW}
                onUp={(idx,f,v)=>updAS(p.id,idx,f,v)} onRm={idx=>rmAS(p.id,idx)}/>)}
              <button className="addset" onClick={()=>addAS(p.id)}>+ set</button>
            </div>);
          })}

          <div className="eyebrow">
            <span style={{color:C.amber}}>Accessories</span>
            <button className="btn-ghost act" onClick={rerollAcc}>Reroll</button>
          </div>
          <div style={{marginBottom:10}}>
            <div style={{display:"flex",gap:6,alignItems:"center"}}>
              <input className="in" placeholder="search to add an accessory (e.g. pullovers)" value={accSearch} onChange={e=>setAccSearch(e.target.value)} style={{flex:1}}/>
              {accSearch&&<button className="x" onClick={()=>setAccSearch("")} style={{width:40,flexShrink:0}} title="Clear">✕</button>}
            </div>
            {(()=>{const q=accSearch.trim().toLowerCase();if(q.length<2)return null;const cur=new Set(Object.values(anchors||{}));const matches=EXERCISES.filter(e=>e.name.toLowerCase().includes(q)&&!banned.includes(e.name)&&!cur.has(e.name)&&!accs.some(a=>a.name===e.name)).slice(0,8);if(!matches.length)return <div style={{fontFamily:mono,fontSize:11,color:C.dim,marginTop:6}}>no matches in catalog</div>;return <div style={{display:"flex",flexWrap:"wrap",gap:6,marginTop:6}}>{matches.map(e=><button key={e.name} className="pill" onClick={()=>addAccByName(e.name)}>+ {e.name}</button>)}</div>;})()}
          </div>
          {accs.map(a=><div key={a.id} className="card" style={{borderLeft:a.locked?`3px solid ${C.amber}`:`1px solid ${C.line}`}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:8}}>
              <div style={{minWidth:0}}>
                <div className="ex-name" style={{fontSize:17}}>{a.name}</div>
                <div className="sub">{a.eq} · {[...a.p,...a.s].map(({m,p})=>`${m} ${p}%`).join(" / ")}</div>
                {a.sugWeight&&<div className="sub" style={{color:C.amber}}>Suggest {a.sugReps}r × {a.sugWeight}lb</div>}
              </div>
              <div style={{display:"flex",alignItems:"center",gap:10,flexShrink:0}}>
                {!!(EXERCISES.find(x=>x.name===a.name)||{}).bw&&!(EXERCISES.find(x=>x.name===a.name)||{}).hold&&<button className={`daytype${eccBySlot[a.name]?" on":""}`} style={{flex:0,padding:"0 8px",height:24,fontSize:9}} onClick={()=>setEccBySlot(m=>({...m,[a.name]:!m[a.name]}))} title="Eccentric reps for this exercise">ECC</button>}
                <Stars value={prefs[a.name]||0} onChange={v=>{setPrefs(p=>{const n={...p,[a.name]:v};sv(SK.prefs,n);return n;});}}/>
                <button onClick={()=>toggleBan(a.name)} title="Ban from rotation" style={{fontFamily:mono,fontSize:11,background:"none",border:"none",cursor:"pointer",color:C.dim,padding:4,letterSpacing:1}}>ban</button>
                <button onClick={()=>togLock(a.id)} title={a.locked?"Locked":"Lock"} style={{fontFamily:mono,fontSize:11,background:"none",border:"none",cursor:"pointer",color:a.locked?C.amber:C.line,padding:4,letterSpacing:1}}>{a.locked?"LOCK":"lock"}</button>
              </div>
            </div>
            <div style={{marginTop:4}}>
              {a.sets.map((s,i)=><SetRow key={i} set={s} i={i} showPain={false} isHold={!!(EXERCISES.find(x=>x.name===a.name)||{}).hold} showEcc={(()=>{const e=EXERCISES.find(x=>x.name===a.name)||{};return !!e.bw&&!e.hold&&!!eccBySlot[a.name];})()} showPwr={(()=>{const e=EXERCISES.find(x=>x.name===a.name)||{};return powerEnabled&&!e.hold;})()}
                onUp={(idx,f,v)=>updAcc(a.id,idx,f,v)} onRm={idx=>rmAcc(a.id,idx)}/>)}
            </div>
            <button className="addset" onClick={()=>addAccSet(a.id)}>+ set</button>
          </div>)}
          {banned.length>0&&<div style={{marginTop:12}}>
            <div style={{fontFamily:mono,fontSize:11,color:C.dim,marginBottom:6}}>BANNED · tap to restore</div>
            <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
              {banned.map(nm=><button key={nm} onClick={()=>toggleBan(nm)} style={{fontFamily:mono,fontSize:11,background:C.raised,border:`1px solid ${C.line}`,borderRadius:6,padding:"4px 10px",color:C.steel,cursor:"pointer"}}>{nm} ×</button>)}
            </div>
          </div>}
        </>}

        <button className="btn btn-go" style={{width:"100%",height:56,fontSize:16,marginTop:14}} onClick={saveSession}>Save session</button>
      </>}
    </>}

    {/* ════ LOG ════ */}
    {view==="log"&&<>
      <div className="eyebrow"><span style={{color:C.amber}}>Nutrition</span>
        <button className="btn-ghost" style={{height:30,fontSize:11,padding:"0 10px"}} onClick={()=>setShowTgtEd(s=>!s)}>{showTgtEd?"Done":"Edit targets"}</button>
      </div>
      <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:8}}>
        <DatePicker value={logDate} max={today} onChange={d=>setLogDate(d||today)} style={{flex:1}}/>
        <span style={{fontFamily:mono,fontSize:13,color:logDate===today?C.amber:C.steel,minWidth:64}}>{logDate===today?"Today":DOW3[dow]}</span>
      </div>
      {showTgtEd&&<div className="card" style={{marginBottom:8}}>
        <div style={{fontFamily:mono,fontSize:11,color:C.dim,marginBottom:6}}>WEEKLY TARGETS · cal / P / C / F</div>
        {[1,2,3,4,5,6,0].map(idx=><div key={idx} style={{display:"flex",gap:5,alignItems:"center",marginBottom:5}}>
          <span style={{width:34,fontFamily:mono,fontSize:12,color:C.steel,flexShrink:0}}>{DOW3[idx]}</span>
          <input className="in sm" type="number" inputMode="numeric" placeholder="cal" value={dayTargets[idx].cal||""} onChange={e=>setDT(idx,"cal",e.target.value)} style={{flex:1.4}}/>
          <input className="in sm" type="number" inputMode="numeric" placeholder="P" value={dayTargets[idx].pro||""} onChange={e=>setDT(idx,"pro",e.target.value)} style={{flex:1}}/>
          <input className="in sm" type="number" inputMode="numeric" placeholder="C" value={dayTargets[idx].carb||""} onChange={e=>setDT(idx,"carb",e.target.value)} style={{flex:1}}/>
          <input className="in sm" type="number" inputMode="numeric" placeholder="F" value={dayTargets[idx].fat||""} onChange={e=>setDT(idx,"fat",e.target.value)} style={{flex:1}}/>
        </div>)}
      </div>}

      <div className="card">
        <div className="target-line">Target {targets.cal} cal · P {targets.pro}g · C {targets.carb}g · F {targets.fat}g <span style={{color:C.dim}}>({DOW3[dow]})</span></div>
        <div className="today-line">
          <span style={{color:nutTotals.cal>targets.cal?C.alarm:C.go,fontWeight:600}}>{nutTotals.cal}</span>
          <span style={{color:C.dim}}>/{targets.cal} cal</span>
          <span style={{color:C.dim}}>  ·  P </span><span style={{color:nutTotals.pro<targets.pro-10?C.alarm:C.go}}>{nutTotals.pro}</span>
          <span style={{color:C.dim}}>  C </span>{nutTotals.carb}<span style={{color:C.dim}}>  F </span>{nutTotals.fat}
        </div>
        <div className="grid4">
          <input className="in sm" type="number" inputMode="numeric" placeholder="cal" value={nCal} onChange={e=>setNCal(e.target.value)} style={{flex:1.6}}/>
          <input className="in sm" type="number" inputMode="numeric" placeholder="P" value={nPro} onChange={e=>setNPro(e.target.value)} style={{flex:1}}/>
          <input className="in sm" type="number" inputMode="numeric" placeholder="C" value={nCarb} onChange={e=>setNCarb(e.target.value)} style={{flex:1}}/>
          <input className="in sm" type="number" inputMode="numeric" placeholder="F" value={nFat} onChange={e=>setNFat(e.target.value)} style={{flex:1}}/>
        </div>
        <div style={{display:"flex",gap:6}}>
          <input className="in sm" type="text" placeholder="note" value={nNote} onChange={e=>setNNote(e.target.value)} style={{flex:1}}/>
          <button className="btn btn-amber" style={{width:52,height:40,fontSize:18,borderRadius:9}} onClick={addNut}>+</button>
        </div>
        {dayNut.length>0&&<div style={{marginTop:8}}>
          {dayNut.slice().reverse().map((e,i)=><div key={i} className="entry">
            <span>{e.cal} cal · P{e.pro} C{e.carb} F{e.fat} {e.note&&<span style={{color:C.dim}}> — {e.note}</span>}</span>
            <button className="x" onClick={()=>delNut(e.time)}>✕</button>
          </div>)}
        </div>}
      </div>

      <div className="eyebrow"><span style={{color:C.amber}}>Body</span></div>
      <div className="card">
        <div className="grid3">
          <input className="in sm" type="number" inputMode="decimal" placeholder="weight lb" value={bW} onChange={e=>setBW(e.target.value)} style={{flex:1}}/>
          <input className="in sm" type="number" inputMode="decimal" placeholder={'waist"'} value={bWa} onChange={e=>setBWa(e.target.value)} style={{flex:1}}/>
          <input className="in sm" type="number" inputMode="decimal" placeholder={'navel"'} value={bNa} onChange={e=>setBNa(e.target.value)} style={{flex:1}}/>
        </div>
        <button className="btn btn-go" style={{width:"100%",height:44,fontSize:13}} onClick={addBody}>Log measurements</button>
        {bodyData.length>0&&<div style={{marginTop:8}}>
          {bodyData.slice(-5).reverse().map((e,i)=><div key={i} className="entry">
            <span>{e.date} · {e.weight&&`${e.weight}lb `}{e.waist&&`W${e.waist} `}{e.navel&&`N${e.navel} `}</span>
            <button className="x" onClick={()=>delBody(e.time||e.date)}>✕</button>
          </div>)}
        </div>}
      </div>

      <div className="eyebrow"><span style={{color:C.amber}}>Cardio</span></div>
      <div className="card">
        <div style={{display:"flex",gap:6,alignItems:"center",marginBottom:8}}>
          <span style={{fontFamily:mono,fontSize:11,color:C.dim,flexShrink:0}}>PROFILE</span>
          <input className="in sm" type="number" inputMode="numeric" placeholder="age" value={profile.age||""} onChange={e=>setProf("age",e.target.value)} style={{width:56,flexShrink:0}}/>
          <button className={`daytype${profile.sex==="male"?" on":""}`} style={{flex:0,padding:"0 14px",height:36}} onClick={()=>setProf("sex","male")}>M</button>
          <button className={`daytype${profile.sex==="female"?" on":""}`} style={{flex:0,padding:"0 14px",height:36}} onClick={()=>setProf("sex","female")}>F</button>
          {latestBW>0&&<span style={{fontFamily:mono,fontSize:11,color:C.steel,marginLeft:"auto"}}>{latestBW}lb</span>}
        </div>
        <div style={{display:"flex",gap:6,alignItems:"center",marginBottom:6}}>
          <span style={{fontFamily:mono,fontSize:11,color:C.dim,flexShrink:0}}>DATE</span>
          <DatePicker value={cDate} max={today} onChange={d=>setCDate(d)} style={{flex:1}}/>
          <Dropdown value={cType} onChange={setCType} options={[{v:"steady",l:"Steady"},{v:"hiit",l:"HIIT"},{v:"rowing",l:"Rowing"}]} style={{width:104,flexShrink:0}}/>
        </div>
        <div style={{display:"flex",gap:5,alignItems:"center",marginBottom:6}}>
          <span style={{fontFamily:mono,fontSize:10,color:C.dim,flexShrink:0}}>time</span>
          <input className="in sm" type="number" inputMode="numeric" placeholder="h" value={cH} onChange={e=>setCH(e.target.value)} style={{flex:1,minWidth:0}}/>
          <span style={{color:C.dim,fontFamily:mono}}>:</span>
          <input className="in sm" type="number" inputMode="numeric" placeholder="m" value={cM} onChange={e=>setCM(e.target.value)} style={{flex:1,minWidth:0}}/>
          <span style={{color:C.dim,fontFamily:mono}}>:</span>
          <input className="in sm" type="number" inputMode="numeric" placeholder="s" value={cS} onChange={e=>setCS(e.target.value)} style={{flex:1,minWidth:0}}/>
        </div>
        <div style={{display:"flex",gap:6,marginBottom:6}}>
          <input className="in sm" type="number" inputMode="numeric" placeholder="avg HR" value={cHR} onChange={e=>setCHR(e.target.value)} style={{flex:1,minWidth:0}}/>
          <input className="in sm" type="number" inputMode="decimal" placeholder="distance (m)" value={cDist} onChange={e=>setCDist(e.target.value)} style={{flex:1,minWidth:0}}/>
        </div>
        <div style={{display:"flex",gap:5,alignItems:"center",marginBottom:6}}>
          <span style={{fontFamily:mono,fontSize:10,color:C.dim,flexShrink:0}}>min in Z</span>
          {[0,1,2,3,4].map(i=><input key={i} className="in sm" type="number" inputMode="numeric" placeholder={`Z${i+1}`} value={cZones[i]} onChange={e=>setCZones(z=>z.map((v,j)=>j===i?e.target.value:v))} style={{flex:1,minWidth:0,textAlign:"center"}}/>)}
        </div>
        {cType==="hiit"&&<input className="in sm" type="text" placeholder="config · 4x4min @175bpm" value={cConf} onChange={e=>setCConf(e.target.value)} style={{width:"100%",marginBottom:6}}/>}
        {(()=>{const durMin=(+cH||0)*60+(+cM||0)+(+cS||0)/60;if(!(durMin>0&&(cHR||cZones.some(z=>+z>0))))return null;const byZone=cZones.some(z=>+z>0);const b=cardioBurn({avgHR:cHR,duration:durMin,type:cType,zones:cZones.map(z=>+z||0)},latestBW,profile.age,profile.sex);
          return<div style={{fontFamily:mono,fontSize:12,color:b?C.go:C.dim,marginBottom:6}}>{b?`~${b} cal${byZone?" · by zone":""}${cType==="hiit"?" · incl EPOC":""}`:"log body weight for burn estimate"}</div>;})()}
        <button className="btn btn-go" style={{width:"100%",height:44,fontSize:13}} onClick={addCardio}>Log cardio</button>
        {cardioData.length>0&&<div style={{marginTop:8}}>
          {cardioData.slice(-5).reverse().map((e,i)=><div key={i} className="entry">
            <span>{e.date} · {e.type} {fmtDur(e.duration)} {e.avgHR&&`· HR ${e.avgHR}`}{(()=>{const b=e.burn!=null?e.burn:cardioBurn(e,latestBW,profile.age,profile.sex);return b?` · ~${b} cal`:"";})()}{cardioExtra(e)} {e.config&&<span style={{color:C.dim}}>({e.config})</span>}</span>
            <button className="x" onClick={()=>delCardio(e.time||e.date)}>✕</button>
          </div>)}
        </div>}
      </div>

      <button className="btn-ghost red" style={{width:"100%",height:44,marginTop:18,borderRadius:9,fontFamily:disp,fontWeight:700,letterSpacing:2,fontSize:12,textTransform:"uppercase"}} onClick={()=>setConfirmClear(true)}>Clear all data</button>
      <ConfirmModal open={confirmClear} title="Clear all data?" msg="This permanently deletes all logged workouts, cardio, body data, and settings. It cannot be undone." confirmLabel="Delete all" danger onConfirm={clearAllData} onCancel={()=>setConfirmClear(false)}/>
    </>}

    {/* ════ TRENDS ════ */}
    {view==="trends"&&<>
      <div className="eyebrow"><span style={{color:C.amber}}>Session history</span></div>
      {(()=>{const hist=sessHist.slice(-10).reverse();
        if(!hist.length)return<div className="empty">No sessions yet</div>;
        const durations=hist.filter(h=>h.durationMin).map(h=>h.durationMin);
        const avg=durations.length?Math.round(durations.reduce((a,b)=>a+b,0)/durations.length):0;
        return<div className="card">
          {avg>0&&<div className="sub" style={{marginBottom:6,marginTop:0}}>Avg {avg} min · {hist.filter(h=>h.mode==="full").length} full · {hist.filter(h=>h.mode==="quick").length} quick</div>}
          {hist.map((h,i)=>editDur===h.date?
            <div key={i} className="entry" style={{gap:6}}>
              <input className="in sm" type="number" inputMode="numeric" placeholder="min" value={editDurVal} onChange={e=>setEditDurVal(e.target.value)} style={{flex:1}} autoFocus/>
              <button className="x" onClick={saveDur} style={{color:C.go,borderColor:C.go,fontFamily:mono,fontSize:11}}>save</button>
              <button className="x" onClick={()=>{setEditDur(null);setEditDurVal("");}} style={{fontFamily:mono,fontSize:11}}>cancel</button>
            </div>
            :<div key={i} className="entry">
            <span>{new Date(h.date).toLocaleDateString("en-US",{month:"short",day:"numeric"})} · {h.mode==="quick"?"Quick":"Full"} {h.durationMin?`· ${h.durationMin}min`:""} · {Object.values(h.anchors||{}).filter(a=>a.sets?.some(s=>s.reps)).length} anchors</span>
            <button className="x" onClick={()=>{setEditDur(h.date);setEditDurVal(String(h.durationMin||""));}} style={{fontFamily:mono,fontSize:11}}>edit</button>
            <button className="x" onClick={()=>delHistEntry(h.date)}>✕</button>
          </div>)}
        </div>;
      })()}

      <div className="eyebrow"><span style={{color:C.amber}}>Insights</span></div>
      {bodyVerdict?<div className="card"><div style={{fontFamily:mono,fontSize:11,color:C.dim,marginBottom:4}}>BODY COMPOSITION</div><div style={{color:bodyVerdict.tone,fontSize:14,lineHeight:1.4}}>{bodyVerdict.text}</div></div>:<div className="empty">Log measurements over time to read composition</div>}
      {(()=>{const cards=[
          {k:"Balance \u2194 strength",a:weeklyAgg.balance,b:weeklyAgg.strength,pos:"surplus weeks track higher strength",neg:"deficit weeks track lower strength"},
          {k:"Cardio kcal \u2194 weight",a:weeklyAgg.cardioKcal,b:weeklyAgg.weight,pos:"more cardio tracks higher weight",neg:"more cardio tracks lower weight"},
          {k:"Balance \u2194 weight",a:weeklyAgg.balance,b:weeklyAgg.weight,pos:"surplus tracks weight gain",neg:"deficit tracks weight loss"}];
        return cards.map((c,i)=>{const pairs=align(c.a,c.b);const n=pairs.length;const r=pearson(pairs);const cf=confOf(n);
          return<div key={i} className="card">
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
              <span style={{fontFamily:mono,fontSize:11,color:C.dim}}>{c.k.toUpperCase()}</span>
              <span style={{fontFamily:mono,fontSize:10,color:cf.c,border:`1px solid ${cf.c}`,borderRadius:3,padding:"1px 6px"}}>{cf.t}</span>
            </div>
            {n<4||r==null?<div style={{color:C.steel,fontSize:13}}>Building · needs ≥4 aligned weeks (have {n})</div>:
              <div style={{fontSize:14,color:C.bone}}>r = <b style={{color:Math.abs(r)>=0.5?C.amber:C.steel}}>{r.toFixed(2)}</b> · {Math.abs(r)<0.25?"no clear link":(r>0?c.pos:c.neg)} <span style={{color:C.dim}}>(n={n})</span></div>}
          </div>;});})()}

      <div className="eyebrow"><span style={{color:C.arc}}>Strength index</span></div>
      {(()=>{const wkRatios={};
        activeSlots.forEach(p=>{const nm=anchors[p.id];if(!nm)return;const h=anchorLog[nm];if(!h||!h.length)return;
          const ex=EXERCISES.find(x=>x.name===nm);const bw=!!ex?.bw;
          const val=e=>{if(bw){const ss=e.sets.filter(s=>s.reps);return ss.length?ss.reduce((a,s)=>a+(+s.reps),0)/ss.length:0;}const b=e.sets.filter(s=>s.weight&&s.reps).sort((a,b)=>(b.weight*b.reps)-(a.weight*a.reps))[0];return b?b.weight*(1+b.reps/30):0;};
          const base=val(h[0]);if(!base)return;
          h.forEach(e=>{const v=val(e);if(!v)return;const w=weekStart(e.date);(wkRatios[w]=wkRatios[w]||[]).push(v/base);});});
        const weeks=Object.keys(wkRatios).sort().slice(-10);
        if(!weeks.length)return<div className="empty">No anchor data yet</div>;
        const idx=weeks.map(w=>Math.round(wkRatios[w].reduce((a,b)=>a+b,0)/wkRatios[w].length*100));
        const mn=Math.min(...idx),mx=Math.max(...idx),rng=(mx-mn)||1;
        const last=idx[idx.length-1],delta=idx.length>=2?last-idx[0]:0;
        return<div className="card plate">
          <div className="sub" style={{marginTop:0,marginBottom:6}}>Avg across anchors vs baseline · 100 = start</div>
          <div className="bars">{idx.map((v,i)=><div key={i} className="bar" style={{height:`${Math.max(((v-mn)/rng)*100,8)}%`,background:i===idx.length-1?C.arc:`${C.arc}55`}}/>)}</div>
          <div className="stat"><span><b style={{color:C.bone}}>{last}</b>{idx.length>=2&&<span style={{color:delta>=0?C.go:C.alarm}}> ({delta>0?"+":""}{delta})</span>} · {weeks.length} wks</span></div>
        </div>;})()}

      <div className="eyebrow"><span style={{color:C.arc}}>Anchor progression</span></div>
      {activeSlots.map(p=>{
        const nm=anchors[p.id];if(!nm)return null;const h=anchorLog[nm];
        if(!h||!h.length)return<div key={p.id} className="sub" style={{marginBottom:6}}>{p.label} · {nm} — no data yet</div>;
        const ents=h.slice(-10);
        const exMeta=EXERCISES.find(x=>x.name===nm);const isBw=!!exMeta?.bw,isHold=!!exMeta?.hold;
        const unit=isBw?(isHold?"s":"r"):"lb";
        const vals=ents.map(e=>{
          if(isBw){const ss=e.sets.filter(s=>s.reps);if(!ss.length)return 0;return Math.round(ss.reduce((a,s)=>a+(+s.reps),0)/ss.length);}
          const b=e.sets.filter(s=>s.weight&&s.reps).sort((a,b)=>(b.weight*b.reps)-(a.weight*a.reps))[0];
          return b?Math.round(b.weight*(1+b.reps/30)):0;}).filter(Boolean);
        if(!vals.length)return<div key={p.id} className="sub" style={{marginBottom:6}}>{p.label} · {nm} — no data yet</div>;
        const maxE=Math.max(...vals,1);
        const delta=vals.length>=2?vals[vals.length-1]-vals[0]:0;
        const label=isBw?(isHold?"avg hold":"avg reps"):"e1RM";
        return(<div key={p.id} className="card plate">
          <div className="pat-eyebrow">{p.label}</div>
          <div className="ex-name" style={{fontSize:17}}>{nm}</div>
          <div className="bars">
            {vals.map((v,i)=><div key={i} className="bar" style={{height:`${Math.max((v/maxE)*100,8)}%`,background:i===vals.length-1?C.arc:`${C.arc}55`}}/>)}
          </div>
          <div className="stat">
            <span>{label} <b style={{color:C.bone}}>{vals[vals.length-1]||"--"}{unit}</b>{vals.length>=2&&<span style={{color:delta>=0?C.go:C.alarm}}> ({delta>0?"+":""}{delta})</span>} · {h.length} sessions</span>
            <button className="btn-ghost red" style={{fontSize:9,padding:"3px 8px"}}
              onClick={()=>{const newLog={...anchorLog};if(newLog[nm]&&newLog[nm].length>0){newLog[nm]=newLog[nm].slice(0,-1);setAnchorLog(newLog);sv(SK.anchorLog,newLog);}}}>del last</button>
          </div>
        </div>);
      })}

      <div className="eyebrow"><span style={{color:C.arc}}>Weekly tonnage</span></div>
      {(()=>{const bwAt=date=>{const wd=bodyData.filter(e=>e.weight);if(!wd.length)return 0;let best=wd[0];for(const e of wd){if(e.date<=date)best=e;else break;}return +best.weight||0;};
        const tByWeek={};
        activeSlots.forEach(p=>{const nm=anchors[p.id];if(!nm)return;const h=anchorLog[nm];if(!h)return;const ex=EXERCISES.find(x=>x.name===nm);const isBw=!!ex?.bw;
          h.forEach(e=>{const w=weekStart(e.date);const bodyW=isBw?bwAt(e.date):0;let ton=0;e.sets.forEach(s=>{const reps=+s.reps||0;const wt=(+s.weight||0)+bodyW;ton+=reps*wt;});if(ton>0)tByWeek[w]=(tByWeek[w]||0)+ton;});});
        const weeks=Object.keys(tByWeek).sort().slice(-8);if(!weeks.length)return<div className="empty">No anchor data yet</div>;
        const tons=weeks.map(w=>Math.round(tByWeek[w]));const tmax=Math.max(...tons,1);
        return<div className="card">
          <div className="sub" style={{marginTop:0,marginBottom:6}}>Anchor volume load · {(tons[tons.length-1]/1000).toFixed(1)}k lb this wk</div>
          <div className="bars">{tons.map((v,i)=><div key={i} className="bar" style={{height:`${Math.max((v/tmax)*100,8)}%`,background:i===tons.length-1?C.arc:`${C.arc}55`}}/>)}</div>
        </div>;})()}

      <VolDash weekVol={weekVol} avgVol={avgVol} trend={loadTrend}/>

      <div className="eyebrow"><span style={{color:C.amber}}>Training volume</span></div>
      {(()=>{const wk={};
        Object.entries(anchorLog).forEach(([nm,h])=>{const ex=EXERCISES.find(x=>x.name===nm);const bw=!!ex?.bw;
          (h||[]).forEach(e=>{const w=weekStart(e.date);e.sets.forEach(s=>{if(!s.reps)return;const load=bw?((+s.weight||0)+(latestBW||0)):(+s.weight||0);if(load>0)wk[w]=(wk[w]||0)+load*(+s.reps);});});});
        (accLog||[]).forEach(entry=>{const w=weekStart(entry.date);(entry.exercises||[]).forEach(ax=>{const ex=EXERCISES.find(x=>x.name===ax.name);const bw=!!ex?.bw;
          (ax.sets||[]).forEach(s=>{if(!s.reps)return;const load=bw?((+s.weight||0)+(latestBW||0)):(+s.weight||0);if(load>0)wk[w]=(wk[w]||0)+load*(+s.reps);});});});
        const weeks=Object.keys(wk).sort().slice(-8);if(!weeks.length)return<div className="empty">No volume yet</div>;
        const tons=weeks.map(w=>Math.round(wk[w]));const mx=Math.max(...tons,1);
        return<div className="card">
          <div className="sub" style={{marginTop:0,marginBottom:6}}>Weekly tonnage · lb x reps · {tons[tons.length-1].toLocaleString()} this wk</div>
          <div className="bars">{tons.map((v,i)=><div key={i} className="bar" style={{height:`${Math.max((v/mx)*100,8)}%`,background:i===tons.length-1?C.go:`${C.go}55`}}/>)}</div>
        </div>;})()}

      <div className="eyebrow"><span style={{color:C.amber}}>Body</span></div>
      {bodyData.length===0?<div className="empty">No measurements yet</div>:
        <div className="card">
          {bodyData.slice(-10).reverse().map((e,i)=><div key={i} className="entry">
            <span>{e.date} · {e.weight&&`${e.weight}lb `}{e.waist&&`W${e.waist} `}{e.navel&&`N${e.navel} `}</span>
          </div>)}
        </div>}
      {(()=>{const wd=bodyData.filter(e=>e.weight).map(e=>({date:e.date,w:+e.weight}));
        if(wd.length<2)return null;
        const perWk=bodyTrend(bodyData,"weight")??0;
        const ws=wd.slice(-12);const mn=Math.min(...ws.map(e=>e.w)),mx=Math.max(...ws.map(e=>e.w));const rng=mx-mn||1;
        return<div className="card plate">
          <div className="pat-eyebrow">Weight trend</div>
          <div className="bars">
            {ws.map((e,i)=><div key={i} className="bar" style={{height:`${Math.max(((e.w-mn)/rng)*100,8)}%`,background:i===ws.length-1?C.amber:`${C.amber}55`}}/>)}
          </div>
          <div className="stat"><span><b style={{color:C.bone}}>{wd[wd.length-1].w}lb</b> · <span style={{color:perWk<=0?C.go:C.alarm}}>{perWk>0?"+":""}{perWk.toFixed(2)} lb/wk</span> · {wd.length} weigh-ins</span></div>
        </div>;})()}
      {(()=>{const fields=[["waist","Waist",true],["navel","Navel",true]];
        const rows=fields.map(([k,label,downGood])=>{const perWk=bodyTrend(bodyData,k);if(perWk==null)return null;const good=downGood?perWk<=0:perWk>=0;return{label,perWk,good};}).filter(Boolean);
        if(!rows.length)return null;
        return<div className="delta-box"><div style={{fontFamily:mono,fontSize:11,color:C.dim,marginBottom:4}}>SLOPE /wk</div>{rows.map((r,i)=><div key={i}>{r.label} <span style={{color:r.good?C.go:C.alarm}}>{r.perWk>0?"+":""}{r.perWk.toFixed(2)}"</span></div>)}</div>;})()}

      <div className="eyebrow"><span style={{color:C.amber}}>Cardio</span></div>
      {cardioData.length===0?<div className="empty">No cardio yet</div>:
        <div className="card">
          {cardioData.slice(-10).reverse().map((e,i)=><div key={i} className="entry">
            <span>{e.date} · {e.type} {fmtDur(e.duration)} {e.avgHR&&`· HR ${e.avgHR}`}{(()=>{const b=e.burn!=null?e.burn:cardioBurn(e,latestBW,profile.age,profile.sex);return b?` · ~${b} cal`:"";})()}{cardioExtra(e)} {e.config&&<span style={{color:C.dim}}>({e.config})</span>}</span>
          </div>)}
        </div>}

      <div className="eyebrow"><span style={{color:C.amber}}>Calorie balance</span></div>
      {(()=>{const byDay={};nutrition.forEach(e=>{byDay[e.date]=(byDay[e.date]||0)+(+e.cal||0);});
        const days=Object.keys(byDay);if(!days.length)return<div className="empty">No nutrition logged</div>;
        const wk={};days.forEach(date=>{const dw=new Date(date+"T00:00:00").getDay();const tgt=(dayTargets[dw])?.cal||0;const w=weekStart(date);wk[w]=(wk[w]||0)+(byDay[date]-tgt);});
        const weeks=Object.keys(wk).sort().slice(-8);const bals=weeks.map(w=>Math.round(wk[w]));
        const amax=Math.max(...bals.map(Math.abs),1);const last=bals[bals.length-1];
        return<div className="card">
          <div className="sub" style={{marginTop:0,marginBottom:6}}>Weekly net vs target · {last<=0?"deficit":"surplus"} {last>0?"+":""}{last} cal this wk</div>
          <div className="bars">
            {bals.map((v,i)=><div key={i} className="bar" style={{height:`${Math.max((Math.abs(v)/amax)*100,8)}%`,background:v<=0?(i===bals.length-1?C.go:`${C.go}66`):(i===bals.length-1?C.alarm:`${C.alarm}66`)}}/>)}
          </div>
        </div>;})()}

      <div className="eyebrow"><span style={{color:C.amber}}>Cardio load</span></div>
      {(()=>{if(!cardioData.length)return<div className="empty">No cardio yet</div>;
        const wk={};cardioData.forEach(e=>{const b=e.burn!=null?e.burn:cardioBurn(e,latestBW,profile.age,profile.sex);if(b){const w=weekStart(e.date);wk[w]=(wk[w]||0)+b;}});
        const weeks=Object.keys(wk).sort().slice(-8);const kcals=weeks.map(w=>wk[w]);
        const hrEnts=cardioData.filter(e=>e.avgHR).slice(-12);const kmax=Math.max(...kcals,1);
        return<div className="card">
          {kcals.length>0&&<><div className="sub" style={{marginTop:0,marginBottom:6}}>Weekly cardio kcal · {kcals[kcals.length-1]} this wk</div>
          <div className="bars">{kcals.map((v,i)=><div key={i} className="bar" style={{height:`${Math.max((v/kmax)*100,8)}%`,background:i===kcals.length-1?C.arc:`${C.arc}55`}}/>)}</div></>}
          {hrEnts.length>=2&&(()=>{const mn=Math.min(...hrEnts.map(e=>+e.avgHR)),mx=Math.max(...hrEnts.map(e=>+e.avgHR));const rng=mx-mn||1;
            return<><div className="sub" style={{marginBottom:6}}>Avg HR trend (last {hrEnts.length})</div>
            <div className="bars">{hrEnts.map((e,i)=><div key={i} className="bar" style={{height:`${Math.max(((+e.avgHR-mn)/rng)*100,8)}%`,background:i===hrEnts.length-1?C.warn:`${C.warn}55`}}/>)}</div></>;})()}
        </div>;})()}

      <div className="eyebrow"><span style={{color:C.go}}>MET-hours / week</span></div>
      {(()=>{
        const kg=latestBW*0.4536;
        const cardioW={},resistW={};
        cardioData.forEach(e=>{const mh=(e.burn!=null&&kg>0)?e.burn/kg:(CARDIO_MET[e.type]||6)*((+e.duration||0)/60);
          if(mh>0){const w=weekStart(e.date);cardioW[w]=(cardioW[w]||0)+mh;}});
        sessHist.forEach(h=>{if(!h.durationMin)return;const w=weekStart(h.date);resistW[w]=(resistW[w]||0)+RESIST_MET*(h.durationMin/60);});
        const weeks=[...new Set([...Object.keys(cardioW),...Object.keys(resistW)])].sort().slice(-8);
        if(!weeks.length)return<div className="empty">Log cardio or a session to see MET-hours</div>;
        const rows=weeks.map(w=>({c:cardioW[w]||0,r:resistW[w]||0,t:(cardioW[w]||0)+(resistW[w]||0)}));
        const cur=rows[rows.length-1];
        const mx=Math.max(...rows.map(x=>x.t),metGoal,1);
        const pct=metGoal>0?Math.round((cur.t/metGoal)*100):0;
        const col=metGoal>0&&cur.t>=metGoal?C.go:cur.t>=metGoal*0.7?C.amber:C.dim;
        return<div className="card">
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
            <div style={{fontFamily:mono,fontSize:14,color:col}}>{cur.t.toFixed(1)} / {metGoal} <span style={{color:C.dim,fontSize:12}}>MET-hr · {pct}%</span></div>
            <div style={{display:"flex",alignItems:"center",gap:5}}>
              <span style={{fontFamily:mono,fontSize:11,color:C.dim}}>goal</span>
              <input className="in sm" type="number" inputMode="numeric" value={metGoal} onChange={e=>{const v=+e.target.value||0;setMetGoal(v);sv(SK.metgoal,v);}} style={{width:54}}/>
            </div>
          </div>
          <div className="sub" style={{marginBottom:6}}><span style={{color:C.arc}}>■</span> Cardio {cur.c.toFixed(1)} · <span style={{color:C.amber}}>■</span> Lifting {cur.r.toFixed(1)}</div>
          <div className="bars" style={{position:"relative"}}>
            {rows.map((x,i)=><div key={i} style={{flex:1,display:"flex",flexDirection:"column",justifyContent:"flex-end",height:"100%"}}>
              <div style={{height:`${Math.max((x.t/mx)*100,4)}%`,display:"flex",flexDirection:"column",borderRadius:"2px 2px 0 0",overflow:"hidden"}}>
                <div style={{flex:x.c,background:i===rows.length-1?C.arc:`${C.arc}55`}}/>
                <div style={{flex:x.r,background:i===rows.length-1?C.amber:`${C.amber}55`}}/>
              </div>
            </div>)}
            {metGoal>0&&<div style={{position:"absolute",left:0,right:0,bottom:`${Math.min((metGoal/mx)*100,100)}%`,borderTop:`1px dashed ${C.go}`,pointerEvents:"none"}}/>}
          </div>
          <div className="sub" style={{marginTop:4,color:C.dim,fontSize:11}}>dashed line = goal · last {rows.length} wk</div>
        </div>;})()}
      <div style={{marginTop:20,marginBottom:6}}>
        <button onClick={()=>setAdvOpen(o=>!o)} className="btn-ghost" style={{fontFamily:mono,fontSize:11,color:C.dim,letterSpacing:1}}>⚙ ADVANCED {advOpen?"▲":"▼"}</button>
        {advOpen&&<div className="card" style={{padding:12,marginTop:8}}>
          <div style={{fontFamily:mono,fontSize:10,color:C.dim,marginBottom:7,lineHeight:1.5}}>VOLUME AVERAGE · weeks of completed history averaged for the bar. Shorter tracks a new routine sooner; longer is steadier.</div>
          <div className="pillwrap">
            {[2,3,4].map(n=><button key={n} className={`pill${paceLookback===n?" on":""}`} onClick={()=>{setPaceLookback(n);sv(SK.pacelookback,n);}}>{n} wk</button>)}
          </div>
        </div>}
      </div>
    </>}
    </div>
  </div>);
}
