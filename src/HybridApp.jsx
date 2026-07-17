import{useState,useEffect,useCallback,useMemo,useRef,Component}from"react";
import{MUSCLES,EXERCISES}from"./exercises.js";

// ── STORAGE ──
const ld=(k,fb)=>{try{const v=localStorage.getItem(k);return v?JSON.parse(v):fb}catch{return fb}};
const sv=(k,d)=>{try{localStorage.setItem(k,JSON.stringify(d))}catch(e){console.error(e)}};
const SK={anchors:"wg2-anchors",anchorLog:"wg2-anchor-log",accLog:"wg2-acc-log",fatigue:"wg2-fatigue",
  banned:"wg2-banned",prefs:"wg2-prefs",nutrition:"wg2-nutrition",body:"wg2-body",cardio:"wg2-cardio",
  daytargets:"wg2-daytargets",
  profile:"wg2-profile",
  meso:"wg2-meso",history:"wg2-history",metgoal:"wg2-metgoal",eccentrix:"wg2-eccentrix",power:"wg2-power",anchorcfg:"wg2-anchorcfg",pacelookback:"wg2-pacelookback",impl:"wg2-impl",kcoef:"wg2-kcoef",
  routines:"wg2-routines",theme:"wg2-theme",accent:"wg2-accent",homemode:"wg2-homemode",
  liftdays:"wg2-liftdays",cardiodays:"wg2-cardiodays"};

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

// ── LOAD MODEL ────────────────────────────────────────────────────────────────
// The weight you type is ALWAYS what's stamped on one implement — the dumbbell you
// picked up. Total load = that number x how many implements are moving.
//   DB RDL with the 90s   -> log 90, impl 2 -> 180 lb total
//   one 90 held two-handed -> log 90, impl 1 ->  90 lb total
// Prescriptions come back in the same units you type, so nothing needs converting
// in your head. impl is per exercise and overridable (the x1/x2 chip on the set row).
// Within one exercise every load scales together, so progression is unaffected; impl
// only matters where loads are compared ACROSS exercises (tonnage, seeding, e1RM).
const implOf=(name,overrides)=>{
  if(overrides&&overrides[name]!=null)return +overrides[name]||1;
  const ex=EXERCISES.find(x=>x.name===name);
  return (ex&&+ex.impl)||1;
};
// total lb a set actually moved (bodyweight lifts add your bodyweight)
const setLoad=(name,s,bodyWeight=0,overrides=null)=>{
  const ex=EXERCISES.find(x=>x.name===name)||{};
  const w=(+s.weight||0)*implOf(name,overrides);
  return ex.bw?((+bodyWeight||0)+w):w;
};

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
  const added=ls.map(s=>(+s.weight||0)*(+ex.impl||1));   // added weight, both hands if it's a pair
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
// ── PATTERN STRENGTH ─────────────────────────────────────────────────────────
// Progression is keyed on the exercise NAME, so swapping an anchor (bench ->
// incline DB) hands getProgression an empty log, it calls the lift brand new, and
// the pattern's e1RM restarts from nothing. You lose your place in that category.
//
// Strength belongs to the PATTERN, not the lift. Each pattern carries a level S in
// its reference lift's pounds; every exercise maps on with a coefficient k:
//     e1RM(lift) = k * S      =>      S = e1RM(lift) / k
// Swapping anchors changes the lens, not the level. k is measured from YOUR logs
// wherever two lifts overlap in time (accessories count), so this is mostly not a
// guess. Where nothing overlaps, we bridge: the level is continuous across a swap,
// so the first session on the new lift defines its own k.
const PAT_REF={hpress:"Barbell Bench Press",vpress:"Barbell Overhead Press",hpull:"Barbell Rows",
  vpull:"Pull-ups",squat:"Barbell Back Squat",hinge:"Conventional Deadlift"};
// seeds only — used when a lift has never overlapped the reference and there's no
// level to bridge from. Overwritten by measurement the moment there is any.
const SEED_K={"Barbell Bench Press":1,"Incline Barbell Bench Press":.85,"Close-grip Barbell Bench":.9,
  "Dumbbell Bench Press":.9,"Incline Dumbbell Press":.77,"Decline Dumbbell Press":.93,
  "Dumbbell Floor Press":.84,"Dips":1.05,"Push-ups":.62,"Diamond Push-ups":.55,
  "Barbell Overhead Press":1,"Barbell Push Press":1.2,"Dumbbell Arnold Press":.84,
  "Landmine Press":.55,"Single-arm Landmine Press":.35,"Pike Push-ups":.7,
  "Barbell Rows":1,"Pendlay Rows":.95,"Dumbbell Rows":.48,"Chest-supported Incline DB Rows":.84,
  "Meadow Rows":.55,"Inverted Rows":.65,
  "Pull-ups":1,"Chin-ups":1.05,"Wide-grip Pull-ups":.95,"Commando Pull-ups":.92,
  "Barbell Back Squat":1,"Barbell Front Squat":.82,"Belt Squat":.85,"Landmine Squat":.6,
  "Dumbbell Goblet Squat":.4,"Dumbbell Bulgarian Split Squat":.6,"Dumbbell Lunges":.6,
  "Dumbbell Step-ups":.6,"Pistol Squats":.45,
  "Conventional Deadlift":1,"Sumo Deadlift":1,"Barbell Romanian Deadlifts":.75,
  "Landmine Romanian Deadlift":.45,"Dumbbell Romanian Deadlifts":.8,
  "Single-leg DB Romanian Deadlift":.25,"Barbell Hip Thrusts":.9,"B-stance Hip Thrust":.6,
  "Barbell Good Mornings":.55,"Nordic Curls":.5};
const dayN=d=>Math.floor(new Date(d).getTime()/864e5);
// Epley w/ RIR, blended across sets, weighted toward the near-failure ones — the
// same estimator the progression already uses, just in TOTAL load so lifts compare.
function sessE1RM(name,sess,bw,implOv){
  const ls=(sess.sets||[]).filter(s=>+s.reps>0&&setLoad(name,s,bw,implOv)>0);
  if(!ls.length)return null;
  const rs=ls.filter(s=>s.rir!=null&&s.rir!=="");
  if(rs.length){let num=0,den=0;
    rs.forEach(s=>{const L=setLoad(name,s,bw,implOv),rir=+s.rir,rel=1/(1+rir);
      num+=L*(1+((+s.reps)+rir)/30)*rel;den+=rel;});
    return num/den;}
  const t=ls.reduce((a,b)=>setLoad(name,b,bw,implOv)>setLoad(name,a,bw,implOv)?b:a);
  return setLoad(name,t,bw,implOv)*(1+(+t.reps)/30);
}
// every e1RM datapoint we have for a pattern, anchors AND accessories, in time order
function patObs(pid,anchorLog,accProg,bw,implOv){
  const out=[];
  (PATTERN_MAP[pid]||[]).forEach(nm=>{
    [[anchorLog[nm],"anchor"],[accProg[nm],"acc"]].forEach(([hist,src])=>{
      (hist||[]).forEach(sess=>{const e=sessE1RM(nm,sess,bw,implOv);
        if(e)out.push({d:dayN(sess.date),nm,e,src});});
    });
  });
  return out.sort((a,b)=>a.d-b.d);
}
// k measured from your own logs — only where the two lifts genuinely overlapped in
// time. The reference is interpolated, never extrapolated: comparing a new lift to a
// stale reference would fold weeks of progress into the ratio, which isn't a
// measurement, it's a swap — and swaps are the bridge's job.
function measuredK(obs,ref){
  const rp=obs.filter(o=>o.nm===ref).sort((a,b)=>a.d-b.d);
  if(rp.length<2)return {};
  const at=d=>{if(d<rp[0].d||d>rp[rp.length-1].d)return null;
    let p=null,n=null;rp.forEach(r=>{if(r.d<=d)p=r;if(r.d>=d&&!n)n=r;});
    if(!p||!n)return null;if(p.d===n.d)return p.e;
    return p.e+(n.e-p.e)*((d-p.d)/(n.d-p.d));};
  const by={};
  obs.filter(o=>o.nm!==ref).forEach(o=>{const r=at(o.d);
    if(r>0)(by[o.nm]=by[o.nm]||[]).push(o.e/r);});
  const out={};
  Object.entries(by).forEach(([nm,rs])=>{rs.sort((a,b)=>a-b);
    out[nm]={k:rs[Math.floor(rs.length/2)],src:"measured",n:rs.length};});
  return out;
}
// current level of every pattern + the k that gets you there
function patternState(anchorLog,accProg,bw,implOv,kOv){
  const st={};
  PATTERNS.forEach(p=>{
    const ref=PAT_REF[p.id],obs=patObs(p.id,anchorLog,accProg,bw,implOv);
    const K={[ref]:{k:1,src:"reference"},...measuredK(obs,ref),
      ...Object.fromEntries(Object.entries(kOv||{}).filter(([nm])=>(PATTERN_MAP[p.id]||[]).includes(nm))
        .map(([nm,k])=>[nm,{k:+k,src:"manual"}]))};
    let lvl=null,last=null;
    obs.forEach(o=>{
      if(!K[o.nm]){
        // never seen, nothing measured: bridge off the level we're already at
        if(lvl>0&&last!=null&&(o.d-last)<=90)K[o.nm]={k:o.e/lvl,src:"bridged"};
        else K[o.nm]={k:SEED_K[o.nm]||1,src:"seed"};
      }
      lvl=o.e/(K[o.nm].k||1);last=o.d;
    });
    st[p.id]={level:lvl,K,ref,n:obs.length,last};
  });
  return st;
}

