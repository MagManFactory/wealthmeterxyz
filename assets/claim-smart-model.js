/* Monthly planning model. All inputs remain in the browser. */
(function(root){
'use strict';
const FRA={1955:794,1956:796,1957:798,1958:800,1959:802,1960:804};
function fra(cohort){if(!Number.isInteger(cohort)||cohort<1943||cohort>2100)throw new RangeError('Choose a supported birth cohort (1943 or later).');return cohort<=1954?792:(FRA[cohort]||804);}
function factor(months,full){
 if(!Number.isInteger(months)||months<744||months>840||!Number.isInteger(full)||full<792||full>804)throw new RangeError('Invalid claiming age or FRA.');
 const early=Math.max(0,full-months);
 return early?1-Math.min(early,36)/180-Math.max(early-36,0)/240:1+(months-full)/150;
}
function validate(p){
 const ranges={referenceAge:[18,62],a:[744,840],b:[744,840],pia:[0,20000],benefitA:[0,20000],benefitB:[0,20000],cola:[-5,15],returns:[-99,30],retain:[0,100],checkpoint:[62,100]};
 for(const [key,[min,max]] of Object.entries(ranges).filter(([key])=>p.manual?key!=='pia':!['benefitA','benefitB'].includes(key)))if(typeof p[key]!=='number'||!Number.isFinite(p[key])||p[key]<min||p[key]>max)throw new RangeError(['a','b'].includes(key)?'Claiming ages must be between 62y 0m and 70y 0m.':`Check ${key}: enter a value from ${min} to ${max}.`);
 for(const key of ['referenceAge','a','b','checkpoint'])if(!Number.isInteger(p[key]))throw new RangeError('Ages must use whole years and whole months.');
 fra(p.cohort);
 if(!['common','future'].includes(p.basis)||!['nominal','real'].includes(p.display))throw new RangeError('Choose a dollar basis.');
 if(p.basis==='future'&&!p.manual)throw new RangeError('Claim-time future dollars require separate benefit estimates.');
}
function simulate(p,claim,benefit){
 const start=p.referenceAge*12,end=1200;
 const monthly=Math.pow(1+p.returns/100,1/12);
 const series=[]; let gross=0,spent=0,cash=0,balance=0;
 for(let age=start;age<=end;age++){
  const elapsed=age-start;
  // A benefit for the selected entitlement month is received one month later.
  // COLA steps use the entitlement month's common anniversary, not claim-specific clocks.
  const entitlement=age-1;
  const inflation=Math.pow(1+p.cola/100,Math.floor(Math.max(0,entitlement-start)/12));
  const claimInflation=Math.pow(1+p.cola/100,Math.floor((claim-start)/12));
  const payment=elapsed>0&&entitlement>=claim ? benefit*inflation/(p.basis==='future'?claimInflation:1):0;
  if(elapsed>0){balance*=monthly; gross+=payment; spent+=payment*(1-p.retain/100);cash+=payment*p.retain/100; balance+=payment*p.retain/100;}
  const deflator=p.display==='real'?Math.pow(1+p.cola/100,Math.floor(elapsed/12)):1;
  series.push({month:age,age:age/12,payment,gross,spent,cash,balance,shownGross:gross/deflator,shownSpent:spent/deflator,shownCash:cash/deflator,shownBalance:balance/deflator});
 }
 return series;
}
function crossover(early,late,metric,lateMonth){
 let wasBehind=false;
 for(let i=0;i<early.length;i++){
  const diff=late[i][metric]-early[i][metric];
  if(diff < -1e-7)wasBehind=true;
  if(early[i].month>lateMonth&&wasBehind&&diff>1e-7)return early[i].month;
 }
 return null;
}
function calculate(p){
 validate(p);const full=fra(p.cohort);
 const benefitA=p.manual?p.benefitA:p.pia*factor(p.a,full),benefitB=p.manual?p.benefitB:p.pia*factor(p.b,full);
 const a=simulate(p,p.a,benefitA),b=simulate(p,p.b,benefitB);
 const early=p.a<=p.b?a:b,late=p.a<=p.b?b:a;
 const same=p.a===p.b&&Math.abs(benefitA-benefitB)<1e-9;
 return {a,b,full,benefitA,benefitB,same,cashCross:same?null:crossover(early,late,'gross',Math.max(p.a,p.b)),portfolioCross:same?null:crossover(early,late,'balance',Math.max(p.a,p.b))};
}
const api={fra,factor,validate,simulate,crossover,calculate};
if(typeof module==='object'&&module.exports)module.exports=api;else root.ClaimSmart=api;
})(typeof globalThis==='object'?globalThis:this);
