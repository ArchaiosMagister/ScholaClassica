'use strict';
// Huellas tomadas de las listas docentes originales. No sustituyen una revisión
// semántica ni acreditan por sí solas todas las acepciones o flexiones.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const source=JSON.parse(fs.readFileSync(path.join(root,'tests/fixtures/vocabulary-provenance.json'),'utf8'));
const raw=fs.readFileSync(path.join(root,'data.js'),'utf8');
assert.ok(raw.startsWith('window.VOCAB='),'El banco de vocabulario cambió de formato.');
const entries=JSON.parse(raw.replace(/^window\.VOCAB\s*=\s*/,'').replace(/;\s*$/,''));
function lemma(form){
 return String(form).split(':')[0].split(/[,+(]/)[0].toLowerCase()
   .replace(/æ/g,'ae').replace(/œ/g,'oe').replace(/ς/g,'σ')
   .normalize('NFD').replace(/\p{M}/gu,'').trim().replace(/\s+/g,' ');
}
function fingerprint(keys){
 let hash=2166136261>>>0;
 const line=[...new Set(keys)].sort().join('|');
 // FNV-1a en unidades UTF-16, idéntico para las listas cotejadas.
 for(let i=0;i<line.length;i++){hash^=line.charCodeAt(i);hash=Math.imul(hash,16777619)>>>0;}
 return hash.toString(16).padStart(8,'0');
}
// Conservar el cotejo con el DOCX, pero admitir solo excepciones documentadas
// en las que el enunciado docente sea filológicamente erróneo.
const exceptions=new Map();
for(const fix of source.authorizedHeadwordCorrections||[]){
 assert.ok(!exceptions.has(fix.id),'Excepción de procedencia duplicada: '+fix.id);
 const entry=entries.find(e=>e.id===fix.id);
 assert.ok(entry,'Falta la ficha corregida: '+fix.id);
 assert.equal(entry.subject,fix.subject);
 assert.equal(entry.mode,fix.mode);
 assert.ok(entry.units.includes(fix.unit),'Unidad original perdida: '+fix.id);
 assert.equal(entry.form,fix.correctedForm,'Se ha revertido un lema corregido: '+fix.id);
 assert.equal(lemma(entry.form),fix.correctedLemma);
 assert.ok(entry.originals.some(o=>o.startsWith(fix.sourceForm+':')),
  'Se ha borrado la transcripción del Word original: '+fix.id);
 exceptions.set(fix.id,fix);
}
const rows=new Map();
for(const e of entries){
 if(!Array.isArray(e.units))throw Error('Unidades no válidas: '+e.id);
 for(const unit of e.units){
  const key=e.subject+'/'+e.mode+'/'+unit;
  if(!rows.has(key))rows.set(key,new Set());
  const fix=exceptions.get(e.id);
  rows.get(key).add(fix&&fix.unit===unit?fix.sourceLemma:lemma(e.form));
 }
}
const checked=new Set();
for(const item of source.checks){
 assert.ok(!checked.has(item.key),'Control duplicado: '+item.key);checked.add(item.key);
 const actual=rows.get(item.key)||new Set();
 assert.equal(actual.size,item.count,'Número de lemas no coincide con el documento: '+item.key);
 assert.equal(fingerprint([...actual]),item.fnv32,'Lemas o unidades diferentes del Word original: '+item.key);
}
for(const [key] of rows){
 const mode=key.split('/').slice(0,2).join('/');
 if(mode!=='lat2/general'&&mode!=='lat2/examen'&&mode!=='gr1/general'){
  assert.ok(checked.has(key),'Grupo no acreditado por los documentos originales: '+key);
 }
}
const greek=entries.filter(e=>e.subject==='gr1'&&e.mode==='general');
// El Word alfabético de Griego general se coteja con sus lecturas originales,
// incluso si el lema operativo se ha corregido tras una auditoría ática.
const greekKeys=[...new Set(greek.map(e=>{
 const correction=exceptions.get(e.id);
 return correction?correction.sourceLemma:lemma(e.form);
}))];
assert.equal(greekKeys.length,source.greekGeneralAlphabetical.count,
 'Vocabulario alfabético griego incompleto o aumentado sin revisión');
assert.equal(fingerprint(greekKeys),source.greekGeneralAlphabetical.fnv32,
 'No coincide el conjunto de lemas del Griego general con el archivo alfabético');

// Las unidades acreditadas se atribuyen por coincidencia ENTRE DOCUMENTOS
// ORIGINALES, no por una grafía enmendada posteriormente. Si al corregir
// κυνδύνος→κίνδυνος aparece un nuevo parecido con la lista de examen, NO
// se asigna automáticamente esa unidad a la fuente alfabética.
const historicalLemma=e=>exceptions.get(e.id)?.sourceLemma||lemma(e.form);
const exam=new Map();
for(const e of entries.filter(x=>x.subject==='gr1'&&x.mode==='examen')){
 const k=historicalLemma(e);
 if(!exam.has(k))exam.set(k,new Set());
 for(const unit of e.units)exam.get(k).add(unit);
}
let accredited=0,unattributed=0;
for(const e of greek){
 const proven=exam.get(historicalLemma(e))||new Set();
 const unresolved=e.units.includes('Sin unidad acreditada');
 if(unresolved){unattributed++;assert.equal(e.units.length,1,'No mezclar una unidad no acreditada con otras: '+e.form);
  assert.equal(proven.size,0,'Falta vincular un lema griego con su unidad acreditada: '+e.form);
 }else{
  accredited++;
  assert.ok(e.units.length>0&&e.units.every(x=>proven.has(x)),'Griego general atribuido a unidad incorrecta: '+e.form);
 }
}
for(const missing of source.knownSourceWithoutMeaning){
 const hits=entries.filter(e=>e.subject===missing.subject&&e.mode===missing.mode&&
  lemma(e.form)===missing.headword&&e.units.includes(missing.unit));
 assert.ok(hits.length,'La entrada sin traducción local no se ha vinculado: '+missing.headword+' '+missing.unit);
 assert.ok(hits.every(e=>Array.isArray(e.answers)&&e.answers.length>0),
  'No presentar palabras sin traducción acreditada: '+missing.headword);
}
console.log('OK procedencia: '+source.checks.length+' listas de unidades y el léxico alfabético de Griego I.');
console.log('Griego general: '+accredited+' entradas con unidad acreditada; '+unattributed+' sin adscripción individual.');
console.log('Las listas originales de Latín II no están disponibles: sin certificación filológica.');
