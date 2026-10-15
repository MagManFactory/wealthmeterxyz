const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const source=fs.readFileSync('subscriber-gate.js','utf8');
function setup({host='wealthmeter.xyz',token='',ok=true}={}){
 const handlers={},requests=[],events=[];let markup='',locked=true,removed=false;
 const protectedNode={inert:true,setAttribute(){locked=true},removeAttribute(){locked=false}};
 const form={dataset:{},elements:{email:{value:'staging-only@example.invalid'},firstName:{value:'Staging'},lastName:{value:'Test'},company:{value:''}},reportValidity(){return true},querySelector(s){return s.includes('button')?{}:{focus(){}};}};
 const modeButtons=[{dataset:{gateMode:'new'},setAttribute(){}},{dataset:{gateMode:'returning'},setAttribute(){}}];
 const dialog={querySelector(s){if(s==='[data-gate-form]')return form;if(s==='[data-gate-consent]')return null;return {focus(){}}},querySelectorAll(s){return s==='[data-gate-mode]'?modeButtons:[];}};
 const backdrop={innerHTML:'',remove(){removed=true},querySelector(){return {focus(){}}}};
 const document={cookie:token?'wm_subscriber_access='+token:'',body:{dataset:{subscriberGateResource:'claim-smart'},classList:{contains(){return true},add(){},remove(){}},append(n){markup=n.innerHTML}},querySelector(s){if(s==='.legacy-content')return protectedNode;if(s==='.subscriber-gate-backdrop')return removed?null:backdrop;return null},querySelectorAll(){return [protectedNode]},createElement(){return backdrop},addEventListener(n,f){handlers[n]=f},dispatchEvent(e){events.push(e.type)}};
 const sandbox={document,window:{location:{hostname:host,pathname:'/claim-smart.html',assign(){}}},CustomEvent:class {constructor(type){this.type=type}},fetch:async(url,options)=>{const body=JSON.parse(options.body);requests.push({url,body});return {ok,json:async()=>ok?{ok:true,token:'staging-mock-token'}:{ok:false,error:'mock rejected'}};}};
 const context=vm.createContext(sandbox);vm.runInContext(source.replace('  initializePageGate();','  globalThis.gate={submitGate,initializePageGate,showGate};'),context);
 return {context,handlers,requests,events,form,dialog,modeButtons,locked:()=>locked,markup:()=>markup};
}
test('direct URL and reload without token remain locked; preview sends nothing',async()=>{
const c=setup({host:'localhost'});await c.context.gate.initializePageGate();assert(c.locked());assert.match(c.markup(),/Unlock Claim Smart/);await c.context.gate.submitGate(c.form);assert.equal(c.requests.length,0);assert(c.locked());await c.context.gate.initializePageGate();assert(c.locked());
});
test('valid existing token revalidates newsletter access, not financial data',async()=>{
const c=setup({token:'mock-token'});await c.context.gate.initializePageGate();assert(!c.locked());assert.deepEqual(c.events,['subscriber-access-unlocked']);assert.equal(c.requests.length,1);assert.equal(c.requests[0].body.action,'validate');assert.equal(c.requests[0].body.resource,'newsletter');assert.deepEqual(Object.keys(c.requests[0].body).sort(),['action','site','resource','company','token'].sort());
});
test('rejected/expired token fails closed and requests gate',async()=>{
const c=setup({token:'expired-mock',ok:false});await c.context.gate.initializePageGate();assert(c.locked());assert.match(c.markup(),/Unlock Claim Smart/);assert.equal(c.events.length,0);
});
test('returning-member toggle tolerates removed consent node; no new signup',async()=>{
const c=setup();c.context.gate.showGate('claim-smart');await c.handlers.click({target:{closest(selector){return selector==='[data-gate-mode]'?{dataset:{gateMode:'returning'},closest(){return c.dialog}}:null}}});assert.equal(c.form.dataset.mode,'returning');await c.context.gate.submitGate(c.form);assert(!c.locked());assert.equal(c.requests.length,1);assert.equal(c.requests[0].body.action,'claim');assert.equal(c.requests[0].body.resource,'newsletter');
});
test('new subscriber payload is newsletter-only and includes no calculator inputs',async()=>{
const c=setup();c.context.gate.showGate('claim-smart');await c.context.gate.submitGate(c.form);assert.equal(c.requests.length,2);const body=c.requests[0].body;assert.equal(body.newsletter,'yes');assert.equal(body.commercialUpdates,'no');assert.equal(body.commercialConsentVersion,'');assert.equal(body.source,'subscriber-gate-claim-smart');assert.deepEqual(Object.keys(body).sort(),['site','source','page','newsletter','commercialUpdates','commercialConsentVersion','company','firstName','lastName','email'].sort());assert(!c.locked());
});
test('static HTML is hidden/inert before JavaScript; no collection or persistence in calculator',()=>{
const html=fs.readFileSync('claim-smart.html','utf8'),client=fs.readFileSync('assets/claim-smart.js','utf8');assert.match(html,/<main[^>]*data-subscriber-protected[^>]*hidden inert>/);assert.doesNotMatch(client,/fetch\(|localStorage|sessionStorage|gtag\(|sendBeacon|XMLHttpRequest/);assert.match(source,/if \(isPreview\)/);
});
