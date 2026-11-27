import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {join} from 'node:path';

// Adaptador limitado a la COPIA en dist de ScholaClassica.
// El banco original, los dos corpus existentes y sus unidades no cambian.
function once(s,from,to,label){
  assert.equal(s.split(from).length,2,
    'Vocabula cambió '+label+': revisar antes de publicar');
  return s.replace(from,to);
}
export function adaptVocabulaAllApp(js){
  js=once(js,
    ".replace(/[‘’'“”.,;:!?¿¡]/g,'')",
    ".replace(/…|\\.{3,}/g,' ').replace(/[‘’'“”.,;:!?¿¡]/g,'')",
    'normalización de los puntos suspensivos');
  js=once(js,
    "function entryNotesHTML(e){return (e.usage?",
    "function entryNotesHTML(e){const scholaNote=scholaVocabularyEditorialNote(e);return (scholaNote?`<p class=\\\"small\\\">${esc(scholaNote)}</p>`:'')+(e.usage?",
    'anotación filológica visible tras revelar respuesta');
  js=once(js,
    "function base(){return VOCAB.filter(e=>e.subject===$('subject').value&&e.mode===$('corpus').value)}",
    "function base(){return $('corpus').value==='all'?scholaVocabularyAll(VOCAB,$('subject').value):VOCAB.filter(e=>e.subject===$('subject').value&&e.mode===$('corpus').value)}",
    'lista por modalidad');
  js=once(js,
    "function selected(){return vocabularyForScope(VOCAB,$('subject').value,$('corpus').value,selectedUnits())}",
    "function selected(){return $('corpus').value==='all'?scholaVocabularyAll(VOCAB,$('subject').value,selectedUnits()):vocabularyForScope(VOCAB,$('subject').value,$('corpus').value,selectedUnits())}",
    'diccionario');
  js=once(js,
    "function filtered(){return vocabularyForScope(VOCAB,$('subject').value,$('corpus').value,selectedUnits(),$('errors').checked?progress:null)}",
    "function filtered(){return $('corpus').value==='all'?scholaVocabularyAll(VOCAB,$('subject').value,selectedUnits(),$('errors').checked?progress:null):vocabularyForScope(VOCAB,$('subject').value,$('corpus').value,selectedUnits(),$('errors').checked?progress:null)}",
    'práctica y repaso');
  const oldStats="function stats(){const ids=new Set(base().map(e=>e.id)),p=Object.entries(progress).filter(([id])=>ids.has(id)).map(([,v])=>v);$('learned').textContent=p.length;let total=p.reduce((a,v)=>a+v.total,0);$('accuracy').textContent=total?Math.round(p.reduce((a,v)=>a+v.right,0)/total*100)+'%':'—';$('pending').textContent=p.filter(v=>v.failed).length}";
  const newStats="function stats(){if($('corpus').value==='all'){const t=scholaVocabularyProgress(base(),progress);$('learned').textContent=t.learned;$('accuracy').textContent=t.accuracy;$('pending').textContent=t.pending;return}const ids=new Set(base().map(e=>e.id)),p=Object.entries(progress).filter(([id])=>ids.has(id)).map(([,v])=>v);$('learned').textContent=p.length;let total=p.reduce((a,v)=>a+v.total,0);$('accuracy').textContent=total?Math.round(p.reduce((a,v)=>a+v.right,0)/total*100)+'%':'—';$('pending').textContent=p.filter(v=>v.failed).length}";
  js=once(js,oldStats,newStats,'estadísticas por corpus');
  js=once(js,";update()}\nfunction dictionary",
    ";$('scope').textContent=scholaVocabularyScopeDescription($('subject').value,$('corpus').value,$('scope').textContent);update()}\nfunction dictionary",
    'descripción del corpus Todo');
  js=once(js,
    "let units=[...new Set(base().flatMap(e=>e.units))].sort((a,b)=>a.localeCompare(b,'es',{numeric:true}));$('units').innerHTML=units.map",
    "let units=[...new Set(base().flatMap(e=>e.units))].sort((a,b)=>a.localeCompare(b,'es',{numeric:true}));$('schola-lat4-extra').hidden=$('subject').value!=='lat4';units=scholaVocabularyVisibleUnits($('subject').value,units,$('schola-lat4-extra-enabled').checked);$('units').innerHTML=units.map",
    'ocultar ampliación hasta que se solicite en Latín de 4.º');
  js=once(js,
    "${esc(u)}</label>",
    "${esc(scholaVocabularyUnitCaption($('subject').value,u))}</label>",
    'etiqueta legible del selector sin cambiar valor de unidad');
  js=once(js,
    "<small>${esc(e.units.join(' · '))}</small>",
    "<small>${esc(scholaVocabularyProvenance(e))}</small>",
    'fuente visible en el diccionario');
  js=once(js,
    "${esc(e.units.filter(u=>s.units.includes(u)).join(' · '))}",
    "${esc(scholaVocabularyProvenance(e,s.units))}",
    'fuente visible en los ejercicios');
  js=once(js,
    "$('subject').onchange=()=>{invalidateSession();setup()};",
    "$('subject').onchange=()=>{$('schola-lat4-extra-enabled').checked=false;invalidateSession();setup()};$('schola-lat4-extra-enabled').onchange=()=>{const keep=selectedUnits();invalidateSession();setup(keep)};",
    'ocultar ampliación al cambiar de curso y actualizar selección sin perder historial');
  js=once(js,
    "const p=progress[e.id]||{total:0,right:0,failed:false};p.total++;p.right+=Number(ok);p.failed=!ok;progress[e.id]=p;",
    "scholaVocabularyRecordProgress(progress,e,ok);",
    'conservación de claves de progreso');
  return js;
}
export function adaptVocabulaAllHtml(html){
  html=once(html,
    '<div class="unithead"><label id="unit-label">Unidades</label>',
    '<div id="schola-lat4-extra" hidden><label class="check" for="schola-lat4-extra-enabled"><input id="schola-lat4-extra-enabled" type="checkbox"> Mostrar ampliación · UD9 y UD10 (opcional)</label></div><div class="unithead"><label id="unit-label">Unidades</label>',
    'acceso explícito a unidades complementarias');
  html=once(html,
    '<option value="examen">Sólo de examen</option></select>',
    '<option value="examen">Sólo de examen</option><option value="all">Todo el vocabulario</option></select>',
    'selector de corpus');
  html=once(html,
    'Selecciona asignatura, general o examen y marca explícitamente',
    'Selecciona asignatura, General, Examen o Todo el vocabulario y marca explícitamente',
    'ayuda al alumnado');
  html=once(html,
    'Al cambiar de asignatura se desmarcan las unidades; al pasar entre General y Examen sólo se conservan las que coincidan.',
    'Al cambiar de asignatura se desmarcan las unidades; al pasar entre General, Examen y Todo solo se conservan las que coincidan.',
    'ayuda de cambio de corpus');
  html=once(html,
    'El botón Todas incluye también los grupos sin unidad específica.',
    'El botón Todas selecciona los grupos visibles, incluidos los complementarios cuando se muestran. En Latín de 4.º, las UD9 y UD10 solo aparecen si activas Mostrar ampliación.',
    'alcance del botón Todas');
  html=once(html,
    'Las palabras repetidas se presentan una sola vez y conservan sus unidades y acepciones.',
    'En Todo el vocabulario las fichas idénticas se muestran una sola vez, con unidades diferenciadas por modalidad. Las acepciones distintas siguen separadas.',
    'ayuda de fichas combinadas');
  const app='<script src="app.js?v=20261113-alumnos1" defer></script>';
  html=once(html,app,'<script src="schola-all.js" defer></script>'+app,
    'orden de scripts');
  return html;
}
export function adaptVocabulaAllReport(js){
  // La API original solo admite General o Examen. El contexto combinado se
  // añade al texto del aviso: nunca se finge una tercera modalidad en Supabase.
  js=once(js,
    "reportContext=entry?{subject:entry.subject,mode:entry.mode,units:[...entry.units],entry_id:entry.id,entry_form:entry.form}:{subject:$('subject').value,mode:$('corpus').value,units:[...$('units').querySelectorAll('input:checked')].map(x=>x.value),entry_id:'',entry_form:''};const c=reportContext;",
    "reportContext=scholaVocabularyReportContext(entry,$('subject').value,$('corpus').value,selectedUnits());const c=reportContext;",
    'contexto de ficha y selección');
  // El diccionario combinaba la ficha, pero el aviso recuperaba un registro
  // original por ID y perdía sus otras procedencias. Priorizar la ficha visible.
  js=once(js,
    'openReport(VOCAB.find(entry=>entry.id===button.dataset.reportId));',
    'openReport(selected().find(entry=>entry.id===button.dataset.reportId)||VOCAB.find(entry=>entry.id===button.dataset.reportId));',
    'fuente completa del aviso en el diccionario');
  js=once(js,'esc(modeLabel(c.subject,c.mode))',
    "esc(c.scholaMode==='all'?'Todo el vocabulario':modeLabel(c.subject,c.mode))",
    'modalidad visible en el formulario');
  js=once(js,
    " $('report-dialog').showModal();$('report-message').focus();}",
    " $('report-message').maxLength=scholaVocabularyReportMaxLength(c);$('report-dialog').showModal();$('report-message').focus();}",
    'límite seguro del mensaje con procedencia');
  return js;
}
export async function adaptVocabulaAll(destination,root){
  const source=await readFile(join(root,'scripts/vocabula-all-model.mjs'),'utf8');
  assert.ok(source.startsWith('// Vista combinada'));
  assert.equal((source.match(/^export /gmu)||[]).length,13,
    'Cambió la interfaz del modelo');
  const classic="'use strict';\n"+source.replace(/^export /gmu,'');
  await writeFile(join(destination,'schola-all.js'),classic);
  for(const [path,transform] of [
    ['index.html',adaptVocabulaAllHtml],
    ['app.js',adaptVocabulaAllApp],
    ['teacher.js',adaptVocabulaAllReport]
  ]){
    const file=join(destination,path);
    const previous=await readFile(file,'utf8');
    await writeFile(file,transform(previous));
  }
  console.log('Vocabula: corpus Todo disponible solo en ScholaClassica, listas originales intactas.');
}
