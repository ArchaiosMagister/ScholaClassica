import {items} from './banco.mjs';
import {read,save,normalize,select,record,recordSelf,mastered,shuffled,question,check} from './model.mjs';
const $=id=>document.getElementById(id);
let storage;try{storage=window.localStorage;}catch{}
const state=read(storage);
const el=(tag,text,cls)=>{const n=document.createElement(tag);if(text!=null)n.textContent=text;if(cls)n.className=cls;return n;};
// Convención docente: todos los latinismos de este módulo se presentan en cursiva,
// también los adaptados; el campo italic del banco conserva la distinción normativa.
const latinText=value=>el('i',value,'latin-term');
const term=(i,initial=false)=>latinText(initial?i.latinism.charAt(0).toLocaleUpperCase('es')+i.latinism.slice(1):i.latinism);
function meaning(i){
 const fragment=document.createDocumentFragment();
 const forms=[i.latinism,...i.variants].sort((a,b)=>b.length-a.length);
 const escaped=forms.map(s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\const term=(i,initial=false)=>el(i.italic?'i':'span',initial?i.latinism.charAt(0).toLocaleUpperCase('es')+i.latinism.slice(1):i.latinism);'));
 const pattern=new RegExp('(?<![\\p{L}\\p{N}])(?:'+escaped.join('|')+')(?![\\p{L}\\p{N}])','giu');
 let last=0;
 for(const match of i.meaning.matchAll(pattern)){fragment.append(i.meaning.slice(last,match.index),latinText(match[0]));last=match.index+match[0].length;}
 fragment.append(i.meaning.slice(last));return fragment;
}
function meaningParagraph(i){const p=el('p');p.append(meaning(i));return p;}
function sentence(i,context){const [a,b]=context.split('___');const f=document.createDocumentFragment();f.append(a,term(i,!a.trim()||/^[«¡¿“]+$/.test(a.trim())),b);return f;}
function persist(){if(!save(storage,state))$('storage-status').textContent='No se puede guardar en este navegador. El progreso solo se mantiene durante esta visita.';}
function stats(){let a=0,e=0,s=0,m=0,sc=0,sw=0;for(const r of Object.values(state.stats)){a+=r.correct;e+=r.wrong;s+=Number(r.studied);m+=Number(mastered(r));sc+=r.selfCorrect??0;sw+=r.selfWrong??0;}$('stats').textContent='Estudiados: '+s+'/87 · Dominados: '+m+'/87 · Aciertos: '+a+' · Errores: '+e+' (dominio: tres aciertos consecutivos). Autoevaluación PAU: '+sc+' bien · '+sw+' por repasar.';}
function current(){return select(state.config,state.stats);}
function cards(){
 const pool=current(),query=normalize($('search').value);const shown=pool.filter(i=>normalize(i.latinism+' '+i.variants.join(' ')+' '+i.meaning+' '+i.number).includes(query));$('cards').replaceChildren();
 $('selection').textContent=pool.length+' latinismos seleccionados'+(state.config.filter==='range'&&!select({...state.config,errors:false}).length?' · Intervalo inválido':'');
 $('study-count').textContent=shown.length+' fichas visibles';
 for(const i of shown){const card=el('article',null,'entry'),heading=el('h2');heading.append(el('span',String(i.number),'number'),term(i));card.append(heading);if(i.variants.length){const p=el('p','También: ');i.variants.forEach((v,k)=>{if(k)p.append(' · ');p.append(latinText(v));});card.append(p);}card.append(meaningParagraph(i));const list=el('ol');for(const c of i.contexts){const li=el('li');li.append(sentence(i,c));list.append(li);}card.append(list);
 const label=el('label',null,'check'),input=el('input');input.type='checkbox';input.checked=!!state.stats[i.number]?.studied;input.addEventListener('change',()=>{const r=state.stats[i.number]??(state.stats[i.number]={correct:0,wrong:0,streak:0,lastWrong:false});r.studied=input.checked;persist();stats();});label.append(input,' Estudiado');card.append(label);if(mastered(state.stats[i.number]))card.append(el('p','Dominado'));$('cards').append(card);}
}
let round=[],pool=[],position=0,q=null,answered=false,score=0,reviewed=false;
function cancel(){round=[];q=null;$('round').hidden=true;$('round-status').textContent='';}
function config(){state.config={filter:$('filter').value,from:$('from').valueAsNumber,to:$('to').valueAsNumber,mode:$('kind').value,errors:$('errors').checked};$('range').hidden=state.config.filter!=='range';cancel();persist();cards();}
for(const id of ['filter','from','to','kind','errors'])$(id).addEventListener('change',config);
$('filter').value=state.config.filter;$('from').value=state.config.from;$('to').value=state.config.to;$('kind').value=state.config.mode;$('errors').checked=state.config.errors;$('range').hidden=state.config.filter!=='range';
$('search').addEventListener('input',cards);
function tab(study){$('study').hidden=!study;$('practice').hidden=study;$('study-tab').setAttribute('aria-pressed',String(study));$('practice-tab').setAttribute('aria-pressed',String(!study));if(study)cards();}
$('study-tab').addEventListener('click',()=>tab(true));$('practice-tab').addEventListener('click',()=>tab(false));
$('reset').addEventListener('click',()=>{if(!confirm('¿Borrar los aciertos, errores y marcas de estudio de Latinismos?'))return;state.stats={};cancel();persist();stats();cards();});
$('start').addEventListener('click',()=>{pool=current();round=shuffled(pool);position=0;score=0;$('round-status').textContent='';if(!round.length){cancel();$('round-status').textContent='No hay latinismos disponibles para esta selección.';return;}show();});
function show(){
 if(position>=round.length){$('round').hidden=true;$('round-status').textContent='Ronda completada: '+score+' de '+round.length+(state.config.mode==='pau'?' autoevaluaciones positivas.':' aciertos.');cards();return;}
 q=question(round[position],pool,state.config.mode);answered=false;reviewed=false;$('self-review').hidden=true;$('round').hidden=false;$('round-count').textContent='Pregunta '+(position+1)+' de '+round.length;
 $('question').replaceChildren(q.kind==='pau'?'Explica el significado y escribe una oración con: ':q.kind==='meaning'?'¿Qué significa? ':q.kind==='context'?'Completa: ':q.kind==='write'?'Escribe el latinismo: ':'¿Qué latinismo significa…? ',q.kind==='pau'||q.kind==='meaning'?term(q.item):q.kind==='context'?q.prompt:meaning(q.item));
 $('options').replaceChildren();$('feedback').textContent='';$('explanation').replaceChildren();$('next').hidden=true;$('submit').disabled=false;$('submit').textContent=q.kind==='pau'?'Ver solución orientativa':'Comprobar';
 if(q.kind==='pau'){for(const [name,labelText] of [['meaning','Significado'],['sentence','Oración propia']]){const label=el('label',labelText),input=el('textarea');input.name=name;input.required=true;input.rows=3;label.append(input);$('options').append(label);}}else if(q.kind==='write'){const input=el('input');input.type='text';input.name='response';input.required=true;input.setAttribute('aria-label','Escribe el latinismo');input.autocapitalize='off';input.spellcheck=false;$('options').append(input);}else for(const o of q.options){const label=el('label',null,'choice'),input=el('input');input.type='radio';input.name='response';input.value=String(o.id);input.required=true;const option=items.find(i=>i.number===o.id);label.append(input,q.kind==='meaning'?meaning(option):term(option));$('options').append(label);}
 $('question').focus();
}
$('answer').addEventListener('submit',event=>{event.preventDefault();if(!q||answered)return;const formData=new FormData($('answer'));if(q.kind==='pau'){if(!String(formData.get('meaning')??'').trim()||!String(formData.get('sentence')??'').trim())return;answered=true;const p=el('p');p.append(term(q.item),' — ',meaning(q.item));const list=el('ol');for(const c of q.item.contexts){const li=el('li');li.append(sentence(q.item,c));list.append(li);}$('explanation').append(p,list);for(const input of $('options').querySelectorAll('textarea'))input.readOnly=true;$('submit').disabled=true;$('feedback').textContent='Solución orientativa. Revisa tus dos respuestas.';$('self-review').hidden=false;$('self-correct').focus();return;}const value=formData.get('response');if(!String(value??'').trim())return;answered=true;const correct=check(q,value);if(correct)score++;record(state,q.item.number,correct);persist();stats();$('feedback').replaceChildren(correct?'Correcto.':'Incorrecto. Respuesta: ');if(!correct)$('feedback').append(q.kind==='meaning'?meaning(q.item):term(q.item));const p=el('p');p.append(term(q.item),' — ',meaning(q.item));const example=el('p');example.append(sentence(q.item,q.context));$('explanation').append(p,example);for(const input of $('options').querySelectorAll('input'))input.disabled=true;$('submit').disabled=true;$('next').hidden=false;$('next').focus();});
function selfReview(correct){if(!answered||reviewed||q?.kind!=='pau')return;reviewed=true;if(correct)score++;recordSelf(state,q.item.number,correct);persist();stats();$('self-review').hidden=true;$('next').hidden=false;$('next').focus();}
$('self-correct').addEventListener('click',()=>selfReview(true));$('self-wrong').addEventListener('click',()=>selfReview(false));
$('next').addEventListener('click',()=>{if(!answered||(q?.kind==='pau'&&!reviewed))return;position++;show();});
stats();cards();
if('serviceWorker'in navigator&&window.isSecureContext)navigator.serviceWorker.register('./sw.js',{scope:'./'}).catch(()=>{});
