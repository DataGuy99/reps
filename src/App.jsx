import{useState,useEffect,useCallback,useMemo}from"react";
import{MUSCLES,EXERCISES}from"./exercises.js";

// ── Storage (localStorage for deployed app) ──
function ld(k,fb){try{const v=localStorage.getItem(k);return v?JSON.parse(v):fb;}catch{return fb;}}
function sv(k,d){try{localStorage.setItem(k,JSON.stringify(d));}catch(e){console.error(e);}}
const SK={history:"wg-history",fatigue:"wg-fatigue",current:"wg-current",settings:"wg-settings",banned:"wg-banned",prefs:"wg-prefs",exLog:"wg-ex-log",muscleTrends:"wg-muscle-trends"};

// ── Constants ──
const FATIGUE_LABELS=["Fresh","Low","Mod","High","Wrecked"];
const FC=["#22c55e","#84cc16","#eab308","#f97316","#ef4444"];
const RPEC={6:"#22c55e",7:"#84cc16",8:"#eab308",9:"#f97316",10:"#ef4444"};
const mono="'JetBrains Mono','Fira Code',monospace";

// ── Suggestion engine ──
function getSuggestion(exName,exLog){
  const hist=exLog[exName];
  if(!hist||hist.length===0)return null;
  const last=hist[hist.length-1];
  const bestSet=last.sets.filter(s=>s.weight&&s.reps).sort((a,b)=>(b.weight*b.reps)-(a.weight*a.reps))[0];
  if(!bestSet)return{last,suggestion:"Log weights to get suggestions"};
  const rpe=bestSet.rpe||8;
  let sugW=+bestSet.weight,sugR=+bestSet.reps,note="";
  if(rpe<=7){sugW=+bestSet.weight+5;note="RPE was low. Push +5lb.";}
  else if(rpe===8){sugR=+bestSet.reps+1;note="Solid. Try +1 rep.";}
  else if(rpe===9){note="Hold weight and reps. Consolidate.";}
  else{sugW=Math.max(0,+bestSet.weight-5);note="RPE 10. Back off -5lb.";}
  return{last,bestSet,sugW,sugR,note,e1rm:Math.round(bestSet.weight*(1+bestSet.reps/30))};
}

function getMuscleTrend(muscle,trends){
  const data=trends[muscle];
  if(!data||data.length<2)return null;
  const recent=data.slice(-5);
  const first=recent[0].volumeLoad;
  const last=recent[recent.length-1].volumeLoad;
  const pctChange=first>0?Math.round(((last-first)/first)*100):0;
  const avgRpe=Math.round(recent.reduce((s,d)=>s+d.avgRpe,0)/recent.length*10)/10;
  return{pctChange,avgRpe,sessions:recent.length,direction:pctChange>5?"up":pctChange<-5?"down":"flat"};
}

// ── Generator ──
function shuffle(a){const b=[...a];for(let i=b.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[b[i],b[j]]=[b[j],b[i]];}return b;}

function generateWorkout(fatigue,count,banned,locked=[],prefs={},exLog={}){
  const pool=EXERCISES.filter(e=>!banned.includes(e.name));
  const cov={};MUSCLES.forEach(m=>cov[m]=0);
  const lockedNames=new Set(locked.map(e=>e.name));
  locked.forEach(ex=>{[...ex.p,...ex.s].forEach(({m,p})=>{cov[m]+=p*(ex.suggestedSets||2);});});
  const lbc={};locked.forEach(ex=>{lbc[ex.cat]=(lbc[ex.cat]||0)+1;});
  const fw={};MUSCLES.forEach(m=>{const f=fatigue[m]||0;fw[m]=f>=4?0.1:f===3?0.4:f===2?0.7:f===1?0.9:1.0;});
  const needs={pull:Math.max(0,2-(lbc.pull||0)),push:Math.max(0,2-(lbc.push||0)),legs:Math.max(0,2-(lbc.legs||0)),core:Math.max(0,1-(lbc.core||0))};
  const sel=[];const used=new Set(lockedNames);
  function pick(catPool,n){
    const w=catPool.map(ex=>{
      const stars=prefs[ex.name]||0;
      const mult=stars===0?1:stars===1?1.3:stars===2?1.6:2.0;
      const allM=[...ex.p,...ex.s];
      const avgFw=allM.reduce((s,{m,p})=>s+fw[m]*(p/100),0);
      return{ex,weight:mult*avgFw};
    }).filter(x=>x.weight>0.15);
    let picked=0;const rem=[...w];
    while(picked<n&&rem.length>0){
      const tot=rem.reduce((s,x)=>s+x.weight,0);let r=Math.random()*tot,idx=0;
      for(let i=0;i<rem.length;i++){r-=rem[i].weight;if(r<=0){idx=i;break;}}
      const ch=rem.splice(idx,1)[0].ex;
      if(used.has(ch.name))continue;
      const allM=[...ch.p,...ch.s];
      const baseSets=fatigue[allM[0]?.m]>=3?1:2;
      const isStatic=ch.name.includes("Plank")||ch.name.includes("Hold")||ch.name.includes("Carry")||ch.name.includes("Carries")||ch.name.includes("Wall Sit");
      const baseReps=isStatic?1:ch.p.some(x=>x.m==="core")?12:8;
      const sug=getSuggestion(ch.name,exLog);
      sel.push({id:crypto.randomUUID(),name:ch.name,eq:ch.eq,cat:ch.cat,p:ch.p,s:ch.s,
        suggestedSets:baseSets,suggestedReps:sug?.sugR||baseReps,suggestedWeight:sug?.sugW||"",
        suggestion:sug,locked:false,fatigueRating:null,
        sets:Array.from({length:baseSets},()=>({reps:sug?.sugR||baseReps,weight:sug?.sugW||"",rpe:""}))});
      used.add(ch.name);allM.forEach(({m,p})=>{cov[m]+=p*baseSets;});picked++;
    }
  }
  for(const[cat,n]of Object.entries(needs)){pick(shuffle(pool.filter(e=>e.cat===cat&&!used.has(e.name))),n);}
  const totalSlots=count-locked.length;
  const under=MUSCLES.filter(m=>cov[m]<50&&fw[m]>0.3);
  if(under.length>0&&sel.length<totalSlots){
    pick(shuffle(pool.filter(e=>!used.has(e.name)&&[...e.p,...e.s].some(({m})=>under.includes(m)))),totalSlots-sel.length);
  }
  const all=[...locked.map(e=>({...e,locked:true})),...sel];
  const fc={};MUSCLES.forEach(m=>fc[m]=0);
  all.forEach(ex=>{[...ex.p,...ex.s].forEach(({m,p})=>{fc[m]+=p*(ex.suggestedSets||2);});});
  return{exercises:all,muscleCoverage:fc,generated:new Date().toISOString()};
}

