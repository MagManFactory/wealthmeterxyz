// Native dialogs provide focus containment, Escape dismissal and focus return.
document.querySelectorAll('[data-open]').forEach(button=>button.addEventListener('click',()=>{
  const dialog=document.getElementById(button.dataset.open);
  if(!dialog)return;
  dialog.showModal();
  document.body.style.overflow='hidden';
  if(dialog.id==='calculator-modal' && typeof sendTheme==='function')sendTheme();
}));
document.querySelectorAll('dialog').forEach(dialog=>{
  dialog.querySelector('[data-close]')?.addEventListener('click',()=>dialog.close());
  dialog.addEventListener('close',()=>{document.body.style.overflow='';});
  dialog.addEventListener('click',event=>{if(event.target===dialog){const box=dialog.getBoundingClientRect();if(event.clientX<box.left||event.clientX>box.right||event.clientY<box.top||event.clientY>box.bottom)dialog.close();}});
});
