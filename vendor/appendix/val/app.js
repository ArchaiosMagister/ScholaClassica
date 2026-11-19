(()=>{'use strict';
const params=new URLSearchParams(location.search),page=location.pathname.split('/').pop()||'index.html';
const safeStorage={get(){try{return JSON.parse(localStorage.getItem('appendix-selection')||'null')}catch{return null}},set(value){try{localStorage.setItem('appendix-selection',JSON.stringify(value))}catch{}}};
const saved=safeStorage.get()||{};
let selection={language:['latin','griego'].includes(params.get('lengua'))?params.get('lengua'):(page.startsWith('griego')?'griego':saved.language||'latin'),year:params.get('curso')==='2'?'2':params.get('curso')==='1'?'1':saved.year||'1',unit:1};
const maxUnits=language=>language==='griego'?14:10;
selection.unit=Math.max(1,Math.min(maxUnits(selection.language),parseInt(params.get('unidad')||saved.unit||'1',10)||1));
const valencianPages=new Set(["griego-adjetivos.html","griego-anexos.html","griego-aoristos.html","griego-atematicos.html","griego-aumento.html","griego-casos.html","griego-comparacion.html","griego-contracciones.html","griego-contractos.html","griego-correspondencias.html","griego-eimi.html","griego-imperativo.html","griego-indicativo.html","griego-infinitivo.html","griego-morfologia.html","griego-optativo.html","griego-participios.html","griego-pronombres.html","griego-resumen-verbal.html","griego-sintaxis.html","griego-subjuntivo.html","griego-subordinadas.html","griego-sustantivos.html","griego-verbo.html","griego.html","infinitivo.html","conjunciones.html","comparacion.html","pronombres.html","casos.html","sustantivos.html","adjetivos.html","participios.html","subordinadas.html","verbos-irregulares.html","paradigmas-verbales.html","subjuntivo.html","indicativo.html","preposiciones.html"]);
const norm=s=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/æ/g,'ae').toLowerCase().replace(/ς/g,'σ').replace(/\s+/g,' ');
const courseURL=(language,year,unit=1)=>`curso.html?lengua=${language}&curso=${year}${year==='1'?`&unidad=${unit}`:''}`;
let curriculum,visibleSearch=[],requestId=0;
async function loadJSON(url){const r=await fetch(url,{cache:'no-cache'});if(!r.ok)throw Error('No s’ha pogut carregar');return r.json();}
function updateSelectors(){for(const form of document.querySelectorAll('.course-selector')){form.elements.lengua.value=selection.language;form.elements.curso.value=selection.year;}

 const nav=document.querySelector('header nav');
 if(nav){
  const links=[['Inici','index.html'],['Morfologia llatina','morfologia.html'],['Sintaxi llatina','sintaxis.html'],['Morfologia grega','griego-morfologia.html'],['Sintaxi grega','griego-sintaxis.html']];
  nav.replaceChildren();
  for(const [label,url] of links){const a=document.createElement('a');a.href=url;a.textContent=label;if(page===url)a.setAttribute('aria-current','page');nav.append(a);}
 }
}
function updateURL(){history.replaceState(null,'',courseURL(selection.language,selection.year,selection.unit));safeStorage.set(selection);}
const chapterCache=new Map();
async function getChapter(page){
 if(!chapterCache.has(page))chapterCache.set(page,fetch('../'+page).then(r=>{if(!r.ok)throw Error('No se pudo cargar '+page);return r.text();}).then(html=>new DOMParser().parseFromString(html,'text/html')).catch(e=>{chapterCache.delete(page);throw e;}));
 return chapterCache.get(page);
}
function sectionHTML(doc,id){
 const heading=doc.getElementById(id);if(!heading)throw Error('No existe el apartado '+id);
 let out='',node=heading.nextElementSibling;
 while(node&&!(node.matches('h2')||node.matches('section')&&node.querySelector(':scope > h2'))){out+=node.outerHTML;node=node.nextElementSibling;}
 return out;
}
async function resolveLatinTopic(topic){
 if(!topic.source)return topic.html;
 const {page,section,mode}=topic.source,doc=await getChapter(page);
 if(mode==='adjectives'){
  const article=doc.querySelector('.article article');
  const tables=[...article.querySelectorAll('.table-wrap')].filter(x=>/brevis|acer|audax|vetus/.test(x.querySelector('caption')?.textContent||''));
  const explanatory=[...article.children].filter(x=>x.matches('p')&&(/Adjetivos de tres terminaciones tipo|Adjetivos de dos terminaciones tipo|Adjetivos de una terminación tipo|ablativo singular/.test(x.textContent)));
  return explanatory.map(x=>x.outerHTML).join('')+tables.map(x=>x.outerHTML).join('');
 }
 if(mode==='perfect-tenses'){
  const parts=['perfecto-de-indicativo','pluscuamperfecto-de-indicativo'].map(id=>{
   const heading=doc.getElementById(id);if(!heading)throw Error('Falta '+id);
   let node=heading.nextElementSibling,explanation='';
   while(node&&!node.matches('h2')){if(node.matches('p'))explanation+=node.outerHTML;node=node.nextElementSibling;}
   const section=heading.parentElement.querySelector('.time-paradigms');
   // The sections are siblings of the time headings: find the section belonging to this heading.
   let walk=heading.nextElementSibling,paradigm=null;
   while(walk&&!walk.matches('h2')){if(walk.matches('.time-paradigms')){paradigm=walk;break;}walk=walk.nextElementSibling;}
   const active=paradigm?.querySelector('.table-wrap.verb-table');
   const sum=paradigm?.querySelectorAll('.table-wrap.verb-table')[2];
   return '<h3>'+heading.textContent+'</h3>'+explanation+(active?active.outerHTML:'')+(sum?'<h4>Verbo <i lang="la">sum, fui</i> – (irr.)</h4>'+sum.outerHTML.replace(/sum, esse, fui/g,'sum, fui – (irr.)'):'');
  });
  const introduction='<p><strong>Enunciado:</strong> <i lang="la">duco, duxi, ductum</i> (3.ª conjugación). <i lang="la">duco</i> proporciona el tema de presente <i lang="la">duc-</i>; <i lang="la">duxi</i>, el tema de perfecto <i lang="la">dux-</i> (al quitar <i lang="la">-i</i>); <i lang="la">ductum</i>, el tema de supino <i lang="la">duct-</i>. El tema de presente sirve para el presente, el pretérito imperfecto y el futuro imperfecto; el tema de perfecto sirve para perfecto, pluscuamperfecto y futuro perfecto activos; el de supino, para el participio de perfecto pasivo.</p><p><strong>Perfecto:</strong> <i lang="la">-i, -isti, -it, -imus, -istis, -erunt</i>. <strong>Pluscuamperfecto:</strong> <i lang="la">-eram, -eras, -erat, -eramus, -eratis, -erant</i>.</p>';
  return introduction+parts.join('');
 }
 return sectionHTML(doc,section);
}
async function resolveUnitParadigms(html){
 const fragment=new DOMParser().parseFromString('<main>'+html+'</main>','text/html');
 const main=fragment.querySelector('main'),regular=await getChapter('paradigmas-verbales.html'),irregular=await getChapter('verbos-irregulares.html');
 const sumTable=irregular.querySelector('[aria-label="sum · indicativo"] table');
 if(!sumTable)throw Error('Falta paradigma de sum');
 const names=['Presente','Imperfecto','Futuro imperfecto','Perfecto','Pluscuamperfecto','Futuro perfecto'];
 const header=[...sumTable.querySelectorAll('thead th')].map(x=>x.textContent.trim());
 const body=[...sumTable.querySelectorAll('tbody tr')];
 const headings=[...main.querySelectorAll('h3')];
 for(const heading of headings){
  const label=heading.textContent.trim(),wrap=heading.nextElementSibling;
  if(!wrap?.matches('.table-wrap'))continue;
  const fresh=[...regular.querySelectorAll('.table-wrap.verb-table')].find(x=>x.getAttribute('aria-label')===label);
  if(fresh)wrap.replaceWith(fresh.cloneNode(true));
  const time=names.find(n=>label.toLowerCase().startsWith(n.toLowerCase()+' de indicativo'));
  const index=header.findIndex(h=>h.toLowerCase()===time?.toLowerCase());
  if(index<1)continue;
  const container=fragment.createElement('div');container.className='table-wrap verb-table';container.setAttribute('role','region');container.setAttribute('tabindex','0');
  const table=fragment.createElement('table');const caption=fragment.createElement('caption');caption.textContent='sum · '+time+' de indicativo';table.append(caption);
  const thead=fragment.createElement('thead');thead.innerHTML='<tr><th scope="col">Persona</th><th scope="col"><i lang="la">sum, fui</i> – (irr.)</th></tr>';table.append(thead);
  const tbody=fragment.createElement('tbody');
  for(const row of body){const tr=fragment.createElement('tr'),th=row.querySelector('th')?.cloneNode(true),cell=row.querySelectorAll('td')[index-1]?.cloneNode(true);if(th&&cell){tr.append(th,cell);tbody.append(tr);}}
  table.append(tbody);container.append(table);
  const title=fragment.createElement('h4');title.textContent='Verbo sum, fui – (irr.) · '+time;
  const after=heading.nextElementSibling;after.after(title,container);
 }
 return main.innerHTML;
}
function stripHTML(html){const d=document.createElement('div');d.innerHTML=html;return d.textContent||'';}
function addLink(parent,title,url,description){const a=document.createElement('a');a.href=url;a.className='path';const h=document.createElement('h3');h.textContent=title;const p=document.createElement('p');p.textContent=description;a.append(h,p);parent.append(a);}

async function renderCourse(){
 document.documentElement.dataset.language=selection.language;
 const ticket=++requestId,content=document.querySelector('#course-content');if(!content)return;
 const languageName=selection.language==='latin'?'Llatí':'Grec';document.title=`${languageName} ${selection.year==='1'?'I':'II'} · Appendix grammaticæ`;
 document.querySelector('#course-title').textContent=`${languageName} ${selection.year==='1'?'I':'II'}`;updateSelectors();
 const unitsPanel=document.querySelector('#units-panel'),description=document.querySelector('#course-description');content.replaceChildren();visibleSearch=[];
 if(selection.year==='2'){
  unitsPanel.hidden=true;description.textContent='Gramàtica completa: morfologia, sintaxi i temes compartits.';
  const links=document.createElement('div');links.className='two';
  addLink(links,'Morfologia',selection.language==='latin'?'morfologia.html':'griego-morfologia.html','Consulta totes les formes i els paradigmes.');
  addLink(links,'Sintaxi',selection.language==='latin'?'sintaxis.html':'griego-sintaxis.html','Consulta tots els usos i les construccions.');content.append(links);
  if(selection.language==='latin'){const p=document.createElement('p');for(const [label,url] of [['Paradigmes verbals regulars','../paradigmas-verbales.html'],['Verbs irregulars més freqüents','../verbos-irregulares.html']]){const a=document.createElement('a');a.href=url;a.textContent=label+' →';a.style.display='block';p.append(a);}content.append(p);}
  if(selection.language==='griego'){const p=document.createElement('p'),a=document.createElement('a');a.href='griego-anexos.html';a.textContent='Consultar els annexos grecs →';p.append(a);content.append(p);}return;
 }
 unitsPanel.hidden=false;description.textContent=`Continguts acumulats fins a la unitat ${selection.unit}.`;
 const buttons=document.querySelector('#unit-buttons');buttons.replaceChildren();
 for(let u=1;u<=maxUnits(selection.language);u++){
  const button=document.createElement('button');button.type='button';button.textContent=`Unitat ${u}`;button.setAttribute('aria-pressed',String(u===selection.unit));button.dataset.unit=u;
  button.addEventListener('click',()=>{selection.unit=u;updateURL();renderCourse();});buttons.append(button);
 }
 try{curriculum??=await loadJSON('curriculum.json?v=20261110-final1');if(ticket!==requestId)return;
  for(const unit of curriculum[selection.language].units.filter(u=>u.number<=selection.unit)){
   const section=document.createElement('section');section.className='unit-section';const h2=document.createElement('h2');h2.textContent=`Unitat ${unit.number}`;h2.id=`unidad-${unit.number}`;section.append(h2);
   for(let j=0;j<unit.topics.length;j++){
    const topic=unit.topics[j],details=document.createElement('details');details.className='lesson';details.id=`u${unit.number}-tema${j+1}`;
    // Current unit is open; previous material remains available in concise accordions.
    details.open=unit.number===selection.unit;
    const summary=document.createElement('summary'),label=document.createElement('span');label.className='eyebrow';label.textContent=topic.group;const title=document.createElement('span');title.className='lesson-title';title.textContent=topic.title;summary.append(label,title);
    const body=document.createElement('div');body.className=`lesson-body ${selection.language==='griego'?'greek-content':''}`;body.innerHTML=topic.html;for(const a of body.querySelectorAll('a[href]')){const href=a.getAttribute('href');if(href&&!/^(?:#|https?:|mailto:|\/)/.test(href)&&!href.startsWith('../')&&!href.startsWith('val/')){const page=href.split('#')[0].split('?')[0];if(!valencianPages.has(page))a.setAttribute('href','../'+href);}}if(ticket!==requestId)return;details.append(summary,body);section.append(details);
    visibleSearch.push({title:topic.title,language:selection.language,text:stripHTML(body.innerHTML),url:`#${details.id}`,unit:unit.number});
   }content.append(section);
  }
  const note=document.createElement('p');note.className='course-note';note.textContent=`Es mostren les unitats 1–${selection.unit} de ${maxUnits(selection.language)}. Les unitats posteriors encara no apareixen.`;content.append(note);
  if(location.hash){const target=document.getElementById(location.hash.slice(1));if(target){if(target.tagName==='DETAILS')target.open=true;target.scrollIntoView();}}
 }catch{content.innerHTML='<p>No s’han pogut carregar les unitats. Comprova la connexió i torna-ho a intentar.</p>';}
}
for(const form of document.querySelectorAll('.course-selector'))form.addEventListener('submit',e=>{
 e.preventDefault();const language=form.elements.lengua.value,year=form.elements.curso.value;
 selection={language,year,unit:language===selection.language?selection.unit:1};safeStorage.set(selection);
 if(page==='curso.html'){updateURL();renderCourse();}else location.href=courseURL(language,year,selection.unit);
});
updateSelectors();
if(page==='curso.html')renderCourse();
else if(page!=='index.html'){
 // Complete chapters are explicitly second-year views, regardless of a previously saved first-year selection.
 selection.year='2';selection.language=page.startsWith('griego')?'griego':'latin';updateSelectors();
 const notice=document.createElement('p');notice.className='complete-notice';notice.textContent='2n · Gramàtica completa';const control=document.querySelector('.course-switch');if(control)control.append(notice);
}
const input=document.querySelector('#search'),results=document.querySelector('#results');let searchIndex;
async function search(){
 const q=norm(input.value.trim()),ticket=++searchTicket;results.replaceChildren();results.hidden=!q;if(!q)return;
 try{
  const limited=page==='curso.html'&&selection.year==='1';const data=limited?visibleSearch:(searchIndex??=await loadJSON('search-data.json?v=20261110-final1'));
  if(ticket!==searchTicket)return;const words=q.split(/\s+/),scope=page==='curso.html'?data.filter(p=>p.language===selection.language):data;
  const hits=scope.filter(p=>norm(p.title+' '+p.text).includes(q)).sort((a,b)=>Number(norm(b.title).includes(q))-Number(norm(a.title).includes(q)));
  const message=document.createElement('p');message.textContent=hits.length?`${hits.length} temes trobats${limited?' en les unitats seleccionades':''}`:'No hi ha resultats en este recorregut.';results.append(message);
  for(const hit of hits){const a=document.createElement('a');a.href=hit.url;a.textContent=hit.title;const small=document.createElement('small');small.textContent=`${hit.language==='griego'?'Grec':'Llatí'}${hit.unit?` · Unitat ${hit.unit}`:''}`;a.append(small);
   if(hit.url.startsWith('#'))a.addEventListener('click',()=>{const d=document.getElementById(hit.url.slice(1));if(d)d.open=true;results.hidden=true;});results.append(a);}
 }catch{results.textContent='No s’ha pogut carregar el buscador. Pots consultar els índexs.';}
}
let searchTicket=0;
if(input&&results){input.addEventListener('input',search);input.addEventListener('keydown',e=>{if(e.key==='Escape'){results.hidden=true;input.value='';searchTicket++;}else if(e.key==='ArrowDown'){const a=results.querySelector('a');if(a){e.preventDefault();a.focus();}}});input.addEventListener('focus',()=>{if(input.value.trim())search();});document.addEventListener('click',e=>{if(!e.target.closest('.searchbar'))results.hidden=true;});}
document.addEventListener('change',event=>{if(event.target.matches('#participle-gender,[data-participle-gender]')){const gender=event.target.value;for(const form of document.querySelectorAll('.gender-form')){const value=form.getAttribute('data-'+gender);if(value)form.textContent=value;}}});
// Changing course/unit invalidates stale results from the previous selection.
document.addEventListener('click',e=>{if(e.target.closest('#unit-buttons')){if(results)results.hidden=true;if(input)input.value='';searchTicket++;}});
})();
