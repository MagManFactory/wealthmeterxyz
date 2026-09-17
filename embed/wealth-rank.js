(function(){
  "use strict";
  const script=document.currentScript;
  const target=document.createElement("iframe");
  const token=script.dataset.token||"";
  const preview=script.dataset.preview==="phase2"?"&preview=phase2":"";
  target.src=`https://wealthmeter.xyz/embed/wealth-rank.html?token=${encodeURIComponent(token)}${preview}`;
  target.title="WealthMeter global wealth rank calculator";
  target.loading="lazy";
  target.referrerPolicy="strict-origin-when-cross-origin";
  target.sandbox="allow-scripts allow-forms allow-popups";
  target.style.cssText="display:block;width:100%;max-width:780px;height:590px;border:0;margin:0 auto;";
  script.parentNode.insertBefore(target,script.nextSibling);
})();
