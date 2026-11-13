/* Aspecto de la portada. No propagar preferencias a las aplicaciones integradas. */
(function(){
  'use strict';
  const KEY='scholaclassica-aspecto-v1';
  const allowed=new Set(['system','light','dark','oled']);
  const media=window.matchMedia?.('(prefers-color-scheme: dark)');
  let choice='system';
  try{
    const stored=window.localStorage.getItem(KEY);
    if(allowed.has(stored))choice=stored;
  }catch{/* Sin almacenamiento: mantener el aspecto automático. */}
  const resolved=mode=>mode==='system'?(media?.matches?'dark':'light'):mode;
  const background={light:'#14283f',dark:'#0a1927',oled:'#000000'};
  function apply(){
    const theme=resolved(choice);
    const root=document.documentElement;
    root.dataset.theme=theme;
    root.dataset.themeChoice=choice;
    root.style.colorScheme=theme==='light'?'light':'dark';
    const meta=document.querySelector('meta[name="theme-color"]');
    if(meta)meta.setAttribute('content',background[theme]);
    const picker=document.getElementById('portal-theme');
    if(picker&&picker.value!==choice)picker.value=choice;
  }
  window.ScholaPortalTheme={
    get:()=>choice,
    set(value){
      if(!allowed.has(value))return;
      choice=value;
      try{window.localStorage.setItem(KEY,choice)}catch{}
      apply();
    }
  };
  media?.addEventListener?.('change',()=>{
    if(choice==='system')apply();
  });
  document.addEventListener('DOMContentLoaded',()=>{
    const picker=document.getElementById('portal-theme');
    if(picker){
      picker.value=choice;
      picker.addEventListener('change',()=>window.ScholaPortalTheme.set(picker.value));
    }
    apply();
  });
  apply();
})();
