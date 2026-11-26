/** Consulta de léxico castellano. No corrige ejercicios ni lee/escribe progreso. */
const $=id=>document.getElementById(id);
const ui={search:$('study-search'),unit:$('study-unit'),sort:$('study-sort'),
  theme:$('study-theme'),expand:$('study-expand'),collapse:$('study-collapse'),
  count:$('study-count'),loading:$('study-loading'),error:$('study-error'),
  container:$('study-entries'),empty:$('study-empty')};
const themeKey='scholaclassica-etymologicon-theme-v1';
const themes=new Set(['auto','light','dark','oled']);
let data=null,openGroups=new Set(),forceOpen=false,focusedEtymon=null;
const normalize=value=>String(value??'').normalize('NFD').toLocaleLowerCase('es')
  .replace(/\p{M}/gu,'').replace(/ς/g,'σ').replace(/\s+/gu,' ').trim();
function element(type,text,cls){
  const node=document.createElement(type);
  if(text!==undefined&&text!==null)node.textContent=String(text);
  if(cls)node.className=cls;
  return node;
}
function setTheme(theme){
  const value=themes.has(theme)?theme:'auto';
  ui.theme.value=value;
  if(value==='auto')document.documentElement.removeAttribute('data-theme');
  else document.documentElement.dataset.theme=value;
}
try{setTheme(localStorage.getItem(themeKey)||'auto');}catch{setTheme('auto');}
ui.theme.addEventListener('change',()=>{
  setTheme(ui.theme.value);
  try{localStorage.setItem(themeKey,ui.theme.value);}catch{/* Modo privado */ }
});
function navigateToComponent(part,feedback){
  const etymon=part.id&&data?.etymons.find(entry=>entry.id===part.id);
  if(!etymon||!etymon.wordIds?.length){
    feedback.textContent=etymon
      ?'«'+part.greek+'» figura en el glosario, pero no tiene derivados disponibles.'
      :'«'+part.greek+'» no tiene ficha de étimo disponible en Etymologicon.';
    feedback.hidden=false;
    return;
  }
  // El destino puede estar fuera de los filtros actuales.
  ui.search.value='';
  ui.unit.value='all';
  forceOpen=false;
  openGroups.clear();
  focusedEtymon=etymon.id;
  render();
  const group=[...ui.container.querySelectorAll('details[data-etymon-id]')]
    .find(entry=>entry.dataset.etymonId===etymon.id);
  if(group){
    group.open=true;
    group.querySelector('summary')?.focus({preventScroll:true});
    group.scrollIntoView({block:'start',behavior:'smooth'});
  }
}
function appendComponentList(target,parts){
  const line=element('div',null,'lexical-components');
  line.setAttribute('aria-label','Componentes etimológicos');
  const feedback=element('p',null,'lexical-component-feedback');
  feedback.hidden=true;
  feedback.setAttribute('role','status');
  parts.forEach((part,index)=>{
    if(index)line.append(element('span','+','component-plus'));
    const item=element('span',null,'lexical-component'+(part.external?' lexical-component--external':''));
    // Los formantes de otras lenguas no enlazan al inventario griego.
    const isGreek=(part.language===undefined||part.language==='grc')&&
      /\p{Script=Greek}/u.test(part.greek);
    const greek=element(isGreek?'button':'span',part.greek,
      'component-greek'+(isGreek?' component-greek-link':''));
    greek.lang=part.language||'grc';
    if(isGreek){
      greek.type='button';
      greek.setAttribute('aria-label','Consultar derivados del étimo '+part.greek);
      greek.addEventListener('click',()=>navigateToComponent(part,feedback));
    }
    item.append(greek,element('span','«'+part.gloss+'»','component-gloss'));
    if(part.external)item.append(element('small','complementario','component-tag'));
    line.append(item);
  });
  target.append(line,feedback);
}
function renderWord(word){
  const card=element('article',null,'lexical-word');
  const heading=element('h3',word.form,'lexical-word-title');
  const meaning=element('p',word.dleDefinition||word.definition,'lexical-definition');
  const componentsTitle=element('p',word.components.length>1?'Componentes etimológicos':'Étimo relacionado','lexical-small-label');
  const explanation=element('p',word.connection,'lexical-connection');
  const meta=element('div',null,'lexical-word-meta');
  const check=word.lexicographicCheck;
  const link=element('a','Consultar en el DLE (RAE-ASALE)');
  link.href=word.dleUrl;
  link.target='_blank';link.rel='noopener noreferrer';
  link.setAttribute('aria-label','Consultar '+word.form+' en el Diccionario de la lengua española');
  meta.append(link);
  card.append(heading);
  if(word.dleDefinition)card.append(element('p','Definición · glosa del DLE (RAE-ASALE)','lexical-small-label'));
  card.append(meaning,componentsTitle);
  appendComponentList(card,word.components);
  if(word.dleDefinition)card.append(element('p','Sentido etimológico','lexical-small-label'));
  card.append(explanation,meta);
  if(check?.sourceUrl&&check.status!=='dle_individual_contrastado'&&
     check.status!=='dle_no_incluye_entrada_independiente'){
    const sourceLink=element('a','Consultar la fuente especializada');
    sourceLink.href=check.sourceUrl;
    sourceLink.target='_blank';sourceLink.rel='noopener noreferrer';
    sourceLink.className='lexical-evidence-link';
    card.append(sourceLink);
  }
  if(word.editorialNote)
    card.append(element('p',word.editorialNote,'lexical-alert'));
  return card;
}
function minimumUnit(entry){
  const values=entry.units.map(s=>Number(s.replace('UD',''))).filter(Number.isFinite);
  return values.length?Math.min(...values):99;
}
function render(){
  if(!data)return;
  const query=normalize(ui.search.value);
  const unit=ui.unit.value;
  const byId=new Map(data.words.map(w=>[w.id,w]));
  const matches=[];
  for(const etymon of data.etymons){
    if(unit!=='all'&&!etymon.units.includes(unit))continue;
    const headerMatch=normalize(etymon.lemma+' '+etymon.meaning).includes(query);
    const words=etymon.wordIds.map(id=>byId.get(id)).filter(Boolean);
    const visible=query&&!headerMatch
      ?words.filter(word=>normalize(word.form+' '+word.definition+' '+
        word.components.map(c=>c.greek+' '+c.gloss).join(' ')).includes(query))
      :words;
    if(query&&!headerMatch&&!visible.length)continue;
    matches.push({etymon,words:visible});
  }
  matches.sort((a,b)=>ui.sort.value==='alphabetical'
    ?a.etymon.lemma.localeCompare(b.etymon.lemma,'el')
    :minimumUnit(a.etymon)-minimumUnit(b.etymon)||
      a.etymon.lemma.localeCompare(b.etymon.lemma,'el'));
  const fragment=document.createDocumentFragment();
  let shownWords=0;
  for(const item of matches){
    const group=element('details',null,'lexicon-group');
    if(focusedEtymon===item.etymon.id)group.classList.add('lexicon-group--target');
    const title=element('summary',null,'lexicon-group-summary');
    const greek=element('strong',item.etymon.lemma,'lexicon-greek');
    greek.lang='grc';
    const meaning=element('span',item.etymon.meaning,'lexicon-meaning');
    const units=element('span',item.etymon.units.join(' · '),'lexicon-units');
    const count=element('span',item.words.length+' derivados','lexicon-group-count');
    title.append(greek,meaning,units,count);
    group.append(title);
    const list=element('div',null,'lexicon-word-list');
    if(item.words.length){
      for(const word of item.words)list.append(renderWord(word));
    }else{
      list.append(element('p','No hay derivados disponibles para esta selección.','lexicon-empty'));
    }
    shownWords+=item.words.length;
    group.append(list);
    if(forceOpen||focusedEtymon===item.etymon.id||
       openGroups.has(item.etymon.id)||(query&&item.words.length<=6))group.open=true;
    group.addEventListener('toggle',()=>{
      if(group.open)openGroups.add(item.etymon.id);
      else openGroups.delete(item.etymon.id);
    });
    group.dataset.etymonId=item.etymon.id;
    fragment.append(group);
  }
  ui.container.replaceChildren(fragment);
  ui.empty.hidden=matches.length>0;
  ui.count.textContent=matches.length+' étimos · '+shownWords+' derivados mostrados';
  ui.expand.disabled=matches.length===0;
  ui.collapse.disabled=matches.length===0;
}
ui.search.addEventListener('input',()=>{focusedEtymon=null;render();});
ui.unit.addEventListener('change',()=>{focusedEtymon=null;render();});
ui.sort.addEventListener('change',render);
ui.expand.addEventListener('click',()=>{
  forceOpen=true;
  for(const item of ui.container.querySelectorAll('details')){item.open=true;openGroups.add(item.dataset.etymonId);}
});
ui.collapse.addEventListener('click',()=>{
  forceOpen=false;openGroups.clear();
  for(const item of ui.container.querySelectorAll('details'))item.open=false;
});
async function load(){
  try{
    const response=await fetch('./data/gr1-study.json',{cache:'no-cache'});
    if(!response.ok)throw Error('Estado HTTP '+response.status);
    const candidate=await response.json();
    if(candidate?.schema!=='etymologicon-study-catalog/v1'||candidate.course!=='gr1'||
       candidate.words?.length!==487||candidate.etymons?.length!==111||
       !candidate.audit?.allHaveDidacticDefinition)
      throw Error('Glosario académico incompleto');
    const units=[...new Set(candidate.etymons.flatMap(e=>e.units))].sort((a,b)=>
      Number(a.slice(2))-Number(b.slice(2)));
    ui.unit.append(...units.map(unit=>{
      const option=element('option',unit.replace('UD','Unidad '));
      option.value=unit;return option;
    }));
    data=candidate;
    ui.loading.hidden=true;
    const initial=new URLSearchParams(location.search).get('buscar');
    if(initial&&initial.length<=80)ui.search.value=initial;
    render();
  }catch(error){
    ui.loading.hidden=true;ui.error.hidden=false;
    console.error('Etymologicon: error de catálogo de estudio',error);
  }
}
load();
