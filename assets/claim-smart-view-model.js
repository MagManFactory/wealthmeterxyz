(function(root){'use strict';
const model=typeof module==='object'&&module.exports?require('./claim-smart-model'):root.ClaimSmart;
function summarize(p){
 const r=model.calculate(p),index=(p.checkpoint-p.referenceAge)*12;
 function parts(series){const v=series[index];return {payment:series.find(x=>x.payment>0)?.payment||0,received:v.shownGross,spent:v.shownSpent,contributed:v.shownCash,growth:v.shownBalance-v.shownCash,balance:v.shownBalance};}
 const a=parts(r.a),b=parts(r.b),sensitivity=[...new Set([0,3,5,7,p.returns])].sort((x,y)=>x-y).map(returns=>{const result=model.calculate({...p,returns});return {returns,a:result.a[index].shownBalance,b:result.b[index].shownBalance};});
 const checkpoints=[75,85,95].map(age=>{const i=(age-p.referenceAge)*12;return {age,a:r.a[i].shownBalance,b:r.b[i].shownBalance};});
 return {r,a,b,sensitivity,checkpoints,difference:a.balance-b.balance,portfolioCross:r.portfolioCross!==null&&r.portfolioCross<=p.checkpoint*12?r.portfolioCross:null,cashCross:r.cashCross!==null&&r.cashCross<=p.checkpoint*12?r.cashCross:null};
}
const api={summarize};if(typeof module==='object'&&module.exports)module.exports=api;else root.ClaimSmartView=api;
})(typeof globalThis==='object'?globalThis:this);
