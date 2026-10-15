const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const {summarize}=require('../assets/claim-smart-view-model');
const p={cohort:1960,referenceAge:62,a:744,b:840,pia:2000,benefitA:1400,benefitB:2480,manual:false,basis:'common',display:'nominal',cola:0,returns:5,retain:100,checkpoint:85};
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-5,`${a} != ${b}`);
function annuity(payment,years,returns){const n=years*12,q=Math.pow(1+returns/100,1/12);return returns===0?payment*n:payment*(Math.pow(q,n)-1)/(q-1);}
test('beginner cards distinguish monthly check, contributions, growth and final balance',()=>{
const s=summarize(p);near(s.a.payment,1400);near(s.b.payment,2480);near(s.a.contributed,1400*23*12);near(s.b.contributed,2480*15*12);near(s.a.balance,annuity(1400,23,5));near(s.b.balance,annuity(2480,15,5));near(s.a.growth+s.a.contributed,s.a.balance);near(s.b.growth+s.b.contributed,s.b.balance);assert(s.a.growth>0);assert(s.b.growth>0);assert(s.difference>0);
});
test('0/3/5/7 sensitivity is an equal comparison with independent closed-form values',()=>{
const s=summarize(p);assert.deepEqual(s.sensitivity.map(x=>x.returns),[0,3,5,7]);for(const row of s.sensitivity){near(row.a,annuity(1400,23,row.returns));near(row.b,annuity(2480,15,row.returns));}assert(s.sensitivity[0].a<s.sensitivity[0].b);assert(s.sensitivity[2].a>s.sensitivity[2].b);
for(const row of s.checkpoints){near(row.a,annuity(1400,row.age-62,5));near(row.b,annuity(2480,row.age-70,5));}
});
test('chosen horizon controls catch-up labels, not entire model horizon',()=>{
assert.equal(summarize(p).portfolioCross,null);assert.equal(summarize({...p,checkpoint:95}).portfolioCross,1078);assert.equal(summarize({...p,returns:0}).portfolioCross,965);assert.equal(summarize({...p,retain:0}).portfolioCross,null);
});
test('negative/custom returns, partial investment, same and reversed ages',()=>{
const loss=summarize({...p,returns:-5,retain:50});assert(loss.a.growth<0);near(loss.a.balance,annuity(700,23,-5));near(loss.a.spent,1400*23*12*.5);assert.deepEqual(loss.sensitivity.map(x=>x.returns),[-5,0,3,5,7]);
const allSpent=summarize({...p,retain:0});for(const row of allSpent.sensitivity){assert.equal(row.a,0);assert.equal(row.b,0);}assert.equal(allSpent.a.contributed,0);near(allSpent.a.received,allSpent.a.spent);
const equal=summarize({...p,a:840});assert.equal(equal.r.same,true);assert.equal(equal.difference,0);const reversed=summarize({...p,a:840,b:744});near(reversed.a.balance,summarize(p).b.balance);
const otherA=summarize({...p,a:780,b:816});near(otherA.a.payment,2000*(1-24/180));near(otherA.b.payment,2160);
});
test('main path explains fields; advanced details remain collapsed; default visible investment story',()=>{
const html=fs.readFileSync('claim-smart.html','utf8');assert.match(html,/data-subscriber-protected hidden inert/);assert.match(html,/id="cs-return" type="range"[^>]*value="5"/);assert.match(html,/id="cs-retain" type="range"[^>]*value="100"/);assert.match(html,/<details class="cs-panel cs-advanced">/);assert.match(html,/before taxes or Medicare deductions/);
for(const id of ['cs-pia','cs-cohort','cs-ay','cs-by','cs-retain','cs-return','cs-am','cs-bm','cs-return-exact','cs-checkpoint','cs-cola','cs-reference','cs-display','cs-basis','cs-ben-a','cs-ben-b']){const tag=html.match(new RegExp(`<(?:input|select)[^>]*id="${id}"[^>]*>`))?.[0];assert(tag,id);assert.match(tag,/aria-describedby=/,id);}
for(const id of ['cs-ay','cs-by']){const options=html.match(new RegExp(`<select id="${id}"[^>]*>(.*?)</select>`,'s'))[1];assert.equal((options.match(/<option/g)||[]).length,9);assert.match(options,/value="62"/);assert.match(options,/value="70"/);}
});
