(function(root){
 'use strict';
 function scenario(country,{target=1,employment=0,productivity=1}={}){
  const rows=country.rows.filter(r=>r.year>=2026),base=rows[0].workingAgeShare,end=rows.at(-1).workingAgeShare;
  const factor=1+employment/100,years=24;
  const hurdle=100*((1+target/100)/Math.pow(end/base*factor,1/years)-1);
  const series=rows.map(r=>{const t=r.year-2026;return {year:r.year,scenario:100*Math.pow(1+productivity/100,t)*Math.pow(factor,t/years)*r.workingAgeShare/base,target:100*Math.pow(1+target/100,t)}});
  return {hurdle,series};
 }
 if(typeof module!=='undefined'&&module.exports)module.exports={scenario};
 if(typeof document==='undefined')return;
 const $=id=>document.getElementById(id),fmt=(v,d=1)=>Number(v).toFixed(d),signed=v=>(v>0?'+':'')+fmt(v)+'%';
 let data,metric='oldDependency';
 function chart(id,series,unit){
  const width=Math.max(250,Math.round($(id).clientWidth)),height=id==='demo-chart'?370:310,l=40,r=18,t=24,b=38;
  const values=series.flatMap(s=>s.values.map(p=>p.value)),lo=Math.max(0,Math.floor(Math.min(...values)/10)*10-10),hi=Math.ceil(Math.max(...values)/10)*10+10;
  const x=year=>l+(year-2026)/24*(width-l-r),y=v=>t+(hi-v)/(hi-lo)*(height-t-b);
  let svg=`<svg viewBox="0 0 ${width} ${height}" role="img" aria-label="${unit}. Exact values in the accessible table below."><title>${unit}</title>`;
  for(let i=0;i<=4;i++){const v=lo+(hi-lo)*i/4;svg+=`<line x1="${l}" x2="${width-r}" y1="${y(v)}" y2="${y(v)}" stroke="var(--age-line)"/><text x="${l-9}" y="${y(v)+4}" text-anchor="end">${fmt(v,0)}</text>`;}
  for(const year of (width<400?[2026,2035,2050]:[2026,2030,2035,2040,2045,2050]))svg+=`<text x="${x(year)}" y="${height-10}" text-anchor="middle">${year}</text>`;
  for(const s of series){svg+=`<path d="${s.values.map((p,i)=>(i?'L':'M')+x(p.year).toFixed(2)+','+y(p.value).toFixed(2)).join(' ')}" stroke="${s.color}" stroke-width="3" fill="none" ${s.dash?'stroke-dasharray="6 5"':''}/>`;for(const p of s.values.filter(p=>[2026,2030,2035,2040,2045,2050].includes(p.year)))svg+=`<circle cx="${x(p.year)}" cy="${y(p.value)}" r="4" fill="${s.color}"><title>${s.name}, ${p.year}: ${fmt(p.value)}</title></circle>`;}
  $(id).innerHTML=svg+'</svg>';
 }
 function update(){
  const p=data.countries.find(c=>c.iso===$('country').value),b=data.countries.find(c=>c.iso===$('compare').value),settings=Object.fromEntries(['target','employment','productivity'].map(k=>[k,+$(k).value]));
  $('target-out').value=signed(settings.target)+' / yr';$('employment-out').value=signed(settings.employment)+' total';$('productivity-out').value=signed(settings.productivity)+' / yr';
  const ps=scenario(p,settings),bs=scenario(b,settings),pr=p.rows.filter(r=>r.year>=2026),br=b.rows.filter(r=>r.year>=2026),first=pr[0],last=pr.at(-1);
  $('demo-summary').textContent=`In ${p.name}, the number of people aged 65+ per 100 aged 15–64 is projected to move from ${fmt(first.oldDependency)} in 2026 to ${fmt(last.oldDependency)} in 2050.`;
  const unit=metric==='oldDependency'?'People aged 65+ per 100 people aged 15–64':'People aged 15–64 as a percentage of total population';
  $('demo-unit').textContent=unit;$('demo-name').textContent=p.name;$('compare-name').textContent=b.name;
  chart('demo-chart',[{name:p.name,color:'var(--age-green)',values:pr.map(r=>({year:r.year,value:r[metric]}))},{name:b.name,color:'var(--age-orange)',values:br.map(r=>({year:r.year,value:r[metric]}))}],unit);
  $('hurdle').textContent=signed(ps.hurdle);const gap=settings.productivity-ps.hurdle;
  $('result-summary').textContent=`Your ${fmt(settings.productivity)}% productivity assumption is ${fmt(Math.abs(gap))} percentage points ${gap>=0?'above':'below'} the ${p.name} requirement. ${b.name} needs ${signed(bs.hurdle)} a year under the same goal and employment setting.`;
  chart('output-chart',[{name:p.name+' scenario',color:'var(--age-green)',values:ps.series.map(r=>({year:r.year,value:r.scenario}))},{name:'Goal',color:'var(--age-muted)',dash:true,values:ps.series.map(r=>({year:r.year,value:r.target}))},{name:b.name+' scenario',color:'var(--age-orange)',values:bs.series.map(r=>({year:r.year,value:r.scenario}))}],'Hypothetical output per person, 2026 = 100');
  $('endpoint').textContent=`2050: ${p.name} scenario ${fmt(ps.series.at(-1).scenario,0)} · Goal ${fmt(ps.series.at(-1).target,0)} · ${b.name} scenario ${fmt(bs.series.at(-1).scenario,0)} (2026 = 100).`;
  $('countries-table').innerHTML=data.countries.slice().sort((a,b)=>b.rows.at(-1).oldDependency-a.rows.at(-1).oldDependency).map(c=>{const a=c.rows.find(r=>r.year===2026),z=c.rows.at(-1);return `<tr><th scope="row"><button type="button" data-country="${c.iso}" aria-label="Explore ${c.name}">${c.name}</button></th><td>${fmt(a.oldDependency)} → ${fmt(z.oldDependency)}</td><td>${fmt(a.workingAgeShare)} → ${fmt(z.workingAgeShare)}</td><td>${fmt(scenario(c,settings).hurdle)}%</td></tr>`}).join('');
  $('chart-caption').textContent=`Annual values for ${p.name} and ${b.name}. Population columns: WPP 2024 medium projection. Output columns: hypothetical indices, 2026=100.`;
  $('chart-head').innerHTML=`<tr>${['Year',p.name+' aging ratio',b.name+' aging ratio',p.name+' working-age share (%)',b.name+' working-age share (%)',p.name+' scenario',b.name+' scenario','Goal'].map(x=>`<th scope="col">${x}</th>`).join('')}</tr>`;
  $('chart-table').innerHTML=pr.map((r,i)=>`<tr><th scope="row">${r.year}</th>${[r.oldDependency,br[i].oldDependency,r.workingAgeShare,br[i].workingAgeShare,ps.series[i].scenario,bs.series[i].scenario,ps.series[i].target].map(v=>`<td>${fmt(v)}</td>`).join('')}</tr>`).join('');
 }
 fetch('/data/age-automation.json').then(r=>{if(!r.ok)throw Error(r.status);return r.json()}).then(d=>{
  data=d;for(const id of ['country','compare']){$(id).innerHTML=d.countries.slice().sort((a,b)=>a.name.localeCompare(b.name)).map(c=>`<option value="${c.iso}">${c.name}</option>`).join('');$(id).addEventListener('change',update);}
  $('country').value='KOR';$('compare').value='USA';for(const id of ['target','employment','productivity'])$(id).addEventListener('input',update);
  $('swap').addEventListener('click',()=>{const a=$('country').value;$('country').value=$('compare').value;$('compare').value=a;update()});
  $('reset').addEventListener('click',()=>{$('target').value=1;$('employment').value=0;$('productivity').value=1;update()});
  document.querySelectorAll('[data-pair]').forEach(e=>e.addEventListener('click',()=>{const a=e.dataset.pair.split(',');$('country').value=a[0];$('compare').value=a[1];update()}));
  document.querySelectorAll('[data-metric]').forEach(e=>e.addEventListener('click',()=>{metric=e.dataset.metric;document.querySelectorAll('[data-metric]').forEach(x=>x.setAttribute('aria-pressed',String(x===e)));update()}));
  $('countries-table').addEventListener('click',e=>{const btn=e.target.closest('[data-country]');if(btn){$('country').value=btn.dataset.country;update();$('country').focus()}});
  $('load-status').textContent='';update();window.addEventListener('resize',update);
 }).catch(()=>{$('load-status').textContent='The demographic data could not load. Please reload to use the explorer. Sources and assumptions are available above.'});
})(typeof globalThis!=='undefined'?globalThis:this);