// ── Save & aggregate ──
function saveWorkoutData(workout,fatigue,exLog,muscleTrends){
  const date=new Date().toISOString();
  const newExLog={...exLog};
  const sessionMuscle={};
  MUSCLES.forEach(m=>{sessionMuscle[m]={volumeLoad:0,sets:0,rpeSum:0,rpeCount:0,exercises:[]};});
  workout.exercises.forEach(ex=>{
    const logged=ex.sets.filter(s=>s.reps);
    if(logged.length===0)return;
    // Exercise log
    if(!newExLog[ex.name])newExLog[ex.name]=[];
    newExLog[ex.name].push({date,sets:logged.map(s=>({reps:+s.reps||0,weight:+s.weight||0,rpe:+s.rpe||0}))});
    if(newExLog[ex.name].length>20)newExLog[ex.name]=newExLog[ex.name].slice(-20);
    // Muscle aggregation
    const allM=[...ex.p,...ex.s];
    logged.forEach(set=>{
      const w=+set.weight||0;const r=+set.reps||0;const rpe=+set.rpe||0;
      allM.forEach(({m,p})=>{
        sessionMuscle[m].volumeLoad+=w*r*(p/100);
        sessionMuscle[m].sets++;
        if(rpe){sessionMuscle[m].rpeSum+=rpe*(p/100);sessionMuscle[m].rpeCount++;}
        if(!sessionMuscle[m].exercises.includes(ex.name))sessionMuscle[m].exercises.push(ex.name);
      });
    });
  });
  const newTrends={...muscleTrends};
  MUSCLES.forEach(m=>{
    const d=sessionMuscle[m];
    if(d.sets===0)return;
    if(!newTrends[m])newTrends[m]=[];
    newTrends[m].push({date,volumeLoad:Math.round(d.volumeLoad),sets:d.sets,
      avgRpe:d.rpeCount>0?Math.round(d.rpeSum/d.rpeCount*10)/10:0,exercises:d.exercises});
    if(newTrends[m].length>30)newTrends[m]=newTrends[m].slice(-30);
  });
  return{newExLog,newTrends};
}

// ── UI Components ──
function Bar({muscle,value,maxVal,fatigue:f}){
  const pct=maxVal>0?Math.min((value/maxVal)*100,100):0;
  return(<div style={{display:"flex",alignItems:"center",gap:6,marginBottom:3}}>
    <div style={{width:64,fontSize:9,color:"#94a3b8",textTransform:"uppercase",letterSpacing:1,fontFamily:mono}}>{muscle.slice(0,6)}</div>
    <div style={{flex:1,height:10,background:"#1e293b",borderRadius:2,overflow:"hidden"}}>
      <div style={{width:`${pct}%`,height:"100%",background:`linear-gradient(90deg,${FC[f||0]}44,${FC[f||0]})`,transition:"width 0.3s"}}/></div>
    <div style={{width:24,fontSize:9,color:"#64748b",textAlign:"right",fontFamily:mono}}>{Math.round(value)}</div>
  </div>);
}

function FatSlider({muscle,value,onChange}){
  return(<div style={{display:"flex",alignItems:"center",gap:5,padding:"4px 0"}}>
    <div style={{width:64,fontSize:10,color:"#cbd5e1",textTransform:"capitalize",fontFamily:mono}}>{muscle}</div>
    <div style={{flex:1,display:"flex",gap:2}}>
      {[0,1,2,3,4].map(l=><button key={l} onClick={()=>onChange(muscle,l)}
        style={{flex:1,height:28,border:"none",borderRadius:3,cursor:"pointer",background:value===l?FC[l]:"#1e293b",
          color:value===l?"#0f172a":"#64748b",fontSize:8,fontWeight:value===l?700:400,fontFamily:mono}}>{FATIGUE_LABELS[l]}</button>)}
    </div>
  </div>);
}

function Stars({value,onChange,size=16}){
  return(<div style={{display:"flex",gap:3,padding:"2px 0"}}>
    {[1,2,3].map(s=><span key={s} onClick={e=>{e.stopPropagation();onChange(value===s?0:s);}}
      style={{cursor:"pointer",fontSize:size,color:s<=value?"#f59e0b":"#334155",userSelect:"none",lineHeight:1}}>★</span>)}</div>);
}

