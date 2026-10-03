// One theme controls both the editorial shell and existing tool theme selectors.
function syncPhoenixTheme(){
 const dark=document.body.classList.contains('dark');
 document.body.classList.toggle('dark-mode',dark);
 document.documentElement.dataset.theme=dark?'dark':'light';

}
syncPhoenixTheme();
document.getElementById('theme')?.addEventListener('click',syncPhoenixTheme);
window.toggleTheme=()=>document.getElementById('theme')?.click();

// Phoenix pages keep a static fallback menu, then replace it with the current
// published inventory. The release pipeline validates this file against the hubs.
function phoenixLink(item, kind='plain'){
 const link=document.createElement('a'); link.href=item.href;
 if(kind==='story'){
  const img=document.createElement('img'); img.src=item.image; img.alt=''; img.width=72; img.height=60; img.loading='lazy';
  const copy=document.createElement('span'); const strong=document.createElement('strong'); strong.textContent=item.title;
  const small=document.createElement('small'); small.textContent=(item.meta||'').replace(/^.*·\s*/, '')||'2 min read';
  copy.append(strong,small); link.className='recent-story'; link.append(img,copy); return link;
 }
 if(kind==='feature'){
  const copy=document.createElement('span'); copy.className='feature-menu-copy';
  const strong=document.createElement('strong'); strong.textContent=item.title;
  const small=document.createElement('small'); small.textContent=item.description||'';
  const arrow=document.createElement('span'); arrow.textContent='↗'; copy.append(strong,small); link.append(copy,arrow); return link;
 }
 const title=document.createElement('span'); title.className='menu-title'; title.textContent=item.title;
 const arrow=document.createElement('span'); arrow.textContent='↗'; link.append(title,arrow); return link;
}
function phoenixMobileSection(label){
 return [...document.querySelectorAll('#mobile-menu nav>details')].find(section=>section.querySelector(':scope>summary')?.textContent.trim()===label);
}
function replaceMobileSection(label,items,kind,allHref,allLabel){
 const section=phoenixMobileSection(label); if(!section)return;
 [...section.children].slice(1).forEach(node=>node.remove());
 items.forEach(item=>section.append(phoenixLink(item,kind)));
 const all=document.createElement('a'); all.href=allHref; all.textContent=allLabel; section.append(all);
}
function applyPhoenixNavigation(data){
 const longform=document.querySelector('.desktop-nav .longform-menu .mega-links');
 if(longform)longform.replaceChildren(...data.longform.map(item=>phoenixLink(item)));
 const reports=document.querySelector('.desktop-nav .reports-menu .mega-links');
 if(reports)reports.replaceChildren(...data.reports.map(item=>phoenixLink(item)));
 const features=document.querySelector('.desktop-nav .features-menu .mega-links');
 if(features)features.replaceChildren(...data.specials.map(item=>phoenixLink(item,'feature')));
 const stories=document.querySelector('.desktop-nav .stories-menu .recent-stories');
 if(stories)stories.replaceChildren(...data.stories.slice(0,6).map(item=>phoenixLink(item,'story')));
 const toolGroups=document.querySelector('.desktop-nav .tool-menu-groups');
 if(toolGroups){
  toolGroups.replaceChildren(...data.toolGroups.map(group=>{
   const section=document.createElement('section'); section.className='tool-group';
   const title=document.createElement('h2'); title.textContent=group.name;
   const description=document.createElement('p'); description.textContent=group.description;
   section.append(title,description,...group.tools.map(item=>phoenixLink(item))); return section;
  }));
 }
 replaceMobileSection('Stories',data.stories.slice(0,6),'story','/stories','All stories →');
 replaceMobileSection('Reports',data.reports,'plain','/reports','All reports →');
 replaceMobileSection('Longform',data.longform,'plain','/longform','All longform articles →');
 replaceMobileSection('Special features',data.specials,'feature','/special-features','All special features →');
 const mobileTools=phoenixMobileSection('Tools & calculators');
 if(mobileTools){
  [...mobileTools.children].slice(1).forEach(node=>node.remove());
  data.toolGroups.forEach(group=>{
   const details=document.createElement('details'); details.className='mobile-group';
   const summary=document.createElement('summary'); summary.textContent=group.name; details.append(summary);
   group.tools.forEach(item=>details.append(phoenixLink(item))); mobileTools.append(details);
  });
  const all=document.createElement('a'); all.href='/tools'; all.textContent='All tools →'; mobileTools.append(all);
 }
}
fetch('/data/phoenix-navigation.json',{cache:'no-store'})
 .then(response=>{if(!response.ok)throw new Error('navigation inventory unavailable');return response.json();})
 .then(applyPhoenixNavigation)
 .catch(()=>{});
