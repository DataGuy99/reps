import{useState,useEffect,useCallback,useMemo}from"react";
import{MUSCLES,EXERCISES}from"./exercises.js";

// ── Storage ──
const ld=(k,fb)=>{try{const v=localStorage.getItem(k);return v?JSON.parse(v):fb}catch{return fb}};
const sv=(k,d)=>{try{localStorage.setItem(k,JSON.stringify(d))}catch(e){console.error(e)}};
const SK={anchors:"wg-anchors",anchorLog:"wg-anchor-log",accLog:"wg-acc-log",fatigue:"wg-fatigue",current:"wg-current",
  settings:"wg-settings",banned:"wg-banned",prefs:"wg-prefs",exLog:"wg-ex-log",muscleTrends:"wg-muscle-trends",
  nutrition:"wg-nutrition",body:"wg-body",cardio:"wg-cardio"};
const mono="'JetBrains Mono','Fira Code',monospace";
const FC=["#22c55e","#84cc16","#eab308","#f97316","#ef4444"];
const RPEC={6:"#22c55e",7:"#84cc16",8:"#eab308",9:"#f97316",10:"#ef4444"};
const FL=["Fresh","Low","Mod","High","Wrecked"];

// ── Anchor patterns ──
const PATTERNS=[
  {id:"hpress",label:"Horizontal Press",desc:"Bench, DB press, push-ups",muscles:["chest","triceps","shoulders"]},
  {id:"vpress",label:"Vertical Press",desc:"OHP, landmine press, Arnold",muscles:["shoulders","triceps"]},
  {id:"hpull",label:"Horizontal Pull",desc:"Rows (barbell, DB, chest-supported)",muscles:["back","biceps"]},
  {id:"vpull",label:"Vertical Pull",desc:"Pull-ups, chin-ups",muscles:["back","biceps"]},
  {id:"squat",label:"Squat Pattern",desc:"Belt squat, landmine squat, goblet",muscles:["quads","glutes"]},
  {id:"hinge",label:"Hip Hinge",desc:"RDL, hip thrust, deadlift",muscles:["hamstrings","glutes","back"]},
];

// Map exercises to patterns
const PATTERN_MAP={
  hpress:["Dumbbell Bench Press","Incline Dumbbell Press","Decline Dumbbell Press","Dumbbell Floor Press","Dumbbell Squeeze Press","Push-ups","Dips","Close-grip Barbell Bench","Diamond Push-ups","Decline Push-ups"],
  vpress:["Barbell Overhead Press","Dumbbell Arnold Press","Landmine Press","Single-arm Landmine Press","Pike Push-ups"],
  hpull:["Barbell Rows","Pendlay Rows","Dumbbell Rows","Chest-supported Incline DB Rows","Meadow Rows","Inverted Rows"],
  vpull:["Pull-ups","Chin-ups","Wide-grip Pull-ups","Commando Pull-ups"],
  squat:["Belt Squat","Landmine Squat","Dumbbell Goblet Squat","Dumbbell Bulgarian Split Squat","Dumbbell Lunges","Dumbbell Step-ups","Pistol Squats","Sissy Squats"],
  hinge:["Barbell Romanian Deadlifts","Dumbbell Romanian Deadlifts","Single-leg DB Romanian Deadlift","Conventional Deadlift","Sumo Deadlift","Barbell Hip Thrusts","B-stance Hip Thrust","Barbell Glute Bridge","Barbell Good Mornings","Nordic Curls"],
};

// Accessories = everything not in a pattern
const ALL_PATTERN_EX=new Set(Object.values(PATTERN_MAP).flat());
const ACCESSORY_POOL=EXERCISES.filter(e=>!ALL_PATTERN_EX.has(e.name));

