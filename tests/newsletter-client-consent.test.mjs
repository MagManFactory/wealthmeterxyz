import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync, existsSync, readdirSync} from 'node:fs';
import vm from 'node:vm';
function context(host='lifemeter.xyz') {
  const handlers={},requests=[];let markup='';
  const cls={add(){},remove(){}};
  class Form {
    constructor(checked) {this.dataset={site:host.includes('wealth')?'wealthmeter':'lifemeter',source:'footer'};this.elements={email:{value:'test@example.com'},first_name:{value:'Test'},last_name:{value:'Owner'},firstName:{value:'Test'},lastName:{value:'Owner'},newsletter:{value:'yes'},company:{value:''},...(checked===undefined?{}:{commercialUpdates:{checked,value:'yes'}})};this.button={};this.status={};}
    matches(){return true;}closest(){return this;}reportValidity(){return true;}reset(){}querySelector(s){return s.includes('button')?this.button:this.status;}
  }
  const document={cookie:'',body:{dataset:{},classList:cls,append(node){markup=node.innerHTML;}},addEventListener(name,handler){handlers[name]=handler;},querySelector(s){return s.includes("googletagmanager")?{}:null;},querySelectorAll(){return [];},createElement(){return {querySelector(){return {focus(){}};}};}};
  const sandbox={document,window:{__lmGa4:true,__wmGa4:true,location:{hostname:host,pathname:'/',assign(){}},dispatchEvent(){}},HTMLFormElement:Form,FormData:class{constructor(form){this.form=form;}get(n){return this.form.elements[n]?.value||null;}},CustomEvent:class{},Response,console,fetch:async(url,options)=>{const body=JSON.parse(options.body);requests.push({url,body});return Response.json({ok:true,token:'test-token'});}};
  return {vm:vm.createContext(sandbox),handlers,requests,Form,markup:()=>markup};
}
for (const filename of ['components.js','components22.js']) {
  const path=new URL(`../${filename}`,import.meta.url);
  if(!existsSync(path))continue;
  for(const checked of [undefined,false,true]) test(`${filename}: promotional opt-in ${String(checked)} is explicit and optional`,async()=>{
    const c=context(filename==='components22.js'?'wealthmeter.xyz':'lifemeter.xyz');
    vm.runInContext(readFileSync(path,'utf8'),c.vm);
    const html=vm.runInContext('newsletterHTML("footer")',c.vm);
    const checkbox=html.match(/<input[^>]*name="commercialUpdates"[^>]*>/)?.[0];
    assert.ok(checkbox);assert.match(checkbox,/type="checkbox"/);assert.doesNotMatch(checkbox,/\bchecked\b|\brequired\b/);
    await c.handlers.submit({target:new c.Form(checked),preventDefault(){}});
    const payload=c.requests.find(x=>x.url.includes('/api/newsletter')).body;
    assert.equal(payload.newsletter,'yes');
    assert.equal(payload.commercialUpdates,checked===true?'yes':'no');assert.equal(payload.commercialConsentVersion,checked===true?'2026-10-01.1':'');
  });
}
const gatePath=new URL('../subscriber-gate.js',import.meta.url);
if(existsSync(gatePath)) for(const host of ['lifemeter.xyz','wealthmeter.xyz']) for(const checked of [undefined,false,true]) test(`${host} subscriber gate preserves news-only default (${String(checked)})`,async()=>{
  const c=context(host);
  const source=readFileSync(gatePath,'utf8').replace('  initializePageGate();','  globalThis.gateTest = {showGate, submitGate};\n  initializePageGate();');
  vm.runInContext(source,c.vm);
  c.vm.gateTest.showGate(host.includes('wealth')?'portfolio-alpha':'biomarker-essentials');
  const checkbox=c.markup().match(/<input[^>]*name="commercialUpdates"[^>]*>/)?.[0];
  assert.ok(checkbox);assert.doesNotMatch(checkbox,/\bchecked\b|\brequired\b/);
  await c.vm.gateTest.submitGate(new c.Form(checked));
  const payload=c.requests.find(x=>x.url.includes('/api/newsletter')).body;
  assert.equal(payload.newsletter,'yes');assert.equal(payload.commercialUpdates,checked===true?'yes':'no');assert.equal(payload.commercialConsentVersion,checked===true?'2026-10-01.1':'');
});


test("every statically rendered signup offers an unchecked optional promotional checkbox",()=>{
  const root=new URL('../',import.meta.url);
  let forms=0;
  for(const filename of readdirSync(root).filter(n=>n.endsWith('.html'))) {
    const html=readFileSync(new URL(filename,root),'utf8');
    for(const form of html.matchAll(/<form\b[^>]*data-newsletter-form[^>]*>[\s\S]*?<\/form>/g)) {
      forms++;
      const checkbox=form[0].match(/<input[^>]*name="commercialUpdates"[^>]*>/)?.[0];
      assert.ok(checkbox,filename);assert.match(checkbox,/type="checkbox"/);assert.doesNotMatch(checkbox,/\bchecked\b|\brequired\b/);
    }
  }
  assert.ok(forms>0);
});
