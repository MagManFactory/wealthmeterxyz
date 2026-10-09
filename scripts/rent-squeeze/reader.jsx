import React,{useState,useEffect} from 'react';
import {createRoot} from 'react-dom/client';
import {ReaderContext} from './native-controls.jsx';
import {DashboardContent} from './DashboardContent.jsx';
function readLocation(rows){
 const p=new URLSearchParams(location.search),valid=new Set(rows.map(r=>r.abbr));const result={};
 for(const key of ['selected','compare'])if(valid.has(p.get(key))&&(key==='compare'||p.get(key)!=='US'))result[key]=p.get(key);
 if(['burden30','burden50'].includes(p.get('metric')))result.metric=p.get('metric');
 for(const [key,min,max] of [['rentRange',700,2400],['burdenRange',0,70]]){const raw=p.get(key);if(raw){const a=raw.split(',').map(Number);if(a.length===2&&a.every(Number.isFinite)&&a[0]>=min&&a[1]<=max&&a[0]<=a[1])result[key]=a;}}
 if(p.has('minIncome')){const n=Number(p.get('minIncome'));if(Number.isFinite(n)&&n>=0&&n<=95000)result.minIncome=n;}
 return result;
}
function Reader({snapshot}){
 const [filters,setFilters]=useState(()=>readLocation(snapshot.queries.states.rows));
 useEffect(()=>{const pop=()=>setFilters(readLocation(snapshot.queries.states.rows));window.addEventListener('popstate',pop);return()=>window.removeEventListener('popstate',pop);},[snapshot]);
 const updateChartState=(_,patch)=>{const next=patch.inlineFilters;setFilters(next);const p=new URLSearchParams();Object.entries(next).forEach(([k,v])=>p.set(k,Array.isArray(v)?v.join(','):v));history.replaceState(null,'',location.pathname+'?'+p);};
 return <ReaderContext.Provider value={{queries:snapshot.queries,snapshot,chartStates:{'rent-plane':{inlineFilters:filters}},updateChartState,visible:()=>true}}><DashboardContent/></ReaderContext.Provider>;
}
fetch('/data/rent-squeeze-2024.json').then(r=>{if(!r.ok)throw new Error('Data unavailable');return r.json();}).then(snapshot=>createRoot(document.getElementById('rent-squeeze-root')).render(<Reader snapshot={snapshot}/>)).catch(()=>{document.getElementById('rent-squeeze-root').innerHTML='<p>Reviewed Census data could not load. Reload this page or <a href="/data/rent-squeeze-2024.json">download the data and methods</a>.</p>';});
