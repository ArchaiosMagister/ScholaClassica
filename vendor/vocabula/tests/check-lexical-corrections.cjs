'use strict';
// Regresión filológica: las correcciones son explícitas y preservan la fuente.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const raw=fs.readFileSync(path.join(root,'data.js'),'utf8');
const data=JSON.parse(raw.replace(/^window\.VOCAB\s*=\s*/,'').replace(/;\s*$/,''));
const review=JSON.parse(fs.readFileSync(path.join(root,'tests/fixtures/lexical-reviewed-corrections.json'),'utf8'));
assert.equal(review.schema,1);
assert.equal(data.length,2055,'Número inesperado de fichas; revisar importación');
const byId=new Map();
for(const entry of data){
 assert.ok(!byId.has(entry.id),'Identificador duplicado: '+entry.id);
 byId.set(entry.id,entry);
 assert.ok(entry.subject&&entry.mode&&entry.units.length,'Ficha sin adscripción: '+entry.id);
 assert.ok(entry.originals.length,'Falta procedencia original: '+entry.id);
}
const seen=new Set();
for(const item of review.entries){
 assert.ok(!seen.has(item.id),'Corrección duplicada: '+item.id);
 seen.add(item.id);
 const entry=byId.get(item.id);
 assert.ok(entry,'Ficha revisada desaparecida: '+item.id);
 for(const field of ['subject','mode','form','meaning']){
  assert.equal(entry[field],item[field],field+' modificado sin revisión: '+item.id);
 }
 assert.deepEqual(entry.answers,item.answers,'Respuestas modificadas sin revisión: '+item.id);
 assert.ok(entry.originals.includes(item.original),'La transcripción histórica ha sido modificada: '+item.id);
 assert.ok(entry.units.length,'Unidad perdida: '+item.id);
 if(item.source)assert.ok(/^https:\/\//.test(item.source),'Fuente externa inválida: '+item.id);
}
assert.ok(review.entries.length>=13,'Falta alguna corrección auditada');
for(const e of data){
 if(e.subject!=='lat1')continue;
 for(const answer of e.answers){
  assert.ok(!/[æœ]/i.test(answer),'Hay una ligadura en la traducción española: '+e.form);
  assert.ok(!/aporximadamente/i.test(answer),'Errata ortográfica en la respuesta: '+e.form);
 }
}
const lookup=(s,m,stem)=>data.find(e=>e.subject===s&&e.mode===m&&e.form.startsWith(stem));
assert.ok(!lookup('lat1','general','dux,').answers.includes('conducir'),
 'Un sustantivo no puede aceptar como respuesta el infinitivo de otro lema');
assert.ok(!lookup('lat1','general','confero,').answers.includes('refugiarse'),
 'No confundir el verbo con un uso reflexivo contextual');
console.log('OK revisión filológica: '+review.entries.length+' fichas corregidas, '+data.length+' conservadas y originales preservados.');