function SuggestionBadge({sug}){
  if(!sug)return<div style={{fontSize:9,color:"#475569",fontFamily:mono,padding:"4px 0"}}>No history. Log to get suggestions.</div>;
  if(!sug.bestSet)return null;
  const{bestSet,sugW,sugR,note,e1rm}=sug;
  return(<div style={{background:"#0f172a",border:"1px solid #1e293b",borderRadius:4,padding:"6px 8px",marginBottom:6}}>
    <div style={{fontSize:9,color:"#64748b",fontFamily:mono}}>Last best: {bestSet.reps}x{bestSet.weight}lb {bestSet.rpe?`@RPE${bestSet.rpe}`:""} {e1rm?`(e1RM: ${e1rm})`:""}</div>
    <div style={{fontSize:10,color:"#f59e0b",fontFamily:mono,marginTop:2}}>Suggest: {sugR}x{sugW}lb {note?`- ${note}`:""}</div>
  </div>);
}

function FatigueModal({exercise,onSubmit,onSkip}){
  const[r,setR]=useState(null);
  const ms=[...new Set([...exercise.p,...exercise.s].map(x=>x.m))];
  return(<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.85)",zIndex:100,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
    <div style={{background:"#0f172a",border:"1px solid #334155",borderRadius:10,padding:18,width:"100%",maxWidth:340}}>
      <div style={{fontSize:10,color:"#f59e0b",letterSpacing:2,textTransform:"uppercase",marginBottom:4,fontFamily:mono}}>Post-exercise fatigue</div>
      <div style={{fontSize:13,color:"#e2e8f0",fontWeight:600,marginBottom:4,fontFamily:mono}}>{exercise.name}</div>
      <div style={{fontSize:10,color:"#64748b",marginBottom:14,fontFamily:mono}}>Muscles: {ms.join(", ")}</div>
      <div style={{display:"flex",gap:3,marginBottom:18}}>
        {[0,1,2,3,4].map(l=><button key={l} onClick={()=>setR(l)}
          style={{flex:1,height:42,border:"none",borderRadius:4,cursor:"pointer",background:r===l?FC[l]:"#1e293b",
            color:r===l?"#0f172a":"#64748b",fontSize:9,fontWeight:r===l?700:400,fontFamily:mono,
            display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:1}}>
          <span style={{fontSize:13}}>{l}</span><span>{FATIGUE_LABELS[l]}</span></button>)}
      </div>
      <div style={{display:"flex",gap:8}}>
        <button onClick={onSkip} style={{flex:1,height:40,background:"#1e293b",border:"1px solid #334155",borderRadius:6,color:"#94a3b8",fontSize:11,cursor:"pointer",fontFamily:mono}}>Skip</button>
        <button onClick={()=>r!==null&&onSubmit(r)} disabled={r===null}
          style={{flex:2,height:40,background:r!==null?"#22c55e":"#1e293b",border:"none",borderRadius:6,
            color:r!==null?"#0f172a":"#475569",fontSize:11,fontWeight:700,cursor:r!==null?"pointer":"default",fontFamily:mono}}>Log</button>
      </div>
    </div>
  </div>);
}

function Library({banned,prefs,onBan,onUnban,onSetPref,onClose}){
  const[filter,setFilter]=useState("all");
  const[search,setSearch]=useState("");
  const cats=["all","pull","push","legs","core"];
  const filtered=EXERCISES.filter(e=>{
    if(filter!=="all"&&e.cat!==filter)return false;
    if(search&&!e.name.toLowerCase().includes(search.toLowerCase()))return false;
    return true;});
  return(<div style={{position:"fixed",inset:0,background:"#020617",zIndex:100,overflowY:"auto"}}>
    <div style={{padding:"14px 12px",paddingBottom:80}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
        <div style={{fontSize:11,color:"#f59e0b",letterSpacing:2,textTransform:"uppercase",fontFamily:mono}}>Library ({EXERCISES.length})</div>
        <button onClick={onClose} style={{background:"#1e293b",border:"1px solid #334155",borderRadius:4,color:"#94a3b8",fontSize:12,padding:"6px 14px",cursor:"pointer",fontFamily:mono}}>Close</button>
      </div>
      <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search..."
        style={{width:"100%",height:36,background:"#0f172a",border:"1px solid #1e293b",borderRadius:4,color:"#e2e8f0",padding:"0 10px",fontSize:12,fontFamily:mono,marginBottom:10,boxSizing:"border-box"}}/>
      <div style={{display:"flex",gap:4,marginBottom:14}}>
        {cats.map(c=><button key={c} onClick={()=>setFilter(c)}
          style={{flex:1,height:28,border:"none",borderRadius:3,cursor:"pointer",background:filter===c?"#f59e0b":"#1e293b",
            color:filter===c?"#0f172a":"#64748b",fontSize:9,fontWeight:filter===c?700:400,fontFamily:mono,textTransform:"uppercase"}}>{c}</button>)}
      </div>
      {filtered.map(ex=>{const ib=banned.includes(ex.name);
        return(<div key={ex.name} style={{background:"#0f172a",border:`1px solid ${ib?"#ef444444":"#1e293b"}`,borderRadius:6,padding:"10px 12px",marginBottom:6,opacity:ib?0.5:1}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
            <div style={{flex:1}}>
              <div style={{fontSize:12,fontWeight:600,color:ib?"#ef4444":"#e2e8f0",fontFamily:mono}}>{ex.name}</div>
              <div style={{fontSize:9,color:"#475569",marginTop:2,fontFamily:mono}}>{ex.eq}</div>
              <div style={{fontSize:9,color:"#64748b",marginTop:2,fontFamily:mono}}>{[...ex.p,...ex.s].map(({m,p})=>`${m} ${p}%`).join(" / ")}</div>
            </div>
            <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:6}}>
              <Stars value={prefs[ex.name]||0} onChange={v=>onSetPref(ex.name,v)} size={20}/>
              <button onClick={()=>ib?onUnban(ex.name):onBan(ex.name)}
                style={{background:"none",border:`1px solid ${ib?"#22c55e44":"#ef444444"}`,borderRadius:3,
                  color:ib?"#22c55e":"#ef4444",fontSize:9,padding:"3px 8px",cursor:"pointer",fontFamily:mono}}>{ib?"unban":"ban"}</button>
            </div>
          </div>
        </div>);})}
    </div>
  </div>);
}

