/* Local review integration: chart alternatives and input-bound validation. */
(() => {
  const oldTables=new Map();
  function table(host,headers,rows){
    oldTables.get(host)?.remove();
    const details=document.createElement('details');details.className='chart-data';
    const summary=document.createElement('summary');summary.textContent='View chart data as a table';details.append(summary);
    const wrap=document.createElement('div');details.append(wrap);host.after(details);oldTables.set(host,details);
    details.addEventListener('toggle',()=>{if(!details.open||wrap.childElementCount)return;const t=document.createElement('table');
      const caption=document.createElement('caption');caption.textContent=host.closest('section')?.querySelector('h2')?.textContent||'Chart data';t.append(caption);
      const thead=document.createElement('thead'),tr=document.createElement('tr');headers.forEach(h=>{const th=document.createElement('th');th.scope='col';th.textContent=h;tr.append(th)});thead.append(tr);t.append(thead);
      const tbody=document.createElement('tbody');rows.forEach(row=>{const tr=document.createElement('tr');row.forEach(v=>{const td=document.createElement('td');td.textContent=v==null?'n/a':String(v);tr.append(td)});tbody.append(tr)});t.append(tbody);wrap.append(t);
    });
  }
  window.WMReviewTable=table;
  function label(host){const svg=host.querySelector('svg');if(svg){svg.setAttribute('role','img');svg.setAttribute('aria-label',(host.closest('section')?.querySelector('h2')?.textContent||'Interactive chart')+'. A data table follows.');}}
  if(typeof WM!=='undefined'){
    for(const name of ['line','hbars','donut']){const draw=WM[name];WM[name]=function(host,a,b,c){const result=draw.apply(this,arguments);label(host);
      if(name==='line'){const series=b.filter(s=>!s.hidden),fmt=c?.tfmt||c?.fmt;table(host,['Period',...series.map(s=>s.name)],a.map((x,i)=>[x,...series.map(s=>s.vals[i]==null?null:fmt?fmt(s.vals[i]):s.vals[i])]));}
      else table(host,['Category','Value','Comparison notes'],a.map(d=>[d.label,d.value,d.tip?d.tip.replace(/<[^>]+>/g,' '):d.marks?.map(m=>m.v).join('; ')||'']));return result;};}
  }
  const warning=document.createElement('p');warning.className='input-review-error';warning.hidden=true;warning.setAttribute('role','alert');document.querySelector('main')?.prepend(warning);
  function numberValid(i){return i.value!==''&&Number.isFinite(Number(i.value))&&!i.validity.badInput&&!i.validity.rangeUnderflow&&!i.validity.rangeOverflow;}
  function validate(){const inputs=[...document.querySelectorAll('input[type=number]')];inputs.forEach(i=>i.setAttribute('aria-invalid',String(!numberValid(i))));const invalid=inputs.some(i=>!numberValid(i));warning.hidden=!invalid;warning.textContent=invalid?'Correct the highlighted number before recalculating. Results below reflect the last valid entry.':'';return !invalid;}
  for(const event of ['input','change'])document.addEventListener(event,e=>{if(!validate())e.stopImmediatePropagation();},true);
  document.addEventListener('click',()=>queueMicrotask(validate));
  const observer=new MutationObserver(()=>{for(const [host,details] of oldTables){if(!host.isConnected||!host.querySelector("svg")){details.remove();oldTables.delete(host);}}document.querySelectorAll('.chart svg').forEach(svg=>{if(svg.viewBox.baseVal.width>500){const host=svg.closest('.chart');host.classList.add('wide-chart');host.tabIndex=0;host.setAttribute('role','group');host.setAttribute('aria-label','Chart. On small screens, scroll horizontally or open the data table below.');}});document.querySelectorAll('svg:not([aria-label])').forEach(svg=>{svg.setAttribute('role','img');svg.setAttribute('aria-label',svg.closest('section')?.querySelector('h2')?.textContent||'Chart; values are described in the surrounding text.');});document.querySelectorAll('.chip').forEach(b=>{b.setAttribute('aria-pressed',String(b.classList.contains('on')));});});
  observer.observe(document.querySelector('main')||document.body,{childList:true,subtree:true});
})();