function getProgression(name,log,repRange=[6,10],targetRIR=2,bodyWeight=0,powerMode=false,eccOn=false){
  const h=log[name];
  const exDef=EXERCISES.find(x=>x.name===name);
  if(powerMode&&!(exDef&&exDef.bw))return powerProg(name,log);   // loaded power routes first (handles first session internally)
  if(!h||!h.length)return{weight:"",reps:repRange[0],sets:3,note:`First session. Find weight for ${repRange[0]} reps @ RIR ${targetRIR}.`,isNew:true};
  const last=h[h.length-1];
  if(!last||!Array.isArray(last.sets))return{weight:"",reps:repRange[0],sets:3,note:`First session. Find weight for ${repRange[0]} reps @ RIR ${targetRIR}.`,isNew:true};
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
  // (a) load far too light (high RIR) → zero in on the load that actually challenges the
  // user, but SAFELY — converge over sessions, never one injury-risk leap. Two guardrails
  // (2026-07-17, per "high RIR should best challenge without chance of injury"):
  //   1. Clamp the RIR fed into the e1RM estimate. A logged RIR well above ~8 isn't a real
  //      reps-in-reserve (you can't have 20 left in the tank on a working set) — left raw it
  //      inflates the estimated 1RM and the target weight balloons dangerously.
  //   2. Cap the per-session load increase (~15%). If the true target is higher, it steps
  //      again next session once the user re-logs it as still easy — safe convergence.
  if(wRir!=null&&wRir>=targetRIR+3){
    const tr=Math.min(wReps,repRange[1]);                       // recalibrate into the range — never target reps above the ceiling
    const effRir=Math.min(wRir,8);                              // guardrail 1: cap the RIR used in the estimate
    const e=Math.round(top*(1+(wReps+effRir)/30));
    const cap=r5(top*1.15);                                     // guardrail 2: per-session load ceiling
    let nw=r5(e/(1+(tr+targetRIR)/30));
    const capped=nw>cap; if(capped)nw=cap;
    if(nw>top)return{weight:nw,reps:tr,sets:ls.length,note:`${wReps}r @ RIR ${wRir} — too light. Step to ${nw}lb for ${tr}r toward RIR ${targetRIR}${capped?" (safe step; keeps climbing if still easy)":""}.`,progressed:true,ramp};
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
// Set-credit model (2026-07-17 audit fix). MEV/MAV/MRV landmarks are defined by
// Israetel/RP in WHOLE working sets where the muscle is a real target — NOT weighted
// by fractional involvement. The old code did vol += hardSets*(involvement/100), which
// counted a bench as 0.55 of a chest set, systematically undercounting ~2x vs the
// landmarks (proven: a real 2-session week read chest 5.3 "below MEV" when the standard
// count was 11, at/above MEV). setCredit tiers involvement into direct/indirect/incidental,
// matching the dataset cross-check (target=primary, synergist=secondary, stabilizer=~none):
//   >=40% involvement -> 1.0 set (direct/primary target)
//   15-39%            -> 0.5 set (significant synergist)
//   <15%             -> 0   (stabilizer/incidental, not stimulating volume)
function setCredit(pct){ return pct>=40 ? 1 : pct>=15 ? 0.5 : 0; }
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
      [...ex.p,...ex.s].forEach(({m,p})=>{vol[m]+=hardSets*setCredit(p);});
    });
  });
  (accLog||[]).filter(e=>weekStart(e.date)===curWk).forEach(entry=>{
    entry.exercises?.forEach(ex=>{
      const ref=EXERCISES.find(x=>x.name===ex.name);if(!ref)return;
      const hardSets=(ex.sets||[]).filter(isHard).length;
      [...ref.p,...ref.s].forEach(({m,p})=>{vol[m]+=hardSets*setCredit(p);});
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
function muscleLoadTrend(anchorLog,accLog,todayStr,bwLoad=0,implOv=null){
  const curWk=weekStart(todayStr);
  const byWk={};MUSCLES.forEach(m=>byWk[m]={});
  const add=(dateStr,name,sets)=>{
    const ref=EXERCISES.find(x=>x.name===name);if(!ref)return;
    const wk=weekStart(dateStr);if(wk>=curWk)return;
    let ton=0;(sets||[]).forEach(s=>{if(s.reps&&s.weight)ton+=(+s.reps)*setLoad(name,s,bwLoad,implOv);});
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
function muscleSeedWeight(primaryMuscle,accProg,targetName=null,implOv=null){
  if(!primaryMuscle)return null;
  const weights=[];
  Object.entries(accProg).forEach(([nm,hist])=>{
    const ex=EXERCISES.find(x=>x.name===nm);if(!ex||ex.bw)return;
    if((ex.p[0]||{}).m!==primaryMuscle)return;
    const last=hist&&hist[hist.length-1];if(!last||!last.sets)return;
    // TOTAL load, or a pair of 40s would look lighter than a single 50
    const w=Math.max(...last.sets.map(s=>setLoad(nm,s,0,implOv)));
    if(w>0)weights.push(w);
  });
  if(!weights.length)return null;
  weights.sort((a,b)=>a-b);
  const totalMed=weights[Math.floor(weights.length/2)];
  // back into the target lift's own units — what you'd put in each hand
  const per=totalMed/(targetName?implOf(targetName,implOv):1);
  return Math.round(per/5)*5;
}

// Build one accessory object (prescription + seeded weight) for a given exercise.
// Shared by the auto-selector (genAcc) and manual search-add so both behave identically.
function buildAcc(ex,accProg,repRange,bwLoad,isDeload,locked=false,implOv=null){
  const sug=getProgression(ex.name,accProg,repRange,2,bwLoad);
  let sw=sug.weight||"";
  if(sw===""&&!ex.bw&&sug.isNew){const seed=muscleSeedWeight((ex.p[0]||{}).m,accProg,ex.name,implOv);if(seed)sw=seed;}
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
const SET_BASE=3, SET_CAP=5, SET_HARD_CAP=8;   // SET_HARD_CAP: max per-session sets when frequency-geared (low days/week)
// Whole-body recovery multiplier from weekly cardio days — cardio spends recovery, so
// more cardio days pulls the resistance set ceiling down proportionally (2026-07-16
// spec: cardio is a recovery-budget input; real logged-cardio/Work integration later).
function recoveryFactor(cardioDays){return Math.max(0.7,Math.min(1,1-0.07*(+cardioDays||0)));}
// Per-session set ceiling for an exercise.
// - Default (no opts): original behavior — ~half weekly MRV assuming ~2 sessions/wk,
//   capped at SET_CAP. Preserved so the live app and every existing caller are unchanged.
// - Frequency-geared (opts.liftDays given): gear the WHOLE-WEEK volume toward the primary
//   muscle's MAV (the productive "goldilocks" point, kept clear of MRV) and divide by how
//   many days you actually lift — so 2 days/wk earns a HIGHER per-session ceiling than the
//   old flat cap of 5 (that's why 3 sets felt below MEV). Still climbs one set at a time
//   via earnedSet; this only raises the ROOF it can climb toward. Cardio drains it.
function setCeiling(name,opts){
  const ex=EXERCISES.find(x=>x.name===name);
  const prim=ex&&ex.p&&[...ex.p].sort((a,b)=>b.p-a.p)[0];
  const lm=prim&&VOL_LANDMARKS[prim.m];
  if(!lm)return SET_CAP;
  if(opts&&opts.liftDays>0){
    const geared=(lm.mav/opts.liftDays)*recoveryFactor(opts.cardioDays);
    return Math.max(SET_BASE,Math.min(SET_HARD_CAP,Math.round(geared)));
  }
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
function setTarget(name,log,repRange,targetRIR,phase,opts){
  if(phase==="deload")return 2;
  const cur=lastSetCount(name,log)||SET_BASE;
  const ceil=setCeiling(name,opts);   // opts threads lift-days/cardio-days through when the caller provides them
  const t=(earnedSet(name,log,repRange,targetRIR)&&cur<ceil)?cur+1:cur;
  return Math.max(SET_BASE,Math.min(t,ceil));
}
function genAcc(n,banned,prefs,fatigue,weekVol,anchorLoad,recentNames=[],repRange=[10,15],exclude=[],isDeload=false,implOv=null){
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
    sel.push(buildAcc(pick.ex,accProg,repRange,bwLoad,isDeload,false,implOv));
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

function SetRow({set,i,onUp,onRm,showPain,isHold,showEcc,showPwr,win=POWER_WINDOW,impl=1,onImpl=null}){
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
    [...ref.p,...ref.s].forEach(({m,p})=>{byWk[wk][m]=(byWk[wk][m]||0)+hs*setCredit(p);});
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

// ── HYBRID-BUILD EXPORTS ──
// Added 2026-07-15, additive only (no line above this moved or changed) so the
// v5 hybrid UI (repos/workout-gen, hybrid-ui branch) can import the exact same
// calculation logic and storage layer this live app uses, instead of duplicating
// it — avoids any drift between what the two UIs compute from the same wg2- data.
export{SK,ld,sv,PATTERNS,PATTERN_MAP,ALL_PAT_EX,ACC_POOL,ACC_PER_CAT,implOf,setLoad,
  weekStart,slope,bodyTrend,cardioExtra,pearson,DOW3,keytelCpm,fmtDur,ZONE_MET,cardioBurn,
  RIR_PROGRESS,RESIST_MET,CARDIO_MET,POWER_WINDOW,POWER_REPS,POWER_PCT,POWER_INC,
  bwProgression,powerProg,getProgression,PAT_REF,SEED_K,dayN,sessE1RM,patObs,measuredK,patternState,
  calcWeeklyVolume,VOL_LANDMARKS,muscleLoadTrend,avgWeeklyVolume,getMesoState,
  anchorMuscleLoad,muscleSeedWeight,buildAcc,SET_BASE,SET_CAP,setCeiling,lastSetCount,earnedSet,setTarget,genAcc,
  QUICK_POOLS,genQuickSession,PAIN_C,RIR_C};

// ── MAIN ──
export class ErrorBoundary extends Component{
  constructor(p){super(p);this.state={err:null};}
  static getDerivedStateFromError(err){return{err:(err&&err.message)||String(err)||"Unknown error"};}
  componentDidCatch(err,info){console.error("App crashed:",err,info);}
  render(){
    if(this.state.err==null)return this.props.children;
    const doExport=()=>{try{const data={};for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(k&&k.startsWith("wg2-"))data[k]=localStorage.getItem(k);}
      const blob=new Blob([JSON.stringify({app:"workout-gen",version:1,exportedAt:new Date().toISOString(),data},null,2)],{type:"application/json"});
      const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download=`workout-gen-backup-${new Date().toISOString().slice(0,10)}.json`;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);}catch(e){console.error(e);}};
    const doReset=()=>{try{for(let i=localStorage.length-1;i>=0;i--){const k=localStorage.key(i);if(k&&k.startsWith("wg2-"))localStorage.removeItem(k);}}catch(e){}window.location.reload();};
    const btn={height:44,padding:"0 18px",borderRadius:9,background:"transparent",fontFamily:disp,fontWeight:700,letterSpacing:1.5,fontSize:11,textTransform:"uppercase",cursor:"pointer"};
    return(<div style={{minHeight:"100vh",background:C.ink,color:C.bone,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:28,fontFamily:mono,gap:14}}>
      <div style={{fontFamily:disp,fontWeight:700,fontSize:18,letterSpacing:1,color:C.alarm}}>Something broke</div>
      <div style={{fontSize:13,color:C.steel,textAlign:"center",lineHeight:1.5,maxWidth:430}}>The app hit an error loading your data — your data is still saved. Export a backup first, then reset to recover. Screenshot the error below so it can be fixed.</div>
      <div style={{fontSize:11,color:C.dim,textAlign:"center",wordBreak:"break-word",maxWidth:430,padding:"8px 12px",border:`1px solid ${C.line}`,borderRadius:8}}>{String(this.state.err)}</div>
      <div style={{display:"flex",gap:10,marginTop:6}}>
        <button onClick={doExport} style={{...btn,color:C.arc,border:`1px solid ${C.arc}`}}>Export backup</button>
        <button onClick={doReset} style={{...btn,color:C.alarm,border:`1px solid ${C.alarm}`}}>Reset app</button>
      </div>
    </div>);
  }
}

// ── HYBRID-UI SESSION TIMER CELLS (2026-07-16) ──
// Module-level (not inline in the session render) so their interval/countdown state
// survives re-renders instead of remounting every tick. Port the isometric-hold and
// ballistic-power timers the old SetRow had — features that were missing from the new
// session logger. Light-themed via the V/sans props the caller passes down.
// Self-contained session clock: ticks its OWN state every second so only this tiny
// component re-renders — the old approach re-rendered the whole App every second,
// which (because the screens were rendered as fresh component identities) remounted
// every input and dropped the mobile keyboard mid-typing. Fixed 2026-07-17.
function SessionClock({start,style}){
  const[,tick]=useState(0);
  useEffect(()=>{const t=setInterval(()=>tick(x=>x+1),1000);return()=>clearInterval(t);},[]);
  const min=start?(Date.now()-start)/60000:0;
  return<div style={style}>{fmtDur(min)}</div>;
}
function HoldTimerCell({value,onChange,V,sans}){
  const[running,setRunning]=useState(false);
  const[elapsed,setElapsed]=useState(0);
  useEffect(()=>{if(!running)return;const t0=Date.now()-elapsed*1000;const iv=setInterval(()=>setElapsed(Math.floor((Date.now()-t0)/1000)),250);return()=>clearInterval(iv);},[running]);
  const toggle=()=>{if(running){setRunning(false);onChange(String(elapsed));}else{setElapsed(+value||0);setRunning(true);}};
  return(<div onClick={toggle} style={{display:"flex",alignItems:"center",justifyContent:"center",gap:6,cursor:"pointer",border:`1px solid ${running?V.accent:V.border}`,borderRadius:10,padding:"7px 0",background:running?V.field:"transparent"}}>
    <span style={{fontSize:15,fontWeight:700,color:running?V.accent:V.ink,fontFamily:sans}}>{running?`${elapsed}s`:(value?`${value}s`:"—")}</span>
    <span style={{fontSize:11,color:V.ink3}}>{running?"stop":"time"}</span>
  </div>);
}
function PowerTimerCell({win=15,onFire,V,sans}){
  const[mode,setMode]=useState("idle");   // idle | edit | run | done
  const[secs,setSecs]=useState(win);
  const[left,setLeft]=useState(win);
  useEffect(()=>{if(mode!=="run")return;const end=Date.now()+left*1000;const iv=setInterval(()=>{const r=Math.max(0,Math.ceil((end-Date.now())/1000));setLeft(r);if(r<=0){clearInterval(iv);setMode("done");try{if(navigator.vibrate)navigator.vibrate([300,120,300]);}catch(e){}}},150);return()=>clearInterval(iv);},[mode]);
  const start=()=>{setLeft(+secs>0?+secs:win);setMode("run");if(onFire)onFire();};
  if(mode==="edit")return(<span style={{display:"inline-flex",alignItems:"center",gap:3}}>
    <input type="number" inputMode="numeric" autoFocus value={secs} onChange={e=>setSecs(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")start();}} style={{width:40,textAlign:"center",border:`1px solid ${V.border}`,borderRadius:8,padding:"4px 2px",fontSize:12,outline:"none",fontFamily:sans,background:V.field}}/>
    <span onClick={start} style={{cursor:"pointer",color:V.good,fontSize:14,fontWeight:700,padding:"0 3px"}}>▶</span>
  </span>);
  return(<span onClick={()=>setMode(mode==="idle"?"edit":"idle")} title="Power window — tap to set seconds, tap again to reset"
    style={{display:"inline-flex",alignItems:"center",justifyContent:"center",cursor:"pointer",border:`1px solid ${mode==="done"?"#c46a5a":mode==="run"?V.accent:V.good}`,borderRadius:9,padding:"5px 9px",fontSize:12,fontWeight:700,fontFamily:sans,color:mode==="done"?"#fff":mode==="run"?V.accent:V.good,background:mode==="done"?"#c46a5a":"transparent"}}>
    {mode==="run"?`${left}s`:mode==="done"?"⏰ up":`⏱ ${secs}s`}</span>);
}

export default function App(){
  const[view,setView]=useState("home");
  const[implOv,setImplOv]=useState(()=>ld(SK.impl,{}));
  const[kOv,setKOv]=useState(()=>ld(SK.kcoef,{}));
  const toggleImpl=(name)=>setImplOv(p=>{const cur=implOf(name,p);const nx={...p,[name]:cur===2?1:2};sv(SK.impl,nx);return nx;});
  const[anchors,setAnchors]=useState(()=>ld(SK.anchors,{}));
  const[anchorLog,setAnchorLog]=useState(()=>ld(SK.anchorLog,{}));
  const[accLog,setAccLog]=useState(()=>ld(SK.accLog,[]));
  const[anchorSets,setAnchorSets]=useState({});
  const[accs,setAccs]=useState([]);
  // Volume-engine inputs — declared here (with the other generator state) because
  // initSession's useCallback below reads them in its dependency array (TDZ otherwise).
  const[liftDays,setLiftDays]=useState(()=>ld(SK.liftdays,2));
  const[cardioDays,setCardioDays]=useState(()=>ld(SK.cardiodays,0));
  const[banned,setBanned]=useState(()=>ld(SK.banned,[]));
  const[prefs,setPrefs]=useState(()=>ld(SK.prefs,{}));
  const[fatigue,setFatigue]=useState(()=>{const f={};MUSCLES.forEach(m=>f[m]=0);return ld(SK.fatigue,f)});
  const[nutrition,setNutrition]=useState(()=>ld(SK.nutrition,[]));
  const[bodyData,setBodyData]=useState(()=>ld(SK.body,[]));
  const myBW=useMemo(()=>(bodyData.slice().reverse().find(e=>e.weight)||{}).weight||0,[bodyData]);
  const latestBW=useMemo(()=>{const e=[...bodyData].reverse().find(x=>x.weight);return e?+e.weight:0;},[bodyData]);
  const[cardioData,setCardioData]=useState(()=>ld(SK.cardio,[]));
  const[meso,setMeso]=useState(()=>ld(SK.meso,{startDate:null,length:5}));
  const[sessHist,setSessHist]=useState(()=>ld(SK.history,[]));
  const[editDur,setEditDur]=useState(null);const[editDurVal,setEditDurVal]=useState("");
  const[metGoal,setMetGoal]=useState(()=>ld(SK.metgoal,40));
  // Eccentric-overload preference per exercise. Old app kept this in-memory (reset each
  // session); persisted here to SK.eccentrix so the toggle sticks — additive, and the
  // downstream getProgression(eccOn) contract is unchanged.
  const[eccBySlot,setEccBySlot]=useState(()=>ld(SK.eccentrix,{}));
  const toggleEcc=useCallback(name=>setEccBySlot(p=>{const n={...p,[name]:!p[name]};sv(SK.eccentrix,n);return n;}),[]);
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
  // Declared here (not down with the other hybrid-UI-only state) because saveSession's
  // dependency array below reads it — a plain array literal evaluates immediately, so a
  // `const` declared later in the same component body hits the JS temporal dead zone.
  const[routineExs,setRoutineExs]=useState([]);
  const[activeRoutineId,setActiveRoutineId]=useState(null);

  const allSet=activeSlots.every(p=>anchors[p.id]);
  const mesoState=getMesoState(meso);
  const weekVol=useMemo(()=>calcWeeklyVolume(anchorLog,accLog),[anchorLog,accLog]);
  const today=new Date().toISOString().slice(0,10);
  const avgVol=useMemo(()=>avgWeeklyVolume(anchorLog,accLog,today,paceLookback),[anchorLog,accLog,today,paceLookback]);
  const loadTrend=useMemo(()=>muscleLoadTrend(anchorLog,accLog,today,myBW,implOv),[anchorLog,accLog,today,myBW,implOv]);
  const patState=useMemo(()=>patternState(anchorLog,ld(SK.accLog+"_prog",{}),myBW,implOv,kOv),[anchorLog,accLog,myBW,implOv,kOv]);
  const dow=new Date(logDate+"T00:00:00").getDay();
  const targets=dayTargets[dow]||{cal:2400,pro:190,carb:208,fat:90};
  const dayNut=nutrition.filter(d=>d.date===logDate);
  const nutTotals=dayNut.reduce((s,e)=>({cal:s.cal+e.cal,pro:s.pro+e.pro,carb:s.carb+e.carb,fat:s.fat+e.fat}),{cal:0,pro:0,carb:0,fat:0});

  const initSession=useCallback(()=>{
    const sets={};const isDeload=mesoState.phase==="deload";
    activeSlots.forEach(p=>{
      if(!anchors[p.id])return;
      const prog=getProgression(anchors[p.id],anchorLog,[6,12],2,latestBW,powerEnabled,!!eccBySlot[anchors[p.id]]);
      const n=setTarget(anchors[p.id],anchorLog,[6,10],2,mesoState.phase,{liftDays,cardioDays});
      const ex0=EXERCISES.find(x=>x.name===anchors[p.id])||{};
      let baseW=prog.weight;
      // Swapped anchor with no history: you did not get weaker, you changed the lens.
      // Carry the PATTERN's level across and express it in this lift's own units.
      if((baseW===""||baseW==null)&&prog.isNew){
        const ps=patState[p.type||p.id];   // p.type is the movement pattern; = p.id in default mode, the slot's pattern in custom mode
        const kk=ps&&ps.K&&ps.K[anchors[p.id]];
        const k=kk?kk.k:(SEED_K[anchors[p.id]]||null);
        if(ps&&ps.level>0&&k>0){
          const tgtE1=ps.level*k;                              // expected e1RM on THIS lift
          const reps=prog.reps||6, rir=2;
          let total=tgtE1/(1+(reps+rir)/30);                   // invert Epley
          if(ex0.bw)total-=(+latestBW||0);                     // bw lifts: added weight only
          const per=total/implOf(anchors[p.id],implOv);        // back to what you'd load per hand
          const r=Math.round(per/5)*5;
          if(r>0)baseW=r;
        }
      }
      if((baseW===""||baseW==null)&&!ex0.bw&&prog.isNew){const seed=muscleSeedWeight(((ex0.p&&ex0.p[0])||{}).m,{...ld(SK.accLog+"_prog",{}),...anchorLog},ex0.name,implOv);if(seed)baseW=seed;}
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
    setAccs(genAcc(accCount,banned,prefs,fatigue,weekVol,anchorMuscleLoad(anchors,sets,activeSlots),recentNames,accRange,[],isDeload,implOv));
  },[anchors,anchorLog,accCount,banned,prefs,fatigue,weekVol,mesoState.phase,latestBW,accLog,powerEnabled,eccBySlot,liftDays,cardioDays]);

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
    const newAccs=genAcc(accCount-locked.length,banned,prefs,fatigue,weekVol,seed,recentNames,accRange,locked.map(a=>a.name),isDeload,implOv);setAccs([...locked,...newAccs]);},[accs,accCount,banned,prefs,fatigue,weekVol,anchors,anchorSets,accLog,mesoState.phase,implOv]);
  const addAccByName=useCallback((name)=>{
    const ex=EXERCISES.find(x=>x.name===name);if(!ex)return;
    const isDeload=mesoState.phase==="deload";
    const accProg=ld(SK.accLog+"_prog",{});
    const accRange=[[8,12],[12,15],[15,20]][((accLog&&accLog.length)||0)%3];
    setAccs(prev=>{
      const locked=prev.filter(a=>a.locked);
      if(locked.some(a=>a.name===name))return prev;
      const newLocked=[...locked,buildAcc(ex,accProg,accRange,latestBW,isDeload,true,implOv)];
      const seed=anchorMuscleLoad(anchors,anchorSets,activeSlots);
      newLocked.forEach(a=>[...a.p,...a.s].forEach(({m,p:pct})=>{seed[m]=(seed[m]||0)+(a.sets.length)*(pct/100);}));
      const recentNames=[...new Set((accLog||[]).slice(-3).flatMap(e=>(e.exercises||[]).map(x=>x.name)))];
      const fill=genAcc(Math.max(0,accCount-newLocked.length),banned,prefs,fatigue,weekVol,seed,recentNames,accRange,newLocked.map(a=>a.name),isDeload,implOv);
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
    // Quick/Routine sessions have no anchors — they log entirely through this "extras"
    // path, same as accessories (accProg is already a generic per-exercise-name store,
    // not anchor-specific, so quick/routine exercises persist and progress the exact
    // same way accessories do). Added 2026-07-15: previously only `accs` was read here,
    // so Quick BW sessions silently never saved anything on Finish.
    const extrasSrc=sessionMode==="quick"?quickExs:sessionMode==="routine"?routineExs:accs;
    const accEntry={date:new Date().toISOString(),exercises:extrasSrc.filter(a=>a.sets.some(s=>s.reps||s.ecc)).map(a=>({name:a.name,sets:a.sets.filter(s=>s.reps||s.ecc).map(s=>({reps:+s.reps||0,weight:+s.weight||0,rir:s.rir!==""?+s.rir:null,...(s.ecc?{ecc:+s.ecc}:{})}))}))};
    const newAccLog=[...accLog,accEntry].slice(-40);setAccLog(newAccLog);sv(SK.accLog,newAccLog);
    const accProg=ld(SK.accLog+"_prog",{});
    extrasSrc.forEach(a=>{const lsd=a.sets.filter(s=>s.reps||s.ecc);if(!lsd.length)return;
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
    setSessionStart(null);setSessionMode("full");setQuickExs([]);setRoutineExs([]);setActiveRoutineId(null);setView("home");
    initSession();
  },[anchorLog,anchors,anchorSets,accs,accLog,fatigue,meso,initSession,sessionStart,sessionMode,sessHist,quickExs,routineExs]);

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
  const[pendingImport,setPendingImport]=useState(null);
  const importRef=useRef(null);
  // Export EVERY wg2- key (all SK values + the derived _prog cache) as one JSON file.
  const exportBackup=useCallback(()=>{
    const data={};for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(k&&k.startsWith("wg2-"))data[k]=localStorage.getItem(k);}
    const blob=new Blob([JSON.stringify({app:"workout-gen",version:1,exportedAt:new Date().toISOString(),data},null,2)],{type:"application/json"});
    const url=URL.createObjectURL(blob);const a=document.createElement("a");
    a.href=url;a.download=`workout-gen-backup-${new Date().toISOString().slice(0,10)}.json`;
    document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
  },[]);
  const onImportFile=useCallback(e=>{
    const f=e.target.files&&e.target.files[0];e.target.value="";if(!f)return;
    const r=new FileReader();
    r.onload=()=>{try{const p=JSON.parse(r.result);
      if(p&&p.app==="workout-gen"&&p.data&&typeof p.data==="object")setPendingImport({data:p.data,count:Object.keys(p.data).length,exportedAt:p.exportedAt});
      else setPendingImport({error:"Not a workout-gen backup file."});}
      catch{setPendingImport({error:"Couldn't read that file — is it a valid backup?"});}};
    r.readAsText(f);
  },[]);
  const doImport=useCallback(()=>{
    const d=pendingImport&&pendingImport.data;if(!d)return;
    for(let i=localStorage.length-1;i>=0;i--){const k=localStorage.key(i);if(k&&k.startsWith("wg2-"))localStorage.removeItem(k);}
    Object.entries(d).forEach(([k,v])=>{if(typeof k==="string"&&k.startsWith("wg2-")&&typeof v==="string")localStorage.setItem(k,v);});
    window.location.reload();
  },[pendingImport]);

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

  // ── HYBRID UI ADDITIONS (2026-07-15) ──
  // Additive only — everything above this line is untouched real app state/logic.
  // These are new UI-only handlers needed by the v5-styled screens below; each
  // reuses the existing data model rather than inventing a new one.
  const[swapSlot,setSwapSlot]=useState(null);           // pid currently being swapped, or null
  const[showAddAcc,setShowAddAcc]=useState(false);
  const[bDate,setBDate]=useState(()=>today);            // body-log backdating, same pattern as cDate/logDate
  const[fnFlags,setFnFlags]=useState(()=>{
    const keys=["fn-reminders","fn-autorest","fn-haptic","fn-metric","fn-private"];
    const o={};keys.forEach(k=>{try{o[k]=JSON.parse(localStorage.getItem("wg2-"+k)||"false");}catch{o[k]=false;}});return o;
  });
  const[theme,setTheme]=useState(()=>ld(SK.theme,"light"));
  const[accentHex,setAccentHex]=useState(()=>ld(SK.accent,"#a49bd8"));
  const ACCENTS=["#a49bd8","#7fa8cd","#7fbfa0","#d99b6c","#cf7d84","#d4b25a"];
  // ── ROUTINES ── named, reusable exercise lists outside the meso/anchor system.
  // Reuses buildAcc/accProg exactly as accessories do — that mechanism already generalizes
  // to any exercise name, so a routine's per-exercise weight/rep suggestions come from the
  // same real progression logic, not a new invented one.
  const[routines,setRoutines]=useState(()=>ld(SK.routines,[]));
  // Home modality — matches v5: Settings toggles the whole Home screen between the
  // Mesocycle system and a Routines system, they don't coexist on one screen (a
  // routines section jammed at the foot of the meso screen was an eyesore). "meso" default.
  const[homeMode,setHomeMode]=useState(()=>ld(SK.homemode,"meso"));
  const[showAnchorCfg,setShowAnchorCfg]=useState(false);
  const[showNewRoutine,setShowNewRoutine]=useState(false);
  const[newRoutineName,setNewRoutineName]=useState("");
  const[newRoutinePicks,setNewRoutinePicks]=useState([]);
  const[routineSearch,setRoutineSearch]=useState("");
  const ROUTINE_ICONS=["◆","●","▲","■","✦","◈"];
  const saveRoutine=useCallback(()=>{
    if(!newRoutineName.trim()||!newRoutinePicks.length)return;
    const r={id:crypto.randomUUID(),name:newRoutineName.trim(),icon:ROUTINE_ICONS[routines.length%ROUTINE_ICONS.length],exerciseNames:newRoutinePicks};
    setRoutines(p=>{const n=[...p,r];sv(SK.routines,n);return n;});
    setNewRoutineName("");setNewRoutinePicks([]);setRoutineSearch("");setShowNewRoutine(false);
  },[newRoutineName,newRoutinePicks,routines]);
  const deleteRoutine=useCallback(id=>{setRoutines(p=>{const n=p.filter(r=>r.id!==id);sv(SK.routines,n);return n;});},[]);
  const startRoutine=useCallback(r=>{
    const isDeload=mesoState.phase==="deload";
    const accProg=ld(SK.accLog+"_prog",{});
    const built=r.exerciseNames.map(nm=>{const ex=EXERCISES.find(x=>x.name===nm);
      return ex?buildAcc(ex,accProg,[6,12],latestBW,isDeload,false,implOv):{id:crypto.randomUUID(),name:nm,p:[],s:[],sets:[{reps:"",weight:"",rir:""}]};});
    setRoutineExs(built);setActiveRoutineId(r.id);setAnchorSets({});setAccs([]);
    setSessionStart(Date.now());setSessionMode("routine");setView("session");
  },[mesoState.phase,latestBW,implOv]);
  const updQuick=useCallback((id,idx,f,v)=>setQuickExs(p=>p.map(a=>a.id===id?{...a,sets:a.sets.map((s,i)=>i===idx?{...s,[f]:v}:s)}:a)),[]);
  const addQuickSet=useCallback(id=>setQuickExs(p=>p.map(a=>a.id===id?{...a,sets:[...a.sets,{reps:"",weight:"BW",rir:"",pain:""}]}:a)),[]);
  const rmQuickSet=useCallback((id,idx)=>setQuickExs(p=>p.map(a=>a.id===id?{...a,sets:a.sets.filter((_,i)=>i!==idx)}:a)),[]);
  const updRoutine=useCallback((id,idx,f,v)=>setRoutineExs(p=>p.map(a=>a.id===id?{...a,sets:a.sets.map((s,i)=>i===idx?{...s,[f]:v}:s)}:a)),[]);
  const addRoutineSet=useCallback(id=>setRoutineExs(p=>p.map(a=>a.id===id?{...a,sets:[...a.sets,{reps:"",weight:"",rir:""}]}:a)),[]);
  const rmRoutineSet=useCallback((id,idx)=>setRoutineExs(p=>p.map(a=>a.id===id?{...a,sets:a.sets.filter((_,i)=>i!==idx)}:a)),[]);
  const swapOneAcc=useCallback((id,exName)=>{
    const ex=EXERCISES.find(x=>x.name===exName);if(!ex)return;
    const isDeload=mesoState.phase==="deload";
    const accProg=ld(SK.accLog+"_prog",{});
    const accRange=[[8,12],[12,15],[15,20]][((accLog&&accLog.length)||0)%3];
    setAccs(prev=>prev.map(a=>a.id===id?buildAcc(ex,accProg,accRange,latestBW,isDeload,a.locked,implOv):a));
  },[mesoState.phase,accLog,latestBW,implOv]);
  const LIGHT_V={canvas:"#d6cbb5",bg:"#ece3d1",card:"#f5efe2",card2:"#e7dcc7",field:"#efe7d6",
    ink:"#38332b",ink2:"#8a8273",ink3:"#b6ae9c",border:"#e0d6c1",line:"#ece3d1",
    hink:"#4a4436",accentink:"#33302a",good:"#6f9668",headerGrad:"linear-gradient(135deg,#f4dcc6 0%,#e8ddf0 52%,#dde7ef 100%)"};
  const DARK_V={canvas:"#171512",bg:"#1c1a17",card:"#252019",card2:"#2c2620",field:"#292420",
    ink:"#ece3d1",ink2:"#a89f8c",ink3:"#6f6858",border:"#38322a",line:"#2a2520",
    hink:"#ece3d1",accentink:"#1c1a17",good:"#7fbf78",headerGrad:"linear-gradient(135deg,#2c2620 0%,#25202e 52%,#1e222e 100%)"};
  // Every screen below reads colors from this one V object — flipping its values here
  // is the entire theme implementation, nothing downstream needed to change.
  const V={...(theme==="dark"?DARK_V:LIGHT_V),accent:accentHex};
  const serif="'Instrument Serif',serif",sans="'Hanken Grotesk',system-ui,sans-serif";
  const isSession=sessionStart!=null;
  const streak=(()=>{let n=0;const seen=new Set(sessHist.map(h=>String(h.date).slice(0,10)));let d=new Date();
    for(;;){const ds=d.toISOString().slice(0,10);if(seen.has(ds)){n++;d.setDate(d.getDate()-1);}else break;}return n;})();
  const wkSessions=sessHist.filter(h=>weekStart(h.date)===weekStart(today)).length;

  const Card=({children,style,onClick})=>(<div onClick={onClick} style={{background:V.card,borderRadius:20,boxShadow:`0 1px 0 ${V.border}`,cursor:onClick?"pointer":"default",...style}}>{children}</div>);
  const Eyebrow=({children})=>(<div style={{color:V.ink2,fontSize:13,fontWeight:600,letterSpacing:".06em",textTransform:"uppercase",padding:"0 4px 10px"}}>{children}</div>);
  const HStars=({name})=>(<div style={{display:"flex",gap:3}}>{[1,2,3].map(s=><span key={s} onClick={e=>{e.stopPropagation();setPrefs(p=>{const n={...p,[name]:(p[name]||0)===s?0:s};sv(SK.prefs,n);return n;});}}
    style={{cursor:"pointer",fontSize:14,color:s<=(prefs[name]||0)?V.accent:V.border}}>★</span>)}</div>);

  const goHome=()=>setView("home");
  const NavBar=()=>(<div style={{position:"fixed",left:0,right:0,bottom:0,height:78,background:`linear-gradient(to top,${V.bg} 65%,transparent)`,display:"flex",alignItems:"center",justifyContent:"space-around",padding:"0 20px 16px",zIndex:5,maxWidth:520,margin:"0 auto"}}>
    {[["home","▦"],["cardio","❤"],["insights","◍"],["gym","⌂"],["log","◈"],["settings","◌"]].map(([k,ic])=>
      <span key={k} onClick={()=>setView(k)} style={{fontSize:22,cursor:"pointer",color:view===k?V.ink:V.ink3,transition:"color .15s"}}>{ic}</span>)}
  </div>);

  const SwapModal=()=>{
    if(!swapSlot)return null;
    const slot=activeSlots.find(p=>p.id===swapSlot);if(!slot)return null;
    const opts=PATTERN_MAP[slot.type]||[];
    return(<div onClick={()=>setSwapSlot(null)} style={{position:"fixed",inset:0,zIndex:300,background:"rgba(56,51,43,.5)",display:"flex",alignItems:"flex-end",justifyContent:"center"}}>
      <div onClick={e=>e.stopPropagation()} style={{background:V.bg,borderRadius:"24px 24px 0 0",padding:"20px 18px 28px",width:"100%",maxWidth:480,maxHeight:"75vh",overflowY:"auto"}}>
        <div style={{fontFamily:serif,fontSize:22,color:V.ink,marginBottom:14}}>Swap {slot.label}</div>
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          {opts.map(nm=><div key={nm} onClick={()=>{selAnchor(slot.id,nm);setSwapSlot(null);}}
            style={{background:nm===anchors[slot.id]?V.field:V.card,border:nm===anchors[slot.id]?`1px solid ${V.accent}`:"none",borderRadius:14,padding:"12px 16px",fontSize:15,fontWeight:600,color:V.ink,cursor:"pointer"}}>{nm}</div>)}
        </div>
      </div>
    </div>);
  };

  const AddAccModal=()=>{
    if(!showAddAcc)return null;
    const q=accSearch.trim().toLowerCase();
    const matches=q?ACC_POOL.filter(e=>e.name.toLowerCase().includes(q)&&!accs.some(a=>a.name===e.name)).slice(0,20):[];
    return(<div onClick={()=>{setShowAddAcc(false);setAccSearch("");}} style={{position:"fixed",inset:0,zIndex:300,background:"rgba(56,51,43,.5)",display:"flex",alignItems:"flex-end",justifyContent:"center"}}>
      <div onClick={e=>e.stopPropagation()} style={{background:V.bg,borderRadius:"24px 24px 0 0",padding:"20px 18px 28px",width:"100%",maxWidth:480,maxHeight:"75vh",overflowY:"auto"}}>
        <div style={{fontFamily:serif,fontSize:22,color:V.ink,marginBottom:14}}>Add accessory</div>
        <input autoFocus value={accSearch} onChange={e=>setAccSearch(e.target.value)} placeholder="Search exercises…"
          style={{width:"100%",height:46,borderRadius:14,border:`1px solid ${V.border}`,background:V.field,padding:"0 14px",fontSize:15,fontFamily:sans,color:V.ink,outline:"none",marginBottom:12}}/>
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          {matches.map(ex=><div key={ex.name} onClick={()=>{addAccByName(ex.name);setShowAddAcc(false);}}
            style={{background:V.card,borderRadius:14,padding:"12px 16px",fontSize:15,fontWeight:600,color:V.ink,cursor:"pointer"}}>{ex.name}</div>)}
          {q&&!matches.length&&<div style={{color:V.ink2,fontSize:13,padding:"8px 4px"}}>No matches.</div>}
        </div>
      </div>
    </div>);
  };

  // ── HOME ──
  const HomeScreen=()=>(<div style={{padding:"18px 18px 100px"}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:16}}>
      <div>
        <div style={{color:V.ink2,fontSize:13,fontWeight:500}}>{new Date().toLocaleDateString("en-US",{weekday:"long",month:"short",day:"numeric"})}</div>
        <div style={{fontFamily:serif,fontSize:34,color:V.ink,lineHeight:1.05,marginTop:2}}>{homeMode==="routine"?"Routines":"Workouts"}</div>
      </div>
    </div>
    <div style={{display:"flex",gap:10,marginBottom:16}}>
      <Card style={{flex:1,padding:"13px 14px"}}><div style={{fontFamily:serif,fontSize:24,color:V.ink}}>{wkSessions}</div><div style={{color:V.ink2,fontSize:11,marginTop:3}}>sessions</div></Card>
      <Card style={{flex:1,padding:"13px 14px"}}><div style={{fontFamily:serif,fontSize:24,color:V.ink}}>{streak}</div><div style={{color:V.ink2,fontSize:11,marginTop:3}}>day streak</div></Card>
      <Card style={{flex:1,padding:"13px 14px"}}><div style={{fontFamily:serif,fontSize:24,color:V.ink}}>{metGoal>0?Math.round((weeklyAgg.strength[weekStart(today)]||100)-100):0}<span style={{fontSize:14}}>%</span></div><div style={{color:V.ink2,fontSize:11,marginTop:3}}>strength Δ</div></Card>
    </div>

    {homeMode==="meso"&&<>
    <Card style={{padding:18,marginBottom:18}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline"}}>
        <span style={{fontFamily:serif,fontSize:23,color:V.ink}}>Mesocycle</span>
        <span style={{color:V.ink2,fontSize:13,fontWeight:600}}>{meso.startDate?(mesoState.phase==="deload"?"Deload":`Week ${mesoState.week} / ${mesoState.totalWeeks}`):"Not started"}</span>
      </div>
      {meso.startDate&&<div style={{display:"flex",gap:3,marginTop:12}}>
        {Array.from({length:mesoState.totalWeeks||5}).map((_,i)=><div key={i} style={{flex:1,height:6,borderRadius:3,background:i<mesoState.week?V.accent:V.card2}}/>)}
      </div>}
      {!isSession
        ? <div onClick={()=>{setSessionStart(Date.now());setSessionMode("full");initSession();setView("session");}} style={{marginTop:16,background:V.accent,color:V.accentink,borderRadius:15,height:52,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,fontWeight:700,cursor:"pointer"}}>Start today's session</div>
        : <div onClick={()=>setView("session")} style={{marginTop:16,border:`1px solid ${V.accent}`,color:V.accent,borderRadius:15,height:52,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,fontWeight:700,cursor:"pointer"}}>Resume session ›</div>}
      <div style={{display:"flex",gap:8,marginTop:10}}>
        <span onClick={startDeload} style={{flex:1,textAlign:"center",fontSize:12,fontWeight:600,color:V.ink2,cursor:"pointer",border:`1px solid ${V.border}`,borderRadius:10,padding:"7px 0"}}>Deload</span>
        <span onClick={newMeso} style={{flex:1,textAlign:"center",fontSize:12,fontWeight:600,color:V.ink2,cursor:"pointer",border:`1px solid ${V.border}`,borderRadius:10,padding:"7px 0"}}>New meso</span>
        <span onClick={()=>{setSessionStart(Date.now());setSessionMode("quick");setQuickExs(genQuickSession());setAccs([]);setView("session");}} style={{flex:1,textAlign:"center",fontSize:12,fontWeight:600,color:V.ink2,cursor:"pointer",border:`1px solid ${V.border}`,borderRadius:10,padding:"7px 0"}}>Quick BW</span>
      </div>
    </Card>

    <Eyebrow>Anchors · persist this meso</Eyebrow>
    <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:22}}>
      {activeSlots.map(p=>{const nm=anchors[p.id];const prog=nm?getProgression(nm,anchorLog,[6,12],2,latestBW,powerEnabled,!!eccBySlot[nm]):null;
        return(<Card key={p.id} onClick={()=>setSwapSlot(p.id)} style={{padding:"13px 15px",display:"flex",alignItems:"center",gap:12}}>
          <div style={{minWidth:56,textAlign:"center",background:V.field,borderRadius:10,padding:"8px 4px",color:V.accent,fontSize:11,fontWeight:700}}>{p.label}</div>
          <div style={{flex:1}}><div style={{color:V.ink,fontSize:16,fontWeight:600}}>{nm||"— pick a lift —"}</div><div style={{color:V.ink2,fontSize:12,marginTop:1}}>{prog?prog.note:""}</div></div>
          <span style={{color:V.ink3,fontSize:12,fontWeight:600}}>Swap</span>
        </Card>);})}
    </div>

    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"0 4px 10px"}}>
      <span style={{color:V.ink2,fontSize:13,fontWeight:600,letterSpacing:".06em",textTransform:"uppercase"}}>Accessories</span>
      <span onClick={()=>setShowAddAcc(true)} style={{color:V.accent,fontSize:13,fontWeight:700,cursor:"pointer"}}>+ Add</span>
    </div>
    <div style={{display:"flex",flexDirection:"column",gap:10}}>
      {accs.map(a=><Card key={a.id} style={{padding:"14px 16px",borderLeft:a.locked?`3px solid ${V.accent}`:"none"}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{flex:1}}><div style={{color:V.ink,fontSize:16,fontWeight:600}}>{a.name}</div><div style={{color:V.ink2,fontSize:12,marginTop:1}}>{(a.p[0]||{}).m||""}</div></div>
          <HStars name={a.name}/>
        </div>
        <div style={{display:"flex",gap:8,marginTop:12}}>
          <span onClick={()=>togLock(a.id)} style={{flex:1,textAlign:"center",border:`1px solid ${V.border}`,borderRadius:11,padding:"8px 0",fontSize:12,fontWeight:700,cursor:"pointer",color:a.locked?V.accent:V.ink2}}>{a.locked?"Locked":"Lock"}</span>
          <span onClick={()=>{const pool=ACC_POOL.filter(e=>!banned.includes(e.name)&&e.name!==a.name&&!accs.some(x=>x.name===e.name));if(pool.length)swapOneAcc(a.id,pool[Math.floor(Math.random()*pool.length)].name);}} style={{flex:1,textAlign:"center",border:`1px solid ${V.border}`,borderRadius:11,padding:"8px 0",fontSize:12,fontWeight:600,cursor:"pointer",color:V.ink2}}>Swap</span>
          <span onClick={()=>toggleBan(a.name)} style={{flex:1,textAlign:"center",border:`1px solid ${V.border}`,borderRadius:11,padding:"8px 0",fontSize:12,fontWeight:600,cursor:"pointer",color:V.ink2}}>Ban</span>
        </div>
      </Card>)}
    </div>
    </>}

    {homeMode==="routine"&&<>
    {isSession&&sessionMode==="routine"&&<Card onClick={()=>setView("session")} style={{padding:"14px 18px",marginBottom:14,border:`1px solid ${V.accent}`,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
      <div><div style={{color:V.ink,fontSize:15,fontWeight:600}}>{sName}</div><div style={{color:V.ink2,fontSize:12}}>In progress · {sTimeStr}</div></div>
      <span style={{color:V.accent,fontSize:14,fontWeight:700}}>Resume ›</span>
    </Card>}
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"0 4px 10px"}}>
      <span style={{color:V.ink2,fontSize:13,fontWeight:600,letterSpacing:".06em",textTransform:"uppercase"}}>Your routines</span>
      <span onClick={()=>setShowNewRoutine(true)} style={{color:V.accent,fontSize:13,fontWeight:700,cursor:"pointer"}}>+ New</span>
    </div>
    <div style={{display:"flex",flexDirection:"column",gap:10}}>
      {routines.map(r=><Card key={r.id} style={{padding:"16px 18px",display:"flex",alignItems:"center",gap:14}}>
        <div style={{width:46,height:46,borderRadius:14,background:V.field,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0,color:V.accent}}>{r.icon}</div>
        <div style={{flex:1,minWidth:0}}><div style={{color:V.ink,fontSize:16,fontWeight:600}}>{r.name}</div><div style={{color:V.ink2,fontSize:13,marginTop:1}}>{r.exerciseNames.length} exercises</div></div>
        <span onClick={()=>startRoutine(r)} style={{background:V.accent,color:V.accentink,fontSize:13,fontWeight:700,borderRadius:13,padding:"10px 16px",cursor:"pointer",flexShrink:0}}>Start</span>
        <span onClick={()=>deleteRoutine(r.id)} style={{color:V.ink3,fontSize:19,cursor:"pointer",flexShrink:0}}>×</span>
      </Card>)}
      <div onClick={()=>setShowNewRoutine(true)} style={{border:`1.5px dashed ${V.border}`,borderRadius:22,height:56,display:"flex",alignItems:"center",justifyContent:"center",gap:8,color:V.ink3,fontSize:15,fontWeight:600,cursor:"pointer"}}><span style={{fontSize:19}}>+</span> New routine</div>
      <div onClick={()=>{setSessionStart(Date.now());setSessionMode("quick");setQuickExs(genQuickSession());setAccs([]);setView("session");}} style={{border:`1.5px dashed ${V.border}`,borderRadius:22,height:56,display:"flex",alignItems:"center",justifyContent:"center",gap:8,color:V.ink3,fontSize:15,fontWeight:600,cursor:"pointer"}}><span style={{fontSize:19}}>+</span> Quick bodyweight</div>
    </div>
    </>}
  </div>);

  const NewRoutineModal=()=>{
    if(!showNewRoutine)return null;
    const q=routineSearch.trim().toLowerCase();
    const matches=q?EXERCISES.filter(e=>e.name.toLowerCase().includes(q)&&!newRoutinePicks.includes(e.name)).slice(0,20):[];
    return(<div onClick={()=>setShowNewRoutine(false)} style={{position:"fixed",inset:0,zIndex:300,background:"rgba(30,27,22,.5)",display:"flex",alignItems:"flex-end",justifyContent:"center"}}>
      <div onClick={e=>e.stopPropagation()} style={{background:V.bg,borderRadius:"24px 24px 0 0",padding:"20px 18px 28px",width:"100%",maxWidth:480,maxHeight:"80vh",overflowY:"auto"}}>
        <div style={{fontFamily:serif,fontSize:22,color:V.ink,marginBottom:14}}>New routine</div>
        <input value={newRoutineName} onChange={e=>setNewRoutineName(e.target.value)} placeholder="Name, e.g. Leg Day"
          style={{width:"100%",height:46,borderRadius:14,border:`1px solid ${V.border}`,background:V.field,padding:"0 14px",fontSize:15,fontFamily:sans,color:V.ink,outline:"none",marginBottom:10}}/>
        {!!newRoutinePicks.length&&<div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:10}}>
          {newRoutinePicks.map(nm=><span key={nm} onClick={()=>setNewRoutinePicks(p=>p.filter(x=>x!==nm))} style={{background:V.accent,color:V.accentink,borderRadius:10,padding:"5px 10px",fontSize:12,fontWeight:600,cursor:"pointer"}}>{nm} ×</span>)}
        </div>}
        <input value={routineSearch} onChange={e=>setRoutineSearch(e.target.value)} placeholder="Search exercises to add…"
          style={{width:"100%",height:44,borderRadius:14,border:`1px solid ${V.border}`,background:V.field,padding:"0 14px",fontSize:14,fontFamily:sans,color:V.ink,outline:"none",marginBottom:10}}/>
        <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:14}}>
          {matches.map(ex=><div key={ex.name} onClick={()=>{setNewRoutinePicks(p=>[...p,ex.name]);setRoutineSearch("");}}
            style={{background:V.card,borderRadius:14,padding:"11px 15px",fontSize:14,fontWeight:600,color:V.ink,cursor:"pointer"}}>{ex.name}</div>)}
        </div>
        <div onClick={saveRoutine} style={{background:(newRoutineName.trim()&&newRoutinePicks.length)?V.accent:V.card2,color:(newRoutineName.trim()&&newRoutinePicks.length)?V.accentink:V.ink3,borderRadius:15,height:48,display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,fontWeight:700,cursor:"pointer"}}>Save routine</div>
      </div>
    </div>);
  };

  // ── ANCHOR SLOTS CONFIG (custom movement-pattern slots) ──
  // Drives the existing anchorCfg/activeSlots system the whole app already reads from —
  // this is just the missing configuration UI (default 6 vs custom 6–12 slots, each a
  // movement pattern, reorderable). Ports the old app's setup panel into the v5 shell.
  const AnchorCfgModal=()=>{
    if(!showAnchorCfg)return null;
    const isCustom=anchorCfg.mode==="custom"&&(anchorCfg.slots||[]).length>0;
    return(<div onClick={()=>setShowAnchorCfg(false)} style={{position:"fixed",inset:0,zIndex:300,background:"rgba(30,27,22,.5)",display:"flex",alignItems:"flex-end",justifyContent:"center"}}>
      <div onClick={e=>e.stopPropagation()} style={{background:V.bg,borderRadius:"24px 24px 0 0",padding:"20px 18px 28px",width:"100%",maxWidth:480,maxHeight:"82vh",overflowY:"auto"}}>
        <div style={{fontFamily:serif,fontSize:22,color:V.ink,marginBottom:6}}>Anchor slots</div>
        <div style={{color:V.ink2,fontSize:13,lineHeight:1.5,marginBottom:14}}>Anchors are the lifts your meso is built around. Use the standard six movement patterns, or go custom to add up to 12 slots (repeat a pattern to hit it twice a week).</div>
        <div style={{display:"flex",background:V.card2,borderRadius:12,padding:3,marginBottom:16}}>
          <span onClick={chooseDefault} style={{flex:1,textAlign:"center",padding:"9px 0",borderRadius:9,fontSize:13,fontWeight:700,cursor:"pointer",background:!isCustom?V.accent:"transparent",color:!isCustom?V.accentink:V.ink2}}>Standard 6</span>
          <span onClick={chooseCustom} style={{flex:1,textAlign:"center",padding:"9px 0",borderRadius:9,fontSize:13,fontWeight:700,cursor:"pointer",background:isCustom?V.accent:"transparent",color:isCustom?V.accentink:V.ink2}}>Custom</span>
        </div>
        {!isCustom&&<div style={{display:"flex",flexDirection:"column",gap:8}}>
          {PATTERNS.map(p=><div key={p.id} style={{background:V.card,borderRadius:14,padding:"12px 15px",display:"flex",alignItems:"center",gap:12}}>
            <div style={{minWidth:56,textAlign:"center",background:V.field,borderRadius:10,padding:"7px 4px",color:V.accent,fontSize:11,fontWeight:700}}>{p.label}</div>
            <div style={{color:V.ink,fontSize:15,fontWeight:600}}>{p.full}</div>
          </div>)}
        </div>}
        {isCustom&&<div style={{display:"flex",flexDirection:"column",gap:8}}>
          {(anchorCfg.slots||[]).map((s,i)=><div key={s.id} style={{background:V.card,borderRadius:14,padding:"10px 12px",display:"flex",alignItems:"center",gap:8}}>
            <span style={{color:V.ink3,fontSize:12,width:18,textAlign:"center"}}>{i+1}</span>
            <select value={s.type} onChange={e=>setSlotType(s.id,e.target.value)} style={{flex:1,minWidth:0,border:`1px solid ${V.border}`,borderRadius:10,background:V.field,color:V.ink,fontSize:14,padding:"8px 8px",outline:"none",fontFamily:sans}}>
              {PATTERNS.map(p=><option key={p.id} value={p.id}>{p.full}</option>)}
            </select>
            <span onClick={()=>moveSlot(s.id,-1)} style={{color:i===0?V.ink3:V.ink2,fontSize:16,cursor:i===0?"default":"pointer",padding:"0 3px",opacity:i===0?0.4:1}}>↑</span>
            <span onClick={()=>moveSlot(s.id,1)} style={{color:i===(anchorCfg.slots.length-1)?V.ink3:V.ink2,fontSize:16,cursor:"pointer",padding:"0 3px",opacity:i===(anchorCfg.slots.length-1)?0.4:1}}>↓</span>
            <span onClick={()=>removeSlot(s.id)} style={{color:(anchorCfg.slots.length<=6)?V.ink3:"#c46a5a",fontSize:17,cursor:(anchorCfg.slots.length<=6)?"default":"pointer",opacity:(anchorCfg.slots.length<=6)?0.4:1,padding:"0 2px"}}>×</span>
          </div>)}
          {(anchorCfg.slots||[]).length<12&&<div onClick={addSlot} style={{border:`1.5px dashed ${V.border}`,borderRadius:14,height:48,display:"flex",alignItems:"center",justifyContent:"center",gap:8,color:V.ink3,fontSize:14,fontWeight:600,cursor:"pointer",marginTop:2}}><span style={{fontSize:18}}>+</span> Add slot</div>}
          <div style={{color:V.ink3,fontSize:11,marginTop:4}}>Minimum 6 slots. Removing back to 6 or switching to Standard keeps your current anchor picks where the pattern matches.</div>
        </div>}
        <div onClick={()=>setShowAnchorCfg(false)} style={{background:V.accent,color:V.accentink,borderRadius:15,height:48,display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,fontWeight:700,cursor:"pointer",marginTop:16}}>Done</div>
      </div>
    </div>);
  };

  // ── SESSION ──
  const sName=sessionMode==="quick"?"Quick session":sessionMode==="routine"?(routines.find(r=>r.id===activeRoutineId)?.name||"Routine"):(activeSlots.map(p=>anchors[p.id]).filter(Boolean)[0]?"Full session":"Session");
  const sTimeStr=isSession?fmtDur((Date.now()-sessionStart)/60000):"0:00";   // static snapshot for resume cards; the live session header uses <SessionClock/>
  const SessionScreen=()=>{
    // Always resolve `ex` from the real EXERCISES catalog so the bw/hold/impl flags are
    // present — buildAcc (accessories) and the quick pool don't carry them, which was
    // hiding the hold timer and mislabeling bodyweight accessories with a weight column.
    // Quick pool always logs as bodyweight (its names carry "(60s hold)"-style suffixes
    // that don't match the catalog), so quick items fall back to {bw:true}.
    const exList=sessionMode==="quick"
      ?quickExs.map(ex=>({key:"q-"+ex.id,quickId:ex.id,name:ex.name,sets:ex.sets,ex:{...(EXERCISES.find(x=>x.name===ex.name)||{}),bw:true}}))
      :sessionMode==="routine"
      ?routineExs.map(a=>({key:"rt-"+a.id,routineId:a.id,name:a.name,sets:a.sets,ex:EXERCISES.find(x=>x.name===a.name)||a}))
      :[...activeSlots.filter(p=>anchors[p.id]).map(p=>({key:p.id,pid:p.id,name:anchors[p.id],sets:anchorSets[p.id]||[],ex:EXERCISES.find(x=>x.name===anchors[p.id])||{}})),
        ...accs.map(a=>({key:"acc-"+a.id,accId:a.id,name:a.name,sets:a.sets,ex:EXERCISES.find(x=>x.name===a.name)||a}))];
    return(<div style={{padding:"0 0 40px"}}>
      <div style={{background:V.headerGrad,padding:"18px 22px 22px"}}>
        <span onClick={goHome} style={{color:V.hink,fontSize:22,cursor:"pointer"}}>‹ Home</span>
        <div style={{textAlign:"center",marginTop:2}}>
          <div style={{fontFamily:serif,fontSize:30,color:V.ink}}>{sName}</div>
          <SessionClock start={sessionStart} style={{fontFamily:serif,fontSize:54,color:V.ink,marginTop:4,fontVariantNumeric:"tabular-nums"}}/>
        </div>
      </div>
      <div style={{padding:"18px 16px 0",display:"flex",flexDirection:"column",gap:14}}>
        {exList.map(item=>{
          const isBw=item.ex&&item.ex.bw;
          const setsArr=item.sets||[];
          const upd=(idx,f,val)=>{
            if(item.pid)updAS(item.pid,idx,f,val);
            else if(item.accId)updAcc(item.accId,idx,f,val);
            else if(item.quickId)updQuick(item.quickId,idx,f,val);
            else if(item.routineId)updRoutine(item.routineId,idx,f,val);
          };
          const rm=idx=>{if(item.pid)rmAS(item.pid,idx);else if(item.accId)rmAcc(item.accId,idx);else if(item.quickId)rmQuickSet(item.quickId,idx);else if(item.routineId)rmRoutineSet(item.routineId,idx);};
          const add=()=>{if(item.pid)addAS(item.pid);else if(item.accId)addAccSet(item.accId);else if(item.quickId)addQuickSet(item.quickId);else if(item.routineId)addRoutineSet(item.routineId);};
          const isDb=!isBw&&item.name.includes("Dumbbell");
          const curImpl=implOf(item.name,implOv);
          const isHold=!!(item.ex&&item.ex.hold);        // isometric — log seconds via a timer
          const eccOn=!isHold&&isBw&&!!eccBySlot[item.name]; // eccentric overload (bodyweight lifts)
          const showPwr=!isBw&&!isHold&&powerEnabled;    // ballistic power (loaded lifts, power mode on)
          // Dynamic column layout so hold/ecc/power only take space when they apply.
          const cols=["32px"];
          if(!isBw&&!isHold)cols.push("1fr");            // weight
          cols.push(isHold?"1.7fr":"1fr");               // reps (or hold timer)
          if(eccOn)cols.push("0.8fr");                   // ecc
          cols.push("0.7fr","0.7fr");                    // rir, pain
          if(showPwr)cols.push("auto");                  // power timer
          cols.push("22px");                             // delete
          const gt=cols.join(" ");
          const inp={width:"100%",textAlign:"center",border:"none",background:"transparent",outline:"none",fontFamily:sans};
          return(<Card key={item.key} style={{padding:"18px 18px 8px"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",marginBottom:8}}>
              <span style={{fontSize:17,fontWeight:600,color:V.ink}}>{item.name}</span>
              {item.pid&&<span onClick={()=>setSwapSlot(item.pid)} style={{color:V.accent,fontSize:12,fontWeight:700,cursor:"pointer"}}>Swap</span>}
            </div>
            {isDb&&<div style={{marginBottom:8}}>
              <div onClick={()=>{const n={...implOv,[item.name]:curImpl>=2?1:2};setImplOv(n);sv(SK.impl,n);}}
                style={{display:"inline-flex",alignItems:"center",gap:6,border:`1px solid ${curImpl>=2?V.accent:V.border}`,borderRadius:11,padding:"5px 11px",cursor:"pointer",fontSize:12,fontWeight:700,color:curImpl>=2?V.accent:V.ink2}}>
                {curImpl>=2?"Per-hand · one dumbbell":"Total · both hands"}</div>
              <div style={{color:V.ink3,fontSize:11,marginTop:5,lineHeight:1.4}}>{curImpl>=2
                ?"Enter the weight of ONE dumbbell — the app doubles it for total load & pattern comparison."
                :"Enter the combined weight moved (single dumbbell held two-handed)."}</div>
            </div>}
            {isBw&&!isHold&&<div onClick={()=>toggleEcc(item.name)} style={{display:"inline-flex",alignItems:"center",gap:6,marginBottom:8,border:`1px solid ${eccOn?V.accent:V.border}`,borderRadius:11,padding:"5px 11px",cursor:"pointer",fontSize:12,fontWeight:700,color:eccOn?V.accent:V.ink2}}>{eccOn?"Eccentric overload · on":"Eccentric overload"}</div>}
            {item.quickId&&<div style={{color:V.ink2,fontSize:12,marginBottom:6}}>Bodyweight · to near failure</div>}
            <>
              <div style={{display:"grid",gridTemplateColumns:gt,columnGap:8,paddingBottom:2}}>
                <span/>
                {!isBw&&!isHold&&<span style={{textAlign:"center",color:curImpl>=2?V.accent:V.ink3,fontSize:10,fontWeight:700}}>{curImpl>=2?"LB/HAND":"LBS"}</span>}
                <span style={{textAlign:"center",color:V.ink3,fontSize:10,fontWeight:700}}>{isHold?"HOLD":"REPS"}</span>
                {eccOn&&<span style={{textAlign:"center",color:V.accent,fontSize:10,fontWeight:700}}>ECC</span>}
                <span style={{textAlign:"center",color:V.ink3,fontSize:10,fontWeight:700}}>RIR</span>
                <span style={{textAlign:"center",color:V.ink3,fontSize:10,fontWeight:700}}>PAIN</span>
                {showPwr&&<span style={{textAlign:"center",color:V.good,fontSize:10,fontWeight:700}}>PWR</span>}
                <span/>
              </div>
              {setsArr.map((s,idx)=><div key={idx} style={{display:"grid",gridTemplateColumns:gt,alignItems:"center",columnGap:8,padding:"8px 0",borderTop:`1px solid ${V.line}`}}>
                <div style={{width:26,height:26,borderRadius:8,background:((s.reps||s.ecc)&&(s.weight||isBw))?V.accent:V.field,color:((s.reps||s.ecc)&&(s.weight||isBw))?"#fff":V.ink2,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:600}}>{idx+1}</div>
                {!isBw&&!isHold&&<input type="number" inputMode="decimal" value={s.weight||""} onChange={e=>upd(idx,"weight",e.target.value)} style={{...inp,color:V.ink,fontSize:15,fontWeight:600}}/>}
                {isHold
                  ?<HoldTimerCell value={s.reps} onChange={v=>upd(idx,"reps",v)} V={V} sans={sans}/>
                  :<input type="number" inputMode="numeric" value={s.reps||""} onChange={e=>upd(idx,"reps",e.target.value)} style={{...inp,color:V.ink,fontSize:15,fontWeight:600}}/>}
                {eccOn&&<input type="number" inputMode="numeric" value={s.ecc??""} onChange={e=>upd(idx,"ecc",e.target.value)} style={{...inp,color:V.accent,fontSize:14,fontWeight:600}}/>}
                <input type="number" inputMode="numeric" value={s.rir??""} onChange={e=>upd(idx,"rir",e.target.value)} style={{...inp,color:V.ink2,fontSize:14}}/>
                <input type="number" inputMode="numeric" value={s.pain??""} onChange={e=>upd(idx,"pain",e.target.value)} style={{...inp,color:V.ink2,fontSize:14}}/>
                {showPwr&&<span style={{display:"flex",justifyContent:"center"}}><PowerTimerCell win={15} onFire={()=>upd(idx,"pwr",1)} V={V} sans={sans}/></span>}
                <span onClick={()=>rm(idx)} style={{color:V.ink3,fontSize:16,cursor:"pointer",textAlign:"center"}}>×</span>
              </div>)}
              <div onClick={add} style={{textAlign:"center",color:V.accent,fontSize:13,fontWeight:700,cursor:"pointer",padding:"11px 0 6px",borderTop:`1px solid ${V.line}`}}>+ Add set</div>
              </>
          </Card>);
        })}
        <div onClick={saveSession} style={{background:"#93b98a",borderRadius:20,height:56,display:"flex",alignItems:"center",justifyContent:"center",color:"#26331f",fontSize:16,fontWeight:700,cursor:"pointer",marginTop:4}}>Finish workout</div>
      </div>
    </div>);
  };

  // ── CARDIO ──
  // Type pills map to the REAL 3 values workout-gen stores (steady/hiit/rowing) — the
  // v5 mockup's Run/Ride/Row/Walk pills conflate activity+intensity in a way the actual
  // `type` field doesn't model (same precedent as the earlier cardio-field ruling: UI
  // fits logic, not invented activity types with no data behind them).
  const CardioScreen=()=>{
    const recent=cardioData.slice().reverse().slice(0,10);
    const pace=(()=>{const d=+cDist,durMin=(+cH||0)*60+(+cM||0)+(+cS||0)/60;if(!d||!durMin)return null;
      const spm=Math.round(durMin*60/d);return `${Math.floor(spm/60)}:${String(spm%60).padStart(2,"0")}/mi`;})();
    return(<div style={{padding:"18px 18px 100px"}}>
      <div style={{fontFamily:serif,fontSize:34,color:V.ink,marginBottom:14}}>Cardio</div>
      <div style={{display:"flex",gap:8,marginBottom:16}}>
        {["steady","hiit","rowing"].map(t=><span key={t} onClick={()=>setCType(t)} style={{padding:"9px 16px",borderRadius:12,fontSize:13,fontWeight:700,cursor:"pointer",background:cType===t?V.accent:V.card2,color:cType===t?V.accentink:V.ink2,textTransform:"capitalize"}}>{t}</span>)}
      </div>
      <Card style={{padding:16,marginBottom:14}}>
        <div style={{textAlign:"center",padding:"2px 0 14px"}}>
          <div style={{display:"flex",alignItems:"baseline",justifyContent:"center",gap:8}}>
            <input type="text" inputMode="decimal" value={cDist} onChange={e=>setCDist(e.target.value)} placeholder="—"
              style={{width:130,textAlign:"center",fontFamily:serif,fontSize:52,color:V.ink,border:"none",background:"transparent",outline:"none"}}/>
            <span style={{color:V.ink2,fontSize:16}}>mi</span>
          </div>
          <div style={{color:V.ink3,fontSize:11,letterSpacing:".08em",textTransform:"uppercase",marginTop:4}}>Distance · optional{pace?` · ${pace} pace`:""}</div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:12}}>
          {[["H",cH,setCH],["M",cM,setCM],["S",cS,setCS]].map(([lbl,val,set])=>
            <div key={lbl} style={{background:V.field,borderRadius:14,padding:"10px 6px",textAlign:"center"}}>
              <input type="number" inputMode="numeric" value={val} onChange={e=>set(e.target.value)} placeholder="0"
                style={{width:"100%",textAlign:"center",color:V.ink,fontSize:19,fontWeight:700,border:"none",background:"transparent",outline:"none",fontFamily:sans}}/>
              <div style={{color:V.ink3,fontSize:10,textTransform:"uppercase",marginTop:2}}>{lbl}</div></div>)}
        </div>
        <div style={{background:V.field,borderRadius:14,padding:"10px 6px",textAlign:"center",marginBottom:12}}>
          <input type="number" inputMode="numeric" value={cHR} onChange={e=>setCHR(e.target.value)} placeholder="—" style={{width:"100%",textAlign:"center",color:V.accent,fontSize:20,fontWeight:700,border:"none",background:"transparent",outline:"none",fontFamily:sans}}/>
          <div style={{color:V.ink3,fontSize:10,textTransform:"uppercase",marginTop:2}}>Avg BPM</div>
        </div>
        {cType==="hiit"&&<input value={cConf} onChange={e=>setCConf(e.target.value)} placeholder="Config, e.g. 30s on / 90s off × 8" style={{width:"100%",height:42,borderRadius:12,border:`1px solid ${V.border}`,background:V.field,padding:"0 12px",fontSize:13,outline:"none",marginBottom:12,fontFamily:sans}}/>}
        <div style={{color:V.ink2,fontSize:12,fontWeight:600,textTransform:"uppercase",marginBottom:8}}>Time in HR zones</div>
        <div style={{display:"flex",gap:6,marginBottom:12}}>
          {cZones.map((z,i)=><div key={i} style={{flex:1,textAlign:"center"}}>
            <input type="number" inputMode="numeric" value={z} onChange={e=>setCZones(zs=>zs.map((x,ix)=>ix===i?e.target.value:x))} placeholder="0"
              style={{width:"100%",textAlign:"center",fontSize:13,fontWeight:700,border:`1px solid ${V.border}`,background:V.field,borderRadius:10,padding:"8px 0",outline:"none"}}/>
            <div style={{color:V.ink3,fontSize:10,marginTop:2}}>Z{i+1}</div></div>)}
        </div>
        <input type="date" value={cDate} max={today} onChange={e=>setCDate(e.target.value)} style={{width:"100%",border:`1px solid ${V.border}`,borderRadius:11,background:V.field,color:V.ink,fontSize:13,padding:"8px 10px",outline:"none",marginBottom:12,fontFamily:sans}}/>
        <div onClick={addCardio} style={{background:V.accent,color:V.accentink,borderRadius:16,height:50,display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,fontWeight:700,cursor:"pointer"}}>+ Log {cType}</div>
      </Card>
      <Eyebrow>Recent</Eyebrow>
      <div style={{display:"flex",flexDirection:"column",gap:10}}>
        {recent.map(r=><Card key={r.time} style={{padding:"14px 16px",display:"flex",alignItems:"center",gap:12}}>
          <span style={{width:9,height:9,borderRadius:"50%",background:V.accent,flexShrink:0}}/>
          <div style={{flex:1}}><div style={{color:V.ink,fontSize:15,fontWeight:600,textTransform:"capitalize"}}>{r.type}{cardioExtra(r)}</div><div style={{color:V.ink2,fontSize:12}}>{new Date(r.date).toLocaleDateString("en-US",{month:"short",day:"numeric"})}</div></div>
          <div style={{textAlign:"right"}}><div style={{color:V.ink,fontSize:15,fontWeight:600}}>{fmtDur(r.duration)}</div>{r.burn!=null&&<div style={{color:V.ink3,fontSize:12}}>{r.burn} kcal</div>}</div>
          <span onClick={()=>delCardio(r.time)} style={{color:V.ink3,fontSize:16,cursor:"pointer"}}>×</span>
        </Card>)}
        {!recent.length&&<div style={{color:V.ink3,fontSize:13,textAlign:"center",padding:"14px 0"}}>No cardio logged yet.</div>}
      </div>
    </div>);
  };

  // ── INSIGHTS ──
  // Every chart below reads real logic already in this file (weekVol/VOL_LANDMARKS,
  // patObs/patternState, bodyData, weeklyAgg via pearson(), sessHist) — none of it was
  // being rendered before; this was the biggest gap flagged in the 2026-07-15 audit.
  const Radar=({axes,size=180})=>{
    const cx=size/2,cy=size/2,r=size/2-26,n=axes.length;
    const pt=(i,v)=>{const a=-Math.PI/2+i*(2*Math.PI/n);return[cx+r*v*Math.cos(a),cy+r*v*Math.sin(a)];};
    const poly=axes.map((ax,i)=>pt(i,Math.min(ax.v,1.5)).join(",")).join(" ");
    return(<svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {[0.5,1,1.5].map(ring=><polygon key={ring} points={axes.map((_,i)=>pt(i,ring).join(",")).join(" ")} fill="none" stroke={V.border} strokeWidth={ring===1?1.4:1}/>)}
      {axes.map((ax,i)=>{const[x,y]=pt(i,1.5);return<line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke={V.border} strokeWidth={1}/>;})}
      <polygon points={poly} fill={V.accent} fillOpacity={0.32} stroke={V.accent} strokeWidth={2}/>
      {axes.map((ax,i)=>{const[x,y]=pt(i,1.72);return<text key={i} x={x} y={y} fontSize={10} fontWeight={700} fill={V.ink2} textAnchor="middle" dominantBaseline="middle">{ax.label}</text>;})}
    </svg>);
  };
  // Round, colored-spoke chart — each axis gets its own hue (not one uniform accent
  // fill) so muscle groups read apart at a glance, per 2026-07-16 feedback on the
  // Effort distribution card (was a flat single-color bar chart).
  // 6-group starburst, matching the actual v5 reference image (uploads/pasted-*.png)
  // the earlier spoke-chart attempt didn't match: multiple thin spikes per group
  // clustered in a sector, dark center hub with a group count, legend beside it —
  // not one line per axis. Real workout-gen tracks 12 muscles; folded down to the
  // 6 groups the design uses (Legs = quads+hams+glutes+calves, Arms = bi+tri+forearm,
  // Back includes traps, Core stands alone).
  const GROUP_MAP={Chest:["chest"],Back:["back","traps"],Legs:["quads","hamstrings","glutes","calves"],
    Delts:["shoulders"],Arms:["biceps","triceps","forearms"],Core:["core"]};
  const GROUP_COLORS={Chest:"#a89bd8",Back:"#7fbf8f",Legs:"#d99b6c",Delts:"#d4c05a",Arms:"#6a9ecf",Core:"#d98fb0"};
  const Starburst=({groups,size=200,spikesPerGroup=7})=>{
    const cx=size/2,cy=size/2,rMax=size/2-12,rMin=rMax*0.26,n=groups.length;
    const spikes=[];
    groups.forEach((g,gi)=>{
      const center=-Math.PI/2+gi*(2*Math.PI/n);
      const spread=(2*Math.PI/n)*0.72;
      for(let s=0;s<spikesPerGroup;s++){
        const t=spikesPerGroup>1?s/(spikesPerGroup-1):0.5;
        const a=center-spread/2+t*spread;
        const jitter=0.55+0.45*Math.abs(Math.sin((gi*7+s)*2.3));
        // floor at 0.2 so even a light week still shows a visible spike (honest
        // relative lengths, just never collapses the chart to nothing)
        const len=rMin+(rMax-rMin)*Math.min(Math.max(g.v,0.2),1)*jitter;
        spikes.push({x1:cx+rMin*Math.cos(a),y1:cy+rMin*Math.sin(a),x2:cx+len*Math.cos(a),y2:cy+len*Math.sin(a),color:g.color});
      }
    });
    const activeGroups=groups.filter(g=>g.v>0).length;
    return(<svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {spikes.map((s,i)=><line key={i} x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2} stroke={s.color} strokeWidth={3} strokeLinecap="round"/>)}
      <circle cx={cx} cy={cy} r={rMin} fill={V.ink} opacity={0.9}/>
      <text x={cx} y={cy-5} fontSize={18} fontWeight={700} fill={V.bg} textAnchor="middle">{activeGroups}</text>
      <text x={cx} y={cy+10} fontSize={7} fontWeight={700} letterSpacing="0.5" fill={V.bg} opacity={0.75} textAnchor="middle">GROUPS</text>
    </svg>);
  };
  // `responsive` renders width:"100%" (CSS) instead of a fixed pixel width — the
  // viewBox still defines the internal coordinate space, so the chart just scales
  // to whatever the card actually has room for instead of forcing a fixed px width
  // that can run past a narrow phone's screen edge (found via testing at 320px).
  const Sparkline=({vals,w=64,h=26,color,responsive})=>{
    if(vals.length<2)return<svg width={responsive?"100%":w} height={h}/>;
    const mn=Math.min(...vals),mx=Math.max(...vals),span=(mx-mn)||1;
    const pts=vals.map((v,i)=>[i/(vals.length-1)*w,h-((v-mn)/span)*h].join(",")).join(" ");
    return<svg width={responsive?"100%":w} height={h} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={responsive?{display:"block"}:undefined}><polyline points={pts} fill="none" stroke={color||V.accent} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/></svg>;
  };
  const main=["chest","back","shoulders","quads","hamstrings","glutes","biceps","triceps","calves","core","traps","forearms"];
  const InsightsScreen=()=>{
    // Volume shown vs the MEV/MAV landmarks uses TYPICAL weekly volume (avgVol, averaged
    // over completed weeks) — NOT the latest partial week (weekVol), which for a 2x/week
    // lifter is often a single logged session and read as half a real week. avgVol also
    // already uses the set-credit model, so these numbers are directly comparable to the
    // landmarks now. Falls back to the current week only before any completed week exists.
    const iv=avgVol||weekVol;
    // Two scalings, on purpose: the STATS (coverage %, groups-at-MEV) stay absolute
    // vs the MEV landmark — that's the meaningful "am I doing enough" number. But the
    // radar SHAPE fills RELATIVE to your own max muscle, so it always occupies the chart.
    const covVals=main.slice(0,8).map(m=>iv[m]||0);
    const covMax=Math.max(...covVals,1);
    const covAbs=main.slice(0,8).map(m=>(iv[m]||0)/(VOL_LANDMARKS[m].mev||1));
    const covPct=Math.round(covAbs.reduce((a,v)=>a+Math.min(v,1),0)/covAbs.length*100);
    const covGroups=covAbs.filter(v=>v>=1).length;
    const coverage=main.slice(0,8).map((m,i)=>({label:m.slice(0,4),v:(covVals[i]/covMax)*1.4}));
    const wksMET=(()=>{
      const kg=(+latestBW||0)*0.4536,byW={};
      cardioData.forEach(e=>{const mh=(e.burn!=null&&kg>0)?e.burn/kg:(CARDIO_MET[e.type]||6)*((+e.duration||0)/60);const w=weekStart(e.date);byW[w]=(byW[w]||0)+mh;});
      sessHist.forEach(h=>{if(!h.durationMin)return;const w=weekStart(h.date);byW[w]=(byW[w]||0)+RESIST_MET*(h.durationMin/60);});
      const wk=Object.keys(byW).sort();return wk.length?byW[wk[wk.length-1]]:0;
    })();
    // Movement-pattern strength — the whole point is swappability: normalize every lift
    // that maps to a pattern through its k-coefficient (patternState's bridge) so the
    // strength line stays CONTINUOUS across an exercise swap (DB bench → barbell bench)
    // instead of resetting. This is what the user tracks: H/V push/pull, hinge, squat —
    // not any single lift. Do NOT collapse this to one anchor's own e1RM (that throws
    // the cross-exercise comparison away). The current anchor is shown as the subtitle.
    // NOTE: paired-implement (dumbbell) loads are computed per-hand × impl; historical
    // entries logged as TOTAL will read inflated until re-entered per-hand — a data
    // issue, addressed by the new per-hand labeling in the session logger, not here.
    const patRows=PATTERNS.map(p=>{
      const st=patState[p.id];
      const anchorName=anchors[p.id]||st.ref;
      const obs=patObs(p.id,anchorLog,ld(SK.accLog+"_prog",{}),latestBW,implOv)
        .filter(o=>st.K[o.nm]).map(o=>o.e/(st.K[o.nm].k||1));
      const level=st.level?Math.round(st.level):(obs.length?Math.round(obs[obs.length-1]):null);
      const delta=obs.length>=2?Math.round(obs[obs.length-1]-obs[0]):null;
      return{pat:p.full,label:p.label,name:anchorName,level,obs,delta};
    });
    const bwPts=bodyData.filter(e=>e.weight).slice(-40).map(e=>+e.weight);
    const corrPairs=align(weeklyAgg.strength,weeklyAgg.weight);
    const r=pearson(corrPairs);
    const heatWeeks=(()=>{
      const byW={};sessHist.forEach(h=>{const w=weekStart(h.date);byW[w]=(byW[w]||0)+1;});
      const wks=[];for(let i=11;i>=0;i--){const d=new Date();d.setDate(d.getDate()-i*7);const w=weekStart(d.toISOString());wks.push({label:new Date(w+"T00:00:00").toLocaleDateString("en-US",{month:"short",day:"numeric"}),count:byW[w]||0});}
      return wks;
    })();
    const insightLine=()=>{
      const strongest=[...patRows].filter(l=>l.delta!=null).sort((a,b)=>b.delta-a.delta)[0];
      const under=main.filter(m=>(iv[m]||0)<(VOL_LANDMARKS[m].mev*0.7));
      const bits=[];
      if(strongest)bits.push(`${strongest.name} up ${strongest.delta>0?"+":""}${strongest.delta}lb this meso`);
      if(under.length)bits.push(`${under.slice(0,2).join(", ")} under weekly minimum`);
      if(bodyVerdict)bits.push(bodyVerdict.text);
      return bits.join(". ")||"Log a few more sessions to unlock insights.";
    };
    return(<div style={{padding:"18px 18px 100px"}}>
      <div style={{fontFamily:serif,fontSize:34,color:V.ink,marginBottom:14}}>Insights</div>

      <Card style={{padding:"18px 20px",marginBottom:13}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline"}}><span style={{fontSize:16,fontWeight:600,color:V.ink}}>Muscle coverage</span><span style={{color:V.ink2,fontSize:12}}>vs MEV target</span></div>
        <div style={{display:"flex",justifyContent:"center",margin:"2px 0"}}><Radar axes={coverage}/></div>
        <div style={{display:"flex",gap:10}}>
          <div style={{flex:1,background:V.field,borderRadius:14,padding:"11px 14px"}}><div style={{fontFamily:serif,fontSize:26,color:V.ink}}>{covPct}<span style={{fontSize:15,color:V.accent}}>%</span></div><div style={{color:V.ink2,fontSize:11,marginTop:3}}>Weekly coverage</div></div>
          <div style={{flex:1,background:V.field,borderRadius:14,padding:"11px 14px"}}><div style={{fontFamily:serif,fontSize:26,color:V.ink}}>{covGroups}<span style={{fontSize:15,color:V.ink2}}>/8</span></div><div style={{color:V.ink2,fontSize:11,marginTop:3}}>Groups at MEV</div></div>
        </div>
      </Card>

      <Card style={{padding:"18px 20px",marginBottom:13}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",marginBottom:12}}><span style={{fontSize:16,fontWeight:600,color:V.ink}}>Effort distribution</span><span style={{color:V.ink2,fontSize:12}}>by group</span></div>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <div style={{flex:"0 0 auto"}}>{(()=>{
            const raw=Object.entries(GROUP_MAP).map(([g,muscles])=>({
              label:g,vol:muscles.reduce((a,m)=>a+(iv[m]||0),0),color:GROUP_COLORS[g]
            }));
            // Spikes scale RELATIVE to your biggest group so the burst always fills the
            // ring and shows where effort is going — not tiny stubs vs an MAV ceiling.
            const gmax=Math.max(...raw.map(r=>r.vol),1);
            const groups=raw.map(r=>({label:r.label,v:r.vol/gmax,color:r.color}));
            return<Starburst groups={groups} size={176}/>;
          })()}</div>
          <div style={{flex:1,display:"flex",flexDirection:"column",gap:8,paddingLeft:4}}>
            {Object.keys(GROUP_MAP).map(g=><div key={g} style={{display:"flex",alignItems:"center",gap:8}}>
              <span style={{width:11,height:11,borderRadius:3,background:GROUP_COLORS[g],flexShrink:0}}/>
              <span style={{color:V.ink,fontSize:14}}>{g}</span>
            </div>)}
          </div>
        </div>
      </Card>

      {/* Bar FILL scales relative to your most-trained muscle so the row occupies the
          space (not a sad stub vs a distant landmark), while COLOR still encodes the
          absolute MEV/MAV status — so it reads "where is my volume going" and "what's
          under-trained" at once. Feedback 2026-07-16. */}
      <Card style={{padding:"18px 20px",marginBottom:13}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",marginBottom:10}}><span style={{fontSize:16,fontWeight:600,color:V.ink}}>Muscle load</span><span style={{color:V.ink2,fontSize:12}}>relative · color = MEV–MAV</span></div>
        {(()=>{const loadMax=Math.max(...main.map(m=>iv[m]||0),1);
        return<div style={{display:"flex",flexDirection:"column",gap:11}}>
          {main.map(m=>{const lm=VOL_LANDMARKS[m];const cur=Math.round(iv[m]||0);const pct=Math.max((iv[m]||0)/loadMax*100,cur>0?6:0);
            const col=cur>=lm.mav?V.good:cur>=lm.mev?"#8fae6a":cur>=lm.mev*0.7?"#c9a24a":"#c46a5a";
            const tag=cur>=lm.mav?"MAV+":cur>=lm.mev?"MEV+":cur>0?"low":"none";
            return(<div key={m}>
              <div style={{display:"flex",justifyContent:"space-between",fontSize:13,marginBottom:4}}><span style={{color:V.ink,fontWeight:600,textTransform:"capitalize"}}>{m}</span><span style={{color:col,fontWeight:600}}>{cur} sets · {tag} · {lm.mev}–{lm.mav}{loadTrend[m]?(loadTrend[m]==="up"?" ↑":loadTrend[m]==="down"?" ↓":""):""}</span></div>
              <div style={{position:"relative",height:8,borderRadius:6,background:V.card2,overflow:"hidden"}}>
                <div style={{height:"100%",width:`${pct}%`,background:col,borderRadius:6}}/>
              </div>
            </div>);})}
        </div>;})()}
      </Card>

      <Card style={{padding:"18px 20px",marginBottom:13}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
          <div><div style={{fontSize:16,fontWeight:600,color:V.ink}}>Body weight</div>
            <div style={{display:"flex",alignItems:"baseline",gap:6,marginTop:3}}><span style={{fontFamily:serif,fontSize:28,color:V.ink}}>{latestBW||"—"}</span><span style={{color:V.ink2,fontSize:13}}>lbs</span></div></div>
          <span style={{color:V.ink2,fontSize:12}}>last {bwPts.length}</span>
        </div>
        {bwPts.length>=2&&<div style={{marginTop:8}}><Sparkline vals={bwPts} w={280} h={54} responsive/></div>}
        {bodyVerdict&&<div style={{color:V.ink2,fontSize:13,lineHeight:1.5,marginTop:8}}>{bodyVerdict.text}</div>}
        {!bodyVerdict&&<div style={{color:V.ink3,fontSize:13,marginTop:8}}>Log body weight a couple times to see a trend.</div>}
      </Card>

      <Card style={{padding:"18px 20px",marginBottom:13}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",marginBottom:6}}><span style={{fontSize:16,fontWeight:600,color:V.ink}}>Strength by pattern</span><span style={{color:V.ink2,fontSize:12}}>this meso</span></div>
        {patRows.map(l=><div key={l.pat} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 0",borderTop:`1px solid ${V.line}`}}>
          <div style={{flex:1,minWidth:0}}><div style={{color:V.ink,fontSize:14,fontWeight:600,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{l.pat}</div><div style={{color:V.ink3,fontSize:11,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>via {l.name}</div></div>
          <Sparkline vals={l.obs}/>
          <div style={{textAlign:"right",minWidth:52}}><div style={{color:V.ink,fontSize:14,fontWeight:600}}>{l.level??"—"}</div><div style={{fontSize:12,fontWeight:600,color:l.delta==null?V.ink3:l.delta>0?V.good:l.delta<0?"#c46a5a":V.ink3}}>{l.delta==null?"—":l.delta>0?`+${l.delta}`:l.delta}</div></div>
        </div>)}
      </Card>

      {corrPairs.length>=3&&<Card style={{padding:"18px 20px",marginBottom:13}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline"}}><span style={{fontSize:16,fontWeight:600,color:V.ink}}>Volume × weight</span><span style={{color:V.ink2,fontSize:12}}>{r==null?"insufficient":`r = ${r.toFixed(2)}`}</span></div>
        <div style={{color:V.ink3,fontSize:11,marginBottom:8}}>weekly strength index vs bodyweight, {corrPairs.length} weeks</div>
        {(()=>{const W=280,H=90,xs=corrPairs.map(p=>p[0]),ys=corrPairs.map(p=>p[1]);
          const xmn=Math.min(...xs),xmx=Math.max(...xs)||1,ymn=Math.min(...ys),ymx=Math.max(...ys)||1;
          return<svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{display:"block"}}>
            {corrPairs.map(([x,y],i)=><circle key={i} cx={((x-xmn)/((xmx-xmn)||1))*(W-12)+6} cy={H-6-((y-ymn)/((ymx-ymn)||1))*(H-12)} r={4} fill={V.accent} fillOpacity={0.75}/>)}
          </svg>;})()}
      </Card>}

      <Card style={{padding:"18px 20px",marginBottom:13}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",marginBottom:12}}><span style={{fontSize:16,fontWeight:600,color:V.ink}}>Consistency</span><span style={{color:V.ink2,fontSize:12}}>{sessHist.length} sessions · 12 wks</span></div>
        <div style={{display:"flex",flexDirection:"column",gap:6}}>
          {heatWeeks.map((w,i)=><div key={i} style={{display:"flex",alignItems:"center",gap:9}}>
            <span style={{color:V.ink3,fontSize:10,width:44,flexShrink:0}}>{w.label}</span>
            <div style={{display:"flex",gap:5,flex:1}}>{Array.from({length:5}).map((_,c)=><span key={c} style={{flex:1,height:14,borderRadius:4,background:c<w.count?V.accent:V.card2}}/>)}</div>
            <span style={{color:V.ink2,fontSize:11,width:16,textAlign:"right",flexShrink:0}}>{w.count}</span>
          </div>)}
        </div>
      </Card>

      <Card style={{padding:"18px 20px",marginBottom:13}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",marginBottom:6}}><span style={{fontSize:16,fontWeight:600,color:V.ink}}>MET-hours this week</span><span style={{color:V.ink2,fontSize:12}}>goal {metGoal}</span></div>
        <div style={{fontFamily:serif,fontSize:32,color:V.ink}}>{wksMET.toFixed(1)}<span style={{fontSize:15,color:V.ink2}}> / {metGoal}</span></div>
        <div style={{height:8,borderRadius:6,background:V.card2,overflow:"hidden",marginTop:10}}><div style={{height:"100%",width:`${Math.min((wksMET/(metGoal||1))*100,100)}%`,background:wksMET>=metGoal?V.good:V.accent,borderRadius:6}}/></div>
      </Card>

      <div style={{background:V.field,borderRadius:20,padding:"16px 18px",display:"flex",gap:13,alignItems:"flex-start"}}>
        <div style={{width:34,height:34,borderRadius:11,background:V.accent,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:17,flexShrink:0}}>✦</div>
        <div><div style={{fontFamily:serif,fontSize:17,color:V.ink}}>This meso's insight</div><div style={{color:V.ink2,fontSize:13,lineHeight:1.5,marginTop:3}}>{insightLine()}</div></div>
      </div>
    </div>);
  };

  // ── LOG ──
  const LogScreen=()=>{
    const dayNutList=nutrition.filter(d=>d.date===logDate);
    const recentBody=bodyData.slice().reverse().slice(0,6);
    return(<div style={{padding:"18px 18px 100px"}}>
      <div style={{fontFamily:serif,fontSize:34,color:V.ink,marginBottom:14}}>Log</div>

      <Eyebrow>Body</Eyebrow>
      <Card style={{padding:16,marginBottom:18}}>
        {/* Date on its own row — native <input type=date> chrome has a browser-enforced
            minimum render width that ignores flex-shrink/flex-basis, so sharing a row
            with another input pushed that input off-screen (found via testing at 320px). */}
        <div style={{marginBottom:10}}>
          <input type="date" value={bDate} max={today} onChange={e=>setBDate(e.target.value)} style={{width:"100%",border:`1px solid ${V.border}`,borderRadius:11,background:V.field,color:V.ink,fontSize:12,padding:"8px 8px",outline:"none",fontFamily:sans,boxSizing:"border-box"}}/>
        </div>
        <div style={{display:"flex",gap:8,marginBottom:10}}>
          <input type="number" inputMode="decimal" value={bW} onChange={e=>setBW(e.target.value)} placeholder="weight lb" style={{flex:1,minWidth:0,border:`1px solid ${V.border}`,borderRadius:11,background:V.field,color:V.ink,fontSize:13,padding:"8px 10px",outline:"none",fontFamily:sans,boxSizing:"border-box"}}/>
          <input type="number" inputMode="decimal" value={bWa} onChange={e=>setBWa(e.target.value)} placeholder="waist in" style={{flex:1,minWidth:0,border:`1px solid ${V.border}`,borderRadius:11,background:V.field,color:V.ink,fontSize:13,padding:"8px 10px",outline:"none",fontFamily:sans,boxSizing:"border-box"}}/>
          <input type="number" inputMode="decimal" value={bNa} onChange={e=>setBNa(e.target.value)} placeholder="navel in" style={{flex:1,minWidth:0,border:`1px solid ${V.border}`,borderRadius:11,background:V.field,color:V.ink,fontSize:13,padding:"8px 10px",outline:"none",fontFamily:sans,boxSizing:"border-box"}}/>
        </div>
        <div onClick={()=>{const e={date:bDate||today,weight:+bW||null,waist:+bWa||null,navel:+bNa||null,time:new Date().toISOString()};if(!bW&&!bWa&&!bNa)return;setBodyData(p=>{const n=[...p,e].slice(-500);sv(SK.body,n);return n;});setBW("");setBWa("");setBNa("");}}
          style={{background:V.accent,color:V.accentink,borderRadius:13,height:42,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:700,cursor:"pointer",marginBottom:recentBody.length?12:0}}>+ Log</div>
        {recentBody.map(b=><div key={b.time} style={{padding:"10px 0",borderTop:`1px solid ${V.line}`,fontSize:13}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:8}}>
            <span style={{color:V.ink2,flexShrink:0}}>{new Date(String(b.date).slice(0,10)+"T00:00:00").toLocaleDateString("en-US",{month:"short",day:"numeric"})}</span>
            <span onClick={()=>delBody(b.time)} style={{color:V.ink3,cursor:"pointer",flexShrink:0}}>×</span>
          </div>
          <div style={{color:V.ink,marginTop:2,wordBreak:"break-word"}}>{b.weight?`${b.weight}lb`:""}{b.waist?` · ${b.waist}"w`:""}{b.navel?` · ${b.navel}"n`:""}</div>
        </div>)}
      </Card>

      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:6,padding:"0 4px 10px"}}>
        <span style={{color:V.ink2,fontSize:13,fontWeight:600,letterSpacing:".06em",textTransform:"uppercase"}}>Nutrition</span>
        <input type="date" value={logDate} max={today} onChange={e=>setLogDate(e.target.value)} style={{border:`1px solid ${V.border}`,borderRadius:10,background:V.field,color:V.ink,fontSize:11,padding:"4px 8px",outline:"none",fontFamily:sans,maxWidth:"100%",boxSizing:"border-box"}}/>
      </div>
      <Card style={{padding:20}}>
        {(()=>{const dow=new Date(logDate+"T00:00:00").getDay();const t=dayTargets[dow]||{cal:2400,pro:190,carb:208,fat:90};
          const tot=dayNutList.reduce((s,e)=>({cal:s.cal+e.cal,pro:s.pro+e.pro,carb:s.carb+e.carb,fat:s.fat+e.fat}),{cal:0,pro:0,carb:0,fat:0});
          const pct=t.cal>0?Math.round((tot.cal/t.cal)*100):0;
          return(<>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
            <div><div style={{display:"flex",alignItems:"baseline",gap:6}}><span style={{fontFamily:serif,fontSize:32,color:V.ink}}>{tot.cal}</span><span style={{color:V.ink2,fontSize:13}}>/ {t.cal} kcal</span></div><div style={{color:V.ink2,fontSize:12,marginTop:2}}>{Math.max(0,t.cal-tot.cal)} kcal remaining</div></div>
            <div style={{width:56,height:56,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",background:pct>100?"#e0b3ad":V.field}}><span style={{fontSize:13,fontWeight:700,color:V.ink}}>{pct}%</span></div>
          </div>
          {[["Protein",tot.pro,t.pro,"g"],["Carbs",tot.carb,t.carb,"g"],["Fat",tot.fat,t.fat,"g"]].map(([lbl,cur,tgt])=>
            <div key={lbl} style={{marginBottom:9}}><div style={{display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:3}}><span style={{color:V.ink}}>{lbl}</span><span style={{color:V.ink2}}>{cur}/{tgt}g</span></div>
              <div style={{height:6,borderRadius:4,background:V.card2}}><div style={{height:"100%",width:`${Math.min((cur/(tgt||1))*100,100)}%`,background:V.accent,borderRadius:4}}/></div></div>)}
          </>);})()}
        {/* Was 4 fixed-px inputs + an Add button all in one row (238px of hardcoded
            widths alone) — poked 12px past a 320px screen. flex:1/minWidth:0 on every
            input makes the row genuinely share whatever width it has; note + Add moved
            to their own row. `note` also restores a field the old app had that got
            dropped when this screen was rebuilt. */}
        <div style={{display:"flex",gap:6,marginTop:14,marginBottom:8}}>
          <input type="number" inputMode="numeric" value={nCal} onChange={e=>setNCal(e.target.value)} placeholder="kcal" style={{flex:1,minWidth:0,border:`1px solid ${V.border}`,borderRadius:10,background:V.field,color:V.ink,padding:"7px 6px",fontSize:13,outline:"none",fontFamily:sans,boxSizing:"border-box"}}/>
          <input type="number" inputMode="numeric" value={nPro} onChange={e=>setNPro(e.target.value)} placeholder="pro" style={{flex:1,minWidth:0,border:`1px solid ${V.border}`,borderRadius:10,background:V.field,color:V.ink,padding:"7px 6px",fontSize:13,outline:"none",fontFamily:sans,boxSizing:"border-box"}}/>
          <input type="number" inputMode="numeric" value={nCarb} onChange={e=>setNCarb(e.target.value)} placeholder="carb" style={{flex:1,minWidth:0,border:`1px solid ${V.border}`,borderRadius:10,background:V.field,color:V.ink,padding:"7px 6px",fontSize:13,outline:"none",fontFamily:sans,boxSizing:"border-box"}}/>
          <input type="number" inputMode="numeric" value={nFat} onChange={e=>setNFat(e.target.value)} placeholder="fat" style={{flex:1,minWidth:0,border:`1px solid ${V.border}`,borderRadius:10,background:V.field,color:V.ink,padding:"7px 6px",fontSize:13,outline:"none",fontFamily:sans,boxSizing:"border-box"}}/>
        </div>
        <div style={{display:"flex",gap:6,marginBottom:10}}>
          <input value={nNote} onChange={e=>setNNote(e.target.value)} placeholder="note (optional)" style={{flex:1,minWidth:0,border:`1px solid ${V.border}`,borderRadius:10,background:V.field,color:V.ink,padding:"7px 10px",fontSize:13,outline:"none",fontFamily:sans,boxSizing:"border-box"}}/>
          <span onClick={addNut} style={{flexShrink:0,width:64,background:V.accent,color:V.accentink,borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:700,cursor:"pointer"}}>Add</span>
        </div>
        {dayNutList.map(e=><div key={e.time} style={{padding:"7px 0",borderTop:`1px solid ${V.line}`,fontSize:12,color:V.ink2}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",gap:8}}>
            <span style={{flex:1,minWidth:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{e.note||"entry"}</span>
            <span onClick={()=>delNut(e.time)} style={{cursor:"pointer",color:V.ink3,flexShrink:0}}>×</span>
          </div>
          <div>{e.cal}kcal · P{e.pro} C{e.carb} F{e.fat}</div>
        </div>)}
      </Card>
    </div>);
  };

  // ── SETTINGS ──
  const SettingsScreen=()=>(<div style={{padding:"18px 18px 100px"}}>
    <div style={{fontFamily:serif,fontSize:34,color:V.ink,marginBottom:14}}>Settings</div>

    <Eyebrow>Personal</Eyebrow>
    <Card style={{padding:"2px 18px",marginBottom:16}}>
      {[["Sex",profile.sex,v=>setProf("sex",v==="male"?"female":"male")],["Age",profile.age,null]].map(([lbl,val,onClick],i)=>
        <div key={lbl} onClick={onClick||undefined} style={{display:"flex",justifyContent:"space-between",padding:"14px 0",borderBottom:i===0?`1px solid ${V.line}`:"none",cursor:onClick?"pointer":"default"}}>
          <span style={{color:V.ink,fontSize:15}}>{lbl}</span>
          {lbl==="Age"?<input type="number" inputMode="numeric" value={profile.age} onChange={e=>setProf("age",e.target.value)} style={{width:60,textAlign:"right",border:"none",background:"transparent",color:V.ink2,fontSize:15,outline:"none",fontFamily:sans}}/>
            :<span style={{color:V.ink2,fontSize:15,textTransform:"capitalize"}}>{val} ›</span>}
        </div>)}
    </Card>

    <Eyebrow>Training</Eyebrow>
    <Card style={{padding:"16px 18px",marginBottom:16}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
        <span style={{color:V.ink,fontSize:15}}>Home mode</span>
        <div style={{display:"flex",background:V.card2,borderRadius:12,padding:3}}>
          {[["meso","Mesocycle"],["routine","Routines"]].map(([v,l])=><span key={v} onClick={()=>{setHomeMode(v);sv(SK.homemode,v);setView("home");}}
            style={{padding:"6px 12px",borderRadius:9,fontSize:12,fontWeight:700,cursor:"pointer",background:homeMode===v?V.accent:"transparent",color:homeMode===v?V.accentink:V.ink2}}>{l}</span>)}
        </div>
      </div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
        <span style={{color:V.ink,fontSize:15}}>Lift days / week</span>
        <div style={{display:"flex",background:V.card2,borderRadius:11,padding:3}}>
          {[2,3,4,5,6].map(n=><span key={n} onClick={()=>{setLiftDays(n);sv(SK.liftdays,n);}}
            style={{padding:"5px 9px",borderRadius:8,fontSize:12,fontWeight:700,cursor:"pointer",background:liftDays===n?V.accent:"transparent",color:liftDays===n?V.accentink:V.ink2}}>{n}</span>)}
        </div>
      </div>
      <div style={{color:V.ink3,fontSize:11,lineHeight:1.4,marginBottom:14}}>Fewer days → more sets per session to reach weekly volume. The engine adds sets one at a time toward your MAV as you recover; weights/reps progress as before.</div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
        <span style={{color:V.ink,fontSize:15}}>Cardio days / week</span>
        <div style={{display:"flex",background:V.card2,borderRadius:11,padding:3}}>
          {[0,1,2,3,4,5].map(n=><span key={n} onClick={()=>{setCardioDays(n);sv(SK.cardiodays,n);}}
            style={{padding:"5px 9px",borderRadius:8,fontSize:12,fontWeight:700,cursor:"pointer",background:cardioDays===n?V.accent:"transparent",color:cardioDays===n?V.accentink:V.ink2}}>{n}</span>)}
        </div>
      </div>
      <div style={{color:V.ink3,fontSize:11,lineHeight:1.4,marginBottom:14}}>Cardio spends recovery — more cardio days trims the resistance set ceiling to keep you recoverable.</div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
        <span style={{color:V.ink,fontSize:15}}>Power mode</span>
        <span onClick={()=>{setPowerEnabled(p=>{sv(SK.power,!p);return!p;});}} style={{width:44,height:26,borderRadius:13,background:powerEnabled?V.accent:V.card2,position:"relative",cursor:"pointer"}}>
          <span style={{position:"absolute",top:3,left:powerEnabled?21:3,width:20,height:20,borderRadius:"50%",background:"#fff",transition:"left .15s"}}/></span>
      </div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
        <span style={{color:V.ink,fontSize:15}}>MET-hour goal / week</span>
        <input type="number" inputMode="numeric" value={metGoal} onChange={e=>{const v=+e.target.value||0;setMetGoal(v);sv(SK.metgoal,v);}} style={{width:56,textAlign:"right",border:"none",background:"transparent",color:V.ink2,fontSize:15,outline:"none",fontFamily:sans}}/>
      </div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
        <span style={{color:V.ink,fontSize:15}}>Trend lookback</span>
        <div style={{display:"flex",background:V.card2,borderRadius:11,padding:3}}>
          {[2,3,4].map(n=><span key={n} onClick={()=>{setPaceLookback(n);sv(SK.pacelookback,n);}}
            style={{padding:"5px 11px",borderRadius:8,fontSize:12,fontWeight:700,cursor:"pointer",background:paceLookback===n?V.accent:"transparent",color:paceLookback===n?V.accentink:V.ink2}}>{n}wk</span>)}
        </div>
      </div>
      <div onClick={()=>setShowAnchorCfg(true)} style={{display:"flex",justifyContent:"space-between",alignItems:"center",cursor:"pointer"}}>
        <span style={{color:V.ink,fontSize:15}}>Anchor slots</span>
        <span style={{color:V.ink2,fontSize:15}}>{anchorCfg.mode==="custom"&&(anchorCfg.slots||[]).length>0?`Custom · ${anchorCfg.slots.length}`:"Standard 6"} ›</span>
      </div>
    </Card>

    <Eyebrow>Functions</Eyebrow>
    <Card style={{padding:"2px 18px",marginBottom:16}}>
      {[["Reminders","fn-reminders"],["Auto-start rest timer","fn-autorest"],["Haptic feedback","fn-haptic"],["Metric units","fn-metric"],["Private profile","fn-private"]].map(([lbl,key],i,arr)=>{
        const k="wg2-"+key,on=fnFlags[key]||false;
        return(<div key={key} onClick={()=>setFnFlags(p=>{const n={...p,[key]:!p[key]};localStorage.setItem(k,JSON.stringify(n[key]));return n;})}
          style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"14px 0",borderBottom:i<arr.length-1?`1px solid ${V.line}`:"none",cursor:"pointer"}}>
          <span style={{color:V.ink,fontSize:15}}>{lbl}</span>
          <span style={{width:44,height:26,borderRadius:13,background:on?V.accent:V.card2,position:"relative"}}><span style={{position:"absolute",top:3,left:on?21:3,width:20,height:20,borderRadius:"50%",background:"#fff",transition:"left .15s"}}/></span>
        </div>);})}
    </Card>

    <Eyebrow>Appearance</Eyebrow>
    <Card style={{padding:"16px 18px",marginBottom:16}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
        <span style={{color:V.ink,fontSize:15}}>Theme</span>
        <div style={{display:"flex",background:V.card2,borderRadius:12,padding:3}}>
          {[["light","Light"],["dark","Dark"]].map(([v,l])=><span key={v} onClick={()=>{setTheme(v);sv(SK.theme,v);}}
            style={{padding:"7px 14px",borderRadius:9,fontSize:13,fontWeight:700,cursor:"pointer",background:theme===v?V.accent:"transparent",color:theme===v?V.accentink:V.ink2}}>{l}</span>)}
        </div>
      </div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:14}}>
        <span style={{color:V.ink,fontSize:15,flexShrink:0}}>Accent</span>
        <div style={{display:"flex",gap:10,flexWrap:"wrap",justifyContent:"flex-end"}}>
          {ACCENTS.map(hex=><span key={hex} onClick={()=>{setAccentHex(hex);sv(SK.accent,hex);}}
            style={{width:26,height:26,borderRadius:"50%",background:hex,cursor:"pointer",border:accentHex===hex?`2px solid ${V.ink}`:`2px solid transparent`,boxShadow:accentHex===hex?"0 0 0 2px "+V.bg:"none"}}/>)}
        </div>
      </div>
    </Card>

    <Eyebrow>Weekly nutrition targets</Eyebrow>
    <Card style={{padding:"6px 18px",marginBottom:16}}>
      {DOW3.map((d,i)=><div key={d} style={{padding:"10px 0",borderTop:i?`1px solid ${V.line}`:"none"}}>
        <div style={{color:V.ink,fontSize:13,fontWeight:600,marginBottom:6}}>{d}</div>
        <div style={{display:"flex",gap:6}}>
          {[["cal","cal"],["pro","pro"],["carb","carb"],["fat","fat"]].map(([f,ph])=>
            <input key={f} type="number" inputMode="numeric" value={dayTargets[i]?.[f]??""} onChange={e=>setDT(i,f,e.target.value)} placeholder={ph}
              style={{flex:1,minWidth:0,border:`1px solid ${V.border}`,borderRadius:9,background:V.field,color:V.ink,padding:"6px 4px",fontSize:12,textAlign:"center",outline:"none",fontFamily:sans,boxSizing:"border-box"}}/>)}
        </div>
      </div>)}
    </Card>

    <Eyebrow>Banned exercises</Eyebrow>
    <Card style={{padding:14,marginBottom:16}}>
      <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
        {banned.map(nm=><span key={nm} onClick={()=>toggleBan(nm)} style={{background:V.card2,borderRadius:10,padding:"6px 12px",fontSize:12,color:V.ink2,cursor:"pointer"}}>{nm} ×</span>)}
        {!banned.length&&<span style={{color:V.ink3,fontSize:13}}>None banned.</span>}
      </div>
    </Card>

    <Eyebrow>Data</Eyebrow>
    <Card style={{padding:"6px 18px",marginBottom:16}}>
      <div onClick={exportBackup} style={{display:"flex",justifyContent:"space-between",padding:"15px 0",borderBottom:`1px solid ${V.line}`,cursor:"pointer"}}><span style={{color:V.ink,fontSize:15}}>Export data</span><span style={{color:V.ink3,fontSize:14}}>JSON ↓</span></div>
      <div onClick={()=>importRef.current&&importRef.current.click()} style={{display:"flex",justifyContent:"space-between",padding:"15px 0",cursor:"pointer"}}><span style={{color:V.ink,fontSize:15}}>Import data</span><span style={{color:V.ink3,fontSize:14}}>JSON ↑</span></div>
      <input ref={importRef} type="file" accept=".json,application/json" onChange={onImportFile} style={{display:"none"}}/>
      {pendingImport&&pendingImport.error&&<div style={{color:"#c46a5a",fontSize:12,marginTop:4}}>{pendingImport.error}</div>}
    </Card>

    <div onClick={()=>setConfirmClear(true)} style={{color:"#c46a5a",fontSize:13,fontWeight:600,textAlign:"center",padding:"10px 0",cursor:"pointer"}}>Clear all data</div>

    {pendingImport&&pendingImport.data&&<div onClick={()=>setPendingImport(null)} style={{position:"fixed",inset:0,zIndex:400,background:"rgba(56,51,43,.5)",display:"flex",alignItems:"center",justifyContent:"center",padding:24}}>
      <div onClick={e=>e.stopPropagation()} style={{background:V.bg,borderRadius:18,padding:22,maxWidth:340}}>
        <div style={{fontFamily:serif,fontSize:20,color:V.ink,marginBottom:8}}>Import backup?</div>
        <div style={{color:V.ink2,fontSize:13,marginBottom:18}}>Restoring {pendingImport.count} items{pendingImport.exportedAt?` from ${new Date(pendingImport.exportedAt).toLocaleDateString()}`:""}. This replaces all current data on this device.</div>
        <div style={{display:"flex",gap:10}}>
          <span onClick={()=>setPendingImport(null)} style={{flex:1,textAlign:"center",border:`1px solid ${V.border}`,borderRadius:12,padding:"11px 0",fontSize:14,fontWeight:600,cursor:"pointer",color:V.ink}}>Cancel</span>
          <span onClick={doImport} style={{flex:1,textAlign:"center",background:V.accent,color:V.accentink,borderRadius:12,padding:"11px 0",fontSize:14,fontWeight:700,cursor:"pointer"}}>Import</span>
        </div>
      </div>
    </div>}
    {confirmClear&&<div onClick={()=>setConfirmClear(false)} style={{position:"fixed",inset:0,zIndex:400,background:"rgba(56,51,43,.5)",display:"flex",alignItems:"center",justifyContent:"center",padding:24}}>
      <div onClick={e=>e.stopPropagation()} style={{background:V.bg,borderRadius:18,padding:22,maxWidth:340}}>
        <div style={{fontFamily:serif,fontSize:20,color:V.ink,marginBottom:8}}>Clear all data?</div>
        <div style={{color:V.ink2,fontSize:13,marginBottom:18}}>This deletes everything on this device. Export a backup first if you're not sure.</div>
        <div style={{display:"flex",gap:10}}>
          <span onClick={()=>setConfirmClear(false)} style={{flex:1,textAlign:"center",border:`1px solid ${V.border}`,borderRadius:12,padding:"11px 0",fontSize:14,fontWeight:600,cursor:"pointer",color:V.ink}}>Cancel</span>
          <span onClick={clearAllData} style={{flex:1,textAlign:"center",background:"#c46a5a",color:"#fff",borderRadius:12,padding:"11px 0",fontSize:14,fontWeight:700,cursor:"pointer"}}>Clear</span>
        </div>
      </div>
    </div>}
  </div>);

  // ── GYM (placeholder — see specs/workout.md "Hybrid build scope 2026-07-15") ──
  const GymScreen=()=>(<div style={{padding:"60px 30px",textAlign:"center"}}>
    <div style={{width:72,height:72,borderRadius:22,background:V.field,display:"flex",alignItems:"center",justifyContent:"center",fontSize:32,margin:"0 auto 18px"}}>⌂</div>
    <div style={{fontFamily:serif,fontSize:26,color:V.ink}}>Gains in progress</div>
    <div style={{color:V.ink2,fontSize:14,lineHeight:1.5,marginTop:8}}>Gym — challenges, boasts, and the member feed — is being built for real. Check back soon.</div>
  </div>);

  return(<div style={{"--canvas":V.canvas,fontFamily:sans,background:V.bg,minHeight:"100vh",maxWidth:520,margin:"0 auto",position:"relative"}}>
    <link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Hanken+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet"/>
    <style>{`*{box-sizing:border-box}body{margin:0}input[type=number]::-webkit-outer-spin-button,input[type=number]::-webkit-inner-spin-button{-webkit-appearance:none;margin:0}input[type=number]{-moz-appearance:textfield}`}</style>
    {/* Screens rendered as function calls (not <Screen/>) so React reconciles them in
        place instead of remounting a fresh component identity every render — remounting
        was recreating inputs and dropping the keyboard while typing. All screen fns are
        hook-free, so inlining is safe. `home` always shows HomeScreen (with its resume
        UI) even mid-session, so the ‹ Home / nav-home actually leaves the session. */}
    {view==="home"&&HomeScreen()}
    {view==="session"&&isSession&&SessionScreen()}
    {view==="cardio"&&CardioScreen()}
    {view==="insights"&&InsightsScreen()}
    {view==="log"&&LogScreen()}
    {view==="settings"&&SettingsScreen()}
    {view==="gym"&&GymScreen()}
    {SwapModal()}
    {AddAccModal()}
    {NewRoutineModal()}
    {AnchorCfgModal()}
    {NavBar()}
  </div>);
}