function SetRow({set,index,onUpdate,onRemove,isTimer}){
  const rc=RPEC[set.rpe]||"#475569";
  return(<div style={{display:"flex",alignItems:"center",gap:4,padding:"3px 0"}}>
    <div style={{width:18,fontSize:9,color:"#64748b",fontFamily:mono}}>{index+1}</div>
    {isTimer?
      <input type="text" placeholder="dur" value={set.reps} onChange={e=>onUpdate(index,"reps",e.target.value)}
        style={{flex:1,height:30,background:"#1e293b",border:"1px solid #334155",borderRadius:3,color:"#e2e8f0",padding:"0 8px",fontSize:11,fontFamily:mono}}/>
    :<>
      <input type="number" placeholder="reps" value={set.reps} onChange={e=>onUpdate(index,"reps",e.target.value)}
        style={{flex:1,height:30,background:"#1e293b",border:"1px solid #334155",borderRadius:3,color:"#e2e8f0",padding:"0 8px",fontSize:11,fontFamily:mono}}/>
      <input type="number" placeholder="lbs" value={set.weight} onChange={e=>onUpdate(index,"weight",e.target.value)}
        style={{width:58,height:30,background:"#1e293b",border:"1px solid #334155",borderRadius:3,color:"#e2e8f0",padding:"0 8px",fontSize:11,fontFamily:mono}}/>
    </>}
    <select value={set.rpe||""} onChange={e=>onUpdate(index,"rpe",e.target.value?Number(e.target.value):"")}
      style={{width:50,height:30,background:"#1e293b",border:`1px solid ${set.rpe?rc:"#334155"}`,borderRadius:3,color:set.rpe?rc:"#64748b",fontSize:11,fontFamily:mono}}>
      <option value="">RPE</option>{[6,7,8,9,10].map(r=><option key={r} value={r}>{r}</option>)}</select>
    <button onClick={()=>onRemove(index)} style={{width:22,height:22,background:"none",border:"none",color:"#ef4444",cursor:"pointer",fontSize:13}}>x</button>
  </div>);
}

function ExCard({ex,onUpdate,onRemoveSet,onAddSet,onToggleLock,onBan,onRemove,onFatigue,onSetPref,prefs,active}){
  const[open,setOpen]=useState(true);
  const allM=[...ex.p,...ex.s];
  const isTimer=ex.name.includes("Plank")||ex.name.includes("Hold")||ex.name.includes("Carry")||ex.name.includes("Carries")||ex.name.includes("Wall Sit");
  const hasLogged=ex.sets.some(s=>s.reps);
  return(<div style={{background:"#0f172a",border:`1px solid ${ex.locked?"#f59e0b44":"#1e293b"}`,borderLeft:ex.locked?"3px solid #f59e0b":"1px solid #1e293b",borderRadius:6,marginBottom:8}}>
    <div style={{display:"flex",alignItems:"center",padding:"8px 10px",gap:6}}>
      <button onClick={()=>onToggleLock(ex.id)}
        style={{width:28,height:28,borderRadius:3,border:"none",cursor:"pointer",background:ex.locked?"#f59e0b":"#1e293b",
          color:ex.locked?"#0f172a":"#64748b",fontSize:13,display:"flex",alignItems:"center",justifyContent:"center"}}>{ex.locked?"\u{1F512}":"\u{1F513}"}</button>
      <div style={{flex:1,cursor:"pointer"}} onClick={()=>setOpen(!open)}>
        <div style={{fontSize:12,fontWeight:600,color:"#f1f5f9",fontFamily:mono}}>{ex.name}</div>
        <div style={{fontSize:9,color:"#64748b",marginTop:1,fontFamily:mono}}>{allM.map(({m,p})=>`${m} ${p}%`).join(" / ")}</div>
      </div>
      <div style={{display:"flex",alignItems:"center",gap:4}}>
        {ex.fatigueRating!=null&&<span style={{fontSize:8,padding:"2px 4px",borderRadius:3,background:`${FC[ex.fatigueRating]}22`,color:FC[ex.fatigueRating],fontFamily:mono}}>F{ex.fatigueRating}</span>}
        <span style={{color:"#64748b",fontSize:10,cursor:"pointer"}} onClick={()=>setOpen(!open)}>{open?"\u25B2":"\u25BC"}</span>
      </div>
    </div>
    {open&&<div style={{padding:"0 10px 8px"}}>
      <SuggestionBadge sug={ex.suggestion}/>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
        <span style={{fontSize:8,color:"#475569",fontFamily:mono}}>{ex.eq}</span>
        <div style={{display:"flex",alignItems:"center",gap:6}}>
          <Stars value={prefs[ex.name]||0} onChange={v=>onSetPref(ex.name,v)} size={16}/>
          <span onClick={()=>onBan(ex.name)} style={{color:"#ef444466",fontSize:9,cursor:"pointer",fontFamily:mono}}>ban</span>
          <span onClick={()=>onRemove(ex.id)} style={{color:"#ef444466",fontSize:9,cursor:"pointer",fontFamily:mono}}>rem</span>
        </div>
      </div>
      {ex.sets.map((set,i)=><SetRow key={i} set={set} index={i} isTimer={isTimer}
        onUpdate={(idx,f,v)=>onUpdate(ex.id,idx,f,v)} onRemove={idx=>onRemoveSet(ex.id,idx)}/>)}
      <div style={{display:"flex",gap:5,marginTop:3}}>
        <button onClick={()=>onAddSet(ex.id)} style={{flex:1,height:26,background:"#1e293b",border:"1px dashed #334155",borderRadius:3,color:"#64748b",fontSize:10,cursor:"pointer",fontFamily:mono}}>+ set</button>
        {active&&hasLogged&&<button onClick={()=>onFatigue(ex.id)}
          style={{height:26,background:ex.fatigueRating!=null?`${FC[ex.fatigueRating]}22`:"#1e293b",
            border:`1px solid ${ex.fatigueRating!=null?FC[ex.fatigueRating]:"#334155"}`,borderRadius:3,
            color:ex.fatigueRating!=null?FC[ex.fatigueRating]:"#64748b",fontSize:9,cursor:"pointer",fontFamily:mono,padding:"0 8px"}}>
          {ex.fatigueRating!=null?`F: ${FATIGUE_LABELS[ex.fatigueRating]}`:"Rate fatigue"}</button>}
      </div>
    </div>}
  </div>);
}

