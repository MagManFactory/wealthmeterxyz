const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const html=fs.readFileSync(path.join(root,'what-inflation-costs-you.html'),'utf8');
const data=JSON.parse(html.match(/<script id="sourceData"[^>]*>(.*?)<\/script>/s)[1]);
const js=fs.readFileSync(path.join(root,'assets/inflation.js'),'utf8');
const context={document:{getElementById:()=>({textContent:JSON.stringify(data)})}};
vm.createContext(context);
vm.runInContext(js.slice(0,js.indexOf("document.addEventListener('input'"))+';globalThis.calc=calculate;globalThis.mix=presets;',context);
const close=(a,b)=>assert(Math.abs(a-b)<1e-9,`${a} != ${b}`);
close(context.calc().basket-100,23.1629058988);
close(context.calc().headline-100,22.6991633321);
close(context.calc(context.mix.equal,2024).basket-100,18.1331486428);
assert(context.calc(context.mix.equal,2024).weights.every(w=>w===.125));
assert.equal(data.categories.length,8);
assert.equal(data.categories.reduce((s,c)=>s+c.values.length,0)+data.headline.values.length,54);
let cases=0;
for(const amounts of [...Object.values(context.mix),...Array.from({length:8},(_,i)=>Array.from({length:8},(_,j)=>i===j?5000:0)),Array(8).fill(0)]){
 for(const year of data.years){
  const r=context.calc(amounts,year),j=data.years.indexOf(year),total=amounts.reduce((a,b)=>a+b,0);
  if(total){
   const expected=data.categories.reduce((sum,c,i)=>sum+(amounts[i]/total)*(c.values[j]/c.values[0]-1)*100,0);
   close(r.basket-100,expected);close(r.contributions.reduce((a,b)=>a+b,0),expected);
   close(r.weights.reduce((a,b)=>a+b,0),1);
   if(year===2019)close(r.basket,100);
  }else{assert.equal(r.basket,null);assert(r.weights.every(x=>x===0));assert(r.contributions.every(x=>x===0));}
  close(r.headline,100*data.headline.values[j]/data.headline.values[0]);
  assert(r.contributions.every(Number.isFinite));cases++;
 }
}
assert(html.includes('2019–2024 annual averages'));
assert(html.includes('Estimate based on national price averages, not your actual bills.'));
assert(html.includes('owners’ equivalent rent'));
assert(html.includes('most 2025 annual averages omit October'));
assert(!html.includes('subscriber-gate'));
const nav=JSON.parse(fs.readFileSync(path.join(root,'data/phoenix-navigation.json')));
assert(nav.specials.some(x=>x.title==='What Inflation Costs You'&&x.href==='/what-inflation-costs-you'));
assert(nav.specials.some(x=>x.title==='Claim Smart'));
assert(nav.specials.some(x=>x.title==='Age & Automation'));
console.log(`PASS: ${cases} calculation scenarios across all six years; approved outputs, eight equal shares, single-category extremes, zero state, source values, caveats and Specials discovery.`);