// ── Double progression logic ──
function getAnchorProgression(name,anchorLog,repRange=[6,10],targetRIR=2){
  const hist=anchorLog[name];
  if(!hist||hist.length===0)return{weight:"",reps:repRange[0],sets:3,note:"First session. Find a weight where you hit "+repRange[0]+" reps at RIR "+targetRIR+".",isNew:true};
  const last=hist[hist.length-1];
  const lastSets=last.sets.filter(s=>s.reps&&s.weight);
  if(lastSets.length===0)return{weight:"",reps:repRange[0],sets:3,note:"No logged data last session.",isNew:true};
  const lastWeight=+lastSets[0].weight;
  const avgReps=Math.round(lastSets.reduce((s,x)=>s+(+x.reps),0)/lastSets.length);
  const avgRIR=lastSets.filter(s=>s.rir!==undefined&&s.rir!=="").length>0?
    Math.round(lastSets.filter(s=>s.rir!==undefined&&s.rir!=="").reduce((s,x)=>s+(+x.rir),0)/lastSets.filter(s=>s.rir!==undefined&&s.rir!=="").length*10)/10:null;
  // Check if all sets hit top of range at target RIR
  const allHitTop=lastSets.every(s=>+s.reps>=repRange[1]);
  const atTargetRIR=avgRIR!==null&&avgRIR<=targetRIR+0.5;
  if(allHitTop&&atTargetRIR){
    // Progress: increase weight, drop to bottom of range
    const inc=lastWeight>=100?5:lastWeight>=40?5:2.5;
    return{weight:lastWeight+inc,reps:repRange[0],sets:lastSets.length,
      note:`Hit ${repRange[1]} reps at RIR ${avgRIR}. Weight up +${inc}lb, reset to ${repRange[0]} reps.`,progressed:true};
  }
  // RIR correction
  if(avgRIR!==null&&avgRIR>targetRIR+1){
    return{weight:lastWeight,reps:Math.min(avgReps+1,repRange[1]),sets:lastSets.length,
      note:`RIR ${avgRIR} is too easy. Add a rep. Target RIR ${targetRIR}.`,tooEasy:true};
  }
  if(avgRIR!==null&&avgRIR<1){
    return{weight:Math.max(0,lastWeight-5),reps:avgReps,sets:lastSets.length,
      note:`RIR ${avgRIR} means you went too close to failure. Back off -5lb.`,tooHard:true};
  }
  // Default: same weight, try to add a rep
  return{weight:lastWeight,reps:Math.min(avgReps+1,repRange[1]),sets:lastSets.length,
    note:`${avgReps} reps last time${avgRIR!==null?` at RIR ${avgRIR}`:""}. Target ${Math.min(avgReps+1,repRange[1])} reps at RIR ${targetRIR}.`};
}

// ── Accessory generation (existing logic simplified) ──
function shuffle(a){const b=[...a];for(let i=b.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[b[i],b[j]]=[b[j],b[i]];}return b;}

function generateAccessories(count,banned,prefs,fatigue){
  const pool=ACCESSORY_POOL.filter(e=>!banned.includes(e.name));
  const fw={};MUSCLES.forEach(m=>{const f=fatigue[m]||0;fw[m]=f>=4?0.1:f===3?0.4:f===2?0.7:f===1?0.9:1.0;});
  const sel=[];const used=new Set();
  const weighted=shuffle(pool).map(ex=>{
    const stars=prefs[ex.name]||0;
    const mult=stars===0?1:stars===1?1.3:stars===2?1.6:2.0;
    const allM=[...ex.p,...ex.s];
    const avgFw=allM.reduce((s,{m,p})=>s+fw[m]*(p/100),0);
    return{ex,weight:mult*avgFw};
  }).filter(x=>x.weight>0.15).sort((a,b)=>b.weight-a.weight);
  for(const{ex}of weighted){
    if(sel.length>=count)break;
    if(used.has(ex.name))continue;
    sel.push({id:crypto.randomUUID(),name:ex.name,eq:ex.eq,cat:ex.cat,p:ex.p,s:ex.s,
      suggestedSets:2,suggestedReps:ex.p.some(x=>x.m==="core")?12:10,
      sets:[{reps:"",weight:"",rir:""},{reps:"",weight:"",rir:""}],isAccessory:true});
    used.add(ex.name);
  }
  return sel;
}