// Route existing relative homepage links to the new editorial homepage.
document.querySelectorAll('a[href="index.html"]').forEach(link=>{link.href='/';});
// Keep only one expanded desktop menu.
document.querySelectorAll('.desktop-nav>details').forEach(menu=>menu.addEventListener('toggle',()=>{
 if(menu.open)document.querySelectorAll('.desktop-nav>details').forEach(other=>{if(other!==menu)other.open=false;});
}));
try{
 const value=document.body.classList.contains('dark')?'dark':'light';
 const site=document.body.classList.contains('wealthmeter')?'wealthmeter':'lifemeter';
 localStorage.setItem(site+'_theme',value);
 localStorage.setItem(site+'-theme',value);
 document.getElementById('theme')?.addEventListener('click',()=>{
  const next=document.body.classList.contains('dark')?'dark':'light';
  localStorage.setItem(site+'_theme',next);localStorage.setItem(site+'-theme',next);
 });
}catch{}

// Development forms demonstrate signup without writing to the subscriber database.
const phoenixSite = document.body.classList.contains('wealthmeter') ? 'wealthmeter' : 'lifemeter';
const phoenixPreview = ![phoenixSite + '.xyz', 'www.' + phoenixSite + '.xyz'].includes(location.hostname);
if (!phoenixPreview) document.querySelector('[data-newsletter-preview]')?.remove();
document.querySelectorAll('[data-newsletter-form]').forEach(form => {
 form.addEventListener('submit', async event => {
  event.preventDefault();
  if (!form.reportValidity() || form.dataset.sending === '1') return;
  const status = form.querySelector('[data-newsletter-status]');
  if (phoenixPreview) {
   status.textContent = 'Signup preview complete. No details were sent and no subscription was created.';
   return;
  }
  const button = form.querySelector('button[type="submit"]');
  form.dataset.sending = '1'; button.disabled = true;
  try {
   const response = await fetch('https://lifemeter.xyz/api/newsletter', {
    method: 'POST', mode: 'cors', credentials: 'omit', headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({site: phoenixSite, source: form.dataset.source || 'phoenix', page: location.pathname,
     newsletter: 'yes', company: form.elements.company?.value || '', firstName: form.elements.firstName.value.trim(),
     lastName: form.elements.lastName.value.trim(), email: form.elements.email.value.trim(),
     commercialUpdates: form.elements.commercialUpdates?.checked ? 'yes' : 'no',
     commercialConsentVersion: form.elements.commercialUpdates?.checked ? '2026-10-01.1' : ''})
   });
   const data = await response.json();
   if (!response.ok || !data.ok) throw new Error('Signup unavailable');
   status.textContent = 'You are subscribed. Thank you.';
   form.reset();
  } catch { status.textContent = 'Signup is temporarily unavailable. Please try again.'; }
  finally { form.dataset.sending = '0'; button.disabled = false; }
 });
});

// A quiet channel link shares the existing footer styling.
const phoenixChannelIds = {lifemeter: 'UC3_3wPvBO8t6M7m-ACes2QA', wealthmeter: 'UCkdVTp3Fqd7Mz1VJ7yu7i1w'};
const phoenixFooterLinks = document.querySelector('.site-footer .footer-links');
if (phoenixFooterLinks && !phoenixFooterLinks.querySelector('[data-youtube-channel]')) {
 const link = document.createElement('a');
 link.href = 'https://www.youtube.com/channel/' + phoenixChannelIds[phoenixSite];
 link.textContent = 'YouTube ↗';
 link.setAttribute('aria-label', (phoenixSite === 'lifemeter' ? 'LifeMeter' : 'WealthMeter') + ' on YouTube');
 link.dataset.youtubeChannel = phoenixSite;
 link.target = '_blank'; link.rel = 'noopener';
 phoenixFooterLinks.append(link);
}

