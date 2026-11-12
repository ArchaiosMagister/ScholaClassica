'use strict';
const tabs=[...document.querySelectorAll('[role="tab"]')];
const panels=new Map([['tab-lenguas','panel-lenguas'],['tab-herramientas','panel-herramientas']]);
function selectTab(active,focus=false){
  for(const tab of tabs){
    const selected=tab===active;
    tab.setAttribute('aria-selected',String(selected));
    tab.tabIndex=selected?0:-1;
    document.getElementById(panels.get(tab.id)).hidden=!selected;
  }
  if(focus)active.focus();
}
for(const [index,tab] of tabs.entries()){
  tab.addEventListener('click',()=>selectTab(tab));
  tab.addEventListener('keydown',event=>{
    if(!['ArrowRight','ArrowLeft','Home','End'].includes(event.key))return;
    event.preventDefault();
    const position=event.key==='Home'?0:event.key==='End'?tabs.length-1:
      (index+(event.key==='ArrowRight'?1:-1)+tabs.length)%tabs.length;
    selectTab(tabs[position],true);
  });
}
