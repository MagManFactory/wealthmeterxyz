(()=>{'use strict';
const $=id=>document.getElementById(id),view=window.ClaimSmartView;
const money=n=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0}).format(n);
const age=m=>m%12?`${Math.floor(m/12)} years, ${m%12} ${m%12===1?'month':'months'}`:`${m/12}`;
let result=null;
function read(){const n=id=>$(id).value.trim()===''?NaN:Number($(id).value);return {cohort:view.birthCohort(n('cs-cohort'),$('cs-january-first').checked),referenceAge:n('cs-reference'),a:n('cs-ay')*12+n('cs-am'),b:n('cs-by')*12+n('cs-bm'),pia:n('cs-pia'),benefitA:n('cs-ben-a'),benefitB:n('cs-ben-b'),manual:$('cs-manual').checked,basis:$('cs-manual').checked?$('cs-basis').value:'common',display:$('cs-display').value,cola:n('cs-cola'),returns:n('cs-return-exact'),retain:n('cs-retain'),checkpoint:n('cs-checkpoint')};}
function row(label,a,b){return `<tr><th scope="row">${label}</th><td>${money(a)}</td><td>${money(b)}</td></tr>`;}
function draw(r,p){
 const start=744,end=Math.max(1140,p.checkpoint*12),visible=s=>s.filter(v=>v.month>=start&&v.month<=end),sa=visible(r.a),sb=visible(r.b),max=Math.max(1,...sa.map(x=>x.shownBalance),...sb.map(x=>x.shownBalance));
 const X=m=>70+(m-start)/(end-start)*620,Y=v=>250-v/max*215;
 const path=s=>s.map((v,i)=>`${i?'L':'M'}${X(v.month).toFixed(2)},${Y(v.shownBalance).toFixed(2)}`).join(' ');
 let grid='';for(let i=0;i<=4;i++){const v=max*i/4,y=Y(v);grid+=`<line x1="70" y1="${y}" x2="690" y2="${y}" stroke="var(--cs-line)"/><text x="60" y="${y+4}" text-anchor="end">$${Math.round(v/1000)}k</text>`;}
 for(let y=65;y<=end/12;y+=5)grid+=`<text x="${X(y*12)}" y="275" text-anchor="middle">${y}</text>`;
 grid+=`<line x1="${X(p.checkpoint*12)}" y1="30" x2="${X(p.checkpoint*12)}" y2="250" stroke="var(--cs-muted)" stroke-dasharray="2 5"/><text x="${X(p.checkpoint*12)}" y="20" text-anchor="middle">Age ${p.checkpoint}</text>`;
 $('cs-chart').innerHTML=`<title>Investment balances: start at ${age(p.a)} versus ${age(p.b)}</title><desc>Both invest ${p.retain}% of each benefit payment at ${p.returns}% annual return. Yearly values are available in the following table.</desc><g fill="var(--cs-muted)" font-size="14" font-family="system-ui">${grid}<text x="375" y="302" text-anchor="middle">Age</text></g><path d="${path(sa)}" fill="none" stroke="var(--cs-a)" stroke-width="3.5"/><path d="${path(sb)}" fill="none" stroke="var(--cs-b)" stroke-width="3.5" stroke-dasharray="9 4"/>`;
 $('cs-yearly').innerHTML=Array.from({length:end/12-62+1},(_,i)=>{const y=62+i,index=(y-p.referenceAge)*12;return row(y,r.a[index].shownBalance,r.b[index].shownBalance);}).join('');
}
function breakdown(v){return `<div><span>Money you put in</span><b>${money(v.contributed)}</b></div><div><span>${v.growth<0?'Investment loss':'Investment growth'}</span><b>${v.growth<0?'−':'+'}${money(Math.abs(v.growth))}</b></div><p>Balance = money put in ${v.growth<0?'minus losses':'plus growth'}. It does not include money spent.</p>`;}
function render(){
 let p;
 try{p=read();}catch(e){result=null;$('cs-error').textContent=e.message;$('cs-results').hidden=true;$('cs-fra').textContent='Enter your birth year to see your full retirement age.';$('cs-pia-label').textContent='Your estimated monthly benefit at full retirement age ($)';$('cs-ssa-age').textContent='—';$('cs-monthly-a').textContent='—';$('cs-monthly-b').textContent='—';return;}
 const full=window.ClaimSmart.fra(p.cohort),fullLabel=view.fullAgeLabel(full);
 $('cs-fra').textContent=`Your full retirement age: ${fullLabel}`;
 $('cs-pia-label').textContent=`Your estimated monthly benefit at age ${fullLabel} ($)`;
 $('cs-ssa-age').textContent=fullLabel;
 $('cs-birth-note').textContent=$('cs-january-first').checked?`SSA uses ${p.cohort} birth-year rules for your January 1 birthday.`:'Your birth year sets this age. For birthdays other than January 1, 1960 and all later years give the same full retirement age: 67.';
 $('cs-custom').hidden=!p.manual;$('cs-pia').disabled=p.manual;
 $('cs-retain').setAttribute('aria-valuetext',`${p.retain}% of each monthly check`);$('cs-return').setAttribute('aria-valuetext',`${p.returns}% per year`);
 $('cs-retain-value').textContent=`${p.retain}%`;$('cs-return-value').textContent=Number.isFinite(p.returns)?`${p.returns}%`:'—';
 document.querySelectorAll('[data-return]').forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.return)===p.returns)));
 document.querySelectorAll('[data-horizon]').forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.horizon)===p.checkpoint)));
 try{
 result=view.summarize(p);$('cs-error').textContent='';$('cs-results').hidden=false;
 const s=result,r=s.r,la=`Start at ${age(p.a)}`,lb=`Start at ${age(p.b)}`;

 $('cs-check-a-label').textContent=`Option A · at ${age(p.a)}`;$('cs-check-b-label').textContent=`Option B · at ${age(p.b)}`;
 $('cs-monthly-a').textContent=`${money(s.a.payment)}/mo`;$('cs-monthly-b').textContent=`${money(s.b.payment)}/mo`;
 $('cs-invest-dollars').textContent=`That starts at ${money(s.a.payment*p.retain/100)}/month for A and ${money(s.b.payment*p.retain/100)}/month for B.`;
 $('cs-return-example').textContent=`At ${p.returns}%, $1,000 left invested for one year would become ${money(1000*(1+p.returns/100))}.`;
 $('cs-result-title').textContent=`Your investments at age ${p.checkpoint}`;
 $('cs-assumptions').textContent=`Invest ${p.retain}% of each check · ${p.returns}% assumed annual return · ${p.cola===0?'no inflation adjustment':`${p.cola}% annual benefit increase / inflation`}. Both options follow the same rules.`;
 $('cs-takeaway').textContent=p.retain===0?`You spend every check, so both investment balances stay at $0. Choose an amount to invest above to see its effect.`:Math.abs(s.difference)<.5?`At age ${p.checkpoint}, both options have the same investment balance in this example.`:`At age ${p.checkpoint}, starting at ${age(s.difference>0?p.a:p.b)} leaves ${money(Math.abs(s.difference))} more invested in this example.`;
 $('cs-option-a').textContent=`Option A · ${la}`;$('cs-option-b').textContent=`Option B · ${lb}`;
 $('cs-balance-a').textContent=money(s.a.balance);$('cs-balance-b').textContent=money(s.b.balance);
 $('cs-breakdown-a').innerHTML=breakdown(s.a);$('cs-breakdown-b').innerHTML=breakdown(s.b);
 const later=age(Math.max(p.a,p.b)),earlier=age(Math.min(p.a,p.b));
 $('cs-cross-copy').textContent=p.retain===0?'No investment catch-up age: nothing is invested.':p.a===p.b?(r.same?'Both options start at the same age with the same benefit, so they match.':'Both start at the same age. Their separate monthly estimates explain any difference; there is no waiting catch-up age.'):(s.portfolioCross===null?`No investment catch-up by age ${p.checkpoint} with these settings.`:`The investment balance from starting at ${later} first moves ahead of starting at ${earlier} at age ${age(s.portfolioCross)}.`)+' Your best claiming age also depends on other needs.';
 $('cs-legend-a').textContent=`━━ A · ${la}`;$('cs-legend-b').textContent=`┄┄ B · ${lb}`;
 $('cs-sensitivity-caption').textContent=`Investment balances at age ${p.checkpoint}. Only the annual return changes in this table.`;
 $('cs-sensitivity-a').textContent=`A · age ${age(p.a)}`;$('cs-sensitivity-b').textContent=`B · age ${age(p.b)}`;
 $('cs-sensitivity').innerHTML=s.sensitivity.map(x=>`<tr${x.returns===p.returns?' class="cs-selected-rate"':''}><th scope="row">${x.returns}%${x.returns===p.returns?' ← selected':''}</th><td>${money(x.a)}</td><td>${money(x.b)}</td></tr>`).join('');
 $('cs-checkpoints').innerHTML=s.checkpoints.map(x=>row(x.age,x.a,x.b)).join('');
 $('cs-detail-caption').textContent=`Through age ${p.checkpoint}; initial monthly check shown separately.`;
 $('cs-totals').innerHTML=row('Starting monthly check',s.a.payment,s.b.payment)+row('Total benefits received',s.a.received,s.b.received)+row('Money spent from those checks',s.a.spent,s.b.spent)+row('Money put into investments',s.a.contributed,s.b.contributed)+row('Investment growth / loss',s.a.growth,s.b.growth)+row('Investment balance',s.a.balance,s.b.balance);
 $('cs-cash-cross').textContent=p.a===p.b?'Same starting age: no waiting break-even.':s.cashCross===null?`The later start does not catch up in total benefits received by age ${p.checkpoint}.`:`Ignoring investment growth, total benefits received from the later start first move ahead at age ${age(s.cashCross)}.`;
 $('cs-dollar-note').textContent=p.display==='real'?`Investment totals use purchasing power at reference age ${p.referenceAge}. Money put in and investment growth use that same basis. Starting monthly checks use dollars at the first receipt.`:p.cola===0?'With 0% inflation, all dollars use the same purchasing-power assumption. At 0% investment return, the balance is exactly the money you put in.':'Balances are future-dollar amounts at each comparison age; total benefits and spending are sums of dollars received over time. They are not a forecast of your net worth.';
 draw(r,p);
 }catch(e){result=null;const names={pia:'monthly full-benefit estimate ($)',referenceAge:'dollar reference age',benefitA:'Option A monthly benefit ($)',benefitB:'Option B monthly benefit ($)',returns:'annual investment return (%)',retain:'share invested (%)',cola:'annual inflation / benefit increase (%)',checkpoint:'comparison age'};let message=e.message;for(const [key,name] of Object.entries(names))message=message.replace(`Check ${key}:`,`Check your ${name}:`);$('cs-error').textContent=message;$('cs-results').hidden=true;}
}
$('cs-form').addEventListener('input',e=>{if(e.target.id==='cs-return')$('cs-return-exact').value=e.target.value;if(e.target.id==='cs-return-exact')$('cs-return').value=e.target.value;render();});
$('cs-form').addEventListener('change',render);
document.querySelectorAll('[data-return]').forEach(b=>b.addEventListener('click',()=>{$('cs-return').value=b.dataset.return;$('cs-return-exact').value=b.dataset.return;render();}));
document.querySelectorAll('[data-horizon]').forEach(b=>b.addEventListener('click',()=>{$('cs-checkpoint').value=b.dataset.horizon;render();}));
$('cs-reset').addEventListener('click',()=>{$('cs-form').reset();render();});
function initialize(){const tool=$('cs-tool');if(tool.hasAttribute('data-subscriber-protected'))return;tool.hidden=false;$('cs-landing-action').hidden=true;render();}
$('cs-cohort').max=String(new Date().getUTCFullYear());
document.addEventListener('subscriber-access-unlocked',initialize);initialize();
})();
