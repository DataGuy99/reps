import{useState,useEffect,useCallback,useMemo}from"react";
import{MUSCLES,EXERCISES}from"./exercises.js";

const ld=(k,fb)=>{try{const v=localStorage.getItem(k);return v?JSON.parse(v):fb}catch{return fb}};
const sv=(k,d)=>{try{localStorage.setItem(k,JSON.stringify(d))}catch(e){console.error(e)}};
const SK={anchors:"wg2-anchors",anchorLog:"wg2-anchor-log",accLog:"wg2-acc-log",fatigue:"wg2-fatigue",
  banned:"wg2-banned",prefs:"wg2-prefs",nutrition:"wg2-nutrition",body:"wg2-body",cardio:"wg2-cardio",
  meso:"wg2-meso",settings:"wg2-settings",history:"wg2-history"};
const mono="'JetBrains Mono','Fira Code',monospace";
const FC=["#22c55e","#84cc16","#eab308","#f97316","#ef4444"];
const FL=["Fresh","Low","Mod","High","Wreck"];
const PAIN_C=v=>v<=2?"#22c55e":v<=5?"#eab308":"#ef4444";
const PAIN_L=v=>v<=2?"GREEN":v<=5?"AMBER":"RED";
const RIR_C=v=>v<=1?"#ef4444":v<=2?"#f97316":v<=3?"#eab308":"#22c55e";

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

// Day-type nutrition targets
const DAY_TARGETS={long_ride:{cal:2600,pro:190,carb:280,fat:90},med_ride:{cal:2300,pro:190,carb:210,fat:85},
  hiit:{cal:2100,pro:190,carb:170,fat:80},lift:{cal:2100,pro:190,carb:170,fat:80},rest:{cal:1800,pro:190,carb:110,fat:75}};

// ── PROGRESSION ──
function getProgression(name,log,repRange=[6,10],targetRIR=2){
  const h=log[name];
  if(!h||!h.length)return{weight:"",reps:repRange[0],sets:3,note:`First session. Find weight for ${repRange[0]} reps @ RIR ${targetRIR}.`,isNew:true};
  const last=h[h.length-1];const ls=last.sets.filter(s=>s.reps&&s.weight);
  if(!ls.length)return{weight:"",reps:repRange[0],sets:3,note:"No data last session.",isNew:true};
  const w=+ls[0].weight,avgR=Math.round(ls.reduce((s,x)=>s+(+x.reps),0)/ls.length);
  const rirsValid=ls.filter(s=>s.rir!=null&&s.rir!=="");
  const avgRIR=rirsValid.length?Math.round(rirsValid.reduce((s,x)=>s+(+x.rir),0)/rirsValid.length*10)/10:null;
  const allTop=ls.every(s=>+s.reps>=repRange[1]);
  const atTarget=avgRIR!==null&&avgRIR<=targetRIR+0.5;
  // Check for regression (deload signal)
  if(h.length>=3){
    const recent3=h.slice(-3);
    const vols=recent3.map(s=>{const ss=s.sets.filter(x=>x.reps&&x.weight);return ss.reduce((a,x)=>a+(+x.reps)*(+x.weight),0);});
    if(vols[2]<vols[0]*0.9&&vols[1]<vols[0]*0.95){
      return{weight:Math.round(w*0.7),reps:repRange[0],sets:ls.length,note:`DELOAD: Performance dropped 3 sessions. Cut to 70% (${Math.round(w*0.7)}lb) for 1 week.`,deload:true};
    }
  }
  if(allTop&&atTarget){const inc=w>=100?5:w>=40?5:2.5;
    return{weight:w+inc,reps:repRange[0],sets:ls.length,note:`Hit ${repRange[1]} reps @ RIR ${avgRIR}. UP +${inc}lb, reset to ${repRange[0]}.`,progressed:true};}
  if(avgRIR!==null&&avgRIR>targetRIR+1)
    return{weight:w,reps:Math.min(avgR+1,repRange[1]),sets:ls.length,note:`RIR ${avgRIR} too easy. Add rep. Target RIR ${targetRIR}.`,tooEasy:true};
  if(avgRIR!==null&&avgRIR<1)
    return{weight:Math.max(0,w-5),reps:avgR,sets:ls.length,note:`RIR ${avgRIR}: too close to failure. Back off -5lb.`,tooHard:true};
  return{weight:w,reps:Math.min(avgR+1,repRange[1]),sets:ls.length,
    note:`Last: ${avgR}r x ${w}lb${avgRIR!==null?` @ RIR ${avgRIR}`:""}. Target: ${Math.min(avgR+1,repRange[1])}r @ RIR ${targetRIR}.`};
}

// ── VOLUME TRACKING ──
function calcWeeklyVolume(anchorLog,accLog,anchors){
  const vol={};MUSCLES.forEach(m=>vol[m]=0);
  const weekAgo=Date.now()-7*86400000;
  // From anchor sessions
  Object.entries(anchorLog).forEach(([name,entries])=>{
    entries.filter(e=>new Date(e.date).getTime()>weekAgo).forEach(entry=>{
      const ex=EXERCISES.find(x=>x.name===name);if(!ex)return;
      const hardSets=entry.sets.filter(s=>s.reps&&(s.rir==null||s.rir===""||+s.rir<=4)).length;
      [...ex.p,...ex.s].forEach(({m,p})=>{vol[m]+=hardSets*(p/100);});
    });
  });
  // From accessory log
  (accLog||[]).filter(e=>new Date(e.date).getTime()>weekAgo).forEach(entry=>{
    entry.exercises?.forEach(ex=>{
      const ref=EXERCISES.find(x=>x.name===ex.name);if(!ref)return;
      const hardSets=ex.sets?.filter(s=>s.reps).length||0;
      [...ref.p,...ref.s].forEach(({m,p})=>{vol[m]+=hardSets*(p/100);});
    });
  });
  return vol;
}

