import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { annotateDirect, auditImport, CODE_RULES, key } from '../tools/import-generador.mjs';
import { validationErrors,checkResult,checkAllChanges,newCardState } from '../src/engine.mjs';
const dataset=JSON.parse(readFileSync(new URL('../data/pilot.json',import.meta.url),'utf8'));
const sample=(id,latin,castellano,normas,tipoTransmision='ADAPTACION_CULTA')=>({id,latin,castellano,normas,estado:'APTO_PROPUESTO',tipoTransmision,fila_origen:100,lote:20});
test('Coincidencias gráficas griegas automáticas con spans originales',()=>{
 const examples=[
 ['g1','athletam','atleta',['N10']],['g2','blasphemiam','blasfemia',['N10']],
 ['g3','Chimæram','quimera',['N10','N12']],['g4','sphæram','esfera',['N10','N12','N14']],
 ['g5','Phœbum','Febo',['N10','N12']],['g6','crystallinum','cristalino',['N10','N15']],
 ['g7','theoriam','teoría',['N10']],['g8','Chaldæam','Caldea',['N10','N12']],
 ['g9','architectum','arquitecto',['N10']],['g10','gryphum','grifo',['N10']]
 ];
 for(const [id,latin,spanish,rules] of examples){
  const actual=annotateDirect(sample(id,latin,spanish,rules));
  assert.equal(actual.status,'auto_aligned',`${latin}: ${JSON.stringify(actual).slice(0,150)}`);
  assert.deepEqual(validationErrors({version:1,words:[actual.word]}),[],latin);
 }
});
test('Sencillas reglas patrimoniales, abertura y caída -m no se pierden',()=>{
 for(const [id,latin,spanish,rules] of [
  ['a1','vitam','vida',['N17']],['a2','rapum','rabo',['N17']],
  ['a3','angustum','angosto',['N01']],['a4','cistam','cesta',['N01']],
  ['a5','pĕrnam','pierna',['N07']],['a6','pŏrcum','puerco',['N07']]
 ]){
  const a=annotateDirect(sample(id,latin,spanish,rules,null));
  assert.equal(a.status,'auto_aligned',latin+' '+a.reason);
  assert.deepEqual(validationErrors({version:1,words:[a.word]}),[],latin);
 }
});
test('No inventa evoluciones ni admite palabras sin anotación unívoca',()=>{
 const bad=annotateDirect(sample('bad','maxillam','mejilla',['N13'],null));
 assert.notEqual(bad.status,'auto_aligned');
 assert.notEqual(annotateDirect(sample('x','scrinium','escriño',['N14'],null)).status,'auto_aligned');
 assert.equal(annotateDirect({...sample('x','indem','ende',['N01'],null),estado:'REVISAR'}).status,'invalid_source');
});
test('Conserva fuente, conflictos y no altera anteriores',()=>{
 const base=dataset.words.slice(0,282);const orig=JSON.stringify(dataset.words);const src={esquema:'evoluciones-latin-castellano/v1',items:[sample('t1','lupum','lobo',['N01','N17'],null),sample('t2','vitam','vida',['N17'],null)]};
 const audit=auditImport(src,{version:1,words:base});
 assert.equal(audit.overlap.length,1);assert.equal(audit.accepted.length,1);
 assert.equal(JSON.stringify(dataset.words),orig);
 assert.deepEqual(validationErrors({version:1,words:[...base,...audit.accepted]}),[]);
});