// ── Components ──
function AnchorSetRow({set,index,onUpdate,onRemove}){
  const rc=set.rir!==undefined&&set.rir!==""?(+set.rir<=1?"#ef4444":+set.rir<=2?"#f97316":+set.rir<=3?"#eab308":"#22c55e"):"#475569";
  return(<div style={{display:"flex",alignItems:"center",gap:4,padding:"3px 0"}}>
    <div style={{width:18,fontSize:9,color:"#64748b",fontFamily:mono}}>{index+1}</div>
    <input type="number" placeholder="reps" value={set.reps||""} onChange={e=>onUpdate(index,"reps",e.target.value)}
      style={{flex:1,height:30,background:"#1e293b",border:"1px solid #334155",borderRadius:3,color:"#e2e8f0",padding:"0 8px",fontSize:11,fontFamily:mono}}/>
    <input type="number" placeholder="lbs" value={set.weight||""} onChange={e=>onUpdate(index,"weight",e.target.value)}
      style={{width:58,height:30,background:"#1e293b",border:"1px solid #334155",borderRadius:3,color:"#e2e8f0",padding:"0 8px",fontSize:11,fontFamily:mono}}/>
    <input type="number" placeholder="RIR" value={set.rir!==undefined?set.rir:""} onChange={e=>onUpdate(index,"rir",e.target.value)}
      min="0" max="5" style={{width:44,height:30,background:"#1e293b",border:`1px solid ${rc}`,borderRadius:3,color:rc,padding:"0 6px",fontSize:11,fontFamily:mono}}/>
    <button onClick={()=>onRemove(index)} style={{width:22,height:22,background:"none",border:"none",color:"#ef4444",cursor:"pointer",fontSize:13}}>x</button>
  </div>);
}

