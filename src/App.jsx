import{useState,useEffect,useCallback,useMemo}from"react";
import{MUSCLES,EXERCISES}from"./exercises.js";

// ── STORAGE ──
const ld=(k,fb)=>{try{const v=localStorage.getItem(k);return v?JSON.parse(v):fb}catch{return fb}};
const sv=(k,d)=>{try{localStorage.setItem(k,JSON.stringify(d))}catch(e){console.error(e)}};
const SK={anchors:"wg2-anchors",anchorLog:"wg2-anchor-log",accLog:"wg2-acc-log",fatigue:"wg2-fatigue",
  banned:"wg2-banned",prefs:"wg2-prefs",nutrition:"wg2-nutrition",body:"wg2-body",cardio:"wg2-cardio",
  meso:"wg2-meso",settings:"wg2-settings",history:"wg2-history"};

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
  hpress:["Dumbbell Bench Press","Incline Dumbbell Press","Decline Dumbbell Press","Dumbbell Floor Press","Push-ups","Dips","Close-grip Barbell Bench","Diamond Push-ups"],
  vpress:["Barbell Overhead Press","Dumbbell Arnold Press","Landmine Press","Single-arm Landmine Press","Pike Push-ups"],
  hpull:["Barbell Rows","Pendlay Rows","Dumbbell Rows","Chest-supported Incline DB Rows","Meadow Rows","Inverted Rows"],
  vpull:["Pull-ups","Chin-ups","Wide-grip Pull-ups","Commando Pull-ups"],
  squat:["Belt Squat","Landmine Squat","Dumbbell Goblet Squat","Dumbbell Bulgarian Split Squat","Dumbbell Lunges","Dumbbell Step-ups","Pistol Squats"],
  hinge:["Barbell Romanian Deadlifts","Dumbbell Romanian Deadlifts","Single-leg DB Romanian Deadlift","Conventional Deadlift","Sumo Deadlift","Barbell Hip Thrusts","B-stance Hip Thrust","Barbell Good Mornings","Nordic Curls"],
};
const ALL_PAT_EX=new Set(Object.values(PATTERN_MAP).flat());
const ACC_POOL=EXERCISES.filter(e=>!ALL_PAT_EX.has(e.name));

const DAY_TARGETS={long_ride:{cal:2900,pro:190,carb:320,fat:95},med_ride:{cal:2600,pro:190,carb:258,fat:90},
  hiit:{cal:2400,pro:190,carb:208,fat:90},lift:{cal:2400,pro:190,carb:208,fat:90},rest:{cal:2100,pro:190,carb:133,fat:90}};
const DAY_LABELS={long_ride:"Long ride",med_ride:"Med ride",hiit:"HIIT",lift:"Lift",rest:"Rest"};

// ── PROGRESSION ──
// ── BODYWEIGHT PROGRESSION ──
// For bw-tagged exercises: load is fixed (bodyweight + any added), progress by
// reps (or seconds for holds). Reads sets by reps only, never the weight filter.
// Returns the same 9-key shape as C; weight:"" so cards/gen show no lb target.
function bwProgression(ex,last,repRange,targetRIR,bodyWeight){
  const isHold=!!ex.hold,unit=isHold?"s":"r";
  const ls=last.sets.filter(s=>s.reps);
  if(!ls.length)return{weight:"",reps:repRange[0],sets:3,note:`First session. ${isHold?"Hold for time":`Hit ${repRange[0]} reps`} @ RIR ${targetRIR}.`,isNew:true,ramp:null};
  const avgR=Math.round(ls.reduce((a,s)=>a+(+s.reps),0)/ls.length);
  const added=ls.map(s=>+s.weight||0);
  const avgAdd=Math.round(added.reduce((a,b)=>a+b,0)/added.length);
  const load=(+bodyWeight||0)+avgAdd;
  const loadStr=load>0?`${load}lb`:"BW";
  const rs=ls.filter(s=>s.rir!=null&&s.rir!=="");
  const avgRIR=rs.length?Math.round(rs.reduce((a,x)=>a+(+x.rir),0)/rs.length*10)/10:null;
  const step=isHold?5:1,ceiling=repRange[1];
  if(avgRIR!==null&&avgRIR<1){const t=Math.max(repRange[0],avgR-step);
    return{weight:"",reps:t,sets:ls.length,note:`${loadStr} · last ${avgR}${unit} @ RIR ${avgRIR}. Near failure, hold ${t}${unit}.`,tooHard:true,ramp:added};}
  if(!isHold&&avgR>=ceiling&&(avgRIR===null||avgRIR<=targetRIR+0.5))
    return{weight:"",reps:ceiling,sets:ls.length,note:`${loadStr} · hit ${ceiling}${unit} ceiling${avgRIR!==null?` @ RIR ${avgRIR}`:""}. Add load or harder variation.`,progressed:true,ramp:added};
  const t=isHold?avgR+step:Math.min(avgR+step,ceiling);
  return{weight:"",reps:t,sets:ls.length,note:`${loadStr} · last ${avgR}${unit}${avgRIR!==null?` @ RIR ${avgRIR}`:""}. Target ${t}${unit} @ RIR ${targetRIR}.`,ramp:added};
}