function TrendCard({muscle,trend,data}){
  if(!trend)return null;
  const arrow=trend.direction==="up"?"\u2197":trend.direction==="down"?"\u2198":"\u2192";
  const color=trend.direction==="up"?"#22c55e":trend.direction==="down"?"#ef4444":"#eab308";
  const recent=data?.slice(-8)||[];
  const maxVol=Math.max(...recent.map(d=>d.volumeLoad),1);
  return(<div style={{background:"#0f172a",border:"1px solid #1e293b",borderRadius:6,padding:"10px 12px",marginBottom:6}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
      <div style={{fontSize:11,fontWeight:600,color:"#e2e8f0",fontFamily:mono,textTransform:"capitalize"}}>{muscle}</div>
      <div style={{display:"flex",alignItems:"center",gap:6}}>
        <span style={{fontSize:10,color,fontFamily:mono}}>{arrow} {trend.pctChange>0?"+":""}{trend.pctChange}%</span>
        <span style={{fontSize:9,color:"#64748b",fontFamily:mono}}>RPE {trend.avgRpe}</span>
      </div>
    </div>
    <div style={{display:"flex",alignItems:"flex-end",gap:2,height:32}}>
      {recent.map((d,i)=>{
        const h=maxVol>0?(d.volumeLoad/maxVol)*30:0;
        const rpeColor=d.avgRpe>=9?"#ef4444":d.avgRpe>=8?"#f97316":d.avgRpe>=7?"#eab308":"#22c55e";
        return<div key={i} style={{flex:1,height:Math.max(h,2),background:rpeColor,borderRadius:1,opacity:i===recent.length-1?1:0.5}}/>;
      })}
    </div>
    {recent.length>0&&<div style={{fontSize:8,color:"#475569",marginTop:4,fontFamily:mono}}>
      Last: {recent[recent.length-1].exercises?.join(", ")} | Vol: {recent[recent.length-1].volumeLoad}
    </div>}
  </div>);
}

// ── Main App ──
export default function App(){
  const[view,setView]=useState("home");
  const[fatigue,setFatigue]=useState(()=>{const f={};MUSCLES.forEach(m=>f[m]=0);return f;});
  const[workout,setWorkout]=useState(null);
  const[history,setHistory]=useState([]);
  const[banned,setBanned]=useState([]);
  const[prefs,setPrefs]=useState({});
  const[exLog,setExLog]=useState({});
  const[muscleTrends,setMuscleTrends]=useState({});
  const[exCount,setExCount]=useState(7);
  const[fModal,setFModal]=useState(null);
  const[showAdd,setShowAdd]=useState(false);
  const[showLib,setShowLib]=useState(false);

  useEffect(()=>{
    setHistory(ld(SK.history,[]));setFatigue(ld(SK.fatigue,fatigue));setBanned(ld(SK.banned,[]));
    setPrefs(ld(SK.prefs,{}));setExLog(ld(SK.exLog,{}));setMuscleTrends(ld(SK.muscleTrends,{}));
    setExCount(ld(SK.settings,{exerciseCount:7}).exerciseCount||7);
    const c=ld(SK.current,null);if(c){setWorkout(c);setView("workout");}
  },[]);

  const setFat=useCallback((m,l)=>{setFatigue(p=>{const n={...p,[m]:l};sv(SK.fatigue,n);return n;});},[]);
  const gen=useCallback(()=>{const w=generateWorkout(fatigue,exCount,banned,[],prefs,exLog);setWorkout(w);setView("workout");sv(SK.current,w);},[fatigue,exCount,banned,prefs,exLog]);
  const reroll=useCallback(()=>{if(!workout)return;const w=generateWorkout(fatigue,exCount,banned,workout.exercises.filter(e=>e.locked),prefs,exLog);setWorkout(w);sv(SK.current,w);},[fatigue,exCount,banned,workout,prefs,exLog]);
  const togLock=useCallback(id=>{setWorkout(p=>{const n={...p,exercises:p.exercises.map(e=>e.id===id?{...e,locked:!e.locked}:e)};sv(SK.current,n);return n;});},[]);
  const ban=useCallback(name=>{setBanned(p=>{if(p.includes(name))return p;const n=[...p,name];sv(SK.banned,n);return n;});
    setWorkout(p=>{if(!p)return p;const n={...p,exercises:p.exercises.filter(e=>e.name!==name)};sv(SK.current,n);return n;});},[]);
  const unban=useCallback(name=>{setBanned(p=>{const n=p.filter(x=>x!==name);sv(SK.banned,n);return n;});},[]);
  const setPref=useCallback((name,val)=>{setPrefs(p=>{const n={...p,[name]:val};sv(SK.prefs,n);return n;});},[]);
  const upSet=useCallback((eid,si,f,v)=>{setWorkout(p=>{const n={...p,exercises:p.exercises.map(e=>e.id===eid?{...e,sets:e.sets.map((s,i)=>i===si?{...s,[f]:v}:s)}:e)};sv(SK.current,n);return n;});},[]);
  const addSet=useCallback(eid=>{setWorkout(p=>{const n={...p,exercises:p.exercises.map(e=>e.id===eid?{...e,sets:[...e.sets,{reps:"",weight:"",rpe:""}]}:e)};sv(SK.current,n);return n;});},[]);
  const remSet=useCallback((eid,si)=>{setWorkout(p=>{const n={...p,exercises:p.exercises.map(e=>e.id===eid?{...e,sets:e.sets.filter((_,i)=>i!==si)}:e)};sv(SK.current,n);return n;});},[]);
  const remEx=useCallback(eid=>{setWorkout(p=>{const n={...p,exercises:p.exercises.filter(e=>e.id!==eid)};sv(SK.current,n);return n;});},[]);
  const addFromPool=useCallback(exercise=>{setWorkout(p=>{
    const sug=getSuggestion(exercise.name,exLog);
    const ne={id:crypto.randomUUID(),name:exercise.name,eq:exercise.eq,cat:exercise.cat,p:exercise.p,s:exercise.s,
      suggestedSets:2,suggestedReps:sug?.sugR||8,suggestedWeight:sug?.sugW||"",suggestion:sug,locked:false,fatigueRating:null,
      sets:[{reps:sug?.sugR||"",weight:sug?.sugW||"",rpe:""},{reps:sug?.sugR||"",weight:sug?.sugW||"",rpe:""}]};
    const n={...p,exercises:[...p.exercises,ne]};sv(SK.current,n);return n;});setShowAdd(false);},[exLog]);
  const reqFat=useCallback(eid=>{const e=workout?.exercises.find(x=>x.id===eid);if(e)setFModal(e);},[workout]);
  const subFat=useCallback(r=>{if(!fModal)return;
    setWorkout(p=>{const n={...p,exercises:p.exercises.map(e=>e.id===fModal.id?{...e,fatigueRating:r}:e)};sv(SK.current,n);return n;});
    setFModal(null);},[fModal]);

  const saveW=useCallback(()=>{if(!workout)return;
    const{newExLog,newTrends}=saveWorkoutData(workout,fatigue,exLog,muscleTrends);
    setExLog(newExLog);sv(SK.exLog,newExLog);
    setMuscleTrends(newTrends);sv(SK.muscleTrends,newTrends);
    const entry={...workout,fatigue:{...fatigue},saved:new Date().toISOString()};
    const nh=[entry,...history].slice(0,50);setHistory(nh);sv(SK.history,nh);sv(SK.current,null);
    // Update fatigue from exercise ratings
    const nf={...fatigue};
    workout.exercises.forEach(ex=>{if(ex.fatigueRating!=null){[...ex.p,...ex.s].forEach(({m,p})=>{
      const c=(p/100)*ex.fatigueRating*0.7;nf[m]=Math.min(4,Math.round(Math.max(nf[m],c)));});}
    else{const ls=ex.sets.filter(s=>s.reps);const ar=ls.reduce((a,s)=>a+(s.rpe||7),0)/(ls.length||1);
      [...ex.p,...ex.s].forEach(({m,p})=>{const c=(p/100)*ls.length*(ar/10)*0.5;nf[m]=Math.min(4,Math.round((nf[m]||0)+c));});}});
    setFatigue(nf);sv(SK.fatigue,nf);setWorkout(null);setView("home");},[workout,fatigue,history,exLog,muscleTrends]);

  const discard=useCallback(()=>{setWorkout(null);sv(SK.current,null);setView("home");},[]);
  const delHist=useCallback(d=>{const n=history.filter(h=>h.saved!==d);setHistory(n);sv(SK.history,n);},[history]);
  const poolSize=useMemo(()=>EXERCISES.filter(e=>!banned.includes(e.name)).length,[banned]);

  const nb=(l,t)=>({flex:1,padding:"11px 0",background:"none",border:"none",borderBottom:view===t?"2px solid #f59e0b":"2px solid transparent",
    color:view===t?"#f59e0b":"#64748b",fontSize:9,fontWeight:600,cursor:"pointer",fontFamily:mono,letterSpacing:1,textTransform:"uppercase"});

  return(<div style={{background:"#020617",minHeight:"100vh",color:"#e2e8f0",fontFamily:mono,paddingBottom:80}}>
    <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;700&display=swap" rel="stylesheet"/>
    <nav style={{display:"flex",borderBottom:"1px solid #1e293b",background:"#0f172a",position:"sticky",top:0,zIndex:10}}>
      <button style={nb("S","home")} onClick={()=>setView("home")}>Setup</button>
      <button style={nb("W","workout")} onClick={()=>workout&&setView("workout")}>Workout</button>
      <button style={nb("T","trends")} onClick={()=>setView("trends")}>Trends</button>
      <button style={nb("H","history")} onClick={()=>setView("history")}>History</button>
    </nav>

    <div style={{padding:"12px 10px"}}>
      {/* ── SETUP ── */}
      {view==="home"&&<>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
          <div style={{fontSize:10,color:"#f59e0b",letterSpacing:2,textTransform:"uppercase"}}>Fatigue</div>
          <div style={{display:"flex",gap:6}}>
            <button onClick={()=>setShowLib(true)} style={{background:"#1e293b",border:"1px solid #334155",borderRadius:3,color:"#94a3b8",fontSize:9,padding:"4px 8px",cursor:"pointer",fontFamily:mono}}>Library ({poolSize})</button>
            <button onClick={()=>{const f={};MUSCLES.forEach(m=>f[m]=0);setFatigue(f);sv(SK.fatigue,f);}} style={{background:"#1e293b",border:"1px solid #334155",borderRadius:3,color:"#64748b",fontSize:9,padding:"4px 8px",cursor:"pointer",fontFamily:mono}}>Reset</button>
          </div>
        </div>
        {MUSCLES.map(m=><FatSlider key={m} muscle={m} value={fatigue[m]} onChange={setFat}/>)}
        <div style={{marginTop:14,display:"flex",alignItems:"center",gap:6}}>
          <div style={{fontSize:9,color:"#64748b"}}>COUNT:</div>
          {[5,6,7,8,9].map(n=><button key={n} onClick={()=>{setExCount(n);sv(SK.settings,{exerciseCount:n});}}
            style={{width:32,height:32,borderRadius:3,border:"none",cursor:"pointer",background:exCount===n?"#f59e0b":"#1e293b",
              color:exCount===n?"#0f172a":"#64748b",fontWeight:700,fontSize:13,fontFamily:mono}}>{n}</button>)}
        </div>
        <button onClick={gen} style={{width:"100%",height:46,marginTop:18,background:"#f59e0b",border:"none",borderRadius:6,
          color:"#0f172a",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:mono,letterSpacing:2,textTransform:"uppercase"}}>Generate Workout</button>
      </>}

      {/* ── WORKOUT ── */}
      {view==="workout"&&workout&&<>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
          <div style={{fontSize:9,color:"#f59e0b",letterSpacing:2,textTransform:"uppercase"}}>{workout.exercises.length} ex ({workout.exercises.filter(e=>e.locked).length} locked)</div>
          <button onClick={reroll} style={{background:"#1e293b",border:"1px solid #334155",borderRadius:3,color:"#94a3b8",fontSize:9,padding:"4px 10px",cursor:"pointer",fontFamily:mono}}>Reroll unlocked</button>
        </div>
        {workout.exercises.map(ex=><ExCard key={ex.id} ex={ex} onUpdate={upSet} onRemoveSet={remSet} onAddSet={addSet}
          onToggleLock={togLock} onBan={ban} onRemove={remEx} onFatigue={reqFat} onSetPref={setPref} prefs={prefs} active={true}/>)}
        <button onClick={()=>setShowAdd(!showAdd)} style={{width:"100%",height:34,background:"#1e293b",border:"1px dashed #334155",borderRadius:6,color:"#64748b",fontSize:10,cursor:"pointer",marginBottom:8,fontFamily:mono}}>
          {showAdd?"Close":"+ Add Exercise"}</button>
        {showAdd&&<div style={{background:"#0f172a",border:"1px solid #1e293b",borderRadius:6,padding:8,marginBottom:10,maxHeight:260,overflowY:"auto"}}>
          {EXERCISES.filter(e=>!banned.includes(e.name)&&!workout.exercises.find(w=>w.name===e.name)).map((ex,i)=>(
            <div key={i} onClick={()=>addFromPool(ex)} style={{padding:"7px 6px",borderBottom:"1px solid #1e293b11",cursor:"pointer",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div><div style={{fontSize:10,color:"#cbd5e1"}}>{ex.name} {(prefs[ex.name]||0)>0&&<span style={{color:"#f59e0b"}}>{"★".repeat(prefs[ex.name])}</span>}</div>
                <div style={{fontSize:8,color:"#475569"}}>{[...ex.p,...ex.s].map(({m,p})=>`${m} ${p}%`).join(" / ")}</div></div>
              <span style={{color:"#f59e0b",fontSize:14}}>+</span></div>))}
        </div>}
        {workout.muscleCoverage&&<div style={{marginTop:4,marginBottom:12}}>
          <div style={{fontSize:8,color:"#475569",marginBottom:3,letterSpacing:1}}>VOLUME</div>
          {MUSCLES.map(m=><Bar key={m} muscle={m} value={workout.muscleCoverage[m]||0} maxVal={300} fatigue={fatigue[m]}/>)}</div>}
        <div style={{display:"flex",gap:8,marginTop:12}}>
          <button onClick={discard} style={{flex:1,height:42,background:"#1e293b",border:"1px solid #334155",borderRadius:6,color:"#94a3b8",fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:mono}}>Discard</button>
          <button onClick={saveW} style={{flex:2,height:42,background:"#22c55e",border:"none",borderRadius:6,color:"#0f172a",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:mono,letterSpacing:1,textTransform:"uppercase"}}>Save</button>
        </div>
      </>}
      {view==="workout"&&!workout&&<div style={{textAlign:"center",padding:"60px 20px",color:"#475569"}}>
        <div style={{fontSize:11,marginBottom:12}}>No active workout</div>
        <button onClick={()=>setView("home")} style={{background:"#f59e0b",border:"none",borderRadius:6,color:"#0f172a",padding:"10px 20px",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:mono}}>Setup</button>
      </div>}

      {/* ── TRENDS ── */}
      {view==="trends"&&<>
        <div style={{fontSize:10,color:"#f59e0b",letterSpacing:2,marginBottom:12,textTransform:"uppercase"}}>Muscle Group Trends</div>
        {MUSCLES.map(m=>{
          const trend=getMuscleTrend(m,muscleTrends);
          const data=muscleTrends[m];
          if(!data||data.length===0)return(<div key={m} style={{background:"#0f172a",border:"1px solid #1e293b",borderRadius:6,padding:"10px 12px",marginBottom:6}}>
            <div style={{fontSize:11,color:"#475569",fontFamily:mono,textTransform:"capitalize"}}>{m} - no data yet</div></div>);
          return<TrendCard key={m} muscle={m} trend={trend} data={data}/>;
        })}
        <div style={{marginTop:16,fontSize:10,color:"#f59e0b",letterSpacing:2,marginBottom:12,textTransform:"uppercase"}}>Exercise History</div>
        {Object.entries(exLog).sort((a,b)=>b[1].length-a[1].length).slice(0,15).map(([name,entries])=>{
          const last=entries[entries.length-1];
          const best=last.sets.filter(s=>s.weight).sort((a,b)=>(b.weight*b.reps)-(a.weight*a.reps))[0];
          const e1rms=entries.map(e=>{const b=e.sets.filter(s=>s.weight&&s.reps).sort((a,b)=>(b.weight*b.reps)-(a.weight*a.reps))[0];
            return b?Math.round(b.weight*(1+b.reps/30)):0;}).filter(Boolean);
          const e1rmTrend=e1rms.length>=2?(e1rms[e1rms.length-1]-e1rms[0]):0;
          return(<div key={name} style={{background:"#0f172a",border:"1px solid #1e293b",borderRadius:6,padding:"8px 12px",marginBottom:4}}>
            <div style={{display:"flex",justifyContent:"space-between"}}>
              <div style={{fontSize:11,color:"#e2e8f0",fontFamily:mono}}>{name}</div>
              <div style={{fontSize:9,color:"#64748b",fontFamily:mono}}>{entries.length} sessions</div>
            </div>
            {best&&<div style={{fontSize:9,color:"#94a3b8",fontFamily:mono,marginTop:2}}>
              Last: {best.reps}x{best.weight}lb {best.rpe?`@${best.rpe}`:""} | e1RM: {Math.round(best.weight*(1+best.reps/30))}
              {e1rmTrend!==0&&<span style={{color:e1rmTrend>0?"#22c55e":"#ef4444"}}> ({e1rmTrend>0?"+":""}{e1rmTrend})</span>}
            </div>}
          </div>);
        })}
      </>}

      {/* ── HISTORY ── */}
      {view==="history"&&<>
        <div style={{fontSize:10,color:"#f59e0b",letterSpacing:2,marginBottom:12,textTransform:"uppercase"}}>{history.length} Saved</div>
        {history.length===0&&<div style={{textAlign:"center",padding:"40px 20px",color:"#475569",fontSize:11}}>No workouts yet</div>}
        {history.map((entry,i)=>{
          const d=new Date(entry.saved);const ds=d.toLocaleDateString("en-US",{weekday:"short",month:"short",day:"numeric"});
          const ts=entry.exercises.reduce((s,e)=>s+e.sets.filter(x=>x.reps).length,0);
          const ar=(()=>{const r=entry.exercises.flatMap(e=>e.sets.map(s=>s.rpe).filter(Boolean));return r.length?(r.reduce((a,b)=>a+b,0)/r.length).toFixed(1):"--";})();
          return(<div key={entry.saved||i} style={{background:"#0f172a",border:"1px solid #1e293b",borderRadius:6,marginBottom:6,padding:"10px 12px"}}>
            <div style={{display:"flex",justifyContent:"space-between"}}>
              <div><div style={{fontSize:11,fontWeight:600,color:"#e2e8f0",fontFamily:mono}}>{ds}</div>
                <div style={{fontSize:9,color:"#64748b",marginTop:2,fontFamily:mono}}>{entry.exercises.length} ex / {ts} sets / RPE {ar}</div></div>
              <button onClick={()=>delHist(entry.saved)} style={{background:"none",border:"none",color:"#ef444444",fontSize:9,cursor:"pointer",fontFamily:mono}}>del</button>
            </div>
            <div style={{marginTop:6}}>
              {entry.exercises.map((ex,j)=><div key={j} style={{fontSize:9,color:"#94a3b8",fontFamily:mono}}>
                {ex.name}: {ex.sets.filter(s=>s.reps).map((s,k)=>`${s.reps}${s.weight?`x${s.weight}`:""}`).join(", ")}
              </div>)}
            </div>
          </div>);
        })}
      </>}
    </div>

    {fModal&&<FatigueModal exercise={fModal} onSubmit={subFat} onSkip={()=>setFModal(null)}/>}
    {showLib&&<Library banned={banned} prefs={prefs} onBan={ban} onUnban={unban} onSetPref={setPref} onClose={()=>setShowLib(false)}/>}
  </div>);
}