// Keep the homepage video collection below the editorial content.
if (['/', '/index', '/index.html'].includes(location.pathname) && document.querySelector('.site-footer') && !document.getElementById('videos')) {
 const channels = {
  lifemeter: [
   ['hdc9wBRzeGA', 'Functional Age: Is Your Body Older Than You Are?'],
   ['kS5MW1OxRAk', 'VO2 Max After 40'],
   ['Uq19orY9fM8', 'GLP-1 Weight Loss and Muscle']
  ],
  wealthmeter: [
   ['frdPB852rpE', 'Find Your Global Wealth Rank'],
   ['CpSQXkN9yZ4', 'High Income, Low Net Worth'],
   ['hjIlARdKl7g', 'Rent vs. Buy: The Full Cost']
  ]
 };
 const style = document.createElement('style');
 style.textContent = '.meter-videos{max-width:1280px;margin:3rem auto;padding:1.8rem 28px;border-top:1px solid var(--line,#d8ded6)}.meter-video-heading{display:flex;align-items:baseline;justify-content:space-between;gap:1rem;margin-bottom:1.25rem;flex-wrap:wrap}.meter-video-heading h2{font-size:1.6rem;margin:0}.meter-video-heading>a{font-size:.85rem}.meter-video-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:24px}.meter-video-grid iframe{width:100%;aspect-ratio:16/9;height:auto;border:0;border-radius:8px;background:#151515;display:block}.meter-video-grid h3{font:600 1rem/1.4 system-ui;margin:.7rem 0 .35rem}.meter-video-share{display:flex;align-items:center;gap:4px;color:var(--muted,#58635e)}.meter-video-share>a,.meter-video-share>button{display:inline-flex;align-items:center;justify-content:center;width:40px;height:40px;border:0;background:transparent;color:inherit;padding:0;cursor:pointer;border-radius:5px;text-decoration:none}.meter-video-share>a:hover,.meter-video-share>button:hover{background:var(--soft,#edf2e9)}.meter-video-share svg{width:16px;height:16px;fill:none;stroke:currentColor;stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round}.meter-share-status{font-size:.75rem;min-height:1em}.meter-video-share :focus-visible{outline:2px solid currentColor;outline-offset:2px}@media(max-width:720px){.meter-video-grid{grid-template-columns:1fr}.meter-videos{padding:1.5rem 20px}.meter-video-share>a,.meter-video-share>button{width:44px;height:44px}}';
 document.head.append(style);
 const section = document.createElement('section'); section.id = 'videos'; section.className = 'meter-videos'; section.setAttribute('aria-labelledby','meter-videos-heading');
 const heading = document.createElement('div'); heading.className = 'meter-video-heading';
 const title = document.createElement('h2'); title.id = 'meter-videos-heading'; title.textContent = 'Watch on ' + (phoenixSite === 'lifemeter' ? 'LifeMeter' : 'WealthMeter');
 const channelLink = document.createElement('a'); channelLink.href = 'https://www.youtube.com/channel/' + phoenixChannelIds[phoenixSite]; channelLink.textContent = 'YouTube channel ↗'; channelLink.target = '_blank'; channelLink.rel = 'noopener';
 heading.append(title,channelLink); section.append(heading);
 const grid = document.createElement('div'); grid.className = 'meter-video-grid';
 const icons = {
  link: '<path d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-2 2M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l2-2"/>',
  email: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 6 9 7 9-7"/>',
  message: '<path d="M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7A8.4 8.4 0 0 1 4 11.5 8.5 8.5 0 0 1 8.7 3.9a8.4 8.4 0 0 1 3.8-.9h.5a8.5 8.5 0 0 1 8 8v.5Z"/>'
 };
 function shareIcon(element,label,icon){
  element.setAttribute('aria-label',label); element.title = label;
  element.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true">' + icons[icon] + '</svg>';
 }
 channels[phoenixSite].forEach(([id,label])=>{
  const url = 'https://www.youtube.com/watch?v=' + id;
  const article = document.createElement('article');
  const frame = document.createElement('iframe'); frame.src = 'https://www.youtube-nocookie.com/embed/' + id; frame.title = label; frame.loading = 'lazy'; frame.referrerPolicy = 'strict-origin-when-cross-origin'; frame.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share'; frame.allowFullscreen = true;
  const h3 = document.createElement('h3'); const watchLink = document.createElement('a'); watchLink.href = url; watchLink.textContent = label; watchLink.target = '_blank'; watchLink.rel = 'noopener'; h3.append(watchLink);
  const sharing = document.createElement('div'); sharing.className = 'meter-video-share'; sharing.setAttribute('aria-label','Share ' + label);
  const status = document.createElement('span'); status.className = 'meter-share-status'; status.setAttribute('aria-live','polite');
  const copy = document.createElement('button'); copy.type = 'button'; shareIcon(copy,'Copy video link','link');
  copy.addEventListener('click',async()=>{try{await navigator.clipboard.writeText(url);status.textContent='Link copied';}catch{status.textContent='Use the video title to open and copy its link';}});
  const mail = document.createElement('a'); mail.href = 'mailto:?subject=' + encodeURIComponent(label) + '&body=' + encodeURIComponent(url); shareIcon(mail,'Share by email','email');
  const whatsapp = document.createElement('a'); whatsapp.href = 'https://wa.me/?text=' + encodeURIComponent(label + ' ' + url); whatsapp.target = '_blank'; whatsapp.rel = 'noopener'; shareIcon(whatsapp,'Share on WhatsApp','message');
  sharing.append(copy,mail,whatsapp,status); article.append(frame,h3,sharing); grid.append(article);
 });
 section.append(grid); document.querySelector('.site-footer').before(section);
}
