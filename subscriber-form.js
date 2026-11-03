async function meterVerifiedSignup(input) {
    if (!window.__meterVerificationLoad) window.__meterVerificationLoad = new Promise((resolve, reject) => {
        if (window.MeterVerification) { resolve(); return; }
        const script = document.createElement('script'); script.src = '/subscriber-verification.js?v=20261103-access1';
        script.onload = resolve; script.onerror = () => { window.__meterVerificationLoad = null; script.remove(); reject(new Error('Verification could not load. Please try again.')); };
        document.head.append(script);
    });
    await window.__meterVerificationLoad;
    return window.MeterVerification.start(input);
}
(() => {
 'use strict';
 document.addEventListener('submit',async event=>{
  const form=event.target.closest('[data-newsletter-form]');if(!form)return;
  event.preventDefault();if(!form.reportValidity()||form.dataset.sending==='1')return;
  form.dataset.sending='1';const button=form.querySelector('button[type=submit]');const status=form.querySelector('[data-newsletter-status],.site-newsletter-status');if(button)button.disabled=true;
  const field=(...names)=>{for(const name of names)if(form.elements[name])return form.elements[name].value.trim();return '';};
  try{await meterVerifiedSignup({mode:'new',resource:'newsletter',firstName:field('firstName','first_name'),lastName:field('lastName','last_name'),email:field('email'),company:field('company'),newsletter:field('newsletter'),source:form.dataset.source||'embedded-form',page:location.pathname,commercialUpdates:'no',commercialConsentVersion:''});if(status)status.textContent='Email verified. You are subscribed. Thank you.';form.reset();}
  catch(error){if(status)status.textContent=error.message||'Signup is temporarily unavailable. Please try again.';}
  finally{form.dataset.sending='0';if(button)button.disabled=false;}
 },true);
})();
