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
    ";if($('corpus').value==='all')$('scope').textContent='Practica juntos General y Examen. Cada ficha muestra sus unidades por modalidad; las acepciones distintas permanecen separadas.';update()}\nfunction dictionary",
    'descripción del corpus Todo');
  js=once(js,
    "<small>${esc(e.units.join(' · '))}</small>",
    "<small>${esc(scholaVocabularyProvenance(e))}</small>",
    'fuente visible en el diccionario');
  js=once(js,
    "${esc(e.units.filter(u=>s.units.includes(u)).join(' · '))}",
    "${esc(scholaVocabularyProvenance(e,s.units))}",
    'fuente visible en los ejercicios');
  js=once(js,
    "const p=progress[e.id]||{total:0,right:0,failed:false};p.total++;p.right+=Number(ok);p.failed=!ok;progress[e.id]=p;",
    "scholaVocabularyRecordProgress(progress,e,ok);",
    'conservación de claves de progreso');
  return js;
}
export function adaptVocabulaAllHtml(html){
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
    'Las palabras repetidas se presentan una sola vez y conservan sus unidades y acepciones.',
    'En Todo el vocabulario las fichas idénticas se muestran una sola vez, con unidades diferenciadas por modalidad. Las acepciones distintas siguen separadas.',
    'ayuda de fichas combinadas');
  const app='<script src="app.js?v=20261113-alumnos1" defer></script>';
  html=once(html,app,'<script src="schola-all.js" defer></script>'+app,
    'orden de scripts');
  return html;
}
export function adaptVocabulaAllReport(js){
  return once(js,
    "mode:$('corpus').value,units:[...$('units')",
    "mode:$('corpus').value==='all'?'general':$('corpus').value,units:[...$('units')",
    'avisos sin entrada en modo Todo');
}
export async function adaptVocabulaAll(destination,root){
  const source=await readFile(join(root,'scripts/vocabula-all-model.mjs'),'utf8');
  assert.ok(source.startsWith('// Vista combinada'));
  assert.equal((source.match(/^export /gmu)||[]).length,6,
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