function getProgression(name,log,repRange=[6,10],targetRIR=2,bodyWeight=0){
  const h=log[name];
  if(!h||!h.length)return{weight:"",reps:repRange[0],sets:3,note:`First session. Find weight for ${repRange[0]} reps @ RIR ${targetRIR}.`,isNew:true};
  const last=h[h.length-1];
  const exDef=EXERCISES.find(x=>x.name===name);
  if(exDef&&exDef.bw)return bwProgression(exDef,last,repRange,targetRIR,bodyWeight);
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
    if(vols[2]<vols[0]*0.9&&vols[1]<vols[0]*0.95)
      return{weight:r5(top*0.7),reps:repRange[0],sets:ls.length,note:`Performance dropped 3 sessions. Cut to 70% (${r5(top*0.7)}lb) for 1 week.`,deload:true,ramp};
  }
  const rs=ls.filter(s=>s.rir!=null&&s.rir!==""); // sets with RIR logged
  if(!rs.length){ // no RIR → can't gauge effort; hold top load, nudge reps
    const avgR=Math.round(ls.reduce((s,x)=>s+(+x.reps),0)/ls.length);
    return{weight:top,reps:Math.min(avgR+1,repRange[1]),sets:ls.length,note:`No RIR logged. Hold ${top}lb, target ${Math.min(avgR+1,repRange[1])}r.`,ramp};
  }
  let num=0,den=0;
  rs.forEach(s=>{const rtf=(+s.reps)+(+s.rir);const e=(+s.weight)*(1+rtf/30);const rel=1/(1+(+s.rir));num+=e*rel;den+=rel;});
  const e1rm=Math.round(num/den);
  const tw=r5(e1rm/(1+(repRange[0]+targetRIR)/30)); // weight for bottom-of-range @ target RIR
  const base={reps:repRange[0],sets:ls.length,ramp};
  if(tw>top)
    return{weight:tw,note:`e1RM ${e1rm} from ${rs.length} sets. Up to ${tw}lb for ${repRange[0]}r @ RIR ${targetRIR}.`,progressed:true,...base};
  if(tw<top-2)
    return{weight:tw,note:`e1RM ${e1rm} from ${rs.length} sets. Pull back to ${tw}lb for ${repRange[0]}r @ RIR ${targetRIR}.`,tooHard:true,...base};
  return{weight:tw,note:`e1RM ${e1rm} from ${rs.length} sets. Hold ${tw}lb for ${repRange[0]}r @ RIR ${targetRIR}.`,...base};
}

// ── VOLUME ──
function calcWeeklyVolume(anchorLog,accLog){
  const vol={};MUSCLES.forEach(m=>vol[m]=0);
  const weekAgo=Date.now()-7*86400000;
  Object.entries(anchorLog).forEach(([name,entries])=>{
    entries.filter(e=>new Date(e.date).getTime()>weekAgo).forEach(entry=>{
      const ex=EXERCISES.find(x=>x.name===name);if(!ex)return;
      const hardSets=entry.sets.filter(s=>s.reps&&(s.rir==null||s.rir===""||+s.rir<=4)).length;
      [...ex.p,...ex.s].forEach(({m,p})=>{vol[m]+=hardSets*(p/100);});
    });
  });
  (accLog||[]).filter(e=>new Date(e.date).getTime()>weekAgo).forEach(entry=>{
    entry.exercises?.forEach(ex=>{
      const ref=EXERCISES.find(x=>x.name===ex.name);if(!ref)return;
      const hardSets=ex.sets?.filter(s=>s.reps).length||0;
      [...ref.p,...ref.s].forEach(({m,p})=>{vol[m]+=hardSets*(p/100);});
    });
  });
  return vol;
}
const VOL_LANDMARKS={chest:{mev:8,mav:16,mrv:22},back:{mev:8,mav:16,mrv:22},shoulders:{mev:8,mav:16,mrv:26},
  biceps:{mev:6,mav:14,mrv:20},triceps:{mev:6,mav:12,mrv:18},quads:{mev:6,mav:14,mrv:20},
  hamstrings:{mev:4,mav:10,mrv:16},glutes:{mev:4,mav:12,mrv:16},calves:{mev:6,mav:12,mrv:16},
  core:{mev:4,mav:10,mrv:16},traps:{mev:4,mav:10,mrv:16},forearms:{mev:2,mav:8,mrv:14}};

// ── MESOCYCLE ──
function getMesoState(meso){
  if(!meso||!meso.startDate)return{week:0,phase:"none"};
  const weeks=Math.floor((Date.now()-new Date(meso.startDate).getTime())/(7*86400000));
  const len=meso.length||5;
  if(weeks>=len)return{week:weeks,phase:"deload"};
  return{week:weeks+1,phase:"accumulation",totalWeeks:len};
}