function AnchorCard({pattern,exercise,progression,sets,onUpdateSet,onRemoveSet,onAddSet}){
  const[open,setOpen]=useState(true);
  return(<div style={{background:"#0f172a",borderLeft:"3px solid #3b82f6",border:"1px solid #1e293b",borderRadius:6,marginBottom:8}}>
    <div onClick={()=>setOpen(!open)} style={{padding:"10px 12px",cursor:"pointer",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
      <div>
        <div style={{fontSize:10,color:"#3b82f6",textTransform:"uppercase",letterSpacing:1,fontFamily:mono}}>{pattern.label}</div>
        <div style={{fontSize:13,fontWeight:600,color:"#f1f5f9",fontFamily:mono}}>{exercise}</div>
      </div>
      <span style={{color:"#64748b",fontSize:10}}>{open?"\u25B2":"\u25BC"}</span>
    </div>
    {open&&<div style={{padding:"0 12px 10px"}}>
      <div style={{background:"#020617",border:"1px solid #1e293b",borderRadius:4,padding:"6px 8px",marginBottom:6}}>
        {progression.progressed&&<div style={{fontSize:9,color:"#22c55e",fontFamily:mono,marginBottom:2}}>WEIGHT UP</div>}
        {progression.tooEasy&&<div style={{fontSize:9,color:"#eab308",fontFamily:mono,marginBottom:2}}>TOO EASY</div>}
        {progression.tooHard&&<div style={{fontSize:9,color:"#ef4444",fontFamily:mono,marginBottom:2}}>BACK OFF</div>}
        <div style={{fontSize:10,color:"#94a3b8",fontFamily:mono}}>{progression.note}</div>
        {progression.weight&&<div style={{fontSize:11,color:"#f59e0b",fontFamily:mono,marginTop:2}}>Target: {progression.reps} reps x {progression.weight}lb</div>}
      </div>
      {sets.map((set,i)=><AnchorSetRow key={i} set={set} index={i}
        onUpdate={(idx,f,v)=>onUpdateSet(pattern.id,idx,f,v)} onRemove={idx=>onRemoveSet(pattern.id,idx)}/>)}
      <button onClick={()=>onAddSet(pattern.id)} style={{width:"100%",height:26,background:"#1e293b",border:"1px dashed #334155",borderRadius:3,color:"#64748b",fontSize:10,cursor:"pointer",fontFamily:mono,marginTop:3}}>+ set</button>
    </div>}
  </div>);
}

function NutritionLog({data,onAdd}){
  const[cal,setCal]=useState("");const[pro,setPro]=useState("");const[carb,setCarb]=useState("");const[fat,setFat]=useState("");const[note,setNote]=useState("");
  const today=new Date().toISOString().slice(0,10);
  const todayEntries=data.filter(d=>d.date===today);
  const totals=todayEntries.reduce((s,e)=>({cal:s.cal+e.cal,pro:s.pro+e.pro,carb:s.carb+e.carb,fat:s.fat+e.fat}),{cal:0,pro:0,carb:0,fat:0});
  return(<div>
    <div style={{fontSize:10,color:"#f59e0b",letterSpacing:2,textTransform:"uppercase",marginBottom:8,fontFamily:mono}}>Nutrition</div>
    <div style={{background:"#0f172a",border:"1px solid #1e293b",borderRadius:6,padding:"10px 12px",marginBottom:8}}>
      <div style={{fontSize:11,color:"#e2e8f0",fontFamily:mono,marginBottom:4}}>Today: {totals.cal}cal | P:{totals.pro}g C:{totals.carb}g F:{totals.fat}g</div>
      <div style={{display:"flex",gap:4,marginBottom:4}}>
        <input type="number" placeholder="cal" value={cal} onChange={e=>setCal(e.target.value)} style={{flex:1,height:28,background:"#1e293b",border:"1px solid #334155",borderRadius:3,color:"#e2e8f0",padding:"0 6px",fontSize:10,fontFamily:mono}}/>
        <input type="number" placeholder="P" value={pro} onChange={e=>setPro(e.target.value)} style={{width:40,height:28,background:"#1e293b",border:"1px solid #334155",borderRadius:3,color:"#e2e8f0",padding:"0 6px",fontSize:10,fontFamily:mono}}/>
        <input type="number" placeholder="C" value={carb} onChange={e=>setCarb(e.target.value)} style={{width:40,height:28,background:"#1e293b",border:"1px solid #334155",borderRadius:3,color:"#e2e8f0",padding:"0 6px",fontSize:10,fontFamily:mono}}/>
        <input type="number" placeholder="F" value={fat} onChange={e=>setFat(e.target.value)} style={{width:40,height:28,background:"#1e293b",border:"1px solid #334155",borderRadius:3,color:"#e2e8f0",padding:"0 6px",fontSize:10,fontFamily:mono}}/>
      </div>
      <div style={{display:"flex",gap:4}}>
        <input type="text" placeholder="note (meal/food)" value={note} onChange={e=>setNote(e.target.value)} style={{flex:1,height:28,background:"#1e293b",border:"1px solid #334155",borderRadius:3,color:"#e2e8f0",padding:"0 6px",fontSize:10,fontFamily:mono}}/>
        <button onClick={()=>{if(cal){onAdd({date:today,cal:+cal||0,pro:+pro||0,carb:+carb||0,fat:+fat||0,note,time:new Date().toISOString()});setCal("");setPro("");setCarb("");setFat("");setNote("");}}}
          style={{width:40,height:28,background:"#f59e0b",border:"none",borderRadius:3,color:"#0f172a",fontWeight:700,fontSize:11,cursor:"pointer",fontFamily:mono}}>+</button>
      </div>
    </div>
    {todayEntries.slice().reverse().map((e,i)=><div key={i} style={{fontSize:9,color:"#94a3b8",fontFamily:mono,padding:"2px 0"}}>
      {e.cal}cal P:{e.pro} C:{e.carb} F:{e.fat} {e.note&&`- ${e.note}`}
    </div>)}
  </div>);
}

function BodyLog({data,onAdd}){
  const[weight,setWeight]=useState("");const[waist,setWaist]=useState("");const[navel,setNavel]=useState("");const[chest,setChest]=useState("");
  return(<div>
    <div style={{fontSize:10,color:"#f59e0b",letterSpacing:2,textTransform:"uppercase",marginBottom:8,marginTop:16,fontFamily:mono}}>Body Measurements</div>
    <div style={{background:"#0f172a",border:"1px solid #1e293b",borderRadius:6,padding:"10px 12px",marginBottom:8}}>
      <div style={{display:"flex",gap:4,marginBottom:4}}>
        <input type="number" placeholder="wt (lb)" value={weight} onChange={e=>setWeight(e.target.value)} style={{flex:1,height:28,background:"#1e293b",border:"1px solid #334155",borderRadius:3,color:"#e2e8f0",padding:"0 6px",fontSize:10,fontFamily:mono}}/>
        <input type="number" placeholder="waist" value={waist} onChange={e=>setWaist(e.target.value)} style={{flex:1,height:28,background:"#1e293b",border:"1px solid #334155",borderRadius:3,color:"#e2e8f0",padding:"0 6px",fontSize:10,fontFamily:mono}}/>
        <input type="number" placeholder="navel" value={navel} onChange={e=>setNavel(e.target.value)} style={{flex:1,height:28,background:"#1e293b",border:"1px solid #334155",borderRadius:3,color:"#e2e8f0",padding:"0 6px",fontSize:10,fontFamily:mono}}/>
        <input type="number" placeholder="chest" value={chest} onChange={e=>setChest(e.target.value)} style={{flex:1,height:28,background:"#1e293b",border:"1px solid #334155",borderRadius:3,color:"#e2e8f0",padding:"0 6px",fontSize:10,fontFamily:mono}}/>
      </div>
      <button onClick={()=>{if(weight||waist||navel||chest){onAdd({date:new Date().toISOString().slice(0,10),weight:+weight||null,waist:+waist||null,navel:+navel||null,chest:+chest||null,time:new Date().toISOString()});setWeight("");setWaist("");setNavel("");setChest("");}}}
        style={{width:"100%",height:28,background:"#22c55e",border:"none",borderRadius:3,color:"#0f172a",fontWeight:700,fontSize:10,cursor:"pointer",fontFamily:mono}}>Log measurements</button>
    </div>
    {data.slice(-5).reverse().map((e,i)=><div key={i} style={{fontSize:9,color:"#94a3b8",fontFamily:mono,padding:"2px 0"}}>
      {e.date}: {e.weight&&`${e.weight}lb`} {e.waist&&`W:${e.waist}"`} {e.navel&&`N:${e.navel}"`} {e.chest&&`C:${e.chest}"`}
    </div>)}
  </div>);
}

function CardioLog({data,onAdd}){
  const[type,setType]=useState("steady");const[dur,setDur]=useState("");const[hr,setHr]=useState("");const[hiitConfig,setHiitConfig]=useState("");
  return(<div>
    <div style={{fontSize:10,color:"#f59e0b",letterSpacing:2,textTransform:"uppercase",marginBottom:8,marginTop:16,fontFamily:mono}}>Cardio</div>
    <div style={{background:"#0f172a",border:"1px solid #1e293b",borderRadius:6,padding:"10px 12px",marginBottom:8}}>
      <div style={{display:"flex",gap:4,marginBottom:4}}>
        <select value={type} onChange={e=>setType(e.target.value)} style={{width:70,height:28,background:"#1e293b",border:"1px solid #334155",borderRadius:3,color:"#e2e8f0",fontSize:10,fontFamily:mono}}>
          <option value="steady">Steady</option><option value="hiit">HIIT</option><option value="walk">Walk</option>
        </select>
        <input type="number" placeholder="min" value={dur} onChange={e=>setDur(e.target.value)} style={{flex:1,height:28,background:"#1e293b",border:"1px solid #334155",borderRadius:3,color:"#e2e8f0",padding:"0 6px",fontSize:10,fontFamily:mono}}/>
        <input type="number" placeholder="avg HR" value={hr} onChange={e=>setHr(e.target.value)} style={{width:56,height:28,background:"#1e293b",border:"1px solid #334155",borderRadius:3,color:"#e2e8f0",padding:"0 6px",fontSize:10,fontFamily:mono}}/>
      </div>
      {type==="hiit"&&<input type="text" placeholder="config (e.g. 4x4min @175bpm)" value={hiitConfig} onChange={e=>setHiitConfig(e.target.value)}
        style={{width:"100%",height:28,background:"#1e293b",border:"1px solid #334155",borderRadius:3,color:"#e2e8f0",padding:"0 6px",fontSize:10,fontFamily:mono,marginBottom:4,boxSizing:"border-box"}}/>}
      <button onClick={()=>{if(dur){onAdd({date:new Date().toISOString().slice(0,10),type,duration:+dur,avgHR:+hr||null,hiitConfig:type==="hiit"?hiitConfig:"",time:new Date().toISOString()});setDur("");setHr("");setHiitConfig("");}}}
        style={{width:"100%",height:28,background:"#22c55e",border:"none",borderRadius:3,color:"#0f172a",fontWeight:700,fontSize:10,cursor:"pointer",fontFamily:mono}}>Log cardio</button>
    </div>
    {data.slice(-5).reverse().map((e,i)=><div key={i} style={{fontSize:9,color:"#94a3b8",fontFamily:mono,padding:"2px 0"}}>
      {e.date}: {e.type} {e.duration}min {e.avgHR&&`HR:${e.avgHR}`} {e.hiitConfig&&`(${e.hiitConfig})`}
    </div>)}
  </div>);
}

// ── Main App ──
export default function App(){
  const[view,setView]=useState("workout");
  const[anchors,setAnchors]=useState(()=>ld(SK.anchors,{}));
  const[anchorLog,setAnchorLog]=useState(()=>ld(SK.anchorLog,{}));
  const[anchorSets,setAnchorSets]=useState({});
  const[accessories,setAccessories]=useState([]);
  const[banned,setBanned]=useState(()=>ld(SK.banned,[]));
  const[prefs,setPrefs]=useState(()=>ld(SK.prefs,{}));
  const[fatigue,setFatigue]=useState(()=>{const f={};MUSCLES.forEach(m=>f[m]=0);return ld(SK.fatigue,f)});
  const[nutrition,setNutrition]=useState(()=>ld(SK.nutrition,[]));
  const[body,setBody]=useState(()=>ld(SK.body,[]));
  const[cardio,setCardio]=useState(()=>ld(SK.cardio,[]));
  const[showSetup,setShowSetup]=useState(false);
  const[accCount,setAccCount]=useState(3);

  const allAnchorsSet=PATTERNS.every(p=>anchors[p.id]);

  // Initialize anchor sets from progression
  const initSession=useCallback(()=>{
    const sets={};
    PATTERNS.forEach(p=>{
      if(!anchors[p.id])return;
      const prog=getAnchorProgression(anchors[p.id],anchorLog);
      const numSets=prog.sets||3;
      sets[p.id]=Array.from({length:numSets},()=>({reps:prog.reps||"",weight:prog.weight||"",rir:""}));
    });
    setAnchorSets(sets);
    setAccessories(generateAccessories(accCount,banned,prefs,fatigue));
  },[anchors,anchorLog,accCount,banned,prefs,fatigue]);

  useEffect(()=>{if(allAnchorsSet)initSession();},[allAnchorsSet]);

  const updateAnchorSet=useCallback((patId,idx,field,val)=>{
    setAnchorSets(p=>({...p,[patId]:p[patId].map((s,i)=>i===idx?{...s,[field]:val}:s)}));
  },[]);
  const removeAnchorSet=useCallback((patId,idx)=>{
    setAnchorSets(p=>({...p,[patId]:p[patId].filter((_,i)=>i!==idx)}));
  },[]);
  const addAnchorSet=useCallback(patId=>{
    setAnchorSets(p=>({...p,[patId]:[...(p[patId]||[]),{reps:"",weight:"",rir:""}]}));
  },[]);

  const saveSession=useCallback(()=>{
    const newLog={...anchorLog};
    PATTERNS.forEach(p=>{
      if(!anchors[p.id]||!anchorSets[p.id])return;
      const logged=anchorSets[p.id].filter(s=>s.reps);
      if(logged.length===0)return;
      const name=anchors[p.id];
      if(!newLog[name])newLog[name]=[];
      newLog[name].push({date:new Date().toISOString(),sets:logged.map(s=>({reps:+s.reps,weight:+s.weight||0,rir:s.rir!==""?+s.rir:null}))});
      if(newLog[name].length>30)newLog[name]=newLog[name].slice(-30);
    });
    setAnchorLog(newLog);sv(SK.anchorLog,newLog);
    initSession();
    alert("Session saved!");
  },[anchorLog,anchors,anchorSets,initSession]);

  const selectAnchor=useCallback((patId,exName)=>{
    setAnchors(p=>{const n={...p,[patId]:exName};sv(SK.anchors,n);return n;});
  },[]);

  const addNutrition=useCallback(entry=>{setNutrition(p=>{const n=[...p,entry].slice(-500);sv(SK.nutrition,n);return n;});},[]);
  const addBody=useCallback(entry=>{setBody(p=>{const n=[...p,entry].slice(-200);sv(SK.body,n);return n;});},[]);
  const addCardio=useCallback(entry=>{setCardio(p=>{const n=[...p,entry].slice(-200);sv(SK.cardio,n);return n;});},[]);

  const nb=(l,t)=>({flex:1,padding:"11px 0",background:"none",border:"none",borderBottom:view===t?"2px solid #f59e0b":"2px solid transparent",
    color:view===t?"#f59e0b":"#64748b",fontSize:9,fontWeight:600,cursor:"pointer",fontFamily:mono,letterSpacing:1,textTransform:"uppercase"});

  return(<div style={{background:"#020617",minHeight:"100vh",color:"#e2e8f0",fontFamily:mono,paddingBottom:80}}>
    <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;700&display=swap" rel="stylesheet"/>
    <nav style={{display:"flex",borderBottom:"1px solid #1e293b",background:"#0f172a",position:"sticky",top:0,zIndex:10}}>
      <button style={nb("W","workout")} onClick={()=>setView("workout")}>Lift</button>
      <button style={nb("L","log")} onClick={()=>setView("log")}>Log</button>
      <button style={nb("T","trends")} onClick={()=>setView("trends")}>Trends</button>
    </nav>

    <div style={{padding:"12px 10px"}}>
      {/* ── WORKOUT ── */}
      {view==="workout"&&<>
        {!allAnchorsSet||showSetup?<>
          <div style={{fontSize:10,color:"#3b82f6",letterSpacing:2,textTransform:"uppercase",marginBottom:12,fontFamily:mono}}>
            Select your 6 anchor lifts
          </div>
          {PATTERNS.map(p=><div key={p.id} style={{background:"#0f172a",border:"1px solid #1e293b",borderRadius:6,padding:"10px 12px",marginBottom:8}}>
            <div style={{fontSize:10,color:"#3b82f6",textTransform:"uppercase",letterSpacing:1,fontFamily:mono}}>{p.label}</div>
            <div style={{fontSize:9,color:"#475569",fontFamily:mono,marginBottom:6}}>{p.desc}</div>
            <div style={{display:"flex",flexWrap:"wrap",gap:4}}>
              {(PATTERN_MAP[p.id]||[]).filter(n=>!banned.includes(n)).map(name=>(
                <button key={name} onClick={()=>selectAnchor(p.id,name)}
                  style={{padding:"6px 10px",borderRadius:4,border:"none",cursor:"pointer",fontSize:10,fontFamily:mono,
                    background:anchors[p.id]===name?"#3b82f6":"#1e293b",color:anchors[p.id]===name?"#fff":"#94a3b8",fontWeight:anchors[p.id]===name?700:400}}>
                  {name}</button>))}
            </div>
          </div>)}
          {allAnchorsSet&&<button onClick={()=>{setShowSetup(false);initSession();}}
            style={{width:"100%",height:42,background:"#f59e0b",border:"none",borderRadius:6,color:"#0f172a",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:mono,letterSpacing:2,textTransform:"uppercase",marginTop:8}}>
            Start Session</button>}
        </>:<>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
            <div style={{fontSize:10,color:"#3b82f6",letterSpacing:2,textTransform:"uppercase"}}>Anchors (progressed)</div>
            <button onClick={()=>setShowSetup(true)} style={{background:"#1e293b",border:"1px solid #334155",borderRadius:3,color:"#64748b",fontSize:9,padding:"4px 8px",cursor:"pointer",fontFamily:mono}}>Change anchors</button>
          </div>
          {PATTERNS.map(p=>{
            if(!anchors[p.id])return null;
            const prog=getAnchorProgression(anchors[p.id],anchorLog);
            return<AnchorCard key={p.id} pattern={p} exercise={anchors[p.id]} progression={prog}
              sets={anchorSets[p.id]||[]} onUpdateSet={updateAnchorSet} onRemoveSet={removeAnchorSet} onAddSet={addAnchorSet}/>;
          })}

          <div style={{fontSize:10,color:"#f59e0b",letterSpacing:2,textTransform:"uppercase",marginTop:16,marginBottom:8}}>Accessories (rotatable)</div>
          {accessories.map(ex=><div key={ex.id} style={{background:"#0f172a",border:"1px solid #1e293b",borderRadius:6,padding:"8px 12px",marginBottom:6}}>
            <div style={{fontSize:12,fontWeight:600,color:"#e2e8f0",fontFamily:mono}}>{ex.name}</div>
            <div style={{fontSize:9,color:"#64748b",fontFamily:mono}}>{ex.eq} | {ex.suggestedSets}x{ex.suggestedReps} | {[...ex.p,...ex.s].map(({m,p})=>`${m} ${p}%`).join(" / ")}</div>
            {ex.sets.map((set,i)=><AnchorSetRow key={i} set={set} index={i}
              onUpdate={(idx,f,v)=>{setAccessories(prev=>prev.map(a=>a.id===ex.id?{...a,sets:a.sets.map((s,j)=>j===idx?{...s,[f]:v}:s)}:a));}}
              onRemove={idx=>{setAccessories(prev=>prev.map(a=>a.id===ex.id?{...a,sets:a.sets.filter((_,j)=>j!==idx)}:a));}}/>)}
          </div>)}
          <button onClick={()=>setAccessories(generateAccessories(accCount,banned,prefs,fatigue))}
            style={{width:"100%",height:30,background:"#1e293b",border:"1px dashed #334155",borderRadius:4,color:"#64748b",fontSize:10,cursor:"pointer",fontFamily:mono,marginBottom:12}}>
            Reroll accessories</button>

          <button onClick={saveSession}
            style={{width:"100%",height:44,background:"#22c55e",border:"none",borderRadius:6,color:"#0f172a",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:mono,letterSpacing:1,textTransform:"uppercase"}}>
            Save Session</button>
        </>}
      </>}

      {/* ── LOG ── */}
      {view==="log"&&<>
        <NutritionLog data={nutrition} onAdd={addNutrition}/>
        <BodyLog data={body} onAdd={addBody}/>
        <CardioLog data={cardio} onAdd={addCardio}/>
      </>}

      {/* ── TRENDS ── */}
      {view==="trends"&&<>
        <div style={{fontSize:10,color:"#f59e0b",letterSpacing:2,marginBottom:12,textTransform:"uppercase"}}>Anchor Progression</div>
        {PATTERNS.map(p=>{
          const name=anchors[p.id];if(!name)return null;
          const hist=anchorLog[name];if(!hist||hist.length===0)return(<div key={p.id} style={{fontSize:10,color:"#475569",fontFamily:mono,marginBottom:8}}>{p.label}: {name} - no data</div>);
          const entries=hist.slice(-8);
          const e1rms=entries.map(e=>{const b=e.sets.filter(s=>s.weight&&s.reps).sort((a,b)=>(b.weight*b.reps)-(a.weight*a.reps))[0];
            return b?Math.round(b.weight*(1+b.reps/30)):0}).filter(Boolean);
          const maxW=Math.max(...entries.map(e=>Math.max(...e.sets.map(s=>+s.weight||0))),1);
          return(<div key={p.id} style={{background:"#0f172a",border:"1px solid #1e293b",borderRadius:6,padding:"10px 12px",marginBottom:8}}>
            <div style={{fontSize:10,color:"#3b82f6",textTransform:"uppercase",letterSpacing:1,fontFamily:mono}}>{p.label}</div>
            <div style={{fontSize:12,fontWeight:600,color:"#e2e8f0",fontFamily:mono}}>{name}</div>
            <div style={{display:"flex",alignItems:"flex-end",gap:3,height:36,marginTop:6}}>
              {e1rms.map((v,i)=><div key={i} style={{flex:1,height:Math.max((v/Math.max(...e1rms))*34,3),background:i===e1rms.length-1?"#3b82f6":"#3b82f644",borderRadius:2}}/>)}
            </div>
            <div style={{fontSize:9,color:"#94a3b8",fontFamily:mono,marginTop:4}}>
              e1RM: {e1rms[e1rms.length-1]||"--"}lb {e1rms.length>=2&&<span style={{color:e1rms[e1rms.length-1]>e1rms[0]?"#22c55e":"#ef4444"}}>
                ({e1rms[e1rms.length-1]-e1rms[0]>0?"+":""}{e1rms[e1rms.length-1]-e1rms[0]})</span>}
              | Sessions: {hist.length}
            </div>
          </div>);
        })}

        <div style={{fontSize:10,color:"#f59e0b",letterSpacing:2,marginTop:16,marginBottom:12,textTransform:"uppercase"}}>Body Trends</div>
        {body.length===0?<div style={{fontSize:10,color:"#475569",fontFamily:mono}}>No measurements logged</div>:
          body.slice(-10).reverse().map((e,i)=><div key={i} style={{fontSize:9,color:"#94a3b8",fontFamily:mono,padding:"2px 0"}}>
            {e.date}: {e.weight&&`${e.weight}lb`} {e.waist&&`W:${e.waist}"`} {e.navel&&`N:${e.navel}"`} {e.chest&&`C:${e.chest}"`}
          </div>)}

        <div style={{fontSize:10,color:"#f59e0b",letterSpacing:2,marginTop:16,marginBottom:12,textTransform:"uppercase"}}>Recent Cardio</div>
        {cardio.length===0?<div style={{fontSize:10,color:"#475569",fontFamily:mono}}>No cardio logged</div>:
          cardio.slice(-10).reverse().map((e,i)=><div key={i} style={{fontSize:9,color:"#94a3b8",fontFamily:mono,padding:"2px 0"}}>
            {e.date}: {e.type} {e.duration}min {e.avgHR&&`HR:${e.avgHR}`} {e.hiitConfig&&`(${e.hiitConfig})`}
          </div>)}
      </>}
    </div>
  </div>);
}
