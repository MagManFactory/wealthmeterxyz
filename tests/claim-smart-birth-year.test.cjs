const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');const model=require('../assets/claim-smart-model'),view=require('../assets/claim-smart-view-model');
const base={referenceAge:62,a:744,b:840,pia:2000,benefitA:1400,benefitB:2480,manual:false,basis:'common',display:'nominal',cola:0,returns:5,retain:100,checkpoint:85};
test('SSA boundary years show precise full retirement ages',()=>{
for(const [year,months,label]of [[1954,792,'66'],[1955,794,'66 years, 2 months'],[1958,800,'66 years, 8 months'],[1959,802,'66 years, 10 months'],[1960,804,'67'],[1975,804,'67']]){const cohort=view.birthCohort(year);assert.equal(model.fra(cohort),months);assert.equal(view.fullAgeLabel(months),label);}
});
test('January 1 uses the prior year without collecting a full date',()=>{
for(const [year,expected]of [[1955,1954],[1959,1958],[1960,1959],[1961,1960]])assert.equal(view.birthCohort(year,true),expected);
assert.throws(()=>view.birthCohort(1943,true),/outside this tool/);for(const y of [NaN,1959.5,1942,new Date().getUTCFullYear()+1])assert.throws(()=>view.birthCohort(y));
});
test('birth-year / Jan1 changes propagate to benefit amounts and investment trajectory',()=>{
const y59=view.summarize({...base,cohort:view.birthCohort(1959)}),y60=view.summarize({...base,cohort:view.birthCohort(1960)}),jan=view.summarize({...base,cohort:view.birthCohort(1960,true)});
assert.notEqual(y59.a.payment,y60.a.payment);assert.notEqual(y59.b.payment,y60.b.payment);assert.notEqual(y59.r.a[180].shownBalance,y60.r.a[180].shownBalance);assert.deepEqual(jan,y59);assert.deepEqual(view.summarize({...base,cohort:view.birthCohort(1970)}),y60);
const html=fs.readFileSync('claim-smart.html','utf8');assert.match(html,/id="cs-cohort" type="number"/);assert.match(html,/id="cs-january-first" type="checkbox"/);assert.match(html,/id="cs-fra" class="cs-fra-callout" role="status"/);assert.match(html,/id="cs-pia-label"/);assert.doesNotMatch(html,/<input[^>]*type="date"/);
});
