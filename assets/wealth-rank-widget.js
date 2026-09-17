(function(){
  "use strict";
  const ADULTS=3.846e9;
  const FX={USD:1,EUR:1.1539,GBP:1.34832905,CAD:.71840369,JPY:.00645141,INR:.01042098,AUD:.71254786,CNY:.14899799,CHF:1.22222222};
  const ANCHORS=[[1e4,2.226e9],[1e5,646e6],[1e6,58e6],[5e6,7.004e6],[3e7,713626],[1e9,3302],[5e10,37],[1e11,19]];
  const query=new URLSearchParams(location.search);
  const state={widget:"wealth-rank",token:query.get("token")||"",partner:"preview",campaign:"internal-review",authorized:false,interactionSent:false};
  const localPreview=/^(localhost|127\.0\.0\.1)$/.test(location.hostname)&&query.get("preview")==="phase2";
  const hostOrigin=(()=>{try{return document.referrer?new URL(document.referrer).origin:"";}catch(_error){return"";}})();
  const form=document.getElementById("wealth-widget-form");
  const status=document.getElementById("wealth-widget-status");

  function showStatus(message){status.textContent=message;status.classList.toggle("visible",Boolean(message));}
  function interpolateRank(value){
    for(let i=0;i<ANCHORS.length-1;i+=1){const [v1,n1]=ANCHORS[i],[v2,n2]=ANCHORS[i+1];if(value>=v1&&value<v2){const t=(Math.log(value)-Math.log(v1))/(Math.log(v2)-Math.log(v1));return Math.exp(Math.log(n1)+t*(Math.log(n2)-Math.log(n1)));}}
    const [v1,n1]=ANCHORS[ANCHORS.length-2],[v2,n2]=ANCHORS[ANCHORS.length-1];
    return Math.max(1,n2*Math.pow(value/v2,(Math.log(n2)-Math.log(n1))/(Math.log(v2)-Math.log(v1))));
  }
  function position(value){if(value<1e4)return{range:true,low:2226001,high:ADULTS};const rank=Math.max(1,Math.round(interpolateRank(value)));return{range:false,rank,percentile:(1-rank/ADULTS)*100,top:rank/ADULTS*100};}
  function event(name){
    const payload={event:name,widget:state.widget,partner:state.partner,campaign:state.campaign,token:state.token,hostOrigin};
    if(typeof window.gtag==="function")window.gtag("event",name,{widget_id:state.widget,distribution_partner:state.partner,distribution_campaign:state.campaign});
    fetch("/api/widget-event",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(payload),credentials:"omit",keepalive:true}).catch(()=>{});
  }
  async function authorize(){
    if(localPreview){state.authorized=true;return;}
    if(!state.token)throw new Error("This distribution link is missing its signed attribution token.");
    const response=await fetch(`/api/widget-config?widget=${encodeURIComponent(state.widget)}&token=${encodeURIComponent(state.token)}`,{credentials:"omit"});
    if(!response.ok)throw new Error("This widget distribution is not authorized.");
    const config=await response.json();if(!hostOrigin||!Array.isArray(config.allowedOrigins)||!config.allowedOrigins.includes(hostOrigin))throw new Error("This publisher domain is not approved for the widget.");state.authorized=true;state.partner=config.partner;state.campaign=config.campaign;
  }
  function qualifiedImpression(){let timer=null;const observer=new IntersectionObserver(entries=>{if(entries.some(entry=>entry.isIntersecting&&entry.intersectionRatio>=.5)){if(!timer)timer=setTimeout(()=>{event("widget_impression");observer.disconnect();},1000);}else{clearTimeout(timer);timer=null;}},{threshold:[0,.5,1]});observer.observe(document.querySelector(".meter-widget"));}
  form.addEventListener("submit",eventObject=>{eventObject.preventDefault();if(!state.authorized)return;const raw=Number(document.getElementById("wealth-widget-value").value);const currency=document.getElementById("wealth-widget-currency").value;if(!Number.isFinite(raw)||raw<0)return;const result=position(raw*(FX[currency]||1));const rank=document.getElementById("wealth-widget-rank"),summary=document.getElementById("wealth-widget-summary");if(result.range){rank.textContent="#2.226B–#3.846B";summary.textContent="UBS reports values below US$10,000 as a broad 0–42.1st percentile band.";}else{rank.textContent=`#${result.rank.toLocaleString()}`;summary.textContent=`Approximately the ${result.percentile.toFixed(2)}th percentile — the top ${result.top.toFixed(result.top<.001?4:2)}% of adults in the covered markets.`;}document.getElementById("wealth-widget-result").classList.add("visible");if(!state.interactionSent){event("widget_interaction");state.interactionSent=true;}});
  authorize().then(()=>{qualifiedImpression();event("widget_loaded");}).catch(error=>{form.querySelectorAll("input,select,button").forEach(node=>node.disabled=true);showStatus(error.message);});
})();