// Volume landmarks (approximate, per Israetel)
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
  // Prioritize muscles below MEV
  const underserved=MUSCLES.filter(m=>weekVol[m]<(VOL_LANDMARKS[m]?.mev||6));
  const weighted=shuffle(pool).map(ex=>{
    const stars=prefs[ex.name]||0;const mult=stars===0?1:stars===1?1.3:stars===2?1.6:2.0;
    const allM=[...ex.p,...ex.s];const avgFw=allM.reduce((s,{m,p})=>s+fw[m]*(p/100),0);
    const underBoost=allM.some(({m})=>underserved.includes(m))?1.5:1;
    return{ex,weight:mult*avgFw*underBoost};
  }).filter(x=>x.weight>0.1).sort((a,b)=>b.weight-a.weight);
  const sel=[];const used=new Set();
  for(const{ex}of weighted){
    if(sel.length>=n||used.has(ex.name))continue;
    const sug=getProgression(ex.name,ld(SK.accLog,{})||{},[10,15],2);
    sel.push({id:crypto.randomUUID(),name:ex.name,eq:ex.eq,cat:ex.cat,p:ex.p,s:ex.s,
      sugReps:sug.reps||10,sugWeight:sug.weight||"",locked:false,
      sets:[{reps:sug.reps||"",weight:sug.weight||"",rir:""},{reps:sug.reps||"",weight:sug.weight||"",rir:""}]});
    used.add(ex.name);
  }
  return sel;
}


function SessionTimer({start}){
  const[now,setNow]=useState(Date.now());
  useEffect(()=>{const t=setInterval(()=>setNow(Date.now()),1000);return()=>clearInterval(t);},[]);
  const s=Math.floor((now-start)/1000);const m=Math.floor(s/60);const h=Math.floor(m/60);
  return<div style={{fontSize:11,color:"#22c55e",fontFamily:mono,fontWeight:700}}>
    {h>0?`${h}:${String(m%60).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`:`${m}:${String(s%60).padStart(2,"0")}`}</div>;
}

// ── UI HELPERS ──
const Stars=({value,onChange,size=14})=>(<div style={{display:"flex",gap:2}}>
  {[1,2,3].map(s=><span key={s} onClick={e=>{e.stopPropagation();onChange(value===s?0:s);}}
    style={{cursor:"pointer",fontSize:size,color:s<=value?"#f59e0b":"#334155",userSelect:"none",lineHeight:1}}>★</span>)}</div>);

function SetRow({set,i,onUp,onRm,showPain}){
  const rc=set.rir!=null&&set.rir!==""?RIR_C(+set.rir):"#475569";
  const pc=set.pain!=null&&set.pain!==""?PAIN_C(+set.pain):"#475569";
  return(<div style={{display:"flex",alignItems:"center",gap:3,padding:"2px 0"}}>
    <div style={{width:16,fontSize:8,color:"#64748b",fontFamily:mono}}>{i+1}</div>
    <input type="number" placeholder="reps" value={set.reps||""} onChange={e=>onUp(i,"reps",e.target.value)}
      style={{flex:1,height:28,background:"#1e293b",border:"1px solid #334155",borderRadius:3,color:"#e2e8f0",padding:"0 6px",fontSize:10,fontFamily:mono}}/>
    <input type="number" placeholder="lbs" value={set.weight||""} onChange={e=>onUp(i,"weight",e.target.value)}
      style={{width:52,height:28,background:"#1e293b",border:"1px solid #334155",borderRadius:3,color:"#e2e8f0",padding:"0 6px",fontSize:10,fontFamily:mono}}/>
    <input type="number" placeholder="RIR" value={set.rir!=null?set.rir:""} onChange={e=>onUp(i,"rir",e.target.value)}
      min="0" max="5" style={{width:38,height:28,background:"#1e293b",border:`1px solid ${rc}`,borderRadius:3,color:rc,padding:"0 4px",fontSize:10,fontFamily:mono}}/>
    {showPain&&<input type="number" placeholder="P" value={set.pain!=null?set.pain:""} onChange={e=>onUp(i,"pain",e.target.value)}
      min="0" max="10" title="Joint pain 0-10" style={{width:32,height:28,background:"#1e293b",border:`1px solid ${pc}`,borderRadius:3,color:pc,padding:"0 4px",fontSize:10,fontFamily:mono}}/>}
    <button onClick={()=>onRm(i)} style={{width:18,height:18,background:"none",border:"none",color:"#ef444466",cursor:"pointer",fontSize:11}}>x</button>
  </div>);
}

function VolDash({weekVol}){
  const main=["chest","back","shoulders","quads","hamstrings","glutes","biceps","triceps"];
  return(<div style={{marginBottom:12}}>
    <div style={{fontSize:9,color:"#94a3b8",letterSpacing:1,marginBottom:4,fontFamily:mono}}>WEEKLY VOLUME (hard sets)</div>
    {main.map(m=>{
      const v=Math.round(weekVol[m]||0);const lm=VOL_LANDMARKS[m]||{mev:6,mav:14,mrv:20};
      const pct=Math.min(v/lm.mrv*100,110);
      const c=v<lm.mev?"#ef4444":v<=lm.mav?"#22c55e":v<=lm.mrv?"#eab308":"#ef4444";
      const label=v<lm.mev?"<MEV":v<=lm.mav?"MEV-MAV":v<=lm.mrv?"MAV-MRV":">MRV";
      return(<div key={m} style={{display:"flex",alignItems:"center",gap:4,marginBottom:2}}>
        <div style={{width:52,fontSize:8,color:"#94a3b8",textTransform:"uppercase",fontFamily:mono}}>{m.slice(0,5)}</div>
        <div style={{flex:1,height:10,background:"#1e293b",borderRadius:2,overflow:"hidden",position:"relative"}}>
          <div style={{position:"absolute",left:`${lm.mev/lm.mrv*100}%`,width:1,height:"100%",background:"#ffffff22"}}/>
          <div style={{position:"absolute",left:`${lm.mav/lm.mrv*100}%`,width:1,height:"100%",background:"#ffffff22"}}/>
          <div style={{width:`${pct}%`,height:"100%",background:c,borderRadius:2,transition:"width 0.3s"}}/>
        </div>
        <div style={{width:50,fontSize:8,color:c,fontFamily:mono,textAlign:"right"}}>{v} {label}</div>
      </div>);
    })}
  </div>);
}


// Quick/maintenance mode: bodyweight only, no equipment loading, 1 set each, all groups
const QUICK_BW=[
  {name:"Pull-ups",muscles:"back, biceps",reps:"max"},
  {name:"Push-ups",muscles:"chest, triceps, shoulders",reps:"max"},
  {name:"Dips",muscles:"chest, triceps, shoulders",reps:"max"},
  {name:"Bodyweight Squats",muscles:"quads, glutes",reps:"20-30"},
  {name:"Nordic Curls",muscles:"hamstrings, glutes",reps:"max"},
  {name:"Hanging Leg Raises",muscles:"core",reps:"max"},
];