// ── ACCESSORIES ──
function shuffle(a){const b=[...a];for(let i=b.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[b[i],b[j]]=[b[j],b[i]];}return b;}
function genAcc(n,banned,prefs,fatigue,weekVol){
  const pool=ACC_POOL.filter(e=>!banned.includes(e.name));
  const fw={};MUSCLES.forEach(m=>{const f=fatigue[m]||0;fw[m]=f>=4?0.1:f===3?0.4:f===2?0.7:f===1?0.9:1.0;});
  const underserved=MUSCLES.filter(m=>weekVol[m]<(VOL_LANDMARKS[m]?.mev||6));
  const weighted=shuffle(pool).map(ex=>{
    const stars=prefs[ex.name]||0;const mult=stars===0?1:stars===1?1.3:stars===2?1.6:2.0;
    const allM=[...ex.p,...ex.s];const avgFw=allM.reduce((s,{m,p})=>s+fw[m]*(p/100),0);
    const underBoost=allM.some(({m})=>underserved.includes(m))?1.5:1;
    return{ex,weight:mult*avgFw*underBoost};
  }).filter(x=>x.weight>0.1).sort((a,b)=>b.weight-a.weight);
  const sel=[];const used=new Set();
  const bwLoad=(ld(SK.body,[]).slice().reverse().find(e=>e.weight)||{}).weight||0;
  for(const{ex}of weighted){
    if(sel.length>=n||used.has(ex.name))continue;
    const sug=getProgression(ex.name,ld(SK.accLog,{})||{},[10,15],2,bwLoad);
    sel.push({id:crypto.randomUUID(),name:ex.name,eq:ex.eq,cat:ex.cat,p:ex.p,s:ex.s,
      sugReps:sug.reps||10,sugWeight:sug.weight||"",locked:false,
      sets:[{reps:sug.reps||"",weight:sug.weight||"",rir:""},{reps:sug.reps||"",weight:sug.weight||"",rir:""}]});
    used.add(ex.name);
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

function SetRow({set,i,onUp,onRm,showPain,isHold}){
  const rc=set.rir!=null&&set.rir!==""?RIR_C(+set.rir):C.line;
  const pc=set.pain!=null&&set.pain!==""?PAIN_C(+set.pain):C.line;
  const[running,setRunning]=useState(false);
  const[elapsed,setElapsed]=useState(0);
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
      style={{width:62,flexShrink:0,fontFamily:mono,fontSize:13,color:running?C.alarm:C.amber,borderColor:running?C.alarm:C.line}}>{running?`⏹${elapsed}`:"⏱"}</button>}
    <input className="in" type="number" inputMode="decimal" placeholder="lbs" value={set.weight||""} onChange={e=>onUp(i,"weight",e.target.value)} style={{width:76,flexShrink:0}}/>
    <input className="in" type="number" inputMode="numeric" placeholder="RIR" value={set.rir!=null?set.rir:""} onChange={e=>onUp(i,"rir",e.target.value)}
      min="0" max="5" style={{width:58,flexShrink:0,borderColor:rc,color:set.rir!==""&&set.rir!=null?rc:C.bone}}/>
    {showPain&&<input className="in" type="number" inputMode="numeric" placeholder="P" value={set.pain!=null?set.pain:""} onChange={e=>onUp(i,"pain",e.target.value)}
      min="0" max="10" title="Joint pain 0-10" style={{width:50,flexShrink:0,borderColor:pc,color:set.pain!==""&&set.pain!=null?pc:C.bone}}/>}
    <button className="x" onClick={()=>onRm(i)}>✕</button>
  </div>);
}

