(async function(){
  const response=await fetch('/data/us-wealth-atlas.json',{cache:'no-store'});
  if(!response.ok)return;
  const data=await response.json();
  const state={index:data.history.length-1,asset:'netWorth',timer:null};
  const colors=['#163e85','#2466eb','#08a7bd','#ff5a57'];
  const keys=['top1','next9','next40','bottom50'];
  const slider=document.getElementById('atlas-year');
  slider.max=String(data.history.length-1); slider.value=String(state.index);

  function money(value){return new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0}).format(value)}
  function syncUrl(){const url=new URL(location.href);url.searchParams.set('year',data.history[state.index].year);url.searchParams.set('asset',state.asset);history.replaceState(null,'',url)}
  function renderTimeline(){
    const row=data.history[state.index]; document.getElementById('atlas-year-label').textContent=row.year;
    keys.forEach((key,i)=>{const value=row[key];const segment=document.querySelector('[data-stack="'+key+'"]');segment.style.width=value+'%';segment.querySelector('strong').textContent=value.toFixed(1)+'%';const legend=document.querySelector('[data-legend="'+key+'"] strong');legend.textContent=value.toFixed(1)+'%'});
    const first=data.history[0]; const change=row.top1-first.top1; const bottomChange=row.bottom50-first.bottom50;
    document.getElementById('atlas-change').textContent=(change>=0?'+':'')+change.toFixed(1)+' pts';
    document.getElementById('atlas-change-copy').textContent='Top 1% share since '+first.year+'. Bottom-half share moved '+(bottomChange>=0?'+':'')+bottomChange.toFixed(1)+' points.';
    drawTimeline(); syncUrl();
  }
  function drawTimeline(){
    const node=document.getElementById('timeline-svg'); const W=1000,H=280,pad={l:54,r:28,t:24,b:38};
    const x=i=>pad.l+i*(W-pad.l-pad.r)/(data.history.length-1); const y=v=>pad.t+(40-v)*(H-pad.t-pad.b)/40;
    const line=key=>data.history.map((r,i)=>(i?'L':'M')+x(i).toFixed(1)+','+y(r[key]).toFixed(1)).join(' ');
    const selected=data.history[state.index]; const sx=x(state.index);
    node.innerHTML='<rect width="1000" height="280" fill="transparent"/>'+
      [0,10,20,30,40].map(v=>'<line x1="'+pad.l+'" x2="'+(W-pad.r)+'" y1="'+y(v)+'" y2="'+y(v)+'" stroke="var(--atlas-line)"/><text x="12" y="'+(y(v)+4)+'" fill="var(--atlas-muted)" font-size="12">'+v+'%</text>').join('')+
      '<path d="'+line('top1')+'" fill="none" stroke="'+colors[1]+'" stroke-width="5" stroke-linecap="round"/>'+
      '<path d="'+line('bottom50')+'" fill="none" stroke="'+colors[3]+'" stroke-width="5" stroke-linecap="round"/>'+
      '<line x1="'+sx+'" x2="'+sx+'" y1="'+pad.t+'" y2="'+(H-pad.b)+'" stroke="var(--atlas-ink)" stroke-dasharray="5 6" opacity=".55"/>'+
      '<circle cx="'+sx+'" cy="'+y(selected.top1)+'" r="7" fill="'+colors[1]+'"/><circle cx="'+sx+'" cy="'+y(selected.bottom50)+'" r="7" fill="'+colors[3]+'"/>'+
      '<text x="'+pad.l+'" y="266" fill="var(--atlas-muted)" font-size="12">1990</text><text x="'+(W-pad.r-34)+'" y="266" fill="var(--atlas-muted)" font-size="12">2026</text>';
  }
  function renderAsset(){
    const item=data.ownership[state.asset]; document.getElementById('asset-label').textContent=item.label;document.getElementById('asset-unit').textContent=item.unit;document.getElementById('asset-note').textContent=item.note;
    document.querySelectorAll('[data-asset]').forEach(button=>button.setAttribute('aria-pressed',button.dataset.asset===state.asset?'true':'false'));
    document.querySelectorAll('.ownership-row').forEach((row,i)=>{row.querySelector('.ownership-fill').style.width=item.values[i]+'%';row.querySelector('strong').textContent=item.values[i].toFixed(1)+'%'});syncUrl();
  }
  function renderAges(){
    const grid=document.getElementById('age-grid');grid.replaceChildren(...data.ageShares.map(item=>{const article=document.createElement('article');article.className='age-card';article.style.setProperty('--share',item.share);article.innerHTML='<span>'+item.label+'</span><strong>'+item.share.toFixed(1)+'%</strong><b>$'+item.netWorthTrillions.toFixed(1)+'T in net worth</b>';return article}));
    const table=document.getElementById('median-table');const max=Math.max(...data.scfAgeMedians.map(x=>x.median));table.replaceChildren(...data.scfAgeMedians.map(item=>{const row=document.createElement('div');row.className='median-row';row.innerHTML='<span>'+item.label+'</span><div class="median-bar"><i style="width:'+(item.median/max*100).toFixed(1)+'%"></i></div><strong>'+money(item.median)+'</strong>';return row}));
  }
  slider.addEventListener('input',()=>{state.index=Number(slider.value);renderTimeline()});
  document.getElementById('atlas-play').addEventListener('click',event=>{if(state.timer){clearInterval(state.timer);state.timer=null;event.currentTarget.textContent='▶ Play history';return}if(state.index===data.history.length-1){state.index=0;slider.value='0';renderTimeline()}event.currentTarget.textContent='Pause';state.timer=setInterval(()=>{if(state.index>=data.history.length-1){clearInterval(state.timer);state.timer=null;event.currentTarget.textContent='▶ Play history';return}state.index+=1;slider.value=String(state.index);renderTimeline()},240)});
  document.querySelectorAll('[data-asset]').forEach(button=>button.addEventListener('click',()=>{state.asset=button.dataset.asset;renderAsset()}));
  const params=new URLSearchParams(location.search);const requestedYear=Number(params.get('year'));const found=data.history.findIndex(row=>row.year===requestedYear);if(found>=0)state.index=found;if(data.ownership[params.get('asset')])state.asset=params.get('asset');slider.value=String(state.index);
  renderTimeline();renderAsset();renderAges();
  const shareTitle='Who Owns America? U.S. Wealth Atlas 2026';const shareUrl=()=>location.href;
  document.getElementById('share-x').href='https://twitter.com/intent/tweet?text='+encodeURIComponent(shareTitle)+'&url='+encodeURIComponent(shareUrl());
  document.getElementById('share-linkedin').href='https://www.linkedin.com/sharing/share-offsite/?url='+encodeURIComponent(shareUrl());
  document.getElementById('share-whatsapp').href='https://wa.me/?text='+encodeURIComponent(shareTitle+' '+shareUrl());
  document.getElementById('share-email').href='mailto:?subject='+encodeURIComponent(shareTitle)+'&body='+encodeURIComponent(shareUrl());
  document.getElementById('share-copy').addEventListener('click',async()=>{const status=document.getElementById('share-status');try{await navigator.clipboard.writeText(shareUrl());status.textContent='Link copied.'}catch{status.textContent='Copy the address from your browser.'}});
})().catch(()=>{});