function genQuickSession(){
  return QUICK_BW.map(ex=>({
    id:crypto.randomUUID(),name:ex.name,muscles:ex.muscles,sugReps:ex.reps,
    sets:[{reps:"",weight:"BW",rir:"",pain:""}],
  }));
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
  const[cardioData,setCardioData]=useState(()=>ld(SK.cardio,[]));
  const[meso,setMeso]=useState(()=>ld(SK.meso,{startDate:null,length:5}));
  const[setup,setSetup]=useState(false);
  const[dayType,setDayType]=useState("lift");
  const[accCount]=useState(3);
  const[sessionStart,setSessionStart]=useState(null);
  const[sessionMode,setSessionMode]=useState("full"); // "full" or "quick"
  const[setTimestamps,setSetTimestamps]=useState([]);
  const[quickExs,setQuickExs]=useState([]);

  const allSet=PATTERNS.every(p=>anchors[p.id]);
  const mesoState=getMesoState(meso);
  const weekVol=useMemo(()=>calcWeeklyVolume(anchorLog,accLog,anchors),[anchorLog,accLog,anchors]);
  const today=new Date().toISOString().slice(0,10);
  const targets=DAY_TARGETS[dayType]||DAY_TARGETS.lift;
  const todayNut=nutrition.filter(d=>d.date===today);
  const nutTotals=todayNut.reduce((s,e)=>({cal:s.cal+e.cal,pro:s.pro+e.pro,carb:s.carb+e.carb,fat:s.fat+e.fat}),{cal:0,pro:0,carb:0,fat:0});

  const initSession=useCallback(()=>{
    const sets={};const isDeload=mesoState.phase==="deload";
    PATTERNS.forEach(p=>{
      if(!anchors[p.id])return;
      const prog=getProgression(anchors[p.id],anchorLog);
      const n=isDeload?2:(prog.sets||3);
      const w=isDeload&&prog.weight?Math.round(+prog.weight*0.7):prog.weight;
      sets[p.id]=Array.from({length:n},()=>({reps:prog.reps||"",weight:w||"",rir:"",pain:"",ts:null}));
    });
    setAnchorSets(sets);
    setAccs(genAcc(accCount,banned,prefs,fatigue,weekVol));
  },[anchors,anchorLog,accCount,banned,prefs,fatigue,weekVol,mesoState.phase]);

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
    // Save anchors
    const newAL={...anchorLog};
    PATTERNS.forEach(p=>{
      if(!anchors[p.id]||!anchorSets[p.id])return;
      const logged=anchorSets[p.id].filter(s=>s.reps);if(!logged.length)return;
      const nm=anchors[p.id];if(!newAL[nm])newAL[nm]=[];
      newAL[nm].push({date:new Date().toISOString(),sets:logged.map(s=>({reps:+s.reps,weight:+s.weight||0,rir:s.rir!==""?+s.rir:null,pain:s.pain!==""?+s.pain:null}))});
      if(newAL[nm].length>40)newAL[nm]=newAL[nm].slice(-40);
    });
    setAnchorLog(newAL);sv(SK.anchorLog,newAL);
    // Save accessories
    const accEntry={date:new Date().toISOString(),exercises:accs.filter(a=>a.sets.some(s=>s.reps)).map(a=>({name:a.name,sets:a.sets.filter(s=>s.reps).map(s=>({reps:+s.reps,weight:+s.weight||0,rir:s.rir!==""?+s.rir:null}))}))};
    const newAccLog=[...accLog,accEntry].slice(-40);setAccLog(newAccLog);sv(SK.accLog,newAccLog);
    // Also save acc progression data
    const accProg=ld(SK.accLog+"_prog",{});
    accs.forEach(a=>{const ls=a.sets.filter(s=>s.reps);if(!ls.length)return;
      if(!accProg[a.name])accProg[a.name]=[];
      accProg[a.name].push({date:new Date().toISOString(),sets:ls.map(s=>({reps:+s.reps,weight:+s.weight||0,rir:s.rir!==""?+s.rir:null}))});
      if(accProg[a.name].length>20)accProg[a.name]=accProg[a.name].slice(-20);
    });sv(SK.accLog+"_prog",accProg);
    // Update fatigue from pain ratings
    const nf={...fatigue};
    PATTERNS.forEach(p=>{
      const sets=anchorSets[p.id]||[];
      const pains=sets.filter(s=>s.pain!=null&&s.pain!=="").map(s=>+s.pain);
      if(pains.length){const avg=pains.reduce((a,b)=>a+b,0)/pains.length;
        p.muscles.forEach(m=>{nf[m]=Math.min(4,Math.max(nf[m]||0,Math.round(avg/2.5)));});}
    });
    setFatigue(nf);sv(SK.fatigue,nf);
    // Start mesocycle if not started
    if(!meso.startDate){const nm={startDate:new Date().toISOString(),length:5};setMeso(nm);sv(SK.meso,nm);}

    // Record session duration
    const duration=sessionStart?Math.round((Date.now()-sessionStart)/60000):null;
    const histEntry={date:new Date().toISOString(),mode:sessionMode,durationMin:duration,
      anchors:Object.fromEntries(PATTERNS.map(p=>[p.id,{name:anchors[p.id],sets:anchorSets[p.id]||[]}])),
      accessories:accEntry.exercises};
    const histArr=ld(SK.history,[]);histArr.push(histEntry);sv(SK.history,histArr.slice(-50));
    setSessionStart(null);setSessionMode("full");
    initSession();
  },[anchorLog,anchors,anchorSets,accs,accLog,fatigue,meso,initSession,sessionStart,sessionMode]);

  const selAnchor=useCallback((pid,name)=>setAnchors(p=>{const n={...p,[pid]:name};sv(SK.anchors,n);return n;}),[]);
  const startDeload=useCallback(()=>{setMeso({startDate:new Date().toISOString(),length:1});sv(SK.meso,{startDate:new Date().toISOString(),length:1});},[]);
  const newMeso=useCallback(()=>{const nm={startDate:new Date().toISOString(),length:5};setMeso(nm);sv(SK.meso,nm);initSession();},[initSession]);

  // Nutrition
  const[nCal,setNCal]=useState("");const[nPro,setNPro]=useState("");const[nCarb,setNCarb]=useState("");const[nFat,setNFat]=useState("");const[nNote,setNNote]=useState("");
  const addNut=useCallback(()=>{if(!nCal)return;const e={date:today,cal:+nCal||0,pro:+nPro||0,carb:+nCarb||0,fat:+nFat||0,note:nNote,time:new Date().toISOString()};
    setNutrition(p=>{const n=[...p,e].slice(-1000);sv(SK.nutrition,n);return n;});setNCal("");setNPro("");setNCarb("");setNFat("");setNNote("");},[nCal,nPro,nCarb,nFat,nNote,today]);
  const delNut=useCallback(time=>{setNutrition(p=>{const n=p.filter(e=>e.time!==time);sv(SK.nutrition,n);return n;});},[]);
  // Body
  const[bW,setBW]=useState("");const[bWa,setBWa]=useState("");const[bNa,setBNa]=useState("");const[bCh,setBCh]=useState("");
  const addBody=useCallback(()=>{if(!bW&&!bWa)return;const e={date:today,weight:+bW||null,waist:+bWa||null,navel:+bNa||null,chest:+bCh||null,time:new Date().toISOString()};
    setBodyData(p=>{const n=[...p,e].slice(-500);sv(SK.body,n);return n;});setBW("");setBWa("");setBNa("");setBCh("");},[bW,bWa,bNa,bCh,today]);
  const delBody=useCallback(time=>{setBodyData(p=>{const n=p.filter(e=>e.time!==time);sv(SK.body,n);return n;});},[]);
  // Cardio
  const[cType,setCType]=useState("steady");const[cDur,setCDur]=useState("");const[cHR,setCHR]=useState("");const[cConf,setCConf]=useState("");
  const addCardio=useCallback(()=>{if(!cDur)return;const e={date:today,type:cType,duration:+cDur,avgHR:+cHR||null,config:cType==="hiit"?cConf:"",time:new Date().toISOString()};
    setCardioData(p=>{const n=[...p,e].slice(-500);sv(SK.cardio,n);return n;});setCDur("");setCHR("");setCConf("");},[cType,cDur,cHR,cConf,today]);
  const delCardio=useCallback(time=>{setCardioData(p=>{const n=p.filter(e=>e.time!==time);sv(SK.cardio,n);return n;});},[]);
  const clearAllData=useCallback(()=>{if(!confirm("Delete ALL data? This cannot be undone."))return;
    Object.values(SK).forEach(k=>localStorage.removeItem(k));localStorage.removeItem(SK.accLog+"_prog");
    window.location.reload();},[]);

  const nb=(l,t)=>({flex:1,padding:"10px 0",background:"none",border:"none",borderBottom:view===t?"2px solid #f59e0b":"2px solid transparent",
    color:view===t?"#f59e0b":"#64748b",fontSize:8,fontWeight:600,cursor:"pointer",fontFamily:mono,letterSpacing:1,textTransform:"uppercase"});

  return(<div style={{background:"#020617",minHeight:"100vh",color:"#e2e8f0",fontFamily:mono,paddingBottom:80}}>
    <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;700&display=swap" rel="stylesheet"/>
    <nav style={{display:"flex",borderBottom:"1px solid #1e293b",background:"#0f172a",position:"sticky",top:0,zIndex:10}}>
      <button style={nb("L","lift")} onClick={()=>setView("lift")}>Lift</button>
      <button style={nb("N","log")} onClick={()=>setView("log")}>Log</button>
      <button style={nb("T","trends")} onClick={()=>setView("trends")}>Trends</button>
    </nav>

    <div style={{padding:"10px 8px"}}>
    {/* ── LIFT ── */}
    {view==="lift"&&<>
      {/* Meso banner */}
      {meso.startDate&&<div style={{background:mesoState.phase==="deload"?"#ef444422":"#3b82f622",border:`1px solid ${mesoState.phase==="deload"?"#ef444444":"#3b82f644"}`,borderRadius:4,padding:"6px 10px",marginBottom:8,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div style={{fontSize:9,color:mesoState.phase==="deload"?"#ef4444":"#3b82f6",fontFamily:mono}}>
          {mesoState.phase==="deload"?"DELOAD WEEK":"ACCUMULATION"} Wk {mesoState.week}/{meso.length}</div>
        <div style={{display:"flex",gap:4}}>
          {mesoState.phase!=="deload"&&<button onClick={startDeload} style={{background:"#1e293b",border:"1px solid #334155",borderRadius:3,color:"#ef4444",fontSize:8,padding:"3px 6px",cursor:"pointer",fontFamily:mono}}>Deload</button>}
          <button onClick={newMeso} style={{background:"#1e293b",border:"1px solid #334155",borderRadius:3,color:"#22c55e",fontSize:8,padding:"3px 6px",cursor:"pointer",fontFamily:mono}}>New meso</button>
        </div>
      </div>}

      <VolDash weekVol={weekVol}/>

      {!allSet||setup?<>
        <div style={{fontSize:9,color:"#3b82f6",letterSpacing:2,textTransform:"uppercase",marginBottom:8}}>Select 6 anchors</div>
        {PATTERNS.map(p=><div key={p.id} style={{background:"#0f172a",border:"1px solid #1e293b",borderRadius:6,padding:"8px 10px",marginBottom:6}}>
          <div style={{fontSize:9,color:"#3b82f6",textTransform:"uppercase",letterSpacing:1,fontFamily:mono}}>{p.full}</div>
          <div style={{display:"flex",flexWrap:"wrap",gap:3,marginTop:4}}>
            {(PATTERN_MAP[p.id]||[]).filter(n=>!banned.includes(n)).map(name=>(
              <button key={name} onClick={()=>selAnchor(p.id,name)}
                style={{padding:"4px 8px",borderRadius:3,border:"none",cursor:"pointer",fontSize:9,fontFamily:mono,
                  background:anchors[p.id]===name?"#3b82f6":"#1e293b",color:anchors[p.id]===name?"#fff":"#94a3b8"}}>{name}</button>))}
          </div>
        </div>)}
        {allSet&&<button onClick={()=>{setSetup(false);initSession();}}
          style={{width:"100%",height:40,background:"#f59e0b",border:"none",borderRadius:6,color:"#0f172a",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:mono,marginTop:8}}>Start Session</button>}
        <button onClick={()=>{setSetup(false);setSessionStart(Date.now());setSessionMode("quick");setQuickExs(genQuickSession());setAccs([]);}}
          style={{width:"100%",height:34,background:"#1e293b",border:"1px solid #f59e0b44",borderRadius:6,color:"#f59e0b",fontSize:10,fontWeight:600,cursor:"pointer",fontFamily:mono,marginTop:6}}>Quick Bodyweight (maintenance)</button>
      </>:<>
        
        {/* Session timer */}
        {sessionStart&&<div style={{background:"#22c55e11",border:"1px solid #22c55e33",borderRadius:4,padding:"6px 10px",marginBottom:8,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div style={{fontSize:9,color:"#22c55e",fontFamily:mono}}>SESSION ACTIVE</div>
          <SessionTimer start={sessionStart}/>
        </div>}

        {!sessionStart&&<div style={{display:"flex",gap:4,marginBottom:8}}>
          <button onClick={()=>{setSessionStart(Date.now());setSessionMode("full");initSession();}}
            style={{flex:2,height:34,background:"#22c55e",border:"none",borderRadius:4,color:"#0f172a",fontSize:10,fontWeight:700,cursor:"pointer",fontFamily:mono}}>START FULL</button>
          <button onClick={()=>{setSessionStart(Date.now());setSessionMode("quick");setQuickExs(genQuickSession());setAccs([]);}}
            style={{flex:1,height:34,background:"#f59e0b",border:"none",borderRadius:4,color:"#0f172a",fontSize:10,fontWeight:700,cursor:"pointer",fontFamily:mono}}>QUICK</button>
        </div>}

        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
          <div style={{fontSize:9,color:sessionMode==="quick"?"#f59e0b":"#3b82f6",letterSpacing:2,textTransform:"uppercase"}}>{sessionMode==="quick"?"Bodyweight Maintenance":"Anchors"}</div>
          <button onClick={()=>setSetup(true)} style={{background:"#1e293b",border:"1px solid #334155",borderRadius:3,color:"#64748b",fontSize:8,padding:"3px 6px",cursor:"pointer",fontFamily:mono}}>Change</button>
        </div>

        {sessionMode==="quick"&&<>
          {quickExs.map(ex=><div key={ex.id} style={{background:"#0f172a",borderLeft:"3px solid #f59e0b",border:"1px solid #1e293b",borderRadius:6,padding:"8px 10px",marginBottom:6}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div>
                <div style={{fontSize:12,fontWeight:600,color:"#f1f5f9",fontFamily:mono}}>{ex.name}</div>
                <div style={{fontSize:8,color:"#64748b",fontFamily:mono}}>{ex.muscles} | 1 set to {ex.sugReps}</div>
              </div>
            </div>
            {ex.sets.map((s,i)=><div key={i} style={{display:"flex",alignItems:"center",gap:4,padding:"3px 0"}}>
              <div style={{width:16,fontSize:8,color:"#64748b",fontFamily:mono}}>{i+1}</div>
              <input type="number" placeholder="reps" value={s.reps||""} onChange={e=>{setQuickExs(p=>p.map(x=>x.id===ex.id?{...x,sets:x.sets.map((ss,j)=>j===i?{...ss,reps:e.target.value}:ss)}:x));}}
                style={{flex:1,height:28,background:"#1e293b",border:"1px solid #334155",borderRadius:3,color:"#e2e8f0",padding:"0 6px",fontSize:10,fontFamily:mono}}/>
              <div style={{fontSize:9,color:"#475569",fontFamily:mono,width:30}}>BW</div>
              <input type="number" placeholder="RIR" value={s.rir||""} onChange={e=>{setQuickExs(p=>p.map(x=>x.id===ex.id?{...x,sets:x.sets.map((ss,j)=>j===i?{...ss,rir:e.target.value}:ss)}:x));}}
                min="0" max="5" style={{width:38,height:28,background:"#1e293b",border:"1px solid #334155",borderRadius:3,color:"#eab308",padding:"0 4px",fontSize:10,fontFamily:mono}}/>
            </div>)}
          </div>)}
        </>}

        {sessionMode==="full"&&<>
        {PATTERNS.map(p=>{
          if(!anchors[p.id])return null;
          const prog=getProgression(anchors[p.id],anchorLog);
          const sets=anchorSets[p.id]||[];
          // Check for pain red flags
          const hasPain=sets.some(s=>s.pain!=null&&s.pain!==""&&+s.pain>=6);
          return(<div key={p.id} style={{background:"#0f172a",borderLeft:`3px solid ${hasPain?"#ef4444":prog.deload?"#ef4444":prog.progressed?"#22c55e":"#3b82f6"}`,border:"1px solid #1e293b",borderRadius:6,marginBottom:6}}>
            <div style={{padding:"8px 10px"}}>
              <div style={{display:"flex",justifyContent:"space-between"}}>
                <div>
                  <div style={{fontSize:8,color:"#3b82f6",textTransform:"uppercase",letterSpacing:1}}>{p.label}</div>
                  <div style={{fontSize:12,fontWeight:600,color:"#f1f5f9"}}>{anchors[p.id]}</div>
                </div>
                {hasPain&&<div style={{fontSize:8,color:"#ef4444",padding:"2px 6px",background:"#ef444422",borderRadius:3,height:16}}>RED PAIN</div>}
              </div>
              <div style={{background:"#020617",border:"1px solid #1e293b",borderRadius:3,padding:"4px 6px",margin:"4px 0",fontSize:9,color:prog.progressed?"#22c55e":prog.deload?"#ef4444":prog.tooEasy?"#eab308":"#94a3b8",fontFamily:mono}}>
                {prog.note}
              </div>
              {sets.map((s,i)=><SetRow key={i} set={s} i={i} showPain={true}
                onUp={(idx,f,v)=>updAS(p.id,idx,f,v)} onRm={idx=>rmAS(p.id,idx)}/>)}
              <button onClick={()=>addAS(p.id)} style={{width:"100%",height:22,background:"#1e293b",border:"1px dashed #334155",borderRadius:3,color:"#64748b",fontSize:9,cursor:"pointer",fontFamily:mono,marginTop:2}}>+ set</button>
            </div>
          </div>);
        })}
        </>}

        {sessionMode==="full"&&<>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:12,marginBottom:6}}>
            <div style={{fontSize:9,color:"#f59e0b",letterSpacing:2,textTransform:"uppercase"}}>Accessories</div>
            <button onClick={rerollAcc} style={{background:"#1e293b",border:"1px solid #334155",borderRadius:3,color:"#94a3b8",fontSize:8,padding:"3px 6px",cursor:"pointer",fontFamily:mono}}>Reroll</button>
          </div>
          {accs.map(a=><div key={a.id} style={{background:"#0f172a",borderLeft:a.locked?"3px solid #f59e0b":"1px solid #1e293b",border:"1px solid #1e293b",borderRadius:6,padding:"6px 10px",marginBottom:4}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div>
                <div style={{fontSize:11,fontWeight:600,color:"#e2e8f0"}}>{a.name}</div>
                <div style={{fontSize:8,color:"#475569"}}>{a.eq} | {[...a.p,...a.s].map(({m,p})=>`${m} ${p}%`).join(" / ")}</div>
                {a.sugWeight&&<div style={{fontSize:8,color:"#f59e0b"}}>Suggest: {a.sugReps}r x {a.sugWeight}lb</div>}
              </div>
              <div style={{display:"flex",alignItems:"center",gap:4}}>
                <Stars value={prefs[a.name]||0} onChange={v=>{setPrefs(p=>{const n={...p,[a.name]:v};sv(SK.prefs,n);return n;});}} size={14}/>
                <button onClick={()=>togLock(a.id)} style={{fontSize:12,background:"none",border:"none",cursor:"pointer",color:a.locked?"#f59e0b":"#334155"}}>{a.locked?"\u{1F512}":"\u{1F513}"}</button>
              </div>
            </div>
            {a.sets.map((s,i)=><SetRow key={i} set={s} i={i} showPain={false}
              onUp={(idx,f,v)=>updAcc(a.id,idx,f,v)} onRm={idx=>rmAcc(a.id,idx)}/>)}
            <button onClick={()=>addAccSet(a.id)} style={{width:"100%",height:20,background:"#1e293b",border:"1px dashed #334155",borderRadius:3,color:"#64748b",fontSize:8,cursor:"pointer",fontFamily:mono,marginTop:2}}>+ set</button>
          </div>)}
        </>}

        <button onClick={saveSession} style={{width:"100%",height:42,background:"#22c55e",border:"none",borderRadius:6,color:"#0f172a",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:mono,letterSpacing:1,textTransform:"uppercase",marginTop:12}}>Save Session</button>
      </>}
    </>}

    {/* ── LOG ── */}
    {view==="log"&&<>
      <div style={{fontSize:9,color:"#f59e0b",letterSpacing:2,textTransform:"uppercase",marginBottom:6}}>Day Type</div>
      <div style={{display:"flex",gap:3,marginBottom:10}}>
        {Object.keys(DAY_TARGETS).map(dt=><button key={dt} onClick={()=>setDayType(dt)}
          style={{flex:1,height:26,border:"none",borderRadius:3,cursor:"pointer",fontSize:7,fontFamily:mono,textTransform:"uppercase",
            background:dayType===dt?"#f59e0b":"#1e293b",color:dayType===dt?"#0f172a":"#64748b"}}>{dt.replace("_"," ")}</button>)}
      </div>
      <div style={{background:"#0f172a",border:"1px solid #1e293b",borderRadius:6,padding:"8px 10px",marginBottom:8}}>
        <div style={{fontSize:9,color:"#94a3b8",fontFamily:mono,marginBottom:4}}>Target: {targets.cal}cal | P:{targets.pro}g C:{targets.carb}g F:{targets.fat}g</div>
        <div style={{fontSize:10,color:"#e2e8f0",fontFamily:mono,marginBottom:6}}>
          Today: <span style={{color:nutTotals.cal>targets.cal?"#ef4444":"#22c55e"}}>{nutTotals.cal}</span>/{targets.cal}cal |
          P:<span style={{color:nutTotals.pro<targets.pro-10?"#ef4444":"#22c55e"}}>{nutTotals.pro}</span> C:{nutTotals.carb} F:{nutTotals.fat}
        </div>
        <div style={{display:"flex",gap:3,marginBottom:3}}>
          <input type="number" placeholder="cal" value={nCal} onChange={e=>setNCal(e.target.value)} style={{flex:1,height:26,background:"#1e293b",border:"1px solid #334155",borderRadius:3,color:"#e2e8f0",padding:"0 6px",fontSize:9,fontFamily:mono}}/>
          <input type="number" placeholder="P" value={nPro} onChange={e=>setNPro(e.target.value)} style={{width:36,height:26,background:"#1e293b",border:"1px solid #334155",borderRadius:3,color:"#e2e8f0",padding:"0 4px",fontSize:9,fontFamily:mono}}/>
          <input type="number" placeholder="C" value={nCarb} onChange={e=>setNCarb(e.target.value)} style={{width:36,height:26,background:"#1e293b",border:"1px solid #334155",borderRadius:3,color:"#e2e8f0",padding:"0 4px",fontSize:9,fontFamily:mono}}/>
          <input type="number" placeholder="F" value={nFat} onChange={e=>setNFat(e.target.value)} style={{width:36,height:26,background:"#1e293b",border:"1px solid #334155",borderRadius:3,color:"#e2e8f0",padding:"0 4px",fontSize:9,fontFamily:mono}}/>
        </div>
        <div style={{display:"flex",gap:3}}>
          <input type="text" placeholder="note" value={nNote} onChange={e=>setNNote(e.target.value)} style={{flex:1,height:26,background:"#1e293b",border:"1px solid #334155",borderRadius:3,color:"#e2e8f0",padding:"0 6px",fontSize:9,fontFamily:mono}}/>
          <button onClick={addNut} style={{width:36,height:26,background:"#f59e0b",border:"none",borderRadius:3,color:"#0f172a",fontWeight:700,fontSize:10,cursor:"pointer",fontFamily:mono}}>+</button>
        </div>
      </div>
      {todayNut.slice().reverse().map((e,i)=><div key={i} style={{fontSize:8,color:"#94a3b8",fontFamily:mono,padding:"2px 0",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <span>{e.cal}cal P:{e.pro} C:{e.carb} F:{e.fat} {e.note}</span>
        <button onClick={()=>delNut(e.time)} style={{background:"none",border:"none",color:"#ef444466",fontSize:9,cursor:"pointer",fontFamily:mono,padding:"0 4px"}}>x</button>
      </div>)}

      <div style={{fontSize:9,color:"#f59e0b",letterSpacing:2,textTransform:"uppercase",marginTop:14,marginBottom:6}}>Body</div>
      <div style={{background:"#0f172a",border:"1px solid #1e293b",borderRadius:6,padding:"8px 10px",marginBottom:6}}>
        <div style={{display:"flex",gap:3,marginBottom:3}}>
          <input type="number" placeholder="wt lb" value={bW} onChange={e=>setBW(e.target.value)} style={{flex:1,height:26,background:"#1e293b",border:"1px solid #334155",borderRadius:3,color:"#e2e8f0",padding:"0 6px",fontSize:9,fontFamily:mono}}/>
          <input type="number" placeholder='waist"' value={bWa} onChange={e=>setBWa(e.target.value)} style={{flex:1,height:26,background:"#1e293b",border:"1px solid #334155",borderRadius:3,color:"#e2e8f0",padding:"0 6px",fontSize:9,fontFamily:mono}}/>
          <input type="number" placeholder='navel"' value={bNa} onChange={e=>setBNa(e.target.value)} style={{flex:1,height:26,background:"#1e293b",border:"1px solid #334155",borderRadius:3,color:"#e2e8f0",padding:"0 6px",fontSize:9,fontFamily:mono}}/>
          <input type="number" placeholder='chest"' value={bCh} onChange={e=>setBCh(e.target.value)} style={{flex:1,height:26,background:"#1e293b",border:"1px solid #334155",borderRadius:3,color:"#e2e8f0",padding:"0 6px",fontSize:9,fontFamily:mono}}/>
        </div>
        <button onClick={addBody} style={{width:"100%",height:26,background:"#22c55e",border:"none",borderRadius:3,color:"#0f172a",fontWeight:700,fontSize:9,cursor:"pointer",fontFamily:mono}}>Log</button>
      </div>
      {bodyData.slice(-5).reverse().map((e,i)=><div key={i} style={{fontSize:8,color:"#94a3b8",fontFamily:mono,padding:"2px 0",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <span>{e.date}: {e.weight&&`${e.weight}lb`} {e.waist&&`W:${e.waist}"`} {e.navel&&`N:${e.navel}"`} {e.chest&&`C:${e.chest}"`}</span>
        <button onClick={()=>delBody(e.time||e.date)} style={{background:"none",border:"none",color:"#ef444466",fontSize:9,cursor:"pointer",fontFamily:mono,padding:"0 4px"}}>x</button>
      </div>)}

      <div style={{fontSize:9,color:"#f59e0b",letterSpacing:2,textTransform:"uppercase",marginTop:14,marginBottom:6}}>Cardio</div>
      <div style={{background:"#0f172a",border:"1px solid #1e293b",borderRadius:6,padding:"8px 10px"}}>
        <div style={{display:"flex",gap:3,marginBottom:3}}>
          <select value={cType} onChange={e=>setCType(e.target.value)} style={{width:60,height:26,background:"#1e293b",border:"1px solid #334155",borderRadius:3,color:"#e2e8f0",fontSize:8,fontFamily:mono}}>
            <option value="steady">Steady</option><option value="hiit">HIIT</option><option value="walk">Walk</option></select>
          <input type="number" placeholder="min" value={cDur} onChange={e=>setCDur(e.target.value)} style={{flex:1,height:26,background:"#1e293b",border:"1px solid #334155",borderRadius:3,color:"#e2e8f0",padding:"0 6px",fontSize:9,fontFamily:mono}}/>
          <input type="number" placeholder="avg HR" value={cHR} onChange={e=>setCHR(e.target.value)} style={{width:50,height:26,background:"#1e293b",border:"1px solid #334155",borderRadius:3,color:"#e2e8f0",padding:"0 6px",fontSize:9,fontFamily:mono}}/>
        </div>
        {cType==="hiit"&&<input type="text" placeholder="4x4min @175bpm" value={cConf} onChange={e=>setCConf(e.target.value)}
          style={{width:"100%",height:26,background:"#1e293b",border:"1px solid #334155",borderRadius:3,color:"#e2e8f0",padding:"0 6px",fontSize:9,fontFamily:mono,marginBottom:3,boxSizing:"border-box"}}/>}
        <button onClick={addCardio} style={{width:"100%",height:26,background:"#22c55e",border:"none",borderRadius:3,color:"#0f172a",fontWeight:700,fontSize:9,cursor:"pointer",fontFamily:mono}}>Log</button>
      </div>
      {cardioData.slice(-5).reverse().map((e,i)=><div key={i} style={{fontSize:8,color:"#94a3b8",fontFamily:mono,padding:"2px 0",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <span>{e.date}: {e.type} {e.duration}min {e.avgHR&&`HR:${e.avgHR}`} {e.config&&`(${e.config})`}</span>
        <button onClick={()=>delCardio(e.time||e.date)} style={{background:"none",border:"none",color:"#ef444466",fontSize:9,cursor:"pointer",fontFamily:mono,padding:"0 4px"}}>x</button>
      </div>)}

      <button onClick={clearAllData} style={{width:"100%",height:30,background:"#1e293b",border:"1px solid #ef444433",borderRadius:4,color:"#ef4444",fontSize:9,cursor:"pointer",fontFamily:mono,marginTop:20}}>Clear All Data</button>
    </>}

    {/* ── TRENDS ── */}
    {view==="trends"&&<>
      <div style={{fontSize:9,color:"#f59e0b",letterSpacing:2,marginBottom:8,textTransform:"uppercase"}}>Session History</div>
      {(()=>{const hist=ld(SK.history,[]).slice(-10).reverse();
        if(!hist.length)return<div style={{fontSize:9,color:"#475569",marginBottom:12}}>No sessions</div>;
        const durations=hist.filter(h=>h.durationMin).map(h=>h.durationMin);
        const avg=durations.length?Math.round(durations.reduce((a,b)=>a+b,0)/durations.length):0;
        return<div style={{marginBottom:12}}>
          {avg>0&&<div style={{fontSize:9,color:"#94a3b8",fontFamily:mono,marginBottom:4}}>Avg session: {avg}min | Full: {hist.filter(h=>h.mode==="full").length} | Quick: {hist.filter(h=>h.mode==="quick").length}</div>}
          {hist.map((h,i)=><div key={i} style={{fontSize:8,color:"#94a3b8",fontFamily:mono,padding:"1px 0",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <span>{new Date(h.date).toLocaleDateString("en-US",{month:"short",day:"numeric"})} {h.mode==="quick"?"[Q]":"[F]"} {h.durationMin?`${h.durationMin}min`:""} {Object.values(h.anchors||{}).filter(a=>a.sets?.some(s=>s.reps)).length} anchors</span>
            <button onClick={()=>{const all=ld(SK.history,[]).filter(x=>x.date!==h.date);sv(SK.history,all);}} style={{background:"none",border:"none",color:"#ef444466",fontSize:8,cursor:"pointer",fontFamily:mono}}>x</button>
          </div>)}
        </div>;
      })()}

      <div style={{fontSize:9,color:"#3b82f6",letterSpacing:2,marginBottom:8,textTransform:"uppercase"}}>Anchor Progression</div>
      {PATTERNS.map(p=>{
        const nm=anchors[p.id];if(!nm)return null;const h=anchorLog[nm];
        if(!h||!h.length)return<div key={p.id} style={{fontSize:9,color:"#475569",fontFamily:mono,marginBottom:4}}>{p.label}: no data</div>;
        const ents=h.slice(-10);
        const e1rms=ents.map(e=>{const b=e.sets.filter(s=>s.weight&&s.reps).sort((a,b)=>(b.weight*b.reps)-(a.weight*a.reps))[0];
          return b?Math.round(b.weight*(1+b.reps/30)):0}).filter(Boolean);
        const maxE=Math.max(...e1rms,1);
        return(<div key={p.id} style={{background:"#0f172a",border:"1px solid #1e293b",borderRadius:6,padding:"8px 10px",marginBottom:6}}>
          <div style={{fontSize:8,color:"#3b82f6",textTransform:"uppercase"}}>{p.label}</div>
          <div style={{fontSize:11,fontWeight:600,color:"#e2e8f0"}}>{nm}</div>
          <div style={{display:"flex",alignItems:"flex-end",gap:2,height:30,marginTop:4}}>
            {e1rms.map((v,i)=><div key={i} style={{flex:1,height:Math.max((v/maxE)*28,2),background:i===e1rms.length-1?"#3b82f6":"#3b82f644",borderRadius:1}}/>)}
          </div>
          <div style={{fontSize:8,color:"#94a3b8",fontFamily:mono,marginTop:3,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <span>e1RM: {e1rms[e1rms.length-1]||"--"}lb {e1rms.length>=2&&<span style={{color:e1rms[e1rms.length-1]>=e1rms[0]?"#22c55e":"#ef4444"}}>
              ({e1rms[e1rms.length-1]-e1rms[0]>0?"+":""}{e1rms[e1rms.length-1]-e1rms[0]})</span>} | {h.length} sessions</span>
            <button onClick={()=>{const newLog={...anchorLog};if(newLog[nm]&&newLog[nm].length>0){newLog[nm]=newLog[nm].slice(0,-1);setAnchorLog(newLog);sv(SK.anchorLog,newLog);}}}
              style={{background:"none",border:"1px solid #ef444433",borderRadius:3,color:"#ef444466",fontSize:7,cursor:"pointer",fontFamily:mono,padding:"2px 6px"}}>del last</button>
          </div>
        </div>);
      })}

      <VolDash weekVol={weekVol}/>

      <div style={{fontSize:9,color:"#f59e0b",letterSpacing:2,marginTop:12,marginBottom:8,textTransform:"uppercase"}}>Body</div>
      {bodyData.length===0?<div style={{fontSize:9,color:"#475569"}}>No data</div>:
        bodyData.slice(-10).reverse().map((e,i)=><div key={i} style={{fontSize:8,color:"#94a3b8",fontFamily:mono,padding:"1px 0"}}>
          {e.date}: {e.weight&&`${e.weight}lb`} {e.waist&&`W:${e.waist}"`} {e.navel&&`N:${e.navel}"`} {e.chest&&`C:${e.chest}"`}
        </div>)}
      {bodyData.length>=2&&(()=>{const f=bodyData[0],l=bodyData[bodyData.length-1];
        return<div style={{fontSize:9,color:"#94a3b8",fontFamily:mono,marginTop:4,background:"#0f172a",padding:"6px 8px",borderRadius:4}}>
          {f.weight&&l.weight&&<div>Weight: {f.weight} → {l.weight} (<span style={{color:l.weight<f.weight?"#22c55e":"#ef4444"}}>{l.weight>f.weight?"+":""}{(l.weight-f.weight).toFixed(1)}</span>)</div>}
          {f.waist&&l.waist&&<div>Waist: {f.waist}" → {l.waist}" (<span style={{color:l.waist<f.waist?"#22c55e":"#ef4444"}}>{l.waist>f.waist?"+":""}{(l.waist-f.waist).toFixed(1)}</span>)</div>}
          {f.navel&&l.navel&&<div>Navel: {f.navel}" → {l.navel}" (<span style={{color:l.navel<f.navel?"#22c55e":"#ef4444"}}>{l.navel>f.navel?"+":""}{(l.navel-f.navel).toFixed(1)}</span>)</div>}
        </div>;})()}

      <div style={{fontSize:9,color:"#f59e0b",letterSpacing:2,marginTop:12,marginBottom:8,textTransform:"uppercase"}}>Cardio</div>
      {cardioData.length===0?<div style={{fontSize:9,color:"#475569"}}>No data</div>:
        cardioData.slice(-10).reverse().map((e,i)=><div key={i} style={{fontSize:8,color:"#94a3b8",fontFamily:mono,padding:"1px 0"}}>
          {e.date}: {e.type} {e.duration}min {e.avgHR&&`HR:${e.avgHR}`} {e.config&&`(${e.config})`}
        </div>)}
    </>}
    </div>
  </div>);
}
