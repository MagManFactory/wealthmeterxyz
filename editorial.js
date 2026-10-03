const themeKey = 'meter-editorial-preview-theme';
const themeButton = document.getElementById('theme');
const frame = document.getElementById('calculator-frame');
function sendTheme() {
  frame?.contentWindow?.postMessage({type:'preview-theme',dark:document.body.classList.contains('dark')},location.origin);
}
try { if (localStorage.getItem(themeKey)==='dark') document.body.classList.add('dark'); } catch {}
themeButton?.addEventListener('click',()=>{
  document.body.classList.toggle('dark');
  try { localStorage.setItem(themeKey,document.body.classList.contains('dark')?'dark':'light'); } catch {}
  sendTheme();
});
frame?.addEventListener('load',sendTheme);
window.addEventListener('message',event=>{
  if (!frame || event.source!==frame.contentWindow || event.origin!==location.origin) return;
  if (event.data.type==='calculator-size' && Number.isFinite(event.data.height)) {
    frame.height=String(Math.max(320,Math.min(850,event.data.height+8)));
  }
});
document.querySelectorAll('.tools-menu').forEach(menu=>{
  menu.addEventListener('keydown',event=>{if(event.key==='Escape'){menu.open=false;menu.querySelector('summary').focus();}});
  document.addEventListener('click',event=>{if(!menu.contains(event.target))menu.open=false;});
});
const search=document.getElementById('story-search');
const topic=document.getElementById('topic-filter');
const kind=document.getElementById('kind-filter');
function filterStories(){
  const q=(search?.value||'').trim().toLowerCase();
  let n=0;
  document.querySelectorAll('.catalog .story-card').forEach(card=>{
    card.hidden=!!((q&&!card.dataset.search.includes(q))||(topic.value&&card.dataset.topic!==topic.value)||(kind.value&&card.dataset.kind!==kind.value));
    if(!card.hidden)n++;
  });
  document.getElementById('story-count').textContent=n+(n===1?' story':' stories');
  document.getElementById('no-stories').hidden=n!==0;
}
if(topic){
  const selected=new URLSearchParams(location.search).get('topic');
  if(Array.from(topic.options).some(option=>option.value===selected))topic.value=selected;
  [search,topic,kind].forEach(input=>input.addEventListener('input',filterStories));
  filterStories();
}
document.getElementById('tool-search')?.addEventListener('input',event=>{
  const q=event.target.value.trim().toLowerCase();let count=0;
  document.querySelectorAll('.tool-card').forEach(card=>{card.hidden=!card.dataset.search.includes(q);if(!card.hidden)count++;});
  document.getElementById('no-tools').hidden=count!==0;
});
