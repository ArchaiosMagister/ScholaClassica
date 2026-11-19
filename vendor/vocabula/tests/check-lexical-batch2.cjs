'use strict';
// Segunda tanda de verificación filológica, preservando los seis Word docentes
// como fuente, incluso cuando se corrige una errata de su transcripción.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const raw=fs.readFileSync(path.join(root,'data.js'),'utf8');
const entries=JSON.parse(raw.replace(/^window\.VOCAB\s*=\s*/,'').replace(/;\s*$/,''));
const fixture=JSON.parse(fs.readFileSync(path.join(root,'tests/fixtures/lexical-reviewed-batch2.json'),'utf8'));
const later=JSON.parse(fs.readFileSync(path.join(root,'tests/fixtures/lexical-reviewed-batch3.json'),'utf8'));
// La segunda tanda es histórica: las aclaraciones posteriores han de estar
// registradas y no pueden borrar un lema, una unidad o una acepción antigua.
const laterById=new Map(later.entries.map(e=>[e.id,e]));
assert.equal(fixture.schema,1);
assert.equal(entries.length,2055);
assert.equal(fixture.entries.length,24,'La segunda tanda no debe perder fichas validadas');
const byId=new Map(entries.map(e=>[e.id,e]));
assert.equal(byId.size,entries.length,'ID duplicado');
const reviewed=new Set();
for(const item of fixture.entries){
 assert.ok(!reviewed.has(item.id),'Revisión duplicada: '+item.id);
 reviewed.add(item.id);
 const entry=byId.get(item.id);
 assert.ok(entry,'Ficha desaparecida: '+item.id);
 const revised=laterById.get(item.id);
 if(revised){
  assert.equal(revised.category,'case-dependent-gloss','No es una revisión de régimen acreditada: '+item.id);
  for(const field of ['subject','mode','form']){
   assert.equal(revised[field],item[field],'Cambio del lema histórico no autorizado: '+item.id);
   assert.equal(entry[field],item[field],field+' revertido: '+item.id);
  }
  assert.equal(revised.original,item.original,'Se modificó la fuente histórica: '+item.id);
  assert.deepEqual(revised.units,item.units,'Cambio de unidad desde la tanda anterior: '+item.id);
  assert.deepEqual(entry.units,item.units,'Unidad del lema alterada: '+item.id);
  for(const answer of item.answers)assert.ok(revised.answers.includes(answer),
   'Se ha descartado una respuesta de la tanda anterior: '+answer+' ('+item.id+')');
  assert.equal(entry.meaning,revised.meaning,'Nueva explicación por casos revertida: '+item.id);
  assert.deepEqual(entry.answers,revised.answers,'Respuestas por régimen diferentes de la última revisión: '+item.id);
 }else{
  for(const field of ['subject','mode','form','meaning']){
   assert.equal(entry[field],item[field],field+' distinto del revisado: '+item.id);
  }
  assert.deepEqual(entry.units,item.units,'Se alteraron las unidades durante la corrección: '+item.id);
  assert.deepEqual(entry.answers,item.answers,'Se alteraron los sinónimos verificados: '+item.id);
 }
 assert.ok(entry.originals.includes(item.original),'Se perdió el original del Word: '+item.id);
 assert.ok(['latin-headword','latin-principal-parts','latin-conjugation',
  'greek-orthography','greek-accepted-synonym'].includes(item.category),'Categoría desconocida');
 if(item.source)assert.match(item.source,/^https:\/\//,'Fuente sin URL HTTPS');
}
const byForm=(subject,mode,form)=>entries.find(e=>e.subject===subject&&e.mode===mode&&e.form===form);
assert.ok(byForm('lat1','general','sol, solis (m.)')?.units.includes('UD 7'));
assert.ok(!entries.some(e=>e.subject==='lat1'&&/^(?:solis,|cognosco, cognovit|maneo, manui|moveo, movi, movitum|peto, petivi, petitium)/.test(e.form)),
 'Persisten enunciados latinos erróneos');
assert.ok(!entries.some(e=>e.subject==='gr1'&&/^[ὐ]/u.test(e.form)),
 'Se ha conservado un espíritu suave no válido en upsilon inicial');
const greek=fixture.entries.filter(e=>e.category==='greek-accepted-synonym');
assert.equal(greek.length,7);
for(const item of greek){
 assert.ok(item.answers.length>1,'Falta una equivalencia legítima: '+item.form);
}
const toN=s=>String(s).toLowerCase().normalize('NFD').replace(/\p{M}/gu,'').trim();
const context=vm.createContext({accepted:e=>e.answers.map(toN)});
const choice=fs.readFileSync(path.join(root,'choice.js'),'utf8');
vm.runInContext(choice+'\nthis.conflict=choiceConflicts;this.info=choiceInfo;',context);
for(const [subject,formA,formB] of [
 ['gr1','οἰκέω','οἰκέω'],
 ['gr1','ἄρχων, –οντος (ὁ)','ἄρχων, −οντος (ὁ)']]){
 const general=entries.find(e=>e.subject===subject&&e.mode==='general'&&e.form===formA);
 const exam=entries.find(e=>e.subject===subject&&e.mode==='examen'&&e.form===formB);
 assert.ok(general&&exam,'Par griego no localizado');
 assert.ok(context.conflict(general,exam,context.info(general),context.info(exam)),
  'No pueden presentarse traducciones sinónimas como distractores entre sí');
}
console.log('OK segunda tanda: '+fixture.entries.length+' fichas auditadas, 11 latinas y 13 griegas, con 7 equivalencias ampliadas.');
