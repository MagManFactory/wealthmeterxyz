const assert=require('node:assert/strict');
const {scenario}=require('../assets/age-automation.js');
const data=require('../data/age-automation.json');
let cases=0;
assert.equal(new Set(data.countries.map(c=>c.iso)).size,20);
for(const c of data.countries){
 assert.equal(c.rows.length,31);
 for(const r of c.rows){assert(r.workingAgeShare>0&&r.workingAgeShare<100);assert(r.oldDependency>0);assert.equal(r.status,r.year<2024?'estimate':'projection');}
 const original=JSON.stringify(c);
 for(const target of [0,1,3])for(const employment of [-20,0,20])for(const productivity of [0,1,5]){
  const s=scenario(c,{target,employment,productivity});assert.equal(s.series[0].scenario,100);assert.equal(s.series[0].target,100);
  assert(s.series.every(r=>Number.isFinite(r.scenario)&&r.scenario>0));
  const closed=scenario(c,{target,employment,productivity:s.hurdle}).series.at(-1);
  assert(Math.abs(closed.scenario-closed.target)<1e-9,'hurdle must exactly reach endpoint goal');
  const a=c.rows.find(r=>r.year===2026).workingAgeShare,z=c.rows.at(-1).workingAgeShare;
  if(productivity===0&&employment===0)assert(Math.abs(s.series.at(-1).scenario/100-z/a)<1e-12);
  cases++;
 }
 assert.equal(JSON.stringify(c),original,'all assumptions must leave demography unchanged');
}
const constant={rows:Array.from({length:25},(_,i)=>({year:2026+i,workingAgeShare:60}))};
assert(Math.abs(scenario(constant,{target:0,employment:0,productivity:0}).hurdle)<1e-12);
assert(scenario(constant,{target:0,employment:0,productivity:0}).series.every(r=>r.scenario===100));
assert(Math.abs(scenario(data.countries.find(c=>c.iso==='KOR')).hurdle-2.142303826605718)<1e-10);
console.log(`PASS: ${cases} all-country/extreme cases; exact endpoint identity; zero-change; baseline; immutable demographics; 620 valid source rows.`);
