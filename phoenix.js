// One theme controls both the editorial shell and existing tool theme selectors.
function syncPhoenixTheme(){
 const dark=document.body.classList.contains('dark');
 document.body.classList.toggle('dark-mode',dark);
 document.documentElement.dataset.theme=dark?'dark':'light';

}
syncPhoenixTheme();
document.getElementById('theme')?.addEventListener('click',syncPhoenixTheme);
window.toggleTheme=()=>document.getElementById('theme')?.click();
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
