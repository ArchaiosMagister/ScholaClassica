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


// Selector contextual aislado del código de cada aplicación original.
// Solo enlaza a rutas existentes; no crea contenidos ni modifica sus configuraciones.
const STUDY_CATALOG=Object.freeze({
  lat4:[
    {id:'vocabulario',label:'Vocabulario · Latín de 4.º de ESO',href:'apps/vocabulario/index.html?subject=lat4'}
  ],
  lat1:[
    {id:'gramatica',label:'Gramática · Latín I',href:'apps/gramatica/curso.html?lengua=latin&curso=1&unidad=1'},
    {id:'vocabulario',label:'Vocabulario · Latín I',href:'apps/vocabulario/index.html?subject=lat1'},
    {id:'evolutio',label:'Evolución fonética',href:'apps/evolucion-fonetica/index.html'}
  ],
  lat2:[
    {id:'gramatica',label:'Gramática · Latín II',href:'apps/gramatica/curso.html?lengua=latin&curso=2'},
    {id:'vocabulario',label:'Vocabulario · Latín II',href:'apps/vocabulario/index.html?subject=lat2'}
  ],
  gr1:[
    {id:'gramatica',label:'Gramática · Griego I',href:'apps/gramatica/curso.html?lengua=griego&curso=1&unidad=1'},
    {id:'vocabulario',label:'Vocabulario · Griego I (ático)',href:'apps/vocabulario/index.html?subject=gr1'},
    {id:'etymologicon',label:'Etymologicon · Griego I',href:'apps/etymologicon/index.html'}
  ],
  gr2:[
    {id:'gramatica',label:'Gramática · Griego II',href:'apps/gramatica/curso.html?lengua=griego&curso=2'}
  ]
});
const PATH_STORAGE_KEY='scholaclassica-itinerario-v1';
const subjectChoice=document.getElementById('study-course');
const pathResults=document.getElementById('study-path-results');
const resumeArea=document.getElementById('study-resume-area');
const resumeLink=document.getElementById('study-resume');
function readStudyState(){
  try{
    const item=JSON.parse(localStorage.getItem(PATH_STORAGE_KEY)||'{}');
    if(!item||typeof item!=='object'||Array.isArray(item))return {course:'',last:{}};
    const course=Object.hasOwn(STUDY_CATALOG,item.course)?item.course:'';
    const last={};
    for(const key of Object.keys(STUDY_CATALOG)){
      const id=item.last?.[key];
      if(STUDY_CATALOG[key].some(entry=>entry.id===id))last[key]=id;
    }
    return {course,last};
  }catch{return {course:'',last:{}}}
}
const studyState=readStudyState();
function storeStudyState(){
  try{localStorage.setItem(PATH_STORAGE_KEY,JSON.stringify(studyState))}
  catch{/* Navegadores en modo privado: el selector sigue funcionando sin almacenamiento. */}
}
function rememberStudyAccess(course,id){
  if(!STUDY_CATALOG[course]?.some(item=>item.id===id))return;
  studyState.course=course;
  studyState.last[course]=id;
  storeStudyState();
}
function renderStudyPath(){
  const course=subjectChoice.value;
  studyState.course=course;
  storeStudyState();
  pathResults.replaceChildren();
  resumeArea.hidden=true;
  if(!Object.hasOwn(STUDY_CATALOG,course)){
    const text=document.createElement('p');
    text.className='path-empty';
    text.textContent='Selecciona primero una asignatura.';
    pathResults.append(text);
    return;
  }
  const list=document.createElement('nav');
  list.className='path-links';
  list.setAttribute('aria-label','Herramientas disponibles para '+subjectChoice.selectedOptions[0].textContent);
  for(const item of STUDY_CATALOG[course]){
    const link=document.createElement('a');
    link.href=item.href;
    link.textContent=item.label;
    link.dataset.studyTool=item.id;
    link.addEventListener('click',()=>rememberStudyAccess(course,item.id));
    list.append(link);
  }
  pathResults.append(list);
  const previous=STUDY_CATALOG[course].find(item=>item.id===studyState.last[course]);
  if(previous){
    resumeLink.href=previous.href;
    resumeLink.textContent='Continuar en '+previous.label;
    resumeLink.onclick=()=>rememberStudyAccess(course,previous.id);
    resumeArea.hidden=false;
  }
}
if(subjectChoice&&pathResults&&resumeArea&&resumeLink){
  subjectChoice.value=studyState.course;
  subjectChoice.addEventListener('change',renderStudyPath);
  renderStudyPath();
}
