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
