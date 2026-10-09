import React, {useEffect,useMemo,useRef,useState} from 'react';
import {DataComponent,ChartMark,DataTable,Dropdown,SegmentedControl,RangeSlider,Slider,Button,SectionHeader,useDataApp} from './native-controls.jsx';


const money=n=>Number.isFinite(n)?'$'+Math.round(n).toLocaleString('en-US'):'—';
const pct=n=>Number.isFinite(n)?n.toFixed(1)+'%':'—';
const num=n=>Number.isFinite(n)?Math.round(n).toLocaleString('en-US'):'—';
const code=(r)=>r?.abbr??'';
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const inkIncome=n=>{const t=clamp((n-30000)/65000,0,1);return `rgb(${Math.round(149-125*t)} ${Math.round(196-123*t)} ${Math.round(211-113*t)})`;};
const DEFAULT={selected:'MS',compare:'ND',metric:'burden30',rentRange:[700,2400],burdenRange:[0,70],minIncome:0};
const fit=(r,s)=>r.rent>=s.rentRange[0]&&r.rent<=s.rentRange[1]&&r[s.metric]>=s.burdenRange[0]&&r[s.metric]<=s.burdenRange[1]&&r.renterIncome>=s.minIncome;
function useWidth(){const ref=useRef(null),[width,setWidth]=useState(760);useEffect(()=>{const ob=new ResizeObserver(es=>setWidth(Math.max(280,es[0].contentRect.width))); if(ref.current)ob.observe(ref.current);return()=>ob.disconnect();},[]);return [ref,width];}
function interval(r,k,format=pct){return `${format(r[k])} ±${format===money?money(r[k+'Moe']):r[k+'Moe'].toFixed(1)+' pp'}`;}
function downloadJSON(data){const b=new Blob([JSON.stringify(data,null,2)],{type:'application/json'}),url=URL.createObjectURL(b),a=document.createElement('a');a.href=url;a.download='Rent-Squeeze-reviewed-data-2024.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}

function RentPlane({rows,nation,state,update,selected,comparison}){
 const [ref,w]=useWidth(),svg=useRef(null),drag=useRef(null);const height=w<450?355:400,m={l:48,r:24,t:25,b:56};
 const x=v=>m.l+(v-700)/1700*(w-m.l-m.r),y=v=>height-m.b-v/70*(height-m.t-m.b);
 const pos=e=>{const b=svg.current.getBoundingClientRect();return [clamp(700+(e.clientX-b.left-m.l)/(w-m.l-m.r)*1700,700,2400),clamp((height-m.b-(e.clientY-b.top))/(height-m.t-m.b)*70,0,70)];};
 const begin=e=>{if(e.button!==0)return;drag.current=pos(e);e.currentTarget.setPointerCapture(e.pointerId);};
 const move=e=>{if(!drag.current)return;const p=pos(e),d=drag.current;update({rentRange:[Math.round(Math.min(p[0],d[0])),Math.round(Math.max(p[0],d[0]))],burdenRange:[Math.min(p[1],d[1]),Math.max(p[1],d[1])]});};
 const end=e=>{if(drag.current){const p=pos(e);if(Math.abs(p[0]-drag.current[0])<5&&Math.abs(p[1]-drag.current[1])<1)update({rentRange:DEFAULT.rentRange,burdenRange:DEFAULT.burdenRange});}drag.current=null;};
 const brush=state.rentRange[0]>700||state.rentRange[1]<2400||state.burdenRange[0]>0||state.burdenRange[1]<70;
 return <div ref={ref} className="rs-plane" data-chart-interaction-root>
 <svg ref={svg} width="100%" height={height} viewBox={`0 0 ${w} ${height}`} role="img" aria-label={`State median monthly gross rent versus share of renters paying ${state.metric==='burden30'?'30':'50'} percent or more of income. Drag empty space to select a range; equivalent sliders follow.`}>
  <rect x={m.l} y={m.t} width={w-m.l-m.r} height={height-m.t-m.b} fill="transparent" onPointerDown={begin} onPointerMove={move} onPointerUp={end} onPointerCancel={()=>drag.current=null} className="rs-brush-area"/>
  {[0,20,40,60].map(t=><g key={t} pointerEvents="none"><line x1={m.l} y1={y(t)} x2={w-m.r} y2={y(t)} className="rs-grid"/><text x={m.l-9} y={y(t)+4} textAnchor="end" className="rs-axis">{t}%</text></g>)}
  {[800,1200,1600,2000,2400].filter((_,i)=>w>400||i%2===0).map(t=><g key={t} pointerEvents="none"><text x={x(t)} y={height-m.b+24} textAnchor="middle" className="rs-axis">{money(t)}</text></g>)}
  <text x={m.l} y={13} className="rs-axis rs-axis-title">Share paying {state.metric==='burden30'?'30':'50'}%+ of income</text>
  <text x={(m.l+w-m.r)/2} y={height-5} textAnchor="middle" className="rs-axis rs-axis-title">Median monthly gross rent · 2024 USD</text>
  <g pointerEvents="none"><line x1={x(nation.rent)} x2={x(nation.rent)} y1={m.t} y2={height-m.b} className="rs-us-line"/><line x1={m.l} x2={w-m.r} y1={y(nation[state.metric])} y2={y(nation[state.metric])} className="rs-us-line"/><text x={w-m.r-3} y={y(nation[state.metric])-7} textAnchor="end" className="rs-axis">U.S. {pct(nation[state.metric])}</text></g>
  {brush&&<rect pointerEvents="none" x={x(state.rentRange[0])} y={y(state.burdenRange[1])} width={Math.max(1,x(state.rentRange[1])-x(state.rentRange[0]))} height={Math.max(1,y(state.burdenRange[0])-y(state.burdenRange[1]))} className="rs-selection"/>}
  {[selected,comparison].filter(r=>r.abbr!=='US').map((r,i)=><g key={r.abbr+'-'+i} pointerEvents="none" className={i?'rs-compare-whisker':'rs-selected-whisker'}><line x1={x(r.rent-r.rentMoe)} x2={x(r.rent+r.rentMoe)} y1={y(r[state.metric])} y2={y(r[state.metric])}/><line x1={x(r.rent)} x2={x(r.rent)} y1={y(r[state.metric]-r[state.metric+'Moe'])} y2={y(r[state.metric]+r[state.metric+'Moe'])}/></g>)}
 </svg>
 <div className="rs-mark-layer" style={{height}}>
 {rows.map(r=>{const match=fit(r,state),a=r.abbr===selected.abbr,b=r.abbr===comparison.abbr;return <ChartMark key={r.geoid} className={`rs-point ${a?'is-selected':''} ${b?'is-comparison':''}`} style={{left:x(r.rent),top:y(r[state.metric]),'--dot':inkIncome(r.renterIncome),opacity:match||a||b?1:.17}} aria-label={`${r.name}: gross rent ${money(r.rent)}, ${pct(r[state.metric])} rent burden. Open details actions.`}
 context={{kind:'chart',chartType:'scatter',label:r.name,value:r[state.metric],row:r,actions:[{label:`Inspect ${r.name}`,onSelect:()=>update({selected:r.abbr})},{label:`Compare with ${r.name}`,onSelect:()=>update({compare:r.abbr})}]}}
 tooltip={<div className="chart-tooltip rs-tip"><strong>{r.name}</strong><span>Gross rent {interval(r,'rent',money)}</span><span>Rent burden {interval(r,state.metric)}</span><span>Renter income {money(r.renterIncome)}</span><small>90% margins; burden MOE approximate</small></div>}><span aria-hidden="true"/>{(a||b)&&<b aria-hidden="true" className={a?'rs-label-a':'rs-label-b'}>{r.abbr}</b>}</ChartMark>;})}
 </div>
 </div>;
}
function IncomeComparison({rows,first,second,activeBand,setBand}){
 const [ref,w]=useWidth();const m={l:w<500?99:116,r:48,t:30,b:28},h=330,x=v=>m.l+v/100*(w-m.l-m.r);const a=rows.filter(r=>r.abbr===first.abbr).sort((a,b)=>a.order-b.order),b=rows.filter(r=>r.abbr===second.abbr).sort((a,b)=>a.order-b.order);
 return <div ref={ref} className="rs-income-chart"><svg width="100%" viewBox={`0 0 ${w} ${h}`} role="img" aria-label={`Rent burden by annual income, ${first.name} versus ${second.name}. All rows use a common zero to 100 percent scale. Exact values are in the selected income band below.`}>
 {[0,25,50,75,100].map(v=><g key={v}><line className="rs-grid" x1={x(v)} x2={x(v)} y1={m.t-5} y2={h-m.b}/><text className="rs-axis" x={x(v)} y={h-7} textAnchor="middle">{v}%</text></g>)}
 {a.map((r,i)=>{const q=b[i],y=48+i*51;return <g key={r.incomeBand}>
 {activeBand===i&&<rect x="0" y={y-20} width={w} height="49" className="rs-income-active"/>}
 <text x={m.l-13} y={y+4} textAnchor="end" className="rs-axis">{r.incomeBand.replace('$34,999','<$35k').replace('$49,999','<$50k').replace('$74,999','<$75k')}</text>
 <line x1={x(r.burden30)} x2={x(q.burden30)} y1={y} y2={y} className="rs-connect"/>
 {[r,q].map((d,j)=><g key={j} className={j?'rs-compare-whisker':'rs-selected-whisker'}><line x1={x(d.lower90)} x2={x(d.upper90)} y1={y+(j?6:-6)} y2={y+(j?6:-6)}/><line x1={x(d.lower90)} x2={x(d.lower90)} y1={y+(j?3:-9)} y2={y+(j?9:-3)}/><line x1={x(d.upper90)} x2={x(d.upper90)} y1={y+(j?3:-9)} y2={y+(j?9:-3)}/><circle cx={x(d.burden30)} cy={y+(j?6:-6)} r="5" fill={j?'var(--rs-comparison)':'var(--rs-selected)'} stroke="var(--surface)" strokeWidth="1"/></g>)}
 </g>;})}
 </svg><div className="rs-band-buttons" aria-label="Inspect income band">{a.map((r,i)=><button key={r.incomeBand} aria-pressed={activeBand===i} onClick={()=>setBand(i)}>{r.incomeBand}</button>)}</div></div>;
}
function Stat({label,value,note}){return <div className="rs-stat"><span>{label}</span><strong>{value}</strong><small>{note}</small></div>;}

export function DashboardContent(){
 const {queries,snapshot,chartStates,updateChartState,visible}=useDataApp();
 const rows=queries.states?.rows??[],income=queries.income_bands?.rows??[],nation=rows.find(r=>r.abbr==='US');
 const states=rows.filter(r=>r.abbr!=='US');
 const s={...DEFAULT,...(chartStates['rent-plane']?.inlineFilters??{})};
 const [activeBand,setBand]=useState(0),start=useRef(null),[lastMs,setLastMs]=useState(null);
 const update=patch=>{start.current=performance.now();updateChartState('rent-plane',{inlineFilters:{...s,...patch}});};
 useEffect(()=>{if(start.current==null)return;const t=start.current;start.current=null;requestAnimationFrame(()=>requestAnimationFrame(()=>{const dt=performance.now()-t;setLastMs(dt);window.__rentSqueezePerf??=[];window.__rentSqueezePerf.push(dt);}));},[s.selected,s.compare,s.metric,s.minIncome,s.rentRange[0],s.rentRange[1],s.burdenRange[0],s.burdenRange[1]]);
 if(!nation)return <p>Reviewed Census data are unavailable.</p>;
 const first=rows.find(r=>r.abbr===s.selected)||states[0],second=rows.find(r=>r.abbr===s.compare)||nation;
 const matching=states.filter(r=>fit(r,s)),points=states.map(r=>({...r,inSelection:fit(r,s)}));
 const selectedBand=income.find(r=>r.abbr===first.abbr&&r.order===activeBand),compareBand=income.find(r=>r.abbr===second.abbr&&r.order===activeBand);
 const metricLabel=s.metric==='burden30'?'30%+':'50%+';
 const reset=()=>update({...DEFAULT});
 const labels=Object.fromEntries(rows.map(r=>[r.abbr,r.name]));
 const scope=[`2024; ${matching.length} of 51 state/DC estimates match filters`,`Rent: ${money(s.rentRange[0])}–${money(s.rentRange[1])}; burden: ${pct(s.burdenRange[0])}–${pct(s.burdenRange[1])}; renter income minimum: ${money(s.minIncome)}`];
 return <article className="rs-page">
  <header className="rs-intro"><div><p className="rs-eyebrow">WEALTHMETER / TOOLS · ACS 2024</p><h1>The Rent Squeeze</h1><p className="rs-deck">A lower rent can still take a larger bite. Explore how housing costs and renter incomes meet across America.</p></div><div className="rs-vintage"><strong>2024</strong><span>American Community Survey<br/>50 states + Washington, DC</span><span className="rs-vintage-rule">Survey estimates · 2024 USD</span></div></header>
  {visible('national-context')&&<DataComponent id="national-context" title="The national picture" queryId="states" kind="custom" displayRows={[nation]} sourceRows={[nation]} className="rs-national"><div className="rs-stat-grid" data-reviewed-rows>
   <Stat label="Renters paying 30%+ of income" value={pct(nation.burden30)} note={`±${nation.burden30Moe.toFixed(2)} pp · approximate 90% MOE`}/><Stat label="Renters paying 50%+ of income" value={pct(nation.burden50)} note={`±${nation.burden50Moe.toFixed(2)} pp · approximate 90% MOE`}/><Stat label="Median monthly gross rent" value={money(nation.rent)} note={`±${money(nation.rentMoe)} · published 90% MOE`}/>
  </div><p className="rs-note">Burden shares cover renters whose rent-to-income ratio can be computed. Nationwide, {pct(nation.notComputedPct)} of renter households are excluded from these shares. Gross rent includes utilities.</p></DataComponent>}
  <section className="rs-investigate" aria-labelledby="rs-investigate-title"><div className="rs-section-top"><div><p className="rs-step">01 / SEE THE PATTERN</p><h2 id="rs-investigate-title">Price is only half the story.</h2><p className="rs-muted">One dot per state or DC. Darker dots have higher renter household incomes.</p></div><button className="rs-reset" onClick={reset}>Reset exploration ↺</button></div>
  <div className="rs-measure-switch"><span>Explore rent burden</span><SegmentedControl value={s.metric} onChange={v=>update({metric:v,burdenRange:[0,70]})} options={[{value:'burden30',label:'30%+ of income'},{value:'burden50',label:'50%+ of income'}]}/></div><div className="rs-explorer-grid">
  {visible('rent-plane')&&<DataComponent id="rent-plane" title="Rent versus rent burden" queryId="states" kind="custom" displayRows={points} sourceRows={points} className="rs-chart-card" variant="card" scopeFilters={scope}>
   <div><RentPlane rows={states} nation={nation} state={s} update={update} selected={first} comparison={second}/></div>
   <div className="rs-legend"><span>Renter income</span><i style={{background:inkIncome(35000)}}/><span>$35k</span><i style={{background:inkIncome(65000)}}/><span>$65k</span><i style={{background:inkIncome(95000)}}/><span>$95k</span><span className="rs-legend-end">Dashed lines: U.S. benchmark</span></div>
   <p className="rs-note">Drag empty plot space to brush a range, or use the sliders below. Faded dots are outside the filter; the two comparison states stay highlighted. Select a dot for details.</p>
  </DataComponent>}
  <aside className="rs-selection-panel"><p className="rs-step">YOUR COMPARISON</p><div className="rs-compare-selects"><Dropdown label="Inspect" showLabel value={first.abbr} choices={states.map(code)} choiceLabels={labels} onChange={v=>update({selected:v})}/><Dropdown label="Compare with" showLabel value={second.abbr} choices={rows.map(code)} choiceLabels={labels} onChange={v=>update({compare:v})}/></div>
   {visible('state-comparison')&&<DataComponent id="state-comparison" title="Two places, three measures" queryId="states" kind="custom" displayRows={[first,second]} sourceRows={[first,second]}><div className="rs-comparison-head" data-reviewed-rows><b><i className="rs-key-a"/>{first.abbr}</b><b><i className="rs-key-b"/>{second.abbr}</b></div>
   {[['rent','Monthly gross rent',money],['renterIncome','Annual renter income',money],[s.metric,`Renters paying ${metricLabel}`,pct]].map(([k,l,f])=><div className="rs-pair" key={k} data-reviewed-rows><span>{l}</span><div><strong>{f(first[k])}</strong><strong>{f(second[k])}</strong></div><div className="rs-pair-moe"><span>±{f===money?money(first[k+'Moe']):first[k+'Moe'].toFixed(1)+' pp'}</span><span>±{f===money?money(second[k+'Moe']):second[k+'Moe'].toFixed(1)+' pp'}</span></div></div>)}
   <p className="rs-note">90% margins shown. Percentage margins are approximate. Differences in places do not show what would happen to one household if it moved.</p></DataComponent>}
   <div className="rs-insight" data-reviewed-rows><strong>{Math.abs(first[s.metric]-second[s.metric]).toFixed(1)} percentage points</strong><p>The gap in {metricLabel} rent burden between these two estimates. The chart’s whiskers show uncertainty; this is not a causal comparison.</p></div>
  </aside></div>
  <div className="rs-filter-area"><div><RangeSlider label="Monthly gross rent range" min={700} max={2400} step={10} value={s.rentRange} onChange={v=>update({rentRange:v})} formatValue={money}/></div><div><RangeSlider label={`${metricLabel} burden range`} min={0} max={70} step={1} value={s.burdenRange} onChange={v=>update({burdenRange:v})} formatValue={pct}/></div><div><Slider label="Minimum renter income" min={0} max={95000} step={1000} value={s.minIncome} onChange={v=>update({minIncome:v})} formatValue={money}/></div></div>
  <div className="rs-filter-status" role="status" aria-live="polite"><strong>{matching.length} of 51</strong> states/DC match · Filters change the selection table below. <span>{lastMs==null?'All interactions run locally.':`Last visual update ${Math.round(lastMs)} ms`}</span></div>
  </section>
  <section className="rs-income-section" aria-labelledby="rs-income-title"><div className="rs-section-top"><div><p className="rs-step">02 / LOOK BENEATH THE AVERAGE</p><h2 id="rs-income-title">The squeeze changes with income.</h2><p className="rs-muted">Share paying 30%+ within each income band. Cash-rent households with positive income.</p></div><div className="rs-mini-legend"><span><i className="rs-key-a"/>{first.name}</span><span><i className="rs-key-b"/>{second.name}</span></div></div>
  {visible('income-comparison')&&<DataComponent id="income-comparison" title="Rent burden within annual income bands" queryId="income_bands" kind="custom" displayRows={income.filter(r=>r.abbr===first.abbr||r.abbr===second.abbr)} sourceRows={income.filter(r=>r.abbr===first.abbr||r.abbr===second.abbr)} className="rs-income-grid" variant="plain">
   <div className="rs-income-plot"><IncomeComparison rows={income} first={first} second={second} activeBand={activeBand} setBand={setBand}/></div>
   <div className="rs-income-detail" data-reviewed-rows><p className="rs-step">SELECTED INCOME BAND</p><h3>{selectedBand?.incomeBand}</h3>{[selectedBand,compareBand].filter(Boolean).map((r,i)=><div key={i} className="rs-band-detail"><strong><i className={i?'rs-key-b':'rs-key-a'}/>{r.name}</strong><b>{pct(r.burden30)} <small>±{r.burden30Moe.toFixed(1)} pp</small></b><span>{num(r.burden30Count)} of {num(r.total)} households</span></div>)}<p className="rs-note">Lines show approximate 90% confidence intervals. Income bands are nominal 2024 dollars, not adjusted for state price levels. “Under $20k” here excludes zero or negative income.</p></div>
  </DataComponent>}
  </section>
  <section className="rs-record-section"><div className="rs-section-top"><div><p className="rs-step">03 / CHECK THE DETAILS</p><h2>Every place in your selection.</h2><p className="rs-muted">Select a row to inspect it above. Sorting describes estimates, not a statistically tested ranking.</p></div></div>
   {visible('selection-records')&&<DataComponent id="selection-records" title={`${matching.length} matching state estimates`} queryId="states" kind="table" displayRows={matching} sourceRows={matching} scopeFilters={scope}>
   {matching.length?<DataTable rows={matching} columns={[{key:'name',label:'State / DC'},{key:'rent',label:'Gross rent / month',renderCell:money},{key:'renterIncome',label:'Renter income / year',renderCell:money},{key:s.metric,label:`Paying ${metricLabel}`,renderCell:pct},{key:s.metric+'Moe',label:'90% MOE (pp)',renderCell:v=>`±${v.toFixed(2)}`},{key:'notComputedPct',label:'Not computed',renderCell:pct}]} rowKey="geoid" selectedRowKey={first.geoid} onRowSelect={r=>update({selected:r.abbr})} rowActionLabel={r=>`Inspect ${r.name}`} caption="Filtered state-level 2024 ACS estimates"/>:<div className="rs-empty"><strong>No states match this range.</strong><p>Widen the sliders or reset the exploration.</p><button onClick={reset}>Reset filters</button></div>}
   </DataComponent>}
  </section>
  <section className="rs-methods" aria-label="Sources and methods"><div><p className="rs-step">SOURCE & REUSE</p><h2>Open data. Visible assumptions.</h2><p>Built from the U.S. Census Bureau’s 2024 ACS 1-year Detailed Tables B25064, B25070, B25119 and B25106. State and national totals are survey-weighted published estimates; no individual records are included.</p><p><a href="https://www.census.gov/programs-surveys/acs/data/summary-file.html" target="_blank" rel="noreferrer">Original Census tables ↗</a> · <a href="https://catalog.data.gov/dataset/acs-1-year-detailed-tables-d0fe5" target="_blank" rel="noreferrer">Dataset-specific CC0 record ↗</a> · <a href="https://creativecommons.org/publicdomain/zero/1.0/" target="_blank" rel="noreferrer">Public-domain reuse terms ↗</a></p><a className="rs-data-download" href="/data/rent-squeeze-2024.json" download="Rent-Squeeze-reviewed-data-2024.json">Download reviewed data & methods ↓</a></div><div><p className="rs-step">READ THIS BEFORE COMPARING</p><ul><li>2024 conditions, not current listing rents. Gross rent includes utilities.</li><li>Burden excludes households with no cash rent or zero/negative income; their counts remain in the source data.</li><li>These are broad state-level patterns. Household sizes, local markets and income mixes differ.</li><li>Approximate percentage intervals use Census guidance with published MOEs; covariance is unavailable. Small differences may not be meaningful.</li></ul><p className="rs-note">Retrieved October 9, 2026. This product uses Census Bureau data but is not endorsed or certified by the Census Bureau. Educational data exploration; not individual financial advice.</p></div></section>
 </article>;
}