function VolDash({weekVol}){
  const main=["chest","back","shoulders","quads","hamstrings","glutes","biceps","triceps"];
  return(<div className="card" style={{padding:"12px 12px 8px"}}>
    <div style={{fontFamily:disp,fontWeight:700,fontSize:12,letterSpacing:2.5,color:C.steel,textTransform:"uppercase",marginBottom:9}}>Weekly volume · hard sets</div>
    {main.map(m=>{
      const v=Math.round(weekVol[m]||0);const lm=VOL_LANDMARKS[m]||{mev:6,mav:14,mrv:20};
      const pct=Math.min(v/lm.mrv*100,110);
      const c=v<lm.mev?C.alarm:v<=lm.mav?C.go:v<=lm.mrv?C.warn:C.alarm;
      const label=v<lm.mev?"<MEV":v<=lm.mav?"MEV+":v<=lm.mrv?"MAV+":">MRV";
      return(<div key={m} className="vol-row">
        <div className="vol-name">{m.slice(0,6)}</div>
        <div className="vol-track">
          <div className="vol-tick" style={{left:`${lm.mev/lm.mrv*100}%`}}/>
          <div className="vol-tick" style={{left:`${lm.mav/lm.mrv*100}%`}}/>
          <div className="vol-fill" style={{width:`${pct}%`,background:c}}/>
        </div>
        <div className="vol-val" style={{color:c}}>{v} {label}</div>
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
  const[setup,setSetup]=useState(false);
  const[dayType,setDayType]=useState("lift");
  const[accCount]=useState(3);
  const[sessionStart,setSessionStart]=useState(null);
  const[sessionMode,setSessionMode]=useState("full");
  const[quickExs,setQuickExs]=useState([]);

  const allSet=PATTERNS.every(p=>anchors[p.id]);
  const mesoState=getMesoState(meso);
  const weekVol=useMemo(()=>calcWeeklyVolume(anchorLog,accLog),[anchorLog,accLog]);
  const today=new Date().toISOString().slice(0,10);
  const targets=DAY_TARGETS[dayType]||DAY_TARGETS.lift;
  const todayNut=nutrition.filter(d=>d.date===today);
  const nutTotals=todayNut.reduce((s,e)=>({cal:s.cal+e.cal,pro:s.pro+e.pro,carb:s.carb+e.carb,fat:s.fat+e.fat}),{cal:0,pro:0,carb:0,fat:0});

  const initSession=useCallback(()=>{
    const sets={};const isDeload=mesoState.phase==="deload";
    PATTERNS.forEach(p=>{
      if(!anchors[p.id])return;
      const prog=getProgression(anchors[p.id],anchorLog,[6,10],2,latestBW);
      const n=isDeload?2:(prog.sets||3);
      const w=isDeload&&prog.weight?Math.round(+prog.weight*0.7):prog.weight;
      // ── LIVE: flat prescription (every set same weight) ──
      sets[p.id]=Array.from({length:n},()=>({reps:prog.reps||"",weight:w||"",rir:"",pain:"",ts:null}));
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
    setAccs(genAcc(accCount,banned,prefs,fatigue,weekVol));
  },[anchors,anchorLog,accCount,banned,prefs,fatigue,weekVol,mesoState.phase,latestBW]);

  useEffect(()=>{if(allSet&&!setup)initSession();},[allSet,setup]);

  const updAS=useCallback((pid,idx,f,v)=>setAnchorSets(p=>({...p,[pid]:p[pid].map((s,i)=>i===idx?{...s,[f]:v}:s)})),[]);
  const rmAS=useCallback((pid,idx)=>setAnchorSets(p=>({...p,[pid]:p[pid].filter((_,i)=>i!==idx)})),[]);
  const addAS=useCallback(pid=>setAnchorSets(p=>({...p,[pid]:[...(p[pid]||[]),{reps:"",weight:"",rir:"",pain:""}]})),[]);
  const updAcc=useCallback((id,idx,f,v)=>setAccs(p=>p.map(a=>a.id===id?{...a,sets:a.sets.map((s,i)=>i===idx?{...s,[f]:v}:s)}:a)),[]);
  const rmAcc=useCallback((id,idx)=>setAccs(p=>p.map(a=>a.id===id?{...a,sets:a.sets.filter((_,i)=>i!==idx)}:a)),[]);
  const addAccSet=useCallback(id=>setAccs(p=>p.map(a=>a.id===id?{...a,sets:[...a.sets,{reps:"",weight:"",rir:""}]}:a)),[]);
  const togLock=useCallback(id=>setAccs(p=>p.map(a=>a.id===id?{...a,locked:!a.locked}:a)),[]);
  const rerollAcc=useCallback(()=>{const locked=accs.filter(a=>a.locked);const newAccs=genAcc(accCount-locked.length,banned,prefs,fatigue,weekVol);setAccs([...locked,...newAccs]);},[accs,accCount,banned,prefs,fatigue,weekVol]);

  const saveSession=useCallback(()=>{
    const newAL={...anchorLog};
    PATTERNS.forEach(p=>{
      if(!anchors[p.id]||!anchorSets[p.id])return;
      const logged=anchorSets[p.id].filter(s=>s.reps);if(!logged.length)return;
      const nm=anchors[p.id];if(!newAL[nm])newAL[nm]=[];
      newAL[nm].push({date:new Date().toISOString(),sets:logged.map(s=>({reps:+s.reps,weight:+s.weight||0,rir:s.rir!==""?+s.rir:null,pain:s.pain!==""?+s.pain:null}))});
      if(newAL[nm].length>40)newAL[nm]=newAL[nm].slice(-40);
    });
    setAnchorLog(newAL);sv(SK.anchorLog,newAL);
    const accEntry={date:new Date().toISOString(),exercises:accs.filter(a=>a.sets.some(s=>s.reps)).map(a=>({name:a.name,sets:a.sets.filter(s=>s.reps).map(s=>({reps:+s.reps,weight:+s.weight||0,rir:s.rir!==""?+s.rir:null}))}))};
    const newAccLog=[...accLog,accEntry].slice(-40);setAccLog(newAccLog);sv(SK.accLog,newAccLog);
    const accProg=ld(SK.accLog+"_prog",{});
    accs.forEach(a=>{const lsd=a.sets.filter(s=>s.reps);if(!lsd.length)return;
      if(!accProg[a.name])accProg[a.name]=[];
      accProg[a.name].push({date:new Date().toISOString(),sets:lsd.map(s=>({reps:+s.reps,weight:+s.weight||0,rir:s.rir!==""?+s.rir:null}))});
      if(accProg[a.name].length>20)accProg[a.name]=accProg[a.name].slice(-20);
    });sv(SK.accLog+"_prog",accProg);
    const nf={...fatigue};
    PATTERNS.forEach(p=>{
      const sets=anchorSets[p.id]||[];
      const pains=sets.filter(s=>s.pain!=null&&s.pain!=="").map(s=>+s.pain);
      if(pains.length){const avg=pains.reduce((a,b)=>a+b,0)/pains.length;
        p.muscles.forEach(m=>{nf[m]=Math.min(4,Math.max(nf[m]||0,Math.round(avg/2.5)));});}
    });
    setFatigue(nf);sv(SK.fatigue,nf);
    if(!meso.startDate){const nm={startDate:new Date().toISOString(),length:5};setMeso(nm);sv(SK.meso,nm);}
    const duration=sessionStart?Math.round((Date.now()-sessionStart)/60000):null;
    const histEntry={date:new Date().toISOString(),mode:sessionMode,durationMin:duration,
      anchors:Object.fromEntries(PATTERNS.map(p=>[p.id,{name:anchors[p.id],sets:anchorSets[p.id]||[]}])),
      accessories:accEntry.exercises};
    const histArr=[...sessHist,histEntry].slice(-50);
    setSessHist(histArr);sv(SK.history,histArr);
    setSessionStart(null);setSessionMode("full");
    initSession();
  },[anchorLog,anchors,anchorSets,accs,accLog,fatigue,meso,initSession,sessionStart,sessionMode,sessHist]);

  const delHistEntry=useCallback(date=>{const all=sessHist.filter(x=>x.date!==date);setSessHist(all);sv(SK.history,all);},[sessHist]);
  const selAnchor=useCallback((pid,name)=>setAnchors(p=>{const n={...p,[pid]:name};sv(SK.anchors,n);return n;}),[]);
  const startDeload=useCallback(()=>{const nm={startDate:new Date().toISOString(),length:1};setMeso(nm);sv(SK.meso,nm);},[]);
  const newMeso=useCallback(()=>{const nm={startDate:new Date().toISOString(),length:5};setMeso(nm);sv(SK.meso,nm);initSession();},[initSession]);

  // Nutrition
  const[nCal,setNCal]=useState("");const[nPro,setNPro]=useState("");const[nCarb,setNCarb]=useState("");const[nFat,setNFat]=useState("");const[nNote,setNNote]=useState("");
  const addNut=useCallback(()=>{if(!nCal)return;const e={date:today,cal:+nCal||0,pro:+nPro||0,carb:+nCarb||0,fat:+nFat||0,note:nNote,time:new Date().toISOString()};
    setNutrition(p=>{const n=[...p,e].slice(-1000);sv(SK.nutrition,n);return n;});setNCal("");setNPro("");setNCarb("");setNFat("");setNNote("");},[nCal,nPro,nCarb,nFat,nNote,today]);
  const delNut=useCallback(time=>{setNutrition(p=>{const n=p.filter(e=>e.time!==time);sv(SK.nutrition,n);return n;});},[]);
  // Body
  const[bW,setBW]=useState("");const[bWa,setBWa]=useState("");const[bNa,setBNa]=useState("");const[bLA,setBLA]=useState("");const[bRA,setBRA]=useState("");const[bLT,setBLT]=useState("");const[bRT,setBRT]=useState("");
  const addBody=useCallback(()=>{if(!bW&&!bWa&&!bNa&&!bLA&&!bRA&&!bLT&&!bRT)return;
    const e={date:today,weight:+bW||null,waist:+bWa||null,navel:+bNa||null,lArm:+bLA||null,rArm:+bRA||null,lThigh:+bLT||null,rThigh:+bRT||null,time:new Date().toISOString()};
    setBodyData(p=>{const n=[...p,e].slice(-500);sv(SK.body,n);return n;});
    setBW("");setBWa("");setBNa("");setBLA("");setBRA("");setBLT("");setBRT("");},[bW,bWa,bNa,bLA,bRA,bLT,bRT,today]);
  const delBody=useCallback(time=>{setBodyData(p=>{const n=p.filter(e=>e.time!==time);sv(SK.body,n);return n;});},[]);
  // Cardio
  const[cType,setCType]=useState("steady");const[cDur,setCDur]=useState("");const[cHR,setCHR]=useState("");const[cConf,setCConf]=useState("");
  const addCardio=useCallback(()=>{if(!cDur)return;const e={date:today,type:cType,duration:+cDur,avgHR:+cHR||null,config:cType==="hiit"?cConf:"",time:new Date().toISOString()};
    setCardioData(p=>{const n=[...p,e].slice(-500);sv(SK.cardio,n);return n;});setCDur("");setCHR("");setCConf("");},[cType,cDur,cHR,cConf,today]);
  const delCardio=useCallback(time=>{setCardioData(p=>{const n=p.filter(e=>e.time!==time);sv(SK.cardio,n);return n;});},[]);
  const clearAllData=useCallback(()=>{if(!confirm("Delete ALL data? This cannot be undone."))return;
    Object.values(SK).forEach(k=>localStorage.removeItem(k));localStorage.removeItem(SK.accLog+"_prog");
    window.location.reload();},[]);

  const dateStr=new Date().toLocaleDateString("en-US",{weekday:"short",month:"short",day:"numeric"});

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

      <VolDash weekVol={weekVol}/>

      {!allSet||setup?<>
        <div className="eyebrow"><span style={{color:C.arc}}>Select 6 anchors</span></div>
        {PATTERNS.map(p=><div key={p.id} className="card plate">
          <div className="pat-eyebrow">{p.full}</div>
          <div className="pillwrap">
            {(PATTERN_MAP[p.id]||[]).filter(n=>!banned.includes(n)).map(name=>(
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
          {PATTERNS.map(p=>{
            if(!anchors[p.id])return null;
            const prog=getProgression(anchors[p.id],anchorLog,[6,10],2,latestBW);
            const sets=anchorSets[p.id]||[];
            const hasPain=sets.some(s=>s.pain!=null&&s.pain!==""&&+s.pain>=6);
            const stripe=hasPain?C.alarm:prog.deload?C.alarm:prog.progressed?C.go:C.arc;
            const chip=prog.deload?{t:"DELOAD",c:C.alarm}:prog.progressed?{t:"LOAD UP",c:C.go}:prog.tooEasy?{t:"ADD REP",c:C.warn}:prog.tooHard?{t:"BACK OFF",c:C.alarm}:prog.isNew?{t:"NEW",c:C.steel}:{t:"TARGET",c:C.arc};
            return(<div key={p.id} className="card" style={{borderLeft:`3px solid ${stripe}`}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                <div>
                  <div className="pat-eyebrow">{p.label}</div>
                  <div className="ex-name">{anchors[p.id]}</div>
                </div>
                {hasPain&&<div className="flag">RED PAIN</div>}
              </div>
              <div className="readout">
                <span className="chip" style={{color:chip.c,background:`${chip.c}1c`,border:`1px solid ${chip.c}44`}}>{chip.t}</span>
                <p>{prog.note}{prog.weight?<span className="tgt"> → {prog.reps}r × {prog.weight}lb</span>:null}</p>
              </div>
              {sets.map((s,i)=><SetRow key={i} set={s} i={i} showPain={true} isHold={!!(EXERCISES.find(x=>x.name===anchors[p.id])||{}).hold}
                onUp={(idx,f,v)=>updAS(p.id,idx,f,v)} onRm={idx=>rmAS(p.id,idx)}/>)}
              <button className="addset" onClick={()=>addAS(p.id)}>+ set</button>
            </div>);
          })}

          <div className="eyebrow">
            <span style={{color:C.amber}}>Accessories</span>
            <button className="btn-ghost act" onClick={rerollAcc}>Reroll</button>
          </div>
          {accs.map(a=><div key={a.id} className="card" style={{borderLeft:a.locked?`3px solid ${C.amber}`:`1px solid ${C.line}`}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:8}}>
              <div style={{minWidth:0}}>
                <div className="ex-name" style={{fontSize:17}}>{a.name}</div>
                <div className="sub">{a.eq} · {[...a.p,...a.s].map(({m,p})=>`${m} ${p}%`).join(" / ")}</div>
                {a.sugWeight&&<div className="sub" style={{color:C.amber}}>Suggest {a.sugReps}r × {a.sugWeight}lb</div>}
              </div>
              <div style={{display:"flex",alignItems:"center",gap:10,flexShrink:0}}>
                <Stars value={prefs[a.name]||0} onChange={v=>{setPrefs(p=>{const n={...p,[a.name]:v};sv(SK.prefs,n);return n;});}}/>
                <button onClick={()=>togLock(a.id)} style={{fontSize:17,background:"none",border:"none",cursor:"pointer",color:a.locked?C.amber:C.line,padding:4}}>{a.locked?"\u{1F512}":"\u{1F513}"}</button>
              </div>
            </div>
            <div style={{marginTop:4}}>
              {a.sets.map((s,i)=><SetRow key={i} set={s} i={i} showPain={false} isHold={!!(EXERCISES.find(x=>x.name===a.name)||{}).hold}
                onUp={(idx,f,v)=>updAcc(a.id,idx,f,v)} onRm={idx=>rmAcc(a.id,idx)}/>)}
            </div>
            <button className="addset" onClick={()=>addAccSet(a.id)}>+ set</button>
          </div>)}
        </>}

        <button className="btn btn-go" style={{width:"100%",height:56,fontSize:16,marginTop:14}} onClick={saveSession}>Save session</button>
      </>}
    </>}

    {/* ════ LOG ════ */}
    {view==="log"&&<>
      <div className="eyebrow"><span style={{color:C.amber}}>Day type</span></div>
      <div className="daytypes">
        {Object.keys(DAY_TARGETS).map(dt=><button key={dt} className={`daytype${dayType===dt?" on":""}`} onClick={()=>setDayType(dt)}>{DAY_LABELS[dt]}</button>)}
      </div>

      <div className="card">
        <div className="target-line">Target {targets.cal} cal · P {targets.pro}g · C {targets.carb}g · F {targets.fat}g</div>
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
        {todayNut.length>0&&<div style={{marginTop:8}}>
          {todayNut.slice().reverse().map((e,i)=><div key={i} className="entry">
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
        <div className="grid4">
          <input className="in sm" type="number" inputMode="decimal" placeholder="L arm" value={bLA} onChange={e=>setBLA(e.target.value)} style={{flex:1}}/>
          <input className="in sm" type="number" inputMode="decimal" placeholder="R arm" value={bRA} onChange={e=>setBRA(e.target.value)} style={{flex:1}}/>
          <input className="in sm" type="number" inputMode="decimal" placeholder="L thigh" value={bLT} onChange={e=>setBLT(e.target.value)} style={{flex:1}}/>
          <input className="in sm" type="number" inputMode="decimal" placeholder="R thigh" value={bRT} onChange={e=>setBRT(e.target.value)} style={{flex:1}}/>
        </div>
        <button className="btn btn-go" style={{width:"100%",height:44,fontSize:13}} onClick={addBody}>Log measurements</button>
        {bodyData.length>0&&<div style={{marginTop:8}}>
          {bodyData.slice(-5).reverse().map((e,i)=><div key={i} className="entry">
            <span>{e.date} · {e.weight&&`${e.weight}lb `}{e.waist&&`W${e.waist} `}{e.navel&&`N${e.navel} `}{e.lArm&&`LA${e.lArm} `}{e.rArm&&`RA${e.rArm} `}{e.lThigh&&`LT${e.lThigh} `}{e.rThigh&&`RT${e.rThigh}`}</span>
            <button className="x" onClick={()=>delBody(e.time||e.date)}>✕</button>
          </div>)}
        </div>}
      </div>

      <div className="eyebrow"><span style={{color:C.amber}}>Cardio</span></div>
      <div className="card">
        <div className="grid3">
          <select className="in sm" value={cType} onChange={e=>setCType(e.target.value)} style={{width:96,flexShrink:0}}>
            <option value="steady">Steady</option><option value="hiit">HIIT</option><option value="walk">Walk</option>
          </select>
          <input className="in sm" type="number" inputMode="numeric" placeholder="min" value={cDur} onChange={e=>setCDur(e.target.value)} style={{flex:1}}/>
          <input className="in sm" type="number" inputMode="numeric" placeholder="avg HR" value={cHR} onChange={e=>setCHR(e.target.value)} style={{flex:1}}/>
        </div>
        {cType==="hiit"&&<input className="in sm" type="text" placeholder="config · 4x4min @175bpm" value={cConf} onChange={e=>setCConf(e.target.value)} style={{width:"100%",marginBottom:6}}/>}
        <button className="btn btn-go" style={{width:"100%",height:44,fontSize:13}} onClick={addCardio}>Log cardio</button>
        {cardioData.length>0&&<div style={{marginTop:8}}>
          {cardioData.slice(-5).reverse().map((e,i)=><div key={i} className="entry">
            <span>{e.date} · {e.type} {e.duration}min {e.avgHR&&`· HR ${e.avgHR}`} {e.config&&<span style={{color:C.dim}}>({e.config})</span>}</span>
            <button className="x" onClick={()=>delCardio(e.time||e.date)}>✕</button>
          </div>)}
        </div>}
      </div>

      <button className="btn-ghost red" style={{width:"100%",height:44,marginTop:18,borderRadius:9,fontFamily:disp,fontWeight:700,letterSpacing:2,fontSize:12,textTransform:"uppercase"}} onClick={clearAllData}>Clear all data</button>
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
          {hist.map((h,i)=><div key={i} className="entry">
            <span>{new Date(h.date).toLocaleDateString("en-US",{month:"short",day:"numeric"})} · {h.mode==="quick"?"Quick":"Full"} {h.durationMin?`· ${h.durationMin}min`:""} · {Object.values(h.anchors||{}).filter(a=>a.sets?.some(s=>s.reps)).length} anchors</span>
            <button className="x" onClick={()=>delHistEntry(h.date)}>✕</button>
          </div>)}
        </div>;
      })()}

      <div className="eyebrow"><span style={{color:C.arc}}>Anchor progression</span></div>
      {PATTERNS.map(p=>{
        const nm=anchors[p.id];if(!nm)return null;const h=anchorLog[nm];
        if(!h||!h.length)return<div key={p.id} className="sub" style={{marginBottom:6}}>{p.label} · {nm} — no data yet</div>;
        const ents=h.slice(-10);
        const e1rms=ents.map(e=>{const b=e.sets.filter(s=>s.weight&&s.reps).sort((a,b)=>(b.weight*b.reps)-(a.weight*a.reps))[0];
          return b?Math.round(b.weight*(1+b.reps/30)):0}).filter(Boolean);
        const maxE=Math.max(...e1rms,1);
        const delta=e1rms.length>=2?e1rms[e1rms.length-1]-e1rms[0]:0;
        return(<div key={p.id} className="card plate">
          <div className="pat-eyebrow">{p.label}</div>
          <div className="ex-name" style={{fontSize:17}}>{nm}</div>
          <div className="bars">
            {e1rms.map((v,i)=><div key={i} className="bar" style={{height:`${Math.max((v/maxE)*100,8)}%`,background:i===e1rms.length-1?C.arc:`${C.arc}55`}}/>)}
          </div>
          <div className="stat">
            <span>e1RM <b style={{color:C.bone}}>{e1rms[e1rms.length-1]||"--"}lb</b>{e1rms.length>=2&&<span style={{color:delta>=0?C.go:C.alarm}}> ({delta>0?"+":""}{delta})</span>} · {h.length} sessions</span>
            <button className="btn-ghost red" style={{fontSize:9,padding:"3px 8px"}}
              onClick={()=>{const newLog={...anchorLog};if(newLog[nm]&&newLog[nm].length>0){newLog[nm]=newLog[nm].slice(0,-1);setAnchorLog(newLog);sv(SK.anchorLog,newLog);}}}>del last</button>
          </div>
        </div>);
      })}

      <VolDash weekVol={weekVol}/>

      <div className="eyebrow"><span style={{color:C.amber}}>Body</span></div>
      {bodyData.length===0?<div className="empty">No measurements yet</div>:
        <div className="card">
          {bodyData.slice(-10).reverse().map((e,i)=><div key={i} className="entry">
            <span>{e.date} · {e.weight&&`${e.weight}lb `}{e.waist&&`W${e.waist} `}{e.navel&&`N${e.navel} `}{e.lArm&&`LA${e.lArm} `}{e.rArm&&`RA${e.rArm} `}{e.lThigh&&`LT${e.lThigh} `}{e.rThigh&&`RT${e.rThigh}`}</span>
          </div>)}
        </div>}
      {bodyData.length>=2&&(()=>{const f=bodyData[0],l=bodyData[bodyData.length-1];
        return<div className="delta-box">
          {f.weight&&l.weight?<div>Weight {f.weight} → {l.weight} <span style={{color:l.weight<f.weight?C.go:C.alarm}}>({l.weight>f.weight?"+":""}{(l.weight-f.weight).toFixed(1)})</span></div>:null}
          {f.waist&&l.waist?<div>Waist {f.waist}" → {l.waist}" <span style={{color:l.waist<f.waist?C.go:C.alarm}}>({l.waist>f.waist?"+":""}{(l.waist-f.waist).toFixed(1)})</span></div>:null}
          {f.navel&&l.navel?<div>Navel {f.navel}" → {l.navel}" <span style={{color:l.navel<f.navel?C.go:C.alarm}}>({l.navel>f.navel?"+":""}{(l.navel-f.navel).toFixed(1)})</span></div>:null}
          {f.lArm&&l.lArm?<div>L arm {f.lArm}" → {l.lArm}" <span style={{color:l.lArm>f.lArm?C.go:C.alarm}}>({l.lArm>f.lArm?"+":""}{(l.lArm-f.lArm).toFixed(1)})</span></div>:null}
          {f.lThigh&&l.lThigh?<div>L thigh {f.lThigh}" → {l.lThigh}" <span style={{color:l.lThigh>f.lThigh?C.go:C.alarm}}>({l.lThigh>f.lThigh?"+":""}{(l.lThigh-f.lThigh).toFixed(1)})</span></div>:null}
        </div>;})()}

      <div className="eyebrow"><span style={{color:C.amber}}>Cardio</span></div>
      {cardioData.length===0?<div className="empty">No cardio yet</div>:
        <div className="card">
          {cardioData.slice(-10).reverse().map((e,i)=><div key={i} className="entry">
            <span>{e.date} · {e.type} {e.duration}min {e.avgHR&&`· HR ${e.avgHR}`} {e.config&&<span style={{color:C.dim}}>({e.config})</span>}</span>
          </div>)}
        </div>}
    </>}
    </div>
  </div>);
}
