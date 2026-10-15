(()=>{'use strict';
const $=id=>document.getElementById(id),model=window.ClaimSmart;
const money=n=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0}).format(n);
const age=m=>`${Math.floor(m/12)}y ${m%12}m`;
let result=null;
function read(){const n=id=>$(id).value.trim()===''?NaN:Number($(id).value);return {cohort:n('cs-cohort'),referenceAge:n('cs-reference'),a:n('cs-ay')*12+n('cs-am'),b:n('cs-by')*12+n('cs-bm'),pia:n('cs-pia'),benefitA:n('cs-ben-a'),benefitB:n('cs-ben-b'),manual:$('cs-manual').checked,basis:$('cs-manual').checked?$('cs-basis').value:'common',display:$('cs-display').value,cola:n('cs-cola'),returns:n('cs-return'),retain:n('cs-retain'),checkpoint:n('cs-checkpoint')};}
function cellRow(label,points,key){return `<tr><th scope="row">${label}</th>${points.map(p=>`<td>${money(p[key])}</td>`).join('')}</tr>`;}
function draw(r,p){
 const metric=$('cs-chart-mode').value==='gross'?'shownGross':'shownBalance';
 const start=p.referenceAge*12,end=1200,max=Math.max(1,...r.a.map(x=>x[metric]),...r.b.map(x=>x[metric]));
 const X=m=>60+(m-start)/(end-start)*630,Y=v=>250-v/max*220;
 const path=s=>s.map((v,i)=>`${i?'L':'M'}${X(v.month).toFixed(2)},${Y(v[metric]).toFixed(2)}`).join(' ');
 let grid='';for(let i=0;i<=4;i++){const v=max*i/4,y=Y(v);grid+=`<line x1="60" y1="${y}" x2="690" y2="${y}" stroke="var(--cs-line)"/><text x="52" y="${y+4}" text-anchor="end">$${Math.round(v/1000)}k</text>`;}
 for(let y=Math.ceil(p.referenceAge/5)*5;y<=100;y+=5)grid+=`<text x="${X(y*12)}" y="275" text-anchor="middle">${y}</text>`;
 $('cs-chart').innerHTML=`<title>Claiming comparison by age</title><desc>${metric==='shownGross'?'Cumulative gross benefits':'Retained investment balances'} for options A and B. Full yearly values follow in the data table.</desc><g fill="var(--cs-muted)" font-size="12" font-family="system-ui">${grid}<text x="375" y="298" text-anchor="middle">Age (years)</text></g><path d="${path(r.a)}" fill="none" stroke="var(--cs-a)" stroke-width="3"/><path d="${path(r.b)}" fill="none" stroke="var(--cs-b)" stroke-width="3" stroke-dasharray="8 4"/>`;
 let rows='';for(let y=Math.ceil(p.referenceAge);y<=100;y++){const i=(y-p.referenceAge)*12;rows+=`<tr><th scope="row">${y}</th><td>${money(r.a[i][metric])}</td><td>${money(r.b[i][metric])}</td></tr>`;}
 $('cs-yearly').innerHTML=rows;$('cs-series-label').textContent=metric==='shownGross'?'Cumulative gross benefits':'Retained investment balances';
}
function render(){
 const p=read();$('cs-custom').hidden=!p.manual;$('cs-pia').disabled=p.manual;
 try{
 for(const id of ['cs-ay','cs-by'])if(!Number.isInteger(Number($(id).value)))throw new RangeError('Enter claiming ages as whole years, then choose extra months.');
 result=model.calculate(p);$('cs-error').textContent='';$('cs-results').hidden=false;
 const r=result; $('cs-fra').textContent=`Full retirement age: ${age(r.full)}`;
 $('cs-benefits').textContent=`A at ${age(p.a)}: ${money(r.benefitA)}/mo · B at ${age(p.b)}: ${money(r.benefitB)}/mo (${p.basis==='future'?'each claim month’s future dollars':'common reference dollars'}).`;
 const cross=m=>m===null?'No crossover by 100':age(m);
 const equal=p.a===p.b;
 $('cs-cash-cross').textContent=r.same?'Identical options':equal?'Same claiming age':cross(r.cashCross);
 $('cs-portfolio-cross').textContent=p.retain===0?'No retained balance':r.same?'Identical options':equal?'Same claiming age':cross(r.portfolioCross);
 $('cs-cross-copy').textContent=equal?'Same-age options have no waiting break-even. Custom dollar differences can still change their totals.':`When the later claim (${age(Math.max(p.a,p.b))}) first moves strictly ahead of the earlier claim in this model. Equality alone is not a crossover.`;
 const idx=(p.checkpoint-p.referenceAge)*12;
 const points=[r.a[idx],r.b[idx]];
 $('cs-check-label').textContent=`At age ${p.checkpoint} · ${p.display==='real'?'reference-age purchasing power':'nominal dollars at each receipt / checkpoint'}`;
 $('cs-option-a').textContent=`A · ${age(p.a)}`;$('cs-option-b').textContent=`B · ${age(p.b)}`;
 $('cs-totals').innerHTML=cellRow('Gross benefits received',points,'shownGross')+cellRow('Spent from benefits',points,'shownSpent')+cellRow('Retained cash, 0% return',points,'shownCash')+cellRow('Retained invested balance',points,'shownBalance');
 $('cs-portfolio-note').textContent=`${p.retain}% of each check is retained; ${100-p.retain}% is spent. Cash assumes 0% interest. Investment assumes a constant ${p.returns}% nominal annual return. These are alternative balances, not amounts to add together.`;
 $('cs-dollar-note').textContent=p.display==='real'?`All amounts are divided by the common COLA index at the checkpoint. Nominal return ${p.returns}% corresponds to about ${((1+p.returns/100)/(1+p.cola/100)*100-100).toFixed(2)}% annual return after assumed inflation. Historical spending is expressed in checkpoint purchasing power.`:'Gross checks and spent amounts are historical nominal sums. Retained balances are checkpoint nominal values. Neither is a household net-worth forecast.';
 draw(r,p);
 }catch(e){result=null;$('cs-error').textContent=e.message;$('cs-results').hidden=true;}
}
$('cs-form').addEventListener('input',render);$('cs-form').addEventListener('change',render);$('cs-chart-mode').addEventListener('change',()=>{if(result)draw(result,read());});
$('cs-reset').addEventListener('click',()=>{$('cs-form').reset();render();});
function initialize(){const tool=$('cs-tool');if(tool.hasAttribute('data-subscriber-protected'))return;tool.hidden=false;$('cs-landing-action').hidden=true;render();}
document.addEventListener('subscriber-access-unlocked',initialize);
// Also handle a valid token returned before this script was evaluated.
initialize();
})();
