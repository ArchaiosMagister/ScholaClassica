'use strict';
(function(){
const $=id=>document.getElementById(id);
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));
const shuffle=a=>{a=[...a];for(let i=a.length-1;i>0;i--){let j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};
const norm=s=>String(s||'').toLowerCase().normalize('NFD').replace(/\u0345/g,'ι').replace(/\p{M}/gu,'').replace(/æ/g,'ae').replace(/œ/g,'oe').replace(/ς/g,'σ').replace(/[·.,;!?¿¡‘’'"]/g,'').replace(/\s+/g,' ').trim();
const variants=s=>[...new Set(String(s).split(/\s*\/\s*/).flatMap(raw=>raw.includes('(ν)')?[norm(raw.replaceAll('(ν)','')),norm(raw.replaceAll('(ν)','ν'))]:[norm(raw)]))];
const CASES={nom:'nominativo',gen:'genitivo',dat:'dativo',acc:'acusativo',abl:'ablativo',voc:'vocativo'};
const GENDERS={m:'masculino',f:'femenino',n:'neutro'};
const PEOPLE={'1':'1.ª persona','2':'2.ª persona','3':'3.ª persona'};
const NUMBERS={sg:'singular',pl:'plural'};
const content=window.GRAMMAR_CONTENT;
const paradigms=window.GRAMMAR_PARADIGMS;
const corpus={lat1:'Latín I',gr1:'Griego I',lat4:'Latín · 4.º ESO'};
if(!content||!paradigms){$('available').textContent='No se ha podido cargar el banco de ejercicios.';return}
const syllabi=Object.fromEntries(Object.entries(content.syllabi).map(([subject,units])=>[subject,units.filter(([unit])=>unit!=='UD 0')]));
let progress={};
try{progress=JSON.parse(localStorage.getItem('classics-grammar-v1')||'{}')||{}}catch{progress={}}
function save(){try{localStorage.setItem('classics-grammar-v1',JSON.stringify(progress))}catch{$('available').textContent='No es posible guardar el progreso en este navegador.'}}
const formatFeature=(key,kind)=>{
 if(key==='inf')return 'infinitivo';
 const parts=key.split('.');
 if(kind==='verbal')return (PEOPLE[parts[0]]||parts[0])+' del '+(NUMBERS[parts[1]]||parts[1]);
 const [cas,gender,num]=parts.length===3?[parts[0],parts[1],parts[2]]:[parts[0],null,parts[1]];
 return (CASES[cas]||cas)+(gender?' '+GENDERS[gender]:'')+' '+(NUMBERS[num]||num);
};
function matchingTopic(p,subject,unit){
 const found=syllabi[subject].find(x=>x[0]===unit);
 if(!found)return null;
 const topics=found[1];
 if(topics.includes(p.topic))return p.topic;
 if(subject==='lat4'&&p.lang==='lat'&&p.desc==='imperfecto de indicativo activo'&&topics.includes('El imperfecto'))return 'El imperfecto';
 const aliases={
 'lat1|lat-puella':'Primera y segunda declinación',
 'lat1|lat-servus':'Primera y segunda declinación',
 'lat1|lat-bellum':'Primera y segunda declinación',
 'lat1|lat-bonus':'Los adjetivos',
 'lat4|lat-fortis':'Adjetivos de la 3ª declinación',
 'lat4|lat-rex':'La tercera declinación',
 'lat4|lat-corpus':'La tercera declinación',
 'lat4|lat-amo-present':'Presente',
 'lat4|lat-amo-imperfect':'El imperfecto',
 'lat4|lat-amo-perfect':'El perfecto',
 'lat4|lat-amo-pluperfect':'Pluscuamperfecto',
 'lat1|lat-amo-perfect':'El perfecto y el pluscuamperfecto de indicativo',
 'lat1|lat-amo-pluperfect':'El perfecto y el pluscuamperfecto de indicativo'
 };
 const x=aliases[subject+'|'+p.id];
 return topics.includes(x)?x:null;
}
function buildExercises(){
 const items=[];
 content.questions.forEach((q,i)=>{
  if(q.u==='UD 0')return;
  items.push({id:q.s+'|'+q.u+'|concept-'+i,subject:q.s,unit:q.u,topic:q.t,category:q.c,mode:'choice',prompt:q.p,answer:q.a,options:[q.a,...q.w],explanation:q.x,language:'es'});
 });
 for(const p of paradigms){
  const forms=Object.entries(p.forms);
  const readings=new Map();
  for(const [feature,surface] of forms)for(const variant of variants(surface)){
   if(!readings.has(variant))readings.set(variant,new Set());
   readings.get(variant).add(feature);
  }
  for(const [subject,unit] of Object.entries(p.units)){
   const topic=matchingTopic(p,subject,unit);
   if(!topic){console.warn('Paradigma sin tema reconocido:',p.id,subject,unit);continue}
   const lemma=window.GrammarEnunciation?.display(subject,p.lemma,p.kind==='verbal')||p.lemma;
   const category=(p.kind==='verbal'||p.id==='gr-participio'||p.id==='gr-lyo-part'||p.id==='lat-amans')?'Morfología verbal':'Morfología nominal';
   for(const [feature,surface] of forms){
    const label=formatFeature(feature,p.kind);
    const base=subject+'|'+unit+'|'+p.id+'|'+feature;
    const instruction=p.kind==='verbal'?(feature==='inf'?(p.desc||'infinitivo'):label+' del '+p.desc):label;
    items.push({id:base+'|write',subject,unit,topic,category,mode:'write',
      prompt:'Escribe '+instruction+' de '+lemma+'.',lemma:p.lemma,
      answer:surface,accepted:variants(surface),explanation:'Enunciado: '+lemma+' · '+instruction+'.',language:p.lang});
    const safe=variants(surface).every(x=>readings.get(x).size===1);
    if(!safe||forms.length<2)continue;
    const other=[...new Set(forms.filter(x=>x[0]!==feature).map(x=>formatFeature(x[0],p.kind)))].filter(x=>x!==label);
    if(other.length<1)continue;
    items.push({id:base+'|analysis',subject,unit,topic,category,mode:'choice',
      prompt:'¿Qué análisis corresponde a «'+surface+'» de '+lemma+'?',lemma:p.lemma,
      answer:label,options:[label,...shuffle(other).slice(0,3)],
      explanation:p.lemma+' · '+(p.desc||'paradigma nominal')+' · '+instruction+'.',language:p.lang,
      morphologyExplanation:'La forma «'+surface+'» corresponde a '+instruction+'.'});
   }
  }
 }
 return items;
}
const exercises=buildExercises();
let imported=[],importRequest=0;
async function loadImported(){
 const request=++importRequest,subject=$('subject').value;
 if(!window.GrammarImported){$('imported-status').textContent='Módulo de importación no disponible.';return}
 $('imported-status').textContent='Consultando las flexiones importadas…';
 imported=[];
 update();
 try{
  const result=await window.GrammarImported.load(subject);
  if(request!==importRequest)return;
  imported=result.items;
  $('imported-status').textContent=imported.length.toLocaleString('es')+' ejercicios de flexión importados · '+result.rows.toLocaleString('es')+' registros morfológicos de UniMorph para vocabulario de '+subject+'.';
  update();
 }catch(e){
  if(request!==importRequest)return;
  $('imported-status').textContent='Los índices UniMorph todavía no están disponibles: '+e.message+'. Los ejercicios originales siguen funcionando.';
  imported=[];
 }
 update();
}
let online=[],onlineSubject=null,onlineRequest=0;
const attemptedOnline={lat1:new Set(),lat4:new Set()};
function loadOnline(){
 const subject=$('subject').value;
 ++onlineRequest;
 if(onlineSubject!==subject){online=[];onlineSubject=subject;$('online-attribution').hidden=true;$('online-attribution-text').textContent=''}
 const enabled=$('include-online').checked&&subject!=='gr1';
 $('online-add').disabled=!enabled;
 $('online-lemma').disabled=!enabled;
 if(subject==='gr1'){
  $('online-status').textContent='Griego: sin API de conjugación suficientemente comprobada. Consulta Eulexis en la sección de diccionarios.';
 }else if(!enabled){
  $('online-status').textContent='Respaldo de Latin Dictionary desactivado; los ejercicios locales siguen disponibles.';
 }else{
  const added=new Set(availablePool().filter(q=>q.source==='Latin Dictionary API'&&q.mode==='write').map(q=>norm(q.lemma)));
  $('online-status').textContent='Respaldo listo: '+added.size+' lemas adicionales cargados desde Latin Dictionary. Escribe un lema de tu vocabulario o deja el campo vacío para consultar el siguiente.';
 }
 update();
}
async function addOnline(){
 const subject=$('subject').value,request=onlineRequest;
 if(!$('include-online').checked||subject==='gr1'||!window.GrammarOnlineBackup)return;
 const choices=window.GrammarOnlineBackup.candidates(subject,selectedUnits());
 const typed=norm($('online-lemma').value.trim());
 const entry=typed?choices.find(x=>norm(x.lemma)===typed):
  choices.find(x=>!attemptedOnline[subject].has(x.lemma));
 if(!entry){
  $('online-status').textContent=typed?'Ese lema no está entre las palabras flexivas identificadas para las unidades seleccionadas.':'No quedan palabras pendientes de consulta en estas unidades.';
  return;
 }
 const button=$('online-add');
 button.disabled=true;
 $('online-status').textContent='Consultando las formas de '+entry.lemma+' en Latin Dictionary…';
 try{
  const result=await window.GrammarOnlineBackup.load(subject,entry.lemma);
  if(request!==onlineRequest||subject!==$('subject').value)return;
  attemptedOnline[subject].add(entry.lemma);
  if(result.attribution){$('online-attribution-text').textContent=result.attribution;$('online-attribution').hidden=false}
  if(result.items.length){
   const ids=new Set(online.map(q=>q.id));
   online.push(...result.items.filter(q=>!ids.has(q.id)));
  }
  const available=availablePool().filter(q=>q.source==='Latin Dictionary API');
  const lemmas=new Set(available.filter(q=>q.mode==='write').map(q=>norm(q.lemma)));
  const state=result.items.length?
   'Se han consultado '+result.items.length+' ejercicios de '+entry.lemma+'. Hay '+available.length+' ejercicios adicionales de '+lemmas.size+' lemas disponibles con el formato habitual.':
   'No se incorporan formas de '+entry.lemma+': la entrada online no coincide de manera suficiente con su enunciado o su paradigma.';
  $('online-status').textContent=state;
  update();
 }catch(error){
  if(request!==onlineRequest)return;
  $('online-status').textContent='No se ha podido consultar '+entry.lemma+' ('+error.message+'). Los ejercicios locales siguen funcionando.';
 }finally{button.disabled=!$('include-online').checked||$('subject').value==='gr1'}
}
function availablePool(){
 const primary=exercises.concat($('include-imported').checked?imported:[]);
 if(!$('include-online').checked||!online.length)return primary;
 const prompts=new Set(primary.map(q=>q.subject+'|'+q.unit+'|'+q.mode+'|'+norm(q.prompt)));
 return primary.concat(online.filter(q=>!prompts.has(q.subject+'|'+q.unit+'|'+q.mode+'|'+norm(q.prompt))));
}
let session=null;
const selectedUnits=()=>new Set([...$('units').querySelectorAll('input:checked')].map(x=>x.value));
function getItems(ignoreErrors=false){
 const subject=$('subject').value,units=selectedUnits(),cat=$('category').value,mode=$('answer-mode').value;
 return availablePool().filter(q=>q.subject===subject&&units.has(q.unit)&&(cat==='all'||(cat==='Morfología'?q.category.startsWith('Morfología '):q.category===cat))&&(mode==='all'||q.mode===mode)&&(ignoreErrors||!$('errors').checked||progress[q.id]?.failed));
}
function stats(){
 const subject=$('subject').value;
 const entries=Object.entries(progress).filter(([k])=>k.startsWith(subject+'|')).map(([,v])=>v);
 const total=entries.reduce((sum,v)=>sum+v.total,0);
 $('learned').textContent=entries.length;
 $('accuracy').textContent=total?Math.round(entries.reduce((sum,v)=>sum+v.right,0)/total*100)+'%':'—';
 $('pending').textContent=entries.filter(p=>p.failed).length;
}
function setupUnits(){
 const subject=$('subject').value;
 $('units').innerHTML=syllabi[subject].map(([unit])=>'<label><input type="checkbox" value="'+esc(unit)+'" checked> '+esc(unit)+'</label>').join('');
 update();
 loadImported();
 loadOnline();
}
function outline(){
 const subject=$('subject').value,units=selectedUnits();
 const selected=syllabi[subject].filter(([unit])=>units.has(unit));
 const available=availablePool();
 $('topic-summary').textContent=selected.length+' unidades completas seleccionadas. Puedes filtrar por morfología nominal o verbal sin dividir las unidades.';
 $('outline').innerHTML=selected.map(([unit])=>{
  const q=available.filter(x=>x.subject===subject&&x.unit===unit);
  const nominal=q.filter(x=>x.category==='Morfología nominal').length;
  const verbal=q.filter(x=>x.category==='Morfología verbal').length;
  const other=q.length-nominal-verbal;
  return '<section class="grammar-outline-item"><h3>'+esc(unit)+'</h3><p>'+q.length+' ejercicios · '+nominal+' nominales · '+verbal+' verbales'+(other?' · '+other+' de otros contenidos':'')+'</p></section>';
 }).join('')||'<p>Selecciona al menos una unidad.</p>';
}
function update(){
 const n=getItems().length,subject=$('subject').value;
 $('available').textContent=n+' ejercicios disponibles para '+corpus[subject]+($('errors').checked?' · sólo fallos':'')+'.';
 $('start').disabled=n===0;stats();outline();
}
function variedQuestions(list,count){
 const groups=new Map();
 for(const q of shuffle(list)){
  const key=q.lemma?q.subject+'|'+q.lemma:q.id;
  if(!groups.has(key))groups.set(key,[]);
  groups.get(key).push(q);
 }
 const keys=shuffle([...groups.keys()]),result=[];
 while(result.length<count){
  let added=0;
  for(const key of shuffle(keys)){
   const group=groups.get(key);
   if(group.length){result.push(group.pop());added++;if(result.length===count)break}
  }
  if(!added)break;
 }
 return result;
}
function start(questions){
 const list=questions||getItems();
 if(!list.length)return;
 const count=$('length').value==='all'?list.length:Math.min(list.length,Number($('length').value));
 session={queue:variedQuestions(list,count),i:0,right:0,wrong:[],done:false};
 render();
}
function render(){
 if(!session)return;
 const s=session;
 if(s.i>=s.queue.length){finish();return}
 const q=s.queue[s.i];s.done=false;
 const wordLang=q.language==='grc'?'grc':q.language==='lat'?'la':'es';
 const card=$('practice');
 card.innerHTML='<div class="topline"><span>'+esc(q.category)+'</span><span>'+(s.i+1)+' / '+s.queue.length+'</span></div>'+
 '<div class="progress"><div style="width:'+Math.round(100*s.i/s.queue.length)+'%"></div></div>'+
 '<div class="grammar-topic"><strong>'+esc(q.unit)+'</strong><span>'+esc(q.topic)+'</span></div>'+
 '<h2 class="grammar-question" lang="'+wordLang+'">'+esc(q.prompt)+'</h2>'+
 '<div id="grammar-answer"></div><div id="grammar-feedback" role="status"></div><div id="grammar-next"></div>';
 if(q.mode==='choice'){
  const opts=shuffle(q.options);
  $('grammar-answer').innerHTML='<div class="grammar-choices">'+opts.map((option,i)=>'<button type="button" data-option="'+i+'">'+esc(option)+'</button>').join('')+'</div>';
  $('grammar-answer').querySelectorAll('button').forEach(b=>b.onclick=()=>mark(opts[Number(b.dataset.option)]===q.answer,opts[Number(b.dataset.option)]));
 }else{
  $('grammar-answer').innerHTML='<form id="grammar-form" class="grammar-form"><label for="grammar-input">Tu respuesta</label><input id="grammar-input" autocomplete="off" spellcheck="false" required lang="'+wordLang+'" placeholder="Escribe la forma…"><div class="grammar-actions"><button type="submit" class="primary">Comprobar</button><button id="grammar-skip" class="grammar-skip" type="button">No lo sé</button></div></form>';
  $('grammar-form').onsubmit=e=>{e.preventDefault();const answer=$('grammar-input').value;mark(q.accepted.includes(norm(answer)),answer)};
  $('grammar-skip').onclick=()=>mark(false,'');
  $('grammar-input').focus();
 }
}
function mark(correct,given){
 const s=session;if(!s||s.done)return;s.done=true;
 const q=s.queue[s.i],old=progress[q.id]||{total:0,right:0,failed:false};
 old.total++;old.right+=Number(correct);old.failed=!correct;progress[q.id]=old;save();stats();
 if(correct)s.right++;else s.wrong.push(q);
 $('grammar-answer').querySelectorAll('button,input').forEach(el=>el.disabled=true);
 $('grammar-feedback').className='grammar-feedback'+(correct?'':' bad');
 $('grammar-feedback').innerHTML='<b>'+(correct?'Correcto':'Revisa esta forma')+'</b>'+
 (given&&!correct?'<p>Tu respuesta: '+esc(given)+'</p>':'')+
 '<div class="grammar-answer">Respuesta: <strong lang="'+(q.language==='grc'?'grc':q.language==='lat'?'la':'es')+'">'+esc(q.answer)+'</strong></div>'+
 '<p class="grammar-detail">'+esc(q.morphologyExplanation||q.explanation||'')+'</p>';
 $('grammar-next').innerHTML='<div class="grammar-actions"><button id="grammar-next-btn" class="primary">Siguiente →</button></div>';
 $('grammar-next-btn').onclick=()=>{s.i++;render()};
 $('grammar-next-btn').focus();
}
function finish(){
 const s=session;
 $('practice').innerHTML='<p class="eyebrow">SESIÓN COMPLETADA</p><h2>'+s.right+' de '+s.queue.length+' aciertos</h2><p>Has completado la sesión. '+(s.wrong.length?s.wrong.length+' preguntas para volver a practicar.':'No hay errores en esta sesión.')+'</p><div class="grammar-actions">'+(s.wrong.length?'<button id="grammar-retry" class="primary">Repetir fallos de esta sesión</button>':'')+'<button id="grammar-again">Nueva sesión</button></div>';
 if($('grammar-retry'))$('grammar-retry').onclick=()=>start(s.wrong);
 $('grammar-again').onclick=()=>start();update();
}
$('subject').onchange=setupUnits;
$('units').onchange=update;
for(const id of ['category','answer-mode','errors','include-imported'])$(id).onchange=update;
$('include-online').onchange=loadOnline;
$('online-add').onclick=addOnline;
$('all').onclick=()=>{$('units').querySelectorAll('input').forEach(el=>el.checked=true);update()};
$('none').onclick=()=>{$('units').querySelectorAll('input').forEach(el=>el.checked=false);update()};
$('start').onclick=()=>start();
setupUnits();
window.GrammarPracticeDebug={exercises,syllabi,variants,norm,currentQuestion:()=>session?.queue[session.i]||null,online:()=>online,available:()=>availablePool()}; // Datos de auditoría en la consola, sin efectos en la sesión.
})();