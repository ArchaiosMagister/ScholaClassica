/** Consulta de léxico castellano. No corrige ejercicios ni lee/escribe progreso. */
const $=id=>document.getElementById(id);
const ui={search:$('study-search'),unit:$('study-unit'),sort:$('study-sort'),
  theme:$('study-theme'),expand:$('study-expand'),collapse:$('study-collapse'),
  count:$('study-count'),loading:$('study-loading'),error:$('study-error'),
  container:$('study-entries'),empty:$('study-empty')};
const inverse={toggle:$('study-inverse-toggle'),panel:$('study-inverse'),
  results:$('lista-etimos'),count:$('inverse-count'),card:$('inverse-card'),
  word:$('inverse-word'),definition:$('inverse-definition'),answer:$('inverse-answer'),
  empty:$('inverse-empty'),reveal:$('inverse-reveal'),next:$('inverse-next'),restart:$('inverse-restart')};
let inverseActive=false,deck=[],deckIndex=0;
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
  const meaning=element('p',word.reviewedDefinition||word.definition,'lexical-definition');
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
  if(word.reviewedDefinition)card.append(element('p','Definición contrastada','lexical-small-label'));
  card.append(meaning,componentsTitle);
  appendComponentList(card,word.components);
  if(word.reviewedDefinition)card.append(element('p','Sentido etimológico','lexical-small-label'));
  card.append(explanation,meta);
  const references=check?.scientificSources||[];
  for(const {authority,url} of references){
    const sourceLink=element('a',authority,'lexical-evidence-link');
    sourceLink.href=url;
    sourceLink.target='_blank';sourceLink.rel='noopener noreferrer';
    meta.append(sourceLink);
  }
  if(check?.secondarySource){
    const sourceLink=element('a','Referencia complementaria','lexical-evidence-link');
    sourceLink.href=check.secondarySource;
    sourceLink.target='_blank';sourceLink.rel='noopener noreferrer';
    meta.append(sourceLink);
  }
  if(word.admission&&!word.admission.practiceEligible)
    card.append(element('p','Solo consulta','lexical-small-label'));
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
  const matchesWord=word=>normalize(word.form+' '+(word.reviewedDefinition||word.definition)+' '+
    word.components.map(c=>c.greek+' '+c.gloss).join(' ')).includes(query);
  for(const etymon of data.etymons){
    if(unit!=='all'&&!etymon.units.includes(unit))continue;
    const headerMatch=normalize(etymon.lemma+' '+etymon.meaning).includes(query);
    const words=etymon.wordIds.map(id=>byId.get(id)).filter(Boolean);
    const visible=query&&!headerMatch
      ?words.filter(matchesWord)
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
  let unitSection=null,currentUnit=null;
  const byCurriculum=ui.sort.value==='curriculum';
  const unitCounts=new Map();
  if(byCurriculum){
    for(const item of matches){
      const key=unit==='all'?minimumUnit(item.etymon):Number(unit.replace('UD',''));
      unitCounts.set(key,(unitCounts.get(key)||0)+1);
    }
  }
  for(const item of matches){
    if(byCurriculum){
      const key=unit==='all'?minimumUnit(item.etymon):Number(unit.replace('UD',''));
      if(currentUnit!==key){
        currentUnit=key;
        unitSection=element('section',null,'lexicon-unit-section');
        unitSection.dataset.unit=key===99?'unassigned':'UD'+key;
        const heading=element('h2',null,'lexicon-unit-heading');
        heading.id='study-unit-heading-'+key;
        heading.append(element('span',key===99?'Sin unidad asignada':'Unidad '+key),
          element('span',unitCounts.get(key)+' étimos','lexicon-unit-count'));
        unitSection.setAttribute('aria-labelledby',heading.id);
        unitSection.append(heading);
        fragment.append(unitSection);
      }
    }
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
    (byCurriculum?unitSection:fragment).append(group);
  }
  const standalone=unit==='all'?data.words.filter(w=>!w.etymonIds.length&&matchesWord(w)):[];
  if(standalone.length){
    const section=element('section',null,'lexicon-word-list');
    section.append(element('h2','Fichas sin étimo curricular'));
    for(const word of standalone)section.append(renderWord(word));
    fragment.append(section);
    shownWords+=standalone.length;
  }
  ui.container.replaceChildren(fragment);
  ui.empty.hidden=matches.length>0||standalone.length>0;
  ui.count.textContent=matches.length+' étimos · '+shownWords+' derivados mostrados';
  ui.expand.disabled=matches.length===0;
  ui.collapse.disabled=matches.length===0;
}
// Estudio inverso de recuperación activa. Solo voces admitidas y una ficha por ID.
function prepareInverse(){
  deck=data.words.filter(w=>w.admission?.practiceEligible&&
    w.components.some(c=>(!c.language||c.language==='grc')&&/\p{Script=Greek}/u.test(c.greek))&&
    (ui.unit.value==='all'||w.units.includes(ui.unit.value)));
  for(let i=deck.length-1;i>0;i--){
    const j=Math.floor(Math.random()*(i+1));
    [deck[i],deck[j]]=[deck[j],deck[i]];
  }
  deckIndex=0;
  renderInverse();
}
function renderInverse(){
  const word=deck[deckIndex];
  inverse.answer.replaceChildren();
  inverse.answer.hidden=true;
  inverse.reveal.setAttribute('aria-expanded','false');
  inverse.card.hidden=!word;
  inverse.empty.hidden=!!word;
  inverse.reveal.hidden=!word;
  inverse.next.hidden=!word;
  inverse.reveal.disabled=!word;
  inverse.next.disabled=true;
  inverse.restart.disabled=!deck.length;
  inverse.count.textContent=word?(deckIndex+1)+' de '+deck.length+' palabras':
    deck.length?deck.length+' de '+deck.length+' palabras':'0 palabras';
  inverse.empty.textContent=deck.length?'Has terminado esta ronda. Puedes volver a barajar.':
    'No hay palabras aptas en esta unidad. Selecciona otra unidad.';
  if(!word)return;
  inverse.word.textContent=word.form;
  inverse.definition.textContent=word.reviewedDefinition||word.definition;
}
function revealInverse(){
  const word=deck[deckIndex];
  if(!word||!inverse.answer.hidden)return;
  inverse.answer.append(element('p','Raíces griegas','lexical-small-label'));
  const parts=element('div',null,'lexical-components');
  const other=[];
  for(const part of word.components){
    if((part.language&&part.language!=='grc')||!/\p{Script=Greek}/u.test(part.greek)){
      other.push(part);continue;
    }
    const chip=element('span',null,'lexical-component');
    const greek=element('strong',part.greek,'component-greek');
    greek.lang='grc';
    chip.append(greek,element('span','«'+part.gloss+'»','component-gloss'));
    parts.append(chip);
  }
  inverse.answer.append(parts);
  if(other.length)inverse.answer.append(element('p','Otros componentes: '+other.map(p=>p.greek+' («'+p.gloss+'»)').join(' · '),'lexical-note'));
  inverse.answer.append(element('p',word.connection,'lexical-connection'));
  if(word.editorialNote)inverse.answer.append(element('p',word.editorialNote,'lexical-alert'));
  inverse.answer.hidden=false;
  inverse.reveal.setAttribute('aria-expanded','true');
  inverse.reveal.disabled=true;
  inverse.next.disabled=false;
}
function setInverse(active){
  if(!data)return;
  inverseActive=active;
  inverse.panel.hidden=!active;
  inverse.results.hidden=active;
  ui.search.closest('.field').hidden=active;
  ui.sort.closest('.field').hidden=active;
  ui.expand.hidden=active;
  ui.collapse.hidden=active;
  ui.count.hidden=active;
  inverse.toggle.setAttribute('aria-pressed',String(active));
  inverse.toggle.textContent=active?'Volver al glosario':'Tarjetas inversas';
  if(active)prepareInverse();else render();
}
inverse.toggle.addEventListener('click',()=>setInverse(!inverseActive));
inverse.reveal.addEventListener('click',revealInverse);
inverse.next.addEventListener('click',()=>{
  if(inverse.answer.hidden||deckIndex>=deck.length)return;
  deckIndex++;
  renderInverse();
  if(deckIndex<deck.length)inverse.reveal.focus();else inverse.restart.focus();
});
inverse.restart.addEventListener('click',()=>{prepareInverse();inverse.reveal.focus();});

ui.search.addEventListener('input',()=>{focusedEtymon=null;render();});
ui.unit.addEventListener('change',()=>{focusedEtymon=null;if(inverseActive)prepareInverse();else render();});
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
    inverse.toggle.disabled=false;
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
