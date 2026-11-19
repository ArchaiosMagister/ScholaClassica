'use strict';
(()=>{
const $=id=>document.getElementById(id);
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const norm=s=>String(s||'').toLowerCase().normalize('NFD').replace(/\p{M}/gu,'').replace(/æ/g,'ae').replace(/œ/g,'oe').replace(/\s+/g,' ').trim();
const DATA_URL='https://raw.githubusercontent.com/ArchaiosMagister/GeneradorExamenes/main/data/unimorph/lat-v.json';
const FEATURES=['1;SG','2;SG','3;SG','1;PL','2;PL','3;PL'];
const LABELS={'1;SG':'1.ª persona del singular','2;SG':'2.ª persona del singular','3;SG':'3.ª persona del singular','1;PL':'1.ª persona del plural','2;PL':'2.ª persona del plural','3;PL':'3.ª persona del plural'};
let index=null,loading=null,session=null,progress={};
try{progress=JSON.parse(localStorage.getItem('classics-morphology-v1')||'{}')||{}}catch{progress={}}
const store=()=>{try{localStorage.setItem('classics-morphology-v1',JSON.stringify(progress))}catch{}};
const key=q=>[q.subject,q.lemma,q.surface,q.feature].join('|');
const shuffle=a=>{a=[...a];for(let i=a.length-1;i>0;i--){let j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};
function entries(){return VOCAB.filter(e=>e.subject===$('subject').value&&e.mode===$('corpus').value)}
function selectedEntries(){const u=new Set([...$('units').querySelectorAll('input:checked')].map(e=>e.value));return entries().filter(e=>e.units.some(x=>u.has(x)))}
function setUnits(){const units=[...new Set(entries().flatMap(e=>e.units))].sort((a,b)=>a.localeCompare(b,'es',{numeric:true}));$('units').innerHTML=units.map(x=>'<label><input type="checkbox" checked value="'+esc(x)+'"> '+esc(x)+'</label>').join('');$('corpus').options[1].textContent=$('subject').value==='lat2'?'Núcleo frecuente':'Sólo de examen';update()}
async function load(){
 if(index)return index;
 if(loading)return loading;
 loading=(async()=>{
  const response=await fetch(DATA_URL,{cache:'force-cache'});if(!response.ok)throw Error('HTTP '+response.status);
  const data=await response.json();if(data.language!=='lat'||data.pos!=='V'||!Array.isArray(data.rows))throw Error('Formato de índice no reconocido');
  const byLemma=new Map();
  for(const row of data.rows){
   const [lemma,surface,raw,rank]=row;
   if(typeof lemma!=='string'||typeof surface!=='string'||typeof raw!=='string'||rank!==1)continue;
   const tags=raw.split(';');
   if(tags.length!==6||tags[0]!=='V'||tags[1]!=='IND'||tags[2]!=='ACT'||tags[3]!=='PRS')continue;
   const f=tags[4]+';'+tags[5];if(!FEATURES.includes(f))continue;
   const k=norm(lemma);if(!byLemma.has(k))byLemma.set(k,[]);
   byLemma.get(k).push({lemma,surface,feature:f});
  }
  index=byLemma;return byLemma;
 })().catch(e=>{loading=null;throw e});
 return loading;
}
function pool(){
 if(!index||$('subject').value==='gr1')return [];
 const result=[],seen=new Set();
 for(const e of selectedEntries()){
  const lemma=e.form.split(/[,+(]/)[0].trim();
  const rows=index.get(norm(lemma))||[];
  if(!rows.length)continue;
  const surfaces=new Map();
  for(const r of rows){const form=norm(r.surface);if(!surfaces.has(form))surfaces.set(form,new Set());surfaces.get(form).add(r.feature)}
  const featureForms=new Map();
  for(const r of rows){
   if(surfaces.get(norm(r.surface)).size!==1)continue;
   if(!featureForms.has(r.feature))featureForms.set(r.feature,new Set());
   featureForms.get(r.feature).add(r.surface);
  }
  for(const [feature,forms] of featureForms){
   for(const surface of forms){
    const id=e.subject+'|'+norm(lemma)+'|'+feature+'|'+norm(surface);
    if(seen.has(id))continue;seen.add(id);
    result.push({subject:e.subject,lemma,surface,feature,answers:[...forms],meaning:e.meaning,units:e.units,id});
   }
  }
 }
 return result;
}
function currentPool(){const p=pool();return $('errors').checked?p.filter(q=>progress[key(q)]?.failed):p}
function stats(){
 const sub=$('subject').value;
 const values=Object.entries(progress).filter(([k])=>k.startsWith(sub+'|')).map(([,v])=>v);
 const total=values.reduce((s,v)=>s+v.total,0);
 $('learned').textContent=values.length;
 $('accuracy').textContent=total?Math.round(values.reduce((s,v)=>s+v.right,0)/total*100)+'%':'—';
 $('pending').textContent=values.filter(x=>x.failed).length;
}
function update(){
 stats();
 const subject=$('subject').value;
 if(subject==='gr1'){$('available').textContent='Griego I: todavía no hay un índice griego de flexiones publicado. No se propondrán respuestas inventadas.';$('start').disabled=true;return}
 if(!index){$('available').textContent=loading?'Cargando banco de formas latinas…':'Banco morfológico pendiente de carga.';$('start').disabled=true;return}
 const p=currentPool(),lemmas=new Set(p.map(x=>norm(x.lemma)));
 $('available').textContent=p.length+' formas de '+lemmas.size+' lemas disponibles · presente de indicativo activo';
 $('start').disabled=!p.length;
}
function start(list){
 const p=list||currentPool();
 if(!p.length)return;
 session={queue:shuffle(p).slice(0,$('length').value==='all'?undefined:Number($('length').value)),i:0,right:0,wrong:[],done:false};
 render();
}
function render(){
 const s=session;if(!s)return;if(s.i>=s.queue.length)return finish();
 const q=s.queue[s.i];
 const mode=$('activity').value==='mixed'?(Math.random()<.5?'analyze':'produce'):$('activity').value;
 s.done=false;s.mode=mode;
 const place=$('practice');
 place.innerHTML='<div class="topline"><span>'+esc(mode==='analyze'?'Analiza la forma':'Escribe la flexión')+'</span><span>'+(s.i+1)+' / '+s.queue.length+'</span></div><div class="progress"><div style="width:'+(s.i/s.queue.length*100)+'%"></div></div>'+
 '<p class="small">Lema: <b class="morph-word" lang="la">'+esc(q.lemma)+'</b> · '+esc(q.meaning)+' · '+esc(q.units.join(' · '))+'</p>'+
 '<div class="morph-prompt morph-word" lang="la">'+esc(mode==='analyze'?q.surface:q.lemma)+'</div>'+
 '<p>'+esc(mode==='analyze'?'¿Qué persona y número tiene esta forma?':'Escribe la forma de '+LABELS[q.feature]+' del presente de indicativo activo.')+'</p>'+
 '<div id="morph-answer"></div><div id="morph-feedback" role="status"></div><div id="morph-next"></div>';
 if(mode==='analyze'){
  const opts=shuffle(FEATURES).slice(0,4);
  if(!opts.includes(q.feature))opts[Math.floor(Math.random()*opts.length)]=q.feature;
  $('morph-answer').innerHTML='<div class="morph-choices">'+shuffle(opts).map(f=>'<button type="button" data-feature="'+f+'">'+esc(LABELS[f])+'</button>').join('')+'</div>';
  $('morph-answer').querySelectorAll('button').forEach(b=>b.onclick=()=>mark(b.dataset.feature===q.feature));
 }else{
  $('morph-answer').innerHTML='<form id="morph-form"><label for="morph-input">Tu respuesta</label><input id="morph-input" class="latin-term" lang="la" autocomplete="off" spellcheck="false" required><div class="morph-actions"><button class="primary">Comprobar</button><button type="button" id="morph-skip">No lo sé</button></div></form>';
  $('morph-form').onsubmit=e=>{e.preventDefault();mark(q.answers.some(x=>norm(x)===norm($('morph-input').value)))};
  $('morph-skip').onclick=()=>mark(false);
  $('morph-input').focus();
 }
}
function mark(ok){
 const s=session;if(s.done)return;s.done=true;
 const q=s.queue[s.i],k=key(q),p=progress[k]||{total:0,right:0,failed:false};
 p.total++;p.right+=Number(ok);p.failed=!ok;progress[k]=p;store();stats();
 if(ok)s.right++;else s.wrong.push(q);
 $('morph-answer').querySelectorAll('button,input').forEach(x=>x.disabled=true);
 $('morph-feedback').className='morph-feedback'+(ok?'':' bad');
 $('morph-feedback').innerHTML='<b>'+(ok?'Correcto':'Conviene repasarlo')+'</b><div class="morph-info"><span class="morph-word" lang="la">'+esc(q.surface)+'</span> · '+esc(LABELS[q.feature])+' · presente de indicativo activo</div><p class="small">Lema: '+esc(q.lemma)+' · Otras grafías admitidas: '+esc([...new Set(q.answers)].join(', '))+'</p>';
 $('morph-next').innerHTML='<div class="morph-actions"><button type="button" id="morph-next-btn" class="primary">Siguiente →</button></div>';
 $('morph-next-btn').onclick=()=>{s.i++;render()};
 $('morph-next-btn').focus();update();
}
function finish(){
 const s=session;
 $('practice').innerHTML='<p class="eyebrow">SESIÓN COMPLETADA</p><h2>'+s.right+' de '+s.queue.length+' aciertos</h2><p>'+s.wrong.length+' formas pendientes de repaso.</p><div class="morph-actions">'+(s.wrong.length?'<button class="primary" id="morph-retry">Repetir fallos</button>':'')+'<button id="morph-again">Nueva sesión</button></div>';
 if($('morph-retry'))$('morph-retry').onclick=()=>start(s.wrong);
 $('morph-again').onclick=()=>start();update();
}
$('subject').onchange=()=>{setUnits()};
$('corpus').onchange=setUnits;
$('units').onchange=update;
$('errors').onchange=update;
$('all').onclick=()=>{$('units').querySelectorAll('input').forEach(x=>x.checked=true);update()};
$('none').onclick=()=>{$('units').querySelectorAll('input').forEach(x=>x.checked=false);update()};
$('start').onclick=()=>start();
setUnits();
load().then(update).catch(e=>{$('available').textContent='No se pudo cargar el banco morfológico ('+e.message+'). Comprueba la conexión e inténtalo al volver a abrir la página.';update();$('available').textContent='No se pudo cargar el banco morfológico ('+e.message+').'});
})();