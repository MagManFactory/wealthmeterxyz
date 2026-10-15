const test=require('node:test');const assert=require('node:assert/strict');const m=require('../assets/claim-smart-model');
const base={cohort:1960,referenceAge:62,a:744,b:804,pia:1000,benefitA:700,benefitB:1000,manual:false,basis:'common',display:'nominal',cola:0,returns:0,retain:100,checkpoint:80};
const near=(a,b,t=1e-7)=>assert.ok(Math.abs(a-b)<t,`${a} != ${b}`);
test('SSA monthly statutory fixtures and cohort FRA',()=>{
for(const [months,v] of [[744,.7],[745,.7041666666667],[767,.7958333333333],[768,.8],[803,.9944444444444],[804,1],[805,1.0066666666667],[840,1.24]])near(m.factor(months,804),v);
for(const [year,full,f62,f70] of [[1954,792,.75,1.32],[1955,794,.7416666666667,1.3066666666667],[1959,802,.7083333333333,1.2533333333333],[1960,804,.7,1.24]]){assert.equal(m.fra(year),full);near(m.factor(744,full),f62);near(m.factor(840,full),f70);}
});
test('cash at age80, month-later payment, closed-form investment annuity',()=>{
const r=m.calculate(base);near(r.a[216].gross,151200);near(r.b[216].gross,156000);assert.equal(r.a[0].payment,0);near(r.a[1].payment,700);
for(const claim of [744,804,840])for(const ret of [-50,-5,0,5,30]){
const p={...base,a:claim,returns:ret};const s=m.calculate(p).a;const n=960-claim,benefit=1000*m.factor(claim,804),q=Math.pow(1+ret/100,1/12);const expected=ret===0?n*benefit:benefit*(Math.pow(q,n)-1)/(q-1);near(s[216].balance,expected,1e-5);}
const r5=m.calculate({...base,b:840,returns:5});near(r5.a[216].balance,241679.810401353,1e-5);near(r5.b[216].balance,191410.320013818,1e-5);assert.equal(r5.portfolioCross,89*12+10);
const r1=m.calculate({...base,pia:1000/.7,returns:(Math.pow(1.01,12)-1)*100});near(r1.a[2].balance,2010);
});
test('break-even means strictly ahead after a deficit, never initial ties',()=>{
assert.equal(m.calculate(base).cashCross,78*12+9); // equality at78y8m; strict lead next month
assert.equal(m.calculate({...base,a:804,b:840}).cashCross,82*12+7); // equality82y6m
assert.equal(m.calculate({...base,b:840}).cashCross,80*12+5);
assert.equal(m.calculate({...base,b:840,returns:30}).portfolioCross,null);
assert.equal(m.calculate({...base,a:804,b:804}).same,true);
assert.equal(m.calculate({...base,pia:0}).cashCross,null);
assert.equal(m.calculate({...base,manual:true,a:804,b:804,benefitA:1000,benefitB:1100}).cashCross,null);
const normal=m.calculate({...base,b:840}),reversed=m.calculate({...base,a:840,b:744});assert.equal(normal.cashCross,reversed.cashCross);assert.deepEqual(normal.a,reversed.b);
});
test('common COLA clock, claim-time estimates not inflated twice, purchasing power',()=>{
const p={...base,cola:2.5,referenceAge:60,returns:6};const c=m.calculate(p);const f=m.calculate({...p,manual:true,basis:'future',benefitA:700*Math.pow(1.025,2),benefitB:1000*Math.pow(1.025,7)});
for(let i=0;i<c.a.length;i++){near(c.a[i].gross,f.a[i].gross,1e-5);near(c.b[i].balance,f.b[i].balance,1e-5);}
const real=m.calculate({...p,display:'real'});const i=(80-60)*12;near(real.a[i].shownBalance,c.a[i].balance/Math.pow(1.025,20));near((1.06/1.025-1)*100,3.41463414634147);
near(c.a[(62-60)*12+1].payment,700*Math.pow(1.025,2));near(c.b[(67-60)*12+1].payment,1000*Math.pow(1.025,7));
});
test('spending is not wealth and no-retention balance stays zero',()=>{
assert.doesNotThrow(()=>m.calculate({...base,manual:true,pia:NaN}));assert.doesNotThrow(()=>m.calculate({...base,benefitA:NaN}));
const spent=m.calculate({...base,retain:0,returns:10});assert.equal(spent.a[216].balance,0);near(spent.a[216].spent,spent.a[216].gross);assert.equal(spent.portfolioCross,null);
const half=m.calculate({...base,retain:50,returns:0});near(half.a[216].spent,75600);near(half.a[216].balance,75600);near(half.a[216].cash,75600);
});
test('invalid inputs fail; edge range remains finite',()=>{
for(const patch of [{a:841},{a:743},{a:744.5},{pia:-1},{pia:NaN},{cola:Infinity},{returns:-100},{retain:101},{referenceAge:63},{checkpoint:101},{checkpoint:75.5},{basis:'future'},{cohort:1942},{manual:true,benefitA:-1}])assert.throws(()=>m.calculate({...base,...patch}));
let count=0;for(const cola of [-5,0,15])for(const returns of [-99,0,30])for(const retain of [0,50,100])for(const a of [744,745,804,840]){const r=m.calculate({...base,cola,returns,retain,a});for(const row of [...r.a,...r.b])for(const key of ['gross','spent','cash','balance'])assert.ok(Number.isFinite(row[key])&&row[key]>=0);count++;}console.log(`${count} extreme model combinations passed`);
});
