// Calculator links leave the embedded surface and return to the shared Phoenix shell.
document.addEventListener('click',event=>{
 const anchor=event.target.closest('a[href]');
 if(!anchor)return;
 const destination=new URL(anchor.getAttribute('href'),document.baseURI);
 if(destination.origin===location.origin && destination.pathname!==location.pathname)anchor.target='_top';
});
