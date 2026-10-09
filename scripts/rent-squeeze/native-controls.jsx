import React,{createContext,useContext,useState,useEffect,useId} from 'react';
export const ReaderContext=createContext(null);
export const useDataApp=()=>useContext(ReaderContext);
export function saveData(value,name,type='json'){
 let text=JSON.stringify(value,null,2),mime='application/json';
 if(type==='csv'){
  const rows=value.rows,keys=rows.length?Object.keys(rows[0]):['name'];
  const quote=v=>'"'+String(v??'').replaceAll('"','""')+'"';
  text=[keys.map(quote).join(','),...rows.map(r=>keys.map(k=>quote(r[k])).join(','))].join('\r\n');mime='text/csv';
 }
 const url=URL.createObjectURL(new Blob([text],{type:mime}));const a=document.createElement('a');a.href=url;a.download=name+'.'+type;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
export function DataComponent({id,title,queryId,displayRows=[],scopeFilters=[],className='',children}){
 const {snapshot}=useDataApp();const q=snapshot.queries[queryId];
 return <section id={id} className={'rs-component '+className}><header className="rs-component-heading"><h3>{title}</h3><details className="rs-source-inspector"><summary>Sources & methods</summary><div><p>{q.source.label}</p><p>{scopeFilters.join(' · ')||'2024 ACS estimates; the U.S. benchmark is separate.'}</p>{q.source.tables.map(t=><p key={t.name}><a href={t.href} target="_blank" rel="noopener noreferrer">{t.name} original Census table ↗</a></p>)}{q.source.metricDefinitions.map(d=><p key={d.label}><strong>{d.label}: </strong>{d.definition}</p>)}<p>Download scope: {displayRows.length} rows in this view, with source and method metadata. The footer download includes all 312 reviewed rows.</p><button onClick={()=>saveData({metadata:snapshot.metadata,filters:scopeFilters,rows:displayRows,source:q.source,methods:q.methods},'rent-squeeze-'+id+'-2024')}>Download this view (JSON)</button><button onClick={()=>saveData({rows:displayRows},'rent-squeeze-'+id+'-2024','csv')}>Download these rows (CSV)</button><details><summary>Reproduction code</summary>{q.methods.map((m,i)=><pre key={i}>{m.code}</pre>)}</details></div></details></header>{children}</section>;
}
export function ChartMark({context,tooltip,children,...props}){
 const [open,setOpen]=useState(false);const id=useId();
 return <button {...props} type="button" aria-describedby={open?id:undefined} onClick={()=>context.actions[0].onSelect()} onContextMenu={e=>{e.preventDefault();context.actions[1].onSelect();}} onMouseEnter={()=>setOpen(true)} onMouseLeave={()=>setOpen(false)} onFocus={()=>setOpen(true)} onBlur={()=>setOpen(false)} onKeyDown={e=>{if(e.key==='Enter'&&e.shiftKey){e.preventDefault();context.actions[1].onSelect();}}}>{children}{open&&<span id={id} role="tooltip" className="rs-native-tooltip">{tooltip}</span>}</button>;
}
export function Dropdown({label,value,choices,choiceLabels,onChange}){return <label className="rs-native-select">{label}<select aria-label={label} value={value} onChange={e=>onChange(e.target.value)}>{choices.map(v=><option key={v} value={v}>{choiceLabels[v]}</option>)}</select></label>;}
export function SegmentedControl({value,onChange,options}){return <div className="rs-segments" role="group" aria-label="Rent burden threshold">{options.map(o=><button key={o.value} aria-pressed={o.value===value} onClick={()=>onChange(o.value)}>{o.label}</button>)}</div>;}
export function Slider({label,value,onChange,formatValue,...props}){return <label className="rs-native-slider">{label}<output>{formatValue(value)}</output><input {...props} type="range" aria-label={label} value={value} onChange={e=>onChange(+e.target.value)} aria-valuetext={formatValue(value)}/></label>;}
export function RangeSlider({label,value,onChange,formatValue,...props}){return <fieldset className="rs-native-range"><legend>{label}</legend>{['Minimum','Maximum'].map((l,i)=><label key={l}>{l}<output>{formatValue(value[i])}</output><input {...props} type="range" value={value[i]} aria-label={label+' '+l.toLowerCase()} aria-valuetext={formatValue(value[i])} onChange={e=>{const n=+e.target.value;onChange(i===0?[Math.min(n,value[1]),value[1]]:[value[0],Math.max(n,value[0])]);}}/></label>)}</fieldset>;}
export function DataTable({rows,columns,rowKey,selectedRowKey,onRowSelect,caption}){
 const [search,setSearch]=useState(''),[sort,setSort]=useState({key:'name',asc:true}),[page,setPage]=useState(0);const scope=rows.map(r=>r[rowKey]).join(',');
 useEffect(()=>setPage(0),[scope,search,sort.key,sort.asc]);
 const filtered=rows.filter(r=>r.name.toLowerCase().includes(search.toLowerCase())).sort((a,b)=>{const x=a[sort.key],y=b[sort.key];return (typeof x==='number'?x-y:String(x).localeCompare(String(y)))*(sort.asc?1:-1);});
 const pages=Math.max(1,Math.ceil(filtered.length/10)),p=Math.min(page,pages-1);
 return <div className="rs-table"><label className="rs-table-search">Search selected states<input type="search" value={search} onChange={e=>setSearch(e.target.value)} placeholder="State name"/></label><div className="rs-table-scroll"><table><caption>{caption}</caption><thead><tr>{columns.map(c=><th key={c.key} scope="col" aria-sort={sort.key===c.key?(sort.asc?'ascending':'descending'):'none'}><button onClick={()=>setSort({key:c.key,asc:sort.key===c.key?!sort.asc:true})}>{c.label} {sort.key===c.key?(sort.asc?'↑':'↓'):''}</button></th>)}</tr></thead><tbody>{filtered.slice(p*10,p*10+10).map(r=><tr key={r[rowKey]} className={selectedRowKey===r[rowKey]?'is-selected':''}>{columns.map((c,i)=><td key={c.key}>{i===0?<button aria-pressed={selectedRowKey===r[rowKey]} onClick={()=>onRowSelect(r)}>{r[c.key]}</button>:c.renderCell?c.renderCell(r[c.key]):r[c.key]}</td>)}</tr>)}</tbody></table></div>{!filtered.length&&<p role="status">No states match this search.</p>}<div className="rs-pagination"><button disabled={p===0} onClick={()=>setPage(p-1)}>Previous</button><span role="status">Page {p+1} of {pages} · {filtered.length} states</span><button disabled={p===pages-1} onClick={()=>setPage(p+1)}>Next</button></div></div>;
}
export const Button=props=><button {...props}/>;
export const SectionHeader=()=>null;
