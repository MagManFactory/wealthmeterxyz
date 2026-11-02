(() => {
 'use strict';
 const endpoint='https://lifemeter.xyz/api/access-verification';
 const messages={try_later:'Please wait before requesting another code.',service_unavailable:'Verification is temporarily unavailable. Please try again later.',invalid_or_expired_code:'That code is invalid, expired, or already used. Check the code or request a new one.',invalid_fields:'Check your name, email and consent, then try again.'};
 let active=false;
 async function post(body){
  const r=await fetch(endpoint,{method:'POST',mode:'cors',credentials:'omit',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
  const d=await r.json().catch(()=>({}));if(!r.ok||!d.ok)throw Error(messages[d.error]||'Verification could not complete. Please try again.');return d;
 }
 window.MeterVerification={async start(input){
  const site=document.body.classList.contains('wealthmeter')?'wealthmeter':'lifemeter';
  if(![site+'.xyz','www.'+site+'.xyz'].includes(location.hostname))throw Error('Preview only: no verification email was sent.');
  if(active)throw Error('Finish the current verification first.');active=true;
  let challenge;try{challenge=await post({...input,site,action:'request'});}catch(e){active=false;throw e;}
  return new Promise((resolve,reject)=>{
   const previous=document.activeElement,dialog=document.createElement('dialog');dialog.className='meter-verification';
   dialog.setAttribute('aria-labelledby','meter-code-title');
   dialog.innerHTML=`<style>.meter-verification{box-sizing:border-box;max-width:min(460px,calc(100vw - 32px));width:100%;max-height:90dvh;overflow:auto;border:1px solid #94a3b8;border-radius:16px;padding:24px;background:#fff;color:#142333;font:16px/1.5 system-ui}.meter-verification::backdrop{background:#0009}.meter-verification label{display:block;margin:16px 0}.meter-verification input{display:block;box-sizing:border-box;width:100%;font:inherit;padding:12px;color:inherit;background:transparent;border:1px solid #94a3b8;border-radius:6px}.meter-verification button{font:inherit;min-height:44px;margin:8px 8px 0 0;padding:8px 14px;cursor:pointer}.meter-verification button:disabled{cursor:wait;opacity:.6}body.dark .meter-verification,body.dark-mode .meter-verification{background:#15251f;color:#edf4ec}</style><h2 id="meter-code-title">Check your inbox</h2><p>If this address is eligible, a code will arrive shortly. It expires in 10 minutes. Already unsubscribed? Signing in does not rejoin the newsletter. Use the contact page for help.</p><form><label>Eight-digit code<input name="code" type="text" inputmode="numeric" autocomplete="one-time-code" pattern="[0-9]{8}" maxlength="8" required></label><button type="submit">Verify and continue</button><p role="status" aria-live="polite"></p></form><button type="button" data-resend disabled>Send a new code</button><button type="button" data-cancel>Cancel</button>`;
   document.body.append(dialog);dialog.showModal();const form=dialog.querySelector('form'),status=form.querySelector('[role=status]'),send=dialog.querySelector('[data-resend]'),submit=form.querySelector('button');let next=Date.now()+60000,busy=false,closed=false;
   const timer=setInterval(()=>{const seconds=Math.max(0,Math.ceil((next-Date.now())/1000));send.disabled=busy||seconds>0;send.textContent=seconds?`Send a new code in ${seconds}s`:'Send a new code';},250);
   function finish(error,data){if(closed)return;closed=true;clearInterval(timer);dialog.close();dialog.remove();active=false;previous?.focus();error?reject(error):resolve(data);}
   dialog.querySelector('[data-cancel]').onclick=()=>finish(Error('Verification cancelled. No access was granted.'));
   dialog.addEventListener('cancel',e=>{e.preventDefault();finish(Error('Verification cancelled. No access was granted.'));});
   send.onclick=async()=>{if(busy||Date.now()<next)return;busy=true;send.disabled=true;submit.disabled=true;try{challenge=await post({...input,site,action:'request'});next=Date.now()+60000;form.reset();status.textContent='If eligible, a new code is on its way. Use only the newest code.';}catch(e){next=Date.now()+60000;status.textContent=e.message;}finally{busy=false;submit.disabled=false;form.elements.code.focus();}};
   form.onsubmit=async e=>{e.preventDefault();if(busy||!form.reportValidity())return;busy=true;submit.disabled=true;send.disabled=true;status.textContent='Checking code…';try{
    const data=await post({action:'verify',site,challengeId:challenge.challengeId,code:form.elements.code.value.trim()});
    if(!data.token)throw Error('Verification did not issue access. Please try again.');
    document.cookie=`${site==='wealthmeter'?'wm':'lm'}_subscriber_access=${encodeURIComponent(data.token)}; Max-Age=15552000; Path=/; SameSite=Lax; Secure`;
    finish(null,data);
   }catch(e){status.textContent=e.message;busy=false;submit.disabled=false;form.elements.code.focus();}};
   form.elements.code.focus();
  });
 }};
})();
