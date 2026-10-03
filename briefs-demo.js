(async function () {
  const count = document.getElementById('brief-count');
  try {
    const response = await fetch('/data/wealth-briefs.json');
    if (!response.ok) throw new Error('Library unavailable');
    const {briefs} = await response.json();
    const title = document.getElementById('brief-title');
    if (title) {
      const brief = briefs.find(item => item.id === new URLSearchParams(location.search).get('id'));
      if (!brief) { title.textContent='This brief could not be found.'; return; }
      document.title = brief.title + ' | WealthMeter';
      title.textContent=brief.title;
      document.getElementById('brief-topic').textContent=brief.categoryLabel || brief.category;
      document.getElementById('brief-summary').textContent=brief.summary;
      document.getElementById('brief-citation').textContent=[brief.authors,brief.publication,brief.year].filter(Boolean).join(' · ');
      document.getElementById('brief-why').textContent=brief.whyItMatters;
      document.getElementById('brief-tags').textContent=(brief.focusTags || []).join(' · ');
      const original = document.getElementById('brief-original');
      if (/^https?:\/\//.test(brief.sourceUrl)) { original.href=brief.sourceUrl; original.hidden=false; }
      return;
    }
    const search=document.getElementById('brief-search');
    const category=document.getElementById('brief-category');
    const source=document.getElementById('brief-source');
    const year=document.getElementById('brief-year');
    const sort=document.getElementById('brief-sort');
    const list=document.getElementById('brief-list');
    const more=document.getElementById('brief-more');
    let limit=12;
    function options(select,values){values.forEach(value=>{const option=document.createElement('option');option.value=value;option.textContent=value;select.append(option);});}
    options(category,[...new Set(briefs.map(b=>b.categoryLabel || b.category))].sort());
    options(source,[...new Set(briefs.map(b=>b.sourceType))].sort());
    options(year,[...new Set(briefs.map(b=>String(b.year)))].sort((a,b)=>(Number(b)||0)-(Number(a)||0)));
    function render(){
      const q=search.value.toLowerCase().trim();
      const matched=briefs.filter(b=>(!q||[b.title,b.summary,b.authors,...(b.focusTags||[])].join(' ').toLowerCase().includes(q))&&(!category.value||(b.categoryLabel||b.category)===category.value)&&(!source.value||b.sourceType===source.value)&&(!year.value||String(b.year)===year.value));
      matched.sort((a,b)=>sort.value==='oldest'?(Number(a.year)||0)-(Number(b.year)||0):sort.value==='newest'?(Number(b.year)||0)-(Number(a.year)||0):Number(Boolean(b.featured))-Number(Boolean(a.featured))||(Number(b.year)||0)-(Number(a.year)||0));
      list.replaceChildren();
      for(const b of matched.slice(0,limit)){
        const article=document.createElement('article');article.className='brief-card';
        const topic=document.createElement('p');topic.className='eyebrow';topic.textContent=b.categoryLabel||b.category;
        const heading=document.createElement('h3');const link=document.createElement('a');link.href='/wealth-brief.html?id='+encodeURIComponent(b.id);link.textContent=b.title;heading.append(link);
        const summary=document.createElement('p');summary.textContent=b.summary;
        const citation=document.createElement('p');citation.className='fine';citation.textContent=[b.year,b.publication].filter(Boolean).join(' · ');
        const read=document.createElement('a');read.className='read';read.href=link.href;read.textContent='Read the brief →';
        article.append(topic,heading,summary,citation,read);list.append(article);
      }
      count.textContent=matched.length.toLocaleString()+' briefs · showing '+Math.min(limit,matched.length);
      document.getElementById('brief-empty').hidden=matched.length!==0;
      more.hidden=limit>=matched.length;
    }
    [search,category,source,year,sort].forEach(el=>el.addEventListener('input',()=>{limit=12;render();}));
    more.addEventListener('click',()=>{limit+=12;render();});render();
  }catch(error){ if(count)count.textContent='The library could not load. Please reload this page.';else document.getElementById('brief-title').textContent='The brief could not load. Please reload this page.'; }
})();
